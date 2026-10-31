"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Target, Bell, Cloud, LogOut, Clock, FastForward, Mail, MessageCircle, RotateCcw, Save, Volume2, Zap } from "lucide-react";
import { playChime, setSoundOn, soundOn } from "@/lib/ceo/celebrate";
import { ceoSignOut } from "@/lib/ceo/auth-client";
import { useCeo } from "./CeoProvider";
import clsx from "clsx";
import { DAILY_GOALS, DEFAULT_DAILY_GOAL, SESSION_MINUTES, weeklyProjectionText } from "@/lib/ceo/onboarding";
import { CadenceCard } from "./Cadence";
import { EPISODES } from "@/lib/ceo/episodes/catalog";

const TZS = ["America/Monterrey", "America/Mexico_City", "America/Cancun", "America/Tijuana", "America/Hermosillo", "America/Bogota", "America/Lima", "America/Santiago", "America/Argentina/Buenos_Aires", "Europe/Madrid"];

export function CeoSettings() {
  const c = useCeo();
  const router = useRouter();
  const st = c.s.settings;
  const [f, setF] = useState({ name: c.s.name, alias: c.s.alias, ...st });
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [perm, setPerm] = useState<string>("default");
  const [sound, setSound] = useState(true);
  useEffect(() => { setSound(soundOn()); }, []);
  const toggleSound = (on: boolean) => { setSound(on); setSoundOn(on); if (on) playChime("company"); };
  useEffect(() => { if (typeof Notification !== "undefined") setPerm(Notification.permission); }, []);
  useEffect(() => { setF({ name: c.s.name, alias: c.s.alias, ...c.s.settings }); }, [c.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setSaved(false); };
  const save = () => { c.updateSettings(f); setSaved(true); };
  const goal = f.dailyGoal ?? DEFAULT_DAILY_GOAL;
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
        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          <b className="inline-flex items-center gap-1 text-ink"><Target size={14} /> Meta diaria de decisiones</b>
          <div role="radiogroup" aria-label="Meta diaria" className="mt-3 flex flex-wrap gap-2">
            {DAILY_GOALS.map((g) => (
              <button key={g.value} type="button" role="radio" aria-checked={goal === g.value} onClick={() => set("dailyGoal", g.value)} className={clsx("rounded-full border px-3.5 py-1.5", goal === g.value ? "border-indigo bg-indigo-soft text-indigo font-medium" : "border-slate-200 text-slate-600 hover:bg-white")}>{g.label} · {g.value}</button>
            ))}
          </div>
          <p className="mt-2 text-slate-500">{weeklyProjectionText(goal)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-slate-600">
            <span className="text-xs">Tiempo por sesión:</span>
            {SESSION_MINUTES.map((m) => (
              <button key={m} type="button" aria-pressed={f.sessionMinutes === m} onClick={() => set("sessionMinutes", m)} className={clsx("rounded-full border px-3 py-1 text-xs", f.sessionMinutes === m ? "border-indigo bg-indigo-soft text-indigo font-medium" : "border-slate-200 hover:bg-white")}>{m} min</button>
            ))}
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
          <input type="checkbox" checked={sound} onChange={(e) => toggleSound(e.target.checked)} className="accent-indigo h-4 w-4 mt-0.5" />
          <span><b className="inline-flex items-center gap-1 text-ink"><Volume2 size={14} /> Sonido al lograr algo</b><br /><span className="text-slate-500">Un tono breve cuando recibes un nombramiento, apruebas una empresa, logras un cambio o terminas una lección. Se guarda en este dispositivo.</span></span>
        </label>
        {perm !== "granted" && typeof Notification !== "undefined" && (
          <button type="button" onClick={() => Notification.requestPermission().then(setPerm)} className="inline-flex items-center gap-2 text-sm text-indigo font-medium"><Bell size={15} /> Activar avisos en este navegador</button>
        )}
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} className="btn-primary inline-flex items-center gap-2"><Save size={15} /> Guardar</button>
          {saved && <span className="text-sm text-sob">Guardado.</span>}
          {c.synced && <span className="text-xs text-slate-400">Sincronizado con tu cuenta</span>}
        </div>
      </section>

      {c.cadence === "vacation_paused" ? (
        <section className="card p-5 sm:p-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="flex-1 min-w-0 text-slate-600">Tu carrera está en pausa. Puedes cambiar tus ajustes; nada corre hasta que reanudes.</span>
          <button type="button" onClick={c.resumeCareer} className="btn-primary">Reanudar ahora</button>
        </section>
      ) : <CadenceCard />}

      <section className="card p-5 sm:p-6 space-y-3">
        <h2 className="font-semibold text-ink">{c.testTools ? "Modo prueba" : "Reiniciar"}</h2>
        {c.testTools && (<>
        <p className="text-sm text-slate-500">Para recorrer la temporada sin esperar: adelanta el reloj hasta el siguiente mensaje.</p>
        <button type="button" onClick={c.skipNext} disabled={!c.nextArrival} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-40"><FastForward size={15} /> Adelantar el reloj</button>
        <div className="pt-3 border-t border-slate-100">
          <div className="text-sm font-medium text-ink">Casos ejecutivos</div>
          <p className="mt-0.5 text-xs text-slate-500">En temporadas nuevas de Botanas Cumbre llegan solos y cuentan (adelanta el reloj para que lleguen). En temporadas anteriores o en otras empresas se abren aquí como práctica, sin mover tu temporada.</p>
          <ul className="mt-2 space-y-2">
            {Object.values(EPISODES).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2">
                <Link href={`/ceo/episodio/${e.id}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50">Abrir {e.title}</Link>
                {c.s.episodes?.[e.id] && <button type="button" onClick={() => c.resetEpisode(e.id)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"><RotateCcw size={14} /> Reiniciar</button>}
              </li>
            ))}
          </ul>
          <Link href="/ceo/evaluacion-ia" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo hover:underline">Evaluación de la IA de los casos</Link>
        </div>
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

/** Tu cuenta: con qué correo entraste y salir. (Entrar ya es obligatorio para jugar: ver /entrar.) */
function AccountCard() {
  const c = useCeo();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!c.user) return (
    <section className="card p-5 flex flex-wrap items-center gap-3 text-sm">
      <Cloud size={18} className="text-indigo" />
      <span className="flex-1 min-w-0">Hoy tu empresa vive solo en este navegador. Crea tu cuenta para no perderla y seguirla en cualquier dispositivo.</span>
      <Link href="/entrar?next=/ceo/ajustes" className="btn-primary">Guardar mi avance</Link>
    </section>
  );
  const out = async () => { setBusy(true); await ceoSignOut(); router.replace("/entrar"); router.refresh(); };
  return (
    <section className="card p-5 flex flex-wrap items-center gap-3 text-sm">
      <Cloud size={18} className="text-mint" />
      <span className="flex-1 min-w-0">Tu avance se guarda en tu cuenta <b className="break-all">{c.user.email}</b>{c.synced ? "." : "…"}</span>
      <button type="button" onClick={out} disabled={busy} className="btn border border-slate-200 text-slate-600 hover:text-ink"><LogOut size={15} /> {busy ? "Saliendo…" : "Cerrar sesión"}</button>
    </section>
  );
}
