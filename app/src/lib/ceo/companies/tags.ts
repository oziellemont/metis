/**
 * mêtis CEO · Auditoría de casos (P1-A).
 *
 * Cada asunto de los paquetes (Cumbre, Forja, Brasa) y cada caso ejecutivo lleva una etiqueta:
 *  - `scope`: universal (sirve en cualquier industria), familia (en todas las de su familia operativa: producción,
 *    hospitalidad…) o paquete (necesita una variante para otra industria). Confirma la clasificación del plan P0-A §5.1.
 *  - `archetypes`: tipos de empresa en los que el caso es coherente, ya con los montos escalados al tamaño.
 *  - `scaleMil`: montos en miles que también escalan con el tamaño (los de millones escalan siempre; los que son de
 *    una persona, como un sueldo o unos viáticos, nunca).
 *  - `note`: por qué no aplica a otro tipo.
 * Lo demás se deriva del caso y no se duplica aquí: competencias (`areas`), personajes (`from`, `involves`, `lines`),
 * KPI que mueve (efectos de sus opciones) y dependencias (`trigger`). Ver los helpers al final.
 *
 * Regla de calidad: un caso que no es compatible no se muestra. Es preferible tener menos casos a meter uno incoherente.
 * Las consecuencias cuyo detonador no se muestra tampoco se muestran.
 */
import type { CompanyArchetype } from "../career/taxonomy";
import type { CompanyStage } from "../career/identity";
import type { CastId, Item, KpiKey } from "../types";

export type CaseScope = "universal" | "familia" | "paquete";
export interface CaseTag {
  scope: CaseScope;
  archetypes: readonly CompanyArchetype[];
  scaleMil?: readonly string[];
  note?: string;
}

const BOTH: readonly CompanyArchetype[] = ["pyme", "establecida"];
const EST: readonly CompanyArchetype[] = ["establecida"];
const FORJA_NOTE = "Fabricante de 1,100 personas, propiedad de un fondo y con 72% de la venta en una armadora: una PYME necesita otra versión del caso.";
const BRASA_NOTE = "Cadena de 34 sucursales: una PYME de restaurantes (una o dos sucursales) necesita otra versión del caso.";
const EPISODE_NOTE = "Los montos se calculan dentro del caso (reglas y respuestas); todavía no se escalan por tamaño.";

const u = (archetypes: readonly CompanyArchetype[], extra: Partial<CaseTag> = {}): CaseTag => ({ scope: "universal", archetypes, ...extra });
const f = (archetypes: readonly CompanyArchetype[], extra: Partial<CaseTag> = {}): CaseTag => ({ scope: "familia", archetypes, ...extra });
const p = (archetypes: readonly CompanyArchetype[], extra: Partial<CaseTag> = {}): CaseTag => ({ scope: "paquete", archetypes, ...extra });

/** Etiquetas por id de asunto (los ids son únicos entre paquetes). */
export const CASE_TAGS: Readonly<Record<string, CaseTag>> = Object.freeze({
  // ── Cumbre · alimentos (familia producción). Familiar, designado por los dueños: vale para PYME con montos escalados.
  "d1-bienvenida": f(BOTH),
  "d1-hector": u(BOTH),
  "d2-supernorte": p(BOTH),
  "d2-ana": u(BOTH),
  "c-hector-aliado": p(BOTH),
  "d3-planta": f(BOTH, { scaleMil: ["$420 mil"] }),
  "d3-diego": f(BOTH, { scaleMil: ["$800 mil"] }),
  "c-hector-renuncia": u(BOTH),
  "d4-objetivos": u(BOTH),
  "d4-sindicato": f(BOTH),
  "c-supernorte-castigo": p(BOTH),
  "d5-credito": f(BOTH),
  "d5-consejo": u(BOTH),
  "c-ana-brilla": u(BOTH),
  "c-planta-accidente": f(BOTH),
  "d6-gastos": u(BOTH),
  "d6-clima": u(BOTH),
  "c-ana-renuncia": u(BOTH),
  "c-piloto": p(BOTH),
  "d7-sucesion": u(BOTH),
  // ── Forja · autopartes (familia producción)
  "fn-d1-carta": p(EST, { note: FORJA_NOTE }),
  "fn-d1-andon": f(EST, { note: FORJA_NOTE }),
  "fn-d2-precio": p(EST, { note: FORJA_NOTE }),
  "fn-d2-soldadores": f(EST, { note: FORJA_NOTE }),
  "fn-c-escape": f(EST, { note: FORJA_NOTE }),
  "fn-d3-ppap": p(EST, { note: FORJA_NOTE }),
  "fn-c-kaizen": f(EST, { note: FORJA_NOTE }),
  "fn-d4-recap": u(EST, { note: FORJA_NOTE }),
  "fn-d4-pleito": u(EST, { note: FORJA_NOTE }),
  "fn-d5-ciber": u(EST, { note: FORJA_NOTE }),
  "fn-d5-plataforma": p(EST, { note: FORJA_NOTE }),
  "fn-c-laura": u(EST, { note: FORJA_NOTE }),
  "fn-d6-proveedor": f(EST, { note: FORJA_NOTE }),
  "fn-d6-denuncia": u(EST, { note: FORJA_NOTE }),
  "fn-c-escuela": f(EST, { note: FORJA_NOTE }),
  "fn-d7-consejo": f(EST, { note: FORJA_NOTE }),
  "fn-d7-sindicato": f(EST, { note: FORJA_NOTE }),
  // ── Brasa · restaurantes (familia hospitalidad)
  "gb-d1-carta": p(EST, { note: BRASA_NOTE }),
  "gb-d1-app": f(EST, { note: BRASA_NOTE }),
  "gb-d2-menu": p(EST, { note: BRASA_NOTE }),
  "gb-d2-propinas": f(EST, { note: BRASA_NOTE }),
  "gb-c-app-guerra": f(EST, { note: BRASA_NOTE }),
  "gb-d3-brote": f(EST, { note: BRASA_NOTE }),
  "gb-d3-franquicia": f(EST, { note: BRASA_NOTE }),
  "gb-c-cocinas": p(EST, { note: BRASA_NOTE }),
  "gb-d4-carne": f(EST, { note: BRASA_NOTE }),
  "gb-d4-gerente": u(EST, { note: BRASA_NOTE }),
  "gb-d5-cdmx": f(EST, { note: BRASA_NOTE }),
  "gb-c-franquicia-mala": f(EST, { note: BRASA_NOTE }),
  "gb-d6-dark": p(EST, { note: BRASA_NOTE }),
  "gb-d6-sucesion": f(EST, { note: BRASA_NOTE }),
  "gb-d7-consejo": u(EST, { note: BRASA_NOTE }),
});

/** Etiquetas de los casos ejecutivos (por id de episodio). */
export const EPISODE_TAGS: Readonly<Record<string, CaseTag>> = Object.freeze({
  supernorte: p(EST, { note: EPISODE_NOTE }),
  diego: p(EST, { note: EPISODE_NOTE }),
  alergeno: p(EST, { note: EPISODE_NOTE }),
});

/** Tipo con el que se juzga la compatibilidad. Sin empresa propia (temporadas), todo el contenido es de la establecida. */
const fits = (t: CaseTag | undefined, a: CompanyArchetype | undefined): boolean => !a || (!!t && t.archetypes.includes(a));
export const caseFits = (itemId: string, a: CompanyArchetype | undefined): boolean => fits(CASE_TAGS[itemId], a);
export const episodeFits = (episodeId: string, a: CompanyArchetype | undefined): boolean => fits(EPISODE_TAGS[episodeId], a);

/**
 * Asuntos compatibles con el tipo de empresa. Quita los incompatibles y, en cascada, las consecuencias cuyo
 * detonador ya no está (una consecuencia nunca llega sin su causa). Sin tipo, devuelve la lista tal cual.
 */
export function compatibleItems(items: Item[], a: CompanyArchetype | undefined): Item[] {
  if (!a) return items;
  let out = items.filter((i) => caseFits(i.id, a));
  for (;;) {
    const ids = new Set(out.map((i) => i.id));
    const next = out.filter((i) => !i.trigger || ids.has(i.trigger.item));
    if (next.length === out.length) return out;
    out = next;
  }
}

// ───────────────────────────────────────────── etiquetas derivadas (no se duplican)
/** Etapas de la carrera en que encaja: la carta de llegada solo al tomar el mando; lo demás, también al estabilizar. */
export const caseStages = (it: Pick<Item, "day">): CompanyStage[] => (it.day <= 1 ? ["tomar_el_mando"] : ["tomar_el_mando", "estabilizar"]);
/** KPI que puede mover el caso (cualquier opción o dejarlo vencer). */
export function caseKpis(it: Item): KpiKey[] {
  const ks = new Set<KpiKey>();
  for (const e of [...it.options.map((o) => o.effects), it.expired.effects]) for (const [k, v] of Object.entries(e)) if (v) ks.add(k as KpiKey);
  return [...ks].sort();
}
/** Personajes del caso: quien escribe, los involucrados y quien habla en la junta. */
export const caseCast = (it: Item): CastId[] => [...new Set([it.from, ...(it.involves ?? []), ...(it.lines ?? []).map((l) => l.who)])];
