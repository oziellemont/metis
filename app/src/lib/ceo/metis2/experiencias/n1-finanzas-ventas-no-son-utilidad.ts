/**
 * MÊTIS 2.0 · Repositorio Académico · lote 02 (paquete 1.1) · EDIT-N1-008 · Finanzas
 * «Las ventas no son la utilidad»
 *
 * «fuente»: texto tal cual del paquete. «adaptado»: el paquete lo describe y aquí se redactó.
 * «conversion»: pieza añadida al convertir. Las cifras son las del paquete, sin cambios.
 */
import type { Experiencia } from "./tipos";

export const N1_FINANZAS_VENTAS_NO_SON_UTILIDAD: Experiencia = {
  id: "exp.n1.fin.ventas-no-son-utilidad",
  editorialId: "EDIT-N1-008",
  slug: "ventas-y-utilidad",
  version: 1,
  packageVersion: "1.1",
  title: "Las ventas no son la utilidad",
  academy: "finanzas",
  skills: { primary: "fin.resultados", secondary: ["fin.lenguaje", "fin.presupuesto"] },
  level: 1,
  sourceIds: ["HBS_AM", "STAN_CORE"],
  provenance: "creacion_original",
  minutes: [7, 9],
  objectives: [
    "Reconocer ventas, costo de ventas, utilidad bruta, gastos de operación y resultado operativo en un estado de resultados simplificado.",
    "Comprender que la utilidad depende de más que el volumen de ventas.",
  ],
  characters: [{ id: "patricia", name: "Patricia", role: "Administra una pequeña marca de libretas" }],
  docs: [
    {
      id: "A", letter: "A", title: "Estado de resultados simplificado", unit: "En pesos; sin intereses, impuestos ni depreciación", cols: ["Concepto", "Septiembre", "Octubre"],
      rows: [
        { id: "A.ventas", label: "Ventas netas", cells: ["80,000", "90,000"], nota: { origen: "conversion", text: "Lo que se vendió en el mes. Es el punto de partida, no la ganancia." } },
        { id: "A.costo", label: "Costo de ventas", cells: ["48,000", "60,000"], nota: { origen: "adaptado", text: "Papel, encuadernación y materiales de las libretas que se vendieron." } },
        { id: "A.bruta", label: "Utilidad bruta", cells: ["32,000", "30,000"], strong: true, nota: { origen: "adaptado", text: "Ventas netas menos costo de ventas. Septiembre: 80,000 − 48,000 = 32,000." } },
        { id: "A.gastos", label: "Gastos de operación", cells: ["22,000", "23,000"], nota: { origen: "adaptado", text: "Renta, administración y publicidad: lo que cuesta operar, se venda mucho o poco." } },
        { id: "A.operativo", label: "Resultado operativo", cells: ["10,000", "7,000"], strong: true, nota: { origen: "adaptado", text: "Utilidad bruta menos gastos de operación. Septiembre: 32,000 − 22,000 = 10,000." } },
      ],
    },
    {
      id: "B", letter: "B", title: "Nota del contador", unit: "Adjunta al reporte",
      rows: [
        { id: "B.costo", label: "El costo de ventas incluye papel, encuadernación y materiales de los productos vendidos." },
        { id: "B.gastos", label: "Los gastos de operación incluyen renta, administración y publicidad." },
        { id: "B.banco", label: "Este reporte no explica por sí solo el dinero disponible en el banco.", nota: { origen: "conversion", text: "Para saber cuánto dinero hay hacen falta otros datos: qué se cobró y qué se pagó." } },
      ],
    },
  ],
  moments: ["El correo", "Los documentos", "Qué es cada renglón", "Utilidad bruta", "Qué cambió", "Vender más", "Tu respuesta", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "patricia", channel: "Correo",
      text: "Vendimos más que el mes pasado, pero siento que nos queda menos dinero. El reporte tiene tantos renglones que me pierdo. ¿Me ayudas a leerlo?",
      role: "Patricia te pide ayuda como asesor invitado. No administras la marca: la acompañas a leer su reporte.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "Un reporte y la nota que lo acompaña",
      prompt: "Toca cada renglón para ver qué significa. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "renglones",
    },
    {
      id: "renglones", kind: "clasificar", moment: 2, origen: "adaptado", from: null,
      text: "Cada renglón del reporte responde una pregunta distinta.",
      prompt: "¿Es una venta, un costo directamente asociado a lo vendido o un gasto para operar?",
      docs: ["A", "B"],
      groups: [{ id: "venta", label: "Venta" }, { id: "costo", label: "Costo asociado a lo vendido" }, { id: "gasto", label: "Gasto para operar" }],
      items: [
        { id: "ventas", text: "Ventas netas", group: "venta", why: "Es lo que se vendió en el mes." },
        { id: "costo", text: "Costo de ventas", group: "costo", why: "Es lo que costaron los productos que se vendieron." },
        { id: "papel", text: "Papel y encuadernación de las libretas vendidas", group: "costo", why: "La nota del contador los pone dentro del costo de ventas." },
        { id: "gastos", text: "Gastos de operación", group: "gasto", why: "Es lo que cuesta operar el negocio, aparte de producir." },
        { id: "renta", text: "Renta, administración y publicidad", group: "gasto", why: "La nota del contador los pone dentro de los gastos de operación." },
      ],
      right: "Ventas, menos el costo de lo vendido, da la utilidad bruta. A la utilidad bruta se le restan los gastos de operación y queda el resultado operativo.",
      next: "bruta",
    },
    {
      id: "bruta", kind: "decision", moment: 3, origen: "fuente", from: "patricia", text: "¿La utilidad bruta es todo lo que ganamos?",
      options: [
        {
          id: "si", tipo: "concepto_erroneo", origen: "adaptado", next: "cambios",
          text: "Sí: es lo que queda de las ventas después de los costos.",
          consequence: [{ who: "patricia", text: "Entonces en septiembre ganamos $32,000. Pero el último renglón dice $10,000; no me cuadra." }],
          feedback: "A la utilidad bruta todavía hay que restarle los gastos de operación. En septiembre: 32,000 − 22,000 = 10,000. Ese es el resultado operativo.",
        },
        {
          id: "no", tipo: "defendible", origen: "adaptado", next: "cambios",
          text: "No: todavía falta restarle los gastos de operación.",
          consequence: [{ who: "patricia", text: "Ya veo: 32,000 menos 22,000 de gastos da los 10,000 del último renglón." }],
          feedback: "Distinguiste utilidad bruta de resultado operativo: la primera resta solo el costo de lo vendido; el segundo resta además lo que cuesta operar.",
        },
        {
          id: "banco", tipo: "concepto_erroneo", origen: "conversion", next: "cambios",
          text: "No: lo que ganamos es lo que quedó en el banco.",
          consequence: [{ who: "patricia", text: "El contador escribió que este reporte no explica por sí solo el dinero del banco. Entonces eso no lo puedo saber de aquí." }],
          feedback: "El saldo del banco depende de cobros y pagos; este reporte no lo muestra. Lo que sí muestra es el resultado operativo: utilidad bruta menos gastos de operación.",
        },
      ],
    },
    {
      id: "cambios", kind: "calcular", moment: 4, origen: "adaptado", from: "patricia",
      text: "Ayúdame a ver qué cambió de septiembre a octubre.",
      prompt: "Escribe de cuánto fue cada cambio. Puedes usar la calculadora.",
      docs: ["A"],
      fields: [
        { id: "ventas", label: "Ventas netas: ¿cuánto subieron?", answer: 10000, unit: "$", hint: "Octubre menos septiembre, en el renglón de ventas netas.", calc: "90,000 − 80,000 = 10,000" },
        { id: "costo", label: "Costo de ventas: ¿cuánto subió?", answer: 12000, unit: "$", hint: "Octubre menos septiembre, en el renglón de costo de ventas.", calc: "60,000 − 48,000 = 12,000" },
        { id: "bruta", label: "Utilidad bruta: ¿cuánto bajó?", answer: 2000, unit: "$", hint: "Septiembre menos octubre, en el renglón de utilidad bruta.", calc: "32,000 − 30,000 = 2,000" },
        { id: "gastos", label: "Gastos de operación: ¿cuánto subieron?", answer: 1000, unit: "$", hint: "Octubre menos septiembre, en el renglón de gastos de operación.", calc: "23,000 − 22,000 = 1,000" },
        { id: "operativo", label: "Resultado operativo: ¿cuánto bajó?", answer: 3000, unit: "$", hint: "Septiembre menos octubre, en el último renglón.", calc: "10,000 − 7,000 = 3,000" },
      ],
      right: "Las ventas subieron $10,000, pero el costo de ventas subió $12,000: por eso la utilidad bruta bajó $2,000. Con $1,000 más de gastos, el resultado operativo bajó $3,000.",
      next: "mas",
    },
    {
      id: "mas", kind: "decision", moment: 5, origen: "fuente", from: "patricia", text: "Si vendemos más, ¿siempre ganaremos más?",
      options: [
        {
          id: "no", tipo: "defendible", origen: "adaptado", next: "explica",
          text: "No siempre: costos y gastos pueden crecer más que las ventas.",
          consequence: [{ who: "patricia", text: "Es lo que pasó en octubre: vendimos $10,000 más y el resultado bajó $3,000." }],
          feedback: "Vender más puede coincidir con ganar menos si el costo de lo vendido o los gastos crecen en mayor medida. El reporte muestra que pasó; no dice por qué.",
        },
        {
          id: "si", tipo: "concepto_erroneo", origen: "adaptado", next: "explica",
          text: "Sí: con más ventas siempre queda más utilidad al final.",
          consequence: [{ who: "patricia", text: "Pero octubre tuvo más ventas que septiembre y el resultado operativo fue menor: $7,000 contra $10,000." }],
          feedback: "Las ventas subieron $10,000 y el resultado operativo bajó $3,000. La utilidad depende también del costo de lo vendido y de los gastos.",
        },
        {
          id: "recortar", tipo: "riesgosa", origen: "adaptado", next: "explica",
          text: "No, y por eso hay que recortar ya el gasto en publicidad.",
          consequence: [{ who: "patricia", text: "¿Publicidad? Los gastos subieron $1,000 en total; el reporte no dice cuánto fue publicidad ni qué pasaría si la quito." }],
          feedback: "El reporte no desglosa los gastos ni dice qué efecto tendría recortar uno. Lo que más creció fue el costo de ventas, y tampoco hay datos para atribuirle una causa.",
        },
      ],
    },
    {
      id: "explica", kind: "redactar", moment: 6, origen: "fuente", from: "patricia",
      ask: "Dímelo en una frase, con las cifras, para que no se me olvide.",
      prompt: "Explícale a Patricia por qué vender más no garantizó ganar más en octubre.",
      reference: "En octubre vendiste $10,000 más, pero el costo de lo vendido subió $12,000 y los gastos $1,000; por eso el resultado operativo bajó de $10,000 a $7,000.",
      ideas: ["Liga la explicación con cifras del reporte.", "Menciona que el costo de ventas o los gastos crecieron más que las ventas.", "No inventa una causa: el reporte no habla de descuentos, proveedores ni errores."],
      next: "cierre",
    },
    { id: "cierre", kind: "cierre", moment: 7, origen: "conversion", text: "Terminaste la práctica con Patricia. Aquí queda lo que decidiste, lo que escribiste y el concepto, para consultarlo cuando quieras." },
  ],
  theory: {
    id: "teoria.fin.estado-de-resultados", title: "Cómo se lee un estado de resultados", origen: "fuente",
    text: "El estado de resultados compara ingresos y gastos correspondientes a un periodo. Primero muestra las ventas netas. Después descuenta el costo de ventas de los productos o servicios entregados: así se obtiene la utilidad bruta. Más abajo aparecen los gastos de operación, como administración o publicidad. Al descontarlos de la utilidad bruta se obtiene el resultado operativo en este reporte simplificado. Vender más puede coincidir con ganar menos si aumenta demasiado el costo de lo vendido o los gastos operativos. Este reporte no es lo mismo que el flujo de efectivo: para saber cuánto dinero hay disponible hacen falta otros datos.",
  },
  calculations: [
    "Septiembre: 80,000 − 48,000 = 32,000 de utilidad bruta; 32,000 − 22,000 = 10,000 de resultado operativo",
    "Octubre: 90,000 − 60,000 = 30,000 de utilidad bruta; 30,000 − 23,000 = 7,000 de resultado operativo",
    "Cambios: 90,000 − 80,000 = 10,000 en ventas; 60,000 − 48,000 = 12,000 en costo de ventas; 23,000 − 22,000 = 1,000 en gastos",
    "Resultado operativo: 10,000 − 7,000 = 3,000 menos en octubre",
  ],
  variant: {
    id: "exp.n1.fin.ventas-no-son-utilidad.variante-b",
    title: "Otra situación, sin apoyo",
    setting: "Un hotel pequeño cierra el mes con estos tres datos. Nadie te los explica: ubica, calcula y responde.",
    question: "¿Cuánto le quedó al hotel después de operar?",
    intro: "Otra empresa y otras cifras. Sin explicaciones, sin los documentos de la práctica y sin el concepto a la mano. Hay calculadora. Lo que escribas queda en espera de revisión de una persona.",
    calculator: true,
    docs: [
      {
        id: "V", letter: "V", title: "Hotel pequeño · datos del mes", unit: "En pesos",
        rows: [
          { id: "V.adm", label: "Administración y venta", amount: 30000 },
          { id: "V.servicios", label: "Servicios vendidos a huéspedes", amount: 120000 },
          { id: "V.directos", label: "Costos directos del servicio", amount: 72000 },
        ],
      },
    ],
    tasks: [
      {
        id: "estructura", kind: "clasificar", criterion: "Estructura del reporte", weight: 40, origen: "adaptado",
        prompt: "Ubica cada dato en el renglón del estado de resultados que le corresponde.",
        groups: [{ id: "ventas", label: "Ventas netas" }, { id: "costo", label: "Costo de ventas" }, { id: "gastos", label: "Gastos de operación" }],
        items: [
          { id: "adm", text: "Administración y venta", group: "gastos" },
          { id: "servicios", text: "Servicios vendidos a huéspedes", group: "ventas" },
          { id: "directos", text: "Costos directos del servicio", group: "costo" },
        ],
        calc: "Los servicios vendidos son las ventas netas; los costos directos del servicio, el costo de ventas; administración y venta, gastos de operación.",
      },
      { id: "bruta", kind: "cifra", unit: "$", criterion: "Relaciones y cálculos: utilidad bruta", weight: 20, origen: "fuente", prompt: "¿Cuál fue la utilidad bruta del mes?", answer: 48000, calc: "120,000 − 72,000 = 48,000" },
      { id: "operativo", kind: "cifra", unit: "$", criterion: "Relaciones y cálculos: resultado operativo", weight: 20, origen: "fuente", prompt: "¿Cuál fue el resultado operativo del mes?", answer: 18000, calc: "48,000 − 30,000 = 18,000" },
      {
        id: "caja", kind: "texto", criterion: "Distinción entre resultado y caja", weight: 20, origen: "adaptado",
        prompt: "Explica por qué el resultado operativo que calculaste no dice cuánto dinero hay en la cuenta del hotel.",
        reference: "El resultado operativo compara lo vendido con lo que costó en el mes. El dinero en la cuenta depende de lo que ya se cobró y se pagó, y de cuánto había antes; esos datos no están aquí.",
        ideas: ["Separa resultado del periodo y dinero disponible.", "Menciona que faltan datos de cobros, pagos o saldo inicial.", "No afirma un saldo de caja."],
      },
    ],
    passAt: 70,
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-13", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "El paso «qué cambió» se convirtió en cinco cifras por escribir con pista y calculadora. Como el signo se lee en el propio reporte, cada campo dice si el renglón subió o bajó y se pide solo de cuánto fue el cambio.",
    "La tercera opción de «¿La utilidad bruta es todo lo que ganamos?» (lo que quedó en el banco) es nueva; retoma la advertencia de la nota del contador.",
    "La ruta «recortar ya el gasto en publicidad» se redactó a partir de la retroalimentación del paquete para quien recomienda recortar un gasto exacto.",
    "Variante: los tres datos se muestran en otro orden y el renglón de gastos se llama «Administración y venta».",
    "Variante: el paquete da 40 puntos a «relaciones y cálculos»; se repartieron 20 a la utilidad bruta y 20 al resultado operativo.",
    "Variante: «distinción entre resultado y caja» (20 puntos) es una respuesta escrita. No se califica de forma automática: queda en espera de revisión de una persona. La pregunta no menciona la cifra para no dar la respuesta del cálculo anterior.",
    "Los márgenes brutos (40 % y 33⅓ %) son opcionales en el paquete; no se piden.",
    "La regla para pasar la variante (70 de 100) es provisional.",
  ],
};
