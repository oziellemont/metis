/**
 * Genera supabase/seed.sql a partir de src/lib/demo/seed.ts
 * Uso: npx tsx scripts/gen-seed-sql.ts
 *
 * Los ids cortos del demo ("u-mt", "es-otif-norte") se convierten en UUID v5
 * determinísticos, así el modo demo y la BD comparten exactamente los mismos datos.
 */
import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { demoData, YEAR } from "../src/lib/demo/seed";

const NS = "metis-demo-grupo-andes";
function uuid(key: string) {
  const h = createHash("sha1").update(`${NS}:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const q = (s: string | null | undefined) => (s == null ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const n = (v: number | null | undefined) => (v == null ? "null" : String(v));

const T = uuid("tenant");
const out: string[] = [];
out.push(`-- ============================================================================
-- METIS · Seed demo "Grupo Andes"  (generado por scripts/gen-seed-sql.ts)
-- Requiere 0001_core.sql. Los usuarios se crean en metis.profiles con UUIDs
-- fijos; para iniciar sesión con ellos crea los mismos ids en auth.users o
-- ajusta memberships a tus usuarios reales.
-- ============================================================================
begin;

insert into metis.tenants (id, slug, name, fiscal_year, currency, plan)
values ('${T}', 'grupo-andes', 'Grupo Andes', ${YEAR}, 'MXN', 'crece')
on conflict (id) do nothing;
`);

// profiles (sin FK a auth.users en seed: se inserta con set session_replication_role si hace falta)
out.push(`-- Perfiles demo (si auth.users no los tiene, ejecuta antes: alter table metis.profiles drop constraint profiles_id_fkey;)`);
for (const u of demoData.users) {
  const email = `${u.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".")}@grupoandes.demo`;
  out.push(`insert into metis.profiles (id, full_name, email) values ('${uuid(u.id)}', ${q(u.name)}, ${q(email)}) on conflict (id) do nothing;`);
}

out.push(`\n-- Tipos de alcance y alcances`);
for (const st of demoData.scopeTypes) out.push(`insert into metis.scope_types (id, tenant_id, name, level) values ('${uuid(st.id)}', '${T}', ${q(st.name)}, 0) on conflict do nothing;`);
for (const s of demoData.scopes) out.push(`insert into metis.scopes (id, tenant_id, scope_type_id, parent_id, name) values ('${uuid(s.id)}', '${T}', '${uuid(s.typeId)}', ${s.parentId ? `'${uuid(s.parentId)}'` : "null"}, ${q(s.name)}) on conflict do nothing;`);

out.push(`\n-- Membresías (roles y jefes)`);
const roleMap: Record<string, string> = { admin: "owner", manager: "manager", collaborator: "member" };
for (const u of demoData.users) {
  out.push(`insert into metis.memberships (tenant_id, user_id, role, title, manager_id) values ('${T}', '${uuid(u.id)}', '${roleMap[u.role] ?? "member"}', ${q(u.title)}, ${u.managerId ? `'${uuid(u.managerId)}'` : "null"}) on conflict do nothing;`);
}

out.push(`\n-- Objetivos y LAEs`);
demoData.objectives.forEach((o, i) => out.push(`insert into metis.objectives (id, tenant_id, code, name, description, horizon, sort_order) values ('${uuid(o.id)}', '${T}', 'OBJ-${i + 1}', ${q(o.name)}, ${q(o.description)}, ${o.horizon ? Number(o.horizon) : "null"}, ${i}) on conflict do nothing;`));
demoData.laes.forEach((l, i) => out.push(`insert into metis.laes (id, tenant_id, objective_id, code, name, color, sort_order) values ('${uuid(l.id)}', '${T}', '${uuid(l.objectiveId)}', 'LAE-${i + 1}', ${q(l.name)}, ${q(l.color)}, ${i}) on conflict do nothing;`));

out.push(`\n-- Unidades`);
const units = Array.from(new Set(demoData.elements.map((e) => e.unit)));
for (const u of units) out.push(`insert into metis.units (id, tenant_id, symbol, name, decimals) values ('${uuid("unit:" + u)}', '${T}', ${q(u)}, ${q(u)}, ${u === "$" ? 0 : 1}) on conflict do nothing;`);

out.push(`\n-- Catálogo de elementos`);
demoData.elements.forEach((e, i) => {
  out.push(`insert into metis.elements (id, tenant_id, lae_id, type, code, name, formula, unit_id, unit, direction, period) values ('${uuid(e.id)}', '${T}', '${uuid(e.laeId)}', '${e.type}', 'EL-${String(i + 1).padStart(3, "0")}', ${q(e.name)}, ${q(e.formula)}, '${uuid("unit:" + e.unit)}', ${q(e.unit)}, '${e.direction}', 'monthly') on conflict do nothing;`);
  for (const st of e.allowedScopeTypeIds) out.push(`insert into metis.element_allowed_scope_types (element_id, scope_type_id) values ('${uuid(e.id)}', '${uuid(st)}') on conflict do nothing;`);
});

out.push(`\n-- Elemento × alcance (con DR)`);
for (const es of demoData.elementScopes) out.push(`insert into metis.element_scopes (id, tenant_id, element_id, scope_id, owner_user_id) values ('${uuid(es.id)}', '${T}', '${uuid(es.elementId)}', '${uuid(es.scopeId)}', '${uuid(es.ownerUserId)}') on conflict do nothing;`);

out.push(`\n-- Scorecards, items e historial`);
for (const sc of demoData.scorecards) {
  out.push(`insert into metis.scorecards (id, tenant_id, user_id, year, status, approver_id) values ('${uuid(sc.id)}', '${T}', '${uuid(sc.userId)}', ${sc.year}, '${sc.status}', ${sc.approverId ? `'${uuid(sc.approverId)}'` : "null"}) on conflict do nothing;`);
  let prev: string | null = null;
  for (const h of sc.history) {
    out.push(`insert into metis.scorecard_events (tenant_id, scorecard_id, actor_id, from_status, to_status, comment, created_at) values ('${T}', '${uuid(sc.id)}', '${uuid(h.by)}', ${prev ? `'${prev}'` : "null"}, '${h.action}', ${q(h.note)}, '${h.at}');`);
    prev = h.action;
  }
}
demoData.scorecardItems.forEach((it, i) => {
  const mw = it.monthlyWeights
    ? `array[${Array.from({ length: 12 }, (_, m) => it.monthlyWeights?.[m + 1] ?? it.weight).join(",")}]::numeric[]`
    : "null";
  out.push(`insert into metis.scorecard_items (id, tenant_id, scorecard_id, element_scope_id, responsibility, weight, monthly_weights, target_min, target_sat, target_out, period, sort_order) values ('${uuid(it.id)}', '${T}', '${uuid(it.scorecardId)}', '${uuid(it.elementScopeId)}', '${it.responsibility}', ${it.weight}, ${mw}, ${it.targets.min}, ${it.targets.sat}, ${it.targets.out}, '${it.period}', ${i}) on conflict do nothing;`);
});

out.push(`\n-- Resultados mensuales (sólo meses con dato)`);
for (const r of demoData.results) {
  if (r.value == null) continue;
  out.push(`insert into metis.results (tenant_id, element_scope_id, year, month, value, log, loaded_by, loaded_at) values ('${T}', '${uuid(r.elementScopeId)}', ${r.year}, ${r.month}, ${n(r.value)}, ${q(r.log)}, ${r.loadedBy ? `'${uuid(r.loadedBy)}'` : "null"}, ${r.loadedAt ? `'${r.loadedAt}'` : "now()"}) on conflict (element_scope_id, year, month) do update set value = excluded.value, log = excluded.log;`);
}

out.push(`\ncommit;`);

mkdirSync("supabase", { recursive: true });
writeFileSync("supabase/seed.sql", out.join("\n") + "\n");
console.log(`supabase/seed.sql escrito · ${out.length} sentencias`);
