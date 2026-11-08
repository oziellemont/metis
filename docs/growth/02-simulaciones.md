# Growth Engine · Fase 2 · Resultados de simulación

Este documento resume cómo se comportan las dos cadenas piloto de la Empresa emergente cuando se juegan con decisiones favorables, adversas y subóptimas. Todas las cifras salen del motor de crecimiento (`app/src/lib/ceo/growth/`), que lleva la contabilidad en centavos, con devengo y caja separados, y que nunca deja la caja en negativo: lo que no alcanza a pagarse queda como pago vencido y se convierte en una situación ejecutiva que el jugador debe resolver. Ninguna cifra la genera la IA.

## Cómo se simuló

Cada camino se jugó con cinco semillas distintas (`metis`, `a1`, `b2`, `c3`, `d4`) durante 330 días. Los casos llegan cuando se cumplen sus condiciones estructurales (por ejemplo, el local de Cumbres solo se ofrece cuando la cocina ya está estabilizada y la caja lo permite) y el siguiente eslabón de la cadena llega solo después de que se vio la consecuencia del anterior. Las cifras de la tabla son el promedio de las cinco semillas.

La columna «Neto» es la caja al día 330 menos pagos vencidos y deuda, en pesos. «EBITDA/mes» es el promedio de los últimos tres meses. «Días en crisis» cuenta los días en que la proyección de 13 semanas mostraba un faltante. Las cinco columnas finales son los puntos que el puente suma a cada indicador respecto al arranque (tope de ±30 por indicador); así es como el motor de crecimiento alimenta los mismos cinco indicadores de la versión 10, sin una segunda fuente económica.

## Cadena A · Restaurante (cocina saturada → segunda sucursal → equipo de apertura)

La empresa arranca con una sucursal, nueve personas, unos 85 pedidos al día y una cocina que ya no alcanza en la hora pico. Su EBITDA base es de 6.3 % de las ventas.

| Cocina | Sucursal | Equipo | Neto | EBITDA/mes | Días en crisis | Caja | Margen | Equipo | Clientes | Consejo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| cocinero | gerente primero | completo | 979,015 | 135,675 | 6 | +19 | +10 | +5 | −1 | +8 |
| esperar | gerente primero | completo | 1,005,393 | 144,829 | 3 | +20 | +12 | +5 | −2 | +8 |
| cocinero | abrir ya | completo | 958,418 | 140,444 | 14 | +19 | +11 | +6 | 0 | +7 |
| cocinero | no abrir | — | 1,040,404 | 44,270 | 0 | +22 | +1 | +5 | +3 | +2 |
| cocinero | gerente primero | mínimo | 281,412 | 26,941 | 10 | −5 | −7 | +5 | −9 | +1 |
| jefe de cocina | abrir ya | mínimo | 72,621 | 7,367 | 57 | −12 | −11 | +2 | −11 | −3 |
| esperar | gerente primero | posponer | −327,427 | −64,164 | 73 | −25 | −25 | −9 | −9 | −10 |
| jefe de cocina | abrir ya | posponer | −986,495 | −173,924 | 164 | −30 | −30 | −27 | −22 | −16 |

**Escenario favorable.** Abrir Cumbres negociando dos meses sin renta durante la obra, reclutando al gerente desde el principio y contratando el equipo completo triplica el EBITDA mensual frente a no abrir (unos 136 mil contra 44 mil pesos) con apenas 3 a 6 días de alerta de liquidez. Los indicadores terminan con Caja +19, Margen +10 y Consejo +8. Clientes queda ligeramente abajo (−1) porque la nueva sucursal tarda varios meses en madurar y pierde pedidos mientras tanto. Lo dejamos así a propósito: crecer tiene un costo de servicio que el jugador debe ver.

**Escenario prudente.** No abrir deja más efectivo al día 330 (1.04 millones), pero con una empresa que no crece. El consejo lo nota (+2 contra +8) y el margen se queda prácticamente igual (+1). La apertura se paga sola en un horizonte más largo que el de la simulación; esa es justamente la tensión del caso.

**Escenario subóptimo.** Abrir con el equipo mínimo parece ahorrar nómina, pero la nueva sucursal no alcanza a atender su demanda. El EBITDA cae a entre 7 y 27 mil pesos al mes, Clientes baja de 9 a 11 puntos y aparecen de 10 a 57 días de alerta de liquidez.

**Escenario adverso.** Firmar el local y luego posponer 60 días la obra es la peor combinación: se paga renta de un local que no vende, con el gerente ya contratado. El motor no presta automáticamente ni termina la partida. La caja se agota, aparecen pagos vencidos y llegan casos de liquidez con opciones que tienen costo y condiciones, como renegociar con el arrendador, pedir un crédito con intereses o recortar. Aun así, si el jugador no corrige, los cinco indicadores tocan el piso del puente (−30 en Caja y Margen) y la empresa pasa entre 73 y 164 días en crisis.

## Cadena B · Manufactura (contrato grande → capacidad → calidad)

La empresa es un taller de autopartes con un turno y quince personas. Su EBITDA base es de 8.8 % de las ventas. Una ensambladora ofrece 2,600 piezas al día adicionales.

| Contrato | Capacidad | Calidad | Neto | EBITDA/mes | Caja | Margen | Equipo | Clientes | Consejo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| aceptar | segundo turno | ajustador | 4,045,837 | 333,855 | +30 | +18 | +6 | +4 | +7 |
| aceptar | segundo turno | esperar | 4,021,968 | 325,047 | +30 | +18 | +4 | −1 | +7 |
| parcial | prensa | esperar | 2,647,504 | 232,126 | +25 | +14 | +3 | +1 | +7 |
| aceptar | prensa | ajustador | 2,626,920 | 241,254 | +24 | +12 | +5 | −11 | +5 |
| declinar | — | — | 2,581,936 | 111,500 | +24 | +1 | +3 | +1 | +2 |
| aceptar | nada | — | 2,843,362 | 115,062 | +28 | +2 | +3 | −12 | +3 |
| parcial | nada | — | 2,957,107 | 138,060 | +28 | +4 | +3 | −24 | +4 |

En esta cadena no hubo días de crisis de liquidez en ninguna combinación: el taller arranca con más caja y cobra a crédito de forma predecible.

**Escenario favorable.** Aceptar todo el volumen y abrir un segundo turno con un supervisor y cuatro operadores triplica el EBITDA mensual frente a declinar (unos 334 mil contra 112 mil pesos) y deja 4 millones netos. Contratar después a un ajustador de troqueles con experiencia es la mejor respuesta al problema de calidad: suma en Equipo y en Clientes.

**Escenario subóptimo.** Comprar una prensa en lugar de abrir turno cuesta más caja de entrada y da menos capacidad útil. El resultado es sano pero queda muy por debajo del segundo turno, y Clientes baja porque las entregas siguen incompletas un tiempo.

**Escenario adverso.** Aceptar el contrato y no hacer nada para cumplirlo es engañoso. El efectivo al día 330 se ve bien (2.8 millones) porque se dejó de producir para ese cliente, pero en el camino se entregó solo el 71 % de lo comprometido durante dos meses, se pagaron penalizaciones y la ensambladora canceló el contrato. Clientes cae 12 puntos y el margen vuelve al nivel base. Aceptar parcialmente y luego no ampliar capacidad es todavía peor para Clientes (−24).

## Demostración: cómo cambia Mi empresa

La página de revisión `/ceo/empresa/demo-crecimiento` (visible solo fuera de producción o con el interruptor encendido) juega dos caminos desde el mismo día y con la misma semilla, y los compara el mismo día. La diferencia que se ve es solo la decisión.

**Contratar un cocinero de línea**, comparado contra esperar un mes más, 90 días después: el equipo pasa de 9 a 10 personas y la nómina bruta sube 12,500 pesos al mes. Los pedidos no atendidos bajan de 228 a 117 al mes, las ventas del último mes suben 34 mil pesos y la caja termina 25 mil pesos arriba. El EBITDA del mes queda prácticamente igual, porque el cocinero todavía está en su curva de aprendizaje.

**Abrir la sucursal Cumbres** con el equipo completo, comparado contra dejar pasar el local, 300 días después: se pasa de 1 a 2 sedes operando y de 10 a 17 personas. La nómina sube 89 mil pesos al mes, las ventas mensuales pasan de 643 mil a 1.2 millones y el EBITDA de 38 mil a 147 mil. Los pedidos no atendidos suben porque Cumbres todavía está madurando su demanda.

**Abrir un segundo turno en planta**, comparado contra seguir con un turno, 150 días después: el equipo pasa de 15 a 19 personas y la nómina sube 57 mil pesos al mes. Las ventas suben 535 mil, el EBITDA pasa de 166 mil a 336 mil y la planta conserva las 2,600 piezas al día del contrato. Sin el turno, el contrato se cancela y se pagan 33 mil pesos de penalizaciones contra 11 mil.

## Lo que comprueban las pruebas automáticas

Las pruebas de integración (`growth/integration.test.ts`, `growth/view.test.ts` y `growth/chains.test.ts`) verifican lo siguiente:

- El interruptor `growth_engine` quedó prendido en el lanzamiento piloto (ver `03-pendientes.md`); una fila `enabled = false` en `ceo.flags` lo apaga.
- El onboarding ofrece las dos opciones solo cuando el interruptor lo permite.
- El puente hacia los cinco indicadores es la única fuente económica; el reporte mensual anterior y la simulación P0-C se apagan cuando la partida tiene crecimiento.
- Los efectos editoriales solo tocan Equipo, Clientes y Consejo.
- La partida es determinista al reconstruirse desde el registro de decisiones.
- Las decisiones se guardan y se reproducen en el historial.
- Un caso encadenado nunca llega el mismo día que el anterior.
- Las vacaciones pausan el reloj del motor.
- La demostración compara ambos caminos el mismo día y muestra los efectos esperados.

La suite completa, con 1,705 pruebas, pasa sin fallas.
