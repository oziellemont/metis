/**
 * mêtis CEO · Evaluación de la IA de episodios (P0-D). Gasta dinero: solo con permiso de Oziel.
 *
 * POST { jobs: number[] } (o { from, to }) → corre esos trabajos de EVAL_JOBS (máx. 12) y devuelve sus resultados
 * (la pantalla los junta y arma el reporte). Así ninguna llamada al servidor dura mucho.
 *
 * Candados:
 *  - sesión iniciada, IA activa para ese jugador (interruptor «ai» + CEO_AI_ENABLED=1 + consentimiento);
 *  - en producción, solo jugadores con el interruptor «episodes» (los invitados al piloto);
 *  - tope propio de la evaluación: $1.50 por día (scope «eval»), además de los topes globales del mes y del día.
 * Cada llamada queda en ceo.ai_calls con purpose «episodio_eval».
 */
import { NextResponse } from "next/server";
import { supabaseCeoAdmin, supabaseServer } from "@/lib/supabase/server";
import { aiStatusFor, flagsFor } from "@/lib/ceo/flags-server";
import { appEnvOf } from "@/lib/ceo/flags";
import { CAPS, DEFAULT_MODEL, approxTokens, costOf, periodsOf } from "@/lib/ceo/written";
import { EVAL_BUDGET_USD, EVAL_JOBS, EVAL_REPEATS, runJob, type Model } from "@/lib/ceo/episodes/eval-run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const BATCH_MAX = 12;
const num = (v: string | undefined, d: number) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : d; };

export async function GET() {
  return NextResponse.json({ ok: true, jobs: EVAL_JOBS.length, repeats: EVAL_REPEATS, budget: EVAL_BUDGET_USD });
}

export async function POST(req: Request) {
  const no = (error: string, status = 403) => NextResponse.json({ ok: false, error }, { status });
  const sb = await supabaseServer();
  const uid = sb ? (await sb.auth.getUser()).data.user?.id ?? null : null;
  if (!uid) return no("Inicia sesión para correr la evaluación.", 401);
  if (appEnvOf(process.env.VERCEL_ENV, process.env.NODE_ENV) === "production" && !(await flagsFor(uid)).episodes) return no("Tu cuenta no está invitada al piloto de episodios.");
  const st = await aiStatusFor(uid);
  if (!st.enabled) return no(st.available ? "Activa la IA en tu cuenta (Ajustes) para correr la evaluación." : "La IA no está activa en el servidor (CEO_AI_ENABLED y OPENAI_API_KEY en Vercel).");
  const admin = supabaseCeoAdmin();
  const key = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!admin || !key) return no("Servicio no configurado.", 503);

  const body = (await req.json().catch(() => ({}))) as { from?: number; to?: number; jobs?: unknown };
  let idx: number[];
  if (Array.isArray(body.jobs)) idx = [...new Set(body.jobs.map((x) => Math.floor(Number(x))).filter((k) => Number.isInteger(k) && k >= 0 && k < EVAL_JOBS.length))].slice(0, BATCH_MAX);
  else {
    const from = Math.max(0, Math.floor(Number(body.from) || 0));
    const to = Math.min(EVAL_JOBS.length, from + BATCH_MAX, Math.floor(Number(body.to) || from + BATCH_MAX));
    idx = Array.from({ length: Math.max(0, to - from) }, (_, k) => from + k);
  }
  if (!idx.length) return no("Rango inválido.", 400);

  const modelName = process.env.CEO_AI_MODEL?.trim() || DEFAULT_MODEL;
  const { day, month } = periodsOf(Date.now());
  const caps: [string, string, number][] = [
    ["global", month, num(process.env.CEO_AI_CAP_MONTH_USD, CAPS.monthlyUsd)],
    ["global", day, num(process.env.CEO_AI_CAP_DAY_USD, CAPS.dailyUsd)],
    ["eval", day, EVAL_BUDGET_USD],
  ];

  const errors = new Set<string>();
  const model: Model = async (messages, maxTokens, temperature) => {
    const est = costOf(modelName, approxTokens(messages.map((m) => m.content).join("\n")) + 20, maxTokens);
    const reserved: [string, string][] = [];
    const adjust = async (delta: number) => { for (const [s2, p2] of reserved) await admin.rpc("ai_ajustar", { p_scope: s2, p_period: p2, p_delta: delta }); };
    for (const [scope, period, cap] of caps) {
      const { data: ok } = await admin.rpc("ai_reservar", { p_scope: scope, p_period: period, p_cost: est, p_cap: cap });
      if (ok !== true) { await adjust(-est); throw new Error(`tope ${scope}`); }
      reserved.push([scope, period]);
    }
    const t0 = Date.now();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15_000);
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", signal: ctrl.signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelName, messages, temperature, max_tokens: maxTokens, response_format: { type: "json_object" } }),
      });
      clearTimeout(timer);
      const j = (await r.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number }; error?: { message?: string } };
      const inT = j.usage?.prompt_tokens ?? 0, outT = j.usage?.completion_tokens ?? 0;
      const real = costOf(modelName, inT, outT);
      await adjust(real - est);
      await admin.from("ai_calls").insert({ user_id: uid, purpose: "episodio_eval", model: modelName, input_tokens: inT, output_tokens: outT, cost_usd: real, latency_ms: Date.now() - t0, status: r.ok ? "ok" : "error", error: r.ok ? null : (j.error?.message ?? `HTTP ${r.status}`).slice(0, 300) });
      if (!r.ok) { errors.add(`OpenAI ${r.status}: ${(j.error?.message ?? "sin detalle").slice(0, 200)}`); return null; }
      return { content: j.choices?.[0]?.message?.content ?? "", cost: real };
    } catch (e) {
      await adjust(-est);
      errors.add(`Sin respuesta de OpenAI: ${String((e as Error)?.message ?? e).slice(0, 200)}`);
      await admin.from("ai_calls").insert({ user_id: uid, purpose: "episodio_eval", model: modelName, status: "error", latency_ms: Date.now() - t0, error: String((e as Error)?.message ?? e).slice(0, 300) });
      return null;
    }
  };

  // Lo gastado hoy en la evaluación (incluye corridas anteriores del mismo día): se muestra en pantalla.
  const spentToday = async () => {
    const { data } = await admin.from("ai_quota").select("cost_usd").eq("scope", "eval").eq("period", day).maybeSingle();
    return Math.round(Number((data as { cost_usd?: number } | null)?.cost_usd ?? 0) * 10000) / 10000;
  };
  try {
    const results = await Promise.all(idx.map((k) => runJob(EVAL_JOBS[k], model)));
    return NextResponse.json({ ok: true, jobs: idx, total: EVAL_JOBS.length, model: modelName, results, errors: [...errors].slice(0, 3), spent: await spentToday() });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (!msg.startsWith("tope")) return no("La evaluación falló.", 429);
    const spent = await spentToday();
    return no(msg === "tope eval"
      ? `Se alcanzó el tope de gasto de la evaluación: llevas $${spent.toFixed(2)} de $${EVAL_BUDGET_USD.toFixed(2)} hoy (cuenta todas las corridas del día). Se reinicia a la medianoche de Monterrey.`
      : "Se alcanzó el tope global de IA del día o del mes.", 429);
  }
}
