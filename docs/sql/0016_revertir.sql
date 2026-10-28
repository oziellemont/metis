-- Revierte 0016 (mêtis CEO · perfil de onboarding e interés en industrias).
-- Borra SOLO lo que agregó 0016. Los datos de esas columnas se pierden.
drop table if exists ceo.industry_interest;
alter table ceo.players drop constraint if exists players_daily_goal_chk;
alter table ceo.players drop constraint if exists players_session_minutes_chk;
alter table ceo.players drop constraint if exists players_notify_window_chk;
alter table ceo.players
  drop column if exists onboarding_version,
  drop column if exists professional_level,
  drop column if exists functional_area,
  drop column if exists experience_band,
  drop column if exists learning_goal,
  drop column if exists home_industry_id,
  drop column if exists home_company_variant_id,
  drop column if exists daily_decision_goal,
  drop column if exists preferred_session_minutes,
  drop column if exists notify_window_start,
  drop column if exists notify_window_end,
  drop column if exists onboarding_completed_at;
notify pgrst, 'reload schema';
