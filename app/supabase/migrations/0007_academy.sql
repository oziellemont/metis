-- ============================================================================
-- METIS · 0007 · Metis Academy
-- Avance de cada persona en los módulos de aprendizaje (obligatorios al entrar).
-- El avance es por PERSONA (no por empresa): si alguien pertenece a dos empresas,
-- solo toma la Academia una vez. Idempotente.
-- ============================================================================

create table if not exists metis.academy_progress (
  user_id     uuid not null references metis.profiles(id) on delete cascade,
  module_id   text not null,
  best_score  int  not null default 0 check (best_score between 0 and 100),
  attempts    int  not null default 0,
  passed_at   timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table metis.academy_progress enable row level security;

-- Cada quien ve y guarda su propio avance.
drop policy if exists academy_self on metis.academy_progress;
create policy academy_self on metis.academy_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Administradores y jefes ven el avance de la gente de su empresa.
drop policy if exists academy_tenant_admin on metis.academy_progress;
create policy academy_tenant_admin on metis.academy_progress for select
  using (exists (
    select 1 from metis.memberships m
    where m.user_id = metis.academy_progress.user_id and m.active
      and metis.has_role(m.tenant_id, 'owner', 'admin', 'manager')
  ));

grant select, insert, update on metis.academy_progress to authenticated;
grant all privileges on metis.academy_progress to service_role;

create index if not exists notification_log_academy_idx on metis.notification_log (user_id, kind, sent_at desc);
