"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Mountain, ChevronRight } from "lucide-react";
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
    const es = s.esOf(esId);
    const el = s.elementOf(es.elementId);
    const ownerItem = s.scorecardItems.find((i) => i.elementScopeId === esId && i.responsibility === "owner");
    const r = s.results.find((x) => x.elementScopeId === esId && x.month === s.month && x.year === s.year);
    const t: Traffic = ownerItem ? traffic(r?.value ?? null, ownerItem.targets, el.direction) : "pending";
    const cvs = s.scorecardItems.filter((i) => i.elementScopeId === esId && i.responsibility === "contributor").length;
    return { es, el, value: r?.value ?? null, t, cvs, owner: s.userOf(es.ownerUserId) };
  };

  const mega = s.objectives[0];
  const laes = s.laes;
  const totals: Record<Traffic, number> = { outstanding: 0, satisfactory: 0, minimum: 0, pending: 0 };
  esVisible.forEach((es) => totals[evalEs(es.id).t]++);

  return (
    <>
      <PageHeader
        title={`Mapa de alineación ${s.year}`}
        subtitle={`MEGA → Líneas de Acción (LAE) → KPIs y proyectos por alcance → responsables · ${MONTHS[s.month - 1]}`}
        actions={
          <select className="input !w-auto" value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
            <option value="all">Vista: toda la empresa</option>
            {s.scopes.map((sc) => <option key={sc.id} value={sc.id}>Vista: {sc.name}</option>)}
          </select>
        }
      />

      <div className="card p-4 mb-6 flex flex-wrap items-center gap-4">
        <span className="text-sm text-slate-500">{esVisible.length} elementos-alcance</span>
        {(["outstanding", "satisfactory", "minimum", "pending"] as Traffic[]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-sm"><span className={clsx("h-2 w-2 rounded-full", TRAFFIC[t].dot)} />{totals[t]} <span className="text-slate-400">{TRAFFIC[t].label}</span></span>
        ))}
        <span className="ml-auto text-xs text-slate-400">Cada KPI y proyecto conectado a una LAE y a la MEGA</span>
      </div>

      <div className="space-y-6">
        {mega && (
          <section className="rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-5 text-white">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10"><Mountain size={18} /></span>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-mint-light">MEGA{mega.horizon ? ` · meta ${mega.horizon}` : ""} · Dirección General</div>
                <h2 className="text-lg font-semibold">{mega.name}</h2>
                {mega.description && <p className="text-sm text-white/70">{mega.description}</p>}
              </div>
            </div>
          </section>
        )}
        {!mega && <div className="card p-6 text-center text-sm text-slate-500">Todavía no hay MEGA. Defínela en Configuración → Estrategia.</div>}
        <div className={clsx("grid gap-4", laes.length > 1 ? "lg:grid-cols-2" : "")}>
                {laes.map((l) => {
                  const els = s.elements.filter((e) => e.laeId === l.id);
                  const rows = els.flatMap((e) => esVisible.filter((es) => es.elementId === e.id).map((es) => evalEs(es.id)));
                  return (
                    <div key={l.id} className="card overflow-hidden"><div className="h-1.5" style={{ background: l.color ?? "#94A3B8" }} /><div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                        <div className="font-medium">{l.name}</div>
                        <span className="text-xs text-slate-400">Línea de acción · {rows.length} {rows.length === 1 ? "KPI o proyecto" : "KPIs y proyectos"}</span>
                      </div>
                      {rows.length === 0 ? <div className="text-xs text-slate-400">Sin elementos en esta vista.</div> : (
                        <ul className="space-y-2">
                          {rows.map(({ es, el, value, t, cvs, owner }) => {
                            const sc = s.scopeOf(es.scopeId);
                            return (
                              <li key={es.id} className="flex items-center gap-3 rounded-xl bg-slate-50/70 px-3 py-2">
                                <span className={clsx("chip shrink-0", el.type === "kpi" ? "bg-indigo-soft text-indigo" : "bg-sky-soft text-sky")}>{TYPE[el.type]}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium truncate">{el.name} <span className="text-slate-400 font-normal">· {sc.name}</span></div>
                                  <div className="text-xs text-slate-400 flex items-center gap-1.5"><Avatar initials={owner.initials} size="sm" />{owner.name} · {RESP.owner.code}{cvs > 0 && <> · <ChevronRight size={10} /> {cvs} {cvs === 1 ? RESP.contributor.code : RESP.contributor.plural}</>}</div>
                                </div>
                                <span className="text-sm font-medium tabular-nums">{s.fmt(value, el)}</span>
                                <TrafficChip t={t} compact />
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div></div>
                  );
                })}
        </div>
      </div>
    </>
  );
}
