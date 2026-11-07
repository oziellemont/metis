/**
 * mêtis CEO · contenido de economía real (reglas v10).
 *
 * Revisiones `since: 10` de asuntos fijos: Caja y Margen dejan de ser puntos escritos a mano y se mueven por HECHOS con
 * monto y fecha (ver economy.ts). Las opciones conservan en `effects` solo Equipo, Clientes y Consejo; los montos salen
 * de los renglones de datos del propio caso (o de un renglón nuevo que se agrega aquí, marcado como estimación).
 *
 * Reglas que sigue cada revisión:
 *  - Cada movimiento cita un hecho; sin hecho material no hay movimiento. No conceder no es una ganancia.
 *  - Lo diferido ocurre en su fecha (`days`); lo que ya pasó antes de decidir es `arrival` y cuenta elijas lo que elijas.
 *  - Vencer aplica los hechos del default, sin castigo extra sin causa.
 *  - Una concesión o inversión fuera de la autoridad del director, sin consejo, mueve el Consejo (lo agrega el motor).
 * Un periodo que empezó con reglas anteriores ve cada asunto como lo jugó; las cuentas migradas a v10 lo recalculan.
 */
import type { Fact, FactKind, Item, Option, PendingAgreement } from "../types";

const V10 = 10;

type Revision = NonNullable<Item["revisions"]>[number];
const rev = (patch: Revision["patch"], note: string): Revision[] => [{ since: V10, patch, note }];
const f = (kind: FactKind, amount: number, text: string, extra: Partial<Fact> = {}): Fact => ({ kind, amount, text, ...extra });
const pend = (p: PendingAgreement): PendingAgreement => p;
/** Copia de las opciones con cambios (los cambios reemplazan `effects` completo: solo Equipo, Clientes y Consejo). */
const withOptions = (base: Option[], changes: Record<string, Partial<Option>>): Option[] =>
  base.map((o) => {
    const c = changes[o.id];
    if (!c) return o;
    const out: Option = { ...o, ...c };
    if (!("pending" in c)) delete out.pending;
    return out;
  });

/** Revisiones v10 de asuntos existentes, por id. Se aplican con `withV10` al armar cada paquete. */
export function revisionsV10(it: Item): Revision[] | undefined {
  const at = (it.revisions ?? []).reduce<Item>((acc, r) => ({ ...acc, ...r.patch }), it);
  const rows = (replace: Record<string, [string, string]>, extra: [string, string][], note?: string) => ({
    title: at.data?.title ?? "Lo que sabes",
    rows: [...(at.data?.rows ?? []).map((r) => replace[r[0]] ?? r), ...extra],
    ...(note ?? at.data?.note ? { note: note ?? at.data?.note } : {}),
  });
  const opts = (changes: Record<string, Partial<Option>>) => withOptions(at.options, changes);
  switch (it.id) {
    // ─────────────────────────────────────────────────────────── Cumbre
    case "d2-supernorte":
      return rev({
        options: opts({
          a: {
            effects: {},
            facts: [
              f("precio", -5.1, "Descuento de 4 puntos a SuperNorte"),
              f("capital_trabajo", -10, "Primeras facturas a 90 días en lugar de 60", { days: 7 }),
            ],
            outcome: "Firmas el anexo: el descuento cuenta desde hoy y los $10 M de capital de trabajo salen cuando las primeras facturas dejan de cobrarse a 60 días. Conservas la cuenta, pero no ganas clientes por eso.",
          },
          b: {
            effects: {},
            pending: pend({
              who: "Sofía (SuperNorte)", what: "Que acepte 1.5 puntos atados a volumen y sostener 60 días", p: 0.6, days: 2,
              yes: { text: "Sofía aceptó 1.5 puntos atados a volumen y 60 días: el costo es una fracción de lo que pedían.", effects: {}, facts: [f("precio", -1.9, "1.5 puntos de promoción sobre $127 M")] },
              no: { text: "Sofía no aceptó y regresó con una contraoferta: la negociación sigue abierta y su gerente ya pregunta por ti.", effects: {} },
            }),
            outcome: "Una reunión no mueve dinero. Si Sofía acepta, el costo es 1.5 puntos en lugar de 4.",
          },
          c: {
            effects: {},
            pending: pend({
              who: "SuperNorte", what: "Que conserve los dos frentes de anaquel sin descuento", p: 0.5, days: 2,
              yes: { text: "SuperNorte conservó los dos frentes: tu rotación le conviene. La relación quedó fría.", effects: { clientes: -1 } },
              no: { text: "SuperNorte retiró un frente de anaquel: alrededor de $25 M de venta al año menos.", effects: { clientes: -4 }, facts: [f("precio", -9.5, "Venta perdida de un frente de anaquel (≈ $25 M con 38 % de margen bruto)")] },
            }),
            outcome: "Sostener el precio no mejora el margen: evita una pérdida. Lo que cambia es el riesgo de perder un frente de anaquel.",
          },
        }),
        expired: {
          ...at.expired,
          effects: {},
          facts: [
            f("precio", -5.1, "Descuento de 4 puntos aplicado por default"),
            f("capital_trabajo", -10, "Primeras facturas a 90 días", { days: 7 }),
          ],
        },
        data: rows({}, [["Si SuperNorte retira un frente", "≈ $25 M de venta al año (estimación de Lucía)"]]),
      }, "Economía real: el descuento y el plazo son montos del caso; vencer aplica las mismas condiciones, sin castigo extra.");

    case "d4-sindicato":
      return rev({
        options: opts({
          a: {
            effects: { equipo: 3 },
            pending: pend({
              who: "Asamblea del sindicato", what: "Que acepte 5 % fijo más bono por merma", p: 0.7, days: 2,
              yes: {
                text: "La asamblea aceptó. El tablero de merma arrancó y el bono se paga al cierre si la merma baja.", effects: { equipo: 1 },
                facts: [f("costo", 4.6, "Merma de 4.8 % a 3 %, medida al cierre", { days: 8 }), f("costo", -2.3, "Bono por merma pagado al personal", { days: 8 })],
              },
              no: { text: "La asamblea pidió más: vuelves a la mesa con la gente a la expectativa.", effects: { equipo: -2 } },
            }),
          },
          b: { effects: { equipo: 5, consejo: -2 }, facts: [f("costo", -5.2, "4 puntos de aumento arriba del presupuesto")] },
          c: {
            effects: { equipo: -5 },
            pending: pend({
              who: "Asamblea del sindicato", what: "Que no vaya a paro", p: 0.7, days: 2,
              yes: { text: "No hubo paro, pero la relación quedó tensa.", effects: {} },
              no: { text: "Paro de dos días: entregas tarde a SuperNorte.", effects: { clientes: -2, equipo: -3 }, facts: [f("pago", -0.9, "Contribución perdida por dos días de paro", { expense: true })] },
            }),
          },
        }),
        expired: { ...at.expired, effects: { equipo: -6 } },
        data: rows({}, [["Cada punto arriba del presupuesto", "$1.3 M al año"], ["Bajar la merma a 3 %", "≈ $4.6 M al año de ahorro · bono de hasta 4 % ≈ $2.3 M"]]),
      }, "Economía real: el 5 % ya estaba presupuestado; el ahorro y el bono cuentan cuando se miden.");

    // ─────────────────────────────────────────────────────────── Forja
    case "fn-d2-precio":
      return rev({
        options: opts({
          a: { effects: {}, facts: [f("precio", -80, "5 % de reducción de precio a Aurora")] },
          b: {
            effects: { clientes: -1 },
            pending: pend({
              who: "Greg (Aurora)", what: "Que acepte aplicar el índice de acero hacia adelante", p: 0.4, days: 3,
              yes: { text: "Aurora aceptó el índice de acero: recuperas parte del alza del acero.", effects: {}, facts: [f("precio", 18, "Índice de acero aplicado a Aurora")] },
              no: { text: "Aurora no aceptó el índice y te bajó en su evaluación de proveedores.", effects: { clientes: -2 } },
            }),
          },
          c: {
            effects: { equipo: -1 },
            pending: pend({
              who: "Ingenieros de Aurora y Forja", what: "Que el taller encuentre el 2 % en ahorros", p: 0.6, days: 4,
              yes: { text: "El taller encontró los ahorros: el 2 % se cubre con el rediseño y Greg lo presentó como propuesta de valor.", effects: { clientes: 1 } },
              no: { text: "No aparecieron los ahorros y Aurora aplicó el 2 % adicional.", effects: {}, facts: [f("precio", -33, "2 % adicional de reducción a Aurora")] },
            }),
          },
        }),
        expired: { ...at.expired, effects: { consejo: -2 }, facts: [f("precio", -80, "Aurora aplicó el 5 % por default")] },
        data: rows({}, [["El 2 % adicional", "−$33 M al año"], ["Índice de acero, si Aurora lo acepta", "≈ +$18 M al año (estimación de Marcos)"], ["EBITDA anual de Forja", "≈ $265 M"]]),
      }, "Economía real: $80 M al año rebasan la autoridad del director; el 3 % contractual ya estaba en el plan.");

    case "fn-d6-denuncia":
      return rev({
        options: opts({
          a: { effects: { equipo: 3 }, facts: [f("pago", -1.5, "Investigación externa", { expense: true })] },
          b: {
            effects: { equipo: -5 },
            pending: pend({
              who: "Operadora que denunció", what: "Que no presente queja ante la autoridad laboral", p: 0.5, days: 3,
              yes: { text: "No presentó queja, pero en la planta ya se sabe quién se movió de turno.", effects: {} },
              no: { text: "Presentó queja formal y el fondo se enteró de cómo se manejó.", effects: { consejo: -3 } },
            }),
          },
          c: {
            effects: { equipo: 2 },
            facts: [f("pago", -1.5, "Liquidación sin investigación", { expense: true })],
            pending: pend({
              who: "Octavio Saucedo", what: "Que no demande por despido sin investigación", p: 0.5, days: 4,
              yes: { text: "Octavio no demandó.", effects: {} },
              no: { text: "Octavio demandó y el fondo preguntó por qué no hubo investigación.", effects: { consejo: -2 }, facts: [f("pago", -1.5, "Abogados y provisión por la demanda", { expense: true })] },
            }),
          },
        }),
        expired: { ...at.expired, effects: { equipo: -6 } },
        data: { title: "Lo que sabes", rows: [["Denuncias coincidentes", "3"], ["Investigación externa", "≈ $1.5 M"], ["Liquidación sin investigación y posible demanda", "≈ $3 M"]], note: "Estimaciones de Teresa (Personas). Cifras ficticias de este caso." },
      }, "Economía real: los montos no son materiales para Forja; lo que pesa es el debido proceso.");

    // ─────────────────────────────────────────────────────────── Brasa
    case "gb-d3-brote":
      return rev({
        arrival: { text: "El brote ya ocurrió y el video circula antes de que decidas: los comensales lo resienten elijas lo que elijas.", effects: { clientes: -3 } },
        options: opts({
          a: { effects: { clientes: 2 }, facts: [f("pago", -1.5, "Semana cerrada, gastos médicos y revisión de 34 cocinas", { expense: true })] },
          b: {
            effects: { clientes: -3 },
            pending: pend({
              who: "Sanidad", what: "Que no clausure el local en su visita", p: 0.5, days: 1,
              yes: { text: "Sanidad no clausuró, pero el video llegó a 1.2 millones de vistas.", effects: {} },
              no: { text: "Sanidad clausuró Andares en público.", effects: { clientes: -2, consejo: -2 }, facts: [f("pago", -0.77, "Una semana de Andares clausurado", { expense: true })] },
            }),
          },
          c: { effects: { clientes: -1 }, facts: [f("pago", -0.22, "Dos días de Andares cerrado", { expense: true })] },
        }),
        expired: { ...at.expired, effects: { clientes: -4, consejo: -2 }, facts: [f("pago", -0.77, "Una semana de Andares clausurado", { expense: true })] },
        data: rows({}, [["Gastos médicos y revisión de las 34 cocinas", "≈ $0.8 M"]]),
      }, "Economía real: el brote es un hecho al llegar; el dinero no es material para el grupo.");

    case "gb-d2-menu":
      return rev({
        options: opts({
          a: {
            effects: { equipo: 1, consejo: -1 },
            facts: [f("costo", 6.5, "Merma más baja al quitar 18 platillos, medida al cierre", { days: 6 })],
            pending: pend({
              who: "Comensales", what: "Que acepten la arrachera rediseñada", p: 0.6, days: 3,
              yes: { text: "La arrachera rediseñada se sigue pidiendo igual.", effects: {}, facts: [f("precio", 4.7, "La arrachera 6 % más cara")] },
              no: { text: "Bajó la venta de la arrachera y Don Ignacio lo notó.", effects: { clientes: -1 } },
            }),
          },
          b: { effects: { equipo: 1 }, facts: [f("costo", 6.5, "Merma más baja al quitar 18 platillos, medida al cierre", { days: 6 })] },
          c: { effects: { equipo: -2 }, facts: [f("inversion", -3, "Rediseño, carta y capacitación de 34 cocinas", { years: 3 })] },
        }),
        expired: { ...at.expired, effects: { equipo: -1 } },
        data: rows({}, [["Quitar los 18 perros", "Merma ≈ 2 puntos menos ≈ +$6.5 M al año"], ["La arrachera 6 % más cara", "≈ +$4.7 M al año si se sigue pidiendo"], ["Menú nuevo completo", "≈ $3 M de rediseño y capacitación"]]),
      }, "Economía real: el ahorro de merma cuenta cuando se mide; el menú nuevo no existe todavía.");

    // ─────────────────────────────────────────────────────────── Kubit
    case "kb-d2-altamar":
      return rev({
        options: opts({
          a: { effects: { clientes: 1 }, facts: [f("precio", -10.2, "15 % de descuento a Altamar"), f("pago", -1.2, "Tres desarrollos a la medida", { expense: true })] },
          b: {
            effects: {},
            pending: pend({
              who: "Hernán (Altamar)", what: "Que renueve con el ajuste por inflación", p: 0.5, days: 3,
              yes: { text: "Hernán renovó con el ajuste por inflación.", effects: {}, facts: [f("precio", 3.1, "Ajuste por inflación de 4.5 % a Altamar")] },
              no: { text: "Hernán abrió un concurso con otros proveedores.", effects: { clientes: -3 } },
            }),
          },
          c: {
            effects: { equipo: -1 },
            facts: [f("pago", -1.2, "Integración con ERP para todos", { expense: true })],
            pending: pend({
              who: "Hernán (Altamar)", what: "Que acepte el piloto en tres empresas más", p: 0.6, days: 3,
              yes: { text: "Tres empresas más del grupo entraron al piloto.", effects: { clientes: 2 } },
              no: { text: "Hernán renovó sin piloto.", effects: {} },
            }),
          },
        }),
        expired: { ...at.expired, effects: { clientes: -3 } },
        data: rows({ "Si damos 15%": ["Si damos 15%", "−$10.2 M al año"], "Los tres desarrollos": ["Los tres desarrollos", "5 ingenieros durante 4 meses ≈ $1.2 M"] }, [["Ajuste por inflación (4.5 %)", "≈ +$3.1 M al año"]]),
      }, "Economía real: el 15 % es casi todo el resultado operativo del año y rebasa la autoridad del director.");

    case "kb-c-caida":
      return rev({
        arrival: { text: "La caída ya ocurrió: 310 clientes sin operar en su cierre de mes y 1,400 solicitudes a soporte.", effects: { clientes: -2 } },
        options: opts({
          a: { effects: { clientes: 2, equipo: 2 }, facts: [f("pago", -2.1, "Créditos de buena fe a todos los afectados", { expense: true })] },
          b: { effects: { clientes: -1, equipo: -1 }, facts: [f("pago", -0.84, "Créditos a quien los pidió (≈ 40 %)", { expense: true })] },
          c: { effects: { clientes: -4 } },
        }),
        expired: { ...at.expired, effects: { clientes: -4 } },
        data: rows({ "Créditos por contrato": ["Créditos de buena fe propuestos", "$2.1 M"] }, [["Si solo los recibe quien los pide", "≈ 40 % · $0.84 M"]]),
      }, "Economía real: el contrato se cumplió (99.2 %); los créditos son de buena fe. No pagarlos no es un ingreso.");

    // ─────────────────────────────────────────────────────────── Punto Madero
    case "pm-d2-penasco":
      return rev({
        options: opts({
          a: {
            effects: { clientes: 1 },
            facts: [
              f("precio", -52, "12 % de descuento a Peñasco"),
              f("costo", -6.5, "Entrega gratis en obra"),
              f("capital_trabajo", -70, "Primeras facturas a 90 días en lugar de 30", { days: 7 }),
            ],
          },
          b: {
            effects: {},
            pending: pend({
              who: "Federico (Peñasco)", what: "Que acepte precio con inflación, 30 días y entrega aparte", p: 0.5, days: 3,
              yes: { text: "Federico aceptó el ajuste por inflación.", effects: {}, facts: [f("precio", 19.4, "Ajuste por inflación a Peñasco")] },
              no: { text: "Federico movió parte de sus compras a Mundo Casa.", effects: { clientes: -3 }, facts: [f("precio", -26.7, "20 % de las compras de Peñasco a Mundo Casa")] },
            }),
          },
          c: {
            effects: { equipo: -1 },
            facts: [f("capital_trabajo", -5, "Crédito a 60 días en tres desarrollos de prueba")],
            pending: pend({
              who: "Federico (Peñasco)", what: "Que acepte el piloto de entrega programada", p: 0.6, days: 3,
              yes: { text: "Federico aceptó el piloto en tres desarrollos.", effects: { clientes: 2 } },
              no: { text: "Federico aceptó solo el precio.", effects: {} },
            }),
          },
        }),
        expired: { ...at.expired, effects: { clientes: -3 } },
        data: rows({}, [["Entrega gratis en obra", "≈ $6.5 M al año"], ["Ajuste por inflación", "≈ +$19.4 M al año"], ["Si Peñasco mueve 20 % a Mundo Casa", "≈ −$26.7 M al año"], ["EBITDA anual de Punto Madero", "≈ $46 M"]]),
      }, "Economía real: lo que pide Peñasco es mayor que toda la utilidad operativa; requiere al consejo.");

    case "pm-c-temp-compras":
      return rev({
        options: opts({
          a: { effects: {}, facts: [f("costo", 12, "Menos sobrante al vender la temporada", { days: 9 })] },
          b: { effects: { clientes: -1 }, facts: [f("capital_trabajo", 12, "Pedido 30 % menor, al cerrarlo", { days: 9 })] },
          c: { effects: { equipo: -1 }, facts: [f("inversion", -1.5, "Sistema de pronóstico por tienda", { years: 3 })] },
        }),
        expired: { ...at.expired, effects: {} },
        data: rows({}, [["Pedido de temporada", "≈ $40 M"], ["Sistema de pronóstico", "≈ $1.5 M"]]),
      }, "Economía real: el pedido se cierra en 5 semanas; nada ocurre al decidir.");

    // ─────────────────────────────────────────────────────────── Vértice
    case "vl-d2-diesel":
      return rev({
        arrival: { text: "El diésel ya subió: ≈ $4 M al mes más de costo, elijas lo que elijas.", facts: [f("costo", -48, "Alza del diésel (12 %)")] },
        options: opts({
          a: {
            effects: {},
            pending: pend({
              who: "Clientes con contrato por vencer", what: "Que acepten la fórmula de recargo", p: 0.75, days: 1,
              yes: { text: "La mayoría aceptó la fórmula: se recupera ≈ 70 % del alza y los clientes valoraron poder revisarla.", effects: { clientes: 1 }, facts: [f("precio", 33.6, "Recargo indexado aceptado (70 % del alza)")] },
              no: { text: "Solo la mitad aceptó a la primera; el resto lo vas a negociar uno por uno.", effects: {}, facts: [f("precio", 16.8, "Recargo indexado aceptado por la mitad")] },
            }),
          },
          b: {
            effects: {},
            facts: [f("precio", 48, "Tarifas 8 % más altas desde el mes siguiente", { days: 4 })],
            pending: pend({
              who: "Clientes grandes", what: "Que no abran licitación", p: 0.5, days: 3,
              yes: { text: "Ningún cliente grande abrió licitación.", effects: {} },
              no: { text: "Almena invitó a Avante a cotizar.", effects: { clientes: -3 } },
            }),
          },
          c: {
            effects: {},
            facts: [f("inversion", -8, "Telemetría y capacitación de manejo"), f("costo", 15, "Consumo 2 % menor, medido al cierre", { days: 6 })],
            pending: pend({
              who: "Operadores", what: "Que adopten el manejo eficiente", p: 0.6, days: 3,
              yes: { text: "La flota adoptó el manejo eficiente.", effects: {} },
              no: { text: "Los operadores lo resintieron al principio.", effects: { equipo: -1 } },
            }),
          },
        }),
        expired: { ...at.expired, effects: {} },
        data: rows(
          { "Manejo eficiente con telemetría": ["Manejo eficiente con telemetría", "≈ $8 M · −2 % de consumo ≈ $15 M al año · en 4 de cada 10 flotas los operadores lo resienten al principio"] },
          [],
        ),
      }, "Economía real: el alza del diésel es un hecho al llegar; el dato de consumo se corrige (−2 %).");

    // ───────────────────────────────────────────── etapa 3 · Cumbre
    case "d3-planta":
      return rev({
        options: opts({
          a: { effects: { equipo: 8, clientes: -2 }, facts: [f("pago", -0.42, "Penalización de SuperNorte por entrega incompleta", { expense: true }), f("pago", -0.3, "Sensor nuevo y técnico del tostador", { expense: true })] },
          b: { effects: { clientes: 1, equipo: -6 }, facts: [f("pago", -0.3, "Sensor nuevo y técnico del tostador (el fin de semana siguiente)", { expense: true, days: 6 })] },
          c: { effects: { equipo: 3, clientes: -1, consejo: -1 }, facts: [f("pago", -0.42, "Javier paró la línea: penalización de SuperNorte", { expense: true }), f("pago", -0.3, "Sensor nuevo y técnico del tostador", { expense: true })] },
        }),
        expired: { ...at.expired, effects: { equipo: -7 } },
        data: rows({}, [["Reparación del sensor", "≈ $300 mil (cotización del técnico)"]]),
      }, "Economía real: parar cuesta la penalización y la reparación; seguir operando no genera dinero, solo aplaza la reparación.");
    case "c-planta-accidente":
      return rev({
        arrival: { text: "El accidente ya ocurrió: la reparación urgente del tostador se paga elijas lo que elijas.", effects: {}, facts: [f("pago", -0.3, "Reparación urgente del tostador", { expense: true })] },
        options: opts({
          a: { effects: { equipo: 4, consejo: -2 }, facts: [f("pago", -0.42, "Paro de la línea 2: penalización de SuperNorte", { expense: true }), f("pago", -0.6, "Multa mínima de la STPS: hubo medidas correctivas", { expense: true, days: 3 })] },
          b: { effects: { equipo: -8, consejo: -3 }, facts: [f("pago", -2.5, "Multa de la STPS sin medidas correctivas", { expense: true, days: 3 })] },
        }),
        expired: { ...at.expired, effects: { equipo: -10, consejo: -4 }, facts: [f("pago", -2.5, "Multa de la STPS sin medidas correctivas", { expense: true, days: 3 })] },
        data: { title: "Lo que sabes", rows: [["Lesionado", "Toño · quemadura de segundo grado, estable (lo cubre el Seguro)"], ["Multa posible de la STPS", "hasta $2.5 M sin medidas correctivas; ≈ $600 mil si las hay"], ["Penalización de SuperNorte si se para la línea", "$420 mil"]] },
      }, "Economía real: la multa depende de si hay medidas correctivas; lavarse las manos ya no suma caja.");
    case "d3-diego":
      return rev({
        options: opts({
          a: { effects: { consejo: 3, equipo: 2 }, facts: [f("pago", -2, "Anticipo de TV regional e influencers", { expense: true }), f("pago", -4, "Resto del lanzamiento nacional", { expense: true, days: 10 })] },
          b: { effects: { equipo: 3, consejo: 1 }, facts: [f("pago", -0.8, "Piloto en 30 tiendas de Monterrey", { expense: true })] },
          c: { effects: { consejo: -5, equipo: -2 } },
        }),
        expired: { ...at.expired, effects: { consejo: -4 } },
      }, "Economía real: el lanzamiento es gasto de marketing en dos pagos; decir que no no genera caja.");
    case "c-piloto":
      return rev({
        options: opts({
          a: { effects: { clientes: 3, consejo: 4 }, facts: [f("pago", -1.5, "Lanzamiento en 300 tiendas del noreste", { expense: true }), f("precio", 5.5, "Venta incremental neta en 300 tiendas (≈ $14 M al 39 %)", { days: 10 })] },
          b: {
            effects: { equipo: 2, consejo: -1 },
            facts: [f("pago", -6, "Lanzamiento nacional con el plan original", { expense: true })],
            pending: pend({
              who: "Logística y tiendas", what: "Que la rotación del piloto se sostenga en 1,200 tiendas", p: 0.5, days: 4,
              yes: { text: "La rotación se sostuvo en casi todo el país: la venta incremental llegó.", effects: { clientes: 3 }, facts: [f("precio", 9, "Venta incremental nacional (con la canibalización del piloto)")] },
              no: { text: "Fuera del noreste no rotó: devoluciones y producto caducado en anaquel.", effects: { clientes: -2 }, facts: [f("precio", 2, "Venta incremental real, mucho menor a la del piloto"), f("pago", -1.5, "Devoluciones y producto caducado", { expense: true })] },
            }),
          },
        }),
        expired: { ...at.expired, effects: { consejo: -2, equipo: -2 } },
        data: rows({}, [["Lanzamiento en 300 tiendas", "≈ $1.5 M (estimación de Ana)"], ["Lanzamiento nacional", "$6 M (plan original de Diego)"]]),
      }, "Economía real: la venta incremental del piloto es un hecho; el salto nacional depende de que la rotación se sostenga.");
    case "d4-objetivos":
      return rev({
        options: opts({
          a: { effects: { consejo: 4, equipo: -2 }, facts: [f("costo", 4.1, "Bonos atados al margen de la empresa: deja de pagarse volumen con descuento", { days: 10 })] },
          b: { effects: { equipo: 3, consejo: -1 } },
          c: { effects: { equipo: -4 }, facts: [f("costo", 2, "Objetivos alineados en papel, sin compromiso de los directores", { days: 10 })] },
        }),
        expired: { ...at.expired, effects: { consejo: -2 } },
        data: rows({}, [["Si el bono se ata al margen", "≈ 1 punto de margen recuperado (≈ $4.1 M al año, estimación de Lucía)"]]),
      }, "Economía real: alinear bonos recupera margen; mantener lo de siempre no lo empeora más allá de lo que ya pasó.");
    // ───────────────────────────────────────────── etapa 3 · Forja
    case "fn-d1-andon": {
      const escape = (p: number) => pend({
        who: "Línea de Aurora", what: "Que no llegue una pieza con rebaba a la armadora", p, days: 3,
        yes: { text: "Ninguna pieza mala llegó a Aurora esta semana.", effects: {} },
        no: { text: "Una pieza con rebaba llegó a Aurora: paró su línea una hora y llegó el cargo.", effects: { clientes: -2 }, facts: [f("pago", -2.4, "Cargo de Aurora por una hora de línea parada ($40 mil por minuto)", { expense: true })] },
      });
      return rev({
        options: opts({
          a: { effects: { equipo: 3, clientes: 3, consejo: -1 }, facts: [f("pago", -1.2, "Paros por andon de la semana mientras se encuentra la causa (≈ 65 minutos)", { expense: true })] },
          b: { effects: { consejo: 1, equipo: -3, clientes: -1 }, pending: escape(0.6) },
          c: { effects: { equipo: 2, clientes: 1, consejo: 1 }, facts: [f("pago", -0.6, "Paros acotados a 60 segundos por el líder de celda", { expense: true })] },
        }),
        expired: { ...at.expired, effects: { equipo: -4, clientes: -1 } },
      }, "Economía real: los paros cuestan minutos de línea; quitar el andon ahorra eso a cambio del riesgo de un cargo de Aurora.");
    }
    case "fn-d2-soldadores":
      return rev({
        options: opts({
          a: { effects: { equipo: 5 }, facts: [f("pago", -2.4, "Bono de retención de 12 meses para 40 soldadores", { expense: true }), f("costo", -1.2, "Transporte desde la colonia")] },
          b: { effects: { equipo: 2, clientes: -2, consejo: -1 }, facts: [f("pago", -1.1, "Escuela interna con el tecnológico de Ramos", { expense: true })] },
          c: { effects: { consejo: 3, equipo: -5 }, facts: [f("costo", -0.9, "Arrendamiento de dos celdas robotizadas"), f("costo", 3.7, "Se elimina el tiempo extra de soldadura", { days: 10 }), f("pago", -1.5, "Liquidación de 10 puestos", { expense: true, days: 10 })] },
        }),
        expired: { ...at.expired, effects: { equipo: -5 }, facts: [f("costo", -1.9, "El tiempo extra sube a la mitad más")] },
      }, "Economía real: cada camino con su monto del caso; no decidir sube el tiempo extra.");
    case "fn-d4-pleito":
      return rev({
        options: opts({
          a: { effects: { equipo: 4, clientes: 1, consejo: -1 } },
          b: {
            effects: { consejo: 1, equipo: -3, clientes: -1 },
            pending: pend({
              who: "Línea de Aurora", what: "Que no se escape una pieza con variación", p: 0.6, days: 4,
              yes: { text: "El programa salió y ninguna pieza se escapó.", effects: {} },
              no: { text: "Se escapó un lote con variación: Aurora paró su línea dos horas.", effects: { clientes: -2 }, facts: [f("pago", -4.8, "Cargo de Aurora por dos horas de línea parada", { expense: true })] },
            }),
          },
          c: { effects: { clientes: 3, equipo: -3 }, facts: [f("pago", -1, "Tiempo extra para recuperar el programa del mes", { expense: true })] },
        }),
        expired: { ...at.expired, effects: { equipo: -5, clientes: -2 } },
      }, "Economía real: respaldar a Producción ahorra paros a cambio del riesgo de un escape; respaldar a Calidad cuesta tiempo extra.");
    case "fn-d5-ciber":
      return rev({
        arrival: { text: "El ataque ya ocurrió: los servidores están cifrados y hay que restaurarlos elijas lo que elijas.", effects: {}, facts: [f("pago", -1.5, "Restauración de servidores y horas de Sistemas", { expense: true })] },
        options: opts({
          a: { effects: { clientes: -3, equipo: -2, consejo: 2 }, facts: [f("pago", -5, "Cinco días en manual: tiempo extra y entregas parciales", { expense: true })] },
          b: { effects: { clientes: 2, consejo: -5 }, facts: [f("pago", -21, "Rescate de US$1.2 M en cripto", { expense: true }), f("pago", -1.5, "Recuperar el 20 % que no regresó", { expense: true, days: 3 })] },
          c: { effects: { clientes: -1, consejo: 4 }, facts: [f("pago", -3.5, "Firma de respuesta a incidentes", { expense: true }), f("pago", -4, "Operación en manual mientras evalúan", { expense: true })] },
        }),
        expired: { ...at.expired, effects: { clientes: -8, consejo: -5 }, facts: [f("pago", -5, "Planta parada sin plan", { expense: true }), f("pago", -9.6, "Cargos de Aurora por cuatro horas de línea parada", { expense: true, days: 2 })] },
      }, "Economía real: el rescate es un pago de $21 M; operar en manual y la firma de respuesta tienen su costo.");
    case "fn-d5-plataforma": {
      const award = (p: number, margin: number, pct: string, adv: number) => pend({
        who: "Aurora Motors", what: "Que asigne la plataforma SUV 2028", p, days: 5,
        yes: { text: `Aurora asignó la plataforma con margen de ${pct}: hay que anticipar la prensa.`, effects: { clientes: 4 }, facts: [f("precio", margin, `Margen de ${pct} sobre ≈ $150 M al año del programa`, { days: 10 }), f("inversion", -adv, "Anticipo de la prensa de 1,200 toneladas", { days: 7 })] },
        no: { text: "Aurora asignó la plataforma a otro proveedor.", effects: { clientes: -4 } },
      });
      return rev({
        options: opts({
          a: { effects: { clientes: 2, consejo: 2 }, pending: award(0.7, 9, "6 %", 35) },
          b: { effects: { consejo: -3 }, pending: award(0.25, 16.5, "11 %", 35) },
          c: { effects: { clientes: 2, consejo: -2 } },
        }),
        expired: { ...at.expired, effects: { consejo: -3 } },
        data: rows({}, [["Anticipo de la prensa si se gana", "10 % de $350 M al confirmar"]]),
      }, "Economía real: ganar trae margen y el anticipo de la prensa; proponer herramental de Aurora aplaza la decisión sin dinero.");
    }
    case "fn-d6-proveedor": {
      const supply = pend({
        who: "Fundición en Asia", what: "Que las piezas por avión lleguen antes de agotar los 9 días de inventario", p: 0.7, days: 5,
        yes: { text: "Las piezas por avión llegaron a tiempo.", effects: {} },
        no: { text: "El primer embarque se retrasó: Aurora paró su línea dos horas.", effects: { clientes: -3 }, facts: [f("pago", -4.8, "Cargo de Aurora por dos horas de línea parada", { expense: true })] },
      });
      return rev({
        options: opts({
          a: { effects: { clientes: 3, consejo: -1 }, facts: [f("pago", -12, "Anticipo a Fundiciones del Bajío con garantía sobre sus moldes")] },
          b: { effects: { consejo: 1 }, facts: [f("pago", -7.6, "Sobrecosto de 38 % y flete aéreo durante 6 meses", { expense: true })], pending: supply },
          c: { effects: { consejo: 3, equipo: -1 }, facts: [f("inversion", -60, "Compra de la fundición (140 empleados)", { days: 7 })] },
        }),
        expired: { ...at.expired, effects: { clientes: -8 }, facts: [f("pago", -9.6, "Cargos de Aurora: cuatro horas de línea parada sin nudillos", { expense: true, days: 9 })] },
      }, "Economía real: el anticipo es caja recuperable; Asia es sobrecosto con riesgo; comprar la fundición rebasa la autoridad del director.");
    }
    case "fn-c-inv-lineas":
      return rev({
        options: opts({
          a: { effects: { consejo: 1, equipo: -2 }, facts: [f("capital_trabajo", 20, "Inventario liberado en las otras cuatro líneas (primeras semanas)", { days: 7 })] },
          b: { effects: { equipo: 1 }, facts: [f("capital_trabajo", 12, "Inventario liberado en las otras cuatro líneas, sin cambiar el bono", { days: 7 })] },
          c: { effects: { consejo: 3, equipo: -2 }, facts: [f("pago", -11, "Pago adelantado al fondo con la caja liberada")] },
        }),
        expired: { ...at.expired, effects: { equipo: -2 } },
      }, "Economía real: extender la mejora libera inventario; adelantar el pago al fondo saca caja, no la genera.");
    case "fn-c-inv-factoraje":
      return rev({
        options: opts({
          a: { effects: { clientes: 1, consejo: 1 } },
          b: { effects: { clientes: 1, consejo: -1 }, facts: [f("costo", 0.4, "Cambias factoraje (13 % anual) por crédito bancario (12 %)")] },
          c: { effects: { clientes: -2 } },
        }),
        expired: { ...at.expired, effects: { clientes: -3, consejo: -1 } },
      }, "Economía real: responder a Aurora no cuesta dinero; cambiar de financiamiento casi no cambia el costo.");
    case "fn-s-precio-mas":
      return rev({
        options: opts({
          a: { effects: { clientes: -2, consejo: 2 } },
          b: { effects: { clientes: 4, consejo: -3 }, facts: [f("precio", -50, "3 % de productividad a Aurora (primer año de cinco; se acumula)")] },
          c: { effects: { clientes: -6, consejo: -1 } },
        }),
        expired: { ...at.expired, effects: { clientes: -4, consejo: -2 } },
      }, "Economía real: el 3 % anual es una concesión de precio; ofrecerlo solo con rediseño o negarse no regala ni gana dinero.");
    case "fn-s-precio-rfq":
      return rev({
        options: opts({
          a: { effects: { clientes: 2, consejo: 2 }, facts: [f("pago", -2, "Ingeniería del rediseño de dos piezas", { expense: true })] },
          b: { effects: { clientes: 4, consejo: -2 }, facts: [f("precio", -10.8, "Cotizar al objetivo: el programa arranca perdiendo 6 % por pieza contra el costo de hoy")] },
          c: { effects: { clientes: -5, consejo: -1 } },
        }),
        expired: { ...at.expired, effects: { clientes: -6, consejo: -3 } },
      }, "Economía real: cotizar al objetivo compromete margen; defender el precio actual no genera dinero, solo te deja fuera.");
    // ───────────────────────────────────────────── etapa 3 · Brasa
    case "gb-d4-carne":
      return rev({
        arrival: { text: "La res ya subió 14 % desde el lunes: el food cost pasa de 33 % a 36 % elijas lo que elijas.", effects: {}, facts: [f("costo", -29.4, "Res 14 % más cara: 3 puntos de food cost", { external: true })] },
        options: opts({
          a: { effects: { clientes: -4 }, facts: [f("precio", 29.4, "Menú 6 % más caro"), f("precio", -12, "Tráfico −4 % (venta que se deja de atender)", { external: true })] },
          b: { effects: { equipo: 1, consejo: 1 }, facts: [f("costo", 12.6, "Contrato a 12 meses: +8 % en lugar de +14 %"), f("pago", -0.2, "Cata ciega con 50 clientes", { expense: true })] },
          c: { effects: { clientes: 2, consejo: -2 } },
        }),
        expired: { ...at.expired, effects: {} },
      }, "Economía real: el alza ya ocurrió; cada camino recupera una parte con su monto. Absorber no tiene castigo extra: ya se paga en el costo.");
    case "gb-d5-cdmx": {
      const plan = pend({
        who: "Las 6 sucursales de CDMX", what: "Que respondan al plan de recuperación", p: 0.4, days: 7,
        yes: { text: "Dos sucursales ya llegaron a equilibrio y las demás pierden la mitad.", effects: { clientes: 1 }, facts: [f("costo", 8.4, "La pérdida de CDMX se reduce a la mitad")] },
        no: { text: "El plan no movió el tráfico: CDMX sigue perdiendo lo mismo.", effects: { consejo: -1 } },
      });
      return rev({
        options: opts({
          a: { effects: { consejo: 1, equipo: -2 }, facts: [f("pago", -14.7, "Penalización por cerrar 4 sucursales", { expense: true }), f("costo", 13.2, "Se elimina la pérdida de las 4 peores", { days: 7 })] },
          b: { effects: { equipo: 2, consejo: -2 }, facts: [f("pago", -4, "Gerente regional, menú y marketing local (primer tramo de $8 M)", { expense: true })], pending: plan },
          c: { effects: { consejo: -3, equipo: -3 }, facts: [f("pago", -22, "Penalización por cerrar las 6 sucursales", { expense: true }), f("costo", 16.8, "Se elimina la pérdida de CDMX", { days: 7 })] },
        }),
        expired: { ...at.expired, effects: {} },
      }, "Economía real: cerrar cuesta la penalización y elimina la pérdida; el plan cuesta y depende de que funcione. La pérdida actual ya está en el negocio.");
    }
    case "gb-d6-dark":
      return rev({
        options: opts({
          a: { effects: { equipo: -1 }, facts: [f("pago", -0.4, "Prueba de 8 semanas en 2 cocinas", { expense: true })] },
          b: { effects: { clientes: -2, equipo: -3 }, facts: [f("pago", -1.5, "Marca, fotos y empaques", { expense: true }), f("precio", 1.6, "Margen de 4 % sobre $40 M de venta en apps", { days: 10 })] },
          c: { effects: { equipo: 1, consejo: -1 } },
        }),
      }, "Economía real: la marca virtual tiene un costo y un margen chico; probar cuesta poco.");
    case "gb-d6-sucesion":
      return rev({
        options: opts({
          a: { effects: { consejo: 5, equipo: 1 }, facts: [f("pago", -0.5, "Protocolo familiar y dos consejeros independientes", { expense: true })] },
          b: { effects: { consejo: -3 } },
          c: { effects: { consejo: -3, equipo: 1 } },
        }),
      }, "Economía real: una recomendación no mueve dinero; el protocolo y los consejeros sí cuestan.");
    case "gb-c-prov-contrato":
      return rev({
        options: opts({
          a: {
            effects: { equipo: -1 },
            pending: pend({
              ...at.options.find((o) => o.id === "a")!.pending!,
              yes: { text: "El proveedor aceptó el 85 % y los dos pagos. Firmaste el descuento con un riesgo acotado; el primer pago salió de la caja.", effects: { consejo: 1 }, facts: [f("costo", 9.6, "8 % menos sobre ≈ $120 M de res al año"), f("pago", -3, "Primer pago del anticipo")] },
              no: { text: "El proveedor sostuvo sus condiciones y retiró la oferta del 8 %: la semana de negociación no dio descuento.", effects: { consejo: -1 } },
            }),
          },
          b: { effects: { consejo: 1 }, facts: [f("costo", 9.6, "8 % menos sobre ≈ $120 M de res al año"), f("pago", -6, "Anticipo del 20 % del primer trimestre")] },
          c: { effects: { consejo: -1 } },
        }),
        expired: { ...at.expired, effects: { consejo: -1 } },
      }, "Economía real: el anticipo es caja que se adelanta, no gasto; el descuento es margen. No firmar no suma caja.");
    // ───────────────────────────────────────────── etapa 3 · Kúbit
    case "kb-d1-guardia":
      return rev({
        options: opts({
          a: { effects: { equipo: 3, clientes: 3, consejo: -1 }, facts: [f("pago", -0.5, "Días extra de ingeniería para la entrega de Altamar", { expense: true })] },
          b: {
            effects: { consejo: 1, equipo: -3, clientes: -1 },
            pending: pend({
              who: "La plataforma en cierre de mes", what: "Que no se caiga con cambios sin revisar", p: 0.6, days: 4,
              yes: { text: "El cierre de mes pasó sin caídas.", effects: {} },
              no: { text: "La plataforma se cayó en cierre de mes: créditos por contrato y clientes molestos.", effects: { clientes: -2 }, facts: [f("pago", -1, "Créditos por contrato (10 % de la mensualidad de los afectados)", { expense: true })] },
            }),
          },
          c: { effects: { equipo: 2, clientes: 1, consejo: 1 }, facts: [f("pago", -0.2, "Revisión acotada a dinero y datos de clientes", { expense: true })] },
        }),
        expired: { ...at.expired, effects: { equipo: -4, clientes: -1 } },
      }, "Economía real: revisar cuesta días de ingeniería; quitar la revisión ahorra eso a cambio del riesgo de créditos por caída.");
    case "kb-c-mejora":
      return rev({
        options: opts({
          a: { effects: { equipo: 5, clientes: 3 }, facts: [f("pago", -0.6, "60 días enseñando la práctica a todos los equipos", { expense: true }), f("costo", 1.5, "Menos incidentes y solicitudes de soporte en toda ingeniería", { days: 10 })] },
          b: { effects: { equipo: 2, consejo: 1, clientes: -1 }, facts: [f("costo", 0.4, "Menos solicitudes de soporte en infraestructura")] },
        }),
      }, "Economía real: extender la mejora cuesta capacitación y ahorra soporte.");
    case "kb-d2-fuga":
      return rev({
        options: opts({
          a: { effects: { equipo: 5 }, facts: [f("pago", -6, "Bono de retención de 12 meses para 40 ingenieros clave", { expense: true })] },
          b: { effects: { equipo: 2, clientes: -2, consejo: -1 }, facts: [f("pago", -2.5, "Academia interna con la universidad", { expense: true })] },
          c: { effects: { consejo: 3, equipo: -5 }, facts: [f("costo", -5, "Equipo subcontratado en el extranjero"), f("costo", 6, "Se dejan de cubrir vacantes con horas extra", { days: 10 })] },
        }),
        expired: { ...at.expired, effects: { equipo: -5 }, facts: [f("costo", -2, "Las horas extra se disparan")] },
      }, "Economía real: cada camino con su monto del caso; no decidir sube las horas extra.");
    case "kb-d5-banco":
      return rev({
        arrival: { text: "Las cuentas ya están congeladas: $90 M que no puedes usar mientras se aclara si se recuperan. No se dan por perdidos.", effects: {} },
        options: opts({
          a: { effects: { equipo: 3, clientes: 1, consejo: -1 } },
          b: { effects: { equipo: -6, consejo: -3 } },
          c: { effects: { consejo: 3, equipo: 2 }, facts: [f("pago", -0.3, "Comisión de apertura de la línea puente", { expense: true })] },
        }),
        expired: { ...at.expired, effects: { equipo: -8, consejo: -4 } },
      }, "Economía real: pagar la nómina no es un gasto nuevo y pagar la mitad no genera caja; la línea puente cuesta su comisión.");
    case "kb-d6-denuncia":
      return rev({
        options: opts({
          a: { effects: { equipo: 4, consejo: 1 }, facts: [f("pago", -0.8, "Investigación de una firma externa", { expense: true }), f("pago", -1, "Ventas de la región que bajan unas semanas", { expense: true })] },
          b: { effects: { equipo: -6, consejo: -2 } },
          c: { effects: { equipo: 3, consejo: -3 }, facts: [f("pago", -2.5, "Liquidación y defensa ante una demanda por despido", { expense: true })] },
        }),
      }, "Economía real: investigar y despedir tienen costo; no hacer nada no genera dinero.");
    case "kb-s-altamar-mas":
      return rev({
        options: opts({
          a: { effects: { clientes: -2, equipo: 2 } },
          b: { effects: { clientes: 4, equipo: -5 }, facts: [f("pago", -6.5, "9 ingenieros seis meses en desarrollos sin costo", { expense: true })] },
          c: { effects: { clientes: -6, equipo: 3 } },
        }),
        expired: { ...at.expired, effects: { clientes: -4, consejo: -1 } },
      }, "Economía real: regalar desarrollos cuesta ingenieros; cotizar aparte o negarse no genera dinero.");
    case "kb-s-altamar-grupo": {
      const award = (p: number, margin: number, text: string, cost: number, costText: string) => pend({
        who: "Grupo Altamar", what: "Que elija a Kúbit para el grupo", p, days: 7,
        yes: { text: "Altamar eligió a Kúbit para el grupo.", effects: { clientes: 3 }, facts: [f("precio", margin, text, { days: 7 }), f("pago", -cost, costText, { expense: true })] },
        no: { text: "Altamar eligió a otro proveedor para el grupo.", effects: { clientes: -3 } },
      });
      return rev({
        options: opts({
          a: { effects: { equipo: -1, consejo: 2 }, pending: award(0.5, 12, "Margen de las primeras cuatro empresas con 10 % de descuento", 2, "Implementación de cuatro empresas") },
          b: { effects: { equipo: -5 }, pending: award(0.85, 10, "Margen de 14 empresas con 20 % de descuento, menos implementaciones que salen mal", 6, "Contratación a la carrera para 14 implementaciones") },
          c: { effects: { consejo: -1 }, pending: award(0.15, 14, "Margen de las primeras cuatro empresas a precio de lista", 2, "Implementación de cuatro empresas") },
        }),
        expired: { ...at.expired, effects: { clientes: -6, consejo: -2 } },
        data: rows({}, [["Margen de cuatro empresas por trimestre", "≈ $12 M al año con 10 % de descuento (estimación de Andrea)"]]),
      }, "Economía real: ganar el grupo trae margen e implementación; la probabilidad depende de la oferta.");
    }
    case "vl-s-almena-mas":
      return rev({
        options: opts({
          a: {
            effects: {},
            pending: pend({
              who: "Ricardo (Almena)", what: "Que acepte el esquema de bono", p: 0.5, days: 3,
              yes: { text: "Ricardo asignó los dos CEDIS con el esquema de bono.", effects: { clientes: 2 } },
              no: { text: "Ricardo pidió propuesta a Avante para los dos CEDIS.", effects: { clientes: -2 } },
            }),
          },
          b: { effects: { clientes: 3 }, facts: [f("precio", -6, "5 % adicional a Almena"), f("inversion", -60, "15 unidades nuevas, pagadas al recibirlas", { days: 3 })] },
          c: {
            effects: {},
            pending: pend({
              who: "Ricardo (Almena)", what: "Que no le dé los CEDIS a Avante", p: 0.4, days: 3,
              yes: { text: "Ricardo retrocedió.", effects: {} },
              no: { text: "Avante va a operar los dos CEDIS nuevos.", effects: { clientes: -3 } },
            }),
          },
        }),
        expired: { ...at.expired, effects: { clientes: -2 } },
        data: rows({}, [["Venta de los dos CEDIS", "≈ $120 M al año (estimación de Patricio)"]]),
      }, "Economía real: $60 M de unidades rebasan la autoridad del director; una amenaza no genera dinero.");
  }
  return undefined;
}

export function withV10(items: Item[]): Item[] {
  return items.map((it) => {
    const r = revisionsV10(it);
    return r ? { ...it, revisions: [...(it.revisions ?? []), ...r] } : it;
  });
}
