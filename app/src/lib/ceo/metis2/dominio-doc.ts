/**
 * MÊTIS 2.0 · Documento de las reglas del cálculo de dominio (entregas 1.3 y 1.4).
 *
 * El texto sale de las mismas reglas que usa el cálculo (`RULES`), así que el documento no puede decir una cosa y
 * el producto hacer otra. Para regenerarlo:
 *   DOMINIO_DOC=1 npx vitest run src/lib/ceo/metis2/dominio.test.ts
 */
import { ACADEMIES, FORMATS, MASTERY_STAGES, SKILLS, TRAMOS } from "./academias";
import { EVIDENCE_VERSION } from "./evidencias";
import { ACADEMY_LABEL_TEXT, MASTERY_RULES_VERSION, RULES, SKILL_STATUS_TEXT } from "./dominio";

const pct = (n: number) => `${Math.round(n * 100)} %`;

export function masteryMarkdown(): string {
  const R = RULES;
  const D = R.demonstrated;
  const C = R.consistent;
  const L = R.level;
  const out: string[] = [];
  const p = (...lines: string[]) => out.push(...lines, "");

  p("# MÊTIS 2.0 · Cómo se calcula el dominio");
  p(
    `Reglas versión ${MASTERY_RULES_VERSION} · registro de evidencias versión ${EVIDENCE_VERSION}.`,
    "Este documento se genera a partir de las mismas reglas que usa el cálculo. No se edita a mano.",
  );

  p("## En una frase");
  p("Una habilidad solo cuenta como demostrada cuando hay respuestas evaluadas que lo respaldan: suficientes, variadas, sin ayuda y en la dificultad del nivel. Leer teoría, acumular puntos o completar actividades no la demuestra.");

  p("## Tres cosas que se llevan por separado");
  p(
    "1. **Nivel general de aprendizaje.** Un número: 1, 2, 3 y así sin etapa final. Sube de uno en uno y nunca baja.",
    "2. **Dominio de cada habilidad.** Cada una de las " + SKILLS.length + " habilidades tiene su propio grado, su confianza y su necesidad de repaso.",
    "3. **Progreso hacia el siguiente nivel.** Tres criterios públicos, iguales para todas las personas. No es un promedio.",
  );

  p("## Qué entra al cálculo y qué no");
  p(
    "Entra una sola cosa: las evidencias, es decir, las respuestas evaluadas de actividades.",
    "",
    "No entra nada de esto:",
    "",
    "- puntos de experiencia ni rachas;",
    "- lecciones o teoría leídas;",
    "- número de actividades completadas ni tiempo de uso;",
    "- antigüedad de la cuenta;",
    "- lo que la persona declara saber.",
  );

  p("## Qué guarda cada evidencia");
  p(
    "| Grupo de datos | Qué se guarda |",
    "|---|---|",
    "| Habilidades | La principal y hasta dos secundarias |",
    "| Dificultad | Nivel de exigencia de la actividad, de 1 a 6 |",
    "| Evidencia observable | Qué hizo la persona, en palabras, y cuánto tardó |",
    "| Calidad del razonamiento | De 0 a 1, o «sin evaluar» si la actividad no lo midió |",
    "| Transferencia | Industria o contexto del caso, y si era una prueba de transferencia |",
    "| Resultado y retroalimentación | Resultado de 0 a 1 y qué retroalimentación recibió, con su versión |",
    "| Fecha, rúbrica y confianza | Cuándo fue, con qué versión de rúbrica se calificó y qué tan confiable es la calificación |",
  );
  p("Además se guarda si hubo ayuda y si es la primera vez que la persona ve esa situación.");
  p(
    "El registro no se reescribe. Solo se agrega al final. Si una evidencia resulta inválida (por ejemplo, por una rúbrica con error), se anula con una anotación y su razón; la evidencia original se conserva.",
    "",
    `Formatos que no pueden dejar evidencia: ${FORMATS.filter((f) => !f.evidence).map((f) => f.name).join(", ")}. Formatos que sí: ${FORMATS.filter((f) => f.evidence).map((f) => f.name).join(", ")}.`,
  );

  p("## Qué es un acierto");
  p(`Resultado de ${pct(R.pass)} o más. Si la actividad evaluó el razonamiento, además el razonamiento debe llegar a ${pct(R.reasoningFloor)}: acertar la opción con un razonamiento pobre no es un acierto.`);

  p("## Respuestas que no cuentan");
  p(
    "| Caso | Regla |",
    "|---|---|",
    `| Repetir la misma situación | Solo vuelve a contar si pasaron ${R.spacingDays} días sin verla. Dos redacciones de la misma situación son la misma situación. Verla de nuevo reinicia la espera. |`,
    `| Responder sin leer | Una respuesta más rápida que el mínimo de su formato no cuenta (${FORMATS.filter((f) => f.evidence).map((f) => `${f.name}: ${R.minSeconds[f.id]} s`).join("; ")}). |`,
    `| Calificación poco confiable | Si la confianza de la calificación es menor a ${pct(R.minConfidence)}, no cuenta ni a favor ni en contra. |`,
    "| Respuesta con ayuda | Queda registrada y sirve para aprender, pero no cuenta como acierto. |",
    "| Dificultad menor a la del nivel | No cuenta para el nivel actual. Lo demostrado en una dificultad mayor sí cuenta para las menores. |",
  );
  p("Estas respuestas no se borran: quedan en el registro con la razón por la que no contaron.");

  p("## Grados de dominio de una habilidad");
  p(
    "| Grado | Nombre | Qué significa | Qué se exige |",
    "|---|---|---|---|",
    ...MASTERY_STAGES.map((s) => {
      const need: Record<number, string> = {
        0: "Nada: no hay respuestas evaluadas.",
        1: "Alguna respuesta evaluada, sin aciertos sin ayuda en la dificultad del nivel.",
        2: "Al menos un acierto sin ayuda en la dificultad del nivel.",
        3: `${D.passes} aciertos sin ayuda, en ${D.situations} situaciones distintas; en ${D.mainPasses} de ellos la habilidad debe ser la principal de la actividad; no más de ${D.recentFails} fallos en las últimas ${R.recent} respuestas. Desde el nivel ${D.reasoningFrom}, al menos un acierto con razonamiento evaluado de ${pct(D.reasoning)} o más.`,
        4: `Lo del grado 3 y además: aciertos separados por al menos ${C.spanDays} días, en ${C.contexts} contextos o industrias distintos, y no más de ${C.recentFails} fallo en las últimas ${R.recent} respuestas.`,
        5: `Lo del grado 4 y además: aciertos en ${R.transferable.contexts} contextos distintos, un acierto en una prueba de transferencia y un acierto dentro de una actividad que cruce academias.`,
      };
      return `| ${s.n} | ${s.name} | ${s.means} | ${need[s.n]} |`;
    }),
  );
  p("Los nombres de los grados son una propuesta de trabajo y pueden cambiarse sin tocar el cálculo.");

  p("## Un tropiezo no borra lo demostrado");
  p(
    `Una habilidad demostrada no baja por una respuesta fallida. Baja a «En desarrollo» solo si hay un patrón: más de ${D.recentFails} fallos en las últimas ${R.recent} respuestas sin ayuda.`,
    "Se recupera con aciertos nuevos, en cuanto las últimas respuestas vuelven a estar dentro de ese límite.",
    "Fallar un reto más difícil que el nivel actual no cuenta en contra de lo ya demostrado en el nivel.",
  );

  p("## Confianza y vigencia");
  p(
    `La confianza dice qué tan firme es la estimación. Crece con la cantidad de evidencia: llega al máximo con el equivalente a ${R.confidenceFull} respuestas sin ayuda en las que la habilidad es la principal. Una respuesta donde la habilidad es secundaria pesa la mitad; una con ayuda, la mitad.`,
    "",
    "La vigencia dice si conviene repasar. Depende de los días activos desde la última respuesta evaluada de la habilidad:",
    "",
    "| Grado | Se sugiere repaso después de | Se pide revalidar después de |",
    "|---|---|---|",
    ...MASTERY_STAGES.filter((s) => s.n > 0).map((s) => `| ${s.n} · ${s.name} | ${R.reviewDays[s.n]} días | ${2 * R.reviewDays[s.n]} días |`),
  );
  p(
    "El paso del tiempo no baja el grado ni el nivel: baja la confianza y enciende la sugerencia de repaso.",
    "Los periodos en pausa no cuentan como días: una ausencia en pausa no envejece nada.",
  );

  p("## Barras de las seis academias");
  p(
    `Cada barra muestra el avance hacia los objetivos de dominio del nivel actual en esa academia (${ACADEMIES.map((a) => a.name).join(", ")}).`,
    "Cada habilidad del nivel aporta: demostrada, 1; en desarrollo, 0.5; inicial o sin evidencia, 0. La barra es el promedio de esas aportaciones dentro de la academia. Responder sin acertar no mueve la barra.",
    "",
    `Cada academia lleva una de tres etiquetas: «${ACADEMY_LABEL_TEXT.sin_evidencia}», «${ACADEMY_LABEL_TEXT.parcial}» o «${ACADEMY_LABEL_TEXT.suficiente}».`,
  );

  p("## Barra general: paso al siguiente nivel");
  p(
    "Para pasar de nivel se deben cumplir los tres criterios:",
    "",
    `1. **Cobertura mínima.** En cada una de las seis academias, al menos ${pct(L.academyShare)} de sus habilidades del nivel demostradas. Una academia muy avanzada no compensa a otra rezagada.`,
    "2. **Evidencia suficiente.** Todas las habilidades del nivel con al menos un acierto sin ayuda en la dificultad del nivel.",
    `3. **Reto integrador.** Un reto integrador del nivel, que cruce al menos ${L.integratorAcademies} academias, resuelto sin ayuda.`,
    "",
    `La barra general combina el avance de los tres criterios (cobertura ${pct(L.weights.cobertura)}, evidencia ${pct(L.weights.evidencia)}, reto integrador ${pct(L.weights.integrador)}) y solo se llena cuando los tres se cumplen. Junto a la barra se muestra qué falta, en palabras.`,
  );
  p(
    "| Nivel | Dificultad que se exige | Habilidades del nivel |",
    "|---|---|---|",
    ...TRAMOS.map((t) => `| ${t.n}${t.n === 6 ? " en adelante" : ""} | ${t.name} | ${SKILLS.filter((s) => s.from <= t.n).length} |`),
  );
  p("Del nivel 7 en adelante la dificultad es la del tramo 6 y solo cuenta evidencia nueva, obtenida después de llegar al nivel: no se sube de nivel con lo ya demostrado.");

  p("## Tres estados para el perfil");
  p(
    `- **${SKILL_STATUS_TEXT.respaldado}.** La habilidad está demostrada (grado 3 o más) en algún nivel.`,
    `- **${SKILL_STATUS_TEXT.en_desarrollo}.** Hay respuestas evaluadas, pero no alcanzan.`,
    `- **${SKILL_STATUS_TEXT.declarado}.** La persona dice tenerla y no hay evaluaciones que la respalden.`,
    "",
    "Lo declarado nunca sube el dominio ni el nivel.",
  );

  p("## Límites de esta versión");
  p(
    "- Los números de estas reglas son un punto de partida razonado. Deben ajustarse con datos reales de uso, y cada ajuste cambia la versión de las reglas.",
    "- Este cálculo está construido y probado por separado. En esta entrega no está conectado a las pantallas ni a la base de datos: Hoy, Perfil y Academy siguen mostrando el cálculo anterior hasta las entregas 1.5 y 3.3.",
    "- La calidad del razonamiento depende de las rúbricas de cada actividad, que se revisan en la Fase 2.",
  );

  return out.join("\n").replace(/\n+$/, "\n");
}
