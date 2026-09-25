"use client";
import clsx from "clsx";
import { useMetis } from "@/lib/store";
import { Avatar, PageHeader, Sparkline, TrafficChip } from "@/components/ui/primitives";
import { DIR, MONTHS, RESP, fmtValue } from "@/lib/labels";
import { traffic } from "@/lib/domain/scoring";
import type { ElementType } from "@/lib/domain/types";

export function ElementList({ type }: { type: ElementType }) {
  const s = useMetis();
  const rows = s.elementScopes
    .map((es) => ({ es, el: s.elements.find((e) => e.id === es.elementId)! }))
    .filter((r) => r.el.type === type);
  return (
    <>
      <PageHeader title={type === "kpi" ? "Indicadores" : "Proyectos"} subtitle={`Todos los ${type === "kpi" ? "KPIs" : "proyectos"} de ${s.tenant.name} por alcance · ${MONTHS[s.month - 1]} ${s.year}`} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-slate-100"><tr><th className="th">Elemento</th><th className="th">Alcance</th><th className="th">LAE</th><th className="th">{RESP.owner.code}</th><th className="th text-right">{RESP.contributor.code}</th><th className="th">Real</th><th className="th">Estado</th><th className="th">Tendencia</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ es, el }) => {
              const sc = s.scopes.find((x) => x.id === es.scopeId)!; const lae = s.laes.find((l) => l.id === el.laeId)!; const owner = s.users.find((u) => u.id === es.ownerUserId)!;
              const oi = s.scorecardItems.find((i) => i.elementScopeId === es.id && i.responsibility === "owner");
              const cvs = s.scorecardItems.filter((i) => i.elementScopeId === es.id && i.responsibility === "contributor").length;
              const r = s.results.find((x) => x.elementScopeId === es.id && x.month === s.month);
              const t = oi ? traffic(r?.value ?? null, oi.targets, el.direction) : "pending";
              const series = Array.from({ length: 12 }, (_, m) => s.results.find((x) => x.elementScopeId === es.id && x.month === m + 1)?.value ?? null);
              return (
                <tr key={es.id} className="hover:bg-slate-50/60">
                  <td className="td"><div className="font-medium">{el.name}</div><div className="text-xs text-slate-400">{DIR[el.direction].arrow} {el.formula}</div></td>
                  <td className="td text-slate-600">{sc.name}</td>
                  <td className="td text-xs"><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: lae.color }} />{lae.name}</span></td>
                  <td className="td"><span className="inline-flex items-center gap-2 text-sm"><Avatar initials={owner.initials} size="sm" />{owner.name}</span></td>
                  <td className="td text-right tabular-nums text-slate-600">{cvs}</td>
                  <td className="td font-medium tabular-nums">{fmtValue(r?.value, el.unit)}</td>
                  <td className="td"><TrafficChip t={t} /></td>
                  <td className="td">{oi ? <Sparkline values={series} targets={oi.targets} dir={el.direction} /> : <span className={clsx("text-xs text-slate-300")}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
