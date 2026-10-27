/**
 * POST /api/ceo/eventos → guarda un evento de producto (lista cerrada) en ceo.product_events.
 * Solo si el interruptor «events» está prendido para el jugador; si no, responde ok y no guarda.
 */
import { NextResponse } from "next/server";
import { supabaseCeoAdmin, supabaseServer } from "@/lib/supabase/server";
import { flagsFor } from "@/lib/ceo/flags-server";
import { sanitizeEvent } from "@/lib/ceo/events";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ev = sanitizeEvent(await req.json().catch(() => null));
  if (!ev) return NextResponse.json({ ok: false }, { status: 400 });
  const sb = await supabaseServer();
  const uid = sb ? (await sb.auth.getUser()).data.user?.id ?? null : null;
  if (!uid) return NextResponse.json({ ok: true, stored: false });
  const flags = await flagsFor(uid);
  if (!flags.events) return NextResponse.json({ ok: true, stored: false });
  const admin = supabaseCeoAdmin();
  if (!admin) return NextResponse.json({ ok: true, stored: false });
  const { error } = await admin.from("product_events").upsert({ ...ev, user_id: uid, app_version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null }, { onConflict: "event_id", ignoreDuplicates: true });
  return NextResponse.json({ ok: true, stored: !error });
}
