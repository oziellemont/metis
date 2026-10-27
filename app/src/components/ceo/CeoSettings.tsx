"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Cloud, Clock, FastForward, Mail, MessageCircle, RotateCcw, Save, Zap } from "lucide-react";
import { hasSupabase, supabaseBrowser } from "@/lib/supabase/client";
import { useCeo } from "./CeoProvider";

const TZS = ["America/Monterrey", "America/Mexico_City", "America/Cancun", "America/Tijuana", "America/Hermosillo", "America/Bogota", "America/Lima", "America/Santiago", "America/Argentina/Buenos_Aires", "Europe/Madrid"];

export function CeoSettings() {
  const c = useCeo();
  const router = useRouter();
  const st = c.s.settings;
  const [f, setF] = useState({ name: c.s.name, alias: c.s.alias, ...st });
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [perm, setPerm] = useState<string>("default");
  useEffect(() => { if (typeof Notification !== "undefined") setPerm(Notification.permission); }, []);
  useEffect(() => { setF({ name: c.s.name, alias: c.s.alias, ...c.s.settings }); }, [c.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setSaved(false); };
  const save = () => { c.updateSettings(f); setSaved(true); };
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const input = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/20";

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink">Ajustes</h1>

      <AccountCard />

      <section className="card p-5 sm:p-6 space-y-4">
        <h2 className="font-semibold text-ink">Tú</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-600">Nombre<input className={input} value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
          <label className="text-sm text-slate-600">Cómo apareces en el ranking<input className={input} value={f.alias} onChange={(e) => set("alias", e.target.value)} maxLength={24} /></label>
        </div>
      </section>

      <section className="card p-5 sm:p-6 space-y-4">
        <h2 className="font-semibold text-ink">Cómo te llegan los asuntos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-600"><span className="inline-flex items-center gap-1"><Mail size={14} /> Correo</span><input type="email" className={input} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="tu@correo.com" /></label>
          <label className="text-sm text-slate-600"><span className="inline-flex items-center gap-1"><MessageCircle size={14} /> WhatsApp</span><input type="tel" className={input} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+52 81 …" /></label>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-slate-700">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={f.notifyEmail} onChange={(e) => set("notifyEmail", e.target.checked)} className="accent-indigo h-4 w-4" /> Avisarme por correo</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={f.notifyWhatsapp} onChange={(e) => set("notifyWhatsapp", e.target.checked)} className="accent-indigo h-4 w-4" /> Avisarme por WhatsApp</label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm text-slate-600"><span className="inline-flex items-center gap-1"><Clock size={14} /> Desde</span>
            <select className={input} value={f.windowStart} onChange={(e) => set("windowStart", Number(e.target.value))}>{hours.map((h) => <option key={h} value={h}>{h}:00</option>)}</select></label>
          <label className="text-sm text-slate-600">Hasta
            <select className={input} value={f.windowEnd} onChange={(e) => set("windowEnd", Number(e.target.value))}>{hours.filter((h) => h > f.windowStart).map((h) => <option key={h} value={h}>{h}:00</option>)}</select></label>
          <label className="text-sm text-slate-600">Zona horaria
            <select className={input} value={f.tz} onChange={(e) => set("tz", e.target.value)}>{TZS.map((t) => <option key={t} value={t}>{t.split("/").pop()!.replace(/_/g, " ")}</option>)}</select></label>
        </div>
        <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
          <input type="checkbox" checked={f.intensivo} onChange={(e) => set("intensivo", e.target.checked)} className="accent-indigo h-4 w-4 mt-0.5" />
          <span><b className="inline-flex items-center gap-1 text-ink"><Zap size={14} /> Modo intensivo</b><br /><span className="text-slate-500">Todo lo del día te llega junto al inicio de tu horario, con 5 minutos entre mensaje y mensaje.</span></span>
        </label>
        {perm !== "granted" && typeof Notification !== "undefined" && (
          <button type="button" onClick={() => Notification.requestPermission().then(setPerm)} className="inline-flex items-center gap-2 text-sm text-indigo font-medium"><Bell size={15} /> Activar avisos en este navegador</button>
        )}
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} className="btn-primary inline-flex items-center gap-2"><Save size={15} /> Guardar</button>
          {saved && <span className="text-sm text-sob">Guardado ✓</span>}
          {c.synced && <span className="text-xs text-slate-400">Sincronizado con tu cuenta</span>}
        </div>
      </section>

      <section className="card p-5 sm:p-6 space-y-3">
        <h2 className="font-semibold text-ink">{c.testTools ? "Modo prueba" : "Reiniciar"}</h2>
        {c.testTools && (<>
        <p className="text-sm text-slate-500">Para recorrer la temporada sin esperar: adelanta el reloj hasta el siguiente mensaje.</p>
        <button type="button" onClick={c.skipNext} disabled={!c.nextArrival} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-40"><FastForward size={15} /> Adelantar el reloj</button>
        </>)}
        <div className="pt-3 border-t border-slate-100">
          {!confirm ? (
            <button type="button" onClick={() => setConfirm(true)} className="inline-flex items-center gap-2 text-sm text-coral font-medium"><RotateCcw size={15} /> Reiniciar mi temporada</button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-slate-600">Se borrarán tus decisiones, racha y avance. ¿Seguro?</span>
              <button type="button" onClick={() => { c.reset(); router.push("/ceo/empezar"); }} className="rounded-xl bg-coral px-4 py-2 font-semibold text-white">Sí, reiniciar</button>
              <button type="button" onClick={() => setConfirm(false)} className="text-slate-500">Cancelar</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/** Conectar cuenta (enlace mágico): guarda el avance en la nube, activa avisos y el ranking real. */
function AccountCard() {
  const c = useCeo();
  const [mail, setMail] = useState(c.s.settings.email);
  const [st, setSt] = useState<"idle" | "sending" | "sent" | "error">("idle");
  if (!hasSupabase) return null;
  if (c.user) return (
    <section className="card p-5 flex items-center gap-3 text-sm"><Cloud size={18} className="text-mint" /><span>Tu avance se guarda en tu cuenta <b>{c.user.email}</b>{c.synced ? " ✓" : "…"}</span></section>
  );
  const send = async () => {
    const sb = supabaseBrowser();
    if (!sb || !mail) return;
    setSt("sending");
    const { error } = await sb.auth.signInWithOtp({ email: mail, options: { emailRedirectTo: `${location.origin}/auth/callback?next=/ceo` } });
    setSt(error ? "error" : "sent");
  };
  return (
    <section className="card p-5 sm:p-6 space-y-3 border-indigo/30">
      <h2 className="font-semibold text-ink inline-flex items-center gap-2"><Cloud size={17} className="text-indigo" /> Guarda tu avance</h2>
      <p className="text-sm text-slate-500">Hoy tu empresa vive solo en este navegador. Conecta tu correo para no perderla, jugar en el celular y la compu, recibir los mensajes de tu equipo y aparecer en el ranking.</p>
      {st === "sent" ? <p className="text-sm text-sob">Listo: revisa tu correo y abre el enlace.</p> : (
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="email" value={mail} onChange={(e) => setMail(e.target.value)} placeholder="tu@correo.com" className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <button type="button" onClick={send} disabled={st === "sending"} className="btn-primary">{st === "sending" ? "Enviando…" : "Enviarme el enlace"}</button>
        </div>
      )}
      {st === "error" && <p className="text-xs text-coral">No se pudo enviar. Intenta de nuevo en un momento.</p>}
    </section>
  );
}
