"use client";
/**
 * «Tu primera decisión»: demo guiada de la landing. Vive solo en memoria del navegador:
 * no usa el motor del simulador, no guarda nada, no da XP ni toca la partida del visitante.
 */
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, RotateCcw } from "lucide-react";
import { DEMO, START_HREF } from "./content";
import { EffectBars } from "./Effects";

export function FirstDecision() {
  const [pick, setPick] = useState<string | null>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);
  const opt = DEMO.options.find((o) => o.id === pick) ?? null;

  const choose = (id: string) => {
    setPick(id);
    requestAnimationFrame(() => {
      resultRef.current?.focus({ preventScroll: true });
      // El resultado es más alto que las opciones: se lleva a la vista para no perder el hilo.
      const box = boxRef.current;
      if (!box) return;
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (box.getBoundingClientRect().top < 80 || box.getBoundingClientRect().top > window.innerHeight * 0.45) {
        window.scrollTo({ top: window.scrollY + box.getBoundingClientRect().top - 88, behavior: calm ? "auto" : "smooth" });
      }
    });
  };
  const reset = () => {
    setPick(null);
    requestAnimationFrame(() => {
      firstRef.current?.focus({ preventScroll: true });
      firstRef.current?.closest("section")?.scrollIntoView({ block: "nearest" });
    });
  };

  return (
    <section id="decision" aria-labelledby="decision-title" className="scroll-mt-24 rounded-3xl bg-white motion-safe:transition-shadow text-ink shadow-[0_24px_60px_-24px_rgba(10,10,40,0.55)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 sm:px-6 py-3">
        <h2 id="decision-title" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo">{DEMO.label}</h2>
        <span className="text-[11px] text-slate-500">Ejemplo ilustrativo</span>
      </div>

      <div className="px-5 sm:px-6 pt-5">
        <div className="flex items-start gap-3">
          <span aria-hidden className="h-10 w-10 shrink-0 rounded-full bg-indigo-soft text-indigo grid place-items-center text-xs font-semibold">{DEMO.from.initials}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-semibold">{DEMO.from.name}</span>
              <span className="text-xs text-slate-500">{DEMO.from.role}</span>
            </div>
            <div className="mt-2 rounded-2xl rounded-tl-md bg-canvas px-4 py-3 text-[14px] leading-relaxed text-ink">
              {DEMO.message.map((m) => <p key={m} className="[&+p]:mt-1.5">{m}</p>)}
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><MessageCircle size={12} aria-hidden /> {DEMO.from.channel} · {DEMO.from.time}</div>
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 text-[12.5px]">
          {DEMO.facts.map(([k, v]) => (
            <div key={k} className="bg-white px-3.5 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-ink">{v}</dd></div>
          ))}
        </dl>
      </div>

      {!opt ? (
        <div className="px-5 sm:px-6 py-5">
          <p className="text-[15px] font-semibold">{DEMO.ask}</p>
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
        <div ref={boxRef} className="px-5 sm:px-6 py-5 ceo-rise" aria-live="polite">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Decidiste</div>
          <h3 ref={resultRef} tabIndex={-1} className="mt-0.5 text-[17px] font-semibold text-ink outline-none">{opt.label}</h3>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-slate-100 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo">Hoy</div>
              <p className="mt-1 text-[14px] leading-relaxed">{opt.now}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo">Las semanas siguientes</div>
              <p className="mt-1 text-[14px] leading-relaxed">{opt.later}</p>
            </div>
          </div>

          <div className="mt-4"><EffectBars effects={opt.effects} compact /></div>

          <p className="mt-4 border-l-2 border-indigo pl-3 text-[14px] leading-relaxed text-ink"><span className="font-semibold">El intercambio.</span> {opt.tradeoff}</p>
          <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500">{DEMO.disclaimer}</p>

          <div className="mt-5 rounded-2xl bg-canvas p-4">
            <p className="text-[15px] font-semibold text-ink">{DEMO.close}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={START_HREF} className="btn bg-mint text-white hover:bg-mint-light !px-4 !py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo">{DEMO.cta} <ArrowRight size={15} aria-hidden /></Link>
              <button type="button" onClick={reset} className="btn-ghost !py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"><RotateCcw size={14} aria-hidden /> {DEMO.retry}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

