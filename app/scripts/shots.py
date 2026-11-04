"""Capturas de Hoy, Carrera, Perfil y la página pública (escritorio y móvil) con una partida sembrada."""
import json, sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3100"
seed = open("/tmp/seed.json").read()
out = sys.argv[1] if len(sys.argv) > 1 else "/workspace/shots"
import os
os.makedirs(out, exist_ok=True)
PAGES = [("hoy", "/ceo"), ("carrera", "/ceo/carrera"), ("perfil", "/ceo/perfil"), ("landing", "/simulador")]
with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    for dev, vp in [("desktop", {"width": 1366, "height": 900}), ("mobile", {"width": 390, "height": 844})]:
        ctx = b.new_context(viewport=vp, device_scale_factor=1, is_mobile=dev == "mobile")
        ctx.add_init_script(f"try {{ if (!localStorage.getItem('metis-ceo-v1')) localStorage.setItem('metis-ceo-v1', {json.dumps(seed)}); }} catch (e) {{}}")
        pg = ctx.new_page()
        for name, path in PAGES:
            pg.goto(BASE + path, wait_until="networkidle")
            pg.wait_for_timeout(1500)
            for label in ["Recordar más tarde", "Ahora no", "Más tarde"]:
                try:
                    btn = pg.get_by_role("button", name=label)
                    if btn.count():
                        btn.first.click(); pg.wait_for_timeout(700)
                except Exception:
                    pass
            if name == "landing":
                try:
                    pg.goto(BASE + "/simulador#camino", wait_until="networkidle"); pg.wait_for_timeout(800); pg.locator("section#camino").scroll_into_view_if_needed(timeout=8000)
                    pg.wait_for_timeout(1200)
                    pg.locator("#camino").screenshot(path=f"{out}/{dev}-{name}.png")
                    continue
                except Exception as e:
                    print("landing", e)
            pg.screenshot(path=f"{out}/{dev}-{name}.png", full_page=True)
            print(dev, name, pg.url)
        ctx.close()
    b.close()
