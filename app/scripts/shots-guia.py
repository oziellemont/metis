"""Capturas de la guía «?» de mêtis CEO: botón abajo a la derecha y panel según la pantalla y la pestaña abierta."""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3100")
seed = open(os.environ.get("SEED_FILE", "/tmp/seed.json")).read()
out = sys.argv[1] if len(sys.argv) > 1 else "/workspace/shots/guia"
os.makedirs(out, exist_ok=True)

BTN = '[data-testid="guia-boton"]'
PANEL = '[data-testid="guia-panel"]'
PROBLEMAS = []


def dismiss(pg):
    for label in ["Recordar más tarde", "Ahora no", "Más tarde"]:
        try:
            btn = pg.get_by_role("button", name=label)
            if btn.count():
                btn.first.click(); pg.wait_for_timeout(400)
        except Exception:
            pass


def open_guide(pg, dev, name, ask=None):
    """Abre la guía, imprime qué guía salió y toma la captura. `ask` abre una pregunta por su texto."""
    pg.locator(BTN).click(); pg.wait_for_timeout(500)
    panel = pg.locator(PANEL)
    qs = [b.inner_text().strip() for b in panel.locator('[data-testid="guia-preguntas"] button').all()]
    print(dev, name, "->", panel.get_attribute("data-guia"), "|", panel.get_attribute("aria-label"), "| preguntas:", len(qs))
    if ask:
        panel.get_by_role("button", name=ask).first.click(); pg.wait_for_timeout(350)
    box = panel.bounding_box(); fab = pg.locator(BTN).bounding_box(); vp = pg.viewport_size
    # El botón y el panel deben quedar dentro de la pantalla, y la página no debe ser más ancha que ella.
    extra = pg.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    inside = fab["x"] >= 0 and fab["x"] + fab["width"] <= vp["width"] and fab["y"] + fab["height"] <= vp["height"] and box["x"] >= 0 and box["y"] >= 0 and box["x"] + box["width"] <= vp["width"]
    print(dev, name, "panel:", {k: round(v) for k, v in box.items()}, "boton:", {k: round(v) for k, v in fab.items()}, "| dentro de la pantalla:", inside, "| ancho de más:", extra)
    if not inside or extra > 0:
        PROBLEMAS.append(f"{dev} {name}: dentro={inside} ancho de más={extra}")
    pg.screenshot(path=f"{out}/{dev}-{name}.png")
    return qs


def close_guide(pg):
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    assert pg.locator(PANEL).count() == 0, "la guía no cerró con Escape"


with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    for dev, vp in [("desktop", {"width": 1440, "height": 900}), ("mobile", {"width": 390, "height": 844})]:
        ctx = b.new_context(viewport=vp, device_scale_factor=1, is_mobile=dev == "mobile")
        ctx.add_init_script(f"try {{ if (!localStorage.getItem('metis-ceo-v1')) localStorage.setItem('metis-ceo-v1', {json.dumps(seed)}); }} catch (e) {{}}")
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))

        # Hoy: botón cerrado (con su punto verde la primera vez) y guía abierta
        pg.goto(BASE + "/ceo", wait_until="networkidle"); pg.wait_for_timeout(1500); dismiss(pg)
        pg.screenshot(path=f"{out}/{dev}-hoy-boton.png")
        open_guide(pg, dev, "hoy")
        close_guide(pg)

        # Empresa · Finanzas: el ejemplo de Oziel
        pg.goto(BASE + "/ceo/empresa", wait_until="networkidle"); pg.wait_for_timeout(1200); dismiss(pg)
        open_guide(pg, dev, "empresa-resumen")
        close_guide(pg)
        pg.get_by_role("tab", name="Finanzas").click(); pg.wait_for_timeout(600)
        pg.screenshot(path=f"{out}/{dev}-finanzas-boton.png")
        qs = open_guide(pg, dev, "finanzas")
        print(dev, "preguntas de Finanzas:", qs)
        close_guide(pg)
        open_guide(pg, dev, "finanzas-pregunta", ask="¿Qué son la utilidad bruta y el margen bruto?")
        # buscador
        pg.locator(PANEL).get_by_label("Escribe tu duda").fill("consejo"); pg.wait_for_timeout(400)
        res = [x.inner_text().strip().replace("\n", " ") for x in pg.locator(f'{PANEL} [data-testid="guia-preguntas"] button').all()]
        print(dev, "buscar «consejo»:", res)
        pg.screenshot(path=f"{out}/{dev}-finanzas-buscar.png")
        pg.locator(PANEL).get_by_label("Escribe tu duda").fill("zzzz"); pg.wait_for_timeout(300)
        print(dev, "buscar sin resultado:", pg.locator(f'{PANEL} [data-testid="guia-preguntas"] p').inner_text())
        # clic fuera cierra
        pg.mouse.click(40 if dev == "mobile" else 400, 200); pg.wait_for_timeout(300)
        print(dev, "clic fuera cierra:", pg.locator(PANEL).count() == 0)

        # resto de pestañas de Empresa
        for tab, name in [("Operación", "operacion"), ("Personas", "personas"), ("Consejo", "consejo")]:
            pg.get_by_role("tab", name=tab).click(); pg.wait_for_timeout(600)
            open_guide(pg, dev, f"empresa-{name}")
            close_guide(pg)

        # Carrera con sus dos vistas
        pg.goto(BASE + "/ceo/carrera", wait_until="networkidle"); pg.wait_for_timeout(1200); dismiss(pg)
        open_guide(pg, dev, "carrera")
        close_guide(pg)
        pg.get_by_role("tab", name="Mi perfil").click(); pg.wait_for_timeout(600)
        open_guide(pg, dev, "perfil")
        close_guide(pg)

        # otras pantallas
        for path, name in [("/ceo/bandeja", "bandeja"), ("/ceo/academy", "academy"), ("/ceo/ajustes", "ajustes"), ("/ceo/reporte", "reporte"), ("/ceo/cambio", "cambio")]:
            pg.goto(BASE + path, wait_until="networkidle"); pg.wait_for_timeout(1200); dismiss(pg)
            if pg.locator(BTN).count() == 0:
                print(dev, name, "-> sin botón en", pg.url.replace(BASE, "")); continue
            open_guide(pg, dev, name)
            close_guide(pg)

        print(dev, "errores:", errs)
        ctx.close()
    b.close()
print("PROBLEMAS:", PROBLEMAS)
