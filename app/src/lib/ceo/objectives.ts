/**
 * mêtis CEO · Objetivos de temporada por empresa: lo que el consejo te encargó al contratarte.
 * Módulo sin dependencias del motor (lo usan el veredicto V5, el veredicto sombra y la interfaz).
 */
import type { KpiKey } from "./types";

export const SEASON_OBJECTIVES: Record<string, { kpis: KpiKey[]; text: string }> = {
  cumbre: { kpis: ["margen", "equipo"], text: "Recuperar margen sin romper la planta." },
  forja: { kpis: ["clientes", "caja"], text: "Cumplir a la armadora y generar caja para el fondo." },
  brasa: { kpis: ["margen", "clientes"], text: "Defender el margen frente a las apps sin perder clientes." },
  kubit: { kpis: ["caja", "clientes"], text: "Alargar la caja hasta la siguiente ronda sin perder a los clientes que quieren el producto." },
  puntomadero: { kpis: ["margen", "clientes"], text: "Recuperar margen frente a Mundo Casa sin perder a los clientes de toda la vida." },
  vertice: { kpis: ["margen", "clientes"], text: "Recuperar margen frente a Avante sin dejar de cumplirle a las cuentas grandes." },
};
