# Landing de MÊTIS CEO (www.metis.ceo)

El middleware reescribe `/` de metis.ceo hacia `/simulador`. La landing de Align (`/`) no se toca.
Copy y estado de funciones: `app/src/components/site/ceo-landing/content.ts`.

## Auditoría (antes del rediseño)

La landing anterior tenía hero animado, 3 pasos, 3 razones con visuales, precio de $59 MXN y el cierre «Mañana eres Director General».

- **Precio de $59 MXN.** Solo existe como constante (`CEO_PRICE_MXN`). No hay checkout, no hay cobro y no hay cancelación. «Cancela cuando quieras» no era verificable. Decisión: no publicar precio.
- **«Un caso nuevo cada día».** Es correcto: los asuntos llegan dentro del horario que elige el jugador y hay modo intensivo.
- **«De CERO a CEO».** Las Notas CEO y la bitácora citan el libro. Ahora se presenta así: «Las Notas CEO que acompañan cada caso vienen de su libro». Falta que el fundador confirme la redacción.
- **Contacto.** `hola@metisalign.mx` se conserva porque es el único verificado.
- **Páginas legales.** No existen páginas de privacidad ni de términos, así que no se enlazan.
- **Analítica.** `track()` solo acepta una lista cerrada de eventos y solo guarda si hay sesión. No se agregó medición a la landing.

## Matriz de disponibilidad

**Disponible hoy:**
- 3 empresas
- asuntos en el horario que eliges
- decisiones que persisten
- personajes con postura
- bitácora y Nota CEO
- mêtis Academy
- 6 etapas
- ranking
- perfil profesional y orden «Para ti»
- avisos por correo
- Junta ante el Consejo (`/ceo/junta`, desde la etapa Chief Operating Officer)

**En preparación:**
- respuestas escritas con retroalimentación (vista previa apagada)

**Futuro (no construido):**
- conversaciones abiertas
- escenarios generados
- The Executive Arena
- suscripción y cobro

## Reglas que cuidan las pruebas (`content.test.ts`)

- La demo tiene 3 opciones con consecuencias distintas.
- Ninguna opción gana en todo.
- La demo no importa el motor, no usa localStorage y no hace llamadas de red.
- Las etapas coinciden con `STAGES`.
- No aparece ningún precio.
- Nada futuro se marca como disponible.
- No hay frases prohibidas ni signos de admiración.
- Hay una sola h1.

## Pendiente

- Páginas de privacidad y términos.
- Precio, cuando exista checkout.
- Confirmar la redacción sobre el libro.
- Imagen OG propia de CEO.
