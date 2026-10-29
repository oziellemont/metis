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
