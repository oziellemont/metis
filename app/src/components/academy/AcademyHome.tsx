"use client";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Check, Clock, Compass, Flag, GraduationCap, Lock, Map as MapIcon, RotateCcw, Users } from "lucide-react";
import { useMetis } from "@/lib/store";
import { MODULES, TOTAL_MINUTES } from "@/lib/academy/content";
import { isPassed, isUnlocked, nextModule } from "@/lib/academy/progress";
import { useAcademy } from "./AcademyProvider";

const ICON = { compass: Compass, users: Users, flag: Flag, map: MapIcon };

export function AcademyHome() {
  const a = useAcademy();
  const s = useMetis();
  const me = s.userOf(s.currentUserId);
  const next = nextModule(a.progress);
  const pct = Math.round((a.done / a.total) * 100);

  return (
    <div className="max-w-5xl mx-auto">
      {/* héroe */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-7 sm:p-10 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div aria-hidden className="absolute right-24 bottom-[-80px] h-48 w-48 rounded-full bg-mint/20 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium"><GraduationCap size={14} /> Metis Academy</div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-semibold leading-tight">
              {a.finished ? `¡Listo, ${me.name.split(" ")[0]}! Ya hablas el idioma de la alineación.` : `Bienvenido, ${me.name.split(" ")[0]}. Antes de empezar, aprendamos juntos.`}
            </h1>
            <p className="mt-3 text-white/70 max-w-lg text-[15px] leading-relaxed">
              {a.finished
                ? "Completaste los módulos. Puedes volver a repasarlos cuando quieras."
                : `${MODULES.length} módulos cortos (unos ${TOTAL_MINUTES} minutos) sobre alineación estratégica, equipos y liderazgo, y un tour por la plataforma. Al terminar se desbloquea tu acceso completo a METIS.`}
            </p>
            {!a.finished && next && (
              <Link href={`/academy/${next.id}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-white/90 transition-colors">
                {a.done === 0 ? "Empezar" : "Continuar"} con el módulo {next.n} <ArrowRight size={15} />
              </Link>
            )}
            {a.finished && <Link href="/inicio" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-white/90">Ir a mi inicio <ArrowRight size={15} /></Link>}
          </div>
          <div className="flex md:justify-end">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-5 w-full md:w-60">
              <div className="flex items-baseline justify-between"><span className="text-xs text-white/60">Tu avance</span><span className="text-sm font-semibold tabular-nums">{a.done} de {a.total}</span></div>
              <div className="mt-2 h-2 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-mint to-mint-light transition-all duration-700" style={{ width: `${pct}%` }} /></div>
              <div className="mt-4 flex justify-between">
                {MODULES.map((m) => <span key={m.id} className={clsx("h-8 w-8 rounded-full grid place-items-center text-xs font-semibold", isPassed(a.progress, m.id) ? "bg-mint text-white" : m.id === next?.id ? "bg-white text-indigo" : "bg-white/10 text-white/50")}>{isPassed(a.progress, m.id) ? <Check size={14} strokeWidth={3} /> : m.n}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {a.locked && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-indigo/15 bg-indigo-soft/50 px-5 py-3.5 text-sm">
          <Lock size={16} className="text-indigo mt-0.5 shrink-0" />
          <span className="text-ink">El resto de METIS se desbloquea al aprobar los {MODULES.length} módulos. Tu avance se guarda solo: puedes salir y volver cuando quieras.</span>
        </div>
      )}

      {/* módulos */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {MODULES.map((m) => {
          const Icon = ICON[m.icon];
          const passed = isPassed(a.progress, m.id);
          const open = isUnlocked(a.progress, m.id);
          const current = m.id === next?.id;
          const p = a.progress[m.id];
          const body = (
            <div className={clsx("card h-full p-6 flex flex-col transition-all", open ? "hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(79,63,224,0.45)]" : "opacity-60", current && "ring-2 ring-indigo/30")}>
              <div className="flex items-start justify-between">
                <span className={clsx("h-11 w-11 rounded-2xl grid place-items-center", passed ? "bg-mint-soft text-sob" : open ? "bg-indigo-soft text-indigo" : "bg-slate-100 text-slate-400")}><Icon size={20} /></span>
                {passed ? <span className="chip bg-mint-soft text-sob"><Check size={12} className="mr-1" strokeWidth={3} /> Aprobado · {p?.bestScore}%</span>
                  : !open ? <span className="chip bg-slate-100 text-slate-500"><Lock size={11} className="mr-1" /> Bloqueado</span>
                  : p?.attempts ? <span className="chip bg-amber-soft text-amber">Intento {p.attempts} · {p.bestScore}%</span>
                  : current ? <span className="chip bg-indigo text-white">Siguiente</span> : null}
              </div>
              <div className="mt-4 text-xs font-medium text-slate-400">Módulo {m.n}</div>
              <h3 className="mt-0.5 font-semibold text-ink leading-snug">{m.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed flex-1">{m.subtitle}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">{m.topics.map((t) => <span key={t} className="chip bg-slate-50 text-slate-500 border border-slate-100">{t}</span>)}</div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {m.minutes} min · {m.quiz.length} preguntas</span>
                {open && <span className="inline-flex items-center gap-1 font-medium text-indigo">{passed ? "Repasar" : p?.attempts ? "Reintentar" : "Empezar"} <ArrowRight size={13} /></span>}
              </div>
            </div>
          );
          return open ? <Link key={m.id} href={`/academy/${m.id}`} className="block">{body}</Link> : <div key={m.id} aria-disabled>{body}</div>;
        })}
      </div>

      {s.mode === "demo" && (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-dashed border-slate-200 px-5 py-3 text-xs text-slate-500">
          <span>Modo demo: en la versión real, la Academia es obligatoria la primera vez y bloquea el resto de la plataforma hasta completarla.</span>
          <button onClick={a.resetDemo} className="inline-flex items-center gap-1 hover:text-ink whitespace-nowrap ml-3"><RotateCcw size={12} /> Reiniciar avance</button>
        </div>
      )}
      {a.locked && a.canSkip && (
        <div className="mt-4 text-right"><button onClick={a.skip} className="text-xs text-slate-400 hover:text-ink underline">Saltar por esta sesión (solo admin METIS)</button></div>
      )}
    </div>
  );
}
