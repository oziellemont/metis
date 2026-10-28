"use client";
/**
 * Pantalla de entrada de mêtis CEO (metis.ceo/entrar). Propia, separada de la de mêtis Align.
 * Pestañas: «Entrar» y «Crear cuenta». Google o correo con contraseña. Recuperar contraseña.
 */
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import clsx from "clsx";
import { Logo } from "@/components/ui/Logo";
import { ceoDefaultMode, ceoSafeNext, CEO_FIRST_DAY, isValidEmail, passwordProblem, ceoAuthMessage } from "@/lib/ceo/auth-routes";
import { ceoProviders, ceoSendPasswordReset, ceoSignInWithGoogle, ceoSignInWithPassword, ceoSignUp, ceoUpdatePassword } from "@/lib/ceo/auth-client";

type Mode = "entrar" | "crear" | "olvide";
type Sent = null | { kind: "confirmar" | "recuperar"; email: string };

export function CeoAuth() {
  return <Suspense><AuthScreen /></Suspense>;
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="mx-auto w-full max-w-md px-5 h-16 flex items-center">
        <Link href="/" aria-label="MÊTIS CEO, inicio" className="flex items-center gap-2 rounded"><Logo height={26} priority /><span className="chip bg-ink text-white text-[10px] tracking-wider">CEO</span></Link>
      </header>
      <main id="contenido" className="flex-1 mx-auto w-full max-w-md px-5 pb-16 pt-6 sm:pt-12">{children}</main>
      <footer className="mx-auto w-full max-w-md px-5 pb-8 text-[12px] text-slate-400 flex gap-4">
        <Link href="/legal/privacidad" className="hover:text-ink">Aviso de privacidad</Link>
        <Link href="/legal/terminos" className="hover:text-ink">Términos</Link>
      </footer>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} required type={show ? "text" : "password"} autoComplete={autoComplete} className="input !py-2.5 pr-11" value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-lg text-slate-400 hover:text-ink">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && <p className="mt-1 text-[12px] text-slate-400">{hint}</p>}
    </div>
  );
}

function AuthScreen() {
  const router = useRouter();
  const sp = useSearchParams();
  const rawNext = sp.get("next");
  const [mode, setMode] = useState<Mode>(() => ceoDefaultMode(rawNext, sp.get("modo")));
  const next = ceoSafeNext(rawNext, mode === "crear" ? CEO_FIRST_DAY : undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "google" | "form">(null);
  const [err, setErr] = useState(() => (sp.get("error") ? ceoAuthMessage(sp.get("error")) : ""));
  const [sent, setSent] = useState<Sent>(null);
  const [google, setGoogle] = useState(false);
  useEffect(() => { let on = true; ceoProviders().then((p) => on && setGoogle(p.google)); return () => { on = false; }; }, []);

  useEffect(() => { setErr((e) => (sp.get("error") && e ? e : "")); }, [mode, sp]);

  const withGoogle = async () => {
    setBusy("google"); setErr("");
    const r = await ceoSignInWithGoogle(next);
    if (!r.ok) { setErr(r.error); setBusy(null); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!isValidEmail(email)) { setErr("Escribe un correo válido."); return; }
    if (mode === "olvide") {
      setBusy("form");
      const r = await ceoSendPasswordReset(email);
      setBusy(null);
      if (!r.ok) { setErr(r.error); return; }
      setSent({ kind: "recuperar", email: email.trim() }); return;
    }
    if (mode === "crear") {
      if (!name.trim()) { setErr("Escribe tu nombre."); return; }
      const p = passwordProblem(password);
      if (p) { setErr(p); return; }
    }
    setBusy("form");
    const r = mode === "crear" ? await ceoSignUp(name, email, password, next) : await ceoSignInWithPassword(email, password);
    if (!r.ok) { setErr(r.error); setBusy(null); return; }
    if (!r.session) { setSent({ kind: "confirmar", email: email.trim() }); setBusy(null); return; }
    router.replace(next);
    router.refresh();
  };

  if (sent) {
    return (
      <Frame>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Revisa tu correo</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
          {sent.kind === "confirmar"
            ? <>Te enviamos un enlace a <b className="text-ink">{sent.email}</b> para confirmar tu cuenta. Al abrirlo entras directo a tu primer día.</>
            : <>Si existe una cuenta con <b className="text-ink">{sent.email}</b>, te llegará un enlace para crear una contraseña nueva.</>}
        </p>
        <p className="mt-3 text-[13px] text-slate-500">Si no lo ves en unos minutos, busca en correo no deseado. Ábrelo en este mismo dispositivo.</p>
        <button type="button" onClick={() => { setSent(null); setMode("entrar"); setPassword(""); }} className="mt-8 inline-flex items-center gap-1.5 text-sm text-indigo hover:underline"><ArrowLeft size={15} /> Volver a entrar</button>
      </Frame>
    );
  }

  const titles: Record<Mode, { h: string; p: string }> = {
    entrar: { h: "Entra a tu carrera", p: "Tu empresa, tu equipo y tus decisiones te esperan donde los dejaste." },
    crear: { h: "Crea tu cuenta", p: "Tu avance queda guardado y lo sigues en cualquier dispositivo." },
    olvide: { h: "Recupera tu contraseña", p: "Escribe tu correo y te enviamos un enlace para crear una nueva." },
  };

  return (
    <Frame>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{titles[mode].h}</h1>
      <p className="mt-2 text-[15px] text-slate-500">{titles[mode].p}</p>

      {mode !== "olvide" && (
        <>
          <div role="tablist" aria-label="Tipo de acceso" className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm">
            {(["entrar", "crear"] as const).map((m) => (
              <button key={m} role="tab" type="button" aria-selected={mode === m} onClick={() => setMode(m)}
                className={clsx("rounded-lg py-2 font-medium transition-colors", mode === m ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink")}>
                {m === "entrar" ? "Entrar" : "Crear cuenta"}
              </button>
            ))}
          </div>
          {google ? (
            <>
              <button type="button" onClick={withGoogle} disabled={busy !== null} className="btn mt-5 w-full justify-center border border-slate-200 bg-white text-ink hover:bg-slate-50 !py-2.5">
                <GoogleMark /> {busy === "google" ? "Conectando…" : "Continuar con Google"}
              </button>
              <div className="my-5 flex items-center gap-3 text-[12px] text-slate-400"><span className="h-px flex-1 bg-slate-200" />o con tu correo<span className="h-px flex-1 bg-slate-200" /></div>
            </>
          ) : <div className="h-5" />}
        </>
      )}

      <form onSubmit={submit} noValidate className={clsx("space-y-3", mode === "olvide" && "mt-7")}>
        {mode === "crear" && (
          <div><label htmlFor="nombre" className="label">Nombre</label><input id="nombre" required autoComplete="name" className="input !py-2.5" value={name} onChange={(e) => setName(e.target.value)} /></div>
        )}
        <div><label htmlFor="correo" className="label">Correo</label><input id="correo" required type="email" inputMode="email" autoComplete="email" className="input !py-2.5" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {mode !== "olvide" && (
          <PasswordField id="clave" label="Contraseña" value={password} onChange={setPassword}
            autoComplete={mode === "crear" ? "new-password" : "current-password"}
            hint={mode === "crear" ? "Al menos 8 caracteres, con letras y números." : undefined} />
        )}
        {mode === "entrar" && (
          <div className="text-right"><button type="button" onClick={() => setMode("olvide")} className="text-[13px] text-indigo hover:underline">Olvidé mi contraseña</button></div>
        )}
        {err && <p role="alert" className="text-[13px] text-coral">{err}</p>}
        <button type="submit" disabled={busy !== null} className="btn-primary w-full justify-center !py-2.5">
          {busy === "form" ? "Un momento…" : mode === "entrar" ? "Entrar" : mode === "crear" ? "Crear cuenta" : "Enviarme el enlace"}
        </button>
      </form>

      {mode === "olvide" ? (
        <button type="button" onClick={() => setMode("entrar")} className="mt-6 inline-flex items-center gap-1.5 text-sm text-indigo hover:underline"><ArrowLeft size={15} /> Volver a entrar</button>
      ) : mode === "crear" ? (
        <p className="mt-6 text-[12px] leading-relaxed text-slate-400">Al crear tu cuenta aceptas los <Link href="/legal/terminos" className="underline">Términos</Link> y el <Link href="/legal/privacidad" className="underline">Aviso de privacidad</Link>.</p>
      ) : (
        <p className="mt-6 text-[13px] text-slate-500">¿Solo quieres probar? <Link href="/#decision" className="text-indigo hover:underline">Toma una decisión sin registrarte</Link>.</p>
      )}
    </Frame>
  );
}

/** metis.ceo/entrar/nueva-clave: llega desde el correo de recuperación (ya con sesión temporal). */
export function CeoNewPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = passwordProblem(password);
    if (p) { setErr(p); return; }
    setBusy(true); setErr("");
    const r = await ceoUpdatePassword(password);
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    router.replace("/ceo");
    router.refresh();
  };
  return (
    <Frame>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Crea tu contraseña nueva</h1>
      <p className="mt-2 text-[15px] text-slate-500">La usarás la próxima vez que entres con tu correo.</p>
      <form onSubmit={submit} noValidate className="mt-7 space-y-3">
        <PasswordField id="nueva" label="Contraseña nueva" value={password} onChange={setPassword} autoComplete="new-password" hint="Al menos 8 caracteres, con letras y números." />
        {err && <p role="alert" className="text-[13px] text-coral">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center !py-2.5">{busy ? "Guardando…" : "Guardar y entrar"}</button>
      </form>
    </Frame>
  );
}
