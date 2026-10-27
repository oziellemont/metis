"use client";
import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Award, Briefcase, Lock, Pencil, ShieldCheck } from "lucide-react";
import { badgesOf, profileOf } from "@/lib/ceo/engine";
import { STAGES } from "@/lib/ceo/journey";
import { countAtLeast } from "@/lib/ceo/mastery";
import { firstName } from "@/lib/ceo/cast";
import { useCeo } from "./CeoProvider";
import { Avatar, Flame, rel } from "./ui";
import { CompetencyBars, StageTrack } from "./Journey";
import { ProfileEditor } from "./ProfileFlow";
import { EXP_AREAS, GOALS, INDUSTRIES, ROLES, YEARS, diagnosticOffered, labelOf, profileAnswered } from "@/lib/ceo/profile";

export function Profile() {
  const c = useCeo();
  const p = profileOf(c.s, c.now);
  const badges = badgesOf(c.s, c.now);
  const history = c.entries.filter((e) => e.status === "decidido" || e.status === "vencido").sort((a, b) => (b.decision?.at ?? b.deadline) - (a.decision?.at ?? a.deadline));
  const j = c.journey;
  const [editing, setEditing] = useState(false);
  const pf = c.s.profile;
  const declared: [string, string | undefined][] = [
    ["Responsabilidad", labelOf(ROLES, pf?.role)],
    ["Áreas", pf?.areas?.map((a) => labelOf(EXP_AREAS, a)).join(", ")],
    ["Experiencia", pf?.years ? `${labelOf(YEARS, pf.years)} años` : undefined],
    ["Industria", labelOf(INDUSTRIES, pf?.industry)],
    ["Objetivo", labelOf(GOALS, pf?.goal)],
  ];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-8 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="text-xs text-white/60">{c.s.name} · {j.name}</div>
            <div className="mt-2 text-sm text-white/70">Tu estilo de dirección</div>
            <h1 className="text-3xl font-semibold">{p.archetype.name}</h1>
            <p className="mt-2 text-sm text-white/80 max-w-md">{p.archetype.text}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-white/10 px-3 py-1.5">{p.decisions} decisiones</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">{Object.keys(c.s.lessons).length} lecciones</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-5">
            <div className="text-xs text-white/60">Constancia · no define tu etapa</div>
            <div className="mt-2 flex items-end gap-6">
              <div><div className="text-2xl font-semibold tabular-nums">{c.xp}</div><div className="text-[11px] text-white/50">XP</div></div>
              <div><div className="text-2xl font-semibold tabular-nums inline-flex items-center gap-1.5"><Flame on={c.streak.days > 0} size={18} white /> {c.streak.days}</div><div className="text-[11px] text-white/50">días de racha · mejor {c.streak.best}</div></div>
            </div>
            {j.founder && <div className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-[11px] text-white/70">Distinción fundadora: <b className="text-white">{j.founder.name}</b></div>}
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-ink">Executive Journey</h2>
          <Link href="/ceo/carrera" className="text-xs font-medium text-indigo">Stage {j.stage + 1} de {STAGES.length} · {j.name}</Link>
        </div>
        <div className="mt-6"><StageTrack stage={j.stage} /></div>
        {j.next && <p className="mt-5 text-xs text-slate-500">Siguiente nombramiento: <b className="text-ink">{j.next.name}</b> · {j.met} de {j.total} requisitos.</p>}
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-ink">Competencias</h2>
          <span className="text-xs text-slate-400">{countAtLeast(c.mastery, 40)} de 8 en Competent o más</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Salen de la calidad de tus decisiones, tus retos y la Academy. La línea marca Competent (40).</p>
        <div className="mt-5"><CompetencyBars m={c.mastery} focus={j.focus} /></div>
      </section>

      <section id="experiencia" className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="h-9 w-9 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><Briefcase size={16} /></span>
          <div className="flex-1 min-w-0"><h2 className="font-semibold text-ink">Experiencia declarada</h2><p className="text-xs text-slate-400">Ajusta por dónde empiezas y cuánta ayuda ves. No suma dominio, puntos ni nombramientos.</p></div>
          {!editing && (profileAnswered(c.s)
            ? <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs font-medium text-indigo"><Pencil size={12} /> Editar</button>
            : <Link href="/ceo/experiencia" className="btn-primary text-sm">Completar</Link>)}
        </div>
        {editing ? (
          <div className="mt-4"><ProfileEditor initial={pf} onCancel={() => setEditing(false)} onSave={(np) => { c.saveProfile(np); setEditing(false); }} /></div>
        ) : (
          <>
            <dl className="mt-4 grid sm:grid-cols-2 gap-x-6">
              {declared.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2.5 border-t border-slate-100 text-[13px]"><dt className="text-slate-500">{k}</dt><dd className={clsx("font-medium text-right text-ink", !v && "text-slate-400 font-normal")}>{v || "Sin responder"}</dd></div>)}
            </dl>
            {diagnosticOffered(p.decisions, c.s.diagnostic) && profileAnswered(c.s) && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-indigo-soft/50 px-4 py-3">
                <span className="flex-1 min-w-0 text-[12.5px] text-slate-600"><b className="text-ink font-semibold">Diagnóstico inicial · opcional.</b> Tres decisiones, cerca de 3 minutos. Ajusta por dónde sigues; no suma puntos.</span>
                <Link href="/ceo/experiencia?diagnostico=1" className="text-xs font-medium text-indigo">Hacer el diagnóstico</Link>
              </div>
            )}
            <p className="mt-3 flex gap-2 text-[11.5px] text-slate-400"><ShieldCheck size={13} className="shrink-0 mt-0.5" /> Solo vive en tu partida. Si activas el coach con IA, se le comparte en una línea sin datos personales.</p>
          </>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Cómo decides</h2>
        <p className="text-xs text-slate-400 mt-1">No hay respuestas buenas o malas: es el patrón que van dejando tus decisiones.</p>
        <div className="mt-5 space-y-4">
          {p.axes.map((a) => (
            <div key={a.key}>
              <div className="flex justify-between text-xs text-slate-500"><span>{a.left}</span><span>{a.right}</span></div>
              <div className="relative mt-1.5 h-2 rounded-full bg-slate-100">
                <span className="absolute left-1/2 top-[-3px] h-[14px] w-px bg-slate-300" />
                <span className="absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full bg-indigo ring-4 ring-indigo-soft transition-all duration-700" style={{ left: `${50 + a.value / 2}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Insignias</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b) => (
            <div key={b.id} className={clsx("rounded-2xl border p-4 text-center", b.on ? "border-amber/40 bg-amber-soft/50" : "border-slate-100 bg-slate-50")}>
              <span className={clsx("mx-auto h-11 w-11 rounded-full grid place-items-center", b.on ? "bg-gradient-to-br from-amber to-coral text-white ceo-pop" : "bg-slate-200 text-slate-400")}>{b.on ? <Award size={20} /> : <Lock size={16} />}</span>
              <div className={clsx("mt-2 text-sm font-semibold", b.on ? "text-ink" : "text-slate-400")}>{b.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{b.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Tu bitácora</h2>
        {!history.length && <p className="mt-3 text-sm text-slate-400">Aquí quedará el registro de cada decisión y lo que aprendiste de ella.</p>}
        <ul className="mt-3 divide-y divide-slate-100">
          {history.map((e) => (
            <li key={e.item.id}>
              <Link href={`/ceo/caso/${e.item.id}`} className="flex items-start gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-xl">
                <Avatar id={e.item.from} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink truncate">{e.item.bitacora.title}</div>
                  <div className="text-xs text-slate-500 truncate">{e.status === "vencido" ? "Lo dejaste vencer" : `Elegiste: ${e.option?.text}`}</div>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{firstName(c.pack, e.item.from)} · {rel(e.decision?.at ?? e.deadline, c.now)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
