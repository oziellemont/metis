-- ============================================================================
-- METIS · 0006 · Borrar un cliente desde la Consola METIS
-- Requiere 0005. Idempotente.
--
-- Sólo un administrador de la plataforma (metis.platform_admins) puede borrar.
-- Para evitar accidentes, el RPC exige que p_confirm sea exactamente el nombre de la empresa.
-- Se borra la empresa y TODO lo que cuelga de ella (miembros, estrategia, catálogo,
-- scorecards, resultados, invitaciones, bitácoras) gracias a las llaves "on delete cascade".
-- Las cuentas de usuario (auth.users / profiles) NO se borran: una persona puede
-- pertenecer a otras empresas.
-- ============================================================================

create or replace function metis.delete_tenant(p_tenant uuid, p_confirm text)
returns void
language plpgsql security definer set search_path = metis, public as $$
declare v_name text;
begin
  if not metis.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select name into v_name from metis.tenants where id = p_tenant;
  if v_name is null then raise exception 'not_found'; end if;
  if coalesce(trim(p_confirm), '') <> trim(v_name) then raise exception 'confirm_mismatch'; end if;
  delete from metis.tenants where id = p_tenant;
end $$;

revoke all on function metis.delete_tenant(uuid, text) from public;
grant execute on function metis.delete_tenant(uuid, text) to authenticated;
