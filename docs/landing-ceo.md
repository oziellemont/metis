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

- Precio, cuando exista checkout.
- Revisión legal del aviso de privacidad y los términos antes de cobrar.

## Legal e imagen para compartir

- `metis.ceo/privacidad` y `metis.ceo/terminos` (el middleware las reescribe a `/legal/*`). Texto en `components/site/ceo-landing/legal-content.ts`. Describe solo lo que la app hace hoy y nombra a los proveedores (Supabase, Vercel, Resend, Twilio, OpenAI). Contacto: hola@metis.ceo. Pendiente de revisión por un abogado.
- Imagen para redes: `public/brand/ceo-og.jpg` (1200×630), usada por la landing y por /ceo.


## Regla de copy (decisión del fundador)

Nada de «próximamente», «en preparación» ni promesas a futuro en la app ni en la landing. Lo que no existe, no se menciona. Lo vigila `src/lib/ceo/no-futuro.test.ts`.

## Hoy y Boardroom Crisis (app)

- **Hoy:** sin tarjetas propias. La Boardroom Crisis, el reto final y la Junta aparecen como un asunto más en «Esperando tu decisión» (`lib/ceo/today.ts`). El dilema del día sale en ventana hasta que se contesta; «Recordar más tarde» lo pospone 2 horas.
- **Boardroom Crisis** (`/ceo/crisis`, `lib/ceo/crisis.ts`): sesión extraordinaria del consejo, una por empresa, desde el día 3 de la temporada. Tres decisiones encadenadas con 90 segundos cada una; si se acaba el tiempo, decide el consejo. Parte de los indicadores del día y el golpe crece con la exigencia. Resultado: contenida (60 XP), con daños (30) o rebasado (10). No toca los indicadores de la temporada ni las partidas doradas; se guarda en `s.crises`.

## Versión 3 (evaluación del fundador)

La página pasó de 12 bloques a 8, unos 22 a 24% más corta (13,754 → 10,763 px en móvil y 9,028 → 6,833 px en escritorio). El orden ahora es: Hero con la primera decisión, Efectos cruzados, Cómo funciona, La experiencia, Tu camino, Filosofía, Preguntas y Cierre.

**Secciones que se fusionaron**
- «A tu ritmo» quedó dentro de «Cómo funciona», que muestra la pantalla Hoy real.
- «Aprendizaje continuo» quedó dentro de «La experiencia», como el bloque «Al cerrar cada caso».
- «Para quién es» se volvió una frase en el hero.
- «Acceso» se unió al cierre (`#acceso`).
- La pregunta «¿Necesito crear una cuenta?» pasó al FAQ.

**Primera decisión**
- Héctor ahora escribe con su propia voz, como un mensaje real.
- Las tres opciones tienen argumentos creíbles. Aceptar protege el volumen, la planta y al equipo; ninguna opción queda más de un punto por encima de otra en el total.
- «Probar una decisión» resalta el caso y deja el foco en la primera opción. Solo desplaza la página si el caso no está a la vista.
- Al elegir, el resultado se lleva a la vista.

**Tu camino**
- Es una ruta visual: vertical en móvil y horizontal en escritorio. Las etapas aparecen una a una al entrar en pantalla (`Stagger.tsx`, sin animación con movimiento reducido) y solo llevan el nombre en inglés.
- Tiene un punto de partida (01), un siguiente objetivo (02) y las demás etapas por desbloquear.
- Después de Global CEO solo se menciona el modo Legendario, que ya existe. No se menciona Arena.

**Filosofía**
- Se agregó «Por qué creamos MÊTIS», contado de forma sobria y sin credenciales.

**Lo que no se tomó de la evaluación**
- No se muestra «Disponible hoy / Próximamente».
- La fila «∞ The Executive Arena» se sustituyó por el modo Legendario.
- Las dos cosas siguen la regla de no anunciar nada que no exista.

## Versión 3.1 · hero más limpio y una sola demo

- El hero vuelve a mostrar el cuadro de cuatro escenas (El caso, Decides, Aprendes, Avanzas) con el anillo «Tu camino a CEO». Componente `Story.tsx`; se pausa al pasar el mouse o al enfocar y no avanza solo con «reducir movimiento».
- La decisión de Héctor baja a su propio bloque, «Una decisión nunca afecta una sola cosa». Integra la antigua sección «Efectos cruzados»: después de elegir se ve «Hoy» y «Un mes después» en cinco dimensiones, con una frase concreta en cada una (por ejemplo, «En negociación», «Margen protegido»).
- Se eliminó `Ripple.tsx` y el bloque `RIPPLE`: eran una segunda demostración de lo mismo.
