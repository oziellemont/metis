-- ============================================================================
-- METIS · 0020 · mêtis CEO · carrera continua (P0-B2/B3)
-- Registra el interruptor «carrera_continua» ENCENDIDO para todos (decisión de Oziel, 2-nov-2026:
-- todo va a producción para todos). Hoy es solo informativo: el onboarding nuevo no depende de él.
-- No crea tablas ni toca datos. La identidad de la empresa vive en la partida (ceo.players.state.companyProfile).
-- Idempotente. Para deshacerla: delete from ceo.flags where key = 'carrera_continua';
-- ============================================================================

insert into ceo.flags (key, enabled, note) values
  ('carrera_continua', true, 'Carrera continua (P0). Encendida para todos. Informativa: el onboarding nuevo no depende de esta fila.')
on conflict (key) do update set enabled = excluded.enabled, note = excluded.note;

notify pgrst, 'reload schema';
