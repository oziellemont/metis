"use client";
import clsx from "clsx";
import { Check } from "lucide-react";
import { toggleTopic, topicsByAcademy, topicsCountText, topicsReady } from "@/lib/ceo/metis2/entrada";

/**
 * Temas prioritarios (MÊTIS 2.0, entrega 2.1): los temas del catálogo agrupados por academia; se eligen al menos cinco.
 * Elegir un tema ordena lo que se recomienda. No acredita dominio ni suma puntos.
 * `dark` es para el registro (fondo mêtis); sin él, para Mi perfil (fondo claro).
 */
export function TopicsPicker({ value, onChange, dark = false }: { value: readonly string[]; onChange: (ids: string[]) => void; dark?: boolean }) {
  const groups = topicsByAcademy();
  const ready = topicsReady(value);
  return (
    <div data-testid="temas-prioritarios">
      <div aria-live="polite" className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", dark ? (ready ? "bg-mint/20 text-mint" : "bg-white/10 text-white/80") : ready ? "bg-mint-soft text-sob" : "bg-slate-100 text-slate-600")}>
        {ready && <Check size={12} strokeWidth={2.6} />}{topicsCountText(value)}
      </div>
      <div className="mt-4 space-y-5">
        {groups.map(({ academy, topics }) => (
          <fieldset key={academy.id}>
            <legend className={clsx("text-[11px] font-semibold uppercase tracking-wider", dark ? "text-white/55" : "text-slate-400")}>{academy.name}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {topics.map((t) => {
                const on = value.includes(t.id);
                return (
                  <button key={t.id} type="button" aria-pressed={on} onClick={() => onChange(toggleTopic(value, t.id))}
                    className={clsx("inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-left text-[13px] transition-colors",
                      dark
                        ? on ? "bg-white text-indigo border-white font-medium" : "bg-white/5 border-white/20 text-white hover:bg-white/10"
                        : on ? "border-indigo bg-indigo-soft text-indigo font-medium" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                    {on && <Check size={13} strokeWidth={2.6} className="shrink-0" />}{t.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
