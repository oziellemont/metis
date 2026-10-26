"use client";
/**
 * Proyecto de cambio: N semanas para que la organización adopte un cambio, moviendo a cada persona
 * con las palancas de cambio de De CERO a CEO (Parte IX). Tus decisiones previas ya pesan: la disposición
 * inicial de cada persona depende de cómo está tu relación con ella.
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Check, Ear, Flag, Lightbulb, Lock, Megaphone, MessagesSquare, Award, FlaskConical, GraduationCap, Hourglass, LineChart, Coins, Users2, Footprints, ShieldCheck, Sparkles } from "lucide-react";
import { ADOPT, GOAL, LEVERS, PHASES, canUse, changeEffect, leverById, phaseOf, startValue, weeksFor, type ChangeSim } from "@/lib/ceo/change";
import { firstName, personOf } from "@/lib/ceo/cast";
import { scaled } from "@/lib/ceo/engine";
import { moodOf } from "@/lib/ceo/relations";
import type { CastId, KpiKey, LeverId } from "@/lib/ceo/types";
import { useCeo } from "./CeoProvider";
import { Avatar } from "./ui";

const ICON: Record<LeverId, typeof Ear> = {
  entrevista: Ear, ejemplo: Footprints, townhall: Megaphone, capacitacion: GraduationCap, piloto: FlaskConical,
  avance: LineChart, coalicion: Users2, reconocer: Award, incentivos: Coins,
};

export function ChangeView() {
  const c = useCeo();
  const def = c.pack.change;
  const sim = c.change;

  if (!c.changeOpen) {
    return (
      <div className="max-w-2xl mx-auto card p-8 text-center">
        <span className="mx-auto h-14 w-14 rounded-2xl bg-indigo-soft text-indigo grid place-items-center"><Lock size={24} /></span>
        <h1 className="mt-4 text-xl font-semibold text-ink">Tu proyecto de cambio se abre el día {def.opensDay}</h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">Antes, conoce a tu gente. Cada decisión que tomes estos días mueve tu relación con las personas, y con esa relación vas a arrancar el proyecto.</p>
        <Link href="/ceo/empresa" className="btn-primary mt-6 inline-flex">Ver el mapa de {c.pack.short} <ArrowRight size={16} /></Link>
      </div>
    );
  }
  if (!sim) return <Intro />;
  return <Board sim={sim} />;
}

// ───────────────────────────── portada
function Intro() {
  const c = useCeo();
  const def = c.pack.change;
  const weeks = weeksFor(c.s.tier);
  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-8 text-white">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Proyecto de cambio · {c.pack.name}</div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight">{def.title}</h1>
        <p className="mt-3 text-white/80 leading-relaxed">{def.what}</p>
        <p className="mt-3 text-sm text-white/60 leading-relaxed">{def.why}</p>
        <div className="mt-5 grid grid-cols-3 gap-3 max-w-lg">
          <Stat k="Semanas" v={String(weeks)} />
          <Stat k="Personas clave" v={String(def.stakeholders.length)} />
          <Stat k="Meta" v={`${Math.round(GOAL * 100)}% adopta`} />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Cómo funciona</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
          <li className="rounded-2xl bg-canvas p-4"><b className="text-ink block">1. Conoce a cada quien</b>Cada persona pasa por cuatro fases: resiste, escucha, prueba y adopta. Una entrevista te revela qué le mueve.</li>
          <li className="rounded-2xl bg-canvas p-4"><b className="text-ink block">2. Usa las palancas</b>Cada palanca cuesta semanas. Usada en el momento justo, mueve a la gente; a destiempo, te cuesta credibilidad.</li>
          <li className="rounded-2xl bg-canvas p-4"><b className="text-ink block">3. Aprovecha la red</b>La gente se mueve por la gente: los aliados arrastran, los rivales frenan y los formadores de opinión pesan doble.</li>
        </ol>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Así arrancas con cada persona</h2>
        <p className="mt-1 text-sm text-slate-500">Tus decisiones de estos días ya cuentan: quien confía en ti arranca más cerca del cambio.</p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {def.stakeholders.map((st) => {
            const rel = c.relations[st.id] ?? 50;
            const v = startValue(st, rel);
            const mood = moodOf(rel);
            return (
              <div key={st.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                <Avatar id={st.id} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink truncate">{personOf(c.pack, st.id).name}</div>
                  <div className="text-xs text-slate-500">Relación contigo: <b className={clsx(mood.tone === "aliado" || mood.tone === "bien" ? "text-indigo" : mood.tone === "roto" || mood.tone === "frio" ? "text-coral" : "text-ink")}>{mood.label}</b></div>
                </div>
                <span className="chip bg-slate-100 text-slate-600 text-[11px]">{phaseOf(v)}</span>
              </div>
            );
          })}
        </div>
        <button onClick={c.startChange} className="btn-primary mt-5 w-full sm:w-auto">Arrancar el proyecto <ArrowRight size={16} /></button>
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return <div className="rounded-2xl bg-white/10 px-3 py-2.5"><div className="text-[11px] text-white/60">{k}</div><div className="text-lg font-semibold tabular-nums">{v}</div></div>;
}

// ───────────────────────────── tablero
function Board({ sim }: { sim: ChangeSim }) {
  const c = useCeo();
  const def = c.pack.change;
  const [lever, setLever] = useState<LeverId | null>(null);
  const [targets, setTargets] = useState<CastId[]>([]);
  const [focus, setFocus] = useState<CastId | null>(null);
  const lv = lever ? leverById(lever) : null;
  const last = sim.log[sim.log.length - 1];
  const people = def.stakeholders;
  const sorted = useMemo(() => [...people].sort((a, b) => sim.values[b.id] - sim.values[a.id]), [people, sim.values]);
  const closed = !!c.s.change?.closedAt;
  const finished = sim.done;

  const toggle = (id: CastId) => {
    if (!lv || lv.targets === 0) { setFocus((f) => (f === id ? null : id)); return; }
    setTargets((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length >= lv.targets ? [...t.slice(1), id] : [...t, id]));
  };
  const play = () => {
    if (!lever) return;
    c.playLever(lever, lv?.targets ? targets : []);
    setLever(null); setTargets([]);
  };
  const ok = lever ? canUse(sim, lever, lv?.targets ? targets : []) : false;

  return (
    <div className="space-y-5">
      {/* progreso */}
      <section className="rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-5 sm:p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Proyecto de cambio · fase «{sim.orgPhase}»</div>
            <h1 className="mt-1 text-xl sm:text-2xl font-semibold leading-tight">{def.title}</h1>
          </div>
          {!finished && <button onClick={() => window.confirm("¿Presentar el resultado al consejo? Ya no podrás usar más palancas.") && c.closeChange()} className="chip bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 text-xs gap-1"><Flag size={12} /> Presentar al consejo</button>}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Meter label="Semanas" value={`${sim.weeksUsed}/${sim.weeksTotal}`} pct={sim.weeksUsed / sim.weeksTotal} icon={<Hourglass size={13} />} />
          <Meter label="Adoptaron" value={`${sim.adopted}/${sim.total}`} pct={sim.share} goal={GOAL} icon={<Check size={13} />} />
          <Meter label="Credibilidad" value={String(sim.credibility)} pct={sim.credibility / 100} icon={<ShieldCheck size={13} />} />
        </div>
      </section>

      {finished && <Result sim={sim} closed={closed} />}

      {last && !finished && (
        <div className="card p-4 flex gap-3 items-start academy-in" key={sim.log.length}>
          <span className="h-9 w-9 rounded-xl bg-indigo-soft text-indigo grid place-items-center shrink-0">{(() => { const I = ICON[last.move.lever]; return <I size={17} />; })()}</span>
          <div className="text-sm min-w-0">
            <b className="text-ink">{last.text}{last.move.targets.length ? ` con ${last.move.targets.map((t) => firstName(c.pack, t)).join(", ")}` : ""}</b>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {Object.entries(last.gains).filter(([, g]) => Math.round(g)).sort((a, b) => b[1] - a[1]).map(([id, g]) => (
                <span key={id} className={clsx("chip text-[11px]", g > 0 ? "bg-indigo-soft text-indigo" : "bg-coral-soft text-coral")}>{firstName(c.pack, id)} {g > 0 ? "+" : ""}{Math.round(g)}</span>
              ))}
              {last.cred !== 0 && <span className={clsx("chip text-[11px]", last.cred > 0 ? "bg-ink text-white" : "bg-coral-soft text-coral")}>Credibilidad {last.cred > 0 ? "+" : ""}{last.cred}</span>}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        {/* personas */}
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-ink">{lv && lv.targets > 0 ? `Elige ${lv.targets === 1 ? "a una persona" : `hasta ${lv.targets} personas`}` : "Tu gente"}</h2>
            <span className="text-[11px] text-slate-400">Adopta en {ADOPT}</span>
          </div>
          <div className="mt-2 flex gap-3 text-[10px] text-slate-400">{PHASES.map((p) => <span key={p.name}>{p.name} {p.min}+</span>)}</div>
          <ul className="mt-3 space-y-1.5">
            {sorted.map((st) => {
              const v = sim.values[st.id];
              const sel = targets.includes(st.id);
              const known = sim.interviewed.has(st.id);
              return (
                <li key={st.id}>
                  <button onClick={() => toggle(st.id)} disabled={finished} className={clsx("w-full text-left rounded-2xl border-2 p-2.5 sm:p-3 flex items-center gap-3 transition-all", sel ? "border-indigo bg-indigo-soft/50" : focus === st.id ? "border-indigo/30 bg-slate-50" : "border-transparent hover:bg-slate-50")}>
                    <span className="relative"><Avatar id={st.id} size={34} />{st.leader && <span title="Formador de opinión" className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-white grid place-items-center"><Sparkles size={10} className="text-indigo" /></span>}</span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-ink truncate">{firstName(c.pack, st.id)} <span className="font-normal text-slate-400 text-xs">· {personOf(c.pack, st.id).role.split("·")[0].trim()}</span></span><span className={clsx("text-[11px] font-semibold shrink-0", v >= ADOPT ? "text-indigo" : "text-slate-500")}>{phaseOf(v)}</span></span>
                      <span className="mt-1.5 relative block h-1.5 rounded-full bg-indigo-soft/70">
                        <span className={clsx("absolute inset-y-0 left-0 rounded-full transition-all duration-700", v >= ADOPT ? "bg-gradient-to-r from-indigo-light to-indigo" : "bg-indigo/45")} style={{ width: `${v}%` }} />
                        <span className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-ink/60 rounded-full" style={{ left: `${ADOPT}%` }} />
                      </span>
                    </span>
                    {sel && <Check size={16} className="text-indigo shrink-0" />}
                  </button>
                  {focus === st.id && !lv && (
                    <div className="mx-2 mt-1 mb-2 rounded-xl bg-canvas px-3.5 py-2.5 text-xs text-slate-600 academy-in">
                      {known ? (
                        <>
                          <p className="text-ink italic">{st.secret}</p>
                          <p className="mt-2"><b className="text-indigo">Le mueve:</b> {st.likes.map((l) => leverById(l).name).join(", ")}{st.dislikes?.length ? <> · <b className="text-coral">Le cae mal:</b> {st.dislikes.map((l) => leverById(l).name).join(", ")}</> : null}</p>
                        </>
                      ) : <p>Todavía no sabes qué le mueve. Una <b>entrevista privada</b> (1 semana) te lo revela.</p>}
                      <p className="mt-1.5 text-slate-400">{personOf(c.pack, st.id).cares}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {!lv && <p className="mt-3 text-[11px] text-slate-400">Toca a alguien para ver lo que sabes de esa persona.</p>}
        </section>

        {/* palancas */}
        {!finished && (
          <section className="card p-5 sm:p-6 lg:self-start lg:sticky lg:top-6">
            <h2 className="font-semibold text-ink">Palancas de cambio</h2>
            <p className="mt-1 text-xs text-slate-500">De CERO a CEO · Parte IX. Te quedan <b className="text-ink">{sim.weeksLeft} semanas</b>.</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {LEVERS.map((l) => {
                const I = ICON[l.id];
                const can = l.weeks <= sim.weeksLeft;
                return (
                  <button key={l.id} disabled={!can} onClick={() => { setLever((x) => (x === l.id ? null : l.id)); setTargets([]); setFocus(null); }} className={clsx("text-left rounded-2xl border-2 p-3 flex gap-3 transition-all", lever === l.id ? "border-indigo bg-indigo-soft/50" : "border-slate-100 hover:border-indigo/30", !can && "opacity-40")}>
                    <span className={clsx("h-8 w-8 rounded-xl grid place-items-center shrink-0", lever === l.id ? "bg-indigo text-white" : "bg-indigo-soft text-indigo")}><I size={16} /></span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-ink">{l.name}</span><span className="text-[11px] text-slate-400 shrink-0 tabular-nums">{l.weeks} sem · {l.targets === 0 ? "todos" : l.targets === 1 ? "1 persona" : `hasta ${l.targets}`}</span></span>
                      <span className="block text-xs text-slate-500 mt-0.5">{l.short}</span>
                      {lever === l.id && <span className="block text-xs text-indigo mt-1.5"><Lightbulb size={11} className="inline -mt-0.5" /> {l.when}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            {lv && (
              <div className="mt-4 rounded-2xl bg-canvas p-3.5 academy-in">
                <p className="text-xs text-slate-500"><b className="text-ink">«{lv.nota}»</b></p>
                {lv.targets > 0 && <p className="mt-2 text-xs text-slate-500">{targets.length ? `Con: ${targets.map((t) => firstName(c.pack, t)).join(", ")}` : "Elige a quién en la lista."}</p>}
                <button onClick={play} disabled={!ok} className="btn-primary mt-3 w-full disabled:opacity-40">Usar · {lv.weeks} {lv.weeks === 1 ? "semana" : "semanas"}</button>
              </div>
            )}
          </section>
        )}
      </div>

      {sim.log.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold text-ink">Tu bitácora del cambio</h2>
          <ol className="mt-3 space-y-1.5 text-sm">
            {sim.log.map((l, i) => {
              const before = sim.log.slice(0, i).reduce((a, x) => a + leverById(x.move.lever).weeks, 0);
              return <li key={i} className="flex gap-3 text-slate-600"><span className="text-[11px] text-slate-400 tabular-nums w-16 shrink-0 pt-0.5">Sem {before + 1}–{before + leverById(l.move.lever).weeks}</span><span><b className="text-ink">{l.text}</b>{l.move.targets.length ? ` · ${l.move.targets.map((t) => firstName(c.pack, t)).join(", ")}` : ""}</span></li>;
            })}
          </ol>
        </section>
      )}
    </div>
  );
}

function Meter({ label, value, pct, goal, icon }: { label: string; value: string; pct: number; goal?: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <div className="flex items-center gap-1 text-[11px] text-white/60">{icon} {label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
      <div className="mt-1.5 relative h-1.5 rounded-full bg-white/15">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-light to-white transition-all duration-700" style={{ width: `${Math.min(100, pct * 100)}%` }} />
        {goal !== undefined && <span className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-white rounded-full" style={{ left: `${goal * 100}%` }} />}
      </div>
    </div>
  );
}

function Result({ sim, closed }: { sim: ChangeSim; closed: boolean }) {
  const c = useCeo();
  const eff = scaled(changeEffect(sim), c.s.tier);
  return (
    <section className={clsx("card p-5 sm:p-6 academy-in", sim.ok ? "border-indigo/30" : "border-coral/20")}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{closed ? "Presentaste al consejo" : "Se acabó el tiempo"}</div>
      <h2 className="mt-1 text-lg font-semibold text-ink">{sim.ok ? `Lo lograste: ${sim.adopted} de ${sim.total} ya trabajan así.` : `No alcanzó: ${sim.adopted} de ${sim.total} adoptaron (meta: ${Math.ceil(GOAL * sim.total)}).`}</h2>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{sim.ok ? "El cambio ya tiene masa crítica y se sostiene sin que tú lo empujes. Esa es la diferencia entre anunciar un cambio y lograrlo." : "Un cambio que no llega a masa crítica regresa a lo de antes en cuanto dejas de empujarlo. Revisa tu bitácora: ¿escuchaste antes de mover?, ¿usaste a los formadores de opinión?"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(eff) as KpiKey[]).filter((k) => eff[k]).map((k) => <span key={k} className={clsx("chip px-3 py-1 text-sm gap-1.5", (eff[k] ?? 0) > 0 ? "bg-indigo-soft text-indigo" : "bg-coral-soft text-coral")}>{c.pack.kpiLabel[k]} <b className="tabular-nums">{(eff[k] ?? 0) > 0 ? "+" : ""}{eff[k]}</b></span>)}
      </div>
      <div className="mt-4 flex gap-2.5 rounded-xl bg-canvas px-4 py-3"><MessagesSquare size={16} className="text-indigo shrink-0 mt-0.5" /><p className="text-sm text-ink"><b>Nota CEO:</b> Una transformación que solo defiende el CEO todavía no es una transformación; es una intención con dueño único.<span className="block text-[11px] text-slate-400 mt-1">De CERO a CEO · Oziel Leal Montemayor</span></p></div>
    </section>
  );
}
