"use client";
/** Configuración → Notificaciones: activar las Revisiones Verticales automáticas (1 a 1). */
import { useMemo, useState } from "react";
import clsx from "clsx";
import { CalendarClock, CheckCircle2, Eye, Save, Users } from "lucide-react";
import { useMetis } from "@/lib/store";
import { DEFAULT_RV, RV_CADENCES, localParts, rvPairs, rvWhenLabel, zonedDate } from "@/lib/sessions/rv";
import { rvInviteEmail, rvReminderEmail } from "@/lib/sessions/rv-email";
import { SITE_URL } from "@/lib/site";
import type { RvSettings } from "@/lib/domain/types";

type PreviewKey = "invite" | "leader" | "participant" | null;

export function RvSettingsCard({ tz }: { tz: string }) {
  const s = useMetis();
  const [f, setF] = useState<RvSettings>({ ...DEFAULT_RV, ...(s.tenant.rv ?? {}) });
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<PreviewKey>(null);
  const pairs = useMemo(() => rvPairs(s.users), [s.users]);

  const sample = useMemo(() => {
    const p = pairs.find((x) => x.leaderId === s.currentUserId) ?? pairs[0];
    if (!p) return null;
    const leader = s.userOf(p.leaderId), part = s.userOf(p.participantId);
    const d = localParts(new Date(Date.now() + 3 * 864e5), tz);
    const at = zonedDate(d.y, d.m, d.d, 10, 30, tz);
    const base = {
      tenantName: s.tenant.name, appUrl: typeof window !== "undefined" ? window.location.origin : SITE_URL,
      sessionId: "ejemplo", whenLabel: rvWhenLabel(at, tz),
      leader: { name: leader.name, email: leader.email }, participant: { name: part.name, email: part.email },
    };
    return {
      invite: rvInviteEmail({ ...base, to: "participant", googleUrl: "#" }),
      leader: rvReminderEmail({ ...base, to: "leader", stage: "d3", attainment: 0.92, kpis: [], openCommitments: [{ title: "Ejemplo de compromiso abierto", late: false }] }),
      participant: rvReminderEmail({ ...base, to: "participant", stage: "d3", openCommitments: [] }),
    };
  }, [pairs, s, tz]);

  const save = () => { s.updateRv(f); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><CalendarClock size={16} className="text-indigo" /> Revisiones Verticales · 1 a 1</h3>
          <p className="text-xs text-slate-500 mt-0.5">mêtis agenda solo el 1 a 1 de cada jefe con cada uno de sus reportes directos, manda la invitación de calendario y recuerda a los dos hasta que la sesión se cierre.</p>
        </div>
        <button type="button" onClick={() => setF({ ...f, enabled: !f.enabled })} className={clsx("relative h-6 w-11 shrink-0 rounded-full transition-colors", f.enabled ? "bg-mint" : "bg-slate-200")} aria-label="Activar Revisiones Verticales">
          <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", f.enabled ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>

      <div className={clsx("mt-5 space-y-4", !f.enabled && "opacity-50 pointer-events-none")}>
        <div>
          <label className="label">Frecuencia</label>
          <div className="flex flex-wrap gap-2">
            {RV_CADENCES.map((c) => (
              <button key={c.weeks} type="button" onClick={() => setF({ ...f, cadenceWeeks: c.weeks })} className={clsx("chip border py-1.5", f.cadenceWeeks === c.weeks ? "bg-indigo-soft text-indigo border-indigo/30" : "bg-white text-slate-500 border-slate-200")}>{c.label}</button>
            ))}
          </div>
        </div>
        <ul className="text-xs text-slate-500 space-y-1.5 rounded-xl bg-slate-50 p-3">
          <li>· <strong>Horario:</strong> martes a jueves, entre 10:00 y 13:00, 30 minutos. Evita choques con otras sesiones del jefe y del colaborador.</li>
          <li>· <strong>Invitación:</strong> llega por correo con archivo de calendario; se agrega en Outlook o Google con un clic.</li>
          <li>· <strong>Recordatorios:</strong> 3 días antes, 1 día antes y el mismo día, al jefe y al colaborador. Si no se cierra, siguen diario (lunes a viernes).</li>
          <li>· <strong>Guía:</strong> el correo del jefe trae la guía 1 a 1 de 5 pasos y el scorecard del colaborador.</li>
          <li>· <strong>Reagendar:</strong> solo el jefe puede cambiar la fecha; la invitación se actualiza sola.</li>
        </ul>
        <div className="flex items-center gap-2 text-xs text-slate-500"><Users size={13} /> Hoy hay <strong className="text-ink">{pairs.length}</strong> parejas jefe–colaborador en el organigrama.</div>
      </div>

      {sample && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-slate-500"><Eye size={13} /> Ver correo:</span>
            {([["invite", "Invitación"], ["leader", "Recordatorio al jefe"], ["participant", "Recordatorio al colaborador"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setPreview(preview === k ? null : k)} className={clsx("chip border", preview === k ? "bg-indigo-soft text-indigo border-indigo/30" : "bg-white text-slate-500 border-slate-200")}>{l}</button>
            ))}
          </div>
          {preview && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-3 py-2 text-xs font-medium border-b border-slate-100">{sample[preview].subject}</div>
              <iframe title="Vista previa" srcDoc={sample[preview].html} className="w-full h-[420px]" />
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button className="btn-primary" onClick={save}>{saved ? <><CheckCircle2 size={14} /> Guardado</> : <><Save size={14} /> Guardar 1 a 1</>}</button>
      </div>
    </div>
  );
}
