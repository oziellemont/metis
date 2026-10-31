"use client";
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { useCeo } from "./CeoProvider";
import { businessOf, type PeriodState } from "@/lib/ceo/business";
import { formatMetric, metricChange, metricVsTarget, narrative, pctChange, periodLabel, runwayText, type Change } from "@/lib/ceo/business/present";
import { FX_NOTE, formatMoney, type DisplayCurrency } from "@/lib/ceo/career/money";

const toneCls = (t: Change["tone"]) => (t === "good" ? "text-indigo" : t === "bad" ? "text-coral" : "text-slate-400");
const pct = (v: number) => `${(v * 100).toLocaleString("es-MX", { maximumFractionDigits: 1 })} %`;

/** Carrera continua: los números de tu empresa, mes por mes. Separados de los 5 índices de salud. */
export function BusinessPanel() {
  const c = useCeo();
  const b = useMemo(() => businessOf(c.s, c.now), [c.s, c.now]);
  const cur: DisplayCurrency = c.s.settings.displayCurrency ?? "MXN";
  const [sel, setSel] = useState<number | null>(null);
  if (!b) return null;

  const m = (v: number) => formatMoney(v, cur);
  const { closed, periods } = b;
  const prev = periods.length >= 3 ? periods[periods.length - 3] : null;
  const shown = periods.find((p) => p.period === sel) ?? closed;
  const maxRev = Math.max(...periods.map((p) => Math.max(p.revenue, p.revenueTarget)));

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><BarChart3 size={17} className="text-indigo" /><h2 className="font-semibold text-ink">Los números de tu empresa</h2></div>
        <div className="inline-flex rounded-full border border-slate-200 p-0.5 text-xs" role="group" aria-label="Moneda">
          {(["MXN", "USD"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={cur === k} onClick={() => c.updateSettings({ displayCurrency: k })} className={clsx("rounded-full px-3 py-1 font-medium", cur === k ? "bg-ink text-white" : "text-slate-500")}>{k}</button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{narrative(b, cur)}</p>
      {cur === "USD" && <p className="mt-1 text-[11px] text-slate-400">{FX_NOTE}</p>}

      <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{periodLabel(closed)}{prev ? ` · contra ${periodLabel(prev).toLowerCase()}` : ""}</div>
      <div className="mt-2 grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card label="Ingresos" value={m(closed.revenue)} change={prev ? pctChange(closed.revenue, prev.revenue) : null} note={`Meta ${m(closed.revenueTarget)}`} />
        <Card label="Margen bruto · EBITDA" value={pct(closed.grossMargin)} change={prev ? { text: `${closed.grossMargin >= prev.grossMargin ? "+" : "−"}${Math.abs((closed.grossMargin - prev.grossMargin) * 100).toFixed(1)} pts`, tone: Math.abs(closed.grossMargin - prev.grossMargin) < 0.0005 ? "flat" : closed.grossMargin > prev.grossMargin ? "good" : "bad" } : null} note={`EBITDA ${m(closed.ebitda)}`} warn={closed.ebitda < 0} />
        <Card label="Efectivo" value={m(closed.cashEnd)} change={prev ? { text: `${closed.cashEnd >= prev.cashEnd ? "+" : "−"}${m(Math.abs(closed.cashEnd - prev.cashEnd))}`, tone: Math.abs(closed.cashEnd - prev.cashEnd) < 0.005 ? "flat" : closed.cashEnd > prev.cashEnd ? "good" : "bad" } : null} note={runwayText(closed)} warn={closed.runwayMonths !== null && closed.runwayMonths < 6} />
        <Card label={b.profile.clientsLabel} value={closed.clients.toLocaleString("es-MX")} change={prev ? pctChange(closed.clients, prev.clients) : null} note={b.profile.clientsHint} />
        <Card label="Equipo" value={`${closed.headcount.toLocaleString("es-MX")} personas`} note={`Nómina ${m(closed.payroll)} al mes`} />
        <Card label="Confianza del consejo" value={`${c.kpis.consejo} / 100`} note="Índice de salud, no dinero" />
      </div>

      <h3 className="mt-6 text-sm font-semibold text-ink">Operación</h3>
      <p className="mt-0.5 text-xs text-slate-500">Las métricas con que se mide una empresa de tu industria.</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {b.profile.metrics.map((d) => {
          const v = closed.opsMetrics[d.id];
          const ch = prev ? metricChange(d, v, prev.opsMetrics[d.id], cur) : null;
          const tg = metricVsTarget(d, v, cur);
          return (
            <div key={d.id} className="rounded-2xl border border-slate-100 p-3.5" title={d.hint}>
              <dt className="text-[11px] text-slate-400">{d.label}</dt>
              <dd className="mt-0.5 flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-ink tabular-nums">{formatMetric(v, d.unit, cur)}</span>
                {ch && <span className={clsx("text-[11px] tabular-nums", toneCls(ch.tone))}>{ch.text}</span>}
              </dd>
              <dd className="mt-1 text-[11px] text-slate-500 leading-snug">{tg && <span className={clsx("font-medium", toneCls(tg.tone))}>{tg.text}. </span>}{d.hint}</dd>
            </div>
          );
        })}
      </dl>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-sm font-semibold text-ink">Historia</h3>{periods.length > 2 && <Link href="/ceo/reporte" className="text-xs font-semibold text-indigo">{c.reportDue !== null ? `Revisar el reporte del mes ${c.reportDue}` : "Ver reportes mensuales"} →</Link>}</div>
      <p className="mt-0.5 text-xs text-slate-500">Un mes por cada periodo que cierras. Toca un mes para ver su detalle.</p>
      <div className="mt-3 flex items-end gap-2 h-28" aria-hidden>
        {periods.map((p) => (
          <button key={p.period} type="button" onClick={() => setSel(p.period)} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-1">
            <div className="relative w-full max-w-[44px] h-full flex items-end">
              <div className={clsx("w-full rounded-t-md", p.status === "en_curso" ? "bg-indigo/25 border border-dashed border-indigo/50" : p.period === shown.period ? "bg-indigo" : "bg-indigo/60")} style={{ height: `${Math.max(6, (p.revenue / maxRev) * 100)}%` }} />
              <div className="absolute left-0 right-0 border-t border-dashed border-slate-400" style={{ bottom: `${(p.revenueTarget / maxRev) * 100}%` }} />
            </div>
          </button>
        ))}
      </div>
      <div className="mt-1 text-[11px] text-slate-400">Barras: ventas del mes. Línea punteada: meta.</div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs tabular-nums">
          <thead><tr className="text-left text-slate-400"><th className="py-1.5 pr-3 font-medium">Mes</th><th className="py-1.5 pr-3 font-medium text-right">Ventas</th><th className="py-1.5 pr-3 font-medium text-right">EBITDA</th><th className="py-1.5 font-medium text-right">Caja</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {periods.map((p) => (
              <tr key={p.period} onClick={() => setSel(p.period)} className={clsx("cursor-pointer", p.period === shown.period && "bg-canvas")}>
                <td className="py-1.5 pr-3 text-ink">{periodLabel(p)}</td>
                <td className="py-1.5 pr-3 text-right">{m(p.revenue)}</td>
                <td className={clsx("py-1.5 pr-3 text-right", p.ebitda < 0 && "text-coral")}>{m(p.ebitda)}</td>
                <td className="py-1.5 text-right">{m(p.cashEnd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Detail p={shown} m={m} />
      <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">Los índices de salud no son dinero: mueven estos números con supuestos fijos del simulador (versión {c.s.business?.assumptionsVersion ?? 1}). El mes en curso es una proyección con lo que llevas decidido; se vuelve definitivo al cerrar el periodo.</p>
    </section>
  );
}

function Card({ label, value, change, note, warn }: { label: string; value: string; change?: Change | null; note?: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl bg-canvas p-3.5">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="text-base font-semibold text-ink tabular-nums">{value}</span>
        {change && <span className={clsx("text-[11px] tabular-nums", toneCls(change.tone))}>{change.text}</span>}
      </div>
      {note && <div className={clsx("mt-1 text-[11px] leading-snug", warn ? "text-coral" : "text-slate-500")}>{note}</div>}
    </div>
  );
}

function Detail({ p, m }: { p: PeriodState; m: (v: number) => string }) {
  const rows = (xs: [string, number, boolean?][]) => xs.map(([k, v, strong]) => (
    <div key={k} className={clsx("flex justify-between py-1", strong && "font-semibold text-ink border-t border-slate-100")}><span>{k}</span><span className={clsx("tabular-nums", v < 0 && "text-coral")}>{m(v)}</span></div>
  ));
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-100 p-4 text-xs text-slate-600">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Estado de resultados · {periodLabel(p).toLowerCase()}</div>
        {rows([["Ventas", p.revenue], ["Costo de ventas", -(p.revenue - p.grossProfit)], ["Utilidad bruta", p.grossProfit, true], ["Nómina", -p.payroll], ["Mercadotecnia", -p.marketing], ["Otros gastos", -p.otherOpex], ["EBITDA", p.ebitda, true]])}
      </div>
      <div className="rounded-2xl border border-slate-100 p-4 text-xs text-slate-600">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Flujo de efectivo · {periodLabel(p).toLowerCase()}</div>
        {p.status === "llegada"
          ? <>{rows([["Caja con la que llegas", p.cashEnd, true]])}<div className="pt-1 text-slate-400">Días de cobro: {Math.round(p.dso)}</div></>
          : <>{rows([["Caja al inicio", p.cashBegin], ["Entradas", p.inflows], ["Salidas", -p.outflows], ["Caja al cierre", p.cashEnd, true]])}
            <div className="pt-1 text-slate-400">Incluye inversión {m(p.capex)}{p.interest ? `, intereses ${m(p.interest)}` : ""} y cobranza pendiente que cambió {m(p.workingCapital)}. Días de cobro: {Math.round(p.dso)}.</div></>}
      </div>
    </div>
  );
}
