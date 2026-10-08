-- =============================================================================
-- METIS · 0008 · Sesiones WTW / WTM y Compromisos
--
--  - WTW: touchpoint semanal del jefe directo con su equipo natural.
--  - WTM: cierre de mes y enfoque del mes siguiente.
--  - Compromisos y solicitudes de apoyo nacen en la sesión como BORRADOR (approved = false);
--    cuando el líder aprueba la sesión se vuelven tareas de cada colaborador.
--
-- Idempotente: se puede correr más de una vez.
-- =============================================================================

-- ------------------------------------------------------------ 1. sessions ---
alter table metis.sessions add column if not exists leader_id    uuid references metis.profiles(id);
alter table metis.sessions add column if not exists status       text not null default 'scheduled';
alter table metis.sessions add column if not exists location     text;
alter table metis.sessions add column if not exists notes        text;
alter table metis.sessions add column if not exists focus        jsonb not null default '[]'::jsonb;
alter table metis.sessions add column if not exists period_year  int;
alter table metis.sessions add column if not exists period_month int;
alter table metis.sessions add column if not exists closed_at    timestamptz;
alter table metis.sessions add column if not exists updated_at   timestamptz not null default now();

update metis.sessions set leader_id = created_by where leader_id is null;

alter table metis.sessions drop constraint if exists sessions_status_check;
alter table metis.sessions add constraint sessions_status_check check (status in ('scheduled', 'live', 'review', 'closed'));

create index if not exists sessions_leader_idx on metis.sessions (tenant_id, leader_id, scheduled_at desc);

-- --------------------------------------------------------- 2. commitments ---
alter table metis.commitments add column if not exists kind         text not null default 'commitment';
alter table metis.commitments add column if not exists requested_by uuid references metis.profiles(id);
alter table metis.commitments add column if not exists approved     boolean not null default true;
alter table metis.commitments add column if not exists note         text;
alter table metis.commitments add column if not exists created_by   uuid references metis.profiles(id);
alter table metis.commitments add column if not exists done_at      timestamptz;
alter table metis.commitments add column if not exists updated_at   timestamptz not null default now();

alter table metis.commitments drop constraint if exists commitments_kind_check;
alter table metis.commitments add constraint commitments_kind_check check (kind in ('commitment', 'support'));
-- «vencido» ya no se guarda: se calcula (abierto con fecha pasada). Se agrega «missed» = no cumplido.
update metis.commitments set status = 'open' where status = 'late';
alter table metis.commitments drop constraint if exists commitments_status_check;
alter table metis.commitments add constraint commitments_status_check check (status in ('open', 'done', 'missed', 'cancelled'));

create index if not exists commitments_owner_idx   on metis.commitments (tenant_id, owner_id, status);
create index if not exists commitments_session_idx on metis.commitments (session_id);

-- updated_at automático
create or replace function metis.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists trg_touch on metis.sessions;
create trigger trg_touch before update on metis.sessions for each row execute function metis.touch_updated_at();
drop trigger if exists trg_touch on metis.commitments;
create trigger trg_touch before update on metis.commitments for each row execute function metis.touch_updated_at();

-- ------------------------------------------------- 3. candados de empresa ---
drop trigger if exists trg_tenant_guard on metis.sessions;
create trigger trg_tenant_guard before insert or update on metis.sessions
  for each row execute function metis.assert_same_tenant('leader_id', '@member', 'scope_id', 'scopes', 'created_by', '@member');
drop trigger if exists trg_tenant_guard on metis.commitments;
create trigger trg_tenant_guard before insert or update on metis.commitments
  for each row execute function metis.assert_same_tenant('element_scope_id', 'element_scopes', 'owner_id', '@member', 'session_id', 'sessions',
                                                       'requested_by', '@member', 'created_by', '@member');

-- ------------------------------------------------------------- 4. permisos ---
-- Líder de una sesión (security definer para no depender de RLS al evaluar políticas).
create or replace function metis.session_leader(p_session uuid)
returns uuid language sql stable security definer set search_path = metis, public as $$
  select leader_id from metis.sessions where id = p_session;
$$;

-- ¿Es jefe directo de esa persona en esa empresa?
create or replace function metis.is_manager_of(p_tenant uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = metis, public as $$
  select exists (select 1 from metis.memberships m where m.tenant_id = p_tenant and m.user_id = p_user and m.manager_id = auth.uid() and m.active);
$$;

-- Lectura: todos los miembros de la empresa (ya existe sessions_select / commitments_select).
-- Escritura de sesiones: el líder de la sesión o un administrador.
drop policy if exists sessions_leader_write on metis.sessions;
create policy sessions_leader_write on metis.sessions for all
  using (tenant_id in (select metis.current_tenant_ids()) and (leader_id = auth.uid() or metis.has_role(tenant_id, 'owner', 'admin')))
  with check (tenant_id in (select metis.current_tenant_ids()) and (leader_id = auth.uid() or metis.has_role(tenant_id, 'owner', 'admin')));

-- Compromisos: el responsable (marca cumplido), quien lo creó, el líder de la sesión, el jefe del responsable o un administrador.
drop policy if exists commitments_people_write on metis.commitments;
create policy commitments_people_write on metis.commitments for all
  using (tenant_id in (select metis.current_tenant_ids()) and (
         owner_id = auth.uid() or created_by = auth.uid() or requested_by = auth.uid()
         or (session_id is not null and metis.session_leader(session_id) = auth.uid())
         or metis.is_manager_of(tenant_id, owner_id)
         or metis.has_role(tenant_id, 'owner', 'admin')))
  with check (tenant_id in (select metis.current_tenant_ids()) and (
         owner_id = auth.uid() or created_by = auth.uid() or requested_by = auth.uid()
         or (session_id is not null and metis.session_leader(session_id) = auth.uid())
         or metis.is_manager_of(tenant_id, owner_id)
         or metis.has_role(tenant_id, 'owner', 'admin')));

grant select, insert, update, delete on metis.sessions, metis.commitments to authenticated;
grant all on metis.sessions, metis.commitments to service_role;
grant execute on function metis.session_leader(uuid) to authenticated;
grant execute on function metis.is_manager_of(uuid, uuid) to authenticated;

-- ------------------------------------------------------------- 5. realtime ---
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['sessions', 'commitments'] loop
      begin
        execute format('alter publication supabase_realtime add table metis.%I', t);
      exception when duplicate_object then null;
      end;
    end loop;
  end if;
end $$;
