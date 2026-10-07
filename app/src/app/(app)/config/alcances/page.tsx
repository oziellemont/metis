"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useMetis, newId } from "@/lib/store";
import { PageHeader } from "@/components/ui/primitives";
import type { Scope } from "@/lib/domain/types";

export default function Alcances() {
  const s = useMetis();
  const [newType, setNewType] = useState("");
  const [newScope, setNewScope] = useState<{ name: string; typeId: string; parentId: string }>({ name: "", typeId: s.scopeTypes[0]?.id ?? "", parentId: "" });

  const Tree = ({ parentId, depth }: { parentId: string | null; depth: number }) => {
    const kids = s.scopes.filter((x) => (x.parentId ?? null) === parentId);
    if (!kids.length) return null;
    return (
      <ul className={depth ? "ml-5 border-l border-slate-100 pl-3" : ""}>
        {kids.map((sc) => {
          const t = s.scopeTypes.find((x) => x.id === sc.typeId);
          const uses = s.elementScopes.filter((es) => es.scopeId === sc.id).length;
          return (
            <li key={sc.id} className="py-1">
              <div className="flex items-center gap-2 text-sm"><span className="font-medium">{sc.name}</span><span className="chip bg-slate-100 text-slate-500">{t?.name}</span>{uses > 0 && <span className="text-xs text-slate-400">{uses} elementos</span>}</div>
              <Tree parentId={sc.id} depth={depth + 1} />
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <PageHeader title="Alcances" subtitle="El “dónde” de cada elemento. Define tus propios tipos (Región, Planta, Canal…) y organízalos en jerarquía." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="font-semibold mb-1">Tipos de alcance</h3>
          <p className="text-xs text-slate-500 mb-3">Se usan en todo el catálogo.</p>
          <div className="flex flex-wrap gap-1.5 mb-3">{s.scopeTypes.map((t) => <span key={t.id} className="chip bg-indigo-soft text-indigo">{t.name}</span>)}</div>
          <div className="flex gap-2"><input className="input" placeholder="Nuevo tipo…" value={newType} onChange={(e) => setNewType(e.target.value)} /><button className="btn-primary" disabled={!newType} onClick={() => { s.addScopeType({ id: newId(), name: newType }); setNewType(""); }}><Plus size={14} /></button></div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Jerarquía de alcances</h3>
          <Tree parentId={null} depth={0} />
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="text-xs font-medium text-slate-500 mb-2">Agregar alcance</div>
            <div className="grid sm:grid-cols-4 gap-2">
              <input className="input" placeholder="Nombre" value={newScope.name} onChange={(e) => setNewScope({ ...newScope, name: e.target.value })} />
              <select className="input" value={newScope.typeId} onChange={(e) => setNewScope({ ...newScope, typeId: e.target.value })}>{s.scopeTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <select className="input" value={newScope.parentId} onChange={(e) => setNewScope({ ...newScope, parentId: e.target.value })}><option value="">Sin padre</option>{s.scopes.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <button className="btn-primary" disabled={!newScope.name || !(newScope.typeId || s.scopeTypes[0]) } onClick={() => { const sc: Scope = { id: newId(), name: newScope.name, typeId: newScope.typeId || s.scopeTypes[0].id, parentId: newScope.parentId || null }; s.addScope(sc); setNewScope({ ...newScope, name: "" }); }}><Plus size={14} /> Agregar</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
