"use client";
/**
 * «Encontramos una carrera guardada en este navegador» (adenda v3.2 §3.2).
 * Nada se sube ni se borra sin que el jugador elija. Textos exactos de la adenda.
 */
import { useState } from "react";
import clsx from "clsx";
import { Building2, Cloud, Laptop } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { helpMailto, type CareerSummary } from "@/lib/ceo/import";
import type { ImportFlow } from "./CeoProvider";

const ERR: Record<string, string> = {
  red: "No pudimos conectar. Tu carrera sigue guardada en este navegador; vuelve a intentarlo.",
  nube_ocupada: "Tu cuenta ya tiene una carrera. Recarga la página para ver las dos y elegir.",
  sin_respaldo: "Por ahora no podemos reemplazar una carrera que ya está en tu cuenta. Escríbenos y te ayudamos.",
  no_guardado: "No se pudo guardar. Tu carrera sigue en este navegador; vuelve a intentarlo.",
};
const errText = (e: string) => ERR[e] ?? "Esta carrera no se pudo validar. Sigue guardada en este navegador; escríbenos y la revisamos contigo.";

export const fmtDate = (t: number) => (t > 0 ? new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(new Date(t)) : "sin fecha");

function Summary({ title, Icon, s, tone }: { title: string; Icon: typeof Cloud; s: CareerSummary; tone: "indigo" | "slate" }) {
  return (
    <div className={clsx("rounded-2xl border p-4 text-sm", tone === "indigo" ? "border-indigo/30 bg-indigo-soft/40" : "border-slate-200 bg-white")}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Icon size={14} /> {title}</div>
      <div className="mt-2 flex items-center gap-2 font-semibold text-ink"><Building2 size={15} className="text-slate-400" /> {s.company}</div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-slate-600">
        <dt className="text-slate-400">XP</dt><dd className="text-right tabular-nums font-medium text-ink">{s.xp}</dd>
        <dt className="text-slate-400">Etapa</dt><dd className="text-right">{s.stage}</dd>
        <dt className="text-slate-400">Decisiones</dt><dd className="text-right tabular-nums">{s.decisions}</dd>
        <dt className="text-slate-400">Empresas cerradas</dt><dd className="text-right tabular-nums">{s.companiesClosed}</dd>
        <dt className="text-slate-400">Última actividad</dt><dd className="text-right">{fmtDate(s.lastActivity)}</dd>
      </dl>
    </div>
  );
}

export function ImportPrompt({ flow }: { flow: ImportFlow }) {
  const { plan, busy, error } = flow;
  const [review, setReview] = useState(false);
  const conflict = plan.kind === "conflict";
  return (
    <main className="min-h-screen bg-canvas px-5 py-10 grid place-items-center">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2"><Logo height={24} /><span className="chip bg-ink text-white text-[10px] tracking-wider">CEO</span></div>
        <section className="card mt-6 p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-ink">Encontramos una carrera guardada en este navegador</h1>
          <p className="mt-2 text-sm text-slate-500">
            {conflict
              ? "Tu cuenta ya tiene otra carrera. No vamos a juntar ni a reemplazar nada sin que lo elijas."
              : "Puedes traerla a tu cuenta para seguirla en cualquier dispositivo, o empezar de nuevo. No se borra nada hasta que la importación termine bien."}
          </p>

          <div className={clsx("mt-5 grid gap-3", conflict && "sm:grid-cols-2")}>
            {conflict && <Summary title="En tu cuenta" Icon={Cloud} s={plan.cloud} tone="indigo" />}
            <Summary title="En este navegador" Icon={Laptop} s={plan.local} tone="slate" />
          </div>

          {error && <p role="alert" className="mt-4 rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{errText(error)}</p>}

          {!conflict && (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={flow.importLocal} disabled={busy} className="btn-primary flex-1 justify-center">{busy ? "Importando…" : "Importar mi progreso"}</button>
              <button type="button" onClick={flow.dismiss} disabled={busy} className="btn flex-1 justify-center border border-slate-200 text-slate-600 hover:text-ink">Empezar desde cero</button>
            </div>
          )}

          {conflict && !review && (
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" onClick={flow.dismiss} disabled={busy} className="btn-primary justify-center">Conservar mi carrera en la nube</button>
              <button type="button" onClick={() => setReview(true)} disabled={busy} className="btn justify-center border border-slate-200 text-slate-600 hover:text-ink">Revisar el progreso local</button>
              <a href={helpMailto(plan.local, plan.cloud)} className="btn justify-center text-indigo">Solicitar ayuda para fusionar</a>
            </div>
          )}

          {conflict && review && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p>Si usas la carrera de este navegador, la de tu cuenta se guarda como respaldo y podemos recuperarla si nos escribes. Las dos no se suman.</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={flow.importLocal} disabled={busy} className="btn-primary flex-1 justify-center">{busy ? "Importando…" : "Usar la de este navegador"}</button>
                <button type="button" onClick={() => setReview(false)} disabled={busy} className="btn flex-1 justify-center border border-slate-200 text-slate-600 hover:text-ink">Volver</button>
              </div>
            </div>
          )}

          <p className="mt-6 text-xs text-slate-400">El progreso que traigas se marca como anterior a la nueva versión: conservas tu XP y tus empresas, pero no cuenta como ventaja en los rankings nuevos.</p>
        </section>
      </div>
    </main>
  );
}
