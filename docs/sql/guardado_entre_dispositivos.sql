-- ============================================================================
-- mêtis CEO · Guardado entre dispositivos: revisar y asegurar
-- Correr en Supabase → SQL Editor, proyecto de PRODUCCIÓN.
--
-- Qué hace:
--   PASO 1 · Solo LEE. Dice si la tabla de partidas tiene los permisos que
--            necesita el navegador y qué tiene guardado tu cuenta en la nube.
--   PASO 2 · Vuelve a poner los permisos y la regla «cada quien solo ve lo
--            suyo», idénticos a los de la migración 0013. Si ya estaban, no
--            cambia nada.
--   PASO 3 · Repite la revisión para confirmar.
--
-- No borra ni modifica partidas. No toca el esquema "metis" (Align).
-- Se puede correr varias veces.
-- ============================================================================


-- PASO 1 · REVISIÓN (solo lee) ------------------------------------------------

-- 1a. Permisos que usa el navegador para guardar y leer tu partida.
--     Todo debe salir true.
select
  (select relrowsecurity from pg_class where oid = 'ceo.players'::regclass)             as regla_activa,
  exists (select 1 from pg_policies
           where schemaname = 'ceo' and tablename = 'players' and policyname = 'players_self') as solo_lo_suyo,
  has_schema_privilege('authenticated', 'ceo', 'USAGE')                                  as puede_entrar,
  has_table_privilege('authenticated', 'ceo.players', 'SELECT')                          as puede_leer,
  has_table_privilege('authenticated', 'ceo.players', 'INSERT')                          as puede_crear,
  has_table_privilege('authenticated', 'ceo.players', 'UPDATE')                          as puede_actualizar;

-- 1b. ¿Hay más de una cuenta tuya? (por ejemplo, una con Google y otra con
--     correo y contraseña). Cada cuenta tiene su propia partida.
select u.email,
       u.raw_app_meta_data->>'provider' as entra_con,
       u.created_at::date               as creada,
       u.last_sign_in_at                as ultimo_ingreso,
       (p.user_id is not null)          as tiene_partida
  from auth.users u
  left join ceo.players p on p.user_id = u.id
 where lower(u.email) like 'oziel%'
 order by u.last_sign_in_at desc nulls last;

-- 1c. Lo que tiene guardado tu cuenta en la nube.
select u.email,
       to_timestamp((p.state->>'savedAt')::bigint / 1000)   as ultimo_guardado,
       to_timestamp((p.state->>'startedAt')::bigint / 1000) as inicio_carrera,
       p.decisions                                          as decisiones,
       case when jsonb_typeof(p.state->'episodes') = 'object'
            then (select count(*) from jsonb_object_keys(p.state->'episodes'))
            else 0 end                                      as casos_ejecutivos,
       pg_size_pretty(pg_column_size(p.state)::bigint)      as tamano
  from auth.users u
  join ceo.players p on p.user_id = u.id
 where lower(u.email) = 'oziel.lemont@gmail.com';

-- 1d. Casos ejecutivos guardados en la nube, uno por renglón.
select e.key                                                       as caso,
       e.value->>'phase'                                           as fase,
       case when jsonb_typeof(e.value->'turns') = 'array'
            then jsonb_array_length(e.value->'turns') else 0 end   as respuestas,
       to_timestamp((e.value->>'updatedAt')::bigint / 1000)        as ultima_jugada
  from auth.users u
  join ceo.players p on p.user_id = u.id
  cross join lateral jsonb_each(
         case when jsonb_typeof(p.state->'episodes') = 'object'
              then p.state->'episodes' else '{}'::jsonb end) e
 where lower(u.email) = 'oziel.lemont@gmail.com'
 order by ultima_jugada desc nulls last;


-- PASO 2 · ASEGURAR (idempotente; mismos permisos que la migración 0013) --------

begin;

grant usage on schema ceo to anon, authenticated, service_role;

alter table ceo.players enable row level security;

drop policy if exists players_self on ceo.players;
create policy players_self on ceo.players for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on ceo.players to authenticated;
grant all privileges on ceo.players to service_role;

commit;

notify pgrst, 'reload schema';
notify pgrst, 'reload config';


-- PASO 3 · CONFIRMAR: vuelve a correr la consulta 1a. Todo debe salir true.
