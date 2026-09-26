-- ============================================================================
-- METIS · Esquema núcleo multi-inquilino (Supabase / Postgres)
-- ----------------------------------------------------------------------------
-- Estrategia: una sola base con `tenant_id` en cada tabla y Row Level Security.
-- Cada usuario autenticado pertenece a un tenant vía `memberships`; las
-- políticas usan `metis.current_tenant_ids()` para filtrar.
--
-- Cascada:  objectives → laes → elements ⇄ element_scopes (× scopes)
--           scorecards → scorecard_items (→ element_scopes, targets, weights)
--           results (un dato por element_scope × period)
-- ============================================================================

create extension if not exists "pgcrypto";
create schema if not exists metis;

-- ---------------------------------------------------------------- enums ---
do $$ begin
  create type metis.element_type as enum ('kpi', 'project', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metis.direction as enum ('up', 'down');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metis.period as enum ('monthly', 'quarterly', 'semiannual', 'annual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metis.responsibility as enum ('owner', 'contributor'); -- DR / CV
exception when duplicate_object then null; end $$;

do $$ begin
  create type metis.scorecard_status as enum
    ('draft', 'submitted', 'approved', 'changes_requested', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metis.role as enum ('owner', 'admin', 'manager', 'member', 'viewer');
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------- tenants ---
create table if not exists metis.tenants (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  fiscal_year int  not null default extract(year from now())::int,
  currency    text not null default 'MXN',
  plan        text not null default 'crece',           -- arranca | crece | escala
  created_at  timestamptz not null default now()
);

create table if not exists metis.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table if not exists metis.memberships (
  tenant_id   uuid not null references metis.tenants(id) on delete cascade,
  user_id     uuid not null references metis.profiles(id) on delete cascade,
  role        metis.role not null default 'member',
  title       text,                                     -- cargo
  manager_id  uuid references metis.profiles(id),       -- jefe directo (aprueba)
  scope_id    uuid,                                     -- alcance principal (fk abajo)
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

-- --------------------------------------------------------------- helpers ---
create or replace function metis.current_tenant_ids()
returns setof uuid language sql stable security definer set search_path = metis, public as $$
  select tenant_id from metis.memberships
  where user_id = auth.uid() and active;
$$;

create or replace function metis.has_role(p_tenant uuid, variadic p_roles metis.role[])
returns boolean language sql stable security definer set search_path = metis, public as $$
  select exists (
    select 1 from metis.memberships
    where tenant_id = p_tenant and user_id = auth.uid() and active and role = any(p_roles)
  );
$$;

create or replace function metis.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ------------------------------------------------------------- strategy ---
create table if not exists metis.objectives (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references metis.tenants(id) on delete cascade,
  code        text not null,
  name        text not null,
  description text,
  horizon     int,                                      -- año objetivo (p.ej. 2028)
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists metis.laes (                 -- Líneas de Acción Estratégica
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references metis.tenants(id) on delete cascade,
  objective_id uuid not null references metis.objectives(id) on delete cascade,
  code         text not null,
  name         text not null,
  description  text,
  color        text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists metis.scope_types (          -- Nacional, Región, Planta, BU…
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references metis.tenants(id) on delete cascade,
  name       text not null,
  level      int  not null default 0,                   -- 0 = toda la empresa
  unique (tenant_id, name)
);

create table if not exists metis.scopes (               -- instancias: Región Norte, Planta MTY…
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references metis.tenants(id) on delete cascade,
  scope_type_id uuid not null references metis.scope_types(id) on delete restrict,
  parent_id     uuid references metis.scopes(id) on delete set null,
  name          text not null,
  unique (tenant_id, name)
);

alter table metis.memberships
  drop constraint if exists memberships_scope_fk,
  add constraint memberships_scope_fk foreign key (scope_id) references metis.scopes(id) on delete set null;

create table if not exists metis.units (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references metis.tenants(id) on delete cascade,
  symbol    text not null,                              -- %, $, pts, hrs, % avance
  name      text not null,
  decimals  int  not null default 1,
  unique (tenant_id, symbol)
);

-- Catálogo: cada elemento existe una sola vez.
create table if not exists metis.elements (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references metis.tenants(id) on delete cascade,
  lae_id      uuid not null references metis.laes(id) on delete restrict,
  type        metis.element_type not null default 'kpi',
  code        text not null,
  name        text not null,
  formula     text,
  unit_id     uuid references metis.units(id),
  unit        text not null default '%',                -- denormalizado para lectura rápida
  direction   metis.direction not null default 'up',
  period      metis.period not null default 'monthly',
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, code)
);
create trigger elements_touch before update on metis.elements
  for each row execute function metis.touch_updated_at();

-- Alcances permitidos por elemento (p.ej. OTIF puede medirse Nacional, Región, CEDIS)
create table if not exists metis.element_allowed_scope_types (
  element_id    uuid not null references metis.elements(id) on delete cascade,
  scope_type_id uuid not null references metis.scope_types(id) on delete cascade,
  primary key (element_id, scope_type_id)
);

-- Un elemento medido en un alcance = la unidad real que se carga y se propaga.
create table if not exists metis.element_scopes (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references metis.tenants(id) on delete cascade,
  element_id    uuid not null references metis.elements(id) on delete cascade,
  scope_id      uuid not null references metis.scopes(id) on delete cascade,
  owner_user_id uuid references metis.profiles(id),      -- DR: único que captura
  active        boolean not null default true,
  unique (element_id, scope_id)
);

-- ----------------------------------------------------------- scorecards ---
create table if not exists metis.scorecards (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references metis.tenants(id) on delete cascade,
  user_id     uuid not null references metis.profiles(id) on delete cascade,
  year        int  not null,
  status      metis.scorecard_status not null default 'draft',
  approver_id uuid references metis.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, user_id, year)
);
create trigger scorecards_touch before update on metis.scorecards
  for each row execute function metis.touch_updated_at();

create table if not exists metis.scorecard_items (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references metis.tenants(id) on delete cascade,
  scorecard_id     uuid not null references metis.scorecards(id) on delete cascade,
  element_scope_id uuid not null references metis.element_scopes(id) on delete restrict,
  responsibility   metis.responsibility not null default 'contributor', -- DR / CV
  weight           numeric(5,2) not null default 0,     -- ponderación base (0–100)
  monthly_weights  numeric(5,2)[],                      -- 12 valores opcionales por mes
  target_min       numeric not null,
  target_sat       numeric not null,
  target_out       numeric not null,                    -- sobresaliente
  period           metis.period not null default 'monthly',
  sort_order       int not null default 0,
  unique (scorecard_id, element_scope_id),
  constraint monthly_weights_len check (monthly_weights is null or array_length(monthly_weights, 1) = 12)
);

create table if not exists metis.scorecard_events (     -- historial de estado
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references metis.tenants(id) on delete cascade,
  scorecard_id uuid not null references metis.scorecards(id) on delete cascade,
  actor_id     uuid references metis.profiles(id),
  from_status  metis.scorecard_status,
  to_status    metis.scorecard_status not null,
  comment      text,
  created_at   timestamptz not null default now()
);

-- -------------------------------------------------------------- results ---
-- Un dato por element_scope × período. El DR captura; los CV lo leen.
create table if not exists metis.results (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references metis.tenants(id) on delete cascade,
  element_scope_id uuid not null references metis.element_scopes(id) on delete cascade,
  year             int  not null,
  month            int  not null check (month between 1 and 12),
  value            numeric,
  log              text,                                -- bitácora
  evidence_url     text,
  loaded_by        uuid references metis.profiles(id),
  loaded_at        timestamptz not null default now(),
  unique (element_scope_id, year, month)
);

-- ----------------------------------------------------- v1: ritmo/sesiones ---
create table if not exists metis.sessions (             -- WTW / WTM
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references metis.tenants(id) on delete cascade,
  kind        text not null check (kind in ('wtw', 'wtm')),
  scope_id    uuid references metis.scopes(id),
  scheduled_at timestamptz not null,
  transcript  text,
  summary     text,
  created_by  uuid references metis.profiles(id),
  created_at  timestamptz not null default now()
);

create table if not exists metis.commitments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references metis.tenants(id) on delete cascade,
  session_id  uuid references metis.sessions(id) on delete set null,
  element_scope_id uuid references metis.element_scopes(id) on delete set null,
  owner_id    uuid references metis.profiles(id),
  title       text not null,
  due_date    date,
  status      text not null default 'open' check (status in ('open', 'done', 'late', 'cancelled')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- leads ---
-- Índice de Alineación (público, sin tenant). Sólo inserción anónima.
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  company     text not null,
  title       text,
  size        text,
  industry    text,
  city        text,
  consent     boolean not null default false,
  score       int,
  dims        jsonb,                                    -- {claridad: 50, cascada: 56, …}
  answers     jsonb,                                    -- respuestas crudas 0–4
  level       text,
  source      text default 'indice',
  utm         jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================ RLS ==========
alter table metis.tenants              enable row level security;
alter table metis.profiles             enable row level security;
alter table metis.memberships          enable row level security;
alter table metis.objectives           enable row level security;
alter table metis.laes                 enable row level security;
alter table metis.scope_types          enable row level security;
alter table metis.scopes               enable row level security;
alter table metis.units                enable row level security;
alter table metis.elements             enable row level security;
alter table metis.element_allowed_scope_types enable row level security;
alter table metis.element_scopes       enable row level security;
alter table metis.scorecards           enable row level security;
alter table metis.scorecard_items      enable row level security;
alter table metis.scorecard_events     enable row level security;
alter table metis.results              enable row level security;
alter table metis.sessions             enable row level security;
alter table metis.commitments          enable row level security;
alter table public.leads               enable row level security;

-- tenants: ver sólo los míos
create policy tenants_select on metis.tenants for select
  using (id in (select metis.current_tenant_ids()));

-- profiles: verme a mí y a compañeros de tenant
create policy profiles_select on metis.profiles for select
  using (id = auth.uid() or id in (
    select m.user_id from metis.memberships m where m.tenant_id in (select metis.current_tenant_ids())));
create policy profiles_update_self on metis.profiles for update
  using (id = auth.uid());

create policy memberships_select on metis.memberships for select
  using (tenant_id in (select metis.current_tenant_ids()));
create policy memberships_admin on metis.memberships for all
  using (metis.has_role(tenant_id, 'owner', 'admin'))
  with check (metis.has_role(tenant_id, 'owner', 'admin'));

-- Macro genérica: lectura para todo miembro; escritura para admin/owner.
do $$
declare t text;
begin
  foreach t in array array['objectives','laes','scope_types','scopes','units','elements','element_scopes','sessions','commitments']
  loop
    execute format('create policy %I_select on metis.%I for select using (tenant_id in (select metis.current_tenant_ids()))', t, t);
    execute format('create policy %I_admin  on metis.%I for all using (metis.has_role(tenant_id, ''owner'',''admin'')) with check (metis.has_role(tenant_id, ''owner'',''admin''))', t, t);
  end loop;
end $$;

create policy east_select on metis.element_allowed_scope_types for select
  using (element_id in (select id from metis.elements where tenant_id in (select metis.current_tenant_ids())));
create policy east_admin on metis.element_allowed_scope_types for all
  using (element_id in (select id from metis.elements e where metis.has_role(e.tenant_id, 'owner', 'admin')));

-- scorecards: el dueño, su jefe (approver/manager) y admins.
create policy scorecards_select on metis.scorecards for select
  using (tenant_id in (select metis.current_tenant_ids()));
create policy scorecards_owner_write on metis.scorecards for all
  using (user_id = auth.uid() or approver_id = auth.uid()
         or exists (select 1 from metis.memberships m where m.tenant_id = scorecards.tenant_id and m.user_id = scorecards.user_id and m.manager_id = auth.uid())
         or metis.has_role(tenant_id, 'owner', 'admin'))
  with check (tenant_id in (select metis.current_tenant_ids()));

create policy items_select on metis.scorecard_items for select
  using (tenant_id in (select metis.current_tenant_ids()));
create policy items_write on metis.scorecard_items for all
  using (scorecard_id in (select id from metis.scorecards s where s.user_id = auth.uid() or s.approver_id = auth.uid()
          or metis.has_role(s.tenant_id, 'owner', 'admin')))
  with check (tenant_id in (select metis.current_tenant_ids()));

create policy events_select on metis.scorecard_events for select
  using (tenant_id in (select metis.current_tenant_ids()));
create policy events_insert on metis.scorecard_events for insert
  with check (tenant_id in (select metis.current_tenant_ids()) and actor_id = auth.uid());

-- results: lee todo el tenant; escribe sólo el DR del element_scope (o admin).
create policy results_select on metis.results for select
  using (tenant_id in (select metis.current_tenant_ids()));
create policy results_owner_write on metis.results for all
  using (element_scope_id in (select id from metis.element_scopes es where es.owner_user_id = auth.uid())
         or metis.has_role(tenant_id, 'owner', 'admin'))
  with check (tenant_id in (select metis.current_tenant_ids()));

-- leads: cualquiera inserta (formulario público); sólo service_role lee.
create policy leads_insert_anon on public.leads for insert to anon, authenticated with check (true);

-- ============================================================ views ========
-- Cumplimiento por item (attainment vs meta satisfactoria, tope 120%).
create or replace view metis.v_item_attainment as
select
  si.id as item_id, si.scorecard_id, si.tenant_id, r.year, r.month, r.value,
  e.direction, si.target_min, si.target_sat, si.target_out,
  case
    when r.value is null then null
    when e.direction = 'up'  then least(120, greatest(0, (r.value / nullif(si.target_sat,0)) * 100))
    else                          least(120, greatest(0, (si.target_sat / nullif(r.value,0)) * 100))
  end as attainment,
  case
    when r.value is null then 'none'
    when e.direction = 'up' then case when r.value >= si.target_out then 'out' when r.value >= si.target_sat then 'sat' when r.value >= si.target_min then 'min' else 'low' end
    else                          case when r.value <= si.target_out then 'out' when r.value <= si.target_sat then 'sat' when r.value <= si.target_min then 'min' else 'low' end
  end as traffic,
  coalesce(si.monthly_weights[r.month], si.weight) as weight
from metis.scorecard_items si
join metis.element_scopes es on es.id = si.element_scope_id
join metis.elements e on e.id = es.element_id
left join metis.results r on r.element_scope_id = si.element_scope_id;

-- Cumplimiento ponderado por scorecard × mes (renormalizado entre items con dato).
create or replace view metis.v_scorecard_attainment as
select scorecard_id, tenant_id, year, month,
       round(sum(attainment * weight) / nullif(sum(weight), 0), 1) as weighted_attainment,
       count(*) filter (where attainment is not null) as loaded_items,
       count(*) as total_items
from metis.v_item_attainment
where attainment is not null
group by scorecard_id, tenant_id, year, month;

grant usage on schema metis to anon, authenticated, service_role;
grant select on all tables in schema metis to authenticated;
grant insert, update, delete on all tables in schema metis to authenticated;
grant select on metis.v_item_attainment, metis.v_scorecard_attainment to authenticated;
alter default privileges in schema metis grant select, insert, update, delete on tables to authenticated;
