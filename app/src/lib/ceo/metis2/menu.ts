/**
 * MÊTIS 2.0 · Menú (entrega 3.6, cuatro pestañas desde la Directiva v1.1).
 *
 * El menú es Hoy, Academy, Mi progreso y Mi perfil. La página de pendientes sigue abriendo por su dirección y desde el
 * Hoy del simulador, pero ya no es pestaña ni lleva contador. Empresa y Carrera salieron del menú: sus páginas y todo
 * lo jugado siguen existiendo, y vuelven a verse solo si la persona enciende «Mostrar el simulador de empresas» en
 * Ajustes (`settings.simulador`). Lógica pura, sin React ni navegador, para poder probarla.
 */
export type MenuIcon = "hoy" | "academy" | "progreso" | "perfil" | "empresa" | "carrera";

export interface MenuItem {
  href: string;
  label: string;
  /** Nombre corto para la barra del celular cuando hay seis lugares. */
  short?: string;
  icon: MenuIcon;
}

export const MENU: readonly MenuItem[] = [
  { href: "/ceo", label: "Hoy", icon: "hoy" },
  { href: "/ceo/academy", label: "Academy", icon: "academy" },
  { href: "/ceo/progreso", label: "Mi progreso", short: "Progreso", icon: "progreso" },
  { href: "/ceo/perfil", label: "Mi perfil", short: "Perfil", icon: "perfil" },
];

/** Las dos pantallas del simulador de empresas. Fuera del menú salvo que la persona lo encienda. */
export const SIMULATOR_MENU: readonly MenuItem[] = [
  { href: "/ceo/empresa", label: "Empresa", icon: "empresa" },
  { href: "/ceo/carrera", label: "Carrera", icon: "carrera" },
];

/** Menú a mostrar: cuatro lugares, o seis con Empresa y Carrera después de Hoy. */
export function menuFor(simulador: boolean | undefined): MenuItem[] {
  return simulador === true ? [...MENU.slice(0, 1), ...SIMULATOR_MENU, ...MENU.slice(1)] : [...MENU];
}

/** Columnas de la barra del celular. */
export const menuColumns = (simulador: boolean | undefined): 4 | 6 => (simulador === true ? 6 : 4);
