-- ============================================================================
-- METIS · 0002 · Acceso por código/invitación, unidades editables y recordatorios
-- Requiere 0001_core.sql
-- ============================================================================

-- ------------------------------------------------------------- unidades ---
-- Posición del símbolo y marca de unidad base (las base se editan, no se borran si están en uso).
alter table metis.units
  add column if not exists position text not null default 'suffix' check (position in ('prefix','suffix')),
  add column if not exists is_system boolean not null default false;

-- Un elemento no puede quedarse sin unidad válida; si se borra la unidad, se bloquea.
alter table metis.elements
  drop constraint if exists elements_unit_id_fkey,
  add constraint elements_unit_id_fkey foreign key (unit_id) references metis.units(id) on delete restrict;

-- Mantener el símbolo denormalizado sincronizado cuando el cliente edita la unidad.
create or replace function metis.sync_unit_symbol()
returns trigger language plpgsql as $$
begin
  if new.symbol is distinct from old.symbol then
    update metis.elements set unit = new.symbol where unit_id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists trg_units_sync_symbol on metis.units;
create trigger trg_units_sync_symbol after update on metis.units
  for each row execute function metis.sync_unit_symbol();

-- Unidades base que recibe toda empresa nueva.
create or replace function metis.seed_default_units(p_tenant uuid)
returns void language sql as $$
  insert into metis.units (tenant_id, symbol, name, decimals, position, is_system) values
    (p_tenant, '%',        'Porcentaje',         1, 'suffix', true),
    (p_tenant, '$',        'Pesos mexicanos',    0, 'prefix', true),
    (p_tenant, 'USD',      'Dólares',            0, 'prefix', true),
    (p_tenant, '#',        'Cantidad',           0, 'suffix', true),
    (p_tenant, 'pts',      'Puntos',             0, 'suffix', true),
    (p_tenant, 'días',     'Días',               1, 'suffix', true),
    (p_tenant, 'hrs',      'Horas',              1, 'suffix', true),
    (p_tenant, '% avance', 'Avance de proyecto', 0, 'suffix', true)
  on conflict (tenant_id, symbol) do nothing;
$$;

-- ------------------------------------------------- tenant: código y ajustes ---
alter table metis.tenants
  add column if not exists join_code text unique,
  add column if not exists settings jsonb not null default '{}'::jsonb;

create or replace function metis.generate_join_code(p_name text)
returns text language plpgsql as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  prefix text := upper(left(regexp_replace(coalesce(p_name,''), '[^A-Za-z]', '', 'g'), 5));
  suffix text := '';
  i int;
begin
  if prefix = '' then prefix := 'METIS'; end if;
  for i in 1..4 loop
    suffix := suffix || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return prefix || '-' || suffix;
end $$;

-- Cada tenant nuevo recibe código, ajustes de recordatorio y unidades base.
create or replace function metis.tenant_defaults()
returns trigger language plpgsql as $$
begin
  if new.join_code is null then
    loop
      new.join_code := metis.generate_join_code(new.name);
      exit when not exists (select 1 from metis.tenants where join_code = new.join_code);
    end loop;
  end if;
  if not (new.settings ? 'reminders') then
    new.settings := new.settings || jsonb_build_object('reminders', jsonb_build_object(
      'enabled', true, 'days', jsonb_build_array(25, 1, 3), 'hour', 9, 'timezone', 'America/Monterrey',
      'escalateToManager', true, 'channels', jsonb_build_object('email', true, 'whatsapp', false)));
  end if;
  return new;
end $$;
drop trigger if exists trg_tenants_defaults on metis.tenants;
create trigger trg_tenants_defaults before insert on metis.tenants
  for each row execute function metis.tenant_defaults();

create or replace function metis.tenant_after_insert()
returns trigger language plpgsql as $$
begin
  perform metis.seed_default_units(new.id);
  return new;
end $$;
drop trigger if exists trg_tenants_after_insert on metis.tenants;
create trigger trg_tenants_after_insert after insert on metis.tenants
  for each row execute function metis.tenant_after_insert();

-- Completar tenants existentes.
update metis.tenants set join_code = metis.generate_join_code(name) where join_code is null;
update metis.tenants set settings = settings || jsonb_build_object('reminders', jsonb_build_object(
  'enabled', true, 'days', jsonb_build_array(25, 1, 3), 'hour', 9, 'timezone', 'America/Monterrey',
  'escalateToManager', true, 'channels', jsonb_build_object('email', true, 'whatsapp', false)))
where not (settings ? 'reminders');

-- Sólo owner/admin puede cambiar código y ajustes (ya cubierto por política admin en 0001? tenants no la tenía → agregar).
drop policy if exists tenants_admin_update on metis.tenants;
create policy tenants_admin_update on metis.tenants for update
  using (metis.has_role(id, 'owner', 'admin')) with check (metis.has_role(id, 'owner', 'admin'));

-- RPC para regenerar el código (evita exponer la lógica en el cliente).
create or replace function metis.regenerate_join_code(p_tenant uuid)
returns text language plpgsql security definer set search_path = metis, public as $$
declare c text;
begin
  if not metis.has_role(p_tenant, 'owner', 'admin') then raise exception 'forbidden'; end if;
  loop
    c := metis.generate_join_code((select name from metis.tenants where id = p_tenant));
    exit when not exists (select 1 from metis.tenants where join_code = c);
  end loop;
  update metis.tenants set join_code = c where id = p_tenant;
  return c;
end $$;

-- ------------------------------------------------- perfiles desde auth.users ---
-- Al registrarse (magic link / Google) se crea el perfil automáticamente.
create or replace function metis.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = metis, public as $$
begin
  insert into metis.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do update set email = excluded.email;
  -- Si tenía invitaciones pendientes a ese correo, se aceptan solas.
  perform metis.accept_pending_invitations_for(new.id, new.email);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function metis.handle_new_auth_user();

-- ------------------------------------------------------------ invitaciones ---
create table if not exists metis.invitations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references metis.tenants(id) on delete cascade,
  email       text not null,
  role        metis.role not null default 'member',
  title       text,
  manager_id  uuid references metis.profiles(id),
  token       text not null unique default encode(gen_random_bytes(24), 'hex'),
  status      text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  invited_by  uuid references metis.profiles(id),
  expires_at  timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists invitations_tenant_idx on metis.invitations (tenant_id, status);
create index if not exists invitations_email_idx on metis.invitations (lower(email)) where status = 'pending';
alter table metis.invitations enable row level security;
drop policy if exists invitations_select on metis.invitations;
create policy invitations_select on metis.invitations for select
  using (tenant_id in (select metis.current_tenant_ids()));
drop policy if exists invitations_admin on metis.invitations;
create policy invitations_admin on metis.invitations for all
  using (metis.has_role(tenant_id, 'owner', 'admin', 'manager'))
  with check (metis.has_role(tenant_id, 'owner', 'admin', 'manager'));

-- Acepta todas las invitaciones pendientes para un correo (la llama el trigger de auth y también accept_invitation).
create or replace function metis.accept_pending_invitations_for(p_user uuid, p_email text)
returns int language plpgsql security definer set search_path = metis, public as $$
declare inv record; n int := 0;
begin
  for inv in select * from metis.invitations where lower(email) = lower(p_email) and status = 'pending' and expires_at > now() loop
    insert into metis.memberships (tenant_id, user_id, role, title, manager_id)
    values (inv.tenant_id, p_user, inv.role, inv.title, inv.manager_id)
    on conflict (tenant_id, user_id) do update set active = true, role = excluded.role, title = coalesce(excluded.title, metis.memberships.title), manager_id = coalesce(excluded.manager_id, metis.memberships.manager_id);
    update metis.invitations set status = 'accepted', accepted_at = now() where id = inv.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- RPC · Unirme con código de empresa. Crea la membership como 'member' (el admin ajusta rol/jefe después).
create or replace function metis.join_with_code(p_code text)
returns table (tenant_id uuid, tenant_name text) language plpgsql security definer set search_path = metis, public as $$
declare t record; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select id, name into t from metis.tenants where upper(join_code) = upper(trim(p_code));
  if t.id is null then raise exception 'invalid_code'; end if;
  insert into metis.memberships (tenant_id, user_id, role)
  values (t.id, uid, 'member')
  on conflict (tenant_id, user_id) do update set active = true;
  -- si además tenía invitación pendiente a este tenant, tomar rol/jefe de ahí
  perform metis.accept_pending_invitations_for(uid, (select email from metis.profiles where id = uid));
  return query select t.id, t.name;
end $$;

-- RPC · Aceptar invitación por token (el correo de la sesión debe coincidir).
create or replace function metis.accept_invitation(p_token text)
returns table (tenant_id uuid, tenant_name text) language plpgsql security definer set search_path = metis, public as $$
declare inv record; uid uuid := auth.uid(); my_email text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into inv from metis.invitations where token = p_token and status = 'pending' and expires_at > now();
  if inv.id is null then raise exception 'invalid_invitation'; end if;
  select email into my_email from metis.profiles where id = uid;
  if lower(my_email) <> lower(inv.email) then raise exception 'email_mismatch'; end if;
  insert into metis.memberships (tenant_id, user_id, role, title, manager_id)
  values (inv.tenant_id, uid, inv.role, inv.title, inv.manager_id)
  on conflict (tenant_id, user_id) do update set active = true, role = excluded.role, title = coalesce(excluded.title, metis.memberships.title), manager_id = coalesce(excluded.manager_id, metis.memberships.manager_id);
  update metis.invitations set status = 'accepted', accepted_at = now() where id = inv.id;
  return query select t.id, t.name from metis.tenants t where t.id = inv.tenant_id;
end $$;

-- ------------------------------------------------- registro de notificaciones ---
create table if not exists metis.notification_log (
  id           bigserial primary key,
  tenant_id    uuid not null references metis.tenants(id) on delete cascade,
  user_id      uuid references metis.profiles(id) on delete set null,
  channel      text not null default 'email',        -- email | whatsapp | teams
  kind         text not null,                        -- reminder_owner | reminder_manager | approval | red_alert
  period_year  int,
  period_month int,
  subject      text,
  status       text not null default 'sent',         -- sent | failed | dry_run
  error        text,
  sent_at      timestamptz not null default now()
);
create index if not exists notification_log_tenant_idx on metis.notification_log (tenant_id, sent_at desc);
alter table metis.notification_log enable row level security;
drop policy if exists notification_log_select on metis.notification_log;
create policy notification_log_select on metis.notification_log for select
  using (metis.has_role(tenant_id, 'owner', 'admin', 'manager') or user_id = auth.uid());
-- Sólo el servicio (cron) inserta; no hay política de insert para authenticated.

-- ------------------------------------------------------------------ grants ---
grant execute on function metis.join_with_code(text) to authenticated;
grant execute on function metis.accept_invitation(text) to authenticated;
grant execute on function metis.regenerate_join_code(uuid) to authenticated;
grant select, insert, update, delete on metis.invitations to authenticated;
grant select on metis.notification_log to authenticated;
grant usage, select on sequence metis.notification_log_id_seq to service_role;
