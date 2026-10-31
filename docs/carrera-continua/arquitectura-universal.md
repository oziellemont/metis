# Arquitectura universal de decisiones adaptada por industria

Versión 1 · 31 de octubre de 2026 · nota de Oziel integrada al plan P0 (paso 2, P0-B2).

> **La industria define el escenario. Las decisiones desarrollan al CEO.**

Este documento fija cómo se organiza el aprendizaje en la carrera continua. Se apoya en el plan P0-A (`p0a-plan.md`), en la adenda del Atlas (`p0a-adenda-atlas.md`) y en el Atlas Maestro (`atlas-maestro-v1.md`). No reemplaza ninguno de los sistemas que ya existen: casos aprobados, episodios ejecutivos, dominio (mastery), Academy, palancas de cambio, crisis y Junta ante el Consejo siguen igual.

---

## 1. Un núcleo de aprendizaje y muchos escenarios

Hay **un solo núcleo**: diez competencias que todo CEO practica en cualquier industria. Lo que cambia de una industria a otra es el escenario: los números, los tiempos, los riesgos, la regulación, los indicadores y las consecuencias. Una decisión de «aceptar o no un pedido grande con margen bajo» se aprende igual en botanas que en software. Lo que cambia es qué significa: inventario y capacidad de planta en un caso, carga del equipo de producto y riesgo de churn en el otro.

## 2. Las 10 competencias y su relación con el dominio actual

El dominio que ya mide el simulador (`lib/ceo/mastery.ts`) tiene 8 competencias. **No se reescribe.** Las 10 competencias de Oziel son la capa editorial y se proyectan sobre esas 8. Así el avance de hoy sigue valiendo y cada caso nuevo se etiqueta con las 10.

| # | Competencia (editorial) | Dominio actual que la mide | Nota |
|---|---|---|---|
| 1 | Liderazgo y personas | `personas` | Directa. |
| 2 | Finanzas y capital | `finanzas` | Directa. Incluye caja, deuda y asignación de capital. |
| 3 | Estrategia y crecimiento | `estrategia` | Directa. |
| 4 | Operaciones | `ejecucion` | Directa (ejecución y operación). |
| 5 | Marketing, ventas y clientes | `mercado` | Directa (mercado y clientes). |
| 6 | Negociación | `negociacion` | Directa. |
| 7 | Cultura | `etica` + `personas` | Hoy «Ética y cultura» la cubre en parte. |
| 8 | Innovación y transformación | `estrategia` + `ejecucion` | Sin equivalente directo. Las palancas de cambio la practican desde hoy. |
| 9 | Riesgos y crisis | `ejecucion` + `etica` + `comunicacion` | La Boardroom Crisis y el lote L-2291 ya la practican. |
| 10 | Gobierno y consejo | `comunicacion` + `etica` | La Junta ante el Consejo y el indicador «consejo» ya la practican. |

`comunicacion` (comunicación e influencia) atraviesa las diez: no es un tema aparte, es la forma en que se ejecuta cada decisión.

**Cuándo cambiar el dominio:** si más adelante queremos medir por separado Innovación, Riesgos y Gobierno, se agrega una **versión nueva** del dominio con las 10 competencias y una tabla de conversión desde las 8. Nunca se edita la versión publicada (la misma regla que en `rules.ts`).

## 3. Biblioteca central de arquetipos de decisión ejecutiva

Un **arquetipo** es una decisión típica de dirección, sin industria: «el cliente grande que pide descuento», «el director veterano que esperaba tu puesto», «crecer con deuda o con caja», «el proveedor barato que puede salir caro», «el incidente que todavía no es público».

- **Fuente inicial:** las 160 semillas del Atlas (20 familias A–T × 8, ids `CEO-A01`…`EXT-T08`) más los 55 casos aprobados de Cumbre, Forja y Brasa y los 3 episodios ejecutivos.
- **Cada arquetipo declara:** competencia principal y secundarias, objetivo de aprendizaje, tensiones (qué se gana y qué se arriesga), tipos de rama del Atlas (inmediata, diferida, de relación, de información, contingente, reversible, externa, compuesta), variables que puede tocar y criterios del juez pedagógico.
- **Un arquetipo no es un caso.** Es la estructura de la decisión. El caso aparece cuando se adapta a una industria y a una empresa concreta.

## 4. Adaptación sectorial: profunda, no cosmética

Cambiar «botanas» por «software» en el texto **no es adaptar**. La prueba de fugas de nombres (`career/template.test.ts`) evita errores de nombre, pero la adaptación real exige que cambien:

| Qué cambia | Ejemplo · alimentos y bebidas | Ejemplo · software y SaaS |
|---|---|---|
| Opciones | Promoción conjunta, cambio de gramaje, exhibidor | Descuento por contrato anual, módulo extra, SLA |
| Restricciones | Capacidad de línea, caducidad, NOM-051 | Capacidad del equipo de producto, deuda técnica |
| Tiempos | Ciclo de pedido de semanas | Renovación anual, ciclo de venta de meses |
| Riesgos | Lote contaminado, merma, alza del aceite | Caída del servicio, fuga de datos, churn |
| Indicadores | Margen bruto, rotación en anaquel, merma | MRR, churn, CAC, runway |
| Consecuencias | Retiro de producto, delisting de una cadena | Cancelaciones, ronda de inversión en riesgo |
| Conceptos (Academy) | Ingeniería de surtido, sell-out | Unit economics, cohortes |

Cada adaptación es una ficha revisable (y aprobable) por Oziel, igual que hoy se aprueban los episodios.

## 5. Proporción editorial: cerca de 70 / 30

Como **guía, no como cuota**: cerca del 70% de los casos de una industria salen de arquetipos reutilizables adaptados a fondo, y cerca del 30% son **casos exclusivos de la industria**, que solo tienen sentido ahí. Por ejemplo: el PPAP y el cambio de ingeniería de la armadora en autopartes, la recertificación sanitaria en alimentos, la caída de un proveedor de nube en SaaS o la temporada de huracanes en logística del Golfo. Si una industria necesita más casos exclusivos, se escriben. La proporción sirve para detectar si una industria quedó genérica o si estamos duplicando esfuerzo.

## 6. La cadena modular

Todo caso, escrito a mano o generado por el motor, recorre la misma cadena. Cada eslabón es un dato versionado, no texto suelto:

1. **Competencia**: qué se desarrolla (una principal y hasta dos secundarias).
2. **Arquetipo**: la estructura de la decisión (biblioteca central).
3. **Adaptación sectorial**: opciones, restricciones, tiempos, riesgos, indicadores y conceptos de la industria (catálogo v2).
4. **Contexto de empresa**: tipo (PYME / startup en operación / establecida), etapa, tamaño, exposición (ciudad, sitios, proveedores, monedas) y nombre propio (`CompanyProfile`).
5. **Opciones**: de 2 a 4, sin opción dominante (el validador lo revisa con `dominates`).
6. **Consecuencias**: el motor determinista calcula los efectos en los indicadores y en el negocio. La IA propone y narra, pero no decide números.
7. **Aprendizaje**: evidencia de criterio para el dominio (separada de los resultados del negocio).
8. **Seguimiento**: lo que regresa días o meses después (detonadores, follow-ups de episodios, `company_events`).

## 7. Memoria de la empresa

La empresa recuerda, en capas separadas: decisiones, finanzas, relaciones (mapa de stakeholders), proyectos, riesgos abiertos, resultados y competencias practicadas. Lo que ya existe se reutiliza: `decisions`, `career`, relaciones, `episodes` y `ceo.company_events` (0019). Lo nuevo se agrega en P0-C/P0-D: `BusinessLog`, periodos y reportes mensuales. Todo se ata a `companyId`, que no cambia al renombrar.

## 8. Resultados del negocio separados del aprendizaje

Una empresa puede tener un mes malo por un evento externo aunque el CEO haya decidido bien, y un mes bueno por suerte. Por eso hay dos lecturas:

- **Negocio:** ventas, margen, EBITDA, caja y los 5 índices. Es lo que ve el consejo.
- **Aprendizaje:** calidad del criterio (dominio, rúbricas de episodios, 8 dimensiones del juez). Es lo que mide a la persona.

Nunca se mezclan en un solo número. El XP sigue premiando participación, no «elegir la buena».

## 9. Catálogo v2 (lógica SCIAN / INEGI)

Corrección de Oziel aplicada en `app/src/lib/ceo/career/taxonomy.ts` (`TAXONOMY_VERSION = 2`): 17 sectores y 59 industrias. Las ramas finas (botanas, arneses, 3PL…) son **especialidades** dentro de una industria, no industrias aparte.

| Sector (`id`) | Industria (`id`) | Paquete hoy | Estado |
|---|---|---|---|
| Manufactura (`manufactura`) | Alimentos y bebidas (`alimentos_bebidas`) | Cumbre | Jugable: establecida |
| Manufactura (`manufactura`) | Autopartes (`autopartes`) | Forja | Jugable: establecida |
| Manufactura (`manufactura`) | Manufactura industrial general (`manufactura_general`) | — | Paquete nuevo |
| Restaurantes y servicios de alimentos (`restaurantes_alimentos`) | Restaurantes (`restaurantes`) | Brasa | Jugable: establecida |
| Tecnología e información (`tecnologia_informacion`) | Software y SaaS (`software_saas`) | — | Paquete nuevo (prioridad) |
| Comercio (`comercio`) | Retail (`retail`) | — | Paquete nuevo |
| Transporte y almacenamiento (`transporte_almacenamiento`) | Logística y distribución (`logistica_distribucion`) | — | Paquete nuevo |

Los demás sectores (agro, minería, energía, construcción, inmobiliario, finanzas, servicios profesionales, salud, educación, alojamiento y turismo, esparcimiento, ambiental) ya están en el catálogo como no disponibles. Se abren agregando un paquete y un perfil de métricas, sin rehacer nada.

## 10. Qué quedó construido en el paso 2 (P0-B2)

- Identidad de la empresa (`career/identity.ts`): CEO nombrado, `companyId` estable, sector / industria / tipo, nombre y nombre corto, etapa, exposición ficticia y MXN como moneda base.
- Nombre propio en los textos (`career/template.ts`): los casos, el elenco, los episodios y los correos del paquete muestran el nombre del jugador. Ids, efectos y números no cambian. También resuelve las variables `{company_name}`, `{company_short}`, `{company_city}` y `{company_domain}` para el contenido nuevo.
- Reglas v4 «carrera continua»: al cerrar el periodo se sigue en la misma empresa. No es la versión por omisión, porque las temporadas siguen en v3.
- Acciones del diario `setupCompany` y `renameCompany`, que el servidor reproduce igual.
- Vista en dólares con un tipo de cambio de referencia fijo y versionado (`career/money.ts`), solo para la pantalla.
- Interruptor `carrera_continua`, apagado (migración 0020).

## 11. Siguientes pasos que dependen de este documento

- **P1-A:** esquema `ScenarioTemplate` con los campos de la cadena (§6). Inventario de los 55 casos por arquetipo y competencia. Fichas de adaptación para las 7 industrias foco.
- **P1-C:** el motor de casos genera dentro de la cadena. El validador revisa la adaptación profunda (§4) y el juez revisa el aprendizaje (§8).
