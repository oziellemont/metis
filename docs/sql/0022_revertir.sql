-- Deshace 0022_ceo_avisos_celular.sql: borra las suscripciones de avisos al celular (nadie pierde su partida).
drop table if exists ceo.push_subscriptions;
notify pgrst, 'reload schema';
