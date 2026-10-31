"use client";
import clsx from "clsx";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { STAGES, type JourneyView, type Requirement } from "@/lib/ceo/journey";
import { COMPETENCY_IDS, competencyById, type Mastery } from "@/lib/ceo/mastery";

/** Pista de las 6 etapas del Executive Journey. */
export function StageTrack({ stage, dark, compact }: { stage: number; dark?: boolean; compact?: boolean }) {
  const nodes = STAGES.map((s) => s.name);
  return (
    <ol className="flex items-start" aria-label="Etapas del Executive Journey">
      {nodes.map((name, i) => {
        const done = i < stage, now = i === stage, last = i === nodes.length - 1;
        return (
          <li key={name} className="relative flex-1 flex flex-col items-center text-center min-w-0">
            {!last && <span aria-hidden className={clsx("absolute top-[11px] left-1/2 w-full h-0.5", done ? (dark ? "bg-white/70" : "bg-indigo") : dark ? "bg-white/15" : "bg-indigo-soft")} />}
            <span className={clsx("relative z-10 h-6 w-6 rounded-full grid place-items-center text-[10px] font-semibold",
              done ? (dark ? "bg-white text-ink" : "bg-indigo text-white")
                : now ? (dark ? "bg-white text-ink ring-4 ring-white/20" : "bg-indigo text-white ring-4 ring-indigo-soft")
                  : dark ? "bg-white/10 text-white/50" : "bg-slate-100 text-slate-400")}>
              {done ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            {!compact && <span className={clsx("mt-2 px-1 text-[10px] leading-tight", now ? (dark ? "text-white font-semibold" : "text-ink font-semibold") : dark ? "text-white/50" : "text-slate-400")}>{name}</span>}
          </li>
        );
      })}
    </ol>
  );
}

/** Tarjeta de un requisito del siguiente nombramiento. */
export function RequirementTile({ r, m, dark }: { r: Requirement; m: Mastery; dark?: boolean }) {
  const pct = Math.max(0, Math.min(100, Math.round((r.have / Math.max(1, r.need)) * 100)));
  const hint = r.ok ? "Cumplido." : r.id === "board" ? "Tres momentos ante el consejo, unos 10 minutos." : r.missing?.length ? `Practica ${r.missing.map((c) => m[c].name.toLowerCase()).join(", ")}.` : r.group === "constancia" ? "Juega y estudia cada día." : "Sigue dirigiendo.";
  return (
    <div className={clsx("rounded-2xl p-3.5", dark ? "bg-white/10" : "border border-slate-100")}>
      <div className={clsx("flex items-center justify-between gap-2 text-[11px]", dark ? "text-white/60" : "text-slate-500")}>
        <span className="truncate">{r.label}</span>
        {r.ok && <Check size={13} strokeWidth={3} className={dark ? "text-mint" : "text-mint"} />}
      </div>
      <div className={clsx("mt-1 text-lg font-semibold tabular-nums", dark ? "text-white" : "text-ink")}>{r.have}<span className={clsx("text-xs font-normal", dark ? "text-white/40" : "text-slate-400")}> / {r.need}</span></div>
      <div className={clsx("mt-2 h-1.5 rounded-full overflow-hidden", dark ? "bg-white/15" : "bg-indigo-soft/70")}>
        <div className={clsx("h-full rounded-full transition-all duration-700", r.ok ? "bg-mint" : dark ? "bg-white/80" : "bg-gradient-to-r from-indigo-light to-indigo")} style={{ width: `${pct}%` }} />
      </div>
      <div className={clsx("mt-2 text-[11px]", dark ? "text-white/50" : "text-slate-400")}>{hint}</div>
      {r.href && !r.ok && (
        <Link href={r.href} className={clsx("mt-2 inline-flex items-center gap-1 text-xs font-semibold", dark ? "text-white hover:text-white/80" : "text-indigo hover:text-indigo/80")}>Ir a la junta <ArrowRight size={13} /></Link>
      )}
    </div>
  );
}

/** Las 8 competencias con valor, nivel y la marca de 40 (Competent). */
export function CompetencyBars({ m, focus }: { m: Mastery; focus?: string | null }) {
  return (
    <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {COMPETENCY_IDS.map((id) => {
        const x = m[id];
        return (
          <li key={id}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className={clsx("text-ink", focus === id && "font-semibold")}>{competencyById(id).name}{focus === id && <span className="ml-2 chip bg-indigo-soft text-indigo text-[10px]">Tu enfoque</span>}</span>
              <span className="text-xs text-slate-400 tabular-nums"><b className="text-ink font-semibold">{x.value}</b> · {x.level.name}</span>
            </div>
            <div className="relative mt-1.5 h-2 rounded-full bg-indigo-soft/70">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-light to-indigo transition-all duration-700" style={{ width: `${x.value}%` }} />
              <span title="Competent: 40" className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-ink/40" style={{ left: "40%" }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Pantalla de nombramiento: carta del Consejo. */
export function AppointmentModal({ stage, rows, onClose }: { stage: string; rows: { label: string; value: string }[]; onClose: () => void }) {
  const date = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const share = async () => {
    const text = `Hoy recibí mi nombramiento como ${stage} en mêtis CEO.`;
    try {
      if (navigator.share) await navigator.share({ title: "mêtis CEO", text, url: "https://www.metis.ceo" });
      else { await navigator.clipboard.writeText(`${text} https://www.metis.ceo`); window.alert("Texto copiado. Pégalo donde quieras compartirlo."); }
    } catch { /* cancelado */ }
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Nombramiento" className="fixed inset-0 z-50 grid place-items-center bg-[#141735]/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ceo-rise">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] px-7 pt-8 pb-7 text-white">
          <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-light/30 blur-3xl" />
          <div className="relative">
            <div className="text-xs text-white/60">Nombramiento del Consejo</div>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">Felicidades. A partir de hoy eres {stage}.</h2>
          </div>
        </div>
        <div className="px-7 py-6">
          <ul className="divide-y divide-slate-100 text-sm">
            {rows.map((r) => <li key={r.label} className="flex justify-between gap-4 py-2.5"><span className="text-slate-500">{r.label}</span><span className="font-medium text-ink text-right">{r.value}</span></li>)}
          </ul>
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="font-semibold text-ink text-sm">Ramiro Garza</div>
            <div className="text-xs text-slate-400">Presidente del Consejo · {date}</div>
          </div>
          <div className="mt-6 flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-xl bg-indigo px-5 py-3 text-sm font-semibold text-white hover:bg-indigo/90">Aceptar</button>
            <button onClick={share} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-ink hover:bg-slate-50">Compartir</button>
          </div>
        </div>
      </div>
    </div>
  );
}
