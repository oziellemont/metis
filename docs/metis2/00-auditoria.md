# MÊTIS 2.0 · Fase 0 · Auditoría del estado actual

Fecha: 12 de noviembre de 2026. Punto de partida: `main` en `b7de73c`.

Este documento responde a la Fase 0 del rediseño («Aprendizaje ejecutivo continuo» y adenda «Career Intelligence»): qué existe hoy, qué se oculta, qué se reutiliza y qué hay que construir.

## Cómo se hizo y qué alcance tiene

- Se leyó el código del proyecto: pantallas, rutas, interruptores, contenido, tablas, correos y avisos.
- Los conteos de contenido de la sección 3 salen de un programa (`app/scripts/inventario-metis2.test.ts`), no de memoria.
- **No se revisó:** la base de datos de producción (no hay acceso desde aquí), las pantallas una por una en el navegador, ni la configuración de Vercel. Lo que se dice de las tablas sale de los archivos de migración del proyecto, no de la base real.

## 1. Pantallas de mêtis CEO y qué les pasa

Menú actual: **Hoy, Bandeja, Empresa, Carrera, Academy.** Ranking y Personas ya estaban fuera del menú.

| Pantalla | Qué es hoy | Qué le pasa | Entrega |
|---|---|---|---|
| `/ceo` Hoy | Pendientes del día, misión del consejo y, a la derecha, salud de la empresa con cinco indicadores | Se rehace: «Tu criterio ejecutivo» con barra general y seis barras | 3.3 |
| `/ceo/bandeja` | Buzón de mensajes de los personajes de la empresa | Se convierte en Retos e Historial | 3.4 |
| `/ceo/empresa` | Resumen, Finanzas, Operación, Personas y Consejo de la empresa | Sale del menú; se conserva para el modo guardado | 3.6 |
| `/ceo/empresa/demo-crecimiento` | Demostración de empresa emergente | Se conserva, sin acceso desde la ruta nueva | 3.6 |
| `/ceo/carrera` | «Mi carrera» (capítulos de la empresa) y «Mi perfil» | Sale del menú; lo sustituyen Mi progreso y Mi perfil | 3.6 |
| `/ceo/perfil` | Hoy solo redirige a Carrera | Pasa a ser Mi perfil | 3.6 |
| `/ceo/academy` y `/ceo/academy/[id]` | 13 rutas y sus lecciones | Se reorganiza en seis academias con avance por unidad | 3.5 |
| `/ceo/ajustes` | Horario, avisos, moneda, vacaciones | Se conserva; se agregan preferencias de comunicación y pausa | 4.2, 4.3 |
| `/ceo/empezar` | Registro: nombre, experiencia, tipo de empresa, industria, carta | Se rehace sin empresa: situación, temas y diagnóstico | 2.1 |
| `/ceo/caso/[id]` | Un asunto de la empresa con sus opciones | Base del reto sin empresa propia | 3.1 |
| `/ceo/episodio/[id]` | Caso conversacional con inteligencia artificial | Base de la interacción inmersiva | 3.1 |
| `/ceo/personas` | Dilema del día | Su contenido alimenta los retos breves | 3.1 |
| `/ceo/reporte` | Cierre de periodo de la empresa | Modo guardado | 3.6 |
| `/ceo/junta` | Junta de consejo | Modo guardado | 3.6 |
| `/ceo/crisis` | Crisis cronometrada | Modo guardado; candidata a reto integrador | 5.1 |
| `/ceo/cambio` | Proyecto de cambio con palancas | Modo guardado | 3.6 |
| `/ceo/ranking` | Tabla de posiciones | Sigue oculta | fuera del plan |
| `/ceo/experiencia` | Preguntas de perfil para cuentas que ya existían | Se absorbe en Mi perfil | 3.6 |
| `/ceo/evaluacion-ia` | Herramienta interna para evaluar la inteligencia artificial de los casos | Se conserva | sin cambio |

También cambian la página de entrada pública (hoy se presenta como «Simulador de dirección») y la guía «?», que tiene textos para cada pantalla de la empresa.

Fuera de mêtis CEO, el mismo proyecto contiene mêtis Align (`/inicio`, `/scorecard`, `/equipo` y demás), mêtis Assess (`/assess`) y el Índice de alineación. **El rediseño no los toca.** Comparten proyecto, base de datos y servicio de correo, así que cada entrega debe comprobar que siguen funcionando.

## 2. Servicios internos

| Servicio | Para qué sirve | Qué le pasa |
|---|---|---|
| `/api/ceo/partida`, `/api/ceo/estado` | Guardar y leer el avance entre dispositivos | Se reutiliza |
| `/api/ceo/perfil` | Guardar el perfil profesional | Se amplía (temas, objetivos, CV) |
| `/api/ceo/pausa` | Vacaciones | Se adapta a la pausa de 14 días |
| `/api/ceo/responder`, `/api/ceo/episodio`, `/api/ceo/episodio/evaluar` | Llamadas a la inteligencia artificial | Se reutilizan para el tutor |
| `/api/ceo/push` | Avisos al celular | Se reutiliza |
| `/api/ceo/mundo` | Hechos reales | Se reutiliza como contexto de casos |
| `/api/ceo/interruptores`, `/api/ceo/eventos`, `/api/ceo/interes`, `/api/ceo/importar`, `/api/ceo/bienvenida` | Interruptores, medición de uso, interés por industrias, traer avance del navegador, correo de bienvenida | Se conservan; bienvenida cambia de texto |
| `/api/cron/ceo` | Envío diario de correos y avisos (12:00 UTC) | Se rehace el contenido de lo que envía |
| `/api/cron/recordatorios` | Recordatorios de mêtis Align | No se toca |

## 3. Contenido existente (conteos por programa)

| Tipo | Cantidad | Uso en MÊTIS 2.0 |
|---|---|---|
| Rutas de Academy | 13 | Se reclasifican en seis academias |
| Lecciones | 25 | Se conservan y se reclasifican |
| Conceptos | 51 | Base de la teoría corta |
| Dilemas | 98 | Retos breves |
| Empresas | 6 | Contexto de casos, ya no propiedad del usuario |
| Casos escritos por empresa | 144 | Casos aplicados |
| Tipos de decisión del banco | 28, con 3 variantes cada uno | Casos aplicados y de transferencia |
| Industrias con contexto escrito para el banco | 7 | Variedad de industria |
| Episodios conversacionales | 17 | Interacción inmersiva |
| Casos de crecimiento | 14 | Casos aplicados |
| Pasos de crisis | 3 | Candidato a reto integrador |
| Palancas del proyecto de cambio | 9 | Modo guardado |
| Casos del diagnóstico actual | 3 | Punto de partida del diagnóstico nuevo |
| Competencias del cálculo actual | 8 | Se sustituyen por seis academias y habilidades |

Todos estos identificadores quedaron grabados en `app/src/lib/ceo/metis2/legacy-ids.json`. La prueba `legacy.test.ts` falla si alguno desaparece o cambia de nombre.

**Lectura honesta del contenido:** casi todo está escrito para decisiones de dirección general. No hay preguntas de vocabulario ni de lectura de documentos (niveles 1 y 2) y solo hay 7 industrias con contexto escrito. La cobertura real por academia y nivel se medirá en la entrega 1.2.

## 4. Cómo se calcula hoy el dominio

- Hay 8 competencias (personas, estrategia, comunicación, ejecución, mercado, ética, negociación, finanzas) con valor de 0 a 100 y seis niveles con nombre en inglés.
- El valor sale de: decisiones (hasta 70), constancia entre empresas (hasta 10), empresas aprobadas y proyectos de cambio (hasta 10) y lecciones leídas (hasta 10).
- Los puntos y la racha ya van por separado.

Qué choca con el documento nuevo:

1. Dos de los cuatro componentes dependen de tener una empresa.
2. Leer lecciones suma dominio sin comprobar comprensión.
3. No se guarda cada evidencia: el dominio se recalcula cada vez a partir de la partida. El documento pide evidencias guardadas, con versión de rúbrica y nivel de confianza.
4. No hay vigencia, transferencia entre industrias ni habilidades más finas que la competencia.

Conclusión: el cálculo nuevo se construye aparte (entregas 1.3 y 1.4). El actual se queda como está para el modo guardado.

## 5. Selección de casos

El banco ya elige casos según lo no visto, las variantes pendientes y el área más floja del usuario. Depende de la empresa y de su «capítulo». Se reutiliza la lógica de prioridad; la dependencia de la empresa se sustituye por nivel, temas prioritarios, prerrequisitos y repaso (entrega 2.3).

## 6. Perfil y diagnóstico actuales

- Perfil de 5 preguntas: responsabilidad, áreas de experiencia, años, industria y objetivo.
- Diagnóstico opcional de 3 decisiones.
- Principio ya vigente y compatible con el documento nuevo: lo declarado cambia por dónde se empieza; solo lo demostrado cambia el dominio.

Falta: temas prioritarios (mínimo cinco), situación «en transición», diagnóstico de 12 a 18 reactivos por academia, resultado con nivel de confianza y todo lo relativo al CV.

## 7. Pausas y regreso

| Hoy | Documento nuevo |
|---|---|
| Vacaciones de hasta 60 días, 3 por temporada, más «días tranquilos» | Pausa de hasta 14 días por activación, sin encadenar |
| Pantalla de bienvenida tras 3 o más días de vacaciones o 7 o más días sin entrar | Diagnóstico de reincorporación tras más de 30 días sin práctica, sin contar la pausa |
| La pausa congela los plazos de la empresa | La pausa congela racha y recordatorios |

El cálculo de tiempo en pausa (`pausetime.ts`) se reutiliza. Los límites y la pantalla de regreso cambian (entregas 4.3 y 4.4).

## 8. Correos y avisos

| Correo | Quién lo firma hoy | Qué le pasa |
|---|---|---|
| Bienvenida | Presidente del consejo de la empresa | Se rehace, firma MÊTIS |
| Asunto nuevo | El personaje que escribe | Se sustituye por «Reto del día» |
| Recordatorio | Asistente de la empresa | Se sustituye por repaso oportuno |
| Regreso tras ausencia | Asistente de la empresa | Se sustituye por reincorporación |
| Cierre de periodo | Consejero de la empresa | Se sustituye por cierre semanal |
| Hecho real | «Operaciones» de la empresa | Se rehace, firma MÊTIS |
| Resumen | MÊTIS | Se adapta |
| Racha | MÊTIS | Se adapta |

Seis de ocho correos están firmados por personajes de la empresa. Los avisos al celular también usan el nombre de la empresa en el título. Existe un envío por WhatsApp apagado por configuración.

## 9. Datos guardados

Todo el avance de una persona vive en una sola fila de la tabla `ceo.players`: la partida completa en un campo, más puntos, racha, preferencias de aviso y datos del perfil. Tablas de apoyo: diario de jugadas, episodios y sus turnos, eventos de empresa, importaciones, suscripciones de avisos, medición de uso, bitácora y tope de gasto de inteligencia artificial, interruptores e interés por industrias.

Para el rediseño:

- Las evidencias y los intentos necesitan tablas propias; no caben bien dentro de la partida.
- No existe almacenamiento de archivos de usuarios. El CV lo necesita desde cero.
- Las migraciones del proyecto solo agregan y cada una tiene su archivo para deshacerla. Se mantiene esa regla.

Respaldo: `docs/sql/metis2_respaldo.sql` copia la fila completa de cada jugador a una tabla privada. Se probó en una base local con las migraciones reales del proyecto (copia, repetición, privacidad y recuperación). **No se ha corrido en producción.**

## 10. Interruptores existentes

Hay nueve: inteligencia artificial y su modo sombra, medición de uso, diario de jugadas, repetición sombra, episodios, carrera continua, empresa emergente y hechos reales. Funcionan a nivel general y por cuenta. Si la base no responde, quedan apagados.

Por decisión del 12 de noviembre, lo nuevo de MÊTIS 2.0 se publica encendido para todos, sin interruptor general. Cada pieza aparece en producción en cuanto está lista, junto al simulador, hasta que este sale del menú (entrega 3.6). En ese momento se construye el interruptor para **reactivar el simulador**, porque el documento exige que siga siendo recuperable.

## 11. Red de seguridad disponible

- 10 partidas completas grabadas (`golden/`): si un cambio altera cualquier resultado del simulador, la prueba falla.
- Lista de identificadores del contenido (nueva en esta fase).
- Revisión automática en cada cambio: tipos y pruebas.
- Respaldo de datos (nuevo en esta fase).

## 12. Qué se reutiliza para la adenda del CV

| Pieza pedida | Qué existe | Qué falta |
|---|---|---|
| Perfil | 5 preguntas guardadas | Puestos, formación, trayectoria, objetivos, temas |
| Cálculo de dominio | 8 competencias sin evidencias guardadas | Evidencias, tres estados, confianza y vigencia (1.3 y 1.4) |
| Selección de ruta | Prioridad por área floja dentro de una empresa | Ruta por temas, nivel y repaso (2.3) |
| Academy | Lecciones con avance por lección leída | Avance real por unidad (3.5) |
| Lectura de PDF o Word | Nada. Solo hay lectura de Excel, en mêtis Align | Todo |
| Generación de PDF o Word | Nada | Todo |
| Almacenamiento privado de archivos | Nada | Todo |
| Consentimiento para inteligencia artificial | Existe para comentar textos del simulador | Consentimiento propio para analizar el CV |
| Aviso de privacidad | Menciona a OpenAI solo para comentar textos del simulador | Ampliarlo antes del primer CV |

## 13. Hallazgos que requieren decisión

1. **Archivos que no son de la aplicación.** El repositorio contiene carpetas que la aplicación no usa y que no forman parte de MÊTIS. No se tocaron en esta fase. Queda pendiente decidir si se retiran y si el repositorio pasa a privado.
2. **Contenido para niveles 1 y 2.** No existe y es trabajo de redacción, no de programación.
3. **Aviso de privacidad.** Debe ampliarse y revisarse antes de encender el CV.
