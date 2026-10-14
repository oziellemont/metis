"""Escenarios de precio por scorecard activo vs. precio actual (plan financiero v2)."""
EUR, USD = 20.56, 18.36  # MXN, 14-oct-2026

print("Perdoo Premium/Supreme en MXN por usuario/mes:", round(6.40 * EUR), round(8.0 * EUR))

# Plan financiero v2: ACV = 140 colaboradores x $155 x 12
plan_acv = 140 * 155 * 12
print("ACV plan v2:", plan_acv)

empresas = [("Chica", 60, 0.35), ("Mediana", 150, 0.30), ("Grande", 300, 0.25)]

def actual(seats):  # tabla de la landing, aplicada a scorecards
    p = 189 if seats <= 60 else 159 if seats <= 300 else 129
    return max(seats, 15) * p * 12

def propuesta(seats):  # cuota base + asiento por scorecard, escalonado
    base = 3500  # incluye 10 scorecards
    extra = max(seats - 10, 0)
    if seats <= 40: p = 290
    elif seats <= 150: p = 250
    else: p = 210
    return (base + extra * p) * 12

print(f"{'Empresa':8} {'Emp':>4} {'SC':>4} {'Actual SC':>10} {'Propuesta':>10} {'$/SC/mes':>9} {'$/emp/mes':>9}")
for n, emp, r in empresas:
    sc = round(emp * r)
    a, p = actual(sc), propuesta(sc)
    print(f"{n:8} {emp:4} {sc:4} {a:10,} {p:10,} {p/12/sc:9.0f} {p/12/emp:9.0f}")

# impacto en la línea SaaS del plan (ACV promedio ~45 scorecards)
sc_prom = 45
for label, acv in [("actual aplicado a SC", actual(sc_prom)), ("propuesta", propuesta(sc_prom))]:
    f = acv / plan_acv
    print(f"{label}: ACV {acv:,}  = {f:.0%} del plan  -> SaaS año1 {0.54*f:.2f}M año2 {2.37*f:.2f}M año3 {5.94*f:.2f}M")
