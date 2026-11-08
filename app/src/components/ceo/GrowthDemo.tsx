"use client";
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { DEMO_SCENARIOS, runDemo, type DemoPath } from "@/lib/ceo/growth/demo";
import { useCeo } from "./CeoProvider";

/** Demostración para revisión: el mismo día, con y sin la contratación o apertura. Solo visible fuera de producción. */
export function GrowthDemo() {
  const c = useCeo();
  const [id, setId] = useState(DEMO_SCENARIOS[0].id);
  const d = useMemo(() => runDemo(id), [id]);
  if (!c.testTools && !c.growthOn) return <section className="card p-6 text-sm text-slate-500">Esta demostración no está disponible.</section>;
  if (!d) return null;

  return (
    <div className="space-y-5" data-testid="demo-crecimiento">
      <Link href="/ceo/empresa" className="inline-flex items-center gap-1.5 text-sm text-indigo font-medium"><ArrowLeft size={14} /> Mi empresa</Link>
      <section className="card p-5 sm:p-6">
        <div className="flex items-center gap-2"><FlaskConical size={17} className="text-indigo" /><h1 className="text-xl font-semibold text-ink">Qué cambia en Mi empresa</h1></div>
        <p className="mt-1 text-sm text-slate-500">Demostración para revisión. Cada escenario juega dos caminos desde el mismo día y con la misma semilla, y los compara el mismo día: la diferencia es solo la decisión. Todas las cifras salen del motor.</p>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist">
          {DEMO_SCENARIOS.map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={s.id === id} onClick={() => setId(s.id)} className={clsx("chip px-3 py-1.5 text-xs border", s.id === id ? "bg-ink text-white border-ink" : "bg-white text-ink border-slate-200")}>{s.title}</button>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">{d.scenario.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{d.scenario.question}</p>
        <p className="mt-1 text-xs text-slate-400">Primera decisión el día {d.startDay}; comparación el día {d.day}.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-400"><th className="py-2 pr-3 font-semibold">Dato</th><th className="py-2 px-3 font-semibold">{d.base.label}</th><th className="py-2 px-3 font-semibold">{d.alt.label}</th><th className="py-2 pl-3 font-semibold">Diferencia</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {d.rows.map((r) => (
                <tr key={r.label}>
                  <td className="py-2 pr-3 text-slate-600">{r.label}</td>
                  <td className="py-2 px-3 tabular-nums text-ink">{r.before}</td>
                  <td className="py-2 px-3 tabular-nums text-ink font-medium">{r.after}</td>
                  <td className={clsx("py-2 pl-3 tabular-nums font-semibold", r.tone === "good" ? "text-indigo" : r.tone === "bad" ? "text-coral" : "text-slate-400")}>{r.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Azul: mejora para la empresa. Rojo: costo o empeora. Más nómina aparece en rojo porque es un costo, aunque sea la decisión correcta.</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <PathCard p={d.base} />
        <PathCard p={d.alt} />
      </div>
    </div>
  );
}

function PathCard({ p }: { p: DemoPath }) {
  const events = p.state.events.filter((e) => e.day > 0).slice(-6).reverse();
  return (
    <section className="card p-5">
      <h3 className="font-semibold text-ink">{p.label}</h3>
      <div className="mt-2 text-xs text-slate-500">{p.team.headcount} personas · {p.sites.map((s) => `${s.name} (${s.status.toLowerCase()})`).join(", ")}</div>
      <ul className="mt-3 divide-y divide-slate-100 text-sm">
        {p.team.byRole.map((r) => <li key={`${r.roleId}${r.site}`} className="flex justify-between py-1"><span className="text-slate-600">{r.title} <span className="text-slate-400">· {r.site}</span></span><span className="tabular-nums">{r.count}</span></li>)}
      </ul>
      <h4 className="mt-4 text-xs font-semibold text-ink">Lo último que pasó</h4>
      <ol className="mt-1 space-y-1 text-xs text-slate-600">
        {events.map((e, i) => <li key={i} className="flex gap-2"><span className="w-14 shrink-0 text-slate-400 tabular-nums">Día {e.day}</span><span>{e.text}</span></li>)}
      </ol>
    </section>
  );
}
