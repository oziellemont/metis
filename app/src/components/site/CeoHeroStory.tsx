"use client";
/**
 * Hero de la landing de mêtis CEO. Mismo componente visual que HeroStory (metisalign):
 * tarjeta blanca, métrica grande + anillo, panel de escena y 4 pestañas con barra de avance.
 * Cuenta el ciclo diario: llega el caso → decides → aprendes → subes.
 */
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Inbox, Scale, GraduationCap, TrendingUp, MessageCircle, Clock, Check, Lightbulb, Crown } from "lucide-react";
import { Flame } from "@/components/ceo/ui";

const SCENES = [
  { key: "caso", label: "El caso", icon: Inbox, title: "Cada día te llega un problema real", pct: 24 },
  { key: "decide", label: "Decides", icon: Scale, title: "Tú decides. La empresa responde.", pct: 41 },
  { key: "aprende", label: "Aprendes", icon: GraduationCap, title: "Entiendes por qué, en un minuto", pct: 63 },
  { key: "sube", label: "Subes", icon: TrendingUp, title: "Día a día, llegas a CEO", pct: 86 },
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

/** Revela elementos uno tras otro dentro de una escena. */
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

function Caso() {
  const k = useSteps(4, 520, 250);
  return (
    <div>
      <div className={clsx("flex items-center gap-2 rounded-xl bg-white border border-slate-100 px-3 py-2 transition-all duration-500", k >= 1 ? "opacity-100" : "opacity-0 -translate-y-1")}>
        <span className="h-7 w-7 shrink-0 rounded-full bg-indigo-soft text-indigo grid place-items-center text-[9px] font-semibold">HS</span>
        <div className="min-w-0 flex-1"><div className="text-[11px] font-semibold text-ink">Héctor Salinas</div><div className="text-[10px] text-slate-400">Director Comercial</div></div>
        <span className="chip bg-mint-soft text-sob !text-[10px] gap-1"><MessageCircle size={10} /> WhatsApp</span>
      </div>
      <div className={clsx("mt-2 ml-4 rounded-2xl rounded-tl-md bg-indigo text-white px-3 py-2 text-[11.5px] leading-snug transition-all duration-500", k >= 2 ? "opacity-100" : "opacity-0 translate-y-1")}>
        SuperNorte quiere 6% más de descuento o deja de vendernos. ¿Qué le digo?
      </div>
      <div className={clsx("mt-3 grid grid-cols-2 gap-2 transition-all duration-500", k >= 3 ? "opacity-100" : "opacity-0 translate-y-1")}>
        <div className="rounded-xl bg-white border border-slate-100 p-2"><div className="text-[9.5px] text-slate-400">Es tu cliente más grande</div><div className="text-[12px] font-semibold text-ink">1 de cada 3 pesos</div></div>
        <div className="rounded-xl bg-white border border-slate-100 p-2"><div className="text-[9.5px] text-slate-400 flex items-center gap-1"><Clock size={9} /> Responde en</div><div className="text-[12px] font-semibold text-coral tabular-nums">3 h 40 min</div></div>
      </div>
      <p className={clsx("mt-3 text-center text-[11px] text-slate-500 transition-opacity duration-500", k >= 4 ? "opacity-100" : "opacity-0")}>Llega a tu celular, como en una empresa de verdad.</p>
    </div>
  );
}

function Decide() {
  const k = useSteps(5, 480, 250);
  const opts = ["Aceptar el 6% para no perder la cuenta", "Ofrecer 3% si nos compran más", "Decir que no y buscar otras cadenas"];
  const kp = [["Utilidad", 54, 61], ["Clientes", 64, 69], ["Tu equipo", 57, 52]] as const;
  return (
    <div>
      <div className="space-y-1.5">
        {opts.map((o, i) => {
          const on = i === 1 && k >= 2;
          return (
            <div key={o} className={clsx("flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] transition-all duration-300", k >= 1 ? "opacity-100" : "opacity-0", on ? "border-indigo bg-indigo-soft/70 text-ink font-medium" : "border-slate-100 bg-white text-slate-600", k >= 2 && i !== 1 && "opacity-50")}>
              <span className={clsx("h-4 w-4 shrink-0 rounded-full border grid place-items-center transition-all", on ? "border-indigo bg-indigo text-white scale-100" : "border-slate-300")}>{on && <Check size={9} strokeWidth={3} />}</span>{o}
            </div>
          );
        })}
      </div>
      <div className="mt-3 space-y-1.5">
        {kp.map(([l, a, b], i) => {
          const v = k >= 3 + Math.min(i, 1) ? b : a;
          const d = b - a;
          return (
            <div key={l} className="flex items-center gap-2 text-[11px]">
              <span className="w-16 text-slate-500">{l}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className={clsx("h-full rounded-full transition-all duration-700 ease-out", d >= 0 ? "bg-indigo" : "bg-coral")} style={{ width: `${v}%` }} /></div>
              <span className={clsx("w-7 text-right font-semibold tabular-nums transition-opacity duration-300", k >= 3 + Math.min(i, 1) ? "opacity-100" : "opacity-0", d >= 0 ? "text-sob" : "text-coral")}>{d > 0 ? "+" : ""}{d}</span>
            </div>
          );
        })}
      </div>
      <p className={clsx("mt-2.5 text-center text-[11px] text-slate-500 transition-opacity duration-500", k >= 5 ? "opacity-100" : "opacity-0")}>Héctor esperaba otra cosa. Lo vas a notar la próxima semana.</p>
    </div>
  );
}

function Aprende() {
  const k = useSteps(4, 560, 250);
  return (
    <div>
      <div className={clsx("rounded-xl bg-white border border-slate-100 p-3 transition-all duration-500", k >= 1 ? "opacity-100" : "opacity-0 translate-y-1")}>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo"><Lightbulb size={11} /> Nota CEO</div>
        <p className="mt-1.5 text-[12px] leading-snug text-ink">Cuando un cliente pesa tanto, no regales precio: ofrece algo que también le sirva a él.</p>
        <div className="mt-1.5 text-[9.5px] text-slate-400">De CERO a CEO</div>
      </div>
      <div className={clsx("mt-2 rounded-xl bg-white border border-slate-100 p-3 transition-all duration-500", k >= 2 ? "opacity-100" : "opacity-0 translate-y-1")}>
        <div className="text-[11px] font-semibold text-ink">¿Qué protegiste con tu decisión?</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["La utilidad", "La relación", "Las ventas"].map((o, i) => (
            <span key={o} className={clsx("rounded-full border px-2 py-0.5 text-[10.5px] transition-all duration-300", i === 0 && k >= 3 ? "border-mint bg-mint-soft text-sob font-semibold" : "border-slate-200 text-slate-500")}>{i === 0 && k >= 3 && "✓ "}{o}</span>
          ))}
        </div>
      </div>
      <div className={clsx("mt-3 flex items-center justify-center gap-2 transition-all duration-500", k >= 4 ? "opacity-100 scale-100" : "opacity-0 scale-95")}>
        <span className="chip bg-indigo text-white !text-[11px]">+30 puntos</span><span className="text-[11px] text-slate-500">¡Bien decidido!</span>
      </div>
    </div>
  );
}

function Sube() {
  const k = useSteps(6, 380, 250);
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const xp = k >= 5 ? 92 : 64;
  return (
    <div>
      <div className="rounded-xl bg-[#1E1A5E] text-white px-3 py-2.5 flex items-center gap-3">
        <span className={clsx("h-9 w-9 rounded-xl grid place-items-center transition-colors duration-500", k >= 1 ? "bg-gradient-to-br from-amber to-coral" : "bg-white/10")}><Flame on={k >= 1} size={20} white /></span>
        <div className="flex-1"><div className="text-[15px] font-semibold tabular-nums leading-none">{k >= 1 ? 12 : 11} días</div><div className="text-[9.5px] text-white/60 mt-0.5">de racha</div></div>
        <div className="flex gap-1">
          {days.map((d, i) => <span key={i} className={clsx("h-5 w-5 rounded-full grid place-items-center text-[8px] font-semibold transition-all duration-300", i < Math.min(k, 5) ? "bg-gradient-to-br from-amber to-coral text-white" : "bg-white/10 text-white/40")} style={{ transitionDelay: `${i * 60}ms` }}>{i < Math.min(k, 5) ? "✓" : d}</span>)}
        </div>
      </div>
      <div className="mt-2.5 rounded-xl bg-white border border-slate-100 p-3">
        <div className="flex items-center justify-between text-[11px]"><span className="font-semibold text-ink">Director General</span><span className="text-slate-400 tabular-nums">{xp}% para CEO</span></div>
        <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-indigo transition-all duration-1000 ease-out" style={{ width: `${xp}%` }} /></div>
      </div>
      <div className={clsx("mt-2.5 flex items-center gap-2.5 rounded-xl bg-indigo-soft px-3 py-2 transition-all duration-500", k >= 6 ? "opacity-100" : "opacity-0 translate-y-1")}>
        <span className="h-7 w-7 rounded-lg bg-indigo text-white grid place-items-center"><Crown size={14} /></span>
        <div className="text-[11px] text-indigo"><strong>¡Te llama otra empresa!</strong> Más grande y más retadora.</div>
      </div>
    </div>
  );
}

const VIEW = { caso: Caso, decide: Decide, aprende: Aprende, sube: Sube } as const;

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
  const pct = useCount(sc.pct);
  const View = VIEW[sc.key];
  const go = (j: number) => { setI(j); setCycle((c) => c + 1); };

  return (
    <div className="card !bg-white/95 text-ink p-5 shadow-2xl" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">Tu camino a CEO</div>
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
