# MÊTIS 2.0 · Auditoría: ¿llegan al navegador las respuestas de las evaluaciones?

Fecha: 13 de noviembre de 2026.
Responde al punto 8 de las instrucciones de Oziel al entregar el paquete maestro corregido, y a la acción 6 del archivo de entrada del paquete: no publicar las claves de evaluación en lo que recibe el navegador.

## 1. Respuesta corta

**Sí llegan.** No están en los archivos de programa que la aplicación reparte a todo el mundo, pero viajan completas dentro de la página de cada experiencia y del Executive Challenge. Una persona con cuenta que abra una de esas páginas y sepa dónde mirar puede leer todas las respuestas antes de contestar.

Además, el repositorio de código es público, y el contenido de las 13 experiencias y del Executive Challenge, con sus respuestas, está en él. Para leerlas ahí no hace falta ni tener cuenta.

**Esto no se corrigió en esta entrega.** Se midió, se documentó y se propone cómo corregirlo. La razón de no corregirlo ahora está en el apartado 6.

Lo que limita el daño hoy: estas páginas no están en el menú, en producción piden iniciar sesión, los buscadores no las indexan y nada de lo que ahí se responde registra evidencia, sube niveles ni acredita.

## 2. Qué se revisó y cómo

Se compiló la aplicación tal como se publica y se buscó, en todo lo que recibe un navegador, cada una de las señales que delatan una respuesta:

- Del Executive Challenge EC-N1-002-A, 158 señales: las 92 notas que explican por qué una opción vale lo que vale, los 16 cálculos que dan la cifra correcta y las 50 justificaciones y respuestas de referencia.
- De las 13 experiencias, 53 señales: la respuesta de cada una de las 53 tareas de las comprobaciones independientes.

Se buscaron en tres lugares:

1. Los archivos de programa que la aplicación reparte a cualquier visitante (152 archivos, 4.98 MB).
2. La página de cada pieza, tal como llega al abrirla directamente.
3. La respuesta que recibe el navegador cuando se llega a la pieza navegando desde otra pantalla.

La revisión se hizo sobre la aplicación compilada en el entorno de trabajo, con la misma versión del código que se publica. **No se repitió dentro de una sesión iniciada en producción.** El mecanismo es el mismo, porque depende del código y no del servidor, pero la comprobación directa en producción no se hizo.

## 3. Resultados

### Executive Challenge EC-N1-002-A

| Dónde | Señales encontradas |
|---|---|
| Archivos de programa repartidos a todos | 0 de 158 |
| Página del reto (99 KB) | 158 de 158: 92 de 92 notas, 16 de 16 cálculos, 50 de 50 justificaciones y referencias |
| Respuesta de navegación | 92 de 92 notas |

En la página del reto viajan también, con su nombre, el campo de respuesta correcta (26 veces), los puntos de cada opción (92 veces) y la marca de decisión crítica de las tres salvaguardas (5 veces).

### Las 13 experiencias

| Experiencia | Tareas de la comprobación | En archivos de programa | En la página | En la respuesta de navegación |
|---|---:|---:|---:|---:|
| EDIT-N1-002 | 3 | 0 | 3 | 3 |
| EDIT-N1-007 | 3 | 0 | 3 | 3 |
| EDIT-N1-008 | 4 | 0 | 4 | 4 |
| EDIT-N1-009 | 3 | 0 | 3 | 3 |
| EDIT-N1-010 | 3 | 0 | 3 | 3 |
| EDIT-N1-011 | 3 | 0 | 3 | 3 |
| EDIT-N1-012 | 3 | 0 | 3 | 3 |
| EDIT-N1-013 | 5 | 0 | 5 | 5 |
| EDIT-N1-015 | 5 | 0 | 5 | 5 |
| EDIT-N1-016 | 6 | 0 | 6 | 6 |
| EDIT-N1-017 | 5 | 0 | 5 | 5 |
| EDIT-N1-018 | 4 | 0 | 4 | 4 |
| EDIT-N1-020 | 6 | 0 | 6 | 6 |
| **Total** | **53** | **0** | **53** | **53** |

### El índice de piezas en revisión

La página que lista las piezas no contiene ninguna respuesta.

## 4. Por qué pasa

Cada pieza es un solo objeto que reúne lo que la persona ve (situación, documentos, preguntas, opciones) y lo que sirve para calificar (respuestas, puntos, cálculos, explicaciones). La página entrega ese objeto completo a la pantalla, y la calificación se hace en el navegador de la persona.

Eso tiene tres consecuencias:

1. **Las respuestas se pueden leer antes de contestar.** No hace falta ninguna herramienta especial: basta ver el código de la página.
2. **El intento se puede alterar.** Se guarda en el navegador de la persona. La aplicación vuelve a calcular el resultado a partir de las respuestas guardadas, así que no se puede escribir un puntaje a mano; pero sí se pueden cambiar las respuestas guardadas por las correctas.
3. **Un intento se puede borrar y repetir** con los mismos datos, las veces que se quiera.

Para una demostración aislada, sin consecuencias, esto es aceptable. Para una evaluación independiente que acredite, no lo es.

## 5. Qué no está expuesto

- Los archivos de programa que se reparten a cualquier visitante no contienen ninguna de las 211 señales.
- Los archivos del paquete editorial no están en el repositorio: solo sus huellas. Sí está, como parte de la aplicación, el contenido convertido de las 13 experiencias y del reto, con sus respuestas.
- Las respuestas de las 11 experiencias que no se han convertido no están en ningún lado de la aplicación.
- Los mapas de código fuente no se publican.

## 6. Por qué no se corrigió en esta entrega

1. Corregirlo cambia la forma en que funcionan las 13 experiencias y el Executive Challenge por dentro. Oziel pidió conservar lo que funciona y revisar primero el Executive Challenge y EDIT-N1-020. Cambiarles el funcionamiento justo antes de esa revisión habría puesto en sus manos algo distinto de lo ya probado.
2. La corrección solo sirve completa. Sacar las respuestas de la página mientras siguen en un repositorio público no protege nada.
3. La corrección pide guardar intentos en el servidor, y eso es un cambio en la base de datos que necesita autorización.

Esta es una decisión de SuperNinja y Oziel puede cambiarla: si prefiere que se corrija antes de revisar, se hace primero.

## 7. Qué se propone

### El cambio de fondo

1. **Separar cada pieza en dos partes.** Una con lo que la persona ve. Otra con lo que sirve para calificar: respuestas, puntos por opción, cálculos, notas, referencias y marcas de decisión crítica. La segunda nunca sale del servidor.
2. **Calificar en el servidor.** El navegador manda lo que la persona respondió; el servidor califica y devuelve solo lo que la pantalla necesita en ese momento. En el Executive Challenge, donde una decisión cambia lo que pasa después, el servidor entrega el paso siguiente uno por uno.
3. **Las explicaciones llegan después de entregar,** nunca antes.
4. **El intento entregado se guarda en el servidor.** Es el mismo requisito que tiene la revisión humana de lo escrito (`07-revision-humana.md`), así que se resuelven juntos.
5. **Una prueba automática que lo vigile.** La búsqueda de este documento se convierte en una comprobación que corre con cada cambio y falla si una sola respuesta aparece en lo que recibe el navegador.
6. **Las respuestas salen del repositorio público.** Hay dos caminos: volver privado el repositorio, o guardar las respuestas en un lugar privado aparte. Como advierte el paquete, un repositorio privado por sí solo no basta: sin los puntos 1 a 3, las respuestas seguirían viajando al navegador.

### Qué se conserva

El contenido de las piezas, las reglas de calificación y sus pruebas no se reescriben: las mismas reglas pasan a ejecutarse en el servidor. Lo que cambia es por dónde viajan los datos y cómo las pantallas los piden. Ninguna experiencia se reconstruye.

### Lo que este cambio no resuelve

- Una persona puede repetir un intento y aprenderse las respuestas, o recibirlas de otra. Eso se atiende con variantes de datos nuevos, límite de intentos y la variante B del Executive Challenge, no con este cambio.
- En la parte de práctica guiada, las explicaciones se muestran después de cada decisión. Eso es deliberado: es la parte donde se aprende.
- La auditoría del paquete ya señaló que EDIT-N1-002, EDIT-N1-008 y EDIT-N1-020 repiten cifras de la práctica en su comprobación. Sigue pendiente.

### Una medida rápida, opcional

Mientras se hace el cambio de fondo, las páginas de las piezas se podrían abrir solo para el equipo mêtis, comprobándolo en el servidor. Reduce quién puede leer las respuestas en la aplicación, pero no las quita del repositorio público. No se aplicó porque no está comprobado que la cuenta con la que Oziel va a revisar tenga ese permiso, y cerrarle la entrada justo antes de su revisión sería peor.

## 8. Orden de trabajo propuesto

1. Oziel decide si el repositorio se vuelve privado o si las respuestas se guardan aparte.
2. Oziel revisa el Executive Challenge y EDIT-N1-020 tal como están.
3. Se separa lo visible de lo que califica y se pasa la calificación al servidor, primero en EDIT-N1-020 y en el Executive Challenge.
4. Se agrega la prueba automática que vigila.
5. Se aplica igual a las otras 12 experiencias y, desde el principio, a las 11 que faltan por convertir.
6. Se repite esta auditoría en producción, con sesión iniciada.

Nada de esto conecta las piezas al registro de evidencias ni al cálculo de dominio.

## 9. Decisiones que necesita tomar Oziel

1. Si el cambio se hace antes o después de su revisión del Executive Challenge y de EDIT-N1-020.
2. Repositorio privado, respuestas guardadas aparte, o las dos cosas.
3. Si se aplica la medida rápida de abrir las piezas solo al equipo, y con qué cuenta revisa él.
4. Si autoriza la tabla nueva para guardar intentos (solo adición, con su archivo para deshacerla).

## 10. Anexo · Las seis preguntas técnicas del Lote 04

El archivo de instrucciones del Lote 04 hace seis preguntas. Se responde cómo está hoy y qué falta.

**1. Cómo se guardan y versionan nodos, documentos, escenarios, retroalimentación y rúbricas sin duplicar identificadores.**
Hoy cada pieza es un archivo de contenido dentro de la aplicación, con su identificador, su versión propia y la versión del paquete del que salió. Una prueba automática falla si se repite un identificador, una dirección o una pieza editorial; otra comprueba que EC-N1-002-A y EC-N1-001-A son piezas distintas. Un intento guardado anota con qué versión se hizo y, si la pieza cambia de versión, el intento viejo no se mezcla con la nueva. Los pesos de cada rúbrica están en la ficha de su lote y una prueba comprueba que las tareas pesan lo que dice la rúbrica. Lo que falta: las rúbricas no tienen un registro propio con versiones; se propone en `07-revision-humana.md`.

**2. Cómo se guarda y se reanuda cada acto sin duplicar una evaluación enviada.**
Hoy el avance se guarda en el navegador después de cada paso y se reanuda donde iba; está probado en cualquier paso. Lo respondido no se puede cambiar y lo guardado que no corresponde se descarta. Pero hoy no se envía nada: no hay evaluación entregada a un servidor, así que tampoco hay garantía entre dispositivos, y la persona puede borrar su intento y repetirlo. Lo que falta: guardar la entrega en el servidor con una llave única por persona, pieza, versión e intento, de modo que reenviar no cree un segundo registro. La aplicación ya usa esa técnica en otra sección.

**3. Cómo se marca la ayuda y la independencia de un intento.**
En el Executive Challenge, pedir ayuda conceptual marca el intento como asistido y la marca no se quita; está probado. En las experiencias, la práctica guiada ofrece pistas y concepto, y la comprobación es otra situación, sin pistas, sin explicaciones y sin los personajes de la práctica; también está probado. Lo que falta: la marca dice que no se pidió ayuda dentro de la aplicación, no que el intento fue independiente. Mientras las respuestas viajen al navegador y el intento se pueda repetir con los mismos datos, la independencia no está garantizada.

**4. Cómo se impide que una inteligencia artificial cambie cifras o parámetros de evaluación.**
Hoy ninguna inteligencia artificial participa en las experiencias ni en el reto: los textos, las cifras y las respuestas son fijos, las pantallas no llaman a ningún servicio (hay una prueba que lo comprueba) y las igualdades escritas se verifican con pruebas automáticas. Si se agrega un tutor o un corrector, la regla propuesta es: las cifras, las respuestas y los pesos nunca los genera el modelo; los recibe como datos que no puede cambiar; lo que devuelve se compara con los datos fijos antes de mostrarse; y su sugerencia de calificación es un borrador que solo ve la persona que revisa.

**5. Costo estimado por intento y qué pasa si el tutor o el calificador fallan.**
Hoy el costo de inteligencia artificial por intento es cero, porque no se usa. No se da una cifra para un tutor futuro: depende del modelo y del largo de las conversaciones, y no se ha medido. Se propone medirlo en el piloto antes de comprometer un número. Regla propuesta si falla: el intento sigue sin tutor, las respuestas ya dadas no se pierden, lo escrito pasa a la cola de revisión humana y nunca se publica una calificación salida de una llamada fallida.

**6. Cómo se prueba que las 24 habilidades tienen evidencia observable y que ninguna se califica por estilo o extensión.**
Una prueba comprueba que el Executive Challenge cubre las 24 habilidades de nivel 1, con 4 puntos cada una y 96 en total. Lo que se califica solo son decisiones, cifras, clasificaciones, órdenes y piezas armadas, comparadas contra una respuesta, no contra una forma de escribir. Lo escrito no lo califica ninguna máquina: espera a una persona, así que ni el estilo ni el largo suman puntos. Otras pruebas comprueban que las opciones tienen largo parecido, que la defendible no queda siempre en el mismo lugar y que elegir siempre la más larga o la más corta no lleva por la ruta defendible. Límite: una sola observación por habilidad no demuestra dominio estable, como señala la auditoría del paquete.

## 11. Lo que no se hizo

No se cambió el funcionamiento de ninguna pieza. No se movió la calificación al servidor. No se cambió la visibilidad del repositorio. No se creó ninguna tabla. No se repitió la auditoría en producción con sesión iniciada.
