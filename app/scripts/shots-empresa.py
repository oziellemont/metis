"""Capturas de Empresa (cinco pestañas) en escritorio y móvil, más Ajustes, Carrera y Academy con lo que se reubicó."""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3100")
seed = open(os.environ.get("SEED_FILE", "/tmp/seed.json")).read()
out = sys.argv[1] if len(sys.argv) > 1 else "/workspace/shots/empresa"
os.makedirs(out, exist_ok=True)


def dismiss(pg):
    for label in ["Recordar más tarde", "Ahora no", "Más tarde"]:
        try:
            btn = pg.get_by_role("button", name=label)
            if btn.count():
                btn.first.click(); pg.wait_for_timeout(400)
        except Exception:
            pass


with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    for dev, vp in [("desktop", {"width": 1440, "height": 900}), ("mobile", {"width": 390, "height": 844})]:
        ctx = b.new_context(viewport=vp, device_scale_factor=1, is_mobile=dev == "mobile")
        ctx.add_init_script(f"try {{ if (!localStorage.getItem('metis-ceo-v1')) localStorage.setItem('metis-ceo-v1', {json.dumps(seed)}); }} catch (e) {{}}")
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(BASE + "/ceo/empresa", wait_until="networkidle"); pg.wait_for_timeout(1500); dismiss(pg)
        for tab in ["Resumen", "Finanzas", "Operación", "Personas", "Consejo"]:
            pg.get_by_role("tab", name=tab).click(); pg.wait_for_timeout(700)
            pg.screenshot(path=f"{out}/{dev}-{tab.lower().replace('ó', 'o')}.png", full_page=True)
            if dev == "desktop" and tab == "Operación":
                row = pg.locator('[data-testid="fila-kpi"]').first
                if row.count():
                    row.click(); pg.wait_for_timeout(500)
                    pg.screenshot(path=f"{out}/{dev}-operacion-fila.png", full_page=True)
            if dev == "desktop" and tab == "Personas":
                card = pg.locator('[data-testid="persona"]').nth(1)
                if card.count():
                    card.click(); pg.wait_for_timeout(500)
                    pg.screenshot(path=f"{out}/{dev}-personas-perfil.png")
                    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
        if dev == "desktop":
            for path, name in [("/ceo/ajustes", "ajustes"), ("/ceo/carrera", "carrera"), ("/ceo/academy", "academy")]:
                pg.goto(BASE + path, wait_until="networkidle"); pg.wait_for_timeout(900); dismiss(pg)
                pg.screenshot(path=f"{out}/{dev}-{name}.png", full_page=True)
        print(dev, "errores:", errs)
        ctx.close()
    b.close()
