import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { BRIEF_MAX, dayBriefOf, dayStartOf, type BriefInput } from "./today";

const H = 3_600_000;
const start = Date.UTC(2026, 10, 10, 6); // medianoche en Monterrey (UTC-6)
const base = (o: Partial<BriefInput> = {}): BriefInput => ({ now: start + 10 * H, dayStart: start, decided: [], expired: [], pending: [], world: null, report: null, nextArrival: null, ...o });
const BANNED = /de cero a ceo|\blibro\b|próximamente|en preparación|más adelante:/i;

describe("Hoy · resumen del día", () => {
  it("nunca pasa de cuatro líneas, aunque haya de todo", () => {
    const l = dayBriefOf(base({
      decided: [{ subject: "Descuento a Avante", at: start + 9 * H }, { subject: "Turno extra", at: start + 8 * H }],
      expired: [{ subject: "Proveedor de hielo", deadline: start + 7 * H }],
      pending: [{ subject: "Queja de cliente", who: "Laura", deadline: start + 12 * H }],
      world: { name: "Huracán en el Golfo", label: "Pronóstico", daysLeft: 2 },
      alert: "Margen va a la baja. Revisa precios.",
      nextArrival: start + 11 * H,
    }));
    expect(l.length).toBeLessThanOrEqual(BRIEF_MAX);
    expect(l.map((x) => x.kind)).toEqual(["hecho", "vencido", "mundo", "viene"]);
  });
  it("incluye tus decisiones de hoy y deja fuera las de ayer", () => {
    const l = dayBriefOf(base({ decided: [{ subject: "Descuento a Avante", at: start + 9 * H }, { subject: "Ayer", at: start - 2 * H }] }));
    expect(l[0]).toEqual({ kind: "hecho", text: "Hoy decidiste «Descuento a Avante»." });
  });
  it("siempre dice lo que viene: lo más urgente primero", () => {
    const l = dayBriefOf(base({ pending: [{ subject: "B", who: "Ana", deadline: start + 20 * H }, { subject: "A", who: "Luis", deadline: start + 12 * H }] }));
    expect(l.find((x) => x.kind === "viene")!.text).toBe("Lo más urgente: «A», de Luis; vence en 2 h.");
  });
  it("sin pendientes, avisa cuándo llega lo siguiente o que ya no llega nada hoy", () => {
    expect(dayBriefOf(base({ nextArrival: start + 11 * H }))[0].text).toBe("El siguiente asunto llega en 1 h.");
    expect(dayBriefOf(base({ nextArrival: start + 30 * H }))[0].text).toMatch(/Por hoy no llegan más asuntos/);
    expect(dayBriefOf(base({ quiet: true }))[0].text).toMatch(/día tranquilo/);
  });
  it("el mundo y el cierre del mes aparecen cuando aplican", () => {
    const l = dayBriefOf(base({ world: { name: "Paro en aduanas", label: "Ya ocurrió", daysLeft: 0 }, report: 3 }));
    expect(l.map((x) => x.text)).toEqual(["En el mundo: Paro en aduanas (ya ocurrió). Tienes hasta hoy para decidir.", "Toca revisar y firmar el cierre del mes 3."]);
  });
  it("el aviso se recorta a su primera frase", () => {
    const l = dayBriefOf(base({ alert: "Caja está en 38. Si cierras así, no apruebas." }));
    expect(l.at(-1)).toEqual({ kind: "ojo", text: "Ojo: Caja está en 38." });
  });
  it("sin textos prohibidos", () => {
    const l = dayBriefOf(base({ decided: [{ subject: "X", at: start + H }], nextArrival: start + 11 * H }));
    for (const x of l) expect(x.text).not.toMatch(BANNED);
    expect(readFileSync("src/lib/ceo/today.ts", "utf8")).not.toMatch(BANNED);
  });
  it("la medianoche se calcula en la zona del usuario", () => {
    expect(dayStartOf(start + 10 * H + 1234, "America/Monterrey")).toBe(start);
  });
  it("Hoy muestra el resumen y ya no muestra avisos internos de reglas", () => {
    const src = readFileSync("src/components/ceo/Today.tsx", "utf8");
    expect(src).toContain('data-testid="resumen-dia"');
    expect(src).not.toMatch(/aviso-economia|aviso-coherencia|aviso-lineas-rojas|aviso-reglas-nuevas|dinero real/);
  });
});
