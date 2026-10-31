/**
 * mêtis CEO · IA dentro de un Executive Decision Episode (adenda v3.3, P0-B/P0-D).
 *
 * POST { episode, purpose, run, question?, advisor?, text?, interpretation? }
 *   → fact:      { ok:true, factId | unknownId | none }   (el texto que ve el jugador sale del banco, nunca de la IA)
 *   → advisor:   { ok:true, answer }                       (validado: sin cifras nuevas ni decirle qué hacer; 2 intentos)
 *   → interpret: { ok:true, status: clara|parcial|ambigua|fuera, strategy|null, params?, options?, clarify?, extras?, tone?, quality, feedback }
 *                (ambigua: la pantalla pregunta y el jugador elige; nunca se compromete una decisión ambigua)
 *   → adapt:     { ok:true, reply, basis }                 (con la decisión ya confirmada: reacción a sus palabras,
 *                fiel a la respuesta real del motor; el motor la vuelve a revisar al decidir)
 *   o { ok:false, fallback:true } → la pantalla usa el respaldo sin IA (palabras clave / texto del autor / elegir opción).
 *
 * Usa la misma tubería que la evaluación (`runFact`, `runAdvisor`, `runInterpret`, `runAdapt`).
 * Mismos candados y topes que las respuestas escritas: interruptor «ai» + CEO_AI_ENABLED=1 + consentimiento,
 * reserva atómica de gasto por llamada (mes $50, día $3, jugador $0.05) y registro en ceo.ai_calls.
 * Casos aprobados: abiertos a todos (con los candados de IA). Borradores: solo con el flag «episodes» (invitados).
 */
import { NextResponse } from "next/server";
import { supabaseCeoAdmin, supabaseServer } from "@/lib/supabase/server";
import { aiStatusFor, flagsFor } from "@/lib/ceo/flags-server";
import { appEnvOf } from "@/lib/ceo/flags";
import { CAPS, DEFAULT_MODEL, approxTokens, costOf, periodsOf } from "@/lib/ceo/written";
import { episodeSpec } from "@/lib/ceo/episodes/catalog";
import { brandedEpisodeFor } from "@/lib/ceo/engine";
import { cleanName } from "@/lib/ceo/career/identity";
import { cleanSpecialty } from "@/lib/ceo/career/lexicon";
import { advisorAnswer, nodeOf, sanitizeRun, strategiesFor } from "@/lib/ceo/episodes/engine";
import { runAdapt, runAdvisor, runFact, runInterpret, type Call, type EpisodeAiPurpose, type Interpretation } from "@/lib/ceo/episodes/ai";

export const dynamic = "force-dynamic";
const num = (v: string | undefined, d: number) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : d; };

export async function POST(req: Request) {
  const fallback = (error: string, status = 200) => NextResponse.json({ ok: false, fallback: true, error }, { status });
  const sb = await supabaseServer();
  const uid = sb ? (await sb.auth.getUser()).data.user?.id ?? null : null;
  if (!uid) return fallback("Sin sesión: se usa el modo sin IA.", 401);
  const st = await aiStatusFor(uid);
  if (!st.enabled) return fallback("La IA no está activa: se usa el modo sin IA.", 403);
  const admin = supabaseCeoAdmin();
  const key = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!admin || !key) return fallback("Servicio no configurado.", 503);

  const body = (await req.json().catch(() => ({}))) as { episode?: string; purpose?: string; run?: unknown; question?: string; advisor?: string; text?: string; interpretation?: unknown; brand?: { name?: unknown; short?: unknown; specialty?: unknown } };
  const raw = episodeSpec(String(body.episode ?? ""));
  // Carrera continua: el caso se lee con el nombre y la especialidad de la empresa del jugador (validados).
  const bn = cleanName(body.brand?.name), bs = cleanName(body.brand?.short);
  const sp = raw ? cleanSpecialty(raw.company, body.brand?.specialty) : undefined;
  const spec = raw ? brandedEpisodeFor(raw, bn && bs ? { name: bn, short: bs, ...(sp ? { specialty: sp } : {}) } : null) : undefined;
  const run = sanitizeRun(body.run);
  const purpose = body.purpose as EpisodeAiPurpose;
  if (!spec || !run || run.episode !== spec.id || !["fact", "advisor", "interpret", "adapt"].includes(purpose)) return fallback("Solicitud inválida.", 400);
  // En producción: los casos aprobados están publicados; un borrador solo con el flag «episodes» (invitados).
  if (spec.approval !== "aprobado" && appEnvOf(process.env.VERCEL_ENV, process.env.NODE_ENV) === "production" && !(await flagsFor(uid)).episodes) return fallback("Este caso no está publicado.", 403);

  const model = process.env.CEO_AI_MODEL?.trim() || DEFAULT_MODEL;
  const { day, month } = periodsOf(Date.now());
  const caps: [string, string, number][] = [
    ["global", month, num(process.env.CEO_AI_CAP_MONTH_USD, CAPS.monthlyUsd)],
    ["global", day, num(process.env.CEO_AI_CAP_DAY_USD, CAPS.dailyUsd)],
    [`user:${uid}`, day, num(process.env.CEO_AI_CAP_USER_DAY_USD, CAPS.userDailyUsd)],
  ];
  const log = (row: Record<string, unknown>) => admin.from("ai_calls").insert({ user_id: uid, purpose: `episodio_${purpose}`, model, ...row });
  let blocked = false;
  /** Una llamada al modelo con reserva de gasto, tope por jugador y registro. Null si falla o se alcanzó un tope. */
  const call: Call = async (messages, maxOut, temperature) => {
    const est = costOf(model, approxTokens(messages.map((m) => m.content).join("\n")) + 20, maxOut);
    const reserved: [string, string][] = [];
    const release = async (delta: number) => { for (const [s2, p2] of reserved) await admin.rpc("ai_ajustar", { p_scope: s2, p_period: p2, p_delta: delta }); };
    for (const [scope, period, cap] of caps) {
      const { data: ok } = await admin.rpc("ai_reservar", { p_scope: scope, p_period: period, p_cost: est, p_cap: cap });
      if (ok !== true) { await release(-est); await log({ status: "bloqueado_tope", error: `${scope} ${period}` }); blocked = true; return null; }
      reserved.push([scope, period]);
    }
    const { data: q } = await admin.from("ai_quota").select("calls").eq("scope", `user:${uid}`).eq("period", day).maybeSingle();
    if ((q?.calls ?? 0) > num(process.env.CEO_AI_CAP_USER_DAY_CALLS, CAPS.userDailyCalls)) {
      await release(-est); await log({ status: "bloqueado_tope", error: "llamadas por jugador" }); blocked = true; return null;
    }
    const t0 = Date.now();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12_000);
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", signal: ctrl.signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxOut, response_format: { type: "json_object" } }),
      });
      clearTimeout(timer);
      const j = (await r.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number }; error?: { message?: string } };
      const inT = j.usage?.prompt_tokens ?? 0, outT = j.usage?.completion_tokens ?? 0;
      const real = costOf(model, inT, outT);
      await release(real - est);
      await log({ status: r.ok ? "ok" : "error", input_tokens: inT, output_tokens: outT, cost_usd: real, latency_ms: Date.now() - t0, error: r.ok ? null : j.error?.message?.slice(0, 300) ?? `HTTP ${r.status}` });
      return r.ok ? j.choices?.[0]?.message?.content ?? "" : null;
    } catch (e) {
      await release(-est);
      await log({ status: "error", latency_ms: Date.now() - t0, error: String((e as Error)?.message ?? e).slice(0, 300) });
      return null;
    }
  };
  const done = (out: Record<string, unknown> | null) => out
    ? NextResponse.json({ ok: true, ...out })
    : fallback(blocked ? "Se alcanzó el límite de IA de hoy: se usa el modo sin IA." : "La IA no dio una respuesta válida: se usa el modo sin IA.");

  if (purpose === "fact") {
    const q = String(body.question ?? "").trim();
    if (q.length < 4) return fallback("Pregunta muy corta.", 400);
    return done(await runFact(spec, q, call));
  }
  if (purpose === "advisor") {
    const a = spec.advisors.find((x) => x.id === body.advisor);
    const q = String(body.question ?? "").trim();
    if (!a || q.length < 4) return fallback("Solicitud inválida.", 400);
    const ans = await runAdvisor(spec, a, advisorAnswer(spec, run, a), q, call);
    return done(ans ? { answer: ans } : null);
  }
  const node = nodeOf(spec, run);
  const text = String(body.text ?? "").trim();
  if (!node || run.phase !== "deciding" || text.length < 15) return fallback("Solicitud inválida.", 400);
  if (purpose === "interpret") return done((await runInterpret(spec, run, text, call)) as Record<string, unknown> | null);
  // adapt: la decisión ya la confirmó el jugador; aquí solo se acota lo que manda la pantalla y se adapta.
  const it = (body.interpretation ?? {}) as Partial<Interpretation>;
  const chosen = strategiesFor(spec, run).find((s) => s.id === it.strategy);
  if (!chosen) return fallback("Solicitud inválida.", 400);
  const params = it.params && typeof it.params === "object" ? Object.fromEntries(Object.entries(it.params).filter(([, v]) => typeof v === "number")) as Record<string, number> : undefined;
  const clean: Interpretation = { strategy: chosen.id, status: it.status === "parcial" ? "parcial" : "clara", quality: 0, feedback: "", ...(params ? { params } : {}), ...(it.tone === 1 || it.tone === -1 ? { tone: it.tone } : {}), ...(typeof it.extras === "string" ? { extras: it.extras.slice(0, 140) } : {}) };
  return done(await runAdapt(spec, run, text, clean, call));
}
