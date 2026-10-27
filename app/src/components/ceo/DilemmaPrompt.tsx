"use client";
/**
 * Dilema del día como ventana en «Hoy». Sale cada vez que entras hasta que lo contestes.
 * «Recordar más tarde» lo pospone 2 horas; cerrar la ventana solo la oculta en esta visita.
 */
import { useEffect, useRef, useState } from "react";
import { Clock, Users, X } from "lucide-react";
import { XP } from "@/lib/ceo/engine";
import { DILEMMA_SNOOZE, dilemmaPromptDue, snoozeKey } from "@/lib/ceo/today";
import { DilemmaView } from "./DilemmaCard";
import { useCeo } from "./CeoProvider";

export function DilemmaPrompt() {
  const c = useCeo();
  const today = c.dilemma;
  const [hidden, setHidden] = useState(false);
  const [justPicked, setJustPicked] = useState<number | null>(null);
  const [snoozed, setSnoozed] = useState<number | null | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);
  const id = today?.d.id;

  useEffect(() => {
    if (!id) return;
    try { const v = Number(localStorage.getItem(snoozeKey(id))); setSnoozed(Number.isFinite(v) && v > 0 ? v : null); } catch { setSnoozed(null); }
  }, [id]);

  const answered = !!today && (today.done || !!c.s.dilemmas?.[today.d.id]);
  // Si se acaba de contestar, la ventana se queda abierta para ver la retroalimentación.
  const open = !!today && !hidden && snoozed !== undefined && (justPicked !== null || dilemmaPromptDue(answered, snoozed, c.now));

  useEffect(() => {
    if (!open) return;
    boxRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setHidden(true); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !today) return null;
  const { d } = today;
  const picked = c.s.dilemmas?.[d.id]?.option ?? justPicked;
  const gained = picked !== null ? XP.dilemma + d.options[picked].score * XP.dilemmaPoint : 0;
  const later = () => {
    const until = c.now + DILEMMA_SNOOZE;
    try { localStorage.setItem(snoozeKey(d.id), String(until)); } catch { /* ignore */ }
    setSnoozed(until);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#141735]/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => setHidden(true)}>
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dilema-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl outline-none academy-in"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="dilema-title" className="font-semibold text-ink inline-flex items-center gap-2"><span className="h-8 w-8 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><Users size={16} /></span> Dilema del día</h2>
          <div className="flex items-center gap-2">
            {picked !== null ? <span className="chip bg-mint-soft text-sob">+{gained} XP</span> : <span className="text-xs text-slate-400">1 minuto</span>}
            <button type="button" onClick={() => setHidden(true)} aria-label="Cerrar" className="h-8 w-8 grid place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink"><X size={16} /></button>
          </div>
        </div>
        <div className="mt-4">
          <DilemmaView d={d} picked={picked} onPick={(i) => { setJustPicked(i); c.answerDilemma(d.id, i); }} compact />
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          {picked === null
            ? <button type="button" onClick={later} className="btn-ghost text-sm"><Clock size={14} /> Recordar más tarde</button>
            : <button type="button" onClick={() => setHidden(true)} className="btn-primary text-sm">Listo</button>}
        </div>
      </div>
    </div>
  );
}
