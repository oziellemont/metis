/**
 * mêtis CEO · Dilemas de personas.
 * Casos cortos y diarios sobre cómo abordar a cada colaborador según su momento
 * (liderazgo situacional), independientes de la empresa que estés dirigiendo.
 * Todas las opciones son defendibles: ninguna es «obvia». El puntaje (0–3) solo se
 * traduce en XP y en la explicación de qué haría un gran líder y por qué.
 */

export type DilemmaTheme =
  | "nuevo" | "veterano" | "estrella" | "desempeno" | "quejas" | "conducta"
  | "delegar" | "ascenso" | "conflicto" | "retener" | "personal" | "salida";

/** Momento de la persona (liderazgo situacional). */
export type Stage = "dirige" | "entrena" | "apoya" | "delega";

export interface DilemmaOption { text: string; score: 0 | 1 | 2 | 3; why: string }

export interface Dilemma {
  id: string;
  theme: DilemmaTheme;
  /** Rango mínimo de tu carrera para que aparezca (0 = Gerente … 4 = CEO de consejo). */
  min: number;
  /** Quién es (nombre, puesto, contexto en una línea). */
  who: string;
  /** Qué pasa. */
  text: string;
  ask: string;
  options: DilemmaOption[];
  /** Qué necesita esta persona de ti (liderazgo situacional). */
  stage?: Stage;
  /** Lección de Academy relacionada. */
  lesson?: string;
}

export const THEMES: Record<DilemmaTheme, { label: string; emoji: string; hint: string }> = {
  nuevo: { label: "Alguien que acaba de llegar", emoji: "🌱", hint: "Claridad, contexto y primeras victorias." },
  veterano: { label: "Alguien con muchos años", emoji: "🌳", hint: "Respeto por la historia sin quedarse en ella." },
  estrella: { label: "Tu mejor elemento", emoji: "⭐", hint: "Retos, reconocimiento y las mismas reglas." },
  desempeno: { label: "Bajo desempeño", emoji: "📉", hint: "Hechos, apoyo y fecha." },
  quejas: { label: "Su equipo se queja", emoji: "📣", hint: "Escuchar a ambos lados antes de concluir." },
  conducta: { label: "Conducta y denuncias", emoji: "⚠️", hint: "Proteger a las personas y seguir el proceso." },
  delegar: { label: "No sabe delegar", emoji: "🧩", hint: "Del control a la confianza, escalón por escalón." },
  ascenso: { label: "Ascensos y rechazos", emoji: "🪜", hint: "Potencial, no solo desempeño pasado." },
  conflicto: { label: "Conflicto entre dos", emoji: "⚔️", hint: "Intereses, no posiciones." },
  retener: { label: "Quiere irse", emoji: "🚪", hint: "Lo que de verdad le falta casi nunca es dinero." },
  personal: { label: "Algo personal", emoji: "🤝", hint: "Humanidad con límites claros." },
  salida: { label: "Despedir bien", emoji: "🔚", hint: "Dignidad, claridad y el mensaje al equipo." },
};

export const STAGE_LABEL: Record<Stage, string> = { dirige: "Necesita dirección", entrena: "Necesita entrenamiento", apoya: "Necesita apoyo", delega: "Necesita autonomía" };

export const DILEMMAS: Dilemma[] = [
  // ─────────────────────────────────────────────── alguien nuevo
  { id: "n1", theme: "nuevo", min: 0, stage: "dirige", lesson: "personas", who: "Ana · analista, 2 semanas en la empresa", text: "Ana es entusiasta y ya te mandó tres ideas para «cambiar todo el proceso de pronósticos». Una de ellas es buena; dos ignoran cosas que ella todavía no conoce.", ask: "¿Cómo respondes?", options: [
    { text: "Agradecerle y pedirle que primero aprenda cómo funciona todo antes de proponer.", score: 1, why: "Proteges el proceso, pero apagas el entusiasmo que más cuesta recuperar." },
    { text: "Tomar la idea buena, explicarle en 10 min por qué las otras dos no aplican hoy y darle un primer entregable concreto.", score: 3, why: "Alguien nuevo y entusiasta necesita dirección: claridad sobre qué es «bueno» sin apagar su energía." },
    { text: "Dejarla probar las tres ideas para que aprenda sola.", score: 1, why: "Aprender del error sirve, pero sin contexto la mandas a fallar en público en su primer mes." },
    { text: "Implementar su idea buena y darle el crédito en la junta del equipo.", score: 2, why: "El reconocimiento es poderoso, pero si no le explicas lo demás, va a seguir proponiendo a ciegas." },
  ] },
  { id: "n2", theme: "nuevo", min: 0, stage: "dirige", who: "Rodrigo · gerente de planta, contratado de fuera hace un mes", text: "El equipo de Rodrigo no lo acepta: «él no conoce cómo hacemos las cosas aquí». Te piden en secreto que regrese el gerente anterior, que fue ascendido a otra área.", ask: "¿Qué haces?", options: [
    { text: "Respaldar a Rodrigo públicamente y pedir al equipo que le den una oportunidad.", score: 1, why: "El respaldo ayuda, pero imponerlo sin escuchar refuerza el «no nos entienden»." },
    { text: "Pedirle al gerente anterior que haga una transición formal con Rodrigo durante 4 semanas.", score: 3, why: "Transfiere confianza y contexto: el equipo ve que el anterior lo respalda y Rodrigo aprende lo que no sabía." },
    { text: "Hablar con Rodrigo para que se adapte más a la forma de trabajar del equipo.", score: 1, why: "Adaptarse sí, pero lo contrataste de fuera precisamente para traer algo distinto." },
    { text: "Reunirte con el equipo para escuchar sus quejas concretas y dárselas a Rodrigo.", score: 2, why: "Escuchar es correcto; el riesgo es convertirte en el canal y que Rodrigo nunca construya su relación directa." },
  ] },
  { id: "n3", theme: "nuevo", min: 1, stage: "dirige", lesson: "mentalidad-2", who: "Laura · directora comercial, llegó hace 45 días", text: "Laura quiere despedir a dos vendedores de muchos años porque «no se adaptan al nuevo modelo». Sus números son bajos, pero son queridos por clientes clave.", ask: "¿Qué le respondes?", options: [
    { text: "Apoyarla: si no la dejas armar su equipo, no puedes exigirle resultados.", score: 1, why: "Autonomía sí, pero 45 días es poco para medir; y perder la relación con clientes clave es un riesgo tuyo también." },
    { text: "Pedirle un plan de 60 días con metas claras para ambos, y que acompañe las visitas a esos clientes.", score: 3, why: "Le das criterio sin quitarle la decisión: con hechos, decide ella; y protege las relaciones mientras." },
    { text: "Negarte: esos vendedores son la memoria comercial de la empresa.", score: 0, why: "Le quitas autoridad en su primer mes y proteges a personas por antigüedad, no por aporte." },
    { text: "Proponer que los muevan a atender solo esas cuentas clave.", score: 2, why: "Creativo y puede funcionar, pero si lo impones tú, Laura siente que le diseñan el equipo." },
  ] },
  { id: "n4", theme: "nuevo", min: 0, stage: "entrena", who: "Diego · ingeniero, 3 meses, empezó brillante", text: "Diego llegó con mucha energía, pero en las últimas semanas se ve apagado. Comete errores que antes no cometía y ya no propone nada.", ask: "¿Qué haces primero?", options: [
    { text: "Recordarle con amabilidad lo bien que empezó y que esperas eso de él.", score: 1, why: "Suena motivador, pero no averigua qué cambió; puede sentirse como presión." },
    { text: "Un 1 a 1 para preguntarle qué le está costando y explicarle el porqué de lo que no le ha salido.", score: 3, why: "Es el bache típico de «aprendiendo y frustrado»: necesita entrenamiento, escucha y que le expliques el porqué." },
    { text: "Darle un proyecto nuevo y emocionante para que recupere la chispa.", score: 1, why: "Más carga a alguien frustrado suele empeorar; primero hay que entender qué le pasa." },
    { text: "Asignarle un compañero con experiencia como mentor.", score: 2, why: "Ayuda mucho, pero sin hablar tú primero, puede leerlo como «mi jefe ya no confía en mí»." },
  ] },
  { id: "n5", theme: "nuevo", min: 2, who: "Mónica · nueva directora de finanzas, viene de una multinacional", text: "Mónica quiere implementar 14 controles nuevos y un sistema de aprobaciones. Operaciones dice que «con eso no vamos a poder comprar ni un tornillo».", ask: "¿Cómo lo resuelves?", options: [
    { text: "Apoyar a Mónica: los controles protegen a la empresa.", score: 1, why: "Proteges la caja, pero frenas la operación y la conviertes en la enemiga desde su primer trimestre." },
    { text: "Pedirle que priorice los 3 controles de mayor riesgo y los diseñe con operaciones.", score: 3, why: "Control proporcional al riesgo, construido con quien lo va a vivir. Así se adopta." },
    { text: "Decirle que aquí las cosas funcionan distinto que en una multinacional.", score: 0, why: "Descartas experiencia valiosa con un argumento que suena a «siempre lo hemos hecho así»." },
    { text: "Armar una junta entre ambos para que lleguen a un acuerdo.", score: 2, why: "Bien, pero sin un criterio claro (riesgo), la junta termina en una pelea de poder." },
  ] },

  // ─────────────────────────────────────────────── veterano
  { id: "v1", theme: "veterano", min: 0, stage: "apoya", who: "Don Ernesto · jefe de almacén, 28 años en la empresa", text: "Vas a implementar un sistema digital de inventarios. Don Ernesto dice que «el sistema está en mi cabeza» y no quiere usarlo. El resto del almacén hace lo que él hace.", ask: "¿Cómo lo abordas?", options: [
    { text: "Explicarle que es una decisión tomada y que todos lo van a usar.", score: 1, why: "La autoridad funciona a corto plazo; él la va a cumplir de mala gana y el equipo lo va a notar." },
    { text: "Pedirle que te ayude a diseñar cómo se carga el sistema, precisamente porque nadie sabe más que él.", score: 3, why: "Su conocimiento se vuelve el centro del cambio en vez de su amenaza. Y arrastra al resto." },
    { text: "Empezar con el resto del almacén y dejarlo a él al final.", score: 1, why: "Rodearlo lo aísla y lo convierte en opositor abierto." },
    { text: "Ofrecerle una capacitación personalizada.", score: 2, why: "Le quitas el miedo a no saber usarlo, pero no resuelve el miedo a dejar de ser indispensable." },
  ] },
  { id: "v2", theme: "veterano", min: 1, stage: "entrena", lesson: "conversaciones-2", who: "Patricia · gerente de compras, 15 años", text: "Patricia salió mal calificada en su evaluación anual por primera vez. Está ofendida: «15 años sin una queja y ahora resulta que no sirvo». Tiene razón en que nadie le había dicho nada antes.", ask: "¿Qué le dices?", options: [
    { text: "Subir su calificación: si nadie le avisó, no es justo.", score: 0, why: "Arreglas la sorpresa con una mentira y pierdes la oportunidad de que mejore." },
    { text: "Reconocer que debieron decírselo antes, sostener la evaluación con hechos y acordar un plan de 90 días con revisiones mensuales.", score: 3, why: "Asumes la falla del sistema sin cambiar la verdad. Y le das el camino que nunca tuvo." },
    { text: "Explicarle que los estándares subieron para todos y que debe adaptarse.", score: 1, why: "Puede ser cierto, pero ignora que nadie le comunicó el cambio." },
    { text: "Dejar que se calme y hablarlo en unas semanas.", score: 1, why: "Darle aire es humano, pero semanas de silencio confirman su sensación de injusticia." },
  ] },
  { id: "v3", theme: "veterano", min: 1, who: "Arturo · director de operaciones, 20 años, amigo del fundador", text: "Arturo bloquea en las juntas cualquier idea que venga de los gerentes jóvenes. Dos de ellos ya te dijeron que buscan trabajo.", ask: "¿Qué haces?", options: [
    { text: "Hablar con el fundador primero para no tener sorpresas.", score: 1, why: "Cuidar la política tiene sentido, pero empezar por ahí sugiere que no puedes manejar a tu equipo." },
    { text: "Un 1 a 1 con Arturo: lo que ves, el costo (dos renuncias) y pedirle que él patrocine una de esas ideas.", score: 3, why: "Directo, con hechos, y le das un rol constructivo en vez de solo pedirle que deje de bloquear." },
    { text: "Cambiar la dinámica de las juntas: que él hable al final.", score: 2, why: "Buena táctica, pero si no hablas con él del fondo, lo va a sentir como una maniobra." },
    { text: "Retener a los gerentes con aumentos mientras resuelves lo de Arturo.", score: 0, why: "El problema no es el sueldo; pagas por quedarse en un lugar donde no los escuchan." },
  ] },
  { id: "v4", theme: "veterano", min: 0, stage: "delega", who: "Lupita · coordinadora administrativa, 18 años, excelente", text: "Lupita hace todo perfecto y nunca pide nada. Te enteras por otra persona que se siente invisible: «a los nuevos los celebran por cualquier cosa».", ask: "¿Qué haces?", options: [
    { text: "Reconocerla en la próxima junta general.", score: 2, why: "Bien, pero un reconocimiento aislado después de 18 años puede sentirse como reacción." },
    { text: "Platicar con ella para entender qué le gustaría (retos, aprendizaje, visibilidad) y actuar sobre eso.", score: 3, why: "Experta y comprometida: necesita autonomía y que le preguntes qué quiere, no que adivines." },
    { text: "Darle un bono especial.", score: 1, why: "El dinero no responde a «me siento invisible»." },
    { text: "Pedirle que capacite a los nuevos.", score: 1, why: "Puede ser un reconocimiento o más trabajo sin crédito; depende de cómo lo planteas y de si ella lo quiere." },
  ] },
  { id: "v5", theme: "veterano", min: 2, who: "Ingeniero Salas · jefe de mantenimiento, 30 años, se jubila en 18 meses", text: "Salas es el único que sabe reparar las dos máquinas más críticas. No ha documentado nada y dice que «no hay quién aprenda».", ask: "¿Qué haces?", options: [
    { text: "Contratar ya a su reemplazo para que aprenda a su lado.", score: 2, why: "Necesario, pero si Salas siente que lo empujan a irse, va a guardar lo que sabe." },
    { text: "Hacer de su legado un proyecto: que elija y forme a dos personas, con reconocimiento y un bono por transferencia.", score: 3, why: "Convierte el miedo a irse en orgullo por dejar algo. Y el bono premia la transferencia, no el reemplazo." },
    { text: "Pedirle que documente todo en un manual.", score: 1, why: "Útil pero insuficiente: el conocimiento de 30 años no cabe en un manual." },
    { text: "Ofrecerle quedarse dos años más.", score: 1, why: "Pospones el problema sin resolverlo." },
  ] },

  // ─────────────────────────────────────────────── estrella
  { id: "e1", theme: "estrella", min: 0, lesson: "cultura-2", who: "Héctor · el vendedor #1, 30% de las ventas", text: "Héctor llega tarde a todas las juntas, no llena el sistema de clientes y se burla de los procesos. Los demás vendedores empiezan a imitarlo.", ask: "¿Qué haces?", options: [
    { text: "Tolerarlo: sus números lo justifican.", score: 0, why: "El equipo aprende que las reglas dependen de cuánto vendes." },
    { text: "Hablar con él en privado: lo valoras, y estas tres conductas tienen que cambiar porque el equipo las está copiando.", score: 3, why: "Hechos, impacto en el equipo y respeto. La misma regla que a cualquiera, sin humillarlo." },
    { text: "Quitarle el bono hasta que cumpla con el sistema.", score: 1, why: "Puede ser parte de la solución, pero sin conversación se siente como castigo y se va con la competencia." },
    { text: "Liberarlo de los procesos a cambio de que entregue sus clientes documentados.", score: 1, why: "Creativo, pero formaliza una excepción que todos van a ver." },
  ] },
  { id: "e2", theme: "estrella", min: 1, stage: "delega", who: "Sofía · tu mejor gerente, 4 años", text: "Sofía te pide hacerse cargo del proyecto más importante del año. Tiene el talento, pero ya está al 120% y su equipo empieza a resentirlo.", ask: "¿Qué decides?", options: [
    { text: "Dárselo: los mejores proyectos van a los mejores.", score: 1, why: "La premias con más carga hasta que se queme o descuide a su equipo." },
    { text: "Dárselo si primero delega una parte de lo que hoy hace, con un plan concreto.", score: 3, why: "La reta y a la vez la obliga a desarrollar a su gente. Crece ella y crece su equipo." },
    { text: "Decirle que no, para protegerla.", score: 1, why: "Decides por ella; puede leerlo como falta de confianza." },
    { text: "Dárselo a otra persona para desarrollar más talento.", score: 2, why: "Desarrollar a otros es valioso, pero sin explicárselo a Sofía la desmotivas." },
  ] },
  { id: "e3", theme: "estrella", min: 1, who: "Iván · programador estrella", text: "Iván produce lo de tres personas, pero en las revisiones de código humilla a los juniors. Uno ya pidió cambiarse de equipo.", ask: "¿Qué haces?", options: [
    { text: "Sacar a Iván de las revisiones de código.", score: 1, why: "Proteges a los juniors, pero pierdes su conocimiento y no resuelves la conducta." },
    { text: "Hablar con él: su conocimiento vale, su forma lo anula. Acordar cómo dar comentarios y revisar en un mes.", score: 3, why: "Separa a la persona de la conducta y le das una forma concreta de cambiar." },
    { text: "Pedirle al junior que no se lo tome personal.", score: 0, why: "Trasladas el problema a la víctima." },
    { text: "Mandar a Iván a un curso de habilidades blandas.", score: 1, why: "Un curso sin una conversación directa se siente como trámite." },
  ] },
  { id: "e4", theme: "estrella", min: 2, who: "Valeria · directora de marketing, la mejor del sector", text: "Una empresa más grande le ofrece a Valeria 40% más. Te dice que prefiere quedarse, pero «necesito ver que aquí hay futuro».", ask: "¿Qué haces?", options: [
    { text: "Igualar la oferta.", score: 1, why: "Ella dijo «futuro», no dinero. Si solo igualas, la siguiente oferta se la lleva." },
    { text: "Preguntarle qué significa «futuro» para ella y construir juntos un plan de crecimiento con fechas.", score: 3, why: "Respondes a lo que de verdad pidió. Y lo que acuerden lo puedes cumplir." },
    { text: "Prometerle la dirección general en dos años.", score: 0, why: "Prometer lo que no controlas destruye la confianza cuando no se cumple." },
    { text: "Dejarla ir con buena relación: nadie es indispensable.", score: 1, why: "Cierto en teoría, pero sin intentarlo pierdes a alguien que quería quedarse." },
  ] },
  { id: "e5", theme: "estrella", min: 3, who: "Raúl · director comercial, el más rentable del grupo", text: "Una auditoría encuentra que Raúl aprobó descuentos fuera de política a un cliente que es amigo suyo. Los números del cliente son buenos y Raúl dice que «fue para cerrar el año».", ask: "¿Qué haces?", options: [
    { text: "Amonestarlo por escrito y seguir.", score: 1, why: "Proporcional si fue un error aislado, pero no aclaras el conflicto de interés." },
    { text: "Investigar el conflicto de interés con el comité, apartarlo de esa cuenta mientras tanto, y decidir con hechos.", score: 3, why: "Proteges a la empresa y a Raúl: un proceso justo es su mejor defensa si no hubo mala fe." },
    { text: "No hacer nada: los resultados son buenos.", score: 0, why: "Los resultados no compran excepciones de ética." },
    { text: "Despedirlo para dar un mensaje.", score: 1, why: "Antes de investigar puede ser injusto y un riesgo legal." },
  ] },

  // ─────────────────────────────────────────────── bajo desempeño / evaluación
  { id: "d1", theme: "desempeno", min: 0, stage: "entrena", lesson: "conversaciones", who: "Jorge · supervisor de turno, 2 años", text: "Jorge tiene la productividad más baja de los tres turnos desde hace 4 meses. Es buena persona, el equipo lo quiere y nadie le ha dicho nada.", ask: "¿Cómo lo abordas?", options: [
    { text: "Mostrarle el comparativo de los tres turnos y preguntarle qué ve él.", score: 3, why: "Hechos, sin juicio, y empiezas escuchando: puede haber causas que él conoce y tú no." },
    { text: "Esperar a la evaluación anual para hablarlo formalmente.", score: 0, why: "Si es sorpresa en la evaluación, el que falló fuiste tú." },
    { text: "Ponerle un plan de mejora formal con fecha.", score: 2, why: "Puede hacer falta, pero empezar por ahí sin una conversación lo pone a la defensiva." },
    { text: "Pedirle al mejor supervisor que le enseñe.", score: 1, why: "Útil después; sin hablar primero, se siente exhibido frente a un par." },
  ] },
  { id: "d2", theme: "desempeno", min: 1, who: "Carmen · gerente de servicio, 6 años", text: "Carmen salió mal calificada en la evaluación anual. En la reunión de retroalimentación culpa a su equipo, al sistema y a ventas. Algo de razón tiene.", ask: "¿Qué haces?", options: [
    { text: "Reconocer lo que tiene razón, y regresar a lo que sí depende de ella con dos ejemplos concretos.", score: 3, why: "Validar lo real baja la defensa. Y regresar a su parte evita que la conversación se diluya." },
    { text: "Explicarle que un líder no culpa a su equipo.", score: 1, why: "Cierto, pero dicho así es un sermón y cierra la conversación." },
    { text: "Revisar a fondo sus argumentos antes de seguir con la evaluación.", score: 2, why: "Justo, pero si te desvías por completo nunca hablas de lo que depende de ella." },
    { text: "Suavizar la calificación porque hubo factores externos.", score: 0, why: "Le quitas la información que necesita para mejorar." },
  ] },
  { id: "d3", theme: "desempeno", min: 2, lesson: "personas-3", who: "Fernando · gerente regional, 3 planes de mejora en 2 años", text: "Fernando mejora un mes después de cada plan y luego vuelve a caer. Es leal, le tiene cariño el equipo, y tiene 54 años.", ask: "¿Qué decides?", options: [
    { text: "Un cuarto plan, esta vez con un mentor.", score: 1, why: "Después de tres ciclos, el patrón es claro; otro plan es posponer la decisión." },
    { text: "Ofrecerle otra posición donde sus fortalezas sí sirvan, o una salida digna y generosa.", score: 3, why: "Ya tuvo claridad, apoyo y tiempo. Lo justo es una decisión, hecha con respeto." },
    { text: "Dejarlo como está: su lealtad vale.", score: 0, why: "Su región paga el costo y los que sí cumplen lo ven." },
    { text: "Despedirlo esta semana.", score: 1, why: "La decisión puede ser correcta, pero la forma importa: sin alternativas ni cuidado mandas un mensaje duro a todos." },
  ] },
  { id: "d4", theme: "desempeno", min: 0, stage: "apoya", who: "Paola · analista, capaz pero insegura", text: "Paola hace buen trabajo pero tarda el doble porque revisa todo tres veces y siempre te pregunta antes de entregar. Su equipo se retrasa por esperarla.", ask: "¿Qué haces?", options: [
    { text: "Ponerle fechas más estrictas.", score: 1, why: "Atacas el síntoma; la inseguridad se va a convertir en ansiedad." },
    { text: "Decirle qué hace bien, darle permiso explícito de entregar sin revisarlo contigo y revisar juntos después.", score: 3, why: "Capaz pero insegura: necesita apoyo y confianza para soltar, no más control." },
    { text: "Revisar tú su trabajo antes de entregarlo para que se sienta segura.", score: 0, why: "Refuerzas la dependencia." },
    { text: "Mandarla a un curso de gestión del tiempo.", score: 1, why: "Su problema no es organizarse: es confiar en su criterio." },
  ] },
  { id: "d5", theme: "desempeno", min: 1, who: "Óscar · gerente de producción", text: "Óscar cumple sus números, pero lo logra pidiendo horas extra todo el tiempo. Su equipo está agotado y la rotación de su área duplica al resto.", ask: "¿Cómo lo evalúas?", options: [
    { text: "Bien: cumplió sus metas.", score: 0, why: "El resultado no fue sostenible; lo pagó la gente." },
    { text: "Cumplió el «qué» pero no el «cómo». Plan para bajar horas extra y rotación como metas de su evaluación.", score: 3, why: "Lo que no se mide, no se gestiona. Ahora el «cómo» cuenta." },
    { text: "Pedirle que baje las horas extra sin bajar la producción.", score: 1, why: "Sin ayudarle a cambiar el proceso es una orden imposible." },
    { text: "Contratar más gente para su área.", score: 2, why: "Puede ser parte de la solución, pero sin revisar cómo dirige puede repetir el patrón." },
  ] },

  // ─────────────────────────────────────────────── su equipo se queja
  { id: "q1", theme: "quejas", min: 0, who: "Beatriz · gerente de contabilidad", text: "Tres personas del equipo de Beatriz te buscan para quejarse: los «microgestiona», no les deja decidir nada y revisa sus correos antes de enviarlos.", ask: "¿Qué haces primero?", options: [
    { text: "Hablar con Beatriz y decirle lo que te dijeron.", score: 1, why: "Si revelas quién se quejó, pones en riesgo a esas personas." },
    { text: "Agradecerles, preguntar ejemplos concretos y observar tú antes de hablar con Beatriz.", score: 3, why: "Escuchas, juntas hechos y no actúas sobre una sola versión." },
    { text: "Decirles que lo hablen directo con ella.", score: 1, why: "Ideal en teoría, pero si vinieron contigo es porque no se sienten seguros de hacerlo." },
    { text: "Hacer una encuesta anónima a todo su equipo.", score: 2, why: "Da datos, pero si es solo su área, todos sabrán por qué." },
  ] },
  { id: "q2", theme: "quejas", min: 1, lesson: "conversaciones-2", who: "Marco · director de logística", text: "La encuesta de clima del equipo de Marco salió 30 puntos debajo del promedio. Él dice que «es porque soy exigente y los flojos se quejan».", ask: "¿Cómo lo abordas con él?", options: [
    { text: "Aceptarlo: alguien exigente no tiene que ser popular.", score: 0, why: "30 puntos no es «no ser popular»: es una alarma." },
    { text: "Revisar con él los comentarios concretos, separar exigencia de trato, y que presente a su equipo qué va a cambiar.", score: 3, why: "Ser exigente y ser respetuoso no se contraponen. Que lo presente él lo hace dueño del cambio." },
    { text: "Ponerle un coach ejecutivo.", score: 2, why: "Puede ayudar, pero sin conversación tuya primero, lo vive como castigo." },
    { text: "Hablar con su equipo para entender mejor.", score: 1, why: "Útil, pero pasarle por encima a Marco sin hablar con él lo debilita." },
  ] },
  { id: "q3", theme: "quejas", min: 0, who: "Elena · supervisora", text: "El equipo de Elena se queja de que ella tiene «favoritos»: a dos personas les da los mejores turnos y los proyectos interesantes.", ask: "¿Qué haces?", options: [
    { text: "Revisar los datos de turnos y asignaciones antes de hablar con ella.", score: 3, why: "Los hechos dicen si es percepción o realidad, y te dan de qué hablar." },
    { text: "Pedirle a Elena que rote los turnos.", score: 1, why: "Resuelves algo que no confirmaste y ella va a sentir que le creíste a la queja sin escucharla." },
    { text: "Ignorarlo: siempre hay quejas de favoritismo.", score: 0, why: "La percepción de injusticia destruye equipos aunque no sea real." },
    { text: "Hablar con las dos personas «favoritas».", score: 0, why: "Las expones y no son las responsables." },
  ] },
  { id: "q4", theme: "quejas", min: 2, who: "Ricardo · director de una unidad de negocio", text: "Te llega una carta anónima firmada «el equipo de Ricardo». Dice que cambia los objetivos a mitad del año y que nadie cobra bono.", ask: "¿Qué haces con una carta anónima?", options: [
    { text: "Ignorarla: si no la firman, no cuenta.", score: 0, why: "El anonimato indica miedo; descartarla confirma que hay razones para tenerlo." },
    { text: "Verificar lo verificable: historial de cambios de objetivos y pagos de bono de su área.", score: 3, why: "No necesitas saber quién la escribió para revisar si es cierto." },
    { text: "Leérsela a Ricardo y pedirle una explicación.", score: 1, why: "Él tiene derecho a responder, pero primero revisa los datos para saber qué preguntar." },
    { text: "Hacer una junta con su equipo para preguntar quién la escribió.", score: 0, why: "Convierte una queja en una cacería." },
  ] },
  { id: "q5", theme: "quejas", min: 1, who: "Gabriel · gerente, ascendido hace 4 meses desde su mismo equipo", text: "Los excompañeros de Gabriel se quejan: «desde que es jefe ya no es el mismo». Él siente que no lo respetan.", ask: "¿Qué haces?", options: [
    { text: "Decirle a Gabriel que establezca su autoridad.", score: 1, why: "Más autoridad sin relación empeora la tensión." },
    { text: "Ayudar a Gabriel a tener una conversación abierta con su equipo sobre el nuevo rol, y acompañarlo en sus primeros 1 a 1.", score: 3, why: "La transición de compañero a jefe es de las más difíciles: necesita que lo entrenes, no que lo dejes solo." },
    { text: "Hablar tú con el equipo para pedirles que lo respeten.", score: 1, why: "Lo debilitas: parece que necesita que su jefe lo defienda." },
    { text: "Moverlo a otro equipo donde nadie lo conozca.", score: 1, why: "Evitas el problema y él no aprende a liderar a quienes eran sus pares." },
  ] },

  // ─────────────────────────────────────────────── conducta y denuncias
  { id: "c1", theme: "conducta", min: 0, who: "Alberto · jefe de producción", text: "Te llega una denuncia por el canal de ética: Alberto le gritó e insultó a un operador frente a todo el turno. Hay testigos. Alberto es muy bueno en lo técnico.", ask: "¿Qué haces?", options: [
    { text: "Hablar con Alberto para que se disculpe con el operador.", score: 1, why: "La disculpa ayuda, pero saltarte el proceso deja al denunciante sin protección." },
    { text: "Activar el proceso: investigar con testigos, proteger al denunciante de represalias y decidir según lo que resulte.", score: 3, why: "El proceso protege a todos, incluido Alberto. Y el equipo ve que el canal funciona." },
    { text: "Esperar a ver si se repite.", score: 0, why: "Le enseñas a todo el turno que denunciar no sirve." },
    { text: "Suspender a Alberto de inmediato.", score: 1, why: "Puede proceder, pero sin escuchar su versión es injusto." },
  ] },
  { id: "c2", theme: "conducta", min: 1, lesson: "conversaciones-2", who: "Alberto · el mismo caso, ya investigado", text: "La investigación confirma los gritos y que no es la primera vez. Alberto reconoce que «se le fue» y dice que está bajo mucha presión por las metas que tú le pusiste.", ask: "¿Qué decides?", options: [
    { text: "Despedirlo: es reincidente.", score: 2, why: "Defendible, pero ignoras que la presión que señala puede ser real y repetirse con el siguiente." },
    { text: "Sanción formal, un compromiso por escrito con consecuencias claras si se repite, y revisar tú las metas.", score: 3, why: "Consecuencia firme por la conducta y responsabilidad tuya por el contexto. Las dos cosas." },
    { text: "Revisar las metas y darle otra oportunidad.", score: 1, why: "Resuelves el contexto, pero la conducta queda sin consecuencia." },
    { text: "Moverlo a un puesto sin gente a cargo.", score: 1, why: "Puede funcionar, pero sin consecuencia formal parece premio." },
  ] },
  { id: "c3", theme: "conducta", min: 2, who: "Ingeniero Ruiz · director de planta", text: "Una colaboradora denuncia comentarios inapropiados de Ruiz. Él lo niega. No hay testigos. Ruiz tiene 15 años impecables.", ask: "¿Qué haces?", options: [
    { text: "Creerle a Ruiz: su historial lo respalda.", score: 0, why: "Un historial no prueba nada sobre un hecho concreto, y desalienta futuras denuncias." },
    { text: "Investigación formal con alguien externo e imparcial, protección a la denunciante y separar sus líneas de reporte mientras tanto.", score: 3, why: "Sin testigos, la imparcialidad del proceso es lo único que puede dar una respuesta justa." },
    { text: "Moverla a ella a otra área para evitar conflictos.", score: 0, why: "Castigas a quien denuncia." },
    { text: "Hablar con los dos juntos para aclarar.", score: 0, why: "Una conversación cara a cara en una denuncia de este tipo expone a la denunciante." },
  ] },
  { id: "c4", theme: "conducta", min: 0, who: "Tere · ejecutiva de cuenta", text: "Tere publicó en sus redes una queja dura contra la empresa después de una discusión con su jefe. Ya la vieron clientes.", ask: "¿Qué haces?", options: [
    { text: "Pedirle que la borre de inmediato.", score: 1, why: "Atiende el síntoma; ella se siente callada y el conflicto sigue." },
    { text: "Hablar con ella para entender qué pasó con su jefe y, una vez escuchada, acordar cómo manejar la publicación.", score: 3, why: "Atiende la causa primero. Lo más probable es que, ya escuchada, ella misma decida retirarla." },
    { text: "Sancionarla según la política de redes sociales.", score: 1, why: "Puede proceder, pero sin escucharla confirmas lo que publicó." },
    { text: "Ignorarlo para no hacerlo más grande.", score: 0, why: "Clientes ya la vieron; y el conflicto con su jefe sigue ahí." },
  ] },
  { id: "c5", theme: "conducta", min: 1, who: "Samuel · gerente de ventas", text: "Te enteras de que Samuel promete a clientes fechas de entrega que operaciones no puede cumplir, para cerrar ventas. Los clientes luego se enojan con operaciones.", ask: "¿Cómo lo abordas?", options: [
    { text: "Hablar con él y mostrarle el costo con casos reales: quejas, penalizaciones y el desgaste de operaciones.", score: 3, why: "Hechos e impacto. Y abre la puerta a resolver el sistema: ¿cómo sabe qué fechas puede prometer?" },
    { text: "Penalizar su comisión cuando se incumpla una fecha prometida.", score: 2, why: "Alinea incentivos, pero sin conversación lo vive como castigo." },
    { text: "Pedirle a operaciones que se esfuerce más.", score: 0, why: "Premias la promesa irresponsable." },
    { text: "Exigir que todas sus cotizaciones pasen por ti.", score: 1, why: "Te vuelves el cuello de botella." },
  ] },

  // ─────────────────────────────────────────────── no sabe delegar
  { id: "g1", theme: "delegar", min: 0, lesson: "personas-2", who: "Andrea · gerente de proyectos", text: "Andrea trabaja hasta las 11 de la noche y su equipo se va a las 6 sin pendientes. Dice que «es más rápido si lo hago yo».", ask: "¿Qué haces?", options: [
    { text: "Pedirle que deje de trabajar tan tarde.", score: 1, why: "Atiendes el síntoma; mañana hace lo mismo." },
    { text: "Elegir con ella una tarea por persona para delegar esta semana, con nivel de autonomía claro, y revisarlo el viernes.", score: 3, why: "Delegar se aprende escalón por escalón. Empezar pequeño y revisar le da seguridad." },
    { text: "Asignarle tú tareas directamente a su equipo.", score: 0, why: "Le pasas por encima y le quitas autoridad." },
    { text: "Felicitarla por su compromiso.", score: 0, why: "Premias el patrón que la va a quemar." },
  ] },
  { id: "g2", theme: "delegar", min: 1, who: "Manuel · director de ingeniería", text: "Manuel delega, pero luego rehace el trabajo de su equipo sin decirles nada. Su equipo se enteró y ahora entregan cualquier cosa: «total, él lo va a cambiar».", ask: "¿Cómo lo abordas?", options: [
    { text: "Explicarle que rehacer el trabajo destruye la motivación de su equipo.", score: 2, why: "Correcto, pero sin darle una alternativa va a seguir igual." },
    { text: "Ayudarle a definir el estándar antes de delegar y a dar retroalimentación en vez de corregir en silencio.", score: 3, why: "El problema no es la calidad del equipo, es que nunca supieron qué era «bueno»." },
    { text: "Pedirle al equipo que entregue mejor trabajo.", score: 1, why: "El equipo responde al sistema que Manuel creó." },
    { text: "Dejar que Manuel siga: el trabajo final sale bien.", score: 0, why: "Él es el cuello de botella y su equipo no crece." },
  ] },
  { id: "g3", theme: "delegar", min: 2, who: "Tú mismo", text: "Tu asistente te enseña tu agenda de la semana: 38 juntas, 21 de ellas sobre temas que tus directores podrían decidir.", ask: "¿Qué haces?", options: [
    { text: "Cancelar las 21 juntas.", score: 1, why: "Si no les dices qué pueden decidir solos, te van a buscar por otro lado." },
    { text: "Definir con cada director qué decisiones son suyas, cuáles te consultan y cuáles te avisan después.", score: 3, why: "Claridad de derechos de decisión: así se delega a escala." },
    { text: "Delegar a tu asistente la decisión de qué juntas tomas.", score: 1, why: "Ella filtra agenda, no criterio de negocio." },
    { text: "Aceptarlo: un CEO tiene que estar en todo.", score: 0, why: "Un CEO que está en todo frena a toda la empresa." },
  ] },
  { id: "g4", theme: "delegar", min: 1, stage: "delega", who: "Pilar · gerente de calidad, experta", text: "Pilar te pide autonomía total sobre el presupuesto de su área. Tiene 8 años y nunca ha fallado, pero el presupuesto es grande.", ask: "¿Qué decides?", options: [
    { text: "Dársela con revisiones trimestrales de resultados.", score: 3, why: "Experta y comprometida: necesita autonomía y rendir cuentas por resultados, no por cada gasto." },
    { text: "Dársela pero aprobar tú los gastos mayores.", score: 2, why: "Prudente, pero si el límite es bajo, no es autonomía real." },
    { text: "Negarla: el presupuesto es responsabilidad del CEO.", score: 0, why: "Desperdicias criterio probado y la desmotivas." },
    { text: "Dársela a prueba por tres meses.", score: 2, why: "Razonable con alguien nuevo; con 8 años sin fallar puede sentirse como desconfianza." },
  ] },

  // ─────────────────────────────────────────────── ascensos y rechazos
  { id: "a1", theme: "ascenso", min: 1, lesson: "personas-3", who: "Dos candidatos para gerente de ventas", text: "Pedro es el mejor vendedor, pero no le interesa la gente. Karla vende menos, pero todos la buscan para pedirle ayuda. Pedro espera el puesto.", ask: "¿A quién asciendes?", options: [
    { text: "A Pedro: se lo ganó con números.", score: 1, why: "Pierdes al mejor vendedor y ganas un gerente que no quiere serlo." },
    { text: "A Karla, y a Pedro le das un rol de vendedor sénior con reconocimiento y compensación propios.", score: 3, why: "Asciendes por potencial de liderazgo y creas un camino de crecimiento para el experto." },
    { text: "A Karla, sin explicarle nada a Pedro.", score: 1, why: "La decisión es correcta, pero pierdes a Pedro." },
    { text: "A ninguno: buscar a alguien de fuera.", score: 1, why: "Les mandas a los dos el mensaje de que aquí no se crece." },
  ] },
  { id: "a2", theme: "ascenso", min: 1, lesson: "conversaciones-2", who: "Javier · coordinador, 3 años", text: "Javier esperaba el ascenso a gerente y no se lo dieron. Mañana se anuncia a otra persona.", ask: "¿Cómo se lo comunicas?", options: [
    { text: "Dejar que se entere en el anuncio general.", score: 0, why: "Enterarse en público es humillante." },
    { text: "Decírselo hoy en persona, explicarle por qué con honestidad y qué necesitaría para el próximo.", score: 3, why: "Respeto, verdad y un camino. Puede doler y aun así quedarse." },
    { text: "Decírselo y ofrecerle un aumento como compensación.", score: 1, why: "El dinero tapa la conversación sobre su desarrollo." },
    { text: "Decirle que fue muy cerrado y que la próxima es suya.", score: 0, why: "Prometer lo que no sabes genera otra decepción." },
  ] },
  { id: "a3", theme: "ascenso", min: 2, who: "Natalia · gerente, ascendida hace 6 meses", text: "Natalia no está funcionando como gerente: su equipo baja y ella está infeliz. Era excelente en su puesto anterior.", ask: "¿Qué haces?", options: [
    { text: "Darle más tiempo y un coach.", score: 2, why: "Puede ser suficiente; pregúntale primero si quiere seguir en el rol." },
    { text: "Conversar honestamente con ella: qué ves, cómo se siente, y abrir la opción de regresar a un rol experto sin que sea un fracaso.", score: 3, why: "Un regreso digno es mejor que un líder infeliz y un equipo que paga el costo." },
    { text: "Regresarla a su puesto anterior.", score: 1, why: "Sin hablarlo, es una humillación." },
    { text: "Esperar a la evaluación anual.", score: 0, why: "Seis meses más de daño a ella y a su equipo." },
  ] },

  // ─────────────────────────────────────────────── conflicto entre dos
  { id: "k1", theme: "conflicto", min: 0, lesson: "negociacion", who: "Lucía (Finanzas) y Héctor (Ventas)", text: "Lucía quiere cobrar a 30 días; Héctor dice que si no da 60, pierde clientes. Ya no se hablan y cada uno te busca por separado.", ask: "¿Qué haces?", options: [
    { text: "Decidir tú: 45 días para todos.", score: 1, why: "El punto medio no resuelve los intereses de ninguno y siguen sin hablarse." },
    { text: "Reunirlos y preguntar qué necesita cada uno detrás de su número: caja para Lucía, competitividad para Héctor.", score: 3, why: "Debajo de las posiciones hay intereses que se pueden combinar: plazo según cliente, descuento por pronto pago…" },
    { text: "Que lo resuelvan entre ellos.", score: 1, why: "Ya demostraron que no pueden; necesitan que facilites." },
    { text: "Darle la razón a Lucía: la caja manda.", score: 1, why: "Puede ser correcto en números, pero Héctor no va a ejecutarlo con convicción." },
  ] },
  { id: "k2", theme: "conflicto", min: 1, who: "Dos gerentes que compiten por el mismo puesto futuro", text: "Mariana y Tomás se sabotean: no comparten información y se culpan en las juntas. Los dos son buenos.", ask: "¿Qué haces?", options: [
    { text: "Hablar con los dos juntos: lo que ves, el costo para la empresa, y que su evaluación incluya colaborar.", score: 3, why: "Lo dices directo y cambias el incentivo: si compiten por el puesto, colaborar tiene que contar." },
    { text: "Ponerlos a trabajar en un proyecto juntos.", score: 2, why: "Puede funcionar si antes les dejas claro qué esperas; sin eso, se sabotean más." },
    { text: "Decirles a cada uno por separado que el otro es bueno.", score: 1, why: "Bien intencionado, pero no aborda la conducta." },
    { text: "Anunciar quién se queda con el puesto para terminar la competencia.", score: 1, why: "Si no es el momento, decides por presión." },
  ] },
  { id: "k3", theme: "conflicto", min: 2, who: "Tu director de operaciones y tu director comercial", text: "En la junta de comité, los dos se gritan. El resto del equipo mira hacia abajo. Todos esperan qué haces.", ask: "¿Qué haces en ese momento?", options: [
    { text: "Parar la junta y retomarla mañana.", score: 1, why: "Calma, pero el equipo no ve cómo se maneja un conflicto." },
    { text: "Intervenir con calma: «Los dos tienen un punto. Vamos a separar los hechos del tono», y luego hablar con cada uno en privado.", score: 3, why: "Modelas en vivo cómo se discute y luego atiendes la conducta en privado." },
    { text: "Dejar que terminen: el conflicto es sano.", score: 0, why: "El conflicto sano es de ideas, no de gritos. Tu silencio lo valida." },
    { text: "Regañarlos frente a todos.", score: 1, why: "Detiene la pelea pero los humilla, y el resto aprende que mejor no discutir." },
  ] },

  // ─────────────────────────────────────────────── quiere irse
  { id: "r1", theme: "retener", min: 0, lesson: "personas", who: "Daniela · tu mejor analista", text: "Daniela renuncia. En la entrevista de salida dice: «nunca supe si mi trabajo servía».", ask: "¿Qué haces?", options: [
    { text: "Ofrecerle más dinero para que se quede.", score: 1, why: "Ella no dijo nada de dinero." },
    { text: "Agradecerle la honestidad y preguntar si hay algo que cambiaría su decisión; y revisar cómo das retroalimentación a todo tu equipo.", score: 3, why: "Quizás no se quede, pero puedes evitar que se vayan los siguientes." },
    { text: "Aceptarla: la rotación es normal.", score: 1, why: "Normal sí, pero lo que dijo es una señal de algo que fallaste tú." },
    { text: "Pedirle que se quede un mes más para hacer la transición.", score: 1, why: "Necesario para la operación, pero no aborda lo que dijo." },
  ] },
  { id: "r2", theme: "retener", min: 1, who: "Luis · gerente de operaciones", text: "Te enteras por un proveedor de que Luis está entrevistándose en otra empresa. Él no te ha dicho nada.", ask: "¿Qué haces?", options: [
    { text: "Confrontarlo: «me enteré de que te estás yendo».", score: 1, why: "Lo pones a la defensiva y queman al proveedor." },
    { text: "En tu próximo 1 a 1, preguntarle abiertamente cómo se siente en su rol y qué le gustaría para el próximo año.", score: 3, why: "Le abres la puerta para que te lo diga sin acorralarlo." },
    { text: "Empezar a buscar su reemplazo.", score: 1, why: "Prudente, pero puede ser una profecía autocumplida." },
    { text: "Ofrecerle un aumento preventivo.", score: 1, why: "Sin saber por qué busca, es un tiro a ciegas." },
  ] },
  { id: "r3", theme: "retener", min: 2, who: "Tres ingenieros del mismo equipo", text: "En un mes renunciaron tres ingenieros del equipo de Claudia. Todos dicen «mejor oferta». Claudia dice que «el mercado está loco».", ask: "¿Qué investigas?", options: [
    { text: "Revisar los sueldos del mercado.", score: 1, why: "Útil, pero tres en un mes del mismo equipo apunta a algo más." },
    { text: "Hablar con los que se fueron (con alguien neutral) y con los que se quedan.", score: 3, why: "La gente se va de jefes, no de empresas. Necesitas la versión de ellos, no solo la de Claudia." },
    { text: "Confiar en Claudia: ella conoce a su equipo.", score: 0, why: "Ella puede ser parte del problema." },
    { text: "Subir los sueldos de su equipo.", score: 1, why: "Si el problema no es el sueldo, pagas más por lo mismo." },
  ] },

  // ─────────────────────────────────────────────── algo personal
  { id: "p1", theme: "personal", min: 0, who: "Rosa · coordinadora, 10 años", text: "El papá de Rosa está muy enfermo. Ella falta seguido y su trabajo se atrasa. No ha pedido nada formal.", ask: "¿Qué haces?", options: [
    { text: "Esperar a que ella pida algo.", score: 1, why: "Respetas su privacidad, pero puede no pedir por miedo." },
    { text: "Hablar con ella, preguntar qué necesita y acordar algo temporal: horario flexible, reasignar tareas, permiso.", score: 3, why: "Humanidad con un acuerdo claro: ella sabe qué esperar y el equipo también." },
    { text: "Reasignar su trabajo sin decirle.", score: 1, why: "Ayuda, pero puede sentir que la estás sacando." },
    { text: "Recordarle con amabilidad sus responsabilidades.", score: 0, why: "En este momento, eso es lo que menos necesita escuchar." },
  ] },
  { id: "p2", theme: "personal", min: 1, who: "Felipe · gerente, se divorcia", text: "Felipe está irritable y en dos juntas fue muy duro con su equipo. Te cuenta que se está divorciando.", ask: "¿Qué haces?", options: [
    { text: "Dejarlo pasar: está en un momento difícil.", score: 1, why: "Empatía con él, pero su equipo también paga el costo." },
    { text: "Mostrarle comprensión, ofrecer apoyo (terapia, días libres) y aun así decirle que con su equipo no puede ser así.", score: 3, why: "Las dos cosas son ciertas: lo apoyas y el estándar de trato no cambia." },
    { text: "Recomendarle que se tome vacaciones.", score: 2, why: "Puede ayudar, pero no aborda la conducta con su equipo." },
    { text: "Tratarlo como cualquier problema de conducta.", score: 1, why: "La conducta sí importa, pero ignorar el contexto es frío." },
  ] },
  { id: "p3", theme: "personal", min: 2, who: "Esteban · director, ansiedad y burnout", text: "Esteban te confiesa que tiene ansiedad y no duerme. Te pide que no se lo digas a nadie. Él está a cargo del lanzamiento más importante del año.", ask: "¿Qué haces?", options: [
    { text: "Quitarle el lanzamiento para protegerlo.", score: 1, why: "Decides por él y puede sentir que confesarlo le costó el puesto." },
    { text: "Agradecer la confianza, respetar la confidencialidad, ofrecerle apoyo profesional y preguntarle qué ajuste le ayudaría.", score: 3, why: "Él decide qué necesita. Tú facilitas sin exponerlo." },
    { text: "Decirle a Recursos Humanos para que lo apoyen.", score: 1, why: "Rompes una confidencialidad que te pidió." },
    { text: "Decirle que aguante hasta el lanzamiento.", score: 0, why: "Puedes perder a la persona y el lanzamiento." },
  ] },

  // ─────────────────────────────────────────────── despedir bien
  { id: "s1", theme: "salida", min: 1, who: "Julio · vendedor, 1 año", text: "Decidiste despedir a Julio por bajo desempeño sostenido. Tuvo dos planes de mejora. Es viernes por la tarde.", ask: "¿Cuándo y cómo?", options: [
    { text: "Hoy mismo, para cerrar la semana.", score: 1, why: "Viernes tarde lo deja todo el fin de semana sin poder resolver nada." },
    { text: "Lunes temprano, en privado, con el mensaje claro, el finiquito listo y un plan para que se despida del equipo.", score: 3, why: "Claridad, dignidad y tiempo para que resuelva lo práctico." },
    { text: "Por correo, para evitar una escena.", score: 0, why: "Lo difícil se dice en persona." },
    { text: "Dejar que lo haga Recursos Humanos.", score: 1, why: "Recursos Humanos acompaña, pero el jefe debe dar la cara." },
  ] },
  { id: "s2", theme: "salida", min: 2, lesson: "comunicacion-2", who: "Tu equipo, después del despido de alguien querido", text: "Despediste a Roberto, querido por todos, por una falta de ética confirmada. No puedes dar detalles. El equipo está molesto y hay rumores.", ask: "¿Qué le dices al equipo?", options: [
    { text: "Nada: es confidencial.", score: 0, why: "El silencio se llena con rumores, y el más común será que fue injusto." },
    { text: "Que Roberto ya no está, que fue por una razón seria que no puedes detallar por respeto a él, y que la misma regla aplica a todos.", score: 3, why: "Respetas su privacidad y das el mensaje que el equipo necesita: hay reglas y se aplican parejo." },
    { text: "Contar los detalles para que entiendan.", score: 0, why: "Expones a Roberto y a la empresa." },
    { text: "Decir que fue reestructura.", score: 0, why: "Una mentira que, cuando se sepa, te cuesta la credibilidad." },
  ] },
  { id: "s3", theme: "salida", min: 3, who: "Un recorte de 40 personas", text: "La caja obliga a recortar 40 puestos. Tu director de finanzas quiere hacerlo en un solo día, sin aviso previo, para evitar sabotajes.", ask: "¿Cómo lo haces?", options: [
    { text: "Como dice finanzas: rápido y en un solo día.", score: 1, why: "Rápido sí, pero sin cuidado la gente que se queda aprende que puede pasarle lo mismo de un día para otro." },
    { text: "En un solo día, pero cada jefe da la cara en persona, con indemnización justa, apoyo para recolocación, y tú hablas el mismo día con quienes se quedan.", score: 3, why: "Velocidad con dignidad. Quienes se quedan juzgan a la empresa por cómo trata a quienes se van." },
    { text: "Anunciarlo con un mes de anticipación.", score: 1, why: "Transparente, pero un mes de incertidumbre paraliza a todos." },
    { text: "Ofrecer retiro voluntario primero.", score: 2, why: "Buena opción, aunque suelen irse los mejores, los que tienen alternativas." },
  ] },
];

export const dilemmaById = (id: string) => DILEMMAS.find((d) => d.id === id);
export const bestOf = (d: Dilemma) => Math.max(...d.options.map((o) => o.score));
