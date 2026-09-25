/**
 * Cron de recordatorios de cierre de mes.
 * Vercel lo invoca según `vercel.json` (todos los días 15:00 UTC = 9:00 Monterrey).
 * Por cada empresa: si hoy es uno de sus días configurados, arma los correos con
 * `buildReminders` y los envía; deja constancia en metis.notification_log.
 *
 * Seguridad: Vercel manda `Authorization: Bearer $CRON_SECRET`. Sin ese header se rechaza.
 * Prueba manual: GET /api/cron/recordatorios?dry=1  (con el mismo header) → no envía, sólo lista.
 */
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendMany } from "@/lib/email";
import { buildReminders, DEFAULT_REMINDERS, periodFor } from "@/lib/domain/reminders";
import type { Element, ElementScope, ReminderSettings, Result, User } from "@/lib/domain/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function localDay(tz: string, now: Date) {
  return new Date(now.toLocaleString("en-US", { timeZone: tz || "America/Monterrey" })).getDate();
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const force = req.nextUrl.searchParams.get("force") === "1"; // ignora el día configurado (para probar)
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase no configurado (SUPABASE_SERVICE_ROLE_KEY)" }, { status: 503 });

  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const { data: tenants, error } = await sb.from("tenants").select("id, name, settings");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const report: Record<string, unknown>[] = [];
  for (const t of tenants ?? []) {
    const settings: ReminderSettings = { ...DEFAULT_REMINDERS, ...((t.settings as { reminders?: Partial<ReminderSettings> } | null)?.reminders ?? {}) };
    const today = localDay(settings.timezone, now);
    if (!force && (!settings.enabled || !settings.days.includes(today))) { report.push({ tenant: t.name, skipped: true, today }); continue; }

    const [mem, es, els, res, scopes] = await Promise.all([
      sb.from("memberships").select("user_id, manager_id, title, active, profiles:profiles!memberships_user_id_fkey(full_name, email)").eq("tenant_id", t.id).eq("active", true),
      sb.from("element_scopes").select("id, element_id, scope_id, owner_user_id").eq("tenant_id", t.id),
      sb.from("elements").select("id, name, unit, direction, type, lae_id, formula").eq("tenant_id", t.id),
      sb.from("results").select("element_scope_id, year, month, value").eq("tenant_id", t.id),
      sb.from("scopes").select("id, name").eq("tenant_id", t.id),
    ]);

    type MemRow = { user_id: string; manager_id: string | null; title: string | null; profiles: { full_name: string; email: string } | { full_name: string; email: string }[] | null };
    const users: User[] = ((mem.data ?? []) as unknown as MemRow[]).map((m) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return { id: m.user_id, name: p?.full_name ?? "", email: p?.email, title: m.title ?? "", initials: "", managerId: m.manager_id, role: "collaborator" };
    });
    const elementScopes: ElementScope[] = (es.data ?? []).map((x) => ({ id: x.id, elementId: x.element_id, scopeId: x.scope_id, ownerUserId: x.owner_user_id }));
    const elements: Element[] = (els.data ?? []).map((x) => ({ id: x.id, name: x.name, unit: x.unit, direction: x.direction, type: x.type, laeId: x.lae_id, formula: x.formula ?? "", allowedScopeTypeIds: [] }));
    const results: Result[] = (res.data ?? []).map((x, i) => ({ id: String(i), elementScopeId: x.element_scope_id, year: x.year, month: x.month, value: x.value === null ? null : Number(x.value) }));
    const scopeName = (id: string) => scopes.data?.find((s) => s.id === id)?.name ?? "";

    const msgs = buildReminders({ tenantName: t.name, appUrl, settings, users, elementScopes, elements, results, scopeName, now });
    let sent = 0;
    if (!dry && settings.channels.email && msgs.length) {
      const r = await sendMany(msgs.map((m) => ({ to: m.to.email, subject: m.subject, html: m.html, text: m.text })));
      sent = r.filter((x) => x.ok).length;
      const p = periodFor(now);
      await sb.from("notification_log").insert(msgs.map((m, i) => ({
        tenant_id: t.id, user_id: m.to.userId, channel: "email", kind: `reminder_${m.kind}`, period_year: p.year, period_month: p.month,
        subject: m.subject, status: r[i]?.ok ? (r[i]?.dryRun ? "dry_run" : "sent") : "failed", error: r[i]?.error ?? null,
      })));
    }
    report.push({ tenant: t.name, today, messages: msgs.length, sent, dry, recipients: msgs.map((m) => `${m.kind}:${m.to.email}`) });
  }
  return NextResponse.json({ at: now.toISOString(), report });
}
