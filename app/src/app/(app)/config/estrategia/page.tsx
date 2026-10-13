"use client";
import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Plus, Pencil, Trash2, Check, X, Mountain, Gauge, FolderKanban, AlertTriangle, Lightbulb, GitFork } from "lucide-react";
import { useMetis, newId } from "@/lib/store";
import { Avatar } from "@/components/ui/primitives";
import type { LAE, StrategicObjective } from "@/lib/domain/types";
import { LAE_MIN, LAE_MAX, PILLAR_SETS, type PillarIdea } from "@/lib/strategy/pillars";

/** Un solo color de marca para todas las líneas: el morado de mêtis. */
const BRAND = "#4F3FE0";
const COLS: Record<number, string> = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5" };

/** Retraso (ms) para cada pieza del árbol: MEGA → conectores → líneas → KPIs y proyectos. */
const T = { mega: 0, stem: 350, bar: 550, lae: 800, laeStep: 150, rail: 250, box: 120, boxStep: 80 };
const d = (ms: number) => ({ animationDelay: `${ms}ms` });
/** Centro horizontal de la columna i (de n) dentro de una cuadrícula con separación de 12px. */
const colX = (i: number, n: number) => `calc((100% - ${(n - 1) * 12}px) / ${n} * ${i + 0.5} + ${i * 12}px)`;

/**
 * Estrategia: de lo general a lo particular.
 *   MEGA (una, 5–10 años) → Líneas de Acción (3 a 5, propias del negocio) → KPIs y proyectos de cada línea.
 * Todo se ve como un árbol que se despliega al abrir la página (igual que la cascada de la web).
 * La explicación y las reglas viven en el botón «?».
 */
export default function Estrategia() {
  const s = useMetis();
  const isAdmin = s.userOf(s.currentUserId).role === "admin";
  const [mega, setMega] = useState<StrategicObjective | null>(null);
  const [lae, setLae] = useState<LAE | null>(null);
  const [unify, setUnify] = useState(false);
  const [ideas, setIdeas] = useState(false);
  const [del, setDel] = useState<LAE | null>(null);

  const current = s.objectives[0];
  const extra = s.objectives.length > 1;
  const laes = current ? (extra ? s.laes : s.laes.filter((l) => l.objectiveId === current.id)) : [];
  const ownersOf = (elementId: string) => [...new Set(s.elementScopes.filter((es) => es.elementId === elementId).map((es) => es.ownerUserId).filter(Boolean))];
  const laesEnd = T.lae + laes.length * T.laeStep;

  const newMega = () => setMega({ id: newId(), name: "", horizon: String(s.year + 6) });
  const newLae = (idea?: PillarIdea) => current && setLae({ id: newId(), objectiveId: current.id, name: idea?.name ?? "", description: idea?.description, color: BRAND });
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
        <section className="card p-5 sm:p-7">
          <div className="flex items-center gap-2 text-sm font-semibold"><GitFork size={15} className="text-indigo" /> La estrategia, de lo general a lo particular</div>

          <div className="mt-5 rounded-3xl bg-slate-50 p-4 sm:p-6">
            {/* MEGA */}
            <div id={`obj-${current.id}`} className="tree-drop relative mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] px-5 py-4 text-center text-white shadow-card" style={d(T.mega)}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mint-light">MEGA{current.horizon ? ` · ${current.horizon}` : ""}</div>
              <div className="mt-1 text-[15px] font-semibold leading-snug sm:text-lg">{current.name}</div>
              {current.description && <p className="mx-auto mt-1.5 max-w-xl text-xs text-white/60">{current.description}</p>}
              {isAdmin && <button className="absolute right-2.5 top-2.5 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white" onClick={() => setMega(current)} aria-label="Editar MEGA" title="Editar la MEGA"><Pencil size={13} /></button>}
            </div>

            {laes.length === 0 ? (
              <div className="academy-in mt-6 text-center" style={d(T.stem)}>
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
              <>
                {/* Conectores MEGA → líneas */}
                <div className="relative h-5" aria-hidden>
                  <div className="tree-grow-y absolute left-1/2 top-0 h-2.5 w-px bg-indigo/30" style={d(T.stem)} />
                  {laes.length > 1 && (
                    <div className="tree-grow-x absolute top-2.5 hidden h-px bg-indigo/30 md:block" style={{ left: colX(0, n), right: colX(0, n), ...d(T.bar) }} />
                  )}
                  {laes.length > 1 && laes.map((l, i) => (
                    <div key={l.id} className="tree-grow-y absolute top-2.5 hidden h-2.5 w-px bg-indigo/30 md:block" style={{ left: colX(i, n), ...d(T.lae + i * T.laeStep - 120) }} />
                  ))}
                </div>

                {/* Líneas de acción, cada una con sus KPIs y proyectos debajo */}
                <div className={clsx("grid gap-4 md:gap-3", COLS[n])}>
                  {laes.map((l, i) => (
                    <LaeColumn key={l.id} lae={l} i={i} laesEnd={laesEnd} isAdmin={isAdmin} ownersOf={ownersOf}
                      onEdit={() => setLae(l)} onDelete={() => setDel(l)} />
                  ))}
                </div>
              </>
            )}

            {laes.length > 0 && (
              <p className={clsx("academy-in mt-5 text-center text-[11px]", laes.length < LAE_MIN || laes.length > LAE_MAX ? "text-amber" : "text-slate-400")} style={d(laesEnd + 600)}>
                {laes.length > LAE_MAX ? `${laes.length} líneas de acción: con más de ${LAE_MAX} no hay estrategia, hay una lista de deseos.`
                  : laes.length < LAE_MIN ? `${laes.length} de ${LAE_MIN}–${LAE_MAX} líneas de acción: te falta${LAE_MIN - laes.length === 1 ? "" : "n"} ${LAE_MIN - laes.length} para completar la estrategia.`
                  : `${laes.length} líneas de acción · La MEGA se evalúa una vez al año`}
              </p>
            )}
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

/** Una rama del árbol: la línea de acción y, colgando de ella, sus KPIs y proyectos con su responsable. */
function LaeColumn({ lae, i, laesEnd, isAdmin, ownersOf, onEdit, onDelete }: {
  lae: LAE; i: number; laesEnd: number; isAdmin: boolean; ownersOf: (elementId: string) => string[]; onEdit: () => void; onDelete: () => void;
}) {
  const s = useMetis();
  const els = s.elements.filter((e) => e.laeId === lae.id);
  const kpis = els.filter((e) => e.type === "kpi");
  const projects = els.filter((e) => e.type === "project");
  const start = T.lae + i * T.laeStep;
  // Las cajitas bajan después de que aparecen todas las líneas, rama por rama.
  const boxStart = laesEnd + T.rail + i * 60;

  return (
    <div className="flex min-w-0 flex-col">
      {/* Tarjeta de la línea de acción */}
      <div id={`lae-${lae.id}`} className="tree-pop group relative rounded-2xl border border-slate-100 bg-white px-3 pb-3 pt-3.5 text-center shadow-sm" style={d(start)}>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo/70">Línea {i + 1}</div>
        <div className="mt-1 text-[13px] font-semibold leading-tight text-ink">{lae.name}</div>
        {lae.description && <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-400">{lae.description}</div>}
        {isAdmin && (
          <div className="absolute right-1.5 top-1.5 flex gap-0.5 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <button className="rounded-md p-1 text-slate-300 hover:bg-slate-50 hover:text-indigo" onClick={onEdit} aria-label="Editar LAE" title="Editar"><Pencil size={12} /></button>
            <button className="rounded-md p-1 text-slate-300 hover:bg-slate-50 hover:text-coral" onClick={onDelete} aria-label="Eliminar LAE" title="Eliminar"><Trash2 size={12} /></button>
          </div>
        )}
      </div>

      {/* Riel: de la línea bajan sus KPIs y proyectos */}
      <div className="relative ml-4 mt-0 flex-1 pl-3 pt-2">
        <span className="tree-grow-y absolute bottom-2 left-0 top-0 w-px bg-indigo/20" style={d(boxStart - 150)} aria-hidden />
        <Group icon={Gauge} label="KPIs" items={kpis} ownersOf={ownersOf} start={boxStart} empty="Sin KPIs todavía" />
        <Group icon={FolderKanban} label="Proyectos" items={projects} ownersOf={ownersOf} start={boxStart + (kpis.length + 1) * T.boxStep} empty="Sin proyectos todavía"
          warn={projects.length > 2 ? "Lo ideal: 1 o 2 por línea" : undefined} />
        {isAdmin && (
          <div className="academy-in mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]" style={d(boxStart + (els.length + 2) * T.boxStep)}>
            <Link href={`/config/catalogo?nuevo=kpi&lae=${lae.id}`} className="inline-flex items-center gap-0.5 font-medium text-indigo/80 hover:text-indigo hover:underline"><Plus size={11} /> KPI</Link>
            <Link href={`/config/catalogo?nuevo=project&lae=${lae.id}`} className="inline-flex items-center gap-0.5 font-medium text-indigo/80 hover:text-indigo hover:underline"><Plus size={11} /> Proyecto</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Group({ icon: Icon, label, items, ownersOf, start, empty, warn }: {
  icon: typeof Gauge; label: string; items: { id: string; name: string }[]; ownersOf: (id: string) => string[]; start: number; empty: string; warn?: string;
}) {
  const s = useMetis();
  return (
    <div className="mb-2.5">
      <div className="academy-in mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400" style={d(start)}>
        <Icon size={11} className="text-indigo/60" /> {label}
      </div>
      {items.length === 0 ? (
        <div className="academy-in rounded-xl border border-dashed border-slate-200 px-2.5 py-2 text-[11px] text-slate-400" style={d(start + T.boxStep)}>{empty}</div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it, j) => {
            const owners = ownersOf(it.id);
            const u = owners[0] ? s.userOf(owners[0]) : null;
            return (
              <li key={it.id} className="tree-slide relative flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 py-2" style={d(start + (j + 1) * T.boxStep)}>
                <span className="absolute -left-3 top-1/2 h-px w-3 bg-indigo/20" aria-hidden />
                <span className="min-w-0 flex-1 line-clamp-2 text-[12px] leading-snug text-ink" title={it.name}>{it.name}</span>
                {u ? (
                  <span className="flex shrink-0 items-center" title={`Responsable: ${u.name}${owners.length > 1 ? ` y ${owners.length - 1} más` : ""}`}>
                    <Avatar initials={u.initials} size="sm" className="!h-5 !w-5 !text-[8px]" />
                    {owners.length > 1 && <span className="ml-0.5 text-[10px] text-slate-400">+{owners.length - 1}</span>}
                  </span>
                ) : <span className="shrink-0 rounded-full bg-amber-soft px-1.5 py-0.5 text-[10px] text-amber" title="Asigna un responsable en el Catálogo">Sin dueño</span>}
              </li>
            );
          })}
        </ul>
      )}
      {warn && <p className="mt-1 text-[10.5px] text-amber">{warn}</p>}
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
