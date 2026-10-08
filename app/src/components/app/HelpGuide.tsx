"use client";
/**
 * Instructor contextual: botón «?» fijo en la esquina inferior derecha.
 * Al abrirlo explica la página actual, qué hacer y responde dudas frecuentes.
 * Se puede abrir desde cualquier lugar con: window.dispatchEvent(new Event("metis-help"))
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ChevronDown, HelpCircle, Search, X } from "lucide-react";
import { generalFaqs, guideFor, searchHelp, type Faq } from "@/lib/help/guides";

export const openHelp = () => window.dispatchEvent(new Event("metis-help"));

export function HelpGuide() {
  const path = usePathname();
  const g = useMemo(() => guideFor(path), [path]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [faq, setFaq] = useState<number | null>(null);
  const [seen, setSeen] = useState(true);
  const panel = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  // El punto verde «respira» hasta que el usuario abre la guía por primera vez.
  useEffect(() => { setSeen(localStorage.getItem("metis-help-seen") === "1"); }, []);
  useEffect(() => { setQ(""); setFaq(null); }, [path]);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("metis-help", onOpen);
    return () => window.removeEventListener("metis-help", onOpen);
  }, []);
  useEffect(() => {
    if (!open) return;
    if (!seen) { localStorage.setItem("metis-help-seen", "1"); setSeen(true); }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onDown); };
  }, [open, seen]);

  const results = q.trim() ? searchHelp(q, path) : null;
  const faqs: (Faq & { page?: string })[] = results ?? [...g.faqs, ...generalFaqs.slice(0, Math.max(0, 4 - g.faqs.length))];

  return (
    <div className="no-print fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <div ref={panel} role="dialog" aria-label={`Guía: ${g.title}`}
          className="help-in mb-3 w-[min(360px,calc(100vw-2.5rem))] max-h-[min(560px,calc(100vh-7rem))] flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_24px_60px_-20px_rgba(23,26,58,0.45)]">
          <div className="relative bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] px-5 pt-4 pb-4 text-white">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mint">Tu guía · estás en</div>
            <div className="mt-0.5 text-base font-semibold">{g.title}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-white/70">{g.purpose}</p>
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Cerrar guía"><X size={15} /></button>
          </div>

          <div className="overflow-y-auto px-5 py-4 space-y-4">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-canvas px-3 py-2 focus-within:border-indigo/40 focus-within:ring-2 focus-within:ring-indigo/10">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setFaq(null); }} placeholder="¿Cuál es tu duda?" aria-label="Escribe tu duda"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-400" />
              {q && <button onClick={() => setQ("")} aria-label="Borrar" className="text-slate-400 hover:text-ink"><X size={12} /></button>}
            </label>

            {!results && g.steps.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Qué hacer aquí</div>
                <ol className="mt-2 space-y-1.5">
                  {g.steps.map((s, i) => (
                    <li key={s} className="flex gap-2.5 text-[12.5px] leading-snug text-slate-700">
                      <span className="mt-px h-[18px] w-[18px] shrink-0 rounded-full bg-indigo-soft text-indigo grid place-items-center text-[10px] font-semibold">{i + 1}</span>{s}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{results ? `Resultados (${results.length})` : "Dudas frecuentes"}</div>
              {faqs.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-slate-500">No encontré esa duda. Prueba con otras palabras o pregúntale a tu consultor METIS.</p>
              ) : (
                <div className="mt-1.5 divide-y divide-slate-100">
                  {faqs.map((f, i) => (
                    <div key={f.q + i}>
                      <button onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i}
                        className="flex w-full items-start gap-2 py-2 text-left text-[12.5px] font-medium text-ink hover:text-indigo">
                        <span className="flex-1">{f.q}{results && f.page && <span className="ml-1.5 text-[10px] font-normal text-slate-400">· {f.page}</span>}</span>
                        <ChevronDown size={14} className={clsx("mt-0.5 shrink-0 text-slate-400 transition-transform", faq === i && "rotate-180")} />
                      </button>
                      {faq === i && <p className="help-in pb-2.5 text-[12.5px] leading-relaxed text-slate-600">{f.a}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <button ref={btn} onClick={() => setOpen((o) => !o)} aria-label={open ? "Cerrar guía" : "Abrir guía de esta página"} title="¿Dudas? Te guío en esta página"
        className={clsx("help-fab group relative grid h-11 w-11 place-items-center rounded-full text-white transition-transform duration-200 hover:scale-105 active:scale-95",
          "bg-gradient-to-br from-indigo-light via-indigo to-[#2B1F8A] shadow-[0_10px_24px_-8px_rgba(79,63,224,0.65)]")}>
        <span aria-hidden className="help-ring absolute inset-0 rounded-full" />
        {open ? <X size={18} /> : <HelpCircle size={20} strokeWidth={2} className="transition-transform duration-300 group-hover:rotate-12" />}
        {!seen && !open && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-mint" />}
      </button>
    </div>
  );
}
