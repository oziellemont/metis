"use client";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Check, ChevronDown, Lock, ShieldAlert } from "lucide-react";
import { growthDayOf } from "@/lib/ceo/engine";
import { steelOf, steelPendingOf } from "@/lib/ceo/growth/session";
import { steelBridge } from "@/lib/ceo/growth/steel/session";
import { caseById as steelCase, previewOption } from "@/lib/ceo/growth/steel/cases";
import { cashOf, debtOf, overdueTotal, CREDITOR_LABEL, headcountOf, type SteelState } from "@/lib/ceo/growth/steel/engine";
import { AREA_LABEL } from "@/lib/ceo/growth/steel/cases";
import { useCeo } from "./CeoProvider";
import { ExternalImpacts, WorldBadge } from "./WorldBits";
import { AlertChips } from "./GrowthPanel";
import type { Alert } from "@/lib/ceo/growth/ops";

const M = (cents: number) => { const v = cents / 100; const a = Math.abs(v); const s = v < 0 ? "−" : ""; return a >= 1e6 ? `${s}$${(a / 1e6).toFixed(1)} M` : a >= 1e3 ? `${s}$${Math.round(a / 1e3)} mil` : `${s}$${Math.round(a)}`; };
const STANCE: Record<string, string> = { prudente: "Prudente", equilibrada: "Equilibrada", arriesgada: "Arriesgada" };

/** Alertas de la acería v2 a partir del estado del motor (nunca inventadas). */
export function steelAlerts(s: SteelState): Alert[] {
  const out: Alert[] = [];
  const od = overdueTotal(s);
  if (od) {
    const who = [...new Set(s.overdue.map((o) => CREDITOR_LABEL[o.creditor]))].join(", ");
    out.push({ id: "vencido", tone: "bad", title: `Vencido ${M(od)}`, text: `Pagos atrasados con ${who}.` });
  } else if (s.liquidity === "alerta") out.push({ id: "alerta", tone: "warn", title: "Caja justa", text: "Lo que vence en 30 días no cabe en la caja más lo que se cobra." });
  if (s.supply.powerCut) out.push({ id: "luz", tone: "bad", title: "Sin energía", text: "La CFE cortó el suministro por falta de pago." });
  if (s.supply.scrapStopped) out.push({ id: "chatarra", tone: "bad", title: "Sin chatarra", text: "Los chatarreros dejaron de surtir." });
  else if (s.supply.scrapCashOnly) out.push({ id: "contado", tone: "warn", title: "Chatarra de contado", text: "Los proveedores ya solo venden de contado." });
  const m = s.months.at(-1);
  if (m && m.utilization > 0.95) out.push({ id: "llena", tone: "warn", title: "Planta llena", text: `Utilización de ${Math.round(m.utilization * 100)} %.` });
  if (m && m.tonsShort > 0) out.push({ id: "faltante", tone: "warn", title: "Entregas incompletas", text: `${Math.round(m.tonsShort)} t sin entregar el último mes.` });
  if (s.safety < 0.7) out.push({ id: "seguridad", tone: "warn", title: "Seguridad baja", text: `Cultura de seguridad ${Math.round(s.safety * 100)}/100.` });
  if (!out.length && m && m.ebitda > 0) out.push({ id: "bien", tone: "good", title: "Operación sana", text: `EBITDA de ${M(m.ebitda)} el último mes.` });
  return out;
}

/** Mi empresa con la acería v2: caso del turno con vista previa calculada por el motor, números y bitácora. */
export function SteelPanel() {
  const c = useCeo();
  const log = c.s.growth;
  const day = log ? growthDayOf(c.s, c.now) : 0;
  const data = useMemo(() => {
    if (!log) return null;
    const r = steelOf(log, day);
    return { s: r.state, audit: r.log, external: r.external, pending: steelPendingOf(log, day), bridge: steelBridge(r.state) };
  }, [log, day]);
  const [pick, setPick] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [done, setDone] = useState<{ label: string; lesson: string } | null>(null);
  const preview = useMemo(() => (data?.pending && pick ? previewOption(data.s, data.pending.c, pick) : null), [data, pick]);
  if (!data || !log) return null;
  const { s, pending, bridge, audit, external } = data;
  const m = s.months.at(-1);
  const pk = c.pack;

  const decide = (id: string) => {
    if (!pending) return;
    const o = pending.options.find((x) => x.id === id);
    if (c.decideGrowth(pending.c.id, id)) { setDone({ label: o?.label ?? "", lesson: pending.lesson }); setPick(null); }
  };

  return (
    <section id="crecimiento" className="card p-5 sm:p-6 space-y-5" data-testid="panel-aceria">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">Día {s.day}</div>
          <h2 className="font-semibold text-ink text-lg">Tu planta</h2>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slate-400">Caja</div>
          <div className="font-semibold text-ink tabular-nums">{M(cashOf(s))}</div>
        </div>
      </div>

      <AlertChips alerts={steelAlerts(s)} />
      <ExternalImpacts hits={external} />

      {done && !pending && (
        <div className="rounded-3xl bg-ink text-white p-5 ceo-pop space-y-2" data-testid="caso-decidido">
          <div className="flex items-center gap-3"><span className="h-9 w-9 rounded-full bg-mint grid place-items-center"><Check size={18} strokeWidth={3} /></span><div className="text-sm font-semibold">{done.label}</div></div>
          <div className="rounded-2xl bg-white/10 p-3 text-xs leading-snug"><span className="font-semibold">Principio: </span>{done.lesson}</div>
        </div>
      )}

      {pending && (
        <article className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 tree-pop" data-testid="caso-aceria">
          {pending.world && <WorldBadge w={pending.world} />}
          <div className="text-[11px] text-slate-400">{pending.from} · {AREA_LABEL[pending.c.area]}{pending.c.safety ? " · seguridad" : ""}</div>
          <h3 className="font-semibold text-ink leading-snug">{pending.subject}</h3>
          <div className="mt-2 space-y-2 text-[13px] text-slate-600 leading-relaxed">{pending.body.map((p, i) => <p key={i}>{p}</p>)}</div>
          {pending.data.length > 0 && <dl className="mt-3 grid gap-1.5 sm:grid-cols-2">{pending.data.map(([a, b]) => <div key={a} className="rounded-xl bg-canvas px-3 py-2"><dt className="text-[10.5px] text-slate-400">{a}</dt><dd className="text-xs font-semibold text-ink tabular-nums">{b}</dd></div>)}</dl>}
          <div className="mt-4 grid gap-2">
            {pending.options.map((o) => (
              <button key={o.id} type="button" disabled={!o.ok} onClick={() => setPick(pick === o.id ? null : o.id)} data-testid="opcion-aceria"
                className={clsx("text-left rounded-2xl p-3.5 border-2 transition-all", pick === o.id ? "border-indigo bg-indigo-soft/40" : "border-slate-100 hover:border-indigo/30", !o.ok && "opacity-60 cursor-not-allowed")}>
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">{o.blocked ? <ShieldAlert size={14} className="text-coral" /> : !o.ok ? <Lock size={13} className="text-slate-400" /> : null}{o.label}<span className="ml-auto text-[10px] font-medium text-slate-400">{STANCE[o.stance]}</span></span>
                <span className="mt-1 block text-[12px] text-slate-500 leading-snug">{o.detail}</span>
                {!o.ok && o.reason && <span className="mt-1 block text-[11px] text-coral leading-snug">{o.reason}</span>}
              </button>
            ))}
          </div>
          {pick && (
            <div className="mt-3 rounded-2xl bg-canvas p-3.5 academy-in flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="flex-1 text-xs text-slate-600 leading-snug" data-testid="vista-previa">{preview ? preview.text : "Sin efecto económico calculable en cuatro meses."}</p>
              <button type="button" onClick={() => decide(pick)} className="btn btn-primary text-sm shrink-0" data-testid="confirmar-aceria">Decidir</button>
            </div>
          )}
        </article>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Kpi k={m ? `Ventas · mes ${m.month}` : "Ventas"} v={m ? M(m.revenue) : "—"} />
        <Kpi k="EBITDA" v={m ? M(m.ebitda) : "—"} sub={m && m.revenue ? `${((100 * m.ebitda) / m.revenue).toFixed(1)} %` : undefined} tone={m ? (m.ebitda >= 0 ? "good" : "bad") : undefined} />
        <Kpi k="Personas" v={String(headcountOf(s))} sub={m ? `Utilización ${Math.round(m.utilization * 100)} %` : undefined} />
        <Kpi k="Deuda" v={M(debtOf(s))} sub={overdueTotal(s) ? `${M(overdueTotal(s))} vencido` : undefined} tone={overdueTotal(s) ? "bad" : undefined} />
      </div>

      <button type="button" onClick={() => setMore((x) => !x)} className="w-full text-xs font-semibold text-slate-400 hover:text-indigo inline-flex items-center justify-center gap-1" data-testid="mas-aceria">
        {more ? "Ver menos" : "Estados financieros, indicadores y bitácora"} <ChevronDown size={13} className={clsx("transition-transform", more && "rotate-180")} />
      </button>

      {more && (
        <div className="grid gap-5 lg:grid-cols-2 academy-in text-sm">
          <div>
            <h3 className="text-xs font-semibold text-slate-500">Resultados{m ? ` del mes ${m.month}` : ""}</h3>
            {m ? (
              <dl className="mt-1.5">{([
                ["Ventas", m.revenue], ["Costo de ventas", -m.cogs], ["Nómina", -m.payroll], ["Energía y servicios", -m.services], ["Otros gastos", -(m.rent + m.fixed + m.freight + m.penalties + m.other)],
                ["EBITDA", m.ebitda], ["Depreciación", -m.depreciation], ["Resultado financiero", -m.financial], ["PTU provisionada", -m.ptu], ["ISR provisionado", -m.isr], ["Utilidad neta", m.net],
                ["Flujo libre de caja", m.freeCashFlow], ["Impuestos pagados", -m.cashTaxes], ["Por cobrar a clientes", m.receivables], ["Inventario", m.inventory],
              ] as [string, number][]).map(([k, v]) => <div key={k} className="flex justify-between gap-2 border-b border-slate-100 py-1.5"><dt className="text-slate-500">{k}</dt><dd className={clsx("tabular-nums font-medium", k === "EBITDA" || k === "Utilidad neta" ? "text-indigo" : "text-ink")}>{M(v)}</dd></div>)}</dl>
            ) : <p className="mt-1 text-slate-400">El primer mes todavía no cierra.</p>}
          </div>
          <div className="space-y-5">
            {bridge.causes.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500">Qué mueve tus indicadores</h3>
                <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                  {bridge.causes.slice(0, 7).map((x, i) => <li key={i} className="flex gap-2"><span className={clsx("w-9 shrink-0 tabular-nums font-semibold", x.points >= 0 ? "text-indigo" : "text-coral")}>{x.points > 0 ? "+" : ""}{x.points}</span><span><b className="text-ink">{pk.kpiLabel[x.kpi]}:</b> {x.text}</span></li>)}
                </ul>
              </div>
            )}
            <div>
              <h3 className="text-xs font-semibold text-slate-500">Bitácora de decisiones</h3>
              {audit.length ? (
                <ol className="mt-1.5 space-y-1 text-xs">{audit.slice(-10).reverse().map((e, i) => <li key={i} className="flex gap-2"><span className="w-12 shrink-0 text-slate-400 tabular-nums">Día {e.day}</span><span className={e.ok ? "text-ink" : "text-coral"}>{e.caseId.startsWith("liq@") ? "Liquidez" : steelCase(e.caseId)?.subject ?? e.caseId} · {steelCase(e.caseId)?.options.find((o) => o.id === e.optionId)?.label ?? e.optionId}{e.source === "ia" ? " (elegido por la IA)" : ""}{e.ok ? "" : ` · no procedió: ${e.reason}`}</span></li>)}</ol>
              ) : <p className="mt-1 text-xs text-slate-400">Todavía no hay decisiones.</p>}
              <ol className="mt-3 space-y-1 text-xs">{s.events.slice(-6).reverse().map((e, i) => <li key={i} className="flex gap-2"><span className="w-12 shrink-0 text-slate-400 tabular-nums">Día {e.day}</span><span className="text-slate-600">{e.text}</span></li>)}</ol>
            </div>
          </div>
        </div>
      )}
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
