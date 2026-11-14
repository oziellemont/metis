/**
 * Regla pura de acceso a lo que solo ve el equipo mêtis (piloto del Repositorio Académico).
 * La consulta a la base vive en equipo-servidor.ts; aquí solo se decide, para poder probarlo.
 */
import type { AppEnv } from "./flags";

export interface Equipo {
  /** Puede abrir el piloto. */
  ok: boolean;
  /** Identidad con la que se sellan los intentos. En Preview y desarrollo, «local». */
  user: string;
}

export function decideEquipo(env: AppEnv, user: string | null, admin: boolean): Equipo {
  if (env !== "production") return { ok: true, user: user ?? "local" };
  if (!user || !admin) return { ok: false, user: user ?? "" };
  return { ok: true, user };
}
