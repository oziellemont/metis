/**
 * Callback de Supabase Auth (magic link / OAuth).
 * Intercambia el `code` por sesión y redirige a `next` (por defecto /unirme, que
 * a su vez manda a /inicio si el usuario ya pertenece a una empresa).
 */
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/unirme";
  const safeNext = next.startsWith("/") ? next : "/unirme";
  if (code) {
    const sb = await supabaseServer();
    if (sb) {
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url));
    }
  }
  return NextResponse.redirect(new URL(safeNext, req.url));
}
