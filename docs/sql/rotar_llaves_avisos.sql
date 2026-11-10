-- Rotar las llaves de avisos al celular (si alguna vez se sospecha que se filtraron).
-- El servidor genera un par nuevo en la siguiente consulta; los jugadores vuelven a activar avisos en su celular.
-- No muestra ninguna llave.
delete from ceo.server_secrets where name = 'vapid';
delete from ceo.push_subscriptions;
