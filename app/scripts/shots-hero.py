"""Captura de la tarjeta de Hoy (racha semanal) y el hero de la página pública, escritorio y móvil."""
import json, os
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3300")
seed = open("/tmp/seed.json").read()
out = "/workspace/shots"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    for dev, vp in [("desktop", {"width": 1366, "height": 900}), ("mobile", {"width": 390, "height": 844})]:
        ctx = b.new_context(viewport=vp, is_mobile=dev == "mobile")
        ctx.add_init_script(f"try {{ if (!localStorage.getItem('metis-ceo-v1')) localStorage.setItem('metis-ceo-v1', {json.dumps(seed)}); }} catch (e) {{}}")
        pg = ctx.new_page()
        pg.goto(BASE + "/ceo", wait_until="networkidle"); pg.wait_for_timeout(1500)
        for label in ["Recordar más tarde", "Ahora no", "Más tarde"]:
            btn = pg.get_by_role("button", name=label)
            if btn.count():
                btn.first.click(); pg.wait_for_timeout(600)
        pg.locator("[aria-label='Tu mandato']").screenshot(path=f"{out}/{dev}-hoy-racha.png")
        pg.goto(BASE + "/simulador", wait_until="networkidle"); pg.wait_for_timeout(1200)
        pg.screenshot(path=f"{out}/{dev}-hero.png")
        ctx.close()
    b.close()
