/** Índice de Alineación METIS · 5 dimensiones × 4 preguntas · escala 0–4. Ver docs/indice-de-alineacion.md */

export interface Question { id: number; dim: number; text: string; options: [string, string, string, string, string] }
export interface Dimension { id: number; name: string; short: string; question: string; color: string }

export const DIMENSIONS: Dimension[] = [
  { id: 1, name: "Claridad estratégica", short: "Claridad", question: "¿Todos saben hacia dónde va la empresa?", color: "#4F3FE0" },
  { id: 2, name: "Cascada y responsables", short: "Cascada", question: "¿Cada persona sabe qué mueve y cómo se mide?", color: "#2FA7F5" },
  { id: 3, name: "Un dato, una fuente", short: "Dato único", question: "¿El mismo KPI se reporta igual en toda la empresa?", color: "#14C98E" },
  { id: 4, name: "Ritmo de gestión", short: "Ritmo", question: "¿Las reuniones deciden o discuten el dato?", color: "#F5A524" },
  { id: 5, name: "Desempeño y consecuencias", short: "Consecuencias", question: "¿El bono se conecta con la estrategia?", color: "#F2545B" },
];

export const QUESTIONS: Question[] = [
  { id: 1, dim: 1, text: "¿La empresa tiene objetivos corporativos a 3–5 años escritos y medibles?", options: ["No existen", "Existe una visión general sin métricas", "Hay objetivos pero sólo los conoce la dirección", "Hay objetivos medibles compartidos con gerentes", "Toda la organización los conoce y puede citarlos"] },
  { id: 2, dim: 1, text: "¿Los objetivos están traducidos en líneas de acción claras para las áreas?", options: ["No", "De forma informal", "Existen en una presentación anual", "Existen y cada área sabe cuál le toca", "Cada área tiene sus líneas de acción con dueño y revisión periódica"] },
  { id: 3, dim: 1, text: "Cuando cambia una prioridad estratégica, ¿se sabe qué KPIs, proyectos y personas se ven afectados?", options: ["No", "Se averigua preguntando", "Se identifica con trabajo manual", "Existe un mapa parcial", "Existe un mapa conectado y actualizado"] },
  { id: 4, dim: 1, text: "¿La planeación anual conecta presupuesto, metas y proyectos en un solo ejercicio?", options: ["Cada uno por su lado", "Presupuesto sin metas operativas", "Metas sin presupuesto ligado", "Conectados con esfuerzo manual", "Un solo proceso integrado"] },
  { id: 5, dim: 2, text: "¿Cada gerente y colaborador clave tiene un conjunto explícito de KPIs y proyectos por los que responde?", options: ["No", "Sólo la dirección", "Sólo gerentes", "Gerentes y mandos medios", "Todos los colaboradores con responsabilidad de resultado"] },
  { id: 6, dim: 2, text: "¿Los KPIs tienen metas por nivel (mínima, satisfactoria, sobresaliente) definidas antes del periodo?", options: ["No hay metas", "Una sola meta, definida tarde", "Una sola meta, definida a tiempo", "Varios niveles en algunos KPIs", "Tres niveles en todos los KPIs"] },
  { id: 7, dim: 2, text: "¿Se define el alcance de cada KPI (nacional, región, planta, unidad) y quién es dueño de cada alcance?", options: ["No", "Implícito", "Documentado en algunos casos", "Documentado en la mayoría", "Cada alcance tiene dueño y meta propios"] },
  { id: 8, dim: 2, text: "¿Los KPIs de cada persona tienen un peso relativo acordado y aprobado por su jefe?", options: ["No", "Informalmente", "Sí, pero no se revisa", "Sí, aprobado anualmente", "Sí, aprobado y ajustable por periodo"] },
  { id: 9, dim: 3, text: "¿Cada KPI tiene una definición única (fórmula, unidad, fuente) usada por toda la empresa?", options: ["No", "Cada área define el suyo", "Hay un glosario incompleto", "Catálogo formal para la mayoría", "Catálogo único y obligatorio"] },
  { id: 10, dim: 3, text: "¿El mismo KPI se captura una sola vez o se vuelve a capturar en cada área que lo usa?", options: ["Cada quien lo captura", "Se copian entre áreas", "Hay una fuente pero se re-captura", "Una captura, se distribuye manualmente", "Una captura, se propaga automáticamente"] },
  { id: 11, dim: 3, text: "¿Existe un responsable claro de cargar cada KPI y una fecha de cierre que se cumple?", options: ["No", "Responsable informal, cierre tardío", "Responsable claro, cierre irregular", "Cierre puntual en la mayoría", "Cierre puntual y monitoreado"] },
  { id: 12, dim: 3, text: "¿Los resultados se consolidan sin armar Excel o presentaciones a mano cada mes?", options: ["Todo manual", "Mayormente manual", "Mitad y mitad", "Mayormente automático", "Consolidación automática"] },
  { id: 13, dim: 4, text: "¿Existen sesiones de resultados semanales y mensuales con agenda fija y asistencia consistente?", options: ["No", "Ocasionales", "Mensuales irregulares", "Mensuales consistentes", "Semanales y mensuales consistentes"] },
  { id: 14, dim: 4, text: "¿Las sesiones se preparan con información ya cargada, o se dedican a construir y discutir el dato?", options: ["Se construye el dato en la sesión", "Se discute el dato", "Parte dato, parte decisión", "Se decide sobre datos ya validados", "Pre-lectura previa y sesión de decisiones"] },
  { id: 15, dim: 4, text: "¿Cada sesión termina con compromisos con responsable y fecha, y se revisan en la siguiente?", options: ["No", "Se anotan y se pierden", "Se anotan y se revisan a veces", "Se revisan siempre", "Se revisan y se escalan si vencen dos veces"] },
  { id: 16, dim: 4, text: "¿Lo que se decide en el nivel gerencial fluye al nivel directivo (sesiones en cascada)?", options: ["No", "Informalmente", "Por correo", "En la sesión del siguiente nivel", "Cascada formal y documentada"] },
  { id: 17, dim: 5, text: "¿La evaluación del desempeño individual se basa en el cumplimiento de metas acordadas?", options: ["Por percepción", "Mayormente percepción", "Mezcla", "Mayormente metas", "Cumplimiento ponderado de metas aprobadas"] },
  { id: 18, dim: 5, text: "¿El bono o compensación variable se calcula con el cumplimiento ponderado del scorecard?", options: ["No hay variable", "Variable discrecional", "Variable con criterios poco claros", "Variable ligada a metas de área", "Variable ligada al scorecard individual"] },
  { id: 19, dim: 5, text: "¿Los colaboradores pueden ver en cualquier momento cómo van contra sus metas?", options: ["No", "Al final del año", "Trimestralmente", "Mensualmente", "En tiempo real"] },
  { id: 20, dim: 5, text: "¿Se reconoce de forma visible a quien alcanza sobresaliente o cierra sus compromisos?", options: ["No", "Informalmente", "Ocasionalmente", "De forma regular", "Sistemáticamente"] },
];

export type Answers = Record<number, number>; // questionId → 0..4

export interface Level { min: number; name: string; reading: string; recommendation: string; color: string }
export const LEVELS: Level[] = [
  { min: 75, name: "Alineada y en ritmo", reading: "Tienes un sistema vivo. La oportunidad está en automatizar y escalar sin perder el ritmo.", recommendation: "Plataforma METIS para quitar el trabajo manual; Estratega Fraccional si estás creciendo muy rápido.", color: "#0FA36F" },
  { min: 55, name: "Alineada con esfuerzo", reading: "Se mide, pero con mucho trabajo manual y sin consecuencias claras. La estrategia depende de personas, no de un sistema.", recommendation: "Plataforma METIS + Growth Sprints de 90 días para instalar el ritmo de gestión.", color: "#14C98E" },
  { min: 30, name: "En construcción", reading: "Hay objetivos y algunos KPIs, pero sin cascada, dueños del dato ni ritmo. Cada área mide por su lado.", recommendation: "Diagnóstico de Alineación + Arquitectura Estratégica para diseñar la cascada completa.", color: "#F5A524" },
  { min: 0, name: "Desconectada", reading: "La estrategia vive en la cabeza de la dirección. La operación corre sola y el desempeño se evalúa por percepción.", recommendation: "Diagnóstico de Alineación + Arquitectura Estratégica (paquete Despegue o Aceleración).", color: "#F2545B" },
];

export const GAP_ADVICE: Record<number, [string, string]> = {
  1: ["Define de 3 a 6 objetivos corporativos medibles a 3–5 años y compártelos con todos los gerentes.", "Traduce cada objetivo en 2–4 líneas de acción estratégicas con un dueño por línea."],
  2: ["Asigna a cada gerente un scorecard corto (5–8 elementos) con ponderación que sume 100%.", "Define tres niveles de meta (mínima, satisfactoria, sobresaliente) antes de que arranque el periodo."],
  3: ["Crea un catálogo único de KPIs con fórmula, unidad y dirección; prohíbe definiciones paralelas.", "Nombra un dueño del dato por KPI y alcance; los demás se vinculan y no vuelven a capturar."],
  4: ["Instala una sesión semanal de 45 minutos y una mensual tras el cierre, con agenda fija.", "Cierra cada sesión con compromisos con responsable y fecha, y revísalos al abrir la siguiente."],
  5: ["Liga la evaluación del desempeño al cumplimiento ponderado del scorecard aprobado.", "Conecta el bono variable a esa misma cifra: así la compensación por fin se conecta con la estrategia."],
};

export function score(a: Answers) {
  const dims = DIMENSIONS.map((d) => {
    const qs = QUESTIONS.filter((q) => q.dim === d.id);
    const sum = qs.reduce((s, q) => s + (a[q.id] ?? 0), 0);
    return { dim: d, raw: sum, pct: Math.round((sum / (qs.length * 4)) * 100) };
  });
  const total = Math.round(dims.reduce((s, d) => s + d.pct, 0) / dims.length);
  const level = LEVELS.find((l) => total >= l.min)!;
  const weakest = [...dims].sort((x, y) => x.pct - y.pct)[0];
  return { dims, total, level, weakest };
}

/** Benchmark de referencia (supuesto, hasta tener muestra real) por tamaño de empresa. */
export const BENCHMARK: Record<string, number> = { "15-60": 34, "61-300": 42, "301-1500": 51, "1500+": 58 };
