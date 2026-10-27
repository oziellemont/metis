import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Regla de diseño de mêtis CEO: nada de emojis (ni símbolos que parezcan hechos por IA) en el juego. */
const ROOTS = ["src/lib/ceo", "src/components/ceo", "src/components/site/CeoVisuals.tsx", "src/app/simulador"];
const EMOJI = /[\p{Extended_Pictographic}\u2605\u2606\u2713\u2717]/u;

function files(p: string): string[] {
  const st = statSync(p);
  if (st.isFile()) return /\.(ts|tsx)$/.test(p) ? [p] : [];
  return readdirSync(p).flatMap((f) => (f === "golden" ? [] : files(join(p, f))));
}

describe("sin emojis en mêtis CEO", () => {
  it("ningún archivo de contenido o pantalla trae emojis", () => {
    const bad: string[] = [];
    for (const f of ROOTS.flatMap(files)) {
      if (f.endsWith(".test.ts")) continue; // las pruebas pueden traer emojis a propósito (para comprobar que se quitan)
      readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        // © ® ™ y flechas tipográficas sí se permiten
        const clean = line.replace(/[\u00A9\u00AE\u2122\u2190-\u21FF]/g, "");
        if (EMOJI.test(clean)) bad.push(`${f}:${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });
});
