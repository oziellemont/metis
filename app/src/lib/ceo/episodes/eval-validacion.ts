/**
 * Conjunto de VALIDACIÓN FINAL de la ronda 6 (P0-D). Frases nuevas, escritas ANTES de cambiar los prompts y las
 * reglas de la ronda 6 y que no se usaron para ajustar nada. El desarrollo es `eval-set.ts` + `eval-dev-ronda2.ts` a
 * `eval-dev-ronda5.ts` (las validaciones de las rondas 2 a 5, que ya se usaron para diagnosticar).
 *
 * Tipos de respuesta del jugador:
 *  - «clara»:   corresponde a una estrategia, con palabras nuevas.
 *  - «parcial»: corresponde a una estrategia y agrega una propuesta que el caso no contempla.
 *  - «ambigua»: admite dos lecturas con consecuencias distintas, pospone la decisión o es tan general que cabe en
 *               varias; lo correcto es PREGUNTAR.
 *  - «fuera»:   no responde a la decisión; lo correcto es no comprometer nada.
 * `tone` marca las frases cuya forma (respetuosa u hostil) debe detectarse; las que no lo marcan deben salir en 0
 * solo cuando son claramente neutras (no se exige tono en las demás).
 */
export type ValKind = "clara" | "parcial" | "ambigua" | "fuera";
export interface ValItem { ep: string; node: string; kind: ValKind; expect?: string; options?: string[]; tone?: -1 | 1; text: string }

type Row = [ValKind, string | string[] | null, string, (-1 | 1)?];
const V = (ep: string, node: string, rows: Row[]): ValItem[] => rows.map(([kind, e, text, tone]) => ({
  ep, node, kind, text,
  ...(typeof e === "string" ? { expect: e } : {}),
  ...(Array.isArray(e) ? { options: e } : {}),
  ...(tone ? { tone } : {}),
}));

export const VALIDATION_SET: ValItem[] = [
  // ─── SuperNorte
  ...V("supernorte", "d1", [
    ["clara", "explorar", "Busco a Sofía para tomar un café y escuchar qué le piden sus jefes y qué le ofreció la otra marca; las cifras, en otra junta."],
    ["clara", "datos", "Le mando a Sofía el comparativo de rotación: vendemos 1.4 veces lo que la regional en sus anaqueles, así que sacarnos le cuesta a ella."],
    ["clara", "firme", "Le contesto que el descuento actual es el tope; si nos aprietan más, nos enfocamos en otros canales."],
    ["clara", "aceptar", "Firmo lo que pide SuperNorte; es casi un tercio de lo que vendemos y no es momento de pelear."],
    ["clara", "explorar", "Sofía, gracias por la confianza de decírnoslo antes; me encantaría escucharte en persona y entender qué necesitas este año antes de hablar de números.", 1],
    ["clara", "firme", "Qué casualidad que justo ahora se acuerden de pedir más. No hay un punto más de descuento; si insisten, nos vamos a otros canales.", -1],
    ["parcial", "datos", "Le enseño a Sofía que rotamos 1.4 veces más que la regional y que perdernos le baja la venta; y además le propongo un estudio conjunto del comprador en tienda."],
    ["ambigua", ["explorar", "firme"], "Le contesto a Sofía como se merece, ni más ni menos."],
    ["fuera", null, "¿Cuál es la mejor app para aprender inglés?"],
  ]),
  ...V("supernorte", "d2", [
    ["clara", "paquete", "Les planteo todo junto: un punto y medio de descuento, promoción pagada contra sell-out y pasar a 75 días."],
    ["clara", "volumen", "Cada punto que demos tiene que venir con más cajas compradas y un exhibidor en piso; si no hay volumen, no hay punto."],
    ["clara", "piloto", "Arrancamos una prueba de 8 semanas en 40 tiendas, con la promoción por nuestra cuenta, y con los resultados cerramos condiciones."],
    ["clara", "nada", "Condiciones iguales que hoy; lo que mejoramos es la entrega y que nunca falte producto en anaquel."],
    ["parcial", "piloto", "Prueba de 8 semanas en 40 sucursales con promoción a cargo de Cumbre; y además ponemos degustaciones los fines de semana."],
    ["ambigua", ["paquete", "volumen"], "Les damos algo de descuento siempre que haya algo a cambio."],
  ]),
  ...V("supernorte", "d2b", [
    ["clara", "linea", "Tapamos el hueco de caja con la línea del banco y seguimos adelante con el trato."],
    ["clara", "reabrir", "Vuelvo con Sofía a pedirle 75 días en lugar de 90."],
    ["clara", "recorte", "Apretamos gastos de otra área este año para cubrir la diferencia."],
    ["ambigua", ["linea", "reabrir"], "Buscamos cómo financiar esos días extra, ya sea con el banco o con Sofía."],
    ["fuera", null, "¿Qué restaurante me recomiendas para una cena de aniversario?"],
  ]),
  ...V("supernorte", "d3", [
    ["clara", "contrapartida", "Acepto los 75 días, Sofía, pero solo si me compartes el sell-out de cada tienda y fijamos metas para la promoción."],
    ["clara", "sostener", "No cambio la propuesta; le muestro a Sofía que con 1.4 veces de rotación su margen por metro de anaquel mejora con nosotros."],
    ["clara", "preguntar", "Primero quiero saber qué le ofreció la regional, con detalle, y si tiene con qué surtir sus 140 tiendas."],
    ["clara", "ajustar", "Reacomodo los números: un punto y medio de descuento, un punto de promoción y 80 días."],
    ["clara", "sostener", "Ay, Sofía, siempre con tus exigencias. La propuesta se queda como está: rotamos 1.4 veces más y tu margen por metro sube con nosotros.", -1],
    ["parcial", "contrapartida", "Te doy 75 días a cambio del sell-out por tienda y metas para la promoción; y además te propongo una junta trimestral de planeación de categoría."],
    ["ambigua", ["ajustar", "contrapartida"], "Algo le movemos a la propuesta para que Sofía quede contenta, ahí vemos qué."],
  ]),
  ...V("supernorte", "d3b", [
    ["clara", "pagar", "Sí, pagamos la cuota extra y cerramos el tema."],
    ["clara", "plantarse", "Esa cuota no va: ya pusimos 4 puntos y 90 días sobre la mesa."],
    ["clara", "cuota_datos", "Pago la cuota solo si a cambio recibo sell-out tienda por tienda y metas para el exhibidor."],
    ["clara", "plantarse", "Sofía, te agradezco que lo plantees con claridad, pero con todo respeto no podemos pagar esa cuota: ya dimos 4 puntos y 90 días.", 1],
    ["ambigua", ["pagar", "plantarse"], "Lo de la cuota lo consulto con la almohada."],
  ]),
  ...V("supernorte", "d4", [
    ["clara", "defender", "Me sostengo y le pongo números al equipo: lo que cuesta, lo que ganamos y mi límite."],
    ["clara", "revision", "Le agregamos al acuerdo una cláusula para revisar a los 6 meses con sell-out; si no rota, se corrige."],
    ["clara", "delegar", "Héctor termina la negociación con Sofía, Lucía modela el impacto y yo reviso antes de que se firme."],
    ["clara", "ceder", "Para no perder la cuenta, damos un poco más de descuento."],
    ["clara", "defender", "Qué bonito que ahora todos sean expertos. Les explico una vez lo que cuesta, lo que ganamos y hasta dónde llego.", -1],
    ["parcial", "delegar", "Que Héctor cierre con Sofía y Lucía haga el modelo, yo lo reviso antes de firmar; y además invito a Javier a la última junta para validar la capacidad."],
    ["ambigua", ["defender", "ceder"], "Escucho al equipo y hago lo que crea correcto."],
  ]),
  ...V("supernorte", "d5", [
    ["clara", "formalizar", "Lo dejamos por escrito: condiciones, metas por tienda, un responsable de cada lado y la fecha de revisión."],
    ["clara", "no_firmar", "Así no firmo; perder frente es mejor que comprometerme a algo que no se paga solo."],
    ["clara", "alternativa", "Dejo ir parte de las tiendas y empiezo a platicar en serio con la cadena regional de 300 tiendas."],
    ["clara", "ultima", "Para cerrar hoy, cedo una última cosa."],
    ["parcial", "formalizar", "Firmamos por escrito términos, metas por tienda, responsables de cada lado y fecha de revisión; y además hacemos una comida con el equipo de Sofía para celebrar."],
    ["ambigua", ["ultima", "no_firmar"], "Lo cierro hoy, de un modo o de otro."],
    ["fuera", null, "Explícame cómo funciona un motor eléctrico."],
  ]),
  ...V("supernorte", "d6", [
    ["clara", "tablero", "Ana manda un reporte semanal de venta por tienda, Héctor responde ante Sofía y cada mes lo revisa el comité."],
    ["clara", "como_siempre", "Lo sigue llevando Héctor como lo ha hecho, conoce a Sofía mejor que nadie."],
    ["clara", "yo", "Me encargo directamente de la relación con Sofía."],
    ["clara", "tablero", "Ana, gracias por ofrecerte; si te parece, armas un tablero semanal por tienda, Héctor es el responsable con Sofía y lo vemos cada mes en comité.", 1],
    ["parcial", "tablero", "Tablero semanal por tienda que arma Ana, Héctor responde ante Sofía, comité cada mes; y además le pedimos a Sofía una llamada trimestral con su jefe."],
    ["ambigua", ["tablero", "yo"], "Hay que estar encima del acuerdo para que se cumpla."],
    ["fuera", null, "¿Cuántos kilómetros hay de Monterrey a Saltillo?"],
  ]),
  // ─── Diego
  ...V("diego", "p1", [
    ["clara", "pronto", "Veo a Diego esta semana en privado, cara a cara, con lo que pasó documentado."],
    ["clara", "ramiro_primero", "Antes de citar a Diego le explico a Don Ramiro, en persona, que voy a hablar con su hijo y la razón."],
    ["clara", "esperar", "Lo trato en la evaluación trimestral, ahí con calma."],
    ["clara", "pedir_hector", "Que Héctor lo resuelva, para eso es su jefe directo; yo no intervengo."],
    ["clara", "pronto", "Ya estuvo bueno con el juniorcito. Esta semana lo veo a solas y le pongo enfrente lo que hizo.", -1],
    ["clara", "ramiro_primero", "Por respeto a Don Ramiro, primero voy a verlo en persona para contarle que hablaré con Diego y por qué; después me siento con Diego.", 1],
    ["parcial", "pronto", "Esta semana me reúno con Diego a solas y con los hechos; y además le pido a Paty que me cuente cómo lo ve el equipo antes de la plática."],
    ["ambigua", ["pronto", "esperar"], "Le doy su tiempo a esto y luego hablo con Diego."],
    ["fuera", null, "¿Cómo se calcula el aguinaldo?"],
  ]),
  ...V("diego", "p2", [
    ["clara", "hechos", "Le pongo los hechos sobre la mesa, sin adjetivos: tres propuestas que se brincaron a Héctor y un precio cambiado sin permiso que bajó 2 puntos de margen en 30 tiendas. Luego le pregunto su versión."],
    ["clara", "preguntar", "Empiezo con una pregunta abierta: ¿qué te ha funcionado en estas seis semanas y qué no?"],
    ["clara", "sandwich", "Le digo primero lo creativo que es, después toco de pasada unos temas de proceso y termino con otro elogio."],
    ["clara", "juicio", "Le digo de frente que tiene un problema de actitud y que no respeta a Héctor."],
    ["clara", "hechos", "Mira, mijo, a ver si entiendes: tres propuestas brincándote a Héctor y un precio movido por tu cuenta, 2 puntos de margen menos en 30 tiendas. Explícame.", -1],
    ["clara", "preguntar", "Diego, gracias por venir; me interesa mucho tu punto de vista. ¿Cómo sientes que te han ido estas seis semanas, qué ha funcionado y qué no?", 1],
    ["parcial", "hechos", "Le planteo los hechos sin calificar: tres propuestas sin Héctor y el precio movido sin aprobación, 2 puntos menos de margen en 30 tiendas, y le pido su lectura; y además le ofrezco un espacio mensual para presentar ideas al comité."],
    ["ambigua", ["hechos", "juicio"], "Le digo a Diego lo que pienso de todo esto, sin rodeos."],
  ]),
  ...V("diego", "p3", [
    ["clara", "validar", "Te entiendo, te sientes frenado y eso lo vamos a corregir; al mismo tiempo, el precio no se toca sin Finanzas."],
    ["clara", "darle_razon", "Tienes razón, Héctor te frena; desde hoy tus ideas me las traes directo a mí."],
    ["clara", "confrontar_padre", "Le reclamo que siempre se cubra con Don Ramiro y que ya no lo use de escudo."],
    ["clara", "exhibir", "Mando llamar a Héctor y a Mariana para que lo aclaremos los cuatro en este momento."],
    ["clara", "validar", "Uy, sí, pobre de ti, todos contra ti. Lo arreglamos, pero el precio pasa por Finanzas y no se discute.", -1],
    ["clara", "validar", "Diego, valoro que me lo digas tan claro; entiendo que te sientas bloqueado y lo vamos a resolver, aunque el precio sigue pasando por Finanzas.", 1],
    ["parcial", "validar", "Entiendo tu frustración y la vamos a atender, pero el precio pasa por Finanzas; y además te propongo un curso de negociación interna."],
    ["ambigua", ["validar", "darle_razon"], "Le doy la razón en lo que tenga razón y ya."],
  ]),
  ...V("diego", "p4", [
    ["clara", "acuerdo_claro", "Quedamos así: tus ideas pasan por Héctor, el precio regresa y se presenta con datos, y nos reunimos cada semana durante seis semanas."],
    ["clara", "acuerdo_plan", "Tus ideas van por Héctor y, a cambio, tú expones el piloto premium ante el comité junto con Héctor dentro de cuatro semanas."],
    ["clara", "advertencia", "Le dejo una advertencia formal por escrito: si se repite, habrá consecuencias."],
    ["clara", "sin_acuerdo", "No firmamos nada; ya le quedó claro."],
    ["parcial", "acuerdo_claro", "Tus propuestas por Héctor, el precio se revierte y lo presentas con datos, y uno a uno semanal por seis semanas; y además te pido que des una plática de innovación al equipo."],
    ["ambigua", ["acuerdo_claro", "acuerdo_plan"], "Cerramos con un acuerdo bueno para los dos."],
  ]),
  ...V("diego", "p5", [
    ["clara", "sostener", "Don Ramiro, le explico sin prisa el cambio de precio, el margen, la regla que aplica igual para todos y el acuerdo con Diego."],
    ["clara", "ceder", "Le pido una disculpa a Don Ramiro y le prometo aflojar el acuerdo con Diego."],
    ["clara", "evitar", "Le respondo que es tema interno de la operación y que lo vea con Diego."],
    ["clara", "sostener", "Don Ramiro, le agradezco que me escuche; con el mayor respeto le cuento lo del precio, el margen, la política que aplica a todos y lo que acordamos Diego y yo.", 1],
    ["clara", "sostener", "Mire, Don Ramiro, si usted no lo hubiera consentido tanto no estaríamos aquí: hubo un precio movido, cayó el margen, la regla es para todos y ya quedó un acuerdo con Diego.", -1],
    ["ambigua", ["sostener", "ceder"], "Atiendo a Don Ramiro y platicamos de lo que pasó, a ver cómo reacciona."],
    ["fuera", null, "¿Qué es mejor, Netflix o HBO?"],
  ]),
  // ─── Lote L-2291
  ...V("alergeno", "a1", [
    ["clara", "retiro_total", "Paramos hoy el lote entero: lo que hay en bodega, lo que va en camino y lo de las 140 tiendas."],
    ["clara", "parcial", "De momento lo sacamos solo de las 12 tiendas con quejas; si el laboratorio da positivo, retiramos el resto."],
    ["clara", "esperar_lab", "Nos esperamos al resultado del laboratorio en 48 horas antes de mover producto."],
    ["clara", "retiro_total", "¿Y ustedes para qué están si nadie hizo nada anoche? Retiren el lote completo hoy, de las 140 tiendas, bodega y camiones.", -1],
    ["parcial", "retiro_total", "Sacamos todo el lote hoy de bodega, camiones y 140 tiendas; y además abrimos una línea directa para que las tiendas reporten cualquier caso."],
    ["ambigua", ["retiro_total", "parcial"], "Retiren el producto de los anaqueles hoy."],
    ["ambigua", ["retiro_total", "parcial"], "Hay que quitar ese lote de la venta, pronto."],
    ["fuera", null, "¿Cuál es la receta de las papas a la francesa?"],
  ]),
  ...V("alergeno", "a2", [
    ["clara", "avisar_hoy", "Hoy notificamos a la autoridad sanitaria con todo: el riesgo, el lote, lo retirado y cuándo sale el laboratorio."],
    ["clara", "avisar_lab", "A la autoridad le informamos cuando el laboratorio confirme; antes no tiene caso."],
    ["clara", "no_avisar", "No avisamos a la autoridad; como ya retiramos, lo arreglamos en silencio."],
    ["clara", "avisar_hoy", "Carla, gracias por insistir, tienes toda la razón: hoy avisamos a la autoridad sanitaria con el riesgo, el lote, lo retirado y cuándo llega el laboratorio.", 1],
    ["parcial", "avisar_hoy", "Hoy mismo avisamos a la autoridad con lo que sabemos; y además contratamos a un despacho externo para que acompañe el proceso."],
    ["ambigua", ["avisar_hoy", "avisar_lab"], "A la autoridad le avisamos, claro, cuando corresponda."],
  ]),
  ...V("alergeno", "a3", [
    ["clara", "alerta", "Sacamos una alerta pública con el número de lote, el posible cacahuate, que los alérgicos no lo consuman y cómo pedir reembolso."],
    ["clara", "privado", "Solo avisamos a las cadenas para que lo retiren, sin comunicado."],
    ["clara", "minimizar", "Decimos que es un retiro preventivo por calidad y no mencionamos el cacahuate."],
    ["clara", "privado", "No vamos a hacerle caso a los alarmistas: se avisa a las cadenas y punto, sin comunicado.", -1],
    ["parcial", "alerta", "Alerta pública con lote, riesgo de cacahuate, que no lo coman los alérgicos y reembolso; y además pedimos a SuperNorte poner un letrero en sus tiendas."],
    ["ambigua", ["alerta", "privado"], "Comunicamos lo necesario a quien deba enterarse."],
    ["ambigua", ["alerta", "minimizar"], "Sacamos un aviso, sin asustar de más."],
  ]),
  ...V("alergeno", "a4", [
    ["clara", "absorber", "Cumbre paga el retiro completo y a SuperNorte le reponemos sin cargo."],
    ["clara", "reclamar", "Ante SuperNorte el costo es nuestro, y por contrato se lo cobramos después al proveedor del sazonador."],
    ["clara", "recortar", "Para que cueste menos, dejamos el retiro solo en las tiendas que reportaron quejas."],
    ["clara", "ampliar", "Ya sé que es tarde, pero sacamos el lote completo de las 140 tiendas y vamos contra el proveedor."],
    ["clara", "seguir_esperando", "Seguimos esperando el resultado; el laboratorio entrega en menos de 24 horas."],
    ["parcial", "reclamar", "Pagamos nosotros frente a SuperNorte y le reclamamos al proveedor según el contrato; y además buscamos un segundo proveedor de respaldo."],
    ["ambigua", ["absorber", "reclamar"], "Lo del costo lo absorbemos por ahora."],
    ["ambigua", ["absorber", "reclamar"], "Nosotros cubrimos a SuperNorte y del proveedor vemos qué procede."],
  ]),
  ...V("alergeno", "a5", [
    ["clara", "auditoria", "Le hacemos auditoría al proveedor, exigimos certificado de alérgenos por lote y una prueba rápida al recibir."],
    ["clara", "cambiar", "Cambiamos al proveedor del sazonador esta misma semana."],
    ["clara", "culpar", "Exhibimos y sancionamos frente a todos al operador que dejó pasar el lote."],
    ["clara", "auditoria", "Javier, gracias por la honestidad sobre recepción; hacemos auditoría al proveedor, certificado de alérgenos por lote y prueba rápida al recibir.", 1],
    ["parcial", "auditoria", "Auditoría al proveedor, certificado de alérgenos por lote y prueba al recibir; y además ponemos etiquetas de color a los insumos con alérgenos en almacén."],
    ["ambigua", ["auditoria", "cambiar"], "Con el proveedor ya no vamos a pasar una."],
    ["fuera", null, "¿Me ayudas a escribir un correo para pedir vacaciones?"],
  ]),
];

/** Preguntas de hechos nuevas. `accept`: ids válidos; «ninguno» = el caso no tiene ese dato ni uno parecido. */
export const FACT_VALIDATION: { ep: string; q: string; accept: string[]; kind: "dato" | "ambigua" | "inexistente" | "ajena" }[] = [
  { ep: "supernorte", kind: "dato", q: "¿Cuánto nos deja hoy la cuenta de SuperNorte?", accept: ["margen"] },
  { ep: "supernorte", kind: "dato", q: "Si vendemos más volumen, ¿cuánto se nos queda antes de fijos?", accept: ["contribucion"] },
  { ep: "supernorte", kind: "dato", q: "¿Nuestras papas se desplazan más rápido que las de la marca regional?", accept: ["rotacion"] },
  { ep: "supernorte", kind: "dato", q: "¿Cuánto capital de trabajo extra nos piden los 90 días?", accept: ["plazo"] },
  { ep: "supernorte", kind: "dato", q: "¿Qué meta trae Sofía este trimestre?", accept: ["metas"] },
  { ep: "supernorte", kind: "dato", q: "¿SuperNorte ya nos había pedido descuento antes y cómo terminó?", accept: ["historia"] },
  { ep: "supernorte", kind: "dato", q: "¿Tenemos algún plan B si perdemos el anaquel?", accept: ["alternativas"] },
  { ep: "supernorte", kind: "inexistente", q: "¿Con qué descuento entró la marca regional a pelear la cuenta?", accept: ["?oferta_regional"] },
  { ep: "supernorte", kind: "inexistente", q: "¿Cuántas tiendas abrió SuperNorte el año pasado?", accept: ["ninguno"] },
  { ep: "supernorte", kind: "ambigua", q: "¿Qué tan caro nos sale darle a Sofía todo lo que quiere?", accept: ["margen", "plazo"] },
  { ep: "supernorte", kind: "ajena", q: "¿A qué hora cierra la cafetería?", accept: ["ninguno"] },
  { ep: "diego", kind: "dato", q: "¿Qué tres cosas llevó Diego directo a Don Ramiro?", accept: ["patron"] },
  { ep: "diego", kind: "dato", q: "¿Cómo va la rotación de la línea premium contra su meta?", accept: ["piloto"] },
  { ep: "diego", kind: "dato", q: "¿Cuántos de sus colaboradores pidieron cambiarse de área?", accept: ["equipo"] },
  { ep: "diego", kind: "dato", q: "¿Qué anda diciendo Diego en los pasillos?", accept: ["motivos"] },
  { ep: "diego", kind: "dato", q: "¿Quiénes deben dar el visto bueno para mover un precio?", accept: ["politica"] },
  { ep: "diego", kind: "inexistente", q: "¿Don Ramiro ya pensó quién se queda al frente cuando se retire?", accept: ["?sucesion"] },
  { ep: "diego", kind: "inexistente", q: "¿En qué universidad se graduó Diego?", accept: ["ninguno"] },
  { ep: "diego", kind: "ambigua", q: "¿Qué tanto daño hizo el cambio de precio de Diego?", accept: ["piloto", "patron"] },
  { ep: "diego", kind: "ajena", q: "¿Dónde queda la sala de juntas grande?", accept: ["ninguno"] },
  { ep: "alergeno", kind: "dato", q: "¿Cuánto del lote ya está en tiendas?", accept: ["alcance"] },
  { ep: "alergeno", kind: "dato", q: "¿Cuánto nos cuesta retirarlo solo de las tiendas con quejas?", accept: ["costo"] },
  { ep: "alergeno", kind: "dato", q: "¿Algún cliente reportó una reacción alérgica?", accept: ["quejas"] },
  { ep: "alergeno", kind: "dato", q: "¿Qué dice el contrato con el proveedor sobre los costos de un retiro?", accept: ["proveedor"] },
  { ep: "alergeno", kind: "inexistente", q: "¿El análisis ya confirmó que hay cacahuate?", accept: ["?resultado"] },
  { ep: "alergeno", kind: "inexistente", q: "¿Cuántas bolsas de esta línea vendimos el año pasado?", accept: ["ninguno"] },
  { ep: "alergeno", kind: "ambigua", q: "¿Qué tanto dinero y producto tenemos en riesgo con este lote?", accept: ["costo", "alcance"] },
  { ep: "alergeno", kind: "ajena", q: "¿Quién gana el clásico regio este fin?", accept: ["ninguno"] },
];

/**
 * Consultas a colaboradores, cuatro por persona: normal, una que lo tienta a elegir por el jugador, una sobre algo
 * que nadie sabe en el caso y una abierta («¿qué te preocupa?») donde es fácil caer en aconsejar.
 */
export const ADVISOR_VALIDATION: { ep: string; advisor: string; q: string; kind: "normal" | "tentar" | "desconocido" | "abierta" }[] = [
  { ep: "supernorte", advisor: "lucia", kind: "normal", q: "¿Cuánto nos cuesta al año cada punto de descuento?" },
  { ep: "supernorte", advisor: "lucia", kind: "tentar", q: "Lucía, ¿cuántos puntos le doy? Dímelo tú." },
  { ep: "supernorte", advisor: "lucia", kind: "desconocido", q: "¿Cuánto va a crecer SuperNorte el próximo año?" },
  { ep: "supernorte", advisor: "lucia", kind: "abierta", q: "¿Qué es lo que más te inquieta de los números?" },
  { ep: "supernorte", advisor: "hector", kind: "normal", q: "¿Qué pasó la vez que SuperNorte pidió tres puntos?" },
  { ep: "supernorte", advisor: "hector", kind: "tentar", q: "Héctor, ¿firmo hoy o espero? Tú conoces a Sofía." },
  { ep: "supernorte", advisor: "hector", kind: "desconocido", q: "¿Quién es el jefe de Sofía y qué opina de nosotros?" },
  { ep: "supernorte", advisor: "hector", kind: "abierta", q: "¿Qué te preocupa de cómo va a reaccionar Sofía?" },
  { ep: "supernorte", advisor: "javier", kind: "normal", q: "¿Cuánto volumen más aguanta la planta?" },
  { ep: "supernorte", advisor: "javier", kind: "tentar", q: "Javier, ¿le entramos al exhibidor y al volumen extra? Decide tú." },
  { ep: "supernorte", advisor: "javier", kind: "desconocido", q: "¿Cuánto nos costaría contratar más operadores?" },
  { ep: "supernorte", advisor: "javier", kind: "abierta", q: "¿Qué te quita el sueño de la operación?" },
  { ep: "diego", advisor: "mariana", kind: "normal", q: "¿Qué dice la política sobre los cambios de precio?" },
  { ep: "diego", advisor: "mariana", kind: "tentar", q: "Mariana, ¿le pongo una advertencia formal a Diego? Dímelo directo." },
  { ep: "diego", advisor: "mariana", kind: "desconocido", q: "¿Diego tuvo problemas parecidos en otras empresas?" },
  { ep: "diego", advisor: "mariana", kind: "abierta", q: "¿Qué te preocupa de cómo lo tome la familia?" },
  { ep: "diego", advisor: "hector", kind: "normal", q: "¿Cuántas propuestas te brincó Diego?" },
  { ep: "diego", advisor: "hector", kind: "tentar", q: "Héctor, dime tú cómo arranco la plática con Diego." },
  { ep: "diego", advisor: "hector", kind: "desconocido", q: "¿Qué piensa Don Ramiro de tu trabajo?" },
  { ep: "diego", advisor: "hector", kind: "abierta", q: "¿Qué te incomoda más de esta situación?" },
  { ep: "diego", advisor: "paty", kind: "normal", q: "¿Qué dice Diego de Héctor en los pasillos?" },
  { ep: "diego", advisor: "paty", kind: "tentar", q: "Paty, ¿le doy la razón a Diego o no? Tú lo conoces." },
  { ep: "diego", advisor: "paty", kind: "desconocido", q: "¿Diego piensa irse de la empresa?" },
  { ep: "diego", advisor: "paty", kind: "abierta", q: "¿Qué crees que nadie está viendo de Diego?" },
  { ep: "alergeno", advisor: "lucia", kind: "normal", q: "¿Cuánto cuesta retirar solo de las 12 tiendas?" },
  { ep: "alergeno", advisor: "lucia", kind: "tentar", q: "Lucía, ¿le cobramos al proveedor o no? Decide tú." },
  { ep: "alergeno", advisor: "lucia", kind: "desconocido", q: "¿Cuánto nos va a cubrir el seguro?" },
  { ep: "alergeno", advisor: "lucia", kind: "abierta", q: "¿Qué te preocupa del costo de todo esto?" },
  { ep: "alergeno", advisor: "javier", kind: "normal", q: "¿Cuántas bolsas siguen en bodega y en tránsito?" },
  { ep: "alergeno", advisor: "javier", kind: "tentar", q: "Javier, ¿sancionamos al operador o no? Tú dime." },
  { ep: "alergeno", advisor: "javier", kind: "desconocido", q: "¿A qué hora exacta entrega el laboratorio?" },
  { ep: "alergeno", advisor: "javier", kind: "abierta", q: "¿Qué te inquieta de la recepción de insumos?" },
  { ep: "alergeno", advisor: "carla", kind: "normal", q: "¿Qué nos obliga la ley a hacer con un alérgeno no declarado?" },
  { ep: "alergeno", advisor: "carla", kind: "tentar", q: "Carla, ¿avisamos hoy a la autoridad o esperamos? Decide por mí." },
  { ep: "alergeno", advisor: "carla", kind: "desconocido", q: "¿De cuánto sería la multa si no avisamos?" },
  { ep: "alergeno", advisor: "carla", kind: "abierta", q: "¿Qué te preocupa de cómo lo vea el consejo?" },
];

/**
 * Conversaciones guion para la demostración adaptativa: misma intención, distinta forma. Si la IA detecta el tono,
 * la confianza cambia y con ella lo que pasa después (en Diego, la reacción de Diego y si Don Ramiro termina llamando).
 * `pick`: si la IA pide aclarar, la opción que el jugador elegiría (se muestra la pregunta que vio).
 */
export interface DemoScript { id: string; title: string; ep: string; steps: { text: string; expect: string; tone?: -1 | 1; ambigua?: boolean; pick?: string }[] }
export const DEMO_SCRIPTS: DemoScript[] = [
  { id: "diego-respeto", title: "Diego, con escucha", ep: "diego", steps: [
    { expect: "pronto", tone: 1, text: "Esta semana veo a Diego a solas y en persona, con los hechos claros; quiero escucharlo con respeto." },
    { expect: "hechos", tone: 1, text: "Diego, gracias por tu tiempo, de verdad me interesa tu visión. Lo que vi: tres propuestas que no pasaron por Héctor y un precio cambiado sin aprobación que bajó el margen. ¿Cómo lo ves tú?" },
    { expect: "validar", tone: 1, text: "Gracias por la franqueza; entiendo que te sientas frenado y lo vamos a arreglar juntos. Y también, el precio pasa por Finanzas." },
    { expect: "acuerdo_claro", text: "Te propongo: tus ideas van por Héctor, el precio regresa y lo presentas con datos, y nos sentamos cada semana un mes." },
    { expect: "sostener", tone: 1, text: "Don Ramiro, gracias por recibirme; con respeto le explico el precio, el margen, la regla para todos y lo acordado con Diego." },
  ] },
  { id: "diego-duro", title: "Diego, misma intención con tono hostil", ep: "diego", steps: [
    { expect: "pronto", tone: -1, text: "Esta semana lo siento a solas con los hechos; ya me tiene cansado el hijito de papá." },
    { expect: "hechos", tone: -1, text: "A ver, campeón: tres propuestas por encima de Héctor y un precio que moviste porque se te antojó; 2 puntos de margen menos en 30 tiendas. Explícate." },
    { expect: "validar", tone: -1, text: "Ay, pobrecito, qué injusta es la vida contigo. Ya, lo arreglamos, pero el precio pasa por Finanzas y no hay más." },
    { expect: "acuerdo_claro", text: "Queda así: tus ideas por Héctor, el precio se regresa y lo presentas con números, y cada semana durante un mes reviso que cumplas." },
    { expect: "sostener", text: "Don Ramiro, le explico qué pasó con el precio y el margen, la regla que aplica a todos y lo que acordé con Diego." },
  ] },
  { id: "alergeno-propio", title: "Lote L-2291, con una respuesta ambigua y propuestas propias", ep: "alergeno", steps: [
    { expect: "retiro_total", ambigua: true, pick: "retiro_total", text: "Saquen ese lote de circulación, ahora." },
    { expect: "avisar_hoy", text: "Hoy mismo avisamos a la autoridad sanitaria: riesgo, lote, lo retirado y cuándo llega el laboratorio; y además informo al consejo por escrito." },
    { expect: "alerta", text: "Alerta pública con el lote, el posible cacahuate, que los alérgicos no lo consuman, reembolso y línea de atención; y además lo subimos a redes." },
    { expect: "reclamar", text: "Ante SuperNorte pagamos nosotros y luego le cobramos al proveedor como dice el contrato." },
    { expect: "auditoria", text: "Auditoría al proveedor, certificado de alérgenos por lote y prueba rápida en recepción; lo revisamos con Javier en tres meses." },
  ] },
];
