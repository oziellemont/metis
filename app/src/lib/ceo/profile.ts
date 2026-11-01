/**
 * mêtis CEO · Professional Profiling & Initial Assessment (requisito V33).
 *
 * Dos cosas distintas, y nunca se mezclan:
 *  - Experiencia DECLARADA (`CeoState.profile`): lo que el jugador nos cuenta. Cambia por dónde empieza,
 *    cuánta ayuda ve en los casos, qué exigencia se le OFRECE y el contexto que recibe la IA.
 *  - Lectura INICIAL (`CeoState.diagnostic`): 3 decisiones opcionales. Señal de confianza baja que solo
 *    ordena recomendaciones mientras no hay evidencia real y se apaga sola a las 5 decisiones.
 *
 * Ninguna de las dos entra a `masteryOf`, `journeyOf`, `xpOf`, ranking ni nombramientos. Hay una prueba
 * de propiedad que lo vigila (profile.test.ts).
 *
 * Lógica pura: sin React ni navegador.
 */
import type { CeoState } from "./types";
import { COMPETENCY_IDS, competencyById, type Competency, type Mastery } from "./mastery";

// ───────────────────────────────────────────── catálogos (ids estables: no renombrar)
export const ROLES = [
  { id: "estudiante", label: "Estudiante o recién egresado" },
  { id: "especialista", label: "Especialista o analista" },
  { id: "coordinador", label: "Coordinador o líder de equipo" },
  { id: "gerente", label: "Gerente" },
  { id: "director", label: "Director" },
  { id: "direccion", label: "Dirección general o socio" },
  { id: "fundador", label: "Fundador o emprendedor" },
  { id: "otro", label: "Otro" },
] as const;
export type RoleId = (typeof ROLES)[number]["id"];

/** Áreas de experiencia → competencias del Mastery Engine que suelen ejercitar. */
export const EXP_AREAS = [
  { id: "finanzas", label: "Finanzas", to: ["finanzas"] },
  { id: "operaciones", label: "Operaciones", to: ["ejecucion"] },
  { id: "ventas", label: "Ventas", to: ["mercado", "negociacion"] },
  { id: "marketing", label: "Marketing", to: ["mercado"] },
  { id: "personas", label: "Personas y RH", to: ["personas"] },
  { id: "estrategia", label: "Estrategia", to: ["estrategia"] },
  { id: "suministro", label: "Cadena de suministro", to: ["ejecucion", "negociacion"] },
  { id: "tecnologia", label: "Tecnología", to: ["ejecucion", "estrategia"] },
  { id: "legal", label: "Legal y cumplimiento", to: ["etica"] },
  { id: "emprendimiento", label: "Emprendimiento", to: ["estrategia", "finanzas"] },
] as const satisfies readonly { id: string; label: string; to: readonly Competency[] }[];
export type ExpAreaId = (typeof EXP_AREAS)[number]["id"];

export const YEARS = [
  { id: "<2", label: "Menos de 2" },
  { id: "2-5", label: "2 a 5" },
  { id: "6-10", label: "6 a 10" },
  { id: "11-15", label: "11 a 15" },
  { id: "15+", label: "Más de 15" },
] as const;
export type YearsBand = (typeof YEARS)[number]["id"];

/** `company`: empresa del simulador de la misma industria (se preselecciona en el onboarding). */
export const INDUSTRIES = [
  { id: "consumo", label: "Consumo masivo", company: "cumbre" },
  { id: "manufactura", label: "Manufactura", company: "forja" },
  { id: "restaurantes", label: "Restaurantes y alimentos", company: "brasa" },
  { id: "retail", label: "Retail" },
  { id: "financieros", label: "Servicios financieros" },
  { id: "tecnologia", label: "Tecnología", company: "kubit" },
  { id: "salud", label: "Salud" },
  { id: "construccion", label: "Construcción e inmobiliario" },
  { id: "logistica", label: "Logística" },
  { id: "educacion", label: "Educación" },
  { id: "social", label: "Gobierno y sector social" },
  { id: "otra", label: "Otra" },
] as const satisfies readonly { id: string; label: string; company?: string }[];
export type IndustryId = (typeof INDUSTRIES)[number]["id"];

export const GOALS = [
  { id: "ascenso", label: "Prepararme para un ascenso", hint: "Quiero llegar listo al siguiente cargo" },
  { id: "equipo", label: "Dirigir mejor a mi equipo", hint: "Decisiones de personas y ejecución" },
  { id: "negocio", label: "Entender el negocio completo", hint: "Salir de mi especialidad" },
  { id: "empresa_propia", label: "Dirigir mi propia empresa", hint: "Hoy o en el futuro" },
  { id: "entrevista", label: "Preparar una entrevista o un nuevo puesto", hint: "Practicar casos reales" },
  { id: "interes", label: "Aprender por interés propio", hint: "Sin una meta concreta" },
] as const;
export type GoalId = (typeof GOALS)[number]["id"];

export const QUESTIONS = ["role", "areas", "years", "industry", "goal"] as const;
export type QuestionId = (typeof QUESTIONS)[number];

export interface ProfessionalProfile {
  v: 1;
  role?: RoleId;
  areas?: ExpAreaId[];
  years?: YearsBand;
  industry?: IndustryId;
  goal?: GoalId;
  skipped: QuestionId[];
  source: "onboarding" | "perfil" | "aviso";
  answeredAt: number;
  updatedAt: number;
  /** Segundos que tomó contestar por primera vez (criterio P-01). */
  secs?: number;
}
export interface ProfileNudge { dismissed: number; until: number }

export interface DiagnosticAnswer { id: string; option: string; at: number }
export interface InitialDiagnostic {
  v: 1;
  set: "d1";
  answers: DiagnosticAnswer[];
  finishedAt?: number;
  skippedAt?: number;
}

const has = <T extends { id: string }>(list: readonly T[], id: unknown): id is T["id"] => typeof id === "string" && list.some((x) => x.id === id);

/** Limpia un perfil que viene del navegador o del servidor: solo deja valores del catálogo. */
export function sanitizeProfile(raw: unknown): ProfessionalProfile | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
  const out: ProfessionalProfile = {
    v: 1,
    skipped: Array.isArray(r.skipped) ? (r.skipped.filter((q) => (QUESTIONS as readonly string[]).includes(q as string)) as QuestionId[]) : [],
    source: r.source === "perfil" || r.source === "aviso" ? r.source : "onboarding",
    answeredAt: num(r.answeredAt),
    updatedAt: num(r.updatedAt),
  };
  if (has(ROLES, r.role)) out.role = r.role;
  if (Array.isArray(r.areas)) { const a = [...new Set(r.areas.filter((x) => has(EXP_AREAS, x)))] as ExpAreaId[]; if (a.length) out.areas = a; }
  if (has(YEARS, r.years)) out.years = r.years;
  if (has(INDUSTRIES, r.industry)) out.industry = r.industry;
  if (has(GOALS, r.goal)) out.goal = r.goal;
  if (typeof r.secs === "number" && r.secs >= 0 && r.secs < 86_400) out.secs = Math.round(r.secs);
  return out;
}
export function sanitizeDiagnostic(raw: unknown): InitialDiagnostic | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const answers = (Array.isArray(r.answers) ? r.answers : [])
    .filter((a): a is DiagnosticAnswer => !!a && typeof a === "object" && !!diagnosticById((a as DiagnosticAnswer).id) && diagnosticById((a as DiagnosticAnswer).id)!.options.some((o) => o.id === (a as DiagnosticAnswer).option))
    .filter((a, i, all) => all.findIndex((b) => b.id === a.id) === i)
    .slice(0, DIAGNOSTIC.length)
    .map((a) => ({ id: a.id, option: a.option, at: typeof a.at === "number" ? a.at : 0 }));
  const out: InitialDiagnostic = { v: 1, set: "d1", answers };
  if (typeof r.finishedAt === "number") out.finishedAt = r.finishedAt;
  if (typeof r.skippedAt === "number") out.skippedAt = r.skippedAt;
  return out;
}

export const profileAnswered = (s: Pick<CeoState, "profile">) => !!s.profile?.answeredAt;
export const labelOf = <T extends { id: string; label: string }>(list: readonly T[], id?: string) => list.find((x) => x.id === id)?.label;

/** Competencias que el jugador dice dominar por experiencia (no es dominio; solo orienta). */
export function declaredCompetencies(p?: ProfessionalProfile): Set<Competency> {
  const out = new Set<Competency>();
  for (const a of p?.areas ?? []) for (const c of EXP_AREAS.find((x) => x.id === a)?.to ?? []) out.add(c as Competency);
  return out;
}

// ───────────────────────────────────────────── ayuda y exigencia
export type HelpBand = "completa" | "media" | "breve";
const SENIOR_YEARS: YearsBand[] = ["11-15", "15+"];
const SENIOR_ROLES: RoleId[] = ["director", "direccion", "fundador"];
/** Cuánta ayuda se muestra dentro de los casos. Nunca cambia puntajes ni efectos. Sin perfil: completa. */
export function helpBand(p?: ProfessionalProfile): HelpBand {
  if (!p) return "completa";
  if ((p.years && SENIOR_YEARS.includes(p.years)) || (p.role && SENIOR_ROLES.includes(p.role))) return "breve";
  if (p.years === "6-10" || p.role === "gerente" || p.role === "coordinador") return "media";
  return "completa";
}
/** Exigencia que se le OFRECE en su primera empresa (el jugador decide). 0 = normal. */
export const OFFERED_TIER = 1;
export function suggestTier(p?: ProfessionalProfile): number {
  if (!p) return 0;
  return (p.years && SENIOR_YEARS.includes(p.years)) || p.role === "director" || p.role === "direccion" ? OFFERED_TIER : 0;
}

// ───────────────────────────────────────────── diagnóstico inicial (3 decisiones)
export interface DiagnosticCase {
  id: string;
  from: { name: string; role: string; initials: string; channel: string };
  title: string;
  text: string;
  competencies: [Competency, Competency];
  options: { id: string; text: string; score: 0 | 1 | 2 | 3 }[];
}
export const DIAGNOSTIC: DiagnosticCase[] = [
  {
    id: "d1-politica",
    from: { name: "Lucía Moreno", role: "Directora comercial", initials: "LM", channel: "Correo" },
    title: "Tu mejor vendedor cerró el trimestre con descuentos fuera de política",
    text: "Rebasó el límite en 6 operaciones. Sin él no se habría llegado a la meta. Otros dos vendedores ya preguntaron si ahora pueden hacer lo mismo.",
    competencies: ["personas", "etica"],
    options: [
      { id: "a", text: "Lo dejas pasar este trimestre: cerró el número y el equipo lo necesita.", score: 0 },
      { id: "b", text: "Hablas con él en privado, revierten los descuentos que aún se puedan y fijas una regla clara para todos.", score: 3 },
      { id: "c", text: "Lo sancionas frente al equipo para que nadie lo repita.", score: 1 },
      { id: "d", text: "Cambias la política para que sus descuentos queden permitidos.", score: 1 },
    ],
  },
  {
    id: "d1-credito",
    from: { name: "Andrés Salinas", role: "Director de finanzas", initials: "AS", channel: "WhatsApp" },
    title: "Tu cliente más grande pide pasar de 30 a 90 días de crédito",
    text: "Es el 22% de las ventas. Si aceptas, la caja aguanta dos meses justos. Su comprador dice que la competencia ya se lo ofreció.",
    competencies: ["finanzas", "negociacion"],
    options: [
      { id: "a", text: "Aceptas los 90 días para no perderlo.", score: 0 },
      { id: "b", text: "Te niegas: las condiciones son las mismas para todos.", score: 1 },
      { id: "c", text: "Ofreces 60 días a cambio de un volumen mínimo firmado y pronto pago con descuento.", score: 3 },
      { id: "d", text: "Le pides a finanzas que consiga una línea de crédito y luego decides.", score: 2 },
    ],
  },
  {
    id: "d1-retrasos",
    from: { name: "Mariana Ríos", role: "Gerente de operación", initials: "MR", channel: "Junta" },
    title: "Tres semanas de entregas tarde y cada área culpa a otra",
    text: "Producción dice que compras llega tarde; compras dice que ventas cambia pedidos a última hora; ventas dice que el cliente lo exige. Nadie tiene los datos completos.",
    competencies: ["ejecucion", "comunicacion"],
    options: [
      { id: "a", text: "Juntas a los tres con los datos de cada pedido, acuerdan una regla de cambios y un responsable por indicador.", score: 3 },
      { id: "b", text: "Le pides a cada área un reporte por escrito y decides tú quién tiene la culpa.", score: 1 },
      { id: "c", text: "Contratas a un consultor para que revise el proceso.", score: 1 },
      { id: "d", text: "Pides a producción que trabaje horas extra hasta ponerse al día.", score: 0 },
    ],
  },
];
export const diagnosticById = (id: string) => DIAGNOSTIC.find((d) => d.id === id);
/** El diagnóstico solo se ofrece a quien aún tiene poca evidencia real. */
export const DIAGNOSTIC_MAX_DECISIONS = 10;
export const diagnosticOffered = (decisions: number, d?: InitialDiagnostic) => decisions < DIAGNOSTIC_MAX_DECISIONS && !d?.finishedAt;

export type Signal = "alta" | "media" | "reforzar" | "sin";
export const SIGNAL_LABEL: Record<Signal, string> = { alta: "Señal alta", media: "Señal media", reforzar: "Por reforzar", sin: "Sin lectura" };
/** Con cuántas decisiones reales en una competencia desaparece la lectura inicial. */
export const READING_FADE_N = 5;
export interface Reading { signal: Signal; weight: number }

/**
 * Lectura inicial por competencia. `weight` = 1 − n/5 (n = evidencia real en esa competencia).
 * Con 5 o más decisiones reales la lectura desaparece (signal "sin", weight 0).
 */
export function initialReading(d: InitialDiagnostic | undefined, m?: Mastery): Record<Competency, Reading> {
  const out = Object.fromEntries(COMPETENCY_IDS.map((c) => [c, { signal: "sin", weight: 0 }])) as Record<Competency, Reading>;
  for (const a of d?.answers ?? []) {
    const dc = diagnosticById(a.id);
    const o = dc?.options.find((x) => x.id === a.option);
    if (!dc || !o) continue;
    const signal: Signal = o.score === 3 ? "alta" : o.score === 2 ? "media" : "reforzar";
    for (const c of dc.competencies) {
      const n = m?.[c]?.n ?? 0;
      const weight = Math.max(0, 1 - n / READING_FADE_N);
      out[c] = weight > 0 ? { signal, weight: Math.round(weight * 1000) / 1000 } : { signal: "sin", weight: 0 };
    }
  }
  return out;
}

// ───────────────────────────────────────────── recomendaciones (Curriculum Engine / Academy)
/** Al menos 1 de cada EXPLORE_EVERY recomendaciones es de un área que el jugador no declaró. */
export const EXPLORE_EVERY = 3;
export interface Recommendation { competency: Competency; reason: "demostrada" | "lectura" | "explorar" | "base"; outside: boolean; review: boolean }

/**
 * Orden de competencias para recomendar. Reglas:
 *  1) la necesidad demostrada manda (dominio bajo con evidencia real);
 *  2) sin evidencia, pesa la lectura inicial («por reforzar» sube, «señal alta» baja);
 *  3) las áreas declaradas bajan (repaso opcional) mientras no haya evidencia; las no declaradas suben un poco;
 *  Un área declarada solo es «repaso opcional» si el diagnóstico no la marcó «por reforzar» (lo demostrado gana).
 *  4) regla de exploración: en cada bloque de 3, al menos una fuera de lo declarado (si existe).
 * Nunca oculta nada: solo ordena.
 */
export function recommendOrder(p: ProfessionalProfile | undefined, m: Mastery, d?: InitialDiagnostic): Recommendation[] {
  const declared = declaredCompetencies(p);
  const reading = initialReading(d, m);
  const scored = COMPETENCY_IDS.map((c, i) => {
    const conf = Math.min(1, m[c].n / READING_FADE_N);
    const r = reading[c];
    const readAdj = r.signal === "reforzar" ? 30 : r.signal === "alta" ? -30 : 0;
    const declAdj = declared.has(c) ? -25 : declared.size ? 10 : 0;
    const prio = 100 - m[c].value + (1 - conf) * declAdj + r.weight * readAdj;
    const reason: Recommendation["reason"] = conf >= 0.6 ? "demostrada" : r.weight > 0 && r.signal !== "sin" ? "lectura" : declared.size && !declared.has(c) ? "explorar" : "base";
    return { c, prio, i, reason };
  }).sort((a, b) => b.prio - a.prio || a.i - b.i);

  const pool = scored.slice();
  const out: Recommendation[] = [];
  while (pool.length) {
    const pos = out.length % EXPLORE_EVERY;
    const blockStart = out.length - pos;
    const blockHasOutside = out.slice(blockStart).some((x) => x.outside);
    let k = 0;
    if (declared.size && pos === EXPLORE_EVERY - 1 && !blockHasOutside) {
      const j = pool.findIndex((x) => !declared.has(x.c));
      if (j >= 0) k = j;
    }
    const [x] = pool.splice(k, 1);
    const outside = declared.size > 0 && !declared.has(x.c);
    out.push({ competency: x.c, reason: k > 0 ? "explorar" : x.reason, outside, review: declared.has(x.c) && x.reason !== "demostrada" && m[x.c].n < READING_FADE_N && reading[x.c].signal !== "reforzar" });
  }
  return out;
}

// ───────────────────────────────────────────── contexto para la IA (Coach / Scenario Director)
/** Una línea, solo con valores del catálogo (sin nombre, correo ni texto libre). */
export function aiContext(p?: ProfessionalProfile): string | null {
  const sp = sanitizeProfile(p);
  if (!sp) return null;
  const parts = [
    labelOf(ROLES, sp.role),
    sp.areas?.length ? `experiencia en ${sp.areas.map((a) => labelOf(EXP_AREAS, a)!.toLowerCase()).join(", ")}` : null,
    sp.years ? `${labelOf(YEARS, sp.years)!.toLowerCase()} años de experiencia` : null,
    sp.industry ? `industria: ${labelOf(INDUSTRIES, sp.industry)!.toLowerCase()}` : null,
    sp.goal ? `objetivo: ${labelOf(GOALS, sp.goal)!.toLowerCase()}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("; ") : null;
}

// ───────────────────────────────────────────── usuarios actuales (aviso)
export const NUDGE_AFTER_MS = 24 * 3_600_000;
export const NUDGE_SNOOZE_MS = 7 * 24 * 3_600_000;
export const NUDGE_MAX_DISMISS = 2;
/** El aviso «Cuéntanos tu experiencia» aparece desde el segundo día, se pospone 7 días y se rinde tras 2 «Ahora no». */
export function shouldNudge(s: Pick<CeoState, "profile" | "profileNudge" | "startedAt" | "journey">, now: number): boolean {
  if (profileAnswered(s) || !s.startedAt) return false;
  const since = Math.min(s.startedAt, s.journey?.enrolledAt ?? s.startedAt);
  if (now - since < NUDGE_AFTER_MS) return false;
  const n = s.profileNudge;
  if (n && (n.dismissed >= NUDGE_MAX_DISMISS || now < n.until)) return false;
  return true;
}
export function snoozeNudge(n: ProfileNudge | undefined, now: number): ProfileNudge {
  return { dismissed: (n?.dismissed ?? 0) + 1, until: now + NUDGE_SNOOZE_MS };
}

/** Competencias que entrena un asunto, para la ayuda «completa» dentro del caso. */
export const competencyNames = (cs: Competency[]) => cs.map((c) => competencyById(c).name);

/** Empresa del simulador que se preselecciona según la industria declarada (si existe en el catálogo de empresas). */
export function companyForIndustry(industry: string | undefined, companies: readonly string[]): string | undefined {
  const m = INDUSTRIES.find((i) => i.id === industry) as { company?: string } | undefined;
  return m?.company && companies.includes(m.company) ? m.company : undefined;
}

/** Cierra una edición del perfil: recalcula qué quedó sin responder y sella fechas. */
export function finalizeProfile(p: ProfessionalProfile, source: ProfessionalProfile["source"], now: number): ProfessionalProfile {
  const skipped = QUESTIONS.filter((q) => (q === "areas" ? !p.areas?.length : !p[q]));
  const out: ProfessionalProfile = { ...p, skipped, source, answeredAt: p.answeredAt || now, updatedAt: now };
  if (!out.areas?.length) delete out.areas;
  return out;
}

// ───────────────────────────────────────────── Academy: rutas recomendadas
export interface TrackHint { track: string; rank: number; competency: Competency; outside: boolean; review: boolean }
/**
 * Ordena las rutas de la Academy según `recommendOrder`: cada ruta toma la mejor posición de sus competencias.
 * `review` = todas sus competencias son repaso opcional (área declarada, sin evidencia en contra).
 * Nunca quita rutas: solo devuelve un orden y etiquetas.
 */
export function trackHints(p: ProfessionalProfile | undefined, m: Mastery, d: InitialDiagnostic | undefined, trackTo: Record<string, Competency[]>, tracks: readonly string[]): TrackHint[] {
  const rec = recommendOrder(p, m, d);
  const pos = new Map(rec.map((r, i) => [r.competency, i]));
  return tracks
    .map((t, i) => {
      const cs = trackTo[t] ?? [];
      const best = cs.slice().sort((a, b) => (pos.get(a) ?? 99) - (pos.get(b) ?? 99))[0];
      const r = best ? rec[pos.get(best)!] : undefined;
      return { track: t, rank: best ? pos.get(best)! : 99, competency: best ?? ("estrategia" as Competency), outside: !!r?.outside, review: cs.length > 0 && cs.every((c) => rec[pos.get(c)!]?.review), i };
    })
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map(({ i: _i, ...h }) => { void _i; return h; });
}
/** Personalización visible: solo cuando el jugador nos contó algo o hizo el diagnóstico. */
export const personalized = (s: Pick<CeoState, "profile" | "diagnostic">) => profileAnswered(s) || !!s.diagnostic?.finishedAt;

/** Un asunto que vence en menos de esto se considera «caso abierto»: el aviso del perfil no compite con él. */
export const NUDGE_QUIET_MS = 3 * 3_600_000;
export const nudgeQuiet = (pending: { deadline: number }[], now: number) => pending.some((e) => e.deadline - now < NUDGE_QUIET_MS);
