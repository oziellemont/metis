# P0-D · Validación de los pilotos

Este paso revisa los tres pilotos (SuperNorte, Diego y el lote L-2291) contra los 15 chequeos de la arquitectura (§10). También mide la IA que interpreta las respuestas escritas y deja todo listo para tu aprobación.

## 1. Los 15 chequeos

Catorce chequeos son pruebas automáticas que corren en cada PR (`episodes/aceptacion.test.ts`), una vez por cada piloto. El 15 se revisa con capturas.

| # | Chequeo | SuperNorte | Diego | Lote L-2291 |
|---|---|---|---|---|
| 1 | Toda ruta tiene de 3 a 6 decisiones y cierra | Pasa | Pasa | Pasa |
| 2 | 2 consultas de datos; la tercera se rechaza; los datos críticos no gastan | Pasa | Pasa | Pasa |
| 3 | Un solo colaborador por caso; su voz no dicta la opción | Pasa | Pasa | Pasa |
| 4 | Al vencer los 180 s se bloquean las consultas, no la decisión | Pasa | Pasa | Pasa |
| 5 | Se puede decidir desde el segundo 0 | Pasa | Pasa | Pasa |
| 6 | Pausar detiene el reloj; recargar reconstruye la partida | Pasa | Pasa | Pasa |
| 7 | Texto libre: el respaldo sin IA nunca elige algo fuera de lo disponible | Pasa | Pasa | Pasa |
| 7b | La IA interpreta bien el texto libre | Pasa: 100% (ver §5) | | |
| 8 | Los personajes recuerdan lo que pasó | Pasa | Pasa | Pasa |
| 9 | Ninguna decisión intermedia mueve KPI; el cierre explica cada cambio | Pasa | Pasa | Pasa |
| 10 | Enseña un concepto, con lección y evidencia | Pasa | Pasa | Pasa |
| 11 | Dos rutas dan acuerdos, titulares y KPI distintos | Pasa | Pasa | Pasa |
| 12 | Los seguimientos llegan con fecha según lo que hiciste | Pasa | Pasa | Pasa |
| 13 | La lección se ofrece al cerrar, nunca antes | Pasa | Pasa | Pasa |
| 14 | No se pierde progreso (sincronización y diario) | Pasa | Pasa | Pasa |
| 15 | Móvil y escritorio | Capturas: `p0d_*_movil.png`, `p0d_*_escritorio.png` | | |

Hoy pasan 734 pruebas en total.

## 2. Evaluación de la IA: diseño

- **Interpretar respuestas escritas:** 180 respuestas escritas como las escribiría un jugador, 10 por cada uno de los 18 momentos de decisión. Cada una se manda 3 veces para medir consistencia.
- **Preguntas de datos:** 20 preguntas. Unas tienen dato, otras son de las que el caso no sabe y otras no tienen relación con el caso.
- **Colaborador:** 8 consultas, una por cada colaborador de los tres pilotos.
- **Modelo:** gpt-4o-mini, el mismo que usa la app.
- **Cálculo de costo:** el máximo es de unos $0.12 USD. El tope duro es de $0.50 por día y tiene su propio contador, aparte de los topes de la app. Cada llamada queda registrada en `ai_calls` con el propósito `episodio_eval`.

### Metas propuestas (para tu aprobación)

| Medida | Meta |
|---|---|
| Acierto al interpretar la respuesta escrita | 80% o más |
| Consistencia (las 3 repeticiones coinciden) | 90% o más |
| Respuestas inválidas (la app usa el respaldo) | 5% o menos |
| Acierto en preguntas de datos | 85% o más |
| Respuestas válidas del colaborador | 85% o más |

### Lo que ya sabemos sin gastar

- **Respaldo por palabras clave** (lo que usa la app si la IA falla): acierta 118 de 180 (65.6%). Nunca elige una opción que no esté disponible.
- **Preguntas de datos sin IA:** acierta 13 de 20.
- Por eso la IA solo tiene que mejorar lo que ya funciona. Si falla, el juego sigue.

## 3. Cómo correr la evaluación (un clic)

La llave de OpenAI vive solo en Vercel; desde mi entorno no se puede usar. Por eso hice una página que corre la evaluación del lado del servidor:

1. Entra con tu usuario.
2. Ve a **Ajustes**, activa el uso de IA y el **Modo prueba**.
3. Abre **«Evaluación de la IA de los casos»** y presiona **Correr la evaluación**.
4. Tarda unos 2 o 3 minutos. Al terminar verás la tabla con «Pasa / No pasa», el acierto por momento, los errores y un recuadro «Para copiar». Mándame ese texto.

En producción tu usuario ya tiene el interruptor `episodes` encendido (lo hizo `ponerse_al_dia_ceo.sql`). En Vercel deben existir `CEO_AI_ENABLED=1` y `OPENAI_API_KEY`.

## 4. Archivos

- `episodes/eval-set.ts`: las respuestas, preguntas y consultas de prueba.
- `episodes/eval-harness.ts`: coloca cada respuesta en el momento correcto del caso y califica.
- `episodes/eval-run.ts`: corre los trabajos, resume y compara contra las metas.
- `api/ceo/episodio/evaluar`: la ruta del servidor, con sesión, interruptor, consentimiento, topes y registro.
- `ceo/evaluacion-ia` y `EvalAi.tsx`: la página del botón y el reporte (solo en modo prueba).
- `episodes/eval.test.ts` y `episodes/aceptacion.test.ts`: las pruebas.

## 5. Resultado de la evaluación real (gpt-4o-mini)

| Medida | Resultado | Meta | Estado |
|---|---|---|---|
| Acierto al interpretar la respuesta escrita | 100% (180 de 180) | 80% | Pasa |
| Consistencia en 3 repeticiones | 100% | 90% | Pasa |
| Respuestas inválidas | 0% | 5% | Pasa |
| Calidad promedio asignada (0 a 3) | 2.31 | informativo | |
| Acierto en preguntas de datos | 45% (9 de 20) | 85% | No pasa |
| Respuestas válidas del colaborador | 87.5% (7 de 8) | 85% | Pasa |
| Costo real (568 llamadas) | $0.0486 USD | $0.50 | Pasa |

**Por qué fallaron las preguntas de datos.** La IA solo veía la pregunta sugerida de cada dato y era demasiado conservadora: en los 11 errores respondió «ninguno» y nunca eligió un dato equivocado. Para el jugador el efecto era leve, porque la pregunta no consumía consulta y el banco por palabras clave seguía respondiendo, pero la experiencia se sentía rígida.

**Ajuste.**
- Ahora la IA ve el tema de cada dato (sus palabras clave). Nunca ve la respuesta.
- La regla cambió: «ninguno» solo si la pregunta es ajena al caso.
- En la pantalla, la IA se consulta primero y el banco por palabras clave queda de respaldo. Antes era al revés, y el banco a veces elegía el dato equivocado: por ejemplo, «¿Quién autoriza un cambio de precio?» respondía con el piloto premium.

Hay que volver a correr la evaluación para confirmar la meta de datos. Cuesta unos $0.05.

## 6. Ronda 2: conversación adaptativa, aclaración obligatoria y validación separada

Estado: **integración y pruebas controladas**. Sigue en modo prueba (interruptor `episodes` apagado para el público). No hay visto bueno final.

### 6.1 Qué cambió en la conversación

Antes, el texto libre solo se clasificaba en una de las opciones del autor. Ahora la lectura tiene cuatro resultados:

| Lectura | Qué pasa en pantalla | Qué se compromete |
|---|---|---|
| **Clara** | «Lo que entendimos» y el jugador confirma | La estrategia, con sus consecuencias del motor |
| **Con propuesta propia** | Igual, y además «También propusiste: …». El caso no modela esa parte: el interlocutor la escucha, pero las consecuencias se calculan con la acción principal | La estrategia; lo extra queda registrado |
| **Ambigua** | «Antes de decidir, aclara»: una pregunta neutral y las opciones posibles. El jugador elige o reescribe | **Nada** hasta que elija |
| **Fuera de tema** | Se le pide que diga qué haría | **Nada** |

Una interpretación ambigua nunca llega al motor: `decideFrom` devuelve nulo y hay prueba de eso.

**Respuesta adaptada.** El personaje reacciona a lo que el jugador escribió. La IA recibe la respuesta que escribió el autor para esa opción y la reescribe para retomar algo concreto de las palabras del jugador. El sentido, los hechos, las cifras y el desenlace no cambian. El motor la acepta solo si se cumplen dos condiciones:
- no trae cifras que no estén en la respuesta del autor, en lo que le dijeron o en sus términos;
- salió de la misma respuesta del autor que el motor habría dado.

Si falla cualquiera de las dos, se muestra la del autor. Las dos versiones quedan guardadas.

**Transiciones adaptativas.** La IA también lee el tono de lo que escribió el jugador, separado de la opción que eligió:
- +1 si fue respetuoso o escuchó;
- −1 si fue hostil, despectivo o amenazante.

El tono mueve la confianza un punto, y la confianza ya decide qué pasa después. En Diego, por ejemplo, con las mismas cuatro decisiones:
- dichas con escucha, el caso cierra con Diego;
- dichas con desprecio, la confianza cae y Don Ramiro termina llamando (una escena más).

Hay prueba de esto en el motor. La página de evaluación lo demuestra con la IA real en tres conversaciones completas.

Los límites no cambian: la IA no crea hechos ni cifras, no decide por el jugador y no altera KPI ni consecuencias. La evidencia de una respuesta escrita sigue marcada como «provisional».

### 6.2 Dos conjuntos separados

- **Desarrollo** (`eval-set.ts`): las 180 respuestas, 20 preguntas de datos y 8 consultas con las que se ajustaron los prompts.
- **Validación final** (`eval-validacion.ts`):
  - 93 respuestas escritas después de congelar el diseño: 68 claras con otras palabras, 11 con propuestas que el caso no contempla, 10 ambiguas, 4 fuera de tema (una intenta manipular a la IA) y 8 con tono marcado;
  - 29 preguntas de datos: existentes con otras palabras, datos que no existen, preguntas ambiguas y temas ajenos;
  - 27 consultas a colaboradores: tres por persona (una normal, una que le pide elegir por el jugador y una sobre algo que nadie sabe).

Hay pruebas que verifican que ninguna frase de validación está en el conjunto de desarrollo ni en los prompts. Si una ronda de validación obliga a cambiar un prompt, esas frases pasan a desarrollo y se escriben nuevas para validar.

### 6.3 Metas (se juzgan en validación)

| Medida | Meta |
|---|---|
| Interpreta bien (clara/propia → opción correcta; ambigua → pregunta; fuera → no compromete) | ≥ 95% |
| Misma lectura en 3 corridas | ≥ 95% |
| Respuestas inválidas | ≤ 2% |
| Ambiguas o fuera de tema que comprometieron una decisión (en cualquier corrida) | 0 |
| Datos: elige el correcto | ≥ 95% |
| Datos: mostró un dato real distinto al que pidió | 0 |
| Datos inventados que llegan al jugador | 0 (estructural: el texto siempre sale del banco) |
| Colaborador útil, sin recomendar ni inventar | ≥ 95% |

**Colaborador.** Una respuesta solo cuenta si cumple dos cosas:
1. Pasa la validación automática: sin cifras nuevas y sin recomendaciones directas («te recomiendo», «yo que tú», «deberías aceptar…»).
2. Un auditor, que es otra llamada a la IA, confirma que no recomienda una opción, no inventa información y sí responde.

**Informativas:** cuántas respuestas se adaptaron, cuántas retoman palabras del jugador, el tono detectado, las propuestas propias reconocidas y cuántas veces preguntó de más.

Costo estimado de todo: unos $0.30 como máximo. Lo real suele ser mucho menos: la ronda anterior costó $0.05. El tope es de $0.50 por día.

### 6.4 Cómo correrla

En **Evaluación de la IA de los casos** hay dos botones:
- **Validación final y demostración**: es el que cuenta para las metas y trae las tres conversaciones completas.
- **Conjunto de desarrollo**: es la nueva corrida de datos después del ajuste de la sección 5. También trae las 180 respuestas.

Cada uno da su recuadro «Para copiar».

## 7. Ronda 3: dos pasos, reglas que protegen al jugador y validación nueva

Estado: **integración y pruebas controladas**. Sigue en modo prueba. No hay visto bueno final.

### 7.1 Diagnóstico honesto de la ronda 2 (validación real con gpt-4o-mini)

| Medida | Resultado | Meta | Causa encontrada |
|---|---|---|---|
| Interpreta bien | 92.5% | ≥ 95% | Ambiguas al 40%: 3 se comprometieron y 3 dieron respuestas inválidas por un formato demasiado estricto |
| Consistencia | 97.8% | ≥ 95% | Pasa |
| Inválidas | 3.6% | ≤ 2% | Formato estricto: una ambigua con opciones mal escritas se descartaba entera |
| Datos | 62.1% | ≥ 95% | La IA contestaba «ninguno» de más: solo veía el título de cada dato, no su contenido. Además, cuando decía «ninguno», la pantalla caía a las palabras clave (error real, corregido) |
| Colaborador | 55.6% | ≥ 95% | Sugería acciones («te recomendaría», «es fundamental actuar»); el filtro solo atrapaba las formas más directas |
| Tono | 5 de 8 | — | Sesgo hacia +1: el guion de Diego con tono duro sacó +1 en todo, confianza +3 y nunca llegó a Don Ramiro. **La demo no mostró adaptación por tono** |
| Reacción adaptada | — | — | A veces contradecía el desenlace: en alérgeno, «Retiramos el producto» se leyó como retiro parcial y la respuesta hizo una pregunta nueva; en d5 dijo «1 pt» cuando el autor decía 3 |

### 7.2 Qué cambió

**Dos pasos, como en la pantalla.**
1. *Interpretar*: la IA solo dice qué entendió (y ya no ve las respuestas del autor).
2. *Adaptar*: cuando el jugador confirma, el motor calcula la respuesta real (con la estrategia, los términos y el tono reales), la IA la reescribe para reaccionar a sus palabras y el motor la vuelve a revisar.

La adaptación se acepta solo si:
- conserva todas las cifras del autor y no agrega ninguna;
- no hace preguntas nuevas;
- conserva al menos la mitad de las palabras clave del autor, y un tercio en cada línea.

Si falla, se muestra la del autor. El caso «1 pt contra 3 pts» ya no pasa; hay prueba.

**Reglas deterministas para lo ambiguo.** La IA ahora devuelve también la opción «rival» y la cita textual que la descarta. Se pregunta (nunca se decide) si:
- hay rival y no hay cita real del jugador que lo descarte;
- el texto pospone la decisión («ya veré», «depende», «en su momento», «lo que resulte»…);
- la IA dijo «varias» aunque haya dado mal las opciones (antes eso era inválido).

El nombre de la lectura cambió a «encaje» para evitar el choque entre «parcial» (lectura) y «parcial» (estrategia del alérgeno).

**Tono con evidencia.** Solo cuenta si la IA copia las palabras exactas del jugador que lo muestran. El prompt dice que es 0 casi siempre y que el sarcasmo es −1. Al aclarar una ambigua, el tono se conserva.

**Datos.** La IA ve de qué trata cada dato con las cifras enmascaradas (#). «Ninguno» explícito ya no cae a las palabras clave. Clasificar es a temperatura 0.

**Colaborador.**
- Prompt nuevo: dice qué sabe y qué le preocupa, nunca qué hacer; tampoco «habla con…» ni «consulta a…».
- Filtro ampliado con lo que marcó el auditor.
- Si el primer intento aconseja, se reintenta una vez; si vuelve a aconsejar, se usa el texto del autor.
- Al auditor se le precisó que explicar un riesgo o una obligación no es recomendar.

**Una sola tubería.** Producción y evaluación llaman a las mismas funciones (`runInterpret`, `runAdapt`, `runFact`, `runAdvisor`); la evaluación solo inyecta la llamada y cuenta el costo.

### 7.3 Conjuntos

- **Desarrollo**: `eval-set.ts` + `eval-dev-ronda2.ts`. La validación de la ronda 2 se usó para diagnosticar, así que pasó a desarrollo.
- **Validación ronda 3** (`eval-validacion.ts`), escrita después de cerrar los prompts:
  - 106 respuestas: 74 claras, 10 con propuesta propia, 17 ambiguas (incluye las que posponen) y 5 fuera de tema; 11 con tono marcado (5 respetuosas, 6 hostiles o sarcásticas);
  - 28 preguntas de datos;
  - 36 consultas a colaboradores, cuatro por persona: normal, le piden elegir, algo que nadie sabe y una pregunta abierta («¿qué te preocupa?»), que es donde más fácil se cae en aconsejar.
- **Demostración**: tres guiones nuevos:
  - Diego con escucha;
  - Diego con la misma intención, pero con sarcasmo y desprecio explícitos;
  - alérgeno con una respuesta ambigua y propuestas propias.

Hay pruebas de que ninguna frase de validación está en desarrollo (ni de la ronda 1 ni de la 2) ni en los prompts.

### 7.4 Nuevas medidas (informativas)

- Adaptación que pasó la regla del motor.
- Adaptación fiel según un auditor: mismo desenlace, nada agregado. Este auditor solo corre en validación.
- Cuántas adaptaciones reaccionan a algo concreto del jugador.
- Tono acertado y **tono puesto donde no había** (falso positivo).
- En la demostración: la cita que mostró el tono y si el camino se desvió del guion.

Costo estimado conservador de ambos botones: $0.48. El tope sigue en $0.50 por día. Para no rebasarlo, en desarrollo se adapta una de cada dos respuestas; en validación se adaptan todas.

## 8. Ronda 4: no comprometer lo que se pospone, datos comparativos, colaborador con motivo y reacción real

Estado: **integración y pruebas controladas**. Sigue en modo prueba. No hay visto bueno final.

### 8.1 Diagnóstico honesto de la ronda 3 (validación real con gpt-4o-mini)

| Medida | Resultado | Meta | Causa encontrada |
|---|---|---|---|
| Interpreta bien | 95.3% | ≥ 95% | Pasa |
| Consistencia | 100% | ≥ 95% | Pasa |
| Inválidas | 0% | ≤ 2% | Pasa |
| Ambiguas que se comprometieron | 3 | 0 | La regla de «pospone» solo se revisaba si la IA nombraba un rival; con «ya lo veremos» la IA no lo nombró y la regla nunca corrió. Además, «lo necesario a quien corresponda» y «hay que sacar el producto» no dicen alcance |
| Datos | 89.3% | ≥ 95% | Tres preguntas comparativas o de impacto («¿quién vende más?», «¿qué tan grave es?») se contestaron «ninguno» aunque un dato sí respondía |
| Inventa datos | 0 | 0 | Pasa |
| Colaborador | 63.9% | ≥ 95% | 11 respuestas descartadas por la validación automática sin registrar por qué; 2 recomendaron («cualquier propuesta debe alinearse…», «tú decides cómo abordar esto» tras aconsejar) |
| Reacción adaptada | 21 de 85 reaccionan | — | La mayoría devolvía la respuesta del autor idéntica o solo con otras comillas |
| Demo Diego duro | — | — | Con confianza −3, Diego respondía «Ok. Es justo», que contradice la relación |

Tropiezo operativo: el tope de $0.50 se alcanzó aunque la corrida costó ~$0.22. El tope es por día y suma todas las corridas (incluidas las de prueba previas del mismo día).

### 8.2 Qué cambió

**Ambiguas.** La regla «pospone» ahora se aplica siempre, aunque la IA no nombre rival. Se ampliaron los patrones («sobre la marcha», «mañana lo decido», «cualquiera de las dos», «la que me acomode», «según lo vea»…), revisados contra todos los conjuntos sin falsos positivos en respuestas claras. El prompt aclara que la estrategia se decide por el contenido (no por la forma: entregar hechos con hostilidad sigue siendo «hechos», y la hostilidad va al tono) y que un texto que no dice alcance, quién paga o a quién («lo necesario», «a quien corresponda») es «varias».

**Datos.** Si la pregunta compara, evalúa o pide el impacto y un dato trae esa información, se elige ese dato. «Ninguno» queda para lo ajeno al caso o para información que ningún dato contiene.

**Colaborador.** Cada rechazo ahora guarda su motivo (formato, corta, cifra, elige, instrucción, opción) y aparece en el reporte. El reintento dice exactamente qué falló («dijiste "debe alinearse", que suena a instrucción; dilo como preocupación tuya»). Se permiten las cifras que trae la pregunta del jugador o la ficha del colaborador. El filtro atrapa «yo haría», «hay que sancionar/comunicar», «deberíamos/tenemos que…». Informar una obligación («la ley obliga a…») sigue permitido.

**Reacción adaptada.** La IA escribe primero una frase de reacción a una palabra o al tono del jugador y luego la integra. Una respuesta idéntica a la del autor ya no cuenta: si la reacción vino aparte, se antepone; si no, se reintenta una vez y si falla se muestra la del autor. El reporte cuenta cuántas salieron idénticas.

**Diego.** «Validar» con confianza ≤ −1 tiene su propia respuesta («Diego aprieta la mandíbula…»).

**Costo.** La pantalla muestra lo gastado hoy y el mensaje del tope explica que suma todas las corridas del día y se reinicia a la medianoche de Monterrey. En desarrollo se adapta una de cada 3 respuestas. Estimación conservadora: validación + demos $0.19; desarrollo $0.45. **Cada botón cabe solo en el tope, pero los dos juntos no: córranse en días distintos.**

### 8.3 Conjuntos

- **Desarrollo**: `eval-set.ts` + `eval-dev-ronda2.ts` + `eval-dev-ronda3.ts` (la validación de la ronda 3 se usó para diagnosticar, así que pasó a desarrollo). 379 respuestas, 77 datos, 71 consultas.
- **Validación ronda 4** (`eval-validacion.ts`), escrita después de cerrar los prompts: 107 respuestas (74 claras, 10 con propuesta propia, 17 ambiguas, 6 fuera de tema; 5 respetuosas y 6 hostiles), 28 preguntas de datos, 36 consultas a colaboradores y tres demostraciones (Diego con respeto, Diego duro, alérgeno con ambigua).
- Hay pruebas de que ninguna frase de validación está en desarrollo (rondas 1, 2 y 3) ni en los prompts.

### 8.4 Cómo correr

1. Primero **Validación final (ronda 4)** (incluye las demostraciones). Copia el texto completo.
2. **Desarrollo**, otro día (o después de la medianoche de Monterrey).

## 9. Ronda 5: señales de alcance, datos que no existen, colaborador sin consejos heredados y reacción sin elogios

### 9.1 Diagnóstico honesto de la ronda 4 (validación real con gpt-4o-mini, $0.105)

| Medida | Resultado | Meta | |
|---|---|---|---|
| Interpretación | 96.3% | ≥95% | pasa |
| Consistencia | 99.1% | ≥95% | pasa |
| Inválidas | 0 | ≤2% | pasa |
| Datos inventados mostrados | 0 | 0 | pasa |
| Ambiguas comprometidas | 4 | 0 | **no pasa** |
| Datos | 82.1% (1 equivocado) | ≥95% | **no pasa** |
| Colaborador | 88.9% | ≥95% | **no pasa** |

- **Ambiguas.** Las cuatro que se comprometieron no decían lo que distingue a dos estrategias parecidas: alcance («donde haga falta»), destinatario («a quien haga falta»), quién paga («lo del proveedor lo resolvemos después») o quién da seguimiento («como mejor convenga»). En la demo, «Saquen el producto de circulación lo antes posible» se leyó como retiro total sin preguntar.
- **Datos.** Cuatro de cinco fallos fueron «ninguno» ante datos que no existen (sucesión, oferta de la regional) o preguntas de impacto y alternativas. Uno fue un dato equivocado: «¿qué tanto nos aprieta lo que pide Sofía?» se respondió con sus metas, no con el costo.
- **Colaborador.** Tres rechazos automáticos (instrucciones y una cifra calculada: 5,400 = 30% de 18,000) y uno del auditor: Mariana recomendaba porque su punto de vista escrito decía «Mi recomendación es…».
- **Reacción adaptada.** Agradeció o elogió ante tono hostil, tomó sarcasmo al pie de la letra y agregó moralejas.

### 9.2 Qué cambió

**Señales por estrategia (regla determinista).** Las estrategias que se distinguen de otra parecida por alcance, destinatario o quién paga tienen `cues`: retiro total contra parcial; alerta pública contra aviso privado; absorber contra reclamar; tablero, como siempre o lo llevo yo. Si la IA elige una de ellas y el texto no trae ninguna de sus señales, se pregunta entre las parecidas (`guard: "senal"`). Hay una prueba de que toda respuesta clara o parcial de todos los conjuntos trae su señal, y de que las cinco ambiguas del diagnóstico se preguntan.

**«Pospone» ampliado.** «lo resolvemos después», «como mejor convenga», «donde/a quien haga falta», «a quien corresponda», «como me lata», «en el orden que vaya saliendo». Revisado contra todos los conjuntos: ninguna respuesta clara lo activa.

**Datos.** Reglas nuevas en el clasificador: lo que todavía no se sabe o lo que otro ofreció va al dato «?» de ese tema; «¿hay otra cadena…?» va a alternativas; «¿qué tanto nos aprieta…?» va al costo, no al porqué. Si la IA dice «ninguno» pero la pregunta trae las palabras de un dato que no existe, se le dice al jugador que ese dato no existe (seguro: nunca se rescata un dato real así). Se ampliaron las palabras de los tres datos inexistentes, revisadas contra todas las preguntas.

**Colaborador.** Su punto de vista llega a la IA sin frases de instrucción («Mi recomendación es que…» pasa a «A mí me importa que…»; «Tú decides», «Mándame una nota» se quitan); la pantalla sin IA no cambia. Prohibido calcular o derivar cifras y cerrar con «la decisión es tuya» después de dar una postura. Nuevas formas de aconsejar que se rechazan: «nos conviene», «yo esperaría», «no esperes», «asegúrate de», «mi postura es que».

**Reacción adaptada.** Con tono hostil o sarcástico no agradece, no elogia ni toma el sarcasmo literal; nunca moralejas.

**Tono.** El intérprete reconoce hartazgo («ya estuvo bueno») y apodos despectivos («el junior», «berrinches») como −1.

**Costo.** En desarrollo cada respuesta se corre 2 veces (en validación, 3). Estimación conservadora: validación + demos $0.21; desarrollo $0.45. Cada botón cabe solo en el tope diario de $0.50, pero no los dos el mismo día.

### 9.3 Conjuntos

- **Desarrollo**: `eval-set.ts` + rondas 2, 3 y 4 (`eval-dev-ronda4.ts` es la validación de la ronda 4, ya usada para diagnosticar). 486 respuestas, 105 datos, 107 consultas.
- **Validación ronda 5** (`eval-validacion.ts`), escrita después de cerrar prompts y reglas: 118 respuestas (78 claras, 11 con propuesta propia, 21 ambiguas, 8 fuera de tema; 7 respetuosas y 7 hostiles), 28 preguntas de datos, 36 consultas y tres demostraciones con frases nuevas.
- Hay pruebas de que ninguna frase de validación está en desarrollo (rondas 1 a 4) ni en los prompts.

### 9.4 Cómo correr

1. **Validación final (ronda 5)** (incluye las demostraciones). Copia el texto completo.
2. **Desarrollo**, otro día (o después de la medianoche de Monterrey).
