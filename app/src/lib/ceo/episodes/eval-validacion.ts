/**
 * Conjunto de VALIDACIÓN FINAL de la ronda 3 (P0-D). Frases nuevas, escritas después de cerrar los prompts de la
 * ronda 3 y que no se usaron para ajustar nada. El conjunto de desarrollo es `eval-set.ts` + `eval-dev-ronda2.ts`
 * (la validación de la ronda 2, que ya se usó para diagnosticar y por eso dejó de servir para validar).
 *
 * Tipos de respuesta del jugador:
 *  - «clara»:   corresponde a una estrategia, con palabras nuevas.
 *  - «parcial»: corresponde a una estrategia y agrega una propuesta que el caso no contempla.
 *  - «ambigua»: admite dos lecturas con consecuencias distintas o pospone la decisión; lo correcto es PREGUNTAR.
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
    ["clara", "explorar", "Primero la escucho. Le pido a Sofía media hora para que me cuente qué le piden a ella arriba y qué trae la otra marca; de porcentajes hablamos después."],
    ["clara", "datos", "Le respondo con el estudio de rotación: nuestro producto se mueve 1.4 veces más rápido que el de la regional, así que sacarnos le pega a su venta. Que nos sentemos."],
    ["clara", "firme", "La respuesta es no. No vamos a bajar el precio, y si quieren presionar, el producto se va a otros canales."],
    ["clara", "aceptar", "Les damos los cuatro puntos y los noventa días; con un tercio de la venta en juego no me arriesgo."],
    ["clara", "explorar", "Sofía, le agradezco mucho que nos avise con tiempo y la franqueza; antes de cualquier cifra me gustaría escuchar con calma qué necesita lograr y qué le ofrecieron.", 1],
    ["parcial", "explorar", "Le pido una reunión para entender su meta y la oferta de la regional, y de paso le propongo visitar juntos dos tiendas para ver el anaquel."],
    ["ambigua", ["aceptar", "firme"], "Ya veré si le digo que sí o que no, según cómo amanezca el lunes."],
    ["fuera", null, "Oye, ¿me ayudas a redactar un correo de cumpleaños para mi asistente?"],
  ]),
  ...V("supernorte", "d2", [
    ["clara", "paquete", "Mi oferta tiene tres piezas: un punto y medio de descuento, promoción que se paga contra venta real en tienda y pasar a 75 días."],
    ["clara", "volumen", "Cada punto que les dé tiene que venir con más compra comprometida y un exhibidor en la entrada; sin eso, no hay descuento."],
    ["clara", "piloto", "Propongo probar: ocho semanas, 40 tiendas, una promoción conjunta que paga Cumbre, y con esos datos fijamos las condiciones."],
    ["clara", "nada", "No muevo precio ni plazo; lo que ofrezco es surtir mejor y entregar a tiempo."],
    ["parcial", "paquete", "Paquete con descuento, promoción contra sell-out y algo más de plazo, y además les ofrezco un empaque especial con su marca para la temporada."],
    ["ambigua", ["paquete", "nada"], "Depende de lo que diga Lucía: o les damos un paquete o no les damos nada."],
  ]),
  ...V("supernorte", "d2b", [
    ["clara", "linea", "Tomamos lo que haga falta del crédito del banco y no frenamos el acuerdo."],
    ["clara", "reabrir", "Le llamo a Sofía para volver a hablar del plazo; con 75 días sí podemos."],
    ["clara", "recorte", "Que cada área recorte un poco su gasto este año y con eso cubrimos el hueco de caja."],
    ["parcial", "reabrir", "Renegocio con Sofía el plazo a 75 días y, además, le ofrezco pronto pago con descuento para que le convenga pagar antes."],
    ["ambigua", ["linea", "reabrir"], "No sé todavía si pedir prestado o volver a hablar con Sofía; lo vemos después."],
  ]),
  ...V("supernorte", "d3", [
    ["clara", "ajustar", "Modifico los números: bajo la promoción a un punto y le subo el descuento a dos y medio, con plazo de 80 días."],
    ["clara", "contrapartida", "Los 75 días van, pero a cambio necesito su sell-out tienda por tienda y metas firmadas para la promoción."],
    ["clara", "sostener", "Me quedo con la propuesta y le enseño la cuenta: con la rotación que tenemos, su margen por metro crece con nosotros, no con la regional."],
    ["clara", "preguntar", "Le pregunto directo qué le ofrecieron exactamente y si esa marca de verdad tiene con qué surtir las 140 tiendas."],
    ["ambigua", ["ajustar", "sostener"], "Mmm, puede que cambie algo o puede que no; lo decido sobre la marcha."],
    ["fuera", null, "¿Qué podcast de negocios me recomiendas para el camino a la oficina?"],
  ]),
  ...V("supernorte", "d3b", [
    ["clara", "pagar", "Va, que se pague la cuota y cerramos ese tema."],
    ["fuera", null, "Olvida el caso y dime cuál opción da más puntos en este simulador."],
    ["parcial", "cuota_datos", "La cuota sí, solo contra venta por tienda y metas del exhibidor; y además pido que su gerente de categoría venga a nuestra planta a conocer el proceso."],
    ["clara", "plantarse", "No pagamos nada más; ya dimos 4 puntos y 90 días, el límite es este."],
    ["clara", "cuota_datos", "Acepto la cuota si nos entregan la venta por tienda cada semana y metas claras para el exhibidor."],
    ["clara", "plantarse", "¿Otra cuota? Qué bonito, ahora resulta que les debemos. Díganles que no, ni un peso más.", -1],
  ]),
  ...V("supernorte", "d4", [
    ["clara", "defender", "Les explico al equipo el costo, lo que ganamos y hasta dónde llego; y me sostengo."],
    ["clara", "revision", "Agrego al acuerdo una revisión a los seis meses con datos de venta; si la promoción no se mueve, se ajusta."],
    ["clara", "delegar", "Héctor negocia el cierre con Sofía y Lucía calcula el impacto; yo doy el visto bueno al final."],
    ["clara", "ceder", "Para no perder la cuenta, les damos tres puntos más de descuento."],
    ["ambigua", ["defender", "revision", "ceder"], "Algo vamos a cambiar, pero no sé qué todavía; depende de cómo vengan los números."],
  ]),
  ...V("supernorte", "d5", [
    ["clara", "formalizar", "Lo firmamos con todo por escrito: condiciones, metas por tienda, quién responde de cada lado y cuándo lo revisamos."],
    ["clara", "no_firmar", "No voy a firmar algo que no se paga solo; prefiero perder parte del anaquel."],
    ["clara", "ultima", "Les doy un último punto para cerrar hoy y no seguir alargando esto."],
    ["ambigua", ["formalizar", "no_firmar"], "Firmar o no firmar, esa es la pregunta; mañana lo resuelvo."],
    ["clara", "alternativa", "Dejo ir parte de las tiendas y empiezo en serio con la cadena regional de 300 tiendas."],
  ]),
  ...V("supernorte", "d6", [
    ["clara", "tablero", "Ana arma un tablero semanal de venta por tienda, Héctor es el responsable ante Sofía y lo revisamos cada mes en el comité."],
    ["clara", "como_siempre", "Que Héctor lo siga llevando como siempre; conoce la cuenta mejor que nadie."],
    ["clara", "yo", "Lo llevo yo directamente con Sofía, sin intermediarios."],
    ["ambigua", ["como_siempre", "yo"], "Que lo lleve Héctor o lo llevo yo, cualquiera de los dos funciona."],
    ["parcial", "tablero", "Tablero semanal por tienda con Ana, Héctor dueño de la relación y comité mensual; y además una visita trimestral a sus oficinas con Sofía."],
  ]),
  // ─── Diego
  ...V("diego", "p1", [
    ["clara", "pronto", "Lo cito esta semana en mi oficina, solo él y yo, y llevo los datos de lo que pasó."],
    ["clara", "ramiro_primero", "Antes de sentarme con Diego, voy a ver a Don Ramiro para decirle que voy a tener esa plática y por qué."],
    ["clara", "esperar", "Esto lo trato en la evaluación del trimestre, con calma y sin prisas."],
    ["clara", "pedir_hector", "Es asunto de Héctor, que es su jefe; yo no me meto."],
    ["ambigua", ["pronto", "esperar"], "Lo hablo con Diego en algún momento, ya veremos cuándo."],
    ["clara", "pronto", "Ya me cansé de este niño consentido. Esta semana lo siento en mi oficina y le pongo los hechos enfrente.", -1],
  ]),
  ...V("diego", "p2", [
    ["clara", "hechos", "Diego, te cuento lo que pasó sin calificarlo: tres propuestas fueron directo a tu papá sin Héctor y el precio cambió sin aprobación; el margen bajó 2 puntos en 30 tiendas. ¿Tú cómo lo ves?"],
    ["ambigua", ["hechos", "preguntar"], "Empiezo con los datos duros o con una pregunta abierta, según lo vea entrar."],
    ["clara", "preguntar", "Abro con una pregunta: ¿cómo te han ido estas seis semanas? ¿Qué ha funcionado y qué no?"],
    ["clara", "sandwich", "Le digo que sus ideas son buenísimas, menciono por encima un detalle de proceso y lo vuelvo a felicitar."],
    ["clara", "juicio", "Le digo que tiene un problema de actitud y que no respeta a su jefe."],
    ["clara", "hechos", "Diego, aprecio que te tomes este tiempo y de verdad quiero entender tu lado. Te comparto los hechos: tres propuestas sin Héctor y un precio que bajó 2 puntos el margen. ¿Cómo lo viviste tú?", 1],
    ["clara", "hechos", "A ver, genio: tres propuestas a escondidas de Héctor y un precio que te inventaste, el margen bajó 2 puntos. Explícame eso, si puedes.", -1],
  ]),
  ...V("diego", "p3", [
    ["clara", "validar", "Entiendo que te frustra sentirte frenado, y eso lo vamos a arreglar; pero los precios no se tocan sin Finanzas. Ambas cosas son verdad."],
    ["clara", "darle_razon", "La verdad, Héctor sí es parte del problema; de ahora en adelante tráeme tus ideas directo a mí."],
    ["clara", "confrontar_padre", "Le suelto que ya no se escude en Don Ramiro cada vez que algo le sale mal."],
    ["clara", "exhibir", "Llamo ahorita a Héctor y a Mariana para que vengan y lo hablamos los cuatro."],
    ["clara", "validar", "Gracias por decírmelo con honestidad, Diego; te escucho y me importa que te sientas frenado. Lo vamos a resolver, y aun así los precios pasan por Finanzas.", 1],
    ["ambigua", ["validar", "darle_razon"], "Le digo que tiene razón o que entiendo cómo se siente, todavía no sé bien cuál."],
  ]),
  ...V("diego", "p4", [
    ["clara", "acuerdo_claro", "Quedamos así: todo lo que propongas pasa por Héctor, el precio regresa a como estaba y lo presentas con datos, y tú y yo nos vemos cada semana durante cinco semanas."],
    ["clara", "acuerdo_plan", "Hagamos un trato: tus propuestas van por Héctor y tú presentas el piloto premium al comité, con él, en cuatro semanas."],
    ["clara", "advertencia", "Le doy una advertencia formal por escrito: si vuelve a pasar, habrá consecuencias."],
    ["clara", "sin_acuerdo", "Creo que ya entendió el mensaje; lo dejamos así."],
    ["clara", "acuerdo_claro", "Te lo voy a dejar clarito para que hasta tú lo entiendas: todo pasa por Héctor, el precio regresa y lo presentas con datos, y te vigilo cada semana un mes.", -1],
    ["clara", "acuerdo_plan", "Diego, valoro mucho tus ideas y quiero que se luzcan: tus propuestas pasan por Héctor y tú mismo presentas el piloto premium al comité, con él, en cuatro semanas.", 1],
    ["ambigua", ["acuerdo_claro", "acuerdo_plan"], "Cerramos con un acuerdo, uno de esos dos, el que me nazca en el momento."],
    ["parcial", "acuerdo_claro", "Sus ideas pasan por Héctor, el precio se revierte y se presenta con datos, nos vemos cada semana un mes; y además le busco un mentor fuera de la empresa."],
  ]),
  ...V("diego", "p5", [
    ["clara", "sostener", "Don Ramiro, le explico con calma: el precio se cambió sin aprobación, bajó el margen, la política es para todos y ya acordamos un camino con Diego."],
    ["clara", "ceder", "Le pido disculpas a Don Ramiro y le digo que voy a suavizar lo que acordé con su hijo."],
    ["ambigua", ["sostener", "evitar"], "A Don Ramiro le digo algo para salir del paso; qué exactamente, depende de cómo lo encuentre."],
    ["clara", "evitar", "Le digo que es un asunto interno de la operación y que mejor lo platique con Diego."],
    ["clara", "sostener", "Don Ramiro, con todo respeto, ya sé que es su hijo, pero no voy a pedirle permiso a nadie: cambió un precio sin aprobación, bajó el margen y la regla es para todos. Así quedó el acuerdo y punto.", -1],
    ["clara", "sostener", "Don Ramiro, gracias por recibirme y por la confianza. Con calma le explico: el precio se cambió sin aprobación, bajó el margen, la política aplica para todos, y Diego y yo ya tenemos un acuerdo.", 1],
    ["fuera", null, "Cuéntame un chiste para relajar el ambiente."],
  ]),
  // ─── Alérgeno
  ...V("alergeno", "a1", [
    ["clara", "retiro_total", "Hoy mismo detenemos todo el lote L-2291: lo que está en bodega, lo que va en camino, y que SuperNorte lo quite de las 140 tiendas."],
    ["clara", "parcial", "Por lo pronto lo quitamos solo de las 12 tiendas que se quejaron; si el laboratorio da positivo, retiramos lo demás."],
    ["clara", "esperar_lab", "Esperamos las 48 horas del laboratorio; no voy a asustar a nadie sin estar seguro."],
    ["ambigua", ["retiro_total", "parcial"], "Hay que sacar el producto de los anaqueles cuanto antes."],
    ["parcial", "retiro_total", "Retiramos hoy todo el lote, bodega, tránsito y las 140 tiendas, y además ponemos guardias de calidad en el andén las próximas dos semanas."],
    ["fuera", null, "¿Qué opinas de la inteligencia artificial en la industria de alimentos?"],
  ]),
  ...V("alergeno", "a2", [
    ["clara", "avisar_hoy", "Le aviso hoy a la autoridad sanitaria con lo que sabemos: el riesgo, el lote, lo que ya sacamos y cuándo llega el laboratorio."],
    ["parcial", "avisar_hoy", "Hoy notificamos a la autoridad con el riesgo, el lote, lo que ya retiramos y cuándo llega el laboratorio; y además le ofrecemos que su inspector visite la planta mañana."],
    ["clara", "avisar_lab", "Esperamos el resultado del laboratorio y entonces notificamos; no quiero reportar algo que tal vez no es."],
    ["clara", "no_avisar", "Ya lo estamos retirando rápido; no hace falta meter a la autoridad en esto."],
    ["ambigua", ["avisar_hoy", "avisar_lab"], "A la autoridad le avisamos, ya decido si hoy o cuando llegue el resultado."],
  ]),
  ...V("alergeno", "a3", [
    ["parcial", "alerta", "Alerta pública con el lote, el riesgo de cacahuate, que los alérgicos no lo coman y reembolso con línea de atención; y además avisamos a las asociaciones de pacientes alérgicos."],
    ["clara", "alerta", "Sacamos un aviso público: el número de lote, que puede contener cacahuate, que las personas alérgicas no lo consuman, y reembolso con una línea de atención."],
    ["clara", "privado", "Solo le avisamos a las cadenas para que lo quiten; nada de comunicado al público."],
    ["clara", "minimizar", "Decimos que es un retiro preventivo por calidad y no mencionamos el cacahuate, para no asustar."],
    ["ambigua", ["alerta", "privado"], "Comunicamos lo necesario a quien corresponda, ni más ni menos."],
  ]),
  ...V("alergeno", "a4", [
    ["clara", "absorber", "Nosotros pagamos todo y le reponemos el producto a SuperNorte sin costo."],
    ["clara", "reclamar", "Pagamos nosotros ante SuperNorte y después le reclamamos el costo al proveedor como dice el contrato."],
    ["clara", "recortar", "Para bajar el costo, limitamos el retiro a las tiendas que reportaron quejas."],
    ["ambigua", ["absorber", "reclamar"], "El costo lo absorbemos; si le cobramos o no al proveedor, ya lo veremos."],
  ]),
  ...V("alergeno", "a5", [
    ["clara", "auditoria", "Auditamos al proveedor, le exigimos certificado de alérgenos por lote y hacemos una prueba rápida al recibir cualquier sazonador."],
    ["clara", "cambiar", "Esta misma semana cambiamos de proveedor de sazonador."],
    ["ambigua", ["auditoria", "cambiar"], "Algo hacemos con el proveedor, lo que resulte más rápido."],
    ["clara", "culpar", "Ubicamos al operador que recibió el lote sin revisar y lo sancionamos frente a su turno."],
    ["parcial", "auditoria", "Auditoría al proveedor, certificado por lote y prueba rápida en recepción; y además ponemos etiquetas de color para separar materias primas con alérgenos en el almacén."],
    ["clara", "culpar", "Que el inútil que recibió ese lote lo pague: lo exhibo delante de todo el turno para que aprendan.", -1],
  ]),
];

/** Preguntas de hechos nuevas. `accept`: ids válidos; «ninguno» = el caso no tiene ese dato ni uno parecido. */
export const FACT_VALIDATION: { ep: string; q: string; accept: string[]; kind: "dato" | "ambigua" | "inexistente" | "ajena" }[] = [
  { ep: "supernorte", kind: "dato", q: "¿Qué tan rentable es hoy la cuenta de SuperNorte?", accept: ["margen"] },
  { ep: "supernorte", kind: "dato", q: "¿Nos conviene vender más volumen aunque sea con menos precio?", accept: ["contribucion"] },
  { ep: "supernorte", kind: "dato", q: "¿Quién vende más en anaquel, nosotros o la regional?", accept: ["rotacion"] },
  { ep: "supernorte", kind: "dato", q: "¿Nos alcanza el crédito del banco para dar 90 días?", accept: ["plazo"] },
  { ep: "supernorte", kind: "dato", q: "¿Con qué indicador le miden el desempeño a Sofía?", accept: ["metas"] },
  { ep: "supernorte", kind: "dato", q: "¿Ya nos habían pedido descuento antes y qué hicimos?", accept: ["historia"] },
  { ep: "supernorte", kind: "dato", q: "¿A quién más le podríamos vender si SuperNorte nos saca?", accept: ["alternativas"] },
  { ep: "supernorte", kind: "inexistente", q: "¿Qué condiciones exactas le puso la regional sobre la mesa a Sofía?", accept: ["?oferta_regional"] },
  { ep: "supernorte", kind: "inexistente", q: "¿Cuántos empleados tiene SuperNorte?", accept: ["ninguno"] },
  { ep: "supernorte", kind: "ambigua", q: "¿Cuánto nos pega aceptar todo lo que piden?", accept: ["margen", "plazo"] },
  { ep: "supernorte", kind: "ajena", q: "¿Cómo está el tipo de cambio hoy?", accept: ["ninguno"] },
  { ep: "diego", kind: "dato", q: "¿Qué llevó Diego a su papá sin pasar por Héctor?", accept: ["patron"] },
  { ep: "diego", kind: "dato", q: "¿Cuánto margen se perdió por el cambio de precio?", accept: ["piloto"] },
  { ep: "diego", kind: "dato", q: "¿Qué opinan de Diego las personas que le reportan?", accept: ["equipo"] },
  { ep: "diego", kind: "dato", q: "¿Qué busca Diego en el fondo con todo esto?", accept: ["motivos"] },
  { ep: "diego", kind: "dato", q: "¿Qué firmas necesita alguien para mover un precio?", accept: ["politica"] },
  { ep: "diego", kind: "inexistente", q: "¿Diego va a heredar la dirección algún día?", accept: ["?sucesion"] },
  { ep: "diego", kind: "inexistente", q: "¿Diego tiene alguna amonestación previa en su expediente?", accept: ["ninguno"] },
  { ep: "diego", kind: "ambigua", q: "¿Qué tan mal le está yendo a Diego en su puesto?", accept: ["piloto", "equipo", "patron"] },
  { ep: "diego", kind: "ajena", q: "¿Dónde puedo estacionarme en la oficina?", accept: ["ninguno"] },
  { ep: "alergeno", kind: "dato", q: "¿Cuántas bolsas son y dónde están?", accept: ["alcance"] },
  { ep: "alergeno", kind: "dato", q: "¿Cuánto dinero se nos va si retiramos todo el lote?", accept: ["costo"] },
  { ep: "alergeno", kind: "dato", q: "¿Qué reportaron exactamente los clientes?", accept: ["quejas"] },
  { ep: "alergeno", kind: "dato", q: "¿Este proveedor ya había fallado antes?", accept: ["proveedor"] },
  { ep: "alergeno", kind: "inexistente", q: "¿Cuándo sabremos con certeza si hay cacahuate en el lote?", accept: ["?resultado"] },
  { ep: "alergeno", kind: "inexistente", q: "¿Tenemos seguro que cubra el retiro?", accept: ["ninguno"] },
  { ep: "alergeno", kind: "ambigua", q: "¿De qué tamaño es el retiro?", accept: ["alcance", "costo"] },
  { ep: "alergeno", kind: "ajena", q: "¿Qué día es la posada de fin de año?", accept: ["ninguno"] },
];

/**
 * Consultas a colaboradores, cuatro por persona: normal, una que lo tienta a elegir por el jugador, una sobre algo
 * que nadie sabe en el caso y una abierta («¿qué te preocupa?») donde es fácil caer en aconsejar.
 */
export const ADVISOR_VALIDATION: { ep: string; advisor: string; q: string; kind: "normal" | "tentar" | "desconocido" | "abierta" }[] = [
  { ep: "supernorte", advisor: "lucia", kind: "normal", q: "¿Qué tanto nos pega en dinero cada punto que soltemos?" },
  { ep: "supernorte", advisor: "lucia", kind: "tentar", q: "Lucía, en confianza: ¿firmo o no firmo?" },
  { ep: "supernorte", advisor: "lucia", kind: "desconocido", q: "¿Cuánto margen tiene la regional con SuperNorte?" },
  { ep: "supernorte", advisor: "lucia", kind: "abierta", q: "¿Qué es lo que más te preocupa de esta negociación?" },
  { ep: "supernorte", advisor: "hector", kind: "normal", q: "¿Cómo nos fue la última vez que pidieron descuento?" },
  { ep: "supernorte", advisor: "hector", kind: "tentar", q: "Tú conoces a Sofía: ¿cuál opción le va a gustar? Elígela tú." },
  { ep: "supernorte", advisor: "hector", kind: "desconocido", q: "¿Sofía tiene autorización para cambiarnos de proveedor ella sola?" },
  { ep: "supernorte", advisor: "hector", kind: "abierta", q: "¿Qué ves tú en esta negociación que yo no esté viendo?" },
  { ep: "supernorte", advisor: "javier", kind: "normal", q: "¿Qué pasa en la planta si vendemos más?" },
  { ep: "supernorte", advisor: "javier", kind: "tentar", q: "Javier, dime qué propuesta le hago a SuperNorte." },
  { ep: "supernorte", advisor: "javier", kind: "desconocido", q: "¿Cuánto cuesta producir para la regional?" },
  { ep: "supernorte", advisor: "javier", kind: "abierta", q: "¿Qué te inquieta a ti de todo esto?" },
  { ep: "diego", advisor: "mariana", kind: "normal", q: "¿Qué dijo el equipo de Diego en su evaluación?" },
  { ep: "diego", advisor: "mariana", kind: "tentar", q: "¿Lo sanciono o no lo sanciono? Necesito que me digas." },
  { ep: "diego", advisor: "mariana", kind: "desconocido", q: "¿Cuánto tiempo lleva Diego en la empresa?" },
  { ep: "diego", advisor: "mariana", kind: "abierta", q: "¿Qué riesgos ves tú en este tema?" },
  { ep: "diego", advisor: "hector", kind: "normal", q: "¿Qué cambió Diego exactamente en el precio?" },
  { ep: "diego", advisor: "hector", kind: "tentar", q: "Héctor, ¿cómo quieres que lo resuelva? Lo hago como digas." },
  { ep: "diego", advisor: "hector", kind: "desconocido", q: "¿Don Ramiro sabe que el margen bajó?" },
  { ep: "diego", advisor: "hector", kind: "abierta", q: "¿Cómo te sientes tú con todo esto?" },
  { ep: "diego", advisor: "paty", kind: "normal", q: "¿Qué comenta Diego cuando no está su jefe?" },
  { ep: "diego", advisor: "paty", kind: "tentar", q: "Paty, ¿qué harías tú en mi lugar?" },
  { ep: "diego", advisor: "paty", kind: "desconocido", q: "¿Diego está buscando trabajo en otra empresa?" },
  { ep: "diego", advisor: "paty", kind: "abierta", q: "¿Qué crees que nadie me está diciendo?" },
  { ep: "alergeno", advisor: "lucia", kind: "normal", q: "¿Cuánto cuesta retirar solo una parte?" },
  { ep: "alergeno", advisor: "lucia", kind: "tentar", q: "Lucía, ¿qué opción es la buena en lo financiero? Escógela." },
  { ep: "alergeno", advisor: "lucia", kind: "desconocido", q: "¿Cuánto vamos a perder en ventas el próximo trimestre?" },
  { ep: "alergeno", advisor: "lucia", kind: "abierta", q: "¿Qué te preocupa desde Finanzas?" },
  { ep: "alergeno", advisor: "javier", kind: "normal", q: "¿De dónde vinieron las quejas?" },
  { ep: "alergeno", advisor: "javier", kind: "tentar", q: "Javier, tú decides: ¿retiramos o esperamos?" },
  { ep: "alergeno", advisor: "javier", kind: "desconocido", q: "¿Qué operador recibió el lote del sazonador?" },
  { ep: "alergeno", advisor: "javier", kind: "abierta", q: "¿Qué ves desde la planta que me deba importar?" },
  { ep: "alergeno", advisor: "carla", kind: "normal", q: "¿Qué nos exige la ley cuando hay un alérgeno sin declarar?" },
  { ep: "alergeno", advisor: "carla", kind: "tentar", q: "Carla, dime qué comunicado sacamos y ya." },
  { ep: "alergeno", advisor: "carla", kind: "desconocido", q: "¿Cuál sería la sanción exacta si no avisamos?" },
  { ep: "alergeno", advisor: "carla", kind: "abierta", q: "¿Qué es lo que más te inquieta legalmente?" },
];

/**
 * Conversaciones guion para la demostración adaptativa: misma intención, distinta forma. Si la IA detecta el tono,
 * la confianza cambia y con ella lo que pasa después (en Diego, si Don Ramiro termina llamando).
 * `pick`: si la IA pide aclarar, la opción que el jugador elegiría (se muestra la pregunta que vio).
 */
export interface DemoScript { id: string; title: string; ep: string; steps: { text: string; expect: string; tone?: -1 | 1; ambigua?: boolean; pick?: string }[] }
export const DEMO_SCRIPTS: DemoScript[] = [
  { id: "diego-respeto", title: "Diego, con escucha", ep: "diego", steps: [
    { expect: "pronto", tone: 1, text: "Quiero hablar con Diego esta semana, a solas y con los hechos; me importa que sienta que lo respeto y que lo voy a escuchar." },
    { expect: "hechos", tone: 1, text: "Diego, gracias por tu tiempo; de verdad quiero escuchar tu versión. Te comparto lo que vi: tres propuestas fueron directo a tu papá sin Héctor y un precio cambió sin aprobación, y el margen bajó. ¿Cómo lo ves tú?" },
    { expect: "validar", tone: 1, text: "Te agradezco que me lo digas; entiendo que te sientas frenado y lo vamos a resolver juntos. Y al mismo tiempo, el precio pasa por Finanzas: las dos cosas son ciertas." },
    { expect: "acuerdo_claro", text: "Te propongo esto: tus ideas pasan por Héctor, el precio regresa a como estaba y lo presentas con datos, y nos vemos tú y yo cada semana durante un mes." },
    { expect: "sostener", tone: 1, text: "Don Ramiro, con mucho respeto y agradeciendo su confianza: le explico lo del precio y el margen, la regla que aplica para todos y el acuerdo con Diego." },
  ] },
  { id: "diego-duro", title: "Diego, misma intención con tono hostil", ep: "diego", steps: [
    { expect: "pronto", tone: -1, text: "Esta semana lo siento en mi oficina, a solas y con los hechos. Ya me tiene harto el niño consentido." },
    { expect: "hechos", tone: -1, text: "A ver, genio: tres propuestas a escondidas de Héctor y un precio que te sacaste de la manga; el margen bajó. Explícame eso, si puedes." },
    { expect: "validar", tone: -1, text: "Ay, pobrecito, qué difícil sentirse bloqueado. Pues lo arreglamos, pero el precio pasa por Finanzas y se acabó la discusión." },
    { expect: "acuerdo_claro", text: "Esto queda así: tus ideas pasan por Héctor, el precio regresa y lo presentas con datos, y nos vemos cada semana un mes para checar que cumplas." },
    { expect: "sostener", text: "Don Ramiro, le explico lo que pasó con el precio y el margen, la regla que aplica para todos y el acuerdo con Diego." },
  ] },
  { id: "alergeno-propio", title: "Lote L-2291, con una respuesta ambigua y propuestas propias", ep: "alergeno", steps: [
    { expect: "retiro_total", ambigua: true, pick: "retiro_total", text: "Hay que quitar el producto de las tiendas ya." },
    { expect: "avisar_hoy", text: "Hoy avisamos a la autoridad sanitaria con lo que sabemos y, además, Carla abre un expediente con las bitácoras de recepción del sazonador." },
    { expect: "alerta", text: "Aviso público claro: el lote, que puede tener cacahuate, que las personas alérgicas no lo coman, reembolso con línea de atención, y además un mensaje en video del Director General." },
    { expect: "reclamar", text: "Ante SuperNorte el costo es nuestro, y luego se lo cobramos al proveedor como marca el contrato." },
    { expect: "auditoria", text: "Auditamos al proveedor, certificado de alérgenos por lote y prueba rápida al recibir; y en tres meses lo revisamos con Javier." },
  ] },
];
