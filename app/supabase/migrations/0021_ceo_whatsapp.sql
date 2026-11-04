-- ============================================================================
-- METIS · 0021 · mêtis CEO · WhatsApp real (Meta WhatsApp Business Cloud API)
-- Agrega columnas NUEVAS (no toca las existentes ni los datos) y una bitácora de envíos.
--   · wa_phone / wa_verified_at   número verificado con código (OTP)
--   · wa_consent_at / wa_revoked_at  consentimiento explícito y separado, y su revocación (app o «BAJA»)
--   · wa_channel                   email | whatsapp | ambos   (por omisión: email)
--   · wa_sent                      claves de lo que ya salió por WhatsApp (separado de `sent`, el del correo)
--   · ceo.wa_otp                   códigos de verificación (solo el hash; caducan en 10 min)
--   · ceo.wa_messages              bitácora: plantilla, estado de entrega y error de cada mensaje
-- Interruptor «whatsapp» APAGADO. El campo viejo notify_whatsapp ya no abre el canal.
-- Idempotente. Para deshacerla: docs/sql/0021_revertir.sql
-- ============================================================================

alter table ceo.players add column if not exists wa_phone       text;
alter table ceo.players add column if not exists wa_verified_at timestamptz;
alter table ceo.players add column if not exists wa_consent_at  timestamptz;
alter table ceo.players add column if not exists wa_revoked_at  timestamptz;
alter table ceo.players add column if not exists wa_channel     text not null default 'email';
alter table ceo.players add column if not exists wa_sent        jsonb not null default '{}'::jsonb;
do $$ begin
  alter table ceo.players add constraint players_wa_channel_chk check (wa_channel in ('email', 'whatsapp', 'ambos'));
exception when duplicate_object then null; end $$;

create table if not exists ceo.wa_otp (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  phone       text not null,
  code_hash   text not null,
  attempts    int  not null default 0,
  sent_at     timestamptz not null default now(),
  expires_at  timestamptz not null
);
alter table ceo.wa_otp enable row level security;
grant all privileges on ceo.wa_otp to service_role;

create table if not exists ceo.wa_messages (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  phone       text not null,
  kind        text not null,                 -- asunto | recordatorio | codigo
  job_key     text,                          -- case:<id> | rem:<id> (sin duplicados por jugador)
  template    text not null,
  wamid       text unique,                   -- id que devuelve Meta
  status      text not null default 'queued', -- queued | dry_run | sent | delivered | read | failed | error
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists wa_messages_job_once on ceo.wa_messages (user_id, job_key) where job_key is not null;
create index if not exists wa_messages_user_idx on ceo.wa_messages (user_id, created_at desc);
alter table ceo.wa_messages enable row level security;
grant all privileges on ceo.wa_messages to service_role;
grant usage, select on sequence ceo.wa_messages_id_seq to service_role;

insert into ceo.flags (key, enabled, value, note) values
  ('whatsapp', false, '{"perPlayer": true}'::jsonb, 'WhatsApp real (Meta Cloud API). Apagado. Además exige CEO_WHATSAPP_ALLOWLIST, número verificado y consentimiento.')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
