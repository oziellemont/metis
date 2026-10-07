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
