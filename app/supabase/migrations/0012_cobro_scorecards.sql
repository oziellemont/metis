-- =============================================================================
-- METIS · 0012 · Cobro por colaborador activo con scorecard
--
--  ¿A quién se cobra? (regla única, la misma en la consola y en el cron)
--    · tiene membresía ACTIVA en la empresa,
--    · tiene scorecard del año fiscal vigente de la empresa con al menos 1 KPI/proyecto,
--    · NO es del equipo mêtis (metis.platform_admins: consultores que entran a ayudar).
--  Personas sin scorecard (montacarguistas, vistas de solo lectura, etc.) no cuentan.
--
--  metis.billing_usage guarda, por empresa y mes, el conteo de hoy y el PICO del mes.
--  El cron diario (/api/cron/recordatorios) llama metis.billing_snapshot(); se cobra el pico,
--  así nadie "apaga" scorecards el día de corte para pagar menos.
--
-- Idempotente: se puede correr más de una vez.
-- =============================================================================

create table if not exists metis.billing_usage (
  tenant_id   uuid not null references metis.tenants(id) on delete cascade,
  period      text not null check (period ~ '^\d{4}-\d{2}$'),   -- 'AAAA-MM'
  billable    int  not null default 0,   -- con scorecard, último conteo del mes
  peak        int  not null default 0,   -- máximo del mes  → es lo que se factura
  members     int  not null default 0,   -- personas activas totales (referencia)
  updated_at  timestamptz not null default now(),
  primary key (tenant_id, period)
);
alter table metis.billing_usage enable row level security;
-- Sin políticas para authenticated: solo se lee vía funciones security definer de la consola.

-- Conteo en vivo de UNA empresa
create or replace function metis.billable_count(p_tenant uuid)
returns int language sql stable security definer set search_path = metis, public as $$
  select count(distinct m.user_id)::int
  from metis.memberships m
  join metis.tenants t on t.id = m.tenant_id
  join metis.scorecards s on s.tenant_id = m.tenant_id and s.user_id = m.user_id and s.year = t.fiscal_year
  where m.tenant_id = p_tenant and m.active
    and exists (select 1 from metis.scorecard_items i where i.scorecard_id = s.id)
    and not exists (select 1 from metis.platform_admins a where a.user_id = m.user_id);
$$;

-- Foto del día para TODAS las empresas (la llama el cron con service_role)
create or replace function metis.billing_snapshot(p_period text default to_char(now() at time zone 'America/Monterrey', 'YYYY-MM'))
returns int language plpgsql security definer set search_path = metis, public as $$
declare n int := 0; r record; c int; mem int;
begin
  for r in select id from metis.tenants loop
    c := metis.billable_count(r.id);
    select count(*)::int into mem from metis.memberships m where m.tenant_id = r.id and m.active
      and not exists (select 1 from metis.platform_admins a where a.user_id = m.user_id);
    insert into metis.billing_usage as b (tenant_id, period, billable, peak, members, updated_at)
      values (r.id, p_period, c, c, mem, now())
    on conflict (tenant_id, period) do update
      set billable = excluded.billable, members = excluded.members, updated_at = now(),
          peak = greatest(b.peak, excluded.billable);
    n := n + 1;
  end loop;
  return n;
end $$;

-- Consola mêtis: conteo en vivo + pico del mes actual por empresa
create or replace function metis.platform_billing(p_period text default to_char(now() at time zone 'America/Monterrey', 'YYYY-MM'))
returns table (tenant_id uuid, billable int, peak int, members int)
language plpgsql stable security definer set search_path = metis, public as $$
#variable_conflict use_column
begin
  if not metis.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select t.id,
           metis.billable_count(t.id),
           greatest(coalesce(b.peak, 0), metis.billable_count(t.id)),
           (select count(*)::int from metis.memberships m where m.tenant_id = t.id and m.active
              and not exists (select 1 from metis.platform_admins a where a.user_id = m.user_id))
    from metis.tenants t
    left join metis.billing_usage b on b.tenant_id = t.id and b.period = p_period;
end $$;

-- Consola mêtis: historial mensual (para facturar y exportar)
create or replace function metis.platform_billing_history(p_months int default 12)
returns table (tenant_id uuid, tenant_name text, period text, peak int, billable int, members int)
language plpgsql stable security definer set search_path = metis, public as $$
#variable_conflict use_column
begin
  if not metis.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select b.tenant_id, t.name, b.period, b.peak, b.billable, b.members
    from metis.billing_usage b join metis.tenants t on t.id = b.tenant_id
    where b.period >= to_char((now() at time zone 'America/Monterrey') - make_interval(months => greatest(p_months, 1) - 1), 'YYYY-MM')
    order by b.period desc, t.name;
end $$;

revoke all on function metis.billing_snapshot(text) from public, anon, authenticated;
revoke all on function metis.billable_count(uuid)  from public, anon, authenticated;
grant execute on function metis.billing_snapshot(text)        to service_role;
grant execute on function metis.billable_count(uuid)          to service_role;
grant execute on function metis.platform_billing(text)        to authenticated;
grant execute on function metis.platform_billing_history(int) to authenticated;
grant all on metis.billing_usage to service_role;

-- Primera foto al correr la migración
select metis.billing_snapshot();

notify pgrst, 'reload schema';
