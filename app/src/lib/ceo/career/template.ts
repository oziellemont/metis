/**
 * mêtis CEO · nombre propio de la empresa en los textos (P0-B2).
 *
 * Los paquetes aprobados (Cumbre, Forja, Brasa) traen su nombre escrito dentro de casos, elenco,
 * episodios y correos. En la carrera continua el jugador le pone nombre a SU empresa, así que hay que
 * mostrar ese nombre sin reescribir ni tocar el contenido aprobado:
 *
 *  - `brandText` cambia en un texto el nombre del paquete por el del jugador, con una tabla explícita
 *    por paquete (nombre completo, nombre corto, marcas y giros como «la primera Brasa»).
 *  - Además resuelve variables de plantilla para el contenido nuevo (motor de casos):
 *    {company_name}, {company_short}, {company_city}, {company_domain}.
 *  - `brandPack` / `brandDeep` devuelven una COPIA de un paquete o episodio con todos sus textos resueltos;
 *    ids, efectos, números y funciones quedan intactos (el motor calcula igual).
 *
 * Sin identidad (temporadas de hoy) nada cambia: el paquete original se usa tal cual.
 */
import type { CompanyPack } from "../types";
import { domainOf } from "./identity";
import { industryLabelFor, lexText } from "./lexicon";

/** Marca del jugador. `specialty` (Lácteos, Arneses eléctricos…) cambia el vocabulario del giro; ver lexicon.ts. */
export interface Brand { name: string; short: string; city?: string; domain?: string; specialty?: string }

export const TEMPLATE_VARS = ["company_name", "company_short", "company_city", "company_domain"] as const;
export type TemplateVar = (typeof TEMPLATE_VARS)[number];
const VAR_RE = /\{(company_[a-z]+)\}/g;
/** ¿Quedó alguna variable de empresa sin resolver? */
export const unresolvedVars = (t: string): string[] => [...t.matchAll(VAR_RE)].map((m) => m[1]);

const L = "\\p{L}\\p{N}";
/** Palabra completa, respetando mayúsculas (así «a la brasa», que es una forma de cocinar, no se toca). */
const word = (w: string) => new RegExp(`(?<![${L}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![${L}])`, "gu");

type Rule = [RegExp, (b: Brand) => string];
/**
 * Giros propios de cada paquete. Van ANTES del cambio genérico de nombre.
 * Si se agrega texto nuevo a un paquete con otra forma del nombre, la prueba de fugas lo detecta.
 */
const PACK_RULES: Record<string, Rule[]> = {
  brasa: [
    [/la primera Brasa/g, (b) => `la primera sucursal de ${b.short}`],
    [word("Brasas"), (b) => `sucursales de ${b.short}`],
  ],
};

/** Nombres fijos de un paquete (para cambiarlos y para detectar fugas). */
export function packNames(p: Pick<CompanyPack, "name" | "short">): string[] {
  return [...new Set([p.name, p.short])].sort((a, b) => b.length - a.length);
}

/** Cambia nombres del paquete por la marca del jugador y resuelve variables de plantilla. */
export function brandText(text: string, pack: Pick<CompanyPack, "id" | "name" | "short" | "city" | "domain">, brand: Brand | null): string {
  const b: Brand = brand ?? { name: pack.name, short: pack.short };
  const city = b.city ?? pack.city;
  const domain = b.domain ?? (brand ? domainOf(b.short) : pack.domain);
  let t = text;
  if (brand) {
    // Primero el vocabulario de la especialidad (botanas → lácteos, soldador → técnico de moldeo…).
    t = lexText(t, pack.id, brand.specialty);
    for (const [re, f] of PACK_RULES[pack.id] ?? []) t = t.replace(re, () => f(b));
    // Primero el nombre completo («Botanas Cumbre»), luego el corto («Cumbre»).
    t = t.replace(word(pack.name), () => b.name);
    if (pack.short !== pack.name) t = t.replace(word(pack.short), () => b.short);
    if (pack.domain) t = t.split(pack.domain).join(domain);
  }
  return t.includes("{company_") ? t.replace(VAR_RE, (m, v: string) => (v === "company_name" ? b.name : v === "company_short" ? b.short : v === "company_city" ? city : v === "company_domain" ? domain : m)) : t;
}

/**
 * Copia profunda con todos los textos resueltos. Las llaves de los objetos, los números, los booleanos
 * y las funciones (reglas de episodios) no cambian.
 */
export function brandDeep<T>(x: T, f: (s: string) => string): T {
  if (typeof x === "string") return f(x) as T;
  if (Array.isArray(x)) return x.map((y) => brandDeep(y, f)) as T;
  if (x && typeof x === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) out[k] = ID_KEYS.has(k) && !isProse(v) ? v : brandDeep(v, f);
    return out as T;
  }
  return x;
}
/** Un texto con espacios nunca es un id (p. ej. `real.company`, el nombre de la empresa de un caso real). */
const isProse = (v: unknown): boolean => typeof v === "string" && /\s/.test(v);
/** Campos que son identificadores: nunca se traducen (aunque hoy ninguno contenga un nombre con mayúscula). */
const ID_KEYS = new Set(["id", "from", "who", "item", "company", "trigger", "rules", "replaces", "contentPackId", "a", "b", "assistant", "board", "chair", "reportsTo", "targets"]);

/** Memo por objeto de paquete (el original o su versión escalada a PYME son objetos distintos). */
const CACHE = new WeakMap<CompanyPack, Map<string, CompanyPack>>();
/** Paquete con la marca del jugador (memoizado por paquete + nombre + especialidad). Sin marca, el original. */
export function brandPack(pack: CompanyPack, brand: Brand | null): CompanyPack {
  if (!brand) return pack;
  const key = `${brand.name}|${brand.short}|${brand.city ?? ""}|${brand.specialty ?? ""}`;
  let memo = CACHE.get(pack);
  if (!memo) { memo = new Map(); CACHE.set(pack, memo); }
  const hit = memo.get(key);
  if (hit) return hit;
  const f = (s: string) => brandText(s, pack, brand);
  const out: CompanyPack = { ...brandDeep(pack, f), id: pack.id, name: brand.name, short: brand.short, domain: domainOf(brand.short), industry: industryLabelFor(pack.id, brand.specialty) ?? pack.industry, ...(brand.city ? { city: brand.city } : {}) };
  if (memo.size > 50) memo.clear();
  memo.set(key, out);
  return out;
}
