"use client";
/**
 * Empresa · Operación. Tabla ejecutiva KPI / Actual / Meta / Estado, ordenada por impacto real; cada fila se abre con
 * qué significa, su evolución, qué decisiones la movieron y qué consecuencias tiene. En empresas en crecimiento,
 * aquí viven también los casos de crecimiento abiertos (ancla #crecimiento, la que usan Hoy, correos y avisos).
 */
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { indicatorDetail } from "@/lib/ceo/indicators";
import { OPS_STATUS_LABEL, formatMetric, metricChange, monthName, stageOf, type OpsRow, type OpsStatus } from "@/lib/ceo/business/present";
import type { DisplayCurrency } from "@/lib/ceo/career/money";
import { isRetailLog, isSteelLog } from "@/lib/ceo/growth/session";
import { useCeo } from "../CeoProvider";
import { GrowthPanel } from "../GrowthPanel";
import { RetailPanel } from "../RetailPanel";
import { SteelPanel } from "../SteelPanel";
import { Delta } from "../ui";
import { Dot, Panel, useBusiness, type Level } from "./shared";
import { StageTag } from "./FinanzasTab";

const STATUS_LEVEL: Record<OpsStatus, Level> = { meta: "ok", cerca: "baja", fuera: "media", sin_meta: "baja" };

export function OperacionTab() {
  const c = useCeo();
  const biz = useBusiness();
  const growth = c.s.growth;
  return (
    <>
      {growth && (isRetailLog(growth) ? <RetailPanel /> : isSteelLog(growth) ? <SteelPanel /> : <GrowthPanel />)}
      {biz && <OpsTable />}
      {!growth && !biz && <Panel title="Operación"><p className="text-sm text-slate-500">Esta empresa se evalúa con los cinco índices de salud; no lleva KPI operativos del sector. Los encuentras en Resumen.</p></Panel>}
    </>
  );
}

function OpsTable() {
  const c = useCeo();
  const biz = useBusiness()!;
  const cur: DisplayCurrency = c.s.settings.displayCurrency ?? "MXN";
  const [open, setOpen] = useState<string | null>(null);
  const { rows, score, b } = biz;
  return (
    <Panel title="KPI operativos" testid="tabla-operacion"
      aside={<span className="inline-flex items-center gap-2 text-xs text-slate-500"><b className="text-ink tabular-nums">{score.met} de {score.total}</b> en meta · {monthName(b.now)} <StageTag stage={stageOf(b.now)} /></span>}>
      <p className="-mt-2 mb-4 text-[13px] text-slate-500">Las métricas con que se mide una empresa de tu industria. Son distintas de la salud empresarial: aquí cuenta la meta del sector.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-slate-400 border-b border-slate-100">
              <th className="pb-2 pr-3 font-medium">KPI</th><th className="pb-2 pr-3 font-medium text-right">Actual</th><th className="pb-2 pr-3 font-medium text-right">Meta</th><th className="pb-2 pr-3 font-medium">Estado</th><th className="pb-2 w-6" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isOpen = open === r.def.id;
              return (
                <Row key={r.def.id} r={r} cur={cur} open={isOpen} onToggle={() => setOpen(isOpen ? null : r.def.id)} />
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">Primero los de mayor impacto: los más lejos de su meta, con más peso si los mueve un indicador que vigila el consejo.</p>
    </Panel>
  );
}

function Row({ r, cur, open, onToggle }: { r: OpsRow; cur: DisplayCurrency; open: boolean; onToggle: () => void }) {
  const ch = r.prev !== null ? metricChange(r.def, r.value, r.prev, cur) : null;
  return (
    <>
      <tr data-testid="fila-kpi" data-status={r.status} data-top={r.top ? "si" : "no"} onClick={onToggle} className={clsx("cursor-pointer border-b border-slate-100 transition-colors hover:bg-[#F8F7FE]", open && "bg-[#F8F7FE]")}>
        <td className="py-3 pr-3">
          <span className="flex items-center gap-2">
            <span className={clsx("font-medium text-ink", r.top && "font-semibold")}>{r.def.label}</span>
            {r.top && <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10.5px] font-semibold text-ink whitespace-nowrap">Mayor impacto</span>}
          </span>
        </td>
        <td className="py-3 pr-3 text-right tabular-nums font-semibold text-ink whitespace-nowrap">{formatMetric(r.value, r.def.unit, cur)}{ch && <span className={clsx("ml-1.5 text-[11px] font-medium", ch.tone === "good" ? "text-sob" : ch.tone === "bad" ? "text-coral" : "text-slate-400")}>{ch.text}</span>}</td>
        <td className="py-3 pr-3 text-right tabular-nums text-slate-500 whitespace-nowrap">{r.def.target === undefined ? "—" : `${r.def.better === "down" ? "≤ " : "≥ "}${formatMetric(r.def.target, r.def.unit, cur)}`}</td>
        <td className="py-3 pr-3"><span className="inline-flex items-center gap-1.5 text-[13px] text-slate-600 whitespace-nowrap"><Dot level={STATUS_LEVEL[r.status]} />{OPS_STATUS_LABEL[r.status]}</span></td>
        <td className="py-3 text-slate-300"><ChevronDown size={15} className={clsx("transition-transform", open && "rotate-180")} /></td>
      </tr>
      {open && <tr className="bg-[#F8F7FE]"><td colSpan={5} className="px-3 pb-4"><RowDetail r={r} cur={cur} /></td></tr>}
    </>
  );
}

function RowDetail({ r, cur }: { r: OpsRow; cur: DisplayCurrency }) {
  const c = useCeo();
  const pk = c.pack;
  const biz = useBusiness()!;
  const k = r.def.driver?.kpi;
  const d = useMemo(() => (k ? indicatorDetail(c.s, c.now, k, pk.kpiLabel, pk.kpiHint) : null), [c.s, c.now, k, pk.kpiLabel, pk.kpiHint]);
  // Qué la movió: las decisiones que movieron el índice que la impulsa, con el signo de lo que hacen aquí.
  const sign = r.def.driver ? Math.sign(r.def.driver.k) * (r.def.better === "up" ? 1 : -1) : 0;
  const movers = d ? [...d.down, ...d.up].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 4) : [];
  return (
    <div className="grid gap-5 pt-1 md:grid-cols-2 text-[13px] academy-in">
      <div className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold text-slate-400">Qué significa</div>
          <p className="mt-1 text-slate-600 leading-relaxed">{r.def.hint}</p>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400">Evolución</div>
          <ol className="mt-1.5 flex flex-wrap gap-1.5">
            {biz.b.periods.map((p) => (
              <li key={p.period} className="rounded-xl bg-white border border-slate-100 px-2.5 py-1.5">
                <div className="text-[10.5px] text-slate-400">{monthName(p)}{p.status === "en_curso" ? " · proyección" : ""}</div>
                <div className="text-xs font-semibold tabular-nums text-ink">{formatMetric(p.opsMetrics[r.def.id], r.def.unit, cur)}</div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400">Consecuencias</div>
          <p className="mt-1 text-slate-600 leading-relaxed">
            {k ? <>Se mueve con <b className="text-ink">{pk.kpiLabel[k]}</b> ({c.kpis[k]}/100): cuando ese índice {sign > 0 ? "sube" : "baja"}, este KPI mejora. </> : null}
            {r.status === "meta" ? "Está en la meta del sector; cuidarlo evita que se vuelva un problema." : r.status === "sin_meta" ? "No tiene meta fija: se lee por su tendencia." : "Mientras siga fuera de meta, presiona los resultados del mes y la conversación con el consejo."}
          </p>
        </div>
      </div>
      <div>
        <div className="text-[11px] font-semibold text-slate-400">Decisiones y eventos que lo movieron</div>
        {movers.length ? (
          <ul className="mt-1.5 space-y-2">
            {movers.map((m) => (
              <li key={m.kind + m.id} className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate font-medium text-ink">{m.href ? <Link href={m.href} className="hover:text-indigo">{m.label}</Link> : m.label}</span>
                  <span className="shrink-0 text-xs tabular-nums text-slate-500">{k && pk.kpiLabel[k]} <Delta n={m.delta} /></span>
                </div>
                <div className="text-[11.5px] text-slate-500">{(m.delta > 0) === (sign > 0) ? "Ayudó a este KPI" : "Le restó a este KPI"}</div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-1 text-slate-500">Todavía ninguna decisión de este periodo lo ha movido. Arrancó en {formatMetric(r.start, r.def.unit, cur)}.</p>}
      </div>
    </div>
  );
}
