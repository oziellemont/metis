/**
 * mêtis CEO · avisos al celular sin costo (Web Push estándar del navegador).
 *
 * Cómo funciona: el jugador toca «Activar avisos en este celular» en Ajustes; el navegador (Chrome en Android, Safari
 * en iPhone con mêtis agregado a la pantalla de inicio, Edge o Firefox en computadora) entrega una «suscripción» que se
 * guarda en ceo.push_subscriptions. El cron manda el aviso con las llaves VAPID del proyecto. No hay proveedor de pago:
 * Google, Apple y Mozilla entregan el mensaje gratis.
 *
 * Llaves VAPID (desde 0023): las genera el propio servidor la primera vez que hacen falta y las guarda en
 * ceo.server_secrets, una tabla que solo puede leer el servidor (service_role). La llave privada nunca sale del
 * servidor: no se escribe a mano, no va en variables públicas, no aparece en respuestas, registros ni documentos.
 * Al navegador solo se le entrega la llave pública. Si existen variables de entorno (VAPID_PRIVATE_KEY y
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY), se usan en su lugar (permite rotarlas desde Vercel sin tocar la base).
 * Para rotar: docs/sql/rotar_llaves_avisos.sql (el servidor genera otro par; los jugadores vuelven a activar avisos).
 *
 * Sin llaves (sin base ni variables) no se manda nada y el juego sigue igual. Una suscripción que el navegador ya dio
 * de baja (404 o 410) se borra sola.
 *
 * Variables opcionales:
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

/** Par de llaves del servidor. `privateKey` jamás se devuelve al navegador ni se registra. */
export interface VapidKeys { publicKey: string; privateKey: string }
/** Mínimo que se necesita de la base para leer o crear las llaves (cliente service_role del esquema ceo). */
export interface SecretStore {
  from(table: "server_secrets"): {
    select(cols: string): { eq(col: string, v: string): { maybeSingle(): PromiseLike<{ data: { value: unknown } | null; error: unknown }> } };
    upsert(row: { name: string; value: unknown }, opts: { onConflict: string; ignoreDuplicates: boolean }): PromiseLike<{ error: unknown }>;
  };
}
const isKeys = (v: unknown): v is VapidKeys => {
  const r = v as VapidKeys | null;
  return !!r && typeof r.publicKey === "string" && typeof r.privateKey === "string" && b64url.test(r.publicKey) && b64url.test(r.privateKey) && r.publicKey.length >= 80 && r.privateKey.length >= 40;
};
let memo: { at: number; keys: VapidKeys } | null = null;
const MEMO_MS = 10 * 60_000;
/** Solo para pruebas. */
export const resetVapidMemo = () => { memo = null; };

/**
 * Llaves VAPID: variables de entorno si existen; si no, las de ceo.server_secrets; si todavía no hay, las genera el
 * servidor (insert que no pisa a otro proceso que se adelantó) y vuelve a leer, para que todos usen el mismo par.
 */
export async function vapidKeys(store: SecretStore | null, gen?: () => VapidKeys): Promise<VapidKeys | null> {
  const envPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, envPriv = process.env.VAPID_PRIVATE_KEY;
  if (envPub && envPriv) return { publicKey: envPub, privateKey: envPriv };
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.keys;
  if (!store) return null;
  try {
    const read = async () => { const r = await store.from("server_secrets").select("value").eq("name", "vapid").maybeSingle(); return r.error ? undefined : isKeys(r.data?.value) ? r.data!.value as VapidKeys : null; };
    let keys = await read();
    if (keys === undefined) return null; // falta la migración 0023 o no hay permiso: sin avisos, el juego sigue
    if (!keys) {
      const make = gen ?? (await import("web-push")).default.generateVAPIDKeys;
      const fresh = make();
      const { error } = await store.from("server_secrets").upsert({ name: "vapid", value: { publicKey: fresh.publicKey, privateKey: fresh.privateKey } }, { onConflict: "name", ignoreDuplicates: true });
      if (error) return null;
      keys = await read();
      if (!keys) return null;
    }
    memo = { at: Date.now(), keys };
    return keys;
  } catch { return null; }
}

/** Texto corto del aviso (máx. ~120 caracteres de cuerpo: así se ve completo en la pantalla bloqueada). */
export function pushText(m: { title: string; body: string; url: string; tag: string }): PushMessage {
  const cut = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
  return { title: cut(m.title, 60), body: cut(m.body, 140), url: m.url.startsWith("/") ? m.url : "/", tag: cut(m.tag, 60) };
}

/** Envía a una suscripción con las llaves del servidor. gone = el navegador la dio de baja (hay que borrarla). */
export async function sendPush(sub: PushSub, msg: PushMessage, keys: VapidKeys | null): Promise<{ ok: boolean; gone?: boolean; error?: string }> {
  if (!keys) return { ok: false, error: "sin_llaves" };
  try {
    const wp = (await import("web-push")).default;
    await wp.sendNotification(sub, JSON.stringify(msg), { TTL: 6 * 3600, urgency: "normal", topic: msg.tag.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || undefined, vapidDetails: { subject: process.env.VAPID_SUBJECT || "mailto:hola@metis.ceo", publicKey: keys.publicKey, privateKey: keys.privateKey } });
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
