-- ============================================================================
-- métis CEO · PONERSE AL DÍA EN PRODUCCIÓN (0015 → 0019) + prender la IA del caso
-- Correr TODO de una vez en Supabase → SQL Editor (proyecto de PRODUCCIÓN).
-- Solo agrega cosas nuevas en el esquema "ceo". No borra ni cambia datos,
-- no toca el esquema "metis" (Align). Se puede correr varias veces sin problema.
-- Todo lo nuevo queda APAGADO, salvo la IA y el caso SuperNorte solo para Oziel.
-- ============================================================================

-- ============================================================================
-- METIS · 0015 · mêtis CEO · Fase 0 (cimientos)
-- Solo agrega cosas nuevas en el esquema "ceo". No borra ni cambia datos
-- existentes y no toca el esquema "metis" (Align). Idempotente: se puede correr
-- varias veces. Para deshacerla: docs/sql/0015_revertir.sql
--
--   1. players.flags / ai_consent  → interruptores por jugador y permiso de IA
--   2. ceo.flags                   → interruptores globales (todo APAGADO)
--   3. ceo.product_events          → medición de uso (sin datos sensibles)
--   4. ceo.ai_calls                → bitácora de cada llamada a OpenAI y su costo
--   5. ceo.ai_quota + ai_reservar  → tope de gasto diario/mensual, a prueba de carreras
--   6. ceo.game_events             → diario de jugadas validado por el servidor
--
-- Las tablas 2–6 solo las escribe el servidor (service_role). Ningún navegador
-- puede escribirlas directamente. game_events: cada jugador puede LEER las suyas.
-- ============================================================================

create schema if not exists ceo;

-- 1 · Jugadores: interruptores y consentimiento de IA ------------------------
alter table ceo.players add column if not exists flags         jsonb not null default '{}'::jsonb;
alter table ceo.players add column if not exists ai_consent    boolean not null default false;
alter table ceo.players add column if not exists ai_consent_at timestamptz;

-- 2 · Interruptores globales -------------------------------------------------
create table if not exists ceo.flags (
  key        text primary key,
  enabled    boolean not null default false,
  value      jsonb   not null default '{}'::jsonb,
  note       text    not null default '',
  updated_at timestamptz not null default now()
);
alter table ceo.flags enable row level security;
grant all privileges on ceo.flags to service_role;

insert into ceo.flags (key, enabled, note) values
  ('ai',            false, 'Llamadas a OpenAI. Apagado hasta confirmar montos con Oziel.'),
  ('ai_shadow',     false, 'IA en modo sombra: calcula pero el jugador no ve el resultado.'),
  ('events',        false, 'Medición de uso (product_events).'),
  ('game_journal',  false, 'Diario de jugadas en el servidor (game_events).'),
  ('replay_shadow', false, 'Validación de partidas en el servidor, solo registra diferencias.')
on conflict (key) do nothing;

-- 3 · Medición de uso --------------------------------------------------------
create table if not exists ceo.product_events (
  id          bigserial primary key,
  event_id    uuid not null unique,                 -- lo genera el cliente: reintentos no duplican
  user_id     uuid references auth.users(id) on delete cascade,
  anon_id     text,                                  -- visitante sin cuenta (demo)
  name        text not null check (char_length(name) between 1 and 64),
  props       jsonb not null default '{}'::jsonb,
  client_at   timestamptz,                           -- hora del dispositivo (solo referencia)
  server_at   timestamptz not null default now(),    -- hora confiable
  app_version text
);
create index if not exists product_events_name_time_idx on ceo.product_events (name, server_at desc);
create index if not exists product_events_user_idx      on ceo.product_events (user_id, server_at desc);
alter table ceo.product_events enable row level security;
grant all privileges on ceo.product_events to service_role;
grant usage, select on sequence ceo.product_events_id_seq to service_role;

-- 4 · Bitácora de IA ---------------------------------------------------------
create table if not exists ceo.ai_calls (
  id            bigserial primary key,
  user_id       uuid references auth.users(id) on delete set null,
  purpose       text not null,                       -- p. ej. 'evaluar_razonamiento', 'demo'
  model         text not null,
  input_tokens  int  not null default 0,
  output_tokens int  not null default 0,
  cost_usd      numeric(12,6) not null default 0,
  status        text not null default 'ok',          -- ok | error | bloqueado_tope | sombra
  latency_ms    int,
  error         text,
  created_at    timestamptz not null default now()
);
create index if not exists ai_calls_time_idx on ceo.ai_calls (created_at desc);
create index if not exists ai_calls_user_idx on ceo.ai_calls (user_id, created_at desc);
alter table ceo.ai_calls enable row level security;
grant all privileges on ceo.ai_calls to service_role;
grant usage, select on sequence ceo.ai_calls_id_seq to service_role;

-- 5 · Topes de gasto ---------------------------------------------------------
-- scope: 'global' o 'user:<uuid>'.  period: 'd:2026-10-27' o 'm:2026-10'.
create table if not exists ceo.ai_quota (
  scope      text not null,
  period     text not null,
  calls      int  not null default 0,
  cost_usd   numeric(12,6) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (scope, period)
);
alter table ceo.ai_quota enable row level security;
grant all privileges on ceo.ai_quota to service_role;

-- Reserva atómica: suma el costo estimado SOLO si no rebasa el tope.
-- Devuelve true si se permitió la llamada. Dos llamadas simultáneas nunca
-- pueden pasarse del tope juntas (bloqueo por fila).
create or replace function ceo.ai_reservar(p_scope text, p_period text, p_cost numeric, p_cap numeric)
returns boolean
language plpgsql security definer set search_path = ceo, public as $$
declare ok boolean;
begin
  if p_cost < 0 or p_cap < 0 then return false; end if;
  insert into ceo.ai_quota (scope, period) values (p_scope, p_period)
    on conflict (scope, period) do nothing;
  update ceo.ai_quota
     set calls = calls + 1, cost_usd = cost_usd + p_cost, updated_at = now()
   where scope = p_scope and period = p_period and cost_usd + p_cost <= p_cap
  returning true into ok;
  return coalesce(ok, false);
end $$;
revoke all on function ceo.ai_reservar(text, text, numeric, numeric) from public;
grant execute on function ceo.ai_reservar(text, text, numeric, numeric) to service_role;

-- Ajuste posterior: cambia el estimado por el costo real (puede ser negativo).
create or replace function ceo.ai_ajustar(p_scope text, p_period text, p_delta numeric)
returns void
language sql security definer set search_path = ceo, public as $$
  update ceo.ai_quota set cost_usd = greatest(0, cost_usd + p_delta), updated_at = now()
   where scope = p_scope and period = p_period;
$$;
revoke all on function ceo.ai_ajustar(text, text, numeric) from public;
grant execute on function ceo.ai_ajustar(text, text, numeric) to service_role;

-- 6 · Diario de jugadas ------------------------------------------------------
create table if not exists ceo.game_events (
  id         bigserial primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_id   uuid not null,                          -- generado en el dispositivo
  seq        int  not null,                          -- orden dentro de la partida
  action     jsonb not null,                         -- GameAction (lib/ceo/replay.ts)
  client_at  timestamptz not null,                   -- hora declarada por el dispositivo
  server_at  timestamptz not null default now(),     -- hora en que llegó al servidor
  accepted   boolean,                                -- resultado de la validación (null = sin validar)
  note       text,
  unique (user_id, event_id)
);
create index if not exists game_events_user_seq_idx on ceo.game_events (user_id, seq);
alter table ceo.game_events enable row level security;
drop policy if exists game_events_read_own on ceo.game_events;
create policy game_events_read_own on ceo.game_events for select using (user_id = auth.uid());
grant select on ceo.game_events to authenticated;
grant all privileges on ceo.game_events to service_role;
grant usage, select on sequence ceo.game_events_id_seq to service_role;

notify pgrst, 'reload schema';


-- ============================================================================
-- METIS · 0016 · mêtis CEO · perfil de onboarding e interés en industrias
-- Adenda v3.2 §4 y §6. Solo AGREGA columnas opcionales y una tabla nueva en el
-- esquema "ceo". No borra ni cambia datos y no toca "metis" (Align).
-- Idempotente. Para deshacerla: docs/sql/0016_revertir.sql
--
--   1. players: campos del onboarding (todos opcionales; quien ya juega no cambia)
--   2. ceo.industry_interest: «Me interesa» en industrias/empresas «Próximamente»
--
-- El catálogo de industrias vive versionado en el código (lib/ceo/catalog.ts);
-- aquí solo se guardan ids. El servidor valida el par industria–empresa.
-- ============================================================================

-- 1 · Perfil de onboarding ---------------------------------------------------
alter table ceo.players add column if not exists onboarding_version       int;
alter table ceo.players add column if not exists professional_level       text;
alter table ceo.players add column if not exists functional_area          text;
alter table ceo.players add column if not exists experience_band          text;
alter table ceo.players add column if not exists learning_goal            text;
alter table ceo.players add column if not exists home_industry_id         text;
alter table ceo.players add column if not exists home_company_variant_id  text;
alter table ceo.players add column if not exists daily_decision_goal      smallint;
alter table ceo.players add column if not exists preferred_session_minutes smallint;
alter table ceo.players add column if not exists notify_window_start      smallint;
alter table ceo.players add column if not exists notify_window_end        smallint;
alter table ceo.players add column if not exists onboarding_completed_at  timestamptz;

do $$ begin
  alter table ceo.players add constraint players_daily_goal_chk check (daily_decision_goal is null or daily_decision_goal between 1 and 3);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table ceo.players add constraint players_session_minutes_chk check (preferred_session_minutes is null or preferred_session_minutes in (3, 5, 8, 12));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table ceo.players add constraint players_notify_window_chk check (
    (notify_window_start is null or notify_window_start between 0 and 23) and
    (notify_window_end   is null or notify_window_end   between 0 and 23));
exception when duplicate_object then null; end $$;

-- 2 · Interés en industrias «Próximamente» -----------------------------------
create table if not exists ceo.industry_interest (
  user_id      uuid not null references auth.users(id) on delete cascade,
  industry_id  text not null,
  company_id   text not null default '',          -- '' = la industria en general
  created_at   timestamptz not null default now(),
  primary key (user_id, industry_id, company_id)
);
alter table ceo.industry_interest enable row level security;
drop policy if exists industry_interest_own on ceo.industry_interest;
create policy industry_interest_own on ceo.industry_interest for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, delete on ceo.industry_interest to authenticated;
grant all privileges on ceo.industry_interest to service_role;

notify pgrst, 'reload schema';


-- ============================================================================
-- METIS · 0017 · mêtis CEO · bitácora de importaciones de progreso (adenda v3.2 §3)
-- Solo agrega una tabla nueva en el esquema "ceo". No toca datos existentes ni el
-- esquema "metis" (Align). Idempotente. Para deshacerla: docs/sql/0017_revertir.sql
--
-- Cada vez que alguien trae a su cuenta la carrera que tenía guardada en el navegador
-- queda un renglón aquí, con un import_id que genera el dispositivo (reintentar no
-- duplica). Si la importación REEMPLAZÓ una carrera que ya estaba en la cuenta, la
-- carrera anterior se guarda completa en replaced_state para poder recuperarla.
--
-- Solo la escribe el servidor (service_role). Cada jugador puede LEER las suyas.
-- ============================================================================

create schema if not exists ceo;

create table if not exists ceo.career_imports (
  import_id          uuid primary key,                        -- generado en el dispositivo
  user_id            uuid not null references auth.users(id) on delete cascade,
  mode               text not null check (mode in ('vacia', 'reemplazar')),
  legacy_company_id  text not null,
  rules_version      int  not null,
  catalog_version    int  not null,
  local_saved_at     timestamptz,
  xp                 int  not null default 0,                  -- XP calculado por el servidor al importar
  decisions          int  not null default 0,
  warnings           text[] not null default '{}',
  replaced_state     jsonb,                                    -- carrera de la cuenta que se reemplazó (respaldo)
  created_at         timestamptz not null default now()
);
create index if not exists career_imports_user_idx on ceo.career_imports (user_id, created_at desc);

alter table ceo.career_imports enable row level security;
drop policy if exists career_imports_read_own on ceo.career_imports;
create policy career_imports_read_own on ceo.career_imports for select
  using (user_id = auth.uid());
grant select on ceo.career_imports to authenticated;
grant all privileges on ceo.career_imports to service_role;

notify pgrst, 'reload schema';


-- ============================================================================
-- METIS · 0018 · mêtis CEO · diario de jugadas en modo sombra (Fase 0.5)
-- Solo agrega cosas nuevas en el esquema "ceo". No borra ni cambia datos existentes
-- y no toca el esquema "metis" (Align). Idempotente: se puede correr varias veces.
-- Para deshacerla: docs/sql/0018_revertir.sql
--
--   1. ceo.game_events + run_id     → cada jugada queda ligada a una carrera
--   2. ceo.game_runs                → la carrera según el servidor (estado y XP que él calcula)
--   3. ceo.journal_commit(...)      → guarda carrera + jugadas en una sola transacción, con
--                                     control de versión: dos dispositivos a la vez no se pisan
--   4. ceo.xp_comparacion(...)      → para revisar: XP del navegador vs. XP del servidor
--
-- Todo lo escribe solo el servidor (service_role). Cada jugador puede LEER lo suyo.
-- El interruptor «game_journal» (ceo.flags, creado en 0015) sigue APAGADO.
-- ============================================================================

create schema if not exists ceo;

-- 1 · Jugadas ligadas a una carrera -------------------------------------------
alter table ceo.game_events add column if not exists run_id uuid;
create index if not exists game_events_run_seq_idx on ceo.game_events (run_id, seq);

-- 2 · Carrera según el servidor -------------------------------------------------
create table if not exists ceo.game_runs (
  run_id            uuid primary key,                    -- derivado de usuario + inicio de la carrera
  user_id           uuid not null references auth.users(id) on delete cascade,
  career_started_at timestamptz not null,
  version           int  not null default 1,             -- sube con cada guardado (control de carreras)
  state             jsonb not null,                      -- estado que calcula el servidor
  server_xp         int  not null default 0,             -- XP según el servidor
  client_xp         int,                                 -- XP que reportó el navegador (para comparar)
  base_kind         text not null check (base_kind in ('inicio', 'continuacion')),
  base_xp           int  not null default 0,             -- XP que ya traía al empezar el diario
  rules_version     int  not null default 1,
  events_accepted   int  not null default 0,
  events_rejected   int  not null default 0,
  events_flagged    int  not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, career_started_at)
);
create index if not exists game_runs_user_idx on ceo.game_runs (user_id, updated_at desc);
alter table ceo.game_runs enable row level security;
drop policy if exists game_runs_read_own on ceo.game_runs;
create policy game_runs_read_own on ceo.game_runs for select using (user_id = auth.uid());
grant select on ceo.game_runs to authenticated;
grant all privileges on ceo.game_runs to service_role;

-- 3 · Guardado atómico -----------------------------------------------------------
-- p_version = 0 → la carrera es nueva; si otro dispositivo la creó primero, responde 'conflicto'.
-- p_version > 0 → solo guarda si nadie la cambió desde que se leyó; si no, 'conflicto' (se reintenta).
-- Las jugadas repetidas (mismo usuario + event_id) se ignoran.
create or replace function ceo.journal_commit(
  p_user uuid, p_run uuid, p_career_started_at timestamptz, p_version int,
  p_state jsonb, p_server_xp int, p_client_xp int, p_base_kind text, p_base_xp int,
  p_rules_version int, p_events jsonb
) returns text
language plpgsql security definer set search_path = ceo, public as $$
declare
  n_ok int := 0; n_bad int := 0; n_flag int := 0;
begin
  select count(*) filter (where (e->>'accepted')::boolean),
         count(*) filter (where not (e->>'accepted')::boolean),
         count(*) filter (where coalesce(e->>'note', '') like '%reloj_adelantado%')
    into n_ok, n_bad, n_flag
    from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) e;

  if p_version = 0 then
    insert into ceo.game_runs (run_id, user_id, career_started_at, state, server_xp, client_xp, base_kind, base_xp, rules_version, events_accepted, events_rejected, events_flagged)
      values (p_run, p_user, p_career_started_at, p_state, p_server_xp, p_client_xp, p_base_kind, p_base_xp, p_rules_version, n_ok, n_bad, n_flag)
      on conflict do nothing;
    if not found then return 'conflicto'; end if;
  else
    update ceo.game_runs
       set state = p_state, server_xp = p_server_xp, client_xp = coalesce(p_client_xp, client_xp),
           rules_version = p_rules_version, version = version + 1,
           events_accepted = events_accepted + n_ok, events_rejected = events_rejected + n_bad,
           events_flagged = events_flagged + n_flag, updated_at = now()
     where run_id = p_run and user_id = p_user and version = p_version;
    if not found then return 'conflicto'; end if;
  end if;

  insert into ceo.game_events (user_id, run_id, event_id, seq, action, client_at, accepted, note)
    select p_user, p_run, (e->>'eventId')::uuid, (e->>'seq')::int, e->'action',
           to_timestamp(((e->>'at')::bigint) / 1000.0), (e->>'accepted')::boolean, nullif(e->>'note', '')
      from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) e
    on conflict (user_id, event_id) do nothing;
  return 'ok';
end $$;
revoke all on function ceo.journal_commit(uuid, uuid, timestamptz, int, jsonb, int, int, text, int, int, jsonb) from public;
grant execute on function ceo.journal_commit(uuid, uuid, timestamptz, int, jsonb, int, int, text, int, int, jsonb) to service_role;

-- 4 · Revisión: XP del navegador (ranking actual) vs. XP calculado por el servidor -----
create or replace function ceo.xp_comparacion(lim int default 100)
returns table (alias text, xp_ranking int, xp_servidor int, diferencia int, base_kind text, aceptadas int, rechazadas int, reloj_adelantado int, actualizado timestamptz)
language sql stable security definer set search_path = ceo, public as $$
  select p.alias, p.xp, r.server_xp, p.xp - r.server_xp, r.base_kind, r.events_accepted, r.events_rejected, r.events_flagged, r.updated_at
    from ceo.game_runs r
    join ceo.players p on p.user_id = r.user_id
   where r.updated_at = (select max(r2.updated_at) from ceo.game_runs r2 where r2.user_id = r.user_id)
   order by abs(p.xp - r.server_xp) desc, r.updated_at desc
   limit greatest(1, least(lim, 1000));
$$;
revoke all on function ceo.xp_comparacion(int) from public;
grant execute on function ceo.xp_comparacion(int) to service_role;

notify pgrst, 'reload schema';


-- ============================================================================
-- METIS · 0019 · mêtis CEO · Executive Decision Episodes (adenda v3.3) · PROPUESTA
-- Solo agrega cosas nuevas en el esquema "ceo". No borra ni cambia datos existentes
-- y no toca el esquema "metis" (Align). Idempotente: se puede correr varias veces.
-- Para deshacerla: docs/sql/0019_revertir.sql
--
--   1. ceo.episode_runs    → una fila por partida de episodio (estado, fase, XP una sola vez)
--   2. ceo.episode_turns   → diario de acciones del episodio (append-only, sin duplicados)
--   3. ceo.company_events  → memoria de la empresa: acuerdos, compromisos, riesgos, seguimientos
--   4. interruptor «episodes» en ceo.flags, APAGADO
--
-- Todo lo escribe solo el servidor (service_role). Cada jugador puede LEER lo suyo.
-- Mientras no se ejecute, el piloto guarda el episodio dentro de la partida (ceo.players.state).
-- ============================================================================

create schema if not exists ceo;

-- 1 · Partidas de episodio --------------------------------------------------------
create table if not exists ceo.episode_runs (
  run_id            text primary key,                        -- episodio + inicio (lo genera el motor)
  user_id           uuid not null references auth.users(id) on delete cascade,
  episode_id        text not null,
  episode_version   text not null,
  contract_version  int  not null default 1,
  company           text not null,
  phase             text not null check (phase in ('briefing', 'deciding', 'closed')),
  state             jsonb not null,                          -- EpisodeRun completo
  decisions         int  not null default 0,
  xp                int,                                     -- se fija una sola vez al cerrar
  started_at        timestamptz not null,
  closed_at         timestamptz,
  updated_at        timestamptz not null default now(),
  unique (user_id, episode_id, run_id)
);
create index if not exists episode_runs_user_idx on ceo.episode_runs (user_id, updated_at desc);
alter table ceo.episode_runs enable row level security;
drop policy if exists episode_runs_read_own on ceo.episode_runs;
create policy episode_runs_read_own on ceo.episode_runs for select using (user_id = auth.uid());
grant select on ceo.episode_runs to authenticated;
grant all privileges on ceo.episode_runs to service_role;

-- El XP no se puede cambiar una vez fijado (evita duplicar al recargar).
create or replace function ceo.episode_xp_once() returns trigger
language plpgsql as $$
begin
  if old.xp is not null and new.xp is distinct from old.xp then new.xp := old.xp; end if;
  return new;
end $$;
drop trigger if exists episode_runs_xp_once on ceo.episode_runs;
create trigger episode_runs_xp_once before update on ceo.episode_runs for each row execute function ceo.episode_xp_once();

-- 2 · Diario de acciones del episodio ----------------------------------------------
create table if not exists ceo.episode_turns (
  id               bigserial primary key,
  run_id           text not null references ceo.episode_runs(run_id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  seq              int  not null,
  kind             text not null check (kind in ('fact', 'advisor', 'begin', 'pause', 'resume', 'flexible', 'decide')),
  payload          jsonb not null default '{}'::jsonb,
  idempotency_key  text not null,
  client_at        timestamptz,                              -- hora del dispositivo (solo referencia)
  server_at        timestamptz not null default now(),
  unique (user_id, idempotency_key),
  unique (run_id, seq)
);
create index if not exists episode_turns_run_idx on ceo.episode_turns (run_id, seq);
alter table ceo.episode_turns enable row level security;
drop policy if exists episode_turns_read_own on ceo.episode_turns;
create policy episode_turns_read_own on ceo.episode_turns for select using (user_id = auth.uid());
grant select on ceo.episode_turns to authenticated;
grant all privileges on ceo.episode_turns to service_role;
grant usage, select on sequence ceo.episode_turns_id_seq to service_role;

-- 3 · Memoria de la empresa (eventos canónicos) --------------------------------------
create table if not exists ceo.company_events (
  event_id      text primary key,                            -- runId + tipo + id (estable: reintentos no duplican)
  user_id       uuid not null references auth.users(id) on delete cascade,
  company       text not null,
  run_id        text references ceo.episode_runs(run_id) on delete cascade,
  kind          text not null check (kind in ('acuerdo', 'compromiso', 'riesgo', 'relacion', 'kpi', 'seguimiento')),
  text          text not null,
  cause         jsonb not null,                              -- episodio, versión, nodo, estrategia
  rule          text not null,                               -- regla o fórmula que lo justifica
  data          jsonb not null default '{}'::jsonb,
  occurred_at   timestamptz not null,
  activates_at  timestamptz,                                 -- seguimientos: cuándo llegan
  resolved_at   timestamptz
);
create index if not exists company_events_user_idx on ceo.company_events (user_id, company, occurred_at desc);
create index if not exists company_events_due_idx  on ceo.company_events (activates_at) where activates_at is not null and resolved_at is null;
alter table ceo.company_events enable row level security;
drop policy if exists company_events_read_own on ceo.company_events;
create policy company_events_read_own on ceo.company_events for select using (user_id = auth.uid());
grant select on ceo.company_events to authenticated;
grant all privileges on ceo.company_events to service_role;

-- 4 · Interruptor (apagado) -------------------------------------------------------
insert into ceo.flags (key, enabled, note) values
  ('episodes', false, 'Executive Decision Episodes (adenda v3.3). Apagado hasta que Oziel apruebe el piloto.')
on conflict (key) do nothing;

notify pgrst, 'reload schema';


-- ============================================================================
-- PRENDER LA IA DEL CASO SUPERNORTE (solo para Oziel)
-- ============================================================================

-- Interruptor general de IA prendido.
update ceo.flags set enabled = true, updated_at = now() where key = 'ai';

-- Episodios en modo "solo invitados": apagado para todos, prendido para quien se invite.
update ceo.flags
   set enabled = false,
       value = jsonb_set(coalesce(value, '{}'::jsonb), '{perPlayer}', 'true'::jsonb),
       note = 'Piloto SuperNorte: solo jugadores invitados (players.flags.episodes = true).',
       updated_at = now()
 where key = 'episodes';

-- Invitar a Oziel (episodios + IA aceptada).
update ceo.players p
   set flags = coalesce(p.flags, '{}'::jsonb) || '{"episodes": true}'::jsonb,
       ai_consent = true,
       ai_consent_at = coalesce(p.ai_consent_at, now())
  from auth.users u
 where u.id = p.user_id
   and lower(u.email) = 'oziel.lemont@gmail.com';

notify pgrst, 'reload schema';

-- ============================================================================
-- VERIFICAR (lo último que muestra el editor). Debe salir:
--   ai = true · episodes = false con {"perPlayer": true} · tu correo con episodes true y ai_consent true
-- ============================================================================
select 'interruptor' as que, key as detalle, enabled::text as valor, value::text as extra
  from ceo.flags where key in ('ai', 'episodes')
union all
select 'jugador', u.email, p.ai_consent::text, p.flags::text
  from ceo.players p join auth.users u on u.id = p.user_id
 where lower(u.email) = 'oziel.lemont@gmail.com';

-- APAGAR (si algo no te gusta), correr solo estas líneas:
-- update ceo.flags set enabled = false, updated_at = now() where key = 'ai';
-- update ceo.players p set flags = p.flags - 'episodes' from auth.users u
--  where u.id = p.user_id and lower(u.email) = 'oziel.lemont@gmail.com';
