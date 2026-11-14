/**
 * MÊTIS 2.0 · genera docs/metis2/06-repositorio-academico.md a partir de los datos del código,
 * para que la correspondencia, las fuentes y el estado de cada experiencia no se desfasen del documento.
 */
import { ACADEMIES, academyById, skillById, skillsAt } from "../academias";
import { ALIAS_FUENTES, ALIAS_LOTE_04, ATLAS, FUENTES, LOTES, PAQUETE_MAESTRO, SOURCES_CHECKED_AT, atlasSources, loteOf } from "./fuentes";
import { checkExperiencia, correctOf, originCount, sharedAmounts, money } from "./motor";
import { EXPERIENCIAS } from "./index";
import type { Experiencia, Nodo, Tarea } from "./tipos";

const KIND: Record<Nodo["kind"], string> = {
  mensaje: "Mensaje de un personaje", explorar: "Documentos tocables", decision: "Decisión con rutas", senalar: "Señalar sobre el documento",
  clasificar: "Clasificar tarjetas en grupos", ordenar: "Ordenar una secuencia", calcular: "Calcular con apoyo",
  dato: "Dato nuevo", redactar: "Respuesta escrita", cierre: "Cierre con lo decidido y el concepto",
};
const TASK: Record<Tarea["kind"], string> = { cifra: "cifra por calcular y escribir", clasificar: "clasificar tarjetas", ordenar: "ordenar una secuencia", senalar: "señalar renglones", texto: "respuesta escrita" };
const ORIGEN = { fuente: "Texto del paquete", adaptado: "Descrito en el paquete, redactado al convertir", conversion: "Añadido al convertir" } as const;
const TIPO = { defendible: "defendible", riesgosa: "con riesgo", concepto_erroneo: "confusión" } as const;

const name = (id: string) => skillById(id)?.name ?? id;
const cell = (t: string) => t.replace(/\|/g, "/");

function flow(x: Experiencia): string[] {
  return x.nodes.map((n) => {
    const what = n.kind === "decision" ? `«${n.text}» · ${n.options.map((o) => `${o.id} (${TIPO[o.tipo]}) → ${o.next}`).join("; ")}`
      : n.kind === "senalar" ? `${n.prompt} ${correctOf(n).length} ${correctOf(n).length === 1 ? "renglón" : "renglones"} por encontrar; cada error trae su explicación. → ${n.next}`
      : n.kind === "clasificar" ? `${n.prompt} ${n.items.length} tarjetas en ${n.groups.length} grupos (${n.groups.map((g) => g.label).join(", ")}). → ${n.next}`
      : n.kind === "ordenar" ? `${n.prompt} ${n.cards.length} tarjetas; ${n.strict ? "se revisa el orden" : "se acepta cualquier orden y se muestra uno de referencia"}. → ${n.next}`
      : n.kind === "calcular" ? `${n.prompt} ${n.fields.length} cifras, con pista por cifra y calculadora. → ${n.next}`
      : n.kind === "redactar" ? `${n.fields ? `${n.fields.length} campos cortos` : "Un texto libre"}; no se califica, se compara con una referencia. → ${n.next}`
      : n.kind === "dato" ? `${n.title}. → ${n.next}`
      : n.kind === "cierre" ? "Da paso a la variante." : `→ ${n.next}`;
    return `| ${x.moments[n.moment]} | \`${n.id}\` | ${KIND[n.kind]} | ${cell(what)} | ${ORIGEN[n.origen]} |`;
  });
}

export function repositorioMarkdown(): string {
  const uses = (f: string) => ATLAS.filter((a) => a[2].includes(f)).length;
  const cited = (f: string) => LOTES.flatMap((l) => l.items).filter((i) => i.sources.includes(f)).length;
  const n1 = skillsAt(1);
  const items = LOTES.flatMap((l) => l.items);
  const live = (editorialId: string) => EXPERIENCIAS.find((e) => e.editorialId === editorialId);
  const pilot = EXPERIENCIAS.find((e) => e.editorialId === "EDIT-N1-002")!;
  const L: string[] = [];
  const p = (...s: string[]) => L.push(...s, "");
  const done = (lote: string) => LOTES.find((l) => l.id === lote)!.items.filter((i) => live(i.editorialId)).length;

  p("# MÊTIS 2.0 · Repositorio Académico",
    `Paquetes recibidos: ${LOTES.map((l) => `${l.name} (versión ${l.packageVersion})`).join(", ")}. Fuentes abiertas y leídas el ${SOURCES_CHECKED_AT}. Este documento se genera desde el código (\`app/src/lib/ceo/metis2/experiencias/\`); una prueba falla si se desfasa.`);

  p("## 1. Estado en una línea",
    `${EXPERIENCIAS.length} de las ${items.length} experiencias recibidas están convertidas y se pueden recorrer completas por enlace (\`/piloto\`): ${LOTES.map((l) => `${done(l.id)} de ${l.items.length} del ${l.name.toLowerCase()}`).join(", ")}. Ninguna registra evidencia, cambia dominio, niveles ni perfil, y ninguna aparece en el menú. Ninguna ha sido revisada por una persona. El Executive Challenge EC-N1-002-A está convertido como demostración (\`/piloto/reto/el-viernes-que-nadie-queria-prometer\`), sin regla de aprobación y sin umbrales; EC-N1-001-A sigue leído, sin convertir y sin cambios.`);

  p("## 2. Qué se recibió",
    "Los archivos se leyeron completos. No se copiaron al repositorio porque es público y los paquetes traen las respuestas de las evaluaciones; se guarda su huella para saber con qué versión se trabajó.");
  p(`**Paquete maestro (${PAQUETE_MAESTRO.receivedAt}).** Un solo ZIP con los cuatro paquetes originales y cuatro archivos de control (huella del ZIP: \`${PAQUETE_MAESTRO.zip}\`). Se comprobó cada archivo contra \`SHA256SUMS.txt\` y contra \`MANIFIESTO_REENVIO.json\` (huella y tamaño): **${LOTES.reduce((s, l) => s + l.files.length, 0)} de ${PAQUETE_MAESTRO.sources}** archivos originales coinciden (${LOTES.map((l) => l.files.length).join(" + ")}). Antes solo se habían recibido ${PAQUETE_MAESTRO.previously}: faltaban cinco del lote 02 y siete del lote 04. Los ${PAQUETE_MAESTRO.previously} que ya estaban anotados tienen la misma huella que antes: lo que falló fue la recepción, no los archivos.`,
    "Archivos de control del paquete maestro:", "| Archivo | Huella (SHA-256, primeros 16) |", "|---|---|", ...PAQUETE_MAESTRO.control.map(([f, h]) => `| ${f} | \`${h}\` |`));
  for (const l of LOTES) p(`### ${l.name} · versión ${l.packageVersion} · ${l.files.length} archivos`, "| Archivo | Huella (SHA-256, primeros 16) |", "|---|---|", ...l.files.map(([f, h]) => `| ${f} | \`${h}\` |`));
  p("Diferencias entre paquetes que conviene conocer:",
    "1. Los manifiestos de los lotes 02 y 04 guardan identificadores, academia, habilidad y estado, pero no fuentes por experiencia. Las fuentes de esos lotes salen de su archivo de trazabilidad.",
    "2. El lote 02 no trae archivo de rúbricas; los pesos están en el texto de cada experiencia. El lote 04 sí lo trae (`RUBRICAS_EDITORIALES_LOTE04_Y_CHALLENGE.json`) y coincide con lo construido: los seis repartos de peso y, en el Executive Challenge, las trece escenas con sus habilidades y sus puntos (96 en total).",
    "3. `QA_Y_ERRATAS.md` del lote 02 confirma la errata de EDIT-N1-002 (el saldo final es de $5,000 y no hay sobregiro). La experiencia convertida ya seguía la tabla.",
    `4. Cada lote nombra las fuentes a su manera. Lote 03: ${Object.entries(ALIAS_FUENTES).map(([a, b]) => `${a} es ${b}`).join("; ")}. Lote 04: ${Object.entries(ALIAS_LOTE_04).map(([a, b]) => `${a} es ${b}`).join("; ")}.`,
    "5. El lote 04 no trae una experiencia por academia: completa las 24 habilidades con dos de Finanzas y ninguna de Riesgo, porque Riesgo ya tenía sus tres habilidades cubiertas.",
    "6. Dos lotes usan el mismo nombre para archivos distintos (`README_PARA_SN.md` y `TRAZABILIDAD_ACADEMICA.md` en los lotes 02 y 03; `README_PARA_SUPERNINJA.md` en los lotes 01 y 04). Por eso cada huella se guarda con su lote.");

  p("## 3. Correspondencia de identificadores",
    "Los 52 identificadores editoriales del Atlas corresponden uno a uno con las 52 habilidades del catálogo: mismo nombre, mismo orden, misma academia, mismo nivel de entrada y la misma descripción de lo que se sabe hacer. La única diferencia de forma: cinco prerrequisitos del Atlas llevan entre paréntesis la academia de la habilidad a la que apuntan (EST-05, EST-06, CRE-08, CRE-09 y RIE-07); son las mismas habilidades.",
    "El identificador que se guarda es el del catálogo. El editorial queda como referencia para hablar con quien escribe el contenido.");
  for (const a of ACADEMIES) {
    L.push(`### ${a.name}`, "", "| Editorial | Catálogo | Habilidad | Nivel de entrada | Fuentes citadas en el Atlas |", "|---|---|---|---|---|");
    for (const [e, s, src] of ATLAS.filter((r) => skillById(r[1])!.academy === a.id)) L.push(`| ${e} | \`${s}\` | ${name(s)} | ${skillById(s)!.from} | ${src.join(", ")} |`);
    L.push("");
  }

  p("## 4. Revisión de las fuentes",
    `Qué se hizo: se abrió cada una de las ${Object.keys(FUENTES).length} direcciones y se leyó lo que la página dice. Qué no se hizo: comparar concepto por concepto cada una de las 52 habilidades con el temario de cada curso. El propio Atlas declara que el respaldo es «correspondencia temática curricular; no equivalencia de curso», y eso es lo que estas páginas permiten sostener.`,
    "| Fuente | Institución y componente | Habilidades del Atlas que la citan | Experiencias que la citan | Qué muestra la página |", "|---|---|---|---|---|",
    ...Object.entries(FUENTES).map(([k, f]) => `| ${k} | [${f.institution} · ${f.component}](${f.url}) | ${uses(k)} | ${cited(k)} | ${f.seen} |`));
  p("### Observaciones sobre exactitud",
    "1. **Finanzas, vocabulario y estados financieros.** El Atlas cita HBS_FIN en las diez habilidades de Finanzas. Esa página describe Finance I y Finance II (finanzas corporativas, mercados, valuación), no contabilidad. Para vocabulario financiero, estado de resultados y balance, el curso de Harvard que corresponde es Financial Reporting and Control, de la unidad Accounting and Management; su página (https://www.hbs.edu/faculty/units/am/Pages/curriculum.aspx) abre y habla de «the vocabulary of financial statements». Ya está en el registro como HBS_AM y el lote 02 la cita en EDIT-N1-008; el Atlas sigue citando HBS_FIN en FIN-01 a FIN-04. La trazabilidad del lote 04 ya no usa HBS_FIN para FIN-04 ni FIN-05: cita Financial Reporting & Control a través de la página general del plan obligatorio (HBS_CORE), que solo nombra el curso. Para sostener el concepto, la página que lo describe es HBS_AM. La auditoría del paquete maestro pide lo mismo; falta corregir el Atlas.",
    "2. **Riesgo.** HBS_GOV se cita en siete de las ocho habilidades de Riesgo. La página describe responsabilidades legales, éticas y económicas, y sistemas de gobierno: respalda bien ética, cumplimiento y gobierno corporativo. No menciona riesgo, incertidumbre ni crisis, así que es un respaldo débil para RIE-01, RIE-04 y RIE-07.",
    "3. **Wharton.** WH_CORE se cita en 17 habilidades (todas las de Riesgo y casi todas las de Operaciones). La página solo lista cursos por clave y nombre; no describe contenidos. Sirve para decir que el curso existe en el núcleo, no para sostener un concepto.",
    `4. **Stanford.** STAN_CORE se cita en ${uses("STAN_CORE")} de las 52 habilidades. Es una página con una descripción breve por curso. Con tanta carga en una sola página conviene, al profundizar, citar el curso concreto y no la página general.`,
    "5. **Liderazgo.** STAN_LAB respalda las nueve habilidades de Liderazgo. La página describe ejercicios y simulaciones en equipo con acompañamiento; no habla de retroalimentación de forma expresa.",
    "6. **Fuentes distintas entre archivos.** En cinco de las seis experiencias del lote 01, las fuentes que cita la experiencia no son las mismas que cita el Atlas para su habilidad principal, y el manifiesto guarda una sola por experiencia. Ejemplo: EDIT-N1-002 cita STAN_CORE y WH_CORE; el Atlas, para FIN-01, cita STAN_CORE y HBS_FIN. Conviene decidir cuál manda.",
    "7. **Columnas iguales en las 52 filas.** «tipo_respaldo», «diseno_metis» y «estado» traen el mismo texto en todas las filas del Atlas; todavía no distinguen una habilidad de otra.",
    "8. **Nombre del archivo.** «FUENTES_VERIFICADAS» describe bien que las direcciones existen y son oficiales. No debe leerse como que cada habilidad está verificada contra su curso.",
    "9. **Lote 04, página general.** Cinco de las seis experiencias del lote 04 citan HBS_CORE, que lista los cursos del primer año sin describirlos. Sirve para decir que la disciplina está en el plan obligatorio, que es lo único que la propia trazabilidad del lote afirma.");

  p("## 5. Trazabilidad por lote",
    "Fuente académica → habilidad → experiencia → evaluación independiente. Las fuentes de la columna son las que cita la experiencia; entre paréntesis, las que cita el Atlas cuando difieren.");
  for (const l of LOTES) {
    p(`### ${l.name} · versión ${l.packageVersion}`,
      "| Experiencia | Habilidad principal | Secundarias | Fuentes | Evaluación independiente | Rúbrica | En la plataforma |", "|---|---|---|---|---|---|---|",
      ...l.items.map((i) => {
        const at = atlasSources(i.primary);
        const same = [...at].sort().join() === [...i.sources].sort().join();
        const x = live(i.editorialId);
        return `| ${i.editorialId} «${i.title}» | \`${i.primary}\` ${name(i.primary)} | ${i.secondary.map((s) => `\`${s}\``).join(", ")} | ${i.sources.join(", ")}${same ? "" : ` (Atlas: ${at.join(", ")})`} | ${i.variant} | ${i.rubric} | ${x ? `Convertida: \`${x.id}\`` : "Leída, sin convertir"} |`;
      }));
  }
  const covered = n1.filter((s) => items.some((i) => i.primary === s.id));
  const missing = n1.filter((s) => !covered.includes(s));
  const twice = covered.filter((s) => items.filter((i) => i.primary === s.id).length > 1);
  p(`Las ${items.length} experiencias cubren ${covered.length} de las ${n1.length} habilidades de Nivel 1 como habilidad principal${twice.length ? ` (${twice.map((s) => `\`${s.id}\``).join(", ")} aparece más de una vez)` : ""}. ${missing.length ? `Quedan ${missing.length} sin experiencia: ${missing.map((s) => `\`${s.id}\``).join(", ")}.` : "No queda ninguna sin experiencia."}`,
    "Executive Challenge EC-N1-001-A «La semana en que casi todo parecía urgente» (paquete 1.0): leído. Sus cuatro cálculos se revisaron a mano y cuadran. No se convirtió y no se modificó: el paquete 1.3 lo deja como prototipo narrativo, no como variante para acreditar.",
    "Executive Challenge EC-N1-002-A «El viernes que nadie quería prometer» (paquete 1.3): convertido como demostración, en `app/src/lib/ceo/metis2/reto/`. Tres actos, trece escenas con habilidades y una síntesis que no suma; cada una de las 24 habilidades de Nivel 1 se observa en una sola escena y vale de 0 a 4 (96 en total). Las decisiones dejan marcas que cambian lo que dicen los personajes después. Tiene salvaguardas de inocuidad, ética y control bancario que no se compensan con otros puntos; cada una queda como cumplida, corregida después de recibir información nueva o decisión crítica sin corregir. La síntesis acepta por igual las dos secuencias defendibles si su fundamento se sostiene. No tiene regla de aprobación ni guarda umbrales: el informe nunca da veredicto. La variante B que pide el paquete (mantenimiento preventivo de edificios) no está escrita.");

  p("## 6. Cómo se convierte cada pieza del documento editorial",
    "| En el documento editorial | En la plataforma | Qué se conserva y qué cambia |", "|---|---|---|",
    "| Gancho (mensaje, correo, audio, chat) | Nodo «mensaje» con personaje y canal | El texto es el del paquete. Se añade una línea que dice qué papel tiene quien juega |",
    "| Artefactos y documentos | Documentos tocables: renglones con importe, con columnas o de solo texto | Los datos son los del paquete. Las explicaciones al tocar son nuevas y solo aparecen en la práctica |",
    "| Clasificación activa, mapas, arrastrar tarjetas | Nodo «clasificar»: cada tarjeta se asigna tocando su grupo | No se arrastra: se toca, para que funcione igual en celular y con teclado. Cada tarjeta mal puesta trae su explicación |",
    "| Ordenar un flujo | Nodo «ordenar»: flechas para subir y bajar cada tarjeta | Igual: sin arrastrar. La pista señala qué paso necesita a cuál |",
    "| Calcular o comparar cifras | Nodo «calcular»: se escribe cada cifra, con pista y calculadora | No hay opciones. Tras dos revisiones sin acertar se puede ver la solución |",
    "| Encontrar algo en un documento | Nodo «señalar»: se toca el renglón | Uno o varios renglones. Cada error trae su explicación |",
    "| Decisiones y elecciones | Nodo «decisión» con rutas defendibles, con riesgo o con una confusión | Cada ruta tiene consecuencia y retroalimentación propias. Donde el paquete dice que varias son defendibles, lo son |",
    "| Nueva condición o evidencia | Nodo «dato» | Texto del paquete. Cuando el paquete pide reaccionar al dato, se añadió una decisión y queda anotada |",
    "| Redactar un mensaje o una frase | Nodo «redactar», con un texto o varios campos cortos | No se califica ni cuenta el largo: se compara con una referencia y queda guardado |",
    "| Microteoría | Concepto, disponible todo el tiempo en la práctica | Texto del paquete, sin cambios |",
    "| Retroalimentación por ruta | Retroalimentación de cada opción y de cada tarjeta | Redactada a partir de lo que el paquete indica para cada ruta |",
    "| Evaluación inédita o demostración independiente | Variante: otra situación, sin explicaciones, sin concepto y sin los documentos de la práctica | Ver la sección 7 |",
    "| Rúbrica | Peso de cada tarea de la variante | Los pesos son los del paquete y suman 100 |",
    "| Notas de QA | Pruebas automáticas | Cada identidad numérica del paquete es una prueba |");

  p("## 7. Decisiones de conversión que cambian algo respecto del documento editorial",
    "1. **Lo escrito no se califica solo.** Varias rúbricas dan puntos a respuestas redactadas. La plataforma no usa inteligencia artificial para calificar ni acredita con estas experiencias. Lo que se puede comprobar sin una persona (clasificar, ordenar, señalar, cifras) se comprueba; lo escrito se guarda, se compara con una respuesta de referencia y su peso queda «en espera de revisión de una persona». Cuando hay texto pendiente no se da veredicto de aprobado o no aprobado.",
    "2. **Nada se convirtió en opción múltiple.** Donde el paquete pide identificar, clasificar u ordenar, la variante lo pide con tarjetas, secuencias o renglones, no con incisos.",
    "3. **Tocar en vez de arrastrar.** Todas las actividades se resuelven tocando botones de al menos 36 píxeles. Nada depende solo del color: cada estado lleva texto.",
    "4. **Piezas añadidas.** Para que cada experiencia tenga al menos dos decisiones conectadas y para que la variante tenga algo comprobable, se añadieron decisiones, tarjetas o datos. Cada uno está marcado como «añadido al convertir» y listado en la experiencia, en la sección 9.",
    "5. **Calculadora.** Donde el paquete permite calculadora en la evaluación, la variante ofrece una calculadora aritmética que solo opera; no explica conceptos.",
    "6. **Regla para pasar.** No hay. La regla provisional de 70 de 100 se retiró: el puntaje se muestra sin veredicto hasta que exista una regla calibrada con datos y revisada por el equipo académico.",
    "7. **La variante se califica en el servidor.** La pantalla recibe la práctica y las tareas de la variante sin respuestas, sin criterios de aceptación y sin referencias. Las respuestas se mandan al servidor, que califica y devuelve el resultado con un sello cifrado. El navegador no decide puntajes.");

  p("## 8. Cómo entra en lo que ya está construido",
    "| Pieza | Qué había | Qué se añadió | Qué falta antes de acreditar |", "|---|---|---|---|",
    "| Catálogo de 52 habilidades | Identificadores estables | Tabla de correspondencia editorial y catálogo, con prueba | Nada |",
    "| Contenido | Currículo en archivos con tipos | Contrato de experiencia: personajes, documentos, nodos, rutas, consecuencias, concepto, variante, rúbrica, fuentes, política de evidencia, estado de revisión | Revisión editorial de cada experiencia |",
    "| Revisión automática | Pruebas del currículo | Validador: cifras recalculables, opciones de largo parecido, respuesta nunca a la vista, variante sin personajes ni explicaciones de la práctica, gancho de 15 a 35 palabras, concepto de 80 a 180, al menos una tarea comprobable en la variante | Calibrar con datos de uso |",
    "| Registro de evidencias y cálculo de dominio | Hechos y probados; sin conectar a pantallas | Nada: las experiencias no los tocan, y una prueba lo vigila | Decidir qué evidencia deja cada modo |",
    "| Pantalla | Pantalla de decisión por pasos, con el fondo mêtis | Pantalla de experiencia: documentos tocables, conversación, rutas, clasificar, ordenar, calcular, señalar, respuesta escrita, cierre, variante y resultado; lista de experiencias | Recuperar teoría y respuestas desde Academy |",
    "| Guardar y continuar | Partida en la cuenta | El recorrido se guarda solo en el navegador | Guardarlo en la cuenta (tabla nueva) |",
    "| Calificación | En la aplicación | Igual. Para experiencias que no acreditan es aceptable | Calificar en el servidor y revisar lo escrito |");

  p("## 9. Experiencias convertidas");
  for (const x of EXPERIENCIAS) {
    const rev = checkExperiencia(x);
    const o = originCount(x);
    const lote = loteOf(x.editorialId);
    const pending = x.variant.tasks.filter((t) => t.kind === "texto").reduce((s, t) => s + t.weight, 0);
    const routes = x.nodes.flatMap((n) => (n.kind === "decision" ? [n.options.length] : []));
    p(`### ${x.editorialId} · «${x.title}»`,
      `${academyById(x.academy).name} · ${lote?.name ?? "sin lote"}, paquete ${x.packageVersion} · \`${x.id}\` · versión ${x.version}. Habilidad principal: \`${x.skills.primary}\` ${name(x.skills.primary)}. Secundarias: ${x.skills.secondary.map((s) => `\`${s}\` ${name(s)}`).join("; ")}. Fuentes: ${x.sourceIds.join(", ")}. Entrada: \`/piloto/${x.slug}\`.`,
      "| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |", "|---|---|---|---|---|", ...flow(x));
    p(`Decisiones: ${routes.length}, con ${routes.join(", ")} rutas. Todas las combinaciones llegan al cierre.`,
      `**Variante.** «${x.variant.question}» ${x.variant.setting} Tareas: ${x.variant.tasks.map((t) => `${t.criterion} (${t.weight} puntos, ${TASK[t.kind]})`).join("; ")}. Se comprueban solos ${100 - pending} de 100 puntos${pending ? `; ${pending} esperan revisión de una persona` : ""}.${x.variant.calculator ? " Ofrece calculadora." : ""}`,
      `**Origen de las piezas.** ${o.fuente} traen el texto del paquete tal cual; ${o.adaptado} están descritas en el paquete y se redactaron al convertir; ${o.conversion} se añadieron.`,
      "**Por confirmar en la revisión editorial.**", ...x.conversionNotes.map((n, i) => `${i + 1}. ${n}`));
    p(`**Avisos del validador.** ${rev.errors.length ? `Errores: ${rev.errors.join("; ")}. ` : ""}${rev.warnings.join("; ")}.`);
  }

  p("## 10. Qué comprueban las pruebas automáticas",
    "Para cada experiencia convertida:",
    "1. Cumple el contrato sin errores y coincide con la ficha de su lote: habilidades, fuentes, título y pesos de la rúbrica.",
    "2. Tres recorridos: quien sabe (rutas defendibles y actividades resueltas a la primera), quien empieza (cae en las confusiones, falla las actividades y pide ver la solución) y recorridos al azar. Todos terminan en el cierre.",
    "3. Todas las combinaciones de rutas llegan al cierre.",
    "4. Elegir siempre la opción más larga no lleva por todas las rutas defendibles.",
    "5. Las igualdades que se muestran (documentos, cálculos del cierre, pistas, variante) se recalculan, y las identidades numéricas que cada paquete lista en sus notas de QA son pruebas.",
    "6. En la variante: la respuesta nunca está a la vista, no aparecen personajes de la práctica ni explicaciones, quien responde bien obtiene todos los puntos comprobables, y responder al azar casi nunca los obtiene.",
    "7. Lo escrito es opcional, no cambia los puntos comprobables y deja su peso en espera de revisión.",
    "8. Un recorrido guardado en cualquier paso se retoma donde iba; el resultado guardado en el navegador nunca se usa: se vuelve a pedir al servidor con el sello, y sin sello válido no hay resultado; un recorrido guardado con el formato anterior se conserva.",
    "9. El motor, el contenido y las pantallas no usan el registro de evidencias, el cálculo de dominio, la partida ni ningún servicio.");

  p("## 11. Observaciones editoriales de los paquetes",
    "1. **EDIT-N1-002, advertencia de exactitud.** El lote 01 habla de un sobregiro de $10,000 utilizado y caja libre de $0. La tabla y los cálculos dan saldo final de $5,000 y faltante de $7,000. Las notas de QA del lote 03 confirman la discrepancia y piden corregir el texto antes de publicar. La experiencia convertida sigue la tabla desde el principio: muestra saldo final de $5,000 y no menciona el sobregiro.",
    `2. **EDIT-N1-002, variante.** Dice «con cifras distintas», pero repite ${sharedAmounts(pilot).map(money).join(", ")}. Quien conteste de memoria con las cifras de la práctica acierta dos de tres criterios (70 puntos) y, con la regla provisional que ya se retiró, habría pasado. Se sugiere cambiar el efectivo inicial o los cobros de la variante.`,
    "3. **EDIT-N1-002, criterio «diferencias ingreso/cobro».** El paquete le da 35 % pero la pregunta de la variante («¿Ganó dinero y qué saldo le queda?») solo pide utilidad y saldo. La experiencia lo comprueba pidiendo cuánto sigue sin cobrarse.",
    "4. **EDIT-N1-001, título.** «¿Nueve tareas o una estrategia?» presenta seis frases, no nueve.",
    "5. **EDIT-N1-001, línea 34.** Usa una frase que la aplicación tiene vetada en sus textos; habrá que redactarla de otra forma al convertir.",
    "6. **Estándar, tiempos mínimos.** Todavía menciona tiempos mínimos de respuesta como hipótesis del motor. Las reglas vigentes (versión 2) ya no descartan nada por rapidez.",
    "7. **Papel de quien juega.** En todas las experiencias es asesor, colega o invitado, nunca dueño. La aplicación actual lo trata como director de una empresa. Conviene decidir cómo conviven los dos papeles.",
    ...EXPERIENCIAS.filter((x) => x !== pilot && sharedAmounts(x).length > 0).map((x, i) => `${8 + i}. **${x.editorialId}, variante.** Repite cifras de la práctica: ${sharedAmounts(x).map(money).join(", ")}. Son las cifras que el paquete indica; conviene revisar si se quieren distintas.`));

  p("## 12. Estado, por separado",
    "| Etapa | Qué hay |", "|---|---|",
    `| Importado | Correspondencia de 52 identificadores; registro de ${Object.keys(FUENTES).length} fuentes; ficha de las ${items.length} experiencias de los cuatro lotes; huella de los 33 archivos originales del paquete maestro; ${EXPERIENCIAS.length} experiencias completas como contenido jugable: ${EXPERIENCIAS.map((x) => x.editorialId).join(", ")} |`,
    `| Probado | Las ${EXPERIENCIAS.length} experiencias convertidas: pruebas automáticas. Recorrido completo en un navegador, a tamaño de computadora (1280 × 800) y de celular (390 × 844), guiado por un programa |`,
    "| Revisado por una persona | Nada. Falta la revisión de Oziel y la revisión editorial |",
    "| Publicado | Nada para usuarios. Las experiencias están en producción solo por enlace, marcadas como revisión |",
    "| Validado con usuarios | Nada |");

  const pend = items.filter((i) => !live(i.editorialId)).map((i) => i.editorialId);
  p("## 13. Lo que no se hizo",
    `${pend.length ? `No se han convertido ${pend.length} experiencias: ${pend.join(", ")}. ` : ""}${live("EDIT-N1-014") ? "" : "La fuente de EDIT-N1-014 se recuperó con el paquete maestro (lote 03) y está completa; la conversión que se perdió en un reinicio del entorno de trabajo no se ha rehecho. "}Las fuentes de todas las pendientes están recibidas y verificadas. No se convierten todavía por instrucción de Oziel: primero revisa el Executive Challenge y EDIT-N1-020. El Executive Challenge EC-N1-002-A no tiene variante B ni regla de aprobación, y su reparto de puntos por paso, sus pasos de rectificación y su paso de fundamento son propuesta de la conversión. No se conectó nada al registro de evidencias ni al cálculo de dominio. No se creó ninguna tabla en la base de datos. Nadie ha revisado las respuestas escritas: no hay pantalla de revisión (propuesta en \`07-revision-humana.md\`). Las respuestas de las evaluaciones viajan al navegador dentro de la página (auditoría y propuesta en \`08-auditoria-de-claves.md\`). No se probó con lector de pantalla ni en un teléfono físico. No se comparó cada habilidad con el temario de cada curso. No se calibró ninguna rúbrica.`);

  return L.join("\n").trimEnd() + "\n";
}
