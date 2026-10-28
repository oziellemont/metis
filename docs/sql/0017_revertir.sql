-- Revierte 0017 (mêtis CEO · bitácora de importaciones). Se pierden los respaldos guardados ahí.
drop table if exists ceo.career_imports;
notify pgrst, 'reload schema';
