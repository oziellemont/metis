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

-- A sigue intacto
reset role; set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000000a', false);
do $$ begin
  if (select alias from ceo.players) <> 'A' then raise exception 'A fue modificado por B'; end if;
  if (select count(*) from ceo.industry_interest) <> 1 then raise exception 'El interés de A fue borrado'; end if;
end $$;
reset role;
select 'RLS OK' as resultado;
