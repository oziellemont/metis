"use client";
/**
 * Piezas compartidas de Sesiones y Compromisos: fila de compromiso con check de un clic,
 * captura rápida (compromiso o solicitud de apoyo) y chips de estado.
 */
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Check, HandHelping, MoreHorizontal, Plus, Target, Trash2, Undo2, X } from "lucide-react";
import { newId, useMetis } from "@/lib/store";
import { Avatar } from "@/components/ui/primitives";
import type { Commitment, User } from "@/lib/domain/types";
import { commitmentState, defaultDue, dueLabel, withStatus, type CommitmentState } from "@/lib/sessions/logic";

export const STATE_UI: Record<CommitmentState, { label: string; tone: string; dark: string }> = {
  open: { label: "Abierto", tone: "bg-slate-100 text-slate-600", dark: "bg-white/10 text-white/80" },
  late: { label: "Vencido", tone: "bg-coral-soft text-coral", dark: "bg-coral/20 text-[#FF9AA0]" },
  done: { label: "Cumplido", tone: "bg-mint-soft text-sob", dark: "bg-mint/20 text-mint-light" },
  missed: { label: "No cumplido", tone: "bg-amber-soft text-amber", dark: "bg-amber/20 text-amber" },
  cancelled: { label: "Cancelado", tone: "bg-slate-100 text-slate-400 line-through", dark: "bg-white/5 text-white/40 line-through" },
};

export function StateChip({ c, dark = false }: { c: Pick<Commitment, "status" | "dueDate">; dark?: boolean }) {
  const st = commitmentState(c, new Date());
  return <span className={clsx("chip", dark ? STATE_UI[st].dark : STATE_UI[st].tone)}>{STATE_UI[st].label}</span>;
}

/** ¿Puede el usuario actual cambiar el estado de este compromiso? */
export function useCanEditCommitment() {
  const s = useMetis();
  const me = s.userOf(s.currentUserId);
  return (c: Commitment) => {
    if (me.role === "admin") return true;
    if (c.ownerId === me.id || c.createdBy === me.id || c.requestedBy === me.id) return true;
    if (s.userOf(c.ownerId).managerId === me.id) return true;
    const ses = c.sessionId ? s.sessions.find((x) => x.id === c.sessionId) : undefined;
    return ses?.leaderId === me.id;
  };
}

export function CommitmentRow({ c, showOwner = true, dark = false, compact = false, onDelete }: {
  c: Commitment; showOwner?: boolean; dark?: boolean; compact?: boolean; onDelete?: () => void;
}) {
  const s = useMetis();
  const canEdit = useCanEditCommitment()(c);
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const st = commitmentState(c, new Date());
  const done = c.status === "done";
  const closed = c.status !== "open";
  const owner = s.userOf(c.ownerId);
  const kpi = c.elementScopeId ? s.elementOf(s.esOf(c.elementScopeId).elementId) : null;
  const set = (status: Commitment["status"]) => { s.upsertCommitment(withStatus(c, status)); setMenu(false); };

  return (
    <div className={clsx("group flex items-start gap-3", compact ? "py-2" : "py-2.5")}>
      <button
        type="button"
        disabled={!canEdit}
        onClick={() => set(done ? "open" : "done")}
        title={done ? "Reabrir" : "Marcar como cumplido"}
        aria-label={done ? "Reabrir compromiso" : "Marcar como cumplido"}
        className={clsx(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition",
          done ? "border-mint bg-mint text-white" : st === "missed" ? "border-amber bg-amber/10 text-amber" : dark ? "border-white/40 hover:border-mint" : "border-slate-300 hover:border-mint",
          !canEdit && "cursor-default opacity-60",
        )}
      >
        {done ? <Check size={13} strokeWidth={3} /> : st === "missed" ? <X size={12} strokeWidth={3} /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <div className={clsx("text-sm leading-snug", closed && "line-through decoration-1", closed ? (dark ? "text-white/50" : "text-slate-400") : dark ? "text-white" : "text-ink")}>
          {c.kind === "support" && <HandHelping size={14} className={clsx("mr-1 inline -mt-0.5", dark ? "text-sky" : "text-sky")} />}
          {c.title}
        </div>
        <div className={clsx("mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs", dark ? "text-white/50" : "text-slate-400")}>
          {showOwner && <span className="inline-flex items-center gap-1"><Avatar initials={owner.initials} size="sm" className="!h-4 !w-4 !text-[8px]" />{owner.name.split(" ")[0]}</span>}
          {c.kind === "support" && c.requestedBy && <span>pedido por {s.userOf(c.requestedBy).name.split(" ")[0]}</span>}
          <span className={clsx(st === "late" && (dark ? "text-[#FF9AA0] font-medium" : "text-coral font-medium"))}>{dueLabel(c.dueDate, new Date())}</span>
          {kpi && kpi.id && <span className="inline-flex items-center gap-1"><Target size={11} />{kpi.name}</span>}
          {!c.approved && <span className={clsx("chip !py-0", dark ? "bg-white/10 text-white/70" : "bg-indigo-soft text-indigo")}>Borrador</span>}
          {c.note && <span className="italic">“{c.note}”</span>}
        </div>
      </div>
      {!compact && <StateChip c={c} dark={dark} />}
      {canEdit && (
        <div className="relative" ref={ref}>
          <button type="button" onClick={() => setMenu((v) => !v)} aria-label="Más opciones" className={clsx("rounded-lg p-1 transition", dark ? "text-white/50 hover:bg-white/10" : "text-slate-400 hover:bg-slate-100 opacity-60 group-hover:opacity-100")}>
            <MoreHorizontal size={16} />
          </button>
          {menu && (
            <div className="absolute right-0 top-7 z-30 w-48 rounded-xl border border-slate-100 bg-white py-1 text-sm text-ink shadow-card">
              {c.status !== "done" && <MenuItem icon={Check} onClick={() => set("done")}>Cumplido</MenuItem>}
              {c.status !== "missed" && <MenuItem icon={X} onClick={() => set("missed")}>No cumplido</MenuItem>}
              {c.status !== "cancelled" && <MenuItem icon={X} onClick={() => set("cancelled")}>Ya no aplica</MenuItem>}
              {c.status !== "open" && <MenuItem icon={Undo2} onClick={() => set("open")}>Reabrir</MenuItem>}
              {onDelete && <MenuItem icon={Trash2} danger onClick={() => { onDelete(); setMenu(false); }}>Borrar</MenuItem>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, children, onClick, danger }: { icon: React.ElementType; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={clsx("flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50", danger && "text-coral")}>
      <Icon size={14} /> {children}
    </button>
  );
}

/**
 * Captura rápida: «Qué · Quién · Para cuándo». Enter guarda y deja el cursor listo para el siguiente.
 * En modo apoyo se elige a quién se le pide y quién lo pide.
 */
export function QuickCapture({ people, defaultOwnerId, sessionId, approved, dark = false, onAdded, autoFocus = false }: {
  people: User[]; defaultOwnerId?: string; sessionId?: string | null; approved: boolean; dark?: boolean; onAdded?: (c: Commitment) => void; autoFocus?: boolean;
}) {
  const s = useMetis();
  const [kind, setKind] = useState<Commitment["kind"]>("commitment");
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState(defaultOwnerId ?? people[0]?.id ?? s.currentUserId);
  const [requestedBy, setRequestedBy] = useState(defaultOwnerId ?? s.currentUserId);
  const [due, setDue] = useState(defaultDue(new Date()));
  const [esId, setEsId] = useState("");
  const [showKpi, setShowKpi] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultOwnerId) { setOwnerId(defaultOwnerId); setRequestedBy(defaultOwnerId); }
  }, [defaultOwnerId]);

  // KPIs de la persona (como Owner) para ligar el compromiso, si quieren
  const forKpi = kind === "support" ? requestedBy : ownerId;
  const kpis = s.elementScopes.filter((es) => es.ownerUserId === forKpi);

  const add = () => {
    const t = title.trim();
    if (!t) { input.current?.focus(); return; }
    const c: Commitment = {
      id: newId(), kind, sessionId: sessionId ?? null, ownerId, requestedBy: kind === "support" ? requestedBy : null, title: t,
      dueDate: due || null, status: "open", elementScopeId: esId || null, approved, createdBy: s.currentUserId, createdAt: new Date().toISOString(),
    };
    s.upsertCommitment(c);
    onAdded?.(c);
    setTitle(""); setEsId(""); setShowKpi(false);
    input.current?.focus();
  };

  const field = dark ? "rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-mint/40" : "input";
  const opt = dark ? "text-ink" : undefined;

  return (
    <div className={clsx("rounded-2xl p-3", dark ? "bg-white/5 ring-1 ring-white/10" : "bg-canvas ring-1 ring-slate-100")}>
      <div className="mb-2 flex items-center gap-1">
        {(["commitment", "support"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)}
            className={clsx("rounded-full px-3 py-1 text-xs font-medium transition",
              kind === k ? (dark ? "bg-white text-ink" : "bg-ink text-white") : dark ? "text-white/60 hover:bg-white/10" : "text-slate-500 hover:bg-white")}>
            {k === "commitment" ? "Compromiso" : "Solicitud de apoyo"}
          </button>
        ))}
        <span className={clsx("ml-auto hidden text-[11px] sm:block", dark ? "text-white/40" : "text-slate-400")}>Enter para agregar</span>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); add(); }} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input ref={input} autoFocus={autoFocus} value={title} onChange={(e) => setTitle(e.target.value)} className={field}
          placeholder={kind === "commitment" ? "¿Qué se compromete a hacer? (algo verificable)" : "¿Qué apoyo necesita?"} aria-label="Descripción" />
        {kind === "support" ? (
          <div className="flex items-center gap-1">
            <select value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} className={clsx(field, "!w-auto")} aria-label="Quién lo pide" title="Quién lo pide">
              {people.map((u) => <option className={opt} key={u.id} value={u.id}>{u.name.split(" ")[0]}</option>)}
            </select>
            <span className={clsx("text-xs", dark ? "text-white/50" : "text-slate-400")}>pide a</span>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={clsx(field, "!w-auto")} aria-label="A quién se le pide">
              {s.users.map((u) => <option className={opt} key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        ) : (
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={clsx(field, "!w-auto")} aria-label="Responsable">
            {people.map((u) => <option className={opt} key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={clsx(field, "!w-auto", dark && "[color-scheme:dark]")} aria-label="Fecha compromiso" />
        <button type="submit" className={clsx("inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold transition", dark ? "bg-mint text-white hover:bg-mint-light" : "bg-indigo text-white hover:bg-indigo-light")}>
          <Plus size={15} /> Agregar
        </button>
      </form>
      <div className="mt-2">
        {!showKpi ? (
          kpis.length > 0 && <button type="button" onClick={() => setShowKpi(true)} className={clsx("inline-flex items-center gap-1 text-xs", dark ? "text-white/50 hover:text-white" : "text-slate-400 hover:text-indigo")}><Target size={12} /> Ligar a un indicador (opcional)</button>
        ) : (
          <select value={esId} onChange={(e) => setEsId(e.target.value)} className={clsx(field, "!w-auto !py-1 text-xs")} aria-label="Indicador relacionado">
            <option className={opt} value="">Sin indicador</option>
            {kpis.map((es) => <option className={opt} key={es.id} value={es.id}>{s.elementOf(es.elementId).name} · {s.scopeOf(es.scopeId).name}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

export function Pct({ value, className }: { value: number | null; className?: string }) {
  return (
    <span className={clsx(value === null ? "text-slate-400" : value >= 85 ? "text-sob" : value >= 70 ? "text-amber" : "text-coral", className)}>
      {value === null ? "—" : `${value}%`}
    </span>
  );
}

export const SESSION_STATUS_UI: Record<"scheduled" | "live" | "review" | "closed", { label: string; tone: string }> = {
  scheduled: { label: "Agendada", tone: "bg-slate-100 text-slate-600" },
  live: { label: "En curso", tone: "bg-mint-soft text-sob" },
  review: { label: "Por aprobar", tone: "bg-amber-soft text-amber" },
  closed: { label: "Cerrada", tone: "bg-indigo-soft text-indigo" },
};
