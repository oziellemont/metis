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
import { academyReminderEmail } from "@/lib/academy/email";
import { MODULE_IDS } from "@/lib/academy/content";
import { shouldRemindAcademy, type ProgressMap } from "@/lib/academy/progress";

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
  const academy = await academyReminders(sb, tenants ?? [], appUrl, now, dry);
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
  return NextResponse.json({ at: now.toISOString(), academy, report });
}

/**
 * Metis Academy: cada 2 días, a quien ya entró a una empresa y no ha aprobado todos los módulos.
 * El avance es por persona, así que se manda un solo correo aunque esté en varias empresas.
 */
async function academyReminders(sb: NonNullable<ReturnType<typeof supabaseAdmin>>, tenants: { id: string; name: string }[], appUrl: string, now: Date, dry: boolean) {
  const prog = await sb.from("academy_progress").select("user_id, module_id, best_score, attempts, passed_at");
  if (prog.error) return { skipped: "Falta correr la migración 0007_academy.sql" };
  const mem = await sb.from("memberships").select("tenant_id, user_id, profiles:profiles!memberships_user_id_fkey(full_name, email)").eq("active", true);
  if (mem.error) return { error: mem.error.message };

  type Row = { tenant_id: string; user_id: string; profiles: { full_name: string; email: string } | { full_name: string; email: string }[] | null };
  const people = new Map<string, { tenantId: string; name: string; email: string }>();
  for (const m of (mem.data ?? []) as unknown as Row[]) {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    if (p?.email && !people.has(m.user_id)) people.set(m.user_id, { tenantId: m.tenant_id, name: p.full_name || p.email.split("@")[0], email: p.email });
  }
  const byUser = new Map<string, ProgressMap>();
  for (const r of prog.data ?? []) {
    const map = byUser.get(r.user_id) ?? {};
    map[r.module_id] = { moduleId: r.module_id, bestScore: r.best_score, attempts: r.attempts, passedAt: r.passed_at };
    byUser.set(r.user_id, map);
  }
  const ids = [...people.keys()];
  const logs = ids.length
    ? await sb.from("notification_log").select("user_id, sent_at").eq("kind", "academy_reminder").in("status", ["sent", "dry_run"]).in("user_id", ids).order("sent_at", { ascending: false })
    : { data: [] as { user_id: string; sent_at: string }[] };
  const last = new Map<string, Date>();
  (logs.data ?? []).forEach((l) => { if (!last.has(l.user_id)) last.set(l.user_id, new Date(l.sent_at)); });

  const due = ids.filter((id) => {
    const p = byUser.get(id) ?? {};
    const done = MODULE_IDS.every((m) => p[m]?.passedAt);
    return shouldRemindAcademy(done, last.get(id) ?? null, now);
  });
  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.name ?? "tu empresa";
  const msgs = due.map((id) => {
    const who = people.get(id)!;
    return { id, who, ...academyReminderEmail({ name: who.name, tenantName: tenantName(who.tenantId), appUrl, progress: byUser.get(id) ?? {} }) };
  });
  if (dry || !msgs.length) return { due: msgs.length, dry, recipients: msgs.map((m) => m.who.email) };

  const res = await sendMany(msgs.map((m) => ({ to: m.who.email, subject: m.subject, html: m.html, text: m.text })));
  await sb.from("notification_log").insert(msgs.map((m, i) => ({
    tenant_id: m.who.tenantId, user_id: m.id, channel: "email", kind: "academy_reminder",
    subject: m.subject, status: res[i]?.ok ? (res[i]?.dryRun ? "dry_run" : "sent") : "failed", error: res[i]?.error ?? null,
  })));
  return { due: msgs.length, sent: res.filter((r) => r.ok).length };
}
