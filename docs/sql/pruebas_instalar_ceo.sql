-- ============================================================================
-- SOLO PARA EL PROYECTO DE PRUEBAS «metis-pruebas». NO correr en producción.
-- Junta 0013 + 0014 + 0015 en un solo paso. Idempotente.
-- ============================================================================

-- ============================================================================
-- METIS · 0013 · mêtis CEO (metisalign.app)
-- Apartado SEPARADO dentro de la misma base: esquema "ceo".
-- No toca nada del esquema "metis". Idempotente (se puede correr varias veces).
--
-- Después de correrla: Supabase → Project Settings → API → "Exposed schemas"
-- y agregar  ceo  (junto a public y metis). Guardar.
-- ============================================================================

create schema if not exists ceo;
grant usage on schema ceo to anon, authenticated, service_role;

-- Un jugador = una persona con cuenta. El avance completo vive en "state" (jsonb);
-- las demás columnas son copias para ranking y para el envío de correo/WhatsApp.
create table if not exists ceo.players (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  alias            text not null default 'CEO',
  name             text not null default '',
  state            jsonb not null default '{}'::jsonb,
  xp               int  not null default 0,
  level            text not null default 'Gerente',
  streak           int  not null default 0,
  best_streak      int  not null default 0,
  health           int  not null default 0,
  decisions        int  not null default 0,
  email            text,
  phone            text,
  notify_email     boolean not null default true,
  notify_whatsapp  boolean not null default false,
  tz               text not null default 'America/Monterrey',
  last_notified_at timestamptz,
  last_streak_at   date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists players_xp_idx on ceo.players (xp desc);

alter table ceo.players enable row level security;

-- Cada quien lee y guarda SOLO su propia fila.
drop policy if exists players_self on ceo.players;
create policy players_self on ceo.players for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on ceo.players to authenticated;
grant all privileges on ceo.players to service_role;

-- Ranking público: solo alias y números (nunca correo, teléfono ni decisiones).
create or replace function ceo.leaderboard(lim int default 30)
returns table (alias text, xp int, level text, streak int, health int)
language sql stable security definer set search_path = ceo, public as $$
  select p.alias, p.xp, p.level, p.streak, p.health
  from ceo.players p
  where p.decisions > 0
  order by p.xp desc, p.updated_at asc
  limit greatest(1, least(lim, 100));
$$;

revoke all on function ceo.leaderboard(int) from public;
grant execute on function ceo.leaderboard(int) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
notify pgrst, 'reload config';

-- ============================================================================
-- METIS · 0014 · mêtis CEO · correos
-- Agrega la "bitácora" de avisos enviados a cada jugador, para que ningún
-- correo salga dos veces (bienvenida, asuntos, recordatorios, resumen, etc.).
-- Idempotente (se puede correr varias veces). No toca el esquema "metis".
-- ============================================================================

alter table ceo.players add column if not exists sent jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';

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

-- Verificación: debe mostrar 6 tablas y 5 interruptores apagados.
select (select count(*) from information_schema.tables where table_schema = 'ceo') as tablas_ceo,
       (select count(*) from ceo.flags where enabled = false) as interruptores_apagados;
