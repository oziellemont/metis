/** Genera /tmp/seed-dia.json: la misma carrera de prueba, pero a media jornada de un mes en curso. Uso: SEED=1 npx vitest run scripts/seed-hoy-dia.test.ts */
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { playCareer } from "../src/lib/ceo/season-sim";
import { entries } from "../src/lib/ceo/engine";
it.runIf(process.env.SEED === "1")("seed día", () => {
  const r = playCareer("cumbre", "contesta_la_mitad", 4, "seed|ui");
  const last = r.months.at(-1)!;
  const prev = r.months.at(-2)!;
  const s = { ...last.state, name: "Oziel Leal", alias: "oziel" } as typeof r.state & { clockOffset?: number };
  // Busca un momento del mes 4 con decisiones de ese día y algo pendiente.
  const H = 3_600_000;
  let best = Math.round((prev.at + last.at) / 2), score = -1;
  for (let t = prev.at + 6 * H; t < last.at - 6 * H; t += 2 * H) {
    const e = entries(s, t);
    const dec = e.filter((x) => x.status === "decidido" && x.decision && t - x.decision.at < 10 * H).length;
    const pen = e.filter((x) => x.status === "pendiente").length;
    const sc = (dec ? 2 : 0) + (pen ? 2 : 0) + Math.min(dec, 2);
    if (sc > score) { score = sc; best = t; }
  }
  s.clockOffset = best - Date.now();
  writeFileSync("/tmp/seed-dia.json", JSON.stringify(s));
  console.log("score", score);
});
