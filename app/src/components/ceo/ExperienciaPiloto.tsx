"use client";
/**
 * MÊTIS 2.0 · Repositorio Académico · pantalla de una experiencia inmersiva (piloto en revisión).
 *
 * El recorrido se guarda solo en este navegador, para poder salir y continuar.
 * No escribe en el registro de evidencias, no cambia niveles ni perfil y no llama a ningún servicio.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { BookOpen, Check, ChevronDown, FileText, Info, RotateCcw, X } from "lucide-react";
import { academyById, skillById } from "@/lib/ceo/metis2/academias";
import {
  FUENTES, MAX_REPLY, advance, newRun, nextOf, nodeOf, readRun, routeOf, rowsOf, stepOf,
  type Accion, type Documento, type Experiencia, type Nodo, type Opcion, type Recorrido, type RutaTipo,
} from "@/lib/ceo/metis2/experiencias";
import { Stage, StageChoice, StepTitle } from "./Stage";

const fmt = (n: number) => (n < 0 ? "−" : "") + Math.abs(n).toLocaleString("en-US");
const QA_TEXT: Record<Experiencia["qa"]["estado"], string> = { importado: "Importado", probado: "Probado con pruebas automáticas", revisado: "Revisado por una persona", publicado: "Publicado", validado: "Validado con usuarios" };
const RUTA: Record<RutaTipo, { label: string; cls: string }> = {
  defendible: { label: "Ruta defendible", cls: "border-mint/50 bg-mint/10" },
  riesgosa: { label: "Ruta con riesgo", cls: "border-amber/50 bg-amber/10" },
  concepto_erroneo: { label: "Aquí hay una confusión", cls: "border-coral/50 bg-coral/10" },
};

const storeKey = (x: Experiencia) => `metis:piloto:${x.id}`;

export function ExperienciaPiloto({ x }: { x: Experiencia }) {
  const [run, setRun] = useState<Recorrido | null>(null);
  const [sheet, setSheet] = useState<"docs" | "teoria" | "ficha" | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let raw: unknown = null;
    try { raw = JSON.parse(window.localStorage.getItem(storeKey(x)) ?? "null"); } catch { raw = null; }
    setRun(readRun(x, raw));
  }, [x]);
  useEffect(() => { if (run) try { window.localStorage.setItem(storeKey(x), JSON.stringify(run)); } catch { /* sin espacio: se sigue sin guardar */ } }, [run, x]);
  useEffect(() => { window.scrollTo({ top: 0 }); setPicked(null); }, [run?.at, run?.phase]);

  if (!run) return <div className="min-h-screen grid place-items-center bg-[#0F1130]"><span className="h-8 w-8 rounded-full border-2 border-white border-t-transparent animate-spin" /></div>;

  const act = (a: Accion) => setRun((r) => (r ? advance(x, r, a) : r));
  const restart = () => { setDraft(""); setRun(newRun(x)); };
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
    else if (node.kind === "redactar") {
      if (run.reply === undefined) {
        next = { label: "Enviar", off: !draft.trim(), go: () => act({ t: "redactar", text: draft }) };
        aside = <button type="button" onClick={() => act({ t: "redactar", text: null })} className="min-h-[36px] py-2 text-sm text-white/65 hover:text-white">Prefiero no escribir</button>;
      } else next = { label: "Continuar", go };
    } else if (node.kind === "cierre") next = { label: "Comprobar con otra situación", go: () => act({ t: "comprobar" }) };
  } else if (run.phase === "demostrar") {
    next = { label: "Entregar", off: !x.variant.tasks.every((t) => typeof run.answers[t.id] === "number"), go: () => act({ t: "entregar" }) };
  }

  const steps = learning ? x.moments : ["Otra situación", "Resultado"];
  const at = learning ? node.moment : run.phase === "demostrar" ? 0 : 1;

  return (
    <>
      <Stage steps={steps} at={at} exit="/ceo" onNext={next?.go} next={next?.label} nextOff={next?.off} aside={aside}>
        <div data-noswipe key={`${run.phase}-${run.at}`} className="academy-in">
          <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2 text-xs text-white/75">
            <span className="inline-flex min-w-0 items-center gap-1.5"><Info size={13} className="shrink-0 text-mint" /> Piloto en revisión. No cuenta para tu avance, tu nivel ni tu perfil.</span>
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
          {sheet === "docs" && <div className="grid gap-4 sm:grid-cols-2">{x.docs.map((d) => <DocCard key={d.id} doc={d} opened={run.opened} onOpen={(row) => act({ t: "abrir", row })} />)}</div>}
          {sheet === "teoria" && <p className="text-[15px] leading-relaxed text-slate-700">{x.theory.text}</p>}
          {sheet === "ficha" && <Ficha x={x} restart={() => { restart(); setSheet(null); }} />}
        </Sheet>
      )}
    </>
  );
}

// ───────────────────────────────────────────── piezas

function Face({ name }: { name: string }) {
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

function Mine({ children }: { children: React.ReactNode }) {
  return <div className="ml-10 rounded-2xl rounded-tr-md bg-indigo-light px-4 py-3 text-[15px] leading-relaxed text-white"><div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Tú</div>{children}</div>;
}

/**
 * Documento tocable. Modo «leer»: tocar un renglón abre su explicación.
 * Modo «señalar»: tocar un renglón es la respuesta. Sin `onOpen` ni `onPick` es una tabla simple (variante).
 */
function DocCard({ doc, opened, onOpen, onPick, marks }: { doc: Documento; opened?: string[]; onOpen?: (row: string) => void; onPick?: (row: string) => void; marks?: Record<string, { ok: boolean; text: string }> }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="rounded-2xl bg-white text-ink shadow-card overflow-hidden">
      <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo">Documento {doc.letter}</div>
        <div className="text-sm font-semibold leading-snug">{doc.title}</div>
        <div className="text-xs text-slate-500">{doc.unit}</div>
      </div>
      <ul>
        {doc.rows.map((r) => {
          const total = !!r.suma;
          const mark = marks?.[r.id];
          const isOpen = open === r.id && !!r.nota && !onPick;
          const line = (
            <span className={clsx("flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm", total && "font-semibold")}>
              <span className="min-w-0 flex-1 leading-snug">{r.label}</span>
              <span className="shrink-0 tabular-nums">{fmt(r.amount)}</span>
              {onOpen && !onPick && r.nota && <ChevronDown size={15} aria-hidden className={clsx("mt-0.5 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")} />}
            </span>
          );
          return (
            <li key={r.id} className={clsx("border-b border-slate-100 last:border-b-0", total && "bg-slate-50", mark && (mark.ok ? "bg-mint-soft" : "bg-coral-soft"))}>
              {onPick
                ? <button type="button" onClick={() => onPick(r.id)} aria-label={`Señalar: ${r.label}, ${fmt(r.amount)}`} className="block w-full hover:bg-indigo-soft/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo">{line}</button>
                : onOpen && r.nota
                  ? <button type="button" aria-expanded={isOpen} onClick={() => { setOpen(isOpen ? null : r.id); if (!isOpen) onOpen(r.id); }} className="block w-full hover:bg-indigo-soft/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo">{line}</button>
                  : line}
              {isOpen && <p className="px-4 pb-3 -mt-0.5 text-[13px] leading-relaxed text-slate-600">{r.nota!.text}</p>}
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

function NodeView({ x, run, node, act, picked, setPicked, draft, setDraft, openDocs, openTheory }: {
  x: Experiencia; run: Recorrido; node: Nodo; act: (a: Accion) => void; picked: string | null; setPicked: (id: string) => void;
  draft: string; setDraft: (t: string) => void; openDocs: () => void; openTheory: () => void;
}) {
  const step = stepOf(run);
  const after = useRef<HTMLDivElement>(null);
  const settled = step.choice ?? (step.solved ? "ok" : "") + (step.misses?.length ?? 0) + (run.reply !== undefined ? "r" : "");
  useEffect(() => { if (settled) after.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [settled]);
  const docs = (ids: string[]) => x.docs.filter((d) => ids.includes(d.id));

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
        <StepTitle eyebrow="Explora" title="Dos documentos, dos preguntas distintas" text={node.prompt} />
        <div className="grid gap-4 sm:grid-cols-2">{docs(node.docs).map((d) => <DocCard key={d.id} doc={d} opened={run.opened} onOpen={(row) => act({ t: "abrir", row })} />)}</div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/65">
          <span aria-live="polite">Has consultado {seen} de {withNote.length} renglones.</span>
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
          {node.options.map((o, i) => <StageChoice key={o.id} letter={"ABC"[i]} on={(chosen?.id ?? picked) === o.id} disabled={!!chosen && chosen.id !== o.id} onClick={() => !chosen && setPicked(o.id)}>{o.text}</StageChoice>)}
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
    const marks: Record<string, { ok: boolean; text: string }> = {};
    (step.misses ?? []).forEach((m) => { marks[m] = { ok: false, text: node.wrong[m] ?? node.fallback }; });
    if (step.solved) marks[node.correct] = { ok: true, text: node.right };
    return (
      <div className="space-y-5">
        <StepTitle eyebrow="Compruébalo" title={node.prompt} text={node.text} />
        <div className="grid gap-4 sm:grid-cols-2">{docs(node.docs).map((d) => <DocCard key={d.id} doc={d} marks={marks} onPick={step.solved ? undefined : (row) => act({ t: "senalar", row })} />)}</div>
        <div ref={after} aria-live="polite" className="text-sm text-white/65">{step.solved ? "Eso es. Sigue cuando quieras." : (step.misses?.length ?? 0) > 0 ? "Todavía no. Lee la nota del renglón que tocaste e inténtalo de nuevo." : "Toca un renglón de cualquiera de los dos documentos."}</div>
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
      <button type="button" onClick={openDocs} className="inline-flex min-h-[36px] items-center gap-1.5 py-2 text-sm font-medium text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"><FileText size={14} /> Volver a ver los documentos</button>
    </div>
  );

  if (node.kind === "redactar") return (
    <div className="space-y-5">
      <Bubble x={x} who={node.from}>{node.ask}</Bubble>
      <p className="text-[15px] leading-relaxed text-white/85">{node.prompt}</p>
      {run.reply === undefined ? (
        <div>
          <label htmlFor="piloto-respuesta" className="sr-only">Tu respuesta a Marta</label>
          <textarea id="piloto-respuesta" value={draft} onChange={(e) => setDraft(e.target.value.slice(0, MAX_REPLY))} rows={4} maxLength={MAX_REPLY} placeholder="Escribe aquí tu respuesta" className="w-full rounded-2xl border border-white/20 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-mint" />
          <p className="mt-1.5 text-xs text-white/55">No se califica ni cuenta el largo. Queda guardada para que la compares.</p>
        </div>
      ) : (
        <div ref={after} className="space-y-4 academy-in">
          {run.reply ? <Mine>{run.reply}</Mine> : <p className="text-sm text-white/60">Preferiste no escribir.</p>}
          <div className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-mint">Una forma de decirlo</div>
            <p className="mt-1 text-[15px] leading-relaxed text-white/90">{node.reference}</p>
            <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-white/60">Compara tu respuesta</div>
            <ul className="mt-1 space-y-1 text-sm leading-relaxed text-white/80">{node.ideas.map((t) => <li key={t} className="flex gap-2"><span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/60" />{t}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );

  // cierre
  const route = routeOf(x, run);
  const notes = rowsOf(x.docs).filter((r) => r.nota);
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
        {run.reply && <Mine>{run.reply}</Mine>}
      </section>
      <section className="rounded-2xl bg-white px-4 py-4 text-ink">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo">Concepto</div>
        <h2 className="text-base font-semibold">{x.theory.title}</h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">{x.theory.text}</p>
        <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Los cálculos del caso</div>
        <ul className="mt-1 space-y-0.5 text-sm tabular-nums text-slate-700">{x.calculations.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>
      <p className="text-sm text-white/65">Consultaste {notes.filter((r) => run.opened.includes(r.id)).length} de {notes.length} renglones y abriste el concepto {run.theory} {run.theory === 1 ? "vez" : "veces"}.</p>
      <section className="rounded-2xl border border-mint/40 bg-mint/10 px-4 py-3.5">
        <h2 className="text-base font-semibold">Ahora, sin apoyo</h2>
        <p className="mt-1 text-sm leading-relaxed text-white/80">Otra empresa y otras cifras. Sin explicaciones, sin documentos de la práctica y sin el concepto a la mano. Son tres cálculos.</p>
      </section>
    </div>
  );
}

function VariantView({ x, run, act }: { x: Experiencia; run: Recorrido; act: (a: Accion) => void }) {
  const v = x.variant;
  return (
    <div className="space-y-5">
      <StepTitle eyebrow={v.title} title={v.question} text={v.setting} />
      {v.docs.map((d) => <DocCard key={d.id} doc={d} />)}
      <div className="space-y-4">
        {v.tasks.map((t, i) => {
          const val = run.answers[t.id];
          return (
            <div key={t.id}>
              <label htmlFor={`piloto-${t.id}`} className="block text-[15px] leading-relaxed text-white/90">{i + 1}. {t.prompt}</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-ink focus-within:ring-2 focus-within:ring-mint">
                <span aria-hidden className="text-slate-400">$</span>
                <input id={`piloto-${t.id}`} inputMode="numeric" autoComplete="off" value={typeof val === "number" ? val.toLocaleString("en-US") : ""} placeholder="Escribe la cifra"
                  onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 9); act({ t: "responder", task: t.id, value: d ? Number(d) : null }); }}
                  className="min-w-0 flex-1 bg-transparent text-base tabular-nums placeholder:text-slate-400 focus:outline-none" />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-white/60">Al entregar verás qué acertaste y cómo se calcula cada cifra.</p>
    </div>
  );
}

function ResultView({ x, run, restart }: { x: Experiencia; run: Recorrido; restart: () => void }) {
  const res = run.result!;
  const right = res.items.filter((i) => i.ok).length;
  return (
    <div className="space-y-5">
      <StepTitle eyebrow="Resultado de la comprobación" title={`${right} de ${res.items.length} cálculos correctos`} text={`Puntos: ${res.score} de 100. La regla provisional pide ${x.variant.passAt}; todavía no está calibrada.`} />
      <ul className="space-y-3">
        {res.items.map((it) => {
          const t = x.variant.tasks.find((k) => k.id === it.id)!;
          return (
            <li key={it.id} className={clsx("rounded-2xl border px-4 py-3.5", it.ok ? "border-mint/50 bg-mint/10" : "border-coral/50 bg-coral/10")}>
              <div className="flex items-start gap-2.5">
                <span aria-hidden className={clsx("mt-0.5 h-5 w-5 shrink-0 rounded-full grid place-items-center", it.ok ? "bg-mint text-ink" : "bg-coral text-white")}>{it.ok ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{it.criterion} <span className="font-normal text-white/60">· {it.weight} puntos · {it.ok ? "correcto" : "por revisar"}</span></div>
                  <div className="mt-0.5 text-sm text-white/80">{t.prompt}</div>
                  <div className="mt-1.5 text-sm tabular-nums text-white/90">Tu respuesta: ${fmt(it.given ?? 0)}</div>
                  <div className="text-sm tabular-nums text-white/90">Cálculo: {t.calc}</div>
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
        <Link href="/ceo" className="btn bg-white text-ink hover:bg-white/90 font-semibold">Volver a MÊTIS</Link>
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

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
          <h2 className="text-base font-semibold">{title}</h2>
          <button ref={close} type="button" onClick={onClose} aria-label="Cerrar" className="h-9 w-9 rounded-full bg-slate-200/70 hover:bg-slate-200 grid place-items-center"><X size={17} /></button>
        </div>
        <div className="px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}
