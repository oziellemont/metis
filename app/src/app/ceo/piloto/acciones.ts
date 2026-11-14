"use server";
/**
 * Acciones de servidor del piloto del Repositorio Académico. Son las únicas entradas que califican.
 * Cada una comprueba primero, en el servidor, que quien llama es del equipo mêtis; si no, no hace nada.
 * No escriben en la base, no registran evidencia y no tocan la partida.
 */
import { randomUUID } from "node:crypto";
import { equipoServidor } from "@/lib/ceo/equipo-servidor";
import { EXPERIENCIAS } from "@/lib/ceo/metis2/experiencias";
import { RETOS_DEMO } from "@/lib/ceo/metis2/reto";
import { accionReto, entregarExperiencia, iniciarReto, reabrirExperiencia, type AccionCliente, type Fallo, type PasoServidor } from "@/lib/ceo/metis2/piloto-servidor";
import { selloSecret } from "@/lib/ceo/metis2/sello";
import type { Entrega } from "@/lib/ceo/metis2/experiencias/tipos";

const NO = { ok: false, error: "Esta pieza solo la puede abrir el equipo mêtis." } as const;

export async function entregarComprobacion(exp: string, answers: unknown): Promise<({ ok: true } & Entrega) | Fallo> {
  const eq = await equipoServidor();
  if (!eq.ok) return NO;
  const x = EXPERIENCIAS.find((e) => e.id === exp);
  if (!x) return { ok: false, error: "No encontré esa experiencia." };
  return entregarExperiencia(x, eq.user, answers, selloSecret(), new Date().toISOString());
}

export async function verEntrega(exp: string, sello: unknown): Promise<({ ok: true } & Entrega) | Fallo> {
  const eq = await equipoServidor();
  if (!eq.ok) return NO;
  const x = EXPERIENCIAS.find((e) => e.id === exp);
  if (!x) return { ok: false, error: "No encontré esa experiencia." };
  return reabrirExperiencia(x, eq.user, sello, selloSecret());
}

export async function abrirReto(reto: string, sello: unknown): Promise<PasoServidor> {
  const eq = await equipoServidor();
  if (!eq.ok) return NO;
  const r = RETOS_DEMO.find((q) => q.id === reto);
  if (!r) return { ok: false, error: "No encontré ese reto." };
  return iniciarReto(r, eq.user, sello, selloSecret(), randomUUID());
}

export async function moverReto(reto: string, sello: unknown, a: AccionCliente): Promise<PasoServidor> {
  const eq = await equipoServidor();
  if (!eq.ok) return NO;
  const r = RETOS_DEMO.find((q) => q.id === reto);
  if (!r) return { ok: false, error: "No encontré ese reto." };
  return accionReto(r, eq.user, sello, a, selloSecret(), new Date().toISOString());
}
