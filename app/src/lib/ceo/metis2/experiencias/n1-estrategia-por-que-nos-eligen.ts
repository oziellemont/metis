/**
 * MÊTIS 2.0 · Repositorio Académico · lote 02 (paquete 1.1) · EDIT-N1-007 · Estrategia
 * «¿Por qué nos eligen si no somos los más baratos?»
 *
 * «fuente»: texto tal cual del paquete. «adaptado»: el paquete lo describe y aquí se redactó.
 * «conversion»: pieza añadida al convertir. Las cifras son las del paquete, sin cambios.
 */
import type { Experiencia } from "./tipos";

export const N1_ESTRATEGIA_POR_QUE_NOS_ELIGEN: Experiencia = {
  id: "exp.n1.est.por-que-nos-eligen",
  editorialId: "EDIT-N1-007",
  slug: "por-que-nos-eligen",
  version: 1,
  packageVersion: "1.1",
  title: "¿Por qué nos eligen si no somos los más baratos?",
  academy: "estrategia",
  skills: { primary: "est.ventaja", secondary: ["est.fundamentos", "cre.cliente"] },
  level: 1,
  sourceIds: ["HBS_STRAT", "HBS_ISC"],
  provenance: "creacion_original",
  minutes: [6, 8],
  objectives: [
    "Reconocer si una oferta se posiciona por menor precio, por una diferencia que aprecia un cliente o por servir a un segmento concreto.",
    "Distinguir una razón observable para elegir de una ventaja sostenible ya probada.",
  ],
  characters: [{ id: "irene", name: "Irene", role: "Propietaria de una tienda de almuerzos para oficinas" }],
  docs: [
    {
      id: "A", letter: "A", title: "Comparación de ofertas", unit: "Datos del caso", cols: ["Elemento", "Ruta Fresca", "Menú Centro"],
      rows: [
        { id: "A.precio", label: "Precio por menú", cells: ["$118", "$92"], nota: { origen: "conversion", text: "Lo que paga el cliente por un menú. Menú Centro cobra $26 menos." } },
        { id: "A.entrega", label: "Entrega prometida a edificios del centro", cells: ["20 min", "45 min"], nota: { origen: "conversion", text: "Es una promesa, no un resultado medido. Ruta Fresca promete llegar en menos de la mitad del tiempo." } },
        { id: "A.dietas", label: "Opciones de dieta especial", cells: ["3", "1"], nota: { origen: "conversion", text: "Variedad para quien tiene restricciones alimentarias." } },
        { id: "A.cobertura", label: "Cobertura", cells: ["2 km", "6 km"], nota: { origen: "conversion", text: "Hasta dónde entrega cada uno. Llegar más lejos no es lo mismo que llegar más rápido." } },
        { id: "A.minimo", label: "Pedido mínimo", cells: ["1 menú", "1 menú"], nota: { origen: "conversion", text: "Igual en los dos: aquí no hay diferencia." } },
      ],
    },
    {
      id: "B", letter: "B", title: "Entrevistas breves", unit: "Ficticias; no representan a todo el mercado",
      rows: [
        { id: "B.habitual", label: "Clienta habitual: «Trabajo con 25 minutos libres y valoro recibirlo antes de mi siguiente reunión».", nota: { origen: "conversion", text: "Para ella el tiempo pesa más que el precio. Es una persona, no todo el mercado." } },
        { id: "B.potencial", label: "Comprador que eligió al competidor: «Prefiero pagar menos y puedo pedir desde temprano».", nota: { origen: "conversion", text: "Para él el precio pesa más y la rapidez no le hace falta." } },
        { id: "B.coordinador", label: "Coordinador de oficina: «Mis colegas tienen restricciones alimentarias; necesitamos etiquetas claras».", nota: { origen: "conversion", text: "Valora las opciones especiales y la información clara sobre cada plato." } },
      ],
    },
  ],
  moments: ["El mensaje", "Los documentos", "Fortalezas", "Qué investigar", "Dato nuevo", "Tu frase", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "irene", channel: "Mensaje",
      text: "La competencia vende más barato. Un socio quiere que bajemos precios; otra persona quiere abrir sucursales. Primero necesito saber por qué alguien nos compra a nosotros.",
      role: "Irene te pide ayuda como asesor invitado. No diriges la tienda: la ayudas a entender por qué la eligen sus clientes.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "Qué ofrece cada uno y qué dicen los clientes",
      prompt: "Toca cada renglón y cada entrevista para ver qué significa. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "fortalezas",
    },
    {
      id: "fortalezas", kind: "clasificar", moment: 2, origen: "adaptado", from: null,
      text: "Antes de hablar de ventaja, mira en qué destaca cada oferta frente a la otra.",
      prompt: "Asigna cada fortaleza a la oferta que la tiene, según la tabla.",
      docs: ["A"],
      groups: [{ id: "rf", label: "Ruta Fresca" }, { id: "mc", label: "Menú Centro" }],
      items: [
        { id: "precio", text: "Precio más bajo", group: "mc", why: "Menú Centro cobra $92; Ruta Fresca, $118." },
        { id: "rapidez", text: "Rapidez para un área definida", group: "rf", why: "Ruta Fresca promete 20 minutos en el centro; Menú Centro, 45." },
        { id: "dietas", text: "Mayor variedad de dietas", group: "rf", why: "Ruta Fresca ofrece 3 opciones especiales; Menú Centro, 1." },
        { id: "cobertura", text: "Cobertura amplia", group: "mc", why: "Menú Centro entrega hasta 6 km; Ruta Fresca, hasta 2 km. Cobertura amplia no es rapidez: mira los dos renglones por separado." },
      ],
      right: "Menú Centro ofrece menor precio y mayor cobertura. Ruta Fresca promete mayor rapidez en el centro y más opciones especiales. Son fortalezas relativas; una promesa sin verificar todavía no es una ventaja competitiva sostenible.",
      next: "investigar",
    },
    {
      id: "investigar", kind: "decision", moment: 3, origen: "fuente", from: "irene", text: "¿Nos posicionamos como el más barato?",
      options: [
        {
          id: "tiempo", tipo: "defendible", origen: "adaptado", next: "registro",
          text: "Antes, prueba si los clientes del centro valoran más el tiempo.",
          consequence: [{ who: "irene", text: "Tiene sentido: mi clienta habitual habló de sus 25 minutos. Puedo preguntarles a otros diez esta semana." }],
          feedback: "Competirías por rapidez para un grupo concreto. La renuncia: no ser el más barato ni llegar más lejos. Falta comprobar que esos clientes lo valoran y que la promesa se cumple.",
        },
        {
          id: "precio", tipo: "defendible", origen: "adaptado", next: "registro",
          text: "Estudia si puedes bajar el precio sin perder lo que te distingue.",
          consequence: [{ who: "irene", text: "Tendría que revisar mis costos. Si bajo a $92 y además prometo 20 minutos, no sé si me alcanza." }],
          feedback: "Competirías por precio. Puede ser una apuesta válida solo si conoces tus costos, la reacción de los clientes y el efecto sobre la rapidez y las opciones especiales.",
        },
        {
          id: "cobertura", tipo: "defendible", origen: "adaptado", next: "registro",
          text: "Amplía la cobertura, sabiendo que puede afectar la rapidez.",
          consequence: [{ who: "irene", text: "Llegaría a más oficinas. Pero a 6 km no creo poder prometer 20 minutos." }],
          feedback: "Competirías por alcance. La renuncia queda a la vista: mayor cobertura puede dificultar las entregas muy rápidas, que hoy es lo que te distingue.",
        },
      ],
    },
    {
      id: "registro", kind: "dato", moment: 4, origen: "fuente", title: "Irene revisa su registro de entregas",
      items: ["De 20 entregas de Ruta Fresca, 15 llegaron en 20 minutos o menos.", "Las otras 5 llegaron después. La promesa no se cumple siempre."],
      calc: "15 de 20 es 75 % de puntualidad en esta muestra. Veinte entregas no permiten hablar de una tasa general.",
      next: "anunciar",
    },
    {
      id: "anunciar", kind: "decision", moment: 4, origen: "conversion", from: "irene", text: "Entonces, ¿ya puedo anunciar que nuestra ventaja es entregar más rápido que nadie?",
      options: [
        {
          id: "anunciar", tipo: "concepto_erroneo", origen: "adaptado", next: "frase",
          text: "Sí, anúncialo ya: tú prometes 20 minutos y el otro promete 45.",
          consequence: [{ who: "irene", text: "Lo publiqué. Esa tarde un cliente respondió con la hora de su pedido: llegó en 35 minutos." }],
          feedback: "Una promesa comercial no es todavía una ventaja demostrada. El registro dice que 5 de 20 entregas no cumplieron los 20 minutos.",
        },
        {
          id: "verificar", tipo: "defendible", origen: "adaptado", next: "frase",
          text: "Todavía no: di a qué apuntas y verifica antes si lo cumples.",
          consequence: [{ who: "irene", text: "Va. Esta semana mido todas las entregas al centro antes de anunciar nada." }],
          feedback: "Identificaste una diferencia relevante, pero su ejecución debe verificarse: 5 de 20 entregas no cumplieron la promesa.",
        },
        {
          id: "abandonar", tipo: "riesgosa", origen: "conversion", next: "frase",
          text: "No: 5 fallas de 20 muestran que la rapidez no es lo tuyo.",
          consequence: [{ who: "irene", text: "¿Tan mal? Quince sí llegaron a tiempo, y es justo lo que mi clienta habitual dijo valorar." }],
          feedback: "Veinte entregas son pocas para descartar la propuesta. Antes de abandonar lo que te distingue conviene medir más y saber por qué se retrasaron esas 5.",
        },
      ],
    },
    {
      id: "frase", kind: "redactar", moment: 5, origen: "fuente", from: "irene",
      ask: "Ayúdame a decirlo sin prometer de más.",
      prompt: "Completa la frase para Irene.",
      fields: [{ id: "apunta", label: "Nuestra propuesta apunta a..." }, { id: "verificar", label: "...pero necesitamos verificar..." }],
      reference: "Nuestra propuesta apunta a entregar rápido a oficinas del centro, con opciones para dietas especiales; pero necesitamos verificar que cumplimos los 20 minutos y que esos clientes lo valoran.",
      ideas: ["Nombra un atributo concreto y para quién.", "Habla de una propuesta, no de una ventaja ya ganada.", "Dice qué falta comprobar: si la promesa se cumple o cuánto la valoran los clientes."],
      next: "cierre",
    },
    { id: "cierre", kind: "cierre", moment: 6, origen: "conversion", text: "Terminaste la práctica con Irene. Aquí queda lo que decidiste, lo que escribiste y el concepto, para consultarlo cuando quieras." },
  ],
  theory: {
    id: "teoria.est.posicionamiento", title: "Posicionamiento, propuesta de valor y ventaja", origen: "fuente",
    text: "Una empresa no necesita ganar en todos los atributos. Puede ofrecer menor precio, una característica distinta o resolver especialmente bien la necesidad de un grupo de clientes. Su posicionamiento expresa cómo quiere ser elegida frente a alternativas. La propuesta de valor describe qué problema resuelve y para quién. Para afirmar una ventaja competitiva, hay que comprobar que la oferta logra entregar ese valor de una manera difícil de igualar o suficientemente distinta. Una promesa comercial no es todavía una ventaja demostrada. Elegir una posición implica renunciar a otras: mayor cobertura puede dificultar entregas muy rápidas, y menor precio puede exigir reducir características o costos.",
  },
  calculations: ["118 − 92 = 26 (pesos de diferencia por menú)", "15 ÷ 20 = 0.75 (75 % de entregas a tiempo en la muestra)", "20 − 15 = 5 (entregas fuera de los 20 minutos)"],
  variant: {
    id: "exp.n1.est.por-que-nos-eligen.variante-b",
    title: "Otra situación, sin apoyo",
    setting: "Dos talleres de reparación de bicicletas compiten en la misma ciudad. Nadie te explica los datos: lee y responde.",
    question: "¿Cómo se posiciona cada taller y qué falta comprobar?",
    intro: "Otro negocio y otros datos. Sin explicaciones, sin los documentos de la práctica y sin el concepto a la mano. Una parte se comprueba sola; lo que escribas queda en espera de revisión de una persona.",
    docs: [
      {
        id: "V", letter: "V", title: "Dos talleres de bicicletas", unit: "Datos del caso", cols: ["Elemento", "Taller Pedal", "Taller Rayo"],
        rows: [
          { id: "V.precio", label: "Precio de la reparación general", cells: ["$550", "$420"] },
          { id: "V.plazo", label: "Plazo de entrega", cells: ["24 h", "72 h"] },
          { id: "V.modo", label: "Cómo se recibe la bicicleta", cells: ["Retiro a domicilio", "En mostrador"] },
        ],
      },
      {
        id: "W", letter: "W", title: "Dos clientes", unit: "Ficticios; no representan a todo el mercado",
        rows: [
          { id: "W.uno", label: "«Uso la bicicleta para ir a trabajar; no puedo quedarme tres días sin ella»." },
          { id: "W.dos", label: "«La uso los domingos. Me da igual esperar si pago menos»." },
        ],
      },
    ],
    tasks: [
      {
        id: "atributos", kind: "clasificar", criterion: "Atributos relativos correctos", weight: 40, origen: "adaptado",
        prompt: "Asigna cada fortaleza al taller que la tiene. Si los datos no permiten saberlo, dilo.",
        groups: [{ id: "pedal", label: "Taller Pedal" }, { id: "rayo", label: "Taller Rayo" }, { id: "nd", label: "No hay dato para saberlo" }],
        items: [
          { id: "precio", text: "Precio más bajo", group: "rayo" },
          { id: "plazo", text: "Entrega más rápida", group: "pedal" },
          { id: "domicilio", text: "No hay que llevar la bicicleta al taller", group: "pedal" },
          { id: "calidad", text: "Mejor calidad de reparación", group: "nd" },
        ],
        calc: "Rayo cobra $420 contra $550. Pedal entrega en 24 h contra 72 h y retira a domicilio. Sobre la calidad de la reparación no hay ningún dato.",
      },
      {
        id: "propuesta", kind: "texto", criterion: "Grupo objetivo y propuesta", weight: 35, origen: "adaptado",
        prompt: "Elige uno de los dos talleres y formula su propuesta de valor.",
        fields: [{ id: "quien", label: "Para quién" }, { id: "que", label: "Qué le resuelve" }],
        reference: "Taller Pedal: para quien usa la bicicleta a diario y no puede quedarse sin ella; se la recogen en casa y se la devuelven en 24 horas.",
        ideas: ["Nombra un grupo de clientes concreto, no «todos».", "Liga la propuesta con un atributo que sí está en los datos.", "No afirma que el taller sea el mejor ni el líder."],
      },
      {
        id: "pendiente", kind: "texto", criterion: "Evidencia pendiente y límites", weight: 25, origen: "adaptado",
        prompt: "¿Qué hecho faltaría comprobar para llamarlo una ventaja competitiva real?",
        reference: "Falta comprobar que el plazo de 24 horas se cumple de verdad y que suficientes clientes pagan $130 más por ello; dos testimonios no bastan.",
        ideas: ["Pide comprobar el cumplimiento de la promesa o cuánto la valoran los clientes.", "Reconoce que dos testimonios no representan al mercado.", "No da por hecha una ventaja sostenible."],
      },
    ],
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-13", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "La segunda decisión («¿ya puedo anunciar que nuestra ventaja es entregar más rápido?») no está en el paquete como decisión: se redactó a partir del nodo 4, que pide no afirmar una ventaja ya ganada.",
    "En la decisión «¿Nos posicionamos como el más barato?» las tres rutas son defendibles, como indica el paquete; cada una muestra qué atributo competiría y cuál sería la renuncia.",
    "Las explicaciones al tocar cada renglón y cada entrevista son nuevas.",
    "Variante: los nombres de los talleres (Pedal y Rayo), la fila «cómo se recibe la bicicleta» y la tarjeta «mejor calidad de reparación» (sin dato) se añadieron para poder comprobar los atributos sin opciones.",
    "Variante: «grupo objetivo y propuesta» (35 puntos) y «evidencia pendiente» (25 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona.",
    "No hay regla para pasar la variante: la regla provisional se retiró y el puntaje se muestra sin veredicto.",
  ],
};
