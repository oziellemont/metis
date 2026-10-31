# mêtis CEO · Carrera continua · P0-A: diagnóstico y plan de implementación

Estado: propuesta para aprobación de Oziel. No toca producción.
Fuente: `METIS_CEO_Cambio_Estrategico_P0_Carrera_Continua_v1.md` (§15 pide este documento antes de cualquier cambio).
Base de código revisada: `main` en `e01355e` (PR #122, reglas v3 con casos ejecutivos).

---

## 1. Interpretación (10 líneas)

1. El usuario es un **CEO nombrado** para dirigir una empresa que ya existe y opera. **Nunca es fundador**: no elige capital ni compra oficinas.
2. Arma **una sola empresa persistente** con sector, industria, tipo (PYME, startup en operación o establecida pequeña-mediana) y el nombre que él elija.
3. Esa empresa es su carrera principal. `advance()` ya no lo cambia de empresa al final de cada temporada.
4. Los casos llegan como la vida real de esa empresa. Las decisiones tienen consecuencias que se quedan, y los personajes son coherentes.
5. Además de los 5 índices de salud (0–100), la empresa tiene **números reales**: ingresos, margen, efectivo, clientes y equipo, en una sola moneda, calculados por una simulación determinista.
6. Usar la caja es parte del juego: contratar, invertir en marketing, salir a otro país, asignar presupuesto o guardar. Estas decisiones llegan **dentro de situaciones directivas**, no en una tienda de mejoras.
7. El tiempo del negocio (semanas o meses simulados) está separado del tiempo real. Unas vacaciones no destruyen la empresa, no hay game over y nadie despide al jugador en esta fase.
8. La empresa pasa por etapas (tomar el mando, estabilizar, construir capacidad, acelerar, escalar, gobernar). Lo que se aprende (XP, Academy, E1–E7) se mide aparte de la suerte del negocio.
9. Las Executive Rotations son misiones como invitado en otra industria, aisladas: no tocan las finanzas de tu empresa. Arena se sigue desbloqueando por dominio.
10. Se lanza detrás de una bandera, con 2–3 combinaciones impecables primero. Nunca se sobrescribe una carrera existente: el jugador elige si continúa la anterior o empieza la nueva.

---

## 2. Mapa real de lo afectado (verificado contra el código)

### 2.1 Motor y reglas (`app/src/lib/ceo/`)

| Archivo | Qué hace hoy | Impacto |
|---|---|---|
| `engine.ts` (780 líneas) | `CeoState.company` es el id de un paquete (`cumbre`/`forja`/`brasa`). Hace `packOf`, `entries`, `kpis`, `seasonDoneOf` (casos + proyecto de cambio), `verdictOf` (passLine, minAnswered), `advance` (aprobado: `nextCompanyOf` cambia de empresa; reprobado: repite), `switchCompany`, `fresh`, `migrate`. | **Alto.** En reglas V4, `advance` conserva la empresa y el veredicto deja de decidir el destino. Las reglas V1–V3 se quedan intactas. |
| `rules.ts` | Reglas versionadas V1, V2, V3 (actual). Una versión publicada nunca se edita. | Nueva **V4 «carrera continua»** (modo, periodos, sin cambio de empresa). |
| `types.ts` | `CeoState`, `CareerRun`, `Item` (casos con `day`, `slot`, `from`, `options`, `trigger`, efectos en índices). | Nuevos campos opcionales: `companyProfile`, `business`. |
| `companies/` (`cumbre.ts`, `cumbre-items.ts`, `forja.ts`, `brasa.ts`, `index.ts`) | Tres paquetes con nombre fijo («Botanas Cumbre», «Forja Norte», «Grupo Brasa»), elenco, `facts`, `kpiStart`, `season.days: 7`, glosario y relaciones. | Pasan a ser **paquetes de contenido** (`content_pack_id`). El nombre deja de estar fijo y se resuelve con plantillas. |
| `catalog.ts` (v1) | 8 industrias editoriales con empresas de nombre provisional (Sierra y Sal, Casa de Maíz…). Solo Cumbre, Forja y Brasa están `available`. | **Se reemplaza** por la taxonomía de 21 sectores con industrias. Los nombres provisionales pasan a ser sugerencias de nombre. |
| `profile.ts` (`companyForIndustry`), `onboarding.ts` (`homeIndustryId`, `homeCompanyVariantId`) | El onboarding elige industria y luego la empresa. | Se modifican para guardar `sector_id`, `industry_id`, `company_archetype` y `company_display_name`. |
| `journey.ts` | 6 etapas profesionales. Un ascenso pide «empresas aprobadas», mastery y XP. | **Incompatible:** «empresas aprobadas» deja de existir. Se reemplaza por hitos de tu empresa y retos (ver §3). |
| `board.ts`, `crisis.ts`, `change.ts`, `relations.ts` | Junta, crisis y proyecto de cambio, con acceso según la temporada. | El acceso pasa a depender de la etapa o del periodo. La lógica interna se conserva. |
| `episodes/catalog.ts` | `SEASON_EPISODES = { cumbre: [...] }` (días 2, 4 y 6). | La llave pasa a ser el paquete de contenido, con orden causal por periodo y no por día 1–7. |
| `replay.ts`, `journal.ts`, `/api/ceo/partida` | Diario de acciones del servidor y XP calculado en el servidor por versión de reglas. | Nuevas acciones (`setupCompany`, `renameCompany`, `allocate`, `closePeriod`), validadas en `sanitizeAction`. |
| `sync.ts`, `import.ts` | Unen el estado del navegador con el de la nube e importan partidas de invitado. | Deben unir `companyProfile` y `business` sin perder el `company_id`. |
| `schedule.ts`, `emails.ts`, `notify.ts` | Correos con `seasonKey = season:${company}:${n}`. | Llave por periodo de negocio. Los textos usan el nombre que eligió el usuario. |
| `cadence.ts`, `pausetime.ts` | Vacaciones y día tranquilo. | Se conservan. Con tiempo de negocio por avance, las vacaciones ya no dañan la empresa. |
| `flags.ts` | `ai`, `ai_shadow`, `events`, `game_journal`, `replay_shadow`, `episodes`. | Nueva bandera `carrera_continua`. |
| `golden/` | Partidas doradas que fijan el comportamiento V1–V3. | Se conservan sin cambios (prueban que lo anterior no se rompe). |

### 2.2 Pantallas (`components/ceo/`) y rutas (`app/ceo/...`)

| Ruta / componente | Hoy | Impacto |
|---|---|---|
| `/ceo/empezar` · `Onboarding.tsx` (239 líneas, 7 pasos) | Nombre → experiencia → industria → empresa fija → meta diaria → contacto → primera semana. | **Se reemplaza** (con bandera) por: carta de nombramiento → sector + industria → tipo → nombre → resumen ejecutivo. La meta diaria y el contacto se conservan como pasos finales cortos. |
| `/ceo/empresa` · `CompanyView.tsx` (76 líneas) | Ficha fija, botón «¿Prefieres otra industria?» (`switchCompany`), mapa (`OrgMap`), cómo te mide el consejo (passLine) y glosario. | **Se reemplaza** por el tablero ejecutivo (§6 del documento). `OrgMap` y el glosario se reutilizan en el detalle. |
| `/ceo/carrera` · `Career.tsx` | Lista de temporadas y empresas aprobadas. | Se modifica: muestra la historia de tu empresa por periodos y, aparte, tus rotaciones. |
| `/ceo` · `Today.tsx`, `/ceo/bandeja` · `InboxView.tsx` | Casos del día y casos ejecutivos. | Se conservan y suman el **reporte del periodo** cuando toca. |
| `/ceo/junta`, `/ceo/crisis`, `/ceo/cambio` | Se abren por temporada. | Se abren por etapa o periodo. |
| `/ceo/ranking` · `Ranking.tsx` | Ranking por XP (aprendizaje). | XP sigue siendo de aprendizaje y no depende de la suerte del negocio. Si algún día se ordena por salud de empresa, se separa por tipo. |
| `CeoShell.tsx` | Manda a `/ceo/empezar` si no hay `startedAt`. | Además ofrece «Continuar tu carrera anterior / Empezar nueva carrera MÊTIS». |
| Landing (`components/site/ceo-landing/content*.ts`) | Menciona a Cumbre. | Fuera del alcance de P0. Se actualizan los textos al lanzar. |

### 2.3 Base de datos (Supabase, esquema `ceo`)

- `ceo.players` (0013 + 0014/0015/0016): el estado completo vive en la columna `state` (JSON). Ya existen `home_industry_id` y `home_company_variant_id`.
- `ceo.game_events` y `ceo.game_runs` (0015, 0018): diario de acciones con `run_id`.
- `ceo.episode_runs`, `ceo.episode_turns` y `ceo.company_events` (0019).
- **Propuesta:** migración **0020, solo aditiva**. Agrega a `ceo.players` las columnas `company_id uuid`, `sector_id`, `industry_id`, `company_archetype` y `company_display_name` (para soporte y analítica; la verdad sigue en el JSON y en el diario). No se borra ni se renombra nada, así que la reversa es trivial.

### 2.4 Banco de casos (contado en el código)

| Paquete | Casos | Consecuencias encadenadas (`trigger`) | Menciones al nombre fijo en el texto |
|---|---|---|---|
| Cumbre (Alimentos · botanas) | 20 | 7 | 15 en casos, más 9 en SuperNorte, 5 en alérgeno y 3 en Diego |
| Forja (Manufactura · autopartes) | 17 | 4 | 7 |
| Brasa (Restaurantes) | 15 | 3 | 27 |
| Casos ejecutivos (episodios) | 3 | — | ya contados arriba |
| **Total** | **55** (52 + 3) | 14 | — |

Hay que resolver cada una de esas menciones con plantillas (`{company_name}`, `{company_short}`). Una prueba debe impedir que «Botanas Cumbre», «Forja Norte» o «Grupo Brasa» aparezcan en una empresa con otro nombre (§14 del documento).

---

## 3. Qué se conserva, qué se modifica y qué se reemplaza

**Se conserva sin cambios:** Academy y lecciones, mastery y competencias (E1–E7), evaluación (`written.ts`, IA en sombra), XP de participación, perfil, vacaciones y día tranquilo, diario del servidor, banderas, episodios (motor, IA y validación), relaciones y `OrgMap`, el glosario, las partidas doradas, la importación de invitado y todas las reglas V1–V3, con las partidas que ya existen.

**Se modifica:** el motor (V4 junto a V3), los paquetes de contenido (plantillas de nombre y etiquetas por tipo), la carrera (`Career.tsx`), Hoy/Bandeja (reporte del periodo), el acceso a junta, crisis y cambio, los correos, `sync`/`import`, el diario (acciones nuevas) y el catálogo de episodios (por paquete y periodo).

**Se reemplaza (solo en V4; V1–V3 se quedan como están):** el onboarding, la pantalla Empresa, el catálogo v1 de industrias, `nextCompanyOf`/`switchCompany` y el veredicto de 7 días como destino de la carrera.

**Incompatibilidades exactas con el roadmap anterior:**

1. **Cambio automático de empresa al aprobar** (`advance` → `nextCompanyOf`; el tier sube por empresas aprobadas). Contradice el innegociable 2. En V4 desaparece y el tier pasa a depender de la etapa de tu empresa.
2. **«Cambia de industria antes de tu primera decisión»** (`CompanyView` → `switchCompany`). En V4 solo se puede renombrar (se conserva `company_id`). Cambiar de industria significa empezar una carrera nueva, con confirmación.
3. **Journey: «empresas aprobadas» como requisito de ascenso.** Se reemplaza por hitos de tu empresa (llegar a cierta etapa, cerrar periodos con reporte) y por las rotaciones como invitado completadas. Mastery y el piso de XP se quedan. Los rangos ya ganados se congelan, igual que se hizo con `enrollJourney`.
4. **Veredicto con passLine al día 7 como «ascenso o repetir».** En V4 se convierte en una **revisión del consejo** al cerrar etapa. Retroalimenta, pero no hay game over ni despido, y el índice del consejo baja o sube sin echarte.
5. **Catálogo v1 de 8 industrias con empresas de nombre provisional.** Lo sustituye la taxonomía de 21 sectores. Las empresas provisionales dejan de ser jugables por sí solas.
6. **Episodios fijos en los días 2, 4 y 6 de Cumbre.** Pasan a ordenarse por periodo y a depender del paquete y del tipo de empresa.
7. **Roadmap pendiente de episodios para Forja y Brasa.** Se reorienta: esos paquetes servirán a la vez como empresa principal (si eliges esa industria) y como **rotación como invitado**. Escribir episodios para ellos sigue siendo útil.

---

## 4. Estructura de datos y motor mínimo

### 4.1 Identidad (nuevo, opcional en `CeoState`)

```ts
type CompanyArchetype = "pyme" | "startup" | "establecida";

interface CompanyProfile {
  companyId: string;            // uuid; no cambia al renombrar
  sectorId: string;             // "alimentos_bebidas"
  industryId: string;           // "botanas_snacks"
  archetype: CompanyArchetype;
  displayName: string;          // "Casa Norte Alimentos" (2–40 caracteres)
  shortName: string;            // "Casa Norte" (derivado y editable)
  contentPackId: string;        // "cumbre" (paquete de casos; el usuario no ve este id)
  simulationProfileId: string;  // "consumo_planta"
  metricProfileId: string;      // "consumo"
  currency: "MXN";
  userRole: "appointed_ceo";
  appointedAt: number;          // momento en que la empresa existe (antes de la primera decisión)
  renamedAt?: number;
}
```

`CeoState` suma `careerMode?: "temporadas" | "continua"` (sin el campo equivale a «temporadas», es decir, todas las partidas actuales), `companyProfile?: CompanyProfile` y `business?: BusinessLog`.

### 4.2 Catálogo de la taxonomía (datos puros)

```ts
interface IndustryEntry {
  sectorId: string; industryId: string; displayLabel: string;
  aliases: string[];                       // "snacks", "botanas", "saas", "fintech"...
  availability: "available" | "coming_soon";
  supportedArchetypes: CompanyArchetype[]; // solo los que tienen contenido aprobado
  contentPackId?: string; simulationProfileId?: string; metricProfileId?: string;
}
```

Cuenta con los 21 sectores del documento. La búsqueda por sinónimo **sugiere** el par sector e industria, pero no lo selecciona sola. Si una combinación no tiene contenido, aparece como «Próximamente» y queda bloqueada.

### 4.3 Negocio: se guarda lo mínimo y se reconstruye todo

Solo se guardan **eventos**: decisiones de casos (ya existen) y asignaciones de caja (nuevas). Todo lo demás lo calcula una función pura:

```ts
interface BusinessLog {
  assumptionsVersion: number;     // supuestos versionados, como las reglas
  closedPeriods: number;          // meses simulados cerrados
  allocations: Allocation[];      // decisiones de caja
}
interface Allocation {
  id: string; period: number;     // periodo en que se decidió
  lever: "contratar" | "marketing" | "internacional" | "capex" | "reserva" | "deuda";
  amount: number;                 // MXN por mes o único, según la palanca
  months?: number;
}
// businessOf(state) => { periods: PeriodState[], now: PeriodState }
interface PeriodState {
  period: number; revenue: number; grossMargin: number; grossProfit: number;
  payroll: number; marketing: number; otherOpex: number; ebitda: number;
  workingCapital: number; capex: number;
  cashBegin: number; inflows: number; outflows: number; cashEnd: number;   // cashEnd = begin + inflows - outflows
  runwayMonths: number | null; clients: number; headcount: number;
  opsMetrics: Record<string, number>;   // por industria: merma, OTIF, ticket promedio...
}
```

**Reglas del motor mínimo:**

- **Línea base por tipo y familia.** `simulationProfile × archetype` define los ingresos iniciales, el margen, la plantilla, la caja y la sensibilidad. Una PYME es más chica y tiene menos colchón; una establecida es más grande y más lenta. Ninguna es un «modo fácil».
- **Causalidad con retraso.** Cada palanca mueve variables concretas (crecimiento, nómina, capacidad), con un retraso y una duración definidos en los supuestos. Por ejemplo: el marketing empieza a vender al mes siguiente y su efecto dura 3 meses.
- **Casos ligados a números.** Cada opción de caso puede traer un `economic` opcional (por ejemplo, el descuento a SuperNorte equivale a −2 puntos de margen sobre 31% de las ventas). Si no lo trae, el caso solo mueve índices, como hoy. Al principio se etiquetan los casos con efecto económico claro.
- **Índices y números, cada uno en su lugar.** Los 5 índices siguen siendo de salud (0–100). La tarjeta de Efectivo dice «$5.98 M · 8 meses de pista», y el índice de caja dice «Caja 62/100». Nunca se presentan como lo mismo. Una prueba verifica que una inversión baje el efectivo y que el signo del índice no lo contradiga.
- **Determinista.** El mismo estado da siempre el mismo resultado. Si hay variación (por ejemplo, la demanda), viene de una semilla `companyId|period`. La IA narra el reporte, pero nunca inventa saldos.
- **El tiempo del negocio avanza por cierre, no por reloj.** Un mes simulado se cierra cuando el usuario atendió los casos de ese mes y abrió el reporte. Si se va de vacaciones, el negocio se queda quieto.
- **Prueba de reconstrucción.** Reproducir el diario desde cero da el mismo `businessOf`, y una decisión nunca se aplica dos veces.

### 4.4 Ejemplo: dos meses simulados

*Casa Norte Alimentos · Alimentos y bebidas / Botanas y snacks · PYME · etapa «Tomar el mando».* Cifras en millones de MXN, calculadas con el modelo de arriba.

**Línea base:**

| Concepto | Valor |
|---|---|
| Ventas | 4.00 al mes |
| Margen bruto | 34% |
| Nómina | 1.05 (≈45 personas) |
| Otros gastos | 0.15 |
| Marketing | 0.05 |
| Caja inicial | 6.00 |
| Crecimiento base | 1% mensual |

**Mes 1 (semana real 1, unos 6 casos).** Llegan la carta de bienvenida, el director comercial que esperaba tu puesto y la cadena que pide descuento.
- Ventas 4.04, utilidad bruta 1.37, gastos 1.25, **EBITDA 0.12**.
- Capital de trabajo −0.05.
- **Caja 6.00 → 6.07.**

El reporte de cierre lo presenta la directora de Finanzas: «Ventas +1% contra el mes anterior, 1% abajo de la meta. El efectivo creció poco porque la cadena paga a 60 días.»

Decisión del reporte (dentro de la situación): la directora de Finanzas y el director comercial proponen subir marketing a 0.25 al mes durante 3 meses. Opciones: (a) aprobarlo, (b) aprobar la mitad, (c) guardar la caja. **El usuario elige (a).**

**Mes 2.**
- Ventas 4.08 (el marketing todavía no pega: el retraso es de 1 mes), gastos 1.45, **EBITDA −0.06**.
- Capital de trabajo −0.03.
- **Caja 6.07 → 5.98.**

El reporte dice: «El gasto ya salió y la venta todavía no llega: es lo esperado. En el mes 3 veremos si funciona.» Pista: más de 24 meses al ritmo de gasto actual (unos 0.09 al mes). En «Lo que necesita tu atención» aparecen: el efecto del marketing, la negociación con la cadena y la rotación de planta.

**Avance del mes 3** (para comprobar la causalidad). El crecimiento sube a 4% por el marketing y se contrata un ejecutivo de cuentas clave (0.09 al mes). Ventas 4.24, **EBITDA −0.10**, **caja 5.98 → 5.82**. El reporte compara lo real contra la meta y explica que la contratación paga a partir del mes 5.

En los tres meses, los índices siguen moviéndose por los casos (por ejemplo, Clientes 64 → 68 por el piloto de marca), pero se muestran aparte de los números.

---

## 5. Banco de casos: qué se puede reutilizar y matriz de combinaciones

### 5.1 Primera clasificación de los 55 casos

Esta clasificación se hizo leyendo títulos y elenco. Se confirmará en la auditoría con etiquetas (PR P1-A).

| Grupo | Cumbre | Forja | Brasa | Total | Ejemplos |
|---|---|---|---|---|---|
| **Universal** (cualquier industria; en startup, con variante) | 10 | 5 | 2 | **17** | pronóstico de 22 láminas, objetivos que no cuadran, sesión de consejo, auditoría de gastos, encuesta de clima, renuncias, ciberataque, denuncia confidencial |
| **De familia** (todas las de su familia operativa) | 6 | 8 | 9 | **23** | sindicato y planta, proveedor crítico, crédito para línea automatizada, alza de insumos, brote o alérgeno, franquicias, apps de reparto |
| **Propio del paquete** (necesita variante para otra industria) | 4 + 3 episodios | 4 | 4 | **15** | SuperNorte y la marca premium, PPAP y cotización de plataforma con la armadora, ingeniería de menú y cocina oculta |

Para cada caso, la auditoría debe registrar:
- etiquetas: industria/familia, tipos compatibles, etapa, competencias, personajes, KPI y dependencias (`trigger`);
- variables de plantilla;
- montos escalables por tamaño (por ejemplo, el crédito de $40 M pasa a $4 M en una PYME).

La regla de calidad: un caso que no es compatible no se muestra. Es preferible tener menos casos a meter uno incoherente.

**Advertencia honesta de volumen.** Con el contenido actual, una empresa tiene unos 23 casos, que alcanzan para unos **3 meses simulados** (la etapa «Tomar el mando» y parte de «Estabilizar»). Los reportes mensuales y las decisiones de caja estirarán un poco ese tiempo, pero una carrera continua de verdad necesita **contenido nuevo por familia** desde P1. Es el principal riesgo de alcance del cambio.

### 5.2 Matriz sector × industria × tipo (al lanzar)

Leyenda: **Listo** = contenido aprobado y probado. **Limitado** = solo casos universales y de familia; se queda «Próximamente» hasta pasar revisión. **Futuro** = necesita paquete nuevo.

| Sector → Industria | PYME | Startup en operación | Establecida |
|---|---|---|---|
| Alimentos y bebidas → Botanas y snacks (paquete Cumbre) | **Listo** (familiar, CEO designado por los dueños) | Futuro | **Listo** |
| Alimentos y bebidas → otras (salsas, panificación, bebidas) | Limitado | Futuro | Limitado |
| Manufactura → Autopartes / metalmecánica (paquete Forja) | Limitado (falta escalar los montos) | Futuro | **Listo** (consejo de un fondo) |
| Manufactura → otras (plásticos, empaques…) | Limitado | Futuro | Limitado |
| Turismo y gastronomía → Restaurantes (paquete Brasa) | **Listo** (familiar) | Futuro | **Listo** |
| Comercio/retail → tiendas con varias sucursales | Limitado (usa la familia de Brasa) | Futuro | Limitado |
| Tecnología/software/IA → SaaS | Futuro | Futuro (paquete nuevo «Nexo Labs», P1) | Futuro |
| Los otros 16 sectores | Futuro | Futuro | Futuro |

Si se aprueba, el lanzamiento queda en **3 industrias jugables y 5 combinaciones Listo**. Las demás se ven en el selector como «Próximamente».

---

## 6. Bocetos de pantallas

### 6.1 Onboarding (móvil primero; en escritorio, el mismo flujo centrado a 640 px)

```
Paso 1 · Carta de nombramiento
  «El consejo de administración te ha nombrado Director General.»
  Una carta corta firmada por quien preside, con el tono del tipo de empresa
  (al final, porque todavía no sabemos cuál es). [Aceptar el nombramiento]

Paso 2 · ¿Qué empresa vas a dirigir?
  Sector     [ Buscar sector…            v ]
  Industria  [ Primero elige un sector    v ]  (deshabilitado)
  Búsqueda por sinónimo: «snacks» -> sugiere «Alimentos y bebidas · Botanas y snacks» [Usar]
  Combinaciones sin contenido: «Próximamente», visibles pero no seleccionables.
  Cambiar el sector limpia la industria.

Paso 3 · ¿Qué tipo de empresa?
  ( ) PYME · Te nombran los dueños. Ventas de unos $50 M al año, 45 personas.
  ( ) Startup en operación · Te contratan los fundadores y los inversionistas.   [Próximamente]
  ( ) Establecida · Te nombra el consejo. Unos $400 M, 240 personas.
  Debajo de cada una: qué cambia (escala, tipo de problemas). Nada de «más fácil».

Paso 4 · ¿Cómo se llama?
  [ Casa Norte Alimentos         ]  sugerencias: Casa Norte · Sierra y Sal · Grupo Alto
  «Puedes cambiarlo después.»

Resumen ejecutivo (20–30 s)
  Casa Norte Alimentos · Botanas y snacks · PYME · Tomar el mando
  3 datos (ventas, efectivo, cliente principal) y 3 personas clave.
  [Ver mi primer caso]   (meta diaria y contacto quedan en Ajustes, con valores por defecto)
```

### 6.2 Empresa: el tablero ejecutivo

```
Casa Norte Alimentos
Alimentos y bebidas · Botanas y snacks · PYME · Tomar el mando
«Vendes más que hace un mes, pero la caja depende de que la cadena pague a tiempo.»

[Ingresos 4.08 M  +1%] [Margen bruto 34%  EBITDA -0.06] [Efectivo 5.98 M · pista >24 meses]
[Clientes 38 · 31% en uno] [Equipo 45 · rotación 34%] [Consejo 62/100]

Evolución (barras de ingresos + línea de efectivo, por mes)
Lo que necesita tu atención (máx. 3)
  1. Marketing: el efecto se verá en el mes 3.   2. Negociación con la cadena.   3. Rotación en planta.

Detalle (pestañas): Índices de salud | Estado de resultados | Flujo de efectivo
                    | Organigrama (OrgMap) | Operación (merma, OTIF…) | Historia | Glosario
```

En escritorio van dos columnas (tarjetas y gráfica a la izquierda, atención y detalle a la derecha). En móvil, las tarjetas forman una cuadrícula de 2 columnas.

### 6.3 Primer reporte (mes 1)

```
Cierre del mes 1 · Te lo presenta Lucía Treviño, Directora de Finanzas
Qué cambió    Ventas 4.04 (meta 4.08, mes anterior 4.00) · EBITDA 0.12 · Efectivo 6.07
Por qué       La cadena paga a 60 días; el margen aguanta.
Qué está en juego   Tu propuesta de crecimiento para el trimestre.
Tu decisión   Marketing: (a) 0.25 al mes por 3 meses  (b) la mitad  (c) guardar caja
              (puede no haber decisión grande: «Enterado» también es válido)
Qué aprendes  Lección corta de Academy: retraso entre gasto y resultado.
```

---

## 7. Fases, PR por PR

Esfuerzo relativo: S = pequeño, M = medio, L = grande. Cada PR va en su rama, con pruebas y squash-merge, y se verifica producción después. Todo lo nuevo queda **detrás de la bandera `carrera_continua`** hasta el lanzamiento.

| # | PR | Contenido | Esfuerzo | Pruebas clave |
|---|---|---|---|---|
| 1 | **P0-A** (este documento) | Diagnóstico y plan | S | — |
| 2 | **P0-B1 · Taxonomía** | 21 sectores, industrias, sinónimos, disponibilidad y búsqueda. Lógica pura, sin pantalla. | M | Industria vacía sin sector; cambiar el sector la limpia; un sinónimo sugiere sin seleccionar; «Próximamente» bloquea; solo es Listo si existe el paquete. |
| 3 | **P0-B2 · Identidad y plantillas** | `CompanyProfile`, reglas V4 (esqueleto), acciones `setupCompany`/`renameCompany` en el diario, y resolver de plantillas para casos, elenco, episodios y correos. | M | No quedan variables sin resolver; no se filtran nombres fijos; renombrar conserva `company_id`; `advance()` en V4 no cambia de empresa. |
| 4 | **P0-B3 · Onboarding nuevo** | Los 4 pasos, el resumen y la pantalla «Continuar tu carrera anterior / Empezar nueva carrera MÊTIS». Migración 0020 aditiva. La partida de invitado se migra al registrarse. | M-L | La empresa existe antes de la primera decisión; una carrera anterior nunca se sobrescribe; importar al registrarse conserva la empresa. |
| 5 | **P0-C · Negocio y tablero** | `lib/ceo/business/` (perfiles, supuestos v1, `businessOf`) y la pantalla Empresa nueva. | L | `cash_end = begin + inflows − outflows` en cada mes; determinista; índice ≠ dinero; sin KPI de inventario en SaaS ni MRR en alimentos. |
| 6 | **P0-D · Primer ciclo y reporte** | Cierre de periodo por avance, reporte mensual, decisión de caja con efecto diferido y acciones `allocate`/`closePeriod` validadas en el servidor. | L | La inversión baja la caja de forma coherente; el efecto llega con su retraso; el reporte compara anterior, meta y real; las vacaciones no mueven el negocio; la reconstrucción desde el diario da lo mismo. |
| 7 | **P1-A · Auditoría de casos** | Etiquetas en los 55 casos, filtro de compatibilidad, montos escalados y segunda y tercera combinación (Forja, Brasa). | M | Ningún caso incompatible se muestra; consecuencias en orden causal. |
| 8 | **P1-B · Carrera continua** | Etapas, revisión del consejo sin game over, Journey con hitos, tier por etapa, episodios por periodo. | L | Las 16 pruebas de aceptación del §14 que apliquen. |
| 9 | **P1 · Contenido nuevo** | Casos nuevos por familia para pasar del mes 3, y el paquete SaaS startup si se aprueba. | L (continuo) | Las mismas validaciones de contenido de hoy. |
| 10 | **P1/P2 · Rotaciones y ritmos** | Rotación como invitado con los paquetes existentes, aislada de tu empresa, y Arena por dominio. Ritmo semanal, quincenal o mensual según la etapa. | L | La rotación no contamina las finanzas de tu empresa. |

**Lanzamiento:**
1. Bandera encendida solo para Oziel.
2. Después, para cuentas nuevas.
3. Después, la oferta a los jugadores actuales.

**Reversa:** se apaga la bandera. Las partidas V4 quedan guardadas pero no visibles, y las V1–V3 nunca se tocaron. La migración 0020 es aditiva.

**Riesgos principales:**
1. **Volumen de contenido** después del mes 3 (el mayor).
2. **Calibración de los números**: que se sientan reales sin volverse una hoja de cálculo. Por eso hay supuestos versionados y revisión editorial.
3. **Coherencia** entre índices y dinero.
4. **Complejidad del motor**: V4 vive al lado de V3. No se reescribe V3.
5. **Ritmo**: que «un mes por semana» se sienta vivo. Se ajusta con datos de la etapa interna.

---

## 8. Preguntas que sí bloquean (cada una con recomendación)

1. **¿Con qué combinaciones lanzamos?** Recomiendo 3 industrias con contenido real: Botanas y snacks (PYME y establecida), Autopartes (establecida) y Restaurantes (PYME y establecida). La startup SaaS queda en «Próximamente» hasta escribir su paquete en P1.
2. **¿Qué pasa con los jugadores actuales?** Recomiendo que su carrera siga intacta, con una invitación a «Empezar nueva carrera MÊTIS» que nunca sea obligatoria. En la nueva carrera, lo aprendido (XP, Academy, dominio y rango ganado) se conserva, y la empresa y los índices empiezan de nuevo.
3. **¿A qué ritmo corre el negocio?** Recomiendo 1 mes simulado ≈ 1 semana real (5–7 decisiones). El mes se cierra al atender sus casos y abrir el reporte, no por reloj.
4. **¿Qué moneda?** Recomiendo MXN para todas las empresas del MVP. La internacionalización y otras monedas llegan con la palanca «irse internacional» en P1/P2.
5. **¿Escribimos contenido nuevo?** Para pasar de los 3 meses simulados hace falta. Recomiendo que yo redacte los casos por familia con las plantillas y tú los apruebes, como hicimos con los casos ejecutivos.
