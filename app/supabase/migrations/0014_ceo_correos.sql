-- ============================================================================
-- METIS · 0014 · mêtis CEO · correos
-- Agrega la "bitácora" de avisos enviados a cada jugador, para que ningún
-- correo salga dos veces (bienvenida, asuntos, recordatorios, resumen, etc.).
-- Idempotente (se puede correr varias veces). No toca el esquema "metis".
-- ============================================================================

alter table ceo.players add column if not exists sent jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
