/**
 * Orden en que se muestran las opciones de un caso.
 * Los casos propios de cada empresa se escribieron con la opción de mejor criterio casi siempre primero;
 * mostrarlos así regalaba la respuesta. Aquí se revuelven de forma estable (mismo caso, mismo orden siempre).
 * Solo cambia la presentación: la decisión se guarda por id de opción, no por posición.
 * El banco de casos ya llega revuelto desde su generador, por eso se respeta tal cual.
 */
import type { Item, Option } from "./types";
import { isBankId } from "./cases/bank";

function rand01(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return ((h >>> 0) % 100000) / 100000;
}

export function displayOptions(it: Pick<Item, "id" | "options">): Option[] {
  if (isBankId(it.id)) return it.options;
  return [...it.options].sort((a, b) => rand01(`${it.id}|orden|${a.id}`) - rand01(`${it.id}|orden|${b.id}`));
}
