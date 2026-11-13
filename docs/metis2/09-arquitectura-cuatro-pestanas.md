# MÊTIS 2.0 · Arquitectura de cuatro pestañas

Propuesta de diseño y de cambios técnicos. 13 de noviembre de 2026.

Este documento es una propuesta. No cambia nada de lo que hoy ve una persona en la aplicación: el menú publicado sigue siendo Hoy, Bandeja, Academy, Mi progreso y Mi perfil. La construcción empieza cuando Oziel apruebe el diseño y el orden.

La lógica que gobierna todo lo que sigue: MÊTIS gira alrededor de desarrollar el criterio ejecutivo de una persona mediante experiencias empresariales inmersivas.

## 1. Qué se decidió

Instrucciones de Oziel del 13 de noviembre de 2026, registradas como reglas 48 a 61 en `plan-y-control.md`:

1. Cuatro pestañas principales: Hoy, Academy, Mi progreso y Mi perfil. Bandeja sale de la navegación principal en computadora y en celular. No se crea una pestaña de Retos ni una de Historial.
2. Hoy se organiza en cinco bloques: tu criterio ejecutivo, tu siguiente experiencia, continuar aprendiendo, repasa y fortalece, y Executive Challenge como hito.
3. Academy es el único centro académico: seis academias, por nivel, por habilidad y por objetivo de aprendizaje, con el contenido anterior y el Repositorio Académico juntos.
4. No hay un historial de decisiones protagonista, pero no se borra ninguna respuesta, decisión, evidencia ni registro.
5. Los mensajes (WhatsApp, correos, llamadas, documentos) ocurren dentro de cada caso, no en una bandeja permanente.
6. Con el simulador apagado, Hoy no muestra nada de la empresa permanente. El simulador se recupera desde Ajustes sin tocar lo jugado.
7. Antes de quitar Bandeja del menú, cada acceso que dependía de ella tiene una ruta equivalente.
8. No se modifica el sistema de dominio hasta que las evaluaciones estén validadas, y no se mezclan los datos del simulador con el programa nuevo.
9. Primero el diseño; después la construcción en orden, sin pantallas a medias en producción.

## 2. Qué se revisó y cómo

Se leyó el programa de la aplicación, sin modificarlo: el menú, la pantalla de Bandeja, las dos versiones de Hoy (con y sin simulador), Academy, Mi progreso, Mi perfil, Ajustes, la guía «?», los correos y avisos, la página pública y las pruebas automáticas que mencionan Bandeja. También la clasificación de las 335 piezas (`03-clasificacion.md`) y el estado de las experiencias del Repositorio Académico (`06-repositorio-academico.md`).

Esta revisión es de lectura. Para esta propuesta no se recorrió la aplicación en un navegador ni se cambió una sola pantalla.

## 3. El diseño

### 3.1 El menú

| Hoy | Propuesto |
|---|---|
| Hoy, Bandeja, Academy, Mi progreso, Mi perfil | Hoy, Academy, Mi progreso, Mi perfil |

Ajustes sigue donde está: el engrane del margen izquierdo en computadora y de la barra superior en celular.

Con el interruptor «Mostrar el simulador de empresas» encendido, el menú sería Hoy, Empresa, Carrera, Academy, Mi progreso y Mi perfil. Bandeja tampoco aparece ahí como pestaña: se abre desde el Hoy del simulador, que ya tiene ese enlace, y su página sigue existiendo.

El contador rojo que hoy va sobre el icono de Bandeja se propone convertir en un punto discreto sobre Hoy cuando hay algo esperando, sin número.

### 3.2 Hoy

Una sola columna, cinco bloques, en este orden. Un bloque sin contenido no se muestra.

**A. Tu criterio ejecutivo.** Nivel general, avance real hacia el siguiente nivel, las seis academias y dos medidas distintas por academia, siempre separadas y con su nombre:

- Aprendizaje: lo que la persona ha completado de lo que existe (teoría leída y experiencias terminadas). Es actividad.
- Dominio demostrado: lo que respaldan las evaluaciones independientes validadas. Usa las etapas que ya están definidas: sin evidencia, inicial, en desarrollo, demostrado, consistente y transferible.

Qué lo respalda hoy: el aprendizaje se puede contar desde ya con lo que la aplicación guarda. El dominio demostrado no: el cálculo existe y tiene pruebas, pero sus umbrales no están validados, no está conectado a ninguna pantalla y ninguna evaluación del programa nuevo se guarda todavía en el servidor. Por eso, en la primera publicación, el bloque A mostraría el aprendizaje por academia y una sola línea que dice que el dominio demostrado se mostrará cuando haya evaluaciones validadas. Sin número de nivel, sin barra de dominio y sin usar el rango, el XP ni las competencias del simulador. El diseño completo entra cuando Oziel valide las evaluaciones (etapa 5).

**B. Tu siguiente experiencia.** Una sola recomendación: título, academia y habilidad, contexto en una o dos líneas, duración y el botón para empezar. La duración se muestra solo cuando la pieza la trae escrita (lecciones, casos conversacionales y experiencias del Repositorio); los casos de una sola decisión no la traen y no se inventa.

Qué lo respalda hoy: la regla que ya elige una sola propuesta (`misionDelDia`) y la clasificación de cada pieza, que da academia y habilidad. Si hay más casos esperando, se ven bajo la recomendación en una lista corta que se despliega completa ahí mismo, sin salir de Hoy.

**C. Continuar aprendiendo.** Lo que quedó a medias, con el punto exacto donde se retoma. Si no hay nada a medias, el bloque no aparece.

Qué lo respalda hoy, pieza por pieza:

| Tipo de pieza | Se guarda a medias | Dónde | Retoma exacto |
|---|---|---|---|
| Caso conversacional | Sí | En la cuenta | Sí. Al guardarse en la cuenta debe retomarse en otro dispositivo; eso no se probó para esta propuesta |
| Caso de una sola decisión | No aplica: está pendiente o decidido | En la cuenta | No hay punto intermedio; el texto a medio escribir no se guarda |
| Lección de Academy | No | No se guarda el paso | No: empieza desde el principio (duran de 4 a 5 minutos) |
| Experiencia del Repositorio y Executive Challenge | Sí | Solo en el navegador donde se empezó | Sí en ese navegador; no en otro dispositivo |

Para cumplir «retomar exactamente» hacen falta dos adiciones: guardar el paso de la lección en la cuenta (un dato nuevo, sin tocar lo existente) y guardar en el servidor los intentos de las experiencias del Repositorio (las tablas nuevas que ya están pendientes de autorización en el punto 11 del plan).

**D. Repasa y fortalece.** Recomendaciones personales cuando hay datos: la teoría ligada a un caso que salió débil, una lección terminada hace tiempo, una habilidad con poca práctica. Sin datos suficientes, el bloque no aparece.

Qué lo respalda hoy: cada caso decidido guarda el resultado y la lección de su concepto. Esos datos se usan solo para sugerir qué repasar; no se presentan como dominio.

**E. Executive Challenge.** Un hito, no una tarea diaria. Dice qué preparación falta (cuántas de las 24 habilidades del Nivel 1 tienen su experiencia terminada) y no ofrece acreditación ni ascenso automático.

Qué lo respalda hoy: existe una versión de demostración (EC-N1-002-A), en revisión, visible solo para el equipo y sin regla de aprobación. Para el resto de las cuentas, el bloque E entra cuando las experiencias del Nivel 1 estén publicadas (etapa 4); antes solo lo ve el equipo, como hasta ahora.

Lo que Hoy no muestra con el simulador apagado: Caja, Margen, Clientes, Equipo, Consejo, misiones del consejo, «Tomar el mando», trayectorias, etapas ni una empresa permanente. Esto ya está publicado desde el Hoy intermedio (3.3a) y se conserva.

### 3.3 Academy

Tres niveles de navegación, no un catálogo plano:

1. **Las seis academias.** Estrategia, Finanzas, Liderazgo, Operaciones, Crecimiento, y Riesgo y gobierno. Cada una con su aprendizaje y su dominio demostrado, con la misma fuente que Hoy.
2. **Dentro de una academia, los niveles.** Del 1 al 6, cada uno con lo que la persona debe poder hacer y las habilidades que se trabajan en ese nivel.
3. **Dentro de una habilidad, siete secciones:**

| Sección | Qué contiene | De dónde sale |
|---|---|---|
| Objetivo de aprendizaje | Lo que hay que saber hacer en ese nivel; en el Nivel 1, además, vocabulario, documentos e indicadores | La matriz curricular (268 casillas) |
| Conceptos y teoría | Lecciones y conceptos de la habilidad. Siempre consultables, antes y después de terminar | 25 lecciones y 51 conceptos ya clasificados, más el concepto de cada experiencia del Repositorio |
| Experiencias inmersivas | Casos con documentos, mensajes y decisiones encadenadas | Las 24 experiencias del Nivel 1 del Repositorio, los 17 casos conversacionales y el simulador de cambio |
| Práctica guiada | Casos con retroalimentación | 144 casos de las seis empresas, 28 del banco de decisiones, 49 dilemas, 14 casos de crecimiento y 3 de crisis de caja. Hoy no se abren a voluntad (sección 8, punto 1) |
| Comprobaciones independientes | Otra situación, sin apoyo | La variante independiente de cada experiencia del Repositorio |
| Repasos | Volver a la teoría y a los casos resueltos; práctica de recuperación | Lo ya resuelto se puede releer. La práctica de recuperación como formato propio no existe en el contenido actual |
| Aprendizaje y dominio | Lo completado y lo demostrado con evidencia, separados | Lo mismo que Hoy |

Una sección sin contenido para esa habilidad no se muestra.

Cómo quedan las 335 piezas. Todas se conservan y todas tienen ya academia, habilidades y nivel. Son 76 de teoría y 259 actividades. Las actividades viven en los niveles 2, 3 y 4 (32, 181 y 46); no hay ninguna del Nivel 1, del 5 ni del 6. La teoría: 6 piezas del Nivel 1, 41 del 2, 27 del 3 y 2 del 4. El Nivel 1 lo llenan las 24 experiencias del Repositorio, una por habilidad. Las 3 piezas del diagnóstico inicial se quedan en el diagnóstico de entrada y no se listan como práctica.

Sobre «clasificar según su calidad»: hoy las piezas no tienen una marca de calidad, solo academia, habilidad, nivel y formato. La propuesta es agregar esa marca a la clasificación con tres valores (vigente, de consulta y por revisar), empezar con todas en «sin revisar» y que la ruta recomiende primero las vigentes conforme se revisen. Quién califica y con qué criterio es una decisión de Oziel (sección 11).

### 3.4 Mi progreso

- Evidencias por habilidad: por academia y por habilidad, qué se hizo, con qué resultado, con qué retroalimentación y con qué rúbrica, y el enlace para volver a abrirlo.
- «Actividad reciente»: una lista corta y discreta, plegada, con lo último que se resolvió. Es la sección «Tu bitácora» que hoy está en Mi perfil, movida aquí.
- La práctica con contenido anterior y el programa nuevo se muestran en apartados distintos, con su nombre.
- Lo que ya tiene (constancia, práctica por academia, temas) se conserva.

### 3.5 Mi perfil

Sin cambios de fondo: identidad, experiencia declarada, temas y ritmo, y «Mi liderazgo». Solo sale «Tu bitácora», que pasa a Mi progreso.

### 3.6 Inmersión

Los mensajes, correos, llamadas y documentos ya ocurren dentro de cada caso y de cada experiencia. No se construye ninguna bandeja nueva. Los avisos que la aplicación manda (correo, notificación, WhatsApp) llevan directo al caso.

## 4. Todo lo que depende de Bandeja y su ruta equivalente

| Núm. | Dónde aparece Bandeja hoy | Qué hace | Ruta equivalente propuesta |
|---|---|---|---|
| 1 | Menú lateral y barra inferior | Pestaña | Se quita. La página sigue abriendo por su dirección |
| 2 | Contador rojo sobre el icono | Avisa cuántos asuntos esperan | Punto discreto sobre Hoy |
| 3 | Hoy sin simulador: enlace «Bandeja», botón «Bandeja» y el texto «Los demás están en la Bandeja» | Lleva a la lista completa de pendientes | La lista completa se despliega en Hoy |
| 4 | Hoy con simulador: dos enlaces «Bandeja» | Igual | Se conservan: es el acceso a Bandeja con el simulador encendido |
| 5 | Mi progreso: botón «Ver mi bandeja» | Lleva a lo decidido | «Actividad reciente» y evidencias por habilidad, en la misma página |
| 6 | Dentro de un caso: al salir vuelve a Bandeja; si el caso no ha llegado, ofrece «Ir a la bandeja» | Salida | Vuelve a Hoy, o a la habilidad de Academy desde la que se abrió |
| 7 | Guía «?»: ficha de Bandeja, una frase en la ficha de Hoy, una en la de Empresa y una en la ficha general | Explica | Se reescriben; la ficha de Bandeja queda para su página |
| 8 | Ajustes: texto del interruptor del simulador, que enumera el menú | Explica | Se reescribe con las cuatro pestañas |
| 9 | Caso conversacional: «Te avisamos en Hoy y en tu Bandeja» | Avisa | «Te avisamos en Hoy» |
| 10 | Trayectoria (solo simulador): «aparecerá aquí y en tu bandeja» | Avisa | Se reescribe |
| 11 | Correo de racha: «asuntos esperando en tu bandeja» | Texto; el enlace lleva al inicio | Se reescribe el texto. El enlace no cambia |
| 12 | Página pública: una etiqueta «Bandeja» en la muestra de Hoy | Texto | Se cambia la etiqueta |
| 13 | Filtros Todo, Pendientes, Decididos y Vencidos | Encontrar un asunto | Pendientes en Hoy; decididos y vencidos en Mi progreso |
| 14 | Renglón del informe del mes | Entrada al cierre de mes | Es del simulador: el aviso de Hoy que ya existe y la pestaña Empresa |
| 15 | Texto «Durante el día llegarán más asuntos» | Avisa | Hoy ya lo dice cuando no hay casos |

Lo que no depende de Bandeja, comprobado: los enlaces de los correos, de las notificaciones y de WhatsApp llevan al caso, a Academy, a Ajustes, a Mi perfil o al inicio, nunca a Bandeja. La aplicación instalada en el celular abre en Hoy y no tiene atajos a Bandeja. Los avisos dentro de la aplicación llevan al caso.

Siete archivos de pruebas automáticas mencionan Bandeja. Las del menú y las de Hoy sin simulador comprueban hoy que Bandeja esté en el menú o enlazada, y se actualizan con el cambio. Las demás la usan como ejemplo de dirección o revisan su página y su ficha de la guía, y siguen valiendo porque ni la página ni la ficha desaparecen.

## 5. Qué se reutiliza, qué se mueve y qué se oculta

### Se reutiliza sin reconstruir

| Pieza | Para qué |
|---|---|
| Regla de una sola propuesta (`misionDelDia`, `hoy.ts`) | Bloque B de Hoy |
| Hoy sin simulador (`HoyAprendizaje.tsx`): saludo, constancia, renglones de casos, aviso del simulador, acceso de revisión | Base del Hoy nuevo |
| Clasificación de las 335 piezas (`clasificacion.ts`) y catálogo de 52 habilidades (`academias.ts`) | Estructura de Academy y etiquetas de cada recomendación |
| Matriz curricular (`curriculo/`) | Objetivos de aprendizaje por habilidad y nivel |
| Conteo de práctica por academia (`entrada.ts`) | Medida de aprendizaje en Hoy, Academy y Mi progreso |
| Pantallas de lección, de caso, de caso conversacional, de experiencia y de reto | Se abren igual; solo cambia desde dónde se llega y a dónde se vuelve |
| Las 13 experiencias convertidas y el Executive Challenge de demostración | Entran a Academy sin rehacerse cuando se aprueben |
| Interruptor del simulador en Ajustes | Recuperación del simulador, sin cambios |
| Reglas de dominio (`dominio.ts`) y registro de evidencias (`evidencias.ts`) | Se conectan en la etapa 5, tal como están, cuando se validen |
| Lista de identificadores protegidos (`legacy-ids.json`) y su prueba | Garantía de que ninguna pieza se pierde |

### Se mueve

| Qué | De | A |
|---|---|---|
| Lista de pendientes | Bandeja | Hoy |
| Decididos y vencidos | Bandeja | Mi progreso |
| «Tu bitácora» | Mi perfil | Mi progreso, como «Actividad reciente» |
| Contador de pendientes | Icono de Bandeja | Punto sobre Hoy |
| Índice de experiencias en revisión (`/piloto`) | Página suelta por enlace | Academy, Nivel 1, cuando se aprueben. La dirección anterior sigue abriendo |
| Rejilla de 10 temas de Academy | Portada de Academy | Dentro de cada habilidad, como «Conceptos y teoría» |
| Glosario de la industria | Portada de Academy | Se conserva en Academy, como consulta |

### Se oculta, sin borrar

| Qué | Cómo queda |
|---|---|
| Pestaña Bandeja | Fuera del menú. La página y su dirección siguen funcionando |
| Informe del mes, juntas, crisis y cambio como asuntos de bandeja | Solo con el simulador encendido; con él apagado, el aviso de Hoy que ya existe lleva a resolverlos |
| Tablero de la empresa, etapa y misión del consejo en Hoy | Ya ocultos con el simulador apagado (3.3a) |
| Candado de lecciones por rango y XP | Se propone quitarlo en Academy: la teoría debe poder consultarse siempre. El XP guardado no se toca. Decisión de Oziel |

## 6. Tres familias de registros, sin mezclar

1. **Simulador de empresas.** Indicadores, cierres de mes, trayectoria, consejo y empresas guardadas. No se toca. Se ve solo con el simulador encendido.
2. **Práctica con contenido anterior.** Lecciones terminadas y decisiones tomadas en casos y dilemas. Se guarda como hasta hoy. Cuenta como aprendizaje y se muestra con ese nombre. No cuenta como dominio demostrado.
3. **Programa nuevo.** Experiencias del Repositorio, comprobaciones independientes y Executive Challenge. Hoy solo se guardan en el navegador. Cuando se autoricen las tablas nuevas, se guardan en el servidor con contexto, rúbrica y versión. Es la única fuente del dominio demostrado.

Nada de una familia alimenta a otra.

## 7. Qué no se toca

- El sistema de dominio: no se conecta ni se modifica hasta que las evaluaciones estén validadas.
- La base de datos: esta propuesta no la cambia. Las tablas nuevas siguen pendientes de autorización y serían solo adiciones con su archivo para deshacerlas. La migración 1.5 no se ejecuta.
- Las partidas guardadas, las empresas en pausa y lo decidido.
- Los identificadores de las piezas existentes y las piezas mismas.
- Las direcciones actuales: Bandeja, Empresa, Carrera, las lecciones, los casos y las experiencias siguen abriendo.
- Las cuentas existentes: no necesitan hacer nada; ven el menú nuevo y conservan todo.

## 8. Límites reales que condicionan el diseño

1. **Las actividades anteriores no se abren a voluntad.** Los casos de las seis empresas y los del banco de decisiones llegan según el calendario de la empresa asignada, con plazo y vencimiento. Los dilemas salen uno por día y se abren según el rango. Los casos de crecimiento, la crisis de caja y el simulador de cambio pertenecen al simulador y se abren con sus reglas. Por eso, en la etapa 3, Academy mostraría completa la teoría (76 piezas) y, de las 259 actividades, las que ya le llegaron a la persona, abiertas o resueltas, ordenadas por habilidad. Abrir cualquier actividad a voluntad, sin empresa propia, es la entrega 3.1 y no forma parte de este cambio. Es el límite más importante de esta propuesta.
2. **El Nivel 1 depende de la revisión de Oziel.** De las 24 experiencias hay 13 convertidas y 11 por convertir; ninguna está aprobada (regla 40). Hasta entonces, las ve solo el equipo y la recomendación de Hoy para el resto sale del contenido anterior.
3. **Las respuestas de las evaluaciones viajan al navegador** (`08-auditoria-de-claves.md`). Antes de abrir las experiencias a todas las cuentas conviene corregirlo.
4. **Sin evaluaciones validadas no hay nivel.** El bloque A no puede mostrar un nivel general ni un avance hacia el siguiente sin inventarlo.
5. **Los 51 conceptos no tienen página propia.** Hoy cada concepto se lee solo dentro del caso que lo enseña, después de decidir. Para que la teoría se consulte siempre, la etapa 3 incluye una vista de consulta de cada concepto dentro de su habilidad. El texto ya existe; la vista no.
6. **Práctica de recuperación.** No existe como formato en el contenido actual. La sección «Repasos» empieza con relectura de teoría y de casos resueltos.
7. **Mi liderazgo** (en Mi perfil) se calcula con decisiones del contenido anterior. Esta propuesta no lo cambia.

## 9. Orden de implementación

Cada etapa se publica completa y deja la aplicación coherente. Ninguna pantalla nueva sale con secciones vacías.

| Etapa | Qué se publica | Depende de | Entrega del plan |
|---|---|---|---|
| 1 | Menú de cuatro pestañas. Rutas equivalentes de la sección 4: lista completa de pendientes en Hoy, «Actividad reciente» en Mi progreso, salidas de los casos, textos, guía, Ajustes, correo de racha y página pública | Aprobación de este diseño | 3.6 y 3.4 |
| 2 | Hoy nuevo con los bloques B, C y D, y el bloque A en su versión de aprendizaje. Guardar el paso de la lección | Etapa 1 | 3.3 |
| 3 | Academy por academia, nivel y habilidad con las 335 piezas. Teoría siempre consultable. Marca de calidad | Etapa 1; decisión sobre el candado por XP y sobre quién califica la calidad | 3.5 |
| 4 | Experiencias del Nivel 1 en Academy para todas las cuentas, guardadas en el servidor, y el bloque E | Revisión de Oziel (3.0c), respuestas fuera del navegador (3.0m) y tablas nuevas autorizadas | 3.5, 3.8 |
| 5 | Dominio demostrado y nivel en Hoy, Academy y Mi progreso | Evaluaciones validadas y reglas de dominio aprobadas | 3.3, 1.5 |

Las etapas 1, 2 y 3 no dependen de nada más que de la aprobación. La 4 y la 5 esperan decisiones que ya estaban abiertas.

## 10. Plan de pruebas

En cada etapa, en computadora (1280 por 800) y en celular (390 por 844), con pruebas automáticas y con un recorrido en navegador:

- Navegación: las cuatro pestañas, Ajustes, y que ninguna pantalla enlace a una pestaña que ya no existe.
- Cuenta existente con casos pendientes, decididos y vencidos: todo sigue alcanzable.
- Retomar: un caso conversacional a medias, una lección a medias (desde la etapa 2) y una experiencia a medias.
- Contenido anterior: abrir una lección terminada, un caso resuelto y su retroalimentación.
- Simulador: encenderlo en Ajustes, ver Empresa, Carrera y Bandeja con la partida intacta, y apagarlo.
- Cuenta nueva: registro y primer día sin pasar por Bandeja.
- Que la lista de piezas protegidas siga completa.

## 11. Decisiones que necesito de Oziel

1. Bloque A en la primera publicación: mostrar el aprendizaje por academia y una línea sobre el dominio demostrado (recomendado), o no mostrar el bloque hasta la etapa 5.
2. Con el simulador encendido: Bandeja fuera del menú y alcanzable desde su Hoy (recomendado), o de vuelta como pestaña solo en ese modo.
3. Contador de pendientes: punto discreto sobre Hoy (recomendado), o ningún aviso en el menú.
4. Candado de lecciones por rango y XP: quitarlo en Academy (recomendado), o conservarlo.
5. Marca de calidad de las 335 piezas: quién califica y con qué criterio.
6. «Tu bitácora»: moverla a Mi progreso como «Actividad reciente» (recomendado), o dejarla en Mi perfil.
7. El orden de las etapas, en particular si la etapa 1 se publica sola o junto con la 2.

## 12. Archivos del programa que se tocan

Rutas dentro de `app/src/`. La lista incluye todos los archivos que hoy mencionan Bandeja; una prueba automática vigila que no falte ninguno.

| Archivo | Qué cambia | Etapa |
|---|---|---|
| `lib/ceo/metis2/menu.ts` | Bandeja sale de la lista del menú; cuatro columnas (seis con el simulador); el aviso de pendientes pasa a Hoy | 1 |
| `components/ceo/CeoShell.tsx` | Dibuja el menú de cuatro; punto de pendientes sobre Hoy | 1 |
| `components/ceo/HoyAprendizaje.tsx` | Etapa 1: salen el enlace y el botón de Bandeja; la lista de pendientes se despliega completa. Etapa 2: bloques A a D | 1 y 2 |
| `components/ceo/Progress.tsx` | Sale «Ver mi bandeja»; entra «Actividad reciente»; después, evidencias por habilidad | 1 y 4 |
| `components/ceo/Profile.tsx` | Sale «Tu bitácora» (pasa a Mi progreso) | 1 |
| `components/ceo/CaseView.tsx` | La salida del caso vuelve a Hoy o a la habilidad de Academy | 1 |
| `components/ceo/EpisodeView.tsx` | Un texto | 1 |
| `components/ceo/CeoSettings.tsx` | El texto del interruptor del simulador | 1 |
| `components/ceo/Trajectory.tsx` | Un texto (solo se ve con el simulador) | 1 |
| `lib/ceo/guide.ts` | Fichas de Hoy, de Empresa y la general; la ficha de Bandeja se conserva para su página | 1 |
| `lib/ceo/emails.ts` | El texto del correo de racha | 1 |
| `components/site/ceo-landing/content.ts` | Una etiqueta de la muestra de Hoy en la página pública | 1 |
| `lib/ceo/metis2/hoy.ts` | Reglas de los bloques B, C y D | 2 |
| `lib/ceo/types.ts` | Un dato nuevo para guardar el paso de la lección; nada existente cambia | 2 |
| `components/ceo/CeoAcademy.tsx` y las páginas de `app/ceo/academy` | Academy por academia, nivel y habilidad | 3 |
| `lib/ceo/metis2/clasificacion.ts` | Marca de calidad por pieza | 3 |
| `components/ceo/Today.tsx` | Sin cambios: es el Hoy del simulador y conserva sus enlaces a Bandeja | No cambia |
| `app/ceo/bandeja/page.tsx` y `components/ceo/InboxView.tsx` | Sin cambios: la página de Bandeja se conserva | No cambia |
| `lib/ceo/auth-routes.ts` y `middleware.ts` | Sin cambios: solo la mencionan en comentarios, como ejemplo de dirección | No cambia |
| `components/site/ceo-landing/HowSlides.tsx` | Sin cambios: un comentario interno | No cambia |
| `lib/ceo/metis2/experiencias/n1-liderazgo-ese-correo-necesita-una-decision.ts` | Sin cambios: «La bandeja» es un momento dentro del caso, que es justo donde deben vivir los mensajes | No cambia |

Pruebas que se actualizan en la etapa 1: `lib/ceo/metis2/menu.test.ts` y `lib/ceo/metis2/hoy.test.ts`.

## 13. Lo que no se hizo

- No se cambió el menú ni ninguna pantalla. Bandeja sigue publicada como pestaña.
- No se tocó la base de datos, el sistema de dominio, las partidas ni el contenido.
- No se recorrió la aplicación en un navegador para esta propuesta: el inventario es de lectura del programa.
- Las maquetas que acompañan esta propuesta son imágenes fijas hechas fuera de la aplicación, con datos de ejemplo. No son pantallas que funcionen y no están en el repositorio.
- No se estimó el tiempo de cada etapa.
- No se convirtió ninguna experiencia nueva ni se cambió ninguna de las existentes.
