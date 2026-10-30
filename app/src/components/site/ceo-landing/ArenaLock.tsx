"use client";
/**
 * Candado de The Executive Arena bajo la ruta de carrera: se abre una sola vez al entrar en pantalla.
 * Es ilustrativo (no es un botón ni toca el progreso real). Con movimiento reducido, o sin JS, se ve abierto y quieto.
 */
import { useEffect, useRef, useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { PATH } from "./content";

export function ArenaLock() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"open" | "closed" | "opening">("open");
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return; // ya visible al cargar
    setState("closed");
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); window.setTimeout(() => setState("opening"), 350); }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Icon = state === "closed" ? Lock : LockOpen;
  return (
    <div ref={ref} className="mt-12 mx-auto max-w-md text-center">
      <span aria-hidden className={"mx-auto h-16 w-16 rounded-2xl bg-ink text-mint-light grid place-items-center " + (state === "opening" ? "ceo-pop" : "")}>
        <Icon size={26} />
      </span>
      <h3 className="mt-5 text-xl font-semibold text-ink">{PATH.beyond.t}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{PATH.beyond.d}</p>
    </div>
  );
}
