# Growth Engine · Fase 1 — Blueprint económico-operativo y núcleo aislado (Entregable B)

Estado: **núcleo construido y probado, NO conectado a la app** (no hay UI, flag ni cambio en partidas).
Código: `app/src/lib/ceo/growth/` · Pruebas: `growth.test.ts` (20 pruebas de aceptación).

## 1. Estructura

| Archivo | Qué contiene |
| --- | --- |
| `types.ts` | Estado persistente versionado: personas, vacantes, sitios, activos, contratos, pagos programados, libro (devengo/caja), eventos, resúmenes mensuales, decisiones aplicadas. |
| `labor.ts` | Parámetros laborales México v1 con fuente, fecha y confianza; costo mensual por persona; indemnización. |
| `catalog.ts` | 21 puestos (10 restaurante, 11 manufactura) con salario, costo de entrada, tiempo de cobertura, curva de aprendizaje, capacidad, supervisión, rotación y tamaño mínimo de empresa. |
| `families.ts` | Parámetros por familia (recursos limitantes, precio, costo, días de cobro y pago) y dos empresas emergentes de arranque. |
| `engine.ts` | Motor determinista por días simulados: `createCompany`, `apply(decisión)`, `advance(días)`, `capacityNow`. |

## 2. Reglas de causalidad implementadas

1. **Contratar abre una vacante**: sin caja ni gasto ese día. Al cubrirse (días de cobertura del puesto) entra la persona, se registra una vez el costo de entrada y empieza con productividad parcial que sube durante su curva.
2. **Nómina**: el sueldo se devenga y se paga al cierre de cada mes por los días trabajados; cuotas patronales e impuesto sobre nómina se devengan en el mes y se pagan el día 17 del siguiente; aguinaldo y prima vacacional se provisionan cada mes y se pagan en diciembre (o en el finiquito).
3. **Inversión**: sale de caja cuando se paga; el resultado solo reconoce depreciación mensual cuando el activo ya opera.
4. **Venta = mínimo entre demanda y el cuello de botella del día** (restaurante: cocina, servicio, loza, mesas; manufactura: prensas × turnos con supervisor, operadores, con desperdicio). La capacidad sobrante no vende.
5. **Crédito**: manufactura cobra a 45 días y paga a 30; el restaurante cobra al momento y paga a 15.
6. **Sucursal**: firma → renta corre → obra → preapertura → abre solo con responsable y personal mínimo → demanda madura en meses; el escenario de demanda real (75–115 % de lo proyectado) lo fija la semilla, no la IA.
7. **Rotación**: renuncias deterministas por puesto; los puestos operativos se reponen con su costo y su tiempo; mandos no se reponen solos (es una decisión).
8. **Despido**: finiquito más indemnización (90 días + 20 por año) y rastro en la historia.
9. **Idempotencia**: cada decisión tiene id; aplicarla dos veces no hace nada. `advance` trabaja sobre una copia; mismo estado + mismas decisiones = mismo resultado.
10. **Tamaño**: los puestos tienen tamaño mínimo (no hay director de operaciones con 15 personas).

## 3. Costo laboral (México 2026)

- **Oficial**: salario mínimo $315.04 diarios (CONASAMI); aguinaldo 15 días, 12 días de vacaciones y prima del 25 % (LFT); pago de cuotas el día 17 del mes siguiente (LSS art. 39); indemnización (LFT arts. 48 y 50).
- **Referencial**: UMA 2026; impuesto sobre nómina por estado (NL 3 %, CDMX 4 %…).
- **Supuesto de simulación**: tasa patronal agregada por bandas de salario (26–30 % sobre SBC) y rangos salariales por puesto en Monterrey. Resultado: un puesto cuesta entre 32 % y 40 % más que su sueldo bruto. **Debe contrastarse con el SUA por puesto y homologarse con el Observatorio Laboral antes del piloto.**

## 4. Simulaciones exploratorias (12 meses, 3 semillas)

| Estrategia | Caja mínima | Caja final | Lectura |
| --- | --- | --- | --- |
| Restaurante sin crecer | $0.57 M | $2.2 M | Sano; sigue perdiendo pedidos en horas pico. |
| Restaurante cauteloso (cocinero, luego 2.ª sucursal en mes 5) | $0.30–0.33 M | $1.05–1.2 M | Crece a 2 sucursales y ~18 personas sin crisis. |
| Restaurante agresivo (2.ª sucursal el día 1) | **−$0.57 M** | $1.5–1.8 M | Crisis de liquidez en los primeros meses: necesitaría financiamiento. |
| Manufactura rechaza contrato | $1.48 M | $3.1 M | Estable, sin crecer. |
| Manufactura acepta sin prepararse | $1.48 M | $3.3 M | Pierde ~576 mil piezas: incumplimiento con el cliente. |
| Manufactura 2.º turno + 6 operadores | $1.39 M | $3.6–4.3 M | Gana más; en una semilla renuncia el supervisor del 2.º turno y vuelve a incumplir. |

Las trayectorias son plausibles y distintas, y no castigan no crecer. **Calibración pendiente**: el margen del restaurante base (≈20 % antes de impuestos) es alto para el sector; se ajustará con la revisión de supuestos.

## 5. Pendiente para fase 2 (no hecho aquí)

- Adaptador hechos del motor → `Fact` V10 y puntos del tablero (una sola economía; sin fórmula paralela).
- Caja negativa: hoy se permite y se ve; falta la regla de financiamiento/crisis y el evento narrativo.
- Precondiciones de casos (tamaño, sitios, puestos existentes) y cadenas A y B con decisiones reales.
- Clientes con reacción a calidad y servicio (hoy solo la reputación del restaurante).
- Tiempo: equivalencia entre días simulados del motor y la cadencia de la carrera.
- Flag `growth_engine` y la decisión de Oziel sobre el nombre «Empresa emergente».
