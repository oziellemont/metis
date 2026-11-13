"use client";
/**
 * MÊTIS 2.0 · Executive Challenge en demostración (no acredita).
 *
 * Una sola historia en tres actos. Los documentos se consultan siempre; no hay tutor ni explicación
 * durante el reto. Pedir ayuda marca el intento como asistido. Al terminar, un informe con 24
 * observaciones por academia y las salvaguardas, sin veredicto: los umbrales no están habilitados.
 *
 * El intento se guarda solo en este navegador. No escribe en el registro de evidencias,
 * no cambia niveles ni perfil y no llama a ningún servicio.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, Check, Clock, FileText, Info, LifeBuoy, Mail, RotateCcw, ShieldCheck, X } from "lucide-react";
import { academyById, skillById, type AcademyId } from "@/lib/ceo/metis2/academias";
import {
  advanceReto, informeOf, nextStep, newIntento, ordenOpciones, pathOf, progressOf, readIntento, scoreStep, stepById, stepDone, textOf, validAnswer,
  type AccionReto, type Intento, type PasoReto, type RespuestaReto, type Reto,
} from "@/lib/ceo/metis2/reto";
import { Calc, DocCard, Face, Figure, Mine, Sequencer, Sheet, Sorter } from "./ExperienciaPiloto";
import { Stage, StageChoice, StepTitle } from "./Stage";

const storeKey = (r: Reto) => `metis:reto:${r.id}`;
const LETTERS = "ABCDEF";
const RUTA = { defendible: "Ruta defendible", riesgosa: "Ruta con riesgo", concepto_erroneo: "Aquí había una confusión" } as const;
const SALVA = { inocuidad: "Inocuidad: cajas con alérgenos mal etiquetados", etica: "Ética: no ocultar la falla al cliente", control_bancario: "Control bancario: verificar antes de pagar" } as const;

export function RetoPiloto({ r }: { r: Reto }) {
  const [it, setIt] = useState<Intento | null>(null);
  const [sheet, setSheet] = useState<{ k: "docs"; doc?: string } | { k: "ayuda" } | { k: "ficha" } | null>(null);
  const [draft, setDraft] = useState<Record<string, RespuestaReto>>({});

  useEffect(() => {
    let raw: unknown = null;
    try { raw = JSON.parse(window.localStorage.getItem(storeKey(r)) ?? "null"); } catch { raw = null; }
    const back = readIntento(r, raw);
    setIt(back.phase === "reto" ? advanceReto(r, back, { t: "retomar" }) : back);
  }, [r]);
  useEffect(() => { if (it) try { window.localStorage.setItem(storeKey(r), JSON.stringify(it)); } catch { /* sin espacio: se sigue sin guardar */ } }, [it, r]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [it?.at, it?.phase]);

  if (!it) return <div className="min-h-screen grid place-items-center bg-[#0F1130]"><span className="h-8 w-8 rounded-full border-2 border-white border-t-transparent animate-spin" /></div>;

  const act = (a: AccionReto) => setIt((x) => (x ? advanceReto(r, x, a) : x));
  const restart = () => { setDraft({}); setIt(newIntento(r)); setSheet(null); };
  const now = () => new Date().toISOString();

  const cur = it.at ? stepById(r, it.at) : undefined;
  const sceneIdx = cur ? r.scenes.indexOf(cur.scene) : it.phase === "fin" ? r.scenes.length : -1;
  const available = r.docs.filter((d) => !d.from || r.scenes.findIndex((s) => s.id === d.from) <= sceneIdx);

  let next: { label: string; off?: boolean; go: () => void } | undefined;
  if (it.phase === "inicio") next = { label: "Empezar el reto", go: () => act({ t: "empezar", now: now() }) };
  else if (it.phase === "reto" && cur) {
    const p = cur.step;
    if (p.kind !== "dato" && !(p.id in it.answers)) {
      const v = draftValue(p, draft[p.id]);
      next = { label: p.kind === "escribir" ? "Enviar" : "Responder", off: !validAnswer(p, v) || (p.kind === "escribir" && !Object.values(v as Record<string, string>).some((t) => t.trim())), go: () => act({ t: "responder", step: p.id, value: v! }) };
    } else if (nextStep(r, it)) next = { label: "Continuar", go: () => act({ t: "avanzar" }) };
    else next = { label: "Terminar y ver el informe", off: !stepDone(r, it), go: () => act({ t: "terminar", now: now() }) };
  }
  const skipWrite = it.phase === "reto" && cur?.step.kind === "escribir" && !(cur.step.id in it.answers)
    ? <button type="button" onClick={() => act({ t: "responder", step: cur.step.id, value: Object.fromEntries((cur.step.kind === "escribir" ? cur.step.fields : []).map((f) => [f.id, ""])) })} className="min-h-[36px] py-2 text-sm text-white/65 hover:text-white">Prefiero no escribir</button>
    : undefined;

  const prog = progressOf(r, it);
  const steps = it.phase === "inicio" ? [] : [...r.acts.map((a, k) => `Acto ${k + 1}`), "Informe"];
  const at = it.phase === "fin" ? r.acts.length : prog.act;

  return (
    <>
      <Stage steps={steps} at={at} exit="/ceo/piloto" onNext={next?.go} next={next?.label} nextOff={next?.off} aside={skipWrite}>
        <div data-noswipe key={`${it.phase}-${it.at}`} className="academy-in">
          <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2 text-xs text-white/75">
            <span className="inline-flex min-w-0 items-center gap-1.5"><Info size={13} className="shrink-0 text-mint" /> Reto en demostración. No cuenta para tu avance, tu nivel ni tu perfil.</span>
            <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
              {it.phase !== "inicio" && <button type="button" onClick={() => setSheet({ k: "docs" })} className="inline-flex items-center gap-1 min-h-[36px] rounded-lg bg-white/10 px-3 py-2 font-medium text-white hover:bg-white/20"><FileText size={13} /> Documentos ({available.length})</button>}
              {it.phase === "reto" && <button type="button" onClick={() => setSheet({ k: "ayuda" })} className="inline-flex items-center gap-1 min-h-[36px] rounded-lg bg-white/10 px-3 py-2 font-medium text-white hover:bg-white/20"><LifeBuoy size={13} /> Pedir ayuda</button>}
              <button type="button" onClick={() => setSheet({ k: "ficha" })} className="inline-flex items-center gap-1 min-h-[36px] rounded-lg bg-white/10 px-3 py-2 font-medium text-white hover:bg-white/20">Ficha</button>
            </div>
          </div>
          {it.assisted && it.phase === "reto" && <p className="mb-5 flex items-start gap-2 rounded-xl border border-amber/40 bg-amber/10 px-3 py-2.5 text-sm leading-relaxed text-white/85"><LifeBuoy size={15} className="mt-0.5 shrink-0 text-amber" /> Pediste ayuda: este intento queda como práctica asistida.</p>}

          {it.phase === "inicio" && <Intro r={r} />}
          {it.phase === "reto" && cur && (
            <StepView r={r} it={it} step={cur.step} prog={prog} draft={draft} setDraft={setDraft} openDoc={(doc) => setSheet({ k: "docs", doc })} available={available.map((d) => d.id)} />
          )}
          {it.phase === "fin" && <Informe r={r} it={it} restart={restart} />}
        </div>
      </Stage>

      {sheet && (
        <Sheet title={sheet.k === "docs" ? "Sala de documentos" : sheet.k === "ayuda" ? "Pedir ayuda" : "Ficha del reto"} onClose={() => setSheet(null)}>
          {sheet.k === "docs" && <Docs r={r} docs={available.map((d) => d.id)} first={sheet.doc} onOpen={(d) => act({ t: "abrir", doc: d })} />}
          {sheet.k === "ayuda" && <Ayuda it={it} step={cur?.step} onAsk={() => act({ t: "ayuda" })} />}
          {sheet.k === "ficha" && <Ficha r={r} restart={restart} />}
        </Sheet>
      )}
    </>
  );
}

/** Convierte lo que está en pantalla (borrador) en la respuesta que espera el motor. */
function draftValue(p: PasoReto, d: RespuestaReto | undefined): RespuestaReto | undefined {
  if (p.kind === "ordenar") return Array.isArray(d) ? d : p.cards.map((c) => c.id);
  if (p.kind === "escribir") return { ...Object.fromEntries(p.fields.map((f) => [f.id, ""])), ...((d as Record<string, string>) ?? {}) };
  return d;
}

// ─────────────────────────────────────────────── inicio

function Intro({ r }: { r: Reto }) {
  return (
    <div className="space-y-6">
      <StepTitle eyebrow={`Executive Challenge · Nivel 1 · ${r.editorialId}`} title={r.title} text={r.role} />
      <div className="rounded-2xl bg-white px-4 py-4 text-ink shadow-card">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-indigo"><Mail size={13} /> Invitación de evaluación</div>
        <p className="mt-2 text-[15px] leading-relaxed">{r.invitation}</p>
      </div>
      <p className="text-[15px] leading-relaxed text-white/80">{r.company}</p>
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mint">Tres actos, una sola historia</h2>
        <ol className="mt-2.5 space-y-2">
          {r.acts.map((a, k) => <li key={a.id} className="rounded-2xl border border-white/[.12] bg-white/[.06] px-4 py-3"><div className="text-sm font-semibold">Acto {k + 1}. {a.title}</div><div className="text-sm text-white/70">{a.text}</div></li>)}
        </ol>
      </section>
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mint">Con quién vas a trabajar</h2>
        <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">{r.characters.map((c) => <li key={c.id} className="flex items-center gap-3"><Face name={c.name} /><span className="text-sm"><span className="font-semibold">{c.name}</span> <span className="text-white/60">· {c.role}</span></span></li>)}</ul>
      </section>
      <section className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3.5 text-sm leading-relaxed text-white/80 space-y-1.5">
        <p>Los documentos están siempre a la mano y hay calculadora. No hay tutor ni explicaciones durante el reto, ni reloj.</p>
        <p>Si pides ayuda, puedes seguir, pero el intento queda como práctica asistida.</p>
        <p>Lo que respondes no se cambia; tus decisiones cambian lo que pasa después. Puedes salir y retomar donde te quedaste.</p>
        <p>Al final verás un informe por habilidad y por academia. No hay calificación aprobatoria: la regla todavía no está calibrada.</p>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────── paso

function StepView({ r, it, step, prog, draft, setDraft, openDoc, available }: {
  r: Reto; it: Intento; step: PasoReto; prog: ReturnType<typeof progressOf>; draft: Record<string, RespuestaReto>;
  setDraft: React.Dispatch<React.SetStateAction<Record<string, RespuestaReto>>>; openDoc: (d: string) => void; available: string[];
}) {
  const scene = prog.scene!;
  const firstOfScene = pathOf(r, it.flags).find((s) => s.scene.id === scene.id)?.step.id === step.id;
  const answered = step.id in it.answers;
  const given = it.answers[step.id];
  const d = draft[step.id];
  const set = (v: RespuestaReto) => setDraft((x) => ({ ...x, [step.id]: v }));
  const obj = (v: RespuestaReto | undefined) => (v && typeof v === "object" && !Array.isArray(v) ? v : {}) as Record<string, string>;
  const who = r.characters.find((c) => c.id === step.from);
  const docs = scene.docs.filter((x) => available.includes(x));

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-mint">Acto {scene.act + 1} · {r.acts[scene.act].title} · escena {r.scenes.indexOf(scene) + 1} de {r.scenes.length}</div>
        <h1 className="mt-1.5 text-xl sm:text-2xl font-semibold leading-tight">{scene.title}</h1>
      </div>
      {firstOfScene
        ? <p className="text-[15px] leading-relaxed text-white/80">{textOf(scene.intro, it.flags)}</p>
        : <p className="text-sm leading-relaxed text-white/55">{textOf(scene.intro, it.flags)}</p>}
      {docs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
          <span>A la mano:</span>
          {docs.map((x) => { const doc = r.docs.find((q) => q.id === x)!; return <button key={x} type="button" onClick={() => openDoc(x)} className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-white/15 bg-white/[.06] px-2.5 py-1.5 text-white/85 hover:bg-white/15"><FileText size={12} /> {doc.letter} · {doc.title}</button>; })}
        </div>
      )}

      {step.kind === "dato" ? (
        <div className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3.5">
          {who && <div className="mb-2 flex items-center gap-2 text-sm"><Face name={who.name} /><span className="font-semibold">{who.name}</span><span className="text-white/55">{who.role}</span></div>}
          <p className="text-[15px] font-medium">{textOf(step.text, it.flags)}</p>
          <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-white/85">{step.items.map((t) => <li key={t} className="flex gap-2"><span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-white/60" />{t}</li>)}</ul>
        </div>
      ) : (
        <Said r={r} who={step.from}>{textOf(step.text, it.flags)}</Said>
      )}

      {step.kind === "decision" && !answered && (
        <div className="space-y-2.5" role="group" aria-label="Elige una opción">
          {ordenOpciones(step.id, step.options).map((o, k) => <StageChoice key={o.id} on={d === o.id} onClick={() => set(o.id)} letter={LETTERS[k]}>{o.text}</StageChoice>)}
        </div>
      )}
      {step.kind === "decision" && answered && (() => { const o = step.options.find((q) => q.id === given)!; return (
        <div className="space-y-4"><Mine>{o.text}</Mine>{o.reply.map((l, k) => <Said key={k} r={r} who={l.who}>{l.text}</Said>)}</div>
      ); })()}

      {step.kind === "cifras" && (
        <div className="space-y-4">
          {step.fields.map((f) => {
            const v = answered ? obj(given)[f.id] : obj(d)[f.id];
            return <Figure key={f.id} id={`${step.id}-${f.id}`} label={f.label} unit={f.unit} locked={answered} value={v ? Number(v) : null} onChange={(n) => set({ ...obj(d), [f.id]: n === null ? "" : String(n) })} />;
          })}
          {!answered && <Calc />}
          {answered && <Anotado />}
        </div>
      )}

      {step.kind === "clasificar" && (
        <div className="space-y-4">
          <Sorter groups={step.groups} items={step.items} assign={answered ? obj(given) : obj(d)} locked={answered} onAssign={(i, g) => set({ ...obj(d), [i]: g })} />
          {answered && <Anotado />}
        </div>
      )}

      {step.kind === "armar" && (
        <div className="space-y-4">
          {step.slots.map((s) => {
            const v = answered ? obj(given)[s.id] : obj(d)[s.id];
            return (
              <div key={s.id} className="rounded-2xl bg-white px-4 py-3.5 text-ink shadow-card">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo">{s.label}</div>
                <div className="mt-2 grid gap-2" role="group" aria-label={s.label}>
                  {s.choices.map((c) => {
                    const on = v === c.id;
                    return <button key={c.id} type="button" disabled={answered} aria-pressed={on} onClick={() => set({ ...obj(d), [s.id]: c.id })} className={clsx("inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-2 text-left text-sm leading-snug", on ? "border-indigo bg-indigo text-white font-semibold" : "border-slate-200 bg-slate-50 text-slate-700", !answered && !on && "hover:border-indigo/50 hover:bg-indigo-soft/60", answered && !on && "opacity-50")}>{on && <Check size={14} strokeWidth={3} aria-hidden className="shrink-0" />}{c.text}</button>;
                  })}
                </div>
              </div>
            );
          })}
          {answered && <Anotado />}
        </div>
      )}

      {step.kind === "ordenar" && (() => {
        const order = answered ? (given as string[]) : Array.isArray(d) ? d : step.cards.map((c) => c.id);
        const move = (id: string, dir: -1 | 1) => { const o = [...order]; const k = o.indexOf(id); const j = k + dir; if (j < 0 || j >= o.length) return; [o[k], o[j]] = [o[j], o[k]]; set(o); };
        return <div className="space-y-4"><Sequencer cards={step.cards} order={order} onMove={move} locked={answered} />{answered && <Anotado />}</div>;
      })()}

      {step.kind === "escribir" && (
        answered
          ? <div className="space-y-4"><Mine>{Object.values(obj(given)).some((t) => t) ? step.fields.map((f) => <div key={f.id}>{obj(given)[f.id] || "Sin respuesta"}</div>) : "Preferiste no escribir."}</Mine><Anotado text="Tu respuesta queda guardada. Lo escrito lo revisa una persona; no se califica solo." /></div>
          : <div className="space-y-3">{step.fields.map((f) => (
              <div key={f.id}>
                <label htmlFor={`${step.id}-${f.id}`} className="block text-sm font-medium text-white/85">{f.label}</label>
                <textarea id={`${step.id}-${f.id}`} rows={4} maxLength={300} value={obj(d)[f.id] ?? ""} onChange={(e) => set({ ...obj(d), [f.id]: e.target.value.slice(0, 300) })} placeholder="Escribe aquí, con tus palabras" className="mt-1.5 w-full rounded-2xl border border-white/20 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-mint" />
              </div>
            ))}</div>
      )}
    </div>
  );
}

function Said({ r, who, children }: { r: Reto; who: string | null; children: React.ReactNode }) {
  const p = r.characters.find((c) => c.id === who);
  if (!p) return <div className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-[15px] leading-relaxed text-white/85">{children}</div>;
  return (
    <div className="flex items-start gap-3">
      <Face name={p.name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm"><span className="font-semibold">{p.name}</span><span className="text-white/55">{p.role}</span></div>
        <div className="mt-1.5 rounded-2xl rounded-tl-md bg-white px-4 py-3 text-[15px] leading-relaxed text-ink">{children}</div>
      </div>
    </div>
  );
}

function Anotado({ text = "Anotado. Lo verás en el informe al terminar." }: { text?: string }) {
  return <p role="status" className="flex items-center gap-2 text-sm text-white/70"><Clock size={14} className="text-mint" /> {text}</p>;
}

// ─────────────────────────────────────────────── hojas

function Docs({ r, docs, first, onOpen }: { r: Reto; docs: string[]; first?: string; onOpen: (d: string) => void }) {
  const [sel, setSel] = useState(first ?? docs[0]);
  useEffect(() => { if (sel) onOpen(sel); }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps
  const doc = r.docs.find((d) => d.id === sel);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Documentos">
        {docs.map((x) => { const q = r.docs.find((d) => d.id === x)!; return <button key={x} type="button" role="tab" aria-selected={sel === x} onClick={() => setSel(x)} className={clsx("min-h-[36px] rounded-lg px-3 py-1.5 text-sm font-medium", sel === x ? "bg-indigo text-white" : "bg-slate-200/70 text-slate-700 hover:bg-slate-200")}>{q.letter}</button>; })}
      </div>
      {doc && <DocCard doc={doc} />}
      <p className="text-xs text-slate-500">Los documentos que aparecen después en la historia se suman a esta sala cuando llegas a su escena.</p>
    </div>
  );
}

function Ayuda({ it, step, onAsk }: { it: Intento; step?: PasoReto; onAsk: () => void }) {
  const s = step?.skill ? skillById(step.skill) : undefined;
  if (!it.assisted) return (
    <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
      <p>Puedes pedir ayuda cuando quieras. Si lo haces, verás de qué trata la habilidad de este paso y podrás seguir con el reto.</p>
      <p>El intento quedará marcado como <span className="font-semibold">práctica asistida</span>: el informe lo dirá y no servirá como comprobación independiente. No pierdes nada de lo que llevas.</p>
      <button type="button" onClick={onAsk} className="btn bg-indigo text-white hover:bg-indigo/90 font-semibold"><LifeBuoy size={15} /> Sí, quiero ayuda</button>
    </div>
  );
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber">Práctica asistida</p>
      {s ? <><p className="font-semibold text-ink">{s.name}</p><p>{s.what}</p></> : <p>Este paso no observa una habilidad: es parte de la historia.</p>}
      <p className="text-sm text-slate-500">Para repasar el concepto completo, al terminar puedes abrir la experiencia de esa habilidad en la lista de experiencias.</p>
    </div>
  );
}

function Ficha({ r, restart }: { r: Reto; restart: () => void }) {
  const Row = ({ k, children }: { k: string; children: React.ReactNode }) => <div className="py-2.5 border-b border-slate-100 last:border-b-0"><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k}</dt><dd className="mt-0.5 text-sm leading-relaxed text-slate-700">{children}</dd></div>;
  return (
    <div>
      <dl>
        <Row k="Reto">{r.title} · {r.editorialId} · versión {r.version} · paquete {r.packageVersion}</Row>
        <Row k="Qué observa">Las 24 habilidades del Nivel 1, de 0 a {r.scale.max} cada una (96 en total), en {r.scenes.filter((s) => s.skills.length).length} escenas y una síntesis.</Row>
        <Row k="Regla de aprobación">No habilitada. Candidatos por calibrar: {r.thresholds.candidates.join(", ")} de 96, además de condiciones por academia y salvaguardas.</Row>
        <Row k="Estado">Probado con pruebas automáticas. Revisión editorial: {r.qa.editorialReviewedAt ?? "sin hacer"}. Validación con usuarios: sin hacer.</Row>
        <Row k="Registro">No registra evidencia. No cambia dominio, nivel ni perfil. El intento se guarda solo en este navegador.</Row>
        <Row k="Por confirmar en la revisión"><ul className="space-y-1.5">{r.conversionNotes.map((n) => <li key={n} className="flex gap-2"><span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />{n}</li>)}</ul></Row>
      </dl>
      <button type="button" onClick={restart} className="btn-ghost mt-4"><RotateCcw size={15} /> Borrar mi intento y empezar de nuevo</button>
    </div>
  );
}

// ─────────────────────────────────────────────── informe

function Informe({ r, it, restart }: { r: Reto; it: Intento; restart: () => void }) {
  const inf = useMemo(() => informeOf(r, it), [r, it]);
  const [open, setOpen] = useState<string | null>(null);
  const failed = inf.safeguards.filter((s) => !s.ok);
  return (
    <div className="space-y-6">
      <StepTitle eyebrow="Informe del reto" title={`${inf.got} de ${inf.auto} puntos en lo que se comprueba solo`} text={`${inf.pending ? `${inf.pending} de ${inf.max} puntos son respuestas escritas y quedan en espera de revisión de una persona.` : "No dejaste respuestas escritas en espera de revisión."} No hay veredicto: la regla de aprobación todavía no está calibrada ni habilitada.`} />
      {inf.assisted && <p className="flex items-start gap-2 rounded-xl border border-amber/40 bg-amber/10 px-3 py-2.5 text-sm leading-relaxed text-white/85"><LifeBuoy size={15} className="mt-0.5 shrink-0 text-amber" /> Pediste ayuda durante el reto: este intento es práctica asistida, no una comprobación independiente.</p>}

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mint">Salvaguardas</h2>
        <p className="text-sm text-white/70">Son requisitos de seguridad: si no se cumplen, no se compensan con puntos de otras áreas.</p>
        <ul className="space-y-2">{inf.safeguards.map((s) => (
          <li key={s.step} className={clsx("flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm", s.ok ? "border-mint/50 bg-mint/10" : "border-coral/50 bg-coral/10")}>
            {s.ok ? <ShieldCheck size={16} className="mt-0.5 shrink-0 text-mint" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-coral" />}
            <span><span className="font-semibold">{SALVA[s.kind]}.</span> {s.ok ? "Cumplida." : "No cumplida."}</span>
          </li>
        ))}</ul>
        {failed.length > 0 && <p className="text-sm text-white/75">Con {failed.length === 1 ? "una salvaguarda" : `${failed.length} salvaguardas`} sin cumplir, ningún puntaje permitiría acreditar este reto.</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mint">Por academia y por habilidad</h2>
        {inf.byAcademy.map((a) => (
          <div key={a.academy} className="rounded-2xl border border-white/[.12] bg-white/[.04]">
            <div className="flex items-baseline justify-between gap-3 px-4 pt-3.5 pb-2">
              <span className="font-semibold">{academyById(a.academy as AcademyId).name}</span>
              <span className="text-sm tabular-nums text-white/75">{a.got} de {a.auto}{a.pending ? ` · ${a.pending} en espera` : ""}</span>
            </div>
            <ul>
              {inf.observations.filter((o) => o.academy === a.academy).map((o) => {
                const isOpen = open === o.skill;
                return (
                  <li key={o.skill} className="border-t border-white/10">
                    <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : o.skill)} className="flex w-full min-h-[44px] items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[.06]">
                      <span className="min-w-0 flex-1 text-sm">{skillById(o.skill)?.name ?? o.skill}</span>
                      <Dots got={o.got} max={o.max} pending={o.pending} />
                      <span className="w-14 shrink-0 text-right text-sm tabular-nums text-white/80">{o.got} de {o.max}</span>
                    </button>
                    {isOpen && (
                      <div className="space-y-3 px-4 pb-4">
                        <p className="text-[13px] leading-relaxed text-white/65"><span className="font-semibold text-white/80">Qué sustenta 3 o 4 puntos: </span>{r.criteria[o.skill]}</p>
                        {o.from.map((f) => <Detalle key={f.step} r={r} it={it} stepId={f.step} />)}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <div className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3.5 text-sm leading-relaxed text-white/80">
        Este informe no se registra. No cambia tu nivel, tu avance ni tu perfil: el reto está en demostración y su evaluación aún no se valida. Si vuelves a intentarlo, ya conoces la historia; por eso no serviría como prueba independiente.
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={restart} className="btn bg-white/10 text-white hover:bg-white/20"><RotateCcw size={15} /> Repetir desde el inicio</button>
        <Link href="/ceo/piloto" className="btn bg-white text-ink hover:bg-white/90 font-semibold">Ver las experiencias</Link>
      </div>
    </div>
  );
}

function Dots({ got, max, pending }: { got: number; max: number; pending: number }) {
  return (
    <span aria-hidden className="flex shrink-0 gap-1">
      {Array.from({ length: max }, (_, k) => <span key={k} className={clsx("h-2 w-2 rounded-full", k < got ? "bg-mint" : k >= max - pending ? "border border-white/40" : "bg-white/20")} />)}
    </span>
  );
}

/** Qué se respondió en un paso y qué se esperaba. */
function Detalle({ r, it, stepId }: { r: Reto; it: Intento; stepId: string }) {
  const p = stepById(r, stepId)!.step;
  const v = it.answers[p.id];
  const sc = scoreStep(p, v);
  const obj = (v && typeof v === "object" && !Array.isArray(v) ? v : {}) as Record<string, string>;
  const head = <div className="text-[13px] font-semibold text-white/85">{sc.auto ? `${sc.got} de ${p.points}` : `En espera de revisión · ${p.points} ${p.points === 1 ? "punto" : "puntos"}`} <span className="font-normal text-white/55">· {textOf(p.text, it.flags)}</span></div>;
  const line = (ok: boolean, t: React.ReactNode, k?: string) => <li key={k} className="flex gap-2 text-[13px] leading-relaxed text-white/80">{ok ? <Check size={13} className="mt-1 shrink-0 text-mint" /> : <X size={13} className="mt-1 shrink-0 text-coral" />}<span>{t}</span></li>;
  let body: React.ReactNode = null;
  if (p.kind === "decision") {
    const o = p.options.find((q) => q.id === v);
    const best = p.options.filter((q) => q.tipo === "defendible");
    body = <div className="space-y-1.5 text-[13px] leading-relaxed text-white/80">
      {o && <p><span className="font-semibold">Elegiste:</span> {o.text} <span className="text-white/55">({RUTA[o.tipo]})</span>. {o.nota}</p>}
      {(!o || o.tipo !== "defendible") && best.map((b) => <p key={b.id}><span className="font-semibold">Ruta defendible:</span> {b.text} {b.nota}</p>)}
    </div>;
  } else if (p.kind === "cifras") body = <ul className="space-y-1">{p.fields.map((f) => line(Number(obj[f.id]) === f.answer, <>{f.label}: escribiste {obj[f.id] ? Number(obj[f.id]).toLocaleString("en-US") : "nada"}. Cálculo: {f.calc}.</>, f.id))}</ul>;
  else if (p.kind === "clasificar") body = <ul className="space-y-1">{p.items.map((i) => line(obj[i.id] === i.group, <>{i.text}: {p.groups.find((g) => g.id === i.group)!.label}. {i.why}</>, i.id))}</ul>;
  else if (p.kind === "armar") body = <ul className="space-y-1">{p.slots.map((s) => line(obj[s.id] === s.answer, <>{s.label}: {s.choices.find((c) => c.id === s.answer)!.text}. {s.why}</>, s.id))}</ul>;
  else if (p.kind === "ordenar") body = <p className="text-[13px] leading-relaxed text-white/80">{sc.got ? "Orden de referencia." : "Tu orden no coincide con el de referencia."} {p.order.map((id) => p.cards.find((c) => c.id === id)!.text).join(" → ")}. {p.why}</p>;
  else if (p.kind === "escribir") body = <div className="space-y-1.5 text-[13px] leading-relaxed text-white/80">
    <p><span className="font-semibold">Escribiste:</span> {Object.values(obj).filter(Boolean).join(" ") || "nada"}</p>
    <p><span className="font-semibold">Referencia para comparar:</span> {p.reference}</p>
    <p className="text-white/60">Se revisa: {p.ideas.join("; ")}.</p>
  </div>;
  return <div className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 space-y-1.5">{head}{body}</div>;
}
