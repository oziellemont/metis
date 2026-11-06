# Simulación · reglas v8 (vigentes) frente a v9 (propuesta, no activa)

Generado con `AUD_REPORT=1 npx vitest run src/lib/ceo/auditoria-indicadores.test.ts`. Semillas fijas: reproducible.

Carrera continua, 3 meses por empresa, mismas decisiones en ambas versiones. v9 quita dos cosas: el multiplicador de exigencia por etapa y la caja que se fabricaba desde el índice de margen al cierre. No cambia umbrales, rúbrica ni líneas rojas. Las estrategias marcadas «control» no se usaron para calibrar.

## 1 · % de meses aprobados (v8 → v9)

| Estrategia | Control | cumbre | forja | brasa | kubit | puntomadero | vertice | Promedio v8 | Promedio v9 |
|---|---|---|---|---|---|---|---|---|---|
| Director equilibrado: opciones defendibles cuidando el indicador más débil |  | 100 → 0 | 100 → 66.7 | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 100 | 77.8 |
| Criterio y tablero: bien razonada y cuidando el encargo del consejo y la caja |  | 100 → 100 | 66.7 → 33.3 | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 94.5 | 88.9 |
| Criterio contextual (rúbrica nueva): lo mejor razonado leyendo el tablero |  | 66.7 → 0 | 66.7 → 33.3 | 100 → 100 | 100 → 33.3 | 100 → 100 | 66.7 → 66.7 | 83.4 | 55.6 |
| Siempre la que el feedback felicita (criterio más alto) |  | 33.3 → 0 | 33.3 → 0 | 100 → 33.3 | 66.7 → 33.3 | 33.3 → 33.3 | 33.3 → 0 | 50 | 16.7 |
| Solo números: la de mejor efecto neto |  | 100 → 33.3 | 0 → 0 | 100 → 100 | 0 → 0 | 0 → 0 | 0 → 0 | 33.3 | 22.2 |
| Al azar |  | 8.3 → 8.3 | 0 → 0 | 25 → 25 | 25 → 16.7 | 8.3 → 8.3 | 8.3 → 8.3 | 12.5 | 11.1 |
| Control · bien razonada cuidando la caja | sí | 100 → 100 | 66.7 → 66.7 | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 94.5 | 94.5 |
| Control · bien razonada, personas y clientes primero | sí | 33.3 → 0 | 0 → 0 | 66.7 → 66.7 | 66.7 → 33.3 | 0 → 0 | 0 → 0 | 27.8 | 16.7 |
| Control · solo números, sin dejar indicadores bajo la línea | sí | 66.7 → 66.7 | 0 → 0 | 100 → 100 | 0 → 0 | 0 → 0 | 0 → 0 | 27.8 | 27.8 |
| Control · buen criterio con 25 % de errores al azar | sí | 83.3 → 58.3 | 66.7 → 25 | 100 → 100 | 75 → 66.7 | 83.3 → 83.3 | 75 → 83.3 | 80.6 | 69.4 |
| Control · buen criterio, pero deja vencer 25 % de los asuntos | sí | 66.7 → 66.7 | 66.7 → 33.3 | 100 → 100 | 91.7 → 83.3 | 91.7 → 91.7 | 83.3 → 83.3 | 83.4 | 76.4 |
| Control · solo números, pero sin cruzar líneas rojas | sí | 100 → 33.3 | 66.7 → 33.3 | 100 → 100 | 100 → 100 | 33.3 → 33.3 | 100 → 100 | 83.3 | 66.7 |
| No contesta nada |  | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 | 0 |

## 2 · Caja al cierre y caja fabricada desde el margen (promedio por mes)

| Estrategia | Caja v8 | Caja v9 | Caja que v8 sumaba desde el margen | Salud v8 | Salud v9 |
|---|---|---|---|---|---|
| Director equilibrado: opciones defendibles cuidando el indicador más débil | 54.2 | 46.9 | 7.4 | 68.3 | 66.8 |
| Criterio y tablero: bien razonada y cuidando el encargo del consejo y la caja | 58.9 | 51.9 | 7.1 | 68 | 66.6 |
| Criterio contextual (rúbrica nueva): lo mejor razonado leyendo el tablero | 50.3 | 43.9 | 6.4 | 68.7 | 67.5 |
| Siempre la que el feedback felicita (criterio más alto) | 44.6 | 40.6 | 4 | 68.7 | 67.8 |
| Solo números: la de mejor efecto neto | 58.3 | 52 | 6.3 | 70.4 | 69.1 |
| Al azar | 51.2 | 47.4 | 4 | 60 | 59.4 |
| Control · bien razonada cuidando la caja | 58.7 | 51.4 | 7.3 | 68.1 | 66.6 |
| Control · bien razonada, personas y clientes primero | 42.2 | 40.9 | 1.3 | 67.5 | 67.2 |
| Control · solo números, sin dejar indicadores bajo la línea | 60.2 | 55.2 | 5.7 | 69 | 67.7 |
| Control · buen criterio con 25 % de errores al azar | 55.7 | 49.5 | 6.3 | 65.8 | 64.6 |
| Control · buen criterio, pero deja vencer 25 % de los asuntos | 57.4 | 50.3 | 7.1 | 65.4 | 64 |
| Control · solo números, pero sin cruzar líneas rojas | 56.9 | 51.3 | 5.6 | 70.3 | 69.2 |
| No contesta nada | 50.7 | 50.7 | 0 | 38.3 | 38.3 |

## 3 · Lectura

Cambio en la tasa de aprobación al pasar a v9. Estrategias con buen criterio: Director equilibrado: opciones defendibles cuidando el indicador más débil: -22.2 pts; Criterio y tablero: bien razonada y cuidando el encargo del consejo y la caja: -5.6 pts; Control · bien razonada cuidando la caja: +0 pts. Estrategias sin criterio: Solo números: la de mejor efecto neto: -11.1 pts; Al azar: -1.4 pts; No contesta nada: +0 pts.

Sin la caja «regalada» por el margen, la caja al cierre baja en todas las estrategias. Por eso v9 no se activa sola: hay que decidir con el fundador si se recalibra la caja inicial o los umbrales del consejo (fase de recalibración) antes de publicarla para periodos nuevos. Los periodos v8 nunca se recalifican.

