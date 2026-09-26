# mêtis · Plataforma de Alineación Estratégica y Growth

> Que toda tu empresa empuje hacia el mismo lado. METIS convierte la estrategia en objetivos, KPIs y proyectos claros para cada área y cada persona, medidos mes a mes — y tu esquema de compensación por fin se conecta con la estrategia.

Este repositorio contiene la plataforma SaaS (Next.js + Supabase), el **Índice de Alineación** (cuestionario público que funciona como lead magnet y primera fase del Diagnóstico) y la documentación del negocio.

## Estructura

```
metis/
├── app/                     # Next.js 15 · App Router · Tailwind · TypeScript
│   ├── src/app/             # Rutas: landing (/), /indice, y la app (/inicio, /scorecard, …)
│   ├── src/components/      # UI (site, indice, app, ui)
│   ├── src/lib/domain/      # Reglas puras: semáforo, ponderación, cumplimiento (+ pruebas)
│   ├── src/lib/demo/        # Datos demo "Grupo Andes" (modo sin credenciales)
│   ├── src/lib/indice/      # Cuestionario del Índice de Alineación
│   ├── src/lib/supabase/    # Cliente Supabase (leads) con fallback local
│   ├── supabase/migrations/ # Esquema multi-inquilino (tenant_id + RLS)
│   ├── supabase/seed.sql    # Seed de Grupo Andes (generado)
│   └── scripts/             # gen-seed-sql.ts
├── docs/
│   ├── plan-financiero-v2.md      # Escenario aprobado: 5 clientes año 1, $150k inicial
│   ├── decisiones.md              # Registro de decisiones de producto y negocio
│   └── indice-de-alineacion.md    # Diseño del cuestionario y scoring
└── tools/plan_financiero.py       # Script reproducible del plan financiero
```

## Arranque rápido

```bash
cd app
npm install
npm run dev          # http://localhost:3000
npm test             # pruebas del dominio (vitest)
npm run build        # build de producción
```

Sin variables de entorno la app corre en **modo demo**: los datos de Grupo Andes viven en memoria y los cambios se guardan en `localStorage`. Los leads del Índice también se guardan localmente.

### Conectar Supabase + Vercel

1. Copia `app/.env.example` a `app/.env.local` y carga las mismas variables en Vercel (Settings → Environment Variables). Mínimo: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`.
2. En el SQL Editor de Supabase ejecuta en orden:
   1. `supabase/migrations/0001_core.sql` — esquema `metis.*`, tabla pública `leads`, RLS y vistas de cumplimiento.
   2. `supabase/migrations/0002_access_units_reminders.sql` — código de empresa, invitaciones, unidades editables, ajustes de recordatorios, `notification_log`, trigger que crea el perfil al registrarse.
   3. `supabase/seed.sql` — datos de Grupo Andes (opcional, para demo).
3. En Supabase → Project Settings → **Data API** → *Exposed schemas*: agrega `metis` (además de `public`). Sin esto la API responde `PGRST106 Invalid schema: metis` y el login/unirme no puede leer membresías ni llamar los RPC.
4. En Supabase → Authentication → URL Configuration: Site URL = tu dominio de Vercel y agrega `https://<dominio>/auth/callback` a Redirect URLs. Activa el proveedor Email (magic link) y, si quieres, Google.
5. En Vercel → Settings → General: **Root Directory = `app`** y Framework Preset = Next.js (un build que termina en 2–3 s es señal de que está desplegando la raíz del repo). Para que el sitio sea público, en Settings → **Deployment Protection** desactiva *Vercel Authentication* para Production (si no, cualquier visitante y el cron reciben un 302 al SSO de Vercel).
6. Para los correos de recordatorio crea una cuenta en [Resend](https://resend.com), verifica tu dominio y carga `RESEND_API_KEY` y `EMAIL_FROM`. Sin ellas el cron corre en *dry-run* (sólo registra).
7. El cron ya está declarado en `app/vercel.json` (diario 15:00 UTC = 9:00 Monterrey). Vercel lo activa solo al desplegar; prueba manual: `GET /api/cron/recordatorios?dry=1&force=1` con header `Authorization: Bearer $CRON_SECRET`.

Para regenerar el seed cuando cambien los datos demo: `npx tsx scripts/gen-seed-sql.ts`.

### Cómo entra un usuario al círculo de su empresa

1. `/login` — inicia sesión con su correo (magic link) o Google. Supabase crea `auth.users` y un trigger crea `metis.profiles`.
2. `/unirme` — captura el **código de empresa** (p. ej. `ANDES-2026`, visible en *Usuarios y roles*) → RPC `metis.join_with_code` crea su `membership`. O bien llega desde el enlace de una **invitación** (`/login?inv=<token>`) → RPC `metis.accept_invitation`. Si su correo ya tenía invitación pendiente, se acepta sola al registrarse.
3. Desde ese momento RLS le muestra sólo los datos de su empresa; el `middleware.ts` manda a `/login` si no hay sesión y a `/unirme` si no pertenece a ninguna empresa.

## Conceptos clave

| Concepto | Descripción |
|---|---|
| **Objetivo → LAE → Elemento** | Cascada estratégica. Las LAEs son Líneas de Acción Estratégica. Cada elemento (KPI o proyecto) existe una sola vez en el catálogo, con fórmula, unidad y dirección. |
| **Alcance** | Dónde se mide un elemento (Nacional, Región, Planta, CEDIS, BU…). Un `element_scope` es la unidad real que se carga y se propaga. |
| **DR / CV** | **Dueño del Resultado** captura el dato una vez; los **Contribuidores Vinculados** lo reciben en su scorecard automáticamente. |
| **Semáforo** | Tres metas por elemento: mínima, satisfactoria, sobresaliente. Incremental (más es mejor) o decremental. |
| **Cumplimiento ponderado** | % de logro vs meta satisfactoria (tope 120%), ponderado por mes; la ponderación debe sumar 100% cada mes. Base objetiva para compensación variable. |
| **Flujo de scorecard** | Borrador → Enviado → Aprobado / Ajustes solicitados / Denegado, con historial. |
| **Unidades** | Catálogo por empresa (%, $, USD, ton, pzas, días…) con símbolo, posición y decimales. El cliente agrega/edita/quita; las que están en uso no se borran. |
| **Recordatorios** | Cada mes METIS avisa por correo a cada DR con datos pendientes (días y hora configurables) y, opcionalmente, manda un resumen al jefe. |
| **Código de empresa / invitación** | Dos caminos para entrar al círculo de la empresa; ambos crean la `membership` que activa el RLS. |

## Rutas

- `/` landing comercial · `/indice` Índice de Alineación (20 preguntas, resultado en pantalla + PDF)
- `/inicio` panel · `/scorecard` mi scorecard · `/carga` carga mensual con propagación DR→CV
- `/mapa` mapa de alineación · `/equipo` aprobar scorecards · `/reportes` cumplimiento por colaborador/mes
- `/login` `/unirme` acceso por correo + código de empresa o invitación · `/auth/callback` retorno de Supabase
- `/config/catalogo` `/config/alcances` `/config/unidades` `/config/usuarios` (código de empresa, invitaciones) `/config/notificaciones` (recordatorios con vista previa)
- `/api/cron/recordatorios` cron diario de Vercel
- `/sesiones` `/compromisos` — v1 (placeholder)

## Roadmap

- **Sprint 1:** landing, Índice de Alineación, MVP en modo demo, dominio con pruebas, esquema SQL.
- **Sprint 2a:** catálogo de unidades editable, recordatorios mensuales por correo (cron), acceso por código/invitación, login con magic link/Google, middleware.
- **Sprint 2b:** persistencia real sobre Supabase (store → consultas), importación de catálogo desde Excel, deploy en Vercel.
- **Sprint 3:** Sesiones WTW/WTM con deck automático y compromisos; alertas de KPI en rojo.
- **Sprint 4:** IA — resumen de bitácoras, transcripción de sesiones, alertas de desvío.
