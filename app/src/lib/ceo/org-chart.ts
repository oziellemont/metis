/** Estructura del organigrama de tu empresa a partir del elenco del paquete (puro). */
import type { CompanyPack, Person } from "./types";

export interface OrgParts { consejo: Person[]; staff: Person[]; comite: { p: Person; team: Person[] }[]; externos: Person[] }

export function orgParts(pack: CompanyPack): OrgParts {
  const people = Object.values(pack.cast);
  const comite = people.filter((p) => p.group === "comite");
  const ids = new Set(comite.map((p) => p.id));
  return {
    consejo: people.filter((p) => p.group === "consejo"),
    staff: people.filter((p) => p.group === "equipo" && (!p.reportsTo || p.reportsTo === "ceo" || !ids.has(p.reportsTo))),
    comite: comite.map((p) => ({ p, team: people.filter((x) => x.group === "equipo" && x.reportsTo === p.id) })),
    externos: people.filter((p) => p.group === "externo"),
  };
}
