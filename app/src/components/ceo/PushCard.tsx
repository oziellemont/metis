"use client";
/**
 * Avisos al celular (Web Push, gratis). Registra /sw.js, pide permiso y guarda la suscripción en el servidor.
 * iPhone: Apple solo permite avisos web si mêtis CEO está agregado a la pantalla de inicio (iOS 16.4 o posterior).
 */
import { useEffect, useState } from "react";
import { BellRing, BellOff, Smartphone } from "lucide-react";

type St = "cargando" | "no_soportado" | "iphone_sin_app" | "sin_llaves" | "bloqueado" | "apagado" | "activo";

const toKey = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export function PushCard() {
  const [st, setSt] = useState<St>("cargando");
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") { if (alive) setSt(ios && !standalone ? "iphone_sin_app" : "no_soportado"); return; }
      const cfg = await fetch("/api/ceo/push").then((r) => r.json()).catch(() => null) as { configured?: boolean; publicKey?: string | null } | null;
      if (!cfg?.configured || !cfg.publicKey) { if (alive) setSt("sin_llaves"); return; }
      setKey(cfg.publicKey);
      if (Notification.permission === "denied") { if (alive) setSt("bloqueado"); return; }
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (alive) setSt(sub ? "activo" : "apagado");
    })().catch(() => alive && setSt("no_soportado"));
    return () => { alive = false; };
  }, []);

  const on = async () => {
    if (!key) return;
    setBusy(true); setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setSt(perm === "denied" ? "bloqueado" : "apagado"); return; }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(key) }));
      const r = await fetch("/api/ceo/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON() }) }).then((x) => x.json()).catch(() => null) as { ok?: boolean; error?: string } | null;
      if (r?.ok) { setSt("activo"); setMsg("Listo. Te llegarán los avisos a este dispositivo."); }
      else setMsg(r?.error === "falta_migracion_0022" ? "Falta activar los avisos en el servidor. Vuelve a intentarlo más tarde." : "No se pudo activar. Vuelve a intentarlo.");
    } catch { setMsg("Este navegador no permitió activar los avisos."); }
    finally { setBusy(false); }
  };
  const off = async () => {
    setBusy(true); setMsg(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) { await fetch("/api/ceo/push", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => null); await sub.unsubscribe(); }
      setSt("apagado"); setMsg("Avisos apagados en este dispositivo.");
    } finally { setBusy(false); }
  };

  if (st === "cargando" || st === "sin_llaves") return null;
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-sm" data-testid="avisos-celular">
      <div className="flex items-start gap-3">
        <Smartphone size={16} className="mt-0.5 text-indigo shrink-0" />
        <div className="flex-1 min-w-0">
          <b className="text-ink">Avisos al celular</b>
          <p className="text-slate-500">Un aviso en la pantalla del celular cuando te llega un asunto, cuando está por vencer o cuando un acontecimiento real toca a tu empresa. Sin costo y sin dar tu número. Se activa en cada dispositivo.</p>
          {st === "iphone_sin_app" && <p className="mt-2 text-slate-600">En iPhone primero agrega mêtis CEO a tu pantalla de inicio: en Safari toca Compartir y luego «Agregar a pantalla de inicio». Abre mêtis desde ese ícono y regresa a Ajustes para activar los avisos.</p>}
          {st === "no_soportado" && <p className="mt-2 text-slate-600">Este navegador no permite avisos. En Android usa Chrome; en iPhone, Safari con mêtis en la pantalla de inicio.</p>}
          {st === "bloqueado" && <p className="mt-2 text-slate-600">Los avisos están bloqueados para mêtis en este navegador. Actívalos en los ajustes del navegador (permisos del sitio) y vuelve aquí.</p>}
          {st === "apagado" && <button type="button" disabled={busy} onClick={on} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-indigo px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" data-testid="activar-push"><BellRing size={15} /> Activar avisos en este celular</button>}
          {st === "activo" && <button type="button" disabled={busy} onClick={off} className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:bg-white disabled:opacity-50"><BellOff size={15} /> Apagar avisos en este dispositivo</button>}
          {msg && <p className="mt-2 text-xs text-slate-500">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
