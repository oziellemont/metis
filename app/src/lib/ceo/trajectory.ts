/**
 * mêtis CEO · Trayectoria: la ÚNICA fuente de verdad del avance (doc P0 §4, rediseño de progresión).
 *
 * Tres dimensiones que nunca se mezclan:
 *  A. Mandato y trayectoria de la empresa (este módulo): tu nombramiento real, el capítulo en que está la empresa,
 *     el encargo del consejo, las revisiones mensuales, los hitos, las decisiones que marcaron tu gestión y los
 *     compromisos que siguen abiertos. Sale SOLO de lo que pasó en la empresa.
 *  B. Desarrollo del liderazgo: leadership.ts (rúbrica contextual con certeza proporcional a la evidencia).
 *  C. Constancia: XP, racha y meta diaria (engine.ts). Nunca entra aquí: este módulo no lee XP, racha, lecciones
 *     ni el antiguo Executive Journey, y una prueba lo verifica.
 *
 * Capítulo de la empresa: es el mismo cálculo que ya usa el motor (career/stages.ts → companyStageOf); aquí solo se
 * nombra y se explica. Por eso Hoy, Carrera y Perfil no pueden mostrar etapas distintas, y nada de lo que hace el
 * motor (casos que llegan, exigencia) cambia. Un mes desfavorable no degrada ni reinicia: la empresa sigue en su
 * capítulo y el consejo pide corregir.
 *
 * Función pura, de solo lectura y determinista: mismo estado y misma hora, misma trayectoria. No guarda nada.
 */
import { COMPANY_STAGES } from "./career/identity";
import { LAST_COMPANY_STAGE, STAGE_MONTHS, STAGE_NEEDS_PASS } from "./career/stages";
import { KPI_KEYS, KPI_LABEL, closedRunsOf, companyStageOf, entries, healthOf, isContinuous, kpis, packOf, reportDueOf, verdictOf } from "./engine";
import { isRedLine } from "./editorial";
import type { CareerRun, CeoState, Entry, KpiKey, Kpis } from "./types";

/** Para qué sirve cada capítulo (texto de referencia; no es un rango ni un requisito). */
export const CHAPTER_FOCUS: Record<(typeof COMPANY_STAGES)[number]["id"], string> = {
  tomar_el_mando: "Entender lo que heredaste, priorizar y ganarte la confianza del equipo y del consejo.",
  estabilizar: "Corregir caja, servicio, costos y ejecución hasta que la operación deje de sorprenderte.",
  construir_capacidad: "Fortalecer mandos, procesos y talento para que la empresa no dependa solo de ti.",
  acelerar: "Elegir dónde invertir y dónde no: crecer solo donde el negocio lo sostiene.",
  escalar: "Llevar varias áreas, regiones o alianzas a la vez, cuando tiene sentido hacerlo.",
  gobernar: "Dirigir con más exposición, más grupos de interés y riesgos de mayor alcance.",
};

export interface Chapter {
  idx: number;
  id: string;
  label: string;
  focus: string;
  /** Meses cerrados en este capítulo (sin contar el mes en curso). */
  months: number;
  /** Qué pide el consejo para que la empresa abra el siguiente capítulo (null en el último). Es del negocio, no tuyo. */
  next: { label: string; text: string } | null;
}

export interface BoardReviewRow {
  period: number;
  /** El consejo aprobó el cierre (o no). Un mes no aprobado no degrada ni reinicia nada. */
  passed: boolean;
  health: number;
  chapter: string;
  /** Capítulo que abrió la empresa al cierre de este mes (si abrió uno). */
  opened?: string;
  endedAt: number;
}

export type MilestoneKind = "nombramiento" | "capitulo" | "revision" | "recuperacion" | "crisis" | "cambio";
export interface Milestone { kind: MilestoneKind; at: number; title: string; text: string }

export interface MarkedDecision { item: string; subject: string; choice: string; outcome: string; at: number; weight: number; period: number | null }

export interface OpenCommitment { item: string; subject: string; text: string; kind: "decision" | "consecuencia" | "reporte" }

export interface Trajectory {
  /** Solo en la carrera continua (empresa propia). En el modo por temporadas no hay trayectoria de empresa. */
  active: boolean;
  /** Tu nombramiento real. Nunca cambia por puntos: lo da la empresa en la que estás. */
  appointment: { title: string; company: string; since: number | null };
  /** Mes en curso (1 = el de tu llegada). */
  month: number;
  chapter: Chapter;
  /** El encargo vigente del consejo y cómo va (null si las reglas del periodo no tienen encargo). */
  mandate: { text: string; objectives: { kpi: KpiKey; label: string; value: number; ok: boolean }[] } | null;
  /** Momento de la empresa en palabras, a partir de su salud de hoy (sin porcentajes globales). */
  moment: { tone: "solida" | "estable" | "tension" | "riesgo"; text: string; health: number };
  reviews: BoardReviewRow[];
  milestones: Milestone[];
  marked: MarkedDecision[];
  open: OpenCommitment[];
  /** Evolución de la empresa (indicadores al cierre de cada mes). Es del negocio, no una medida de tu competencia. */
  evolution: { period: number; health: number; kpis: Kpis }[];
}

const MOMENT: { min: number; tone: Trajectory["moment"]["tone"]; text: string }[] = [
  { min: 70, tone: "solida", text: "La empresa está sólida: el reto es no perder lo construido." },
  { min: 58, tone: "estable", text: "La empresa está estable, con frentes que piden atención." },
  { min: 45, tone: "tension", text: "La empresa está bajo tensión: hay rubros que no aguantan otro golpe." },
  { min: 0, tone: "riesgo", text: "La empresa está en riesgo: el consejo espera un plan de recuperación." },
];
export const momentOf = (health: number): Trajectory["moment"] => {
  const m = MOMENT.find((x) => health >= x.min)!;
  return { tone: m.tone, text: m.text, health };
};

/** Qué tanto marcó una decisión la gestión: cuánto movió la empresa, y más si cruzó una línea roja o detonó consecuencias. */
function weightOf(e: Entry, v: number, triggers: Set<string>): number {
  const eff = e.status === "vencido" ? e.item.expired.effects : e.option?.effects ?? {};
  let w = KPI_KEYS.reduce((a, k) => a + Math.abs(eff[k] ?? 0), 0);
  if (e.decision && isRedLine(e.item.id, e.decision.option, v)) w += 10;
  if (triggers.has(e.item.id)) w += 3;
  return w;
}

function chapterOf(idx: number, months: number): Chapter {
  const st = COMPANY_STAGES[Math.max(0, Math.min(idx, LAST_COMPANY_STAGE))];
  const nx = idx < LAST_COMPANY_STAGE ? COMPANY_STAGES[idx + 1] : null;
  const need = STAGE_MONTHS[idx] ?? 0;
  const text = !nx ? "" : idx === 0
    ? `Tu primer mes es tu llegada. Al cerrarlo, la empresa entra a «${nx.label}», con o sin aprobación del consejo.`
    : `El consejo abre «${nx.label}» cuando la empresa lleva ${need} ${need === 1 ? "mes" : "meses"} en este capítulo y aprueba el cierre del último. Si un mes no se aprueba, la empresa se queda aquí: no hay despido ni reinicio.`;
  return { idx, id: st.id, label: st.label, focus: CHAPTER_FOCUS[st.id], months, next: nx ? { label: nx.label, text } : null };
}

export function trajectoryOf(s: CeoState, now: number): Trajectory {
  const pack = packOf(s);
  const cont = isContinuous(s);
  const runs: CareerRun[] = cont ? closedRunsOf(s) : [];
  const st = companyStageOf(s);
  const v = verdictOf(s, now);
  const k = kpis(s, now);
  const health = healthOf(k);
  const rv = s.rulesVersion ?? 1;

  // Revisiones del consejo: se recorren los meses cerrados con la MISMA regla de capítulos del motor.
  const reviews: BoardReviewRow[] = [];
  const milestones: Milestone[] = [];
  const evolution: Trajectory["evolution"] = [];
  const p = s.companyProfile;
  if (cont && p) milestones.push({ kind: "nombramiento", at: p.appointedAt, title: `Nombramiento en la Dirección General de ${pack.name}`, text: "El consejo te confió la empresa. Desde aquí, todo lo que decides queda en su historia." });
  let idx = 0, months = 0, wasDown = false;
  runs.forEach((r, i) => {
    const before = COMPANY_STAGES[idx].label;
    months++;
    let opened: string | undefined;
    if (idx < LAST_COMPANY_STAGE && months >= STAGE_MONTHS[idx] && (!STAGE_NEEDS_PASS[idx] || r.passed)) { idx++; months = 0; opened = COMPANY_STAGES[idx].label; }
    reviews.push({ period: i + 1, passed: r.passed, health: r.health, chapter: before, ...(opened ? { opened } : {}), endedAt: r.endedAt });
    evolution.push({ period: i + 1, health: r.health, kpis: r.kpis });
    if (opened) milestones.push({ kind: "capitulo", at: r.endedAt, title: `La empresa entra a «${opened}»`, text: `Al cierre del mes ${i + 1}, el consejo abrió un nuevo capítulo.` });
    if (!r.passed) milestones.push({ kind: "revision", at: r.endedAt, title: `Mes ${i + 1}: el consejo pidió corregir`, text: "Sigues al frente; la empresa conserva su capítulo y su historia." });
    if (r.passed && wasDown) milestones.push({ kind: "recuperacion", at: r.endedAt, title: `Mes ${i + 1}: recuperación`, text: "Después de un mes no aprobado, el consejo volvió a aprobar el cierre." });
    if (r.change?.ok) milestones.push({ kind: "cambio", at: r.endedAt, title: `Mes ${i + 1}: proyecto de cambio logrado`, text: "La gente adoptó el cambio a tiempo." });
    wasDown = !r.passed;
  });
  for (const c of s.crises ?? []) {
    if (!cont || c.company !== s.company || (p && c.at < p.appointedAt)) continue;
    milestones.push({ kind: "crisis", at: c.at, title: "Sesión extraordinaria de crisis", text: c.rating === "contenida" ? "La crisis quedó contenida." : c.rating === "danos" ? "La crisis se atendió con daños." : "La crisis rebasó a la empresa; quedó en el acta." });
  }
  milestones.sort((a, b) => a.at - b.at);

  // Decisiones que marcaron la gestión: las de mayor peso, de este mes y de los cerrados.
  const triggersNow = new Set(entries(s, now).filter((e) => e.item.trigger && e.status !== "futuro").map((e) => e.item.trigger!.item));
  const cur = entries(s, now).filter((e) => e.status === "decidido" || e.status === "vencido");
  const marked: MarkedDecision[] = cur.map((e) => ({
    item: e.item.id, subject: e.item.subject,
    choice: e.status === "vencido" ? "Lo dejaste vencer" : e.option?.text ?? "",
    outcome: e.status === "vencido" ? e.item.expired.outcome : e.option?.outcome ?? "",
    at: e.decision?.at ?? e.deadline, weight: weightOf(e, rv, triggersNow), period: cont ? runs.length + 1 : null,
  }));
  const top = marked.filter((m) => m.weight > 0).sort((a, b) => b.weight - a.weight || a.at - b.at).slice(0, 5);

  // Compromisos abiertos: asuntos que esperan, consecuencias de lo que decidiste que ya llegaron, y el reporte pendiente.
  const open: OpenCommitment[] = [];
  const due = reportDueOf(s);
  if (due !== null) open.push({ item: "reporte", subject: `Reporte del mes ${due}`, text: "El cierre del mes anterior espera tu revisión.", kind: "reporte" });
  for (const e of entries(s, now)) {
    if (e.status !== "pendiente") continue;
    open.push({ item: e.item.id, subject: e.item.subject, text: e.item.trigger ? "Consecuencia de una decisión anterior: espera tu respuesta." : "Espera tu decisión.", kind: e.item.trigger ? "consecuencia" : "decision" });
  }

  const mandate = v.v5 ? {
    text: v.v5.objectiveText,
    objectives: v.v5.objectives.map((o) => ({ kpi: o.kpi, label: pack.kpiLabel[o.kpi] ?? KPI_LABEL[o.kpi], value: o.value, ok: o.ok })),
  } : null;

  return {
    active: cont,
    appointment: { title: `Director General de ${pack.name}`, company: pack.name, since: p?.appointedAt ?? s.startedAt ?? null },
    month: runs.length + 1,
    chapter: chapterOf(cont ? st.idx : 0, cont ? st.months : 0),
    mandate,
    moment: momentOf(health),
    reviews,
    milestones,
    marked: top,
    open,
    evolution,
  };
}

/** Compromiso abierto más relevante para el resumen de Hoy. Si no hay ninguno, no se muestra nada. */
export function headlineOf(t: Trajectory): { label: string; text: string } | null {
  const c = t.open.find((x) => x.kind === "consecuencia") ?? t.open.find((x) => x.kind === "reporte");
  return c ? { label: "Compromiso abierto", text: c.subject } : null;
}

/**
 * Etiqueta corta del mandato para correos, el renglón de jugadores y la importación de partidas: el cargo real y el
 * capítulo de la empresa. Sustituye al antiguo nombre de etapa del Executive Journey (nunca depende de XP).
 */
export function mandateLabelOf(s: CeoState): string {
  if (!isContinuous(s) || !s.companyProfile) return "Director General";
  return `Director General · ${COMPANY_STAGES[Math.min(companyStageOf(s).idx, LAST_COMPANY_STAGE)].label}`;
}
