"use client";
/**
 * Ventana de detalle de mêtis CEO (indicadores y personas). Dos formas, mismo contenido:
 *  - «centro»: tarjeta centrada en la pantalla; el fondo solo se desenfoca, sin velo gris. Se usa en Empresa.
 *  - «lado»: panel pegado a la derecha con velo. Se usa en Hoy, que ya ocupa toda la pantalla.
 * Se dibuja directo sobre la página (portal), así siempre cubre la pantalla completa aunque la pestaña
 * que la abre tenga animación. Cierra con Escape, con la X y al tocar fuera; devuelve el foco al cerrar.
 */
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type DetailVariant = "centro" | "lado";

export function DetailDialog({ variant = "lado", labelledBy, testid, scrollKey, onClose, children }: {
  variant?: DetailVariant;
  labelledBy: string;
  testid: string;
  /** Al cambiar (p. ej. de salud a un indicador) el contenido vuelve arriba. */
  scrollKey?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const card = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  // La función de cierre se guarda aparte para que el foco se tome una sola vez, al abrir, y no en cada repintado.
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    card.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close.current(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, []);
  // Al cambiar de contenido vuelve arriba y, si el botón que tenía el foco ya no existe, el foco regresa a la ventana.
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    if (!card.current?.contains(document.activeElement)) card.current?.focus();
  }, [scrollKey]);
  if (typeof document === "undefined") return null;
  const center = variant === "centro";
  return createPortal(
    <div data-detalle={variant} role="dialog" aria-modal="true" aria-labelledby={labelledBy}
      className={clsx("fixed inset-0 z-50 flex text-ink", center ? "items-center justify-center p-4 sm:p-6" : "items-end sm:items-stretch sm:justify-end")}>
      <button type="button" aria-label="Cerrar" onClick={onClose} data-testid="detalle-fondo"
        className={clsx("absolute inset-0 cursor-default", center ? "backdrop-blur-[6px] detail-fade" : "bg-ink/40")} />
      <div ref={card} tabIndex={-1} data-testid={testid}
        className={clsx("relative flex w-full flex-col overflow-hidden bg-white outline-none",
          center
            ? "max-w-[460px] max-h-[min(86vh,720px)] rounded-3xl shadow-[0_24px_80px_-16px_rgba(15,17,48,.45)] ring-1 ring-ink/[.08] detail-in"
            : "sm:w-[420px] max-h-[88vh] sm:max-h-none rounded-t-3xl sm:rounded-none shadow-2xl academy-in")}>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 z-10 h-8 w-8 grid place-items-center rounded-full bg-white/90 hover:bg-slate-100 text-slate-500"><X size={16} /></button>
        <div ref={body} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
