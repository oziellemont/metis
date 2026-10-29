"use client";
/**
 * Boardroom Crisis: sesión extraordinaria del consejo, con reloj en cada decisión.
 * La lógica vive en lib/ceo/crisis.ts; aquí solo se presenta y se guarda el resultado.
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowDown, ArrowRight, ArrowUp, Check, Clock, Lock, Timer } from "lucide-react";
import {
  CONTAINED_BOARD, CONTAINED_MIN, CRISIS_DAY, OVERRUN_BELOW, RATING_TEXT, STEPS, STEP_SECONDS, TIMEOUT,
  chainsAt, crisisAccess, crisisOfRun, fillNames, optionOf, playCrisis, shockOf, type CrisisPicks,
} from "@/lib/ceo/crisis";
import { KPI_KEYS, crisisPoints, rulesVersionOf } from "@/lib/ceo/engine";
import { personOf } from "@/lib/ceo/cast";
import { celebrate } from "@/lib/ceo/celebrate";
import type { Kpis } from "@/lib/ceo/types";
import { useCeo } from "./CeoProvider";
import { Avatar } from "./ui";

export function CrisisView() {
  const c = useCeo();
  const [playing, setPlaying] = useState(false);
  if (!c.ready) return null;
  if (playing) return <Session />;
  const access = crisisAccess(c.s, c.now);
  if (!access.open) return <Closed reason={access.reason} />;
  return <Intro onStart={() => setPlaying(true)} />;
}

function useNames() {
  const c = useCeo();
  const chair = personOf(c.pack, c.pack.roles.chair), board = personOf(c.pack, c.pack.roles.board);
  return { chair, board, names: { chair: chair.name, board: board.name } };
}

// ───────────────────────────────────────────── cerrada
function Closed({ reason }: { reason: "early" | "done" | "closed" }) {
  const c = useCeo();
  const run = crisisOfRun(c.s);
  const title = { early: "El consejo no ha convocado", done: run ? RATING_TEXT[run.rating].title : "Crisis atendida", closed: "La temporada ya cerró" }[reason];
  const text = {
    early: `La sesión extraordinaria se convoca a partir del día ${CRISIS_DAY} de la temporada. Mientras, sigue dirigiendo ${c.pack.name}.`,
    done: run ? `${RATING_TEXT[run.rating].text} Ganaste ${crisisPoints(run.rating, run.rulesVersion)} XP. Cada empresa trae su propia crisis.` : "",
    closed: "La crisis de esta empresa ya no se puede atender. La siguiente empresa trae la suya.",
  }[reason];
  return (
    <div className="max-w-2xl mx-auto">
      <section className="card p-8 text-center">
        <span className="mx-auto h-14 w-14 rounded-2xl bg-indigo-soft text-indigo grid place-items-center">{reason === "done" ? <Check size={24} /> : reason === "early" ? <Clock size={24} /> : <Lock size={24} />}</span>
        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-indigo">Boardroom Crisis</div>
        <h1 className="mt-1 text-xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{text}</p>
        <Link href="/ceo" className="btn-primary mt-6 inline-flex">Volver a Hoy <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}

// ───────────────────────────────────────────── portada
function Intro({ onStart }: { onStart: () => void }) {
  const c = useCeo();
  const { chair, board } = useNames();
  const shock = shockOf(c.s.tier);
  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2A1220] via-[#3A1630] to-[#1E1A5E] p-6 sm:p-8 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-coral/25 blur-3xl" />
        <div className="relative">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Sesión extraordinaria · {c.pack.name}</div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight">Boardroom Crisis</h1>
          <p className="mt-3 text-white/80 leading-relaxed max-w-2xl">Tu segundo cliente más grande entró en concurso mercantil y te debe seis semanas de ventas. El consejo te cita hoy. Son tres decisiones seguidas y cada una tiene reloj: si se acaba el tiempo, el consejo decide por ti.</p>
          <div className="mt-5 grid grid-cols-3 gap-3 max-w-lg">
            <Stat k="Decisiones" v={String(STEPS.length)} />
            <Stat k="Por decisión" v={`${STEP_SECONDS} s`} />
            <Stat k="Golpe a caja" v={String(shock.caja)} />
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Cómo llegas</h2>
        <p className="mt-1 text-sm text-slate-500">La crisis parte de tus indicadores de hoy. Llegar con la caja o el consejo débiles la hace más difícil.</p>
        <div className="mt-4"><KpiBoard k={c.kpis} /></div>
        <p className="mt-4 text-sm text-slate-500">Para contenerla, cierra con todos los indicadores en {CONTAINED_MIN} o más y el consejo en {CONTAINED_BOARD} o más. Esta sesión no mueve los indicadores de tu temporada: solo cuenta para tu experiencia.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {[chair, board].map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-2xl bg-canvas px-3 py-2">
              <Avatar id={p.id} size={32} />
              <div className="min-w-0"><div className="text-sm font-semibold text-ink">{p.name}</div><div className="text-[11px] text-slate-500">{p.role}</div></div>
            </div>
          ))}
        </div>
        <button onClick={onStart} className="btn-primary mt-5 w-full sm:w-auto">Entrar a la sesión <ArrowRight size={16} /></button>
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return <div className="rounded-2xl bg-white/10 px-3 py-2.5"><div className="text-[11px] text-white/60">{k}</div><div className="text-lg font-semibold tabular-nums">{v}</div></div>;
}

// ───────────────────────────────────────────── sesión
function Session() {
  const c = useCeo();
  const { chair, board, names } = useNames();
  const [base] = useState<Kpis>(() => ({ ...c.kpis }));
  const [from] = useState(() => c.now);
  const tier = c.s.tier;
  const [picks, setPicks] = useState<CrisisPicks>({});
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(STEP_SECONDS);
  const [saved, setSaved] = useState(false);
  const headRef = useRef<HTMLHeadingElement>(null);
  const reactRef = useRef<HTMLParagraphElement>(null);

  const done = i >= STEPS.length;
  const step = done ? null : STEPS[i];
  const picked = step ? optionOf(step, picks[step.id]) : undefined;
  const result = useMemo(() => playCrisis(base, tier, picks), [base, tier, picks]);
  const before = useMemo(() => (step ? playCrisis(base, tier, Object.fromEntries(STEPS.slice(0, i).map((s) => [s.id, picks[s.id]]))) : result), [base, tier, picks, i, step, result]);
  const chains = step ? chainsAt(step.id, picks) : [];

  useEffect(() => { window.scrollTo({ top: 0 }); headRef.current?.focus({ preventScroll: true }); setLeft(STEP_SECONDS); }, [i]);
  useEffect(() => { if (picked) reactRef.current?.focus({ preventScroll: true }); reactRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [picked]);
  // Reloj de la decisión: se detiene al elegir; al llegar a 0 decide el consejo.
  useEffect(() => {
    if (!step || picked) return;
    if (left <= 0) { setPicks((p) => ({ ...p, [step.id]: TIMEOUT })); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left, step, picked]);
  useEffect(() => {
    if (!done || saved || !result.complete) return;
    setSaved(true);
    c.recordCrisis({ rating: result.rating, picks, from });
    if (result.rating === "contenida") celebrate("company");
  }, [done, saved, result, picks, c, from]);

  if (done) return <Result base={base} picks={picks} />;
  const who = step!.speaker === "chair" ? chair : board;
  const urgent = left <= 15;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span className="truncate">Boardroom Crisis · {c.pack.name}</span>
        <span className="tabular-nums shrink-0">Decisión {i + 1} de {STEPS.length}</span>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {STEPS.map((s, k) => <div key={s.id} className={clsx("h-1.5 flex-1 rounded-full", k < i ? "bg-coral" : k === i ? "bg-coral/50" : "bg-slate-100")} />)}
      </div>

      <section className="card p-4 sm:p-5">
        <KpiBoard k={picked ? result.kpis : before.kpis} prev={picked ? before.kpis : undefined} compact />
      </section>

      <section className="card p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <h1 ref={headRef} tabIndex={-1} className="text-xl font-semibold text-ink outline-none">{step!.title}</h1>
          {!picked && (
            <span role="timer" aria-label={`Quedan ${left} segundos`} className={clsx("chip shrink-0 tabular-nums", urgent ? "bg-coral/10 text-coral" : "bg-slate-100 text-slate-600")}>
              <Timer size={13} /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
            </span>
          )}
        </div>
        {chains.map((ch) => (
          <p key={ch.text} className="mt-4 rounded-2xl border-l-4 border-coral/40 bg-coral/5 px-4 py-3 text-sm text-ink">{fillNames(ch.text, names)}</p>
        ))}
        <div className="mt-5 flex gap-3">
          <Avatar id={who.id} size={40} />
          <div className="min-w-0">
            <div className="text-xs text-slate-500">{who.name} · {who.role}</div>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">{fillNames(step!.prompt, names)}</p>
          </div>
        </div>

        <fieldset className="mt-6" disabled={!!picked}>
          <legend className="text-sm font-semibold text-ink">¿Qué haces?</legend>
          <div className="mt-3 space-y-2.5">
            {step!.options.map((o) => {
              const on = picked?.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicks((p) => ({ ...p, [step!.id]: o.id }))}
                  className={clsx("w-full text-left rounded-2xl border p-4 text-sm leading-relaxed transition-colors",
                    on ? "border-indigo bg-indigo-soft/50 text-ink" : picked ? "border-slate-100 text-slate-400" : "border-slate-200 text-ink hover:border-indigo/50 hover:bg-indigo-soft/20")}
                >{o.label}</button>
              );
            })}
          </div>
        </fieldset>

        <div aria-live="polite">
          {picked && (
            <div className="mt-5 space-y-3 academy-in">
              {picked.id === TIMEOUT && <div className="text-xs font-semibold uppercase tracking-wider text-coral">Se acabó el tiempo</div>}
              <p ref={reactRef} tabIndex={-1} className="rounded-2xl bg-canvas p-4 text-sm text-ink outline-none">{fillNames(picked.reaction, names)}</p>
              <p className="text-sm text-slate-600"><b className="text-ink">Nota CEO.</b> {step!.nota}</p>
              <button onClick={() => setI((n) => n + 1)} className="btn-primary">{i + 1 < STEPS.length ? "Siguiente decisión" : "Cerrar la sesión"} <ArrowRight size={16} /></button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ───────────────────────────────────────────── resultado
function Result({ base, picks }: { base: Kpis; picks: CrisisPicks }) {
  const c = useCeo();
  const r = playCrisis(base, c.s.tier, picks);
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { window.scrollTo({ top: 0 }); headRef.current?.focus({ preventScroll: true }); }, []);
  const good = r.rating === "contenida";
  const t = RATING_TEXT[r.rating];
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <section className={clsx("rounded-3xl p-6 sm:p-8", good ? "bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white" : "card")}>
        <div className={clsx("text-[11px] font-semibold uppercase tracking-wider", good ? "text-white/60" : "text-coral")}>Cierre de la sesión</div>
        <h1 ref={headRef} tabIndex={-1} className={clsx("mt-2 text-2xl font-semibold leading-tight outline-none", good ? "text-white" : "text-ink")}>{t.title}</h1>
        <p className={clsx("mt-3 text-sm leading-relaxed max-w-2xl", good ? "text-white/80" : "text-slate-600")}>{t.text} {r.timeouts > 0 && `${r.timeouts === 1 ? "Una decisión se fue" : `${r.timeouts} decisiones se fueron`} por tiempo.`}</p>
        <div className={clsx("mt-5 rounded-2xl p-4", good ? "bg-white/10" : "bg-canvas")}>
          <KpiBoard k={r.kpis} prev={r.start} dark={good} />
          <p className={clsx("mt-3 text-[11px]", good ? "text-white/60" : "text-slate-500")}>Contenida: todos en {CONTAINED_MIN} o más y consejo en {CONTAINED_BOARD} o más. Debajo de {OVERRUN_BELOW}, la crisis te rebasa. La comparación es contra el día del golpe.</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/ceo" className={clsx("inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold", good ? "bg-white text-ink hover:bg-white/90" : "bg-indigo text-white hover:bg-indigo/90")}>Volver a Hoy <ArrowRight size={15} /></Link>
          <span className={clsx("chip", good ? "bg-white/10 text-white" : "bg-mint-soft text-sob")}>+{crisisPoints(r.rating, rulesVersionOf(c.s))} XP</span>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Lo que decidiste</h2>
        <ol className="mt-4 space-y-3">
          {STEPS.map((s, k) => {
            const o = optionOf(s, picks[s.id]);
            return (
              <li key={s.id} className="rounded-2xl border border-slate-100 p-4 text-sm">
                <div className="text-xs text-slate-500">Decisión {k + 1} · {s.title}</div>
                <div className={clsx("mt-1", o?.id === TIMEOUT ? "text-coral" : "text-ink")}>{o?.id === TIMEOUT ? "Se acabó el tiempo: decidió el consejo." : o?.label}</div>
                <div className="mt-2 text-slate-600"><b className="text-ink">Nota CEO.</b> {s.nota}</div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

// ───────────────────────────────────────────── tablero
function KpiBoard({ k, prev, compact, dark }: { k: Kpis; prev?: Kpis; compact?: boolean; dark?: boolean }) {
  const c = useCeo();
  return (
    <div className="grid gap-2 grid-cols-5 [&>*]:min-w-0">
      {KPI_KEYS.map((key) => {
        const v = k[key], d = prev ? v - prev[key] : 0;
        const low = v < CONTAINED_MIN || (key === "consejo" && v < CONTAINED_BOARD);
        return (
          <div key={key} className={clsx("rounded-xl", compact ? "px-1 py-1" : "px-2 py-2")}>
            <div className={clsx("text-[11px] truncate", dark ? "text-white/60" : "text-slate-500")}>{c.pack.kpiLabel[key]}</div>
            <div className={clsx("mt-0.5 flex items-baseline gap-1", compact ? "text-base" : "text-lg")}>
              <span className={clsx("font-semibold tabular-nums", low ? "text-coral" : dark ? "text-white" : "text-ink")}>{v}</span>
              {d !== 0 && (
                <span className={clsx("inline-flex items-center text-[11px] tabular-nums", d > 0 ? "text-mint" : "text-coral")} aria-label={`${d > 0 ? "sube" : "baja"} ${Math.abs(d)}`}>
                  {d > 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{Math.abs(d)}
                </span>
              )}
            </div>
            <div className={clsx("mt-1 h-1 rounded-full overflow-hidden", dark ? "bg-white/15" : "bg-slate-100")}>
              <div className={clsx("h-full rounded-full", low ? "bg-coral" : "bg-indigo")} style={{ width: `${v}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
