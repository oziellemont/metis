-- ============================================================================
-- mêtis CEO · Prender la IA del caso SuperNorte (solo para Oziel)
-- Correr en Supabase → SQL Editor, en el proyecto de PRODUCCIÓN, DESPUÉS de 0019.
-- No borra nada. Se puede correr varias veces. Para apagar: ver el final.
-- ============================================================================

-- PASO 0 · ¿Ya está 0019? Debe salir 3 tablas y 1 fila "episodes".
select table_name from information_schema.tables
 where table_schema = 'ceo' and table_name in ('episode_runs', 'episode_turns', 'company_events');
select key, enabled, value from ceo.flags where key = 'episodes';
-- Si sale vacío: primero corre app/supabase/migrations/0019_ceo_episodios.sql (completo) y vuelve aquí.

-- PASO 1 · Interruptor general de IA prendido (ya lo tenías; esto solo lo confirma).
update ceo.flags set enabled = true, updated_at = now() where key = 'ai';

-- PASO 2 · Episodios en modo "solo invitados": apagado para todos, prendido para quien se invite.
update ceo.flags
   set enabled = false,
       value = jsonb_set(coalesce(value, '{}'::jsonb), '{perPlayer}', 'true'::jsonb),
       note = 'Piloto SuperNorte: solo jugadores invitados (players.flags.episodes = true).',
       updated_at = now()
 where key = 'episodes';

-- PASO 3 · Invitar a Oziel (episodios + IA aceptada).
update ceo.players p
   set flags = coalesce(p.flags, '{}'::jsonb) || '{"episodes": true}'::jsonb,
       ai_consent = true,
       ai_consent_at = coalesce(p.ai_consent_at, now())
  from auth.users u
 where u.id = p.user_id
   and lower(u.email) = 'oziel.lemont@gmail.com';

-- PASO 4 · Verificar. Debe salir: ai = true · episodes = false con perPlayer · tu fila con episodes true y ai_consent true.
select key, enabled, value from ceo.flags where key in ('ai', 'episodes');
select u.email, p.flags, p.ai_consent
  from ceo.players p join auth.users u on u.id = p.user_id
 where lower(u.email) = 'oziel.lemont@gmail.com';

-- Después de jugar, para ver cuántas llamadas hizo el caso y cuánto costaron:
-- select purpose, status, count(*), round(sum(cost_usd)::numeric, 4) as usd
--   from ceo.ai_calls where purpose like 'episodio_%' group by 1, 2 order by 1;

-- APAGAR (si algo no te gusta):
-- update ceo.players p set flags = p.flags - 'episodes' from auth.users u
--  where u.id = p.user_id and lower(u.email) = 'oziel.lemont@gmail.com';
