/**
 * mêtis CEO · Mastery Engine.
 *
 * Dominio real (0–100) en 8 competencias, calculado SOLO con evidencia de lo que el jugador hizo.
 * Es independiente del XP: el XP mide constancia, esto mide qué tan bien decides.
 *
 * De dónde sale cada punto (máximo 100 por competencia):
 *  - Decisiones (hasta 70): calidad promedio de tus decisiones en asuntos de esa competencia,
 *    multiplicada por la «confianza» (cuánta evidencia hay). Pesan más las empresas más exigentes.
 *    Un asunto que dejaste vencer cuenta como decisión de calidad 0. Los dilemas de personas
 *    cuentan como media decisión.
 *  - Consistencia (hasta 10): en cuántas empresas distintas mantuviste buen criterio (3 = máximo).
 *  - Retos (hasta 10): empresas aprobadas y proyectos de cambio logrados.
 *  - Academy (hasta 10): lecciones de esa competencia. Leer suma, pero con tope: no basta.
 *  - `extra`: reservado para evidencia futura (prácticas del simulador, razonamiento evaluado por IA
 *    en modo sombra). Hoy siempre es 0, y aun así nunca puede pasar de 100 el total.
 *
 * Lógica pura: sin React ni navegador. Sirve igual en la app, en el servidor y en las pruebas.
 */
import type { Area, CeoState, Item } from "./types";
import { companyById } from "./companies";
import { isBankId, withBank } from "./cases/bank";
import { dilemmaById, type DilemmaTheme } from "./dilemmas";
import { lessonById, trackOf } from "./lessons";
import { entries, nowOf } from "./engine";

export type Competency = "personas" | "estrategia" | "comunicacion" | "ejecucion" | "mercado" | "etica" | "negociacion" | "finanzas";

export const COMPETENCIES: { id: Competency; name: string; short: string }[] = [
  { id: "personas", name: "Liderazgo de personas", short: "Personas" },
  { id: "estrategia", name: "Estrategia", short: "Estrategia" },
  { id: "comunicacion", name: "Comunicación e influencia", short: "Comunicación" },
  { id: "ejecucion", name: "Ejecución y operación", short: "Ejecución" },
  { id: "mercado", name: "Mercado y clientes", short: "Mercado" },
  { id: "etica", name: "Ética y cultura", short: "Ética" },
  { id: "negociacion", name: "Negociación", short: "Negociación" },
  { id: "finanzas", name: "Finanzas", short: "Finanzas" },
];
export const COMPETENCY_IDS = COMPETENCIES.map((c) => c.id);
export const competencyById = (id: Competency) => COMPETENCIES.find((c) => c.id === id)!;

/** Niveles de dominio (nombres en inglés, aprobados por producto). */
export const MASTERY_LEVELS = [
  { min: 0, name: "Novice" },
  { min: 20, name: "Developing" },
  { min: 40, name: "Competent" },
  { min: 55, name: "Solid" },
  { min: 70, name: "Advanced" },
  { min: 85, name: "Expert" },
] as const;
export type MasteryLevelName = (typeof MASTERY_LEVELS)[number]["name"];
export const LEVEL_MIN: Record<MasteryLevelName, number> = Object.fromEntries(MASTERY_LEVELS.map((l) => [l.name, l.min])) as Record<MasteryLevelName, number>;
export function masteryLevelOf(v: number): { i: number; name: MasteryLevelName; min: number; next?: { name: MasteryLevelName; min: number } } {
  let i = 0;
  MASTERY_LEVELS.forEach((l, j) => { if (v >= l.min) i = j; });
  const next = MASTERY_LEVELS[i + 1];
  return { i, name: MASTERY_LEVELS[i].name, min: MASTERY_LEVELS[i].min, next: next ? { name: next.name, min: next.min } : undefined };
}

// ───────────────────────────────────────────── de qué competencia es cada cosa
/** Áreas de los asuntos del simulador → competencias. */
export const AREA_TO: Record<Area, Competency[]> = {
  personas: ["personas"],
  estrategia: ["estrategia"],
  finanzas: ["finanzas"],
  clientes: ["mercado"],
  operacion: ["ejecucion"],
  cultura: ["etica"],
  etica: ["etica"],
  comunicacion: ["comunicacion"],
  negociacion: ["negociacion"],
  alineacion: ["comunicacion", "estrategia"],
};
/** Temas de Academy → competencias. */
export const TRACK_TO: Record<string, Competency[]> = {
  mentalidad: ["personas"],
  personas: ["personas"],
  conversaciones: ["comunicacion"],
  equipos: ["personas"],
  alineacion: ["comunicacion", "estrategia"],
  negociacion: ["negociacion"],
  comunicacion: ["comunicacion"],
  cultura: ["etica"],
  finanzas: ["finanzas"],
  innovacion: ["estrategia"],
  estrategia: ["estrategia"],
  crisis: ["ejecucion", "comunicacion"],
  consejo: ["estrategia", "comunicacion"],
};
/** Temas de los dilemas de personas → competencias (todos son de liderazgo; algunos tocan otra más). */
export const THEME_TO: Record<DilemmaTheme, Competency[]> = {
  nuevo: ["personas"], veterano: ["personas"], estrella: ["personas"], desempeno: ["personas"],
  quejas: ["personas"], conducta: ["personas", "etica"], delegar: ["personas"], ascenso: ["personas"],
  conflicto: ["personas", "negociacion"], retener: ["personas"], personal: ["personas"], salida: ["personas", "etica"],
};
export const competenciesOfItem = (it: Pick<Item, "areas">): Competency[] => [...new Set(it.areas.flatMap((a) => AREA_TO[a] ?? []))];

// ───────────────────────────────────────────── pesos (calibrados con las partidas doradas)
export const MASTERY_W = {
  decisions: 70,
  /** Evidencia a la que la confianza llega a 50 %: con K decisiones «ponderadas» ya cuenta la mitad. */
  confidenceK: 6,
  /** Peso extra por cada nivel de exigencia de la empresa. */
  perTier: 0.15,
  dilemma: 0.5,
  consistency: 10,
  /** Para contar como «buen criterio» en una empresa: al menos N asuntos con calidad promedio ≥ Q. */
  consistencyMinN: 3,
  consistencyQ: 0.6,
  consistencyCompanies: 3,
  challenges: 10,
  passedRun: 3,
  changeOk: 4,
  academy: 10,
  perLesson: 4,
} as const;

/** Qué recompensa un reto, por competencia. */
const PASSED_RUN_TO: Competency[] = ["ejecucion", "finanzas", "mercado"];
const CHANGE_OK_TO: Competency[] = ["personas", "comunicacion", "ejecucion"];

// ───────────────────────────────────────────── evidencia
export interface Evidence {
  kind: "decision" | "expired" | "dilemma";
  /** Empresa donde ocurrió (los dilemas no tienen). */
  company?: string;
  /** Índice de la temporada (0 = primera empresa jugada); -1 para dilemas. */
  run: number;
  tier: number;
  /**
   * Calidad 0…1 (puntaje de la opción / 3). En un vencido es 0 pero NO se usa (1.3, auditoría C2):
   * no responder es ausencia de evidencia, no incompetencia. El vencido solo cuenta como asunto que te tocó.
   */
  q: number;
  competencies: Competency[];
}

/** Todas las piezas de evidencia de decisión de la carrera: empresas anteriores, actual y dilemas. */
export function evidenceOf(s: CeoState, now = nowOf(s)): Evidence[] {
  const out: Evidence[] = [];
  const career = s.career ?? [];
  career.forEach((r, run) => {
    const p = withBank(companyById(r.company));
    for (const it of p.items) {
      const d = r.decisions?.[it.id];
      // Del banco de casos solo cuenta lo que te llegó y decidiste (el catálogo trae todos los posibles).
      if (!d && isBankId(it.id)) continue;
      const comps = competenciesOfItem(it);
      if (!comps.length) continue;
      if (d) {
        const o = it.options.find((x) => x.id === d.option);
        if (o) out.push({ kind: "decision", company: r.company, run, tier: r.tier, q: o.score / 3, competencies: comps });
      } else if (!it.trigger) {
        // Asunto base sin decisión en una empresa ya cerrada: se dejó vencer.
        out.push({ kind: "expired", company: r.company, run, tier: r.tier, q: 0, competencies: comps });
      }
    }
  });
  if (s.startedAt) {
    for (const e of entries(s, now)) {
      const comps = competenciesOfItem(e.item);
      if (!comps.length) continue;
      if (e.status === "decidido" && e.option) out.push({ kind: "decision", company: s.company, run: career.length, tier: s.tier, q: e.option.score / 3, competencies: comps });
      else if (e.status === "vencido") out.push({ kind: "expired", company: s.company, run: career.length, tier: s.tier, q: 0, competencies: comps });
    }
  }
  for (const [id, a] of Object.entries(s.dilemmas ?? {})) {
    const d = dilemmaById(id);
    const o = d?.options[a.option];
    if (d && o) out.push({ kind: "dilemma", run: -1, tier: 0, q: o.score / 3, competencies: THEME_TO[d.theme] ?? ["personas"] });
  }
  return out;
}

export interface CompetencyMastery {
  id: Competency;
  name: string;
  value: number;
  level: ReturnType<typeof masteryLevelOf>;
  /** Desglose (para explicar al jugador de dónde sale su número). */
  parts: { decisions: number; consistency: number; challenges: number; academy: number; extra: number };
  /** Cuánta evidencia de decisión hay (decisiones + dilemas; los vencidos no cuentan). */
  n: number;
  /** Calidad promedio de esas decisiones (0…1), o null si no hay. */
  quality: number | null;
}
export type Mastery = Record<Competency, CompetencyMastery>;

const round1 = (x: number) => Math.round(x * 10) / 10;

/**
 * Dominio de las 8 competencias.
 * `extra` permite sumar evidencia futura (p. ej. razonamiento evaluado por IA) sin cambiar esta fórmula;
 * se limita a lo que falte para 100.
 */
export function masteryOf(s: CeoState, now = nowOf(s), extra: Partial<Record<Competency, number>> = {}): Mastery {
  const W = MASTERY_W;
  const ev = evidenceOf(s, now);
  const career = s.career ?? [];
  const out = {} as Mastery;
  for (const c of COMPETENCIES) {
    const seen = ev.filter((e) => e.competencies.includes(c.id));
    // Solo lo que decidiste es evidencia de dominio; un vencido no sube ni baja.
    const mine = seen.filter((e) => e.kind !== "expired");
    // 1 · decisiones
    let sw = 0, sq = 0;
    for (const e of mine) {
      const w = (e.kind === "dilemma" ? W.dilemma : 1) * (1 + W.perTier * e.tier);
      sw += w; sq += w * e.q;
    }
    const quality = sw ? sq / sw : null;
    const conf = sw / (sw + W.confidenceK);
    const decisions = quality === null ? 0 : W.decisions * quality * conf;
    // 2 · consistencia: empresas con buen criterio sostenido en esta competencia
    //    El mínimo de asuntos cuenta los que te tocaron (decididos o vencidos); el promedio, solo los decididos.
    //    Así ninguna empresa que antes contaba deja de contar al retirar los vencidos del promedio.
    const byRun = new Map<number, { seen: number; n: number; q: number }>();
    for (const e of seen) {
      if (e.run < 0) continue;
      const r = byRun.get(e.run) ?? { seen: 0, n: 0, q: 0 };
      r.seen++;
      if (e.kind !== "expired") { r.n++; r.q += e.q; }
      byRun.set(e.run, r);
    }
    const goodCompanies = new Set<string>();
    byRun.forEach((r, run) => {
      if (r.n > 0 && r.seen >= W.consistencyMinN && r.q / r.n >= W.consistencyQ) goodCompanies.add(run < career.length ? career[run].company : s.company);
    });
    const consistency = W.consistency * Math.min(goodCompanies.size, W.consistencyCompanies) / W.consistencyCompanies;
    // 3 · retos
    let ch = 0;
    for (const r of career) {
      if (r.passed && PASSED_RUN_TO.includes(c.id)) ch += W.passedRun;
      if (r.change?.ok && CHANGE_OK_TO.includes(c.id)) ch += W.changeOk;
    }
    const challenges = Math.min(W.challenges, ch);
    // 4 · Academy (con tope)
    let nl = 0;
    for (const id of Object.keys(s.lessons ?? {})) {
      const l = lessonById(id);
      if (l && (TRACK_TO[trackOf(l).track] ?? []).includes(c.id)) nl++;
    }
    const academy = Math.min(W.academy, nl * W.perLesson);
    // 5 · evidencia futura
    const base = decisions + consistency + challenges + academy;
    const ex = Math.max(0, Math.min(extra[c.id] ?? 0, 100 - base));
    const value = Math.max(0, Math.min(100, Math.round(base + ex)));
    out[c.id] = {
      id: c.id, name: c.name, value, level: masteryLevelOf(value),
      parts: { decisions: round1(decisions), consistency: round1(consistency), challenges: round1(challenges), academy: round1(academy), extra: round1(ex) },
      n: mine.length, quality: quality === null ? null : Math.round(quality * 1000) / 1000,
    };
  }
  return out;
}

/** Cuántas competencias están en `min` o más. */
export const countAtLeast = (m: Mastery, min: number) => COMPETENCY_IDS.filter((c) => m[c].value >= min).length;
/** Competencias ordenadas de la más débil a la más fuerte (empate: orden oficial). */
export const weakestFirst = (m: Mastery) => COMPETENCY_IDS.slice().sort((a, b) => m[a].value - m[b].value || COMPETENCY_IDS.indexOf(a) - COMPETENCY_IDS.indexOf(b));
