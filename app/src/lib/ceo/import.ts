/**
 * mêtis CEO · importar la carrera guardada en el navegador a la cuenta (adenda v3.2 §3).
 *
 * Reglas:
 *  - Nada se sube solo. La partida del navegador (clave vieja `metis-ceo-v1`) es «progreso sin cuenta»:
 *    se detecta, se muestra y el jugador decide.
 *  - Cada cuenta guarda su copia local en su propia clave (`metis-ceo-v2:<usuario>`): si A cierra sesión
 *    y entra B en el mismo navegador, B no ve ni toma la carrera de A.
 *  - Nada se borra antes de confirmar que la importación salió bien; después queda un respaldo.
 *  - La importación lleva un `importId` estable: recargar o dar doble clic no duplica.
 *  - El servidor valida y calcula el XP; lo importado queda marcado como progreso anterior (legacy).
 *
 * Todo aquí es puro o recibe el almacenamiento como parámetro, para poder probarlo sin navegador.
 */
import type { CeoState } from "./types";
import { migrate, nowOf, rulesVersionOf, xpOf } from "./engine";
import { COMPANIES, companyById, isCompany } from "./companies";
import { withBank } from "./cases/bank";
import { CATALOG_VERSION, catalogCompanyById } from "./catalog";
import { STAGES } from "./journey";

/** Versión de reglas con la que se jugaron las partidas anteriores a la v3 (ver contracts.ts). */
export { LEGACY_RULES_VERSION } from "./rules";
export const LEGACY_KEY = "metis-ceo-v1";
export const ownerKey = (uid: string) => `metis-ceo-v2:${uid}`;
const IMPORT_ID_KEY = `${LEGACY_KEY}:importar-id`;
const CLAIM_KEY = `${LEGACY_KEY}:reclamada`;
const BACKUP_KEY = `${LEGACY_KEY}:respaldo`;
const WELCOME_PREFIX = `${LEGACY_KEY}:welcome:`;
/** Tope de tamaño de una partida importada (la más larga conocida pesa ~60 KB). */
export const IMPORT_MAX_BYTES = 512 * 1024;
export const HELP_EMAIL = "hola@metis.ceo";

/** Almacenamiento mínimo (localStorage o un Map en pruebas). */
export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
  keys(): string[];
}
export function kvOf(st: Storage): KV {
  return {
    getItem: (k) => st.getItem(k),
    setItem: (k, v) => st.setItem(k, v),
    removeItem: (k) => st.removeItem(k),
    keys: () => Array.from({ length: st.length }, (_, i) => st.key(i)).filter((k): k is string => !!k),
  };
}
export function memoryKV(init: Record<string, string> = {}): KV & { dump(): Record<string, string> } {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    keys: () => [...m.keys()],
    dump: () => Object.fromEntries(m),
  };
}

const parse = (raw: string | null): unknown => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };
const started = (s: CeoState | null | undefined): s is CeoState => !!s && typeof s.startedAt === "number" && s.startedAt > 0;

// ───────────────────────────────────────────── lectura local

/** Partida del navegador sin dueño (clave vieja). null si no hay una carrera iniciada. */
export function readLegacy(kv: KV): CeoState | null {
  const raw = parse(kv.getItem(LEGACY_KEY));
  if (!raw) return null;
  const s = migrate(raw);
  return started(s) ? s : null;
}
/** Copia local de la cuenta `uid`. */
export function readOwner(kv: KV, uid: string): CeoState | null {
  const raw = parse(kv.getItem(ownerKey(uid)));
  return raw ? migrate(raw) : null;
}
export function writeOwner(kv: KV, uid: string, s: CeoState) {
  try { kv.setItem(ownerKey(uid), JSON.stringify(s)); } catch { /* lleno o bloqueado: la nube es la copia buena */ }
}

/**
 * ¿De quién es la partida vieja? La versión anterior dejaba una marca `metis-ceo-v1:welcome:<usuario>`
 * cuando la subía a una cuenta; y aquí marcamos `reclamada` cuando alguien decide qué hacer con ella.
 * Si hay marcas de OTRA cuenta y ninguna de la actual, no es de quien entra: no se le ofrece.
 */
export function legacyOwners(kv: KV): string[] {
  const out = new Set<string>();
  for (const k of kv.keys()) if (k.startsWith(WELCOME_PREFIX)) out.add(k.slice(WELCOME_PREFIX.length));
  const c = parse(kv.getItem(CLAIM_KEY)) as { uid?: unknown } | null;
  if (c && typeof c.uid === "string") out.add(c.uid);
  return [...out].filter(Boolean);
}
interface Claim { uid: string; how: "importada" | "descartada" | "igual"; savedAt: number; at: number; importId?: string }
export function readClaim(kv: KV): Claim | null {
  const c = parse(kv.getItem(CLAIM_KEY)) as Claim | null;
  return c && typeof c.uid === "string" && typeof c.savedAt === "number" ? c : null;
}

// ───────────────────────────────────────────── resumen y plan

export interface CareerSummary {
  companyId: string;
  company: string;
  xp: number;
  stage: string;
  decisions: number;
  companiesClosed: number;
  lastActivity: number;
}
export function summaryOf(s: CeoState): CareerSummary {
  const all = Object.keys(s.decisions).length + s.career.reduce((a, r) => a + Object.keys(r.decisions ?? {}).length, 0);
  return {
    companyId: s.company,
    company: companyById(s.company).name,
    xp: xpOf(s, nowOf(s, Math.max(s.savedAt || 0, s.lastActiveAt || 0) || undefined)),
    stage: STAGES[s.journey?.stage ?? 0]?.name ?? STAGES[0].name,
    decisions: all,
    companiesClosed: s.career.length,
    lastActivity: Math.max(s.lastActiveAt || 0, s.savedAt || 0),
  };
}

export type ImportPlan =
  | { kind: "none"; reason: "sin_local" | "de_otra_cuenta" | "ya_resuelta" }
  | { kind: "same" }
  | { kind: "offer_import"; local: CareerSummary; localSavedAt: number }
  | { kind: "conflict"; local: CareerSummary; cloud: CareerSummary; localSavedAt: number };

/**
 * Qué mostrar al entrar con la cuenta `uid`.
 * - `cloud`: la carrera de la cuenta (servidor o copia local de esa misma cuenta).
 * - Nunca decide por el jugador: solo «nada que hacer», «es la misma», «ofrecer importar» o «conflicto».
 */
export function planImport(p: { uid: string; legacy: CeoState | null; owners: string[]; claim: Claim | null; cloud: CeoState | null }): ImportPlan {
  const { uid, legacy, owners, claim, cloud } = p;
  if (!started(legacy)) return { kind: "none", reason: "sin_local" };
  if (owners.length && !owners.includes(uid)) return { kind: "none", reason: "de_otra_cuenta" };
  // Ya decidió sobre ESTA versión de la partida local (si después siguió jugando sin cuenta, se vuelve a preguntar).
  if (claim && claim.uid === uid && claim.savedAt >= (legacy.savedAt || 0)) return { kind: "none", reason: "ya_resuelta" };
  if (!started(cloud)) return { kind: "offer_import", local: summaryOf(legacy), localSavedAt: legacy.savedAt || 0 };
  // Misma carrera y la nube va igual o adelante: no hay nada que perder.
  if (cloud.startedAt === legacy.startedAt && (cloud.savedAt || 0) >= (legacy.savedAt || 0)) return { kind: "same" };
  return { kind: "conflict", local: summaryOf(legacy), cloud: summaryOf(cloud), localSavedAt: legacy.savedAt || 0 };
}

// ───────────────────────────────────────────── identificador idempotente

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isImportId = (x: unknown): x is string => typeof x === "string" && UUID.test(x);
/**
 * El mismo id mientras la partida local no cambie (recargar o reintentar no crea otra importación).
 * Si la partida local cambió, es otra importación.
 */
export function importIdFor(kv: KV, localSavedAt: number, gen: () => string = () => crypto.randomUUID()): string {
  const cur = parse(kv.getItem(IMPORT_ID_KEY)) as { id?: unknown; savedAt?: unknown } | null;
  if (cur && isImportId(cur.id) && cur.savedAt === localSavedAt) return cur.id;
  const id = gen();
  try { kv.setItem(IMPORT_ID_KEY, JSON.stringify({ id, savedAt: localSavedAt })); } catch { /* ignore */ }
  return id;
}

/** Registrar la decisión del jugador sobre la partida local. No borra el original. */
export function claimLegacy(kv: KV, c: Omit<Claim, "at">, now = Date.now()) {
  try { kv.setItem(CLAIM_KEY, JSON.stringify({ ...c, at: now })); } catch { /* ignore */ }
}
/**
 * Solo DESPUÉS de que el servidor confirmó: la partida vieja pasa a respaldo (recuperable) y la de la
 * cuenta queda en su clave propia. Así ningún otro usuario de este navegador la vuelve a ver como suya.
 */
export function finishImport(kv: KV, uid: string, imported: CeoState, importId: string, now = Date.now()) {
  const raw = kv.getItem(LEGACY_KEY);
  try {
    if (raw) kv.setItem(BACKUP_KEY, JSON.stringify({ uid, importId, at: now, state: parse(raw) }));
    writeOwner(kv, uid, imported);
    claimLegacy(kv, { uid, how: "importada", savedAt: imported.origin?.localSavedAt ?? imported.savedAt, importId }, now);
    kv.removeItem(LEGACY_KEY);
    kv.removeItem(IMPORT_ID_KEY);
  } catch { /* si algo falla, la copia vieja sigue ahí */ }
}
export function readBackup(kv: KV): { uid: string; importId: string; at: number; state: unknown } | null {
  const b = parse(kv.getItem(BACKUP_KEY)) as { uid?: unknown; importId?: unknown; at?: unknown; state?: unknown } | null;
  return b && typeof b.uid === "string" && typeof b.importId === "string" ? (b as { uid: string; importId: string; at: number; state: unknown }) : null;
}

// ───────────────────────────────────────────── validación (servidor)

export type ImportCheck =
  | { ok: true; state: CeoState; warnings: string[] }
  | { ok: false; error: "vacia" | "muy_grande" | "sin_iniciar" | "fecha_futura" | "empresa_desconocida" | "decision_invalida" | "carrera_invalida" };

/**
 * Valida una partida que llega del navegador. No «corrige» nada: si algo no cuadra, se rechaza y la copia
 * local se queda intacta para que soporte la revise. Lo que sí hace es leerla con `migrate` (como siempre).
 * Revisión histórica posible con lo que guardaba la v2: cada decisión apunta a un asunto real de su
 * empresa y a una opción que existe; cada empresa cerrada es una empresa real.
 */
export function validateImport(raw: unknown, now: number): ImportCheck {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "vacia" };
  let size = 0;
  try { size = JSON.stringify(raw).length; } catch { return { ok: false, error: "vacia" }; }
  if (size > IMPORT_MAX_BYTES) return { ok: false, error: "muy_grande" };
  const r = raw as Record<string, unknown>;
  if (typeof r.company === "string" && !isCompany(r.company)) return { ok: false, error: "empresa_desconocida" };
  const s = migrate(raw);
  if (!started(s)) return { ok: false, error: "sin_iniciar" };
  const SLACK = 10 * 60 * 1000;
  const real = (t: unknown) => typeof t === "number" && Number.isFinite(t) && t > 0;
  // El adelanto de reloj de prueba se respeta (es parte de cómo se jugó), pero las fechas reales no pueden ser futuras.
  if ((s.savedAt || 0) > now + SLACK || s.startedAt! > now + SLACK) return { ok: false, error: "fecha_futura" };
  const warnings: string[] = [];
  const checkDecisions = (company: string, ds: Record<string, unknown>) => {
    const pack = withBank(companyById(company));
    for (const [id, d] of Object.entries(ds ?? {})) {
      const it = pack.items.find((i) => i.id === id);
      const dd = d as { option?: unknown; at?: unknown } | null;
      if (!it || !dd || typeof dd.option !== "string" || !it.options.some((o) => o.id === dd.option) || !real(dd.at)) return false;
    }
    return true;
  };
  if (!checkDecisions(s.company, s.decisions)) return { ok: false, error: "decision_invalida" };
  for (const run of s.career) {
    if (!run || typeof run.company !== "string" || !COMPANIES.some((c) => c.id === run.company)) return { ok: false, error: "carrera_invalida" };
    if (typeof run.xp !== "number" || !Number.isFinite(run.xp) || run.xp < 0 || run.xp > 100_000) return { ok: false, error: "carrera_invalida" };
    if (!checkDecisions(run.company, run.decisions)) return { ok: false, error: "decision_invalida" };
  }
  if (s.clockOffset) warnings.push("reloj_de_prueba");
  if (s.origin) warnings.push("ya_importada_antes");
  return { ok: true, state: s, warnings };
}

/**
 * Marca de procedencia: de qué empresa fundacional venía, con qué reglas y qué versión del catálogo.
 * No cambia la historia jugada (no se reetiqueta la industria ni se inventan memos).
 */
export function markLegacy(s: CeoState, importId: string, now: number): CeoState {
  const variant = catalogCompanyById(s.company);
  return {
    ...s,
    origin: {
      kind: "importada_navegador",
      importId,
      importedAt: now,
      localSavedAt: s.savedAt || 0,
      legacyCompanyId: s.company,
      companyVariantId: variant?.foundational ? variant.id : s.company,
      rulesVersion: rulesVersionOf(s),
      catalogMigrationVersion: CATALOG_VERSION,
    },
  };
}

/** Correo de ayuda para fusionar (no se fusiona nada automáticamente). Sin datos privados en el enlace. */
export function helpMailto(local: CareerSummary, cloud?: CareerSummary): string {
  const lines = [
    "Hola, quiero ayuda para juntar dos carreras de mêtis CEO.",
    "",
    `En este navegador: ${local.company}, ${local.xp} XP, ${local.stage}, ${local.decisions} decisiones.`,
    cloud ? `En mi cuenta: ${cloud.company}, ${cloud.xp} XP, ${cloud.stage}, ${cloud.decisions} decisiones.` : "",
  ].filter((x, i) => x || i === 1);
  return `mailto:${HELP_EMAIL}?subject=${encodeURIComponent("Ayuda para juntar mis carreras")}&body=${encodeURIComponent(lines.join("\n"))}`;
}
