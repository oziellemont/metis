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

- Confirmar siglas DR / CV (o elegir alternativa).
- Compartir industria y tamaño de las 2–3 empresas objetivo para diseñar catálogos plantilla reales.
- Crear proyecto en Supabase y Vercel (o compartir acceso) cuando el MVP esté listo para conectarse.
- Confirmar paleta de colores y disponibilidad del dominio.
