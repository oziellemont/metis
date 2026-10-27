import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Reglas de copy de mêtis CEO (app y landing):
 *  - No se menciona el libro de Oziel (las frases se quedan, la referencia no).
 *  - No se promete nada a futuro: sin «próximamente», «en preparación», «llega en una próxima versión», Arena, etc.
 * Se revisan los textos de la app CEO, la landing y los correos. Los comentarios de código no cuentan.
 */
const ROOTS = ["src/lib/ceo", "src/components/ceo", "src/components/site/ceo-landing", "src/app/simulador", "src/app/ceo"];
const BOOK = /de cero a ceo|\blibro\b/i;
const FUTURE = /pr[oó]ximamente|en preparaci[oó]n|pr[oó]xima versi[oó]n|llegan? pronto|m[aá]s adelante:|todav[ií]a no est[aá] disponible|executive arena|coming soon/i;

function files(p: string): string[] {
  const st = statSync(p);
  if (st.isFile()) return /\.(ts|tsx)$/.test(p) ? [p] : [];
  return readdirSync(p).flatMap((f) => files(join(p, f)));
}
/** Quita comentarios // y /* *\/ para revisar solo lo que ve el usuario. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

describe("copy de mêtis CEO", () => {
  const all = ROOTS.flatMap(files).filter((f) => !f.endsWith(".test.ts"));
  it("no menciona el libro", () => {
    const bad = all.filter((f) => BOOK.test(code(readFileSync(f, "utf8"))));
    expect(bad).toEqual([]);
  });
  it("no promete funciones a futuro", () => {
    const bad = all.flatMap((f) => code(readFileSync(f, "utf8")).split("\n").filter((l) => FUTURE.test(l) && !l.includes("export const BANNED") && !/state: "(futuro|preparacion)"/.test(l)).map((l) => `${f}: ${l.trim().slice(0, 100)}`));
    expect(bad).toEqual([]);
  });
});
