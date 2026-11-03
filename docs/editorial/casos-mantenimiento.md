# Cadena de mantenimiento de Cumbre: los 7 asuntos completos

Generado del contenido real (`npx vitest run src/lib/ceo/casos-doc.test.ts` con `CASOS_DOC=1`). Los efectos son los de la empresa establecida antes de escalar por tamaño.

Decisión raíz: «Mantenimiento mayor de la envasadora de la línea 1» (día 2). Llega en periodos v6 o posteriores. Los 7 asuntos de abajo son esa decisión raíz y sus 6 consecuencias posibles.

Cambio de este ciclo en el dosificador: ocultar el incumplimiento (opción b) ahora es línea roja desde v7, con score 1 y consecuencias propias; ya no equivale a avisar. La opción transparente con revisión de Sofía (c) tiene score 2.

### Mantenimiento mayor de la envasadora de la línea 1

`d2-mantenimiento` · día 2 · reporte · de Javier Ortiz (Gerente de Planta) · involucra a Lucía Treviño (Directora de Finanzas), Sofía Leal (Compradora de categoría · SuperNorte)

**Contexto**

> Jefe, le mando el reporte que me pidió. La envasadora de la línea 1 ya cumplió sus horas: el fabricante pide mantenimiento mayor cada 6,000 horas y vamos en 6,400.
> Hacerlo bien es parar la línea 4 días. Pero entramos a temporada alta y el pedido de SuperNorte crece 20 % las próximas 8 semanas. Lucía dice que la caja está justa.
> No le voy a decir que va a fallar, porque no lo sé. Le digo lo que dice el técnico: si esperamos a enero, lo más probable es que baje el rendimiento, y hay una probabilidad real de que se rompa en plena temporada.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Mantenimiento mayor completo | 4 días de paro · $1.8 M |
| Cambiar solo las mordazas de sellado | 1 fin de semana · $600 mil |
| Si se pospone a enero (estimación del técnico) | El rendimiento baja de 82 % a cerca de 72 %; entre 3 y 4 de cada 10 equipos así fallan antes |
| Un paro no programado típico | 2 a 4 días y refacción importada |

**Pregunta:** ¿Qué hacemos con la envasadora?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Hacer el mantenimiento mayor ahora: parar la línea 1 cuatro días y recuperar el volumen con sábados antes del pico de SuperNorte. | Caja -3, Margen -1, Equipo +2 | 3 | — |
| **b.** Posponerlo a enero, después de la temporada alta. Mientras, que mantenimiento revise la máquina cada turno y avise al primer síntoma. | Caja +2, Clientes +1, Equipo -1 | 1 | — |
| **c.** Cambiar solo las mordazas de sellado este fin de semana, que causan la mayoría de los paros, y dejar el mantenimiento mayor para enero. | Caja -1, Clientes +1 | 2 | — |
| *(no responder)* | Equipo -2 | — | — |

**Qué pasa después de cada opción**

- **a.** Pagas hoy la parada y la caja lo resiente. La máquina queda lista para la temporada; recuperar los cuatro días va a exigir horas extra. *Respuesta:* Gracias, jefe. Así sí duermo tranquilo. / Le armo el calendario de sábados con Mariana. *Consecuencia futura:* llega «Javier Ortiz».
- **b.** Cuidas la caja y el pedido de esta temporada. El desgaste sigue ahí y nadie sabe si va a aguantar. *Respuesta:* Como usted diga, jefe. / Le pongo revisión cada turno, pero la máquina no se arregla viéndola. *Consecuencia futura:* llega «Llamada perdida · Javier Ortiz (Planta)» (en 40 de cada 100); llega «La línea 1 está perdiendo rendimiento» (en 60 de cada 100).
- **c.** Atiendes la causa más común por la tercera parte del costo y sin parar entre semana. El resto del desgaste queda pendiente. *Respuesta:* Es un punto medio razonable, jefe. / Nomás le advierto: el dosificador no lo vamos a tocar. *Consecuencia futura:* llega «Javier Ortiz» (en 35 de cada 100).
- **sin respuesta.** Sin decisión, la envasadora siguió sin mantenimiento: lo mismo que posponerlo, pero sin la revisión extra.

**Aprendizaje:** El mantenimiento que no se ve. Posponer el mantenimiento mejora la caja de este trimestre y pasa la cuenta después. La pregunta no es si la máquina va a fallar, sino cuánto riesgo estás dispuesto a comprar y quién lo va a pagar. *Un ahorro que solo cambia de fecha un gasto más caro no es un ahorro: es una deuda que no aparece en el balance.*

**Concepto:** Costo de oportunidad. Los $1.8 M y los cuatro días de paro del mantenimiento compiten con la caja y el pedido de temporada alta. Posponer no elimina el costo: lo cambia por un riesgo que nadie puede fechar, y que suele cobrarse cuando más duele.

### Javier Ortiz

`c-mant-sabados` · día 4 · whatsapp · de Javier Ortiz (Gerente de Planta) · involucra a Roberto Cantú (Secretario general del sindicato), Mariana Villarreal (Directora de Personas), Lucía Treviño (Directora de Finanzas)

**Cuándo llega (condición causal verificable):** solo si en «Mantenimiento mayor de la envasadora de la línea 1» elegiste «Hacer el mantenimiento mayor ahora: parar la línea 1 cuatro días y recuperar el volumen con sábados antes del pico de SuperNorte.» (siempre).

**Contexto**

> Jefe, la envasadora quedó como nueva: 84 % de rendimiento, mejor que antes de pararla.
> El problema es que para recuperar los 4 días necesitamos 3 sábados seguidos. Roberto dice que la gente ya está cansada y que, si son obligatorios, lo lleva a la comisión mixta.
> Y SuperNorte no espera: si no llegamos, son entregas incompletas.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Rendimiento de la línea 1 tras el mantenimiento | 84 % (antes 79 %) |
| Volumen por recuperar | 4 días de producción |
| Tres sábados con horas extra | $450 mil |
| Maquila en otra planta | $900 mil · calidad sin probar |

**Pregunta:** ¿Cómo recuperas el volumen?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Sábados voluntarios con pago doble y comida, rotando para que nadie trabaje los tres. Se lo platico yo a Roberto antes de anunciarlo. | Equipo +2, Caja -2, Clientes -1 | 3 | — |
| **b.** Tres sábados obligatorios para todo el turno: es temporada alta y el contrato lo permite. Se paga lo que marca la ley. | Clientes +3, Caja -1, Equipo -3 | 1 | — |
| **c.** Maquilar en otra planta la mitad de lo que falta y cubrir el resto con un solo sábado voluntario, sin cansar al turno. | Caja -3, Clientes +1, Equipo +1 | 2 | — |
| *(no responder)* | Clientes -3 | — | — |

**Qué pasa después de cada opción**

- **a.** Pagas más por hora, pero la gente llega por su voluntad. La relación con el sindicato queda intacta; quizá algún pedido salga un día tarde. *Respuesta:* Así sí, jefe. Roberto va a ver que esta vez se le preguntó. / Armo hoy el rol de sábados. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Recuperas todo el volumen a tiempo. La planta lo vive como el costo de una decisión que tomó otro, y el sindicato lo anota. *Respuesta:* Entendido. / (Roberto, por WhatsApp) Director, los sábados obligatorios los vamos a llevar a la comisión mixta. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** Pagas la maquila, que es más cara, y arriesgas calidad en una planta ajena a cambio de no cansar al turno. *Respuesta:* Se puede, jefe, aunque me preocupa la calidad de esa planta. / Le pido a Calidad que revise los primeros lotes. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, se recuperó la mitad del volumen y SuperNorte recibió entregas incompletas.

**Aprendizaje:** Lo correcto también tiene costo, y se gestiona. Hacer el mantenimiento a tiempo evitó el riesgo grande, pero trajo un costo chico y seguro: recuperar la producción. Cómo pagas ese costo con la gente decide si la próxima vez te van a apoyar. *Una buena decisión no termina cuando la tomas: termina cuando pagaste bien su costo.*

**Concepto:** Equidad interna. Recuperar cuatro días de producción cae sobre la gente de planta. Sábados obligatorios a tarifa de ley, voluntarios con pago doble o maquila afuera reparten ese costo de forma distinta, y la planta recuerda quién lo pagó.

### Llamada perdida · Javier Ortiz (Planta)

`c-mant-falla` · día 4 · llamada · de Javier Ortiz (Gerente de Planta) · involucra a Sofía Leal (Compradora de categoría · SuperNorte), Lucía Treviño (Directora de Finanzas)

**Cuándo llega (condición causal verificable):** solo si en «Mantenimiento mayor de la envasadora de la línea 1» elegiste «Posponerlo a enero, después de la temporada alta. Mientras, que mantenimiento revise la máquina cada turno y avise al primer síntoma.» o no responder y el azar del periodo cae en 40 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Mensaje de voz · 0:44
> «Jefe, se nos paró la envasadora de la línea 1. Se rompió el eje de las mordazas, justo lo que temía el técnico. La refacción viene de Italia.»
> «Tenemos tres caminos y ninguno es barato. Usted dígame.»

**Lo que sabes**

| Dato | Valor |
|---|---|
| Refacción por avión | $1.1 M · llega en 3 días |
| Refacción por barco | $350 mil · llega en 3 semanas |
| Mientras tanto | Línea 1 detenida (40 % de la capacidad) |
| Pedido de SuperNorte esta semana | $6 M |

**Pregunta:** La envasadora falló. ¿Qué haces?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Traer la refacción por avión, hacer de una vez el mantenimiento mayor completo y llamar yo a SuperNorte para avisar del retraso. | Caja -4, Clientes -1, Equipo +2 | 3 | — |
| **b.** Soldar el eje en el taller para arrancar mañana y pedir la refacción por barco. Que la línea 2 cubra lo más urgente de SuperNorte. | Caja +1, Clientes -1, Equipo -2 | 1 | — |
| **c.** Pedir la refacción por avión sin el mantenimiento completo, y mover el pedido a la línea 2 con turnos extra para no fallarle a SuperNorte. | Caja -3, Clientes +1, Equipo -2 | 2 | — |
| *(no responder)* | Clientes -2, Equipo -2 | — | — |

**Qué pasa después de cada opción**

- **a.** Pagas el flete urgente y el mantenimiento que habías pospuesto, todo junto y en temporada alta. La máquina queda bien y el cliente se enteró por ti. *Respuesta:* Gracias, jefe. Ahora sí la dejamos bien. / (Sofía) Le agradezco que me avise usted. Ajusto lo que pueda. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Arrancas mañana y gastas poco. Una soldadura en un eje de sellado puede aguantar semanas o días: nadie lo sabe. *Respuesta:* Se puede soldar, jefe, pero no le garantizo cuánto aguante. / Lo arrancamos mañana temprano. *Consecuencia futura:* llega «Incumplimiento de nivel de servicio» (en 70 de cada 100).
- **c.** Cumples el pedido y arreglas lo roto, a costa de un flete caro y de cansar al turno de la línea 2. El resto del desgaste sigue ahí. *Respuesta:* Va, jefe. La línea 2 le aguanta unos días. / El mantenimiento mayor sigue pendiente, eso sí. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, la planta parchó el eje y siguió.

**Aprendizaje:** La deuda de mantenimiento se cobra con intereses. Lo que ahorraste al posponer ya se pagó, más caro y en el peor momento. Ahora la decisión es otra: arreglar de fondo o volver a comprar tiempo. *Cuando el riesgo que aceptaste se materializa, no decidas para recuperar lo perdido: decide con lo que sabes hoy.*

**Concepto:** Decisiones reversibles e irreversibles. Con la envasadora rota, soldar el eje compra días a cambio de un riesgo que nadie puede medir; la refacción por avión cuesta más pero cierra el problema. Un parche es reversible hasta que falla en plena entrega.

### La línea 1 está perdiendo rendimiento

`c-mant-rendimiento` · día 4 · reporte · de Javier Ortiz (Gerente de Planta) · involucra a Sofía Leal (Compradora de categoría · SuperNorte), Lucía Treviño (Directora de Finanzas)

**Cuándo llega (condición causal verificable):** solo si en «Mantenimiento mayor de la envasadora de la línea 1» elegiste «Posponerlo a enero, después de la temporada alta. Mientras, que mantenimiento revise la máquina cada turno y avise al primer síntoma.» o no responder y el azar del periodo cae en 60 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Jefe, la envasadora no se ha parado, pero cada semana trabaja peor.
> El rendimiento bajó de 82 % a 74 % y la merma de empaque se duplicó. Para cumplirle a SuperNorte estamos metiendo horas extra entre semana.
> El técnico no puede decir si va a fallar. Dice que cada semana que pasa la probabilidad sube.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Rendimiento de la línea 1 | 74 % (antes 82 %) |
| Merma de empaque | 4.5 % (antes 2 %) |
| Horas extra este mes | $380 mil |
| Mantenimiento mayor ahora | 4 días de paro · $1.8 M · entregas parciales |

**Pregunta:** ¿Qué haces con la línea 1?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Hacer ya el mantenimiento mayor aunque sea temporada alta, y negociar con SuperNorte entregas parciales durante esos cuatro días. | Caja -3, Clientes -2, Equipo +2 | 3 | — |
| **b.** Aguantar hasta enero con horas extra y que Calidad revise cada lote, para no fallarle a SuperNorte en su temporada más fuerte. | Clientes +1, Margen -2, Equipo -2 | 1 | — |
| **c.** Cambiar las mordazas de sellado este fin de semana para frenar la merma, y dejar el mantenimiento mayor completo para enero. | Caja -1, Margen +1, Equipo -1 | 2 | — |
| *(no responder)* | Margen -2, Equipo -2 | — | — |

**Qué pasa después de cada opción**

- **a.** Pagas el mantenimiento en el peor momento y SuperNorte recibe menos cuatro días. Cortas el riesgo antes de que se vuelva una falla. *Respuesta:* Gracias, jefe. Ya me estaba quitando el sueño. / (Sofía) Entiendo. Pero le pido que no se repita en esta temporada. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** SuperNorte recibe completo. La merma y las horas extra se comen el margen semana a semana, y el riesgo de falla sigue subiendo. *Respuesta:* Como usted diga, jefe, aunque la gente ya viene cansada. / Calidad empieza a revisar cada lote desde hoy. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** Frenas la parte más cara del problema sin parar entre semana. Compras tiempo, no certeza. *Respuesta:* Eso ayuda bastante, jefe. / No resuelve todo, pero baja la merma y nos da aire. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, la línea siguió perdiendo rendimiento y la merma siguió creciendo.

**Aprendizaje:** No fallar no es lo mismo que estar bien. La máquina no se rompió, pero el costo de posponer ya llegó en otra forma: merma, horas extra y gente cansada. Es menos visible que una falla, y por eso es fácil seguir pagándolo. *Un riesgo que no se materializa todavía no es un riesgo resuelto.*

**Concepto:** Cortoplacismo. La máquina no se rompió, pero la merma y las horas extra ya cobran lo que se ahorró al posponer. Aguantar hasta enero protege la entrega de esta temporada y vuelve a pasarle la cuenta al margen y a la gente.

### Incumplimiento de nivel de servicio

`c-mant-queja` · día 5 · email · de Sofía Leal (Compradora de categoría · SuperNorte) · involucra a Héctor Salinas (Director Comercial · 22 años en Cumbre), Lucía Treviño (Directora de Finanzas)

**Cuándo llega (condición causal verificable):** solo si en «Llamada perdida · Javier Ortiz (Planta)» elegiste «Soldar el eje en el taller para arrancar mañana y pedir la refacción por barco. Que la línea 2 cubra lo más urgente de SuperNorte.» o no responder y el azar del periodo cae en 70 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Director:
> En las últimas tres semanas su nivel de servicio bajó a 86 % y en 12 tiendas encontramos empaques mal sellados en anaquel. Tuvimos que retirarlos.
> Nuestra política es clara: penalización de 3 % sobre lo facturado del periodo y revisión del espacio en anaquel para el siguiente trimestre.
> Necesito saber hoy qué va a hacer para que no vuelva a pasar.
> Sofía Leal

**Lo que sabes**

| Dato | Valor |
|---|---|
| Nivel de servicio acordado | 95 % |
| Nivel de servicio real (3 semanas) | 86 % |
| Penalización | $1.4 M |
| Planta | La soldadura del eje cedió dos veces |

**Pregunta:** SuperNorte reclama. ¿Qué le respondes?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Aceptar la penalización, explicarle a Sofía la falla de la envasadora con datos y comprometer la reparación de fondo con un reporte semanal. | Caja -3, Clientes +2, Consejo +1 | 3 | — |
| **b.** Pedirle que condone la penalización a cambio de una promoción pagada por nosotros en sus tiendas durante el próximo mes. | Margen -2, Clientes +2 | 2 | — |
| **c.** Disputar la penalización: el sellado pasó nuestras pruebas, y el daño pudo ocurrir en su centro de distribución. | Caja +2, Clientes -4 | 1 | — |
| *(no responder)* | Caja -3, Clientes -3 | — | — |

**Qué pasa después de cada opción**

- **a.** Pagas la penalización completa. SuperNorte ve un proveedor que reconoce el problema y lo está resolviendo, y eso pesa en la revisión del anaquel. *Respuesta:* Le agradezco la claridad, Director. / Mándeme el primer reporte el lunes y lo comparto con mi gerente. *Consecuencia futura:* llega «La envasadora: reconstruir o reemplazar».
- **b.** Cambias una multa por un descuento que sale del margen. SuperNorte gana una promoción; tú ganas tiempo, no confianza. *Respuesta:* Lo puedo revisar con mi gerente. / Si la promoción va en las tiendas donde retiramos producto, tiene más posibilidades. *Consecuencia futura:* llega «La envasadora: reconstruir o reemplazar».
- **c.** Te ahorras la multa por ahora y conviertes un problema de planta en un pleito con tu cliente más grande. *Respuesta:* Director, tenemos fotos de los empaques en anaquel con su lote. / Lo voy a escalar con mi gerente. *Consecuencia futura:* llega «La envasadora: reconstruir o reemplazar».
- **sin respuesta.** Sin respuesta, SuperNorte aplicó la penalización y anotó al proveedor como riesgo.

**Aprendizaje:** El problema de planta llega al cliente. Lo que empezó como una decisión de mantenimiento ya es un tema comercial. Con un cliente con el que vas a negociar muchas veces, cómo respondes hoy pesa en la siguiente negociación. *La reputación con un cliente se construye en los reclamos, no en las juntas de ventas.*

**Concepto:** Juego repetido y reputación. SuperNorte es el cliente con el que vas a negociar cada trimestre. Disputar la penalización ahorra caja hoy; aceptarla con un plan, o cambiarla por una promoción, define cómo te va a tratar en la revisión del anaquel.

### La envasadora: reconstruir o reemplazar

`c-mant-inversion` · día 6 · reporte · de Lucía Treviño (Directora de Finanzas) · involucra a Javier Ortiz (Gerente de Planta), Carla Méndez (Consejera independiente)

**Cuándo llega (condición causal verificable):** solo si en «Incumplimiento de nivel de servicio» elegiste «Aceptar la penalización, explicarle a Sofía la falla de la envasadora con datos y comprometer la reparación de fondo con un reporte semanal.» o «Pedirle que condone la penalización a cambio de una promoción pagada por nosotros en sus tiendas durante el próximo mes.» o «Disputar la penalización: el sellado pasó nuestras pruebas, y el daño pudo ocurrir en su centro de distribución.» o no responder (siempre).

**Contexto**

> Te paso el diagnóstico del fabricante sobre la envasadora de la línea 1. La soldadura dañó la flecha y el desgaste llegó a la estructura: el mantenimiento mayor que costaba $1.8 M ya no alcanza.
> Hay dos caminos serios y uno para comprar tiempo. Cualquiera sale más caro que lo que nos ahorramos al posponer. Te lo digo sin reproche: es la cuenta.
> Para el consejo necesito tu decisión y cómo la vas a explicar.

**Lo que sabes (Lucía)**

| Dato | Valor |
|---|---|
| Reconstrucción por el fabricante | $5.2 M · 10 días de paro |
| Envasadora nueva | $12 M · 4 meses de entrega |
| Rentar una envasadora mientras | $300 mil al mes |
| Lo que se ahorró al posponer | $1.8 M |

**Pregunta:** ¿Qué propones al consejo?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Reconstruirla con el fabricante, contarle al consejo que posponer el mantenimiento fue mi error y proponer un programa preventivo para las tres líneas. | Caja -5, Consejo +2 | 3 | — |
| **b.** Comprar la envasadora nueva con crédito y rentar una mientras llega: dejamos de parchar de una vez y ganamos capacidad para crecer. | Caja -3, Margen -2, Clientes +2 | 2 | — |
| **c.** Rentar una envasadora tres meses y decidir la inversión en enero, con los números del año cerrado y otra cotización en la mano. | Caja +1, Margen -2, Consejo -1 | 1 | — |
| *(no responder)* | Margen -2, Consejo -3 | — | — |

**Qué pasa después de cada opción**

- **a.** La reparación de fondo cuesta casi tres veces lo que te ahorraste. Reconocerlo frente al consejo te cuesta orgullo y te gana credibilidad. *Respuesta:* Eso es lo que el consejo necesita oír. / (Carla) Gracias por no maquillarlo. Así sí se puede defender. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Resuelves de raíz y ganas capacidad, con deuda nueva y cuatro meses de renta. Es una apuesta de crecimiento disfrazada de reparación. *Respuesta:* Es mucho dinero para el momento en que estamos. / Lo armo, pero el banco va a pedir garantías y el consejo va a preguntar por qué ahora. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** Cuidas la caja este trimestre y decides con más información. Pagas renta y vuelves a posponer, ahora con el consejo mirando. *Respuesta:* Es prudente para la caja. / (Javier) Jefe, rentada o no, la nuestra se sigue deteriorando. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, Finanzas rentó una envasadora y el consejo preguntó quién decidía.

**Aprendizaje:** La cuenta completa de un ahorro. El ahorro de posponer se veía en la caja del trimestre. El costo llegó repartido: flete urgente, penalización, reclamo del cliente y una reparación mayor. Ninguno de esos números estaba en el reporte del día en que decidiste. *Las consecuencias de una decisión operativa casi nunca llegan juntas ni con el mismo nombre: por eso cuesta verlas.*

**Concepto:** Costos hundidos. Los $1.8 M que se ahorraron ya no regresan. La decisión de hoy es solo entre reconstruir, comprar o rentar con los costos que vienen, sin tratar de justificar lo que se decidió antes.

### Javier Ortiz

`c-mant-dosificador` · día 5 · whatsapp · de Javier Ortiz (Gerente de Planta) · involucra a Sofía Leal (Compradora de categoría · SuperNorte), Lucía Treviño (Directora de Finanzas)

**Cuándo llega (condición causal verificable):** solo si en «Mantenimiento mayor de la envasadora de la línea 1» elegiste «Cambiar solo las mordazas de sellado este fin de semana, que causan la mayoría de los paros, y dejar el mantenimiento mayor para enero.» y el azar del periodo cae en 35 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Jefe, las mordazas nuevas jalan perfecto: no se nos ha vuelto a parar la línea.
> Pero salió otra cosa. El dosificador, que no tocamos, está llenando disparejo. En la auditoría de hoy, 1 de cada 20 empaques traía menos contenido del que dice la etiqueta.
> Ya separé el lote. Lo que no sé es cuánto salió así en las últimas dos semanas.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Empaques con menos contenido | 5 % del lote auditado |
| Producto enviado en 2 semanas | Cerca de $3 M |
| Calibrar el dosificador | 1 día de paro · $150 mil |
| Si lo detecta la autoridad | Multa e inmovilización de producto |

**Pregunta:** ¿Qué haces con lo que ya salió?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Calibrar hoy, avisarle a SuperNorte qué lotes pueden venir bajos y reponerles sin costo lo enviado en esas dos semanas. | Caja -3, Clientes +2, Consejo +1 | 3 | — |
| **b.** Calibrar hoy, reforzar el muestreo y no decirle nada a SuperNorte de lo que ya salió: el promedio queda dentro de tolerancia y nadie se ha quejado. | Caja +1, Clientes -2, Equipo -1 | 1 | sí |
| **c.** Calibrar hoy, avisarle ya a SuperNorte que esos lotes están en revisión y que Calidad mida una muestra grande; en 48 horas le digo cuánto se repone. | Caja -1, Clientes -1, Equipo +1 | 2 | — |
| *(no responder)* | Clientes -2, Equipo -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Pagas la reposición y un día de paro. SuperNorte se entera por ti y no por un cliente o por la autoridad. *Respuesta:* Va, jefe. Le paso hoy los números de lote. / (Sofía) Le agradezco que nos avise antes de que lo encontremos nosotros. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** No pagas reposición. Pero ya sabes que hay empaques con menos de lo que dice la etiqueta en el anaquel de tu cliente y decidiste callarlo: si aparece, ya no es una falla de la máquina, es una decisión tuya. Eso es una línea roja. *Respuesta:* Como usted diga, jefe, pero yo no voy a firmar que todo salió bien. / Reforzamos el muestreo desde el siguiente turno. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** El cliente sabe desde hoy lo que tú sabes y decides la reposición con el tamaño real del problema. Pagas el muestreo y dos días de incertidumbre con tu cliente más grande. *Respuesta:* Me parece, jefe. Mañana tengo la muestra. / (Sofía) Gracias por avisar. Espero el número el jueves; si es grande, lo retiramos juntos. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, se calibró la máquina y nadie le avisó al cliente.

**Aprendizaje:** El arreglo parcial deja puntos ciegos. Cambiar solo las mordazas resolvió lo que se veía. El dosificador no se revisó y el problema apareció por otro lado. Un arreglo parcial puede ser buena decisión, siempre que sepas qué dejaste sin revisar. Lo que no es negociable es avisar: corregir hacia adelante sin decirle al cliente lo que ya recibió convierte una falla de máquina en un engaño. *Lo que no revisas no desaparece: solo deja de estar en tu reporte.*

**Concepto:** Calidad en la fuente. El dosificador que no se revisó llenó empaques con menos contenido. Corregir la máquina resuelve lo que viene; lo que ya salió obliga a decidir si el cliente se entera por ti o por su propia báscula.

