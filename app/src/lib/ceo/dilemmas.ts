/**
 * mêtis CEO · Dilemas de personas.
 * Casos cortos y diarios sobre cómo abordar a cada colaborador según su momento
 * (liderazgo situacional), independientes de la empresa que estés dirigiendo.
 * Todas las opciones son defendibles: ninguna es «obvia». El puntaje (0–3) solo se
 * traduce en XP y en la explicación de qué haría un gran líder y por qué.
 */

import { DILEMMAS_V1 } from "./dilemmas-v1";

export type DilemmaTheme =
  | "nuevo" | "veterano" | "estrella" | "desempeno" | "quejas" | "conducta"
  | "delegar" | "ascenso" | "conflicto" | "retener" | "personal" | "salida";

/** Momento de la persona (liderazgo situacional). */
export type Stage = "dirige" | "entrena" | "apoya" | "delega";

export interface DilemmaOption {
  text: string;
  score: 0 | 1 | 2 | 3;
  why: string;
  /** Qué sacrificas con esta opción (versión 2: toda opción cuesta algo). */
  cost?: string;
}

export interface Dilemma {
  id: string;
  /** Versión 2: id del dilema de la versión 1 al que sustituye (no se vuelve a presentar a quien ya respondió el original). */
  replaces?: string;
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

export const THEMES: Record<DilemmaTheme, { label: string; hint: string }> = {
  nuevo: { label: "Alguien que acaba de llegar", hint: "Claridad, contexto y primeras victorias." },
  veterano: { label: "Alguien con muchos años", hint: "Respeto por la historia sin quedarse en ella." },
  estrella: { label: "Tu mejor elemento", hint: "Retos, reconocimiento y las mismas reglas." },
  desempeno: { label: "Bajo desempeño", hint: "Hechos, apoyo y fecha." },
  quejas: { label: "Su equipo se queja", hint: "Escuchar a ambos lados antes de concluir." },
  conducta: { label: "Conducta y denuncias", hint: "Proteger a las personas y seguir el proceso." },
  delegar: { label: "No sabe delegar", hint: "Del control a la confianza, escalón por escalón." },
  ascenso: { label: "Ascensos y rechazos", hint: "Potencial, no solo desempeño pasado." },
  conflicto: { label: "Conflicto entre dos", hint: "Intereses, no posiciones." },
  retener: { label: "Quiere irse", hint: "Lo que de verdad le falta casi nunca es dinero." },
  personal: { label: "Algo personal", hint: "Humanidad con límites claros." },
  salida: { label: "Despedir bien", hint: "Dignidad, claridad y el mensaje al equipo." },
};

export const STAGE_LABEL: Record<Stage, string> = { dirige: "Necesita dirección", entrena: "Necesita entrenamiento", apoya: "Necesita apoyo", delega: "Necesita autonomía" };

/**
 * Versión 2 (redacción «sin respuestas obvias»): cada dilema tiene al menos dos respuestas de criterio alto que
 * sacrifican cosas distintas, opciones de largo parecido, sin caricaturas, y cada opción dice qué cuesta.
 * Las respuestas ya dadas a la versión 1 se siguen calificando con la versión 1 (dilemmas-v1.ts): nada histórico cambia.
 */
export const DILEMMAS: Dilemma[] = [
  { id: "n1-v2", replaces: "n1", theme: "nuevo", min: 0, stage: "dirige", lesson: "personas", who: "Ana · analista, 2 semanas en la empresa", text: "Ana es entusiasta y ya te mandó tres ideas para «cambiar todo el proceso de pronósticos». Una de ellas es buena; dos ignoran cosas que ella todavía no conoce.", ask: "¿Cómo respondes?", options: [
    { text: "Tomar su idea buena, explicarle en diez minutos por qué las otras dos no aplican y darle un primer entregable.", score: 3, why: "Le das dirección clara sin apagar su energía: sabe qué es «bueno» aquí.", cost: "Te toma tiempo a ti y puede sentir que le corriges dos de tres." },
    { text: "Ponerla dos semanas con quien hoy hace los pronósticos y que después te proponga una sola mejora, ya con contexto.", score: 3, why: "Aprende el proceso real de quien lo vive y su siguiente idea llega mejor armada.", cost: "Su idea buena espera dos semanas y puede leerlo como un freno." },
    { text: "Implementar su idea buena con su nombre en la junta del equipo y dejar las otras dos para otro momento.", score: 2, why: "El reconocimiento temprano engancha a alguien nuevo.", cost: "Sin explicarle lo demás, seguirá proponiendo sin conocer la operación." },
    { text: "Agradecerle y pedirle que espere tres meses a conocer bien la operación y los clientes antes de proponer cambios.", score: 1, why: "Proteges el proceso de cambios mal informados.", cost: "Apagas el entusiasmo justo cuando más cuesta recuperarlo." },
  ] },
  { id: "n2-v2", replaces: "n2", theme: "nuevo", min: 0, stage: "dirige", who: "Rodrigo · gerente de planta, contratado de fuera hace un mes", text: "El equipo de Rodrigo no lo acepta: «él no conoce cómo hacemos las cosas aquí». Te piden en secreto que regrese el gerente anterior, que fue ascendido a otra área.", ask: "¿Qué haces?", options: [
    { text: "Pedirle al gerente anterior cuatro semanas de transición formal con Rodrigo, presentándolo él ante el equipo.", score: 3, why: "El respaldo del anterior transfiere confianza y Rodrigo aprende lo que no sabía.", cost: "Durante un mes el equipo sigue mirando al anterior como su jefe real." },
    { text: "Respaldar a Rodrigo y pedirle que en dos semanas recorra cada turno y presente qué conserva y qué cambia.", score: 3, why: "Le das autoridad y una tarea que lo obliga a conocer la planta antes de cambiarla.", cost: "Si la presentación sale mal, la resistencia se endurece." },
    { text: "Reunirte con el equipo, escuchar sus quejas concretas y pasárselas a Rodrigo con tus sugerencias.", score: 2, why: "Bajas la tensión y le das información útil.", cost: "Te vuelves el canal y Rodrigo no construye su relación directa." },
    { text: "Decirle a Rodrigo que se adapte primero a la forma de trabajar del equipo y que deje sus cambios para el segundo semestre.", score: 1, why: "Reduces el choque inmediato.", cost: "Lo contrataste de fuera justamente para traer algo distinto." },
  ] },
  { id: "n3-v2", replaces: "n3", theme: "nuevo", min: 1, stage: "dirige", lesson: "mentalidad-2", who: "Laura · directora comercial, llegó hace 45 días", text: "Laura quiere despedir a dos vendedores de muchos años porque «no se adaptan al nuevo modelo». Sus números son bajos, pero son queridos por clientes clave.", ask: "¿Qué haces?", options: [
    { text: "Pedirle que primero se gane la confianza de esas cuentas clave y vuelva a plantearlo en un trimestre.", score: 1, why: "Cuidas a los clientes.", cost: "Mandas el mensaje de que el cambio puede esperar y Laura pierde impulso." },
    { text: "Moverlos a atender solo esas cuentas clave, con metas propias, y dejar el resto del modelo a Laura.", score: 3, why: "Proteges la relación con los clientes y Laura tiene espacio para su modelo.", cost: "Dos excepciones al modelo nuevo que otros pueden pedir." },
    { text: "Respaldar a Laura: es su equipo y le pediste resultados. Que planee la transición de esos clientes.", score: 2, why: "Le das autoridad real a quien contrataste para cambiar el área.", cost: "Riesgo de perder clientes que confían en esos vendedores." },
    { text: "Pedirle un plan de 60 días con metas claras para ambos y acompañarlos tú en las visitas clave.", score: 3, why: "Decides con evidencia y no con el entusiasmo de la recién llegada.", cost: "Retrasa dos meses la decisión de Laura y le resta autoridad." },
  ] },
  { id: "n4-v2", replaces: "n4", theme: "nuevo", min: 0, stage: "entrena", who: "Diego · ingeniero, 3 meses, empezó brillante", text: "Diego llegó con mucha energía, pero en las últimas semanas se ve apagado. Comete errores que antes no cometía y ya no propone nada.", ask: "¿Qué haces primero?", options: [
    { text: "Una conversación a solas para preguntarle qué le está costando y explicarle el porqué de lo que no le sale.", score: 3, why: "Es el bache típico de quien aprende y se frustra: necesita escucha y explicación.", cost: "Puede no abrirse a la primera y tendrás que volver a intentarlo." },
    { text: "Asignarle como mentor a un ingeniero con experiencia, presentado como apoyo para su siguiente proyecto.", score: 3, why: "Le das entrenamiento diario con alguien cercano a su trabajo.", cost: "Si no hablas tú antes, puede leerlo como falta de confianza." },
    { text: "Revisar su carga y quitarle por un mes la tarea donde más se equivoca, para que recupere el ritmo.", score: 2, why: "Bajas la presión donde más le duele.", cost: "Atiendes el síntoma sin saber qué cambió." },
    { text: "Darle un proyecto nuevo y emocionante, con un cliente importante, para que recupere la chispa con algo que le guste.", score: 1, why: "Apuestas a su motivación.", cost: "Más carga a alguien frustrado suele empeorar el bache." },
  ] },
  { id: "n5-v2", replaces: "n5", theme: "nuevo", min: 2, who: "Mónica · nueva directora de finanzas, viene de una multinacional", text: "Mónica quiere implementar 14 controles nuevos y un sistema de aprobaciones. Operaciones dice que «con eso no vamos a poder comprar ni un tornillo».", ask: "¿Cómo lo resuelves?", options: [
    { text: "Pedirle que arranque con los tres controles de mayor riesgo, diseñados con operaciones, y medir en un trimestre.", score: 3, why: "Control proporcional al riesgo y hecho con quien lo va a vivir.", cost: "Once riesgos menores quedan abiertos unos meses." },
    { text: "Aprobar los 14 controles con un límite de monto: abajo de él, operaciones compra sin aprobación previa.", score: 3, why: "Proteges la caja desde el primer día sin frenar lo cotidiano.", cost: "Hay que vigilar que nadie parta compras para quedar abajo del límite." },
    { text: "Respaldar a Mónica completo: los controles protegen a la empresa y operaciones se tendrá que adaptar.", score: 2, why: "La caja queda protegida y Mónica siente respaldo.", cost: "Operaciones se frena y Mónica empieza como enemiga del área." },
    { text: "Pedirle que adapte su propuesta, porque aquí la operación necesita más agilidad que en una multinacional de su tamaño.", score: 1, why: "Cuidas la velocidad de la operación.", cost: "Descartas experiencia valiosa sin un criterio claro de riesgo." },
  ] },
  { id: "v1-v2", replaces: "v1", theme: "veterano", min: 0, stage: "apoya", who: "Don Ernesto · jefe de almacén, 28 años en la empresa", text: "Vas a implementar un sistema digital de inventarios. Don Ernesto dice que «el sistema está en mi cabeza» y no quiere usarlo. El resto del almacén hace lo que él hace.", ask: "¿Cómo lo abordas?", options: [
    { text: "Pedirle que diseñe contigo cómo se carga el sistema, porque nadie conoce el almacén mejor que él.", score: 3, why: "Su conocimiento se vuelve el centro del cambio y arrastra al resto.", cost: "El arranque se vuelve más lento y depende de su ritmo." },
    { text: "Explicarle que la decisión está tomada, darle fecha de arranque y una capacitación personal de dos días.", score: 2, why: "Claridad y apoyo práctico: sabe qué va a pasar y cómo.", cost: "Puede cumplir de mala gana y el equipo lo va a notar." },
    { text: "Arrancar con dos personas jóvenes del almacén y que don Ernesto valide cada semana si los datos cuadran.", score: 3, why: "Avanzas sin esperarlo y le das un papel de experto que revisa.", cost: "Si se siente rodeado, puede volverse opositor abierto." },
    { text: "Dejar el almacén fuera de la primera fase y volver con él cuando el resto de la empresa ya lo use.", score: 1, why: "Evitas el choque ahora.", cost: "El inventario, que es lo más crítico, se queda sin sistema." },
  ] },
  { id: "v2-v2", replaces: "v2", theme: "veterano", min: 1, stage: "entrena", lesson: "conversaciones-2", who: "Patricia · gerente de compras, 15 años", text: "Patricia salió mal calificada en su evaluación anual por primera vez. Está ofendida: «15 años sin una queja y ahora resulta que no sirvo». Tiene razón en que nadie le había dicho nada antes.", ask: "¿Qué le dices?", options: [
    { text: "Reconocer que debieron decírselo antes, sostener la evaluación con hechos y acordar revisiones mensuales.", score: 3, why: "Asumes la falla del sistema sin cambiar la verdad.", cost: "La conversación será tensa y puede salir aún molesta." },
    { text: "Dejar la calificación como «en revisión» 90 días con metas concretas y decidir la final con esos datos.", score: 3, why: "Corriges la sorpresa sin regalarle la calificación.", cost: "Otros pueden pedir el mismo trato en su evaluación." },
    { text: "Explicarle que los estándares de compras subieron para todos este año y que la evaluación se aplica igual a todo el equipo.", score: 1, why: "Defiendes la consistencia del proceso.", cost: "Ignoras que nadie le comunicó el cambio." },
    { text: "Subir su calificación a «cumple» porque nadie le avisó, y pedirle que mejore para el año que entra.", score: 1, why: "Reparas la injusticia de la sorpresa.", cost: "Le quitas la información que necesita para mejorar." },
  ] },
  { id: "v3-v2", replaces: "v3", theme: "veterano", min: 1, who: "Arturo · director de operaciones, 20 años, amigo del fundador", text: "Arturo bloquea en las juntas cualquier idea que venga de los gerentes jóvenes. Dos de ellos ya te dijeron que buscan trabajo.", ask: "¿Qué haces?", options: [
    { text: "Hablar a solas con Arturo: lo que ves, el costo de dos renuncias y pedirle que patrocine una de esas ideas.", score: 3, why: "Directo, con hechos, y le das un papel constructivo.", cost: "Si se ofende, puede llevarlo al fundador antes que tú." },
    { text: "Cambiar el formato de las juntas: los gerentes presentan, se vota y Arturo opina al final.", score: 2, why: "Abres espacio a las ideas sin depender de que él cambie.", cost: "Si no hablas del fondo, lo vivirá como una maniobra." },
    { text: "Darle a los dos gerentes un proyecto propio que te reporte a ti directo durante seis meses.", score: 3, why: "Retienes talento ya y pruebas sus ideas fuera del bloqueo.", cost: "Arturo puede sentir que lo rodeas y la tensión crece." },
    { text: "Hablar primero con el fundador para tener su respaldo antes de tocar el tema con Arturo.", score: 1, why: "Cuidas la política interna.", cost: "Sugiere que no puedes manejar a tu propio equipo." },
  ] },
  { id: "v4-v2", replaces: "v4", theme: "veterano", min: 0, stage: "delega", who: "Lupita · coordinadora administrativa, 18 años, excelente", text: "Lupita hace todo perfecto y nunca pide nada. Te enteras por otra persona que se siente invisible: «a los nuevos los celebran por cualquier cosa».", ask: "¿Qué haces?", options: [
    { text: "Platicar con ella para saber qué le gustaría (retos, aprendizaje, visibilidad) y actuar sobre eso.", score: 3, why: "Le preguntas qué quiere en vez de adivinar.", cost: "Si no se abre contigo, la conversación se queda en cortesía." },
    { text: "Darle a su cargo un proceso que hoy nadie domina y presentarla tú como responsable ante la dirección.", score: 3, why: "La autonomía y la visibilidad son reconocimiento que se nota.", cost: "Más trabajo; si no lo quiere, lo vive como carga." },
    { text: "Reconocerla en la próxima junta general con ejemplos concretos de lo que ha sostenido estos años.", score: 2, why: "Hace visible lo que nadie veía.", cost: "Un reconocimiento aislado puede sentirse como reacción." },
    { text: "Darle un bono especial este mes como agradecimiento por sus 18 años de trabajo impecable en el área.", score: 1, why: "Un gesto concreto y rápido.", cost: "El dinero no responde a «me siento invisible»." },
  ] },
  { id: "v5-v2", replaces: "v5", theme: "veterano", min: 2, who: "Ingeniero Salas · jefe de mantenimiento, 30 años, se jubila en 18 meses", text: "Salas es el único que sabe reparar las dos máquinas más críticas. No ha documentado nada y dice que «no hay quién aprenda».", ask: "¿Qué haces?", options: [
    { text: "Contratar ya a su reemplazo, con experiencia en esas máquinas, para que trabaje a su lado un año.", score: 3, why: "Atacas el riesgo con la solución más rápida y segura.", cost: "Pagas dos sueldos un año y Salas puede sentirse desplazado." },
    { text: "Ofrecerle quedarse dos años más como asesor de medio tiempo, con la tarea de documentar todo.", score: 1, why: "Compras tiempo con buena relación.", cost: "El riesgo de fondo sigue ahí, solo más tarde." },
    { text: "Contratar al fabricante un contrato de servicio y que sus técnicos documenten las reparaciones.", score: 2, why: "Quitas la dependencia de una sola persona sin pelear con ella.", cost: "Contrato caro y el conocimiento queda fuera de la empresa." },
    { text: "Hacer de su legado un proyecto: que elija y forme a dos personas, con reconocimiento y un bono.", score: 3, why: "Conviertes su resistencia en orgullo y el conocimiento se queda en casa.", cost: "Depende de que Salas quiera enseñar; si no, pierdes meses." },
  ] },
  { id: "e1-v2", replaces: "e1", theme: "estrella", min: 0, lesson: "cultura-2", who: "Héctor · el vendedor número uno, 30 % de las ventas", text: "Héctor llega tarde a todas las juntas, no llena el sistema de clientes y se burla de los procesos. Los demás vendedores empiezan a imitarlo.", ask: "¿Qué haces?", options: [
    { text: "Hablar con él a solas: lo valoras, y estas tres conductas cambian porque el equipo ya las copia.", score: 3, why: "Misma regla que para cualquiera, con respeto y hechos.", cost: "Puede molestarse y bajar el ritmo unas semanas." },
    { text: "Ligar desde este mes una parte de la comisión de todos a tener sus clientes al día en el sistema.", score: 3, why: "Cambias el incentivo para todos sin hacer de Héctor el caso.", cost: "Si no lo hablas con él, lo leerá como una regla hecha en su contra." },
    { text: "Liberarlo de juntas y del sistema a cambio de que entregue cada mes su cartera documentada.", score: 1, why: "Conservas sus ventas y recuperas la información.", cost: "Formalizas una excepción que todo el equipo va a ver." },
    { text: "Tolerarlo este trimestre por sus números y retomar el tema con él cuando cierre el año fiscal.", score: 1, why: "No arriesgas el 30 % de las ventas en temporada alta.", cost: "El equipo aprende que las reglas dependen de cuánto vendes." },
  ] },
  { id: "e2-v2", replaces: "e2", theme: "estrella", min: 1, stage: "delega", who: "Sofía · tu mejor gerente, 4 años", text: "Sofía te pide el proyecto más importante del año. Tiene el talento, pero ya está al 120 % y su equipo empieza a resentirlo.", ask: "¿Qué decides?", options: [
    { text: "Dárselo ya y reforzar a su equipo con una contratación temporal durante el proyecto.", score: 2, why: "Va la mejor persona y su equipo recibe ayuda real.", cost: "Costo extra y Sofía sigue al 120 %." },
    { text: "Dárselo a otra persona con potencial y que Sofía la asesore como mentora una vez por semana.", score: 3, why: "Desarrollas más talento y Sofía sigue cerca del proyecto.", cost: "Sofía puede sentir que no confías en ella." },
    { text: "Decirle que este año no y prometerle el siguiente proyecto grande cuando se libere su carga.", score: 1, why: "La proteges del desgaste.", cost: "Tu mejor gerente se queda sin el reto que pidió." },
    { text: "Dárselo si primero delega una parte de lo que hoy hace, con un plan concreto y fechas.", score: 3, why: "Aprovechas su talento sin quemar a su equipo.", cost: "Si no delega a tiempo, el proyecto arranca tarde." },
  ] },
  { id: "e3-v2", replaces: "e3", theme: "estrella", min: 1, who: "Iván · programador estrella", text: "Iván produce lo de tres personas, pero en las revisiones de código humilla a los juniors. Uno ya pidió cambiarse de equipo.", ask: "¿Qué haces?", options: [
    { text: "Hablar con él: su conocimiento vale y su forma lo anula. Acordar cómo dar comentarios y revisar en un mes.", score: 3, why: "Separas a la persona de la conducta y le das una forma concreta de cambiar.", cost: "Si no cambia, en un mes estás en el mismo lugar y con un junior menos." },
    { text: "Sacarlo de las revisiones a juniors y darle la arquitectura del sistema, donde su nivel rinde más.", score: 3, why: "Proteges a los juniors hoy y usas mejor su talento.", cost: "Los juniors pierden a quien más sabe y la conducta no se trabaja." },
    { text: "Cambiar todas las revisiones de código a un formato escrito, con una guía de comentarios que aplique a todo el equipo.", score: 2, why: "Arreglas el sistema y bajas el trato personal.", cost: "Iván puede seguir siendo duro por escrito." },
    { text: "Pedirle al junior que aguante un par de meses porque trabajar con Iván es lo que más le va a enseñar.", score: 1, why: "Retienes el aprendizaje técnico.", cost: "Trasladas el problema a quien lo sufre." },
  ] },
  { id: "e4-v2", replaces: "e4", theme: "estrella", min: 2, who: "Valeria · directora de marketing, la mejor del sector", text: "Una empresa más grande le ofrece a Valeria 40 % más. Te dice que prefiere quedarse, pero «necesito ver que aquí hay futuro».", ask: "¿Qué haces?", options: [
    { text: "Preguntarle qué significa «futuro» para ella y construir un plan de crecimiento con fechas.", score: 3, why: "Entiendes qué le falta antes de ofrecer algo que no busca.", cost: "Si lo que quiere es dinero, el plan llega tarde." },
    { text: "Dejarla ir en buenos términos y ascender a su número dos, que ya está listo para el puesto.", score: 1, why: "Nadie es indispensable y desarrollas a otra persona.", cost: "Pierdes a la mejor del sector en un año clave." },
    { text: "Igualar una parte del sueldo y darle a su cargo la nueva línea de negocio que arranca en enero.", score: 3, why: "Respondes con dinero y con reto: las dos cosas pesan.", cost: "Rompe la banda salarial y otros directores lo notarán." },
    { text: "Igualar la oferta completa y atarla dos años con un bono de permanencia semestral.", score: 2, why: "Retienes a la mejor del sector sin rodeos.", cost: "Pagas caro y no sabes si se queda por convicción." },
  ] },
  { id: "e5-v2", replaces: "e5", theme: "estrella", min: 3, who: "Raúl · director comercial, el más rentable del grupo", text: "Una auditoría encuentra que Raúl aprobó descuentos fuera de política a un cliente que es amigo suyo. Los números del cliente son buenos y Raúl dice que «fue para cerrar el año».", ask: "¿Qué haces?", options: [
    { text: "Investigar el conflicto de interés con el comité, apartarlo de esa cuenta y decidir con los hechos.", score: 3, why: "Un proceso justo protege a la empresa y a Raúl.", cost: "La cuenta sufre unas semanas y Raúl puede sentirse acusado." },
    { text: "Amonestarlo por escrito, revertir los descuentos fuera de política y bajar su límite de aprobación.", score: 2, why: "Consecuencia rápida y proporcional si fue un error aislado.", cost: "No aclaras si hubo conflicto de interés." },
    { text: "Pedir al comité de auditoría que revise todas sus cuentas de tres años antes de cualquier sanción.", score: 3, why: "Si hay un patrón, lo encuentras; si no, lo limpias con evidencia.", cost: "Tarda meses y el rumor corre en el área comercial." },
    { text: "Separarlo hoy de la empresa por pérdida de confianza y anunciarlo como mensaje a toda el área.", score: 0, why: "Mensaje contundente sobre la política.", cost: "Sin investigar es injusto y expone a la empresa a una demanda." },
  ] },
  { id: "d1-v2", replaces: "d1", theme: "desempeno", min: 0, stage: "entrena", lesson: "conversaciones", who: "Jorge · supervisor de turno, 2 años", text: "Jorge tiene la productividad más baja de los tres turnos desde hace 4 meses. Es buena persona, el equipo lo quiere y nadie le ha dicho nada.", ask: "¿Cómo lo abordas?", options: [
    { text: "Mostrarle el comparativo de los tres turnos y preguntarle qué ve él antes de proponer nada.", score: 3, why: "Hechos sin juicio y empiezas escuchando: puede haber causas que no conoces.", cost: "Si no reconoce el problema, pierdes una semana." },
    { text: "Decirle con claridad que su turno está abajo, fijar una meta a 60 días y revisarla cada dos semanas.", score: 3, why: "Cuatro meses sin decirle nada ya fue demasiado: hoy necesita claridad.", cost: "Puede ponerse a la defensiva si no sabe por qué." },
    { text: "Pedirle al supervisor del mejor turno que trabaje con él un mes y le comparta qué hace distinto.", score: 2, why: "Aprendizaje práctico de un par.", cost: "Sin hablar tú primero, puede sentirse exhibido." },
    { text: "Esperar a la evaluación anual para hablarlo formalmente, con los datos de todo el año completo.", score: 1, why: "Tendrás un registro más completo.", cost: "Si le llega por sorpresa en la evaluación, el que falló fuiste tú." },
  ] },
  { id: "d2-v2", replaces: "d2", theme: "desempeno", min: 1, who: "Carmen · gerente de servicio, 6 años", text: "Carmen salió mal calificada en la evaluación anual. En la reunión de retroalimentación culpa a su equipo, al sistema y a ventas. Algo de razón tiene.", ask: "¿Qué haces?", options: [
    { text: "Reconocer lo que tiene razón y regresar a lo que sí depende de ella, con dos ejemplos concretos.", score: 3, why: "Validar lo real baja la defensa y la conversación no se diluye.", cost: "Puede quedarse solo con la parte en que le diste razón." },
    { text: "Pausar la evaluación una semana, revisar sus argumentos con datos y retomarla con hechos.", score: 3, why: "Si tiene algo de razón, la calificación merece revisarse.", cost: "Puede leerlo como que la evaluación es negociable." },
    { text: "Separar la conversación: hoy su evaluación, y en otra junta los problemas del sistema y de ventas.", score: 2, why: "Mantienes el foco sin descartar lo que dice.", cost: "Puede sentir que la escuchas solo después." },
    { text: "Explicarle que un buen líder responde por su equipo y que señalar a otros no le ayuda a nadie.", score: 1, why: "Pones el estándar de responsabilidad.", cost: "Dicho así es un sermón y cierra la conversación." },
  ] },
  { id: "d3-v2", replaces: "d3", theme: "desempeno", min: 2, lesson: "personas-3", who: "Fernando · gerente regional, 3 planes de mejora en 2 años", text: "Fernando mejora un mes después de cada plan y luego vuelve a caer. Es leal, el equipo le tiene cariño, y tiene 54 años.", ask: "¿Qué decides?", options: [
    { text: "Ofrecerle otra posición donde sus fortalezas sí sirvan, con el mismo sueldo y fecha de cambio.", score: 3, why: "Ya tuvo claridad, apoyo y tiempo: lo justo es decidir con respeto.", cost: "Si no hay un puesto real, inventarlo solo pospone el problema." },
    { text: "Una salida digna: indemnización arriba de la ley, apoyo para recolocarse y despedida con su equipo.", score: 3, why: "Cierras un ciclo que no mejora y cuidas la forma.", cost: "Pierdes su lealtad y el equipo resiente la salida." },
    { text: "Un cuarto plan de mejora, esta vez con un mentor externo, metas por trimestre y revisiones cada dos semanas.", score: 1, why: "Le das una oportunidad más con más apoyo.", cost: "Después de tres ciclos el patrón es claro: otro plan pospone la decisión." },
    { text: "Dejarlo como está porque su lealtad vale y bajar la meta de su región para que pueda cumplirla.", score: 0, why: "Cuidas a una persona leal.", cost: "Su región paga el costo y los que sí cumplen lo ven." },
  ] },
  { id: "d4-v2", replaces: "d4", theme: "desempeno", min: 0, stage: "apoya", who: "Paola · analista, capaz pero insegura", text: "Paola hace buen trabajo pero tarda el doble porque revisa todo tres veces y siempre te pregunta antes de entregar. Su equipo se retrasa por esperarla.", ask: "¿Qué haces?", options: [
    { text: "Decirle qué hace bien, darle permiso de entregar sin revisarlo contigo y revisar juntos después.", score: 3, why: "Necesita confianza para soltar, no más control.", cost: "Las primeras entregas pueden salir con errores pequeños." },
    { text: "Acordar con ella qué entregas son de bajo riesgo y que esas salgan sin tu revisión desde hoy.", score: 3, why: "Le das un límite claro donde practicar su criterio.", cost: "Lo de alto riesgo sigue pasando por ti un tiempo." },
    { text: "Ponerle fechas de entrega más cortas y decirle con claridad que el equipo depende de su ritmo.", score: 2, why: "El equipo deja de esperar.", cost: "Atacas el síntoma; la inseguridad puede volverse ansiedad." },
    { text: "Revisar tú su trabajo antes de cada entrega por un mes, para que gane seguridad poco a poco.", score: 1, why: "Le das tranquilidad inmediata.", cost: "Refuerzas la dependencia que la frena." },
  ] },
  { id: "d5-v2", replaces: "d5", theme: "desempeno", min: 1, who: "Óscar · gerente de producción", text: "Óscar cumple sus números, pero lo logra con horas extra todo el tiempo. Su equipo está agotado y la rotación de su área duplica al resto.", ask: "¿Cómo lo manejas?", options: [
    { text: "Poner en su evaluación las horas extra y la rotación, al mismo nivel que la producción.", score: 3, why: "Le dices que el «cómo» también cuenta y lo vuelves medible.", cost: "Puede bajar la producción mientras aprende a dirigir distinto." },
    { text: "Revisar con él dónde se pierden las horas: paros, cambios de turno, mantenimiento.", score: 3, why: "Buscas la causa con datos antes de exigir un resultado distinto.", cost: "Tarda semanas y el equipo sigue cansado mientras tanto." },
    { text: "Contratar tres personas para su área y bajar las horas extra a la mitad en un trimestre.", score: 2, why: "Atacas la carga real; quizá el problema es de capacidad.", cost: "Más nómina sin saber si Óscar cambia su forma de dirigir." },
    { text: "Pedirle que baje las horas extra sin bajar la producción y revisar juntos en un mes.", score: 1, why: "Le pones un límite claro.", cost: "Sin apoyo ni análisis, es pedir lo mismo con menos." },
  ] },
  { id: "q1-v2", replaces: "q1", theme: "quejas", min: 0, who: "Beatriz · gerente de contabilidad", text: "Tres personas del equipo de Beatriz te buscan para quejarse: los «microgestiona», no les deja decidir nada y revisa sus correos antes de enviarlos.", ask: "¿Qué haces primero?", options: [
    { text: "Agradecerles, pedir ejemplos concretos y observar tú unas semanas antes de hablar con Beatriz.", score: 3, why: "Juntas hechos y no actúas sobre una sola versión.", cost: "Mientras observas, el equipo siente que no pasa nada." },
    { text: "Hablar con Beatriz esta semana de lo que ves en el área, sin revelar quién te buscó.", score: 3, why: "Le das la oportunidad de corregir pronto.", cost: "Sin ejemplos propios, puede ponerse a la defensiva." },
    { text: "Hacer una encuesta anónima de clima a toda el área de finanzas, no solo a su equipo.", score: 2, why: "Datos sin exponer a nadie.", cost: "Tarda y la queja puede diluirse en el promedio." },
    { text: "Decirles que primero lo hablen directo con ella y que, si no cambia, regresen contigo.", score: 1, why: "Fomentas la conversación directa.", cost: "Si vinieron contigo, es porque no se sienten seguros de hacerlo." },
  ] },
  { id: "q2-v2", replaces: "q2", theme: "quejas", min: 1, lesson: "conversaciones-2", who: "Marco · director de logística", text: "La encuesta de clima del equipo de Marco salió 30 puntos debajo del promedio. Él dice que «es porque soy exigente y los flojos se quejan».", ask: "¿Cómo lo abordas con él?", options: [
    { text: "Revisar con él los comentarios concretos, separar exigencia de trato y que presente qué va a cambiar.", score: 3, why: "Exigir y respetar no se contraponen; que lo presente él lo hace dueño.", cost: "Puede minimizar los comentarios y tomará tiempo." },
    { text: "Ponerle una meta de clima para el próximo semestre, con el mismo peso que sus metas de servicio.", score: 3, why: "Le dices que el trato también se mide y le das un número.", cost: "Sin hablar de los comentarios, puede no saber qué cambiar." },
    { text: "Asignarle un coach ejecutivo seis meses para trabajar su estilo de liderazgo con su equipo.", score: 2, why: "Apoyo profesional para cambiar.", cost: "Si no hablas tú primero, lo vive como castigo." },
    { text: "Hablar tú con su equipo para entender mejor qué pasa antes de tocar el tema con Marco en persona.", score: 1, why: "Más información de primera mano.", cost: "Pasarle por encima lo debilita frente a su equipo." },
  ] },
  { id: "q3-v2", replaces: "q3", theme: "quejas", min: 0, who: "Elena · supervisora", text: "El equipo de Elena se queja de que ella tiene «favoritos»: a dos personas les da los mejores turnos y los proyectos interesantes.", ask: "¿Qué haces primero?", options: [
    { text: "Reunir a todo su equipo para escuchar los ejemplos concretos antes de hablar con Elena.", score: 1, why: "Entiendes lo que vive el equipo.", cost: "Elena se entera por otros y su autoridad queda tocada." },
    { text: "Pedirle que publique un rol rotativo de turnos y un criterio claro para asignar proyectos.", score: 2, why: "Arreglas el sistema sin juzgar a la persona.", cost: "Si sí hay favoritismo, lo tapas con un proceso." },
    { text: "Revisar los datos de turnos y asignaciones de los últimos seis meses antes de hablar con ella.", score: 3, why: "Llegas con hechos y no con chismes.", cost: "Mientras revisas, el equipo siente que no pasa nada." },
    { text: "Hablar con Elena esta semana, contarle lo que escuchas y preguntarle cómo decide las asignaciones.", score: 3, why: "Le das la oportunidad de explicar y corregir pronto.", cost: "Sin datos, puede ponerse a la defensiva." },
  ] },
  { id: "q4-v2", replaces: "q4", theme: "quejas", min: 2, who: "Ricardo · director de una unidad de negocio", text: "Te llega una carta anónima firmada «el equipo de Ricardo». Dice que cambia los objetivos a mitad del año y que nadie cobra bono.", ask: "¿Qué haces con una carta anónima?", options: [
    { text: "Verificar lo verificable: historial de cambios de objetivos y pagos de bono de su área.", score: 3, why: "No necesitas saber quién la escribió para revisar si es cierto.", cost: "Ricardo se puede enterar de la revisión antes de que hables con él." },
    { text: "Mostrarle la carta a Ricardo, pedirle su historial de objetivos y bonos y revisarlo juntos.", score: 3, why: "Le das derecho a responder y llegas a los datos con él.", cost: "Puede tratar de averiguar quién escribió la carta." },
    { text: "Pedir a Recursos Humanos que haga entrevistas confidenciales a una muestra de su equipo.", score: 2, why: "Escuchas al equipo con protección.", cost: "El equipo puede ver las entrevistas como búsqueda de culpables." },
    { text: "Archivarla hasta que alguien firme la queja, porque una carta sin nombre no se puede verificar.", score: 0, why: "Evitas actuar sobre una acusación sin respaldo.", cost: "El anonimato indica miedo; archivarla confirma que hay razones." },
  ] },
  { id: "q5-v2", replaces: "q5", theme: "quejas", min: 1, who: "Gabriel · gerente, ascendido hace 4 meses desde su mismo equipo", text: "Los excompañeros de Gabriel se quejan: «desde que es jefe ya no es el mismo». Él siente que no lo respetan.", ask: "¿Qué haces?", options: [
    { text: "Ayudarle a hablar abiertamente con su equipo del nuevo rol y acompañarlo en sus primeras reuniones a solas con ellos.", score: 3, why: "Pasar de compañero a jefe es de lo más difícil: necesita que lo entrenes.", cost: "Tu presencia puede hacer que el equipo no hable con libertad." },
    { text: "Pedirle que defina con su equipo tres acuerdos de trabajo y que los revise con ellos cada mes.", score: 3, why: "Le das una herramienta para ganar autoridad sin imponerla.", cost: "Si no lo acompañas, puede convertirlo en una lista de reglas." },
    { text: "Decirle a Gabriel que marque su autoridad con claridad desde la próxima junta y que no permita faltas de respeto.", score: 1, why: "Le das respaldo para ejercer su rol.", cost: "Más autoridad sin relación suele empeorar la tensión." },
    { text: "Moverlo a otro equipo del mismo nivel donde nadie lo conozca como compañero y pueda empezar de cero.", score: 1, why: "Le das un arranque limpio.", cost: "Evitas el problema y él no aprende a dirigir a sus excompañeros." },
  ] },
  { id: "c1-v2", replaces: "c1", theme: "conducta", min: 0, who: "Alberto · jefe de producción", text: "Te llega una denuncia por el canal de ética: Alberto le gritó e insultó a un operador ante todo el turno. Hay testigos. Alberto es muy bueno en lo técnico.", ask: "¿Qué haces?", options: [
    { text: "Activar el proceso: investigar con testigos, proteger al denunciante y decidir según lo que resulte.", score: 3, why: "El proceso protege a todos y el equipo ve que el canal funciona.", cost: "Tarda unas semanas y la tensión sigue en el turno." },
    { text: "Separarlo del turno con goce de sueldo mientras se investiga, y escuchar su versión esta semana.", score: 3, why: "Proteges al operador sin condenar antes de tiempo.", cost: "La línea pierde a su mejor técnico durante la investigación." },
    { text: "Pedirle a Alberto que se disculpe con el operador frente al turno y dar el tema por cerrado.", score: 1, why: "Reparas rápido el daño visible.", cost: "Saltarte el proceso deja al denunciante sin protección." },
    { text: "Suspenderlo hoy sin goce de sueldo para dar un mensaje claro a todo el turno.", score: 1, why: "Mensaje contundente.", cost: "Sin escuchar su versión es injusto y es un riesgo legal." },
  ] },
  { id: "c2-v2", replaces: "c2", theme: "conducta", min: 1, lesson: "conversaciones-2", who: "Alberto · el mismo caso, ya investigado", text: "La investigación confirma los gritos y que no es la primera vez. Alberto reconoce que «se le fue» y dice que está bajo mucha presión por las metas que tú le pusiste.", ask: "¿Qué decides?", options: [
    { text: "Despedirlo: es reincidente, el proceso lo confirmó y el turno necesita ver que la regla se aplica.", score: 3, why: "Consecuencia firme ante una conducta repetida.", cost: "Pierdes a tu mejor técnico y la presión de las metas sigue." },
    { text: "Sanción formal, compromiso escrito con consecuencias si se repite, y revisar tú sus metas.", score: 3, why: "Consecuencia por la conducta y responsabilidad tuya por el contexto.", cost: "Si se repite, el turno dirá que le diste otra oportunidad." },
    { text: "Revisar sus metas para bajar la presión del turno y darle otra oportunidad sin sanción formal en su expediente.", score: 1, why: "Atiendes una causa real.", cost: "La conducta queda sin consecuencia." },
    { text: "Moverlo a un puesto técnico sin gente a cargo, con el mismo sueldo y sin sanción formal.", score: 1, why: "Aprovechas su talento sin exponer a nadie.", cost: "Sin consecuencia formal, el cambio parece premio." },
  ] },
  { id: "c3-v2", replaces: "c3", theme: "conducta", min: 2, who: "Ingeniero Ruiz · director de planta", text: "Una colaboradora denuncia comentarios inapropiados de Ruiz. Él lo niega. No hay testigos. Ruiz tiene 15 años impecables.", ask: "¿Qué haces?", options: [
    { text: "Investigación con alguien externo e imparcial, protección a la denunciante y líneas de reporte separadas.", score: 3, why: "Sin testigos, la imparcialidad del proceso es lo único que da una respuesta justa.", cost: "Costo y semanas de incertidumbre para los dos." },
    { text: "Investigación con el comité interno de ética y la denunciante protegida de cualquier represalia.", score: 2, why: "Proceso formal y más rápido.", cost: "Con un director de 15 años, el comité interno puede no verse imparcial." },
    { text: "Pedirle a Ruiz que trabaje desde oficinas corporativas mientras una firma externa investiga.", score: 3, why: "Proteges a la denunciante sin cambiarla a ella de lugar.", cost: "Ruiz puede vivirlo como condena previa y la planta lo resiente." },
    { text: "Cambiar a la colaboradora a otra área mientras se aclara, para evitarle el contacto con Ruiz.", score: 0, why: "Separas a las partes de inmediato.", cost: "Mueves a quien denunció: el mensaje es que denunciar cuesta." },
  ] },
  { id: "c4-v2", replaces: "c4", theme: "conducta", min: 0, who: "Tere · ejecutiva de cuenta", text: "Tere publicó en sus redes una queja dura contra la empresa después de una discusión con su jefe. Ya la vieron clientes.", ask: "¿Qué haces?", options: [
    { text: "Hablar con ella para entender qué pasó con su jefe y, ya escuchada, acordar qué hacer con la publicación.", score: 3, why: "Atiendes la causa primero; escuchada, es probable que ella misma la retire.", cost: "La publicación sigue arriba mientras hablan." },
    { text: "Pedirle hoy que la retire por los clientes y agendar mañana una conversación sobre lo de su jefe.", score: 3, why: "Contienes el daño con clientes y no dejas de lado la causa.", cost: "Puede sentirse callada antes de ser escuchada." },
    { text: "Aplicar la política de redes sociales con una sanción escrita en su expediente y pedirle que retire la publicación hoy.", score: 1, why: "Consistencia con la política.", cost: "Sin escucharla, confirmas lo que publicó." },
    { text: "Dejar que se enfríe solo para no hacerlo más grande y no mencionarlo con ella ni con su jefe.", score: 1, why: "Evitas amplificarlo.", cost: "Clientes ya la vieron y el conflicto con su jefe sigue." },
  ] },
  { id: "c5-v2", replaces: "c5", theme: "conducta", min: 1, who: "Samuel · gerente de ventas", text: "Te enteras de que Samuel promete a clientes fechas de entrega que operaciones no puede cumplir, para cerrar ventas. Los clientes luego se enojan con operaciones.", ask: "¿Cómo lo abordas?", options: [
    { text: "Mostrarle el costo con casos reales: quejas, penalizaciones y el desgaste de operaciones.", score: 3, why: "Hechos e impacto, y abre la conversación sobre qué fechas puede prometer.", cost: "Si es el incentivo el que lo empuja, una charla no basta." },
    { text: "Descontar de su comisión cada penalización por fecha incumplida que él haya prometido.", score: 3, why: "Alineas el incentivo con lo que cuesta su promesa.", cost: "Sin conversación, lo vive como castigo y puede irse." },
    { text: "Dar a ventas un tablero con la capacidad real de operaciones para prometer solo fechas posibles.", score: 2, why: "Arreglas el sistema que permite la promesa.", cost: "Si Samuel lo sigue ignorando, no cambia nada." },
    { text: "Exigir que todas sus cotizaciones con fecha pasen por ti antes de enviarse al cliente.", score: 1, why: "Controlas el riesgo de inmediato.", cost: "Te vuelves el cuello de botella del área comercial." },
  ] },
  { id: "g1-v2", replaces: "g1", theme: "delegar", min: 0, lesson: "personas-2", who: "Andrea · gerente de proyectos", text: "Andrea trabaja hasta las 11 de la noche y su equipo se va a las 6 sin pendientes. Dice que «es más rápido si lo hago yo».", ask: "¿Qué haces?", options: [
    { text: "Elegir con ella una tarea por persona para delegar esta semana, con autonomía clara, y revisarlo juntos el viernes.", score: 3, why: "Delegar se aprende escalón por escalón.", cost: "Las primeras entregas pueden salir peor que si las hiciera ella." },
    { text: "Ponerle como meta del trimestre que su equipo entregue solo dos proyectos y medir eso, no sus horas.", score: 3, why: "Cambias lo que se mide y la obligas a soltar.", cost: "Sin acompañarla, puede no saber cómo hacerlo." },
    { text: "Pedirle que deje de trabajar tan tarde, que se vaya a la misma hora que su equipo y que cuide su salud.", score: 1, why: "Cuidas su salud.", cost: "Atiendes el síntoma; mañana hace lo mismo." },
    { text: "Asignar tú tareas directamente a su equipo para quitarle carga esta semana mientras se pone al día.", score: 1, why: "Alivias la carga de inmediato.", cost: "Le pasas por encima y le quitas autoridad." },
  ] },
  { id: "g2-v2", replaces: "g2", theme: "delegar", min: 1, who: "Manuel · director de ingeniería", text: "Manuel delega, pero luego rehace el trabajo de su equipo sin decirles nada. Su equipo se enteró y ahora entregan cualquier cosa: «total, él lo va a cambiar».", ask: "¿Cómo lo abordas?", options: [
    { text: "Ayudarle a definir el estándar antes de delegar y a dar comentarios en vez de corregir en silencio.", score: 3, why: "El equipo nunca supo qué era «bueno».", cost: "Pide tiempo de Manuel al inicio de cada proyecto." },
    { text: "Pedirle que durante un mes no toque ninguna entrega y que la regrese con comentarios escritos.", score: 3, why: "Rompes el hábito de rehacer y le das otra salida.", cost: "Algunas entregas saldrán peor ese mes." },
    { text: "Explicarle con ejemplos que rehacer el trabajo en silencio destruye la motivación de su equipo.", score: 2, why: "Le haces ver el costo.", cost: "Sin una alternativa concreta, va a seguir igual." },
    { text: "Hablar con el equipo para pedirles entregas de mejor calidad, porque Manuel tiene razón en corregir.", score: 1, why: "Pones el estándar ante el equipo.", cost: "El equipo responde al sistema que Manuel creó." },
  ] },
  { id: "g3-v2", replaces: "g3", theme: "delegar", min: 2, who: "Tú mismo", text: "Tu asistente te enseña tu agenda de la semana: 38 juntas, 21 de ellas sobre temas que tus directores podrían decidir.", ask: "¿Qué haces?", options: [
    { text: "Definir con cada director qué decisiones son suyas, cuáles te consultan y cuáles te avisan después.", score: 3, why: "Claridad de decisiones: así se delega a escala.", cost: "Toma semanas y al principio te van a seguir buscando." },
    { text: "Cancelar las 21 juntas esta semana y avisar que esas decisiones son de cada director desde hoy.", score: 3, why: "Mensaje inmediato y claro de que confías en ellos.", cost: "Sin reglas escritas, algunos te buscarán por otro lado." },
    { text: "Bajar esas 21 juntas a quince minutos y pedir que cada director llegue con su recomendación escrita.", score: 2, why: "Reduces tiempo y los obligas a llegar con criterio.", cost: "Sigues en el centro de cada decisión." },
    { text: "Pedirle a tu asistente que decida qué juntas tomas tú y cuáles delega a cada uno de tus directores.", score: 1, why: "Liberas agenda rápido.", cost: "Ella filtra agenda, no criterio de negocio." },
  ] },
  { id: "g4-v2", replaces: "g4", theme: "delegar", min: 1, stage: "delega", who: "Pilar · gerente de calidad, experta", text: "Pilar te pide autonomía total sobre el presupuesto de su área. Tiene 8 años y nunca ha fallado, pero el presupuesto es grande.", ask: "¿Qué decides?", options: [
    { text: "Dársela con revisiones trimestrales de resultados y un reporte de gasto mensual.", score: 3, why: "Experta y comprometida: rinde cuentas por resultados, no por cada gasto.", cost: "Si algo se desvía, lo ves hasta el trimestre." },
    { text: "Dársela con aprobación tuya solo arriba de un monto alto, que ella misma te ayude a fijar.", score: 3, why: "Autonomía real con una red de seguridad acordada.", cost: "Si el límite queda bajo, no es autonomía real." },
    { text: "Dársela a prueba durante tres meses y después decidir con ella si se vuelve permanente.", score: 2, why: "Prudente con un presupuesto grande.", cost: "Con 8 años sin fallar, puede sentirse como desconfianza." },
    { text: "Negársela porque el presupuesto de cada área es responsabilidad directa de la dirección.", score: 0, why: "Mantienes el control.", cost: "Desperdicias criterio probado y la desmotivas." },
  ] },
  { id: "a1-v2", replaces: "a1", theme: "ascenso", min: 1, lesson: "personas-3", who: "Dos candidatos para gerente de ventas", text: "Pedro es el mejor vendedor, pero no le interesa la gente. Karla vende menos, pero todos la buscan para pedirle ayuda. Pedro espera el puesto.", ask: "¿A quién asciendes?", options: [
    { text: "A Karla, y a Pedro le das un rol de vendedor sénior con reconocimiento y compensación propios.", score: 3, why: "Asciendes por liderazgo y creas un camino para el experto.", cost: "El rol sénior cuesta y otros vendedores lo van a pedir." },
    { text: "A Pedro, con un coach de liderazgo y la condición de revisar en seis meses cómo va su equipo.", score: 2, why: "Respetas el mérito visible y le das apoyo.", cost: "Arriesgas perder al mejor vendedor y tener un mal gerente." },
    { text: "Abrir el puesto a ambos con un ejercicio práctico de liderazgo y decidir con ese resultado.", score: 3, why: "Decides con evidencia y Pedro entiende por qué gana o pierde.", cost: "Retrasa la decisión y el que pierda puede sentirse expuesto." },
    { text: "A Karla, anunciándolo de inmediato y dejando que Pedro asimile el cambio a su ritmo.", score: 1, why: "La decisión de fondo es correcta.", cost: "Sin hablar con Pedro antes, lo pierdes." },
  ] },
  { id: "a2-v2", replaces: "a2", theme: "ascenso", min: 1, lesson: "conversaciones-2", who: "Javier · coordinador, 3 años", text: "Javier esperaba el ascenso a gerente y no se lo dieron. Mañana se anuncia a otra persona.", ask: "¿Cómo se lo comunicas?", options: [
    { text: "Decírselo hoy en persona, explicarle por qué con honestidad y qué necesitaría para el próximo.", score: 3, why: "Respeto, verdad y un camino.", cost: "Puede doler tanto que empiece a buscar trabajo." },
    { text: "Decírselo hoy y darle desde ya un proyecto que lo prepare para el siguiente puesto que se abra.", score: 3, why: "Le das algo concreto, no solo palabras.", cost: "Si el proyecto no es real, la decepción será doble." },
    { text: "Decírselo hoy y ofrecerle un aumento de sueldo como reconocimiento a su esfuerzo.", score: 1, why: "Gesto concreto.", cost: "El dinero tapa la conversación sobre su desarrollo." },
    { text: "Dejar que se entere en el anuncio general de mañana y hablar con él con calma al día siguiente.", score: 0, why: "Evitas una conversación difícil antes del anuncio.", cost: "Enterarse con todos es humillante." },
  ] },
  { id: "a3-v2", replaces: "a3", theme: "ascenso", min: 2, who: "Natalia · gerente, ascendida hace 6 meses", text: "Natalia no está funcionando como gerente: su equipo baja y ella está infeliz. Era excelente en su puesto anterior.", ask: "¿Qué haces?", options: [
    { text: "Hablar con ella con honestidad y abrir la opción de regresar a un rol experto sin que sea un fracaso.", score: 3, why: "Un regreso digno es mejor que una líder infeliz y un equipo que paga el costo.", cost: "Si ella quiere seguir, la conversación puede desanimarla." },
    { text: "Darle tres meses con un coach y metas claras de equipo, y decidir juntos con esos resultados.", score: 3, why: "Seis meses es poco: una oportunidad acotada puede bastar.", cost: "El equipo sigue bajando mientras tanto." },
    { text: "Regresarla a su puesto anterior la próxima semana y nombrar a otra persona en la gerencia de su equipo.", score: 1, why: "Cortas el daño rápido.", cost: "Sin hablarlo con ella, es una humillación." },
    { text: "Esperar a la evaluación anual para tener datos completos y tomar la decisión entonces.", score: 1, why: "Decides con más información.", cost: "Seis meses más de desgaste para ella y su equipo." },
  ] },
  { id: "k1-v2", replaces: "k1", theme: "conflicto", min: 0, lesson: "negociacion", who: "Lucía (Finanzas) y Héctor (Ventas)", text: "Lucía quiere cobrar a 30 días; Héctor dice que si no da 60, pierde clientes. Ya no se hablan y cada uno te busca por separado.", ask: "¿Qué haces?", options: [
    { text: "Reunirlos y preguntar qué hay detrás de cada número: caja para Lucía, competitividad para Héctor.", score: 3, why: "Debajo de las posiciones hay intereses que se pueden combinar.", cost: "Una junta más; si no ceden, acabas decidiendo tú." },
    { text: "Decidir tú hoy: 30 días por regla y 60 solo para cinco clientes clave que Héctor elija y defienda.", score: 3, why: "Con la caja apretada, una regla clara con excepción acotada resuelve rápido.", cost: "Ninguno queda del todo contento y siguen sin hablarse." },
    { text: "Darle la razón a Lucía porque la caja está apretada y explicarle a Héctor el porqué con números.", score: 2, why: "Proteges la caja.", cost: "Héctor no va a ejecutarlo con convicción." },
    { text: "Partir la diferencia en 45 días para todos los clientes y pedirles a los dos que sigan adelante.", score: 1, why: "Rápido y parejo.", cost: "El punto medio no resuelve el interés de ninguno." },
  ] },
  { id: "k2-v2", replaces: "k2", theme: "conflicto", min: 1, who: "Dos gerentes que compiten por el mismo puesto futuro", text: "Mariana y Tomás se sabotean: no comparten información y se culpan en las juntas. Los dos son buenos.", ask: "¿Qué haces?", options: [
    { text: "Hablar con los dos juntos: lo que ves, el costo para la empresa, y que su evaluación incluya colaborar.", score: 3, why: "Lo dices directo y cambias el incentivo.", cost: "Si el puesto sigue en juego, la competencia no desaparece." },
    { text: "Hablar con cada uno por separado con ejemplos concretos y fijar con cada uno qué debe cambiar.", score: 3, why: "Conversaciones más francas sin el otro presente.", cost: "Cada uno puede creer que el problema es el otro." },
    { text: "Ponerlos a dirigir juntos un proyecto de toda la empresa, con una meta compartida, y revisar sus avances cada mes.", score: 2, why: "Obligas la colaboración con un objetivo común.", cost: "Sin dejar claro qué esperas, se sabotean más." },
    { text: "Anunciar ya quién se queda con el puesto futuro para terminar la competencia entre ellos.", score: 1, why: "Terminas la competencia de raíz.", cost: "Si no es el momento, decides por presión." },
  ] },
  { id: "k3-v2", replaces: "k3", theme: "conflicto", min: 2, who: "Tu director de operaciones y tu director comercial", text: "En la junta de comité, los dos se gritan. El resto del equipo mira hacia abajo. Todos esperan qué haces.", ask: "¿Qué haces en ese momento?", options: [
    { text: "Intervenir con calma: «Los dos tienen un punto; separemos hechos de tono», y luego hablar con cada uno a solas.", score: 3, why: "Modelas en vivo cómo se discute y atiendes la conducta después.", cost: "Si no se calman, la junta se te va de las manos." },
    { text: "Cortar la discusión, decir que así no se discute aquí y pasar al siguiente tema; hablar con ellos al terminar.", score: 3, why: "Pones el límite claro ante todos sin humillar a nadie.", cost: "El tema de fondo queda pendiente para otra junta." },
    { text: "Hacer un receso de diez minutos para que se calmen y retomar el tema con ellos dos al final del día.", score: 2, why: "Bajas la temperatura.", cost: "El equipo no ve cómo se maneja un conflicto." },
    { text: "Dejar que terminen la discusión, porque un desacuerdo abierto y fuerte es sano en un comité de dirección.", score: 1, why: "Respetas el debate.", cost: "El desacuerdo sano es de ideas, no de gritos; tu silencio lo valida." },
  ] },
  { id: "r1-v2", replaces: "r1", theme: "retener", min: 0, lesson: "personas", who: "Daniela · tu mejor analista", text: "Daniela renuncia. En la entrevista de salida dice: «nunca supe si mi trabajo servía».", ask: "¿Qué haces?", options: [
    { text: "Agradecerle la honestidad, preguntar si algo cambiaría su decisión y revisar cómo das comentarios al equipo.", score: 3, why: "Quizá no se quede, pero puedes evitar que se vayan los siguientes.", cost: "Puede sonar a promesa tardía." },
    { text: "Aceptar la renuncia con respeto y hablar esta semana con cada persona del equipo sobre su trabajo.", score: 3, why: "Respetas su decisión y atiendes lo que señaló.", cost: "Pierdes a tu mejor analista sin intentar retenerla." },
    { text: "Ofrecerle un aumento de sueldo y un puesto de coordinación para que reconsidere su renuncia esta semana.", score: 1, why: "Intentas retener talento.", cost: "Ella no habló de dinero." },
    { text: "Pedirle que se quede un mes más para transferir su trabajo, documentar sus análisis y cerrar los pendientes.", score: 1, why: "Proteges la operación.", cost: "No atiendes lo que dijo." },
  ] },
  { id: "r2-v2", replaces: "r2", theme: "retener", min: 1, who: "Luis · gerente de operaciones", text: "Te enteras por un proveedor de que Luis está entrevistándose en otra empresa. Él no te ha dicho nada.", ask: "¿Qué haces?", options: [
    { text: "En tu próxima reunión a solas con él, preguntarle cómo se siente en su rol y qué quiere para el próximo año.", score: 3, why: "Le abres la puerta para que te lo diga sin acorralarlo.", cost: "Puede no decírtelo y aceptar la oferta." },
    { text: "Empezar en silencio a preparar a su número dos, sin cambiar en nada tu trato diario con Luis.", score: 3, why: "Reduces el riesgo para la operación pase lo que pase.", cost: "Si se entera, puede leerlo como que ya lo das por ido." },
    { text: "Decirle directo, en tu próxima reunión, que te enteraste por un proveedor de que busca trabajo.", score: 1, why: "Transparencia total.", cost: "Lo pones a la defensiva y quemas al proveedor." },
    { text: "Ofrecerle este mes un aumento preventivo de sueldo sin mencionarle lo que te contó el proveedor.", score: 1, why: "Te adelantas a la oferta.", cost: "Sin saber por qué busca, es un tiro a ciegas." },
  ] },
  { id: "r3-v2", replaces: "r3", theme: "retener", min: 2, who: "Tres ingenieros del mismo equipo", text: "En un mes renunciaron tres ingenieros del equipo de Claudia. Todos dicen «mejor oferta». Claudia dice que «el mercado está loco».", ask: "¿Qué investigas?", options: [
    { text: "Hablar con los que se fueron, a través de alguien neutral, y con los que se quedan.", score: 3, why: "La gente suele irse de jefes; necesitas su versión, no solo la de Claudia.", cost: "Claudia puede sentirse investigada." },
    { text: "Comparar los sueldos de su equipo con el mercado y con los otros equipos de ingeniería.", score: 3, why: "Si el mercado sí se movió, lo confirmas con datos rápido.", cost: "Si el problema es Claudia, el estudio no lo muestra." },
    { text: "Pedirle a Claudia un análisis de las tres salidas y un plan para retener al resto del equipo.", score: 2, why: "Le das la responsabilidad a quien dirige el equipo.", cost: "Si ella es parte del problema, su análisis no lo verá." },
    { text: "Subir los sueldos de todo su equipo este mismo mes para frenar más renuncias mientras entiendes qué pasa.", score: 1, why: "Contienes el riesgo de inmediato.", cost: "Si el problema no es el sueldo, pagas más por lo mismo." },
  ] },
  { id: "p1-v2", replaces: "p1", theme: "personal", min: 0, who: "Rosa · coordinadora, 10 años", text: "El papá de Rosa está muy enfermo. Ella falta seguido y su trabajo se atrasa. No ha pedido nada formal.", ask: "¿Qué haces?", options: [
    { text: "Hablar con ella, preguntarle qué necesita y acordar algo temporal: horario flexible, tareas o permiso.", score: 3, why: "Humanidad con un acuerdo claro para ella y para el equipo.", cost: "El equipo absorbe parte de su trabajo un tiempo." },
    { text: "Ofrecerle un permiso con goce por un mes y repartir su trabajo, avisándole antes de hacerlo.", score: 3, why: "Le das espacio real sin que tenga que pedirlo.", cost: "Puede preferir seguir trabajando y sentir que decides por ella." },
    { text: "Esperar a que ella pida algo formal a Recursos Humanos, para no invadir su privacidad en un momento delicado.", score: 1, why: "Respetas su espacio.", cost: "Puede no pedir por miedo y el atraso crece." },
    { text: "Reasignar sus tareas pendientes a otras personas del equipo sin comentarlo antes con ella.", score: 1, why: "Alivias el atraso.", cost: "Puede sentir que la estás sacando." },
  ] },
  { id: "p2-v2", replaces: "p2", theme: "personal", min: 1, who: "Felipe · gerente, se divorcia", text: "Felipe está irritable y en dos juntas fue muy duro con su equipo. Te cuenta que se está divorciando.", ask: "¿Qué haces?", options: [
    { text: "Mostrarle comprensión, ofrecer apoyo (terapia, días libres) y decirle que con su equipo así no puede ser.", score: 3, why: "Las dos cosas son ciertas: lo apoyas y el estándar de trato no cambia.", cost: "Puede sentir que no entiendes lo que vive." },
    { text: "Darle una semana libre ahora y, a su regreso, hablar con él de cómo trató a su equipo.", score: 3, why: "Primero la persona, luego la conducta, sin olvidarla.", cost: "Su equipo espera una semana sin ver respuesta." },
    { text: "Tratarlo como cualquier caso de conducta, con una nota en su expediente y seguimiento.", score: 2, why: "Coherencia con todos.", cost: "Ignorar el contexto es frío y puede romper la relación." },
    { text: "No tocar el tema por ahora, porque está en un momento difícil, y pedirle paciencia a su equipo.", score: 1, why: "Empatía con él.", cost: "Su equipo también paga el costo." },
  ] },
  { id: "p3-v2", replaces: "p3", theme: "personal", min: 2, who: "Esteban · director, ansiedad y agotamiento", text: "Esteban te confiesa que tiene ansiedad y no duerme. Te pide que no se lo digas a nadie. Él está a cargo del lanzamiento más importante del año.", ask: "¿Qué haces?", options: [
    { text: "Agradecer su confianza, guardar el secreto, ofrecerle apoyo profesional y preguntarle qué le ayudaría.", score: 3, why: "Él decide qué necesita y tú facilitas sin exponerlo.", cost: "Si no pide ajustes, el riesgo del lanzamiento sigue." },
    { text: "Proponerle un codirector para el lanzamiento, presentado como refuerzo, sin contar el motivo a nadie.", score: 3, why: "Proteges el lanzamiento y a Esteban sin romper su confianza.", cost: "Puede leerlo como que confesarlo le costó el control." },
    { text: "Avisar a Recursos Humanos, con discreción, para que lo apoyen con los programas de salud de la empresa.", score: 1, why: "Activas apoyo profesional.", cost: "Rompes la confidencialidad que te pidió." },
    { text: "Quitarle el lanzamiento esta semana para protegerlo y que se enfoque solo en recuperarse.", score: 1, why: "Proteges su salud y el proyecto.", cost: "Decides por él y puede sentir que confesarlo le costó el puesto." },
  ] },
  { id: "s1-v2", replaces: "s1", theme: "salida", min: 1, who: "Julio · vendedor, 1 año", text: "Decidiste despedir a Julio por bajo desempeño sostenido. Tuvo dos planes de mejora. Es viernes por la tarde.", ask: "¿Cuándo y cómo?", options: [
    { text: "Lunes temprano, en privado, con mensaje claro, finiquito listo y un plan para que se despida.", score: 3, why: "Claridad, dignidad y tiempo para lo práctico.", cost: "Pasas el fin de semana sabiendo algo que él no sabe." },
    { text: "Hoy, en privado y en persona, con el finiquito listo y una cita el lunes para resolver pendientes.", score: 3, why: "No lo dejas trabajar un día más con una decisión ya tomada.", cost: "Se va al fin de semana con la noticia y sin poder resolver nada." },
    { text: "Que Recursos Humanos le comunique la decisión el lunes, con el finiquito listo y los trámites.", score: 1, why: "Proceso limpio y formal.", cost: "Recursos Humanos acompaña, pero el jefe debe dar la cara." },
    { text: "Enviarle un correo el lunes temprano con la decisión y el finiquito, para evitar una escena.", score: 0, why: "Evitas una conversación tensa.", cost: "Lo difícil se dice en persona." },
  ] },
  { id: "s2-v2", replaces: "s2", theme: "salida", min: 2, lesson: "comunicacion-2", who: "Tu equipo, después del despido de alguien querido", text: "Despediste a Roberto, querido por todos, por una falta de ética confirmada. No puedes dar detalles. El equipo está molesto y hay rumores.", ask: "¿Qué le dices al equipo?", options: [
    { text: "Que Roberto ya no está, que fue por una razón seria que no puedes detallar, y que la regla aplica a todos.", score: 3, why: "Respetas su privacidad y das el mensaje que el equipo necesita.", cost: "Algunos seguirán creyendo que fue injusto." },
    { text: "Hablar con cada persona clave por separado, escuchar su molestia y repetir lo que sí puedes decir.", score: 3, why: "Atiendes la emoción de cerca y frenas el rumor uno a uno.", cost: "Toma días y el mensaje puede variar de una charla a otra." },
    { text: "Enviar un comunicado breve a toda el área diciendo que Roberto dejó la empresa y agradeciendo sus años de trabajo.", score: 1, why: "Formal y rápido.", cost: "El silencio sobre el motivo se llena con rumores." },
    { text: "Decir que su salida fue parte de una reestructura del área, para no exponer el motivo real ante el equipo.", score: 0, why: "Cuidas su privacidad.", cost: "Es una mentira que te cuesta la credibilidad cuando se sepa." },
  ] },
  { id: "s3-v2", replaces: "s3", theme: "salida", min: 3, who: "Un recorte de 40 personas", text: "La caja obliga a recortar 40 puestos. Tu director de finanzas quiere hacerlo en un solo día, sin aviso previo, para evitar sabotajes.", ask: "¿Cómo lo haces?", options: [
    { text: "En un solo día, cada jefe da la cara, con indemnización justa y apoyo; tú hablas con quienes se quedan.", score: 3, why: "Velocidad con dignidad: quienes se quedan juzgan por cómo tratas a quienes se van.", cost: "Muy exigente de coordinar y algunos jefes lo harán mal." },
    { text: "Abrir dos semanas de retiro voluntario con mejor paquete y completar después los puestos que falten.", score: 3, why: "Menos salidas forzadas y más control para la gente.", cost: "Suelen irse los mejores, los que tienen alternativas." },
    { text: "Anunciarlo con un mes de anticipación y publicar para todos los criterios del recorte y el paquete de salida.", score: 2, why: "Transparencia y tiempo para prepararse.", cost: "Un mes de incertidumbre paraliza a toda la empresa." },
    { text: "Hacerlo como propone finanzas: un solo día, sin aviso y con el mínimo legal de indemnización.", score: 1, why: "Rápido y barato.", cost: "Quienes se quedan aprenden que les puede pasar igual de un día para otro." },
  ] },
];

/** Todos los dilemas que existen o existieron (para calificar y mostrar respuestas históricas). */
export const ALL_DILEMMAS: Dilemma[] = [...DILEMMAS_V1, ...DILEMMAS];
const BY_ID = new Map(ALL_DILEMMAS.map((d) => [d.id, d]));
/** Ids equivalentes: un dilema y el de la otra versión que trata la misma situación. */
export function sameSituation(id: string): string[] {
  const d = BY_ID.get(id);
  if (!d) return [id];
  if (d.replaces) return [d.id, d.replaces];
  const v2 = DILEMMAS.find((x) => x.replaces === id);
  return v2 ? [id, v2.id] : [id];
}
/** ¿Ya respondió esta situación (en cualquier versión)? Devuelve el dilema y la opción que eligió. */
export function answeredAs(answered: Record<string, { option: number; at: number }>, d: Dilemma): { d: Dilemma; option: number } | null {
  for (const id of sameSituation(d.id)) { const a = answered[id]; const x = BY_ID.get(id); if (a && x) return { d: x, option: a.option }; }
  return null;
}


export const dilemmaById = (id: string) => BY_ID.get(id);
export const bestOf = (d: Dilemma) => Math.max(...d.options.map((o) => o.score));
