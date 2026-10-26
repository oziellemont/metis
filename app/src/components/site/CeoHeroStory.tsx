"use client";
/**
 * Animación del hero de la landing de mêtis CEO: cuenta en 4 escenas cómo se juega,
 * con la confianza del consejo siempre visible arriba. Mismo lenguaje visual que HeroStory.
 */
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Inbox, Scale, Network, Route, Mail, MessageCircle, FileText, Check, Sparkles, Crown } from "lucide-react";

const SCENES = [
  { key: "bandeja", label: "Bandeja", icon: Inbox, title: "Tu día empieza con mensajes reales", trust: 58 },
  { key: "decide", label: "Decisión", icon: Scale, title: "Decides, y todo tiene consecuencias", trust: 66 },
  { key: "gente", label: "Tu gente", icon: Network, title: "Tu equipo reacciona a lo que haces", trust: 74 },
  { key: "carrera", label: "Carrera", icon: Route, title: "De gerente a CEO, nivel por nivel", trust: 88 },
] as const;
const MS = 5200;

function useCount(target: number, ms = 900) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now(), a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(a + (target - a) * e));
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function useSteps(n: number, every = 450, delay = 250) {
  const [k, setK] = useState(0);
  useEffect(() => {
    setK(0);
    let cleanup = () => {};
    const t0 = setTimeout(() => {
      let i = 0;
      const t = setInterval(() => { i++; setK(i); if (i >= n) clearInterval(t); }, every);
      cleanup = () => clearInterval(t);
    }, delay);
    return () => { clearTimeout(t0); cleanup(); };
  }, [n, every, delay]);
  return k;
}

function Bandeja() {
  const k = useSteps(4, 650, 200);
  const msgs = [
    [Mail, "Lucía Treviño · Finanzas", "El banco pide revisar el covenant antes del viernes.", "8:12"],
    [MessageCircle, "Héctor Salinas · Comercial", "SuperNorte quiere 6% más de descuento. ¿Qué le digo?", "9:40"],
    [FileText, "Reporte de planta", "Merma de 7.8% esta semana. Meta: 5%.", "11:05"],
  ] as const;
  return (
    <div className="space-y-1.5">
      {msgs.map(([I, who, txt, h], i) => (
        <div key={who} className={clsx("flex items-start gap-2.5 rounded-xl bg-white border border-slate-100 px-3 py-2 transition-all duration-500", k > i ? "opacity-100" : "opacity-0 translate-y-1")}>
          <span className="mt-0.5 h-6 w-6 shrink-0 rounded-lg bg-indigo-soft text-indigo grid place-items-center"><I size={12} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[10.5px]"><span className="font-semibold text-ink truncate">{who}</span><span className="text-slate-400 tabular-nums">{h}</span></div>
            <div className="text-[11px] text-slate-500 leading-snug">{txt}</div>
          </div>
        </div>
      ))}
      <p className={clsx("pt-1 text-center text-[11px] text-slate-500 transition-opacity duration-500", k >= 4 ? "opacity-100" : "opacity-0")}>Llegan durante el día, como en una empresa de verdad.</p>
    </div>
  );
}

function Decide() {
  const k = useSteps(4, 600, 300);
  const opts = ["Aceptar el descuento para no perder la cuenta", "Negociar volumen a cambio de 3%", "Decir que no y buscar otras cadenas"];
  return (
    <div>
      <div className="rounded-xl bg-[#1E1A5E] text-white px-3 py-2"><div className="text-[9px] font-semibold uppercase tracking-wider text-white/60">Decisión · SuperNorte (31% de tus ventas)</div><div className="text-[12px] font-semibold">¿Qué haces con el descuento?</div></div>
      <div className="mt-2 space-y-1.5">
        {opts.map((o, i) => (
          <div key={o} className={clsx("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] transition-all duration-300", i === 1 && k >= 2 ? "border-indigo bg-indigo-soft/60 text-ink" : "border-slate-100 bg-white text-slate-600")}>
            <span className={clsx("h-3.5 w-3.5 rounded-full border grid place-items-center", i === 1 && k >= 2 ? "border-indigo bg-indigo text-white" : "border-slate-300")}>{i === 1 && k >= 2 && <Check size={8} strokeWidth={3} />}</span>{o}
          </div>
        ))}
      </div>
      <div className={clsx("mt-2.5 flex flex-wrap gap-1.5 transition-all duration-500", k >= 3 ? "opacity-100" : "opacity-0 translate-y-1")}>
        {[["Margen", "+4", "text-sob bg-mint-soft"], ["Clientes", "−2", "text-coral bg-coral-soft"], ["Consejo", "+3", "text-sob bg-mint-soft"]].map(([l, d, c]) => (
          <span key={l} className={clsx("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", c)}>{l} {d}</span>
        ))}
      </div>
      <p className={clsx("mt-2 text-[11px] text-slate-500 transition-opacity duration-500", k >= 4 ? "opacity-100" : "opacity-0")}>Héctor no queda contento. Lo vas a notar la próxima semana.</p>
    </div>
  );
}

function Ring({ v, ini }: { v: number; ini: string }) {
  return (
    <span className="relative h-8 w-8 shrink-0">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90"><circle cx="18" cy="18" r="16" fill="none" stroke="#EEF0FA" strokeWidth="3" /><circle cx="18" cy="18" r="16" fill="none" stroke="#4F3FE0" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(v / 100) * 100.5} 100.5`} className="transition-all duration-700" /></svg>
      <span className="absolute inset-[4px] rounded-full bg-indigo-soft text-indigo grid place-items-center text-[8.5px] font-semibold">{ini}</span>
    </span>
  );
}

function Gente() {
  const k = useSteps(6, 380, 200);
  const team = [["LT", "Lucía", "Finanzas", 82], ["HS", "Héctor", "Comercial", 34], ["MV", "Mariana", "Personas", 68]] as const;
  const phase = (v: number) => (v >= 75 ? ["Adopta", "bg-indigo text-white"] : v >= 50 ? ["Prueba", "bg-indigo-soft text-indigo"] : v >= 25 ? ["Escucha", "bg-slate-100 text-slate-600"] : ["Resiste", "bg-coral-soft text-coral"]);
  return (
    <div>
      <div className={clsx("mx-auto w-fit flex items-center gap-2 rounded-xl bg-indigo text-white px-3 py-2 text-[12px] font-semibold transition-all duration-500", k >= 1 ? "opacity-100" : "opacity-0 -translate-y-1")}>
        <Crown size={13} /> TÚ · Dirección General
      </div>
      <div className="relative mt-1 h-5">
        <div className={clsx("absolute left-1/2 top-0 w-px bg-indigo/30 transition-all duration-500", k >= 2 ? "h-2.5" : "h-0")} />
        <div className={clsx("absolute left-[16.6%] right-[16.6%] top-2.5 h-px bg-indigo/30 origin-center transition-transform duration-500", k >= 2 ? "scale-x-100" : "scale-x-0")} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {team.map(([ini, n, r, v], i) => {
          const val = k >= 6 ? v : Math.max(10, v - 30);
          const [ph, cls] = phase(val);
          return (
            <div key={n} className={clsx("rounded-xl bg-white border border-slate-100 p-2 text-center transition-all duration-500", k >= 3 + i ? "opacity-100" : "opacity-0 translate-y-1")}>
              <div className="flex justify-center"><Ring v={val} ini={ini} /></div>
              <div className="mt-1 text-[10.5px] font-semibold text-ink leading-tight">{n}</div>
              <div className="text-[9.5px] text-slate-400">{r}</div>
              <span className={clsx("mt-1 inline-block rounded-full px-1.5 py-px text-[9px] font-semibold transition-colors duration-500", cls)}>{ph}</span>
            </div>
          );
        })}
      </div>
      <p className={clsx("mt-3 text-center text-[11px] text-slate-500 transition-opacity duration-500", k >= 6 ? "opacity-100" : "opacity-0")}>Al cierre de cada nivel, tu gente tiene que adoptar el cambio.</p>
    </div>
  );
}

function Carrera() {
  const k = useSteps(5, 420, 250);
  const lv = ["Gerente", "Director de área", "Director General", "CEO", "CEO de consejo"];
  return (
    <div>
      <div className="space-y-1.5">
        {lv.map((l, i) => (
          <div key={l} className={clsx("flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition-all duration-500", k > i ? "opacity-100" : "opacity-0 translate-x-[-6px]", i === 3 ? "border-indigo bg-indigo-soft/60" : "border-slate-100 bg-white")}>
            <span className={clsx("h-4 w-4 rounded-full grid place-items-center text-[8px] font-bold", i < 3 ? "bg-mint text-white" : i === 3 ? "bg-indigo text-white" : "bg-slate-100 text-slate-400")}>{i < 3 ? <Check size={9} strokeWidth={3} /> : i + 1}</span>
            <span className={clsx("flex-1", i === 3 ? "font-semibold text-ink" : "text-slate-600")}>{l}</span>
            {i === 3 && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo"><Sparkles size={10} /> Ascendiste</span>}
          </div>
        ))}
      </div>
      <p className={clsx("mt-2.5 text-center text-[11px] text-slate-500 transition-opacity duration-500", k >= 5 ? "opacity-100" : "opacity-0")}>Cada empresa es un nivel. El consejo decide si subes.</p>
    </div>
  );
}

const VIEW = { bandeja: Bandeja, decide: Decide, gente: Gente, carrera: Carrera } as const;

export function CeoHeroStory() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => { setI((x) => (x + 1) % SCENES.length); setCycle((c) => c + 1); }, MS);
    return () => clearTimeout(t);
  }, [i, paused, cycle]);
  const sc = SCENES[i];
  const pct = useCount(sc.trust);
  const View = VIEW[sc.key];
  const go = (j: number) => { setI(j); setCycle((c) => c + 1); };

  return (
    <div className="card !bg-white/95 text-ink p-5 shadow-2xl" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">Confianza del consejo en ti</div>
          <div className="text-4xl font-semibold text-indigo mt-0.5 tabular-nums">{pct}%</div>
        </div>
        <div className="mt-1 h-14 w-14 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EEF0FA" strokeWidth="4" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#4F3FE0" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 97.4} 97.4`} />
          </svg>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-canvas border border-slate-100 p-4">
        <div key={`t-${cycle}`} className="academy-in mb-3 flex items-center gap-2 text-[12.5px] font-semibold text-ink">
          <sc.icon size={14} className="text-indigo" /> {sc.title}
        </div>
        <div key={`v-${cycle}`} className="academy-in min-h-[212px]"><View /></div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {SCENES.map((s, j) => (
          <button key={s.key} type="button" onClick={() => go(j)} className="group text-left" aria-label={s.title}>
            <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                key={j === i ? `p-${cycle}` : `p-${j}`}
                className={clsx("h-full rounded-full bg-indigo", j < i && "w-full", j > i && "w-0", j === i && "hero-progress")}
                style={j === i ? { animationDuration: `${MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
              />
            </div>
            <div className={clsx("mt-1.5 text-[10.5px] font-medium transition-colors", j === i ? "text-indigo" : "text-slate-400 group-hover:text-slate-600")}>{s.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
