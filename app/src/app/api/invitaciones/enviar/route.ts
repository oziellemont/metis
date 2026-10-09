/**
 * Envía (o reenvía) por correo una invitación ya guardada.
 * Body: { id } o { token }. La lectura se hace con la sesión del usuario, así que RLS garantiza
 * que sólo puede mandarla un owner/admin/jefe de esa empresa o un admin de la plataforma.
 */
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { hasEmail, sendMail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { invitationEmail } from "@/lib/invitations/email";

export const dynamic = "force-dynamic";

const ROLE: Record<string, string> = { owner: "Dueño del portal", admin: "Administrador", manager: "Jefe", member: "Colaborador" };

export async function POST(req: NextRequest) {
  const sb = await supabaseServer();
  if (!sb) return NextResponse.json({ ok: false, error: "Supabase no está configurado." }, { status: 503 });
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return NextResponse.json({ ok: false, error: "Inicia sesión primero." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { id?: string; token?: string };
  if (!body.id && !body.token) return NextResponse.json({ ok: false, error: "Falta la invitación." }, { status: 400 });

  const db = sb.schema("metis");
  // Se lee con service role si existe (el admin de plataforma puede no ser miembro); el permiso se valida abajo.
  const src = supabaseAdmin() ?? db;
  // La invitación puede tardar un instante en existir (se guarda en paralelo desde el navegador).
  let inv: { id: string; tenant_id: string; email: string; role: string; title: string | null; token: string; status: string; invited_by: string | null } | null = null;
  for (let i = 0; i < 5 && !inv; i++) {
    const q = src.from("invitations").select("id, tenant_id, email, role, title, token, status, invited_by");
    const r = await (body.id ? q.eq("id", body.id) : q.eq("token", body.token!)).maybeSingle();
    inv = r.data ?? null;
    if (!inv) await new Promise((res) => setTimeout(res, 400));
  }
  if (!inv) return NextResponse.json({ ok: false, error: "No encontré la invitación o no tienes permiso para enviarla." }, { status: 404 });
  if (inv.status !== "pending" && inv.status !== "accepted") return NextResponse.json({ ok: false, error: "Esa invitación ya no está pendiente." }, { status: 409 });

  // Permiso: admin/jefe del tenant o admin de plataforma.
  const [adm, mem] = await Promise.all([
    db.rpc("is_platform_admin"),
    db.from("memberships").select("role").eq("tenant_id", inv.tenant_id).eq("user_id", u.user.id).eq("active", true).in("role", ["owner", "admin", "manager"]).limit(1),
  ]);
  if (adm.data !== true && !(mem.data && mem.data.length)) {
    return NextResponse.json({ ok: false, error: "Sólo un administrador o jefe puede enviar invitaciones." }, { status: 403 });
  }

  const reader = supabaseAdmin() ?? db;
  const [tenant, inviter] = await Promise.all([
    reader.from("tenants").select("name").eq("id", inv.tenant_id).maybeSingle(),
    reader.from("profiles").select("full_name").eq("id", inv.invited_by ?? u.user.id).maybeSingle(),
  ]);
  const tenantName = (tenant.data as { name?: string } | null)?.name ?? "tu empresa";
  const inviterName = (inviter.data as { full_name?: string } | null)?.full_name ?? null;

  const mail = invitationEmail({ tenantName, inviterName, role: inv.title || ROLE[inv.role] || null, appUrl: SITE_URL, token: inv.token, email: inv.email, alreadyMember: inv.status === "accepted" });
  if (!hasEmail) {
    return NextResponse.json({ ok: false, notConfigured: true, link: mail.link, error: "El envío de correos aún no está configurado (falta RESEND_API_KEY en Vercel). Copia el enlace y mándalo por WhatsApp o correo." }, { status: 200 });
  }
  const r = await sendMail({ to: inv.email, subject: mail.subject, html: mail.html, text: mail.text });

  const admin = supabaseAdmin();
  if (admin) {
    await admin.from("notification_log").insert({ tenant_id: inv.tenant_id, user_id: null, channel: "email", kind: "invitation", subject: mail.subject, status: r.ok ? "sent" : "failed", error: r.error ?? null });
  }
  if (!r.ok) return NextResponse.json({ ok: false, link: mail.link, error: explain(r.error ?? "") }, { status: 200 });
  return NextResponse.json({ ok: true, to: inv.email, link: mail.link });
}

function explain(e: string) {
  if (/domain is not verified|not verified/i.test(e)) return "El dominio de correo aún no está verificado en Resend. Mientras, copia el enlace y mándalo tú.";
  if (/only send testing emails|own email/i.test(e)) return "Resend está en modo prueba y sólo deja enviar a tu propio correo. Verifica el dominio metisalign.mx en Resend.";
  if (/401|403|api key/i.test(e)) return "La API key de Resend no es válida. Mientras, copia el enlace y mándalo tú.";
  return "No se pudo enviar el correo: " + e;
}
