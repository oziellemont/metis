/**
 * mêtis CEO · respuesta escrita evaluada con IA.
 *
 * GET  → ¿puede este jugador escribir sus respuestas? (los tres candados)
 * POST → { itemId, company, text } → { ok, option, quality, feedback }
 *        o { ok:false, fallback:true } para que el jugador elija la opción a mano.
 * PUT  → { consent: boolean } guarda el permiso del jugador para usar IA.
 *
 * Candados: interruptor «ai» en la base + CEO_AI_ENABLED=1 en Vercel + consentimiento del jugador.
 * Gasto: reserva atómica en ceo.ai_reservar (por día, por mes y por jugador) ANTES de llamar a OpenAI,
 * y ajuste al costo real después. Cada llamada queda en ceo.ai_calls.
 */
import { sizedPack } from "@/lib/ceo/career/size";
import { isArchetype } from "@/lib/ceo/career/taxonomy";
import { NextResponse } from "next/server";
import { supabaseCeoAdmin, supabaseServer } from "@/lib/supabase/server";
import { aiStatusFor } from "@/lib/ceo/flags-server";
import { companyById } from "@/lib/ceo/companies";
import { withBank } from "@/lib/ceo/cases/bank";
import { cleanName } from "@/lib/ceo/career/identity";
import { brandPack } from "@/lib/ceo/career/template";
import { cleanSpecialty } from "@/lib/ceo/career/lexicon";
import { personOf } from "@/lib/ceo/cast";
import { aiContext, sanitizeProfile } from "@/lib/ceo/profile";
import { CAPS, DEFAULT_MODEL, MAX_OUTPUT_TOKENS, approxTokens, buildMessages, costOf, parseEvaluation, periodsOf, textProblem, writtenEligible } from "@/lib/ceo/written";

export const dynamic = "force-dynamic";

const num = (v: string | undefined, d: number) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : d; };

async function userId() {
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

export async function GET() {
  const uid = await userId();
  const st = await aiStatusFor(uid);
  return NextResponse.json({ ok: true, signedIn: Boolean(uid), ...st });
}

export async function PUT(req: Request) {
  const uid = await userId();
  const admin = supabaseCeoAdmin();
  if (!uid || !admin) return NextResponse.json({ ok: false, error: "Inicia sesión primero." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { consent?: unknown };
  const consent = body.consent === true;
  const { error } = await admin.from("players").update({ ai_consent: consent, ai_consent_at: consent ? new Date().toISOString() : null }).eq("user_id", uid);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, consent });
}

export async function POST(req: Request) {
  const fallback = (error: string, status = 200) => NextResponse.json({ ok: false, fallback: true, error }, { status });
  const uid = await userId();
  if (!uid) return fallback("Inicia sesión para usar respuestas escritas.", 401);
  const st = await aiStatusFor(uid);
  if (!st.enabled) return fallback("Las respuestas escritas no están activas.", 403);
  const admin = supabaseCeoAdmin();
  const key = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!admin || !key) return fallback("Servicio no configurado.", 503);

  const body = (await req.json().catch(() => ({}))) as { itemId?: string; company?: string; text?: string; profile?: unknown; brand?: { name?: unknown; short?: unknown; specialty?: unknown; archetype?: unknown } };
  const text = String(body.text ?? "");
  const problem = textProblem(text);
  if (problem) return NextResponse.json({ ok: false, error: problem }, { status: 400 });
  // Carrera continua: el caso y el nombre de la empresa llegan con el nombre que eligió el jugador (validado).
  const bn = cleanName(body.brand?.name), bs = cleanName(body.brand?.short);
  const base = withBank(companyById(body.company));
  const sp = cleanSpecialty(base.id, body.brand?.specialty);
  // Montos del tamaño de la empresa (P1-A): una PYME ve el caso con sus cifras, igual que en la pantalla.
  const size = bn && bs && isArchetype(body.brand?.archetype) ? body.brand.archetype : undefined;
  const pack = brandPack(sizedPack(base, size), bn && bs ? { name: bn, short: bs, ...(sp ? { specialty: sp } : {}) } : null);
  const item = pack.items.find((i) => i.id === body.itemId);
  if (!item || !writtenEligible(item)) return fallback("Este asunto no acepta respuesta escrita.", 400);

  const model = process.env.CEO_AI_MODEL?.trim() || DEFAULT_MODEL;
  const p = personOf(pack, item.from);
  const messages = buildMessages({ item, fromName: p.name, fromRole: p.role, company: pack.name, text, profile: aiContext(sanitizeProfile(body.profile)) });
  const estIn = approxTokens(messages.map((m) => m.content).join("\n")) + 20;
  const est = costOf(model, estIn, MAX_OUTPUT_TOKENS);

  // topes: mes global, día global, día del jugador (por costo y por número de llamadas)
  const { day, month } = periodsOf(Date.now());
  const caps: [string, string, number][] = [
    ["global", month, num(process.env.CEO_AI_CAP_MONTH_USD, CAPS.monthlyUsd)],
    ["global", day, num(process.env.CEO_AI_CAP_DAY_USD, CAPS.dailyUsd)],
    [`user:${uid}`, day, num(process.env.CEO_AI_CAP_USER_DAY_USD, CAPS.userDailyUsd)],
  ];
  const reserved: [string, string][] = [];
  const log = (row: Record<string, unknown>) => admin.from("ai_calls").insert({ user_id: uid, purpose: "respuesta_escrita", model, ...row });
  for (const [scope, period, cap] of caps) {
    const { data: ok } = await admin.rpc("ai_reservar", { p_scope: scope, p_period: period, p_cost: est, p_cap: cap });
    if (ok !== true) {
      for (const [s2, p2] of reserved) await admin.rpc("ai_ajustar", { p_scope: s2, p_period: p2, p_delta: -est });
      await log({ status: "bloqueado_tope", error: `${scope} ${period}` });
      return fallback("Por hoy se alcanzó el límite de respuestas escritas. Elige una opción.");
    }
    reserved.push([scope, period]);
  }
  const { data: q } = await admin.from("ai_quota").select("calls").eq("scope", `user:${uid}`).eq("period", day).maybeSingle();
  if ((q?.calls ?? 0) > num(process.env.CEO_AI_CAP_USER_DAY_CALLS, CAPS.userDailyCalls)) {
    for (const [s2, p2] of reserved) await admin.rpc("ai_ajustar", { p_scope: s2, p_period: p2, p_delta: -est });
    await log({ status: "bloqueado_tope", error: "llamadas por jugador" });
    return fallback("Por hoy se alcanzó el límite de respuestas escritas. Elige una opción.");
  }

  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: MAX_OUTPUT_TOKENS, response_format: { type: "json_object" } }),
    });
    clearTimeout(timer);
    const j = (await r.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number }; error?: { message?: string } };
    const inT = j.usage?.prompt_tokens ?? 0, outT = j.usage?.completion_tokens ?? 0;
    const real = costOf(model, inT, outT);
    for (const [s2, p2] of reserved) await admin.rpc("ai_ajustar", { p_scope: s2, p_period: p2, p_delta: real - est });
    if (!r.ok) { await log({ status: "error", input_tokens: inT, output_tokens: outT, cost_usd: real, latency_ms: Date.now() - t0, error: j.error?.message?.slice(0, 300) ?? `HTTP ${r.status}` }); return fallback("No pudimos leer tu respuesta. Elige una opción."); }
    const ev = parseEvaluation(j.choices?.[0]?.message?.content ?? "", item.options.map((o) => o.id));
    await log({ status: ev ? "ok" : "error", input_tokens: inT, output_tokens: outT, cost_usd: real, latency_ms: Date.now() - t0, error: ev ? null : "respuesta inválida" });
    if (!ev) return fallback("No pudimos leer tu respuesta. Elige una opción.");
    return NextResponse.json({ ok: true, ...ev });
  } catch (e) {
    for (const [s2, p2] of reserved) await admin.rpc("ai_ajustar", { p_scope: s2, p_period: p2, p_delta: -est });
    await log({ status: "error", latency_ms: Date.now() - t0, error: String((e as Error)?.message ?? e).slice(0, 300) });
    return fallback("No pudimos leer tu respuesta. Elige una opción.");
  }
}
