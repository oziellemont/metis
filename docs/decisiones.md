# METIS · Registro de decisiones

Formato: fecha · decisión · razón · impacto. Las marcadas como **propuesta** están pendientes de confirmación del fundador.

---

## 2026-09-25 · Escenario financiero conservador (v2)

**Decisión.** El escenario base pasa a 5 / 14 / 30 clientes al cierre de los años 1–3, equipo de 4 personas en el año 2 y 8 en el año 3, inversión inicial de $150,000 MXN.
**Razón.** El fundador sigue de tiempo completo en su empleo; el producto no existe todavía; un plan creíble vale más que uno grande ante socios y prospectos.
**Impacto.** Ingresos $2.7M / $8.2M / $18.2M; EBITDA positivo los tres años; >50% recurrente desde el año 2. Detalle en `plan-financiero-v2.md`. El escenario v1 (12 / 35 / 80) queda como escenario optimista.

## 2026-09-25 · Siglas de interfaz en lugar de FCE / FCI / IPE / IPI — **propuesta**

**Decisión.** En la interfaz de la plataforma se usan siglas propias de METIS, distintas de la jerga interna de origen, y una sola pareja para KPIs y proyectos (el tipo de elemento ya se ve en su propia columna):

| Sigla | Significado | Qué hace |
|---|---|---|
| **DR** | Dueño del Resultado | Es responsable del elemento (KPI o proyecto) en un alcance, carga el dato cada periodo, escribe la bitácora y adjunta evidencia. |
| **CV** | Contribuidor Vinculado | Participa en el resultado sin ser dueño. Se vincula al DR y su scorecard se actualiza solo cuando el DR carga. |

Equivalencia con la metodología (para consultoría y documentos internos): DR = FCE / IPE · CV = FCI / IPI.

Alternativas consideradas: RD/PV (Responsable del Dato / Participante Vinculado), DD/VN (Dueño del Dato / Vinculado). Se eligió DR/CV porque suena natural en frase ("soy DR de OTIF y CV de Costo logístico"), se distingue fonéticamente y funciona igual para proyectos.

**Razón.** Reduce la curva de aprendizaje, evita jerga heredada del empleador del fundador y unifica KPI/proyecto en una sola lógica.
**Impacto.** Brochure y mockups deben actualizarse (FCE/FCI → DR/CV). El código usa `owner` / `contributor` como valores internos y las etiquetas DR/CV en la UI, de modo que renombrar cuesta un solo archivo (`lib/labels.ts`).

## 2026-09-25 · Propuesta de valor: compensación conectada a la estrategia

**Decisión.** Se agrega de forma explícita en la propuesta de valor para Dirección General, Finanzas y RH: *"Tu esquema de compensación por fin se conecta con la estrategia."* El cumplimiento ponderado del scorecard (aprobado por el jefe, con metas mínima / satisfactoria / sobresaliente) es la base objetiva para la evaluación del desempeño y el bono variable.
**Límite.** METIS **no** es un módulo de nómina. Exporta el cumplimiento ponderado por persona y periodo; la regla de pago la define cada empresa.
**Impacto.** Mensaje en landing, brochure y guion de venta. En producto: reporte "Cumplimiento ponderado por colaborador" exportable (v1) y campo opcional "elegible a bono" por elemento (v2).

## 2026-09-25 · Índice de Alineación primero

**Decisión.** Se construye el Índice de Alineación (cuestionario web gratuito, 20 preguntas, 5 dimensiones) antes de terminar el MVP, en paralelo.
**Razón.** Genera pipeline desde ya, es la primera fase del Diagnóstico de $85k y valida el discurso con prospectos reales.
**Impacto.** Ruta `/indice` en la misma app. Los leads se guardan en Supabase (`leads`) y el resultado se descarga en PDF.

## 2026-09-25 · Stack técnico

**Decisión.** Next.js 15 (App Router) + TypeScript + Tailwind CSS · Supabase (Postgres, Auth, Storage, RLS) · Vercel.
**Multi-inquilino.** Una sola base con `tenant_id` en cada tabla y *row-level security*; base dedicada sólo para plan Corporativo.
**Razón.** Stack con el que el fundador ya operó (Datalap), donde la IA construye más rápido y con menos errores.
**Impacto.** Repositorio `oziellemont/metis`, carpeta `app/`. El MVP arranca en **modo demo** (datos de Grupo Andes en memoria) para poder enseñarlo sin credenciales; se conecta a Supabase con dos variables de entorno.

## 2026-09-25 · Orden de construcción del MVP

1. Dominio puro con pruebas: semáforo, ponderación 100%, cumplimiento ponderado, propagación DR → CV.
2. Catálogo de elementos y alcances.
3. Mi Scorecard con flujo Borrador → Enviado → Aprobado / Ajustes.
4. Carga mensual con bitácora y propagación.
5. Mapa de alineación.
6. Después: sesiones WTW / WTM (deck en HTML/PDF antes que Teams/Meet), organigrama, IA.

## Pendientes que requieren al fundador

- ~~Confirmar siglas DR / CV~~ → **Owner / Contributor** (ver abajo).
- Compartir industria y tamaño de las 2–3 empresas objetivo para diseñar catálogos plantilla reales.
- Crear proyecto en Supabase y Vercel (o compartir acceso) cuando el MVP esté listo para conectarse.
- Confirmar paleta de colores y disponibilidad del dominio.

## 2026-09-25 · Unidades, recordatorios y acceso a la empresa (petición de Oziel)

**Catálogo de unidades editable.** Cada empresa tiene su propio catálogo (`metis.units`): símbolo, nombre, decimales y posición del símbolo (antes: `$1,200` · después: `95.0 %`, `1,250 ton`). METIS siembra ocho unidades base (%, $, USD, #, pts, días, hrs, % avance) en cada empresa nueva vía trigger; el cliente agrega, edita o quita las suyas desde *Configuración → Unidades de medida*. Una unidad en uso no se puede borrar (FK `on delete restrict` + validación en la interfaz). Al editar el símbolo, los elementos que la usan se actualizan solos (trigger `sync_unit_symbol`). El elemento guarda `unit_id` y también el símbolo denormalizado para lectura rápida.

**Recordatorios mensuales de cierre.** Un cron diario de Vercel (`/api/cron/recordatorios`, 9:00 Monterrey) revisa cada empresa; si hoy es uno de sus días configurados (sugerido 25, 1 y 3), arma un correo por cada DR con datos pendientes y, si la empresa lo activa, un resumen a cada jefe con los pendientes de su equipo. Del 1 al 15 el aviso se refiere al mes anterior ("cierre"); del 16 en adelante al mes en curso ("prepara tu cierre"). Quien ya cargó todo no recibe nada. La lógica es pura y probada (`lib/domain/reminders.ts`); el envío es por Resend (sin SDK) y queda registro en `metis.notification_log`. La configuración (`tenants.settings.reminders`) se edita en *Configuración → Notificaciones*, con vista previa exacta de los correos que saldrían. WhatsApp y Teams quedan en la hoja de ruta.

**Entrar al círculo de la empresa.** Se decidió soportar los dos caminos que planteó Oziel y que conviven:
- **Código de empresa** (`tenants.join_code`, p. ej. `ANDES-2026`): el admin lo ve, copia y regenera en *Usuarios y roles*. El colaborador inicia sesión con su correo (magic link o Google), captura el código en `/unirme` y la RPC `join_with_code` crea su membresía como `member`; el admin ajusta rol y jefe después. Regenerar el código no afecta a quienes ya entraron.
- **Invitación por correo** (`metis.invitations` con token y vencimiento de 14 días): trae rol, jefe y cargo precargados. Si la persona se registra con el correo invitado, la invitación se acepta sola (trigger sobre `auth.users`); también puede abrir el enlace `/login?inv=<token>`.
El perfil es uno por persona (`metis.profiles`) y puede pertenecer a varias empresas (`memberships`); RLS decide qué datos ve. El `middleware.ts` protege las rutas de la app: sin sesión → `/login`; con sesión y sin empresa → `/unirme`. Sin credenciales de Supabase todo esto se simula en modo demo.

**Lo que se necesita del fundador para activar Supabase/Vercel:** ver README → *Conectar Supabase + Vercel*. En resumen: URL y anon key (públicas), service role key (sólo servidor), URL de la app en Vercel, `CRON_SECRET`, y opcionalmente una cuenta en Resend para el correo. No compartir la service role key por canales inseguros; va directo a Environment Variables de Vercel.


**Actualización · Owner / Contributor.** Se reemplazan las siglas DR / CV por **Owner** (dueño del resultado, captura el dato) y **Contributor** (participa sin capturar; su scorecard se actualiza solo). Son palabras que la gente ya entiende sin explicación. Valores internos sin cambio (`owner` / `contributor`); las etiquetas viven en `lib/labels.ts`.

## 2026-10-27 · Roadmap v2.1 aprobado e inicio de la Fase 0

**Decisión.** Se aprueba la visión completa (Master Blueprint v2.0, 6 fases, 32 requisitos) y el roadmap v2.1. Proveedor de IA: OpenAI (proyecto «metis-ceo»), con **tope de USD 50 al mes** fijado por el fundador; ninguna llamada de pago se activa sin confirmar el monto con él. Aprobadas N3 (validación en servidor, primero en modo sombra), N4 (no perjuicio de casos generados), N5 (demo de IA sin registro, con controles), N7 (memo opcional para jugar, necesario para nivel ≥ 3, con alternativas sin texto largo), N6 y N9 (el fundador revisa escenarios y calibra evaluaciones). Precio y monetización se deciden después con datos reales.
**Reglas de trabajo.** Pruebas y migraciones nuevas en el proyecto Supabase «metis-pruebas»; credenciales y datos separados de producción; el esquema `metis` (Align) no se toca; nada nuevo se activa en producción ni se contrata sin aprobación.

## 2026-10-27 · F0-1 · Partidas doradas

**Decisión.** Diez partidas completas grabadas (`app/src/lib/ceo/golden/data`) cubren las 3 empresas, aprobar, reprobar, asuntos vencidos, cambio de horario, modo intensivo, otra zona horaria, repetir y ascender hasta nivel 2. Cada cambio de código debe reproducirlas con resultados idénticos. Se agrega `replay.ts` (reproductor de acciones, base de la validación en servidor de F0-9) y una plantilla de revisión automática en GitHub (`docs/ci/pruebas.yml`, pendiente de activar por el fundador).
**Hallazgo de balance (sin cambio).** El jugador automático «cuidadoso» aprueba Cumbre (nivel 0) y Forja (nivel 1), pero reprueba Brasa en nivel 2 por un punto de Caja (53 frente a 54). Queda registrado; se revisará con datos reales y con el Mastery Engine, no se modifica el balance en este PR.

## 2026-10-27 · F0-2 (parte 1): migración 0015 (cimientos de Fase 0)
- Solo agrega cosas en el esquema `ceo`: columnas `flags`/`ai_consent` en players y las tablas `flags`, `product_events`, `ai_calls`, `ai_quota` y `game_events`. Además, las funciones `ai_reservar`/`ai_ajustar`, que imponen un tope atómico de gasto en IA.
- Todos los interruptores arrancan APAGADOS. Solo el servidor (service_role) escribe en las tablas nuevas; cada jugador puede leer únicamente sus propias jugadas.
- Probada en un Postgres local: se aplica dos veces sin error, el tope bloquea, los permisos se respetan y se puede revertir y volver a aplicar. Reversa: `docs/sql/0015_revertir.sql`.
- Se aplica primero en metis-pruebas (`docs/sql/pruebas_instalar_ceo.sql`, que junta 0013+0014+0015). En producción, solo con aprobación.

## 2026-10-27 · F0-2 (parte 2): interruptores y modo de prueba
- `lib/ceo/flags.ts` (lógica pura con pruebas) y `flags-server.ts` (lee de Supabase con caché de 60 s). Cualquier falla deja todo APAGADO.
- La IA lleva triple candado: interruptor en la base, `CEO_AI_ENABLED=1` en Vercel y consentimiento del jugador. El modo sombra no requiere consentimiento porque el jugador no ve el resultado.
- Herramientas de prueba («Adelantar el reloj»): siempre visibles en las versiones de prueba. En producción NO cambia nada mientras no se configure `NEXT_PUBLIC_CEO_TEST_TOOLS=oculto`; con eso se esconden y solo aparecen al abrir con `?prueba=1`.
- `/api/ceo/estado`: diagnóstico de solo lectura (entorno, proyecto de Supabase y si la llave está presente sin mostrarla). En producción exige el token del cron.

## J-1 · Executive Journey: motor de etapas y Mastery Engine (sin cambios visibles)

- Se agregan `lib/ceo/mastery.ts` (8 competencias, niveles Novice→Expert) y `lib/ceo/journey.ts` (6 etapas + The Executive Arena, requisitos, nombramientos).
- Mastery = decisiones (hasta 70, ponderadas por exigencia y por cantidad de evidencia; vencidos cuentan 0; dilemas valen media decisión) + consistencia entre empresas (10) + retos (10) + Academy con tope (10) + espacio para evidencia futura (IA en modo sombra), siempre ≤ 100.
- El XP queda como constancia: es un mínimo por etapa, nunca asciende solo (hay prueba que lo garantiza).
- Usuarios actuales: al inscribirse se congela su rango anterior → piso de etapa (Gerente → Emerging Leader, Director de área → Functional Manager, Director General → Business Unit Director, CEO y CEO de consejo → Chief Executive Officer) y distinción «temporada fundadora». XP, racha, historial y empresas no se tocan.
- `CeoState.journey` es opcional; `migrate` descarta un journey dañado. Las 10 partidas doradas no cambian.
- Calibración inicial con las partidas doradas: un jugador cuidadoso cumple Functional Manager al aprobar su primera empresa; uno que decide mal, no. Los umbrales se ajustarán con jugadores reales.
- `LEVELS`, `rankFor` y `levelOf` siguen igual por compatibilidad; la interfaz los reemplaza en J-2.

## J-2 · Pantallas del Executive Journey y cero emojis
- Carrera: hero del Journey (etapa, siguiente nombramiento, requisitos con avance y pista), pista de 6 etapas + The Executive Arena, camino de empresas con iniciales y nodo «Junta de nombramiento», botón «Recibir nombramiento» y carta del Consejo (Ramiro Garza).
- Perfil: tarjeta Executive Journey, Constancia (XP y racha, «no define tu etapa») y 8 competencias con marca en 40.
- Barra lateral: etapa y «x de y requisitos». Academy: tarjeta de enfoque con la competencia que frena el siguiente nombramiento.
- Ranking, resumen diario y correo de temporada muestran la etapa. El bloqueo de dilemas y lecciones sigue por XP (constancia).
- Se quitaron todos los emojis y símbolos tipo IA del juego, incluido el texto de los personajes. Prueba `no-emoji.test.ts` lo vigila.

## J-3 · Celebración (confeti y tono)
- `lib/ceo/celebrate.ts`, sin dependencias: confeti en canvas con los 5 colores de la marca (34 a 90 piezas, menos de 2.5 s) y un tono de dos notas (Mi 6 → Si 6, onda senoidal y caída rápida, menos de 1 s, volumen bajo) con Web Audio.
- Se dispara al recibir un nombramiento (el más grande), al aprobar una empresa, al lograr el reto de cambio y al terminar una lección por primera vez (el más discreto). Empresa y cambio, una sola vez por logro.
- Respeta «reducir movimiento» del sistema. El sonido se apaga en Ajustes y la preferencia se guarda en el dispositivo.
