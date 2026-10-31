import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { COMPANIES } from "./companies";
import { orgParts } from "./org-chart";

describe("organigrama de Mi empresa", () => {
  it("cada persona aparece exactamente una vez, en su nivel", () => {
    for (const pk of COMPANIES) {
      const o = orgParts(pk);
      const ids = [...o.consejo, ...o.staff, ...o.comite.flatMap((x) => [x.p, ...x.team]), ...o.externos].map((p) => p.id);
      expect(ids.sort(), pk.id).toEqual(Object.keys(pk.cast).sort());
      for (const { p, team } of o.comite) for (const k of team) expect(k.reportsTo, `${pk.id}:${k.id}`).toBe(p.id);
    }
  });
  it("cumbre: Diego y Ana bajo Héctor; Paty como staff tuyo; sindicato y compradora fuera", () => {
    const o = orgParts(COMPANIES.find((c) => c.id === "cumbre")!);
    expect(o.comite.find((x) => x.p.id === "hector")!.team.map((p) => p.id)).toEqual(["diego", "ana"]);
    expect(o.staff.map((p) => p.id)).toEqual(["paty"]);
    expect(o.externos.map((p) => p.id).sort()).toEqual(["roberto", "sofia"]);
  });
  it("Mi empresa usa el organigrama; el caso ya no muestra «Quién está en juego»", () => {
    const empresa = readFileSync("src/components/ceo/CompanyView.tsx", "utf8");
    expect(empresa).toContain("<CompanyOrgChart");
    const caso = readFileSync("src/components/ceo/CaseView.tsx", "utf8");
    expect(caso).not.toMatch(/Quién está en juego|WhoIsInvolved|OrgMap/);
  });
});
