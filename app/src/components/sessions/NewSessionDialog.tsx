"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { newId, useMetis } from "@/lib/store";
import type { Session, SessionKind } from "@/lib/domain/types";
import { isoDate, suggestDate, wtmPeriod } from "@/lib/sessions/logic";

const toLocalInput = (d: Date) => `${isoDate(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export function NewSessionDialog({ open, onClose, onCreated, leaderId, editing }: {
  open: boolean; onClose: () => void; onCreated?: (s: Session) => void; leaderId: string; editing?: Session;
}) {
  const s = useMetis();
  const [kind, setKind] = useState<SessionKind>("wtw");
  const [when, setWhen] = useState("");
  const [location, setLocation] = useState("");
  const [repeat, setRepeat] = useState(4);

  useEffect(() => {
    if (!open) return;
    if (editing) { setKind(editing.kind); setWhen(toLocalInput(new Date(editing.scheduledAt))); setLocation(editing.location ?? ""); return; }
    const last = [...s.sessions].filter((x) => x.leaderId === leaderId).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0];
    setKind("wtw");
    setWhen(toLocalInput(suggestDate("wtw", new Date(), last ? new Date(last.scheduledAt).getHours() || 9 : 9)));
    setLocation(last?.location ?? "");
    setRepeat(4);
  }, [open, editing, leaderId, s.sessions]);

  const changeKind = (k: SessionKind) => {
    setKind(k);
    if (!editing) setWhen(toLocalInput(suggestDate(k, new Date(), k === "wtm" ? 11 : 9)));
  };

  if (!open) return null;
  const save = () => {
    if (!when) return;
    const first = new Date(when);
    const count = editing || kind === "wtm" ? 1 : repeat;
    let created: Session | undefined;
    for (let i = 0; i < count; i++) {
      const at = new Date(first.getTime() + i * 7 * 86_400_000);
      const p = kind === "wtm" ? wtmPeriod(at.toISOString()) : null;
      const x: Session = editing
        ? { ...editing, kind, scheduledAt: at.toISOString(), location: location.trim() || undefined, ...(p ? { periodYear: p.year, periodMonth: p.month } : {}) }
        : { id: newId(), kind, leaderId, scheduledAt: at.toISOString(), status: "scheduled", location: location.trim() || undefined, createdBy: s.currentUserId, focus: [], ...(p ? { periodYear: p.year, periodMonth: p.month } : {}) };
      s.upsertSession(x);
      if (i === 0) created = x;
    }
    if (created) onCreated?.(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="card academy-in w-full max-w-md p-6" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Agendar sesión">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editing ? "Editar sesión" : "Agendar sesión"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {([["wtw", "WTW · semanal", "Cómo cerró la semana y qué sigue"], ["wtm", "WTM · mensual", "Cierre de mes y enfoque del siguiente"]] as const).map(([k, t, d]) => (
            <button key={k} type="button" onClick={() => changeKind(k)}
              className={clsx("rounded-xl border p-3 text-left transition", kind === k ? "border-indigo bg-indigo-soft/60 ring-2 ring-indigo/20" : "border-slate-200 hover:bg-slate-50")}>
              <div className="text-sm font-semibold">{t}</div>
              <div className="mt-0.5 text-xs text-slate-500">{d}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          <div>
            <label className="label" htmlFor="ses-when">Fecha y hora</label>
            <input id="ses-when" type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="ses-loc">Lugar o liga (Teams, Meet, Zoom o sala)</label>
            <input id="ses-loc" className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej. Sala Saltillo + liga de Teams" />
          </div>
          {!editing && kind === "wtw" && (
            <div>
              <label className="label" htmlFor="ses-rep">Repetir cada semana</label>
              <select id="ses-rep" className="input" value={repeat} onChange={(e) => setRepeat(Number(e.target.value))}>
                <option value={1}>Solo esta sesión</option>
                <option value={4}>Las próximas 4 semanas</option>
                <option value={8}>Las próximas 8 semanas</option>
                <option value={12}>Las próximas 12 semanas</option>
              </select>
            </div>
          )}
        </div>
        <p className="mt-4 rounded-xl bg-canvas px-3 py-2 text-xs text-slate-500">
          Participa tu equipo natural: las personas que te reportan directo. METIS arma la presentación con sus indicadores y los compromisos pendientes.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={!when}>{editing ? "Guardar" : "Agendar"}</button>
        </div>
      </div>
    </div>
  );
}
