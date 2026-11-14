-- ============================================================================
-- MÊTIS 2.0 · Deshacer 0025 (PROPUESTA, sin ejecutar).
-- Borra SOLO el esquema nuevo «metis2». No toca «ceo» (partidas) ni «metis» (Align).
--
-- Antes de correrlo, si ya hubo intentos reales, guarda una copia:
--   create table ceo.metis2_copia_intentos as select * from metis2.intentos;
--   create table ceo.metis2_copia_respuestas as select * from metis2.respuestas;
--   create table ceo.metis2_copia_revisiones as select * from metis2.revisiones;
-- ============================================================================

drop schema if exists metis2 cascade;

-- Comprobación (solo lee): debe salir 0.
select count(*) as esquemas_metis2 from pg_namespace where nspname = 'metis2';
