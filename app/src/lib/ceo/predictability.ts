/**
 * mêtis CEO · Detector de respuestas predecibles (rediseño «sin respuestas obvias»).
 *
 * Clasificador PURO y de solo lectura. Mide si un usuario podría acertar la opción mejor calificada SIN leer el caso:
 *  - por LONGITUD: la más larga es la mejor (en el banco actual, 96.3 %; al azar sería ~34 %);
 *  - por POSICIÓN: la mejor cae casi siempre en el mismo lugar (A, B o C);
 *  - por REDACCIÓN: la mejor es la que más «suena a proceso» (más cláusulas y palabras de manual: escuchar, plan,
 *    acordar, piloto…), o las demás son caricaturas («ignorarlo», «regañarlo en público», «no hacer nada»);
 *  - por DOMINANCIA: una opción es igual o mejor en todo (indicadores, relaciones y criterio) que las demás.
 * Y la validación editorial: al menos dos alternativas razonables por caso.
 *
 * Sirve igual para los asuntos (Item) y para los dilemas diarios (texto + puntaje).
 */
import type { Item, KpiKey } from "./types";

const KEYS: KpiKey[] = ["caja", "margen", "equipo", "clientes", "consejo"];

/** Umbrales (propuesta editorial, versionados). */
export const PREDICTABILITY_RULES = Object.freeze({
  version: 1,
  /** Meta del rediseño: «la más larga es la mejor» por debajo de esto cuando hay UNA sola mejor respuesta. */
  maxLongestBestRate: 0.45,
  /** Con varias respuestas defendibles: ventaja máxima de «elegir la más larga» sobre el azar (puntos). */
  maxLengthLift: 0.1,
  /** Ninguna posición puede concentrar más que esto de las mejores (con 3 opciones, el azar es 0.33). */
  maxPositionShare: 0.5,
  /** Opciones de largo parecido: la más larga no supera a la más corta por más de este factor. */
  maxLengthRatio: 1.3,
  /** «La que más suena a manual es la mejor» por debajo de esto. */
  maxMarkersBestRate: 0.5,
  /** Mínimo de alternativas razonables por caso. */
  minReasonable: 2,
});

/** Conductas que casi nunca son estrategia ejecutiva (salvo que el caso las justifique explícitamente). */
export const CARICATURE = /\b(ignor\w*|no hacer nada|no (contestar|responder)|dejarlo (así|pasar)|regañ\w*|gritar\w*|exhibir\w*|humillar\w*|amenaz\w*|en p[uú]blico|frente a todo\w*|delante de todo\w*|culpar\w*|hacerte de la vista gorda|que se las arregle|esperar a ver qu[eé] pasa)\b/i;
/** Palabras que hacen sonar «correcta» a una opción aunque no lo sea (marcadores de manual). */
export const MANUAL_MARKERS = /\b(escuch\w*|reconoc\w*|acord\w*|plan\b|plan de|juntos|con datos|piloto|prueba|por etapas|escalonad\w*|transparen\w*|alinea\w*|involucr\w*|en privado|1 a 1|uno a uno|evidencia|meta\w* medible\w*|con fecha)\b/gi;

export interface PlainOption { id: string; text: string; score: number; effects?: Partial<Record<KpiKey, number>>; stance?: Record<string, number>; redLine?: boolean }
export interface PlainCase { id: string; source: string; options: PlainOption[]; ethics?: boolean }

export interface CaseCheck {
  id: string;
  source: string;
  bestIds: string[];
  /** La mejor (o una de las mejores) es la más larga y es única en serlo. */
  longestIsBest: boolean;
  /** Razón entre la opción más larga y la más corta (en caracteres). */
  lengthRatio: number;
  /** Posición (0, 1, 2…) de la mejor, si es única. */
  bestPosition: number | null;
  /** La mejor es la que tiene más marcadores de manual (y es única en eso). */
  markersBest: boolean;
  caricatures: string[];
  reasonable: number;
  /** Opción que es igual o mejor que todas en indicadores, relaciones y puntaje. */
  dominant: string | null;
  /** Hallazgos que la hacen predecible (vacío = pasa). */
  flags: ("largo" | "desbalance_largo" | "manual" | "caricatura" | "pocas_razonables" | "dominante" | "mejor_unica")[];
}

const markers = (t: string) => (t.match(MANUAL_MARKERS) ?? []).length;
const sum = (o: Record<string, number | undefined> | undefined) => Object.values(o ?? {}).reduce<number>((a, x) => a + (x ?? 0), 0);

function dominantOf(os: PlainOption[]): string | null {
  for (const a of os) {
    const beats = os.every((b) => {
      if (a === b) return true;
      let strict = false;
      for (const k of KEYS) { const x = a.effects?.[k] ?? 0, y = b.effects?.[k] ?? 0; if (x < y) return false; if (x > y) strict = true; }
      const ra = sum(a.stance), rb = sum(b.stance);
      if (ra < rb || a.score < b.score) return false;
      return strict || ra > rb || a.score > b.score;
    });
    if (beats) return a.id;
  }
  return null;
}

export function checkCase(c: PlainCase): CaseCheck {
  const os = c.options;
  const max = Math.max(...os.map((o) => o.score));
  const best = os.filter((o) => o.score === max);
  const lens = os.map((o) => o.text.length);
  const longest = Math.max(...lens);
  const longestOpts = os.filter((o) => o.text.length === longest);
  const longestIsBest = longestOpts.length === 1 && longestOpts[0].score === max;
  const mk = os.map((o) => markers(o.text));
  const mkMax = Math.max(...mk);
  const mkTop = os.filter((_o, i) => mk[i] === mkMax);
  const markersBest = mkMax > 0 && mkTop.length === 1 && mkTop[0].score === max && best.length === 1;
  const caricatures = os.filter((o) => CARICATURE.test(o.text)).map((o) => o.id);
  const reasonable = os.filter((o) => o.score >= 2 && !o.redLine && !caricatures.includes(o.id)).length;
  const dominant = dominantOf(os);
  const ratio = Math.round((longest / Math.max(1, Math.min(...lens))) * 100) / 100;
  const flags: CaseCheck["flags"] = [];
  // Con varias opciones igual de buenas, que la más larga sea una de ellas puede ser azar: solo se marca si la mejor es única.
  if (longestIsBest && best.length === 1) flags.push("largo");
  if (ratio > PREDICTABILITY_RULES.maxLengthRatio) flags.push("desbalance_largo");
  if (markersBest) flags.push("manual");
  // En temas de ética o seguridad una opción puede cruzar una línea roja a propósito: no cuenta como caricatura.
  if (caricatures.length && !c.ethics) flags.push("caricatura");
  if (reasonable < PREDICTABILITY_RULES.minReasonable && !c.ethics) flags.push("pocas_razonables");
  if (dominant) flags.push("dominante");
  if (best.length === 1 && !c.ethics && os.filter((o) => o.score >= max - 1 && !caricatures.includes(o.id)).length < 2) flags.push("mejor_unica");
  return { id: c.id, source: c.source, bestIds: best.map((o) => o.id), longestIsBest, lengthRatio: ratio, bestPosition: best.length === 1 ? os.indexOf(best[0]) : null, markersBest, caricatures, reasonable, dominant, flags };
}

export interface PredictabilityReport {
  cases: number;
  /** % de casos donde la más larga es la mejor. */
  longestBestRate: number;
  /** Lo esperado por azar (promedio de 1/n opciones). */
  chanceRate: number;
  /** Proporción de mejores únicas en cada posición (A, B, C, D). */
  positionShare: number[];
  /** Lo que daría el azar para «la más larga es una de las mejores» (promedio de mejores / opciones). */
  topChance: number;
  /** Ventaja de la estrategia «elegir la más larga» sobre el azar, en puntos (0 = la longitud no dice nada). */
  lengthLift: number;
  /** % de casos donde la más corta es una de las mejores (para detectar el truco inverso). */
  shortestBestRate: number;
  /** % de casos donde la más corta es la peor (descartar la corta sería un atajo). */
  shortestWorstRate: number;
  /** Reparto de las PEORES respuestas por posición (descartar siempre la D también es un atajo). */
  worstPositionShare: number[];
  /** Casos con una sola mejor respuesta, y en cuántos de ellos es la más larga. */
  uniqueBest: number;
  uniqueLongestBestRate: number;
  /** Reparto de las mejores respuestas por posición, contando empates (cada caso reparte 1 entre sus mejores). */
  topPositionShare: number[];
  markersBestRate: number;
  caricatureRate: number;
  fewReasonableRate: number;
  dominantRate: number;
  medianLengthRatio: number;
  /** Casos que pasan TODAS las pruebas. */
  cleanRate: number;
  checks: CaseCheck[];
}

const r3 = (x: number) => Math.round(x * 1000) / 1000;
export function report(cases: PlainCase[]): PredictabilityReport {
  const checks = cases.map(checkCase);
  const n = Math.max(1, checks.length);
  const uniq = checks.filter((c) => c.bestPosition !== null);
  const maxPos = Math.max(0, ...cases.map((c) => c.options.length));
  const positionShare = Array.from({ length: maxPos }, (_x, i) => r3(uniq.filter((c) => c.bestPosition === i).length / Math.max(1, uniq.length)));
  const ratios = checks.map((c) => c.lengthRatio).sort((a, b) => a - b);
  const longestBestRate = r3(checks.filter((c) => c.longestIsBest).length / n);
  const topChance = r3(cases.reduce((a, c) => a + checks.find((k) => k.id === c.id && k.source === c.source)!.bestIds.length / c.options.length, 0) / n);
  const shortest = cases.filter((c) => { const m = Math.min(...c.options.map((o) => o.text.length)); const sh = c.options.filter((o) => o.text.length === m); const mx = Math.max(...c.options.map((o) => o.score)); return sh.length === 1 && sh[0].score === mx; }).length;
  const shortestWorst = cases.filter((c) => { const m = Math.min(...c.options.map((o) => o.text.length)); const sh = c.options.filter((o) => o.text.length === m); const mn = Math.min(...c.options.map((o) => o.score)); return sh.length === 1 && sh[0].score === mn && c.options.filter((o) => o.score === mn).length === 1; }).length;
  const worstPos = Array.from({ length: maxPos }, () => 0);
  cases.forEach((c) => { const mn = Math.min(...c.options.map((o) => o.score)); const w = c.options.filter((o) => o.score === mn); c.options.forEach((o, i) => { if (o.score === mn) worstPos[i] += 1 / w.length; }); });
  const uniqueBest = checks.filter((c) => c.bestIds.length === 1);
  const topPos = Array.from({ length: maxPos }, () => 0);
  cases.forEach((c, ci) => { const ids = checks[ci].bestIds; c.options.forEach((o, i) => { if (ids.includes(o.id)) topPos[i] += 1 / ids.length; }); });
  return {
    cases: checks.length,
    longestBestRate,
    topChance,
    lengthLift: r3(longestBestRate - topChance),
    shortestBestRate: r3(shortest / n),
    shortestWorstRate: r3(shortestWorst / n),
    worstPositionShare: worstPos.map((x) => r3(x / n)),
    uniqueBest: uniqueBest.length,
    uniqueLongestBestRate: r3(uniqueBest.filter((c) => c.longestIsBest).length / Math.max(1, uniqueBest.length)),
    topPositionShare: topPos.map((x) => r3(x / n)),
    chanceRate: r3(cases.reduce((a, c) => a + 1 / c.options.length, 0) / n),
    positionShare,
    markersBestRate: r3(checks.filter((c) => c.markersBest).length / n),
    caricatureRate: r3(checks.filter((c) => c.flags.includes("caricatura")).length / n),
    fewReasonableRate: r3(checks.filter((c) => c.flags.includes("pocas_razonables")).length / n),
    dominantRate: r3(checks.filter((c) => c.dominant).length / n),
    medianLengthRatio: ratios.length ? ratios[Math.floor(ratios.length / 2)] : 0,
    cleanRate: r3(checks.filter((c) => !c.flags.length).length / n),
    checks,
  };
}

/** Un asunto (Item) visto como caso plano. */
export function itemCase(it: Item, source: string, redLines: string[] = []): PlainCase {
  return {
    id: it.id, source, ethics: it.areas.includes("etica") || redLines.length > 0,
    options: it.options.map((o) => ({ id: o.id, text: o.text, score: o.score, effects: o.effects, stance: o.stance, redLine: redLines.includes(o.id) })),
  };
}
/** Un dilema diario visto como caso plano (las opciones no tienen id: se numeran). */
export function dilemmaCase(d: { id: string; options: { text: string; score: number }[] }): PlainCase {
  return { id: d.id, source: "dilema", options: d.options.map((o, i) => ({ id: String.fromCharCode(97 + i), text: o.text, score: o.score })) };
}

// ───────────────────────────────────────────── coherencia entre lo que te dicen y lo que pasa en la relación
/** Respuesta claramente positiva («Me gusta», «Muy bien», «Gracias»…). */
export const POSITIVE_REPLY = /^(\(.*?\)\s*)?(me gusta|me encanta|muy bien|perfecto|excelente|gracias|muchas gracias|ok\b|va\b|de acuerdo|claro|qué bueno|genial|listo)/i;
/** Acotación que reconoce el malestar (lo que hace coherente un «ok» con una relación que baja). */
export const RESENTMENT_CUE = /(sin mirarte|seco|cortante|tarda en contestar|se nota|no muy convencid|a regañadientes|aunque|pero|como veas|si usted lo dice|entendido\.?$)/i;

export interface ReplyContradiction { item: string; option: string; who: string; delta: number; reply: string }
/** Opciones donde quien escribe contesta en positivo y, en la misma pantalla, su relación baja (sin acotación que lo explique). */
export function replyContradictions(items: Item[]): ReplyContradiction[] {
  const out: ReplyContradiction[] = [];
  for (const it of items) for (const o of it.options) {
    const first = o.reply[0] ?? "";
    const d = o.stance?.[it.from] ?? 0;
    if (d < 0 && POSITIVE_REPLY.test(first.trim()) && !o.reply.some((r) => RESENTMENT_CUE.test(r))) out.push({ item: it.id, option: o.id, who: it.from, delta: d, reply: first });
  }
  return out;
}
