"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, CalendarClock, CalendarPlus, CheckCircle2, ClipboardCheck, MapPin, Play, Users } from "lucide-react";
import { useMetis } from "@/lib/store";
import { Avatar, PageHeader } from "@/components/ui/primitives";
import { NewSessionDialog } from "@/components/sessions/NewSessionDialog";
import { Pct, SESSION_STATUS_UI } from "@/components/sessions/parts";
import type { Session } from "@/lib/domain/types";
import { commitmentsOfSession, compliance, sessionDateLabel, sessionTitle, teamOf } from "@/lib/sessions/logic";

export default function SesionesPage() {
  const s = useMetis();
  const me = s.userOf(s.currentUserId);
  const team = teamOf(s.users, me.id);
  const isLeader = team.length > 0;
  const boss = me.managerId ? s.userOf(me.managerId) : null;
  const [tabRaw, setTab] = useState<"mine" | "boss" | null>(null);
  const tab = tabRaw ?? (isLeader ? "mine" : "boss");
  const [dialog, setDialog] = useState(false);

  const leaderId = tab === "mine" ? me.id : boss?.id ?? "";
  const list = useMemo(() => s.sessions.filter((x) => x.leaderId === leaderId).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)), [s.sessions, leaderId]);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const pendingReview = list.filter((x) => x.status === "review" || x.status === "live");
  const upcoming = list.filter((x) => x.status === "scheduled" && x.scheduledAt >= startToday);
  const overdue = list.filter((x) => x.status === "scheduled" && x.scheduledAt < startToday);
  const history = list.filter((x) => x.status === "closed").reverse();
  const next = upcoming[0];

  const people = tab === "mine" ? [me, ...team] : boss && boss.id ? [boss, ...teamOf(s.users, boss.id)] : [];
  const ids = new Set(people.map((p) => p.id));
  const four = { from: new Date(now.getTime() - 28 * 86_400_000), to: now, today: now };
  const comp = compliance(s.commitments, { ...four, ownerIds: [...ids] });
  const openC = s.commitments.filter((c) => c.approved && c.status === "open" && ids.has(c.ownerId));

  return (
    <>
      <PageHeader
        title="Sesiones WTW / WTM"
        subtitle="El ritmo del equipo: cada semana, cómo se cerró y qué sigue; cada mes, el cierre y el enfoque del siguiente."
        actions={tab === "mine" && isLeader ? <button className="btn-primary" onClick={() => setDialog(true)}><CalendarPlus size={16} /> Agendar sesión</button> : undefined}
      />

      {isLeader && boss && boss.id && (
        <div className="mb-5 inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-100">
          {([["mine", "Con mi equipo"], ["boss", `Con ${boss.name.split(" ")[0]} (mi jefe)`]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={clsx("rounded-lg px-3 py-1.5 text-sm transition", tab === k ? "bg-indigo text-white font-medium" : "text-slate-500 hover:text-ink")}>{l}</button>
          ))}
        </div>
      )}

      {!isLeader && !(boss && boss.id) ? (
        <div className="card p-8 text-center text-sm text-slate-500">Aún no tienes equipo ni jefe asignado. Pide a tu administrador que configure tu jefe directo en Usuarios.</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {next ? (
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 text-white shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-mint-light">Próxima sesión</div>
                    <div className="mt-1 text-2xl font-semibold">{sessionTitle(next)}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
                      <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} /> {sessionDateLabel(next.scheduledAt)}</span>
                      {next.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {next.location}</span>}
                    </div>
                  </div>
                  <div className="flex -space-x-2">{people.slice(0, 6).map((p) => <Avatar key={p.id} initials={p.initials} className="ring-2 ring-[#1E1A5E]" />)}</div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <MiniStat label="Compromisos abiertos" value={String(openC.filter((c) => c.kind === "commitment").length)} />
                  <MiniStat label="Apoyos abiertos" value={String(s.commitments.filter((c) => c.approved && c.status === "open" && c.kind === "support" && (ids.has(c.ownerId) || (c.requestedBy && ids.has(c.requestedBy)))).length)} />
                  <MiniStat label="Cumplimiento (4 sem.)" value={comp.pct === null ? "—" : `${comp.pct}%`} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/sesiones/${next.id}`} className="btn bg-white text-ink hover:bg-white/90"><ClipboardCheck size={16} /> {tab === "mine" ? "Preparar" : "Ver"}</Link>
                  {tab === "mine" && <Link href={`/sesiones/${next.id}?presentar=1`} className="btn-mint"><Play size={16} /> Presentar</Link>}
                </div>
              </div>
            ) : (
              <div className="card p-6 text-center">
                <CalendarClock className="mx-auto text-slate-300" />
                <div className="mt-2 font-semibold">No hay sesiones agendadas</div>
                <p className="mt-1 text-sm text-slate-500">{tab === "mine" ? "Agenda tu WTW semanal: misma hora, mismo día, 20–30 minutos." : `${boss?.name.split(" ")[0]} aún no agenda la próxima sesión.`}</p>
                {tab === "mine" && <button className="btn-primary mt-4" onClick={() => setDialog(true)}><CalendarPlus size={16} /> Agendar sesión</button>}
              </div>
            )}

            {(pendingReview.length > 0 || overdue.length > 0) && tab === "mine" && (
              <div className="card border-amber/30 p-5">
                <h2 className="mb-3 font-semibold">Requieren tu atención</h2>
                <ul className="divide-y divide-slate-100">
                  {[...pendingReview, ...overdue].map((x) => <SessionRow key={x.id} x={x} hint={x.status === "scheduled" ? "Ya pasó la fecha: preséntala o cámbiala de día" : x.status === "live" ? "Quedó abierta: termínala" : "Revisa el borrador y apruébalo para enviar las tareas"} />)}
                </ul>
              </div>
            )}

            <div className="card p-5">
              <h2 className="mb-3 font-semibold">Agenda</h2>
              {upcoming.length === 0 ? <p className="text-sm text-slate-400">Sin sesiones próximas.</p> : (
                <ul className="divide-y divide-slate-100">{upcoming.map((x) => <SessionRow key={x.id} x={x} />)}</ul>
              )}
            </div>

            <div className="card p-5">
              <h2 className="mb-3 font-semibold">Historial</h2>
              {history.length === 0 ? <p className="text-sm text-slate-400">Aquí quedan las sesiones cerradas con su resumen y compromisos.</p> : (
                <ul className="divide-y divide-slate-100">{history.map((x) => <SessionRow key={x.id} x={x} showSummary />)}</ul>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2"><Users size={16} className="text-indigo" /><h2 className="font-semibold">Equipo natural</h2></div>
              <ul className="space-y-2.5">
                {people.map((p, i) => {
                  const pc = compliance(s.commitments, { ...four, ownerIds: [p.id] });
                  const open = openC.filter((c) => c.ownerId === p.id).length;
                  return (
                    <li key={p.id} className="flex items-center gap-3">
                      <Avatar initials={p.initials} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{p.name}{i === 0 && <span className="ml-1.5 text-xs font-normal text-slate-400">· líder</span>}</div>
                        <div className="text-xs text-slate-400">{open} abierto{open === 1 ? "" : "s"}</div>
                      </div>
                      <Pct value={pc.pct} className="text-sm font-semibold tabular-nums" />
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs text-slate-400">% = compromisos cumplidos de los que vencían en las últimas 4 semanas.</p>
              <Link href="/compromisos" className="mt-3 inline-flex items-center gap-1 text-sm text-indigo">Ver compromisos <ArrowRight size={14} /></Link>
            </div>
            <div className="card p-5 text-sm text-slate-600">
              <div className="mb-3 font-semibold text-ink">Cómo funciona</div>
              <ol className="space-y-2.5">
                <li className="flex gap-2"><Step n={1} /> METIS arma la presentación: marcador, compromisos de la sesión anterior y apoyos abiertos.</li>
                <li className="flex gap-2"><Step n={2} /> En la junta capturas compromisos y apoyos: qué, quién y para cuándo.</li>
                <li className="flex gap-2"><Step n={3} /> Al terminar revisas el borrador y lo apruebas: cada quien lo recibe como tarea.</li>
                <li className="flex gap-2"><Step n={4} /> En la siguiente WTW aparece si se cumplió o no.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <NewSessionDialog open={dialog} onClose={() => setDialog(false)} leaderId={me.id} />
    </>
  );
}

function Step({ n }: { n: number }) {
  return <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-soft text-[11px] font-semibold text-indigo">{n}</span>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-2 py-3">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-[11px] leading-tight text-white/60">{label}</div>
    </div>
  );
}

function SessionRow({ x, hint, showSummary }: { x: Session; hint?: string; showSummary?: boolean }) {
  const s = useMetis();
  const mine = commitmentsOfSession(s.commitments, x.id);
  const done = mine.filter((c) => c.status === "done").length;
  return (
    <li>
      <Link href={`/sesiones/${x.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-slate-50">
        <div className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[11px] font-bold", x.kind === "wtm" ? "bg-ink text-white" : "bg-indigo-soft text-indigo")}>{x.kind.toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{sessionTitle(x)}</span>
            <span className={clsx("chip shrink-0", SESSION_STATUS_UI[x.status].tone)}>{SESSION_STATUS_UI[x.status].label}</span>
          </div>
          <div className="truncate text-xs text-slate-400">{hint ?? (showSummary && x.summary ? x.summary : `${sessionDateLabel(x.scheduledAt)}${x.location ? ` · ${x.location}` : ""}`)}</div>
        </div>
        {mine.length > 0 && <span className="hidden items-center gap-1 text-xs text-slate-400 sm:inline-flex" title="Compromisos cumplidos de esta sesión"><CheckCircle2 size={13} /> {done}/{mine.length}</span>}
        <ArrowRight size={15} className="text-slate-300" />
      </Link>
    </li>
  );
}
