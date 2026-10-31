"use client";
/**
 * Carrera continua · pasos del onboarding para crear tu empresa (P0-B3):
 * sector e industria (con búsqueda) → tipo de empresa → nombre → carta de nombramiento.
 * Toda la lógica vive en lib/ceo/career (setup.ts, taxonomy.ts, identity.ts); aquí solo se pinta.
 */
import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Building2, Check, Lock, Search } from "lucide-react";
import { personOf } from "@/lib/ceo/cast";
import { ARCHETYPES, INDUSTRY_PLACEHOLDER, SECTORS, archetypeAvailability, availabilityLabel, changeSector, industriesOf, industryOf, searchIndustries, sectorById } from "@/lib/ceo/career/taxonomy";
import { NAME_MAX } from "@/lib/ceo/career/identity";
import { appointedByOf, canContinue, defaultArchetype, effectiveShort, nameExample, previewPack, type SetupSelection } from "@/lib/ceo/career/setup";
import { Avatar, CompanyMark } from "./ui";

type Sel = SetupSelection;
interface StepProps { sel: Sel; setSel: (f: (s: Sel) => Sel) => void; onBack: () => void; onNext: () => void }

const Nav = ({ onBack, onNext, ok, label = "Continuar" }: { onBack: () => void; onNext: () => void; ok: boolean; label?: React.ReactNode }) => (
  <div className="mt-6 flex gap-3">
    <button onClick={onBack} className="btn text-white/70 hover:text-white">Atrás</button>
    <button disabled={!ok} onClick={onNext} className="btn bg-white text-ink hover:bg-white/90 flex-1 justify-center py-3 text-base font-semibold disabled:opacity-40">{label} <ArrowRight size={16} /></button>
  </div>
);

const Soon = ({ dark }: { dark?: boolean }) => <span className={clsx("chip text-[10px] shrink-0", dark ? "bg-slate-100 text-slate-500" : "bg-white/10 text-white/60")}><Lock size={10} className="mr-1" />{availabilityLabel("coming_soon")}</span>;

// ───────────────────────────────────────────── 1 · sector e industria
export function IndustryStep({ sel, setSel, onBack, onNext }: StepProps) {
  const [q, setQ] = useState("");
  const hits = useMemo(() => searchIndustries(q, 6), [q]);
  const pick = (sectorId: string, industryId?: string) => setSel((s) => {
    const n = changeSector(s, sectorId);
    const ind = industryId ?? n.industryId;
    return { ...s, ...n, industryId: ind, archetype: defaultArchetype(sectorId, ind), specialty: s.industryId === ind ? s.specialty : undefined };
  });
  const sector = sectorById(sel.sectorId);
  const list = industriesOf(sel.sectorId);
  const ind = industryOf(sel.sectorId, sel.industryId);
  return (
    <section className="academy-in mt-10">
      <div className="text-xs font-semibold uppercase tracking-wider text-mint">Tu empresa · 1 de 4</div>
      <h1 className="mt-2 text-3xl font-semibold leading-tight">¿En qué industria vas a dirigir?</h1>
      <p className="mt-3 text-white/70 text-[15px] leading-relaxed">Vas a dirigir una sola empresa, la tuya, mes con mes. La industria define su idioma, sus números y sus dilemas.</p>

      <div className="mt-6 rounded-2xl bg-white text-ink p-5 sm:p-6 space-y-4">
        <div>
          <label className="label flex items-center gap-1.5" htmlFor="ind-q"><Search size={12} /> Buscar por giro</label>
          <input id="ind-q" className="input" placeholder="Ej. botanas, autopartes, restaurante" value={q} onChange={(e) => setQ(e.target.value)} />
          {hits.length > 0 && (
            <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {hits.map((h) => (
                <li key={`${h.sectorId}/${h.industryId}`} className="flex items-center gap-3 px-3 py-2">
                  <span className="flex-1 min-w-0"><span className="block text-sm font-medium truncate">{h.label}</span><span className="block text-[11px] text-slate-500 truncate">{h.sectorLabel}</span></span>
                  {h.availability === "available"
                    ? <button type="button" onClick={() => { pick(h.sectorId, h.industryId); setQ(""); }} className="chip bg-indigo-soft text-indigo px-3 py-1 text-xs font-medium">Usar</button>
                    : <Soon dark />}
                </li>
              ))}
            </ul>
          )}
          {q.trim().length >= 2 && !hits.length && <p className="mt-2 text-xs text-slate-500">Sin coincidencias. Elige el sector en la lista.</p>}
        </div>
        <div>
          <label className="label" htmlFor="ind-sector">Sector</label>
          <select id="ind-sector" className="input" value={sel.sectorId ?? ""} onChange={(e) => pick(e.target.value)}>
            <option value="" disabled>Elige un sector</option>
            {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}{s.availability === "coming_soon" ? ` · ${availabilityLabel("coming_soon")}` : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ind-ind">Industria</label>
          {!sector ? <div className="input text-slate-400">{INDUSTRY_PLACEHOLDER}</div> : (
            <div id="ind-ind" role="radiogroup" aria-label="Industria" className="grid gap-2 sm:grid-cols-2">
              {list.map((i) => {
                const on = i.id === sel.industryId, open = i.availability === "available";
                return (
                  <button key={i.id} type="button" role="radio" aria-checked={on} disabled={!open} onClick={() => pick(i.sectorId, i.id)}
                    className={clsx("text-left rounded-xl border px-3 py-2.5 flex items-center gap-2 text-sm transition-colors", on ? "border-indigo bg-indigo-soft/60" : open ? "border-slate-200 hover:border-indigo/40" : "border-slate-100 text-slate-400 cursor-not-allowed")}>
                    <span className="flex-1 min-w-0 truncate">{i.label}</span>
                    {on ? <Check size={14} className="text-indigo" strokeWidth={3} /> : !open && <Soon dark />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {ind && ind.availability === "available" && ind.specialties.length > 0 && (
          <div>
            <label className="label" htmlFor="ind-spec">Especialidad (opcional)</label>
            <select id="ind-spec" className="input" value={sel.specialty ?? ""} onChange={(e) => setSel((s) => ({ ...s, specialty: e.target.value || undefined }))}>
              <option value="">Sin especificar</option>
              {ind.specialties.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
        )}
      </div>
      <Nav onBack={onBack} onNext={onNext} ok={canContinue("industria", sel)} />
    </section>
  );
}

// ───────────────────────────────────────────── 2 · tipo de empresa
export function ArchetypeStep({ sel, setSel, onBack, onNext, extra }: StepProps & { extra?: React.ReactNode }) {
  return (
    <section className="academy-in mt-10">
      <div className="text-xs font-semibold uppercase tracking-wider text-mint">Tu empresa · 2 de 4</div>
      <h1 className="mt-2 text-3xl font-semibold leading-tight">¿Qué tipo de empresa?</h1>
      <p className="mt-3 text-white/70 text-[15px] leading-relaxed">No la fundaste: te nombran para dirigirla. El tipo cambia quién te nombra, cuánta estructura hay y qué tan ajustados están los recursos.</p>
      <div role="radiogroup" aria-label="Tipo de empresa" className="mt-6 space-y-3">
        {ARCHETYPES.map((a) => {
          const open = archetypeAvailability(sel.sectorId, sel.industryId, a.id) === "available", on = sel.archetype === a.id;
          return (
            <button key={a.id} type="button" role="radio" aria-checked={on} disabled={!open} onClick={() => setSel((s) => ({ ...s, archetype: a.id }))}
              className={clsx("w-full text-left rounded-2xl p-4 sm:p-5 flex gap-4 items-start transition-all border-2", on ? "bg-white text-ink border-white shadow-2xl" : open ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white/[.03] border-white/5 text-white/40 cursor-not-allowed")}>
              <span className="flex-1 min-w-0">
                <span className="flex flex-wrap items-center gap-2"><span className="font-semibold">{a.label}</span>{!open && <Soon />}</span>
                <span className={clsx("block text-sm mt-1", on ? "text-slate-600" : "text-white/60")}>{a.hint}</span>
                <span className={clsx("block text-xs mt-1", on ? "text-slate-500" : "text-white/40")}>{a.appointedBy}</span>
              </span>
              {on && <span className="h-6 w-6 rounded-full bg-indigo text-white grid place-items-center shrink-0"><Check size={14} strokeWidth={3} /></span>}
            </button>
          );
        })}
      </div>
      {extra}
      <Nav onBack={onBack} onNext={onNext} ok={canContinue("tipo", sel)} />
    </section>
  );
}

// ───────────────────────────────────────────── 3 · nombre
export function NameStep({ sel, setSel, onBack, onNext }: StepProps) {
  const ind = industryOf(sel.sectorId, sel.industryId);
  const short = effectiveShort(sel.displayName, sel.shortName);
  const typed = !!sel.displayName?.trim();
  const ok = canContinue("nombre", sel);
  return (
    <section className="academy-in mt-10">
      <div className="text-xs font-semibold uppercase tracking-wider text-mint">Tu empresa · 3 de 4</div>
      <h1 className="mt-2 text-3xl font-semibold leading-tight">¿Cómo se llama tu empresa?</h1>
      <p className="mt-3 text-white/70 text-[15px] leading-relaxed">Así la van a nombrar tu equipo, tus clientes y tu consejo en cada correo y cada caso. Puedes cambiarlo después en «Mi empresa».</p>
      <div className="mt-6 rounded-2xl bg-white text-ink p-5 sm:p-6 space-y-4">
        <div>
          <label className="label" htmlFor="co-name">Nombre de la empresa</label>
          <input id="co-name" autoFocus maxLength={NAME_MAX} className="input text-base" placeholder={nameExample(ind?.contentPackId)} value={sel.displayName ?? ""} onChange={(e) => setSel((s) => ({ ...s, displayName: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && ok && onNext()} />
          {typed && !short && <p className="mt-1.5 text-xs text-coral">Usa de 2 a {NAME_MAX} caracteres, sin llaves ni signos como {"< >"}.</p>}
        </div>
        <div>
          <label className="label" htmlFor="co-short">Nombre corto (opcional)</label>
          <input id="co-short" maxLength={NAME_MAX} className="input" placeholder={short ?? "Se calcula solo"} value={sel.shortName ?? ""} onChange={(e) => setSel((s) => ({ ...s, shortName: e.target.value }))} />
          <p className="mt-1.5 text-xs text-slate-500">El que se usa en conversación: «los números de {short ?? "tu empresa"}».</p>
        </div>
        {short && (
          <div className="flex items-center gap-3 rounded-xl bg-canvas p-3">
            <CompanyMark name={sel.displayName!} size={40} />
            <div className="min-w-0"><div className="font-semibold truncate">{sel.displayName!.trim()}</div><div className="text-xs text-slate-500 truncate">{ind?.label}{sel.specialty ? ` · ${sel.specialty}` : ""}</div></div>
          </div>
        )}
      </div>
      <Nav onBack={onBack} onNext={onNext} ok={ok} />
    </section>
  );
}

// ───────────────────────────────────────────── 4 · carta de nombramiento
export function LetterStep({ sel, name, onBack, onNext }: Omit<StepProps, "setSel"> & { name: string }) {
  const pk = useMemo(() => previewPack(sel), [sel]);
  if (!pk) return null;
  const chair = personOf(pk, pk.roles.chair);
  const first = name.trim().split(/\s+/)[0] || "";
  return (
    <section className="academy-in mt-10">
      <div className="text-xs font-semibold uppercase tracking-wider text-mint">Tu empresa · 4 de 4 · {industryOf(sel.sectorId, sel.industryId)?.label} · {pk.city}</div>
      <h1 className="mt-2 text-3xl font-semibold leading-tight">Tu nombramiento como Director General de {pk.name}</h1>
      <p className="mt-3 text-white/70 text-[15px] leading-relaxed">{appointedByOf(sel.archetype)} {pk.pitch}</p>
      <div className="mt-6 rounded-2xl bg-white text-ink p-5">
        <div className="flex items-center gap-3"><Avatar id={chair.id} size={40} pack={pk} /><div><div className="text-sm font-semibold">{chair.name}</div><div className="text-xs text-slate-500">{chair.role}</div></div></div>
        {first && <p className="mt-3 text-[15px] font-medium">{first}:</p>}
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600 whitespace-pre-line">«{pk.welcome}»</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {pk.facts.map(([k, v]) => <div key={k} className="rounded-2xl bg-white/10 p-4"><div className="text-[11px] text-white/50">{k}</div><div className="mt-1 font-semibold">{v}</div></div>)}
      </div>
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5">
        <div className="text-xs font-semibold text-white/60 flex items-center gap-1.5"><Building2 size={13} /> Quién te va a escribir</div>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {Object.keys(pk.cast).map((id) => (
            <div key={id} className="flex items-center gap-2.5"><Avatar id={id} size={34} pack={pk} /><div className="min-w-0"><div className="text-sm font-medium truncate">{personOf(pk, id).name}</div><div className="text-[11px] text-white/50 truncate">{personOf(pk, id).role}</div></div></div>
          ))}
        </div>
      </div>
      <Nav onBack={onBack} onNext={onNext} ok label="Acepto el nombramiento" />
    </section>
  );
}
