/**
 * mêtis CEO · contenido de la ronda de coherencia (reglas v8).
 *
 * Todo lo de este archivo solo se ve en periodos jugados con reglas v8 o posteriores. Un periodo que empezó con
 * reglas anteriores sigue viendo cada asunto exactamente como lo jugó: nada se recalifica.
 *
 * 1. Causalidad (revisiones): ningún beneficio llega antes de que la contraparte acepte o de que el dinero se cobre.
 *    Las opciones que dependen de otro llevan `pending`: al decidir pasa solo lo inmediato; la respuesta llega
 *    después y suma lo que corresponda (azar estable del periodo, probabilidad dicha como estimación ficticia).
 * 2. Dosificador de Cumbre (revisión): reponer todo (a) y avisar + contener + medir (c) son defendibles; ocultar (b)
 *    sigue siendo línea roja; dejar vencer equivale a ocultar (no es una omisión más barata).
 * 3. Cadena profunda de Forja (asuntos nuevos): inventario → llamada de Producción por faltante → reclamo del
 *    cliente → reporte al consejo. Cada paso cambia la información, las opciones y la relación del siguiente.
 */
import type { Item, ItemVariant, Option } from "../types";

const V8 = 8;

type Revision = NonNullable<Item["revisions"]>[number];
const rev = (patch: Revision["patch"], note: string): Revision[] => [{ since: V8, patch, note }];
/** Copia de las opciones con cambios en algunas (las demás quedan idénticas). */
const withOptions = (base: Option[], changes: Record<string, Partial<Option>>): Option[] =>
  base.map((o) => (changes[o.id] ? { ...o, ...changes[o.id] } : o));

/** Revisiones v8 de asuntos existentes, por id. Se aplican con `withV8` al armar cada paquete. */
export function revisionsV8(it: Item): Revision[] | undefined {
  const rows = (extra: [string, string][], note: string) => ({ title: it.data?.title ?? "Lo que sabes", rows: [...(it.data?.rows ?? []), ...extra], note });
  switch (it.id) {
    // ───────────────────────────────────────────── Brasa · el proveedor de siempre todavía no ha respondido
    case "gb-d2-proveedor":
      return rev({
        options: withOptions(it.options, {
          c: {
            outcome: "Conservas la calidad conocida. Mientras el proveedor responde, sigues pagando el precio de hoy; si acepta, bajas una parte del costo, y puede pedir algo a cambio.",
            effects: { clientes: 1, margen: -1 },
            pending: {
              who: "Proveedor actual de res", what: "Que iguale la mitad del ahorro sin condiciones", p: 0.6, days: 1,
              yes: { text: "El proveedor igualó la mitad del ahorro sin pedir nada a cambio: no quiere perder la cuenta.", effects: { margen: 2 } },
              no: { text: "El proveedor no igualó así nomás: va a pedir condiciones a cambio del descuento (te escribe Fer) y el consejo volvió a preguntar por el prime cost.", effects: { consejo: -1 } },
            },
          },
        }),
        data: rows([["Fer: si se lo pedimos al proveedor actual", "En 6 de cada 10 casos iguala la mitad sin condiciones; en 4 pide contrato con anticipo"]], "Estimación de Fer y del chef con la muestra; no hay historial en temporada alta. Cifras ficticias de este caso, no estadísticas reales."),
      }, "Causalidad: el ahorro de renegociar solo cuenta cuando el proveedor responde (antes sumaba margen al decidir).");
    case "gb-c-prov-contrato":
      return rev({
        options: withOptions(it.options, {
          a: {
            outcome: "Pones en la mesa las dos piezas que te ponen en riesgo. La negociación tarda una semana y, hasta que el proveedor responda, no hay descuento ni anticipo.",
            effects: { equipo: -1 },
            pending: {
              who: "Proveedor actual de res", what: "Que acepte volumen mínimo de 85 % y el anticipo en dos pagos", p: 0.6, days: 1,
              yes: { text: "El proveedor aceptó el 85 % y los dos pagos. Firmaste el descuento con un riesgo acotado; el primer pago salió de la caja.", effects: { margen: 2, caja: -1, consejo: 1 } },
              no: { text: "El proveedor sostuvo sus condiciones y retiró la oferta del 8 %: la semana de negociación no dio descuento.", effects: { margen: -1, consejo: -1 } },
            },
          },
        }),
        data: rows([["Fer: si pedimos 85 % y dos pagos", "En 6 de cada 10 casos acepta; si no, retira el 8 %"]], "Estimación de Fer. Cifras ficticias de este caso, no estadísticas reales."),
      }, "Causalidad: negociar antes de aceptar ya no suma el descuento hasta que el proveedor acepta.");

    // ───────────────────────────────────────────── Kubit · Altamar y los clientes anuales deciden
    case "kb-c-nube-consumo":
      return rev({
        options: withOptions(it.options, {
          a: {
            outcome: "Le das a Altamar la decisión con el costo a la vista. El ahorro llega solo si Hernán elige; puede molestarse por el momento.",
            effects: { equipo: 1, consejo: -1 },
            pending: {
              who: "Hernán (Grupo Altamar)", what: "Que elija una de las dos opciones sin molestarse", p: 0.7, days: 1,
              yes: { text: "Hernán eligió correr sus reportes una vez al día. Dijo que nadie le había explicado el costo así.", effects: { caja: 2 } },
              no: { text: "Hernán se molestó por el momento y pidió dejarlo para después de la renovación: el consumo siguió igual.", effects: { clientes: -1 } },
            },
          },
        }),
        data: rows([["Memo: si se lo explicamos con datos", "En 7 de cada 10 casos el cliente elige una de las dos opciones"]], "Estimación de Memo y Bruno. Cifras ficticias de este caso, no estadísticas reales."),
      }, "Causalidad: el ahorro de la propuesta a Altamar llega cuando Hernán responde, no al proponerla.");
    case "kb-c-nube-compromiso":
      return rev({
        options: withOptions(it.options, {
          b: {
            outcome: "Ofreces a tus clientes anuales pagar por adelantado con descuento. La caja entra solo cuando paguen; el margen baja con cada uno que acepte.",
            effects: { clientes: -1 },
            pending: {
              who: "Clientes con contrato anual", what: "Que paguen por adelantado con 5 % de descuento", p: 0.6, days: 1,
              yes: { text: "La mayoría de los clientes anuales pagó por adelantado: repusiste buena parte de la caja a costa de margen.", effects: { caja: 3, margen: -2 } },
              no: { text: "Pocos clientes aceptaron pagar por adelantado: entró menos caja de la que planeabas.", effects: { caja: 1, margen: -1 } },
            },
          },
        }),
        data: rows([["Andrea: clientes anuales que aceptan pagar por adelantado", "En 6 de cada 10 casos, la mayoría"]], "Estimación de Andrea. Cifras ficticias de este caso, no estadísticas reales."),
      }, "Causalidad: la caja del pago anticipado entra cuando los clientes pagan, no al ofrecerlo.");

    // ───────────────────────────────────────────── Vértice · los clientes aceptan (o no) la fórmula
    case "vl-d2-diesel":
      return rev({
        options: withOptions(it.options, {
          a: {
            outcome: "Propones una regla que el cliente puede revisar. El margen se recupera a medida que cada cliente la acepta; mientras tanto, cada contrato es una negociación.",
            effects: { clientes: -1, equipo: -1 },
            pending: {
              who: "Clientes con contrato por vencer", what: "Que acepten la fórmula de recargo", p: 0.75, days: 1,
              yes: { text: "La mayoría de los contratos que vencían aceptó la fórmula: el margen empezó a recuperarse y los clientes valoraron poder revisarla.", effects: { margen: 2, clientes: 1 } },
              no: { text: "Solo la mitad aceptó la fórmula a la primera; el resto lo vas a negociar uno por uno.", effects: { margen: 1 } },
            },
          },
        }),
        data: rows([["Mauricio: clientes que aceptan una fórmula pública", "En 3 de cada 4 casos, la mayoría a la primera"]], "Estimaciones de Patricio, Mauricio y Antonio. Cifras ficticias de este caso, no estadísticas reales."),
      }, "Causalidad: el margen de la fórmula se recupera cuando los clientes la aceptan, no al proponerla.");
    case "vl-c-diesel-licitacion":
      return rev({
        options: withOptions(it.options, {
          a: {
            outcome: "Retrocedes en el aumento y compites con servicio y transparencia. Pierdes parte del margen desde hoy; la cuenta depende de lo que Almena decida.",
            effects: { margen: -1, consejo: -1, equipo: 1 },
            pending: {
              who: "Almena (licitación)", what: "Que te asigne sus rutas", p: 0.6, days: 1,
              yes: { text: "Almena te asignó sus rutas: el historial y la penalización pesaron más que el precio de Avante.", effects: { clientes: 2 } },
              no: { text: "Almena repartió: la mitad de sus rutas se fue con Avante.", effects: { clientes: -2 } },
            },
          },
          b: {
            outcome: "Igualas a Avante desde hoy. A ese precio, las rutas de Almena casi no dejan margen; lo más probable es que conserves la cuenta.",
            effects: { margen: -3 },
            pending: {
              who: "Almena (licitación)", what: "Que te asigne sus rutas", p: 0.85, days: 1,
              yes: { text: "Almena se quedó contigo al precio de Avante. El resto de los clientes ya pregunta por la misma tarifa.", effects: { clientes: 2 } },
              no: { text: "Aun igualando el precio, Almena le dio una parte de las rutas a Avante para probarlo.", effects: { clientes: -1 } },
            },
          },
          c: {
            outcome: "Defiendes el margen donde no tienes competencia. Almena puede leer la oferta como que no entendiste su molestia.",
            effects: { margen: 1 },
            pending: {
              who: "Almena (licitación)", what: "Que te asigne sus rutas", p: 0.4, days: 1,
              yes: { text: "Almena aceptó la oferta por rutas: en las largas nadie te alcanza en servicio.", effects: { clientes: 1 } },
              no: { text: "Almena leyó la oferta como medio paso y le dio a Avante las rutas cortas.", effects: { clientes: -2 } },
            },
          },
        }),
        data: rows([["Mauricio: si igualamos a Avante", "En 8 o 9 de cada 10 licitaciones así el cliente se queda; con la fórmula, en 6; con descuento por rutas, en 4"]], "Estimaciones de Mauricio. Cifras ficticias de este caso, no estadísticas reales."),
      }, "Causalidad: conservar la cuenta depende de la decisión de Almena; antes se sumaba al presentar la propuesta.");

    // ───────────────────────────────────────────── Forja · Aurora decide si mueve su programa
    case "fn-c-inv-faltante":
      return rev({
        options: withOptions(it.options, {
          b: {
            outcome: "Le pides a tu cliente que absorba un problema tuyo y le ahorras a la planta otro fin de semana. Si Greg acepta, te ahorras el flete; si no, lo pagas a última hora y más caro.",
            effects: { clientes: -1, equipo: 1 },
            pending: {
              who: "Greg (Aurora)", what: "Que Aurora mueva dos días su programa", p: 0.5, days: 1,
              yes: { text: "Aurora movió dos días su programa y pagaste sus horas extra. Te ahorraste el flete; en su scorecard quedó anotado que pediste el ajuste.", effects: { caja: 2 } },
              no: { text: "Greg no pudo mover el programa: pagaste un flete de último minuto, más caro, y surtiste con horas de atraso.", effects: { caja: -2, clientes: -1 } },
            },
          },
        }),
        data: rows([["Ramón: si le pedimos a Aurora mover su programa", "En 1 de cada 2 casos Greg tiene margen para hacerlo"]], "Estimación de Ramón. Cifras ficticias de este caso, no estadísticas reales."),
      }, "Causalidad: el ahorro de pedirle a Aurora mover su programa solo cuenta si Greg acepta.");

    // ───────────────────────────────────────────── Cumbre · el dosificador: informar no se negocia; el remedio, sí
    case "c-mant-dosificador":
      return rev({
        options: withOptions(it.options, {
          c: {
            text: "Calibrar hoy, avisar ya a SuperNorte qué lotes están en revisión y pedir que los aparte; Calidad mide y en 48 horas le digo cuánto repongo.",
            reply: ["Me parece, jefe. Mañana tengo la muestra.", "(Sofía) Gracias por avisar. Separo esos lotes hoy y espero el número el jueves; si es grande, lo retiramos juntos."],
            outcome: "El cliente sabe desde hoy lo que tú sabes y el producto dudoso queda apartado. Decides la reposición con el tamaño real del problema: si resulta grande, pagas más y tarde.",
            effects: { caja: -1, equipo: 1 },
            score: 3,
            pending: {
              who: "Calidad (muestra grande)", what: "Que la muestra confirme que el faltante se limita a pocos lotes", p: 0.6, days: 1,
              yes: { text: "La muestra confirmó que solo dos lotes venían bajos. Repusiste esos y SuperNorte agradeció la precisión.", effects: { caja: 1, clientes: 1 } },
              no: { text: "La muestra salió peor: había empaques bajos en casi todo lo enviado. Repusiste todo y lo retiraron juntos del anaquel; los dos días de espera te costaron más.", effects: { caja: -3 } },
            },
          },
        }),
        data: rows([["Javier: si lo de hoy se repite en lo enviado", "En 4 de cada 10 casos así el faltante aparece en casi todos los lotes"]], "Estimación de Javier con la auditoría de hoy. Cifras ficticias de este caso, no estadísticas reales."),
        expired: {
          reply: ["Jefe, sin respuesta. Lucía dijo que calibráramos y siguiéramos, y que lo enviado ya estaba dentro del promedio."],
          outcome: "Sin decisión, se calibró la máquina y nadie le avisó al cliente de lo que ya había salido. Es la misma conducta que ocultarlo.",
          effects: { clientes: -2, equipo: -1, consejo: -1 },
        },
        bitacora: {
          title: "Avisar no se negocia; cuánto reponer, sí",
          text: "Frente a producto que salió con menos contenido del etiquetado hay dos preguntas distintas. La primera, si le dices al cliente, no admite cálculo: lo que tú sabes, él tiene derecho a saberlo hoy. La segunda, cuánto reponer y cómo, sí es juicio: reponer todo de inmediato compra certeza a un costo alto; avisar, apartar lo dudoso y medir antes de reponer es proporcional. Las dos son defendibles. Lo que convierte una falla de máquina en un engaño es callar, ya sea por decisión o por dejar que el tiempo decida por ti.",
          nota: "Primero se informa; después se dimensiona el remedio. Nunca al revés.",
        },
      }, "Dosificador: reponer todo (a) y avisar + contener + medir (c) son defendibles; dejar vencer equivale a ocultar (línea roja por omisión).");
  }
  return undefined;
}

/** Paquete con las revisiones v8 encima (mismo id y orden; los periodos anteriores no las ven). */
export function withV8(items: Item[]): Item[] {
  return items.map((it) => {
    const r = revisionsV8(it);
    return r ? { ...it, revisions: [...(it.revisions ?? []), ...r] } : it;
  });
}

// ════════════════════════════════════════════════════════════════════ Forja · cadena profunda (v8)
const FALTANTE = "fn-c-inv-faltante";
const GREG = "fn-c8-greg";
const ANY = ["a", "b", "c", "__expired"];
const SIG_GREG = "Greg Holloway\nPurchasing Manager · Aurora Motors México";

const GREG_OPTIONS: Option[] = [
  {
    id: "a", stance: { greg: 2, ramon: 2, marcos: -1 },
    text: "Presentar la causa raíz: congelamos compras sin separar piezas críticas. Plan de acción y 5 días de seguridad en esas piezas, a nuestro costo.",
    reply: ["(Greg) That's what I needed. Es la primera vez que un proveedor me dice que la causa fue suya.", "(Ramón) Por fin queda por escrito, Director."],
    outcome: "Aurora ve una causa raíz honesta y un plan. Devuelves al almacén parte de la caja que habías liberado y el fondo lo va a notar.",
    effects: { caja: -2, clientes: 2, equipo: 1, consejo: -1 }, style: { horizonte: 2, conflicto: 1 }, score: 3,
  },
  {
    id: "b", stance: { marcos: 1, greg: -1, daniela: -1 },
    text: "Ofrecer a Aurora 1 % de descuento en el trimestre a cambio de que este incidente no baje nuestra calificación en su scorecard.",
    reply: ["(Greg) I'll take it to my director. No le prometo nada.", "(Daniela) Director, eso nos puede salir caro si se sabe en Compras."],
    outcome: "Pagas margen para cuidar la calificación. Si Greg no acepta, el descuento queda en el expediente y el scorecard baja igual.",
    effects: { margen: -2, consejo: 1 }, style: { conflicto: -2, riesgo: 1 }, score: 1,
    pending: {
      who: "Greg (Aurora)", what: "Que acepte el descuento y no baje la calificación", p: 0.4, days: 1,
      yes: { text: "Greg aceptó el descuento y la calificación se mantuvo. En Compras de Aurora quedó anotado que Forja paga por su scorecard.", effects: { clientes: 2 } },
      no: { text: "Greg rechazó el descuento: «No vendemos calificaciones». El incidente bajó el scorecard igual y la oferta quedó en el expediente.", effects: { clientes: -2 } },
    },
  },
  {
    id: "c", stance: { marcos: 1, ramon: -1, greg: -1 },
    text: "Explicar que el detonante fue el cambio de programa de Aurora, pedirles cinco días de aviso y revisar qué piezas son críticas sin subir inventario.",
    reply: ["(Greg) Our schedule changes are in the contract, Director. Pero lo de las piezas críticas me interesa.", "(Daniela) Es cierto, pero dicho por el proveedor suena a excusa."],
    outcome: "Cuidas la caja y pones sobre la mesa algo real: Aurora cambia su programa con poco aviso. Greg lo lee en parte como excusa y el scorecard lo refleja.",
    effects: { caja: 1, clientes: -2, consejo: 1 }, style: { conflicto: 1, riesgo: 1 }, score: 2,
  },
];

const GREG_VARIANTS: ItemVariant[] = [
  {
    when: [{ item: FALTANTE, options: ["b"], accepted: true }],
    patch: {
      preview: "Movimos nuestro programa a petición suya. Ahora necesito su causa raíz antes del scorecard…",
      body: [
        "Estimado Director:",
        "Movimos dos días nuestro programa a petición suya. Lo hicimos porque nos avisó a tiempo, pero le costó horas extra a nuestra propia línea.",
        "El incidente entra a la revisión mensual del scorecard. Necesito su análisis de causa raíz y qué cambia para no tener que volver a mover el programa por un problema de su compras.",
        SIG_GREG,
      ],
    },
    rows: [["Lo que ya hiciste", "Aurora movió su programa · pagaste sus horas extra"]],
  },
  {
    when: [{ item: FALTANTE, options: ["b"], accepted: false }],
    patch: {
      preview: "No pudimos mover el programa y su entrega llegó con horas de atraso…",
      body: [
        "Estimado Director:",
        "No pudimos mover el programa. Ustedes trajeron la materia prima con un flete de último minuto y surtieron con horas de atraso: nuestra línea trabajó al límite.",
        "Necesito su análisis de causa raíz antes de la revisión del scorecard del viernes.",
        SIG_GREG,
      ],
    },
    rows: [["Lo que ya hiciste", "Pediste mover el programa · Aurora no pudo · flete de último minuto"]],
  },
  {
    when: [{ item: FALTANTE, options: ["c"] }],
    patch: {
      preview: "Recibimos la entrega incompleta y abrimos un reporte formal de incidente…",
      body: [
        "Estimado Director:",
        "Recibimos la entrega del miércoles incompleta y el resto después del fin de semana. Tuvimos que resecuenciar dos turnos de nuestra línea.",
        "Abrimos un reporte formal de incidente. Necesito su causa raíz antes del viernes.",
        SIG_GREG,
      ],
      options: withOptions(GREG_OPTIONS, {
        a: { outcome: "Aurora ve una causa raíz honesta y un plan, después de una entrega incompleta. Devuelves al almacén parte de la caja liberada y tu planta, que ya cubrió el fin de semana, ve que no se repetirá.", effects: { caja: -2, clientes: 1, equipo: 2, consejo: -1 } },
        c: { outcome: "Después de una entrega incompleta, culpar al programa de Aurora suena a excusa. El reporte formal sigue abierto y el scorecard baja.", effects: { caja: 1, clientes: -3, consejo: 1, equipo: 1 } },
      }),
    },
    rows: [["Lo que ya hiciste", "Surtiste parcial · tres turnos extra el fin de semana"]],
  },
  {
    when: [{ item: FALTANTE, options: ["__expired"] }],
    patch: {
      subject: "Aurora Motors · Paro de línea y reporte formal",
      data: {
        title: "Lo que sabes",
        rows: [
          ["Scorecard con Aurora", "Amarillo · revisión mensual el viernes"],
          ["Inventario de seguridad de piezas críticas (propuesta de Ramón)", "5 días · ≈ $9 M de caja"],
          ["Programa de Aurora", "Cambia cada semana · avisan con 2 o 3 días"],
          ["Daniela: si disputamos el cargo", "En 1 de cada 4 casos el cliente retira una parte"],
        ],
        note: "Estimación de Daniela. Cifras ficticias de este caso, no estadísticas reales.",
      },
      preview: "Su planta no surtió, nuestra línea paró dos horas y el cargo ya se aplicó…",
      body: [
        "Estimado Director:",
        "Su planta no surtió y nuestra línea paró dos horas. El cargo ya se aplicó y su caso va a la junta de proveedores.",
        "Nadie de su planta me avisó antes. Necesito su causa raíz y qué cambia, antes del viernes.",
        SIG_GREG,
      ],
      options: withOptions(GREG_OPTIONS, {
        b: {
          stance: { marcos: 2, greg: -2, daniela: -1 },
          text: "Disputar el cargo por paro ante Aurora: cambiaron su programa con solo dos días de aviso y eso también pesa en lo que pasó.",
          reply: ["(Greg) The contract is clear, Director. Lo reviso con Legal.", "(Daniela) Si peleamos el cargo, peleamos la plataforma 2028."],
          outcome: "Defiendes la caja con un argumento que tiene algo de cierto y la planta siente que no la dejas sola con la culpa. Greg lo toma como que no asumes el paro.",
          effects: { clientes: -1, equipo: 1 }, style: { conflicto: 2, riesgo: 1 }, score: 1,
          pending: {
            who: "Greg (Aurora)", what: "Que Aurora retire el cargo por paro", p: 0.25, days: 1,
            yes: { text: "Legal de Aurora retiró la mitad del cargo por el aviso tan corto. Greg no lo olvidó.", effects: { caja: 2, clientes: -1 } },
            no: { text: "Aurora sostuvo el cargo completo y anotó la disputa en su expediente de proveedor.", effects: { clientes: -2 } },
          },
        },
      }),
    },
    rows: [["Lo que ya pasó", "Aurora paró dos horas · cargo aplicado ≈ $4 M"]],
  },
];

const CONSEJO_OPTIONS: Option[] = [
  {
    id: "a", stance: { regina: 2, ramon: 1, marcos: 1, zertuche: -1 },
    text: "Reporte completo: caja liberada, costo del incidente con Aurora, su causa y la regla nueva para piezas críticas.",
    reply: ["(Zertuche) Gracias por no maquillarlo, pero el incidente lo vamos a discutir.", "(Regina) Una regla para piezas críticas es justo lo que faltaba."],
    outcome: "El consejo ve la decisión entera, con su costo. Zertuche cuestiona el incidente, pero sabe que tus números aguantan una auditoría.",
    effects: { consejo: 1, caja: -1, equipo: 1 }, style: { horizonte: 2, conflicto: 1 }, score: 3,
  },
  {
    id: "b", stance: { zertuche: 1, marcos: -2, ramon: -1 },
    text: "Reportar la caja liberada y mencionar el incidente con Aurora como resuelto, sin cifras: el consejo quiere ver la caja.",
    reply: ["(Zertuche) Bien. La caja es lo que esperábamos.", "(Marcos, en privado) Director, si me preguntan el costo del incidente, lo voy a decir."],
    outcome: "El reporte se ve limpio hoy. El costo del incidente no está en tu página: si alguien del consejo lo pide, lo va a encontrar en Finanzas.",
    effects: { consejo: 3, equipo: -1 }, style: { horizonte: -2, riesgo: 2 }, score: 1,
    pending: {
      who: "Regina (consejo)", what: "Que el consejo no pida el detalle del incidente", p: 0.5, days: 1,
      yes: { text: "Nadie pidió el detalle. El reporte pasó, aunque el costo del incidente sigue sin estar en ningún papel del consejo.", effects: {} },
      no: { text: "Regina le pidió el detalle a Marcos y vio el costo completo del incidente. En la sesión preguntó por qué no venía en tu página.", effects: { consejo: -5 } },
    },
  },
  {
    id: "c", stance: { ramon: 2, marcos: -1, zertuche: -2 },
    text: "Proponer revertir en parte: volver a 35 días solo en piezas críticas, devolver $9 M de la caja liberada y explicar por qué.",
    reply: ["(Zertuche) ¿Me estás diciendo que la decisión estuvo mal?", "(Ramón) Está diciendo que ya sabemos cuáles piezas no se tocan."],
    outcome: "Corriges tu propia decisión con datos. El consejo ve menos caja de la que esperaba y se pregunta si la decisión original estuvo bien pensada.",
    effects: { caja: -2, clientes: 1, equipo: 1, consejo: -1 }, style: { horizonte: 1, conflicto: 1 }, score: 2,
  },
];

const CONSEJO_VARIANTS: ItemVariant[] = [
  { when: [{ item: FALTANTE, options: ["a"] }], patch: {}, rows: [["Faltante con Aurora", "Flete aéreo $3.5 M · Aurora no paró"]] },
  { when: [{ item: FALTANTE, options: ["b"], accepted: true }], patch: {}, rows: [["Faltante con Aurora", "Aurora movió su programa · horas extra pagadas · anotado en su scorecard"]] },
  { when: [{ item: FALTANTE, options: ["b"], accepted: false }], patch: {}, rows: [["Faltante con Aurora", "Flete de último minuto ≈ $3 M · entrega con horas de atraso"]] },
  { when: [{ item: FALTANTE, options: ["c"] }], patch: {}, rows: [["Faltante con Aurora", "Entrega incompleta · tres turnos extra de fin de semana"]] },
  {
    when: [{ item: FALTANTE, options: ["__expired"] }],
    patch: {
      preview: "Aurora paró su línea y nos cobró. Quiero tu versión antes de que la cuente Marcos…",
      body: [
        "Director:",
        "Para la sesión del consejo quiero tu reporte de la decisión de inventario. Marcos me dijo que Aurora paró su línea dos horas y nos aplicó el cargo. Prefiero oír de ti qué pasó y qué cambia.",
        "Una página. La leemos antes de la sesión.",
        "Alberto Zertuche",
      ],
    },
    rows: [["Faltante con Aurora", "Paro de su línea · cargo ≈ $4 M"]],
  },
  {
    when: [{ item: GREG, options: ["a"] }],
    patch: {
      options: withOptions(CONSEJO_OPTIONS, {
        c: { text: "Pedir que el consejo apruebe ya los 5 días de seguridad que le comprometí a Aurora, aunque bajen la caja liberada en $9 M." },
      }),
    },
    rows: [["Lo que le dijiste a Aurora", "Causa raíz propia · 5 días de seguridad en piezas críticas"]],
  },
  { when: [{ item: GREG, options: ["b"], accepted: true }], patch: {}, rows: [["Lo que le ofreciste a Aurora", "1 % de descuento en el trimestre · scorecard sin cambio"]] },
  { when: [{ item: GREG, options: ["b"], accepted: false }], patch: {}, rows: [["Lo que le ofreciste a Aurora", "Descuento rechazado · el scorecard bajó igual"]] },
  { when: [{ item: GREG, options: ["c"] }], patch: {}, rows: [["Lo que le dijiste a Aurora", "Que el detonante fue su cambio de programa"]] },
  { when: [{ item: GREG, options: ["__expired"] }], patch: {}, rows: [["Scorecard con Aurora", "Bajó · junta con su director de Compras"]] },
];

/**
 * Cadena profunda de Forja (v8): solo en el camino «congelar compras» cuando falta la pieza (fn-c-inv-faltante).
 * Día 5: Greg reclama y pide causa raíz (cambia según cómo resolviste el faltante). Día 6: Zertuche pide el reporte
 * para el consejo (cita lo que decidiste en los dos pasos anteriores). No hay forma de deshacer un paso.
 */
export const CADENA_FORJA_V8: Item[] = [
  {
    id: GREG, day: 5, slot: 3, channel: "email", from: "greg", since: V8,
    involves: ["ramon", "daniela", "marcos"],
    trigger: { item: FALTANTE, options: ANY },
    after: [FALTANTE],
    subject: "Aurora Motors · Incidente de suministro y scorecard",
    preview: "Gracias por avisarnos a tiempo. Aun así, necesito su causa raíz antes del scorecard…",
    body: [
      "Estimado Director:",
      "Gracias por avisarnos a tiempo del riesgo con la pieza crítica. Nuestra línea no paró.",
      "Aun así, el incidente entra a la revisión mensual del scorecard. Necesito su análisis de causa raíz y qué cambia para que no se repita, antes del viernes.",
      SIG_GREG,
    ],
    data: {
      title: "Lo que sabes",
      rows: [
        ["Scorecard con Aurora", "Amarillo · revisión mensual el viernes"],
        ["Inventario de seguridad de piezas críticas (propuesta de Ramón)", "5 días · ≈ $9 M de caja"],
        ["Programa de Aurora", "Cambia cada semana · avisan con 2 o 3 días"],
        ["Daniela: si ofrecemos un descuento por el scorecard", "En 4 de cada 10 casos el comprador lo acepta"],
      ],
      note: "Estimación de Daniela. Cifras ficticias de este caso, no estadísticas reales.",
    },
    variants: GREG_VARIANTS,
    ask: "Aurora pide tu causa raíz. ¿Qué le respondes?",
    options: GREG_OPTIONS,
    expired: { reply: ["(Greg) Sin su análisis, calificamos el incidente con la información que teníamos."], outcome: "Sin respuesta, Aurora bajó el scorecard y pidió una junta con su director de Compras.", effects: { clientes: -3, consejo: -1 } },
    lesson: "comunicacion",
    bitacora: {
      title: "La causa raíz que es tuya",
      text: "Aurora sí cambia su programa con poco aviso, y eso es cierto. Pero el faltante lo hizo posible tu decisión de congelar compras sin separar las piezas críticas. Con un cliente que te califica, la primera pregunta no es de quién es la culpa, sino qué parte controlas tú y qué cambia para que no se repita.",
      nota: "Un cliente perdona un incidente; lo que no perdona es tener que descubrir la causa por su cuenta.",
    },
    areas: ["clientes", "comunicacion", "operacion"],
  },
  {
    id: "fn-c8-consejo", day: 6, slot: 3, channel: "email", from: "zertuche", since: V8,
    involves: ["marcos", "regina", "ramon"],
    trigger: { item: GREG, options: ANY },
    after: [GREG],
    subject: "Antes del consejo: la caja del inventario",
    preview: "Marcos me dice que la caja subió y que hubo un incidente con Aurora. Quiero tu versión…",
    body: [
      "Director:",
      "Para la sesión del consejo quiero tu reporte de la decisión de inventario: cuánta caja liberamos, qué costó y qué cambia. Marcos me adelantó que hubo un incidente con Aurora; prefiero oírlo de ti.",
      "Una página. La leemos antes de la sesión.",
      "Alberto Zertuche",
    ],
    data: {
      title: "Lo que sabes (Marcos)",
      rows: [["Caja liberada al congelar compras", "≈ $45 M"], ["Piezas críticas a 35 días de inventario", "Devuelve ≈ $9 M al almacén"], ["Marcos: si el reporte no trae el costo del incidente", "En 1 de cada 2 sesiones alguien del consejo pide el detalle"]],
      note: "Estimación de Marcos. Cifras ficticias de este caso, no estadísticas reales.",
    },
    variants: CONSEJO_VARIANTS,
    ask: "¿Qué le reportas al consejo?",
    options: CONSEJO_OPTIONS,
    expired: { reply: ["(Zertuche) Sin tu página, Marcos presentó los números."], outcome: "Sin reporte, el consejo conoció la decisión y el incidente por Finanzas, no por ti.", effects: { consejo: -3 } },
    lesson: "comunicacion",
    bitacora: {
      title: "Una decisión se reporta con su costo",
      text: "La caja liberada es real y el incidente también. A un consejo con fondo de capital no le preocupa que una decisión haya costado; le preocupa enterarse por otro lado. Reportar la cadena completa (qué decidiste, qué pasó y qué cambias) convierte un error en criterio.",
      nota: "Lo que el consejo descubre por su cuenta pesa el doble de lo que tú le cuentas.",
    },
    areas: ["comunicacion", "finanzas", "alineacion"],
  },
];
