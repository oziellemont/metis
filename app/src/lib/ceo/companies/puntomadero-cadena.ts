/**
 * mêtis CEO · Punto Madero · cadena piloto de consecuencias (v7): «La mercancía de temporada que no se vendió».
 *
 * Decisión del día 2: quedan $64 M de mercancía de temporada sin vender (el encargo pide margen y clientes).
 *  - Rebaja escalonada por tienda con datos (a) → día 4: funciona y deja ver que se compró de más por intuición.
 *  - Remate de golpe en las 60 tiendas (b)       → día 4, incierto (50 de cada 100): Mundo Casa responde con un
 *                                                  descuento mayor y los clientes empiezan a esperar remates.
 *  - Guardarla para la próxima temporada (c)     → día 5, incierto (40 de cada 100): el proveedor saca la línea
 *                                                  nueva y lo guardado pierde valor.
 * La probabilidad se dice desde el día 2. Solo llega en periodos con reglas v7 o posteriores (`since: 7`).
 */
import type { Item } from "../types";

const V = 7;

export const CADENA_PUNTOMADERO: Item[] = [
  {
    id: "pm-d2-temporada", day: 2, slot: 3, channel: "reporte", from: "diego", since: V,
    involves: ["claudia", "octavio", "chuy"],
    subject: "$64 M de mercancía de temporada sin vender",
    preview: "Cerró la temporada y nos quedaron $64 M en bodega y en anaquel. Te paso tres caminos…",
    body: [
      "Director: cerró la temporada y nos quedaron $64 M de mercancía sin vender, entre bodega y anaquel. Es casi el doble que el año pasado.",
      "Claudia quiere convertirla en caja ya. Octavio dice que si rematamos fuerte, los clientes aprenden a esperar descuentos. Yo creo que una parte se puede guardar para la próxima temporada.",
      "Te dejo los números para que decidas.",
    ],
    data: {
      title: "Lo que sabes",
      rows: [
        ["Mercancía de temporada sin vender", "$64 M a costo"],
        ["Rebaja escalonada por tienda (15 %, 30 %, outlet)", "Recupera ≈ 80 % del costo en seis semanas"],
        ["Remate de 40 % en las 60 tiendas", "Recupera ≈ 70 % en dos semanas"],
        ["Octavio: después de un remate así", "En 1 de cada 2 casos Mundo Casa responde con un descuento mayor"],
        ["Guardarla en bodega", "$600 mil al mes · en 4 de cada 10 temporadas el proveedor cambia de línea y lo guardado vale menos"],
      ],
      note: "Estimaciones de Diego y de Claudia con la venta de las últimas cuatro temporadas. Cifras ficticias de este caso, no estadísticas reales.",
    },
    ask: "¿Qué haces con la mercancía que no se vendió?",
    options: [
      { id: "a", stance: { claudia: 1, octavio: 1, diego: -1 }, text: "Rebajar por etapas tienda por tienda según su venta: 15 %, luego 30 % y lo que quede al outlet.", reply: ["Es más trabajo para las tiendas, pero recupera más.", "(Diego) Bien, aunque una parte la habría guardado."], outcome: "Recuperas más dinero que con un remate y sin educar al cliente a esperar descuentos. Las tiendas tienen seis semanas de reetiquetado.", effects: { caja: 2, margen: -1, clientes: 1, equipo: -1 }, style: { horizonte: 1, foco: 1 }, score: 3 },
      { id: "b", stance: { claudia: 2, octavio: -2 }, text: "Rematar todo al 40 % en las 60 tiendas este fin de semana y convertirlo en caja de una vez.", reply: ["Perfecto. Tenemos caja en dos semanas.", "(Octavio) Le aviso: los clientes de toda la vida van a esperar el siguiente remate."], outcome: "La caja llega rápido y la bodega queda libre. Regalas margen y le enseñas a tus clientes que conviene esperar.", effects: { caja: 4, margen: -3, clientes: 1 }, style: { horizonte: -2, foco: 1 }, score: 1 },
      { id: "c", stance: { diego: 2, claudia: -2 }, text: "Guardar en bodega lo que no pasa de moda y rebajar solo lo que sí, para venderlo completo la próxima temporada.", reply: ["Así no regalamos margen.", "(Claudia) Pagamos bodega varios meses y esa caja sigue parada."], outcome: "Proteges el margen de lo que guardas. Pagas bodega, la caja sigue atrapada y apuestas a que la línea no cambie.", effects: { margen: 2, caja: -2, equipo: 1 }, style: { riesgo: 1, horizonte: 1 }, score: 2 },
    ],
    expired: { reply: ["(Diego) Sin decisión, la mercancía se queda en bodega."], outcome: "Sin decisión, la mercancía siguió parada y pagando bodega.", effects: { caja: -2, margen: -1 } },
    lesson: "finanzas",
    bitacora: { title: "Lo que no se vendió también decide", text: "En retail, la mercancía que sobra es caja atrapada y también un mensaje a tus clientes. Rematar libera caja y enseña a esperar; guardar protege el margen y apuesta a que no cambie la temporada.", nota: "Cada descuento le enseña algo a tu cliente; elige qué quieres que aprenda." },
    areas: ["finanzas", "estrategia", "clientes"],
  },

  // ───────────────────────────────────────────── DÍA 4 · camino «rebaja escalonada»: se compró de más por intuición
  {
    id: "pm-c-temp-compras", day: 4, slot: 3, channel: "reporte", from: "claudia", since: V,
    involves: ["diego", "chuy", "beto"],
    trigger: { item: "pm-d2-temporada", options: ["a"] },
    subject: "La rebaja funcionó. El problema estaba antes", preview: "Ya recuperamos 62 % del costo. Y vimos por qué sobró tanto…",
    body: [
      "La rebaja escalonada va mejor de lo esperado: con la primera etapa recuperamos el 62 % del costo y las tiendas casi no tocaron el 30 %.",
      "Pero al cruzar los datos vimos por qué sobró tanto: los compradores pidieron igual para las 60 tiendas, con base en la temporada pasada. Las tiendas de la sierra vendieron la mitad que las de la ciudad.",
      "Chuy y Beto dicen que los gerentes sabían qué se iba a vender en su tienda, pero nadie les preguntó.",
    ],
    data: { title: "Lo que sabes", rows: [["Recuperado en la primera etapa", "62 % del costo"], ["Compra por tienda", "Igual para las 60"], ["Venta de tiendas de la sierra vs. ciudad", "≈ 50 %"], ["Pedido de la próxima temporada", "Se cierra en 5 semanas"]] },
    ask: "¿Cómo compras la próxima temporada?",
    options: [
      { id: "a", stance: { chuy: 2, beto: 1, diego: -1 }, text: "Que cada gerente proponga su pedido con datos de su tienda y que Compras lo consolide y negocie.", reply: ["(Chuy) ¡Por fin! Yo sé qué se vende en mi tienda.", "(Diego) Mis compradores van a sentir que les quitan su trabajo."], outcome: "Compras más cerca de lo que se vende en cada tienda. Los compradores pierden control y el pedido tarda más en armarse.", effects: { margen: 1, equipo: 1, clientes: 1, consejo: -1, caja: -1 }, style: { estilo: 2, horizonte: 1 }, score: 3 },
      { id: "b", stance: { diego: 1, chuy: -1 }, text: "Comprar 30 % menos en todas las tiendas para no volver a quedarnos con sobrante.", reply: ["Es sencillo de aplicar.", "(Chuy) En mi tienda nos vamos a quedar sin mercancía en la mejor semana."], outcome: "Bajas el riesgo de sobrante. Las tiendas que venden más se quedan cortas en su mejor semana.", effects: { caja: 3, clientes: -2 }, style: { riesgo: -2, foco: 1 }, score: 1 },
      { id: "c", stance: { diego: 1, claudia: 1, beto: -1 }, text: "Contratar un sistema de pronóstico por tienda y que los compradores lo usen desde esta temporada.", reply: ["Ayuda, aunque el sistema necesita meses de datos.", "(Beto) A los gerentes otra vez no se les pregunta."], outcome: "Mejoras el pronóstico con tecnología. Pagas el sistema y sigues sin aprovechar lo que saben los gerentes.", effects: { margen: 1, caja: -1, equipo: -1 }, style: { estilo: -1, horizonte: 1 }, score: 2 },
    ],
    expired: { reply: ["(Claudia) Sin decisión, Compras pedirá igual que siempre."], outcome: "Sin decisión, la próxima temporada se compra como la anterior.", effects: { margen: -1 } },
    lesson: "estrategia",
    bitacora: { title: "El sobrante empezó en la compra", text: "Rebajar bien resolvió el síntoma. La causa estaba en cómo se compra: igual para tiendas que venden distinto. Quien está más cerca del cliente suele saber lo que el promedio esconde.", nota: "Un promedio para 60 tiendas no describe a ninguna." },
    areas: ["estrategia", "personas", "operacion"],
  },

  // ───────────────────────────────────────────── DÍA 4 · camino «remate»: a veces el competidor responde
  {
    id: "pm-c-temp-guerra", day: 4, slot: 3, channel: "whatsapp", from: "octavio", since: V,
    involves: ["diego", "monica", "garza"],
    trigger: { item: "pm-d2-temporada", options: ["b"], roll: [0, 0.5] },
    subject: "Octavio Ríos", preview: "Director, Mundo Casa sacó 50 % en lo mismo y los clientes preguntan cuándo es el siguiente remate…",
    body: [
      "Director, Mundo Casa respondió al remate con 50 % en la misma mercancía y lo está anunciando en radio.",
      "En tienda, los clientes ya preguntan cuándo es nuestro siguiente remate y la venta a precio completo bajó 9 % esta semana.",
      "Don Esteban me pidió que igualemos. Yo quiero saber qué piensa usted.",
    ],
    data: { title: "Lo que sabes", rows: [["Descuento de Mundo Casa", "50 %"], ["Venta a precio completo esta semana", "−9 %"], ["Igualar en las 60 tiendas", "≈ −$8 M de margen"], ["Tiendas a menos de 1 km de Mundo Casa", "12"]] },
    ask: "Mundo Casa respondió. ¿Igualas?",
    options: [
      { id: "a", stance: { monica: 2, octavio: 1, garza: -1 }, text: "No igualar: terminar el remate como se anunció y competir con asesoría, entrega a domicilio y garantía.", reply: ["(Mónica) Eso sí lo podemos cumplir en las 60 tiendas.", "(Don Esteban) Espero que tenga razón. Mi padre nunca dejó que nos ganaran en precio."], outcome: "Cortas la guerra de precios y compites en lo que Mundo Casa no tiene. Algunas ventas se van con ellos esta semana.", effects: { margen: 1, clientes: -1, consejo: -1, equipo: 1 }, style: { horizonte: 2, conflicto: 1 }, score: 3 },
      { id: "b", stance: { garza: 2, octavio: -1, monica: -1 }, text: "Igualar el 50 % en las 60 tiendas y anunciarlo esta misma semana para no perder ni un cliente.", reply: ["(Don Esteban) Así se compite.", "(Octavio) Entendido, aunque ya vamos dos remates en un mes."], outcome: "Retienes tráfico esta semana. Pierdes margen y confirmas que en esta pelea gana quien descuente más.", effects: { clientes: 1, consejo: 1, margen: -3 }, style: { conflicto: 2, horizonte: -2 }, score: 1 },
      { id: "c", stance: { octavio: 2, garza: 1 }, text: "Igualar solo en las 12 tiendas que tienen a Mundo Casa enfrente y mantener el precio en las demás.", reply: ["Así protegemos las tiendas más expuestas.", "(Mónica) Los clientes van a ver precios distintos en cada tienda."], outcome: "Limitas el costo a donde más duele. Los precios distintos entre tiendas confunden a algunos clientes.", effects: { clientes: 2, margen: -1, equipo: -1 }, style: { foco: 1, riesgo: 1 }, score: 2 },
    ],
    expired: { reply: ["(Octavio) Sin respuesta, cada gerente ajustó precios como pudo."], outcome: "Sin decisión, cada tienda puso su propio descuento.", effects: { margen: -2, clientes: -1 } },
    lesson: "estrategia",
    bitacora: { title: "El remate que invitó a una guerra", text: "Rematar fuerte resolvió la bodega y le enseñó al competidor dónde atacar. En una guerra de precios casi siempre pierden los dos; salir de ella exige competir en algo distinto al descuento.", nota: "Si tu única respuesta es bajar el precio, el competidor decide tu margen." },
    areas: ["estrategia", "clientes", "finanzas"],
  },

  // ───────────────────────────────────────────── DÍA 5 · camino «guardar»: a veces cambia la línea
  {
    id: "pm-c-temp-bodega", day: 5, slot: 3, channel: "email", from: "diego", since: V,
    involves: ["claudia", "ines"],
    trigger: { item: "pm-d2-temporada", options: ["c"], roll: [0, 0.4] },
    subject: "El proveedor cambió la línea", preview: "Presentó la línea nueva y lo que guardamos ya se ve viejo…",
    body: [
      "Director, el proveedor presentó su línea nueva y cambió diseño y empaque. Lo que guardamos en bodega ya se ve de la temporada pasada.",
      "Mundo Casa va a tener la línea nueva desde el primer día. Si ponemos lo guardado a precio completo, no se va a vender.",
      "Inés preguntó en el consejo por qué seguimos pagando bodega por mercancía que vale menos.",
    ],
    data: { title: "Lo que sabes", rows: [["Mercancía guardada", "$38 M a costo"], ["Valor estimado hoy", "≈ $23 M"], ["Bodega", "$600 mil al mes mientras siga guardada"], ["Venderla a un mayorista", "$21 M · en una semana"]] },
    ask: "Lo guardado vale menos. ¿Qué haces?",
    options: [
      { id: "a", stance: { claudia: 2, ines: 1, diego: -1 }, text: "Venderla a un mayorista esta semana, reconocer la pérdida ante el consejo y ajustar cómo decidimos guardar.", reply: ["Recuperamos caja y dejamos de pagar bodega.", "(Inés) Gracias por decirlo de frente."], outcome: "Reconoces la pérdida y la caja vuelve a moverse. El margen del trimestre lo resiente y el consejo valora la claridad.", effects: { caja: 2, margen: -3, consejo: 1 }, style: { horizonte: 1, conflicto: 1 }, score: 3 },
      { id: "b", stance: { diego: 1, claudia: -1 }, text: "Venderla en tienda junto a la línea nueva, con 25 % de descuento como «precio especial».", reply: ["Algo se va a vender.", "(Claudia) Va a competir con la línea nueva en nuestro propio anaquel."], outcome: "Recuperas parte del valor poco a poco. La mercancía vieja le quita espacio y venta a la nueva.", effects: { margen: -1, clientes: -1, caja: 2 }, style: { riesgo: 1, foco: -1 }, score: 2 },
      { id: "c", stance: { diego: 2, claudia: -2, ines: -1 }, text: "Guardarla un año más: los diseños regresan y así no reconocemos la pérdida este trimestre.", reply: ["Puede regresar, sí.", "(Inés) Eso solo mueve la pérdida de fecha."], outcome: "El trimestre no muestra la pérdida. Sigues pagando bodega por algo que probablemente valga todavía menos.", effects: { margen: 1, caja: -2, consejo: -1 }, style: { horizonte: -2, riesgo: 1 }, score: 1 },
    ],
    expired: { reply: ["(Diego) Sin decisión, sigue en bodega."], outcome: "Sin decisión, la mercancía siguió perdiendo valor.", effects: { caja: -2, consejo: -1 } },
    lesson: "finanzas",
    bitacora: { title: "Lo que ya se perdió no regresa esperando", text: "Guardar era una apuesta razonable: que la línea no cambiara. Cambió. Lo que se pagó y lo que se perdió ya no regresa; la decisión de hoy es solo qué hacer con lo que vale hoy.", nota: "Esperar para no reconocer una pérdida casi siempre la hace más grande." },
    areas: ["finanzas", "alineacion", "estrategia"],
  },
];
