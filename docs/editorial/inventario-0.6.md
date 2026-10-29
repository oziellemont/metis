# mêtis CEO · Inventario editorial de los 52 asuntos y veredicto sombra

Clasificador editorial v1 · Veredicto sombra v0. Reporte generado por código a partir del contenido actual; no cambia ningún resultado de partidas, XP ni veredicto en producción.

## 1. Resumen

De los 52 asuntos (38 base y 14 consecuencias), el clasificador propone:

| Estado | Asuntos | % |
|---|---:|---:|
| approved (propuesta, falta firma humana) | 6 | 12 % |
| legacy (se conserva como histórico) | 12 | 23 % |
| needsRewrite (reescribir) | 26 | 50 % |
| restrictedEthics (obligación ética o de seguridad) | 8 | 15 % |

Ningún asunto queda aprobado de forma definitiva: «approved» es una propuesta automática que requiere la aprobación de Oziel (tabla `EDITORIAL_REVIEW` en `editorial.ts`).

| Empresa | approved | legacy | needsRewrite | restrictedEthics |
|---|---:|---:|---:|---:|
| Botanas Cumbre | 0 | 2 | 15 | 3 |
| Forja Norte | 2 | 6 | 5 | 4 |
| Grupo Brasa | 4 | 4 | 6 | 1 |

## 2. Auditoría de `score` frente a efectos

Balance neto promedio (suma de los cinco indicadores, sin multiplicadores de nivel) de las opciones según el score que les puso el autor. Si el score alto también es el más rentable, el jugador aprende a adivinar la preferencia del autor en lugar de analizar el caso.

| Empresa | score 0 | score 1 | score 2 | score 3 | Correlación score–balance |
|---|---:|---:|---:|---:|---:|
| Botanas Cumbre | -5.27 (11) | -1.37 (19) | 0.00 (4) | +4.00 (20) | 0.82 |
| Forja Norte | -6.20 (5) | -1.71 (14) | -1.33 (12) | +0.88 (17) | 0.59 |
| Grupo Brasa | -3.20 (5) | -2.67 (12) | +0.09 (11) | +1.36 (14) | 0.55 |

Hallazgos por asunto (un asunto puede tener varios):

| Hallazgo | Asuntos |
|---|---:|
| Una opción gana o empata en los cinco indicadores frente a todas las demás. | 0 |
| La opción con score más alto también es la de mejor balance de indicadores. | 43 |
| La opción con score más alto gana por una ventaja clara: se adivina la preferencia del autor. | 32 |
| La opción con score 0 es la que peor le va a la empresa. | 19 |
| Hay una opción sin ningún costo visible. | 0 |
| Solo una opción queda cerca de la mejor; las demás no son defendibles por números. | 34 |
| No responder castiga más que cualquier opción. | 42 |
| Una opción cruza una línea roja (se analiza, no se presenta como alternativa legítima). | 6 |

Umbrales: ventaja «obvia» ≥ 3 puntos netos; una opción es «defendible» si queda a 2 puntos o menos de la mejor.

## 3. Líneas rojas

Opciones que se analizan como consecuencia y nunca deben presentarse como alternativa legítima. Lista editorial a confirmar por revisión humana.

| Asunto | Opción | Por qué |
|---|---|---|
| d3-planta | b | Seguir operando un equipo con riesgo de accidente ya identificado. |
| d6-gastos | b | Encubrir un fraude comprobado a cambio de ventas. |
| fn-d3-ppap | b | Saltarse la firma de Calidad y entregar sin declarar la capacidad real. |
| fn-c-laura | b | Mantener oculto al cliente un riesgo de calidad conocido. |
| fn-d6-denuncia | b | Mover a quienes denunciaron acoso: represalia contra denunciantes. |
| gb-d3-brote | b | Seguir abiertos tras un brote de intoxicación sin dar la cara. |

## 4. Inventario asunto por asunto

Opciones como `id:score:balance`. Un `!` marca una línea roja. «Vencer» es el balance de no responder.

### Botanas Cumbre

| Día | Asunto | Tipo | Opciones | Vencer | Estado propuesto | Motivo |
|---:|---|---|---|---:|---|---|
| 1 | `d1-bienvenida` Bienvenido a Cumbre. Mañana empiezas. | base | a:3:+5 b:1:+1 c:1:0 | -6 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 1 | `d1-hector` Héctor Salinas | base | a:3:+5 b:2:+2 c:0:-3 | -6 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 2 | `d2-supernorte` Condiciones comerciales 2027 · Botanas Cumbre | base | a:0:-10 b:3:+2 c:1:-7 | -21 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 2 | `d2-ana` Pronóstico Q1 · versión final (22 láminas) | base | a:1:-1 b:3:+4 c:1:+1 | -3 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 2 | `c-hector-aliado` Héctor Salinas | consecuencia | a:3:+6 b:1:+1 | -1 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 3 | `d3-planta` Llamada perdida · Javier Ortiz (Planta) | base | a:3:+3 b:0:-3! c:1:-1 | -7 | restrictedEthics | Obligación ética o de seguridad. Es válido que tenga una respuesta clara; la opción que cruza la línea roja debe mostrarse como consecuencia, no como alternativa. |
| 3 | `d3-diego` Diego Garza | base | a:1:-4 b:3:+2 c:1:-6 | -4 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 3 | `c-hector-renuncia` URGENTE · Renuncia de Héctor Salinas | consecuencia | a:3:+3 b:2:-4 c:0:-9 | -16 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 4 | `d4-objetivos` Objetivos 2027 por área · no cuadran | base | a:3:+7 b:0:-2 c:1:0 | -6 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 4 | `d4-sindicato` Junta · Revisión salarial con el sindicato | base | a:3:+4 b:1:-3 c:0:-5 | -12 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 4 | `c-supernorte-castigo` Reasignación de espacio en anaquel | consecuencia | a:3:+2 b:1:-2 | -5 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 5 | `d5-credito` Propuesta · Línea automatizada y crédito de $40 M | base | a:1:-2 b:3:+3 c:1:0 | -4 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 5 | `d5-consejo` Para tu sesión del jueves con el consejo | base | a:3:+4 b:1:0 c:0:-5 | -4 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 5 | `c-ana-brilla` Ana Martínez | consecuencia | a:3:+4 b:2:+2 | -2 | legacy | Jugable como contenido histórico, pero la opción preferida por el autor sigue siendo la que más conviene. |
| 5 | `c-planta-accidente` Llamada perdida · Javier Ortiz (Planta) | consecuencia | a:3:-1 b:0:-9 | -17 | restrictedEthics | Tema de ética o seguridad sin opción de línea roja. Revisar que el feedback no sea sermón. |
| 6 | `d6-gastos` Confidencial · Auditoría de gastos de Fernando Rocha | base | a:3:+4 b:0:-5! c:1:-2 | -5 | restrictedEthics | Obligación ética o de seguridad. Es válido que tenga una respuesta clara; la opción que cruza la línea roja debe mostrarse como consecuencia, no como alternativa. |
| 6 | `d6-clima` Resultados de la encuesta de clima | base | a:0:-3 b:3:+6 c:2:0 | -5 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 6 | `c-ana-renuncia` Renuncia de Ana Martínez (Planeación) | consecuencia | a:3:+1 b:1:-1 | -3 | legacy | Jugable como contenido histórico, pero la opción preferida por el autor sigue siendo la que más conviene. |
| 7 | `c-piloto` Resultados del piloto · Cumbre Selección (8 semanas) | consecuencia | a:3:+8 b:1:+1 | -4 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 7 | `d7-sucesion` Una última cosa antes de cerrar tus 90 días | base | a:3:+8 b:0:-4 c:1:-1 | -6 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |

### Forja Norte

| Día | Asunto | Tipo | Opciones | Vencer | Estado propuesto | Motivo |
|---:|---|---|---|---:|---|---|
| 1 | `fn-d1-carta` Bienvenido a Forja Norte. Esto es lo que esperamos. | base | a:3:+3 b:1:+2 c:2:+1 | -7 | legacy | Jugable como contenido histórico, pero la opción preferida por el autor sigue siendo la que más conviene. |
| 1 | `fn-d1-andon` Chuy Morales | base | a:2:+2 b:1:0 c:3:+3 | -5 | legacy | Jugable como contenido histórico, pero la opción preferida por el autor sigue siendo la que más conviene. |
| 2 | `fn-d2-precio` Aurora Motors · Annual price reduction 2027 | base | a:0:-6 b:2:0 c:3:-2 | -13 | approved | Pasa las pruebas automáticas: hay al menos dos estrategias defendibles y el score no decide el resultado. Falta la firma humana. |
| 2 | `fn-d2-soldadores` Fuga de soldadores · 7 en un mes | base | a:1:-1 b:3:-3 c:2:0 | -7 | approved | Pasa las pruebas automáticas: hay al menos dos estrategias defendibles y el score no decide el resultado. Falta la firma humana. |
| 3 | `fn-c-escape` URGENTE · Aurora nos puso en contención nivel 1 | consecuencia | a:3:+1 b:1:-5 c:0:-8 | -11 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 3 | `fn-d3-ppap` Junta · Aprobación de la pieza nueva (PPAP) vence el viernes | base | a:2:-4 b:0:0! c:3:-2 | -8 | restrictedEthics | Obligación ética o de seguridad. Es válido que tenga una respuesta clara; la opción que cruza la línea roja debe mostrarse como consecuencia, no como alternativa. |
| 4 | `fn-c-kaizen` Chuy Morales | consecuencia | a:3:+6 b:2:+2 | -1 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 4 | `fn-d4-recap` Propuesta del fondo · recapitalización | base | a:1:-1 b:3:+1 c:2:-2 | -9 | legacy | Jugable como contenido histórico, pero la opción preferida por el autor sigue siendo la que más conviene. |
| 4 | `fn-d4-pleito` Ramón Villarreal | base | a:3:+3 b:1:-2 c:1:-2 | -7 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 5 | `fn-d5-ciber` Llamada perdida · Marcos Elizondo (Finanzas) | base | a:2:-5 b:0:-10 c:3:-2 | -16 | restrictedEthics | Tema de ética o seguridad sin opción de línea roja. Revisar que el feedback no sea sermón. |
| 5 | `fn-d5-plataforma` Cotización · Plataforma SUV 2028 ($900 M en la vida del programa) | base | a:1:-1 b:2:-4 c:3:0 | -7 | legacy | Jugable como contenido histórico, pero la opción preferida por el autor sigue siendo la que más conviene. |
| 5 | `fn-c-laura` Mi renuncia | consecuencia | a:3:-1 b:1:-1! | -7 | restrictedEthics | Obligación ética o de seguridad. Es válido que tenga una respuesta clara; la opción que cruza la línea roja debe mostrarse como consecuencia, no como alternativa. |
| 6 | `fn-d6-proveedor` Riesgo crítico · Fundiciones del Bajío | base | a:3:-3 b:1:-5 c:2:-4 | -11 | legacy | Jugable como contenido histórico, pero la opción preferida por el autor sigue siendo la que más conviene. |
| 6 | `fn-d6-denuncia` Confidencial · Denuncia contra el gerente del tercer turno | base | a:3:+3 b:0:-7! c:1:-3 | -8 | restrictedEthics | Obligación ética o de seguridad. Es válido que tenga una respuesta clara; la opción que cruza la línea roja debe mostrarse como consecuencia, no como alternativa. |
| 6 | `fn-c-escuela` Teresa Galván | consecuencia | a:3:+2 b:1:-1 | -2 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 7 | `fn-d7-consejo` Sesión de consejo · Cierre del trimestre | base | a:3:+3 b:1:-1 c:2:-3 | -12 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 7 | `fn-d7-sindicato` Fermín Treviño | base | a:3:+3 b:1:-3 c:2:+1 | -11 | legacy | Jugable como contenido histórico, pero la opción preferida por el autor sigue siendo la que más conviene. |

### Grupo Brasa

| Día | Asunto | Tipo | Opciones | Vencer | Estado propuesto | Motivo |
|---:|---|---|---|---:|---|---|
| 1 | `gb-d1-carta` Te dejo las llaves de Brasa | base | a:3:+3 b:1:+1 c:2:+2 | -6 | legacy | Jugable como contenido histórico, pero la opción preferida por el autor sigue siendo la que más conviene. |
| 1 | `gb-d1-app` Propuesta · Socio preferente en Rappido | base | a:0:0 b:3:-2 c:2:0 | -2 | approved | Pasa las pruebas automáticas: hay al menos dos estrategias defendibles y el score no decide el resultado. Falta la firma humana. |
| 2 | `gb-d2-menu` Ingeniería de menú · 72 platillos | base | a:3:+3 b:2:+4 c:1:-6 | -3 | approved | Pasa las pruebas automáticas: hay al menos dos estrategias defendibles y el score no decide el resultado. Falta la firma humana. |
| 2 | `gb-d2-propinas` Maru Gutiérrez | base | a:2:+1 b:0:-3 c:2:-1 | -8 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 2 | `gb-c-app-guerra` Cambios en su posicionamiento | consecuencia | a:3:-3 b:2:0 | -4 | legacy | Jugable como contenido histórico, pero solo una opción es defendible con los números. |
| 3 | `gb-d3-brote` Llamada perdida · Maru (Brasa Andares) | base | a:3:-1 b:0:-7! c:2:-4 | -15 | restrictedEthics | Obligación ética o de seguridad. Es válido que tenga una respuesta clara; la opción que cruza la línea roja debe mostrarse como consecuencia, no como alternativa. |
| 3 | `gb-d3-franquicia` Franquicias: tengo 10 interesados | base | a:1:+2 b:3:+2 c:1:-3 | -5 | approved | Pasa las pruebas automáticas: hay al menos dos estrategias defendibles y el score no decide el resultado. Falta la firma humana. |
| 3 | `gb-c-cocinas` Chef Andrés | consecuencia | a:3:+2 b:1:-1 | -1 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 4 | `gb-d4-carne` El precio de la carne subió 14% | base | a:2:0 b:3:+3 c:1:-6 | -5 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 4 | `gb-d4-gerente` Caso de Ramiro Peña (Brasa Providencia) | base | a:3:+4 b:2:+2 c:0:-4 | -4 | legacy | Jugable como contenido histórico, pero la opción preferida por el autor sigue siendo la que más conviene. |
| 5 | `gb-d5-cdmx` Las 6 sucursales de CDMX pierden dinero | base | a:3:-2 b:2:-4 c:1:-9 | -5 | legacy | Jugable como contenido histórico, pero la opción preferida por el autor sigue siendo la que más conviene. |
| 5 | `gb-c-franquicia-mala` Reseñas de la primera franquicia en León | consecuencia | a:3:+1 b:1:-2 | -5 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 6 | `gb-d6-dark` Propuesta · Marca virtual solo para apps | base | a:3:-1 b:1:-5 c:1:0 | -1 | approved | Pasa las pruebas automáticas: hay al menos dos estrategias defendibles y el score no decide el resultado. Falta la firma humana. |
| 6 | `gb-d6-sucesion` Comida con los hermanos Arce | base | a:3:+5 b:1:-1 c:1:-2 | -4 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |
| 7 | `gb-d7-consejo` Para tu primer consejo como director | base | a:3:+5 b:2:+1 c:0:-2 | -4 | needsRewrite | La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor. |

## 5. Veredicto sombra

El veredicto actual exige los cinco indicadores sobre la línea del nivel y 80 % de asuntos respondidos. El veredicto sombra (propuesta v0, no validada) corre en paralelo, nadie lo ve y no se guarda en la carrera:

1. Límites críticos no compensables: caja < 30 (insolvencia), consejo < 30 (el consejo ya no te sostiene) o haber elegido una opción de línea roja.
2. Objetivos de temporada por empresa: Botanas Cumbre: margen y equipo sobre la línea («Recuperar margen sin romper la planta.»); Forja Norte: clientes y caja sobre la línea («Cumplir a la armadora y generar caja para el fondo.»); Grupo Brasa: margen y clientes sobre la línea («Defender el margen frente a las apps sin perder clientes.»).
3. Desempeño integral: salud promedio sobre la línea, en lugar de exigir cada indicador por separado.
4. Dejar vencer asuntos no reprueba por sí solo: con menos de 50 % respondido el resultado es «sin evidencia suficiente».

Población: 108 partidas reproducibles (semilla fija) en las tres empresas, nivel 0, con seis estilos de juego (cuidadoso, preferido por el autor, mixto, azar, deja vencer, peor balance) y tres planes de cambio.

| | Sombra: aprobado | Sombra: reprobado | Sombra: sin evidencia | Total |
|---|---:|---:|---:|---:|
| Actual: aprobó | 20 | 3 | 0 | 23 |
| Actual: reprobó | 33 | 50 | 2 | 85 |

Coinciden en 67 % de las partidas. Aprobación actual: 21 %; sombra: 49 %.

Motivos de reprobación en sombra (una partida puede tener varios):

| Motivo | Partidas |
|---|---:|
| Insolvencia (caja) | 0 |
| Consejo perdido | 0 |
| Eligió una línea roja | 26 |
| No cumplió un objetivo de temporada | 35 |
| Salud integral bajo la línea | 14 |

Por empresa y estilo de juego (aprobadas actual / sombra, de cada grupo):

| Empresa | best | score | mixed | random | lazy | worst |
|---|---:|---:|---:|---:|---:|---:|
| Botanas Cumbre | 6 / 6 de 6 | 0 / 6 de 6 | 0 / 5 de 6 | 1 / 3 de 6 | 0 / 2 de 6 | 0 / 0 de 6 |
| Forja Norte | 6 / 6 de 6 | 0 / 0 de 6 | 0 / 0 de 6 | 1 / 2 de 6 | 0 / 0 de 6 | 2 / 0 de 6 |
| Grupo Brasa | 6 / 6 de 6 | 0 / 6 de 6 | 0 / 6 de 6 | 1 / 2 de 6 | 0 / 3 de 6 | 0 / 0 de 6 |

Estilos: best = cuidadoso (cuida la línea en cada decisión); score = siempre la opción preferida por el autor; mixed = la preferida 60 % de las veces y al azar el resto; random = al azar; lazy = deja vencer cerca del 40 %; worst = siempre la de peor balance.

## 6. Qué decidir en la revisión editorial

Confirmar o corregir la lista de líneas rojas; firmar (dos revisores) los asuntos que queden en approved; decidir el orden de reescritura de los needsRewrite empezando por SuperNorte; y aprobar o ajustar los umbrales y objetivos del veredicto sombra antes de usarlo con jugadores reales. Ningún cambio de contenido o de veredicto entra en una temporada en curso.
