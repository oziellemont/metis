/** Genera /tmp/seed.json: una carrera continua de 4 meses para revisar Hoy, Carrera y Perfil. Uso: SEED=1 npx vitest run scripts/seed-trayectoria.test.ts */
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { playCareer } from "../src/lib/ceo/season-sim";
import { advance, reportDueOf } from "../src/lib/ceo/engine";
it.runIf(process.env.SEED === "1")("seed", () => {
  const r = playCareer("cumbre", "contesta_la_mitad", 4, "seed|ui");
  const last = r.months.at(-1)!;
  // A mitad del mes 4: usamos el estado al final del mes 3 avanzado y la hora de mitad del 4.
  const prev = r.months.at(-2)!;
  const mid = Math.round((prev.at + last.at) / 2);
  const s = { ...r.state, name: "Oziel Leal", alias: "oziel" } as typeof r.state & { clockOffset?: number };
  s.clockOffset = last.at - Date.now();
  void advance; void reportDueOf;
  writeFileSync("/tmp/seed.json", JSON.stringify(s));
});
