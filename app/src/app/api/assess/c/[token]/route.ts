/**
 * Candidato (sin cuenta, con su enlace único):
 * GET  /api/assess/c/:token                          → casos de la evaluación (sin puntajes ni consecuencias).
 * POST /api/assess/c/:token { action: "consent" }    → acepta el aviso de piloto y empieza.
 * POST /api/assess/c/:token { action: "answer", caseId, optionId, reasoning, ms } → guarda una respuesta (una por caso).
 */
import { NextResponse } from "next/server";
import { ctx, reply } from "@/lib/assess/http";
import { answer, candidateView, consent } from "@/lib/assess/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const c = await ctx(); if (!c.ok) return c.res;
  const { token } = await params;
  return reply(async () => { const r = await candidateView(c.repo, token); return r.ok ? { ok: true as const, data: { view: r.data } } : r; });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const c = await ctx(); if (!c.ok) return c.res;
  const { token } = await params;
  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  if (body?.action === "consent") return reply(() => consent(c.repo, token));
  if (body?.action === "answer") return reply(() => answer(c.repo, token, body));
  return NextResponse.json({ ok: false, error: "accion_desconocida" }, { status: 400 });
}
