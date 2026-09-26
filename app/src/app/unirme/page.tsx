"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Building2, KeyRound, MailCheck, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { acceptInvitation, getDemoSession, hasSupabase, joinWithCode, myTenant, signOut } from "@/lib/auth";

export default function UnirmePage() {
  return <Suspense><Unirme /></Suspense>;
}

function Unirme() {
  const router = useRouter();
  const sp = useSearchParams();
  const inv = sp.get("inv");
  const [code, setCode] = useState((sp.get("code") ?? "").toUpperCase());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [joined, setJoined] = useState<string | null>(null);
  const [existing, setExisting] = useState<{ id: string; name: string } | null | undefined>(undefined);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(getDemoSession()?.email ?? "");
    myTenant().then(setExisting);
  }, []);

  // Con invitación: aceptar automáticamente
  useEffect(() => {
    if (!inv) return;
    setBusy(true);
    acceptInvitation(inv).then((r) => { setBusy(false); if (r.ok) setJoined(r.tenantName ?? "tu empresa"); else setErr(r.error ?? "No se pudo aceptar la invitación."); });
  }, [inv]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await joinWithCode(code);
    setBusy(false);
    if (r.ok) setJoined(r.tenantName ?? "tu empresa"); else setErr(r.error ?? "Código inválido.");
  };

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex mb-8"><Logo height={30} priority /></Link>

        {joined ? (
          <div className="card p-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-mint-soft text-sob flex items-center justify-center"><Building2 size={26} /></div>
            <h1 className="mt-4 text-2xl font-semibold">Ya eres parte de {joined}</h1>
            <p className="mt-2 text-sm text-slate-500">Tu perfil quedó dentro del espacio de la empresa. Desde ahora ves sus objetivos, tu scorecard y tu equipo.</p>
            <button className="btn-primary mt-6 w-full justify-center" onClick={() => router.push("/inicio")}>Ir a mi inicio <ArrowRight size={14} /></button>
          </div>
        ) : (
          <div className="card p-8">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">{email && <><MailCheck size={14} className="text-sob" /> Sesión iniciada como <strong className="text-ink">{email}</strong></>}</div>
            <h1 className="text-2xl font-semibold">Entra al círculo de tu empresa</h1>
            <p className="mt-1 text-sm text-slate-500">Tu administrador te compartió un <strong>código de empresa</strong> o te llegó una <strong>invitación por correo</strong>. Con cualquiera de los dos entras a su espacio.</p>

            {existing && (
              <div className="mt-5 rounded-xl bg-indigo-soft/60 p-4 text-sm flex items-center justify-between gap-3">
                <div><div className="text-xs text-slate-500">Ya perteneces a</div><div className="font-medium">{existing.name}</div></div>
                <button className="btn-primary !py-1.5" onClick={() => router.push("/inicio")}>Entrar <ArrowRight size={14} /></button>
              </div>
            )}

            <form onSubmit={submit} className="mt-6">
              <label className="label">Código de empresa</label>
              <div className="flex gap-2">
                <div className="relative flex-1"><KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9 uppercase tracking-widest font-mono" placeholder="ANDES-2026" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={16} autoFocus /></div>
                <button className="btn-primary" disabled={busy || code.trim().length < 4}>{busy ? "…" : "Unirme"}</button>
              </div>
              {err && <p className="mt-2 text-xs text-coral">{err}</p>}
              {!hasSupabase && <p className="mt-2 text-[11px] text-slate-400">Modo demo · prueba con <button type="button" className="font-mono text-indigo hover:underline" onClick={() => setCode("ANDES-2026")}>ANDES-2026</button></p>}
            </form>

            <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
              <strong className="text-ink">¿Te invitaron por correo?</strong> Abre el enlace del correo: llegas aquí con la invitación ya aplicada y sólo confirmas. Si el correo no te llegó, pide a tu administrador el código o que reenvíe la invitación.
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
              <span>¿Tu empresa aún no está en METIS? <Link href="/#precios" className="text-indigo hover:underline">Ver planes</Link></span>
              <button className="inline-flex items-center gap-1 hover:text-ink" onClick={() => signOut().then(() => router.push("/login"))}><LogOut size={12} /> Salir</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
