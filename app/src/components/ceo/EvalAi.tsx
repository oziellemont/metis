"use client";
/**
 * Evaluación de la IA de episodios (P0-D). Corre el conjunto elegido por lotes contra la ruta
 * `api/ceo/episodio/evaluar` (gasta: tope $0.50 por día) y muestra el reporte. Solo en modo prueba.
 * La validación final y el conjunto de desarrollo se corren y se reportan por separado.
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import clsx from "clsx";
import { useCeo } from "./CeoProvider";
import { EVAL_BUDGET_USD, EVAL_JOBS, EVAL_REPEATS, EVAL_SCOPES, EVAL_TARGETS, evalSizes, passes, summarize, type DemoResult, type EvalReport, type JobResult, type SetReport } from "@/lib/ceo/episodes/eval-run";
import { EPISODES } from "@/lib/ceo/episodes/catalog";

const BATCH = 12;
type Scope = keyof typeof EVAL_SCOPES;

export function EvalAi() {
  const c = useCeo();
  const [busy, setBusy] = useState<Scope | null>(null);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<EvalReport | null>(null);
  const [model, setModel] = useState("");

  async function run(scope: Scope) {
    const ids = EVAL_SCOPES[scope];
    setBusy(scope); setError(null); setReport(null); setDone(0);
    const all: JobResult[] = [];
    try {
      for (let k = 0; k < ids.length; k += BATCH) {
        const r = await fetch("/api/ceo/episodio/evaluar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobs: ids.slice(k, k + BATCH) }) });
        const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; results?: JobResult[]; model?: string; errors?: string[] };
        if (!j.ok || !j.results) { setError(j.error ?? `Error ${r.status}`); break; }
        const allFailed = j.results.every((x) => x.cost === 0) && (j.errors?.length ?? 0) > 0;
        if (allFailed) { setError(`OpenAI rechazó las llamadas; se detuvo sin gastar. Detalle: ${j.errors!.join(" · ")}`); all.length = 0; break; }
        all.push(...j.results); setDone(all.length); if (j.model) setModel(j.model);
      }
      if (all.length) setReport(summarize(all));
    } finally { setBusy(null); }
  }

  if (!c.testTools) return <p className="p-6 text-sm text-slate-500">Disponible solo en modo prueba.</p>;
  const total = busy ? EVAL_SCOPES[busy].length : 0;
  return (
    <div className="space-y-5">
      <Link href="/ceo/ajustes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink"><ArrowLeft size={14} /> Ajustes</Link>
      <section className="card p-5 sm:p-6">
        <h1 className="text-xl font-semibold text-ink">Evaluación de la IA de los casos ejecutivos</h1>
        <p className="mt-2 text-sm text-slate-600">
          Dos conjuntos separados. <b>Validación final (ronda 3)</b>: {evalSizes("val").interpret} respuestas nuevas que no se usaron para ajustar nada (claras, ambiguas, fuera de tema, con propuestas propias y con tono marcado), {evalSizes("val").facts} preguntas de datos y {evalSizes("val").advisor} consultas a colaboradores, más {EVAL_SCOPES.validacion.length - EVAL_JOBS.filter((j) => j.kind !== "demo" && j.set === "val").length} conversaciones completas de demostración.
          <b> Desarrollo</b>: {evalSizes("dev").interpret} respuestas con las que se ajustaron los prompts (incluye la validación de la ronda 2). Cada respuesta escrita se corre {EVAL_REPEATS} veces para medir consistencia; las que deciden se adaptan con la misma tubería que usa el juego.
        </p>
        <p className="mt-2 text-xs text-slate-500">Tope duro de ${EVAL_BUDGET_USD.toFixed(2)} USD por día entre ambas. Cada llamada queda registrada.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => run("validacion")} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-indigo px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-light disabled:opacity-50">
            <Play size={15} /> {busy === "validacion" ? `Corriendo… ${done} de ${total}` : "Validación final y demostración"}
          </button>
          <button type="button" onClick={() => run("desarrollo")} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-slate-200 disabled:opacity-50">
            <Play size={15} /> {busy === "desarrollo" ? `Corriendo… ${done} de ${total}` : "Conjunto de desarrollo"}
          </button>
        </div>
        {busy && <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-indigo transition-all" style={{ width: `${(done / Math.max(1, total)) * 100}%` }} /></div>}
        {error && <p className="mt-3 rounded-xl bg-coral-soft px-4 py-3 text-sm text-ink">{error}</p>}
      </section>

      {report && (
        <>
          {report.val && <SetView title="Validación final (respuestas nuevas)" r={report.val} model={model} judged />}
          {report.demos.length > 0 && <Demos demos={report.demos} />}
          {report.dev && <SetView title="Conjunto de desarrollo" r={report.dev} model={model} />}
          <section className="card p-5 sm:p-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Costo · {report.calls} llamadas · ${report.cost.toFixed(4)} USD</div>
            <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Para copiar</div>
            <textarea readOnly className="mt-2 w-full h-32 rounded-xl border border-slate-200 p-3 text-[11px] font-mono" value={JSON.stringify({ model, ...report }, null, 1)} />
          </section>
        </>
      )}
    </div>
  );
}

function Row({ label, value, target, pass }: { label: string; value: string; target: string; pass?: boolean }) {
  return (
    <li className="flex items-center gap-3 py-2 text-sm border-b border-slate-100 last:border-0">
      <span className="flex-1 text-ink">{label}</span>
      <span className="tabular-nums font-semibold text-ink">{value}</span>
      <span className="w-24 text-right text-xs text-slate-400">meta {target}</span>
      {pass !== undefined && <span className={clsx("chip text-xs font-semibold w-20 justify-center", pass ? "bg-mint text-ink" : "bg-coral text-white")}>{pass ? "Pasa" : "No pasa"}</span>}
    </li>
  );
}

const KIND: Record<string, string> = { clara: "Claras", parcial: "Con propuesta propia", ambigua: "Ambiguas (debe preguntar)", fuera: "Fuera de tema (no compromete)", dato: "Dato que existe", inexistente: "Dato que no existe", ambigua_f: "Pregunta ambigua", ajena: "Ajena al caso", normal: "Pregunta normal", tentar: "Le piden elegir", desconocido: "Algo que nadie sabe", abierta: "Pregunta abierta" };

function SetView({ title, r, model, judged }: { title: string; r: SetReport; model: string; judged?: boolean }) {
  const ok = passes(r);
  const i = r.interpret, a = i.adaptive;
  return (
    <>
      <section className="card p-5 sm:p-6">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}{model ? ` · ${model}` : ""}{judged ? " · aquí se juzgan las metas" : ""}</div>
        <ul className="mt-2">
          <Row label={`Texto libre: interpreta bien (${i.total} respuestas)`} value={`${i.accuracy}%`} target={`≥ ${EVAL_TARGETS.accuracy}%`} pass={ok.accuracy} />
          <Row label="Texto libre: misma lectura en 3 corridas" value={`${i.consistency}%`} target={`≥ ${EVAL_TARGETS.consistency}%`} pass={ok.consistency} />
          <Row label="Respuestas inválidas (usan el respaldo)" value={`${i.invalid}%`} target={`≤ ${EVAL_TARGETS.invalid}%`} pass={ok.invalid} />
          <Row label="Ambiguas o fuera de tema que comprometieron una decisión" value={String(i.ambiguousCommitted + i.offTopicCommitted)} target="0" pass={ok.ambiguousCommitted} />
          <Row label={`Datos: elige el correcto (${r.facts.total} preguntas)`} value={`${r.facts.accuracy}%`} target={`≥ ${EVAL_TARGETS.facts}%`} pass={ok.facts} />
          <Row label="Datos: mostró un dato distinto al que pidió" value={String(r.facts.wrongFact)} target="0" pass={ok.factWrong} />
          <Row label="Datos: inventados que llegaron al jugador" value={String(r.facts.inventedShown)} target="0" pass={ok.inventedShown} />
          <Row label={`Colaborador: útil, sin recomendar ni inventar (${r.advisor.total})`} value={`${r.advisor.quality}%`} target={`≥ ${EVAL_TARGETS.advisor}%`} pass={ok.advisor} />
        </ul>
        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Informativo</div>
        <ul className="mt-1">
          <Row label="Preguntó de más en respuestas claras" value={String(i.overAsked)} target="bajo" />
          <Row label="Reacción adaptada que pasó la regla de fidelidad del motor" value={`${a.adapted} de ${a.replies}`} target="alto" />
          {a.audited > 0 && <Row label="…fiel según el auditor (mismo desenlace, nada agregado)" value={`${a.faithful} de ${a.audited}`} target="todas" />}
          {a.audited > 0 && <Row label="…reacciona a algo concreto del jugador (auditor)" value={`${a.reacts} de ${a.audited}`} target="alto" />}
          <Row label="…que retoma palabras suyas" value={`${a.echoes} de ${a.adapted}`} target="alto" />
          <Row label="Tono detectado con cita (respeto u hostilidad)" value={`${a.tone.hit} de ${a.tone.total}`} target="alto" />
          <Row label="Tono puesto donde no lo había" value={`${a.tone.falsePositive} de ${a.tone.neutral}`} target="bajo" />
          <Row label="Propuestas propias reconocidas" value={`${a.extras.hit} de ${a.extras.total}`} target="alto" />
          <Row label="Colaborador: pasó la validación automática" value={`${r.advisor.valid}%`} target="—" />
          <Row label="Colaborador: recomendó / inventó (auditor)" value={`${r.advisor.recommends} / ${r.advisor.invents}`} target="0 / 0" />
          <Row label="Calidad promedio asignada (0–3)" value={String(i.quality)} target="—" />
        </ul>
        <div className="mt-4 grid sm:grid-cols-2 gap-x-6 text-sm">
          {Object.entries(i.byKind).map(([k, v]) => <div key={k} className="flex justify-between py-1"><span className="text-slate-600">{KIND[k] ?? k} ({v.total})</span><span className={clsx("tabular-nums font-semibold", v.accuracy >= 95 ? "text-ink" : "text-coral")}>{v.accuracy}%</span></div>)}
          {Object.entries(r.facts.byKind).map(([k, v]) => <div key={`f${k}`} className="flex justify-between py-1"><span className="text-slate-600">Datos · {KIND[k === "ambigua" ? "ambigua_f" : k] ?? k} ({v.total})</span><span className={clsx("tabular-nums font-semibold", v.accuracy >= 95 ? "text-ink" : "text-coral")}>{v.accuracy}%</span></div>)}
          {Object.entries(r.advisor.byKind).map(([k, v]) => <div key={`a${k}`} className="flex justify-between py-1"><span className="text-slate-600">Colaborador · {KIND[k] ?? k} ({v.total})</span><span className={clsx("tabular-nums font-semibold", v.quality >= 95 ? "text-ink" : "text-coral")}>{v.quality}%</span></div>)}
        </div>
      </section>
      {i.misses.length + i.adaptMisses.length + r.facts.misses.length + r.advisor.misses.length > 0 && (
        <section className="card p-5 sm:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Dónde falló · {title}</div>
          <ul className="mt-2 space-y-2 text-xs text-slate-600">
            {i.adaptMisses.map((m, k) => <li key={`ad${k}`}><b className="text-ink">{m.key} · adaptación</b> {m.motivo}: «{m.reply}» (autor: «{m.authored}»)</li>)}
            {i.misses.map((m, k) => <li key={k}><b className="text-ink">{m.key}</b> ({m.kind}) esperaba «{m.expect}», leyó «{m.got ?? "nada"}»: {m.text}</li>)}
            {r.facts.misses.map((m, k) => <li key={`f${k}`}><b className="text-ink">dato</b> esperaba «{m.expect}», eligió «{m.got}»: {m.q}</li>)}
            {r.advisor.misses.map((m, k) => <li key={`a${k}`}><b className="text-ink">{m.key}</b> «{m.q}» → {m.motivo}{m.answer ? `: ${m.answer}` : ""}</li>)}
          </ul>
        </section>
      )}
      {i.samples.length > 0 && (
        <section className="card p-5 sm:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ejemplos de reacción adaptada · {title}</div>
          <ul className="mt-2 space-y-3 text-xs">
            {i.samples.map((s, k) => (
              <li key={k} className="border-b border-slate-100 pb-2 last:border-0">
                <div className="text-slate-400">{s.key}</div>
                <div className="text-ink"><b>Jugador:</b> {s.text}</div>
                <div className="text-slate-500"><b>Guion del autor:</b> {s.authored}</div>
                <div className="text-ink"><b>Reacción adaptada:</b> {s.reply}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Demos({ demos }: { demos: DemoResult[] }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Demostración: conversaciones completas con la IA</div>
      <p className="mt-1 text-xs text-slate-500">Cada guion corre el caso entero con el motor real. Compara los dos de Diego: la intención es la misma, la forma no. El tono mueve la confianza y eso cambia lo que pasa después.</p>
      <div className="mt-3 space-y-5">
        {demos.map((d) => (
          <div key={d.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-ink text-sm">{d.title}{d.path.some((p, k) => p.split(":")[1] !== d.expected[k]) ? " · se desvió del guion" : ""}</b><span className="text-xs text-slate-500">Confianza final {d.trust > 0 ? `+${d.trust}` : d.trust} · {d.steps.length} decisiones{d.headline ? ` · ${d.headline}` : ""}</span></div>
            <ol className="mt-3 space-y-3 text-xs">
              {d.steps.map((s, k) => {
                const st = EPISODES[d.ep]?.nodes[s.node]?.strategies.find((x) => x.id === s.strategy);
                return (
                  <li key={k} className="space-y-1">
                    <div className="text-slate-400">{s.stage} · confianza {s.trust > 0 ? `+${s.trust}` : s.trust}{s.tone ? ` · tono ${s.tone > 0 ? "respetuoso (+1)" : "hostil (−1)"}${s.toneEvidence ? `: «${s.toneEvidence}»` : ""}` : ""}</div>
                    <div className="text-ink"><b>Tú:</b> {s.text}</div>
                    {s.status === "ambigua" && <div className="text-indigo"><b>La IA preguntó antes de decidir:</b> {s.clarify} <span className="text-slate-500">(opciones: {s.options?.join(", ")}; el jugador eligió «{s.strategy}»)</span></div>}
                    <div className="text-slate-500"><b>Se entendió:</b> {st?.text ?? s.strategy}{s.extras ? ` · También propusiste: ${s.extras}` : ""}</div>
                    <div className="text-ink"><b>Respuesta{s.adapted ? " (adaptada)" : ""}:</b> {s.reply.join(" ")}</div>
                    {s.adapted && <div className="text-slate-400"><b>Guion original:</b> {s.authored.join(" ")}</div>}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
