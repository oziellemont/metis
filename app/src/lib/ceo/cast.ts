import type { CastId } from "./types";

export const COMPANY = {
  name: "Botanas Cumbre",
  city: "Monterrey, N.L.",
  pitch: "Empresa familiar regiomontana de botanas y cacahuates. 38 años, 240 colaboradores, una planta en Apodaca y $410 millones de ventas al año. El fundador acaba de dejar la dirección y te eligió a ti: el primer Director General que no es de la familia.",
  facts: [
    ["Ventas anuales", "$410 M MXN"],
    ["Colaboradores", "240 (168 en planta)"],
    ["Cliente principal", "SuperNorte · 31% de las ventas"],
    ["Caja disponible", "≈ 7 semanas de operación"],
  ] as [string, string][],
};

export interface Person { id: CastId; name: string; role: string; initials: string; color: string; phone?: string }

export const CAST: Record<CastId, Person> = {
  ramiro: { id: "ramiro", name: "Don Ramiro Garza", role: "Fundador · Presidente del consejo", initials: "RG", color: "bg-[#1E1A5E] text-white" },
  lucia: { id: "lucia", name: "Lucía Treviño", role: "Directora de Finanzas", initials: "LT", color: "bg-sky text-white" },
  hector: { id: "hector", name: "Héctor Salinas", role: "Director Comercial · 22 años en Cumbre", initials: "HS", color: "bg-amber text-white" },
  mariana: { id: "mariana", name: "Mariana Villarreal", role: "Directora de Personas", initials: "MV", color: "bg-mint text-white" },
  diego: { id: "diego", name: "Diego Garza", role: "Gerente de Marca · hijo del fundador", initials: "DG", color: "bg-indigo-light text-white" },
  paty: { id: "paty", name: "Paty Elizondo", role: "Tu asistente ejecutiva", initials: "PE", color: "bg-coral text-white" },
  javier: { id: "javier", name: "Javier Ortiz", role: "Gerente de Planta", initials: "JO", color: "bg-slate-600 text-white" },
  roberto: { id: "roberto", name: "Roberto Cantú", role: "Secretario general del sindicato", initials: "RC", color: "bg-[#8A5A2B] text-white" },
  sofia: { id: "sofia", name: "Sofía Leal", role: "Compradora de categoría · SuperNorte", initials: "SL", color: "bg-[#C2185B] text-white" },
  ana: { id: "ana", name: "Ana Martínez", role: "Analista de Planeación Comercial", initials: "AM", color: "bg-[#0E7C86] text-white" },
  carla: { id: "carla", name: "Carla Méndez", role: "Consejera independiente", initials: "CM", color: "bg-[#5B2A86] text-white" },
};

/** Organigrama (para la pantalla «Tu empresa»). */
export const ORG: { lead: CastId; team: CastId[] }[] = [
  { lead: "ramiro", team: ["carla"] },
  { lead: "lucia", team: [] },
  { lead: "hector", team: ["ana", "diego"] },
  { lead: "mariana", team: [] },
  { lead: "javier", team: [] },
];

/** Nombre de pila (sin "Don"/"Doña"). */
export const firstName = (id: CastId) => CAST[id].name.replace(/^(Don|Doña|Lic\.|Ing\.)\s+/, "").split(" ")[0];
