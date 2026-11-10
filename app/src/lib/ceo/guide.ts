/**
 * mêtis CEO · guía contextual del botón «?» (esquina inferior derecha).
 *
 * Para cada pantalla, y para cada pestaña de Empresa y de Carrera, dice qué estás viendo y responde las preguntas
 * clave: qué es un estado de resultados, qué es el margen, cómo te evalúa el consejo, etc.
 * Solo es contenido de lectura: no cambia puntajes, efectos ni veredictos. Lógica pura (sin React) para poder probarla.
 *
 * Claves: la ruta («/ceo/bandeja») o la ruta con su vista («/ceo/empresa#finanzas»). Cuando una vista cambia según el
 * tipo de empresa, la variante lleva el tipo al final («/ceo/empresa#finanzas@crecimiento»).
 */
import { matchScore } from "@/lib/search";

/** continua: carrera continua con estados financieros · crecimiento: empresa en crecimiento · temporadas: carrera por temporadas. */
export type CompanyKind = "continua" | "crecimiento" | "temporadas";
export interface CeoFaq { q: string; a: string; only?: CompanyKind[] }
export interface CeoGuide { title: string; purpose: string; shows: string[]; faqs: CeoFaq[] }

const f = (q: string, a: string, only?: CompanyKind[]): CeoFaq => (only ? { q, a, only } : { q, a });

// ───────────────────────────────────────────── conceptos que se repiten en varias pantallas
const K = {
  ventas: f("¿Qué son las ventas y su meta?", "Las ventas son lo que la empresa vendió en el mes. La meta es lo que el consejo espera vender ese mes y crece un poco cada mes. Si las ventas quedan debajo de la meta, la cifra se resalta en ámbar."),
  ventasSolo: f("¿Qué son las ventas?", "Lo que la empresa vendió en el mes, antes de restar cualquier costo o gasto."),
  estado: f("¿Qué es el estado de resultados?", "Es el resumen de cuánto ganó o perdió la empresa en un mes. Empieza con las ventas y va restando lo que costó lograrlas: primero el costo de ventas, luego la nómina, la mercadotecnia y los otros gastos. Lo que queda al final es el EBITDA."),
  costo: f("¿Qué es el costo de ventas?", "Lo que cuesta producir o entregar lo que vendiste: materia prima, insumos o mercancía. Sube y baja junto con las ventas."),
  margen: f("¿Qué son la utilidad bruta y el margen bruto?", "La utilidad bruta son las ventas menos el costo de ventas. El margen bruto es esa utilidad como porcentaje de las ventas: de cada 100 pesos vendidos, cuántos quedan después de pagar lo que costó producirlos. Con ese dinero se pagan la nómina y los demás gastos."),
  gastos: f("¿Qué son nómina, mercadotecnia y otros gastos?", "Nómina: sueldos y prestaciones de tu gente. Mercadotecnia: lo que inviertes para vender más, como campañas y promoción. Otros gastos: renta, servicios, administración y lo demás que la empresa necesita para operar."),
  ebitda: f("¿Qué es el EBITDA?", "Es la ganancia de la operación: la utilidad bruta menos nómina, mercadotecnia y otros gastos, antes de intereses, impuestos, depreciación y amortización. Dice si el negocio, por sí solo, gana dinero. Si sale negativo, la operación está perdiendo."),
  ebitdaPct: f("¿Qué significa el porcentaje debajo del EBITDA?", "Es el EBITDA dividido entre las ventas: de cada 100 pesos vendidos, cuántos quedan como ganancia de la operación."),
  caja: f("¿Qué es la caja?", "El efectivo disponible de la empresa: con lo que se pagan la nómina, los proveedores y las inversiones. Una empresa puede vender mucho y aun así quedarse sin caja."),
  flujo: f("¿Qué es el flujo de efectivo?", "Es el movimiento real de dinero en el mes: con cuánta caja empezaste, cuánto entró, cuánto salió y con cuánto terminas. Caja al cierre es igual a caja al inicio más entradas menos salidas."),
  entradas: f("¿Qué cuenta como entradas y salidas?", "Entradas: lo que cobraste a tus clientes en el mes y, si lo hubo, financiamiento nuevo. Salidas: todo lo que pagaste, es decir costo de ventas, nómina, mercadotecnia, otros gastos, inversión e intereses."),
  ebitdaVsCaja: f("¿Por qué el EBITDA y la caja no se mueven igual?", "Porque vender no es cobrar. El EBITDA cuenta la venta cuando se hace; la caja, cuando el cliente paga. Además, de la caja salen cosas que el EBITDA no incluye, como la inversión y los intereses. Por eso una empresa puede ganar en el estado de resultados y aun así quedarse sin efectivo."),
  cobro: f("¿Qué son los días de cobro?", "Cuántos días tarda la empresa, en promedio, en cobrar lo que vende. Mientras más días, más dinero tuyo está en manos de los clientes y menos en tu caja. Bajan cuando mejora tu indicador de caja y suben cuando empeora."),
  pista: f("¿Qué son los meses de pista?", "Los meses que la empresa aguanta con la caja que tiene si sigue saliendo más dinero del que entra, al ritmo de este mes. Con menos de 6 meses se resalta como alerta. Si dice «La operación genera caja», este mes entró más de lo que salió y no hay cuenta regresiva."),
  etapas: f("¿Qué significan Histórico, Cierre definitivo y Proyección?", "Histórico: cómo estaba la empresa cuando llegaste. Cierre definitivo: un mes que ya cerró, con números firmes. Proyección: el mes en curso, calculado con lo que llevas decidido; se vuelve cierre definitivo al cerrar el periodo."),
  moneda: f("¿Para qué sirve el selector MXN / USD?", "Cambia la moneda en que ves las cifras. La conversión usa un tipo de cambio de referencia fijo del simulador, no una cotización en vivo. Cambiar de moneda no altera tus resultados."),
  indices: f("¿Cómo se relacionan los indicadores de salud con estos números?", "Los cinco indicadores de salud van de 0 a 100 y no son dinero, pero mueven el dinero: cuando mejora el de clientes, las ventas crecen más rápido; cuando mejora el de margen, sube el margen bruto; cuando mejora el de caja, cobras en menos días. Tus decisiones mueven los indicadores y los indicadores mueven estos estados."),
  retraso: f("¿Cuándo se nota una inversión que apruebo?", "Lo que apruebas al firmar el reporte del mes sale de la caja a partir del mes siguiente y su efecto llega con retraso: una campaña tarda en traer ventas y una inversión en la operación tarda en mejorar el margen. La caja paga primero y el resultado llega después."),
  salud: f("¿Qué es la salud de la empresa?", "Un número de 0 a 100: el promedio de los cinco indicadores (caja, margen, equipo, clientes y consejo; en tu empresa pueden llamarse distinto). El consejo pide una salud mínima al cierre. Toca una barra para ver qué decisiones la movieron y cuándo."),
  consejo: f("¿Qué es el consejo?", "El consejo de administración: el grupo que representa a los dueños. Te nombró, te fija la misión de cada periodo y evalúa tu gestión al cierre."),
  revisa: f("¿Qué revisa el consejo para aprobar un periodo?", "Tres cosas: que cumplas el encargo (tus indicadores objetivo en la línea o más), que la empresa cierre sana (salud mínima y ningún indicador debajo del piso) y que tus decisiones estén bien razonadas. Además, no cruzar ninguna línea roja."),
  noAprueba: f("¿Qué pasa si el consejo no aprueba el periodo?", "No hay despido. Sigues al frente de la misma empresa y el siguiente periodo es para corregir lo que quedó debajo de la línea."),
  vencer: f("¿Qué pasa si dejo vencer un asunto?", "Cada asunto tiene plazo. Si se vence, alguien decide por ti y tú cargas con el resultado: a quien te escribió le cae mal y el asunto cuenta en contra de tu criterio ante el consejo."),
  constancia: f("¿Qué son la racha y los XP?", "Miden tu constancia. La racha cuenta los días seguidos en que decidiste o estudiaste algo; los XP se suman con tu práctica diaria. Son tu hábito, no un requisito: no abren cargos ni capítulos. En Academy, los XP sí abren lecciones nuevas."),
  kpi: f("¿Qué es un KPI?", "Un indicador clave de desempeño: un número que resume si una parte del negocio va bien, por ejemplo cuánto compra en promedio cada cliente o cuántos días de inventario tienes. Cada industria tiene los suyos."),
} as const;

// ───────────────────────────────────────────── guías por pantalla y por vista
const GUIDES: Record<string, CeoGuide> = {
  "/ceo": {
    title: "Hoy",
    purpose: "Tu centro de mando: lo que espera tu decisión y cómo amanece la empresa.",
    shows: [
      "El número grande son los asuntos por resolver; abajo está la lista para abrirlos.",
      "«Tu día» resume en pocas líneas lo que ya decidiste, lo que se venció y lo que viene.",
      "«Misión del consejo» es el encargo del periodo: objetivos, salud y criterio.",
      "En el panel blanco están la salud de la empresa, tu mandato y tu siguiente lección.",
    ],
    faqs: [
      f("¿Qué es un asunto?", "Un correo, mensaje, llamada, junta o reporte que necesita tu decisión. Trae la situación, quién te la plantea y varias opciones. Lo que elijas mueve los indicadores de la empresa y tu relación con las personas."),
      K.vencer,
      K.salud,
      f("¿Qué significan Objetivo, Salud y Criterio en la misión?", "Objetivo: los indicadores que el consejo te encargó llevar a su línea o más. Salud: el promedio mínimo de los cinco indicadores, sin que ninguno caiga debajo del piso. Criterio: el porcentaje mínimo de asuntos bien razonados; los que dejas vencer cuentan en contra."),
      f("¿Qué es un caso ejecutivo?", "Una situación más larga, de varios pasos, que se resuelve en una sola sentada de unos minutos: lees el contexto, te preparas y decides. Aparece en la lista con la etiqueta «Caso ejecutivo»."),
      f("¿Qué es el reporte del mes?", "Al cerrar cada mes llega un reporte con tus números contra la meta y una decisión de caja. El siguiente mes se cierra después de firmarlo.", ["continua"]),
      K.constancia,
      f("¿Qué hago si no hay nada pendiente?", "Durante el día llegan más asuntos, dentro del horario que elegiste en Ajustes. Mientras tanto puedes repasar la teoría en Academy o revisar cómo va tu empresa."),
    ],
  },
  "/ceo/bandeja": {
    title: "Bandeja",
    purpose: "Todo lo que te ha llegado: correos, WhatsApps, reportes, llamadas y juntas.",
    shows: [
      "Cada renglón es un asunto: quién te escribe, por qué canal y en qué estado está.",
      "Los filtros Todo, Pendientes, Decididos y Vencidos te ayudan a encontrar uno.",
      "Abre un asunto ya decidido para repasar qué elegiste y qué pasó después.",
    ],
    faqs: [
      f("¿Qué significan las etiquetas?", "«Vence en»: el tiempo que te queda para decidir. «Decidido»: ya lo resolviste. «Venció sin respuesta»: se acabó el plazo y alguien decidió por ti. «Caso ejecutivo»: una situación de varios pasos. «Reporte»: el cierre de un mes que espera tu firma."),
      K.vencer,
      f("¿Puedo cambiar una decisión ya tomada?", "No. Como en una empresa real, lo decidido queda en la historia y sus consecuencias siguen su curso. Sí puedes abrir el asunto para ver qué pasó y qué aprendiste."),
      f("¿Por qué llegan asuntos que no esperaba?", "Algunas decisiones traen consecuencias que llegan días después como asuntos nuevos: un cliente que responde, un colaborador que reacciona, el consejo que pregunta."),
      f("¿Cuándo llegan los asuntos?", "A lo largo del día, dentro del horario que definiste en Ajustes. Con el modo intensivo, todo lo del día llega junto al inicio de tu horario."),
    ],
  },

  // ─────────── Empresa
  "/ceo/empresa#resumen": {
    title: "Empresa · Resumen",
    purpose: "Una lectura rápida de cómo va tu negocio este mes.",
    shows: [
      "Tres cifras del mes: ventas, EBITDA y caja.",
      "«Lo que merece tu atención»: hasta tres focos, del más urgente al menos; tócalos para ir a donde se explican.",
      "«Qué cambió desde tu última decisión»: los últimos movimientos de tus indicadores y su causa.",
      "«Salud de la empresa» con sus cinco indicadores y, al final, la ficha de la empresa.",
    ],
    faqs: [
      { ...K.ventas, only: ["continua"] },
      { ...K.ventasSolo, only: ["crecimiento"] },
      K.ebitda,
      K.ebitdaPct,
      K.caja,
      { ...K.pista, only: ["continua"] },
      K.salud,
      f("¿Qué significa el color de cada punto?", "Indica la urgencia: coral es lo que pide atención ya, ámbar es para vigilar y morado es un aviso."),
      { ...K.etapas, only: ["continua"] },
    ],
  },
  "/ceo/empresa#finanzas": {
    title: "Empresa · Finanzas",
    purpose: "Los números de tu empresa: cuánto vende, cuánto gana y cuánto efectivo tiene.",
    shows: [
      "«Este mes»: ventas, EBITDA y caja, con el selector para verlas en pesos o en dólares.",
      "La comparación contra el mes anterior.",
      "«Estado de resultados»: de las ventas al EBITDA, renglón por renglón.",
      "«Flujo de efectivo»: la caja al inicio, lo que entró, lo que salió y la caja al cierre.",
      "«Historial»: cada barra son las ventas de un mes y la línea punteada es la meta. Toca un mes para ver sus estados.",
    ],
    faqs: [
      K.estado, K.ventas, K.costo, K.margen, K.gastos, K.ebitda, K.flujo, K.entradas, K.ebitdaVsCaja, K.cobro, K.pista, K.etapas, K.indices, K.retraso, K.moneda,
    ],
  },
  "/ceo/empresa#finanzas@crecimiento": {
    title: "Empresa · Finanzas",
    purpose: "Las cifras de los meses que ya cerraron en tu empresa.",
    shows: [
      "«Último mes cerrado»: ventas, EBITDA y el saldo de caja de hoy.",
      "«Historial»: ventas, EBITDA y caja de cada mes cerrado.",
      "El estado de resultados detallado de cada mes está en Operación, junto con tus decisiones de crecimiento.",
    ],
    faqs: [
      K.ventasSolo, K.ebitda, K.caja, K.ebitdaVsCaja, K.estado, K.costo, K.margen,
      f("¿Qué significa «Cierre definitivo»?", "Que ese mes ya cerró y sus números están firmes. El mes en curso aparece cuando cierra."),
    ],
  },
  "/ceo/empresa#finanzas@temporadas": {
    title: "Empresa · Finanzas",
    purpose: "Esta empresa se evalúa con los cinco indicadores de salud, no con estados financieros.",
    shows: [
      "Esta empresa no lleva estado de resultados ni flujo de efectivo.",
      "Sus cinco indicadores de salud están en Resumen y en Consejo.",
    ],
    faqs: [
      K.salud,
      f("¿Qué mide cada indicador?", "Caja: el efectivo para operar. Margen: lo que queda de cada peso vendido. Equipo: clima, confianza y talento que se queda. Clientes: su lealtad. Consejo: la confianza en tu dirección. En tu empresa pueden llamarse distinto; cada uno trae su explicación en Consejo."),
      K.revisa,
    ],
  },
  "/ceo/empresa#operacion": {
    title: "Empresa · Operación",
    purpose: "Los KPI operativos: las métricas con que se mide una empresa de tu industria.",
    shows: [
      "Cada renglón es un KPI con su valor actual, su meta y su estado.",
      "Van primero los de mayor impacto: los más lejos de su meta.",
      "Toca un renglón para ver qué significa, cómo ha evolucionado y qué decisiones lo movieron.",
    ],
    faqs: [
      K.kpi,
      f("¿En qué se distinguen de la salud de la empresa?", "La salud son cinco indicadores de 0 a 100 que el consejo usa para evaluarte. Los KPI operativos son las medidas del día a día del negocio, en sus propias unidades (pesos, días, porcentajes), y se comparan contra la meta del sector."),
      f("¿Qué significan En meta, Cerca, Fuera de meta y Sin meta?", "En meta: cumple la meta del sector. Cerca: le falta poco. Fuera de meta: está lejos y presiona los resultados del mes. Sin meta: no tiene meta fija y se lee por su tendencia."),
      f("¿Qué significan ≥ y ≤ en la meta?", "≥ quiere decir que conviene estar en ese número o arriba. ≤ quiere decir en ese número o abajo, como pasa con los días de inventario o los defectos."),
      f("¿Qué es «Mayor impacto»?", "Marca los KPI más lejos de su meta, con más peso si los mueve un indicador que vigila el consejo. Es donde más rinde tu atención."),
      f("¿Cómo muevo un KPI?", "No se mueven directo. La mayoría depende de uno de los cinco indicadores de salud: al abrir el renglón verás con cuál se mueve y qué decisiones lo subieron o lo bajaron."),
      K.etapas,
    ],
  },
  "/ceo/empresa#operacion@crecimiento": {
    title: "Empresa · Operación",
    purpose: "Tu operación día a día: alertas, decisiones de crecimiento y resultados de cada mes.",
    shows: [
      "Arriba, el día de operación, tu caja y las alertas.",
      "Si hay una decisión de crecimiento abierta, aparece aquí para resolverla.",
      "Las cifras del mes: ventas, EBITDA, tu gente y la deuda.",
      "Abajo se despliegan los estados financieros, lo que mueve tus indicadores y tus decisiones.",
    ],
    faqs: [
      f("¿Qué es una decisión de crecimiento?", "Una decisión grande sobre cómo crecer: contratar, ampliar capacidad, pedir un crédito o entrar a un mercado. Cada opción dice qué ganas y qué sacrificas."),
      K.ebitda,
      f("¿Qué significa la deuda «vencida»?", "La deuda es lo que la empresa debe al banco. «Vencido» es la parte que ya debías haber pagado: tensa la relación con el banco y conviene atenderla primero."),
      K.estado, K.costo, K.margen, K.caja, K.ebitdaVsCaja,
    ],
  },
  "/ceo/empresa#operacion@temporadas": {
    title: "Empresa · Operación",
    purpose: "Esta empresa se evalúa con los cinco indicadores de salud.",
    shows: [
      "Esta empresa no lleva KPI operativos del sector.",
      "Sus cinco indicadores de salud están en Resumen.",
    ],
    faqs: [K.salud, K.kpi, K.revisa],
  },
  "/ceo/empresa#personas": {
    title: "Empresa · Personas",
    purpose: "Quién es quién en tu empresa y cómo está tu relación con cada persona.",
    shows: [
      "«Consejo»: la presidencia y los consejeros que te evalúan.",
      "«Te reportan»: tu equipo directo.",
      "«Relaciones clave»: las que están frías y conviene atender.",
      "Toca a una persona para ver qué le importa, con quién se lleva y su historial contigo. El organigrama completo está a un botón.",
    ],
    faqs: [
      f("¿Cómo se mide una relación?", "Cada relación va de 0 a 100 y empieza en 50. Sube cuando tus decisiones cuidan lo que a esa persona le importa y baja cuando la afectan o no le respondes."),
      f("¿Qué significan Aliado, Bien, Neutral, Distante y Relación rota?", "Aliado: 75 o más. Bien: 60 o más. Neutral: arriba de 40. Distante: arriba de 25. Relación rota: 25 o menos."),
      f("¿Por qué cambió mi relación con alguien con quien no traté nada?", "Las personas están conectadas. Lo que decides con una se refleja también en sus aliados y en quienes influye; con quien tiene un conflicto con ella, el efecto va al revés."),
      f("¿Para qué me sirven las relaciones?", "Quien confía en ti arranca más cerca cuando impulsas un cambio en la organización, al cierre del periodo. Y conocer qué le importa a cada quien te ayuda a decidir mejor sus asuntos."),
      f("¿Qué pasa si dejo vencer el asunto de alguien?", "A quien te escribió le cae mal: su relación contigo baja."),
      K.consejo,
    ],
  },
  "/ceo/empresa#consejo": {
    title: "Empresa · Consejo",
    purpose: "Cómo te evalúa el consejo y cómo vas contra lo que te pide.",
    shows: [
      "Tres cifras: la confianza del consejo, la salud de la empresa y la salud mínima exigida.",
      "«Misión»: el encargo de este periodo.",
      "«Los cinco criterios»: cada indicador con su valor y su mínimo. La marca «Objetivo» señala los que te encargaron.",
      "«Criterio de decisión» y «Líneas rojas»: cómo decides y lo que el consejo no perdona.",
      "«Cómo vas hoy»: la revisión del consejo, punto por punto.",
    ],
    faqs: [
      K.consejo,
      K.revisa,
      f("¿Qué son la línea del consejo y el piso?", "La línea es el valor que deben alcanzar tus indicadores objetivo. El piso es el mínimo que ningún indicador puede perforar, aunque no sea objetivo. Caja y consejo tienen un piso más exigente."),
      f("¿Qué es el criterio de decisión?", "El porcentaje de asuntos que resolviste de forma bien razonada. Una respuesta defendible cuenta como bien razonada aunque tenga costo; los asuntos que dejas vencer cuentan en contra."),
      f("¿Qué son las líneas rojas?", "Conductas que el consejo no perdona aunque los números salgan bien: poner en riesgo la seguridad de las personas, el fraude o encubrir un error culpando a otro, las represalias contra quien denuncia y ocultar riesgos al consejo o a un cliente. Además, la caja no puede caer en insolvencia."),
      f("¿Qué es la confianza del consejo?", "Uno de los cinco indicadores de salud, de 0 a 100: cuánto te respalda hoy el consejo. Se mueve con tus decisiones, igual que los otros cuatro."),
      K.salud,
      K.noAprueba,
    ],
  },

  // ─────────── Carrera
  "/ceo/carrera#carrera": {
    title: "Carrera · Mi carrera",
    purpose: "La historia de tu gestión: en qué capítulo va la empresa y cómo te evalúa el consejo.",
    shows: [
      "Arriba, tu mandato y el capítulo en que está la empresa.",
      "Las prioridades del consejo, tus compromisos abiertos y los hitos de tu gestión.",
      "Las decisiones que marcaron el mes y cómo han evolucionado los indicadores.",
      "La tarjeta del veredicto: lo que revisa el consejo y, al terminar, el botón para cerrar el periodo.",
    ],
    faqs: [
      f("¿Qué son los capítulos?", "Describen el momento de la empresa, no un rango tuyo: Tomar el mando, Estabilizar, Construir capacidad, Acelerar con criterio, Escalar y Gobernar la complejidad."),
      f("¿Cómo pasa la empresa al siguiente capítulo?", "«Tomar el mando» dura tu primer mes. Después, la empresa avanza cuando lleva los meses mínimos en el capítulo y el consejo aprueba el cierre del mes. Si no lo aprueba, sigue en el mismo capítulo."),
      f("¿Qué es un compromiso o una consecuencia abierta?", "Algo que quedó pendiente: un asunto que espera respuesta, la consecuencia de algo que decidiste o un reporte por revisar. También está en tu bandeja."),
      f("¿Cómo se cierra un periodo?", "Primero atiendes los asuntos del periodo. Luego presentas el reto final, un proyecto de cambio en tu organización. Con eso el consejo da su veredicto y puedes cerrar el periodo desde esta pantalla."),
      K.revisa,
      K.noAprueba,
      f("¿La racha y los XP cuentan para mi carrera?", "No. Miden tu constancia y se ven en Mi perfil. Tu trayectoria depende solo de lo que pasa en la empresa y de la evaluación del consejo."),
    ],
  },
  "/ceo/carrera#carrera@temporadas": {
    title: "Carrera · Mi carrera",
    purpose: "El veredicto del consejo y las empresas que has dirigido.",
    shows: [
      "La tarjeta del veredicto, con tus cinco rubros contra la línea de aprobación.",
      "«Tu camino de empresas»: las que has dirigido y la que sigue.",
    ],
    faqs: [
      f("¿Cómo se cierra una empresa?", "Primero atiendes sus asuntos. Luego presentas el reto final, un proyecto de cambio en tu organización. Con eso el consejo da su veredicto."),
      K.revisa,
      f("¿Qué pasa si el consejo no aprueba?", "Puedes volver a dirigir la misma empresa con lo que ya sabes y probar otros caminos. Conservas tu XP, tu racha y lo aprendido."),
      f("¿Qué es el camino de empresas?", "Cada empresa tiene su idioma, su red de relaciones y sus dilemas. Al aprobar una, pasas a otra de un giro distinto, con más exigencia."),
      f("¿La racha y los XP cuentan para el veredicto?", "No. Miden tu constancia y se ven en Mi perfil."),
    ],
  },
  "/ceo/carrera#perfil": {
    title: "Carrera · Mi perfil",
    purpose: "Cómo diriges: tu estilo, tus competencias y tu constancia.",
    shows: [
      "Tu estilo de dirección y, aparte, tu constancia (XP y racha).",
      "«Mi liderazgo» en tres partes: preferencias, competencias y resultados de la empresa.",
      "«Experiencia declarada»: lo que nos contaste de tu trayectoria.",
      "«Cómo decides», tus insignias y tu bitácora con cada decisión.",
    ],
    faqs: [
      f("¿En qué se distinguen preferencias y competencias?", "Las preferencias describen tu estilo y no tienen lado bueno ni malo: corto o largo plazo, prudente o audaz, números o personas, decidir solo o involucrar, evitar o encarar. Las competencias sí miden qué tan bien resuelves: analizar, consultar, anticipar, negociar, ejecutar y priorizar."),
      f("¿Qué significan las etiquetas de las competencias?", "Tendencia observada: hay señales, pero pocas; es lo normal en un primer periodo. En desarrollo: hay evidencia suficiente, sin un patrón claro. Fortaleza consistente: lo hiciste bien muchas veces, en situaciones distintas y en más de un periodo. Área por desarrollar: la misma dificultad apareció varias veces. Aún sin situaciones: no te ha tocado un asunto que la ponga a prueba."),
      f("¿Por qué los resultados de la empresa van aparte?", "Porque un buen resultado no prueba buen criterio, ni al revés: puedes decidir bien y que el entorno no ayude. Por eso se reportan por separado."),
      f("¿Qué miden la racha y los XP?", "Tu práctica diaria. La racha son los días seguidos en que decidiste o estudiaste; los días en pausa no la rompen. No abren cargos, capítulos ni competencias."),
      f("¿Para qué sirve la experiencia declarada?", "Ajusta por dónde empiezas y cuánta ayuda ves. No suma competencias ni puntos, y puedes editarla cuando quieras."),
      f("¿Qué es la bitácora?", "El registro de cada decisión que tomaste y lo que aprendiste de ella. Puedes abrir cualquier caso para repasarlo."),
      f("¿Qué son las insignias?", "Reconocimientos por logros concretos de tu gestión. Cada una dice qué pide; las que tienen candado siguen pendientes."),
    ],
  },

  // ─────────── Academy y Ajustes
  "/ceo/academy": {
    title: "Academy",
    purpose: "La teoría detrás de tus decisiones, en lecciones cortas.",
    shows: [
      "Cada tema es una ruta de habilidad con niveles: de lo esencial a lo más profundo.",
      "«Tu enfoque de estudio» sugiere la competencia que más te conviene practicar.",
      "Con «Para ti» ves las rutas ordenadas según lo que has demostrado; con «Orden original», todas en su orden.",
      "Al final está el glosario de tu industria, con buscador.",
    ],
    faqs: [
      f("¿Cómo se abren más lecciones?", "Con tu constancia: al reunir más XP se abren niveles nuevos. Los XP se ganan decidiendo en tu empresa y completando lecciones."),
      f("¿Qué es «Tu enfoque de estudio»?", "Es la competencia donde tus decisiones muestran menos dominio por ahora. Las lecciones sugeridas te ayudan a practicarla; tu lectura en Mi liderazgo cambia con lo que decidas en la empresa."),
      f("¿Las lecciones mueven a mi empresa?", "No mueven los indicadores ni el veredicto. Suman XP de constancia, cuentan para tu racha y te dan criterio para decidir mejor. El XP por lecciones tiene un tope por día."),
      f("¿Puedo repetir una lección?", "Sí. Repasar no suma XP de nuevo, pero la teoría se vuelve criterio cuando la aplicas."),
      f("¿Qué es el glosario?", "Las palabras propias de tu industria explicadas en corto. Úsalo cuando un asunto traiga un término que no conozcas."),
    ],
  },
  "/ceo/ajustes": {
    title: "Ajustes",
    purpose: "Tu cuenta, tu horario y el ritmo con que te llegan los asuntos.",
    shows: [
      "Tu cuenta, el nombre de tu empresa y cómo te llama tu equipo.",
      "«Cómo te llegan los asuntos»: correo, horario, zona horaria y meta diaria.",
      "«Ritmo y notificaciones»: el día tranquilo y la pausa de tu carrera.",
    ],
    faqs: [
      f("¿Para qué sirve el horario?", "Los asuntos te llegan dentro del horario que marques en «Desde» y «Hasta», según tu zona horaria."),
      f("¿Qué es el modo intensivo?", "Todo lo del día te llega junto al inicio de tu horario, con 5 minutos entre mensaje y mensaje. Sirve si prefieres resolver todo en una sola sentada."),
      f("¿Qué es la meta diaria de decisiones?", "Cuántas decisiones te propones al día: Tranquilo (1), Constante (2) o Intensivo (3). Es una meta personal para sostener el hábito."),
      f("¿Qué es un día tranquilo?", "Ese día no llegan asuntos nuevos y tus plazos se detienen hasta mañana. Puedes tomar uno cada semana."),
      f("¿Qué pasa si pauso mi carrera?", "Se detiene todo: plazos, asuntos nuevos y avisos. No pierdes tu avance y los días en pausa no rompen tu racha. Al reanudar, cada asunto conserva el tiempo que le quedaba."),
      f("¿Por qué conviene crear mi cuenta?", "Sin cuenta, tu empresa vive solo en este navegador. Con tu cuenta no la pierdes y puedes seguirla en cualquier dispositivo."),
    ],
  },

  // ─────────── pantallas a las que se llega desde otras
  "/ceo/reporte": {
    title: "Reporte del mes",
    purpose: "El cierre de un mes: qué pasó con tus números y la decisión de caja que sigue.",
    shows: [
      "«Qué cambió»: tus cifras del mes contra el mes anterior y la meta.",
      "«Por qué»: las causas detrás del cambio.",
      "«Qué está en juego» y «Tu decisión»: la propuesta de Finanzas y tus opciones.",
      "Al firmar, el reporte queda registrado y puede cerrarse el siguiente mes.",
    ],
    faqs: [
      f("¿Qué decido en el reporte?", "Cuánta caja comprometer. Por ejemplo, una campaña de mercadotecnia cuando las ventas quedaron debajo de la meta, o una inversión en la operación para mejorar el margen. También puedes no invertir y conservar la caja."),
      K.retraso,
      f("¿Y si este mes no hay una decisión grande?", "Firmar el reporte también es decidir: confirmas que viste los números."),
      K.ebitda, K.pista, K.ebitdaVsCaja,
    ],
  },
  "/ceo/cambio": {
    title: "Proyecto de cambio",
    purpose: "El reto final del periodo: lograr que tu organización adopte un cambio.",
    shows: [
      "Cada persona del organigrama está en una etapa: resiste, escucha, prueba o adopta.",
      "Eliges una palanca y, si aplica, a quién va dirigida.",
      "Cada palanca cuesta semanas y el tiempo es limitado.",
      "Al terminar presentas el resultado al consejo, que da su veredicto del periodo.",
    ],
    faqs: [
      f("¿Cuál es la meta?", "Que al menos el 70 % de las personas llegue a «Adopta» antes de que se acaben las semanas."),
      f("¿Qué significan Resiste, Escucha, Prueba y Adopta?", "Cada persona tiene un avance de 0 a 100. Resiste: al inicio. Escucha: 25 o más. Prueba: 50 o más. Adopta: 75 o más."),
      f("¿Cómo elijo una palanca?", "Cada palanca funciona mejor en cierto momento: usada a tiempo mueve a la gente; a destiempo te cuesta credibilidad. Al seleccionarla verás cuándo conviene y cuántas semanas cuesta."),
      f("¿Qué es un formador de opinión?", "Una persona a la que los demás siguen: lo que pasa con ella pesa doble. Además, lo que pasa con un jefe baja a su equipo."),
      f("¿Por qué algunas personas arrancan más adelantadas?", "Porque lo que decidiste en el periodo ya cuenta: quien confía en ti arranca más cerca del cambio."),
      f("¿Para qué sirve la entrevista privada?", "Te revela qué le mueve a esa persona, para que elijas mejor la siguiente palanca con ella."),
    ],
  },
  "/ceo/junta": {
    title: "Junta ante el Consejo",
    purpose: "Una sesión extraordinaria ante el consejo de tu empresa.",
    shows: [
      "Son tres momentos encadenados frente a la presidencia y la consejera independiente.",
      "El consejo te mide en cuatro criterios: rendición de cuentas, criterio, gobierno y visión.",
    ],
    faqs: [
      f("¿Cómo se supera la junta?", "Terminando con la confianza del consejo en 60 o más y ningún criterio debajo de 55."),
      f("¿Qué mide cada criterio?", "Rendición de cuentas: dices lo que pasó, también lo que salió mal, y quién responde. Criterio: separas lo urgente de lo importante y decides con datos. Gobierno: respetas el papel del consejo y pones límites claros a los riesgos. Visión: conectas la decisión de hoy con la empresa de dentro de tres años."),
      f("¿Puedo volver a presentarla?", "Sí. Puedes volver a presentarla cuando el consejo vuelva a sesionar, en un día."),
      K.consejo,
    ],
  },
  "/ceo/crisis": {
    title: "Boardroom Crisis",
    purpose: "Una sesión extraordinaria del consejo, con reloj en cada decisión.",
    shows: [
      "Son tres decisiones seguidas y cada una tiene reloj.",
      "La crisis parte de tus indicadores de hoy: llegar con la caja o el consejo débiles la hace más difícil.",
    ],
    faqs: [
      f("¿Cuánto tiempo tengo por decisión?", "90 segundos. Si se acaba el tiempo, el consejo decide por ti."),
      f("¿Cómo puede terminar la crisis?", "Crisis contenida: la empresa sale golpeada, pero entera. Contenida, con daños: un frente quedó débil y el consejo lo va a vigilar. La crisis te rebasó: un indicador quedó en zona roja."),
      K.salud,
    ],
  },
  "/ceo/personas": {
    title: "Personas",
    purpose: "Un dilema al día sobre cómo abordar a alguien de tu equipo.",
    shows: [
      "El dilema de hoy, listo para resolver.",
      "Los dilemas por tema, con los que ya resolviste.",
    ],
    faqs: [
      f("¿Qué es un dilema?", "Una situación corta con una persona: el nuevo, el veterano, tu estrella, el que tiene quejas de su equipo. Ninguna respuesta es obvia; al responder ves por qué una opción funciona mejor que otra."),
      K.constancia,
    ],
  },
};

/** Vistas de las pantallas con pestañas y la que se abre si no hay ninguna elegida. */
const VIEWS: Record<string, { ids: readonly string[]; first: string }> = {
  "/ceo/empresa": { ids: ["resumen", "finanzas", "operacion", "personas", "consejo"], first: "resumen" },
  "/ceo/carrera": { ids: ["carrera", "perfil"], first: "carrera" },
};

const GENERAL: CeoFaq[] = [
  f("¿Cómo funciona mêtis CEO?", "Diriges una empresa como su CEO. Te llegan asuntos, decides, tus decisiones mueven los indicadores y las relaciones, y al cierre de cada periodo el consejo evalúa tu gestión."),
  f("¿Dónde veo los números de mi empresa?", "En Empresa. Resumen da la lectura rápida; Finanzas, el estado de resultados y el flujo de efectivo; Operación, los KPI del sector; Personas, tus relaciones; y Consejo, cómo te evalúan."),
  K.salud,
  K.consejo,
];

const FALLBACK: CeoGuide = {
  title: "mêtis CEO",
  purpose: "Diriges una empresa: decides, ves las consecuencias y el consejo evalúa tu gestión.",
  shows: [
    "Hoy: lo que espera tu decisión.",
    "Bandeja: todo lo que te ha llegado.",
    "Empresa: cómo va tu negocio.",
    "Carrera: tu trayectoria y tu perfil.",
    "Academy: la teoría detrás de las decisiones.",
  ],
  faqs: GENERAL,
};

const ROUTES = [...new Set(Object.keys(GUIDES).map((k) => k.split(/[#@]/)[0]))].sort((a, b) => b.length - a.length);
const forKind = (g: CeoGuide, kind: CompanyKind): CeoGuide => ({ ...g, faqs: g.faqs.filter((x) => !x.only || x.only.includes(kind)) });

/** Clave de la guía: ruta, o ruta con su vista. Sirve también para subrutas («/ceo/reporte?mes=2» → «/ceo/reporte»). */
export function ceoGuideKey(path: string, view?: string | null): string {
  const clean = (path || "/").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const route = ROUTES.find((r) => clean === r || (r !== "/ceo" && clean.startsWith(r + "/")));
  if (!route) return "";
  const v = VIEWS[route];
  return v ? `${route}#${view && v.ids.includes(view) ? view : v.first}` : route;
}

/** Guía de la pantalla (y vista) actual, según el tipo de empresa. */
export function ceoGuideFor(path: string, view?: string | null, kind: CompanyKind = "continua"): CeoGuide & { key: string } {
  const key = ceoGuideKey(path, view);
  const g = key ? GUIDES[`${key}@${kind}`] ?? GUIDES[key] : undefined;
  return { key, ...forKind(g ?? FALLBACK, kind) };
}

/** Todas las claves con guía propia (sin variantes por tipo de empresa). */
export const ceoGuideKeys = (): string[] => Object.keys(GUIDES).filter((k) => !k.includes("@"));

/** Busca una duda: primero en la pantalla actual, luego en el resto. Sin preguntas repetidas. */
export function searchCeoGuide(query: string, path: string, view?: string | null, kind: CompanyKind = "continua", limit = 6): (CeoFaq & { page: string; here: boolean })[] {
  if (!query.trim()) return [];
  const here = ceoGuideKey(path, view);
  const pool = [
    ...ceoGuideKeys().flatMap((k) => {
      const g = forKind(GUIDES[`${k}@${kind}`] ?? GUIDES[k], kind);
      return g.faqs.map((x) => ({ ...x, page: g.title, here: k === here }));
    }),
    ...GENERAL.map((x) => ({ ...x, page: "General", here: false })),
  ];
  const seen = new Set<string>();
  return pool
    .map((x) => ({ x, m: Math.max(matchScore(query, x.q), matchScore(query, x.q, x.a) * 0.6) }))
    .filter((r) => r.m > 0)
    .sort((a, b) => b.m + (b.x.here ? 0.5 : 0) - (a.m + (a.x.here ? 0.5 : 0)))
    .filter((r) => (seen.has(r.x.q) ? false : (seen.add(r.x.q), true)))
    .slice(0, limit)
    .map((r) => r.x);
}
