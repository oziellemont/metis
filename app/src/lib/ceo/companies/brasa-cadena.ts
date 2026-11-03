/**
 * mêtis CEO · Brasa · cadena piloto de consecuencias (v7): «El proveedor de res más barato».
 *
 * Decisión del día 2: Fer propone cambiar de proveedor de res a uno 14 % más barato (el encargo pide margen y comensales).
 *  - Prueba ciega en cuatro sucursales (a) → día 4: el piloto sale mixto y hay que decidir con datos (incierto pero acotado).
 *  - Cambiar en las 34 de golpe (b)       → día 4, incierto (50 de cada 100): reseñas de carne dura y un fin de
 *                                           semana con faltantes (negativa). La otra mitad de las veces no pasa nada.
 *  - Renegociar con el proveedor actual (c) → día 5, incierto (40 de cada 100): pide contrato anual con anticipo.
 * La probabilidad se dice desde el día 2. Solo llega en periodos con reglas v7 o posteriores (`since: 7`).
 */
import type { Item } from "../types";

const V = 7;

export const CADENA_BRASA: Item[] = [
  {
    id: "gb-d2-proveedor", day: 2, slot: 3, channel: "reporte", from: "fer", since: V,
    involves: ["andres", "maru"],
    subject: "Proveedor de res: 14 % más barato",
    preview: "Encontré un proveedor de res 14 % más barato. Con eso el prime cost baja casi dos puntos…",
    body: [
      "Te paso el análisis que me pediste. La res es el 38 % de nuestro costo de insumos y encontré un proveedor de Sonora 14 % más barato que el actual. Con eso el prime cost baja casi dos puntos.",
      "Andrés probó la muestra y dice que está bien, pero que no es igual: el marmoleo varía más de lote a lote y al proveedor no lo conocemos en temporada alta.",
      "El proveedor actual lleva 11 años con nosotros y nunca nos ha fallado un fin de semana.",
    ],
    data: {
      title: "Lo que sabes",
      rows: [
        ["Ahorro si se cambia en las 34 sucursales", "≈ $9 M al año"],
        ["Prueba ciega en 4 sucursales", "3 semanas · el ahorro se retrasa un mes"],
        ["Andrés: con un proveedor nuevo sin probar", "En 1 de cada 2 casos la calidad varía lo suficiente para notarse en las reseñas"],
        ["Proveedor actual", "11 años · cero faltantes de fin de semana"],
      ],
      note: "Estimación de Fer y del chef con la muestra; no hay historial en temporada alta.",
    },
    ask: "¿Cambias de proveedor de res?",
    options: [
      { id: "a", stance: { andres: 2, fer: -1 }, text: "Hacer una prueba ciega en cuatro sucursales tres semanas, con calificación de comensales y merma, antes de decidir.", reply: ["Es lo responsable, aunque el ahorro llega un mes después.", "(Andrés) Yo armo la prueba con Maru en Andares."], outcome: "Tardas un mes más en ver el ahorro. Decides con datos de tus propios comensales y no con una muestra.", effects: { clientes: 1, margen: -1, equipo: 1 }, style: { horizonte: 2, riesgo: -2 }, score: 3 },
      { id: "b", stance: { fer: 2, andres: -2 }, text: "Cambiar en las 34 sucursales desde el lunes: el margen es el encargo del consejo y la muestra pasó.", reply: ["Perfecto. Empiezo a negociar volúmenes hoy.", "(Andrés) Lo hago, pero no me pidan que garantice cada corte."], outcome: "El ahorro llega completo desde este mes. Si la calidad varía, la vas a ver primero en las reseñas.", effects: { margen: 3, clientes: -1, equipo: -1 }, style: { horizonte: -1, riesgo: 2 }, score: 1 },
      { id: "c", stance: { fer: 1, andres: 1 }, text: "Llevarle la cotización al proveedor actual y pedirle igualar al menos la mitad del ahorro por volumen anual.", reply: ["Puede funcionar. Él no quiere perder la cuenta.", "Le pido cita para el jueves."], outcome: "Conservas la calidad conocida y bajas una parte del costo. El ahorro es menor y el proveedor va a pedir algo a cambio.", effects: { margen: 1, clientes: 1, caja: -1 }, style: { conflicto: 1, riesgo: -1 }, score: 2 },
    ],
    expired: { reply: ["(Fer) Sin decisión, seguimos con el proveedor actual al precio de hoy."], outcome: "Sin decisión, el prime cost siguió igual y el consejo volvió a preguntar.", effects: { margen: -1, consejo: -1 } },
    lesson: "estrategia",
    bitacora: { title: "El ahorro que se ve en el menú", text: "En un restaurante, el insumo principal es parte de la promesa al comensal. Cambiarlo baja el costo de inmediato; el riesgo es que se note en el plato antes que en el estado de resultados.", nota: "Un ahorro en el insumo que define tu marca se prueba con tus clientes, no en la oficina." },
    areas: ["finanzas", "clientes", "operacion"],
  },

  // ───────────────────────────────────────────── DÍA 4 · camino «prueba ciega»: el piloto sale mixto
  {
    id: "gb-c-prov-piloto", day: 4, slot: 2, channel: "reporte", from: "andres", since: V,
    involves: ["fer", "maru"],
    trigger: { item: "gb-d2-proveedor", options: ["a"] },
    subject: "Resultados de la prueba ciega de res", preview: "Tres de las cuatro sucursales no notaron diferencia. En Andares sí…",
    body: [
      "Te paso los resultados de la prueba ciega. En tres sucursales la calificación de los comensales quedó igual y la merma bajó un poco.",
      "En Andares, la que más vende cortes premium, la calificación del rib eye bajó de 4.7 a 4.3. Maru dice que los clientes frecuentes sí lo notaron.",
      "Fer quiere cambiar en todas. Yo propongo otra cosa. Tú decides.",
    ],
    data: { title: "Lo que sabes", rows: [["Sucursales sin diferencia", "3 de 4"], ["Calificación del rib eye en Andares", "4.3 (antes 4.7)"], ["Cortes premium en la venta", "18 %"], ["Ahorro sin los cortes premium", "≈ $7 M al año"]] },
    ask: "¿Cómo usas los resultados?",
    options: [
      { id: "a", stance: { andres: 2, maru: 1, fer: -1 }, text: "Cambiar en cortes de uso diario y dejar los premium con el proveedor actual; medir calificación cada semana.", reply: ["Así protegemos lo que nos hace Brasa.", "(Fer) Es menos ahorro, pero lo entiendo."], outcome: "Capturas la mayor parte del ahorro y cuidas los cortes que definen a la marca. Manejas dos proveedores y más trabajo de compras.", effects: { margen: 2, clientes: 1, equipo: -1, caja: -1 }, style: { horizonte: 1, foco: 1 }, score: 3 },
      { id: "b", stance: { fer: 2, andres: -1, maru: -1 }, text: "Cambiar todo en las 34 sucursales: tres de cuatro no notaron nada y Andares puede ajustar su cocción.", reply: ["Lo cambio, aunque en Andares lo vamos a sentir.", "(Maru) Mis clientes de los jueves ya preguntaron qué pasó con el rib eye."], outcome: "Te quedas con todo el ahorro. Aceptas que los clientes más fieles de cortes premium noten la diferencia.", effects: { margen: 3, clientes: -2 }, style: { foco: 1, riesgo: 1 }, score: 2 },
      { id: "c", stance: { andres: 1, fer: -2 }, text: "Quedarse con el proveedor actual en todo: un punto de calificación en Andares vale más que el ahorro.", reply: ["Me quedo tranquilo con la calidad, pero el consejo pidió margen.", "(Fer) Hicimos la prueba para nada."], outcome: "La calidad queda intacta. El costo sigue alto y el equipo de Finanzas siente que la prueba no sirvió.", effects: { clientes: 1, equipo: -1, margen: -1 }, style: { riesgo: -2, horizonte: 1 }, score: 1 },
    ],
    expired: { reply: ["(Andrés) Sin decisión, regresamos al proveedor actual en las cuatro."], outcome: "Sin decisión, la prueba se cerró y el ahorro se perdió.", effects: { margen: -1, equipo: -1 } },
    lesson: "estrategia",
    bitacora: { title: "Un piloto rara vez da un sí o un no", text: "La prueba no dijo «cambia» ni «no cambies»: dijo dónde sí y dónde no. Aprovechar un piloto es leerlo por partes en vez de buscar la respuesta que ya querías.", nota: "Un piloto vale por lo que te enseña, no por si confirma tu idea." },
    areas: ["estrategia", "clientes", "finanzas"],
  },

  // ───────────────────────────────────────────── DÍA 4 · camino «cambiar todo»: a veces se nota
  {
    id: "gb-c-prov-resenas", day: 4, slot: 2, channel: "whatsapp", from: "maru", since: V,
    involves: ["sara", "andres", "fer"],
    trigger: { item: "gb-d2-proveedor", options: ["b"], roll: [0, 0.5] },
    subject: "Maru Gutiérrez", preview: "Director, en Andares nos están llegando reseñas de carne dura y el sábado nos faltó rib eye…",
    body: [
      "Director, en Andares nos están llegando reseñas de carne dura. Ya van 23 esta semana en las apps.",
      "Y el sábado el proveedor nuevo no completó el pedido: nos faltó rib eye en 6 sucursales en la noche más fuerte.",
      "Sara dice que la calificación general bajó de 4.5 a 4.2. Los gerentes me preguntan qué les digo a los clientes.",
    ],
    data: { title: "Lo que sabes", rows: [["Reseñas negativas por la carne", "23 en una semana"], ["Calificación promedio en apps", "4.2 (antes 4.5)"], ["Sucursales con faltante el sábado", "6"], ["Regresar al proveedor anterior", "Precio anterior + 3 % por reactivar"]] },
    ask: "La calidad se está notando. ¿Qué haces?",
    options: [
      { id: "a", stance: { maru: 2, andres: 1, fer: -1 }, text: "Regresar los cortes premium al proveedor anterior, aunque cueste 3 % más, y responder cada reseña con una invitación.", reply: ["Gracias, Director. Los gerentes van a respirar.", "(Fer) Perdemos parte del ahorro y pagamos la reactivación."], outcome: "Pagas más por volver y pierdes parte del ahorro. Los comensales ven que alguien respondió.", effects: { margen: -2, clientes: 2, caja: -1 }, style: { horizonte: 1, conflicto: 1 }, score: 3 },
      { id: "b", stance: { fer: 1, maru: -1 }, text: "Quedarse con el proveedor nuevo, exigirle por contrato calidad y entregas, y darle un mes para corregir.", reply: ["Como usted diga, pero mis clientes no esperan un mes.", "(Fer) Le mando hoy la carta con penalizaciones."], outcome: "Conservas el ahorro y le pones reglas al proveedor. Durante ese mes, cada fin de semana es una apuesta.", effects: { margen: 1, clientes: -2 }, style: { riesgo: 1, conflicto: 1 }, score: 2 },
      { id: "c", stance: { sara: 1, maru: -2 }, text: "Mantener al proveedor y lanzar una promoción en apps para subir la calificación mientras se estabiliza.", reply: ["La promoción ayuda a la calificación, pero no a la carne.", "(Sara) Puedo tenerla el viernes."], outcome: "La calificación puede recuperarse un poco. El problema de fondo sigue en el plato y la promoción sale del margen.", effects: { clientes: 1, margen: -1, equipo: -1 }, style: { foco: -1, horizonte: -1 }, score: 1 },
    ],
    expired: { reply: ["(Maru) Sin respuesta, cada gerente resolvió como pudo."], outcome: "Sin decisión, siguieron las reseñas y los gerentes improvisaron.", effects: { clientes: -3, equipo: -1 } },
    lesson: "estrategia",
    bitacora: { title: "El ahorro que se notó en el plato", text: "Cambiar de golpe sin probar trajo el ahorro y también el riesgo que el chef había anticipado. Cuando el problema llega al cliente, la pregunta ya no es cuánto se ahorra, sino cuánto cuesta recuperar la confianza.", nota: "La calidad que pierdes en un fin de semana tarda meses en volver." },
    areas: ["clientes", "operacion", "estrategia"],
  },

  // ───────────────────────────────────────────── DÍA 5 · camino «renegociar»: a veces pide algo a cambio
  {
    id: "gb-c-prov-contrato", day: 5, slot: 2, channel: "email", from: "fer", since: V,
    involves: ["ignacio", "lourdes"],
    trigger: { item: "gb-d2-proveedor", options: ["c"], roll: [0, 0.4] },
    subject: "El proveedor de res acepta… con condiciones", preview: "Iguala 8 % del precio si firmamos un año con 20 % de anticipo…",
    body: [
      "El proveedor actual aceptó bajar 8 % el precio, más de lo que esperaba.",
      "La condición: contrato de un año, volumen mínimo y 20 % de anticipo del primer trimestre. Dice que con la res tan volátil no puede bajar sin asegurar el volumen.",
      "Don Ignacio quiere firmar porque es «el de siempre». Lourdes pregunta qué pasa si en marzo abrimos menos sucursales de las previstas.",
    ],
    data: { title: "Lo que sabes", rows: [["Descuento ofrecido", "8 % sobre el precio actual"], ["Anticipo", "20 % del trimestre · ≈ $6 M"], ["Volumen mínimo", "95 % del consumo actual por 12 meses"], ["Proveedor nuevo", "Sigue ofreciendo 14 % sin anticipo"]] },
    ask: "¿Firmas el contrato anual?",
    options: [
      { id: "a", stance: { ignacio: 1, lourdes: 1, fer: 1 }, text: "Firmar con el volumen mínimo en 85 % y el anticipo en dos pagos; negociar esos dos puntos antes de aceptar.", reply: ["Lo intento. Si acepta, es un buen acuerdo.", "(Lourdes) Con 85 % sí me siento tranquila si abrimos menos."], outcome: "Aseguras el descuento con un riesgo acotado. El anticipo sale de la caja este mes y la negociación tarda una semana más.", effects: { margen: 2, caja: -2, consejo: 1, equipo: -1 }, style: { conflicto: 1, horizonte: 1 }, score: 3 },
      { id: "b", stance: { ignacio: 2, lourdes: -1 }, text: "Firmar tal como lo propone: es el proveedor de siempre y el descuento es mejor de lo esperado.", reply: ["Perfecto. Le confirmo hoy.", "(Lourdes) Ojalá no tengamos que cerrar una sucursal este año."], outcome: "Aseguras precio y relación. Comprometes caja y un volumen que no podrás bajar si el plan de crecimiento cambia.", effects: { margen: 2, caja: -3, consejo: 1 }, style: { riesgo: 1, conflicto: -1 }, score: 2 },
      { id: "c", stance: { fer: 1, ignacio: -2 }, text: "No firmar: usar el 8 % como piso y volver a pedirle al proveedor nuevo una prueba en cuatro sucursales.", reply: ["Es razonable, pero el de siempre se va a sentir.", "(Don Ignacio) Once años y lo tratamos como a cualquiera."], outcome: "No comprometes caja ni volumen. Arriesgas una relación de once años y el ahorro se retrasa otra vez.", effects: { caja: 1, margen: -1, consejo: -1 }, style: { riesgo: -1, conflicto: 1 }, score: 1 },
    ],
    expired: { reply: ["(Fer) Sin respuesta, el proveedor retiró la oferta."], outcome: "Sin decisión, el descuento se perdió.", effects: { margen: -1, consejo: -1 } },
    lesson: "negociacion",
    bitacora: { title: "Todo descuento tiene una contraparte", text: "El proveedor de siempre bajó el precio a cambio de seguridad: volumen y anticipo. Negociar bien no es aceptar o rechazar el paquete, sino ajustar las piezas que te ponen en riesgo.", nota: "Antes de firmar un buen precio, pregúntate qué pasa si tu plan cambia." },
    areas: ["negociacion", "finanzas", "estrategia"],
  },
];
