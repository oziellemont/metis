import type { ActivityExample, SkillPlan } from "./tipos";

export const PLAN_CRECIMIENTO: SkillPlan[] = [
  {
    skill: "cre.cliente",
    basics: {
      terms: ["cliente", "usuario", "necesidad", "propuesta de valor", "decisor de compra", "alternativa del cliente"],
      documents: ["perfil de cliente", "encuesta de satisfacción"],
      indicators: ["satisfacción del cliente", "recomendación"],
    },
    steps: {
      1: "Reconoce quién compra, quién usa y qué problema le resuelve el producto.",
      2: "Describe la propuesta de valor de un negocio para un cliente concreto con información dada.",
      3: "Analiza por qué un cliente deja de comprar a partir de entrevistas y datos.",
      4: "Ajusta la propuesta de valor pesando lo que el cliente pide, lo que cuesta y lo que la operación puede cumplir.",
      5: "Entiende al cliente de un negocio entre empresas si solo conoce venta al público, o al revés.",
      6: "Decide a qué clientes se deja de servir para servir bien al resto.",
    },
  },
  {
    skill: "cre.segmentacion",
    basics: {
      terms: ["segmento", "mercado objetivo", "tamaño de mercado", "criterio de segmentación"],
      documents: ["estudio de mercado"],
      indicators: ["participación por segmento"],
    },
    steps: {
      1: "Reconoce qué es un segmento y por qué no todos los clientes son iguales.",
      2: "Agrupa una lista de clientes en segmentos con un criterio útil para vender.",
      3: "Compara segmentos por tamaño, rentabilidad y facilidad de acceso, y elige uno.",
      4: "Reorienta ventas, producto y servicio hacia el segmento elegido y calcula el costo del cambio.",
      5: "Segmenta un mercado que no conoce con datos públicos y supuestos explícitos.",
      6: "Cambia el segmento principal del negocio cuando el actual se encoge.",
    },
  },
  {
    skill: "cre.precios",
    basics: {
      terms: ["precio", "costo", "valor percibido", "descuento", "margen", "sensibilidad al precio"],
      documents: ["lista de precios", "cotización"],
      indicators: ["precio promedio", "descuento promedio"],
    },
    steps: {
      1: "Distingue precio, costo y valor, y reconoce tres formas de fijar un precio.",
      2: "Calcula el efecto de un descuento en el margen y cuánto más habría que vender para compensarlo.",
      3: "Analiza si conviene subir precios con datos de costos, competencia y reacción de clientes.",
      4: "Diseña una estructura de precios que cuide margen, volumen y relación con clientes clave.",
      5: "Fija precio en un modelo distinto: suscripción, paquete o por uso.",
      6: "Conduce una guerra de precios o un aumento fuerte con clientes molestos y vendedores nerviosos.",
    },
  },
  {
    skill: "cre.canales",
    basics: {
      terms: ["canal", "venta directa", "distribuidor", "comercio electrónico", "embudo de ventas", "cierre"],
      documents: ["reporte de ventas", "embudo de oportunidades"],
      indicators: ["tasa de cierre", "venta por vendedor"],
    },
    steps: {
      1: "Reconoce los canales por los que un negocio llega a su cliente y las etapas de una venta.",
      2: "Lee un embudo de ventas y calcula la conversión entre etapas.",
      3: "Analiza en qué etapa se pierden las ventas y por qué.",
      4: "Decide entre venta directa y distribuidores pesando margen, control y cobertura.",
      5: "Diseña el canal de un producto que no conoce según cómo compra su cliente.",
      6: "Resuelve un conflicto entre canales cuando la tienda en línea le quita ventas a los distribuidores.",
    },
  },
  {
    skill: "cre.marketing",
    steps: {
      2: "Calcula el costo de ganar un cliente con el gasto y los resultados de una campaña.",
      3: "Compara dos campañas y decide dónde poner el siguiente peso.",
      4: "Arma el plan comercial del año conectando marca, adquisición, capacidad de ventas y presupuesto.",
      5: "Adapta la estrategia de adquisición a un mercado con otro idioma, otra costumbre de compra u otro medio.",
      6: "Decide cuánto invertir en marca cuando el resultado no se puede medir en el trimestre.",
    },
  },
  {
    skill: "cre.retencion",
    steps: {
      2: "Calcula la tasa de cancelación y el valor de un cliente a lo largo del tiempo.",
      3: "Analiza qué grupo de clientes se va más y cuál es la causa probable.",
      4: "Decide cuánto invertir en retener frente a adquirir, con efecto en margen y operación.",
      5: "Mide la retención en un negocio sin contrato, como una tienda o un restaurante.",
      6: "Recupera la confianza de la base de clientes después de una falla grave.",
    },
  },
  {
    skill: "cre.producto",
    steps: {
      2: "Plantea una prueba pequeña para saber si una idea de producto interesa antes de invertir.",
      3: "Interpreta los resultados de un piloto y decide si se amplía, se ajusta o se detiene.",
      4: "Decide qué productos se lanzan, se mejoran o se retiran según margen, capacidad y estrategia.",
      5: "Evalúa una innovación de otra industria y decide si aplica en la suya.",
      6: "Apuesta por un producto que compite con el que hoy da de comer a la empresa.",
    },
  },
  {
    skill: "cre.modelo",
    steps: {
      3: "Calcula cuánto gana el negocio por cliente o por unidad y qué supuesto lo cambia más.",
      4: "Rediseña el modelo de ingresos, por ejemplo de venta única a suscripción, y calcula la transición.",
      5: "Explica la economía de un modelo que no conoce: plataforma, franquicia o suscripción.",
      6: "Decide un cambio de modelo de negocio que al principio reduce los ingresos.",
    },
  },
  {
    skill: "cre.expansion",
    steps: {
      4: "Evalúa abrir una plaza o una línea nueva con mercado, inversión, capacidad y riesgo.",
      5: "Evalúa la entrada a otro país o a una industria vecina y nombra lo que no se puede trasladar.",
      6: "Decide entre crecer con recursos propios, con socios o comprando un competidor, bajo presión de tiempo.",
    },
  },
];

export const EJEMPLOS_CRECIMIENTO: ActivityExample[] = [
  {
    id: "ej.cre.1", academy: "crecimiento", level: 1, format: "ejercicio", skills: ["cre.cliente"],
    title: "Quién compra y quién usa",
    situation: "Una empresa vende uniformes escolares. El niño los usa, la mamá o el papá los paga y la escuela decide el modelo y recomienda la tienda.",
    ask: "Identifica quién es el usuario, quién decide y quién paga, y qué le importa a cada uno.",
    evidence: "Distingue los tres papeles y nombra una necesidad distinta para cada uno.",
    contexts: ["uniformes escolares"],
  },
  {
    id: "ej.cre.2", academy: "crecimiento", level: 2, format: "aplicado", skills: ["cre.precios", "fin.costos"],
    title: "El descuento del diez por ciento",
    situation: "Fernando, vendedor de una papelería mayorista, pide autorización para dar 10 % de descuento a un cliente grande. Tienes el precio, el costo y el volumen actual de ese cliente.",
    ask: "Calcula cuánto baja el margen por unidad y cuánto más tendría que comprar el cliente para que el negocio gane lo mismo.",
    evidence: "El cálculo es correcto y la respuesta a Fernando se apoya en él.",
    contexts: ["papelería mayorista"],
  },
  {
    id: "ej.cre.3", academy: "crecimiento", level: 3, format: "aplicado", skills: ["cre.retencion", "cre.segmentacion"],
    title: "Los clientes que se van",
    situation: "Una aplicación de clases de idiomas pierde 7 % de sus suscriptores cada mes. Marketing propone más publicidad. Tienes las cancelaciones por plan, por antigüedad y por canal de llegada.",
    ask: "Identifica qué grupo se va más, cuál es la causa probable y qué harías antes de gastar en publicidad.",
    evidence: "Usa los cortes de datos para ubicar el problema y propone una acción dirigida a ese grupo.",
    contexts: ["aplicación de educación por suscripción"],
  },
  {
    id: "ej.cre.4", academy: "crecimiento", level: 4, format: "inmersivo", skills: ["cre.canales", "est.ventaja", "ope.capacidad"],
    title: "Distribuidores o venta directa",
    situation: "Una marca de alimento para mascotas vende a través de distribuidores que se quedan con 30 % del precio. La directora comercial propone vender en línea directo al consumidor. Los distribuidores ya escucharon el rumor y uno te llama molesto.",
    ask: "Decide el esquema de canales, calcula el efecto en margen y logística, y responde al distribuidor.",
    evidence: "Pesa margen, cobertura y capacidad de entrega, y maneja la conversación con el distribuidor sin engaños.",
    contexts: ["alimento para mascotas"],
  },
  {
    id: "ej.cre.5", academy: "crecimiento", level: 5, format: "repaso", skills: ["cre.precios"],
    title: "Poner precio a algo que no se vende por pieza",
    situation: "Analizaste el precio de una línea de herramientas que se vende por pieza. Ahora una empresa de mantenimiento de elevadores quiere pasar de cobrar por visita a cobrar una cuota mensual.",
    ask: "Propón cómo fijar la cuota y explica qué principios de precio se mantienen y cuáles cambian.",
    evidence: "Lleva valor percibido, costo y competencia al modelo nuevo y nombra el riesgo de la cuota fija.",
    contexts: ["herramientas", "mantenimiento de elevadores"],
  },
  {
    id: "ej.cre.6", academy: "crecimiento", level: 6, format: "integrador", skills: ["cre.expansion", "rie.entorno", "est.escenarios"],
    title: "Entrar a otro país",
    situation: "Una cadena de ópticas con ochenta sucursales evalúa entrar a un país vecino. Hay un socio local interesado, una elección presidencial en seis meses, un tipo de cambio inestable y un competidor que acaba de anunciar lo mismo.",
    ask: "Recomienda si entrar, cómo y cuándo, con escenarios, y di qué señal te haría detenerte.",
    evidence: "Decide con incertidumbre real, compara formas de entrada y define un punto de salida.",
    contexts: ["ópticas"],
  },
];
