/**
 * Medidor de efectos de una decisión (−2 … +2) por dimensión. No depende solo del color:
 * cada fila dice con palabras si sube, baja o no cambia (o la frase concreta del caso, si se da).
 */
import clsx from "clsx";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { DIMS, type Dim, type Effects } from "./content";

export const effectWord = (v: number) => (v >= 2 ? "Sube" : v === 1 ? "Mejora" : v === 0 ? "Sin cambio" : v === -1 ? "Se presiona" : "Baja");

export function EffectBars({ effects, words, dark = false, compact = false }: { effects: Effects; words?: Partial<Record<Dim, string>>; dark?: boolean; compact?: boolean }) {
  return (
    <ul className={clsx("grid", compact ? "gap-1.5" : "gap-2.5")}>
      {DIMS.map(({ key, label }) => {
        const v = effects[key];
        const pct = Math.abs(v) * 50;
        const Icon = v > 0 ? ArrowUp : v < 0 ? ArrowDown : Minus;
        return (
          <li key={key} className={clsx("grid items-center gap-3", words ? "grid-cols-[5.5rem_1fr_8.5rem] sm:grid-cols-[6rem_1fr_10rem]" : "grid-cols-[5.5rem_1fr_6.5rem] sm:grid-cols-[6rem_1fr_7rem]")}>
            <span className={clsx("text-[13px] font-medium", dark ? "text-white/80" : "text-ink")}>{label}</span>
            <span aria-hidden className={clsx("relative h-1.5 rounded-full", dark ? "bg-white/10" : "bg-slate-100")}>
              <span className={clsx("absolute left-1/2 top-[-3px] h-[12px] w-px", dark ? "bg-white/30" : "bg-slate-300")} />
              <span
                className={clsx("absolute top-0 h-full rounded-full motion-safe:transition-all motion-safe:duration-500", v > 0 ? "bg-mint" : "bg-coral")}
                style={v >= 0 ? { left: "50%", width: `${pct / 2}%` } : { right: "50%", width: `${pct / 2}%` }}
              />
            </span>
            <span className={clsx("inline-flex items-center gap-1 text-[12px] tabular-nums", v > 0 ? (dark ? "text-mint-light" : "text-sob") : v < 0 ? "text-coral" : dark ? "text-white/50" : "text-slate-500")}>
              <Icon size={12} aria-hidden className="shrink-0" /> <span className="leading-tight">{words?.[key] ?? effectWord(v)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
