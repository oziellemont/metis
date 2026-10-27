/**
 * Eventos de producto del perfil profesional (V33). Lista cerrada de nombres y propiedades:
 * nada de texto libre, nombre, correo ni teléfono. Se guardan en ceo.product_events solo si el
 * interruptor «events» está prendido; si no, el servidor los descarta sin error.
 */
export const EVENT_NAMES = [
  "perfil_respondido", "perfil_editado", "diagnostico_hecho", "diagnostico_saltado",
  "aviso_perfil_visto", "aviso_perfil_pospuesto", "exigencia_elegida",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];
/** Propiedades permitidas: números pequeños, booleanos o identificadores cortos de catálogo. */
const PROP_KEYS = ["secs", "omitidas", "fuente", "tier", "respuestas", "veces"] as const;
type Props = Partial<Record<(typeof PROP_KEYS)[number], number | boolean | string>>;

export interface ProductEvent { event_id: string; name: EventName; props: Props; client_at?: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID = /^[a-z_]{1,20}$/;

export function sanitizeEvent(raw: unknown): ProductEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.event_id !== "string" || !UUID.test(r.event_id)) return null;
  if (typeof r.name !== "string" || !(EVENT_NAMES as readonly string[]).includes(r.name)) return null;
  const props: Props = {};
  const src = r.props && typeof r.props === "object" ? (r.props as Record<string, unknown>) : {};
  for (const k of PROP_KEYS) {
    const v = src[k];
    if (typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 100_000) props[k] = Math.round(v);
    else if (typeof v === "boolean") props[k] = v;
    else if (typeof v === "string" && ID.test(v)) props[k] = v;
  }
  const out: ProductEvent = { event_id: r.event_id, name: r.name as EventName, props };
  if (typeof r.client_at === "string" && !Number.isNaN(Date.parse(r.client_at))) out.client_at = new Date(r.client_at).toISOString();
  return out;
}

/** Cliente: manda el evento sin esperar respuesta; si falla, no pasa nada. */
export function track(name: EventName, props: Props = {}) {
  try {
    if (typeof window === "undefined" || typeof fetch === "undefined") return;
    const event_id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : null;
    if (!event_id) return;
    void fetch("/api/ceo/eventos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event_id, name, props, client_at: new Date().toISOString() }), keepalive: true }).catch(() => {});
  } catch { /* nunca rompe la app */ }
}
