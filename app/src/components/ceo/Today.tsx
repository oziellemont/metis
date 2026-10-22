"use client";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, BookOpen, Clock, FastForward, Hourglass, Info, PartyPopper } from "lucide-react";
import { KPI_HINT, KPI_LABEL, KPI_START } from "@/lib/ceo/engine";
import { CAST, COMPANY, firstName } from "@/lib/ceo/cast";
import { SEASON, SEASON_DAYS } from "@/lib/ceo/cases";
import { LESSONS } from "@/lib/ceo/lessons";
import type { KpiKey } from "@/lib/ceo/types";
import { useCeo } from "./CeoProvider";
import { Avatar, Bar, ChannelChip, Delta, Flame, clock, rel, until } from "./ui";

export function Today() {
  const c = useCeo();
  const first = c.s.name.split(" ")[0] || "CEO";
  const hr = new Date(c.now).getHours();
  const hello = hr < 12 ? "Buenos días" : hr < 19 ? "Buenas tardes" : "Buenas noches";
  const lastDecided = [...c.entries].filter((e) => e.status === "decidido").sort((a, b) => b.decision!.at - a.decision!.at).slice(0, 3);
  const nextLesson = LESSONS.find((l) => !c.s.lessons[l.id] && c.entries.some((e) => e.item.lesson === l.id && e.status !== "futuro")) ?? LESSONS.find((l) => !c.s.lessons[l.id]);

  return (
    <div className="space-y-5">
      {/* héroe */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-8 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div aria-hidden className="absolute right-24 bottom-[-80px] h-48 w-48 rounded-full bg-mint/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.5fr_1fr] items-center">
          <div>
            <div className="text-xs text-white/60">{COMPANY.name} · Temporada {SEASON.n} · Día {c.day} de {SEASON_DAYS}</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight">
              {c.seasonDone ? `Cerraste tus primeros 90 días, ${first}.` : c.pending.length ? `${hello}, ${first}. Tienes ${c.pending.length} ${c.pending.length === 1 ? "asunto" : "asuntos"} esperando tu decisión.` : `${hello}, ${first}. Todo al día.`}
            </h1>
            {c.pending[0] && !c.seasonDone && (
              <Link href={`/ceo/caso/${c.pending[0].item.id}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-white/90">Atender: {firstName(c.pending[0].item.from)} <ArrowRight size={15} /></Link>
            )}
            {!c.pending.length && c.nextArrival && !c.seasonDone && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white/80"><Hourglass size={14} /> Tu siguiente asunto llega en {until(c.nextArrival, c.now)} ({clock(c.nextArrival)}).</p>
            )}
            {c.seasonDone && <Link href="/ceo/perfil" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink"><PartyPopper size={15} /> Ver mi perfil de CEO</Link>}
          </div>
          {/* racha */}
          <div className="rounded-2xl bg-white/10 backdrop-blur p-5">
            <div className="flex items-center gap-3">
              <span className={clsx("h-12 w-12 rounded-2xl grid place-items-center", c.streak.doneToday ? "bg-gradient-to-br from-amber to-coral" : "bg-white/10")}><Flame on={c.streak.doneToday} size={26} white /></span>
              <div><div className="text-2xl font-semibold tabular-nums leading-none">{c.streak.days}</div><div className="text-xs text-white/60 mt-1">{c.streak.days === 1 ? "día de racha" : "días de racha"}</div></div>
            </div>
            <div className="mt-4 flex justify-between">
              {c.streak.week.map((d) => <div key={d.key} className="flex flex-col items-center gap-1"><span className={clsx("h-7 w-7 rounded-full grid place-items-center text-[11px] font-semibold", d.on ? "bg-gradient-to-br from-amber to-coral text-white" : d.today ? "bg-white/20 text-white ring-2 ring-white/40" : "bg-white/10 text-white/40")}>{d.on ? "✓" : ""}</span><span className="text-[10px] text-white/50">{d.label}</span></div>)}
            </div>
            <p className="mt-3 text-[11px] text-white/60">{c.streak.doneToday ? "Hoy ya cumpliste. ¡Vuelve mañana!" : c.streak.atRisk ? "⚠️ Toma una decisión o termina una lección hoy para no perder tu racha." : "Toma una decisión o termina una lección para encender tu racha."}</p>
          </div>
        </div>
      </section>

      {/* indicadores */}
      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between"><h2 className="font-semibold text-ink">Tu empresa hoy</h2><span className="text-xs text-slate-400">Salud general <b className="text-ink tabular-nums">{c.health}</b>/100</span></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-5">
          {(Object.keys(KPI_LABEL) as KpiKey[]).map((k) => (
            <div key={k} title={KPI_HINT[k]}>
              <div className="flex items-baseline justify-between"><span className="text-xs font-medium text-slate-500 inline-flex items-center gap-1">{KPI_LABEL[k]} <Info size={10} className="text-slate-300" /></span><span className="text-sm font-semibold tabular-nums">{c.kpis[k]} <Delta n={c.kpis[k] - KPI_START[k]} /></span></div>
              <Bar value={c.kpis[k]} k={k} className="mt-1.5" />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* pendientes */}
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-ink">Esperando tu decisión</h2><Link href="/ceo/bandeja" className="text-xs font-medium text-indigo">Bandeja →</Link></div>
          {c.pending.length === 0 ? <p className="mt-4 text-sm text-slate-500">Nada pendiente. Aprovecha para repasar la teoría en mêtis Academy.</p> : (
            <ul className="mt-3 divide-y divide-slate-100">
              {c.pending.map((e) => (
                <li key={e.item.id}><Link href={`/ceo/caso/${e.item.id}`} className="flex gap-3 py-3 group">
                  <Avatar id={e.item.from} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-sm font-semibold text-ink truncate">{CAST[e.item.from].name}</span><ChannelChip c={e.item.channel} /></div>
                    <div className="text-sm text-slate-600 truncate">{e.item.subject}</div>
                    <div className={clsx("mt-0.5 text-[11px] inline-flex items-center gap-1", e.deadline - c.now < 3 * 3_600_000 ? "text-coral font-medium" : "text-slate-400")}><Clock size={11} /> Vence en {until(e.deadline, c.now)}</div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo mt-3" />
                </Link></li>
              ))}
            </ul>
          )}
          {!c.seasonDone && c.nextArrival && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-2.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Hourglass size={12} /> Siguiente asunto: {clock(c.nextArrival)} ({until(c.nextArrival, c.now)})</span>
              <button onClick={c.skipNext} className="inline-flex items-center gap-1 font-medium text-indigo hover:underline"><FastForward size={12} /> Adelantar el reloj (modo prueba)</button>
            </div>
          )}
        </section>

        <div className="space-y-5">
          {nextLesson && (
            <Link href={`/ceo/academy/${nextLesson.id}`} className="card p-5 flex gap-4 items-start hover:-translate-y-0.5 transition-transform">
              <span className="h-11 w-11 rounded-2xl bg-indigo-soft text-indigo grid place-items-center shrink-0"><BookOpen size={20} /></span>
              <div className="min-w-0"><div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">mêtis Academy · {nextLesson.minutes} min</div><div className="font-semibold text-ink leading-snug mt-0.5">{nextLesson.title}</div><div className="text-xs text-slate-500 mt-1">La teoría detrás de tus decisiones · +30 XP</div></div>
            </Link>
          )}
          <section className="card p-5">
            <h2 className="font-semibold text-ink text-sm">Lo último que decidiste</h2>
            {lastDecided.length === 0 ? <p className="mt-3 text-sm text-slate-500">Todavía nada. Tu primera decisión te espera.</p> : (
              <ul className="mt-3 space-y-3">
                {lastDecided.map((e) => (
                  <li key={e.item.id}><Link href={`/ceo/caso/${e.item.id}`} className="block">
                    <div className="text-xs text-slate-400">{rel(e.decision!.at, c.now)} · {e.item.subject}</div>
                    <div className="text-sm text-slate-600 line-clamp-2">{e.option?.outcome}</div>
                  </Link></li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
