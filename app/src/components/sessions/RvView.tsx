"use client";
/**
 * Pantalla de una Revisión Vertical (1 a 1).
 * Jefe: guía de 5 pasos, scorecard del colaborador, compromisos a revisar, captura y «Cerrar sesión».
 * Colaborador: cómo prepararse, su scorecard y lo que se acordó.
 * Al cerrar: los compromisos capturados se vuelven tareas y paran los recordatorios.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, CalendarClock, CheckCircle2, Copy, ListChecks, MapPin, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { useMetis } from "@/lib/store";
import { PageHeader } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Session } from "@/lib/domain/types";
import { isoDate, sessionDateLabel, sessionTitle } from "@/lib/sessions/logic";
import { RV_GUIDE, RV_GUIDE_NOTE, RV_PREP } from "@/lib/sessions/guide";
import { CommitmentRow, Pct, QuickCapture, SESSION_STATUS_UI } from "./parts";
import { Scoreboard } from "./Scoreboard";
import { useDeck } from "./useDeck";

export function RvView({ session }: { session: Session }) {
  const s = useMetis();
  const router = useRouter();
  const deck = useDeck(session);
  const me = s.userOf(s.currentUserId);
  const leader = s.userOf(session.leaderId);
  const participant = s.userOf(session.participantId);
  const isLeader = session.leaderId === me.id || me.role === "admin";
  const [summary, setSummary] = useState(session.summary ?? "");
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [done, setDone] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setSummary(session.summary ?? ""); }, [session.id, session.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!deck) return null;
  const closed = session.status === "closed";
  const startToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const overdue = !closed && session.scheduledAt < startToday;
  const st = SESSION_STATUS_UI[session.status];
  const drafts = deck.fresh.filter((c) => !c.approved);
  const openOfParticipant = s.commitments.filter((c) => c.approved && c.status === "open" && c.ownerId === participant.id && !deck.review.some((r) => r.id === c.id));
  const people = [participant, leader];

  const close = () => { s.approveSession(session.id, summary.trim() || undefined); setConfirmClose(false); window.scrollTo({ top: 0 }); };
  const copyMinutes = async () => {
    const lines = [
      `${sessionTitle(session, participant.name)} · ${sessionDateLabel(session.scheduledAt)}`,
      session.summary ? `\nResumen: ${session.summary}` : "",
      `\nCompromisos:`,
      ...deck.fresh.map((c) => `• ${c.title} — ${s.userOf(c.ownerId).name}${c.dueDate ? ` (para ${c.dueDate})` : ""}`),
    ].filter(Boolean);
    try { await navigator.clipboard.writeText(lines.join("\n")); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* sin permiso */ }
  };

  return (
    <>
      <Link href="/sesiones" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo"><ArrowLeft size={14} /> Sesiones</Link>
      <PageHeader
        title={sessionTitle(session, participant.name)}
        subtitle={`${leader.name} con ${participant.name} · conversación 1 a 1 de desarrollo · 30 min`}
        actions={isLeader && !closed ? (
          <>
            <button className="btn-ghost" onClick={() => setEditing(true)}><Pencil size={15} /> Cambiar fecha</button>
            {session.status === "scheduled" && <button className="btn-ghost" onClick={() => setConfirmDel(true)} aria-label="Borrar sesión"><Trash2 size={15} /></button>}
          </>
        ) : undefined}
      />

      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
        <span className={clsx("chip", st.tone)}>{st.label}</span>
        <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} /> {sessionDateLabel(session.scheduledAt)}</span>
        {session.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {session.location}</span>}
        {session.auto && <span className="inline-flex items-center gap-1.5 text-indigo"><Sparkles size={14} /> Agendada por mêtis</span>}
      </div>

      {overdue && (
        <div className="card mb-5 border-amber/40 bg-amber-soft/50 p-4 text-sm">
          {isLeader
            ? <><strong>Ya pasó la fecha y no se ha cerrado.</strong> Si ya la tuvieron, captura los compromisos y ciérrala; si no, cámbiala de fecha. mêtis les seguirá recordando a los dos cada día hábil hasta que quede cerrada.</>
            : <><strong>Esta sesión ya pasó y no se ha cerrado.</strong> Si aún no se hace, pídele a {leader.name.split(" ")[0]} una nueva fecha.</>}
        </div>
      )}

      {closed ? (
        <div className="card mb-5 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-semibold"><CheckCircle2 size={18} className="text-mint" /> Sesión cerrada{session.closedAt ? ` · ${sessionDateLabel(session.closedAt).split(" · ")[0]}` : ""}</div>
            <button className="btn-ghost !py-1.5 text-xs" onClick={copyMinutes}><Copy size={13} /> {copied ? "¡Copiada!" : "Copiar minuta"}</button>
          </div>
          {session.summary ? <p className="text-sm text-slate-600">{session.summary}</p> : <p className="text-sm text-slate-400">Sin resumen.</p>}
          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold">
              <span>Compromisos de este 1 a 1</span>
              <span className="text-xs font-normal text-slate-400">{deck.fresh.filter((c) => c.status === "done").length} de {deck.fresh.length} cumplidos</span>
            </div>
            {deck.fresh.length === 0 ? <p className="text-sm text-slate-400">No se registraron compromisos.</p> : <div className="divide-y divide-slate-100">{deck.fresh.map((c) => <CommitmentRow key={c.id} c={c} />)}</div>}
          </div>
          <p className="mt-4 text-xs text-slate-400">La siguiente Revisión Vertical se agenda sola{s.tenant.rv?.enabled ? ` en ${s.tenant.rv.cadenceWeeks === 8 ? "8" : s.tenant.rv.cadenceWeeks} semanas` : ""}; ahí se revisan estos compromisos.</p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Izquierda: guía o preparación */}
        <div className="space-y-5 lg:col-span-2">
          {isLeader ? (
            <div className="card p-5">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo">Guía · 1 a 1</div>
              <h2 className="font-semibold">La conversación, paso a paso (30 min)</h2>
              <ol className="mt-3 space-y-2">
                {RV_GUIDE.map((g, i) => {
                  const on = done.includes(i);
                  return (
                    <li key={g.label}>
                      <button type="button" disabled={closed} onClick={() => setDone((d) => (on ? d.filter((x) => x !== i) : [...d, i]))}
                        className={clsx("flex w-full gap-3 rounded-xl p-2.5 text-left transition", on ? "bg-mint-soft/60" : "hover:bg-slate-50")}>
                        <span className={clsx("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold", on ? "bg-mint text-white" : "bg-indigo-soft text-indigo")}>{on ? "✓" : i + 1}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{g.label} <span className="font-normal text-slate-400">· {g.minutes} min</span></span>
                          <span className="block text-xs leading-relaxed text-slate-500">{g.example}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 rounded-xl bg-amber-soft/60 px-3 py-2 text-xs text-slate-600">💡 {RV_GUIDE_NOTE}</p>
            </div>
          ) : (
            <div className="card p-5">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo">Tu espacio</div>
              <h2 className="font-semibold">Para prepararte</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {RV_PREP.map((p) => <li key={p} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-indigo" />{p}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Derecha: scorecard, compromisos y cierre */}
        <div className="space-y-5 lg:col-span-3">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Scorecard de {participant.name.split(" ")[0]}</h2>
            </div>
            <Scoreboard slides={deck.slides} detailed />
          </div>

          <div className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><ListChecks size={16} className="text-indigo" /> Compromisos del 1 a 1 anterior</h2>
              {deck.reviewTotal > 0 && <span className="text-xs text-slate-400">{deck.reviewDone}/{deck.reviewTotal} cumplidos</span>}
            </div>
            {deck.review.length === 0 ? <p className="text-sm text-slate-400">{deck.previous ? "Todo lo del 1 a 1 anterior quedó resuelto." : "Es su primera Revisión Vertical en mêtis."}</p> : <div className="divide-y divide-slate-100">{deck.review.map((c) => <CommitmentRow key={c.id} c={c} compact showOwner={c.ownerId !== participant.id} />)}</div>}
            {openOfParticipant.length > 0 && (
              <>
                <div className="mb-1 mt-4 text-sm font-semibold">Otros compromisos abiertos de {participant.name.split(" ")[0]}</div>
                <div className="divide-y divide-slate-100">{openOfParticipant.slice(0, 6).map((c) => <CommitmentRow key={c.id} c={c} compact showOwner={false} />)}</div>
              </>
            )}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-sm">
              <span className="text-slate-500">Cumplimiento de {participant.name.split(" ")[0]} · 8 semanas</span>
              <Pct value={deck.compliance.pct} className="font-semibold" />
            </div>
          </div>

          {!closed && isLeader && (
            <div className="card border-indigo/20 p-5">
              <h2 className="font-semibold">Cierra con compromisos</h2>
              <p className="mb-3 text-xs text-slate-500">Que {participant.name.split(" ")[0]} diga sus 1–3 compromisos con fecha. Anota también los tuyos. Al cerrar, cada quien los recibe como tarea.</p>
              {drafts.length > 0 && <div className="mb-3 divide-y divide-slate-100">{drafts.map((c) => <CommitmentRow key={c.id} c={c} compact onDelete={() => s.removeCommitment(c.id)} />)}</div>}
              <QuickCapture people={people} defaultOwnerId={participant.id} sessionId={session.id} approved={false} />
              <label className="label mt-4" htmlFor="rv-sum">Resumen y acuerdos (lo verán los dos)</label>
              <textarea id="rv-sum" className="input" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="En 2–3 líneas: cómo va, qué se destrabó, en qué se va a desarrollar." />
              <button className="btn-primary mt-4 w-full justify-center" onClick={() => setConfirmClose(true)}><CheckCircle2 size={16} /> Cerrar sesión</button>
              <p className="mt-2 text-center text-xs text-slate-400">Al cerrarla se detienen los recordatorios y la siguiente se agenda sola.</p>
            </div>
          )}
          {!closed && !isLeader && deck.fresh.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-2 font-semibold">Lo que van capturando</h2>
              <div className="divide-y divide-slate-100">{deck.fresh.map((c) => <CommitmentRow key={c.id} c={c} compact />)}</div>
              <p className="mt-2 text-xs text-slate-400">Te llegan como tarea cuando {leader.name.split(" ")[0]} cierre la sesión.</p>
            </div>
          )}
        </div>
      </div>

      {editing && <RescheduleDialog session={session} onClose={() => setEditing(false)} />}
      <ConfirmDialog open={confirmClose} title="¿Cerrar la Revisión Vertical?" confirmLabel="Cerrar sesión"
        message={`${drafts.length ? `${drafts.length} compromiso${drafts.length === 1 ? "" : "s"} se enviará${drafts.length === 1 ? "" : "n"} como tarea. ` : "No capturaste compromisos. "}Se detienen los recordatorios y mêtis agenda la siguiente.`}
        onConfirm={close} onCancel={() => setConfirmClose(false)} />
      <ConfirmDialog open={confirmDel} title="¿Borrar esta Revisión Vertical?" confirmLabel="Borrar" destructive
        message={s.tenant.rv?.enabled ? "Se quita de la agenda. Como la agenda automática está activa, mêtis propondrá una nueva fecha mañana. Si solo quieres moverla, usa «Cambiar fecha»." : "Se quita de la agenda."}
        onConfirm={() => { s.removeSession(session.id); setConfirmDel(false); router.push("/sesiones"); }} onCancel={() => setConfirmDel(false)} />
    </>
  );
}

const toLocalInput = (d: Date) => `${isoDate(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** Solo el jefe reagenda. Al guardar, a los dos les llega la invitación actualizada. */
function RescheduleDialog({ session, onClose }: { session: Session; onClose: () => void }) {
  const s = useMetis();
  const [when, setWhen] = useState(toLocalInput(new Date(session.scheduledAt)));
  const [location, setLocation] = useState(session.location ?? "");
  const save = () => {
    if (!when) return;
    s.upsertSession({ ...session, scheduledAt: new Date(when).toISOString(), location: location.trim() || undefined, status: "scheduled" });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="card academy-in w-full max-w-md p-6" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Cambiar fecha">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cambiar fecha</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="grid gap-3">
          <div><label className="label" htmlFor="rv-when">Fecha y hora</label><input id="rv-when" type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
          <div><label className="label" htmlFor="rv-loc">Lugar o liga (Teams, Meet, Zoom u oficina)</label><input id="rv-loc" className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej. Mi oficina o liga de Teams" /></div>
        </div>
        <p className="mt-4 rounded-xl bg-canvas px-3 py-2 text-xs text-slate-500">A los dos les llega la invitación actualizada a su calendario (Outlook o Google). Sugerencia: martes a jueves entre 10:00 y 13:00.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={!when}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
