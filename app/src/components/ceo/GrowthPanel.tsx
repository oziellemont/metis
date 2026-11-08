"use client";
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, CircleAlert, History, Inbox, TrendingUp, Users } from "lucide-react";
import { growthDayOf } from "@/lib/ceo/engine";
import { growthAt, growthBridge, pendingGrowth } from "@/lib/ceo/growth/session";
import { milestonesOf, resultsOf, sitesOf, teamOf } from "@/lib/ceo/growth/view";
import { useCeo } from "./CeoProvider";

const LIQ = { sana: "bg-mint-soft text-sob", alerta: "bg-amber-soft text-amber-700", crisis: "bg-coral/10 text-coral" } as const;
const LIQ_LABEL = { sana: "Liquidez sana", alerta: "Liquidez en alerta", crisis: "Liquidez en crisis" } as const;

/** Empresa emergente: equipo, sucursales, resultados y decisiones de crecimiento. Cifras del motor, nunca de la IA. */
export function GrowthPanel() {
  const c = useCeo();
  const log = c.s.growth;
  const day = log ? growthDayOf(c.s, c.now) : 0;
  const data = useMemo(() => {
    if (!log) return null;
    const { state } = growthAt(log, day);
    return { g: state, team: teamOf(state), sites: sitesOf(state), res: resultsOf(state), ms: milestonesOf(state, log.decisions), pending: pendingGrowth(log, day), bridge: growthBridge(log, day) };
  }, [log, day]);
  const [msg, setMsg] = useState<string | null>(null);
  if (!data) return null;
  const { team, sites, res, ms, pending, bridge } = data;
  const pk = c.pack;

  return (
    <section id="crecimiento" className="card p-5 sm:p-6 space-y-6" data-testid="panel-crecimiento">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2"><TrendingUp size={17} className="text-indigo" /><h2 className="font-semibold text-ink">Tu empresa por dentro</h2></div>
          <span className={clsx("chip text-[11px]", LIQ[res.liquidity.status])}>{LIQ_LABEL[res.liquidity.status]}</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">Día {data.g.day} de tu gestión. Lo que contratas, abres o pospones cambia estas cifras; los cinco indicadores se calculan a partir de ellas.</p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-4" data-testid="casos-crecimiento">
          <div className="flex items-center gap-2"><Inbox size={15} className="text-indigo" /><h3 className="text-sm font-semibold text-ink">Esperando tu decisión</h3></div>
          {pending.map(({ case: k, options }) => (
            <article key={k.id} className="rounded-2xl border border-indigo/20 bg-indigo-soft/30 p-4">
              <div className="text-[11px] text-slate-500">{k.from}</div>
              <div className="text-sm font-semibold text-ink">{k.subject}</div>
              <div className="mt-2 space-y-2 text-sm text-slate-700 leading-relaxed">{k.body(data.g).map((p, i) => <p key={i}>{p}</p>)}</div>
              {k.data && (
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {k.data(data.g).map(([a, b]) => <div key={a} className="rounded-xl bg-white px-3 py-2"><dt className="text-[11px] text-slate-400">{a}</dt><dd className="text-sm font-semibold text-ink tabular-nums">{b}</dd></div>)}
                </dl>
              )}
              <div className="mt-3 grid gap-2">
                {options.map((o) => (
                  <button key={o.id} type="button" disabled={!o.ok}
                    onClick={() => { if (window.confirm(`¿Decidir «${o.text}»?`)) { const ok = c.decideGrowth(k.id, o.id); setMsg(ok ? "Decisión registrada. Verás el efecto en los próximos días." : "No se pudo registrar la decisión; revisa las condiciones."); } }}
                    className="text-left rounded-xl border border-slate-200 bg-white p-3 hover:border-indigo/50 disabled:opacity-50 disabled:hover:border-slate-200">
                    <div className="text-sm font-semibold text-ink">{o.text}</div>
                    <div className="mt-0.5 text-xs text-slate-500 leading-snug">{o.outcome}</div>
                    {!o.ok && o.reason && <div className="mt-1 text-xs text-coral">{o.reason}</div>}
                  </button>
                ))}
              </div>
            </article>
          ))}
          {msg && <p className="text-xs text-slate-500">{msg}</p>}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2"><Users size={15} className="text-indigo" /><h3 className="text-sm font-semibold text-ink">Equipo · {team.headcount} personas</h3></div>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {team.byRole.map((r) => <li key={`${r.roleId}${r.site}`} className="flex justify-between gap-2 py-1.5"><span className="text-slate-700">{r.title} <span className="text-slate-400">· {r.site}</span></span><span className="tabular-nums font-medium text-ink">{r.count}</span></li>)}
          </ul>
          {team.vacancyList.length > 0 && (
            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <b className="text-ink">Vacantes abiertas:</b> {team.vacancyList.map((v) => `${v.title} (${v.site}, llega en unos ${v.inDays} días)`).join("; ")}.
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">{team.note}</p>
        </div>
        <div>
          <div className="flex items-center gap-2"><Building2 size={15} className="text-indigo" /><h3 className="text-sm font-semibold text-ink">Operación y {sites.length === 1 ? "sede" : "sedes"}</h3></div>
          <div className="mt-2 space-y-2">
            {sites.map((x) => (
              <div key={x.name} className="rounded-xl border border-slate-100 p-3 text-sm">
                <div className="flex justify-between gap-2"><b className="text-ink">{x.name}</b><span className="text-xs text-slate-500">{x.status}</span></div>
                <div className="mt-1 text-xs text-slate-600">Capacidad: {x.capacity}{x.bottleneck ? ` · cuello de botella: ${x.bottleneck}` : ""}</div>
                <div className="text-xs text-slate-600">Renta: {x.rent}</div>
                {x.note && <div className="mt-1 text-[11px] text-slate-400">{x.note}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink">Resultados{res.month ? ` del mes ${res.month}` : ""}</h3>
        {res.rows.length ? (
          <dl className="mt-2 grid gap-x-6 sm:grid-cols-2 text-sm">
            {res.rows.map(([k, v]) => <div key={k} className="flex justify-between gap-2 border-b border-slate-100 py-1.5"><dt className="text-slate-600">{k}</dt><dd className={clsx("tabular-nums font-medium", k === "EBITDA" ? "text-indigo" : "text-ink")}>{v}</dd></div>)}
          </dl>
        ) : <p className="mt-1 text-sm text-slate-500">El primer mes todavía no cierra.</p>}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          <div className="rounded-xl bg-canvas p-3"><div className="text-[11px] text-slate-400">Caja hoy</div><div className="font-semibold text-ink tabular-nums">{res.cash}</div></div>
          {res.overdue && <div className="rounded-xl bg-coral/10 p-3"><div className="text-[11px] text-coral">Pagos vencidos</div><div className="font-semibold text-coral tabular-nums">{res.overdue}</div></div>}
          {res.debt && <div className="rounded-xl bg-canvas p-3"><div className="text-[11px] text-slate-400">Deuda</div><div className="font-semibold text-ink tabular-nums">{res.debt}</div></div>}
        </div>
        <p className={clsx("mt-2 flex gap-1.5 text-xs leading-snug", res.liquidity.status === "sana" ? "text-slate-500" : "text-coral")}>{res.liquidity.status !== "sana" && <CircleAlert size={13} className="shrink-0 mt-0.5" />}{res.liquidity.text}</p>
      </div>

      {bridge.causes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink">Qué está moviendo tus indicadores</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {bridge.causes.slice(0, 8).map((x, i) => <li key={i} className="flex gap-2"><span className={clsx("w-12 shrink-0 tabular-nums font-semibold", x.points >= 0 ? "text-indigo" : "text-coral")}>{x.points > 0 ? "+" : ""}{x.points}</span><span><b className="text-ink">{pk.kpiLabel[x.kpi]}:</b> {x.text}</span></li>)}
          </ul>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2"><History size={15} className="text-indigo" /><h3 className="text-sm font-semibold text-ink">Decisiones e hitos</h3></div>
        {ms.length ? (
          <ol className="mt-2 space-y-1.5 text-xs">
            {ms.map((m, i) => <li key={i} className="flex gap-2"><span className="w-14 shrink-0 text-slate-400 tabular-nums">Día {m.day}</span><span className={m.kind === "decision" ? "text-ink font-medium" : "text-slate-600"}>{m.text}</span></li>)}
          </ol>
        ) : <p className="mt-1 text-xs text-slate-500">Todavía no hay hitos.</p>}
      </div>

      {c.testTools && <Link href="/ceo/empresa/demo-crecimiento" className="inline-block text-xs font-semibold text-indigo">Ver la demostración antes / después (modo prueba) →</Link>}
    </section>
  );
}
