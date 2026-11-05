"""Capturas de la página pública en laptop (1366 y 1440) y móvil: hero con el caso y la página completa."""
import os
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3500")
out = "/workspace/shots"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    for dev, vp in [("laptop", {"width": 1366, "height": 768}), ("laptop1440", {"width": 1440, "height": 900}), ("mobile", {"width": 390, "height": 844})]:
        ctx = b.new_context(viewport=vp, is_mobile=dev == "mobile")
        pg = ctx.new_page()
        pg.goto(BASE + "/simulador", wait_until="networkidle"); pg.wait_for_timeout(1500)
        pg.screenshot(path=f"{out}/{dev}-landing-hero.png")
        if dev == "laptop":
            pg.screenshot(path=f"{out}/{dev}-landing-full.png", full_page=True)
            region = pg.get_by_role("region", name="Un caso del simulador")
            region.get_by_role("button", name="Ver el contexto").click(); pg.wait_for_timeout(500)
            region.screenshot(path=f"{out}/{dev}-caso-contexto.png")
            region.get_by_role("button", name="Decidir").click(); pg.wait_for_timeout(500)
            region.screenshot(path=f"{out}/{dev}-caso-decides.png")
        ctx.close()
    b.close()
