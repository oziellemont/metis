"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Plus, Send, Check, History, X, Trash2, AlertTriangle, Pencil } from "lucide-react";
import { useMetis } from "@/lib/store";
import { Avatar, PageHeader, RespChip, StatusChip, TrafficChip, Sparkline } from "@/components/ui/primitives";
import { DIR, MONTHS, MONTHS_SHORT, PERIOD, RESP, STATUS, TYPE } from "@/lib/labels";
import { invalidMonths, totalWeight, weightFor } from "@/lib/domain/scoring";
import type { Period, Responsibility, ScorecardItem } from "@/lib/domain/types";

export function ScorecardView({ userId, asManager = false }: { userId: string; asManager?: boolean }) {
  const s = useMetis();
  const user = s.users.find((u) => u.id === userId)!;
  const manager = s.users.find((u) => u.id === user.managerId);
  const sc = s.scorecards.find((x) => x.userId === userId);
  const items = useMemo(() => (sc ? s.scorecardItems.filter((i) => i.scorecardId === sc.id) : []), [s.scorecardItems, sc]);
  const [showHistory, setShowHistory] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ScorecardItem | null>(null);
  const [note, setNote] = useState("");

  if (!sc) return <div className="card p-8 text-center text-slate-500">Este colaborador aún no tiene scorecard {s.year}.</div>;

  const editable = !asManager && (sc.status === "draft" || sc.status === "changes_requested");
  const total = totalWeight(items, s.month);
  const badMonths = invalidMonths(items);
  const att = s.scorecardAttainment(sc.id);
  const owned = items.filter((i) => i.responsibility === "owner").length;
  const kpis = items.filter((i) => s.elements.find((e) => e.id === s.elementScopes.find((es) => es.id === i.elementScopeId)!.elementId)!.type === "kpi").length;

  const steps: { key: string; label: string; done: boolean }[] = [
    { key: "draft", label: "Borrador", done: true },
    { key: "submitted", label: "Enviado a jefe", done: ["submitted", "approved", "changes_requested"].includes(sc.status) },
    { key: "approved", label: "Aprobado", done: sc.status === "approved" },
  ];

  return (
    <>
      <PageHeader
        title={asManager ? `Scorecard de ${user.name}` : `Mi Scorecard ${s.year}`}
        subtitle={`${user.name} · ${user.title}`}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setShowWeights((v) => !v)}>Ponderación por mes</button>
            <button className="btn-ghost" onClick={() => setShowHistory((v) => !v)}><History size={14} /> Historial</button>
            {editable && <button className="btn-primary" onClick={() => setAdding(true)}><Plus size={14} /> Agregar elemento</button>}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-500">Estado del scorecard</div>
            <div className="text-xs text-slate-500">{sc.status === "approved" && manager ? `Aprobado por ${manager.name}` : manager ? `Aprueba: ${manager.name}` : ""}</div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {steps.map((st, i) => (
              <div key={st.key} className="flex items-center gap-2 flex-1">
                <div className={clsx("flex items-center gap-1.5 text-sm", st.done ? "text-sob font-medium" : "text-slate-400")}>
                  <span className={clsx("h-5 w-5 rounded-full inline-flex items-center justify-center text-[10px]", st.done ? "bg-mint text-white" : "bg-slate-100")}>{st.done ? <Check size={12} /> : i + 1}</span>
                  {st.label}
                </div>
                {i < steps.length - 1 && <div className={clsx("h-px flex-1", st.done && steps[i + 1].done ? "bg-mint" : "bg-slate-200")} />}
              </div>
            ))}
            <StatusChip s={sc.status} />
          </div>
          {sc.status === "changes_requested" && (
            <div className="mt-3 rounded-xl bg-amber-soft text-amber text-sm px-3 py-2 flex gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" /><span>{sc.history.filter((h) => h.action === "changes_requested").at(-1)?.note ?? "Tu jefe solicitó ajustes."}</span></div>
          )}
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-500">Ponderación total · {MONTHS_SHORT[s.month - 1]}</div>
            <div className={clsx("text-xl font-semibold", total === 100 ? "text-sob" : "text-coral")}>{total}% {total === 100 ? "✓" : ""}</div>
          </div>
          <div className="mt-1 text-xs text-slate-400">{items.length} elementos · {kpis} KPIs · {items.length - kpis} proyectos · {owned} como {RESP.owner.code}</div>
          {badMonths.length > 0 && <div className="mt-2 text-xs text-coral">No suma 100% en: {badMonths.map((m) => MONTHS_SHORT[m - 1]).join(", ")}</div>}
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Cumplimiento ponderado</span>
            <span className={clsx("text-xl font-semibold", att.value === null ? "text-slate-300" : att.value >= 100 ? "text-sob" : att.value >= 90 ? "text-amber" : "text-coral")}>{att.value ?? "—"}{att.value !== null && "%"}</span>
          </div>
        </div>
      </div>

      {showWeights && <MonthlyWeights items={items} editable={editable} onClose={() => setShowWeights(false)} />}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="border-b border-slate-100">
            <tr>
              <th className="th">Tipo</th><th className="th">Elemento</th><th className="th">Dirección</th><th className="th">Alcance</th>
              <th className="th text-right">Pond.</th><th className="th">Resp.</th><th className="th">Mín · Sat · Sob</th><th className="th">Periodo</th>
              <th className="th">Real {MONTHS_SHORT[s.month - 1]}</th><th className="th">Tendencia</th><th className="th">Vínculo</th>{editable && <th className="th" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((it) => {
              const es = s.elementScopes.find((x) => x.id === it.elementScopeId)!;
              const el = s.elements.find((x) => x.id === es.elementId)!;
              const lae = s.laes.find((x) => x.id === el.laeId)!;
              const scope = s.scopes.find((x) => x.id === es.scopeId)!;
              const owner = s.users.find((u) => u.id === es.ownerUserId)!;
              const ev = s.evaluate(it);
              const series = Array.from({ length: 12 }, (_, m) => s.results.find((r) => r.elementScopeId === es.id && r.month === m + 1)?.value ?? null);
              return (
                <tr key={it.id} className="hover:bg-slate-50/60">
                  <td className="td"><span className={clsx("chip", el.type === "kpi" ? "bg-indigo-soft text-indigo" : "bg-sky-soft text-sky")}>{TYPE[el.type]}</span></td>
                  <td className="td">
                    <div className="font-medium">{el.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: lae.color }} />LAE · {lae.name}</div>
                  </td>
                  <td className="td whitespace-nowrap text-slate-600" title={DIR[el.direction].long}>{DIR[el.direction].arrow} {DIR[el.direction].short}</td>
                  <td className="td text-slate-600">{scope.name}</td>
                  <td className="td text-right font-medium tabular-nums">{weightFor(it, s.month)}%</td>
                  <td className="td"><RespChip r={it.responsibility} /></td>
                  <td className="td whitespace-nowrap tabular-nums text-slate-600">
                    <span className="text-min">{s.fmt(it.targets.min, el)}</span> · <span className="text-sat">{s.fmt(it.targets.sat, el)}</span> · <span className="text-sob">{s.fmt(it.targets.out, el)}</span>
                  </td>
                  <td className="td text-slate-600">{PERIOD[it.period]}</td>
                  <td className="td whitespace-nowrap"><div className="flex items-center gap-2"><span className="font-medium tabular-nums">{s.fmt(ev.value, el)}</span><TrafficChip t={ev.traffic} compact /></div></td>
                  <td className="td"><Sparkline values={series} targets={it.targets} dir={el.direction} /></td>
                  <td className="td">
                    {it.responsibility === "owner" ? <span className="text-xs text-slate-500">Dueño del dato</span> : (
                      <div className="flex items-center gap-2"><Avatar initials={owner.initials} size="sm" /><div className="text-xs leading-tight"><div className="font-medium">{owner.name}</div><div className="text-slate-400">{RESP.owner.code}</div></div></div>
                    )}
                  </td>
                  {editable && <td className="td"><div className="flex gap-1"><button className="p-1 text-slate-400 hover:text-indigo" onClick={() => setEditing(it)}><Pencil size={14} /></button><button className="p-1 text-slate-400 hover:text-coral" onClick={() => s.removeItem(it.id)}><Trash2 size={14} /></button></div></td>}
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={12} className="td text-center text-slate-400 py-10">Sin elementos. Agrega tu primer KPI o proyecto desde el catálogo.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Acciones de flujo */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!asManager && editable && (
          <button className="btn-primary" disabled={total !== 100 || badMonths.length > 0 || items.length === 0} onClick={() => s.transition(sc.id, "submitted", user.id)} title={total !== 100 ? "La ponderación debe sumar 100%" : ""}>
            <Send size={14} /> Enviar a {manager?.name.split(" ")[0] ?? "jefe"}
          </button>
        )}
        {!asManager && editable && total !== 100 && <span className="text-xs text-coral">METIS no permite enviar si la ponderación no suma 100%.</span>}
        {asManager && sc.status === "submitted" && (
          <div className="card p-4 w-full">
            <div className="text-sm font-medium mb-2">Revisión del jefe</div>
            <textarea className="input" rows={2} placeholder="Nota para el colaborador (opcional en aprobación, requerida para ajustes)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="mt-3 flex gap-2">
              <button className="btn-mint" onClick={() => { s.transition(sc.id, "approved", s.currentUserId, note || undefined); setNote(""); }}><Check size={14} /> Aprobar</button>
              <button className="btn-ghost" disabled={!note} onClick={() => { s.transition(sc.id, "changes_requested", s.currentUserId, note); setNote(""); }}>Solicitar ajustes</button>
              <button className="btn-ghost text-coral" disabled={!note} onClick={() => { s.transition(sc.id, "rejected", s.currentUserId, note); setNote(""); }}><X size={14} /> Denegar</button>
            </div>
          </div>
        )}
        {!asManager && sc.status === "approved" && <button className="btn-ghost" onClick={() => s.transition(sc.id, "draft", user.id, "Reabierto para edición")}>Reabrir como borrador</button>}
      </div>

      {showHistory && (
        <div className="card p-5 mt-4">
          <h3 className="font-semibold mb-3">Historial</h3>
          <ol className="space-y-2">
            {[...sc.history].reverse().map((h, i) => {
              const by = s.users.find((u) => u.id === h.by);
              return (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-xs text-slate-400 w-36 shrink-0">{new Date(h.at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</span>
                  <StatusChip s={h.action} />
                  <span className="text-slate-600">{by?.name}{h.note ? ` · “${h.note}”` : ""}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {(adding || editing) && <ItemEditor scorecardId={sc.id} userId={user.id} item={editing ?? undefined} onClose={() => { setAdding(false); setEditing(null); }} />}
    </>
  );
}

function MonthlyWeights({ items, editable, onClose }: { items: ScorecardItem[]; editable: boolean; onClose: () => void }) {
  const s = useMetis();
  return (
    <div className="card p-5 mb-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Ponderación por mes</h3><button className="text-slate-400 hover:text-ink" onClick={onClose}><X size={16} /></button></div>
      <p className="text-xs text-slate-500 mb-3">Cada mes puede tener su propia distribución de pesos; cada columna debe sumar 100%.</p>
      <table className="w-full min-w-[900px] text-sm">
        <thead><tr><th className="th">Elemento</th>{MONTHS_SHORT.map((m) => <th key={m} className="th text-right">{m}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((it) => {
            const es = s.elementScopes.find((x) => x.id === it.elementScopeId)!;
            const el = s.elements.find((x) => x.id === es.elementId)!;
            return (
              <tr key={it.id}>
                <td className="td font-medium">{el.name}</td>
                {MONTHS_SHORT.map((_, m) => (
                  <td key={m} className="td text-right">
                    {editable ? (
                      <input type="number" className="input !w-16 !px-2 !py-1 text-right" value={weightFor(it, m + 1)} onChange={(e) => s.updateItem({ ...it, monthlyWeights: { ...(it.monthlyWeights ?? {}), [m + 1]: Number(e.target.value) } })} />
                    ) : <span className="tabular-nums">{weightFor(it, m + 1)}</span>}
                  </td>
                ))}
              </tr>
            );
          })}
          <tr className="font-semibold">
            <td className="td">Total</td>
            {MONTHS_SHORT.map((_, m) => { const t = totalWeight(items, m + 1); return <td key={m} className={clsx("td text-right tabular-nums", t === 100 ? "text-sob" : "text-coral")}>{t}</td>; })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ItemEditor({ scorecardId, userId, item, onClose }: { scorecardId: string; userId: string; item?: ScorecardItem; onClose: () => void }) {
  const s = useMetis();
  const [esId, setEsId] = useState(item?.elementScopeId ?? "");
  const [weight, setWeight] = useState(item?.weight ?? 10);
  const [period, setPeriod] = useState<Period>(item?.period ?? "monthly");
  const [t, setT] = useState(item?.targets ?? { min: 0, sat: 0, out: 0 });
  const es = s.elementScopes.find((x) => x.id === esId);
  const el = es ? s.elements.find((x) => x.id === es.elementId) : undefined;
  const owner = es ? s.users.find((u) => u.id === es.ownerUserId) : undefined;
  const resp: Responsibility = es?.ownerUserId === userId ? "owner" : "contributor";

  // Si es CV, hereda metas del DR (si el DR ya tiene el item en su scorecard)
  const ownerItem = es ? s.scorecardItems.find((i) => i.elementScopeId === es.id && i.responsibility === "owner") : undefined;

  const save = () => {
    if (!es) return;
    const targets = resp === "contributor" && ownerItem ? ownerItem.targets : t;
    const next: ScorecardItem = { id: item?.id ?? `i-${Date.now()}`, scorecardId, elementScopeId: es.id, responsibility: resp, weight, monthlyWeights: item?.monthlyWeights, targets, period };
    item ? s.updateItem(next) : s.addItem(next);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 bg-ink/30 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">{item ? "Editar elemento" : "Agregar elemento"}</h3><button onClick={onClose} className="text-slate-400 hover:text-ink"><X size={18} /></button></div>
        <label className="label">Elemento y alcance (del catálogo)</label>
        <select className="input" value={esId} onChange={(e) => { setEsId(e.target.value); const oi = s.scorecardItems.find((i) => i.elementScopeId === e.target.value && i.responsibility === "owner"); if (oi) setT(oi.targets); }} disabled={!!item}>
          <option value="">Selecciona…</option>
          {s.elementScopes.map((x) => { const e = s.elements.find((y) => y.id === x.elementId)!; const sc = s.scopes.find((y) => y.id === x.scopeId)!; return <option key={x.id} value={x.id}>{TYPE[e.type]} · {e.name} · {sc.name}</option>; })}
        </select>
        {es && el && owner && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
            <div className="flex items-center gap-2"><RespChip r={resp} /><span>{resp === "owner" ? `Eres ${RESP.owner.name}: tú cargas el dato.` : <>Eres {RESP.contributor.name}. Vinculado a <strong>{owner.name}</strong> ({RESP.owner.code}); tu scorecard se actualiza cuando cargue.</>}</span></div>
            <div className="mt-1 text-xs text-slate-500">{DIR[el.direction].long} · unidad {el.unit} · fórmula: {el.formula}</div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div><label className="label">Ponderación base (%)</label><input type="number" className="input" value={weight} onChange={(e) => setWeight(Number(e.target.value))} /></div>
          <div><label className="label">Periodo</label><select className="input" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>{Object.entries(PERIOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {(["min", "sat", "out"] as const).map((k) => (
            <div key={k}><label className="label">{k === "min" ? "Mínima" : k === "sat" ? "Satisfactoria" : "Sobresaliente"}</label><input type="number" step="any" className="input" value={t[k]} disabled={resp === "contributor" && !!ownerItem} onChange={(e) => setT({ ...t, [k]: Number(e.target.value) })} /></div>
          ))}
        </div>
        {resp === "contributor" && ownerItem && <p className="text-xs text-slate-400 mt-2">Las metas se heredan del {RESP.owner.code}.</p>}
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={!es} onClick={save}>Guardar</button></div>
      </div>
    </div>
  );
}

export { STATUS };
