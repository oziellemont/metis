"use client";
/**
 * Perfil profesional (V33): cinco preguntas, diagnóstico opcional y «Tu punto de partida».
 * Se usa en el onboarding y en /ceo/experiencia (usuarios actuales). La edición en Perfil usa ProfileEditor.
 */
import { useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Briefcase, Check, ChevronDown, Info, Pencil, ShieldCheck, Target } from "lucide-react";
import {
  DIAGNOSTIC, EXP_AREAS, GOALS, INDUSTRIES, QUESTIONS, ROLES, SIGNAL_LABEL, YEARS, initialReading, labelOf, recommendOrder, finalizeProfile, helpBand, suggestTier,
  type ExpAreaId, type InitialDiagnostic, type ProfessionalProfile, type QuestionId, type Signal,
} from "@/lib/ceo/profile";
import { COMPETENCIES, competencyById, type Mastery } from "@/lib/ceo/mastery";

// ───────────────────────────────────────────── piezas
export function Segments({ total, at }: { total: number; at: number }) {
  return <div className="flex gap-1.5" aria-label={`Paso ${at + 1} de ${total}`}>{Array.from({ length: total }, (_, i) => <span key={i} className={clsx("h-1 w-8 rounded-full transition-colors", i === at ? "bg-mint" : i < at ? "bg-white/60" : "bg-white/20")} />)}</div>;
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-wider text-white/55">{children}</div>;
}
function Choice({ on, onClick, children, sub }: { on: boolean; onClick: () => void; children: React.ReactNode; sub?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={clsx("w-full text-left rounded-2xl border px-4 py-3.5 flex items-center gap-3 text-[14px] transition-all", on ? "bg-white text-ink border-white shadow-[0_0_0_4px_rgba(109,93,246,.35)]" : "bg-white/[.06] border-white/[.12] text-white hover:bg-white/10")}>
      <span className={clsx("h-4 w-4 rounded-full shrink-0", on ? "border-[5px] border-indigo" : "border-[1.5px] border-white/40")} />
      <span className="min-w-0"><span className={clsx("block", sub && "font-medium")}>{children}</span>{sub && <span className={clsx("block text-xs mt-0.5", on ? "text-slate-500" : "text-white/55")}>{sub}</span>}</span>
    </button>
  );
}
function Foot({ onBack, onSkip, onNext, next = "Siguiente", nextOff, note = "Puedes cambiarlo después en Perfil." }: { onBack?: () => void; onSkip?: () => void; onNext: () => void; next?: string; nextOff?: boolean; note?: string }) {
  return (
    <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center gap-4">
      {onBack && <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white"><ArrowLeft size={14} /> Atrás</button>}
      <span className="flex-1 text-[11.5px] text-white/45 hidden sm:block">{note}</span>
      {onSkip && <button type="button" onClick={onSkip} className="text-sm font-medium text-white/75 hover:text-white">Omitir</button>}
      <button type="button" disabled={nextOff} onClick={onNext} className="btn-primary px-5 py-2.5">{next} <ArrowRight size={15} /></button>
    </div>
  );
}

// ───────────────────────────────────────────── 5 preguntas
export const PROFILE_STEPS = QUESTIONS.length;

export function ProfileQuestions({ initial, source, onDone, onBackFirst, onLater, step, setStep }: {
  initial?: ProfessionalProfile;
  /** «Completar después»: sale del bloque completo sin guardar nada. */
  onLater?: () => void;
  source: ProfessionalProfile["source"];
  onDone: (p: ProfessionalProfile) => void;
  onBackFirst?: () => void;
  step: number;
  setStep: (n: number) => void;
}) {
  const t0 = useRef(Date.now());
  const [p, setP] = useState<ProfessionalProfile>(() => initial ?? { v: 1, skipped: [], source, answeredAt: 0, updatedAt: 0 });
  const q: QuestionId = QUESTIONS[step];
  const answered = (k: QuestionId) => (k === "areas" ? !!p.areas?.length : !!p[k]);
  const finish = (np: ProfessionalProfile) => {
    const now = Date.now();
    onDone({ ...np, source, answeredAt: np.answeredAt || now, updatedAt: now, secs: np.secs ?? Math.round((now - t0.current) / 1000) });
  };
  const go = (skip: boolean) => {
    const np: ProfessionalProfile = { ...p, skipped: skip ? [...new Set([...p.skipped, q])] : p.skipped.filter((x) => x !== q) };
    if (skip) { if (q === "areas") delete np.areas; else delete np[q]; }
    setP(np);
    if (step + 1 >= PROFILE_STEPS) finish(np); else setStep(step + 1);
  };
  const set = <K extends keyof ProfessionalProfile>(k: K, v: ProfessionalProfile[K]) => setP((x) => ({ ...x, [k]: v }));
  const toggleArea = (a: ExpAreaId) => setP((x) => { const cur = x.areas ?? []; return { ...x, areas: cur.includes(a) ? cur.filter((y) => y !== a) : [...cur, a] }; });
  const back = step === 0 ? onBackFirst : () => setStep(step - 1);
  const last = step === PROFILE_STEPS - 1;

  return (
    <section key={q} className="academy-in mt-10">
      <div className="flex items-center justify-between gap-4">
        <Eyebrow>Tu experiencia · {step + 1} de {PROFILE_STEPS}</Eyebrow>
        {onLater && <button type="button" onClick={onLater} className="text-xs font-medium text-white/60 hover:text-white underline-offset-4 hover:underline">Completar después</button>}
      </div>
      {q === "role" && (<>
        <h1 className="mt-2.5 text-[26px] sm:text-[28px] font-semibold leading-tight">¿Cuál es tu responsabilidad actual?</h1>
        <p className="mt-2 text-white/70 text-sm leading-relaxed max-w-xl">Nos ayuda a elegir el tono, los ejemplos y por dónde empezar. No cambia tu etapa: todos empiezan como Emerging Leader.</p>
        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">{ROLES.map((r) => <Choice key={r.id} on={p.role === r.id} onClick={() => set("role", r.id)}>{r.label}</Choice>)}</div>
      </>)}
      {q === "areas" && (<>
        <h1 className="mt-2.5 text-[26px] sm:text-[28px] font-semibold leading-tight">¿En qué áreas tienes experiencia?</h1>
        <p className="mt-2 text-white/70 text-sm">Elige todas las que apliquen.</p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {EXP_AREAS.map((a) => { const on = !!p.areas?.includes(a.id); return (
            <button key={a.id} type="button" aria-pressed={on} onClick={() => toggleArea(a.id)} className={clsx("inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm transition-colors", on ? "bg-white text-indigo border-white font-medium" : "bg-white/5 border-white/20 text-white hover:bg-white/10")}>{on && <Check size={13} strokeWidth={2.6} />}{a.label}</button>
          ); })}
        </div>
        <div className="mt-6 flex gap-2.5 rounded-xl bg-white/5 px-3.5 py-3 text-xs text-white/60 leading-relaxed"><Info size={14} className="shrink-0 mt-0.5" /><span>Con esto sugerimos lecciones y casos. Tu dominio en cada área lo vas a demostrar con tus decisiones.</span></div>
      </>)}
      {q === "years" && (<>
        <h1 className="mt-2.5 text-[26px] sm:text-[28px] font-semibold leading-tight">¿Cuántos años de experiencia profesional tienes?</h1>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 rounded-2xl border border-white/15 overflow-hidden">
          {YEARS.map((y, i) => <button key={y.id} type="button" aria-pressed={p.years === y.id} onClick={() => set("years", y.id)} className={clsx("py-3.5 px-2 text-sm transition-colors", i < YEARS.length - 1 && "sm:border-r border-white/10", p.years === y.id ? "bg-white text-indigo font-semibold" : "text-white hover:bg-white/10")}>{y.label}</button>)}
        </div>
      </>)}
      {q === "industry" && <IndustryPick value={p.industry} onChange={(v) => set("industry", v)} />}
      {q === "goal" && (<>
        <h1 className="mt-2.5 text-[26px] sm:text-[28px] font-semibold leading-tight">¿Qué quieres lograr con mêtis?</h1>
        <p className="mt-2 text-white/70 text-sm">Elige la principal.</p>
        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">{GOALS.map((g) => <Choice key={g.id} on={p.goal === g.id} onClick={() => set("goal", g.id)} sub={g.hint}>{g.label}</Choice>)}</div>
      </>)}
      <Foot onBack={back} onSkip={() => go(true)} onNext={() => go(false)} nextOff={!answered(q)} next={last ? "Terminar" : "Siguiente"} />
    </section>
  );
}

function IndustryPick({ value, onChange }: { value?: ProfessionalProfile["industry"]; onChange: (v: ProfessionalProfile["industry"]) => void }) {
  const [open, setOpen] = useState(true);
  return (<>
    <h1 className="mt-2.5 text-[26px] sm:text-[28px] font-semibold leading-tight">¿En qué industria tienes más experiencia?</h1>
    <div className="mt-6 rounded-2xl bg-white text-ink overflow-hidden shadow-[0_18px_40px_-18px_rgba(0,0,0,.5)]">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center justify-between px-4 py-3.5 font-medium border-b border-slate-100">
        <span className={clsx(!value && "text-slate-400 font-normal")}>{labelOf(INDUSTRIES, value) ?? "Elige una industria"}</span><ChevronDown size={16} className={clsx("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul role="listbox" className="max-h-64 overflow-auto py-1">
          {INDUSTRIES.map((i) => (
            <li key={i.id}><button type="button" role="option" aria-selected={value === i.id} onClick={() => { onChange(i.id); setOpen(false); }} className={clsx("w-full flex items-center justify-between px-4 py-2.5 text-sm text-left", value === i.id ? "bg-indigo-soft text-indigo font-medium" : "text-slate-700 hover:bg-slate-50")}>{i.label}{value === i.id && <Check size={14} strokeWidth={2.6} />}</button></li>
          ))}
        </ul>
      )}
    </div>
  </>);
}

// ───────────────────────────────────────────── diagnóstico
export function DiagnosticOffer({ onStart, onLater, later = "Ahora no, ir a mi empresa" }: { onStart: () => void; onLater: () => void; later?: string }) {
  return (
    <section className="academy-in mt-10">
      <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs">Opcional · 3 minutos</div>
      <h1 className="mt-5 text-3xl sm:text-[34px] font-semibold leading-tight">Antes de empezar, tres decisiones.</h1>
      <p className="mt-3 text-white/70 text-[14.5px] leading-relaxed">Tres situaciones de dirección, sin respuestas obvias. Nos dan una primera lectura de tu criterio para ajustar por dónde empiezas. No suman puntos, no cambian tu etapa y no cuentan para ningún nombramiento.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {DIAGNOSTIC.map((d, i) => (
          <div key={d.id} className="rounded-2xl bg-white/[.06] border border-white/[.12] p-4">
            <span className="h-6 w-6 rounded-full bg-white/10 grid place-items-center text-xs font-semibold">{i + 1}</span>
            <div className="mt-3 text-sm font-medium leading-snug">{d.title}</div>
            <div className="mt-1.5 text-[11.5px] text-white/55">{d.competencies.map((c) => competencyById(c).short).join(" · ")}</div>
          </div>
        ))}
      </div>
      <div className="mt-7 flex flex-col sm:flex-row gap-3">
        <button type="button" onClick={onStart} className="btn-primary flex-1 justify-center py-3">Hacer el diagnóstico <ArrowRight size={15} /></button>
        <button type="button" onClick={onLater} className="btn border border-white/20 text-white/80 hover:text-white justify-center py-3">{later}</button>
      </div>
    </section>
  );
}

export function DiagnosticCases({ onDone, onSkip }: { onDone: (d: InitialDiagnostic) => void; onSkip: () => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<InitialDiagnostic["answers"]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const d = DIAGNOSTIC[i];
  const confirm = () => {
    if (!picked) return;
    const next = [...answers, { id: d.id, option: picked, at: Date.now() }];
    setAnswers(next); setPicked(null);
    if (i + 1 >= DIAGNOSTIC.length) onDone({ v: 1, set: "d1", answers: next, finishedAt: Date.now() });
    else setI(i + 1);
  };
  return (
    <section key={d.id} className="academy-in mt-10">
      <div className="flex items-center justify-between"><Eyebrow>Diagnóstico inicial · {i + 1} de {DIAGNOSTIC.length}</Eyebrow><Segments total={DIAGNOSTIC.length} at={i} /></div>
      <div className="mt-5 flex items-center gap-2.5">
        <span className="h-9 w-9 rounded-full bg-indigo-soft text-indigo grid place-items-center text-xs font-semibold">{d.from.initials}</span>
        <div><div className="text-sm font-medium">{d.from.name}</div><div className="text-[11.5px] text-white/55">{d.from.role} · {d.from.channel}</div></div>
      </div>
      <h1 className="mt-4 text-[24px] sm:text-[26px] font-semibold leading-tight">{d.title}</h1>
      <p className="mt-2 text-white/70 text-sm leading-relaxed">{d.text}</p>
      <div className="mt-6 space-y-2.5">
        {d.options.map((o, k) => (
          <button key={o.id} type="button" aria-pressed={picked === o.id} onClick={() => setPicked(o.id)} className={clsx("w-full text-left rounded-2xl border px-4 py-3.5 flex gap-3 text-[14px] leading-relaxed transition-all", picked === o.id ? "bg-white text-ink border-white shadow-[0_0_0_4px_rgba(109,93,246,.35)]" : "bg-white/[.06] border-white/[.12] text-white hover:bg-white/10")}>
            <span className={clsx("h-6 w-6 rounded-lg grid place-items-center text-xs font-semibold shrink-0", picked === o.id ? "bg-indigo text-white" : "bg-white/10")}>{String.fromCharCode(65 + k)}</span><span>{o.text}</span>
          </button>
        ))}
      </div>
      <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center gap-4">
        <span className="flex-1 text-[11.5px] text-white/45">Sin puntos ni efectos en tu empresa. Al terminar ves tu lectura inicial.</span>
        <button type="button" onClick={onSkip} className="text-sm font-medium text-white/75 hover:text-white">Omitir diagnóstico</button>
        <button type="button" disabled={!picked} onClick={confirm} className="btn-primary px-5 py-2.5">Confirmar <ArrowRight size={15} /></button>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────── punto de partida
const SIGNAL_CLS: Record<Signal, string> = {
  alta: "bg-indigo-soft text-indigo",
  media: "bg-slate-100 text-slate-700",
  reforzar: "bg-coral-soft text-coral",
  sin: "bg-white text-slate-400 border border-dashed border-slate-200",
};
const ORDER: Record<Signal, number> = { alta: 0, media: 1, reforzar: 2, sin: 3 };

export function DeclaredCard({ p, onEdit }: { p?: ProfessionalProfile; onEdit?: () => void }) {
  const rows: [string, string | undefined][] = [
    ["Responsabilidad", labelOf(ROLES, p?.role)],
    ["Áreas", p?.areas?.map((a) => labelOf(EXP_AREAS, a)).join(", ")],
    ["Experiencia", p?.years ? `${labelOf(YEARS, p.years)} años` : undefined],
    ["Industria", labelOf(INDUSTRIES, p?.industry)],
    ["Objetivo", labelOf(GOALS, p?.goal)],
  ];
  return (
    <div className="card p-5 text-ink">
      <div className="flex items-center gap-3 mb-2">
        <span className="h-9 w-9 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><Briefcase size={16} /></span>
        <div className="flex-1"><div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">Experiencia declarada</div><div className="text-xs text-slate-500">Lo que nos contaste</div></div>
        {onEdit && <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-xs font-medium text-indigo"><Pencil size={12} /> Editar</button>}
      </div>
      {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2.5 border-t border-slate-100 text-[13px]"><span className="text-slate-500">{k}</span><b className={clsx("font-medium text-right", !v && "text-slate-400 font-normal")}>{v || "Sin responder"}</b></div>)}
      <div className="mt-3 flex gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-[11.5px] text-slate-500"><ShieldCheck size={13} className="shrink-0 mt-0.5" /> No suma dominio, puntos ni nombramientos.</div>
    </div>
  );
}

export function DemonstratedCard({ m, d }: { m: Mastery; d?: InitialDiagnostic }) {
  const r = initialReading(d, m);
  const rows = COMPETENCIES.slice().sort((a, b) => ORDER[r[a.id].signal] - ORDER[r[b.id].signal]);
  return (
    <div className="card p-5 text-ink">
      <div className="flex items-center gap-3 mb-2">
        <span className="h-9 w-9 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><Target size={16} /></span>
        <div><div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">Competencias demostradas</div><div className="text-xs text-slate-500">{d?.finishedAt ? "Lectura inicial del diagnóstico · confianza baja" : "Se miden con tus decisiones"}</div></div>
      </div>
      <div className="grid grid-cols-[1fr_104px_48px] gap-2 pb-1.5 border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><span>Competencia</span><span className="text-center">Diagnóstico</span><span className="text-right">Dominio</span></div>
      {rows.map((c) => (
        <div key={c.id} className="grid grid-cols-[1fr_104px_48px] gap-2 items-center py-2 border-b border-slate-100 text-[12.5px]">
          <span>{c.name}</span><span className={clsx("rounded-full px-2 py-0.5 text-[10.5px] font-medium text-center", SIGNAL_CLS[r[c.id].signal])}>{SIGNAL_LABEL[r[c.id].signal]}</span><b className="text-right tabular-nums">{m[c.id].value}</b>
        </div>
      ))}
      <div className="mt-3 flex gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-[11.5px] text-slate-500 leading-relaxed"><Info size={13} className="shrink-0 mt-0.5" /> El dominio sube con tus decisiones. La lectura inicial se reemplaza sola después de unas cuantas decisiones reales.</div>
    </div>
  );
}

/** Tres frases concretas de cómo se adapta su primera semana (derivadas de las mismas reglas que usa la app). */
export function adaptationOf(p: ProfessionalProfile | undefined, m: Mastery, d?: InitialDiagnostic): [string, string][] {
  const rec = recommendOrder(p, m, d);
  const first = competencyById(rec[0].competency).name;
  const review = rec.filter((r) => r.review).map((r) => competencyById(r.competency).name.toLowerCase());
  const band = helpBand(p);
  const outside = rec.find((r) => r.outside);
  return [
    ["Academy", `Empiezas por ${first}.${review.length ? ` Lo básico de ${review.slice(0, 2).join(" y ")} queda como repaso opcional.` : ""}`],
    ["Casos", band === "breve" ? `Menos explicaciones dentro de cada caso.${suggestTier(p) ? " Puedes empezar con exigencia alta en tu primera empresa." : ""}` : band === "media" ? "Una pista breve de qué entrena cada caso." : "Antes de decidir verás qué entrena cada caso y la lección que lo explica."],
    ["Fuera de tu especialidad", outside ? "Al menos 1 de cada 3 recomendaciones será de un área que no elegiste." : "Te recomendamos de todas las áreas por igual."],
  ];
}

export function StartingPoint({ name, p, d, m, cta, onCta, onEdit, stage = "Emerging Leader", fresh = true }: { name: string; p?: ProfessionalProfile; d?: InitialDiagnostic; m: Mastery; cta: string; onCta: () => void; onEdit?: () => void; stage?: string; fresh?: boolean }) {
  const plan = useMemo(() => adaptationOf(p, m, d), [p, m, d]);
  return (
    <section className="academy-in mt-8">
      <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs">Tu punto de partida</div>
      <h1 className="mt-4 text-3xl sm:text-[34px] font-semibold leading-tight">{fresh ? <>{name ? `${name.split(" ")[0]}, empiezas` : "Empiezas"} como {stage}.</> : <>{name ? `${name.split(" ")[0]}, sigues` : "Sigues"} como {stage}.</>}</h1>
      <p className="mt-3 text-white/70 text-[14.5px] leading-relaxed">Tu experiencia cambia por dónde {fresh ? "empiezas" : "sigues"} y cómo te acompañamos. Tu etapa y tu dominio solo suben con lo que demuestres en el simulador.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <DeclaredCard p={p} onEdit={onEdit} />
        <DemonstratedCard m={m} d={d} />
      </div>
      <div className="card p-5 mt-4 text-ink">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">Así adaptamos tu primera semana</div>
        <div className="mt-3 grid gap-5 sm:grid-cols-3">{plan.map(([k, v]) => <div key={k}><b className="block text-[13.5px] font-semibold">{k}</b><span className="text-xs text-slate-500 leading-relaxed">{v}</span></div>)}</div>
      </div>
      <button type="button" onClick={onCta} className="btn-primary w-full justify-center mt-5 py-3 text-base">{cta} <ArrowRight size={16} /></button>
    </section>
  );
}

// ───────────────────────────────────────────── edición en Perfil (fondo claro)
function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={on} onClick={onClick} className={clsx("inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors", on ? "border-indigo bg-indigo-soft text-indigo font-medium" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>{on && <Check size={12} strokeWidth={2.6} />}{children}</button>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="py-3.5 border-t border-slate-100 first:border-t-0"><div className="text-xs font-medium text-slate-500 mb-2">{label}</div>{children}</div>;
}

/** Editor compacto de la experiencia declarada. Guardar no recalcula nada: solo cambia recomendaciones y ayuda. */
export function ProfileEditor({ initial, onSave, onCancel }: { initial?: ProfessionalProfile; onSave: (p: ProfessionalProfile) => void; onCancel: () => void }) {
  const [p, setP] = useState<ProfessionalProfile>(() => initial ?? { v: 1, skipped: [], source: "perfil", answeredAt: 0, updatedAt: 0 });
  const set = <K extends "role" | "years" | "industry" | "goal">(k: K, v: ProfessionalProfile[K] | undefined) => setP((x) => { const n = { ...x }; if (v) n[k] = v; else delete n[k]; return n; });
  const toggleArea = (a: ExpAreaId) => setP((x) => { const cur = x.areas ?? []; const nx = cur.includes(a) ? cur.filter((y) => y !== a) : [...cur, a]; const { areas: _drop, ...rest } = x; void _drop; return nx.length ? { ...rest, areas: nx } : rest; });
  const save = () => onSave(finalizeProfile(p, initial?.source ?? "perfil", Date.now()));
  return (
    <div className="text-ink">
      <Row label="Responsabilidad actual"><div className="flex flex-wrap gap-2">{ROLES.map((r) => <Pill key={r.id} on={p.role === r.id} onClick={() => set("role", p.role === r.id ? undefined : r.id)}>{r.label}</Pill>)}</div></Row>
      <Row label="Áreas de experiencia"><div className="flex flex-wrap gap-2">{EXP_AREAS.map((a) => <Pill key={a.id} on={!!p.areas?.includes(a.id)} onClick={() => toggleArea(a.id)}>{a.label}</Pill>)}</div></Row>
      <Row label="Años de experiencia">
        <div className="inline-grid grid-cols-5 rounded-xl border border-slate-200 overflow-hidden">{YEARS.map((y, i) => <button key={y.id} type="button" aria-pressed={p.years === y.id} onClick={() => set("years", p.years === y.id ? undefined : y.id)} className={clsx("px-3 py-2 text-[12.5px]", i && "border-l border-slate-200", p.years === y.id ? "bg-indigo text-white font-medium" : "text-slate-600 hover:bg-slate-50")}>{y.label}</button>)}</div>
      </Row>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Row label="Industria principal"><select aria-label="Industria principal" className="input" value={p.industry ?? ""} onChange={(e) => set("industry", (e.target.value || undefined) as ProfessionalProfile["industry"])}><option value="">Sin responder</option>{INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}</select></Row>
        <Row label="Objetivo con mêtis"><select aria-label="Objetivo" className="input" value={p.goal ?? ""} onChange={(e) => set("goal", (e.target.value || undefined) as ProfessionalProfile["goal"])}><option value="">Sin responder</option>{GOALS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select></Row>
      </div>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 text-[12px] leading-relaxed">
        <div className="rounded-xl bg-indigo-soft/60 px-3.5 py-3"><b className="block text-indigo font-semibold mb-0.5">Qué cambia</b><span className="text-slate-600">El orden de lecciones recomendadas, cuánta explicación ves dentro de cada caso y el tono del coach.</span></div>
        <div className="rounded-xl bg-slate-100 px-3.5 py-3"><b className="block text-ink font-semibold mb-0.5">Qué no cambia</b><span className="text-slate-600">Tu dominio, tu etapa, tu XP, el ranking y los nombramientos. Eso solo sube con tus decisiones.</span></div>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onCancel} className="btn-ghost">Cancelar</button><button type="button" onClick={save} className="btn-primary">Guardar</button></div>
    </div>
  );
}

/** Oferta de exigencia en la primera empresa (solo perfiles con 11+ años o cargo de dirección). El jugador decide. */
export function TierChoice({ tier, setTier, offered, names }: { tier: number; setTier: (t: number) => void; offered: number; names: [string, string] }) {
  const opts: [number, string, string][] = [
    [0, names[0], "La exigencia de siempre. Recomendada si es tu primera vez en el simulador."],
    [offered, names[1], "Plazos más cortos, golpes más fuertes y una línea de aprobación más alta."],
  ];
  return (
    <div className="mt-6 rounded-2xl bg-white/[.06] border border-white/[.12] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-white/55">Exigencia de tu primera empresa</div>
      <p className="mt-1 text-xs text-white/60">Por tu experiencia te ofrecemos empezar con más exigencia. No cambia tu etapa ni cuenta como modo Legendario.</p>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">{opts.map(([t, n, sub]) => <Choice key={t} on={tier === t} onClick={() => setTier(t)} sub={sub}>{n}</Choice>)}</div>
    </div>
  );
}
