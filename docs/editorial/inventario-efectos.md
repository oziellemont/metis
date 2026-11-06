# Inventario de efectos · alertas de causalidad (fase A)

Generado por código con `AUD_REPORT=1 npx vitest run src/lib/ceo/auditoria-indicadores.test.ts`. Lee el contenido en reglas v8 (asuntos fijos y banco de casos). No cambia ningún efecto: marca dónde revisar.

Total de caminos revisados: **2571** (1923 opciones y 648 vencimientos) en 6 empresas. Con al menos una alerta: **1534**.

Las alertas son heurísticas (buscan palabras en el texto del caso). Una alerta no significa que el efecto esté mal; significa que el texto no muestra la causa y conviene revisarlo en la reescritura editorial.

## 1 · Alertas por tipo y empresa

| Alerta | Qué revisa | cumbre | forja | brasa | kubit | puntomadero | vertice | Total |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `consejo_sin_evento` | Mueve Consejo sin que el consejo o los inversionistas aparezcan en el caso. | 120 | 121 | 117 | 119 | 135 | 133 | 745 |
| `dinero_sin_hecho` | Mueve Caja o Margen sin un hecho económico en el texto (pago, cobro, costo, venta). | 39 | 42 | 34 | 20 | 9 | 45 | 189 |
| `promesa_cobrada` | Suma Caja o Margen al decidir aunque el beneficio depende de una respuesta pendiente. | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| `impacto_multiple` | Mueve 4 o más indicadores a la vez: cada uno necesita su propia razón. | 181 | 203 | 184 | 195 | 199 | 200 | 1162 |
| `golpe_grande` | Movimiento de 8 o más puntos: revisar materialidad. | 11 | 5 | 2 | 4 | 4 | 4 | 30 |
| `doble_conteo` | Caja y Margen se mueven en el mismo sentido por el mismo hecho: posible doble conteo. | 32 | 32 | 33 | 31 | 31 | 32 | 191 |
| `vencido_castiga_consejo` | Dejar vencer resta Consejo aunque el consejo no se entera en la historia. | 21 | 17 | 18 | 20 | 20 | 21 | 117 |

## 2 · Detalle (asuntos fijos)

### Botanas Cumbre

| Asunto / opción | Efectos | Alertas |
|---|---|---|
| d1-bienvenida / c | caja +1, margen +3, equipo -3, clientes -1 | impacto_multiple |
| d1-hector / b | margen +3, equipo -2, consejo +1 | consejo_sin_evento |
| d1-hector / c | caja +1, margen +2, equipo -5, clientes -1 | impacto_multiple |
| d2-supernorte / a | caja -6, margen -8, clientes +4 | golpe_grande, doble_conteo |
| d2-supernorte / b | caja -1, margen -2, clientes +2, consejo +3 | consejo_sin_evento, impacto_multiple |
| d2-supernorte / c | margen +3, clientes -8, consejo -2 | consejo_sin_evento, golpe_grande |
| d2-supernorte / (vencido) | caja -8, margen -9, consejo -4 | consejo_sin_evento, golpe_grande, doble_conteo, vencido_castiga_consejo |
| c-hector-aliado / a | margen -2, equipo +4, clientes +4 | dinero_sin_hecho |
| d3-planta / a | caja -3, equipo +8, clientes -2 | golpe_grande |
| d3-planta / b | caja +1, equipo -6, clientes +2 | dinero_sin_hecho |
| d3-planta / c | caja -2, equipo +3, clientes -1, consejo -1 | consejo_sin_evento, dinero_sin_hecho, impacto_multiple |
| d3-diego / a | caja -9, equipo +2, consejo +3 | consejo_sin_evento, golpe_grande |
| d3-diego / b | caja -2, equipo +3, consejo +1 | consejo_sin_evento |
| d3-diego / c | caja +1, equipo -2, consejo -5 | consejo_sin_evento |
| d3-diego / (vencido) | consejo -4 | consejo_sin_evento, vencido_castiga_consejo |
| c-hector-renuncia / (vencido) | equipo -6, clientes -10 | golpe_grande |
| d4-objetivos / b | margen -4, equipo +3, consejo -1 | consejo_sin_evento |
| d4-objetivos / (vencido) | margen -4, consejo -2 | consejo_sin_evento, vencido_castiga_consejo |
| d4-sindicato / b | margen -7, equipo +8, consejo -4 | golpe_grande |
| d4-sindicato / c | caja +1, margen +3, equipo -8, consejo -1 | impacto_multiple, golpe_grande |
| d4-sindicato / (vencido) | equipo -9, consejo -3 | golpe_grande |
| c-supernorte-castigo / a | margen -2, clientes +3, consejo +1 | consejo_sin_evento |
| d5-credito / a | caja -2, margen +4, equipo -3, consejo -1 | impacto_multiple |
| d5-credito / b | caja -4, margen +1, equipo +3, consejo +3 | impacto_multiple |
| c-planta-accidente / a | caja -3, equipo +4, consejo -2 | consejo_sin_evento |
| c-planta-accidente / b | caja +2, equipo -8, consejo -3 | consejo_sin_evento, golpe_grande |
| c-planta-accidente / (vencido) | caja -3, equipo -10, consejo -4 | consejo_sin_evento, golpe_grande, vencido_castiga_consejo |
| d6-gastos / b | margen +2, equipo -6, clientes +1, consejo -2 | impacto_multiple |
| d6-clima / c | equipo +3, consejo -3 | consejo_sin_evento |
| c-piloto / a | caja -3, margen +4, clientes +3, consejo +4 | consejo_sin_evento, impacto_multiple |
| c-piloto / b | caja -2, margen +2, equipo +2, consejo -1 | consejo_sin_evento, impacto_multiple |
| c-piloto / (vencido) | equipo -2, consejo -2 | consejo_sin_evento, vencido_castiga_consejo |

### Forja Norte

| Asunto / opción | Efectos | Alertas |
|---|---|---|
| fn-d1-carta / b | margen +3, equipo -6, clientes -1, consejo +6 | impacto_multiple |
| fn-d1-andon / a | margen -3, equipo +3, clientes +3, consejo -1 | consejo_sin_evento, impacto_multiple |
| fn-d1-andon / b | margen +3, equipo -3, clientes -1, consejo +1 | consejo_sin_evento, impacto_multiple |
| fn-d1-andon / c | margen -1, equipo +2, clientes +1, consejo +1 | consejo_sin_evento, impacto_multiple |
| fn-d2-precio / a | margen -8, clientes +5, consejo -3 | consejo_sin_evento, golpe_grande |
| fn-d2-precio / b | margen +3, clientes -5, consejo +2 | consejo_sin_evento |
| fn-d2-precio / c | caja -1, margen -2, equipo -2, clientes +2, consejo +1 | consejo_sin_evento, impacto_multiple |
| fn-d2-precio / (vencido) | margen -8, clientes -1, consejo -4 | consejo_sin_evento, golpe_grande, vencido_castiga_consejo |
| fn-d2-soldadores / a | caja -4, margen -2, equipo +5 | doble_conteo |
| fn-d2-soldadores / b | caja -2, equipo +2, clientes -2, consejo -1 | consejo_sin_evento, impacto_multiple |
| fn-d2-soldadores / c | caja -1, margen +3, equipo -5, consejo +3 | impacto_multiple |
| fn-c-escape / a | caja -3, margen -2, equipo +3, clientes +3 | impacto_multiple |
| fn-c-escape / c | margen +1, clientes -7, consejo -2 | consejo_sin_evento |
| fn-d3-ppap / a | margen -1, equipo +3, clientes -4, consejo -2 | impacto_multiple |
| fn-d3-ppap / c | caja -2, margen -3, equipo +2, clientes +1 | impacto_multiple |
| fn-c-kaizen / a | caja -1, margen -1, equipo +5, clientes +3 | impacto_multiple |
| fn-d4-recap / c | caja +1, equipo +1, clientes +2, consejo -6 | impacto_multiple |
| fn-d4-pleito / a | margen -1, equipo +4, clientes +1, consejo -1 | impacto_multiple |
| fn-d4-pleito / b | margen +3, equipo -3, clientes -3, consejo +1 | consejo_sin_evento, dinero_sin_hecho, impacto_multiple |
| fn-d4-pleito / c | margen -2, equipo -3, clientes +3 | dinero_sin_hecho |
| fn-d5-ciber / a | caja -2, equipo -2, clientes -3, consejo +2 | consejo_sin_evento, impacto_multiple |
| fn-d5-ciber / c | caja -4, margen -1, clientes -1, consejo +4 | impacto_multiple |
| fn-d5-ciber / (vencido) | caja -3, clientes -8, consejo -5 | golpe_grande |
| fn-d5-plataforma / a | caja -5, margen -4, clientes +6, consejo +2 | consejo_sin_evento, impacto_multiple, doble_conteo |
| fn-d5-plataforma / b | caja +1, margen +2, clientes -4, consejo -3 | impacto_multiple |
| fn-d5-plataforma / c | caja -1, margen +1, clientes +2, consejo -2 | impacto_multiple |
| fn-d5-plataforma / (vencido) | margen -4, consejo -3 | consejo_sin_evento, vencido_castiga_consejo |
| fn-d6-proveedor / a | caja -5, clientes +3, consejo -1 | consejo_sin_evento |
| fn-d6-proveedor / b | caja +1, margen -5, clientes -2, consejo +1 | consejo_sin_evento, impacto_multiple |
| fn-d6-proveedor / c | caja -8, margen +2, equipo -1, consejo +3 | impacto_multiple, golpe_grande |
| fn-d6-proveedor / (vencido) | margen -3, clientes -8 | golpe_grande |
| fn-d6-denuncia / a | margen -2, equipo +4, consejo +1 | consejo_sin_evento |
| fn-d6-denuncia / b | margen +1, equipo -6, consejo -2 | consejo_sin_evento, dinero_sin_hecho |
| fn-d6-denuncia / c | caja -3, equipo +3, consejo -3 | consejo_sin_evento, dinero_sin_hecho |
| fn-d6-denuncia / (vencido) | equipo -6, consejo -2 | consejo_sin_evento, vencido_castiga_consejo |
| fn-c-escuela / b | margen -1, equipo -2, clientes +2 | dinero_sin_hecho |
| fn-d7-consejo / b | margen +2, equipo -7, clientes -2, consejo +6 | impacto_multiple |
| fn-d7-consejo / c | caja -1, margen -2, equipo +5, consejo -5 | impacto_multiple |
| fn-d2-inventario / a | caja +2, margen -1, equipo +2, consejo -1 | impacto_multiple |
| fn-d2-inventario / b | caja +4, equipo -1, clientes -2, consejo +1 | impacto_multiple |
| fn-c-inv-lineas / a | caja +3, margen -1, equipo -2, consejo +1 | consejo_sin_evento, impacto_multiple |
| fn-c-inv-faltante / (vencido) | caja -4, clientes -4 | dinero_sin_hecho |
| fn-c-inv-factoraje / a | caja -1, margen -1, clientes +1, consejo +1 | consejo_sin_evento, impacto_multiple |
| fn-c-inv-factoraje / b | caja -1, margen +1, clientes +1, consejo -1 | consejo_sin_evento, impacto_multiple |
| fn-c-inv-factoraje / (vencido) | clientes -3, consejo -1 | consejo_sin_evento, vencido_castiga_consejo |
| fn-c8-greg / a | caja -2, equipo +1, clientes +2, consejo -1 | impacto_multiple |
| fn-c8-greg / b | margen -2, consejo +1 | consejo_sin_evento |
| fn-c8-greg / c | caja +1, clientes -2, consejo +1 | consejo_sin_evento |
| fn-c8-consejo / c | caja -2, equipo +1, clientes +1, consejo -1 | impacto_multiple |
| fn-s-precio-mas / b | margen -7, clientes +4, consejo -3 | consejo_sin_evento |
| fn-s-precio-mas / c | caja +1, margen +2, clientes -6, consejo -1 | consejo_sin_evento, impacto_multiple |
| fn-s-precio-mas / (vencido) | clientes -4, consejo -2 | consejo_sin_evento, vencido_castiga_consejo |
| fn-s-precio-rfq / a | caja -2, margen -1, clientes +2, consejo +2 | consejo_sin_evento, impacto_multiple |
| fn-s-precio-rfq / b | margen -6, clientes +4, consejo -2 | consejo_sin_evento |
| fn-s-precio-rfq / c | margen +2, clientes -5, consejo -1 | consejo_sin_evento |
| fn-s-precio-rfq / (vencido) | clientes -6, consejo -3 | consejo_sin_evento, vencido_castiga_consejo |

### Grupo Brasa

| Asunto / opción | Efectos | Alertas |
|---|---|---|
| gb-d1-carta / b | caja +2, margen +5, equipo -6 | doble_conteo |
| gb-d1-app / b | caja -3, margen +2, clientes -2, consejo +1 | impacto_multiple |
| gb-d2-menu / a | margen +5, equipo +2, clientes -2, consejo -2 | consejo_sin_evento, impacto_multiple |
| gb-d2-menu / b | margen +2, equipo +2, clientes -1, consejo +1 | consejo_sin_evento, impacto_multiple |
| gb-d2-menu / c | caja -4, margen +3, equipo -3, clientes -3, consejo +1 | consejo_sin_evento, impacto_multiple |
| gb-d2-propinas / b | margen +3, equipo -4, clientes -2 | dinero_sin_hecho |
| gb-d2-propinas / c | caja -2, margen -5, equipo +6 | doble_conteo |
| gb-d3-brote / a | caja -4, margen -2, equipo +1, clientes +3, consejo +1 | consejo_sin_evento, impacto_multiple, doble_conteo |
| gb-d3-brote / b | caja +1, clientes -6, consejo -2 | consejo_sin_evento |
| gb-d3-brote / c | caja -2, clientes -3, consejo +1 | consejo_sin_evento, dinero_sin_hecho |
| gb-d3-brote / (vencido) | caja -3, clientes -8, consejo -4 | consejo_sin_evento, dinero_sin_hecho, golpe_grande, vencido_castiga_consejo |
| gb-d3-franquicia / a | caja +6, equipo -2, clientes -4, consejo +2 | impacto_multiple |
| gb-d4-carne / b | caja -1, margen +2, equipo +1, consejo +1 | consejo_sin_evento, impacto_multiple |
| gb-d4-carne / c | margen -6, clientes +2, consejo -2 | consejo_sin_evento |
| gb-d4-gerente / a | margen -1, equipo +4, consejo +1 | consejo_sin_evento |
| gb-d5-cdmx / a | caja -5, margen +4, equipo -2, consejo +1 | consejo_sin_evento, impacto_multiple |
| gb-d5-cdmx / b | caja -4, equipo +2, consejo -2 | consejo_sin_evento |
| gb-d5-cdmx / c | caja -8, margen +5, equipo -3, consejo -3 | consejo_sin_evento, impacto_multiple, golpe_grande |
| gb-c-franquicia-mala / a | caja -2, clientes +2, consejo +1 | consejo_sin_evento |
| gb-d6-dark / b | caja -2, margen +2, equipo -3, clientes -2 | impacto_multiple |
| gb-d6-dark / c | equipo +1, consejo -1 | consejo_sin_evento |
| gb-d6-dark / (vencido) | consejo -1 | consejo_sin_evento, vencido_castiga_consejo |
| gb-d6-sucesion / (vencido) | consejo -4 | consejo_sin_evento, vencido_castiga_consejo |
| gb-d7-consejo / a | caja -2, margen +2, equipo +1, consejo +4 | impacto_multiple |
| gb-d7-consejo / b | caja +1, equipo -2, consejo +2 | dinero_sin_hecho |
| gb-c-prov-piloto / a | caja -1, margen +2, equipo -1, clientes +1 | impacto_multiple |
| gb-c-prov-contrato / b | caja -3, margen +2, consejo +1 | consejo_sin_evento |
| gb-c-prov-contrato / c | caja +1, margen -1, consejo -1 | consejo_sin_evento |
| gb-c-prov-contrato / (vencido) | margen -1, consejo -1 | consejo_sin_evento, vencido_castiga_consejo |
| gb-s-app-renueva / c | caja -4, margen +1, clientes -3, consejo +1 | impacto_multiple |
| gb-s-app-renueva / (vencido) | margen -5, consejo -1 | dinero_sin_hecho |

### Kúbit

| Asunto / opción | Efectos | Alertas |
|---|---|---|
| kb-d1-carta / b | caja +4, equipo -6, clientes -1, consejo +6 | impacto_multiple |
| kb-d1-guardia / a | margen -3, equipo +3, clientes +3, consejo -1 | consejo_sin_evento, dinero_sin_hecho, impacto_multiple |
| kb-d1-guardia / b | margen +3, equipo -3, clientes -1, consejo +1 | consejo_sin_evento, dinero_sin_hecho, impacto_multiple |
| kb-d1-guardia / c | margen -1, equipo +2, clientes +1, consejo +1 | consejo_sin_evento, impacto_multiple |
| kb-d2-altamar / a | margen -8, clientes +5, consejo -3 | consejo_sin_evento, golpe_grande |
| kb-d2-altamar / b | margen +3, clientes -5, consejo +2 | consejo_sin_evento |
| kb-d2-altamar / c | caja -1, margen -2, equipo -2, clientes +2, consejo +1 | consejo_sin_evento, impacto_multiple |
| kb-d2-altamar / (vencido) | clientes -6, consejo -3 | consejo_sin_evento, vencido_castiga_consejo |
| kb-d2-fuga / a | caja -4, margen -2, equipo +5 | doble_conteo |
| kb-d2-fuga / b | caja -2, equipo +2, clientes -2, consejo -1 | consejo_sin_evento, impacto_multiple |
| kb-d2-fuga / c | caja -1, margen +3, equipo -5, consejo +3 | impacto_multiple |
| kb-c-caida / a | caja -3, margen -2, equipo +3, clientes +3 | impacto_multiple |
| kb-c-caida / c | caja +1, margen +2, clientes -7, consejo -2 | consejo_sin_evento, impacto_multiple |
| kb-c-caida / (vencido) | caja -3, clientes -7 | dinero_sin_hecho |
| kb-d3-demo / a | margen -1, equipo +3, clientes -4, consejo -2 | impacto_multiple |
| kb-d3-demo / c | caja -2, margen -3, equipo +2, clientes +1 | impacto_multiple |
| kb-c-mejora / a | caja -1, margen -1, equipo +5, clientes +3 | dinero_sin_hecho, impacto_multiple |
| kb-d4-deuda / c | caja +3, margen +2, clientes -1, consejo -6 | impacto_multiple |
| kb-d4-pleito / a | margen -1, equipo +4, clientes +1, consejo -1 | impacto_multiple |
| kb-d4-pleito / b | margen +3, equipo -3, clientes -3, consejo +1 | consejo_sin_evento, dinero_sin_hecho, impacto_multiple |
| kb-d5-banco / a | caja -3, equipo +3, clientes +1, consejo -1 | consejo_sin_evento, impacto_multiple |
| kb-d5-banco / b | caja +2, equipo -6, consejo -3 | consejo_sin_evento |
| kb-d5-banco / c | caja -1, margen -1, equipo +2, consejo +3 | impacto_multiple |
| kb-d5-banco / (vencido) | equipo -8, consejo -4 | golpe_grande |
| kb-d5-ronda / a | caja +6, margen -2, equipo -4, consejo +1 | impacto_multiple |
| kb-d5-ronda / b | caja +1, margen +4, equipo -5, consejo -2 | impacto_multiple |
| kb-d5-ronda / c | caja +3, equipo -1, clientes -2, consejo +1 | impacto_multiple |
| kb-c-renata / a | equipo +4, clientes -3, consejo -2 | consejo_sin_evento |
| kb-d6-centro / a | caja -5, clientes +3, consejo -1 | consejo_sin_evento |
| kb-d6-centro / b | caja +1, clientes -4, consejo +1 | consejo_sin_evento |
| kb-d6-centro / c | caja -8, margen +2, equipo -1, consejo +3 | impacto_multiple, golpe_grande |
| kb-d6-centro / (vencido) | margen -3, clientes -8 | golpe_grande |
| kb-d6-denuncia / a | margen -2, equipo +4, consejo +1 | consejo_sin_evento |
| kb-d6-denuncia / b | margen +1, equipo -6, consejo -2 | consejo_sin_evento |
| kb-d6-denuncia / c | caja -3, equipo +3, consejo -3 | consejo_sin_evento |
| kb-d6-denuncia / (vencido) | equipo -6, consejo -2 | consejo_sin_evento, vencido_castiga_consejo |
| kb-c-academia / b | margen -1, equipo -2, clientes +2 | dinero_sin_hecho |
| kb-d7-consejo / b | margen +2, equipo -7, clientes -2, consejo +6 | impacto_multiple |
| kb-d7-consejo / c | caja -1, margen -2, equipo +5, consejo -5 | impacto_multiple |
| kb-d7-equipo / b | margen -1, equipo -3, consejo +1 | dinero_sin_hecho |
| kb-d7-equipo / (vencido) | margen -2, equipo -6, clientes -2 | dinero_sin_hecho |
| kb-c-nube-consumo / a | equipo +1, consejo -1 | consejo_sin_evento |
| kb-s-altamar-mas / (vencido) | clientes -4, consejo -1 | consejo_sin_evento, vencido_castiga_consejo |
| kb-s-altamar-grupo / a | margen -1, equipo -1, clientes +3, consejo +2 | consejo_sin_evento, impacto_multiple |
| kb-s-altamar-grupo / c | margen +2, clientes -5, consejo -1 | consejo_sin_evento |
| kb-s-altamar-grupo / (vencido) | clientes -6, consejo -2 | consejo_sin_evento, vencido_castiga_consejo |

### Punto Madero

| Asunto / opción | Efectos | Alertas |
|---|---|---|
| pm-d1-carta / b | caja +4, equipo -6, clientes -1, consejo +6 | impacto_multiple |
| pm-d1-piso / a | margen -3, equipo +3, clientes +3, consejo -1 | consejo_sin_evento, impacto_multiple |
| pm-d1-piso / b | margen +3, equipo -3, clientes -1, consejo +1 | consejo_sin_evento, impacto_multiple |
| pm-d1-piso / c | margen -1, equipo +2, clientes +1, consejo +1 | consejo_sin_evento, impacto_multiple |
| pm-d2-penasco / a | margen -8, clientes +5, consejo -3 | consejo_sin_evento, golpe_grande |
| pm-d2-penasco / b | margen +3, clientes -5, consejo +2 | consejo_sin_evento |
| pm-d2-penasco / c | caja -1, margen -2, equipo -2, clientes +2, consejo +1 | consejo_sin_evento, impacto_multiple |
| pm-d2-penasco / (vencido) | clientes -6, consejo -3 | consejo_sin_evento, vencido_castiga_consejo |
| pm-d2-asesores / a | caja -4, margen -2, equipo +5 | doble_conteo |
| pm-d2-asesores / b | caja -2, equipo +2, clientes -2, consejo -1 | consejo_sin_evento, impacto_multiple |
| pm-d2-asesores / c | caja -1, margen +3, equipo -5, consejo +3 | impacto_multiple |
| pm-d2-asesores / (vencido) | margen -2, equipo -5 | dinero_sin_hecho |
| pm-c-tarima / a | caja -3, margen -2, equipo +3, clientes +3 | impacto_multiple |
| pm-c-tarima / c | caja +1, margen +2, clientes -7, consejo -2 | consejo_sin_evento, impacto_multiple |
| pm-d3-entrega / a | margen -1, equipo +3, clientes -4, consejo -2 | impacto_multiple |
| pm-d3-entrega / c | caja -2, margen -3, equipo +2, clientes +1 | dinero_sin_hecho, impacto_multiple |
| pm-c-mejora / a | caja -1, margen -1, equipo +5, clientes +3 | impacto_multiple |
| pm-d4-deuda / c | caja +3, margen +2, clientes -1, consejo -6 | impacto_multiple |
| pm-d4-pleito / a | margen -1, equipo +4, clientes +1, consejo -1 | impacto_multiple |
| pm-d4-pleito / b | margen +3, equipo -3, clientes -3, consejo +1 | consejo_sin_evento, impacto_multiple |
| pm-d5-embargo / a | caja -3, equipo +3, clientes +1, consejo -1 | consejo_sin_evento, impacto_multiple |
| pm-d5-embargo / b | caja +2, equipo -6, consejo -3 | consejo_sin_evento |
| pm-d5-embargo / c | caja -1, margen -1, equipo +2, consejo +3 | impacto_multiple |
| pm-d5-embargo / (vencido) | equipo -8, consejo -4 | golpe_grande |
| pm-d5-oferta / a | caja +6, margen -2, equipo -4, consejo +1 | impacto_multiple |
| pm-d5-oferta / b | caja +1, margen +4, equipo -5, consejo -2 | impacto_multiple |
| pm-d5-oferta / c | caja +3, equipo -1, clientes -2, consejo +1 | impacto_multiple |
| pm-c-monica / a | equipo +4, clientes -3, consejo -2 | consejo_sin_evento |
| pm-d6-proveedor / a | caja -5, clientes +3, consejo -1 | consejo_sin_evento |
| pm-d6-proveedor / b | caja +1, clientes -4, consejo +1 | consejo_sin_evento |
| pm-d6-proveedor / c | caja -8, margen +2, equipo -1, consejo +3 | impacto_multiple, golpe_grande |
| pm-d6-proveedor / (vencido) | margen -3, clientes -8 | golpe_grande |
| pm-d6-denuncia / a | margen -2, equipo +4, consejo +1 | consejo_sin_evento |
| pm-d6-denuncia / b | margen +1, equipo -6, consejo -2 | consejo_sin_evento |
| pm-d6-denuncia / c | caja -3, equipo +3, consejo -3 | consejo_sin_evento |
| pm-d6-denuncia / (vencido) | equipo -6, consejo -2 | consejo_sin_evento, vencido_castiga_consejo |
| pm-c-escuela / b | margen -1, equipo -2, clientes +2 | dinero_sin_hecho |
| pm-d7-consejo / b | margen +2, equipo -7, clientes -2, consejo +6 | impacto_multiple |
| pm-d7-consejo / c | caja -1, margen -2, equipo +5, consejo -5 | impacto_multiple |
| pm-d7-equipo / b | margen -1, equipo -3, consejo +1 | dinero_sin_hecho |
| pm-d7-equipo / (vencido) | margen -2, equipo -6, clientes -2 | dinero_sin_hecho |
| pm-d2-temporada / a | caja +2, margen -1, equipo -1, clientes +1 | impacto_multiple |
| pm-c-temp-compras / a | caja -1, margen +1, equipo +1, clientes +1, consejo -1 | consejo_sin_evento, impacto_multiple |
| pm-c-temp-guerra / a | margen +1, equipo +1, clientes -1, consejo -1 | consejo_sin_evento, impacto_multiple |
| pm-c-temp-guerra / b | margen -3, clientes +1, consejo +1 | consejo_sin_evento |
| pm-s-penasco-mas / a | caja +3, clientes -2, consejo +2 | consejo_sin_evento |
| pm-s-penasco-mas / b | caja -7, clientes +4, consejo -3 | consejo_sin_evento |
| pm-s-penasco-mas / c | caja +2, margen +1, clientes -6, consejo -1 | consejo_sin_evento, impacto_multiple |
| pm-s-penasco-mas / (vencido) | clientes -4, consejo -1 | consejo_sin_evento, vencido_castiga_consejo |
| pm-s-penasco-obras / a | caja -1, margen -1, clientes +3, consejo +2 | consejo_sin_evento, impacto_multiple |
| pm-s-penasco-obras / b | margen -6, clientes +4, consejo -2 | consejo_sin_evento |
| pm-s-penasco-obras / c | margen +2, clientes -5, consejo -1 | consejo_sin_evento |
| pm-s-penasco-obras / (vencido) | clientes -6, consejo -2 | consejo_sin_evento, vencido_castiga_consejo |

### Vértice Logística

| Asunto / opción | Efectos | Alertas |
|---|---|---|
| vl-d1-carta / b | caja +4, equipo -6, clientes -1, consejo +6 | impacto_multiple |
| vl-d1-patio / a | margen -3, equipo +3, clientes +3, consejo -1 | consejo_sin_evento, dinero_sin_hecho, impacto_multiple |
| vl-d1-patio / b | margen +3, equipo -3, clientes -1, consejo +1 | consejo_sin_evento, dinero_sin_hecho, impacto_multiple |
| vl-d1-patio / c | margen -1, equipo +2, clientes +1, consejo +1 | consejo_sin_evento, dinero_sin_hecho, impacto_multiple |
| vl-d2-almena / a | margen -8, clientes +5, consejo -3 | consejo_sin_evento, golpe_grande |
| vl-d2-almena / b | margen +3, clientes -5, consejo +2 | consejo_sin_evento |
| vl-d2-almena / c | caja -1, margen -2, equipo -2, clientes +2, consejo +1 | impacto_multiple |
| vl-d2-almena / (vencido) | clientes -6, consejo -3 | consejo_sin_evento, vencido_castiga_consejo |
| vl-d2-operadores / a | caja -4, margen -2, equipo +5 | doble_conteo |
| vl-d2-operadores / b | caja -2, equipo +2, clientes -2, consejo -1 | consejo_sin_evento, impacto_multiple |
| vl-d2-operadores / c | caja -1, margen +3, equipo -5, consejo +3 | impacto_multiple |
| vl-c-frenos / a | caja -3, margen -2, equipo +3, clientes +3 | impacto_multiple |
| vl-c-frenos / c | caja +1, margen +2, clientes -7, consejo -2 | consejo_sin_evento, dinero_sin_hecho, impacto_multiple |
| vl-c-frenos / (vencido) | caja -3, clientes -7 | dinero_sin_hecho |
| vl-d3-rastreo / a | margen -1, equipo +3, clientes -4, consejo -2 | impacto_multiple |
| vl-d3-rastreo / c | caja -2, margen -3, equipo +2, clientes +1 | impacto_multiple |
| vl-c-mejora / a | caja -1, margen -1, equipo +5, clientes +3 | impacto_multiple |
| vl-d4-deuda / c | caja +3, margen +2, clientes -1, consejo -6 | impacto_multiple |
| vl-d4-pleito / a | margen -1, equipo +4, clientes +1, consejo -1 | impacto_multiple |
| vl-d4-pleito / b | margen +3, equipo -3, clientes -3, consejo +1 | consejo_sin_evento, dinero_sin_hecho, impacto_multiple |
| vl-d4-pleito / c | margen -2, equipo -3, clientes +3 | dinero_sin_hecho |
| vl-d5-embargo / a | caja -3, equipo +3, clientes +1, consejo -1 | consejo_sin_evento, impacto_multiple |
| vl-d5-embargo / b | caja +2, equipo -6, consejo -3 | consejo_sin_evento |
| vl-d5-embargo / c | caja -1, margen -1, equipo +2, consejo +3 | impacto_multiple |
| vl-d5-embargo / (vencido) | equipo -8, consejo -4 | golpe_grande |
| vl-d5-oferta / a | caja +6, margen -2, equipo -4, consejo +1 | impacto_multiple |
| vl-d5-oferta / b | caja +1, margen +4, equipo -5, consejo -2 | impacto_multiple |
| vl-d5-oferta / c | caja +3, equipo -1, clientes -2, consejo +1 | impacto_multiple |
| vl-c-gaby / a | equipo +4, clientes -3, consejo -2 | consejo_sin_evento |
| vl-d6-sistema / a | caja -5, clientes +3, consejo -1 | consejo_sin_evento |
| vl-d6-sistema / b | caja +1, clientes -4, consejo +1 | consejo_sin_evento |
| vl-d6-sistema / c | caja -8, margen +2, equipo -1, consejo +3 | impacto_multiple, golpe_grande |
| vl-d6-sistema / (vencido) | margen -3, clientes -8 | golpe_grande |
| vl-d6-denuncia / a | margen -2, equipo +4, consejo +1 | consejo_sin_evento |
| vl-d6-denuncia / b | margen +1, equipo -6, consejo -2 | consejo_sin_evento, dinero_sin_hecho |
| vl-d6-denuncia / c | caja -3, equipo +3, consejo -3 | consejo_sin_evento |
| vl-d6-denuncia / (vencido) | equipo -6, consejo -2 | consejo_sin_evento, vencido_castiga_consejo |
| vl-d7-consejo / b | margen +2, equipo -7, clientes -2, consejo +6 | impacto_multiple |
| vl-d7-consejo / c | caja -1, margen -2, equipo +5, consejo -5 | impacto_multiple |
| vl-d7-equipo / b | margen -1, equipo -3, consejo +1 | dinero_sin_hecho |
| vl-d7-equipo / (vencido) | margen -2, equipo -6, clientes -2 | dinero_sin_hecho |
| vl-d2-diesel / b | caja +1, margen +3, clientes -3, consejo +1 | consejo_sin_evento, impacto_multiple |
| vl-d2-diesel / c | caja -1, margen -1, equipo +1, clientes +1 | impacto_multiple |
| vl-c-diesel-formula / a | caja -1, margen +1, equipo -1, clientes +2 | impacto_multiple |
| vl-c-diesel-licitacion / a | margen -1, equipo +1, consejo -1 | consejo_sin_evento |
| vl-c-diesel-licitacion / c | margen +1 | promesa_cobrada |
| vl-c-diesel-licitacion / (vencido) | clientes -4, consejo -1 | consejo_sin_evento, vencido_castiga_consejo |
| vl-s-almena-mas / a | margen +3, clientes -2, consejo +2 | consejo_sin_evento |
| vl-s-almena-mas / b | caja -2, margen -7, clientes +4, consejo -3 | consejo_sin_evento, impacto_multiple, doble_conteo |
| vl-s-almena-mas / c | caja +1, margen +2, clientes -6, consejo -1 | consejo_sin_evento, impacto_multiple |
| vl-s-almena-mas / (vencido) | clientes -4, consejo -1 | consejo_sin_evento, vencido_castiga_consejo |
| vl-s-almena-cedis / a | caja -2, equipo -1, clientes +3, consejo +2 | consejo_sin_evento, dinero_sin_hecho, impacto_multiple |
| vl-s-almena-cedis / c | caja +2, clientes -5, consejo -1 | consejo_sin_evento, dinero_sin_hecho |
| vl-s-almena-cedis / (vencido) | clientes -6, consejo -2 | consejo_sin_evento, vencido_castiga_consejo |

## 3 · Banco de casos

1262 caminos del banco con alerta. El detalle completo está en `inventario-efectos.csv`.

