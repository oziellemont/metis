# MÊTIS 2.0 · Arquitectura de cuatro pestañas

Propuesta de diseño y de cambios técnicos. 13 de noviembre de 2026.

Este documento es una propuesta. No cambia nada de lo que hoy ve una persona en la aplicación: el menú publicado sigue siendo Hoy, Bandeja, Academy, Mi progreso y Mi perfil. La construcción empieza cuando Oziel apruebe el diseño y el orden.

La lógica que gobierna todo lo que sigue: MÊTIS gira alrededor de desarrollar el criterio ejecutivo de una persona mediante experiencias empresariales inmersivas.

## 1. Qué se decidió

Instrucciones de Oziel del 13 de noviembre de 2026, registradas como reglas 48 a 68 en `plan-y-control.md`:

1. Cuatro pestañas principales: Hoy, Academy, Mi progreso y Mi perfil. Bandeja sale de la navegación principal en computadora y en celular. No se crea una pestaña de Retos ni una de Historial.
2. Hoy conserva el mismo diseño del Hoy anterior: una zona principal oscura y minimalista, y una barra lateral blanca muy sencilla a la derecha. Dentro de ese diseño viven los cinco bloques: tu criterio ejecutivo, tu siguiente experiencia, continuar aprendiendo, repasa y fortalece, y Executive Challenge como hito.
3. Academy es el único centro académico: seis academias, por nivel, por habilidad y por objetivo de aprendizaje, con el contenido anterior y el Repositorio Académico juntos.
4. No hay un historial de decisiones protagonista, pero no se borra ninguna respuesta, decisión, evidencia ni registro.
5. Los mensajes (WhatsApp, correos, llamadas, documentos) ocurren dentro de cada caso, no en una bandeja permanente.
6. Con el simulador apagado, Hoy no muestra nada de la empresa permanente. El simulador se recupera desde Ajustes sin tocar lo jugado.
7. Antes de quitar Bandeja del menú, cada acceso que dependía de ella tiene una ruta equivalente.
8. No se modifica el sistema de dominio hasta que las evaluaciones estén validadas, y no se mezclan los datos del simulador con el programa nuevo.
9. Primero el diseño; después la construcción en orden, sin pantallas a medias en producción.
10. Hoy es un camino de aprendizaje, no una lista de pendientes: una experiencia activa y las dos siguientes a la vista, atenuadas. Sin cifra de pendientes.
11. Los candados dependen solo de prerrequisitos reales de aprendizaje; nunca del XP, de los días transcurridos ni del simulador anterior. La teoría, los glosarios y los conceptos nunca se bloquean.
12. Academy muestra el recorrido completo de cada academia con cuatro estados. La ruta es personal y no rígida. El Executive Challenge es el hito al final del recorrido de cada nivel.

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

El contador rojo que hoy va sobre el icono de Bandeja deja de mostrarse. Antes se proponía convertirlo en un punto discreto sobre Hoy; con la regla 63 (Hoy motiva a avanzar y no señala acumulación de trabajo) se propone no poner ningún aviso en el menú. Es la lectura que SuperNinja hace de esa instrucción y se confirma con Oziel (sección 11).

### 3.2 Hoy

Instrucción de Oziel sobre esta pantalla (regla 62 del plan): Hoy tiene que ser muy similar a como estaba antes, minimalista, mostrando solo lo necesario, con la barra lateral derecha muy sencilla, con el mismo diseño y con los datos nuevos. Por eso no se diseña una pantalla nueva: se conserva el diseño de dos zonas del Hoy anterior y solo cambian los datos.

**Zona principal (izquierda, fondo oscuro).** Por instrucción de Oziel (reglas 63 y 64), esta zona deja de ser una lista de pendientes y pasa a ser un camino de aprendizaje: una experiencia a la vez, el siguiente paso siempre claro y el camino por delante a la vista. La composición no cambia. De arriba hacia abajo:

1. El renglón de constancia: los días de la semana, la racha y el XP. Ya está publicado así. El XP se muestra como constancia y no abre ni cierra nada.
2. La fecha, la etiqueta «Tu camino ejecutivo» y el saludo. Ya no hay cifra grande ni la frase «Pendientes por resolver».
3. El camino: una secuencia compacta de tarjetas unidas por una línea.
   - Arriba, en un solo renglón, la última experiencia completada, con su marca y el enlace para volver a verla. Si no hay ninguna, el renglón no aparece.
   - La experiencia activa, destacada: la etiqueta «Tu siguiente paso», el título, el contexto en una línea, la academia y la habilidad, la duración solo cuando la pieza la trae escrita, y un solo botón blanco, «Empezar». Si quedó a medias, la etiqueta cambia a «Continúa tu aprendizaje», el botón a «Continuar» y una barra pequeña dice en qué paso se quedó.
   - Las dos experiencias siguientes, atenuadas: en gris, con menor contraste y sin botón. Llevan un candado discreto solo cuando un prerrequisito real impide empezarlas, con el nombre de lo que piden. Si no hay prerrequisito, dicen «Después» y no llevan candado.
4. Una línea: es una recomendación, lo demás se puede explorar cuando se quiera, y un enlace al camino completo.
5. Al pie, separada del camino, una tarjeta punteada con el Executive Challenge como hito del nivel. Mientras no se cumplan sus condiciones se ve con candado y dice en una línea qué falta.

Al completar la experiencia activa, el camino avanza: la que se terminó pasa al renglón de completada, la siguiente se vuelve la activa y entra una nueva al final. Los cambios de estado llevan una transición breve y sobria; nada rebota ni parpadea.

Sobre el nombre. De las tres frases que Oziel propuso se usan las tres, cada una en su lugar: «Tu camino ejecutivo» nombra la pantalla, porque describe el recorrido y no una tarea; «Tu siguiente paso» nombra la tarjeta activa; y «Continúa tu aprendizaje» la sustituye cuando hay algo a medias.

**Barra lateral (derecha, fondo blanco).** El mismo panel de antes, con otros datos:

1. «Tu criterio ejecutivo» con una cifra grande y su barra.
2. Seis renglones delgados, uno por academia, cada uno con su barra y su número. Tocar un renglón abre esa academia.
3. Una línea con icono sobre el dominio demostrado.
4. Un enlace: «Ver todo en Mi progreso».
5. Una tarjeta de «Repasa y fortalece», solo cuando hay datos de la persona.

«Lo último que hiciste» sale de Hoy para que el panel quede más simple: vive en Mi progreso, dentro de «Actividad reciente».

En celular se conserva también el comportamiento de antes: la zona principal va arriba y el panel blanco baja como una tarjeta, con el menú de cuatro pestañas al pie.

Correspondencia, elemento por elemento:

| En el Hoy anterior | En el Hoy propuesto | Bloque |
|---|---|---|
| Cifra grande «Asuntos por resolver» y botón «Atender» | Etiqueta «Tu camino ejecutivo», sin cifra. La experiencia activa, destacada, con la etiqueta «Tu siguiente paso» y el botón «Empezar» o «Continuar» | B y C |
| Renglones de asuntos pendientes | Las dos experiencias siguientes, atenuadas, y arriba la última completada | B |
| Tarjeta «Misión del consejo», al pie | Tarjeta del Executive Challenge como hito, al pie | E |
| «Salud de la empresa», con su cifra sobre 100 | «Tu criterio ejecutivo», con las piezas completadas del total y la etiqueta «Aprendizaje» | A |
| Cinco barras: Caja, Margen, Clientes, Equipo y Consejo | Seis barras: una por academia | A |
| Línea de indicadores en buen estado | Línea «Dominio demostrado»: se mostrará cuando haya evaluaciones validadas | A |
| Enlace a los números completos en Empresa | Enlace «Ver todo en Mi progreso» | A |
| «Tomar el mando» | No se muestra (regla 57) | |
| Tarjeta de la lección sugerida | Tarjeta «Repasa y fortalece» | D |
| «Lo último que decidiste» | Sale de Hoy. Vive en Mi progreso, en «Actividad reciente» | |

Lo que se deja fuera a propósito para que la pantalla siga siendo mínima: la cifra de pendientes, descripciones largas, más de tres experiencias a la vista, más de una recomendación de repaso y cualquier cifra que no esté respaldada. Un bloque sin contenido no se muestra.

El contenido y el respaldo de cada bloque son los mismos de la propuesta original:

**A. Tu criterio ejecutivo.** Nivel general, avance real hacia el siguiente nivel, las seis academias y dos medidas distintas por academia, siempre separadas y con su nombre:

- Aprendizaje: lo que la persona ha completado de lo que existe (teoría leída y experiencias terminadas). Es actividad.
- Dominio demostrado: lo que respaldan las evaluaciones independientes validadas. Usa las etapas que ya están definidas: sin evidencia, inicial, en desarrollo, demostrado, consistente y transferible.

Qué lo respalda hoy: el aprendizaje se puede contar desde ya con lo que la aplicación guarda. El dominio demostrado no: el cálculo existe y tiene pruebas, pero sus umbrales no están validados, no está conectado a ninguna pantalla y ninguna evaluación del programa nuevo se guarda todavía en el servidor. Por eso, en la primera publicación, el bloque A mostraría el aprendizaje por academia y una sola línea que dice que el dominio demostrado se mostrará cuando haya evaluaciones validadas. Sin número de nivel, sin barra de dominio y sin usar el rango, el XP ni las competencias del simulador. El diseño completo entra cuando Oziel valide las evaluaciones (etapa 5).

**B. Tu siguiente experiencia.** Es la experiencia activa del camino: título, academia y habilidad, contexto en una línea, duración y el botón para empezar. Debajo se ven, atenuadas, las dos que siguen. La duración se muestra solo cuando la pieza la trae escrita (lecciones, casos conversacionales y experiencias del Repositorio); los casos de una sola decisión no la traen y no se inventa.

Qué lo respalda hoy: la regla que ya elige una sola propuesta (`misionDelDia`), la clasificación de cada pieza, que da academia y habilidad, y los prerrequisitos del catálogo de habilidades. Lo que no existe es una regla que entregue tres pasos en orden y use esos prerrequisitos: es la entrega 2.3 del plan (sección 8, punto 8).

Para que nada quede inalcanzable (regla 58), el enlace «Ver mi camino» despliega ahí mismo, en orden, todo lo que sigue, incluidos los casos que esperan. Cuando Academy tenga su vista de recorrido (etapa 3), ese enlace lleva a Academy.

**C. Continuar aprendiendo.** Lo que quedó a medias no ocupa un renglón aparte: se vuelve la experiencia activa del camino, con la etiqueta «Continúa tu aprendizaje», el botón «Continuar» y el paso donde se retoma. Si no hay nada a medias, la activa es la siguiente experiencia nueva.

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

**E. Executive Challenge.** Un hito, no una tarea diaria. Se dibuja al pie, separado del camino y con otra forma, para que no se confunda con las experiencias de cada día. Mientras no se cumplan sus condiciones se ve con candado y dice qué preparación falta (cuántas de las 24 habilidades del Nivel 1 tienen su experiencia terminada). No ofrece acreditación ni ascenso automático antes de que las rúbricas y las evaluaciones estén validadas.

La condición que lo abre no está decidida. El plan tiene anotada una propuesta (cobertura en las seis academias y evidencia suficiente), que depende de evaluaciones validadas. La maqueta usa una condición más simple y ligada al aprendizaje: terminar las 24 experiencias del Nivel 1. Es una decisión de Oziel (sección 11).

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

**El recorrido (reglas 65 a 68).** Al entrar a una academia se ve su camino completo, nivel por nivel. Cada habilidad está en uno de cuatro estados:

| Estado | Cómo se ve | Qué significa |
|---|---|---|
| Completado | Con marca de completado | La experiencia de esa habilidad está terminada y se puede volver a ver. Es aprendizaje, no dominio demostrado |
| Actual | Destacado, con su botón | Es el paso recomendado ahora y está listo para empezar o continuar |
| Disponible para explorar | Abierto, sin destacar | No tiene prerrequisitos pendientes: se puede abrir aunque no sea el paso recomendado |
| Con prerrequisitos pendientes | Atenuado, con candado | Dice qué habilidad pide antes. Su teoría y sus conceptos siguen abiertos |

Las reglas de los candados:

- La teoría, los glosarios y los conceptos nunca se bloquean. El candado solo aplica a una experiencia o a una evaluación.
- Ningún candado depende del XP, de los días transcurridos ni del simulador anterior. Solo de prerrequisitos reales de aprendizaje.
- El candado siempre dice qué lo abre.

Qué lo respalda hoy. El catálogo de habilidades ya trae los prerrequisitos: 41 de las 52 habilidades piden otra antes; en el Nivel 1, 14 de 24. En Finanzas, por ejemplo, Vocabulario financiero no pide nada, y Estado de resultados, Balance general, Flujo de efectivo y Presupuesto piden Vocabulario financiero. Hoy ninguna pantalla usa esos prerrequisitos. El catálogo los define como habilidades que conviene tener demostradas antes, y «demostrada» no se puede comprobar mientras no haya evaluaciones validadas. Por eso se propone que, hasta entonces, el candado se abra al terminar la experiencia de la habilidad previa. Es una decisión de Oziel (sección 11).

Lo que cambia respecto a lo publicado: hoy Academy bloquea lecciones según el rango y el XP. Con la regla 65 ese candado se quita en la etapa 3. El XP guardado no se toca y se sigue mostrando como constancia.

El glosario que existe hoy es el de la industria de la empresa asignada; se conserva en Academy como consulta abierta. Un glosario por academia no existe como pieza: la maqueta lo muestra como ejemplo.

**Ruta personal y no rígida (regla 67).** El orden del camino es una recomendación. Se arma con los temas que la persona eligió, la experiencia que declaró, los prerrequisitos y su avance. Cuando exista el diagnóstico adaptativo (entrega 2.2), también con los conocimientos previos que ese diagnóstico mida. La persona puede abrir cualquier habilidad disponible aunque no sea el paso recomendado, y toda la teoría.

**El Executive Challenge en el recorrido (regla 68).** Aparece al final del camino de cada nivel, con una forma distinta a la de las experiencias, como hito. Mientras no se cumplan sus condiciones se ve con candado y dice qué falta. No ofrece acreditación antes de que las rúbricas y las evaluaciones estén validadas.

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
| 2 | Contador rojo sobre el icono | Avisa cuántos asuntos esperan | Ningún aviso en el menú (regla 63). Lo que espera se ve en Hoy, dentro del camino |
| 3 | Hoy sin simulador: enlace «Bandeja», botón «Bandeja» y el texto «Los demás están en la Bandeja» | Lleva a la lista completa de pendientes | El camino de Hoy: tres experiencias a la vista y, al tocar «Ver mi camino», todo lo que sigue, en orden |
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
| Regla de una sola propuesta (`misionDelDia`, `hoy.ts`) | Punto de partida de la regla del camino de Hoy (bloque B) |
| Prerrequisitos del catálogo de habilidades (`academias.ts`): 41 de 52 habilidades piden otra antes | Orden del camino y candados del recorrido de Academy |
| Hoy sin simulador (`HoyAprendizaje.tsx`): saludo, constancia, renglones de casos, aviso del simulador, acceso de revisión | Base del Hoy nuevo |
| Diseño de dos zonas del Hoy anterior (`Today.tsx`): zona oscura con una cifra grande y un botón, y panel blanco con una cifra, barras delgadas, una tarjeta y lo último | Se reutiliza como diseño del Hoy nuevo, con los datos del programa. `Today.tsx` no se modifica: sigue siendo el Hoy del simulador |
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
| Lista de pendientes | Bandeja | Hoy, como camino: tres experiencias a la vista y el resto al tocar «Ver mi camino» |
| Decididos y vencidos | Bandeja | Mi progreso |
| «Tu bitácora» | Mi perfil | Mi progreso, como «Actividad reciente» |
| Contador de pendientes | Icono de Bandeja | Deja de mostrarse (regla 63): Hoy no señala acumulación de trabajo |
| «Lo último que hiciste» | Panel blanco de Hoy | Mi progreso, dentro de «Actividad reciente» |
| Índice de experiencias en revisión (`/piloto`) | Página suelta por enlace | Academy, Nivel 1, cuando se aprueben. La dirección anterior sigue abriendo |
| Rejilla de 10 temas de Academy | Portada de Academy | Dentro de cada habilidad, como «Conceptos y teoría» |
| Glosario de la industria | Portada de Academy | Se conserva en Academy, como consulta |

### Se oculta, sin borrar

| Qué | Cómo queda |
|---|---|
| Pestaña Bandeja | Fuera del menú. La página y su dirección siguen funcionando |
| Informe del mes, juntas, crisis y cambio como asuntos de bandeja | Solo con el simulador encendido; con él apagado, el aviso de Hoy que ya existe lleva a resolverlos |
| Tablero de la empresa, etapa y misión del consejo en Hoy | Ya ocultos con el simulador apagado (3.3a) |
| Candado de lecciones por rango y XP | Se quita en Academy (regla 65): ningún candado depende del XP y la teoría se consulta siempre. El XP guardado no se toca y se sigue mostrando como constancia |

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
8. **El camino necesita una regla de orden que no existe.** Hoy la aplicación elige una sola propuesta. No hay una regla que entregue tres pasos en orden ni que use los prerrequisitos. Es la entrega 2.3 del plan. Primera versión propuesta: primero lo que quedó a medias; después las habilidades con sus prerrequisitos cumplidos, empezando por los temas que la persona eligió; y variedad entre academias para no encadenar tres pasos de la misma. El diagnóstico adaptativo (entrega 2.2) tampoco existe: hasta que exista, la ruta no parte de conocimientos previos medidos, sino de lo que la persona declaró y de su avance.
9. **Mientras el Nivel 1 no esté aprobado, el camino del resto de las cuentas sale del contenido anterior.** Esos casos llegan por calendario y tienen vencimiento. En el camino se mostrarían como experiencias, sin cifra de pendientes; si su vencimiento sigue a la vista es una decisión de Oziel (sección 11). Los candados por prerrequisito aplican a las experiencias del Nivel 1; con el contenido anterior, las dos siguientes se ven atenuadas y sin candado.
10. **«Completada» quiere decir terminada.** Es aprendizaje. No acredita la habilidad ni cuenta como dominio demostrado (regla 51).
11. **Retomar una experiencia es exacto solo en el mismo navegador,** hasta que sus intentos se guarden en el servidor (bloque C).

## 9. Orden de implementación

Cada etapa se publica completa y deja la aplicación coherente. Ninguna pantalla nueva sale con secciones vacías.

| Etapa | Qué se publica | Depende de | Entrega del plan |
|---|---|---|---|
| 1 | Menú de cuatro pestañas. Rutas equivalentes de la sección 4: lista completa de pendientes en Hoy, «Actividad reciente» en Mi progreso, salidas de los casos, textos, guía, Ajustes, correo de racha y página pública | Aprobación de este diseño | 3.6 y 3.4 |
| 2 | Hoy nuevo como camino: la experiencia activa y las dos siguientes (bloques B y C), el repaso (bloque D) y el bloque A en su versión de aprendizaje. Primera versión de la regla que ordena el camino. Guardar el paso de la lección | Etapa 1 | 3.3 y 2.3 |
| 3 | Academy por academia, nivel y habilidad con las 335 piezas, y el recorrido con sus cuatro estados. Teoría siempre consultable y sin candado por XP. Marca de calidad | Etapa 1; decisión sobre qué abre un candado y sobre quién califica la calidad | 3.5 |
| 4 | Experiencias del Nivel 1 en Academy para todas las cuentas, guardadas en el servidor, y el bloque E como hito al final del recorrido del nivel | Revisión de Oziel (3.0c), respuestas fuera del navegador (3.0m) y tablas nuevas autorizadas | 3.5, 3.8 |
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
3. Aviso de pendientes en el menú: con la regla 63 se propone no poner ninguno (antes se recomendaba un punto discreto sobre Hoy). Falta que Oziel lo confirme.
4. Candado de lecciones por rango y XP: resuelto por Oziel (regla 65). Se quita en Academy.
5. Marca de calidad de las 335 piezas: quién califica y con qué criterio.
6. «Tu bitácora»: moverla a Mi progreso como «Actividad reciente» (recomendado), o dejarla en Mi perfil.
7. El orden de las etapas, en particular si la etapa 1 se publica sola o junto con la 2.
8. Qué abre un candado mientras no haya evaluaciones validadas: terminar la experiencia de la habilidad previa (recomendado), o esperar a que la habilidad previa esté demostrada con una evaluación validada.
9. Qué hace un candado: impide empezar la experiencia hasta cumplir el prerrequisito (así está en la maqueta), o solo avisa que conviene hacer antes la otra y deja abrirla.
10. Qué abre el Executive Challenge: terminar las 24 experiencias del Nivel 1 (así está en la maqueta), o la propuesta que ya estaba anotada en el plan (cobertura en las seis academias y evidencia suficiente), que depende de evaluaciones validadas.
11. Casos del contenido anterior dentro del camino: mostrar su vencimiento de forma discreta, o no mostrarlo.

## 12. Archivos del programa que se tocan

Rutas dentro de `app/src/`. La lista incluye todos los archivos que hoy mencionan Bandeja; una prueba automática vigila que no falte ninguno.

| Archivo | Qué cambia | Etapa |
|---|---|---|
| `lib/ceo/metis2/menu.ts` | Bandeja sale de la lista del menú; cuatro columnas (seis con el simulador); el contador de pendientes deja de mostrarse en el menú | 1 |
| `components/ceo/CeoShell.tsx` | Dibuja el menú de cuatro, sin aviso de pendientes | 1 |
| `components/ceo/HoyAprendizaje.tsx` | Etapa 1: salen el enlace y el botón de Bandeja; la lista de pendientes se despliega completa. Etapa 2: el camino (la experiencia activa, las dos siguientes y la última completada) y los bloques A y D, con el diseño de dos zonas del Hoy anterior | 1 y 2 |
| `components/ceo/Progress.tsx` | Sale «Ver mi bandeja»; entra «Actividad reciente»; después, evidencias por habilidad | 1 y 4 |
| `components/ceo/Profile.tsx` | Sale «Tu bitácora» (pasa a Mi progreso) | 1 |
| `components/ceo/CaseView.tsx` | La salida del caso vuelve a Hoy o a la habilidad de Academy | 1 |
| `components/ceo/EpisodeView.tsx` | Un texto | 1 |
| `components/ceo/CeoSettings.tsx` | El texto del interruptor del simulador | 1 |
| `components/ceo/Trajectory.tsx` | Un texto (solo se ve con el simulador) | 1 |
| `lib/ceo/guide.ts` | Fichas de Hoy, de Empresa y la general; la ficha de Bandeja se conserva para su página | 1 |
| `lib/ceo/emails.ts` | El texto del correo de racha | 1 |
| `components/site/ceo-landing/content.ts` | Una etiqueta de la muestra de Hoy en la página pública | 1 |
| `lib/ceo/metis2/hoy.ts` | Regla del camino (la experiencia activa, las dos siguientes y la última completada) y reglas de repaso | 2 |
| `lib/ceo/types.ts` | Un dato nuevo para guardar el paso de la lección; nada existente cambia | 2 |
| `components/ceo/CeoAcademy.tsx` y las páginas de `app/ceo/academy` | Academy por academia, nivel y habilidad, con el recorrido de cuatro estados. Sale el candado por rango y XP | 3 |
| `lib/ceo/metis2/academias.ts` | Sin cambios: sus prerrequisitos se leen para ordenar el camino y para los candados | No cambia |
| `lib/ceo/metis2/clasificacion.ts` | Marca de calidad por pieza | 3 |
| `components/ceo/Today.tsx` | Sin cambios: es el Hoy del simulador y conserva sus enlaces a Bandeja. Su diseño sirve de modelo para el Hoy nuevo | No cambia |
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
- La maqueta de Hoy se rehízo con el diseño del Hoy anterior a petición de Oziel. Sus cifras (22 de 76 piezas, 9 de 24 experiencias, la racha y el XP) son ejemplos, no datos de una cuenta. Se comparó contra una captura del Hoy anterior, no contra la aplicación en funcionamiento.
- Las maquetas del camino (Hoy con la experiencia activa, las dos siguientes y una completada; el camino después de avanzar; el caso de continuar; y el recorrido de Academy en Finanzas) también son imágenes fijas con datos de ejemplo. Usan títulos, duraciones y prerrequisitos reales del programa, pero las cifras de avance (22 de 76 piezas, 3 de 24 experiencias, la racha y el XP) son ejemplos. Las animaciones no se ven en una imagen fija.
- No se construyó la regla que ordena el camino ni se cambió ningún candado: Academy publicada sigue bloqueando lecciones por rango y XP hasta la etapa 3.
- No se estimó el tiempo de cada etapa.
- No se convirtió ninguna experiencia nueva ni se cambió ninguna de las existentes.
