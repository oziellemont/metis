import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { simulate, profileFor } from "./business";
import { opsRowsOf, opsScore, stageOf, statementOf, STAGE_LABEL } from "./business/present";
import { tabOfHash, EMPRESA_TABS } from "@/components/ceo/empresa/tabs";

const read = (f: string) => readFileSync(`src/components/ceo/${f}`, "utf8");
const bizOf = () => {
  const profile = profileFor("logistica", "vertice");
  const periods = simulate(profile, [{ kpiDelta: { margen: -3 }, status: "cerrado" }, { kpiDelta: { clientes: 2 }, status: "en_curso" }], { seed: "tolm", archetype: "establecida" });
  return { profile, periods, closed: periods[periods.length - 2], now: periods[periods.length - 1] };
};

describe("Empresa · cinco pestañas", () => {
  it("Resumen, Finanzas, Operación, Personas y Consejo, en ese orden", () => {
    expect(EMPRESA_TABS.map((t) => t.label)).toEqual(["Resumen", "Finanzas", "Operación", "Personas", "Consejo"]);
  });
  it("#crecimiento (Hoy, correos, avisos) abre Operación, donde vive el panel con ese id", () => {
    expect(tabOfHash("#crecimiento")).toBe("operacion");
    expect(tabOfHash("#finanzas")).toBe("finanzas");
    expect(tabOfHash("#otra")).toBeNull();
    expect(read("empresa/OperacionTab.tsx")).toMatch(/<GrowthPanel \/>/);
    expect(read("GrowthPanel.tsx")).toContain('id="crecimiento"');
  });
  it("el encabezado es sencillo: sin datos de salud ni KPI, solo nombre y selector", () => {
    const v = read("CompanyView.tsx");
    expect(v).not.toContain("Salud empresarial");
    expect(v).not.toContain("Desempeño operativo");
    expect(v).toContain('role="tablist"');
    expect(read("empresa/OperacionTab.tsx")).toContain("en meta");
  });
  it("lo que salió de Empresa vive en otra pantalla", () => {
    expect(read("CeoSettings.tsx")).toContain("<RenameCompany />");
    expect(read("Career.tsx")).toContain("<MyCompanies />");
    expect(read("CeoAcademy.tsx")).toContain("<IndustryGlossary />");
    const all = ["CompanyView.tsx", "empresa/ResumenTab.tsx", "empresa/ConsejoTab.tsx"].map(read).join("\n");
    expect(all).not.toContain("Glosario");
    expect(all).not.toContain("Cambiar nombre");
  });
  it("Consejo separa confianza (índice) de salud mínima (umbral)", () => {
    const v = read("empresa/ConsejoTab.tsx");
    expect(v).toContain("Confianza del Consejo");
    expect(v).toContain("Salud mínima exigida");
  });
});

describe("Finanzas · los estados cuadran a simple vista", () => {
  it("en cada mes y moneda, la suma de los renglones visibles da el EBITDA y la caja que se ven", () => {
    const b = bizOf();
    for (const p of b.periods) for (const cur of ["MXN", "USD"] as const) {
      const s = statementOf(p, cur);
      const f = 10 ** s.digits;
      const sum = (xs: number[]) => Math.round(xs.reduce((a, x) => a + x, 0) * f) / f;
      expect(sum([s.revenue, -s.cogs])).toBe(s.gross);
      expect(sum([s.gross, -s.payroll, -s.marketing, -s.other])).toBe(s.ebitda);
      expect(sum([s.cashBegin, s.inflows, -s.outflows])).toBe(s.cashEnd);
      // los totales son los reales redondeados (no se inventa nada)
      expect(Math.abs(s.ebitda - (cur === "USD" ? p.ebitda / 18.5 : p.ebitda))).toBeLessThanOrEqual(0.5 / f + 1e-9);
    }
  });
  it("cada mes se nombra Histórico, Cierre definitivo o Proyección", () => {
    const b = bizOf();
    expect(b.periods.map((p) => STAGE_LABEL[stageOf(p)])).toEqual(["Histórico", "Cierre definitivo", "Proyección"]);
  });
});

describe("Operación · tabla ejecutiva", () => {
  it("TOLM llega con 0 de 5 KPI en meta y marca solo los dos de mayor impacto", () => {
    const rows = opsRowsOf(bizOf(), ["margen", "clientes"]);
    expect(opsScore(rows)).toEqual({ met: 0, total: 5 });
    expect(rows.filter((r) => r.top)).toHaveLength(2);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].impact).toBeGreaterThanOrEqual(rows[i].impact);
  });
});
