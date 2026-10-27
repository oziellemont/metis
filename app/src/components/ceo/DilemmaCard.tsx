"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowRight, BookOpen, Check, Sparkles, Users } from "lucide-react";
import { STAGE_LABEL, THEMES, bestOf, type Dilemma } from "@/lib/ceo/dilemmas";
import { XP, rand01 } from "@/lib/ceo/engine";
import { lessonById } from "@/lib/ceo/lessons";
import { useCeo } from "./CeoProvider";

const VERDICT = ["Arriesgado", "A medias", "Buen camino", "Lo que haría un gran líder"];
const VERDICT_CLS = ["bg-coral-soft text-coral", "bg-amber-soft text-amber", "bg-indigo-soft text-indigo", "bg-mint-soft text-sob"];

/** Orden estable pero barajado de las opciones (que la mejor no quede siempre en el mismo lugar). */
function useOrder(d: Dilemma) {
  return useMemo(() => d.options.map((_, i) => i).sort((a, b) => rand01(`${d.id}:${a}`) - rand01(`${d.id}:${b}`)), [d]);
}

export function DilemmaView({ d, picked, onPick, compact }: { d: Dilemma; picked: number | null; onPick?: (i: number) => void; compact?: boolean }) {
  const order = useOrder(d);
  const th = THEMES[d.theme];
  const best = bestOf(d);
  const lesson = d.lesson ? lessonById(d.lesson) : undefined;
  const done = picked !== null;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-indigo"><span>{th.emoji} {th.label}</span></div>
      <div className="mt-2 text-sm font-semibold text-ink">{d.who}</div>
      <p className={clsx("mt-1.5 text-slate-600 leading-relaxed", compact ? "text-sm" : "text-[15px]")}>{d.text}</p>
      <div className="mt-4 font-semibold text-ink">{d.ask}</div>
      <div className="mt-3 space-y-2">
        {order.map((i) => {
          const o = d.options[i];
          const mine = picked === i;
          return (
            <button key={i} disabled={done} onClick={() => onPick?.(i)} className={clsx("w-full text-left rounded-xl border px-4 py-3 transition-all", !done && "hover:border-indigo hover:bg-indigo-soft/40", done && mine ? "border-indigo bg-indigo-soft/50" : "border-slate-200", done && !mine && "opacity-90")}>
              <div className="flex items-start gap-3">
                <span className={clsx("mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 grid place-items-center", mine ? "border-indigo bg-indigo text-white" : "border-slate-300")}>{mine && <Check size={11} strokeWidth={3} />}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink">{o.text}</div>
                  {done && (
                    <div className="mt-2 academy-in">
                      <span className={clsx("chip text-[10px]", VERDICT_CLS[o.score])}>{o.score === best ? "★ " : ""}{VERDICT[o.score]}</span>
                      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{o.why}</p>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {done && (
        <div className="mt-4 rounded-xl bg-indigo-soft/60 px-4 py-3 text-sm text-ink academy-in">
          <div className="flex items-start gap-2"><Sparkles size={15} className="text-indigo mt-0.5 shrink-0" /><span>{d.stage ? <><b>{STAGE_LABEL[d.stage]}.</b> </> : null}{th.hint}</span></div>
          {lesson && <Link href={`/ceo/academy/${lesson.id}`} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo"><BookOpen size={13} /> La teoría: {lesson.title} <ArrowRight size={12} /></Link>}
        </div>
      )}
    </div>
  );
}

/** Tarjeta de «Hoy»: el dilema de personas del día. */
export function DilemmaCard() {
  const c = useCeo();
  const today = c.dilemma;
  const [justPicked, setJustPicked] = useState<number | null>(null);
  if (!today) return null;
  const { d, done } = today;
  const picked = c.s.dilemmas?.[d.id]?.option ?? justPicked;
  const gained = picked !== null ? XP.dilemma + d.options[picked].score * XP.dilemmaPoint : 0;
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-ink inline-flex items-center gap-2"><span className="h-8 w-8 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><Users size={16} /></span> Dilema del día</h2>
        {picked !== null ? <span className="chip bg-mint-soft text-sob">+{gained} XP</span> : <span className="text-xs text-slate-400">1 minuto · cuenta para tu racha</span>}
      </div>
      <div className="mt-4">
        <DilemmaView d={d} picked={picked} onPick={(i) => { setJustPicked(i); c.answerDilemma(d.id, i); }} compact />
      </div>
      {(done || picked !== null) && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Mañana llega otro. No hay dos iguales.</span>
          <Link href="/ceo/personas" className="font-medium text-indigo inline-flex items-center gap-1">Tus dilemas <ArrowRight size={12} /></Link>
        </div>
      )}
    </section>
  );
}
