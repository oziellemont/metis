"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { FileSpreadsheet, Plus, KeyRound, Copy, RefreshCw, RotateCw, X, Mail, Send, Ban, Check, Link2, Loader2, AlertTriangle } from "lucide-react";
import { useMetis } from "@/lib/store";
import { Avatar, PageHeader } from "@/components/ui/primitives";
import type { Invitation, User } from "@/lib/domain/types";
import { useAcademy } from "@/components/academy/AcademyProvider";
import { sendInvitationEmail, type SendState } from "@/lib/invitations/send-client";
import { ImportOrgDialog } from "@/components/org/ImportOrgDialog";

const ROLE: Record<string, string> = { admin: "Administrador", manager: "Jefe", collaborator: "Colaborador" };
const INV_STATUS: Record<Invitation["status"], { label: string; tone: string }> = {
  pending: { label: "Pendiente", tone: "bg-amber-soft text-amber" },
  accepted: { label: "Aceptada", tone: "bg-mint-soft text-sob" },
  revoked: { label: "Revocada", tone: "bg-slate-100 text-slate-500" },
};

export default function Usuarios() {
  const s = useMetis();
  const academy = useAcademy();
  const [inviting, setInviting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showAllInv, setShowAllInv] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [resend, setResend] = useState<Record<string, SendState>>({});
  const doResend = async (id: string) => {
    setResend((r) => ({ ...r, [id]: { state: "sending" } }));
    const res = await sendInvitationEmail(id);
    setResend((r) => ({ ...r, [id]: res }));
  };
  const code = s.tenant.joinCode ?? "—";
  const isAdmin = s.userOf(s.currentUserId).role === "admin";
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/unirme` : "/unirme";
  const copy = (what: "code" | "link") => { navigator.clipboard?.writeText(what === "code" ? code : `${joinUrl}?code=${code}`); setCopied(what); setTimeout(() => setCopied(null), 1500); };

  return (
    <>
      <PageHeader title="Usuarios y roles" subtitle="Jerarquía jefe–colaborador. Si alguien cambia de jefe, sus aprobaciones y sesiones se actualizan solas."
        actions={<>{isAdmin && <button className="btn-ghost" onClick={() => setImporting(true)}><FileSpreadsheet size={14} /> Importar organigrama</button>}<button className="btn-primary" onClick={() => setInviting(true)}><Plus size={14} /> Invitar usuario</button></>} />

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <div className="lg:col-span-2 card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-soft text-indigo flex items-center justify-center shrink-0"><KeyRound size={22} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500">Código de empresa</div>
            <div className="font-mono text-2xl font-semibold tracking-widest">{code}</div>
            <p className="text-xs text-slate-500 mt-1">Compártelo con tu equipo: inician sesión con su correo en <span className="font-medium text-ink">{joinUrl}</span>, capturan el código y quedan dentro del espacio de {s.tenant.name}. Si lo regeneras, el anterior deja de servir (los que ya entraron no se afectan).</p>
          </div>
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button className="btn-ghost !py-1.5" onClick={() => copy("code")}>{copied === "code" ? <Check size={14} /> : <Copy size={14} />} Copiar código</button>
            <button className="btn-ghost !py-1.5" onClick={() => copy("link")}>{copied === "link" ? <Check size={14} /> : <Link2 size={14} />} Copiar enlace</button>
            <button className="btn-ghost !py-1.5 text-slate-500" onClick={() => { if (confirm("¿Regenerar el código? El actual dejará de funcionar.")) s.regenerateJoinCode(); }}><RefreshCw size={14} /> Regenerar</button>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold mb-1 flex items-center gap-2"><Mail size={16} className="text-indigo" /> Invitaciones</h3>
          {s.invitations.length === 0 ? <p className="text-xs text-slate-500">Aún no has invitado a nadie por correo.</p> : (
            <ul className="divide-y divide-slate-100 -mx-1 max-h-[22rem] overflow-y-auto">
              {s.invitations.filter((i) => i.status === "pending").concat(s.invitations.filter((i) => i.status !== "pending")).slice(0, showAllInv ? 500 : 12).map((i) => (
                <li key={i.id} className="flex items-center gap-2 py-2 px-1 text-sm">
                  <div className="min-w-0 flex-1"><div className="truncate font-medium text-xs">{i.name ?? i.email}</div><div className="text-[11px] text-slate-400 truncate">{i.name ? `${i.email} · ` : ""}{i.title ?? ROLE[i.role]} · {new Date(i.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</div></div>
                  <span className={clsx("chip", INV_STATUS[i.status].tone)}>{INV_STATUS[i.status].label}</span>
                  {i.status === "pending" && s.mode === "supabase" && (
                    <button className="p-1 text-slate-300 hover:text-indigo disabled:opacity-50" title={resend[i.id]?.msg ?? "Reenviar correo"} disabled={resend[i.id]?.state === "sending"} onClick={() => doResend(i.id)}>
                      {resend[i.id]?.state === "sent" ? <Check size={13} className="text-sob" /> : <RotateCw size={13} className={resend[i.id]?.state === "sending" ? "animate-spin" : ""} />}
                    </button>
                  )}
                  {i.status === "pending" && <button className="p-1 text-slate-300 hover:text-coral" title="Revocar" onClick={() => s.revokeInvitation(i.id)}><Ban size={13} /></button>}
                </li>
              ))}
            </ul>
          )}
          {s.invitations.length > 12 && <button className="mt-1 text-xs font-medium text-indigo" onClick={() => setShowAllInv((v) => !v)}>{showAllInv ? "Ver menos" : `Ver las ${s.invitations.length} invitaciones (${s.invitations.filter((i) => i.status === "pending").length} pendientes)`}</button>}
          {Object.values(resend).filter((r) => r.state === "error" || r.state === "manual").slice(-1).map((r, k) => <p key={k} className="mt-2 text-[11px] text-coral">{r.msg}</p>)}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="border-b border-slate-100"><tr><th className="th">Usuario</th><th className="th">Área</th><th className="th">Reporta a</th><th className="th">Rol</th><th className="th">Academy</th><th className="th text-right">Reportes directos</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {s.users.map((u) => {
              const m = s.users.find((x) => x.id === u.managerId);
              return (
                <tr key={u.id}>
                  <td className="td"><div className="flex items-center gap-3"><Avatar initials={u.initials} /><div><div className="font-medium">{u.name}</div><div className="text-xs text-slate-400">{u.title}{u.email && <> · {u.email}</>}</div></div></div></td>
                  <td className="td text-slate-600"><div>{u.area ?? u.teamName ?? <span className="text-slate-300">—</span>}</div>{u.employeeNumber && <div className="text-[11px] text-slate-400">#{u.employeeNumber}</div>}</td>
                  <td className="td text-slate-600">
                    {isAdmin ? (
                      <select className="input !py-1 !text-xs max-w-[12rem]" value={u.managerId ?? ""} onChange={(e) => s.updateMember(u.id, { managerId: e.target.value || null })} aria-label={`Jefe de ${u.name}`}>
                        <option value="">— Nadie (máximo nivel)</option>
                        {s.users.filter((x) => x.id !== u.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                      </select>
                    ) : (m?.name ?? <span className="text-slate-400">—</span>)}
                    {!u.managerId && u.pendingManagerEmail && <div className="mt-1 text-[11px] text-amber" title="Viene del organigrama: se liga solo cuando su jefe entre a METIS">Esperando a {u.pendingManagerEmail}</div>}
                  </td>
                  <td className="td">
                    {isAdmin && u.id !== s.currentUserId && u.dbRole !== "owner" ? (
                      <select className="input !py-1 !text-xs !w-auto" value={u.role} onChange={(e) => s.updateMember(u.id, { role: e.target.value as User["role"] })} aria-label={`Rol de ${u.name}`}>
                        <option value="collaborator">Colaborador</option><option value="manager">Jefe</option><option value="admin">Administrador</option>
                      </select>
                    ) : <span className="chip bg-slate-100 text-slate-600">{u.dbRole === "owner" ? "Dueño" : ROLE[u.role]}</span>}
                  </td>
                  <td className="td">{(() => {
                    const n = u.id === s.currentUserId ? academy.done : (academy.team[u.id] ?? 0);
                    if (s.mode !== "supabase" && u.id !== s.currentUserId) return <span className="text-xs text-slate-300">—</span>;
                    return n >= academy.total ? <span className="chip bg-mint-soft text-sob">Completa</span> : <span className="chip bg-amber-soft text-amber tabular-nums">{n}/{academy.total}</span>;
                  })()}</td>
                  <td className="td text-right tabular-nums">{s.users.filter((x) => x.managerId === u.id).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {inviting && <InviteDialog onClose={() => setInviting(false)} />}
      {importing && <ImportOrgDialog onClose={() => setImporting(false)} />}
    </>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const s = useMetis();
  const me = s.userOf(s.currentUserId);
  const [f, setF] = useState<{ email: string; role: User["role"]; managerId: string; title: string }>({ email: "", role: "collaborator", managerId: me.id, title: "" });
  const [done, setDone] = useState<Invitation | null>(null);
  const [mail, setMail] = useState<SendState | null>(null);
  useEffect(() => {
    if (!done || s.mode !== "supabase") return;
    let alive = true;
    setMail({ state: "sending" });
    // pequeña espera para que la invitación termine de guardarse
    const t = setTimeout(() => { sendInvitationEmail(done.id).then((r) => { if (alive) setMail(r); }); }, 600);
    return () => { alive = false; clearTimeout(t); };
  }, [done, s.mode]);
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email);
  const link = typeof window !== "undefined" && done ? `${window.location.origin}/login?inv=${done.token ?? done.id}` : "";
  return (
    <div className="fixed inset-0 z-30 bg-ink/30 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Invitar usuario</h3><button onClick={onClose} className="text-slate-400 hover:text-ink"><X size={18} /></button></div>
        {done ? (
          <div>
            <div className={clsx("rounded-xl p-4 text-sm", mail?.state === "error" || mail?.state === "manual" ? "bg-amber-soft" : "bg-mint-soft")}>
              <div className={clsx("font-medium flex items-center gap-2", mail?.state === "error" || mail?.state === "manual" ? "text-amber" : "text-sob")}>
                {mail?.state === "sending" ? <><Loader2 size={14} className="animate-spin" /> Enviando correo a {done.email}…</>
                  : mail?.state === "sent" ? <><Send size={14} /> Correo enviado a {done.email}</>
                  : mail?.state === "error" || mail?.state === "manual" ? <><AlertTriangle size={14} /> Invitación guardada, pero el correo no salió</>
                  : <><Send size={14} /> Invitación lista para {done.email}</>}
              </div>
              <p className="text-slate-600 text-xs mt-1">{mail?.state === "error" || mail?.state === "manual" ? `${mail.msg} ` : ""}Al abrir el enlace e iniciar sesión con ese correo, entra directo al espacio de {s.tenant.name} con {done.title || ROLE[done.role]} como cargo.</p>
              {mail?.state === "error" && <button className="mt-2 text-xs font-medium text-indigo inline-flex items-center gap-1" onClick={() => { setMail({ state: "sending" }); sendInvitationEmail(done.id).then(setMail); }}><RotateCw size={12} /> Reintentar envío</button>}
            </div>
            <label className="label mt-4">{mail?.state === "sent" ? "Por si no le llega: también puedes mandarle este enlace por WhatsApp" : "Enlace de la invitación · mándaselo por correo o WhatsApp"}</label>
            <div className="flex gap-2"><input className="input font-mono text-xs" readOnly value={link} /><button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(link)}><Copy size={14} /></button></div>
            <div className="mt-5 flex justify-end"><button className="btn-primary" onClick={onClose}>Listo</button></div>
          </div>
        ) : (
          <>
            <div><label className="label">Correo de trabajo</label><input type="email" className="input" placeholder="nombre@empresa.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoFocus /></div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><label className="label">Rol</label><select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as User["role"] })}><option value="collaborator">Colaborador</option><option value="manager">Jefe</option><option value="admin">Administrador</option></select></div>
              <div><label className="label">Reporta a</label><select className="input" value={f.managerId} onChange={(e) => setF({ ...f, managerId: e.target.value })}>{s.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
            </div>
            <div className="mt-3"><label className="label">Cargo (opcional)</label><input className="input" placeholder="Gerente de Ventas · Región Norte" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <p className="mt-3 text-[11px] text-slate-400">Recibe un correo con un enlace. Si inicia sesión con ese mismo correo, la invitación se aplica sola; también puede entrar con el código de empresa.</p>
            <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={!valid} onClick={() => setDone(s.invite({ email: f.email.trim(), role: f.role, managerId: f.managerId, title: f.title.trim() || undefined }))}><Send size={14} /> Enviar invitación</button></div>
          </>
        )}
      </div>
    </div>
  );
}
