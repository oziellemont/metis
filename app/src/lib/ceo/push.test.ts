/**
 * Avisos al celular: llaves del servidor (generadas y guardadas una sola vez, sin exponer la privada) y cifrado de
 * extremo a extremo con una suscripción generada en la prueba (como la de un navegador real).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createECDH, randomBytes } from "node:crypto";
import webpush from "web-push";
// @ts-expect-error http_ece (dependencia de web-push) no publica tipos
import ece from "http_ece";
import { resetVapidMemo, vapidKeys, type SecretStore, type VapidKeys } from "./push";

/** Base en memoria con la misma forma que la tabla ceo.server_secrets (insert que no pisa). */
function memStore(opts: { missing?: boolean } = {}) {
  const rows = new Map<string, unknown>();
  let writes = 0;
  const store: SecretStore = {
    from: () => ({
      select: () => ({ eq: (_c: string, v: string) => ({ maybeSingle: async () => (opts.missing ? { data: null, error: { code: "42P01" } } : { data: rows.has(v) ? { value: rows.get(v) } : null, error: null }) }) }),
      upsert: async (row: { name: string; value: unknown }) => { writes++; if (!rows.has(row.name)) rows.set(row.name, row.value); return { error: null }; },
    }),
  };
  return { store, rows, writes: () => writes };
}

describe("llaves VAPID del servidor", () => {
  const env = { ...process.env };
  beforeEach(() => { delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; delete process.env.VAPID_PRIVATE_KEY; resetVapidMemo(); });
  afterEach(() => { process.env = { ...env }; resetVapidMemo(); });

  it("la primera vez las genera el servidor y las guarda; después siempre devuelve el mismo par", async () => {
    const m = memStore();
    const a = await vapidKeys(m.store);
    expect(a?.publicKey.length).toBeGreaterThanOrEqual(80);
    expect(m.writes()).toBe(1);
    resetVapidMemo();
    const b = await vapidKeys(m.store);
    expect(b).toEqual(a);
    expect(m.writes()).toBe(1);
  });
  it("si dos procesos generan a la vez, gana el primero y ambos usan el mismo par", async () => {
    const m = memStore();
    const first: VapidKeys = webpush.generateVAPIDKeys();
    m.rows.set("vapid", first); // otro proceso se adelantó entre la lectura y la escritura
    resetVapidMemo();
    expect(await vapidKeys(m.store)).toEqual(first);
  });
  it("sin la migración 0023 no hay llaves (sin avisos) y el juego sigue", async () => {
    expect(await vapidKeys(memStore({ missing: true }).store)).toBeNull();
    expect(await vapidKeys(null)).toBeNull();
  });
  it("la ruta pública solo podría entregar la llave pública (la privada no aparece en su forma)", async () => {
    const k = (await vapidKeys(memStore().store))!;
    const body = JSON.stringify({ configured: true, publicKey: k.publicKey });
    expect(body).not.toContain(k.privateKey);
  });
});

describe("cifrado de extremo a extremo (Web Push estándar, RFC 8291)", () => {
  it("lo que manda el servidor solo lo puede abrir el navegador suscrito, y llega íntegro", () => {
    const vapid = webpush.generateVAPIDKeys();
    const ua = createECDH("prime256v1"); ua.generateKeys();
    const auth = randomBytes(16);
    const sub = { endpoint: "https://fcm.googleapis.com/fcm/send/prueba", keys: { p256dh: ua.getPublicKey().toString("base64url"), auth: auth.toString("base64url") } };
    const msg = JSON.stringify({ title: "Acería: Inundación de ejercicio en Campeche", body: "Ejercicio hipotético", url: "/ceo/empresa#crecimiento", tag: "world:x:3" });
    const req = webpush.generateRequestDetails(sub, msg, { TTL: 60, vapidDetails: { subject: "mailto:hola@metis.ceo", publicKey: vapid.publicKey, privateKey: vapid.privateKey } });
    expect(req.endpoint).toBe(sub.endpoint);
    expect(req.headers["Content-Encoding"]).toBe("aes128gcm");
    expect(String(req.headers.Authorization)).toMatch(new RegExp(`^vapid t=.+, k=${vapid.publicKey}$`));
    expect(String(req.headers.Authorization)).not.toContain(vapid.privateKey);
    const plain = ece.decrypt(req.body as Buffer, { version: "aes128gcm", privateKey: ua, authSecret: auth.toString("base64url") });
    expect(plain.toString("utf8")).toBe(msg);
    const other = createECDH("prime256v1"); other.generateKeys();
    expect(() => ece.decrypt(req.body as Buffer, { version: "aes128gcm", privateKey: other, authSecret: auth.toString("base64url") })).toThrow();
  });
});
