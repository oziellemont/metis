"use client";
import { useState } from "react";
import clsx from "clsx";
import { Plus, Pencil, Trash2, X, Lock } from "lucide-react";
import { useMetis } from "@/lib/store";
import { PageHeader } from "@/components/ui/primitives";
import { fmtWithUnit } from "@/lib/labels";
import type { Unit } from "@/lib/domain/types";

export default function Unidades() {
  const s = useMetis();
  const [editing, setEditing] = useState<Unit | null | "new">(null);
  const [msg, setMsg] = useState<string | null>(null);
  const usage = (u: Unit) => s.elements.filter((e) => e.unitId === u.id || (!e.unitId && e.unit === u.symbol)).length;

  return (
    <>
      <PageHeader
        title={`Unidades de medida · ${s.tenant.name}`}
        subtitle="Cada indicador se expresa en una unidad de este catálogo: %, $, toneladas, piezas, días… Agrega las que tu negocio necesite; las que están en uso no se pueden borrar."
        actions={<button className="btn-primary" onClick={() => setEditing("new")}><Plus size={14} /> Nueva unidad</button>}
      />
      {msg && <div className="mb-4 rounded-xl bg-amber-soft text-amber text-sm px-4 py-2 flex items-center justify-between">{msg}<button onClick={() => setMsg(null)}><X size={14} /></button></div>}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 card overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-slate-100"><tr><th className="th">Símbolo</th><th className="th">Nombre</th><th className="th">Ejemplo</th><th className="th">Decimales</th><th className="th">Posición</th><th className="th text-right">Indicadores</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {s.units.map((u) => {
                const n = usage(u);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="td"><span className="chip bg-indigo-soft text-indigo font-semibold">{u.symbol}</span></td>
                    <td className="td font-medium">{u.name}{u.system && <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-slate-400"><Lock size={10} /> base</span>}</td>
                    <td className="td tabular-nums text-slate-600">{fmtWithUnit(1234.567, u)}</td>
                    <td className="td tabular-nums text-slate-600">{u.decimals}</td>
                    <td className="td text-slate-600 text-xs">{u.position === "prefix" ? "Antes del número" : "Después del número"}</td>
                    <td className="td text-right tabular-nums">{n}</td>
                    <td className="td whitespace-nowrap">
                      <button className="p-1 text-slate-400 hover:text-indigo" title="Editar" onClick={() => setEditing(u)}><Pencil size={14} /></button>
                      <button className={clsx("p-1", n > 0 ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-coral")} title={n > 0 ? "En uso: no se puede borrar" : "Quitar"}
                        onClick={() => { const r = s.removeUnit(u.id); if (!r.ok) setMsg(r.reason ?? "No se pudo quitar."); }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold mb-1">¿Para qué sirve?</h3>
            <p className="text-xs text-slate-500">La unidad define cómo se muestra el dato en scorecards, carga mensual y reportes: <strong>$4.9M</strong>, <strong>95.3%</strong>, <strong>1,250 ton</strong>. Al editar una unidad, todos sus indicadores se actualizan.</p>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold mb-1">Sugeridas por industria</h3>
            <ul className="text-xs text-slate-500 space-y-1 mt-2">
              <li><strong>Manufactura:</strong> ton, pzas, hrs, ppm, OEE %</li>
              <li><strong>Distribución:</strong> pedidos, viajes, km, $/ton</li>
              <li><strong>Retail:</strong> tickets, m², $/m²</li>
              <li><strong>Servicios:</strong> hrs facturables, clientes, NPS pts</li>
            </ul>
          </div>
        </div>
      </div>
      {editing && <UnitEditor u={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function UnitEditor({ u, onClose }: { u?: Unit; onClose: () => void }) {
  const s = useMetis();
  const [f, setF] = useState<Unit>(u ?? { id: `un-${Date.now()}`, symbol: "", name: "", decimals: 1, position: "suffix" });
  const dup = s.units.some((x) => x.id !== f.id && x.symbol.trim().toLowerCase() === f.symbol.trim().toLowerCase());
  return (
    <div className="fixed inset-0 z-30 bg-ink/30 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">{u ? "Editar unidad" : "Nueva unidad"}</h3><button onClick={onClose} className="text-slate-400 hover:text-ink"><X size={18} /></button></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Símbolo</label><input className="input" value={f.symbol} onChange={(e) => setF({ ...f, symbol: e.target.value })} placeholder="ton" maxLength={12} /></div>
          <div><label className="label">Decimales</label><select className="input" value={f.decimals} onChange={(e) => setF({ ...f, decimals: Number(e.target.value) })}>{[0, 1, 2, 3].map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
        </div>
        <div className="mt-3"><label className="label">Nombre</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Toneladas" /></div>
        <div className="mt-3"><label className="label">Posición del símbolo</label>
          <div className="flex gap-2">
            {(["prefix", "suffix"] as const).map((p) => <button key={p} type="button" onClick={() => setF({ ...f, position: p })} className={clsx("chip border", f.position === p ? "bg-indigo-soft text-indigo border-indigo/30" : "bg-white text-slate-500 border-slate-200")}>{p === "prefix" ? "Antes · $1,200" : "Después · 1,200 ton"}</button>)}
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm flex items-center justify-between"><span className="text-slate-500 text-xs">Vista previa</span><span className="font-semibold tabular-nums">{fmtWithUnit(1234.567, { ...f, symbol: f.symbol || "?" })}</span></div>
        {dup && <p className="mt-2 text-xs text-coral">Ya existe una unidad con ese símbolo.</p>}
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={!f.symbol.trim() || !f.name.trim() || dup} onClick={() => { s.upsertUnit({ ...f, symbol: f.symbol.trim(), name: f.name.trim() }); onClose(); }}>Guardar</button></div>
      </div>
    </div>
  );
}
