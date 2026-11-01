import { describe, expect, it } from "vitest";
import { companyById } from "../companies";
import { niceMoney, scaleMoneyText, sizeFactor, sizedPack } from "./size";

const CUMBRE = companyById("cumbre");
const all = (x: unknown) => JSON.stringify(x);

describe("montos y tamaños según el tipo de empresa", () => {
  it("factor: establecida o sin tipo no cambia nada; PYME de alimentos es ~0.12", () => {
    expect(sizeFactor("cumbre", undefined)).toBe(1);
    expect(sizeFactor("cumbre", "establecida")).toBe(1);
    const f = sizeFactor("cumbre", "pyme");
    expect(f).toBeGreaterThan(0.1);
    expect(f).toBeLessThan(0.13);
  });

  it("redondea montos como los diría una persona", () => {
    expect(niceMoney(48.3)).toBe("$48 M");
    expect(niceMoney(4.68)).toBe("$4.7 M");
    expect(niceMoney(0.6)).toBe("$600 mil");
  });

  it("escala millones; respeta montos chicos y cifras que no son dinero de la empresa", () => {
    expect(scaleMoneyText("Un crédito de $40 M", 0.1)).toBe("Un crédito de $4 M");
    expect(scaleMoneyText("Gana $38 mil al mes", 0.1)).toBe("Gana $38 mil al mes");
    expect(scaleMoneyText("Cuesta $300 a la semana", 0.1)).toBe("Cuesta $300 a la semana");
    expect(scaleMoneyText("Inversión de $420 mil", 0.12, ["$420 mil"])).toBe("Inversión de $50 mil");
  });

  it("una establecida recibe exactamente el mismo paquete", () => {
    expect(sizedPack(CUMBRE, "establecida")).toBe(CUMBRE);
    expect(sizedPack(CUMBRE, undefined)).toBe(CUMBRE);
  });

  it("la PYME no hereda cifras de empresa grande", () => {
    const p = sizedPack(CUMBRE, "pyme");
    const txt = all(p);
    expect(txt).not.toContain("240 colaboradores");
    expect(txt).not.toContain("$410");
    expect(txt).not.toContain("1,200 tiendas");
    expect(txt).not.toContain("$40 M");
    expect(sizedPack(CUMBRE, "pyme")).toBe(p);
  });

  it("solo cambia textos: ids, efectos, puntajes y datos reales quedan iguales", () => {
    const p = sizedPack(CUMBRE, "pyme");
    expect(p.items.map((i) => i.id)).toEqual(CUMBRE.items.map((i) => i.id));
    p.items.forEach((it, k) => {
      const o = CUMBRE.items[k];
      expect(it.day).toBe(o.day);
      expect(all(it.trigger)).toBe(all(o.trigger));
      expect(all(it.real)).toBe(all(o.real));
      expect(it.options.map((x) => all([x.id, x.effects, x.score, x.style, x.stance]))).toEqual(
        o.options.map((x) => all([x.id, x.effects, x.score, x.style, x.stance])),
      );
    });
  });
});
