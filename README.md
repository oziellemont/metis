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

Para conectar Supabase copia `.env.example` a `.env.local` y ejecuta en el SQL Editor:

1. `supabase/migrations/0001_core.sql` — esquema `metis.*`, tabla pública `leads`, RLS y vistas de cumplimiento.
2. `supabase/seed.sql` — datos de Grupo Andes (opcional).

Para regenerar el seed cuando cambien los datos demo: `npx tsx scripts/gen-seed-sql.ts`.

## Conceptos clave

| Concepto | Descripción |
|---|---|
| **Objetivo → LAE → Elemento** | Cascada estratégica. Las LAEs son Líneas de Acción Estratégica. Cada elemento (KPI o proyecto) existe una sola vez en el catálogo, con fórmula, unidad y dirección. |
| **Alcance** | Dónde se mide un elemento (Nacional, Región, Planta, CEDIS, BU…). Un `element_scope` es la unidad real que se carga y se propaga. |
| **DR / CV** | **Dueño del Resultado** captura el dato una vez; los **Contribuidores Vinculados** lo reciben en su scorecard automáticamente. |
| **Semáforo** | Tres metas por elemento: mínima, satisfactoria, sobresaliente. Incremental (más es mejor) o decremental. |
| **Cumplimiento ponderado** | % de logro vs meta satisfactoria (tope 120%), ponderado por mes; la ponderación debe sumar 100% cada mes. Base objetiva para compensación variable. |
| **Flujo de scorecard** | Borrador → Enviado → Aprobado / Ajustes solicitados / Denegado, con historial. |

## Rutas

- `/` landing comercial · `/indice` Índice de Alineación (20 preguntas, resultado en pantalla + PDF)
- `/inicio` panel · `/scorecard` mi scorecard · `/carga` carga mensual con propagación DR→CV
- `/mapa` mapa de alineación · `/equipo` aprobar scorecards · `/reportes` cumplimiento por colaborador/mes
- `/config/catalogo` `/config/alcances` `/config/usuarios` configuración
- `/sesiones` `/compromisos` `/config/unidades` `/config/notificaciones` — v1 (placeholder)

## Roadmap

- **Sprint 1 (este PR):** landing, Índice de Alineación, MVP en modo demo, dominio con pruebas, esquema SQL.
- **Sprint 2:** auth Supabase + persistencia real, invitaciones, importación de catálogo desde Excel, deploy en Vercel.
- **Sprint 3:** Sesiones WTW/WTM con deck automático y compromisos; notificaciones de carga.
- **Sprint 4:** IA — resumen de bitácoras, transcripción de sesiones, alertas de desvío.
