"""
mêtis CEO · Acería · modelo económico PROPUESTO (calculadora verificable, independiente del motor).

Objetivo: probar, antes de tocar el motor, que la economía propuesta es lógica:
  - la empresa estable es viable, crecer tiene sentido pero también riesgo;
  - EBITDA, utilidad operativa, utilidad neta y flujo de caja salen distintos y por razones explicables;
  - las tres estrategias (conservadora, equilibrada, agresiva) enfrentan EXACTAMENTE el mismo mercado.

Todo es determinista. Montos en pesos MXN sin IVA. Las cifras son supuestos de simulación con su rango y su base
(ver PARAMS); no son datos de una empresa real. Se ejecuta con: python3 modelo_propuesto.py
"""
from __future__ import annotations
import json, sys
from dataclasses import dataclass, field

DAYS = 26  # días hábiles al mes (lunes a sábado)

# ─────────────────────────────────────────────────────────────── supuestos (valor central · rango · base)
PARAMS = {
    "precio_varilla":      (14_900, "14,300–15,500", "Precio neto promedio de acero largo comercial en México 2025 reportado por Grupo Simec: $14,802–15,219/t."),
    "precio_palanquilla":  (12_300, "11,800–13,000", "Supuesto: 15–20 % abajo de la varilla (la palanquilla aún no se lamina)."),
    "chatarra_entregada":  (6_700,  "5,800–7,500",   "Supuesto: chatarra procesada puesta en planta. Referencia de compra al público en Monterrey: $4–5/kg (acopio)."),
    "rend_fusion":         (0.90,   "0.88–0.92",     "Supuesto: pérdida metálica en horno de inducción (óxidos, escoria)."),
    "rend_colada":         (0.975,  "0.96–0.98",     "Supuesto: despuntes y fuera de medida en la colada."),
    "rend_laminacion":     (0.96,   "0.95–0.97",     "Supuesto: cascarilla, despuntes y fuera de norma al laminar."),
    "ferroaleaciones":     (450,    "350–600",       "Supuesto: FeSi, FeMn/SiMn y recarburante por t de palanquilla."),
    "kwh_fusion":          (625,    "550–700",       "Supuesto: kWh por t en horno de inducción (literatura técnica de fundición)."),
    "precio_kwh":          (2.20,   "1.8–2.6",       "Supuesto: tarifa GDMTH todo incluido; validar con un recibo real de CFE."),
    "refractarios":        (520,    "400–650",       "Supuesto: revestimiento del crisol, moldes, oxígeno y consumibles por t."),
    "maquila_laminacion":  (2_100,  "1,800–2,600",   "Supuesto: lo que cobra un laminador externo por convertir palanquilla en varilla."),
    "flete_a_laminador":   (250,    "150–350",       "Supuesto: flete de palanquilla al laminador maquilador."),
    "laminacion_propia":   (680,    "550–800",       "Supuesto: gas de recalentamiento, energía y rodillos por t de varilla (laminador propio)."),
    "isr_ptu":             (0.37,   "0.35–0.40",     "ISR 30 % y PTU 10 % sobre utilidad (simplificado: PTU sobre base gravable)."),
}
P = {k: v[0] for k, v in PARAMS.items()}
SCRAP_PER_BILLET = 1 / (P["rend_fusion"] * P["rend_colada"])

# ─────────────────────────────────────────────────────────────── mercado (igual para todas las estrategias)
STRESS = {"on": False}
def market(m: int) -> tuple[float, float]:
    """(índice de chatarra, índice de precio de acero) del mes m (1..24). Ciclo típico: la chatarra sube primero,
    el acero la sigue tarde y a medias; luego la construcción se enfría."""
    scrap = 1.0 if m <= 6 else 1.10 if m <= 10 else 1.03
    steel = 1.0 if m <= 7 else 1.03 if m <= 12 else 0.96 if m <= 18 else 1.0
    if STRESS["on"] and 10 <= m <= 18: steel -= 0.06  # construcción se frena: el acero cae 6 % más por nueve meses
    return scrap, steel

@dataclass
class Contract:
    client: str; product: str; tpd: float; price: float; dso: int; start: int = 1

@dataclass
class Plant:
    name: str
    furnaces: int; t_per_furnace_shift: float; shifts: int
    rolling_tpd: float  # 0 = no tiene laminador (maquila)
    staff_cost: float; fixed: float; rent: float; site_utilities: float
    depreciation: float; sustaining_capex: float
    own_scrap_share: float = 0.0; own_scrap_cost: float = 0.0
    contracts: list[Contract] = field(default_factory=list)
    cash: float = 0.0; debt: float = 0.0; rate: float = 0.0; debt_months: int = 0

    def melt_cap(self) -> float: return self.furnaces * self.t_per_furnace_shift * self.shifts

def simulate(p: Plant, events: dict[int, callable], months: int = 24) -> dict:
    ar_prev = inv_prev = ap_prev = None
    rows = []; carry_loss = 0.0; cash = p.cash
    for m in range(1, months + 1):
        if m in events: cash += events[m](p) or 0
        sx, px = market(m)
        active = [c for c in p.contracts if c.start <= m]
        # demanda de palanquilla: la que se vende + la que se lamina (propia o maquila)
        bil_sale = sum(c.tpd for c in active if c.product == "palanquilla")
        reb = sum(c.tpd for c in active if c.product == "varilla")
        reb_own = min(reb, p.rolling_tpd); reb_maq = reb - reb_own
        need = bil_sale + reb / P["rend_laminacion"]
        cap = p.melt_cap(); fill = min(1.0, cap / need) if need else 1.0
        bil_t = bil_sale * fill * DAYS; reb_t = reb * fill * DAYS; reb_own_t = reb_own * fill * DAYS; reb_maq_t = reb_maq * fill * DAYS
        billet_made = bil_t + reb_t / P["rend_laminacion"]
        rev_items = []
        for c in active:
            t = c.tpd * fill * DAYS; rev_items.append((t * c.price * px, c.dso))
        revenue = sum(r for r, _ in rev_items)
        lost_rev = sum(c.tpd * (1 - fill) * DAYS * c.price * px for c in active)
        scrap_price = (p.own_scrap_share * p.own_scrap_cost + (1 - p.own_scrap_share) * P["chatarra_entregada"]) * sx
        scrap = billet_made * SCRAP_PER_BILLET * scrap_price
        alloys = billet_made * P["ferroaleaciones"]
        energy = billet_made * P["kwh_fusion"] * P["precio_kwh"]
        refr = billet_made * P["refractarios"]
        rolling = reb_maq_t / P["rend_laminacion"] * P["flete_a_laminador"] + reb_maq_t * P["maquila_laminacion"] + reb_own_t * P["laminacion_propia"]
        freight = 0.008 * sum(c.tpd * fill * DAYS * c.price * px for c in active if c.product == "palanquilla") + 0.02 * sum(c.tpd * fill * DAYS * c.price * px for c in active if c.product == "varilla")
        penalties = 0.03 * lost_rev
        variable = scrap + alloys + energy + refr + rolling + freight
        fixed = p.staff_cost + p.fixed + p.rent + p.site_utilities
        ebitda = revenue - variable - fixed - penalties
        operating = ebitda - p.depreciation
        interest = p.debt * p.rate / 12
        pretax = operating - interest
        base = pretax - carry_loss
        taxes = max(0.0, base) * P["isr_ptu"]; carry_loss = max(0.0, -base) if base < 0 else 0.0
        net = pretax - taxes
        # capital de trabajo: cuentas por cobrar, inventario (12 días de chatarra + 8 de producto) y proveedores (7 días chatarra, 30 resto)
        ar = sum(r * d / 30 for r, d in rev_items)
        inv = scrap * 12 / 30 + (variable - freight) * 8 / 30
        ap = scrap * 7 / 30 + (alloys + energy + refr + rolling) * 30 / 30
        if ar_prev is None: ar_prev, inv_prev, ap_prev = ar, inv, ap
        dwc = (ar - ar_prev) + (inv - inv_prev) - (ap - ap_prev)
        ar_prev, inv_prev, ap_prev = ar, inv, ap
        principal = p.debt / p.debt_months if p.debt_months > 0 and p.debt > 0 else 0.0
        if p.debt_months > 0: p.debt_months -= 1
        p.debt -= principal
        fcf = ebitda - taxes - dwc - p.sustaining_capex
        cash += fcf - interest - principal
        rows.append(dict(m=m, t_vendidas=round(bil_t + reb_t), util=round(min(need, cap) / cap, 2) if cap else 0, fill=round(fill, 3), ventas=revenue, ebitda=ebitda, operativa=operating, intereses=interest, impuestos=taxes, neta=net, dwc=dwc, flujo_libre=fcf, caja=cash, deuda=p.debt, perdidas=lost_rev))
    tot = lambda k: sum(r[k] for r in rows)
    return dict(rows=rows, ventas=tot("ventas"), ebitda=tot("ebitda"), operativa=tot("operativa"), neta=tot("neta"), flujo_libre=tot("flujo_libre"),
                impuestos=tot("impuestos"), intereses=tot("intereses"), caja_min=min(r["caja"] for r in rows), caja_final=rows[-1]["caja"], deuda_final=rows[-1]["deuda"],
                margen_ebitda=tot("ebitda") / tot("ventas"), margen_oper=tot("operativa") / tot("ventas"), ventas_perdidas=tot("perdidas"),
                peor_mes_ebitda=min(r["ebitda"] for r in rows))

# ─────────────────────────────────────────────────────────────── empresas propuestas
def startup() -> Plant:
    """Aceros Huasteca: acería compacta de inducción. Funde chatarra y cuela palanquilla; la varilla la lamina un tercero (maquila)."""
    return Plant("Aceros Huasteca", furnaces=2, t_per_furnace_shift=13.5, shifts=2, rolling_tpd=0,
                 staff_cost=36 * 20_500, fixed=230_000, rent=120_000, site_utilities=260_000,
                 depreciation=350_000, sustaining_capex=150_000, cash=3_500_000,
                 contracts=[Contract("Laminados Regios", "palanquilla", 22, 12_300, 30), Contract("Relaminadora Topo Chico", "palanquilla", 12, 12_200, 30),
                            Contract("Constructora Cumbres del Norte", "varilla", 8, 14_900, 45)])

def consolidada() -> Plant:
    """Grupo Acerero Huasteca: mini acería integrada (acería + colada continua + laminador) y patio de chatarra propio en Saltillo."""
    return Plant("Grupo Acerero Huasteca", furnaces=2, t_per_furnace_shift=38, shifts=3, rolling_tpd=220,
                 staff_cost=152 * 24_000, fixed=1_650_000, rent=300_000, site_utilities=1_450_000,
                 depreciation=2_900_000, sustaining_capex=1_200_000, own_scrap_share=0.35, own_scrap_cost=5_900,
                 cash=25_000_000, debt=60_000_000, rate=0.13, debt_months=60,
                 contracts=[Contract("Distribuidora de Aceros del Norte", "varilla", 70, 14_800, 45), Contract("Constructora Cumbres del Norte", "varilla", 45, 14_950, 60),
                            Contract("Estructuras del Desierto", "varilla", 45, 14_900, 45), Contract("Laminados Regios", "palanquilla", 30, 12_300, 30)])

# ─────────────────────────────────────────────────────────────── estrategias
def s_startup(kind: str) -> dict:
    p = startup(); ev: dict[int, callable] = {}
    if kind in ("equilibrada", "agresiva"):
        # Cliente nuevo de varilla (vía maquila) a 60 días: más volumen con los hornos que ya se pagan.
        def acepta(p):
            p.contracts.append(Contract("Desarrollos Industriales del Bajío", "varilla", 8, 14_600, 60, start=3)); p.staff_cost += 2 * 20_500
            if kind == "equilibrada": p.debt += 3_000_000; p.rate = 0.17; p.debt_months = 18; return 3_000_000
        ev[2] = acepta
    if kind == "agresiva":
        # Además: palanquilla extra a precio bajo, tercer turno y crédito de capital de trabajo.
        def crece(p):
            p.contracts.append(Contract("Aceros del Bajío (relaminadora)", "palanquilla", 20, 11_900, 30, start=4))
            p.shifts = 3; p.staff_cost += 13 * 21_500; p.site_utilities += 60_000
            p.debt += 9_000_000; p.rate = 0.19; p.debt_months = 24
            return 9_000_000
        prev = ev[2]; ev[2] = lambda p: (prev(p) or 0) + (crece(p) or 0)
    return simulate(p, ev)

def s_consolidada(kind: str) -> dict:
    p = consolidada(); ev: dict[int, callable] = {}
    if kind == "equilibrada":
        # Más chatarra propia: ampliar el patio de Saltillo (prensa-cizalla) y comprar a recolectores directo.
        def patio(p): p.own_scrap_share = 0.55; p.staff_cost += 8 * 19_000; p.depreciation += 100_000; return -12_000_000
        ev[3] = patio
    if kind == "agresiva":
        # Tercer horno de inducción (38 t por turno, llega en 6 meses) + 50 t/día de varilla nueva, con crédito de 50 M al 13 %.
        def horno(p): p.debt += 50_000_000; p.debt_months = 60; p.depreciation += 300_000; return 50_000_000 - 55_000_000
        def arranca(p): p.furnaces = 3; p.staff_cost += 18 * 22_000; p.site_utilities += 350_000; p.contracts.append(Contract("Vivienda del Norte (distribuidor)", "varilla", 50, 14_500, 60, start=9))
        ev[2] = horno; ev[8] = arranca
    return simulate(p, ev)

def fmt(x: float) -> str: return f"{x/1e6:,.1f} M"

if __name__ == "__main__":
    out = {}
    for stress in (False, True):
      STRESS["on"] = stress
      if stress: print("\n── Escenario de estrés: el acero cae 6 % adicional entre los meses 10 y 18 ──")
      for name, fn in (("startup", s_startup), ("consolidada", s_consolidada)):
        name = name + ("_estres" if stress else ""); out[name] = {}
        for k in ("conservadora", "equilibrada", "agresiva"):
            r = fn(k); out[name][k] = {x: r[x] for x in r if x != "rows"}; out[name][k]["meses"] = [{kk: (round(v) if isinstance(v, float) and abs(v) > 10 else v) for kk, v in row.items()} for row in r["rows"]]
            print(f"{name:20s} {k:13s} ventas {fmt(r['ventas'])} · EBITDA {fmt(r['ebitda'])} ({r['margen_ebitda']:.1%}) · operativa {fmt(r['operativa'])} ({r['margen_oper']:.1%}) · intereses {fmt(r['intereses'])} · impuestos {fmt(r['impuestos'])} · neta {fmt(r['neta'])} · flujo libre {fmt(r['flujo_libre'])} · caja mín {fmt(r['caja_min'])} · caja final {fmt(r['caja_final'])} · deuda {fmt(r['deuda_final'])} · peor mes EBITDA {fmt(r['peor_mes_ebitda'])} · ventas perdidas {fmt(r['ventas_perdidas'])}")
    json.dump(out, open(sys.argv[1] if len(sys.argv) > 1 else "/tmp/audit/propuesto.json", "w"), indent=1, default=float)
