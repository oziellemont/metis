"use client";
import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Plus, Pencil, Check, X, Mountain, Flag, Gauge, FolderKanban, CalendarClock, UserCheck, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import { useMetis, newId } from "@/lib/store";
import { PageHeader } from "@/components/ui/primitives";
import type { LAE, StrategicObjective } from "@/lib/domain/types";

const COLORS = ["#4F3FE0", "#14C98E", "#2FA7F5", "#F5A524", "#F2545B", "#8B5CF6", "#0EA5A4", "#64748B"];

/**
 * Estrategia: de lo general a lo particular.
 *   1. MEGA (Meta Estratégica Grande y Ambiciosa, 5–10 años) · una por empresa
 *   2. LAE (Líneas de Acción Estratégica) · 3 o 4 pilares para lograr la MEGA
 *   3. KPIs (cómo medimos) y Proyectos (qué ejecutamos) · cuelgan de cada LAE
 */
export default function Estrategia() {
  const s = useMetis();
  const isAdmin = s.userOf(s.currentUserId).role === "admin";
  const [mega, setMega] = useState<StrategicObjective | null>(null);
  const [lae, setLae] = useState<LAE | null>(null);
  const [unify, setUnify] = useState(false);

  const current = s.objectives[0];
  const extra = s.objectives.length > 1;
  const laes = current ? (extra ? s.laes : s.laes.filter((l) => l.objectiveId === current.id)) : [];
  const elsOf = (l: LAE) => s.elements.filter((e) => e.laeId === l.id);
  const withKpi = laes.filter((l) => elsOf(l).some((e) => e.type === "kpi")).length;

  const steps = [
    { n: 1, label: "MEGA", hint: "La meta grande a 5–10 años", done: !!current },
    { n: 2, label: "Líneas de Acción (LAE)", hint: "3 o 4 pilares", done: laes.length >= 3 },
    { n: 3, label: "KPIs y proyectos", hint: "En cada LAE", done: laes.length > 0 && withKpi === laes.length },
  ];

  const newMega = () => setMega({ id: newId(), name: "", horizon: String(s.year + 6) });
  const newLae = () => current && setLae({ id: newId(), objectiveId: current.id, name: "", color: COLORS[s.laes.length % COLORS.length] });

  return (
    <>
      <PageHeader
        title={`Estrategia · ${s.tenant.name}`}
        subtitle="De lo general a lo particular: primero la MEGA, luego las Líneas de Acción Estratégica (LAE) que la hacen posible y, en cada LAE, los KPIs y proyectos que la bajan a la realidad."
      />
      {!isAdmin && <div className="card p-4 mb-4 text-sm text-slate-500">Sólo los administradores de {s.tenant.name} pueden editar la estrategia.</div>}

      {/* Los 3 pasos */}
      <ol className="grid gap-2 sm:grid-cols-3 mb-5">
        {steps.map((st, i) => {
          const active = !st.done && steps.slice(0, i).every((x) => x.done);
          return (
            <li key={st.n} className={clsx("card flex items-center gap-3 p-3", active && "ring-2 ring-indigo/30")}>
              <span className={clsx("grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold", st.done ? "bg-mint text-white" : active ? "bg-indigo text-white" : "bg-slate-100 text-slate-400")}>
                {st.done ? <Check size={15} /> : st.n}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{st.label}</div>
                <div className="text-xs text-slate-400">{st.hint}</div>
              </div>
              {i < steps.length - 1 && <ArrowRight size={14} className="ml-auto hidden text-slate-300 sm:block" />}
            </li>
          );
        })}
      </ol>

      {/* Paso 1 · MEGA */}
      {!current ? (
        <div className="rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 text-white sm:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-mint-light"><Mountain size={14} /> Paso 1 · La MEGA</div>
          <h2 className="mt-2 text-2xl font-semibold">¿Qué quiere lograr {s.tenant.name} en los próximos 5 a 10 años?</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/70">La MEGA (Meta Estratégica Grande y Ambiciosa) es el objetivo supremo de la empresa: el «faro» que guía todo lo demás. Debe ser audaz, clara y medible, con una fecha.</p>
          <p className="mt-3 max-w-2xl rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80"><span className="font-semibold text-white">Ejemplo:</span> «Convertirnos en la empresa líder de software logístico en América Latina, alcanzando 50 millones de dólares en facturación para 2032».</p>
          {isAdmin && <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-white hover:bg-mint-light" onClick={newMega}><Plus size={15} /> Definir la MEGA</button>}
        </div>
      ) : (
        <div id={`obj-${current.id}`} className="scroll-mt-24 rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 text-white sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10"><Mountain size={20} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-light">MEGA{current.horizon ? ` · meta ${current.horizon}` : ""}</div>
              <h2 className="mt-1 text-xl font-semibold leading-snug sm:text-2xl">{current.name}</h2>
              {current.description && <p className="mt-2 max-w-3xl text-sm text-white/70">{current.description}</p>}
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/50"><CalendarClock size={12} /> Se evalúa una vez al año</p>
            </div>
            {isAdmin && <button className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => setMega(current)} aria-label="Editar MEGA"><Pencil size={15} /></button>}
          </div>
        </div>
      )}

      {/* Clientes con varios «objetivos» de la versión anterior */}
      {extra && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-soft px-4 py-3 text-sm text-amber ring-1 ring-amber/30">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="min-w-0 flex-1">Tu estrategia tiene {s.objectives.length} objetivos. La estrategia parte de <b>una sola MEGA</b>; elige cuál es y sus LAE se juntan debajo de ella. No se pierde ningún KPI ni proyecto.</span>
          {isAdmin && <button className="btn-ghost !bg-white !py-1.5 text-xs" onClick={() => setUnify(true)}>Elegir la MEGA</button>}
        </div>
      )}

      {/* Paso 2 · LAE */}
      {current && (
        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo"><Flag size={13} /> Paso 2 · Líneas de Acción Estratégica</div>
              <p className="mt-1 text-sm text-slate-500">Los 3 o 4 grandes pilares en los que la empresa se enfoca para lograr la MEGA. Por ejemplo: Comercial, Operación, Cliente y Talento.</p>
            </div>
            <span className={clsx("chip", laes.length >= 3 && laes.length <= 4 ? "bg-mint-soft text-sob" : "bg-amber-soft text-amber")}>
              {laes.length} de 3–4 pilares
            </span>
            {isAdmin && <button className="btn-primary" onClick={newLae}><Plus size={14} /> Agregar LAE</button>}
          </div>
          {laes.length > 4 && <p className="mb-3 text-xs text-amber">Tienes más de 4 líneas de acción. Si todo es prioridad, nada lo es: considera juntar algunas.</p>}

          {laes.length === 0 ? (
            <div className="card p-8 text-center text-sm text-slate-500">Aún no hay líneas de acción. {isAdmin && "Agrega el primer pilar que hará posible la MEGA."}</div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {laes.map((l) => {
                const els = elsOf(l);
                const kpis = els.filter((e) => e.type === "kpi");
                const projects = els.filter((e) => e.type === "project");
                const owners = (id: string) => new Set(s.elementScopes.filter((es) => es.elementId === id).map((es) => es.ownerUserId)).size;
                return (
                  <div key={l.id} id={`lae-${l.id}`} className="card scroll-mt-24 overflow-hidden">
                    <div className="h-1.5" style={{ background: l.color ?? "#94A3B8" }} />
                    <div className="p-5">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] uppercase tracking-wider text-slate-400">Línea de Acción Estratégica</div>
                          <div className="font-semibold">{l.name}</div>
                          {l.description && <p className="mt-0.5 text-xs text-slate-500">{l.description}</p>}
                        </div>
                        {isAdmin && <button className="p-1 text-slate-400 hover:text-indigo" onClick={() => setLae(l)} aria-label="Editar LAE"><Pencil size={14} /></button>}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <Column icon={Gauge} title="KPIs" hint="Cómo medimos el éxito · revisión mensual" empty="Sin KPIs todavía"
                          items={kpis.map((e) => ({ id: e.id, name: e.name, owners: owners(e.id) }))}
                          add={isAdmin ? `/config/catalogo?nuevo=kpi&lae=${l.id}` : undefined} addLabel="KPI" />
                        <Column icon={FolderKanban} title="Proyectos estratégicos" hint="Qué ejecutamos · seguimiento quincenal" empty="Sin proyectos todavía"
                          items={projects.map((e) => ({ id: e.id, name: e.name, owners: owners(e.id) }))}
                          add={isAdmin ? `/config/catalogo?nuevo=project&lae=${l.id}` : undefined} addLabel="Proyecto" />
                      </div>
                      {projects.length > 2 && <p className="mt-3 text-xs text-amber">Prioriza: lo recomendable es 1 o 2 proyectos de alto impacto por línea cada año.</p>}
                      {kpis.length === 0 && <p className="mt-3 text-xs text-slate-400">Paso 3: agrega al menos un KPI para saber si esta línea avanza.</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Cómo asegurar que funcione */}
      {current && (
        <section className="mt-6 card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Lightbulb size={15} className="text-amber" /> Para que la estrategia sí baje</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
            <Tip icon={Flag} title="Prioriza">Máximo 1 o 2 proyectos de alto impacto por línea de acción cada año.</Tip>
            <Tip icon={UserCheck} title="Un solo dueño">Cada KPI y cada proyecto tiene un único responsable (Owner), normalmente un director o gerente.</Tip>
            <Tip icon={CalendarClock} title="Ritmo de gestión">Los KPIs se revisan cada mes, los proyectos cada quincena y la MEGA una vez al año.</Tip>
          </div>
        </section>
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
          <p className="mb-3 text-xs text-slate-500">Un pilar que la empresa necesita para lograr la MEGA. Después le agregas sus KPIs y proyectos.</p>
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
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setLae({ ...lae, color: c })} className="grid h-7 w-7 place-items-center rounded-full" style={{ background: c }} aria-label={c}>
                {lae.color === c && <Check size={14} className="text-white" />}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {unify && <UnifyDialog onClose={() => setUnify(false)} />}
    </>
  );
}

function Column({ icon: Icon, title, hint, items, empty, add, addLabel }: {
  icon: typeof Gauge; title: string; hint: string; items: { id: string; name: string; owners: number }[]; empty: string; add?: string; addLabel: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink"><Icon size={13} className="text-indigo" /> {title} <span className="font-normal text-slate-400">· {items.length}</span></div>
      <div className="text-[11px] text-slate-400">{hint}</div>
      {items.length === 0 ? <div className="mt-2 text-xs text-slate-400">{empty}</div> : (
        <ul className="mt-2 space-y-1">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-2 text-xs">
              <span className="h-1 w-1 shrink-0 rounded-full bg-slate-400" />
              <span className="min-w-0 flex-1 truncate">{it.name}</span>
              {it.owners === 0 && <span className="shrink-0 text-[10px] text-amber">sin dueño</span>}
            </li>
          ))}
        </ul>
      )}
      {add && <Link href={add} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo hover:underline"><Plus size={12} /> {addLabel}</Link>}
    </div>
  );
}

function Tip({ icon: Icon, title, children }: { icon: typeof Flag; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 font-medium"><Icon size={14} className="text-indigo" /> {title}</div>
      <p className="mt-1 text-xs text-slate-500">{children}</p>
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
