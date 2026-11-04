"""Captura de «Mi liderazgo» (escritorio y móvil): cerrado y con una barra abierta."""
import json, os
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3000")
seed = open("/tmp/seed.json").read()
out = "/workspace/shots"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    for dev, vp in [("desktop", {"width": 1366, "height": 900}), ("mobile", {"width": 390, "height": 844})]:
        ctx = b.new_context(viewport=vp, is_mobile=dev == "mobile")
        ctx.add_init_script(f"try {{ if (!localStorage.getItem('metis-ceo-v1')) localStorage.setItem('metis-ceo-v1', {json.dumps(seed)}); }} catch (e) {{}}")
        pg = ctx.new_page()
        pg.goto(BASE + "/ceo/perfil", wait_until="networkidle"); pg.wait_for_timeout(1500)
        for label in ["Recordar más tarde", "Ahora no", "Más tarde"]:
            btn = pg.get_by_role("button", name=label)
            if btn.count():
                btn.first.click(); pg.wait_for_timeout(600)
        sec = pg.locator("[data-testid=mi-liderazgo]")
        sec.scroll_into_view_if_needed()
        sec.screenshot(path=f"{out}/{dev}-liderazgo.png")
        pg.locator("[data-testid=liderazgo-competencias] button").nth(1).click(); pg.wait_for_timeout(400)
        pg.locator("[data-testid=liderazgo-competencias]").screenshot(path=f"{out}/{dev}-liderazgo-abierto.png")
        ctx.close()
    b.close()
