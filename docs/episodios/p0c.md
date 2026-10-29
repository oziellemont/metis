# P0-C · Pilotos de Personas y de Crisis

Estado: **borrador para aprobación de Oziel**. Los dos casos están en vista previa: solo se abren desde Ajustes → Modo prueba, no mueven la temporada y no se publican a jugadores mientras el flag `episodes` esté apagado.

Los dos usan el mismo motor que SuperNorte (P0-B): mismo recorrido por pasos (El caso, Investiga, Decides, Cierre, Aprendes), mismas reglas de validación (cada ruta tiene de 3 a 6 decisiones, toda opción es alcanzable, todo nodo tiene salida por defecto) y la misma separación entre razonamiento y suerte.

## Qué se agregó al motor (genérico, sirve para cualquier caso)

| Pieza | Qué hace |
| --- | --- |
| `obligations` | Obligaciones no negociables del caso. Se muestran desde el inicio en un recuadro «No negociable». No son opciones: el cierre dice, una por una, si se cumplieron, y se registra un evento por cada una (regla «obligación no negociable»). |
| `counterpart` | Con quién se mide la confianza del caso. En Diego, la relación es con Diego aunque el caso lo abre Mariana. |
| `preview` | Cifras que se recalculan en vivo al mover un término. Antes estaba fijo para SuperNorte (margen y caja); ahora cada caso declara las suyas. |
| Ajustes → Modo prueba | Lista todos los casos del catálogo, cada uno con «Abrir» y «Reiniciar». |

## Piloto 1 · Personas · «La conversación con Diego»

Diego Garza, gerente de marca e hijo del fundador, lleva propuestas directo a Don Ramiro y se brinca a Héctor, su jefe. Uno de esos cambios, un precio en la línea premium, ya se aplicó sin aprobación. Mariana te lo plantea. Tú preparas la conversación, la abres, manejas la reacción de Diego y cierras un acuerdo. Si Don Ramiro se entera por otro lado, o si la plática salió mal, te llama esa noche.

Etapas: Preparar → Apertura → Reacción → Acuerdo → (Don Ramiro). Son 4 o 5 decisiones, y en todas puedes contestar con tus palabras. Lección ligada: «Conversaciones difíciles».

**Datos nuevos que requieren tu aprobación**
- Tres propuestas en seis semanas sin pasar por Héctor: una campaña, un empaque y un cambio de precio.
- El cambio de precio se aplicó en 30 tiendas y bajó 2 puntos de margen ahí. La línea premium rota 1.3 contra una meta de 1.5.
- En el 360, su equipo lo describe como «brillante, pero no escucha». Dos de sus cuatro colaboradores pidieron cambio de área.
- La política: todo cambio de precio requiere la aprobación del Director Comercial y de Finanzas.
- Hay un 40% de probabilidad (reproducible por partida) de que alguien ya le haya contado a Don Ramiro.
- Si Diego es o no el sucesor no existe en el caso, y se dice así.

**Modelo**
- Hay acuerdo válido si tiene conducta concreta, Diego lo acepta (confianza ≥ 0) y no lo dejaste sin acuerdo.
- Equipo: +2 con acuerdo, +1 más si la relación queda en ≥ 2. −2 sin acuerdo. −1 si lo exhibiste frente a otros.
- Consejo: +1 si Don Ramiro lo supo por ti (avisaste antes o sostuviste el acuerdo en la llamada). −2 si cediste. −1 si evitaste el tema.

**Dos rutas de ejemplo**
- Avisar antes a Don Ramiro → abrir con hechos → reconocer su frustración → acuerdo concreto con seguimiento de 4 semanas. Resultado: equipo +3, consejo +1, sin llamada, y un 1 a 1 en 7 días.
- Que lo resuelva Héctor → «tienes un problema de actitud» → «deja de esconderte detrás de tu papá» → sin acuerdo → ceder ante Don Ramiro. Resultado: equipo −2, consejo −2, y «Diego volvió a hacerlo» en 14 días.

## Piloto 2 · Crisis · «Lote L-2291»

El proveedor de sazonador avisa que un lote pudo contaminarse con cacahuate, que la etiqueta de Picositas no declara. El producto ya está en tiendas, ya hay tres quejas y el laboratorio tarda 48 horas.

Hay tres **obligaciones no negociables**:
1. Retirar del anaquel todo el lote.
2. Avisar a la autoridad sanitaria en cuanto se conoce el riesgo.
3. Advertir con claridad a las personas alérgicas.

El jugador no las «elige». Decide cómo actuar, y el cierre dice si las cumplió. La obligación legal y el riesgo de salud se muestran siempre como «Dato crítico» y no gastan consultas.

Etapas: Contener → Autoridad → Comunicar → Costo → Causa. Son 4 o 5 decisiones. Lección ligada: «Las primeras 24 horas de una crisis».

**Datos nuevos que requieren tu aprobación**
- 18,000 bolsas: 70% en las 140 tiendas de SuperNorte, el resto en bodega y tránsito.
- Retiro total: $1.6 M. Retiro solo en las 12 tiendas con quejas: $0.4 M.
- El proveedor tiene 6 años sin incidentes, y el contrato permite reclamarle el costo de un retiro (se modela como recuperar el 50%).
- Hay un 25% de probabilidad (reproducible) de que una persona alérgica compre el producto. Solo causa una reacción si el producto seguía en anaquel.

**Modelo**
- Caja: −1 por cada $0.5 M que paga Cumbre.
- Clientes: +2 si se cumplen las tres obligaciones; si no, −2 por cada una incumplida, y −2 más si hubo una reacción.
- Consejo: −3 por cada obligación incumplida.
- Equipo: +1 si auditas al proveedor y pones controles; −2 si culpas en público a un operador.
- Ninguna métrica se mueve más de ±10 por caso (tope del motor).

**Dos rutas de ejemplo**
- Retiro total → avisar hoy → alerta pública → absorber y reclamar → auditar al proveedor. Resultado: las tres cumplidas, $0.8 M neto, caja −2, clientes +2, equipo +1.
- Esperar al laboratorio → avisar con el resultado → «retiro preventivo por calidad» → seguir esperando. Resultado: las tres incumplidas, clientes −6 (−8 con reacción), consejo −9.

## Cómo probarlo

En Ajustes → Modo prueba → «Casos ejecutivos», usa «Abrir La conversación con Diego» o «Abrir Lote L-2291». «Reiniciar» crea una partida nueva con otra semilla, así que el azar puede cambiar.

## Pruebas

`app/src/lib/ceo/episodes/pilotos.test.ts` (16 pruebas) cubre:
- la validación editorial de los dos grafos;
- las rutas contrastantes y sus efectos;
- la llamada de Don Ramiro según el azar y según si lo avisaste antes;
- el dato de sucesión, que no existe;
- que los datos críticos no gastan consultas;
- el recorte que rompe la obligación de retirar todo;
- las opciones condicionadas;
- la reacción, que solo cuenta si hubo exposición;
- el XP, que se da una sola vez.
