"use client";
/**
 * Lista que aparece elemento por elemento al entrar en pantalla (misma animación ceo-rise del producto).
 * Sin JS, o con movimiento reducido, todo se ve desde el inicio: la clase que oculta solo se pone aquí.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Stagger({ className, label, children }: { className: string; label: string; children: ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);
  const [mode, setMode] = useState<"" | "wait" | "in">("");
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return; // ya visible al cargar: no se esconde
    setMode("wait");
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setMode("in"); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <ol ref={ref} aria-label={label} className={className + (mode ? " ceo-stagger ceo-stagger-" + mode : "")}>{children}</ol>;
}
