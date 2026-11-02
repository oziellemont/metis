/**
 * mêtis CEO · MUESTRA de casos rediseñados («sin respuestas obvias»). PARA REVISIÓN EDITORIAL.
 *
 * No está conectada al juego ni al banco: el banco de casos no se toca hasta que Oziel apruebe el criterio.
 * Doce asuntos (dos por industria) reescritos a partir de casos reales del banco y seis dilemas diarios.
 *
 * Reglas de redacción que siguen todos:
 *  - Opciones de largo y profundidad parecidos (la más larga no supera a la más corta por más de 30 %).
 *  - Nada de caricaturas (ignorar, regañar en público, no hacer nada) salvo que el caso lo justifique.
 *  - Cada opción es una estrategia ejecutiva real con beneficios, costos, riesgos y lo que sacrifica.
 *  - Al menos dos opciones defendibles; ninguna es mejor en todo (indicadores, relaciones y criterio).
 *  - El criterio (eje A) se califica con la rúbrica de `judgment.ts`, no con lo que pasa en los números (eje B).
 *  - Lo que dice cada personaje es coherente con cómo cambia la relación.
 */
import type { AuthoredJudgment } from "../judgment";
import type { CastId, Item, Kpis } from "../types";

export interface SampleOption {
  id: string;
  text: string;
  reply: string[];
  outcome: string;
  effects: Partial<Kpis>;
  stance: Record<CastId, number>;
  /** Nivel de criterio editorial 0–3 (eje A). */
  score: 0 | 1 | 2 | 3;
  judgment: AuthoredJudgment;
  /** Lo que se muestra al jugador después de decidir: qué ganó, qué pagó, qué quedó en riesgo. */
  benefits: string[];
  costs: string[];
  risks: string[];
}
export interface SampleCase {
  id: string;
  company: string;
  /** Caso del banco del que parte. */
  original: string;
  from: CastId;
  subject: string;
  body: string[];
  ask: string;
  options: SampleOption[];
  /** Qué cambió frente al original y por qué hay más de una respuesta defendible. */
  editorial: string;
}

const J = (analiza: 0 | 1 | 2, consulta: 0 | 1 | 2, anticipa: 0 | 1 | 2, negocia: 0 | 1 | 2, ejecuta: 0 | 1 | 2): AuthoredJudgment => ({ analiza, consulta, anticipa, negocia, ejecuta });

export const SAMPLE_CASES: SampleCase[] = [
  // ───────────────────────────────────────────── Cumbre (alimentos)
  {
    id: "rd-d2-ana", company: "cumbre", original: "d2-ana", from: "ana",
    subject: "Pronóstico Q1 · versión final (22 láminas)",
    body: ["Buen día, Director: Le comparto el pronóstico de ventas del Q1 para la junta del consejo de mañana a las 9. Incluí el detalle por SKU, canal, región y mes, y 6 escenarios de precio. Me desvelé, pero quería que tuviera toda la información. Quedo atenta. Ana"],
    ask: "El material es sólido, pero 22 láminas no sirven para un consejo. La junta es mañana. ¿Qué haces?",
    options: [
      { id: "a", text: "Armar yo la versión de tres láminas esta noche con su análisis, darle el crédito en la junta y la retro el lunes.", reply: ["Claro, Director. Me encantará ver cómo la deja.", "(El lunes llega con libreta y preguntas.)"], outcome: "El consejo recibe una presentación clara y a tiempo; Ana aprende después, viendo el resultado.", effects: { consejo: 3, equipo: -1 }, stance: { ana: 0 }, score: 2, judgment: J(2, 1, 1, 0, 2), benefits: ["El consejo recibe algo claro sin riesgo.", "Ana recibe crédito público."], costs: ["Tu noche.", "Ana no practica la síntesis esta vez."], risks: ["Si se vuelve costumbre, el equipo aprende que tú rehaces lo que no sirve."] },
      { id: "b", text: "Sentarme veinte minutos con ella, enseñarle a empezar por la decisión y pedirle una página con su recomendación.", reply: ["Gracias por el tiempo, Director. Nunca nadie me había explicado lo de empezar por el final.", "La página se la mando a las 7."], outcome: "Ana entrega una página mejor de lo esperado, pero tarde; llegas a la junta sin ensayar.", effects: { equipo: 4, consejo: -2 }, stance: { ana: 2 }, score: 3, judgment: J(2, 2, 1, 1, 2), benefits: ["Ana aprende a escribir para quien decide.", "Tu equipo ve que inviertes en ellos."], costs: ["Llegas a la junta con menos margen de preparación."], risks: ["Si la página no llega a tiempo, improvisas ante el consejo."] },
      { id: "c", text: "Pedirle que presente ella misma tres láminas al consejo y ensayar la exposición juntos a primera hora.", reply: ["Me da nervios, pero sí quiero hacerlo.", "¿Lo ensayamos a las 7:30?"], outcome: "Ana presenta; el consejo valora conocer al talento, aunque una consejera nota que le faltó firmeza.", effects: { equipo: 5, consejo: -3, margen: 0 }, stance: { ana: 1 }, score: 2, judgment: J(1, 2, 1, 1, 1), benefits: ["Ana gana visibilidad y confianza.", "El consejo conoce a la siguiente generación."], costs: ["Expones la junta a un tropiezo."], risks: ["Si se traba, tu credibilidad ante el consejo paga el costo."] },
    ],
    editorial: "El original premiaba la única opción «empática» y las otras eran un regaño o hacerlo tú. Ahora las tres son estrategias de un director real: resolver la junta, enseñar o exponer. Cada una sacrifica algo distinto (la junta, el aprendizaje o tu credibilidad).",
  },
  {
    id: "rd-d5-credito", company: "cumbre", original: "d5-credito", from: "lucia",
    subject: "Propuesta · Línea automatizada y crédito de $40 M",
    body: ["Director: Banorte nos ofrece $40 M a 5 años (TIIE + 2.5) para automatizar la línea de empaque. Javier lleva dos años pidiéndolo. Los números salen positivos: recuperamos la inversión en 3.4 años. Pero la caja está justa y TIIE puede subir. Quiero que veas el riesgo antes del consejo. Lucía"],
    ask: "¿Qué recomiendas al consejo?",
    options: [
      { id: "a", text: "Tomar el crédito completo con un año de gracia y reubicar antes a las 22 personas de empaque en vacantes.", reply: ["Se puede hacer, pero me quedo vigilando la cobertura de deuda cada mes.", "(Javier te manda un mensaje: «Gracias. No te voy a fallar».)"], outcome: "La línea completa arranca en ocho meses; el margen sube, pero la empresa queda más endeudada.", effects: { margen: 5, consejo: 1, caja: -3, equipo: -1 }, stance: { lucia: -1, javier: 2 }, score: 3, judgment: J(2, 1, 2, 1, 2), benefits: ["Mayor ahorro por pieza y antes.", "Javier y producción se sienten escuchados."], costs: ["Intereses y deuda a 5 años.", "Reubicar a 22 personas cuesta energía al equipo."], risks: ["Si TIIE sube dos puntos, la cobertura de deuda se aprieta."] },
      { id: "b", text: "Hacer la fase uno con flujo propio ($18 M) y decidir la fase dos con los datos de sus primeros seis meses.", reply: ["Me gusta. Menos riesgo y conservamos la opción de crecer.", "(Javier, en el pasillo: «Otra vez a medias».)"], outcome: "La fase uno funciona; la caja resiente el desembolso y el ahorro completo tarda un año más.", effects: { caja: -5, margen: 3, consejo: 2 }, stance: { lucia: 2, javier: -1 }, score: 3, judgment: J(2, 2, 2, 1, 2), benefits: ["Sin deuda nueva.", "Aprendes antes de apostar todo."], costs: ["La caja baja de golpe.", "La mitad del ahorro llega un año después."], risks: ["Un competidor que automatiza completo antes puede bajar precios."] },
      { id: "c", text: "Posponer seis meses, pedir oferta a otros dos bancos y llegar al consejo con tres propuestas comparables.", reply: ["De acuerdo. Te armo la comparación con las tres tasas.", "(Javier no contesta tu correo.)"], outcome: "Consigues medio punto menos de tasa; la línea manual sigue costando seis meses más.", effects: { caja: 2, consejo: 1, margen: -2, equipo: -1 }, stance: { lucia: 1, javier: -2 }, score: 2, judgment: J(2, 1, 1, 2, 1), benefits: ["Mejor tasa.", "La caja respira."], costs: ["Seis meses más con la línea manual.", "Javier se desanima."], risks: ["Si la demanda sube en ese tiempo, no tienes capacidad."] },
    ],
    editorial: "Antes, «hacer la fase uno» era claramente lo sensato y las otras eran apostar todo o no hacer nada. Ahora el crédito completo tiene protecciones reales y posponer trae una negociación concreta: tres caminos con riesgo financiero distinto (deuda, caja, tiempo).",
  },
  // ───────────────────────────────────────────── Forja (autopartes)
  {
    id: "rd-fn-d2-soldadores", company: "forja", original: "fn-d2-soldadores", from: "teresa",
    subject: "Fuga de soldadores · 7 en un mes",
    body: ["Director: En un mes se fueron 7 soldadores certificados. Seis se fueron a la planta de enfrente, que paga $380 más a la semana y da transporte. Un soldador certificado tarda 9 meses en formarse. Hoy cubrimos con tiempo extra y la gente está cansada. Te pongo tres caminos con números. Teresa"],
    ask: "¿Qué camino tomas?",
    options: [
      { id: "a", text: "Robotizar dos celdas de soldadura y mover a sus soldadores a las celdas donde hoy más falta gente.", reply: ["Entiendo la lógica, pero Fermín (sindicato) ya pidió hablar contigo.", "Necesito saber qué les digo a los de esas dos celdas."], outcome: "El costo por pieza baja y dependes menos del perfil escaso; el sindicato lo vive como amenaza.", effects: { margen: 4, consejo: 2, equipo: -3, caja: -3 }, stance: { teresa: -1, fermin: -2, regina: 1 }, score: 2, judgment: J(2, 0, 1, 0, 2), benefits: ["Menor costo por pieza.", "Menos dependencia de un perfil escaso."], costs: ["Inversión en robots.", "Tensión con el sindicato."], risks: ["Si la conversación con el sindicato sale mal, puede haber paro."] },
      { id: "b", text: "Igualar el transporte desde el lunes y dar un bono de permanencia a doce meses solo a los certificados.", reply: ["Lo anuncio el lunes. La gente lo va a recibir bien.", "Ojo: la planta de enfrente puede volver a subir."], outcome: "La fuga se detiene en dos semanas; la nómina sube y no resuelve la escasez de fondo.", effects: { equipo: 4, clientes: 1, caja: -4, margen: -1 }, stance: { teresa: 1, fermin: 1, marcos: -1 }, score: 3, judgment: J(2, 1, 1, 1, 2), benefits: ["Detienes la fuga de inmediato.", "Bajas el tiempo extra y el cansancio."], costs: ["Nómina más alta todo el año."], risks: ["Una guerra de sueldos con la planta de enfrente."] },
      { id: "c", text: "Abrir una escuela interna con escalones de sueldo y, mientras, traer dos instructores jubilados.", reply: ["Esto sí cambia la historia. Es lento, pero es nuestro.", "Los instructores los consigo esta semana."], outcome: "Los primeros aprendices certifican en nueve meses; mientras, el tiempo extra aprieta las entregas.", effects: { equipo: 3, consejo: 1, caja: -2, clientes: -2 }, stance: { teresa: 2, fermin: 1, ramon: -1 }, score: 3, judgment: J(2, 2, 1, 1, 2), benefits: ["Resuelves la escasez de fondo.", "Carrera visible para la gente."], costs: ["Nueve meses de tiempo extra.", "Costo de instructores."], risks: ["Si la armadora sube volumen, no llegas con la gente actual."] },
    ],
    editorial: "La opción «escuela» seguía siendo la única con puntaje alto. Ahora el bono es una respuesta defendible a una emergencia (con su riesgo de guerra de sueldos) y robotizar es una apuesta legítima de productividad que pierde puntos de criterio por no consultar al sindicato, no por ser «fría».",
  },
  {
    id: "rd-fn-d4-recap", company: "forja", original: "fn-d4-recap", from: "regina",
    subject: "Propuesta del fondo · recapitalización",
    body: ["Hola: En Capital Sierra evaluamos una recapitalización: tomar $400 M de deuda y pagar un dividendo extraordinario a nuestros inversionistas. Los bancos la aprueban con el EBITDA actual. Nos ayuda a levantar el siguiente fondo. Sé que tienes la plataforma 2028 en la cabeza. Quiero tu opinión honesta, no tu aprobación. Regina Ochoa · Socia, Capital Sierra"],
    ask: "¿Qué le respondes a la socia del fondo?",
    options: [
      { id: "a", text: "«No ahora. Con la plataforma en juego, ofrezco un dividendo ordinario mayor si cerramos el año en meta.»", reply: ["Aprecio la franqueza. No te voy a mentir: en el consejo va a costar.", "Mándame los números del dividendo ordinario."], outcome: "La plataforma queda financiada; el fondo retrasa su retorno y tu relación con Regina se enfría.", effects: { caja: 2, clientes: 2, consejo: -3 }, stance: { regina: -2, marcos: 1 }, score: 3, judgment: J(2, 1, 2, 2, 1), benefits: ["La plataforma 2028 conserva su inversión.", "Sin deuda nueva."], costs: ["El fondo no recibe su dividendo extraordinario."], risks: ["El consejo puede leerlo como que no entiendes a tu accionista."] },
      { id: "b", text: "«Propongo $150 M ahora y el resto si ganamos la plataforma y el margen sube dos puntos este año.»", reply: ["Es razonable. No es lo que quería, pero lo puedo defender.", "Ponlo por escrito para el jueves."], outcome: "El fondo recibe una parte; la empresa queda con deuda moderada y con la plataforma en pie.", effects: { consejo: 2, margen: 1, caja: -3 }, stance: { regina: -1, marcos: 1, zertuche: 1 }, score: 3, judgment: J(2, 1, 2, 2, 2), benefits: ["Atiendes al accionista sin comprometer el plan.", "Condiciones atadas a resultados."], costs: ["Deuda de $150 M y sus intereses."], risks: ["Si el margen no sube, el segundo tramo se vuelve una discusión anual."] },
      { id: "c", text: "«Lo apoyo, siempre que el banco acepte un covenant que blinde por contrato la inversión de la plataforma 2028.»", reply: ["Te lo agradezco. Lo presento así al consejo.", "Lo del covenant lo negocio yo con el banco."], outcome: "El fondo cobra; la empresa queda apalancada, con la plataforma protegida en papel.", effects: { consejo: 4, caja: -6, clientes: 1 }, stance: { regina: 2, marcos: -1 }, score: 2, judgment: J(1, 1, 1, 2, 2), benefits: ["Relación fuerte con tu accionista.", "La plataforma queda protegida por contrato."], costs: ["$400 M de deuda: la caja queda mucho más justa."], risks: ["Con un mal año, el covenant protege la plataforma pero no tu flujo."] },
    ],
    editorial: "Antes decir «no» costaba demasiado consejo y «sí» era casi una caricatura de complacencia. Ahora las tres son posturas de gobierno corporativo serias: rechazar con alternativa, escalonar, o aceptar con protecciones. Las tres son defendibles ante un consejo.",
  },
  // ───────────────────────────────────────────── Brasa (restaurantes)
  {
    id: "rd-gb-d4-carne", company: "brasa", original: "gb-d4-carne", from: "fer",
    subject: "El precio de la carne subió 14 %",
    body: ["Director: El proveedor de res subió 14 % desde el lunes por la sequía en el norte. Nuestro costo de alimentos pasa de 33 % a 36 %. Cada punto son $9.8 M al año. Te armé los escenarios. Fer"],
    ask: "¿Qué haces con el costo de la carne?",
    options: [
      { id: "a", text: "Absorber el costo un trimestre y renegociar con el proveedor actual a cambio de un volumen anual.", reply: ["Se puede, pero son $29 M de margen si el precio no baja.", "Te consigo la cita con el proveedor esta semana."], outcome: "Los clientes no notan nada; el proveedor baja 5 % por volumen, el resto lo pagas tú.", effects: { clientes: 2, consejo: 1, margen: -3, caja: -1 }, stance: { fer: -1, sara: 1 }, score: 2, judgment: J(1, 1, 1, 2, 1), benefits: ["Proteges a los clientes justo después de la crisis de Andares.", "Relación de largo plazo con el proveedor."], costs: ["Margen de un trimestre."], risks: ["Si la sequía dura, absorbiste para nada."] },
      { id: "b", text: "Firmar doce meses con el proveedor alterno tras una prueba ciega con Andrés y cincuenta clientes.", reply: ["Me gusta. Si la prueba sale bien, lo firmamos.", "(Andrés: «Si no pasa la prueba, yo no lo sirvo».)"], outcome: "La prueba pasa por poco; el costo baja, pero pagas un anticipo y dependes de un proveedor nuevo.", effects: { margen: 3, consejo: 1, caja: -2, clientes: -1 }, stance: { fer: 2, andres: -1 }, score: 3, judgment: J(2, 2, 1, 1, 2), benefits: ["Recuperas buena parte del margen sin subir precios."], costs: ["Anticipo al proveedor alterno.", "Algunos clientes notan el cambio."], risks: ["Un proveedor nuevo puede fallar en el abasto."] },
      { id: "c", text: "Subir 4 % solo los cortes de res y empujar en la carta los platillos de cerdo y pollo que dejan más.", reply: ["Recuperamos casi todo el margen en un mes.", "Sara pide revisar los textos de la carta con ella."], outcome: "El margen se recupera rápido; los clientes de cortes lo notan y algunos reseñan el alza.", effects: { margen: 4, caja: 1, clientes: -3 }, stance: { fer: 1, sara: -1 }, score: 3, judgment: J(2, 1, 2, 1, 2), benefits: ["Margen recuperado rápido y sin depender de terceros."], costs: ["Clientes de cortes molestos."], risks: ["Reseñas negativas si se percibe como abuso."] },
    ],
    editorial: "El original tenía una opción «perfecta» (prueba ciega) y dos extremos (subir todo o absorber todo). Ahora subir precios es selectivo e inteligente y absorber viene con una negociación: tres caminos con diferente costo para margen, caja y clientes.",
  },
  {
    id: "rd-gb-d5-cdmx", company: "brasa", original: "gb-d5-cdmx", from: "fer",
    subject: "Las 6 sucursales de CDMX pierden dinero",
    body: ["Director: Te lo tengo que decir sin adornos: las 6 sucursales de CDMX pierden $1.4 M al mes en conjunto. Abrimos rápido, en locales caros y con equipo que no conocía la marca. Hay contratos de renta hasta 2029. Romperlos cuesta. Fer"],
    ask: "¿Qué haces con CDMX?",
    options: [
      { id: "a", text: "Darles seis meses con menú local y un gerente regional nuevo, con meta de corte por sucursal.", reply: ["Va, pero si en seis meses no llegan, cerramos sin discusión.", "(Ignacio: «Gracias por la oportunidad. No la voy a desperdiciar».)"], outcome: "Tres sucursales mejoran; las otras tres siguen perdiendo y la caja lo resiente.", effects: { equipo: 2, clientes: 2, caja: -4, margen: -1 }, stance: { ignacio: 2, fer: -1 }, score: 3, judgment: J(2, 2, 1, 1, 2), benefits: ["Das oportunidad con reglas claras.", "El equipo de CDMX se compromete."], costs: ["Seis meses más de pérdidas."], risks: ["Si la meta no se cumple, cierras igual y más tarde."] },
      { id: "b", text: "Subarrendar cuatro locales a otra cadena para cortar la pérdida sin pagar toda la penalización.", reply: ["Buena idea. Tengo contacto con dos cadenas que buscan zona.", "Tarda unos meses en concretarse."], outcome: "Subarriendas tres de cuatro en cinco meses; la marca pierde presencia en CDMX.", effects: { caja: -1, margen: 2, consejo: 1, clientes: -2 }, stance: { fer: 1, ignacio: -1 }, score: 3, judgment: J(2, 1, 2, 2, 1), benefits: ["Cortas pérdida con menos penalización."], costs: ["Dejas de estar en CDMX en esas zonas."], risks: ["Si no encuentras inquilino, sigues pagando renta."] },
      { id: "c", text: "Cerrar las cuatro peores, pagar la penalización y llevar a los mejores gerentes a las dos con potencial.", reply: ["Es una decisión dura pero clara.", "(Ignacio pide hablar contigo a solas.)"], outcome: "La pérdida baja de inmediato; pagas $14 M de penalización y 60 personas pierden su trabajo.", effects: { margen: 4, consejo: 1, caja: -5, equipo: -2 }, stance: { fer: 2, ignacio: -1 }, score: 2, judgment: J(2, 1, 1, 0, 2), benefits: ["Pérdida cortada de raíz.", "Concentras talento donde hay potencial."], costs: ["Penalización de $14 M.", "Despidos."], risks: ["Señal al resto del grupo sobre la seguridad del empleo."] },
    ],
    editorial: "En el original cerrar cuatro era la respuesta «madura». Ahora hay tres maneras legítimas de enfrentar la pérdida: dar una oportunidad con meta, subarrendar o cerrar. El costo financiero cambia de forma (pérdida operativa, presencia de marca o penalización).",
  },
  // ───────────────────────────────────────────── Kubit (software)
  {
    id: "rd-kb-d2-fuga", company: "kubit", original: "kb-d2-fuga", from: "carmen",
    subject: "Fuga de ingenieros · 9 en dos meses",
    body: ["Director: En dos meses se fueron 9 ingenieros. Siete se fueron a trabajar a distancia para empresas de Estados Unidos que pagan en dólares, sin salir de Monterrey. Que un ingeniero conozca bien nuestro producto toma de 6 a 9 meses. Hoy cubrimos con horas extra. Te pongo tres caminos con números. Carmen"],
    ask: "¿Qué camino tomas?",
    options: [
      { id: "a", text: "Academia interna con plan de carrera y cuatro semanas al año de trabajo remoto para todo el equipo.", reply: ["Esto sí cambia la historia. Es lento, pero es nuestro.", "El remoto lo van a valorar más que el dinero."], outcome: "La rotación baja en el segundo trimestre; mientras, el roadmap se atrasa y un cliente lo nota.", effects: { equipo: 3, consejo: 1, caja: -1, clientes: -2 }, stance: { carmen: 2, joel: 1 }, score: 3, judgment: J(2, 2, 1, 1, 2), benefits: ["Atacas el motivo real: carrera y flexibilidad."], costs: ["Atraso del roadmap."], risks: ["Si un competidor contrata agresivo, la academia forma talento para otros."] },
      { id: "b", text: "Subcontratar fuera lo que no es el corazón del producto y concentrar al equipo propio en lo que nos distingue.", reply: ["Entiendo la lógica, pero Joel va a pedir hablar contigo.", "Necesito definir qué es corazón y qué no."], outcome: "El costo baja y el equipo se enfoca; algunos ingenieros lo leen como el principio de un recorte.", effects: { margen: 3, consejo: 2, equipo: -3, clientes: -1 }, stance: { carmen: -1, joel: -2, valeria: 1 }, score: 2, judgment: J(2, 0, 1, 1, 2), benefits: ["Menor costo y menos dependencia del perfil escaso."], costs: ["Moral del equipo."], risks: ["Calidad irregular del proveedor externo."] },
      { id: "c", text: "Ajustar el sueldo en dólares solo a los quince ingenieros clave, atado a dieciocho meses de permanencia.", reply: ["Lo anuncio el lunes. Los quince lo van a recibir bien.", "Los demás van a preguntar por qué ellos no."], outcome: "La fuga se detiene entre los clave; la nómina sube y aparece una brecha entre dos niveles del equipo.", effects: { equipo: 3, clientes: 1, caja: -4, margen: -1 }, stance: { carmen: 1, andrea: -1 }, score: 3, judgment: J(2, 1, 1, 1, 2), benefits: ["Proteges el conocimiento crítico de inmediato."], costs: ["Nómina en dólares."], risks: ["Resentimiento de quienes no entraron en los quince."] },
    ],
    editorial: "Kubit, Punto Madero y Vértice compartían la misma plantilla con los mismos números. Aquí el bono es selectivo y atado a permanencia (defendible), la academia ataca la causa con costo en clientes, y subcontratar es una apuesta legítima de foco.",
  },
  {
    id: "rd-kb-d5-ronda", company: "kubit", original: "kb-d5-ronda", from: "andrea",
    subject: "Serie C · dos propuestas sobre la mesa",
    body: ["Director: Un fondo extranjero ofrece $400 M con una valuación 30 % menor que la Serie B y preferencia de liquidación de 2 veces. Los fondos actuales ofrecen $150 M en las condiciones de la Serie B si llegamos a punto de equilibrio en 12 meses. Hoy tenemos caja para 14 meses. Andrea Quiroga · Finanzas"],
    ask: "¿Con qué camino llegas al consejo?",
    options: [
      { id: "a", text: "La ronda grande, pero negociando bajar la preferencia de dos veces a una aunque la valuación no suba.", reply: ["Se puede intentar. Si aceptan, es la opción con más caja.", "Emilio no está convencido; le preocupa la dilución."], outcome: "El fondo acepta preferencia de 1.5 veces; hay caja para crecer, con fundadores más diluidos.", effects: { caja: 5, clientes: 1, consejo: -2, margen: -2 }, stance: { andrea: 1, emilio: -1, valeria: 2 }, score: 3, judgment: J(2, 1, 2, 2, 1), benefits: ["Caja para crecer sin frenar.", "Mejores términos que los ofrecidos."], costs: ["Dilución fuerte.", "Crecer quema margen."], risks: ["Con preferencia alta, una venta mediocre deja poco a los fundadores."] },
      { id: "b", text: "Sin ronda: recortar 20 % del gasto y llegar al equilibrio con lo propio, protegiendo a soporte.", reply: ["Es lo más sano en números. Va a doler.", "(Valeria: «Esto nos deja sin pelear el mercado».)"], outcome: "Llegas al equilibrio en diez meses; el equipo pierde a 30 personas y crecer se pospone.", effects: { margen: 4, caja: 1, equipo: -4, consejo: -1 }, stance: { andrea: 1, emilio: 1, valeria: -2 }, score: 2, judgment: J(2, 1, 1, 0, 2), benefits: ["Control total y empresa sana."], costs: ["Recorte de personal.", "Creces menos."], risks: ["Un competidor con ronda te gana clientes."] },
      { id: "c", text: "La ronda interna de $150 M con la meta de equilibrio a doce meses y un plan de gasto mes por mes.", reply: ["Es la que más me gusta. Te ayudo a armar el plan mes por mes.", "(Valeria, seca: «Ojalá no nos quedemos cortos».)"], outcome: "Creces menos, con disciplina; un cliente grande se va con un competidor mejor financiado.", effects: { caja: 3, consejo: 1, clientes: -2, equipo: -1 }, stance: { andrea: 2, ibarra: 1, valeria: -1 }, score: 3, judgment: J(2, 2, 2, 1, 2), benefits: ["Sin dilución adicional.", "Disciplina de gasto."], costs: ["Menos crecimiento."], risks: ["Si no llegas al equilibrio, la siguiente ronda es en peores términos."] },
    ],
    editorial: "La opción «ronda interna» era la respuesta obvia de manual. Ahora la ronda grande negociada es una opción profesional (con dilución real) y el recorte protege lo crítico. Ninguna gana en todo: caja, control o crecimiento.",
  },
  // ───────────────────────────────────────────── Punto Madero (materiales)
  {
    id: "rd-pm-d2-penasco", company: "puntomadero", original: "pm-d2-penasco", from: "ramos",
    subject: "Constructora Peñasco · condiciones para el próximo año",
    body: ["Estimado Director: Para seguir comprando con Punto Madero necesitamos 12 % de descuento, crédito a 90 días (hoy es a 30) y entrega gratis en cada obra. El próximo trimestre decidiremos quién surte nuestros nueve desarrollos nuevos. Mundo Casa ya nos visitó. Quedo atento esta semana. Federico Ramos · Compras, Constructora Peñasco"],
    ask: "¿Cómo respondes a tu cliente más grande?",
    options: [
      { id: "a", text: "Mantener precio de lista y crédito a 30 días, como a todos; la entrega en obra se cobra aparte.", reply: ["Entiendo su posición. La revisaremos con nuestro equipo.", "(No vuelve a escribir en diez días.)"], outcome: "Proteges el margen y la regla para todos; Peñasco reparte los desarrollos y te deja dos.", effects: { margen: 3, caja: 1, clientes: -4 }, stance: { ramos: -2, claudia: 1 }, score: 2, judgment: J(1, 1, 1, 0, 2), benefits: ["Margen y crédito intactos.", "Misma regla para todos los clientes."], costs: ["Pierdes volumen con tu cliente más grande."], risks: ["Mundo Casa entra a tu mejor cuenta."] },
      { id: "b", text: "Mantener precio, crédito a 60 días con garantía y entrega programada; a cambio, tres de los nueve desarrollos.", reply: ["No es lo que pedí, pero puede funcionar.", "Le confirmo los tres desarrollos el viernes."], outcome: "Ganas tres desarrollos y una relación más formal; la caja se estira con el crédito a 60 días.", effects: { clientes: 2, consejo: 1, caja: -2, margen: -1 }, stance: { ramos: 1, claudia: -1 }, score: 3, judgment: J(2, 1, 2, 2, 2), benefits: ["Volumen asegurado sin regalar precio."], costs: ["Caja comprometida en crédito."], risks: ["Garantías difíciles de ejecutar si la constructora se atrasa."] },
      { id: "c", text: "Dar 5 % de descuento por volumen, solo si nos asignan los nueve desarrollos con contrato de un año.", reply: ["Esto ya es otra conversación. Lo llevo al comité.", "(Claudia: «Con 5 % apenas nos queda margen en esa cuenta».)"], outcome: "Peñasco firma los nueve; el volumen sube y el margen por obra baja.", effects: { clientes: 3, caja: 1, margen: -3, consejo: -1 }, stance: { ramos: 2, claudia: -1 }, score: 3, judgment: J(2, 1, 1, 2, 2), benefits: ["Volumen grande y estable por un año."], costs: ["Margen menor en tu cuenta más grande."], risks: ["Otros constructores pedirán lo mismo."] },
    ],
    editorial: "El original tenía «aceptar todo» (caricatura) y una opción larga que lo resolvía todo. Ahora las tres son posiciones negociadoras: firmeza, intercambio de condiciones o descuento a cambio de volumen comprometido.",
  },
  {
    id: "rd-pm-d5-oferta", company: "puntomadero", original: "pm-d5-oferta", from: "claudia",
    subject: "Mundo Casa quiere comprarnos · y hay otra opción",
    body: ["Director: Mundo Casa ofrece comprar el 100 % a una valuación 30 % menor de la que esperaba la familia, y cerraría las tiendas que se enciman con las suyas. Capital Norte ofrece $250 M a cambio de 15 % adicional, si llegamos a la meta de margen en 12 meses. Necesito tu postura antes del consejo. Claudia Leal · Finanzas"],
    ask: "¿Con qué camino llegas al consejo?",
    options: [
      { id: "a", text: "Sin socio nuevo: cerrar las seis tiendas que se enciman con Mundo Casa y competir con las que sí ganan.", reply: ["Es lo más sano en números. Va a doler.", "(Inés, desde el piso de ventas: «¿Y la gente de esas tiendas?».)"], outcome: "El margen sube y la familia conserva el control; 70 personas salen y algunos clientes del sur se van.", effects: { margen: 4, caja: 2, equipo: -4, clientes: -2 }, stance: { claudia: 1, octavio: 1, ines: -2 }, score: 3, judgment: J(2, 1, 2, 0, 2), benefits: ["Control familiar y empresa más rentable."], costs: ["Despidos.", "Presencia en el sur."], risks: ["Mundo Casa toma los clientes de esas zonas."] },
      { id: "b", text: "Aceptar a Capital Norte con la meta de margen a doce meses y un plan de tiendas mes por mes.", reply: ["Es la que más me gusta. Te ayudo con el plan mes por mes.", "(Inés: «Siempre que no cierren tiendas sin avisarnos».)"], outcome: "Entra capital para modernizar; la familia cede 15 % y el consejo gana un socio exigente.", effects: { caja: 4, consejo: 1, clientes: -1, equipo: -1 }, stance: { claudia: 2, garza: 1, ines: -1 }, score: 3, judgment: J(2, 2, 2, 1, 2), benefits: ["Caja para modernizar.", "Socio con experiencia."], costs: ["Dilución de la familia."], risks: ["Si no se llega a la meta, el socio toma más control."] },
      { id: "c", text: "Abrir un proceso formal con ambos y un tercer comprador para mejorar la valuación antes de decidir.", reply: ["De acuerdo, aunque el proceso tarda y los rumores corren.", "Hablo con el banco de inversión el lunes."], outcome: "Aparece un tercer interesado y la oferta mejora; mientras, el rumor inquieta a tiendas y proveedores.", effects: { consejo: 2, margen: 1, equipo: -2, clientes: -1 }, stance: { claudia: 1, garza: 1, octavio: -1 }, score: 2, judgment: J(2, 1, 1, 2, 1), benefits: ["Mejor valuación posible."], costs: ["Meses de incertidumbre."], risks: ["Rumores que desmotivan al equipo y espantan proveedores."] },
    ],
    editorial: "Copiaba la plantilla de Kubit con sus números. Ahora tiene opciones propias del sector (cerrar tiendas que se enciman, socio financiero, proceso competitivo) y cada una sacrifica algo distinto: gente, control o tiempo.",
  },
  // ───────────────────────────────────────────── Vértice (logística)
  {
    id: "rd-vl-d2-operadores", company: "vertice", original: "vl-d2-operadores", from: "rocio",
    subject: "Se nos van los operadores · 40 en dos meses",
    body: ["Director: En dos meses se fueron 40 operadores de quinta rueda con experiencia. Treinta se fueron a Avante, que les ofrece 18 % más. Un operador seguro en carretera tarda un año en formarse. Hoy tenemos 35 camiones parados por falta de operador y los clientes lo notan. Te pongo tres caminos con números. Rocío"],
    ask: "¿Qué camino tomas?",
    options: [
      { id: "a", text: "Bono de permanencia solo a los operadores con mejor historial de seguridad, pagado cada trimestre.", reply: ["Lo anuncio el lunes. Los mejores lo van a valorar.", "Los demás van a preguntar cómo entrar al grupo."], outcome: "Retienes a los mejores; la nómina sube y siguen 25 unidades paradas.", effects: { equipo: 4, clientes: 1, caja: -4 }, stance: { rocio: 1, patricio: -1 }, score: 3, judgment: J(2, 1, 1, 1, 2), benefits: ["Retienes a quienes cuidan unidades y carga."], costs: ["Nómina más alta."], risks: ["Avante puede subir otra vez."] },
      { id: "b", text: "Subcontratar transportistas para las rutas no críticas y vender veinte de las unidades paradas.", reply: ["Entiendo la lógica, pero Pepe va a pedir hablar contigo.", "Necesito saber qué rutas son críticas para ti."], outcome: "Entra caja por la venta y las rutas se cubren; los operadores lo leen como un recorte.", effects: { caja: 4, margen: 1, equipo: -3, clientes: -1 }, stance: { rocio: -1, pepe: -2, elena: 1 }, score: 2, judgment: J(2, 0, 1, 1, 2), benefits: ["Caja inmediata.", "Rutas cubiertas sin contratar."], costs: ["Moral de los operadores."], risks: ["Servicio irregular de terceros."] },
      { id: "c", text: "Escuela de operadores con plan de carrera y, mientras, rentar quince unidades con operador incluido.", reply: ["Esto sí cambia la historia. Es lento, pero es nuestro.", "La renta la cotizo hoy mismo."], outcome: "Los clientes vuelven a tener servicio; la renta cuesta margen durante un año.", effects: { equipo: 3, clientes: 2, margen: -4 }, stance: { rocio: 2, pepe: 1, antonio: -1 }, score: 3, judgment: J(2, 2, 1, 1, 2), benefits: ["Formas tu propia gente.", "Clientes atendidos desde ya."], costs: ["Renta cara durante un año."], risks: ["Si la escuela tarda, la renta se vuelve permanente."] },
    ],
    editorial: "Era la misma plantilla de Forja y Kubit. Ahora el bono premia seguridad (no a todos), vender unidades paradas es una decisión financiera legítima, y la escuela incluye cómo cubrir mientras tanto.",
  },
  {
    id: "rd-vl-d4-deuda", company: "vertice", original: "vl-d4-deuda", from: "elena",
    subject: "Propuesta para el consejo · crédito para renovar flota y abrir CEDIS",
    body: ["Hola: Golfo Capital propone tomar $350 M de crédito para comprar 120 tractocamiones y abrir dos CEDIS en Querétaro y el Bajío, antes que Avante. El banco presta con las unidades y los CEDIS como garantía. Nos da capacidad y le cierra el paso a la competencia. Quiero tu opinión honesta, no tu aprobación. Elena Quiroga · Consejera"],
    ask: "¿Qué le respondes a la consejera?",
    options: [
      { id: "a", text: "«Lo apoyo completo, con cobertura de tasa de interés y un tablero mensual de ocupación para el consejo.»", reply: ["Te lo agradezco. Lo presento así al consejo.", "La cobertura de tasa la cotizo con el banco."], outcome: "Ganas el Bajío antes que Avante; la empresa queda muy apalancada mientras se llenan los CEDIS.", effects: { consejo: 4, clientes: 2, caja: -6 }, stance: { elena: 2, patricio: -1 }, score: 2, judgment: J(1, 1, 2, 1, 2), benefits: ["Capacidad y posición antes que la competencia."], costs: ["Deuda alta."], risks: ["Si la ocupación no llega, el servicio de deuda aprieta la caja."] },
      { id: "b", text: "«Propongo la mitad por etapas: 60 unidades y un CEDIS ahora, y el resto al llegar a su meta de ocupación.»", reply: ["Es razonable. No es lo que quería, pero lo puedo defender.", "Ponme la meta de ocupación por escrito."], outcome: "Entras al Bajío con riesgo moderado; Avante abre en Querétaro primero.", effects: { consejo: 2, clientes: 1, caja: -3 }, stance: { elena: -1, patricio: 1, rodrigo: 1 }, score: 3, judgment: J(2, 1, 2, 2, 2), benefits: ["Creces con riesgo controlado."], costs: ["Pierdes Querétaro frente a Avante."], risks: ["La segunda etapa llega cuando el mercado ya se repartió."] },
      { id: "c", text: "«Primero llenamos la flota que tenemos; con ocupación arriba de 85 % en seis meses, tomo el crédito.»", reply: ["Aprecio la franqueza. Te advierto que Avante no va a esperar seis meses.", "Lo platicamos en el consejo."], outcome: "La caja y el margen mejoran; Avante abre los dos CEDIS y te gana dos cuentas.", effects: { caja: 2, margen: 2, consejo: -3, clientes: -1 }, stance: { elena: -2, patricio: 1 }, score: 3, judgment: J(2, 1, 2, 1, 2), benefits: ["Sin deuda nueva.", "Mejor uso de la flota actual."], costs: ["Pierdes la carrera por el Bajío."], risks: ["Si el mercado se mueve rápido, llegas tarde."] },
    ],
    editorial: "Antes «la mitad por etapas» era claramente la madura. Ahora apoyar completo trae protecciones concretas y esperar trae una condición medible. Tres apuestas distintas sobre caja, crecimiento y consejo.",
  },
];

// ───────────────────────────────────────────── dilemas diarios rediseñados
export interface SampleDilemmaOption { text: string; score: 0 | 1 | 2 | 3; why: string; cost: string }
export interface SampleDilemma { id: string; original: string; who: string; text: string; ask: string; options: SampleDilemmaOption[]; editorial: string }

export const SAMPLE_DILEMMAS: SampleDilemma[] = [
  {
    id: "rd-n3", original: "n3", who: "Laura · directora comercial, llegó hace 45 días",
    text: "Laura quiere despedir a dos vendedores de muchos años porque «no se adaptan al nuevo modelo». Sus números son bajos, pero son queridos por clientes clave.",
    ask: "¿Qué haces?",
    options: [
      { text: "Pedirle que primero se gane la confianza de esas cuentas clave y vuelva a plantearlo en un trimestre.", score: 1, why: "Cuidas a los clientes, pero mandas el mensaje de que el cambio puede esperar.", cost: "Laura pierde impulso en su primer trimestre." },
      { text: "Moverlos a atender solo esas cuentas clave, con metas propias, y dejar el resto del modelo a Laura.", score: 3, why: "Protege la relación con los clientes y le da a Laura espacio para su modelo.", cost: "Dos excepciones al modelo nuevo que otros pueden pedir." },
      { text: "Respaldar a Laura: es su equipo y le pediste resultados. Que planee la transición de esos clientes.", score: 2, why: "Le das autoridad real a quien contrataste para cambiar el área.", cost: "Riesgo de perder a los clientes que confían en ellos." },
      { text: "Pedirle un plan de 60 días con metas claras para ambos y acompañarlos tú en las visitas clave.", score: 3, why: "Decides con evidencia y no con el entusiasmo de la recién llegada.", cost: "Retrasa dos meses la decisión de Laura y le resta autoridad." },
    ],
    editorial: "Había una sola respuesta larga con plan y «negarte» como caricatura. Ahora hay dos respuestas de alto criterio que sacrifican cosas distintas (autoridad de Laura o pureza del modelo) y una de respaldo que también es defendible.",
  },
  {
    id: "rd-v5", original: "v5", who: "Ingeniero Salas · jefe de mantenimiento, 30 años, se jubila en 18 meses",
    text: "Salas es el único que sabe reparar las dos máquinas más críticas. No ha documentado nada y dice que «no hay quién aprenda».",
    ask: "¿Qué haces?",
    options: [
      { text: "Contratar ya a su reemplazo, con experiencia en esas máquinas, para que trabaje a su lado un año.", score: 3, why: "Atacas el riesgo con la solución más rápida y segura.", cost: "Pagas dos sueldos un año y Salas puede sentirse desplazado." },
      { text: "Ofrecerle quedarse dos años más como asesor de medio tiempo, con la tarea de documentar cada reparación.", score: 1, why: "Compras tiempo con buena relación.", cost: "El riesgo de fondo sigue ahí, solo más tarde." },
      { text: "Contratar al fabricante un contrato de servicio y que sus técnicos documenten las reparaciones.", score: 2, why: "Quitas la dependencia de una sola persona sin pelear con ella.", cost: "Contrato caro y el conocimiento queda fuera de la empresa." },
      { text: "Hacer de su legado un proyecto: que elija y forme a dos personas, con reconocimiento y un bono.", score: 3, why: "Conviertes su resistencia en orgullo y el conocimiento se queda en casa.", cost: "Depende de que Salas quiera enseñar; si no, pierdes meses." },
    ],
    editorial: "Antes la opción del legado era la única con detalle. Ahora contratar al reemplazo y el contrato con el fabricante son respuestas profesionales con costos distintos (dinero, orgullo, conocimiento propio).",
  },
  {
    id: "rd-e2", original: "e2", who: "Sofía · tu mejor gerente, 4 años",
    text: "Sofía te pide el proyecto más importante del año. Tiene el talento, pero ya está al 120 % y su equipo empieza a resentirlo.",
    ask: "¿Qué decides?",
    options: [
      { text: "Dárselo ya y reforzar a su equipo con una contratación temporal durante el proyecto.", score: 2, why: "Va la mejor persona y su equipo recibe ayuda real.", cost: "Costo extra y Sofía sigue al 120 %." },
      { text: "Dárselo a otra persona con potencial y que Sofía la asesore como mentora una vez por semana.", score: 3, why: "Desarrollas más talento y Sofía sigue cerca del proyecto.", cost: "Sofía puede sentir que no confías en ella." },
      { text: "Decirle que este año no y prometerle el siguiente proyecto grande cuando se libere su carga.", score: 1, why: "La proteges del desgaste.", cost: "Tu mejor gerente se queda sin el reto que pidió." },
      { text: "Dárselo si primero delega una parte de lo que hoy hace, con un plan concreto y fechas.", score: 3, why: "Aprovechas su talento sin quemar a su equipo.", cost: "Si no delega a tiempo, el proyecto arranca tarde." },
    ],
    editorial: "La respuesta «con condiciones» era la única de puntaje alto. Ahora dárselo a otra persona con Sofía de mentora es igual de sólido y una contratación temporal también es razonable.",
  },
  {
    id: "rd-d5", original: "d5", who: "Óscar · gerente de producción",
    text: "Óscar cumple sus números, pero lo logra con horas extra todo el tiempo. Su equipo está agotado y la rotación de su área duplica al resto.",
    ask: "¿Cómo lo manejas?",
    options: [
      { text: "Poner en su evaluación las horas extra y la rotación, al mismo nivel que la producción.", score: 3, why: "Le dices que el «cómo» también cuenta y lo vuelves medible.", cost: "Puede bajar la producción mientras aprende a dirigir distinto." },
      { text: "Revisar con él dónde se pierden las horas: paros, cambios de turno, mantenimiento.", score: 3, why: "Buscas la causa con datos antes de exigir un resultado distinto.", cost: "Tarda semanas y el equipo sigue cansado mientras tanto." },
      { text: "Contratar tres personas para su área y bajar las horas extra a la mitad en un trimestre.", score: 2, why: "Atacas la carga real; quizá el problema es de capacidad y no de estilo.", cost: "Más nómina sin saber si Óscar cambia su forma de dirigir." },
      { text: "Pedirle que baje las horas extra sin bajar la producción y revisar juntos los números en un mes.", score: 1, why: "Le pones un límite claro.", cost: "Sin apoyo ni análisis, es pedir lo mismo con menos." },
    ],
    editorial: "«Bien: cumplió sus metas» era una caricatura y había una sola respuesta completa. Ahora hay dos respuestas de alto criterio (medir y analizar) y una de capacidad que también es defendible.",
  },
  {
    id: "rd-q3", original: "q3", who: "Elena · supervisora",
    text: "El equipo de Elena se queja de que ella tiene «favoritos»: a dos personas les da los mejores turnos y los proyectos interesantes.",
    ask: "¿Qué haces primero?",
    options: [
      { text: "Reunir a todo su equipo para escuchar los ejemplos concretos antes de hablar con Elena.", score: 1, why: "Entiendes lo que vive el equipo.", cost: "Elena se entera por otros y su autoridad queda tocada." },
      { text: "Pedirle que publique un rol rotativo de turnos y un criterio claro para asignar proyectos.", score: 2, why: "Arreglas el sistema sin juzgar a la persona.", cost: "Si sí hay favoritismo, lo tapas con un proceso." },
      { text: "Revisar los datos de turnos y asignaciones de los últimos seis meses antes de hablar con ella.", score: 3, why: "Llegas con hechos y no con chismes.", cost: "Mientras revisas, el equipo siente que no pasa nada." },
      { text: "Hablar con Elena esta semana, contarle lo que escuchas y preguntarle cómo decide las asignaciones.", score: 3, why: "Le das la oportunidad de explicar y corregir pronto.", cost: "Sin datos, puede ponerse a la defensiva." },
    ],
    editorial: "Antes había dos caricaturas («ignorarlo», «hablar con los favoritos»). Ahora todas son acciones razonables y el debate es real: datos primero, conversación primero o proceso primero.",
  },
  {
    id: "rd-e4", original: "e4", who: "Valeria · directora de marketing, la mejor del sector",
    text: "Una empresa más grande le ofrece a Valeria 40 % más. Te dice que prefiere quedarse, pero «necesito ver que aquí hay futuro».",
    ask: "¿Qué haces?",
    options: [
      { text: "Preguntarle qué significa «futuro» para ella y construir un plan de crecimiento con fechas.", score: 3, why: "Entiendes qué le falta antes de ofrecer algo que no busca.", cost: "Si lo que quiere es dinero, el plan llega tarde." },
      { text: "Dejarla ir en buenos términos y ascender a su número dos, que ya está lista para el puesto.", score: 1, why: "Nadie es indispensable y desarrollas a otra persona.", cost: "Pierdes a la mejor del sector en un año clave." },
      { text: "Igualar una parte del sueldo y darle a su cargo la nueva línea de negocio que arranca en enero.", score: 3, why: "Respondes con dinero y con reto: las dos cosas pesan.", cost: "Rompe la banda salarial y otros directores lo notarán." },
      { text: "Igualar la oferta completa y atarla a dos años con un bono de permanencia que se paga cada semestre.", score: 2, why: "Retienes a la mejor del sector sin rodeos.", cost: "Pagas caro y no sabes si se queda por convicción." },
    ],
    editorial: "«Prometerle la dirección general» era una caricatura. Ahora igualar parte del sueldo con un reto y preguntar qué busca son igual de sólidas; igualar todo también es defendible.",
  },
];

/** Una muestra vista como asunto del juego (para reusar los detectores y el balance por decisión). */
export function sampleItem(c: SampleCase): Item {
  return {
    id: c.id, day: 1, slot: 1, channel: "email", from: c.from, subject: c.subject, preview: c.body[0].slice(0, 80), body: c.body, ask: c.ask,
    options: c.options.map((o) => ({ id: o.id, text: o.text, reply: o.reply, outcome: o.outcome, effects: o.effects, style: {}, score: o.score, stance: o.stance })),
    expired: { reply: [], outcome: "", effects: {} }, bitacora: { title: "", text: "", nota: "" }, areas: ["estrategia"],
  };
}
