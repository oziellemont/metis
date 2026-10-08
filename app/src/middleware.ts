/**
 * Protección de rutas de la app.
 * - Sin Supabase configurado: modo demo, todo pasa.
 * - Con Supabase: sin sesión → /login · con sesión pero sin empresa → /unirme.
 * Refresca la cookie de sesión en cada request (patrón @supabase/ssr).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { normalizeSupabaseUrl } from "@/lib/supabase/env";

const APP_PREFIXES = ["/inicio", "/scorecard", "/carga", "/mapa", "/equipo", "/indicadores", "/proyectos", "/reportes", "/sesiones", "/compromisos", "/config", "/academy"];

export async function middleware(req: NextRequest) {
  // Si Supabase regresó el enlace mágico a la Site URL (p. ej. "/?code=…") en lugar de /auth/callback,
  // lo reenviamos para no perder la sesión. Pasa cuando la Redirect URL no está en la lista permitida.
  const authCode = req.nextUrl.searchParams.get("code");
  if (authCode && req.nextUrl.pathname !== "/auth/callback" && req.nextUrl.pathname !== "/unirme") {
    const cb = req.nextUrl.clone();
    cb.pathname = "/auth/callback";
    cb.search = "";
    cb.searchParams.set("code", authCode);
    cb.searchParams.set("next", req.nextUrl.searchParams.get("next") ?? "/unirme");
    return NextResponse.redirect(cb);
  }

  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anon) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const sb = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (all) => {
        all.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        all.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await sb.auth.getUser();
  const path = req.nextUrl.pathname;
  const isApp = APP_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
  // Consola METIS: requiere sesión, pero no pertenecer a una empresa (el permiso lo valida la base).
  if ((path === "/consola" || path.startsWith("/consola/")) && !user) {
    const login = req.nextUrl.clone(); login.pathname = "/login"; login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  if (isApp && !user) {
    const login = req.nextUrl.clone(); login.pathname = "/login"; login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }
  if (isApp && user) {
    const { data } = await sb.schema("metis").from("memberships").select("tenant_id").eq("user_id", user.id).eq("active", true).limit(1);
    if (!data || data.length === 0) { const u = req.nextUrl.clone(); u.pathname = "/unirme"; u.search = ""; return NextResponse.redirect(u); }
  }
  if (path === "/login" && user) {
    // Ya tiene sesión: respeta ?next (p. ej. /unirme?code=ANDES-2026&auto=1) o manda a /unirme.
    const n = req.nextUrl.searchParams.get("next");
    return NextResponse.redirect(new URL(n && n.startsWith("/") ? n : "/unirme", req.url));
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
