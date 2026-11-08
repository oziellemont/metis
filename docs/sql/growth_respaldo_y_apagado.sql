-- ============================================================================
-- mêtis CEO · Growth Engine (Empresa emergente) · respaldo e interruptor
-- Correr en Supabase → SQL Editor, en el proyecto de PRODUCCIÓN.
-- No borra nada. Cada bloque se puede correr varias veces.
--
-- Cómo funciona el interruptor (código en app/src/lib/ceo/flags.ts):
--   · Sin fila 'growth_engine' en ceo.flags → la Empresa emergente queda PRENDIDA para todos.
--   · Fila con enabled = false              → APAGADA para todos (tarda hasta 60 segundos).
--   · Si la base no responde                 → apagada (nunca se prende por error).
-- Apagarla NO borra ni cambia partidas: quien ya abrió una emergente la conserva guardada;
-- solo se ocultan la opción de abrir una nueva y el acceso de la demostración.
-- ============================================================================

-- PASO 1 · RESPALDO (antes del despliegue, o en cualquier momento). Copia completa de todas las partidas.
create table if not exists ceo.players_backup_growth (
  backup_at  timestamptz not null default now(),
  user_id    uuid        not null,
  state      jsonb       not null,
  xp         int,
  updated_at timestamptz,
  primary key (backup_at, user_id)
);
alter table ceo.players_backup_growth enable row level security;   -- solo la llave de servicio la lee
insert into ceo.players_backup_growth (backup_at, user_id, state, xp, updated_at)
select now(), user_id, state, xp, updated_at from ceo.players;

-- Verificar: debe salir un respaldo con tantas filas como jugadores.
select backup_at, count(*) as partidas from ceo.players_backup_growth group by backup_at order by backup_at desc;
select count(*) as jugadores from ceo.players;

-- PASO 2 · VER el estado actual del interruptor (vacío = prendido por omisión).
select key, enabled, value, note, updated_at from ceo.flags where key = 'growth_engine';

-- ============================================================================
-- APAGAR RÁPIDO (interruptor de emergencia). Efecto en ≤ 60 s, sin desplegar nada.
-- ============================================================================
-- insert into ceo.flags (key, enabled, note) values ('growth_engine', false, 'Apagado de emergencia')
-- on conflict (key) do update set enabled = false, value = '{}'::jsonb, note = 'Apagado de emergencia', updated_at = now();

-- ============================================================================
-- VOLVER A PRENDER para todos
-- ============================================================================
-- update ceo.flags set enabled = true, value = '{}'::jsonb, note = 'Prendido', updated_at = now() where key = 'growth_engine';

-- ============================================================================
-- SOLO CUENTAS PILOTO (apagado para los demás, prendido para quien se invite)
-- ============================================================================
-- insert into ceo.flags (key, enabled, value, note) values ('growth_engine', false, '{"perPlayer": true}'::jsonb, 'Solo cuentas piloto')
-- on conflict (key) do update set enabled = false, value = '{"perPlayer": true}'::jsonb, note = 'Solo cuentas piloto', updated_at = now();
-- update ceo.players p set flags = coalesce(p.flags, '{}'::jsonb) || '{"growth_engine": true}'::jsonb
--   from auth.users u where u.id = p.user_id and lower(u.email) in ('oziel.lemont@gmail.com' /*, 'segunda.cuenta@correo.com' */);

-- ============================================================================
-- RESTAURAR la partida de UNA cuenta desde el último respaldo (solo si hiciera falta).
-- Ojo: reemplaza su partida actual por la respaldada. Cambia el correo antes de correrlo.
-- ============================================================================
-- update ceo.players p set state = b.state, updated_at = now()
--   from ceo.players_backup_growth b, auth.users u
--  where b.user_id = p.user_id and u.id = p.user_id and lower(u.email) = 'oziel.lemont@gmail.com'
--    and b.backup_at = (select max(backup_at) from ceo.players_backup_growth where user_id = p.user_id);
