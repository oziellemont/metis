"use client";
/**
 * Abrir una empresa emergente siendo jugador actual (lanzamiento piloto del Growth Engine).
 * Mismos pasos que el onboarding (tipo → industria → nombre → carta), solo con «Empresa emergente».
 * Tu empresa actual se guarda completa y puedes volver a ella desde Mi empresa: nada se borra.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { IndustryStep, LetterStep, NameStep } from "./CompanySetup";
import { buildSetup, changeChoice, newCompanyId, type SetupSelection } from "@/lib/ceo/career/setup";
import { canOpenEmergente, packOf } from "@/lib/ceo/engine";
import { useCeo } from "./CeoProvider";

export function NewCompany() {
  const c = useCeo();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<SetupSelection>(() => changeChoice({}, "emergente"));
  const [err, setErr] = useState<string | null>(null);
  const current = c.s.companyProfile?.displayName ?? packOf(c.s).name;
  const allowed = c.growthOn && canOpenEmergente(c.s, c.now);

  const go = () => {
    const setup = buildSetup(sel, newCompanyId());
    if (!setup) { setStep(1); return; }
    if (c.openEmergente(setup)) router.replace("/ceo/empresa");
    else setErr("No se pudo abrir la empresa. Tu empresa actual sigue igual.");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0F1130] via-[#1A1650] to-[#2B1F8A] text-white" data-testid="nueva-empresa">
      <div className="relative mx-auto max-w-2xl px-5 py-8 sm:py-14">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Logo variant="light" height={26} /><span className="chip bg-white text-ink text-[10px] tracking-wider">CEO</span></span>
          <div className="flex gap-1.5">{[0, 1, 2, 3].map((i) => <span key={i} className={clsx("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-mint" : i < step ? "w-3 bg-white/60" : "w-3 bg-white/20")} />)}</div>
        </div>

        {!allowed && (
          <section className="mt-10 space-y-4">
            <h1 className="text-2xl font-semibold">Esta opción no está disponible ahora</h1>
            <p className="text-white/70 text-[15px]">{c.s.growth ? "Ya diriges una empresa emergente." : "La empresa emergente no está activa para tu cuenta en este momento."}</p>
            <Link href="/ceo/empresa" className="btn bg-white text-ink">Volver a Mi empresa</Link>
          </section>
        )}

        {allowed && step === 0 && (
          <section className="academy-in mt-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-mint">Empresa emergente</div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">Dirige una empresa pequeña que va a crecer</h1>
            <p className="mt-3 text-white/70 text-[15px] leading-relaxed">Una sucursal o una planta, pocas personas y caja justa. Cada contratación, apertura o contrato cambia la nómina, la capacidad y el flujo de efectivo. Disponible en Restaurantes y en Autopartes.</p>
            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5 flex gap-3">
              <ShieldCheck size={20} className="text-mint shrink-0 mt-0.5" />
              <div className="text-sm text-white/80 leading-relaxed">
                <p><b className="text-white">{current}</b> se guarda tal como está: decisiones, periodo, historial y avance. Mientras está guardada su reloj se detiene, así que nada vence.</p>
                <p className="mt-2">Tu XP, tu racha, tus lecciones y tu carrera siguen siendo tuyos. Puedes volver a {current} cuando quieras desde Mi empresa.</p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Link href="/ceo/empresa" className="btn text-white/70 hover:text-white">Cancelar</Link>
              <button onClick={() => setStep(1)} className="btn bg-white text-ink hover:bg-white/90 flex-1 justify-center py-3 text-base font-semibold">Elegir industria <ArrowRight size={16} /></button>
            </div>
          </section>
        )}
        {allowed && step === 1 && <IndustryStep sel={sel} setSel={setSel} onBack={() => setStep(0)} onNext={() => setStep(2)} />}
        {allowed && step === 2 && <NameStep sel={sel} setSel={setSel} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {allowed && step === 3 && <LetterStep sel={sel} name={c.s.name} onBack={() => setStep(2)} onNext={go} />}
        {err && <p className="mt-4 text-sm text-coral" role="alert">{err}</p>}
      </div>
    </main>
  );
}
