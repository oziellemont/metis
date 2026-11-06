# Simulación de cuatro variantes · causas exactas de reprobación

Generado con `AUD_SIM=1 npx vitest run src/lib/ceo/auditoria-efectos.test.ts`. Carrera continua de 5 meses por empresa, 11 estrategias, semillas fijas. Las mismas decisiones se juegan en las cuatro variantes. Ninguna variante está activa en la app.

Variantes: **V8 original** · **V8 sin multiplicador por etapa** · **V8 sin caja derivada del margen** · **V9 (ambos cambios)**.

Meses simulados por variante: 510.

## 1 · % de meses aprobados por variante y empresa (todas las estrategias)

| Variante | cumbre | forja | brasa | kubit | puntomadero | vertice | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| V8 original | 62.4 | 48.2 | 80 | 64.7 | 50.6 | 49.4 | 59.2 |
| V8 sin multiplicador por etapa | 64.7 | 49.4 | 80 | 68.2 | 50.6 | 50.6 | 60.6 |
| V8 sin caja derivada del margen | 36.5 | 20 | 72.9 | 44.7 | 49.4 | 47.1 | 45.1 |
| V9 (ambos cambios) | 38.8 | 21.2 | 75.3 | 45.9 | 49.4 | 49.4 | 46.7 |

## 2 · % de meses aprobados por estrategia

| Estrategia | Control | V8 original | V8 sin multiplicador por etapa | V8 sin caja derivada del margen | V9 (ambos cambios) |
|---|---|---:|---:|---:|---:|
| Director equilibrado: opciones defendibles cuidando el indicador más débil |  | 93.3 | 93.3 | 66.7 | 70 |
| Criterio y tablero: bien razonada y cuidando el encargo del consejo y la caja |  | 96.7 | 96.7 | 90 | 90 |
| Criterio contextual (rúbrica nueva): lo mejor razonado leyendo el tablero |  | 70 | 76.7 | 43.3 | 43.3 |
| Siempre la que el feedback felicita (criterio más alto) |  | 43.3 | 43.3 | 13.3 | 13.3 |
| Solo números: la de mejor efecto neto |  | 26.7 | 30 | 20 | 20 |
| Al azar |  | 5.6 | 5.6 | 3.3 | 3.3 |
| Control · bien razonada cuidando la caja | sí | 96.7 | 96.7 | 86.7 | 90 |
| Control · bien razonada, personas y clientes primero | sí | 36.7 | 36.7 | 20 | 23.3 |
| Control · buen criterio con 25 % de errores al azar | sí | 74.4 | 74.4 | 57.8 | 60 |
| Control · buen criterio, pero deja vencer 25 % de los asuntos | sí | 77.8 | 81.1 | 63.3 | 65.6 |
| Control · solo números, pero sin cruzar líneas rojas | sí | 70 | 73.3 | 53.3 | 56.7 |

## 3 · Causas de reprobación (un mes puede tener varias) · % de meses reprobados que la presentan

| Causa | V8 original | V8 sin multiplicador por etapa | V8 sin caja derivada del margen | V9 (ambos cambios) |
|---|---:|---:|---:|---:|
| Insolvencia (caja < 40) | 17.8 (37) | 17.4 (35) | 26.8 (75) | 24.3 (66) |
| Consejo perdido (< 40) | 0 (0) | 0 (0) | 0 (0) | 0 (0) |
| Línea roja | 47.6 (99) | 49.3 (99) | 35.7 (100) | 36.8 (100) |
| Objetivo del consejo bajo la línea | 52.9 (110) | 51.2 (103) | 55.4 (155) | 55.9 (152) |
| Indicador bajo el piso (40) | 6.7 (14) | 6.5 (13) | 5 (14) | 5.1 (14) |
| Salud < 58 | 9.1 (19) | 8 (16) | 10 (28) | 9.2 (25) |
| Criterio < 60 % | 28.8 (60) | 29.9 (60) | 20.7 (58) | 21.3 (58) |

## 4 · Indicador que provoca la reprobación (meses reprobados por negocio)

Atribución: caja bajo 40, consejo bajo 40, objetivo del consejo bajo la línea o cualquier indicador bajo el piso. Si un mes reprueba solo por salud o criterio, no se atribuye a un indicador.

| Variante | caja | margen | equipo | clientes | consejo | Solo salud/criterio |
|---|---:|---:|---:|---:|---:|---:|
| V8 original | 74 | 55 | 6 | 7 | 0 | 83 |
| V8 sin multiplicador por etapa | 66 | 54 | 5 | 7 | 0 | 86 |
| V8 sin caja derivada del margen | 153 | 53 | 5 | 8 | 0 | 77 |
| V9 (ambos cambios) | 146 | 53 | 5 | 8 | 0 | 77 |

## 5 · Por empresa y mes · % aprobado (V8 → V8 sin etapa → V8 sin caja-margen → V9)

| Empresa | Mes 1 | Mes 2 | Mes 3 | Mes 4 | Mes 5 |
|---|---|---|---|---|---|
| cumbre | 70.6 / 70.6 / 35.3 / 35.3 | 58.8 / 58.8 / 47.1 / 47.1 | 58.8 / 58.8 / 29.4 / 29.4 | 70.6 / 70.6 / 35.3 / 47.1 | 52.9 / 64.7 / 35.3 / 35.3 |
| forja | 70.6 / 70.6 / 52.9 / 52.9 | 47.1 / 47.1 / 11.8 / 11.8 | 23.5 / 23.5 / 11.8 / 11.8 | 47.1 / 47.1 / 11.8 / 17.6 | 52.9 / 58.8 / 11.8 / 11.8 |
| brasa | 82.4 / 82.4 / 76.5 / 76.5 | 82.4 / 82.4 / 82.4 / 82.4 | 70.6 / 70.6 / 64.7 / 64.7 | 82.4 / 82.4 / 70.6 / 70.6 | 82.4 / 82.4 / 70.6 / 82.4 |
| kubit | 76.5 / 76.5 / 70.6 / 70.6 | 70.6 / 70.6 / 41.2 / 41.2 | 64.7 / 64.7 / 41.2 / 41.2 | 52.9 / 64.7 / 41.2 / 41.2 | 58.8 / 64.7 / 29.4 / 35.3 |
| puntomadero | 47.1 / 47.1 / 47.1 / 47.1 | 52.9 / 52.9 / 52.9 / 52.9 | 47.1 / 47.1 / 47.1 / 47.1 | 52.9 / 52.9 / 52.9 / 52.9 | 52.9 / 52.9 / 47.1 / 47.1 |
| vertice | 52.9 / 52.9 / 52.9 / 52.9 | 52.9 / 52.9 / 47.1 / 47.1 | 47.1 / 47.1 / 47.1 / 47.1 | 41.2 / 47.1 / 41.2 / 47.1 | 52.9 / 52.9 / 47.1 / 52.9 |

## 6 · Causa principal por empresa y variante (meses reprobados)

| Empresa | V8 original | V8 sin multiplicador por etapa | V8 sin caja derivada del margen | V9 (ambos cambios) |
|---|---|---|---|---|
| cumbre | Criterio < 60 % 46.9 %; Línea roja 43.8 % | Criterio < 60 % 50 %; Línea roja 46.7 % | Insolvencia (caja < 40) 64.8 %; Criterio < 60 % 27.8 % | Insolvencia (caja < 40) 65.4 %; Criterio < 60 % 28.8 % |
| forja | Objetivo del consejo bajo la línea 77.3 %; Línea roja 36.4 % | Objetivo del consejo bajo la línea 72.1 %; Línea roja 37.2 % | Objetivo del consejo bajo la línea 89.7 %; Línea roja 25 % | Objetivo del consejo bajo la línea 89.6 %; Línea roja 25.4 % |
| brasa | Criterio < 60 % 58.8 %; Línea roja 52.9 % | Criterio < 60 % 58.8 %; Línea roja 52.9 % | Insolvencia (caja < 40) 39.1 %; Criterio < 60 % 39.1 % | Criterio < 60 % 42.9 %; Línea roja 38.1 % |
| kubit | Línea roja 56.7 %; Objetivo del consejo bajo la línea 46.7 % | Línea roja 63 %; Objetivo del consejo bajo la línea 40.7 % | Objetivo del consejo bajo la línea 72.3 %; Línea roja 38.3 % | Objetivo del consejo bajo la línea 69.6 %; Línea roja 39.1 % |
| puntomadero | Objetivo del consejo bajo la línea 61.9 %; Línea roja 47.6 % | Objetivo del consejo bajo la línea 61.9 %; Línea roja 47.6 % | Objetivo del consejo bajo la línea 60.5 %; Línea roja 46.5 % | Objetivo del consejo bajo la línea 60.5 %; Línea roja 46.5 % |
| vertice | Línea roja 53.5 %; Objetivo del consejo bajo la línea 51.2 % | Línea roja 54.8 %; Objetivo del consejo bajo la línea 50 % | Línea roja 51.1 %; Objetivo del consejo bajo la línea 48.9 % | Línea roja 53.5 %; Objetivo del consejo bajo la línea 48.8 % |

## 7 · Efecto aislado de cada cambio (mismas decisiones, mismo mes)

Para cada mes que aprueba en V8 y reprueba en otra variante (o al revés), qué causa nueva aparece.

| Variante | Meses que pierde | Meses que gana | Causas nuevas en los que pierde |
|---|---:|---:|---|
| V8 sin multiplicador por etapa | 0 | 7 | — |
| V8 sin caja derivada del margen | 75 | 3 | Objetivo del consejo bajo la línea (42); Insolvencia (caja < 40) (30); Salud < 58 (3); Línea roja (2) |
| V9 (ambos cambios) | 68 | 4 | Objetivo del consejo bajo la línea (41); Insolvencia (caja < 40) (27); Línea roja (2); Salud < 58 (1) |

Nota: a partir del mes 2 las trayectorias pueden separarse (si un mes reprueba, la empresa no cambia de etapa y la exigencia del mes siguiente es otra). Por eso la tabla 7 compara mes a mes y la tabla 5 muestra la evolución.

## 8 · Caja y salud promedio al cierre

| Variante | Caja | Margen | Salud | Caja que sumó el margen al cierre | Etapa promedio |
|---|---:|---:|---:|---:|---:|
| V8 original | 52.8 | 56.9 | 65.4 | 5.5 | 1 |
| V8 sin multiplicador por etapa | 53.3 | 56.9 | 65.5 | 5.6 | 1 |
| V8 sin caja derivada del margen | 47.4 | 57 | 64.4 | 0 | 1 |
| V9 (ambos cambios) | 47.7 | 57.1 | 64.5 | 0 | 1 |

## 9 · Detalle de los meses reprobados con buen criterio (V9)

Estrategias con criterio ≥ 60 % que reprueban en V9: dónde exactamente.

| Empresa | Estrategia | Mes | Etapa | Causas | Caja | Margen | Equipo | Clientes | Consejo |
|---|---|---:|---:|---|---:|---:|---:|---:|---:|
| cumbre | director_equilibrado | 1 | 0 | Insolvencia (caja < 40) | 39 | 68 | 100 | 70 | 89 |
| cumbre | director_equilibrado | 2 | 1 | Insolvencia (caja < 40) | 32 | 64 | 100 | 63 | 76 |
| cumbre | director_equilibrado | 3 | 1 | Insolvencia (caja < 40) | 33 | 64 | 94 | 63 | 78 |
| cumbre | criterio_y_tablero | 4 | 2 | Insolvencia (caja < 40) | 38 | 57 | 92 | 65 | 80 |
| cumbre | criterio_contextual | 1 | 0 | Insolvencia (caja < 40) | 37 | 68 | 100 | 70 | 93 |
| cumbre | criterio_contextual | 2 | 1 | Insolvencia (caja < 40) | 32 | 67 | 99 | 63 | 84 |
| cumbre | criterio_contextual | 3 | 1 | Insolvencia (caja < 40) | 27 | 63 | 100 | 61 | 82 |
| cumbre | criterio_contextual | 4 | 1 | Insolvencia (caja < 40) | 37 | 67 | 100 | 60 | 78 |
| cumbre | criterio_contextual | 5 | 1 | Insolvencia (caja < 40) | 33 | 62 | 100 | 60 | 79 |
| cumbre | mejor_score | 1 | 0 | Insolvencia (caja < 40) | 33 | 61 | 100 | 74 | 92 |
| cumbre | mejor_score | 2 | 1 | Insolvencia (caja < 40) | 29 | 62 | 100 | 63 | 82 |
| cumbre | mejor_score | 3 | 1 | Insolvencia (caja < 40) | 28 | 64 | 100 | 61 | 81 |
| cumbre | mejor_score | 4 | 1 | Insolvencia (caja < 40) | 35 | 68 | 100 | 55 | 81 |
| cumbre | mejor_score | 5 | 1 | Insolvencia (caja < 40) | 29 | 59 | 100 | 62 | 78 |
| cumbre | mejor_efecto | 1 | 0 | Insolvencia (caja < 40) | 39 | 63 | 100 | 76 | 92 |
| cumbre | mejor_efecto | 3 | 1 | Insolvencia (caja < 40) | 35 | 60 | 98 | 64 | 81 |
| cumbre | mejor_efecto | 5 | 2 | Insolvencia (caja < 40) | 38 | 53 | 98 | 63 | 80 |
| cumbre | personas_primero | 1 | 0 | Insolvencia (caja < 40) | 32 | 61 | 100 | 76 | 92 |
| cumbre | personas_primero | 2 | 1 | Insolvencia (caja < 40) | 24 | 58 | 100 | 69 | 81 |
| cumbre | personas_primero | 3 | 1 | Insolvencia (caja < 40) | 28 | 59 | 100 | 65 | 82 |
| cumbre | personas_primero | 4 | 1 | Insolvencia (caja < 40) | 35 | 66 | 100 | 58 | 81 |
| cumbre | personas_primero | 5 | 1 | Insolvencia (caja < 40) | 35 | 61 | 100 | 62 | 76 |
| cumbre | criterio_con_errores | 1 | 0 | Insolvencia (caja < 40) | 33 | 58 | 100 | 68 | 92 |
| cumbre | criterio_con_errores | 2 | 1 | Línea roja | 55 | 66 | 76 | 50 | 58 |
| cumbre | criterio_con_errores | 4 | 2 | Objetivo del consejo bajo la línea | 45 | 47 | 82 | 65 | 72 |
| cumbre | etica_flexible | 1 | 0 | Insolvencia (caja < 40) | 39 | 63 | 100 | 76 | 92 |
| cumbre | etica_flexible | 3 | 1 | Insolvencia (caja < 40) | 35 | 60 | 98 | 64 | 81 |
| cumbre | etica_flexible | 5 | 2 | Insolvencia (caja < 40) | 38 | 53 | 98 | 63 | 80 |
| forja | director_equilibrado | 2 | 1 | Objetivo del consejo bajo la línea | 47 | 54 | 85 | 72 | 75 |
| forja | director_equilibrado | 5 | 2 | Objetivo del consejo bajo la línea | 48 | 56 | 77 | 78 | 71 |
| forja | criterio_y_tablero | 2 | 1 | Objetivo del consejo bajo la línea | 49 | 64 | 75 | 68 | 86 |
| forja | criterio_y_tablero | 3 | 1 | Objetivo del consejo bajo la línea | 43 | 56 | 75 | 68 | 84 |
| forja | criterio_contextual | 2 | 1 | Objetivo del consejo bajo la línea | 47 | 55 | 89 | 70 | 81 |
| forja | criterio_contextual | 3 | 1 | Objetivo del consejo bajo la línea | 43 | 51 | 89 | 73 | 73 |
| forja | criterio_contextual | 4 | 1 | Objetivo del consejo bajo la línea | 41 | 55 | 88 | 70 | 84 |
| forja | criterio_contextual | 5 | 1 | Objetivo del consejo bajo la línea | 48 | 55 | 95 | 64 | 71 |
| forja | mejor_score | 1 | 0 | Objetivo del consejo bajo la línea | 48 | 50 | 100 | 77 | 75 |
| forja | mejor_score | 2 | 1 | Objetivo del consejo bajo la línea | 44 | 54 | 84 | 75 | 83 |
| forja | mejor_score | 3 | 1 | Insolvencia (caja < 40); Objetivo del consejo bajo la línea | 36 | 47 | 92 | 79 | 80 |
| forja | mejor_score | 4 | 1 | Insolvencia (caja < 40); Objetivo del consejo bajo la línea | 38 | 48 | 88 | 79 | 85 |
| forja | mejor_score | 5 | 1 | Objetivo del consejo bajo la línea | 44 | 51 | 90 | 74 | 79 |
| forja | mejor_efecto | 1 | 0 | Línea roja | 52 | 61 | 95 | 73 | 79 |
| forja | mejor_efecto | 2 | 1 | Línea roja; Objetivo del consejo bajo la línea | 42 | 59 | 81 | 77 | 88 |
| forja | mejor_efecto | 3 | 1 | Línea roja; Objetivo del consejo bajo la línea | 40 | 56 | 80 | 76 | 86 |
| forja | mejor_efecto | 4 | 1 | Línea roja | 52 | 66 | 76 | 67 | 84 |
| forja | mejor_efecto | 5 | 1 | Línea roja; Objetivo del consejo bajo la línea | 47 | 63 | 78 | 72 | 82 |
| forja | azar | 3 | 1 | Línea roja | 50 | 61 | 72 | 54 | 58 |
| forja | azar | 4 | 1 | Línea roja; Objetivo del consejo bajo la línea; Salud < 58 | 40 | 43 | 59 | 79 | 56 |
| forja | cuida_caja | 3 | 1 | Objetivo del consejo bajo la línea | 44 | 55 | 84 | 64 | 82 |
| forja | cuida_caja | 4 | 1 | Objetivo del consejo bajo la línea | 48 | 56 | 79 | 68 | 83 |
| forja | cuida_caja | 5 | 1 | Objetivo del consejo bajo la línea | 45 | 60 | 91 | 60 | 81 |
| forja | personas_primero | 1 | 0 | Objetivo del consejo bajo la línea | 47 | 50 | 100 | 77 | 74 |
| forja | personas_primero | 2 | 1 | Objetivo del consejo bajo la línea | 46 | 48 | 96 | 78 | 69 |
| forja | personas_primero | 3 | 1 | Objetivo del consejo bajo la línea | 40 | 42 | 95 | 83 | 71 |
| forja | personas_primero | 4 | 1 | Insolvencia (caja < 40); Objetivo del consejo bajo la línea | 37 | 48 | 91 | 79 | 84 |
| forja | personas_primero | 5 | 1 | Objetivo del consejo bajo la línea | 43 | 51 | 93 | 74 | 78 |
| forja | criterio_con_errores | 2 | 1 | Línea roja | 52 | 64 | 68 | 71 | 71 |
| forja | criterio_con_errores | 3 | 1 | Línea roja; Objetivo del consejo bajo la línea | 43 | 58 | 57 | 63 | 85 |
| forja | criterio_con_errores | 4 | 1 | Objetivo del consejo bajo la línea | 46 | 49 | 89 | 70 | 78 |
| forja | criterio_ocupado | 2 | 1 | Objetivo del consejo bajo la línea | 46 | 57 | 60 | 62 | 70 |
