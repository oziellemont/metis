-- Revierte 0018 (mêtis CEO · diario de jugadas en modo sombra). Se pierde lo que el servidor haya calculado.
-- Las partidas de los jugadores no se tocan (viven en ceo.players).
drop function if exists ceo.xp_comparacion(int);
drop function if exists ceo.journal_commit(uuid, uuid, timestamptz, int, jsonb, int, int, text, int, int, jsonb);
drop table if exists ceo.game_runs;
drop index if exists ceo.game_events_run_seq_idx;
alter table ceo.game_events drop column if exists run_id;
notify pgrst, 'reload schema';
