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
