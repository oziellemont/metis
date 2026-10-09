/**
 * Importar organigrama: lectura de la tabla (Excel/CSV), normalización y validaciones.
 * Lógica pura (sin React ni Supabase) para poder probarla.
 */
import type { User } from "@/lib/domain/types";
import type { OrgImportRow } from "@/lib/store-core";

export type OrgRole = User["role"];

export interface OrgRow {
  /** número de fila en el archivo (para que el usuario la ubique) */
  line: number;
  name: string;
  email: string;
  employeeNumber: string;
  title: string;
  area: string;
  managerEmail: string;
  /** rol explícito del archivo; si viene vacío se infiere */
  role: OrgRole | null;
}

export interface CheckedRow extends OrgRow {
  role: OrgRole;
  roleInferred: boolean;
  errors: string[];
  warnings: string[];
  /** ya pertenece a la empresa: se actualiza en vez de invitar */
  existing: boolean;
  /** nivel en el árbol (0 = máximo nivel) */
  depth: number;
}

export interface OrgCheck {
  rows: CheckedRow[];
  ok: CheckedRow[];
  bad: CheckedRow[];
  general: string[];
  /** filas válidas ordenadas como árbol (jefe antes que su equipo) */
  tree: CheckedRow[];
}

/** Columnas de la plantilla, en orden. */
export const TEMPLATE_COLUMNS = ["Nombre completo", "Correo", "Número de empleado", "Puesto", "Área", "Correo del jefe directo", "Rol"] as const;

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

const HEADER_ALIASES: Record<keyof Omit<OrgRow, "line">, string[]> = {
  name: ["nombre", "nombrecompleto", "colaborador", "empleado", "name", "fullname"],
  email: ["correo", "email", "mail", "correoelectronico", "correodetrabajo", "emaillaboral"],
  employeeNumber: ["numerodeempleado", "noempleado", "numempleado", "nempleado", "nodeempleado", "numero", "id", "idempleado", "nomina", "numerodenomina", "employeeid", "employeenumber"],
  title: ["puesto", "cargo", "posicion", "title", "jobtitle"],
  area: ["area", "departamento", "depto", "direccion", "gerencia", "department"],
  managerEmail: ["correodeljefedirecto", "correodeljefe", "jefedirecto", "correojefe", "jefe", "emailjefe", "reportaa", "manageremail", "manager"],
  role: ["rol", "role", "perfil", "tipodeusuario"],
};

/** Detecta qué columna es cuál (acepta variantes, acentos y mayúsculas). */
export function mapHeaders(header: unknown[]): { map: Partial<Record<keyof Omit<OrgRow, "line">, number>>; missing: string[] } {
  const map: Partial<Record<keyof Omit<OrgRow, "line">, number>> = {};
  const cells = header.map((h) => norm(String(h ?? "")));
  (Object.keys(HEADER_ALIASES) as (keyof typeof HEADER_ALIASES)[]).forEach((k) => {
    const exact = cells.findIndex((c) => HEADER_ALIASES[k].includes(c));
    if (exact >= 0 && !Object.values(map).includes(exact)) map[k] = exact;
  });
  // segunda pasada: coincidencias parciales para columnas aún sin asignar
  (Object.keys(HEADER_ALIASES) as (keyof typeof HEADER_ALIASES)[]).forEach((k) => {
    if (map[k] !== undefined) return;
    const i = cells.findIndex((c, idx) => c && !Object.values(map).includes(idx) && HEADER_ALIASES[k].some((a) => a.length > 3 && c.includes(a)));
    if (i >= 0) map[k] = i;
  });
  const missing: string[] = [];
  if (map.email === undefined) missing.push("Correo");
  if (map.name === undefined) missing.push("Nombre completo");
  return { map, missing };
}

export function parseRole(v: string): OrgRole | null {
  const n = norm(v);
  if (!n) return null;
  if (["admin", "administrador", "administradora", "administrator"].includes(n)) return "admin";
  if (["jefe", "jefa", "manager", "lider", "gerente", "director", "directora", "supervisor", "supervisora"].includes(n)) return "manager";
  if (["colaborador", "colaboradora", "member", "miembro", "empleado", "empleada", "collaborator", "usuario"].includes(n)) return "collaborator";
  return null;
}

/** Convierte la tabla cruda (primera fila = encabezados) en filas. */
export function rowsFromTable(table: unknown[][]): { rows: OrgRow[]; error?: string } {
  const headerIdx = table.findIndex((r) => r.some((c) => String(c ?? "").trim() !== ""));
  if (headerIdx < 0) return { rows: [], error: "El archivo está vacío." };
  const { map, missing } = mapHeaders(table[headerIdx]);
  if (missing.length) return { rows: [], error: `No encontré las columnas: ${missing.join(", ")}. Usa la plantilla de METIS o revisa los encabezados.` };
  const get = (r: unknown[], k: keyof typeof map) => (map[k] === undefined ? "" : cell(r[map[k]!]));
  const rows: OrgRow[] = [];
  table.slice(headerIdx + 1).forEach((r, i) => {
    if (!r || r.every((c) => String(c ?? "").trim() === "")) return;
    const rawRole = get(r, "role");
    rows.push({
      line: headerIdx + i + 2,
      name: get(r, "name").replace(/\s+/g, " "),
      email: get(r, "email").toLowerCase().replace(/^mailto:/, ""),
      employeeNumber: get(r, "employeeNumber"),
      title: get(r, "title"),
      area: get(r, "area"),
      managerEmail: get(r, "managerEmail").toLowerCase().replace(/^mailto:/, ""),
      role: parseRole(rawRole) ?? (rawRole ? ("?" as unknown as OrgRole) : null),
    });
  });
  return { rows };
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

const EMAIL = /^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/;

/**
 * Valida el organigrama contra sí mismo y contra la gente que ya está en la empresa.
 * Errores = la fila no se importa. Avisos = se importa, pero conviene revisarlo.
 */
export function checkOrg(input: OrgRow[], members: Pick<User, "id" | "email" | "name">[]): OrgCheck {
  const memberEmails = new Set(members.map((m) => (m.email ?? "").toLowerCase()).filter(Boolean));
  const general: string[] = [];
  const rows: CheckedRow[] = input.map((r) => ({ ...r, role: r.role ?? "collaborator", roleInferred: !r.role, errors: [], warnings: [], existing: memberEmails.has(r.email), depth: 0 }));

  // correo
  const seen = new Map<string, number>();
  rows.forEach((r) => {
    if (!r.email) r.errors.push("Falta el correo.");
    else if (!EMAIL.test(r.email)) r.errors.push(`«${r.email}» no parece un correo válido.`);
    else if (seen.has(r.email)) r.errors.push(`Correo repetido (también en la fila ${seen.get(r.email)}).`);
    else seen.set(r.email, r.line);
    if (/@empresa\.com$/.test(r.email)) r.errors.push("Es una fila de ejemplo de la plantilla: bórrala o reemplázala.");
    if (!r.name) r.warnings.push("Sin nombre: se usará lo que va antes de la @.");
    if ((r.role as string) === "?") { r.role = "collaborator"; r.roleInferred = true; r.warnings.push("No reconocí el rol; quedará como Colaborador."); }
  });

  // número de empleado repetido
  const nums = new Map<string, number>();
  rows.forEach((r) => {
    if (!r.employeeNumber) return;
    if (nums.has(r.employeeNumber)) r.warnings.push(`Número de empleado repetido (fila ${nums.get(r.employeeNumber)}).`);
    else nums.set(r.employeeNumber, r.line);
  });

  // jefe
  const valid = new Map(rows.filter((r) => !r.errors.length).map((r) => [r.email, r]));
  rows.forEach((r) => {
    if (!r.managerEmail) return;
    if (r.managerEmail === r.email) { r.errors.push("Se reporta a sí mismo."); return; }
    if (!EMAIL.test(r.managerEmail)) { r.errors.push(`El correo del jefe «${r.managerEmail}» no es válido.`); return; }
    if (!valid.has(r.managerEmail) && !memberEmails.has(r.managerEmail)) {
      r.warnings.push(`Su jefe (${r.managerEmail}) no viene en el archivo ni está en la empresa: quedará ligado cuando ese jefe entre.`);
    }
  });

  // ciclos (A → B → A)
  const parent = (e: string) => valid.get(e)?.managerEmail || "";
  rows.forEach((r) => {
    if (r.errors.length) return;
    const path = [r.email];
    let cur = parent(r.email);
    while (cur && valid.has(cur)) {
      if (cur === r.email) { r.errors.push(`Ciclo de jefes: ${[...path, cur].join(" → ")}.`); break; }
      if (path.includes(cur)) break; // el ciclo no lo incluye; lo marcará su propia fila
      path.push(cur);
      cur = parent(cur);
    }
  });

  // rol inferido: si alguien le reporta, es Jefe
  const ok = rows.filter((r) => !r.errors.length);
  const okEmails = new Set(ok.map((r) => r.email));
  const hasReports = new Set(ok.map((r) => r.managerEmail).filter((e) => okEmails.has(e)));
  ok.forEach((r) => { if (r.roleInferred && hasReports.has(r.email)) r.role = "manager"; });

  // árbol
  const children = new Map<string, CheckedRow[]>();
  const roots: CheckedRow[] = [];
  ok.forEach((r) => {
    if (r.managerEmail && okEmails.has(r.managerEmail)) children.set(r.managerEmail, [...(children.get(r.managerEmail) ?? []), r]);
    else roots.push(r);
  });
  const tree: CheckedRow[] = [];
  const walk = (r: CheckedRow, d: number) => { r.depth = d; tree.push(r); (children.get(r.email) ?? []).forEach((c) => walk(c, d + 1)); };
  roots.forEach((r) => walk(r, 0));

  const tops = roots.filter((r) => !r.managerEmail);
  if (ok.length > 1 && tops.length > 1) general.push(`${tops.length} personas no tienen jefe en el archivo: quedarán en el nivel más alto (${tops.slice(0, 3).map((r) => r.name || r.email).join(", ")}${tops.length > 3 ? "…" : ""}).`);
  if (!input.length) general.push("El archivo no tiene personas.");

  return { rows, ok, bad: rows.filter((r) => r.errors.length), general, tree };
}

/** Lee un CSV sencillo (coma o punto y coma, comillas dobles). */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^\uFEFF/, "");
  const first = t.split(/\r?\n/, 1)[0] ?? "";
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : first.includes("\t") && !first.includes(",") ? "\t" : ",";
  const out: string[][] = [];
  let row: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(cur); out.push(row); row = []; cur = "";
    } else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); out.push(row); }
  return out;
}

/** Fila lista para la RPC metis.import_org. */
export function toImportPayload(r: CheckedRow): OrgImportRow {
  return {
    email: r.email, name: r.name || null, title: r.title || null, employee_number: r.employeeNumber || null, area: r.area || null,
    manager_email: r.managerEmail || null, role: r.role === "admin" ? "admin" : r.role === "manager" ? "manager" : "member" as const,
  };
}
