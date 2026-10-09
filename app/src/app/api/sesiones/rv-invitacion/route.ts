/**
 * Manda (o actualiza) la invitación de calendario de una Revisión Vertical.
 * La llama el navegador cuando el jefe agenda o reagenda una RV.
 * Body: { id }. Permiso: el jefe de la sesión o un admin de la empresa (se valida con la sesión del usuario).
 */
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { sendRvInvites } from "@/lib/sessions/rv-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sb = await supabaseServer();
  const admin = supabaseAdmin();
  if (!sb || !admin) return NextResponse.json({ ok: false, error: "Supabase no está configurado." }, { status: 503 });
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return NextResponse.json({ ok: false, error: "Inicia sesión primero." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ ok: false, error: "Falta la sesión." }, { status: 400 });

  // La sesión puede tardar un instante en guardarse (se escribe en paralelo desde el navegador).
  let row: { id: string; tenant_id: string; kind: string; leader_id: string; participant_id: string; status: string; scheduled_at: string; closed_at: string | null; location: string | null; invited_for: string | null; auto: boolean } | null = null;
  for (let i = 0; i < 5 && !row; i++) {
    const r = await admin.from("sessions").select("id, tenant_id, kind, leader_id, participant_id, status, scheduled_at, closed_at, location, invited_for, auto").eq("id", body.id).maybeSingle();
    row = r.data ?? null;
    if (!row) await new Promise((res) => setTimeout(res, 400));
  }
  if (!row || row.kind !== "rv") return NextResponse.json({ ok: false, error: "No encontré esa Revisión Vertical." }, { status: 404 });

  const db = sb.schema("metis");
  const [mem, pa] = await Promise.all([
    db.from("memberships").select("role").eq("tenant_id", row.tenant_id).eq("user_id", u.user.id).eq("active", true).maybeSingle(),
    db.rpc("is_platform_admin"),
  ]);
  const isAdmin = ["owner", "admin"].includes((mem.data?.role as string) ?? "") || pa.data === true;
  if (row.leader_id !== u.user.id && !isAdmin) return NextResponse.json({ ok: false, error: "Solo el jefe puede cambiar la fecha." }, { status: 403 });
  if (row.status === "closed") return NextResponse.json({ ok: true, skipped: "cerrada" });
  if (row.invited_for && new Date(row.invited_for).getTime() === new Date(row.scheduled_at).getTime()) return NextResponse.json({ ok: true, skipped: "sin cambios" });

  const t = await admin.from("tenants").select("id, name, settings, fiscal_year").eq("id", row.tenant_id).single();
  if (!t.data) return NextResponse.json({ ok: false, error: "Empresa no encontrada." }, { status: 404 });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL;
  const r = await sendRvInvites(admin, t.data, [row], appUrl);
  return NextResponse.json({ ok: true, ...r });
}
