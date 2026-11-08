# Growth Engine · lanzamiento piloto y pendientes

## Qué quedó activo

- **Empresa emergente** en Restaurantes y en Autopartes: decisiones de crecimiento (contratar, abrir sucursal o planta, aceptar contratos y turnos), evolución de personas, sedes, capacidad y resultados financieros.
- **Hoy, Mi empresa y los indicadores leen el mismo motor económico.** Con una empresa emergente, los cinco indicadores salen del puente del motor de crecimiento (`growthBridge`) y no del modelo de negocio anterior.
- **Convivencia con las partidas actuales.** Las empresas actuales no se reemplazan ni se reinician. Desde Mi empresa, «Abrir una empresa emergente» guarda la empresa actual completa (decisiones, periodo, historial, negocio y pausas) con el reloj detenido. Tu XP, tu racha, tus lecciones, tus dilemas y tu carrera siguen siendo tuyos. Desde «Empresas guardadas» → «Volver a esta empresa» regresas a ella. El lapso en que estuvo guardada cuenta como pausa: nada vence y no gasta vacaciones.
- **Interruptor `growth_engine`.** Está prendido salvo que `ceo.flags` traiga la fila con `enabled = false`, y se apaga en 60 segundos o menos. El SQL está en `docs/sql/growth_respaldo_y_apagado.sql`, junto con el respaldo de partidas y el modo «solo cuentas piloto». Un segundo interruptor está en el código: quitar `growth_engine` de `DEFAULT_ON` en `app/src/lib/ceo/flags.ts` lo apaga en el siguiente despliegue.

## Pendientes registrados (no bloquean el lanzamiento)

1. **Validar salarios y costos laborales.** Hay que revisar contra referencias de mercado de Monterrey los sueldos de las plantillas (cocina, piso, gerencia, operarios, supervisión, calidad), las cargas sociales y las prestaciones, y ajustar la nómina mensual de cada puesto.
2. **Revisar la rentabilidad incremental del restaurante y de la manufactura.** Hay que confirmar que una sucursal o un turno adicional rinde lo que debe en tiempo de maduración, punto de equilibrio y margen. Hoy la segunda sucursal tarda en pagar su arranque y algunos contratos de manufactura dejan poco margen. Hay que calibrar con casos reales.
3. **Mejorar la causalidad de los indicadores.** El puente traduce la caja, la cobranza, la rotación, el servicio y el cumplimiento a los cinco indicadores. Faltan explicaciones más finas de «por qué se movió» en cada caso y umbrales revisados por industria.
4. **Ampliar simulaciones y escenarios.** Faltan más trayectorias (crecimiento agresivo, crisis de liquidez, pérdida de un cliente grande), más semillas y pruebas de estrés de 12 a 24 meses, con informe comparativo como en `02-simulaciones.md`.
5. **Conectar progresivamente el Growth Engine con la inteligencia adaptativa.** El objetivo es que los casos, el ritmo y la dificultad respondan al estado real de la empresa emergente y al perfil del jugador. Hay que hacerlo por etapas, con el mismo motor determinista como fuente de verdad.

## Qué probar primero

1. Mi empresa → «Abrir una empresa emergente» → Restaurantes → nombre → «Acepto el nombramiento».
2. En Hoy aparece «Atender: caso de crecimiento». El primer caso es la contratación del cocinero: compara cómo cambian la nómina, la capacidad y la caja.
3. Mi empresa → «Empresas guardadas» → «Volver a esta empresa» para regresar a la empresa anterior. Hay que confirmar que las decisiones y el avance siguen ahí y que nada venció.
