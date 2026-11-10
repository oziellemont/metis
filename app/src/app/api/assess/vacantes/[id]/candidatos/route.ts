/** POST /api/assess/vacantes/:id/candidatos { label, email? } → invita a un candidato; el enlace se muestra una sola vez. */
import { ctx, reply } from "@/lib/assess/http";
import { invite } from "@/lib/assess/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await ctx(); if (!c.ok) return c.res;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  return reply(async () => { const r = await invite(c.repo, c.user, id, body); return r.ok ? { ok: true as const, data: { candidate: r.data } } : r; });
}
