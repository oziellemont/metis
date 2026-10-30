/**
 * Protección de rutas de la app.
 * - Sin Supabase configurado: modo demo, todo pasa.
 * - Con Supabase: sin sesión → /login · con sesión pero sin empresa → /unirme.
 * Refresca la cookie de sesión en cada request (patrón @supabase/ssr).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { normalizeSupabaseUrl } from "@/lib/supabase/env";
import { CEO_HOME, ceoGate, ceoLoginRequired, ceoLoginHref, ceoSafeNext, isCeoLoginPath, isCeoPrivatePath } from "@/lib/ceo/auth-routes";

const APP_PREFIXES = ["/inicio", "/scorecard", "/carga", "/mapa", "/equipo", "/indicadores", "/proyectos", "/reportes", "/sesiones", "/compromisos", "/config", "/academy"];

const CEO_HOSTS = ["metis.ceo", "www.metis.ceo"];
/** Dominio anterior de mêtis CEO: todo se manda a metis.ceo (vía /mudanza, que se lleva la partida guardada). */
const OLD_CEO_HOSTS = ["metisalign.app", "www.metisalign.app"];
const CEO_PASSTHROUGH = ["/ceo", "/entrar", "/api", "/auth", "/login", "/_next", "/brand", "/mudanza", "/simulador", "/legal"];
/** Páginas legales de metis.ceo: «/privacidad» → «/legal/privacidad». */
const CEO_LEGAL: Record<string, string> = { "/privacidad": "/legal/privacidad", "/terminos": "/legal/terminos" };

/** Ruta pública de CEO («/caso/x») → ruta interna («/ceo/caso/x»). */
const toCeoPath = (p: string) => (p === "/" ? "/ceo" : p === "/ceo" || p.startsWith("/ceo/") ? p : "/ceo" + p);

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const p = req.nextUrl.pathname;

  // metisalign.app → metis.ceo. Pasa por /mudanza para llevarse el avance de quien juega sin cuenta.
  // metis.ceo ya responde: la mudanza está activa. (CEO_MOVED=0 en Vercel la apaga si hiciera falta.)
  const moved = process.env.CEO_MOVED !== "0";
  if (moved && OLD_CEO_HOSTS.includes(host)) {
    if (p === "/mudanza" || p.startsWith("/_next") || p.startsWith("/brand") || p.startsWith("/auth")) return NextResponse.next();
    const u = req.nextUrl.clone();
    u.pathname = "/mudanza";
    u.search = "";
    u.searchParams.set("to", toCeoPath(p) + req.nextUrl.search);
    return NextResponse.redirect(u, 307);
  }

  const isCeoHost = CEO_HOSTS.includes(host) || (!moved && OLD_CEO_HOSTS.includes(host));

  // Si Supabase regresó el enlace a la Site URL (p. ej. "/?code=…") en lugar de /auth/callback,
  // lo reenviamos para no perder la sesión. Pasa cuando la Redirect URL no está en la lista permitida.
  const authCode = req.nextUrl.searchParams.get("code");
  if (authCode && p !== "/auth/callback" && p !== "/unirme") {
    const cb = req.nextUrl.clone();
    cb.pathname = "/auth/callback";
    cb.search = "";
    cb.searchParams.set("code", authCode);
    cb.searchParams.set("next", req.nextUrl.searchParams.get("next") ?? (isCeoHost ? CEO_HOME : "/unirme"));
    return NextResponse.redirect(cb);
  }

  // metis.ceo → mêtis CEO. «/» es la landing; lo demás se reescribe hacia /ceo. Misma app, mismo código.
  // Ruta interna: la que de verdad se va a servir (en metis.ceo «/bandeja» es «/ceo/bandeja»).
  let internal = p;
  let rewrite: URL | null = null;
  if (isCeoHost) {
    if (p === "/") { const u = req.nextUrl.clone(); u.pathname = "/simulador"; return NextResponse.rewrite(u); }
    // Landing en inglés: «/en» → «/simulador/en».
    if (p === "/en" || p === "/en/") { const u = req.nextUrl.clone(); u.pathname = "/simulador/en"; return NextResponse.rewrite(u); }
    if (CEO_LEGAL[p]) { const u = req.nextUrl.clone(); u.pathname = CEO_LEGAL[p]; return NextResponse.rewrite(u); }
    // mêtis CEO tiene su propia entrada: la de Align (/login) no se usa en este dominio.
    if (p === "/login") {
      const href = ceoLoginHref(req.nextUrl.searchParams.get("next"));
      const u = req.nextUrl.clone(); u.pathname = href.split("?")[0]; u.search = href.includes("?") ? "?" + href.split("?")[1] : "";
      return NextResponse.redirect(u);
    }
    if (!CEO_PASSTHROUGH.some((x) => p === x || p.startsWith(x + "/"))) {
      internal = toCeoPath(p);
      const u = req.nextUrl.clone(); u.pathname = internal; rewrite = u;
    } else if (!(p.startsWith("/auth") || isCeoPrivatePath(p) || isCeoLoginPath(p))) {
      return NextResponse.next();
    }
  }

  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anon) return rewrite ? NextResponse.rewrite(rewrite) : NextResponse.next();

  const fresh = () => (rewrite ? NextResponse.rewrite(rewrite, { request: req }) : NextResponse.next({ request: req }));
  let res = fresh();
  const sb = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (all) => {
        all.forEach(({ name, value }) => req.cookies.set(name, value));
        res = fresh();
        all.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const user = await sb.auth.getUser().then((r) => r.data.user, () => null);

  // mêtis CEO: todo el simulador exige sesión; quien ya entró no vuelve a ver /entrar.
  const gate = ceoLoginRequired(process.env.CEO_REQUIRE_LOGIN, process.env.VERCEL_ENV) ? ceoGate(internal, Boolean(user)) : "allow";
  const keep = (to: NextResponse) => { res.cookies.getAll().forEach((c) => to.cookies.set(c)); return to; };
  if (gate === "login") {
    const login = req.nextUrl.clone();
    const wanted = (isCeoHost ? p : internal) + req.nextUrl.search;
    const href = ceoLoginHref(wanted);
    login.pathname = href.split("?")[0];
    login.search = href.includes("?") ? "?" + href.split("?")[1] : "";
    return keep(NextResponse.redirect(login));
  }
  if (gate === "leave_login") {
    return keep(NextResponse.redirect(new URL(ceoSafeNext(req.nextUrl.searchParams.get("next")), req.url)));
  }
  if (isCeoHost) return res;

  const path = req.nextUrl.pathname;
  const isApp = APP_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
  // Consola mêtis: requiere sesión, pero no pertenecer a una empresa (el permiso lo valida la base).
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
