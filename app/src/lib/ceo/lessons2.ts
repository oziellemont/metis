/**
 * mêtis Academy · Ruta CEO · niveles 2+ de cada tema y temas nuevos.
 * Cada tema crece contigo: el nivel N se abre cuando llegas al rango N de tu carrera.
 */
import type { Lesson } from "./lessons";

const SRC = "De CERO a CEO · Oziel Leal Montemayor";

export const MORE_LESSONS: Lesson[] = [
  // ───────────────────────────── Mentalidad · nivel 2
  {
    id: "mentalidad-2", title: "Tus primeros 90 días", part: "Mentalidad · Nivel 2", minutes: 4, icon: "flag",
    subtitle: "Escuchar, diagnosticar y ganar las primeras victorias sin romper lo que sí funciona.",
    blocks: [
      { kind: "flow", eyebrow: "El plan de 90 días", title: "Tres fases, cada una con su entregable", steps: [
        { label: "Días 1–30 · Escuchar", example: "1 a 1 con cada persona clave, piso de operación y 5 clientes. Entregable: tu diagnóstico en una página." },
        { label: "Días 31–60 · Decidir", example: "3 prioridades, no 10. Las presentas al equipo y pides que las cuestionen." },
        { label: "Días 61–90 · Demostrar", example: "Una victoria visible y temprana que confirme que el rumbo es real." },
      ], note: "La gente juzga tu plan por la primera victoria, no por la presentación." },
      { kind: "compare", eyebrow: "Dos errores típicos", title: "Llegar a cambiarlo todo o no cambiar nada", left: { label: "El salvador", points: ["Llega con la receta de su empresa anterior", "Cambia al equipo en el mes uno", "Rompe lo que sí funcionaba"] }, right: { label: "El invitado", points: ["Escucha seis meses sin decidir", "Deja que el equipo lo maneje", "Pierde la ventana para cambiar"] }, neutral: true, note: "Escuchar con fecha de cierre es la diferencia entre prudencia y parálisis." },
      { kind: "check", eyebrow: "Aplícalo", title: "La victoria temprana", question: "Llevas 50 días. ¿Qué victoria temprana conviene más?", options: [
        { text: "Un proyecto grande y ambicioso que muestre tu visión.", why: "Lo grande tarda; si no se ve en semanas, no sirve como señal." },
        { text: "Resolver un problema que todos sufren y nadie había atendido.", correct: true, why: "Demuestra que escuchaste y que contigo las cosas sí se mueven." },
        { text: "Cambiar el logo y los valores para marcar una nueva etapa.", why: "Lo cosmético sin cambio real confirma el escepticismo." },
      ] },
    ],
  },
  // ───────────────────────────── Personas · niveles 2 y 3
  {
    id: "personas-2", title: "Delegar sin abandonar", part: "Personas · Nivel 2", minutes: 4, icon: "users",
    subtitle: "Los cinco niveles de delegación y por qué «hazlo tú» no es delegar.",
    blocks: [
      { kind: "flow", eyebrow: "Niveles de delegación", title: "Delegar no es un sí o un no: es una escalera", intro: "Sube un escalón cuando la persona demuestra criterio.", steps: [
        { label: "1 · Investiga y repórtame", example: "Tú decides. Ella aprende cómo piensas." },
        { label: "2 · Propón opciones", example: "Te trae 2 o 3 caminos con su recomendación." },
        { label: "3 · Decide y avísame antes", example: "Ella decide; tú puedes frenar si ves un riesgo." },
        { label: "4 · Decide y avísame después", example: "Confianza casi total; revisan resultados." },
        { label: "5 · Es tuyo", example: "Ni te enteras del detalle. Te enteras del resultado." },
      ], note: "El error más común: saltar del 1 al 5 y, cuando sale mal, regresar al 1 para siempre." },
      { kind: "text", eyebrow: "Delegar resultados, no tareas", title: "Di qué quieres lograr, no cómo hacerlo.", body: ["«Llama a estos 10 clientes» es una tarea. «Recupera a 3 de los clientes que perdimos este trimestre» es un resultado: la persona puede pensar.", "Acuerda tres cosas: qué es éxito, con qué recursos cuenta y cada cuánto lo revisan."], callout: { label: "Nota CEO", text: "Si delegas y luego corriges todo, no delegaste: tercerizaste la captura.", source: SRC } },
      { kind: "check", eyebrow: "Aplícalo", title: "El primer error del delegado", question: "Le delegaste a Ana un proyecto en nivel 3 y se equivocó en una decisión menor. ¿Qué haces?", options: [
        { text: "Regresar el proyecto al nivel 1 hasta que demuestre que puede.", why: "Castigas el error y le enseñas a no decidir." },
        { text: "Revisar juntos qué pensó, qué aprendió, y mantener el nivel 3.", correct: true, why: "El error menor es la colegiatura del criterio. Pagarla es parte de desarrollar a alguien." },
        { text: "No decir nada para no desmotivarla.", why: "Sin conversación no hay aprendizaje; el error se repite." },
      ] },
    ],
  },
  {
    id: "personas-3", title: "Formar a tu sucesor", part: "Personas · Nivel 3", minutes: 5, icon: "users",
    subtitle: "Desempeño contra potencial, y por qué tu mejor técnico no siempre es tu mejor líder.",
    blocks: [
      { kind: "reveal", eyebrow: "Desempeño × potencial", title: "No todos los buenos son iguales", intro: "Toca cada perfil.", items: [
        { tag: "■", label: "Alto desempeño, alto potencial", body: "Tus futuros líderes. Dales retos más grandes de lo que creen poder.", details: [{ label: "Riesgo", text: "Si no crecen contigo, crecen en otra empresa." }] },
        { tag: "◆", label: "Alto desempeño, potencial limitado", body: "Expertos valiosísimos. Reconócelos sin forzarlos a ser jefes.", details: [{ label: "Riesgo", text: "Ascenderlos a líder y perder al experto y ganar un mal jefe." }] },
        { tag: "▲", label: "Desempeño medio, alto potencial", body: "Puede ser el puesto equivocado o un jefe que no lo desarrolla.", details: [{ label: "Pregunta", text: "¿Qué le falta: claridad, habilidad o motivación?" }] },
        { tag: "●", label: "Bajo desempeño sostenido", body: "Después de claridad, apoyo y tiempo, la decisión justa es otra posición o salir.", details: [{ label: "Riesgo", text: "Tolerarlo castiga a los que sí cumplen." }] },
      ], note: "Ascender por desempeño pasado es premiar; ascender por potencial es invertir." },
      { kind: "text", eyebrow: "Sucesión", title: "Si mañana no llegas, ¿quién decide?", body: ["Un líder que no tiene sucesor no es indispensable: es un riesgo para la empresa.", "Nombra 2 o 3 candidatos, dales exposición real (que presenten al consejo, que te cubran en vacaciones) y retroalimentación honesta sobre lo que les falta."], callout: { label: "Nota CEO", text: "Si no tienes 2 o 3 posibles reemplazos, estás protegiendo tu silla.", source: SRC } },
      { kind: "check", eyebrow: "Aplícalo", title: "El ascenso que todos esperan", question: "Tu mejor ingeniero quiere ser gerente. Es brillante, pero se desespera con la gente. ¿Qué haces?", options: [
        { text: "Ascenderlo: se lo ganó.", why: "Premias el pasado y arriesgas al equipo. Ganárselo como técnico no lo prepara como líder." },
        { text: "Decirle que no es para él y seguir igual.", why: "Pierdes su motivación y probablemente a él." },
        { text: "Abrir dos caminos: liderar un proyecto pequeño con acompañamiento, o crecer como experto con reconocimiento equivalente.", correct: true, why: "Le das evidencia a los dos: si puede liderar, y si eso es lo que de verdad quiere." },
      ] },
    ],
  },
  // ───────────────────────────── Conversaciones (tema nuevo)
  {
    id: "conversaciones", title: "Retroalimentación que se escucha", part: "Conversaciones · Nivel 1", minutes: 4, icon: "message",
    subtitle: "Situación, conducta e impacto: cómo decir lo que hay que decir sin atacar a la persona.",
    blocks: [
      { kind: "flow", eyebrow: "El método SCI", title: "Tres partes, en este orden", steps: [
        { label: "Situación", example: "«En la junta del martes con el cliente…»" },
        { label: "Conducta (lo que se vio)", example: "«…interrumpiste a Laura tres veces…»" },
        { label: "Impacto", example: "«…y el cliente terminó preguntándome a mí quién manda en el proyecto.»" },
      ], note: "Después del impacto, calla y pregunta: «¿Cómo lo viste tú?»" },
      { kind: "compare", eyebrow: "Hechos contra juicios", title: "Lo que dices cambia lo que escuchan", left: { label: "Juicio (se defiende)", points: ["«Eres muy desorganizado»", "«No te importa el equipo»", "«Siempre llegas tarde»"] }, right: { label: "Hecho (se puede trabajar)", points: ["«El reporte llegó 2 días después»", "«No fuiste a 3 de los últimos 4 1 a 1»", "«Esta semana llegaste 40 min tarde dos veces»"] }, note: "Nadie puede discutir un hecho. Todos discuten un juicio." },
      { kind: "check", eyebrow: "Aplícalo", title: "Elogiar también cuenta", question: "¿Cuál es el mejor reconocimiento?", options: [
        { text: "«¡Excelente trabajo, eres una crack!»", why: "Se agradece, pero no le dice qué repetir." },
        { text: "«La forma en que preparaste los datos antes de la junta hizo que el consejo aprobara en 10 minutos.»", correct: true, why: "Situación, conducta e impacto también sirven para reforzar lo bueno." },
        { text: "Un bono sorpresa sin decir por qué.", why: "El dinero sin mensaje no enseña nada." },
      ] },
    ],
  },
  {
    id: "conversaciones-2", title: "Conversaciones difíciles", part: "Conversaciones · Nivel 2", minutes: 5, icon: "message",
    subtitle: "Bajo desempeño, conducta y quejas: preparar, abrir, escuchar y cerrar con un acuerdo.",
    blocks: [
      { kind: "flow", eyebrow: "La estructura", title: "Cinco pasos para no improvisar", steps: [
        { label: "1 · Prepara los hechos", example: "Fechas, ejemplos, impacto. Sin rumores ni «me dijeron»." },
        { label: "2 · Abre directo", example: "«Quiero hablar de algo importante: cómo trataste al equipo en la junta del lunes.»" },
        { label: "3 · Escucha de verdad", example: "Puede haber contexto que no conoces. Pregunta antes de concluir." },
        { label: "4 · Separa a la persona de la conducta", example: "«Te valoro. Esta conducta no puede repetirse.»" },
        { label: "5 · Cierra con un acuerdo", example: "Qué cambia, cómo lo vamos a medir y cuándo lo revisamos." },
      ], note: "Si sales sin un acuerdo, tuviste una plática, no una conversación." },
      { kind: "reveal", eyebrow: "Errores que arruinan la conversación", title: "Lo que hace que no sirva", items: [
        { tag: "1", label: "El sándwich", body: "Elogio, crítica, elogio. La persona se queda con lo bueno y no oye el mensaje." },
        { tag: "2", label: "Esperar a la evaluación anual", body: "Si es sorpresa en la evaluación, el que falló fuiste tú." },
        { tag: "3", label: "Mandarlo por correo", body: "Lo difícil se dice en persona. Por escrito se documenta después." },
        { tag: "4", label: "Hablar de otros", body: "«Varios se quejan» genera paranoia. Habla de hechos que tú puedas sostener." },
      ] },
      { kind: "check", eyebrow: "Aplícalo", title: "Se pone a llorar", question: "A mitad de la conversación sobre su desempeño, tu gerente se quiebra. ¿Qué haces?", options: [
        { text: "Suspender la conversación y no volver a tocar el tema.", why: "Por cuidarla le quitas la información que necesita para mejorar." },
        { text: "Hacer una pausa, reconocer que es difícil, y retomar ahora o en 24 horas con el mismo mensaje.", correct: true, why: "Empatía no es cambiar el mensaje: es cuidar a la persona mientras lo recibe." },
        { text: "Seguir como si nada para terminar rápido.", why: "Ignorar la emoción hace que nada de lo que digas se escuche." },
      ] },
    ],
  },
  // ───────────────────────────── Equipos · nivel 2
  {
    id: "equipos-2", title: "Juntas que deciden", part: "Equipos · Nivel 2", minutes: 4, icon: "layers",
    subtitle: "Pedir el desacuerdo, decidir con quién y cerrar con quién hace qué.",
    blocks: [
      { kind: "text", eyebrow: "El silencio no es acuerdo", title: "Si nadie objeta, probablemente nadie se atrevió.", body: ["Antes de decidir, pregunta directo: «¿Qué podría salir mal?» o pídele a alguien que defienda la postura contraria.", "Habla al final. Si el CEO opina primero, el resto se acomoda."], callout: { label: "Nota CEO", text: "La confianza no elimina el conflicto. Lo vuelve útil.", source: SRC } },
      { kind: "compare", eyebrow: "Desacuerdo y compromiso", title: "Discutir con todo, ejecutar como uno", left: { label: "Durante el debate", points: ["Todos dicen lo que piensan", "Se cuestionan ideas, no personas", "El que decide escucha"] }, right: { label: "Después de decidir", points: ["Nadie dice «yo no estaba de acuerdo» en el pasillo", "Cada quien sabe qué le toca", "Se revisa en una fecha"] }, neutral: true },
      { kind: "check", eyebrow: "Aplícalo", title: "El que calla", question: "Tu directora de finanzas no dice nada en las juntas, pero luego te manda correos con objeciones muy buenas. ¿Qué haces?", options: [
        { text: "Pedirle en privado que sus objeciones las diga en la junta, y abrirle el espacio preguntándole directo.", correct: true, why: "Sus ideas tienen valor para todos; tu trabajo es que el equipo las oiga a tiempo." },
        { text: "Agradecerle los correos: así funciona ella.", why: "El equipo decide sin su información y luego hay que rehacer." },
        { text: "Pedirle que deje de mandar correos después de las juntas.", why: "Callas la objeción en vez de traerla a la mesa." },
      ] },
    ],
  },
  // ───────────────────────────── Alineación · nivel 2
  {
    id: "alineacion-2", title: "Indicadores que guían", part: "Alineación · Nivel 2", minutes: 4, icon: "compass",
    subtitle: "Indicadores que adelantan contra indicadores que llegan tarde, y cómo un mal indicador corrompe la conducta.",
    blocks: [
      { kind: "compare", eyebrow: "Dos tipos de indicador", title: "El resultado llega tarde; la causa se ve antes", left: { label: "Resultado (llega tarde)", points: ["Ventas del trimestre", "Rotación anual", "Utilidad"] }, right: { label: "Causa (se ve antes)", points: ["Visitas a clientes nuevos por semana", "1 a 1 hechos este mes", "Pedidos completos a tiempo"] }, neutral: true, note: "Si solo miras resultados, siempre llegas tarde a corregir." },
      { kind: "text", eyebrow: "Lo que mides, eso obtienes", title: "Un indicador mal diseñado enseña a hacer trampa.", body: ["Si al centro de atención telefónica lo mides por llamadas cortas, colgarán antes de resolver. Si a ventas solo la mides por volumen, venderá con descuento.", "Cada indicador necesita su contrapeso: volumen con margen, velocidad con calidad."], callout: { label: "Nota CEO", text: "Cuando todos cumplen su meta y la empresa pierde, el problema no es la gente: es el sistema de metas.", source: SRC } },
      { kind: "check", eyebrow: "Aplícalo", title: "Bono por entregas a tiempo", question: "Pusiste bono por entregas a tiempo y ahora logística manda pedidos incompletos para cumplir la fecha. ¿Qué cambias?", options: [
        { text: "Quitar el bono.", why: "El indicador era bueno; le faltaba contrapeso." },
        { text: "Medir «pedido completo y a tiempo» como un solo indicador.", correct: true, why: "Un indicador con contrapeso cierra la puerta a cumplir de mentiritas." },
        { text: "Sancionar a quien mande incompleto.", why: "Atacas la conducta que tu propio sistema premió." },
      ] },
    ],
  },
  // ───────────────────────────── Negociación · nivel 2
  {
    id: "negociacion-2", title: "Negociar dentro de la empresa", part: "Negociación · Nivel 2", minutes: 4, icon: "handshake",
    subtitle: "Con tu jefe, con tus pares y con el sindicato: la negociación más difícil es con quien vas a ver mañana.",
    blocks: [
      { kind: "text", eyebrow: "Relación repetida", title: "Adentro no hay «ganar y nunca volver a verse».", body: ["Con un proveedor puedes cambiar de proveedor. Con tu director de operaciones vas a negociar cada semana durante años.", "Por eso adentro conviene más el acuerdo que ambos defienden que el que tú ganaste por poder."] },
      { kind: "reveal", eyebrow: "Tres tácticas internas", title: "Lo que funciona con tus pares", items: [
        { tag: "1", label: "Prepara la junta antes de la junta", body: "Habla 1 a 1 con cada involucrado. Las sorpresas en público generan defensas." },
        { tag: "2", label: "Traduce a su indicador", body: "Tu propuesta tiene que mover algo que a él le importa, no solo a ti." },
        { tag: "3", label: "Pide poco y concreto", body: "Un piloto de 4 semanas se aprueba; una reestructura no." },
      ] },
      { kind: "check", eyebrow: "Aplícalo", title: "El sindicato pide 9%", question: "La inflación fue 5%. El sindicato pide 9%. ¿Por dónde empiezas?", options: [
        { text: "Ofrecer 5% y no moverse: es lo justo.", why: "Una posición rígida invita a otra posición rígida." },
        { text: "Preguntar qué hay detrás del 9%: deudas, transporte, comparación con otra planta.", correct: true, why: "Debajo de cada posición hay un interés que a veces se resuelve con algo distinto a sueldo." },
        { text: "Dar 9% para evitar conflicto.", why: "Compras paz hoy y fijas la expectativa del próximo año." },
      ] },
    ],
  },
  // ───────────────────────────── Comunicación · nivel 2
  {
    id: "comunicacion-2", title: "Dar malas noticias", part: "Comunicación · Nivel 2", minutes: 4, icon: "message",
    subtitle: "Recortes, pérdidas, cambios: decir la verdad pronto, completa y con lo que sigue.",
    blocks: [
      { kind: "flow", eyebrow: "El orden", title: "Cómo dar una mala noticia", steps: [
        { label: "La noticia, sin rodeos", example: "«Este año no habrá bono.»" },
        { label: "El porqué, en una frase", example: "«Perdimos al cliente más grande y la caja no alcanza.»" },
        { label: "Lo que significa para ti", example: "«Los sueldos y empleos están garantizados.»" },
        { label: "Lo que sigue", example: "«En 90 días les presento el plan para recuperarlo.»" },
      ], note: "La gente aguanta malas noticias. Lo que no aguanta es enterarse por rumor." },
      { kind: "compare", eyebrow: "Velocidad contra precisión", title: "¿Esperar a tener todo o hablar ya?", left: { label: "Hablar pronto", points: ["Evita el rumor", "Muestra respeto", "Puede faltar información"] }, right: { label: "Esperar a tener todo", points: ["Mensaje completo", "Menos preguntas sin respuesta", "El rumor llega primero"] }, neutral: true, note: "Habla pronto con lo que sabes, di qué no sabes y cuándo vas a saberlo." },
      { kind: "check", eyebrow: "Aplícalo", title: "El rumor del cierre", question: "Corre el rumor de que cerrarán una planta. Es posible, pero no está decidido. ¿Qué dices?", options: [
        { text: "«No hay nada de eso», para calmar.", why: "Si luego sucede, nunca más te van a creer." },
        { text: "«Estamos evaluando opciones; no hay decisión. Les digo primero a ustedes, antes del 30.»", correct: true, why: "Verdad, incertidumbre reconocida y una fecha: es lo único que baja la ansiedad." },
        { text: "No decir nada hasta que se decida.", why: "El silencio se llena con el peor escenario." },
      ] },
    ],
  },
  // ───────────────────────────── Cultura · nivel 2
  {
    id: "cultura-2", title: "Cuando el que falla es tu estrella", part: "Cultura · Nivel 2", minutes: 4, icon: "flame",
    subtitle: "La consistencia es la cultura: lo que le perdonas al mejor es lo que todos aprenden.",
    blocks: [
      { kind: "text", eyebrow: "La prueba real", title: "Los valores se prueban con quien más te cuesta perder.", body: ["Corregir al nuevo es fácil. Corregir a quien vende el 30% es donde el equipo descubre si los valores son reales.", "Cada excepción que haces es una regla nueva que todos leen."], callout: { label: "Nota CEO", text: "La ética de una empresa no se mide por sus valores escritos, sino por lo que decide no tolerar cuando hay dinero en juego.", source: SRC } },
      { kind: "compare", eyebrow: "Dos costos", title: "Lo que pierdes en cada caso", left: { label: "Si lo toleras", points: ["El equipo aprende que hay intocables", "Los buenos se van primero", "Tu palabra pierde valor"] }, right: { label: "Si lo corriges", points: ["Riesgo de perder ventas o al talento", "Conversación incómoda", "Puede irse"] }, neutral: true, note: "El costo de corregir se ve hoy. El de tolerar se paga durante años." },
      { kind: "check", eyebrow: "Aplícalo", title: "La comisión inflada", question: "Tu mejor vendedor reportó una venta en diciembre que en realidad cerró en enero, para cobrar el bono. ¿Qué haces?", options: [
        { text: "Dejarlo pasar; la venta sí existió.", why: "Le enseñas a él y a todos que la regla depende de quién eres." },
        { text: "Hablar con él, revertir el bono y aplicar la misma regla que a cualquiera.", correct: true, why: "Consistencia sin humillar: el mensaje es la regla, no el castigo." },
        { text: "Despedirlo de inmediato en público.", why: "Desproporcionado si no hay historial; el miedo no construye cultura." },
      ] },
    ],
  },
  // ───────────────────────────── Finanzas · nivel 2
  {
    id: "finanzas-2", title: "La empresa vive de caja", part: "Finanzas · Nivel 2", minutes: 4, icon: "coins",
    subtitle: "Utilidad no es dinero en el banco: capital de trabajo, cobranza e inventario.",
    blocks: [
      { kind: "text", eyebrow: "La trampa del crecimiento", title: "Muchas empresas quiebran mientras crecen.", body: ["Vendes más, pero cobras a 90 días y pagas a 30. Cada venta nueva te pide adelantar dinero.", "La utilidad dice si el negocio es bueno. La caja dice si llegas al mes que viene."], callout: { label: "Nota CEO", text: "La utilidad es una opinión; la caja es un hecho.", source: SRC } },
      { kind: "reveal", eyebrow: "Tres palancas de caja", title: "Dónde se esconde el dinero", items: [
        { tag: "1", label: "Cobranza", body: "Cada día que tardas en cobrar es dinero que financias a tu cliente." },
        { tag: "2", label: "Inventario", body: "Producto en el almacén es dinero detenido. Y a veces caduca." },
        { tag: "3", label: "Proveedores", body: "Negociar plazos sin abusar: si los ahorcas, te fallan cuando más los necesitas." },
      ] },
      { kind: "check", eyebrow: "Aplícalo", title: "El pedido gigante", question: "Un cliente nuevo te ofrece un pedido que duplica tus ventas, pagando a 120 días. ¿Qué haces?", options: [
        { text: "Aceptarlo: es la oportunidad del año.", why: "Si no tienes caja para financiar 120 días, la oportunidad te quiebra." },
        { text: "Calcular cuánta caja necesitas y negociar anticipo, plazo o un pedido escalonado.", correct: true, why: "Crecer sí, pero con el flujo resuelto antes de firmar." },
        { text: "Rechazarlo: es demasiado riesgo.", why: "Sin explorar alternativas, dejas ir el crecimiento por miedo." },
      ] },
    ],
  },
  // ───────────────────────────── Innovación · nivel 2
  {
    id: "innovacion-2", title: "Matar proyectos a tiempo", part: "Innovación · Nivel 2", minutes: 4, icon: "rocket",
    subtitle: "El costo hundido, criterios de salida desde el día uno y cómo cerrar sin castigar.",
    blocks: [
      { kind: "text", eyebrow: "El costo hundido", title: "«Ya invertimos tanto» no es una razón para seguir.", body: ["Lo que ya gastaste no regresa. La única pregunta es: con lo que sabemos hoy, ¿volveríamos a invertir el siguiente peso?", "Define desde el inicio qué resultado, en qué fecha, haría que paremos."] },
      { kind: "flow", eyebrow: "Cerrar bien", title: "Cómo terminar un proyecto sin quemar a nadie", steps: [
        { label: "Reconoce lo aprendido", example: "Qué sabemos hoy que no sabíamos." },
        { label: "Separa la idea del equipo", example: "Falló la hipótesis, no las personas." },
        { label: "Reasigna rápido", example: "El talento que se queda sin proyecto se va." },
      ], note: "Si cerrar un proyecto se castiga, nadie volverá a proponer uno." },
      { kind: "check", eyebrow: "Aplícalo", title: "El proyecto del director", question: "El proyecto favorito de un director lleva 18 meses sin llegar a ninguna meta. Él pide 6 meses más. ¿Qué haces?", options: [
        { text: "Darle los 6 meses por lealtad.", why: "La lealtad no es un criterio de inversión." },
        { text: "Darle 8 semanas con una meta concreta que, si no se cumple, cierra el proyecto.", correct: true, why: "Le das una última oportunidad con criterio de salida claro y acordado." },
        { text: "Cerrarlo ya y anunciarlo en la junta general.", why: "Cerrar puede ser correcto; exhibirlo, no." },
      ] },
    ],
  },
  // ───────────────────────────── Estrategia · nivel 2
  {
    id: "estrategia-2", title: "Decir que no", part: "Estrategia · Nivel 2", minutes: 4, icon: "target",
    subtitle: "Elegir clientes, productos y mercados: la estrategia también es lo que dejas de hacer.",
    blocks: [
      { kind: "text", eyebrow: "Clientes que cuestan", title: "No todos los clientes te hacen ganar.", body: ["Cuando sumas descuentos, devoluciones, crédito y el tiempo de tu equipo, hay clientes que te cuestan dinero.", "Decirles que no (o cambiar las condiciones) libera recursos para los que sí construyen tu futuro."], callout: { label: "Nota CEO", text: "La estrategia no se demuestra por lo que apruebas, sino por lo que tienes el carácter de rechazar.", source: SRC } },
      { kind: "compare", eyebrow: "Foco contra dispersión", title: "Diez prioridades son ninguna", left: { label: "Disperso", points: ["Cada área con su lista", "Todo es urgente", "Nada termina"] }, right: { label: "Enfocado", points: ["3 prioridades de empresa", "Cada área sabe cómo contribuye", "Lo demás espera o se cancela"] } },
      { kind: "check", eyebrow: "Aplícalo", title: "El producto de 20 años", question: "El producto con el que nació la empresa hoy pierde dinero, pero el fundador lo adora. ¿Qué propones?", options: [
        { text: "Mantenerlo por respeto a la historia.", why: "La historia no paga la nómina." },
        { text: "Mostrar los números al fundador y proponer un plan: reformular, subir precio o despedirlo con honores.", correct: true, why: "Le das datos y una salida digna, no una orden." },
        { text: "Descontinuarlo sin consultarlo.", why: "Ganas la batalla y pierdes al fundador." },
      ] },
    ],
  },
  // ───────────────────────────── Crisis (tema nuevo)
  {
    id: "crisis", title: "Las primeras 24 horas de una crisis", part: "Crisis · Nivel 1", minutes: 4, icon: "flame",
    subtitle: "Personas primero, hechos después, mensajes al final. Y una sola voz.",
    blocks: [
      { kind: "flow", eyebrow: "El orden importa", title: "Qué hacer, en qué orden", steps: [
        { label: "1 · Personas", example: "¿Hay alguien en riesgo? Eso va antes que cualquier pedido o comunicado." },
        { label: "2 · Hechos", example: "Qué pasó, qué sabemos y qué no. Un responsable que lo concentre." },
        { label: "3 · Una sola voz", example: "Quién habla con medios, clientes y equipo. Nadie más improvisa." },
        { label: "4 · Comunicar pronto", example: "Lo que sabemos, lo que hacemos y cuándo daremos más información." },
      ], note: "En una crisis, el silencio se interpreta como culpa." },
      { kind: "check", eyebrow: "Aplícalo", title: "El video viral", question: "Un cliente sube un video de un empleado tratándolo mal. Tiene 200 mil vistas. ¿Primera acción?", options: [
        { text: "Despedir al empleado y anunciarlo en redes.", why: "Decidir sin conocer los hechos puede ser injusto y empeorar la crisis." },
        { text: "Responder públicamente que se está revisando, contactar al cliente y escuchar al empleado hoy mismo.", correct: true, why: "Reconoces rápido, cuidas a ambas personas y decides con hechos." },
        { text: "No responder para no darle más visibilidad.", why: "El silencio deja que otros cuenten tu historia." },
      ] },
    ],
  },
  // ───────────────────────────── Consejo (tema nuevo)
  {
    id: "consejo", title: "Trabajar con tu consejo", part: "Gobierno · Nivel 1", minutes: 4, icon: "compass",
    subtitle: "Sin sorpresas, con opciones y sabiendo qué decide el consejo y qué decides tú.",
    blocks: [
      { kind: "compare", eyebrow: "Quién decide qué", title: "El consejo gobierna; el CEO dirige", left: { label: "Consejo", points: ["Aprueba la estrategia y el presupuesto", "Nombra y evalúa al CEO", "Vigila riesgos y ética"] }, right: { label: "CEO", points: ["Ejecuta la estrategia", "Arma y dirige al equipo", "Opera el día a día"] }, neutral: true, note: "Cuando un consejero opera, o el CEO decide lo que le toca al consejo, se rompe el gobierno." },
      { kind: "reveal", eyebrow: "Tres reglas", title: "Cómo ganarte la confianza del consejo", items: [
        { tag: "1", label: "Nunca una sorpresa", body: "Las malas noticias, antes de la junta y por teléfono." },
        { tag: "2", label: "Trae opciones, no problemas", body: "Dos o tres caminos con tu recomendación y sus riesgos." },
        { tag: "3", label: "Pregunta antes de que te pregunten", body: "Habla 1 a 1 con cada consejero antes de las decisiones grandes." },
      ] },
      { kind: "check", eyebrow: "Aplícalo", title: "El consejero que da órdenes", question: "Un consejero le pide directo a tu director de ventas un cambio de precios. ¿Qué haces?", options: [
        { text: "Dejarlo pasar; es consejero.", why: "Tu equipo aprende que hay dos jefes." },
        { text: "Hablar en privado con el consejero, escuchar su idea y acordar que las peticiones pasen por ti.", correct: true, why: "Respetas su aporte y proteges la línea de mando." },
        { text: "Plantearlo en la junta de consejo frente a todos.", why: "Exhibirlo lo vuelve un rival." },
      ] },
    ],
  },
];
