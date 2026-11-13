"use client";
/**
 * MÊTIS 2.0 · Repositorio Académico · pantalla de una experiencia inmersiva (en revisión).
 *
 * El recorrido se guarda solo en este navegador, para poder salir y continuar.
 * No escribe en el registro de evidencias, no cambia niveles ni perfil y no llama a ningún servicio.
 * Todo se hace tocando: nada depende de arrastrar ni solo del color.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { BookOpen, Calculator, Check, ChevronDown, ChevronUp, Clock, FileText, Info, RotateCcw, X } from "lucide-react";
import { academyById, skillById } from "@/lib/ceo/metis2/academias";
import {
  FUENTES, MAX_FIELD, MAX_REPLY, REVEAL_AFTER, advance, calc, correctOf, groupOk, newRun, nextOf, nodeOf, readRun, routeOf, rowsOf, stepOf, variantReady,
  type Accion, type Campo, type Documento, type Experiencia, type Grupo, type Nodo, type Opcion, type Recorrido, type Respuesta, type RutaTipo, type Tarea,
} from "@/lib/ceo/metis2/experiencias";
import { Stage, StageChoice, StepTitle } from "./Stage";

const fmt = (n: number) => (n < 0 ? "−" : "") + Math.abs(n).toLocaleString("en-US");
const QA_TEXT: Record<Experiencia["qa"]["estado"], string> = { importado: "Importado", probado: "Probado con pruebas automáticas", revisado: "Revisado por una persona", publicado: "Publicado", validado: "Validado con usuarios" };
const RUTA: Record<RutaTipo, { label: string; cls: string }> = {
  defendible: { label: "Ruta defendible", cls: "border-mint/50 bg-mint/10" },
  riesgosa: { label: "Ruta con riesgo", cls: "border-amber/50 bg-amber/10" },
  concepto_erroneo: { label: "Aquí hay una confusión", cls: "border-coral/50 bg-coral/10" },
};
const LETTERS = "ABCDEF";
const isObj = (v: unknown): v is Record<string, string> => !!v && typeof v === "object" && !Array.isArray(v);
const digits = (t: string) => { const d = t.replace(/\D/g, "").slice(0, 9); return d ? Number(d) : null; };
export type Marks = Record<string, { ok: boolean; text: string }>;
/** Dos documentos caben lado a lado solo si son listas cortas de importes; los de texto o columnas van uno bajo otro. */
const docGrid = (docs: Documento[]) => clsx("grid gap-4", docs.length > 1 && docs.every((d) => !d.cols && d.rows.every((r) => typeof r.amount === "number")) && "sm:grid-cols-2");

const storeKey = (x: Experiencia) => `metis:piloto:${x.id}`;

export function ExperienciaPiloto({ x }: { x: Experiencia }) {
  const [run, setRun] = useState<Recorrido | null>(null);
  const [sheet, setSheet] = useState<"docs" | "teoria" | "ficha" | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    let raw: unknown = null;
    try { raw = JSON.parse(window.localStorage.getItem(storeKey(x)) ?? "null"); } catch { raw = null; }
    setRun(readRun(x, raw));
  }, [x]);
  useEffect(() => { if (run) try { window.localStorage.setItem(storeKey(x), JSON.stringify(run)); } catch { /* sin espacio: se sigue sin guardar */ } }, [run, x]);
  useEffect(() => { window.scrollTo({ top: 0 }); setPicked(null); }, [run?.at, run?.phase]);

  if (!run) return <div className="min-h-screen grid place-items-center bg-[#0F1130]"><span className="h-8 w-8 rounded-full border-2 border-white border-t-transparent animate-spin" /></div>;

  const act = (a: Accion) => setRun((r) => (r ? advance(x, r, a) : r));
  const restart = () => { setDraft({}); setRun(newRun(x)); };
  const node = nodeOf(x, run.at)!;
  const step = stepOf(run);
  const learning = run.phase === "aprender";
  const openTheory = () => { act({ t: "teoria" }); setSheet("teoria"); };

  // Botón principal según el momento.
  let next: { label: string; off?: boolean; go: () => void } | null = null;
  let aside: React.ReactNode = null;
  if (learning) {
    const go = () => act({ t: "avanzar" });
    if (node.kind === "mensaje") next = { label: "Ver los documentos", go };
    else if (node.kind === "explorar") next = { label: "Ya los revisé", go };
    else if (node.kind === "decision") next = step.choice ? { label: "Continuar", go } : { label: "Responder", off: !picked, go: () => picked && act({ t: "elegir", option: picked }) };
    else if (node.kind === "senalar") next = { label: "Continuar", off: !nextOf(x, run), go };
    else if (node.kind === "dato") next = { label: "Continuar", go };
    else if (node.kind === "clasificar" || node.kind === "ordenar" || node.kind === "calcular") {
      if (step.solved) next = { label: "Continuar", go };
      else {
        const full = node.kind === "clasificar" ? node.items.every((i) => !!step.assign?.[i.id]) : node.kind === "calcular" ? node.fields.every((f) => typeof step.values?.[f.id] === "number") : true;
        next = { label: "Revisar", off: !full, go: () => act({ t: "revisar" }) };
        if ((step.checks ?? 0) >= REVEAL_AFTER) aside = <button type="button" onClick={() => act({ t: "revelar" })} className="min-h-[36px] py-2 text-sm text-white/65 hover:text-white">Ver la solución</button>;
      }
    } else if (node.kind === "redactar") {
      if (!(node.id in run.replies)) {
        const fields = node.fields ? Object.fromEntries(node.fields.map((f) => [f.id, draft[`${node.id}:${f.id}`] ?? ""])) : undefined;
        const text = node.fields ? Object.values(fields!).join("") : draft[node.id] ?? "";
        next = { label: "Enviar", off: !text.trim(), go: () => act({ t: "redactar", text, fields }) };
        aside = <button type="button" onClick={() => act({ t: "redactar", text: null })} className="min-h-[36px] py-2 text-sm text-white/65 hover:text-white">Prefiero no escribir</button>;
      } else next = { label: "Continuar", go };
    } else if (node.kind === "cierre") next = { label: "Comprobar con otra situación", go: () => act({ t: "comprobar" }) };
  } else if (run.phase === "demostrar") {
    next = { label: "Entregar", off: !variantReady(x, run), go: () => act({ t: "entregar" }) };
  }

  const steps = learning ? x.moments : ["Otra situación", "Resultado"];
  const at = learning ? node.moment : run.phase === "demostrar" ? 0 : 1;

  return (
    <>
      <Stage steps={steps} at={at} exit="/ceo/piloto" onNext={next?.go} next={next?.label} nextOff={next?.off} aside={aside}>
        <div data-noswipe key={`${run.phase}-${run.at}`} className="academy-in">
          <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2 text-xs text-white/75">
            <span className="inline-flex min-w-0 items-center gap-1.5"><Info size={13} className="shrink-0 text-mint" /> Experiencia en revisión. No cuenta para tu avance, tu nivel ni tu perfil.</span>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {learning && <button type="button" onClick={() => setSheet("docs")} className="inline-flex items-center gap-1 min-h-[36px] rounded-lg bg-white/10 px-3 py-2 font-medium text-white hover:bg-white/20"><FileText size={13} /> Documentos</button>}
              {learning && <button type="button" onClick={openTheory} className="inline-flex items-center gap-1 min-h-[36px] rounded-lg bg-white/10 px-3 py-2 font-medium text-white hover:bg-white/20"><BookOpen size={13} /> Concepto</button>}
              <button type="button" onClick={() => setSheet("ficha")} className="inline-flex items-center gap-1 min-h-[36px] rounded-lg bg-white/10 px-3 py-2 font-medium text-white hover:bg-white/20">Ficha</button>
            </div>
          </div>

          {learning && <NodeView x={x} run={run} node={node} act={act} picked={picked} setPicked={setPicked} draft={draft} setDraft={setDraft} openDocs={() => setSheet("docs")} openTheory={openTheory} />}
          {run.phase === "demostrar" && <VariantView x={x} run={run} act={act} />}
          {run.phase === "fin" && <ResultView x={x} run={run} restart={restart} />}
        </div>
      </Stage>

      {sheet && (
        <Sheet title={sheet === "docs" ? "Documentos" : sheet === "teoria" ? x.theory.title : "Ficha de la experiencia"} onClose={() => setSheet(null)}>
          {sheet === "docs" && <div className={docGrid(x.docs)}>{x.docs.map((d) => <DocCard key={d.id} doc={d} opened={run.opened} onOpen={(row) => act({ t: "abrir", row })} />)}</div>}
          {sheet === "teoria" && <p className="text-[15px] leading-relaxed text-slate-700">{x.theory.text}</p>}
          {sheet === "ficha" && <Ficha x={x} restart={() => { restart(); setSheet(null); }} />}
        </Sheet>
      )}
    </>
  );
}

// ───────────────────────────────────────────── piezas

export function Face({ name }: { name: string }) {
  return <span aria-hidden className="h-10 w-10 shrink-0 rounded-full bg-mint/90 text-ink grid place-items-center text-sm font-semibold">{name.slice(0, 1)}</span>;
}

function Bubble({ x, who, children, channel }: { x: Experiencia; who: string | null; children: React.ReactNode; channel?: string }) {
  const p = x.characters.find((c) => c.id === who);
  if (!p) return <div className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-[15px] leading-relaxed text-white/85">{children}</div>;
  return (
    <div className="flex items-start gap-3">
      <Face name={p.name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm"><span className="font-semibold">{p.name}</span><span className="text-white/55">{p.role}</span>{channel && <span className="chip bg-white/10 text-white/80">{channel}</span>}</div>
        <div className="mt-1.5 rounded-2xl rounded-tl-md bg-white px-4 py-3 text-[15px] leading-relaxed text-ink">{children}</div>
      </div>
    </div>
  );
}

export function Mine({ children }: { children: React.ReactNode }) {
  return <div className="ml-10 rounded-2xl rounded-tr-md bg-indigo-light px-4 py-3 text-[15px] leading-relaxed text-white"><div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Tú</div>{children}</div>;
}

/** Lo que alguien escribió: un texto, o cada campo con su rótulo. */
function Written({ value, fields }: { value: Record<string, string>; fields?: Campo[] }) {
  if (!fields) return <>{value.texto}</>;
  return <div className="space-y-1.5">{fields.map((f) => <div key={f.id}><div className="text-[12px] text-white/70">{f.label}</div><div>{value[f.id] || "Sin respuesta"}</div></div>)}</div>;
}

function Note({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div role="status" className={clsx("rounded-2xl border px-4 py-3.5", ok ? "border-mint/50 bg-mint/10" : "border-amber/50 bg-amber/10")}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">{ok ? "Eso es" : "Todavía no"}</div>
      <p className="mt-1 text-[15px] leading-relaxed text-white/90">{children}</p>
    </div>
  );
}

/**
 * Documento tocable. Modo «leer»: tocar un renglón abre su explicación.
 * Modo «señalar»: tocar un renglón es la respuesta. Sin `onOpen` ni `onPick` es un documento simple (variante).
 * Los renglones pueden traer un importe, columnas de datos o solo texto.
 */
export function DocCard({ doc, opened, onOpen, onPick, marks, chosen }: { doc: Documento; opened?: string[]; onOpen?: (row: string) => void; onPick?: (row: string) => void; marks?: Marks; chosen?: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const data = doc.cols ? doc.cols.length - 1 : 0;
  const long = doc.rows.some((r) => (r.cells ?? []).some((c) => c.length > 12));
  const ficha = data > 0 && (doc.layout === "ficha" || (doc.layout !== "tabla" && (data > 2 || long)));
  return (
    <div className="rounded-2xl bg-white text-ink shadow-card overflow-hidden">
      <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo">Documento {doc.letter}</div>
        <div className="text-sm font-semibold leading-snug">{doc.title}</div>
        <div className="text-xs text-slate-500">{doc.unit}</div>
      </div>
      {doc.cols && !ficha && (
        <div aria-hidden className="flex items-end gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100">
          <span className="min-w-0 flex-1">{doc.cols[0]}</span>
          {doc.cols.slice(1).map((c) => <span key={c} className="w-[4.75rem] shrink-0 text-right leading-tight">{c}</span>)}
          {onOpen && !onPick && <span className="w-[15px] shrink-0" />}
        </div>
      )}
      <ul>
        {doc.rows.map((r) => {
          const total = !!r.suma || !!r.strong;
          const mark = marks?.[r.id];
          const sel = !!chosen?.includes(r.id);
          const isOpen = open === r.id && !!r.nota && !onPick;
          const said = [r.label, ...(r.cells ?? []), typeof r.amount === "number" ? fmt(r.amount) : ""].filter(Boolean).join(", ");
          const line = (
            <span className={clsx("flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm", total && "font-semibold")}>
              {ficha ? (
                <span className="min-w-0 flex-1 leading-snug">
                  {r.cells!.length === 1
                    ? <><span className="block text-xs font-medium text-slate-500">{r.label}</span><span className="block">{r.cells![0]}</span></>
                    : <><span className="block font-semibold">{r.label}</span>{r.cells!.map((c, i) => <span key={i} className="mt-0.5 block"><span className="text-xs text-slate-500">{doc.cols![i + 1]}: </span>{c}</span>)}</>}
                </span>
              ) : (
                <>
                  <span className="min-w-0 flex-1 leading-snug">{r.label}</span>
                  {(r.cells ?? []).map((c, i) => <span key={i} className="w-[4.75rem] shrink-0 text-right tabular-nums">{c}</span>)}
                  {typeof r.amount === "number" && <span className="shrink-0 tabular-nums">{fmt(r.amount)}</span>}
                </>
              )}
              {onOpen && !onPick && (r.nota ? <ChevronDown size={15} aria-hidden className={clsx("mt-0.5 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")} /> : <span className="w-[15px] shrink-0" />)}
            </span>
          );
          return (
            <li key={r.id} className={clsx("border-b border-slate-100 last:border-b-0", total && "bg-slate-50", sel && "bg-indigo-soft", mark && (mark.ok ? "bg-mint-soft" : "bg-coral-soft"))}>
              {onPick
                ? <button type="button" aria-pressed={chosen ? sel : undefined} onClick={() => onPick(r.id)} aria-label={`Señalar: ${said}`} className="block w-full min-h-[40px] hover:bg-indigo-soft/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo">{line}</button>
                : onOpen && r.nota
                  ? <button type="button" aria-expanded={isOpen} onClick={() => { setOpen(isOpen ? null : r.id); if (!isOpen) onOpen(r.id); }} className="block w-full min-h-[40px] hover:bg-indigo-soft/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo">{line}</button>
                  : line}
              {isOpen && <p className="px-4 pb-3 -mt-0.5 text-[13px] leading-relaxed text-slate-600">{r.nota!.text}</p>}
              {sel && !mark && <p className="px-4 pb-2.5 -mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-indigo"><Check size={12} strokeWidth={3} aria-hidden /> Señalado</p>}
              {mark && <p role="status" className={clsx("px-4 pb-3 -mt-0.5 text-[13px] leading-relaxed", mark.ok ? "text-sob" : "text-coral")}>{mark.text}</p>}
              {!isOpen && !mark && opened?.includes(r.id) && onOpen && !onPick && <span className="sr-only">Ya consultado</span>}
            </li>
          );
        })}
      </ul>
      {doc.foot && <div className="px-4 py-2.5 text-xs text-slate-500 border-t border-slate-100">{doc.foot}</div>}
    </div>
  );
}

function Feedback({ o }: { o: Opcion }) {
  const r = RUTA[o.tipo];
  return (
    <div role="status" className={clsx("rounded-2xl border px-4 py-3.5", r.cls)}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">{r.label}</div>
      <p className="mt-1 text-[15px] leading-relaxed text-white/90">{o.feedback}</p>
    </div>
  );
}

/** Asignar tarjetas a grupos tocando el grupo en cada tarjeta. */
export function Sorter({ groups, items, assign, onAssign, locked, marks }: { groups: Grupo[]; items: { id: string; text: string }[]; assign: Record<string, string>; onAssign: (item: string, group: string) => void; locked?: boolean; marks?: Marks }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => {
        const mark = marks?.[it.id];
        return (
          <li key={it.id} className="rounded-2xl bg-white px-4 py-3.5 text-ink shadow-card">
            <div className="text-[15px] leading-relaxed">{it.text}</div>
            <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label={`Grupo para: ${it.text}`}>
              {groups.map((g) => {
                const on = assign[it.id] === g.id;
                return (
                  <button key={g.id} type="button" disabled={locked} aria-pressed={on} onClick={() => onAssign(it.id, g.id)}
                    className={clsx("inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-2 text-left text-sm leading-snug transition-colors", on ? "border-indigo bg-indigo text-white font-semibold" : "border-slate-200 bg-slate-50 text-slate-700", !locked && !on && "hover:border-indigo/50 hover:bg-indigo-soft/60", locked && !on && "opacity-50")}>
                    {on && <Check size={14} strokeWidth={3} aria-hidden className="shrink-0" />}{g.label}
                  </button>
                );
              })}
            </div>
            {mark && <p role="status" className={clsx("mt-2.5 text-[13px] leading-relaxed", mark.ok ? "text-sob" : "text-coral")}><span className="font-semibold">{mark.ok ? "Correcto. " : "Revisa esta tarjeta. "}</span>{mark.text}</p>}
          </li>
        );
      })}
    </ul>
  );
}

/** Poner tarjetas en secuencia con los botones de subir y bajar. */
export function Sequencer({ cards, order, onMove, locked }: { cards: { id: string; text: string }[]; order: string[]; onMove: (card: string, dir: -1 | 1) => void; locked?: boolean }) {
  return (
    <ol className="space-y-2.5">
      {order.map((id, i) => {
        const c = cards.find((k) => k.id === id)!;
        return (
          <li key={id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-ink shadow-card">
            <span aria-hidden className="h-7 w-7 shrink-0 rounded-full bg-indigo-soft text-indigo grid place-items-center text-xs font-bold">{i + 1}</span>
            <span className="min-w-0 flex-1 text-[15px] leading-snug">{c.text}</span>
            {!locked && (
              <span className="flex shrink-0 gap-1.5">
                <button type="button" disabled={i === 0} onClick={() => onMove(id, -1)} aria-label={`Subir: ${c.text}`} className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 grid place-items-center hover:bg-indigo-soft disabled:opacity-30"><ChevronUp size={18} /></button>
                <button type="button" disabled={i === order.length - 1} onClick={() => onMove(id, 1)} aria-label={`Bajar: ${c.text}`} className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 grid place-items-center hover:bg-indigo-soft disabled:opacity-30"><ChevronDown size={18} /></button>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function Figure({ id, label, unit, value, onChange, locked, children }: { id: string; label: React.ReactNode; unit?: "$" | "%" | ""; value: number | null | undefined; onChange: (v: number | null) => void; locked?: boolean; children?: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[15px] leading-relaxed text-white/90">{label}</label>
      <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-white px-4 py-1 text-ink focus-within:ring-2 focus-within:ring-mint">
        {unit === "$" && <span aria-hidden className="text-slate-400">$</span>}
        <input id={id} inputMode="numeric" autoComplete="off" readOnly={locked} value={typeof value === "number" ? value.toLocaleString("en-US") : ""} placeholder="Escribe la cifra"
          onChange={(e) => onChange(digits(e.target.value))} className="min-h-[40px] min-w-0 flex-1 bg-transparent text-base tabular-nums placeholder:text-slate-400 focus:outline-none" />
        {unit === "%" && <span aria-hidden className="text-slate-400">%</span>}
      </div>
      {children}
    </div>
  );
}

/** Calculadora aritmética neutra: no explica nada, solo opera. */
export function Calc() {
  const [open, setOpen] = useState(false);
  const [expr, setExpr] = useState("");
  const out = expr.trim() ? calc(expr) : null;
  const add = (t: string) => setExpr((e) => (e + t).slice(0, 60));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="inline-flex min-h-[36px] items-center gap-2 text-sm font-medium text-white"><Calculator size={15} /> Calculadora <ChevronDown size={14} aria-hidden className={clsx("transition-transform", open && "rotate-180")} /></button>
      {open && (
        <div className="mt-2 space-y-2.5">
          <label htmlFor="piloto-calculadora" className="sr-only">Operación</label>
          <input id="piloto-calculadora" inputMode="decimal" autoComplete="off" value={expr} onChange={(e) => setExpr(e.target.value.slice(0, 60))} placeholder="Por ejemplo: 1,200 − 800" className="w-full rounded-xl bg-white px-3 py-2.5 text-base tabular-nums text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-mint" />
          <div className="flex flex-wrap items-center gap-2">
            {[["+", "más"], ["−", "menos"], ["×", "por"], ["÷", "entre"], ["(", "abre paréntesis"], [")", "cierra paréntesis"]].map(([k, name]) => <button key={k} type="button" aria-label={name} onClick={() => add(k)} className="h-10 w-10 rounded-xl bg-white/10 text-base font-semibold hover:bg-white/20">{k}</button>)}
            <button type="button" onClick={() => setExpr("")} className="min-h-[40px] rounded-xl bg-white/10 px-3 text-sm hover:bg-white/20">Borrar</button>
          </div>
          <p aria-live="polite" className="text-sm tabular-nums text-white/85">{out === null ? (expr.trim() ? "Escribe una operación completa." : "Resultado:") : `Resultado: ${out.toLocaleString("en-US")}`}</p>
        </div>
      )}
    </div>
  );
}

function Reference({ title, reference, ideas }: { title: string; reference: string; ideas: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-mint">{title}</div>
      <p className="mt-1 text-[15px] leading-relaxed text-white/90">{reference}</p>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-white/60">Compara tu respuesta</div>
      <ul className="mt-1 space-y-1 text-sm leading-relaxed text-white/80">{ideas.map((t) => <li key={t} className="flex gap-2"><span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/60" />{t}</li>)}</ul>
    </div>
  );
}

/** Campo de texto libre, o varios campos cortos con su rótulo a la vista. */
function Writer({ id, name, fields, get, set }: { id: string; name: string; fields?: Campo[]; get: (k: string) => string; set: (k: string, v: string) => void }) {
  const cls = "w-full rounded-2xl border border-white/20 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-mint";
  if (!fields) return (
    <div>
      <label htmlFor={id} className="sr-only">{name}</label>
      <textarea id={id} value={get("texto")} onChange={(e) => set("texto", e.target.value.slice(0, MAX_REPLY))} rows={4} maxLength={MAX_REPLY} placeholder="Escribe aquí tu respuesta" className={cls} />
    </div>
  );
  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <div key={f.id}>
          <label htmlFor={`${id}-${f.id}`} className="block text-sm font-medium text-white/85">{f.label}</label>
          <textarea id={`${id}-${f.id}`} value={get(f.id)} onChange={(e) => set(f.id, e.target.value.slice(0, MAX_FIELD))} rows={2} maxLength={MAX_FIELD} placeholder="Escribe aquí" className={clsx(cls, "mt-1.5")} />
        </div>
      ))}
    </div>
  );
}

function NodeView({ x, run, node, act, picked, setPicked, draft, setDraft, openDocs, openTheory }: {
  x: Experiencia; run: Recorrido; node: Nodo; act: (a: Accion) => void; picked: string | null; setPicked: (id: string) => void;
  draft: Record<string, string>; setDraft: (f: (d: Record<string, string>) => Record<string, string>) => void; openDocs: () => void; openTheory: () => void;
}) {
  const step = stepOf(run);
  const after = useRef<HTMLDivElement>(null);
  const settled = (step.choice ?? "") + (step.solved ? "ok" : "") + (step.checks ?? 0) + (step.found?.length ?? 0) + (node.kind === "senalar" ? step.misses?.length ?? 0 : "") + (node.id in run.replies ? "r" : "");
  useEffect(() => { if (settled !== "00") after.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [settled]);
  const docs = (ids: string[]) => x.docs.filter((d) => ids.includes(d.id));
  const who = (id: string | null) => x.characters.find((c) => c.id === id);
  const again = <button type="button" onClick={openDocs} className="inline-flex min-h-[36px] items-center gap-1.5 py-2 text-sm font-medium text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"><FileText size={14} /> Volver a ver los documentos</button>;
  /** Encabezado de una actividad: si la plantea un personaje, habla él; si no, es una instrucción. */
  const lead = (eyebrow: string, n: { from: string | null; text: string; prompt: string }) => who(n.from)
    ? <><Bubble x={x} who={n.from}>{n.text}</Bubble><StepTitle eyebrow={eyebrow} title={n.prompt} /></>
    : <StepTitle eyebrow={eyebrow} title={n.prompt} text={n.text} />;

  if (node.kind === "mensaje") return (
    <div className="space-y-5">
      <StepTitle eyebrow={`${academyById(x.academy).name} · Nivel ${x.level} · ${x.minutes[0]} a ${x.minutes[1]} minutos`} title={x.title} />
      <Bubble x={x} who={node.from} channel={node.channel}>{node.text}</Bubble>
      <div className="ml-[52px] grid gap-2 sm:grid-cols-2">
        {docs(node.attachments).map((d) => (
          <button key={d.id} type="button" onClick={openDocs} className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/[.07] px-3 py-2.5 text-left hover:bg-white/15">
            <FileText size={18} className="shrink-0 text-mint" />
            <span className="min-w-0"><span className="block text-[11px] text-white/55">Documento {d.letter}</span><span className="block text-sm font-medium leading-snug">{d.title}</span></span>
          </button>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-white/65">{node.role}</p>
    </div>
  );

  if (node.kind === "explorar") {
    const withNote = rowsOf(docs(node.docs)).filter((r) => r.nota);
    const seen = withNote.filter((r) => run.opened.includes(r.id)).length;
    return (
      <div className="space-y-5">
        <StepTitle eyebrow="Explora" title={node.title} text={node.prompt} />
        <div className={docGrid(docs(node.docs))}>{docs(node.docs).map((d) => <DocCard key={d.id} doc={d} opened={run.opened} onOpen={(row) => act({ t: "abrir", row })} />)}</div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/65">
          <span aria-live="polite">Has consultado {seen} de {withNote.length} explicaciones.</span>
          <button type="button" onClick={openTheory} className="inline-flex min-h-[36px] items-center gap-1.5 py-2 font-medium text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"><BookOpen size={14} /> Abrir el concepto: {x.theory.title}</button>
        </div>
      </div>
    );
  }

  if (node.kind === "decision") {
    const chosen = node.options.find((o) => o.id === step.choice);
    return (
      <div className="space-y-5">
        <Bubble x={x} who={node.from}>{node.text}</Bubble>
        <div className="space-y-2.5" role="group" aria-label="Tu respuesta">
          {node.options.map((o, i) => <StageChoice key={o.id} letter={LETTERS[i]} on={(chosen?.id ?? picked) === o.id} disabled={!!chosen && chosen.id !== o.id} onClick={() => !chosen && setPicked(o.id)}>{o.text}</StageChoice>)}
        </div>
        {!chosen && <p className="text-sm text-white/60">Puedes volver a los documentos antes de responder. La respuesta no se puede cambiar después.</p>}
        {chosen && (
          <div ref={after} className="space-y-4 academy-in">
            {chosen.consequence.map((l, i) => <Bubble key={i} x={x} who={l.who}>{l.text}</Bubble>)}
            <Feedback o={chosen} />
          </div>
        )}
      </div>
    );
  }

  if (node.kind === "senalar") {
    const all = correctOf(node);
    const found = step.found ?? [];
    const marks: Marks = {};
    (step.misses ?? []).forEach((m) => { marks[m] = { ok: false, text: node.wrong[m] ?? node.fallback }; });
    found.forEach((f) => { marks[f] = { ok: true, text: all.length === 1 ? node.right : "Este es uno de los que buscas." }; });
    const left = all.length - found.length;
    return (
      <div className="space-y-5">
        {lead("Compruébalo", node)}
        <div className={docGrid(docs(node.docs))}>{docs(node.docs).map((d) => <DocCard key={d.id} doc={d} marks={marks} onPick={step.solved ? undefined : (row) => act({ t: "senalar", row })} />)}</div>
        {step.solved && all.length > 1 && <Note ok>{node.right}</Note>}
        <div ref={after} aria-live="polite" className="text-sm text-white/65">
          {step.solved ? "Eso es. Sigue cuando quieras." : found.length > 0 ? `Vas bien. ${left === 1 ? "Falta uno" : `Faltan ${left}`}.` : (step.misses?.length ?? 0) > 0 ? "Todavía no. Lee la nota del renglón que tocaste e inténtalo de nuevo." : all.length > 1 ? `Toca los ${all.length} renglones que correspondan.` : node.docs.length > 1 ? "Toca un renglón de cualquiera de los documentos." : "Toca un renglón del documento."}
        </div>
      </div>
    );
  }

  if (node.kind === "clasificar") {
    const marks: Marks = {};
    if (step.solved) node.items.forEach((i) => { marks[i.id] = { ok: true, text: i.why }; });
    else (step.misses ?? []).forEach((m) => { const i = node.items.find((k) => k.id === m); if (i) marks[m] = { ok: false, text: i.why }; });
    return (
      <div className="space-y-5">
        {lead("Clasifica", node)}
        {node.docs.length > 0 && again}
        <Sorter groups={node.groups} items={node.items} assign={step.assign ?? {}} locked={step.solved} marks={marks} onAssign={(item, group) => act({ t: "asignar", item, group })} />
        <div ref={after} aria-live="polite" className="space-y-3">
          {step.solved && <Note ok>{step.revealed ? `Esta es la solución. ${node.right}` : node.right}</Note>}
          {!step.solved && (step.checks ?? 0) > 0 && <p className="text-sm text-white/70">{(step.misses?.length ?? 0) > 0 ? "Hay tarjetas por revisar. Lee la nota de cada una, cámbiala de grupo y vuelve a revisar." : "Cambiaste tarjetas. Vuelve a revisar cuando quieras."}</p>}
          {!step.solved && !(step.checks ?? 0) && <p className="text-sm text-white/60">Toca un grupo en cada tarjeta. Puedes cambiarlo antes de revisar.</p>}
        </div>
      </div>
    );
  }

  if (node.kind === "ordenar") {
    const order = step.order ?? node.cards.map((c) => c.id);
    const hint = step.misses?.length ? node.hints[Number(step.misses[0])]?.text ?? node.fallback : null;
    const differs = step.solved && order.join() !== node.order.join();
    return (
      <div className="space-y-5">
        {lead("Ordena", node)}
        <Sequencer cards={node.cards} order={order} locked={step.solved} onMove={(card, dir) => act({ t: "mover", card, dir })} />
        <div ref={after} aria-live="polite" className="space-y-3">
          {step.solved && <Note ok>{step.revealed ? `Esta es la solución. ${node.right}` : node.right}</Note>}
          {differs && <p className="text-sm leading-relaxed text-white/75">Un orden de referencia: {node.order.map((id) => node.cards.find((c) => c.id === id)!.text).join(" → ")}</p>}
          {!step.solved && hint && <Note ok={false}>{hint}</Note>}
          {!step.solved && !hint && <p className="text-sm text-white/60">Usa las flechas de cada tarjeta para subirla o bajarla.</p>}
        </div>
      </div>
    );
  }

  if (node.kind === "calcular") {
    const miss = step.misses ?? [];
    return (
      <div className="space-y-5">
        {lead("Calcula", node)}
        <div className="grid gap-4">{docs(node.docs).map((d) => <DocCard key={d.id} doc={d} />)}</div>
        <div className="space-y-4">
          {node.fields.map((f) => (
            <Figure key={f.id} id={`piloto-${node.id}-${f.id}`} label={f.label} unit={f.unit} value={step.values?.[f.id]} locked={step.solved} onChange={(value) => act({ t: "cifra", field: f.id, value })}>
              {!step.solved && miss.includes(f.id) && <p role="status" className="mt-1.5 text-sm leading-relaxed text-amber"><span className="font-semibold">Revisa esta cifra. </span><span className="text-white/80">{f.hint}</span></p>}
              {step.solved && <p className="mt-1.5 text-sm tabular-nums text-white/75">{f.calc}</p>}
            </Figure>
          ))}
        </div>
        {!step.solved && <Calc />}
        <div ref={after} aria-live="polite">{step.solved && <Note ok>{step.revealed ? `Esta es la solución. ${node.right}` : node.right}</Note>}</div>
      </div>
    );
  }

  if (node.kind === "dato") return (
    <div className="space-y-5">
      <StepTitle eyebrow="Dato nuevo" title={node.title} />
      <ul className="rounded-2xl bg-white text-ink shadow-card divide-y divide-slate-100">
        {node.items.map((t) => <li key={t} className="px-4 py-3 text-[15px] leading-relaxed">{t}</li>)}
      </ul>
      {node.calc && <p className="text-sm text-white/70">{node.calc}</p>}
      {again}
    </div>
  );

  if (node.kind === "redactar") {
    const reply = run.replies[node.id];
    const name = who(node.from)?.name;
    return (
      <div className="space-y-5">
        <Bubble x={x} who={node.from}>{node.ask}</Bubble>
        <p className="text-[15px] leading-relaxed text-white/85">{node.prompt}</p>
        {!(node.id in run.replies) ? (
          <div>
            <Writer id={`piloto-${node.id}`} name={name ? `Tu respuesta a ${name}` : "Tu respuesta"} fields={node.fields}
              get={(k) => draft[node.fields ? `${node.id}:${k}` : node.id] ?? ""} set={(k, v) => setDraft((d) => ({ ...d, [node.fields ? `${node.id}:${k}` : node.id]: v }))} />
            <p className="mt-1.5 text-xs text-white/55">No se califica ni cuenta el largo. Queda guardada para que la compares.</p>
          </div>
        ) : (
          <div ref={after} className="space-y-4 academy-in">
            {reply ? <Mine><Written value={reply} fields={node.fields} /></Mine> : <p className="text-sm text-white/60">Preferiste no escribir.</p>}
            <Reference title="Una forma de decirlo" reference={node.reference} ideas={node.ideas} />
          </div>
        )}
      </div>
    );
  }

  // cierre
  const route = routeOf(x, run);
  const notes = rowsOf(x.docs).filter((r) => r.nota);
  const wrote = x.nodes.flatMap((n) => (n.kind === "redactar" && run.replies[n.id] ? [{ n, reply: run.replies[n.id]! }] : []));
  return (
    <div className="space-y-6">
      <StepTitle eyebrow="Cierre de la práctica" title="Lo que hiciste y lo que queda" text={node.text} />
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white/80">Tus decisiones</h2>
        {route.map(({ node: d, option: o }) => (
          <div key={d.id} className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3.5">
            <div className="text-sm text-white/60">{d.text}</div>
            <div className="mt-1 text-[15px] font-medium leading-relaxed">{o.text}</div>
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-white/60">{RUTA[o.tipo].label}</div>
            <p className="mt-0.5 text-sm leading-relaxed text-white/80">{o.feedback}</p>
          </div>
        ))}
        {wrote.map(({ n, reply }) => <Mine key={n.id}><Written value={reply} fields={n.fields} /></Mine>)}
      </section>
      <section className="rounded-2xl bg-white px-4 py-4 text-ink">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo">Concepto</div>
        <h2 className="text-base font-semibold">{x.theory.title}</h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">{x.theory.text}</p>
        {x.calculations.length > 0 && <>
          <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Los cálculos del caso</div>
          <ul className="mt-1 space-y-0.5 text-sm tabular-nums text-slate-700">{x.calculations.map((c) => <li key={c}>{c}</li>)}</ul>
        </>}
      </section>
      <p className="text-sm text-white/65">Consultaste {notes.filter((r) => run.opened.includes(r.id)).length} de {notes.length} explicaciones y abriste el concepto {run.theory} {run.theory === 1 ? "vez" : "veces"}.</p>
      <section className="rounded-2xl border border-mint/40 bg-mint/10 px-4 py-3.5">
        <h2 className="text-base font-semibold">Ahora, sin apoyo</h2>
        <p className="mt-1 text-sm leading-relaxed text-white/80">{x.variant.intro}</p>
      </section>
    </div>
  );
}

function TaskInput({ x, t, value, set }: { x: Experiencia; t: Tarea; value: Respuesta | undefined; set: (v: Respuesta) => void }) {
  if (t.kind === "cifra") return <Figure id={`piloto-${t.id}`} label={<span className="sr-only">{t.prompt}</span>} unit={t.unit ?? "$"} value={typeof value === "number" ? value : null} onChange={set} />;
  if (t.kind === "clasificar") { const a = isObj(value) ? value : {}; return <Sorter groups={t.groups} items={t.items} assign={a} onAssign={(item, group) => set({ ...a, [item]: group })} />; }
  if (t.kind === "ordenar") {
    const order = Array.isArray(value) ? value : t.cards.map((c) => c.id);
    const move = (card: string, dir: -1 | 1) => { const o = [...order]; const i = o.indexOf(card); const j = i + dir; if (i < 0 || j < 0 || j >= o.length) return; [o[i], o[j]] = [o[j], o[i]]; set(o); };
    return <Sequencer cards={t.cards} order={order} onMove={move} />;
  }
  if (t.kind === "senalar") {
    const sel = Array.isArray(value) ? value : [];
    const doc = x.variant.docs.find((d) => d.id === t.doc)!;
    return <><DocCard doc={doc} chosen={sel} onPick={(row) => set(sel.includes(row) ? sel.filter((r) => r !== row) : [...sel, row])} /><p aria-live="polite" className="mt-2 text-sm text-white/65">{sel.length === 0 ? "Toca los renglones que correspondan. Vuelve a tocar uno para quitarlo." : `Señalaste ${sel.length}. Vuelve a tocar uno para quitarlo.`}</p></>;
  }
  const a = isObj(value) ? value : {};
  return <><Writer id={`piloto-${t.id}`} name={t.criterion} fields={t.fields} get={(k) => a[k] ?? ""} set={(k, v) => set({ ...a, [k]: v })} /><p className="mt-1.5 text-xs text-white/55">Lo que escribas no se califica solo: queda en espera de revisión de una persona.</p></>;
}

function VariantView({ x, run, act }: { x: Experiencia; run: Recorrido; act: (a: Accion) => void }) {
  const v = x.variant;
  return (
    <div className="space-y-6">
      <StepTitle eyebrow={v.title} title={v.question} text={v.setting} />
      <div className="grid gap-4">{v.docs.map((d) => <DocCard key={d.id} doc={d} />)}</div>
      {v.calculator && <Calc />}
      <ol className="space-y-7">
        {v.tasks.map((t, i) => (
          <li key={t.id}>
            <div className="mb-2.5 text-[15px] font-medium leading-relaxed text-white">{i + 1}. {t.prompt}</div>
            <TaskInput x={x} t={t} value={run.answers[t.id]} set={(value) => act({ t: "responder", task: t.id, value })} />
          </li>
        ))}
      </ol>
      <p className="text-sm text-white/60">Al entregar verás qué acertaste y la respuesta de referencia de cada parte.</p>
    </div>
  );
}

function TaskResult({ x, t, given }: { x: Experiencia; t: Tarea; given: Respuesta }) {
  const line = "text-sm leading-relaxed text-white/90";
  if (t.kind === "cifra") return <><div className={clsx(line, "tabular-nums")}>Tu respuesta: {typeof given === "number" ? `${t.unit === "$" || t.unit === undefined ? "$" : ""}${fmt(given)}${t.unit === "%" ? " %" : ""}` : "sin respuesta"}</div><div className={clsx(line, "tabular-nums")}>Cálculo: {t.calc}</div></>;
  if (t.kind === "clasificar") {
    const a = isObj(given) ? given : {};
    const label = (g: string | undefined) => t.groups.find((k) => k.id === g)?.label ?? "sin grupo";
    return (
      <>
        <ul className="space-y-1.5">
          {t.items.map((i) => { const ok = groupOk(i.group, a[i.id]); return <li key={i.id} className={line}><span className="text-white/70">{i.text}</span> <span className="font-medium">{ok ? "Correcto" : "Por revisar"}: {label(a[i.id])}</span>{!ok && <span className="text-white/70"> (va en: {label(Array.isArray(i.group) ? i.group[0] : i.group)})</span>}</li>; })}
        </ul>
        <div className={clsx(line, "mt-1.5 text-white/75")}>{t.calc}</div>
      </>
    );
  }
  if (t.kind === "ordenar") {
    const o = Array.isArray(given) ? given : t.cards.map((c) => c.id);
    return <><div className={line}>Tu orden: {o.map((id) => t.cards.find((c) => c.id === id)?.text ?? id).join(" → ")}</div><div className={clsx(line, "text-white/75")}>Referencia: {t.calc}</div></>;
  }
  if (t.kind === "senalar") {
    const rows = rowsOf(x.variant.docs);
    const said = (id: string) => { const r = rows.find((k) => k.id === id); return r ? [r.label, ...(r.cells ?? [])].join(" · ") : id; };
    return <><div className={line}>Señalaste: {Array.isArray(given) && given.length ? given.map(said).join("; ") : "nada"}</div><div className={clsx(line, "text-white/75")}>{t.calc}</div></>;
  }
  return (
    <div className="space-y-3">
      {isObj(given) && Object.values(given).some((v) => v.trim()) ? <Mine><Written value={given} fields={t.fields} /></Mine> : <div className={line}>No escribiste respuesta.</div>}
      <Reference title="Una respuesta de referencia" reference={t.reference} ideas={t.ideas} />
    </div>
  );
}

function ResultView({ x, run, restart }: { x: Experiencia; run: Recorrido; restart: () => void }) {
  const res = run.result!;
  const text = res.pending
    ? `${res.pending} de 100 puntos son respuestas escritas y quedan en espera de revisión de una persona. Por eso todavía no hay veredicto.`
    : `La regla provisional pide ${x.variant.passAt} de 100; todavía no está calibrada.`;
  return (
    <div className="space-y-5">
      <StepTitle eyebrow="Resultado de la comprobación" title={`${res.score} de ${res.auto} puntos en lo que se comprueba solo`} text={text} />
      <ul className="space-y-3">
        {res.items.map((it) => {
          const t = x.variant.tasks.find((k) => k.id === it.id)!;
          const state = !it.auto ? "espera" : it.ok ? "ok" : it.got > 0 ? "parcial" : "no";
          const word = state === "espera" ? "en espera de revisión de una persona" : state === "ok" ? "correcto" : state === "parcial" ? `parcial: ${it.got} de ${it.weight}` : t.kind === "texto" ? "sin respuesta" : "por revisar";
          return (
            <li key={it.id} className={clsx("rounded-2xl border px-4 py-3.5", state === "ok" ? "border-mint/50 bg-mint/10" : state === "parcial" ? "border-amber/50 bg-amber/10" : state === "no" ? "border-coral/50 bg-coral/10" : "border-white/20 bg-white/[.06]")}>
              <div className="flex items-start gap-2.5">
                <span aria-hidden className={clsx("mt-0.5 h-5 w-5 shrink-0 rounded-full grid place-items-center", state === "ok" ? "bg-mint text-ink" : state === "parcial" ? "bg-amber text-ink" : state === "no" ? "bg-coral text-white" : "bg-white/20 text-white")}>{state === "ok" ? <Check size={13} strokeWidth={3} /> : state === "espera" ? <Clock size={12} strokeWidth={3} /> : state === "parcial" ? <Info size={12} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{it.criterion} <span className="font-normal text-white/60">· {it.weight} puntos · {word}</span></div>
                  <div className="mt-0.5 mb-2 text-sm text-white/80">{t.prompt}</div>
                  <TaskResult x={x} t={t} given={it.given} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3.5 text-sm leading-relaxed text-white/80">
        Este resultado no se registra. No cambia tu nivel, tu avance ni tu perfil: la experiencia está en revisión y su evaluación aún no se valida.
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={restart} className="btn bg-white/10 text-white hover:bg-white/20"><RotateCcw size={15} /> Repetir desde el inicio</button>
        <Link href="/ceo/piloto" className="btn bg-white text-ink hover:bg-white/90 font-semibold">Ver todas las experiencias</Link>
      </div>
    </div>
  );
}

function Ficha({ x, restart }: { x: Experiencia; restart: () => void }) {
  const name = (id: string) => skillById(id)?.name ?? id;
  const Row = ({ k, children }: { k: string; children: React.ReactNode }) => <div className="py-2.5 border-b border-slate-100 last:border-b-0"><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k}</dt><dd className="mt-0.5 text-sm leading-relaxed text-slate-700">{children}</dd></div>;
  return (
    <div>
      <dl>
        <Row k="Experiencia">{x.title} · {x.editorialId} · versión {x.version} · paquete {x.packageVersion}</Row>
        <Row k="Habilidad principal">{name(x.skills.primary)} <span className="text-slate-400">({x.skills.primary})</span></Row>
        <Row k="Habilidades secundarias">{x.skills.secondary.map(name).join("; ")}</Row>
        <Row k="Qué se busca">{x.objectives.join(" ")}</Row>
        <Row k="Referencias curriculares">
          <ul className="space-y-1">{x.sourceIds.map((s) => <li key={s}><a href={FUENTES[s].url} target="_blank" rel="noreferrer" className="inline-block py-1.5 font-medium text-indigo underline underline-offset-2">{FUENTES[s].institution} · {FUENTES[s].component}</a></li>)}</ul>
          <p className="mt-1 text-xs text-slate-500">Correspondencia temática con el plan de estudios, no equivalencia de curso. La historia, las cifras y la evaluación son creación original.</p>
        </Row>
        <Row k="Estado">{QA_TEXT[x.qa.estado]}. Revisión editorial: {x.qa.editorialReviewedAt ?? "sin hacer"}. Validación con usuarios: sin hacer.</Row>
        <Row k="Registro">No registra evidencia. No cambia dominio, nivel ni perfil. El recorrido se guarda solo en este navegador.</Row>
        <Row k="Por confirmar en la revisión"><ul className="space-y-1.5">{x.conversionNotes.map((n) => <li key={n} className="flex gap-2"><span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />{n}</li>)}</ul></Row>
      </dl>
      <button type="button" onClick={restart} className="btn-ghost mt-4"><RotateCcw size={15} /> Borrar mi recorrido y empezar de nuevo</button>
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center detail-fade" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-[#0F1130]/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-canvas text-ink shadow-2xl detail-in">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-canvas/95 backdrop-blur px-5 py-3.5 border-b border-slate-200">
          <h2 className="min-w-0 text-base font-semibold">{title}</h2>
          <button ref={close} type="button" onClick={onClose} aria-label="Cerrar" className="h-10 w-10 shrink-0 rounded-full bg-slate-200/70 hover:bg-slate-200 grid place-items-center"><X size={17} /></button>
        </div>
        <div className="px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}
