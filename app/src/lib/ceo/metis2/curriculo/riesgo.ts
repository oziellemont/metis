import type { ActivityExample, SkillPlan } from "./tipos";

export const PLAN_RIESGO: SkillPlan[] = [
  {
    skill: "rie.fundamentos",
    basics: {
      terms: ["riesgo", "probabilidad", "impacto", "exposición", "mitigar", "transferir", "aceptar"],
      documents: ["matriz de riesgos", "póliza de seguro"],
      indicators: ["pérdida esperada"],
    },
    steps: {
      1: "Reconoce un riesgo, su probabilidad y su impacto, y lo ubica en una matriz.",
      2: "Ordena los riesgos de un caso por importancia y propone qué hacer con los tres primeros.",
      3: "Analiza cuánto conviene gastar en reducir un riesgo comparando costo y pérdida esperada.",
      4: "Pesa riesgos financieros, operativos y de reputación en una misma decisión.",
      5: "Identifica los riesgos principales de un negocio que no conoce.",
      6: "Define cuánto riesgo está dispuesta a tomar la empresa y lo sostiene ante el consejo.",
    },
  },
  {
    skill: "rie.etica",
    basics: {
      terms: ["dilema ético", "conflicto de interés", "soborno", "transparencia", "línea roja", "código de ética"],
      documents: ["código de ética", "canal de denuncias"],
    },
    steps: {
      1: "Reconoce un conflicto de interés y distingue lo ilegal de lo indebido.",
      2: "Aplica el código de ética a un caso concreto y dice qué procede.",
      3: "Analiza un dilema en el que dos valores chocan y explica a quién afecta cada opción.",
      4: "Decide cuando lo correcto cuesta dinero, un cliente o una persona valiosa.",
      5: "Resuelve un dilema en un país o una industria con costumbres distintas sin mover sus líneas.",
      6: "Actúa ante una falta grave de alguien poderoso dentro de la empresa.",
    },
  },
  {
    skill: "rie.cumplimiento",
    basics: {
      terms: ["cumplimiento", "control interno", "auditoría", "segregación de funciones", "sanción", "obligación fiscal y laboral"],
      documents: ["informe de auditoría", "política interna"],
      indicators: ["hallazgos abiertos de auditoría"],
    },
    steps: {
      1: "Reconoce para qué sirve un control y qué puede pasar si falta.",
      2: "Identifica en un proceso dónde hace falta un control sencillo.",
      3: "Analiza un hallazgo de auditoría y separa la falla de la persona de la falla del sistema.",
      4: "Diseña controles que protejan sin frenar la venta ni la operación.",
      5: "Identifica las obligaciones clave de una industria regulada que no conoce.",
      6: "Responde a una investigación de la autoridad cuidando a la empresa, a las personas y la verdad.",
    },
  },
  {
    skill: "rie.incertidumbre",
    steps: {
      2: "Distingue lo que sabe, lo que supone y lo que ignora en un caso.",
      3: "Detecta un sesgo en un razonamiento, como aferrarse a lo ya invertido, y lo corrige.",
      4: "Diseña una decisión por etapas que permita aprender antes de comprometer todo.",
      5: "Decide en un terreno donde su experiencia previa puede engañarle.",
      6: "Decide con el reloj en contra y sin poder conseguir más información.",
    },
  },
  {
    skill: "rie.entorno",
    steps: {
      2: "Explica cómo le pega a un negocio un alza de tasas, de inflación o del tipo de cambio.",
      3: "Analiza la exposición de una empresa a un cambio de regulación o de política comercial.",
      4: "Ajusta precios, compras y financiamiento ante un cambio fuerte del entorno.",
      5: "Lee el entorno de otro país a partir de datos públicos y ajusta sus supuestos.",
      6: "Dirige la empresa a través de un choque externo, como un arancel, una devaluación o un desastre natural.",
    },
  },
  {
    skill: "rie.stakeholders",
    steps: {
      2: "Hace la lista de quién gana, quién pierde y quién puede frenar una decisión.",
      3: "Analiza los intereses de cada parte y anticipa su reacción.",
      4: "Equilibra a accionistas, empleados, clientes y comunidad en una decisión con costo.",
      5: "Mapea a las partes interesadas en un contexto nuevo, como una comunidad o un regulador.",
      6: "Conduce una decisión en la que una parte con poder saldrá perdiendo.",
    },
  },
  {
    skill: "rie.crisis",
    steps: {
      3: "Ordena las primeras horas de una crisis: hechos confirmados, responsables y prioridades.",
      4: "Coordina operación, comunicación, legal y finanzas durante una crisis.",
      5: "Maneja una crisis de un tipo que nunca vivió, como una falla digital o un problema sanitario.",
      6: "Dirige crisis encadenadas, cuando la respuesta a la primera provoca la segunda.",
    },
  },
  {
    skill: "rie.gobierno",
    steps: {
      3: "Distingue qué decide el consejo, qué decide la dirección y qué decide el accionista.",
      4: "Prepara un asunto para el consejo: qué se pide, con qué información y con qué alternativas.",
      5: "Entiende el gobierno de una empresa familiar, de una pública o de una con fondo inversionista.",
      6: "Maneja un desacuerdo de fondo con el consejo o entre accionistas.",
    },
  },
];

export const EJEMPLOS_RIESGO: ActivityExample[] = [
  {
    id: "ej.rie.1", academy: "riesgo", level: 1, format: "ejercicio", skills: ["rie.fundamentos"],
    title: "Ordenar los riesgos de la bodega",
    situation: "Lucía administra una bodega de abarrotes. Escribió ocho cosas que le preocupan: desde un robo hormiga hasta un incendio o que renuncie el montacarguista.",
    ask: "Ubica cada riesgo en una matriz de probabilidad e impacto y di cuáles dos atenderías primero.",
    evidence: "La ubicación es razonable y la elección de los dos primeros corresponde con la matriz.",
    contexts: ["bodega de abarrotes"],
  },
  {
    id: "ej.rie.2", academy: "riesgo", level: 2, format: "aplicado", skills: ["rie.etica", "rie.cumplimiento"],
    title: "El regalo del proveedor",
    situation: "Eres jefe de compras en un hospital privado. Un proveedor de insumos, que participa en la licitación del mes, te manda una invitación a un fin de semana en la playa «sin compromiso». Tienes el código de ética de la empresa.",
    ask: "Di qué haces con la invitación, a quién avisas y qué pasa con la licitación.",
    evidence: "Aplica el código al caso, identifica el conflicto de interés y actúa de forma verificable.",
    contexts: ["hospital privado"],
  },
  {
    id: "ej.rie.3", academy: "riesgo", level: 3, format: "aplicado", skills: ["rie.incertidumbre", "fin.inversion"],
    title: "Lo que ya se gastó",
    situation: "Una empresa de software lleva catorce meses y una suma considerable invertidos en un sistema nuevo que sigue sin funcionar. El director del proyecto pide seis meses más: «Sería un desperdicio tirar todo lo invertido».",
    ask: "Analiza el argumento, señala el sesgo y di qué información necesitas para decidir si se continúa.",
    evidence: "Reconoce el sesgo de lo ya invertido y plantea la decisión con costos y beneficios futuros.",
    contexts: ["desarrollo de software"],
  },
  {
    id: "ej.rie.4", academy: "riesgo", level: 4, format: "encadenado", skills: ["rie.crisis", "lid.comunicacion", "ope.calidad"],
    title: "El lote contaminado",
    situation: "Una empresa de alimentos recibe tres reportes de clientes enfermos tras consumir un mismo producto. Aún no hay confirmación del laboratorio. La gerente de calidad pide retirar el lote; el director comercial pide esperar el resultado.",
    ask: "A lo largo de tres situaciones, decide sobre el retiro, coordina a las áreas y comunica a clientes y autoridad.",
    evidence: "Protege primero a las personas, coordina áreas con hechos parciales y comunica sin ocultar ni especular.",
    contexts: ["alimentos procesados"],
  },
  {
    id: "ej.rie.5", academy: "riesgo", level: 5, format: "repaso", skills: ["rie.crisis"],
    title: "Otra crisis, otro tipo de daño",
    situation: "Ordenaste las primeras horas de un accidente en una planta. Ahora una financiera descubre que se filtraron datos personales de cuarenta mil clientes y un periodista ya pidió una postura.",
    ask: "Ordena las primeras horas y explica qué se mantiene y qué cambia frente a una crisis física.",
    evidence: "Usa la misma secuencia de prioridades y reconoce obligaciones propias de una fuga de datos.",
    contexts: ["manufactura", "servicios financieros"],
  },
  {
    id: "ej.rie.6", academy: "riesgo", level: 6, format: "integrador", skills: ["rie.gobierno", "rie.entorno", "fin.flujo", "est.escenarios"],
    title: "El arancel y el consejo",
    situation: "Un gobierno anuncia un arancel que encarece 25 % el principal insumo de una empresa exportadora de autopartes. Nadie sabe si durará. El consejo sesiona en cuatro días y espera una postura; el mayor cliente ya pidió que le sostengan el precio.",
    ask: "Prepara la postura para el consejo: escenarios, decisiones inmediatas, lo que se pospone y lo que se le dirá al cliente.",
    evidence: "Separa hechos de supuestos, protege la caja, da al consejo alternativas reales y define qué señal cambiaría la decisión.",
    contexts: ["autopartes"],
  },
];
