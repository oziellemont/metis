-- ============================================================================
-- METIS · 0020 · mêtis CEO · carrera continua (P0-B2) · PROPUESTA
-- Solo agrega el interruptor «carrera_continua», APAGADO. No crea tablas ni toca datos.
-- La identidad de la empresa vive por ahora dentro de la partida (ceo.players.state.companyProfile).
-- Idempotente. Para deshacerla: delete from ceo.flags where key = 'carrera_continua';
-- ============================================================================

insert into ceo.flags (key, enabled, note) values
  ('carrera_continua', false, 'Carrera continua (P0). Apagado hasta que Oziel apruebe el nuevo onboarding. Se puede prender solo para invitados con value = {"perPlayer": true}.')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
