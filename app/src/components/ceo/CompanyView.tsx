"use client";
import clsx from "clsx";
import { useState } from "react";
import { BookA, Network, Pencil } from "lucide-react";
import { KPI_KEYS } from "@/lib/ceo/engine";
import { COMPANIES } from "@/lib/ceo/companies";
import { useCeo } from "./CeoProvider";
import { CompanyOrgChart } from "./CompanyOrgChart";
import { BusinessPanel } from "./BusinessPanel";
import { CompanyMark } from "./ui";
import { NAME_MAX } from "@/lib/ceo/career/identity";
import { effectiveShort } from "@/lib/ceo/career/setup";
import { industryOf } from "@/lib/ceo/career/taxonomy";

/** Tu empresa: ficha, mapa de relaciones, cómo se mide y glosario de la industria. */
export function CompanyView() {
  const c = useCeo();
  const pk = c.pack;
  const [q, setQ] = useState("");
  const canSwitch = !c.continuous && Object.keys(c.s.decisions).length === 0 && (c.s.career ?? []).length === 0;
  const prof = c.s.companyProfile;
  const industry = prof ? industryOf(prof.sectorId, prof.industryId)?.label ?? pk.industry : pk.industry;
  const terms = pk.glossary.filter((g) => !q || (g.term + g.def).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <section className="card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <CompanyMark name={pk.name} size={56} />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">{industry}{prof?.specialty ? ` · ${prof.specialty}` : ""} · {pk.city}</div>
            <h1 className="text-2xl font-semibold text-ink">{pk.name}</h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{pk.pitch}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pk.facts.map(([k, v]) => <div key={k} className="rounded-2xl bg-canvas p-3.5"><div className="text-[11px] text-slate-400">{k}</div><div className="mt-0.5 text-sm font-semibold text-ink">{v}</div></div>)}
        </div>
        {c.continuous && prof && <Rename name={prof.displayName} short={prof.shortName} />}
        {canSwitch && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-4">
            <div className="text-xs font-semibold text-slate-500">¿Prefieres empezar en otra industria? Puedes cambiar mientras no tomes tu primera decisión.</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {COMPANIES.filter((co) => co.id !== pk.id).map((co) => (
                <button key={co.id} onClick={() => window.confirm(`¿Cambiar a ${co.name}? Tu día 1 empieza de nuevo.`) && c.switchCompany(co.id)} className="chip bg-white border border-slate-200 text-ink px-3 py-1.5 text-xs hover:border-indigo/40">{co.name}</button>
              ))}
            </div>
          </div>
        )}
      </section>

      {c.continuous && <BusinessPanel />}

      <section className="card p-5 sm:p-6">
        <div className="flex items-center gap-2"><Network size={17} className="text-indigo" /><h2 className="font-semibold text-ink">Organigrama</h2></div>
        <p className="mt-1 text-sm text-slate-500">Quién está en la empresa y a quién le reporta cada quien.</p>
        <div className="mt-5"><CompanyOrgChart pack={pk} relations={c.relations} /></div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Cómo te mide el consejo</h2>
        <p className="mt-1 text-sm text-slate-500">{c.continuous ? "Cinco índices de salud de 0 a 100, aparte del dinero. " : ""}Para ascender, cada rubro debe cerrar en <b className="text-ink">{c.verdict.passLine}</b> o más.</p>
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

/** Carrera continua: cambiar el nombre de tu empresa. El id, el historial y las decisiones no cambian. */
function Rename({ name, short }: { name: string; short: string }) {
  const c = useCeo();
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(name);
  const [sh, setSh] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const eff = effectiveShort(n, sh);
  const save = () => {
    if (!eff) return;
    const ok = c.renameCompany(n, sh.trim() || undefined);
    setMsg(ok ? "Listo. Tu equipo ya usa el nombre nuevo." : "Ese nombre ya es el actual o no es válido.");
    if (ok) setOpen(false);
  };
  if (!open) return (
    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
      <span className="text-slate-500">Nombre corto: <b className="text-ink">{short}</b></span>
      <button type="button" onClick={() => { setN(name); setSh(""); setMsg(null); setOpen(true); }} className="inline-flex items-center gap-1.5 text-indigo font-medium"><Pencil size={14} /> Cambiar nombre</button>
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
    </div>
  );
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 p-4 space-y-3">
      <div>
        <label className="label" htmlFor="rn-name">Nombre de la empresa</label>
        <input id="rn-name" maxLength={NAME_MAX} className="input" value={n} onChange={(e) => setN(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="rn-short">Nombre corto (opcional)</label>
        <input id="rn-short" maxLength={NAME_MAX} className="input" placeholder={eff ?? "Se calcula solo"} value={sh} onChange={(e) => setSh(e.target.value)} />
      </div>
      {!eff && <p className="text-xs text-coral">Usa de 2 a {NAME_MAX} caracteres, sin llaves ni signos como {"< >"}.</p>}
      <p className="text-xs text-slate-500">Cambia cómo te nombran en correos y casos. Tu historial, decisiones y periodo no cambian.</p>
      <div className="flex gap-2">
        <button type="button" disabled={!eff} onClick={save} className="btn-primary disabled:opacity-40">Guardar</button>
        <button type="button" onClick={() => setOpen(false)} className="btn text-slate-500">Cancelar</button>
      </div>
    </div>
  );
}
