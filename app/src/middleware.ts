/**
 * Protección de rutas de la app.
 * - Sin Supabase configurado: modo demo, todo pasa.
 * - Con Supabase: sin sesión → /login · con sesión pero sin empresa → /unirme.
 * Refresca la cookie de sesión en cada request (patrón @supabase/ssr).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { normalizeSupabaseUrl } from "@/lib/supabase/env";

const APP_PREFIXES = ["/inicio", "/scorecard", "/carga", "/mapa", "/equipo", "/indicadores", "/proyectos", "/reportes", "/sesiones", "/compromisos", "/config"];

export async function middleware(req: NextRequest) {
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

  if (isApp && !user) {
    const login = req.nextUrl.clone(); login.pathname = "/login"; login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }
  if (isApp && user) {
    const { data } = await sb.schema("metis").from("memberships").select("tenant_id").eq("user_id", user.id).eq("active", true).limit(1);
    if (!data || data.length === 0) { const u = req.nextUrl.clone(); u.pathname = "/unirme"; u.search = ""; return NextResponse.redirect(u); }
  }
  if (path === "/login" && user) { const u = req.nextUrl.clone(); u.pathname = "/unirme"; u.search = ""; return NextResponse.redirect(u); }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
