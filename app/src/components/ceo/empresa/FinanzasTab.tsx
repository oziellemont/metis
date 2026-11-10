"use client";
/**
 * Empresa · Finanzas. Orden: ventas, EBITDA y caja → comparación con el periodo anterior → estado de resultados →
 * flujo de efectivo → historial. Cada mes dice si es Histórico (al llegar), Cierre definitivo o Proyección (en curso).
 * Los estados se redondean a una sola precisión y los totales cuadran con los renglones que se ven.
 */
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { FX_NOTE, type DisplayCurrency } from "@/lib/ceo/career/money";
import { STAGE_LABEL, monthName, moneyAt, runwayText, stageOf, statementDigits, statementOf, type PeriodStage, type Statement } from "@/lib/ceo/business/present";
import type { PeriodState } from "@/lib/ceo/business";
import { useCeo } from "../CeoProvider";
import { CurrencySwitch, Figure, Panel, cents, useBusiness, useGrowthSnap } from "./shared";

const STAGE_CLS: Record<PeriodStage, string> = {
  historico: "bg-slate-100 text-slate-600",
  cierre: "bg-indigo-soft text-indigo",
  proyeccion: "border border-dashed border-indigo/50 text-indigo",
};
export function StageTag({ stage }: { stage: PeriodStage }) {
  return <span data-stage={stage} className={clsx("rounded-full px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap", STAGE_CLS[stage])}>{STAGE_LABEL[stage]}</span>;
}

export function FinanzasTab() {
  const c = useCeo();
  const biz = useBusiness();
  const grow = useGrowthSnap();
  const cur: DisplayCurrency = c.s.settings.displayCurrency ?? "MXN";
  const [sel, setSel] = useState<number | null>(null);

  if (!biz) return grow ? <GrowthFinance /> : <Panel title="Finanzas"><p className="text-sm text-slate-500">Esta empresa se evalúa solo con los cinco índices de salud. Los encuentras en Resumen y en Consejo.</p></Panel>;

  const { periods } = biz.b;
  const now = biz.b.now;
  const prev = periods.length >= 2 ? periods[periods.length - 2] : null;
  const shown = periods.find((p) => p.period === sel) ?? now;
  // Una sola precisión para toda la pestaña: así el mismo monto se ve igual en las cifras, la tabla y los estados.
  const digits = Math.max(...periods.map((p) => statementDigits(p, cur)));
  const st = (p: PeriodState) => statementOf(p, cur, digits);
  const m = (v: number) => moneyAt(v, cur, digits);
  const sNow = st(now), sPrev = prev ? st(prev) : null;
  const maxRev = Math.max(...periods.map((p) => Math.max(p.revenue, p.revenueTarget)));

  return (
    <>
      <Panel title="Este mes" testid="finanzas-cifras" aside={<CurrencySwitch cur={cur} onChange={(k) => c.updateSettings({ displayCurrency: k })} />}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Figure label="Ventas" value={m(sNow.revenue)} stage={<StageTag stage={stageOf(now)} />} note={`Meta ${m(Math.round(now.revenueTarget * (cur === "USD" ? 1 / 18.5 : 1) * 10 ** digits) / 10 ** digits)}`} tone={now.revenue < now.revenueTarget ? "warn" : undefined} />
          <Figure label="EBITDA" value={m(sNow.ebitda)} stage={<StageTag stage={stageOf(now)} />} note={`Margen bruto ${(now.grossMargin * 100).toFixed(1)} %`} tone={now.ebitda < 0 ? "bad" : undefined} />
          <Figure label="Caja" value={m(sNow.cashEnd)} stage={<StageTag stage={stageOf(now)} />} note={runwayText(now)} tone={now.runwayMonths !== null && now.runwayMonths < 6 ? "bad" : undefined} />
        </div>
        {cur === "USD" && <p className="mt-2 text-[11px] text-slate-400">{FX_NOTE}</p>}
        <p className="mt-3 text-[12px] text-slate-500">La proyección usa lo que llevas decidido este mes y se vuelve cierre definitivo al cerrar el periodo.</p>
      </Panel>

      {prev && sPrev && (
        <Panel title={`Contra ${monthName(prev).toLowerCase()}`} testid="finanzas-comparacion">
          <table className="w-full text-sm tabular-nums">
            <thead><tr className="text-left text-[11px] text-slate-400"><th className="pb-2 font-medium" /><th className="pb-2 font-medium text-right"><span className="inline-flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-1.5">{monthName(prev)} <StageTag stage={stageOf(prev)} /></span></th><th className="pb-2 font-medium text-right"><span className="inline-flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-1.5">{monthName(now)} <StageTag stage={stageOf(now)} /></span></th><th className="pb-2 font-medium text-right">Cambio</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {([["Ventas", sPrev.revenue, sNow.revenue], ["EBITDA", sPrev.ebitda, sNow.ebitda], ["Caja al cierre", sPrev.cashEnd, sNow.cashEnd]] as const).map(([k, a, b]) => {
                const d = Math.round((b - a) * 10 ** digits) / 10 ** digits;
                return (
                  <tr key={k}>
                    <td className="py-2 text-slate-600">{k}</td>
                    <td className="py-2 text-right text-slate-500">{m(a)}</td>
                    <td className="py-2 text-right font-semibold text-ink">{m(b)}</td>
                    <td className={clsx("py-2 text-right text-xs font-semibold", d > 0 ? "text-sob" : d < 0 ? "text-coral" : "text-slate-400")}>{d === 0 ? "sin cambio" : `${d > 0 ? "+" : ""}${m(d)}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Estado de resultados" testid="estado-resultados" aside={<span className="inline-flex items-center gap-2 text-xs text-slate-500">{monthName(shown)} <StageTag stage={stageOf(shown)} /></span>}>
          <Income s={st(shown)} m={m} />
        </Panel>
        <Panel title="Flujo de efectivo" testid="flujo-efectivo" aside={<span className="inline-flex items-center gap-2 text-xs text-slate-500">{monthName(shown)} <StageTag stage={stageOf(shown)} /></span>}>
          <Cash p={shown} s={st(shown)} m={m} />
        </Panel>
      </div>

      <Panel title="Historial" testid="finanzas-historial" aside={periods.length > 2 ? <Link href="/ceo/reporte" className="text-xs font-semibold text-indigo hover:text-ink">{c.reportDue !== null ? `Revisar el reporte del mes ${c.reportDue}` : "Ver reportes mensuales"} →</Link> : undefined}>
        <div className="flex items-end gap-2 h-28" aria-hidden>
          {periods.map((p) => {
            const stg = stageOf(p);
            return (
              <button key={p.period} type="button" tabIndex={-1} onClick={() => setSel(p.period)} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center">
                <div className="relative w-full max-w-[44px] h-full flex items-end">
                  <div className={clsx("w-full rounded-t-md transition-colors", stg === "proyeccion" ? "bg-indigo/15 border border-dashed border-indigo/60" : stg === "historico" ? "bg-slate-300" : p.period === shown.period ? "bg-indigo" : "bg-indigo/60")} style={{ height: `${Math.max(6, (p.revenue / maxRev) * 100)}%` }} />
                  <div className="absolute left-0 right-0 border-t border-dashed border-slate-400" style={{ bottom: `${(p.revenueTarget / maxRev) * 100}%` }} />
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Histórico</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-indigo/60" /> Cierre definitivo</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-dashed border-indigo/60 bg-indigo/15" /> Proyección</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-slate-400" /> Meta de ventas</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs tabular-nums">
            <thead><tr className="text-left text-slate-400"><th className="py-1.5 pr-3 font-medium">Mes</th><th className="py-1.5 pr-3 font-medium">Etapa</th><th className="py-1.5 pr-3 font-medium text-right">Ventas</th><th className="py-1.5 pr-3 font-medium text-right">EBITDA</th><th className="py-1.5 font-medium text-right">Caja</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {periods.map((p) => {
                const s = st(p);
                return (
                  <tr key={p.period} onClick={() => setSel(p.period)} className={clsx("cursor-pointer hover:bg-[#F8F7FE]", p.period === shown.period && "bg-[#F8F7FE]")}>
                    <td className="py-2 pr-3 text-ink font-medium">{monthName(p)}</td>
                    <td className="py-2 pr-3"><StageTag stage={stageOf(p)} /></td>
                    <td className="py-2 pr-3 text-right">{m(s.revenue)}</td>
                    <td className={clsx("py-2 pr-3 text-right", s.ebitda < 0 && "text-coral")}>{m(s.ebitda)}</td>
                    <td className="py-2 text-right">{m(s.cashEnd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">Toca un mes para ver su estado de resultados y su flujo. Los índices de salud no son dinero: mueven estos números con supuestos fijos del simulador (versión {c.s.business?.assumptionsVersion ?? 1}).</p>
      </Panel>
    </>
  );
}

function Rows({ xs, m }: { xs: [string, number, boolean?][]; m: (v: number) => string }) {
  return (
    <div className="text-sm">
      {xs.map(([k, v, strong]) => (
        <div key={k} className={clsx("flex justify-between gap-3 py-1.5", strong ? "font-semibold text-ink border-t border-slate-200 mt-1 pt-2" : "text-slate-600")}>
          <span>{k}</span><span className={clsx("tabular-nums", v < 0 && !strong && "text-slate-500", v < 0 && strong && "text-coral")}>{m(v)}</span>
        </div>
      ))}
    </div>
  );
}

function Income({ s, m }: { s: Statement; m: (v: number) => string }) {
  return <Rows m={m} xs={[["Ventas", s.revenue], ["Costo de ventas", -s.cogs], ["Utilidad bruta", s.gross, true], ["Nómina", -s.payroll], ["Mercadotecnia", -s.marketing], ["Otros gastos", -s.other], ["EBITDA", s.ebitda, true]]} />;
}

function Cash({ p, s, m }: { p: PeriodState; s: Statement; m: (v: number) => string }) {
  if (p.status === "llegada") return <><Rows m={m} xs={[["Caja con la que llegas", s.cashEnd, true]]} /><p className="mt-2 text-xs text-slate-400">Días de cobro: {Math.round(p.dso)}</p></>;
  return (
    <>
      <Rows m={m} xs={[["Caja al inicio", s.cashBegin], ["Entradas", s.inflows], ["Salidas", -s.outflows], ["Caja al cierre", s.cashEnd, true]]} />
      <p className="mt-2 text-xs text-slate-400 leading-relaxed">Las salidas incluyen inversión de {m(Math.round(p.capex * 10 ** s.digits) / 10 ** s.digits)}{p.interest ? ` e intereses de ${m(Math.round(p.interest * 10 ** s.digits) / 10 ** s.digits)}` : ""}. Días de cobro: {Math.round(p.dso)}.</p>
    </>
  );
}

/** Empresa en crecimiento: los meses cerrados; el estado de resultados completo vive con tu operación. */
function GrowthFinance() {
  const g = useGrowthSnap();
  if (!g) return null;
  const last = g.months.at(-1);
  return (
    <>
      <Panel title="Último mes cerrado" testid="finanzas-cifras">
        <div className="grid gap-3 sm:grid-cols-3">
          <Figure label="Ventas" value={last ? cents(last.revenue) : "—"} stage={last ? <StageTag stage="cierre" /> : undefined} />
          <Figure label="EBITDA" value={last ? cents(last.ebitda) : "—"} stage={last ? <StageTag stage="cierre" /> : undefined} tone={last && last.ebitda < 0 ? "bad" : undefined} />
          <Figure label="Caja" value={cents(g.cash)} note={`Saldo al día ${g.day}`} />
        </div>
        {!last && <p className="mt-3 text-sm text-slate-500">El primer mes todavía no cierra.</p>}
      </Panel>
      {g.months.length > 0 && (
        <Panel title="Historial" testid="finanzas-historial">
          <table className="w-full text-xs tabular-nums">
            <thead><tr className="text-left text-slate-400"><th className="py-1.5 pr-3 font-medium">Mes</th><th className="py-1.5 pr-3 font-medium">Etapa</th><th className="py-1.5 pr-3 font-medium text-right">Ventas</th><th className="py-1.5 pr-3 font-medium text-right">EBITDA</th><th className="py-1.5 font-medium text-right">Caja</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {g.months.map((x) => <tr key={x.month}><td className="py-2 pr-3 font-medium text-ink">Mes {x.month}</td><td className="py-2 pr-3"><StageTag stage="cierre" /></td><td className="py-2 pr-3 text-right">{cents(x.revenue)}</td><td className={clsx("py-2 pr-3 text-right", x.ebitda < 0 && "text-coral")}>{cents(x.ebitda)}</td><td className="py-2 text-right">{cents(x.cashEnd)}</td></tr>)}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-slate-400">El estado de resultados detallado de cada mes está en Operación, junto con tus decisiones de crecimiento.</p>
        </Panel>
      )}
    </>
  );
}
