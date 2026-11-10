-- ============================================================================
-- METIS · 0024 · MÊTIS Assess v1 (piloto B2B)
-- Tablas NUEVAS y separadas (prefijo assess_). No toca los esquemas "ceo" ni "metis":
-- ninguna partida, jugador, aviso ni dato de Align cambia.
--
-- Seguridad:
--   - RLS activo y SIN políticas para anon/authenticated: solo el servidor (service_role) lee y escribe.
--     La app valida dueño de la vacante y enlace del candidato antes de cada operación.
--   - Del enlace del candidato solo se guarda su huella (sha-256), nunca el enlace.
--   - Toda vacante es "piloto" (check): no existe modo de contratación real hasta validar.
--   - Una respuesta por candidato y caso (llave primaria): reintentos no duplican.
-- Idempotente. Para deshacerla: docs/sql/0024_revertir.sql
-- ============================================================================

create table if not exists public.assess_pilots (
  email       text primary key check (email = lower(email)),
  note        text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.assess_vacancies (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 3 and 80),
  industry    text not null check (industry in ('retail', 'acero')),
  weights     jsonb not null default '{}'::jsonb,
  mode        text not null default 'piloto' check (mode = 'piloto'),
  created_at  timestamptz not null default now()
);
create index if not exists assess_vacancies_owner on public.assess_vacancies(owner, created_at desc);

create table if not exists public.assess_candidates (
  id           uuid primary key default gen_random_uuid(),
  vacancy_id   uuid not null references public.assess_vacancies(id) on delete cascade,
  label        text not null check (char_length(label) between 2 and 60),
  email        text,
  token_hash   text not null unique check (char_length(token_hash) = 64),
  status       text not null default 'invitado' check (status in ('invitado', 'en_curso', 'terminado')),
  consent_at   timestamptz,
  finished_at  timestamptz,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);
create index if not exists assess_candidates_vacancy on public.assess_candidates(vacancy_id);

create table if not exists public.assess_answers (
  candidate_id  uuid not null references public.assess_candidates(id) on delete cascade,
  case_id       text not null check (char_length(case_id) between 2 and 40),
  option_id     text not null check (char_length(option_id) between 1 and 40),
  reasoning     text not null check (char_length(reasoning) between 10 and 1200),
  ms            int  not null default 0 check (ms between 0 and 7200000),
  created_at    timestamptz not null default now(),
  primary key (candidate_id, case_id)
);

alter table public.assess_pilots     enable row level security;
alter table public.assess_vacancies  enable row level security;
alter table public.assess_candidates enable row level security;
alter table public.assess_answers    enable row level security;

revoke all on public.assess_pilots, public.assess_vacancies, public.assess_candidates, public.assess_answers from public, anon, authenticated;
grant select, insert, update, delete on public.assess_pilots, public.assess_vacancies, public.assess_candidates, public.assess_answers to service_role;

-- Cuentas piloto: agregar a mano, una por empresa que vaya a probar. Ejemplo (cambia el correo):
-- insert into public.assess_pilots (email, note) values ('tu-correo@empresa.com', 'Piloto interno') on conflict do nothing;

notify pgrst, 'reload schema';
