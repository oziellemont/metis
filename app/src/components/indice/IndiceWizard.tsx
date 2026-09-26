"use client";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Printer, CalendarCheck, CheckCircle2 } from "lucide-react";
import { DIMENSIONS, QUESTIONS, GAP_ADVICE, BENCHMARK, score, type Answers } from "@/lib/indice/questions";
import { saveLead } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";

type Step = "intro" | "quiz" | "lead" | "result";
interface Lead { name: string; email: string; company: string; title: string; size: string; industry: string; city: string; consent: boolean }
const SIZES = ["15-60", "61-300", "301-1500", "1500+"];
const INDUSTRIES = ["Manufactura", "Distribución y logística", "Retail", "Servicios profesionales", "Salud privada", "Construcción", "Agroindustria", "Tecnología", "Otra"];

export function IndiceWizard() {
  const [step, setStep] = useState<Step>("intro");
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [lead, setLead] = useState<Lead>({ name: "", email: "", company: "", title: "", size: "61-300", industry: "Manufactura", city: "", consent: false });
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"supabase" | "local" | null>(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step, i]);

  const q = QUESTIONS[i];
  const dim = DIMENSIONS.find((d) => d.id === q?.dim)!;
  const answered = Object.keys(answers).length;
  const result = useMemo(() => score(answers), [answers]);

  const pick = (v: number) => {
    setAnswers((a) => ({ ...a, [q.id]: v }));
    setTimeout(() => { if (i < QUESTIONS.length - 1) setI(i + 1); else setStep("lead"); }, 180);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const r = await saveLead({ ...lead, answers, total: result.total, level: result.level.name, dims: Object.fromEntries(result.dims.map((d) => [d.dim.short, d.pct])), source: "indice-web" });
    setMode(r.mode); setSaving(false); setStep("result");
  };

  if (step === "intro") return (
    <section className="pt-10">
      <span className="chip bg-indigo-soft text-indigo">Gratis · 20 preguntas · 6 minutos</span>
      <h1 className="mt-4 text-4xl font-semibold">Índice de Alineación METIS</h1>
      <p className="mt-4 text-lg text-slate-600 max-w-2xl">Mide qué tan conectada está la estrategia de tu empresa con lo que hace cada persona el lunes por la mañana. Al terminar recibes tu índice de 0 a 100, tus cinco dimensiones y la primera brecha que conviene cerrar.</p>
      <div className="mt-8 grid sm:grid-cols-5 gap-3">
        {DIMENSIONS.map((d) => <div key={d.id} className="card p-4"><span className="h-2 w-2 rounded-full inline-block" style={{ background: d.color }} /><div className="mt-2 font-medium text-sm">{d.name}</div><div className="text-xs text-slate-500 mt-1">{d.question}</div></div>)}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button className="btn-primary !px-6 !py-3" onClick={() => setStep("quiz")}>Empezar <ArrowRight size={16} /></button>
        <span className="text-xs text-slate-400">Respóndelo pensando en cómo opera hoy tu empresa, no en cómo debería.</span>
      </div>
    </section>
  );

  if (step === "quiz") return (
    <section className="pt-8">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: dim.color }} />{dim.name}</span><span>{i + 1} / {QUESTIONS.length}</span></div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-indigo transition-all" style={{ width: `${((i) / QUESTIONS.length) * 100}%` }} /></div>
      <h2 className="mt-8 text-2xl font-semibold leading-snug">{q.text}</h2>
      <div className="mt-6 grid gap-2">
        {q.options.map((o, v) => (
          <button key={v} onClick={() => pick(v)} className={clsx("text-left rounded-2xl border px-5 py-4 transition-colors flex items-center gap-4", answers[q.id] === v ? "border-indigo bg-indigo-soft/50" : "border-slate-200 bg-white hover:border-indigo/40 hover:bg-slate-50")}>
            <span className={clsx("h-7 w-7 rounded-full inline-flex items-center justify-center text-xs font-semibold shrink-0", answers[q.id] === v ? "bg-indigo text-white" : "bg-slate-100 text-slate-500")}>{v}</span>
            <span className="text-sm">{o}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}><ArrowLeft size={14} /> Anterior</button>
        {answers[q.id] !== undefined && i < QUESTIONS.length - 1 && <button className="btn-ghost" onClick={() => setI(i + 1)}>Siguiente <ArrowRight size={14} /></button>}
        {answers[q.id] !== undefined && i === QUESTIONS.length - 1 && <button className="btn-primary" onClick={() => setStep("lead")}>Ver mi resultado <ArrowRight size={14} /></button>}
      </div>
    </section>
  );

  if (step === "lead") return (
    <section className="pt-10 max-w-xl">
      <div className="flex items-center gap-2 text-sob text-sm"><CheckCircle2 size={16} /> {answered} de {QUESTIONS.length} preguntas respondidas</div>
      <h2 className="mt-3 text-3xl font-semibold">¿A dónde enviamos tu resultado?</h2>
      <p className="mt-2 text-slate-600">Lo ves en pantalla ahora mismo y lo puedes descargar en PDF.</p>
      <form className="mt-6 grid gap-3" onSubmit={submit}>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Nombre</label><input required className="input" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} /></div>
          <div><label className="label">Correo de trabajo</label><input required type="email" className="input" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} /></div>
          <div><label className="label">Empresa</label><input required className="input" value={lead.company} onChange={(e) => setLead({ ...lead, company: e.target.value })} /></div>
          <div><label className="label">Cargo</label><input required className="input" value={lead.title} onChange={(e) => setLead({ ...lead, title: e.target.value })} placeholder="Director General, Planeación…" /></div>
          <div><label className="label">Colaboradores</label><select className="input" value={lead.size} onChange={(e) => setLead({ ...lead, size: e.target.value })}>{SIZES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="label">Industria</label><select className="input" value={lead.industry} onChange={(e) => setLead({ ...lead, industry: e.target.value })}>{INDUSTRIES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="sm:col-span-2"><label className="label">Ciudad</label><input className="input" value={lead.city} onChange={(e) => setLead({ ...lead, city: e.target.value })} placeholder="Monterrey" /></div>
        </div>
        <label className="flex items-start gap-2 text-xs text-slate-500 mt-1"><input type="checkbox" required checked={lead.consent} onChange={(e) => setLead({ ...lead, consent: e.target.checked })} className="mt-0.5" /> Acepto que METIS me contacte para revisar mis resultados y conozco el aviso de privacidad.</label>
        <button className="btn-primary !py-3 mt-2" disabled={saving}>{saving ? "Calculando…" : "Ver mi Índice de Alineación"} <ArrowRight size={16} /></button>
      </form>
    </section>
  );

  // result
  const bench = BENCHMARK[lead.size] ?? 42;
  return (
    <section className="pt-8">
      <div className="no-print flex flex-wrap items-center gap-2 mb-6">
        <button className="btn-ghost" onClick={() => window.print()}><Printer size={14} /> Descargar PDF</button>
        <a className="btn-primary" href="mailto:hola@metis.mx?subject=Revisar%20mi%20%C3%8Dndice%20de%20Alineaci%C3%B3n"><CalendarCheck size={14} /> Agendar revisión de 45 min sin costo</a>
        {mode === "local" && <span className="text-xs text-slate-400 ml-auto">Modo demo: el lead se guardó localmente (sin Supabase).</span>}
      </div>

      <div className="card p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Logo className="text-xl" />
            <div className="text-xs text-slate-400 mt-1">Índice de Alineación · {lead.company} · {new Date().toLocaleDateString("es-MX", { dateStyle: "long" })}</div>
            <h1 className="mt-4 text-2xl font-semibold">{lead.company} está <span style={{ color: result.level.color }}>{result.level.name.toLowerCase()}</span>.</h1>
            <p className="mt-2 text-slate-600 max-w-xl">{result.level.reading}</p>
          </div>
          <div className="text-center shrink-0">
            <Gauge value={result.total} color={result.level.color} />
            <div className="text-xs text-slate-400 mt-1">de 100</div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8 items-center">
          <Radar dims={result.dims} />
          <div className="space-y-3">
            {result.dims.map((d) => (
              <div key={d.dim.id}>
                <div className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: d.dim.color }} />{d.dim.name}</span><span className="font-semibold tabular-nums">{d.pct}</span></div>
                <div className="h-2 rounded-full bg-slate-100 mt-1 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: d.dim.color }} /></div>
              </div>
            ))}
            <div className="text-xs text-slate-400 pt-2">Referencia para empresas de {lead.size} colaboradores: <strong>{bench}</strong>. Tu índice está {result.total >= bench ? `${result.total - bench} puntos arriba` : `${bench - result.total} puntos abajo`}.</div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl p-6" style={{ background: result.weakest.dim.color + "14" }}>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: result.weakest.dim.color }}>Primera brecha a cerrar</div>
          <h3 className="mt-1 text-lg font-semibold">{result.weakest.dim.name} · {result.weakest.pct}/100</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">{GAP_ADVICE[result.weakest.dim.id].map((a) => <li key={a} className="flex gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: result.weakest.dim.color }} />{a}</li>)}</ul>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-100 p-5"><div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recomendación METIS</div><p className="mt-2 text-sm text-slate-700">{result.level.recommendation}</p></div>
          <div className="rounded-2xl border border-slate-100 p-5"><div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Siguiente paso</div><p className="mt-2 text-sm text-slate-700">Revisemos estos resultados juntos en 45 minutos, sin costo. Te mostramos cómo se vería la estrategia de {lead.company} dentro de METIS.</p><a className="text-sm text-indigo font-medium mt-2 inline-block" href="mailto:hola@metis.mx">hola@metis.mx →</a></div>
        </div>
        <div className="mt-6 text-[10px] text-slate-400">El Índice de Alineación es una autoevaluación. El Diagnóstico de Alineación METIS lo complementa con entrevistas al equipo directivo y revisión de KPIs reales.</div>
      </div>
      <div className="no-print mt-6 text-sm text-slate-500">¿Quieres ver cómo funciona la plataforma? <Link href="/inicio" className="text-indigo">Entra a la demo de Grupo Andes →</Link></div>
    </section>
  );
}

function Gauge({ value, color }: { value: number; color: string }) {
  const r = 44, c = 2 * Math.PI * r;
  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      <circle cx={60} cy={60} r={r} fill="none" stroke="#EEF0F6" strokeWidth={10} />
      <circle cx={60} cy={60} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 60 60)" />
      <text x={60} y={66} textAnchor="middle" fontSize={30} fontWeight={600} fill="#171A3A">{value}</text>
    </svg>
  );
}

function Radar({ dims }: { dims: ReturnType<typeof score>["dims"] }) {
  const N = dims.length, R = 72, cx = 170, cy = 140;
  const pt = (k: number, v: number) => { const a = (Math.PI * 2 * k) / N - Math.PI / 2; return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v]; };
  const poly = dims.map((d, k) => pt(k, d.pct / 100).join(",")).join(" ");
  return (
    <svg viewBox="0 0 340 280" className="w-full max-w-[340px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map((g) => <polygon key={g} points={dims.map((_, k) => pt(k, g).join(",")).join(" ")} fill="none" stroke="#E5E7EB" />)}
      {dims.map((_, k) => { const [x, y] = pt(k, 1); return <line key={k} x1={cx} y1={cy} x2={x} y2={y} stroke="#E5E7EB" />; })}
      <polygon points={poly} fill="#4F3FE033" stroke="#4F3FE0" strokeWidth={2} />
      {dims.map((d, k) => { const [x, y] = pt(k, d.pct / 100); return <circle key={k} cx={x} cy={y} r={4} fill={d.dim.color} />; })}
      {dims.map((d, k) => { const [x, y] = pt(k, 1.18); const anchor = Math.abs(x - cx) < 6 ? "middle" : x < cx ? "end" : "start"; return <text key={k} x={x} y={y + 3} textAnchor={anchor} fontSize={10} fill="#64748B">{d.dim.short}</text>; })}
    </svg>
  );
}
