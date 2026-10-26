"use client";
/** Se activa una sola vez cuando el elemento entra en pantalla (mismo patrón que RutaImplementacion). */
import { useEffect, useRef, useState } from "react";

export function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  /** Clase + retraso de animación, o invisible mientras no entra en pantalla. */
  const anim = (cls: string, delay = 0) => (on ? { className: cls, style: { animationDelay: `${delay}ms` } } : { className: "opacity-0", style: undefined });
  return { ref, on, anim };
}
