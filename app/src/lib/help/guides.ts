/**
 * Instructor contextual (botón «?»): guía de cada página de mêtis.
 * Lógica pura (sin JSX) para poder probarla con Vitest.
 */
import { matchScore } from "../search";

export interface Faq { q: string; a: string }
export interface Guide {
  title: string;
  purpose: string;
  steps: string[];
  faqs: Faq[];
}

const GENERAL: Faq[] = [
  { q: "¿Cómo encuentro algo rápido?", a: "Presiona ⌘K (o Ctrl+K) desde cualquier pantalla y escribe el nombre de un indicador, proyecto, persona o página." },
  { q: "¿Qué significan los colores del semáforo?", a: "Sobresaliente y Satisfactorio (verdes) = meta cumplida. Mínimo (amarillo) = debajo de la meta: hay que actuar y acordar un plan. Gris = sin dato." },
  { q: "¿Qué diferencia hay entre Owner y Contributor?", a: "El Owner captura el dato de un indicador cada mes. Los Contributors lo tienen en su scorecard y se les actualiza solo: un dato, un dueño." },
  { q: "¿Dónde repaso los conceptos?", a: "En mêtis Academy (arriba del menú) puedes volver a cualquier módulo cuando quieras." },
];

export const GUIDES: Record<string, Guide> = {
  "/inicio": {
    title: "Inicio",
    purpose: "Tu mes en un vistazo: cómo vas, qué te falta y qué espera tu aprobación.",
    steps: ["Revisa tu cumplimiento ponderado del mes.", "Atiende los pendientes: datos por cargar y scorecards por aprobar.", "Si tienes equipo, mira quién necesita apoyo."],
    faqs: [
      { q: "¿Qué es el cumplimiento ponderado?", a: "Es el promedio de tus KPIs y proyectos considerando el peso de cada uno en tu scorecard. Un KPI con 30% pesa más que uno con 10%." },
      { q: "¿Por qué me aparece un pendiente de carga?", a: "Porque eres Owner de un indicador que aún no tiene dato este mes. Da clic y te lleva a Carga mensual." },
      { q: "¿Cómo cambio el mes que estoy viendo?", a: "Con el selector de mes en la barra superior. Todas las páginas se actualizan a ese mes." },
    ],
  },
  "/scorecard": {
    title: "Mi Scorecard",
    purpose: "Cómo te mides este año: tus KPIs y proyectos, cada uno con su meta, peso y semáforo.",
    steps: ["Agrega tus elementos con «Agregar elemento».", "Ajusta los pesos hasta que sumen exactamente 100%.", "Envíalo a tu jefe para su aprobación.", "Una vez aprobado, cada mes se llena con los datos reales."],
    faqs: [
      { q: "¿Por qué no puedo enviarlo a mi jefe?", a: "Los pesos deben sumar exactamente 100%. Revisa el total arriba de la tabla y ajusta." },
      { q: "¿Qué pasa si mi jefe solicita ajustes?", a: "Verás su nota en el estado del scorecard. Haz los cambios y vuélvelo a enviar." },
      { q: "¿Puedo cambiarlo después de aprobado?", a: "Sí, pero debe reabrirse como borrador y volver a aprobarse. Así el compromiso siempre está acordado con tu jefe." },
      { q: "¿Qué es la ponderación por mes?", a: "Permite que un elemento pese distinto según el mes, por ejemplo un proyecto que solo cuenta en el segundo semestre." },
      { q: "¿Dónde veo los cambios anteriores?", a: "En «Historial» queda registrado quién envió, aprobó o pidió ajustes y cuándo." },
    ],
  },
  "/carga": {
    title: "Carga mensual",
    purpose: "Aquí capturas el resultado del mes de los indicadores donde eres Owner.",
    steps: ["Busca el indicador en la lista (los que vencen pronto aparecen marcados).", "Escribe el valor real del mes.", "Adjunta evidencia si aplica.", "Presiona «Guardar dato»: los Contributors se actualizan al instante."],
    faqs: [
      { q: "¿Por qué no veo un indicador que tengo en mi scorecard?", a: "Aquí solo aparecen los indicadores donde eres Owner. Si eres Contributor, el dato lo captura el Owner y tu scorecard se actualiza solo." },
      { q: "¿Cómo adjunto evidencia?", a: "En la tarjeta del indicador usa «Adjuntar evidencia» y sube el archivo o liga que respalda el dato." },
      { q: "¿Qué significa «Vence en N días»?", a: "Es el tiempo que queda para el cierre de captura del mes. mêtis te manda recordatorio por correo antes." },
      { q: "Me equivoqué en un dato, ¿lo puedo corregir?", a: "Sí, mientras el periodo esté abierto: cambia el valor y vuelve a guardar." },
    ],
  },
  "/sesiones": {
    title: "Sesiones WTW / WTM",
    purpose: "El ritmo del equipo natural: la WTW semanal (cómo cerró la semana, qué sigue y qué apoyos hacen falta) y la WTM de cierre de mes.",
    steps: [
      "Agenda tu WTW con «Agendar sesión» (puedes repetirla cada semana) y tu WTM al inicio de cada mes.",
      "Antes de la junta abre «Preparar»: mêtis ya armó el marcador y los compromisos a revisar.",
      "En la junta usa «Presentar»: proyéctalo o compártelo en Teams, Meet o Zoom y captura compromisos persona por persona.",
      "Al terminar revisa el borrador y pulsa «Aprobar y enviar tareas»: a cada quien le llega en «Compromisos».",
    ],
    faqs: [
      { q: "¿Quién participa?", a: "Tu equipo natural: las personas que te reportan directo. Si alguien no aparece, revisa su jefe directo en Configuración → Usuarios." },
      { q: "¿Qué se presenta en una WTW?", a: "1) Marcador con los indicadores de cada quien, 2) ¿se cumplieron los compromisos de la sesión anterior?, 3) persona por persona: cierre y compromisos de esta semana, 4) solicitudes de apoyo." },
      { q: "¿Y en la WTM?", a: "El cierre del mes: scorecard de cada persona, lo que va debajo de la meta con su causa, el % de compromisos cumplidos del mes y 2–3 focos para el mes siguiente." },
      { q: "¿Los compromisos llegan en cuanto los capturo?", a: "No. Quedan como borrador hasta que el líder revisa y aprueba la sesión. Así nada sale con errores." },
      { q: "¿Se puede grabar o transcribir la sesión?", a: "Próximamente: podrás grabar o subir el audio de Teams, Meet o Zoom y el agente de mêtis propondrá el resumen y los compromisos. Tú siempre apruebas antes de enviar." },
      { q: "¿Cómo navego la presentación?", a: "Con las flechas ← → del teclado o los botones de abajo. Esc para salir; lo capturado se guarda." },
    ],
  },
  "/compromisos": {
    title: "Compromisos",
    purpose: "Tus tareas de seguimiento: lo que te comprometiste a hacer en las sesiones y los apoyos que te pidieron.",
    steps: [
      "Revisa «Vencidos» y «Hoy» primero.",
      "Marca el cuadro cuando lo cumplas: tu líder lo verá en la siguiente WTW.",
      "Si no se cumplió o ya no aplica, usa ••• para dejarlo claro.",
      "Si eres líder, cambia a «Mi equipo» para ver los pendientes y el % de cumplimiento de cada persona.",
    ],
    faqs: [
      { q: "¿Qué es un buen compromiso?", a: "Algo concreto y verificable con responsable y fecha: «Visitar a los 5 clientes top antes del viernes», no «echarle ganas a ventas». No tiene que estar ligado a un indicador." },
      { q: "¿Cómo se calcula el % de cumplimiento?", a: "De los compromisos que vencían en las últimas 4 semanas, cuántos se marcaron como cumplidos. Los vencidos sin cerrar cuentan como no cumplidos; los cancelados y los apoyos no cuentan." },
      { q: "¿Qué es una solicitud de apoyo?", a: "Algo que una persona necesita de otra para avanzar (por ejemplo, de TI o de su jefe). Le aparece como tarea a quien debe darlo y se revisa en la siguiente sesión." },
      { q: "¿Puedo crear un compromiso fuera de una sesión?", a: "Sí, con «Nuevo». Se revisará en la siguiente sesión de tu equipo." },
    ],
  },
  "/mapa": {
    title: "Mapa de alineación",
    purpose: "La cascada completa: cómo la MEGA baja a sus Líneas de Acción, a los KPIs y proyectos y a cada persona.",
    steps: ["Elige la vista por alcance (empresa, región, planta…).", "Arriba está la MEGA; debajo, cada línea de acción con sus KPIs y proyectos.", "Usa el conteo por semáforo para ubicar qué va en Mínimo."],
    faqs: [
      { q: "¿Qué es una LAE?", a: "Línea de Acción Estratégica: uno de los 3 a 5 pilares para lograr la MEGA. No hay una lista fija: nacen de la naturaleza de tu negocio (por ejemplo, Expansión de mercado, Institucionalización o Cero defectos). Cada LAE se mide con KPIs y se ejecuta con proyectos." },
      { q: "¿Para qué me sirve el mapa?", a: "Para responder «¿mi trabajo a qué contribuye?» y para usarlo como marcador en las sesiones de equipo." },
      { q: "¿Qué significa «Vista: alcance»?", a: "Filtra el mapa por un nivel de la organización (por ejemplo una región) para ver solo su cascada." },
    ],
  },
  "/indicadores": {
    title: "Indicadores",
    purpose: "Todos los KPIs de la organización con su resultado y semáforo del mes.",
    steps: ["Busca o filtra el indicador que te interesa.", "Ábrelo para ver su meta, Owner, Contributors e historial."],
    faqs: [
      { q: "¿Quién captura cada indicador?", a: "Su Owner. Lo ves en el detalle del indicador." },
      { q: "¿Cómo creo un indicador nuevo?", a: "Los administradores lo dan de alta en Configuración → Catálogo de elementos." },
    ],
  },
  "/proyectos": {
    title: "Proyectos",
    purpose: "Las iniciativas estratégicas con su avance y semáforo.",
    steps: ["Revisa el avance de cada proyecto contra lo planeado.", "Ábrelo para ver responsable y detalle."],
    faqs: [
      { q: "¿En qué se diferencia un proyecto de un KPI?", a: "Un KPI mide un resultado recurrente (ventas, OTIF). Un proyecto mide el avance de una iniciativa con inicio y fin." },
    ],
  },
  "/equipo": {
    title: "Mi equipo",
    purpose: "El avance de cada persona a tu cargo y los scorecards que esperan tu aprobación.",
    steps: ["Revisa el cumplimiento de cada colaborador.", "Usa «Revisar y aprobar» en los scorecards enviados.", "Prepara tus 1 a 1 abriendo «Ver scorecard»."],
    faqs: [
      { q: "¿Cómo apruebo un scorecard?", a: "Abre «Revisar y aprobar». Puedes Aprobar, Solicitar ajustes o Denegar; en los dos últimos deja una nota clara de qué cambiar." },
      { q: "¿Cómo preparo un 1 a 1?", a: "Abre su scorecard antes: reconoce los verdes con hechos y lleva preguntas para lo que va en Mínimo («¿qué está pasando?, ¿qué necesitas?»). Cierra con compromisos con fecha." },
      { q: "¿Qué tono uso en la revisión?", a: "Coach, no inspector: firme con los resultados, cálido con las personas. Escucha más de lo que hablas." },
    ],
  },
  "/reportes": {
    title: "Reportes",
    purpose: "La foto de toda la organización: ideal para la WTM y para dirección.",
    steps: ["Elige el mes en la barra superior.", "Descarga el PDF para presentarlo o exporta a CSV para analizarlo."],
    faqs: [
      { q: "¿Cómo lo uso en la WTM?", a: "Proyéctalo como marcador al inicio de la sesión: dónde vamos ganando, dónde perdiendo y qué indicadores en Mínimo requieren plan." },
      { q: "¿Puedo abrirlo en Excel?", a: "Sí, con «Exportar CSV»." },
    ],
  },
  "/academy": {
    title: "mêtis Academy",
    purpose: "Módulos cortos sobre alineación estratégica, equipos, liderazgo y revisiones, más un tour de la plataforma.",
    steps: ["Completa los módulos en orden.", "Aprueba cada quiz con 80% o más (puedes reintentar).", "Al terminar, se desbloquea todo mêtis."],
    faqs: [
      { q: "¿Se guarda mi avance?", a: "Sí, automáticamente. Puedes salir y volver cuando quieras." },
      { q: "¿Qué pasa si repruebo un quiz?", a: "Ves el repaso con la explicación de cada respuesta y lo puedes intentar de nuevo las veces que quieras." },
      { q: "¿Por qué me llegan correos de la Academia?", a: "Es un recordatorio cada 2 días mientras tengas módulos pendientes. Se detiene al terminar." },
    ],
  },
  "/config/estrategia": {
    title: "Estrategia",
    purpose: "Aquí vive la parte alta de la cascada: la MEGA de la empresa, sus Líneas de Acción Estratégica (LAE) y, en cada línea, los KPIs que la miden y los proyectos que la ejecutan.",
    steps: [
      "Define la MEGA: una sola meta grande y ambiciosa a 5–10 años, audaz, clara, medible y con fecha.",
      "Agrega de 3 a 5 líneas de acción propias de tu negocio. Pregúntate: ¿qué capacidades, mercados o cambios tenemos que dominar sí o sí para lograr la MEGA? Si necesitas inspiración, usa «Ideas».",
      "Debajo de cada línea cuelgan sus KPIs (cómo medimos) y sus proyectos estratégicos (qué ejecutamos, lo ideal 1 o 2 al año). Agrégalos con «+ KPI» y «+ Proyecto».",
      "Asegúrate de que cada KPI y cada proyecto tenga un solo dueño. Si ves «Sin dueño», asígnalo en el Catálogo.",
    ],
    faqs: [
      { q: "¿Qué es la MEGA?", a: "La Meta Estratégica Grande y Ambiciosa: el objetivo supremo de la empresa a 5–10 años. Audaz, clara, medible y con fecha. Hay una sola y se evalúa cada año." },
      { q: "¿Cuántas líneas de acción y proyectos?", a: "De 3 a 5 líneas de acción como máximo (con 7 u 8 no hay estrategia, hay una lista de deseos) y 1 o 2 proyectos de alto impacto por línea cada año. Debes poder explicarlas en un minuto. mêtis no deja crear más de 5: si necesitas otra, primero elimina o fusiona una." },
      { q: "¿Los pilares tienen que ser Comercial, Operación, Cliente y Talento?", a: "No. Ese equilibrio viene del Balanced Scorecard y es una buena base, pero los pilares deben nacer de tu MEGA: una startup pensará en capital y escalabilidad; una fábrica, en automatización y calidad; una empresa familiar, en institucionalización y sucesión." },
      { q: "¿Cada cuándo se revisa cada cosa?", a: "Los KPIs cada mes, los proyectos cada quincena y la MEGA una vez al año." },
      { q: "¿Cómo leo el árbol?", a: "Arriba la MEGA; debajo, cada línea de acción; y colgando de cada línea, sus KPIs y proyectos con la inicial de su responsable. Si ves «Sin dueño» o una caja vacía, ahí falta algo." },
      { q: "¿Cómo borro una línea de acción?", a: "Pasa el mouse sobre la tarjeta de la línea y da clic en el bote de basura (en celular siempre está visible). Si tiene KPIs o proyectos, eliges a qué otra línea pasarlos: no se pierde nada." },
    ],
  },
  "/config/catalogo": {
    title: "Catálogo de elementos",
    purpose: "Todos los KPIs y proyectos disponibles para armar los scorecards.",
    steps: ["Crea un elemento con «Nuevo elemento» o carga varios con «Importar desde Excel».", "Define unidad, dirección (más es mejor o menos es mejor) y LAE.", "Asigna Owner y alcance."],
    faqs: [
      { q: "¿Cómo importo desde Excel?", a: "Usa «Importar desde Excel» y sigue la plantilla: una fila por elemento." },
      { q: "¿Por qué definir la dirección?", a: "Para calcular bien el semáforo: en ventas más es mejor; en merma, menos es mejor." },
    ],
  },
  "/config/alcances": {
    title: "Alcances",
    purpose: "Los niveles de tu organización (empresa, región, planta…) y su jerarquía.",
    steps: ["Define los tipos de alcance.", "Crea cada alcance y su padre para formar la jerarquía."],
    faqs: [
      { q: "¿Para qué sirven?", a: "Para que un mismo indicador exista en varios lugares (OTIF Norte, OTIF Sur) con su propio Owner y dato." },
    ],
  },
  "/config/unidades": {
    title: "Unidades de medida",
    purpose: "Las unidades con las que se miden los indicadores (%, pesos, piezas, días…).",
    steps: ["Agrega las que falten con «Nueva unidad»."],
    faqs: [{ q: "¿Puedo borrar una unidad?", a: "Solo si ningún indicador la está usando." }],
  },
  "/config/usuarios": {
    title: "Usuarios y roles",
    purpose: "Quién entra a mêtis, su rol y a quién le reporta.",
    steps: ["Comparte el código de empresa o invita por correo.", "Asigna rol y jefe directo.", "Revisa la columna Academy para ver quién ya terminó su capacitación."],
    faqs: [
      { q: "¿Qué puede hacer cada rol?", a: "Administrador: todo, incluida la configuración. Gerente: configuración y su equipo. Colaborador: su espacio, scorecard y cargas." },
      { q: "¿Por qué es importante el jefe directo?", a: "Define quién aprueba cada scorecard y quién aparece en «Mi equipo»." },
    ],
  },
  "/config/notificaciones": {
    title: "Notificaciones",
    purpose: "Cuándo y cómo mêtis recuerda las cargas del mes.",
    steps: ["Define los días de recordatorio y la hora.", "Activa el resumen al jefe si quieres que reciba quién falta."],
    faqs: [{ q: "¿A quién le llegan los recordatorios?", a: "A los Owners con datos pendientes del mes; el resumen, a sus jefes directos." }],
  },
  "/consola": {
    title: "Consola de clientes",
    purpose: "Vista interna de mêtis para administrar las empresas cliente.",
    steps: ["Da de alta empresas y revisa su actividad."],
    faqs: [],
  },
};

const FALLBACK: Guide = {
  title: "mêtis",
  purpose: "Tu plataforma de alineación estratégica.",
  steps: ["Usa el menú de la izquierda para moverte.", "Presiona ⌘K para buscar cualquier cosa."],
  faqs: [],
};

/** Guía de la ruta actual (también para subrutas: /equipo/123 → /equipo). */
export function guideFor(path: string): Guide & { key: string } {
  const clean = (path || "/").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const keys = Object.keys(GUIDES).sort((a, b) => b.length - a.length);
  const key = keys.find((k) => clean === k || clean.startsWith(k + "/"));
  return key ? { key, ...GUIDES[key] } : { key: "", ...FALLBACK };
}

export const generalFaqs = GENERAL;

/** Busca una duda: primero en la página actual, luego en el resto. */
export function searchHelp(query: string, path: string, limit = 5): (Faq & { page: string; here: boolean })[] {
  if (!query.trim()) return [];
  const here = guideFor(path).key;
  const pool = [
    ...Object.entries(GUIDES).flatMap(([k, g]) => g.faqs.map((f) => ({ ...f, page: g.title, here: k === here }))),
    ...GENERAL.map((f) => ({ ...f, page: "General", here: false })),
  ];
  return pool
    .map((f) => ({ f, m: Math.max(matchScore(query, f.q), matchScore(query, f.q, f.a) * 0.6) }))
    .filter((x) => x.m > 0)
    .sort((a, b) => b.m + (b.f.here ? 0.5 : 0) - (a.m + (a.f.here ? 0.5 : 0)))
    .slice(0, limit)
    .map((x) => x.f);
}
