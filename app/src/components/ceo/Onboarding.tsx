"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, Bell, Check, Clock, Mail, MessageCircle, Zap } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { COMPANIES, FIRST_COMPANY, companyById } from "@/lib/ceo/companies";
import { useCeo } from "./CeoProvider";
import { track } from "@/lib/ceo/events";
import { ArchetypeStep, IndustryStep, LetterStep, NameStep } from "./CompanySetup";
import { buildSetup, defaultArchetype, newCompanyId, previewPack, selectionForPack, type SetupSelection } from "@/lib/ceo/career/setup";
import { DiagnosticCases, DiagnosticOffer, ProfileQuestions, StartingPoint, TierChoice } from "./ProfileFlow";
import { companyForIndustry, suggestTier, type InitialDiagnostic, type ProfessionalProfile } from "@/lib/ceo/profile";
import { newState, rulesOf } from "@/lib/ceo/engine";
import { masteryOf } from "@/lib/ceo/mastery";
import { DAILY_GOALS, DEFAULT_DAILY_GOAL, GOAL_SUBTITLE, GOAL_TITLE, PROJECTION_SUBTITLE, SESSION_MINUTES, weeklyProjection, weeklyProjectionText, type DailyDecisionGoal, type SessionMinutes } from "@/lib/ceo/onboarding";

/**
 * Pasos: tu nombre → tu experiencia (5 preguntas, todas omitibles) → tu empresa (industria, tipo, nombre y carta de
 * nombramiento; carrera continua P0-B3) → tu meta diaria
 * → cómo te contactamos → tu primera semana (proyección 7/14/21 y «Empezar en …»). Meta y proyección: adenda v3.2 §4.
 * La experiencia declarada solo ajusta recomendaciones y ayuda; nunca dominio, etapa, XP ni nombramientos (V33).
 */
export function Onboarding() {
  const c = useCeo();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<SetupSelection>(() => { const s = selectionForPack(FIRST_COMPANY); return { ...s, archetype: defaultArchetype(s.sectorId, s.industryId) }; });
  const pk = previewPack(sel) ?? companyById(FIRST_COMPANY);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ws, setWs] = useState(8);
  const [we, setWe] = useState(19);
  const [wa, setWa] = useState(true);
  const [intensivo, setIntensivo] = useState(false);
  const [goal, setGoal] = useState<DailyDecisionGoal>(DEFAULT_DAILY_GOAL);
  const [minutes, setMinutes] = useState<SessionMinutes | undefined>();
  const [profile, setProfile] = useState<ProfessionalProfile | undefined>();
  const [q, setQ] = useState(0);
  /** Dentro del paso «Tu experiencia»: preguntas → oferta del diagnóstico → 3 decisiones → tu punto de partida. */
  const [phase, setPhase] = useState<"q" | "offer" | "diag" | "start">("q");
  const [diagnostic, setDiagnostic] = useState<InitialDiagnostic | undefined>();
  const [tier, setTier] = useState(0);
  const offered = suggestTier(profile);
  const zero = useMemo(() => masteryOf(newState()), []);
  const STEPS = 9;
  const toCompany = (pf?: ProfessionalProfile) => {
    const co = companyForIndustry(pf?.industry, COMPANIES.map((x) => x.id));
    // La experiencia declarada solo sugiere la industria, y solo si todavía no eligió nada distinto.
    if (co && !sel.displayName) { const s = selectionForPack(co); setSel((p) => ({ ...p, ...s, archetype: defaultArchetype(s.sectorId, s.industryId), specialty: undefined })); }
    setStep(2);
  };
  const afterProfile = (pf: ProfessionalProfile) => {
    setProfile(pf);
    track("perfil_respondido", { secs: pf.secs ?? 0, omitidas: pf.skipped.length, fuente: "onboarding" });
    setPhase(diagnostic?.finishedAt ? "start" : "offer");
  };

  useEffect(() => { if (c.ready && c.s.startedAt) router.replace("/ceo"); }, [c.ready, c.s.startedAt, router]);
  useEffect(() => { if (c.user?.email) setEmail((e) => e || c.user!.email); }, [c.user]);

  const go = () => {
    if (offered) track("exigencia_elegida", { tier: tier ? offered : 0 });
    const setup = buildSetup(sel, newCompanyId());
    if (!setup) { setStep(2); return; }
    c.start({ name, email, phone, company: pk.id, setup, profile, diagnostic, tier: offered ? tier : 0, settings: { windowStart: ws, windowEnd: we, notifyEmail: !!email, notifyWhatsapp: wa && !!phone, intensivo, dailyGoal: goal, ...(minutes ? { sessionMinutes: minutes } : {}) } });
    try { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); } catch { /* ignore */ }
    router.replace("/ceo");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0F1130] via-[#1A1650] to-[#2B1F8A] text-white">
      <div aria-hidden className="pointer-events-none fixed -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-light/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none fixed -left-24 bottom-0 h-72 w-72 rounded-full bg-mint/15 blur-3xl" />
      <div className={clsx("relative mx-auto px-5 py-8 sm:py-14", step === 1 && phase === "start" ? "max-w-4xl" : "max-w-2xl")}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Logo variant="light" height={26} /><span className="chip bg-white text-ink text-[10px] tracking-wider">CEO</span></span>
          <div className="flex gap-1.5">{Array.from({ length: STEPS }, (_, i) => i).map((i) => <span key={i} className={clsx("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-mint" : i < step ? "w-3 bg-white/60" : "w-3 bg-white/20")} />)}</div>
        </div>

        {step === 0 && (
          <section key="s0" className="academy-in mt-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">Tu carrera como CEO empieza hoy</div>
            <h1 className="mt-5 text-3xl sm:text-4xl font-semibold leading-tight">Felicidades. A partir de mañana eres Director General.</h1>
            <p className="mt-4 text-white/70 text-[15px] leading-relaxed">Aquí no vas a tomar un curso. Vas a dirigir una empresa. Durante el día te van a llegar correos, WhatsApps, reportes y juntas de tu equipo, de tus clientes y de tu consejo. Lo que decidas (y lo que dejes sin responder) tiene consecuencias. Tú eliges la industria, el tipo y el nombre de tu empresa. Es una sola, la diriges mes con mes, y cada periodo el consejo revisa cómo va.</p>
            <div className="mt-8 rounded-2xl bg-white text-ink p-5 sm:p-6 shadow-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">Tu nombramiento</div>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">Antes de firmar, dinos cómo te llamas. Así te van a escribir tu equipo, tus clientes y tu consejo.</p>
              <label className="label mt-5">Tu nombre</label>
              <input autoFocus className="input text-base" placeholder="Nombre y apellido" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim().length > 1 && setStep(1)} />
              <button disabled={name.trim().length < 2} onClick={() => setStep(1)} className="btn-primary w-full justify-center mt-4 py-3 text-base">Continuar <ArrowRight size={16} /></button>
            </div>
          </section>
        )}

        {step === 1 && (
          <div key={`p-${phase}`}>
            {phase === "q" && <ProfileQuestions initial={profile} source="onboarding" step={q} setStep={setQ} onBackFirst={() => setStep(0)} onLater={() => toCompany(profile)} onDone={afterProfile} />}
            {phase === "offer" && <DiagnosticOffer onStart={() => setPhase("diag")} onLater={() => toCompany(profile)} later="Ahora no, crear mi empresa" />}
            {phase === "diag" && <DiagnosticCases onDone={(d) => { setDiagnostic(d); setPhase("start"); track("diagnostico_hecho", { respuestas: d.answers.length, fuente: "onboarding" }); }} onSkip={() => { track("diagnostico_saltado", { fuente: "onboarding" }); setDiagnostic({ v: 1, set: "d1", answers: [], skippedAt: Date.now() }); toCompany(profile); }} />}
            {phase === "start" && <StartingPoint name={name} p={profile} d={diagnostic} m={zero} cta="Crear mi empresa" onCta={() => toCompany(profile)} onEdit={() => { setQ(0); setPhase("q"); }} />}
          </div>
        )}

        {step === 2 && <IndustryStep sel={sel} setSel={setSel} onBack={() => { setPhase(diagnostic ? "start" : "q"); setStep(1); }} onNext={() => setStep(3)} />}
        {step === 3 && <ArchetypeStep sel={sel} setSel={setSel} onBack={() => setStep(2)} onNext={() => setStep(4)} extra={offered > 0 ? <TierChoice tier={tier} setTier={setTier} offered={offered} names={[rulesOf(0).name, rulesOf(offered).name]} title="Exigencia de tu empresa" /> : null} />}
        {step === 4 && <NameStep sel={sel} setSel={setSel} onBack={() => setStep(3)} onNext={() => setStep(5)} />}
        {step === 5 && <LetterStep sel={sel} name={name} onBack={() => setStep(4)} onNext={() => setStep(6)} />}

        {step === 6 && (
          <section key="s6" className="academy-in mt-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-mint">Tu ritmo</div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">{GOAL_TITLE}</h1>
            <p className="mt-3 text-white/70 text-[15px] leading-relaxed">{GOAL_SUBTITLE}</p>
            <div role="radiogroup" aria-label="Meta diaria" className="mt-6 space-y-3">
              {DAILY_GOALS.map((g) => (
                <button key={g.value} role="radio" aria-checked={goal === g.value} onClick={() => setGoal(g.value)} className={clsx("w-full text-left rounded-2xl p-4 sm:p-5 flex gap-4 items-center transition-all border-2", goal === g.value ? "bg-white text-ink border-white shadow-2xl" : "bg-white/5 border-white/10 hover:bg-white/10")}>
                  <span className={clsx("h-11 w-11 shrink-0 rounded-xl grid place-items-center text-lg font-semibold", goal === g.value ? "bg-indigo-soft text-indigo" : "bg-white/10 text-white")}>{g.value}</span>
                  <span className="flex-1 min-w-0">
                    <span className="flex flex-wrap items-center gap-2"><span className="font-semibold">{g.label}</span>{"recommended" in g && g.recommended && <span className={clsx("chip text-[10px]", goal === g.value ? "bg-indigo-soft text-indigo" : "bg-white/10 text-white/70")}>Recomendado</span>}</span>
                    <span className={clsx("block text-sm mt-0.5", goal === g.value ? "text-slate-600" : "text-white/60")}>{g.hint}</span>
                  </span>
                  {goal === g.value && <span className="h-6 w-6 rounded-full bg-indigo text-white grid place-items-center shrink-0"><Check size={14} strokeWidth={3} /></span>}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-xs font-semibold text-white/60 flex items-center gap-1.5"><Clock size={13} /> Tiempo por sesión (opcional)</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {SESSION_MINUTES.map((m) => (
                  <button key={m} aria-pressed={minutes === m} onClick={() => setMinutes((x) => (x === m ? undefined : m))} className={clsx("rounded-full px-3.5 py-1.5 text-sm border transition-colors", minutes === m ? "bg-white text-ink border-white" : "border-white/15 text-white/70 hover:bg-white/10")}>{m} min</button>
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-3"><button onClick={() => setStep(5)} className="btn text-white/70 hover:text-white">Atrás</button><button onClick={() => setStep(7)} className="btn bg-white text-ink hover:bg-white/90 flex-1 justify-center py-3 text-base font-semibold">Continuar <ArrowRight size={16} /></button></div>
          </section>
        )}

        {step === 7 && (
          <section key="s7" className="academy-in mt-10">
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
              <button onClick={() => setStep(8)} className="btn-primary w-full justify-center py-3 text-base">Continuar <ArrowRight size={16} /></button>
            </div>
            <button onClick={() => setStep(6)} className="mt-4 btn text-white/70 hover:text-white">Atrás</button>
          </section>
        )}

        {step === 8 && (
          <section key="s8" className="academy-in mt-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-mint">Tu primera semana</div>
            <div className="mt-6 rounded-2xl bg-white text-ink p-6 sm:p-8 shadow-2xl text-center">
              <div aria-live="polite" className="text-6xl font-semibold text-indigo tabular-nums">{weeklyProjection(goal)}</div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-semibold leading-tight">{weeklyProjectionText(goal)}</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{PROJECTION_SUBTITLE}</p>
              <div role="radiogroup" aria-label="Meta diaria" className="mt-6 inline-flex rounded-full bg-slate-100 p-1">
                {DAILY_GOALS.map((g) => (
                  <button key={g.value} role="radio" aria-checked={goal === g.value} onClick={() => setGoal(g.value)} className={clsx("rounded-full px-4 py-1.5 text-sm transition-colors", goal === g.value ? "bg-white text-ink shadow font-medium" : "text-slate-500 hover:text-ink")}>{g.label}</button>
                ))}
              </div>
              <button onClick={go} className="btn-primary w-full justify-center py-3 text-base mt-6"><Bell size={16} /> Empezar en {pk.short}</button>
              <p className="mt-2 text-[11px] text-slate-400">Tu primer mensaje llega en unos segundos. Puedes cambiar tu meta en Ajustes.</p>
            </div>
            <button onClick={() => setStep(7)} className="mt-4 btn text-white/70 hover:text-white">Atrás</button>
          </section>
        )}
      </div>
    </main>
  );
}
