"use client";
import Link from "next/link";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Check, FileText } from "lucide-react";
import { personOf } from "@/lib/ceo/cast";
import { lessonById } from "@/lib/ceo/lessons";
import { closedRunsOf } from "@/lib/ceo/business";
import { reportOf, type ReportChoice } from "@/lib/ceo/business/report";
import { pctChange, runwayText, type Change } from "@/lib/ceo/business/present";
import { formatMoney, type DisplayCurrency } from "@/lib/ceo/career/money";
import { useCeo } from "./CeoProvider";
import { Avatar } from "./ui";

const toneCls = (t: Change["tone"]) => (t === "good" ? "text-indigo" : t === "bad" ? "text-coral" : "text-slate-400");
const LEVER_NAME: Record<string, string> = { marketing: "Campaña de marketing", capex: "Inversión en la operación" };

/** Reporte mensual (P0-D): lo presenta Finanzas, compara mes anterior, meta y real, y pide una decisión de caja. */
export function ReportView() {
  const c = useCeo();
  const sp = useSearchParams();
  const cur: DisplayCurrency = c.s.settings.displayCurrency ?? "MXN";
  const closed = c.continuous ? closedRunsOf(c.s).length : 0;
  const asked = Number(sp.get("mes"));
  const period = Number.isInteger(asked) && asked >= 1 && asked <= closed ? asked : (c.reportDue ?? closed);
  const r = useMemo(() => (period ? reportOf(c.s, period, cur) : null), [c.s, period, cur]);
  const [pick, setPick] = useState<ReportChoice | null>(null);
  const [signed, setSigned] = useState<{ period: number; option: ReportChoice | null } | null>(null);

  if (!c.continuous) return <Empty text="Los reportes mensuales son parte de la carrera continua: llegan cuando diriges tu propia empresa." />;
  if (!r) return <Empty text="Tu primer reporte llega al cerrar tu primer mes. Atiende los asuntos del periodo y presenta tu reto final." />;

  const pk = c.pack;
  const who = personOf(pk, r.presenter);
  const m = (v: number) => formatMoney(v, cur);
  const a = r.actual, p = r.prev;
  const vsTarget = (a.revenue / a.revenueTarget - 1) * 100;
  const lesson = lessonById(r.lesson);
  const due = !r.reviewed && c.reportDue === r.period;
  const sign = () => {
    if (!due) return;
    const opt = r.proposal ? pick : null;
    if (r.proposal && !opt) return;
    c.signReport(r.period, opt === "a" || opt === "b" ? opt : null);
    setSigned({ period: r.period, option: opt });
  };
  const justSigned = signed?.period === r.period;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {closed > 1 && (
        <nav aria-label="Reportes" className="flex gap-1.5 overflow-x-auto">
          {Array.from({ length: closed }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={`/ceo/reporte?mes=${n}`} className={clsx("chip px-3 py-1.5 text-xs whitespace-nowrap", n === r.period ? "bg-ink text-white" : "bg-white border border-slate-200 text-slate-600")}>Mes {n}{n === c.reportDue ? " · por revisar" : ""}</Link>
          ))}
        </nav>
      )}

      <section className="card p-5 sm:p-7">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">{pk.name} · Cierre del mes {r.period}</div>
        <div className="mt-3 flex items-center gap-3">
          <Avatar id={r.presenter} size={44} />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-ink leading-tight">Reporte del mes {r.period}</h1>
            <p className="text-sm text-slate-500">Te lo presenta {who.name}, {who.role}.</p>
          </div>
        </div>

        <h2 className="mt-6 text-sm font-semibold text-ink">Qué cambió</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Fig label="Ventas" value={m(a.revenue)} change={pctChange(a.revenue, p.revenue)} rows={[["Meta", m(a.revenueTarget)], ["Mes anterior", m(p.revenue)]]} foot={Math.abs(vsTarget) < 0.5 ? "En línea con la meta" : `${Math.abs(vsTarget).toFixed(1)} % ${vsTarget > 0 ? "arriba" : "abajo"} de la meta`} footTone={vsTarget >= -0.5 ? "good" : "bad"} />
          <Fig label="EBITDA" value={m(a.ebitda)} change={diff(a.ebitda, p.ebitda, m)} rows={[["Mes anterior", m(p.ebitda)], ["Margen bruto", `${(a.grossMargin * 100).toFixed(1)} %`]]} warn={a.ebitda < 0} />
          <Fig label="Efectivo" value={m(a.cashEnd)} change={diff(a.cashEnd, p.cashEnd, m)} rows={[["Mes anterior", m(p.cashEnd)], ["Entró", m(a.inflows)], ["Salió", m(a.outflows)]]} foot={runwayText(a)} footTone={a.runwayMonths !== null && a.runwayMonths < 6 ? "bad" : "flat"} />
        </div>

        <h2 className="mt-6 text-sm font-semibold text-ink">Por qué</h2>
        <ul className="mt-1.5 space-y-1.5 text-sm text-slate-600 leading-relaxed">
          {r.why.map((w) => <li key={w} className="flex gap-2"><span className="mt-2 h-1 w-1 rounded-full bg-slate-400 shrink-0" />{w}</li>)}
        </ul>

        <h2 className="mt-6 text-sm font-semibold text-ink">Qué está en juego</h2>
        <p className="mt-1.5 text-sm text-slate-600">{r.stake}</p>
      </section>

      <section className="card p-5 sm:p-7" aria-label="Tu decisión">
        <h2 className="font-semibold text-ink">Tu decisión</h2>
        {justSigned ? (
          <div className="mt-3 rounded-2xl bg-mint-soft/60 p-4 text-sm text-ink">
            <div className="flex items-center gap-2 font-semibold"><Check size={16} className="text-sob" strokeWidth={3} /> Reporte firmado</div>
            <p className="mt-1 text-slate-600">{signed!.option === "a" || signed!.option === "b" ? "Tu decisión quedó registrada. El gasto sale de la caja a partir del siguiente mes y el efecto llega con su retraso: lo verás en los próximos reportes." : "Sin inversión nueva este mes. La caja queda disponible."} El mes {r.period + 1} se cierra cuando atiendas sus asuntos.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/ceo" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo px-4 py-2 text-sm font-semibold text-white">Volver a Hoy <ArrowRight size={14} /></Link>
              <Link href="/ceo/empresa" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-medium text-indigo border border-slate-200">Ver tu empresa</Link>
            </div>
          </div>
        ) : !due ? (
          <p className="mt-2 text-sm text-slate-600">{r.decided ? `${LEVER_NAME[r.decided.lever] ?? "Inversión"}: ${m(r.decided.amount)}${r.decided.months ? ` al mes durante ${r.decided.months} meses` : " una sola vez"}. Decidido al firmar este reporte.` : "Sin inversión nueva en este mes."}</p>
        ) : r.proposal ? (
          <>
            <p className="mt-1 text-sm text-slate-600"><b className="text-ink">{r.proposal.title}.</b> {r.proposal.why}</p>
            <div className="mt-3 space-y-2.5" role="radiogroup" aria-label="Opciones">
              {r.proposal.options.map((o) => (
                <button key={o.id} type="button" role="radio" aria-checked={pick === o.id} onClick={() => setPick(o.id)} className={clsx("w-full text-left rounded-2xl border p-4 transition-colors", pick === o.id ? "border-indigo bg-indigo-soft/40" : "border-slate-200 hover:border-slate-300")}>
                  <div className="flex items-start gap-3">
                    <span className={clsx("mt-0.5 h-5 w-5 rounded-full border-2 grid place-items-center shrink-0", pick === o.id ? "border-indigo" : "border-slate-300")}>{pick === o.id && <span className="h-2.5 w-2.5 rounded-full bg-indigo" />}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink"><span className="text-slate-400 mr-1">({o.id})</span>{o.label}</div>
                      <div className="mt-0.5 text-sm text-slate-600">{o.detail}</div>
                      <div className="mt-1.5 text-[11px] text-slate-400">Proyección al cierre del mes {r.proposal!.horizon}, sin otros cambios: ventas {m(o.projection.revenue)} · caja {m(o.projection.cash)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">La proyección usa los supuestos fijos del simulador. Lo que decidas en los asuntos del mes también mueve los números.</p>
            <button type="button" onClick={sign} disabled={!pick} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Firmar el reporte <ArrowRight size={15} /></button>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-600">Este mes no hay una decisión grande de caja. Firmar el reporte también es decidir: confirmas que viste los números.</p>
            <button type="button" onClick={sign} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo px-5 py-2.5 text-sm font-semibold text-white">Enterado <Check size={15} /></button>
          </>
        )}
      </section>

      {lesson && (
        <Link href={`/ceo/academy/${lesson.id}?from=reporte`} className="card p-4 flex gap-3 items-center hover:-translate-y-0.5 transition-transform">
          <span className="h-10 w-10 rounded-xl bg-indigo-soft text-indigo grid place-items-center shrink-0"><BookOpen size={18} /></span>
          <div className="min-w-0"><div className="text-[10px] font-semibold uppercase tracking-wider text-indigo">Qué aprendes · {lesson.minutes} min</div><div className="text-sm font-semibold text-ink leading-snug mt-0.5">{lesson.title}</div><div className="text-xs text-slate-500">Entre el gasto y el resultado siempre hay un retraso. La caja lo paga primero.</div></div>
        </Link>
      )}
    </div>
  );
}

function diff(now: number, prev: number, m: (v: number) => string): Change {
  const d = now - prev;
  if (Math.abs(d) < 0.005) return { text: "sin cambio", tone: "flat" };
  return { text: `${d > 0 ? "+" : "−"}${m(Math.abs(d))}`, tone: d > 0 ? "good" : "bad" };
}

function Fig({ label, value, change, rows, foot, footTone = "flat", warn }: { label: string; value: string; change: Change; rows: [string, string][]; foot?: string; footTone?: Change["tone"]; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-100 p-3.5">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={clsx("mt-0.5 text-lg font-semibold tabular-nums", warn ? "text-coral" : "text-ink")}>{value}</div>
      <div className={clsx("text-xs font-medium tabular-nums", toneCls(change.tone))}>{change.text}</div>
      <dl className="mt-2 space-y-0.5 text-[11px]">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-2"><dt className="text-slate-400">{k}</dt><dd className="text-slate-600 tabular-nums text-right">{v}</dd></div>)}
      </dl>
      {foot && <div className={clsx("mt-2 text-[11px] font-medium", toneCls(footTone))}>{foot}</div>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mx-auto max-w-xl card p-8 text-center">
      <span className="mx-auto h-11 w-11 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><FileText size={20} /></span>
      <h1 className="mt-3 text-lg font-semibold text-ink">Reporte mensual</h1>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
      <Link href="/ceo" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo">Volver a Hoy <ArrowRight size={14} /></Link>
    </div>
  );
}
