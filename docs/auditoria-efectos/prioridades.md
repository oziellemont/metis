# Prioridades de la auditoría editorial de efectos

Generado con `AUD_PRIO=1 npx vitest run src/lib/ceo/auditoria-efectos.test.ts`. **No elimina ni cambia ningún efecto.** Ordena los caminos para que la revisión editorial empiece por los más problemáticos. Cada camino se valida a mano antes de proponer cambios.

Caminos: **2571** (1923 opciones y 648 vencimientos). Fijos: 555; banco: 2016.

Puntaje: 5 indicadores = 3, 4 indicadores = 2, Consejo sin evento = 3, Caja/Margen sin hecho = 3, beneficio pendiente cobrado = 3, vencimiento que castiga Consejo sin que se entere = 2, promesa que suma dinero = 2; señales menores = 1. **P1 ≥ 5**, **P2 3–4**, **P3 1–2**.

| Prioridad | cumbre | forja | brasa | kubit | puntomadero | vertice | Total | Fijos | Banco |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| P1 | 118 | 117 | 116 | 114 | 117 | 118 | 700 | 93 | 607 |
| P2 | 106 | 121 | 102 | 119 | 125 | 124 | 697 | 145 | 552 |
| P3 | 82 | 86 | 79 | 79 | 77 | 78 | 481 | 110 | 371 |
| OK | 140 | 109 | 120 | 113 | 106 | 105 | 693 | 207 | 486 |

Como el banco reutiliza el mismo arquetipo en las seis industrias, corregir un arquetipo corrige 18 caminos a la vez (6 industrias × 3 giros). Por eso el banco se revisa por arquetipo, no caso por caso:

| Arquetipo | Caminos | P1 | P2 | Motivo más frecuente |
|---|---:|---:|---:|---|
| meta | 72 | 72 | 0 | Consejo sin evento de gobernanza en el caso (72) |
| incidente | 72 | 63 | 9 | Consejo sin evento de gobernanza en el caso (60) |
| adquisicion | 72 | 45 | 9 | Consejo sin evento de gobernanza en el caso (45) |
| cliente | 72 | 38 | 16 | Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra (36) |
| ciberataque | 72 | 36 | 0 | Consejo sin evento de gobernanza en el caso (36) |
| error | 72 | 36 | 0 | Consejo sin evento de gobernanza en el caso (36) |
| guerra | 72 | 36 | 0 | Caja y Margen en el mismo sentido: confirmar que son dos hechos (54) |
| trimestre | 72 | 36 | 0 | Caja y Margen en el mismo sentido: confirmar que son dos hechos (36) |
| prensa | 72 | 36 | 18 | Consejo: el caso lo menciona pero esta opción no le informa ni le afecta (36) |
| verde | 72 | 28 | 8 | Consejo sin evento de gobernanza en el caso (24) |
| retiro | 72 | 24 | 42 | Consejo sin evento de gobernanza en el caso (36) |
| regulador | 72 | 24 | 48 | Consejo: el caso lo menciona pero esta opción no le informa ni le afecta (48) |
| expansion | 72 | 22 | 32 | Consejo: el caso lo menciona pero esta opción no le informa ni le afecta (48) |
| precio | 72 | 18 | 36 | Consejo sin evento de gobernanza en el caso (36) |
| recorte | 72 | 18 | 33 | Promesa o plan que suma dinero de inmediato (36) |
| proveedor | 72 | 18 | 18 | Caja y Margen en el mismo sentido: confirmar que son dos hechos (54) |
| incentivos | 72 | 16 | 38 | Consejo: el caso lo menciona pero esta opción no le informa ni le afecta (20) |
| salarios | 72 | 12 | 42 | Caja y Margen en el mismo sentido: confirmar que son dos hechos (54) |
| deuda | 72 | 12 | 30 | Consejo: el caso lo menciona pero esta opción no le informa ni le afecta (36) |
| apuesta | 72 | 9 | 45 | Consejo: el caso lo menciona pero esta opción no le informa ni le afecta (45) |
| adaptativo | 72 | 8 | 18 | Consejo: el caso lo menciona pero esta opción no le informa ni le afecta (20) |
| foco | 72 | 0 | 54 | Caja y Margen en el mismo sentido: confirmar que son dos hechos (54) |
| mando | 72 | 0 | 0 | Caja y Margen en el mismo sentido: confirmar que son dos hechos (18) |
| sucesor | 72 | 0 | 20 | Caja y Margen en el mismo sentido: confirmar que son dos hechos (18) |
| inversion | 72 | 0 | 0 | Promesa o plan que suma dinero de inmediato (18) |
| capital | 72 | 0 | 18 | Consejo: el caso lo menciona pero esta opción no le informa ni le afecta (36) |
| region | 72 | 0 | 18 | Caja y Margen en el mismo sentido: confirmar que son dos hechos (36) |
| alianza | 72 | 0 | 0 | Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra (18) |

## Motivos (todas las empresas)

| Motivo | Caminos |
|---|---:|
| N indicadores a la vez | 1162 |
| Consejo sin evento de gobernanza en el caso | 740 |
| Caja y Margen en el mismo sentido: confirmar que son dos hechos | 698 |
| Consejo: el caso lo menciona pero esta opción no le informa ni le afecta | 459 |
| Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra | 328 |
| Vencimiento castiga Consejo sin que el consejo se entere | 223 |
| Promesa o plan que suma dinero de inmediato | 187 |
| Caja/Margen sin hecho económico en el caso | 48 |
| Vencimiento muy severo  | 44 |
| Movimiento ≥ 8 puntos: revisar materialidad | 30 |
| Cobra al decidir un beneficio que depende de respuesta | 1 |

## P1 de asuntos fijos por empresa (los diez de más puntaje)

### Botanas Cumbre (12 P1 fijos)

| Asunto / camino | Efectos | Motivos |
|---|---|---|
| d2-supernorte / (vencido) | caja -8, margen -9, consejo -4 | Consejo sin evento de gobernanza en el caso · Vencimiento castiga Consejo sin que el consejo se entere · Vencimiento muy severo (neto -21) · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra · Caja y Margen en el mismo sentido: confirmar que son dos hechos · Movimiento ≥ 8 puntos: revisar materialidad |
| d2-supernorte / b | caja -1, margen -2, clientes +2, consejo +3 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| d4-sindicato / c | caja +1, margen +3, equipo -8, consejo -1 | 4 indicadores a la vez · Consejo: el caso lo menciona pero esta opción no le informa ni le afecta · Caja y Margen en el mismo sentido: confirmar que son dos hechos · Movimiento ≥ 8 puntos: revisar materialidad · Promesa o plan que suma dinero de inmediato |
| c-planta-accidente / (vencido) | caja -3, equipo -10, consejo -4 | Consejo sin evento de gobernanza en el caso · Vencimiento castiga Consejo sin que el consejo se entere · Vencimiento muy severo (neto -17) · Movimiento ≥ 8 puntos: revisar materialidad |
| d4-objetivos / (vencido) | margen -4, consejo -2 | Consejo sin evento de gobernanza en el caso · Vencimiento castiga Consejo sin que el consejo se entere · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra |
| c-piloto / a | caja -3, margen +4, clientes +3, consejo +4 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra |
| d3-planta / c | caja -2, equipo +3, clientes -1, consejo -1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| d3-diego / a | caja -9, equipo +2, consejo +3 | Consejo sin evento de gobernanza en el caso · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra · Movimiento ≥ 8 puntos: revisar materialidad |
| d3-diego / (vencido) | consejo -4 | Consejo sin evento de gobernanza en el caso · Vencimiento castiga Consejo sin que el consejo se entere |
| d4-sindicato / (vencido) | equipo -9, consejo -3 | Consejo: el caso lo menciona pero esta opción no le informa ni le afecta · Vencimiento castiga Consejo sin que el consejo se entere · Vencimiento muy severo (neto -12) · Movimiento ≥ 8 puntos: revisar materialidad |

### Forja Norte (22 P1 fijos)

| Asunto / camino | Efectos | Motivos |
|---|---|---|
| fn-d2-precio / (vencido) | margen -8, clientes -1, consejo -4 | Consejo sin evento de gobernanza en el caso · Vencimiento castiga Consejo sin que el consejo se entere · Vencimiento muy severo (neto -13) · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra · Movimiento ≥ 8 puntos: revisar materialidad |
| fn-d2-precio / c | caja -1, margen -2, equipo -2, clientes +2, consejo +1 | 5 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| fn-d1-andon / a | margen -3, equipo +3, clientes +3, consejo -1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra |
| fn-d1-andon / c | margen -1, equipo +2, clientes +1, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra |
| fn-d4-pleito / b | margen +3, equipo -3, clientes -3, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra |
| fn-d5-plataforma / a | caja -5, margen -4, clientes +6, consejo +2 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| fn-d6-denuncia / b | margen +1, equipo -6, consejo -2 | Consejo sin evento de gobernanza en el caso · Caja/Margen sin hecho económico en el caso |
| fn-d6-denuncia / c | caja -3, equipo +3, consejo -3 | Consejo sin evento de gobernanza en el caso · Caja/Margen sin hecho económico en el caso |
| fn-c-inv-factoraje / a | caja -1, margen -1, clientes +1, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| fn-s-precio-mas / c | caja +1, margen +2, clientes -6, consejo -1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |

### Grupo Brasa (12 P1 fijos)

| Asunto / camino | Efectos | Motivos |
|---|---|---|
| gb-d3-brote / (vencido) | caja -3, clientes -8, consejo -4 | Consejo sin evento de gobernanza en el caso · Vencimiento castiga Consejo sin que el consejo se entere · Vencimiento muy severo (neto -15) · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra · Movimiento ≥ 8 puntos: revisar materialidad |
| gb-d3-brote / a | caja -4, margen -2, equipo +1, clientes +3, consejo +1 | 5 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| gb-d2-menu / c | caja -4, margen +3, equipo -3, clientes -3, consejo +1 | 5 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| gb-d5-cdmx / c | caja -8, margen +5, equipo -3, consejo -3 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Movimiento ≥ 8 puntos: revisar materialidad |
| gb-d2-menu / a | margen +5, equipo +2, clientes -2, consejo -2 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| gb-d2-menu / b | margen +2, equipo +2, clientes -1, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| gb-d4-carne / b | caja -1, margen +2, equipo +1, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| gb-d5-cdmx / a | caja -5, margen +4, equipo -2, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| gb-d6-dark / (vencido) | consejo -1 | Consejo sin evento de gobernanza en el caso · Vencimiento castiga Consejo sin que el consejo se entere |
| gb-d6-sucesion / (vencido) | consejo -4 | Consejo sin evento de gobernanza en el caso · Vencimiento castiga Consejo sin que el consejo se entere |

### Kúbit (13 P1 fijos)

| Asunto / camino | Efectos | Motivos |
|---|---|---|
| kb-d2-altamar / c | caja -1, margen -2, equipo -2, clientes +2, consejo +1 | 5 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| kb-d1-guardia / a | margen -3, equipo +3, clientes +3, consejo -1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra |
| kb-c-caida / c | caja +1, margen +2, clientes -7, consejo -2 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| kb-c-mejora / a | caja -1, margen -1, equipo +5, clientes +3 | 4 indicadores a la vez · Caja/Margen sin hecho económico en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| kb-d1-guardia / b | margen +3, equipo -3, clientes -1, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| kb-d1-guardia / c | margen -1, equipo +2, clientes +1, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| kb-d2-altamar / (vencido) | clientes -6, consejo -3 | Consejo sin evento de gobernanza en el caso · Vencimiento castiga Consejo sin que el consejo se entere |
| kb-d2-fuga / b | caja -2, equipo +2, clientes -2, consejo -1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| kb-d5-banco / a | caja -3, equipo +3, clientes +1, consejo -1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| kb-d6-denuncia / (vencido) | equipo -6, consejo -2 | Consejo sin evento de gobernanza en el caso · Vencimiento castiga Consejo sin que el consejo se entere |

### Punto Madero (16 P1 fijos)

| Asunto / camino | Efectos | Motivos |
|---|---|---|
| pm-c-temp-compras / a | caja -1, margen +1, equipo +1, clientes +1, consejo -1 | 5 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Promesa o plan que suma dinero de inmediato |
| pm-d2-penasco / c | caja -1, margen -2, equipo -2, clientes +2, consejo +1 | 5 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| pm-c-temp-guerra / a | margen +1, equipo +1, clientes -1, consejo -1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Promesa o plan que suma dinero de inmediato |
| pm-d1-piso / a | margen -3, equipo +3, clientes +3, consejo -1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra |
| pm-c-tarima / c | caja +1, margen +2, clientes -7, consejo -2 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| pm-s-penasco-mas / c | caja +2, margen +1, clientes -6, consejo -1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| pm-s-penasco-obras / a | caja -1, margen -1, clientes +3, consejo +2 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| pm-d1-piso / b | margen +3, equipo -3, clientes -1, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| pm-d1-piso / c | margen -1, equipo +2, clientes +1, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| pm-d2-penasco / (vencido) | clientes -6, consejo -3 | Consejo sin evento de gobernanza en el caso · Vencimiento castiga Consejo sin que el consejo se entere |

### Vértice Logística (18 P1 fijos)

| Asunto / camino | Efectos | Motivos |
|---|---|---|
| vl-c-frenos / c | caja +1, margen +2, clientes -7, consejo -2 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| vl-d1-patio / a | margen -3, equipo +3, clientes +3, consejo -1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra |
| vl-d6-denuncia / b | margen +1, equipo -6, consejo -2 | Consejo sin evento de gobernanza en el caso · Caja/Margen sin hecho económico en el caso |
| vl-d2-diesel / b | caja +1, margen +3, clientes -3, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| vl-s-almena-mas / b | caja -2, margen -7, clientes +4, consejo -3 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| vl-s-almena-mas / c | caja +1, margen +2, clientes -6, consejo -1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso · Caja y Margen en el mismo sentido: confirmar que son dos hechos |
| vl-s-almena-cedis / c | caja +2, clientes -5, consejo -1 | Consejo sin evento de gobernanza en el caso · Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra · Promesa o plan que suma dinero de inmediato |
| vl-d1-patio / b | margen +3, equipo -3, clientes -1, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| vl-d1-patio / c | margen -1, equipo +2, clientes +1, consejo +1 | 4 indicadores a la vez · Consejo sin evento de gobernanza en el caso |
| vl-d2-almena / (vencido) | clientes -6, consejo -3 | Consejo sin evento de gobernanza en el caso · Vencimiento castiga Consejo sin que el consejo se entere |

