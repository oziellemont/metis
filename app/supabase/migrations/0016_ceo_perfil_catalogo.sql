-- ============================================================================
-- METIS · 0016 · mêtis CEO · perfil de onboarding e interés en industrias
-- Adenda v3.2 §4 y §6. Solo AGREGA columnas opcionales y una tabla nueva en el
-- esquema "ceo". No borra ni cambia datos y no toca "metis" (Align).
-- Idempotente. Para deshacerla: docs/sql/0016_revertir.sql
--
--   1. players: campos del onboarding (todos opcionales; quien ya juega no cambia)
--   2. ceo.industry_interest: «Me interesa» en industrias/empresas «Próximamente»
--
-- El catálogo de industrias vive versionado en el código (lib/ceo/catalog.ts);
-- aquí solo se guardan ids. El servidor valida el par industria–empresa.
-- ============================================================================

-- 1 · Perfil de onboarding ---------------------------------------------------
alter table ceo.players add column if not exists onboarding_version       int;
alter table ceo.players add column if not exists professional_level       text;
alter table ceo.players add column if not exists functional_area          text;
alter table ceo.players add column if not exists experience_band          text;
alter table ceo.players add column if not exists learning_goal            text;
alter table ceo.players add column if not exists home_industry_id         text;
alter table ceo.players add column if not exists home_company_variant_id  text;
alter table ceo.players add column if not exists daily_decision_goal      smallint;
alter table ceo.players add column if not exists preferred_session_minutes smallint;
alter table ceo.players add column if not exists notify_window_start      smallint;
alter table ceo.players add column if not exists notify_window_end        smallint;
alter table ceo.players add column if not exists onboarding_completed_at  timestamptz;

do $$ begin
  alter table ceo.players add constraint players_daily_goal_chk check (daily_decision_goal is null or daily_decision_goal between 1 and 3);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table ceo.players add constraint players_session_minutes_chk check (preferred_session_minutes is null or preferred_session_minutes in (3, 5, 8, 12));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table ceo.players add constraint players_notify_window_chk check (
    (notify_window_start is null or notify_window_start between 0 and 23) and
    (notify_window_end   is null or notify_window_end   between 0 and 23));
exception when duplicate_object then null; end $$;

-- 2 · Interés en industrias «Próximamente» -----------------------------------
create table if not exists ceo.industry_interest (
  user_id      uuid not null references auth.users(id) on delete cascade,
  industry_id  text not null,
  company_id   text not null default '',          -- '' = la industria en general
  created_at   timestamptz not null default now(),
  primary key (user_id, industry_id, company_id)
);
alter table ceo.industry_interest enable row level security;
drop policy if exists industry_interest_own on ceo.industry_interest;
create policy industry_interest_own on ceo.industry_interest for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, delete on ceo.industry_interest to authenticated;
grant all privileges on ceo.industry_interest to service_role;

notify pgrst, 'reload schema';
