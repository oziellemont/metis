# mêtis World Events — puesta en marcha

Acontecimientos reales (huracanes y sismos) que tocan las sedes de la empresa que dirige el jugador se convierten en un caso de decisión dentro de su carrera. Todo caso lleva la etiqueta «Evento real · Simulación de impacto en tu empresa» (o «Ejercicio hipotético · No es un acontecimiento real» en modo prueba). Nunca se afirma daño real.

## Qué hace

1. El navegador del jugador consulta `/api/ceo/mundo` cada 15 minutos (requiere sesión).
2. El servidor lee GDACS (lista → geometría), corrobora con NHC (ciclones) y USGS (sismos), cachea 10 minutos (1 minuto si GDACS falla) y devuelve candidatos que tocan las sedes de la plantilla del jugador.
3. Si la zona es naranja o roja y el jugador activó «Acontecimientos reales en mi carrera», se registra la jugada `world` en el diario. Zona verde es solo informativa.
4. El caso externo llega primero en «Hoy», no consume el turno de casos normales y tiene plazo. Si es pronóstico, al terminar el acontecimiento se registra `worldEnd` con la zona final observada; si se desvía, solo cuesta la preparación elegida.
5. El cron diario envía un correo por acontecimiento y revisión (solo eventos reales, caso abierto, preferencia activa).

## Reglas de justicia

- Sin exposición no hay caso. Máximo un episodio externo sin resolver a la vez. Mismo acontecimiento + revisión no abre dos veces.
- Nunca se reescribe el pasado: el episodio cae en el día abierto del periodo.
- Indicadores: con una preparación razonable (protocolo, preventivo, inspección, apoyo) quedan igual que sin acontecimiento. Solo cuenta contra el jugador la diferencia atribuible a su decisión (p. ej. «monitorear» ante un golpe fuerte).

## Empresas con sedes registradas

- Retail consolidada: Monterrey y CEDIS.
- Acería integrada: planta y patio. Acería compacta: planta.
- Otras plantillas no reciben nada hasta registrar sus sedes (pendiente: Logística con sede en Campeche para el piloto).

## Interruptores

- Fila `world_events` en `ceo_flags` (migración `0021_ceo_world_events.sql`): apagada por omisión, `perPlayer: true`, `off: []`.
- Para invitar jugadores piloto, prender o apagar todo, o apagar una familia (`"clima"`, `"sismo"`, `"macro"`): `docs/sql/world_events_prender_y_apagar.sql`.
- Revertir: `docs/sql/0021_revertir.sql`.
- En preview y desarrollo siempre está visible para probar.

## Modo ejercicio

En Ajustes → herramientas de prueba: «Huracán de ejercicio», «Sismo de ejercicio», «Dólar de ejercicio», «Tasa de ejercicio» y «Arancel de ejercicio». Abren un caso hipotético; no requieren la preferencia de eventos reales. Los económicos solo aparecen si la empresa tiene la exposición correspondiente.

## Economía y noticias (fuentes oficiales, sin llave)

- Tipo de cambio FIX (indicador 158) y TIIE de fondeo (175) del Banco de México, leídos del Diario Oficial (API SIDOF). Movimiento material: 3 % o más del dólar, o ¼ de punto de tasa, contra 20 publicaciones atrás.
- Decretos arancelarios del DOF: se leen fracciones, tasa nueva y fecha de vigencia. Solo abren caso si la tasa anterior está verificada en `TARIFF_BASE` (`world/econfeed.ts`), la medida ya está vigente y la fracción coincide con lo que la empresa vende o importa. Si no, quedan en el radar.
- Federal Register (EE. UU.): medidas comerciales que mencionan a México, al radar.
- Radar de noticias: publicaciones del DOF clasificadas (gobierno, energía, impuestos, trabajo, puertos e infraestructura, comercio). Es informativo y respeta las familias apagadas.
- GDELT (noticias internacionales) es opcional con `WORLD_GDELT=1` porque limita por frecuencia.
- Quién recibe qué: la cadena de tiendas no tiene compras en dólares ni importaciones, así que solo recibe bajas de tasa (oportunidad de refinanciar). La acería compacta recibe dólar (consumibles importados). La integrada recibe dólar, tasa y aranceles de varilla y alambrón.

## Avisos al celular (Web Push, gratis)

1. Variables en Vercel: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:...`). Redeploy.
2. Migración `0022_ceo_avisos_celular.sql` (revertir: `docs/sql/0022_revertir.sql`).
3. El jugador entra a Ajustes → «Avisos en el celular» → Activar. En iPhone primero «Compartir → Agregar a pantalla de inicio» y abrir desde el ícono (iOS 16.4+). En Android basta Chrome.
4. El cron diario manda: asunto nuevo, asunto por vencer y acontecimiento real. El resumen y la racha siguen solo por correo. Suscripciones vencidas se borran solas.
