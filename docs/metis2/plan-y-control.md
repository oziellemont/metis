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

## Fases y entregas

Estado: `[x]` hecho y publicado · `[ ]` pendiente.

### Fase 0 · Auditoría y preparación
- [x] 0.1 Inventario de pantallas, servicios, contenido, datos, correos y avisos, con el mapa de qué se oculta, se reutiliza o se construye. Ver `00-auditoria.md`.
- [x] 0.2 Red de seguridad: lista de identificadores del contenido que no se puede perder, con su prueba; archivo de respaldo de datos probado en una base local.

### Fase 1 · Cimientos
- [x] 1.1 Catálogo de las seis academias, sus habilidades, los niveles visibles 1 a 6+ y el catálogo de temas prioritarios, con versión. 52 habilidades con prerrequisitos, 41 temas, 8 formatos de actividad y la escala interna de dominio de 0 a 5.
- [ ] 1.2 Clasificación de todo el contenido existente: una academia principal, hasta dos secundarias, habilidades y nivel, conservando identificadores. Incluye la medición de cobertura por academia y nivel.
- [ ] 1.3 Registro de evidencias que no se reescribe: competencia principal y secundarias, dificultad, evidencia observable, calidad del razonamiento, transferencia, resultado, retroalimentación, fecha, versión de rúbrica y confianza.
- [ ] 1.4 Cálculo de dominio nuevo: dominio, confianza, vigencia y cobertura por habilidad; tres estados (declarado, en desarrollo, respaldado por evaluaciones); barra general con criterios públicos; protección contra repeticiones y atajos. Puntos y rachas no cuentan.
- [ ] 1.5 Estructura de datos nueva, con su archivo para instalarla y su archivo para deshacerla.
- [x] 1.6 Documento de currículo: habilidades, prerrequisitos, niveles y al menos cinco ejemplos progresivos por academia. Ver `01-curriculo.md`: qué se pide en cada nivel por habilidad, fundamentos del Nivel 1 y seis ejemplos por academia. Se adelantó a petición de Oziel.

### Fase 2 · Entrada: perfil, temas, diagnóstico y ruta
- [ ] 2.1 Registro corto: situación, experiencia, para qué se usa MÊTIS, al menos cinco temas prioritarios, frecuencia y minutos. Las cuentas existentes lo completan desde su perfil.
- [ ] 2.2 Diagnóstico de entrada adaptativo de 12 a 18 reactivos, con versión corta «Empezar ahora» y resultado provisional por academia con nivel de confianza.
- [ ] 2.3 Selección de la siguiente práctica según temas, brechas, prerrequisitos, repaso y variedad. «Hoy te recomendamos…» sin cerrar el acceso libre.
- [ ] 2.4 Calibración con tres perfiles de ejemplo (novato, gerente, directivo) y documento de especificación del diagnóstico.

### Fase 3 · Experiencia principal
- [ ] 3.1 Reto sin empresa propia: la empresa y los personajes pertenecen al caso; las consecuencias se explican dentro del caso. Formatos: caso breve, caso aplicado, caso encadenado e interacción inmersiva.
- [ ] 3.2 Retroalimentación en seis partes: qué hiciste, qué consideraste bien, qué faltó, otra ruta defendible, qué aprendiste y revisar teoría.
- [ ] 3.3 Hoy nuevo: «Tu criterio ejecutivo» con la barra general y las seis barras; al tocar una barra se ve por qué avanzó.
- [ ] 3.4 Retos e Historial en lugar de Bandeja, con filtros por competencia, concepto, dificultad, industria y fecha.
- [ ] 3.5 Academy en seis academias, con avance real por unidad, teoría siempre disponible y práctica de recuperación.
- [ ] 3.6 Menú nuevo: salen Empresa y Carrera; entran Mi progreso y Mi perfil. El registro deja de pedir empresa. Interruptor para reactivar el simulador. Textos, guía «?» y página de entrada actualizados.
- [ ] 3.7 Tutor con inteligencia artificial que responde solo con la lección y los datos del caso, con respuesta de respaldo si falla.

### Fase 4 · Comunicación y hábito
- [ ] 4.1 Correos firmados por MÊTIS: reto del día, recomendación de Academy, repaso y cierre semanal, con tope de frecuencia.
- [ ] 4.2 Avisos al celular y preferencias de comunicación editables.
- [ ] 4.3 «Pausar MÊTIS» hasta 14 días: congela racha y recordatorios, muestra fecha de regreso y permite reanudar antes. Sin pausas encadenadas automáticas.
- [ ] 4.4 Regreso tras más de 30 días sin práctica: bienvenida y diagnóstico de reincorporación, con los casos límite (día 30, día 31, pausa, zona horaria, varios dispositivos).
- [ ] 4.5 Repaso espaciado: calendario de repasos por habilidad.
- [ ] 4.6 Hechos reales verificados como contexto de casos, separando la noticia real de la hipótesis del caso.

### Fase 5 · Calidad
- [ ] 5.1 Auditoría del banco de casos por nivel: respuestas obvias, sesgos de posición y de longitud, dificultad real y variedad de industrias. Casos nuevos donde falte cobertura, incluidos integradores y de transferencia.
- [ ] 5.2 Simulación de varias semanas de aprendizaje con distintos perfiles, y medición de las métricas de producto.
- [ ] 5.3 Comprobación de que el simulador se reactiva con sus partidas intactas y de que su historial sigue aparte.
- [ ] 5.4 Demostración en computadora y celular con dos recorridos de temas prioritarios distintos.
- [ ] 5.5 Revisión de costos de inteligencia artificial y de los respaldos.
- [ ] 5.6 Revisión final de los 12 criterios de aceptación y reporte de pendientes.

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

«CA» criterios de aceptación obligatorios, «EN» entregables de la sección 15, «AD» apartados de la adenda, «EX» flujo de exportación.

| Núm. | Punto | Entrega | Estado |
|---|---|---|---|
| CA1 | Empezar a practicar sin crear ni nombrar una empresa | 3.1, 3.6 | Pendiente |
| CA2 | Cada reto etiquetado con academia, habilidades y nivel; su aprendizaje se recupera en Academy | 1.1, 1.2, 3.5 | En curso: catálogo listo |
| CA3 | Las seis barras y la general usan la misma fuente en Hoy, Perfil y Academy | 1.4, 3.3 | Pendiente |
| CA4 | Completar una lección sin demostrar comprensión no sube de nivel | 1.4 | Pendiente |
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
| EN4 | Rúbricas con versión y cálculo de dominio con evidencias y confianza | 1.3, 1.4 | Pendiente |
| EN5 | Plan de migración sin pérdida, cambios reversibles y pruebas de regresión | 0.2, 5.3 | En curso: respaldo y pruebas listos |
| EN6 | Demostración de Hoy y Academy en computadora y celular, con dos recorridos | 5.4 | Pendiente |
| EN7 | Pruebas automáticas, métricas editoriales y simulación de varias semanas | 5.1, 5.2 | Pendiente |
| EN8 | Costos de inteligencia artificial, respaldos y alternativa si el tutor falla | 3.7, 5.5 | Pendiente |
| AD1 | CV opcional en el registro, con extracción y revisión del usuario | 6.2 | Pendiente |
| AD2 | Diagnóstico integrado con tres fuentes; lo declarado no asigna dominio | 6.4 | Pendiente |
| AD3 | Mi progreso, Mi perfil y Mi CV separados; historial anterior aparte | 3.6, 5.3, 7.2 | Pendiente |
| AD4 | Cada actividad evaluable registra los siete grupos de datos de la adenda | 1.3, 1.4 | Pendiente |
| AD5 | CV evolutivo: plantilla, edición, sugerencias con evidencia, aprobar o rechazar, descargar | 7.1 a 7.5 | Pendiente |
| AD6 | Cambio de puesto, empresa, función u objetivo, sin perder historial | 6.5 | Pendiente |
| AD7 | Privacidad y control del usuario sobre su CV | 6.1, 7.5 | Pendiente |
| AD8 | Auditoría de lo reutilizable y demostración completa de ocho pasos | 0.1, 8.1 | En curso: auditoría hecha |
| EX1 | Flujo de cuatro pasos: preparar, revisar, previsualizar, exportar | 7.2 | Pendiente |
| EX2 | Descarga disponible en cualquier momento | 7.3 | Pendiente |
| EX3 | Sugerencias desde competencias granulares; distinguir declarado, en desarrollo y respaldado | 1.4, 7.1 | Pendiente |
| EX4 | Conservar diseño cuando sea posible; plantilla alternativa compatible con lectores automáticos | 7.4 | Pendiente |
| EX5 | Modelo del CV con versiones como única fuente; PDF seleccionable y Word editable verificados | 6.3, 7.3 | Pendiente |
| EX6 | Lo no demostrado nunca se agrega solo; la experiencia original queda intacta | 7.6, 8.2 | Pendiente |

Los 10 objetivos del usuario (sección 1 del documento) y la regla de producto se revisan en cada entrega: cada una indica a qué objetivo responde y con qué evidencia se comprueba.

## Fuera de este plan

- Comparación pública entre usuarios. El documento la plantea como opcional y secundaria, con grupos comparables y datos suficientes; hoy no hay base para armarlos. El ranking sigue oculto.
- Escenarios premium con el motor económico anterior. El motor se conserva; no se construye un producto nuevo encima.

## Pendientes de decisión

1. Cómo se aprueban los casos nuevos. Propuesta: lotes por academia con hoja resumen y revisión de una muestra.
2. Revisión legal del aviso de privacidad antes de la Fase 6.
3. Repositorio: Oziel prefiere pasarlo a privado. El inventario y la revisión están en `02-repositorio.md`. Falta que Oziel confirme su plan de Vercel (el plan gratuito puede no publicar desde un repositorio privado cuando los cambios los firma SuperNinja) y que autorice, por separado, la limpieza de los archivos ajenos.
4. Nombres de la escala interna de dominio (Sin evidencia, Inicial, En desarrollo, Demostrado, Consistente, Transferible). Son propuesta; el documento de origen solo pide una escala de 0 a 5.

## Bitácora

| Fecha | Entrega | Qué se hizo |
|---|---|---|
| 12 nov 2026 | 0.1, 0.2 | Auditoría, lista de identificadores con su prueba y respaldo de datos probado en base local. El respaldo no se ha corrido en producción. |
| 12 nov 2026 | 1.1, 1.6 | Catálogo de aprendizaje y matriz curricular con su documento. Todavía no cambia ninguna pantalla ni toca datos. Los ejemplos de actividad son modelos de redacción, no actividades jugables. |
| 12 nov 2026 | Repositorio | Inventario de los archivos ajenos (205, sin borrar nada) y revisión de lo que implica pasar el repositorio a privado. Documento: `02-repositorio.md`. La limpieza y el cambio a privado esperan autorización. |
| 12 nov 2026 | Pruebas | Hallazgo: la revisión «Pruebas» pasó en las propuestas #188 y #189, pero la corrida posterior sobre `main` falló por tiempo agotado en una prueba lenta (sin error de contenido). Se subió el límite de tiempo a 20 segundos. Desde ahora, después de cada fusión también se revisa la corrida sobre `main`. |
