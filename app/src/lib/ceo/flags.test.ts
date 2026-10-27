import { describe, expect, it } from "vitest";
import { ALL_OFF, appEnvOf, resolveFlags, testToolsVisible } from "./flags";

describe("interruptores", () => {
  it("sin datos o con base caída: todo apagado", () => {
    expect(resolveFlags({})).toEqual(ALL_OFF);
    expect(resolveFlags({ global: null, player: "basura" })).toEqual(ALL_OFF);
  });

  it("los 5 interruptores sembrados por la 0015 (apagados) dan todo apagado", () => {
    const global = ["ai", "ai_shadow", "events", "game_journal", "replay_shadow"].map((key) => ({ key, enabled: false }));
    expect(resolveFlags({ global, player: { events: true }, aiConsent: true, aiEnvEnabled: true })).toEqual(ALL_OFF);
  });

  it("global prendido: aplica a todos, pero un jugador puede salirse", () => {
    const global = [{ key: "events", enabled: true }];
    expect(resolveFlags({ global }).events).toBe(true);
    expect(resolveFlags({ global, player: { events: false } }).events).toBe(false);
  });

  it("modo 'solo invitados': únicamente quien tiene su interruptor prendido", () => {
    const global = [{ key: "game_journal", enabled: false, value: { perPlayer: true } }];
    expect(resolveFlags({ global }).game_journal).toBe(false);
    expect(resolveFlags({ global, player: { game_journal: true } }).game_journal).toBe(true);
  });

  it("IA: exige base + consentimiento + llave de entorno (triple candado)", () => {
    const global = [{ key: "ai", enabled: true }, { key: "ai_shadow", enabled: true }];
    expect(resolveFlags({ global, aiConsent: true, aiEnvEnabled: true }).ai).toBe(true);
    expect(resolveFlags({ global, aiConsent: false, aiEnvEnabled: true }).ai).toBe(false);
    expect(resolveFlags({ global, aiConsent: true, aiEnvEnabled: false }).ai).toBe(false);
    // modo sombra no muestra nada al jugador: no requiere consentimiento, pero sí la llave de entorno
    expect(resolveFlags({ global, aiConsent: false, aiEnvEnabled: true }).ai_shadow).toBe(true);
    expect(resolveFlags({ global, aiConsent: true, aiEnvEnabled: false }).ai_shadow).toBe(false);
  });

  it("ignora claves desconocidas", () => {
    expect(resolveFlags({ global: [{ key: "borrar_todo", enabled: true }] })).toEqual(ALL_OFF);
  });
});

describe("entorno y herramientas de prueba", () => {
  it("detecta el entorno", () => {
    expect(appEnvOf("production")).toBe("production");
    expect(appEnvOf("preview")).toBe("preview");
    expect(appEnvOf(undefined, "production")).toBe("production");
    expect(appEnvOf(undefined, "test")).toBe("development");
  });

  it("producción sin configurar: igual que hoy (visible)", () => {
    expect(testToolsVisible("production", undefined, false)).toBe(true);
  });

  it("producción 'oculto': solo con ?prueba=1", () => {
    expect(testToolsVisible("production", "oculto", false)).toBe(false);
    expect(testToolsVisible("production", "oculto", true)).toBe(true);
  });

  it("preview y desarrollo: siempre visibles", () => {
    expect(testToolsVisible("preview", "oculto", false)).toBe(true);
    expect(testToolsVisible("development", "oculto", false)).toBe(true);
  });
});
