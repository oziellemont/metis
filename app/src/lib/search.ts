// Utilidades del buscador global (sin dependencias de React para poder probarlas).

/** minúsculas y sin acentos, para que "operacion" encuentre "Operación". */
export function norm(t: string | undefined | null): string {
  return (t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** 3 = empieza igual, 2 = alguna palabra empieza igual, 1 = lo contiene, 0 = no. Todas las palabras de la búsqueda deben aparecer. */
export function matchScore(query: string, ...fields: (string | undefined | null)[]): number {
  const q = norm(query);
  if (!q) return 0;
  const hay = fields.map(norm).filter(Boolean);
  const all = hay.join(" ");
  const words = q.split(/\s+/);
  // tolerante a plurales: "ventas" encuentra "Venta", "unidades" encuentra "unidad"
  const has = (w: string) => all.includes(w) || (w.length > 3 && w.endsWith("es") && all.includes(w.slice(0, -2))) || (w.length > 3 && w.endsWith("s") && all.includes(w.slice(0, -1)));
  if (!words.every(has)) return 0;
  const main = hay[0] ?? "";
  if (main.startsWith(q) || main.startsWith(q.replace(/e?s$/, ""))) return 3;
  if (main.split(/[\s\-_/·.]+/).some((w) => w.startsWith(words[0]))) return 2;
  return 1;
}
