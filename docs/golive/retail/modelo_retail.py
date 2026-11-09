"""
mêtis CEO · Retail (ferretería y hogar) · modelo económico PROPUESTO.
Calculadora verificable, independiente del motor del juego.

Objetivo: probar antes de tocar el motor que la economía propuesta es lógica:
  - la empresa estable es viable; crecer (abrir tiendas, dar crédito, bajar precios) tiene sentido pero también riesgo;
  - EBITDA, utilidad operativa, utilidad neta y flujo de caja salen distintos y por razones explicables;
  - las tres estrategias enfrentan EXACTAMENTE el mismo mercado (temporada, competidor, ciclo);
  - ninguna estrategia gana en todos los escenarios.

Todo es determinista. Pesos MXN sin IVA. Las cifras son supuestos de simulación con rango y base (ver PARAMS);
no son datos de una empresa real. Uso: python3 modelo_retail.py  (escribe resultados.txt)
"""
from __future__ import annotations
import copy, sys

MONTHS = 24
START_MONTH = 3  # el jugador llega en marzo; abril-mayo preparan la temporada de lluvias

# ─────────────────────────────────────────────────────────── supuestos (valor central · rango · base)
PARAMS = {
    "margen_bruto_chica":   (0.300, "0.28–0.33", "Mezcla de ferretería: material de construcción 18–22 %, herramienta 35–40 %, pintura e impermeabilizante 33–38 %, hogar 38–42 %."),
    "margen_bruto_cadena":  (0.318, "0.30–0.34", "La cadena compra mejor (volumen, bonificaciones de proveedor). Referencia: grandes cadenas de mejoramiento del hogar 32–34 %."),
    "merma":                (0.016, "0.012–0.022", "Robo, daño, error administrativo y de proveedor. Referencia NRF (EUA): 1.4–1.7 % de la venta."),
    "dias_inventario_chica":(98,    "85–125",    "Ferretería independiente: muchas claves de baja rotación."),
    "dias_inventario_cadena":(88,   "75–100",    "Con CEDIS y reabasto por sistema."),
    "dias_proveedor_chica": (40,    "30–45",     "Crédito típico de proveedor a una ferretería chica."),
    "dias_proveedor_cadena":(58,    "45–75",     "Una cadena negocia más plazo."),
    "credito_contratistas": (0.22,  "0.15–0.30", "Parte de la venta que es a crédito con contratistas y constructoras, a 30 días."),
    "comision_tarjeta":     (0.018, "0.015–0.025","Comisión bancaria por cobro con tarjeta (TPV), sobre la venta con tarjeta."),
    "venta_tarjeta":        (0.55,  "0.45–0.65", "Parte de la venta de mostrador que se cobra con tarjeta."),
    "sueldo_piso":          (12_600,"11,500–14,500","Asesor de piso o cajero, sueldo bruto mensual en Coahuila/NL 2026 (salario mínimo 2026: $9,582/mes)."),
    "carga_social":         (1.33,  "1.30–1.38", "IMSS, Infonavit, ISN, aguinaldo, vacaciones y prima vacacional sobre sueldo bruto."),
    "alza_salarial_enero":  (0.10,  "0.06–0.13", "Revisión de enero empujada por el salario mínimo (2025: +12 %, 2026: +13 %)."),
    "renta_m2_chica":       (105,   "80–150",    "Renta mensual por m² de local comercial a pie de calle en Saltillo/Monterrey."),
    "renta_m2_cadena":      (88,    "65–120",    "Renta mensual por m² de una caja grande (1,300–2,400 m²) en plaza o predio propio arrendado."),
    "isr_ptu":              (0.37,  "0.35–0.40", "ISR 30 % y PTU 10 % (simplificado sobre la utilidad antes de impuestos)."),
    "tasa_banco":           (0.155, "0.13–0.19", "Crédito simple y revolvente para PyME comercial en México 2026."),
    "costo_capital":        (0.16,  "0.14–0.20", "Lo que el dueño espera ganar sobre lo invertido (para el valor económico)."),
}
P = {k: v[0] for k, v in PARAMS.items()}

# Temporada de ferretería en el norte: arranque de obra en primavera, impermeabilizante antes de lluvias,
# pintura y hogar en diciembre, enero flojo. Índice por mes calendario (promedio 1.00).
SEASON = {1: 0.86, 2: 0.92, 3: 1.00, 4: 1.06, 5: 1.12, 6: 1.08, 7: 1.02, 8: 1.00, 9: 0.98, 10: 1.00, 11: 0.98, 12: 0.98}

# ─────────────────────────────────────────────────────────── las dos empresas
COMPANIES = {
    "chica": dict(
        name="Ferretería Madero (StartUp)",
        gm=P["margen_bruto_chica"], inv_days=P["dias_inventario_chica"], dpo=P["dias_proveedor_chica"],
        stores=[  # m², venta madura mensual, personas, competidor cercano a partir del mes 8
            dict(id="centro", m2=750, sales=1_750_000, staff=10, rival=True),
            dict(id="norte",  m2=520, sales=1_250_000, staff=7,  rival=False),
        ],
        new_store=dict(m2=550, sales=1_450_000, staff=7, fitout=2_100_000, preopen=300_000),
        corporate_staff=2, corporate_wage=24_000, admin_fixed=70_000, utilities_m2=36, rent_key="renta_m2_chica", marketing=0.008,
        delivery=0.012, cedis=0.0, cash=1_400_000, debt=0, line=2_500_000, fixed_assets=3_600_000, dep_years=8,
        scale_gm_per_store=0.003,
    ),
    "cadena": dict(
        name="Punto Madero Regional (Consolidada)",
        gm=P["margen_bruto_cadena"], inv_days=P["dias_inventario_cadena"], dpo=P["dias_proveedor_cadena"],
        stores=[
            dict(id="saltillo_centro", m2=2400, sales=6_200_000, staff=27, rival=True),
            dict(id="saltillo_sur",    m2=1800, sales=4_600_000, staff=21, rival=False),
            dict(id="ramos",           m2=1500, sales=3_900_000, staff=18, rival=False),
            dict(id="monclova",        m2=1600, sales=3_800_000, staff=18, rival=False),
            dict(id="apodaca",         m2=2000, sales=5_200_000, staff=23, rival=True),
            dict(id="escobedo",        m2=1700, sales=4_300_000, staff=20, rival=False),
            dict(id="santa_catarina",  m2=1600, sales=4_100_000, staff=19, rival=False),
            dict(id="guadalupe",       m2=1900, sales=4_700_000, staff=22, rival=False),
            dict(id="piedras",         m2=1300, sales=3_000_000, staff=15, rival=False),
        ],
        new_store=dict(m2=1700, sales=4_100_000, staff=20, fitout=9_500_000, preopen=1_100_000),
        corporate_staff=24, corporate_wage=32_000, admin_fixed=700_000, utilities_m2=38, rent_key="renta_m2_cadena", marketing=0.014,
        delivery=0.010, cedis=0.021, cash=18_000_000, debt=40_000_000, line=25_000_000, fixed_assets=70_000_000, dep_years=10,
        scale_gm_per_store=0.0012,
    ),
}

# ─────────────────────────────────────────────────────────── estrategias (decisiones del director)
STRATEGIES = {
    # Conservadora: no abre; aprieta el inventario (menos caja atrapada, algo de faltante); iguala precio solo en lo que el cliente compara.
    "conservadora": dict(open_at={"chica": [], "cadena": []}, inv_delta=-15, price_cut=0.0, credit_share=0.18, credit_days=30,
                         control_project=False, online=False, rival_response="precio"),
    # Equilibrada: abre con calma, invierte en control de inventario y merma, sostiene el crédito a contratistas.
    "equilibrada":  dict(open_at={"chica": [7], "cadena": [6, 15]}, inv_delta=-5, price_cut=0.0, credit_share=0.22, credit_days=30,
                         control_project=True, online=False, rival_response="servicio"),
    # Agresiva: abre rápido, baja precios para ganar tráfico, amplía crédito a constructoras y lanza tienda en línea.
    "agresiva":     dict(open_at={"chica": [5, 11], "cadena": [5, 9, 13]}, inv_delta=+5, price_cut=0.012, credit_share=0.30, credit_days=45,
                         control_project=False, online=True, rival_response="precio"),
}

# ─────────────────────────────────────────────────────────── escenarios de mercado (iguales para las tres estrategias)
def scenario(name: str) -> dict:
    s = dict(demand=lambda m: 1.0, cost=lambda m: 0.0, shrink=0.0, dso_extra=0, wage_extra=0.0, rate_extra=0.0, rival_hit=0.13, bad_debt=0.004, ramp=18)
    if name == "demanda-10":    s["demand"] = lambda m: 0.90 if m >= 6 else 1.0
    if name == "demanda+8":     s["demand"] = lambda m: 1.08 if m >= 4 else 1.0
    if name == "costo+5":       s["cost"] = lambda m: 0.05 if m >= 8 else 0.0          # el proveedor sube y solo se traslada con rezago
    if name == "merma+1":       s["shrink"] = 0.010
    if name == "cobranza+20d":  s["dso_extra"], s["bad_debt"] = 20, 0.012
    if name == "salarios+8":    s["wage_extra"] = 0.08
    if name == "tasa+4":        s["rate_extra"] = 0.04
    if name == "competidor-fuerte": s["rival_hit"] = 0.22
    if name == "obra-frena":    # la construcción se frena del mes 10 al 18 y las constructoras pagan más tarde
        s["demand"] = lambda m: 0.86 if 10 <= m <= 18 else 1.0
        s["dso_extra"], s["bad_debt"] = 25, 0.015
    if name == "tormenta":      # todo junto: demanda abajo, costo arriba, cobranza lenta, tasa arriba
        s["demand"] = lambda m: 0.88 if m >= 8 else 1.0
        s["cost"] = lambda m: 0.04 if m >= 8 else 0.0
        s["dso_extra"], s["bad_debt"], s["rate_extra"], s["rival_hit"] = 20, 0.015, 0.03, 0.18
    if name == "bonanza":       # vivienda y obra pública empujan
        s["demand"] = lambda m: 1.15 if m >= 3 else 1.0
        s["rival_hit"], s["ramp"] = 0.06, 12    # las tiendas nuevas maduran en 12 meses en lugar de 18
        s["bad_debt"], s["dso_extra"] = 0.002, -8   # con obra abundante las constructoras pagan antes
    return s

SCENARIOS = ["base", "demanda-10", "demanda+8", "costo+5", "merma+1", "cobranza+20d", "salarios+8", "tasa+4",
             "competidor-fuerte", "obra-frena", "tormenta", "bonanza"]

# ─────────────────────────────────────────────────────────── simulación
RAMP = {"months": 18}
def ramp(age: int) -> float:
    """Una tienda nueva abre al 55 % de su venta madura y madura en 18 meses (12 con mercado fuerte)."""
    return min(1.0, 0.55 + 0.45 * age / RAMP["months"])

def simulate(company: str, strategy: str, scen: str = "base") -> dict:
    C, S, X = COMPANIES[company], STRATEGIES[strategy], scenario(scen)
    RAMP["months"] = X["ramp"]
    stores = [dict(st, age=99) for st in C["stores"]]
    opens = S["open_at"][company]
    cash, debt, revolver = C["cash"], C["debt"], 0.0
    debt_payment = C["debt"] / 60 if C["debt"] else 0.0
    fixed_gross, acc_dep = C["fixed_assets"], 0.0
    dep_month = C["fixed_assets"] / (C["dep_years"] * 12)
    wage_mult = 1.0
    prev_inv = prev_ar = prev_ap = None
    tax_accrued = tax_paid = 0.0
    overdue_days = 0
    rows = []
    totals = dict(sales=0, ebitda=0, ebit=0, net=0, eva=0, capex=0)
    rival_recovery = 0.0
    shrink_extra_open = []
    for m in range(1, MONTHS + 1):
        cal = (START_MONTH + m - 2) % 12 + 1
        if cal == 1 and m > 1:
            wage_mult *= 1 + P["alza_salarial_enero"] + X["wage_extra"]
        capex = preopen = 0.0
        if m in opens:   # nueva tienda
            ns = C["new_store"]
            stores.append(dict(id=f"nueva_{m}", m2=ns["m2"], sales=ns["sales"], staff=ns["staff"], rival=False, age=0))
            capex += ns["fitout"]; preopen += ns["preopen"]; fixed_gross += ns["fitout"]
            dep_month += ns["fitout"] / (C["dep_years"] * 12)
            shrink_extra_open.append(m)
        # Competidor nacional abre a partir del mes 8 junto a las tiendas marcadas.
        if m >= 8:
            if S["rival_response"] == "servicio":
                rival_recovery = min(0.55, rival_recovery + 0.05)   # asesoría y entrega en obra recuperan clientes poco a poco
            else:
                rival_recovery = min(0.35, rival_recovery + 0.06)   # igualar precio recupera rápido pero menos
        sales = 0.0
        staff = C["corporate_staff"]
        rent = util = 0.0
        for st in stores:
            f = ramp(st["age"]) if st["age"] < 99 else 1.0
            if st["rival"] and m >= 8:
                f *= 1 - X["rival_hit"] * (1 - rival_recovery)
            sales += st["sales"] * f
            staff += st["staff"]
            rent += st["m2"] * P[C["rent_key"]]
            util += st["m2"] * C["utilities_m2"]
            st["age"] += 1
        traffic = 1.0 + (0.07 if S["price_cut"] > 0 else 0.0) + (0.04 if S["credit_share"] > 0.25 else 0.0) - (0.02 if S["credit_share"] < 0.2 else 0.0)
        # Faltantes: recortar inventario sin datos de rotación deja huecos en anaquel. Cada 10 % de días recortados
        # cuesta ~1.2 % de la venta; con el proyecto de control (exactitud de inventario) el costo baja a un tercio.
        cut = max(0.0, -S["inv_delta"]) / C["inv_days"]
        stockout = cut * 0.12 * (0.33 if S["control_project"] and m >= 5 else 1.0)
        sales *= SEASON[cal] * X["demand"](m) * traffic * (1 - stockout)
        online_sales = sales * (0.04 * min(1.0, m / 12)) if S["online"] else 0.0
        sales += online_sales
        # Margen bruto: base + escala de compra − baja de precio − alza de proveedor no trasladada (se traslada a la mitad en 3 meses)
        cost_shock = X["cost"](m)
        passed = min(cost_shock * 0.5, cost_shock * 0.5 * max(0, m - 8) / 3) if cost_shock else 0.0
        n_extra = len(stores) - len(C["stores"])
        gm = C["gm"] + C["scale_gm_per_store"] * n_extra - S["price_cut"] - (cost_shock - passed) * (1 - C["gm"])
        if S["rival_response"] == "precio" and m >= 8:
            gm -= 0.004   # igualar precio en las marcas comparadas cuesta margen en toda la tienda
        cogs = sales * (1 - gm)
        shrink = P["merma"] + X["shrink"] + 0.002 * sum(1 for o in shrink_extra_open if m - o < 6) - (0.005 if S["control_project"] and m >= 5 else 0.0)
        shrink_cost = sales * shrink
        payroll = (staff - C["corporate_staff"]) * P["sueldo_piso"] * P["carga_social"] * wage_mult \
            + C["corporate_staff"] * C["corporate_wage"] * P["carga_social"] * wage_mult
        credit_sales = sales * S["credit_share"]
        card_fees = (sales - credit_sales) * P["venta_tarjeta"] * P["comision_tarjeta"]
        bad_debt = credit_sales * X["bad_debt"] * (1.6 if S["credit_days"] > 30 else 1.0)
        delivery = credit_sales * C["delivery"] / max(0.01, S["credit_share"]) * S["credit_share"] + online_sales * 0.07
        marketing = sales * C["marketing"] + (0.004 * sales if S["price_cut"] > 0 else 0.0)
        cedis = sales * C["cedis"]
        project = (90_000 if company == "chica" else 450_000) if S["control_project"] and m <= 3 else 0.0
        project += (18_000 if company == "chica" else 110_000) if S["control_project"] and m > 3 else 0.0
        opex = payroll + rent + util + card_fees + bad_debt + delivery + marketing + cedis + C["admin_fixed"] + preopen + project
        ebitda = sales - cogs - shrink_cost - opex
        dep = dep_month
        ebit = ebitda - dep
        rate = P["tasa_banco"] + X["rate_extra"]
        interest = (debt + revolver) * rate / 12
        ebt = ebit - interest
        tax = max(0.0, ebt) * P["isr_ptu"]
        tax_accrued += tax
        net = ebt - tax
        # Capital de trabajo (inventario a costo, cuentas por cobrar, proveedores)
        inv_days = C["inv_days"] + S["inv_delta"] + (12 if cal in (3, 4) else 0)   # se carga impermeabilizante antes de lluvias
        # Una tienda nueva necesita el anaquel completo desde el primer día, aunque venda menos.
        shelf_gap = sum(st["sales"] * (1 - ramp(st["age"] - 1)) for st in stores if st["age"] - 1 < 18) * SEASON[cal] * (1 - gm)
        inv = (cogs + shelf_gap) * inv_days / 30
        ar = credit_sales * (S["credit_days"] + X["dso_extra"]) / 30
        ap = (cogs + shelf_gap) * C["dpo"] / 30   # el proveedor también da crédito sobre el surtido de la tienda nueva
        if prev_inv is None:
            prev_inv, prev_ar, prev_ap = cogs * (C["inv_days"]) / 30, sales * 0.22 * 1.0, ap
        d_wc = (inv - prev_inv) + (ar - prev_ar) - (ap - prev_ap)
        prev_inv, prev_ar, prev_ap = inv, ar, ap
        # Impuestos: pagos provisionales trimestrales de lo provisionado
        pay_tax = 0.0
        if m % 3 == 0:
            pay_tax = tax_accrued - tax_paid; tax_paid = tax_accrued
        principal = min(debt, debt_payment)
        # Una tienda nueva se financia 60 % con crédito simple a 5 años.
        new_debt = capex * 0.6
        debt += new_debt - principal
        debt_payment += new_debt / 60
        cash += ebitda - d_wc - capex + new_debt - interest - principal - pay_tax
        # Liquidez: primero la línea revolvente; si no alcanza, se atrasan proveedores (días con vencidos)
        floor = 0.35 * (opex + cogs) / 4   # una semana de salidas como colchón
        if cash < floor:
            need = floor - cash
            take = min(need, C["line"] - revolver)
            revolver += take; cash += take
            if cash < 0:
                overdue_days += 30; cash = 0.0
        elif revolver > 0 and cash > 2 * floor:
            pay = min(revolver, cash - 2 * floor); revolver -= pay; cash -= pay
        capital = inv + ar - ap + (fixed_gross - acc_dep)
        acc_dep += dep
        eva = ebit * (1 - P["isr_ptu"]) - capital * P["costo_capital"] / 12
        for k, v in (("sales", sales), ("ebitda", ebitda), ("ebit", ebit), ("net", net), ("eva", eva), ("capex", capex)):
            totals[k] += v
        rows.append(dict(br=dict(cogs=cogs, shrink=shrink_cost, payroll=payroll, rent=rent, util=util, card=card_fees, bad=bad_debt, delivery=delivery, mkt=marketing, cedis=cedis, admin=C["admin_fixed"], preopen=preopen, project=project, dep=dep, interest=interest), m=m, cal=cal, eva=eva, stores=len(stores), sales=sales, gm=gm, ebitda=ebitda, ebit=ebit, net=net, cash=cash,
                         revolver=revolver, debt=debt, inv=inv, ar=ar, ap=ap, shrink=shrink, staff=staff))
    y1 = rows[:12]
    # Valor de continuidad: el año 25–36 al ritmo de los últimos tres meses (una tienda abierta tarde no se castiga
    # solo porque el horizonte termina), descontado al costo de capital.
    # Tres años más al ritmo de los últimos doce meses (temporada completa), con las tiendas nuevas ya maduras (factor de anualidad al 16 %: 2.25).
    mature_gap = sum(st["sales"] * (1 - ramp(st["age"])) for st in stores if st["age"] < 18) * 12
    eva_tail = (sum(r_["eva"] for r_ in rows[-12:]) + mature_gap * 0.10 * (1 - P["isr_ptu"])) * 2.25
    totals["value"] = totals["eva"] + eva_tail
    return dict(rows=rows, totals=totals, overdue=overdue_days, final_cash=cash, revolver=revolver, debt=debt,
                ebitda_pct=totals["ebitda"] / totals["sales"], y1_ebitda_pct=sum(r["ebitda"] for r in y1) / sum(r["sales"] for r in y1),
                y1_net=sum(r["net"] for r in y1), stores=len(stores), staff=rows[-1]["staff"])

def M(x: float) -> str:
    return f"{x / 1e6:,.1f} M"

def report(out=sys.stdout) -> None:
    for comp in COMPANIES:
        C = COMPANIES[comp]
        print(f"\n═══ {C['name']}", file=out)
        print("Año 1, escenario base (sin decisiones del director más allá de la estrategia):", file=out)
        for st in STRATEGIES:
            r = simulate(comp, st)
            print(f"  {st:<13} venta {M(sum(x['sales'] for x in r['rows'][:12]))} · EBITDA {r['y1_ebitda_pct']*100:4.1f}% · utilidad neta {M(r['y1_net'])}", file=out)
        print("24 meses, por escenario (EBITDA % · valor económico · días con proveedores vencidos · caja − deuda final):", file=out)
        for sc in SCENARIOS:
            res = {st: simulate(comp, st, sc) for st in STRATEGIES}
            # Gana quien crea más valor económico, castigando cada mes con proveedores vencidos (riesgo real de perder crédito).
            score = {st: r["totals"]["value"] - r["overdue"] / 30 * (0.012 * r["totals"]["sales"] / MONTHS) for st, r in res.items()}
            best = max(score, key=score.get)
            cells = " | ".join(f"{st[:5]}: {r['ebitda_pct']*100:4.1f}% · VE {M(r['totals']['value'])} · {r['overdue']:>3} d · neto {M(r['final_cash'] - r['revolver'] - r['debt'])}" for st, r in res.items())
            print(f"  {sc:<18} {cells} → {best}", file=out)

if __name__ == "__main__":
    with open(__file__.replace("modelo_retail.py", "resultados.txt"), "w") as f:
        report(f)
    report()
