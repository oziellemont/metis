/**
 * MÊTIS 2.0 · Repositorio Académico · lote 02 (paquete 1.1) · EDIT-N1-012 · Riesgo y gobierno
 * «El proveedor es familia»
 *
 * «fuente»: texto tal cual del paquete. «adaptado»: el paquete lo describe y aquí se redactó.
 * «conversion»: pieza añadida al convertir. Las cifras son las del paquete, sin cambios.
 * La política que aparece es ficticia: no describe obligaciones legales de ningún país.
 */
import type { Experiencia } from "./tipos";

export const N1_RIESGO_EL_PROVEEDOR_ES_FAMILIA: Experiencia = {
  id: "exp.n1.rie.el-proveedor-es-familia",
  editorialId: "EDIT-N1-012",
  slug: "el-proveedor-es-familia",
  version: 1,
  packageVersion: "1.1",
  title: "El proveedor es familia",
  academy: "riesgo",
  skills: { primary: "rie.etica", secondary: ["rie.cumplimiento", "rie.stakeholders"] },
  level: 1,
  sourceIds: ["HBS_GOV", "STAN_CORE"],
  provenance: "creacion_original",
  minutes: [6, 8],
  objectives: [
    "Reconocer un conflicto de interés potencial.",
    "Distinguir interés personal, obligación de transparencia, decisiones sobre selección y trato justo.",
    "No asumir culpabilidad o ilegalidad sin datos.",
  ],
  characters: [{ id: "camila", name: "Camila", role: "Analista de compras en una editorial" }],
  docs: [
    {
      id: "A", letter: "A", title: "Invitación interna para comparar ofertas", unit: "Criterios anunciados", cols: ["Criterio anunciado", "Peso de referencia"],
      rows: [
        { id: "A.precio", label: "Precio total", cells: ["40 %"], nota: { origen: "conversion", text: "Es el criterio que más pesa, pero no el único: no llega a la mitad." } },
        { id: "A.plazo", label: "Cumplimiento del plazo requerido", cells: ["35 %"], nota: { origen: "conversion", text: "Si la imprenta puede entregar en la fecha que se necesita." } },
        { id: "A.calidad", label: "Muestra de calidad", cells: ["25 %"], nota: { origen: "conversion", text: "Se revisa una muestra impresa. Sin ella falta una cuarta parte de la evaluación." } },
      ],
      foot: "Los tres pesos suman 100 %.",
    },
    {
      id: "B", letter: "B", title: "Extracto de la política de la editorial", unit: "Política ficticia de este caso",
      rows: [
        { id: "B.comunicar", label: "Cualquier relación familiar o económica con un oferente debe comunicarse antes de participar en la recomendación o adjudicación.", nota: { origen: "conversion", text: "La obligación es avisar, y avisar antes. No dice que la persona haya hecho algo malo." } },
        { id: "B.mitigar", label: "La persona responsable de cumplimiento determinará cómo mitigar el conflicto.", nota: { origen: "conversion", text: "Quien decide el mecanismo (supervisión, abstención, revisión independiente) es cumplimiento, no la persona que tiene la relación." } },
        { id: "B.gestionar", label: "No existe prohibición automática de contratar a familiares, pero sí obligación de gestionar la relación.", nota: { origen: "conversion", text: "Tener un familiar entre los oferentes no lo descalifica. Lo que no se puede es dejar la relación sin gestionar." } },
      ],
    },
  ],
  moments: ["El mensaje", "Los documentos", "La regla", "Qué hace Camila", "Dato nuevo", "Tu mensaje", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "camila", channel: "Mensaje",
      text: "Estamos comparando tres imprentas. La dueña de una es mi prima. Su cotización está competitiva y yo conozco su calidad. ¿Eso significa que no debería participar en la evaluación?",
      role: "Camila te escribe como colega de confianza. No decides por ella ni por la editorial: la ayudas a ver qué le pide la política.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "Cómo se comparan las ofertas y qué dice la política",
      prompt: "Toca cada criterio y cada frase de la política para ver qué significa. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "regla",
    },
    {
      id: "regla", kind: "senalar", moment: 2, origen: "adaptado", from: null,
      text: "Un conflicto de interés es un interés personal que puede influir en una decisión. No es una prueba de que alguien actuó mal. Camila tiene uno: la dueña de una imprenta es su prima.",
      prompt: "Toca la frase de la política que le dice a Camila qué le toca hacer a ella primero.",
      docs: ["B"], correct: "B.comunicar",
      right: "La relación familiar con un oferente debe comunicarse antes de participar en la recomendación. Eso le toca a Camila; lo que venga después lo define cumplimiento.",
      wrong: {
        "B.mitigar": "Esa frase dice quién decide cómo manejar el conflicto: cumplimiento. Para que pueda hacerlo, antes alguien tiene que avisarle. Busca lo que le toca a Camila.",
        "B.gestionar": "Esa frase aclara que contratar a un familiar no está prohibido. Es importante, pero no dice qué debe hacer Camila primero.",
      },
      fallback: "Ese renglón no habla de lo que Camila debe hacer con su relación familiar. Busca en la política.",
      next: "inicial",
    },
    {
      id: "inicial", kind: "decision", moment: 3, origen: "fuente", from: "camila", text: "¿Qué hago entonces con la evaluación?",
      options: [
        {
          id: "validar", tipo: "defendible", origen: "fuente", next: "oferta",
          text: "Comunica la relación y pide que otra persona valide tu participación.",
          consequence: [{ who: "camila", text: "Le escribí a cumplimiento. Me pidieron seguir con las otras dos imprentas mientras deciden cómo revisar la de mi prima." }],
          feedback: "Te anticipaste y protegiste la confianza en el proceso. Tener un familiar entre los oferentes no es una falta; no decirlo sí incumpliría la política.",
        },
        {
          id: "abstenerse", tipo: "defendible", origen: "fuente", next: "oferta",
          text: "Comunícala y pide abstenerte de evaluar esa imprenta hasta recibir indicación.",
          consequence: [{ who: "camila", text: "Avisé y me aparté de esa cotización. Cumplimiento me dirá si otra persona la revisa o si participo con supervisión." }],
          feedback: "Es una respuesta prudente. Recuerda que solo la persona responsable de cumplimiento define el mecanismo final.",
        },
        {
          id: "callar", tipo: "concepto_erroneo", origen: "fuente", next: "oferta",
          text: "Sigue sin comunicarla: sabes que puedes evaluar con objetividad.",
          consequence: [{ who: "camila", text: "Seguí. Dos días después, un compañero supo del parentesco por otra vía y preguntó por qué nadie lo había dicho." }, { who: null, text: "Camila lo comunicó esa misma tarde a cumplimiento." }],
          feedback: "La política pide comunicar la relación antes de participar en la recomendación. No hacerlo incumple ese paso, aunque no prueba que Camila haya favorecido a su prima. Todavía se puede corregir: avisar ahora.",
        },
        {
          id: "excluir", tipo: "concepto_erroneo", origen: "adaptado", next: "oferta",
          text: "Saca a la imprenta de tu prima del concurso para evitar cualquier duda.",
          consequence: [{ who: "camila", text: "¿Sacarla sin más? La política dice que contratar a un familiar no está prohibido. Mejor aviso y que cumplimiento decida." }],
          feedback: "La política no contiene una prohibición absoluta: pide declarar y gestionar la relación. Evaluar con criterios objetivos y con controles es posible.",
        },
      ],
    },
    {
      id: "oferta", kind: "dato", moment: 4, origen: "fuente", title: "Llegan las tres cotizaciones",
      items: ["La imprenta de la prima de Camila ofrece el precio total más bajo de las tres.", "Las muestras de calidad todavía no se revisan, y la invitación las pide."],
      calc: "El precio pesa 40 %. Plazo y calidad suman 35 + 25 = 60 % de la evaluación.",
      next: "seguir",
    },
    {
      id: "seguir", kind: "decision", moment: 4, origen: "adaptado", from: "camila", text: "Con el precio más bajo sobre la mesa, ¿qué recomiendas?",
      options: [
        {
          id: "adjudicar", tipo: "concepto_erroneo", origen: "adaptado", next: "mensaje_final",
          text: "Adjudicarle de una vez: tiene el precio más bajo y eso es lo que más pesa.",
          consequence: [{ who: "camila", text: "El precio es 40 %. Si cerramos hoy, nadie habrá visto las muestras ni confirmado el plazo." }],
          feedback: "El precio es uno de tres criterios anunciados. Adjudicar sin revisar plazo y calidad deja fuera 60 % de la evaluación, sea quien sea el proveedor.",
        },
        {
          id: "continuar", tipo: "defendible", origen: "adaptado", next: "mensaje_final",
          text: "Seguir la evaluación con los tres criterios y la salvaguarda definida.",
          consequence: [{ who: "camila", text: "Entonces se piden las muestras a las tres y la de mi prima se revisa como indicó cumplimiento." }],
          feedback: "La oferta se evalúa con los criterios anunciados y con el control que definió cumplimiento. Ni se adjudica ni se descarta solo por el parentesco.",
        },
        {
          id: "descartar", tipo: "concepto_erroneo", origen: "adaptado", next: "mensaje_final",
          text: "Descartarla: un precio tan bajo de una familiar se verá sospechoso.",
          consequence: [{ who: "camila", text: "No hay nada que indique un trato indebido. Y la editorial perdería la oferta más barata sin haberla evaluado." }],
          feedback: "Descartar solo por el parentesco tampoco es un trato justo, y la política no lo pide. Una relación declarada y gestionada permite evaluar la oferta por sus méritos.",
        },
      ],
    },
    {
      id: "mensaje_final", kind: "redactar", moment: 5, origen: "fuente", from: "camila",
      ask: "Ayúdame a tenerlo claro en dos frases.",
      prompt: "Escribe a Camila dos frases.",
      fields: [{ id: "declarar", label: "Qué relación debe declarar" }, { id: "proteger", label: "Qué acción protege la imparcialidad antes de seguir" }],
      reference: "Declara que la dueña de una de las imprentas es tu prima. Antes de seguir, avisa a cumplimiento y espera a que defina cómo se revisa esa oferta.",
      ideas: ["Nombra la relación concreta: el parentesco con la dueña de una imprenta oferente.", "Propone una acción que la política permite: comunicarlo, pedir revisión o abstenerse hasta recibir indicación.", "No acusa a Camila ni a su prima de haber actuado mal."],
      next: "cierre",
    },
    { id: "cierre", kind: "cierre", moment: 6, origen: "conversion", text: "Terminaste la práctica con Camila. Aquí queda lo que decidiste, lo que escribiste y el concepto, para consultarlo cuando quieras." },
  ],
  theory: {
    id: "teoria.rie.conflicto-de-interes", title: "Conflicto de interés", origen: "fuente",
    text: "Un conflicto de interés ocurre cuando una relación o beneficio personal puede interferir —o parecer interferir— con una decisión que debe atender los intereses de una organización. No demuestra por sí mismo que una persona haya actuado mal. El primer paso suele ser la declaración transparente y la aplicación de controles adecuados, como supervisión, abstención o revisión independiente según la política. Una decisión ética requiere evaluar hechos, consecuencias y reglas, no asumir culpabilidad por vínculos personales ni fingir que esos vínculos son irrelevantes. Las políticas concretas y las leyes aplicables pueden variar: en este caso seguimos exclusivamente las reglas ficticias proporcionadas.",
  },
  calculations: ["40 + 35 + 25 = 100 (pesos de los tres criterios)", "35 + 25 = 60 (lo que pesan plazo y calidad juntos)"],
  variant: {
    id: "exp.n1.rie.el-proveedor-es-familia.variante-b",
    title: "Otra situación, sin apoyo",
    setting: "Un comité va a contratar servicios tecnológicos para una organización. Nadie te explica los datos: lee y responde.",
    question: "¿Dónde está el conflicto de interés potencial y qué pide hacer la política?",
    intro: "Otra organización y otra relación. Sin explicaciones, sin los documentos de la práctica y sin el concepto a la mano. Una parte se comprueba sola; lo que escribas queda en espera de revisión de una persona.",
    docs: [
      {
        id: "V", letter: "V", title: "Lo que se sabe del comité", unit: "Datos del caso",
        rows: [
          { id: "V.participacion", label: "Un integrante del comité tiene una pequeña participación económica en Nube Clara, uno de los oferentes." },
          { id: "V.precio", label: "Nube Clara presentó la oferta de menor precio." },
          { id: "V.plazo", label: "Nube Clara ofrece dejar el servicio funcionando en ocho semanas." },
          { id: "V.pagos", label: "No hay ningún indicio de pagos ni favores entre el integrante y Nube Clara." },
        ],
      },
      {
        id: "W", letter: "W", title: "Extracto de la política", unit: "Política ficticia de este caso",
        rows: [
          { id: "W.declarar", label: "Todo interés económico o relación personal con un oferente se declara antes de evaluar." },
          { id: "W.revision", label: "Una persona ajena al comité revisa cada caso declarado y define cómo continúa la evaluación." },
        ],
      },
    ],
    tasks: [
      {
        id: "identificar", kind: "clasificar", criterion: "Identificación", weight: 40, origen: "adaptado",
        prompt: "Di qué es cada pieza del caso.",
        groups: [{ id: "interes", label: "Interés personal que puede influir" }, { id: "oferta", label: "Dato de la oferta" }, { id: "regla", label: "Regla o control de la política" }],
        items: [
          { id: "participacion", text: "Tiene una pequeña participación económica en Nube Clara.", group: "interes" },
          { id: "precio", text: "Nube Clara presentó la oferta de menor precio.", group: "oferta" },
          { id: "declarar", text: "Todo interés económico o relación personal con un oferente se declara antes de evaluar.", group: "regla" },
          { id: "plazo", text: "Ofrece dejar el servicio funcionando en ocho semanas.", group: "oferta" },
          { id: "revision", text: "Una persona ajena al comité revisa cada caso declarado.", group: "regla" },
        ],
        calc: "El interés personal es la participación económica del integrante. Precio y plazo son datos de la oferta. La declaración y la revisión independiente son la regla y el control de la política.",
      },
      {
        id: "importa", kind: "texto", criterion: "Interpretación de la política", weight: 35, origen: "adaptado",
        prompt: "Explica por qué esa participación importa aunque no haya ningún pago indebido.",
        reference: "Porque quien evalúa ganaría algo si Nube Clara resulta elegida, y eso puede influir, o parecer que influye, en su juicio. La política pide declararlo antes de evaluar; no hace falta que exista un soborno.",
        ideas: ["Dice que el interés puede influir o parecer influir en la decisión.", "Se apoya en lo que la política pide: declarar antes de evaluar.", "No afirma que el integrante haya actuado mal ni que exista un delito."],
      },
      {
        id: "accion", kind: "texto", criterion: "Respuesta proporcionada y respetuosa", weight: 25, origen: "adaptado",
        prompt: "Propón qué debe hacer el integrante, conforme a la política.",
        reference: "Declarar su participación en Nube Clara antes de evaluar y esperar a que la persona ajena al comité revise el caso y diga cómo sigue la evaluación.",
        ideas: ["Propone declarar y aceptar la revisión independiente.", "No pide descalificar a Nube Clara sin más ni ocultar la participación.", "Trata al integrante con respeto, sin acusarlo."],
      },
    ],
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-13", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "La política del paquete es un solo párrafo; aquí se separó en sus tres frases, sin cambiar una palabra, para poder tocarlas una por una.",
    "La escena de exploración («tocar conflicto de interés») se convirtió en dos piezas: el concepto se muestra en pantalla y la persona señala en la política la frase que le dice a Camila qué hacer primero.",
    "En «¿Qué hago con la evaluación?» se añadió una cuarta ruta («sacar a la imprenta del concurso»), tomada de la retroalimentación del paquete («excluir al proveedor de inmediato»).",
    "La ruta «no comunicar» permite corregir, como pide el paquete: la consecuencia termina con Camila avisando a cumplimiento.",
    "El paquete pide recomendar «seguir la evaluación con salvaguardas»; aquí es una decisión con tres rutas, redactadas a partir de «no adjudicar ni descartar solo por parentesco».",
    "Las explicaciones al tocar cada criterio y cada frase de la política son nuevas.",
    "Variante: el nombre del oferente (Nube Clara), el plazo de ocho semanas y la frase «no hay ningún indicio de pagos ni favores» se añadieron para dar piezas que identificar. La identificación (40 puntos) se comprueba clasificando cinco piezas del caso.",
    "Variante: «interpretación de la política» (35 puntos) y «respuesta proporcionada y respetuosa» (25 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona.",
    "La política es ficticia. Ninguna pantalla afirma obligaciones legales ni delitos.",
    "No hay regla para pasar la variante: la regla provisional se retiró y el puntaje se muestra sin veredicto.",
  ],
};
