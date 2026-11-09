-- ============================================================================
-- METIS · 0022 · mêtis CEO · avisos al celular (Web Push, gratis)
-- Una fila por navegador o celular donde el jugador tocó «Activar avisos en este celular».
-- Solo AGREGA una tabla nueva en el esquema "ceo". No borra ni cambia datos y no toca "metis" (Align).
-- Idempotente. Para deshacerla: docs/sql/0022_revertir.sql
-- ============================================================================

create table if not exists ceo.push_subscriptions (
  endpoint    text primary key,                                         -- dirección única que da el navegador
  user_id     uuid not null references auth.users(id) on delete cascade,
  p256dh      text not null,
  auth        text not null,
  user_agent  text not null default '',
  created_at  timestamptz not null default now(),
  last_ok_at  timestamptz
);
create index if not exists push_subscriptions_user_idx on ceo.push_subscriptions (user_id);

alter table ceo.push_subscriptions enable row level security;
drop policy if exists push_subscriptions_own on ceo.push_subscriptions;
create policy push_subscriptions_own on ceo.push_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on ceo.push_subscriptions to authenticated;
grant all on ceo.push_subscriptions to service_role;

notify pgrst, 'reload schema';
