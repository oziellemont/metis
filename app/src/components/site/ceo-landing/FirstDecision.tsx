"use client";
/**
 * «Tu primera decisión»: una sola experiencia con el problema, la decisión, la consecuencia
 * de hoy y lo que cambia un mes después en cinco dimensiones. Sustituye a la antigua sección
 * «Efectos cruzados», que repetía la misma idea.
 * Vive solo en memoria del navegador: no usa el motor, no guarda nada ni toca la partida.
 */
import { useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, MessageCircle, RotateCcw } from "lucide-react";
import { DEMO, START_HREF } from "./content";
import { EffectBars } from "./Effects";

export function FirstDecision() {
  const [pick, setPick] = useState<string | null>(null);
  const [phase, setPhase] = useState<0 | 1>(0);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);
  const opt = DEMO.options.find((o) => o.id === pick) ?? null;
  const ph = opt ? (phase === 0 ? opt.now : opt.later) : null;

  const choose = (id: string) => {
    setPick(id);
    setPhase(0);
    requestAnimationFrame(() => {
      resultRef.current?.focus({ preventScroll: true });
      // En celular el resultado queda debajo del mensaje: se lleva a la vista para no perder el hilo.
      const box = boxRef.current;
      if (!box) return;
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const top = box.getBoundingClientRect().top;
      if (top < 80 || top > window.innerHeight * 0.6) window.scrollTo({ top: window.scrollY + top - 88, behavior: calm ? "auto" : "smooth" });
    });
  };
  const reset = () => {
    setPick(null);
    setPhase(0);
    requestAnimationFrame(() => firstRef.current?.focus({ preventScroll: false }));
  };

  return (
    <section aria-labelledby="decision-title" className="bg-canvas">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo">{DEMO.label}</p>
          <h2 id="decision-title" className="mt-3 text-[28px] leading-[1.15] sm:text-4xl sm:leading-[1.12] font-semibold tracking-tight text-ink">{DEMO.title}</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-slate-600">{DEMO.body}</p>
        </div>
        <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-slate-500" aria-label="Cómo funciona la prueba">
          {DEMO.steps.map((s, i) => {
            const at = opt ? 2 : 0;
            return (
              <li key={s} aria-current={i === at ? "step" : undefined} className={clsx("flex items-center gap-2", i <= at && "text-ink")}>
                <span className={clsx("h-5 w-5 rounded-full grid place-items-center text-[10px] font-semibold tabular-nums motion-safe:transition-colors", i < at ? "bg-mint text-white" : i === at ? "bg-indigo text-white" : "bg-white border border-slate-200 text-slate-500")}>{i + 1}</span>
                {s}
              </li>
            );
          })}
        </ol>

        <div id="decision" className="scroll-mt-24 mt-8 grid lg:grid-cols-[1fr_1.15fr] gap-px overflow-hidden rounded-3xl border border-slate-100 bg-slate-100 shadow-card [&>*]:min-w-0">
          {/* El problema */}
          <div className="bg-white p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <span aria-hidden className="h-10 w-10 shrink-0 rounded-full bg-indigo-soft text-indigo grid place-items-center text-xs font-semibold">{DEMO.from.initials}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold text-ink">{DEMO.from.name}</span>
                  <span className="text-xs text-slate-500">{DEMO.from.role}</span>
                </div>
                <div className="mt-2 rounded-2xl rounded-tl-md bg-canvas px-4 py-3 text-[14px] leading-relaxed text-ink">
                  {DEMO.message.map((m) => <p key={m} className="[&+p]:mt-1.5">{m}</p>)}
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><MessageCircle size={12} aria-hidden /> {DEMO.from.channel} · {DEMO.from.time}</div>
                </div>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 text-[12.5px]">
              {DEMO.facts.map(([k, v]) => (
                <div key={k} className="bg-white px-3.5 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-ink">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-4 text-[11.5px] text-slate-500">Ejemplo ilustrativo basado en el primer caso de Botanas Cumbre.</p>
          </div>

          {/* La decisión y sus consecuencias */}
          <div className="bg-white p-5 sm:p-7">
            {!opt || !ph ? (
              <div>
                <p className="text-[15px] font-semibold text-ink">{DEMO.ask}</p>
                <div className="mt-3 grid gap-2">
                  {DEMO.options.map((o, i) => (
                    <button
                      key={o.id}
                      ref={i === 0 ? firstRef : undefined}
                      type="button"
                      data-option
                      onClick={() => choose(o.id)}
                      className="group w-full text-left rounded-2xl border border-slate-200 px-4 py-3 hover:border-indigo hover:bg-indigo-soft/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo motion-safe:transition-colors"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-[14px] font-semibold text-ink">{o.label}</span>
                        <ArrowRight size={15} aria-hidden className="shrink-0 text-slate-300 group-hover:text-indigo" />
                      </span>
                      <span className="mt-0.5 block text-[13px] text-slate-500">{o.detail}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[11.5px] text-slate-500">Ninguna opción es la correcta por definición. Cada una tiene un costo.</p>
              </div>
            ) : (
              <div ref={boxRef} className="ceo-rise">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{DEMO.picked}</div>
                <h3 ref={resultRef} tabIndex={-1} className="mt-0.5 text-[19px] font-semibold text-ink outline-none">{opt.label}</h3>
                <p className="mt-1 text-[14px] text-slate-600">{DEMO.watch}</p>

                <div className="mt-4 inline-flex rounded-xl bg-canvas p-1" role="group" aria-label="Momento">
                  {DEMO.phases.map((p, i) => (
                    <button key={p} type="button" aria-pressed={phase === i} onClick={() => setPhase(i as 0 | 1)} className={clsx("rounded-lg px-3.5 py-1.5 text-[13px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo motion-safe:transition-colors", phase === i ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink")}>{p}</button>
                  ))}
                </div>

                <div aria-live="polite">
                  <div className="mt-4"><EffectBars effects={ph.effects} words={ph.words} compact /></div>
                  <p key={`${opt.id}-${phase}`} className="mt-4 text-[14px] leading-relaxed text-ink academy-in">{ph.text}</p>
                </div>

                {phase === 0 ? (
                  <button type="button" onClick={() => setPhase(1)} className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-indigo/30 bg-indigo-soft/50 px-3.5 py-2 text-[13px] font-semibold text-indigo hover:bg-indigo-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo">
                    {DEMO.seeLater} <ArrowRight size={14} aria-hidden />
                  </button>
                ) : (
                  <div className="academy-in">
                    <p className="mt-4 border-l-2 border-indigo pl-3 text-[14px] leading-relaxed text-ink"><span className="font-semibold">El intercambio.</span> {opt.tradeoff}</p>
                    <div className="mt-5 rounded-2xl bg-canvas p-4">
                      <p className="text-[15px] font-semibold text-ink">{DEMO.close}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={START_HREF} className="btn bg-mint text-white hover:bg-mint-light !px-4 !py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo">{DEMO.cta} <ArrowRight size={15} aria-hidden /></Link>
                        <button type="button" onClick={reset} className="btn-ghost !py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"><RotateCcw size={14} aria-hidden /> {DEMO.retry}</button>
                      </div>
                    </div>
                  </div>
                )}
                <p className="mt-4 text-[11.5px] leading-relaxed text-slate-500">{DEMO.disclaimer}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
