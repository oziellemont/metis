# Acerías v2: comparación final de resultados y prueba del recorrido

Este documento resume la versión 2 de las acerías antes de activarla. La versión 2 vive en un módulo separado (`app/src/lib/ceo/growth/steel/`) y está apagada (`STEEL_V2_ENABLED = false`). Las partidas existentes no se tocan: siguen funcionando con las plantillas actuales.

Todas las cifras son de 24 meses de juego, en pesos, y salen del motor mediante pruebas automáticas que se pueden repetir. El motor es determinista: con la misma semilla y las mismas decisiones da exactamente los mismos números.

## 1. Las dos empresas

**Acería compacta.** Funde chatarra en hornos de inducción y cuela palanquilla. La varilla se lamina por maquila. Vende palanquilla a relaminadoras y algo de varilla a constructoras.

**Miniacería integrada.** Tiene horno, colada continua, laminador propio y patio de chatarra. Vende varilla a distribuidores y a constructoras.

## 2. Márgenes: el rango de 13–14 % y el de 10–11 %

| Empresa | Escenario | Conservadora | Equilibrada | Agresiva |
|---|---|---|---|---|
| Integrada | Base | 13.3 % | 13.6 % | 13.5 % |
| Integrada | Margen ajustado | 10.4 % | 10.9 % | 11.1 % |
| Compacta | Base | 4.2 % | 4.8 % | 5.4 % |
| Compacta | Margen ajustado | 0.6 % | 1.1 % | 1.1 % |

El porcentaje es el margen EBITDA de los 24 meses (EBITDA entre ventas).

**Qué produce el 13–14 % de la integrada.** La integrada se queda con todo el margen de la cadena: compra chatarra y vende varilla terminada. Además, una parte de la chatarra viene de su propio patio y le cuesta menos que la del mercado. Tiene 400 personas y paga energía en tarifa de alta tensión.

Queda por debajo del 21 % de Simec. Simec tiene más escala, usa hornos de arco y vende perfiles de mayor precio.

**Qué lleva el margen a 10–11 %.** Cuatro presiones que pueden ocurrir a la vez en un año normal. Ninguna de ellas es una crisis.

1. La varilla importada baja el precio 1 %.
2. La demanda de exportación sube la chatarra 3 %.
3. La CFE ajusta la tarifa 6 %.
4. El mantenimiento sube 10 % porque los hornos envejecen.

Con estas cuatro presiones, la integrada baja a 10.4–11.1 %. La compacta casi pierde su margen (alrededor de 1 %), porque sin laminador propio no tiene de dónde compensar.

**Recomendación.** Arrancar en el escenario base (13–14 %). El de 10–11 % queda listo como variante de dificultad o como el entorno de un segundo año duro. En los dos escenarios se aprenden las mismas lecciones; en el ajustado, los errores cuestan más.

## 3. Cómo se cumplió cada ajuste

### 3.1 Capital de trabajo coherente

Cada venta genera su factura y su fecha de cobro según el contrato: 30, 45 o 60 días, más el atraso propio de cada cliente.

Lo mismo pasa con lo que se paga, y cada pago tiene su fecha:

| Concepto | Plazo |
|---|---|
| Chatarra | De contado o a 15 días |
| Energía de CFE | Día 10 |
| IMSS | Día 17 |
| Nómina | Quincenal |

Los saldos iniciales no se inventan. Salen de 420 días de historia simulada antes de que el jugador llegue. La contabilidad es de partida doble y se verifica en cada movimiento.

El efecto se nota en los resultados: firmar un cliente a 60 días aumenta las ventas, pero deja la caja más baja durante dos meses.

### 3.2 Liquidez: la caja nunca queda negativa

Si un pago no alcanza a cubrirse, no se paga. Se convierte en un adeudo con un acreedor concreto, y ese adeudo trae consecuencias.

| Acreedor que no cobra | Consecuencia |
|---|---|
| Chatarrero | Primero pide pago de contado; después deja de surtir |
| Proveedores de insumos | Cortan el suministro |
| CFE | Corta la luz y cobra la reconexión |
| SAT e IMSS | Recargos |
| Personal | Baja la moral |
| Banco | Cobra intereses moratorios y cierra el crédito nuevo |

Cuando la caja entra en alerta, el juego abre un caso con las alternativas reales de gestión. Cada alternativa muestra cuánto dinero trae, cuánto cuesta y cuándo llega:

- factoraje;
- convenio con proveedores;
- más plazo;
- crédito, que el banco evalúa por cobertura y puede rechazar;
- aportación del dueño;
- remate de inventario;
- posponer inversiones.

### 3.3 Impuestos: provisión separada del pago

El motor maneja tres momentos distintos:

1. **Cada mes provisiona** el ISR y la PTU.
2. **El día 17 paga** el pago provisional de ISR, calculado con el coeficiente de utilidad del año anterior.
3. **Cierra el año:**
   - en marzo, la declaración anual, con su saldo a pagar o a favor;
   - en mayo, el reparto de la PTU, con el tope legal.

En los estados financieros se ven por separado el impuesto devengado y el impuesto pagado. Las pérdidas fiscales se amortizan en años siguientes.

### 3.4 Sensibilidad: ninguna estrategia gana siempre

Se corrieron las tres estrategias en 14 escenarios:

- precio del acero ±;
- precio de la chatarra ±;
- energía +20 %;
- rendimiento −2 puntos;
- demanda ±;
- cobranza 20 días más lenta;
- mantenimiento recortado;
- caída del acero;
- tormenta, con todo en contra;
- bonanza, con todo a favor.

La medida de comparación es la utilidad neta menos el costo del dinero que tuvo que poner el dueño. La tabla muestra esa medida en millones de pesos, con el margen EBITDA y los días con pagos atrasados entre paréntesis.

**Acería compacta**

| Escenario | Conservadora | Equilibrada | Agresiva | Gana |
|---|---|---|---|---|
| Base | 3.5 (4.2 %, 0 d) | 4.9 (4.8 %, 38 d) | 6.6 (5.4 %, 97 d) | Agresiva |
| Precio −6 % | −21.9 (−2.9 %, 311 d) | −27.3 (−3.9 %, 317 d) | −36.1 (−9.0 %, 490 d) | Conservadora |
| Precio +5 % | 14.4 (8.7 %, 0 d) | 20.0 (9.5 %, 0 d) | 33.9 (11.0 %, 13 d) | Agresiva |
| Chatarra +10 % | −25.2 (−3.6 %, 261 d) | −27.1 (−2.9 %, 298 d) | −33.5 (−4.9 %, 425 d) | Conservadora |
| Chatarra −8 % | 14.4 (9.1 %, 0 d) | 19.1 (9.7 %, 0 d) | 28.8 (10.3 %, 2 d) | Agresiva |
| Energía +20 % | −4.4 (1.9 %, 26 d) | −5.7 (2.6 %, 150 d) | −4.0 (3.1 %, 211 d) | Agresiva |
| Rendimiento −2 pts | −0.2 (2.8 %, 0 d) | −2.3 (3.4 %, 126 d) | −0.2 (3.9 %, 173 d) | Conservadora |
| Demanda −15 % | −1.8 (2.5 %, 0 d) | 1.1 (3.3 %, 1 d) | 0.4 (3.8 %, 99 d) | Equilibrada |
| Demanda +8 % | 5.9 (4.9 %, 0 d) | 7.8 (5.3 %, 10 d) | 12.8 (5.9 %, 39 d) | Agresiva |
| Cobranza +20 días | −4.4 (3.9 %, 236 d) | −5.5 (3.4 %, 259 d) | −7.8 (2.5 %, 314 d) | Conservadora |
| Mantenimiento recortado | 3.7 (4.3 %, 0 d) | 5.1 (4.9 %, 37 d) | 7.4 (5.4 %, 83 d) | Agresiva |
| Caída del acero | −4.5 (2.0 %, 26 d) | −6.4 (2.5 %, 168 d) | −9.3 (2.5 %, 121 d) | Conservadora |
| Tormenta | −36.6 (−16.2 %, 496 d) | −38.2 (−20.0 %, 585 d) | −46.2 (−24.3 %, 609 d) | Conservadora |
| Bonanza | 21.3 (11.3 %, 0 d) | 28.4 (11.9 %, 0 d) | 45.9 (13.2 %, 0 d) | Agresiva |

**Miniacería integrada**

| Escenario | Conservadora | Equilibrada | Agresiva | Gana |
|---|---|---|---|---|
| Base | 93.5 (13.3 %, 0 d) | 95.1 (13.6 %, 0 d) | 94.8 (13.5 %, 50 d) | Equilibrada |
| Precio −6 % | 26.5 (7.8 %, 0 d) | 28.3 (8.2 %, 0 d) | −10.9 (7.6 %, 155 d) | Equilibrada |
| Precio +5 % | 153.5 (17.3 %, 0 d) | 155.1 (17.7 %, 0 d) | 182.6 (17.9 %, 7 d) | Agresiva |
| Chatarra +10 % | 42.2 (8.8 %, 0 d) | 49.3 (9.7 %, 0 d) | 28.8 (9.5 %, 136 d) | Equilibrada |
| Chatarra −8 % | 137.2 (16.8 %, 0 d) | 134.2 (16.8 %, 0 d) | 148.1 (16.8 %, 5 d) | Agresiva |
| Energía +20 % | 70.2 (11.3 %, 0 d) | 72.0 (11.6 %, 0 d) | 62.6 (11.7 %, 94 d) | Equilibrada |
| Rendimiento −2 pts | 79.1 (12.0 %, 0 d) | 81.0 (12.4 %, 0 d) | 79.4 (12.3 %, 64 d) | Equilibrada |
| Demanda −15 % | 55.3 (11.5 %, 0 d) | 55.8 (11.8 %, 0 d) | 47.3 (11.6 %, 46 d) | Equilibrada |
| Demanda +8 % | 115.0 (14.0 %, 0 d) | 117.3 (14.4 %, 0 d) | 115.3 (13.9 %, 34 d) | Equilibrada |
| Cobranza +20 días | 85.6 (13.6 %, 71 d) | 84.1 (13.9 %, 77 d) | 78.5 (14.0 %, 208 d) | Conservadora |
| Mantenimiento recortado | 96.6 (13.5 %, 0 d) | 98.2 (13.9 %, 0 d) | 95.9 (13.5 %, 38 d) | Equilibrada |
| Caída del acero | 68.5 (11.3 %, 0 d) | 70.3 (11.7 %, 0 d) | 56.4 (11.5 %, 149 d) | Equilibrada |
| Tormenta | −25.8 (5.9 %, 214 d) | −25.8 (5.9 %, 214 d) | −42.8 (6.2 %, 326 d) | Conservadora |
| Bonanza | 187.0 (19.1 %, 0 d) | 186.0 (19.3 %, 0 d) | 215.0 (19.5 %, 0 d) | Agresiva |

**Cómo leer las tablas**

- **En la compacta, la estrategia correcta depende del entorno.** La agresiva gana 7 de 14 escenarios, la conservadora 6 y la equilibrada 1. La agresiva gana cuando el mercado ayuda y es la que más pierde cuando se voltea. En todos los escenarios es la que acumula más días con pagos atrasados.
- **En la integrada, la equilibrada gana más seguido (9 de 14), pero casi siempre por poco.** Su ventaja es de 1 a 2 % en la mayoría de los escenarios, porque ampliar el patio de chatarra es una mejora moderada. La agresiva (un segundo horno con deuda) gana con precios altos o chatarra barata. Con precios bajos o chatarra cara pierde mucho más que las otras.
- **Las pruebas automáticas fijan estas reglas para que no se rompan con cambios futuros:**
  - en cada empresa hay al menos dos ganadoras distintas;
  - ninguna estrategia gana más de dos tercios de los escenarios;
  - la agresiva es la peor en algún escenario;
  - la agresiva acumula más días de atraso que la conservadora.

### 3.5 Calidad editorial de los 26 casos

Los 26 casos se reescribieron y se agruparon en 8 áreas:

| Área | Casos |
|---|---|
| Operación | 3 |
| Chatarra | 4 |
| Clientes | 4 |
| Calidad | 3 |
| Energía | 3 |
| Seguridad | 3 |
| Capacidad | 3 |
| Estrategia | 3 |

Cada caso tiene:

- quien lo plantea;
- los datos de la empresa en ese momento;
- al menos dos opciones válidas;
- una lección.

Cada opción se traduce en comandos del motor; no hay efectos escritos a mano. Antes de decidir, el jugador ve una vista previa de 120 días que calcula el propio motor: la diferencia contra no hacer nada.

**Límites claros en seguridad.** En los riesgos graves, la opción insegura aparece bloqueada, con la razón a la vista. No se puede elegir. Esto aplica en cuatro casos:

- refractario desgastado;
- chatarra húmeda;
- material radiactivo en la chatarra;
- casi accidente.

**Opciones bloqueadas por razones de negocio.** También se bloquean las opciones que la realidad no permite. Dos ejemplos:

- licitar el volumen completo sin certificado de producto;
- comprar un laminador o un horno con crédito si el banco no aprobaría la cobertura. En ese caso se muestra la razón del banco.

**Prueba editorial automática.** Revisa que no aparezcan palabras de contenido pendiente y que cada texto tenga sustancia.

## 4. Inteligencia artificial: dentro de límites

La inteligencia artificial puede hacer dos cosas:

- elegir cuál de los casos elegibles conviene mostrar;
- personalizar la narración.

No puede crear efectos económicos. Si propone un caso que no cumple las condiciones, el sistema lo ignora y usa el selector determinista. Ese selector se adapta al estilo del jugador: si decide siempre de forma prudente, le presenta situaciones que ponen a prueba esa prudencia, y lo mismo con el estilo arriesgado. También toma en cuenta la seguridad, la utilización, la caja y la relación con clientes.

Cada decisión queda registrada en una bitácora con el caso, la opción elegida, quién la eligió (el motor o la inteligencia artificial) y los comandos aplicados.

## 5. Prueba completa del recorrido

Se jugó cada empresa 24 meses completos con tres tipos de director:

- **Prudente:** elige siempre la opción prudente que esté permitida.
- **Equilibrado:** elige la opción intermedia.
- **Arriesgado:** elige la opción más arriesgada.

Cuando aparece un caso de liquidez, el director lo resuelve con el mismo criterio.

| Empresa | Director | Casos | Ventas | EBITDA (margen) | Utilidad neta | Caja final | Caja mínima | Crisis de liquidez |
|---|---|---|---|---|---|---|---|---|
| Compacta | Prudente | 26 | 282.3 M | 6.4 M (2.3 %) | −3.2 M | 2.4 M | 0.9 M | 0 |
| Compacta | Equilibrado | 26 | 413.5 M | 23.0 M (5.6 %) | 7.7 M | 9.2 M | 0.0 M | 7 |
| Compacta | Arriesgado | 25 | 484.3 M | 28.2 M (5.8 %) | −3.7 M | 0.0 M | 0.0 M | 33 |
| Integrada | Prudente | 26 | 1,487.9 M | 177.1 M (11.9 %) | 61.4 M | 93.6 M | 17.2 M | 0 |
| Integrada | Equilibrado | 26 | 1,859.1 M | 249.0 M (13.4 %) | 108.5 M | 118.5 M | 17.0 M | 0 |
| Integrada | Arriesgado | 26 | 2,040.5 M | 271.8 M (13.3 %) | 92.0 M | 64.7 M | 0.0 M | 10 |

**Lo que se verificó en los seis recorridos**

- La contabilidad cuadra al final y en cada movimiento.
- La caja nunca queda negativa.
- Se completan los 24 meses.
- Se juegan al menos 18 casos distintos de las 8 áreas.
- Cada decisión queda en la bitácora con sus comandos.

**Lectura**

- **El equilibrado obtiene el mejor resultado en ambas empresas.**
- **El arriesgado vende más,** pero vive con la caja en cero y gana menos que el equilibrado. En la compacta termina con pérdida.
- **El prudente no tiene crisis,** pero renuncia a volumen y precio. En la compacta, que tiene margen delgado, eso lo deja con una pérdida pequeña.

Ninguno de los tres estilos es una fórmula que gane sola.

**Ajuste en esta revisión.** En el primer recorrido, el director prudente de la compacta terminaba con EBITDA negativo. La causa era el caso del ciclo: al recortar un turno, la planta nunca recuperaba a sus clientes. Se corrigió para que el recorte vaya acordado con los clientes y el volumen regrese a los seis meses. Sostener el precio frente al cliente grande ahora también recupera la mitad del volumen perdido a los ocho meses. Recortar sigue costando, pero ya no destruye la empresa.

## 6. Comparación contra el modelo de referencia

El modelo de referencia en Python (documento de diagnóstico) daba, en el escenario base, una compacta de 4.5 a 5.3 % de margen EBITDA y una integrada de 13.1 a 14.1 %. La v2 da 4.2 a 5.4 % y 13.3 a 13.6 %: los mismos rangos.

La v2 agrega cosas que el modelo de referencia no tenía:

| Tema | Modelo de referencia | Versión 2 |
|---|---|---|
| Caja | Llegaba a quedar negativa (−6.1 M en la compacta agresiva bajo estrés) | Nunca negativa: la falta de dinero se convierte en adeudos con consecuencias |
| Impuestos | Simplificados | Calendario real del SAT |
| Cobranza | Promedio | Una fecha de cobro por cada factura |
| Laminación | No limitaba la producción | Es un cuello de botella real |
| Tercer turno | Sin costos adicionales | Incluye prima nocturna y desgaste |
| Horno nuevo | Producía al 100 % desde el inicio | Tiene periodo de arranque |

Por eso la estrategia agresiva ya no domina como en la versión actual.

## 7. Qué falta para activar

1. Conectar la v2 a la interfaz del juego como empresas nuevas («Acería compacta» y «Miniacería integrada»), sin tocar las partidas existentes.
2. Cambiar `STEEL_V2_ENABLED` a verdadero.
3. Revisar en pantalla un recorrido con el equipo antes de abrirlo a jugadores.
