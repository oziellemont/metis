-- Revierte 0021 (World Events). Los episodios ya guardados en las partidas se quedan, pero dejan de llegar nuevos.
delete from ceo.flags where key = 'world_events';
notify pgrst, 'reload schema';
