"use client";
/**
 * Landing · Ruta de implementación (12 semanas).
 * Se despliega al entrar en pantalla, fase por fase, con las mismas animaciones del árbol de Estrategia.
 */
import { useEffect, useRef, useState } from "react";

const STEPS: [string, string, string][] = [
  ["1–3", "Diagnóstico", "Entrevistas, KPIs actuales e Índice de Alineación."],
  ["3–6", "Diseño estratégico", "MEGA, líneas de acción, KPIs y proyectos."],
  ["6–8", "Cascadeo y metas", "Alcances, Owners, Contributors y metas."],
  ["8–10", "Configuración y capacitación", "Plataforma lista, carga inicial y Academia."],
  ["10–12", "Primer cierre y ritmo", "Primer cierre mensual y sesiones WTW / WTM."],
];
const STEP_MS = 280;

export function RutaImplementacion() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const anim = (cls: string, delay: number) => (on ? { className: cls, style: { animationDelay: `${delay}ms` } } : { className: "opacity-0", style: undefined });

  return (
    <div ref={ref} className="rounded-3xl bg-white border border-slate-100 shadow-[0_1px_2px_rgba(23,26,58,0.04),0_12px_32px_-12px_rgba(23,26,58,0.10)] p-7 lg:p-8">
      <div className={"flex items-baseline justify-between " + anim("tree-drop", 0).className}>
        <h3 className="font-semibold text-ink">Ruta de implementación</h3>
        <span className="text-xs font-medium text-slate-400 tabular-nums">12 semanas</span>
      </div>
      <ol className="mt-7">
        {STEPS.map(([w, t, d], i) => {
          const last = i === STEPS.length - 1;
          const t0 = 200 + i * STEP_MS;
          const week = anim("tree-slide", t0);
          const dot = anim("tree-pop", t0);
          const text = anim("tree-pop", t0 + 60);
          const line = anim("tree-grow-y", t0 + 140);
          return (
            <li key={w} className="relative grid grid-cols-[3.75rem_1fr] gap-x-4">
              <div className={"pt-px text-right " + week.className} style={week.style}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Semana</div>
                <div className="text-sm font-semibold text-indigo tabular-nums leading-tight">{w}</div>
              </div>
              <div className={"relative pl-6 " + (last ? "" : "pb-8")}>
                {!last && <span aria-hidden className={"absolute left-[5px] top-4 bottom-0 w-px bg-gradient-to-b from-indigo/30 to-indigo/10 " + line.className} style={line.style} />}
                <span aria-hidden className={"absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full ring-4 ring-white " + (last ? "bg-mint " : "bg-indigo ") + dot.className} style={dot.style} />
                {last && on && <span aria-hidden className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full ruta-ring" style={{ animationDelay: `${t0 + 450}ms` }} />}
                <div className={text.className} style={text.style}>
                  <div className="font-medium text-ink leading-tight">{t}</div>
                  <p className="mt-1 text-sm text-slate-500 leading-snug">{d}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
