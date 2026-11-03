# Simulación del motor · V6 (carrera continua) y V5 (temporadas)

Generado con `SIM_REPORT=1 npx vitest run src/lib/ceo/season-sim.test.ts -t V6`. Semillas fijas: el resultado es reproducible.

**Estrategias de control (holdout):** `cuida_caja`, `personas_primero`, `numeros_con_piso`, `criterio_con_errores`, `criterio_ocupado`, `segunda_mejor`. No se usaron para ajustar ninguna regla. Aprobar las seis empresas con una estrategia conocida no prueba nada; por eso se reportan aparte.

## 1 · Temporadas (veredicto vigente v5) · % de temporadas aprobadas

| Estrategia | Control | cumbre | forja | brasa | kubit | puntomadero | vertice | Promedio |
|---|---|---|---|---|---|---|---|---|
| Siempre la opción más larga |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Siempre la opción más corta |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Al azar |  | 0 | 0 | 30 | 0 | 30 | 10 | 11.7 |
| Siempre la que el feedback felicita (criterio más alto) |  | 100 | 0 | 100 | 0 | 0 | 0 | 33.3 |
| Siempre la de criterio más bajo |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Solo números: la de mejor efecto neto |  | 100 | 0 | 100 | 100 | 100 | 100 | 83.3 |
| Siempre la primera opción |  | 0 | 0 | 100 | 0 | 0 | 0 | 16.7 |
| No contesta nada |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Contesta la mitad (al azar) |  | 0 | 0 | 10 | 0 | 0 | 0 | 1.7 |
| Director equilibrado: opciones defendibles cuidando el indicador más débil |  | 100 | 100 | 100 | 100 | 100 | 100 | 100 |
| Criterio contextual (rúbrica nueva): lo mejor razonado leyendo el tablero |  | 100 | 0 | 100 | 100 | 100 | 100 | 83.3 |
| Criterio y tablero: bien razonada y cuidando el encargo del consejo y la caja |  | 100 | 100 | 100 | 100 | 100 | 100 | 100 |
| Caminos variados: cualquier opción con criterio contextual alto, al azar |  | 100 | 0 | 100 | 100 | 80 | 80 | 76.7 |
| Control · bien razonada cuidando la caja | sí | 100 | 100 | 100 | 100 | 100 | 100 | 100 |
| Control · bien razonada, personas y clientes primero | sí | 100 | 0 | 100 | 0 | 0 | 0 | 33.3 |
| Control · solo números, sin dejar indicadores bajo la línea | sí | 100 | 0 | 100 | 100 | 100 | 100 | 83.3 |
| Control · buen criterio con 25 % de errores al azar | sí | 66.7 | 16.7 | 100 | 100 | 83.3 | 83.3 | 75 |
| Control · buen criterio, pero deja vencer 25 % de los asuntos | sí | 100 | 16.7 | 83.3 | 83.3 | 16.7 | 50 | 58.3 |
| Control · siempre la segunda mejor razonada | sí | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## 2 · Carrera continua con v6 · % de meses aprobados (meses 1–5 por empresa)

| Estrategia | Control | cumbre | forja | brasa | kubit | puntomadero | vertice | Promedio |
|---|---|---|---|---|---|---|---|---|
| Siempre la opción más larga |  | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/100/0 | 0/0/100/0/0 | 0/0/0/0/0 | 6.7 |
| Siempre la opción más corta |  | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0 |
| Al azar |  | 0/0/0/10/10 | 10/10/10/10/10 | 0/0/0/10/0 | 20/0/0/0/10 | 0/0/0/0/0 | 10/0/0/0/0 | 4 |
| Siempre la que el feedback felicita (criterio más alto) |  | 100/0/0/100/0 | 0/0/0/0/0 | 100/100/100/0/0 | 100/100/0/0/0 | 0/100/0/0/100 | 0/0/0/0/0 | 30 |
| Siempre la de criterio más bajo |  | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0 |
| Solo números: la de mejor efecto neto |  | 100/100/100/100/100 | 0/0/0/0/0 | 100/100/100/100/0 | 100/0/100/100/100 | 100/100/100/100/100 | 100/100/100/100/100 | 76.7 |
| Siempre la primera opción |  | 0/0/0/100/0 | 0/0/0/0/0 | 100/100/100/100/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 16.7 |
| No contesta nada |  | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0 |
| Contesta la mitad (al azar) |  | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/10/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0.3 |
| Director equilibrado: opciones defendibles cuidando el indicador más débil |  | 100/100/100/100/100 | 100/100/100/0/100 | 100/100/100/100/100 | 100/100/100/100/100 | 100/100/100/100/100 | 100/100/100/0/0 | 90 |
| Criterio contextual (rúbrica nueva): lo mejor razonado leyendo el tablero |  | 100/0/0/100/0 | 0/100/0/0/0 | 100/100/100/100/100 | 100/100/0/100/0 | 100/100/100/100/0 | 100/100/0/0/0 | 56.7 |
| Criterio y tablero: bien razonada y cuidando el encargo del consejo y la caja |  | 100/100/0/100/100 | 100/100/0/0/100 | 100/100/100/100/100 | 100/100/100/100/0 | 100/100/100/100/100 | 100/100/0/100/100 | 83.3 |
| Caminos variados: cualquier opción con criterio contextual alto, al azar |  | 100/70/30/90/20 | 80/90/20/40/10 | 100/100/100/90/90 | 100/100/70/50/40 | 80/100/60/100/80 | 90/80/70/90/50 | 73 |
| Control · bien razonada cuidando la caja | sí | 100/100/0/100/100 | 100/100/0/0/100 | 100/100/100/100/100 | 100/100/100/100/0 | 100/100/100/100/100 | 100/100/0/0/100 | 80 |
| Control · bien razonada, personas y clientes primero | sí | 100/0/0/100/0 | 0/0/0/0/0 | 100/100/0/100/0 | 100/100/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 23.3 |
| Control · solo números, sin dejar indicadores bajo la línea | sí | 100/100/100/100/100 | 0/0/0/0/0 | 100/100/100/100/100 | 100/0/100/100/100 | 100/100/100/100/100 | 100/0/100/100/0 | 73.3 |
| Control · buen criterio con 25 % de errores al azar | sí | 83.3/100/83.3/66.7/66.7 | 66.7/66.7/50/66.7/66.7 | 100/100/100/100/100 | 100/100/83.3/33.3/33.3 | 100/83.3/50/100/100 | 83.3/83.3/66.7/83.3/66.7 | 79.4 |
| Control · buen criterio, pero deja vencer 25 % de los asuntos | sí | 100/100/83.3/83.3/66.7 | 83.3/100/0/33.3/50 | 66.7/100/100/100/66.7 | 100/83.3/100/16.7/66.7 | 100/100/100/83.3/100 | 100/100/66.7/100/83.3 | 81.1 |
| Control · siempre la segunda mejor razonada | sí | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0 |

## 3 · Carrera continua con v4 · % de meses aprobados (meses 1–5 por empresa)

Referencia: reglas con que siguen los periodos que empezaron antes de v6 (no se recalifican).

| Estrategia | Control | cumbre | forja | brasa | kubit | puntomadero | vertice | Promedio |
|---|---|---|---|---|---|---|---|---|
| Siempre la opción más larga |  | 0/0/0/0/0 | 100/0/0/0/100 | 0/0/0/0/0 | 100/0/0/0/0 | 100/0/0/0/0 | 100/0/0/0/0 | 16.7 |
| Siempre la opción más corta |  | 100/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 3.3 |
| Al azar |  | 20/10/0/30/0 | 10/0/0/0/10 | 30/10/10/10/10 | 60/0/10/30/0 | 10/10/20/20/0 | 30/0/0/20/0 | 12 |
| Siempre la que el feedback felicita (criterio más alto) |  | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0 |
| Siempre la de criterio más bajo |  | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0 |
| Solo números: la de mejor efecto neto |  | 0/0/0/0/0 | 0/0/0/0/0 | 100/0/0/0/0 | 100/100/100/0/0 | 100/100/100/0/0 | 100/100/100/0/0 | 33.3 |
| Siempre la primera opción |  | 0/0/0/0/0 | 0/0/0/0/0 | 100/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 3.3 |
| No contesta nada |  | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0 |
| Contesta la mitad (al azar) |  | 0/0/0/0/0 | 20/0/0/0/0 | 20/10/0/0/10 | 0/0/10/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 2.3 |
| Director equilibrado: opciones defendibles cuidando el indicador más débil |  | 0/0/0/0/0 | 100/0/0/100/0 | 100/0/0/0/0 | 100/0/0/100/0 | 100/100/0/0/0 | 100/0/0/100/0 | 30 |
| Criterio contextual (rúbrica nueva): lo mejor razonado leyendo el tablero |  | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 100/100/0/0/0 | 100/0/0/0/0 | 10 |
| Criterio y tablero: bien razonada y cuidando el encargo del consejo y la caja |  | 0/0/0/0/0 | 0/0/0/0/0 | 100/0/0/0/0 | 100/100/0/0/0 | 100/100/0/100/0 | 0/0/0/0/0 | 20 |
| Caminos variados: cualquier opción con criterio contextual alto, al azar |  | 0/0/0/0/0 | 0/0/0/0/0 | 0/10/0/0/0 | 30/30/0/10/10 | 50/20/0/10/0 | 40/0/0/10/0 | 7.3 |
| Control · bien razonada cuidando la caja | sí | 0/0/0/0/0 | 0/0/0/0/0 | 100/0/0/0/0 | 100/100/0/0/0 | 100/0/0/0/0 | 0/0/0/0/0 | 13.3 |
| Control · bien razonada, personas y clientes primero | sí | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0 |
| Control · solo números, sin dejar indicadores bajo la línea | sí | 0/0/0/0/0 | 0/0/0/100/0 | 100/0/0/0/0 | 100/100/100/100/0 | 100/100/100/0/0 | 100/100/100/0/0 | 40 |
| Control · buen criterio con 25 % de errores al azar | sí | 16.7/0/0/16.7/0 | 16.7/16.7/16.7/16.7/0 | 33.3/0/0/0/16.7 | 66.7/0/0/0/16.7 | 100/16.7/0/66.7/0 | 66.7/0/0/0/0 | 16.1 |
| Control · buen criterio, pero deja vencer 25 % de los asuntos | sí | 0/0/0/0/0 | 0/16.7/0/0/0 | 100/0/0/0/0 | 83.3/33.3/16.7/16.7/0 | 100/66.7/0/33.3/0 | 33.3/16.7/0/16.7/0 | 17.8 |
| Control · siempre la segunda mejor razonada | sí | 0/0/0/0/0 | 0/0/0/0/0 | 100/100/100/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 0/0/0/0/0 | 10 |
