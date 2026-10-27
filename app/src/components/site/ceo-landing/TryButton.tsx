"use client";
/**
 * «Probar una decisión»: lleva la vista al caso, lo resalta un momento y deja el foco en la
 * primera opción. Sin JS sigue funcionando como ancla a #decision.
 */
import type { MouseEvent, ReactNode } from "react";

export function TryButton({ className, children }: { className: string; children: ReactNode }) {
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById("decision");
    if (!el) return;
    e.preventDefault();
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const r = el.getBoundingClientRect();
    // En escritorio el caso ya está a la vista: solo se desplaza si no cabe en pantalla.
    if (r.top < 72 || r.top > window.innerHeight * 0.5) el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    el.classList.remove("ceo-attn");
    void el.offsetWidth;
    el.classList.add("ceo-attn");
    window.setTimeout(() => el.classList.remove("ceo-attn"), 1800);
    el.querySelector<HTMLButtonElement>("button[data-option]")?.focus({ preventScroll: true });
  };
  return <a href="#decision" onClick={go} className={className}>{children}</a>;
}
