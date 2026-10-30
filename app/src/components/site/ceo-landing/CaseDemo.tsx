"use client";
/**
 * Primer bloque de la landing: un caso real del simulador (SuperNorte, día 2 de Botanas Cumbre) con el mismo
 * recorrido por pasos que la pantalla de decisión de la app (components/ceo/Stage.tsx + CaseView.tsx):
 * El caso → Contexto → Decides → Resultado → Aprendes, con barras de avance, «Atrás» y el botón siguiente.
 * Antes de decidir no se pasa de «Decides»; después, no se regresa a decidir (igual que en la app).
 * Aislado: vive en memoria, no usa el motor, la partida, la cuenta ni el almacenamiento. Copy en ./content.
 */
import { useRef, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, Mail, Quote, RotateCcw } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import type { Copy } from "./content";

const LETTER = (i: number) => String.fromCharCode(65 + i);

function Avatar({ initials, tone, size = 40 }: { initials: string; tone: string; size?: number }) {
  return <span aria-hidden className="shrink-0 rounded-full grid place-items-center font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.36, background: tone }}>{initials}</span>;
}

export function CaseDemo({ t }: { t: Copy }) {
  const C = t.CASE;
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [decided, setDecided] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = (n: number) => { setStep(n); box.current?.scrollTo({ top: 0 }); };
  const done = decided !== null;
  const reach = done ? 4 : 2;
  const back = step === 0 || (done && step === 3) ? undefined : () => go(step - 1);
  const fwd = step < 2 ? () => go(step + 1) : done && step === 3 ? () => go(4) : undefined;
  const confirm = () => { if (!picked) return; setDecided(picked); go(3); };
  const again = () => { setDecided(null); setPicked(null); go(2); };
  const o = C.options.find((x) => x.id === decided);
  const oi = C.options.findIndex((x) => x.id === decided);

  const onEnd = (e: React.TouchEvent) => {
    const s = touch.current; touch.current = null;
    if (!s) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - s.x, dy = p.clientY - s.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && fwd) fwd(); else if (dx > 0 && back) back();
  };

  return (
    <div role="region" aria-label={C.label} className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 sm:-inset-10 rounded-[3rem] bg-gradient-to-br from-indigo-light/25 via-transparent to-mint/20 blur-2xl" />
      <div
        onTouchStart={(e) => { const p = e.touches[0]; touch.current = { x: p.clientX, y: p.clientY }; }}
        onTouchEnd={onEnd}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0F1130] via-[#1A1650] to-[#2B1F8A] text-white shadow-[0_30px_80px_-30px_rgba(43,31,138,.65)] ring-1 ring-white/10 h-[600px] sm:h-[640px] flex flex-col"
      >
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-mint/15 blur-3xl" />

        <div className="relative px-5 sm:px-6 pt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2"><Logo variant="light" height={20} /><span className="chip bg-white text-ink text-[10px] tracking-wider">CEO</span></span>
            <span className="text-[11px] text-white/50">{C.label}</span>
          </div>
          <ol className="mt-5 grid grid-cols-5 gap-2" aria-label={C.stepOf.replace("{n}", String(step + 1)).replace("{t}", String(C.steps.length))}>
            {C.steps.map((s, i) => (
              <li key={s} className="min-w-0" aria-current={i === step ? "step" : undefined}>
                <span className={clsx("block h-1 rounded-full motion-safe:transition-colors", i === step ? "bg-mint" : i <= reach ? "bg-white/60" : "bg-white/15")} />
                <span className={clsx("mt-1.5 block truncate text-[11px]", i === step ? "text-white font-medium" : "text-white/45")}>{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div ref={box} className="relative flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 pt-5 pb-6 [scrollbar-width:thin]" aria-live="polite">
          <section key={step} className="academy-in">
            {step === 0 && (
              <>
                <div className="text-xs font-semibold uppercase tracking-wider text-mint">{C.received}</div>
                <article className="mt-3 card overflow-hidden text-ink">
                  <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <Avatar initials={C.from.initials} tone={C.from.tone} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-ink text-[15px]">{C.from.name}</span><span className="chip gap-1 bg-indigo-soft text-indigo"><Mail size={11} aria-hidden /> {C.channel}</span></div>
                        <div className="text-xs text-slate-500">{C.from.role}</div>
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">{C.from.time}</span>
                    </div>
                    <h3 className="mt-4 text-[17px] font-semibold text-ink leading-snug">{C.subject}</h3>
                    <div className="mt-1 text-xs text-slate-400">{C.to}</div>
                  </div>
                  <div className="px-5 py-4 space-y-3 text-[14px] leading-relaxed text-slate-700">
                    {C.body.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
                  </div>
                </article>
              </>
            )}

            {step === 1 && (
              <>
                <div className="text-xs font-semibold uppercase tracking-wider text-mint">{C.context.eyebrow}</div>
                <h3 className="mt-2 text-2xl font-semibold leading-tight">{C.context.title}</h3>
                <p className="mt-2 text-white/70 text-[14px] leading-relaxed">{C.context.text}</p>
                <div className="mt-5 card p-5 text-ink">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{C.context.data.title}</div>
                  <dl className="mt-3 divide-y divide-slate-100">
                    {C.context.data.rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2 text-[13px]"><dt className="text-slate-500">{k}</dt><dd className="font-semibold text-ink text-right tabular-nums">{v}</dd></div>)}
                  </dl>
                  <p className="mt-3 rounded-xl bg-amber-soft/60 px-3.5 py-2.5 text-[13px] text-ink">{C.context.data.note}</p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-xs font-semibold uppercase tracking-wider text-mint">{C.decide.eyebrow}</div>
                <h3 className="mt-2 text-2xl font-semibold leading-tight">{C.decide.ask}</h3>
                <div className="mt-5 space-y-2.5">
                  {C.options.map((x, i) => {
                    const on = picked === x.id;
                    return (
                      <button key={x.id} type="button" onClick={() => setPicked(x.id)} aria-pressed={on} className={clsx("w-full text-left rounded-2xl border px-4 py-3 flex items-start gap-3 text-[14px] leading-relaxed motion-safe:transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint", on ? "bg-white text-ink border-white shadow-[0_0_0_4px_rgba(109,93,246,.35)]" : "bg-white/[.06] border-white/[.12] text-white hover:bg-white/10")}>
                        <span aria-hidden className={clsx("h-7 w-7 rounded-full grid place-items-center text-xs font-bold shrink-0", on ? "bg-indigo text-white" : "bg-white/10 text-white/70")}>{LETTER(i)}</span>
                        <span className="min-w-0 flex-1"><span className="sr-only">{LETTER(i)}. </span>{x.text}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" disabled={!picked} onClick={confirm} className="btn bg-white text-ink hover:bg-white/90 w-full justify-center mt-5 py-3 text-[15px] font-semibold disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint">{C.decide.cta} <ArrowRight size={16} aria-hidden /></button>
              </>
            )}

            {step === 3 && o && (
              <div className="space-y-4 text-ink">
                <div className="card p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{C.result.decided}</div>
                  <p className="mt-1.5 text-[14px] text-ink font-medium leading-relaxed">{LETTER(oi)}. {o.text}</p>
                  <div className="mt-4 space-y-2">
                    {o.reply.map((r) => <div key={r} className="flex gap-2.5"><Avatar initials={C.from.initials} tone={C.from.tone} size={26} /><p className="text-[14px] text-slate-700 leading-relaxed">{r}</p></div>)}
                  </div>
                </div>
                <div className="card p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{C.result.what}</div>
                  <p className="mt-2 text-[14px] text-ink leading-relaxed">{o.outcome}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {o.effects.map(([k, v], i) => (
                      <li key={k} className={clsx("chip px-3 py-1 text-[13px] gap-1.5 tree-pop", v > 0 ? "bg-indigo-soft text-indigo" : "bg-coral-soft text-coral")} style={{ animationDelay: `${200 + i * 120}ms` }}>
                        {k} <b className="tabular-nums">{v > 0 ? "+" : ""}{v}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <div className="relative rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-indigo-soft p-5 text-ink">
                  <Quote size={20} aria-hidden className="absolute right-5 top-5 text-indigo/20" />
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">{C.learn.eyebrow}</div>
                  <h3 className="mt-1.5 font-semibold text-ink pr-8">{C.learn.title}</h3>
                  <p className="mt-2 text-[13.5px] text-slate-600 leading-relaxed">{C.learn.text}</p>
                  <div className="mt-4 flex gap-2.5 rounded-xl bg-white/80 px-4 py-3"><Lightbulb size={16} aria-hidden className="text-indigo shrink-0 mt-0.5" /><p className="text-[13.5px] text-ink"><b>{C.learn.notaLabel}</b> {C.learn.nota}</p></div>
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-indigo text-white px-4 py-3">
                    <BookOpen size={18} aria-hidden />
                    <span className="flex-1 text-[13.5px]"><b>{C.learn.lessonLabel}</b> {C.learn.lesson}</span>
                  </div>
                </div>
                <p className="text-[11.5px] leading-relaxed text-white/50">{C.note}</p>
              </div>
            )}
          </section>
        </div>

        {(back || fwd || step === 4) && (
          <div className="relative border-t border-white/10 bg-[#1b1752]/95 px-5 sm:px-6 py-3.5 flex items-center gap-3">
            {back && <button type="button" onClick={back} className="inline-flex items-center gap-1.5 rounded text-sm text-white/65 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint"><ArrowLeft size={14} aria-hidden /> {C.nav.back}</button>}
            <span className="flex-1" />
            {step === 4 && <button type="button" onClick={again} className="btn bg-white text-ink hover:bg-white/90 px-4 py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"><RotateCcw size={14} aria-hidden /> {C.nav.again}</button>}
            {fwd && <button type="button" onClick={fwd} className="btn bg-white text-ink hover:bg-white/90 px-4 py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint">{C.nav.next[step]} <ArrowRight size={15} aria-hidden /></button>}
          </div>
        )}
      </div>
    </div>
  );
}
