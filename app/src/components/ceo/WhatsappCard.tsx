"use client";
/**
 * WhatsApp real del jugador: número → código → consentimiento (separado) → canal. Revocable en cualquier momento.
 * Solo aparece si el interruptor «whatsapp» está prendido para el jugador. Nunca toca la partida.
 */
import { useCallback, useEffect, useState } from "react";
import { MessageCircle, ShieldCheck } from "lucide-react";
import clsx from "clsx";

type Channel = "email" | "whatsapp" | "ambos";
interface WaState { available: boolean; live?: boolean; phone: string | null; verified: boolean; consent: boolean; channel: Channel; allowlisted: boolean | null }

const ERR: Record<string, string> = {
  numero_invalido: "Revisa el número: incluye lada (por ejemplo +52 81 1234 5678).",
  numero_no_autorizado: "Por ahora WhatsApp está en prueba con un grupo pequeño de números autorizados.",
  espera_un_minuto: "Espera un minuto antes de pedir otro código.",
  no_enviado: "No pudimos mandar el código. Intenta de nuevo en unos minutos.",
  codigo_incorrecto: "El código no coincide.",
  codigo_vencido: "El código venció. Pide uno nuevo.",
  demasiados_intentos: "Demasiados intentos. Pide un código nuevo.",
  sin_codigo: "Primero pide un código.",
  verifica_tu_numero: "Primero verifica tu número.",
  activa_whatsapp_primero: "Primero activa WhatsApp con tu consentimiento.",
};

async function call(body?: Record<string, unknown>) {
  const r = await fetch("/api/ceo/whatsapp", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  return (await r.json().catch(() => ({ ok: false, error: "red" }))) as Record<string, unknown>;
}

export function WhatsappCard() {
  const [s, setS] = useState<WaState | null>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"numero" | "codigo">("numero");
  const [accept, setAccept] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const j = await call();
    if (j.ok) setS(j as unknown as WaState);
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (body: Record<string, unknown>, ok?: () => void) => {
    setBusy(true); setMsg(null);
    const j = await call(body);
    setBusy(false);
    if (!j.ok) { setMsg(ERR[String(j.error)] ?? "Algo falló. Intenta de nuevo."); return; }
    if (typeof j.devCode === "string") setMsg(`Modo prueba: tu código es ${j.devCode}`);
    ok?.();
    await load();
  };

  if (!s?.available) return null;
  const active = s.verified && s.consent;

  return (
    <section className="card p-5 sm:p-6 space-y-4" data-testid="whatsapp-card">
      <h2 className="font-semibold text-ink inline-flex items-center gap-2"><MessageCircle size={16} /> WhatsApp de tu equipo</h2>
      <p className="text-sm text-slate-600">Tu equipo te puede escribir por WhatsApp cuando llega un asunto o está por vencer. Cada mensaje dice quién te escribe, su puesto y que es la simulación MÊTIS, con un enlace directo al asunto. Solo en tu horario; nada en vacaciones ni en días tranquilos.</p>

      {!s.verified && (
        <div className="space-y-3">
          {step === "numero" ? (
            <div className="flex flex-wrap gap-2 items-end">
              <label className="text-sm text-slate-600 grow">Tu número<input type="tel" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="+52 81 1234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
              <button className="btn-primary" disabled={busy || !phone} onClick={() => run({ action: "codigo", phone }, () => setStep("codigo"))}>Mandarme un código</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 items-end">
              <label className="text-sm text-slate-600 grow">Código de 6 dígitos que te llegó por WhatsApp<input inputMode="numeric" maxLength={6} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm tracking-widest" value={code} onChange={(e) => setCode(e.target.value)} /></label>
              <button className="btn-primary" disabled={busy || code.length < 6} onClick={() => run({ action: "verificar", code }, () => setCode(""))}>Verificar</button>
              <button className="text-sm text-slate-500 underline" onClick={() => setStep("numero")}>Cambiar número</button>
            </div>
          )}
        </div>
      )}

      {s.verified && !s.consent && (
        <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
          <div className="text-sm text-ink inline-flex items-center gap-2"><ShieldCheck size={14} /> Número verificado: {s.phone}</div>
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="accent-indigo h-4 w-4 mt-0.5" />
            <span>Acepto recibir por WhatsApp los mensajes de mi equipo en la simulación MÊTIS (asuntos nuevos y recordatorios, en mi horario). Puedo darme de baja cuando quiera aquí o respondiendo BAJA.</span>
          </label>
          <button className="btn-primary" disabled={busy || !accept} onClick={() => run({ action: "consentir" }, () => setAccept(false))}>Activar WhatsApp</button>
        </div>
      )}

      {active && (
        <div className="space-y-3">
          <div className="text-sm text-ink inline-flex items-center gap-2"><ShieldCheck size={14} /> Activo en {s.phone}</div>
          <div className="text-sm text-slate-600">¿Por dónde te avisamos?</div>
          <div className="flex flex-wrap gap-2">
            {(["email", "whatsapp", "ambos"] as Channel[]).map((ch) => (
              <button key={ch} disabled={busy} onClick={() => run({ action: "canal", channel: ch })}
                className={clsx("rounded-xl border px-3 py-2 text-sm", s.channel === ch ? "border-indigo bg-indigo-soft/60 text-ink" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                {ch === "email" ? "Solo correo" : ch === "whatsapp" ? "Solo WhatsApp" : "Correo y WhatsApp"}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">Con «Solo WhatsApp», el resumen de la mañana y el cierre del mes siguen llegando por correo.</p>
          <button className="text-sm text-coral underline" disabled={busy} onClick={() => run({ action: "revocar" })}>Dejar de recibir WhatsApp</button>
        </div>
      )}

      {msg && <p className="text-sm text-slate-600" role="status">{msg}</p>}
    </section>
  );
}
