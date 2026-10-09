-- =============================================================================
-- METIS · 0009 · El consultor METIS siempre entra como administrador
--
-- Problema: si el admin de plataforma ya era miembro de una empresa con rol
-- 'member' (p. ej. se unió con el código), "Entrar como consultor" no le
-- subía el rol y no veía Configuración (Usuarios, Estrategia, etc.).
-- =============================================================================

create or replace function metis.platform_join_tenant(p_tenant uuid)
returns void language plpgsql security definer set search_path = metis, public as $$
begin
  if not metis.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into metis.memberships as m (tenant_id, user_id, role, title)
  values (p_tenant, auth.uid(), 'admin', 'Consultor METIS')
  on conflict on constraint memberships_pkey do update
    set active = true,
        role = case when m.role = 'owner' then m.role else 'admin'::metis.role end;
end $$;

grant execute on function metis.platform_join_tenant(uuid) to authenticated;

-- Arreglo inmediato: los admins de plataforma que hoy están como colaborador/jefe pasan a admin.
update metis.memberships m set role = 'admin'
  where m.user_id in (select user_id from metis.platform_admins)
    and m.role not in ('owner', 'admin');
