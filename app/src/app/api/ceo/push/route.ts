/**
 * POST   /api/ceo/push { subscription } → guarda la suscripción de este navegador (avisos al celular, gratis).
 * DELETE /api/ceo/push { endpoint }     → la quita (el jugador apagó los avisos en este dispositivo).
 * GET    /api/ceo/push                  → { configured, publicKey } (si el servidor tiene llaves).
 * Exige sesión; escribe con el cliente de la sesión (RLS: cada quien solo ve y toca las suyas).
 */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { cleanPushSub, pushConfigured } from "@/lib/ceo/push";

export const dynamic = "force-dynamic";

async function who() {
  const sb = await supabaseServer();
  if (!sb) return { sb: null, uid: null };
  const { data } = await sb.auth.getUser();
  return { sb, uid: data.user?.id ?? null };
}

export async function GET() {
  return NextResponse.json({ configured: pushConfigured(), publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null });
}

export async function POST(req: Request) {
  const { sb, uid } = await who();
  if (!sb) return NextResponse.json({ ok: false, error: "sin_backend" }, { status: 503 });
  if (!uid) return NextResponse.json({ ok: false, error: "sin_sesion" }, { status: 401 });
  if (!pushConfigured()) return NextResponse.json({ ok: false, error: "sin_llaves" }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { subscription?: unknown } | null;
  const sub = cleanPushSub(body?.subscription);
  if (!sub) return NextResponse.json({ ok: false, error: "suscripcion_invalida" }, { status: 400 });
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 200);
  const { error } = await sb.schema("ceo").from("push_subscriptions").upsert({ user_id: uid, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_agent: ua, last_ok_at: new Date().toISOString() }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ ok: false, error: error.code === "42P01" ? "falta_migracion_0022" : "no_guardado" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { sb, uid } = await who();
  if (!sb) return NextResponse.json({ ok: false, error: "sin_backend" }, { status: 503 });
  if (!uid) return NextResponse.json({ ok: false, error: "sin_sesion" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (typeof body?.endpoint !== "string") return NextResponse.json({ ok: false, error: "sin_endpoint" }, { status: 400 });
  await sb.schema("ceo").from("push_subscriptions").delete().match({ user_id: uid, endpoint: body.endpoint });
  return NextResponse.json({ ok: true });
}
