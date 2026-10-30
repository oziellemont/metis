"use client";
/**
 * «Una empresa que recuerda»: las cuatro historias de Botanas Cumbre en un solo carrusel, una a la vez.
 * - Las cuatro tarjetas ocupan la misma celda de la cuadrícula: la altura es la de la más alta y no salta al rotar.
 * - Avanza cada 7 s; se detiene con el botón, al pasar el mouse, al recibir foco o al interactuar.
 * - Con movimiento reducido no rota sola y no hay transición.
 * - Sin JS se ve la primera historia (el resto queda oculto a todos, no solo a la vista).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { DIFF, MEMORY_INTERVAL_MS, type Echo } from "./content";

function EchoCard({ e }: { e: Echo }) {
  return (
    <div className="flex flex-col rounded-3xl bg-white/[0.06] p-5 sm:p-7">
      <h3 className="text-lg sm:text-xl font-semibold">{e.t}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-white/65">{e.context}</p>
      <ol className="mt-5 relative space-y-4 pl-6">
        <span aria-hidden className="absolute left-[5px] top-2 bottom-8 w-px bg-white/20" />
        <li className="relative">
          <span aria-hidden className="absolute -left-6 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-white/50 bg-[#141735]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">{e.decide.day} · {DIFF.decideLabel}</p>
          <p className="mt-1 text-[15px] text-white">{e.decide.text}</p>
        </li>
        <li className="relative">
          <span aria-hidden className={"absolute -left-6 top-1.5 h-[11px] w-[11px] rounded-full " + (e.tone === "bien" ? "bg-mint" : "bg-amber-400")} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">{e.back.day} · {DIFF.backLabel}</p>
          <div className="mt-2 flex gap-3 rounded-2xl bg-white p-3.5 text-ink">
            <span aria-hidden className="h-8 w-8 shrink-0 rounded-full bg-indigo-soft text-indigo grid place-items-center text-[10px] font-semibold">{e.back.initials}</span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold">{e.back.who}</div>
              <p className="mt-0.5 text-[14px] leading-relaxed">{e.back.text}</p>
            </div>
          </div>
        </li>
      </ol>
    </div>
  );
}

export function MemoryCarousel() {
  const items = DIFF.items;
  const n = items.length;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false); // arranca al montar si no hay movimiento reducido
  const [held, setHeld] = useState(false); // mouse encima o foco dentro
  const [calm, setCalm] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setCalm(mq.matches);
    setPlaying(!mq.matches);
    const on = () => { setCalm(mq.matches); if (mq.matches) setPlaying(false); };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!playing || held) return;
    const t = window.setTimeout(() => setI((k) => (k + 1) % n), MEMORY_INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [playing, held, i, n]);

  // Interactuar detiene la rotación: quien está leyendo decide cuándo avanzar.
  const go = useCallback((k: number) => { setPlaying(false); setI(((k % n) + n) % n); }, [n]);

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Historias de Botanas Cumbre"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={(e) => { if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setHeld(false); }}
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(i + 1); else if (e.key === "ArrowLeft") go(i - 1); }}
      className="mx-auto max-w-3xl"
    >
      <div className="grid" aria-live={playing && !held ? "off" : "polite"}>
        {items.map((e, k) => (
          <div
            key={e.t}
            role="group"
            aria-roledescription="historia"
            aria-label={`${k + 1} de ${n}: ${e.t}`}
            aria-hidden={k !== i}
            inert={k !== i}
            className={clsx("[grid-area:1/1] min-w-0", !calm && "motion-safe:transition-opacity motion-safe:duration-500", k === i ? "opacity-100" : "opacity-0 pointer-events-none")}
          >
            <EchoCard e={e} />
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-center gap-2">
        <button type="button" onClick={() => go(i - 1)} aria-label="Historia anterior" className="h-10 w-10 grid place-items-center rounded-full text-white/70 hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          <ChevronLeft size={18} aria-hidden />
        </button>
        <div className="flex items-center" role="group" aria-label="Elegir historia">
          {items.map((e, k) => (
            <button key={e.t} type="button" onClick={() => go(k)} aria-label={`Historia ${k + 1}: ${e.t}`} aria-current={k === i ? "true" : undefined} className="h-10 w-8 grid place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              <span aria-hidden className={clsx("block h-2 rounded-full motion-safe:transition-all", k === i ? "w-6 bg-white" : "w-2 bg-white/35 ring-1 ring-white/40")} />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => go(i + 1)} aria-label="Historia siguiente" className="h-10 w-10 grid place-items-center rounded-full text-white/70 hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          <ChevronRight size={18} aria-hidden />
        </button>
        <button type="button" onClick={() => setPlaying((v) => !v)} aria-label={playing ? "Pausar el carrusel" : "Reproducir el carrusel"} className="ml-2 h-10 w-10 grid place-items-center rounded-full text-white/70 hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
        </button>
      </div>
    </div>
  );
}
