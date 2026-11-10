-- ============================================================================
-- METIS · 0023 · mêtis CEO · secretos del servidor (llaves de avisos al celular)
-- Tabla que SOLO puede leer y escribir el servidor (service_role). Ningún jugador, ni con sesión, puede verla:
-- RLS activo sin políticas para "anon" ni "authenticated" y permisos revocados.
-- El servidor genera aquí, una sola vez, el par de llaves VAPID: nadie las escribe a mano ni se comparten.
-- Solo AGREGA una tabla nueva en el esquema "ceo". Idempotente. Para deshacerla: docs/sql/0023_revertir.sql
-- ============================================================================

create table if not exists ceo.server_secrets (
  name        text primary key,
  value       jsonb not null,
  created_at  timestamptz not null default now()
);

alter table ceo.server_secrets enable row level security;
revoke all on ceo.server_secrets from public;
revoke all on ceo.server_secrets from anon;
revoke all on ceo.server_secrets from authenticated;
grant select, insert on ceo.server_secrets to service_role;

notify pgrst, 'reload schema';
