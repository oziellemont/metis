/**
 * MÊTIS 2.0 · Repositorio Académico v1.0 · EDIT-N1-002 · Finanzas
 * «Hay utilidad; ¿por qué no hay efectivo?»
 *
 * Conversión del texto editorial a recorrido jugable. «fuente»: texto tal cual del paquete.
 * «adaptado»: el paquete lo describe y aquí se redactó. «conversion»: pieza añadida al convertir.
 * Lo adaptado y lo añadido esperan revisión editorial. Las cifras son las del paquete, sin cambios.
 */
import type { Experiencia } from "./tipos";
import { PACKAGE_VERSION } from "./fuentes";

export const N1_FINANZAS_UTILIDAD_CAJA: Experiencia = {
  id: "exp.n1.fin.utilidad-caja",
  editorialId: "EDIT-N1-002",
  slug: "utilidad-y-efectivo",
  version: 1,
  packageVersion: PACKAGE_VERSION,
  title: "Hay utilidad; ¿por qué no hay efectivo?",
  academy: "finanzas",
  skills: { primary: "fin.lenguaje", secondary: ["fin.resultados", "fin.flujo"] },
  level: 1,
  sourceIds: ["STAN_CORE", "WH_CORE"],
  provenance: "creacion_original",
  minutes: [6, 8],
  objectives: [
    "Distinguir ingreso facturado, cobro, gasto, pago, utilidad y caja.",
    "Interpretar un estado de resultados elemental sin confundirlo con el saldo bancario.",
  ],
  characters: [{ id: "marta", name: "Marta", role: "Propietaria de una imprenta" }],
  docs: [
    {
      id: "A", letter: "A", title: "Estado de resultados de octubre", unit: "Simplificado, en pesos",
      rows: [
        { id: "A.ventas", label: "Ventas de servicios entregados", amount: 100000, nota: { origen: "fuente", text: "Ingreso reconocido cuando se presta el servicio; el efectivo puede cobrarse después." } },
        { id: "A.costos", label: "Costos de materiales y producción asociados", amount: -60000, nota: { origen: "conversion", text: "Lo que costó producir los trabajos entregados en octubre, se haya pagado ya o no." } },
        { id: "A.gastos", label: "Gastos de operación del mes", amount: -25000, nota: { origen: "conversion", text: "Lo que costó operar el negocio en octubre, aparte de producir." } },
        { id: "A.utilidad", label: "Utilidad operativa simplificada", amount: 15000, suma: { ids: ["A.ventas", "A.costos", "A.gastos"], signs: [1, -1, -1] }, nota: { origen: "fuente", text: "100,000 − 60,000 − 25,000 = 15,000" } },
      ],
      foot: "El ejemplo deja fuera impuestos, intereses y depreciación.",
    },
    {
      id: "B", letter: "B", title: "Movimiento de efectivo de octubre", unit: "Simplificado, en pesos",
      rows: [
        { id: "B.inicial", label: "Saldo inicial de efectivo", amount: 25000, nota: { origen: "conversion", text: "El dinero con que la imprenta empezó octubre." } },
        { id: "B.cobros", label: "Cobros efectivos de clientes", amount: 55000, nota: { origen: "fuente", text: "Dinero que efectivamente entró." } },
        { id: "B.pagos_costos", label: "Pagos efectivos de materiales y producción", amount: -50000, nota: { origen: "adaptado", text: "Dinero que efectivamente salió para materiales y producción. Algunos costos facturados aún no se pagaron." } },
        { id: "B.pagos_gastos", label: "Pagos de gastos de operación", amount: -25000, nota: { origen: "conversion", text: "Dinero que efectivamente salió para operar el negocio." } },
        { id: "B.final", label: "Saldo final de efectivo", amount: 5000, suma: { ids: ["B.inicial", "B.cobros", "B.pagos_costos", "B.pagos_gastos"], signs: [1, 1, -1, -1] }, nota: { origen: "conversion", text: "25,000 + 55,000 − 50,000 − 25,000 = 5,000" } },
      ],
    },
  ],
  moments: ["El mensaje", "Los documentos", "El diagnóstico", "Dato nuevo", "Tu respuesta", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "marta", channel: "WhatsApp",
      text: "El contador reporta ganancia este mes, pero el viernes no alcanza para la nómina. ¿El reporte está mal?",
      role: "Marta te pide orientación como asesor temporal. No diriges la imprenta: la ayudas a entender qué está pasando.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "Dos documentos, dos preguntas distintas",
      prompt: "Toca cualquier renglón para ver qué significa. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "diagnostico",
    },
    {
      id: "diagnostico", kind: "decision", moment: 2, origen: "fuente", from: "marta", text: "¿Qué explica la diferencia?",
      options: [
        {
          id: "cobranza", tipo: "defendible", origen: "adaptado", next: "dato",
          text: "Revisemos qué falta por cobrar y qué pagos vienen en camino.",
          consequence: [{ who: "marta", text: "Va. Abro mi lista de cobranza y el calendario de pagos." }],
          feedback: "Fuiste a lo que explica la diferencia: qué se vendió y aún no se cobra, y qué pagos vienen. Cobrar antes ayuda, pero no resuelve cualquier problema de caja.",
        },
        {
          id: "contador", tipo: "concepto_erroneo", origen: "adaptado", next: "comprobar",
          text: "Pídele al contador que corrija: utilidad y caja deben coincidir.",
          consequence: [{ who: "marta", text: "Le escribí. Dice que el reporte está bien: registra lo que se entregó en octubre, no lo que se cobró." }],
          feedback: "Utilidad y caja no tienen por qué coincidir. El estado de resultados cuenta lo entregado en el mes; el efectivo cambia hasta que se cobra o se paga. El reporte puede estar bien y la caja quedar corta al mismo tiempo.",
        },
        {
          id: "aplazar", tipo: "riesgosa", origen: "adaptado", next: "comprobar",
          text: "Aplaza los pagos que puedas y luego revisamos compromisos.",
          consequence: [{ who: "marta", text: "Puedo aplazar al proveedor de papel, pero sigo sin saber por qué falta dinero si hubo ganancia." }],
          feedback: "Aplazar pagos puede dar aire, pero se decide sin saber qué compromisos hay y no responde la pregunta de Marta. Primero hay que ver por qué la utilidad no llegó a la caja.",
        },
      ],
    },
    {
      id: "comprobar", kind: "senalar", moment: 2, origen: "conversion", from: null,
      text: "Antes de seguir, compruébalo en los documentos.",
      prompt: "Toca el renglón que dice cuánto dinero entró de verdad en octubre.",
      docs: ["A", "B"], correct: "B.cobros",
      right: "Entraron $55,000 de los $100,000 vendidos. La utilidad ya cuenta los $100,000; la caja solo recibió $55,000.",
      wrong: {
        "A.ventas": "Ese renglón dice cuánto se entregó en octubre, se haya cobrado o no.",
        "A.utilidad": "La utilidad es el resultado del mes, no dinero que entró.",
        "B.inicial": "Ese es el dinero con que empezó el mes, no lo que entró en octubre.",
        "B.final": "Ese es el dinero que quedó al final, después de cobros y pagos.",
      },
      fallback: "Ese renglón es un costo o una salida de dinero. Busca lo que entró de los clientes.",
      next: "dato",
    },
    {
      id: "dato", kind: "dato", moment: 3, origen: "adaptado", title: "Marta abre su lista de cobranza",
      items: ["De las ventas reconocidas en octubre, $45,000 se cobran el mes siguiente.", "La nómina del viernes es de $12,000."],
      next: "promesa",
    },
    {
      id: "promesa", kind: "decision", moment: 3, origen: "conversion", from: "marta", text: "Entonces, ¿le aviso al equipo que el viernes cobran sin falta?",
      options: [
        {
          id: "utilidad", tipo: "concepto_erroneo", origen: "adaptado", next: "respuesta",
          text: "Avísales: hubo utilidad de $15,000 y la nómina es de solo $12,000.",
          consequence: [{ who: "marta", text: "Les avisé. Luego abrí la cuenta del banco: hay $5,000 y la nómina es de $12,000. Faltan $7,000 y ya di mi palabra." }],
          feedback: "El saldo actual, $5,000, no alcanza para una nómina de $12,000. La utilidad de octubre no es dinero disponible: parte sigue por cobrar.",
        },
        {
          id: "confirmar", tipo: "defendible", origen: "adaptado", next: "respuesta",
          text: "Primero confirma el saldo disponible y qué día entra el cobro.",
          consequence: [{ who: "marta", text: "Confirmé con el banco: hay $5,000 disponibles, y los $45,000 no entran antes del viernes. Faltan $7,000; prefiero saberlo hoy." }],
          feedback: "Antes de prometer un pago pediste lo que hace falta saber: cuánto efectivo hay y cuándo entra el siguiente cobro. Con eso Marta puede decidir con tiempo.",
        },
        {
          id: "cartera", tipo: "riesgosa", origen: "conversion", next: "respuesta",
          text: "Cuenta con los $45,000 por cobrar; con eso alcanza de sobra.",
          consequence: [{ who: "marta", text: "Llamé al cliente que más me debe. Paga hasta el mes siguiente, como dice la lista. Para el viernes no cuento con ese dinero." }],
          feedback: "Esos $45,000 existen, pero se cobran el mes siguiente. Prometer un pago del viernes con un cobro sin fecha confirmada pone en riesgo la nómina.",
        },
      ],
    },
    {
      id: "respuesta", kind: "redactar", moment: 4, origen: "adaptado", from: "marta",
      ask: "Explícamelo en una frase, para entenderlo y contárselo a mi equipo.",
      prompt: "Escríbele a Marta, en una oración, por qué un negocio con utilidad puede quedarse sin efectivo.",
      reference: "La utilidad cuenta lo que entregaste en el mes aunque no lo hayas cobrado; el efectivo solo cambia cuando el dinero entra o sale.",
      ideas: ["Dice que hay ventas ya contadas que todavía no se cobran.", "Separa la utilidad (resultado del mes) del efectivo (dinero disponible).", "No concluye que el reporte del contador esté mal."],
      next: "cierre",
    },
    {
      id: "cierre", kind: "cierre", moment: 5, origen: "conversion",
      text: "Terminaste la práctica con Marta. Aquí queda lo que decidiste, lo que escribiste y el concepto, para consultarlo cuando quieras.",
    },
  ],
  theory: {
    id: "teoria.fin.utilidad-caja", title: "Utilidad no es efectivo", origen: "fuente",
    text: "Una empresa puede reconocer ingresos por un trabajo entregado aunque el cliente pague después. La utilidad compara ingresos del periodo contra costos y gastos correspondientes. El efectivo cambia cuando se cobra o paga. Por eso utilidad y caja no necesariamente coinciden. Tres documentos distintos responden preguntas distintas: estado de resultados (desempeño de un periodo), balance (activos, deudas y patrimonio en una fecha) y flujo de efectivo (entradas y salidas). En una decisión urgente importa preguntar cuánto efectivo hay disponible y cuándo se esperan cobros y pagos.",
  },
  calculations: [
    "Utilidad operativa = 100,000 − 60,000 − 25,000 = 15,000",
    "Flujo neto antes de financiamiento = 55,000 − 50,000 − 25,000 = −20,000",
    "Saldo final = 25,000 − 20,000 = 5,000",
    "Nómina de 12,000 − saldo de 5,000 = faltan 7,000",
  ],
  variant: {
    id: "exp.n1.fin.utilidad-caja.variante-a",
    title: "Otra situación, sin apoyo",
    setting: "Un estudio de diseño cierra el mes con estos datos. Nadie te los explica: lee, calcula y responde.",
    question: "¿Ganó dinero y qué saldo le queda?",
    intro: "Otra empresa y otras cifras. Sin explicaciones, sin documentos de la práctica y sin el concepto a la mano. Son tres cálculos.",
    docs: [
      {
        id: "V", letter: "V", title: "Estudio de diseño · datos del mes", unit: "En pesos",
        rows: [
          { id: "V.ingresos", label: "Ingresos reconocidos por proyectos entregados", amount: 80000 },
          { id: "V.costos", label: "Costos de los proyectos", amount: 38000 },
          { id: "V.gastos", label: "Gastos de operación", amount: 25000 },
          { id: "V.inicial", label: "Efectivo al empezar el mes", amount: 25000 },
          { id: "V.cobros", label: "Cobros recibidos de clientes", amount: 35000 },
          { id: "V.pagos_costos", label: "Pagos de costos", amount: 30000 },
          { id: "V.pagos_gastos", label: "Pagos de gastos", amount: 25000 },
        ],
      },
    ],
    tasks: [
      { id: "por_cobrar", kind: "cifra", unit: "$", criterion: "Diferencia entre ingreso y cobro", weight: 35, origen: "conversion", prompt: "¿Cuánto de lo que el estudio reconoció como ingreso sigue sin cobrarse?", answer: 45000, calc: "80,000 − 35,000 = 45,000" },
      { id: "utilidad", kind: "cifra", unit: "$", criterion: "Utilidad", weight: 30, origen: "adaptado", prompt: "¿Cuál fue la utilidad del mes?", answer: 17000, calc: "80,000 − 38,000 − 25,000 = 17,000" },
      { id: "saldo", kind: "cifra", unit: "$", criterion: "Flujo y saldo de efectivo", weight: 35, origen: "adaptado", prompt: "¿Con cuánto efectivo terminó el mes?", answer: 5000, calc: "25,000 + 35,000 − 30,000 − 25,000 = 5,000" },
    ],
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-12", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "La segunda decisión («¿le aviso al equipo que el viernes cobran?») se redactó a partir del momento 3 del paquete, que pide confirmar saldo, fecha de cobro o crédito antes de prometer el pago.",
    "Las respuestas de Marta después de cada decisión son nuevas: el paquete describe qué debe enseñar cada ruta, no el diálogo.",
    "Quien elige una ruta no defendible en el diagnóstico pasa por una comprobación sobre los documentos (tocar el renglón de lo que entró). El paquete no la trae; se añadió para que la consecuencia sea hacer algo, no solo leer.",
    "El criterio «diferencia entre ingreso y cobro» de la variante se pregunta como una cifra por calcular (lo que sigue sin cobrarse).",
    "La «advertencia de exactitud» del paquete habla de un sobregiro de $10,000 y caja libre de $0; la tabla y los cálculos dan saldo final de $5,000. Se siguió la tabla.",
    "La variante repite tres cifras de la práctica (25,000 de efectivo inicial y de gastos, 45,000 por cobrar y 5,000 de saldo final).",
    "No hay regla para pasar la variante: la regla provisional se retiró y el puntaje se muestra sin veredicto.",
  ],
};
