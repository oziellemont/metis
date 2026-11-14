"use client";
import { IndustryGlossary } from "./empresa/Relocated";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, BookOpen, ChartColumn, Check, Clock, Compass, Play, Settings2, ShieldCheck, TrendingUp, Trophy, Users } from "lucide-react";
import { BlockView } from "@/components/academy/Blocks";
import { lessonById, type Lesson } from "@/lib/ceo/lessons";
import { nextLessonXp } from "@/lib/ceo/engine";
import { CONCEPTS, CONCEPT_LESSON } from "@/lib/ceo/concepts";
import { celebrate } from "@/lib/ceo/celebrate";
import { ACADEMIES, academyById, tramoOf, type AcademyId } from "@/lib/ceo/metis2/academias";
import { tagOf } from "@/lib/ceo/metis2/clasificacion";
import { topicAcademies } from "@/lib/ceo/metis2/entrada";
import { LECCIONES_RUTA, ordenLecciones } from "@/lib/ceo/metis2/ruta";
import { useCeo } from "./CeoProvider";
import { Stage, StepTitle } from "./Stage";

const ACADEMY_ICON: Record<AcademyId, typeof Compass> = { estrategia: Compass, finanzas: ChartColumn, liderazgo: Users, operaciones: Settings2, crecimiento: TrendingUp, riesgo: ShieldCheck };

/**
 * Academy (MÊTIS 2.0, Directiva v1.1, referencia R7): las seis academias como botones; debajo, el recorrido de la
 * academia elegida y, a la derecha, la biblioteca de conceptos. El orden del recorrido sale de la misma regla que el
 * camino de Hoy (`lib/ceo/metis2/ruta.ts`). La teoría nunca se bloquea: no hay candados por XP, racha ni rango; si
 * conviene trabajar algo antes, solo se dice.
 */
export function CeoAcademyHome() {
  const c = useCeo();
  const mine = topicAcademies(c.s.profile?.topics ?? []);
  const orden = useMemo(() => ordenLecciones({ hechas: c.s.lessons, intereses: [...mine] }), [c.s.lessons]);
  const first = orden[0]?.leccion.academy ?? [...mine][0] ?? "estrategia";
  const [sel, setSel] = useState<AcademyId>(first);
  const academy = academyById(sel);
  const hechas = LECCIONES_RUTA.filter((l) => l.academy === sel && c.s.lessons[l.id]).sort((a, b) => c.s.lessons[a.id] - c.s.lessons[b.id]);
  const pendientes = orden.filter((x) => x.leccion.academy === sel);
  const conceptos = useMemo(() => Object.values(CONCEPTS).filter((k) => tagOf("concepto", k.id)?.academy === sel).sort((a, b) => a.name.localeCompare(b.name, "es")), [sel]);
  const total = hechas.length + pendientes.length;

  return (
    <div data-testid="academy">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">Academy</h1>
      <p className="mt-2 text-[15px] text-slate-500">Seis disciplinas. Un criterio ejecutivo integral.</p>

      <div role="group" aria-label="Academias" className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="academy-academias">
        {ACADEMIES.map((a) => {
          const Icon = ACADEMY_ICON[a.id];
          const on = a.id === sel;
          return (
            <button key={a.id} type="button" aria-pressed={on} onClick={() => setSel(a.id)} className={clsx("flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-all", on ? "border-indigo bg-indigo-soft text-indigo" : "border-slate-200 bg-white text-ink hover:border-indigo/40")}>
              <Icon size={20} aria-hidden className={on ? "text-indigo" : "text-slate-500"} />
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold leading-tight">{a.name}</span>
                {mine.has(a.id) && <span className="block text-[11.5px] font-medium text-sob">De tus temas</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0" aria-labelledby="academy-ruta-t" data-testid="academy-recorrido" data-academy={sel}>
          <h2 id="academy-ruta-t" className="text-xl font-semibold text-ink">{academy.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{total ? `${hechas.length} de ${total} lecciones completadas` : "Esta academia aún no tiene lecciones publicadas. Sus conceptos están a la derecha."}</p>
          <ol className="mt-5 space-y-2.5">
            {hechas.map((l) => (
              <li key={l.id} data-state="completada">
                <Link href={`/ceo/academy/${l.id}`} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white">
                  <span className="h-8 w-8 shrink-0 rounded-full bg-mint text-white grid place-items-center"><Check size={16} strokeWidth={3} aria-hidden /></span>
                  <span className="min-w-0 flex-1"><span className="sr-only">Completada: </span><span className="block truncate text-[15px] font-medium text-ink">{l.title}</span><span className="block text-xs text-slate-500">{l.minutes} min · {tramoOf(l.level).name}</span></span>
                </Link>
              </li>
            ))}
            {pendientes.map(({ leccion: l, conviene }, k) => k === 0 ? (
              <li key={l.id} data-state="recomendada">
                <Link href={`/ceo/academy/${l.id}`} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-indigo bg-white px-3 py-3.5 shadow-sm">
                  <span className="h-8 w-8 shrink-0 rounded-full bg-indigo text-white grid place-items-center"><Play size={14} aria-hidden /></span>
                  <span className="min-w-0 flex-1 basis-[180px]"><span className="block text-[15px] font-semibold text-ink">{l.title}</span><span className="block text-xs text-slate-500">{l.minutes} min · {tramoOf(l.level).name}{conviene ? ` · Conviene antes: ${conviene}` : ""}</span></span>
                  <span className="btn-primary text-sm">Empezar <ArrowRight size={14} /></span>
                </Link>
              </li>
            ) : (
              <li key={l.id} data-state="disponible">
                <Link href={`/ceo/academy/${l.id}`} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white">
                  <span className="h-8 w-8 shrink-0 rounded-full border-2 border-slate-300 bg-white" aria-hidden />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-medium text-slate-700">{l.title}</span><span className="block text-xs text-slate-500">{l.minutes} min · {tramoOf(l.level).name}{conviene ? ` · Conviene antes: ${conviene}` : ""}</span></span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-4">
          <section id="conceptos" aria-labelledby="academy-conceptos-t" className="card p-5" data-testid="academy-conceptos">
            <div className="flex items-start gap-3">
              <span className="h-10 w-10 shrink-0 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><BookOpen size={18} aria-hidden /></span>
              <div className="min-w-0"><h2 id="academy-conceptos-t" className="font-semibold text-ink">Biblioteca de conceptos</h2><p className="mt-0.5 text-sm text-slate-500">Consulta teoría, conceptos y glosarios cuando quieras.</p></div>
            </div>
            {conceptos.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100">
                {conceptos.map((k) => (
                  <li key={k.id}>
                    <details className="group py-2.5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-ink">{k.name}<ArrowRight size={13} aria-hidden className="shrink-0 text-slate-400 transition-transform group-open:rotate-90" /></summary>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{k.definition}</p>
                      {CONCEPT_LESSON[k.id] && lessonById(CONCEPT_LESSON[k.id]) && <Link href={`/ceo/academy/${CONCEPT_LESSON[k.id]}`} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo">Lección: {lessonById(CONCEPT_LESSON[k.id])!.title} <ArrowRight size={12} /></Link>}
                    </details>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-slate-500">Esta academia no tiene conceptos en la biblioteca.</p>}
          </section>

          {/* Executive Challenge: su contenido sigue en revisión. Solo lo ven las cuentas del equipo mêtis. */}
          {c.testTools && (
            <Link href="/ceo/piloto" className="card p-5 flex items-start gap-3 transition-colors hover:bg-slate-50" data-testid="academy-reto">
              <span className="h-10 w-10 shrink-0 rounded-xl bg-amber-soft text-amber grid place-items-center"><Trophy size={18} aria-hidden /></span>
              <span className="min-w-0"><span className="block font-semibold text-ink">Executive Challenge</span><span className="mt-0.5 block text-sm text-slate-500">Solo para revisión. No cuenta para nadie.</span></span>
            </Link>
          )}

          <p className="text-xs text-slate-500">¿Quieres cambiar tus temas o tu experiencia? <Link href="/ceo/perfil#experiencia" className="font-medium text-indigo">Mi perfil</Link></p>
        </div>
      </div>

      <div className="mt-8"><IndustryGlossary /></div>
    </div>
  );
}

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const c = useCeo();
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from");
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  /** XP que pagó esta lección al terminarla (null = era un repaso). */
  const [gained, setGained] = useState<number | null>(null);
  const onReady = useCallback((ok: boolean) => setReady(ok), []);
  // La siguiente lección sale de la misma regla que el camino de Hoy. La teoría no se bloquea: no hay candado por XP.
  const nextId = ordenLecciones({ hechas: { ...c.s.lessons, [lesson.id]: c.s.lessons[lesson.id] ?? 1 }, intereses: [...topicAcademies(c.s.profile?.topics ?? [])] })[0]?.leccion.id;
  const next = nextId ? lessonById(nextId) : undefined;

  const advance = () => {
    setReady(false);
    if (i < lesson.blocks.length - 1) setI(i + 1);
    else {
      const first = !c.s.lessons[lesson.id];
      if (first) celebrate("lesson");
      setGained(first ? nextLessonXp(c.s, c.now) : null);
      c.completeLesson(lesson.id); setDone(true);
    }
  };

  const exit = from ? `/ceo/caso/${from}` : "/ceo/academy";
  const steps = [...lesson.blocks.map((b) => b.eyebrow), "Listo"];

  if (done) return (
    <Stage steps={steps} at={steps.length - 1} exit={exit} top={gained ? <span className="chip bg-mint/20 text-mint text-xs font-semibold">+{gained} XP</span> : undefined}>
      <div className="text-center">
        <span className="mx-auto h-16 w-16 rounded-2xl bg-white text-indigo grid place-items-center ceo-pop"><Check size={28} strokeWidth={2.6} /></span>
        <div className="mt-6"><StepTitle eyebrow={lesson.part} title="Lección completada" text={gained === null ? "Repaso hecho. La teoría se vuelve criterio cuando la aplicas." : gained > 0 ? `+${gained} XP de constancia. Tu racha de hoy está encendida.` : "Ya sumaste el XP de lecciones de hoy. Cuenta para tu racha y tu dominio."} /></div>
        <div className="mt-8 flex flex-col gap-2 max-w-sm mx-auto">
          {from && <button onClick={() => router.push(`/ceo/caso/${from}`)} className="btn bg-white text-ink hover:bg-white/90 px-5 py-3 font-semibold justify-center">Volver al caso <ArrowRight size={14} /></button>}
          {c.pending[0] && <button onClick={() => router.push(`/ceo/caso/${c.pending[0].item.id}`)} className={clsx("btn px-5 py-3 font-semibold justify-center", from ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-ink hover:bg-white/90")}>Atender pendiente <ArrowRight size={14} /></button>}
          {next && <button onClick={() => router.push(`/ceo/academy/${next.id}`)} className="btn bg-white/10 text-white hover:bg-white/20 px-5 py-3 justify-center">Siguiente: {next.title}</button>}
          <Link href="/ceo" className="btn bg-white/10 text-white hover:bg-white/20 px-5 py-3 justify-center">Ir a Hoy</Link>
        </div>
      </div>
    </Stage>
  );

  return (
    <Stage
      steps={steps}
      at={i}
      exit={exit}
      top={<span className="chip bg-white/10 text-white/80 text-xs"><Clock size={12} /> {lesson.minutes} min</span>}
      onBack={i > 0 ? () => setI(i - 1) : undefined}
      onNext={advance}
      nextOff={!ready}
      next={i === lesson.blocks.length - 1 ? "Terminar lección" : "Continuar"}
      aside={!ready ? <span className="text-[11px] text-white/55">Completa la interacción para continuar</span> : undefined}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-mint">Academy · {lesson.part}</div>
      <h1 className="mt-2 text-xl sm:text-2xl font-semibold leading-tight">{lesson.title}</h1>
      <div className="mt-6 rounded-3xl bg-white text-ink p-5 sm:p-8 shadow-xl"><BlockView block={lesson.blocks[i]} onReady={onReady} /></div>
    </Stage>
  );
}
