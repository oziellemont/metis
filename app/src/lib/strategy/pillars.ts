/**
 * Las Líneas de Acción (pilares) NO son una lista fija: nacen de la MEGA y de los
 * obstáculos que separan a la empresa de ella. Regla de oro: entre 3 y 5.
 * Estas son sólo ideas de inspiración según el tipo de MEGA.
 */
export const LAE_MIN = 3;
export const LAE_MAX = 5;

export const PILLAR_QUESTION =
  "¿Qué capacidades, mercados o cambios estructurales tenemos que dominar obligatoriamente para que la MEGA sea una realidad?";

export type PillarIdea = { name: string; description: string };
export type PillarSet = { id: string; label: string; when: string; ideas: PillarIdea[] };

export const PILLAR_SETS: PillarSet[] = [
  {
    id: "crecimiento",
    label: "Hipercrecimiento",
    when: "Startup o empresa que quiere multiplicar su tamaño",
    ideas: [
      { name: "Levantamiento de capital", description: "Rondas de inversión" },
      { name: "Adquisición agresiva", description: "Captura de clientes y usuarios" },
      { name: "Escalabilidad de producto", description: "Que el producto aguante el crecimiento" },
      { name: "Atracción de talento top", description: "Contratar líderes clave" },
    ],
  },
  {
    id: "eficiencia",
    label: "Eficiencia",
    when: "Fábrica, manufactura u operación intensiva",
    ideas: [
      { name: "Automatización de planta", description: "Reducir mano de obra en procesos repetitivos" },
      { name: "Optimización de cadena de suministro", description: "Compras baratas y eficientes" },
      { name: "Cero defectos", description: "Calidad: reducir mermas al mínimo" },
      { name: "Sostenibilidad energética", description: "Bajar costos de luz y gas" },
    ],
  },
  {
    id: "consolidacion",
    label: "Consolidación",
    when: "Empresa familiar que quiere trascender",
    ideas: [
      { name: "Institucionalización", description: "Crear un consejo de administración" },
      { name: "Sucesión de liderazgo", description: "Preparar a la siguiente generación" },
      { name: "Diversificación de portafolio", description: "Invertir en nuevos negocios" },
      { name: "Digitalización", description: "Salir del papel y migrar a la nube" },
    ],
  },
  {
    id: "ventas",
    label: "Duplicar ventas",
    when: "La MEGA es crecer ingresos",
    ideas: [
      { name: "Fuerza comercial", description: "Más y mejores vendedores, nuevos canales" },
      { name: "Marketing y marca", description: "Generar demanda y posicionamiento" },
      { name: "Capacidad instalada", description: "Poder producir y entregar el doble" },
    ],
  },
  {
    id: "venta-empresa",
    label: "Ser adquirida",
    when: "La MEGA es vender la empresa o atraer a un socio",
    ideas: [
      { name: "Cumplimiento legal", description: "Todo en regla para una auditoría" },
      { name: "Gobierno corporativo", description: "Consejo, políticas y procesos claros" },
      { name: "Rentabilidad", description: "Márgenes sanos y comprobables" },
    ],
  },
  {
    id: "bsc",
    label: "Base equilibrada",
    when: "Inspirada en el Balanced Scorecard; ajústala a tu realidad",
    ideas: [
      { name: "Finanzas", description: "Rentabilidad y crecimiento" },
      { name: "Clientes", description: "Experiencia y lealtad" },
      { name: "Procesos", description: "Operación y calidad" },
      { name: "Personas", description: "Talento y cultura" },
    ],
  },
];
