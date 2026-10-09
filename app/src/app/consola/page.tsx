"use client";
/**
 * Consola METIS · sólo para el equipo METIS (tabla metis.platform_admins).
 * Da de alta clientes (cada uno es un portal aislado), muestra su código de acceso y permite entrar a su portal.
 * La consola sólo ve conteos; los datos de cada cliente siguen protegidos por RLS.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Copy, Check, LogIn, Plus, Shield, Users, ClipboardList, ArrowLeft, Link2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Logo } from "@/components/ui/Logo";
import { supabaseBrowser, hasSupabase } from "@/lib/supabase/client";
import { rememberActiveTenant } from "@/lib/auth";

interface Client { id: string; name: string; slug: string; plan: string; status: string; join_code: string | null; created_at: string; members: number; scorecards: number; i_am_member: boolean }
interface Created { tenant_id: string; join_code: string; invitation_token: string | null; name: string; ownerEmail: string; mail?: { state: "sending" | "sent" | "error"; msg?: string } }

const PLANS = [{ id: "arranca", label: "Arranca" }, { id: "crece", label: "Crece" }, { id: "escala", label: "Escala" }];

export default function Consola() {
  const sb = supabaseBrowser();
  const [state, setState] = useState<"loading" | "forbidden" | "ready" | "nodb">(hasSupabase ? "loading" : "nodb");
  const [clients, setClients] = useState<Client[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", plan: "crece", ownerEmail: "", addMe: true });
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState("");
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState("");

  const load = useCallback(async () => {
    if (!sb) return;
    const r = await sb.schema("metis").rpc("platform_tenants");
    if (r.error) { setState(/forbidden|42501/i.test(r.error.message) ? "forbidden" : "ready"); if (!/forbidden|42501/i.test(r.error.message)) setErr(r.error.message); return; }
    setClients((r.data ?? []) as Client[]);
    setState("ready");
  }, [sb]);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => { if (!data.user) window.location.href = "/login?next=/consola"; else load(); });
  }, [sb, load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    setBusy(true); setErr("");
    const r = await sb.schema("metis").rpc("create_tenant", {
      p_name: f.name.trim(), p_plan: f.plan, p_owner_email: f.ownerEmail.trim() || null, p_add_me: f.addMe,
    });
    setBusy(false);
    if (r.error) { setErr(r.error.message); return; }
    const row = (Array.isArray(r.data) ? r.data[0] : r.data) as { tenant_id: string; join_code: string; invitation_token: string | null };
    const base: Created = { ...row, name: f.name.trim(), ownerEmail: f.ownerEmail.trim() };
    setCreated(row.invitation_token ? { ...base, mail: { state: "sending" } } : base);
    if (row.invitation_token) {
      fetch("/api/invitaciones/enviar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: row.invitation_token }) })
        .then((x) => x.json()).catch(() => ({ ok: false, error: "No se pudo enviar el correo." }))
        .then((j) => setCreated((c) => c && c.tenant_id === row.tenant_id ? { ...c, mail: j.ok ? { state: "sent", msg: `Correo enviado a ${j.to}` } : { state: "error", msg: j.error } } : c));
    }
    setF({ name: "", plan: "crece", ownerEmail: "", addMe: true });
    load();
  };

  const enter = async (c: Client) => {
    if (!sb) return;
    if (!c.i_am_member) {
      const r = await sb.schema("metis").rpc("platform_join_tenant", { p_tenant: c.id });
      if (r.error) { setErr(r.error.message); return; }
    }
    rememberActiveTenant(c.id);
    window.location.href = "/inicio";
  };

  const remove = async () => {
    if (!sb || !toDelete) return;
    setDelBusy(true); setDelErr("");
    const r = await sb.schema("metis").rpc("delete_tenant", { p_tenant: toDelete.id, p_confirm: toDelete.name });
    setDelBusy(false);
    if (r.error) {
      const m = r.error.message;
      setDelErr(/function .*delete_tenant|could not find|PGRST202/i.test(m) ? "Falta correr el PASO-7 en Supabase." : /forbidden|42501/.test(m) ? "No tienes permiso para borrar clientes." : m);
      return;
    }
    if (typeof window !== "undefined" && localStorage.getItem("metis-active-tenant") === toDelete.id) localStorage.removeItem("metis-active-tenant");
    if (created?.tenant_id === toDelete.id) setCreated(null);
    setClients((cs) => cs.filter((c) => c.id !== toDelete.id));
    setToDelete(null);
    load();
  };

  const copy = (key: string, text: string) => { navigator.clipboard?.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); };
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main className="min-h-screen bg-bg">
      <header className="border-b border-slate-100 bg-white px-6 py-4 flex items-center gap-4">
        <Logo height={28} priority />
        <span className="chip bg-indigo-soft text-indigo"><Shield size={12} /> Consola METIS</span>
        <Link href="/inicio" className="ml-auto btn-ghost !py-1.5"><ArrowLeft size={14} /> Volver al portal</Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {state === "nodb" && <div className="card p-6 text-sm text-slate-500">La consola necesita Supabase configurado.</div>}
        {state === "loading" && <div className="text-sm text-slate-500">Cargando clientes…</div>}
        {state === "forbidden" && (
          <div className="card p-8 text-center">
            <div className="text-lg font-semibold">Esta sección es sólo para el equipo METIS</div>
            <p className="text-sm text-slate-500 mt-2">Tu usuario no está dado de alta como administrador de la plataforma.</p>
          </div>
        )}
        {state === "ready" && (
          <>
            <h1 className="text-2xl font-semibold">Clientes</h1>
            <p className="text-sm text-slate-500 mt-1">Cada cliente es un portal independiente: sus datos sólo los ven las personas de esa empresa.</p>
            {err && <div className="mt-4 rounded-xl bg-coral/10 text-coral text-sm px-4 py-2">{err}</div>}

            <div className="grid gap-4 lg:grid-cols-3 mt-6">
              <form onSubmit={create} className="card p-5 h-fit">
                <h2 className="font-semibold flex items-center gap-2"><Plus size={16} className="text-indigo" /> Dar de alta un cliente</h2>
                <label className="label mt-4">Nombre de la empresa</label>
                <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Aceros del Norte" required />
                <label className="label mt-3">Plan</label>
                <select className="input" value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })}>{PLANS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
                <label className="label mt-3">Correo del responsable del cliente (opcional)</label>
                <input type="email" className="input" value={f.ownerEmail} onChange={(e) => setF({ ...f, ownerEmail: e.target.value })} placeholder="director@cliente.com" />
                <p className="text-[11px] text-slate-400 mt-1">Queda como Dueño del portal. Si ya tiene cuenta entra directo; si no, se le activa al iniciar sesión con ese correo.</p>
                <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.addMe} onChange={(e) => setF({ ...f, addMe: e.target.checked })} /> Agregarme como consultor (administrador)</label>
                <button className="btn-primary w-full justify-center mt-4" disabled={busy || !f.name.trim()}>{busy ? "Creando…" : "Crear portal"}</button>
              </form>

              <div className="lg:col-span-2 space-y-4">
                {created && (
                  <div className="card p-5 border-sob/30 bg-mint-soft/40">
                    <div className="font-semibold text-sob">Portal de {created.name} creado ✓</div>
                    <p className="text-xs text-slate-600 mt-1">Ya tiene tipos de alcance base (Empresa, Región, Unidad de negocio, Planta, Área), unidades de medida y un alcance raíz.</p>
                    <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-xs text-slate-500">Código de empresa</div>
                        <div className="font-mono font-semibold tracking-widest">{created.join_code}</div>
                        <button type="button" className="text-xs text-indigo mt-1 inline-flex items-center gap-1" onClick={() => copy("new-link", `${origin}/unirme?code=${created.join_code}`)}>{copied === "new-link" ? <Check size={12} /> : <Link2 size={12} />} Copiar enlace para el equipo</button>
                      </div>
                      {created.invitation_token && (
                        <div className="rounded-xl bg-white p-3">
                          <div className="text-xs text-slate-500">Invitación para {created.ownerEmail}</div>
                          {created.mail && <div className={`text-xs mt-0.5 ${created.mail.state === "error" ? "text-coral" : created.mail.state === "sent" ? "text-sob" : "text-slate-400"}`}>{created.mail.state === "sending" ? "Enviando correo…" : created.mail.state === "sent" ? `✓ ${created.mail.msg}` : created.mail.msg}</div>}
                          <button type="button" className="text-xs text-indigo mt-1 inline-flex items-center gap-1" onClick={() => copy("new-inv", `${origin}/login?inv=${created.invitation_token}`)}>{copied === "new-inv" ? <Check size={12} /> : <Copy size={12} />} Copiar enlace de invitación</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="card overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="border-b border-slate-100"><tr><th className="th">Cliente</th><th className="th">Plan</th><th className="th">Código</th><th className="th text-right">Personas</th><th className="th text-right">Scorecards</th><th className="th" /></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {clients.length === 0 && <tr><td className="td text-slate-400" colSpan={6}>Aún no hay clientes.</td></tr>}
                      {clients.map((c) => (
                        <tr key={c.id}>
                          <td className="td"><div className="flex items-center gap-2"><Building2 size={14} className="text-slate-400" /><div><div className="font-medium">{c.name}</div><div className="text-[11px] text-slate-400">alta {new Date(c.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</div></div></div></td>
                          <td className="td text-slate-600 capitalize">{c.plan}</td>
                          <td className="td">
                            {c.join_code ? (
                              <button className="font-mono text-xs inline-flex items-center gap-1 hover:text-indigo" onClick={() => copy(c.id, c.join_code!)} title="Copiar código">{c.join_code} {copied === c.id ? <Check size={12} /> : <Copy size={12} />}</button>
                            ) : "—"}
                          </td>
                          <td className="td text-right tabular-nums"><span className="inline-flex items-center gap-1"><Users size={12} className="text-slate-400" />{c.members}</span></td>
                          <td className="td text-right tabular-nums"><span className="inline-flex items-center gap-1"><ClipboardList size={12} className="text-slate-400" />{c.scorecards}</span></td>
                          <td className="td text-right whitespace-nowrap">
                            <button className="btn-ghost !py-1 text-xs" onClick={() => enter(c)}><LogIn size={13} /> {c.i_am_member ? "Abrir portal" : "Entrar como consultor"}</button>
                            <button className="ml-1 inline-grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-coral-soft hover:text-coral" onClick={() => { setDelErr(""); setToDelete(c); }} title={`Borrar ${c.name}`} aria-label={`Borrar ${c.name}`}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        title={`¿Borrar ${toDelete?.name ?? ""}?`}
        message={<>Se borrará su portal con todos sus datos{toDelete && toDelete.members > 0 ? <> y {toDelete.members} persona{toDelete.members > 1 ? "s" : ""} perderá{toDelete.members > 1 ? "n" : ""} el acceso</> : null}. Esta acción no se puede deshacer.<br /><span className="text-slate-400">Escribe el nombre para confirmar.</span></>}
        requireText={toDelete?.name}
        confirmLabel="Borrar"
        busy={delBusy}
        error={delErr}
        onConfirm={remove}
        onCancel={() => { if (!delBusy) setToDelete(null); }}
      />
    </main>
  );
}
