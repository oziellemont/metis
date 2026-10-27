import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BOARD_STAGE, CHAINS, CRITERIA, PASS_CRITERION, PASS_TRUST, RETRY_AFTER, STEPS, boardAccess, chainsAt, fill, scoreBoard, startTrust, type Picks,
} from "./board";
import { recordBoard, requirementsFor, appoint, STAGES } from "./journey";
import { newState, kpis } from "./engine";
import { COMPANIES } from "./companies";
import type { CeoState } from "./types";

const T0 = Date.UTC(2026, 0, 5, 15);
const atStage = (stage: number, extra: Partial<NonNullable<CeoState["journey"]>> = {}): CeoState =>
  ({ ...newState(), startedAt: T0, journey: { stage, enrolledAt: T0, appointments: [], ...extra } });

/** Las 27 combinaciones posibles. */
const ALL: Picks[] = STEPS[0].options.flatMap((a) => STEPS[1].options.flatMap((b) => STEPS[2].options.map((c) => ({ [STEPS[0].id]: a.id, [STEPS[1].id]: b.id, [STEPS[2].id]: c.id }))));

describe("Junta ante el Consejo", () => {
  it("tiene 3 momentos con 3 opciones cada uno, y es requisito de Chief Executive Officer", () => {
    expect(STEPS).toHaveLength(3);
    for (const s of STEPS) expect(s.options).toHaveLength(3);
    expect(STAGES[BOARD_STAGE].name).toBe("Chief Executive Officer");
    expect(CRITERIA.map((c) => c.id)).toEqual(["rendicion", "criterio", "gobierno", "vision"]);
  });

  it("es determinista: las mismas respuestas dan el mismo resultado", () => {
    for (const p of ALL) expect(scoreBoard(p, 55)).toEqual(scoreBoard({ ...p }, 55));
  });

  it("se puede superar, pero la mayoría de los caminos no la supera", () => {
    const passing = ALL.filter((p) => scoreBoard(p, 50).passed);
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length).toBeLessThanOrEqual(4);
    expect(scoreBoard({ numeros: "todo", riesgo: "limite", apuesta: "etapas" }, 50).passed).toBe(true);
  });

  it("no basta con la confianza: un criterio bajo reprueba aunque la sala confíe en ti", () => {
    const r = scoreBoard({ numeros: "todo", riesgo: "limite", apuesta: "rechazar" }, 50);
    expect(r.trust).toBeGreaterThanOrEqual(PASS_TRUST);
    expect(r.scores.vision).toBeLessThan(PASS_CRITERION);
    expect(r.weakest).toBe("vision");
    expect(r.passed).toBe(false);
  });

  it("decirle que sí a todo al presidente no supera la junta", () => {
    for (const p of ALL.filter((x) => x.apuesta === "acompanar")) expect(scoreBoard(p, 100).passed).toBe(false);
  });

  it("las decisiones se encadenan: esconder el dato en el anexo cuesta en el siguiente momento", () => {
    expect(chainsAt("riesgo", { numeros: "anexo" })).toHaveLength(1);
    expect(chainsAt("riesgo", { numeros: "todo" })).toHaveLength(1);
    expect(chainsAt("riesgo", { numeros: "mercado" })).toHaveLength(0);
    const hide = scoreBoard({ numeros: "anexo", riesgo: "limite", apuesta: "etapas" }, 50);
    const sameNoChain = scoreBoard({ numeros: "mercado", riesgo: "limite", apuesta: "etapas" }, 50);
    expect(hide.passed).toBe(false);
    expect(hide.scores.rendicion).toBeLessThan(sameNoChain.scores.rendicion);
    // Toda cadena apunta a una opción y un momento que existen, y a un momento posterior.
    const order = STEPS.map((s) => s.id);
    for (const c of CHAINS) {
      expect(STEPS.find((s) => s.id === c.when[0])!.options.some((o) => o.id === c.when[1])).toBe(true);
      expect(order.indexOf(c.at)).toBeGreaterThan(order.indexOf(c.when[0]));
    }
  });

  it("la relación con el presidente y la consejera define la confianza inicial, sin decidir sola el resultado", () => {
    expect(startTrust(50, 50)).toBe(50);
    expect(startTrust(100, 100)).toBeGreaterThan(startTrust(20, 20));
    expect(startTrust(0, 0)).toBeGreaterThanOrEqual(35);
    // Con la mejor relación posible, un mal camino sigue sin pasar.
    expect(scoreBoard({ numeros: "anexo", riesgo: "defender", apuesta: "rechazar" }, startTrust(100, 100)).passed).toBe(false);
    // Con una relación mala, el mejor camino todavía pasa.
    expect(scoreBoard({ numeros: "todo", riesgo: "limite", apuesta: "etapas" }, startTrust(0, 0)).passed).toBe(true);
  });

  it("incompleta nunca se supera y los valores quedan entre 0 y 100", () => {
    const r = scoreBoard({ numeros: "todo", riesgo: "limite" }, 100);
    expect(r.complete).toBe(false);
    expect(r.passed).toBe(false);
    for (const p of ALL) {
      const x = scoreBoard(p, 0);
      for (const v of [x.trust, ...Object.values(x.scores)]) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100); }
    }
  });

  it("se abre en Chief Operating Officer, se cierra al superarla y espera un día si no la superas", () => {
    expect(boardAccess(atStage(2), T0)).toEqual({ open: false, reason: "stage" });
    expect(boardAccess(atStage(3), T0)).toEqual({ open: true });
    expect(boardAccess(atStage(4), T0)).toEqual({ open: false, reason: "past" });
    const failed = recordBoard(atStage(3), false, T0);
    expect(boardAccess(failed, T0 + 1000)).toMatchObject({ open: false, reason: "wait", until: T0 + RETRY_AFTER });
    expect(boardAccess(failed, T0 + RETRY_AFTER)).toEqual({ open: true });
    const passed = recordBoard(failed, true, T0 + RETRY_AFTER);
    expect(boardAccess(passed, T0 + RETRY_AFTER)).toEqual({ open: false, reason: "passed" });
    // Superada, queda superada.
    expect(recordBoard(passed, false, T0 + 5 * RETRY_AFTER).journey!.board).toEqual({ passed: true, at: T0 + RETRY_AFTER });
  });

  it("superarla cumple el requisito, pero por sí sola no da el nombramiento ni mueve indicadores", () => {
    const s = atStage(3);
    const req = (x: CeoState) => requirementsFor(BOARD_STAGE, x, T0).find((r) => r.id === "board")!;
    expect(req(s).ok).toBe(false);
    expect(req(s).soon).toBeUndefined();
    expect(req(s).href).toBe("/ceo/junta");
    const after = recordBoard(s, true, T0);
    expect(req(after).ok).toBe(true);
    expect(appoint(after, T0)).toBe(after); // le faltan empresas, competencias y constancia
    expect(kpis(after, T0)).toEqual(kpis(s, T0));
    expect(after.decisions).toEqual(s.decisions);
  });

  it("funciona en las tres empresas: el presidente y la consejera existen en el reparto", () => {
    for (const co of COMPANIES) {
      const chair = co.cast[co.roles.chair], board = co.cast[co.roles.board];
      expect(chair?.name).toBeTruthy();
      expect(board?.name).toBeTruthy();
      for (const s of STEPS) {
        const t = fill(s.prompt, { chair: chair.name, board: board.name });
        expect(t).not.toMatch(/\{chair\}|\{board\}/);
      }
    }
  });

  it("el texto no usa admiraciones ni nombra una empresa en particular", () => {
    const names = COMPANIES.flatMap((c) => [c.name, c.short]);
    const all = [...STEPS.flatMap((s) => [s.title, s.prompt, s.nota, ...s.options.flatMap((o) => [o.label, o.reaction])]), ...CHAINS.map((c) => c.text)].join("\n");
    expect(all).not.toContain("!");
    for (const n of names) expect(all).not.toContain(n);
  });

  it("la vista guarda el resultado con recordBoard y la ruta existe", () => {
    const root = join(__dirname, "..", "..");
    const view = readFileSync(join(root, "components", "ceo", "BoardView.tsx"), "utf8");
    expect(view).toContain("c.recordBoard(result.passed)");
    expect(readFileSync(join(root, "app", "ceo", "junta", "page.tsx"), "utf8")).toContain("BoardView");
  });
});
