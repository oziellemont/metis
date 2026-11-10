-- Deshace 0024 (MÊTIS Assess v1). Borra SOLO las tablas assess_*; MÊTIS CEO y Align no se tocan.
-- Ojo: se pierden las vacantes, candidatos y respuestas del piloto.
drop table if exists public.assess_answers;
drop table if exists public.assess_candidates;
drop table if exists public.assess_vacancies;
drop table if exists public.assess_pilots;
notify pgrst, 'reload schema';
