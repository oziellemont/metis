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
| 7b | La IA interpreta bien el texto libre | Falta tu clic (ver §3) | | |
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
