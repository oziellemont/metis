/**
 * mêtis CEO · Vértice · cadena piloto de consecuencias (v7): «El diésel subió y los contratos no».
 *
 * Decisión del día 2: el diésel subió 12 % y los contratos no tienen recargo por combustible (encargo: margen y clientes).
 *  - Fórmula de recargo pública, contrato por contrato (a) → día 4: Almena acepta y pide simetría y auditoría.
 *  - Subir 8 % a todos con aviso de 15 días (b)           → día 4, incierto (50 de cada 100): Almena abre licitación
 *                                                          e invita a Avante (negativa).
 *  - Absorber y bajar consumo con telemetría (c)          → día 5, incierto (40 de cada 100): los operadores resienten
 *                                                          el tablero de consumo por operador.
 * La probabilidad se dice desde el día 2. Solo llega en periodos con reglas v7 o posteriores (`since: 7`).
 */
import type { Item } from "../types";

const V = 7;

export const CADENA_VERTICE: Item[] = [
  {
    id: "vl-d2-diesel", day: 2, slot: 3, channel: "reporte", from: "patricio", since: V,
    involves: ["mauricio", "antonio", "hinojosa"],
    subject: "El diésel subió 12 % y los contratos no",
    preview: "El diésel ya es el 38 % del costo y 70 % de los contratos no tiene recargo por combustible…",
    body: [
      "Director: el diésel subió 12 % en cuatro meses. Ya es el 38 % de nuestro costo y el 70 % de los contratos no tiene recargo por combustible: cada kilómetro de más se come el margen.",
      "Mauricio teme que si subimos tarifas, Avante aproveche para quitarnos cuentas. Antonio cree que podemos bajar consumo con manejo eficiente.",
      "Te pongo tres caminos con números.",
    ],
    data: {
      title: "Lo que sabes",
      rows: [
        ["Costo extra del diésel", "≈ $4 M al mes"],
        ["Fórmula de recargo indexada, contrato por contrato", "Recupera ≈ 70 % en tres meses"],
        ["Subir 8 % a todos con aviso de 15 días", "Recupera todo desde el mes siguiente"],
        ["Mauricio: con un alza general así", "En 1 de cada 2 casos un cliente grande abre licitación"],
        ["Manejo eficiente con telemetría", "−6 % de consumo · en 4 de cada 10 flotas los operadores lo resienten al principio"],
      ],
      note: "Estimaciones de Patricio, Mauricio y Antonio.",
    },
    ask: "¿Cómo enfrentas el alza del diésel?",
    options: [
      { id: "a", stance: { patricio: 1, mauricio: 1, antonio: -1 }, text: "Proponer a cada cliente una fórmula pública de recargo ligada al precio del diésel, empezando por los contratos que vencen.", reply: ["Es lo más defendible ante un cliente.", "(Antonio) Mientras tanto seguimos perdiendo en cada viaje."], outcome: "Recuperas la mayor parte con una regla que el cliente puede revisar. Tarda tres meses y cada contrato es una negociación.", effects: { margen: 2, clientes: -1, equipo: -1 }, style: { horizonte: 2, conflicto: 1 }, score: 3 },
      { id: "b", stance: { patricio: 2, mauricio: -2 }, text: "Subir 8 % todas las tarifas con aviso de 15 días: el diésel subió para todos y Avante tiene el mismo problema.", reply: ["Se recupera el margen de inmediato.", "(Mauricio) Director, Almena está buscando pretexto para invitar a Avante."], outcome: "El margen regresa desde el mes siguiente. Le das a tus clientes grandes una razón para cotizar con la competencia.", effects: { margen: 3, caja: 1, clientes: -3, consejo: 1 }, style: { horizonte: -1, conflicto: 2 }, score: 1 },
      { id: "c", stance: { antonio: 2, patricio: -1 }, text: "No tocar tarifas: absorber el alza y bajar consumo con telemetría, rutas y capacitación de manejo eficiente.", reply: ["Con eso bajamos consumo de verdad.", "(Patricio) Es buena idea, pero no alcanza a cubrir todo el alza."], outcome: "Los clientes no ven cambios y la flota aprende a gastar menos. El margen se recupera solo en parte y pagas la telemetría.", effects: { clientes: 1, equipo: 1, margen: -1, caja: -1 }, style: { horizonte: 1, riesgo: -1 }, score: 2 },
    ],
    expired: { reply: ["(Patricio) Sin decisión, absorbemos el alza este mes."], outcome: "Sin decisión, el diésel siguió comiéndose el margen.", effects: { margen: -2, caja: -1 } },
    lesson: "negociacion",
    bitacora: { title: "El costo que nadie controla", text: "El diésel no lo controla nadie en la mesa. Lo que sí se controla es quién absorbe el alza y con qué regla. Una fórmula que el cliente puede revisar convierte una discusión de poder en una de datos.", nota: "Cuando el costo sube para todos, gana quien propone la regla más justa, no el que sube primero." },
    areas: ["negociacion", "finanzas", "clientes"],
  },

  // ───────────────────────────────────────────── DÍA 4 · camino «fórmula pública»: el cliente pide simetría
  {
    id: "vl-c-diesel-formula", day: 4, slot: 3, channel: "email", from: "hinojosa", since: V,
    involves: ["mauricio", "patricio"],
    trigger: { item: "vl-d2-diesel", options: ["a"] },
    subject: "Supermercados Almena · Recargo por combustible", preview: "Aceptamos revisar su fórmula, con dos condiciones…",
    body: [
      "Estimado Director:",
      "Revisamos su propuesta de recargo por combustible. Es la primera que recibimos con una fórmula clara y la valoramos.",
      "Aceptamos con dos condiciones: que la fórmula también baje la tarifa cuando baje el diésel, y que nuestro equipo pueda auditar los consumos una vez al año.",
      "Ricardo Hinojosa\nDirector de Logística · Supermercados Almena",
    ],
    data: { title: "Lo que sabes", rows: [["Almena en la venta", "20 %"], ["Simetría (baja si baja el diésel)", "Pronóstico: el diésel se mantiene alto 12 meses"], ["Auditoría de consumos", "Exige telemetría confiable en su ruta"], ["Otros clientes", "Esperan ver qué firma Almena"]] },
    ask: "¿Aceptas las condiciones de Almena?",
    options: [
      { id: "a", stance: { hinojosa: 2, mauricio: 1, patricio: -1 }, text: "Aceptar la simetría con un piso y un techo, y la auditoría anual con los datos de telemetría de su ruta.", reply: ["Me parece justo. Lo firmamos así.", "(Patricio) El piso nos protege si el diésel se desploma."], outcome: "Firmas con tu cliente más grande una regla que los demás van a copiar. Abres tus consumos a revisión y aceptas ganar menos si el diésel baja.", effects: { margen: 1, clientes: 2, equipo: -1, caja: -1 }, style: { horizonte: 2, conflicto: -1 }, score: 3 },
      { id: "b", stance: { patricio: 1, hinojosa: -2 }, text: "Aceptar la auditoría pero no la simetría: el riesgo del diésel lo asumimos nosotros cuando sube.", reply: ["Entonces no es una fórmula, es un aumento.", "Lo voy a revisar con mi director."], outcome: "Proteges el margen si el diésel baja. Almena siente que la fórmula clara era solo un aumento con otro nombre.", effects: { margen: 2, clientes: -2 }, style: { conflicto: 1, foco: 1 }, score: 1 },
      { id: "c", stance: { mauricio: 2, hinojosa: 1, patricio: -2 }, text: "Aceptar todo tal cual para cerrar rápido y usarlo como modelo con los demás clientes.", reply: ["Excelente. Le mando el anexo hoy.", "(Patricio) Sin piso, si el diésel baja fuerte trabajamos con pérdida."], outcome: "Cierras rápido y con una buena relación. Te quedas sin protección si el diésel baja de golpe.", effects: { clientes: 2, margen: -1 }, style: { conflicto: -2, riesgo: 1 }, score: 2 },
    ],
    expired: { reply: ["(Almena) Sin respuesta, seguimos con la tarifa actual."], outcome: "Sin decisión, la propuesta se enfrió y el margen siguió bajando.", effects: { margen: -2 } },
    lesson: "negociacion",
    bitacora: { title: "Una regla justa tiene que serlo en los dos sentidos", text: "La fórmula clara abrió la puerta. El cliente pidió lo que cualquier contraparte pediría: que la regla también lo proteja a él. Aceptarlo con límites convierte un aumento en una relación de largo plazo.", nota: "Si la regla solo te protege a ti, el cliente la va a tratar como un aumento." },
    areas: ["negociacion", "clientes", "finanzas"],
  },

  // ───────────────────────────────────────────── DÍA 4 · camino «alza general»: a veces el cliente licita
  {
    id: "vl-c-diesel-licitacion", day: 4, slot: 3, channel: "llamada", from: "mauricio", since: V,
    involves: ["hinojosa", "rodrigo", "gaby"],
    trigger: { item: "vl-d2-diesel", options: ["b"], roll: [0, 0.5] },
    subject: "Llamada perdida · Mauricio Cárdenas (Comercial)", preview: "Director, Almena abrió licitación por sus rutas e invitó a Avante…",
    body: [
      "Mensaje de voz · 0:42",
      "«Director, Almena respondió al aumento abriendo licitación por todas sus rutas del noreste e invitó a Avante. Tenemos diez días para presentar propuesta.»",
      "«Don Rodrigo ya me llamó. Necesito saber con qué vamos.»",
    ],
    data: { title: "Lo que sabes", rows: [["Almena en la venta", "20 %"], ["Precio estimado de Avante", "12 % abajo de nuestra tarifa anterior"], ["Nivel de servicio con Almena", "97 % a tiempo (Avante: sin historial en la región)"], ["Plazo de la licitación", "10 días"]] },
    ask: "Almena licita sus rutas. ¿Con qué te presentas?",
    options: [
      { id: "a", stance: { mauricio: 2, gaby: 1, rodrigo: -1 }, text: "Presentar la tarifa anterior con una fórmula de recargo pública, nuestro historial y penalización si fallamos.", reply: ["Así competimos en lo que Avante no tiene.", "(Don Rodrigo) Espero que con eso alcance."], outcome: "Retrocedes en el aumento y compites con servicio y transparencia. Pierdes parte del margen que habías ganado.", effects: { margen: -1, clientes: 1, consejo: -1, equipo: 1 }, style: { horizonte: 1, conflicto: 1 }, score: 3 },
      { id: "b", stance: { rodrigo: 2, mauricio: -1 }, text: "Igualar el precio de Avante para no perder la cuenta: el 20 % de la venta no se puede arriesgar hoy.", reply: ["(Don Rodrigo) No vamos a perder a Almena.", "(Mauricio) A ese precio la cuenta casi no deja."], outcome: "Probablemente conservas la cuenta. A ese precio, las rutas de Almena casi no dejan margen y el resto de los clientes lo va a saber.", effects: { clientes: 2, margen: -3 }, style: { conflicto: -1, riesgo: -1 }, score: 1 },
      { id: "c", stance: { mauricio: 1, gaby: 1, rodrigo: -1 }, text: "Ofrecer un descuento solo en las rutas donde Avante sí opera y mantener el aumento en las demás.", reply: ["Es más fino, aunque Almena lo va a ver como medio paso.", "(Gaby) En las rutas largas nadie nos alcanza en servicio."], outcome: "Defiendes el margen donde no tienes competencia. Almena puede leer la oferta como que no entendiste su molestia.", effects: { margen: 1, clientes: -1 }, style: { foco: 1, riesgo: 1 }, score: 2 },
    ],
    expired: { reply: ["(Mauricio) Sin indicación, presentamos la tarifa con el aumento."], outcome: "Sin decisión, la propuesta fue la misma tarifa que provocó la licitación.", effects: { clientes: -4, consejo: -1 } },
    lesson: "negociacion",
    bitacora: { title: "El aumento que invitó al competidor", text: "Subir a todos de golpe recuperó el margen y le dio al cliente más grande la razón para cotizar. Ahora la negociación es más difícil que la que se evitó: hay un competidor en la mesa.", nota: "Un cliente que concentra la venta no solo compra tu servicio: decide cuándo te pone a competir." },
    areas: ["negociacion", "clientes", "estrategia"],
  },

  // ───────────────────────────────────────────── DÍA 5 · camino «telemetría»: a veces los operadores la resienten
  {
    id: "vl-c-diesel-telemetria", day: 5, slot: 3, channel: "whatsapp", from: "pepe", since: V,
    involves: ["antonio", "rocio"],
    trigger: { item: "vl-d2-diesel", options: ["c"], roll: [0, 0.4] },
    subject: "José «Pepe» Medina", preview: "Director, en el patio pegaron el ranking de consumo con nombres y la gente está molesta…",
    body: [
      "Director, con respeto: en el patio pegaron un ranking de consumo por operador, con nombres. Los de abajo son los que hacen la ruta de la sierra, que gasta más por las pendientes.",
      "Ya hay compañeros que hablan de irse a Avante. Dicen que los están exhibiendo por una ruta que nadie quiere.",
      "El consumo sí bajó 5 %. Nomás queremos que se mida parejo.",
    ],
    data: { title: "Lo que sabes", rows: [["Consumo de la flota", "−5 % en seis semanas"], ["Ranking por operador", "Público, con nombres, sin ajustar por ruta"], ["Operadores de la ruta sierra", "Todos en el último lugar"], ["Rotación de operadores", "38 % anual"]] },
    ask: "¿Qué haces con el ranking de consumo?",
    options: [
      { id: "a", stance: { pepe: 2, rocio: 1, antonio: -1 }, text: "Quitar los nombres del ranking, medir por ruta y premiar a quien mejore contra sí mismo.", reply: ["Gracias, Director. Así sí se mide parejo.", "(Antonio) Perdemos presión, pero entiendo."], outcome: "Conservas la mejora de consumo y la medición se vuelve justa. Pierdes algo de presión individual y Antonio tiene que rediseñar el tablero.", effects: { equipo: 2, margen: -1, caja: -1 }, style: { estilo: 2, horizonte: 1 }, score: 3 },
      { id: "b", stance: { antonio: 2, pepe: -2 }, text: "Mantener el ranking como está: el consumo ya bajó 5 % y la presión está funcionando.", reply: ["Entendido.", "(Rocío) Director, la rotación nos cuesta más que el diésel."], outcome: "La presión sigue y el consumo puede bajar más. Los operadores de la sierra se sienten señalados y algunos se van.", effects: { margen: 2, equipo: -3 }, style: { conflicto: 2, estilo: -1 }, score: 1 },
      { id: "c", stance: { pepe: 1, antonio: 1 }, text: "Ajustar el ranking por tipo de ruta y de carga, pero mantenerlo público y con nombres.", reply: ["Es mejor que antes.", "(Pepe) Igual nadie quiere ver su nombre abajo en el patio."], outcome: "La comparación se vuelve más justa. Sigue siendo una exhibición pública y eso pesa en el clima del patio.", effects: { margen: 1, equipo: -1 }, style: { conflicto: 1, foco: 1 }, score: 2 },
    ],
    expired: { reply: ["(Pepe) Sin respuesta. Dos compañeros ya renunciaron."], outcome: "Sin decisión, el ranking siguió y empezaron las renuncias.", effects: { equipo: -3 } },
    lesson: "personas",
    bitacora: { title: "Una medida que se vuelve exhibición", text: "La telemetría bajó el consumo, como se esperaba. Cómo se usó el dato decidió el clima: medir sin ajustar por ruta y con nombres convirtió una mejora en una injusticia visible.", nota: "Un número que no compara situaciones parecidas no mide desempeño: mide suerte." },
    areas: ["personas", "cultura", "operacion"],
  },
];
