"use client";
/**
 * mêtis CEO · guía contextual: botón «?» fijo en la esquina inferior derecha (igual que en mêtis align).
 * Al abrirlo explica la pantalla en la que estás, y en Empresa y Carrera la pestaña que tienes abierta,
 * con preguntas clave para entender lo que ves (estado de resultados, margen, consejo, etc.).
 * El contenido vive en lib/ceo/guide.ts. Se puede abrir desde cualquier lugar con openCeoGuide().
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ChevronDown, HelpCircle, Search, X } from "lucide-react";
import { ceoGuideFor, searchCeoGuide, type CeoFaq, type CompanyKind } from "@/lib/ceo/guide";
import { useCeo } from "./CeoProvider";

const EVENT = "metis-ceo-guia";
const SEEN = "metis-ceo-guia-vista";
export const openCeoGuide = () => window.dispatchEvent(new Event(EVENT));

/** Pestaña abierta en Empresa o Carrera: la que el selector tipo pill marca como elegida. */
function currentView(): string | null {
  const id = document.querySelector('main [role="tablist"] [role="tab"][id^="tab-"][aria-selected="true"]')?.id ?? "";
  return id.startsWith("tab-") ? id.slice(4) : null;
}

export function CeoGuide() {
  const c = useCeo();
  const path = usePathname();
  const kind: CompanyKind = c.s.growth ? "crecimiento" : c.continuous ? "continua" : "temporadas";
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [faq, setFaq] = useState<number | null>(null);
  const [seen, setSeen] = useState(true);
  const panel = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const sim = c.s.settings.simulador === true;
  const g = useMemo(() => ceoGuideFor(path, view, kind, sim), [path, view, kind, sim]);

  // El punto verde se queda hasta que abres la guía por primera vez.
  useEffect(() => { try { setSeen(localStorage.getItem(SEEN) === "1"); } catch { /* sin almacenamiento: no se muestra el punto */ } }, []);
  useEffect(() => { setQ(""); setFaq(null); }, [g.key]);
  // Al abrir (y si cambias de pantalla con la guía abierta) se lee qué pestaña estás viendo.
  useEffect(() => { if (open) setView(currentView()); }, [open, path]);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, []);
  useEffect(() => {
    if (!open) return;
    if (!seen) { try { localStorage.setItem(SEEN, "1"); } catch { /* nada */ } setSeen(true); }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onDown); };
  }, [open, seen]);

  const results = q.trim() ? searchCeoGuide(q, path, view, kind) : null;
  const faqs: (CeoFaq & { page?: string; here?: boolean })[] = results ?? g.faqs;

  return (
    // Arriba de la barra inferior del celular y debajo de los paneles que se abren a pantalla completa.
    <div data-testid="guia" className="ceo-guide no-print fixed right-4 lg:right-5 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-5 z-40 flex flex-col items-end">
      {open && (
        <div ref={panel} role="dialog" aria-label={`Guía: ${g.title}`} data-testid="guia-panel" data-guia={g.key}
          className="help-in mb-3 w-[min(380px,calc(100vw-2rem))] max-h-[min(580px,calc(100dvh-13rem))] lg:max-h-[min(600px,calc(100vh-7rem))] flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_24px_60px_-20px_rgba(23,26,58,0.45)]">
          <div className="relative bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] px-5 pt-4 pb-4 text-white">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mint">Tu guía · estás en</div>
            <div className="mt-0.5 pr-6 text-base font-semibold">{g.title}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-white/70">{g.purpose}</p>
            <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Cerrar guía"><X size={15} /></button>
          </div>

          <div className="overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-canvas px-3 py-2 focus-within:border-indigo/40 focus-within:ring-2 focus-within:ring-indigo/10">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setFaq(null); }} placeholder="¿Cuál es tu duda?" aria-label="Escribe tu duda"
                className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-slate-400" />
              {q && <button type="button" onClick={() => setQ("")} aria-label="Borrar" className="text-slate-400 hover:text-ink"><X size={12} /></button>}
            </label>

            {!results && g.shows.length > 0 && (
              <div data-testid="guia-que-ves">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Qué estás viendo</div>
                <ul className="mt-2 space-y-1.5">
                  {g.shows.map((s) => (
                    <li key={s} className="flex gap-2.5 text-[12.5px] leading-snug text-slate-700">
                      <span aria-hidden className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-light" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div data-testid="guia-preguntas">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{results ? `Resultados (${results.length})` : "Preguntas clave"}</div>
              {faqs.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-slate-500">No encontré esa duda. Prueba con otras palabras, por ejemplo «margen», «caja» o «consejo».</p>
              ) : (
                <div className="mt-1.5 divide-y divide-slate-100">
                  {faqs.map((x, i) => (
                    <div key={x.q + i}>
                      <button type="button" onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i}
                        className="flex w-full items-start gap-2 py-2 text-left text-[12.5px] font-medium text-ink hover:text-indigo">
                        <span className="flex-1">{x.q}{results && x.page && !x.here && <span className="ml-1.5 text-[10px] font-normal text-slate-400">· {x.page}</span>}</span>
                        <ChevronDown size={14} className={clsx("mt-0.5 shrink-0 text-slate-400 transition-transform", faq === i && "rotate-180")} />
                      </button>
                      {faq === i && <p className="help-in pb-2.5 text-[12.5px] leading-relaxed text-slate-600">{x.a}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <button ref={btn} type="button" data-testid="guia-boton" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Cerrar guía" : "Abrir la guía de esta pantalla"} title="¿Dudas? Te explico esta pantalla"
        className={clsx("group relative grid h-11 w-11 place-items-center rounded-full text-white ring-1 ring-white/25 transition-transform duration-200 hover:scale-105 active:scale-95",
          "bg-gradient-to-br from-indigo-light via-indigo to-[#2B1F8A] shadow-[0_10px_24px_-8px_rgba(79,63,224,0.65)]")}>
        <span aria-hidden className="help-ring absolute inset-0 rounded-full" />
        {open ? <X size={18} /> : <HelpCircle size={20} strokeWidth={2} className="transition-transform duration-300 group-hover:rotate-12" />}
        {!seen && !open && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-mint" />}
      </button>
    </div>
  );
}
