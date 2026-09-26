"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Target, ChevronRight } from "lucide-react";
import { useMetis } from "@/lib/store";
import { Avatar, PageHeader, TrafficChip } from "@/components/ui/primitives";
import { MONTHS, RESP, TRAFFIC, TYPE } from "@/lib/labels";
import { traffic } from "@/lib/domain/scoring";
import type { Traffic } from "@/lib/domain/types";

export default function Mapa() {
  const s = useMetis();
  const [scopeFilter, setScopeFilter] = useState<string>("all");

  // ids de alcances dentro del filtro (incluye descendientes)
  const scopeIds = useMemo(() => {
    if (scopeFilter === "all") return null;
    const set = new Set<string>();
    const walk = (id: string) => { set.add(id); s.scopes.filter((x) => x.parentId === id).forEach((c) => walk(c.id)); };
    walk(scopeFilter);
    return set;
  }, [scopeFilter, s.scopes]);

  const esVisible = s.elementScopes.filter((es) => !scopeIds || scopeIds.has(es.scopeId));

  const evalEs = (esId: string) => {
    const es = s.elementScopes.find((x) => x.id === esId)!;
    const el = s.elements.find((e) => e.id === es.elementId)!;
    const ownerItem = s.scorecardItems.find((i) => i.elementScopeId === esId && i.responsibility === "owner");
    const r = s.results.find((x) => x.elementScopeId === esId && x.month === s.month);
    const t: Traffic = ownerItem ? traffic(r?.value ?? null, ownerItem.targets, el.direction) : "pending";
    const cvs = s.scorecardItems.filter((i) => i.elementScopeId === esId && i.responsibility === "contributor").length;
    return { es, el, value: r?.value ?? null, t, cvs, owner: s.users.find((u) => u.id === es.ownerUserId)! };
  };

  const totals: Record<Traffic, number> = { outstanding: 0, satisfactory: 0, minimum: 0, below: 0, pending: 0 };
  esVisible.forEach((es) => totals[evalEs(es.id).t]++);

  return (
    <>
      <PageHeader
        title={`Mapa de alineación ${s.year}`}
        subtitle={`Objetivos → LAEs → KPIs y proyectos por alcance → responsables · ${MONTHS[s.month - 1]}`}
        actions={
          <select className="input !w-auto" value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
            <option value="all">Vista: toda la empresa</option>
            {s.scopes.map((sc) => <option key={sc.id} value={sc.id}>Vista: {sc.name}</option>)}
          </select>
        }
      />

      <div className="card p-4 mb-6 flex flex-wrap items-center gap-4">
        <span className="text-sm text-slate-500">{esVisible.length} elementos-alcance</span>
        {(["outstanding", "satisfactory", "minimum", "below", "pending"] as Traffic[]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-sm"><span className={clsx("h-2 w-2 rounded-full", TRAFFIC[t].dot)} />{totals[t]} <span className="text-slate-400">{TRAFFIC[t].label}</span></span>
        ))}
        <span className="ml-auto text-xs text-slate-400">100% de los elementos conectados a una LAE y a un objetivo</span>
      </div>

      <div className="space-y-6">
        {s.objectives.map((o) => {
          const oLaes = s.laes.filter((l) => l.objectiveId === o.id);
          return (
            <section key={o.id} className="card p-5">
              <div className="flex items-start gap-3">
                <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1E1A5E] to-[#4F3FE0] text-white inline-flex items-center justify-center shrink-0"><Target size={18} /></span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Objetivo corporativo · Dirección General</div>
                  <h2 className="text-lg font-semibold">{o.name}</h2>
                  {o.description && <p className="text-sm text-slate-500">{o.description}</p>}
                </div>
              </div>

              <div className={clsx("mt-5 grid gap-4", oLaes.length > 1 ? "lg:grid-cols-2" : "")}>
                {oLaes.map((l) => {
                  const els = s.elements.filter((e) => e.laeId === l.id);
                  const rows = els.flatMap((e) => esVisible.filter((es) => es.elementId === e.id).map((es) => evalEs(es.id)));
                  return (
                    <div key={l.id} className="rounded-2xl border border-slate-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                        <div className="font-medium">{l.name}</div>
                        <span className="text-xs text-slate-400">LAE · {rows.length} {rows.length === 1 ? "elemento" : "elementos"}</span>
                      </div>
                      {rows.length === 0 ? <div className="text-xs text-slate-400">Sin elementos en esta vista.</div> : (
                        <ul className="space-y-2">
                          {rows.map(({ es, el, value, t, cvs, owner }) => {
                            const sc = s.scopes.find((x) => x.id === es.scopeId)!;
                            return (
                              <li key={es.id} className="flex items-center gap-3 rounded-xl bg-slate-50/70 px-3 py-2">
                                <span className={clsx("chip shrink-0", el.type === "kpi" ? "bg-indigo-soft text-indigo" : "bg-sky-soft text-sky")}>{TYPE[el.type]}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium truncate">{el.name} <span className="text-slate-400 font-normal">· {sc.name}</span></div>
                                  <div className="text-xs text-slate-400 flex items-center gap-1.5"><Avatar initials={owner.initials} size="sm" />{owner.name} · {RESP.owner.code}{cvs > 0 && <> · <ChevronRight size={10} /> {cvs} {RESP.contributor.code}</>}</div>
                                </div>
                                <span className="text-sm font-medium tabular-nums">{s.fmt(value, el)}</span>
                                <TrafficChip t={t} compact />
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
