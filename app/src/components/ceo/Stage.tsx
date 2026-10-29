"use client";
/**
 * Pantalla de decisión a pantalla completa, con el fondo mêtis (el mismo del onboarding).
 * Avanza por pasos, como las preguntas iniciales: un paso por pantalla, Atrás / Siguiente
 * y, en el celular, deslizar a la izquierda o a la derecha.
 */
import Link from "next/link";
import { useEffect, useRef } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export interface StageProps {
  /** Nombres cortos de los pasos (p. ej. «El caso», «Decides», «Aprendes»). */
  steps: string[];
  at: number;
  /** Pasos a los que ya se puede ir (los siguientes se ven, pero apagados). */
  reach?: number;
  exit?: string;
  top?: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  next?: React.ReactNode;
  nextOff?: boolean;
  /** Algo junto al botón principal (p. ej. «Abrir sin reloj»). */
  aside?: React.ReactNode;
  children: React.ReactNode;
}

export function Stage({ steps, at, reach, exit = "/ceo", top, onBack, onNext, next = "Siguiente", nextOff, aside, children }: StageProps) {
  const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [at]);
  const start = (e: React.TouchEvent) => { const p = e.touches[0]; touch.current = { x: p.clientX, y: p.clientY }; };
  const end = (e: React.TouchEvent) => {
    const s = touch.current; touch.current = null;
    if (!s) return;
    if ((e.target as HTMLElement).closest("input, textarea, [data-noswipe]")) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - s.x, dy = p.clientY - s.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && onNext && !nextOff) onNext();
    else if (dx > 0 && onBack) onBack();
  };
  const r = reach ?? at;
  return (
    <main onTouchStart={start} onTouchEnd={end} className="min-h-screen bg-gradient-to-br from-[#0F1130] via-[#1A1650] to-[#2B1F8A] text-white">
      <div aria-hidden className="pointer-events-none fixed -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-light/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none fixed -left-24 bottom-0 h-72 w-72 rounded-full bg-mint/15 blur-3xl" />
      <div className="relative mx-auto max-w-2xl min-h-screen flex flex-col px-5 pt-6 pb-0 sm:pt-10">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><Logo variant="light" height={24} /><span className="chip bg-white text-ink text-[10px] tracking-wider">CEO</span></span>
          <div className="flex items-center gap-3">
            {top}
            <Link href={exit} aria-label="Salir" className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center"><X size={17} /></Link>
          </div>
        </div>
        <ol className="mt-6 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label={`Paso ${at + 1} de ${steps.length}`}>
          {steps.map((s, i) => (
            <li key={`${s}-${i}`} className="min-w-0">
              <span className={clsx("block h-1 rounded-full transition-colors", i === at ? "bg-mint" : i <= r ? "bg-white/60" : "bg-white/15")} />
              <span className={clsx("mt-1.5 block truncate text-[11px]", i === at ? "text-white font-medium" : "text-white/45")}>{s}</span>
            </li>
          ))}
        </ol>
        <section key={at} className="academy-in mt-7 flex-1">{children}</section>
        {(onBack || onNext || aside) && (
          <div className="sticky bottom-0 z-20 -mx-5 mt-8 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] rounded-t-2xl border-t border-white/10 bg-[#1b1752]/95 backdrop-blur-md flex flex-wrap items-center gap-3">
            {onBack && <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white"><ArrowLeft size={14} /> Atrás</button>}
            <span className="flex-1" />
            {aside}
            {onNext && <button type="button" disabled={nextOff} onClick={onNext} className="btn bg-white text-ink hover:bg-white/90 px-5 py-2.5 font-semibold disabled:opacity-40">{next} <ArrowRight size={15} /></button>}
          </div>
        )}
      </div>
    </main>
  );
}

/** Encabezado de paso sobre el fondo mêtis. */
export function StepTitle({ eyebrow, title, text }: { eyebrow?: React.ReactNode; title: React.ReactNode; text?: React.ReactNode }) {
  return (
    <div>
      {eyebrow && <div className="text-xs font-semibold uppercase tracking-wider text-mint">{eyebrow}</div>}
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight">{title}</h1>
      {text && <p className="mt-3 text-white/70 text-[15px] leading-relaxed">{text}</p>}
    </div>
  );
}

/** Opción al estilo de las preguntas iniciales: translúcida; blanca al elegirla. */
export function StageChoice({ on, onClick, letter, children }: { on: boolean; onClick: () => void; letter?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={clsx("w-full text-left rounded-2xl border px-4 py-3.5 flex items-start gap-3 text-[15px] leading-relaxed transition-all", on ? "bg-white text-ink border-white shadow-[0_0_0_4px_rgba(109,93,246,.35)]" : "bg-white/[.06] border-white/[.12] text-white hover:bg-white/10")}>
      {letter ? <span className={clsx("h-7 w-7 rounded-full grid place-items-center text-xs font-bold shrink-0", on ? "bg-indigo text-white" : "bg-white/10 text-white/70")}>{letter}</span>
        : <span className={clsx("mt-1 h-4 w-4 rounded-full shrink-0", on ? "border-[5px] border-indigo" : "border-[1.5px] border-white/40")} />}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}
