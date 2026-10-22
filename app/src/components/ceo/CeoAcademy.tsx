"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, Clock, Coins, Compass, Flag, Flame as FlameIcon, GraduationCap, Handshake, Layers, MessagesSquare, Rocket, Sparkles, Target, Users, Zap } from "lucide-react";
import { BlockView } from "@/components/academy/Blocks";
import { ITEMS } from "@/lib/ceo/cases";
import { LESSONS, type Lesson } from "@/lib/ceo/lessons";
import { useCeo } from "./CeoProvider";

const ICON = { compass: Compass, users: Users, flag: Flag, message: MessagesSquare, handshake: Handshake, coins: Coins, flame: FlameIcon, rocket: Rocket, target: Target, layers: Layers };

export function CeoAcademyHome() {
  const c = useCeo();
  const done = LESSONS.filter((l) => c.s.lessons[l.id]).length;
  const pct = Math.round((done / LESSONS.length) * 100);
  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-9 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium"><GraduationCap size={14} /> mêtis Academy · Ruta CEO</div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-semibold leading-tight">La teoría detrás de cada decisión.</h1>
            <p className="mt-3 text-white/70 max-w-lg text-[15px] leading-relaxed">Cada asunto que resuelves en Botanas Cumbre se conecta con una lección de «De CERO a CEO» y de la metodología de alineación de mêtis. Primero decides con tu instinto; luego entiendes por qué.</p>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur p-5">
            <div className="flex items-baseline justify-between"><span className="text-xs text-white/60">Tu avance</span><span className="text-sm font-semibold tabular-nums">{done} de {LESSONS.length}</span></div>
            <div className="mt-2 h-2 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-mint to-mint-light transition-all duration-700" style={{ width: `${pct}%` }} /></div>
            <p className="mt-3 text-[11px] text-white/60">+30 XP por lección y cuenta para tu racha del día.</p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {LESSONS.map((l) => {
          const Icon = ICON[l.icon];
          const ok = !!c.s.lessons[l.id];
          const cases = ITEMS.filter((i) => i.lesson === l.id);
          const lived = cases.filter((i) => c.entries.some((e) => e.item.id === i.id && (e.status === "decidido" || e.status === "vencido"))).length;
          const suggested = !ok && lived > 0;
          return (
            <Link key={l.id} href={`/ceo/academy/${l.id}`} className={clsx("card h-full p-6 flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(79,63,224,0.45)]", suggested && "ring-2 ring-indigo/30")}>
              <div className="flex items-start justify-between">
                <span className={clsx("h-11 w-11 rounded-2xl grid place-items-center", ok ? "bg-mint-soft text-sob" : "bg-indigo-soft text-indigo")}><Icon size={20} /></span>
                {ok ? <span className="chip bg-mint-soft text-sob"><Check size={12} className="mr-1" strokeWidth={3} /> Completada</span> : suggested ? <span className="chip bg-indigo text-white"><Zap size={11} className="mr-1" /> Ya la viviste</span> : null}
              </div>
              <div className="mt-4 text-xs font-medium text-slate-400">{l.part}</div>
              <h3 className="mt-0.5 font-semibold text-ink leading-snug">{l.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed flex-1">{l.subtitle}</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {l.minutes} min{cases.length ? ` · ${lived}/${cases.length} casos vividos` : ""}</span>
                <span className="inline-flex items-center gap-1 font-medium text-indigo">{ok ? "Repasar" : "Empezar"} <ArrowRight size={13} /></span>
              </div>
            </Link>
          );
        })}
      </div>
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
  const onReady = useCallback((ok: boolean) => setReady(ok), []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [i, done]);
  const idx = LESSONS.findIndex((l) => l.id === lesson.id);
  const next = LESSONS.slice(idx + 1).find((l) => !c.s.lessons[l.id]) ?? LESSONS.find((l) => !c.s.lessons[l.id] && l.id !== lesson.id);
  const already = !!c.s.lessons[lesson.id];

  const advance = () => {
    setReady(false);
    if (i < lesson.blocks.length - 1) setI(i + 1);
    else { c.completeLesson(lesson.id); setDone(true); }
  };

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
