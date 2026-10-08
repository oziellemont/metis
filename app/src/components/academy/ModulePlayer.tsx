"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Trophy, X, Sparkles, Lock } from "lucide-react";
import { MODULES, PASS_PCT, type Module } from "@/lib/academy/content";
import { gradeQuiz, isUnlocked, shuffledOrder } from "@/lib/academy/progress";
import { BlockView, OptionList } from "./Blocks";
import { useAcademy } from "./AcademyProvider";

type Phase = { k: "learn"; i: number } | { k: "quizIntro" } | { k: "quiz"; i: number } | { k: "result" };

export function ModulePlayer({ mod }: { mod: Module }) {
  const a = useAcademy();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ k: "learn", i: 0 });
  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(() => mod.quiz.map(() => null));
  const [attempt, setAttempt] = useState(1);
  const onReady = useCallback((ok: boolean) => setReady(ok), []);
  const orders = useMemo(() => mod.quiz.map((q, i) => shuffledOrder(q.options.length, attempt * 31 + i * 7 + mod.n)), [mod, attempt]);
  const nextMod = MODULES.find((m) => m.n === mod.n + 1);
  const unlocked = isUnlocked(a.progress, mod.id);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [phase]);

  // Teclado: → / Enter para avanzar cuando se puede.
  const total = mod.blocks.length + mod.quiz.length + 1;
  const pos = phase.k === "learn" ? phase.i : phase.k === "quizIntro" ? mod.blocks.length : phase.k === "quiz" ? mod.blocks.length + 1 + phase.i : total;
  const pct = Math.round((pos / total) * 100);

  if (a.ready && !unlocked) {
    return (
      <div className="card p-8 max-w-lg mx-auto text-center">
        <span className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center"><Lock size={20} /></span>
        <h2 className="mt-4 text-lg font-semibold">Este módulo aún está bloqueado</h2>
        <p className="mt-1 text-sm text-slate-500">Completa primero el módulo {mod.n - 1}. Los módulos se abren en orden.</p>
        <Link href="/academy" className="btn-primary mt-6">Volver a Metis Academy</Link>
      </div>
    );
  }

  const nextLearn = () => {
    if (phase.k !== "learn") return;
    setReady(false);
    if (phase.i < mod.blocks.length - 1) setPhase({ k: "learn", i: phase.i + 1 });
    else setPhase({ k: "quizIntro" });
  };
  const prevLearn = () => { if (phase.k === "learn" && phase.i > 0) { setPhase({ k: "learn", i: phase.i - 1 }); } };

  const pick = (qi: number, oi: number) => setAnswers((x) => x.map((v, i) => (i === qi ? oi : v)));
  const finishQuiz = () => {
    const g = gradeQuiz(mod.quiz, answers.map((x) => x ?? -1));
    a.saveAttempt(mod.id, g.pct, g.passed);
    setPhase({ k: "result" });
  };
  const retry = () => { setAnswers(mod.quiz.map(() => null)); setAttempt((n) => n + 1); setPhase({ k: "quiz", i: 0 }); };
  const grade = gradeQuiz(mod.quiz, answers.map((x) => x ?? -1));

  return (
    <div className="max-w-3xl mx-auto">
      {/* barra superior */}
      <div className="flex items-center gap-3">
        <Link href="/academy" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink"><ArrowLeft size={15} /> Academy</Link>
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-light to-indigo transition-all duration-500" style={{ width: `${phase.k === "result" ? 100 : pct}%` }} />
        </div>
        <span className="text-xs text-slate-400 tabular-nums">Módulo {mod.n} de {MODULES.length}</span>
      </div>

      <div className="card mt-5 p-6 sm:p-9 min-h-[460px] flex flex-col">
        {phase.k === "learn" && (
          <>
            <div key={phase.i} className="academy-in flex-1"><BlockView block={mod.blocks[phase.i]} onReady={onReady} /></div>
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button onClick={prevLearn} disabled={phase.i === 0} className="btn-ghost !px-3 disabled:opacity-0"><ArrowLeft size={14} /> Atrás</button>
              <div className="hidden sm:flex gap-1.5">{mod.blocks.map((_, i) => <span key={i} className={clsx("h-1.5 rounded-full transition-all", i === phase.i ? "w-5 bg-indigo" : i < phase.i ? "w-1.5 bg-indigo/40" : "w-1.5 bg-slate-200")} />)}</div>
              <button onClick={nextLearn} disabled={!ready} className="btn-primary" title={!ready ? "Completa la interacción para continuar" : ""}>
                {phase.i === mod.blocks.length - 1 ? "Ir al quiz" : "Continuar"} <ArrowRight size={14} />
              </button>
            </div>
            {!ready && <p className="mt-2 text-right text-[11px] text-slate-400">{hintFor(mod.blocks[phase.i].kind)}</p>}
          </>
        )}

        {phase.k === "quizIntro" && (
          <div className="academy-in flex-1 flex flex-col items-center justify-center text-center">
            <span className="h-14 w-14 rounded-2xl bg-indigo-soft text-indigo grid place-items-center"><Sparkles size={24} /></span>
            <h2 className="mt-5 text-2xl font-semibold">Quiz del módulo</h2>
            <p className="mt-2 text-slate-500 max-w-md">{mod.quiz.length} preguntas de situaciones reales. Cada respuesta te explica el porqué. Necesitas <strong className="text-ink">{PASS_PCT}%</strong> para aprobar; si no, puedes reintentarlo las veces que quieras.</p>
            <button onClick={() => setPhase({ k: "quiz", i: 0 })} className="btn-primary mt-7">Empezar quiz <ArrowRight size={14} /></button>
            <button onClick={() => setPhase({ k: "learn", i: mod.blocks.length - 1 })} className="mt-3 text-xs text-slate-400 hover:text-ink">Repasar la lectura</button>
          </div>
        )}

        {phase.k === "quiz" && (
          <>
            <div key={`${attempt}-${phase.i}`} className="academy-in flex-1">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">Pregunta {phase.i + 1} de {mod.quiz.length}</div>
                <div className="flex gap-1">{mod.quiz.map((q, i) => {
                  const v = answers[i];
                  return <span key={i} className={clsx("h-2 w-2 rounded-full", v === null ? (i === phase.i ? "bg-indigo" : "bg-slate-200") : q.options[v].correct ? "bg-mint" : "bg-coral")} />;
                })}</div>
              </div>
              <h2 className="mt-3 text-lg sm:text-xl font-semibold text-ink leading-snug">{mod.quiz[phase.i].q}</h2>
              <div className="mt-5"><OptionList options={mod.quiz[phase.i].options} order={orders[phase.i]} picked={answers[phase.i]} onPick={(oi) => pick(phase.i, oi)} /></div>
            </div>
            <div className="mt-8 flex justify-end border-t border-slate-100 pt-5">
              {phase.i < mod.quiz.length - 1
                ? <button className="btn-primary" disabled={answers[phase.i] === null} onClick={() => setPhase({ k: "quiz", i: phase.i + 1 })}>Siguiente <ArrowRight size={14} /></button>
                : <button className="btn-primary" disabled={answers[phase.i] === null} onClick={finishQuiz}>Ver resultado <ArrowRight size={14} /></button>}
            </div>
          </>
        )}

        {phase.k === "result" && (
          <div className="academy-in flex-1 flex flex-col items-center text-center">
            <ScoreRing pct={grade.pct} passed={grade.passed} />
            {grade.passed ? (
              <>
                <h2 className="mt-5 text-2xl font-semibold">{a.finished ? "¡Completaste Metis Academy!" : "¡Módulo aprobado!"}</h2>
                <p className="mt-2 text-slate-500 max-w-md">{grade.correct} de {grade.total} correctas. {a.finished ? "Tu acceso completo a METIS ya está desbloqueado." : nextMod ? `Se desbloqueó el módulo ${nextMod.n}: ${nextMod.title}.` : ""}</p>
                {a.finished && <Confetti />}
                <div className="mt-7 flex flex-wrap justify-center gap-2">
                  {a.finished
                    ? <button onClick={() => router.push("/inicio")} className="btn-primary">Entrar a METIS <ArrowRight size={14} /></button>
                    : nextMod && <button onClick={() => router.push(`/academy/${nextMod.id}`)} className="btn-primary">Siguiente módulo <ArrowRight size={14} /></button>}
                  <Link href="/academy" className="btn-ghost">Volver a Academy</Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-5 text-2xl font-semibold">Casi lo tienes</h2>
                <p className="mt-2 text-slate-500 max-w-md">{grade.correct} de {grade.total} correctas. Necesitas {PASS_PCT}% para aprobar. Revisa abajo en qué fallaste y vuelve a intentarlo (las opciones cambian de orden).</p>
                <div className="mt-7 flex flex-wrap justify-center gap-2">
                  <button onClick={retry} className="btn-primary"><RotateCcw size={14} /> Reintentar quiz</button>
                  <button onClick={() => { setPhase({ k: "learn", i: 0 }); setAnswers(mod.quiz.map(() => null)); setAttempt((n) => n + 1); }} className="btn-ghost">Repasar el módulo</button>
                </div>
              </>
            )}
            <div className="mt-9 w-full text-left space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Repaso</div>
              {mod.quiz.map((q, i) => {
                const ok = answers[i] !== null && q.options[answers[i]!].correct;
                const right = q.options.find((o) => o.correct)!;
                return (
                  <div key={i} className="flex gap-3 rounded-xl border border-slate-100 px-4 py-3">
                    <span className={clsx("h-5 w-5 shrink-0 rounded-full grid place-items-center mt-0.5", ok ? "bg-mint text-white" : "bg-coral text-white")}>{ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}</span>
                    <div className="text-sm"><div className="font-medium text-ink leading-snug">{q.q}</div>{(!ok || grade.passed) && <div className="mt-1 text-[13px] text-slate-500 leading-snug"><span className="text-sob font-medium">{right.text}.</span> {right.why}</div>}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function hintFor(kind: string) {
  return kind === "reveal" ? "Toca cada elemento para continuar" : kind === "flow" ? "Avanza todos los pasos para continuar" : kind === "check" ? "Elige una respuesta para continuar" : "";
}

function ScoreRing({ pct, passed }: { pct: number; passed: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => { const t = setTimeout(() => setV(pct), 80); return () => clearTimeout(t); }, [pct]);
  const r = 44, c = 2 * Math.PI * r;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#EEF0F7" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={passed ? "#14C98E" : "#F5A524"} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          {passed ? <Trophy size={18} className="mx-auto text-mint" /> : null}
          <div className="text-2xl font-semibold tabular-nums">{pct}%</div>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ["#4F3FE0", "#6D5DF6", "#14C98E", "#2EE6A8", "#F5A524"];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-40">
      {Array.from({ length: 48 }).map((_, i) => (
        <span key={i} className="academy-confetti absolute top-[-12px] h-2.5 w-1.5 rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 12) * 0.08}s`, animationDuration: `${2.2 + (i % 5) * 0.3}s` }} />
      ))}
    </div>
  );
}
