// Solo servidor. Utilidades comunes de las rutas /api/assess.
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAssessRepo, AssessDbError } from "./repo-supabase";
import type { Repo, Result, User } from "./server";

/** Interruptor general de Assess (Vercel). Apagado salvo ASSESS_ENABLED=1. */
export const assessEnabled = (v = process.env.ASSESS_ENABLED) => (v ?? "").trim() === "1";

export async function ctx(): Promise<{ ok: true; repo: Repo; user: User | null } | { ok: false; res: NextResponse }> {
  if (!assessEnabled()) return { ok: false, res: NextResponse.json({ ok: false, error: "assess_apagado" }, { status: 404 }) };
  const repo = supabaseAssessRepo();
  if (!repo) return { ok: false, res: NextResponse.json({ ok: false, error: "sin_backend" }, { status: 503 }) };
  const sb = await supabaseServer();
  const u = sb ? (await sb.auth.getUser().catch(() => null))?.data.user ?? null : null;
  return { ok: true, repo, user: u ? { id: u.id, email: u.email ?? null } : null };
}

export async function reply<T>(fn: () => Promise<Result<T>>): Promise<NextResponse> {
  try {
    const r = await fn();
    const res = r.ok ? NextResponse.json({ ok: true, ...((r.data ?? {}) as object) }) : NextResponse.json({ ok: false, error: r.error }, { status: r.status });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    const code = e instanceof AssessDbError ? e.code : "error";
    return NextResponse.json({ ok: false, error: code }, { status: 500 });
  }
}
