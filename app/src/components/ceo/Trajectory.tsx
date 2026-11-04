"use client";
import clsx from "clsx";
import { AlertTriangle, Flag, Milestone as MilestoneIcon, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { KPI_KEYS } from "@/lib/ceo/engine";
import { COMPANY_STAGES } from "@/lib/ceo/career/identity";
import type { MilestoneKind, Trajectory as T } from "@/lib/ceo/trajectory";
import { rel } from "./ui";

const TONE: Record<T["moment"]["tone"], string> = {
  solida: "bg-mint/20 text-mint",
  estable: "bg-white/15 text-white",
  tension: "bg-amber/20 text-amber",
  riesgo: "bg-coral/20 text-coral",
};
const TONE_LABEL: Record<T["moment"]["tone"], string> = { solida: "Sólida", estable: "Estable", tension: "Bajo tensión", riesgo: "En riesgo" };
const KIND_ICON: Record<MilestoneKind, typeof Flag> = { nombramiento: Flag, capitulo: MilestoneIcon, revision: AlertTriangle, recuperacion: RefreshCw, crisis: AlertTriangle, cambio: Sparkles };

/**
 * Trayectoria del mandato (Carrera). Todo sale de trajectoryOf: nombramiento, capítulo de la empresa, momento,
 * hitos, decisiones que marcaron la gestión, compromisos abiertos y evolución de la empresa.
 * No muestra XP, racha ni competencias: eso vive en Perfil (Mi liderazgo y Constancia).
 */
export function Trajectory({ t, short, now, kpiLabel }: { t: T; short: string; now: number; kpiLabel: Record<string, string> }) {
  return (
    <>
      <section data-testid="trayectoria-mandato" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-8 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div className="relative">
          <div className="text-xs text-white/60">Tu mandato{t.appointment.since ? ` · desde ${new Date(t.appointment.since).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}` : ""}</div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight">{t.appointment.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
            {t.active && <span className="chip bg-white/10 text-white">Mes {t.month}</span>}
            {t.active && <span className="chip bg-white/10 text-white">Capítulo: {t.chapter.label}</span>}
            <span className={clsx("chip", TONE[t.moment.tone])}>Empresa {TONE_LABEL[t.moment.tone].toLowerCase()}</span>
          </div>
          <p className="mt-4 text-sm text-white/80 max-w-2xl">{t.moment.text}</p>
          {t.active && <p className="mt-2 text-sm text-white/65 max-w-2xl"><b className="text-white/85">En este capítulo:</b> {t.chapter.focus}</p>}
          {t.mandate && (
            <div className="mt-5 rounded-2xl bg-white/[.08] border border-white/[.12] p-4">
              <div className="text-[11px] text-white/55">Prioridades del consejo este mes</div>
              <p className="mt-1 text-sm font-semibold">{t.mandate.text}</p>
              <ul className="mt-2 flex flex-wrap gap-2 text-[12px]">
                {t.mandate.objectives.map((o) => <li key={o.kpi} className={clsx("chip", o.ok ? "bg-mint/20 text-mint" : "bg-white/10 text-white/80")}>{o.label}: {o.value}</li>)}
              </ul>
            </div>
          )}
          {t.active && (
            <ol aria-label="Capítulos de la empresa" className="mt-6 flex flex-wrap gap-1.5 text-[11px]">
              {COMPANY_STAGES.map((st, i) => (
                <li key={st.id} className={clsx("rounded-full px-2.5 py-1", i === t.chapter.idx ? "bg-white text-ink font-semibold" : i < t.chapter.idx ? "bg-white/15 text-white/80" : "bg-white/[.06] text-white/45")}>{st.label}</li>
              ))}
            </ol>
          )}
          {t.active && t.chapter.next && <p className="mt-3 text-[12px] text-white/55 max-w-2xl">{t.chapter.next.text} Los capítulos describen el momento de {short}, no un rango tuyo.</p>}
        </div>
      </section>

      {t.active && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section data-testid="compromisos-abiertos" className="card p-5 sm:p-6">
            <h2 className="font-semibold text-ink">Compromisos y consecuencias abiertas</h2>
            {t.open.length === 0
              ? <p className="mt-2 text-sm text-slate-500">No hay nada abierto ahora mismo. Lo que llegue aparecerá aquí y en tu bandeja.</p>
              : <ul className="mt-3 space-y-2">
                  {t.open.slice(0, 6).map((o) => (
                    <li key={o.item} className="rounded-xl border border-slate-100 px-3.5 py-2.5">
                      <div className="flex items-center gap-2"><span className={clsx("chip text-[10px]", o.kind === "consecuencia" ? "bg-amber-soft text-amber" : o.kind === "reporte" ? "bg-indigo-soft text-indigo" : "bg-slate-100 text-slate-600")}>{o.kind === "consecuencia" ? "Consecuencia" : o.kind === "reporte" ? "Reporte" : "Decisión"}</span><span className="text-sm font-medium text-ink truncate">{o.subject}</span></div>
                      <div className="mt-0.5 text-xs text-slate-500">{o.text}</div>
                    </li>
                  ))}
                </ul>}
          </section>

          <section data-testid="hitos-mandato" className="card p-5 sm:p-6">
            <h2 className="font-semibold text-ink">Hitos de tu gestión</h2>
            <ol className="mt-3 space-y-2.5">
              {[...t.milestones].reverse().slice(0, 8).map((m, i) => {
                const Icon = KIND_ICON[m.kind];
                return (
                  <li key={`${m.kind}-${m.at}-${i}`} className="flex gap-3">
                    <span className={clsx("mt-0.5 h-7 w-7 shrink-0 rounded-lg grid place-items-center", m.kind === "revision" || m.kind === "crisis" ? "bg-coral-soft text-coral" : m.kind === "recuperacion" || m.kind === "cambio" ? "bg-mint-soft text-sob" : "bg-indigo-soft text-indigo")}><Icon size={14} /></span>
                    <div className="min-w-0"><div className="text-sm font-medium text-ink">{m.title}</div><div className="text-xs text-slate-500">{m.text}</div></div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      )}

      {t.marked.length > 0 && (
        <section data-testid="decisiones-marcaron" className="card p-5 sm:p-6">
          <h2 className="font-semibold text-ink">Decisiones que marcaron este mes</h2>
          <p className="mt-1 text-xs text-slate-500">Las que más movieron a la empresa, cruzaron una línea o detonaron consecuencias.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {t.marked.map((d) => (
              <li key={d.item} className="rounded-xl border border-slate-100 px-3.5 py-2.5">
                <div className="text-sm font-medium text-ink">{d.subject}</div>
                <div className="mt-0.5 text-xs text-slate-600"><b>Elegiste:</b> {d.choice}</div>
                <div className="mt-0.5 text-xs text-slate-500">{d.outcome}</div>
                <div className="mt-1 text-[10px] text-slate-400">{rel(d.at, now)}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {t.active && t.evolution.length > 0 && (
        <section data-testid="evolucion-empresa" className="card p-5 sm:p-6">
          <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-indigo" /><h2 className="font-semibold text-ink">Cómo ha evolucionado {short}</h2></div>
          <p className="mt-1 text-xs text-slate-500">Indicadores de la empresa al cierre de cada mes. Describen al negocio, no miden tu competencia.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs tabular-nums">
              <thead><tr className="text-slate-400"><th className="text-left font-medium py-1 pr-3">Mes</th><th className="text-right font-medium px-2">Salud</th>{KPI_KEYS.map((k) => <th key={k} className="text-right font-medium px-2">{kpiLabel[k] ?? k}</th>)}</tr></thead>
              <tbody>
                {t.evolution.map((e) => (
                  <tr key={e.period} className="border-t border-slate-100 text-ink"><td className="py-1.5 pr-3">{e.period}</td><td className="text-right px-2 font-semibold">{e.health}</td>{KPI_KEYS.map((k) => <td key={k} className="text-right px-2">{e.kpis[k]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
