import type { ActivityExample, SkillPlan } from "./tipos";

export const PLAN_FINANZAS: SkillPlan[] = [
  {
    skill: "fin.lenguaje",
    basics: {
      terms: ["ingreso", "costo", "gasto", "utilidad", "caja", "activo", "pasivo", "capital", "depreciación"],
      documents: ["estado de resultados", "balance general", "flujo de efectivo"],
    },
    steps: {
      1: "Distingue ingreso de cobro, costo de gasto y utilidad de caja con ejemplos cotidianos.",
      2: "Clasifica operaciones reales de un negocio en el estado financiero que les corresponde.",
      3: "Explica cómo una misma operación mueve los tres estados financieros.",
      4: "Traduce una decisión comercial u operativa a su efecto en resultados, balance y caja.",
      5: "Lee los estados de un negocio con otra lógica contable, como suscripciones o proyectos de obra.",
      6: "Explica las finanzas del negocio a un consejo o a un banco sin tecnicismos y sin perder precisión.",
    },
  },
  {
    skill: "fin.resultados",
    basics: {
      terms: ["ventas netas", "costo de ventas", "utilidad bruta", "gastos de operación", "utilidad de operación", "EBITDA", "utilidad neta"],
      documents: ["estado de resultados"],
      indicators: ["margen bruto", "margen de operación", "margen neto"],
    },
    steps: {
      1: "Reconoce los renglones de un estado de resultados y qué mide cada margen.",
      2: "Calcula los márgenes de un estado de resultados sencillo y responde una pregunta concreta.",
      3: "Explica por qué el margen cae aunque las ventas crezcan, comparando dos periodos.",
      4: "Decide entre subir precio, recortar gasto o cambiar la mezcla, y calcula el efecto de cada opción.",
      5: "Compara la rentabilidad de dos negocios con estructuras de costo muy distintas.",
      6: "Defiende un trimestre malo ante el consejo separando lo temporal de lo estructural.",
    },
  },
  {
    skill: "fin.balance",
    basics: {
      terms: ["activo circulante", "activo fijo", "pasivo de corto y largo plazo", "capital contable", "cuentas por cobrar", "cuentas por pagar"],
      documents: ["balance general"],
      indicators: ["liquidez (activo circulante entre pasivo de corto plazo)", "apalancamiento (deuda entre capital)"],
    },
    steps: {
      1: "Reconoce qué tiene, qué debe y cuánto capital tiene un negocio en su balance.",
      2: "Calcula liquidez y apalancamiento con un balance dado y dice si alcanza para pagar lo de este año.",
      3: "Interpreta cómo cambió el balance entre dos años y qué decisiones lo explican.",
      4: "Evalúa si el balance aguanta un plan de crecimiento y qué habría que ajustar antes.",
      5: "Lee el balance de un negocio intensivo en activos y el de uno ligero, y explica la diferencia.",
      6: "Reestructura el balance bajo presión de acreedores y explica a quién le cuesta cada alternativa.",
    },
  },
  {
    skill: "fin.flujo",
    basics: {
      terms: ["entrada y salida de efectivo", "flujo de operación", "flujo de inversión", "flujo de financiamiento", "saldo de caja"],
      documents: ["flujo de efectivo", "proyección de caja semanal"],
      indicators: ["semanas de caja disponibles"],
    },
    steps: {
      1: "Explica por qué un negocio con utilidad puede quedarse sin dinero.",
      2: "Arma el flujo de un mes con cobros y pagos dados y calcula el saldo final.",
      3: "Encuentra en qué semana falta caja y cuál es la causa.",
      4: "Elige entre retrasar pagos, acelerar cobranza o pedir crédito, pesando el efecto en clientes y proveedores.",
      5: "Proyecta la caja de un negocio estacional o de proyectos largos, distinto al que conoce.",
      6: "Dirige una crisis de liquidez: decide a quién se paga primero y qué se le dice a cada parte.",
    },
  },
  {
    skill: "fin.presupuesto",
    basics: {
      terms: ["presupuesto", "real contra presupuesto", "variación", "pronóstico", "partida"],
      documents: ["presupuesto anual", "reporte mensual de variaciones"],
      indicators: ["variación en pesos y en porcentaje"],
    },
    steps: {
      1: "Reconoce las partes de un presupuesto y qué significa una variación a favor o en contra.",
      2: "Calcula las variaciones del mes y señala las dos que más pesan.",
      3: "Explica una variación separando efecto de precio, de volumen y de gasto.",
      4: "Rearma el presupuesto a medio año negociando recortes con las áreas.",
      5: "Presupuesta un negocio con ingresos inciertos, como uno nuevo o de proyectos.",
      6: "Defiende ante el consejo un presupuesto que sacrifica el resultado de este año por el siguiente.",
    },
  },
  {
    skill: "fin.costos",
    steps: {
      2: "Separa costos fijos y variables y calcula el margen de contribución por unidad.",
      3: "Calcula el punto de equilibrio y analiza cómo cambia si sube la renta o baja el precio.",
      4: "Decide si aceptar un pedido grande con descuento considerando capacidad, caja y precedente.",
      5: "Aplica contribución y punto de equilibrio a un negocio de servicios o digital, donde casi todo es fijo.",
      6: "Rediseña la estructura de costos del negocio cuando el volumen cae y no se sabe por cuánto tiempo.",
    },
  },
  {
    skill: "fin.capital_trabajo",
    steps: {
      2: "Calcula los días de cobranza, de inventario y de pago, y el ciclo de efectivo.",
      3: "Explica por qué crecer en ventas está consumiendo caja y cuánta se necesita.",
      4: "Negocia plazos con clientes y proveedores equilibrando caja, relación y riesgo.",
      5: "Compara el ciclo de efectivo de una tienda con el de un negocio por suscripción y adapta las decisiones.",
      6: "Libera caja atrapada en el negocio sin romper la operación ni la confianza de clientes clave.",
    },
  },
  {
    skill: "fin.inversion",
    steps: {
      3: "Compara dos inversiones por su periodo de recuperación y su valor presente, con flujos dados.",
      4: "Evalúa una inversión incluyendo riesgo, escenarios y lo que se deja de hacer por elegirla.",
      5: "Evalúa una inversión en un activo que no conoce, como tecnología o una concesión.",
      6: "Recomienda una inversión grande con supuestos discutibles y la sostiene ante un comité.",
    },
  },
  {
    skill: "fin.financiamiento",
    steps: {
      3: "Compara un crédito, un arrendamiento y la entrada de un socio por su costo y sus condiciones.",
      4: "Elige la mezcla de financiamiento para un plan de expansión y cuida las obligaciones con el banco.",
      5: "Estructura el financiamiento de un negocio con flujos muy distintos, como uno estacional.",
      6: "Negocia con bancos e inversionistas en un momento de debilidad y decide qué cede.",
    },
  },
  {
    skill: "fin.valor",
    steps: {
      4: "Estima el valor de un negocio con un múltiplo y con flujos, y explica por qué difieren.",
      5: "Valúa un negocio de otra industria ajustando los supuestos que cambian.",
      6: "Decide entre reinvertir, pagar deuda, repartir utilidades o comprar un competidor, y lo defiende ante accionistas.",
    },
  },
];

export const EJEMPLOS_FINANZAS: ActivityExample[] = [
  {
    id: "ej.fin.1", academy: "finanzas", level: 1, format: "ejercicio", skills: ["fin.lenguaje", "fin.flujo"],
    title: "Ganó dinero y no tiene con qué pagar",
    situation: "Rubén tiene un taller de herrería. En marzo entregó un portón grande y facturó más que nunca, pero el cliente le paga a sesenta días y el viernes toca la nómina. Te enseña sus notas del mes.",
    ask: "Marca qué movimientos son ingreso, cuáles son cobro, cuáles son gasto y cuáles son pago, y explica por qué tiene utilidad y no tiene caja.",
    evidence: "Clasifica bien los movimientos y explica la diferencia entre utilidad y caja con el caso de Rubén.",
    contexts: ["taller de herrería"],
  },
  {
    id: "ej.fin.2", academy: "finanzas", level: 2, format: "aplicado", skills: ["fin.resultados"],
    title: "El estado de resultados de la panadería",
    situation: "Marta, dueña de dos panaderías, te manda su estado de resultados del trimestre y una pregunta: quiere saber si puede contratar a otra persona en mostrador.",
    ask: "Calcula el margen bruto y el de operación, y responde si la utilidad de operación alcanza para ese sueldo.",
    evidence: "Los cálculos son correctos y la respuesta se apoya en ellos.",
    contexts: ["panaderías"],
  },
  {
    id: "ej.fin.3", academy: "finanzas", level: 3, format: "aplicado", skills: ["fin.resultados", "fin.costos", "cre.precios"],
    title: "Las ventas suben, el margen baja",
    situation: "Una comercializadora de refacciones vendió 18 % más que el año pasado y su margen bruto cayó cuatro puntos. El director comercial dice que es el tipo de cambio; la contadora sospecha de los descuentos. Tienes ventas, costo y descuentos por línea.",
    ask: "Determina cuánto de la caída viene del costo, cuánto de los descuentos y cuánto de la mezcla de productos.",
    evidence: "Separa los tres efectos con los datos y concluye cuál pesa más.",
    contexts: ["comercialización de refacciones"],
  },
  {
    id: "ej.fin.4", academy: "finanzas", level: 4, format: "inmersivo", skills: ["fin.presupuesto", "est.recursos", "lid.equipos"],
    title: "Defender el presupuesto",
    situation: "Comité de presupuesto en una empresa de logística. Tienes que equilibrar caja, la compra de camiones y el plan de contrataciones. La directora de operaciones y el director de personas ya te escribieron, cada uno con su urgencia.",
    ask: "Presenta un presupuesto que cierre, explica los costos de tu decisión y responde a las dos objeciones.",
    evidence: "El presupuesto cuadra, muestra escenarios y trata con respeto y claridad lo que cada área pierde.",
    contexts: ["logística y transporte"],
  },
  {
    id: "ej.fin.5", academy: "finanzas", level: 5, format: "repaso", skills: ["fin.capital_trabajo"],
    title: "Capital de trabajo en dos mundos",
    situation: "Resolviste el ciclo de efectivo de una cadena de tiendas de ropa, que paga a proveedores a treinta días y vende de contado. Ahora ves una empresa de software que cobra anualidades por adelantado y paga sueldos cada quincena.",
    ask: "Explica por qué al software le sobra caja cuando crece y a la tienda le falta, y qué riesgo esconde cada caso.",
    evidence: "Aplica el mismo principio a los dos negocios y nombra un riesgo propio de cada uno.",
    contexts: ["tiendas de ropa", "software por suscripción"],
  },
  {
    id: "ej.fin.6", academy: "finanzas", level: 6, format: "integrador", skills: ["fin.financiamiento", "fin.flujo", "rie.stakeholders", "lid.negociacion"],
    title: "La línea de crédito que no se renueva",
    situation: "El banco avisa que no renovará la línea de crédito de una constructora mediana si no mejora sus números en noventa días. Hay dos obras en curso, proveedores esperando pago y un fondo interesado en entrar como socio con condiciones duras.",
    ask: "Arma el plan de financiamiento con escenarios y prepara lo que dirás al comité del banco y a los socios actuales.",
    evidence: "Presenta escenarios con números, decide qué cede en la negociación y explica las consecuencias para cada parte.",
    contexts: ["construcción"],
  },
];
