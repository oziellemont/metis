-- =============================================================================
-- METIS · 0010 · Importar organigrama
--
--  - Nuevos datos por persona: número de empleado y área (en memberships e invitaciones).
--  - La invitación puede apuntar al CORREO del jefe aunque el jefe aún no tenga cuenta.
--    Cuando ese jefe entra a la empresa (por invitación, código o consola), todos los que
--    lo esperaban quedan colgados de él automáticamente.
--  - RPC metis.import_org(tenant, filas): crea/actualiza en un solo paso.
-- Idempotente: se puede correr más de una vez.
-- =============================================================================

alter table metis.memberships add column if not exists employee_number text;
alter table metis.memberships add column if not exists area text;
alter table metis.memberships add column if not exists pending_manager_email text;

alter table metis.invitations add column if not exists full_name text;
alter table metis.invitations add column if not exists employee_number text;
alter table metis.invitations add column if not exists area text;
alter table metis.invitations add column if not exists manager_email text;

create index if not exists memberships_pending_mgr_idx on metis.memberships (tenant_id, lower(pending_manager_email)) where pending_manager_email is not null;
create index if not exists invitations_mgr_email_idx on metis.invitations (tenant_id, lower(manager_email)) where status = 'pending';

-- ------------------------------------------------- aplicar una invitación ---
-- Un solo lugar con la lógica de "esta invitación se vuelve membership".
create or replace function metis.apply_invitation(inv metis.invitations, p_user uuid)
returns void language plpgsql security definer set search_path = metis, public as $$
#variable_conflict use_column
declare v_mgr uuid := inv.manager_id;
begin
  if v_mgr is null and inv.manager_email is not null then
    select p.id into v_mgr from metis.profiles p
      join metis.memberships m on m.user_id = p.id and m.tenant_id = inv.tenant_id and m.active
      where lower(p.email) = lower(inv.manager_email) limit 1;
  end if;
  insert into metis.memberships as m (tenant_id, user_id, role, title, manager_id, employee_number, area, pending_manager_email)
  values (inv.tenant_id, p_user, inv.role, inv.title, v_mgr, inv.employee_number, inv.area,
          case when v_mgr is null then lower(inv.manager_email) end)
  on conflict on constraint memberships_pkey do update
    set active = true,
        role = case when m.role = 'owner' then m.role else excluded.role end,
        title = coalesce(excluded.title, m.title),
        manager_id = coalesce(excluded.manager_id, m.manager_id),
        employee_number = coalesce(excluded.employee_number, m.employee_number),
        area = coalesce(excluded.area, m.area),
        pending_manager_email = case when coalesce(excluded.manager_id, m.manager_id) is null then coalesce(excluded.pending_manager_email, m.pending_manager_email) end;
  -- el nombre del archivo reemplaza al nombre automático (parte antes de la @)
  if inv.full_name is not null and length(trim(inv.full_name)) > 0 then
    update metis.profiles p set full_name = trim(inv.full_name)
      where p.id = p_user and (p.full_name is null or p.full_name = split_part(p.email, '@', 1));
  end if;
  update metis.invitations i set status = 'accepted', accepted_at = now() where i.id = inv.id;
end $$;

create or replace function metis.accept_pending_invitations_for(p_user uuid, p_email text)
returns int language plpgsql security definer set search_path = metis, public as $$
declare inv metis.invitations; n int := 0;
begin
  for inv in select * from metis.invitations i where lower(i.email) = lower(p_email) and i.status = 'pending' and i.expires_at > now() loop
    perform metis.apply_invitation(inv, p_user);
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function metis.accept_invitation(p_token text)
returns table (tenant_id uuid, tenant_name text) language plpgsql security definer set search_path = metis, public as $$
#variable_conflict use_column
declare inv metis.invitations; uid uuid := auth.uid(); my_email text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select i.* into inv from metis.invitations i where i.token = p_token and i.status = 'pending' and i.expires_at > now();
  if inv.id is null then raise exception 'invalid_invitation'; end if;
  select p.email into my_email from metis.profiles p where p.id = uid;
  if lower(my_email) <> lower(inv.email) then raise exception 'email_mismatch'; end if;
  perform metis.apply_invitation(inv, uid);
  return query select tn.id, tn.name from metis.tenants tn where tn.id = inv.tenant_id;
end $$;

-- ------------------------------ cuando alguien entra, recoge a su equipo ---
create or replace function metis.link_waiting_reports()
returns trigger language plpgsql security definer set search_path = metis, public as $$
declare v_email text;
begin
  select lower(p.email) into v_email from metis.profiles p where p.id = new.user_id;
  if v_email is null then return new; end if;
  update metis.memberships m set manager_id = new.user_id, pending_manager_email = null
    where m.tenant_id = new.tenant_id and m.user_id <> new.user_id and lower(m.pending_manager_email) = v_email;
  update metis.invitations i set manager_id = new.user_id
    where i.tenant_id = new.tenant_id and i.status = 'pending' and i.manager_id is null and lower(i.manager_email) = v_email;
  return new;
end $$;
drop trigger if exists trg_link_waiting_reports on metis.memberships;
create trigger trg_link_waiting_reports after insert on metis.memberships
  for each row execute function metis.link_waiting_reports();

-- ------------------------------------------------------- importar en bloque ---
-- p_rows: [{ email, name, title, employee_number, area, manager_email, role: 'member'|'manager'|'admin' }]
-- Devuelve una fila por persona: acción ('invited' | 'updated' | 'skipped') e id de invitación.
create or replace function metis.import_org(p_tenant uuid, p_rows jsonb)
returns table (email text, action text, invitation_id uuid, detail text)
language plpgsql security definer set search_path = metis, public as $$
#variable_conflict use_column
declare
  r jsonb; v_email text; v_mgr_email text; v_mgr uuid; v_user uuid; v_cur metis.role; v_role metis.role; v_inv uuid;
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not (metis.has_role(p_tenant, 'owner', 'admin') or metis.is_platform_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'p_rows debe ser una lista'; end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    v_email := lower(trim(r->>'email'));
    continue when v_email is null or v_email = '';
    v_mgr_email := nullif(lower(trim(coalesce(r->>'manager_email', ''))), '');
    if v_mgr_email = v_email then v_mgr_email := null; end if;
    v_role := case r->>'role' when 'admin' then 'admin'::metis.role when 'manager' then 'manager'::metis.role else 'member'::metis.role end;

    select p.id into v_mgr from metis.profiles p
      join metis.memberships m on m.user_id = p.id and m.tenant_id = p_tenant and m.active
      where lower(p.email) = v_mgr_email limit 1;

    v_user := null; v_cur := null;
    select m.user_id, m.role into v_user, v_cur from metis.memberships m
      join metis.profiles p on p.id = m.user_id
      where m.tenant_id = p_tenant and lower(p.email) = v_email limit 1;

    if v_user is not null then
      update metis.memberships m set
        active = true,
        role = case when v_cur = 'owner' or v_user = uid then m.role else v_role end,
        title = coalesce(nullif(trim(r->>'title'), ''), m.title),
        employee_number = coalesce(nullif(trim(r->>'employee_number'), ''), m.employee_number),
        area = coalesce(nullif(trim(r->>'area'), ''), m.area),
        manager_id = case when v_mgr_email is null then m.manager_id else v_mgr end,
        pending_manager_email = case when v_mgr_email is not null and v_mgr is null then v_mgr_email else null end
      where m.tenant_id = p_tenant and m.user_id = v_user;
      if nullif(trim(r->>'name'), '') is not null then
        update metis.profiles p set full_name = trim(r->>'name')
          where p.id = v_user and (p.full_name is null or p.full_name = split_part(p.email, '@', 1));
      end if;
      return query select v_email, 'updated'::text, null::uuid, null::text;
    else
      update metis.invitations i set status = 'revoked'
        where i.tenant_id = p_tenant and i.status = 'pending' and lower(i.email) = v_email;
      insert into metis.invitations (tenant_id, email, role, title, manager_id, manager_email, full_name, employee_number, area, invited_by)
      values (p_tenant, v_email, v_role, nullif(trim(r->>'title'), ''), v_mgr, v_mgr_email,
              nullif(trim(r->>'name'), ''), nullif(trim(r->>'employee_number'), ''), nullif(trim(r->>'area'), ''), uid)
      returning id into v_inv;
      return query select v_email, 'invited'::text, v_inv, null::text;
    end if;
  end loop;
end $$;

grant execute on function metis.import_org(uuid, jsonb) to authenticated;
grant execute on function metis.accept_invitation(text) to authenticated;
