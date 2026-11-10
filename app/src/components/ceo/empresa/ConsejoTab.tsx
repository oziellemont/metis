"use client";
/**
 * Empresa · Consejo. Misión, los cinco criterios con sus mínimos, el criterio de decisión, las líneas rojas y tu
 * relación con cada consejero. Separa «Confianza del Consejo» (un índice) de «Salud mínima exigida» (un umbral).
 */
import clsx from "clsx";
import Link from "next/link";
import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { KPI_KEYS } from "@/lib/ceo/engine";
import { orgParts } from "@/lib/ceo/org-chart";
import { moodOf, REL_START } from "@/lib/ceo/relations";
import { useCeo } from "../CeoProvider";
import { useHealth } from "../KpiBoard";
import { Avatar, Bar } from "../ui";
import { Figure, Panel } from "./shared";

export function ConsejoTab() {
  const c = useCeo();
  const pk = c.pack;
  const v = c.verdict;
  const v5 = v.v5;
  const h = useHealth();
  const board = useMemo(() => orgParts(pk).consejo, [pk]);
  const objectives = new Set(v5?.objectives.map((o) => o.kpi) ?? []);
  const jPct = v5 ? Math.round(v5.judgment.ratio * 100) : 0;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3" data-testid="consejo-cifras">
        <Figure label="Confianza del Consejo" value={`${c.kpis.consejo}/100`} note="Índice de salud: cuánto te respalda hoy." />
        <Figure label="Salud empresarial" value={`${h.value}/100`} note={h.cushion >= 0 ? `${h.cushion} puntos arriba del mínimo` : `${-h.cushion} puntos debajo del mínimo`} tone={h.cushion < 0 ? "bad" : undefined} />
        <Figure label="Salud mínima exigida" value={`${h.min}/100`} note="Umbral que pide el consejo al cierre." />
      </div>

      {v5 && (
        <Panel title={`Misión ${c.continuous ? "de este mes" : "de esta temporada"}`} testid="consejo-mision">
          <p className="text-xl font-semibold leading-snug text-ink">{v5.objectiveText}</p>
          <p className="mt-2 text-[13px] text-slate-500">Tus dos objetivos deben cerrar en {v.passLine} o más.</p>
        </Panel>
      )}

      <Panel title="Los cinco criterios" testid="consejo-criterios">
        <p className="-mt-2 mb-4 text-[13px] text-slate-500">Cinco índices de salud de 0 a 100, aparte del dinero. Línea del consejo: <b className="text-ink">{v.passLine}</b>{v5 ? <>; ninguno debajo de <b className="text-ink">{v5.floor}</b></> : null}.</p>
        <ul className="divide-y divide-slate-100">
          {KPI_KEYS.map((k) => {
            const ok = v.approved[k];
            const min = objectives.has(k) ? v.passLine : v5 ? (k === "caja" || k === "consejo" ? Math.max(v5.floor, 41) : v5.floor) : v.passLine;
            return (
              <li key={k} className="py-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px_90px] sm:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink">{pk.kpiLabel[k]}{objectives.has(k) && <span className="rounded-full bg-indigo-soft px-2 py-0.5 text-[10.5px] font-semibold text-indigo">Objetivo</span>}</div>
                  <div className="text-[12px] text-slate-500 leading-snug">{pk.kpiHint[k]}</div>
                </div>
                <Bar value={c.kpis[k]} line={v.passLine} />
                <div className="text-right text-[13px] tabular-nums"><b className={clsx(ok ? "text-ink" : "text-coral")}>{c.kpis[k]}</b> <span className="text-slate-400">· mín. {min}</span></div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        {v5 && (
          <Panel title="Criterio de decisión" testid="consejo-criterio">
            <div className="flex items-baseline gap-2"><span className="text-[28px] font-semibold leading-none tabular-nums text-ink">{jPct} %</span><span className="text-sm text-slate-500">bien razonados · mínimo {Math.round(v5.judgment.min * 100)} %</span></div>
            <p className="mt-2 text-[13px] text-slate-500">{v5.judgment.good} de {v5.judgment.total} asuntos. Los que dejes vencer cuentan en contra; una respuesta defendible aunque tenga costo cuenta como bien razonada.</p>
          </Panel>
        )}
        <Panel title="Líneas rojas" testid="consejo-lineas-rojas">
          <ul className="space-y-1.5 text-[13px] text-slate-600">
            {["Poner en riesgo la seguridad de las personas", "Fraude o encubrir un error culpando a otro", "Represalias contra quien denuncia", "Ocultar riesgos al consejo o a un cliente"].map((x) => <li key={x} className="flex gap-2"><X size={14} className="mt-0.5 shrink-0 text-coral" strokeWidth={2.5} />{x}</li>)}
          </ul>
          <p className="mt-3 text-[12px] text-slate-500">Cruzar una no se compensa con buenos números. Además, la caja no puede caer en insolvencia{h.th.insolvency !== null ? ` (menos de ${h.th.insolvency})` : ""}.</p>
        </Panel>
      </div>

      {v5 && (
        <Panel title="Cómo vas hoy" testid="consejo-revision">
          <ul className="divide-y divide-slate-100 text-sm">
            {v5.objectives.map((o) => <Check2 key={o.kpi} ok={o.ok} label={`Objetivo: ${pk.kpiLabel[o.kpi]} en ${v.passLine} o más`} value={String(o.value)} />)}
            <Check2 ok={h.value >= v5.healthMin} label={`Salud de ${v5.healthMin} o más, sin indicadores debajo de ${v5.floor}`} value={String(h.value)} />
            <Check2 ok={v5.judgment.ratio >= v5.judgment.min} label={`Al menos ${Math.round(v5.judgment.min * 100)} % de asuntos bien razonados`} value={`${jPct} %`} />
          </ul>
          <Link href="/ceo/carrera" className="mt-3 inline-block text-xs font-semibold text-indigo hover:text-ink">Ver tu evaluación en Carrera →</Link>
        </Panel>
      )}

      {board.length > 0 && (
        <Panel title="Tus consejeros" testid="consejo-relaciones">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {board.map((p) => {
              const r = c.relations[p.id] ?? REL_START;
              const m = moodOf(r);
              return (
                <li key={p.id} className="rounded-2xl border border-slate-100 p-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar id={p.id} size={36} pack={pk} />
                    <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-ink truncate">{p.name}</div><div className="text-[12px] text-slate-500 truncate">{p.role}</div></div>
                    <span className="text-right"><span className="block text-[11px] font-semibold text-ink">{m.label}</span><span className="block text-[11px] tabular-nums text-slate-400">{r}/100</span></span>
                  </div>
                  {p.cares && <p className="mt-2 text-[12px] text-slate-500 leading-snug">Le importa: {p.cares}</p>}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </>
  );
}

function Check2({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <span className="flex items-start gap-2 text-ink">{ok ? <Check size={14} className="mt-0.5 shrink-0 text-mint" strokeWidth={3} /> : <X size={14} className="mt-0.5 shrink-0 text-coral" strokeWidth={3} />}{label}</span>
      <span className={clsx("shrink-0 tabular-nums text-xs font-semibold", ok ? "text-slate-500" : "text-coral")}>{value}</span>
    </li>
  );
}
