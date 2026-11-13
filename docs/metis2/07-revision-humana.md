# MÊTIS 2.0 · Propuesta de revisión humana de respuestas escritas

Fecha: 13 de noviembre de 2026.
Responde al punto 7 de las instrucciones de Oziel al entregar el paquete maestro corregido: proponer una pantalla administrativa de evaluación humana con registro de calificación, retroalimentación y versión de la rúbrica.

## Cómo leer este documento

Es una **propuesta**. Nada de lo que aquí se describe está construido: no hay pantalla, no se creó ninguna tabla en la base de datos y no se cambió ninguna experiencia. Espera el visto bueno de Oziel.

Cada apartado separa tres cosas: cómo está hoy (comprobado en el código), qué se propone y qué tiene que decidir Oziel.

## 1. Cómo está hoy

Comprobado en el código y en las pruebas automáticas:

- Lo que una persona escribe en una experiencia o en el Executive Challenge se guarda **solo en su navegador**. No llega al servidor. Nadie del equipo puede leerlo.
- Lo escrito no se califica solo. Sus puntos quedan «en espera de revisión de una persona» y, mientras haya puntos en espera, la pantalla no da veredicto.
- No existe una regla de aprobación habilitada en el Executive Challenge. En las 13 experiencias la variante guarda una regla provisional de 70 de 100, sin calibrar; solo se menciona en pantalla, como texto, en las dos experiencias que no tienen nada escrito (EDIT-N1-002 y EDIT-N1-010). Para esas dos, el cálculo interno sí llega a un «pasa» o «no pasa» con esa regla, pero la pantalla no lo muestra ni lo usa para nada.
- Nada de esto registra evidencia, sube niveles ni acredita.

### Cuánto pesa lo escrito en cada pieza

| Pieza | Puntos escritos | Sobre | Tareas escritas |
|---|---:|---:|---:|
| EC-N1-002-A (Executive Challenge) | 4 | 96 | 3 pasos: escena 1 (1 punto), escena 2 (1 punto), escena 9 (2 puntos) |
| EDIT-N1-002 | 0 | 100 | 0 |
| EDIT-N1-007 | 60 | 100 | 2 |
| EDIT-N1-008 | 20 | 100 | 1 |
| EDIT-N1-009 | 55 | 100 | 2 |
| EDIT-N1-010 | 0 | 100 | 0 |
| EDIT-N1-011 | 55 | 100 | 2 |
| EDIT-N1-012 | 60 | 100 | 2 |
| EDIT-N1-013 | 50 | 100 | 2 |
| EDIT-N1-015 | 65 | 100 | 3 |
| EDIT-N1-016 | 15 | 100 | 1 |
| EDIT-N1-017 | 40 | 100 | 2 |
| EDIT-N1-018 | 45 | 100 | 2 |
| EDIT-N1-020 | 15 | 100 | 1 |

Lectura: en seis de las trece experiencias (EDIT-N1-007, 009, 011, 012, 013 y 015), la mitad o más de la comprobación independiente es texto escrito. Sin revisión humana, esas experiencias no pueden dar un resultado completo. En el Executive Challenge lo escrito pesa poco (4 de 96), pero toca tres habilidades: ventaja competitiva, priorización y comunicación.

### Qué rúbricas trae el paquete

| Lote | Dónde está la rúbrica | Qué trae | Estado que declara el paquete |
|---|---|---|---|
| 01 (versión 1.0) | Dentro del texto de cada experiencia | Criterios con su peso | Sin calibrar: el estándar del lote declara sus umbrales como hipótesis |
| 02 (versión 1.1) | Dentro del texto de cada experiencia | Criterios con su peso | Provisional |
| 03 (versión 1.2) | Archivo de rúbricas | Criterios con su peso, por comprobación | Provisional, sin validación psicométrica; propuesta editorial |
| 04 (versión 1.3) | Archivo de rúbricas | Criterios con su peso; versión de rúbrica 1.3 | Provisional, sin calibrar |
| Executive Challenge | Archivo de rúbricas del Lote 04 | Escala de 0 a 4 por habilidad con cinco definiciones generales; versión de rúbrica 2.0; sin umbral de aprobación | Provisional, sin calibrar |

**Hallazgo.** Las rúbricas dicen cuánto vale cada criterio, pero no describen qué respuesta merece todos los puntos, cuál merece la mitad y cuál ninguno. Para quien revisa, hoy solo existen: el nombre del criterio, sus puntos, una respuesta de referencia y una lista corta de ideas que debería contener la respuesta. Parte de esas referencias e ideas vienen del paquete y parte se redactaron al convertir. Con eso, dos personas distintas pueden calificar distinto la misma respuesta.

## 2. Qué se propone

Una sección nueva, solo para el equipo, con dos pantallas. No aparece en el menú de las personas que aprenden.

### Quién entra

Hoy la plataforma ya distingue al equipo mêtis del resto de las personas (es el mismo permiso que abre la consola del equipo). Se propone usar ese permiso para la primera etapa y, cuando haya más revisores, crear un permiso aparte de «revisor» que solo dé acceso a esta sección, para no repartir permisos de equipo completos.

### Pantalla 1 · Cola de revisión

Una lista de respuestas escritas que esperan revisión. Cada renglón muestra:

- La pieza y la tarea (por ejemplo, EDIT-N1-020, «Recomendación condicionada»).
- La versión de la pieza y la versión de la rúbrica con la que se va a calificar.
- La fecha de entrega.
- Si el intento fue sin ayuda o con ayuda.
- El estado: en espera, en revisión, revisada, en segunda revisión, publicada.

Se puede filtrar por pieza, por estado y por fecha. La persona que escribió aparece con un código, no con su nombre, para que quien revisa califique la respuesta y no a la persona.

### Pantalla 2 · Revisión de una respuesta

Dividida en dos mitades (en celular, una debajo de la otra).

**Lo que vio y escribió la persona**

- La situación y los documentos de la variante, tal como los vio.
- La pregunta.
- Su respuesta, tal cual la entregó. No se puede editar.
- Lo que sí se comprobó solo en ese intento (cifras, clasificaciones), como contexto. Esos puntos no se pueden cambiar desde aquí.

**La rúbrica y la calificación**

- El nombre y la versión de la rúbrica, a la vista todo el tiempo.
- Cada criterio con sus puntos máximos y la descripción de cada nivel.
- La respuesta de referencia y las ideas esperadas.
- Un selector de puntos por criterio.
- Un campo de retroalimentación para la persona. Obligatorio: no se puede publicar una calificación sin explicar por qué.
- Una nota interna para el equipo, que la persona no ve.
- Una casilla «pedir segunda revisión».
- Dos botones: «Guardar borrador» y «Publicar calificación».

Con el reporte de esta entrega va una imagen de cómo se vería esta pantalla. Es un dibujo para discutir, no parte de la aplicación.

### Qué queda registrado en cada revisión

| Dato | Para qué |
|---|---|
| Intento, pieza y versión de la pieza | Saber exactamente qué se respondió |
| Tarea y texto de la respuesta, congelado al entregar | Que nadie califique algo distinto de lo entregado |
| Rúbrica, su versión y la huella de su texto | Saber con qué regla se calificó, aunque la rúbrica cambie después |
| Puntos por criterio y total | La calificación |
| Retroalimentación para la persona | Que la calificación enseñe |
| Nota interna | Dudas del revisor, casos límite |
| Quién revisó y cuándo | Responsabilidad y auditoría |
| Si es primera o segunda revisión | Medir si dos personas califican igual |
| Motivo, cuando una calificación se corrige | Que ningún cambio quede sin explicación |

Reglas del registro:

1. **Nada se sobrescribe.** Corregir una calificación crea un registro nuevo; el anterior se conserva.
2. **Las rúbricas no se editan.** Cambiar una rúbrica crea una versión nueva. Lo ya calificado conserva la versión con la que se calificó.
3. **Nadie revisa su propio intento.**
4. **Los puntos que se comprueban solos no se tocan** desde esta pantalla.

### Segunda revisión y auditoría

- Una parte de las respuestas pasa a una segunda persona, que califica sin ver la primera calificación.
- Si las dos calificaciones difieren más de un margen acordado, el caso sube a Oziel o a quien él designe.
- La pantalla lleva la cuenta de cuántas veces coinciden los revisores, por criterio. Un criterio donde casi nunca coinciden es una rúbrica mal escrita, y eso se corrige en la rúbrica.

Qué parte pasa a segunda revisión y cuál es el margen son decisiones de Oziel. Para el piloto, con pocas personas, lo razonable sería segunda revisión para todas.

### Qué ve la persona que aprende

- Mientras espera: «Tu respuesta está en revisión», con la fecha de entrega.
- Al publicarse: los puntos por criterio, la retroalimentación, la versión de la rúbrica y la fecha.
- No ve la nota interna. Si ve o no el nombre de quien revisó es decisión de Oziel.
- No ve un veredicto de aprobado o no aprobado mientras no exista una regla aprobada. La revisión completa el puntaje; no acredita.

## 3. Lo que tiene que existir antes

La pantalla sola no sirve si antes no se resuelven cuatro cosas.

1. **Las respuestas tienen que llegar al servidor.** Hoy viven en el navegador de cada persona. Hay que guardar el intento entregado, con la identidad de quien lo entregó. Esto se une con la propuesta de `08-auditoria-de-claves.md`: si la calificación automática pasa al servidor, el intento ya queda guardado ahí.
2. **Las rúbricas necesitan niveles descritos.** Para cada criterio escrito hace falta decir qué merece cada puntaje. SuperNinja puede redactar un borrador a partir de las ideas esperadas, pero ese borrador es contenido pedagógico nuevo y lo tiene que aprobar Oziel. Ejemplo de borrador, para el único criterio escrito de EDIT-N1-020 (15 puntos): 15 si separa el saldo del día del pago del saldo final, propone una acción concreta y la condiciona a que se confirme antes del pago; 10 si cumple dos de las tres; 5 si cumple una; 0 si recomienda con base en el saldo del viernes. Este ejemplo lo redactó SuperNinja; no viene del paquete.
3. **Aviso a la persona.** Antes de escribir, tiene que saber que alguien del equipo va a leer su respuesta.
4. **Quién revisa.** Nombres concretos y cuánto tiempo pueden dedicar. Sin eso la cola crece y nadie recibe su resultado.

## 4. Cambios en la base de datos

Todos serían adiciones: tablas nuevas, sin tocar ninguna existente, con su archivo para deshacerlos. **No se ejecutó nada.** No tiene relación con la migración 1.5, que sigue sin ejecutarse.

| Tabla nueva | Qué guarda |
|---|---|
| Intentos entregados | Quién, qué pieza y versión, cuándo, si fue con ayuda, y las respuestas |
| Respuestas escritas | Cada texto entregado, congelado, con su estado en la cola |
| Rúbricas | Cada rúbrica con su versión, su texto y su huella |
| Revisiones | Cada calificación, con todo lo de la tabla del apartado 2. Solo se agregan renglones |
| Revisores | Quién puede revisar, si se crea el permiso aparte |

Protección: cada persona solo lee sus propios intentos y sus calificaciones publicadas; solo los revisores leen la cola; nadie sin sesión lee nada.

## 5. Orden de construcción propuesto

Cada paso se puede revisar y detener antes del siguiente.

1. Oziel aprueba o corrige esta propuesta y los niveles de las rúbricas.
2. Guardar en el servidor los intentos entregados (junto con el cambio de `08-auditoria-de-claves.md`).
3. Cola y pantalla de revisión, solo para el equipo, con el registro completo.
4. Lo que ve la persona: «en revisión» y, después, su calificación con retroalimentación.
5. Segunda revisión y conteo de coincidencias.

En ningún paso se conecta el resultado al registro de evidencias ni al cálculo de dominio. Eso es una decisión posterior y separada.

## 6. Lo que no se propone por ahora

**Corrector con inteligencia artificial.** La auditoría del paquete lo menciona como algo a probar para escalar, con control humano. No se propone para el piloto. Si se prueba después, la regla sería: la sugerencia de la máquina es un borrador que solo ve el revisor, nunca se publica sin que una persona la confirme, y queda registrada aparte para poder comparar.

## 7. Decisiones que necesita tomar Oziel

1. Si se aprueba la pantalla como se describe o qué cambia.
2. Quién revisa en el piloto.
3. Si quien revisa ve el nombre de la persona o un código.
4. Si la persona ve el nombre de quien la revisó.
5. Qué parte de las respuestas pasa a segunda revisión y con qué margen de diferencia sube a Oziel.
6. Quién redacta los niveles de cada criterio escrito: Oziel, o SuperNinja como borrador para que Oziel corrija.
7. Qué hacer con la regla provisional de 70 de 100 que guardan las 13 experiencias: dejarla como está, quitar su mención de la pantalla o retirarla hasta calibrar.
8. Si las tablas nuevas se crean ya o cuando termine la revisión del Executive Challenge y de EDIT-N1-020.

## 8. Lo que no se hizo

No se construyó la pantalla. No se creó ninguna tabla. No se guardó ninguna respuesta en el servidor. No se redactaron los niveles de ninguna rúbrica, salvo el ejemplo del apartado 3. Nadie ha revisado ninguna respuesta escrita.
