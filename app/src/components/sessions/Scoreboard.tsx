"use client";
import clsx from "clsx";
import { Avatar, TrafficChip } from "@/components/ui/primitives";
import { TRAFFIC } from "@/lib/labels";
import type { PersonSlide } from "./useDeck";

/** Marcador del equipo: cumplimiento ponderado por persona y sus indicadores con semáforo. */
export function Scoreboard({ slides, dark = false, detailed = false }: { slides: PersonSlide[]; dark?: boolean; detailed?: boolean }) {
  return (
    <div className={clsx("grid gap-3", detailed ? "lg:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3")}>
      {slides.map((p) => (
        <div key={p.user.id} className={clsx("rounded-2xl p-4", dark ? "bg-white/[0.06] ring-1 ring-white/10" : "bg-canvas ring-1 ring-slate-100")}>
          <div className="flex items-center gap-3">
            <Avatar initials={p.user.initials} className={dark ? "!bg-white/15 !text-white" : ""} />
            <div className="min-w-0 flex-1">
              <div className={clsx("truncate text-sm font-semibold", dark ? "text-white" : "text-ink")}>{p.user.name}</div>
              <div className={clsx("truncate text-xs", dark ? "text-white/50" : "text-slate-400")}>{p.user.title}</div>
            </div>
            <div className="text-right">
              <div className={clsx("text-xl font-semibold tabular-nums", p.attainment === null ? (dark ? "text-white/40" : "text-slate-400") : p.attainment >= 100 ? (dark ? "text-mint-light" : "text-sob") : p.attainment < 90 ? (dark ? "text-[#FF9AA0]" : "text-coral") : dark ? "text-amber" : "text-amber")}>
                {p.attainment === null ? "—" : `${p.attainment}%`}
              </div>
              <div className={clsx("text-[10px]", dark ? "text-white/40" : "text-slate-400")}>cumplimiento</div>
            </div>
          </div>
          {p.kpis.length === 0 ? (
            <div className={clsx("mt-3 text-xs", dark ? "text-white/40" : "text-slate-400")}>Sin scorecard este año.</div>
          ) : detailed ? (
            <ul className={clsx("mt-3 divide-y", dark ? "divide-white/10" : "divide-slate-200/70")}>
              {p.kpis.map((k) => (
                <li key={k.id} className="flex items-center gap-2 py-1.5">
                  <span className={clsx("h-2 w-2 shrink-0 rounded-full", TRAFFIC[k.traffic].dot)} />
                  <span className={clsx("min-w-0 flex-1 truncate text-xs", dark ? "text-white/80" : "text-slate-600")} title={k.log}>{k.name} <span className={dark ? "text-white/40" : "text-slate-400"}>· {k.scope}</span></span>
                  <span className={clsx("text-xs font-medium tabular-nums", dark ? "text-white" : "text-ink")}>{k.value}</span>
                  <span className={clsx("w-16 text-right text-[10px] tabular-nums", dark ? "text-white/40" : "text-slate-400")}>meta {k.target}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1">
              {p.kpis.map((k) => <span key={k.id} title={`${k.name} · ${k.value} (meta ${k.target})`}><TrafficChip t={k.traffic} compact /></span>)}
              {p.reds > 0 && <span className={clsx("ml-auto text-xs font-medium", dark ? "text-[#FF9AA0]" : "text-coral")}>{p.reds} en rojo</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
