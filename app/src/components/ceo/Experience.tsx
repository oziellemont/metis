"use client";
/**
 * /ceo/experiencia: las cinco preguntas y el diagnóstico para quien ya tenía partida (V33).
 * No toca su avance: solo guarda perfil y diagnóstico. El diagnóstico se ofrece solo con menos de 10 decisiones.
 */
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { profileOf } from "@/lib/ceo/engine";
import { diagnosticOffered, type InitialDiagnostic, type ProfessionalProfile } from "@/lib/ceo/profile";
import { useCeo } from "./CeoProvider";
import { track } from "@/lib/ceo/events";
import { DiagnosticCases, DiagnosticOffer, ProfileQuestions, Segments, StartingPoint } from "./ProfileFlow";

export function Experience() {
  const c = useCeo();
  const router = useRouter();
  const decisions = profileOf(c.s, c.now).decisions;
  const canDiag = diagnosticOffered(decisions, c.s.diagnostic);
  const direct = useSearchParams().get("diagnostico") === "1" && canDiag && !!c.s.profile?.answeredAt;
  const [phase, setPhase] = useState<"q" | "offer" | "diag" | "start">(direct ? "offer" : "q");
  const [q, setQ] = useState(0);
  const [p, setP] = useState<ProfessionalProfile | undefined>(c.s.profile);
  const [d, setD] = useState<InitialDiagnostic | undefined>(c.s.diagnostic);
  const exit = () => router.replace("/ceo/perfil#experiencia");
  const saved = (np: ProfessionalProfile) => { track(c.s.profile?.answeredAt ? "perfil_editado" : "perfil_respondido", { secs: np.secs ?? 0, omitidas: np.skipped.length, fuente: np.source }); c.saveProfile(np); setP(np); setPhase(canDiag ? "offer" : "start"); };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0F1130] via-[#1A1650] to-[#2B1F8A] text-white">
      <div className="relative max-w-3xl mx-auto px-5 py-8 sm:py-14">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Logo variant="light" height={26} /><span className="chip bg-white text-ink text-[10px] tracking-wider">CEO</span></span>
          {phase === "q" ? <Segments total={5} at={q} /> : <button type="button" onClick={exit} className="text-xs text-white/60 hover:text-white">Volver a mi perfil</button>}
        </div>
        <div key={phase}>
          {phase === "q" && <ProfileQuestions initial={p} source={c.s.profile?.source ?? "aviso"} step={q} setStep={setQ} onBackFirst={exit} onLater={exit} onDone={saved} />}
          {phase === "offer" && <DiagnosticOffer onStart={() => setPhase("diag")} onLater={exit} later="Ahora no" />}
          {phase === "diag" && <DiagnosticCases onDone={(nd) => { track("diagnostico_hecho", { respuestas: nd.answers.length, fuente: "perfil" }); c.saveDiagnostic(nd); setD(nd); setPhase("start"); }} onSkip={() => { track("diagnostico_saltado", { fuente: "perfil" }); c.saveDiagnostic({ v: 1, set: "d1", answers: [], skippedAt: Date.now() }); exit(); }} />}
          {phase === "start" && <StartingPoint name={c.s.name} p={p} d={d} m={c.mastery} stage={c.journey.name} fresh={false} cta="Volver a mi empresa" onCta={() => router.replace("/ceo")} onEdit={() => { setQ(0); setPhase("q"); }} />}
        </div>
      </div>
    </main>
  );
}
