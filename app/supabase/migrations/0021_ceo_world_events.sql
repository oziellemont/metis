-- ============================================================================
-- METIS · 0021 · mêtis CEO · World Events (acontecimientos reales)
-- Registra el interruptor «world_events» en modo «solo invitados» (piloto opt-in, según la estrategia B):
--   enabled = false y value.perPlayer = true → solo lo ven los jugadores con ceo.players.flags.world_events = true.
--   value.off = []  → apagado rápido por familia (clima, sismo, macro). Se aplica en ≤ 60 s.
-- Además cada jugador debe activar «Acontecimientos reales en mi carrera» en Ajustes.
-- No crea tablas: los episodios viven en la partida (ceo.players.state.growth.world) y el diario de jugadas.
-- Idempotente (no pisa una fila ya ajustada). Para deshacerla: ver docs/sql/0021_revertir.sql.
-- ============================================================================

insert into ceo.flags (key, enabled, value, note) values
  ('world_events', false, '{"perPlayer": true, "off": []}'::jsonb, 'World Events: piloto opt-in. Prender para todos: enabled = true. Apagar una familia: value.off = ["clima"].')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
