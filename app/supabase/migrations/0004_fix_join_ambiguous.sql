-- 0004 · Corrige "column reference tenant_id is ambiguous" en join_with_code / accept_invitation.
-- Causa: RETURNS TABLE (tenant_id, ...) crea una variable tenant_id que choca con la columna
-- en "on conflict (tenant_id, user_id)". Solución: #variable_conflict use_column + on constraint.

create or replace function metis.join_with_code(p_code text)
returns table (tenant_id uuid, tenant_name text) language plpgsql security definer set search_path = metis, public as $$
#variable_conflict use_column
declare t record; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select tn.id, tn.name into t from metis.tenants tn where upper(tn.join_code) = upper(trim(p_code));
  if t.id is null then raise exception 'invalid_code'; end if;
  insert into metis.memberships as m (tenant_id, user_id, role)
  values (t.id, uid, 'member')
  on conflict on constraint memberships_pkey do update set active = true;
  perform metis.accept_pending_invitations_for(uid, (select p.email from metis.profiles p where p.id = uid));
  return query select t.id, t.name;
end $$;

create or replace function metis.accept_invitation(p_token text)
returns table (tenant_id uuid, tenant_name text) language plpgsql security definer set search_path = metis, public as $$
#variable_conflict use_column
declare inv record; uid uuid := auth.uid(); my_email text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select i.* into inv from metis.invitations i where i.token = p_token and i.status = 'pending' and i.expires_at > now();
  if inv.id is null then raise exception 'invalid_invitation'; end if;
  select p.email into my_email from metis.profiles p where p.id = uid;
  if lower(my_email) <> lower(inv.email) then raise exception 'email_mismatch'; end if;
  insert into metis.memberships as m (tenant_id, user_id, role, title, manager_id)
  values (inv.tenant_id, uid, inv.role, inv.title, inv.manager_id)
  on conflict on constraint memberships_pkey do update
    set active = true, role = excluded.role,
        title = coalesce(excluded.title, m.title),
        manager_id = coalesce(excluded.manager_id, m.manager_id);
  update metis.invitations i set status = 'accepted', accepted_at = now() where i.id = inv.id;
  return query select tn.id, tn.name from metis.tenants tn where tn.id = inv.tenant_id;
end $$;

grant execute on function metis.join_with_code(text) to authenticated;
grant execute on function metis.accept_invitation(text) to authenticated;
notify pgrst, 'reload schema';
