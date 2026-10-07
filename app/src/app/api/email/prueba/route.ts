/**
 * Correo de prueba: manda un correo al usuario que tiene la sesión abierta para
 * comprobar que Resend quedó bien configurado (RESEND_API_KEY + EMAIL_FROM + dominio verificado).
 * Sólo lo pueden usar los administradores de una empresa o de la plataforma, y sólo a su propio correo.
 */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { hasEmail, sendMail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST() {
  const sb = await supabaseServer();
  if (!sb) return NextResponse.json({ ok: false, error: "Supabase no está configurado." }, { status: 503 });
  const { data: u } = await sb.auth.getUser();
  const email = u.user?.email;
  if (!u.user || !email) return NextResponse.json({ ok: false, error: "Inicia sesión primero." }, { status: 401 });

  const db = sb.schema("metis");
  const [adm, mem] = await Promise.all([
    db.rpc("is_platform_admin"),
    db.from("memberships").select("role").eq("user_id", u.user.id).eq("active", true).in("role", ["owner", "admin"]).limit(1),
  ]);
  if (adm.data !== true && !(mem.data && mem.data.length)) {
    return NextResponse.json({ ok: false, error: "Sólo un administrador puede enviar el correo de prueba." }, { status: 403 });
  }
  if (!hasEmail) {
    return NextResponse.json({ ok: false, error: "Falta RESEND_API_KEY en Vercel (Settings → Environment Variables) y volver a desplegar." }, { status: 400 });
  }

  const html = `<div style="font-family:Poppins,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#171A3A">
<img src="${SITE_URL}/brand/logo-horizontal-2000.png" width="120" height="35" alt="mêtis" style="display:block;border:0;height:35px;width:120px;margin-bottom:20px">
<p style="font-size:20px;font-weight:600;margin:0 0 8px">¡Funciona! 🎉</p>
<p>Este es un correo de prueba de METIS. Si lo estás leyendo, los recordatorios de cierre de mes ya pueden salir.</p>
<p style="color:#94A3B8;font-size:12px;margin-top:32px">mêtis · ${SITE_URL.replace(/^https?:\/\//, "")}</p></div>`;
  const r = await sendMail({ to: email, subject: "Prueba de correo · METIS", html, text: "¡Funciona! Este es un correo de prueba de METIS." });
  if (!r.ok) return NextResponse.json({ ok: false, error: explain(r.error ?? "") }, { status: 502 });
  return NextResponse.json({ ok: true, to: email, id: r.id });
}

function explain(e: string) {
  if (/domain is not verified|not verified/i.test(e)) return "Resend dice que el dominio aún no está verificado. Revisa los registros DNS en Namecheap y da “Verify” en Resend. Detalle: " + e;
  if (/401|403|api key/i.test(e)) return "La API key no es válida o no tiene permiso de envío. Detalle: " + e;
  return e;
}
