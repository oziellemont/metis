-- =============================================================================
-- METIS · 0011 · Revisiones Verticales (RV) automáticas · 1 a 1
--
--  - Nuevo tipo de sesión 'rv': el jefe directo con UNO de sus reportes directos.
--  - mêtis las agenda solo (cron diario) cada 6 semanas o bimestral, si el admin lo activa
--    en Configuración → Notificaciones (tenants.settings.rv = { enabled, cadenceWeeks }).
--  - Invitación de calendario (.ics) por correo y recordatorios −3, −1, el mismo día y,
--    si ya pasó la fecha, diario hasta que el jefe la cierre en mêtis.
--  - Solo el jefe (o un admin) puede reagendar: la política sessions_leader_write ya lo cubre.
--
-- Idempotente: se puede correr más de una vez.
-- =============================================================================

-- ------------------------------------------------------------ 1. sessions ---
alter table metis.sessions drop constraint if exists sessions_kind_check;
alter table metis.sessions add constraint sessions_kind_check check (kind in ('wtw', 'wtm', 'rv'));

alter table metis.sessions add column if not exists participant_id uuid references metis.profiles(id) on delete cascade;
alter table metis.sessions add column if not exists auto           boolean not null default false;
-- Fecha para la que ya se mandó la invitación de calendario (si cambia scheduled_at, se reenvía).
alter table metis.sessions add column if not exists invited_for    timestamptz;

-- Una RV siempre tiene participante; las demás no.
alter table metis.sessions drop constraint if exists sessions_rv_participant_check;
alter table metis.sessions add constraint sessions_rv_participant_check
  check ((kind = 'rv') = (participant_id is not null));

-- Solo una RV abierta por pareja jefe → colaborador (evita duplicados del cron).
create unique index if not exists sessions_rv_open_pair_idx
  on metis.sessions (tenant_id, leader_id, participant_id)
  where kind = 'rv' and status <> 'closed';
create index if not exists sessions_participant_idx on metis.sessions (tenant_id, participant_id, scheduled_at desc) where participant_id is not null;

drop trigger if exists trg_tenant_guard on metis.sessions;
create trigger trg_tenant_guard before insert or update on metis.sessions
  for each row execute function metis.assert_same_tenant('leader_id', '@member', 'scope_id', 'scopes', 'created_by', '@member', 'participant_id', '@member');

-- ---------------------------------------------------- 2. notification_log ---
-- Para no repetir el mismo recordatorio de la misma sesión.
alter table metis.notification_log add column if not exists session_id uuid references metis.sessions(id) on delete set null;
create index if not exists notification_log_session_idx on metis.notification_log (session_id, kind, sent_at desc) where session_id is not null;
