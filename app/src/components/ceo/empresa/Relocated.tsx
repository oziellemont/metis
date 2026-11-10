"use client";
/**
 * Piezas que salieron de Empresa y viven en otra pantalla (no se pierde nada):
 *  - RenameCompany → Ajustes
 *  - MyCompanies y CompanySwitch → Carrera
 *  - IndustryGlossary → Academy
 */
import { useState } from "react";
import { BookA, Pencil, Undo2 } from "lucide-react";
import { COMPANIES } from "@/lib/ceo/companies";
import { NAME_MAX } from "@/lib/ceo/career/identity";
import { effectiveShort } from "@/lib/ceo/career/setup";
import { useCeo } from "../CeoProvider";

/** Ajustes · cambiar el nombre de tu empresa (carrera continua). El id, el historial y las decisiones no cambian. */
export function RenameCompany() {
  const c = useCeo();
  const prof = c.s.companyProfile;
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(prof?.displayName ?? "");
  const [sh, setSh] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  if (!c.continuous || !prof) return null;
  const eff = effectiveShort(n, sh);
  const save = () => {
    if (!eff) return;
    const ok = c.renameCompany(n, sh.trim() || undefined);
    setMsg(ok ? "Listo. Tu equipo ya usa el nombre nuevo." : "Ese nombre ya es el actual o no es válido.");
    if (ok) setOpen(false);
  };
  return (
    <section className="card p-5 sm:p-6 space-y-3" data-testid="ajustes-nombre-empresa">
      <h2 className="font-semibold text-ink">Tu empresa</h2>
      {!open ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-500">Nombre: <b className="text-ink">{prof.displayName}</b> · nombre corto: <b className="text-ink">{prof.shortName}</b></span>
          <button type="button" onClick={() => { setN(prof.displayName); setSh(""); setMsg(null); setOpen(true); }} className="inline-flex items-center gap-1.5 text-indigo font-medium"><Pencil size={14} /> Cambiar nombre</button>
          {msg && <span className="text-xs text-slate-500">{msg}</span>}
        </div>
      ) : (
        <div className="space-y-3">
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
      )}
    </section>
  );
}

/** Carrera · empresas guardadas, para volver a ellas. */
export function MyCompanies() {
  const c = useCeo();
  const shelf = c.s.shelf ?? [];
  if (!shelf.length) return null;
  return (
    <section className="card p-5 sm:p-6" data-testid="mis-empresas">
      <h2 className="font-semibold text-ink">Empresas guardadas</h2>
      <ul className="mt-3 space-y-2">
        {shelf.map((e) => (
          <li key={e.id} className="rounded-2xl border border-slate-100 p-3.5 flex flex-wrap items-center gap-3 justify-between">
            <div className="text-sm font-semibold text-ink truncate min-w-0">{e.name}</div>
            <button type="button" data-testid="volver-empresa" onClick={() => window.confirm(`¿Volver a ${e.name}? ${c.pack.name} se guarda tal como está.`) && c.resumeCompany(e.id)} className="btn border border-slate-200 text-ink hover:border-indigo/40 text-sm"><Undo2 size={14} /> Volver</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Carrera · cambiar de industria mientras no hayas tomado tu primera decisión (solo carrera por temporadas). */
export function CompanySwitch() {
  const c = useCeo();
  const pk = c.pack;
  const canSwitch = !c.continuous && Object.keys(c.s.decisions).length === 0 && (c.s.career ?? []).length === 0;
  if (!canSwitch) return null;
  return (
    <section className="card p-5 sm:p-6" data-testid="cambiar-industria">
      <div className="text-sm font-semibold text-ink">¿Prefieres empezar en otra industria?</div>
      <p className="mt-1 text-xs text-slate-500">Puedes cambiar mientras no tomes tu primera decisión.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {COMPANIES.filter((co) => co.id !== pk.id).map((co) => (
          <button key={co.id} onClick={() => window.confirm(`¿Cambiar a ${co.name}? Tu día 1 empieza de nuevo.`) && c.switchCompany(co.id)} className="chip bg-white border border-slate-200 text-ink px-3 py-1.5 text-xs hover:border-indigo/40">{co.name}</button>
        ))}
      </div>
    </section>
  );
}

/** Academy · glosario de la industria de tu empresa, con búsqueda. */
export function IndustryGlossary() {
  const c = useCeo();
  const pk = c.pack;
  const [q, setQ] = useState("");
  const terms = pk.glossary.filter((g) => !q || (g.term + g.def).toLowerCase().includes(q.toLowerCase()));
  if (!pk.glossary.length) return null;
  return (
    <section className="card p-5 sm:p-6" data-testid="glosario">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><BookA size={17} className="text-indigo" /><h2 className="font-semibold text-ink">Glosario de {pk.industry.toLowerCase()}</h2></div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar término…" className="input max-w-[220px] py-1.5 text-sm" />
      </div>
      <dl className="mt-4 divide-y divide-slate-100">
        {terms.map((g) => <div key={g.term} className="py-3 grid sm:grid-cols-[180px_1fr] gap-1 sm:gap-4"><dt className="text-sm font-semibold text-ink">{g.term}</dt><dd className="text-sm text-slate-600 leading-relaxed">{g.def}</dd></div>)}
        {!terms.length && <p className="py-3 text-sm text-slate-400">Sin resultados.</p>}
      </dl>
    </section>
  );
}
