"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, Bell, Check, Clock, Mail, Zap } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { companyById } from "@/lib/ceo/companies";
import { useCeo } from "./CeoProvider";
import { track } from "@/lib/ceo/events";
import { DiagnosticCases, DiagnosticOffer, ProfileQuestions, StartingPoint } from "./ProfileFlow";
import { TopicsPicker } from "./TopicsPicker";
import { DEFAULT_PRACTICE_DAYS, PRACTICE_DAYS, type InitialDiagnostic, type PracticeDays, type ProfessionalProfile } from "@/lib/ceo/profile";
import { newState } from "@/lib/ceo/engine";
import { masteryOf } from "@/lib/ceo/mastery";
import { DAILY_GOALS, DEFAULT_DAILY_GOAL, GOAL_TITLE, PROJECTION_SUBTITLE, SESSION_MINUTES, weeklyProjection, weeklyProjectionText, type DailyDecisionGoal, type SessionMinutes } from "@/lib/ceo/onboarding";
import { caseCompanyFor, casePackId, entryProfile, topicsReady } from "@/lib/ceo/metis2/entrada";

/**
 * Registro corto de MÊTIS 2.0 (entrega 2.1). Siete pasos:
 * tu nombre → tu experiencia (5 preguntas, todas omitibles) → tus temas (al menos cinco) → tu ritmo (días por semana,
 * decisiones por día y minutos) → tres decisiones de diagnóstico (opcional) → tus avisos → tu primera semana.
 *
 * Quien se registra ya no crea ni nombra una empresa: sus primeros casos ocurren en una empresa que pertenece al caso,
 * elegida por la industria que declaró. La experiencia declarada y los temas solo ajustan recomendaciones y ayuda;
 * nunca dominio, niveles ni XP.
 */
export function Onboarding() {
  const c = useCeo();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const phone = ""; // WhatsApp en pausa: no se recopilan teléfonos.
  const [ws, setWs] = useState(8);
  const [we, setWe] = useState(19);
  const [intensivo, setIntensivo] = useState(false);
  const [goal, setGoal] = useState<DailyDecisionGoal>(DEFAULT_DAILY_GOAL);
  const [days, setDays] = useState<PracticeDays>(DEFAULT_PRACTICE_DAYS);
  const [minutes, setMinutes] = useState<SessionMinutes | undefined>();
  const [profile, setProfile] = useState<ProfessionalProfile | undefined>();
  const [topics, setTopics] = useState<string[]>([]);
  const [q, setQ] = useState(0);
  /** Dentro del paso del diagnóstico: oferta → 3 decisiones → tu punto de partida. */
  const [phase, setPhase] = useState<"offer" | "diag" | "start">("offer");
  const [diagnostic, setDiagnostic] = useState<InitialDiagnostic | undefined>();
  const zero = useMemo(() => masteryOf(newState()), []);
  const pk = companyById(casePackId(profile?.industry));
  const STEPS = 7;

  const afterProfile = (pf: ProfessionalProfile) => {
    setProfile(pf);
    track("perfil_respondido", { secs: pf.secs ?? 0, omitidas: pf.skipped.length, fuente: "onboarding" });
    setStep(2);
  };

  useEffect(() => { if (c.ready && c.s.startedAt) router.replace("/ceo"); }, [c.ready, c.s.startedAt, router]);
  useEffect(() => { if (c.user?.email) setEmail((e) => e || c.user!.email); }, [c.user]);

  const go = () => {
    if (!topicsReady(topics)) { setStep(2); return; }
    const { packId, setup } = caseCompanyFor(profile?.industry);
    c.start({
      name, email, phone, company: packId, ...(setup ? { setup } : {}),
      profile: entryProfile(profile, topics, days, Date.now()), diagnostic, tier: 0,
      settings: { windowStart: ws, windowEnd: we, notifyEmail: !!email, notifyWhatsapp: false, intensivo, dailyGoal: goal, ...(minutes ? { sessionMinutes: minutes } : {}) },
    });
    try { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); } catch { /* ignore */ }
    router.replace("/ceo");
  };

  const wide = step === 2 || (step === 4 && phase === "start");

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0F1130] via-[#1A1650] to-[#2B1F8A] text-white">
      <div aria-hidden className="pointer-events-none fixed -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-light/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none fixed -left-24 bottom-0 h-72 w-72 rounded-full bg-mint/15 blur-3xl" />
      <div className={clsx("relative mx-auto px-5 py-8 sm:py-14", wide ? "max-w-4xl" : "max-w-2xl")}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Logo variant="light" height={26} /></span>
          <div className="flex gap-1.5" aria-label={`Paso ${step + 1} de ${STEPS}`}>{Array.from({ length: STEPS }, (_, i) => i).map((i) => <span key={i} className={clsx("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-mint" : i < step ? "w-3 bg-white/60" : "w-3 bg-white/20")} />)}</div>
        </div>

        {step === 0 && (
          <section key="s0" data-testid="registro-nombre" className="academy-in mt-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">Tu práctica empieza hoy</div>
            <h1 className="mt-5 text-3xl sm:text-4xl font-semibold leading-tight">Aprende a dirigir decidiendo, unos minutos al día.</h1>
            <p className="mt-4 text-white/70 text-[15px] leading-relaxed">Aquí no vas a tomar un curso. Vas a resolver casos de dirección: te llegan correos, mensajes, reportes y juntas, y lo que decidas (y lo que dejes sin responder) tiene consecuencias. La empresa y sus personajes pertenecen a cada caso; tú no tienes que crear ni administrar nada. Solo cuéntanos quién eres y qué quieres practicar.</p>
            <div className="mt-8 rounded-2xl bg-white text-ink p-5 sm:p-6 shadow-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">Para empezar</div>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">Dinos cómo te llamas. Así te van a escribir los personajes de tus casos.</p>
              <label className="label mt-5" htmlFor="registro-nombre-campo">Tu nombre</label>
              <input id="registro-nombre-campo" autoFocus className="input text-base" placeholder="Nombre y apellido" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim().length > 1 && setStep(1)} />
              <button disabled={name.trim().length < 2} onClick={() => setStep(1)} className="btn-primary w-full justify-center mt-4 py-3 text-base">Continuar <ArrowRight size={16} /></button>
            </div>
          </section>
        )}

        {step === 1 && (
          <div key="s1" data-testid="registro-experiencia">
            <ProfileQuestions initial={profile} source="onboarding" step={q} setStep={setQ} onBackFirst={() => setStep(0)} onLater={() => setStep(2)} onDone={afterProfile} />
          </div>
        )}

        {step === 2 && (
          <section key="s2" data-testid="registro-temas" className="academy-in mt-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-mint">Tus temas</div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">¿Qué quieres practicar primero?</h1>
            <p className="mt-3 text-white/70 text-[15px] leading-relaxed">Elige al menos cinco temas. Con ellos señalamos en Academy las rutas que los trabajan y, en Mi progreso, sus academias. No te cierran ningún otro tema y puedes cambiarlos cuando quieras en Mi perfil.</p>
            <div className="mt-6"><TopicsPicker dark value={topics} onChange={setTopics} /></div>
            <div className="mt-6 flex gap-3"><button onClick={() => setStep(1)} className="btn text-white/70 hover:text-white">Atrás</button><button disabled={!topicsReady(topics)} onClick={() => setStep(3)} className="btn bg-white text-ink hover:bg-white/90 flex-1 justify-center py-3 text-base font-semibold disabled:opacity-50">Continuar <ArrowRight size={16} /></button></div>
          </section>
        )}

        {step === 3 && (
          <section key="s3" data-testid="registro-ritmo" className="academy-in mt-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-mint">Tu ritmo</div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">¿Cada cuánto quieres practicar?</h1>
            <p className="mt-3 text-white/70 text-[15px] leading-relaxed">Empieza con un ritmo que puedas sostener. Es una meta tuya: no hay castigo si un día no puedes, y la cambias cuando quieras.</p>
            <div role="radiogroup" aria-label="Días por semana" className="mt-6 grid gap-3 sm:grid-cols-3">
              {PRACTICE_DAYS.map((d) => (
                <button key={d.value} role="radio" aria-checked={days === d.value} onClick={() => setDays(d.value)} className={clsx("text-left rounded-2xl p-4 transition-all border-2", days === d.value ? "bg-white text-ink border-white shadow-2xl" : "bg-white/5 border-white/10 hover:bg-white/10")}>
                  <span className="flex items-center justify-between gap-2"><span className="font-semibold">{d.label}</span>{days === d.value && <span className="h-5 w-5 rounded-full bg-indigo text-white grid place-items-center shrink-0"><Check size={12} strokeWidth={3} /></span>}</span>
                  <span className={clsx("block text-sm mt-0.5", days === d.value ? "text-slate-600" : "text-white/60")}>{d.hint}</span>
                </button>
              ))}
            </div>
            <h2 className="mt-8 text-lg font-semibold">{GOAL_TITLE}</h2>
            <div role="radiogroup" aria-label="Meta diaria" className="mt-3 space-y-3">
              {DAILY_GOALS.map((g) => (
                <button key={g.value} role="radio" aria-checked={goal === g.value} onClick={() => setGoal(g.value)} className={clsx("w-full text-left rounded-2xl p-4 flex gap-4 items-center transition-all border-2", goal === g.value ? "bg-white text-ink border-white shadow-2xl" : "bg-white/5 border-white/10 hover:bg-white/10")}>
                  <span className={clsx("h-10 w-10 shrink-0 rounded-xl grid place-items-center text-lg font-semibold", goal === g.value ? "bg-indigo-soft text-indigo" : "bg-white/10 text-white")}>{g.value}</span>
                  <span className="flex-1 min-w-0">
                    <span className="flex flex-wrap items-center gap-2"><span className="font-semibold">{g.label}</span>{"recommended" in g && g.recommended && <span className={clsx("chip text-[10px]", goal === g.value ? "bg-indigo-soft text-indigo" : "bg-white/10 text-white/70")}>Recomendado</span>}</span>
                    <span className={clsx("block text-sm mt-0.5", goal === g.value ? "text-slate-600" : "text-white/60")}>{g.hint}</span>
                  </span>
                  {goal === g.value && <span className="h-6 w-6 rounded-full bg-indigo text-white grid place-items-center shrink-0"><Check size={14} strokeWidth={3} /></span>}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-xs font-semibold text-white/60 flex items-center gap-1.5"><Clock size={13} /> Minutos por sesión (opcional)</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {SESSION_MINUTES.map((m) => (
                  <button key={m} aria-pressed={minutes === m} onClick={() => setMinutes((x) => (x === m ? undefined : m))} className={clsx("rounded-full px-3.5 py-1.5 text-sm border transition-colors", minutes === m ? "bg-white text-ink border-white" : "border-white/15 text-white/70 hover:bg-white/10")}>{m} min</button>
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-3"><button onClick={() => setStep(2)} className="btn text-white/70 hover:text-white">Atrás</button><button onClick={() => setStep(4)} className="btn bg-white text-ink hover:bg-white/90 flex-1 justify-center py-3 text-base font-semibold">Continuar <ArrowRight size={16} /></button></div>
          </section>
        )}

        {step === 4 && (
          <div key={`d-${phase}`} data-testid="registro-diagnostico">
            {phase === "offer" && <DiagnosticOffer onStart={() => setPhase("diag")} onLater={() => setStep(5)} onBack={() => setStep(3)} later="Ahora no, continuar" />}
            {phase === "diag" && <DiagnosticCases onDone={(d) => { setDiagnostic(d); setPhase("start"); track("diagnostico_hecho", { respuestas: d.answers.length, fuente: "onboarding" }); }} onSkip={() => { track("diagnostico_saltado", { fuente: "onboarding" }); setDiagnostic({ v: 1, set: "d1", answers: [], skippedAt: Date.now() }); setPhase("offer"); setStep(5); }} />}
            {phase === "start" && <StartingPoint entry name={name} p={profile} d={diagnostic} m={zero} cta="Continuar" onCta={() => setStep(5)} onEdit={() => { setQ(0); setStep(1); }} />}
          </div>
        )}

        {step === 5 && (
          <section key="s5" data-testid="registro-avisos" className="academy-in mt-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-mint">Tus avisos</div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">¿A qué hora te pueden llegar los casos?</h1>
            <p className="mt-3 text-white/70 text-[15px]">Cada día te llegan de 2 a 4 asuntos a horas distintas; tu ritmo es cuántos te propones decidir. Casi todos tienen tiempo límite: como en la vida real, si no respondes, alguien decide por ti.</p>
            <div className="mt-6 rounded-2xl bg-white text-ink p-5 sm:p-6 space-y-4">
              <div><label className="label flex items-center gap-1.5" htmlFor="registro-correo"><Mail size={12} /> Correo</label><input id="registro-correo" className="input" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div>
                <div className="label flex items-center gap-1.5"><Clock size={12} /> Horario en que te pueden llegar</div>
                <div className="flex items-center gap-2">
                  <select aria-label="Desde" className="input" value={ws} onChange={(e) => setWs(+e.target.value)}>{Array.from({ length: 12 }, (_, i) => i + 6).map((h) => <option key={h} value={h}>{h}:00</option>)}</select>
                  <span className="text-slate-400 text-sm">a</span>
                  <select aria-label="Hasta" className="input" value={we} onChange={(e) => setWe(+e.target.value)}>{Array.from({ length: 12 }, (_, i) => i + 12).filter((h) => h > ws + 1).map((h) => <option key={h} value={h}>{h}:00</option>)}</select>
                </div>
              </div>
              <button type="button" aria-pressed={intensivo} onClick={() => setIntensivo((v) => !v)} className={clsx("w-full text-left rounded-xl border p-3 flex gap-3 transition-colors", intensivo ? "border-indigo bg-indigo-soft/60" : "border-slate-200 hover:bg-slate-50")}>
                <Zap size={18} className={intensivo ? "text-indigo" : "text-slate-400"} />
                <span><span className="text-sm font-medium block">Modo intensivo</span><span className="text-xs text-slate-500">Todos los asuntos del día llegan juntos al inicio de tu horario. Para quien prefiere practicar en un solo rato.</span></span>
              </button>
              <button onClick={() => setStep(6)} className="btn-primary w-full justify-center py-3 text-base">Continuar <ArrowRight size={16} /></button>
            </div>
            <button onClick={() => { setPhase(diagnostic?.finishedAt ? "start" : "offer"); setStep(4); }} className="mt-4 btn text-white/70 hover:text-white">Atrás</button>
          </section>
        )}

        {step === 6 && (
          <section key="s6" data-testid="registro-semana" className="academy-in mt-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-mint">Tu primera semana</div>
            <div className="mt-6 rounded-2xl bg-white text-ink p-6 sm:p-8 shadow-2xl text-center">
              <div aria-live="polite" className="text-6xl font-semibold text-indigo tabular-nums">{weeklyProjection(goal, days)}</div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-semibold leading-tight">{weeklyProjectionText(goal, days)}</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{PROJECTION_SUBTITLE}</p>
              <p data-testid="registro-empresa-del-caso" className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4 text-left text-sm leading-relaxed text-slate-600">Tus primeros casos ocurren en <b className="font-semibold text-ink">{pk.name}</b>, una empresa de {pk.industry.toLowerCase()}. En esos casos ocupas su Dirección General. La empresa pertenece al caso: no tienes que crearla ni administrarla.</p>
              <button onClick={go} className="btn-primary w-full justify-center py-3 text-base mt-6"><Bell size={16} /> Empezar</button>
              <p className="mt-2 text-[11px] text-slate-400">Tu primer mensaje llega en unos segundos. Puedes cambiar tu ritmo en Mi perfil y tus avisos en Ajustes.</p>
            </div>
            <button onClick={() => setStep(5)} className="mt-4 btn text-white/70 hover:text-white">Atrás</button>
          </section>
        )}
      </div>
    </main>
  );
}
