"use client";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import clsx from "clsx";
import { ArrowRight, BookOpen, Check, Briefcase, Clock, Coffee, FastForward, Flag, Hourglass, Trophy } from "lucide-react";
import { KPI_KEYS, closedRunsOf } from "@/lib/ceo/engine";
import { COHERENCE_RULES_VERSION, CONTINUOUS_RULES_VERSION } from "@/lib/ceo/rules";
import { ETHICS_AUDIT_RULES } from "@/lib/ceo/editorial";
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
import { Avatar, ChannelChip, Flame, rel, until } from "./ui";
import { headlineOf } from "@/lib/ceo/trajectory";
import { presenterOf } from "@/lib/ceo/business/report";
import { alertsAt } from "@/lib/ceo/season-report";
import { HealthBar, KpiBoard } from "./KpiBoard";

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
  // Avisos de tendencia: lo que se está desgastando, antes de que sea tarde (máximo dos, los más graves).
  const alerts = useMemo(() => {
    if (c.seasonDone) return [];
    const rank = { critico: 0, riesgo: 1, aviso: 2 } as const;
    return alertsAt(c.s, c.now).filter((a) => a.kind !== "saturacion" || a.level !== "aviso").sort((a, b) => rank[a.level] - rank[b.level]).slice(0, 2);
  }, [c.s, c.now, c.seasonDone]);
  // V5/V6 · el encargo y las reglas se ven ANTES de decidir: nadie reprueba por una regla que no conocía.
  const mandate = v.v5 && !c.seasonDone ? v.v5 : null;
  const prevRun = c.continuous ? closedRunsOf(c.s).at(-1) : undefined;
  // Aviso de cambio de reglas al pasar de un periodo a otro: de v4 a la evaluación V5 (v6+), o de v6 a la auditoría ética (v7).
  const curV = c.s.rulesVersion ?? 1, prevV = prevRun?.rulesVersion ?? 1;
  const newRules = !!mandate && !!prevRun && curV >= 6 && curV <= CONTINUOUS_RULES_VERSION && prevV < 6;
  const ethicsRules = !!mandate && !!prevRun && curV >= ETHICS_AUDIT_RULES && prevV >= 6 && prevV < ETHICS_AUDIT_RULES;
  // v8 · coherencia: se avisa una sola vez, en el primer mes v8 después de un mes v6/v7.
  const coherenceRules = !!mandate && !!prevRun && curV >= COHERENCE_RULES_VERSION && prevV >= 6 && prevV < COHERENCE_RULES_VERSION;
  const t = c.trajectory;
  const headline = headlineOf(t);
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
        <div className="relative grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
          <div className="min-w-0">
            <div className="text-xs text-white/60 truncate">{pk.name} · {pk.industry}{c.s.tier > 0 ? ` · Exigencia ${c.rules.name}` : ""}</div>
            <h1 className="mt-1.5 text-2xl sm:text-[28px] font-semibold leading-tight">{greeting}</h1>
            <p className="mt-1 text-[15px] text-white/75">{sub}</p>
            {cta && <Link href={cta.href} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-white/90">{cta.label} <ArrowRight size={15} /></Link>}
            {c.seasonDone && <Link href="/ceo/carrera" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink"><Trophy size={15} /> Ver el veredicto del consejo</Link>}
          </div>

          <div className="min-w-0 rounded-2xl bg-white/[.08] border border-white/[.12] backdrop-blur p-3.5 sm:p-4" aria-label="Tu mandato" data-testid="resumen-mandato">
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0"><div className="text-[11px] text-white/55">Tu mandato</div><div className="text-sm font-semibold leading-snug">{t.appointment.title}</div></div>
              <Link href="/ceo/carrera" className="shrink-0 text-[11px] font-semibold text-indigo-light hover:text-white">Tu trayectoria →</Link>
            </div>
            <div className="mt-1 text-[12px] text-white/70">{t.active ? `Mes ${t.month} · ${t.chapter.label}` : `Día ${c.day} de ${pk.season.days}`}</div>
            <p className="mt-2 text-[13px] text-white/85 leading-snug">{t.moment.text}</p>
            {/* Barra madre: la salud de la empresa, con la misma escala que los cinco indicadores. */}
            <div className="mt-2.5"><HealthBar dark /></div>
            {headline && <p className="mt-2 text-[12px] text-white/65 truncate"><span className="text-white/45">{headline.label}:</span> {headline.text}</p>}
            {/* Constancia: hábito, separado del mandato. No es requisito de nada. */}
            <div className="mt-3 pt-3 border-t border-white/10" aria-label="Constancia">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className={clsx("h-8 w-8 sm:h-9 sm:w-9 rounded-xl grid place-items-center shrink-0", c.streak.doneToday ? "bg-gradient-to-br from-amber to-coral" : "bg-white/10")}><Flame on={c.streak.doneToday} size={19} white /></span>
                  <div><div className="text-[11px] text-white/55 leading-none">Racha</div><div className="mt-1 whitespace-nowrap text-[15px] font-semibold tabular-nums leading-none">{c.streak.days} {c.streak.days === 1 ? "día" : "días"}</div></div>
                </div>
                <div className="flex gap-[3px] sm:gap-1.5">
                  {c.streak.week.map((d) => <span key={d.key} title={d.label} className={clsx("h-4 w-4 sm:h-5 sm:w-5 rounded-full grid place-items-center", d.on ? "bg-gradient-to-br from-amber to-coral text-white" : d.paused ? "border border-dashed border-white/30" : d.today ? "bg-white/20 ring-2 ring-white/40" : "bg-white/10")}>{d.on && <Check size={9} strokeWidth={3} />}<span className="sr-only">{d.label}{d.paused ? " en pausa" : ""}</span></span>)}
                </div>
                <div className="text-right"><div className="text-[11px] text-white/55 leading-none">XP</div><div className="mt-1 text-[15px] font-semibold tabular-nums leading-none">{c.xp}</div></div>
              </div>
              {!c.streak.doneToday && c.streak.atRisk && <div className="mt-2 text-[11px] text-white/55">Decide o estudia hoy para conservar tu racha.</div>}
            </div>
          </div>
        </div>
      </section>

      {mandate && (
        <section data-testid="encargo-periodo" className="card p-4 sm:p-5">
          {newRules && (
            <p data-testid="aviso-reglas-nuevas" className="mb-3 rounded-xl bg-indigo-soft/50 px-3.5 py-2.5 text-[13px] text-ink">
              <b>Desde este mes el consejo evalúa de otra forma.</b> Ya no basta con tener los cinco indicadores en la línea: revisa tu encargo, la salud de la empresa y qué tan bien razonas. Tus meses anteriores conservan la evaluación que ya recibiste.
            </p>
          )}
          {ethicsRules && (
            <p data-testid="aviso-lineas-rojas" className="mb-3 rounded-xl bg-indigo-soft/50 px-3.5 py-2.5 text-[13px] text-ink">
              <b>Desde este mes hay más líneas rojas.</b> Prometerle a un cliente algo que no existe y encubrirlo, mover a quien denuncia, darle al equipo una explicación falsa, mantener una fecha que solo se cumple haciendo trampa u ocultar un error culpando a otro ya no se compensan con buenos números. Tus meses anteriores conservan su evaluación.
            </p>
          )}
          {coherenceRules && (
            <p data-testid="aviso-coherencia" className="mb-3 rounded-xl bg-indigo-soft/50 px-3.5 py-2.5 text-[13px] text-ink">
              <b>Desde este mes el consejo es más justo con tu criterio.</b> Si una respuesta es defendible aunque tenga un costo, cuenta como bien razonada. Lo que depende de que otra persona acepte cuenta cuando responde, no antes. Y dejar vencer un asunto ético grave cuenta igual que decidir mal. Tus meses anteriores conservan su evaluación.
            </p>
          )}
          <div className="flex items-baseline justify-between gap-2"><h2 className="font-semibold text-ink text-sm">Con qué te va a evaluar el consejo {c.continuous ? "este mes" : "esta temporada"}</h2><Link href="/ceo/carrera" className="shrink-0 text-[11px] font-semibold text-indigo">Detalle →</Link></div>
          <p className="mt-1 text-sm text-slate-600">Tu encargo: <b className="text-ink">{mandate.objectiveText}</b></p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-3 text-[12.5px] text-slate-600">
            <li className="rounded-xl bg-slate-50 px-3 py-2"><b className="text-ink">Objetivos:</b> {mandate.objectives.map((o) => pk.kpiLabel[o.kpi]).join(" y ")} en {v.passLine} o más al cierre.</li>
            <li className="rounded-xl bg-slate-50 px-3 py-2"><b className="text-ink">Empresa sana:</b> salud promedio de {mandate.healthMin} o más y ningún indicador debajo de {mandate.floor}; caja y consejo arriba de 40.</li>
            <li className="rounded-xl bg-slate-50 px-3 py-2"><b className="text-ink">Criterio:</b> al menos {Math.round(mandate.judgment.min * 100)} % de asuntos bien razonados. Los que dejes vencer cuentan en contra.</li>
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">Sin líneas rojas (seguridad, fraude, represalias, ocultar riesgos). Al cierre, la operación y el margen generan caja: un buen margen la repone.</p>
        </section>
      )}

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
            <KpiBoard />
            {alerts.length > 0 && (
              <ul data-testid="alertas-tendencia" className="mt-3.5 space-y-1.5">
                {alerts.map((a) => (
                  <li key={a.kpi + a.kind} data-level={a.level} className={clsx("rounded-xl px-3 py-2 text-[12px] leading-snug", a.level === "critico" ? "bg-coral-soft/60 text-ink" : a.level === "riesgo" ? "bg-amber-50 text-ink" : "bg-slate-50 text-slate-600")}>{a.text}</li>
                ))}
              </ul>
            )}
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
