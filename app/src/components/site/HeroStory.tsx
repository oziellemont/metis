"use client";
/**
 * Animación del hero de la página pública: cuenta en 4 escenas qué hace mêtis,
 * con el % de alineación de la empresa siempre visible arriba.
 * Minimalista (mismo estilo que las pantallas del tour de mêtis Academy).
 */
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Target, Users, Check, CalendarClock, Upload, BarChart3, GitBranch } from "lucide-react";

const SCENES = [
  { key: "cascada", label: "Estrategia", icon: GitBranch, title: "La estrategia baja a cada persona", align: 71 },
  { key: "dato", label: "Datos", icon: Upload, title: "Un dato, un dueño: se actualiza solo", align: 82 },
  { key: "ritmo", label: "Ritmo", icon: CalendarClock, title: "Cada semana, compromisos que se cumplen", align: 89 },
  { key: "foto", label: "Resultados", icon: BarChart3, title: "La foto completa, cada mes", align: 94 },
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
    const t0 = setTimeout(() => {
      let i = 0;
      const t = setInterval(() => { i++; setK(i); if (i >= n) clearInterval(t); }, every);
      cleanup = () => clearInterval(t);
    }, delay);
    let cleanup = () => {};
    return () => { clearTimeout(t0); cleanup(); };
  }, [n, every, delay]);
  return k;
}

function Cascada() {
  const k = useSteps(7, 380);
  const laes = [["Expansión de mercado", ["AG", "LR"]], ["Excelencia operativa", ["DP", "KM", "JS"]], ["Talento y cultura", ["RV"]]] as const;
  return (
    <div>
      <div className={clsx("mx-auto w-fit flex items-center gap-2 rounded-xl bg-indigo text-white px-3 py-2 text-[12px] font-semibold transition-all duration-500", k >= 1 ? "opacity-100" : "opacity-0 -translate-y-1")}>
        <Target size={13} /> MEGA · #1 del norte en 2032
      </div>
      <div className="relative mt-1 h-5">
        <div className={clsx("absolute left-1/2 top-0 w-px bg-indigo/30 transition-all duration-500", k >= 2 ? "h-2.5" : "h-0")} />
        <div className={clsx("absolute left-[16.6%] right-[16.6%] top-2.5 h-px bg-indigo/30 origin-center transition-transform duration-500", k >= 2 ? "scale-x-100" : "scale-x-0")} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {laes.map(([l, ppl], i) => (
          <div key={l} className={clsx("rounded-xl bg-white border border-slate-100 p-2 text-center transition-all duration-500", k >= 3 + i ? "opacity-100" : "opacity-0 translate-y-1")}>
            <div className="text-[10.5px] font-medium text-ink leading-tight min-h-[26px]">{l}</div>
            <div className="mt-1.5 flex justify-center -space-x-1.5">
              {ppl.map((p, j) => (
                <span key={p} className={clsx("h-5 w-5 rounded-full bg-indigo-soft text-indigo ring-2 ring-white grid place-items-center text-[8px] font-semibold transition-all duration-300", k >= 6 ? "opacity-100 scale-100" : "opacity-0 scale-50")} style={{ transitionDelay: `${j * 90}ms` }}>{p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className={clsx("mt-3 text-center text-[11px] text-slate-500 transition-opacity duration-500", k >= 7 ? "opacity-100" : "opacity-0")}>Cada quien sabe a qué contribuye su trabajo.</p>
    </div>
  );
}

function Dato() {
  const full = "96.1";
  const [q, setQ] = useState("");
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i++; setQ(full.slice(0, i)); if (i >= full.length) clearInterval(t); }, 230);
    return () => clearInterval(t);
  }, []);
  const done = q === full;
  const k = useSteps(4, 260, 1400);
  return (
    <div>
      <div className="rounded-xl bg-white border border-slate-100 p-3">
        <div className="flex items-center justify-between text-[11px]"><span className="font-semibold text-ink">OTIF · Región Norte</span><span className="chip bg-indigo-soft text-indigo !text-[10px]">Owner: Diego</span></div>
        <div className="mt-2 flex items-center gap-2">
          <div className={clsx("flex-1 rounded-lg border px-2.5 py-1.5 text-[12px] tabular-nums transition-colors", done ? "border-mint/50 bg-mint-soft/40" : "border-indigo/30 ring-2 ring-indigo/10")}>
            {q}<span className={clsx("inline-block w-px h-3 bg-indigo align-middle", done ? "opacity-0" : "animate-pulse")} />%
          </div>
          <span className="text-[10.5px] text-slate-400 whitespace-nowrap">Meta 95%</span>
        </div>
      </div>
      <div className="mt-3 text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">Se actualiza solo en</div>
      <div className="mt-1.5 space-y-1.5">
        {["Karla · Supervisora", "Jorge · Coordinador", "Mariana · Directora"].map((p, i) => (
          <div key={p} className="flex items-center gap-2 rounded-lg bg-white border border-slate-100 px-2.5 py-1.5 text-[11px]">
            <Users size={11} className="text-slate-400" /><span className="flex-1">{p} <span className="text-slate-400">· Contributor</span></span>
            <span className="tabular-nums text-slate-500 w-10 text-right">{k > i ? "96.1%" : "—"}</span>
            <span className={clsx("h-2 w-2 rounded-full transition-colors duration-500", k > i ? "bg-sat" : "bg-slate-200")} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Ritmo() {
  const k = useSteps(5, 520, 400);
  const items = ["Visitar 12 tiendas nuevas", "Cerrar ruta TMS en Saltillo", "Plan de merma con Planta MTY"];
  return (
    <div>
      <div className="flex items-center justify-between rounded-xl bg-[#1E1A5E] text-white px-3 py-2">
        <div><div className="text-[9px] font-semibold uppercase tracking-wider text-mint">Win the Week</div><div className="text-[12px] font-semibold">Semana 42 · Equipo comercial</div></div>
        <div className="text-right"><div className="text-[9px] text-white/60">Cumplimiento</div><div className="text-[14px] font-semibold tabular-nums">{Math.min(k, 3) === 3 ? "100%" : `${Math.round((Math.min(k, 3) / 3) * 100)}%`}</div></div>
      </div>
      <div className="mt-2 rounded-xl bg-white border border-slate-100 divide-y divide-slate-100">
        {items.map((t, i) => (
          <div key={t} className="flex items-center gap-2 px-3 py-2 text-[11px]">
            <span className={clsx("h-4 w-4 rounded-md border grid place-items-center transition-all duration-300", k > i ? "bg-mint border-mint text-white scale-100" : "border-slate-300 text-transparent")}><Check size={10} strokeWidth={3} /></span>
            <span className={clsx("flex-1 transition-colors", k > i ? "text-slate-400 line-through" : "text-ink")}>{t}</span>
          </div>
        ))}
      </div>
      <div className={clsx("mt-2.5 flex items-center gap-2 rounded-xl bg-indigo-soft px-3 py-2 text-[11px] text-indigo transition-all duration-500", k >= 4 ? "opacity-100" : "opacity-0 translate-y-1")}>
        <CalendarClock size={12} /> <span><strong>Revisión Vertical 1 a 1</strong> agendada · mar 10:30</span>
      </div>
    </div>
  );
}

function Foto() {
  const k = useSteps(1, 100, 200);
  const rows = [["Sobresaliente", 18, "bg-sob"], ["Satisfactorio", 41, "bg-sat"], ["Mínimo", 9, "bg-min"]] as const;
  const max = 41;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-slate-500"><span className="font-semibold text-ink">Cierre de septiembre</span><span>68 indicadores</span></div>
      <div className="mt-2.5 space-y-2">
        {rows.map(([l, n, c], i) => (
          <div key={l} className="flex items-center gap-2 text-[11px]">
            <span className="w-24 text-slate-500">{l}</span>
            <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className={clsx("h-full rounded-full transition-all duration-1000 ease-out", c)} style={{ width: k ? `${(n / max) * 100}%` : "0%", transitionDelay: `${i * 140}ms` }} />
            </div>
            <span className="w-6 text-right font-semibold tabular-nums text-ink">{n}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white border border-slate-100 p-2.5"><div className="text-[10px] text-slate-400">Scorecards aprobados</div><div className="text-[15px] font-semibold text-ink">312</div></div>
        <div className="rounded-xl bg-white border border-slate-100 p-2.5"><div className="text-[10px] text-slate-400">Datos a tiempo</div><div className="text-[15px] font-semibold text-sob">98%</div></div>
      </div>
    </div>
  );
}

const VIEW = { cascada: Cascada, dato: Dato, ritmo: Ritmo, foto: Foto } as const;

export function HeroStory() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => { setI((x) => (x + 1) % SCENES.length); setCycle((c) => c + 1); }, MS);
    return () => clearTimeout(t);
  }, [i, paused, cycle]);
  const sc = SCENES[i];
  const pct = useCount(sc.align);
  const View = VIEW[sc.key];
  const go = (j: number) => { setI(j); setCycle((c) => c + 1); };

  return (
    <div className="card !bg-white/95 text-ink p-5 shadow-2xl" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">Alineación de la organización</div>
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

