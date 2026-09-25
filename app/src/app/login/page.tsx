"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { hasSupabase, signInWithEmail, signInWithGoogle } from "@/lib/auth";

export default function LoginPage() {
  return <Suspense><Login /></Suspense>;
}

function Login() {
  const router = useRouter();
  const sp = useSearchParams();
  const inv = sp.get("inv");
  const next = inv ? `/unirme?inv=${inv}` : sp.get("next") ?? "/unirme";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setState("sending");
    const r = await signInWithEmail(email, next);
    if (!r.ok) { setErr(r.error ?? "No se pudo enviar el enlace."); setState("error"); return; }
    if (r.mode === "demo") { router.push(next); return; }
    setState("sent");
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white p-12">
        <Link href="/"><Logo className="text-3xl" light /></Link>
        <div>
          <h2 className="text-3xl font-semibold leading-tight max-w-md">Tu perfil, dentro del círculo de tu empresa.</h2>
          <p className="mt-4 text-white/70 max-w-md">Inicias sesión con tu correo. Con el código de tu empresa o una invitación, entras a su espacio: tus objetivos, tu scorecard, tu equipo. Nada más, nada menos.</p>
          <ul className="mt-8 space-y-2 text-sm text-white/80">
            {["Sin contraseñas: te llega un enlace a tu correo", "Un mismo correo puede pertenecer a varias empresas", "Tus datos sólo los ve tu empresa"].map((t) => <li key={t} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-mint" /> {t}</li>)}
          </ul>
        </div>
        <p className="text-xs text-white/50">© 2026 METIS · Monterrey, N.L.</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden inline-block mb-8"><Logo className="text-2xl" /></Link>
          <h1 className="text-2xl font-semibold">Entrar a METIS</h1>
          <p className="text-sm text-slate-500 mt-1">{inv ? "Tienes una invitación. Inicia sesión con el correo al que llegó." : "Usa tu correo de trabajo."}</p>

          {state === "sent" ? (
            <div className="mt-6 rounded-2xl bg-mint-soft p-5 text-sm">
              <div className="flex items-center gap-2 font-medium text-sob"><Mail size={16} /> Revisa tu correo</div>
              <p className="mt-1 text-slate-600">Te enviamos un enlace a <strong>{email}</strong>. Al abrirlo entras directo{inv ? " y aceptas tu invitación" : ""}.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <div><label className="label">Correo de trabajo</label><input required type="email" className="input" placeholder="tu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              {state === "error" && <p className="text-xs text-coral">{err}</p>}
              <button className="btn-primary w-full justify-center" disabled={state === "sending"}>{state === "sending" ? "Enviando…" : hasSupabase ? "Enviarme el enlace" : "Continuar"} <ArrowRight size={14} /></button>
              <button type="button" onClick={() => signInWithGoogle(next).then((r) => { if (r.mode === "demo") router.push(next); })} className="btn-ghost w-full justify-center">
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
                Continuar con Google
              </button>
              {!hasSupabase && <p className="text-[11px] text-slate-400 text-center">Modo demo: no se envía correo, entras directo.</p>}
            </form>
          )}
          <p className="mt-8 text-xs text-slate-400">¿Tu empresa aún no usa METIS? <Link href="/#precios" className="text-indigo hover:underline">Conoce los planes</Link> o <Link href="/indice" className="text-indigo hover:underline">mide tu alineación gratis</Link>.</p>
        </div>
      </section>
    </main>
  );
}
