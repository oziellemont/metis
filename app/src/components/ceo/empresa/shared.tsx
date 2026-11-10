"use client";
/**
 * Empresa · piezas compartidas por las cinco pestañas: datos del negocio (carrera continua o empresa en crecimiento),
 * superficies blancas y el lenguaje de estados con colores discretos.
 */
import clsx from "clsx";
import { useMemo } from "react";
import { growthDayOf } from "@/lib/ceo/engine";
import { businessOf } from "@/lib/ceo/business";
import { opsRowsOf, opsScore } from "@/lib/ceo/business/present";
import { growthAt, isRetailLog, isSteelLog, pendingGrowth, retailOf, retailPendingOf, steelOf, steelPendingOf } from "@/lib/ceo/growth/session";
import { alertsOf as growthAlertsOf, type Alert } from "@/lib/ceo/growth/ops";
import { cashOf as retailCash } from "@/lib/ceo/growth/retail/engine";
import { cashOf as steelCash } from "@/lib/ceo/growth/steel/engine";
import { retailAlerts } from "../RetailPanel";
import { steelAlerts } from "../SteelPanel";
import type { DisplayCurrency } from "@/lib/ceo/career/money";
import { useCeo } from "../CeoProvider";

/** Carrera continua: el modelo del negocio y la tabla de KPI operativos. */
export function useBusiness() {
  const c = useCeo();
  const focus = c.verdict.v5?.objectives.map((o) => o.kpi) ?? [];
  const key = focus.join(",");
  return useMemo(() => {
    const b = businessOf(c.s, c.now);
    if (!b) return null;
    const rows = opsRowsOf(b, key ? key.split(",") : []);
    return { b, rows, score: opsScore(rows) };
  }, [c.s, c.now, key]);
}

export interface GrowthMonth { month: number; revenue: number; ebitda: number; cashEnd: number }
/** Empresa en crecimiento (emergente, comercio o acero): meses, caja, alertas y casos abiertos. Montos en centavos. */
export function useGrowthSnap() {
  const c = useCeo();
  return useMemo(() => {
    const log = c.s.growth;
    if (!log) return null;
    const day = growthDayOf(c.s, c.now);
    const pick = (m: { month: number; revenue: number; ebitda: number; cashEnd: number }): GrowthMonth => ({ month: m.month, revenue: m.revenue, ebitda: m.ebitda, cashEnd: m.cashEnd });
    if (isRetailLog(log)) {
      const st = retailOf(log, day).state;
      return { kind: "retail" as const, day: st.day, months: st.months.map(pick), cash: retailCash(st), alerts: retailAlerts(st), pending: retailPendingOf(log, day) ? 1 : 0 };
    }
    if (isSteelLog(log)) {
      const st = steelOf(log, day).state;
      return { kind: "steel" as const, day: st.day, months: st.months.map(pick), cash: steelCash(st), alerts: steelAlerts(st), pending: steelPendingOf(log, day) ? 1 : 0 };
    }
    const g = growthAt(log, day).state;
    return { kind: "growth" as const, day: g.day, months: g.months.map(pick), cash: g.cash, alerts: growthAlertsOf(g), pending: pendingGrowth(log, day).length };
  }, [c.s, c.now]);
}

/** Centavos → «$1.2 M», «$85 mil». */
export const cents = (v: number) => {
  const p = v / 100, a = Math.abs(p), s = p < 0 ? "−" : "";
  return a >= 1e6 ? `${s}$${(a / 1e6).toFixed(1)} M` : a >= 1e3 ? `${s}$${Math.round(a / 1e3)} mil` : `${s}$${Math.round(a)}`;
};

export const toneOfAlert = (a: Alert) => (a.tone === "bad" ? "alta" : a.tone === "warn" ? "media" : "baja");

/** Superficie blanca de las pestañas. */
export function Panel({ title, aside, children, className, id, testid, label }: { title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string; id?: string; testid?: string; label?: string }) {
  return (
    <section id={id} data-testid={testid} aria-label={label ?? title} className={clsx("rounded-3xl bg-white border border-slate-100 p-5 sm:p-6", className)}>
      {(title || aside) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-[15px] font-semibold text-ink">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/** Cifra protagonista: etiqueta corta, número grande y una nota. */
export function Figure({ label, value, note, tone, stage }: { label: string; value: string; note?: React.ReactNode; tone?: "bad" | "warn"; stage?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#F8F7FE] p-4">
      <div className="flex items-center justify-between gap-2 text-[12px] text-slate-500"><span>{label}</span>{stage}</div>
      <div className="mt-1.5 text-[26px] font-semibold leading-none tracking-tight tabular-nums text-ink">{value}</div>
      {note && <div className={clsx("mt-2 text-[12px] leading-snug", tone === "bad" ? "text-coral" : tone === "warn" ? "text-amber-700" : "text-slate-500")}>{note}</div>}
    </div>
  );
}

/** Semáforo discreto: punto de color y texto en tinta. Solo «alta» usa coral. */
export const LEVEL_DOT = { alta: "bg-coral", media: "bg-amber", baja: "bg-indigo-light", ok: "bg-mint" } as const;
export type Level = keyof typeof LEVEL_DOT;
export function Dot({ level, className }: { level: Level; className?: string }) {
  return <span aria-hidden className={clsx("inline-block h-2 w-2 shrink-0 rounded-full", LEVEL_DOT[level], className)} />;
}

/** Selector MXN / USD (solo Finanzas). */
export function CurrencySwitch({ cur, onChange }: { cur: DisplayCurrency; onChange: (c: DisplayCurrency) => void }) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 p-0.5 text-xs" role="group" aria-label="Moneda">
      {(["MXN", "USD"] as const).map((k) => (
        <button key={k} type="button" aria-pressed={cur === k} onClick={() => onChange(k)} className={clsx("rounded-full px-3 py-1 font-medium transition-colors", cur === k ? "bg-ink text-white" : "text-slate-500 hover:text-ink")}>{k}</button>
      ))}
    </div>
  );
}
