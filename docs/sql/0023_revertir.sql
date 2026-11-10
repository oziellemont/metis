-- Deshace 0023_ceo_secretos_servidor.sql. Al borrarla, el servidor generará un par de llaves nuevo la próxima vez y
-- cada jugador tendrá que volver a tocar «Activar avisos en este celular» (nadie pierde su partida).
drop table if exists ceo.server_secrets;
notify pgrst, 'reload schema';
