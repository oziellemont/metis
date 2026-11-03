# Diagnóstico V6 → V7: ética, personas y criterio

Fuente: `docs/editorial/diagnostico-v6.json` (generado con `DIAG_REPORT=1 npx vitest run src/lib/ceo/diagnostico.test.ts`). 6 empresas × 5 meses × 3 semillas = 90 meses por estrategia y versión. La semilla `calibracion` es la usada al calibrar; `nueva_a` y `nueva_b` arrancan en fechas distintas (+9 días 7 h y +23 días 13 h), lo que cambia el azar de las consecuencias inciertas. Además `v7.test.ts` valida con una cuarta semilla de reserva (+41 días 5 h) que no se usó para nada más.

Regla de este ciclo: no se movió ningún umbral. V7 tiene exactamente los mismos números que V6; lo único que cambia son líneas rojas nuevas, marcadas con `since: 7`. Las partidas en V6 o anteriores no cambian.

## 1. Aprobación por estrategia

| Estrategia | V6 | V7 | V7 calibración / nueva_a / nueva_b |
|---|---|---|---|
| criterio_y_tablero | 85.6 % | 93.3 % | 90 / 93.3 / 96.7 |
| cuida_caja | 81.1 % | 90 % | 90 / 86.7 / 93.3 |
| mejor_efecto | 76.7 % | 26.7 % | 26.7 / 26.7 / 26.7 |
| numeros_con_piso | 70 % | 27.8 % | 26.7 / 26.7 / 30 |
| etica_flexible | 86.7 % | 72.2 % | 73.3 / 70 / 73.3 |
| segunda_mejor | 0 % | 0 % | 0 / 0 / 0 |
| personas_primero | 24.4 % | 40 % | 40 / 40 / 40 |
| personas_con_piso | 80 % | 90 % | 90 / 90 / 90 |
| azar | 3.7 % | 3.7 % | 2.2 / 3.3 / 5.6 |

La diferencia entre semillas es pequeña (±7 puntos) en las estrategias de criterio y nula en las deterministas: el resultado no depende de la semilla con la que se calibró.

## 2. Por empresa (V7)

| Estrategia | cumbre | forja | brasa | kubit | puntomadero | vertice |
|---|---|---|---|---|---|---|
| criterio_y_tablero | 93.3 | 80 | 100 | 86.7 | 100 | 100 |
| cuida_caja | 80 | 80 | 100 | 86.7 | 100 | 93.3 |
| mejor_efecto | 80 | 0 | 80 | 0 | 0 | 0 |
| numeros_con_piso | 80 | 0 | 66.7 | 0 | 0 | 20 |
| etica_flexible | 93.3 | 40 | 100 | 80 | 40 | 80 |
| segunda_mejor | 0 | 0 | 0 | 0 | 0 | 0 |
| personas_primero | 40 | 40 | 60 | 60 | 0 | 40 |
| personas_con_piso | 93.3 | 80 | 100 | 73.3 | 100 | 93.3 |
| azar | 2.2 | 8.9 | 6.7 | 2.2 | 2.2 | 0 |

## 3. Por causa de reprobación

Un mes puede reprobar por más de una causa.

| Estrategia | V6 | V7 |
|---|---|---|
| criterio_y_tablero | insolvencia 3, objetivo 10 | insolvencia 1, objetivo 5 |
| cuida_caja | insolvencia 4, objetivo 13 | insolvencia 4, objetivo 5 |
| mejor_efecto | linea_roja 15, objetivo 3, insolvencia 3, criterio 3 | linea_roja 66, objetivo 9, criterio 10 |
| numeros_con_piso | linea_roja 15, criterio 11, insolvencia 1 | linea_roja 60, criterio 16, insolvencia 1 |
| etica_flexible | objetivo 6, insolvencia 3, criterio 3 | objetivo 24, insolvencia 1 |
| segunda_mejor | objetivo 30, criterio 90, salud 23, piso 3 | objetivo 29, criterio 90, salud 24, piso 3 |
| personas_primero | insolvencia 21, objetivo 59, salud 3, piso 3 | insolvencia 24, objetivo 45, salud 3 |
| personas_con_piso | insolvencia 1, objetivo 17 | insolvencia 2, objetivo 7 |
| azar | salud 68, criterio 247, insolvencia 40, linea_roja 60, objetivo 116, piso 20 | salud 57, criterio 243, insolvencia 32, linea_roja 177, objetivo 101, piso 15 |

## 4. Líneas rojas cruzadas y decisiones éticas con score 0

| Estrategia | Score 0 en ética sin línea roja (V6) | Ídem (V7) | Líneas rojas cruzadas (V7) |
|---|---|---|---|
| criterio_y_tablero | 0 | 0 | 0 |
| cuida_caja | 0 | 0 | 0 |
| mejor_efecto | 39 | 0 | 69 |
| numeros_con_piso | 39 | 0 | 62 |
| etica_flexible | 39 | 0 | 0 |
| segunda_mejor | 0 | 0 | 0 |
| personas_primero | 0 | 0 | 0 |
| personas_con_piso | 0 | 0 | 0 |

En V6 había 39 a 42 elecciones éticas con score 0 que no costaban nada a las estrategias numéricas (demo de Kubit, entrega de Punto Madero, rastreo de Vértice y metas del banco de incidencias). En V7 son 0 para todas las estrategias deliberadas; solo la estrategia al azar las sigue cayendo, como debe.

## 5. Por competencia: decisiones no bien razonadas

| Competencia | criterio_y_tablero V6→V7 | cuida_caja V6→V7 | personas_con_piso V6→V7 | etica_flexible V6→V7 | numeros_con_piso V6→V7 | segunda_mejor V6→V7 |
|---|---|---|---|---|---|---|
| alineacion | 10→5 | 12→7 | 3→3 | 12→6 | 6→1 | 84→95 |
| clientes | 37→48 | 46→52 | 14→27 | 85→84 | 132→170 | 260→303 |
| comunicacion | 6→8 | 7→6 | 10→5 | 16→10 | 55→35 | 231→242 |
| cultura | 10→12 | 12→19 | 10→10 | 9→9 | 31→35 | 221→228 |
| estrategia | 49→69 | 55→60 | 42→43 | 151→134 | 177→171 | 360→391 |
| etica | 5→5 | 6→4 | 5→4 | 54→12 | 84→90 | 232→231 |
| finanzas | 88→112 | 98→114 | 58→68 | 197→214 | 272→305 | 582→652 |
| negociacion | 47→52 | 46→52 | 19→29 | 34→53 | 45→74 | 167→183 |
| operacion | 49→56 | 60→56 | 38→41 | 177→132 | 248→251 | 480→514 |
| personas | 29→23 | 33→35 | 20→22 | 72→63 | 105→114 | 464→473 |

Finanzas es la competencia que más falla incluso con buen criterio: el jugador elige bien pero no prioriza la caja. Es el punto débil real del simulador para la mayoría de las estrategias, y es coherente con que los objetivos más fallados sean de caja (Forja y Kubit).

## 6. Por indicador (promedio al cierre, V7)

| Estrategia | caja | margen | equipo | clientes | consejo | % bien razonados |
|---|---|---|---|---|---|---|
| criterio_y_tablero | 52 | 61 | 80 | 63 | 72 | 90.7 |
| cuida_caja | 53 | 61 | 80 | 63 | 73 | 90.5 |
| mejor_efecto | 59 | 59 | 79 | 65 | 82 | 74.9 |
| numeros_con_piso | 62 | 59 | 78 | 63 | 80 | 70.3 |
| etica_flexible | 55 | 59 | 81 | 66 | 82 | 82.2 |
| segunda_mejor | 50 | 61 | 64 | 61 | 57 | 14.2 |
| personas_primero | 43 | 52 | 90 | 73 | 78 | 99.2 |
| personas_con_piso | 51 | 59 | 82 | 65 | 75 | 94 |
| azar | 51 | 56 | 62 | 64 | 68 | 42.9 |

## 7. Por qué «segunda mejor» saca 0 %

La estrategia elige siempre la segunda mejor opción de cada asunto (score 1 o 2, nunca 3). Sus resultados en números no son malos: caja 50, margen 61, clientes 61. Reprueba porque solo el 14 % de sus decisiones queda bien razonado y el umbral de criterio exige mayoría: los 90 meses reprueban por criterio, y además 29 por objetivo, 24 por salud de la relación con el consejo (57) y el equipo (64).

Es el comportamiento buscado: MÊTIS mide juicio, no supervivencia. Alguien que siempre toma la opción «aceptable» pero nunca la mejor no debe aprobar. No es un efecto del umbral: aun bajando el umbral de criterio a la mitad seguiría reprobando, porque 14 % está muy lejos. Por eso no se tocó.

## 8. Por qué «solo números» aprobaba en V6

«Números con piso» elige la opción con mejor efecto en indicadores, cuidando no caer por debajo de los pisos. En V6 aprobaba el 70 % porque en cinco casos la opción poco ética (score 0) era también la que más mejoraba los números y no era línea roja: prometer la demo de Kubit con funciones que no existen, la entrega de Punto Madero, ocultar el rastreo en Vértice y maquillar metas en el banco de incidencias. La única línea roja que tocaba era el PPAP de Forja, y por eso solo reprobaba Forja (0 %).

El sistema premiaba los números sin preguntar cómo se lograron. En V7 esas conductas son línea roja (además del dosificador de Cumbre, los embargos y el banco del día 5, y las metas y errores del banco de incidencias), y la estrategia baja a 28 %. Los meses que todavía aprueba (sobre todo Cumbre y Brasa) son aquellos en que la opción más rentable no era la deshonesta: aprueba sin cruzar ninguna línea, lo cual es legítimo.

## 9. ¿Alguien aprueba sistemáticamente con conducta poco ética?

Se probó con «ética flexible», la estrategia más difícil de atrapar: busca el mejor efecto pero esquiva justo las líneas rojas conocidas. En V7 aprueba el 72 % (antes 87 %), sin cruzar líneas rojas y con 0 elecciones éticas de score 0. Las 3 elecciones con score 0 que le quedan son de otras competencias, no de ética. Sus reprobaciones son de objetivo (caja de Forja, margen de Punto Madero): exprimir los números sin las trampas ya no alcanza para cumplir la meta. Conclusión: ya no hay un camino poco ético que apruebe de forma sistemática.

## 10. Personas primero

Hay dos versiones. «Personas primero» elige siempre lo mejor para el equipo aunque cueste caja: sube de 24 % a 40 %, con equipo 90 pero caja 43, y reprueba por insolvencia (24) y objetivo (45). «Personas con piso» cuida al equipo sin dejar caer la caja por debajo del piso: sube de 80 % a 90 % y en Forja pasa de 20 % a 80 % gracias a la cadena piloto de inventario, que ofrece un camino humano y financieramente viable. El resultado buscado se cumple: existe un camino viable centrado en personas, pero cuidar al equipo no compensa quebrar la empresa.

## 11. Qué se sigue vigilando

Forja sigue siendo la empresa más exigente en caja para todas las estrategias (80 % con buen criterio). Kubit en caja con «personas con piso» (73 %). Finanzas es la competencia con más decisiones no bien razonadas. Ninguno de estos puntos se corrigió moviendo umbrales; si hace falta, se corregirá con contenido (opciones y consecuencias), validado de nuevo con semillas nuevas.
