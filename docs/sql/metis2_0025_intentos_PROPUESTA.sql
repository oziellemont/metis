-- ============================================================================
-- MÊTIS 2.0 · 0025 · Intentos, respuestas, rúbricas, revisiones y evidencias
-- ESTADO: PROPUESTA. NO SE HA EJECUTADO. NO ESTÁ EN supabase/migrations A PROPÓSITO.
--
-- Antes de correrla hacen falta tres cosas, en este orden:
--   1. Autorización explícita de Oziel para ejecutar esta migración.
--   2. Respaldo verificado: correr docs/sql/metis2_respaldo.sql y confirmar que
--      «partidas_respaldadas» coincide con el total de jugadores.
--   3. Copiar este archivo a app/supabase/migrations/0025_metis2_intentos.sql.
--
-- Qué hace (solo agrega; no cambia ni borra nada que exista):
--   - Esquema nuevo «metis2». No toca «ceo» (partidas) ni «metis» (Align), salvo LEER
--     metis.platform_admins para saber quién es del equipo.
--   - intentos: uno por persona, pieza, versión y número de intento (llave única):
--     un doble envío no crea dos intentos.
--   - respuestas: una por intento y paso (llave primaria): no se responde dos veces
--     el mismo paso y lo respondido no se cambia (sin política de actualización).
--   - rubricas: versión de la rúbrica con la que se calificó (borrador o aprobada).
--   - revisores: rol separado de «equipo». Un revisor lee respuestas para revisarlas;
--     no ve partidas ni cambia puntajes automáticos.
--   - revisiones: una por respuesta, revisor y ronda (revisión doble a ciegas:
--     el revisor no ve la revisión del otro hasta que ambas existen).
--   - evidencias: lo que una pieza YA REVISADA aporta. Queda vacía mientras ninguna
--     pieza esté validada; el sistema de dominio actual no la lee.
--
-- Seguridad (RLS activo en todas):
--   - Cada persona ve solo sus intentos y respuestas. Nadie las cambia desde el navegador:
--     se escriben desde el servidor (service_role) después de validar identidad, pieza,
--     versión, estado y orden.
--   - Las claves de evaluación NUNCA se guardan aquí: viven en el servidor de la app.
--   - Revisores: solo leen respuestas asignadas (por pieza) y escriben su revisión.
--
-- Retención propuesta: respuestas y revisiones de pilotos se conservan 24 meses y luego
-- se anonimizan (se borra el user_id, se conserva el contenido para calibrar).
--
-- Para deshacerla: docs/sql/metis2_0025_revertir_PROPUESTA.sql
-- ============================================================================

create schema if not exists metis2;

create table if not exists metis2.intentos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  pieza         text not null check (char_length(pieza) between 3 and 80),     -- id de experiencia o de reto
  tipo          text not null check (tipo in ('experiencia', 'reto')),
  version       int  not null check (version > 0),
  numero        int  not null default 1 check (numero > 0),
  modo          text not null default 'piloto' check (modo in ('piloto', 'practica', 'acredita')),
  estado        text not null default 'en_curso' check (estado in ('en_curso', 'entregado', 'en_revision', 'revisado', 'anulado')),
  paso_actual   text,
  asistido      boolean not null default false,
  retomas       int not null default 0,
  rubrica_id    uuid,
  puntaje_auto  int,             -- lo calcula el servidor; nunca el navegador
  pendiente     int,             -- puntos en espera de revisión humana
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  updated_at    timestamptz not null default now(),
  unique (user_id, pieza, version, numero)
);
create index if not exists intentos_user on metis2.intentos(user_id, pieza, started_at desc);
create index if not exists intentos_estado on metis2.intentos(estado) where estado in ('entregado', 'en_revision');

create table if not exists metis2.respuestas (
  intento_id    uuid not null references metis2.intentos(id) on delete cascade,
  paso          text not null check (char_length(paso) between 1 and 80),
  orden         int  not null check (orden >= 0),
  valor         jsonb not null check (pg_column_size(valor) < 20000),
  auto          boolean not null,            -- se calificó solo (true) o espera a una persona (false)
  puntos        int,                         -- null mientras espera revisión
  idempotencia  text not null check (char_length(idempotencia) between 8 and 80),
  created_at    timestamptz not null default now(),
  primary key (intento_id, paso),
  unique (intento_id, idempotencia),
  unique (intento_id, orden)
);

create table if not exists metis2.rubricas (
  id            uuid primary key default gen_random_uuid(),
  pieza         text not null,
  version       int  not null,
  estado        text not null default 'borrador' check (estado in ('borrador', 'calibracion', 'aprobada', 'retirada')),
  descriptores  jsonb not null,               -- Sólido / Parcial / Inicial / Sin evidencia, con anclas y ejemplos límite
  aprobada_por  uuid references auth.users(id),
  aprobada_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (pieza, version)
);
alter table metis2.intentos
  add constraint intentos_rubrica_fk foreign key (rubrica_id) references metis2.rubricas(id) not valid;

create table if not exists metis2.revisores (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  piezas        text[] not null default '{}',  -- vacío = ninguna asignada
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists metis2.revisiones (
  intento_id    uuid not null,
  paso          text not null,
  revisor_id    uuid not null references metis2.revisores(user_id),
  ronda         int  not null default 1 check (ronda in (1, 2, 3)),   -- 3 = desempate
  nivel         text not null check (nivel in ('solido', 'parcial', 'inicial', 'sin_evidencia')),
  puntos        int  not null check (puntos >= 0),
  comentario    text not null default '' check (char_length(comentario) <= 2000),
  created_at    timestamptz not null default now(),
  primary key (intento_id, paso, revisor_id),
  unique (intento_id, paso, ronda),
  foreign key (intento_id, paso) references metis2.respuestas(intento_id, paso) on delete cascade
);

create table if not exists metis2.evidencias (
  id            uuid primary key default gen_random_uuid(),
  intento_id    uuid not null references metis2.intentos(id) on delete cascade,
  skill         text not null,
  nivel         text not null check (nivel in ('solido', 'parcial', 'inicial', 'sin_evidencia')),
  fuente        text not null check (fuente in ('automatica', 'revision_humana')),
  created_at    timestamptz not null default now(),
  unique (intento_id, skill, fuente)
);

-- Funciones de rol --------------------------------------------------------------
create or replace function metis2.es_revisor(p_pieza text)
returns boolean language sql stable security definer set search_path = metis2, public as $$
  select exists (select 1 from metis2.revisores r where r.user_id = auth.uid() and r.activo and p_pieza = any(r.piezas));
$$;
grant usage on schema metis2 to authenticated;
grant execute on function metis2.es_revisor(text) to authenticated;

-- RLS ---------------------------------------------------------------------------
alter table metis2.intentos   enable row level security;
alter table metis2.respuestas enable row level security;
alter table metis2.rubricas   enable row level security;
alter table metis2.revisores  enable row level security;
alter table metis2.revisiones enable row level security;
alter table metis2.evidencias enable row level security;

-- Cada persona lee lo suyo. Nadie escribe desde el navegador: solo el servidor (service_role).
drop policy if exists intentos_propios on metis2.intentos;
create policy intentos_propios on metis2.intentos for select to authenticated using (user_id = auth.uid());
drop policy if exists respuestas_propias on metis2.respuestas;
create policy respuestas_propias on metis2.respuestas for select to authenticated
  using (exists (select 1 from metis2.intentos i where i.id = intento_id and i.user_id = auth.uid()));

-- Revisores: leen las respuestas escritas de las piezas asignadas, sin ver de quién son
-- (la app les muestra solo intento y paso), y su propia revisión.
drop policy if exists respuestas_revisor on metis2.respuestas;
create policy respuestas_revisor on metis2.respuestas for select to authenticated
  using (not auto and exists (select 1 from metis2.intentos i where i.id = intento_id and metis2.es_revisor(i.pieza)));
drop policy if exists revisiones_propias on metis2.revisiones;
create policy revisiones_propias on metis2.revisiones for select to authenticated using (revisor_id = auth.uid());
drop policy if exists revisores_self on metis2.revisores;
create policy revisores_self on metis2.revisores for select to authenticated using (user_id = auth.uid());
drop policy if exists evidencias_propias on metis2.evidencias;
create policy evidencias_propias on metis2.evidencias for select to authenticated
  using (exists (select 1 from metis2.intentos i where i.id = intento_id and i.user_id = auth.uid()));
-- rubricas: sin políticas. Solo el servidor las lee.

-- Comprobación (solo lee): deben salir 6 tablas con RLS activo.
select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'metis2' and c.relkind = 'r' order by 1;
