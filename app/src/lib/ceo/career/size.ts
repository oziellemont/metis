/**
 * mêtis CEO · montos y plantilla escalados al tamaño de la empresa (P1-A).
 *
 * Los paquetes aprobados están escritos para una empresa establecida (Cumbre: $410 M al año y 240 personas).
 * Una PYME de la misma industria vende mucho menos, así que sus casos hablan de montos proporcionales:
 *  - El factor sale del perfil de negocio: ventas de la PYME / ventas de la establecida (alimentos: 4.0 / 34.2).
 *    Así el caso y el estado de resultados cuentan la misma historia ($48 M al año en los dos).
 *  - Se escalan los montos en millones («$40 M», «$410 millones») y los montos en miles que el caso marca en
 *    `scaleMil` («$420 mil» de penalización). Los que son de una persona (viáticos, sueldo semanal) no se tocan.
 *  - Los porcentajes, plazos, razones y conteos de tiendas del cliente no cambian: el escalamiento conserva las
 *    proporciones (si el ahorro era la cuarta parte de la inversión, sigue siéndolo).
 *  - La plantilla y otros tamaños concretos («240 colaboradores», «22 personas de empaque») se cambian con una tabla
 *    explícita por paquete y tipo. La prueba de auditoría revisa que no quede ninguno sin cambiar.
 * Los ids, efectos y reglas no se tocan. Sin tipo o con «establecida», el paquete queda igual.
 */
import type { CompanyPack, Item } from "../types";
import type { CompanyArchetype } from "./taxonomy";
import { profileFor } from "../business/profiles";
import { CASE_TAGS } from "../companies/tags";

/** Factor de tamaño (ventas del tipo / ventas de la establecida) para el perfil de negocio del paquete. */
export function sizeFactor(packId: string, a: CompanyArchetype | undefined): number {
  if (!a || a === "establecida") return 1;
  const b = profileFor(undefined, packId).baselines;
  return b[a].revenue / b.establecida.revenue;
}

/** Monto redondeado como lo escribiría Finanzas: «$48 M», «$4.7 M», «$600 mil», «$50 mil». */
export function niceMoney(millions: number, unit: "M" | "millones" = "M"): string {
  const v = Math.abs(millions);
  if (v >= 1) {
    const n = v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
    return `$${n.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${unit}`;
  }
  const k = v * 1000;
  const r = k >= 100 ? Math.round(k / 10) * 10 : Math.max(5, Math.round(k / 5) * 5);
  return `$${r.toLocaleString("en-US")} mil`;
}

const MONEY_RE = /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s?(M|millones|mil)(?![\p{L}\p{N}])/gu;
/** Escala los montos de un texto. Los de miles solo si están en `mil` (texto exacto, p. ej. «$420 mil»). */
export function scaleMoneyText(t: string, factor: number, mil: readonly string[] = []): string {
  if (factor === 1 || !t.includes("$")) return t;
  return t.replace(MONEY_RE, (m, num: string, unit: string) => {
    const n = Number(num.replace(/,/g, ""));
    if (unit === "mil") return mil.includes(m) ? niceMoney((n / 1000) * factor) : m;
    return niceMoney(n * factor, unit === "millones" ? "millones" : "M");
  });
}

/** Tamaños concretos (personas, puestos) por paquete y tipo. Frases completas para no tocar otra cosa. */
export const SIZE_TEXT: Readonly<Record<string, Partial<Record<CompanyArchetype, readonly [string, string][]>>>> = Object.freeze({
  cumbre: {
    pyme: [
      ["240 colaboradores", "45 colaboradores"],
      ["240 (168 en planta)", "45 (32 en planta)"],
      ["los 12 líderes clave", "los 6 líderes clave"],
      ["22 en empaque", "4 en empaque"],
      ["A las 22 personas de empaque", "A las 4 personas de empaque"],
      ["26 vacantes abiertas", "5 vacantes abiertas"],
      ["me reuní con 40 personas", "me reuní con 30 personas"],
      // La marca premium de Diego: una PYME no lanza con TV en 1,200 tiendas; crece en su región.
      ["el lanzamiento nacional: TV regional, influencers y 1,200 tiendas", "el lanzamiento regional: redes, influencers y 300 tiendas"],
      ["300 tiendas del noreste", "100 tiendas del noreste"],
      ["saltar de 30 a 1,200 tiendas", "saltar de 30 a 300 tiendas"],
      ["Lanzamiento nacional inmediato", "Lanzamiento regional inmediato"],
    ],
  },
});

/** Llaves que nunca se escalan: ids y el caso real de otra empresa (sus cifras son de esa empresa). */
const SKIP = new Set(["id", "from", "who", "item", "trigger", "lesson", "real", "areas", "effects", "style", "stance", "score"]);
function deep<T>(x: T, f: (s: string) => string): T {
  if (typeof x === "string") return f(x) as T;
  if (Array.isArray(x)) return x.map((y) => deep(y, f)) as T;
  if (x && typeof x === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) out[k] = SKIP.has(k) ? v : deep(v, f);
    return out as T;
  }
  return x;
}

/** Paquete con montos y plantilla del tamaño del tipo de empresa (copia). Con «establecida» o sin tipo, el mismo. */
const MEMO = new WeakMap<CompanyPack, Map<string, CompanyPack>>();
export function sizedPack(pack: CompanyPack, a: CompanyArchetype | undefined): CompanyPack {
  const factor = sizeFactor(pack.id, a);
  const words = (a && SIZE_TEXT[pack.id]?.[a]) || [];
  if (factor === 1 && !words.length) return pack;
  let memo = MEMO.get(pack);
  if (!memo) { memo = new Map(); MEMO.set(pack, memo); }
  const hit = memo.get(a!);
  if (hit) return hit;
  const out = build(pack, factor, words);
  memo.set(a!, out);
  return out;
}
function build(pack: CompanyPack, factor: number, words: readonly (readonly [string, string])[]): CompanyPack {
  const phrases = (t: string) => words.reduce((acc, [from, to]) => acc.split(from).join(to), t);
  const text = (mil: readonly string[]) => (t: string) => phrases(scaleMoneyText(t, factor, mil));
  const { items, ...rest } = pack;
  const head = deep(rest, text([]));
  const sized: Item[] = items.map((it) => deep(it, text(CASE_TAGS[it.id]?.scaleMil ?? [])));
  return { ...head, id: pack.id, items: sized } as CompanyPack;
}
