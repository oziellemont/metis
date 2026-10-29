/**
 * mêtis CEO · envío del diario desde el navegador (Fase 0.5, modo sombra).
 * Nunca bloquea ni cambia la partida: si algo falla, la cola espera y se reintenta después.
 */
import type { KV } from "./import";
import type { GameAction } from "./replay";
import type { CeoState } from "./types";
import { ack, careerStartOf, dropCareer, enqueue, journalKey, nextBatch, readQueue, type JournalQueue } from "./journal";

type Fetch = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ status: number; json: () => Promise<unknown> }>;

export const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "00000000-0000-4000-8000-000000000000");

const load = (kv: KV, uid: string) => readQueue(kv.getItem(journalKey(uid)), newId);
const save = (kv: KV, uid: string, q: JournalQueue) => { try { kv.setItem(journalKey(uid), JSON.stringify(q)); } catch { /* lleno: se pierde el diario, no la partida */ } };

/** Anota una jugada en la cola del dispositivo. `s` es el estado YA con la jugada aplicada. */
export function logAction(kv: KV, uid: string, s: CeoState, action: GameAction): void {
  const career = careerStartOf(s);
  if (!career) return;
  save(kv, uid, enqueue(load(kv, uid), action, career, newId));
}
export const pendingCount = (kv: KV, uid: string) => load(kv, uid).items.length;
export const clearJournal = (kv: KV, uid: string) => kv.removeItem(journalKey(uid));

export type FlushResult = "vacio" | "enviado" | "apagado" | "reintentar";

/**
 * Envía un lote. Si el servidor no conoce la carrera actual, manda el estado como punto de partida
 * (y descarta de la cola lo que ese estado ya incluye). Carreras viejas desconocidas se descartan.
 */
export async function flushOnce(kv: KV, uid: string, s: CeoState, clientXp: number, fetchFn: Fetch): Promise<FlushResult> {
  let q = load(kv, uid);
  const batch = nextBatch(q);
  if (!batch) return "vacio";
  const current = careerStartOf(s);
  const post = async (body: Record<string, unknown>) => {
    try {
      const r = await fetchFn("/api/ceo/partida", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      return { status: r.status, out: ((await r.json().catch(() => ({}))) ?? {}) as Record<string, unknown> };
    } catch { return { status: 0, out: {} as Record<string, unknown> }; }
  };
  const isCurrent = batch.career === current;
  let { status, out } = await post({ career: batch.career, events: batch.events, ...(isCurrent ? { clientXp } : {}) });
  if (status === 200 && out.journal === false) { clearJournal(kv, uid); return "apagado"; }
  if (status === 409 && out.need === "base") {
    q = load(kv, uid);
    if (!isCurrent) { save(kv, uid, dropCareer(q, batch.career)); return "enviado"; }
    ({ status, out } = await post({ career: batch.career, events: [], base: s, clientXp }));
    if (status === 200 && out.journal === false) { clearJournal(kv, uid); return "apagado"; }
    if (status === 200 && out.ok) { save(kv, uid, dropCareer(load(kv, uid), batch.career)); return "enviado"; }
    if (status === 422) { save(kv, uid, dropCareer(load(kv, uid), batch.career)); return "enviado"; }
    return "reintentar";
  }
  if (status === 200 && out.ok) { save(kv, uid, ack(load(kv, uid), batch.events.map((e) => e.eventId))); return "enviado"; }
  if (status === 400 || status === 413 || status === 422) { save(kv, uid, ack(load(kv, uid), batch.events.map((e) => e.eventId))); return "enviado"; }
  return "reintentar";
}
