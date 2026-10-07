"use client";
import { useState } from "react";
import { Plus, Pencil, Check, X } from "lucide-react";
import { useMetis, newId } from "@/lib/store";
import { PageHeader } from "@/components/ui/primitives";
import type { LAE, StrategicObjective } from "@/lib/domain/types";

const COLORS = ["#4F3FE0", "#14C98E", "#2FA7F5", "#F5A524", "#F2545B", "#8B5CF6", "#0EA5A4", "#64748B"];

/** Objetivos estratégicos y sus LAE (Líneas de Acción Estratégica): la parte de arriba del mapa de alineación. */
export default function Estrategia() {
  const s = useMetis();
  const isAdmin = s.userOf(s.currentUserId).role === "admin";
  const [obj, setObj] = useState<StrategicObjective | null>(null);
  const [lae, setLae] = useState<LAE | null>(null);

  return (
    <>
      <PageHeader
        title={`Estrategia · ${s.tenant.name}`}
        subtitle="Los objetivos a largo plazo y las Líneas de Acción Estratégica (LAE) que los hacen realidad. Cada KPI o proyecto del catálogo cuelga de una LAE."
        actions={isAdmin ? <button className="btn-primary" onClick={() => setObj({ id: newId(), name: "", horizon: String(s.year + 2) })}><Plus size={14} /> Nuevo objetivo</button> : undefined}
      />
      {!isAdmin && <div className="card p-4 mb-4 text-sm text-slate-500">Sólo los administradores de {s.tenant.name} pueden editar la estrategia.</div>}
      {s.objectives.length === 0 && (
        <div className="card p-8 text-center text-slate-500">
          Aún no hay objetivos estratégicos. {isAdmin && "Empieza con el primero: ¿qué quiere lograr la empresa en 3 años?"}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {s.objectives.map((o) => {
          const laes = s.laes.filter((l) => l.objectiveId === o.id);
          return (
            <div key={o.id} id={`obj-${o.id}`} className="card p-5 scroll-mt-24">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">Objetivo{o.horizon ? ` · ${o.horizon}` : ""}</div>
                  <div className="font-semibold">{o.name}</div>
                  {o.description && <p className="text-xs text-slate-500 mt-1">{o.description}</p>}
                </div>
                {isAdmin && <button className="p-1 text-slate-400 hover:text-indigo" onClick={() => setObj(o)} aria-label="Editar objetivo"><Pencil size={14} /></button>}
              </div>
              <ul className="mt-4 space-y-1.5">
                {laes.map((l) => {
                  const n = s.elements.filter((e) => e.laeId === l.id).length;
                  return (
                    <li key={l.id} id={`lae-${l.id}`} className="flex items-center gap-2 text-sm rounded-xl bg-slate-50 px-3 py-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: l.color ?? "#94A3B8" }} />
                      <span className="font-medium">{l.name}</span>
                      <span className="text-xs text-slate-400">{n} elemento{n === 1 ? "" : "s"}</span>
                      {isAdmin && <button className="ml-auto p-1 text-slate-400 hover:text-indigo" onClick={() => setLae(l)} aria-label="Editar LAE"><Pencil size={13} /></button>}
                    </li>
                  );
                })}
              </ul>
              {isAdmin && (
                <button className="btn-ghost mt-3 !py-1.5 text-xs" onClick={() => setLae({ id: newId(), objectiveId: o.id, name: "", color: COLORS[s.laes.length % COLORS.length] })}>
                  <Plus size={13} /> Agregar LAE
                </button>
              )}
            </div>
          );
        })}
      </div>

      {obj && (
        <Modal title={s.objectives.some((x) => x.id === obj.id) ? "Editar objetivo" : "Nuevo objetivo"} onClose={() => setObj(null)}
          canSave={!!obj.name.trim()} onSave={() => { s.upsertObjective({ ...obj, name: obj.name.trim() }); setObj(null); }}>
          <label className="label">Nombre</label>
          <input className="input" value={obj.name} onChange={(e) => setObj({ ...obj, name: e.target.value })} placeholder="Crecer EBITDA 40% a 2028" autoFocus />
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div><label className="label">Horizonte (año)</label><input className="input" inputMode="numeric" value={obj.horizon ?? ""} onChange={(e) => setObj({ ...obj, horizon: e.target.value.replace(/\D/g, "").slice(0, 4) })} /></div>
          </div>
          <label className="label mt-3">Descripción</label>
          <textarea className="input min-h-[80px]" value={obj.description ?? ""} onChange={(e) => setObj({ ...obj, description: e.target.value })} />
        </Modal>
      )}
      {lae && (
        <Modal title={s.laes.some((x) => x.id === lae.id) ? "Editar LAE" : "Nueva LAE"} onClose={() => setLae(null)}
          canSave={!!lae.name.trim()} onSave={() => { s.upsertLae({ ...lae, name: lae.name.trim() }); setLae(null); }}>
          <label className="label">Nombre de la Línea de Acción Estratégica</label>
          <input className="input" value={lae.name} onChange={(e) => setLae({ ...lae, name: e.target.value })} placeholder="Excelencia operativa" autoFocus />
          <label className="label mt-3">Objetivo</label>
          <select className="input" value={lae.objectiveId} onChange={(e) => setLae({ ...lae, objectiveId: e.target.value })}>
            {s.objectives.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <label className="label mt-3">Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setLae({ ...lae, color: c })} className="h-7 w-7 rounded-full grid place-items-center" style={{ background: c }} aria-label={c}>
                {lae.color === c && <Check size={14} className="text-white" />}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({ title, children, onClose, onSave, canSave }: { title: string; children: React.ReactNode; onClose: () => void; onSave: () => void; canSave: boolean }) {
  return (
    <div className="fixed inset-0 z-30 bg-ink/30 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-ink"><X size={18} /></button></div>
        {children}
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={!canSave} onClick={onSave}>Guardar</button></div>
      </div>
    </div>
  );
}
