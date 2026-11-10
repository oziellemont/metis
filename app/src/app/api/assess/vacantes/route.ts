/**
 * GET  /api/assess/vacantes → vacantes de la empresa (solo cuentas piloto) y catálogo (industrias, competencias).
 * POST /api/assess/vacantes { title, industry, weights } → crea una vacante en modo piloto.
 */
import { ctx, reply } from "@/lib/assess/http";
import { createVacancy, listForOwner } from "@/lib/assess/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const c = await ctx(); if (!c.ok) return c.res;
  return reply(() => listForOwner(c.repo, c.user));
}

export async function POST(req: Request) {
  const c = await ctx(); if (!c.ok) return c.res;
  const body = await req.json().catch(() => null);
  return reply(async () => { const r = await createVacancy(c.repo, c.user, body); return r.ok ? { ok: true as const, data: { vacancy: r.data } } : r; });
}
