-- Revierte 0019 (mêtis CEO · Executive Decision Episodes). Se pierde lo guardado en estas tablas.
-- Las partidas de los jugadores no se tocan (viven en ceo.players y llevan su propia copia del episodio).
drop table if exists ceo.company_events;
drop table if exists ceo.episode_turns;
drop trigger if exists episode_runs_xp_once on ceo.episode_runs;
drop table if exists ceo.episode_runs;
drop function if exists ceo.episode_xp_once();
delete from ceo.flags where key = 'episodes';
notify pgrst, 'reload schema';
