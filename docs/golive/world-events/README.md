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

En Ajustes → herramientas de prueba: «Huracán de ejercicio» y «Sismo de ejercicio». Abren un caso hipotético con desenlace guionado; no requieren la preferencia de eventos reales.

## Límites actuales

- Familias activas: clima (ciclones) y sismo. Macro (tasa, tipo de cambio, aranceles) tiene el motor listo pero sin fuente conectada (falta `BANXICO_TOKEN`; aranceles WTO/USITC/DOF pendientes).
- Aviso por correo; Web Push pendiente de llaves VAPID.
- GDELT (noticias) no se usa todavía.
