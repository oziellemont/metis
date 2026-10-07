import { describe, expect, it } from "vitest";
import { matchScore, norm } from "./search";
import { nameFromEmail } from "./portal-data";

describe("buscador", () => {
  it("ignora acentos y mayúsculas", () => {
    expect(norm("Operación MTY")).toBe("operacion mty");
    expect(matchScore("operacion", "Excelencia Operación")).toBeGreaterThan(0);
  });
  it("prioriza lo que empieza igual", () => {
    expect(matchScore("ven", "Ventas netas")).toBe(3);
    expect(matchScore("net", "Ventas netas")).toBe(2);
    expect(matchScore("tas", "Ventas netas")).toBe(1);
  });
  it("exige todas las palabras, en cualquier campo", () => {
    expect(matchScore("ventas norte", "Ventas netas", "Región Norte")).toBeGreaterThan(0);
    expect(matchScore("ventas sur", "Ventas netas", "Región Norte")).toBe(0);
    expect(matchScore("   ", "Ventas")).toBe(0);
  });
  it("tolera plurales", () => {
    expect(matchScore("ventas", "Venta a nuevas cuentas")).toBe(3);
    expect(matchScore("unidades", "Unidad de negocio")).toBeGreaterThan(0);
  });
});

describe("nombre desde correo", () => {
  it("convierte el correo en un nombre amigable", () => {
    expect(nameFromEmail("oziel.lemont@gmail.com")).toBe("Oziel Lemont");
    expect(nameFromEmail("ana_garcia23@x.mx")).toBe("Ana Garcia");
    expect(nameFromEmail(undefined)).toBe("");
  });
});
