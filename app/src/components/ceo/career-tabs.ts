/** Vistas de Carrera y su ancla en la dirección (puro, para poder probarlo). */
export const CAREER_TABS = [
  { id: "carrera", label: "Mi carrera" },
  { id: "perfil", label: "Mi perfil" },
] as const;
export type CareerTab = (typeof CAREER_TABS)[number]["id"];

/** Secciones de Mi perfil a las que se llega con un ancla desde otras pantallas. */
export const PROFILE_ANCHORS = ["experiencia", "liderazgo"] as const;

/** `#perfil`, `#experiencia` y `#liderazgo` abren Mi perfil; sin ancla (o con otra) se queda en Mi carrera. */
export function careerTabOfHash(hash: string): CareerTab {
  const h = hash.replace(/^#/, "");
  return h === "perfil" || (PROFILE_ANCHORS as readonly string[]).includes(h) ? "perfil" : "carrera";
}

/** A dónde manda la dirección anterior de Perfil (conserva el ancla si traía una). */
export function careerHrefOfProfileHash(hash: string): string {
  const h = hash.replace(/^#/, "");
  return `/ceo/carrera#${(PROFILE_ANCHORS as readonly string[]).includes(h) ? h : "perfil"}`;
}
