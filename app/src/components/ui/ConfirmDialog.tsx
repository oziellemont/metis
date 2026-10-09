"use client";
/**
 * Aviso de confirmación minimalista: recuadro pequeño centrado, esquinas muy redondeadas y
 * fondo translúcido con desenfoque; botones con el estilo de METIS (Cancelar blanco · acción en coral o índigo).
 * Opcionalmente pide escribir una palabra (p. ej. el nombre de la empresa) para habilitar la acción.
 */
import { useEffect, useRef, useState } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Si se indica, el botón de confirmar sólo se activa al escribir exactamente este texto. */
  requireText?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = "Borrar", cancelLabel = "Cancelar", destructive = true,
  requireText, busy, error, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const [shown, setShown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    if (!open) { setShown(false); setTyped(""); return; }
    const t = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busyRef.current) cancelRef.current(); };
    window.addEventListener("keydown", onKey);
    setTimeout(() => inputRef.current?.focus(), 60);
    return () => { cancelAnimationFrame(t); window.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!open) return null;
  const ok = !busy && (!requireText || typed.trim() === requireText.trim());

  return (
    <div
      role="presentation"
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-colors duration-200 ${shown ? "bg-black/25 backdrop-blur-[2px]" : "bg-black/0"}`}
      onClick={() => !busy && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className={`w-[320px] overflow-hidden rounded-[20px] bg-white/90 backdrop-blur-xl shadow-[0_12px_40px_-8px_rgba(23,26,58,.35)] ring-1 ring-black/5 text-center transition-all duration-200 ease-out ${shown ? "opacity-100 scale-100" : "opacity-0 scale-[1.08]"}`}
      >
        <div className="px-5 pt-5 pb-4">
          <h2 id="confirm-title" className="text-[17px] font-semibold text-ink leading-snug">{title}</h2>
          {message && <div className="mt-1.5 text-[13px] leading-snug text-slate-500">{message}</div>}
          {requireText && (
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && ok) onConfirm(); }}
              placeholder={requireText}
              aria-label={`Escribe ${requireText} para confirmar`}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-center outline-none transition focus:border-indigo focus:ring-2 focus:ring-indigo/30"
            />
          )}
          {error && <p className="mt-2 text-[12px] text-coral">{error}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2 px-5 pb-5">
          <button type="button" onClick={onCancel} disabled={busy} className="btn-ghost justify-center">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!ok}
            className={`btn justify-center font-semibold text-white shadow-sm ${destructive ? "bg-coral hover:bg-coral/90" : "bg-indigo hover:bg-indigo-light"}`}
          >
            {busy ? "Borrando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
