/**
 * mêtis Academy · Ruta CEO. La teoría detrás de cada decisión del simulador.
 * Basada en la metodología de dirección y alineación de mêtis.
 * Usa los mismos bloques interactivos de mêtis Academy (components/academy/Blocks).
 */
import type { Block } from "@/lib/academy/content";
import { MORE_LESSONS } from "./lessons2";

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  part: string;
  minutes: number;
  icon: "compass" | "users" | "flag" | "message" | "handshake" | "coins" | "flame" | "rocket" | "target" | "layers";
  blocks: Block[];
  /** Rango de carrera con el que se abre (0 = Gerente). Por defecto: nivel − 1. */
  rank?: number;
}


const BASE_LESSONS: Lesson[] = [
  {
    id: "mentalidad", title: "La mentalidad del CEO", part: "Parte I", minutes: 4, icon: "flag",
    subtitle: "Liderar no es tener poder: es cargar responsabilidad. Por qué los primeros 30 días definen cómo te van a seguir.",
    blocks: [
      { kind: "compare", eyebrow: "Dos razones para liderar", title: "¿Quieres el puesto o la responsabilidad?", left: { label: "Centrado en la recompensa", points: ["Busca el estatus, el sueldo y la visibilidad", "Quiere brillar", "La organización le sirve a él"] }, right: { label: "Centrado en la responsabilidad", points: ["Busca servir, construir y desarrollar talento", "Quiere que otros brillen", "Él sirve a la organización"] }, note: "Paradójicamente, cuando un líder deja brillar a los demás, termina brillando más." },
      { kind: "text", eyebrow: "Las personas no son el problema", title: "Antes de culpar a la gente, revisa el contexto que creaste.", body: ["¿La visión es clara? ¿Los procesos ayudan o estorban? ¿La cultura permite cuestionar? ¿La organización premia la iniciativa o castiga el error?", "Convertir empleados en emprendedores internos significa pasar de personas que esperan instrucciones a personas que proponen, resuelven y mejoran."], callout: { label: "Nota CEO", text: "La gente no se activa con control; se activa con claridad, confianza y responsabilidad." } },
      { kind: "reveal", eyebrow: "Heart, head and hands", title: "Tres niveles de liderazgo", items: [
        { tag: "1", label: "Corazón · el porqué", body: "Propósito, valores, intención y servicio. Le da sentido al trabajo." },
        { tag: "2", label: "Cabeza · el qué", body: "Visión, estrategia, prioridades y metas. Le da dirección." },
        { tag: "3", label: "Manos · el cómo", body: "Ejecución, procesos, mejora continua y desarrollo de personas. Lo vuelve realidad." },
      ], note: "El CEO debe liderar con corazón para dar sentido, con cabeza para dar dirección y con manos para convertirlo en realidad." },
      { kind: "check", eyebrow: "Aplícalo", title: "Tu primera semana", question: "Llegas como director nuevo a una empresa con gente de muchos años. ¿Qué construye más confianza?", options: [
        { text: "Anunciar tus 5 prioridades el primer lunes para mostrar rumbo.", why: "Rumbo hace falta, pero llegar con la receta hecha manda el mensaje de que no te interesa entender." },
        { text: "Escuchar primero: 1 a 1, piso de operación y clientes, con fecha para presentar tu plan.", correct: true, why: "Escuchar con fecha de cierre no es lentitud: construye el contexto donde tus decisiones van a caer." },
        { text: "Encerrarte a estudiar los números antes de hablar con nadie.", why: "Los números no cuentan toda la historia, y el silencio se llena con rumores." },
      ] },
    ],
  },
  {
    id: "personas", title: "Liderar personas, no puestos", part: "Parte II", minutes: 5, icon: "users",
    subtitle: "El líder adecuado, desarrollar talento como prioridad número uno y liderar según el momento de cada persona.",
    blocks: [
      { kind: "text", eyebrow: "El líder adecuado", title: "Un proyecto sin el líder correcto es una apuesta cara.", body: ["Uno de los errores más frecuentes es pensar en el puesto y no en la persona: se llena una posición porque el organigrama (o el apellido) lo pide.", "Un gran líder combina pensamiento estratégico, ejecución confiable, inspiración, desarrollo de talento y carácter. De todas, el carácter sostiene a las demás."], callout: { label: "Nota CEO", text: "Un proyecto estratégico sin el líder correcto es una apuesta cara con baja probabilidad de éxito." } },
      { kind: "text", eyebrow: "Desarrollar talento", title: "Si no tienes 2 o 3 posibles reemplazos, estás protegiendo tu silla.", body: ["Desarrollar talento implica enseñar, confiar, delegar, exigir y acompañar. Implica dejar que otros decidan aunque al principio se equivoquen.", "Corregir el trabajo de alguien resuelve hoy. Enseñarle a hacerlo resuelve todos los trimestres que vienen."], callout: { label: "Nota CEO", text: "El verdadero liderazgo no se mide por cuánta gente te sigue, sino por cuánta gente crece contigo." } },
      { kind: "flow", eyebrow: "Liderazgo situacional", title: "Cada persona necesita algo distinto de ti", intro: "No se lidera igual a alguien nuevo que a un experto desmotivado.", steps: [
        { label: "Nuevo y entusiasta → dirige", example: "Ana en su primer pronóstico: necesita claridad sobre qué es «bueno»." },
        { label: "Aprendiendo y frustrado → entrena", example: "Explica el porqué, escucha y acompaña." },
        { label: "Capaz pero inseguro → apoya", example: "Dale confianza y espacio para proponer." },
        { label: "Experto y comprometido → delega", example: "Héctor con sus clientes: dale la cancha, pide resultados." },
      ], note: "Un líder mediocre se aferra a su estilo; un gran líder adapta su liderazgo sin traicionar sus valores." },
      { kind: "check", eyebrow: "Aplícalo", title: "La renuncia que no viste venir", question: "Tu mejor analista renuncia: «nunca supe si mi trabajo servía». ¿Qué falló?", options: [
        { text: "El sueldo: hay que igualar la oferta.", why: "Casi nunca es el sueldo. Ofrecer dinero cuando falta reconocimiento y desarrollo no resuelve nada." },
        { text: "Retroalimentación y desarrollo: nadie le dijo qué hacía bien ni cómo crecer.", correct: true, why: "El talento joven se queda donde crece. Retroalimentar es trabajo del líder, no de Recursos Humanos." },
        { text: "Nada: la rotación es normal.", why: "Alguna rotación es sana, pero perder a quien hizo tu mejor análisis es una señal." },
      ] },
    ],
  },
  {
    id: "equipos", title: "Equipos de alto desempeño", part: "Parte II · VII", minutes: 4, icon: "layers",
    subtitle: "Las 5 disfunciones, la seguridad psicológica y por qué un equipo donde nadie dice «no» está en riesgo.",
    blocks: [
      { kind: "reveal", layout: "pyramid", eyebrow: "Lencioni", title: "Las 5 disfunciones se construyen desde la base", intro: "Toca cada nivel en orden, empezando por la base.", items: [
        { tag: "1", label: "Confianza", body: "Sin confianza, la gente no dice lo que piensa.", details: [{ label: "Antídoto", text: "El líder se muestra vulnerable primero: pide retroalimentación en público." }] },
        { tag: "2", label: "Conflicto", body: "Sin decir lo que piensan, no hay conflicto productivo.", details: [{ label: "Antídoto", text: "Pedir explícitamente el desacuerdo antes de decidir." }] },
        { tag: "3", label: "Compromiso", body: "Sin debate, los compromisos son superficiales.", details: [{ label: "Antídoto", text: "Cerrar cada junta con quién hace qué y para cuándo." }] },
        { tag: "4", label: "Responsabilidad", body: "Sin compromiso, nadie se exige.", details: [{ label: "Antídoto", text: "Revisiones 1 a 1 y de equipo con scorecard a la vista." }] },
        { tag: "5", label: "Resultados", body: "Sin responsabilidad, los resultados se vuelven mediocres.", details: [{ label: "Antídoto", text: "Que el resultado del equipo pese más que el lucimiento individual." }] },
      ], note: "La confianza no elimina el conflicto. Lo vuelve útil." },
      { kind: "text", eyebrow: "Cultura", title: "El cambio ocurre conversación por conversación.", body: ["Una encuesta de clima donde solo el 31% siente que puede decir «no» es una alarma de seguridad psicológica.", "Los carteles de valores no cambian eso. Lo cambian los rituales repetidos (1 a 1, revisiones de equipo), las historias que se celebran y el ejemplo del líder."], callout: { label: "Nota CEO", text: "Si quieres cambiar una cultura, cambia las historias que la gente admira, repite y celebra." } },
      { kind: "check", eyebrow: "Aplícalo", title: "Primera jugada", question: "¿Qué cambia más rápido una cultura donde «no se le puede decir que no a un jefe»?", options: [
        { text: "Una campaña de valores renovados.", why: "Si ya hubo campañas, la gente aprendió a ignorarlas." },
        { text: "Rituales nuevos y el líder pidiendo retroalimentación en público.", correct: true, why: "La gente cree en la conducta, no en el discurso. Empieza por lo que todos pueden ver: tú." },
        { text: "Despedir a los jefes autoritarios.", why: "A veces hará falta, pero sin cambiar rituales e incentivos el patrón regresa." },
      ] },
    ],
  },
  {
    id: "alineacion", title: "Alineación: de la estrategia al scorecard", part: "Parte XII + mêtis", minutes: 5, icon: "compass",
    subtitle: "Por qué todos pueden ganar bono mientras la empresa pierde. MEGA, cascada, línea de vista y compensación conectada.",
    blocks: [
      { kind: "text", eyebrow: "El problema", title: "La estrategia rara vez falla en el papel. Falla al bajar.", body: ["Cada área optimiza lo suyo: Comercial vende volumen con descuento, Planta pide menos variedad, Marca lanza productos. Todos cumplen y cobran bono. La empresa pierde margen.", "La brecha no es de talento ni de esfuerzo: es de conexión. Nadie tradujo el objetivo de la empresa a lo que cada persona hace, mide y entrega."] },
      { kind: "flow", eyebrow: "La cascada", title: "De una meta a lo que cada quien hace el lunes", steps: [
        { label: "MEGA", example: "Volver a 13% de margen en 3 años sin dejar de ser Cumbre." },
        { label: "Líneas de acción", example: "Mezcla premium · reducir merma · condiciones comerciales sanas." },
        { label: "Indicadores de causa", example: "% de ventas premium · merma en planta · descuento promedio." },
        { label: "Scorecard por persona", example: "Cada director con 3 a 5 indicadores que empujan la MEGA." },
        { label: "Compensación conectada", example: "Bono = su scorecard + el resultado de la empresa." },
      ], note: "Línea de vista: que cada persona pueda explicar cómo su trabajo mueve el resultado de la empresa." },
      { kind: "compare", eyebrow: "Estrategia", title: "Eficiencia no es estrategia", left: { label: "Efectividad operativa", points: ["Hacer lo mismo que todos, mejor", "Se copia rápido", "Te ayuda a competir"] }, right: { label: "Estrategia", points: ["Elegir una posición única", "Implica trade-offs: decir que no", "Define por qué eres diferente"] }, neutral: true, note: "La estrategia no se demuestra por lo que apruebas, sino por lo que tienes el carácter de rechazar." },
      { kind: "check", eyebrow: "Aplícalo", title: "Objetivos que se contradicen", question: "Los objetivos de cada director tienen sentido solos, pero juntos se contradicen. ¿Qué haces?", options: [
        { text: "Respetar la autonomía de cada área.", why: "Autonomía sin dirección común es cada quien remando hacia su lado." },
        { text: "Una MEGA común, cascada a líneas de acción y scorecards que la empujen.", correct: true, why: "Así cada área conserva su cancha, pero todas juegan el mismo partido." },
        { text: "Ponerlos tú y comunicarlos el lunes.", why: "Cuadran en papel, pero nadie los siente suyos." },
      ] },
    ],
  },
  {
    id: "negociacion", title: "Negociar como CEO", part: "Parte XV", minutes: 5, icon: "handshake",
    subtitle: "Posiciones contra intereses, la MAPAN, intereses-derechos-poder y crear valor antes de reclamarlo.",
    blocks: [
      { kind: "compare", eyebrow: "Debajo de la posición", title: "Lo que dicen contra lo que necesitan", left: { label: "Posición (lo que piden)", points: ["«No toquen mis comisiones»", "«Queremos 9%»", "«4 puntos más de descuento»"] }, right: { label: "Interés (por qué lo piden)", points: ["Respeto, su lugar, proteger a su gente", "Llegar a fin de mes, sentirse justos", "Cumplir su meta de margen de categoría"] }, neutral: true, note: "La posición es la puerta de entrada; el interés es la habitación donde realmente se negocia." },
      { kind: "reveal", eyebrow: "Tres caminos", title: "Intereses, derechos y poder", items: [
        { tag: "I", label: "Intereses", body: "Entender qué necesita cada parte y diseñar algo que lo atienda. Más barato y protege la relación.", details: [{ label: "Ejemplo", text: "5% fijo + bono por reducir merma: el ahorro paga el aumento." }] },
        { tag: "D", label: "Derechos", body: "Acudir al contrato, la ley o el precedente. Da claridad, pero genera rigidez." },
        { tag: "P", label: "Poder", body: "Imponer costos o presionar. Gana obediencia, pierde confianza." },
      ], note: "El poder puede cerrar una conversación, pero los intereses bien entendidos pueden resolver el problema que la originó." },
      { kind: "text", eyebrow: "MAPAN", title: "Tu fuerza está en tus alternativas, no en tu tono.", body: ["MAPAN = Mejor Alternativa Para un Acuerdo Negociado. ¿Qué haces si no hay acuerdo? Si tu alternativa no existe (cero contratos con tiendas de conveniencia), amenazar es alardear.", "También estima la MAPAN del otro: si tu producto rota 1.4× más que el de la competencia, sacarte también le cuesta al cliente."], callout: { label: "Nota CEO", text: "La mejor forma de negociar con fuerza no es sonar fuerte; es construir alternativas antes de necesitarlas." } },
      { kind: "check", eyebrow: "Aplícalo", title: "Tu cliente más grande aprieta", question: "El 31% de tus ventas te pide 4 puntos de descuento. ¿Qué mueve mejor la negociación?", options: [
        { text: "Aceptar para no arriesgar la cuenta.", why: "Proteges el volumen y le enseñas al cliente que contigo basta con apretar." },
        { text: "Datos de rotación y una propuesta que haga crecer a los dos.", correct: true, why: "Cambias la conversación de «cuánto me das» a «cómo crecemos». Crear valor antes de reclamarlo." },
        { text: "Amenazar con sacar producto.", why: "Sin alternativa real, gastas reputación y puedes perder el anaquel." },
      ] },
    ],
  },
  {
    id: "comunicacion", title: "Comunicación ejecutiva", part: "Parte XIV", minutes: 5, icon: "message",
    subtitle: "Ocho segundos, empezar por el final, la fórmula POWER y las cuatro A para convertir datos en decisión.",
    blocks: [
      { kind: "text", eyebrow: "Ocho segundos", title: "La gente decide muy rápido si vale la pena escucharte.", body: ["En un consejo, tu primera frase decide si levantan la vista del celular. Empieza con el final: qué ves, qué propones y qué necesitas que decidan.", "Abrir con «todo lo que hice» demuestra esfuerzo, no dirección. Abrir culpando al pasado pone a la sala en tu contra."], callout: { label: "Nota CEO", text: "No empieces demostrando cuánto sabes; empieza demostrando por qué importa." } },
      { kind: "reveal", eyebrow: "La fórmula POWER", title: "Estructura para no perder a la audiencia", items: [
        { tag: "P", label: "Punch", body: "Golpea rápido: el final, una historia, una pregunta o un contraste." },
        { tag: "O", label: "One theme", body: "Un solo tema. Todo lo demás se conecta con él." },
        { tag: "W", label: "Windows", body: "Abre ventanas: ejemplos e historias concretas que se puedan ver." },
        { tag: "E", label: "Ear", body: "Habla para el oído. Conversacional, no «corporativo»." },
        { tag: "R", label: "Retention", body: "Un cierre que se pueda repetir una semana después." },
      ] },
      { kind: "flow", eyebrow: "Las cuatro A", title: "De datos a narrativa", steps: [
        { label: "Assemble", example: "Reúne lo relevante. 22 láminas no son 22 ideas." },
        { label: "Align", example: "¿Los hechos apuntan en una dirección? Premium +28%, tradicional −6%." },
        { label: "Apply", example: "¿Qué significa junto? La mezcla de producto está cambiando." },
        { label: "Assign", example: "¿Qué decidimos? Mover 15% de capacidad a premium." },
      ], note: "El dato muestra piezas; el líder arma el significado." },
      { kind: "check", eyebrow: "Aplícalo", title: "El reporte de 22 láminas", question: "Tu analista te manda 22 láminas sin conclusión. ¿Qué es lo más valioso que puedes hacer?", options: [
        { text: "Rehacerlo tú esta noche.", why: "Queda bien hoy y te compras ese trabajo cada trimestre." },
        { text: "Enseñarle a empezar por el final y pedirle una página con su recomendación.", correct: true, why: "20 minutos de enseñanza valen más que una noche de corrección." },
        { text: "Decirle que no sirve y que lo rehaga para mañana.", why: "Tendrás las láminas; perderás a la persona." },
      ] },
    ],
  },
  {
    id: "cultura", title: "Cultura, ética y walk the talk", part: "Partes VII y IX", minutes: 4, icon: "flame",
    subtitle: "La cultura es lo que se tolera. Por qué lo que haces cuando hay dinero en juego pesa más que cualquier valor escrito.",
    blocks: [
      { kind: "text", eyebrow: "Cultura real", title: "La cultura no es lo que la empresa dice. Es lo que la gente hace cuando nadie está revisando.", body: ["Se revela en lo que la empresa decide premiar, tolerar y promover. Si tu mejor vendedor infla gastos y no pasa nada, acabas de escribir el verdadero código de ética."], callout: { label: "Nota CEO", text: "La ética de una empresa no se mide por sus valores escritos, sino por lo que decide no tolerar cuando hay dinero en juego." } },
      { kind: "reveal", eyebrow: "Palancas de cambio", title: "Cuatro palancas que sí mueven comportamientos", items: [
        { tag: "1", label: "Walk the talk", body: "La gente escucha el discurso, pero cree en la conducta. El líder lo vive primero." },
        { tag: "2", label: "Escucha y diálogo", body: "Si el líder no comunica el cambio, la organización inventa su propia versión." },
        { tag: "3", label: "Habilidades, pilotos y progreso visible", body: "Victorias pequeñas y visibles que vuelven creíble el cambio." },
        { tag: "4", label: "Coalición, reconocimiento e incentivos", body: "Que la mejor opción también sea la más deseable." },
      ] },
      { kind: "check", eyebrow: "Aplícalo", title: "Seguridad contra pedido", question: "Una máquina falla y casi lastima a alguien. Pararla retrasa el pedido de tu cliente más grande. ¿Qué aprende la planta si sigues operando?", options: [
        { text: "Que el director confía en su cuidado.", why: "Lo que escuchan es otra cosa: el pedido vale más que ellos." },
        { text: "Que la seguridad es negociable cuando hay dinero en juego.", correct: true, why: "Y esa lección se queda años, aunque nunca pase nada." },
        { text: "Nada; es una decisión operativa.", why: "Las decisiones bajo presión son las que más comunican cultura." },
      ] },
    ],
  },
  {
    id: "finanzas", title: "Finanzas: el CEO asigna capital", part: "Parte XIII", minutes: 5, icon: "coins",
    subtitle: "VPN, costo de capital, apalancamiento y covenants. Por qué escalonar una inversión es comprarte opciones.",
    blocks: [
      { kind: "text", eyebrow: "Asignador de capital", title: "El capital es una forma de confianza.", body: ["Cada peso que el CEO asigna es una apuesta sobre el futuro. Crecimiento sin retorno suficiente no es ambición: es expansión sin disciplina.", "El VPN compara lo que una inversión genera contra lo que cuesta el dinero (tu costo de capital). Positivo = crea valor. Pero no te dice cuánto riesgo cargas."], callout: { label: "Nota CEO", text: "Un modelo no decide. Un modelo revela qué tan razonable es la historia que nos estamos contando." } },
      { kind: "compare", eyebrow: "Deuda", title: "El apalancamiento amplifica todo", left: { label: "A favor", points: ["Crecer sin esperar flujo propio", "Mejora el retorno sobre capital", "Aprovecha oportunidades a tiempo"] }, right: { label: "En contra", points: ["Pagos fijos aunque las ventas caigan", "Covenants: el banco pone límites (p. ej. deuda/EBITDA ≤ 3×)", "Te quita libertad cuando más la necesitas"] }, neutral: true },
      { kind: "reveal", eyebrow: "Los tres estados", title: "Qué te dice cada estado financiero", items: [
        { tag: "B", label: "Balance general", body: "La foto: qué tienes, qué debes y qué es de los dueños en un momento." },
        { tag: "R", label: "Estado de resultados", body: "La película: ventas, costos y utilidad en un periodo." },
        { tag: "F", label: "Flujo de efectivo", body: "La verdad: de dónde vino y a dónde se fue el dinero. Las empresas quiebran por falta de caja, no de utilidad." },
      ], note: "Cuando una métrica se vuelve más importante que el propósito que debía representar, deja de ser herramienta y se vuelve riesgo." },
      { kind: "check", eyebrow: "Aplícalo", title: "Crédito de $40 M", question: "Una inversión tiene VPN positivo, pero con ventas −10% rompes el límite del banco. ¿Qué es lo más sensato?", options: [
        { text: "Tomarla completa: el VPN es positivo.", why: "Hay valor, pero un mal año te pone en manos del banco." },
        { text: "Escalonarla: fase 1 con flujo propio, fase 2 según resultados.", correct: true, why: "Tomas el valor sin comprometer la libertad. Escalonar es comprarte opciones." },
        { text: "Posponerla hasta que todo esté estable.", why: "Todo nunca está estable, y el ahorro también se pospone." },
      ] },
    ],
  },
  {
    id: "innovacion", title: "Innovación y pilotos", part: "Partes X y IX", minutes: 4, icon: "rocket",
    subtitle: "Las ideas que cambian mercados parecen absurdas al inicio. Cómo apostar sin quemar la caja.",
    blocks: [
      { kind: "text", eyebrow: "Innovar", title: "Las ideas más innovadoras suelen parecer absurdas.", body: ["Matar una idea por prudencia es tan caro como apostar todo a ella sin evidencia. El CEO diseña el camino para aprender barato.", "Y el fracaso es materia prima: no se premia el fracaso, se premia la honestidad, el aprendizaje y la siguiente iteración mejor pensada."], callout: { label: "Nota CEO", text: "Un piloto no sirve para demostrar que tenías razón; sirve para aprender antes de apostar en grande." } },
      { kind: "flow", eyebrow: "Un buen piloto", title: "Cómo diseñarlo", steps: [
        { label: "Hipótesis", example: "El consumidor premium compra papas regionales si son auténticas." },
        { label: "Alcance acotado", example: "30 tiendas, 8 semanas, $800 mil." },
        { label: "Métricas acordadas antes", example: "Rotación, margen, recompra y canibalización." },
        { label: "Un dueño", example: "Quien propone lo lidera y lo presenta." },
        { label: "Decisión", example: "Escalar por etapas, ajustar o cerrar." },
      ] },
      { kind: "check", eyebrow: "Aplícalo", title: "El hijo del fundador", question: "Una idea con potencial y sin evidencia pide dos terceras partes del presupuesto anual. ¿Qué haces?", options: [
        { text: "Aprobarla: tiene respaldo y el mercado crece.", why: "Quizá funcione, pero apostaste la caja a algo sin probar." },
        { text: "Un piloto acotado con métricas claras, liderado por quien lo propuso.", correct: true, why: "Proteges la caja y la idea, y quien la propone se la gana con datos." },
        { text: "Rechazarla hasta arreglar lo actual.", why: "Proteges la caja y matas una oportunidad real." },
      ] },
    ],
  },
  {
    id: "estrategia", title: "Visión y estrategia", part: "Partes III, V y XII", minutes: 4, icon: "target",
    subtitle: "Una visión que se pueda repetir, una posición única y el carácter para decir que no.",
    blocks: [
      { kind: "text", eyebrow: "Visión", title: "Si nadie puede repetir la visión, la visión no existe.", body: ["La visión es el primer trabajo del líder. Una visión fuerte no solo dice hacia dónde vamos: también deja claro a qué vamos a renunciar.", "Las empresas duraderas saben qué deben proteger aunque el mundo cambie (su núcleo) y qué deben cambiar para seguir mereciendo existir."], callout: { label: "Nota CEO", text: "Una visión que no se entiende en todos los niveles no es visión; es decoración corporativa." } },
      { kind: "reveal", eyebrow: "Posición única", title: "Tres ideas de estrategia", items: [
        { tag: "1", label: "Trade-offs", body: "Elegir implica renunciar. Si no hay nada a lo que digas que no, no hay estrategia." },
        { tag: "2", label: "Fit", body: "Las actividades se refuerzan entre sí; por eso una buena estrategia es difícil de copiar." },
        { tag: "3", label: "BHAG", body: "Una meta grande, audaz y retadora que obliga a estirarse y alinea energía." },
      ], note: "Una empresa sin diferenciadores no compite; sobrevive hasta que alguien más la abarata." },
      { kind: "check", eyebrow: "Aplícalo", title: "El cliente como único jefe", question: "¿Qué pregunta es más estratégica para diseñar un producto?", options: [
        { text: "¿Quién es mi cliente (edad, nivel, región)?", why: "Describe al cliente, pero no explica por qué compra." },
        { text: "¿Qué progreso intenta lograr esta persona en esta circunstancia?", correct: true, why: "Eso es Jobs to Be Done: el cliente contrata un producto para resolver algo." },
        { text: "¿Qué está lanzando la competencia?", why: "Útil, pero copiar te lleva a parecerte a todos." },
      ] },
    ],
  },
];

export const LESSONS: Lesson[] = [...BASE_LESSONS, ...MORE_LESSONS];
export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);

/** Temas de Academy. Cada tema tiene niveles que se abren conforme avanzas en tu carrera. */
export const TRACKS: { id: string; title: string; icon: Lesson["icon"]; blurb: string }[] = [
  { id: "mentalidad", title: "Mentalidad del CEO", icon: "flag", blurb: "Cómo piensa quien carga la responsabilidad." },
  { id: "personas", title: "Liderar personas", icon: "users", blurb: "Cada persona necesita algo distinto de ti." },
  { id: "conversaciones", title: "Conversaciones", icon: "message", blurb: "Decir lo difícil para que se escuche." },
  { id: "equipos", title: "Equipos", icon: "layers", blurb: "Confianza, conflicto útil y compromiso." },
  { id: "alineacion", title: "Alineación", icon: "compass", blurb: "De la estrategia a lo que cada quien hace el lunes." },
  { id: "negociacion", title: "Negociación", icon: "handshake", blurb: "Intereses, alternativas y relaciones que duran." },
  { id: "comunicacion", title: "Comunicación", icon: "message", blurb: "Empezar por el final y dar malas noticias." },
  { id: "cultura", title: "Cultura y ética", icon: "flame", blurb: "Lo que toleras es tu verdadero código." },
  { id: "finanzas", title: "Finanzas", icon: "coins", blurb: "Asignar capital y no quedarte sin caja." },
  { id: "innovacion", title: "Innovación", icon: "rocket", blurb: "Apostar barato, aprender rápido, cerrar a tiempo." },
  { id: "estrategia", title: "Estrategia", icon: "target", blurb: "Elegir, y tener el carácter de decir que no." },
  { id: "crisis", title: "Crisis", icon: "flame", blurb: "Personas primero, hechos después, una sola voz." },
  { id: "consejo", title: "Gobierno y consejo", icon: "compass", blurb: "Sin sorpresas, con opciones." },
];
/** Tema y nivel de una lección a partir de su id («personas-2» → personas, nivel 2). */
export function trackOf(l: Lesson) {
  const m = /^(.*?)-(\d+)$/.exec(l.id);
  return { track: m ? m[1] : l.id, level: m ? Number(m[2]) : 1 };
}
const EXTRA_RANK: Record<string, number> = { crisis: 1, consejo: 2 };
/** Rango de carrera necesario para abrir la lección. */
export function rankOf(l: Lesson) {
  if (typeof l.rank === "number") return l.rank;
  const { track, level } = trackOf(l);
  return (EXTRA_RANK[track] ?? 0) + level - 1;
}
export const lessonsOfTrack = (track: string) => LESSONS.filter((l) => trackOf(l).track === track).sort((a, b) => trackOf(a).level - trackOf(b).level);
/** Niveles que aún no están escritos pero que ya se anuncian (para que se sienta que el camino sigue). */
export const MAX_TRACK_LEVEL = 5;
