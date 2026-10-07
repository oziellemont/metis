"use client";
import { SITE_URL } from "@/lib/site";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Bell, Mail, MessageCircle, Save, Eye, CheckCircle2, Send } from "lucide-react";
import { useMetis } from "@/lib/store";
import { Avatar, PageHeader } from "@/components/ui/primitives";
import { buildReminders, DEFAULT_REMINDERS, MONTHS_ES } from "@/lib/domain/reminders";
import type { ReminderSettings } from "@/lib/domain/types";

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function Notificaciones() {
  const s = useMetis();
  const [f, setF] = useState<ReminderSettings>(s.tenant.reminders ?? DEFAULT_REMINDERS);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const [test, setTest] = useState<{ busy?: boolean; ok?: boolean; msg?: string }>({});
  const sendTest = async () => {
    setTest({ busy: true });
    try {
      const r = await fetch("/api/email/prueba", { method: "POST" });
      const j = (await r.json()) as { ok: boolean; to?: string; error?: string };
      setTest(j.ok ? { ok: true, msg: `Listo: revisa ${j.to} (y la carpeta de spam).` } : { ok: false, msg: j.error ?? "No se pudo enviar." });
    } catch { setTest({ ok: false, msg: "No se pudo contactar al servidor." }); }
  };

  const toggleDay = (d: number) => setF({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort((a, b) => a - b) });

  // Vista previa: simula la corrida del cron el día 3 del mes siguiente al mes actual del demo (cierre de ese mes)
  const simulatedNow = useMemo(() => new Date(s.year, s.month, 3, f.hour), [s.year, s.month, f.hour]);
  const msgs = useMemo(() => buildReminders({
    tenantName: s.tenant.name, appUrl: typeof window !== "undefined" ? window.location.origin : SITE_URL,
    settings: f, users: s.users, elementScopes: s.elementScopes, elements: s.elements, results: s.results,
    scopeName: (id) => s.scopes.find((x) => x.id === id)?.name ?? "", now: simulatedNow,
  }), [f, s, simulatedNow]);

  return (
    <>
      <PageHeader
        title="Notificaciones y recordatorios"
        subtitle="Cada mes METIS avisa a todos los usuarios con datos pendientes para que cierren su mes. Tú decides los días, la hora y si el jefe recibe un resumen de su equipo."
        actions={<button className="btn-primary" onClick={() => { s.updateReminders(f); setSaved(true); setTimeout(() => setSaved(false), 2000); }}>{saved ? <><CheckCircle2 size={14} /> Guardado</> : <><Save size={14} /> Guardar</>}</button>}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div><h3 className="font-semibold flex items-center gap-2"><Bell size={16} className="text-indigo" /> Recordatorio de cierre de mes</h3><p className="text-xs text-slate-500 mt-0.5">Se envía sólo a quien tiene datos pendientes como Owner. Si ya cargó todo, no recibe nada.</p></div>
              <button type="button" onClick={() => setF({ ...f, enabled: !f.enabled })} className={clsx("relative h-6 w-11 rounded-full transition-colors", f.enabled ? "bg-mint" : "bg-slate-200")} aria-label="Activar recordatorios">
                <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", f.enabled ? "left-[22px]" : "left-0.5")} />
              </button>
            </div>
            <div className={clsx("mt-5 space-y-5", !f.enabled && "opacity-50 pointer-events-none")}>
              <div>
                <label className="label">Días del mes en que se envía</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => <button key={d} type="button" onClick={() => toggleDay(d)} className={clsx("h-8 w-8 rounded-lg text-xs font-medium border transition-colors", f.days.includes(d) ? "bg-indigo text-white border-indigo" : "bg-white text-slate-600 border-slate-200 hover:border-indigo/40")}>{d}</button>)}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Sugerido: <strong>25</strong> (preaviso "prepara tu cierre"), <strong>1</strong> y <strong>3</strong> (cierre del mes anterior). Del 1 al 15 el aviso se refiere al mes anterior; del 16 en adelante, al mes en curso.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="label">Hora local</label><select className="input" value={f.hour} onChange={(e) => setF({ ...f, hour: Number(e.target.value) })}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}</select></div>
                <div><label className="label">Zona horaria</label><select className="input" value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })}>{["America/Monterrey", "America/Mexico_City", "America/Tijuana", "America/Cancun", "America/Bogota", "America/Lima", "America/Santiago"].map((z) => <option key={z}>{z}</option>)}</select></div>
              </div>
              <div>
                <label className="label">Canales</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setF({ ...f, channels: { ...f.channels, email: !f.channels.email } })} className={clsx("chip border gap-1.5 py-1.5", f.channels.email ? "bg-indigo-soft text-indigo border-indigo/30" : "bg-white text-slate-500 border-slate-200")}><Mail size={12} /> Correo</button>
                  <button type="button" disabled className="chip border gap-1.5 py-1.5 bg-white text-slate-400 border-slate-200 cursor-not-allowed"><MessageCircle size={12} /> WhatsApp · próximamente</button>
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={f.escalateToManager} onChange={(e) => setF({ ...f, escalateToManager: e.target.checked })} />
                <span className="text-sm"><span className="font-medium">Resumen al jefe</span><br /><span className="text-xs text-slate-500">Cada jefe recibe un correo con los pendientes de su equipo, para empujar en la WTW.</span></span>
              </label>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold flex items-center gap-2"><Eye size={16} className="text-indigo" /> Vista previa · corrida del 3 de {MONTHS_ES[s.month % 12]} {s.month === 12 ? s.year + 1 : s.year}</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">Con los datos actuales del demo, esto es exactamente lo que saldría. Da clic en un correo para leerlo.</p>
            {msgs.length === 0 ? <div className="rounded-xl bg-mint-soft text-sob text-sm px-4 py-3">Nadie tiene pendientes: no se enviaría ningún correo. 🎉</div> : (
              <ul className="divide-y divide-slate-100">
                {msgs.map((m, i) => {
                  const u = s.users.find((x) => x.id === m.to.userId);
                  return (
                    <li key={i}>
                      <button type="button" onClick={() => setPreview(preview === i ? null : i)} className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-slate-50 rounded-lg px-2">
                        <Avatar initials={u?.initials ?? "?"} size="sm" />
                        <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{m.subject}</div><div className="text-xs text-slate-400 truncate">{m.to.email}</div></div>
                        <span className={clsx("chip", m.kind === "owner" ? "bg-indigo-soft text-indigo" : "bg-amber-soft text-amber")}>{m.kind === "owner" ? "Owner" : "Jefe"}</span>
                      </button>
                      {preview === i && <div className="mb-3 mx-2 rounded-xl border border-slate-200 bg-white overflow-hidden"><iframe title="preview" srcDoc={m.html} className="w-full h-[360px]" /></div>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <div className="space-y-4">
          {s.mode === "supabase" && (
            <div className="card p-5">
              <h3 className="font-semibold mb-1 flex items-center gap-2"><Send size={15} className="text-indigo" /> Correo de prueba</h3>
              <p className="text-xs text-slate-500">Te manda un correo a ti para confirmar que el envío funciona.</p>
              <button type="button" className="btn-ghost mt-3 w-full justify-center border border-slate-200" disabled={test.busy} onClick={sendTest}>{test.busy ? "Enviando…" : "Enviarme un correo de prueba"}</button>
              {test.msg && <p className={clsx("text-xs mt-2 rounded-lg px-3 py-2", test.ok ? "bg-mint-soft text-sob" : "bg-coral-soft text-coral")}>{test.msg}</p>}
            </div>
          )}
          <div className="card p-5">
            <h3 className="font-semibold mb-1">Cómo funciona</h3>
            <ol className="text-xs text-slate-500 space-y-1.5 list-decimal pl-4 mt-2">
              <li>Todos los días a la hora configurada, METIS revisa cada empresa.</li>
              <li>Si hoy es uno de los días elegidos, busca qué Owners tienen indicadores sin dato.</li>
              <li>Envía un correo por persona con la lista y un botón directo a <strong>Carga mensual</strong>.</li>
              <li>Si activaste el resumen, cada jefe recibe los pendientes de su equipo.</li>
              <li>Queda registro de cada envío (fecha, destinatario, estado).</li>
            </ol>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold mb-1">También en la hoja de ruta</h3>
            <ul className="text-xs text-slate-500 space-y-1 mt-2">
              <li>· Alerta cuando un KPI cae a rojo dos meses seguidos</li>
              <li>· Aviso al jefe cuando un scorecard espera su aprobación</li>
              <li>· Recordatorio de compromisos vencidos</li>
              <li>· WhatsApp y Microsoft Teams como canales</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
