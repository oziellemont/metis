"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, CalendarClock, CheckCircle2, Copy, Flag, HandHelping, ListChecks, MapPin, Mic, Pencil, Play, Send, Trash2 } from "lucide-react";
import { useMetis } from "@/lib/store";
import { PageHeader } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CommitmentRow, Pct, QuickCapture, SESSION_STATUS_UI } from "@/components/sessions/parts";
import { Scoreboard } from "@/components/sessions/Scoreboard";
import { PresentMode } from "@/components/sessions/PresentMode";
import { NewSessionDialog } from "@/components/sessions/NewSessionDialog";
import { useDeck } from "@/components/sessions/useDeck";
import { MONTHS } from "@/lib/labels";
import { sessionDateLabel, sessionTitle } from "@/lib/sessions/logic";

export default function SessionPage() {
  return <Suspense fallback={null}><SessionView /></Suspense>;
}

function SessionView() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const s = useMetis();
  const session = s.sessions.find((x) => x.id === id);
  const deck = useDeck(session);
  const me = s.userOf(s.currentUserId);
  const isLeader = !!session && (session.leaderId === me.id || me.role === "admin");
  const [presenting, setPresenting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [summary, setSummary] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (session) setSummary(session.summary ?? ""); }, [session?.id, session?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (search.get("presentar") === "1" && session && isLeader && session.status !== "closed") setPresenting(true);
  }, [search, session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session || !deck) {
    return (
      <div className="card p-8 text-center">
        <div className="font-semibold">No encontramos esta sesión</div>
        <Link href="/sesiones" className="btn-ghost mt-4 inline-flex"><ArrowLeft size={16} /> Volver a sesiones</Link>
      </div>
    );
  }

  const isWtm = session.kind === "wtm";
  const drafts = deck.fresh.filter((c) => !c.approved);
  const st = SESSION_STATUS_UI[session.status];

  const approve = () => {
    s.approveSession(session.id, summary.trim() || undefined);
  };
  const copyMinutes = async () => {
    const lines = [
      `${sessionTitle(session)} · ${sessionDateLabel(session.scheduledAt)}`,
      summary ? `\nResumen: ${summary}` : "",
      session.focus?.length ? `\nFocos del mes:\n${session.focus.map((f, k) => `${k + 1}. ${f}`).join("\n")}` : "",
      `\nCompromisos:`,
      ...deck.fresh.map((c) => `• ${c.kind === "support" ? "[Apoyo] " : ""}${c.title} — ${s.userOf(c.ownerId).name}${c.dueDate ? ` (para ${c.dueDate})` : ""}`),
      session.notes ? `\nNotas: ${session.notes}` : "",
    ].filter(Boolean);
    try { await navigator.clipboard.writeText(lines.join("\n")); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* sin permiso */ }
  };

  return (
    <>
      <Link href="/sesiones" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo"><ArrowLeft size={14} /> Sesiones</Link>
      <PageHeader
        title={sessionTitle(session)}
        subtitle={`${deck.leader.name} con su equipo natural · ${deck.people.length} personas`}
        actions={isLeader ? (
          <>
            {session.status !== "closed" && <button className="btn-ghost" onClick={() => setEditing(true)} aria-label="Editar fecha o lugar"><Pencil size={15} /></button>}
            {session.status === "scheduled" && <button className="btn-ghost" onClick={() => setConfirmDel(true)} aria-label="Borrar sesión"><Trash2 size={15} /></button>}
            {session.status !== "closed" && session.status !== "review" && <button className="btn-mint" onClick={() => setPresenting(true)}><Play size={16} /> {session.status === "live" ? "Continuar" : "Presentar"}</button>}
            {session.status === "review" && <button className="btn-ghost" onClick={() => setPresenting(true)}><Play size={16} /> Volver a la presentación</button>}
          </>
        ) : undefined}
      />

      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
        <span className={clsx("chip", st.tone)}>{st.label}</span>
        <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} /> {sessionDateLabel(session.scheduledAt)}</span>
        {session.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {session.location}</span>}
        {isWtm && <span className="inline-flex items-center gap-1.5"><Flag size={14} /> Cierra {MONTHS[deck.month - 1].toLowerCase()}</span>}
      </div>

      {/* Revisión del líder */}
      {session.status === "review" && isLeader && (
        <div className="card mb-5 overflow-hidden border-amber/40">
          <div className="bg-amber-soft/60 px-5 py-3 text-sm"><strong>Borrador listo para tu aprobación.</strong> Revisa los compromisos: corrige, borra o agrega. Al aprobar, cada persona los recibe como tarea en «Mis compromisos».</div>
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><ListChecks size={16} className="text-indigo" /> Compromisos y apoyos ({drafts.length})</div>
              {drafts.length === 0 ? <p className="text-sm text-slate-400">No se capturaron compromisos nuevos.</p> : (
                <div className="divide-y divide-slate-100">{drafts.map((c) => <CommitmentRow key={c.id} c={c} onDelete={() => s.removeCommitment(c.id)} />)}</div>
              )}
              <div className="mt-3"><QuickCapture people={deck.people} sessionId={session.id} approved={false} /></div>
            </div>
            <div>
              <label className="label" htmlFor="ses-sum">Resumen de la sesión (lo verá tu equipo)</label>
              <textarea id="ses-sum" className="input" rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="En 2–3 líneas: cómo cerramos, qué decidimos, qué sigue." />
              {session.notes && <div className="mt-3 rounded-xl bg-canvas p-3 text-xs text-slate-500"><div className="mb-1 font-semibold text-slate-600">Notas de la sesión</div>{session.notes}</div>}
              {isWtm && (session.focus?.length ?? 0) > 0 && (
                <div className="mt-3 rounded-xl bg-canvas p-3 text-xs text-slate-600"><div className="mb-1 font-semibold">Focos del mes</div><ol className="list-decimal pl-4">{session.focus!.map((f) => <li key={f}>{f}</li>)}</ol></div>
              )}
              <button className="btn-primary mt-4 w-full justify-center" onClick={approve}><Send size={16} /> Aprobar y enviar tareas</button>
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-indigo-soft/50 p-3 text-xs text-slate-600">
                <Mic size={14} className="mt-0.5 shrink-0 text-indigo" />
                <span>Próximamente: graba o sube el audio de la junta (Teams, Meet o Zoom) y el agente de METIS te propondrá este borrador. Tú siempre apruebas antes de enviar.</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {session.status === "review" && !isLeader && (
        <div className="card mb-5 p-4 text-sm text-slate-600">{deck.leader.name.split(" ")[0]} está revisando los compromisos de esta sesión. Te llegarán como tarea cuando los apruebe.</div>
      )}

      {/* Sesión cerrada: minuta */}
      {session.status === "closed" && (
        <div className="card mb-5 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-semibold"><CheckCircle2 size={18} className="text-mint" /> Minuta</div>
            <button className="btn-ghost !py-1.5 text-xs" onClick={copyMinutes}><Copy size={13} /> {copied ? "¡Copiada!" : "Copiar para correo o chat"}</button>
          </div>
          {session.summary ? <p className="text-sm text-slate-600">{session.summary}</p> : <p className="text-sm text-slate-400">Sin resumen.</p>}
          {isWtm && (session.focus?.length ?? 0) > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Focos de {MONTHS[deck.month % 12].toLowerCase()}</div>
              <ol className="grid gap-2 sm:grid-cols-3">{session.focus!.map((f, k) => <li key={f} className="flex gap-2 rounded-xl bg-mint-soft/60 p-3 text-sm"><span className="font-semibold text-sob">{k + 1}</span>{f}</li>)}</ol>
            </div>
          )}
          {session.notes && <div className="mt-4 rounded-xl bg-canvas p-3 text-xs text-slate-500"><span className="font-semibold text-slate-600">Notas: </span>{session.notes}</div>}
          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold">
              <span>Compromisos de esta sesión</span>
              <span className="text-xs font-normal text-slate-400">{deck.fresh.filter((c) => c.status === "done").length} de {deck.fresh.length} cumplidos</span>
            </div>
            {deck.fresh.length === 0 ? <p className="text-sm text-slate-400">No se registraron compromisos.</p> : <div className="divide-y divide-slate-100">{deck.fresh.map((c) => <CommitmentRow key={c.id} c={c} />)}</div>}
          </div>
        </div>
      )}

      {/* Preparación: lo que se va a presentar */}
      {session.status !== "closed" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">{isWtm ? `Marcador de ${MONTHS[deck.month - 1].toLowerCase()}` : "Marcador"}</h2>
              <span className="text-xs text-slate-400">Datos vivos de los scorecards</span>
            </div>
            <Scoreboard slides={deck.slides} />
          </div>
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">A revisar en la sesión</h2>
              {deck.reviewTotal > 0 && <span className="text-xs text-slate-400">{deck.reviewDone}/{deck.reviewTotal} cumplidos</span>}
            </div>
            {deck.review.length === 0 ? <p className="text-sm text-slate-400">Sin compromisos pendientes de sesiones anteriores.</p> : <div className="divide-y divide-slate-100">{deck.review.map((c) => <CommitmentRow key={c.id} c={c} compact />)}</div>}
            {deck.supports.length > 0 && (
              <>
                <div className="mb-1 mt-5 flex items-center gap-2 text-sm font-semibold"><HandHelping size={15} className="text-sky" /> Apoyos abiertos</div>
                <div className="divide-y divide-slate-100">{deck.supports.map((c) => <CommitmentRow key={c.id} c={c} compact />)}</div>
              </>
            )}
            <div className="mt-5 flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-sm">
              <span className="text-slate-500">{isWtm ? "Cumplimiento del mes" : "Cumplimiento 4 semanas"}</span>
              <Pct value={deck.compliance.pct} className="font-semibold" />
            </div>
          </div>
        </div>
      )}

      {presenting && <PresentMode session={session} onExit={(finished) => { setPresenting(false); if (search.get("presentar")) router.replace(`/sesiones/${session.id}`); if (finished) window.scrollTo({ top: 0 }); }} />}
      <NewSessionDialog open={editing} onClose={() => setEditing(false)} leaderId={session.leaderId} editing={session} />
      <ConfirmDialog open={confirmDel} title="¿Borrar esta sesión?" message="Se quita de la agenda. Los compromisos ya aprobados se conservan." confirmLabel="Borrar" destructive
        onConfirm={() => { s.removeSession(session.id); setConfirmDel(false); router.push("/sesiones"); }} onCancel={() => setConfirmDel(false)} />
    </>
  );
}
