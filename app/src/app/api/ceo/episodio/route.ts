/**
 * mêtis CEO · IA dentro de un Executive Decision Episode (adenda v3.3, P0-B).
 *
 * POST { episode, purpose: "fact" | "advisor" | "interpret", run, question?, advisor?, text? }
 *   → fact:      { ok:true, factId | unknownId }        (el texto que ve el jugador sale del banco, nunca de la IA)
 *   → advisor:   { ok:true, answer }                     (validado: sin cifras nuevas ni recomendar opción)
 *   → interpret: { ok:true, status: clara|parcial|ambigua|fuera, strategy|null, params?, options?, clarify?, extras?, tone?, reply?, quality, feedback }
 *                (ambigua: la pantalla pregunta y el jugador elige; nunca se compromete una decisión ambigua)
 *   o { ok:false, fallback:true } → la pantalla usa el respaldo sin IA (palabras clave / texto del autor / elegir opción).
 *
 * Mismos candados y topes que las respuestas escritas: interruptor «ai» + CEO_AI_ENABLED=1 + consentimiento,
 * reserva atómica de gasto (mes $50, día $3, jugador $0.05) y registro en ceo.ai_calls.
 * Mientras el flag «episodes» esté apagado, esta ruta solo atiende a quien tenga las herramientas de prueba.
 */
import { NextResponse } from "next/server";
import { supabaseCeoAdmin, supabaseServer } from "@/lib/supabase/server";
import { aiStatusFor, flagsFor } from "@/lib/ceo/flags-server";
import { appEnvOf } from "@/lib/ceo/flags";
import { CAPS, DEFAULT_MODEL, approxTokens, costOf, periodsOf } from "@/lib/ceo/written";
import { episodeSpec } from "@/lib/ceo/episodes/catalog";
import { advisorAnswer, nodeOf, sanitizeRun, sayOf } from "@/lib/ceo/episodes/engine";
import { EPISODE_AI_MAX_TOKENS, advisorMessages, factMessages, interpretMessages, parseAdvisor, parseFact, parseInterpretation, type EpisodeAiPurpose } from "@/lib/ceo/episodes/ai";

export const dynamic = "force-dynamic";
const num = (v: string | undefined, d: number) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : d; };

export async function POST(req: Request) {
  const fallback = (error: string, status = 200) => NextResponse.json({ ok: false, fallback: true, error }, { status });
  const sb = await supabaseServer();
  const uid = sb ? (await sb.auth.getUser()).data.user?.id ?? null : null;
  if (!uid) return fallback("Sin sesión: se usa el modo sin IA.", 401);
  // En producción, solo con el flag «episodes» encendido (hoy apagado). En vista previa y local, siempre.
  if (appEnvOf(process.env.VERCEL_ENV, process.env.NODE_ENV) === "production" && !(await flagsFor(uid)).episodes) return fallback("Los episodios no están publicados.", 403);
  const st = await aiStatusFor(uid);
  if (!st.enabled) return fallback("La IA no está activa: se usa el modo sin IA.", 403);
  const admin = supabaseCeoAdmin();
  const key = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!admin || !key) return fallback("Servicio no configurado.", 503);

  const body = (await req.json().catch(() => ({}))) as { episode?: string; purpose?: string; run?: unknown; question?: string; advisor?: string; text?: string };
  const spec = episodeSpec(String(body.episode ?? ""));
  const run = sanitizeRun(body.run);
  const purpose = body.purpose as EpisodeAiPurpose;
  if (!spec || !run || run.episode !== spec.id || !["fact", "advisor", "interpret"].includes(purpose)) return fallback("Solicitud inválida.", 400);

  let messages: { role: "system" | "user"; content: string }[];
  let parse: (raw: string) => Record<string, unknown> | null;
  if (purpose === "fact") {
    const q = String(body.question ?? "").trim();
    if (q.length < 4) return fallback("Pregunta muy corta.", 400);
    messages = factMessages(spec, q);
    parse = (raw) => parseFact(spec, raw);
  } else if (purpose === "advisor") {
    const a = spec.advisors.find((x) => x.id === body.advisor);
    const q = String(body.question ?? "").trim();
    if (!a || q.length < 4) return fallback("Solicitud inválida.", 400);
    const authored = advisorAnswer(spec, run, a);
    messages = advisorMessages(spec, a, authored, q);
    parse = (raw) => { const ans = parseAdvisor(spec, a, authored, raw); return ans ? { answer: ans } : null; };
  } else {
    const node = nodeOf(spec, run);
    const text = String(body.text ?? "").trim();
    if (!node || run.phase !== "deciding" || text.length < 15) return fallback("Solicitud inválida.", 400);
    messages = interpretMessages(spec, run, node, sayOf(spec, run), text);
    parse = (raw) => parseInterpretation(spec, run, raw) as Record<string, unknown> | null;
  }

  const model = process.env.CEO_AI_MODEL?.trim() || DEFAULT_MODEL;
  const maxOut = EPISODE_AI_MAX_TOKENS[purpose];
  const est = costOf(model, approxTokens(messages.map((m) => m.content).join("\n")) + 20, maxOut);
  const { day, month } = periodsOf(Date.now());
  const caps: [string, string, number][] = [
    ["global", month, num(process.env.CEO_AI_CAP_MONTH_USD, CAPS.monthlyUsd)],
    ["global", day, num(process.env.CEO_AI_CAP_DAY_USD, CAPS.dailyUsd)],
    [`user:${uid}`, day, num(process.env.CEO_AI_CAP_USER_DAY_USD, CAPS.userDailyUsd)],
  ];
  const reserved: [string, string][] = [];
  const release = async (delta: number) => { for (const [s2, p2] of reserved) await admin.rpc("ai_ajustar", { p_scope: s2, p_period: p2, p_delta: delta }); };
  const log = (row: Record<string, unknown>) => admin.from("ai_calls").insert({ user_id: uid, purpose: `episodio_${purpose}`, model, ...row });
  for (const [scope, period, cap] of caps) {
    const { data: ok } = await admin.rpc("ai_reservar", { p_scope: scope, p_period: period, p_cost: est, p_cap: cap });
    if (ok !== true) { await release(-est); await log({ status: "bloqueado_tope", error: `${scope} ${period}` }); return fallback("Se alcanzó el límite de IA de hoy: se usa el modo sin IA."); }
    reserved.push([scope, period]);
  }
  const { data: q } = await admin.from("ai_quota").select("calls").eq("scope", `user:${uid}`).eq("period", day).maybeSingle();
  if ((q?.calls ?? 0) > num(process.env.CEO_AI_CAP_USER_DAY_CALLS, CAPS.userDailyCalls)) {
    await release(-est); await log({ status: "bloqueado_tope", error: "llamadas por jugador" });
    return fallback("Se alcanzó el límite de IA de hoy: se usa el modo sin IA.");
  }

  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: purpose === "advisor" ? 0.5 : 0.1, max_tokens: maxOut, response_format: { type: "json_object" } }),
    });
    clearTimeout(timer);
    const j = (await r.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number }; error?: { message?: string } };
    const inT = j.usage?.prompt_tokens ?? 0, outT = j.usage?.completion_tokens ?? 0;
    const real = costOf(model, inT, outT);
    await release(real - est);
    if (!r.ok) { await log({ status: "error", input_tokens: inT, output_tokens: outT, cost_usd: real, latency_ms: Date.now() - t0, error: j.error?.message?.slice(0, 300) ?? `HTTP ${r.status}` }); return fallback("La IA no respondió: se usa el modo sin IA."); }
    const out = parse(j.choices?.[0]?.message?.content ?? "");
    await log({ status: out ? "ok" : "error", input_tokens: inT, output_tokens: outT, cost_usd: real, latency_ms: Date.now() - t0, error: out ? null : "respuesta inválida" });
    if (!out) return fallback("La IA no dio una respuesta válida: se usa el modo sin IA.");
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    await release(-est);
    await log({ status: "error", latency_ms: Date.now() - t0, error: String((e as Error)?.message ?? e).slice(0, 300) });
    return fallback("La IA no respondió: se usa el modo sin IA.");
  }
}
