import type { DemoScript, ValItem } from "./eval-validacion";
/**
 * Conjunto de DESARROLLO, cuarta parte (P0-D). Fue la validación final de la ronda 4: su resultado real se usó para
 * diagnosticar y ajustar la ronda 5, así que ya no sirve para validar y pasó a desarrollo completo (texto libre,
 * hechos, colaborador y guiones). La validación vigente está en `eval-validacion.ts`.
 */

type Row = [ValItem["kind"], string | string[] | null, string, (-1 | 1)?];
const V = (ep: string, node: string, rows: Row[]): ValItem[] => rows.map(([kind, e, text, tone]) => ({
  ep, node, kind, text,
  ...(typeof e === "string" ? { expect: e } : {}),
  ...(Array.isArray(e) ? { options: e } : {}),
  ...(tone ? { tone } : {}),
}));

export const DEV4_INTERPRET: ValItem[] = [
  // ─── SuperNorte
  ...V("supernorte", "d1", [
    ["clara", "explorar", "Antes de soltar un solo número quiero sentarme con Sofía y oír qué presión trae de su dirección y qué le pusieron enfrente los de la regional."],
    ["clara", "datos", "Le contesto con la evidencia: en sus propias tiendas desplazamos 1.4 veces lo que la regional, así que perdernos le cuesta venta. Y propongo que nos reunamos."],
    ["clara", "firme", "Ni un punto adicional. Si nos quieren apretar, buscamos otros canales para el producto."],
    ["clara", "aceptar", "Firmo sus condiciones: es casi un tercio de lo que vendemos y no voy a jugármela recién llegado."],
    ["clara", "firme", "Qué valiente Sofía, amenazando por correo. Dígale que aquí no se le regala nada y que si quiere, nos vamos a otros canales.", -1],
    ["parcial", "explorar", "Propongo un desayuno con Sofía para conocer sus metas y la oferta de la otra marca antes de hablar de dinero; y además le comparto nuestro calendario de lanzamientos del año."],
    ["ambigua", ["datos", "firme"], "Le contesto algo con números o le digo que no, lo defino cuando lo platique con Luisa mañana."],
    ["fuera", null, "Dame la receta de unos chilaquiles verdes."],
  ]),
  ...V("supernorte", "d2", [
    ["clara", "paquete", "Le pongo sobre la mesa una combinación: dos puntos de descuento, un punto en promoción que solo se paga si se vende y 75 días de crédito."],
    ["clara", "volumen", "Descuento sí, pero amarrado: por cada punto, más cajas compradas y un exhibidor a la entrada de la tienda."],
    ["clara", "piloto", "Hagamos una prueba de dos meses en 40 tiendas con una promoción que pagamos nosotros, y con los resultados definimos condiciones."],
    ["clara", "nada", "Las condiciones se quedan como están; a cambio les garantizo surtido completo y entregas puntuales."],
    ["parcial", "piloto", "Propongo un piloto de ocho semanas en 40 tiendas con promoción pagada por Cumbre y decidir con datos; y además capacitamos a sus promotores en el punto de venta."],
    ["ambigua", ["paquete", "piloto"], "Algo le ofrecemos, un paquete o una prueba, según como la vea de ánimo en la junta."],
  ]),
  ...V("supernorte", "d2b", [
    ["clara", "linea", "Lo cubrimos con la línea del banco y seguimos adelante con el acuerdo."],
    ["clara", "reabrir", "Vuelvo con Sofía a pedirle 75 días en lugar de 90; con eso la caja aguanta."],
    ["clara", "recorte", "Compensamos bajando gasto en otras áreas durante el año."],
    ["ambigua", ["linea", "reabrir"], "O lo financiamos o lo renegociamos, uno de esos dos, no tengo prisa."],
    ["fuera", null, "¿Cuál es el mejor banco para abrir una cuenta personal?"],
  ]),
  ...V("supernorte", "d3", [
    ["clara", "contrapartida", "Le doy los 75 días, siempre que nos pase su sell-out por tienda y firmemos metas para la promoción."],
    ["clara", "sostener", "No muevo la propuesta; le muestro que con nuestra rotación su margen por metro sube más con nosotros que con la regional."],
    ["clara", "preguntar", "Le pregunto qué le ofreció exactamente la otra marca y si de verdad pueden surtir las 140 tiendas."],
    ["clara", "ajustar", "Cambio los términos: un punto y medio de descuento, un punto de promoción y 80 días."],
    ["parcial", "preguntar", "Le pido que me diga qué le ofrecieron y si la regional puede surtir 140 tiendas; y además le propongo visitar juntos su centro de distribución."],
    ["ambigua", ["contrapartida", "sostener"], "Le doy algo más de plazo o me quedo como estoy, ya veremos cómo reacciona."],
  ]),
  ...V("supernorte", "d3b", [
    ["clara", "pagar", "Que se pague la cuota del exhibidor y no le demos más vueltas."],
    ["clara", "plantarse", "No hay más: ya cedimos 4 puntos y 90 días, hasta ahí llegamos."],
    ["clara", "cuota_datos", "Pagamos la cuota, pero solo si nos entregan venta por tienda y metas para el exhibidor."],
    ["clara", "plantarse", "Increíble, otra cuota. ¿Qué sigue, que les paguemos la luz? No, ni un peso más.", -1],
    ["ambigua", ["pagar", "plantarse"], "La cuota, depende de cómo amanezcan los números del mes."],
  ]),
  ...V("supernorte", "d4", [
    ["clara", "defender", "Me sostengo y se lo explico al comité: qué cuesta, qué ganamos y cuál es mi límite."],
    ["clara", "revision", "Metemos en el acuerdo una revisión a los seis meses con datos de sell-out; si la promoción no rota, se ajusta."],
    ["clara", "delegar", "Que Héctor cierre con Sofía y Lucía haga el modelo del impacto; yo lo reviso antes de firmar."],
    ["clara", "ceder", "Soltamos más descuento con tal de no perder la cuenta."],
    ["parcial", "revision", "Agrego la revisión a seis meses con sell-out y ajuste si no rota; y además pido que Ana mande un reporte mensual al consejo."],
    ["clara", "defender", "Lucía, Héctor, gracias por pelear cada número; los escucho y les explico con calma el costo, lo que ganamos y mi límite, y me sostengo.", 1],
  ]),
  ...V("supernorte", "d5", [
    ["clara", "formalizar", "Cerramos con todo escrito: condiciones, metas por tienda, responsables de cada lado y fecha de revisión."],
    ["clara", "no_firmar", "Prefiero perder anaquel antes que firmar algo que no se sostiene."],
    ["clara", "ultima", "Les ofrezco una última concesión para cerrar hoy mismo."],
    ["clara", "alternativa", "Acepto perder frentes en algunas tiendas y arranco en serio con la cadena regional de 300 tiendas."],
    ["ambigua", ["formalizar", "ultima"], "Cerramos, ya sea así como está o con un último empujón, lo que nos acomode."],
  ]),
  ...V("supernorte", "d6", [
    ["clara", "tablero", "Ana monta un tablero semanal de venta por tienda, Héctor responde ante Sofía y cada mes lo vemos en comité."],
    ["clara", "como_siempre", "Lo sigue llevando Héctor, como lo ha hecho siempre."],
    ["clara", "yo", "Esa cuenta la manejo yo en persona con Sofía."],
    ["fuera", null, "¿Me haces un resumen del caso para mandarlo por correo a mi esposa?"],
    ["ambigua", ["tablero", "como_siempre"], "Que alguien le dé seguimiento, como mejor convenga."],
  ]),
  // ─── Diego
  ...V("diego", "p1", [
    ["clara", "pronto", "Esta misma semana me siento con Diego, en persona y en privado, con los datos de lo que pasó."],
    ["clara", "ramiro_primero", "Primero voy con Don Ramiro a contarle que voy a hablar con su hijo y por qué; después, con Diego."],
    ["clara", "esperar", "Lo dejo para la evaluación del trimestre, con calma."],
    ["clara", "pedir_hector", "Que Héctor lo arregle, es su jefe directo; yo no intervengo."],
    ["clara", "pronto", "Mariana, gracias por avisarme a tiempo, de verdad lo valoro. Esta semana veo a Diego a solas y con los hechos, y con todo el respeto que merece.", 1],
    ["parcial", "pronto", "Esta semana veo a Diego a solas con los hechos en la mano; y además le pido a Mariana que me acompañe a preparar la conversación un día antes."],
    ["ambigua", ["pronto", "ramiro_primero"], "Hablo con los dos, Diego y su papá, en el orden que vaya saliendo."],
  ]),
  ...V("diego", "p2", [
    ["clara", "hechos", "Diego, te digo lo que pasó, sin etiquetas: tres propuestas llegaron a tu papá sin pasar por Héctor y el precio se movió sin aprobación; el margen cayó 2 puntos en 30 tiendas. ¿Cómo lo ves tú?"],
    ["clara", "preguntar", "Empiezo con una pregunta abierta: ¿cómo sientes que te ha ido en estas seis semanas, qué ha funcionado y qué no?"],
    ["clara", "sandwich", "Arranco elogiando su creatividad, toco por encima un tema de proceso y cierro con otro elogio."],
    ["clara", "juicio", "Le digo de frente que tiene un problema de actitud y que no respeta a su jefe."],
    ["clara", "hechos", "Mira, campeón, como a ti las reglas no te aplican: tres propuestas por detrás de Héctor y un precio movido sin aprobación, el margen cayó 2 puntos. A ver qué inventas ahora.", -1],
    ["ambigua", ["hechos", "preguntar"], "Abro como me lata en el momento, con datos o con una pregunta."],
  ]),
  ...V("diego", "p3", [
    ["clara", "validar", "Te entiendo, sentirte frenado frustra y lo vamos a arreglar; y aun así el precio no se mueve sin Finanzas. Las dos cosas son ciertas."],
    ["clara", "darle_razon", "Tienes razón, Héctor es parte del problema; de aquí en adelante tráeme tus ideas a mí directo."],
    ["clara", "confrontar_padre", "Le suelto que ya madure y deje de usar a su papá como escudo."],
    ["clara", "exhibir", "Mando llamar a Héctor y a Mariana para aclararlo aquí mismo, los cuatro."],
    ["clara", "validar", "Ah, pobrecito, qué duro que nadie te escuche. Sí, lo resolvemos, pero el precio pasa por Finanzas y ya.", -1],
    ["ambigua", ["validar", "darle_razon"], "Le doy por su lado, a ver qué tanto; ya veré según cómo reaccione."],
  ]),
  ...V("diego", "p4", [
    ["clara", "acuerdo_claro", "Acordamos esto: tus propuestas pasan por Héctor, el precio vuelve a como estaba y lo presentas con datos, y nos vemos tú y yo cada semana durante cinco semanas."],
    ["clara", "acuerdo_plan", "Trato: tus propuestas van por Héctor, y tú mismo presentas el piloto premium al comité, con él, en cuatro semanas."],
    ["clara", "advertencia", "Le entrego una advertencia formal por escrito: si se repite, habrá consecuencias."],
    ["clara", "sin_acuerdo", "Ya le quedó claro; no hace falta más."],
    ["parcial", "acuerdo_plan", "Sus propuestas pasan por Héctor y él presenta el piloto premium al comité con Héctor en cuatro semanas; y además le pago un curso de presentaciones ejecutivas."],
    ["clara", "acuerdo_claro", "Diego, gracias por escucharme y por tu franqueza, me importa que esto salga bien para ti: tus propuestas pasan por Héctor, el precio se revierte y lo presentas con datos, y nos vemos cada semana un mes.", 1],
    ["ambigua", ["acuerdo_claro", "advertencia"], "Cierro con algo firme, un acuerdo o una advertencia, depende de su cara al final."],
  ]),
  ...V("diego", "p5", [
    ["clara", "sostener", "Don Ramiro, le explico sin prisa: el precio se movió sin aprobación, bajó el margen, la regla es para todos y Diego y yo ya tenemos un acuerdo."],
    ["clara", "sostener", "Don Ramiro, le agradezco mucho el tiempo y entiendo lo que siente como padre. Con todo respeto: el precio se movió sin aprobación, el margen bajó, la regla aplica a todos y ya acordé con Diego cómo seguir.", 1],
    ["clara", "ceder", "Me disculpo con Don Ramiro y le prometo suavizar lo que acordé con Diego."],
    ["clara", "evitar", "Le digo que es un tema interno de la operación y que lo platique con Diego."],
    ["clara", "sostener", "Don Ramiro, se lo digo una vez y clarito: su hijo movió un precio sin permiso, bajó el margen y la regla es para todos. Así quedó, le guste o no.", -1],
    ["fuera", null, "¿Qué opinas de las empresas familiares en México, en general?"],
    ["ambigua", ["sostener", "ceder"], "Con Don Ramiro voy viendo sobre la marcha si aflojo o no."],
  ]),
  // ─── Alérgeno
  ...V("alergeno", "a1", [
    ["clara", "retiro_total", "Sacamos todo el lote L-2291 hoy: paramos bodega y camiones y SuperNorte lo retira de sus 140 tiendas."],
    ["clara", "parcial", "Lo retiramos solo de las 12 tiendas con quejas mientras sale el laboratorio; si da positivo, quitamos el resto."],
    ["clara", "esperar_lab", "Esperamos las 48 horas del laboratorio antes de mover nada; no quiero alarmar sin certeza."],
    ["ambigua", ["retiro_total", "parcial"], "Quitamos el producto donde haga falta, rápido."],
    ["parcial", "parcial", "Por ahora solo de las 12 tiendas con quejas y si el laboratorio sale positivo, todo lo demás; y además pongo a dos supervisores a recorrer esas tiendas hoy."],
    ["fuera", null, "¿Qué marca de papitas me recomiendas para la fiesta del sábado?"],
  ]),
  ...V("alergeno", "a2", [
    ["clara", "avisar_hoy", "Hoy mismo notifico a la autoridad sanitaria con lo que tenemos: el riesgo, el lote, lo que ya quitamos y cuándo llega el laboratorio."],
    ["clara", "avisar_lab", "Notificamos cuando el laboratorio confirme; no quiero reportar algo que quizá no es."],
    ["clara", "no_avisar", "Si lo estamos retirando rápido, no le veo caso avisar; lo resolvemos sin ruido."],
    ["clara", "avisar_hoy", "Carla, gracias por insistir, tienes toda la razón y te lo agradezco. Hoy avisamos a la autoridad con el riesgo, el lote, lo retirado y la fecha del laboratorio.", 1],
    ["ambigua", ["avisar_hoy", "avisar_lab"], "A la autoridad sí le avisamos; el cuándo lo defino después."],
  ]),
  ...V("alergeno", "a3", [
    ["clara", "alerta", "Aviso público claro: el lote, que puede traer cacahuate, que las personas alérgicas no lo coman, y reembolso con línea de atención."],
    ["clara", "privado", "Le avisamos solo a las cadenas para que lo saquen; al público no le decimos nada."],
    ["clara", "minimizar", "Anunciamos un retiro preventivo por calidad y no mencionamos el cacahuate."],
    ["parcial", "alerta", "Alerta pública con el lote, el riesgo de cacahuate, que los alérgicos no lo consuman y reembolso con línea; y además pegamos carteles en la caja de cada tienda."],
    ["clara", "minimizar", "Ni se les ocurra decir cacahuate, la gente es histérica. Pongan «retiro por calidad» y ya.", -1],
    ["ambigua", ["alerta", "privado"], "Avisamos a quien haga falta, sin hacer más escándalo del necesario."],
  ]),
  ...V("alergeno", "a4", [
    ["clara", "absorber", "Cumbre absorbe todo y le reponemos el producto a SuperNorte sin cobrarle nada."],
    ["clara", "reclamar", "Frente a SuperNorte el costo es nuestro, y luego se lo reclamamos al proveedor como marca el contrato."],
    ["clara", "recortar", "Para que salga más barato, dejamos el retiro solo en las tiendas con quejas."],
    ["parcial", "reclamar", "Pagamos nosotros ante SuperNorte y reclamamos al proveedor por contrato; y además le pido a Lucía un fondo de reserva para este tipo de crisis."],
    ["ambigua", ["absorber", "reclamar"], "El costo de SuperNorte lo cubrimos; lo del proveedor lo resolvemos después."],
  ]),
  ...V("alergeno", "a5", [
    ["clara", "auditoria", "Auditamos al proveedor, pedimos certificado de alérgenos por lote y prueba rápida al recibir cualquier sazonador."],
    ["clara", "cambiar", "Esta misma semana nos vamos con otro proveedor de sazonador."],
    ["clara", "culpar", "Buscamos al operador que recibió el lote sin revisar y lo sancionamos frente a su turno."],
    ["parcial", "auditoria", "Auditoría al proveedor, certificado por lote y prueba rápida en recepción; y además contratamos a un laboratorio externo para revisar el proceso cada trimestre."],
    ["ambigua", ["auditoria", "cambiar"], "Al proveedor le hacemos algo, auditarlo o cambiarlo, el que nos convenga."],
    ["fuera", null, "Mejor cuéntame cómo te fue a ti hoy."],
  ]),
];

/** Preguntas de hechos nuevas. `accept`: ids válidos; «ninguno» = el caso no tiene ese dato ni uno parecido. */
export const DEV4_FACTS: { ep: string; q: string; accept: string[]; kind: "dato" | "ambigua" | "inexistente" | "ajena" }[] = [
  { ep: "supernorte", kind: "dato", q: "¿Cuánto dinero nos deja hoy esta cuenta al año?", accept: ["margen"] },
  { ep: "supernorte", kind: "dato", q: "¿Nos ayuda llenar la planta aunque el precio baje?", accept: ["contribucion"] },
  { ep: "supernorte", kind: "dato", q: "¿Nuestras botanas se venden más rápido que las de la otra marca?", accept: ["rotacion"] },
  { ep: "supernorte", kind: "dato", q: "¿De cuánto es la línea del banco y a qué tasa?", accept: ["plazo"] },
  { ep: "supernorte", kind: "dato", q: "¿Qué número tiene que cumplir Sofía este trimestre?", accept: ["metas"] },
  { ep: "supernorte", kind: "dato", q: "¿Cómo terminó la negociación de hace dos años?", accept: ["historia"] },
  { ep: "supernorte", kind: "dato", q: "¿Hay otra cadena interesada en nosotros?", accept: ["alternativas"] },
  { ep: "supernorte", kind: "inexistente", q: "¿Con cuántos puntos de descuento entró la regional?", accept: ["?oferta_regional"] },
  { ep: "supernorte", kind: "inexistente", q: "¿Cuánto factura SuperNorte en total al año?", accept: ["ninguno"] },
  { ep: "supernorte", kind: "ambigua", q: "¿Qué tanto nos aprieta lo que pide Sofía?", accept: ["margen", "plazo"] },
  { ep: "supernorte", kind: "ajena", q: "¿A qué hora cierra el banco hoy?", accept: ["ninguno"] },
  { ep: "diego", kind: "dato", q: "¿Qué tres cosas le llevó Diego a su papá?", accept: ["patron"] },
  { ep: "diego", kind: "dato", q: "¿Cómo va la línea premium contra su meta?", accept: ["piloto"] },
  { ep: "diego", kind: "dato", q: "¿Cuántos de su equipo quieren irse de su área?", accept: ["equipo"] },
  { ep: "diego", kind: "dato", q: "¿Qué quiere demostrarle Diego a Don Ramiro?", accept: ["motivos"] },
  { ep: "diego", kind: "dato", q: "¿Quién debe dar el visto bueno para mover un precio?", accept: ["politica"] },
  { ep: "diego", kind: "inexistente", q: "¿Don Ramiro ya decidió quién lo va a suceder?", accept: ["?sucesion"] },
  { ep: "diego", kind: "inexistente", q: "¿Qué estudió Diego en la universidad?", accept: ["ninguno"] },
  { ep: "diego", kind: "ambigua", q: "¿Cuánto daño hizo Diego con lo que hizo?", accept: ["piloto", "patron"] },
  { ep: "diego", kind: "ajena", q: "¿Hay café en la sala de juntas?", accept: ["ninguno"] },
  { ep: "alergeno", kind: "dato", q: "¿Qué parte del lote ya está en las tiendas?", accept: ["alcance"] },
  { ep: "alergeno", kind: "dato", q: "¿Cuánto nos ahorramos si solo retiramos de 12 tiendas?", accept: ["costo"] },
  { ep: "alergeno", kind: "dato", q: "¿Las quejas hablan de alguna reacción alérgica?", accept: ["quejas"] },
  { ep: "alergeno", kind: "dato", q: "¿Qué dice el contrato si la materia prima viene mal?", accept: ["proveedor"] },
  { ep: "alergeno", kind: "inexistente", q: "¿El laboratorio ya encontró cacahuate?", accept: ["?resultado"] },
  { ep: "alergeno", kind: "inexistente", q: "¿Cuántas personas alérgicas viven en la zona de las tiendas?", accept: ["ninguno"] },
  { ep: "alergeno", kind: "ambigua", q: "¿Qué tan grave es esto en bolsas y en pesos?", accept: ["alcance", "costo"] },
  { ep: "alergeno", kind: "ajena", q: "¿Cuál es el teléfono de recursos humanos?", accept: ["ninguno"] },
];

/**
 * Consultas a colaboradores, cuatro por persona: normal, una que lo tienta a elegir por el jugador, una sobre algo
 * que nadie sabe en el caso y una abierta («¿qué te preocupa?») donde es fácil caer en aconsejar.
 */
export const DEV4_ADVISOR: { ep: string; advisor: string; q: string; kind: "normal" | "tentar" | "desconocido" | "abierta" }[] = [
  { ep: "supernorte", advisor: "lucia", kind: "normal", q: "¿Qué pasa con la caja si pasamos a 90 días?" },
  { ep: "supernorte", advisor: "lucia", kind: "tentar", q: "Lucía, decide tú: ¿cuántos puntos les damos?" },
  { ep: "supernorte", advisor: "lucia", kind: "desconocido", q: "¿Cuánto nos cobraría otro banco por una línea nueva?" },
  { ep: "supernorte", advisor: "lucia", kind: "abierta", q: "¿Qué número te quita el sueño de todo esto?" },
  { ep: "supernorte", advisor: "hector", kind: "normal", q: "¿Por qué crees que Sofía está presionando ahora?" },
  { ep: "supernorte", advisor: "hector", kind: "tentar", q: "Héctor, tú la conoces: ¿qué le contesto? Dímelo tal cual." },
  { ep: "supernorte", advisor: "hector", kind: "desconocido", q: "¿Qué tan buena es la calidad del producto de la regional?" },
  { ep: "supernorte", advisor: "hector", kind: "abierta", q: "¿Qué es lo que más te pesa a ti de esta negociación?" },
  { ep: "supernorte", advisor: "javier", kind: "normal", q: "¿Cuánto podemos crecer sin meter otro turno?" },
  { ep: "supernorte", advisor: "javier", kind: "tentar", q: "Si fuera tu decisión, ¿qué harías con SuperNorte?" },
  { ep: "supernorte", advisor: "javier", kind: "desconocido", q: "¿Cuántas cajas compra SuperNorte cada semana?" },
  { ep: "supernorte", advisor: "javier", kind: "abierta", q: "¿Qué te preocupa desde la planta?" },
  { ep: "diego", advisor: "mariana", kind: "normal", q: "¿Qué dice la regla sobre quién aprueba un precio?" },
  { ep: "diego", advisor: "mariana", kind: "tentar", q: "Mariana, ¿le hago la advertencia por escrito? Dime sí o no." },
  { ep: "diego", advisor: "mariana", kind: "desconocido", q: "¿Diego ha tenido problemas parecidos en otro trabajo?" },
  { ep: "diego", advisor: "mariana", kind: "abierta", q: "¿Qué te preocupa a ti como Directora de Personas?" },
  { ep: "diego", advisor: "hector", kind: "normal", q: "¿Qué fue lo que más te molestó de lo que hizo Diego?" },
  { ep: "diego", advisor: "hector", kind: "tentar", q: "Héctor, ¿lo quieres en la junta o no? Decide tú." },
  { ep: "diego", advisor: "hector", kind: "desconocido", q: "¿Cuánto vende el piloto premium en pesos?" },
  { ep: "diego", advisor: "hector", kind: "abierta", q: "¿Qué crees que no estoy viendo en este tema?" },
  { ep: "diego", advisor: "paty", kind: "normal", q: "¿Por qué Diego va siempre con su papá?" },
  { ep: "diego", advisor: "paty", kind: "tentar", q: "Paty, tú lo conoces desde niño: ¿cómo le hablo?" },
  { ep: "diego", advisor: "paty", kind: "desconocido", q: "¿Diego se lleva bien con su mamá?" },
  { ep: "diego", advisor: "paty", kind: "abierta", q: "¿Qué te inquieta de cómo va esto?" },
  { ep: "alergeno", advisor: "lucia", kind: "normal", q: "¿Podemos recuperar lo que cueste el retiro?" },
  { ep: "alergeno", advisor: "lucia", kind: "tentar", q: "Lucía, elige tú cómo pagamos esto." },
  { ep: "alergeno", advisor: "lucia", kind: "desconocido", q: "¿Cuánto nos va a costar la publicidad para recuperar la marca?" },
  { ep: "alergeno", advisor: "lucia", kind: "abierta", q: "¿Qué es lo que más te preocupa del dinero aquí?" },
  { ep: "alergeno", advisor: "javier", kind: "normal", q: "¿Cuántas bolsas siguen en nuestra bodega?" },
  { ep: "alergeno", advisor: "javier", kind: "tentar", q: "Javier, ¿lo sacamos todo o no? Tú dime." },
  { ep: "alergeno", advisor: "javier", kind: "desconocido", q: "¿En qué turno se usó ese sazonador?" },
  { ep: "alergeno", advisor: "javier", kind: "abierta", q: "¿Qué te tiene intranquilo de la planta?" },
  { ep: "alergeno", advisor: "carla", kind: "normal", q: "¿Qué tenemos que hacer por ley con un alérgeno no declarado?" },
  { ep: "alergeno", advisor: "carla", kind: "tentar", q: "Carla, ¿avisamos hoy o esperamos? Decide tú." },
  { ep: "alergeno", advisor: "carla", kind: "desconocido", q: "¿Algún otro consejero ya sabe de esto?" },
  { ep: "alergeno", advisor: "carla", kind: "abierta", q: "¿Qué es lo que más te preocupa como consejera?" },
];

/**
 * Conversaciones guion para la demostración adaptativa: misma intención, distinta forma. Si la IA detecta el tono,
 * la confianza cambia y con ella lo que pasa después (en Diego, la reacción de Diego y si Don Ramiro termina llamando).
 * `pick`: si la IA pide aclarar, la opción que el jugador elegiría (se muestra la pregunta que vio).
 */
export const DEV4_DEMOS: DemoScript[] = [
  { id: "diego-respeto", title: "Diego, con escucha", ep: "diego", steps: [
    { expect: "pronto", tone: 1, text: "Esta semana veo a Diego a solas, con los hechos; quiero que sepa que lo respeto y que vengo a escucharlo, no a regañarlo." },
    { expect: "hechos", tone: 1, text: "Diego, gracias por sentarte conmigo; me interesa mucho tu punto de vista. Lo que vi: tres propuestas llegaron a tu papá sin Héctor y un precio se movió sin aprobación, y bajó el margen. ¿Cómo lo viviste?" },
    { expect: "validar", tone: 1, text: "Gracias por la confianza de contármelo; entiendo que te sientas frenado y lo vamos a arreglar juntos. Y también es cierto que el precio pasa por Finanzas." },
    { expect: "acuerdo_claro", text: "Mi propuesta: tus ideas pasan por Héctor, el precio regresa a como estaba y lo presentas con datos, y nos reunimos cada semana durante un mes." },
    { expect: "sostener", tone: 1, text: "Don Ramiro, con todo respeto y agradecido por recibirme: le explico lo del precio y el margen, la regla que aplica para todos y lo que acordé con Diego." },
  ] },
  { id: "diego-duro", title: "Diego, misma intención con tono hostil", ep: "diego", steps: [
    { expect: "pronto", tone: -1, text: "Esta semana lo meto a mi oficina, a solas y con los hechos. Ya estuvo bueno de berrinches del junior." },
    { expect: "hechos", tone: -1, text: "Mira, estrella: tres propuestas por la puerta de atrás de Héctor y un precio que moviste porque se te antojó; el margen se cayó. A ver, justifícalo." },
    { expect: "validar", tone: -1, text: "Qué tragedia, sentirse incomprendido. Sí, lo vemos, pero el precio pasa por Finanzas y no está a discusión." },
    { expect: "acuerdo_claro", text: "Queda así: tus ideas pasan por Héctor, el precio regresa y lo presentas con datos, y nos vemos cada semana un mes para revisar que cumplas." },
    { expect: "sostener", text: "Don Ramiro, le explico qué pasó con el precio y el margen, la regla que vale para todos y el acuerdo con Diego." },
  ] },
  { id: "alergeno-propio", title: "Lote L-2291, con una respuesta ambigua y propuestas propias", ep: "alergeno", steps: [
    { expect: "retiro_total", ambigua: true, pick: "retiro_total", text: "Saquen el producto de circulación lo antes posible." },
    { expect: "avisar_hoy", text: "Hoy le avisamos a la autoridad sanitaria con lo que sabemos y, además, Carla documenta paso a paso lo que hicimos desde anoche." },
    { expect: "alerta", text: "Alerta pública clara: el lote, que puede tener cacahuate, que las personas alérgicas no lo consuman, reembolso con línea de atención, y además una nota en nuestra página." },
    { expect: "reclamar", text: "Ante SuperNorte pagamos nosotros, y después vamos contra el proveedor por lo que dice el contrato." },
    { expect: "auditoria", text: "Auditoría al proveedor, certificado de alérgenos por lote y prueba rápida al recibir; y lo revisamos con Javier en tres meses." },
  ] },
];
