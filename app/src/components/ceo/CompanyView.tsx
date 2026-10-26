"use client";
import clsx from "clsx";
import { useState } from "react";
import { BookA, Network } from "lucide-react";
import { KPI_KEYS } from "@/lib/ceo/engine";
import { COMPANIES } from "@/lib/ceo/companies";
import { useCeo } from "./CeoProvider";
import { OrgMap } from "./OrgMap";

/** Tu empresa: ficha, mapa de relaciones, cómo se mide y glosario de la industria. */
export function CompanyView() {
  const c = useCeo();
  const pk = c.pack;
  const [q, setQ] = useState("");
  const canSwitch = Object.keys(c.s.decisions).length === 0 && (c.s.career ?? []).length === 0;
  const terms = pk.glossary.filter((g) => !q || (g.term + g.def).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <section className="card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="h-14 w-14 rounded-2xl bg-indigo-soft grid place-items-center text-3xl shrink-0">{pk.emoji}</span>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">{pk.industry} · {pk.city}</div>
            <h1 className="text-2xl font-semibold text-ink">{pk.name}</h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{pk.pitch}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pk.facts.map(([k, v]) => <div key={k} className="rounded-2xl bg-canvas p-3.5"><div className="text-[11px] text-slate-400">{k}</div><div className="mt-0.5 text-sm font-semibold text-ink">{v}</div></div>)}
        </div>
        {canSwitch && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-4">
            <div className="text-xs font-semibold text-slate-500">¿Prefieres empezar en otra industria? Puedes cambiar mientras no tomes tu primera decisión.</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {COMPANIES.filter((co) => co.id !== pk.id).map((co) => (
                <button key={co.id} onClick={() => window.confirm(`¿Cambiar a ${co.name}? Tu día 1 empieza de nuevo.`) && c.switchCompany(co.id)} className="chip bg-white border border-slate-200 text-ink px-3 py-1.5 text-xs hover:border-indigo/40">{co.emoji} {co.name}</button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center gap-2"><Network size={17} className="text-indigo" /><h2 className="font-semibold text-ink">Mapa de la organización</h2></div>
        <p className="mt-1 text-sm text-slate-500">Quién le reporta a quién, quiénes se apoyan y dónde hay fricción. En un caso, las decisiones casi nunca afectan a una sola persona.</p>
        <div className="mt-4"><OrgMap pack={pk} /></div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Cómo te mide el consejo</h2>
        <p className="mt-1 text-sm text-slate-500">Para ascender, cada rubro debe cerrar en <b className="text-ink">{c.verdict.passLine}</b> o más.</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {KPI_KEYS.map((k) => (
            <div key={k} className="rounded-2xl border border-slate-100 p-4">
              <dt className="flex items-center justify-between text-sm font-semibold text-ink">{pk.kpiLabel[k]} <span className={clsx("tabular-nums text-xs", c.verdict.approved[k] ? "text-indigo" : "text-coral")}>{c.kpis[k]}</span></dt>
              <dd className="mt-1 text-xs text-slate-500 leading-relaxed">{pk.kpiHint[k]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><BookA size={17} className="text-indigo" /><h2 className="font-semibold text-ink">Glosario de {pk.industry.toLowerCase()}</h2></div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar término…" className="input max-w-[220px] py-1.5 text-sm" />
        </div>
        <dl className="mt-4 divide-y divide-slate-100">
          {terms.map((g) => <div key={g.term} className="py-3 grid sm:grid-cols-[180px_1fr] gap-1 sm:gap-4"><dt className="text-sm font-semibold text-ink">{g.term}</dt><dd className="text-sm text-slate-600 leading-relaxed">{g.def}</dd></div>)}
          {!terms.length && <p className="py-3 text-sm text-slate-400">Sin resultados.</p>}
        </dl>
      </section>
    </div>
  );
}
