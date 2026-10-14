# Precio por colaborador con scorecard · análisis y recomendación

> Octubre 2026. Cifras en MXN antes de IVA. Cálculos reproducibles en `tools/precio_scorecard.py`.

## Regla de cobro (ya implementada)

Se cobra **por colaborador activo con scorecard del año** (al menos un KPI o proyecto). No cuentan: personas sin scorecard, usuarios desactivados ni el equipo mêtis. Se factura el **pico del mes** (así nadie apaga scorecards el día del corte). Mínimo 15 por cliente.

**Cómo se entera Oziel:** la Consola mêtis muestra por cliente cuántos se cobran, el % de la plantilla que representan, el escalón y el estimado del mes, más el total. Botón para exportar 12 meses en CSV. El cron diario guarda la foto (migración `0012_cobro_scorecards.sql`).

## El problema que hay que ver de frente

El plan financiero v2 asumió **140 colaboradores × $155** = **$260,400 al año por cliente**. Pero si solo se cobra a quienes tienen scorecard, la base real es mucho más chica: en una empresa típica de 150 personas, entre 25% y 35% tiene scorecard (directivos, gerentes, jefes, supervisores y puestos clave).

| Empresa | Personas | Con scorecard (supuesto) | Tabla actual aplicada a scorecards (año) | % del plan v2 |
|---|---|---|---|---|
| Chica | 60 | 21 (35%) | $47,628 | 18% |
| Mediana | 150 | 45 (30%) | $102,060 | 39% |
| Grande | 300 | 75 (25%) | $143,100 | 55% |

**Conclusión:** con los precios actuales ($189 / $159 / $129), cobrar solo por scorecard deja el ingreso de plataforma en **~40% de lo planeado**. La línea SaaS del año 3 pasaría de $5.94M a ~$2.3M.

## Comparación de mercado

| Referencia | Precio usuario/mes | Qué incluye |
|---|---|---|
| Perdoo Premium | €6.40 ≈ **$132** | Software de OKR/KPI, sin método ni compensación, en inglés |
| Perdoo Supreme | €8.00 ≈ **$164** | Igual + tableros de consejo |
| mêtis hoy | $129–$189 | Método + cascada + Owner/Contributor + ritmo + bonos + Academy, en español |

Cobrando por scorecard, mêtis compite contra Perdoo **usuario contra usuario**. Al precio de hoy queda a la par de una herramienta genérica, pese a incluir método, compensación y acompañamiento.

## Recomendación: subir el precio por scorecard y agregar una cuota base

Porque ahora cada asiento es una persona que **sí usa** la plataforma y cuyo bono puede depender de ella. Propuesta a validar:

| Concepto | Precio |
|---|---|
| Cuota base de plataforma | **$3,500 / mes** (incluye 10 scorecards) |
| Scorecards 11–40 | **$290** c/u / mes |
| Scorecards 41–150 | **$250** c/u / mes |
| Más de 150 | **$210** c/u / mes |
| Corporativo (+1,500) | A la medida |

| Empresa | Scorecards | Propuesta (año) | Por scorecard/mes | Equivalente por empleado/mes |
|---|---|---|---|---|
| Chica | 21 | $80,280 | $319 | $112 |
| Mediana | 45 | $147,000 | $272 | $82 |
| Grande | 75 | $237,000 | $263 | $66 |

Con esto: el dueño paga **menos** que con la tabla original por plantilla completa (gana el «no te cobro por el montacarguista»), y mêtis recupera **~56%** del ingreso planeado en vez de ~39%.

**Lo que aún falta para cerrar la brecha:** el resto sale de la consultoría (Diagnóstico, Arquitectura, Growth Sprints), que en tu modelo ya es la mayor parte del ingreso del año 1. Conviene actualizar el plan financiero con este supuesto en lugar de esconderlo.

## Riesgos y cómo cuidarlos

1. **El cliente reduce scorecards para pagar menos.** Se mitiga con el pico mensual, el mínimo de 15 y la cuota base. Además, bajar scorecards rompe su propio esquema de bonos.
2. **Sorpresas en la factura.** La Consola permite enviar el conteo al cliente antes de facturar. Sugerencia: contrato anual por un número comprometido de scorecards y ajuste trimestral si se pasan (no mensual).
3. **Comparación con Perdoo/OKR baratos.** Vender el paquete (método + compensación + acompañamiento), nunca la licencia sola.

## Preguntas para validar en las entrevistas

- «¿Cuántas personas en tu empresa tienen hoy metas o bono por resultados?» → valida el % real con scorecard.
- «¿Cuánto inviertes hoy al año en consultoría, software o el tiempo de quien arma los reportes?» → techo de precio.
- Probar dos anclas distintas con prospectos diferentes: $250 y $300 por scorecard.

## Decisión pendiente (Oziel)

- [ ] ¿Mantener la tabla actual ($189/$159/$129) o pasar a cuota base + escalones por scorecard?
- [ ] Actualizar `plan-financiero-v2.md` con el supuesto de % de plantilla con scorecard.
- [ ] Cuando se decida, cambiar los números en `app/src/lib/billing.ts` (la landing y la Consola se actualizan solas).
