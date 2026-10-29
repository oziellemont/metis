"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowRight, BookOpen, Check, Clock, Lightbulb, Users } from "lucide-react";
import { STAGE_LABEL, THEMES, bestOf, type Dilemma } from "@/lib/ceo/dilemmas";
import { careerRulesVersionOf, rand01, ruleSet } from "@/lib/ceo/engine";
import { lessonById } from "@/lib/ceo/lessons";
import { useCeo } from "./CeoProvider";
import { Stage, StageChoice, StepTitle } from "./Stage";

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
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-indigo"><span>{th.label}</span></div>
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
                      <span className={clsx("chip text-[10px]", VERDICT_CLS[o.score])}>{VERDICT[o.score]}</span>
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
          <div className="flex items-start gap-2"><Lightbulb size={15} className="text-indigo mt-0.5 shrink-0" /><span>{d.stage ? <><b>{STAGE_LABEL[d.stage]}.</b> </> : null}{th.hint}</span></div>
          {lesson && <Link href={`/ceo/academy/${lesson.id}`} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo"><BookOpen size={13} /> La teoría: {lesson.title} <ArrowRight size={12} /></Link>}
        </div>
      )}
    </div>
  );
}

/** Pasos del dilema del día, con el fondo métis. */
export const DILEMMA_STEPS = ["El caso", "Decides", "Aprendes"];

/**
 * Dilema del día a pantalla completa, paso a paso: leer el caso → decidir → aprender.
 * Se abre sobre la página (capa), así que cerrar no te saca de donde estabas.
 */
export function DilemmaStage({ onClose, onLater }: { onClose: () => void; onLater?: () => void }) {
  const c = useCeo();
  const today = c.dilemma;
  const [justPicked, setJustPicked] = useState<number | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const answered = today ? c.s.dilemmas?.[today.d.id]?.option ?? justPicked : null;
  const [step, setStep] = useState(answered !== null ? 2 : 0);
  const order = useMemo(() => (today ? today.d.options.map((_, i) => i).sort((a, b) => rand01(`${today.d.id}:${a}`) - rand01(`${today.d.id}:${b}`)) : []), [today]);
  if (!today) return null;
  const { d } = today;
  const th = THEMES[d.theme];
  const lesson = d.lesson ? lessonById(d.lesson) : undefined;
  const XP = ruleSet(careerRulesVersionOf(c.s)).xp;
  const gained = answered !== null ? XP.dilemma + d.options[answered].score * XP.dilemmaPoint : 0;
  const confirm = () => { if (choice === null || answered !== null) return; setJustPicked(choice); c.answerDilemma(d.id, choice); setStep(2); };

  const back = step === 1 ? () => setStep(0) : undefined;
  const next = step === 0 ? () => setStep(answered !== null ? 2 : 1) : step === 1 ? confirm : onClose;
  const label = step === 0 ? "Decidir" : step === 1 ? "Confirmar" : "Listo";
  const top = answered !== null ? <span className="chip bg-mint text-ink text-xs">+{gained} XP</span> : <span className="chip bg-white/10 text-white/80 text-xs">1 minuto</span>;

  return (
    <Stage overlay steps={DILEMMA_STEPS} at={step} reach={answered !== null ? 2 : 1} onExit={onClose} top={top} onBack={back} onNext={next} next={label} nextOff={step === 1 && choice === null}
      aside={step === 0 && answered === null && onLater ? <button type="button" onClick={onLater} className="inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white"><Clock size={14} /> Recordar más tarde</button> : undefined}>
      {step === 0 && (
        <div>
          <StepTitle eyebrow={<span className="inline-flex items-center gap-1.5"><Users size={13} /> Dilema del día · {th.label}</span>} title={d.who} />
          <div className="mt-6 rounded-2xl bg-white text-ink p-5 text-[15px] leading-relaxed">{d.text}</div>
          <p className="mt-4 text-sm text-white/60">Cada persona necesita algo distinto de ti. Lee con calma y decide en el siguiente paso.</p>
        </div>
      )}
      {step === 1 && (
        <div>
          <StepTitle eyebrow="Tu decisión" title={d.ask} />
          <p className="mt-3 text-sm text-white/60 line-clamp-3">{d.text}</p>
          <div className="mt-6 space-y-2.5">
            {order.map((i, k) => <StageChoice key={i} letter={String.fromCharCode(65 + k)} on={choice === i} onClick={() => setChoice(i)}>{d.options[i].text}</StageChoice>)}
          </div>
        </div>
      )}
      {step === 2 && answered !== null && (
        <div>
          <StepTitle eyebrow="Lo que aprendes" title={VERDICT[d.options[answered].score]} text={d.options[answered].why} />
          <div className="mt-6 rounded-2xl bg-white text-ink p-4 sm:p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cada opción, con su lectura</div>
            <ul className="mt-3 space-y-3">
              {order.map((i) => {
                const o = d.options[i];
                return (
                  <li key={i} className={clsx("rounded-xl border p-3", i === answered ? "border-indigo bg-indigo-soft/40" : "border-slate-100")}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm text-ink">{o.text}</span>
                      <span className={clsx("chip text-[10px] shrink-0", VERDICT_CLS[o.score])}>{VERDICT[o.score]}</span>
                    </div>
                    {i !== answered && <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{o.why}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-4 rounded-2xl bg-white/[.08] border border-white/10 px-4 py-3 text-sm">
            <div className="flex items-start gap-2"><Lightbulb size={15} className="text-mint mt-0.5 shrink-0" /><span className="text-white/85">{d.stage ? <><b className="text-white">{STAGE_LABEL[d.stage]}.</b> </> : null}{th.hint}</span></div>
            {lesson && <Link href={`/ceo/academy/${lesson.id}`} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-mint"><BookOpen size={13} /> La teoría: {lesson.title} <ArrowRight size={12} /></Link>}
          </div>
          <p className="mt-4 text-xs text-white/50">Mañana llega otro. No hay dos iguales.</p>
        </div>
      )}
    </Stage>
  );
}

/** Tarjeta para abrir el dilema del día (en Personas). */
export function DilemmaCard() {
  const c = useCeo();
  const today = c.dilemma;
  const [open, setOpen] = useState(false);
  if (!today) return null;
  const { d } = today;
  const picked = c.s.dilemmas?.[d.id]?.option ?? null;
  const XP = ruleSet(careerRulesVersionOf(c.s)).xp;
  const gained = picked !== null ? XP.dilemma + d.options[picked].score * XP.dilemmaPoint : 0;
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-ink inline-flex items-center gap-2"><span className="h-8 w-8 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><Users size={16} /></span> Dilema del día</h2>
        {picked !== null ? <span className="chip bg-mint-soft text-sob">+{gained} XP</span> : <span className="text-xs text-slate-400">1 minuto · cuenta para tu racha</span>}
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-indigo">{THEMES[d.theme].label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{d.who}</div>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary mt-4">{picked !== null ? "Ver lo que aprendiste" : "Abrir el dilema"} <ArrowRight size={16} /></button>
      {open && <DilemmaStage onClose={() => setOpen(false)} />}
    </section>
  );
}
