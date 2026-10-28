/**
 * Callback de Supabase Auth (Google, confirmación de correo, recuperar contraseña, enlace mágico).
 * Intercambia el `code` por sesión y redirige a `next`.
 * - mêtis CEO: `next` es /ceo… o /entrar…; si algo falla, regresa a /entrar (nunca a la entrada de Align).
 * - mêtis Align: por defecto /unirme, como siempre.
 */
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { CEO_LOGIN_PATH, isCeoDestination } from "@/lib/ceo/auth-routes";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/unirme";
  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/unirme";
  const ceo = isCeoDestination(safeNext);
  const fail = (msg: string) => NextResponse.redirect(new URL(`${ceo ? CEO_LOGIN_PATH : "/login"}?error=${encodeURIComponent(msg)}`, req.url));
  // Google o Supabase pueden regresar con error (p. ej. la persona canceló).
  const providerError = req.nextUrl.searchParams.get("error_description") ?? req.nextUrl.searchParams.get("error");
  if (providerError && !code) return fail(providerError);
  if (code) {
    const sb = await supabaseServer();
    if (sb) {
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) return fail(error.message);
    }
  }
  return NextResponse.redirect(new URL(safeNext, req.url));
}
