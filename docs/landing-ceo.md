# Landing de MÊTIS CEO (www.metis.ceo)

El middleware reescribe `/` de metis.ceo hacia `/simulador`. La landing de Align (`/`) no se toca.
Copy y estado de funciones: `app/src/components/site/ceo-landing/content.ts`.

## Auditoría (antes del rediseño)

La landing anterior tenía hero animado, 3 pasos, 3 razones con visuales, precio de $59 MXN y el cierre «Mañana eres Director General».

- **Precio de $59 MXN.** Solo existe como constante (`CEO_PRICE_MXN`). No hay checkout, no hay cobro y no hay cancelación. «Cancela cuando quieras» no era verificable. Decisión: no publicar precio.
- **«Un caso nuevo cada día».** Es correcto: los asuntos llegan dentro del horario que elige el jugador y hay modo intensivo.
- **Libro.** Decisión del fundador: no se menciona en ninguna parte (app ni landing). Las frases de las Notas CEO se quedan, sin referencia.
- **Contacto.** `hola@metis.ceo` (`CEO_CONTACT_EMAIL`). Hay que crear el buzón o redirigirlo.
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

**En preparación (no se menciona en la landing):**
- respuestas escritas con retroalimentación (vista previa apagada)

**Futuro (no construido):**
- conversaciones abiertas
- escenarios generados
- retos entre jugadores
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
- Imagen OG propia de CEO.


## Regla de copy (decisión del fundador)

Nada de «próximamente», «en preparación» ni promesas a futuro en la app ni en la landing. Lo que no existe, no se menciona. Lo vigila `src/lib/ceo/no-futuro.test.ts`.

## Hoy y Boardroom Crisis (app)

- **Hoy:** sin tarjetas propias. La Boardroom Crisis, el reto final y la Junta aparecen como un asunto más en «Esperando tu decisión» (`lib/ceo/today.ts`). El dilema del día sale en ventana hasta que se contesta; «Recordar más tarde» lo pospone 2 horas.
- **Boardroom Crisis** (`/ceo/crisis`, `lib/ceo/crisis.ts`): sesión extraordinaria del consejo, una por empresa, desde el día 3 de la temporada. Tres decisiones encadenadas con 90 segundos cada una; si se acaba el tiempo, decide el consejo. Parte de los indicadores del día y el golpe crece con la exigencia. Resultado: contenida (60 XP), con daños (30) o rebasado (10). No toca los indicadores de la temporada ni las partidas doradas; se guarda en `s.crises`.
