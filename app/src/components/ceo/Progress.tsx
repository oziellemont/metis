"use client";
import { useMemo } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, CalendarDays, ChartColumn, ListChecks } from "lucide-react";
import { useCeo } from "./CeoProvider";
import { Flame } from "./ui";
import { LESSONS } from "@/lib/ceo/lessons";
import { MIN_PRIORITY_TOPICS } from "@/lib/ceo/metis2/academias";
import { decidedOf, practiceByAcademy, practiceTotals, topicAcademies, topicNames, weekGoalText } from "@/lib/ceo/metis2/entrada";

/**
 * Mi progreso (MÊTIS 2.0, entrega 3.6): la constancia y lo practicado en cada una de las seis academias.
 * Todo lo que aparece aquí es un conteo de actividad (lecciones terminadas y decisiones tomadas). No mide dominio,
 * no sube niveles y no acredita nada: lo que las decisiones dejan ver está en Mi perfil, en Mi liderazgo.
 */
export function Progress() {
  const c = useCeo();
  const topics = c.s.profile?.topics ?? [];
  const rows = useMemo(() => practiceByAcademy({
    lessonIds: LESSONS.map((l) => l.id),
    lessonsDone: c.s.lessons,
    decided: decidedOf(c.s),
    dilemmaIds: Object.keys(c.s.dilemmas ?? {}),
  }), [c.s]);
  const totals = practiceTotals(rows);
  const mine = topicAcademies(topics);
  const names = topicNames(topics);
  const daysOn = c.streak.week.filter((d) => d.on).length;

  return (
    <div className="space-y-5" data-testid="mi-progreso">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-8 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div className="relative">
          <div className="text-xs text-white/60">Mi progreso</div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold leading-tight">Lo que has practicado</h1>
          <p className="mt-2 max-w-xl text-sm text-white/75">Tu constancia y tu práctica en cada academia. Aquí se cuenta lo que has hecho; no es una calificación.</p>
          <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="progreso-totales">
            {([
              ["Días de racha", c.streak.days, `Mejor racha: ${c.streak.best}`],
              ["XP", c.xp, "Tu práctica diaria"],
              ["Decisiones", totals.decisions, "En casos y dilemas"],
              ["Lecciones", totals.lessonsDone, `De ${totals.lessonsTotal} en Academy`],
            ] as const).map(([k, v, hint]) => (
              <div key={k} className="rounded-2xl bg-white/10 p-4">
                <dt className="text-[11px] text-white/60">{k}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums inline-flex items-center gap-1.5">{k === "Días de racha" && <Flame on={c.streak.days > 0} size={18} white />}{v}</dd>
                <div className="mt-0.5 text-[11px] text-white/50">{hint}</div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="card p-5 sm:p-6" data-testid="progreso-constancia">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><CalendarDays size={16} /></span>
          <div className="flex-1 min-w-0"><h2 className="font-semibold text-ink">Tu constancia</h2><p className="text-xs text-slate-400">Los últimos siete días. Es tu hábito, no un requisito.</p></div>
        </div>
        <ol className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Últimos siete días">
          {c.streak.week.map((d) => (
            <li key={d.key} className="text-center">
              <span aria-hidden className={clsx("mx-auto block h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2", d.on ? "border-indigo bg-indigo" : d.paused ? "border-dashed border-slate-300 bg-slate-50" : "border-slate-200 bg-white", d.today && "ring-4 ring-indigo-soft")} />
              <span className={clsx("mt-1.5 block text-[11px]", d.today ? "font-semibold text-ink" : "text-slate-500")}>{d.label}</span>
              <span className="sr-only">{d.on ? "practicaste" : d.paused ? "en pausa" : "sin práctica"}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-slate-600" data-testid="progreso-meta">{weekGoalText(daysOn, c.s.profile?.days)}</p>
        {!c.s.profile?.days && <p className="mt-1 text-xs text-slate-500">Puedes ponerte una meta de días por semana en <Link href="/ceo/perfil#temas" className="font-medium text-indigo">Mi perfil</Link>.</p>}
      </section>

      <section className="card p-5 sm:p-6" data-testid="progreso-academias">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><ChartColumn size={16} /></span>
          <div className="flex-1 min-w-0"><h2 className="font-semibold text-ink">Tu práctica por academia</h2><p className="text-xs text-slate-400">Lecciones terminadas y decisiones tomadas en cada una.</p></div>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map((r) => {
            const pct = r.lessonsTotal ? Math.round((r.lessonsDone / r.lessonsTotal) * 100) : 0;
            return (
              <li key={r.academy} data-academy={r.academy} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">{r.name}</h3>
                  {mine.has(r.academy) && <span className="chip shrink-0 bg-indigo-soft text-indigo text-[10px]">Tus temas</span>}
                </div>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{r.blurb}</p>
                <div className="mt-3 flex items-baseline justify-between gap-2 text-[12.5px]">
                  <span className="text-slate-600">{r.lessonsTotal ? `${r.lessonsDone} de ${r.lessonsTotal} lecciones` : "Sin lecciones en Academy por ahora"}</span>
                  <span className="text-slate-600 tabular-nums">{r.decisions} {r.decisions === 1 ? "decisión" : "decisiones"}</span>
                </div>
                {r.lessonsTotal > 0 && <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={`${r.lessonsDone} de ${r.lessonsTotal} lecciones terminadas`}><div className="h-full rounded-full bg-indigo/60 transition-all duration-700" style={{ width: `${pct}%` }} /></div>}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-[12.5px] leading-relaxed text-slate-600" data-testid="progreso-aviso">Esto cuenta actividad: lecciones que terminaste y decisiones que tomaste. No acredita dominio ni sube niveles. Lo que tus decisiones dejan ver de tu criterio está en <Link href="/ceo/perfil#liderazgo" className="font-medium text-indigo">Mi liderazgo</Link>.</p>
      </section>

      <section className="card p-5 sm:p-6" data-testid="progreso-temas">
        <div className="flex flex-wrap items-center gap-3">
          <span className="h-9 w-9 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><ListChecks size={16} /></span>
          <div className="flex-1 min-w-0"><h2 className="font-semibold text-ink">Tus temas</h2><p className="text-xs text-slate-400">Lo que elegiste practicar primero. Ordena lo que te recomendamos.</p></div>
          <Link href="/ceo/perfil#temas" className={names.length >= MIN_PRIORITY_TOPICS ? "inline-flex items-center gap-1 text-xs font-medium text-indigo" : "btn-primary text-sm"}>{names.length >= MIN_PRIORITY_TOPICS ? "Cambiar" : "Elegir mis temas"} <ArrowRight size={13} /></Link>
        </div>
        {names.length > 0
          ? <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tus temas">{names.map((n) => <li key={n} className="chip bg-indigo-soft text-indigo text-[12px] py-1">{n}</li>)}</ul>
          : <p className="mt-4 text-sm text-slate-500">Elige al menos {MIN_PRIORITY_TOPICS} temas en Mi perfil y aquí verás cuáles academias los trabajan.</p>}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/ceo/academy" className="btn-primary">Ir a Academy <ArrowRight size={15} /></Link>
        <Link href="/ceo/bandeja" className="btn-ghost">Ver mi bandeja</Link>
      </div>
    </div>
  );
}
