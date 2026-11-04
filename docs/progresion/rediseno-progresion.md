# Rediseño de la progresión de mêtis CEO: Mandato, liderazgo y constancia

Estado: la fase 1 (presentación) está implementada en la rama `progresion-mandato`. Las fases 2 a 4 (motor y datos) son solo una propuesta y necesitan aprobación antes de tocar la lógica que decide qué casos llegan o de migrar datos guardados.

## 1. Diagnóstico del cálculo anterior

Hasta esta entrega convivían dos sistemas de avance, y la app mostraba el que no correspondía al producto.

El primero era el antiguo Executive Journey (`lib/ceo/journey.ts`). Era una escalera personal de seis títulos corporativos: Emerging Leader, Functional Manager, Business Unit Director, Chief Operating Officer, Chief Executive Officer y Global CEO. Para pasar de uno al siguiente, `STAGE_RULES` pedía a la vez:

- periodos aprobados (1, 2, 3 y 4);
- un reto de cambio logrado;
- un periodo con exigencia alta;
- la Junta ante el Consejo;
- el modo Legendario;
- un número de competencias de dominio por encima de un umbral (2, 4, 6 u 8 competencias en 40 o más; luego 8 en 55 y 3 en 70; al final 8 en 65 y 2 en 85);
- **XP acumulado de 100, 300, 600, 1 000 y 1 600**.

Esto mezclaba las tres dimensiones que el producto debe separar: los resultados de la empresa (periodos aprobados), la competencia (dominio de 0 a 100 con la marca «Competent 40») y la constancia (XP). Con esa mezcla, practicar todos los días podía «comprar» parte de un ascenso, un mes difícil frenaba un título personal, y la persona arrancaba como «Emerging Leader» aunque el onboarding le entregara una carta de nombramiento como Director General. El estado se guarda en `s.journey` (etapa, nombramientos, distinción fundadora y junta), y también lo usan `replay.ts` (acción `appoint`), `journal.ts`, `engine.ts` (sanea el campo) y `board.ts` (abre la Junta según `journey.stage`).

El segundo sistema, que es el correcto, ya existía en el motor: los **capítulos de la empresa** (`career/stages.ts` y `engine.companyStageOf`). Se calculan solo con los meses cerrados de la empresa:

- El primer mes, «Tomar el mando», se cierra siempre.
- A partir de ahí, la empresa abre el siguiente capítulo cuando lleva los meses mínimos (`STAGE_MONTHS = [1, 2, 3, 3, 4]`) y el consejo aprueba el cierre.
- Un mes no aprobado deja a la empresa en el mismo capítulo, sin despido ni reinicio.

Este cálculo sí afecta el juego: fija el nivel de exigencia (`tier`), filtra los casos del día 1 y elige el banco de meses. Por eso **no se tocó**.

Referencias que mostraban la escalera anterior (todas corregidas en la fase 1):

- **Hoy:** franja «Executive Journey · Stage N de 6», barra de requisitos y «Siguiente nombramiento: X de Y».
- **Carrera:**
  - hero del Journey con tarjetas de requisitos, la vía de seis títulos y el botón «Recibir nombramiento»;
  - modal de nombramiento;
  - paso «Junta de nombramiento»;
  - «Para ascender necesitas…»;
  - «+XP» en cada periodo.
- **Perfil:**
  - «Nombre · título del Journey»;
  - la sección Executive Journey;
  - «Competencias · 4 de 8 en Competent (40)»;
  - «Constancia · no define tu etapa»;
  - la distinción fundadora.
- **Academy:** «Tu enfoque para [siguiente título]… lo que más te frena para tu siguiente nombramiento».
- **Junta ante el Consejo:** «Requisito para Chief Executive Officer» y «Todavía no te toca»; en Hoy, la tarea decía «Requisito para tu nombramiento».
- **Onboarding y Experiencia:** «todos empiezan como Emerging Leader», «empiezas como Emerging Leader», «tu etapa, el ranking y los nombramientos».
- **Empresa y correos:**
  - «Para ascender, cada rubro…» y «asciendes a otra empresa»;
  - la casilla «XP · [título]» en el resumen diario y en el cierre de temporada.
- **Datos derivados:**
  - `schedule.ts` (el `level` de los correos programados);
  - `player-row.ts` (la columna `level` de `ceo.players`);
  - `import.ts` (la «Etapa» en la importación).
- **Ajustes, importación e insignia:**
  - Ajustes decía «Cómo apareces en el ranking» y el texto del sonido mencionaba el nombramiento;
  - la importación decía «no cuenta como ventaja en los rankings nuevos»;
  - la insignia se llamaba «Ascenso».
- **Página pública (ES y EN):**
  - la ruta de seis títulos con candados y «Siguiente objetivo / Por desbloquear»;
  - el candado de «The Executive Arena» con «Después de Global CEO»;
  - «desbloquea nuevas etapas» / «unlock new stages»;
  - la matriz interna AVAILABILITY.
- **Menú:** Ranking aparecía en el menú de escritorio y en la barra superior móvil.

No se tocaron los textos narrativos de casos y dilemas que hablan de ascensos de *otras personas* (por ejemplo, decidir a quién ascender a gerente de ventas): son contenido de la historia, no progresión del jugador. La meta declarada «Prepararme para un ascenso» del perfil profesional también se queda, porque describe el objetivo real de la persona fuera del simulador.

## 2. Modelo nuevo: tres dimensiones que no se mezclan

**A. Mandato y trayectoria de la empresa.** Es la única fuente de verdad: `lib/ceo/trajectory.ts` → `trajectoryOf(s, now)`, que el proveedor expone como `c.trajectory`. Es una función pura, de solo lectura y determinista; no guarda nada. Entrega:

- el nombramiento real («Director General de [empresa]» y la fecha);
- el mes en curso;
- el capítulo de la empresa (el mismo `companyStageOf` del motor, con su propósito y lo que pide el consejo para abrir el siguiente);
- el encargo vigente y sus objetivos;
- el momento de la empresa en palabras (sólida, estable, bajo tensión, en riesgo; umbrales de salud 70, 58 y 45), sin porcentaje global;
- las revisiones del consejo mes por mes;
- los hitos;
- las decisiones que marcaron la gestión;
- los compromisos y consecuencias abiertos;
- la evolución de los indicadores.

No lee XP, racha, lecciones ni el antiguo Journey, y una prueba lo verifica.

**B. Desarrollo del liderazgo.** Se queda en `leadership.ts` («Mi liderazgo»), con tres lecturas separadas:

- **preferencias:** estilo, no calificación;
- **competencias:** medidas solo donde la situación las pedía, con la rúbrica contextual;
- **resultados de la empresa.**

La certeza es proporcional a la evidencia (`LEADERSHIP_EVIDENCE`): hacen falta al menos 6 situaciones en 3 áreas y 2 periodos para dejar de ser «tendencia», y 10 situaciones en 4 áreas, en 2 periodos, con nivel de 0.75 y como máximo 15 % de tropiezos para llamarse «fortaleza». No hay títulos al llegar a 40 y el XP no entra en ningún cálculo.

**C. Constancia.** XP, racha y meta diaria. Se muestran aparte y en segundo plano, con el texto explícito de que no abren cargos, capítulos ni competencias. El XP sigue abriendo lecciones de Academy, que es material de estudio y no un rango.

Lo que el modelo evita a propósito:

- un porcentaje de «qué tan CEO eres»;
- subir de capítulo como si fuera mérito personal (los capítulos describen a la empresa);
- bajar o reiniciar por un mes malo: el consejo pide corregir y queda el hito «el consejo pidió corregir»; si el mes siguiente se aprueba, queda el hito «recuperación»;
- presentar el crecimiento como siempre deseable: el texto del capítulo «Acelerar con criterio» dice «crecer solo donde el negocio lo sostiene».

## 3. Reglas

**Capítulo.** Es el cálculo actual del motor y no cambia: el primer mes se cierra siempre, y después la empresa abre el siguiente capítulo con los meses mínimos y la aprobación del cierre. Un mes no aprobado nunca baja de capítulo.

**Hitos** (solo hechos registrados, en orden cronológico):

- el nombramiento (`companyProfile.appointedAt`);
- la apertura de un capítulo;
- un mes no aprobado («el consejo pidió corregir»);
- un mes aprobado después de uno no aprobado («recuperación»);
- un proyecto de cambio logrado;
- cada sesión extraordinaria de crisis de esta empresa, con su resultado (contenida, con daños o desbordada).

**Decisiones que marcaron.** Se ordenan por peso, de mayor a menor: suma de los efectos absolutos en los cinco indicadores, más 10 si cruzó una línea roja y más 3 si detonó una consecuencia. Se muestran como máximo 5; si empatan, va primero la más antigua.

**Compromisos abiertos.** El reporte del mes anterior sin revisar, las consecuencias de decisiones anteriores que ya llegaron y los asuntos que esperan decisión.

**Revisión del consejo y continuidad.** Cada mes cerrado es una revisión, aprobada o con corrección pedida. La continuidad del mandato no depende de puntos: sigues al frente de tu empresa mientras juegas.

**Evidencia de competencias.** Son las reglas vigentes de `leadership.ts`, sin XP.

## 4. Pantallas (fase 1, implementada)

**Hoy.** La franja de bienvenida conserva el saludo, los asuntos que esperan y el botón principal. A la derecha, el recuadro «Tu mandato» muestra:

- el cargo;
- «Mes N · capítulo»;
- el momento de la empresa;
- un compromiso abierto o el último hito;
- un enlace a la trayectoria.

Abajo, en letra pequeña y separada, va «Constancia»: la racha y el XP. Se quitaron Executive Journey, «Stage N de 6», el título personal, la barra de requisitos y «Siguiente nombramiento». Lo demás de Hoy (encargo del consejo, decisiones pendientes, estado de la empresa y aprendizaje) sigue igual y en el mismo orden.

**Carrera.** El hero «Tu mandato» muestra:

- el cargo y la fecha;
- el mes, el capítulo y el momento de la empresa;
- el propósito del capítulo;
- las prioridades del consejo con sus objetivos;
- los seis capítulos como referencia, sin candados;
- qué pide el consejo para abrir el siguiente capítulo, aclarando que es de la empresa y no un rango.

Después siguen los compromisos y consecuencias abiertos, los hitos de la gestión, las decisiones que marcaron el mes y la evolución de la empresa por mes. El veredicto del consejo y el panel de evaluación quedan como estaban. La lista de meses ahora se llama «Revisiones del consejo», muestra el capítulo de cada mes y si abrió uno nuevo, y ya no muestra XP. Se quitaron los requisitos, la vía de títulos, el modal y el paso de nombramiento.

Rotaciones Ejecutivas: no se muestran porque todavía no existen. Cuando existan, tendrán su propia tarjeta en Carrera.

**Perfil.** El encabezado muestra el nombre, «Director General de [empresa]», un enlace a la trayectoria y el estilo de dirección. «Mi liderazgo» sube justo debajo del encabezado y ocupa el lugar de las barras de 0 a 100 con la marca Competent 40. La constancia se presenta como «tu hábito, no un requisito». Se quitaron la sección Executive Journey, el título y la distinción fundadora visible. Perfil no repite hitos ni revisiones: eso vive en Carrera.

**Página pública.** Se conserva el título «Una carrera que crece contigo.», con un texto nuevo: desde el primer día eres el Director General de una empresa que ya existe, y lo que cambia es la empresa. Los seis nodos son ahora los capítulos (Tomar el mando, Estabilizar, Construir capacidad, Acelerar con criterio, Escalar y Gobernar la complejidad), sin candados. El cierre dice «Los capítulos son de la empresa, no rangos tuyos». La versión en inglés tiene el mismo contenido. Se cambió una frase del bloque oscuro: «desbloquea nuevas etapas» pasó a «acompaña a tu empresa en cada capítulo».

**Otras pantallas:**

- **Academy:** el enfoque de estudio es la competencia con menor dominio, sin hablar de nombramientos.
- **Junta ante el Consejo:** se presenta como una sesión extraordinaria del consejo.
- **Onboarding y Experiencia:** «empiezas como Director General».
- **Empresa y correos:** dicen «para aprobar» y «XP de constancia».
- **Datos derivados:** los correos programados, la columna `level` de `ceo.players` y la importación usan `mandateLabelOf(s)`, es decir, «Director General · capítulo».
- **Insignia:** se renombró a «Primer cierre aprobado»; su identificador interno no cambia.

**Ranking.** Se ocultó del menú de escritorio y de la barra móvil, y se quitaron sus menciones en Ajustes, onboarding e importación. La página `/ceo/ranking` sigue existiendo, sin enlaces.

## 5. Compatibilidad: lo que no se tocó

No se borró ni se reinició nada: cuentas, XP, rachas, lecciones, decisiones, métricas e historial siguen intactos. El campo `s.journey` sigue guardado y válido. El diario y la repetición siguen aceptando la acción `appoint` de partidas antiguas. La inscripción automática del Journey sigue corriendo en segundo plano (no se muestra), así que volver atrás no requiere migración.

El motor V7, sus reglas éticas, la rúbrica, `companyStageOf`, `STAGE_MONTHS`, la exigencia, la selección de casos y la evaluación del consejo no cambian. La versión de reglas sigue en 7.

## 6. Plan de las fases siguientes (propuesta, sin implementar)

**Fase 2: acceso a la Junta según la empresa.** Hoy la Junta se abre con `journey.stage = 3`. La propuesta es abrirla cuando la empresa entra a «Acelerar con criterio» o después de dos meses no aprobados seguidos, como sesión de rendición de cuentas. Cambia quién ve la Junta y cuándo, así que se versiona aparte: las partidas en curso conservan su regla. Pruebas de compatibilidad:

- quien ya la superó la conserva;
- se reconstruye igual desde el diario.

**Fase 3: capítulos por estado del negocio.** Abrir capítulos según hechos de la empresa (por ejemplo, Estabilizar se cierra cuando la caja y el servicio se sostienen dos meses) en lugar de solo por meses mínimos. También incluye que un capítulo pueda «volver» en lo narrativo si la empresa entra en crisis, sin cambiar la exigencia hacia atrás. Afecta `tier` y la selección de casos, así que necesita una nueva versión de reglas continuas, simulaciones de distribución y la garantía de no recalificar meses cerrados.

**Fase 4: Rotaciones Ejecutivas y retiro del Journey.** Las Rotaciones Ejecutivas serían experiencias temporales en otra empresa, sin tocar la principal; necesitan un modelo de datos propio. Retirar el Journey del estado solo se haría cuando ningún flujo lo lea: primero se deja de inscribir y después se conserva en modo solo lectura para el diario. El campo nunca se borra.

## 7. Pruebas de consistencia

**`trajectory.test.ts`** (cuatro carreras simuladas de cinco meses en Cumbre, Forja, Kubit y Brasa, con estrategias distintas) verifica que:

- el capítulo es exactamente el del motor y el cargo es «Director General de [empresa]»;
- el resultado es determinista y no cambia si se altera el XP, la racha, las lecciones o el Journey;
- un mes no aprobado nunca baja de capítulo y deja su hito, y la aprobación siguiente deja el de recuperación;
- el momento de la empresa no trae cifras ni rangos;
- las decisiones que marcaron están ordenadas por peso;
- los textos no hablan de ascensos.

**`progresion-consistencia.test.ts`** verifica que:

- Hoy, Carrera y Perfil leen `c.trajectory` y ninguna usa el antiguo Journey;
- ninguna pantalla de la app, correo, renglón de jugadores, importación ni la página pública contiene la escalera anterior, «siguiente nombramiento», «para ascender», «Stage N» o «Competent (40)»;
- la constancia aparece aparte y se dice que no es requisito;
- Perfil conserva Mi liderazgo y no repite la trayectoria.

**Pruebas actualizadas:**

- `nav.test.ts`: Ranking está oculto y la página sigue existiendo;
- `today-layout.test.ts`: franja del mandato y constancia secundaria;
- `content.test.ts`: capítulos iguales a `COMPANY_STAGES`, sin candados ni títulos corporativos en ningún idioma.
