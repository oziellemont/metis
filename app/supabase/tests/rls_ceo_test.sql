-- Prueba de aislamiento entre usuarios (RLS) del esquema ceo. Falla con excepción si algo se filtra.
\set ON_ERROR_STOP on
insert into auth.users values ('00000000-0000-4000-8000-00000000000a', 'a@prueba.mx'), ('00000000-0000-4000-8000-00000000000b', 'b@prueba.mx') on conflict do nothing;

-- A crea su fila con perfil
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000000a', false);
insert into ceo.players (user_id, alias, home_industry_id, home_company_variant_id, daily_decision_goal, preferred_session_minutes, notify_window_start, notify_window_end)
  values ('00000000-0000-4000-8000-00000000000a', 'A', 'consumo', 'cumbre', 2, 5, 8, 20);
insert into ceo.industry_interest (user_id, industry_id) values ('00000000-0000-4000-8000-00000000000a', 'salud');

-- B no ve ni puede tocar lo de A
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000000b', false);
do $$ begin
  if (select count(*) from ceo.players) <> 0 then raise exception 'FUGA: B ve filas de players ajenas'; end if;
  if (select count(*) from ceo.industry_interest) <> 0 then raise exception 'FUGA: B ve interés ajeno'; end if;
  update ceo.players set alias = 'hackeado' where user_id = '00000000-0000-4000-8000-00000000000a';
  delete from ceo.industry_interest where user_id = '00000000-0000-4000-8000-00000000000a';
end $$;
do $$ begin
  begin
    insert into ceo.players (user_id, alias) values ('00000000-0000-4000-8000-00000000000a', 'suplantado');
    raise exception 'FUGA: B pudo insertar con el id de A';
  exception when insufficient_privilege or unique_violation then null; end;
  begin
    insert into ceo.industry_interest (user_id, industry_id) values ('00000000-0000-4000-8000-00000000000a', 'agro');
    raise exception 'FUGA: B pudo marcar interés a nombre de A';
  exception when insufficient_privilege then null; end;
end $$;

-- Restricciones de valores
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000000b', false);
do $$ begin
  begin insert into ceo.players (user_id, daily_decision_goal) values ('00000000-0000-4000-8000-00000000000b', 5); raise exception 'acepto meta 5';
  exception when check_violation then null; end;
  begin insert into ceo.players (user_id, preferred_session_minutes) values ('00000000-0000-4000-8000-00000000000b', 7); raise exception 'acepto 7 minutos';
  exception when check_violation then null; end;
  begin insert into ceo.players (user_id, notify_window_start) values ('00000000-0000-4000-8000-00000000000b', 24); raise exception 'acepto hora 24';
  exception when check_violation then null; end;
end $$;

-- Anónimo no ve nada
reset role; set role anon;
do $$ begin
  begin perform 1 from ceo.players; raise exception 'FUGA: anon lee players';
  exception when insufficient_privilege then null; end;
  begin perform 1 from ceo.industry_interest; raise exception 'FUGA: anon lee interés';
  exception when insufficient_privilege then null; end;
end $$;

-- Bitácora de importaciones (0017): solo el servidor escribe; cada quien lee las suyas.
reset role; set role service_role;
insert into ceo.career_imports (import_id, user_id, mode, legacy_company_id, rules_version, catalog_version, replaced_state)
  values ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-00000000000a', 'reemplazar', 'cumbre', 1, 1, '{"company":"forja"}');
do $$ begin
  begin insert into ceo.career_imports (import_id, user_id, mode, legacy_company_id, rules_version, catalog_version)
    values ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-00000000000a', 'vacia', 'cumbre', 1, 1);
    raise exception 'DUPLICADO: el mismo import_id entró dos veces';
  exception when unique_violation then null; end;
  begin insert into ceo.career_imports (import_id, user_id, mode, legacy_company_id, rules_version, catalog_version)
    values (gen_random_uuid(), '00000000-0000-4000-8000-00000000000a', 'fusionar', 'cumbre', 1, 1);
    raise exception 'acepto un modo inventado';
  exception when check_violation then null; end;
end $$;
reset role; set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000000b', false);
do $$ begin
  if (select count(*) from ceo.career_imports) <> 0 then raise exception 'FUGA: B ve importaciones de A'; end if;
  begin insert into ceo.career_imports (import_id, user_id, mode, legacy_company_id, rules_version, catalog_version)
    values (gen_random_uuid(), '00000000-0000-4000-8000-00000000000b', 'vacia', 'cumbre', 1, 1);
    raise exception 'FUGA: un navegador pudo escribir en la bitácora';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000000a', false);
do $$ begin
  if (select count(*) from ceo.career_imports) <> 1 then raise exception 'A no ve su propia importación'; end if;
  begin delete from ceo.career_imports; raise exception 'A pudo borrar su respaldo';
  exception when insufficient_privilege then null; end;
end $$;
reset role; set role anon;
do $$ begin
  begin perform 1 from ceo.career_imports; raise exception 'FUGA: anon lee importaciones';
  exception when insufficient_privilege then null; end;
end $$;

-- A sigue intacto
reset role; set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000000a', false);
do $$ begin
  if (select alias from ceo.players) <> 'A' then raise exception 'A fue modificado por B'; end if;
  if (select count(*) from ceo.industry_interest) <> 1 then raise exception 'El interés de A fue borrado'; end if;
end $$;

-- Diario en sombra (0018): solo el servidor escribe; choques de versión y duplicados no corrompen.
reset role; set role service_role;
do $$
declare r text; ev jsonb;
begin
  ev := '[{"eventId":"22222222-2222-4222-8222-000000000001","seq":1,"action":{"type":"start","at":1790000000000},"at":1790000000000,"accepted":true,"note":null},
          {"eventId":"22222222-2222-4222-8222-000000000002","seq":2,"action":{"type":"decide","at":1790000060000},"at":1790000060000,"accepted":false,"note":"no_procede;reloj_adelantado"}]';
  r := ceo.journal_commit('00000000-0000-4000-8000-00000000000a', '33333333-3333-4333-8333-333333333333', to_timestamp(1790000000), 0, '{"company":"cumbre"}', 0, 10, 'inicio', 0, 1, ev);
  if r <> 'ok' then raise exception 'no guardó la carrera nueva: %', r; end if;
  -- otro dispositivo intenta crearla también → conflicto
  r := ceo.journal_commit('00000000-0000-4000-8000-00000000000a', '33333333-3333-4333-8333-333333333333', to_timestamp(1790000000), 0, '{"company":"forja"}', 0, 10, 'inicio', 0, 1, '[]');
  if r <> 'conflicto' then raise exception 'dos altas de la misma carrera: %', r; end if;
  -- guardado con versión vieja → conflicto; con la correcta → ok y sube la versión
  r := ceo.journal_commit('00000000-0000-4000-8000-00000000000a', '33333333-3333-4333-8333-333333333333', to_timestamp(1790000000), 7, '{}', 0, null, 'inicio', 0, 1, '[]');
  if r <> 'conflicto' then raise exception 'aceptó una versión vieja'; end if;
  -- el mismo evento repetido no se duplica
  r := ceo.journal_commit('00000000-0000-4000-8000-00000000000a', '33333333-3333-4333-8333-333333333333', to_timestamp(1790000000), 1, '{"company":"cumbre","x":1}', 20, null, 'inicio', 0, 1, jsonb_build_array(ev->0));
  if r <> 'ok' then raise exception 'no guardó con la versión correcta'; end if;
  if (select count(*) from ceo.game_events where run_id = '33333333-3333-4333-8333-333333333333') <> 2 then raise exception 'evento duplicado'; end if;
  if (select version from ceo.game_runs) <> 2 then raise exception 'la versión no subió'; end if;
  if (select client_xp from ceo.game_runs) <> 10 then raise exception 'perdió el XP del navegador'; end if;
  if (select events_flagged from ceo.game_runs) <> 1 then raise exception 'no contó reloj adelantado'; end if;
  -- B no puede guardar sobre la carrera de A ni aunque conozca el run_id
  r := ceo.journal_commit('00000000-0000-4000-8000-00000000000b', '33333333-3333-4333-8333-333333333333', to_timestamp(1790000000), 2, '{"hack":1}', 9999, null, 'inicio', 0, 1, '[]');
  if r <> 'conflicto' then raise exception 'B escribió en la carrera de A'; end if;
  if (select count(*) from ceo.xp_comparacion(10)) <> 1 then raise exception 'xp_comparacion no lista la carrera'; end if;
end $$;
reset role; set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000000b', false);
do $$ begin
  if (select count(*) from ceo.game_runs) <> 0 then raise exception 'FUGA: B ve carreras de A'; end if;
  if (select count(*) from ceo.game_events) <> 0 then raise exception 'FUGA: B ve jugadas de A'; end if;
  begin perform ceo.journal_commit('00000000-0000-4000-8000-00000000000b', gen_random_uuid(), now(), 0, '{}', 0, 0, 'inicio', 0, 1, '[]');
    raise exception 'FUGA: un navegador pudo llamar journal_commit';
  exception when insufficient_privilege then null; end;
  begin perform 1 from ceo.xp_comparacion(5); raise exception 'FUGA: un navegador ve la comparación de XP';
  exception when insufficient_privilege then null; end;
  begin insert into ceo.game_runs (run_id, user_id, career_started_at, state, base_kind) values (gen_random_uuid(), '00000000-0000-4000-8000-00000000000b', now(), '{}', 'inicio');
    raise exception 'FUGA: un navegador pudo escribir su propia carrera de servidor';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000000a', false);
do $$ begin
  if (select count(*) from ceo.game_runs) <> 1 then raise exception 'A no ve su carrera'; end if;
  begin update ceo.game_runs set server_xp = 99999; raise exception 'A pudo inflar su XP de servidor';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'RLS OK' as resultado;
