# MÊTIS 2.0 · Plan por fases y lista de control

Documentos de origen: «MÊTIS 2.0 · Aprendizaje ejecutivo continuo» (noviembre de 2026) y la adenda «Career Intelligence, perfil profesional y CV evolutivo», con su flujo de exportación del CV vivo.

Este archivo es la referencia de avance. Se actualiza al cerrar cada entrega.

## Reglas de trabajo

1. **Una entrega a la vez.** Cada una tiene un resultado comprobable, sus pruebas y su reporte.
2. **Todo se publica encendido en producción** (decisión del 12 de noviembre de 2026). No hay interruptor general ni etapa «solo para una cuenta». Cada pieza nueva aparece en producción en cuanto está lista, junto al simulador de empresas, hasta que este sale del menú en la entrega 3.6.
3. **Producción siempre coherente.** Como todo sale encendido, ninguna entrega puede dejar una pantalla a medias. Si una pieza depende de otra que aún no existe, se publican juntas.
4. **Nada se borra.** El simulador, sus partidas, casos, personajes y motores se conservan. Los cambios en la base de datos solo agregan y cada uno lleva su archivo para deshacerlo.
5. **Lo nuevo tolera que la base aún no esté lista.** Los archivos de base de datos los corre Oziel en Supabase. Si una entrega llega a producción antes de que se corra su archivo, la aplicación debe seguir funcionando sin esa pieza.
6. **El historial anterior no se convierte en evidencia nueva.** Lo jugado en el simulador se conserva aparte.
7. **Cierre de fase con visto bueno.** Al terminar cada fase se reporta qué quedó hecho, qué se comprobó, qué no se pudo comprobar y qué queda pendiente.

### Instrucciones de Oziel al aprobar la Fase 0 (12 de noviembre de 2026)

8. **Tres cosas separadas.** Nivel general (continuo: 1, 2, 3… sin etapa final), dominio demostrado de cada habilidad y progreso hacia el siguiente nivel. Las seis academias están en todos los niveles; cada habilidad tiene sus evidencias, su dominio y su necesidad de repaso.
9. **Programa completo, no reclasificación.** El contenido existente se clasifica, pero el programa se construye: fundamentos reales en el Nivel 1 (conceptos, vocabulario, documentos, indicadores) y exigencia creciente hasta integración, pensamiento crítico, negociación y decisiones con incertidumbre.
10. **Dominio solo con evidencia suficiente.** Leer, acumular puntos o completar actividades no lo sube. El cálculo considera calidad del razonamiento, dificultad, transferencia, consistencia y evaluaciones sin ayuda.
11. **Respaldo antes de migrar.** Ninguna migración que cambie la estructura de progreso se corre sin el respaldo de producción ejecutado y verificado. El motor y sus pruebas se construyen primero, sin depender de la base.
12. **Repositorio.** Pasa a privado después de comprobar que GitHub, Vercel y SuperNinja siguen funcionando. Los archivos ajenos se inventarían con dependencias y riesgos; su limpieza va en un cambio aparte y autorizado. No se elimina nada sin comprobarlo.
13. **Prioridad.** Que MÊTIS enseñe. Los casos siguen siendo situaciones empresariales realistas, con personas, conversaciones, consecuencias y decisiones difíciles.
14. **Revisión después de fusionar.** Además de la revisión de cada propuesta, después de cada fusión se comprueba que la corrida de «Pruebas» sobre `main` termine bien y que la publicación en producción quede confirmada.

### Requisito de Oziel: MÊTIS Executive Challenge (12 de noviembre de 2026)

15. **Cada nivel cierra con una simulación ejecutiva integral: el MÊTIS Executive Challenge.** Es la principal evaluación de integración del nivel. No es un examen de opción múltiple: es un caso empresarial inmersivo, con decisiones conectadas, reportes, datos, conversaciones con personajes, negociación, consecuencias y una historia que cambia según lo que la persona decide. Integra las seis academias y su complejidad corresponde a lo enseñado en el nivel. Debe sentirse como la culminación del nivel y como un logro, no como un cuestionario final ni como una barrera: se puede pausar y reanudar, y si la persona todavía no está lista recibe una ruta clara de mejora y otra oportunidad con una simulación equivalente.

Idea guía que dio Oziel: una aplicación de idiomas presenta una unidad para aprender; MÊTIS presenta una empresa en problemas para demostrar lo aprendido. Subir de nivel debe significar algo.

Estado: registrado como tarea. No se ha construido nada. Sus entregas son 1.7, 1.8, 3.8, 3.9 y 5.7, y sus doce puntos están en la lista de control con la clave «EC».

### Instrucciones de Oziel al aprobar las entregas 1.1, 1.2, 1.3, 1.4 y 1.6 (12 de noviembre de 2026)

Deben quedar incorporadas antes de conectar el sistema nuevo al progreso real de los usuarios. La propuesta completa está en `05-ajustes-propuestos.md`.

16. **Executive Challenge con las seis academias.** Historia completa, decisiones encadenadas, documentos, personajes y consecuencias, con evidencia evaluable en las seis áreas. Aprobar una sola decisión no sustituye la comprobación de conocimientos. En niveles altos, sesiones más largas que se pueden pausar y reanudar.
17. **Carga y progresión razonables.** Medir cuántas actividades reales pide cada ascenso. Desde el Nivel 4 no todas las personas vuelven a acreditar las 52 habilidades: se separan habilidades troncales, de profundización y temas elegidos. Las seis academias siguen en todos los niveles.
18. **Aprendizaje inmersivo.** Nada de «teoría para leer y después preguntas»: situaciones, documentos, conversaciones, decisiones, explicación en contexto, nueva aplicación y repasos. Consultar teoría durante la práctica es normal; después hay una comprobación independiente y sin apoyo.
19. **Reglas de dominio con versión y sin validar.** Los nombres de los grados se aceptan de forma provisional. Los umbrales numéricos no están validados: se calibran con escenarios antes de darlos por definitivos. La velocidad no es motivo automático para invalidar una evidencia.
20. **Fundamentación académica (prioritaria).** Matriz de trazabilidad que relacione habilidades, objetivos y niveles con fuentes oficiales de Harvard Business School, Stanford GSB, MIT Sloan, Wharton e INSEAD, separando lo respaldado de lo que es decisión pedagógica propia. No se reproducen materiales protegidos.
21. **Reincorporación.** El nivel histórico nunca se borra. Tras más de 30 días, la persona puede practicar temporalmente en un nivel inferior sin perder el acreditado.
22. **Niveles 6 en adelante.** Cada nivel nuevo introduce objetivos nuevos, mayor complejidad, combinaciones nuevas de habilidades o especializaciones. No son las mismas 52 habilidades con otros casos.
23. **Auditoría editorial.** Muestra estratificada de 30 casos, de las seis academias y de distintos niveles, con contenido original y rúbricas propuestas.
24. **Candados técnicos.** La migración 1.5 no se ejecuta hasta verificar el archivo de respaldo y sus resultados en producción. Los 205 archivos ajenos no se borran. El repositorio pasa a privado solo después de confirmar el plan de Vercel y las publicaciones de SuperNinja.
25. **Orden.** Primero la propuesta de ajustes y el registro de qué cambia; mientras tanto sigue el trabajo de la especificación del diagnóstico y del diseño de las primeras experiencias del Nivel 1.

### Instrucciones de Oziel al entregar el Repositorio Académico v1.0 (12 de noviembre de 2026)

El paquete trae el Atlas de 52 habilidades, doce fuentes, seis experiencias del Nivel 1, el Executive Challenge del Nivel 1 y el estándar editorial. El detalle está en `06-repositorio-academico.md`.

26. **Nada del Repositorio Académico acredita por sí solo.** Sus materiales no acreditan dominio, no suben niveles y no agregan habilidades al CV hasta que las evaluaciones estén validadas.
27. **No se simplifica.** Las experiencias no se convierten en cuestionarios ni en preguntas de opción múltiple. Se conservan documentos, conversaciones, decisiones, teoría en contexto y evaluación independiente: se aprende mientras se explora, se decide, se reciben consecuencias y se vuelve a aplicar el concepto.
28. **Trazabilidad completa.** Cada pieza mantiene la cadena fuentes, competencias, experiencias y evaluaciones, y se distingue lo que viene del paquete de lo que se redactó o se añadió al convertir.
29. **Primero una piloto.** Se construye una experiencia completa, se comprueba en computadora y en celular, y Oziel revisa su calidad educativa y de interacción antes de integrar el resto. El 13 de noviembre de 2026 Oziel pidió convertir los lotes 02 y 03 y la revisión de la piloto no se había hecho (regla 32); integrar sigue queriendo decir entrar al menú, registrar evidencia o acreditar, y eso no se ha hecho.
30. **Estado por separado.** Cada reporte distingue lo importado, lo probado, lo revisado por una persona, lo publicado y lo validado con usuarios.
31. **Los archivos del paquete no se copian al repositorio mientras sea público.** Esta no es instrucción de Oziel: es una precaución de SuperNinja, porque el paquete trae las respuestas de las evaluaciones. Se guarda su huella para saber con qué versión se trabajó. Sí quedó en el repositorio, como parte de la aplicación, el contenido de la experiencia piloto, incluidas las respuestas de su variante. Oziel puede cambiar este criterio.

### Instrucciones de Oziel al entregar los lotes 02 y 03 (13 de noviembre de 2026)

32. **Los lotes 02 y 03 se convierten con el mismo formato de la piloto.** Oziel pide adaptar los dos paquetes al mismo diseño con el que MÊTIS presenta sus casos. Su mensaje da por hecho que el lote 01 ya estaba convertido completo, y no lo estaba: solo la piloto. Tampoco menciona la revisión de la piloto, que sigue pendiente. SuperNinja lo interpretó como permiso para convertir, no para integrar: las reglas 26 a 31 siguen vigentes, nada acredita, nada se simplifica y nada entra al menú hasta que Oziel revise. Si la intención era otra, se corrige.
33. **El plan de cambios se tiene que ver en la plataforma.** En especial: sale la pestaña de la empresa, entra el menú nuevo y el cuestionario corto al darse de alta.

## Fases y entregas

Estado: `[x]` hecho y publicado · `[ ]` pendiente.

### Fase 0 · Auditoría y preparación
- [x] 0.1 Inventario de pantallas, servicios, contenido, datos, correos y avisos, con el mapa de qué se oculta, se reutiliza o se construye. Ver `00-auditoria.md`.
- [x] 0.2 Red de seguridad: lista de identificadores del contenido que no se puede perder, con su prueba; archivo de respaldo de datos probado en una base local.

### Fase 1 · Cimientos
- [x] 1.1 Catálogo de las seis academias, sus habilidades, los niveles visibles 1 a 6+ y el catálogo de temas prioritarios, con versión. 52 habilidades con prerrequisitos, 41 temas, 8 formatos de actividad y la escala interna de dominio de 0 a 5.
- [x] 1.2 Clasificación de todo el contenido existente: una academia principal, hasta dos secundarias, habilidades y nivel, conservando identificadores. Incluye la medición de cobertura por academia y nivel.
- [x] 1.3 Registro de evidencias que no se reescribe: competencia principal y secundarias, dificultad, evidencia observable, calidad del razonamiento, transferencia, resultado, retroalimentación, fecha, versión de rúbrica y confianza. Construido y probado sin depender de la base de datos; todavía no recibe respuestas reales (eso llega con 1.5 y 3.1).
- [x] 1.4 Cálculo de dominio nuevo: dominio, confianza, vigencia y cobertura por habilidad; tres estados (declarado, en desarrollo, respaldado por evaluaciones); barra general con criterios públicos; protección contra repeticiones y atajos. Puntos y rachas no cuentan. Ver `04-dominio.md`. Construido y probado por separado; todavía no alimenta ninguna pantalla (eso llega con 1.5 y 3.3). Reglas en la versión 2: la rapidez de una respuesta ya no la descarta. Los umbrales siguen sin validar.
- [ ] 1.5 Estructura de datos nueva, con su archivo para instalarla y su archivo para deshacerla. En espera: no se prepara para producción hasta que Oziel corra y verifique el respaldo (`docs/sql/metis2_respaldo.sql`).
- [ ] 1.7 Executive Challenge en la matriz curricular: para cada nivel, qué objetivos de aprendizaje evalúa, qué habilidades de las seis academias cubre, cuántas decisiones tiene, qué apoyos, reportes y conversaciones incluye, y qué hace equivalentes a dos variantes. Pocas decisiones, situaciones sencillas y apoyo en los niveles iniciales; después, análisis financiero, escenarios, negociación, incertidumbre, conflictos entre áreas y decisiones de mayor alcance. Se agrega a `01-curriculo.md`. No depende de la base de datos.
- [ ] 1.8 Executive Challenge en el cálculo de dominio: el tercer criterio para pasar de nivel deja de ser «un reto integrador que cruce dos academias» (regla vigente, descrita en `04-dominio.md`) y pasa a ser el Executive Challenge del nivel, con las seis academias. Cada decisión deja su evidencia por habilidad; se evalúan comprensión, razonamiento, integración, anticipación de consecuencias y adaptación, no la opción elegida ni el resultado económico del caso. Si no se alcanza, queda el historial y se habilita otra variante. Cambia la versión de las reglas. No depende de la base de datos.
- [x] 1.6 Documento de currículo: habilidades, prerrequisitos, niveles y al menos cinco ejemplos progresivos por academia. Ver `01-curriculo.md`: qué se pide en cada nivel por habilidad, fundamentos del Nivel 1 y seis ejemplos por academia. Se adelantó a petición de Oziel.

- [x] 1.9 Propuesta de ajustes al cálculo de dominio y a la arquitectura curricular, con la tabla de qué cambia frente a la versión actual y la medición de la carga por nivel. Ver `05-ajustes-propuestos.md`. Es documento: espera el visto bueno de Oziel.
- [ ] 1.10 Matriz de trazabilidad académica (prioritaria): las 52 habilidades frente a fuentes oficiales de las cinco escuelas, con institución, curso o componente, fuente verificable, concepto y su conversión en actividad original. Las páginas oficiales de los cinco programas ya están consultadas. El Repositorio Académico aporta el Atlas con fuentes para las 52 habilidades: la correspondencia de identificadores (52 de 52) y la lectura de las doce fuentes están en `06-repositorio-academico.md`, con ocho observaciones de exactitud. Falta resolver esas observaciones y el detalle curso por curso.
- [ ] 1.11 Escenarios de calibración de los umbrales: diez personas de ejemplo con el resultado justo escrito antes de correr el cálculo, y comparación de valores (aciertos, días de espera, parte por academia).
- [ ] 1.12 Ajustes al cálculo y al currículo, después del visto bueno de 1.9: programa por nivel con troncales, profundización y temas elegidos; modos de aprendizaje y de comprobación en el registro de evidencias; nivel de práctica temporal; fichas de los niveles 6 en adelante. Cada cambio sube la versión de sus reglas. No depende de la base de datos.
- [ ] 1.13 Muestra estratificada de 30 casos para la auditoría editorial: cinco por academia, de los niveles que hoy tienen contenido, con texto original, clasificación y rúbrica propuesta.

### Fase 2 · Entrada: perfil, temas, diagnóstico y ruta
- [ ] 2.1 Registro corto: situación, experiencia, para qué se usa MÊTIS, al menos cinco temas prioritarios, frecuencia y minutos. Las cuentas existentes lo completan desde su perfil.
- [ ] 2.2 Diagnóstico de entrada adaptativo de 12 a 18 reactivos, con versión corta «Empezar ahora» y resultado provisional por academia con nivel de confianza.
- [ ] 2.3 Selección de la siguiente práctica según temas, brechas, prerrequisitos, repaso y variedad. «Hoy te recomendamos…» sin cerrar el acceso libre.
- [ ] 2.4 Calibración con tres perfiles de ejemplo (novato, gerente, directivo) y documento de especificación del diagnóstico.

### Fase 3 · Experiencia principal
- [ ] 3.0 Diseño de las primeras experiencias inmersivas de fundamentos del Nivel 1, en documento y antes de construir: situación, documentos, conversación, decisión, explicación en contexto, nueva aplicación y repasos, con su comprobación independiente. El Repositorio Académico v1.0 trae el diseño de seis; se trabaja en las entregas 3.0a a 3.0f.
- [x] 3.0a Repositorio Académico v1.0: lectura completa de los diez archivos, correspondencia de los 52 identificadores editoriales con el catálogo, lectura de las doce fuentes, trazabilidad del lote y ajustes técnicos necesarios. Ver `06-repositorio-academico.md`.
- [x] 3.0b Experiencia piloto EDIT-N1-002 «Hay utilidad; ¿por qué no hay efectivo?»: mensaje, dos documentos tocables, dos decisiones encadenadas con consecuencias, comprobación sobre los documentos, dato nuevo, respuesta escrita, concepto siempre a la mano y variante independiente con cifras por escribir. Entrada por enlace (`/piloto/utilidad-y-efectivo`), fuera del menú. No registra evidencia ni toca dominio, niveles o perfil. Probada con pruebas automáticas y recorrida en pantalla de computadora y de celular.
- [ ] 3.0c Revisión de Oziel de la piloto y de las experiencias convertidas (calidad educativa y de interacción) y respuesta a las observaciones editoriales de los paquetes. Nada entra al menú, registra evidencia ni acredita antes de esto.
- [ ] 3.0d Conversión de las otras cinco experiencias del lote (EDIT-N1-001, 003, 004, 005 y 006), con los tipos de interacción que piden: clasificar frases, diagrama de flujo, mapa de actores, orden de riesgos y mensaje en tres partes. Tres recorridos de prueba por experiencia (quien sabe, quien empieza y al azar).
- [ ] 3.0e Executive Challenge del Nivel 1: versión B y banco de variantes antes de usarlo como requisito de ascenso. Depende de 1.7, 1.8 y de las decisiones del documento 05.
- [ ] 3.0f Las habilidades restantes del Nivel 1, según el plan de producción del paquete. Eran 18; los lotes 02 y 03 traen el diseño de 12, así que quedan 6 sin diseño recibido.
- [x] 3.0g Lote 02 convertido: EDIT-N1-007 a 012 (una por academia), con el mismo formato de la piloto y actividades nuevas en el motor: señalar renglones de un documento, clasificar tarjetas, ordenar pasos, calcular con calculadora a la mano y redactar por partes. Cada una con su variante independiente. Índice por enlace en `/piloto`, fuera del menú. No registran evidencia ni tocan dominio, niveles o perfil. Lo escrito no se califica: queda en espera de revisión de una persona y por eso el resultado no da veredicto. Probadas con pruebas automáticas y recorridas en navegador, a tamaño de computadora y de celular, con un programa.
- [ ] 3.0h Lote 03 convertido: EDIT-N1-013 a 018. Avance: cinco de seis publicadas por enlace (013, 015, 016, 017 y 018), con el mismo formato y sin cambios en el motor. Falta EDIT-N1-014 (Finanzas): se convirtió, pero el archivo se perdió en un reinicio del entorno de trabajo antes de guardarse; para rehacerla con los textos exactos hace falta recibir otra vez el paquete del lote 03.
- [ ] 3.1 Reto sin empresa propia: la empresa y los personajes pertenecen al caso; las consecuencias se explican dentro del caso. Formatos: caso breve, caso aplicado, caso encadenado e interacción inmersiva.
- [ ] 3.2 Retroalimentación en seis partes: qué hiciste, qué consideraste bien, qué faltó, otra ruta defendible, qué aprendiste y revisar teoría.
- [ ] 3.3 Hoy nuevo: «Tu criterio ejecutivo» con la barra general y las seis barras; al tocar una barra se ve por qué avanzó.
- [ ] 3.4 Retos e Historial en lugar de Bandeja, con filtros por competencia, concepto, dificultad, industria y fecha.
- [ ] 3.5 Academy en seis academias, con avance real por unidad, teoría siempre disponible y práctica de recuperación.
- [ ] 3.6 Menú nuevo: salen Empresa y Carrera; entran Mi progreso y Mi perfil. El registro deja de pedir empresa. Interruptor para reactivar el simulador. Textos, guía «?» y página de entrada actualizados.
- [ ] 3.7 Tutor con inteligencia artificial que responde solo con la lección y los datos del caso, con respuesta de respaldo si falla.
- [ ] 3.8 MÊTIS Executive Challenge: la experiencia de cierre de nivel. Caso inmersivo con decisiones conectadas, reportes, datos, conversaciones con personajes, negociación y consecuencias; la historia cambia según las decisiones. La empresa pertenece al caso, no a la persona. Se puede pausar y reanudar. Varias variantes equivalentes por nivel. Se presenta como culminación y logro.
- [ ] 3.9 Reporte de nivel y ruta de mejora. Al completar un nivel: habilidades demostradas, aspectos por reforzar y conocimientos que se desbloquean. Si todavía no se alcanza: recomendaciones concretas de repaso y otra oportunidad con una simulación equivalente, sin repetir el nivel ni perder el historial.

### Fase 4 · Comunicación y hábito
- [ ] 4.1 Correos firmados por MÊTIS: reto del día, recomendación de Academy, repaso y cierre semanal, con tope de frecuencia.
- [ ] 4.2 Avisos al celular y preferencias de comunicación editables.
- [ ] 4.3 «Pausar MÊTIS» hasta 14 días: congela racha y recordatorios, muestra fecha de regreso y permite reanudar antes. Sin pausas encadenadas automáticas.
- [ ] 4.4 Regreso tras más de 30 días sin práctica: bienvenida y diagnóstico de reincorporación, con los casos límite (día 30, día 31, pausa, zona horaria, varios dispositivos). El nivel acreditado nunca baja; el diagnóstico indica qué reforzar y la persona puede practicar temporalmente con una exigencia menor.
- [ ] 4.5 Repaso espaciado: calendario de repasos por habilidad.
- [ ] 4.6 Hechos reales verificados como contexto de casos, separando la noticia real de la hipótesis del caso.

### Fase 5 · Calidad
- [ ] 5.1 Auditoría del banco de casos por nivel: respuestas obvias, sesgos de posición y de longitud, dificultad real y variedad de industrias. Casos nuevos donde falte cobertura, incluidos integradores y de transferencia.
- [ ] 5.2 Simulación de varias semanas de aprendizaje con distintos perfiles, y medición de las métricas de producto.
- [ ] 5.3 Comprobación de que el simulador se reactiva con sus partidas intactas y de que su historial sigue aparte.
- [ ] 5.4 Demostración en computadora y celular con dos recorridos de temas prioritarios distintos.
- [ ] 5.5 Revisión de costos de inteligencia artificial y de los respaldos.
- [ ] 5.6 Revisión final de los 12 criterios de aceptación, de los 12 puntos del Executive Challenge y reporte de pendientes.
- [ ] 5.7 Revisión de los Executive Challenge: que las variantes de un mismo nivel sean equivalentes, que no se evalúe lo que el nivel no enseñó (salvo que el caso dé la información), y que no se pueda aprobar por memoria ni por conseguir el mejor resultado económico del caso.

### Fase 6 · Perfil profesional y CV de entrada
- [ ] 6.1 Privacidad: consentimiento para el análisis con inteligencia artificial, almacenamiento privado, controles para actualizar, exportar y eliminar, plazo de conservación y texto legal actualizado.
- [ ] 6.2 Subir CV en PDF o Word, en el registro o después. Extracción y pantalla para revisar y corregir antes de guardar.
- [ ] 6.3 Modelo ordenado y con versiones del CV, única fuente para lo que se exporte.
- [ ] 6.4 Diagnóstico integrado: CV y perfil declarado, diagnóstico de conocimientos y casos, y objetivos con sus temas. Lo declarado ajusta la ruta, nunca asigna dominio.
- [ ] 6.5 «Actualicé mi trayectoria profesional»: cambio de puesto, empresa, función u objetivo, con propuesta de ajustes explicada que el usuario acepta o modifica.

### Fase 7 · CV vivo
- [ ] 7.1 Sugerencias de competencias desde el cálculo de dominio, cada una con sus evidencias.
- [ ] 7.2 Flujo de cuatro pasos en Mi CV: preparar, revisar competencias, previsualizar con cambios señalados, exportar.
- [ ] 7.3 Descarga en PDF con texto seleccionable y en Word editable, disponible siempre. Comprobación automática de que ambos dicen exactamente lo aprobado.
- [ ] 7.4 Plantillas: una profesional compatible con lectores automáticos de CV, y el intento de conservar el diseño original con aviso cuando no sea posible.
- [ ] 7.5 Versiones privadas: guardar, volver a una anterior, editar y eliminar.
- [ ] 7.6 Candados con pruebas: nada se agrega sin aprobación, la experiencia laboral original no se altera, y lo aprendido en simulaciones se describe como práctica evaluada en MÊTIS.

### Fase 8 · Demostración completa y cierre
- [ ] 8.1 Demostración de punta a punta de los ocho pasos de la adenda.
- [ ] 8.2 Repetición de las pruebas de candados y de regresión, incluido el simulador guardado.
- [ ] 8.3 Reporte final de pendientes.

## Lista de control

«CA» criterios de aceptación obligatorios, «EN» entregables de la sección 15, «AD» apartados de la adenda, «EX» flujo de exportación, «EC» MÊTIS Executive Challenge, «AJ» ajustes pedidos por Oziel al aprobar la primera parte de la Fase 1, «RA» Repositorio Académico.

| Núm. | Punto | Entrega | Estado |
|---|---|---|---|
| CA1 | Empezar a practicar sin crear ni nombrar una empresa | 3.1, 3.6 | Pendiente |
| CA2 | Cada reto etiquetado con academia, habilidades y nivel; su aprendizaje se recupera en Academy | 1.1, 1.2, 3.5 | En curso: catálogo listo y contenido existente clasificado; falta mostrarlo en Academy |
| CA3 | Las seis barras y la general usan la misma fuente en Hoy, Perfil y Academy | 1.4, 3.3 | En curso: existe un solo cálculo para las seis barras y la general; falta conectarlo a las pantallas |
| CA4 | Completar una lección sin demostrar comprensión no sube de nivel | 1.4 | En curso: el cálculo nuevo lo impide y hay pruebas que lo comprueban; en producción sigue el cálculo anterior hasta conectarlo (1.5, 3.3) |
| CA5 | Un profesional con diagnóstico sólido empieza arriba del Nivel 1, con evaluación provisional honesta | 2.2, 2.4 | Pendiente |
| CA6 | Las decisiones no modifican Caja, Margen, Clientes, Equipo ni Consejo | 3.1 | Pendiente |
| CA7 | No existen «Tomar el mando», «Gobernar la complejidad» ni Consejo como barreras | 3.6 | Pendiente |
| CA8 | Historial, teoría y retroalimentación accesibles y consistentes entre dispositivos | 1.5, 3.4 | Pendiente |
| CA9 | Correos y avisos hablan de retos de MÊTIS, no de subordinados propios | 4.1, 4.2 | Pendiente |
| CA10 | Pausa máxima de 14 días; diagnóstico al regresar tras más de 30 días | 4.3, 4.4 | Pendiente |
| CA11 | Partidas y simulaciones actuales recuperables | 0.2, 3.6, 5.3, 8.2 | En curso: red de seguridad lista |
| CA12 | Revisión de respuestas obvias, dificultad real, progresión entre industrias y estimación de dominio | 5.1, 5.2 | Pendiente |
| EN1 | Diagnóstico del estado actual con mapa de impacto por pantalla | 0.1 | Hecho |
| EN2 | Documento de currículo de las seis academias | 1.6 | Hecho: matriz y documento. El contenido que la llena se construye en 3.1, 3.5 y 5.1 |
| EN3 | Especificación y calibración del diagnóstico de entrada y de regreso | 2.4, 4.4 | Pendiente |
| EN4 | Rúbricas con versión y cálculo de dominio con evidencias y confianza | 1.3, 1.4 | En curso: registro y cálculo listos, con versión y confianza; cada evidencia guarda la versión de su rúbrica. Las rúbricas de cada actividad se escriben con el contenido (3.1, 5.1) |
| EN5 | Plan de migración sin pérdida, cambios reversibles y pruebas de regresión | 0.2, 5.3 | En curso: respaldo y pruebas listos |
| EN6 | Demostración de Hoy y Academy en computadora y celular, con dos recorridos | 5.4 | Pendiente |
| EN7 | Pruebas automáticas, métricas editoriales y simulación de varias semanas | 5.1, 5.2 | Pendiente |
| EN8 | Costos de inteligencia artificial, respaldos y alternativa si el tutor falla | 3.7, 5.5 | Pendiente |
| AD1 | CV opcional en el registro, con extracción y revisión del usuario | 6.2 | Pendiente |
| AD2 | Diagnóstico integrado con tres fuentes; lo declarado no asigna dominio | 6.4 | Pendiente |
| AD3 | Mi progreso, Mi perfil y Mi CV separados; historial anterior aparte | 3.6, 5.3, 7.2 | Pendiente |
| AD4 | Cada actividad evaluable registra los siete grupos de datos de la adenda | 1.3, 1.4 | En curso: el registro exige los siete grupos y rechaza lo incompleto; falta que las actividades lo llenen (1.5, 3.1) |
| AD5 | CV evolutivo: plantilla, edición, sugerencias con evidencia, aprobar o rechazar, descargar | 7.1 a 7.5 | Pendiente |
| AD6 | Cambio de puesto, empresa, función u objetivo, sin perder historial | 6.5 | Pendiente |
| AD7 | Privacidad y control del usuario sobre su CV | 6.1, 7.5 | Pendiente |
| AD8 | Auditoría de lo reutilizable y demostración completa de ocho pasos | 0.1, 8.1 | En curso: auditoría hecha |
| EX1 | Flujo de cuatro pasos: preparar, revisar, previsualizar, exportar | 7.2 | Pendiente |
| EX2 | Descarga disponible en cualquier momento | 7.3 | Pendiente |
| EX3 | Sugerencias desde competencias granulares; distinguir declarado, en desarrollo y respaldado | 1.4, 7.1 | En curso: el cálculo ya distingue los tres estados por habilidad; falta usarlos en el CV |
| EX4 | Conservar diseño cuando sea posible; plantilla alternativa compatible con lectores automáticos | 7.4 | Pendiente |
| EX5 | Modelo del CV con versiones como única fuente; PDF seleccionable y Word editable verificados | 6.3, 7.3 | Pendiente |
| EX6 | Lo no demostrado nunca se agrega solo; la experiencia original queda intacta | 7.6, 8.2 | Pendiente |
| EC1 | Cada nivel cierra con una simulación ejecutiva integral, principal evaluación de integración del nivel | 1.7, 3.8 | Pendiente |
| EC2 | Caso inmersivo y no examen de opción múltiple: decisiones conectadas, reportes, datos, conversaciones con personajes, negociación, consecuencias e historia que cambia según las decisiones | 3.8 | Pendiente |
| EC3 | Integra las seis academias | 1.7, 1.8, 3.8 | Pendiente |
| EC4 | Complejidad acorde al nivel; no se evalúa lo que no se pudo aprender, salvo que el reto incluya la información necesaria | 1.7, 5.7 | Pendiente |
| EC5 | Progresión: pocas decisiones, situaciones sencillas y apoyo al inicio; después análisis financiero, escenarios, negociación, incertidumbre, conflictos entre áreas y decisiones de mayor alcance | 1.7 | Pendiente |
| EC6 | El resultado no depende de escoger opciones correctas ni del mejor resultado económico ficticio; se evalúan comprensión, razonamiento, integración, anticipación de consecuencias y adaptación | 1.8, 3.8 | Pendiente |
| EC7 | Cada habilidad evaluada deja evidencia verificable en el cálculo de dominio | 1.8 | Pendiente |
| EC8 | Solo se avanza de nivel con evidencia suficiente de los objetivos de aprendizaje | 1.8 | Pendiente |
| EC9 | Si no se alcanza: recomendaciones concretas de repaso y otra oportunidad con una simulación equivalente, sin repetir el nivel ni perder el historial | 1.8, 3.9 | Pendiente |
| EC10 | Variantes equivalentes, para que memorizar respuestas no permita avanzar | 1.7, 3.8, 5.7 | Pendiente |
| EC11 | Reporte de cada nivel completado: habilidades demostradas, aspectos por reforzar y conocimientos que se desbloquean | 3.9 | Pendiente |
| EC12 | Se siente como culminación y logro, no como barrera frustrante: se puede pausar y reanudar, y hay una ruta clara de mejora | 3.8, 3.9 | Pendiente |
| AJ1 | Executive Challenge con las seis academias; una sola decisión no basta para aprobar | 1.7, 1.8, 3.8 | Propuesta escrita (1.9); espera visto bueno |
| AJ2 | Carga medida por nivel; desde el Nivel 4 no se vuelven a acreditar las 52 habilidades | 1.9, 1.12 | En curso: carga medida con pruebas; propuesta de troncales, profundización y temas elegidos espera visto bueno |
| AJ3 | Experiencias inmersivas en lugar de teoría y preguntas; comprobación independiente y sin apoyo | 1.12, 3.0, 3.1 | Propuesta escrita (1.9); espera visto bueno. Doce experiencias construidas con este formato (3.0b, 3.0g y 3.0h); esperan revisión |
| AJ4 | Reglas con versión; umbrales sin validar hasta calibrarlos; la velocidad no invalida | 1.4, 1.11 | En curso: la velocidad ya no descarta (versión 2); falta la calibración |
| AJ5 | Matriz de trazabilidad con fuentes oficiales de las cinco escuelas | 1.10 | En curso: el Atlas del Repositorio Académico da la matriz de las 52 habilidades; doce fuentes leídas, con ocho observaciones de exactitud por resolver |
| AJ6 | Reincorporación sin perder el nivel acreditado, con práctica temporal en un nivel menor | 1.12, 4.4 | Propuesta escrita (1.9); espera visto bueno |
| AJ7 | Niveles 6 en adelante con objetivos, complejidad, combinaciones o especializaciones nuevas | 1.12 | Propuesta escrita (1.9); espera visto bueno |
| AJ8 | Muestra estratificada de 30 casos para auditoría editorial | 1.13 | Pendiente |
| AJ9 | No ejecutar 1.5 sin respaldo verificado; no borrar los 205 archivos; repositorio privado solo tras confirmar Vercel | 1.5 | Vigente: nada de eso se ha hecho |
| AJ10 | Especificación del diagnóstico y diseño de las primeras experiencias del Nivel 1 | 2.4, 3.0 | En curso: diseño de 18 experiencias recibido y siete construidas; la especificación del diagnóstico sigue pendiente |
| RA1 | Revisar completos los diez archivos del paquete | 3.0a | Hecho |
| RA2 | Correspondencia de identificadores editoriales con las 52 habilidades | 3.0a | Hecho: 52 de 52, con prueba |
| RA3 | Revisión de exactitud de las fuentes | 3.0a, 1.10 | Hecho en parte: doce direcciones abiertas y leídas; no se comparó cada habilidad con el temario de cada curso |
| RA4 | Integración sin perder datos, historias, interacciones ni rúbricas; ajustes técnicos | 3.0a | Propuesta escrita: nueve ajustes en `06-repositorio-academico.md` |
| RA5 | Una experiencia piloto completa, con documentos, conversación, decisiones, teoría en contexto y evaluación independiente | 3.0b, 3.0g, 3.0h | Construida, y con ella las seis del lote 02 y cinco del lote 03; esperan la revisión de Oziel |
| RA6 | Funciona en computadora y en celular | 3.0b, 3.0g, 3.0h | Las doce experiencias, recorridas con un programa en navegador a 1280 × 800 y a 390 × 844; no en un teléfono físico ni con lector de pantalla |
| RA7 | No acredita dominio, no sube niveles y no agrega habilidades al CV | 3.0b, 3.0g | Vigente: ninguna experiencia registra evidencia y una prueba lo vigila |
| RA8 | No simplificar en cuestionarios ni opción múltiple | 3.0b, 3.0d, 3.0g | Vigente: las variantes piden cifras por escribir, clasificar, ordenar, señalar o redactar; ninguna es de opción múltiple. Lo redactado no se califica solo |
| RA9 | Tres recorridos de prueba por caso y validadores de cálculos y de largo de opciones | 3.0b, 3.0d, 3.0g, 3.0h | Hecho para las doce experiencias convertidas |
| RA10 | Modo de prueba editorial que no afecte a los usuarios | 3.0b | Hecho para las siete: rutas fuera del menú, con índice en `/piloto`; conviene una lista de cuentas revisoras |
| RA11 | Dos versiones del Executive Challenge antes de usarlo como requisito | 3.0e | Pendiente |
| RA12 | Reporte por separado: importado, probado, revisado por una persona, publicado y validado con usuarios | Todas | Hecho en `06-repositorio-academico.md`, apartado 12 |

Los 10 objetivos del usuario (sección 1 del documento) y la regla de producto se revisan en cada entrega: cada una indica a qué objetivo responde y con qué evidencia se comprueba.

## Fuera de este plan

- Comparación pública entre usuarios. El documento la plantea como opcional y secundaria, con grupos comparables y datos suficientes; hoy no hay base para armarlos. El ranking sigue oculto.
- Escenarios premium con el motor económico anterior. El motor se conserva; no se construye un producto nuevo encima.

## Pendientes de decisión

1. Cómo se aprueban los casos nuevos. Propuesta: lotes por academia con hoja resumen y revisión de una muestra.
2. Revisión legal del aviso de privacidad antes de la Fase 6.
3. Repositorio: Oziel prefiere pasarlo a privado. El inventario y la revisión están en `02-repositorio.md`. Falta que Oziel confirme su plan de Vercel (el plan gratuito puede no publicar desde un repositorio privado cuando los cambios los firma SuperNinja) y que autorice, por separado, la limpieza de los archivos ajenos.
4. Nombres de la escala interna de dominio (Sin evidencia, Inicial, En desarrollo, Demostrado, Consistente, Transferible). Oziel los aceptó de forma provisional el 12 de noviembre de 2026.
5. Umbrales del cálculo de dominio (`04-dominio.md`): cuántos aciertos, en cuántas situaciones, cuántos días de espera, qué parte de cada academia. Oziel indicó que no están validados: se calibran con escenarios (entrega 1.11) antes de darlos por definitivos y se revisan otra vez con datos de uso en la Fase 5. Revisar en especial los tres aciertos, las esperas de siete días, el 60 % por academia y los tiempos.
6. Respaldo de producción: falta que Oziel corra `docs/sql/metis2_respaldo.sql` en Supabase y confirme los dos conteos. Sin eso no se prepara la entrega 1.5.
7. Executive Challenge, puntos de diseño por resolver en 1.7 y 1.8:
   - Apoyo en los niveles iniciales. La regla vigente dice que una respuesta con ayuda no cuenta como acierto. Hay que separar el apoyo que forma parte del diseño del reto (cuenta) de la ayuda que la persona pide (no cuenta).
   - Cuándo se habilita. Propuesta: cuando ya se cumplen la cobertura en las seis academias y la evidencia suficiente, para que llegue como culminación y no como obstáculo.
   - Reintento. Cuánto se espera antes de otra oportunidad, qué repaso se pide antes y cuántas variantes hacen falta por nivel.
   - Niveles 7 en adelante. No tienen tope: hay que decidir cómo se generan retos de cierre nuevos sin repetir.
8. Las siete decisiones del apartado 13 de `05-ajustes-propuestos.md`: programa de 30 habilidades desde el Nivel 4, tronco común de los niveles 2 y 3, media barra por aprender y media por demostrar, regla de aprobación del Executive Challenge, niveles 6 en adelante solo con ficha y contenido nuevos, diagnóstico de reincorporación opcional u obligatorio, y habilidades de análisis de datos y de economía para decisiones.
9. Repositorio Académico, tras revisar la piloto (`06-repositorio-academico.md`):
   - Si la calidad educativa y de interacción de la piloto es la que se quiere para el resto del lote.
   - Variante de EDIT-N1-002: repite tres cifras de la práctica; quien contesta de memoria llega a 70 puntos, justo la regla provisional para pasar.
   - Nota de exactitud de EDIT-N1-002 (sobregiro de $10,000) frente a su tabla (saldo final de $5,000): la piloto sigue la tabla.
   - Cómo se comprueban las variantes que piden redactar (EDIT-N1-001, 003 y 005) sin depender de inteligencia artificial.
   - Qué fuente manda cuando la experiencia y el Atlas citan fuentes distintas, y si se añade la página de contabilidad de Harvard para las habilidades de vocabulario y estados financieros.
   - Cómo conviven el papel de asesor de las experiencias y el de director de empresa de la aplicación actual.
   - Si está de acuerdo con que los archivos del paquete queden fuera del repositorio mientras sea público, y con que el contenido de las experiencias convertidas (con las respuestas de sus variantes) esté dentro como parte de la aplicación.
   - Lote 01: solo está convertida EDIT-N1-002. Faltan EDIT-N1-001, 003, 004, 005 y 006 (entrega 3.0d).
   - Lote 02: llegó como un solo documento, sin manifiesto, sin rúbricas en archivo aparte y sin el archivo de QA y erratas que menciona. Los pesos de rúbrica se tomaron del texto de cada experiencia.
   - Quién revisa lo escrito. En cinco de las seis experiencias del lote 02 entre 20 y 60 puntos de 100 dependen de un texto. Hoy nadie los revisa: el resultado lo dice y no da veredicto. Hace falta decidir quién revisa y con qué pantalla.
   - Variante de EDIT-N1-008: repite dos cifras de la práctica ($30,000 y $48,000).

## Bitácora

| Fecha | Entrega | Qué se hizo |
|---|---|---|
| 12 nov 2026 | 0.1, 0.2 | Auditoría, lista de identificadores con su prueba y respaldo de datos probado en base local. El respaldo no se ha corrido en producción. |
| 12 nov 2026 | 1.1, 1.6 | Catálogo de aprendizaje y matriz curricular con su documento. Todavía no cambia ninguna pantalla ni toca datos. Los ejemplos de actividad son modelos de redacción, no actividades jugables. |
| 12 nov 2026 | Repositorio | Inventario de los archivos ajenos (205, sin borrar nada) y revisión de lo que implica pasar el repositorio a privado. Documento: `02-repositorio.md`. La limpieza y el cambio a privado esperan autorización. |
| 12 nov 2026 | Pruebas | Hallazgo: la revisión «Pruebas» pasó en las propuestas #188 y #189, pero la corrida posterior sobre `main` falló por tiempo agotado en una prueba lenta (sin error de contenido). Se subió el límite de tiempo a 20 segundos. Desde ahora, después de cada fusión también se revisa la corrida sobre `main`. |
| 12 nov 2026 | 1.2 | Clasificación de las 335 piezas del simulador (259 actividades evaluables y 76 de teoría) con academia, habilidades y nivel, sin cambiar identificadores. Medición de cobertura: de 268 casillas del currículo, 92 tienen al menos una actividad; los niveles 1, 5 y 6 no tienen ninguna. Documento: `03-clasificacion.md`. La clasificación es criterio editorial y falta revisar una muestra. |
| 12 nov 2026 | 1.3, 1.4 | Registro de evidencias que solo crece (anular conserva el original) y cálculo de dominio con reglas públicas y con versión. Construidos sin depender de la base de datos, con 79 pruebas propias. No cambian ninguna pantalla ni tocan datos: Hoy, Perfil y Academy siguen con el cálculo anterior. Los umbrales son un punto de partida sin datos reales. Documento: `04-dominio.md`. |
| 12 nov 2026 | Requisito nuevo | Oziel agrega el MÊTIS Executive Challenge: cada nivel cierra con una simulación ejecutiva integral de las seis academias. Queda registrado como tarea, sin construir: regla 15, entregas 1.7, 1.8, 3.8, 3.9 y 5.7, y doce puntos «EC» en la lista de control. La regla vigente del cálculo (reto integrador de dos academias) no se ha cambiado. |
| 12 nov 2026 | 1.9 y reglas versión 2 | Oziel aprueba 1.1, 1.2, 1.3, 1.4 y 1.6 y pide diez ajustes (reglas 16 a 25). Hecho: la rapidez deja de descartar respuestas (reglas versión 2); medición con pruebas de cuántos aciertos pide cada nivel (34 a 59 en el Nivel 1; 66 a 119 del Nivel 4 en adelante, donde cada ascenso vuelve a pedir las 52 habilidades); propuesta de ajustes en `05-ajustes-propuestos.md`. Consultadas las páginas oficiales de los cinco programas de referencia. No se cambió nada más del cálculo ni del currículo: espera visto bueno. No se ejecutó la migración 1.5 ni se borró ningún archivo. |
| 12 nov 2026 | 3.0a, 3.0b · Repositorio Académico | Oziel entrega el Repositorio Académico v1.0 (diez archivos) y pide una piloto antes de integrar el resto (reglas 26 a 31). Hecho: lectura completa; correspondencia de 52 de 52 identificadores; doce fuentes abiertas y leídas, con ocho observaciones; ficha de las seis experiencias del lote; experiencia piloto EDIT-N1-002 jugable por enlace, fuera del menú, que no registra evidencia ni toca dominio, niveles o perfil. Probada con pruebas automáticas y recorrida completa en pantalla de computadora y en pantalla del ancho de un celular. No se hizo: las otras cinco experiencias, el Executive Challenge, tablas en la base de datos, prueba en teléfono físico o con lector de pantalla, calibración de la rúbrica. Los archivos del paquete no se copiaron al repositorio. Documento: `06-repositorio-academico.md`. |
| 13 nov 2026 | 3.0g · Lote 02 | Oziel entrega los lotes 02 y 03 y pide convertirlos con el mismo formato de la piloto, además de seguir con los cambios de la plataforma (reglas 32 y 33). Hecho en esta entrega: las seis experiencias del lote 02 (EDIT-N1-007 a 012) jugables por enlace desde `/piloto`, fuera del menú; el motor ganó cinco actividades (señalar, clasificar, ordenar, calcular y redactar por partes) y variantes que no son de opción múltiple; ficha y trazabilidad de los tres lotes (18 experiencias, 16 fuentes). Probado: pruebas automáticas y recorrido con un programa en navegador, a 1280 × 800 y a 390 × 844, como quien sabe y como quien empieza. No se hizo: las cinco experiencias pendientes del lote 01, el lote 03, revisión de una persona, revisión de lo escrito, prueba en teléfono físico o con lector de pantalla, tablas en la base de datos. Nada acredita. Documento: `06-repositorio-academico.md`. |
| 13 nov 2026 | 3.0h · Lote 03 (cinco de seis) | Hecho: EDIT-N1-013 (Estrategia), 015 (Liderazgo), 016 (Operaciones), 017 (Crecimiento) y 018 (Riesgo y gobierno) jugables por enlace desde `/piloto`, fuera del menú, sin registrar evidencia. El motor y las pantallas no cambiaron. Probado: pruebas automáticas (identidades de QA del paquete 1.2 incluidas) y recorrido con un programa en navegador, a 1280 × 800 y a 390 × 844, como quien acierta y como quien se equivoca. No se probó en un teléfono físico ni con lector de pantalla; nadie ha revisado el contenido. Incidente: el entorno de trabajo se reinició desde una copia anterior y se perdió lo que no estaba guardado en el repositorio: la conversión de EDIT-N1-014 y la copia de trabajo de los paquetes. Cuatro de las cinco publicadas se recuperaron íntegras del registro de la sesión y una se recuperó de una lectura completa del archivo; EDIT-N1-014 solo se recuperó en parte y no se publica. Desde ahora cada avance se guarda en una rama del repositorio en cuanto pasa las pruebas. |
