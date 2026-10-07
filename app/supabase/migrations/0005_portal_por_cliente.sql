-- ============================================================================
-- METIS · 0005 · Portal por cliente (aislamiento reforzado) + persistencia real
-- Requiere 0001–0004.
--
-- 1. Perfil de empresa: logo, color, estado.
-- 2. Candados de consistencia: ninguna fila puede apuntar a datos de OTRA empresa
--    (p. ej. un resultado de la empresa A ligado a un KPI de la empresa B).
-- 3. Permisos de escritura más estrictos dentro de la empresa (INSERT incluido).
-- 4. Consola METIS (platform admins): dar de alta clientes y entrar a su portal.
-- 5. Realtime: los cambios de un usuario se reflejan en el portal de sus compañeros.
-- Es idempotente: se puede correr más de una vez.
-- ============================================================================

-- ---------------------------------------------------------- 1. empresa ---
alter table metis.tenants
  add column if not exists logo_url    text,
  add column if not exists brand_color text,
  add column if not exists status      text not null default 'active';
do $$ begin
  alter table metis.tenants add constraint tenants_status_chk check (status in ('active','trial','suspended'));
exception when duplicate_object then null; end $$;

-- Códigos internos automáticos (la app no obliga a capturarlos).
alter table metis.objectives alter column code set default ('OBJ-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)));
alter table metis.laes       alter column code set default ('LAE-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)));
alter table metis.elements   alter column code set default ('E-'   || upper(substr(md5(gen_random_uuid()::text), 1, 6)));

-- Periodo bimestral (la app lo ofrece).
alter type metis.period add value if not exists 'bimonthly';

-- -------------------------------------------- 2. candados entre empresas ---
-- ¿El usuario es miembro (activo o no) de esa empresa?
create or replace function metis.is_member_of(p_tenant uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = metis, public as $$
  select exists (select 1 from metis.memberships where tenant_id = p_tenant and user_id = p_user);
$$;

-- Trigger genérico. Argumentos en pares: columna, destino.
--   destino = nombre de tabla con tenant_id   → la fila referida debe ser de la misma empresa
--   destino = '@member'                       → el usuario referido debe ser miembro de la empresa
create or replace function metis.assert_same_tenant()
returns trigger language plpgsql security definer set search_path = metis, public as $$
declare
  i int := 0; col text; target text; ref uuid; ref_tenant uuid; row_tenant uuid;
  j jsonb := to_jsonb(new);
begin
  row_tenant := (j->>'tenant_id')::uuid;
  while i < tg_nargs loop
    col := tg_argv[i]; target := tg_argv[i + 1]; i := i + 2;
    ref := nullif(j->>col, '')::uuid;
    continue when ref is null;
    if target = '@member' then
      if not metis.is_member_of(row_tenant, ref) then
        raise exception 'cross_tenant: % no pertenece a esta empresa', col using errcode = '42501';
      end if;
    else
      execute format('select tenant_id from metis.%I where id = $1', target) into ref_tenant using ref;
      if ref_tenant is distinct from row_tenant then
        raise exception 'cross_tenant: % apunta a otra empresa', col using errcode = '42501';
      end if;
    end if;
  end loop;
  return new;
end $$;

drop trigger if exists trg_tenant_guard on metis.laes;
create trigger trg_tenant_guard before insert or update on metis.laes
  for each row execute function metis.assert_same_tenant('objective_id', 'objectives');
drop trigger if exists trg_tenant_guard on metis.scopes;
create trigger trg_tenant_guard before insert or update on metis.scopes
  for each row execute function metis.assert_same_tenant('scope_type_id', 'scope_types', 'parent_id', 'scopes');
drop trigger if exists trg_tenant_guard on metis.elements;
create trigger trg_tenant_guard before insert or update on metis.elements
  for each row execute function metis.assert_same_tenant('lae_id', 'laes', 'unit_id', 'units');
drop trigger if exists trg_tenant_guard on metis.element_scopes;
create trigger trg_tenant_guard before insert or update on metis.element_scopes
  for each row execute function metis.assert_same_tenant('element_id', 'elements', 'scope_id', 'scopes', 'owner_user_id', '@member');
drop trigger if exists trg_tenant_guard on metis.scorecards;
create trigger trg_tenant_guard before insert or update on metis.scorecards
  for each row execute function metis.assert_same_tenant('user_id', '@member', 'approver_id', '@member');
drop trigger if exists trg_tenant_guard on metis.scorecard_items;
create trigger trg_tenant_guard before insert or update on metis.scorecard_items
  for each row execute function metis.assert_same_tenant('scorecard_id', 'scorecards', 'element_scope_id', 'element_scopes');
drop trigger if exists trg_tenant_guard on metis.scorecard_events;
create trigger trg_tenant_guard before insert or update on metis.scorecard_events
  for each row execute function metis.assert_same_tenant('scorecard_id', 'scorecards');
drop trigger if exists trg_tenant_guard on metis.results;
create trigger trg_tenant_guard before insert or update on metis.results
  for each row execute function metis.assert_same_tenant('element_scope_id', 'element_scopes');
drop trigger if exists trg_tenant_guard on metis.memberships;
create trigger trg_tenant_guard before insert or update on metis.memberships
  for each row execute function metis.assert_same_tenant('manager_id', '@member', 'scope_id', 'scopes');
drop trigger if exists trg_tenant_guard on metis.invitations;
create trigger trg_tenant_guard before insert or update on metis.invitations
  for each row execute function metis.assert_same_tenant('manager_id', '@member');
drop trigger if exists trg_tenant_guard on metis.commitments;
create trigger trg_tenant_guard before insert or update on metis.commitments
  for each row execute function metis.assert_same_tenant('element_scope_id', 'element_scopes', 'owner_id', '@member', 'session_id', 'sessions');

-- element_allowed_scope_types no tiene tenant_id: se valida contra el elemento.
create or replace function metis.assert_east_same_tenant()
returns trigger language plpgsql security definer set search_path = metis, public as $$
begin
  if (select tenant_id from metis.elements where id = new.element_id)
     is distinct from (select tenant_id from metis.scope_types where id = new.scope_type_id) then
    raise exception 'cross_tenant: tipo de alcance de otra empresa' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_tenant_guard on metis.element_allowed_scope_types;
create trigger trg_tenant_guard before insert or update on metis.element_allowed_scope_types
  for each row execute function metis.assert_east_same_tenant();

-- ------------------------------------------------ 3. permisos de escritura ---
-- Nadie puede "mudar" una fila a otra empresa.
create or replace function metis.forbid_tenant_change()
returns trigger language plpgsql as $$
begin
  if new.tenant_id is distinct from old.tenant_id then
    raise exception 'cross_tenant: no se puede cambiar la empresa de un registro' using errcode = '42501';
  end if;
  return new;
end $$;
do $$
declare t text;
begin
  foreach t in array array['memberships','objectives','laes','scope_types','scopes','units','elements','element_scopes',
                           'scorecards','scorecard_items','scorecard_events','results','sessions','commitments','invitations','notification_log']
  loop
    execute format('drop trigger if exists trg_forbid_tenant_change on metis.%I', t);
    execute format('create trigger trg_forbid_tenant_change before update on metis.%I for each row execute function metis.forbid_tenant_change()', t);
  end loop;
end $$;

-- ¿Puede editar el scorecard? (dueño, aprobador, jefe directo o admin)
create or replace function metis.can_edit_scorecard(p_scorecard uuid)
returns boolean language sql stable security definer set search_path = metis, public as $$
  select exists (
    select 1 from metis.scorecards s
    where s.id = p_scorecard and (
      s.user_id = auth.uid() or s.approver_id = auth.uid()
      or exists (select 1 from metis.memberships m where m.tenant_id = s.tenant_id and m.user_id = s.user_id and m.manager_id = auth.uid() and m.active)
      or metis.has_role(s.tenant_id, 'owner', 'admin')));
$$;

drop policy if exists scorecards_owner_write on metis.scorecards;
create policy scorecards_owner_write on metis.scorecards for all
  using (tenant_id in (select metis.current_tenant_ids()) and (
         user_id = auth.uid() or approver_id = auth.uid()
         or exists (select 1 from metis.memberships m where m.tenant_id = scorecards.tenant_id and m.user_id = scorecards.user_id and m.manager_id = auth.uid())
         or metis.has_role(tenant_id, 'owner', 'admin')))
  with check (tenant_id in (select metis.current_tenant_ids()) and (
         user_id = auth.uid() or approver_id = auth.uid()
         or exists (select 1 from metis.memberships m where m.tenant_id = scorecards.tenant_id and m.user_id = scorecards.user_id and m.manager_id = auth.uid())
         or metis.has_role(tenant_id, 'owner', 'admin')));

drop policy if exists items_write on metis.scorecard_items;
create policy items_write on metis.scorecard_items for all
  using (tenant_id in (select metis.current_tenant_ids()) and metis.can_edit_scorecard(scorecard_id))
  with check (tenant_id in (select metis.current_tenant_ids()) and metis.can_edit_scorecard(scorecard_id));

drop policy if exists results_owner_write on metis.results;
create policy results_owner_write on metis.results for all
  using (tenant_id in (select metis.current_tenant_ids()) and (
         element_scope_id in (select id from metis.element_scopes es where es.owner_user_id = auth.uid())
         or metis.has_role(tenant_id, 'owner', 'admin')))
  with check (tenant_id in (select metis.current_tenant_ids()) and (
         element_scope_id in (select id from metis.element_scopes es where es.owner_user_id = auth.uid())
         or metis.has_role(tenant_id, 'owner', 'admin')));

drop policy if exists east_admin on metis.element_allowed_scope_types;
create policy east_admin on metis.element_allowed_scope_types for all
  using (element_id in (select id from metis.elements e where metis.has_role(e.tenant_id, 'owner', 'admin')))
  with check (element_id in (select id from metis.elements e where metis.has_role(e.tenant_id, 'owner', 'admin')));

-- ------------------------------------------------------ 4. consola METIS ---
create table if not exists metis.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table metis.platform_admins enable row level security;
drop policy if exists platform_admins_self on metis.platform_admins;
create policy platform_admins_self on metis.platform_admins for select using (user_id = auth.uid());

create or replace function metis.is_platform_admin()
returns boolean language sql stable security definer set search_path = metis, public as $$
  select exists (select 1 from metis.platform_admins where user_id = auth.uid());
$$;

-- Empresas a las que pertenezco (selector de portal).
create or replace function metis.my_tenants()
returns table (tenant_id uuid, name text, slug text, role metis.role, logo_url text, brand_color text)
language sql stable security definer set search_path = metis, public as $$
  select t.id, t.name, t.slug, m.role, t.logo_url, t.brand_color
  from metis.memberships m join metis.tenants t on t.id = m.tenant_id
  where m.user_id = auth.uid() and m.active
  order by t.name;
$$;

-- Lista de clientes para la consola (sólo platform admins). Sólo conteos, no datos del cliente.
create or replace function metis.platform_tenants()
returns table (id uuid, name text, slug text, plan text, status text, join_code text, created_at timestamptz,
               members bigint, scorecards bigint, i_am_member boolean)
language plpgsql stable security definer set search_path = metis, public as $$
begin
  if not metis.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select t.id, t.name, t.slug, t.plan, t.status, t.join_code, t.created_at,
           (select count(*) from metis.memberships m where m.tenant_id = t.id and m.active),
           (select count(*) from metis.scorecards s where s.tenant_id = t.id),
           exists (select 1 from metis.memberships m where m.tenant_id = t.id and m.user_id = auth.uid() and m.active)
    from metis.tenants t order by t.created_at desc;
end $$;

-- Alta de cliente: crea la empresa, opcionalmente me agrega como admin (consultor METIS)
-- e invita al dueño del lado del cliente.
create or replace function metis.create_tenant(p_name text, p_plan text default 'crece', p_owner_email text default null, p_add_me boolean default true)
returns table (tenant_id uuid, join_code text, invitation_token text)
language plpgsql security definer set search_path = metis, public as $$
#variable_conflict use_column
declare
  v_id uuid; v_code text; v_token text; v_slug text; base text; n int := 1; uid uuid := auth.uid();
begin
  if not metis.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'name_required'; end if;
  base := trim(both '-' from regexp_replace(lower(translate(trim(p_name), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')), '[^a-z0-9]+', '-', 'g'));
  if base = '' then base := 'empresa'; end if;
  v_slug := base;
  while exists (select 1 from metis.tenants t where t.slug = v_slug) loop n := n + 1; v_slug := base || '-' || n; end loop;

  insert into metis.tenants (slug, name, plan) values (v_slug, trim(p_name), coalesce(p_plan, 'crece'))
  returning id, join_code into v_id, v_code;

  -- Tipos de alcance base
  insert into metis.scope_types (tenant_id, name, level) values
    (v_id, 'Empresa', 0), (v_id, 'Región', 1), (v_id, 'Unidad de negocio', 1), (v_id, 'Planta', 2), (v_id, 'Área', 2)
  on conflict do nothing;
  insert into metis.scopes (tenant_id, scope_type_id, name)
    select v_id, st.id, trim(p_name) from metis.scope_types st where st.tenant_id = v_id and st.name = 'Empresa';

  if p_add_me and uid is not null then
    insert into metis.memberships (tenant_id, user_id, role, title)
    values (v_id, uid, 'admin', 'Consultor METIS')
    on conflict on constraint memberships_pkey do update set active = true, role = 'admin';
  end if;

  if coalesce(trim(p_owner_email), '') <> '' then
    insert into metis.invitations (tenant_id, email, role, title, invited_by)
    values (v_id, lower(trim(p_owner_email)), 'owner', 'Dirección General', uid)
    returning token into v_token;
    -- si ya tiene cuenta, entra de inmediato
    perform metis.accept_pending_invitations_for(p.id, p.email) from metis.profiles p where lower(p.email) = lower(trim(p_owner_email));
  end if;

  return query select v_id, v_code, v_token;
end $$;

-- El consultor METIS entra al portal de un cliente (queda registrado como miembro admin).
create or replace function metis.platform_join_tenant(p_tenant uuid)
returns void language plpgsql security definer set search_path = metis, public as $$
begin
  if not metis.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into metis.memberships as m (tenant_id, user_id, role, title)
  values (p_tenant, auth.uid(), 'admin', 'Consultor METIS')
  on conflict on constraint memberships_pkey do update set active = true;
end $$;

grant execute on function metis.my_tenants() to authenticated;
grant execute on function metis.platform_tenants() to authenticated;
grant execute on function metis.create_tenant(text, text, text, boolean) to authenticated;
grant execute on function metis.platform_join_tenant(uuid) to authenticated;
grant execute on function metis.is_platform_admin() to authenticated;
grant select on metis.platform_admins to authenticated;

-- ------------------------------------------------------------ 5. realtime ---
-- Los cambios se transmiten respetando RLS: cada quien sólo recibe los de SU empresa.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['results','scorecards','scorecard_items','scorecard_events','elements','element_scopes',
                             'scopes','scope_types','units','objectives','laes','memberships','invitations','tenants']
    loop
      begin
        execute format('alter publication supabase_realtime add table metis.%I', t);
      exception when duplicate_object then null;
      end;
    end loop;
  end if;
end $$;

-- -------------------------------------------------- datos de arranque ---
-- Oziel: administrador de la plataforma y dueño del demo Grupo Andes.
insert into metis.platform_admins (user_id)
  select id from auth.users where lower(email) = 'oziel.lemont@gmail.com'
on conflict do nothing;
update metis.memberships set role = 'owner'
  where user_id = (select id from auth.users where lower(email) = 'oziel.lemont@gmail.com')
    and tenant_id = (select id from metis.tenants where slug = 'grupo-andes');

notify pgrst, 'reload schema';
