# mêtis CEO · Executive Decision Episodes · P0-A

**Auditoría, arquitectura propuesta, contratos, migración, interfaz y roadmap reordenado**
Adenda v3.3 · prioridad P0 máxima · documento para aprobación de Oziel

---

## 0. Resumen en una página

La adenda v3.3 pide cambiar la unidad básica del juego: una notificación deja de ser «una pregunta con tres opciones» y se vuelve **un caso completo**. En ese caso investigas, consultas a tu equipo y tomas de 3 a 6 decisiones conectadas, con objeciones, nueva información y un cierre que deja huella en la empresa.

La auditoría encontró que **no hay que reconstruir nada**. Ya existen:

- la tubería de IA en servidor (candados, topes de gasto, bitácora y respaldo);
- el versionado de reglas;
- el diario de jugadas;
- la sincronización entre dispositivos;
- las pausas de vacaciones;
- los seguimientos condicionados (`trigger`), que son la semilla del grafo de consecuencias;
- el mapa de relaciones;
- el motor de dominio.

Lo que falta es una capa nueva, **aditiva**, que convive con los 52 casos actuales sin tocarlos:

1. Contratos versionados del episodio (`EpisodeSpec`, `EpisodeNode`, `FactBank`, `AdvisorBrief`, `EpisodeRun`, `DecisionTurn`, `CanonicalEvent`, `LearningEvidence`). Ya están en `app/src/lib/ceo/episodes/contracts.ts`.
2. Un motor puro del episodio con briefing de 180 s pausable, 2 consultas, 1 colaborador, 3–6 decisiones, cierre e XP una sola vez. Está en `episodes/engine.ts`, con reglas de cierre en `episodes/rules.ts`.
3. Una tarjeta continua para jugar el episodio, sin abrir pantallas nuevas por pregunta.
4. Una ruta de IA para el episodio que reutiliza los mismos candados y topes de `responder`.
5. Tablas aditivas en Supabase (propuesta en §6, **no se ejecuta sin tu aprobación**).

**Regla de publicación.** Todo lo nuevo queda en modo vista previa (entorno de pruebas o con interruptor apagado en producción) hasta que apruebes el estándar con los 15 chequeos de la §10. Los 52 casos quedan congelados hasta entonces.

---

## 1. Auditoría: qué existe hoy y qué se reutiliza

| Pieza actual | Archivo | ¿Sirve para episodios? | Cómo se reutiliza |
|---|---|---|---|
| Caso de una decisión (`Item`, 3 opciones, efectos en KPI por opción) | `types.ts`, `companies/*` | Parcial | Se conserva tal cual para partidas e historial. El episodio es un tipo nuevo; un `Item` puede «apuntar» a su episodio (el piloto SuperNorte usa los mismos hechos que `d2-supernorte`). |
| Seguimientos condicionados (`trigger: {item, options}`) | `cumbre-items.ts` y otros | Sí | Es el nivel 2 (grafo de consecuencias) en pequeño. El episodio genera `CanonicalEvent` de tipo seguimiento con fecha de activación. |
| Respuesta escrita con IA | `written.ts`, `api/ceo/responder` | Sí, casi completa | Se reutilizan los tres candados (interruptor `ai`, `CEO_AI_ENABLED`, consentimiento), la reserva atómica de gasto (`ai_reservar`/`ai_ajustar`), la bitácora `ai_calls`, el tiempo límite de 15 s y el respaldo «elige una opción». Mismo principio: la IA acerca tu texto a una estrategia ya diseñada y no inventa consecuencias. |
| Interruptores | `flags.ts`, `flags-server.ts` | Sí | Nuevo interruptor `episodes`, apagado por defecto. |
| Versionado de reglas | `rules.ts` (v1, v2) | Sí | El episodio guarda `contract` y `version` editorial. Una partida vieja nunca cambia de reglas. |
| Diario de jugadas y reproducción | `journal.ts`, `replay.ts`, `0018` | Sí | `replayEpisode()` reproduce un episodio desde sus acciones. Así el servidor puede validar, igual que con las decisiones de hoy. |
| Sincronización entre dispositivos | `sync.ts` | Sí | Los episodios viajan en la partida. Al mezclar se conserva la copia con más avance (`pickRun`), así que nunca se pierde progreso. |
| Vacaciones y pausas | `cadence.ts`, `pausetime.ts` | Sí | El episodio tiene su propia pausa: detiene el reloj del briefing. De vacaciones no se puede jugar, igual que hoy. |
| Mapa de relaciones (`stance`) | `relations.ts` | Sí | El episodio lleva una confianza con el interlocutor (−3…+3) que queda como evento canónico de relación. |
| Dominio (Mastery) | `mastery.ts` | Sí, con un ajuste | Hoy el dominio sale del puntaje de la opción. El episodio produce evidencia por dimensión de la rúbrica. En P0 se muestra en el cierre; conectarla al dominio es la tarea 1.7, en sombra. |
| XP v2 por participación | `engine.ts` (1.3) | Sí | Mismo criterio: 20 XP por decisión sustantiva y 40 por cerrar el caso, registrado una sola vez (`run.xp` se fija al cerrar). Las consultas no dan XP. |
| Academy | `lessons.ts`, `lessons2.ts` | Sí | El episodio declara su lección (`negociacion`) y su concepto. La lección se ofrece **después** del cierre, para no regalar la respuesta. |
| Meta del onboarding («14 decisiones») | `onboarding.ts` | Cambia | Pasa a «casos ejecutivos por semana». Se hace en la integración (P0-D/1.x), no en el piloto. |

**Lo que no sirve tal cual:**

1. Los efectos en KPI por opción. El episodio solo mueve indicadores al cerrar y con una regla económica declarada (§4.3).
2. El `score 0–3` por opción como «calificación». El episodio evalúa razonamiento por dimensión y no premia la opción diplomática por serlo.
3. La pantalla `CaseView` de una sola decisión. El episodio usa una tarjeta nueva (§5); `CaseView` se queda para los 52 casos.

---

## 2. Diff de arquitectura frente al blueprint actual

**Antes**

```
Notificación → Item (1 pregunta, 3 opciones) → efectos inmediatos en KPI → posible trigger
```

**Después** (convive con lo anterior)

```
Notificación → EpisodeSpec (versionado, aprobado)
   ├─ Briefing: FactBank (2 consultas) + AdvisorBrief (1 colaborador) · 180 s pausables · modo flexible
   ├─ EpisodeNode × 3–6: estrategias admisibles, parámetros acotados, texto libre (IA → estrategia)
   │     └─ memoria del episodio: términos, banderas, confianza, compromisos y riesgos
   └─ Cierre: reglas económicas del caso → acuerdo, compromisos, riesgos, KPI justificados,
              evidencia de rúbrica, seguimientos (CanonicalEvent con fecha) y lección
```

**Cuatro motores separados**, como pide la adenda en su §5:

| Motor | Qué decide | Dónde vive | ¿La IA puede tocarlo? |
|---|---|---|---|
| Narrativa | Qué nodos, estrategias y textos existen | `episodes/<caso>.ts` (contenido autorado y versionado) | No. Solo elige entre lo que existe. |
| Simulación | Términos, costo, caja, aceptación del cliente y KPI del cierre | `episodes/rules.ts` + reglas del caso | No. Son fórmulas puras con pruebas. |
| Aprendizaje | Evidencia por dimensión de la rúbrica, lección y repaso | `contracts.ts` (`LearningEvidence`) y luego `mastery.ts` | No. La evidencia sale de la estrategia validada. La nota de la IA queda como «provisional». |
| IA conversacional | Interpretar tu texto, dar voz al colaborador y entender tu pregunta | `api/ceo/episodio` (servidor) | Solo propone. Todo se valida contra los contratos y, si falla, entra el texto autorado. |

---

## 3. Contratos de datos (versionados)

Todos están en `app/src/lib/ceo/episodes/contracts.ts`, con `EPISODE_CONTRACT_VERSION = 1`. Cualquier cambio que rompa compatibilidad sube la versión, y las partidas guardadas con la anterior se siguen leyendo.

| Contrato | Para qué | Campos clave |
|---|---|---|
| `EpisodeSpec` | Identidad del caso | `id`, `version` (semver), `approval` (borrador/aprobado), empresa, sector, áreas, personajes, lección y concepto, minutos estimados, briefing, hechos, colaboradores, términos, nodos, seguimientos, `rules` |
| `EpisodeNode` | Una decisión sustantiva | etapa visible, quién habla, mensaje con memoria, información nueva (`reveal`), pregunta, estrategias admisibles, si acepta texto libre |
| `Strategy` | Una salida admisible del nodo | términos fijos y parámetros acotados, banderas, confianza, respuesta con memoria, ramas (`next`), evidencia de rúbrica, compromisos, riesgos |
| `FactBank` | Hechos verificables del caso | hechos (con fuente y `critical` para seguridad o ley), datos que el caso declara inexistentes y respuesta cuando no hay dato |
| `AdvisorBrief` | Un colaborador consultable | función, personalidad, intereses, relaciones, hechos a los que tiene acceso y respuesta autorada con variantes según tu historia |
| `EpisodeRun` | Tu partida del episodio | fase, pausa, nodo, banderas, términos, confianza, reloj del briefing, consultas, colaborador, decisiones, resultado, XP una sola vez |
| `DecisionTurn` | Una decisión comprometida | qué hiciste (opción, términos o texto), estrategia validada, términos, interpretación de la IA, respuesta del personaje |
| `CanonicalEvent` | Lo que queda en la empresa | tipo (acuerdo, compromiso, riesgo, relación, KPI, seguimiento), causa (episodio, versión, nodo), regla que lo justifica, fecha de activación |
| `LearningEvidence` | Evidencia de aprendizaje | dimensión de la rúbrica, nivel 0–3, base observable, nodo y confiabilidad (`autor` o `ia_provisional`) |

**Memoria de los personajes.** Los textos usan variantes con condición (`when`) y marcadores `{t:plazo}` que se sustituyen por lo pactado. Así Sofía, Lucía o Héctor dicen «los 60 días que acordamos» con el número real de tu partida.

---

## 4. Reglas del episodio

### 4.1 Briefing (adenda §3)

- El reloj empieza al abrir el caso, no al recibir la notificación.
- Dura 180 s y **solo bloquea las consultas**. Al vencer puedes seguir pensando y decidir sin perder XP ni dominio, y nada se elige por ti.
- Pausar detiene el reloj. El **modo flexible** lo quita por completo; es una opción de accesibilidad, visible en la tarjeta y sin penalización.
- Tienes 2 consultas de hechos, sugeridas o escritas. La respuesta sale **solo** del FactBank. Si el dato no existe, se dice: «ese dato no existe todavía». Si la pregunta no corresponde a nada, o si falla el sistema, la consulta **no se consume**.
- Tienes 1 consulta a un colaborador. Habla desde su función e intereses y nunca dice «elige B».
- Los hechos marcados como `critical` (seguridad o ley) se muestran siempre y no cuentan contra el límite.
- «Comenzar a decidir» está disponible desde el primer segundo.

### 4.2 Decisiones

- Cada episodio tiene de 3 a 6 decisiones sustantivas en cualquier ruta. Hay una prueba automática que recorre **todas** las rutas posibles y lo comprueba.
- Puedes responder eligiendo una estrategia, ajustando términos (descuento, plazo, inversión) dentro de límites, o escribiendo. Si escribes, la IA acerca tu texto a una estrategia admisible y la tarjeta te muestra cómo se interpretó. Si la IA no está disponible, eliges a mano.
- Las ramas se separan y luego se reúnen con justificación. Por ejemplo, dos jugadores llegan a la misma reunión de cierre, pero con términos, confianza y riesgos distintos.

### 4.3 Cierre y KPI (adenda §6 y §7)

- Ninguna respuesta suelta mueve indicadores. Al cerrar, las reglas económicas del caso calculan:
  - el costo anual de lo concedido;
  - la caja que se compromete;
  - si el cliente acepta, acepta en parte o reasigna anaquel;
  - de ahí, los cambios en KPI, cada uno con su porqué escrito, con un tope de ±10 por episodio.
- Los factores fuera de tu control (por ejemplo, que la marca regional sí tenga capacidad) son reproducibles por partida. El cierre los nombra aparte para distinguir **razonamiento** de **suerte**.
- **XP.** 20 por decisión sustantiva más 40 al cerrar, registrado una sola vez. Recargar o repetir acciones no lo duplica.
- **Dominio.** La rúbrica tiene 9 dimensiones: problema, información, riesgos, alternativas, consecuencias, negociación, coherencia, ejecución y adaptación. Cada estrategia declara qué evidencia produce y con qué base. Aceptar todo «para quedar bien» no da evidencia alta, y defender sin datos tampoco.

---

## 5. Propuesta de interfaz: una sola tarjeta

La ruta es `/ceo/episodio/[id]`. Respeta la identidad actual (blanco, índigo y tinta, sin emojis) y funciona en móvil y escritorio.

1. **Encabezado fijo**
   - Muestra empresa, interlocutor con avatar, asunto, etapa («Preparación», «Postura», «Propuesta», «Objeción», «Defensa», «Cierre») y estado (En preparación, Decidiendo, En pausa, Cerrado).
   - Incluye el reloj del briefing, la barra de 3–6 decisiones y el botón Pausar.
2. **Hilo continuo**, que crece hacia abajo:
   - el mensaje original y el contexto;
   - las consultas con sus respuestas;
   - la opinión del colaborador;
   - cada decisión con lo que respondiste;
   - la contestación del personaje;
   - la información nueva cuando aparece.
3. **Panel de acción**, al pie del hilo:
   - En preparación muestra tres botones (Comenzar a decidir, Consultar información, Consultar a mi equipo), las sugerencias y un campo libre.
   - Al decidir muestra las estrategias como tarjetas. Si una tiene términos, aparecen controles deslizantes con el costo calculado en vivo. También hay una pestaña «Escribir mi respuesta».
4. **Cierre** dentro de la misma tarjeta:
   - Esto se acordó: términos.
   - Números del acuerdo: costo y caja.
   - Compromisos y responsables.
   - Riesgos abiertos.
   - Qué pasará después: seguimientos con fecha.
   - Tu razonamiento, por dimensión.
   - Lo que estuvo fuera de tu control.
   - Concepto y lección de Academy.

---

## 6. Supabase: migración propuesta (aditiva, no ejecutada)

El archivo es `app/supabase/migrations/0019_ceo_episodios.sql`, y su reversa `docs/sql/0019_revertir.sql`. Solo **agrega** cosas en el esquema `ceo`, no toca `metis` y se puede correr varias veces.

1. `ceo.episode_runs`
   - Una fila por partida de episodio, con `run_id`, `user_id`, `episode_id`, versión, fase, estado JSON, XP y fechas.
   - Lleva `unique(user_id, episode_id, run_id)` para que no haya duplicados.
   - RLS: cada jugador lee lo suyo; solo el servidor escribe.
2. `ceo.episode_turns`
   - Diario de acciones del episodio, append-only, con `idempotency_key` única. Reintentar no duplica.
3. `ceo.company_events`
   - Eventos canónicos: acuerdos, compromisos, riesgos y seguimientos con `activates_at`. Es la memoria de la empresa.
4. Interruptor `episodes` en `ceo.flags`, **apagado**.

**Mientras no la ejecutes**, el piloto guarda el episodio dentro de la partida actual (`state.episodes`), que ya se sincroniza con tu cuenta en `ceo.players.state`. No se pierde nada y no hace falta tocar producción para probarlo. Las tablas sirven para el paso siguiente: que el servidor sea la fuente de verdad, reportes y la memoria de largo plazo para la IA.

---

## 7. Integración de IA

Hay una ruta nueva, `api/ceo/episodio`, que reutiliza **exactamente** los candados y topes de `responder` (mismo presupuesto mensual de $50, diario de $3 y por jugador). Tiene tres usos:

| Uso | Entrada | Salida validada | Respaldo si falla |
|---|---|---|---|
| Entender tu pregunta de hechos | tu texto + lista de ids de hechos (sin respuestas) | `{factId}` de la lista, o «ninguno» | búsqueda por palabras clave en el FactBank, que no gasta |
| Voz del colaborador | ficha del colaborador + solo los hechos que él conoce + tu historia | texto ≤ 600 caracteres, sin emojis, revisado para que no contenga cifras que no estén en sus hechos | respuesta autorada del colaborador |
| Interpretar tu respuesta libre | nodo + estrategias admisibles (ids) + lo pactado hasta ahora + tu texto | `{strategy, params?, quality, feedback}`, con estrategia de la lista y parámetros recortados a sus límites | eliges la estrategia a mano |

**Calidad y seguridad**

- El texto del jugador va siempre entre etiquetas y se trata como dato; se ignoran instrucciones dentro de él.
- Temperatura 0.2 y salida JSON.
- Validación estricta: si el número citado no existe en los hechos permitidos, la respuesta se descarta y se usa la autorada.

**Costo estimado** (gpt-4o-mini):

- ≈ $0.0004 por llamada; un episodio completo con todo por IA usa unas 7 llamadas, ≈ $0.003.
- Con 300 episodios al mes, ≈ $1, muy por debajo del tope de $50.

**Evaluación (entregable 8)**

- Un conjunto de 30 respuestas escritas de prueba por nodo del piloto, con la estrategia esperada.
- Se mide el acierto de la estrategia, la consistencia (misma respuesta → misma estrategia en 3 corridas), la tasa de respaldo y el costo real en `ai_calls`.
- Se corre en el entorno de pruebas **con tu autorización**, porque gasta (estimado < $0.50).

---

## 8. Cómo se conservan los casos históricos

- Los 52 casos, las partidas doradas, las reglas v1/v2 y el historial **no cambian**. El episodio es un tipo nuevo, con sus propias pruebas.
- El caso `d2-supernorte` sigue existiendo. Cuando apruebes el estándar, la integración hará que, para temporadas nuevas, la notificación de SuperNorte abra el episodio, y que las partidas en curso conserven el caso de una decisión. Es la misma lógica que con las reglas versionadas.
- No hay migraciones destructivas. La 0019 es aditiva y trae su reversa.

---

## 9. Roadmap reordenado

| Orden | Paso | Estado |
|---|---|---|
| Hecho | Fase 0, 1.0, 1.1, 1.2, 1.3 | Publicado |
| **P0-A** | Auditoría, arquitectura, contratos, motor del episodio con pruebas, propuesta de migración e interfaz | Este PR |
| **P0-B** | Piloto SuperNorte completo: briefing, consultas, colaborador, texto libre, 5–6 decisiones, rutas divergentes, cierre, lección y persistencia (vista previa) | Siguiente PR |
| **P0-C** | Piloto de Personas (conversación abierta con un colaborador) y piloto de crisis (operativa o ética, con obligaciones no negociables) | Después |
| **P0-D** | Validación de los 15 chequeos, evaluación de IA (con tu permiso de gasto), prueba en móvil y escritorio, y tu aprobación | Después |
| 1.4–1.9 | DecisionSpec v3 (se absorbe en `EpisodeSpec`), Workbench (se absorbe en la tarjeta), debrief IA en sombra, variantes, rotación | En pausa hasta aprobar P0 |
| Contenido | Llevar los 52 casos al nuevo estándar | Congelado hasta validar P0 |

**Nota.** La 1.4 (DecisionSpec v3) y la 1.6 (Workbench) quedan prácticamente cubiertas por los contratos y la tarjeta del episodio, así que el roadmap se acorta.

---

## 10. Pruebas de aceptación (técnicas y pedagógicas)

Corresponden a los 15 chequeos de la adenda. Las que son automáticas viven en `episodes/*.test.ts`.

| # | Chequeo | Cómo se comprueba |
|---|---|---|
| 1 | 3–6 decisiones | Prueba que recorre todas las rutas del grafo |
| 2 | 2 consultas de hechos | Prueba: la tercera se rechaza; un fallo o una pregunta sin dato no consume |
| 3 | Colaborador | Prueba: 1 por episodio; su respuesta no nombra estrategias ni «la correcta» |
| 4 | Briefing de 180 s | Prueba: al vencer, las consultas se bloquean y la decisión no |
| 5 | Avanzar sin usar las consultas | Prueba: «Comenzar» en el segundo 0 |
| 6 | Pausar y reanudar | Prueba: el reloj no corre en pausa; la partida se reconstruye tras recargar |
| 7 | IA interpreta texto libre | Evaluación con 30 respuestas por nodo (§7) y respaldo probado |
| 8 | Personajes recuerdan acuerdos | Prueba: los textos citan los términos de la partida |
| 9 | Sin KPI arbitrarios | Prueba: ninguna decisión intermedia cambia KPI; el cierre trae el porqué de cada cambio |
| 10 | Enseña un concepto | El cierre muestra concepto, lección y evidencia por dimensión |
| 11 | Dos rutas coherentes | Prueba con dos jugadores: acuerdos y seguimientos distintos y consistentes |
| 12 | La empresa recuerda | Prueba: los seguimientos se generan con fecha según el acuerdo |
| 13 | Academy contextual | La lección se ofrece al cerrar, nunca antes (no regala la respuesta) |
| 14 | No se pierde progreso | Pruebas de sincronización (`pickRun`) y de que la suite actual y las partidas doradas pasan |
| 15 | Móvil y escritorio | Capturas en ambos tamaños |

---

## 11. Lo que necesito que apruebes

1. Que esta arquitectura y este roadmap reordenado sustituyan a la 1.4–1.9 por ahora.
2. Que el piloto se publique **solo en vista previa** (entorno de pruebas o interruptor `episodes` apagado en producción) hasta que valides los 15 chequeos.
3. Más adelante, ejecutar tú la migración 0019 en producción (es aditiva) y autorizar el gasto de la evaluación de IA en el entorno de pruebas (< $0.50).
