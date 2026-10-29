"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, Check, Clock, Coins, Compass, Flag, Flame as FlameIcon, GraduationCap, Handshake, Layers, Lock, MessagesSquare, Rocket, Target, Users, Zap } from "lucide-react";
import { BlockView } from "@/components/academy/Blocks";

import { LESSONS, MAX_TRACK_LEVEL, TRACKS, lessonsOfTrack, rankOf, trackOf, type Lesson } from "@/lib/ceo/lessons";
import { LEVELS, nextLessonXp, rankFor } from "@/lib/ceo/engine";
import { TRACK_TO } from "@/lib/ceo/mastery";
import { celebrate } from "@/lib/ceo/celebrate";
import { useCeo } from "./CeoProvider";
import { Stage, StepTitle } from "./Stage";
import { personalized, trackHints } from "@/lib/ceo/profile";

const ICON = { compass: Compass, users: Users, flag: Flag, message: MessagesSquare, handshake: Handshake, coins: Coins, flame: FlameIcon, rocket: Rocket, target: Target, layers: Layers };

export function CeoAcademyHome() {
  const c = useCeo();
  const rank = rankFor(c.s, c.now);
  const open = LESSONS.filter((l) => rankOf(l) <= rank);
  const done = LESSONS.filter((l) => c.s.lessons[l.id]).length;
  const pct = Math.round((done / Math.max(1, open.length)) * 100);
  const lessonXp = nextLessonXp(c.s, c.now);
  const nextRank = LEVELS[rank + 1];
  const unlockNext = nextRank ? LESSONS.filter((l) => rankOf(l) === rank + 1).length : 0;
  const focus = c.journey.focus;
  const fm = focus ? c.mastery[focus] : null;
  const forYou = personalized(c.s);
  const [order, setOrder] = useState<"ti" | "todas">("ti");
  const hints = forYou ? trackHints(c.s.profile, c.mastery, c.s.diagnostic, TRACK_TO, TRACKS.map((t) => t.id)) : [];
  const hintOf = new Map(hints.map((h, i) => [h.track, { ...h, top: i < 3 }]));
  const tracks = forYou && order === "ti" ? hints.map((h) => TRACKS.find((t) => t.id === h.track)!) : TRACKS;
  const focusLesson = focus ? LESSONS.find((l) => rankOf(l) <= rank && !c.s.lessons[l.id] && (TRACK_TO[trackOf(l).track] ?? []).includes(focus)) : undefined;
  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-9 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium"><GraduationCap size={14} /> mêtis Academy · Ruta CEO</div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-semibold leading-tight">Aprender a dirigir no se termina.</h1>
            <p className="mt-3 text-white/70 max-w-lg text-[15px] leading-relaxed">Cada tema es una ruta de habilidad con niveles. Empiezas por lo esencial y, con tu constancia, se abren lecciones más profundas. Primero decides con tu instinto; luego entiendes por qué.</p>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur p-5">
            <div className="flex items-baseline justify-between"><span className="text-xs text-white/60">Lecciones abiertas</span><span className="text-sm font-semibold tabular-nums">{done} de {open.length}</span></div>
            <div className="mt-2 h-2 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-indigo-light to-white transition-all duration-700" style={{ width: `${Math.min(100, pct)}%` }} /></div>
            <p className="mt-3 text-[11px] text-white/60">{nextRank ? `Al reunir ${nextRank.min} XP de constancia se abren ${unlockNext} lecciones nuevas.` : "Tienes todo abierto. Cada temporada llegan niveles nuevos."} {lessonXp > 0 ? ` +${lessonXp} XP por lección.` : " Hoy ya sumaste el XP de lecciones."}</p>
          </div>
        </div>
      </section>

      {focus && fm && c.journey.next && (
        <section className="mt-6 card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="h-11 w-11 shrink-0 rounded-2xl bg-indigo-soft text-indigo grid place-items-center"><Target size={20} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400">Tu enfoque para {c.journey.next.name}</div>
            <div className="mt-0.5 font-semibold text-ink">{fm.name} · {fm.value} · {fm.level.name}</div>
            <p className="mt-1 text-sm text-slate-500">Es la competencia que más te frena para tu siguiente nombramiento. Súbela con decisiones de esa área y con estas lecciones.</p>
          </div>
          {focusLesson && <Link href={`/ceo/academy/${focusLesson.id}`} className="btn-primary inline-flex items-center gap-2 shrink-0">{focusLesson.title} <ArrowRight size={15} /></Link>}
        </section>
      )}

      {forYou && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <p className="flex-1 min-w-0 text-xs text-slate-500">{order === "ti" ? "Ordenadas según lo que has demostrado y lo que nos contaste. Al menos 1 de cada 3 es de un área que no elegiste." : "Todas las rutas en su orden original."} <Link href="/ceo/perfil#experiencia" className="text-indigo font-medium">Tu experiencia</Link></p>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
            {(["ti", "todas"] as const).map((o) => <button key={o} type="button" onClick={() => setOrder(o)} aria-pressed={order === o} className={clsx("rounded-lg px-3 py-1.5 font-medium", order === o ? "bg-white text-ink shadow-sm" : "text-slate-500")}>{o === "ti" ? "Para ti" : "Orden original"}</button>)}
          </div>
        </div>
      )}

      <div className={clsx("grid gap-4 sm:grid-cols-2", forYou ? "mt-3" : "mt-6")}>
        {tracks.map((t) => {
          const h = hintOf.get(t.id);
          const Icon = ICON[t.icon];
          const ls = lessonsOfTrack(t.id);
          if (!ls.length) return null;
          const doneN = ls.filter((l) => c.s.lessons[l.id]).length;
          const nextL = ls.find((l) => !c.s.lessons[l.id] && rankOf(l) <= rank);
          const lockedL = ls.find((l) => rankOf(l) > rank);
          const lived = c.pack.items.some((i) => ls.some((l) => l.id === i.lesson) && c.entries.some((e) => e.item.id === i.id && e.status === "decidido"));
          const slots = Array.from({ length: MAX_TRACK_LEVEL }, (_, k) => ls[k]);
          return (
            <div key={t.id} className={clsx("card h-full p-6 flex flex-col", nextL && lived && "ring-2 ring-indigo/30")}>
              <div className="flex items-start justify-between">
                <span className={clsx("h-11 w-11 rounded-2xl grid place-items-center", doneN === ls.length ? "bg-mint-soft text-sob" : "bg-indigo-soft text-indigo")}><Icon size={20} /></span>
                <span className="flex flex-col items-end gap-1.5">
                  <span className="text-xs text-slate-400 tabular-nums">Nivel {doneN} de {MAX_TRACK_LEVEL}</span>
                  {h && order === "ti" && (h.review ? <span className="chip bg-slate-100 text-slate-500 text-[10.5px]">Repaso opcional</span> : h.top ? <span className="chip bg-indigo-soft text-indigo text-[10.5px]">{h.outside ? "Fuera de tu especialidad" : "Recomendada"}</span> : null)}
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-ink leading-snug">{t.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{t.blurb}</p>
              {/* escalera de niveles */}
              <div className="mt-4 flex items-center gap-1.5">
                {slots.map((l, k) => {
                  const ok = l && c.s.lessons[l.id];
                  const avail = l && rankOf(l) <= rank;
                  const inner = <span className={clsx("h-8 w-8 rounded-full grid place-items-center text-xs font-semibold transition-all", ok ? "bg-gradient-to-br from-indigo-light to-indigo text-white" : avail ? "bg-white border-2 border-indigo text-indigo" : "bg-slate-100 text-slate-300")}>{ok ? <Check size={14} strokeWidth={3} /> : avail ? k + 1 : <Lock size={12} />}</span>;
                  return (
                    <div key={k} className="flex items-center gap-1.5">
                      {k > 0 && <span className={clsx("h-0.5 w-3 sm:w-5 rounded-full", ok ? "bg-indigo" : "bg-slate-200")} />}
                      {l && avail ? <Link href={`/ceo/academy/${l.id}`} title={l.title}>{inner}</Link> : <span title={l ? `${l.title} · se abre con ${LEVELS[rankOf(l)]?.min} XP de constancia` : undefined}>{inner}</span>}
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex-1" />
              <div className="border-t border-slate-100 pt-4 text-xs">
                {nextL ? (
                  <Link href={`/ceo/academy/${nextL.id}`} className="flex items-center justify-between gap-2 group">
                    <span className="min-w-0"><span className="block text-slate-400">{trackLabel(nextL)} · {nextL.minutes} min</span><span className="block font-medium text-ink truncate">{nextL.title}</span></span>
                    <span className="inline-flex items-center gap-1 font-medium text-indigo whitespace-nowrap">Empezar <ArrowRight size={13} /></span>
                  </Link>
                ) : lockedL ? (
                  <span className="flex items-center gap-1.5 text-slate-400"><Lock size={12} /> Nivel {trackOf(lockedL).level} «{lockedL.title}» se abre con {LEVELS[rankOf(lockedL)]?.min} XP</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-400"><Clock size={12} /> Al día con todas las lecciones.</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
const trackLabel = (l: Lesson) => `Nivel ${trackOf(l).level}`;

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
  const rank = rankFor(c.s, c.now);
  const avail = LESSONS.filter((l) => rankOf(l) <= rank);
  const sameTrack = lessonsOfTrack(trackOf(lesson).track).find((l) => !c.s.lessons[l.id] && l.id !== lesson.id && rankOf(l) <= rank);
  const idx = avail.findIndex((l) => l.id === lesson.id);
  const next = sameTrack ?? avail.slice(idx + 1).find((l) => !c.s.lessons[l.id]) ?? avail.find((l) => !c.s.lessons[l.id] && l.id !== lesson.id);
  const locked = rankOf(lesson) > rank && !c.s.lessons[lesson.id];

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

  if (locked) return (
    <Stage steps={[]} at={0} exit="/ceo/academy">
      <div className="text-center">
        <span className="mx-auto h-14 w-14 rounded-2xl bg-white/10 text-white/70 grid place-items-center"><Lock size={24} /></span>
        <StepTitle title={lesson.title} />
        <p className="mt-3 text-white/70 text-[15px] leading-relaxed">Esta lección se abre al reunir <b className="text-white">{LEVELS[rankOf(lesson)]?.min} XP de constancia</b>. Sigue decidiendo en tu empresa y resolviendo tus dilemas del día.</p>
        <Link href="/ceo/academy" className="btn bg-white text-ink hover:bg-white/90 px-5 py-2.5 font-semibold mt-6 inline-flex">Volver a Academy</Link>
      </div>
    </Stage>
  );

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
