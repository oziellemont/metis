"use client";
import { useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { Plus, FileSpreadsheet, X, Pencil } from "lucide-react";
import { useMetis, newId } from "@/lib/store";
import { PageHeader } from "@/components/ui/primitives";
import { DIR, TYPE } from "@/lib/labels";
import type { Direction, Element, ElementType } from "@/lib/domain/types";

export default function Catalogo() {
  const s = useMetis();
  const [editing, setEditing] = useState<Element | null | "new">(null);
  const [q, setQ] = useState("");
  const list = s.elements.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader
        title={`Catálogo de elementos · ${s.tenant.name}`}
        subtitle="Cada elemento existe una sola vez con su fórmula, unidad y dirección. Puede medirse en varios alcances, cada uno con su dueño y sus metas."
        actions={<><button className="btn-ghost"><FileSpreadsheet size={14} /> Importar desde Excel</button><button className="btn-primary" onClick={() => setEditing("new")}><Plus size={14} /> Nuevo elemento</button></>}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 card overflow-x-auto">
          <div className="p-3 border-b border-slate-100"><input className="input" placeholder="Buscar en el catálogo…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-slate-100"><tr><th className="th">Tipo</th><th className="th">Elemento y fórmula</th><th className="th">Unidad</th><th className="th">Dir.</th><th className="th">LAE</th><th className="th">Alcances permitidos</th><th className="th text-right">En uso</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((e) => {
                const lae = s.laes.find((l) => l.id === e.laeId);
                const inUse = s.scorecardItems.filter((i) => s.elementScopes.find((es) => es.id === i.elementScopeId)?.elementId === e.id).length;
                return (
                  <tr key={e.id} className="hover:bg-slate-50/60">
                    <td className="td"><span className={clsx("chip", e.type === "kpi" ? "bg-indigo-soft text-indigo" : "bg-sky-soft text-sky")}>{TYPE[e.type]}</span></td>
                    <td className="td"><div className="font-medium">{e.name}</div><div className="text-xs text-slate-400">{e.formula}</div></td>
                    <td className="td text-slate-600">{e.unit}</td>
                    <td className="td" title={DIR[e.direction].long}>{DIR[e.direction].arrow}</td>
                    <td className="td text-xs text-slate-600"><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: lae?.color }} />{lae?.name}</span></td>
                    <td className="td text-xs text-slate-600">{e.allowedScopeTypeIds.map((id) => s.scopeTypes.find((t) => t.id === id)?.name).join(" · ")}</td>
                    <td className="td text-right tabular-nums">{inUse}</td>
                    <td className="td"><button className="p-1 text-slate-400 hover:text-indigo" onClick={() => setEditing(e)}><Pencil size={14} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <MeasureIn />
          <div className="card p-5">
            <h3 className="font-semibold mb-1">Plantillas por industria</h3>
            <p className="text-xs text-slate-500">Próximamente: catálogos base para manufactura, distribución y logística, retail y servicios profesionales, listos para importar y ajustar.</p>
          </div>
        </div>
      </div>
      {editing && <ElementEditor el={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

/** Medir un elemento en un alcance con su DR (Dueño del Resultado). */
function MeasureIn() {
  const s = useMetis();
  const [f, setF] = useState({ elementId: "", scopeId: "", ownerUserId: "" });
  const el = s.elements.find((e) => e.id === f.elementId);
  const scopes = s.scopes.filter((sc) => !el || el.allowedScopeTypeIds.length === 0 || el.allowedScopeTypeIds.includes(sc.typeId));
  const dup = s.elementScopes.some((es) => es.elementId === f.elementId && es.scopeId === f.scopeId);
  const ok = f.elementId && f.scopeId && f.ownerUserId && !dup;
  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-1">Un elemento, muchos alcances</h3>
      <p className="text-xs text-slate-500 mb-3">“OTIF” existe una sola vez, pero se mide en cada alcance con su propio dueño (DR), que es quien captura el dato del mes.</p>
      <div className="space-y-2 rounded-xl bg-slate-50 p-3 mb-3">
        <select className="input" value={f.elementId} onChange={(e) => setF({ ...f, elementId: e.target.value, scopeId: "" })}>
          <option value="">Elemento…</option>
          {s.elements.map((e) => <option key={e.id} value={e.id}>{TYPE[e.type]} · {e.name}</option>)}
        </select>
        <select className="input" value={f.scopeId} onChange={(e) => setF({ ...f, scopeId: e.target.value })}>
          <option value="">Alcance…</option>
          {scopes.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
        </select>
        <select className="input" value={f.ownerUserId} onChange={(e) => setF({ ...f, ownerUserId: e.target.value })}>
          <option value="">DR · quién captura…</option>
          {s.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        {dup && <div className="text-xs text-coral">Ese elemento ya se mide en ese alcance.</div>}
        <button className="btn-primary w-full justify-center" disabled={!ok} onClick={() => { s.upsertElementScope({ id: newId(), ...f }); setF({ elementId: "", scopeId: "", ownerUserId: "" }); }}><Plus size={14} /> Medir aquí</button>
      </div>
      <ul className="space-y-1.5 text-sm max-h-[420px] overflow-y-auto">
        {s.elementScopes.length === 0 && <li className="text-xs text-slate-400">Aún no hay elementos asignados a un alcance.</li>}
        {s.elementScopes.map((es) => {
          const e = s.elementOf(es.elementId); const sc = s.scopeOf(es.scopeId);
          return (
            <li key={es.id} className="flex items-center gap-2 text-xs">
              <span className="font-medium truncate">{e.name}</span><span className="text-slate-400">·</span><span className="text-slate-600 truncate">{sc.name}</span>
              <select className="ml-auto input !w-auto !py-0.5 !px-1.5 !text-xs max-w-[9rem]" value={es.ownerUserId} title="DR · Dueño del Resultado" onChange={(ev) => s.upsertElementScope({ ...es, ownerUserId: ev.target.value })}>
                <option value="">Sin DR</option>
                {s.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ElementEditor({ el, onClose }: { el?: Element; onClose: () => void }) {
  const s = useMetis();
  const defaultUnit = s.units[0];
  const [f, setF] = useState<Element>(el ?? { id: newId(), type: "kpi", name: "", formula: "", unit: defaultUnit?.symbol ?? "%", unitId: defaultUnit?.id, direction: "up", laeId: s.laes[0]?.id ?? "", allowedScopeTypeIds: [] });
  const currentUnitId = f.unitId ?? s.units.find((u) => u.symbol === f.unit)?.id ?? "";
  const toggle = (id: string) => setF({ ...f, allowedScopeTypeIds: f.allowedScopeTypeIds.includes(id) ? f.allowedScopeTypeIds.filter((x) => x !== id) : [...f.allowedScopeTypeIds, id] });
  return (
    <div className="fixed inset-0 z-30 bg-ink/30 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">{el ? "Editar elemento" : "Nuevo elemento"}</h3><button onClick={onClose} className="text-slate-400 hover:text-ink"><X size={18} /></button></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Tipo</label><select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as ElementType })}><option value="kpi">KPI</option><option value="project">Proyecto</option></select></div>
          <div><label className="label">Dirección</label><select className="input" value={f.direction} onChange={(e) => setF({ ...f, direction: e.target.value as Direction })}><option value="up">↑ Incremental · más es mejor</option><option value="down">↓ Decremental · menos es mejor</option></select></div>
        </div>
        <div className="mt-3"><label className="label">Nombre</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Cumplimiento de entregas OTIF" /></div>
        <div className="mt-3"><label className="label">Fórmula</label><input className="input" value={f.formula} onChange={(e) => setF({ ...f, formula: e.target.value })} placeholder="Pedidos a tiempo y completos / Pedidos totales" /></div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="label">Unidad <Link href="/config/unidades" className="text-indigo hover:underline font-normal">· administrar</Link></label>
            <select className="input" value={currentUnitId} onChange={(e) => { const u = s.units.find((x) => x.id === e.target.value); if (u) setF({ ...f, unitId: u.id, unit: u.symbol }); }}>
              {s.units.map((u) => <option key={u.id} value={u.id}>{u.symbol} · {u.name}</option>)}
            </select>
          </div>
          <div><label className="label">LAE</label><select className="input" value={f.laeId} onChange={(e) => setF({ ...f, laeId: e.target.value })}>{s.laes.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
        </div>
        <div className="mt-3"><label className="label">Alcances permitidos</label><div className="flex flex-wrap gap-1.5">{s.scopeTypes.map((t) => <button key={t.id} type="button" onClick={() => toggle(t.id)} className={clsx("chip border", f.allowedScopeTypeIds.includes(t.id) ? "bg-indigo-soft text-indigo border-indigo/30" : "bg-white text-slate-500 border-slate-200")}>{t.name}</button>)}</div></div>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={!f.name || !f.laeId} onClick={() => { s.upsertElement(f); onClose(); }}>Guardar</button></div>
        {!s.laes.length && <p className="text-xs text-coral mt-2 text-right">Primero crea un objetivo y una LAE en <Link href="/config/estrategia" className="underline">Estrategia</Link>.</p>}
      </div>
    </div>
  );
}
