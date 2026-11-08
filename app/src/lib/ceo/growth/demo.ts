/**
 * mêtis CEO · Growth Engine · demostración «antes / después» para revisión (fase 2).
 * Cada escenario juega dos caminos desde el mismo día con la misma semilla y los compara el mismo día:
 * así la diferencia es solo la decisión, no el paso del tiempo. Todas las cifras salen del motor.
 */
import { advance, createCompany } from "./engine";
import { play, untilCase, type Decision } from "./chains";
import { compareStates, sitesOf, teamOf, type Compare, type SiteView, type TeamView } from "./view";
import type { GrowthState } from "./types";

export interface DemoStep { caseId: string; optionId: string }
export interface DemoScenario {
  id: string;
  title: string;
  question: string;
  templateId: string;
  /** Camino de referencia (no hacer o esperar). */
  base: { label: string; steps: DemoStep[] };
  /** Camino con la contratación o la apertura. */
  alt: { label: string; steps: DemoStep[] };
  /** Días después de la primera decisión en los que se comparan ambos caminos. */
  horizon: number;
}

export const DEMO_SCENARIOS: readonly DemoScenario[] = [
  {
    id: "contratacion",
    title: "Contratar un cocinero de línea",
    question: "La cocina se satura en la hora pico. ¿Qué cambia en Mi empresa si contratas un cocinero en lugar de esperar?",
    templateId: "restaurante_emergente",
    base: { label: "Esperar un mes más", steps: [{ caseId: "ga1_cocina", optionId: "esperar" }] },
    alt: { label: "Contratar un cocinero", steps: [{ caseId: "ga1_cocina", optionId: "cocinero" }] },
    horizon: 90,
  },
  {
    id: "apertura",
    title: "Abrir la sucursal Cumbres",
    question: "El dueño propone un segundo local. ¿Qué cambia si lo abres negociando renta de gracia y con el equipo completo?",
    templateId: "restaurante_emergente",
    base: { label: "Dejar pasar el local", steps: [{ caseId: "ga1_cocina", optionId: "cocinero" }, { caseId: "ga2_sucursal", optionId: "no" }] },
    alt: { label: "Abrir Cumbres", steps: [{ caseId: "ga1_cocina", optionId: "cocinero" }, { caseId: "ga2_sucursal", optionId: "gerente_primero" }, { caseId: "ga3_equipo", optionId: "completo" }] },
    horizon: 300,
  },
  {
    id: "turno",
    title: "Abrir un segundo turno en planta",
    question: "Aceptaste un contrato grande. ¿Qué cambia si abres un segundo turno en lugar de sacar lo que se pueda con el actual?",
    templateId: "manufactura_emergente",
    base: { label: "Seguir con un turno", steps: [{ caseId: "gb1_cliente", optionId: "aceptar" }, { caseId: "gb2_capacidad", optionId: "nada" }] },
    alt: { label: "Abrir segundo turno", steps: [{ caseId: "gb1_cliente", optionId: "aceptar" }, { caseId: "gb2_capacidad", optionId: "turno" }] },
    horizon: 150,
  },
];

export interface DemoPath { label: string; state: GrowthState; decisions: Decision[]; team: TeamView; sites: SiteView[] }
export interface DemoResult { scenario: DemoScenario; startDay: number; day: number; base: DemoPath; alt: DemoPath; rows: Compare[] }

/** Juega los pasos; si un caso no llega o una opción no está disponible, lo dice (nunca inventa el resultado). */
function runPath(g0: GrowthState, steps: DemoStep[]): { state: GrowthState; decisions: Decision[]; firstDay: number } {
  let g = g0;
  const decisions: Decision[] = [];
  let firstDay = -1;
  for (const st of steps) {
    const u = untilCase(g, [st.caseId], decisions, 400);
    if (!u.caseId) throw new Error(`El caso ${st.caseId} no llegó.`);
    if (firstDay < 0) firstDay = u.state.day;
    const r = play(u.state, st.caseId, st.optionId, decisions);
    if (!r.ok || !r.decision) throw new Error(`${st.caseId}/${st.optionId}: ${r.reason ?? "no disponible"}`);
    g = r.state;
    decisions.push(r.decision);
  }
  return { state: g, decisions, firstDay };
}

const memo = new Map<string, DemoResult>();

export function runDemo(id: string, seed = "demo"): DemoResult | null {
  const sc = DEMO_SCENARIOS.find((x) => x.id === id);
  if (!sc) return null;
  const key = `${id}|${seed}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const g0 = createCompany(sc.templateId, seed);
  const a = runPath(g0, sc.base.steps);
  const b = runPath(g0, sc.alt.steps);
  const day = Math.max(a.firstDay, b.firstDay) + sc.horizon;
  const to = (s: GrowthState) => (s.day < day ? advance(s, day - s.day) : s);
  const sa = to(a.state), sb = to(b.state);
  const res: DemoResult = {
    scenario: sc,
    startDay: Math.min(a.firstDay, b.firstDay),
    day: Math.max(sa.day, sb.day),
    base: { label: sc.base.label, state: sa, decisions: a.decisions, team: teamOf(sa), sites: sitesOf(sa) },
    alt: { label: sc.alt.label, state: sb, decisions: b.decisions, team: teamOf(sb), sites: sitesOf(sb) },
    rows: compareStates(sa, sb),
  };
  memo.set(key, res);
  return res;
}
