"use client";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import clsx from "clsx";
import { ArrowRight, BookOpen, Briefcase, ClipboardCheck, Clock, Coffee, Inbox, Info } from "lucide-react";
import { growthDayOf, nextLessonXp, rankFor } from "@/lib/ceo/engine";
import { isRetailLog, isSteelLog, pendingGrowth, retailPendingOf, steelPendingOf } from "@/lib/ceo/growth/session";
import { firstName, personOf } from "@/lib/ceo/cast";
import { LESSONS, rankOf } from "@/lib/ceo/lessons";
import { boardAccess } from "@/lib/ceo/board";
import { crisisAccess } from "@/lib/ceo/crisis";
import { specialTasks } from "@/lib/ceo/today";
import { nudgeQuiet, shouldNudge } from "@/lib/ceo/profile";
import { track } from "@/lib/ceo/events";
import { decidedOf, practiceByAcademy, topicAcademies } from "@/lib/ceo/metis2/entrada";
import { ACCESO_REVISION, AVANCE_PROVISIONAL, avisoSimulador, misionDelDia, otrosCasosText } from "@/lib/ceo/metis2/hoy";
import { useCeo } from "./CeoProvider";
import { DilemmaPrompt } from "./DilemmaPrompt";
import { Avatar, ChannelChip, Flame, until } from "./ui";

/**
 * Hoy con el simulador de empresas apagado (MÊTIS 2.0, pantalla intermedia antes de la entrega 3.3).
 *
 * No muestra el tablero de la empresa: ni indicadores, ni misión del periodo, ni mandato, ni etapa. Propone una sola
 * cosa para practicar, lista los casos que esperan y cuenta la actividad en las seis academias, declarada como avance
 * provisional. No mide dominio ni acredita nada. El acceso a las experiencias en revisión lo ven solo las cuentas del
 * equipo mêtis. Con el simulador encendido se ve la pantalla anterior, sin cambios.
 */
export function HoyAprendizaje() {
  const c = useCeo();
  const first = c.s.name.split(" ")[0] || "";
  const pk = c.pack;
  const hr = new Date(c.now).getHours();
  const hello = hr < 12 ? "Buenos días" : hr < 19 ? "Buenas tardes" : "Buenas noches";

  const rank = rankFor(c.s, c.now);
  const open = LESSONS.filter((l) => rankOf(l) <= rank);
  const nextLesson = open.find((l) => !c.s.lessons[l.id] && c.entries.some((e) => e.item.lesson === l.id && e.status !== "futuro")) ?? open.find((l) => !c.s.lessons[l.id]);
  const lessonXp = nextLesson ? nextLessonXp(c.s, c.now) : 0;

  const epPending = c.episodes.filter((e) => e.status === "pendiente");
  const caso = c.pending[0];
  const ep = epPending[0];
  const mision = misionDelDia({
    caso: caso ? { id: caso.item.id, subject: caso.item.subject, who: firstName(pk, caso.item.from), due: until(caso.deadline, c.now) } : null,
    episodio: ep ? { id: ep.spec.id, subject: ep.spec.subject, minutes: ep.spec.minutes, started: !!ep.run } : null,
    leccion: nextLesson ? { id: nextLesson.id, title: nextLesson.title, minutes: nextLesson.minutes } : null,
  });
  // Lo que espera además de lo propuesto arriba.
  const restCases = caso ? c.pending.slice(1) : [];
  const restEps = caso ? epPending : epPending.slice(1);
  const rest = restCases.length + restEps.length;
  const SHOWN = 3;

  // Asuntos propios del simulador: aquí solo se cuentan, sin cifras de la empresa.
  const growthPending = useMemo(() => {
    const g = c.s.growth;
    if (!g) return 0;
    const day = growthDayOf(c.s, c.now);
    if (isRetailLog(g)) return retailPendingOf(g, day) ? 1 : 0;
    if (isSteelLog(g)) return steelPendingOf(g, day) ? 1 : 0;
    return pendingGrowth(g, day).length;
  }, [c.s, c.now]);
  const specials = specialTasks({ changeOpen: c.changeOpen && !c.seasonDone, changeStarted: !!c.change, changeDone: !!c.change?.done, changeTitle: pk.change.title, boardOpen: boardAccess(c.s, c.now).open, crisisOpen: crisisAccess(c.s, c.now).open });
  const aviso = avisoSimulador({
    asuntos: [...(c.reportDue !== null ? ["/ceo/reporte"] : []), ...specials.map((t) => t.href), ...Array.from({ length: growthPending }, () => "/ceo/empresa#crecimiento")],
    periodoCerrado: c.seasonDone,
  });

  const rows = useMemo(() => practiceByAcademy({
    lessonIds: LESSONS.map((l) => l.id),
    lessonsDone: c.s.lessons,
    decided: decidedOf(c.s),
    dilemmaIds: Object.keys(c.s.dilemmas ?? {}),
  }), [c.s]);
  const mine = topicAcademies(c.s.profile?.topics ?? []);

  const nudge = shouldNudge(c.s, c.now) && !nudgeQuiet(c.pending, c.now) && !c.seasonDone;
  useEffect(() => { if (nudge) track("aviso_perfil_visto"); }, [nudge]);

  const glass = "rounded-2xl border bg-white/[.06] border-white/[.12]";
  const row = clsx(glass, "flex gap-3 px-4 py-3.5 group transition-all hover:bg-white/10");

  return (
    <div className="relative overflow-hidden text-white lg:min-h-screen" data-testid="hoy-aprendizaje">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-light/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-mint/10 blur-3xl" />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8 pt-6 pb-10 lg:pt-7">
        {/* Constancia: hábito, no requisito. En el celular ya va en la barra de arriba. */}
        <div className="hidden lg:flex items-center justify-end gap-4 text-sm" aria-label="Constancia">
          <span className="flex items-center gap-1" aria-hidden>
            {c.streak.week.map((d) => <span key={d.key} title={d.label} className={clsx("h-1.5 w-1.5 rounded-full", d.on ? "bg-gradient-to-br from-amber to-coral" : d.paused ? "border border-dashed border-white/30" : d.today ? "bg-white/50" : "bg-white/15")} />)}
          </span>
          <span className={clsx("inline-flex items-center gap-1.5", c.streak.atRisk && !c.streak.doneToday ? "text-amber" : "text-white/85")} title={!c.streak.doneToday && c.streak.atRisk ? "Decide o estudia hoy para conservar tu racha." : undefined}>
            <Flame on={c.streak.days > 0 && c.streak.doneToday} size={16} /> <b className="font-semibold tabular-nums">{c.streak.days}</b> {c.streak.days === 1 ? "día" : "días"} de racha
          </span>
          <span className="h-4 w-px bg-white/20" />
          <span className="tabular-nums text-white/85"><b className="font-semibold text-white">{c.xp}</b> XP</span>
        </div>

        {c.cadence === "quiet_day" ? (
          <section className={clsx(glass, "mt-4 p-4 flex flex-wrap items-center gap-3 text-sm")}>
            <span className="h-9 w-9 shrink-0 rounded-xl bg-mint/15 text-mint grid place-items-center"><Coffee size={16} /></span>
            <span className="flex-1 min-w-0"><b className="text-white">Hoy es tu día tranquilo.</b> <span className="text-white/65">No llegan casos nuevos y tus plazos están detenidos hasta mañana.</span></span>
            <button type="button" onClick={c.resumeCareer} className="btn text-white/70 hover:text-white">Volver al ritmo normal</button>
          </section>
        ) : <DilemmaPrompt />}

        {/* bienvenida */}
        <section className="academy-in mt-4 lg:mt-6">
          <div className="text-xs font-semibold uppercase tracking-[.18em] text-indigo-light">Hoy</div>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">{first ? `${hello}, ${first}.` : `${hello}.`}</h1>
          <p className="mt-3 max-w-xl text-[15px] text-white/70">{c.streak.doneToday ? "Hoy ya practicaste. Si quieres seguir, esto es lo que sigue." : "Una práctica corta al día sostiene el criterio. Esto es lo que sigue."}</p>
        </section>

        {/* la práctica de hoy: una sola propuesta */}
        <section data-testid="hoy-mision" data-mision={mision.kind} aria-labelledby="hoy-mision-t" className="mt-7 rounded-3xl border border-white/[.14] bg-white/[.08] p-5 sm:p-7 backdrop-blur">
          <h2 id="hoy-mision-t" className="text-[11px] font-semibold uppercase tracking-[.25em] text-white/55">Tu práctica de hoy</h2>
          <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-5">
            <div className="min-w-0 flex-1 basis-[280px]">
              <p className="text-xl sm:text-2xl font-semibold leading-snug">{mision.title}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-white/75">{mision.text}</p>
              {mision.kind === "leccion" && lessonXp > 0 && <p className="mt-1 text-xs text-white/50">+{lessonXp} XP al terminarla</p>}
            </div>
            <Link href={mision.href} className="btn bg-white text-ink hover:bg-white/90 px-5 py-3 text-[15px] font-semibold">{mision.cta} <ArrowRight size={16} /></Link>
          </div>
        </section>

        {/* lo demás que espera */}
        {rest > 0 && (
          <section data-testid="hoy-decisiones" aria-label="Casos que esperan" className="mt-6 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold text-white/85">{otrosCasosText(rest)}</h2>
              <Link href="/ceo/bandeja" className="shrink-0 text-xs font-medium text-white/65 hover:text-white transition-colors">Bandeja →</Link>
            </div>
            <ul className="mt-2.5 space-y-2.5">
              {restEps.slice(0, SHOWN).map((e) => (
                <li key={e.spec.id}><Link href={`/ceo/episodio/${e.spec.id}`} className={row}>
                  <Avatar id={e.spec.from} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-sm font-semibold truncate">{personOf(pk, e.spec.from).name}</span><ChannelChip c={e.spec.channel} /></div>
                    <div className="text-sm text-white/70 truncate">{e.spec.subject}</div>
                    <div className="mt-0.5 text-[11px] text-indigo-light font-medium">Caso ejecutivo · unos {e.spec.minutes} min{e.run ? " · en curso" : ""}</div>
                  </div>
                  <ArrowRight size={16} className="text-white/30 group-hover:text-white transition-colors mt-3" />
                </Link></li>
              ))}
              {restCases.slice(0, Math.max(0, SHOWN - restEps.length)).map((e) => (
                <li key={e.item.id}><Link href={`/ceo/caso/${e.item.id}`} className={row}>
                  <Avatar id={e.item.from} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-sm font-semibold truncate">{personOf(pk, e.item.from).name}</span><ChannelChip c={e.item.channel} /></div>
                    <div className="text-sm text-white/70 truncate">{e.item.subject}</div>
                    <div className={clsx("mt-0.5 text-[11px] inline-flex items-center gap-1", e.deadline - c.now < 3 * 3_600_000 ? "text-coral font-medium" : "text-white/50")}><Clock size={11} /> Vence en {until(e.deadline, c.now)}</div>
                  </div>
                  <ArrowRight size={16} className="text-white/30 group-hover:text-white transition-colors mt-3" />
                </Link></li>
              ))}
            </ul>
            {rest > SHOWN && <p className="mt-2 text-xs text-white/55">Los demás están en la Bandeja.</p>}
          </section>
        )}

        {aviso && (
          <div data-testid="hoy-aviso-simulador" className={clsx(glass, "mt-6 flex flex-wrap items-start gap-x-3 gap-y-2 px-4 py-3 text-sm leading-relaxed text-white/75")}>
            <Info size={15} className="mt-0.5 shrink-0 text-indigo-light" />
            <span className="min-w-0 flex-1 basis-[220px]">{aviso.text}</span>
            <span className="flex shrink-0 flex-wrap gap-x-4 gap-y-1">
              <Link href={aviso.href} className="font-semibold text-white/90 hover:text-white transition-colors">{aviso.cta} →</Link>
              <Link href="/ceo/ajustes" className="font-medium text-white/65 hover:text-white transition-colors">Ajustes →</Link>
            </span>
          </div>
        )}

        {/* las seis academias: actividad, no dominio */}
        <section data-testid="hoy-academias" aria-labelledby="hoy-academias-t" className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="hoy-academias-t" className="text-lg font-semibold">Las seis academias</h2>
            <Link href="/ceo/progreso" className="text-xs font-medium text-white/65 hover:text-white transition-colors">Mi progreso →</Link>
          </div>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => {
              const pct = r.lessonsTotal ? Math.round((r.lessonsDone / r.lessonsTotal) * 100) : 0;
              return (
                <li key={r.academy} data-academy={r.academy} className={clsx(glass, "p-4")}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold">{r.name}</h3>
                    {mine.has(r.academy) && <span className="chip shrink-0 bg-white/10 text-white text-[10px]">Tus temas</span>}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{r.blurb}</p>
                  <div className="mt-3 flex items-baseline justify-between gap-2 text-[12.5px] text-white/75">
                    <span>{r.lessonsTotal ? `${r.lessonsDone} de ${r.lessonsTotal} lecciones` : "Sin lecciones en Academy por ahora"}</span>
                    <span className="tabular-nums">{r.decisions} {r.decisions === 1 ? "decisión" : "decisiones"}</span>
                  </div>
                  {r.lessonsTotal > 0 && <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`${r.lessonsDone} de ${r.lessonsTotal} lecciones terminadas`}><div className="h-full rounded-full bg-indigo-light/80" style={{ width: `${pct}%` }} /></div>}
                </li>
              );
            })}
          </ul>
          <p data-testid="hoy-provisional" className="mt-3 text-[12.5px] leading-relaxed text-white/60">{AVANCE_PROVISIONAL} Lo que tus decisiones dejan ver de tu criterio está en <Link href="/ceo/perfil#liderazgo" className="font-medium text-white/85 underline decoration-white/30 underline-offset-2 hover:text-white">Mi liderazgo</Link>.</p>
        </section>

        {/* accesos */}
        <nav aria-label="Accesos" className="mt-8 flex flex-wrap gap-2.5">
          <Link href="/ceo/bandeja" className="btn border border-white/15 bg-white/[.06] text-white hover:bg-white/10 text-sm"><Inbox size={15} /> Bandeja</Link>
          <Link href="/ceo/academy" className="btn border border-white/15 bg-white/[.06] text-white hover:bg-white/10 text-sm"><BookOpen size={15} /> Academy</Link>
          {nextLesson && mision.kind !== "leccion" && <Link href={`/ceo/academy/${nextLesson.id}`} className="btn border border-white/15 bg-white/[.06] text-white hover:bg-white/10 text-sm min-w-0"><span className="truncate">Siguiente lección: {nextLesson.title}</span></Link>}
        </nav>

        {/* experiencias en revisión: solo las cuentas del equipo mêtis */}
        {c.testTools && (
          <section data-testid="hoy-revision" className="mt-8 rounded-2xl border border-dashed border-mint/40 bg-mint/[.06] p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <span className="h-9 w-9 shrink-0 rounded-xl bg-mint/15 text-mint grid place-items-center"><ClipboardCheck size={16} /></span>
              <div className="min-w-0 flex-1 basis-[240px]">
                <h2 className="text-sm font-semibold text-mint">{ACCESO_REVISION.title}</h2>
                <p className="mt-0.5 text-sm leading-relaxed text-white/70">{ACCESO_REVISION.text}</p>
              </div>
              <Link href={ACCESO_REVISION.href} className="btn border border-mint/40 text-mint hover:bg-mint/10 text-sm">{ACCESO_REVISION.cta} <ArrowRight size={14} /></Link>
            </div>
          </section>
        )}

        {nudge && (
          <section className={clsx(glass, "mt-6 px-4 py-3 flex flex-wrap items-center gap-3 academy-in")}>
            <span className="h-8 w-8 shrink-0 rounded-lg bg-white/10 grid place-items-center"><Briefcase size={15} /></span>
            <div className="flex-1 min-w-[180px] text-sm"><b>Cuéntanos tu experiencia</b> <span className="text-white/60">· cinco preguntas, cerca de un minuto. No cambia tu avance.</span></div>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => { track("aviso_perfil_pospuesto", { veces: (c.s.profileNudge?.dismissed ?? 0) + 1 }); c.snoozeProfile(); }} className="btn text-white/70 hover:text-white text-xs">Ahora no</button>
              <Link href="/ceo/experiencia" className="btn bg-white text-ink hover:bg-white/90 text-xs font-semibold">Completar perfil</Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
