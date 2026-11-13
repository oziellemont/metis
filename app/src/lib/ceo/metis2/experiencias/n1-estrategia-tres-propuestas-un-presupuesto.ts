/**
 * MÊTIS 2.0 · Repositorio Académico · lote 03 (paquete 1.2) · EDIT-N1-013 · Estrategia
 * «Tres propuestas, un presupuesto»
 *
 * «fuente»: texto tal cual del paquete. «adaptado»: el paquete lo describe y aquí se redactó.
 * «conversion»: pieza añadida al convertir. Las cifras son las del paquete, sin cambios.
 */
import type { Experiencia } from "./tipos";

export const N1_ESTRATEGIA_TRES_PROPUESTAS: Experiencia = {
  id: "exp.n1.est.tres-propuestas-un-presupuesto",
  editorialId: "EDIT-N1-013",
  slug: "tres-propuestas-un-presupuesto",
  version: 1,
  packageVersion: "1.2",
  title: "Tres propuestas, un presupuesto",
  academy: "estrategia",
  skills: { primary: "est.priorizacion", secondary: ["est.fundamentos", "ope.indicadores"] },
  level: 1,
  sourceIds: ["HBS_STRAT", "STAN_CORE"],
  provenance: "creacion_original",
  minutes: [6, 8],
  objectives: [
    "Distinguir un objetivo de una iniciativa.",
    "Escoger una prioridad coherente con el objetivo dado y las restricciones.",
    "Nombrar expresamente al menos una iniciativa a la que se renuncia.",
    "Reconocer que priorizar no es declarar que las otras ideas son malas.",
  ],
  characters: [
    { id: "valeria", name: "Valeria", role: "Responsable de una tienda de bicicletas urbanas" },
    { id: "luis", name: "Luis", role: "Mecánico; propuso el kit de herramientas" },
    { id: "marta", name: "Marta", role: "Atiende el mostrador; propuso el calendario" },
  ],
  docs: [
    {
      id: "A", letter: "A", title: "Pizarra de desempeño del mes", unit: "Reparaciones del mes pasado", cols: ["Indicador o nota", "Dato verificable"],
      rows: [
        { id: "A.terminadas", label: "Reparaciones terminadas", cells: ["40"] },
        { id: "A.puntuales", label: "Entregadas en la fecha prometida", cells: ["28"], nota: { origen: "conversion", text: "Es lo que la tienda quiere mejorar: cuántas reparaciones se entregan el día que se prometió." } },
        { id: "A.tarde", label: "Entregadas tarde", cells: ["12"], nota: { origen: "adaptado", text: "40 − 28 = 12 reparaciones entregadas después de la fecha prometida." } },
        { id: "A.meta", label: "Meta del siguiente mes", cells: ["Al menos 35 de cada 40 entregas puntuales (87.5 %)"], nota: { origen: "fuente", text: "La meta no implica que alguna iniciativa alcance por sí sola las 35 entregas: son datos del periodo previo, no una predicción." } },
        { id: "A.causas", label: "Causas registradas de las 12 tardías", cells: ["5 doble reserva de horario, 4 faltante de refacción, 3 avería de herramienta"], nota: { origen: "conversion", text: "5 + 4 + 3 = 12. Dicen dónde hubo retrasos, no cuántos desaparecerían con cada propuesta." } },
      ],
    },
    {
      id: "B", letter: "B", title: "Tres propuestas y restricciones", unit: "Presupuesto del mes: $30,000", cols: ["Propuesta", "Costo único estimado", "Qué intenta mejorar", "Evidencia disponible e incertidumbre"], layout: "ficha",
      rows: [
        { id: "B.a", label: "A · Calendario único de citas", cells: ["$18,000", "Reducir dobles reservas", "5 retrasos vinculados a doble reserva; aún no se probó el software"], nota: { origen: "adaptado", text: "Con cualquiera de las otras dos se pasa del presupuesto: 18,000 + 24,000 = 42,000 y 18,000 + 23,000 = 41,000." } },
        { id: "B.b", label: "B · Acuerdo de stock de piezas comunes", cells: ["$24,000", "Reducir faltantes de refacciones", "4 retrasos vinculados a inventario; hay cotización, no prueba de entrega"], nota: { origen: "adaptado", text: "Junto con el kit de herramientas costaría 24,000 + 23,000 = 47,000." } },
        { id: "B.c", label: "C · Kit adicional de herramientas", cells: ["$23,000", "Reducir paradas por herramienta", "3 retrasos vinculados a averías; la frecuencia podría variar"], nota: { origen: "conversion", text: "Cabe sola en el presupuesto, igual que las otras dos. Ninguna pareja cabe." } },
      ],
      foot: "No se permite financiar parcialmente una propuesta. Todavía no hay datos para traducir estas propuestas a ahorros garantizados.",
    },
  ],
  moments: ["El chat", "Los documentos", "Meta y medios", "La prioridad", "La renuncia", "Dato nuevo", "La tarjeta", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "valeria", channel: "Chat",
      text: "Tenemos $30,000 para mejorar el negocio este mes. A todos les gusta una propuesta diferente, pero solo podemos financiar una. ¿Puedes ayudarnos a decidir sin prometerles todo a todos?",
      role: "Apoyas a Valeria durante una reunión de planeación de media hora. El objetivo vigente de la tienda es mejorar el porcentaje de reparaciones entregadas en la fecha prometida.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "La pizarra del mes y las tres propuestas",
      prompt: "Toca cada renglón para ver qué dice y qué no dice. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "meta_medio",
    },
    {
      id: "meta_medio", kind: "clasificar", moment: 2, origen: "fuente", from: "valeria",
      text: "¿Qué de esto es la meta y qué son medios para lograrla?",
      prompt: "Separa el resultado que se busca de las acciones que podrían acercar a ese resultado.",
      docs: ["A", "B"],
      groups: [{ id: "meta", label: "Resultado que se busca (meta)" }, { id: "medio", label: "Acción para lograrlo (iniciativa)" }],
      items: [
        { id: "calendario", text: "Calendario único de citas", group: "medio", why: "Es una acción: podría reducir las dobles reservas." },
        { id: "puntualidad", text: "Mejorar el porcentaje de reparaciones entregadas en la fecha prometida", group: "meta", why: "Es el resultado que la tienda quiere conseguir; las propuestas son caminos para acercarse." },
        { id: "stock", text: "Acuerdo de stock de piezas comunes", group: "medio", why: "Es una acción: podría reducir los faltantes de refacciones." },
        { id: "herramientas", text: "Kit adicional de herramientas", group: "medio", why: "Es una acción: podría reducir las paradas por herramienta." },
      ],
      right: "La meta es una: más reparaciones entregadas en la fecha prometida. El calendario, el stock y las herramientas son iniciativas que podrían ayudar a lograrla.",
      next: "prioridad",
    },
    {
      id: "prioridad", kind: "decision", moment: 3, origen: "fuente", from: "valeria", text: "Solo alcanza para una. ¿Cuál financiamos este mes?",
      options: [
        {
          id: "a", tipo: "defendible", origen: "fuente", next: "renuncia",
          text: "Financiar el calendario; ataca la causa más frecuente observada y probar si reduce atrasos.",
          consequence: [{ who: "valeria", text: "Va el calendario. Lo anoto como prueba: al cierre del mes vemos cuántas entregas salieron a tiempo." }],
          feedback: "Relacionaste el mayor grupo de retrasos observado con la iniciativa elegida. Recuerda que ese dato no garantiza eliminar cinco retrasos.",
        },
        {
          id: "b", tipo: "defendible", origen: "fuente", next: "renuncia",
          text: "Financiar el acuerdo de piezas; reduce faltantes documentados y revisar si mejoran entregas.",
          consequence: [{ who: "valeria", text: "Va el acuerdo de piezas. Hay cotización, no prueba de entrega: lo revisamos con las entregas a tiempo del mes." }],
          feedback: "Elegiste un problema real. Revisa cómo compararías su potencial con la causa más frecuente antes de afirmar que es la mejor.",
        },
        {
          id: "c", tipo: "defendible", origen: "fuente", next: "renuncia_c",
          text: "Financiar las herramientas; limita paradas observadas y medir si mejora la puntualidad.",
          consequence: [{ who: "valeria", text: "Van las herramientas. Son tres retrasos registrados y la frecuencia puede variar: medimos al cierre del mes." }],
          feedback: "Elegiste un problema real, con el grupo de retrasos más pequeño del registro. Es defendible si reconoces ese límite y dices cómo lo vas a medir.",
        },
        {
          id: "repartir", tipo: "concepto_erroneo", origen: "adaptado", next: "renuncia",
          text: "Repartir los $30,000 entre las tres; así nadie queda fuera y todas avanzan un poco.",
          consequence: [{ who: "valeria", text: "No se puede: ninguna se financia a medias y cualquier par se pasa de $30,000. Hay que elegir una." }, { who: null, text: "Valeria decide probar este mes con el calendario, que es la propuesta de menor costo." }],
          feedback: "Cada par excede $30,000; la estrategia necesita una renuncia visible. Repartir el presupuesto deja las tres propuestas a medias y ninguna se puede medir.",
        },
      ],
    },
    {
      id: "renuncia", kind: "decision", moment: 4, origen: "fuente", from: "luis", text: "Entonces, ¿mi propuesta de herramientas es mala?",
      options: [
        {
          id: "honesta", tipo: "defendible", origen: "adaptado", next: "nota",
          text: "No es mala. Este mes va otra por los retrasos registrados; la tuya espera y la revisamos al cierre.",
          consequence: [{ who: "luis", text: "Entendido. Entonces al cierre del mes vemos las entregas a tiempo y vuelvo a traer lo de las herramientas." }],
          feedback: "Es una renuncia honesta: dices qué va primero, por qué, qué se pospone y cuándo se revisa. Priorizar no es declarar que las otras ideas son malas.",
        },
        {
          id: "todo", tipo: "concepto_erroneo", origen: "adaptado", next: "nota",
          text: "No es mala. Todo se hará en cuanto podamos; la tuya también entra en la lista, no te preocupes por eso.",
          consequence: [{ who: "luis", text: "¿En cuanto podamos es este mes o el otro? Con $30,000 no alcanza para dos. No sé si esperar o insistir." }],
          feedback: "«Todo se hará» no dice con qué presupuesto ni en qué fecha. Deja a Luis sin saber qué esperar: falta nombrar la renuncia.",
        },
        {
          id: "no_importa", tipo: "riesgosa", origen: "adaptado", next: "nota",
          text: "Ahora no importa. Lo tuyo se queda fuera y no hay nada más que revisar por este mes.",
          consequence: [{ who: "luis", text: "Tres reparaciones se atrasaron por herramienta. Si eso no importa, no sé para qué pidieron propuestas." }],
          feedback: "Nombra la renuncia, pero sin razón ni fecha de revisión. Una propuesta pospuesta sigue atendiendo un problema real del registro.",
        },
      ],
    },
    {
      id: "renuncia_c", kind: "decision", moment: 4, origen: "conversion", from: "marta", text: "Entonces, ¿mi propuesta del calendario es mala?",
      options: [
        {
          id: "honesta", tipo: "defendible", origen: "conversion", next: "nota",
          text: "No es mala. Este mes van las herramientas; el calendario espera y lo revisamos al cierre con las entregas.",
          consequence: [{ who: "marta", text: "De acuerdo. Las dobles reservas son cinco de los doce retrasos; al cierre del mes lo volvemos a ver." }],
          feedback: "Es una renuncia honesta: dices qué va primero, qué se pospone y cuándo se revisa. Marta te recuerda el dato que deja pendiente tu elección.",
        },
        {
          id: "todo", tipo: "concepto_erroneo", origen: "conversion", next: "nota",
          text: "No es mala. Todo se hará en cuanto podamos; el calendario también, no te preocupes por eso.",
          consequence: [{ who: "marta", text: "¿Y con qué dinero? Este mes ya no alcanza para dos. Preferiría saber si espero o si busco otra salida." }],
          feedback: "«Todo se hará» no dice con qué presupuesto ni en qué fecha. Falta nombrar la renuncia y cuándo se vuelve a revisar.",
        },
        {
          id: "no_importa", tipo: "riesgosa", origen: "conversion", next: "nota",
          text: "Ahora no importa. El calendario se queda fuera y no hay nada más que revisar por este mes.",
          consequence: [{ who: "marta", text: "Cinco reparaciones se atrasaron por doble reserva. Si eso no importa, no entiendo para qué lo anotamos." }],
          feedback: "Nombra la renuncia, pero sin razón ni fecha de revisión. Lo pospuesto atiende la causa más frecuente del registro: conviene decir cuándo se revisa.",
        },
      ],
    },
    {
      id: "nota", kind: "dato", moment: 5, origen: "fuente", title: "Llega una nota del proveedor de piezas",
      items: ["El proveedor de piezas propone prestar las piezas de mayor rotación durante dos semanas.", "A cambio, exige revisar después el contrato. Todavía no hay nada firmado."],
      next: "revisar",
    },
    {
      id: "revisar", kind: "decision", moment: 5, origen: "adaptado", from: "valeria", text: "¿Esto cambia lo que decidimos?",
      options: [
        {
          id: "mantener", tipo: "defendible", origen: "adaptado", next: "tarjeta",
          text: "Mantener la prioridad y anotar la oferta como dato por confirmar antes de contar con ella.",
          consequence: [{ who: "valeria", text: "Seguimos igual. Pido las condiciones por escrito y, si se confirman, lo vemos en la revisión del cierre." }],
          feedback: "Distinguiste información nueva de una promesa segura. Conservar la prioridad es razonable mientras la oferta no esté confirmada.",
        },
        {
          id: "reevaluar", tipo: "defendible", origen: "adaptado", next: "tarjeta",
          text: "Revisar la prioridad con este dato, sin dar por seguro el préstamo hasta ver sus condiciones.",
          consequence: [{ who: "valeria", text: "La volvemos a mirar. Primero pido las condiciones del contrato; con eso decidimos si algo cambia." }],
          feedback: "Una elección es revisable cuando llega información nueva. Lo hiciste sin tratar el préstamo como un hecho.",
        },
        {
          id: "seguro", tipo: "concepto_erroneo", origen: "adaptado", next: "tarjeta",
          text: "Dar por resuelto lo de las piezas: con el préstamo ya no hace falta pensar en ese problema.",
          consequence: [{ who: "valeria", text: "Son dos semanas y a cambio de revisar el contrato. Si luego no nos conviene, volvemos a los faltantes." }],
          feedback: "La nota es una propuesta, no un acuerdo: dura dos semanas y tiene una condición. Tratarla como solución segura confunde promesa con hecho.",
        },
        {
          id: "congelar", tipo: "concepto_erroneo", origen: "conversion", next: "tarjeta",
          text: "No mirarla siquiera: una vez elegida la prioridad, ya no se vuelve a tocar en todo el mes.",
          consequence: [{ who: "valeria", text: "Si no la leo, no sabré si nos ayuda o nos compromete. Prefiero anotarla y pedir las condiciones." }],
          feedback: "Priorizar no congela toda decisión para siempre. Cuando llega información nueva, puede ser razonable revisar la elección.",
        },
      ],
    },
    {
      id: "tarjeta", kind: "redactar", moment: 6, origen: "fuente", from: "valeria",
      ask: "Déjamelo escrito en la tarjeta de la reunión, para que todos lo vean.",
      prompt: "Completa la tarjeta con tus palabras.",
      fields: [{ id: "prioridad", label: "Prioridad esta semana" }, { id: "renuncia", label: "Qué decidimos NO hacer este mes" }],
      reference: "Un ejemplo, si elegiste el calendario. Prioridad: el calendario único de citas, porque cinco de los doce retrasos vienen de dobles reservas. No haremos este mes: el acuerdo de piezas ni el kit de herramientas. Lo revisamos al cierre con las entregas a tiempo.",
      ideas: ["Nombra una sola prioridad y la liga con el objetivo: entregas en la fecha prometida.", "Dice con claridad qué se deja fuera este mes, sin llamarlo mala idea.", "Menciona con qué se va a revisar: las entregas a tiempo al final del mes.", "No promete que la iniciativa elegida eliminará los retrasos."],
      next: "cierre",
    },
    { id: "cierre", kind: "cierre", moment: 7, origen: "conversion", text: "Terminaste la práctica con Valeria. Aquí queda lo que decidiste, lo que escribiste y el concepto, para consultarlo cuando quieras." },
  ],
  theory: {
    id: "teoria.est.priorizar-y-renunciar", title: "Priorizar es elegir y renunciar", origen: "fuente",
    text: "Priorizar es elegir qué vale más la pena hacer ahora, dadas las metas y los recursos disponibles. Una meta expresa el resultado que se busca; una iniciativa es una acción que podría acercarnos a ese resultado. El costo de oportunidad es lo que dejamos de conseguir al dedicar tiempo o dinero a una alternativa. Decir “sí” a algo obliga a decir “todavía no” —o “no”— a otra cosa. Una buena prioridad se explica con el objetivo, las restricciones y la evidencia disponible, sin prometer certeza donde no la hay. Cuando llega información nueva, puede ser razonable revisar la elección.",
  },
  calculations: [
    "40 − 28 = 12 (reparaciones entregadas tarde)",
    "5 + 4 + 3 = 12 (causas registradas de las tardías)",
    "35 ÷ 40 = 0.875 (87.5 % de entregas puntuales como meta)",
    "18,000 + 24,000 = 42,000; 18,000 + 23,000 = 41,000; 24,000 + 23,000 = 47,000 (ninguna pareja cabe en 30,000)",
  ],
  variant: {
    id: "exp.n1.est.tres-propuestas-un-presupuesto.variante-b",
    title: "Otra situación, sin apoyo",
    setting: "Un centro cultural tiene $12,000 para elevar la asistencia a sus talleres infantiles. Nadie te explica los datos: lee, calcula y responde.",
    question: "¿Qué iniciativa va primero, a qué se renuncia y con qué se revisa?",
    intro: "Otro lugar y otras cifras. Sin explicaciones, sin los documentos de la práctica y sin el concepto a la mano. Una parte se comprueba sola; lo que escribas queda en espera de revisión de una persona.",
    docs: [
      {
        id: "V", letter: "V", title: "Talleres infantiles · registro del mes", unit: "Datos del centro cultural", cols: ["Dato", "Registro"],
        rows: [
          { id: "V.inscritos", label: "Niñas y niños inscritos", cells: ["60"] },
          { id: "V.avisos", label: "Faltas en las que el aviso del taller llegó tarde", cells: ["8"] },
          { id: "V.faltaron", label: "Inscritos que faltaron a su taller", cells: ["18"] },
          { id: "V.transporte", label: "Faltas por transporte", cells: ["6"] },
          { id: "V.instructor", label: "Faltas por cambio de instructor", cells: ["4"] },
        ],
      },
      {
        id: "W", letter: "W", title: "Iniciativas propuestas", unit: "Ninguna se puede financiar a medias", cols: ["Iniciativa", "Costo"],
        rows: [
          { id: "W.recordatorios", label: "Recordatorios coordinados", cells: ["$7,000"] },
          { id: "W.transporte", label: "Servicio de transporte piloto", cells: ["$11,000"] },
          { id: "W.reemplazos", label: "Reemplazos de instructor", cells: ["$9,000"] },
        ],
      },
    ],
    tasks: [
      {
        id: "objetivo", kind: "clasificar", criterion: "Objetivo frente a acciones", weight: 25, origen: "adaptado",
        prompt: "Separa el resultado que se busca de las acciones para lograrlo.",
        groups: [{ id: "meta", label: "Resultado que se busca (meta)" }, { id: "medio", label: "Acción para lograrlo (iniciativa)" }],
        items: [
          { id: "transporte", text: "Servicio de transporte piloto", group: "medio" },
          { id: "asistencia", text: "Elevar la asistencia a los talleres infantiles", group: "meta" },
          { id: "recordatorios", text: "Recordatorios coordinados", group: "medio" },
          { id: "faltas", text: "Que falten menos niñas y niños inscritos", group: "meta" },
          { id: "reemplazos", text: "Reemplazos de instructor", group: "medio" },
        ],
        calc: "La meta es elevar la asistencia, es decir, que falten menos inscritos. Recordatorios, transporte y reemplazos son iniciativas.",
      },
      { id: "pareja", kind: "cifra", unit: "$", criterion: "Coherencia entre evidencia y restricción: presupuesto", weight: 10, origen: "conversion", prompt: "¿Cuánto costarían juntas las dos iniciativas más baratas?", answer: 16000, calc: "7,000 + 9,000 = 16,000; el presupuesto es de 12,000, así que ni la pareja más barata cabe." },
      {
        id: "prioridad", kind: "texto", criterion: "Coherencia entre evidencia y restricción: prioridad", weight: 20, origen: "adaptado",
        prompt: "Elige una iniciativa como prioridad y justifícala con el registro y con el presupuesto.",
        reference: "Por ejemplo: recordatorios coordinados, de $7,000, porque los avisos tardíos son la causa más registrada (8 de 18 faltas) y cabe en el presupuesto. No está probado que elimine esas faltas.",
        ideas: ["Elige una sola iniciativa que cabe en $12,000.", "La liga con una causa del registro, sin prometer que resolverá todas las faltas.", "Otra elección puede ser válida si reconoce el límite de la evidencia."],
      },
      {
        id: "renuncia", kind: "texto", criterion: "Renuncia explícita y honesta", weight: 30, origen: "fuente",
        prompt: "Di a qué se renuncia este mes y qué efecto tiene dejarlo fuera.",
        reference: "Si van los recordatorios, este mes no se financian el transporte ni los reemplazos: las faltas por transporte (6) y por cambio de instructor (4) pueden seguir. No son malas ideas; se revisan cuando haya resultados.",
        ideas: ["Nombra al menos una iniciativa que no se hará.", "Dice qué problema queda sin atender por ahora.", "No descalifica lo pospuesto ni promete hacerlo todo."],
      },
      {
        id: "senal", kind: "senalar", criterion: "Indicador de revisión", weight: 15, origen: "adaptado",
        prompt: "Toca los dos datos con los que se mide si la asistencia mejora.",
        doc: "V", correct: ["V.inscritos", "V.faltaron"],
        calc: "La asistencia se sigue con los inscritos y con cuántos de ellos faltan. Las causas ayudan a elegir la iniciativa, pero no miden el objetivo.",
      },
    ],
    passAt: 70,
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-13", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "Las tres propuestas son rutas defendibles, como indica el paquete: se evalúa el criterio y la renuncia, no la letra. Se añadió una cuarta ruta («repartir el presupuesto»), tomada de la retroalimentación del paquete para quien promete las tres.",
    "Quien elige «repartir» no ha escogido prioridad; para poder seguir, la consecuencia dice que Valeria prueba con la propuesta de menor costo. Conviene revisar si se prefiere obligar a elegir de nuevo.",
    "La pregunta de Luis («¿mi propuesta de herramientas es mala?») no tiene sentido si se eligieron las herramientas. Para esa ruta se añadió a Marta, que pregunta lo mismo por el calendario. Marta no está en el paquete.",
    "Las tres respuestas a Luis se redactaron a partir de las plantillas del paquete, con largo parecido.",
    "El paquete describe la nota del proveedor y pide «conservar o revaluar»; aquí es una decisión con cuatro rutas, dos defendibles. La ruta «no mirarla siquiera» es nueva.",
    "En la tabla de la pizarra, las causas van separadas con comas en vez de punto y coma.",
    "Variante: «coherencia evidencia-restricción» (30 puntos) se repartió en una cifra (10 puntos: lo que costaría la pareja más barata) y una justificación escrita (20 puntos). La cifra no está en el paquete.",
    "Variante: «renuncia explícita y honesta» (30 puntos) y la justificación de la prioridad (20 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona. No se fija una única iniciativa correcta.",
    "Variante: el indicador de revisión se comprueba señalando en el registro los dos datos que miden la asistencia.",
    "La regla para pasar la variante (70 de 100) es provisional.",
  ],
};
