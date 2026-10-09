"use client";
/**
 * Revisiones Verticales (1 a 1) en la página de Sesiones.
 * Jefe: la próxima RV con cada reporte directo (o «por agendar»). Colaborador: su RV con su jefe.
 */
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, CalendarClock, CalendarPlus, Sparkles, UserRound } from "lucide-react";
import { newId, useMetis } from "@/lib/store";
import { Avatar } from "@/components/ui/primitives";
import type { Session, User } from "@/lib/domain/types";
import { sessionDateLabel, teamOf } from "@/lib/sessions/logic";
import { DEFAULT_RV, lastClosedRvOf, openRvOf, planRvs } from "@/lib/sessions/rv";

const TZ_DEFAULT = "America/Monterrey";

export function RvPanel({ me }: { me: User }) {
  const s = useMetis();
  const rv = s.tenant.rv ?? DEFAULT_RV;
  const tz = s.tenant.reminders?.timezone ?? TZ_DEFAULT;
  const team = teamOf(s.users, me.id);
  const boss = me.managerId ? s.users.find((u) => u.id === me.managerId) : undefined;
  const isAdmin = me.role === "admin";
  if (!team.length && !boss) return null;

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const rows: { other: User; leaderId: string; participantId: string; mine: boolean }[] = [
    ...team.map((u) => ({ other: u, leaderId: me.id, participantId: u.id, mine: true })),
    ...(boss ? [{ other: boss, leaderId: boss.id, participantId: me.id, mine: false }] : []),
  ];

  /** El jefe agenda a mano (cuando la función automática está apagada o quiere adelantarla). */
  const schedule = (participantId: string) => {
    const [p] = planRvs({ users: [{ id: me.id, managerId: null }, { id: participantId, managerId: me.id }], sessions: s.sessions, now, cadenceWeeks: rv.cadenceWeeks, tz });
    if (!p) return;
    const x: Session = { id: newId(), kind: "rv", leaderId: me.id, participantId, scheduledAt: p.at.toISOString(), status: "scheduled", createdBy: me.id, focus: [] };
    s.upsertSession(x);
  };

  return (
    <div className="card p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><UserRound size={16} className="text-indigo" /><h2 className="font-semibold">Revisiones Verticales · 1 a 1</h2></div>
        <span className={clsx("chip", rv.enabled ? "bg-mint-soft text-sob" : "bg-slate-100 text-slate-500")}>
          {rv.enabled ? <><Sparkles size={12} /> mêtis las agenda {rv.cadenceWeeks === 8 ? "cada bimestre" : `cada ${rv.cadenceWeeks} semanas`}</> : "Agenda automática apagada"}
        </span>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Tu conversación de desarrollo con cada persona, 30 minutos. Llega una invitación a su calendario (Outlook o Google) y recordatorios 3 días antes, 1 día antes y el mismo día.
        {!rv.enabled && (isAdmin ? <> Actívala en <Link href="/config/notificaciones" className="text-indigo">Notificaciones</Link>.</> : " Pide a tu administrador que la active.")}
      </p>
      <ul className="divide-y divide-slate-100">
        {rows.map((r) => {
          const pair = { leaderId: r.leaderId, participantId: r.participantId };
          const open = openRvOf(s.sessions, pair);
          const last = lastClosedRvOf(s.sessions, pair);
          const overdue = open && open.status === "scheduled" && open.scheduledAt < startToday;
          const pendingClose = open && (open.status === "live" || open.status === "review");
          return (
            <li key={`${r.leaderId}-${r.participantId}`} className="flex items-center gap-3 py-2.5">
              <Avatar initials={r.other.initials} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.other.name}{!r.mine && <span className="ml-1.5 text-xs font-normal text-slate-400">· tu jefe</span>}</div>
                <div className={clsx("truncate text-xs", overdue || pendingClose ? "text-amber" : "text-slate-400")}>
                  {open
                    ? overdue ? `Era el ${sessionDateLabel(open.scheduledAt)} · falta cerrarla` : pendingClose ? "Falta cerrarla en mêtis" : <span className="inline-flex items-center gap-1"><CalendarClock size={12} /> {sessionDateLabel(open.scheduledAt)}</span>
                    : last ? `Última: ${sessionDateLabel(last.closedAt ?? last.scheduledAt).split(" · ")[0]}` : "Aún no han tenido su primera RV"}
                </div>
              </div>
              {open ? (
                <Link href={`/sesiones/${open.id}`} className="btn-ghost !px-2.5 !py-1.5 text-xs">{r.mine ? (overdue || pendingClose ? "Cerrar" : "Preparar") : "Ver"} <ArrowRight size={13} /></Link>
              ) : r.mine ? (
                <button className="btn-ghost !px-2.5 !py-1.5 text-xs" onClick={() => schedule(r.participantId)}><CalendarPlus size={13} /> Agendar</button>
              ) : (
                <span className="text-xs text-slate-400">{rv.enabled ? "Se agenda sola" : "Por agendar"}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
