# Growth Engine · Fase 0 — Diagnóstico técnico (Entregable A)

Fecha: noviembre 2026 · Base: `main` después de PR #168 · Autor: SuperNinja
Convención de este documento: **[verificado]** = leído en el código; **[supuesto]** = criterio editorial o de simulación; **[propuesta]** = nuevo; **[pendiente]** = dependencia no resuelta o decisión de Oziel.

## 1. Versión económica vigente

- **[verificado]** `rules.ts`: `ECONOMY_RULES_VERSION = 10`, `CONTINUOUS_RULES_VERSION = 10`. La economía basada en hechos (V10) está en producción desde PR #166/#167; las partidas en curso se migraron de forma reversible (`econ-migration.ts`, `CeoState.econMigration`).
- **[verificado]** `types.ts` define `Fact` con siete tipos: `cobro`, `pago`, `precio`, `costo`, `inversion`, `capital_trabajo`, `financiamiento`; con `days`, `expense`, `years`, `rate`, `external`.
- **[verificado]** `economy.ts` convierte hechos en puntos de Caja y Margen con anclas por empresa (`anchorsFor`): 1 punto de Caja = 5 % de los pagos de un mes; 1 punto de Margen = 0.5 % de la venta anual. Materialidad por acumulación, autoridad del consejo y «operación del mes» al cierre.
- **[verificado]** Limitación: los montos de los hechos están escritos **para la empresa establecida** y se escalan por un factor de ventas (`career/size.ts`). No hay hechos de plantilla, nómina, capacidad ni demanda: un «contratar» de un caso es un `pago`/`costo` agregado, no una persona.
- **[verificado]** `business/model.ts` (P0-C) reconstruye estados de resultados mensuales a partir de la línea base del perfil, de los movimientos de los índices y de asignaciones (`contratar`, `marketing`, `capex`…). Ahí los **índices mueven los números**; el Growth Engine necesita la dirección contraria (los hechos operativos mueven los números y los índices se derivan). Conclusión: el núcleo nuevo **no** debe montarse sobre `simulate()` de P0-C; debe producir hechos compatibles con `Fact` para el tablero V10.

## 2. Tipos de empresa, onboarding e industrias

- **[verificado]** `career/taxonomy.ts`: tipos `pyme`, `startup`, `establecida`. Se **ofrecen** solo `startup` y `establecida` (`OFFERED_TYPES`, decisión de nov-2026); la PYME sigue jugable en partidas existentes.
- **[verificado]** Restaurantes (paquete Brasa) y Autopartes (Forja) se ofrecen hoy **solo como establecida**. Alimentos (Cumbre) admite PYME pero ofrece establecida; SaaS (Kubit) ofrece startup.
- **[verificado]** Las líneas base de `business/profiles.ts` para la PYME de restaurantes son 70 personas y $3.2 M al mes; la de manufactura, 110 personas y $12 M al mes. Una «empresa emergente» como la de la propuesta (1 sucursal, 9 personas, ~85 pedidos al día ≈ $0.9 M al mes) es **un orden de magnitud más chica** que cualquier perfil existente.
- **[verificado]** Flujo: Nombramiento → Sector e industria → Tipo → Nombre → Resumen → Primer caso (`career/setup.ts`, `CompanySetup.tsx`). No hay preguntas contables; se conserva.

## 3. Mi empresa, organigrama y sucursales

- **[verificado]** `org-chart.ts` arma el organigrama desde el **elenco fijo del paquete** (`pack.cast`: consejo, comité, equipo, externos). No existe entidad de empleado, puesto, vacante, alta ni baja.
- **[verificado]** `CompanyProfile.exposure.sites` lista sitios solo para cruzar eventos externos (clima, aranceles). No tienen capacidad, personal, renta ni ciclo de vida.
- **[verificado]** `CompanyView.tsx` muestra indicadores, organigrama, «Cómo te mide el consejo» y glosario. No hay vistas de equipo, operación/sucursales ni hitos de empresa.

## 4. Contenido y precondiciones

- **[verificado]** Los casos de Brasa hablan de «34 sucursales», «$980 M», gerentes de sucursal, franquicias; los de Forja, de planta con armadoras y cientos de operadores. `size.ts` reescribe montos y algunos tamaños para la PYME mediante tablas, pero **no existe un sistema de precondiciones por estructura** (número de sucursales, puestos existentes, producción propia).
- **[verificado]** Las etiquetas de casos (`companies/tags.ts`) clasifican tema y competencia, no tamaño mínimo/máximo.
- Consecuencia: habilitar «restaurante emergente» con el banco actual produciría casos incoherentes (conflictos entre gerentes de sucursales que no existen). **Bloqueante** para activar la experiencia; no para construir el núcleo.

## 5. Interruptores, persistencia y cuentas piloto

- **[verificado]** `flags.ts`: `FLAG_KEYS = ai, ai_shadow, events, game_journal, replay_shadow, episodes, carrera_continua`. Un interruptor de jugador solo puede apagar algo global. **[propuesta]** agregar `growth_engine` (apagado) cuando exista UI.
- **[verificado]** El estado vive en `CeoState` (jsonb del jugador). Campos opcionales nuevos no rompen partidas: todo lo que no tenga `growth` se lee como hoy.
- **[pendiente]** Migración de las dos cuentas piloto: no se toca. El motor nuevo solo aplica a empresas creadas con el tipo emergente cuando Oziel lo autorice.

## 6. Qué se puede reutilizar

| Pieza existente | Reuso |
| --- | --- |
| `Fact` + `economy.ts` (V10) | El motor de crecimiento emite hechos con monto y fecha en pesos; un adaptador los resume a la escala del tablero. Una sola economía. |
| `COMPANY_STAGES` | Sin cambios de cálculo (regla 4 de la adenda). |
| Elenco persistente y memoria de casos | Personas contratadas reciben id estable y pueden entrar al elenco como personajes. |
| Paneles de indicadores (Fase A) | Las causas se alimentan del registro de hechos del motor. |
| `size.ts` / `lexicon.ts` | Útiles para PYME/establecida; para emergente se requieren precondiciones, no solo reescritura. |

## 7. Conflictos y riesgos detectados

1. **Escala de anclas:** el punto de Caja de una empresa emergente (5 % de ~$0.8 M al mes ≈ $40 mil) es muy sensible: una contratación mueve el tablero. Es correcto económicamente, pero la materialidad debe revisarse con simulaciones antes del piloto.
2. **Dos modelos de negocio:** P0-C (`business/model.ts`) y el motor nuevo producirían estados de resultados distintos. Propuesta: para empresas emergentes, el estado de resultados lo da el motor de crecimiento; P0-C se queda para las partidas actuales.
3. **Contenido sin precondiciones:** ver §4.
4. **Costos laborales:** no hay datos laborales en el repo. Se crean parámetros versionados con fuente y nivel de confianza; las cuotas IMSS se modelan por componente y se marcan como aproximadas hasta contrastarlas con el SUA.
5. **Tiempo:** hoy 1 día real ≈ 4 días de la empresa durante un periodo. El motor nuevo avanza en **semanas simuladas** y solo cuando el juego lo ordena; la inactividad no corre el reloj.

## 8. Plan de compatibilidad

- Fase 1 (este trabajo): `app/src/lib/ceo/growth/` aislado, puro y determinista, con pruebas de aceptación de la adenda §16.1 y §16.2. **No se conecta a la UI ni al estado del jugador.**
- Fase 2: adaptador hechos→tablero V10, precondiciones de casos, cadenas A (restaurante) y B (manufactura), en ambiente de prueba.
- Fase 3: vistas Equipo / Operación y sucursales / Hitos en Mi empresa, señal breve en Hoy, detrás de `growth_engine`.
- Fases 4–5: demás industrias y lanzamiento, con aprobación explícita.
