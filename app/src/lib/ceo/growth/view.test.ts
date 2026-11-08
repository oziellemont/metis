import { describe, expect, it } from "vitest";
import { advance, createCompany, headcount } from "./engine";
import { play, untilCase, type Decision } from "./chains";
import { compareStates, milestonesOf, resultsOf, sitesOf, teamOf, todayLineOf } from "./view";
import { DEMO_SCENARIOS, runDemo } from "./demo";

const BANNED = /de cero a ceo|\blibro\b|próximamente|en preparación|más adelante:/i;

describe("growth · vista de Mi empresa", () => {
  const g = advance(createCompany("restaurante_emergente", "v"), 40);

  it("equipo: cuenta igual que el motor y no inventa puestos", () => {
    const t = teamOf(g);
    expect(t.headcount).toBe(headcount(g));
    expect(t.byRole.reduce((a, r) => a + r.count, 0)).toBe(headcount(g));
    expect(t.note).toMatch(/Costo total de la gente/);
  });

  it("sucursales y resultados: cifras del último mes cerrado y liquidez explicada", () => {
    const s = sitesOf(g);
    expect(s.length).toBeGreaterThan(0);
    expect(s[0].status).toMatch(/Operando/);
    const r = resultsOf(g);
    expect(r.month).toBe(g.months.at(-1)!.month);
    expect(r.rows.map((x) => x[0])).toContain("EBITDA");
    expect(r.liquidity.text.length).toBeGreaterThan(20);
  });

  it("hitos y línea de Hoy en español, sin textos prohibidos", () => {
    let s = createCompany("restaurante_emergente", "v");
    const dec: Decision[] = [];
    s = untilCase(s, ["ga1_cocina"], dec).state;
    const r = play(s, "ga1_cocina", "cocinero", dec);
    dec.push(r.decision!);
    const ms = milestonesOf(r.state, dec);
    expect(ms[0].day).toBeGreaterThanOrEqual(ms.at(-1)!.day);
    expect(ms.some((m) => m.kind === "decision" && /cocinero/i.test(m.text))).toBe(true);
    expect(todayLineOf(r.state, 1)).toMatch(/un caso de crecimiento/);
    expect(todayLineOf(r.state, 0)).toMatch(/personas/);
    for (const t of [...ms.map((m) => m.text), todayLineOf(r.state, 0), resultsOf(r.state).liquidity.text]) expect(t).not.toMatch(BANNED);
  });

  it("comparar un estado consigo mismo no muestra cambios", () => {
    expect(compareStates(g, g).every((r) => r.tone === "flat" && r.delta === "—")).toBe(true);
  });
});

describe("growth · demostración antes / después", () => {
  it.each(DEMO_SCENARIOS.map((s) => s.id))("%s: ambos caminos se comparan el mismo día", (id) => {
    const d = runDemo(id)!;
    expect(d.base.state.day).toBe(d.alt.state.day);
    expect(d.rows.length).toBeGreaterThanOrEqual(5);
    expect(d.base.decisions.length).toBe(d.scenario.base.steps.length);
    expect(d.alt.decisions.length).toBe(d.scenario.alt.steps.length);
  });

  it("contratar al cocinero suma una persona y nómina, y recupera pedidos perdidos", () => {
    const d = runDemo("contratacion")!;
    const row = (l: string) => d.rows.find((r) => r.label === l)!;
    expect(d.alt.team.headcount).toBe(d.base.team.headcount + 1);
    expect(row("Nómina bruta mensual").tone).toBe("bad");
    expect(row("Pedidos no atendidos").tone).toBe("good");
  });

  it("abrir Cumbres agrega una sede operando y más ventas", () => {
    const d = runDemo("apertura")!;
    const row = (l: string) => d.rows.find((r) => r.label === l)!;
    expect(row("Sedes operando").tone).toBe("good");
    expect(row("Ventas del último mes").tone).toBe("good");
    expect(d.alt.sites.length).toBe(d.base.sites.length + 1);
  });

  it("el segundo turno sostiene el contrato; sin él hay penalizaciones y cancelación", () => {
    const d = runDemo("turno")!;
    const row = (l: string) => d.rows.find((r) => r.label === l)!;
    expect(row("Ventas del último mes").tone).toBe("good");
    expect(row("Piezas al día comprometidas por contrato").tone).toBe("good");
    expect(row("Penalizaciones pagadas (acumulado)").tone).toBe("good");
    expect(d.base.state.events.some((e) => e.kind === "cancelacion")).toBe(true);
  });

  it("es determinista", () => {
    expect(runDemo("turno", "z")!.rows).toEqual(runDemo("turno", "z")!.rows);
  });
});
