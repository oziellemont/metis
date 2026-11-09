-- ============================================================================
-- mêtis CEO · World Events · prender, invitar y apagar (correr en Supabase → SQL Editor)
-- Los cambios aplican en ≤ 60 s (caché de interruptores).
-- ============================================================================

-- 1) Invitar a un jugador piloto (modo «solo invitados»). Cambia el correo:
update ceo.players set flags = coalesce(flags, '{}'::jsonb) || '{"world_events": true}'::jsonb
where email = 'correo@ejemplo.com';

-- 2) Prender para TODOS (cuando pase QA). El jugador igual decide en Ajustes:
-- update ceo.flags set enabled = true where key = 'world_events';

-- 3) Apagado rápido de una familia (p. ej. clima) sin apagar las demás:
-- update ceo.flags set value = jsonb_set(coalesce(value, '{}'::jsonb), '{off}', '["clima"]'::jsonb) where key = 'world_events';
-- Volver a prenderla:
-- update ceo.flags set value = jsonb_set(coalesce(value, '{}'::jsonb), '{off}', '[]'::jsonb) where key = 'world_events';

-- 4) Apagado total de emergencia (nadie recibe acontecimientos nuevos):
-- update ceo.flags set enabled = false, value = '{"perPlayer": false, "off": []}'::jsonb where key = 'world_events';

-- 5) Ver el estado actual:
select key, enabled, value, note from ceo.flags where key = 'world_events';
