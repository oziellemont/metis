/**
 * /api/whatsapp/webhook · webhook de Meta (WhatsApp Business Cloud API).
 *   GET   verificación de Meta (hub.mode=subscribe, hub.verify_token = WHATSAPP_VERIFY_TOKEN) → devuelve hub.challenge
 *   POST  estados de entrega (sent, delivered, read, failed) → ceo.wa_messages
 *         mensajes entrantes «BAJA» / «STOP» → revoca el consentimiento de ese número y regresa al correo
 * Firma: X-Hub-Signature-256 con WHATSAPP_APP_SECRET. Responde 200 siempre que la firma sea válida (Meta reintenta si no).
 * Nunca toca la partida.
 */
import { NextResponse, type NextRequest } from "next/server";
import { supabaseCeoAdmin } from "@/lib/supabase/server";
import { STATUS_RANK, isStop, parseWebhook } from "@/lib/ceo/whatsapp";
import { validSignature } from "@/lib/ceo/whatsapp-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (token && q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === token) return new NextResponse(q.get("hub.challenge") ?? "", { status: 200 });
  return new NextResponse("forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"))) return new NextResponse("bad signature", { status: 401 });
  let body: unknown = null;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ ok: true, ignored: true }); }
  const sb = supabaseCeoAdmin();
  if (!sb) return NextResponse.json({ ok: true, ignored: true });
  let statuses = 0, stops = 0;
  for (const ev of parseWebhook(body)) {
    try {
      if (ev.kind === "status") {
        const { data } = await sb.from("wa_messages").select("id, status").eq("wamid", ev.wamid).maybeSingle();
        if (!data) continue;
        if ((STATUS_RANK[ev.status] ?? 0) < (STATUS_RANK[data.status] ?? 0) && ev.status !== "failed") continue;
        await sb.from("wa_messages").update({ status: ev.status, error: ev.error ?? null, updated_at: new Date().toISOString() }).eq("id", data.id);
        statuses++;
      } else if (ev.kind === "inbound" && isStop(ev.text) && ev.from) {
        await sb.from("players").update({ wa_revoked_at: new Date().toISOString(), wa_channel: "email" }).eq("wa_phone", ev.from);
        stops++;
      }
    } catch { /* un evento malo no tumba el resto */ }
  }
  return NextResponse.json({ ok: true, statuses, stops });
}
