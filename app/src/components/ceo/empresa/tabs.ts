/** Pestañas de Empresa y su ancla en la dirección (puro, para poder probarlo). */
export const EMPRESA_TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "finanzas", label: "Finanzas" },
  { id: "operacion", label: "Operación" },
  { id: "personas", label: "Personas" },
  { id: "consejo", label: "Consejo" },
] as const;
export type EmpresaTab = (typeof EMPRESA_TABS)[number]["id"];
const isTab = (x: string): x is EmpresaTab => EMPRESA_TABS.some((t) => t.id === x);

/** `#crecimiento` (casos de crecimiento que enlazan Hoy, correos y avisos) abre Operación. */
export function tabOfHash(hash: string): EmpresaTab | null {
  const h = hash.replace(/^#/, "");
  if (h === "crecimiento") return "operacion";
  return isTab(h) ? h : null;
}
