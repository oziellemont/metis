/**
 * POST /api/ceo/interes { industryId, companyId?, on } → marca o quita «Me interesa» en algo «Próximamente».
 * Exige sesión y escribe con el cliente de la sesión (RLS). Solo acepta ids del catálogo que no sean jugables.
 */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { catalogCompanyById, industryById } from "@/lib/ceo/catalog";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sb = await supabaseServer();
  if (!sb) return NextResponse.json({ ok: false, error: "sin_backend" }, { status: 503 });
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return NextResponse.json({ ok: false, error: "sin_sesion" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { industryId?: unknown; companyId?: unknown; on?: unknown } | null;
  const ind = industryById(typeof body?.industryId === "string" ? body.industryId : null);
  if (!ind) return NextResponse.json({ ok: false, error: "industria_desconocida" }, { status: 400 });
  const companyId = typeof body?.companyId === "string" ? body.companyId : "";
  if (companyId) {
    const c = catalogCompanyById(companyId);
    if (!c || c.industryId !== ind.id) return NextResponse.json({ ok: false, error: "empresa_desconocida" }, { status: 400 });
    if (c.status !== "coming_soon") return NextResponse.json({ ok: false, error: "no_aplica" }, { status: 400 });
  } else if (ind.status !== "coming_soon") return NextResponse.json({ ok: false, error: "no_aplica" }, { status: 400 });
  const t = sb.schema("ceo").from("industry_interest");
  const row = { user_id: uid, industry_id: ind.id, company_id: companyId };
  const { error } = body?.on === false
    ? await t.delete().match(row)
    : await t.upsert(row, { onConflict: "user_id,industry_id,company_id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ ok: false, error: "no_guardado" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
