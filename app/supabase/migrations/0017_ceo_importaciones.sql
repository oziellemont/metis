-- ============================================================================
-- METIS · 0017 · mêtis CEO · bitácora de importaciones de progreso (adenda v3.2 §3)
-- Solo agrega una tabla nueva en el esquema "ceo". No toca datos existentes ni el
-- esquema "metis" (Align). Idempotente. Para deshacerla: docs/sql/0017_revertir.sql
--
-- Cada vez que alguien trae a su cuenta la carrera que tenía guardada en el navegador
-- queda un renglón aquí, con un import_id que genera el dispositivo (reintentar no
-- duplica). Si la importación REEMPLAZÓ una carrera que ya estaba en la cuenta, la
-- carrera anterior se guarda completa en replaced_state para poder recuperarla.
--
-- Solo la escribe el servidor (service_role). Cada jugador puede LEER las suyas.
-- ============================================================================

create schema if not exists ceo;

create table if not exists ceo.career_imports (
  import_id          uuid primary key,                        -- generado en el dispositivo
  user_id            uuid not null references auth.users(id) on delete cascade,
  mode               text not null check (mode in ('vacia', 'reemplazar')),
  legacy_company_id  text not null,
  rules_version      int  not null,
  catalog_version    int  not null,
  local_saved_at     timestamptz,
  xp                 int  not null default 0,                  -- XP calculado por el servidor al importar
  decisions          int  not null default 0,
  warnings           text[] not null default '{}',
  replaced_state     jsonb,                                    -- carrera de la cuenta que se reemplazó (respaldo)
  created_at         timestamptz not null default now()
);
create index if not exists career_imports_user_idx on ceo.career_imports (user_id, created_at desc);

alter table ceo.career_imports enable row level security;
drop policy if exists career_imports_read_own on ceo.career_imports;
create policy career_imports_read_own on ceo.career_imports for select
  using (user_id = auth.uid());
grant select on ceo.career_imports to authenticated;
grant all privileges on ceo.career_imports to service_role;

notify pgrst, 'reload schema';
