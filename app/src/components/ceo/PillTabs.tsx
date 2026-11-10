"use client";
import clsx from "clsx";

/**
 * Selector de vistas tipo pill, centrado: una sola opción «encendida».
 * Lo usan Empresa (cinco secciones) y Carrera (Mi carrera / Mi perfil) para que se vean y se comporten igual.
 */
export function PillTabs<T extends string>({ tabs, value, onChange, label }: { tabs: readonly { id: T; label: string }[]; value: T; onChange: (t: T) => void; label: string }) {
  return (
    <div className="flex justify-center">
      <nav role="tablist" aria-label={label}
        className="flex w-full sm:w-auto items-center gap-0.5 sm:gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgba(23,26,58,.06),0_6px_20px_-10px_rgba(23,26,58,.18)]">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={value === t.id} aria-controls={`panel-${t.id}`} onClick={() => onChange(t.id)}
            className={clsx(
              "flex-1 sm:flex-none min-w-0 whitespace-nowrap rounded-full px-1.5 sm:px-5 py-2 text-[12px] sm:text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-light/50",
              tabs.length <= 3 && "text-[13px] sm:min-w-[132px]",
              value === t.id ? "bg-indigo text-white shadow-[0_2px_8px_-2px_rgba(79,63,224,.55)]" : "text-slate-500 hover:text-ink hover:bg-slate-50",
            )}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
