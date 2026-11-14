/**
 * MÊTIS 2.0 · Sello de los intentos del piloto.
 *
 * Mientras no exista una tabla para guardar intentos en el servidor (necesita autorización y respaldo),
 * el intento viaja con la persona dentro de un sello cifrado por el servidor. El sello lleva la identidad
 * de quien responde, la pieza, su versión y lo respondido. El navegador lo guarda, pero no lo puede leer
 * (las marcas que deja cada decisión podrían delatar cuál era crítica) ni cambiar: si cambia una sola letra,
 * el cifrado autenticado lo detecta y el servidor lo rechaza.
 *
 * Lo que el sello NO resuelve: quien borra su sello puede empezar otro intento, y quien guarda un sello viejo
 * puede volver a un punto anterior. Evitarlo pide guardar los intentos en la cuenta, con una llave única por
 * persona, pieza, versión e intento (docs/sql/metis2_0025_intentos_PROPUESTA.sql, preparado y sin ejecutar).
 *
 * Solo para el servidor: usa node:crypto y la llave nunca sale de ahí.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION = "s1";

export function sellar(payload: unknown, secret: string): string {
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([c.update(JSON.stringify(payload), "utf8"), c.final()]);
  return [VERSION, iv.toString("base64url"), body.toString("base64url"), c.getAuthTag().toString("base64url")].join(".");
}

/** Devuelve el contenido si el sello es auténtico; si no, null. */
export function abrir<T = unknown>(sello: unknown, secret: string): T | null {
  if (typeof sello !== "string" || sello.length > 200_000) return null;
  const parts = sello.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) return null;
  try {
    const key = createHash("sha256").update(secret).digest();
    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16) return null;
    const d = createDecipheriv("aes-256-gcm", key, iv);
    d.setAuthTag(tag);
    const out = Buffer.concat([d.update(Buffer.from(parts[2], "base64url")), d.final()]).toString("utf8");
    return JSON.parse(out) as T;
  } catch {
    return null;
  }
}

let local: string | null = null;
/**
 * Llave de los sellos. Se deriva de PILOTO_SELLO_SECRET o, si no existe, de la llave de servicio de Supabase,
 * que solo vive en el servidor. Sin ninguna de las dos (desarrollo), una llave al azar por proceso:
 * los sellos dejan de valer al reiniciar, que es lo correcto.
 */
export function selloSecret(): string {
  const base = (process.env.PILOTO_SELLO_SECRET ?? "").trim() || (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (base) return createHash("sha256").update(`metis:piloto:sello:v1:${base}`).digest("hex");
  local ??= randomBytes(32).toString("hex");
  return local;
}
