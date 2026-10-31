import { describe, expect, it } from "vitest";
import { COMPANIES, companyById } from "../companies";
import { EPISODES } from "../episodes/catalog";
import { brandedEpisode, packOf } from "../engine";
import { brandPack, brandText, packNames, unresolvedVars } from "./template";
import { newCompanyProfile } from "./identity";
import type { CeoState } from "../types";

const ID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const BRAND = { name: "Casa Norte Alimentos", short: "Casa Norte" };
/** Todas las formas fijas de los tres paquetes: ninguna puede quedar visible con el nombre del jugador. */
const FIXED = ["Botanas Cumbre", "Forja Norte", "Grupo Brasa", "Cumbre", "Forja", "Brasa", "Brasas", "botanascumbre.mx", "forjanorte.mx", "grupobrasa.mx"];

function strings(x: unknown, out: string[] = []): string[] {
  if (typeof x === "string") out.push(x);
  else if (Array.isArray(x)) x.forEach((y) => strings(y, out));
  else if (x && typeof x === "object") Object.values(x).forEach((y) => strings(y, out));
  return out;
}
const leak = (t: string) => FIXED.find((n) => new RegExp(`(?<![\\p{L}\\p{N}])${n.replace(/\./g, "\\.")}(?![\\p{L}\\p{N}])`, "u").test(t));

describe("nombre propio en los textos", () => {
  for (const pk of COMPANIES) {
    it(`${pk.id}: ningún nombre fijo se filtra y no quedan variables sin resolver`, () => {
      const b = brandPack(pk, BRAND);
      const all = strings(b);
      const leaks = all.filter((t) => leak(t));
      expect(leaks, leaks.slice(0, 3).join("\n")).toEqual([]);
      expect(all.flatMap(unresolvedVars)).toEqual([]);
      expect(b.name).toBe(BRAND.name);
      expect(b.short).toBe(BRAND.short);
      expect(b.domain).toBe("casanorte.mx");
    });
    it(`${pk.id}: ids, efectos y números quedan intactos (el motor calcula igual)`, () => {
      const b = brandPack(pk, BRAND);
      expect(b.items.map((i) => [i.id, i.day, i.slot, i.from, i.trigger, i.options.map((o) => [o.id, o.effects, o.score, o.stance])])).toEqual(pk.items.map((i) => [i.id, i.day, i.slot, i.from, i.trigger, i.options.map((o) => [o.id, o.effects, o.score, o.stance])]));
      expect(Object.keys(b.cast)).toEqual(Object.keys(pk.cast));
      expect(b.roles).toEqual(pk.roles);
      expect(b.kpiStart).toEqual(pk.kpiStart);
      expect(b.ties.map((t) => [t.a, t.b, t.kind])).toEqual(pk.ties.map((t) => [t.a, t.b, t.kind]));
    });
  }

  it("episodios: ningún nombre fijo y reglas, términos e ids intactos", () => {
    const profile = newCompanyProfile({ companyId: ID, sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida", displayName: BRAND.name, at: 1 }, 2)!;
    for (const spec of Object.values(EPISODES)) {
      const b = brandedEpisode(spec, { companyProfile: profile });
      const leaks = strings(b).filter((t) => leak(t));
      expect(leaks, `${spec.id}: ${leaks.slice(0, 2).join(" | ")}`).toEqual([]);
      expect(strings(b).flatMap(unresolvedVars)).toEqual([]);
      expect([b.id, b.company, b.rules, b.start, Object.keys(b.nodes), Object.keys(b.terms), Object.values(b.terms).map((t) => t.initial)]).toEqual([spec.id, spec.company, spec.rules, spec.start, Object.keys(spec.nodes), Object.keys(spec.terms), Object.values(spec.terms).map((t) => t.initial)]);
    }
  });

  it("sin identidad nada cambia: el paquete y el episodio son los originales", () => {
    const s = { company: "cumbre" } as Pick<CeoState, "company">;
    expect(packOf(s)).toBe(companyById("cumbre"));
    const spec = Object.values(EPISODES)[0];
    expect(brandedEpisode(spec, {})).toBe(spec);
  });

  it("variables de plantilla para el contenido nuevo", () => {
    const pk = companyById("brasa");
    expect(brandText("Bienvenido a {company_name} ({company_short}, {company_city}) · direccion@{company_domain}", pk, { ...BRAND, city: "León, Gto." })).toBe("Bienvenido a Casa Norte Alimentos (Casa Norte, León, Gto.) · direccion@casanorte.mx");
    expect(brandText("Hola {company_name}", pk, null)).toBe("Hola Grupo Brasa");
    expect(unresolvedVars("{company_name} y {company_x}")).toEqual(["company_name", "company_x"]);
  });

  it("giros propios de Brasa y la cocina «a la brasa» no se toca", () => {
    const pk = companyById("brasa");
    expect(brandText("Abrí la primera Brasa con mi hermana. Hoy abrimos 20 Brasas. Cocina a la brasa.", pk, BRAND)).toBe("Abrí la primera sucursal de Casa Norte con mi hermana. Hoy abrimos 20 sucursales de Casa Norte. Cocina a la brasa.");
    expect(brandText("Grupo Brasa y Brasa Andares", pk, BRAND)).toBe("Casa Norte Alimentos y Casa Norte Andares");
    expect(packNames(pk)).toEqual(["Grupo Brasa", "Brasa"]);
  });

  it("el paquete con marca se memoiza (mismo objeto para el mismo nombre)", () => {
    const pk = companyById("forja");
    expect(brandPack(pk, BRAND)).toBe(brandPack(pk, BRAND));
    expect(brandPack(pk, { name: "Otra", short: "Otra" })).not.toBe(brandPack(pk, BRAND));
  });
});
