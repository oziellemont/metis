"use client";
/**
 * Dilema del día al entrar a «Hoy»: se abre a pantalla completa, con el fondo métis y paso a paso.
 * Sale cada vez que entras hasta que lo contestes.
 * «Recordar más tarde» lo pospone 2 horas; cerrar solo lo oculta en esta visita.
 */
import { useEffect, useState } from "react";
import { DILEMMA_SNOOZE, dilemmaPromptDue, snoozeKey } from "@/lib/ceo/today";
import { DilemmaStage } from "./DilemmaCard";
import { useCeo } from "./CeoProvider";

export function DilemmaPrompt() {
  const c = useCeo();
  const today = c.dilemma;
  const [hidden, setHidden] = useState(false);
  const [held, setHeld] = useState(false);
  const [snoozed, setSnoozed] = useState<number | null | undefined>(undefined);
  const id = today?.d.id;

  useEffect(() => {
    if (!id) return;
    try { const v = Number(localStorage.getItem(snoozeKey(id))); setSnoozed(Number.isFinite(v) && v > 0 ? v : null); } catch { setSnoozed(null); }
  }, [id]);

  const answered = !!today && (today.done || !!c.s.dilemmas?.[today.d.id]);
  const due = !!today && snoozed !== undefined && dilemmaPromptDue(answered, snoozed, c.now);
  // Si se acaba de contestar, se queda abierto para ver lo que aprendes.
  useEffect(() => { if (due) setHeld(true); }, [due]);
  useEffect(() => {
    if (!held || hidden) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setHidden(true); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [held, hidden]);

  if (!today || hidden || !(due || (held && answered))) return null;
  const later = () => {
    const until = c.now + DILEMMA_SNOOZE;
    try { localStorage.setItem(snoozeKey(today.d.id), String(until)); } catch { /* ignore */ }
    setSnoozed(until);
    setHidden(true);
  };
  return <DilemmaStage onClose={() => setHidden(true)} onLater={later} />;
}
