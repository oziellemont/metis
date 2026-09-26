"""
Plan financiero METIS v2 · escenario conservador.
Supuestos ajustados por el fundador (sep 2026):
  - 5 clientes de plataforma al cierre del año 1
  - equipo de 3-4 personas en el año 2
  - inversión inicial de $150k MXN
Genera docs/plan-financiero-v2.md con las tablas.
"""
from dataclasses import dataclass

MXN = lambda v: f"${v/1e6:,.2f}M"


@dataclass
class Year:
    n: int
    clientes_cierre: int
    clientes_nuevos: int
    colab_prom: int
    precio: int
    diagnosticos: int
    precio_diag: int
    ticket_impl: int          # configuración + arquitectura por cliente nuevo
    retainers: int            # clientes con Growth Sprint / Estratega al cierre
    retainer_mes: int
    meses_retainer_prom: int  # meses promedio facturados en el año por retainer
    academia: float
    equipo: str
    opex: float               # gastos de operación (MXN)


years = [
    Year(1, 5, 5, 110, 165, 8, 85_000, 220_000, 1, 55_000, 6, 80_000,
         "Fundador (tiempo parcial) + 1 consultor por proyecto + freelance", 1_450_000),
    Year(2, 14, 10, 130, 160, 15, 90_000, 240_000, 3, 60_000, 10, 300_000,
         "4 personas: fundador, 2 consultores, 1 Customer Success / operaciones", 4_100_000),
    Year(3, 30, 18, 150, 150, 27, 95_000, 260_000, 6, 65_000, 11, 700_000,
         "8 personas: +2 consultores, 1 comercial, 1 producto/dev", 8_600_000),
]

prev_close = 0
rows = []
for y in years:
    clientes_prom = (prev_close + y.clientes_cierre) / 2
    saas = clientes_prom * y.colab_prom * y.precio * 12
    impl = y.clientes_nuevos * y.ticket_impl
    diag = y.diagnosticos * y.precio_diag
    ret = y.retainers * y.retainer_mes * y.meses_retainer_prom
    total = saas + impl + diag + ret + y.academia
    servicios = impl + diag + ret + y.academia
    ub = saas * 0.82 + (impl + diag + ret) * 0.50 + y.academia * 0.65
    ebitda = ub - y.opex
    recurrente = saas + ret
    arr = y.clientes_cierre * y.colab_prom * y.precio * 12
    rows.append(dict(y=y, clientes_prom=clientes_prom, saas=saas, impl=impl, diag=diag,
                     ret=ret, total=total, servicios=servicios, ub=ub, ebitda=ebitda,
                     margen=ebitda / total, rec=recurrente / total, arr=arr))
    prev_close = y.clientes_cierre

# Unidad económica (cliente promedio plan Crecimiento)
acv = 140 * 155 * 12
cac = 120_000
payback = cac / (acv * 0.82 / 12)
ltv = acv * 0.82 * 5  # vida útil topada a 5 años, churn 10%
ltv_cac = ltv / cac

out = []
out.append("# Plan financiero METIS · v2 (escenario conservador)\n")
out.append("> Reemplaza el escenario base del plan v1 (12 / 35 / 80 clientes). Ajustes del fundador: "
           "5 clientes al cierre del año 1, equipo de 3–4 personas en el año 2, inversión inicial de $150,000 MXN. "
           "Cifras en MXN antes de IVA, sin inflación ni tipo de cambio. Todos los números son supuestos a validar "
           "con los primeros 3–5 prospectos.\n")
out.append("## Resumen\n")
out.append("| Concepto | Año 1 | Año 2 | Año 3 |\n|---|---|---|---|")
def line(label, f):
    out.append(f"| {label} | " + " | ".join(f(r) for r in rows) + " |")
line("Clientes activos (cierre)", lambda r: str(r['y'].clientes_cierre))
line("Clientes nuevos en el año", lambda r: str(r['y'].clientes_nuevos))
line("Clientes promedio del año", lambda r: f"{r['clientes_prom']:.1f}")
line("Colaboradores promedio por cliente", lambda r: str(r['y'].colab_prom))
line("Precio promedio / colaborador / mes", lambda r: f"${r['y'].precio}")
line("Diagnósticos vendidos", lambda r: str(r['y'].diagnosticos))
line("Retainers activos (Growth Sprints / Estratega)", lambda r: str(r['y'].retainers))
out.append("")
out.append("## Ingresos (MXN)\n")
out.append("| Línea | Año 1 | Año 2 | Año 3 |\n|---|---|---|---|")
line("Suscripción SaaS", lambda r: MXN(r['saas']))
line("Configuración + Arquitectura", lambda r: MXN(r['impl']))
line("Diagnósticos de Alineación", lambda r: MXN(r['diag']))
line("Growth Sprints + Estratega Fraccional", lambda r: MXN(r['ret']))
line("Academia METIS", lambda r: MXN(r['y'].academia))
line("**Ingresos totales**", lambda r: f"**{MXN(r['total'])}**")
line("Utilidad bruta", lambda r: MXN(r['ub']))
line("Gastos de operación", lambda r: MXN(r['y'].opex))
line("**EBITDA**", lambda r: f"**{MXN(r['ebitda'])}**")
line("Margen EBITDA", lambda r: f"{r['margen']*100:.0f}%")
line("% ingreso recurrente", lambda r: f"{r['rec']*100:.0f}%")
line("ARR de plataforma al cierre", lambda r: MXN(r['arr']))
out.append("")
out.append("## Equipo y gasto\n")
out.append("| Año | Equipo | Gasto de operación |\n|---|---|---|")
for r in rows:
    out.append(f"| {r['y'].n} | {r['y'].equipo} | {MXN(r['y'].opex)} |")
out.append("")
out.append("### Desglose del gasto año 1 (~$1.45M)\n")
out.append("| Rubro | MXN | Nota |\n|---|---|---|")
out.append("| Consultor por proyecto | $600,000 | Se contrata cuando hay Arquitectura vendida; ~$50k/mes efectivos |")
out.append("| Freelance (diseño, contenido, soporte) | $200,000 | Por entregable |")
out.append("| Marketing y ventas | $200,000 | LinkedIn, webinars, eventos, viáticos locales |")
out.append("| Nube y APIs de IA | $120,000 | Vercel, Supabase, transcripción y LLM |")
out.append("| Legal, marca IMPI, contabilidad | $150,000 | Constitución, aviso de privacidad, contratos modelo |")
out.append("| Herramientas y otros | $180,000 | Software, dominio, imprevistos |")
out.append("")
out.append("## Inversión inicial: $150,000 MXN\n")
out.append("Capital de trabajo del fundador para los primeros 4–6 meses, antes de que la caja de los primeros "
           "Diagnósticos cubra la operación. Cubre marca y dominio, constitución legal, nube, herramientas de IA "
           "y materiales de venta. **Sin ronda de inversión externa**; el crecimiento se financia con ventas.\n")
out.append("| Uso | MXN |\n|---|---|")
out.append("| Constitución legal y contabilidad inicial | $45,000 |")
out.append("| Registro de marca ante IMPI y dominio | $20,000 |")
out.append("| Nube, herramientas de IA y software (6 meses) | $35,000 |")
out.append("| Materiales de venta, web y contenido | $25,000 |")
out.append("| Reserva | $25,000 |")
out.append("")
out.append("## Unidad económica (cliente promedio, plan Crecimiento)\n")
out.append(f"- ACV de plataforma: **${acv:,.0f}** (140 colaboradores × $155 × 12)")
out.append(f"- CAC estimado: **${cac:,.0f}**")
out.append(f"- Recuperación del CAC con margen SaaS: **{payback:.1f} meses**")
out.append(f"- LTV / CAC: **{ltv_cac:.1f}x** (churn anual 10%, vida útil topada a 5 años)\n")
out.append("## Comparativo v1 → v2\n")
out.append("| Concepto | v1 año 1 | v2 año 1 | v1 año 3 | v2 año 3 |\n|---|---|---|---|---|")
out.append(f"| Clientes al cierre | 12 | 5 | 80 | 30 |")
out.append(f"| Ingresos totales | $7.00M | {MXN(rows[0]['total'])} | $48.58M | {MXN(rows[2]['total'])} |")
out.append(f"| EBITDA | $0.92M | {MXN(rows[0]['ebitda'])} | $8.73M | {MXN(rows[2]['ebitda'])} |")
out.append(f"| Equipo | 4 | 1 + proyecto | 35 | 8 |")
out.append(f"| ARR plataforma | $2.61M | {MXN(rows[0]['arr'])} | $23.66M | {MXN(rows[2]['arr'])} |")
out.append("")
out.append("## Lectura\n")
out.append("- El año 1 es de **validación**: 8 diagnósticos, 5 implementaciones, 1 retainer. Cierra en punto de equilibrio "
           "o ligeramente positivo, compatible con un fundador que todavía tiene empleo de tiempo completo.")
out.append("- El año 2 es el primero con equipo fijo (4 personas) y ya es rentable con margen de dos dígitos gracias a que "
           "la base instalada empieza a pesar en la mezcla.")
out.append("- El año 3 llega a ~$18M con 30 clientes, más del 55% recurrente y un equipo de 8. Es el punto donde se "
           "decide si se acelera con capital externo o se sigue autofinanciado.")
out.append("- Palancas de upside fuera del escenario: Copiloto IA ($39/colab/mes), expansión de usuarios dentro de cada "
           "cliente (25% anual) y alianzas con despachos y consultoras de RH.")

import pathlib
pathlib.Path("docs").mkdir(exist_ok=True)
pathlib.Path("docs/plan-financiero-v2.md").write_text("\n".join(out), encoding="utf-8")
print("\n".join(out))
