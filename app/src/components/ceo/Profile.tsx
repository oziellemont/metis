"use client";
import Link from "next/link";
import clsx from "clsx";
import { Award, Lock, Sparkles } from "lucide-react";
import { LEVELS, badgesOf, profileOf } from "@/lib/ceo/engine";
import { firstName } from "@/lib/ceo/cast";
import { useCeo } from "./CeoProvider";
import { Avatar, Flame, rel } from "./ui";

export function Profile() {
  const c = useCeo();
  const p = profileOf(c.s, c.now);
  const badges = badgesOf(c.s, c.now);
  const history = c.entries.filter((e) => e.status === "decidido" || e.status === "vencido").sort((a, b) => (b.decision?.at ?? b.deadline) - (a.decision?.at ?? a.deadline));
  const lvlIdx = LEVELS.findIndex((l) => l.name === c.level.name);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-8 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="text-xs text-white/60">{c.s.name} · {c.level.name}</div>
            <div className="mt-2 text-sm text-white/70">Tu estilo de dirección</div>
            <h1 className="text-3xl font-semibold">{p.archetype.name}</h1>
            <p className="mt-2 text-sm text-white/80 max-w-md">{p.archetype.text}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1.5"><Sparkles size={12} className="inline -mt-0.5" /> {c.xp} XP</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 inline-flex items-center gap-1"><Flame on={c.streak.days > 0} size={13} /> Racha {c.streak.days} · mejor {c.streak.best}</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">{p.decisions} decisiones</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">{Object.keys(c.s.lessons).length} lecciones</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-5">
            <div className="text-xs text-white/60 mb-3">Tu carrera</div>
            <ol className="space-y-2">
              {LEVELS.map((l, i) => (
                <li key={l.name} className={clsx("flex items-center gap-3 text-sm", i > lvlIdx && "text-white/40")}>
                  <span className={clsx("h-6 w-6 rounded-full grid place-items-center text-[11px] font-semibold", i < lvlIdx ? "bg-mint text-ink" : i === lvlIdx ? "bg-white text-ink" : "bg-white/10")}>{i + 1}</span>
                  <span className="flex-1">{l.name}</span><span className="tabular-nums text-xs">{l.min} XP</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
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
                <span className="text-[11px] text-slate-400 shrink-0">{firstName(e.item.from)} · {rel(e.decision?.at ?? e.deadline, c.now)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
