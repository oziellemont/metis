import "server-only";
/**
 * ¿Quien hace esta petición es del equipo mêtis? Se decide en el servidor, nunca en el navegador.
 *
 * Producción: hace falta sesión iniciada y que la cuenta esté en metis.platform_admins
 * (la función metis.is_platform_admin() lo comprueba con la sesión de la persona).
 * Preview y desarrollo: abierto, igual que las herramientas de prueba (los Preview de Vercel
 * tienen además su propia protección).
 *
 * Ocultar un enlace del menú no es control de acceso: las páginas y las acciones del piloto
 * llaman a esta función antes de entregar o calificar nada.
 */
import { appEnvOf } from "./flags";
import { decideEquipo, type Equipo } from "./equipo";
import { supabaseServer } from "@/lib/supabase/server";

export type { Equipo };

export async function equipoServidor(): Promise<Equipo> {
  const env = appEnvOf(process.env.VERCEL_ENV, process.env.NODE_ENV);
  if (env !== "production") return decideEquipo(env, null, false);
  const sb = await supabaseServer();
  if (!sb) return decideEquipo(env, null, false);
  const { data } = await sb.auth.getUser();
  const user = data.user?.id ?? null;
  if (!user) return decideEquipo(env, null, false);
  const adm = await sb.schema("metis").rpc("is_platform_admin");
  return decideEquipo(env, user, adm.data === true);
}
