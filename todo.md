# World Events v2 + Assess v1

## A. Protección de partidas existentes
- [x] Foto (snapshot) del comportamiento actual de episodios v1 antes de tocar código
- [x] Prueba de regresión: episodios v1 dan exactamente lo mismo

## B. World Events v2
- [x] Inundaciones (GDACS FL) + fixture real
- [x] Casos de clima con 6 frentes: personal, continuidad, inventario, proveedores, clientes, caja
- [x] Perfil de comercio exterior por empresa (import/export %, países, categorías, quién paga)
- [x] Aranceles de EE. UU. (Sección 232 acero) con tabla verificada y regla de incidencia
- [x] Consecuencias reales v2: impacto inevitable + mitigación + costo + consecuencias futuras (versionado por episodio)
- [x] Desglose de consecuencias calculado por el motor (UI)
- [x] Pruebas: duplicados, avisos, regresión

## C. Seguridad VAPID
- [x] Llaves generadas y guardadas por el servidor (tabla solo service_role), sin humanos
- [x] Quitar fragmentos de llaves viejas de pruebas
- [x] Prueba de cifrado de aviso de extremo a extremo

## D. Prueba completa
- [x] Simulación etiquetada (Campeche + arancel EE. UU.) + informe + checklist de dispositivos (acontecimiento, empresa, decisiones, consecuencias)

## E. MÊTIS Assess v1 (piloto de validación)
- [x] Modelo: vacante, set de casos fijo, rúbrica de competencias, evidencias, recomendaciones
- [x] Migración (tablas assess_*), APIs empresa y candidato
- [x] Páginas /assess separadas de CEO, bloqueo de uso real
- [x] Pruebas

## F. Cierre
- [x] tsc, suite, build, PR, merge, mensaje
