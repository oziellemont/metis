/**
 * POST /api/ceo/partida → diario de jugadas en modo sombra (Fase 0.5).
 *
 * Cuerpo: { career: <inicio de la carrera, ms>, events: [{ eventId, seq, action }], base?: CeoState, clientXp?: number }
 *
 *  - Exige sesión: el usuario lo da Supabase en el servidor, nunca el cuerpo.
 *  - Si el interruptor «game_journal» está apagado: responde { journal: false } y no guarda nada.
 *  - El servidor vuelve a jugar las jugadas con el motor y guarda su propio estado y XP (ceo.game_runs).
 *    Lo que ve el jugador no cambia: la partida sigue guardándose como siempre en ceo.players.
 *  - Reintentos y duplicados: un eventId ya guardado no se vuelve a aplicar.
 *  - Dos dispositivos: guardado con control de versión (ceo.journal_commit); si chocan, se relee y reintenta.
 *  - Carrera que el servidor no conoce: pide { need: "base" } y el dispositivo manda su estado como punto
 *    de partida (queda marcado como «continuacion» y su XP inicial se guarda aparte).
 */
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseCeoAdmin, supabaseServer } from "@/lib/supabase/server";
import { flagsFor } from "@/lib/ceo/flags-server";
import { migrate, rulesVersionOf } from "@/lib/ceo/engine";
import { applyEvents, checkBase, emptyBase, runSeed, sanitizeEvents, serverXpOf, startsCareer, uuidFromHex, JOURNAL_MAX_BYTES } from "@/lib/ceo/journal";
import type { CeoState } from "@/lib/ceo/types";

export const dynamic = "force-dynamic";

const MISSING = new Set(["42P01", "PGRST205", "42883", "PGRST202"]);
const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });
const runIdOf = (uid: string, career: number) => uuidFromHex(createHash("sha256").update(runSeed(uid, career)).digest("hex"));
/** El correo y el teléfono nunca se guardan en el diario. */
const privateless = (s: CeoState): CeoState => ({ ...s, settings: { ...s.settings, email: "", phone: "" } });

export async function POST(req: Request) {
  const text = await req.text().catch(() => "");
  if (text.length > JOURNAL_MAX_BYTES * 2) return json({ ok: false, error: "muy_grande" }, 413);
  let body: Record<string, unknown> | null = null;
  try { body = JSON.parse(text); } catch { /* inválido */ }
  if (!body || typeof body !== "object") return json({ ok: false, error: "invalido" }, 400);

  const sb = await supabaseServer();
  const user = sb ? (await sb.auth.getUser()).data.user ?? null : null;
  if (!user) return json({ ok: false, error: "sin_sesion" }, 401);

  const flags = await flagsFor(user.id);
  if (!flags.game_journal) return json({ ok: true, journal: false });
  const admin = supabaseCeoAdmin();
  if (!admin) return json({ ok: true, journal: false });

  const career = typeof body.career === "number" && Number.isFinite(body.career) && body.career > 0 ? Math.round(body.career) : 0;
  if (!career) return json({ ok: false, error: "invalido" }, 400);
  const { events, dropped } = sanitizeEvents(body.events);
  const clientXp = typeof body.clientXp === "number" && Number.isFinite(body.clientXp) ? Math.max(0, Math.min(1_000_000, Math.round(body.clientXp))) : null;
  const runId = runIdOf(user.id, career);
  const now = Date.now();

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: run, error: readErr } = await admin.from("game_runs").select("version, state").eq("run_id", runId).maybeSingle();
    if (readErr) return MISSING.has(readErr.code ?? "") ? json({ ok: true, journal: false, reason: "sin_tabla" }) : json({ ok: false, error: "base_de_datos" }, 503);

    let state: CeoState;
    let version = 0, baseKind: "inicio" | "continuacion" = "inicio", baseXp = 0;
    if (run) {
      state = migrate(run.state);
      version = run.version as number;
    } else if (body.base !== undefined) {
      const b = checkBase(body.base, career, now);
      if (!b.ok) return json({ ok: false, error: b.error }, 422);
      state = privateless(b.state); baseKind = b.kind; baseXp = b.xp;
    } else if (startsCareer(events, career)) {
      state = emptyBase();
    } else {
      return json({ ok: false, need: "base" }, 409);
    }

    // Duplicados: lo ya guardado (reintento, doble clic, otra pestaña) no se vuelve a aplicar.
    let fresh = events;
    if (events.length) {
      const { data: had, error: dupErr } = await admin.from("game_events").select("event_id").eq("user_id", user.id).in("event_id", events.map((e) => e.eventId));
      if (dupErr) return json({ ok: false, error: "base_de_datos" }, 503);
      const seen = new Set((had ?? []).map((r: { event_id: string }) => String(r.event_id).toLowerCase()));
      fresh = events.filter((e) => !seen.has(e.eventId));
    }
    if (run && !fresh.length) return json({ ok: true, journal: true, stored: true, accepted: 0, rejected: 0, duplicates: events.length, dropped });

    const out = applyEvents(state, fresh, now);
    const next = privateless(out.state);
    const serverXp = serverXpOf(next, now);
    const { data: res, error: rpcErr } = await admin.rpc("journal_commit", {
      p_user: user.id, p_run: runId, p_career_started_at: new Date(career).toISOString(), p_version: version,
      p_state: next, p_server_xp: serverXp, p_client_xp: clientXp, p_base_kind: baseKind, p_base_xp: baseXp,
      p_rules_version: rulesVersionOf(next), p_events: out.results,
    });
    if (rpcErr) return MISSING.has(rpcErr.code ?? "") ? json({ ok: true, journal: false, reason: "sin_tabla" }) : json({ ok: false, error: "base_de_datos" }, 503);
    if (res === "conflicto") continue;
    return json({ ok: true, journal: true, stored: true, accepted: fresh.length - out.rejected, rejected: out.rejected, flagged: out.flagged, duplicates: events.length - fresh.length, dropped, serverXp, ...(clientXp !== null ? { diff: clientXp - serverXp } : {}) });
  }
  return json({ ok: false, error: "ocupado" }, 503);
}
