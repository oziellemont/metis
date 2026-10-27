"use client";
/**
 * Cuadro del hero: el ciclo de MÊTIS en cuatro escenas que avanzan solas
 * (el caso → decides → aprendes → avanzas). Tarjeta blanca, anillo de avance y pestañas con barra.
 * Se pausa al pasar el mouse o al enfocar; con «reducir movimiento» no avanza solo.
 * Es ilustrativo: no usa el motor, la partida ni la cuenta.
 */
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Check, Clock, GraduationCap, Inbox, Lightbulb, MessageCircle, Scale, TrendingUp, Award } from "lucide-react";
import { STORY } from "./content";

const MS = 5200;
const ICONS = { caso: Inbox, decide: Scale, aprende: GraduationCap, sube: TrendingUp } as const;

function useCount(target: number, ms = 900) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now(), a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      setV(Math.round(a + (target - a) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** Revela los elementos de una escena uno tras otro. */
function useSteps(n: number, every = 450, delay = 250) {
  const [k, setK] = useState(0);
  useEffect(() => {
    setK(0);
    let iv: ReturnType<typeof setInterval> | undefined;
    const t0 = setTimeout(() => {
      let i = 0;
      iv = setInterval(() => { i++; setK(i); if (i >= n && iv) clearInterval(iv); }, every);
    }, delay);
    return () => { clearTimeout(t0); if (iv) clearInterval(iv); };
  }, [n, every, delay]);
  return k;
}

const show = (on: boolean) => clsx("motion-safe:transition-all motion-safe:duration-500", on ? "opacity-100" : "opacity-0 translate-y-1");

function Caso() {
  const k = useSteps(4, 520);
  const c = STORY.caso;
  return (
    <div>
      <div className={clsx("flex items-center gap-2 rounded-xl bg-white border border-slate-100 px-3 py-2", show(k >= 1))}>
        <span className="h-7 w-7 shrink-0 rounded-full bg-indigo-soft text-indigo grid place-items-center text-[9px] font-semibold">HS</span>
        <div className="min-w-0 flex-1"><div className="text-[11px] font-semibold text-ink">{c.from}</div><div className="text-[10px] text-slate-500">{c.role}</div></div>
        <span className="chip bg-mint-soft text-sob !text-[10px] gap-1"><MessageCircle size={10} aria-hidden /> {c.channel}</span>
      </div>
      <div className={clsx("mt-2 ml-4 rounded-2xl rounded-tl-md bg-indigo text-white px-3 py-2 text-[11.5px] leading-snug", show(k >= 2))}>{c.msg}</div>
      <div className={clsx("mt-3 grid grid-cols-2 gap-2", show(k >= 3))}>
        {c.facts.map(([l, v], i) => (
          <div key={l} className="rounded-xl bg-white border border-slate-100 p-2">
            <div className="text-[9.5px] text-slate-500 flex items-center gap-1">{i === 1 && <Clock size={9} aria-hidden />} {l}</div>
            <div className={clsx("text-[12px] font-semibold tabular-nums", i === 1 ? "text-coral" : "text-ink")}>{v}</div>
          </div>
        ))}
      </div>
      <p className={clsx("mt-3 text-center text-[11px] text-slate-500", show(k >= 4))}>{c.foot}</p>
    </div>
  );
}

function Decide() {
  const k = useSteps(5, 480);
  const d = STORY.decide;
  return (
    <div>
      <div className="space-y-1.5">
        {d.options.map((o, i) => {
          const on = i === d.pick && k >= 2;
          return (
            <div key={o} className={clsx("flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] motion-safe:transition-all motion-safe:duration-300", k >= 1 ? "opacity-100" : "opacity-0", on ? "border-indigo bg-indigo-soft/70 text-ink font-medium" : "border-slate-100 bg-white text-slate-600", k >= 2 && i !== d.pick && "opacity-50")}>
              <span className={clsx("h-4 w-4 shrink-0 rounded-full border grid place-items-center", on ? "border-indigo bg-indigo text-white" : "border-slate-300")}>{on && <Check size={9} strokeWidth={3} aria-hidden />}</span>{o}
            </div>
          );
        })}
      </div>
      <div className="mt-3 space-y-1.5">
        {d.kpis.map(([l, a, b], i) => {
          const done = k >= 3 + Math.min(i, 1);
          const v = done ? b : a, diff = b - a;
          return (
            <div key={l} className="flex items-center gap-2 text-[11px]">
              <span className="w-16 text-slate-500">{l}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className={clsx("h-full rounded-full motion-safe:transition-all motion-safe:duration-700 ease-out", diff >= 0 ? "bg-indigo" : "bg-coral")} style={{ width: `${v}%` }} /></div>
              <span className={clsx("w-7 text-right font-semibold tabular-nums motion-safe:transition-opacity", done ? "opacity-100" : "opacity-0", diff >= 0 ? "text-sob" : "text-coral")}>{diff > 0 ? "+" : ""}{diff}</span>
            </div>
          );
        })}
      </div>
      <p className={clsx("mt-2.5 text-center text-[11px] text-slate-500", show(k >= 5))}>{d.foot}</p>
    </div>
  );
}

function Aprende() {
  const k = useSteps(4, 560);
  const a = STORY.aprende;
  return (
    <div>
      <div className={clsx("rounded-xl bg-white border border-slate-100 p-3", show(k >= 1))}>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo"><Lightbulb size={11} aria-hidden /> {a.eyebrow}</div>
        <p className="mt-1.5 text-[12px] leading-snug text-ink">{a.note}</p>
        <div className="mt-1.5 text-[9.5px] text-slate-500">{a.source}</div>
      </div>
      <div className={clsx("mt-2 rounded-xl bg-white border border-slate-100 p-3", show(k >= 2))}>
        <div className="text-[11px] font-semibold text-ink">{a.ask}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {a.chips.map((o, i) => {
            const on = i === 0 && k >= 3;
            return <span key={o} className={clsx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] motion-safe:transition-all", on ? "border-mint bg-mint-soft text-sob font-semibold" : "border-slate-200 text-slate-500")}>{on && <Check size={10} strokeWidth={3} aria-hidden />}{o}</span>;
          })}
        </div>
      </div>
      <div className={clsx("mt-3 flex items-center justify-center gap-2", show(k >= 4))}>
        <span className="chip bg-indigo text-white !text-[11px]">{a.xp}</span><span className="text-[11px] text-slate-500">{a.xpNote}</span>
      </div>
    </div>
  );
}

function Sube() {
  const k = useSteps(6, 380);
  const s = STORY.sube;
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const pct = k >= 5 ? 92 : 64;
  return (
    <div>
      <div className="rounded-xl bg-[#1E1A5E] text-white px-3 py-2.5 flex items-center gap-3">
        <div className="flex-1"><div className="text-[15px] font-semibold tabular-nums leading-none">{k >= 1 ? 12 : 11}</div><div className="text-[9.5px] text-white/60 mt-0.5">{s.streak}</div></div>
        <div className="flex gap-1">
          {days.map((d, i) => {
            const on = i < Math.min(k, 5);
            return <span key={i} className={clsx("h-5 w-5 rounded-full grid place-items-center text-[8px] font-semibold motion-safe:transition-all", on ? "bg-mint text-white" : "bg-white/10 text-white/40")} style={{ transitionDelay: `${i * 60}ms` }}>{on ? <Check size={9} strokeWidth={3} aria-hidden /> : d}</span>;
          })}
        </div>
      </div>
      <div className="mt-2.5 rounded-xl bg-white border border-slate-100 p-3">
        <div className="flex items-center justify-between text-[11px]"><span className="font-semibold text-ink">{s.stage}</span><span className="text-slate-500 tabular-nums">{pct}% · {s.next}</span></div>
        <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-indigo motion-safe:transition-all motion-safe:duration-1000 ease-out" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className={clsx("mt-2.5 flex items-center gap-2.5 rounded-xl bg-indigo-soft px-3 py-2", show(k >= 6))}>
        <span className="h-7 w-7 shrink-0 rounded-lg bg-indigo text-white grid place-items-center"><Award size={14} aria-hidden /></span>
        <div className="text-[11px] text-indigo"><strong>{s.appoint}.</strong> {s.appointNote}</div>
      </div>
    </div>
  );
}

const VIEW = { caso: Caso, decide: Decide, aprende: Aprende, sube: Sube } as const;

export function Story() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [calm, setCalm] = useState(false);
  const [cycle, setCycle] = useState(0);
  useEffect(() => { setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  useEffect(() => {
    if (paused || calm) return;
    const t = setTimeout(() => { setI((x) => (x + 1) % STORY.scenes.length); setCycle((c) => c + 1); }, MS);
    return () => clearTimeout(t);
  }, [i, paused, calm, cycle]);
  const sc = STORY.scenes[i];
  const pct = useCount(sc.pct);
  const View = VIEW[sc.key];
  const Icon = ICONS[sc.key];
  const go = (j: number) => { setI(j); setCycle((c) => c + 1); };

  return (
    <figure
      aria-label={STORY.label}
      className="rounded-3xl bg-white/95 text-ink p-5 sm:p-6 shadow-[0_24px_60px_-24px_rgba(10,10,40,0.55)]"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500">{STORY.ring}</div>
          <div className="text-4xl font-semibold text-indigo mt-0.5 tabular-nums">{pct}%</div>
        </div>
        <div className="mt-1 h-14 w-14 shrink-0" aria-hidden>
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EEF0FA" strokeWidth="4" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#4F3FE0" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 97.4} 97.4`} />
          </svg>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-canvas border border-slate-100 p-4">
        <div key={`t-${cycle}`} className="academy-in mb-3 flex items-center gap-2 text-[12.5px] font-semibold text-ink">
          <Icon size={14} className="text-indigo" aria-hidden /> {sc.title}
        </div>
        <div key={`v-${cycle}`} className="academy-in min-h-[212px]" aria-hidden><View /></div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2" role="tablist" aria-label="Escenas">
        {STORY.scenes.map((s, j) => (
          <button key={s.key} type="button" role="tab" aria-selected={j === i} onClick={() => go(j)} className="group text-left rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo" aria-label={s.title}>
            <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                key={j === i ? `p-${cycle}` : `p-${j}`}
                className={clsx("h-full rounded-full bg-indigo", j < i && "w-full", j > i && "w-0", j === i && (calm ? "w-full" : "hero-progress"))}
                style={j === i && !calm ? { animationDuration: `${MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
              />
            </div>
            <div className={clsx("mt-1.5 text-[10.5px] font-medium", j === i ? "text-indigo" : "text-slate-500 group-hover:text-slate-700")}>{s.tab}</div>
          </button>
        ))}
      </div>
    </figure>
  );
}
