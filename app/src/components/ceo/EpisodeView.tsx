"use client";
/**
 * Executive Decision Episode · una sola tarjeta continua (adenda v3.3 §5).
 * Encabezado (quién, etapa, reloj, avance, pausa) → hilo → preparación o decisión → cierre.
 * La lógica vive en lib/ceo/episodes; aquí solo se presenta. La IA es opcional: sin ella todo funciona.
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowRight, BookOpen, Check, FileText, HelpCircle, Lock, Pause, Play, Search, SlidersHorizontal, Timer, Users, PenLine } from "lucide-react";
import { useCeo } from "./CeoProvider";
import { Avatar, ChannelChip, Delta } from "./ui";
import { personOf } from "@/lib/ceo/cast";
import { KPI_LABEL } from "@/lib/ceo/engine";
import { lessonById } from "@/lib/ceo/lessons";
import { episodeSpec } from "@/lib/ceo/episodes/catalog";
import { MAX_ADVISOR_CONSULTS, MAX_DECISIONS, MAX_FACT_QUERIES, RUBRIC_LABEL, type EpisodeRun, type EpisodeSpec, type ParamSpec, type Strategy } from "@/lib/ceo/episodes/contracts";
import { advisorLeft, briefingLeftMs, criticalFacts, matchFact, nodeOf, queriesLeft, revealOf, sayOf, strategiesFor } from "@/lib/ceo/episodes/engine";
import { deriveTerms, rubricSummary } from "@/lib/ceo/episodes/rules";
import { interpretLocal, type Interpretation } from "@/lib/ceo/episodes/ai";

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
    <div className="max-w-2xl mx-auto">
      <section className="card p-8 text-center">
        <span className="mx-auto h-14 w-14 rounded-2xl bg-indigo-soft text-indigo grid place-items-center">{icon === "lock" ? <Lock size={24} /> : <HelpCircle size={24} />}</span>
        <h1 className="mt-4 text-xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{text}</p>
        <Link href="/ceo" className="btn-primary mt-6 inline-flex">Volver a Hoy <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}

// ───────────────────────────────────────────── portada (notificación abierta)
function Cover({ spec }: { spec: EpisodeSpec }) {
  const c = useCeo();
  const from = personOf(c.pack, spec.from);
  return (
    <div className="max-w-3xl mx-auto">
      <section className="card p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <Avatar id={spec.from} size={44} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink truncate">{from.name}</div>
            <div className="text-xs text-slate-500 truncate">{from.role}</div>
          </div>
          <ChannelChip c={spec.channel} />
        </div>
        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-indigo">Caso ejecutivo · vista previa</div>
        <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-ink">{spec.subject}</h1>
        <p className="mt-2 text-sm text-slate-500">Entre 3 y {MAX_DECISIONS} decisiones conectadas · unos {spec.minutes} minutos. Antes de decidir tienes 3 minutos para preparar: {MAX_FACT_QUERIES} consultas de datos y {MAX_ADVISOR_CONSULTS} consulta a tu equipo. Puedes pausar cuando quieras.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => c.openEpisode(spec.id)}>Abrir el caso <ArrowRight size={16} /></button>
          <button className="btn-ghost" onClick={() => c.openEpisode(spec.id, "flexible")}>Abrir sin reloj</button>
        </div>
        <p className="mt-3 text-xs text-slate-400">Sin reloj: la preparación no vence. Útil si te interrumpen o prefieres leer con calma.</p>
      </section>
    </div>
  );
}

// ───────────────────────────────────────────── tarjeta
function Card({ spec, run }: { spec: EpisodeSpec; run: EpisodeRun }) {
  const c = useCeo();
  const [err, setErr] = useState<string | null>(null);
  // Reloj local de la tarjeta: hora real + adelanto del modo prueba (igual que nowOf).
  const offset = c.s.clockOffset || 0;
  const [now, setNow] = useState(() => Date.now() + offset);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const t = setInterval(() => setNow(Date.now() + offset), 500); return () => clearInterval(t); }, [offset]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [run.turns.length, run.phase, run.queries.length, run.advisor]);
  const act = (a: Parameters<typeof c.episodeAct>[1]) => { const e = c.episodeAct(spec.id, a); setErr(e); return e; };

  const node = nodeOf(spec, run);
  const from = personOf(c.pack, spec.from);
  const stage = run.phase === "briefing" ? "Preparación" : run.phase === "closed" ? "Cierre" : node?.stage ?? "";
  const leftMs = briefingLeftMs(run, now);
  const flexible = run.briefing.mode === "flexible";

  return (
    <div className="max-w-3xl mx-auto">
      <section className="card overflow-hidden">
        {/* encabezado */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Avatar id={spec.from} size={36} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink truncate">{spec.title}</div>
              <div className="text-xs text-slate-500 truncate">{from.name} · {stage}</div>
            </div>
            {run.phase === "briefing" && (
              <span role="timer" aria-label={flexible ? "Sin reloj" : `Quedan ${Math.ceil(leftMs / 1000)} segundos de preparación`}
                className={clsx("chip tabular-nums shrink-0", run.paused ? "bg-slate-100 text-slate-500" : leftMs <= 30_000 && !flexible ? "bg-coral/10 text-coral" : "bg-indigo-soft text-indigo")}>
                <Timer size={12} /> {flexible ? "Sin reloj" : leftMs <= 0 ? "0:00" : fmtMs(leftMs)}
              </span>
            )}
            {run.phase !== "closed" && (
              <button className="btn-ghost !px-2.5 !py-1.5 shrink-0" aria-label={run.paused ? "Reanudar" : "Pausar"} onClick={() => act({ type: run.paused ? "resume" : "pause" })}>
                {run.paused ? <Play size={15} /> : <Pause size={15} />}
              </button>
            )}
          </div>
          <Progress run={run} />
        </header>

        <div className="px-4 sm:px-6 py-5 space-y-5">
          <Thread spec={spec} run={run} />
          {run.paused ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-center">
              <div className="text-sm font-semibold text-ink">Caso en pausa</div>
              <p className="mt-1 text-xs text-slate-500">El reloj está detenido. Tu avance está guardado en este y en tus otros dispositivos.</p>
              <button className="btn-primary mt-3 inline-flex" onClick={() => act({ type: "resume" })}><Play size={15} /> Reanudar</button>
            </div>
          ) : run.phase === "briefing" ? (
            <Briefing spec={spec} run={run} leftMs={leftMs} act={act} />
          ) : run.phase === "deciding" && node ? (
            <Decision key={node.id} spec={spec} run={run} act={act} />
          ) : run.phase === "closed" ? (
            <Close spec={spec} run={run} />
          ) : null}
          {err && <p role="alert" className="rounded-xl bg-coral/10 px-4 py-2.5 text-sm text-coral">{err}</p>}
          <div ref={endRef} />
        </div>
      </section>
    </div>
  );
}

const fmtMs = (ms: number) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

function Progress({ run }: { run: EpisodeRun }) {
  const done = run.turns.length + (run.phase === "closed" ? 1 : 0);
  const total = Math.max(MAX_DECISIONS - 1, run.turns.length + (run.phase === "closed" ? 0 : 1)) + 1;
  return (
    <div className="mt-2.5 flex gap-1" aria-label={`Decisión ${Math.min(run.turns.length + 1, total)}`}>
      <div className={clsx("h-1 w-6 rounded-full", run.phase === "briefing" ? "bg-indigo/50" : "bg-indigo")} />
      {Array.from({ length: total }).map((_, k) => <div key={k} className={clsx("h-1 flex-1 rounded-full", k < done ? "bg-indigo" : k === done && run.phase === "deciding" ? "bg-indigo/40" : "bg-slate-100")} />)}
    </div>
  );
}

// ───────────────────────────────────────────── hilo
function Bubble({ who, children, me }: { who?: Parameters<typeof Avatar>[0]["id"]; children: React.ReactNode; me?: boolean }) {
  const c = useCeo();
  if (me) return <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo text-white px-4 py-2.5 text-sm leading-relaxed">{children}</div></div>;
  const p = who ? personOf(c.pack, who) : null;
  return (
    <div className="flex gap-2.5">
      {who ? <Avatar id={who} size={30} /> : <span className="h-[30px] w-[30px] shrink-0 rounded-full bg-slate-100 grid place-items-center text-slate-500"><FileText size={14} /></span>}
      <div className="min-w-0 max-w-[88%]">
        {p && <div className="text-[11px] text-slate-500 mb-0.5">{p.name}</div>}
        <div className="rounded-2xl rounded-tl-md bg-slate-50 px-4 py-2.5 text-sm leading-relaxed text-ink space-y-1.5">{children}</div>
      </div>
    </div>
  );
}

function Thread({ spec, run }: { spec: EpisodeSpec; run: EpisodeRun }) {
  const c = useCeo();
  return (
    <div className="space-y-3">
      <Bubble who={spec.from}>{spec.briefing.message.map((p, i) => <p key={i}>{p}</p>)}</Bubble>
      <Facts rows={spec.briefing.context.rows} title={spec.briefing.context.title} />
      {criticalFacts(spec).map((f) => <Facts key={f.id} title="Dato crítico" rows={[[f.label, f.answer]]} tone="coral" />)}
      {run.queries.map((q, i) => (
        <div key={`q${i}`} className="space-y-2">
          <Bubble me>{q.text}</Bubble>
          <Bubble who={sourceOf(spec, q.factId)}>{q.answer}</Bubble>
        </div>
      ))}
      {run.advisor && (
        <div className="space-y-2">
          <Bubble me>{run.advisor.question ?? `${personOf(c.pack, run.advisor.id as never).name.split(" ")[0]}, ¿qué opinas?`}</Bubble>
          <Bubble who={run.advisor.id as never}>{run.advisor.answer.split("\n").map((p, i) => <p key={i}>{p}</p>)}</Bubble>
        </div>
      )}
      {run.turns.map((t, i) => (
        <div key={`t${i}`} className="space-y-2">
          {t.said?.length ? <Bubble who={spec.nodes[t.node]?.who}>{t.said.map((p, k) => <p key={k}>{p}</p>)}</Bubble> : null}
          <Bubble me>
            <div className="text-[11px] uppercase tracking-wider text-white/60">{t.stage}</div>
            {t.input.text ? <p className="mt-0.5">{t.input.text}</p> : <p className="mt-0.5">{spec.nodes[t.node]?.strategies.find((s) => s.id === t.strategy)?.text}</p>}
            {t.terms && <p className="mt-1 text-white/80 text-xs">{Object.entries(t.terms).map(([k, v]) => `${spec.terms[k]?.label ?? k}: ${v} ${spec.terms[k]?.unit ?? ""}`).join(" · ")}</p>}
          </Bubble>
          {t.interpretation && <p className="text-right text-[11px] text-slate-400">Con tus palabras: {t.interpretation.feedback}</p>}
          <Bubble who={spec.nodes[t.node]?.who}>{t.reply.map((p, k) => <p key={k}>{p}</p>)}</Bubble>
        </div>
      ))}
    </div>
  );
}
const sourceOf = (spec: EpisodeSpec, factId: string | null) => {
  const f = spec.facts.facts.find((x) => x.id === factId);
  return f && f.source !== "datos" ? (f.source as never) : undefined;
};

function Facts({ title, rows, tone }: { title: string; rows: [string, string][]; tone?: "coral" }) {
  return (
    <div className={clsx("rounded-2xl border px-4 py-3", tone === "coral" ? "border-coral/30 bg-coral/5" : "border-slate-100")}>
      <div className={clsx("text-[11px] font-semibold uppercase tracking-wider", tone === "coral" ? "text-coral" : "text-slate-400")}>{title}</div>
      <dl className="mt-1.5 grid gap-1">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 text-sm"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-ink">{v}</dd></div>)}
      </dl>
    </div>
  );
}

// ───────────────────────────────────────────── preparación
function Briefing({ spec, run, leftMs, act }: { spec: EpisodeSpec; run: EpisodeRun; leftMs: number; act: (a: Parameters<ReturnType<typeof useCeo>["episodeAct"]>[1]) => string | null }) {
  const c = useCeo();
  const [tab, setTab] = useState<"datos" | "equipo" | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const ai = useAiStatus();
  const open = leftMs > 0;
  const asked = new Set(run.queries.map((x) => x.factId));
  const suggestions = spec.facts.facts.filter((f) => !f.critical && !asked.has(f.id)).slice(0, 4);

  const free = async () => {
    const text = q.trim();
    if (text.length < 4) return;
    setBusy(true);
    // Primero el banco por palabras clave (sin costo); la IA solo si no hubo coincidencia.
    let a: Parameters<typeof act>[0] | null = matchFact(spec, text) ? { type: "fact", text, via: "libre" } : null;
    if (!a) {
      const r = await askAi({ episode: spec.id, purpose: "fact", run, question: text });
      if (r?.ok && typeof r.factId === "string") a = { type: "fact", factId: r.factId, text, via: "ia" };
      else if (r?.ok && typeof r.unknownId === "string") a = { type: "fact", unknownId: r.unknownId, text, via: "ia" };
    }
    setBusy(false);
    if (!a) { act({ type: "fact", text, via: "libre" }); return; }
    if (!act(a)) setQ("");
  };
  const advise = async (id: string, question?: string) => {
    setBusy(true);
    const r = question && question.trim().length >= 4 ? await askAi({ episode: spec.id, purpose: "advisor", run, advisor: id, question }) : null;
    setBusy(false);
    act({ type: "advisor", id, ...(question?.trim() ? { question: question.trim() } : {}), ...(r?.ok && typeof r.answer === "string" ? { answer: r.answer } : {}) });
  };

  return (
    <div className="rounded-2xl border border-indigo/15 bg-indigo-soft/20 p-4 sm:p-5">
      <div className="text-sm font-semibold text-ink">Antes de decidir</div>
      <p className="mt-0.5 text-xs text-slate-500">
        {open ? `Te quedan ${queriesLeft(run)} de ${MAX_FACT_QUERIES} consultas de datos y ${advisorLeft(run)} consulta a tu equipo. Lo que se responde sale solo de datos del caso.` : "Terminó la ventana de preparación. Sin penalización: piensa lo que necesites y decide."}
      </p>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button disabled={!open || queriesLeft(run) <= 0} onClick={() => setTab(tab === "datos" ? null : "datos")} className={clsx("rounded-xl border px-3 py-2.5 text-sm text-left flex items-center gap-2 disabled:opacity-40", tab === "datos" ? "border-indigo bg-white" : "border-slate-200 bg-white hover:border-indigo/50")}><Search size={15} className="text-indigo" /> Consultar datos</button>
        <button disabled={!open || advisorLeft(run) <= 0} onClick={() => setTab(tab === "equipo" ? null : "equipo")} className={clsx("rounded-xl border px-3 py-2.5 text-sm text-left flex items-center gap-2 disabled:opacity-40", tab === "equipo" ? "border-indigo bg-white" : "border-slate-200 bg-white hover:border-indigo/50")}><Users size={15} className="text-indigo" /> Consultar a mi equipo</button>
        <button onClick={() => act({ type: "begin" })} className="btn-primary justify-center">Decidir ahora <ArrowRight size={15} /></button>
      </div>

      {tab === "datos" && open && queriesLeft(run) > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((f) => <button key={f.id} disabled={busy} onClick={() => act({ type: "fact", factId: f.id, via: "sugerida" })} className="chip bg-white border border-slate-200 text-slate-700 hover:border-indigo/50 text-left">{f.label}</button>)}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void free(); }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={240} placeholder="O escribe tu pregunta" className="flex-1 min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <button className="btn-ghost shrink-0" disabled={busy || q.trim().length < 4}>{busy ? "…" : "Preguntar"}</button>
          </form>
          <p className="text-[11px] text-slate-400">Si no hay un dato que responda, te lo decimos y no se gasta la consulta.</p>
        </div>
      )}
      {tab === "equipo" && open && advisorLeft(run) > 0 && <AdvisorPick spec={spec} busy={busy} onAsk={advise} />}
      <AiLine ai={ai} signedIn={Boolean(c.user)} />
    </div>
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
  if (!signedIn) return <p className="mt-3 text-[11px] text-slate-400">Sin sesión iniciada, las preguntas libres se responden por palabras clave.</p>;
  if (!ai || !ai.available) return null;
  if (ai.enabled) return <p className="mt-3 text-[11px] text-slate-400">IA activa: entiende tus preguntas y tu texto libre. Nunca cambia los datos del caso.</p>;
  const activate = async () => {
    setBusy(true);
    const r = await fetch("/api/ceo/responder", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: true }) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (r?.ok) ai.set(true);
  };
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <span className="text-[11px] text-slate-500">Activa la IA para que entienda tus preguntas y tu texto libre. Sin ella, se usan palabras clave.</span>
      <button disabled={busy} onClick={() => void activate()} className="rounded-lg bg-indigo px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo/90 shrink-0">{busy ? "…" : "Activar"}</button>
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
            <button key={a.id} onClick={() => setWho(a.id)} className={clsx("rounded-xl border bg-white px-3 py-2 flex items-center gap-2 text-left", who === a.id ? "border-indigo" : "border-slate-200 hover:border-indigo/50")}>
              <Avatar id={a.id as never} size={28} />
              <span className="min-w-0"><span className="block text-sm font-medium text-ink truncate">{p.name}</span><span className="block text-[11px] text-slate-500 truncate">{a.role}</span></span>
            </button>
          );
        })}
      </div>
      {who && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); onAsk(who, q); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={240} placeholder="Tu pregunta (opcional)" className="flex-1 min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <button className="btn-ghost shrink-0" disabled={busy}>{busy ? "…" : "Consultar"}</button>
        </form>
      )}
      <p className="text-[11px] text-slate-400">Tu equipo te da su punto de vista y sus intereses. La decisión es tuya.</p>
    </div>
  );
}

// ───────────────────────────────────────────── decisión
function Decision({ spec, run, act }: { spec: EpisodeSpec; run: EpisodeRun; act: (a: Parameters<ReturnType<typeof useCeo>["episodeAct"]>[1]) => string | null }) {
  const node = nodeOf(spec, run)!;
  const sts = strategiesFor(spec, run);
  const say = sayOf(spec, run);
  const reveal = revealOf(spec, run);
  const [mode, setMode] = useState<"opciones" | "texto">("opciones");
  const [pick, setPick] = useState<string | null>(null);
  const st = sts.find((s) => s.id === pick) ?? null;
  const [params, setParams] = useState<Record<string, number>>({});
  useEffect(() => { if (st?.params) setParams(Object.fromEntries(st.params.map((p) => [p.key, run.terms[p.key] && run.terms[p.key] >= p.min && run.terms[p.key] <= p.max && run.turns.length > 0 ? run.terms[p.key] : p.default]))); }, [st, run.terms, run.turns.length]);

  return (
    <div className="space-y-3">
      <Bubble who={node.who}>{say.map((p, i) => <p key={i}>{p}</p>)}</Bubble>
      {reveal.map((b) => <Facts key={b.title} title={b.title} rows={b.rows} />)}
      <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-ink">{node.ask}</div>
          <ChannelChip c={node.channel} />
        </div>
        {node.freeText && (
          <div className="mt-3 inline-flex rounded-xl bg-slate-100 p-0.5 text-xs">
            <button onClick={() => setMode("opciones")} className={clsx("px-3 py-1.5 rounded-lg", mode === "opciones" ? "bg-white shadow-sm text-ink" : "text-slate-500")}>Opciones</button>
            <button onClick={() => setMode("texto")} className={clsx("px-3 py-1.5 rounded-lg inline-flex items-center gap-1", mode === "texto" ? "bg-white shadow-sm text-ink" : "text-slate-500")}><PenLine size={12} /> Con mis palabras</button>
          </div>
        )}
        {mode === "opciones" ? (
          <div className="mt-3 space-y-2">
            {sts.map((s) => (
              <button key={s.id} type="button" aria-pressed={pick === s.id} onClick={() => setPick(s.id)}
                className={clsx("w-full text-left rounded-xl border p-3.5 text-sm leading-relaxed transition-colors", pick === s.id ? "border-indigo bg-indigo-soft/40 text-ink" : "border-slate-200 text-ink hover:border-indigo/50")}>
                {s.text}{s.params?.length ? <span className="ml-1.5 inline-flex items-center gap-1 text-[11px] text-indigo"><SlidersHorizontal size={11} /> ajustas términos</span> : null}
              </button>
            ))}
            {st?.params?.length ? <Terms spec={spec} run={run} st={st} params={params} setParams={setParams} /> : null}
            <button disabled={!st} onClick={() => st && act({ type: "decide", strategy: st.id, ...(st.params?.length ? { params } : {}) })} className="btn-primary w-full sm:w-auto mt-1 disabled:opacity-40">Confirmar <Check size={15} /></button>
          </div>
        ) : (
          <FreeText spec={spec} run={run} act={act} />
        )}
      </div>
    </div>
  );
}

function Terms({ spec, run, st, params, setParams }: { spec: EpisodeSpec; run: EpisodeRun; st: Strategy; params: Record<string, number>; setParams: (p: Record<string, number>) => void }) {
  // Vista previa en vivo de lo que cuesta, con el mismo modelo del cierre (sin revelar si el otro lado acepta).
  const preview = useMemo(() => {
    const terms = { ...run.terms, ...(st.set ?? {}), ...params };
    return deriveTerms(spec, { ...run, terms, flags: [...run.flags, ...(st.flags ?? [])] });
  }, [spec, run, st, params]);
  return (
    <div className="rounded-xl bg-slate-50 p-4 space-y-4">
      {st.params!.map((p: ParamSpec) => (
        <label key={p.key} className="block">
          <div className="flex justify-between text-sm"><span className="text-ink font-medium">{p.label}</span><span className="tabular-nums text-indigo font-semibold">{params[p.key] ?? p.default} {p.unit}</span></div>
          <input type="range" min={p.min} max={p.max} step={p.step} value={params[p.key] ?? p.default} onChange={(e) => setParams({ ...params, [p.key]: Number(e.target.value) })} className="mt-1.5 w-full accent-indigo" aria-label={p.label} />
          {p.hint && <div className="text-[11px] text-slate-500">{p.hint}</div>}
        </label>
      ))}
      {"margen_final" in preview && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white px-3 py-2"><div className="text-slate-500">Margen de la cuenta</div><div className="font-semibold text-ink tabular-nums">{preview.margen_final.toFixed(1)}%</div></div>
          <div className="rounded-lg bg-white px-3 py-2"><div className="text-slate-500">Caja adicional</div><div className="font-semibold text-ink tabular-nums">${(preview.wc ?? 0).toFixed(1)} M</div></div>
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
  const send = async () => {
    const t = text.trim();
    if (t.length < 15) { setMsg("Escribe un poco más (al menos 15 caracteres)."); return; }
    setBusy(true); setMsg(null);
    const r = await askAi({ episode: spec.id, purpose: "interpret", run, text: t });
    let it: Interpretation | null = r?.ok && typeof r.strategy === "string" ? { strategy: r.strategy, params: r.params as Record<string, number> | undefined, quality: Number(r.quality) as 0 | 1 | 2 | 3, feedback: String(r.feedback ?? "") } : null;
    if (!it) it = interpretLocal(spec, run, t);
    setBusy(false);
    if (!it) { setMsg("No pudimos relacionar tu respuesta con una acción concreta. Elige una opción o sé más específico."); return; }
    setDraft({ text: t, it });
  };
  const confirm = () => {
    if (!draft) return;
    const { it, text: t } = draft;
    const err = act({ type: "decide", strategy: it.strategy, ...(it.params ? { params: it.params } : {}), text: t, interpretation: { quality: it.quality, feedback: it.feedback } });
    if (err) setMsg(err); else setDraft(null);
  };
  const understood = draft ? strategiesFor(spec, run).find((s) => s.id === draft.it.strategy) : null;
  if (draft && understood) {
    return (
      <div className="mt-3 space-y-3">
        <div className="rounded-xl border border-indigo/40 bg-indigo-soft/30 p-3.5 text-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">Lo que entendimos</div>
          <p className="mt-1 text-ink leading-relaxed">{understood.text}</p>
          {draft.it.params && <p className="mt-1 text-xs text-slate-500">{Object.entries(draft.it.params).map(([k, v]) => `${understood.params?.find((p) => p.key === k)?.label ?? k}: ${v}`).join(" · ")}</p>}
          {draft.it.feedback && <p className="mt-2 text-xs text-slate-500">{draft.it.feedback}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={confirm} className="btn-primary">Confirmar</button>
          <button onClick={() => setDraft(null)} className="btn-ghost">Corregir</button>
        </div>
        {msg && <p className="text-xs text-coral">{msg}</p>}
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1200} rows={4} placeholder="Escribe lo que harías o responderías, con tus palabras." className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-relaxed" />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-slate-400">Te mostramos qué acción entendimos antes de enviarla.</span>
        <button onClick={() => void send()} disabled={busy} className="btn-primary shrink-0">{busy ? "Leyendo…" : "Revisar"}</button>
      </div>
      {msg && <p className="text-xs text-coral">{msg}</p>}
    </div>
  );
}

// ───────────────────────────────────────────── cierre
function Close({ spec, run }: { spec: EpisodeSpec; run: EpisodeRun }) {
  const c = useCeo();
  const o = run.outcome!;
  const lesson = lessonById(spec.lesson);
  const rubric = rubricSummary(o.evidence);
  const owner = (id: string) => (id === "ceo" ? "Tú" : personOf(c.pack, id as never).name);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-ink text-white p-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Cierre del caso</div>
        <p className="mt-1.5 text-[15px] leading-relaxed">{o.headline}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="chip bg-white/10 text-white">+{run.xp} XP</span><span className="chip bg-white/10 text-white">{run.turns.length} decisiones</span></div>
      </div>
      {o.agreement.length > 0 && <Facts title="Lo acordado" rows={o.agreement} />}
      {o.economics.length > 0 && <Facts title="Números" rows={o.economics} />}
      {o.kpi.length > 0 && (
        <div className="rounded-2xl border border-slate-100 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Efecto en tu empresa</div>
          <ul className="mt-2 space-y-2">{o.kpi.map((k) => <li key={k.key} className="text-sm"><span className="font-medium text-ink">{KPI_LABEL[k.key]}</span> <Delta n={k.delta} /><div className="text-xs text-slate-500">{k.why}</div></li>)}</ul>
          <p className="mt-2 text-[11px] text-slate-400">Vista previa: en esta versión los efectos no se aplican a tu temporada.</p>
        </div>
      )}
      {(o.commitments.length > 0 || o.risks.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {o.commitments.length > 0 && <List title="Compromisos" items={o.commitments.map((x) => `${x.text} (${owner(x.owner)})`)} />}
          {o.risks.length > 0 && <List title="Riesgos abiertos" items={o.risks.map((x) => x.text)} />}
        </div>
      )}
      {o.luck && <p className="rounded-2xl bg-amber-soft/50 px-4 py-3 text-sm text-ink">{o.luck}</p>}
      {o.followUps.length > 0 && <List title="Lo que sigue" items={[...o.followUps].sort((a, b) => a.at - b.at).map((f) => `En ${Math.round((f.at - (run.closedAt ?? 0)) / 86_400_000)} días · ${personOf(c.pack, f.from).name}: ${f.subject}`)} />}
      <div className="rounded-2xl border border-slate-100 px-4 py-3">
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
      <div className="rounded-2xl bg-indigo-soft/40 p-4">
        <div className="text-sm font-semibold text-ink">{spec.concept.title}</div>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">{spec.concept.text}</p>
        <p className="mt-2 text-sm text-ink font-medium">{spec.concept.nota}</p>
        {lesson && <Link href={`/ceo/academy/${lesson.id}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo"><BookOpen size={14} /> La teoría: {lesson.title} <ArrowRight size={13} /></Link>}
      </div>
      <Link href="/ceo" className="btn-primary inline-flex">Volver a Hoy <ArrowRight size={16} /></Link>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-100 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>
      <ul className="mt-2 space-y-1.5 text-sm text-ink">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  );
}
