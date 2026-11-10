/** GET /api/assess/vacantes/:id → tablero comparativo de la vacante (solo su dueño). */
import { ctx, reply } from "@/lib/assess/http";
import { dashboard } from "@/lib/assess/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await ctx(); if (!c.ok) return c.res;
  const { id } = await params;
  return reply(() => dashboard(c.repo, c.user, id));
}
