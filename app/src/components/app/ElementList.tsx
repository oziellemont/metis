"use client";
import { useState } from "react";
import clsx from "clsx";
import { Trash2 } from "lucide-react";
import { DeleteCatalogDialog } from "./DeleteCatalogDialog";
import type { DeletionTarget } from "@/lib/domain/deletion";
import { useMetis } from "@/lib/store";
import { Avatar, PageHeader, Sparkline, TrafficChip } from "@/components/ui/primitives";
import { DIR, MONTHS, RESP } from "@/lib/labels";
import { traffic } from "@/lib/domain/scoring";
import type { ElementType } from "@/lib/domain/types";

export function ElementList({ type }: { type: ElementType }) {
  const s = useMetis();
  const [del, setDel] = useState<DeletionTarget | null>(null);
  const isAdmin = s.userOf(s.currentUserId).role === "admin";
  const rows = s.elementScopes
    .map((es) => ({ es, el: s.elementOf(es.elementId) }))
    .filter((r) => r.el.type === type);
  return (
    <>
      <PageHeader title={type === "kpi" ? "Indicadores" : "Proyectos"} subtitle={`Todos los ${type === "kpi" ? "KPIs" : "proyectos"} de ${s.tenant.name} por alcance · ${MONTHS[s.month - 1]} ${s.year}`} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-slate-100"><tr><th className="th">Elemento</th><th className="th">Alcance</th><th className="th">LAE</th><th className="th">{RESP.owner.code}</th><th className="th text-right">{RESP.contributor.code}</th><th className="th">Real</th><th className="th">Estado</th><th className="th">Tendencia</th>{isAdmin && <th className="th" />}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ es, el }) => {
              const sc = s.scopeOf(es.scopeId); const lae = s.laeOf(el.laeId); const owner = s.userOf(es.ownerUserId);
              const oi = s.scorecardItems.find((i) => i.elementScopeId === es.id && i.responsibility === "owner");
              const cvs = s.scorecardItems.filter((i) => i.elementScopeId === es.id && i.responsibility === "contributor").length;
              const r = s.results.find((x) => x.elementScopeId === es.id && x.month === s.month && x.year === s.year);
              const t = oi ? traffic(r?.value ?? null, oi.targets, el.direction) : "pending";
              const series = Array.from({ length: 12 }, (_, m) => s.results.find((x) => x.elementScopeId === es.id && x.month === m + 1)?.value ?? null);
              return (
                <tr key={es.id} id={`es-${es.id}`} className="hover:bg-slate-50/60 scroll-mt-24">
                  <td className="td"><div className="font-medium">{el.name}</div><div className="text-xs text-slate-400">{DIR[el.direction].arrow} {el.formula}</div></td>
                  <td className="td text-slate-600">{sc.name}</td>
                  <td className="td text-xs"><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: lae.color }} />{lae.name}</span></td>
                  <td className="td"><span className="inline-flex items-center gap-2 text-sm"><Avatar initials={owner.initials} size="sm" />{owner.name}</span></td>
                  <td className="td text-right tabular-nums text-slate-600">{cvs}</td>
                  <td className="td font-medium tabular-nums">{s.fmt(r?.value, el)}</td>
                  <td className="td"><TrafficChip t={t} /></td>
                  <td className="td">{oi ? <Sparkline values={series} targets={oi.targets} dir={el.direction} /> : <span className={clsx("text-xs text-slate-300")}>—</span>}</td>
                  {isAdmin && <td className="td whitespace-nowrap">
                    <button className="p-1 text-slate-400 hover:text-coral" title={`Dejar de medir en ${sc.name}`} aria-label={`Quitar ${el.name} de ${sc.name}`} onClick={() => setDel({ kind: "elementScope", id: es.id })}><Trash2 size={14} /></button>
                  </td>}
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td className="td text-sm text-slate-400" colSpan={9}>Aún no hay {type === "kpi" ? "KPIs" : "proyectos"} medidos en un alcance. Agrégalos en Configuración → Catálogo.</td></tr>}
          </tbody>
        </table>
      </div>
      <DeleteCatalogDialog target={del} onClose={() => setDel(null)} />
    </>
  );
}
