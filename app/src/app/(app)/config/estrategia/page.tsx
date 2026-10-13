"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Plus, Pencil, Trash2, Check, X, Mountain, Gauge, FolderKanban, AlertTriangle, Lightbulb, BarChart3, GitFork } from "lucide-react";
import { useMetis, newId } from "@/lib/store";
import { Avatar } from "@/components/ui/primitives";
import type { LAE, StrategicObjective } from "@/lib/domain/types";
import { LAE_MIN, LAE_MAX, PILLAR_SETS, type PillarIdea } from "@/lib/strategy/pillars";

const COLORS = ["#4F3FE0", "#14C98E", "#2FA7F5", "#F5A524", "#F2545B", "#8B5CF6", "#0EA5A4", "#64748B"];
const COLS: Record<number, string> = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4", 5: "sm:grid-cols-5" };

/** Se enciende un instante después de montar: dispara las transiciones de entrada (como el hero de la web). */
function useReveal(dep?: unknown) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(false);
    const t = setTimeout(() => setOn(true), 60);
    return () => clearTimeout(t);
  }, [dep]);
  return on;
}

/**
 * Estrategia: de lo general a lo particular.
 *   MEGA (una, 5–10 años) → Líneas de Acción (3 a 5, propias del negocio) → KPIs y proyectos de cada línea.
 * Diseño limpio: la cascada arriba, el detalle de la línea elegida abajo. La explicación vive en el botón «?».
 */
export default function Estrategia() {
  const s = useMetis();
  const isAdmin = s.userOf(s.currentUserId).role === "admin";
  const [mega, setMega] = useState<StrategicObjective | null>(null);
  const [lae, setLae] = useState<LAE | null>(null);
  const [unify, setUnify] = useState(false);
  const [ideas, setIdeas] = useState(false);
  const [del, setDel] = useState<LAE | null>(null);
  const [selId, setSelId] = useState<string | null>(null);

  const current = s.objectives[0];
  const extra = s.objectives.length > 1;
  const laes = current ? (extra ? s.laes : s.laes.filter((l) => l.objectiveId === current.id)) : [];
  const sel = laes.find((l) => l.id === selId) ?? laes[0];
  const elsOf = (l: LAE) => s.elements.filter((e) => e.laeId === l.id);
  const ownersOf = (elementId: string) => [...new Set(s.elementScopes.filter((es) => es.elementId === elementId).map((es) => es.ownerUserId).filter(Boolean))];
  const peopleOf = (l: LAE) => [...new Set(elsOf(l).flatMap((e) => ownersOf(e.id)))];
  const maxEls = Math.max(1, ...laes.map((l) => elsOf(l).length));
  const on = useReveal(laes.length);

  const newMega = () => setMega({ id: newId(), name: "", horizon: String(s.year + 6) });
  const newLae = (idea?: PillarIdea) => current && setLae({ id: newId(), objectiveId: current.id, name: idea?.name ?? "", description: idea?.description, color: COLORS[s.laes.length % COLORS.length] });
  const n = Math.min(Math.max(laes.length, 1), 5);

  return (
    <>
      {/* Encabezado mínimo */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Estrategia</h1>
          <p className="mt-1 text-sm text-slate-500">La MEGA, las líneas de acción que la hacen posible y lo que medimos y ejecutamos en cada una.</p>
        </div>
        {isAdmin && current && (
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setIdeas(true)}><Lightbulb size={14} /> Ideas</button>
            <button className="btn-primary" onClick={() => newLae()}><Plus size={14} /> Línea de acción</button>
          </div>
        )}
      </div>

      {extra && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-soft px-4 py-3 text-sm text-amber">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="min-w-0 flex-1">Tu estrategia tiene {s.objectives.length} objetivos, pero parte de <b>una sola MEGA</b>. Elige cuál es; no se pierde ningún KPI ni proyecto.</span>
          {isAdmin && <button className="btn-ghost !bg-white !py-1.5 text-xs" onClick={() => setUnify(true)}>Elegir la MEGA</button>}
        </div>
      )}

      {!current ? (
        /* Estado vacío: una sola pregunta, un solo botón */
        <div className="card academy-in mx-auto max-w-2xl p-8 text-center sm:p-10">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-soft text-indigo"><Mountain size={22} /></span>
          <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo">Paso 1 · La MEGA</div>
          <h2 className="mt-2 text-xl font-semibold sm:text-2xl">¿Qué quiere lograr {s.tenant.name} en los próximos 5 a 10 años?</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Una meta grande y ambiciosa: audaz, clara, medible y con fecha. Es el faro que guía todo lo demás.</p>
          <p className="mx-auto mt-4 max-w-lg rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">«Ser la empresa líder de software logístico en América Latina, con 50 millones de dólares de facturación en 2032».</p>
          {isAdmin ? <button className="btn-primary mt-6" onClick={newMega}><Plus size={14} /> Definir la MEGA</button>
            : <p className="mt-6 text-xs text-slate-400">Un administrador de {s.tenant.name} la define.</p>}
        </div>
      ) : (
        <>
          {/* La cascada: MEGA → líneas de acción */}
          <section className="card p-5 sm:p-7">
            <div className="flex items-center gap-2 text-sm font-semibold"><GitFork size={15} className="text-indigo" /> La estrategia, de lo general a lo particular</div>

            <div className="mt-5 rounded-3xl bg-slate-50 p-4 sm:p-6">
              {/* MEGA */}
              <div className={clsx("relative mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] px-5 py-4 text-center text-white shadow-card transition-all duration-500 motion-reduce:transition-none",
                on ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1")}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mint-light">MEGA{current.horizon ? ` · ${current.horizon}` : ""}</div>
                <div className="mt-1 text-[15px] font-semibold leading-snug sm:text-lg">{current.name}</div>
                {current.description && <p className="mx-auto mt-1.5 max-w-xl text-xs text-white/60">{current.description}</p>}
                {isAdmin && <button className="absolute right-2.5 top-2.5 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white" onClick={() => setMega(current)} aria-label="Editar MEGA" title="Editar la MEGA"><Pencil size={13} /></button>}
              </div>

              {/* Conectores */}
              {laes.length > 0 && (
                <div className="relative h-6" aria-hidden>
                  <div className={clsx("absolute left-1/2 top-0 w-px bg-indigo/25 transition-all duration-500 motion-reduce:transition-none", on ? "h-3" : "h-0")} style={{ transitionDelay: "250ms" }} />
                  {laes.length > 1 && (
                    <div className={clsx("absolute top-3 hidden h-px origin-center bg-indigo/25 transition-transform duration-500 motion-reduce:transition-none sm:block", on ? "scale-x-100" : "scale-x-0")}
                      style={{ left: `${50 / n}%`, right: `${50 / n}%`, transitionDelay: "450ms" }} />
                  )}
                </div>
              )}

              {/* Líneas de acción */}
              {laes.length === 0 ? (
                <div className="mt-6 text-center">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo">Paso 2 · Líneas de acción</div>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">¿Qué tiene que dominar la empresa, sí o sí, para lograr la MEGA? Elige de {LAE_MIN} a {LAE_MAX} pilares propios de tu negocio.</p>
                  {isAdmin && (
                    <div className="mt-4 flex justify-center gap-2">
                      <button className="btn-ghost" onClick={() => setIdeas(true)}><Lightbulb size={14} /> Ver ideas</button>
                      <button className="btn-primary" onClick={() => newLae()}><Plus size={14} /> Agregar la primera</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={clsx("grid grid-cols-2 gap-2.5", COLS[n])}>
                  {laes.map((l, i) => {
                    const els = elsOf(l);
                    const k = els.filter((e) => e.type === "kpi").length;
                    const p = els.length - k;
                    const ppl = peopleOf(l);
                    const active = sel?.id === l.id;
                    return (
                      <button key={l.id} onClick={() => setSelId(l.id)}
                        className={clsx("group relative overflow-hidden rounded-2xl border bg-white p-3 text-center transition-all duration-500 motion-reduce:transition-none",
                          active ? "border-indigo/40 ring-2 ring-indigo/15" : "border-slate-100 hover:border-slate-200 hover:shadow-card",
                          on ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5")}
                        style={{ transitionDelay: on ? `${650 + i * 110}ms` : "0ms" }}>
                        <span className="absolute inset-x-0 top-0 h-1" style={{ background: l.color ?? "#94A3B8" }} />
                        <div className="mt-1 min-h-[34px] text-[13px] font-medium leading-tight text-ink">{l.name}</div>
                        <div className="mt-1 text-[11px] text-slate-400">{k} KPI{k === 1 ? "" : "s"} · {p} proyecto{p === 1 ? "" : "s"}</div>
                        <div className="mt-2 flex h-5 justify-center -space-x-1.5">
                          {ppl.slice(0, 4).map((u, j) => (
                            <span key={u} className={clsx("transition-all duration-300 motion-reduce:transition-none", on ? "opacity-100 scale-100" : "opacity-0 scale-50")}
                              style={{ transitionDelay: on ? `${1100 + i * 110 + j * 80}ms` : "0ms" }}>
                              <Avatar initials={s.userOf(u).initials} size="sm" className="!h-5 !w-5 !text-[8px] ring-2 ring-white" />
                            </span>
                          ))}
                          {ppl.length > 4 && <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-[8px] font-semibold text-slate-500 ring-2 ring-white">+{ppl.length - 4}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {laes.length > 0 && (
                <p className={clsx("mt-4 text-center text-[11px] transition-opacity duration-500 motion-reduce:transition-none", on ? "opacity-100" : "opacity-0",
                  laes.length < LAE_MIN || laes.length > LAE_MAX ? "text-amber" : "text-slate-400")} style={{ transitionDelay: on ? "1300ms" : "0ms" }}>
                  {laes.length > LAE_MAX ? `${laes.length} líneas de acción: con más de ${LAE_MAX} no hay estrategia, hay una lista de deseos.`
                    : laes.length < LAE_MIN ? `${laes.length} de ${LAE_MIN}–${LAE_MAX} líneas de acción: te falta${LAE_MIN - laes.length === 1 ? "" : "n"} ${LAE_MIN - laes.length} para completar la estrategia.`
                    : `${laes.length} líneas de acción · La MEGA se evalúa una vez al año`}
                </p>
              )}
            </div>

            {/* Balance: barras animadas, como «Resultados» */}
            {laes.length > 1 && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-semibold text-ink"><BarChart3 size={13} className="text-indigo" /> KPIs y proyectos por línea</span>
                  <span>{laes.reduce((a, l) => a + elsOf(l).length, 0)} en total</span>
                </div>
                <div className="mt-2.5 space-y-2">
                  {laes.map((l, i) => {
                    const c = elsOf(l).length;
                    return (
                      <button key={l.id} onClick={() => setSelId(l.id)} className="flex w-full items-center gap-3 text-left text-xs">
                        <span className={clsx("w-28 truncate sm:w-44", sel?.id === l.id ? "font-medium text-ink" : "text-slate-500")}>{l.name}</span>
                        <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <span className="block h-full rounded-full transition-[width] duration-1000 ease-out motion-reduce:transition-none"
                            style={{ width: on ? `${(c / maxEls) * 100}%` : "0%", background: l.color ?? "#94A3B8", transitionDelay: on ? `${300 + i * 140}ms` : "0ms" }} />
                        </span>
                        <span className="w-5 text-right font-semibold tabular-nums text-ink">{c}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Detalle de la línea elegida */}
          {sel && <LaeDetail key={sel.id} lae={sel} isAdmin={isAdmin} onEdit={() => setLae(sel)} onDelete={() => setDel(sel)} ownersOf={ownersOf} />}
        </>
      )}
      {mega && (
        <Modal title={s.objectives.some((x) => x.id === mega.id) ? "Editar la MEGA" : "Definir la MEGA"} onClose={() => setMega(null)}
          canSave={!!mega.name.trim()} onSave={() => { s.upsertObjective({ ...mega, name: mega.name.trim() }); setMega(null); }}>
          <p className="mb-3 rounded-xl bg-indigo-soft/60 px-3 py-2 text-xs text-indigo">Audaz, clara, medible y con fecha. Debe servir de faro para toda la empresa durante los próximos 5 a 10 años.</p>
          <label className="label">¿Cuál es la MEGA?</label>
          <textarea className="input min-h-[72px]" value={mega.name} onChange={(e) => setMega({ ...mega, name: e.target.value })}
            placeholder="Ser la empresa líder de software logístico en América Latina, con 50 millones de dólares de facturación en 2032" autoFocus />
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div><label className="label">Año meta</label><input className="input" inputMode="numeric" value={mega.horizon ?? ""} onChange={(e) => setMega({ ...mega, horizon: e.target.value.replace(/\D/g, "").slice(0, 4) })} /></div>
          </div>
          <label className="label mt-3">¿Por qué importa? (opcional)</label>
          <textarea className="input min-h-[64px]" value={mega.description ?? ""} onChange={(e) => setMega({ ...mega, description: e.target.value })} placeholder="De dónde partimos y qué significa lograrlo." />
        </Modal>
      )}
      {lae && (
        <Modal title={s.laes.some((x) => x.id === lae.id) ? "Editar línea de acción" : "Nueva línea de acción"} onClose={() => setLae(null)}
          canSave={!!lae.name.trim()} onSave={() => { s.upsertLae({ ...lae, name: lae.name.trim(), description: lae.description?.trim() || undefined }); setLae(null); }}>
          <p className="mb-3 text-xs text-slate-500">Una capacidad, mercado o cambio que la empresa tiene que dominar sí o sí para lograr la MEGA. Ponle el nombre que tenga sentido en tu negocio; después le agregas sus KPIs y proyectos.</p>
          <label className="label">Nombre</label>
          <input className="input" value={lae.name} onChange={(e) => setLae({ ...lae, name: e.target.value })} placeholder="Expansión de mercado" autoFocus />
          <label className="label mt-3">¿Qué abarca? (opcional)</label>
          <input className="input" value={lae.description ?? ""} onChange={(e) => setLae({ ...lae, description: e.target.value })} placeholder="Comercial: abrir nuevos países y canales" />
          {s.objectives.length > 1 && (
            <>
              <label className="label mt-3">MEGA</label>
              <select className="input" value={lae.objectiveId} onChange={(e) => setLae({ ...lae, objectiveId: e.target.value })}>
                {s.objectives.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </>
          )}
          <label className="label mt-3">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setLae({ ...lae, color: c })} className="grid h-7 w-7 place-items-center rounded-full" style={{ background: c }} aria-label={c}>
                {lae.color === c && <Check size={14} className="text-white" />}
              </button>
            ))}
          </div>
          {s.laes.some((x) => x.id === lae.id) && (
            <button type="button" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-coral hover:underline" onClick={() => { setDel(lae); setLae(null); }}>
              <Trash2 size={12} /> Eliminar esta línea de acción
            </button>
          )}
        </Modal>
      )}
      {unify && <UnifyDialog onClose={() => setUnify(false)} />}
      {del && <DeleteLaeDialog lae={del} onClose={() => setDel(null)} />}
      {ideas && <IdeasDialog canAdd={isAdmin && !!current} existing={s.laes.map((l) => l.name.toLowerCase())}
        onPick={(idea) => { setIdeas(false); newLae(idea); }} onClose={() => setIdeas(false)} />}
    </>
  );
}


/** Detalle de una línea de acción: lo que medimos (KPIs) y lo que ejecutamos (proyectos), con su responsable. */
function LaeDetail({ lae, isAdmin, onEdit, onDelete, ownersOf }: {
  lae: LAE; isAdmin: boolean; onEdit: () => void; onDelete: () => void; ownersOf: (elementId: string) => string[];
}) {
  const s = useMetis();
  const els = s.elements.filter((e) => e.laeId === lae.id);
  const kpis = els.filter((e) => e.type === "kpi");
  const projects = els.filter((e) => e.type === "project");
  return (
    <section className="card academy-in mt-4 overflow-hidden">
      <div className="h-1" style={{ background: lae.color ?? "#94A3B8" }} />
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold">{lae.name}</div>
            {lae.description && <p className="mt-0.5 text-sm text-slate-500">{lae.description}</p>}
          </div>
          {isAdmin && (
            <div className="flex shrink-0 gap-0.5">
              <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-indigo" onClick={onEdit} aria-label="Editar LAE" title="Editar"><Pencil size={14} /></button>
              <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-coral" onClick={onDelete} aria-label="Eliminar LAE" title="Eliminar"><Trash2 size={14} /></button>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <List icon={Gauge} title="KPIs" hint="Cómo medimos · cada mes" items={kpis} ownersOf={ownersOf}
            add={isAdmin ? `/config/catalogo?nuevo=kpi&lae=${lae.id}` : undefined} addLabel="Agregar KPI"
            empty="Agrega al menos un KPI para saber si esta línea avanza." />
          <List icon={FolderKanban} title="Proyectos estratégicos" hint="Qué ejecutamos · cada quincena" items={projects} ownersOf={ownersOf}
            add={isAdmin ? `/config/catalogo?nuevo=project&lae=${lae.id}` : undefined} addLabel="Agregar proyecto"
            empty="Sin proyectos todavía. Lo ideal: 1 o 2 de alto impacto al año."
            warn={projects.length > 2 ? "Prioriza: lo ideal son 1 o 2 proyectos de alto impacto por línea al año." : undefined} />
        </div>
      </div>
    </section>
  );
}

function List({ icon: Icon, title, hint, items, ownersOf, add, addLabel, empty, warn }: {
  icon: typeof Gauge; title: string; hint: string; items: { id: string; name: string }[]; ownersOf: (id: string) => string[];
  add?: string; addLabel: string; empty: string; warn?: string;
}) {
  const s = useMetis();
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold"><Icon size={14} className="text-indigo" /> {title}</span>
        <span className="text-xs text-slate-400">{hint}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-400">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {items.map((it, i) => {
            const owners = ownersOf(it.id);
            const u = owners[0] ? s.userOf(owners[0]) : null;
            return (
              <li key={it.id} className="academy-in flex items-center gap-3 py-2.5" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="min-w-0 flex-1 truncate text-sm">{it.name}</span>
                {u ? (
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500" title={`Responsable: ${u.name}`}>
                    <Avatar initials={u.initials} size="sm" />
                    <span className="hidden max-w-[8rem] truncate md:inline">{u.name.split(" ")[0]}</span>
                    {owners.length > 1 && <span className="text-slate-400">+{owners.length - 1}</span>}
                  </span>
                ) : <span className="shrink-0 rounded-full bg-amber-soft px-2 py-0.5 text-[11px] text-amber">Sin dueño</span>}
              </li>
            );
          })}
        </ul>
      )}
      {warn && <p className="mt-2 text-xs text-amber">{warn}</p>}
      {add && <Link href={add} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo hover:underline"><Plus size={12} /> {addLabel}</Link>}
    </div>
  );
}

/** Para clientes que ya tenían varios objetivos: se elige la MEGA y las LAE de los demás pasan a ella. */
function UnifyDialog({ onClose }: { onClose: () => void }) {
  const s = useMetis();
  const [pick, setPick] = useState(s.objectives[0]?.id ?? "");
  const save = () => {
    s.objectives.filter((o) => o.id !== pick).forEach((o) => s.removeObjective(o.id, pick));
    onClose();
  };
  return (
    <Modal title="¿Cuál es la MEGA?" onClose={onClose} canSave={!!pick} onSave={save} saveLabel="Usar como MEGA">
      <p className="mb-3 text-sm text-slate-500">Elige la meta grande y ambiciosa de la empresa. Las líneas de acción de los demás objetivos se pasan a ella, con todos sus KPIs y proyectos. Después puedes editar el texto de la MEGA.</p>
      <div className="space-y-2">
        {s.objectives.map((o) => (
          <label key={o.id} className={clsx("flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm", pick === o.id ? "border-indigo bg-indigo-soft/40" : "border-slate-200")}>
            <input type="radio" className="mt-1" checked={pick === o.id} onChange={() => setPick(o.id)} />
            <span className="min-w-0">
              <span className="font-medium">{o.name}</span>
              <span className="block text-xs text-slate-400">{s.laes.filter((l) => l.objectiveId === o.id).length} líneas de acción</span>
            </span>
          </label>
        ))}
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose, onSave, canSave, saveLabel = "Guardar" }: { title: string; children: React.ReactNode; onClose: () => void; onSave: () => void; canSave: boolean; saveLabel?: string }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/30 p-4 sm:items-center" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-ink"><X size={18} /></button></div>
        {children}
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={!canSave} onClick={onSave}>{saveLabel}</button></div>
      </div>
    </div>
  );
}

/** Inspiración: los pilares cambian por completo según la MEGA. Nada aquí es obligatorio. */
function IdeasDialog({ canAdd, existing, onPick, onClose }: { canAdd: boolean; existing: string[]; onPick: (i: PillarIdea) => void; onClose: () => void }) {
  const [set, setSet] = useState(PILLAR_SETS[0].id);
  const cur = PILLAR_SETS.find((x) => x.id === set) ?? PILLAR_SETS[0];
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/30 p-4 sm:items-center" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Ideas de pilares según tu MEGA</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-ink" aria-label="Cerrar"><X size={16} /></button>
        </div>
        <p className="mt-1 text-sm text-slate-500">No hay pilares obligatorios: nacen de la naturaleza de tu negocio y de los obstáculos que te separan de la MEGA. Úsalos como inspiración y modifícalos, fusiónalos o cámbialos.</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {PILLAR_SETS.map((p) => (
            <button key={p.id} onClick={() => setSet(p.id)}
              className={clsx("rounded-full px-3 py-1 text-xs font-medium", set === p.id ? "bg-indigo text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">{cur.when}</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {cur.ideas.map((i) => {
            const has = existing.includes(i.name.toLowerCase());
            return (
              <li key={i.name} className="flex items-start gap-2 rounded-xl border border-slate-200 p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{i.name}</div>
                  <div className="text-xs text-slate-500">{i.description}</div>
                </div>
                {canAdd && (has
                  ? <span className="shrink-0 text-xs text-sob">Ya la tienes</span>
                  : <button className="shrink-0 text-xs font-medium text-indigo hover:underline" onClick={() => onPick(i)}>Usar</button>)}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500"><b>Regla de oro:</b> elige entre {LAE_MIN} y {LAE_MAX} pilares. Si tienes 7 u 8, no tienes estrategia, tienes una lista de deseos.</p>
      </div>
    </div>
  );
}

/** Borrar una LAE. Si tiene KPIs o proyectos, primero se elige a qué línea pasarlos: nunca se pierden. */
function DeleteLaeDialog({ lae, onClose }: { lae: LAE; onClose: () => void }) {
  const s = useMetis();
  const els = s.elements.filter((e) => e.laeId === lae.id);
  const others = s.laes.filter((l) => l.id !== lae.id);
  const [to, setTo] = useState(others[0]?.id ?? "");
  const [err, setErr] = useState("");
  const blocked = els.length > 0 && others.length === 0;
  const save = () => {
    const r = s.removeLae(lae.id, els.length ? to : undefined);
    if (!r.ok) { setErr(r.reason ?? "No se pudo eliminar."); return; }
    onClose();
  };
  return (
    <Modal title="Eliminar línea de acción" onClose={onClose} canSave={!blocked && (els.length === 0 || !!to)} onSave={save} saveLabel="Eliminar">
      <p className="text-sm text-slate-600">¿Seguro que quieres eliminar <b>{lae.name}</b>?</p>
      {els.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">No tiene KPIs ni proyectos, así que no se pierde nada.</p>
      ) : blocked ? (
        <p className="mt-3 rounded-xl bg-amber-soft px-3 py-2 text-xs text-amber">Tiene {els.length} KPI(s) o proyecto(s) y es la única línea de acción. Crea otra línea primero para pasarle sus KPIs y proyectos.</p>
      ) : (
        <>
          <p className="mt-2 text-xs text-slate-500">Tiene {els.length} KPI(s) o proyecto(s). No se borran: pasan a la línea que elijas, con sus responsables y resultados.</p>
          <ul className="mt-2 max-h-28 overflow-y-auto rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {els.map((e) => <li key={e.id} className="truncate">· {e.name}</li>)}
          </ul>
          <label className="label mt-3">Pasarlos a</label>
          <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>
            {others.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </>
      )}
      {err && <p className="mt-2 text-xs text-coral">{err}</p>}
    </Modal>
  );
}
