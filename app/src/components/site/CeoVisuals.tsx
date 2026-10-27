"use client";
/**
 * Piezas animadas de la landing de mêtis CEO. Se despliegan al entrar en pantalla con las mismas
 * animaciones de metisalign (tree-drop / tree-pop / tree-slide / tree-grow) y el mismo lenguaje de tarjetas.
 */
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Check, Crown, Lock, Lightbulb, Mail, MessageCircle, FileText, Users, Inbox, Scale, TrendingUp } from "lucide-react";
import { Flame } from "@/components/ceo/ui";
import { useInView } from "./useInView";

const CARD = "rounded-3xl bg-white border border-slate-100 shadow-[0_1px_2px_rgba(23,26,58,0.04),0_12px_32px_-12px_rgba(23,26,58,0.10)]";

function useCountOn(on: boolean, target: number, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, target, ms]);
  return v;
}

/* ---------- Cifras ---------- */
function Stat({ on, n, label, delay }: { on: boolean; n: number; label: string; delay: number }) {
  const [go, setGo] = useState(false);
  useEffect(() => { if (on) { const t = setTimeout(() => setGo(true), delay); return () => clearTimeout(t); } }, [on, delay]);
  const v = useCountOn(go, n);
  return (
    <div className={clsx("text-center transition-all duration-500", go ? "opacity-100" : "opacity-0 translate-y-2")}>
      <div className="text-4xl sm:text-5xl font-semibold text-indigo tabular-nums">{v}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
export function CeoStats({ items }: { items: [number, string][] }) {
  const { ref, on } = useInView(0.4);
  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {items.map(([n, l], i) => <Stat key={l} on={on} n={n} label={l} delay={i * 140} />)}
    </div>
  );
}

/* ---------- 1 · Unos minutos al día: la racha ---------- */
export function StreakVisual() {
  const { ref, on, anim } = useInView();
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const msgs = [[Mail, "Lucía · Finanzas", "Necesito tu visto bueno para el presupuesto.", "8:12"], [MessageCircle, "Héctor · Comercial", "SuperNorte pide más descuento.", "13:40"], [FileText, "Mariana · Personas", "Renunció alguien clave. ¿Hablamos?", "17:05"]] as const;
  return (
    <div ref={ref} className={CARD + " p-7"}>
      <div className={anim("tree-drop", 0).className} style={anim("tree-drop", 0).style}>
        <div className="rounded-2xl bg-[#1E1A5E] text-white p-4 flex items-center gap-4">
          <span className="h-12 w-12 rounded-2xl grid place-items-center bg-gradient-to-br from-amber to-coral"><Flame on size={26} white /></span>
          <div className="flex-1"><div className="text-2xl font-semibold tabular-nums leading-none">12</div><div className="text-xs text-white/60 mt-1">días de racha</div></div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((d, i) => { const a = anim("tree-pop", 250 + i * 90); return (
          <div key={i} className={"flex flex-col items-center gap-1 " + a.className} style={a.style}>
            <span className={clsx("h-8 w-8 rounded-full grid place-items-center text-[11px] font-semibold", i < 5 ? "bg-gradient-to-br from-amber to-coral text-white" : i === 5 ? "bg-indigo-soft text-indigo ring-2 ring-indigo/30" : "bg-slate-100 text-slate-300")}>{i < 5 ? <Check size={13} strokeWidth={3} /> : ""}</span>
            <span className="text-[10px] text-slate-400">{d}</span>
          </div>
        ); })}
      </div>
      <div className={"mt-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 " + anim("tree-slide", 900).className} style={anim("tree-slide", 900).style}>Hoy, en tu horario</div>
      <div className="mt-2 space-y-2">
        {msgs.map(([I, w, t, h], i) => { const a = anim("tree-slide", 1000 + i * 180); return (
          <div key={w} className={"flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 " + a.className} style={a.style}>
            <span className="h-7 w-7 rounded-lg bg-indigo-soft text-indigo grid place-items-center"><I size={13} /></span>
            <div className="flex-1 min-w-0"><div className="text-[12px] font-semibold text-ink">{w}</div><div className="text-[11px] text-slate-500 truncate">{t}</div></div>
            <span className="text-[10.5px] text-slate-400 tabular-nums">{h}</span>
          </div>
        ); })}
      </div>
    </div>
  );
}

/* ---------- 2 · Aprendes haciendo: tu gente reacciona (cascada estilo metisalign) ---------- */
function Ring({ v, ini }: { v: number; ini: string }) {
  return (
    <span className="relative h-10 w-10 shrink-0">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90"><circle cx="18" cy="18" r="16" fill="none" stroke="#EEF0FA" strokeWidth="3" /><circle cx="18" cy="18" r="16" fill="none" stroke="#4F3FE0" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(v / 100) * 100.5} 100.5`} style={{ transition: "stroke-dasharray 900ms cubic-bezier(.2,.7,.2,1)" }} /></svg>
      <span className="absolute inset-[5px] rounded-full bg-indigo-soft text-indigo grid place-items-center text-[9px] font-semibold">{ini}</span>
    </span>
  );
}
const phase = (v: number) => (v >= 75 ? ["Adopta", "bg-indigo text-white"] : v >= 50 ? ["Prueba", "bg-indigo-soft text-indigo"] : v >= 25 ? ["Escucha", "bg-slate-100 text-slate-600"] : ["Resiste", "bg-coral-soft text-coral"]);
export function TeamVisual() {
  const { ref, on, anim } = useInView();
  const [moved, setMoved] = useState(false);
  useEffect(() => { if (on) { const t = setTimeout(() => setMoved(true), 1900); return () => clearTimeout(t); } }, [on]);
  const team = [["LT", "Lucía", "Finanzas", 58, 81], ["HS", "Héctor", "Comercial", 18, 44], ["MV", "Mariana", "Personas", 46, 77]] as const;
  return (
    <div ref={ref} className={CARD + " p-7"}>
      <div className={"mx-auto w-fit flex items-center gap-2 rounded-xl bg-indigo text-white px-3.5 py-2 text-[13px] font-semibold " + anim("tree-drop", 0).className} style={anim("tree-drop", 0).style}>
        <Crown size={14} /> TÚ · Dirección General
      </div>
      <div className="relative mt-1 h-6">
        <div className={"absolute left-1/2 top-0 h-3 w-px bg-indigo/30 " + anim("tree-grow-y", 300).className} style={anim("tree-grow-y", 300).style} />
        <div className={"absolute left-[16.6%] right-[16.6%] top-3 h-px bg-indigo/30 " + anim("tree-grow-x", 450).className} style={anim("tree-grow-x", 450).style} />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {team.map(([ini, n, r, a, b], i) => {
          const v = moved ? b : a;
          const [ph, cls] = phase(v);
          const an = anim("tree-pop", 650 + i * 160);
          return (
            <div key={n} className={"relative rounded-2xl bg-white border border-slate-100 p-3 text-center " + an.className} style={an.style}>
              {moved && <span className="tree-pop absolute -top-2.5 right-2 rounded-full bg-mint text-white px-1.5 text-[10px] font-semibold" style={{ animationDelay: `${i * 120}ms` }}>+{b - a}</span>}
              <div className="flex justify-center"><Ring v={v} ini={ini} /></div>
              <div className="mt-1.5 text-[12px] font-semibold text-ink">{n}</div>
              <div className="text-[10.5px] text-slate-400">{r}</div>
              <span className={clsx("mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors duration-500", cls)}>{ph}</span>
            </div>
          );
        })}
      </div>
      <div className={"mt-5 flex items-center gap-3 rounded-xl bg-indigo-soft px-3.5 py-2.5 " + anim("tree-pop", 1500).className} style={anim("tree-pop", 1500).style}>
        <span className="h-8 w-8 rounded-lg bg-indigo text-white grid place-items-center"><Users size={15} /></span>
        <div className="text-[12px] text-indigo"><strong>Convenciste a Lucía primero.</strong> Los demás la siguieron.</div>
      </div>
    </div>
  );
}

/* ---------- 3 · Aprendes en un minuto: la nota CEO ---------- */
export function LessonVisual() {
  const { ref, on, anim } = useInView();
  const [pick, setPick] = useState(false);
  useEffect(() => { if (on) { const t = setTimeout(() => setPick(true), 1500); return () => clearTimeout(t); } }, [on]);
  return (
    <div ref={ref} className={CARD + " p-7"}>
      <div className={"flex items-center justify-between " + anim("tree-drop", 0).className}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo">mêtis Academy · Lección 4</span>
        <span className="text-[11px] text-slate-400">4 min</span>
      </div>
      <div className={"mt-3 flex gap-1 " + anim("tree-pop", 150).className} style={anim("tree-pop", 150).style}>{[0, 1, 2, 3, 4].map((i) => <span key={i} className={clsx("h-1.5 flex-1 rounded-full", i < 3 ? "bg-indigo" : i === 3 ? "bg-indigo/40" : "bg-slate-100")} />)}</div>
      <div className={"mt-5 " + anim("tree-pop", 350).className} style={anim("tree-pop", 350).style}>
        <h4 className="text-lg font-semibold text-ink leading-snug">Si no tienes 2 o 3 posibles reemplazos, estás protegiendo tu silla.</h4>
      </div>
      <div className={"mt-4 rounded-2xl border border-slate-100 p-4 " + anim("tree-pop", 650).className} style={anim("tree-pop", 650).style}>
        <div className="text-[12.5px] font-semibold text-ink">Tu mejor analista renuncia: «nunca supe si mi trabajo servía». ¿Qué falló?</div>
        <div className="mt-3 space-y-1.5">
          {["Le faltó sueldo", "Nadie le conectó su trabajo con el resultado", "No tenía talento"].map((o, i) => (
            <div key={o} className={clsx("flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] transition-all duration-300", pick && i === 1 ? "border-mint bg-mint-soft text-ink font-medium" : "border-slate-100 text-slate-600", pick && i !== 1 && "opacity-50")}>
              <span className={clsx("h-4 w-4 rounded-full border grid place-items-center", pick && i === 1 ? "bg-mint border-mint text-white" : "border-slate-300")}>{pick && i === 1 && <Check size={9} strokeWidth={3} />}</span>{o}
            </div>
          ))}
        </div>
      </div>
      <div className={clsx("mt-4 flex items-start gap-2.5 rounded-xl bg-canvas px-3.5 py-3 transition-all duration-500", pick ? "opacity-100" : "opacity-0 translate-y-1")}>
        <Lightbulb size={15} className="text-indigo shrink-0 mt-0.5" />
        <p className="text-[12px] text-ink"><b>Nota CEO:</b> el liderazgo no se mide por cuánta gente te sigue, sino por cuánta crece contigo.<span className="block text-[10.5px] text-slate-400 mt-0.5">De CERO a CEO · Oziel Leal Montemayor</span></p>
      </div>
    </div>
  );
}

/* ---------- 4 · El camino: de gerente a CEO ---------- */
export function PathVisual({ companies }: { companies: { name: string; industry: string }[] }) {
  const { ref, anim } = useInView(0.2);
  const steps = [
    { t: "Emerging Leader", d: "Tus primeras decisiones", s: "done" },
    { t: "Functional Manager", d: companies[0]?.name, s: "done" },
    { t: "Business Unit Director", d: companies[1]?.name, s: "now" },
    { t: "Chief Operating Officer", d: companies[2]?.name, s: "next" },
    { t: "Chief Executive Officer", d: "Junta de nombramiento", s: "next" },
    { t: "Global CEO", d: "Operación internacional", s: "next" },
  ] as const;
  return (
    <div ref={ref} className={CARD + " p-7 lg:p-8"}>
      <div className={"flex items-baseline justify-between " + anim("tree-drop", 0).className}>
        <h3 className="font-semibold text-ink">Tu carrera</h3>
        <span className="text-xs font-medium text-slate-400">6 etapas</span>
      </div>
      <ol className="mt-7">
        {steps.map((st, i) => {
          const last = i === steps.length - 1;
          const t0 = 200 + i * 260;
          const dot = anim("tree-pop", t0), text = anim("tree-pop", t0 + 60), line = anim("tree-grow-y", t0 + 140);
          return (
            <li key={st.t} className={"relative pl-12 " + (last ? "" : "pb-6")}>
              {!last && <span aria-hidden className={"absolute left-[17px] top-9 bottom-0 w-0.5 rounded-full " + (st.s === "done" ? "bg-mint/50 " : "bg-slate-100 ") + line.className} style={line.style} />}
              <span className={clsx("absolute left-0 top-0 h-9 w-9 rounded-full grid place-items-center", st.s === "done" ? "bg-mint text-white" : st.s === "now" ? "bg-indigo text-white ring-4 ring-indigo/15" : "bg-slate-100 text-slate-400", dot.className)} style={dot.style}>
                {st.s === "done" ? <Check size={16} strokeWidth={3} /> : st.s === "now" ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : <Lock size={14} />}
              </span>
              <div className={clsx("rounded-2xl border px-4 py-2.5 flex items-center gap-3", st.s === "now" ? "border-indigo bg-indigo-soft/50" : "border-slate-100", text.className)} style={text.style}>
                <div className="flex-1"><div className="font-medium text-ink leading-tight">{st.t}</div><div className="text-[12px] text-slate-500">{st.d}</div></div>
                {st.s === "now" && <span className="chip bg-indigo text-white !text-[10px]">Vas aquí</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------- Tablero: los 5 rubros del consejo ---------- */
export function BoardVisual() {
  const { ref, on, anim } = useInView();
  const rows = [["Caja", 72], ["Margen", 64], ["Equipo", 81], ["Clientes", 69], ["Consejo", 77]] as const;
  return (
    <div ref={ref} className={CARD + " p-7"}>
      <div className={"flex items-center justify-between " + anim("tree-drop", 0).className}>
        <div><div className="text-xs text-slate-400">Veredicto del consejo</div><div className="text-lg font-semibold text-ink">Aprobado · asciendes</div></div>
        <span className={clsx("h-11 w-11 rounded-full grid place-items-center bg-mint text-white transition-transform duration-500", on ? "scale-100" : "scale-0")} style={{ transitionDelay: "1300ms" }}><Check size={20} strokeWidth={3} /></span>
      </div>
      <div className="mt-5 space-y-3">
        {rows.map(([l, v], i) => (
          <div key={l} className="flex items-center gap-3 text-[13px]">
            <span className="w-20 text-slate-500">{l}</span>
            <div className="relative flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-indigo transition-all duration-1000 ease-out" style={{ width: on ? `${v}%` : "0%", transitionDelay: `${200 + i * 140}ms` }} />
            </div>
            <span className="w-8 text-right font-semibold tabular-nums text-ink">{v}</span>
          </div>
        ))}
      </div>
      <div className={"mt-4 text-[11.5px] text-slate-400 " + anim("tree-pop", 1200).className} style={anim("tree-pop", 1200).style}>Cada rubro debe pasar la línea de aprobación, y en cada empresa el consejo exige más.</div>
    </div>
  );
}

/* ---------- Así funciona: 3 pasos ---------- */
const STEP_ICONS = { inbox: Inbox, decide: Scale, up: TrendingUp } as const;
export function HowSteps({ steps }: { steps: { n: string; t: string; d: string; icon: keyof typeof STEP_ICONS }[] }) {
  const { ref, anim } = useInView(0.3);
  return (
    <div ref={ref} className="relative grid md:grid-cols-3 gap-5">
      <div aria-hidden className={"hidden md:block absolute top-10 left-[16.6%] right-[16.6%] h-px bg-indigo/20 " + anim("tree-grow-x", 300).className} style={anim("tree-grow-x", 300).style} />
      {steps.map((st, i) => { const a = anim("tree-pop", 150 + i * 220); const I = STEP_ICONS[st.icon]; return (
        <div key={st.n} className={"relative text-center " + a.className} style={a.style}>
          <span className="relative mx-auto h-20 w-20 rounded-3xl bg-white border border-slate-100 shadow-card grid place-items-center text-indigo"><I size={30} /><span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-indigo text-white text-[13px] font-semibold grid place-items-center">{st.n}</span></span>
          <h3 className="mt-5 text-xl font-semibold text-ink">{st.t}</h3>
          <p className="mt-2 text-slate-600 max-w-xs mx-auto">{st.d}</p>
        </div>
      ); })}
    </div>
  );
}
