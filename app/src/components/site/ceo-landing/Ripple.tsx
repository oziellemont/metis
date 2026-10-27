"use client";
/**
 * «Una decisión nunca afecta una sola cosa»: eliges una decisión y ves cómo se mueven cinco
 * dimensiones esta semana y un mes después. Datos ilustrativos (dirección, no cifras).
 */
import { useState } from "react";
import clsx from "clsx";
import { RIPPLE } from "./content";
import { EffectBars } from "./Effects";

export function Ripple() {
  const [id, setId] = useState(RIPPLE.options[0].id);
  const [phase, setPhase] = useState<0 | 1>(0);
  const o = RIPPLE.options.find((x) => x.id === id)!;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-7 shadow-card">
      <fieldset>
        <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Elige una decisión</legend>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          {RIPPLE.options.map((x) => (
            <label key={x.id} className={clsx("flex-1 cursor-pointer rounded-2xl border px-4 py-3 text-[13.5px] font-medium motion-safe:transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo", id === x.id ? "border-indigo bg-indigo-soft text-indigo" : "border-slate-200 text-ink hover:border-slate-300")}>
              <input type="radio" name="ripple" value={x.id} checked={id === x.id} onChange={() => { setId(x.id); setPhase(0); }} className="sr-only" />
              {x.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 inline-flex rounded-xl bg-canvas p-1" role="group" aria-label="Momento">
        {RIPPLE.phases.map((p, i) => (
          <button key={p} type="button" aria-pressed={phase === i} onClick={() => setPhase(i as 0 | 1)} className={clsx("rounded-lg px-3.5 py-1.5 text-[13px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo", phase === i ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink")}>{p}</button>
        ))}
      </div>

      <div className="mt-5 grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
        <EffectBars effects={phase === 0 ? o.now : o.later} />
        <p className="text-[15px] leading-relaxed text-ink" aria-live="polite">{phase === 0 ? o.nowText : o.laterText}</p>
      </div>
      <p className="mt-5 text-[11.5px] text-slate-500">{RIPPLE.note}</p>
    </div>
  );
}
