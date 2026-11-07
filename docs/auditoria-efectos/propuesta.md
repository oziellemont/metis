# Fase C · Diagnóstico del sistema de efectos y propuesta de economía real

Documento para aprobación de Oziel Leal Montemayor. **No publica nada, no cambia efectos, no activa V9 y no modifica periodos cerrados ni en curso.** Todo lo que se describe aquí como «después» es una propuesta.

Archivos de soporte, en la misma carpeta (todos se regeneran con `npx vitest run src/lib/ceo/auditoria-efectos.test.ts` y la variable indicada):

- `simulacion-4-variantes.md` y `.json` (`AUD_SIM=1`): 510 meses por variante, mismas decisiones en las cuatro.
- `reutilizacion.md` (`AUD_REUSE=1`): vectores repetidos entre industrias.
- `prioridades.md` y `prioridades.csv` (`AUD_PRIO=1`): los 2,571 caminos con su puntaje y motivos.
- `muestra-editorial.md` (`python3 muestra/muestra.py`): antes y después de 12 asuntos fijos y 2 arquetipos del banco.

## 1 · Resumen

**El multiplicador por etapa casi no influye.** Quitarlo no hace reprobar ningún mes que V8 aprobaba, y hace aprobar 7 más. A cinco meses de carrera, la etapa promedio es 1, así que el multiplicador apenas actúa. No es la causa del problema de Caja.

**El problema de Caja es la regla «caja derivada del margen».** Cuando se quita, se pierden 75 meses que V8 aprobaba. En 42 de ellos la causa nueva es el objetivo del consejo bajo la línea, y en 30 la insolvencia. En V8 esa regla suma en promedio 5.5 puntos de Caja por mes. Sin esa ayuda, las decisiones de buen criterio pierden caja: las opciones con criterio máximo restan en promedio 1.6 puntos de Caja cada una, y el 73 % de ellas resta caja. V8 aprueba porque una fórmula entre índices tapa ese drenaje, no porque la economía de las decisiones cuadre.

**Las causas cambian por empresa:**
- **Cumbre** reprueba por insolvencia aunque se juegue bien.
- **Forja** reprueba por el objetivo del consejo (Caja y Armadora), también con buen criterio: 11 de 20 meses en V9.
- **Punto Madero** y **Vértice** reprueban por Margen en las cuatro variantes. Su problema es otro y no lo resuelve ninguna regla de caja.
- **Brasa** casi no cambia.

**El contenido tiene tres defectos sistemáticos.** Primero, mueve el Consejo sin que el consejo participe (740 caminos). Segundo, mueve Caja y Margen sin un monto detrás (376 caminos). Tercero, el número no depende de la industria. Los 28 arquetipos del banco tienen exactamente los mismos efectos en las seis empresas. En los asuntos fijos, Kúbit comparte el 85 % de sus vectores con otra empresa, Punto Madero el 79 % y Vértice el 76 %. «Aceptar todo» cuesta 8 puntos de Margen a Forja ($80 M al año), a Kúbit ($10 M), a Punto Madero ($52 M) y a Vértice.

**La propuesta invierte la dirección del cálculo: hechos, luego dinero, luego índices.** Cada opción declara hechos con monto y fecha (un pago, un cobro, un descuento firmado, una inversión, un compromiso). El motor los convierte en puntos con anclas de cada empresa. Un hecho que no es material no mueve el indicador, y un hecho futuro se registra cuando ocurre. La caja mensual sale de la operación de la empresa (lo que genera el negocio menos lo que invierte), no de una fórmula sobre el índice de Margen.

**Esto no hace el juego más fácil.** En la muestra, la Caja total esperada queda prácticamente igual (−26 antes, −27.3 después). Cambia dónde pega: los cargos grandes caen donde hay dinero real (90 días de crédito, 15 unidades de $60 M) y desaparecen donde no lo hay. Los movimientos de Consejo pasan de 28 opciones a 9. Las opciones que mueven 4 o 5 indicadores pasan de 16 a 5.

## 2 · Las cuatro simulaciones

Carrera continua de 5 meses por empresa, 11 estrategias, semillas fijas, las mismas decisiones en las cuatro variantes. Las variantes intermedias solo existen dentro de la prueba: se registran como reglas temporales 97 y 98 y se borran al terminar.

| Variante | Cumbre | Forja | Brasa | Kúbit | Punto Madero | Vértice | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| V8 original (activa) | 62.4 | 48.2 | 80.0 | 64.7 | 50.6 | 49.4 | 59.2 |
| V8 sin multiplicador por etapa | 64.7 | 49.4 | 80.0 | 68.2 | 50.6 | 50.6 | 60.6 |
| V8 sin caja derivada del margen | 36.5 | 20.0 | 72.9 | 44.7 | 49.4 | 47.1 | 45.1 |
| V9 (ambos cambios, no activa) | 38.8 | 21.2 | 75.3 | 45.9 | 49.4 | 49.4 | 46.7 |

% de meses aprobados, todas las estrategias.

### 2.1 Efecto aislado de cada cambio (mismo mes, mismas decisiones)

| Cambio | Meses que pierde frente a V8 | Meses que gana | Causa nueva en los que pierde |
|---|---:|---:|---|
| Quitar multiplicador por etapa | 0 | 7 | — |
| Quitar caja derivada del margen | 75 | 3 | Objetivo del consejo 42 · Insolvencia 30 · Salud 3 · Línea roja 2 |
| Ambos (V9) | 68 | 4 | Objetivo del consejo 41 · Insolvencia 27 · Línea roja 2 · Salud 1 |

### 2.2 Indicador que provoca cada reprobación, por empresa

| Empresa | V8 | V8 sin caja-margen | V9 | Lectura |
|---|---|---|---|---|
| Cumbre | 32 reprobados: caja 12, margen 6, equipo 4 | 54: caja 35 | 52: caja 34 | La Caja de Cumbre depende de la fórmula. Sin ella, promedia 41.8 y cruza la línea de insolvencia (40) desde el mes 1. |
| Forja | 44: caja 33 | 68: caja 59 | 67: caja 58 | El objetivo del fondo es «Armadora y Caja». Lo que falla siempre es la Caja (46.3 en V9), no la Armadora. |
| Brasa | 17: repartido | 23: caja 9 | 21: caja 7 | Aprueba en todas las variantes: su contenido mueve menos caja. |
| Kúbit | 30: caja 13 | 47: caja 33 | 46: caja 31 | Su objetivo es «Caja y Clientes». Igual que Forja. |
| Punto Madero | 42: margen 25 | 43: margen 25 | 43: margen 25 | Reprueba por Margen en las cuatro. Las reglas de caja no la tocan. |
| Vértice | 43: margen 21 | 45: margen 21 | 43: margen 20 | Igual que Punto Madero. |

### 2.3 Estrategias de buen criterio (equilibrado, criterio y tablero, criterio contextual, cuida caja)

| Empresa | V8 | V8 sin etapa | V8 sin caja-margen | V9 |
|---|---|---|---|---|
| Cumbre | 2 de 20 (insolvencia) | 2 de 20 | 10 de 20 (insolvencia 10) | 9 de 20 (insolvencia 9) |
| Forja | 4 de 20 (objetivo) | 4 de 20 | 12 de 20 (objetivo 12) | 11 de 20 (objetivo 11) |
| Brasa | 0 de 20 | 0 de 20 | 1 de 20 | 1 de 20 |
| Kúbit | 2 de 20 (objetivo) | 0 de 20 | 5 de 20 | 5 de 20 |
| Punto Madero | 2 de 20 (objetivo) | 2 de 20 | 3 de 20 | 3 de 20 |
| Vértice | 3 de 20 | 3 de 20 | 3 de 20 | 3 de 20 |

En V9, un director de buen criterio en Cumbre reprueba el mes 1 con caja 39, margen 68, equipo 100, clientes 70 y consejo 89. Ese resultado no representa una empresa en problemas de liquidez, sino un índice que nunca recibe la caja que el negocio genera. El detalle mes por mes de cada estrategia está en la tabla 9 de `simulacion-4-variantes.md`.

### 2.4 Por qué fallan Punto Madero y Vértice

Las dos tienen el Margen en el objetivo del consejo, y sus perfiles de negocio son de margen muy delgado. Punto Madero tiene un margen operativo de 1.9 %. Vértice tiene un margen operativo **negativo** de −8.9 % en el perfil actual (`business/profiles.ts`, logística establecida: margen bruto de 30 % contra nómina, gastos fijos y variables que suman más). Es una inconsistencia del perfil que hay que corregir antes de anclar cualquier cálculo a él (sección 5.6). Su contenido además repite vectores de Forja, una autopartera con margen de 11.5 %.

## 3 · Reutilización entre industrias

| Empresa | Opciones fijas | Con un vector idéntico en otra empresa | % |
|---|---:|---:|---:|
| Botanas Cumbre | 81 | 5 | 6.2 |
| Forja Norte | 72 | 40 | 55.6 |
| Grupo Brasa | 60 | 5 | 8.3 |
| Kúbit | 66 | 56 | 84.8 |
| Punto Madero | 66 | 52 | 78.8 |
| Vértice Logística | 66 | 50 | 75.8 |

Forja, Kúbit, Punto Madero y Vértice comparten la misma estructura de semana y 34 vectores idénticos entre las cuatro. **En el banco, los 28 de 28 arquetipos tienen los mismos efectos en las seis industrias y en sus tres giros:** `buildCase` copia el vector del arquetipo (`effects: { ...o.effects }`), y el texto de cada industria solo cambia nombres y cifras de la tabla.

¿Encaja con la economía de cada industria? En los casos revisados, no:

| Mismo vector | Lo que dice el caso | En puntos con anclas de cada empresa |
|---|---|---|
| Retiro preventivo: caja −6 | Cumbre $6 M · Forja $14 M · Brasa $1.8 M · Punto Madero $9 M · Vértice $11 M | Caja −4 · −2 · 0 · −1 · −1 |
| Aceptar lo que pide el cliente: margen −4 | Cumbre $4.5 M · Forja $92 M · Brasa $11 M · Kúbit $7 M · Punto Madero $12 M · Vértice $19 M al año | Margen −2 · −8 · −2 · −5 · −1 · −2 |
| Aceptar todo al cliente grande: margen −8 | Forja $80 M · Kúbit $10.2 M · Punto Madero $52 M + $6.5 M | Margen −7 · −7 · −5 |

El reuso de la estructura no es en sí un error: muchas empresas enfrentan el mismo tipo de decisión. El error es que el número esté fijado por la plantilla y no por los hechos de cada caso.

## 4 · Auditoría de los 2,571 caminos

Caminos: 1,923 opciones y 648 vencimientos. 555 son asuntos fijos y 2,016 del banco. Cada camino recibe puntos por señales objetivas, y el puntaje solo ordena la revisión: **no elimina ni cambia nada automáticamente**, y cada camino se valida a mano.

| Prioridad | Caminos | Fijos | Banco |
|---|---:|---:|---:|
| P1 (5 puntos o más) | 700 | 93 | 607 |
| P2 (3–4) | 697 | 145 | 552 |
| P3 (1–2) | 481 | 110 | 371 |
| Sin señal | 693 | 207 | 486 |

| Señal | Caminos |
|---|---:|
| Mueve 4 o 5 indicadores a la vez | 1,162 |
| Consejo se mueve sin evento de gobierno en el caso | 740 |
| Caja y Margen en el mismo sentido: confirmar que son dos hechos y no uno contado dos veces | 698 |
| El caso menciona al consejo, pero esta opción no le informa ni le afecta | 459 |
| Hay montos en el caso, pero la opción no dice qué se paga o cobra | 328 |
| Un vencimiento castiga al Consejo sin que el consejo se entere | 223 |
| Una promesa o un plan suma dinero de inmediato | 187 |
| Caja o Margen sin ningún monto en el caso | 48 |
| Vencimiento muy severo (neto de −10 o peor) | 44 |
| Movimiento de 8 puntos o más | 30 |

Como el banco repite el arquetipo, **corregir un arquetipo corrige 18 caminos** (6 industrias × 3 giros). Los arquetipos que concentran más P1 son:
- `meta` (72 de 72 caminos en P1);
- `incidente` (63);
- `adquisicion` (45);
- `cliente` (38);
- `ciberataque`, `error`, `guerra`, `trimestre` y `prensa` (36 cada uno).

Corregir estos nueve arquetipos atiende 398 de los 607 P1 del banco. Los asuntos fijos con P1 por empresa son: Cumbre 12, Forja 22, Brasa 12, Kúbit 13, Punto Madero 16 y Vértice 18. La lista completa está en `prioridades.csv`.

### Patrones confirmados al revisar a mano

| Patrón | Ejemplo | Por qué no es causal |
|---|---|---|
| Vencer castiga más que aceptar | SuperNorte: aceptar −10 netos; vencer −21 (caja −8, margen −9, consejo −4) | Al vencer se aplican las mismas condiciones. No hay un hecho adicional que justifique el doble. |
| No conceder suma margen | SuperNorte c: margen +3; Kúbit caída c: margen +2, caja +1; Almena c: margen +2, caja +1 | No pagar algo no es un ingreso: evita una pérdida. El margen se queda igual. |
| Consejo como premio a la buena idea | SuperNorte b: consejo +3 por pedir una reunión | El consejo no participa ni se entera. |
| Ahorro futuro cobrado hoy | Menú de Brasa: margen +5 al decidir; el ahorro de merma tarda semanas en medirse | El efecto debe registrarse cuando se mide. |
| Costos no materiales | Brote de Brasa: caja −4 por $1.5 M en un grupo de $980 M | 5 veces más de lo que cuesta realmente. |
| El hecho del caso se carga a la opción | Diésel de Vértice: el alza de $48 M al año ocurre elijas lo que elijas, pero solo se castiga si vence | El hecho debe registrarse al llegar, y la opción solo debe mover su diferencia. |
| Datos contradictorios | Kúbit: «créditos por contrato $2.1 M», pero la opción c dice que se cumplió el 99 % garantizado. Vértice: −6 % de consumo ahorra casi todo el alza y el personaje dice «no alcanza». | Hay que corregir el dato antes de calcular. |

## 5 · Modelo económico propuesto

### 5.1 Principio

Cada opción declara **hechos**. Un hecho tiene:
- tipo;
- monto en millones de pesos;
- fecha, que puede ser al decidir, en N días, al cierre del mes o al cierre del trimestre;
- condición opcional: una respuesta de la contraparte o una medición.

El motor lleva un **registro de hechos** por periodo con un identificador único por hecho, así que no se cuenta dos veces. A partir de ese registro calcula cuánto entra y sale de caja y cuánto cambia el resultado. Solo al final convierte eso en puntos de Caja y Margen. Equipo, Clientes y Consejo siguen siendo índices editoriales, pero cada movimiento debe citar un hecho del caso (sección 6).

### 5.2 Tipos de hecho

| Tipo | Qué es | Caja | Margen | Ejemplo |
|---|---|---|---|---|
| Cobro | Entra dinero de algo ya vendido | Sí, cuando se cobra | No | Cobro de un adeudo atrasado |
| Pago | Sale dinero por un gasto de una sola vez | Sí, cuando se paga | Solo si es gasto del periodo | Créditos a clientes, gastos médicos, multa |
| Cambio de precio | Descuento o aumento firmado | Se refleja en los cobros siguientes | Sí, desde que se firma, por el monto anual | 5 % a Aurora: −$80 M al año |
| Cambio de costo | Sube o baja un costo recurrente | Se refleja en los pagos siguientes | Sí, desde que ocurre | Aumento salarial, alza del diésel |
| Inversión | Compra de un activo | Sí, cuando se paga | Solo la depreciación anual | 15 unidades: $60 M de caja, $12 M al año de margen |
| Capital de trabajo | Cambia el plazo de cobro o el inventario | Sí, el monto atrapado o liberado | No | 90 días a SuperNorte: $10 M atrapados |
| Compromiso | Obligación futura con fecha o condición | No, hasta que se paga | No, hasta que ocurre | Bono condicionado a merma |
| Financiamiento | Deuda o capital | Sí | Solo los intereses | Crédito puente |

### 5.3 Anclas por empresa

Las anclas salen del perfil de negocio de cada empresa (`business/profiles.ts`, tipo establecida). Ese perfil ya existe y ya cumple la identidad de caja del mes: caja final = caja inicial + entradas − salidas.

| Empresa | Ventas al año | Salidas al mes | 1 punto de Caja | 1 punto de Margen |
|---|---:|---:|---:|---:|
| Botanas Cumbre | $410 M | $32.5 M | $1.62 M | $2.0 M al año |
| Forja Norte | $2,300 M | $173.4 M | $8.67 M | $11.5 M al año |
| Grupo Brasa | $980 M | $77.9 M | $3.90 M | $4.9 M al año |
| Kúbit | $300 M | $24.3 M | $1.22 M | $1.5 M al año |
| Punto Madero | $2,400 M | $199.2 M | $9.96 M | $12.0 M al año |
| Vértice Logística | $1,800 M | $169.3 M | $8.47 M | $9.0 M al año |

**Regla propuesta:**
- 1 punto de Caja equivale al 5 % de lo que la empresa paga en un mes, así que 20 puntos equivalen a un mes de operación.
- 1 punto de Margen equivale a 0.5 puntos porcentuales de margen operativo anual.

Ninguna de las dos depende del índice: depende de pesos. Las dos constantes (5 % y 0.5 pp) son una decisión editorial que se fija una vez, se versiona y se valida con simulaciones antes de activarse. No se ajustan para «compensar».

### 5.4 Materialidad

- Si un hecho, redondeado, da 0 puntos, el indicador no se mueve. El hecho sí queda en el registro y se muestra al jugador («$1.5 M en gastos médicos: no cambia la liquidez del grupo»).
- Los hechos del mismo periodo se acumulan en el registro antes de redondear, así que diez gastos pequeños sí terminan por mover la Caja.
- Una opción no puede declarar un monto que el caso no muestre. Si el caso no lo trae, se agrega al bloque de datos o el indicador no se mueve.

### 5.5 Caja del mes: la operación sustituye a la fórmula

Hoy, al cierre del mes, V8 suma entre −5 y +10 puntos de Caja según qué tan arriba de la línea está el índice de Margen. La propuesta lo sustituye por la **generación operativa del mes**: lo que el negocio produce (margen bruto menos nómina y gastos) menos la inversión de mantenimiento, ajustado por los hechos de precio y costo registrados en el periodo. Con los perfiles actuales queda así:

| Empresa | Generación operativa del mes | En puntos de Caja | Lo que suma V8 hoy (promedio) |
|---|---:|---:|---:|
| Cumbre | $1.7 M | +1.1 | +6.6 |
| Forja | $18.2 M | +2.1 | +4.9 |
| Brasa | $3.8 M | +1.0 | +8.0 |
| Kúbit | $0.7 M | +0.6 | +6.2 |
| Punto Madero | $0.8 M | +0.1 | +3.3 |
| Vértice | −$19.4 M | −2.3 | +4.0 |

La diferencia es grande. Con la economía real, la Caja ya no recibe un regalo mensual, y por eso **el contenido tiene que dejar de drenar caja sin hechos**. Si solo se cambiara la regla sin corregir los efectos, se repetiría lo que muestra V9. El orden propuesto es: corregir contenido, luego activar la regla y luego simular, sin tocar valores iniciales ni umbrales.

### 5.6 Correcciones previas a los perfiles

- **Vértice:** el perfil de logística da un margen operativo de −8.9 % al mes. La empresa, como está narrada, no es una empresa que pierde $19 M al mes. Hay que corregir el perfil (por ejemplo, gastos variables o nómina) para que cuadre con la historia, y no al revés.
- **Forja y Punto Madero:** su caja de perfil cubre 0.23 y 0.30 meses de salidas. Para empresas de ese tamaño hace falta revisar el saldo inicial del perfil. Esto no cambia el índice inicial (`kpiStart` se queda igual): solo afecta el texto en pesos que ve el jugador.
- **Kúbit:** un software con 78 % de margen bruto y 3.8 % de margen operativo es coherente con una empresa que invierte en crecimiento, pero conviene confirmarlo con la historia de la ronda.

### 5.7 Cómo se ve para el jugador

En el resultado de cada decisión, la barra de antes y después de la Fase A se mantiene y se agrega una línea por hecho:
- «Al decidir: descuento firmado de $5.1 M al año. Margen −2.»
- «Cuando ocurra: primeras facturas a 90 días, el mes siguiente. Caja −6.»
- «Si responde: Sofía decide en 2 días.»

En «Mi empresa», el registro de movimientos de la Fase A muestra cada hecho con su fecha y su monto.

## 6 · Reglas de causalidad

Cada regla se verifica con una prueba automática del contenido.

1. **Cada movimiento cita un hecho.** Caja y Margen requieren un hecho económico con monto que aparezca en el caso. Equipo y Clientes requieren algo que le pase a una persona o grupo nombrado en el caso o en la respuesta. Consejo requiere un evento de gobierno: el consejo decide, recibe un reporte o se entera por un tercero. Una decisión por arriba de la autoridad del director sin pasar por el consejo también cuenta como evento de gobierno.
2. **Sin hecho inmediato material, el indicador se queda igual.** Una reunión, una propuesta o un plan no mueven Caja ni Margen.
3. **Lo futuro se registra cuando ocurre.** Pagos con fecha, mediciones al cierre y respuestas de contrapartes van como hecho diferido o acuerdo pendiente. Un pronóstico se muestra como texto y no mueve nada.
4. **El hecho del caso es del caso, no de la opción.** Si algo ya pasó antes de decidir (un brote, una caída, un alza de costo), se registra al llegar el asunto. Cada opción solo mueve su diferencia.
5. **No conceder no es ganar.** Sostener un precio o rechazar una petición deja Caja y Margen igual. Lo que cambia es el riesgo con la contraparte, que va como acuerdo pendiente.
6. **Vencer aplica los hechos de lo que pasa por default, sin castigo adicional.** Si el default equivale a aceptar, vencer cuesta lo mismo que aceptar, más lo que el caso diga que ocurre por no responder.
7. **Un hecho, una cuenta.** Un descuento mueve Margen y no Caja de inmediato (la caja lo recibe vía la generación operativa del mes). Un pago de una sola vez mueve Caja, y Margen solo si es gasto del periodo. El identificador del hecho impide contarlo dos veces.
8. **Autoridad.** Las concesiones mayores al 20 % del margen operativo anual, o las inversiones mayores al 2 % de la venta anual, son decisiones de consejo. Tomarlas sin él es un evento de gobierno que mueve el Consejo. Esto aplica igual en las seis empresas, con las cifras de cada una.
9. **El vector no se hereda de la plantilla.** El arquetipo define los tipos de hecho. Los montos salen de la tabla de cada industria.

## 7 · Muestra editorial

Doce asuntos fijos (dos P1 por empresa) y los arquetipos `retiro` y `cliente` del banco en las seis industrias. Está completa en `muestra-editorial.md`, con hechos y montos, problemas encontrados, la tabla de antes y después por opción (al decidir / cuando ocurra / si responde) y lo que lee el jugador.

| Indicador | Suma antes | Suma esperada después | Opciones que lo mueven antes | Después |
|---|---:|---:|---:|---:|
| Caja | −26 | −27.3 | 21 | 11 |
| Margen | −20 | −15.4 | 31 | 20 |
| Equipo | +3 | −0.2 | 19 | 14 |
| Clientes | −22 | −11.0 | 29 | 20 |
| Consejo | −12 | −14.5 | 28 | 9 |

La suma de «después» no incluye los efectos que el propio hecho del caso aplica al llegar el asunto (Brasa, brote: Comensales −3; Kúbit, caída: Clientes −2; Vértice, diésel: Margen −5). Esos efectos ocurren en cualquier opción, y hoy están repartidos dentro de las opciones y del vencimiento.

Opciones que mueven 4 o 5 indicadores: 16 antes, 5 después. La suma no busca dar un número más alto ni más bajo. Busca que cada punto tenga un monto, una fecha y un responsable.

**Cifras que requieren validación**: las marcadas en la muestra como «estimación editorial» o «propuesta de dato» (por ejemplo, venta de los dos CEDIS de Almena, costo de la investigación externa en Forja, ahorro de merma en Brasa). Las probabilidades de los acuerdos pendientes son estimaciones del caso, igual que en V8.

## 8 · Plan de implementación por etapas

Cada etapa termina en una compuerta de aprobación de Oziel. Ninguna etapa publica efectos nuevos para los jugadores.

| Etapa | Qué se hace | Qué se entrega | Compuerta |
|---|---|---|---|
| 0 | Este diagnóstico: la prueba de auditoría (opcional, no corre en la suite normal) y los documentos | PR solo de documentos y la prueba | Aprobar la muestra y las reglas de las secciones 5 y 6 |
| 1 | Motor de hechos: tipo `facts` en la opción, registro por periodo, conversión con anclas, materialidad y hechos diferidos. Detrás de una versión de reglas nueva (v10) que no se activa. V9 queda como diagnóstico y no se activa nunca. | Pruebas de identidad de caja, sin doble conteo y con lo diferido registrado solo cuando ocurre | Revisión técnica |
| 2 | Corrección de perfiles (Vértice) y de datos contradictorios (Kúbit, Vértice) | Diferencias por empresa | Aprobar cifras |
| 3 | Migración de contenido: los 9 arquetipos del banco con más P1, luego los 93 P1 fijos y luego P2. Cada asunto se corrige con `revisions` desde v10, con el mismo id, así que sus consecuencias y la continuidad no se rompen. | Lote por empresa con antes y después, como la muestra | Aprobación editorial por lote |
| 4 | Simulación v8 contra v10, mismas decisiones, sin tocar valores iniciales ni umbrales | Reporte con las mismas tablas de la sección 2 | Si alguna estrategia de buen criterio reprueba por una causa sin hecho, se corrige el contenido, no la regla |
| 5 | Activación solo para la cuenta de Oziel (bandera por usuario) para que la pruebe en su empresa | Acceso en producción | Visto bueno personal |
| 6 | Activación para periodos nuevos de todos | Nota de cambios para usuarios | Aprobación final |

La intervención semanal aprobada en concepto se diseña después de la etapa 4, sobre el motor de hechos, para que también declare hechos y no puntos.

## 9 · Compatibilidad y migración

- **Periodos cerrados:** conservan su versión de reglas y su evaluación. No se recalculan. El diario ya guarda la versión de cada periodo, y el sanitizador limita la versión enviada por el cliente a la activa.
- **Periodos en curso al activar v10:** terminan con la versión con la que empezaron. El asunto revisado solo se presenta con su revisión en periodos de v10 o posteriores (`itemAtVersion`).
- **Periodos nuevos:** usan v10 solo después de la etapa 6.
- **Historial y logros:** la nota, el criterio y los logros ya obtenidos no cambian. Las comparaciones entre periodos de distinta versión se marcan como tales en el reporte.
- **Ningún periodo se ha jugado con V9:** el sanitizador lo impide. Por eso V9 puede quedar documentada sin riesgo, y el motor nuevo usa un número distinto (v10) para que no haya ambigüedad.
- **Reversión:** si la etapa 5 o 6 muestra un problema, se regresa la versión activa a 8. Los periodos jugados en v10 conservan su versión y se cierran con ella.

## 10 · Lo que necesito que decidas

1. Si apruebas la escala de anclas (1 punto de Caja = 5 % de las salidas de un mes; 1 punto de Margen = 0.5 pp de margen operativo anual) o prefieres otra.
2. Si apruebas las nueve reglas de causalidad de la sección 6, en especial la 4 (el hecho del caso se registra al llegar) y la 8 (autoridad del director).
3. Cuáles de los doce asuntos de la muestra apruebas como están, cuáles con cambios y cuáles rechazas.
4. Si autorizas corregir el perfil de Vértice antes de anclar cálculos a él.
5. Si autorizas iniciar la etapa 1 (motor de hechos detrás de v10, sin activar).
