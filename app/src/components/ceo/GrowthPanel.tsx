"use client";
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { growthDayOf } from "@/lib/ceo/engine";
import { growthAt, growthBridge, pendingGrowth } from "@/lib/ceo/growth/session";
import { milestonesOf, resultsOf, teamOf } from "@/lib/ceo/growth/view";
import { alertsOf, short, type Alert } from "@/lib/ceo/growth/ops";
import { useCeo } from "./CeoProvider";
import { GrowthCase } from "./GrowthCase";
import { coachLine } from "@/lib/ceo/growth/learning";
import { OpsMap } from "./OpsMap";

const ALERT = {
  bad: { cls: "bg-coral-soft text-coral", Icon: CircleAlert },
  warn: { cls: "bg-amber-soft text-amber-700", Icon: TriangleAlert },
  good: { cls: "bg-mint-soft text-sob", Icon: CircleCheck },
} as const;

export function AlertChips({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" data-testid="alertas-empresa">
      {alerts.map((a, i) => {
        const { cls, Icon } = ALERT[a.tone];
        return (
          <div key={a.id} className={clsx("shrink-0 max-w-[16rem] rounded-2xl px-3 py-2.5 tree-slide", cls)} style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center gap-1.5 text-xs font-semibold"><Icon size={13} />{a.title}</div>
            <div className="mt-0.5 text-[11px] opacity-80 leading-snug">{a.text}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Mi empresa con el motor vivo: alertas, decisiones pendientes, mapa de operaciones y los números del mes. */
export function GrowthPanel() {
  const c = useCeo();
  const log = c.s.growth;
  const day = log ? growthDayOf(c.s, c.now) : 0;
  const data = useMemo(() => {
    if (!log) return null;
    const { state } = growthAt(log, day);
    return { g: state, team: teamOf(state), res: resultsOf(state), ms: milestonesOf(state, log.decisions), pending: pendingGrowth(log, day), bridge: growthBridge(log, day), alerts: alertsOf(state) };
  }, [log, day]);
  const [more, setMore] = useState(false);
  if (!data || !log) return null;
  const { g, team, res, ms, pending, bridge, alerts } = data;
  const m = g.months.at(-1);
  const pk = c.pack;

  return (
    <section id="crecimiento" className="card p-5 sm:p-6 space-y-5" data-testid="panel-crecimiento">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">Día {g.day}</div>
          <h2 className="font-semibold text-ink text-lg">Tu operación</h2>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slate-400">Caja</div>
          <div className="font-semibold text-ink tabular-nums">{res.cash}</div>
        </div>
      </div>

      <AlertChips alerts={alerts} />

      {coachLine(log.decisions) && <p className="text-xs text-slate-500 rounded-2xl bg-slate-50 px-3 py-2" data-testid="coach">{coachLine(log.decisions)}</p>}

      {pending.length > 0 && (
        <div className="space-y-3" data-testid="casos-crecimiento">
          {pending.map(({ case: k, options }, i) => (
            <GrowthCase key={`${k.id}@${g.day}`} g={g} k={k} options={options} decisions={log.decisions} index={i} onDecide={(id) => c.decideGrowth(k.id, id)} />
          ))}
        </div>
      )}

      <OpsMap g={g} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Kpi k={m ? `Ventas · mes ${m.month}` : "Ventas"} v={m ? short(m.revenue) : "—"} />
        <Kpi k="EBITDA" v={m ? short(m.ebitda) : "—"} tone={m ? (m.ebitda >= 0 ? "good" : "bad") : undefined} />
        <Kpi k="Personas" v={String(team.headcount)} sub={team.vacancies ? `+${team.vacancies} por llegar` : undefined} />
        <Kpi k="Deuda" v={res.debt ?? "$0"} sub={res.overdue ? `${res.overdue} vencido` : undefined} tone={res.overdue ? "bad" : undefined} />
      </div>

      <button type="button" onClick={() => setMore((x) => !x)} className="w-full text-xs font-semibold text-slate-400 hover:text-indigo inline-flex items-center justify-center gap-1" data-testid="mas-crecimiento">
        {more ? "Ver menos" : "Estado de resultados, indicadores e historial"} <ChevronDown size={13} className={clsx("transition-transform", more && "rotate-180")} />
      </button>

      {more && (
        <div className="grid gap-5 lg:grid-cols-2 academy-in text-sm">
          <div>
            <h3 className="text-xs font-semibold text-slate-500">Resultados{res.month ? ` del mes ${res.month}` : ""}</h3>
            {res.rows.length ? (
              <dl className="mt-1.5">{res.rows.map(([k, v]) => <div key={k} className="flex justify-between gap-2 border-b border-slate-100 py-1.5"><dt className="text-slate-500">{k}</dt><dd className={clsx("tabular-nums font-medium", k === "EBITDA" ? "text-indigo" : "text-ink")}>{v}</dd></div>)}</dl>
            ) : <p className="mt-1 text-slate-400">El primer mes todavía no cierra.</p>}
            <p className={clsx("mt-2 text-xs leading-snug", res.liquidity.status === "sana" ? "text-slate-400" : "text-coral")}>{res.liquidity.text}</p>
          </div>
          <div className="space-y-5">
            {bridge.causes.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500">Qué mueve tus indicadores</h3>
                <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                  {bridge.causes.slice(0, 6).map((x, i) => <li key={i} className="flex gap-2"><span className={clsx("w-9 shrink-0 tabular-nums font-semibold", x.points >= 0 ? "text-indigo" : "text-coral")}>{x.points > 0 ? "+" : ""}{x.points}</span><span><b className="text-ink">{pk.kpiLabel[x.kpi]}:</b> {x.text}</span></li>)}
                </ul>
              </div>
            )}
            <div>
              <h3 className="text-xs font-semibold text-slate-500">Decisiones e hitos</h3>
              {ms.length ? (
                <ol className="mt-1.5 space-y-1 text-xs">{ms.map((x, i) => <li key={i} className="flex gap-2"><span className="w-12 shrink-0 text-slate-400 tabular-nums">Día {x.day}</span><span className={x.kind === "decision" ? "text-ink font-medium" : "text-slate-600"}>{x.text}</span></li>)}</ol>
              ) : <p className="mt-1 text-xs text-slate-400">Todavía no hay hitos.</p>}
            </div>
          </div>
        </div>
      )}

      {c.testTools && <Link href="/ceo/empresa/demo-crecimiento" className="inline-block text-xs font-semibold text-indigo">Ver la demostración antes / después (modo prueba) →</Link>}
    </section>
  );
}

function Kpi({ k, v, sub, tone }: { k: string; v: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-2xl bg-canvas p-3">
      <div className="text-[10.5px] text-slate-400">{k}</div>
      <div className={clsx("mt-0.5 font-semibold tabular-nums", tone === "good" ? "text-sob" : tone === "bad" ? "text-coral" : "text-ink")}>{v}</div>
      {sub && <div className="text-[10.5px] text-slate-400">{sub}</div>}
    </div>
  );
}
