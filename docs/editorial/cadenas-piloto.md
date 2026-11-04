# Cadenas piloto de consecuencias (v7): una por empresa

Generado del contenido real. Cada cadena es una decisión del día 2 con tres caminos: uno con consecuencia segura (día 4) y dos inciertos (días 4 y 5) cuya probabilidad se le dice al jugador desde el día 2. Solo llegan en periodos v7; los periodos v6, v4 y las temporadas no cambian.

Validación automática por cadena (`cadenas.test.ts`): versión, causalidad (nada llega antes de su detonador y la pantalla lo conecta), caminos distintos, frecuencia real igual a la anunciada, costo y beneficio en cada opción, ninguna dominante, el score no coincide con la que más paga, personajes del elenco de la empresa.

## Forja Norte

### 41 días de inventario: la caja está en el almacén

`fn-d2-inventario` · día 2 · reporte · de Marcos Elizondo (Director de Finanzas) · involucra a Ing. Ramón Villarreal (Director de Operaciones · 25 años en la planta), Chuy Morales (Supervisor de la línea 3 · 2.º turno), Greg Holloway (Purchasing Manager · Aurora Motors)

**Contexto**

> Director: cerramos el mes con 41 días de inventario; la meta del fondo es 25. Son cerca de $190 M parados en materia prima, piezas en proceso y producto terminado. Zertuche preguntó en el comité por qué la caja no sube si vendemos más.
> Ramón dice que el colchón existe porque Aurora cambia su programa cada semana y nadie quiere ser el proveedor que le para la línea. Las dos cosas son ciertas.
> Te pongo tres caminos. Ninguno es gratis.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Días de inventario hoy | 41 (meta del fondo: 25) |
| Liberar 10 días de inventario | ≈ $45 M de caja |
| Factoraje sobre facturas de Aurora | 1.1 % mensual · en 4 de cada 10 casos el cliente ve el aviso de cesión y pide explicaciones |
| Ramón: si se congelan compras de golpe | En 4 o 5 de cada 10 meses Aurora mueve su programa lo suficiente para dejarnos cortos |
| Cargo de Aurora por paro de línea | Hasta $2 M por hora |

**Pregunta:** ¿Cómo liberas la caja atrapada en inventario?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Bajar a 30 días en ocho semanas con los equipos de cada línea; Calidad cuida las piezas críticas de Aurora. | Caja +2, Equipo +2, Margen -1, Consejo -1 | 3 | — |
| **b.** Congelar compras de materia prima tres semanas y producir con lo que hay, para que el fondo vea la caja este mes. | Caja +4, Consejo +1, Clientes -2, Equipo -1 | 1 | — |
| **c.** Adelantar caja con factoraje de las facturas de Aurora y bajar el inventario despacio, sin mover la producción. | Caja +3, Equipo +1, Margen -2 | 2 | — |
| *(no responder)* | Caja -1, Consejo -2 | — | — |

**Qué pasa después de cada opción**

- **a.** Liberas caja poco a poco y sin arriesgar la entrega. Le cuesta horas a la planta y el fondo verá el resultado hasta el siguiente cierre. *Respuesta:* Es más lento de lo que el fondo quiere, pero es más sólido. / (Chuy) En la línea 3 sabemos dónde está el exceso. En una semana lo tenemos mapeado. *Consecuencia futura:* llega «Chuy Morales».
- **b.** La caja sube este mismo mes. Te quedas sin colchón justo con el cliente que cobra por hora de paro. *Respuesta:* Se libera rápido, eso sí. / (Ramón) Director, si Aurora mueve su programa nos quedamos sin piezas. Yo no firmo eso. *Consecuencia futura:* llega «Llamada perdida · Ing. Ramón Villarreal» (en 45 de cada 100).
- **c.** Tienes la caja sin tocar la operación. Pagas intereses cada mes y el inventario sigue ahí. *Respuesta:* Lo puedo cerrar con el banco esta semana. / Ojo: cuesta, y Aurora va a recibir el aviso de cesión de sus facturas. *Consecuencia futura:* llega «Aurora Motors · Supplier financial review» (en 40 de cada 100).
- **sin respuesta.** Sin decisión, el inventario siguió en 41 días y el fondo volvió a preguntar.

**Aprendizaje:** La caja que está en el almacén. Una empresa que vende más puede tener menos caja si el inventario crece más rápido que las ventas. Liberarlo es dinero real, pero el colchón existe por algo: la pregunta es quién decide qué se recorta y con qué riesgo. *El inventario es caja con otra forma: cuesta mantenerlo y cuesta quedarse sin él.*

**Concepto:** Liquidez y capital de trabajo. Vender más no sube la caja si el dinero se queda en el almacén. Bajar días de inventario con los equipos de cada línea libera caja sin arriesgar la entrega; congelar compras de golpe o adelantar cobros resuelve el mes y abre otro riesgo.

### Chuy Morales

`fn-c-inv-lineas` · día 4 · whatsapp · de Chuy Morales (Supervisor de la línea 3 · 2.º turno) · involucra a Ing. Ramón Villarreal (Director de Operaciones · 25 años en la planta), Teresa Galván (Directora de Personas)

**Cuándo llega (condición causal verificable):** solo si en «41 días de inventario: la caja está en el almacén» elegiste «Bajar a 30 días en ocho semanas con los equipos de cada línea; Calidad cuida las piezas críticas de Aurora.» (siempre).

**Contexto**

> Director, buenas noticias de la línea 3: desde que lo arrancamos bajamos de 41 a 31 días de inventario sin un solo faltante.
> Encontramos $12 M en piezas de un modelo que Aurora ya no pide. Y la gente propone hacerlo en las otras cuatro líneas.
> Nomás una cosa: el bono de Ramón y de los supervisores se paga por piezas producidas, no por inventario. Así nadie va a querer producir menos.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Inventario de la línea 3 | 31 días (antes 41) |
| Caja liberada en la línea 3 | $11 M |
| Piezas de un modelo descontinuado | $12 M en libros · se venden en $2 M |
| Bono de supervisores | 100 % por piezas producidas |

**Pregunta:** ¿Cómo sigues?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Llevarlo a las cinco líneas y cambiar el bono: mitad por entregas a tiempo y mitad por días de inventario. | Caja +3, Consejo +1, Equipo -2, Margen -1 | 3 | — |
| **b.** Llevarlo a las cinco líneas sin tocar el bono todavía, y revisar los incentivos con Teresa en enero. | Caja +2, Equipo +1, Margen -1 | 2 | — |
| **c.** Dejar la línea 3 como ejemplo y usar los $11 M liberados para adelantar el pago al fondo este trimestre. | Consejo +3, Caja +1, Equipo -2 | 1 | — |
| *(no responder)* | Equipo -2 | — | — |

**Qué pasa después de cada opción**

- **a.** La mejora se vuelve sistema y el bono deja de empujar al exceso. Ramón y algunos supervisores sienten que les cambiaste las reglas a medio año. *Respuesta:* ¡Eso, Director! Así sí se va a mover la planta. / (Ramón) Lo del bono lo tengo que platicar con mis supervisores. No les va a gustar a todos. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Avanzas sin pelear el bono. La planta sigue cobrando por producir más, así que el avance dependerá de quién lo empuje. *Respuesta:* Va, Director. Aunque sin el bono va a costar más trabajo. / (Teresa) Si esperamos a enero, que quede en la agenda desde hoy. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** El fondo recibe una buena noticia este trimestre. La planta aprende que su idea sirvió para el reporte, no para cambiar cómo se trabaja. *Respuesta:* Ah, bueno. Pensé que íbamos por las demás líneas. / La gente estaba entusiasmada, Director. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, la mejora se quedó en una línea y el entusiasmo se enfrió.

**Aprendizaje:** Una buena idea necesita un incentivo que no la contradiga. Lo que la línea 3 logró se puede repetir, pero no mientras el bono premie producir de más. Escalar una mejora casi siempre obliga a revisar cómo se paga. *La gente hace lo que se mide y se paga, no lo que se pide en una junta.*

**Concepto:** Diseño de incentivos (ley de Goodhart). El bono por piezas premia producir de más, que es justo lo que llenó el almacén. Si el indicador que se paga contradice la meta de caja, la gente sigue al bono; cambiar cómo se mide alinea las dos cosas.

### Llamada perdida · Ing. Ramón Villarreal

`fn-c-inv-faltante` · día 4 · llamada · de Ing. Ramón Villarreal (Director de Operaciones · 25 años en la planta) · involucra a Greg Holloway (Purchasing Manager · Aurora Motors), Marcos Elizondo (Director de Finanzas), Fermín Treviño (Secretario general del sindicato)

**Cuándo llega (condición causal verificable):** solo si en «41 días de inventario: la caja está en el almacén» elegiste «Congelar compras de materia prima tres semanas y producir con lo que hay, para que el fondo vea la caja este mes.» y el azar del periodo cae en 45 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Mensaje de voz · 0:51
> «Director, Aurora adelantó dos días el programa de la SUV y nos falta materia prima para una pieza crítica. El proveedor la puede traer, pero no antes del jueves. Si no surtimos el miércoles, les paramos la línea.»
> «Necesito que usted decida ya.»

**Lo que sabes**

| Dato | Valor |
|---|---|
| Faltante | 1 pieza crítica · 2 turnos de producción |
| Flete aéreo urgente de la materia prima | $3.5 M · llega mañana |
| Cargo de Aurora por paro de línea | Hasta $2 M por hora |
| Compras congeladas | Desde tu decisión de bajar inventario |

**Pregunta:** Aurora puede quedarse sin piezas. ¿Qué haces?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Pagar el flete aéreo, descongelar las compras críticas y llamarle yo a Greg hoy para avisarle del riesgo. | Caja -3, Clientes +1, Equipo +1 | 3 | — |
| **b.** Pedirle a Aurora mover dos días su programa y ofrecer pagar nosotros sus horas extra si hacen falta. | Clientes -2, Caja +1 | 2 | — |
| **c.** Surtir parcial el miércoles con lo que haya y meter tres turnos extra el fin de semana para completar. | Caja +2, Clientes -1, Equipo -2 | 1 | — |
| *(no responder)* | Caja -4, Clientes -4 | — | — |

**Qué pasa después de cada opción**

- **a.** Pagas caro el flete y pierdes parte de la caja que habías liberado. Aurora no para y se entera por ti. *Respuesta:* Gracias, Director. Con eso llegamos. / (Greg) Appreciate the heads-up. Mándeme el plan por escrito. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Si Aurora acepta, te ahorras el flete. Tu scorecard registra que pediste ajustar su programa por un problema tuyo. *Respuesta:* Puede funcionar si Greg tiene margen. / (Greg) I'll check. No le prometo nada y esto va a su scorecard. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** No pagas flete. Aurora recibe incompleto y la planta vuelve a pagar con fines de semana una decisión de compras. *Respuesta:* Se puede, pero la gente ya viene de dos fines de semana. / (Fermín) Director, la base ya está cansada de pagar las prisas. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, Aurora paró su línea dos horas y aplicó el cargo.

**Aprendizaje:** El colchón que se quitó de golpe. Bajar el inventario liberó caja, pero quitarlo sin revisar qué piezas eran críticas dejó a la planta expuesta al primer cambio de programa de Aurora. El costo llegó en otra forma: fletes, cargos o fines de semana. *Un riesgo que aceptaste para mejorar la caja se paga con caja cuando aparece.*

**Concepto:** Riesgo de proveedor único. Al congelar compras desapareció el colchón que cubría los cambios de programa de Aurora. Con un solo cliente que puede parar su línea, el inventario de seguridad de las piezas críticas no es desperdicio sino seguro.

### Aurora Motors · Supplier financial review

`fn-c-inv-factoraje` · día 5 · email · de Greg Holloway (Purchasing Manager · Aurora Motors) · involucra a Marcos Elizondo (Director de Finanzas), Daniela Kuri (Directora Comercial)

**Cuándo llega (condición causal verificable):** solo si en «41 días de inventario: la caja está en el almacén» elegiste «Adelantar caja con factoraje de las facturas de Aurora y bajar el inventario despacio, sin mover la producción.» y el azar del periodo cae en 40 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Estimado Director:
> Nuestro departamento de Tesorería recibió el aviso de cesión de sus facturas a un banco. Es la primera vez que Forja Norte lo hace en ocho años.
> Para la evaluación de proveedores de la plataforma 2028 necesitamos sus estados financieros del trimestre y una explicación de su situación de liquidez antes del viernes.
> Greg Holloway
Purchasing Manager · Aurora Motors México

**Lo que sabes**

| Dato | Valor |
|---|---|
| Factoraje vigente | $40 M adelantados · 1.1 % mensual |
| Lo que pide Aurora | Estados financieros y explicación de liquidez |
| Plataforma 2028 | Evaluación de proveedores en 3 semanas |
| Inventario | Sin cambio: el factoraje no lo tocó |

**Pregunta:** Aurora pregunta por tu liquidez. ¿Qué le respondes?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Mandar los estados financieros y explicar que el factoraje es temporal mientras bajamos inventario. | Clientes +1, Consejo +1, Caja -1, Margen -1 | 3 | — |
| **b.** Cancelar el factoraje este mes para que no lleguen más avisos y cubrir el hueco con el crédito del banco. | Clientes +1, Margen +1, Consejo -1, Caja -1 | 2 | — |
| **c.** Responder que es práctica normal de tesorería y no mandar estados financieros hasta que lo pida el contrato. | Caja +1, Margen +1, Clientes -2 | 1 | — |
| *(no responder)* | Clientes -3, Consejo -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Expones tus números a tu cliente más grande. Aurora entiende la situación, aunque te anota como proveedor a vigilar. *Respuesta:* Thank you. Eso es lo que necesitaba ver. / (Marcos) Les estamos enseñando todo, Director. Espero que sirva. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** El aviso deja de llegar a Aurora. Cambias un costo financiero por otro y la pregunta de liquidez sigue sin respuesta. *Respuesta:* Noted. / Igual necesito los estados financieros antes del viernes. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** Proteges tu información, pero ante tu cliente principal la falta de respuesta se lee como problema. *Respuesta:* Director, no es una solicitud opcional si quiere participar en 2028. / Lo dejo anotado. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin respuesta, Aurora anotó a Forja como riesgo financiero para 2028.

**Aprendizaje:** Cuando la caja se nota afuera. El factoraje resolvió la caja sin tocar la operación, pero le avisó al cliente principal que algo pasaba. Con un cliente que concentra la venta, cómo financias tu operación también es parte de la relación. *Cada decisión financiera manda una señal; elige si la explicas tú o la interpreta otro.*

**Concepto:** Concentración de clientes. Cuando el 72% de la venta depende de un cliente, cada señal financiera que ese cliente ve pesa en la siguiente adjudicación. Ceder sus facturas compra caja hoy y le avisa a Aurora que la planta anda corta.

## Grupo Brasa

### Proveedor de res: 14 % más barato

`gb-d2-proveedor` · día 2 · reporte · de Fernanda «Fer» Ruvalcaba (Directora de Finanzas) · involucra a Chef Andrés Topete (Director de Cocina), Maru Gutiérrez (Gerente de Brasa Andares)

**Contexto**

> Te paso el análisis que me pediste. La res es el 38 % de nuestro costo de insumos y encontré un proveedor de Sonora 14 % más barato que el actual. Con eso el prime cost baja casi dos puntos.
> Andrés probó la muestra y dice que está bien, pero que no es igual: el marmoleo varía más de lote a lote y al proveedor no lo conocemos en temporada alta.
> El proveedor actual lleva 11 años con nosotros y nunca nos ha fallado un fin de semana.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Ahorro si se cambia en las 34 sucursales | ≈ $9 M al año |
| Prueba ciega en 4 sucursales | 3 semanas · el ahorro se retrasa un mes |
| Andrés: con un proveedor nuevo sin probar | En 1 de cada 2 casos la calidad varía lo suficiente para notarse en las reseñas |
| Proveedor actual | 11 años · cero faltantes de fin de semana |

**Pregunta:** ¿Cambias de proveedor de res?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Hacer una prueba ciega en cuatro sucursales tres semanas, con calificación de comensales y merma, antes de decidir. | Clientes +1, Margen -1, Equipo +1 | 3 | — |
| **b.** Cambiar en las 34 sucursales desde el lunes: el margen es el encargo del consejo y la muestra pasó. | Margen +3, Clientes -1, Equipo -1 | 1 | — |
| **c.** Llevarle la cotización al proveedor actual y pedirle igualar al menos la mitad del ahorro por volumen anual. | Margen +1, Clientes +1, Caja -1 | 2 | — |
| *(no responder)* | Margen -1, Consejo -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Tardas un mes más en ver el ahorro. Decides con datos de tus propios comensales y no con una muestra. *Respuesta:* Es lo responsable, aunque el ahorro llega un mes después. / (Andrés) Yo armo la prueba con Maru en Andares. *Consecuencia futura:* llega «Resultados de la prueba ciega de res».
- **b.** El ahorro llega completo desde este mes. Si la calidad varía, la vas a ver primero en las reseñas. *Respuesta:* Perfecto. Empiezo a negociar volúmenes hoy. / (Andrés) Lo hago, pero no me pidan que garantice cada corte. *Consecuencia futura:* llega «Maru Gutiérrez» (en 50 de cada 100).
- **c.** Conservas la calidad conocida y bajas una parte del costo. El ahorro es menor y el proveedor va a pedir algo a cambio. *Respuesta:* Puede funcionar. Él no quiere perder la cuenta. / Le pido cita para el jueves. *Consecuencia futura:* llega «El proveedor de res acepta… con condiciones» (en 40 de cada 100).
- **sin respuesta.** Sin decisión, el prime cost siguió igual y el consejo volvió a preguntar.

**Aprendizaje:** El ahorro que se ve en el menú. En un restaurante, el insumo principal es parte de la promesa al comensal. Cambiarlo baja el costo de inmediato; el riesgo es que se note en el plato antes que en el estado de resultados. *Un ahorro en el insumo que define tu marca se prueba con tus clientes, no en la oficina.*

**Concepto:** Experimento controlado. Una carne 14% más barata puede mejorar el margen o cambiar el sabor que trae a los comensales. Probar a ciegas en cuatro sucursales mide las dos cosas antes de cambiar las 34; cambiar todo de una vez apuesta el nombre de la marca.

### Resultados de la prueba ciega de res

`gb-c-prov-piloto` · día 4 · reporte · de Chef Andrés Topete (Director de Cocina) · involucra a Fernanda «Fer» Ruvalcaba (Directora de Finanzas), Maru Gutiérrez (Gerente de Brasa Andares)

**Cuándo llega (condición causal verificable):** solo si en «Proveedor de res: 14 % más barato» elegiste «Hacer una prueba ciega en cuatro sucursales tres semanas, con calificación de comensales y merma, antes de decidir.» (siempre).

**Contexto**

> Te paso los resultados de la prueba ciega. En tres sucursales la calificación de los comensales quedó igual y la merma bajó un poco.
> En Andares, la que más vende cortes premium, la calificación del rib eye bajó de 4.7 a 4.3. Maru dice que los clientes frecuentes sí lo notaron.
> Fer quiere cambiar en todas. Yo propongo otra cosa. Tú decides.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Sucursales sin diferencia | 3 de 4 |
| Calificación del rib eye en Andares | 4.3 (antes 4.7) |
| Cortes premium en la venta | 18 % |
| Ahorro sin los cortes premium | ≈ $7 M al año |

**Pregunta:** ¿Cómo usas los resultados?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Cambiar en cortes de uso diario y dejar los premium con el proveedor actual; medir calificación cada semana. | Margen +2, Clientes +1, Equipo -1, Caja -1 | 3 | — |
| **b.** Cambiar todo en las 34 sucursales: tres de cuatro no notaron nada y Andares puede ajustar su cocción. | Margen +3, Clientes -2 | 2 | — |
| **c.** Quedarse con el proveedor actual en todo: un punto de calificación en Andares vale más que el ahorro. | Clientes +1, Equipo -1, Margen -1 | 1 | — |
| *(no responder)* | Margen -1, Equipo -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Capturas la mayor parte del ahorro y cuidas los cortes que definen a la marca. Manejas dos proveedores y más trabajo de compras. *Respuesta:* Así protegemos lo que nos hace Brasa. / (Fer) Es menos ahorro, pero lo entiendo. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Te quedas con todo el ahorro. Aceptas que los clientes más fieles de cortes premium noten la diferencia. *Respuesta:* Lo cambio, aunque en Andares lo vamos a sentir. / (Maru) Mis clientes de los jueves ya preguntaron qué pasó con el rib eye. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** La calidad queda intacta. El costo sigue alto y el equipo de Finanzas siente que la prueba no sirvió. *Respuesta:* Me quedo tranquilo con la calidad, pero el consejo pidió margen. / (Fer) Hicimos la prueba para nada. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, la prueba se cerró y el ahorro se perdió.

**Aprendizaje:** Un piloto rara vez da un sí o un no. La prueba no dijo «cambia» ni «no cambies»: dijo dónde sí y dónde no. Aprovechar un piloto es leerlo por partes en vez de buscar la respuesta que ya querías. *Un piloto vale por lo que te enseña, no por si confirma tu idea.*

**Concepto:** Diagnóstico antes de prescribir. El piloto no dio un sí ni un no: unas sucursales notaron la diferencia y otras no. Entender por qué cambia según el corte y la cocina vale más que forzar una conclusión con datos mezclados.

### Maru Gutiérrez

`gb-c-prov-resenas` · día 4 · whatsapp · de Maru Gutiérrez (Gerente de Brasa Andares) · involucra a Sara Ibarra (Directora de Marketing y Digital), Chef Andrés Topete (Director de Cocina), Fernanda «Fer» Ruvalcaba (Directora de Finanzas)

**Cuándo llega (condición causal verificable):** solo si en «Proveedor de res: 14 % más barato» elegiste «Cambiar en las 34 sucursales desde el lunes: el margen es el encargo del consejo y la muestra pasó.» y el azar del periodo cae en 50 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Director, en Andares nos están llegando reseñas de carne dura. Ya van 23 esta semana en las apps.
> Y el sábado el proveedor nuevo no completó el pedido: nos faltó rib eye en 6 sucursales en la noche más fuerte.
> Sara dice que la calificación general bajó de 4.5 a 4.2. Los gerentes me preguntan qué les digo a los clientes.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Reseñas negativas por la carne | 23 en una semana |
| Calificación promedio en apps | 4.2 (antes 4.5) |
| Sucursales con faltante el sábado | 6 |
| Regresar al proveedor anterior | Precio anterior + 3 % por reactivar |

**Pregunta:** La calidad se está notando. ¿Qué haces?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Regresar los cortes premium al proveedor anterior, aunque cueste 3 % más, y responder cada reseña con una invitación. | Margen -2, Clientes +2, Caja -1 | 3 | — |
| **b.** Quedarse con el proveedor nuevo, exigirle por contrato calidad y entregas, y darle un mes para corregir. | Margen +1, Clientes -2 | 2 | — |
| **c.** Mantener al proveedor y lanzar una promoción en apps para subir la calificación mientras se estabiliza. | Clientes +1, Margen -1, Equipo -1 | 1 | — |
| *(no responder)* | Clientes -3, Equipo -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Pagas más por volver y pierdes parte del ahorro. Los comensales ven que alguien respondió. *Respuesta:* Gracias, Director. Los gerentes van a respirar. / (Fer) Perdemos parte del ahorro y pagamos la reactivación. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Conservas el ahorro y le pones reglas al proveedor. Durante ese mes, cada fin de semana es una apuesta. *Respuesta:* Como usted diga, pero mis clientes no esperan un mes. / (Fer) Le mando hoy la carta con penalizaciones. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** La calificación puede recuperarse un poco. El problema de fondo sigue en el plato y la promoción sale del margen. *Respuesta:* La promoción ayuda a la calificación, pero no a la carne. / (Sara) Puedo tenerla el viernes. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, siguieron las reseñas y los gerentes improvisaron.

**Aprendizaje:** El ahorro que se notó en el plato. Cambiar de golpe sin probar trajo el ahorro y también el riesgo que el chef había anticipado. Cuando el problema llega al cliente, la pregunta ya no es cuánto se ahorra, sino cuánto cuesta recuperar la confianza. *La calidad que pierdes en un fin de semana tarda meses en volver.*

**Concepto:** Comunicación de crisis. Las reseñas malas y los faltantes llegaron juntos a las 34 sucursales. Reconocer el cambio y corregirlo rápido protege la confianza de los clientes frecuentes; defender la decisión en público la vuelve más cara.

### El proveedor de res acepta… con condiciones

`gb-c-prov-contrato` · día 5 · email · de Fernanda «Fer» Ruvalcaba (Directora de Finanzas) · involucra a Don Ignacio Arce (Fundador · Presidente del consejo), Lourdes Arce (Cofundadora · Consejera)

**Cuándo llega (condición causal verificable):** solo si en «Proveedor de res: 14 % más barato» elegiste «Llevarle la cotización al proveedor actual y pedirle igualar al menos la mitad del ahorro por volumen anual.» y el azar del periodo cae en 40 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> El proveedor actual aceptó bajar 8 % el precio, más de lo que esperaba.
> La condición: contrato de un año, volumen mínimo y 20 % de anticipo del primer trimestre. Dice que con la res tan volátil no puede bajar sin asegurar el volumen.
> Don Ignacio quiere firmar porque es «el de siempre». Lourdes pregunta qué pasa si en marzo abrimos menos sucursales de las previstas.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Descuento ofrecido | 8 % sobre el precio actual |
| Anticipo | 20 % del trimestre · ≈ $6 M |
| Volumen mínimo | 95 % del consumo actual por 12 meses |
| Proveedor nuevo | Sigue ofreciendo 14 % sin anticipo |

**Pregunta:** ¿Firmas el contrato anual?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Firmar con el volumen mínimo en 85 % y el anticipo en dos pagos; negociar esos dos puntos antes de aceptar. | Margen +2, Caja -2, Consejo +1, Equipo -1 | 3 | — |
| **b.** Firmar tal como lo propone: es el proveedor de siempre y el descuento es mejor de lo esperado. | Margen +2, Caja -3, Consejo +1 | 2 | — |
| **c.** No firmar: usar el 8 % como piso y volver a pedirle al proveedor nuevo una prueba en cuatro sucursales. | Caja +1, Margen -1, Consejo -1 | 1 | — |
| *(no responder)* | Margen -1, Consejo -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Aseguras el descuento con un riesgo acotado. El anticipo sale de la caja este mes y la negociación tarda una semana más. *Respuesta:* Lo intento. Si acepta, es un buen acuerdo. / (Lourdes) Con 85 % sí me siento tranquila si abrimos menos. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Aseguras precio y relación. Comprometes caja y un volumen que no podrás bajar si el plan de crecimiento cambia. *Respuesta:* Perfecto. Le confirmo hoy. / (Lourdes) Ojalá no tengamos que cerrar una sucursal este año. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** No comprometes caja ni volumen. Arriesgas una relación de once años y el ahorro se retrasa otra vez. *Respuesta:* Es razonable, pero el de siempre se va a sentir. / (Don Ignacio) Once años y lo tratamos como a cualquiera. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, el descuento se perdió.

**Aprendizaje:** Todo descuento tiene una contraparte. El proveedor de siempre bajó el precio a cambio de seguridad: volumen y anticipo. Negociar bien no es aceptar o rechazar el paquete, sino ajustar las piezas que te ponen en riesgo. *Antes de firmar un buen precio, pregúntate qué pasa si tu plan cambia.*

**Concepto:** BATNA: tu mejor alternativa sin acuerdo. El proveedor actual igualó precio a cambio de un contrato anual con anticipo. Saber qué otra opción real tienes, y cuánto cuesta amarrarte un año, decide si el descuento es buen trato o una dependencia nueva.

## Kúbit

### La factura de la nube subió 40 %

`kb-d2-nube` · día 2 · reporte · de Andrea Quiroga (Directora de Finanzas) · involucra a Guillermo «Memo» Paz (Líder de guardia de infraestructura), Emilio Salinas (Cofundador · Director de Producto e Ingeniería)

**Contexto**

> Director: la factura de infraestructura en la nube subió 40 % en seis meses. Ya es nuestro segundo gasto después de la nómina y nos quita casi un mes de caja al año.
> Memo dice que hay mucho desperdicio: servidores encendidos que nadie usa y copias que se duplican. Emilio quiere aprovechar para cambiar de proveedor, que es más barato.
> Te pongo los tres caminos que tenemos.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Factura mensual de la nube | $3.1 M (hace seis meses: $2.2 M) |
| Optimizar por etapas con el equipo de guardia | −25 % en ocho semanas |
| Cambiar de proveedor en un fin de semana | −35 % desde el mes siguiente |
| Memo: migraciones así de rápidas | 4 o 5 de cada 10 tienen una caída seria en las primeras semanas |
| Compromiso de tres años con el proveedor actual | −30 % · pago anual por adelantado · en 4 de cada 10 rondas el consejo cuestiona la caja comprometida |

**Pregunta:** ¿Qué haces con el costo de la nube?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Optimizar por etapas con el equipo de guardia: apagar lo que no se usa y medir cada semana cuánto bajamos. | Caja +2, Clientes +1, Equipo -1 | 3 | — |
| **b.** Migrar toda la plataforma al proveedor más barato en un solo fin de semana, antes del próximo cierre. | Caja +3, Equipo +1, Clientes -1 | 1 | — |
| **c.** Firmar tres años con el proveedor actual por 30 % de descuento, pagando el primer año por adelantado. | Margen +2, Caja -2, Clientes +1 | 2 | — |
| *(no responder)* | Caja -2 | — | — |

**Qué pasa después de cada opción**

- **a.** El ahorro llega poco a poco y sin riesgo para los clientes. Le quita horas al equipo de guardia durante dos meses. *Respuesta:* Gracias. En dos semanas le enseño lo primero. / (Emilio) Es lento, pero no rompe nada. *Consecuencia futura:* llega «Guillermo «Memo» Paz».
- **b.** El ahorro más grande, desde el mes siguiente. Arriesgas la plataforma en la semana en que tus clientes más la usan. *Respuesta:* ¡Por fin! Lo planeo con el equipo hoy. / (Memo) Director, yo no garantizo que salga sin caídas. *Consecuencia futura:* llega «Llamada perdida · Renata Cruz (Éxito del Cliente)» (en 45 de cada 100).
- **c.** Bajas el costo sin tocar la plataforma. Pagas un año de golpe y te amarras tres años a un proveedor. *Respuesta:* El descuento es bueno. El pago anticipado pesa. / (Memo) Al menos no movemos nada. *Consecuencia futura:* llega «Pregunta antes del consejo: el compromiso con la nube» (en 40 de cada 100).
- **sin respuesta.** Sin decisión, la nube siguió costando más cada mes.

**Aprendizaje:** El costo que crece solo. En software, el costo de infraestructura sube con cada cliente y con cada descuido. Bajarlo es caja real; la pregunta es cuánto riesgo le pasas a tus clientes para lograrlo más rápido. *El ahorro más rápido casi siempre es el que más riesgo traslada a otro.*

**Concepto:** Costo de oportunidad. La factura de nube subió 40% y cada camino consume algo distinto: optimizar por etapas consume horas de ingeniería, migrar en un fin de semana arriesga la operación de los clientes y comprometerse tres años amarra la caja de la ronda.

### Guillermo «Memo» Paz

`kb-c-nube-consumo` · día 4 · whatsapp · de Guillermo «Memo» Paz (Líder de guardia de infraestructura) · involucra a Hernán Villaseñor (Director de Finanzas · Grupo Altamar), Bruno Medina (Director Comercial), Andrea Quiroga (Directora de Finanzas)

**Cuándo llega (condición causal verificable):** solo si en «La factura de la nube subió 40 %» elegiste «Optimizar por etapas con el equipo de guardia: apagar lo que no se usa y medir cada semana cuánto bajamos.» (siempre).

**Contexto**

> Director, con lo primero que apagamos ya bajamos 18 % la factura sin una sola caída.
> Y encontramos algo: los reportes a la medida de Grupo Altamar consumen la tercera parte de toda la infraestructura. Corren cada hora, aunque ellos los ven una vez al día.
> Altamar paga lo mismo que cualquier cliente de su tamaño. Bruno dice que no le toquemos nada antes de la renovación.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Ahorro logrado | 18 % · sin caídas |
| Consumo de los reportes de Altamar | ≈ 33 % de la infraestructura |
| Si corren una vez al día | −20 % adicional |
| Altamar en el ingreso | 22 % |

**Pregunta:** ¿Qué haces con el consumo de Altamar?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Proponerle a Hernán correr sus reportes una vez al día sin costo, o cada hora con un cargo por uso. | Caja +2, Clientes -1, Equipo +1, Consejo -1 | 3 | — |
| **b.** Cambiar los reportes de Altamar a una vez al día sin avisar: el contrato no promete que sean cada hora. | Caja +3, Clientes -2 | 1 | — |
| **c.** Dejar los reportes de Altamar como están hasta la renovación y seguir optimizando todo lo demás. | Clientes +1, Margen -1 | 2 | — |
| *(no responder)* | Margen -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Le das a Altamar la decisión con el costo a la vista. Puede molestarse, pero entiende por qué. *Respuesta:* Así se lo explico con datos, Director. / (Bruno) Es arriesgado tan cerca de la renovación. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Ahorras de inmediato. Si Altamar lo nota antes que se lo expliques, lo va a leer como un cambio a escondidas. *Respuesta:* Técnicamente se puede hoy mismo. / (Bruno) Si Hernán lo nota, se nos complica la renovación. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** Cuidas la renovación de tu cliente más grande. El ahorro grande se queda esperando y otros clientes pagan ese costo en el margen. *Respuesta:* Va, Director, aunque es la parte más grande. / (Bruno) Gracias, después de renovar lo vemos. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, el consumo de Altamar siguió igual.

**Aprendizaje:** El cliente que cuesta más de lo que paga. Medir el costo por cliente cambió la conversación: ya no es «la nube es cara», es «este cliente usa mucho más de lo que paga». Mostrarle el costo y dejarle elegir protege la relación mejor que un cambio en silencio. *Lo que no se mide por cliente lo terminan pagando los demás.*

**Concepto:** Análisis de portafolio (80/20). Un tercio del gasto en nube viene de los reportes de un solo cliente. Encontrar el pequeño grupo de causas que explica la mayor parte del costo permite corregir sin recortar lo que sí sostiene al producto.

### Llamada perdida · Renata Cruz (Éxito del Cliente)

`kb-c-nube-caida` · día 4 · llamada · de Renata Cruz (Directora de Éxito del Cliente) · involucra a Guillermo «Memo» Paz (Líder de guardia de infraestructura), Emilio Salinas (Cofundador · Director de Producto e Ingeniería), Itzel Ramos (Gerente de Soporte)

**Cuándo llega (condición causal verificable):** solo si en «La factura de la nube subió 40 %» elegiste «Migrar toda la plataforma al proveedor más barato en un solo fin de semana, antes del próximo cierre.» y el azar del periodo cae en 45 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Mensaje de voz · 0:47
> «Director, desde la migración la plataforma se cae casi cada tarde, justo en el cierre de mes de los clientes. Itzel tiene 140 tickets abiertos y tres clientes grandes ya pidieron hablar con usted.»
> «Memo dice que puede regresar al proveedor anterior en 48 horas, pero perdemos el ahorro y pagamos los dos este mes.»

**Lo que sabes**

| Dato | Valor |
|---|---|
| Caídas desde la migración | 5 en 6 días · 40 minutos en promedio |
| Tickets abiertos | 140 |
| Regresar al proveedor anterior | 48 horas · pagar ambos este mes |
| Arreglar en el proveedor nuevo | Memo estima 2 semanas |

**Pregunta:** La plataforma se cae en el cierre de mes. ¿Qué haces?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Regresar al proveedor anterior en 48 horas, llamar yo a los tres clientes grandes y dar un crédito por las caídas. | Caja -3, Clientes +1, Equipo +1 | 3 | — |
| **b.** Quedarse en el proveedor nuevo, poner a todo ingeniería a estabilizar dos semanas y avisar a los clientes del plan. | Caja +1, Clientes -2, Equipo -1 | 2 | — |
| **c.** Quedarse, estabilizar con calma y que Soporte responda los tickets sin llamadas de la dirección. | Caja +2, Clientes -3 | 1 | — |
| *(no responder)* | Clientes -4, Equipo -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Pagas los dos proveedores este mes y el crédito a clientes. La plataforma se estabiliza y los clientes saben quién respondió. *Respuesta:* Gracias. Los clientes necesitaban oír eso de usted. / (Emilio) Perdemos el ahorro y la migración queda para después. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Conservas el ahorro si lo estabilizan. Cada caída más le cuesta confianza de clientes y ingeniería deja todo lo demás. *Respuesta:* El equipo lo saca, Director. / (Renata) Dos semanas de caídas es mucho para un cliente en cierre. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** No gastas en revertir. Los clientes grandes no escuchan a la dirección justo cuando más lo esperan. *Respuesta:* Lo intentamos, pero los clientes quieren hablar con alguien de arriba. / (Itzel) Mis agentes ya no saben qué decir. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, siguieron las caídas y empezaron las cancelaciones.

**Aprendizaje:** El ahorro que se cobró en confianza. La migración rápida prometía el ahorro más grande. Cuando falló en el peor momento, la pregunta dejó de ser cuánto ahorrar y pasó a ser cuánto cuesta recuperar a los clientes. *En una crisis con clientes, primero se estabiliza y se da la cara; después se recalcula el ahorro.*

**Concepto:** Respuesta a incidentes. La migración apresurada tiró el servicio en pleno cierre de mes de los clientes. Lo que se hace en las primeras horas, decir qué pasó, restablecer y explicar cómo no se repite, pesa más que la causa técnica.

### Pregunta antes del consejo: el compromiso con la nube

`kb-c-nube-compromiso` · día 5 · email · de Valeria Contreras (Socia de Andes Ventures · Consejera) · involucra a Andrea Quiroga (Directora de Finanzas), Rodrigo Ibarra (Presidente del consejo · Andes Ventures)

**Cuándo llega (condición causal verificable):** solo si en «La factura de la nube subió 40 %» elegiste «Firmar tres años con el proveedor actual por 30 % de descuento, pagando el primer año por adelantado.» y el azar del periodo cae en 40 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Director:
> Revisando el material del consejo vi un pago anticipado de $26 M a la nube que no estaba en el plan. Nos quita dos meses de caja justo antes de salir a levantar la Serie C.
> Entiendo el descuento. Lo que necesito es saber cómo vamos a explicar la caja a los fondos que vamos a visitar.
> Valeria Contreras

**Lo que sabes (Andrea)**

| Dato | Valor |
|---|---|
| Pago anticipado | $26 M · primer año |
| Ahorro en tres años | ≈ $33 M |
| Meses de caja | 12 (antes del pago: 14) |
| Clientes con contrato anual | 40 % · pago anticipado con 5 % de descuento es posible |

**Pregunta:** ¿Cómo respondes al consejo?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Presentarle al consejo el ahorro y la caja con dos escenarios, y el plan para recuperar esos dos meses. | Consejo +2, Caja -1, Equipo -1 | 3 | — |
| **b.** Ofrecer a clientes anuales 5 % de descuento por pagar por adelantado, para reponer la caja este trimestre. | Caja +3, Margen -2, Clientes -1 | 2 | — |
| **c.** Renegociar con el proveedor a un año, con menos descuento y una penalización por cambiar el contrato. | Caja +1, Margen -1, Consejo -1 | 1 | — |
| *(no responder)* | Consejo -3 | — | — |

**Qué pasa después de cada opción**

- **a.** El consejo ve la decisión completa con su costo. Te cuestionan el momento, pero confían en los números. *Respuesta:* Eso es justo lo que necesito llevar. / (Andrea) Armo los dos escenarios para el jueves. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Repones parte de la caja con dinero de tus clientes. Bajas el margen y adelantas ingresos del año que viene. *Respuesta:* Recupera caja, aunque le pega al margen. / (Valeria) Que quede claro en el material que es temporal. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** Recuperas flexibilidad y parte de la caja. Pagas la penalización y el consejo se pregunta por qué se firmó así. *Respuesta:* Se puede, pero el proveedor va a cobrar la penalización. / (Valeria) Bien, pero ¿por qué no lo vimos antes de firmar? *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin respuesta, el consejo discutió el compromiso sin escuchar al director.

**Aprendizaje:** Un buen descuento en mal momento. El compromiso bajó el costo de la nube, pero adelantó dos meses de caja justo antes de una ronda. La decisión era razonable; lo que el consejo necesita es verla completa, con su costo y su plan. *Al consejo no le preocupa que tomes riesgos; le preocupa enterarse de ellos tarde.*

**Concepto:** Relación con el consejo. El compromiso a tres años se firmó antes de que el consejo viera el plan de caja. Una decisión que amarra la pista de la empresa debe llegar al consejo con sus riesgos, no después.

## Punto Madero

### $64 M de mercancía de temporada sin vender

`pm-d2-temporada` · día 2 · reporte · de Diego Villarreal (Director Comercial y de Compras) · involucra a Claudia Leal (Directora de Finanzas), Octavio Ríos (Director de Operaciones y Tiendas), Jesús «Chuy» Elizondo (Gerente de la tienda principal)

**Contexto**

> Director: cerró la temporada y nos quedaron $64 M de mercancía sin vender, entre bodega y anaquel. Es casi el doble que el año pasado.
> Claudia quiere convertirla en caja ya. Octavio dice que si rematamos fuerte, los clientes aprenden a esperar descuentos. Yo creo que una parte se puede guardar para la próxima temporada.
> Te dejo los números para que decidas.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Mercancía de temporada sin vender | $64 M a costo |
| Rebaja escalonada por tienda (15 %, 30 %, outlet) | Recupera ≈ 80 % del costo en seis semanas |
| Remate de 40 % en las 60 tiendas | Recupera ≈ 70 % en dos semanas |
| Octavio: después de un remate así | En 1 de cada 2 casos Mundo Casa responde con un descuento mayor |
| Guardarla en bodega | $600 mil al mes · en 4 de cada 10 temporadas el proveedor cambia de línea y lo guardado vale menos |

**Pregunta:** ¿Qué haces con la mercancía que no se vendió?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Rebajar por etapas tienda por tienda según su venta: 15 %, luego 30 % y lo que quede al outlet. | Caja +2, Margen -1, Clientes +1, Equipo -1 | 3 | — |
| **b.** Rematar todo al 40 % en las 60 tiendas este fin de semana y convertirlo en caja de una vez. | Caja +4, Margen -3, Clientes +1 | 1 | — |
| **c.** Guardar en bodega lo que no pasa de moda y rebajar solo lo que sí, para venderlo completo la próxima temporada. | Margen +2, Caja -2, Equipo +1 | 2 | — |
| *(no responder)* | Caja -2, Margen -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Recuperas más dinero que con un remate y sin educar al cliente a esperar descuentos. Las tiendas tienen seis semanas de reetiquetado. *Respuesta:* Es más trabajo para las tiendas, pero recupera más. / (Diego) Bien, aunque una parte la habría guardado. *Consecuencia futura:* llega «La rebaja funcionó. El problema estaba antes».
- **b.** La caja llega rápido y la bodega queda libre. Regalas margen y le enseñas a tus clientes que conviene esperar. *Respuesta:* Perfecto. Tenemos caja en dos semanas. / (Octavio) Le aviso: los clientes de toda la vida van a esperar el siguiente remate. *Consecuencia futura:* llega «Octavio Ríos» (en 50 de cada 100).
- **c.** Proteges el margen de lo que guardas. Pagas bodega, la caja sigue atrapada y apuestas a que la línea no cambie. *Respuesta:* Así no regalamos margen. / (Claudia) Pagamos bodega varios meses y esa caja sigue parada. *Consecuencia futura:* llega «El proveedor cambió la línea» (en 40 de cada 100).
- **sin respuesta.** Sin decisión, la mercancía siguió parada y pagando bodega.

**Aprendizaje:** Lo que no se vendió también decide. En retail, la mercancía que sobra es caja atrapada y también un mensaje a tus clientes. Rematar libera caja y enseña a esperar; guardar protege el margen y apuesta a que no cambie la temporada. *Cada descuento le enseña algo a tu cliente; elige qué quieres que aprenda.*

**Concepto:** Elasticidad precio. Hay $64 M de mercancía de temporada sin vender. Bajar el precio por etapas mide cuánto responde el cliente antes de regalar margen; liquidar de golpe vacía el inventario y le enseña al cliente a esperar la rebaja.

### La rebaja funcionó. El problema estaba antes

`pm-c-temp-compras` · día 4 · reporte · de Claudia Leal (Directora de Finanzas) · involucra a Diego Villarreal (Director Comercial y de Compras), Jesús «Chuy» Elizondo (Gerente de la tienda principal), Alberto «Beto» Castañeda (Asesor experto · vocero informal de las tiendas)

**Cuándo llega (condición causal verificable):** solo si en «$64 M de mercancía de temporada sin vender» elegiste «Rebajar por etapas tienda por tienda según su venta: 15 %, luego 30 % y lo que quede al outlet.» (siempre).

**Contexto**

> La rebaja escalonada va mejor de lo esperado: con la primera etapa recuperamos el 62 % del costo y las tiendas casi no tocaron el 30 %.
> Pero al cruzar los datos vimos por qué sobró tanto: los compradores pidieron igual para las 60 tiendas, con base en la temporada pasada. Las tiendas de la sierra vendieron la mitad que las de la ciudad.
> Chuy y Beto dicen que los gerentes sabían qué se iba a vender en su tienda, pero nadie les preguntó.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Recuperado en la primera etapa | 62 % del costo |
| Compra por tienda | Igual para las 60 |
| Venta de tiendas de la sierra vs. ciudad | ≈ 50 % |
| Pedido de la próxima temporada | Se cierra en 5 semanas |

**Pregunta:** ¿Cómo compras la próxima temporada?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Que cada gerente proponga su pedido con datos de su tienda y que Compras lo consolide y negocie. | Margen +1, Equipo +1, Clientes +1, Consejo -1, Caja -1 | 3 | — |
| **b.** Comprar 30 % menos en todas las tiendas para no volver a quedarnos con sobrante. | Caja +3, Clientes -2 | 1 | — |
| **c.** Contratar un sistema de pronóstico por tienda y que los compradores lo usen desde esta temporada. | Margen +1, Caja -1, Equipo -1 | 2 | — |
| *(no responder)* | Margen -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Compras más cerca de lo que se vende en cada tienda. Los compradores pierden control y el pedido tarda más en armarse. *Respuesta:* (Chuy) ¡Por fin! Yo sé qué se vende en mi tienda. / (Diego) Mis compradores van a sentir que les quitan su trabajo. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Bajas el riesgo de sobrante. Las tiendas que venden más se quedan cortas en su mejor semana. *Respuesta:* Es sencillo de aplicar. / (Chuy) En mi tienda nos vamos a quedar sin mercancía en la mejor semana. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** Mejoras el pronóstico con tecnología. Pagas el sistema y sigues sin aprovechar lo que saben los gerentes. *Respuesta:* Ayuda, aunque el sistema necesita meses de datos. / (Beto) A los gerentes otra vez no se les pregunta. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, la próxima temporada se compra como la anterior.

**Aprendizaje:** El sobrante empezó en la compra. Rebajar bien resolvió el síntoma. La causa estaba en cómo se compra: igual para tiendas que venden distinto. Quien está más cerca del cliente suele saber lo que el promedio esconde. *Un promedio para 60 tiendas no describe a ninguna.*

**Concepto:** Escalar una mejora. La rebaja por etapas mostró qué productos se mueven con poco descuento y cuáles no. Llevar ese aprendizaje a las compras de la siguiente temporada vale más que el margen recuperado esta vez.

### Octavio Ríos

`pm-c-temp-guerra` · día 4 · whatsapp · de Octavio Ríos (Director de Operaciones y Tiendas) · involucra a Diego Villarreal (Director Comercial y de Compras), Mónica Saldívar (Directora de Experiencia del Cliente y Tienda en Línea), Esteban Garza (Presidente del consejo · Hijo del fundador)

**Cuándo llega (condición causal verificable):** solo si en «$64 M de mercancía de temporada sin vender» elegiste «Rematar todo al 40 % en las 60 tiendas este fin de semana y convertirlo en caja de una vez.» y el azar del periodo cae en 50 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Director, Mundo Casa respondió al remate con 50 % en la misma mercancía y lo está anunciando en radio.
> En tienda, los clientes ya preguntan cuándo es nuestro siguiente remate y la venta a precio completo bajó 9 % esta semana.
> Don Esteban me pidió que igualemos. Yo quiero saber qué piensa usted.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Descuento de Mundo Casa | 50 % |
| Venta a precio completo esta semana | −9 % |
| Igualar en las 60 tiendas | ≈ −$8 M de margen |
| Tiendas a menos de 1 km de Mundo Casa | 12 |

**Pregunta:** Mundo Casa respondió. ¿Igualas?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** No igualar: terminar el remate como se anunció y competir con asesoría, entrega a domicilio y garantía. | Margen +1, Clientes -1, Consejo -1, Equipo +1 | 3 | — |
| **b.** Igualar el 50 % en las 60 tiendas y anunciarlo esta misma semana para no perder ni un cliente. | Clientes +1, Consejo +1, Margen -3 | 1 | — |
| **c.** Igualar solo en las 12 tiendas que tienen a Mundo Casa enfrente y mantener el precio en las demás. | Clientes +2, Margen -1, Equipo -1 | 2 | — |
| *(no responder)* | Margen -2, Clientes -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Cortas la guerra de precios y compites en lo que Mundo Casa no tiene. Algunas ventas se van con ellos esta semana. *Respuesta:* (Mónica) Eso sí lo podemos cumplir en las 60 tiendas. / (Don Esteban) Espero que tenga razón. Mi padre nunca dejó que nos ganaran en precio. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Retienes tráfico esta semana. Pierdes margen y confirmas que en esta pelea gana quien descuente más. *Respuesta:* (Don Esteban) Así se compite. / (Octavio) Entendido, aunque ya vamos dos remates en un mes. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** Limitas el costo a donde más duele. Los precios distintos entre tiendas confunden a algunos clientes. *Respuesta:* Así protegemos las tiendas más expuestas. / (Mónica) Los clientes van a ver precios distintos en cada tienda. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, cada tienda puso su propio descuento.

**Aprendizaje:** El remate que invitó a una guerra. Rematar fuerte resolvió la bodega y le enseñó al competidor dónde atacar. En una guerra de precios casi siempre pierden los dos; salir de ella exige competir en algo distinto al descuento. *Si tu única respuesta es bajar el precio, el competidor decide tu margen.*

**Concepto:** Guerra de precios. La liquidación agresiva provocó que la competencia respondiera con su propia rebaja. Una guerra de precios la gana quien aguanta más tiempo perdiendo margen, y casi siempre pierden los dos.

### El proveedor cambió la línea

`pm-c-temp-bodega` · día 5 · email · de Diego Villarreal (Director Comercial y de Compras) · involucra a Claudia Leal (Directora de Finanzas), Inés Treviño (Consejera · Capital Norte)

**Cuándo llega (condición causal verificable):** solo si en «$64 M de mercancía de temporada sin vender» elegiste «Guardar en bodega lo que no pasa de moda y rebajar solo lo que sí, para venderlo completo la próxima temporada.» y el azar del periodo cae en 40 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Director, el proveedor presentó su línea nueva y cambió diseño y empaque. Lo que guardamos en bodega ya se ve de la temporada pasada.
> Mundo Casa va a tener la línea nueva desde el primer día. Si ponemos lo guardado a precio completo, no se va a vender.
> Inés preguntó en el consejo por qué seguimos pagando bodega por mercancía que vale menos.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Mercancía guardada | $38 M a costo |
| Valor estimado hoy | ≈ $23 M |
| Bodega | $600 mil al mes mientras siga guardada |
| Venderla a un mayorista | $21 M · en una semana |

**Pregunta:** Lo guardado vale menos. ¿Qué haces?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Venderla a un mayorista esta semana, reconocer la pérdida ante el consejo y ajustar cómo decidimos guardar. | Caja +2, Margen -3, Consejo +1 | 3 | — |
| **b.** Venderla en tienda junto a la línea nueva, con 25 % de descuento como «precio especial». | Margen -1, Clientes -1, Caja +2 | 2 | — |
| **c.** Guardarla un año más: los diseños regresan y así no reconocemos la pérdida este trimestre. | Margen +1, Caja -2, Consejo -1 | 1 | — |
| *(no responder)* | Caja -2, Consejo -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Reconoces la pérdida y la caja vuelve a moverse. El margen del trimestre lo resiente y el consejo valora la claridad. *Respuesta:* Recuperamos caja y dejamos de pagar bodega. / (Inés) Gracias por decirlo de frente. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Recuperas parte del valor poco a poco. La mercancía vieja le quita espacio y venta a la nueva. *Respuesta:* Algo se va a vender. / (Claudia) Va a competir con la línea nueva en nuestro propio anaquel. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** El trimestre no muestra la pérdida. Sigues pagando bodega por algo que probablemente valga todavía menos. *Respuesta:* Puede regresar, sí. / (Inés) Eso solo mueve la pérdida de fecha. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, la mercancía siguió perdiendo valor.

**Aprendizaje:** Lo que ya se perdió no regresa esperando. Guardar era una apuesta razonable: que la línea no cambiara. Cambió. Lo que se pagó y lo que se perdió ya no regresa; la decisión de hoy es solo qué hacer con lo que vale hoy. *Esperar para no reconocer una pérdida casi siempre la hace más grande.*

**Concepto:** Costos hundidos. Lo que se pagó por la mercancía ya no regresa. Si el proveedor cambió de línea, la pregunta útil es cuánto vale hoy lo guardado y cuánto cuesta seguir guardándolo, no cuánto costó comprarlo.

## Vértice Logística

### El diésel subió 12 % y los contratos no

`vl-d2-diesel` · día 2 · reporte · de Patricio Lozano (Director de Finanzas) · involucra a Mauricio Cárdenas (Director Comercial), Antonio Leija (Director de Operaciones y Flota), Ricardo Hinojosa (Director de Logística · Supermercados Almena)

**Contexto**

> Director: el diésel subió 12 % en cuatro meses. Ya es el 38 % de nuestro costo y el 70 % de los contratos no tiene recargo por combustible: cada kilómetro de más se come el margen.
> Mauricio teme que si subimos tarifas, Avante aproveche para quitarnos cuentas. Antonio cree que podemos bajar consumo con manejo eficiente.
> Te pongo tres caminos con números.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Costo extra del diésel | ≈ $4 M al mes |
| Fórmula de recargo indexada, contrato por contrato | Recupera ≈ 70 % en tres meses |
| Subir 8 % a todos con aviso de 15 días | Recupera todo desde el mes siguiente |
| Mauricio: con un alza general así | En 1 de cada 2 casos un cliente grande abre licitación |
| Manejo eficiente con telemetría | −6 % de consumo · en 4 de cada 10 flotas los operadores lo resienten al principio |

**Pregunta:** ¿Cómo enfrentas el alza del diésel?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Proponer a cada cliente una fórmula pública de recargo ligada al precio del diésel, empezando por los contratos que vencen. | Margen +2, Clientes -1, Equipo -1 | 3 | — |
| **b.** Subir 8 % todas las tarifas con aviso de 15 días: el diésel subió para todos y Avante tiene el mismo problema. | Margen +3, Caja +1, Clientes -3, Consejo +1 | 1 | — |
| **c.** No tocar tarifas: absorber el alza y bajar consumo con telemetría, rutas y capacitación de manejo eficiente. | Clientes +1, Equipo +1, Margen -1, Caja -1 | 2 | — |
| *(no responder)* | Margen -2, Caja -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Recuperas la mayor parte con una regla que el cliente puede revisar. Tarda tres meses y cada contrato es una negociación. *Respuesta:* Es lo más defendible ante un cliente. / (Antonio) Mientras tanto seguimos perdiendo en cada viaje. *Consecuencia futura:* llega «Supermercados Almena · Recargo por combustible».
- **b.** El margen regresa desde el mes siguiente. Le das a tus clientes grandes una razón para cotizar con la competencia. *Respuesta:* Se recupera el margen de inmediato. / (Mauricio) Director, Almena está buscando pretexto para invitar a Avante. *Consecuencia futura:* llega «Llamada perdida · Mauricio Cárdenas (Comercial)» (en 50 de cada 100).
- **c.** Los clientes no ven cambios y la flota aprende a gastar menos. El margen se recupera solo en parte y pagas la telemetría. *Respuesta:* Con eso bajamos consumo de verdad. / (Patricio) Es buena idea, pero no alcanza a cubrir todo el alza. *Consecuencia futura:* llega «José «Pepe» Medina» (en 40 de cada 100).
- **sin respuesta.** Sin decisión, el diésel siguió comiéndose el margen.

**Aprendizaje:** El costo que nadie controla. El diésel no lo controla nadie en la mesa. Lo que sí se controla es quién absorbe el alza y con qué regla. Una fórmula que el cliente puede revisar convierte una discusión de poder en una de datos. *Cuando el costo sube para todos, gana quien propone la regla más justa, no el que sube primero.*

**Concepto:** Juego repetido y reputación. El diésel subió y los clientes de Vértice renegocian cada año. Una fórmula de recargo pública y verificable reparte el costo con reglas claras; un aumento parejo sin explicación cobra hoy y se paga en la siguiente licitación.

### Supermercados Almena · Recargo por combustible

`vl-c-diesel-formula` · día 4 · email · de Ricardo Hinojosa (Director de Logística · Supermercados Almena) · involucra a Mauricio Cárdenas (Director Comercial), Patricio Lozano (Director de Finanzas)

**Cuándo llega (condición causal verificable):** solo si en «El diésel subió 12 % y los contratos no» elegiste «Proponer a cada cliente una fórmula pública de recargo ligada al precio del diésel, empezando por los contratos que vencen.» (siempre).

**Contexto**

> Estimado Director:
> Revisamos su propuesta de recargo por combustible. Es la primera que recibimos con una fórmula clara y la valoramos.
> Aceptamos con dos condiciones: que la fórmula también baje la tarifa cuando baje el diésel, y que nuestro equipo pueda auditar los consumos una vez al año.
> Ricardo Hinojosa
Director de Logística · Supermercados Almena

**Lo que sabes**

| Dato | Valor |
|---|---|
| Almena en la venta | 20 % |
| Simetría (baja si baja el diésel) | Pronóstico: el diésel se mantiene alto 12 meses |
| Auditoría de consumos | Exige telemetría confiable en su ruta |
| Otros clientes | Esperan ver qué firma Almena |

**Pregunta:** ¿Aceptas las condiciones de Almena?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Aceptar la simetría con un piso y un techo, y la auditoría anual con los datos de telemetría de su ruta. | Margen +1, Clientes +2, Equipo -1, Caja -1 | 3 | — |
| **b.** Aceptar la auditoría pero no la simetría: el riesgo del diésel lo asumimos nosotros cuando sube. | Margen +2, Clientes -2 | 1 | — |
| **c.** Aceptar todo tal cual para cerrar rápido y usarlo como modelo con los demás clientes. | Clientes +2, Margen -1 | 2 | — |
| *(no responder)* | Margen -2 | — | — |

**Qué pasa después de cada opción**

- **a.** Firmas con tu cliente más grande una regla que los demás van a copiar. Abres tus consumos a revisión y aceptas ganar menos si el diésel baja. *Respuesta:* Me parece justo. Lo firmamos así. / (Patricio) El piso nos protege si el diésel se desploma. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Proteges el margen si el diésel baja. Almena siente que la fórmula clara era solo un aumento con otro nombre. *Respuesta:* Entonces no es una fórmula, es un aumento. / Lo voy a revisar con mi director. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** Cierras rápido y con una buena relación. Te quedas sin protección si el diésel baja de golpe. *Respuesta:* Excelente. Le mando el anexo hoy. / (Patricio) Sin piso, si el diésel baja fuerte trabajamos con pérdida. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, la propuesta se enfrió y el margen siguió bajando.

**Aprendizaje:** Una regla justa tiene que serlo en los dos sentidos. La fórmula clara abrió la puerta. El cliente pidió lo que cualquier contraparte pediría: que la regla también lo proteja a él. Aceptarlo con límites convierte un aumento en una relación de largo plazo. *Si la regla solo te protege a ti, el cliente la va a tratar como un aumento.*

**Concepto:** Gestión de expectativas. La fórmula funciona si los clientes la entienden y la pueden revisar. Explicar desde el principio cuándo sube y cuándo baja evita que cada ajuste se viva como una sorpresa.

### Llamada perdida · Mauricio Cárdenas (Comercial)

`vl-c-diesel-licitacion` · día 4 · llamada · de Mauricio Cárdenas (Director Comercial) · involucra a Ricardo Hinojosa (Director de Logística · Supermercados Almena), Rodrigo Salinas (Presidente del consejo · Hijo del fundador), Gabriela Ochoa (Directora de Servicio a Clientes y CEDIS)

**Cuándo llega (condición causal verificable):** solo si en «El diésel subió 12 % y los contratos no» elegiste «Subir 8 % todas las tarifas con aviso de 15 días: el diésel subió para todos y Avante tiene el mismo problema.» y el azar del periodo cae en 50 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Mensaje de voz · 0:42
> «Director, Almena respondió al aumento abriendo licitación por todas sus rutas del noreste e invitó a Avante. Tenemos diez días para presentar propuesta.»
> «Don Rodrigo ya me llamó. Necesito saber con qué vamos.»

**Lo que sabes**

| Dato | Valor |
|---|---|
| Almena en la venta | 20 % |
| Precio estimado de Avante | 12 % abajo de nuestra tarifa anterior |
| Nivel de servicio con Almena | 97 % a tiempo (Avante: sin historial en la región) |
| Plazo de la licitación | 10 días |

**Pregunta:** Almena licita sus rutas. ¿Con qué te presentas?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Presentar la tarifa anterior con una fórmula de recargo pública, nuestro historial y penalización si fallamos. | Margen -1, Clientes +1, Consejo -1, Equipo +1 | 3 | — |
| **b.** Igualar el precio de Avante para no perder la cuenta: el 20 % de la venta no se puede arriesgar hoy. | Clientes +2, Margen -3 | 1 | — |
| **c.** Ofrecer un descuento solo en las rutas donde Avante sí opera y mantener el aumento en las demás. | Margen +1, Clientes -1 | 2 | — |
| *(no responder)* | Clientes -4, Consejo -1 | — | — |

**Qué pasa después de cada opción**

- **a.** Retrocedes en el aumento y compites con servicio y transparencia. Pierdes parte del margen que habías ganado. *Respuesta:* Así competimos en lo que Avante no tiene. / (Don Rodrigo) Espero que con eso alcance. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** Probablemente conservas la cuenta. A ese precio, las rutas de Almena casi no dejan margen y el resto de los clientes lo va a saber. *Respuesta:* (Don Rodrigo) No vamos a perder a Almena. / (Mauricio) A ese precio la cuenta casi no deja. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** Defiendes el margen donde no tienes competencia. Almena puede leer la oferta como que no entendiste su molestia. *Respuesta:* Es más fino, aunque Almena lo va a ver como medio paso. / (Gaby) En las rutas largas nadie nos alcanza en servicio. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, la propuesta fue la misma tarifa que provocó la licitación.

**Aprendizaje:** El aumento que invitó al competidor. Subir a todos de golpe recuperó el margen y le dio al cliente más grande la razón para cotizar. Ahora la negociación es más difícil que la que se evitó: hay un competidor en la mesa. *Un cliente que concentra la venta no solo compra tu servicio: decide cuándo te pone a competir.*

**Concepto:** Concentración de clientes. El aumento parejo llevó a un cliente grande a abrir licitación. Cuando una cuenta pesa una quinta parte de la venta, perderla cambia la empresa; conviene saber antes qué tan expuesta está.

### José «Pepe» Medina

`vl-c-diesel-telemetria` · día 5 · whatsapp · de José «Pepe» Medina (Operador de quinta rueda · vocero informal de los operadores) · involucra a Antonio Leija (Director de Operaciones y Flota), Rocío Guajardo (Directora de Personas)

**Cuándo llega (condición causal verificable):** solo si en «El diésel subió 12 % y los contratos no» elegiste «No tocar tarifas: absorber el alza y bajar consumo con telemetría, rutas y capacitación de manejo eficiente.» y el azar del periodo cae en 40 de cada 100 casos (estable: la misma partida da siempre el mismo resultado).

**Contexto**

> Director, con respeto: en el patio pegaron un ranking de consumo por operador, con nombres. Los de abajo son los que hacen la ruta de la sierra, que gasta más por las pendientes.
> Ya hay compañeros que hablan de irse a Avante. Dicen que los están exhibiendo por una ruta que nadie quiere.
> El consumo sí bajó 5 %. Nomás queremos que se mida parejo.

**Lo que sabes**

| Dato | Valor |
|---|---|
| Consumo de la flota | −5 % desde que se instaló la telemetría |
| Ranking por operador | Público, con nombres, sin ajustar por ruta |
| Operadores de la ruta sierra | Todos en el último lugar |
| Rotación de operadores | 38 % anual |

**Pregunta:** ¿Qué haces con el ranking de consumo?

| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |
|---|---|---|---|
| **a.** Quitar los nombres del ranking, medir por ruta y premiar a quien mejore contra sí mismo. | Equipo +2, Margen -1, Caja -1 | 3 | — |
| **b.** Mantener el ranking como está: el consumo ya bajó 5 % y la presión está funcionando. | Margen +2, Equipo -3 | 1 | — |
| **c.** Ajustar el ranking por tipo de ruta y de carga, pero mantenerlo público y con nombres. | Margen +1, Equipo -1 | 2 | — |
| *(no responder)* | Equipo -3 | — | — |

**Qué pasa después de cada opción**

- **a.** Conservas la mejora de consumo y la medición se vuelve justa. Pierdes algo de presión individual y Antonio tiene que rediseñar el tablero. *Respuesta:* Gracias, Director. Así sí se mide parejo. / (Antonio) Perdemos presión, pero entiendo. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **b.** La presión sigue y el consumo puede bajar más. Los operadores de la sierra se sienten señalados y algunos se van. *Respuesta:* Entendido. / (Rocío) Director, la rotación nos cuesta más que el diésel. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **c.** La comparación se vuelve más justa. Sigue siendo una exhibición pública y eso pesa en el clima del patio. *Respuesta:* Es mejor que antes. / (Pepe) Igual nadie quiere ver su nombre abajo en el patio. *Consecuencia futura:* no abre otro asunto en esta cadena.
- **sin respuesta.** Sin decisión, el ranking siguió y empezaron las renuncias.

**Aprendizaje:** Una medida que se vuelve exhibición. La telemetría bajó el consumo, como se esperaba. Cómo se usó el dato decidió el clima: medir sin ajustar por ruta y con nombres convirtió una mejora en una injusticia visible. *Un número que no compara situaciones parecidas no mide desempeño: mide suerte.*

**Concepto:** Cultura justa. La telemetría muestra cómo maneja cada operador. Usarla para enseñar y corregir mejora el consumo; usarla para exhibir y castigar convierte una herramienta de mejora en una de vigilancia.

