/**
 * mêtis CEO · reglas de acceso (sin dependencias: se usan en middleware, páginas y pruebas).
 *
 * - Todo /ceo/* exige sesión. La landing, /entrar, /legal y la demo de la landing son públicas.
 * - Tras entrar se regresa a `next` solo si es una ruta interna segura (nunca a otro dominio).
 */

export const CEO_LOGIN_PATH = "/entrar";
export const CEO_HOME = "/ceo";
export const CEO_FIRST_DAY = "/ceo/empezar";
export const CEO_NEW_PASSWORD_PATH = "/entrar/nueva-clave";
export const PASSWORD_MIN = 8;

/** ¿La ruta interna (ya reescrita) pertenece al simulador y exige sesión? */
export function isCeoPrivatePath(path: string): boolean {
  return path === "/ceo" || path.startsWith("/ceo/");
}

/** ¿Es la pantalla de entrada de CEO (o una de sus subpantallas)? */
export function isCeoLoginPath(path: string): boolean {
  return path === CEO_LOGIN_PATH || path.startsWith(CEO_LOGIN_PATH + "/");
}

/**
 * Destino seguro después de entrar. Solo rutas relativas del mismo sitio;
 * nada de «//otro.com», «/\\otro.com», esquemas ni la propia pantalla de entrada (evita bucles).
 */
export function ceoSafeNext(next: string | null | undefined, fallback = CEO_HOME): string {
  const n = (next ?? "").trim();
  if (!n.startsWith("/") || n.startsWith("//") || n.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(n)) return fallback;
  const pathOnly = n.split(/[?#]/)[0];
  if (pathOnly === CEO_LOGIN_PATH) return fallback;
  return n;
}

/** Interruptor de emergencia: CEO_REQUIRE_LOGIN=0 en Vercel vuelve a dejar jugar sin cuenta. */
export function ceoLoginRequired(env: string | undefined): boolean {
  return (env ?? "").trim() !== "0";
}

/** ¿El destino pertenece a mêtis CEO? (para que los errores del callback regresen a /entrar y no a Align). */
export function isCeoDestination(next: string | null | undefined): boolean {
  const n = (next ?? "").split(/[?#]/)[0];
  return isCeoPrivatePath(n) || isCeoLoginPath(n);
}

export type CeoGate = "allow" | "login" | "leave_login";

/**
 * Decide qué hacer con una petición de página.
 * @param internalPath ruta ya reescrita (en metis.ceo «/bandeja» llega como «/ceo/bandeja»)
 * @param hasUser hay sesión válida verificada por Supabase en el servidor
 */
export function ceoGate(internalPath: string, hasUser: boolean): CeoGate {
  if (isCeoPrivatePath(internalPath) && !hasUser) return "login";
  if (internalPath === CEO_LOGIN_PATH && hasUser) return "leave_login";
  return "allow";
}

/** URL de entrada con el destino al que se quería llegar. */
export function ceoLoginHref(next?: string | null): string {
  const n = ceoSafeNext(next, "");
  return n && n !== CEO_HOME ? `${CEO_LOGIN_PATH}?next=${encodeURIComponent(n)}` : CEO_LOGIN_PATH;
}

/** ¿Conviene abrir directo en «Crear cuenta»? (cuando vienen de «Empezar»). */
export function ceoDefaultMode(next: string | null | undefined, modo: string | null | undefined): "entrar" | "crear" {
  if (modo === "crear") return "crear";
  if (modo === "entrar") return "entrar";
  const path = ceoSafeNext(next, "").split(/[?#]/)[0];
  return path === CEO_FIRST_DAY || path === "/empezar" ? "crear" : "entrar";
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Regla de contraseña: 8 caracteres o más, con al menos una letra y un número. Devuelve el problema o null. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Usa al menos ${PASSWORD_MIN} caracteres.`;
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(pw) || !/[0-9]/.test(pw)) return "Combina letras y números.";
  return null;
}

/** Traduce los errores de Supabase Auth a mensajes claros. Nunca revela si un correo existe al iniciar sesión. */
export function ceoAuthMessage(raw: string | null | undefined): string {
  const m = (raw ?? "").toLowerCase();
  if (!m) return "Algo salió mal. Intenta de nuevo.";
  if (m.includes("invalid login credentials")) return "El correo o la contraseña no coinciden.";
  if (m.includes("email not confirmed")) return "Falta confirmar tu correo. Abre el enlace que te enviamos.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Ya existe una cuenta con ese correo. Entra con tu contraseña o con Google.";
  if (m.includes("password should") || m.includes("weak password")) return `La contraseña es muy débil. Usa al menos ${PASSWORD_MIN} caracteres con letras y números.`;
  if (m.includes("same password") || m.includes("different from the old")) return "La nueva contraseña debe ser distinta de la anterior.";
  if (m.includes("rate limit") || m.includes("for security purposes") || m.includes("too many")) return "Demasiados intentos seguidos. Espera un minuto e intenta de nuevo.";
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) return "La entrada con Google aún no está activa. Usa tu correo y contraseña.";
  if (m.includes("signups not allowed") || m.includes("signup is disabled")) return "Por ahora no se pueden crear cuentas nuevas.";
  if (m.includes("expired") || m.includes("invalid") && m.includes("link")) return "El enlace expiró o ya se usó. Pide uno nuevo.";
  if (m.includes("network") || m.includes("fetch")) return "No hay conexión. Revisa tu internet e intenta de nuevo.";
  return "Algo salió mal. Intenta de nuevo.";
}
