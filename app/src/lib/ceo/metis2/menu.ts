/**
 * MÊTIS 2.0 · Menú (entrega 3.6).
 *
 * El menú es Hoy, Bandeja, Academy, Mi progreso y Mi perfil. Empresa y Carrera salieron del menú: sus páginas y todo
 * lo jugado siguen existiendo, y vuelven a verse solo si la persona enciende «Mostrar el simulador de empresas» en
 * Ajustes (`settings.simulador`). Lógica pura, sin React ni navegador, para poder probarla.
 */
export type MenuIcon = "hoy" | "bandeja" | "academy" | "progreso" | "perfil" | "empresa" | "carrera";

export interface MenuItem {
  href: string;
  label: string;
  /** Nombre corto para la barra del celular cuando hay siete lugares. */
  short?: string;
  icon: MenuIcon;
  /** Lleva el contador de asuntos pendientes. */
  badge?: boolean;
}

export const MENU: readonly MenuItem[] = [
  { href: "/ceo", label: "Hoy", icon: "hoy" },
  { href: "/ceo/bandeja", label: "Bandeja", icon: "bandeja", badge: true },
  { href: "/ceo/academy", label: "Academy", icon: "academy" },
  { href: "/ceo/progreso", label: "Mi progreso", short: "Progreso", icon: "progreso" },
  { href: "/ceo/perfil", label: "Mi perfil", short: "Perfil", icon: "perfil" },
];

/** Las dos pantallas del simulador de empresas. Fuera del menú salvo que la persona lo encienda. */
export const SIMULATOR_MENU: readonly MenuItem[] = [
  { href: "/ceo/empresa", label: "Empresa", icon: "empresa" },
  { href: "/ceo/carrera", label: "Carrera", icon: "carrera" },
];

/** Menú a mostrar: cinco lugares, o siete con Empresa y Carrera después de Bandeja. */
export function menuFor(simulador: boolean | undefined): MenuItem[] {
  return simulador === true ? [...MENU.slice(0, 2), ...SIMULATOR_MENU, ...MENU.slice(2)] : [...MENU];
}

/** Columnas de la barra del celular. */
export const menuColumns = (simulador: boolean | undefined): 5 | 7 => (simulador === true ? 7 : 5);
