"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, Clock, Coins, Compass, Flag, Flame as FlameIcon, GraduationCap, Handshake, Layers, Lock, MessagesSquare, Rocket, Sparkles, Target, Users, Zap } from "lucide-react";
import { BlockView } from "@/components/academy/Blocks";

import { LESSONS, MAX_TRACK_LEVEL, TRACKS, lessonsOfTrack, rankOf, trackOf, type Lesson } from "@/lib/ceo/lessons";
import { LEVELS, rankFor } from "@/lib/ceo/engine";
import { useCeo } from "./CeoProvider";

const ICON = { compass: Compass, users: Users, flag: Flag, message: MessagesSquare, handshake: Handshake, coins: Coins, flame: FlameIcon, rocket: Rocket, target: Target, layers: Layers };

export function CeoAcademyHome() {
  const c = useCeo();
  const rank = rankFor(c.s, c.now);
  const open = LESSONS.filter((l) => rankOf(l) <= rank);
  const done = LESSONS.filter((l) => c.s.lessons[l.id]).length;
  const pct = Math.round((done / Math.max(1, open.length)) * 100);
  const nextRank = LEVELS[rank + 1];
  const unlockNext = nextRank ? LESSONS.filter((l) => rankOf(l) === rank + 1).length : 0;
  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-9 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium"><GraduationCap size={14} /> mêtis Academy · Ruta CEO</div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-semibold leading-tight">Aprender a dirigir no se termina.</h1>
            <p className="mt-3 text-white/70 max-w-lg text-[15px] leading-relaxed">Cada tema tiene niveles. Empiezas por lo esencial y, conforme subes de rango en tu carrera, se abren lecciones más profundas. Primero decides con tu instinto; luego entiendes por qué.</p>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur p-5">
            <div className="flex items-baseline justify-between"><span className="text-xs text-white/60">Abiertas para {LEVELS[rank].name}</span><span className="text-sm font-semibold tabular-nums">{done} de {open.length}</span></div>
            <div className="mt-2 h-2 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-indigo-light to-white transition-all duration-700" style={{ width: `${Math.min(100, pct)}%` }} /></div>
            <p className="mt-3 text-[11px] text-white/60">{nextRank ? `Al llegar a ${nextRank.name} se abren ${unlockNext} lecciones nuevas.` : "Tienes todo abierto. Cada temporada llegan niveles nuevos."} +30 XP por lección.</p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {TRACKS.map((t) => {
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
                <span className="text-xs text-slate-400 tabular-nums">Nivel {doneN} de {MAX_TRACK_LEVEL}</span>
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
                      {l && avail ? <Link href={`/ceo/academy/${l.id}`} title={l.title}>{inner}</Link> : <span title={l ? `${l.title} · se abre en ${LEVELS[rankOf(l)]?.name}` : "Próximamente"}>{inner}</span>}
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
                  <span className="flex items-center gap-1.5 text-slate-400"><Lock size={12} /> Nivel {trackOf(lockedL).level} «{lockedL.title}» se abre en {LEVELS[rankOf(lockedL)]?.name}</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-400"><Clock size={12} /> Al día. Los siguientes niveles llegan pronto.</span>
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
  const onReady = useCallback((ok: boolean) => setReady(ok), []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [i, done]);
  const rank = rankFor(c.s, c.now);
  const avail = LESSONS.filter((l) => rankOf(l) <= rank);
  const sameTrack = lessonsOfTrack(trackOf(lesson).track).find((l) => !c.s.lessons[l.id] && l.id !== lesson.id && rankOf(l) <= rank);
  const idx = avail.findIndex((l) => l.id === lesson.id);
  const next = sameTrack ?? avail.slice(idx + 1).find((l) => !c.s.lessons[l.id]) ?? avail.find((l) => !c.s.lessons[l.id] && l.id !== lesson.id);
  const locked = rankOf(lesson) > rank && !c.s.lessons[lesson.id];
  const already = !!c.s.lessons[lesson.id];

  const advance = () => {
    setReady(false);
    if (i < lesson.blocks.length - 1) setI(i + 1);
    else { c.completeLesson(lesson.id); setDone(true); }
  };

  if (locked) return (
    <div className="max-w-xl mx-auto card p-8 text-center">
      <span className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center"><Lock size={24} /></span>
      <h1 className="mt-4 text-xl font-semibold">{lesson.title}</h1>
      <p className="mt-2 text-sm text-slate-500">Esta lección se abre cuando llegues a <b className="text-ink">{LEVELS[rankOf(lesson)]?.name}</b>. Sigue decidiendo en tu empresa y resolviendo tus dilemas del día.</p>
      <Link href="/ceo/academy" className="btn-primary mt-6 inline-flex">Volver a Academy</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={from ? `/ceo/caso/${from}` : "/ceo/academy"} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink"><ArrowLeft size={15} /> {from ? "Volver al caso" : "Academy"}</Link>
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-indigo-light to-indigo transition-all duration-500" style={{ width: `${done ? 100 : Math.round((i / lesson.blocks.length) * 100)}%` }} /></div>
        <span className="text-xs text-slate-400 whitespace-nowrap">{lesson.part}</span>
      </div>

      <div className="card mt-5 p-6 sm:p-9 min-h-[440px] flex flex-col">
        {!done ? (
          <>
            <div key={i} className="academy-in flex-1"><BlockView block={lesson.blocks[i]} onReady={onReady} /></div>
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button onClick={() => i > 0 && setI(i - 1)} disabled={i === 0} className="btn-ghost !px-3 disabled:opacity-0"><ArrowLeft size={14} /> Atrás</button>
              <div className="hidden sm:flex gap-1.5">{lesson.blocks.map((_, j) => <span key={j} className={clsx("h-1.5 rounded-full transition-all", j === i ? "w-5 bg-indigo" : j < i ? "w-1.5 bg-indigo/40" : "w-1.5 bg-slate-200")} />)}</div>
              <button onClick={advance} disabled={!ready} className="btn-primary">{i === lesson.blocks.length - 1 ? "Terminar lección" : "Continuar"} <ArrowRight size={14} /></button>
            </div>
            {!ready && <p className="mt-2 text-right text-[11px] text-slate-400">Completa la interacción para continuar</p>}
          </>
        ) : (
          <div className="academy-in flex-1 flex flex-col items-center justify-center text-center">
            <span className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo to-indigo-light text-white grid place-items-center ceo-pop"><Sparkles size={28} /></span>
            <h2 className="mt-5 text-2xl font-semibold">Lección completada</h2>
            <p className="mt-2 text-slate-500 max-w-md">{already ? "Repaso hecho. La teoría se vuelve criterio cuando la aplicas." : "+30 XP y tu racha de hoy está encendida 🔥"}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {from && <button onClick={() => router.push(`/ceo/caso/${from}`)} className="btn-primary">Volver al caso <ArrowRight size={14} /></button>}
              {c.pending[0] && <button onClick={() => router.push(`/ceo/caso/${c.pending[0].item.id}`)} className={from ? "btn-ghost" : "btn-primary"}>Atender pendiente <ArrowRight size={14} /></button>}
              {next && <button onClick={() => router.push(`/ceo/academy/${next.id}`)} className="btn-ghost">Siguiente: {next.title}</button>}
              <Link href="/ceo" className="btn-ghost">Ir a Hoy</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
