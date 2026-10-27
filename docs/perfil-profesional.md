# Professional Profiling & Initial Assessment (requisito V33 · Fase 1)

Estado: **propuesta, pendiente de aprobación**. Propuesta visual: `propuesta-perfil/Perfil-Profesional-Propuesta.pdf` (fuera del repo).

## 1. Principio

Lo que el jugador **declara** (su experiencia) cambia **por dónde empieza y cómo se le acompaña**. Lo que **demuestra** en el simulador es lo único que cambia su **dominio, etapa, XP, ranking y nombramientos**. Nadie empieza arriba por tener años o un cargo: todos empiezan como Emerging Leader con dominio 0.

## 2. Flujo

Las preguntas se insertan en el onboarding actual, después del nombre y antes de elegir industria, sin quitar pasos existentes.

| # | Pregunta | Control | Valores (catálogo fijo) |
|---|---|---|---|
| 1 | Responsabilidad actual | Botones, una opción | `estudiante`, `especialista`, `coordinador`, `gerente`, `director`, `direccion`, `fundador`, `otro` |
| 2 | Áreas de experiencia | Chips, varias | `finanzas`, `operaciones`, `ventas`, `marketing`, `personas`, `estrategia`, `suministro`, `tecnologia`, `legal`, `emprendimiento` |
| 3 | Años de experiencia | Botones segmentados | `<2`, `2-5`, `6-10`, `11-15`, `15+` |
| 4 | Industria principal | Lista desplegable | 12 industrias (`consumo`, `manufactura`, `restaurantes`, `retail`, `financieros`, `tecnologia`, `salud`, `construccion`, `logistica`, `educacion`, `social`, `otra`) |
| 5 | Objetivo con MÊTIS | Botones, una opción | `ascenso`, `equipo`, `negocio`, `empresa_propia`, `entrevista`, `interes` |

Reglas:

- Cada pregunta tiene «Omitir». «Completar después» sale del bloque completo.
- Meta: 60–90 segundos.
- Al terminar se ofrece el **diagnóstico opcional** de 3 decisiones (cerca de 3 minutos). «Ahora no» lleva directo a elegir empresa.
- Pantalla «Tu punto de partida»: dos columnas separadas, **Experiencia declarada** y **Competencias demostradas** (dominio 0 y lectura inicial de confianza baja). Debajo, cómo se adapta su primera semana.

## 3. Datos

```ts
// Ambos opcionales dentro de CeoState (sin subir la versión del estado).
interface ProfessionalProfile {
  v: 1;
  role?: RoleId;
  areas?: AreaExpId[];
  years?: YearsBand;
  industry?: IndustryId;
  goal?: GoalId;
  skipped: ("role" | "areas" | "years" | "industry" | "goal")[];
  source: "onboarding" | "perfil" | "aviso";
  answeredAt: number;
  updatedAt: number;
  nudge?: { dismissed: number; until: number }; // aviso para usuarios actuales
}
interface InitialDiagnostic {
  v: 1;
  set: "d1";
  answers: { id: string; option: string; at: number }[]; // máx. 3
  finishedAt?: number;
  skippedAt?: number;
}
```

- Viajan en la partida que ya se guarda en `localStorage` (`metis-ceo-v1`) y en `ceo.players.state`. **No requiere migración de base de datos.** Si en el futuro hiciera falta consultar en SQL, se agrega una columna `jsonb` opcional (no destructiva).
- Solo catálogos y bandas. No hay texto libre, empresa, sueldo ni datos sensibles.
- Borrar la partida borra el perfil.
- Eventos de producto (tabla `ceo.product_events`, ya existente): `perfil_respondido` (duración, omitidas), `perfil_editado`, `diagnostico_hecho`, `diagnostico_saltado`, `aviso_perfil_visto`, `aviso_perfil_pospuesto`.

## 4. Uso (módulo puro `lib/ceo/profile.ts`)

| Consumidor | Qué recibe | Regla |
|---|---|---|
| Mastery Engine | **Nada** | `masteryOf` no lee `profile` ni `diagnostic`. |
| Executive Journey | **Nada** | `journeyOf`, `appoint` y requisitos no leen `profile` ni `diagnostic`. |
| XP y ranking | **Nada** | Sin cambios. |
| Curriculum Engine / Academy | `recommendOrder(profile, mastery, lectura)` | 1) necesidad demostrada (dominio bajo con evidencia); 2) si no hay evidencia, lectura inicial «por reforzar»; 3) áreas no declaradas; 4) áreas declaradas fuertes como «repaso opcional». **Nunca oculta** contenido. |
| Exploración | `explorationShare = 1/3` | En cada lista de recomendaciones, al menos 1 de cada 3 es de un área no declarada. |
| Ayuda en casos | `helpBand(profile)` → `completa` / `media` / `breve` | Por años y responsabilidad; sin perfil = `completa`. Solo cambia glosario y longitud de notas, nunca puntajes ni efectos. |
| Dificultad inicial | `suggestTier(profile)` | Solo **ofrece** exigencia alta en la primera empresa a perfiles con 11+ años o cargo de dirección; el jugador decide. Sin perfil = exigencia normal. |
| AI Executive Coach / Scenario Director | `aiContext(profile)` | Una línea («Director, operaciones y suministro, más de 15 años, manufactura, objetivo: ascenso»). Solo con `ai_consent`. La instrucción del sistema dice: «Evalúa la respuesta, no la experiencia declarada». |

### Lectura inicial del diagnóstico

- 3 decisiones con opciones de puntaje 0–3, ligadas a 6 de las 8 competencias.
- `initialReading(diagnostic, mastery)` → por competencia: `alta` (3), `media` (2), `reforzar` (0–1), `sin` (no medida).
- Peso: `1 − n/5`, donde `n` = decisiones reales con evidencia en esa competencia. Con `n ≥ 5` desaparece.
- Se usa solo para ordenar recomendaciones mientras no hay evidencia. No es dominio y no se muestra como número.

## 5. Usuarios actuales

- `migrate()` acepta estados sin `profile` ni `diagnostic`; todo funciona como hoy.
- Aviso en «Hoy» desde la segunda visita, nunca con un caso abierto. «Ahora no» lo pospone 7 días; tras 2 veces queda solo en Perfil.
- Entrada fija en Perfil: «Experiencia declarada · Completar».
- XP, racha, empresas, decisiones, lecciones, dominio y etapa **no se recalculan**.
- El diagnóstico se ofrece solo a quien tiene menos de 10 decisiones; con más, su evidencia real ya pesa más.

## 6. Plan de PRs

| PR | Contenido | Depende de |
|---|---|---|
| F1-P1 | `profile.ts` puro + catálogos + `migrate()` + pruebas | — |
| F1-P2 | Cinco preguntas en onboarding, omitir, «Completar después», edición en Perfil | F1-P1 |
| F1-P3 | Diagnóstico de 3 decisiones, lectura inicial, «Tu punto de partida» | F1-P1 |
| F1-P4 | Conexión con Academy, ayuda en casos, exigencia inicial, contexto IA, aviso a usuarios actuales, eventos | F1-P2, F1-P3 |

## 7. Criterios de aceptación y pruebas

| ID | Criterio | Prueba |
|---|---|---|
| P-01 | Las 5 preguntas se responden en ≤ 90 s (mediana interna) | Evento con duración; revisión manual |
| P-02 | Cada pregunta se puede omitir; «Completar después» sale del bloque | Componente: omitir registra `skipped` y avanza |
| P-03 | Las respuestas se editan en Perfil y persisten | Guardar, recargar, comparar |
| P-04 | Lo declarado nunca cambia dominio, etapa, XP ni ranking | Propiedad: para estados de partidas doradas × perfiles al azar, `masteryOf`, `journeyOf`, `xpOf` idénticos |
| P-05 | El diagnóstico no cuenta para requisitos ni nombramientos | `journeyOf` igual con o sin diagnóstico |
| P-06 | La lectura inicial decae y desaparece con 5 decisiones reales | Unitaria de peso |
| P-07 | ≥ 1 de cada 3 recomendaciones fuera de áreas declaradas | 100 perfiles al azar |
| P-08 | Veterano de operaciones y recién egresado de Finanzas reciben orden y ayuda distintos | Unitaria con ambos perfiles |
| P-09 | Usuarios actuales conservan todo su avance | `migrate()` sin perfil + partidas doradas sin cambios |
| P-10 | El contexto de IA solo sale con consentimiento y sin datos personales | Unitaria del armado del mensaje |
| P-11 | Sin emojis, estilo actual | Guardia `no-emoji.test.ts` + revisión visual |
