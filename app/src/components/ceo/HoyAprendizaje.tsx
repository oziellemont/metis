"use client";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import clsx from "clsx";
import { ArrowRight, BookOpen, Briefcase, Check, Coffee, Info, Lock, Trophy } from "lucide-react";
import { growthDayOf } from "@/lib/ceo/engine";
import { isRetailLog, isSteelLog, pendingGrowth, retailPendingOf, steelPendingOf } from "@/lib/ceo/growth/session";
import { LESSONS, lessonById } from "@/lib/ceo/lessons";
import { boardAccess } from "@/lib/ceo/board";
import { crisisAccess } from "@/lib/ceo/crisis";
import { specialTasks } from "@/lib/ceo/today";
import { nudgeQuiet, shouldNudge } from "@/lib/ceo/profile";
import { track } from "@/lib/ceo/events";
import { tagOf, tagOfItem } from "@/lib/ceo/metis2/clasificacion";
import { decidedOf, practiceByAcademy, topicAcademies } from "@/lib/ceo/metis2/entrada";
import { ACCESO_REVISION, APRENDIZAJE_COMPLETADO, DOMINIO_PENDIENTE, avisoSimulador } from "@/lib/ceo/metis2/hoy";
import { caminoDelDia, repasoRecomendado, ultimaCompletada } from "@/lib/ceo/metis2/ruta";
import { useCeo } from "./CeoProvider";
import { DilemmaPrompt } from "./DilemmaPrompt";
import { Flame, until } from "./ui";

/**
 * Hoy con el simulador de empresas apagado (MÊTIS 2.0, Directiva v1.1, entregas 3.3 y 3.6).
 *
 * Dos zonas, como el Hoy anterior. A la izquierda, el camino: lo último que terminaste, «Tu siguiente paso» con un solo
 * botón y, sin caja, las dos estaciones que siguen. A la derecha, el panel blanco: aprendizaje completado en las seis
 * academias (actividad, no dominio), el enlace a Mi progreso y un repaso si hay de dónde sacarlo.
 * No hay lista de pendientes ni contador. El orden lo decide `lib/ceo/metis2/ruta.ts`, la misma regla que usa Academy.
 * El hito del Executive Challenge lo ven solo las cuentas del equipo mêtis, porque su contenido sigue en revisión.
 */
export function HoyAprendizaje() {
  const c = useCeo();
  const first = c.s.name.split(" ")[0] || "";
  const hr = new Date(c.now).getHours();
  const hello = hr < 12 ? "Buenos días" : hr < 19 ? "Buenas tardes" : "Buenas noches";
  const fecha = new Date(c.now).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const mine = topicAcademies(c.s.profile?.topics ?? []);
  const academyOfCase = (id: string) => tagOfItem(c.s.company, id)?.academy;

  // Lo último que terminaste: lección, caso o caso ejecutivo.
  const last = useMemo(() => ultimaCompletada([
    ...Object.entries(c.s.lessons).map(([id, at]) => ({ at, title: lessonById(id)?.title ?? "", academy: tagOf("leccion", id)?.academy })),
    ...c.entries.filter((e) => e.status === "decidido").map((e) => ({ at: e.decision?.at ?? 0, title: e.item.subject, academy: academyOfCase(e.item.id) })),
    ...c.episodes.filter((e) => e.status === "cerrado").map((e) => ({ at: e.run?.closedAt ?? 0, title: e.spec.subject, academy: undefined })),
  ].filter((x) => x.title)), [c.s.lessons, c.entries, c.episodes]);

  const camino = caminoDelDia({
    casos: c.pending.map((e) => ({ id: e.item.id, subject: e.item.subject, academy: academyOfCase(e.item.id), due: until(e.deadline, c.now) })),
    episodios: c.episodes.filter((e) => e.status === "pendiente").map((e) => ({ id: e.spec.id, subject: e.spec.subject, minutes: e.spec.minutes, started: !!e.run })),
    hechas: c.s.lessons,
    intereses: [...mine],
    ultimaAcademia: last?.academy,
  });
  const paso = camino.actual;
  const repaso = repasoRecomendado(c.s.lessons, c.now);

  // Asuntos propios del simulador: aquí solo se cuentan, sin cifras de la empresa.
  const growthPending = useMemo(() => {
    const g = c.s.growth;
    if (!g) return 0;
    const day = growthDayOf(c.s, c.now);
    if (isRetailLog(g)) return retailPendingOf(g, day) ? 1 : 0;
    if (isSteelLog(g)) return steelPendingOf(g, day) ? 1 : 0;
    return pendingGrowth(g, day).length;
  }, [c.s, c.now]);
  const specials = specialTasks({ changeOpen: c.changeOpen && !c.seasonDone, changeStarted: !!c.change, changeDone: !!c.change?.done, changeTitle: c.pack.change.title, boardOpen: boardAccess(c.s, c.now).open, crisisOpen: crisisAccess(c.s, c.now).open });
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
  const done = rows.reduce((n, r) => n + r.lessonsDone, 0);
  const total = rows.reduce((n, r) => n + r.lessonsTotal, 0);

  const nudge = shouldNudge(c.s, c.now) && !nudgeQuiet(c.pending, c.now) && !c.seasonDone;
  useEffect(() => { if (nudge) track("aviso_perfil_visto"); }, [nudge]);

  const glass = "rounded-2xl border bg-white/[.06] border-white/[.12]";

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px] lg:min-h-screen text-white" data-testid="hoy-aprendizaje">
      {/* el camino: fondo mêtis */}
      <div className="relative min-w-0 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-light/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-mint/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-5 sm:px-8 xl:px-12 pt-6 pb-8 lg:pt-7 lg:pb-10">
          <div className="flex items-center justify-between gap-4 text-sm text-white/70">
            <span className="first-letter:uppercase">{fecha}</span>
            {/* La racha es hábito, no requisito. En el celular ya va en la barra de arriba. */}
            <span className={clsx("hidden lg:inline-flex items-center gap-1.5", c.streak.atRisk && !c.streak.doneToday ? "text-amber" : "text-white/85")} data-testid="hoy-racha">
              <Flame on={c.streak.days > 0 && c.streak.doneToday} size={16} /> <b className="font-semibold tabular-nums">{c.streak.days}</b> {c.streak.days === 1 ? "día" : "días"} de racha
            </span>
          </div>

          {c.cadence === "quiet_day" ? (
            <section className={clsx(glass, "mt-4 p-4 flex flex-wrap items-center gap-3 text-sm")}>
              <span className="h-9 w-9 shrink-0 rounded-xl bg-mint/15 text-mint grid place-items-center"><Coffee size={16} /></span>
              <span className="flex-1 min-w-0"><b className="text-white">Hoy es tu día tranquilo.</b> <span className="text-white/65">No llegan casos nuevos.</span></span>
              <button type="button" onClick={c.resumeCareer} className="btn text-white/70 hover:text-white">Volver al ritmo normal</button>
            </section>
          ) : <DilemmaPrompt />}

          <section className="academy-in mt-8 lg:mt-12">
            <div className="text-xs font-semibold uppercase tracking-[.18em] text-indigo-light">Tu camino ejecutivo</div>
            <h1 className="mt-3 text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">{first ? `${hello}, ${first}.` : `${hello}.`}</h1>
          </section>

          {/* el camino */}
          <ol data-testid="hoy-camino" data-ruta={camino.version} aria-label="Tu camino" className="relative mt-9 space-y-5 before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-px before:bg-white/20">
            {last && (
              <li data-testid="hoy-completado" className="relative flex items-center gap-4">
                <span className="relative z-10 h-9 w-9 shrink-0 rounded-full bg-mint text-[#0F1130] grid place-items-center"><Check size={18} strokeWidth={3} aria-hidden /></span>
                <span className="min-w-0 truncate text-[15px] text-white/80"><span className="sr-only">Completado: </span>{last.title}</span>
              </li>
            )}
            {paso ? (
              <li className="relative flex gap-4">
                <span aria-hidden className="relative z-10 mt-6 h-9 w-9 shrink-0 rounded-full bg-indigo-light ring-[6px] ring-indigo-light/25" />
                <section data-testid="hoy-mision" data-mision={paso.kind} aria-labelledby="hoy-paso-t" className="min-w-0 flex-1 rounded-3xl border border-white/[.16] bg-white/[.08] p-5 sm:p-7 backdrop-blur">
                  <div className="text-[11px] font-semibold uppercase tracking-[.22em] text-white/60">{paso.cta === "Continuar" ? "Continúa tu aprendizaje" : "Tu siguiente paso"}</div>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                    <div className="min-w-0 basis-[240px] flex-1">
                      <h2 id="hoy-paso-t" className="text-2xl sm:text-[28px] font-semibold leading-tight">{paso.title}</h2>
                      <p className="mt-2 text-[15px] text-white/70">{paso.meta}</p>
                    </div>
                    <Link href={paso.href} className="btn bg-white text-ink hover:bg-white/90 px-5 py-3 text-[15px] font-semibold">{paso.cta} <ArrowRight size={16} /></Link>
                  </div>
                </section>
              </li>
            ) : (
              <li className="relative flex gap-4">
                <span aria-hidden className="relative z-10 mt-6 h-9 w-9 shrink-0 rounded-full bg-indigo-light ring-[6px] ring-indigo-light/25" />
                <section data-testid="hoy-mision" data-mision="academy" className="min-w-0 flex-1 rounded-3xl border border-white/[.16] bg-white/[.08] p-5 sm:p-7">
                  <div className="text-[11px] font-semibold uppercase tracking-[.22em] text-white/60">Tu siguiente paso</div>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                    <h2 className="text-2xl font-semibold leading-tight">Explora Academy</h2>
                    <Link href="/ceo/academy" className="btn bg-white text-ink hover:bg-white/90 px-5 py-3 text-[15px] font-semibold">Explorar <ArrowRight size={16} /></Link>
                  </div>
                </section>
              </li>
            )}
            {camino.siguientes.map((p) => (
              <li key={p.key} data-testid="hoy-siguiente" className="relative flex items-start gap-4">
                <span aria-hidden className="relative z-10 mt-0.5 h-9 w-9 shrink-0 grid place-items-center"><span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 bg-[#1A1650]" /></span>
                <Link href={p.href} className="group min-w-0 flex-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 rounded-xl py-1">
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium text-white/80 group-hover:text-white transition-colors">{p.title}</span>
                    <span className="block text-[13px] text-white/60">{p.meta}</span>
                  </span>
                  {p.conviene && <span className="text-[12.5px] text-white/60">Conviene antes: {p.conviene}</span>}
                </Link>
              </li>
            ))}
          </ol>
          <div className="mt-5 text-right">
            <Link href="/ceo/academy" className="text-sm font-medium text-white/75 hover:text-white transition-colors">Ver mi camino en Academy →</Link>
          </div>

          {/* Executive Challenge: hito aparte. Su contenido sigue en revisión: solo lo ven las cuentas del equipo. */}
          {c.testTools && (
            <section data-testid="hoy-revision" className="mt-8 border-t border-white/10 pt-6">
              <Link href={ACCESO_REVISION.href} className="group flex items-center gap-4">
                <span className="h-11 w-11 shrink-0 rounded-xl bg-white/10 text-amber grid place-items-center"><Trophy size={20} aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">Executive Challenge</span>
                  <span className="block text-[13px] text-white/60">{ACCESO_REVISION.title} · no cuenta para nadie</span>
                </span>
                <Lock size={16} className="shrink-0 text-white/50" aria-label="En revisión" />
              </Link>
            </section>
          )}

          {aviso && (
            <div data-testid="hoy-aviso-simulador" className={clsx(glass, "mt-8 flex flex-wrap items-start gap-x-3 gap-y-2 px-4 py-3 text-sm leading-relaxed text-white/75")}>
              <Info size={15} className="mt-0.5 shrink-0 text-indigo-light" />
              <span className="min-w-0 flex-1 basis-[220px]">{aviso.text}</span>
              <span className="flex shrink-0 flex-wrap gap-x-4 gap-y-1">
                <Link href={aviso.href} className="font-semibold text-white/90 hover:text-white transition-colors">{aviso.cta} →</Link>
                <Link href="/ceo/ajustes" className="font-medium text-white/65 hover:text-white transition-colors">Ajustes →</Link>
              </span>
            </div>
          )}

          {nudge && (
            <section className={clsx(glass, "mt-6 px-4 py-3 flex flex-wrap items-center gap-3 academy-in")}>
              <span className="h-8 w-8 shrink-0 rounded-lg bg-white/10 grid place-items-center"><Briefcase size={15} /></span>
              <div className="flex-1 min-w-[180px] text-sm"><b>Cuéntanos tu experiencia</b> <span className="text-white/60">· cerca de un minuto</span></div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => { track("aviso_perfil_pospuesto", { veces: (c.s.profileNudge?.dismissed ?? 0) + 1 }); c.snoozeProfile(); }} className="btn text-white/70 hover:text-white text-xs">Ahora no</button>
                <Link href="/ceo/experiencia" className="btn bg-white text-ink hover:bg-white/90 text-xs font-semibold">Completar perfil</Link>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* panel blanco: aprendizaje completado, no dominio */}
      <aside data-testid="hoy-academias" aria-labelledby="hoy-criterio-t" className="relative mx-3 mb-4 lg:m-0 rounded-3xl lg:rounded-none lg:rounded-l-[28px] bg-white text-ink px-5 sm:px-7 py-6 lg:py-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto shadow-[0_0_60px_-20px_rgba(15,17,48,.6)]">
        <h2 id="hoy-criterio-t" className="text-lg font-semibold">Tu criterio ejecutivo</h2>
        <div className="mt-4 text-4xl font-semibold tabular-nums tracking-tight">{done}<span className="text-slate-400">/{total}</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-soft" aria-hidden><div className="h-full rounded-full bg-indigo" style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }} /></div>
        <p className="mt-2 text-sm font-medium text-slate-600">{APRENDIZAJE_COMPLETADO}</p>
        <ul className="mt-6 space-y-4">
          {rows.map((r) => (
            <li key={r.academy} data-academy={r.academy}>
              <div className="flex items-baseline justify-between gap-2 text-sm"><span className="font-medium">{r.name}</span><span className="tabular-nums text-slate-500">{r.lessonsDone}/{r.lessonsTotal}</span></div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${r.name}: ${r.lessonsDone} de ${r.lessonsTotal} lecciones completadas`}><div className="h-full rounded-full bg-indigo" style={{ width: `${r.lessonsTotal ? Math.round((r.lessonsDone / r.lessonsTotal) * 100) : 0}%` }} /></div>
            </li>
          ))}
        </ul>
        <p data-testid="hoy-provisional" className="mt-5 text-[13px] text-slate-500">{DOMINIO_PENDIENTE}</p>
        <Link href="/ceo/progreso" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo hover:text-indigo-light transition-colors">Ver mi progreso <ArrowRight size={14} /></Link>
        {repaso && (
          <Link href={`/ceo/academy/${repaso.id}`} data-testid="hoy-repaso" className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-100 p-4 transition-colors hover:bg-slate-50 group">
            <span className="h-10 w-10 shrink-0 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><BookOpen size={18} aria-hidden /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-[.16em] text-slate-500">Repaso recomendado</span>
              <span className="mt-0.5 block text-sm font-semibold">{repaso.title}</span>
            </span>
            <ArrowRight size={15} className="text-slate-300 group-hover:text-indigo transition-colors" />
          </Link>
        )}
      </aside>
    </div>
  );
}
