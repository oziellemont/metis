"use client";
/** Empresa · Resumen: salud, tres cifras del mes, lo que merece tu atención y qué cambió desde tu última decisión. */
import Link from "next/link";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { KPI_KEYS } from "@/lib/ceo/engine";
import { alertsAt, timeline } from "@/lib/ceo/season-report";
import { SOURCE_LABEL } from "@/lib/ceo/indicators";
import { monthName, stageOf, statementOf, STAGE_LABEL, moneyAt, runwayText, formatMetric } from "@/lib/ceo/business/present";
import type { DisplayCurrency } from "@/lib/ceo/career/money";
import { growthFactsOf, growthSummaryOf } from "@/lib/ceo/career/setup";
import { useCeo } from "../CeoProvider";
import { KpiBoard } from "../KpiBoard";
import { Delta, rel } from "../ui";
import { Dot, Figure, Panel, cents, toneOfAlert, useBusiness, useGrowthSnap, type Level } from "./shared";
import { StageTag } from "./FinanzasTab";
import type { EmpresaTab } from "./tabs";

interface Signal { id: string; level: Level; title: string; text: string; href?: string; tab?: EmpresaTab; weight: number }

export function ResumenTab({ go }: { go: (t: EmpresaTab) => void }) {
  const c = useCeo();
  const pk = c.pack;
  const biz = useBusiness();
  const grow = useGrowthSnap();
  const cur: DisplayCurrency = c.s.settings.displayCurrency ?? "MXN";

  // Lo que merece tu atención: máximo tres señales, ordenadas por impacto real (no todo en rojo).
  const signals = useMemo(() => {
    const out: Signal[] = [];
    if (!c.seasonDone) {
      const objectives = new Set(c.verdict.v5?.objectives.map((o) => o.kpi) ?? []);
      for (const a of alertsAt(c.s, c.now)) {
        if (a.kind === "saturacion") continue;
        const level: Level = a.level === "critico" ? "alta" : a.level === "riesgo" ? "media" : "baja";
        const w = (a.level === "critico" ? 30 : a.level === "riesgo" ? 20 : 10) + (objectives.has(a.kpi) || a.kpi === "caja" ? 5 : 0);
        out.push({ id: `k-${a.kpi}-${a.kind}`, level, title: pk.kpiLabel[a.kpi], text: a.text, tab: a.kpi === "consejo" ? "consejo" : a.kpi === "caja" || a.kpi === "margen" ? "finanzas" : a.kpi === "equipo" ? "personas" : "operacion", weight: w });
      }
    }
    if (biz) {
      for (const r of biz.rows.filter((x) => x.top)) {
        out.push({ id: `o-${r.def.id}`, level: r.status === "fuera" ? "media" : "baja", title: r.def.label, text: `Va en ${formatMetric(r.value, r.def.unit, cur)} contra una meta de ${formatMetric(r.def.target!, r.def.unit, cur)}. Es de los KPI operativos más lejos de su meta.`, tab: "operacion", weight: 12 + Math.min(8, r.gap * 40) });
      }
      const n = biz.b.now;
      if (n.runwayMonths !== null && n.runwayMonths < 6) out.push({ id: "runway", level: "alta", title: "Caja", text: `${runwayText(n)} al ritmo de este mes.`, tab: "finanzas", weight: 35 });
    }
    if (grow) {
      for (const a of grow.alerts.filter((x) => x.tone !== "good")) out.push({ id: `g-${a.id}`, level: toneOfAlert(a) as Level, title: a.title, text: a.text, tab: "operacion", weight: a.tone === "bad" ? 28 : 16 });
      if (grow.pending) out.push({ id: "g-caso", level: "media", title: "Decisión de crecimiento abierta", text: "Hay un caso de tu operación esperando tu decisión.", href: "#crecimiento", tab: "operacion", weight: 40 });
    }
    const seen = new Set<string>();
    return out.sort((a, b) => b.weight - a.weight).filter((s) => (seen.has(s.title) ? false : (seen.add(s.title), true))).slice(0, 3);
  }, [c.s, c.now, c.seasonDone, c.verdict.v5, pk.kpiLabel, biz, grow, cur]);

  // Qué cambió desde tu última decisión: los últimos movimientos con la causa.
  const changes = useMemo(() => {
    const ev = timeline(c.s, c.now).events.filter((e) => KPI_KEYS.some((k) => (e.eff[k] ?? 0) !== 0));
    return ev.slice(-4).reverse();
  }, [c.s, c.now]);

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5 min-w-0">
          <MonthFigures cur={cur} />

          <Panel title="Lo que merece tu atención" testid="atencion">
            {signals.length ? (
              <ul className="divide-y divide-slate-100">
                {signals.map((s) => (
                  <li key={s.id} className="py-3 first:pt-0 last:pb-0">
                    <button type="button" onClick={() => { if (s.href) { history.replaceState(null, "", s.href); } if (s.tab) go(s.tab); }} className="group w-full flex items-start gap-3 text-left">
                      <Dot level={s.level} className="mt-1.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">{s.title}</span>
                        <span className="block text-[13px] text-slate-500 leading-snug">{s.text}</span>
                      </span>
                      <ArrowRight size={15} className="mt-1 shrink-0 text-slate-300 transition-colors group-hover:text-indigo" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">Nada fuera de lo normal. Tus indicadores y tu operación están dentro de lo esperado.</p>}
          </Panel>

          <Panel title="Qué cambió desde tu última decisión" testid="que-cambio">
            {changes.length ? (
              <ol className="space-y-2.5">
                {changes.map((e) => (
                  <li key={e.kind + e.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[11px] text-slate-400">{SOURCE_LABEL[e.kind]}{e.at ? ` · ${rel(e.at, c.now)}` : " · al cierre"}</span>
                      {e.href && <Link href={e.href} className="text-xs font-semibold text-indigo hover:text-ink">Ver qué pasó →</Link>}
                    </div>
                    <div className="mt-0.5 text-sm font-medium text-ink">{e.label}</div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {KPI_KEYS.filter((k) => (e.eff[k] ?? 0) !== 0).map((k) => <span key={k} className="tabular-nums">{pk.kpiLabel[k]} {e.before[k]} → {e.after[k]} <Delta n={e.after[k] - e.before[k]} /></span>)}
                    </div>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-slate-500">Todavía no hay movimientos este periodo. Tu primera decisión aparecerá aquí con lo que movió.</p>}
          </Panel>
        </div>

        <aside className="rounded-3xl bg-white border border-slate-100 p-5 sm:p-6 self-start" aria-label="Salud de la empresa" data-testid="indicadores-empresa">
          <KpiBoard hero detail="centro" />
        </aside>
      </div>

      <Ficha />
    </>
  );
}

/** Ventas, EBITDA y caja del mes en curso. Carrera continua: proyección del mes; crecimiento: último mes cerrado. */
function MonthFigures({ cur }: { cur: DisplayCurrency }) {
  const biz = useBusiness();
  const grow = useGrowthSnap();
  if (biz) {
    const p = biz.b.now;
    const st = statementOf(p, cur);
    const m = (v: number) => moneyAt(v, cur, st.digits);
    const tag = <StageTag stage={stageOf(p)} />;
    return (
      <div data-testid="cifras-mes">
        <div className="mb-2 text-[12px] text-slate-500">{monthName(p)} · {STAGE_LABEL[stageOf(p)].toLowerCase()} con lo que llevas decidido · {cur}</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Figure label="Ventas" value={m(st.revenue)} note={`Meta ${m(Math.round(p.revenueTarget * 10 ** st.digits) / 10 ** st.digits)}`} tone={p.revenue < p.revenueTarget ? "warn" : undefined} stage={tag} />
          <Figure label="EBITDA" value={m(st.ebitda)} note={`${((p.ebitda / Math.max(p.revenue, 1e-9)) * 100).toFixed(1)} % de las ventas`} tone={p.ebitda < 0 ? "bad" : undefined} stage={tag} />
          <Figure label="Caja" value={m(st.cashEnd)} note={runwayText(p)} tone={p.runwayMonths !== null && p.runwayMonths < 6 ? "bad" : undefined} stage={tag} />
        </div>
      </div>
    );
  }
  if (grow) {
    const last = grow.months.at(-1);
    return (
      <div data-testid="cifras-mes">
        <div className="mb-2 text-[12px] text-slate-500">{last ? `Mes ${last.month} · cierre definitivo` : "Día " + grow.day + " · el primer mes todavía no cierra"}</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Figure label="Ventas" value={last ? cents(last.revenue) : "—"} />
          <Figure label="EBITDA" value={last ? cents(last.ebitda) : "—"} tone={last && last.ebitda < 0 ? "bad" : undefined} note={last && last.revenue ? `${((last.ebitda / last.revenue) * 100).toFixed(1)} % de las ventas` : undefined} />
          <Figure label="Caja" value={cents(grow.cash)} note="Saldo de hoy" />
        </div>
      </div>
    );
  }
  return null;
}

/** Ficha breve de la empresa: una línea de descripción y los datos clave compactos; el texto completo se despliega. */
function Ficha() {
  const c = useCeo();
  const pk = c.pack;
  const prof = c.s.companyProfile;
  const [open, setOpen] = useState(false);
  const growthSel = c.s.growth && prof ? { growth: true, archetype: prof.archetype, sectorId: prof.sectorId, industryId: prof.industryId } : null;
  const pitch = (growthSel ? growthSummaryOf(growthSel) ?? pk.pitch : pk.pitch) ?? "";
  const facts = (growthSel && growthFactsOf(growthSel)) || pk.facts;
  const first = pitch.split(/(?<=\.)\s/)[0] ?? pitch;
  return (
    <Panel title="Ficha" testid="ficha">
      <p className="text-sm text-slate-600 leading-relaxed">{open ? pitch : first}{pitch.length > first.length && (
        <button type="button" onClick={() => setOpen((x) => !x)} className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-indigo hover:text-ink">{open ? "Ver menos" : "Leer completa"} <ChevronDown size={12} className={clsx("transition-transform", open && "rotate-180")} /></button>
      )}</p>
      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
        {facts.map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-[11px] text-slate-400">{k}</dt><dd className="text-sm font-semibold text-ink truncate" title={v}>{v}</dd></div>)}
      </dl>
    </Panel>
  );
}
