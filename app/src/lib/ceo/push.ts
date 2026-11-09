/**
 * mêtis CEO · avisos al celular sin costo (Web Push estándar del navegador).
 *
 * Cómo funciona: el jugador toca «Activar avisos en este celular» en Ajustes; el navegador (Chrome en Android, Safari
 * en iPhone con mêtis agregado a la pantalla de inicio, Edge o Firefox en computadora) entrega una «suscripción» que se
 * guarda en ceo.push_subscriptions. El cron manda el aviso con las llaves VAPID del proyecto. No hay proveedor de pago:
 * Google, Apple y Mozilla entregan el mensaje gratis.
 *
 * Sin llaves (variables de Vercel) no se manda nada y el juego sigue igual. Una suscripción que el navegador ya dio de
 * baja (404 o 410) se borra sola.
 *
 * Variables:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  llave pública (la usa el navegador para suscribirse)
 *   VAPID_PRIVATE_KEY             llave privada (solo servidor)
 *   VAPID_SUBJECT                 contacto, p. ej. «mailto:hola@metis.ceo»
 */
export interface PushSub { endpoint: string; keys: { p256dh: string; auth: string } }
export interface PushMessage { title: string; body: string; url: string; tag: string }

const b64url = /^[A-Za-z0-9_-]+={0,2}$/;
/** Solo suscripciones bien formadas y de servicios de push conocidos (evita que el servidor llame a cualquier URL). */
export const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/, /\.notify\.windows\.com$/, /^android\.googleapis\.com$/];
export function cleanPushSub(x: unknown): PushSub | null {
  const r = x as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  if (!r || typeof r !== "object" || typeof r.endpoint !== "string" || r.endpoint.length > 1000) return null;
  let host = "";
  try { const u = new URL(r.endpoint); if (u.protocol !== "https:") return null; host = u.hostname; } catch { return null; }
  if (!PUSH_HOSTS.some((h) => h.test(host))) return null;
  const p = r.keys?.p256dh, a = r.keys?.auth;
  if (typeof p !== "string" || typeof a !== "string" || p.length > 200 || a.length > 100 || !b64url.test(p) || !b64url.test(a)) return null;
  return { endpoint: r.endpoint, keys: { p256dh: p, auth: a } };
}

export const pushConfigured = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

/** Texto corto del aviso (máx. ~120 caracteres de cuerpo: así se ve completo en la pantalla bloqueada). */
export function pushText(m: { title: string; body: string; url: string; tag: string }): PushMessage {
  const cut = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
  return { title: cut(m.title, 60), body: cut(m.body, 140), url: m.url.startsWith("/") ? m.url : "/", tag: cut(m.tag, 60) };
}

/** Envía a una suscripción. gone = el navegador la dio de baja (hay que borrarla). */
export async function sendPush(sub: PushSub, msg: PushMessage): Promise<{ ok: boolean; gone?: boolean; error?: string }> {
  if (!pushConfigured()) return { ok: false, error: "sin_llaves" };
  try {
    const wp = (await import("web-push")).default;
    wp.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hola@metis.ceo", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
    await wp.sendNotification(sub, JSON.stringify(msg), { TTL: 6 * 3600, urgency: "normal", topic: msg.tag.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || undefined });
    return { ok: true };
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    return { ok: false, gone: code === 404 || code === 410, error: code ? `http_${code}` : "error" };
  }
}

/**
 * Qué se avisa al celular (clave propia «push:<clave>» en ceo.players.sent, para no repetir):
 *  - un asunto que ya llegó (no los programados: el celular no se puede programar, llegan cuando corre el cron);
 *  - un asunto por vencer;
 *  - un acontecimiento real que toca a la empresa.
 * El resumen, la racha y la inactividad se quedan en el correo para no saturar el celular.
 */
export type PushJob =
  | { key: string; kind: "case"; entry: { item: { id: string; subject: string; from: string } }; at?: number }
  | { key: string; kind: "reminder"; entry: { item: { id: string; subject: string } }; hoursLeft: number }
  | { key: string; kind: "world"; world: { name: string; daysLeft: number; mode: string }; subject: string }
  | { key: string; kind: string };
export function pushFor(job: PushJob, company: string): PushMessage | null {
  if (job.kind === "case" && "entry" in job && !("at" in job && job.at)) return pushText({ title: `${company}: asunto nuevo`, body: job.entry.item.subject, url: `/ceo/caso/${job.entry.item.id}`, tag: job.key });
  if (job.kind === "reminder" && "entry" in job && "hoursLeft" in job) { const h = Math.max(1, Math.round(job.hoursLeft)); return pushText({ title: `${company}: por vencer`, body: `${job.entry.item.subject} · te quedan ${h === 1 ? "1 hora" : `${h} horas`}`, url: `/ceo/caso/${job.entry.item.id}`, tag: job.key }); }
  if (job.kind === "world" && "world" in job && job.world.mode === "real") return pushText({ title: `${company}: ${job.world.name}`, body: `Evento real · Simulación de impacto en tu empresa. Plazo: ${job.world.daysLeft === 0 ? "hoy" : job.world.daysLeft === 1 ? "1 día" : `${job.world.daysLeft} días`}.`, url: "/ceo/empresa#crecimiento", tag: job.key });
  return null;
}
export const pushKey = (key: string) => `push:${key}`;
