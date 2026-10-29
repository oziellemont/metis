"use client";
/**
 * Evaluación de la IA de episodios (P0-D). Corre el conjunto de prueba por lotes contra la ruta
 * `api/ceo/episodio/evaluar` (gasta: tope $0.50 por día) y muestra el reporte. Solo en modo prueba.
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import clsx from "clsx";
import { useCeo } from "./CeoProvider";
import { EVAL_BUDGET_USD, EVAL_JOBS, EVAL_REPEATS, EVAL_TARGETS, passes, summarize, type EvalReport, type JobResult } from "@/lib/ceo/episodes/eval-run";

const BATCH = 12;

export function EvalAi() {
  const c = useCeo();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<EvalReport | null>(null);
  const [model, setModel] = useState("");

  async function run() {
    setBusy(true); setError(null); setReport(null); setDone(0);
    const all: JobResult[] = [];
    try {
      for (let from = 0; from < EVAL_JOBS.length; from += BATCH) {
        const r = await fetch("/api/ceo/episodio/evaluar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from, to: from + BATCH }) });
        const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; results?: JobResult[]; model?: string };
        if (!j.ok || !j.results) { setError(j.error ?? `Error ${r.status}`); break; }
        all.push(...j.results); setDone(all.length); if (j.model) setModel(j.model);
      }
      if (all.length) setReport(summarize(all));
    } finally { setBusy(false); }
  }

  if (!c.testTools) return <p className="p-6 text-sm text-slate-500">Disponible solo en modo prueba.</p>;
  const ok = report ? passes(report) : null;
  const Row = ({ label, value, target, pass }: { label: string; value: string; target: string; pass?: boolean }) => (
    <li className="flex items-center gap-3 py-2 text-sm border-b border-slate-100 last:border-0">
      <span className="flex-1 text-ink">{label}</span>
      <span className="tabular-nums font-semibold text-ink">{value}</span>
      <span className="w-28 text-right text-xs text-slate-400">meta {target}</span>
      {pass !== undefined && <span className={clsx("chip text-xs font-semibold", pass ? "bg-mint text-ink" : "bg-coral text-white")}>{pass ? "Pasa" : "No pasa"}</span>}
    </li>
  );

  return (
    <div className="space-y-5">
      <Link href="/ceo/ajustes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink"><ArrowLeft size={14} /> Ajustes</Link>
      <section className="card p-5 sm:p-6">
        <h1 className="text-xl font-semibold text-ink">Evaluación de la IA de los casos ejecutivos</h1>
        <p className="mt-2 text-sm text-slate-600">
          Corre {EVAL_JOBS.length} pruebas: 180 respuestas escritas (10 por cada uno de los 18 momentos de decisión de los tres pilotos, {EVAL_REPEATS} veces cada una para medir consistencia), 20 preguntas de datos y 8 consultas a colaboradores.
          Gasto estimado: unos $0.10 USD; tope duro de ${EVAL_BUDGET_USD.toFixed(2)} por día. Cada llamada queda registrada.
        </p>
        <button type="button" onClick={run} disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-light disabled:opacity-50">
          <Play size={15} /> {busy ? `Corriendo… ${done} de ${EVAL_JOBS.length}` : report ? "Correr otra vez" : "Correr la evaluación"}
        </button>
        {busy && <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-indigo transition-all" style={{ width: `${(done / EVAL_JOBS.length) * 100}%` }} /></div>}
        {error && <p className="mt-3 rounded-xl bg-coral-soft px-4 py-3 text-sm text-ink">{error}</p>}
      </section>

      {report && ok && (
        <>
          <section className="card p-5 sm:p-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Resultado{model ? ` · ${model}` : ""}</div>
            <ul className="mt-2">
              <Row label="Texto libre: acierta la estrategia" value={`${report.interpret.accuracy}%`} target={`≥ ${EVAL_TARGETS.accuracy}%`} pass={ok.accuracy} />
              <Row label="Texto libre: misma respuesta en 3 corridas" value={`${report.interpret.consistency}%`} target={`≥ ${EVAL_TARGETS.consistency}%`} pass={ok.consistency} />
              <Row label="Respuestas inválidas (usan el respaldo)" value={`${report.interpret.invalid}%`} target={`≤ ${EVAL_TARGETS.invalid}%`} pass={ok.invalid} />
              <Row label="Preguntas de datos: elige el dato correcto" value={`${report.facts.accuracy}%`} target={`≥ ${EVAL_TARGETS.facts}%`} pass={ok.facts} />
              <Row label="Colaborador: respuesta válida" value={`${report.advisor.valid}%`} target={`≥ ${EVAL_TARGETS.advisor}%`} pass={ok.advisor} />
              <Row label="Calidad promedio asignada (0–3)" value={String(report.interpret.quality)} target="informativo" />
              <Row label="Llamadas y costo real" value={`${report.calls} · $${report.cost.toFixed(4)}`} target={`≤ $${EVAL_BUDGET_USD.toFixed(2)}`} pass={report.cost <= EVAL_BUDGET_USD} />
            </ul>
          </section>
          <section className="card p-5 sm:p-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Acierto por momento de decisión</div>
            <ul className="mt-2 grid sm:grid-cols-2 gap-x-6">{Object.entries(report.interpret.byNode).map(([k, v]) => <li key={k} className="flex justify-between py-1 text-sm"><span className="text-slate-600">{k}</span><span className={clsx("tabular-nums font-semibold", v >= EVAL_TARGETS.accuracy ? "text-ink" : "text-coral")}>{v}%</span></li>)}</ul>
          </section>
          {report.interpret.misses.length + report.facts.misses.length > 0 && (
            <section className="card p-5 sm:p-6">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Dónde se equivocó</div>
              <ul className="mt-2 space-y-2 text-xs text-slate-600">
                {report.interpret.misses.map((m, i) => <li key={i}><b className="text-ink">{m.key}</b> esperaba «{m.expect}», eligió «{m.got ?? "nada"}»: {m.text}</li>)}
                {report.facts.misses.map((m, i) => <li key={`f${i}`}><b className="text-ink">dato</b> esperaba «{m.expect}», eligió «{m.got ?? "nada"}»: {m.q}</li>)}
              </ul>
            </section>
          )}
          <section className="card p-5 sm:p-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Para copiar</div>
            <textarea readOnly className="mt-2 w-full h-32 rounded-xl border border-slate-200 p-3 text-[11px] font-mono" value={JSON.stringify({ model, ...report }, null, 1)} />
          </section>
        </>
      )}
    </div>
  );
}
