"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, Bell, Building2, Clock, Mail, MessageCircle, Sparkles, Zap } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { COMPANY, CAST, ORG } from "@/lib/ceo/cast";
import { SEASON } from "@/lib/ceo/cases";
import { useCeo } from "./CeoProvider";
import { Avatar } from "./ui";

/** Tres pasos: nombramiento → tu empresa → cómo te contactamos. Sin videos ni tutoriales largos. */
export function Onboarding() {
  const c = useCeo();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ws, setWs] = useState(8);
  const [we, setWe] = useState(19);
  const [wa, setWa] = useState(true);
  const [intensivo, setIntensivo] = useState(false);

  useEffect(() => { if (c.ready && c.s.startedAt) router.replace("/ceo"); }, [c.ready, c.s.startedAt, router]);
  useEffect(() => { if (c.user?.email) setEmail((e) => e || c.user!.email); }, [c.user]);

  const go = () => {
    c.start({ name, email, phone, settings: { windowStart: ws, windowEnd: we, notifyEmail: !!email, notifyWhatsapp: wa && !!phone, intensivo } });
    try { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); } catch { /* ignore */ }
    router.replace("/ceo");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0F1130] via-[#1A1650] to-[#2B1F8A] text-white">
      <div aria-hidden className="pointer-events-none fixed -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-light/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none fixed -left-24 bottom-0 h-72 w-72 rounded-full bg-mint/15 blur-3xl" />
      <div className="relative max-w-2xl mx-auto px-5 py-8 sm:py-14">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Logo variant="light" height={26} /><span className="chip bg-white text-ink text-[10px] tracking-wider">CEO</span></span>
          <div className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className={clsx("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-mint" : i < step ? "w-3 bg-white/60" : "w-3 bg-white/20")} />)}</div>
        </div>

        {step === 0 && (
          <section key="s0" className="academy-in mt-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium"><Sparkles size={13} /> Temporada {SEASON.n} · {SEASON.name}</div>
            <h1 className="mt-5 text-3xl sm:text-4xl font-semibold leading-tight">Felicidades. A partir de mañana eres el Director General.</h1>
            <p className="mt-4 text-white/70 text-[15px] leading-relaxed">Aquí no vas a tomar un curso. Vas a dirigir una empresa. Durante el día te van a llegar correos, WhatsApps, reportes y juntas de tu equipo, de tus clientes y de tu consejo. Lo que decidas (y lo que dejes sin responder) tiene consecuencias.</p>
            <div className="mt-8 rounded-2xl bg-white text-ink p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center gap-3"><Avatar id="ramiro" size={44} /><div><div className="text-sm font-semibold">{CAST.ramiro.name}</div><div className="text-xs text-slate-500">{CAST.ramiro.role}</div></div></div>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">«Busqué durante un año a quien se sentara en mi silla. El consejo y yo te elegimos a ti. Antes de firmar tu nombramiento, dime cómo te llamas.»</p>
              <label className="label mt-5">Tu nombre</label>
              <input autoFocus className="input text-base" placeholder="Nombre y apellido" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim().length > 1 && setStep(1)} />
              <button disabled={name.trim().length < 2} onClick={() => setStep(1)} className="btn-primary w-full justify-center mt-4 py-3 text-base">Firmar mi nombramiento <ArrowRight size={16} /></button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section key="s1" className="academy-in mt-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-mint">Tu empresa</div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">{COMPANY.name}</h1>
            <p className="mt-3 text-white/70 text-[15px] leading-relaxed">{COMPANY.pitch}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {COMPANY.facts.map(([k, v]) => <div key={k} className="rounded-2xl bg-white/10 p-4"><div className="text-[11px] text-white/50">{k}</div><div className="mt-1 font-semibold">{v}</div></div>)}
            </div>
            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="text-xs font-semibold text-white/60 flex items-center gap-1.5"><Building2 size={13} /> Quién te va a escribir</div>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {ORG.flatMap((o) => [o.lead, ...o.team]).concat(["paty", "roberto", "sofia"]).map((id) => (
                  <div key={id} className="flex items-center gap-2.5"><Avatar id={id} size={34} /><div className="min-w-0"><div className="text-sm font-medium truncate">{CAST[id].name}</div><div className="text-[11px] text-white/50 truncate">{CAST[id].role}</div></div></div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-3"><button onClick={() => setStep(0)} className="btn text-white/70 hover:text-white">Atrás</button><button onClick={() => setStep(2)} className="btn bg-white text-ink hover:bg-white/90 flex-1 justify-center py-3 text-base font-semibold">Entendido <ArrowRight size={16} /></button></div>
          </section>
        )}

        {step === 2 && (
          <section key="s2" className="academy-in mt-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-mint">Antes de que suene tu teléfono</div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">¿Dónde te encuentra tu equipo?</h1>
            <p className="mt-3 text-white/70 text-[15px]">Cada día te llegan de 2 a 4 asuntos a horas distintas. Casi todos tienen tiempo límite: como en la vida real, si no respondes, alguien decide por ti.</p>
            <div className="mt-6 rounded-2xl bg-white text-ink p-5 sm:p-6 space-y-4">
              <div><label className="label flex items-center gap-1.5"><Mail size={12} /> Correo</label><input className="input" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div>
                <label className="label flex items-center gap-1.5"><MessageCircle size={12} /> WhatsApp (opcional)</label>
                <input className="input" type="tel" placeholder="+52 81 1234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <label className="mt-2 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={wa} onChange={(e) => setWa(e.target.checked)} className="accent-indigo" /> Que mi equipo también me escriba por WhatsApp</label>
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Clock size={12} /> Horario en que te pueden escribir</label>
                <div className="flex items-center gap-2">
                  <select className="input" value={ws} onChange={(e) => setWs(+e.target.value)}>{Array.from({ length: 12 }, (_, i) => i + 6).map((h) => <option key={h} value={h}>{h}:00</option>)}</select>
                  <span className="text-slate-400 text-sm">a</span>
                  <select className="input" value={we} onChange={(e) => setWe(+e.target.value)}>{Array.from({ length: 12 }, (_, i) => i + 12).filter((h) => h > ws + 1).map((h) => <option key={h} value={h}>{h}:00</option>)}</select>
                </div>
              </div>
              <button type="button" onClick={() => setIntensivo((v) => !v)} className={clsx("w-full text-left rounded-xl border p-3 flex gap-3 transition-colors", intensivo ? "border-indigo bg-indigo-soft/60" : "border-slate-200 hover:bg-slate-50")}>
                <Zap size={18} className={intensivo ? "text-indigo" : "text-slate-400"} />
                <span><span className="text-sm font-medium block">Modo intensivo</span><span className="text-xs text-slate-500">Todos los asuntos del día llegan juntos al inicio de tu horario. Para quien prefiere jugar en un solo rato.</span></span>
              </button>
              <button onClick={go} className="btn-primary w-full justify-center py-3 text-base"><Bell size={16} /> Empezar mi primer día</button>
              <p className="text-[11px] text-slate-400 text-center">Tu primer mensaje llega en unos segundos.</p>
            </div>
            <button onClick={() => setStep(1)} className="mt-4 btn text-white/70 hover:text-white">Atrás</button>
          </section>
        )}
      </div>
    </main>
  );
}
