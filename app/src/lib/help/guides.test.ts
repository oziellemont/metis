import { describe, expect, it } from "vitest";
import { GUIDES, guideFor, searchHelp } from "./guides";

const PAGES = ["/inicio", "/scorecard", "/carga", "/sesiones", "/compromisos", "/mapa", "/indicadores", "/proyectos", "/equipo", "/reportes", "/academy",
  "/config/estrategia", "/config/catalogo", "/config/alcances", "/config/unidades", "/config/usuarios", "/config/notificaciones"];

describe("instructor «?»", () => {
  it("cada página del menú tiene guía", () => {
    for (const p of PAGES) {
      const g = guideFor(p);
      expect(g.key).toBe(p);
      expect(g.purpose.length).toBeGreaterThan(10);
      expect(g.steps.length).toBeGreaterThan(0);
    }
  });
  it("subrutas usan la guía de su sección", () => {
    expect(guideFor("/equipo/u-12").key).toBe("/equipo");
    expect(guideFor("/academy/tour").key).toBe("/academy");
    expect(guideFor("/scorecard/").key).toBe("/scorecard");
  });
  it("ruta desconocida → guía general", () => expect(guideFor("/xyz").key).toBe(""));
  it("busca dudas sin acentos y prioriza la página actual", () => {
    const r = searchHelp("evidencia", "/carga");
    expect(r[0].q).toMatch(/evidencia/i);
    expect(r[0].here).toBe(true);
    expect(searchHelp("semaforo", "/inicio").some((f) => /semáforo/.test(f.q))).toBe(true);
    expect(searchHelp("", "/inicio")).toEqual([]);
  });
  it("todas las respuestas tienen contenido", () => {
    Object.values(GUIDES).forEach((g) => g.faqs.forEach((f) => expect(f.a.length).toBeGreaterThan(15)));
  });
});
