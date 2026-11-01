"use client";
import Link from "next/link";
import { useEffect } from "react";
import clsx from "clsx";
import { ArrowRight, BookOpen, Briefcase, Check, Clock, Coffee, FastForward, Flag, Hourglass, Trophy } from "lucide-react";
import { KPI_KEYS } from "@/lib/ceo/engine";
import { firstName, personOf } from "@/lib/ceo/cast";
import { LESSONS } from "@/lib/ceo/lessons";
import { useCeo } from "./CeoProvider";
import { track } from "@/lib/ceo/events";
import { DilemmaPrompt } from "./DilemmaPrompt";
import { boardAccess } from "@/lib/ceo/board";
import { crisisAccess } from "@/lib/ceo/crisis";
import { specialTasks } from "@/lib/ceo/today";
import { rankOf } from "@/lib/ceo/lessons";
import { nextLessonXp, rankFor } from "@/lib/ceo/engine";
import { nudgeQuiet, shouldNudge } from "@/lib/ceo/profile";
import { Avatar, Bar, ChannelChip, Delta, Flame, rel, until } from "./ui";
import { STAGES } from "@/lib/ceo/journey";
import { presenterOf } from "@/lib/ceo/business/report";
import { COMPANY_STAGES } from "@/lib/ceo/career/identity";

export function Today() {
  const c = useCeo();
  const first = c.s.name.split(" ")[0] || "CEO";
  const pk = c.pack;
  const v = c.verdict;
  const hr = new Date(c.now).getHours();
  const hello = hr < 12 ? "Buenos días" : hr < 19 ? "Buenas tardes" : "Buenas noches";
  const lastDecided = [...c.entries].filter((e) => e.status === "decidido").sort((a, b) => b.decision!.at - a.decision!.at).slice(0, 3);
  const rank = rankFor(c.s, c.now);
  const open = LESSONS.filter((l) => rankOf(l) <= rank);
  const nudge = shouldNudge(c.s, c.now) && !nudgeQuiet(c.pending, c.now) && !c.seasonDone;
  useEffect(() => { if (nudge) track("aviso_perfil_visto"); }, [nudge]);
  const specials = specialTasks({ changeOpen: c.changeOpen && !c.seasonDone, changeStarted: !!c.change, changeDone: !!c.change?.done, changeTitle: pk.change.title, boardOpen: boardAccess(c.s, c.now).open, crisisOpen: crisisAccess(c.s, c.now).open });
  const epPending = c.episodes.filter((e) => e.status === "pendiente");
  const report = c.reportDue !== null ? { href: "/ceo/reporte", period: c.reportDue, from: presenterOf(pk) } : null;
  const waiting = c.pending.length + specials.length + epPending.length + (report ? 1 : 0);
  const nextLesson = open.find((l) => !c.s.lessons[l.id] && c.entries.some((e) => e.item.lesson === l.id && e.status !== "futuro")) ?? open.find((l) => !c.s.lessons[l.id]);

  const passed = KPI_KEYS.filter((k) => v.approved[k]).length;
  const j = c.journey;
  const jPct = j.total ? Math.round((j.met / j.total) * 100) : 100;
  const greeting = c.seasonDone
    ? (c.continuous ? (v.passed ? `Cerraste un buen periodo en ${pk.short}, ${first}.` : `Cerraste el periodo en ${pk.short}, ${first}.`) : v.passed ? `Aprobaste ${pk.short}, ${first}.` : `Cerraste la temporada en ${pk.short}, ${first}.`)
    : `${hello}, ${first}.`;
  const sub = c.seasonDone
    ? (c.continuous ? (v.passed ? "El consejo ya tiene tu evaluación." : "El consejo quiere hablar de los rubros bajos.") : v.passed ? "Te espera otra empresa." : "El consejo pide otra vuelta.")
    : waiting ? `${waiting} ${waiting === 1 ? "asunto espera" : "asuntos esperan"} tu decisión.` : "Todo al día. Durante el día llegarán más asuntos.";
  const cta = c.seasonDone ? null
    : report ? { href: report.href, label: `Revisar el cierre del mes ${report.period}` }
    : c.pending[0] ? { href: `/ceo/caso/${c.pending[0].item.id}`, label: `Atender: ${firstName(pk, c.pending[0].item.from)}` }
    : epPending[0] ? { href: `/ceo/episodio/${epPending[0].spec.id}`, label: `Atender: ${firstName(pk, epPending[0].spec.from)}` }
    : specials[0] ? { href: specials[0].href, label: `Atender: ${specials[0].subject.split(" · ")[0]}` }
    : null;

  return (
    <div className="space-y-5">
      {c.cadence === "quiet_day" ? (
        <section className="card p-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="h-9 w-9 shrink-0 rounded-xl bg-mint-soft text-sob grid place-items-center"><Coffee size={16} /></span>
          <span className="flex-1 min-w-0"><b className="text-ink">Hoy es tu día tranquilo.</b> <span className="text-slate-500">No llegan asuntos nuevos y tus plazos están detenidos hasta mañana.</span></span>
          <button type="button" onClick={c.resumeCareer} className="text-indigo font-medium">Volver al ritmo normal</button>
        </section>
      ) : <DilemmaPrompt />}

      {/* bienvenida + tu progreso: una sola franja */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-5 sm:p-7 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div aria-hidden className="absolute right-24 bottom-[-80px] h-48 w-48 rounded-full bg-mint/20 blur-3xl" />
        <div className="relative grid gap-5 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div className="min-w-0">
            <div className="text-xs text-white/60 truncate">{pk.name} · {pk.industry} · {c.continuous ? `Mes ${(c.s.career ?? []).length + 1} · ${COMPANY_STAGES.find((x) => x.id === c.s.companyProfile?.stage)?.label ?? COMPANY_STAGES[0].label}` : `Día ${c.day} de ${pk.season.days}`}{c.s.tier > 0 ? ` · Exigencia ${c.rules.name}` : ""}</div>
            <h1 className="mt-1.5 text-2xl sm:text-[28px] font-semibold leading-tight">{greeting}</h1>
            <p className="mt-1 text-[15px] text-white/75">{sub}</p>
            {cta && <Link href={cta.href} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-white/90">{cta.label} <ArrowRight size={15} /></Link>}
            {c.seasonDone && <Link href="/ceo/carrera" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink"><Trophy size={15} /> Ver el veredicto del consejo</Link>}
          </div>

          <div className="rounded-2xl bg-white/[.08] border border-white/[.12] backdrop-blur p-3.5 sm:p-4" aria-label="Tu progreso">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={clsx("h-9 w-9 rounded-xl grid place-items-center shrink-0", c.streak.doneToday ? "bg-gradient-to-br from-amber to-coral" : "bg-white/10")}><Flame on={c.streak.doneToday} size={19} white /></span>
                <div><div className="text-[11px] text-white/55 leading-none">Racha</div><div className="mt-1 text-[15px] font-semibold tabular-nums leading-none">{c.streak.days} {c.streak.days === 1 ? "día" : "días"}</div></div>
              </div>
              <div className="hidden sm:flex gap-1.5">
                {c.streak.week.map((d) => <span key={d.key} title={d.label} className={clsx("h-5 w-5 rounded-full grid place-items-center", d.on ? "bg-gradient-to-br from-amber to-coral text-white" : d.paused ? "border border-dashed border-white/30" : d.today ? "bg-white/20 ring-2 ring-white/40" : "bg-white/10")}>{d.on && <Check size={10} strokeWidth={3} />}<span className="sr-only">{d.label}{d.paused ? " en pausa" : ""}</span></span>)}
              </div>
              <div className="text-right"><div className="text-[11px] text-white/55 leading-none">XP</div><div className="mt-1 text-[15px] font-semibold tabular-nums leading-none">{c.xp}</div></div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0"><div className="text-[11px] text-white/55">Executive Journey · Stage {j.stage + 1} de {STAGES.length}</div><div className="text-sm font-semibold truncate">{j.name}</div></div>
                <Link href="/ceo/carrera" className="shrink-0 text-[11px] font-semibold text-indigo-light hover:text-white">Tu carrera →</Link>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-light to-white" style={{ width: `${jPct}%` }} /></div>
              <div className="mt-1.5 text-[11px] text-white/55 tabular-nums">{j.next ? (j.ready ? "Listo para tu nombramiento" : `Siguiente nombramiento: ${j.met} de ${j.total} requisitos`) : "Última etapa"}{!c.streak.doneToday && c.streak.atRisk ? " · Decide o estudia hoy para no perder tu racha" : ""}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr] items-start">
        {/* decisiones: lo principal */}
        <section className="card p-5 sm:p-6 min-w-0">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-ink">Esperando tu decisión</h2><Link href="/ceo/bandeja" className="text-xs font-medium text-indigo">Bandeja →</Link></div>
          {waiting === 0 ? <p className="mt-4 text-sm text-slate-500">Nada pendiente. Aprovecha para repasar la teoría en mêtis Academy.</p> : (
            <ul className="mt-2 divide-y divide-slate-100">
              {report && (
                <li><Link href={report.href} className="flex gap-3 py-3 group">
                  <Avatar id={report.from} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-sm font-semibold text-ink truncate">{personOf(pk, report.from).name}</span><span className="chip bg-indigo-soft text-indigo text-[10px]">Reporte</span></div>
                    <div className="text-sm text-slate-600 truncate">Cierre del mes {report.period}: tus números y una decisión de caja</div>
                    <div className="mt-0.5 text-[11px] text-indigo font-medium">El siguiente mes se cierra después de firmarlo</div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo mt-3" />
                </Link></li>
              )}
              {specials.map((t) => (
                <li key={t.id}><Link href={t.href} className="flex gap-3 py-3 group">
                  <span className={clsx("h-[38px] w-[38px] shrink-0 rounded-full grid place-items-center", t.id === "crisis" ? "bg-coral/10 text-coral" : "bg-indigo-soft text-indigo")}><Flag size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-sm font-semibold text-ink truncate">Consejo de {pk.short}</span></div>
                    <div className="text-sm text-slate-600 truncate">{t.subject}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{t.label}</div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo mt-3" />
                </Link></li>
              ))}
              {epPending.map((e) => (
                <li key={e.spec.id}><Link href={`/ceo/episodio/${e.spec.id}`} className="flex gap-3 py-3 group">
                  <Avatar id={e.spec.from} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-sm font-semibold text-ink truncate">{personOf(pk, e.spec.from).name}</span><ChannelChip c={e.spec.channel} /></div>
                    <div className="text-sm text-slate-600 truncate">{e.spec.subject}</div>
                    <div className="mt-0.5 text-[11px] text-indigo font-medium">Caso ejecutivo · unos {e.spec.minutes} min{e.run ? " · en curso" : ""}</div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo mt-3" />
                </Link></li>
              ))}
              {c.pending.map((e) => (
                <li key={e.item.id}><Link href={`/ceo/caso/${e.item.id}`} className="flex gap-3 py-3 group">
                  <Avatar id={e.item.from} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-sm font-semibold text-ink truncate">{personOf(pk, e.item.from).name}</span><ChannelChip c={e.item.channel} /></div>
                    <div className="text-sm text-slate-600 truncate">{e.item.subject}</div>
                    <div className={clsx("mt-0.5 text-[11px] inline-flex items-center gap-1", e.deadline - c.now < 3 * 3_600_000 ? "text-coral font-medium" : "text-slate-400")}><Clock size={11} /> Vence en {until(e.deadline, c.now)}</div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo mt-3" />
                </Link></li>
              ))}
            </ul>
          )}
          {!c.seasonDone && c.nextArrival && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-2.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Hourglass size={12} /> Durante el día llegarán más asuntos.</span>
              {c.testTools && <button onClick={c.skipNext} className="inline-flex items-center gap-1 font-medium text-indigo hover:underline"><FastForward size={12} /> Adelantar el reloj (modo prueba)</button>}
            </div>
          )}
        </section>

        <div className="space-y-4 min-w-0">
          {/* estado de la empresa, compacto */}
          <section className="card p-5">
            <div className="flex items-baseline justify-between gap-2"><h2 className="font-semibold text-ink text-sm">Tu empresa hoy</h2><span className="text-[11px] text-slate-400"><b className="text-ink tabular-nums">{passed}/5</b> en {v.passLine} o más</span></div>
            <div className="mt-3 space-y-2.5">
              {KPI_KEYS.map((k) => (
                <div key={k} title={pk.kpiHint[k]} className="grid grid-cols-[72px_1fr_auto] items-center gap-3">
                  <span className="text-xs text-slate-500 truncate">{pk.kpiLabel[k]}</span>
                  <Bar value={c.kpis[k]} k={k} line={v.passLine} />
                  <span className="text-xs font-semibold tabular-nums whitespace-nowrap text-right min-w-[52px]">{c.kpis[k]} <Delta n={c.kpis[k] - pk.kpiStart[k]} /></span>
                </div>
              ))}
            </div>
            <Link href="/ceo/empresa" className="mt-3.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo">{c.continuous ? "Ver números completos en Empresa" : "Ver tu empresa"} <ArrowRight size={13} /></Link>
          </section>

          {nextLesson && (
            <Link href={`/ceo/academy/${nextLesson.id}`} className="card p-4 flex gap-3 items-center hover:-translate-y-0.5 transition-transform">
              <span className="h-10 w-10 rounded-xl bg-indigo-soft text-indigo grid place-items-center shrink-0"><BookOpen size={18} /></span>
              <div className="min-w-0"><div className="text-[10px] font-semibold uppercase tracking-wider text-indigo">mêtis Academy · {nextLesson.minutes} min{nextLessonXp(c.s, c.now) > 0 ? ` · +${nextLessonXp(c.s, c.now)} XP` : ""}</div><div className="text-sm font-semibold text-ink leading-snug mt-0.5 truncate">{nextLesson.title}</div></div>
            </Link>
          )}

          <section className="card p-4">
            <h2 className="font-semibold text-ink text-[13px]">Lo último que decidiste</h2>
            {lastDecided.length === 0 ? <p className="mt-1.5 text-xs text-slate-500">Todavía nada. Tu primera decisión te espera.</p> : (
              <ul className="mt-2 space-y-2.5">
                {lastDecided.map((e) => (
                  <li key={e.item.id}><Link href={`/ceo/caso/${e.item.id}`} className="block">
                    <div className="text-[11px] text-slate-400 truncate">{rel(e.decision!.at, c.now)} · {e.item.subject}</div>
                    <div className="text-xs text-slate-600 line-clamp-2">{e.option?.outcome}</div>
                  </Link></li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {nudge && (
        <section className="card px-4 py-3 flex flex-wrap items-center gap-3 academy-in">
          <span className="h-8 w-8 shrink-0 rounded-lg bg-indigo-soft text-indigo grid place-items-center"><Briefcase size={15} /></span>
          <div className="flex-1 min-w-[180px] text-sm"><b className="text-ink">Cuéntanos tu experiencia</b> <span className="text-slate-500">· cinco preguntas, cerca de un minuto. No cambia tu avance.</span></div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => { track("aviso_perfil_pospuesto", { veces: (c.s.profileNudge?.dismissed ?? 0) + 1 }); c.snoozeProfile(); }} className="btn-ghost text-xs">Ahora no</button>
            <Link href="/ceo/experiencia" className="btn-primary text-xs">Completar perfil</Link>
          </div>
        </section>
      )}
    </div>
  );
}
