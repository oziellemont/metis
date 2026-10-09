/**
 * Revisiones Verticales · lado servidor (service role). Lo usan el cron diario y la ruta de reagendar.
 *  1. Agenda las RV que falten (cada pareja jefe → reporte directo, si la empresa lo activó).
 *  2. Manda la invitación de calendario (.ics) cuando la RV es nueva o cambió de fecha.
 *  3. Manda los recordatorios −3, −1, el mismo día y, si sigue sin cerrarse, diario.
 */
import type { supabaseAdmin } from "../supabase/server";
import { sendMany, type Mail } from "../email";
import { DEFAULT_REMINDERS } from "../domain/reminders";
import { attainment, traffic, weightFor, weightedAttainment } from "../domain/scoring";
import { fmtWithUnit } from "../labels";
import type { Direction, ReminderSettings, RvSettings, Traffic, Unit } from "../domain/types";
import { DEFAULT_RV, googleCalendarUrl, localParts, icsSequence, planRvs, rvIcs, rvStage, rvWhenLabel } from "./rv";
import { rvInviteEmail, rvReminderEmail, type RvKpi } from "./rv-email";
import { RV_GUIDE } from "./guide";

type Admin = NonNullable<ReturnType<typeof supabaseAdmin>>;
export interface TenantRow { id: string; name: string; settings?: unknown; fiscal_year?: number | null }
interface RvRow { id: string; tenant_id: string; leader_id: string; participant_id: string; status: string; scheduled_at: string; closed_at: string | null; location: string | null; invited_for: string | null; auto: boolean }
interface Person { id: string; name: string; email: string; managerId: string | null }

const settingsOf = (t: TenantRow) => {
  const s = (t.settings ?? {}) as { rv?: Partial<RvSettings>; reminders?: Partial<ReminderSettings> };
  return { rv: { ...DEFAULT_RV, ...(s.rv ?? {}) }, tz: s.reminders?.timezone || DEFAULT_REMINDERS.timezone };
};

async function peopleOf(sb: Admin, tenantId: string): Promise<Map<string, Person>> {
  const mem = await sb.from("memberships").select("user_id, manager_id, profiles:profiles!memberships_user_id_fkey(full_name, email)").eq("tenant_id", tenantId).eq("active", true);
  type Row = { user_id: string; manager_id: string | null; profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null };
  const out = new Map<string, Person>();
  for (const m of (mem.data ?? []) as unknown as Row[]) {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    const email = p?.email ?? "";
    out.set(m.user_id, { id: m.user_id, name: p?.full_name || email.split("@")[0] || "Colaborador", email, managerId: m.manager_id });
  }
  return out;
}

const statusOf = (r: { ok: boolean; dryRun?: boolean } | undefined) => (r?.ok ? (r.dryRun ? "dry_run" : "sent") : "failed");

// ------------------------------------------------------------ invitaciones ---
/** Manda (o actualiza) la invitación de calendario de cada RV a jefe y colaborador. */
export async function sendRvInvites(sb: Admin, tenant: TenantRow, rows: RvRow[], appUrl: string, opts: { dry?: boolean; people?: Map<string, Person> } = {}) {
  if (!rows.length) return { invites: 0 };
  const { tz } = settingsOf(tenant);
  const people = opts.people ?? (await peopleOf(sb, tenant.id));
  const base = appUrl.replace(/\/$/, "");
  const mails: (Mail & { userId: string; sessionId: string })[] = [];
  for (const r of rows) {
    const leader = people.get(r.leader_id), participant = people.get(r.participant_id);
    if (!leader || !participant) continue;
    const start = new Date(r.scheduled_at);
    const whenLabel = rvWhenLabel(start, tz);
    const url = `${base}/sesiones/${r.id}`;
    const title = `Revisión Vertical · ${leader.name.split(" ")[0]} y ${participant.name.split(" ")[0]}`;
    const description = `Tu 1 a 1 de desarrollo en mêtis (30 min).\n\nGuía:\n${RV_GUIDE.map((g, i) => `${i + 1}. ${g.label} (${g.minutes} min)`).join("\n")}`;
    const ics = rvIcs({
      sessionId: r.id, start, title, description, location: r.location ?? undefined, url,
      organizer: { name: leader.name, email: leader.email || "recordatorios@metisalign.mx" },
      attendees: [leader, participant].filter((p) => p.email).map((p) => ({ name: p.name, email: p.email })),
      sequence: icsSequence(),
    });
    const googleUrl = googleCalendarUrl({ start, title, description, location: r.location ?? undefined, url });
    const rescheduled = !!r.invited_for;
    for (const who of ["leader", "participant"] as const) {
      const p = who === "leader" ? leader : participant;
      if (!p.email) continue;
      const m = rvInviteEmail({ tenantName: tenant.name, appUrl: base, sessionId: r.id, whenLabel, location: r.location ?? undefined, leader, participant, to: who, rescheduled, googleUrl });
      mails.push({ to: p.email, subject: m.subject, html: m.html, text: m.text, attachments: [{ filename: "revision-vertical.ics", content: ics, contentType: "text/calendar; charset=utf-8; method=REQUEST" }], userId: p.id, sessionId: r.id });
    }
  }
  if (opts.dry || !mails.length) return { invites: mails.length, dry: !!opts.dry, recipients: mails.map((m) => m.to) };
  const res = await sendMany(mails);
  await sb.from("notification_log").insert(mails.map((m, i) => ({
    tenant_id: tenant.id, user_id: m.userId, session_id: m.sessionId, channel: "email", kind: "rv_invite",
    subject: m.subject, status: statusOf(res[i]), error: res[i]?.error ?? null,
  })));
  // queda registrada la fecha invitada: si el jefe la mueve, se vuelve a mandar
  for (const r of rows) await sb.from("sessions").update({ invited_for: r.scheduled_at }).eq("id", r.id);
  return { invites: mails.length, sent: res.filter((x) => x.ok).length };
}

// ------------------------------------------------------- scorecard (correo) ---
async function scorecardSnapshot(sb: Admin, tenant: TenantRow, now: Date, userIds: string[]) {
  const out = new Map<string, { attainment: number | null; kpis: RvKpi[] }>();
  if (!userIds.length) return out;
  // mes que se revisa: el último cerrado (mes anterior)
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = tenant.fiscal_year ?? prev.getFullYear();
  const month = prev.getFullYear() === year ? prev.getMonth() + 1 : 12;
  const [scs, units] = await Promise.all([
    sb.from("scorecards").select("id, user_id").eq("tenant_id", tenant.id).eq("year", year).in("user_id", userIds),
    sb.from("units").select("id, symbol, name, decimals, position").eq("tenant_id", tenant.id),
  ]);
  const scIds = (scs.data ?? []).map((x) => x.id as string);
  if (!scIds.length) return out;
  const items = await sb.from("scorecard_items").select("id, scorecard_id, element_scope_id, weight, monthly_weights, target_min, target_sat, target_out").in("scorecard_id", scIds);
  const esIds = [...new Set((items.data ?? []).map((i) => i.element_scope_id as string))];
  if (!esIds.length) return out;
  const [es, res] = await Promise.all([
    sb.from("element_scopes").select("id, element_id, scope_id").in("id", esIds),
    sb.from("results").select("element_scope_id, value").in("element_scope_id", esIds).eq("year", year).eq("month", month),
  ]);
  const elIds = [...new Set((es.data ?? []).map((x) => x.element_id as string))];
  const scopeIds = [...new Set((es.data ?? []).map((x) => x.scope_id as string))];
  const [els, scopes] = await Promise.all([
    sb.from("elements").select("id, name, unit, unit_id, direction").in("id", elIds),
    sb.from("scopes").select("id, name").in("id", scopeIds),
  ]);
  const unitList: Unit[] = (units.data ?? []).map((u) => ({ id: u.id, symbol: u.symbol, name: u.name, decimals: u.decimals, position: u.position ?? "suffix" }));
  for (const sc of scs.data ?? []) {
    const mine = (items.data ?? []).filter((i) => i.scorecard_id === sc.id);
    const evals = mine.map((i) => {
      const e = (es.data ?? []).find((x) => x.id === i.element_scope_id);
      const el = (els.data ?? []).find((x) => x.id === e?.element_id);
      const v = (res.data ?? []).find((r) => r.element_scope_id === i.element_scope_id)?.value;
      const value = v === null || v === undefined ? null : Number(v);
      const t = { min: Number(i.target_min), sat: Number(i.target_sat), out: Number(i.target_out) };
      const dir = (el?.direction ?? "up") as Direction;
      const mw = Array.isArray(i.monthly_weights) && i.monthly_weights.length === 12 ? Object.fromEntries(i.monthly_weights.map((w: number, k: number) => [k + 1, Number(w)])) : undefined;
      const item = { id: i.id, scorecardId: sc.id, elementScopeId: i.element_scope_id, responsibility: "R" as never, weight: Number(i.weight), monthlyWeights: mw, targets: t, period: "monthly" as never };
      const unit = unitList.find((u) => u.id === el?.unit_id) ?? unitList.find((u) => u.symbol === el?.unit);
      const kpi: RvKpi = {
        name: el?.name ?? "Indicador", scope: (scopes.data ?? []).find((x) => x.id === e?.scope_id)?.name,
        value: fmtWithUnit(value, unit, el?.unit ?? ""), target: fmtWithUnit(t.sat, unit, el?.unit ?? ""), traffic: traffic(value, t, dir) as Traffic,
      };
      return { kpi, ev: { item, value, traffic: kpi.traffic, attainment: attainment(value, t, dir), weight: weightFor(item, month) } };
    });
    const order: Traffic[] = ["below", "minimum", "pending", "satisfactory", "outstanding"];
    out.set(sc.user_id as string, {
      attainment: weightedAttainment(evals.map((x) => x.ev)).value,
      kpis: evals.map((x) => x.kpi).sort((a, b) => order.indexOf(a.traffic) - order.indexOf(b.traffic)),
    });
  }
  return out;
}

// ---------------------------------------------------------------- por empresa ---
/** Lo que hace el cron por cada empresa con RV activadas. */
export async function runRvForTenant(sb: Admin, tenant: TenantRow, appUrl: string, now: Date, dry: boolean) {
  const { rv, tz } = settingsOf(tenant);
  if (!rv.enabled) return { tenant: tenant.name, skipped: "desactivado" };
  const people = await peopleOf(sb, tenant.id);
  const open = await sb.from("sessions").select("id, kind, leader_id, participant_id, status, scheduled_at, closed_at, location, invited_for, auto").eq("tenant_id", tenant.id).or("status.neq.closed,kind.eq.rv");
  if (open.error) return { tenant: tenant.name, skipped: "Falta correr la migración 0011_revision_vertical.sql", error: open.error.message };
  const sessions = open.data ?? [];

  // 1 · agendar las que faltan
  const users = [...people.values()].map((p) => ({ id: p.id, managerId: p.managerId }));
  const plan = planRvs({
    users, now, cadenceWeeks: rv.cadenceWeeks, tz,
    sessions: sessions.map((s) => ({ kind: s.kind, leaderId: s.leader_id, participantId: s.participant_id, status: s.status, scheduledAt: s.scheduled_at, closedAt: s.closed_at ?? undefined })),
  });
  const created: RvRow[] = [];
  if (!dry) {
    for (const p of plan) {
      const ins = await sb.from("sessions").insert({
        tenant_id: tenant.id, kind: "rv", leader_id: p.leaderId, participant_id: p.participantId, scheduled_at: p.at.toISOString(),
        status: "scheduled", auto: true, created_by: p.leaderId, focus: [],
      }).select("id, tenant_id, leader_id, participant_id, status, scheduled_at, closed_at, location, invited_for, auto").single();
      if (ins.data) created.push(ins.data as RvRow); // si ya existía una abierta, el índice único lo impide y se ignora
    }
  }

  // 2 · invitaciones de calendario (nuevas o reagendadas, aún por venir)
  const rvs = [...(sessions.filter((s) => s.kind === "rv") as unknown as RvRow[]), ...created];
  const toInvite = rvs.filter((r) => r.status !== "closed" && new Date(r.scheduled_at) > now && (!r.invited_for || new Date(r.invited_for).getTime() !== new Date(r.scheduled_at).getTime()));
  const invites = await sendRvInvites(sb, tenant, toInvite, appUrl, { dry, people });

  // 3 · recordatorios
  const due = rvs.filter((r) => r.status !== "closed").map((r) => ({ r, st: rvStage(r.scheduled_at, now, tz) })).filter((x) => x.st);
  let reminders: Record<string, unknown> = { due: 0 };
  if (due.length) {
    const since = new Date(now.getTime() - 20 * 3600_000).toISOString();
    const logs = await sb.from("notification_log").select("session_id, user_id, kind").in("session_id", due.map((x) => x.r.id)).like("kind", "rv_%").in("status", ["sent", "dry_run"]).gte("sent_at", since);
    const already = new Set((logs.data ?? []).filter((l) => l.kind !== "rv_invite").map((l) => `${l.session_id}:${l.user_id}`));
    const snap = await scorecardSnapshot(sb, tenant, now, [...new Set(due.map((x) => x.r.participant_id))]);
    const commits = await sb.from("commitments").select("owner_id, title, due_date").eq("tenant_id", tenant.id).eq("status", "open").eq("approved", true).in("owner_id", [...new Set(due.map((x) => x.r.participant_id))]);
    const lp = localParts(now, tz);
    const todayIso = `${lp.y}-${String(lp.m).padStart(2, "0")}-${String(lp.d).padStart(2, "0")}`;
    const base = appUrl.replace(/\/$/, "");
    const mails: (Mail & { userId: string; sessionId: string; kind: string })[] = [];
    for (const { r, st } of due) {
      const leader = people.get(r.leader_id), participant = people.get(r.participant_id);
      if (!leader || !participant || !st) continue;
      const openC = (commits.data ?? []).filter((c) => c.owner_id === r.participant_id).map((c) => ({ title: c.title as string, late: !!c.due_date && (c.due_date as string) < todayIso }));
      const common = { tenantName: tenant.name, appUrl: base, sessionId: r.id, whenLabel: rvWhenLabel(r.scheduled_at, tz), location: r.location ?? undefined, leader, participant, stage: st.stage, daysLate: st.daysLate, openCommitments: openC };
      for (const who of ["leader", "participant"] as const) {
        const p = who === "leader" ? leader : participant;
        if (!p.email || already.has(`${r.id}:${p.id}`)) continue;
        const m = who === "leader"
          ? rvReminderEmail({ ...common, to: who, attainment: snap.get(r.participant_id)?.attainment ?? null, kpis: snap.get(r.participant_id)?.kpis ?? [] })
          : rvReminderEmail({ ...common, to: who });
        mails.push({ to: p.email, subject: m.subject, html: m.html, text: m.text, userId: p.id, sessionId: r.id, kind: `rv_${st.stage}` });
      }
    }
    if (dry || !mails.length) reminders = { due: mails.length, dry, recipients: mails.map((m) => `${m.kind}:${m.to}`) };
    else {
      const res = await sendMany(mails);
      await sb.from("notification_log").insert(mails.map((m, i) => ({
        tenant_id: tenant.id, user_id: m.userId, session_id: m.sessionId, channel: "email", kind: m.kind,
        subject: m.subject, status: statusOf(res[i]), error: res[i]?.error ?? null,
      })));
      reminders = { due: mails.length, sent: res.filter((x) => x.ok).length };
    }
  }
  return {
    tenant: tenant.name, cadenceWeeks: rv.cadenceWeeks,
    planned: plan.map((p) => `${people.get(p.leaderId)?.name} → ${people.get(p.participantId)?.name} · ${rvWhenLabel(p.at, tz)}`),
    created: created.length, invites, reminders,
  };
}

export async function rvAutomation(sb: Admin, tenants: TenantRow[], appUrl: string, now: Date, dry: boolean) {
  const out: unknown[] = [];
  for (const t of tenants) {
    if (!settingsOf(t).rv.enabled) continue;
    try { out.push(await runRvForTenant(sb, t, appUrl, now, dry)); }
    catch (e) { out.push({ tenant: t.name, error: e instanceof Error ? e.message : String(e) }); }
  }
  return out;
}
