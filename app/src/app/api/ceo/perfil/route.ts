/**
 * POST /api/ceo/perfil → guarda el perfil de onboarding v3.2 en ceo.players (migración 0016).
 * - Exige sesión: el usuario lo verifica Supabase en el servidor; nunca se toma del cuerpo.
 * - Escribe con el cliente de la sesión (RLS: solo su propia fila). No usa la llave de servicio.
 * - Valida el par industria–empresa contra el catálogo jugable (lib/ceo/catalog.ts).
 */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { onboardingToRow, sanitizeOnboarding } from "@/lib/ceo/onboarding";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sb = await supabaseServer();
  if (!sb) return NextResponse.json({ ok: false, error: "sin_backend" }, { status: 503 });
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return NextResponse.json({ ok: false, error: "sin_sesion" }, { status: 401 });
  const check = sanitizeOnboarding(await req.json().catch(() => null), Date.now());
  if (!check.ok) return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
  const { error } = await sb.schema("ceo").from("players").upsert({ user_id: uid, ...onboardingToRow(check.profile), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ ok: false, error: "no_guardado" }, { status: 500 });
  return NextResponse.json({ ok: true, profile: check.profile });
}
