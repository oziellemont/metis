-- ============================================================================
-- METIS · Revertir 0015 (solo si hiciera falta). Borra ÚNICAMENTE lo que agregó
-- la 0015. No toca ceo.players salvo las 3 columnas nuevas, ni el esquema metis.
-- ⚠️ Borra los datos guardados en esas tablas nuevas.
-- ============================================================================
drop function if exists ceo.ai_ajustar(text, text, numeric);
drop function if exists ceo.ai_reservar(text, text, numeric, numeric);
drop table if exists ceo.game_events;
drop table if exists ceo.ai_quota;
drop table if exists ceo.ai_calls;
drop table if exists ceo.product_events;
drop table if exists ceo.flags;
alter table ceo.players drop column if exists ai_consent_at;
alter table ceo.players drop column if exists ai_consent;
alter table ceo.players drop column if exists flags;
notify pgrst, 'reload schema';
