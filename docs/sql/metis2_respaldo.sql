-- ============================================================================
-- mêtis CEO · MÊTIS 2.0 · RESPALDO antes del rediseño
-- Correr en Supabase → SQL Editor, en el proyecto de PRODUCCIÓN.
--
-- Qué hace:
--   PASO 1 · Guarda una copia completa de la fila de cada jugador (partida, avance,
--            perfil, preferencias y avisos) en una tabla aparte.
--   PASO 2 · Solo LEE: confirma que la copia tiene tantas filas como jugadores.
--
-- No borra ni modifica partidas. No toca el esquema "metis" (Align).
-- Se puede correr varias veces: cada corrida agrega una copia nueva con su fecha.
-- La tabla de respaldo solo la puede leer el equipo (llave de servicio y este editor).
-- ============================================================================

-- PASO 1 · RESPALDO ----------------------------------------------------------
create table if not exists ceo.players_backup_metis2 (
  backup_at  timestamptz not null default now(),
  user_id    uuid        not null,
  fila       jsonb       not null,      -- la fila completa de ceo.players, con todas sus columnas
  primary key (backup_at, user_id)
);
alter table ceo.players_backup_metis2 enable row level security;   -- sin políticas: ningún navegador la lee

insert into ceo.players_backup_metis2 (backup_at, user_id, fila)
select now(), p.user_id, to_jsonb(p) from ceo.players p;

-- PASO 2 · VERIFICAR (solo lee) ----------------------------------------------
-- La copia más reciente debe tener las mismas filas que «jugadores».
select backup_at, count(*) as partidas_respaldadas
  from ceo.players_backup_metis2 group by backup_at order by backup_at desc;
select count(*) as jugadores from ceo.players;

-- ============================================================================
-- RECUPERAR (solo si hiciera falta; viene comentado a propósito).
-- Devuelve a UN jugador la partida de la copia más reciente. Cambia el correo.
-- Solo regresa la partida y sus puntos; no toca correo, teléfono ni preferencias.
-- ============================================================================
-- update ceo.players p
--    set state = b.fila -> 'state',
--        xp    = (b.fila ->> 'xp')::int,
--        updated_at = now()
--   from ceo.players_backup_metis2 b
--  where b.user_id = p.user_id
--    and b.backup_at = (select max(backup_at) from ceo.players_backup_metis2)
--    and p.email = 'correo@ejemplo.com';

-- ============================================================================
-- QUITAR EL RESPALDO (solo cuando ya no se necesite; viene comentado).
-- ============================================================================
-- drop table if exists ceo.players_backup_metis2;
