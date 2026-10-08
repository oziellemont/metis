"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { CalendarClock, CheckCircle2, HandHelping, ListChecks, Plus, Users } from "lucide-react";
import { useMetis } from "@/lib/store";
import { Avatar, PageHeader, Stat } from "@/components/ui/primitives";
import { CommitmentRow, Pct, QuickCapture } from "@/components/sessions/parts";
import type { Commitment } from "@/lib/domain/types";
import { bucketOf, compliance, sessionTitle, teamOf, type Bucket } from "@/lib/sessions/logic";

const BUCKETS: { key: Bucket; label: string; tone: string }[] = [
  { key: "late", label: "Vencidos", tone: "text-coral" },
  { key: "today", label: "Hoy", tone: "text-indigo" },
  { key: "week", label: "Esta semana", tone: "text-ink" },
  { key: "later", label: "Más adelante", tone: "text-ink" },
  { key: "nodate", label: "Sin fecha", tone: "text-slate-500" },
];

export default function CompromisosPage() {
  const s = useMetis();
  const me = s.userOf(s.currentUserId);
  const team = teamOf(s.users, me.id);
  const isLeader = team.length > 0;
  const [tab, setTab] = useState<"mine" | "team">("mine");
  const [who, setWho] = useState<string>("all");
  const [showClosed, setShowClosed] = useState(false);
  const [adding, setAdding] = useState(false);
  const now = new Date();

  const ownerIds = tab === "mine" ? [me.id] : who === "all" ? team.map((u) => u.id) : [who];
  const list = useMemo(
    () => s.commitments.filter((c) => c.approved && ownerIds.includes(c.ownerId)).sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.commitments, ownerIds.join(",")],
  );
  const open = list.filter((c) => c.status === "open");
  const closed = list.filter((c) => c.status !== "open").sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));
  const late = open.filter((c) => bucketOf(c, now) === "late");
  const requested = tab === "mine" ? s.commitments.filter((c) => c.approved && c.kind === "support" && c.requestedBy === me.id && c.status === "open") : [];
  const comp = compliance(s.commitments, { from: new Date(now.getTime() - 28 * 86_400_000), to: now, today: now, ownerIds });

  const byBucket = (b: Bucket) => open.filter((c) => bucketOf(c, now) === b);

  return (
    <>
      <PageHeader
        title="Compromisos"
        subtitle="Lo que cada quien se comprometió a hacer en las sesiones. Se revisa en la siguiente WTW: ¿se cumplió o no?"
        actions={<button className="btn-primary" onClick={() => setAdding((v) => !v)}><Plus size={16} /> Nuevo</button>}
      />

      {isLeader && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-100">
            {([["mine", "Mis compromisos"], ["team", "Mi equipo"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={clsx("rounded-lg px-3 py-1.5 text-sm transition", tab === k ? "bg-indigo text-white font-medium" : "text-slate-500 hover:text-ink")}>{l}</button>
            ))}
          </div>
          {tab === "team" && (
            <div className="flex flex-wrap gap-1">
              <Pill active={who === "all"} onClick={() => setWho("all")}><Users size={13} /> Todos</Pill>
              {team.map((u) => <Pill key={u.id} active={who === u.id} onClick={() => setWho(u.id)}><Avatar initials={u.initials} size="sm" className="!h-4 !w-4 !text-[8px]" /> {u.name.split(" ")[0]}</Pill>)}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Abiertos" value={open.length} sub={`${open.filter((c) => c.kind === "support").length} son apoyos`} />
        <Stat label="Vencidos" value={late.length} sub={late.length ? "Ciérralos o renegocia la fecha" : "Todo a tiempo"} tone={late.length ? "text-coral" : "text-sob"} />
        <Stat label="Cumplimiento (4 semanas)" value={<Pct value={comp.pct} />} sub={comp.total ? `${comp.done} de ${comp.total} que vencían` : "Aún sin compromisos vencidos"} />
        <Stat label="Cerrados" value={closed.length} sub="Cumplidos, no cumplidos o cancelados" />
      </div>

      {adding && (
        <div className="card mt-5 p-5">
          <div className="mb-2 text-sm font-semibold">Nuevo compromiso fuera de sesión</div>
          <QuickCapture autoFocus people={tab === "team" && isLeader ? team : [me, ...team]} defaultOwnerId={tab === "team" && who !== "all" ? who : tab === "team" ? team[0]?.id : me.id} approved onAdded={() => {}} />
          <p className="mt-2 text-xs text-slate-400">Se revisará en la siguiente sesión de tu equipo.</p>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          {open.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto text-mint" size={32} />
              <div className="mt-2 font-semibold">{tab === "mine" ? "No tienes compromisos abiertos" : "Tu equipo no tiene compromisos abiertos"}</div>
              <p className="mt-1 text-sm text-slate-500">Los compromisos nacen en las sesiones WTW y WTM.</p>
              <Link href="/sesiones" className="btn-ghost mt-4 inline-flex"><CalendarClock size={16} /> Ir a sesiones</Link>
            </div>
          ) : (
            <div className="space-y-5">
              {BUCKETS.map((b) => {
                const items = byBucket(b.key);
                if (!items.length) return null;
                return (
                  <section key={b.key}>
                    <div className={clsx("mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider", b.tone)}>{b.label} <span className="font-normal text-slate-400">{items.length}</span></div>
                    <div className="divide-y divide-slate-100">{items.map((c) => <Row key={c.id} c={c} showOwner={tab === "team"} />)}</div>
                  </section>
                );
              })}
            </div>
          )}
          {closed.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <button onClick={() => setShowClosed((v) => !v)} className="text-sm text-slate-500 hover:text-indigo">{showClosed ? "Ocultar" : "Ver"} {closed.length} cerrados</button>
              {showClosed && <div className="mt-2 divide-y divide-slate-100">{closed.map((c) => <Row key={c.id} c={c} showOwner={tab === "team"} />)}</div>}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {tab === "mine" && requested.length > 0 && (
            <div className="card p-5">
              <div className="mb-2 flex items-center gap-2 font-semibold"><HandHelping size={16} className="text-sky" /> Apoyos que pediste</div>
              <div className="divide-y divide-slate-100">{requested.map((c) => <CommitmentRow key={c.id} c={c} compact />)}</div>
            </div>
          )}
          {tab === "team" && (
            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold"><ListChecks size={16} className="text-indigo" /> Cumplimiento por persona</div>
              <ul className="space-y-2.5">
                {team.map((u) => {
                  const pc = compliance(s.commitments, { from: new Date(now.getTime() - 28 * 86_400_000), to: now, today: now, ownerIds: [u.id] });
                  const lateN = s.commitments.filter((c) => c.approved && c.ownerId === u.id && bucketOf(c, now) === "late").length;
                  return (
                    <li key={u.id} className="flex items-center gap-3">
                      <Avatar initials={u.initials} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{u.name}</div>
                        <div className={clsx("text-xs", lateN ? "text-coral" : "text-slate-400")}>{lateN ? `${lateN} vencido${lateN > 1 ? "s" : ""}` : "Al día"}</div>
                      </div>
                      <Pct value={pc.pct} className="text-sm font-semibold" />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="card p-5 text-sm text-slate-600">
            <div className="mb-2 font-semibold text-ink">Un buen compromiso…</div>
            <ul className="space-y-1.5">
              <li>✓ Dice <strong>qué</strong>, <strong>quién</strong> y <strong>para cuándo</strong>.</li>
              <li>✓ Se puede marcar como cumplido o no, sin discusión.</li>
              <li>✓ Es importante de seguir, aunque no esté ligado a un indicador.</li>
            </ul>
            <p className="mt-3 text-xs text-slate-400">Si ya no aplica o no se cumplió, márcalo en ••• para que la siguiente WTW lo refleje con honestidad.</p>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ c, showOwner }: { c: Commitment; showOwner: boolean }) {
  const s = useMetis();
  const ses = c.sessionId ? s.sessions.find((x) => x.id === c.sessionId) : undefined;
  return (
    <div>
      <CommitmentRow c={c} showOwner={showOwner || c.kind === "support"} />
      {ses && <Link href={`/sesiones/${ses.id}`} className="-mt-1.5 mb-1.5 ml-8 block text-[11px] text-slate-400 hover:text-indigo">De {sessionTitle(ses)}</Link>}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition", active ? "bg-ink text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")}>{children}</button>;
}
