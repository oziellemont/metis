/**
 * POST /api/ceo/importar → trae a la cuenta la carrera guardada en este navegador (adenda v3.2 §3).
 *
 * Cuerpo: { importId: uuid, mode: "vacia" | "reemplazar", state: CeoState }
 *  - "vacia": solo si la cuenta NO tiene carrera. Si ya tiene, responde 409 (nunca se pisa sin elección).
 *  - "reemplazar": el jugador eligió explícitamente usar la del navegador; la carrera de la cuenta se
 *    guarda completa en ceo.career_imports.replaced_state (recuperable). Sin esa tabla, se rechaza.
 *
 * Seguridad: el usuario sale de la sesión (nunca del cuerpo). El servidor valida la partida y calcula XP.
 * Idempotencia: el import_id es la llave primaria de la bitácora; repetirlo devuelve el mismo resultado.
 */
import { NextResponse } from "next/server";
import { supabaseCeoAdmin, supabaseServer } from "@/lib/supabase/server";
import { isImportId, markLegacy, validateImport } from "@/lib/ceo/import";
import { playerRow } from "@/lib/ceo/player-row";
import { CATALOG_VERSION } from "@/lib/ceo/catalog";
import { migrate } from "@/lib/ceo/engine";
import type { CeoState } from "@/lib/ceo/types";

export const dynamic = "force-dynamic";

const j = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });
const missingTable = (e: { code?: string; message?: string } | null) => !!e && (e.code === "42P01" || e.code === "PGRST205" || /career_imports/.test(e.message ?? ""));

export async function POST(req: Request) {
  const sb = await supabaseServer();
  if (!sb) return j({ ok: false, error: "sin_backend" }, 503);
  const { data } = await sb.auth.getUser();
  const user = data.user;
  if (!user?.id) return j({ ok: false, error: "sin_sesion" }, 401);
  const admin = supabaseCeoAdmin();
  if (!admin) return j({ ok: false, error: "sin_backend" }, 503);

  const body = (await req.json().catch(() => null)) as { importId?: unknown; mode?: unknown; state?: unknown } | null;
  if (!body || !isImportId(body.importId)) return j({ ok: false, error: "import_id_invalido" }, 400);
  if (body.mode !== "vacia" && body.mode !== "reemplazar") return j({ ok: false, error: "modo_invalido" }, 400);
  const importId = body.importId.toLowerCase();
  const now = Date.now();

  // 1) ¿Ya se hizo esta importación? (doble clic, recarga o respuesta perdida)
  const prev = await admin.from("career_imports").select("user_id").eq("import_id", importId).maybeSingle();
  const hasLog = !missingTable(prev.error);
  if (prev.error && hasLog) return j({ ok: false, error: "no_guardado" }, 500);
  const { data: row, error: readErr } = await admin.from("players").select("state").eq("user_id", user.id).maybeSingle();
  if (readErr) return j({ ok: false, error: "no_guardado" }, 500);
  const cloud = row?.state && typeof row.state === "object" && (row.state as CeoState).startedAt ? migrate(row.state) : null;
  if (prev.data) {
    if (prev.data.user_id !== user.id) return j({ ok: false, error: "import_id_ajeno" }, 409);
    return j({ ok: true, repeated: true, state: cloud });
  }
  if (cloud?.origin?.importId === importId) return j({ ok: true, repeated: true, state: cloud });

  // 2) Nunca pisar una carrera sin elección explícita.
  if (cloud && body.mode === "vacia") return j({ ok: false, error: "nube_ocupada" }, 409);
  if (cloud && !hasLog) return j({ ok: false, error: "sin_respaldo" }, 503);

  // 3) Validar la partida (no se corrige nada: si no cuadra, la copia local se queda intacta).
  const check = validateImport(body.state, now);
  if (!check.ok) return j({ ok: false, error: check.error }, 422);
  const state: CeoState = { ...markLegacy(check.state, importId, now), savedAt: now };
  const out = playerRow(user.id, state, user.email ?? "", now);

  // 4) Bitácora primero (su llave primaria evita duplicados aunque lleguen dos a la vez), luego la carrera.
  if (hasLog) {
    const ins = await admin.from("career_imports").insert({
      import_id: importId, user_id: user.id, mode: cloud ? "reemplazar" : "vacia", legacy_company_id: state.origin!.legacyCompanyId,
      rules_version: state.origin!.rulesVersion, catalog_version: CATALOG_VERSION,
      local_saved_at: state.origin!.localSavedAt ? new Date(state.origin!.localSavedAt).toISOString() : null,
      xp: out.xp, decisions: out.decisions, warnings: check.warnings, replaced_state: cloud ?? null,
    });
    if (ins.error) {
      if (ins.error.code === "23505") return j({ ok: true, repeated: true, state: cloud });
      return j({ ok: false, error: "no_guardado" }, 500);
    }
  }
  const up = await admin.from("players").upsert(out, { onConflict: "user_id" });
  if (up.error) {
    if (hasLog) await admin.from("career_imports").delete().eq("import_id", importId);
    return j({ ok: false, error: "no_guardado" }, 500);
  }
  return j({ ok: true, repeated: false, state, warnings: check.warnings });
}
