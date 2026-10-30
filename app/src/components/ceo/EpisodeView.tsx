"use client";
/**
 * Executive Decision Episode · una sola tarjeta continua (adenda v3.3 §5).
 * Encabezado (quién, etapa, reloj, avance, pausa) → hilo → preparación o decisión → cierre.
 * La lógica vive en lib/ceo/episodes; aquí solo se presenta. La IA es opcional: sin ella todo funciona.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowRight, BookOpen, Check, FileText, HelpCircle, Lock, Pause, Play, Search, SlidersHorizontal, Timer, Users, PenLine } from "lucide-react";
import { useCeo } from "./CeoProvider";
import { Stage, StageChoice, StepTitle } from "./Stage";
import { Avatar, ChannelChip, Delta } from "./ui";
import { personOf } from "@/lib/ceo/cast";
import { KPI_LABEL } from "@/lib/ceo/engine";
import { lessonById } from "@/lib/ceo/lessons";
import { episodeSpec } from "@/lib/ceo/episodes/catalog";
import { MAX_ADVISOR_CONSULTS, MAX_DECISIONS, MAX_FACT_QUERIES, RUBRIC_LABEL, type EpisodeRun, type EpisodeSpec, type ParamSpec, type Strategy } from "@/lib/ceo/episodes/contracts";
import { advisorLeft, briefingLeftMs, criticalFacts, matchFact, nodeOf, queriesLeft, revealOf, sayOf, strategiesFor } from "@/lib/ceo/episodes/engine";
import { deriveTerms, rubricSummary } from "@/lib/ceo/episodes/rules";
import { decideFrom, interpretLocal, type Interpretation } from "@/lib/ceo/episodes/ai";

type AiReply = { ok: boolean; fallback?: boolean; [k: string]: unknown };
async function askAi(body: Record<string, unknown>): Promise<AiReply | null> {
  try {
    const r = await fetch("/api/ceo/episodio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return (await r.json()) as AiReply;
  } catch { return null; }
}

export function EpisodeView({ id }: { id: string }) {
  const c = useCeo();
  const spec = episodeSpec(id);
  if (!c.ready) return null;
  if (!spec) return <Notice title="Este caso no existe" text="Revisa el enlace o vuelve a Hoy." />;
  if (!c.testTools) return <Notice title="Caso no disponible" text="Este caso no está abierto para tu cuenta." icon="lock" />;
  const run = c.s.episodes?.[id];
  if (!run) return <Cover spec={spec} />;
  return <Card spec={spec} run={run} />;
}

function Notice({ title, text, icon }: { title: string; text: string; icon?: "lock" }) {
  return (
    <Stage steps={EP_STEPS} at={0}>
      <span className="h-14 w-14 rounded-2xl bg-white/10 grid place-items-center">{icon === "lock" ? <Lock size={24} /> : <HelpCircle size={24} />}</span>
      <div className="mt-5"><StepTitle title={title} text={text} /></div>
      <Link href="/ceo" className="btn bg-white text-ink mt-6 inline-flex">Volver a Hoy <ArrowRight size={16} /></Link>
    </Stage>
  );
}

const EP_STEPS = ["El caso", "Investiga", "Decides", "Cierre", "Aprendes"];

/** Paso al que corresponde la fase del episodio. */
const phaseStep = (run?: EpisodeRun) => (!run ? 0 : run.phase === "briefing" ? 1 : run.phase === "deciding" ? 2 : 3);

// ───────────────────────────────────────────── el caso (portada)
function Cover({ spec }: { spec: EpisodeSpec }) {
  const c = useCeo();
  return (
    <Stage steps={EP_STEPS} at={0} onNext={() => c.openEpisode(spec.id)} next="Investigar"
      aside={<button type="button" onClick={() => c.openEpisode(spec.id, "flexible")} className="text-sm font-medium text-white/75 hover:text-white">Sin reloj</button>}>
      <Situation spec={spec} />
      <p className="mt-5 text-[13px] text-white/60 leading-relaxed">Entre 3 y {MAX_DECISIONS} decisiones conectadas, unos {spec.minutes} minutos. Antes de decidir tienes 3 minutos para investigar: {MAX_FACT_QUERIES} consultas de datos y {MAX_ADVISOR_CONSULTS} consulta a tu equipo. Puedes pausar cuando quieras; «Sin reloj» quita el límite de la preparación.</p>
    </Stage>
  );
}

function Situation({ spec }: { spec: EpisodeSpec }) {
  const c = useCeo();
  const from = personOf(c.pack, spec.from);
  return (
    <>
      <div className="text-xs font-semibold uppercase tracking-wider text-mint">Caso ejecutivo</div>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight">{spec.subject}</h1>
      <div className="mt-5 rounded-2xl bg-white text-ink p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <Avatar id={spec.from} size={40} />
          <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate">{from.name}</div><div className="text-xs text-slate-500 truncate">{from.role}</div></div>
          <ChannelChip c={spec.channel} />
        </div>
        <div className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-slate-700">{spec.briefing.message.map((p, i) => <p key={i}>{p}</p>)}</div>
      </div>
      <div className="mt-3"><Facts rows={spec.briefing.context.rows} title={spec.briefing.context.title} /></div>
      {criticalFacts(spec).map((f) => <div key={f.id} className="mt-3"><Facts title="Dato crítico" rows={[[f.label, f.answer]]} tone="coral" /></div>)}
      <Obligations spec={spec} />
    </>
  );
}

// ───────────────────────────────────────────── recorrido por pasos
/** Obligaciones no negociables: se muestran desde el inicio; no son opciones, el cierre dice si se cumplieron. */
function Obligations({ spec, result }: { spec: EpisodeSpec; result?: { id: string; text: string; met: boolean }[] }) {
  const rows = result ?? (spec.obligations ?? []).map((o) => ({ id: o.id, text: o.text, met: null as boolean | null }));
  if (!rows.length) return null;
  return (
    <div className="mt-3 rounded-2xl bg-white text-ink px-4 py-3 ring-2 ring-coral/60">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-coral">No negociable</div>
      <ul className="mt-2 space-y-2">
        {rows.map((o) => (
          <li key={o.id} className="flex items-start gap-2.5 text-sm">
            <span className="flex-1">{o.text}</span>
            {o.met !== null && <span className={clsx("chip shrink-0 text-xs font-semibold", o.met ? "bg-mint text-ink" : "bg-coral text-white")}>{o.met ? "Cumplida" : "Incumplida"}</span>}
          </li>
        ))}
      </ul>
      {!result && <p className="mt-2 text-[11px] text-slate-500">No son opciones. Decides cómo cumplirlas; el cierre dice si se cumplieron.</p>}
    </div>
  );
}

function Card({ spec, run }: { spec: EpisodeSpec; run: EpisodeRun }) {
  const c = useCeo();
  const [err, setErr] = useState<string | null>(null);
  // Reloj local: hora real + adelanto del modo prueba (igual que nowOf).
  const offset = c.s.clockOffset || 0;
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => { const t = setInterval(() => setNow(Date.now() + offset), 500); return () => clearInterval(t); }, [offset]);
  const act = (a: Parameters<typeof c.episodeAct>[1]) => { const e = c.episodeAct(spec.id, a); setErr(e); return e; };

  const live = phaseStep(run);
  const [view, setView] = useState(live);
  // Cuando la fase avanza, la pantalla avanza con ella.
  useEffect(() => { setView(live); }, [live, run.turns.length]);

  const node = nodeOf(spec, run);
  const leftMs = briefingLeftMs(run, now);
  const flexible = run.briefing.mode === "flexible";
  const closed = run.phase === "closed";
  const reach = closed ? 4 : live;

  const top = (
    <>
      {run.phase === "briefing" && (
        <span role="timer" aria-label={flexible ? "Sin reloj" : `Quedan ${Math.ceil(leftMs / 1000)} segundos de preparación`}
          className={clsx("chip tabular-nums", run.paused ? "bg-white/10 text-white/60" : leftMs <= 30_000 && !flexible ? "bg-coral text-white" : "bg-white/10 text-white")}>
          <Timer size={12} /> {flexible ? "Sin reloj" : leftMs <= 0 ? "0:00" : fmtMs(leftMs)}
        </span>
      )}
      {!closed && (
        <button className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center" aria-label={run.paused ? "Reanudar" : "Pausar"} onClick={() => act({ type: run.paused ? "resume" : "pause" })}>
          {run.paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
      )}
    </>
  );

  const back = view > 0 && !(closed && view === 3) ? () => setView(view - 1) : undefined;
  let onNext: (() => void) | undefined;
  let next: React.ReactNode = "Siguiente";
  if (view < live) { onNext = () => setView(view + 1); next = "Continuar"; }
  else if (view === 1 && run.phase === "briefing" && !run.paused) { onNext = () => act({ type: "begin" }); next = "Decidir ahora"; }
  else if (closed && view === 3) { onNext = () => setView(4); next = "Lo que aprendes"; }
  const aside = closed && view === 4 ? <Link href="/ceo" className="btn bg-white text-ink hover:bg-white/90 px-5 py-2.5 font-semibold">Volver a Hoy <ArrowRight size={15} /></Link> : undefined;

  return (
    <Stage steps={EP_STEPS} at={view} reach={reach} top={top} onBack={back} onNext={onNext} next={next} aside={aside}>
      {run.paused && view === live && !closed ? (
        <div className="text-center py-10">
          <span className="mx-auto h-14 w-14 rounded-2xl bg-white/10 grid place-items-center"><Pause size={24} /></span>
          <div className="mt-5"><StepTitle title="Caso en pausa" text="El reloj está detenido. Tu avance está guardado en este y en tus otros dispositivos." /></div>
          <button className="btn bg-white text-ink mt-6 inline-flex font-semibold" onClick={() => act({ type: "resume" })}><Play size={15} /> Reanudar</button>
        </div>
      ) : view === 0 ? (
        <Situation spec={spec} />
      ) : view === 1 ? (
        <Briefing spec={spec} run={run} leftMs={leftMs} act={act} readOnly={run.phase !== "briefing"} />
      ) : view === 2 && run.phase === "deciding" && node ? (
        <Decision key={node.id} spec={spec} run={run} act={act} />
      ) : view === 2 ? (
        <History spec={spec} run={run} />
      ) : view === 3 && closed ? (
        <Close spec={spec} run={run} part="cierre" />
      ) : view === 4 && closed ? (
        <Close spec={spec} run={run} part="aprendes" />
      ) : null}
      {err && <p role="alert" className="mt-4 rounded-xl bg-coral/20 px-4 py-2.5 text-sm text-white">{err}</p>}
    </Stage>
  );
}

const fmtMs = (ms: number) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

// ───────────────────────────────────────────── conversación
function Bubble({ who, children, me }: { who?: Parameters<typeof Avatar>[0]["id"]; children: React.ReactNode; me?: boolean }) {
  const c = useCeo();
  if (me) return <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-light text-white px-4 py-2.5 text-sm leading-relaxed">{children}</div></div>;
  const p = who ? personOf(c.pack, who) : null;
  return (
    <div className="flex gap-2.5">
      {who ? <Avatar id={who} size={30} /> : <span className="h-[30px] w-[30px] shrink-0 rounded-full bg-white/10 grid place-items-center text-white/70"><FileText size={14} /></span>}
      <div className="min-w-0 max-w-[88%]">
        {p && <div className="text-[11px] text-white/55 mb-0.5">{p.name}</div>}
        <div className="rounded-2xl rounded-tl-md bg-white text-ink px-4 py-2.5 text-sm leading-relaxed space-y-1.5">{children}</div>
      </div>
    </div>
  );
}

/** Una jugada ya hecha: lo que dijiste y lo que te respondieron. */
function TurnView({ spec, t }: { spec: EpisodeSpec; t: EpisodeRun["turns"][number] }) {
  return (
    <div className="space-y-2">
      <Bubble me>
        <div className="text-[11px] uppercase tracking-wider text-white/60">{t.stage}</div>
        {t.input.text ? <p className="mt-0.5">{t.input.text}</p> : <p className="mt-0.5">{spec.nodes[t.node]?.strategies.find((s) => s.id === t.strategy)?.text}</p>}
        {t.terms && <p className="mt-1 text-white/80 text-xs">{Object.entries(t.terms).map(([k, v]) => `${spec.terms[k]?.label ?? k}: ${v} ${spec.terms[k]?.unit ?? ""}`).join(" · ")}</p>}
      </Bubble>
      {t.interpretation && <p className="text-right text-[11px] text-white/50">Con tus palabras: {t.interpretation.feedback}{t.interpretation.extras ? ` · Fuera del caso: ${t.interpretation.extras}` : ""}</p>}
      <Bubble who={spec.nodes[t.node]?.who}>{t.reply.map((p, k) => <p key={k}>{p}</p>)}</Bubble>
    </div>
  );
}

/** Todas las decisiones tomadas (para repasar después del cierre). */
function History({ spec, run }: { spec: EpisodeSpec; run: EpisodeRun }) {
  return (
    <>
      <StepTitle eyebrow="Tus decisiones" title={`${run.turns.length} decisiones`} />
      <div className="mt-5 space-y-4">
        {run.turns.map((t, i) => (
          <div key={i} className="space-y-2">
            {t.said?.length ? <Bubble who={spec.nodes[t.node]?.who}>{t.said.map((p, k) => <p key={k}>{p}</p>)}</Bubble> : null}
            <TurnView spec={spec} t={t} />
          </div>
        ))}
      </div>
    </>
  );
}
const sourceOf = (spec: EpisodeSpec, factId: string | null) => {
  const f = spec.facts.facts.find((x) => x.id === factId);
  return f && f.source !== "datos" ? (f.source as never) : undefined;
};

function Facts({ title, rows, tone }: { title: string; rows: [string, string][]; tone?: "coral" }) {
  return (
    <div className={clsx("rounded-2xl px-4 py-3 text-ink", tone === "coral" ? "bg-coral-soft" : "bg-white")}>
      <div className={clsx("text-[11px] font-semibold uppercase tracking-wider", tone === "coral" ? "text-coral" : "text-slate-400")}>{title}</div>
      <dl className="mt-1.5 grid gap-1">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 text-sm"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-ink">{v}</dd></div>)}
      </dl>
    </div>
  );
}

// ───────────────────────────────────────────── preparación
function Briefing({ spec, run, leftMs, act, readOnly }: { spec: EpisodeSpec; run: EpisodeRun; leftMs: number; act: (a: Parameters<ReturnType<typeof useCeo>["episodeAct"]>[1]) => string | null; readOnly?: boolean }) {
  const c = useCeo();
  const ai = useAiStatus();
  const [tab, setTab] = useState<"datos" | "equipo" | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const open = !readOnly && leftMs > 0;
  const asked = new Set(run.queries.map((x) => x.factId));
  const suggestions = spec.facts.facts.filter((f) => !f.critical && !asked.has(f.id)).slice(0, 4);

  const free = async () => {
    const text = q.trim();
    if (text.length < 4) return;
    setBusy(true);
    // Primero la IA (entiende otras palabras; solo elige un dato del banco, nunca redacta). Si no está
    // disponible o no reconoce nada, el banco por palabras clave (sin costo).
    let a: Parameters<typeof act>[0] | null = null;
    const r = await askAi({ episode: spec.id, purpose: "fact", run, question: text });
    if (r?.ok && typeof r.factId === "string") a = { type: "fact", factId: r.factId, text, via: "ia" };
    else if (r?.ok && typeof r.unknownId === "string") a = { type: "fact", unknownId: r.unknownId, text, via: "ia" };
    if (!a && matchFact(spec, text)) a = { type: "fact", text, via: "libre" };
    setBusy(false);
    if (!a) { act({ type: "fact", text, via: "libre" }); return; }
    if (!act(a)) setQ("");
  };
  const advise = async (id: string, question?: string) => {
    setBusy(true);
    const r = question && question.trim().length >= 4 ? await askAi({ episode: spec.id, purpose: "advisor", run, advisor: id, question }) : null;
    setBusy(false);
    act({ type: "advisor", id, ...(question?.trim() ? { question: question.trim() } : {}), ...(r?.ok && typeof r.answer === "string" ? { answer: r.answer } : {}) });
    setTab(null);
  };
  const tabBtn = (on: boolean) => clsx("rounded-2xl border px-4 py-3.5 text-sm text-left flex items-center gap-2.5 transition-all disabled:opacity-40", on ? "bg-white text-ink border-white" : "bg-white/[.06] border-white/[.12] text-white hover:bg-white/10");

  return (
    <>
      <StepTitle eyebrow="Antes de decidir" title="¿Qué necesitas saber?"
        text={readOnly ? "Esto fue lo que investigaste." : open ? `Te quedan ${queriesLeft(run)} de ${MAX_FACT_QUERIES} consultas de datos y ${advisorLeft(run)} consulta a tu equipo. Lo que se responde sale solo de datos del caso.` : "Terminó el tiempo de preparación. Sin penalización: piensa lo que necesites y decide."} />

      {(run.queries.length > 0 || run.advisor) && (
        <div className="mt-6 space-y-3">
          {run.queries.map((x, i) => (
            <div key={`q${i}`} className="space-y-2">
              <Bubble me>{x.text}</Bubble>
              <Bubble who={sourceOf(spec, x.factId)}>{x.answer}</Bubble>
            </div>
          ))}
          {run.advisor && (
            <div className="space-y-2">
              <Bubble me>{run.advisor.question ?? `${personOf(c.pack, run.advisor.id as never).name.split(" ")[0]}, ¿qué opinas?`}</Bubble>
              <Bubble who={run.advisor.id as never}>{run.advisor.answer.split("\n").map((p, i) => <p key={i}>{p}</p>)}</Bubble>
            </div>
          )}
        </div>
      )}

      {!readOnly && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button disabled={!open || queriesLeft(run) <= 0} onClick={() => setTab(tab === "datos" ? null : "datos")} className={tabBtn(tab === "datos")}><Search size={16} className={tab === "datos" ? "text-indigo" : "text-mint"} /> Consultar datos</button>
          <button disabled={!open || advisorLeft(run) <= 0} onClick={() => setTab(tab === "equipo" ? null : "equipo")} className={tabBtn(tab === "equipo")}><Users size={16} className={tab === "equipo" ? "text-indigo" : "text-mint"} /> Consultar a mi equipo</button>
        </div>
      )}

      {tab === "datos" && open && queriesLeft(run) > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((f) => <button key={f.id} disabled={busy} onClick={() => { act({ type: "fact", factId: f.id, via: "sugerida" }); setTab(null); }} className="rounded-full border border-white/20 bg-white/[.06] px-3 py-1.5 text-xs text-white/85 hover:bg-white/15 text-left">{f.label}</button>)}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void free(); }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={240} placeholder="O escribe tu pregunta" className="flex-1 min-w-0 rounded-xl border border-white/20 bg-white px-3 py-2.5 text-sm text-ink" />
            <button className="btn bg-white text-ink shrink-0 font-semibold disabled:opacity-40" disabled={busy || q.trim().length < 4}>{busy ? "…" : "Preguntar"}</button>
          </form>
          <p className="text-[11px] text-white/45">Si no hay un dato que responda, te lo decimos y no se gasta la consulta.</p>
        </div>
      )}
      {tab === "equipo" && open && advisorLeft(run) > 0 && <AdvisorPick spec={spec} busy={busy} onAsk={advise} />}
      {!readOnly && <AiLine ai={ai} signedIn={Boolean(c.user)} />}
    </>
  );
}

// ───────────────────────────────────────────── estado de la IA
type AiState = { available: boolean; consent: boolean; enabled: boolean; set: (v: boolean) => void } | null;
function useAiStatus(): AiState {
  const [st, setSt] = useState<{ available: boolean; consent: boolean; enabled: boolean } | null>(null);
  useEffect(() => {
    fetch("/api/ceo/responder").then((r) => r.json()).then((j) => setSt({ available: !!j.available, consent: !!j.consent, enabled: !!j.enabled })).catch(() => setSt(null));
  }, []);
  return st ? { ...st, set: (v: boolean) => setSt((x) => (x ? { ...x, consent: v, enabled: v && x.available } : x)) } : null;
}
function AiLine({ ai, signedIn }: { ai: AiState; signedIn: boolean }) {
  const [busy, setBusy] = useState(false);
  if (!signedIn) return <p className="mt-5 text-[11px] text-white/45">Sin sesión iniciada, las preguntas libres se responden por palabras clave.</p>;
  if (!ai || !ai.available) return null;
  if (ai.enabled) return <p className="mt-5 text-[11px] text-white/45">IA activa: entiende tus preguntas y tu texto libre. Nunca cambia los datos del caso.</p>;
  const activate = async () => {
    setBusy(true);
    const r = await fetch("/api/ceo/responder", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: true }) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (r?.ok) ai.set(true);
  };
  return (
    <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/[.12] bg-white/[.06] px-4 py-3">
      <span className="text-[12px] text-white/70">Activa la IA para que entienda tus preguntas y tu texto libre. Sin ella, se usan palabras clave.</span>
      <button disabled={busy} onClick={() => void activate()} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-white/90 shrink-0">{busy ? "…" : "Activar"}</button>
    </div>
  );
}

function AdvisorPick({ spec, busy, onAsk }: { spec: EpisodeSpec; busy: boolean; onAsk: (id: string, q?: string) => void }) {
  const c = useCeo();
  const [who, setWho] = useState<string | null>(null);
  const [q, setQ] = useState("");
  return (
    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {spec.advisors.map((a) => {
          const p = personOf(c.pack, a.id as never);
          return (
            <button key={a.id} onClick={() => setWho(a.id)} className={clsx("rounded-2xl border px-3 py-2.5 flex items-center gap-2 text-left transition-all", who === a.id ? "bg-white text-ink border-white" : "bg-white/[.06] border-white/[.12] text-white hover:bg-white/10")}>
              <Avatar id={a.id as never} size={28} />
              <span className="min-w-0"><span className="block text-sm font-medium truncate">{p.name}</span><span className={clsx("block text-[11px] truncate", who === a.id ? "text-slate-500" : "text-white/55")}>{a.role}</span></span>
            </button>
          );
        })}
      </div>
      {who && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); onAsk(who, q); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={240} placeholder="Tu pregunta (opcional)" className="flex-1 min-w-0 rounded-xl border border-white/20 bg-white px-3 py-2.5 text-sm text-ink" />
          <button className="btn bg-white text-ink shrink-0 font-semibold" disabled={busy}>{busy ? "…" : "Consultar"}</button>
        </form>
      )}
      <p className="text-[11px] text-white/45">Tu equipo te da su punto de vista y sus intereses. La decisión es tuya.</p>
    </div>
  );
}

// ───────────────────────────────────────────── decisión
function Decision({ spec, run, act }: { spec: EpisodeSpec; run: EpisodeRun; act: (a: Parameters<ReturnType<typeof useCeo>["episodeAct"]>[1]) => string | null }) {
  const node = nodeOf(spec, run)!;
  const sts = strategiesFor(spec, run);
  const say = sayOf(spec, run);
  const reveal = revealOf(spec, run);
  const last = run.turns[run.turns.length - 1];
  const [mode, setMode] = useState<"opciones" | "texto">("opciones");
  const [pick, setPick] = useState<string | null>(null);
  const st = sts.find((s) => s.id === pick) ?? null;
  const [params, setParams] = useState<Record<string, number>>({});
  useEffect(() => { if (st?.params) setParams(Object.fromEntries(st.params.map((p) => [p.key, run.terms[p.key] && run.terms[p.key] >= p.min && run.terms[p.key] <= p.max && run.turns.length > 0 ? run.terms[p.key] : p.default]))); }, [st, run.terms, run.turns.length]);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-mint">Decisión {run.turns.length + 1} · {node.stage}</div>
        <ChannelChip c={node.channel} />
      </div>
      {last && <div className="mt-4"><TurnView spec={spec} t={last} /></div>}
      <div className="mt-4 space-y-3">
        <Bubble who={node.who}>{say.map((p, i) => <p key={i}>{p}</p>)}</Bubble>
        {reveal.map((b) => <Facts key={b.title} title={b.title} rows={b.rows} />)}
      </div>
      <h2 className="mt-6 text-xl sm:text-2xl font-semibold leading-snug">{node.ask}</h2>
      {node.freeText && (
        <div className="mt-4 inline-flex rounded-xl bg-white/10 p-1 text-sm">
          <button onClick={() => setMode("opciones")} className={clsx("px-3 py-1.5 rounded-lg font-medium", mode === "opciones" ? "bg-white text-ink" : "text-white/70")}>Opciones</button>
          <button onClick={() => setMode("texto")} className={clsx("px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5", mode === "texto" ? "bg-white text-ink" : "text-white/70")}><PenLine size={13} /> Con mis palabras</button>
        </div>
      )}
      {mode === "opciones" ? (
        <div className="mt-4 space-y-2.5">
          {sts.map((s) => (
            <StageChoice key={s.id} on={pick === s.id} onClick={() => setPick(s.id)}>
              {s.text}{s.params?.length ? <span className={clsx("ml-1.5 inline-flex items-center gap-1 text-[11px]", pick === s.id ? "text-indigo" : "text-mint")}><SlidersHorizontal size={11} /> ajustas términos</span> : null}
            </StageChoice>
          ))}
          {st?.params?.length ? <Terms spec={spec} run={run} st={st} params={params} setParams={setParams} /> : null}
          <button disabled={!st} onClick={() => st && act({ type: "decide", strategy: st.id, ...(st.params?.length ? { params } : {}) })} className="btn bg-white text-ink hover:bg-white/90 w-full justify-center mt-2 py-3 text-base font-semibold disabled:opacity-40">Confirmar <Check size={16} /></button>
        </div>
      ) : (
        <FreeText spec={spec} run={run} act={act} />
      )}
    </>
  );
}

/** Escribe un término con su unidad declarada en el caso ($ para millones, % pegado). */
function termValue(spec: EpisodeSpec, key: string, v: number): string {
  const t = spec.terms[key];
  const n = v.toFixed(t?.decimals ?? 0);
  if (!t) return n;
  if (t.unit === "M") return `$${n} M`;
  if (t.unit === "%") return `${n}%`;
  return `${n} ${t.unit}`;
}

function Terms({ spec, run, st, params, setParams }: { spec: EpisodeSpec; run: EpisodeRun; st: Strategy; params: Record<string, number>; setParams: (p: Record<string, number>) => void }) {
  // Vista previa en vivo de lo que cuesta, con el mismo modelo del cierre (sin revelar si el otro lado acepta).
  const preview = useMemo(() => {
    const terms = { ...run.terms, ...(st.set ?? {}), ...params };
    return deriveTerms(spec, { ...run, terms, flags: [...run.flags, ...(st.flags ?? [])] });
  }, [spec, run, st, params]);
  return (
    <div data-noswipe className="rounded-2xl bg-white text-ink p-4 space-y-4">
      {st.params!.map((p: ParamSpec) => (
        <label key={p.key} className="block">
          <div className="flex justify-between text-sm"><span className="text-ink font-medium">{p.label}</span><span className="tabular-nums text-indigo font-semibold">{params[p.key] ?? p.default} {p.unit}</span></div>
          <input type="range" min={p.min} max={p.max} step={p.step} value={params[p.key] ?? p.default} onChange={(e) => setParams({ ...params, [p.key]: Number(e.target.value) })} className="mt-1.5 w-full accent-indigo" aria-label={p.label} />
          {p.hint && <div className="text-[11px] text-slate-500">{p.hint}</div>}
        </label>
      ))}
      {(spec.preview ?? []).length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {spec.preview!.map((p) => (
            <div key={p.key} className="rounded-lg bg-slate-50 px-3 py-2"><div className="text-slate-500">{p.label}</div><div className="font-semibold text-ink tabular-nums">{termValue(spec, p.key, preview[p.key] ?? 0)}</div></div>
          ))}
        </div>
      )}
    </div>
  );
}

function FreeText({ spec, run, act }: { spec: EpisodeSpec; run: EpisodeRun; act: (a: Parameters<ReturnType<typeof useCeo>["episodeAct"]>[1]) => string | null }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ text: string; it: Interpretation } | null>(null);
  const [ask, setAsk] = useState<{ text: string; it: Interpretation } | null>(null);
  const send = async () => {
    const t = text.trim();
    if (t.length < 15) { setMsg("Escribe un poco más (al menos 15 caracteres)."); return; }
    setBusy(true); setMsg(null); setAsk(null);
    const r = await askAi({ episode: spec.id, purpose: "interpret", run, text: t });
    let it: Interpretation | null = r?.ok && typeof r.status === "string" ? (r as unknown as Interpretation) : null;
    if (!it) it = interpretLocal(spec, run, t);
    setBusy(false);
    if (!it || it.status === "fuera") { setMsg("No pudimos relacionar tu respuesta con una acción concreta en esta decisión. Di qué harías (por ejemplo, qué ofreces, a quién avisas o qué pides) o elige una opción."); return; }
    // Ambigua: nunca se decide por el jugador. Se le pregunta y elige él.
    if (it.status === "ambigua" || !it.strategy) { setAsk({ text: t, it }); return; }
    setDraft({ text: t, it });
  };
  const pick = (id: string) => {
    if (!ask) return;
    const st = strategiesFor(spec, run).find((s) => s.id === id);
    if (!st) return;
    const params: Record<string, number> = {};
    for (const p of st.params ?? []) params[p.key] = p.default;
    setDraft({ text: ask.text, it: { strategy: id, status: "clara", ...(st.params?.length ? { params } : {}), quality: ask.it.quality, feedback: ask.it.feedback || "Aclaraste tu intención: cuando una instrucción admite dos lecturas, el equipo ejecuta la que no querías." } });
    setAsk(null);
  };
  const confirm = () => {
    if (!draft) return;
    const a = decideFrom(draft.it, draft.text, Date.now());
    if (!a) return;
    const err = act(a);
    if (err) setMsg(err); else setDraft(null);
  };
  if (ask) {
    const opts = strategiesFor(spec, run).filter((s) => ask.it.options?.includes(s.id));
    return (
      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-white text-ink p-4 text-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">Antes de decidir, aclara</div>
          <p className="mt-1 text-ink leading-relaxed">{ask.it.clarify}</p>
          <p className="mt-2 text-xs text-slate-500">Tu respuesta admite más de una lectura y cada una tiene consecuencias distintas. No enviamos nada hasta que elijas.</p>
        </div>
        <div className="space-y-2">{opts.map((s) => <button key={s.id} onClick={() => pick(s.id)} className="w-full text-left rounded-2xl bg-white/10 hover:bg-white/15 text-white px-4 py-3 text-sm">{s.text}</button>)}</div>
        <button onClick={() => setAsk(null)} className="btn text-white/75 hover:text-white">Reescribir</button>
      </div>
    );
  }
  const understood = draft ? strategiesFor(spec, run).find((s) => s.id === draft.it.strategy) : null;
  if (draft && understood) {
    return (
      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-white text-ink p-4 text-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">Lo que entendimos</div>
          <p className="mt-1 text-ink leading-relaxed">{understood.text}</p>
          {draft.it.params && <p className="mt-1 text-xs text-slate-500">{Object.entries(draft.it.params).map(([k, v]) => `${understood.params?.find((p) => p.key === k)?.label ?? k}: ${v}`).join(" · ")}</p>}
          {draft.it.extras && <p className="mt-2 text-xs text-ink"><b>También propusiste:</b> {draft.it.extras}. El caso no modela esa parte: tu interlocutor la escuchará, pero las consecuencias se calculan con la acción de arriba.</p>}
          {draft.it.feedback && <p className="mt-2 text-xs text-slate-500">{draft.it.feedback}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={confirm} className="btn bg-white text-ink hover:bg-white/90 font-semibold">Confirmar</button>
          <button onClick={() => setDraft(null)} className="btn text-white/75 hover:text-white">Corregir</button>
        </div>
        {msg && <p className="text-xs text-white bg-coral/25 rounded-lg px-3 py-2">{msg}</p>}
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1200} rows={4} placeholder="Escribe lo que harías o responderías, con tus palabras." className="w-full rounded-2xl border border-white/20 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink" />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-white/50">Te mostramos qué acción entendimos antes de enviarla.</span>
        <button onClick={() => void send()} disabled={busy} className="btn bg-white text-ink hover:bg-white/90 font-semibold shrink-0">{busy ? "Leyendo…" : "Revisar"}</button>
      </div>
      {msg && <p className="text-xs text-white bg-coral/25 rounded-lg px-3 py-2">{msg}</p>}
    </div>
  );
}

// ───────────────────────────────────────────── cierre
function Close({ spec, run, part }: { spec: EpisodeSpec; run: EpisodeRun; part: "cierre" | "aprendes" }) {
  const c = useCeo();
  const o = run.outcome!;
  const lesson = lessonById(spec.lesson);
  const rubric = rubricSummary(o.evidence);
  const owner = (id: string) => (id === "ceo" ? "Tú" : personOf(c.pack, id as never).name);
  if (part === "cierre") return (
    <>
      <StepTitle eyebrow="Cierre del caso" title={o.headline} />
      <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="chip bg-mint text-ink font-semibold">+{run.xp} XP</span><span className="chip bg-white/10 text-white">{run.turns.length} decisiones</span></div>
      <div className="mt-6 space-y-3 text-ink">
        {o.obligations && o.obligations.length > 0 && <div className="-mt-3"><Obligations spec={spec} result={o.obligations} /></div>}
        {o.agreement.length > 0 && <Facts title={spec.obligations?.length ? "Lo que hiciste" : "Lo acordado"} rows={o.agreement} />}
        {o.economics.length > 0 && <Facts title="Números" rows={o.economics} />}
        {o.kpi.length > 0 && (
          <div className="rounded-2xl bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Efecto en tu empresa</div>
            <ul className="mt-2 space-y-2">{o.kpi.map((k) => <li key={k.key} className="text-sm"><span className="font-medium text-ink">{KPI_LABEL[k.key]}</span> <Delta n={k.delta} /><div className="text-xs text-slate-500">{k.why}</div></li>)}</ul>
            <p className="mt-2 text-[11px] text-slate-400">Vista previa: en esta versión los efectos no se aplican a tu temporada.</p>
          </div>
        )}
        {o.commitments.length > 0 && <List title="Compromisos" items={o.commitments.map((x) => `${x.text} (${owner(x.owner)})`)} />}
        {o.risks.length > 0 && <List title="Riesgos abiertos" items={o.risks.map((x) => x.text)} />}
        {o.luck && <p className="rounded-2xl bg-amber-soft px-4 py-3 text-sm text-ink">{o.luck}</p>}
        {o.followUps.length > 0 && <List title="Lo que sigue" items={[...o.followUps].sort((a, b) => a.at - b.at).map((f) => `En ${Math.round((f.at - (run.closedAt ?? 0)) / 86_400_000)} días · ${personOf(c.pack, f.from).name}: ${f.subject}`)} />}
      </div>
    </>
  );
  return (
    <>
      <StepTitle eyebrow="Lo que aprendes" title={spec.concept.title} text={spec.concept.text} />
      <div className="mt-6 space-y-3 text-ink">
        <div className="rounded-2xl bg-white p-4 sm:p-5">
          <div className="flex gap-2.5"><BookOpen size={16} className="text-indigo shrink-0 mt-0.5" /><p className="text-sm font-medium">{spec.concept.nota}</p></div>
          {lesson && <Link href={`/ceo/academy/${lesson.id}`} className="mt-4 flex items-center gap-3 rounded-xl bg-indigo text-white px-4 py-3 hover:bg-indigo-light transition-colors"><BookOpen size={17} /><span className="flex-1 text-sm"><b>La teoría:</b> {lesson.title}</span><ArrowRight size={14} /></Link>}
        </div>
        <div className="rounded-2xl bg-white px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cómo decidiste</div>
          <ul className="mt-2 space-y-1.5">
            {rubric.map((r) => (
              <li key={r.dim} className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-ink">{RUBRIC_LABEL[r.dim]}</span>
                <span className="flex gap-0.5" aria-label={`${r.level} de 3`}>{[1, 2, 3].map((n) => <span key={n} className={clsx("h-1.5 w-5 rounded-full", r.level >= n - 0.25 ? "bg-indigo" : "bg-slate-100")} />)}</span>
              </li>
            ))}
          </ul>
          <ul className="mt-3 space-y-1 text-xs text-slate-500">{o.evidence.map((e, i) => <li key={i}>· {e.basis}{e.reliability === "ia_provisional" ? " (provisional)" : ""}</li>)}</ul>
        </div>
      </div>
    </>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>
      <ul className="mt-2 space-y-1.5 text-sm text-ink">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  );
}
