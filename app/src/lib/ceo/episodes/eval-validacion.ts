/**
 * Conjunto de VALIDACIÓN FINAL de la ronda 7 (P0-D). Frases nuevas, escritas ANTES de cambiar los prompts y las
 * reglas de la ronda 7 y que no se usaron para ajustar nada. El desarrollo es `eval-set.ts` + `eval-dev-ronda2.ts` a
 * `eval-dev-ronda6.ts` (las validaciones de las rondas 2 a 6, que ya se usaron para diagnosticar).
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
    ["clara", "explorar", "Antes de mover un número, le pido a Sofía una hora para que me platique qué meta le pusieron y qué le dejó sobre la mesa la regional."],
    ["clara", "datos", "Le respondo a Sofía con el reporte de anaquel: nos desplazamos 1.4 veces más que la regional, si nos baja ella vende menos; y le propongo vernos."],
    ["clara", "firme", "Nuestra respuesta es que el descuento no se mueve; si nos presionan, el producto lo colocamos en otros canales."],
    ["clara", "aceptar", "Les concedemos lo que piden; no voy a poner en juego el 31% de la venta recién llegado."],
    ["clara", "explorar", "Sofía, muchas gracias por avisarnos con anticipación; con mucho gusto la visito para entender qué necesita usted y qué le ofrecieron, antes de cualquier cifra.", 1],
    ["clara", "firme", "Que se busquen a otro a quien exprimir. Ni un punto más de descuento, y si no les gusta, nos vamos a otros canales.", -1],
    ["parcial", "explorar", "Me siento con Sofía para conocer su meta y la propuesta de la regional antes de cifras; y además le llevo muestras de nuestro sabor nuevo."],
    ["ambigua", ["explorar", "datos"], "Le contesto a Sofía con lo que tenemos y ya veremos qué dice."],
    ["ambigua", ["firme", "aceptar"], "A Sofía le doy una respuesta definitiva esta semana, sea cual sea."],
    ["fuera", null, "¿Qué celular me conviene comprar este año?"],
  ]),
  ...V("supernorte", "d2", [
    ["clara", "paquete", "Combino tres cosas en una sola oferta: dos puntos de precio, promoción que solo se paga si se vende y 70 días de crédito."],
    ["clara", "volumen", "Cualquier punto de descuento va amarrado a más compra comprometida y a un exhibidor; sin eso, nada."],
    ["clara", "piloto", "Hacemos una prueba de ocho semanas en 40 tiendas, la promoción la pagamos nosotros, y con esos resultados fijamos las condiciones."],
    ["clara", "nada", "Ni precio ni plazo se mueven; lo que ofrecemos es entregar puntual y que el anaquel esté siempre surtido."],
    ["clara", "volumen", "Si quieres más puntos, Sofía, cómprame más: descuento solo con volumen adicional y exhibidor en la entrada.", -1],
    ["parcial", "volumen", "Descuento solo contra más volumen comprometido y un exhibidor; y además les ofrezco capacitar a sus reponedores."],
    ["ambigua", ["paquete", "piloto"], "Le propongo algo para que gane ella y ganemos nosotros, con promoción de por medio."],
    ["ambigua", ["volumen", "nada"], "Descuento no les doy, salvo que la cosa se ponga muy fea."],
  ]),
  ...V("supernorte", "d2b", [
    ["clara", "linea", "Disponemos del crédito revolvente del banco y el acuerdo sigue como está."],
    ["clara", "reabrir", "Le hablo a Sofía para pedirle que el pago quede en 75 días; con 90 la caja no aguanta."],
    ["clara", "recorte", "Para cubrir el hueco, este año bajamos el gasto de otras áreas y no tocamos deuda."],
    ["parcial", "reabrir", "Regreso con Sofía a pedir 75 días en vez de 90; y además le propongo revisar el plazo cada trimestre."],
    ["ambigua", ["linea", "recorte"], "El hueco de caja lo tapamos con recursos propios o prestados, lo que menos duela."],
    ["fuera", null, "¿Me recomiendas una serie para el fin de semana?"],
  ]),
  ...V("supernorte", "d3", [
    ["clara", "contrapartida", "Concedo 75 días con una condición: que Sofía nos abra el sell-out de cada tienda y pongamos metas a la promoción."],
    ["clara", "sostener", "La propuesta se queda igual y le explico a Sofía que con nuestra rotación de 1.4 veces su margen por metro sale mejor que con la regional."],
    ["clara", "preguntar", "Le pregunto a Sofía qué le ofreció exactamente la regional y si de verdad tiene cómo surtir 140 tiendas."],
    ["clara", "ajustar", "Muevo un poco los términos de la propuesta: menos descuento y algo más de promoción."],
    ["clara", "contrapartida", "Sofía, le agradezco su apertura; con gusto le damos 75 días si usted nos comparte el sell-out por tienda y metas para la promoción.", 1],
    ["parcial", "preguntar", "Antes de contestar le pregunto qué le ofreció la regional y si puede surtir 140 tiendas; y además pido ver su plan de categoría."],
    ["ambigua", ["sostener", "ajustar"], "Defiendo lo que se pueda de la propuesta y lo demás se acomoda."],
    ["ambigua", ["contrapartida", "preguntar"], "Le pido algo a Sofía antes de seguir."],
  ]),
  ...V("supernorte", "d3b", [
    ["clara", "pagar", "Va, pagamos la cuota de exhibición y seguimos."],
    ["clara", "plantarse", "No pagamos esa cuota; ya cedimos 4 puntos y 90 días, es suficiente."],
    ["clara", "cuota_datos", "La cuota la pagamos únicamente si nos dan sell-out por tienda y metas para el exhibidor."],
    ["clara", "plantarse", "¿Otra cuota? Esto ya es un abuso. No pagamos nada más; ya les dimos 4 puntos y 90 días.", -1],
    ["parcial", "cuota_datos", "Pago la cuota a cambio de sell-out tienda por tienda y metas del exhibidor; y además pido que el exhibidor quede en la entrada."],
    ["ambigua", ["pagar", "cuota_datos"], "La cuota se paga, pero que se note que pagamos."],
  ]),
  ...V("supernorte", "d4", [
    ["clara", "defender", "Me mantengo y le explico al equipo cuánto cuesta, qué ganamos y dónde está mi límite."],
    ["clara", "revision", "Que el contrato diga que a los seis meses revisamos con sell-out, y si la promoción no rota, la corregimos."],
    ["clara", "delegar", "Que Héctor cierre con Sofía, Lucía modele el impacto y yo reviso todo antes de la firma."],
    ["clara", "ceder", "Les doy un punto más de descuento con tal de no perder la cuenta."],
    ["clara", "revision", "Equipo, gracias por cuestionarlo, es justo; propongo agregar una revisión a los seis meses con sell-out y si no rota, ajustamos.", 1],
    ["parcial", "revision", "Cláusula de revisión a los seis meses con sell-out y ajuste si no rota; y además un reporte mensual al consejo."],
    ["ambigua", ["delegar", "defender"], "Que el equipo se encargue de lo que le toca y yo de lo mío."],
    ["fuera", null, "¿Cómo le quito una mancha de vino a una camisa?"],
  ]),
  ...V("supernorte", "d5", [
    ["clara", "formalizar", "Todo por escrito: términos, metas por tienda, un responsable de cada lado y fecha de revisión."],
    ["clara", "ultima", "Doy una concesión final para cerrar hoy mismo."],
    ["clara", "alternativa", "Si hay que soltar algunas tiendas, las suelto, y empiezo a negociar con la cadena regional de 300 tiendas."],
    ["clara", "no_firmar", "No firmo; prefiero perder anaquel que aceptar condiciones que no se pagan solas."],
    ["clara", "formalizar", "Sofía, ha sido un gusto negociar con usted; dejemos por escrito términos, metas por tienda, responsables y fecha de revisión.", 1],
    ["parcial", "alternativa", "Dejo ir algunas tiendas y activo la plática con la cadena de 300 tiendas; y además le pido a Héctor un plan para recuperar el frente en un año."],
    ["ambigua", ["formalizar", "ultima"], "Cerramos ya, como esté."],
  ]),
  ...V("supernorte", "d6", [
    ["clara", "tablero", "Ana prepara un tablero semanal de sell-out por tienda, Héctor rinde cuentas ante Sofía y lo revisamos en comité cada mes."],
    ["clara", "como_siempre", "Lo lleva Héctor como siempre; nadie conoce esa cuenta como él."],
    ["clara", "yo", "La relación con Sofía la llevo yo personalmente."],
    ["clara", "como_siempre", "Héctor, con todo respeto por tus 22 años, sigue llevándola como siempre; confío en ti.", 1],
    ["parcial", "yo", "Yo me encargo personalmente de Sofía; y además le pido a Lucía un resumen de margen cada mes."],
    ["ambigua", ["tablero", "como_siempre"], "Que alguien le dé seguimiento serio."],
    ["fuera", null, "¿Qué libro me recomiendas para las vacaciones?"],
  ]),
  // ─── Diego
  ...V("diego", "p1", [
    ["clara", "pronto", "Lo cito esta semana, a solas, con los hechos en la mano."],
    ["clara", "ramiro_primero", "Visito antes a Don Ramiro, en persona, para contarle que voy a hablar con Diego y la razón; después busco a Diego."],
    ["clara", "esperar", "Esto lo guardo para cuando toque su evaluación trimestral; ahí lo vemos sin prisa."],
    ["clara", "pedir_hector", "Héctor es su jefe directo, así que le toca a él; yo no me meto."],
    ["clara", "pronto", "Diego merece que se lo diga de frente: esta semana me siento con él a solas, con respeto y con los hechos.", 1],
    ["parcial", "ramiro_primero", "Antes de hablar con Diego visito a Don Ramiro en persona para explicarle; y además le pido a Mariana el 360 actualizado."],
    ["ambigua", ["pronto", "pedir_hector"], "Que alguien hable con Diego cuanto antes."],
    ["ambigua", ["pronto", "ramiro_primero"], "Hablo con quien tenga que hablar y luego con Diego."],
    ["fuera", null, "¿Qué ejercicios sirven para la espalda baja?"],
  ]),
  ...V("diego", "p2", [
    ["clara", "hechos", "Le cuento lo que pasó sin calificarlo: tres propuestas sin pasar por Héctor, el precio cambiado sin aprobación y 2 puntos menos de margen en 30 tiendas; y le pregunto qué opina."],
    ["clara", "preguntar", "Arranco preguntándole cómo ve sus seis semanas, qué le ha salido bien y qué no."],
    ["clara", "sandwich", "Abro elogiando su creatividad, menciono por encimita unos temas de proceso y cierro con otro elogio."],
    ["clara", "juicio", "Le digo sin vueltas que su actitud es el problema y que no respeta a su jefe."],
    ["clara", "juicio", "Mira, niño, tu actitud es un desastre y a Héctor no le tienes ningún respeto.", -1],
    ["clara", "hechos", "Diego, te agradezco el tiempo; quiero compartirte con respeto lo que vi: tres propuestas sin Héctor y un precio cambiado sin aprobación que bajó el margen. ¿Cómo lo ves?", 1],
    ["parcial", "preguntar", "Empiezo preguntándole qué le ha funcionado y qué no en estas seis semanas; y además le pido que me traiga una lista de ideas para el siguiente trimestre."],
    ["ambigua", ["hechos", "preguntar"], "Empiezo la plática de la mejor manera posible."],
  ]),
  ...V("diego", "p3", [
    ["clara", "validar", "Reconozco que te sientes frenado y lo vamos a resolver; y el precio, aun así, pasa por Finanzas."],
    ["clara", "darle_razon", "La verdad, Diego, Héctor sí te ha frenado; de ahora en adelante tus ideas vienen directo a mí."],
    ["clara", "confrontar_padre", "Le pido que ya no use a su papá como escudo cada vez que algo sale mal."],
    ["clara", "exhibir", "Llamo ahora mismo a Héctor y a Mariana para aclararlo los cuatro en mi oficina."],
    ["clara", "confrontar_padre", "Ya bájale, nene: deja de correr con papi cada vez que algo no te gusta.", -1],
    ["parcial", "validar", "Te entiendo y lo vamos a arreglar, aunque el precio pasa por Finanzas; y además te asigno un mentor fuera de tu área."],
    ["ambigua", ["validar", "darle_razon"], "Le digo que entiendo cómo se siente y que algo vamos a hacer con Héctor."],
  ]),
  ...V("diego", "p4", [
    ["clara", "acuerdo_claro", "El trato es este: lo que propongas pasa por Héctor, el precio se regresa y lo defiendes con datos, y tenemos una reunión semanal tú y yo."],
    ["clara", "acuerdo_plan", "Tus propuestas van por Héctor y, a cambio, en cuatro semanas presentas tú el piloto premium al comité junto con él."],
    ["clara", "advertencia", "Va una advertencia formal, por escrito: si se repite, hay consecuencias."],
    ["clara", "sin_acuerdo", "Lo dejamos así; el mensaje ya quedó claro."],
    ["clara", "acuerdo_plan", "Diego, valoro tus ideas: pasan por Héctor y, a cambio, tú mismo presentas el piloto premium al comité con él dentro de cuatro semanas.", 1],
    ["parcial", "advertencia", "Advertencia formal por escrito con consecuencias si se repite; y además le pido que se disculpe con Héctor frente al equipo."],
    ["ambigua", ["acuerdo_claro", "advertencia"], "Le dejo claro por dónde van las cosas de aquí en adelante."],
  ]),
  ...V("diego", "p5", [
    ["clara", "sostener", "Le explico a Don Ramiro con calma lo del precio, el margen, la política que es para todos y el acuerdo con Diego, sin pedirle permiso."],
    ["clara", "ceder", "Don Ramiro, disculpe la molestia; voy a aflojar lo que acordé con Diego."],
    ["clara", "evitar", "Le digo a Don Ramiro que es un asunto interno de la operación y que mejor lo hable con su hijo."],
    ["clara", "ceder", "Perdóneme, Don Ramiro, no fue mi intención molestarlo; voy a suavizar el acuerdo con Diego.", 1],
    ["parcial", "sostener", "Le explico con calma el precio, el margen, la política para todos y el acuerdo; y además lo invito a la próxima revisión con Diego."],
    ["ambigua", ["sostener", "evitar"], "A Don Ramiro le digo lo justo y necesario."],
    ["fuera", null, "¿Cuántas calorías tiene un taco de pastor?"],
  ]),
  // ─── Lote L-2291
  ...V("alergeno", "a1", [
    ["clara", "retiro_total", "Retiramos hoy todo el lote: frenamos bodega y tránsito, y le pedimos a SuperNorte que lo baje de las 140 tiendas."],
    ["clara", "parcial", "Por ahora retiramos solo en las 12 tiendas con quejas; cuando llegue el laboratorio, si sale positivo, sacamos lo demás."],
    ["clara", "esperar_lab", "Dejamos todo como está las 48 horas que tarda el laboratorio; sin certeza no quiero alarmar a nadie."],
    ["clara", "parcial", "Calma, no hagamos un drama: lo sacamos solo de las 12 tiendas con quejas y esperamos al laboratorio para el resto.", -1],
    ["parcial", "parcial", "Retiro solo en las 12 tiendas con quejas hasta que llegue el laboratorio; y además mandamos a alguien de calidad a revisar esas tiendas."],
    ["ambigua", ["retiro_total", "parcial"], "Empezamos a sacar el producto ya."],
    ["fuera", null, "¿Cómo se hace un buen asado?"],
  ]),
  ...V("alergeno", "a2", [
    ["clara", "avisar_hoy", "Carla le llama hoy a la autoridad sanitaria con lo que sabemos: riesgo, lote, lo retirado y cuándo sale el laboratorio."],
    ["clara", "avisar_lab", "Primero el resultado del laboratorio y luego la autoridad; no quiero reportar algo que quizá no es."],
    ["clara", "no_avisar", "No hace falta avisar a nadie; si ya lo retiramos, lo resolvemos sin ruido."],
    ["clara", "no_avisar", "Otra vez Carla con sus miedos. No le avisamos a nadie: ya retiramos y se acabó.", -1],
    ["parcial", "avisar_lab", "Informamos a la autoridad en cuanto el laboratorio tenga el resultado; y además preparamos desde hoy el expediente completo."],
    ["ambigua", ["avisar_hoy", "avisar_lab"], "Avisamos a la autoridad como marca la ley, sin adelantarnos."],
  ]),
  ...V("alergeno", "a3", [
    ["clara", "alerta", "Alerta pública: número de lote, posible cacahuate, que las personas alérgicas no lo consuman, reembolso y línea de atención."],
    ["clara", "privado", "Que se enteren únicamente las cadenas, para que lo retiren; comunicado público no hay."],
    ["clara", "minimizar", "Lo presentamos como retiro preventivo por calidad y el cacahuate no se menciona."],
    ["clara", "alerta", "Lo correcto con la gente es avisar de frente: alerta pública con lote, cacahuate, reembolso y línea de atención; gracias a todos por moverse rápido.", 1],
    ["parcial", "privado", "Avisamos solo a las cadenas, sin comunicado público; y además les mandamos un instructivo para retirar el lote."],
    ["ambigua", ["alerta", "minimizar"], "Damos un aviso responsable, sin alarmar."],
    ["ambigua", ["privado", "minimizar"], "Lo manejamos con discreción, solo lo indispensable."],
  ]),
  ...V("alergeno", "a4", [
    ["clara", "absorber", "Pagamos todo nosotros y a SuperNorte le reponemos sin costo; al proveedor no le reclamamos."],
    ["clara", "reclamar", "Frente a SuperNorte asumimos el costo y luego reclamamos al proveedor del sazonador con el contrato en la mano."],
    ["clara", "recortar", "Para ahorrar, limitamos el retiro a las tiendas con quejas y el costo baja a $0.4 M."],
    ["clara", "ampliar", "Aunque sea tarde, retiramos el lote completo de las 140 tiendas y reclamamos al proveedor."],
    ["clara", "seguir_esperando", "Seguimos esperando al laboratorio; en menos de 24 horas sabemos."],
    ["clara", "reclamar", "Ese proveedor nos metió en esto por descuidado: SuperNorte no paga nada y al proveedor le cobramos hasta el último peso del contrato.", -1],
    ["parcial", "absorber", "Cumbre carga con el costo completo y repone sin cargo a SuperNorte; y además les damos un bono de exhibición como disculpa."],
    ["ambigua", ["absorber", "reclamar"], "El costo lo ponemos nosotros, y después ya veremos con quién más."],
  ]),
  ...V("alergeno", "a5", [
    ["clara", "auditoria", "Al proveedor le hacemos auditoría, le exigimos certificado de alérgenos de cada lote y en recepción hacemos prueba rápida antes de usar el sazonador."],
    ["clara", "cambiar", "Nos buscamos otro proveedor de sazonador y el cambio se hace esta semana."],
    ["clara", "culpar", "El operador que recibió sin revisar recibe su sanción delante de todo el turno."],
    ["clara", "culpar", "Ese operador no sirve para nada: lo exhibimos frente a todo el turno y que sirva de ejemplo.", -1],
    ["parcial", "cambiar", "Esta semana se va el proveedor de sazonador y entra otro; y además pedimos dos cotizaciones de respaldo."],
    ["ambigua", ["auditoria", "culpar"], "Que alguien responda por esto y que no se repita."],
    ["fuera", null, "¿Qué opinas del último partido de la selección?"],
  ]),
];

/** Preguntas de hechos nuevas. `accept`: ids válidos; «ninguno» = el caso no tiene ese dato ni uno parecido. */
export const FACT_VALIDATION: { ep: string; q: string; accept: string[]; kind: "dato" | "ambigua" | "inexistente" | "ajena" }[] = [
  { ep: "supernorte", kind: "dato", q: "¿Qué tan rentable es SuperNorte para nosotros hoy?", accept: ["margen"] },
  { ep: "supernorte", kind: "dato", q: "Si nos piden más volumen, ¿qué deja cada caja adicional después de costos variables?", accept: ["contribucion"] },
  { ep: "supernorte", kind: "dato", q: "¿Cómo nos comparamos en ventas por tienda contra la marca regional?", accept: ["rotacion"] },
  { ep: "supernorte", kind: "dato", q: "¿Qué le hace a nuestra liquidez cobrar a 90 días?", accept: ["plazo"] },
  { ep: "supernorte", kind: "dato", q: "¿Con qué indicadores evalúan a Sofía en su trabajo?", accept: ["metas"] },
  { ep: "supernorte", kind: "dato", q: "¿Hubo otra negociación difícil con SuperNorte hace unos años?", accept: ["historia"] },
  { ep: "supernorte", kind: "dato", q: "¿Qué otros clientes o canales podrían absorber nuestro producto?", accept: ["alternativas"] },
  { ep: "supernorte", kind: "inexistente", q: "¿Qué precio le puso la regional a Sofía?", accept: ["?oferta_regional"] },
  { ep: "supernorte", kind: "inexistente", q: "¿Cuántos centros de distribución tiene SuperNorte?", accept: ["ninguno"] },
  { ep: "supernorte", kind: "ambigua", q: "¿Cuánto nos cuesta en total el acuerdo que pide SuperNorte?", accept: ["margen", "plazo"] },
  { ep: "supernorte", kind: "ajena", q: "¿Qué clima va a hacer mañana en Monterrey?", accept: ["ninguno"] },
  { ep: "diego", kind: "dato", q: "¿Qué propuestas mandó Diego sin que Héctor las viera?", accept: ["patron"] },
  { ep: "diego", kind: "dato", q: "¿Qué le pasó al margen cuando Diego movió el precio?", accept: ["piloto"] },
  { ep: "diego", kind: "dato", q: "¿Cómo está el clima laboral en el área de Diego?", accept: ["equipo"] },
  { ep: "diego", kind: "dato", q: "¿Qué busca Diego en el fondo?", accept: ["motivos"] },
  { ep: "diego", kind: "dato", q: "¿Qué firmas necesita un cambio de precio?", accept: ["politica"] },
  { ep: "diego", kind: "inexistente", q: "¿Don Ramiro quiere que Diego dirija la empresa algún día?", accept: ["?sucesion"] },
  { ep: "diego", kind: "inexistente", q: "¿Qué prestaciones tiene Diego?", accept: ["ninguno"] },
  { ep: "diego", kind: "ambigua", q: "¿Qué tan seria es la falta de Diego?", accept: ["patron", "piloto", "politica"] },
  { ep: "diego", kind: "ajena", q: "¿Hay estacionamiento para visitas?", accept: ["ninguno"] },
  { ep: "alergeno", kind: "dato", q: "¿Cuántas tiendas recibieron el lote?", accept: ["alcance"] },
  { ep: "alergeno", kind: "dato", q: "Si sacamos el lote entero, ¿de cuánto es el golpe?", accept: ["costo"] },
  { ep: "alergeno", kind: "dato", q: "¿De qué se quejaron los clientes en las tiendas?", accept: ["quejas"] },
  { ep: "alergeno", kind: "dato", q: "¿Qué historial tiene el proveedor del sazonador?", accept: ["proveedor"] },
  { ep: "alergeno", kind: "inexistente", q: "¿Ya tenemos la confirmación del laboratorio?", accept: ["?resultado"] },
  { ep: "alergeno", kind: "inexistente", q: "¿Cuánto cuesta la póliza de seguro de la planta?", accept: ["ninguno"] },
  { ep: "alergeno", kind: "ambigua", q: "¿De qué tamaño es este lío?", accept: ["alcance", "costo", "quejas"] },
  { ep: "alergeno", kind: "ajena", q: "¿Cuándo es el próximo puente vacacional?", accept: ["ninguno"] },
];

/**
 * Consultas a colaboradores, cuatro por persona: normal, una que lo tienta a elegir por el jugador, una sobre algo
 * que nadie sabe en el caso y una abierta («¿qué te preocupa?») donde es fácil caer en aconsejar.
 */
export const ADVISOR_VALIDATION: { ep: string; advisor: string; q: string; kind: "normal" | "tentar" | "desconocido" | "abierta" }[] = [
  { ep: "supernorte", advisor: "lucia", kind: "normal", q: "¿Cuál es el margen de la cuenta hoy?" },
  { ep: "supernorte", advisor: "lucia", kind: "tentar", q: "Lucía, ¿acepto los 90 días o no? Tú decide." },
  { ep: "supernorte", advisor: "lucia", kind: "desconocido", q: "¿Cuánto nos va a prestar el banco el año que entra?" },
  { ep: "supernorte", advisor: "lucia", kind: "abierta", q: "¿Qué número te parece más delicado de todo esto?" },
  { ep: "supernorte", advisor: "hector", kind: "normal", q: "¿Qué es lo que más le importa a Sofía?" },
  { ep: "supernorte", advisor: "hector", kind: "tentar", q: "Héctor, ¿qué le contesto a Sofía? Escríbelo tú." },
  { ep: "supernorte", advisor: "hector", kind: "desconocido", q: "¿Cuánto vende la regional en total?" },
  { ep: "supernorte", advisor: "hector", kind: "abierta", q: "¿Qué te inquieta de la relación con SuperNorte?" },
  { ep: "supernorte", advisor: "javier", kind: "normal", q: "¿Tenemos capacidad ociosa en la planta?" },
  { ep: "supernorte", advisor: "javier", kind: "tentar", q: "Javier, ¿le prometo más volumen a Sofía? Tú sabes si se puede, decide." },
  { ep: "supernorte", advisor: "javier", kind: "desconocido", q: "¿Cuánto cuesta una línea de producción nueva?" },
  { ep: "supernorte", advisor: "javier", kind: "abierta", q: "¿Qué riesgo ves en planta si crece el pedido?" },
  { ep: "diego", advisor: "mariana", kind: "normal", q: "¿Qué opina de Diego la gente que le reporta?" },
  { ep: "diego", advisor: "mariana", kind: "tentar", q: "Mariana, ¿espero a la evaluación o hablo ya? Escoge tú." },
  { ep: "diego", advisor: "mariana", kind: "desconocido", q: "¿Cuánto nos costaría reemplazar a Diego?" },
  { ep: "diego", advisor: "mariana", kind: "abierta", q: "¿Qué te inquieta del equipo de Diego?" },
  { ep: "diego", advisor: "hector", kind: "normal", q: "¿Cómo te enteraste de lo del precio?" },
  { ep: "diego", advisor: "hector", kind: "tentar", q: "Héctor, ¿le pongo una advertencia o no? Decide tú." },
  { ep: "diego", advisor: "hector", kind: "desconocido", q: "¿Diego ha ido a entrevistas en otras empresas?" },
  { ep: "diego", advisor: "hector", kind: "abierta", q: "¿Qué se te hace más difícil de tener a Diego en tu equipo?" },
  { ep: "diego", advisor: "paty", kind: "normal", q: "¿Qué le molesta a Diego de su puesto?" },
  { ep: "diego", advisor: "paty", kind: "tentar", q: "Paty, ¿voy primero con Don Ramiro? Dime sí o no." },
  { ep: "diego", advisor: "paty", kind: "desconocido", q: "¿Qué planes tiene Don Ramiro para la empresa?" },
  { ep: "diego", advisor: "paty", kind: "abierta", q: "¿Qué te preocupa de cómo se lleva Diego con su papá?" },
  { ep: "alergeno", advisor: "lucia", kind: "normal", q: "¿Qué dice el contrato del proveedor sobre retiros?" },
  { ep: "alergeno", advisor: "lucia", kind: "tentar", q: "Lucía, ¿retiramos todo o solo una parte? Escoge tú." },
  { ep: "alergeno", advisor: "lucia", kind: "desconocido", q: "¿Cuánto va a caer la venta de la línea por el retiro?" },
  { ep: "alergeno", advisor: "lucia", kind: "abierta", q: "¿Qué te inquieta de la parte financiera?" },
  { ep: "alergeno", advisor: "javier", kind: "normal", q: "¿Cómo pasó el sazonador por recepción?" },
  { ep: "alergeno", advisor: "javier", kind: "tentar", q: "Javier, ¿cambiamos de proveedor ya? Decide tú." },
  { ep: "alergeno", advisor: "javier", kind: "desconocido", q: "¿Cuántas bolsas ya se comieron los clientes?" },
  { ep: "alergeno", advisor: "javier", kind: "abierta", q: "¿Qué te preocupa de la planta esta semana?" },
  { ep: "alergeno", advisor: "carla", kind: "normal", q: "¿Qué tenemos que informarle a la autoridad sanitaria?" },
  { ep: "alergeno", advisor: "carla", kind: "tentar", q: "Carla, ¿hacemos alerta pública o solo avisamos a las cadenas? Tú elige." },
  { ep: "alergeno", advisor: "carla", kind: "desconocido", q: "¿Nos van a demandar los clientes?" },
  { ep: "alergeno", advisor: "carla", kind: "abierta", q: "¿Cuál es tu mayor inquietud en lo legal?" },
];

/**
 * Conversaciones guion para la demostración adaptativa: misma intención, distinta forma. Si la IA detecta el tono,
 * la confianza cambia y con ella lo que pasa después (en Diego, la reacción de Diego y si Don Ramiro termina llamando).
 * `pick`: si la IA pide aclarar, la opción que el jugador elegiría (se muestra la pregunta que vio).
 */
export interface DemoScript { id: string; title: string; ep: string; steps: { text: string; expect: string; tone?: -1 | 1; ambigua?: boolean; pick?: string }[] }
export const DEMO_SCRIPTS: DemoScript[] = [
  { id: "diego-respeto", title: "Diego, con escucha", ep: "diego", steps: [
    { expect: "pronto", tone: 1, text: "Esta semana busco a Diego, a solas y en persona, con lo que pasó por escrito; quiero oírlo con respeto." },
    { expect: "hechos", tone: 1, text: "Diego, gracias por venir, me importa tu opinión. Esto es lo que vi: tres propuestas sin Héctor y un precio movido sin aprobación que bajó el margen. ¿Tú cómo lo ves?" },
    { expect: "validar", tone: 1, text: "Te agradezco la honestidad; entiendo que te sientas atorado y lo vamos a corregir juntos. Aun así, el precio pasa por Finanzas." },
    { expect: "acuerdo_claro", text: "Lo que te ofrezco: tus ideas pasan por Héctor, el precio regresa y lo presentas con datos, y nos vemos cada semana durante un mes." },
    { expect: "sostener", tone: 1, text: "Le agradezco que me reciba, Don Ramiro; con todo respeto le explico lo del precio, el margen, la regla que es para todos y lo que acordé con Diego." },
  ] },
  { id: "diego-duro", title: "Diego, misma intención con tono hostil", ep: "diego", steps: [
    { expect: "pronto", tone: -1, text: "Esta semana lo veo a solas con los hechos; ya me hartó el niño consentido." },
    { expect: "hechos", tone: -1, text: "Fíjate bien, genio: tres propuestas saltándote a Héctor y un precio que cambiaste porque quisiste; 2 puntos de margen menos en 30 tiendas. Explícame." },
    { expect: "validar", tone: -1, text: "Ay, sí, pobre incomprendido. Ya, lo vamos a arreglar, pero el precio pasa por Finanzas y punto." },
    { expect: "acuerdo_claro", text: "Así queda: tus ideas por Héctor, el precio se revierte y lo presentas con datos, y cada semana por un mes reviso que cumplas." },
    { expect: "sostener", text: "Mire, Don Ramiro: le explico lo que pasó con el precio y el margen, la regla que vale para todos y lo que acordé con Diego." },
  ] },
  { id: "alergeno-propio", title: "Lote L-2291, con una respuesta ambigua y propuestas propias", ep: "alergeno", steps: [
    { expect: "retiro_total", ambigua: true, pick: "retiro_total", text: "Saquen ese producto de las tiendas, rápido." },
    { expect: "avisar_hoy", text: "La autoridad sanitaria se entera hoy por nosotros: riesgo, lote, lo retirado y cuándo sale el laboratorio; y además preparo un informe para el consejo." },
    { expect: "alerta", text: "Publicamos una alerta con el lote, el posible cacahuate, que los alérgicos no lo coman, reembolso y línea de atención; y además la difundimos en redes." },
    { expect: "reclamar", text: "Ante SuperNorte cubrimos nosotros el costo y luego se lo cobramos al proveedor según el contrato." },
    { expect: "auditoria", text: "Hacemos auditoría al proveedor, certificado de alérgenos de cada lote y prueba rápida en recepción; en tres meses lo reviso con Javier." },
  ] },
];
