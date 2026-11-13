/**
 * MÊTIS 2.0 · Repositorio Académico v1.3 · EDIT-N1-020 · Finanzas
 * «El dinero entra el jueves»
 *
 * Conversión del texto editorial a recorrido jugable. «fuente»: texto tal cual del paquete.
 * «adaptado»: el paquete lo describe y aquí se redactó. «conversion»: pieza añadida al convertir.
 * Lo adaptado y lo añadido esperan revisión editorial. Las cifras son las del paquete, sin cambios.
 */
import type { Experiencia } from "./tipos";

export const N1_FINANZAS_DINERO_JUEVES: Experiencia = {
  id: "exp.n1.fin.el-dinero-entra-el-jueves",
  editorialId: "EDIT-N1-020",
  slug: "el-dinero-entra-el-jueves",
  version: 1,
  packageVersion: "1.3",
  title: "El dinero entra el jueves",
  academy: "finanzas",
  skills: { primary: "fin.flujo", secondary: ["fin.lenguaje"] },
  level: 1,
  sourceIds: ["STAN_CORE", "HBS_FIN"],
  provenance: "creacion_original",
  minutes: [8, 10],
  objectives: [
    "Diferenciar una venta de su cobro.",
    "Reconocer el saldo de caja en cada fecha y detectar un faltante temporal aunque el saldo de la semana termine positivo.",
    "Proponer una acción sin afirmar que ya ocurrió.",
  ],
  characters: [{ id: "nora", name: "Nora", role: "Dueña de una panadería que también entrega a cafeterías" }],
  docs: [
    {
      id: "A", letter: "A", title: "Compromisos confirmados de la semana", unit: "En pesos. Entradas con signo más, salidas con signo menos",
      rows: [
        { id: "A.inicial", label: "Lunes al abrir · efectivo inicial (es un saldo, no un movimiento)", amount: 18000, nota: { origen: "fuente", text: "El dinero con que la panadería empieza la semana." } },
        { id: "A.materias", label: "Lunes · pago de materias primas", amount: -10000, nota: { origen: "conversion", text: "Sale el lunes. Después de este pago quedan 8,000." } },
        { id: "A.nomina", label: "Miércoles · nómina", amount: -14000, nota: { origen: "conversion", text: "Sale el miércoles, antes de que entre el cobro de la cafetería." } },
        { id: "A.cobro", label: "Jueves · cobro de la factura a una cafetería", amount: 25000, nota: { origen: "adaptado", text: "Es dinero que entra el jueves, un día después de la nómina." } },
        { id: "A.proveedor", label: "Viernes · pago a otro proveedor", amount: -8000, nota: { origen: "conversion", text: "Sale el viernes, cuando el cobro del jueves ya entró." } },
        { id: "A.final", label: "Saldo al cierre del viernes", amount: 11000, strong: true, suma: { ids: ["A.inicial", "A.materias", "A.nomina", "A.cobro", "A.proveedor"], signs: [1, -1, -1, 1, -1] }, nota: { origen: "conversion", text: "Es el saldo al final de la semana. No dice cuánto había el miércoles." } },
      ],
      foot: "No hay crédito ni otro dinero disponible confirmado.",
    },
    {
      id: "B", letter: "B", title: "Factura y nota del contador", unit: "Venta previa a una cafetería",
      rows: [
        { id: "B.factura", label: "Factura emitida por una venta previa", amount: 25000, nota: { origen: "fuente", text: "La venta ya está registrada. Es un derecho de cobro, todavía no es efectivo." } },
        { id: "B.fecha", label: "Cobro acordado con la cafetería: jueves", nota: { origen: "fuente", text: "Hasta el jueves, ese dinero no está en la cuenta." } },
        { id: "B.contador", label: "Nota del contador: «La venta ya fue registrada, pero ese importe no está disponible como efectivo hasta que se cobre».", nota: { origen: "fuente", text: "Registrar una venta no la convierte en dinero disponible." } },
      ],
    },
  ],
  moments: ["El mensaje", "Los documentos", "El calendario", "¿Hay problema?", "Qué proponer", "Si el cliente acepta", "Tu respuesta", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "nora", channel: "WhatsApp",
      text: "El viernes, según mis cuentas, tendremos dinero. Pero la nómina se paga el miércoles. ¿Estoy preocupándome sin razón?",
      role: "Nora te pide orientación como asesor invitado. No diriges la panadería: la ayudas a leer su semana.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "La semana de la panadería",
      prompt: "Toca cualquier renglón para ver qué significa. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "abrir",
    },
    {
      id: "abrir", kind: "decision", moment: 2, origen: "fuente", from: "nora", text: "¿Por dónde empezamos a revisarlo?",
      options: [
        {
          id: "calendario", tipo: "defendible", origen: "adaptado", next: "saldos",
          text: "Recorramos el calendario día por día, desde el lunes.",
          consequence: [{ who: "nora", text: "Va. Saco la libreta y anotamos cuánto queda después de cada pago y cada cobro." }],
          feedback: "Recorrer los días en orden muestra lo que el resumen del viernes esconde: cuánto dinero hay justo antes de cada pago.",
        },
        {
          id: "viernes", tipo: "riesgosa", origen: "adaptado", next: "saldos",
          text: "Veamos solo el resumen del viernes: es lo que importa.",
          consequence: [{ who: "nora", text: "El viernes quedan 11,000. Pero la nómina no se paga el viernes. Anotemos día por día para estar seguras." }],
          feedback: "El saldo del viernes es real, pero mirar solo el final oculta el problema de mitad de semana. Un pago se cumple con el dinero que hay ese día.",
        },
        {
          id: "sumar", tipo: "concepto_erroneo", origen: "conversion", next: "saldos",
          text: "Sumemos todo lo que entra y sale, sin fijarnos en el día.",
          consequence: [{ who: "nora", text: "Sumado da lo mismo que el viernes. Mi duda es si el miércoles alcanza. Anotemos día por día." }],
          feedback: "Sumar todo da el saldo final, no el de cada fecha. En flujo de efectivo el orden de los días importa tanto como los importes.",
        },
      ],
    },
    {
      id: "saldos", kind: "calcular", moment: 2, origen: "adaptado", from: "nora",
      text: "Anotemos cuánto queda en la cuenta después de cada día con movimientos.",
      prompt: "Usa el documento A. Escribe el saldo al cierre de cada día; para el miércoles, escribe cuánto falta.",
      docs: ["A"],
      fields: [
        { id: "lunes", label: "Saldo al cierre del lunes", answer: 8000, unit: "$", hint: "Empieza con el efectivo inicial y resta el pago del lunes.", calc: "18,000 − 10,000 = 8,000" },
        { id: "miercoles", label: "Después de la nómina del miércoles, ¿cuánto falta?", answer: 6000, unit: "$", hint: "Al saldo del lunes réstale la nómina. Si queda negativo, eso es lo que falta.", calc: "14,000 − 8,000 = 6,000 por cubrir" },
        { id: "jueves", label: "Saldo al cierre del jueves, si nada cambia", answer: 19000, unit: "$", hint: "El cobro del jueves primero cubre lo que faltaba el miércoles.", calc: "25,000 − 6,000 = 19,000" },
        { id: "viernes", label: "Saldo al cierre del viernes", answer: 11000, unit: "$", hint: "Al saldo del jueves réstale el pago al proveedor.", calc: "19,000 − 8,000 = 11,000" },
      ],
      right: "El lunes quedan $8,000; el miércoles faltan $6,000; el jueves quedan $19,000 y el viernes $11,000. La semana termina en positivo, pero el miércoles no alcanza.",
      next: "razonar",
    },
    {
      id: "razonar", kind: "decision", moment: 3, origen: "fuente", from: "nora", text: "Si al viernes terminamos con $11,000, entonces el miércoles no hay problema, ¿verdad?",
      options: [
        {
          id: "no_alcanza", tipo: "defendible", origen: "adaptado", next: "propuesta",
          text: "No: la nómina sale el miércoles y el cobro entra hasta el jueves.",
          consequence: [{ who: "nora", text: "Entonces faltan $6,000 justo el día de la nómina. Mejor saberlo hoy, que es lunes." }],
          feedback: "Lo detectaste: el dinero entra después de la nómina. El saldo final positivo no garantiza poder pagar a mitad de semana.",
        },
        {
          id: "final", tipo: "riesgosa", origen: "fuente", next: "comprobar",
          text: "Sí, el miércoles no hay problema: la semana cierra con $11,000.",
          consequence: [{ who: "nora", text: "Me quedo tranquila, entonces. Aunque en la libreta el miércoles quedó en rojo..." }],
          feedback: "El resultado semanal no garantiza capacidad para pagar a mitad de semana. El miércoles, después de la nómina, faltan $6,000.",
        },
        {
          id: "factura", tipo: "concepto_erroneo", origen: "fuente", next: "comprobar",
          text: "Sí: la factura de $25,000 ya está registrada, así que el dinero está.",
          consequence: [{ who: "nora", text: "El contador me dijo justo lo contrario: que la venta está registrada pero el dinero no está disponible hasta el jueves." }],
          feedback: "La factura es un derecho de cobro; el dinero está previsto para el jueves. Hasta entonces no sirve para pagar la nómina.",
        },
      ],
    },
    {
      id: "comprobar", kind: "senalar", moment: 3, origen: "conversion", from: null,
      text: "Antes de seguir, compruébalo en los documentos.",
      prompt: "Toca los dos renglones que explican por qué el miércoles falta dinero aunque el viernes sobre.",
      docs: ["A", "B"], correct: ["A.nomina", "A.cobro"],
      right: "La nómina de $14,000 sale el miércoles y el cobro de $25,000 entra el jueves: el dinero llega un día tarde para la nómina.",
      wrong: {
        "A.final": "Ese es el saldo al final de la semana. Justamente esconde lo que pasa a mitad.",
        "B.factura": "La factura dice que hay una venta registrada, no que el dinero ya esté en la cuenta.",
        "B.contador": "La nota confirma el problema, pero busca en el calendario los dos movimientos que chocan.",
        "A.inicial": "Ese es el dinero con que empieza la semana. Busca qué sale y qué entra cerca del miércoles.",
      },
      fallback: "Ese movimiento ocurre otro día. Busca lo que sale el miércoles y lo que entra después.",
      next: "propuesta",
    },
    {
      id: "propuesta", kind: "decision", moment: 4, origen: "fuente", from: "nora", text: "¿Qué hago para que el miércoles alcance?",
      options: [
        {
          id: "anticipo", tipo: "defendible", origen: "fuente", next: "dato",
          text: "Pide al cliente adelantar al menos $6,000 y espera que lo confirme.",
          consequence: [{ who: "nora", text: "Le escribo a la cafetería hoy mismo. Si no confirma antes del miércoles, necesito otro plan." }],
          feedback: "Es una medida razonable si el cliente la confirma antes de la nómina. Hasta que confirme, sigue siendo una posibilidad, no dinero.",
        },
        {
          id: "prestamo", tipo: "defendible", origen: "fuente", next: "dato",
          text: "Busca un préstamo y solo cuéntalo cuando el banco lo confirme.",
          consequence: [{ who: "nora", text: "Llamo al banco. Mientras no me confirmen, no cuento con ese dinero." }],
          feedback: "Buscar financiamiento puede cubrir el faltante, siempre que sea un compromiso confirmado y no un supuesto tratado como hecho.",
        },
        {
          id: "suponer", tipo: "riesgosa", origen: "adaptado", next: "dato",
          text: "Paga la nómina contando con un anticipo que aún nadie confirmó.",
          consequence: [{ who: "nora", text: "¿Y si la cafetería dice que no? El miércoles me quedaría sin poder pagarle al equipo." }],
          feedback: "Contar con dinero que nadie ha confirmado pone en riesgo la nómina. Ninguna opción debe presentarse como dinero ya obtenido.",
        },
        {
          id: "venta", tipo: "concepto_erroneo", origen: "conversion", next: "dato",
          text: "Registra el anticipo como una venta nueva para cerrar mejor.",
          consequence: [{ who: "nora", text: "Pero no es otra venta: es la misma factura de la cafetería, cobrada antes." }],
          feedback: "Adelantar un cobro cambia el momento en que llega el dinero; no crea una venta nueva.",
        },
      ],
    },
    {
      id: "dato", kind: "dato", moment: 5, origen: "fuente", title: "Supón que el cliente acepta",
      items: ["La cafetería confirma un anticipo de $7,000 el miércoles, a cuenta de los $25,000 que pagaría el jueves.", "Nada más cambia: los demás pagos y fechas siguen igual."],
      next: "recalculo",
    },
    {
      id: "recalculo", kind: "calcular", moment: 5, origen: "adaptado", from: "nora",
      text: "Si eso pasa, ¿cómo queda la semana?",
      prompt: "Vuelve a calcular con el anticipo de $7,000 del miércoles.",
      docs: ["A", "B"],
      fields: [
        { id: "tras_nomina", label: "Saldo el miércoles, después de la nómina y del anticipo", answer: 1000, unit: "$", hint: "Al saldo del lunes súmale el anticipo y réstale la nómina.", calc: "8,000 + 7,000 − 14,000 = 1,000" },
        { id: "restante", label: "Lo que se cobra el jueves", answer: 18000, unit: "$", hint: "Del total de la factura, una parte ya se cobró el miércoles.", calc: "25,000 − 7,000 = 18,000" },
        { id: "viernes2", label: "Saldo al cierre del viernes", answer: 11000, unit: "$", hint: "Al saldo del miércoles súmale el cobro del jueves y réstale el pago del viernes.", calc: "1,000 + 18,000 − 8,000 = 11,000" },
      ],
      right: "El miércoles quedan $1,000; el jueves entran los $18,000 restantes y el viernes el saldo sigue en $11,000. Cambió el calendario, no el total.",
      next: "efecto",
    },
    {
      id: "efecto", kind: "decision", moment: 5, origen: "conversion", from: "nora", text: "Entonces, ¿con el anticipo vendimos más esta semana?",
      options: [
        {
          id: "misma", tipo: "defendible", origen: "fuente", next: "respuesta",
          text: "No: la venta es la misma; solo cambia el día en que entra el dinero.",
          consequence: [{ who: "nora", text: "Claro: el viernes sigo en $11,000. Lo que gané es pagar la nómina a tiempo." }],
          feedback: "Correcto: el anticipo solo cambia el calendario del efectivo, no el ingreso de la venta ya registrada.",
        },
        {
          id: "mas_venta", tipo: "concepto_erroneo", origen: "fuente", next: "respuesta",
          text: "Sí: los $7,000 del anticipo se suman a lo que vendimos esta semana.",
          consequence: [{ who: "nora", text: "Pero la factura sigue siendo de $25,000. El jueves solo entraron $18,000." }],
          feedback: "El anticipo no aumenta la venta ni la utilidad: es parte de los $25,000 que ya estaban facturados, cobrada antes.",
        },
        {
          id: "mas_caja", tipo: "riesgosa", origen: "conversion", next: "respuesta",
          text: "Sí: con el anticipo, el viernes tendremos $7,000 más en la cuenta.",
          consequence: [{ who: "nora", text: "Revisé la libreta: el viernes quedan $11,000, igual que antes. Lo que entró el miércoles ya no entra el jueves." }],
          feedback: "El saldo del viernes no cambia: lo que se cobra antes deja de cobrarse después. Solo mejora el miércoles.",
        },
      ],
    },
    {
      id: "respuesta", kind: "redactar", moment: 6, origen: "fuente", from: "nora",
      ask: "Explícamelo en una frase, para tenerlo claro cuando hable con la cafetería.",
      prompt: "Escríbele a Nora por qué el saldo positivo del viernes no resuelve el miércoles.",
      reference: "El saldo final es positivo, pero sin un ajuste confirmado falta $6,000 el miércoles.",
      ideas: ["Distingue el saldo al final de la semana del saldo el día de la nómina.", "Dice cuánto falta y qué día.", "Condiciona la solución a un compromiso confirmado, sin darla por hecha."],
      next: "cierre",
    },
    {
      id: "cierre", kind: "cierre", moment: 7, origen: "conversion",
      text: "Terminaste la práctica con Nora. Aquí queda lo que decidiste, lo que escribiste y el concepto, para consultarlo cuando quieras.",
    },
  ],
  theory: {
    id: "teoria.fin.flujo-por-fecha", title: "El saldo de cada fecha", origen: "fuente",
    text: "El flujo de efectivo muestra dinero que entra y sale en fechas concretas. Una empresa puede vender hoy y cobrar después. Por eso ingreso no es sinónimo de cobro, y utilidad no es el dinero disponible en el banco. Para saber si podrá cumplir un pago hay que observar el saldo antes y después de cada fecha, no solo cuánto efectivo habrá al final del periodo. Cobrar antes, negociar una fecha o conseguir financiación pueden modificar el calendario, pero deben ser compromisos reales, no supuestos tratados como hechos. Adelantar un cobro cambia el momento en que llega el dinero; por sí solo no crea una nueva venta.",
  },
  calculations: [
    "Saldo de la semana = 18,000 − 10,000 − 14,000 + 25,000 − 8,000 = 11,000",
    "Lunes = 18,000 − 10,000 = 8,000",
    "Miércoles = 8,000 − 14,000 = −6,000 (faltan 6,000)",
    "Con anticipo de 7,000 = 18,000 − 10,000 − 14,000 + 7,000 = 1,000",
    "Cobro restante del jueves = 25,000 − 7,000 = 18,000",
    "Viernes con anticipo = 1,000 + 18,000 − 8,000 = 11,000",
  ],
  variant: {
    id: "exp.n1.fin.el-dinero-entra-el-jueves.variante-b",
    title: "Otra situación, sin apoyo",
    setting: "Una clínica veterinaria tiene estos movimientos confirmados para la semana. Nadie te los explica: lee, calcula y responde.",
    question: "¿Puede la clínica cumplir cada pago en su fecha?",
    intro: "Otra empresa, otro calendario y otras cifras. Sin explicaciones, sin los documentos de la práctica y sin el concepto a la mano. Tienes una calculadora que solo opera.",
    calculator: true,
    docs: [
      {
        id: "V", letter: "V", title: "Clínica veterinaria · movimientos confirmados de la semana", unit: "En pesos",
        rows: [
          { id: "V.inicial", label: "Lunes al abrir · efectivo disponible", amount: 12000 },
          { id: "V.insumos", label: "Lunes · pago de insumos", amount: -5000 },
          { id: "V.nomina", label: "Martes · nómina", amount: -9000 },
          { id: "V.cobro", label: "Jueves · cobro de servicios ya facturados", amount: 14000 },
          { id: "V.renta", label: "Viernes · pago de renta", amount: -4000 },
        ],
        foot: "No hay crédito ni otro dinero disponible confirmado.",
      },
    ],
    tasks: [
      { id: "lunes", kind: "cifra", unit: "$", criterion: "Secuencia y saldos: lunes", weight: 20, origen: "adaptado", prompt: "¿Con cuánto efectivo cierra el lunes?", answer: 7000, calc: "12,000 − 5,000 = 7,000" },
      { id: "viernes", kind: "cifra", unit: "$", criterion: "Secuencia y saldos: viernes", weight: 20, origen: "adaptado", prompt: "¿Con cuánto efectivo cierra el viernes?", answer: 8000, calc: "12,000 − 5,000 − 9,000 + 14,000 − 4,000 = 8,000" },
      { id: "faltante", kind: "cifra", unit: "$", criterion: "Faltante temporal: monto", weight: 15, origen: "adaptado", prompt: "En el peor momento de la semana, ¿cuánto dinero falta para cubrir los pagos?", answer: 2000, calc: "9,000 − 7,000 = 2,000" },
      { id: "momento", kind: "senalar", doc: "V", correct: ["V.nomina"], criterion: "Faltante temporal: momento", weight: 10, origen: "conversion", prompt: "Toca el movimiento después del cual la clínica se queda sin dinero suficiente.", calc: "Después de la nómina del martes el saldo es negativo." },
      {
        id: "factura", kind: "clasificar", criterion: "Facturación y cobro", weight: 20, origen: "conversion",
        prompt: "¿Cuáles de estos importes se pueden usar para pagar hoy, lunes?",
        groups: [{ id: "si", label: "Se puede usar hoy" }, { id: "no", label: "Todavía no se puede usar" }],
        items: [
          { id: "inicial", text: "El efectivo disponible al abrir el lunes", group: "si" },
          { id: "facturado", text: "Los servicios ya facturados que se cobran el jueves", group: "no" },
          { id: "registrada", text: "Una venta registrada que el cliente aún no paga", group: "no" },
          { id: "anticipo", text: "Un anticipo que un cliente dijo que tal vez enviaría", group: "no" },
        ],
        calc: "Solo el efectivo que ya está en la cuenta sirve para pagar hoy.",
      },
      {
        id: "recomendacion", kind: "texto", criterion: "Recomendación condicionada", weight: 15, origen: "adaptado",
        prompt: "En una o dos frases: ¿qué le recomiendas a la clínica y por qué el saldo positivo del viernes no resuelve el problema?",
        reference: "Aunque el viernes queden $8,000, el martes faltan $2,000 para la nómina. Conviene pedir un anticipo de al menos esa cantidad o negociar la fecha, y contar con ello solo si se confirma antes del martes.",
        ideas: ["Separa el saldo final del saldo en la fecha de la nómina.", "Propone adelantar un cobro, mover una fecha o conseguir financiamiento.", "Condiciona la acción a que se confirme antes del pago."],
      },
    ],
    passAt: 70,
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-14", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "El paquete pide arrastrar cobros y pagos a fechas. Aquí el calendario ya viene ordenado y se escribe el saldo de cada día; el campo no admite cifras negativas, así que el miércoles se pregunta «cuánto falta» (6,000) en lugar de «−6,000».",
    "La primera decisión (cómo revisar la semana) lleva siempre al calendario: mirar solo el resumen del viernes no bloquea el recorrido, pero Nora pide anotar día por día.",
    "Quien dice que el miércoles no hay problema pasa por una comprobación añadida: tocar la nómina y el cobro del jueves.",
    "La tercera decisión («¿con el anticipo vendimos más?») se añadió para que la diferencia entre adelantar un cobro y vender más sea una elección, no solo una lectura.",
    "En la propuesta hay dos rutas defendibles (anticipo confirmado y préstamo confirmado), como pide el paquete. La tercera opción del paquete, negociar la fecha, queda en la referencia escrita.",
    "Comprobación B: el criterio «secuencia y saldos» (40) se reparte en el saldo del lunes y el del viernes; el saldo del jueves (12,000) no se pregunta porque coincide con el efectivo inicial que se muestra. El faltante (25) se reparte en el monto y el momento. «Facturación y cobro» (20) se comprueba clasificando importes. La recomendación (15) es escrita y espera revisión de una persona.",
    "El lote 04 no trae fuentes por experiencia ni manifiesto (el archivo de trazabilidad que menciona no se recibió). Se usan las fuentes del Atlas para FIN-04.",
    "La regla para pasar la comprobación (70 de 100) es provisional.",
  ],
};
