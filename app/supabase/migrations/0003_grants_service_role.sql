-- ============================================================================
-- METIS · 0003 · Permisos para service_role en el schema metis
-- El cron de recordatorios (/api/cron/recordatorios) usa la service_role key para
-- leer todas las empresas sin RLS. 0001 sólo otorgó privilegios sobre tablas a
-- `authenticated`; sin esto PostgREST responde "permission denied for table tenants".
-- Idempotente: se puede correr varias veces.
-- ============================================================================
grant usage on schema metis to service_role;
grant all privileges on all tables in schema metis to service_role;
grant all privileges on all sequences in schema metis to service_role;
grant execute on all functions in schema metis to service_role;
alter default privileges in schema metis grant all privileges on tables to service_role;
alter default privileges in schema metis grant all privileges on sequences to service_role;
alter default privileges in schema metis grant execute on functions to service_role;

-- authenticated también necesita usar las secuencias (ids seriales como notification_log_id_seq)
grant usage, select on all sequences in schema metis to authenticated;
alter default privileges in schema metis grant usage, select on sequences to authenticated;

-- Refrescar el caché de PostgREST para que tome los cambios sin esperar.
notify pgrst, 'reload schema';
