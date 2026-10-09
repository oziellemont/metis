/**
 * Metis Academy · contenido de los módulos.
 * Lógica pura (sin JSX) para poder probarla con Vitest.
 *
 * Cada módulo = tarjetas cortas (lecturas e interacciones) + un quiz final.
 * Regla de diseño: ninguna tarjeta debe tomar más de ~40 segundos de lectura.
 */

import { RV_GUIDE, RV_GUIDE_NOTE } from "../sessions/guide";

export interface Detail { label: string; text: string }

export type Block =
  | { kind: "text"; eyebrow: string; title: string; body: string[]; callout?: { label: string; text: string; source?: string } }
  | { kind: "reveal"; eyebrow: string; title: string; intro?: string; layout?: "list" | "pyramid"; items: { tag: string; label: string; body: string; details?: Detail[] }[]; note?: string; source?: string }
  | { kind: "flow"; eyebrow: string; title: string; intro?: string; steps: { label: string; example: string }[]; note?: string }
  | { kind: "compare"; eyebrow: string; title: string; intro?: string; left: { label: string; points: string[] }; right: { label: string; points: string[] }; note?: string; /** Dos cosas distintas y necesarias (no «mal vs. bien»). */ neutral?: boolean }
  | { kind: "check"; eyebrow: string; title: string; question: string; options: { text: string; correct?: boolean; why: string }[] }
  | { kind: "screen"; eyebrow: string; nav: TourScreen; title: string; body: string[] };

export type TourScreen = "inicio" | "scorecard" | "carga" | "mapa" | "equipo" | "buscar" | "ayuda";

export interface Question {
  q: string;
  options: { text: string; correct?: boolean; why: string }[];
}

export interface Module {
  id: string;
  n: number;
  title: string;
  subtitle: string;
  minutes: number;
  topics: string[];
  icon: "compass" | "users" | "flag" | "message" | "map";
  blocks: Block[];
  quiz: Question[];
}

export const PASS_PCT = 80;

export const MODULES: Module[] = [
  // ───────────────────────────────────────────────────────────── 1 · Alineación
  {
    id: "alineacion",
    n: 1,
    title: "¿Qué es la alineación estratégica?",
    subtitle: "Por qué las estrategias fallan al bajar y cómo se conectan objetivos, indicadores y personas.",
    minutes: 6,
    topics: ["Línea de vista", "La cascada", "Indicadores de causa", "Owner y Contributor"],
    icon: "compass",
    blocks: [
      {
        kind: "text",
        eyebrow: "El problema",
        title: "La estrategia rara vez falla en el papel. Falla al bajar.",
        body: [
          "Un consejo puede tener una estrategia brillante y, aun así, el lunes por la mañana cada área trabaja en lo suyo.",
          "La brecha no es de talento ni de esfuerzo: es de conexión. Nadie tradujo el objetivo a lo que cada persona hace, mide y entrega.",
        ],
        callout: { label: "Dato", text: "Según Kaplan y Norton, en promedio el 95% de los colaboradores de una empresa no conoce o no entiende su estrategia.", source: "Harvard Business Review, 2005" },
      },
      {
        kind: "reveal",
        eyebrow: "La definición",
        title: "Hay alineación cuando cada persona puede responder tres preguntas",
        intro: "Toca cada pregunta.",
        items: [
          { tag: "1", label: "¿A qué objetivo contribuyo?", body: "Saber qué objetivo de la empresa mueve mi trabajo. A esto se le llama línea de vista." },
          { tag: "2", label: "¿Cómo sé si voy bien?", body: "Tener un indicador claro, con meta y semáforo, que no dependa de la percepción de nadie." },
          { tag: "3", label: "¿Qué me toca hacer este mes?", body: "Convertir la meta en acciones y compromisos concretos, con fecha." },
        ],
        note: "Si alguien de tu equipo no puede contestar las tres, ahí hay una oportunidad de alineación.",
      },
      {
        kind: "flow",
        eyebrow: "La cascada",
        title: "De la visión del consejo al KPI de cada persona",
        intro: "Así baja un objetivo hasta tu scorecard. Avanza paso a paso.",
        steps: [
          { label: "Objetivo corporativo", example: "Crecer rentablemente en el canal moderno" },
          { label: "LAE · Línea de Acción Estratégica", example: "Expandir presencia en autoservicios del norte" },
          { label: "KPI o proyecto, por alcance", example: "Venta canal moderno · Región Norte" },
          { label: "Owner y Contributors", example: "Owner: Gerente Regional · Contributors: 3 supervisores" },
          { label: "Scorecard personal", example: "Ese KPI pesa 30% en el scorecard de cada uno" },
        ],
        note: "Si cambia un objetivo, la cascada te dice exactamente qué KPIs y qué personas se ven afectados.",
      },
      {
        kind: "compare",
        eyebrow: "Cómo medir",
        title: "Indicadores de resultado vs. indicadores de causa",
        left: { label: "De resultado", points: ["Te dicen si ganaste, cuando ya pasó.", "Ej.: ventas del mes, rotación anual, utilidad.", "Difíciles de mover directamente."] },
        right: { label: "De causa", points: ["Anticipan el resultado y sí puedes influirlos hoy.", "Ej.: visitas efectivas, entrevistas de permanencia, pedidos a tiempo.", "Son los que se gestionan cada semana."] },
        note: "Un buen scorecard combina ambos: el resultado te dice a dónde vas; la causa, cómo llegar.",
      },
      {
        kind: "reveal",
        eyebrow: "Los roles",
        title: "Un dato, un dueño",
        intro: "En METIS cada indicador, en cada alcance, tiene un solo dueño. Toca cada rol.",
        items: [
          { tag: "O", label: "Owner", body: "Dueño del resultado en un alcance. Carga el dato cada periodo y responde por él." },
          { tag: "C", label: "Contributor", body: "Participa en el resultado sin capturarlo. Su scorecard se actualiza solo cuando el Owner carga." },
        ],
      },
      {
        kind: "check",
        eyebrow: "Pruébate",
        title: "Dos áreas, dos cifras",
        question: "Finanzas y Comercial llegan a la junta con cifras distintas de «Venta Región Norte». ¿Qué lo evita?",
        options: [
          { text: "Que ambos capturen y se promedie", why: "Promediar dos versiones no da una verdad: da una tercera versión." },
          { text: "Que un solo Owner capture el dato y los demás lo vean como Contributors", correct: true, why: "Exacto. Hay una sola captura y todos los scorecards vinculados usan ese mismo dato." },
          { text: "Que el director decida cada mes cuál cifra usar", why: "Eso convierte la junta en una discusión sobre el dato en lugar de sobre la decisión." },
        ],
      },
    ],
    quiz: [
      {
        q: "Un colaborador de almacén dice: «Yo nomás acomodo cajas, lo de la estrategia es de los directores». ¿Qué le falta?",
        options: [
          { text: "Línea de vista: entender qué objetivo de la empresa mueve su trabajo", correct: true, why: "Cuando ve que «pedidos completos y a tiempo» impacta la satisfacción del cliente, su trabajo deja de ser «acomodar cajas»." },
          { text: "Un bono más alto", why: "El incentivo ayuda, pero sin saber a qué contribuye no sabe hacia dónde empujar." },
          { text: "Más KPIs en su scorecard", why: "Más indicadores no dan claridad; normalmente quitan foco." },
          { text: "Nada: la estrategia sí es solo de los directores", why: "Si la estrategia no baja a la operación, se queda en el papel." },
        ],
      },
      {
        q: "La meta es reducir la rotación de personal. ¿Cuál es un indicador de causa?",
        options: [
          { text: "% de rotación anual", why: "Es de resultado: te dice lo que ya pasó." },
          { text: "Costo de reclutamiento", why: "También es consecuencia de la rotación, no su causa." },
          { text: "% de colaboradores con entrevista de permanencia este mes", correct: true, why: "Se puede mover esta semana y detecta salidas antes de que ocurran." },
          { text: "Número total de empleados", why: "Es un dato de tamaño; no anticipa la rotación." },
        ],
      },
      {
        q: "¿Qué papel juega una LAE dentro de la cascada?",
        options: [
          { text: "Es el bono que se paga al cumplir un KPI", why: "La compensación se conecta al scorecard, pero no es lo que define una LAE." },
          { text: "Traduce un objetivo corporativo en un frente de acción concreto que agrupa KPIs y proyectos", correct: true, why: "La LAE es el puente: aterriza un objetivo amplio en frentes concretos que sí se pueden medir y asignar." },
          { text: "Es el nombre técnico del scorecard", why: "El scorecard es personal; la LAE vive en la estrategia de la empresa." },
          { text: "Es la meta numérica de cada indicador", why: "La meta vive en el scorecard; la LAE es el frente de acción." },
        ],
      },
      {
        q: "Una directora tiene 14 KPIs en su scorecard, todos con un peso parecido (≈7% cada uno). ¿Cuál es el mayor riesgo?",
        options: [
          { text: "Ninguno: entre más se mida, mejor", why: "Medir mucho no es gestionar mejor; el equipo pierde de vista lo importante." },
          { text: "Que ninguno pese lo suficiente para cambiar prioridades: se diluye el foco", correct: true, why: "Con 14 indicadores, fallar en uno casi no se nota. Lo sano son pocos KPIs (5 a 8) con pesos que reflejen la prioridad." },
          { text: "Que el sistema se vuelva lento", why: "El riesgo no es técnico, es de foco." },
          { text: "Que su jefe no lo pueda aprobar", why: "Sí lo puede aprobar; el problema es que no ayudará a ejecutar." },
        ],
      },
      {
        q: "Cambia la estrategia y se elimina un objetivo corporativo. ¿Qué te permite una cascada bien conectada?",
        options: [
          { text: "Saber exactamente qué LAEs, KPIs y scorecards se ven afectados", correct: true, why: "Como todo está conectado, el impacto se ve en minutos y se ajusta solo lo necesario." },
          { text: "Borrar todo y empezar de cero", why: "No hace falta: la cascada te deja ajustar solo lo que cuelga de ese objetivo." },
          { text: "Esperar al siguiente año fiscal", why: "Seguir midiendo algo que ya no es prioridad desalinea al equipo durante meses." },
          { text: "Mantener los KPIs aunque ya no apunten a nada", why: "Un KPI sin objetivo es esfuerzo sin dirección." },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 2 · Equipos
  {
    id: "equipos",
    n: 2,
    title: "Equipos alineados: las 5 disfunciones",
    subtitle: "Por qué una estrategia clara no basta si el equipo no funciona como equipo.",
    minutes: 7,
    topics: ["Lencioni", "Confianza", "Conflicto productivo", "Seguridad psicológica"],
    icon: "users",
    blocks: [
      {
        kind: "text",
        eyebrow: "Por qué importa",
        title: "Los KPIs perfectos no sirven si el equipo no funciona",
        body: [
          "Puedes tener objetivos e indicadores impecables y aun así fallar: juntas donde nadie dice lo que piensa, acuerdos que no se cumplen, áreas que compiten entre sí.",
          "Patrick Lencioni lo explicó con cinco disfunciones apiladas como pirámide: cada una nace de la que está debajo.",
        ],
        callout: { label: "Fuente", text: "Patrick Lencioni, «Las cinco disfunciones de un equipo» (2002)." },
      },
      {
        kind: "reveal",
        eyebrow: "La pirámide",
        title: "De la base a la cima",
        intro: "Toca cada nivel para ver cómo se nota y cuál es el antídoto.",
        layout: "pyramid",
        items: [
          { tag: "1", label: "Ausencia de confianza", body: "Nadie quiere mostrarse vulnerable: no se admiten errores ni se pide ayuda.", details: [{ label: "Cómo se nota", text: "Los KPIs en rojo se esconden hasta el cierre." }, { label: "Antídoto", text: "Que el líder sea el primero en reconocer sus errores. Un rojo es información, no un castigo." }] },
          { tag: "2", label: "Temor al conflicto", body: "Se prefiere una armonía artificial a un debate incómodo.", details: [{ label: "Cómo se nota", text: "Juntas tranquilas y críticas de pasillo." }, { label: "Antídoto", text: "Debatir ideas con datos, no a personas. Pedir explícitamente la opinión contraria." }] },
          { tag: "3", label: "Falta de compromiso", body: "Sin debate real, la gente dice que sí pero no está convencida.", details: [{ label: "Cómo se nota", text: "Acuerdos ambiguos que nadie ejecuta." }, { label: "Antídoto", text: "Cerrar cada sesión con compromisos claros: qué, quién y para cuándo." }] },
          { tag: "4", label: "Evasión de responsabilidad", body: "Nadie le reclama a un compañero cuando incumple; se espera a que lo haga el jefe.", details: [{ label: "Cómo se nota", text: "Los mismos compromisos vencidos semana tras semana." }, { label: "Antídoto", text: "Un marcador visible para todos y revisión entre pares en cada sesión." }] },
          { tag: "5", label: "Falta de atención a los resultados", body: "El estatus, el ego o el área pesan más que el resultado colectivo.", details: [{ label: "Cómo se nota", text: "Cada director celebra su verde mientras la empresa va en rojo." }, { label: "Antídoto", text: "Objetivos compartidos y un peso del resultado corporativo en cada scorecard." }] },
        ],
      },
      {
        kind: "check",
        eyebrow: "Pruébate",
        title: "¿Por dónde empezarías?",
        question: "En la junta todos asienten al plan. Una semana después nadie lo ejecuta y en los pasillos se critica. ¿Qué nivel atacarías primero?",
        options: [
          { text: "Falta de atención a los resultados", why: "Es real, pero es una consecuencia: el problema empieza más abajo." },
          { text: "Temor al conflicto: nadie expresó sus dudas en la junta", correct: true, why: "Sin debate abierto no hay compromiso real. Si las dudas salen en el pasillo, primero hay que sacarlas en la mesa." },
          { text: "Evasión de responsabilidad", why: "Vendrá después; antes, el acuerdo tiene que ser real." },
        ],
      },
      {
        kind: "text",
        eyebrow: "Seguridad psicológica",
        title: "La base de todo: poder decir «me equivoqué» sin miedo",
        body: [
          "Amy Edmondson, de Harvard, la define como la creencia compartida de que el equipo es un lugar seguro para tomar riesgos interpersonales.",
          "Cuando Google estudió a más de 180 equipos (Proyecto Aristóteles), fue el factor que más distinguía a los equipos de alto desempeño.",
        ],
        callout: { label: "En la práctica", text: "Pregunta «¿qué necesitas para pasar a verde?» en lugar de «¿por qué estás en rojo?»." },
      },
      {
        kind: "compare",
        eyebrow: "En la conversación",
        title: "Frases que esconden vs. frases que alinean",
        left: { label: "Esconden", points: ["«Todo bien, vamos en línea.»", "«Eso no es de mi área.»", "«Mejor lo vemos después.»"] },
        right: { label: "Alinean", points: ["«Voy en rojo en OTIF; necesito apoyo de Logística.»", "«Tu KPI afecta el mío, ¿lo revisamos juntos?»", "«Acordemos qué, quién y para cuándo.»"] },
      },
    ],
    quiz: [
      {
        q: "¿Por qué la ausencia de confianza está en la base de la pirámide?",
        options: [
          { text: "Porque es la menos importante", why: "Al contrario: es la base porque todo lo demás se apoya en ella." },
          { text: "Porque sin confianza no hay conflicto honesto, y sin conflicto no hay compromiso ni responsabilidad", correct: true, why: "Cada nivel depende del anterior. Si no puedo ser vulnerable, no debato; si no debato, no me comprometo de verdad." },
          { text: "Porque solo afecta a los directores", why: "Afecta a cualquier equipo, en cualquier nivel." },
          { text: "Porque se resuelve con un bono de equipo", why: "La confianza se construye con conductas, sobre todo las del líder; no se compra." },
        ],
      },
      {
        q: "Un gerente oculta que su KPI va en rojo hasta el cierre del trimestre. ¿Qué disfunción muestra primero?",
        options: [
          { text: "Ausencia de confianza: teme mostrarse vulnerable", correct: true, why: "Esconder un rojo es miedo a lo que pasará si se sabe. Ahí empieza la pirámide." },
          { text: "Falta de atención a los resultados", why: "Puede terminar ahí, pero el origen es no sentirse seguro de mostrar el problema." },
          { text: "Temor al conflicto", why: "Está relacionado, pero el primer síntoma es no poder mostrarse vulnerable." },
          { text: "Ninguna: es una estrategia personal", why: "Cada mes oculto es un mes perdido para corregir el rumbo de todos." },
        ],
      },
      {
        q: "El KPI de un compañero está en rojo y está afectando el tuyo. ¿Qué es lo más sano para el equipo?",
        options: [
          { text: "Esperar a que el jefe lo note", why: "Delegar la incomodidad al jefe es justo la evasión de responsabilidad entre pares." },
          { text: "Comentarlo con otros compañeros", why: "Eso es crítica de pasillo: síntoma de temor al conflicto." },
          { text: "Plantearlo directo con él, con el dato en la mano, y acordar un compromiso", correct: true, why: "Responsabilidad entre pares: conversación directa, basada en datos y con un acuerdo concreto." },
          { text: "Ajustar tu meta para que no se note", why: "Maquillar la meta esconde el problema en lugar de resolverlo." },
        ],
      },
      {
        q: "Cada director celebra sus KPIs en verde mientras la utilidad de la empresa cae. ¿Qué disfunción es y qué ayuda?",
        options: [
          { text: "Falta de atención a los resultados; ayuda incluir un peso del resultado corporativo en cada scorecard", correct: true, why: "Cuando todos comparten una parte del resultado común, ganar solo en tu área deja de ser suficiente." },
          { text: "Temor al conflicto; ayuda hacer juntas más cortas", why: "Acortar juntas no cambia hacia dónde mira cada director." },
          { text: "Ausencia de confianza; ayuda un viaje de integración", why: "La integración suma, pero el síntoma aquí es que cada quien mira su propio resultado." },
          { text: "Falta de compromiso; ayuda agregar más KPIs", why: "Más KPIs refuerzan los silos en lugar de unirlos." },
        ],
      },
      {
        q: "¿Qué pregunta genera más seguridad psicológica ante un KPI en rojo?",
        options: [
          { text: "«¿Por qué otra vez estás en rojo?»", why: "Pone a la persona a la defensiva y la próxima vez lo esconderá." },
          { text: "«¿Quién es el responsable de esto?»", why: "Buscar culpables enseña a no mostrar los problemas." },
          { text: "«¿Qué necesitas para pasar a verde y cómo te ayudamos?»", correct: true, why: "Mira hacia adelante, reconoce el problema sin castigar y abre la puerta a pedir ayuda." },
          { text: "«¿Cuándo pensabas avisarnos?»", why: "Suena a reproche; refuerza el miedo a mostrar los rojos." },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 3 · Liderazgo
  {
    id: "liderazgo",
    n: 3,
    title: "Liderazgo que ejecuta",
    subtitle: "Foco, marcador y ritmo: cómo un líder convierte la estrategia en resultados semana a semana.",
    minutes: 7,
    topics: ["4 disciplinas de la ejecución", "El torbellino", "Ritmo WTW / WTM", "Feedback SCI"],
    icon: "flag",
    blocks: [
      {
        kind: "text",
        eyebrow: "El rol del líder",
        title: "Liderar la estrategia es, sobre todo, dar claridad",
        body: [
          "Tu equipo no necesita más mensajes motivacionales. Necesita saber qué es lo más importante, cómo se mide y qué se espera de cada quien esta semana.",
          "El problema es que el día a día (correos, urgencias, juntas) se come la agenda. A eso se le llama el torbellino.",
        ],
        callout: { label: "Idea clave", text: "El torbellino no se elimina: se le aparta a lo importante un espacio pequeño, fijo y protegido." },
      },
      {
        kind: "reveal",
        eyebrow: "El método",
        title: "Las 4 disciplinas de la ejecución",
        intro: "Un marco de McChesney, Covey y Huling. Toca cada disciplina.",
        items: [
          { tag: "1", label: "Enfócate en lo crucialmente importante", body: "Pocas metas, máximo 2 o 3 por equipo. Si todo es prioridad, nada lo es.", details: [{ label: "En METIS", text: "Pocos KPIs con peso alto en tu scorecard." }] },
          { tag: "2", label: "Actúa sobre los indicadores de causa", body: "No puedes mover las ventas del mes directamente; sí las visitas efectivas de esta semana.", details: [{ label: "En METIS", text: "Combina KPIs de resultado y de causa." }] },
          { tag: "3", label: "Mantén un marcador convincente", body: "Simple y visible: en 5 segundos cualquiera sabe si va ganando o perdiendo.", details: [{ label: "En METIS", text: "El semáforo de tu scorecard." }] },
          { tag: "4", label: "Crea una cadencia de rendición de cuentas", body: "Una sesión corta y fija en la que cada quien reporta sus compromisos y asume nuevos.", details: [{ label: "En METIS", text: "Las sesiones WTW y WTM." }] },
        ],
        source: "McChesney, Covey y Huling, «Las 4 disciplinas de la ejecución» (2012).",
      },
      {
        kind: "flow",
        eyebrow: "El ritmo",
        title: "WTW, WTM y cierre: el pulso de la estrategia",
        steps: [
          { label: "WTW · Win the Week", example: "Semanal, 20 a 30 min. Cada quien: 1) qué cumplí de lo prometido, 2) cómo va el marcador, 3) mi compromiso de esta semana." },
          { label: "WTM · Win the Month", example: "Mensual, tras el cierre. Se revisa el scorecard completo, los rojos y sus causas, y se ajusta el plan." },
          { label: "Cierre anual", example: "El cumplimiento ponderado del año se conecta con la evaluación y la compensación." },
        ],
        note: "La regla de oro: misma hora, mismo formato, sin cancelar. La constancia vale más que la duración.",
      },
      {
        kind: "compare",
        eyebrow: "Compromisos",
        title: "¿Qué es un buen compromiso semanal?",
        left: { label: "Vago", points: ["«Echarle ganas a ventas.»", "«Revisar lo de inventarios.»", "«Mejorar la atención al cliente.»"] },
        right: { label: "Accionable", points: ["«Visitar a los 5 clientes top de Monterrey antes del viernes.»", "«Conciliar el inventario de la planta MTY el miércoles.»", "«Cerrar las 8 quejas abiertas antes del jueves.»"] },
        note: "Qué, quién y para cuándo. Si no lo puedes marcar como «cumplido» o «no cumplido», no es un compromiso.",
      },
      {
        kind: "compare",
        eyebrow: "Feedback",
        title: "Feedback que sí cambia conductas: modelo SCI",
        intro: "Situación · Comportamiento · Impacto (Center for Creative Leadership).",
        left: { label: "Juicio", points: ["«Eres muy desorganizado.»", "«Nunca cargas a tiempo.»"] },
        right: { label: "SCI", points: ["«En el cierre de marzo (S) cargaste el OTIF el día 6 (C), y tus 3 Contributors no pudieron enviar su scorecard (I).»"] },
        note: "El juicio provoca defensa; los hechos permiten conversar y corregir.",
      },
      {
        kind: "check",
        eyebrow: "Pruébate",
        title: "Demasiadas prioridades",
        question: "Tu área tiene 9 «prioridades» para el trimestre. ¿Qué te sugiere la primera disciplina?",
        options: [
          { text: "Conseguir más recursos para atender las 9", why: "Más recursos no resuelven la falta de foco; el torbellino se los comerá." },
          { text: "Elegir de 1 a 3 metas crucialmente importantes y protegerles tiempo", correct: true, why: "Eso es: pocas metas bien atendidas superan a muchas a medias." },
          { text: "Avanzar las 9 un poco cada día", why: "Así es como todas avanzan poco y ninguna se logra." },
        ],
      },
    ],
    quiz: [
      {
        q: "¿Cuál es el mejor compromiso para una WTW?",
        options: [
          { text: "«Mejorar la satisfacción del cliente»", why: "Es una aspiración, no un compromiso: no tiene acción concreta ni fecha." },
          { text: "«Llamar a los 5 clientes con queja abierta antes del jueves y registrar la solución»", correct: true, why: "Tiene acción, cantidad y fecha, y mueve un indicador de causa. La siguiente semana es fácil decir si se cumplió." },
          { text: "«Echarle ganas al trimestre»", why: "No se puede verificar; no es un compromiso." },
          { text: "«Revisar el tema de inventarios»", why: "«Revisar el tema» no dice qué resultado se entregará ni cuándo." },
        ],
      },
      {
        q: "Un KPI lleva dos meses en rojo. ¿Cuál es el mejor primer paso del líder?",
        options: [
          { text: "Bajar la meta para que pase a verde", why: "Mover la meta esconde el problema y le quita credibilidad al scorecard." },
          { text: "Esperar al cierre anual", why: "Para entonces ya no hay tiempo de corregir." },
          { text: "Revisar con el Owner los indicadores de causa y acordar compromisos con fecha", correct: true, why: "Buscar la causa y convertirla en acciones concretas es como se recupera un rojo." },
          { text: "Cambiar al Owner de inmediato", why: "Cambiar a la persona sin entender la causa rara vez resuelve el problema." },
        ],
      },
      {
        q: "¿Cuál de estos mensajes sigue el modelo SCI?",
        options: [
          { text: "«Tienes que ser más comprometido.»", why: "Es un juicio: no describe una situación ni una conducta concreta." },
          { text: "«En la WTW del lunes llegaste sin tu avance y no pudimos decidir el presupuesto.»", correct: true, why: "Situación (WTW del lunes), comportamiento (sin avance) e impacto (no se decidió). Hechos, no etiquetas." },
          { text: "«Siempre llegas tarde a todo.»", why: "«Siempre» y «todo» son generalizaciones que generan defensa." },
          { text: "«Me dijeron que no estás contento.»", why: "Se basa en rumores, no en una conducta observada." },
        ],
      },
      {
        q: "¿Para qué sirve que el marcador sea simple y visible para todo el equipo?",
        options: [
          { text: "Para vigilar a las personas", why: "El objetivo no es el control, sino que cada quien sepa cómo va y decida a tiempo." },
          { text: "Para que cualquiera sepa en segundos si va ganando y actúe a tiempo", correct: true, why: "La gente juega distinto cuando lleva el marcador. Si no se entiende en segundos, no impulsa la acción." },
          { text: "Para que el reporte se vea profesional", why: "La estética es secundaria; lo que importa es que provoque acción." },
          { text: "Para cumplir con auditoría", why: "El marcador es para el equipo, no para un tercero." },
        ],
      },
      {
        q: "¿Qué es «el torbellino» y cómo se maneja?",
        options: [
          { text: "Una crisis que hay que eliminar por completo", why: "El día a día no se puede eliminar: mantiene viva a la empresa." },
          { text: "El trabajo del día a día; se maneja apartando un espacio fijo y pequeño para lo importante", correct: true, why: "No se trata de pelear contra la operación, sino de proteger unas horas a la semana para las metas crucialmente importantes." },
          { text: "Una técnica de lluvia de ideas", why: "No: es la urgencia diaria que consume la agenda." },
          { text: "El cierre de mes", why: "El cierre es parte del ritmo; el torbellino es todo lo urgente que compite con lo importante." },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 4 · Revisiones
  {
    id: "revisiones",
    n: 4,
    title: "Revisiones 1 a 1 y de equipo",
    subtitle: "Cómo llevar la revisión vertical con cada colaborador y la sesión de equipo (WTW/WTM): el tono, las preguntas y el paso a paso.",
    minutes: 8,
    topics: ["Revisión vertical vs. de equipo", "El tono del líder", "Preguntas poderosas", "Guía 1 a 1 y WTW/WTM"],
    icon: "message",
    blocks: [
      {
        kind: "compare",
        eyebrow: "Dos conversaciones",
        title: "Revisión vertical y revisión de equipo: no son la misma junta",
        neutral: true,
        intro: "Las dos son necesarias. Mezclarlas es el error más común.",
        left: { label: "Vertical · 1 a 1", points: ["Tú y una persona de tu equipo.", "Cada 4 a 6 semanas, 30 min.", "Su scorecard, sus obstáculos y su desarrollo.", "Lo personal se queda aquí: errores, carrera, feedback."] },
        right: { label: "De equipo · WTW / WTM", points: ["Todo el equipo, misma hora siempre.", "WTW semanal (20–30 min) · WTM mensual tras el cierre.", "El marcador común y los compromisos de cada quien.", "Nadie es exhibido: se habla de resultados, no de personas."] },
        note: "Regla práctica: si el tema solo involucra a una persona o puede incomodarla, va al 1 a 1. Si afecta el marcador de todos, va a la sesión de equipo.",
      },
      {
        kind: "compare",
        eyebrow: "El tono",
        title: "El tono del líder: coach, no inspector",
        intro: "La misma pregunta puede abrir o cerrar la conversación según cómo se hace.",
        left: { label: "Inspector", points: ["«¿Por qué otra vez en rojo?»", "Habla él el 80% del tiempo.", "Busca culpables.", "Resuelve todo por la persona.", "Cancela cuando hay urgencias."] },
        right: { label: "Coach", points: ["«¿Qué está pasando con el OTIF y qué necesitas?»", "Escucha el 70% del tiempo.", "Busca causas y siguientes pasos.", "Pregunta primero, sugiere después.", "Protege la cita: misma hora, sin cancelar."] },
        note: "Firme con los resultados, cálido con las personas. Exigencia y seguridad psicológica no se contraponen: se necesitan.",
      },
      {
        kind: "reveal",
        eyebrow: "Qué preguntar",
        title: "Preguntas poderosas para cada momento",
        intro: "Preguntas abiertas: no se contestan con sí o no. Toca cada momento.",
        items: [
          { tag: "1", label: "Abrir", body: "Conecta con la persona antes que con el número.", details: [{ label: "Pregunta", text: "«¿Cómo llegas hoy? ¿Qué es lo más importante que quieres tratar?»" }, { label: "Pregunta", text: "«¿Qué salió bien desde la última vez?»" }] },
          { tag: "2", label: "Explorar", body: "Entiende la causa antes de opinar.", details: [{ label: "Pregunta", text: "«¿Qué crees que está provocando ese resultado?»" }, { label: "Pregunta", text: "«¿Qué indicador de causa podemos mover esta semana?»" }] },
          { tag: "3", label: "Destrabar", body: "Tu trabajo como líder es quitar obstáculos.", details: [{ label: "Pregunta", text: "«¿Qué te está frenando y qué puedo hacer yo para ayudarte?»" }, { label: "Pregunta", text: "«¿A quién necesitas que te conecte?»" }] },
          { tag: "4", label: "Comprometer", body: "Toda revisión termina en acciones concretas.", details: [{ label: "Pregunta", text: "«¿Qué vas a hacer, para cuándo y cómo sabremos que se cumplió?»" }] },
          { tag: "5", label: "Desarrollar", body: "Mira más allá del mes: su crecimiento.", details: [{ label: "Pregunta", text: "«¿Qué habilidad quieres fortalecer este trimestre?»" }, { label: "Pregunta", text: "«¿Qué feedback tienes para mí?»" }] },
        ],
        note: "Evita los «¿por qué no…?»: suenan a acusación. Cámbialos por «¿qué pasó…?» o «¿qué necesitas…?».",
      },
      {
        kind: "flow",
        eyebrow: "Guía · 1 a 1",
        title: "La conversación de desarrollo 1 a 1, paso a paso (30 min)",
        steps: RV_GUIDE.map((g) => ({ label: `${g.label} (${g.minutes} min)`, example: g.example })),
        note: RV_GUIDE_NOTE,
      },
      {
        kind: "flow",
        eyebrow: "Guía · equipo",
        title: "La revisión de equipo (WTW), paso a paso (20–30 min)",
        steps: [
          { label: "Marcador primero (5 min)", example: "Proyecta el mapa o los reportes de METIS. ¿Vamos ganando o perdiendo? Sin rodeos ni presentaciones largas." },
          { label: "Rendición de cuentas (10 min)", example: "Cada quien, 1 minuto: «Me comprometí a… Cumplí / no cumplí. Aprendí…». Sin justificaciones largas." },
          { label: "Despejar el camino (5 min)", example: "¿Qué obstáculo necesita ayuda de otro? Se acuerda quién ayuda. Los temas largos se agendan aparte." },
          { label: "Nuevos compromisos (5 min)", example: "Cada quien dice en voz alta su compromiso de la semana: qué, para cuándo, y qué indicador mueve." },
          { label: "Cierre (1 min)", example: "El líder repite los acuerdos y recuerda la próxima cita. Misma hora la siguiente semana." },
        ],
        note: "La WTM sigue el mismo guion, pero con el scorecard completo del mes: rojos, causas y ajustes al plan. Termina con acuerdos, igual que la WTW.",
      },
      {
        kind: "check",
        eyebrow: "Pruébate",
        title: "Un rojo frente a todos",
        question: "En la WTW, Luis reporta que no cumplió por tercera semana seguida y el equipo se queda callado. ¿Qué haces?",
        options: [
          { text: "Le llamas la atención ahí mismo para que sirva de ejemplo", why: "Exhibir a alguien frente al equipo destruye la confianza y hace que todos oculten problemas." },
          { text: "Le preguntas qué obstáculo tiene y quién puede ayudarle, y agendas un 1 a 1 para profundizar", correct: true, why: "En equipo se destraba lo urgente con respeto; lo personal y la conversación de fondo van al 1 a 1." },
          { text: "Lo dejas pasar para no incomodar", why: "Ignorarlo le quita valor a los compromisos de todos y evita el conflicto productivo." },
        ],
      },
    ],
    quiz: [
      {
        q: "Ana, de tu equipo, tiene un tema personal que afecta su desempeño. ¿Dónde lo hablas?",
        options: [
          { text: "En la WTW, para que el equipo entienda", why: "La sesión de equipo es para el marcador común; lo personal expone a la persona." },
          { text: "En un 1 a 1, en privado", correct: true, why: "La revisión vertical es el espacio seguro para lo personal, el feedback y el desarrollo." },
          { text: "Por chat, para no quitar tiempo", why: "Los temas sensibles necesitan conversación, no mensajes que se malinterpretan." },
          { text: "En la WTM con Recursos Humanos", why: "Lo primero es una conversación directa y privada entre líder y colaborador." },
        ],
      },
      {
        q: "¿Cuál pregunta refleja mejor el tono de coach ante un KPI en rojo?",
        options: [
          { text: "«¿Por qué no cumpliste otra vez?»", why: "El «¿por qué no…?» suena a acusación y provoca justificaciones." },
          { text: "«Esto no puede seguir así.»", why: "Es una sentencia, no una pregunta: cierra la conversación." },
          { text: "«¿Qué está provocando este resultado y qué necesitas para moverlo?»", correct: true, why: "Explora la causa y ofrece apoyo, sin bajar la exigencia sobre el resultado." },
          { text: "«¿Quién tuvo la culpa?»", why: "Buscar culpables hace que la gente esconda problemas en lugar de resolverlos." },
        ],
      },
      {
        q: "En un 1 a 1 de desarrollo, ¿quién debería hablar más?",
        options: [
          { text: "El líder, para dar instrucciones claras", why: "Si el líder habla todo el tiempo, se pierde lo que la persona sabe y necesita." },
          { text: "El colaborador: el líder escucha la mayor parte del tiempo y pregunta", correct: true, why: "Es su espacio: su agenda va primero y el líder guía con preguntas (aprox. 70/30)." },
          { text: "Ambos exactamente igual, con cronómetro", why: "No se trata de medir minutos sino de que la persona se exprese y se comprometa." },
          { text: "Da igual mientras se revisen los números", why: "Si solo se revisan números, es un reporte, no una conversación de desarrollo." },
        ],
      },
      {
        q: "¿Cuál es el orden correcto de una WTW?",
        options: [
          { text: "Presentaciones de cada área → dudas → cierre", why: "Eso convierte la WTW en una junta larga de reportes sin compromisos." },
          { text: "Marcador → rendición de cuentas → despejar el camino → nuevos compromisos", correct: true, why: "Primero dónde estamos, luego qué cumplió cada quien, qué obstáculo destrabar y qué sigue." },
          { text: "Nuevos compromisos → marcador → cierre", why: "Sin revisar primero lo prometido, los compromisos pierden peso." },
          { text: "Lluvia de ideas libre sobre el mes", why: "La WTW necesita un guion fijo y corto para que se sostenga cada semana." },
        ],
      },
      {
        q: "¿Cómo debe terminar cualquier revisión, 1 a 1 o de equipo?",
        options: [
          { text: "Con una frase motivacional", why: "Motiva un momento, pero no cambia lo que pasa el lunes." },
          { text: "Con un resumen del líder sobre lo que salió mal", why: "Cierra en negativo y sin acciones." },
          { text: "Con compromisos concretos, con fecha, dichos por cada persona", correct: true, why: "Qué, quién y para cuándo. Dichos por la propia persona generan más compromiso y se revisan en la siguiente sesión." },
          { text: "Con la fecha de la siguiente junta y nada más", why: "Sin acuerdos concretos, la siguiente junta empieza desde cero." },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 5 · Tour
  {
    id: "tour",
    n: 5,
    title: "Tour por METIS",
    subtitle: "Un recorrido por la plataforma: para qué sirve cada sección y cómo encaja en tu mes.",
    minutes: 5,
    topics: ["Inicio", "Scorecard", "Carga mensual", "Mapa", "Tu equipo", "Botón de ayuda"],
    icon: "map",
    blocks: [
      { kind: "screen", eyebrow: "1 de 7", nav: "inicio", title: "Inicio: tu mes en un vistazo", body: ["Tu cumplimiento ponderado, lo que te falta cargar y los scorecards de tu equipo por aprobar.", "Es tu punto de partida cada vez que entras."] },
      { kind: "screen", eyebrow: "2 de 7", nav: "scorecard", title: "Mi Scorecard: cómo te mides este año", body: ["Tus KPIs y proyectos, cada uno con su peso y su semáforo.", "Lo armas en borrador, lo envías a tu jefe y, cuando lo aprueba, queda como tu compromiso del año. Toca cada estado."] },
      { kind: "screen", eyebrow: "3 de 7", nav: "carga", title: "Carga mensual: un dato, una vez", body: ["Si eres Owner de un indicador, aquí capturas su resultado cada mes.", "Pruébalo: escribe un valor y mira cómo se actualizan los Contributors al instante."] },
      { kind: "screen", eyebrow: "4 de 7", nav: "mapa", title: "Mapa de alineación: la cascada completa", body: ["Muestra cómo cada objetivo baja a LAEs, indicadores y personas.", "Es la respuesta visual a «¿mi trabajo a qué contribuye?». Toca un objetivo."] },
      { kind: "screen", eyebrow: "5 de 7", nav: "equipo", title: "Mi equipo y Reportes", body: ["Si tienes gente a cargo, aquí ves el avance de cada quien y apruebas sus scorecards.", "Reportes te da la foto de toda la organización para la WTM."] },
      { kind: "screen", eyebrow: "6 de 7", nav: "buscar", title: "Buscador y recordatorios", body: ["Presiona ⌘K (o Ctrl+K) para encontrar cualquier indicador, proyecto o persona.", "Y no tienes que acordarte del cierre: METIS te avisa por correo antes de que venza."] },
      { kind: "screen", eyebrow: "7 de 7", nav: "ayuda", title: "Tu instructor: el botón «?»", body: ["En la esquina inferior derecha de cada pantalla verás un pequeño botón con un signo de interrogación.", "Ábrelo cuando tengas una duda: te explica la página en la que estás, qué hacer ahí y responde las preguntas más comunes. Pruébalo."] },
    ],
    quiz: [
      {
        q: "Eres Contributor de «Venta Región Norte». ¿Tienes que capturar ese dato cada mes?",
        options: [
          { text: "Sí: todos los que participan capturan", why: "Si todos capturaran, habría varias versiones del mismo dato." },
          { text: "No: lo captura el Owner y tu scorecard se actualiza solo", correct: true, why: "Un dato, un dueño. Tu scorecard toma el valor en cuanto el Owner lo guarda." },
          { text: "Solo si el Owner se olvida", why: "El Contributor nunca captura; si falta el dato, METIS le recuerda al Owner." },
          { text: "Solo en el cierre anual", why: "El dato se carga cada periodo, y lo hace el Owner." },
        ],
      },
      {
        q: "Tu scorecard dice «Enviado a jefe». ¿Qué sigue?",
        options: [
          { text: "Tu jefe lo aprueba o te pide ajustes", correct: true, why: "Tu jefe directo lo revisa: lo aprueba, pide ajustes o lo deniega. Lo ves reflejado en el estado." },
          { text: "Se aprueba solo en 24 horas", why: "La aprobación siempre es una decisión de tu jefe." },
          { text: "Hay que enviarlo de nuevo cada mes", why: "El scorecard se aprueba una vez al año; cada mes solo se cargan resultados." },
          { text: "Recursos Humanos lo revisa", why: "En METIS lo aprueba tu jefe directo." },
        ],
      },
      {
        q: "Quieres explicarle a alguien nuevo cómo su KPI conecta con los objetivos de la empresa. ¿Qué sección le muestras?",
        options: [
          { text: "Carga mensual", why: "Ahí se capturan datos, no se ve la cascada." },
          { text: "Mapa de alineación", correct: true, why: "El mapa muestra la cascada completa: objetivo → LAE → indicador → personas." },
          { text: "Notificaciones", why: "Ahí se configuran los recordatorios." },
          { text: "Unidades de medida", why: "Es un catálogo de configuración." },
        ],
      },
      {
        q: "Un KPI aparece en «Mínimo». ¿Qué significa?",
        options: [
          { text: "Que todavía no tiene dato", why: "Eso se muestra como «Sin dato»." },
          { text: "Que va por debajo de la meta pero arriba del umbral mínimo: hay que actuar", correct: true, why: "Es la zona de alerta: todavía cuenta, pero si no se corrige puede caer a «Bajo mínimo»." },
          { text: "Que superó la meta", why: "Eso sería «Satisfactorio» o «Sobresaliente»." },
          { text: "Que el KPI tiene poco peso", why: "El semáforo mide el resultado, no el peso." },
        ],
      },
      {
        q: "¿Cuál es la forma más rápida de encontrar el indicador «OTIF» en METIS?",
        options: [
          { text: "Revisar menú por menú", why: "Funciona, pero hay un camino más rápido." },
          { text: "Pedirle a tu jefe que te mande el enlace", why: "No hace falta: lo encuentras tú en segundos." },
          { text: "Presionar ⌘K (o Ctrl+K) y escribir «otif»", correct: true, why: "El buscador encuentra páginas, indicadores, proyectos y personas desde cualquier pantalla." },
          { text: "Descargar un reporte y buscarlo en Excel", why: "Es mucho más lento y el dato podría no estar actualizado." },
        ],
      },
      {
        q: "Estás en Carga mensual y no sabes cómo adjuntar evidencia. ¿Qué es lo más rápido?",
        options: [
          { text: "Esperar a tu próximo 1 a 1 para preguntar", why: "Puedes resolverlo en segundos sin esperar a nadie." },
          { text: "Abrir el botón «?» de la esquina inferior derecha", correct: true, why: "El instructor te explica la página en la que estás y responde las dudas más comunes, como adjuntar evidencia." },
          { text: "Volver a tomar Metis Academy", why: "La Academia da el panorama; para dudas puntuales de una pantalla está el botón «?»." },
          { text: "Dejar el dato sin evidencia", why: "La evidencia respalda tu dato; mejor aprende a adjuntarla con la guía." },
        ],
      },
    ],
  },
];

export const MODULE_IDS = MODULES.map((m) => m.id);
export const moduleById = (id: string) => MODULES.find((m) => m.id === id);
export const TOTAL_MINUTES = MODULES.reduce((a, m) => a + m.minutes, 0);
