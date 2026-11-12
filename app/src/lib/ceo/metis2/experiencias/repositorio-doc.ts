/**
 * MÊTIS 2.0 · genera docs/metis2/06-repositorio-academico.md a partir de los datos del código,
 * para que la correspondencia, las fuentes y el estado del piloto no se desfasen del documento.
 */
import { ACADEMIES, skillById, skillsAt } from "../academias";
import { ATLAS, FUENTES, LOTE_N1, PACKAGE_VERSION, PAQUETE_ARCHIVOS, SOURCES_CHECKED_AT, atlasSources } from "./fuentes";
import { checkExperiencia, originCount, sharedAmounts, money } from "./motor";
import { EXPERIENCIAS } from "./index";
import type { Experiencia, Nodo } from "./tipos";

const KIND: Record<Nodo["kind"], string> = {
  mensaje: "Mensaje de un personaje", explorar: "Documentos tocables", decision: "Decisión con rutas", senalar: "Señalar sobre el documento",
  dato: "Dato nuevo", redactar: "Respuesta escrita", cierre: "Cierre con lo decidido y el concepto",
};
const ORIGEN = { fuente: "Texto del paquete", adaptado: "Descrito en el paquete, redactado al convertir", conversion: "Añadido al convertir" } as const;

const name = (id: string) => skillById(id)?.name ?? id;

function flow(x: Experiencia): string[] {
  return x.nodes.map((n) => {
    const what = n.kind === "decision" ? `«${n.text}» · ${n.options.map((o) => `${o.id} (${o.tipo === "defendible" ? "defendible" : o.tipo === "riesgosa" ? "con riesgo" : "confusión"}) → ${o.next}`).join("; ")}`
      : n.kind === "senalar" ? `${n.prompt} Solo llega aquí quien no eligió la ruta defendible. → ${n.next}`
      : n.kind === "cierre" ? "Da paso a la variante." : `→ ${n.next}`;
    return `| ${x.moments[n.moment]} | \`${n.id}\` | ${KIND[n.kind]} | ${what} | ${ORIGEN[n.origen]} |`;
  });
}

export function repositorioMarkdown(): string {
  const x = EXPERIENCIAS[0];
  const rev = checkExperiencia(x);
  const o = originCount(x);
  const uses = (f: string) => ATLAS.filter((a) => a[2].includes(f)).length;
  const n1 = skillsAt(1);
  const L: string[] = [];
  const p = (...s: string[]) => L.push(...s, "");

  p("# MÊTIS 2.0 · Repositorio Académico",
    `Paquete recibido: versión ${PACKAGE_VERSION}. Fuentes abiertas y leídas el ${SOURCES_CHECKED_AT}. Este documento se genera desde el código (\`app/src/lib/ceo/metis2/experiencias/\`); una prueba falla si se desfasa.`);

  p("## 1. Estado en una línea",
    "Una experiencia piloto está convertida y se puede recorrer completa por enlace. No registra evidencia, no cambia dominio, niveles ni perfil, y no aparece en el menú. Las otras cinco experiencias y el Executive Challenge están leídos y trazados, sin convertir, a la espera de la revisión de la piloto.");

  p("## 2. Qué se recibió",
    "Diez archivos. Se leyeron completos. No se copiaron al repositorio porque es público y el paquete trae las respuestas de las evaluaciones; se guarda su huella para saber con qué versión se trabajó.",
    "| Archivo | Huella (SHA-256, primeros 16) |", "|---|---|", ...PAQUETE_ARCHIVOS.map(([f, h]) => `| ${f} | \`${h}\` |`));

  p("## 3. Correspondencia de identificadores",
    "Los 52 identificadores editoriales del Atlas corresponden uno a uno con las 52 habilidades del catálogo: mismo nombre, mismo orden, misma academia, mismo nivel de entrada y la misma descripción de lo que se sabe hacer. La única diferencia de forma: cinco prerrequisitos del Atlas llevan entre paréntesis la academia de la habilidad a la que apuntan (EST-05, EST-06, CRE-08, CRE-09 y RIE-07); son las mismas habilidades.",
    "El identificador que se guarda es el del catálogo. El editorial queda como referencia para hablar con quien escribe el contenido.");
  for (const a of ACADEMIES) {
    L.push(`### ${a.name}`, "", "| Editorial | Catálogo | Habilidad | Nivel de entrada | Fuentes citadas en el Atlas |", "|---|---|---|---|---|");
    for (const [e, s, src] of ATLAS.filter((r) => skillById(r[1])!.academy === a.id)) L.push(`| ${e} | \`${s}\` | ${name(s)} | ${skillById(s)!.from} | ${src.join(", ")} |`);
    L.push("");
  }

  p("## 4. Revisión de las fuentes",
    "Qué se hizo: se abrió cada una de las doce direcciones y se leyó lo que la página dice. Qué no se hizo: comparar concepto por concepto cada una de las 52 habilidades con el temario de cada curso. El propio Atlas declara que el respaldo es «correspondencia temática curricular; no equivalencia de curso», y eso es lo que estas páginas permiten sostener.",
    "| Fuente | Institución y componente | Habilidades que la citan | Qué muestra la página |", "|---|---|---|---|",
    ...Object.entries(FUENTES).map(([k, f]) => `| ${k} | [${f.institution} · ${f.component}](${f.url}) | ${uses(k)} | ${f.seen} |`));
  p("### Observaciones sobre exactitud",
    "1. **Finanzas, vocabulario y estados financieros.** El Atlas cita HBS_FIN en las diez habilidades de Finanzas. Esa página describe Finance I y Finance II (finanzas corporativas, mercados, valuación), no contabilidad. Para vocabulario financiero, estado de resultados y balance, el curso de Harvard que corresponde es Financial Reporting and Control, de la unidad Accounting and Management; su página (https://www.hbs.edu/faculty/units/am/Pages/curriculum.aspx) abre y habla de «the vocabulary of financial statements». Se sugiere añadirla al registro y citarla en FIN-01 a FIN-04.",
    "2. **Riesgo.** HBS_GOV se cita en siete de las ocho habilidades de Riesgo. La página describe responsabilidades legales, éticas y económicas, y sistemas de gobierno: respalda bien ética, cumplimiento y gobierno corporativo. No menciona riesgo, incertidumbre ni crisis, así que es un respaldo débil para RIE-01, RIE-04 y RIE-07.",
    "3. **Wharton.** WH_CORE se cita en 17 habilidades (todas las de Riesgo y casi todas las de Operaciones). La página solo lista cursos por clave y nombre; no describe contenidos. Sirve para decir que el curso existe en el núcleo, no para sostener un concepto.",
    `4. **Stanford.** STAN_CORE se cita en ${uses("STAN_CORE")} de las 52 habilidades. Es una página con una descripción breve por curso. Con tanta carga en una sola página conviene, al profundizar, citar el curso concreto y no la página general.`,
    "5. **Liderazgo.** STAN_LAB respalda las nueve habilidades de Liderazgo. La página describe ejercicios y simulaciones en equipo con acompañamiento; no habla de retroalimentación de forma expresa.",
    "6. **Fuentes distintas entre archivos.** En cinco de las seis experiencias, las fuentes que cita la experiencia no son las mismas que cita el Atlas para su habilidad principal, y el manifiesto guarda una sola por experiencia. Ejemplo: EDIT-N1-002 cita STAN_CORE y WH_CORE; el Atlas, para FIN-01, cita STAN_CORE y HBS_FIN. Conviene decidir cuál manda.",
    "7. **Columnas iguales en las 52 filas.** «tipo_respaldo», «diseno_metis» y «estado» traen el mismo texto en todas las filas del Atlas; todavía no distinguen una habilidad de otra.",
    "8. **Nombre del archivo.** «FUENTES_VERIFICADAS» describe bien que las direcciones existen y son oficiales. No debe leerse como que cada habilidad está verificada contra su curso.");

  p("## 5. Trazabilidad del lote piloto",
    "Fuente académica → habilidad → experiencia → evaluación independiente. Las fuentes de la columna son las que cita la experiencia; entre paréntesis, las que cita el Atlas cuando difieren.",
    "| Experiencia | Habilidad principal | Secundarias | Fuentes | Evaluación independiente | Rúbrica | En la plataforma |", "|---|---|---|---|---|---|---|",
    ...LOTE_N1.map((l) => {
      const at = atlasSources(l.primary);
      const same = [...at].sort().join() === [...l.sources].sort().join();
      const live = EXPERIENCIAS.find((e) => e.editorialId === l.editorialId);
      return `| ${l.editorialId} «${l.title}» | \`${l.primary}\` ${name(l.primary)} | ${l.secondary.map((s) => `\`${s}\``).join(", ")} | ${l.sources.join(", ")}${same ? "" : ` (Atlas: ${at.join(", ")})`} | ${l.variant} | ${l.rubric} | ${live ? `Piloto convertida: \`${live.id}\`` : "Leída, sin convertir"} |`;
    }));
  p(`Las seis habilidades principales son 6 de las ${n1.length} de Nivel 1. Quedan ${n1.length - LOTE_N1.length} sin experiencia: ${n1.filter((s) => !LOTE_N1.some((l) => l.primary === s.id)).map((s) => `\`${s.id}\``).join(", ")}.`,
    "Executive Challenge EC-N1-001-A «La semana en que casi todo parecía urgente»: leído. Sus cuatro cálculos se revisaron a mano y cuadran. No se convirtió: el paquete pide una segunda versión equivalente antes de usarlo, y hoy solo existe la A.");

  p("## 6. Cómo entra en lo que ya está construido",
    "| Pieza | Qué había | Qué se añadió para el piloto | Qué falta antes de integrar el lote |", "|---|---|---|---|",
    "| Catálogo de 52 habilidades | Identificadores estables | Tabla de correspondencia editorial y catálogo, con prueba | Nada |",
    "| Contenido | Currículo en archivos con tipos | Contrato de experiencia: personajes, documentos, nodos, rutas, consecuencias, concepto, variante, rúbrica, fuentes, política de evidencia, estado de revisión | Cuatro tipos de interacción nuevos (ver 7) |",
    "| Revisión automática | Pruebas del currículo | Validador: cifras recalculables, opciones de largo parecido, respuesta nunca a la vista, variante sin personajes ni explicaciones de la práctica, gancho de 15 a 35 palabras, concepto de 80 a 180 | Ampliarlo con cada tipo nuevo |",
    "| Registro de evidencias y cálculo de dominio | Hechos y probados; sin conectar a pantallas | Nada: el piloto no los toca, y una prueba lo vigila | Decidir qué evidencia deja cada modo (ver 7) |",
    "| Pantalla | Pantalla de decisión por pasos | Pantalla de experiencia: documentos tocables, conversación, rutas, comprobación sobre el documento, respuesta escrita, cierre, variante con cifras por escribir | Recuperar teoría y respuestas desde Academy |",
    "| Guardar y continuar | Partida en la cuenta | El recorrido del piloto se guarda solo en el navegador | Guardarlo en la cuenta (tabla nueva) |");

  p("## 7. Ajustes técnicos necesarios",
    "1. **Tipos de interacción que piden las otras cinco experiencias.** Clasificar frases en categorías (EDIT-N1-001); señalar sobre un diagrama de flujo con capacidades (EDIT-N1-004, reutiliza «señalar»); asignar papeles en un mapa de actores (EDIT-N1-005); ordenar riesgos con su cálculo y una acción inmediata aparte (EDIT-N1-006); armar un mensaje en tres partes (EDIT-N1-003).",
    "2. **Evaluar texto escrito.** Las variantes de EDIT-N1-001, 003 y 005 piden redactar. Calificarlas exige una persona o un modelo; el estándar pide que todo funcione también sin inteligencia artificial. Hay que decidir cómo se comprueban esas tres sin perder la independencia. En la piloto, lo escrito se guarda y se compara con una referencia, sin calificarse.",
    "3. **Tres modos frente a una sola marca.** El estándar distingue aprender con apoyo, practicar sin apoyo y demostrar. El registro de evidencias solo tiene «con ayuda: sí o no». Propuesta, en línea con el documento 05: la práctica no deja evidencia que acredite; la variante es la que cuenta. Requiere el ajuste 1.12, pendiente de aprobación.",
    "4. **Evidencia parcial para habilidades secundarias.** Una evidencia admite hasta tres habilidades con un solo resultado. La rúbrica de la variante califica por criterio (en la piloto: ingreso frente a cobro, utilidad, saldo). Para dar evidencia parcial hay que registrar un resultado por criterio, cada uno con su habilidad.",
    "5. **Calificación en el servidor.** Hoy las respuestas de la variante viajan dentro de la aplicación. Para un piloto que no acredita es aceptable; antes de acreditar, la calificación debe hacerse en el servidor.",
    "6. **Una variante no alcanza para «Demostrado».** La regla actual pide tres aciertos en tres situaciones distintas. El plan de producción del paquete ya prevé, por habilidad, experiencia principal, variante y dos escenarios más: coincide.",
    "7. **Modo de prueba editorial.** Resuelto para el piloto con una ruta fuera del menú, que exige cuenta y no escribe nada en la partida. Para el lote completo conviene una lista de cuentas revisoras.",
    "8. **Dónde vive el contenido.** El estándar sugiere una carpeta `content/learning/`. Se dejó junto al resto del currículo, en archivos con tipos, para que las mismas pruebas lo cubran. Se puede mover sin cambiar el contrato.",
    "9. **Executive Challenge.** Necesita la versión B, el banco de variantes y las reglas del documento 05 aprobadas antes de construirse.");

  const [d1, d2] = x.nodes.filter((n) => n.kind === "decision");
  p("## 8. La experiencia piloto",
    `**${x.editorialId} · «${x.title}»** · \`${x.id}\` · versión ${x.version}. Habilidad principal: \`${x.skills.primary}\` ${name(x.skills.primary)}. Secundarias: ${x.skills.secondary.map((s) => `\`${s}\` ${name(s)}`).join("; ")}. Fuentes: ${x.sourceIds.join(", ")}. Entrada: \`/piloto/${x.slug}\`.`,
    "Por qué esta: usa dos documentos tocables, un concepto que se malentiende con frecuencia, una decisión con una confusión típica y una variante que se comprueba con cifras, sin opciones y sin necesidad de calificar texto.",
    "### Recorrido", "| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |", "|---|---|---|---|---|", ...flow(x));
  p(`Nueve combinaciones de rutas (${d1 && d1.kind === "decision" ? d1.options.length : 0} × ${d2 && d2.kind === "decision" ? d2.options.length : 0}). Todas pasan por el dato nuevo y por la respuesta escrita; quien no elige la ruta defendible en el diagnóstico pasa además por la comprobación sobre los documentos.`,
    "### Variante independiente",
    `«${x.variant.question}» ${x.variant.setting} Tres cifras por calcular y escribir, sin opciones: ${x.variant.tasks.map((t) => `${t.criterion} (${t.weight} puntos)`).join("; ")}. Regla provisional para pasar: ${x.variant.passAt} de 100, sin calibrar.`,
    "### De dónde viene cada pieza",
    `${o.fuente} piezas traen el texto del paquete tal cual; ${o.adaptado} están descritas en el paquete y se redactaron al convertir; ${o.conversion} se añadieron. Las cifras, el concepto, el mensaje inicial y los renglones de los documentos son los del paquete, sin cambios.`,
    "### Por confirmar en la revisión editorial", ...x.conversionNotes.map((n, i) => `${i + 1}. ${n}`));
  p("### Qué comprueban las pruebas automáticas",
    "1. Tres recorridos: quien sabe (dos rutas defendibles), quien empieza (cae en la confusión, pasa por la comprobación y termina) y 600 recorridos al azar (todos terminan; aciertan las dos decisiones cerca de 1 de cada 9).",
    "2. Elegir siempre la opción más larga no lleva por ninguna ruta defendible; elegir siempre la más corta, tampoco.",
    "3. Todas las cifras de los documentos, del cierre y de la variante se recalculan.",
    "4. En la variante: la respuesta nunca está a la vista, las preguntas no dicen cómo calcular, no aparecen personajes de la práctica, y de 2,000 intentos sin calcular pasa menos de 1 de cada 100.",
    "5. La respuesta escrita es opcional y su largo no cambia nada.",
    "6. Un recorrido guardado se retoma donde iba; un resultado alterado a mano se vuelve a calcular.",
    "7. El motor, el contenido y la pantalla no usan el registro de evidencias, el cálculo de dominio, la partida ni ningún servicio.",
    `Avisos que deja el validador: ${rev.warnings.join("; ")}.`);

  p("## 9. Observaciones editoriales del paquete",
    "1. **EDIT-N1-002, advertencia de exactitud.** Habla de un sobregiro de $10,000 utilizado y caja libre de $0. La tabla y los cálculos dan saldo final de $5,000 y faltante de $7,000. Son dos historias distintas; la piloto sigue la tabla.",
    `2. **EDIT-N1-002, variante.** Dice «con cifras distintas», pero repite ${sharedAmounts(x).map(money).join(", ")}. Quien conteste de memoria con las cifras de la práctica acierta dos de tres criterios (70 puntos) y, con la regla provisional, pasa. Se sugiere cambiar el efectivo inicial o los cobros de la variante.`,
    "3. **EDIT-N1-002, criterio «diferencias ingreso/cobro».** El paquete le da 35 % pero la pregunta de la variante («¿Ganó dinero y qué saldo le queda?») solo pide utilidad y saldo. La piloto lo comprueba pidiendo cuánto sigue sin cobrarse.",
    "4. **EDIT-N1-001, título.** «¿Nueve tareas o una estrategia?» presenta seis frases, no nueve.",
    "5. **EDIT-N1-001, línea 34.** Usa una frase que la aplicación tiene vetada en sus textos; habrá que redactarla de otra forma al convertir.",
    "6. **Estándar, tiempos mínimos.** Todavía menciona tiempos mínimos de respuesta como hipótesis del motor. Las reglas vigentes (versión 2) ya no descartan nada por rapidez.",
    "7. **Papel de quien juega.** En las seis experiencias es asesor o invitado, nunca dueño. La aplicación actual lo trata como director de una empresa. Conviene decidir cómo conviven los dos papeles.");

  p("## 10. Estado, por separado",
    "| Etapa | Qué hay |", "|---|---|",
    "| Importado | Correspondencia de 52 identificadores; registro de 12 fuentes; ficha de las 6 experiencias del lote; EDIT-N1-002 completa como contenido jugable |",
    "| Probado | EDIT-N1-002: pruebas automáticas y recorrido completo en un navegador, a tamaño de computadora (1280 × 800) y de celular (390 × 844), guiado por un programa |",
    "| Revisado por una persona | Nada. Falta la revisión de Oziel y la revisión editorial |",
    "| Publicado | Nada para usuarios. La piloto está en producción solo por enlace, marcada como revisión |",
    "| Validado con usuarios | Nada |");

  p("## 11. Lo que no se hizo",
    "No se convirtieron las otras cinco experiencias ni el Executive Challenge. No se conectó nada al registro de evidencias ni al cálculo de dominio. No se creó ninguna tabla en la base de datos. No se probó con lector de pantalla ni en un teléfono físico. No se comparó cada habilidad con el temario de cada curso. No se calibró ninguna rúbrica.");

  return L.join("\n").trimEnd() + "\n";
}
