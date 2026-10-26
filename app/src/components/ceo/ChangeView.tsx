"use client";
/**
 * Reto final de cada nivel · proyecto de cambio: N semanas para que la organización adopte un cambio, moviendo a cada persona
 * con las palancas de cambio de De CERO a CEO (Parte IX). Tus decisiones previas ya pesan: la disposición
 * inicial de cada persona depende de cómo está tu relación con ella.
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Check, Ear, Flag, Lightbulb, Lock, Megaphone, MessagesSquare, Award, FlaskConical, GraduationCap, Hourglass, LineChart, Coins, Users2, Footprints, ShieldCheck, Sparkles } from "lucide-react";
import { ADOPT, GOAL, LEVERS, canUse, changeEffect, leverById, startValue, weeksFor, type ChangeSim } from "@/lib/ceo/change";
import { firstName, personOf } from "@/lib/ceo/cast";
import { scaled } from "@/lib/ceo/engine";
import { moodOf } from "@/lib/ceo/relations";
import type { CastId, KpiKey, LeverId, Stakeholder } from "@/lib/ceo/types";
import { ChangeOrgChart } from "./ChangeOrgChart";
import { useCeo } from "./CeoProvider";
import { Avatar } from "./ui";

const ICON: Record<LeverId, typeof Ear> = {
  entrevista: Ear, ejemplo: Footprints, townhall: Megaphone, capacitacion: GraduationCap, piloto: FlaskConical,
  avance: LineChart, coalicion: Users2, reconocer: Award, incentivos: Coins,
};

export function ChangeView() {
  const c = useCeo();
  const sim = c.change;
  if (!c.changeOpen) return <Locked />;
  if (!sim) return <Intro />;
  return <Board sim={sim} />;
}

// ───────────────────────────── bloqueado: es el cierre del nivel
function Locked() {
  const c = useCeo();
  const def = c.pack.change;
  const pr = c.cases;
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <section className="card p-8 text-center">
        <span className="mx-auto h-14 w-14 rounded-2xl bg-indigo-soft text-indigo grid place-items-center"><Lock size={24} /></span>
        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-indigo">Reto final de {c.pack.short}</div>
        <h1 className="mt-1 text-xl font-semibold text-ink">{def.title}</h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">Se abre cuando cierres los asuntos de la temporada. Cada decisión que tomes mueve tu relación con tu gente, y con esa relación vas a arrancar el cambio.</p>
        <div className="mt-5 mx-auto max-w-xs">
          <div className="flex justify-between text-xs text-slate-500"><span>Asuntos cerrados</span><b className="text-ink tabular-nums">{pr.done}/{pr.total}</b></div>
          <div className="mt-1.5 h-2 rounded-full bg-indigo-soft"><div className="h-full rounded-full bg-indigo transition-all" style={{ width: `${(pr.done / Math.max(1, pr.total)) * 100}%` }} /></div>
        </div>
        <Link href="/ceo/empresa" className="btn-primary mt-6 inline-flex">Conoce a tu gente <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}

// ───────────────────────────── portada
function Intro() {
  const c = useCeo();
  const def = c.pack.change;
  const weeks = weeksFor(c.s.tier);
  const values = useMemo(() => Object.fromEntries(def.stakeholders.map((st) => [st.id, startValue(st, c.relations[st.id] ?? 50)])), [def, c.relations]);
  const [focus, setFocus] = useState<CastId | null>(null);
  const fp = focus ? def.stakeholders.find((x) => x.id === focus) : null;
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-8 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div className="relative">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Reto final · {c.pack.name}</div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight">{def.title}</h1>
          <p className="mt-3 text-white/80 leading-relaxed max-w-2xl">{def.what}</p>
          <p className="mt-2 text-sm text-white/60 leading-relaxed max-w-2xl">{def.why}</p>
          <div className="mt-5 grid grid-cols-3 gap-3 max-w-lg">
            <Stat k="Semanas" v={String(weeks)} />
            <Stat k="Personas clave" v={String(def.stakeholders.length)} />
            <Stat k="Meta" v={`${Math.ceil(GOAL * def.stakeholders.length)} adoptan`} />
          </div>
          <p className="mt-4 text-xs text-white/60">El consejo da su veredicto del nivel cuando presentes este cambio.</p>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-ink">Así arranca tu organización</h2>
          <PhaseLegend />
        </div>
        <p className="mt-1 text-sm text-slate-500">Lo que decidiste en la temporada ya cuenta: quien confía en ti arranca más cerca del cambio.</p>
        <div className="mt-5"><ChangeOrgChart pack={c.pack} people={def.stakeholders} values={values} focus={focus} onTap={(id) => setFocus((f) => (f === id ? null : id))} /></div>
        {fp && (
          <div className="mt-4 rounded-2xl bg-canvas p-4 text-sm academy-in flex gap-3">
            <Avatar id={fp.id} size={36} />
            <div className="min-w-0">
              <div className="font-semibold text-ink">{personOf(c.pack, fp.id).name}</div>
              <div className="text-xs text-slate-500">{personOf(c.pack, fp.id).role} · Relación contigo: <b className="text-ink">{moodOf(c.relations[fp.id] ?? 50).label}</b></div>
              <p className="mt-1.5 text-slate-600">{personOf(c.pack, fp.id).cares}</p>
            </div>
          </div>
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
          <div className="rounded-2xl bg-canvas p-4"><b className="text-ink block">1. Conoce a cada quien</b>Cada persona pasa por resiste, escucha, prueba y adopta. Una entrevista te revela qué le mueve.</div>
          <div className="rounded-2xl bg-canvas p-4"><b className="text-ink block">2. Usa las palancas</b>Cada palanca cuesta semanas. En el momento justo mueve a la gente; a destiempo, te cuesta credibilidad.</div>
          <div className="rounded-2xl bg-canvas p-4"><b className="text-ink block">3. Aprovecha la red</b>Lo que pasa con un jefe baja a su equipo. Los formadores de opinión <Sparkles size={11} className="inline text-indigo -mt-0.5" /> pesan doble.</div>
        </div>
        <button onClick={c.startChange} className="btn-primary mt-5 w-full sm:w-auto">Arrancar el cambio <ArrowRight size={16} /></button>
      </section>
    </div>
  );
}

function PhaseLegend() {
  return (
    <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
      <span className="rounded-full px-2 py-0.5 bg-coral-soft text-coral">Resiste 0+</span>
      <span className="rounded-full px-2 py-0.5 bg-slate-100 text-slate-600">Escucha 25+</span>
      <span className="rounded-full px-2 py-0.5 bg-indigo-soft text-indigo">Prueba 50+</span>
      <span className="rounded-full px-2 py-0.5 bg-indigo text-white">Adopta {ADOPT}+</span>
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
  const closed = !!c.s.change?.closedAt;
  const finished = sim.done;
  const fp = focus ? def.stakeholders.find((x) => x.id === focus) : null;

  const tap = (id: CastId) => {
    if (!lv || lv.targets === 0) { setFocus((f) => (f === id ? null : id)); return; }
    setTargets((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length >= lv.targets ? [...t.slice(1), id] : [...t, id]));
  };
  const pick = (id: LeverId) => { setLever((x) => (x === id ? null : id)); setTargets([]); setFocus(null); };
  const play = () => {
    if (!lever) return;
    c.playLever(lever, lv?.targets ? targets : []);
    setLever(null); setTargets([]);
  };
  const ok = lever ? canUse(sim, lever, lv?.targets ? targets : []) : false;

  return (
    <div className="space-y-5 pb-28 lg:pb-24">
      {/* progreso */}
      <section className="rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-5 sm:p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Reto final · fase «{sim.orgPhase}»</div>
            <h1 className="mt-1 text-xl sm:text-2xl font-semibold leading-tight">{def.title}</h1>
          </div>
          {!finished && <button onClick={() => window.confirm("¿Presentar el resultado al consejo? Ya no podrás usar más palancas y el consejo dará su veredicto del nivel.") && c.closeChange()} className="chip bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 text-xs gap-1"><Flag size={12} /> Presentar al consejo</button>}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Meter label="Semanas" value={`${sim.weeksLeft} restan`} pct={sim.weeksUsed / sim.weeksTotal} icon={<Hourglass size={13} />} />
          <Meter label="Adoptaron" value={`${sim.adopted}/${sim.total}`} pct={sim.share} goal={GOAL} icon={<Check size={13} />} />
          <Meter label="Credibilidad" value={String(sim.credibility)} pct={sim.credibility / 100} icon={<ShieldCheck size={13} />} />
        </div>
      </section>

      {finished && <Result sim={sim} closed={closed} />}

      {/* palancas */}
      {!finished && (
        <section className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold text-ink">1 · Elige una palanca</h2>
            <span className="text-[11px] text-slate-400">De CERO a CEO · Parte IX</span>
          </div>
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {LEVERS.map((l) => {
              const I = ICON[l.id];
              const can = l.weeks <= sim.weeksLeft;
              const on = lever === l.id;
              return (
                <button key={l.id} disabled={!can} onClick={() => pick(l.id)} title={l.short} className={clsx("rounded-2xl border-2 px-1.5 py-2.5 flex flex-col items-center gap-1.5 text-center transition-all", on ? "border-indigo bg-indigo text-white shadow-[0_8px_20px_-10px_rgba(79,63,224,.8)]" : "border-slate-100 hover:border-indigo/30 hover:-translate-y-0.5", !can && "opacity-35")}>
                  <span className={clsx("h-8 w-8 rounded-xl grid place-items-center", on ? "bg-white/20" : "bg-indigo-soft text-indigo")}><I size={16} /></span>
                  <span className={clsx("text-[11px] font-semibold leading-tight", on ? "text-white" : "text-ink")}>{l.name}</span>
                  <span className={clsx("text-[10px] tabular-nums", on ? "text-white/70" : "text-slate-400")}>{l.weeks} sem · {l.targets === 0 ? "todos" : l.targets === 1 ? "1" : `≤${l.targets}`}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* último movimiento */}
      {last && !finished && (
        <div className="card p-4 flex gap-3 items-start academy-in" key={sim.log.length}>
          <span className="h-9 w-9 rounded-xl bg-indigo-soft text-indigo grid place-items-center shrink-0">{(() => { const I = ICON[last.move.lever]; return <I size={17} />; })()}</span>
          <div className="text-sm min-w-0">
            <b className="text-ink">{last.text}{last.move.targets.length ? ` con ${last.move.targets.map((t) => firstName(c.pack, t)).join(", ")}` : ""}</b>
            {last.cred !== 0 && <span className={clsx("ml-2 chip text-[11px]", last.cred > 0 ? "bg-ink text-white" : "bg-coral-soft text-coral")}>Credibilidad {last.cred > 0 ? "+" : ""}{last.cred}</span>}
            <p className="text-xs text-slate-500 mt-0.5">Los números sobre cada tarjeta muestran cuánto se movió cada persona.</p>
          </div>
        </div>
      )}

      {/* organigrama */}
      <section className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-ink">{finished ? "Cómo quedó tu organización" : lv && lv.targets > 0 ? `2 · Elige ${lv.targets === 1 ? "a una persona" : `hasta ${lv.targets} personas`} en el organigrama` : lv ? "2 · Esta palanca llega a todos" : "Tu organización"}</h2>
          <PhaseLegend />
        </div>
        <div className="mt-5">
          <ChangeOrgChart pack={c.pack} people={def.stakeholders} values={sim.values} selected={targets} focus={focus} gains={!finished && last ? last.gains : undefined} gainKey={sim.log.length} onTap={tap} disabled={finished} />
        </div>
        {!lv && !finished && !fp && <p className="mt-3 text-center text-[11px] text-slate-400">Toca a una persona para ver qué sabes de ella y con quién se lleva.</p>}
        {fp && !lv && <PersonPanel st={fp} known={sim.interviewed.has(fp.id)} onClose={() => setFocus(null)} />}
      </section>

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

      {/* barra de acción */}
      {lv && !finished && (
        <div className="fixed inset-x-0 bottom-[72px] lg:bottom-4 z-30 px-3 lg:pl-64 academy-in">
          <div className="mx-auto max-w-3xl rounded-2xl bg-ink text-white shadow-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{lv.name} <span className="font-normal text-white/60">· {lv.weeks} {lv.weeks === 1 ? "semana" : "semanas"}</span></div>
              <div className="text-xs text-white/70 mt-0.5"><Lightbulb size={11} className="inline -mt-0.5 text-indigo-light" /> {lv.when}</div>
              <div className="text-[11px] text-white/50 mt-0.5 italic truncate">«{lv.nota}»</div>
              {lv.targets > 0 && <div className="text-xs mt-1 text-white/80">{targets.length ? <>Con: <b>{targets.map((t) => firstName(c.pack, t)).join(", ")}</b></> : "Toca a quién en el organigrama."}</div>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => { setLever(null); setTargets([]); }} className="rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10">Cancelar</button>
              <button onClick={play} disabled={!ok} className="rounded-xl bg-white text-ink px-4 py-2.5 text-sm font-semibold disabled:opacity-40">Usar palanca</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonPanel({ st, known, onClose }: { st: Stakeholder; known: boolean; onClose: () => void }) {
  const c = useCeo();
  const p = personOf(c.pack, st.id);
  const ties = c.pack.ties.filter((t) => t.a === st.id || t.b === st.id);
  return (
    <div className="mt-4 rounded-2xl bg-canvas p-4 text-sm academy-in">
      <div className="flex items-start gap-3">
        <Avatar id={st.id} size={38} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink">{p.name}{st.leader && <span className="ml-2 chip bg-indigo-soft text-indigo text-[10px] gap-1"><Sparkles size={10} /> Formador de opinión</span>}</div>
          <div className="text-xs text-slate-500">{p.role}{p.reportsTo && p.reportsTo !== "ceo" ? ` · reporta a ${firstName(c.pack, p.reportsTo)}` : p.reportsTo === "ceo" ? " · te reporta a ti" : ""}</div>
        </div>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-ink">Cerrar</button>
      </div>
      {known ? (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="text-ink italic">«{st.secret}»</p>
          <p className="mt-2 text-xs"><b className="text-indigo">Le mueve:</b> {st.likes.map((l) => leverById(l).name).join(", ")}{st.dislikes?.length ? <> · <b className="text-coral">Le cae mal:</b> {st.dislikes.map((l) => leverById(l).name).join(", ")}</> : null}</p>
        </div>
      ) : <p className="mt-3 text-xs text-slate-600">Todavía no sabes qué le mueve. Una <b>entrevista privada</b> (1 semana) te lo revela. Lo que se sabe: {p.cares}</p>}
      {ties.length > 0 && (
        <ul className="mt-3 space-y-1">
          {ties.map((t, i) => {
            const other = t.a === st.id ? t.b : t.a;
            return <li key={i} className="text-xs text-slate-600"><span className={clsx("font-semibold", t.kind === "tension" ? "text-coral" : t.kind === "alianza" ? "text-indigo" : "text-ink")}>{t.kind === "alianza" ? "Aliado de" : t.kind === "tension" ? "Tensión con" : t.a === st.id ? "Influye en" : "Lo influye"}</span> {firstName(c.pack, other)}: {t.note}</li>;
          })}
        </ul>
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
      {c.seasonDone && <Link href="/ceo/carrera" className="btn-primary mt-4 inline-flex">Ver el veredicto del consejo <ArrowRight size={16} /></Link>}
    </section>
  );
}
