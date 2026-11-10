"""Capturas del centro de mando (Hoy) en escritorio y móvil, y de una pantalla interna con el riel nuevo."""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3100")
seed = open("/tmp/seed.json").read()
out = sys.argv[1] if len(sys.argv) > 1 else "/tmp/shots-centro"
os.makedirs(out, exist_ok=True)


def dismiss(pg):
    for label in ["Recordar más tarde", "Ahora no", "Más tarde", "Cerrar"]:
        try:
            btn = pg.get_by_role("button", name=label)
            if btn.count():
                btn.first.click(); pg.wait_for_timeout(500)
        except Exception:
            pass


with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    for dev, vp in [("desktop", {"width": 1440, "height": 900}), ("mobile", {"width": 390, "height": 844})]:
        ctx = b.new_context(viewport=vp, device_scale_factor=1, is_mobile=dev == "mobile")
        ctx.add_init_script(f"try {{ if (!localStorage.getItem('metis-ceo-v1')) localStorage.setItem('metis-ceo-v1', {json.dumps(seed)}); }} catch (e) {{}}")
        pg = ctx.new_page()
        pg.goto(BASE + "/ceo", wait_until="networkidle"); pg.wait_for_timeout(1500); dismiss(pg)
        pg.screenshot(path=f"{out}/{dev}-hoy.png")
        pg.screenshot(path=f"{out}/{dev}-hoy-completo.png", full_page=True)
        if dev == "desktop":
            first = pg.locator("ul li a").first
            if first.count():
                first.hover(); pg.wait_for_timeout(400)
                pg.screenshot(path=f"{out}/{dev}-hover.png")
            pg.locator('aside a[aria-label="Bandeja"]').hover(); pg.wait_for_timeout(400)
            pg.screenshot(path=f"{out}/{dev}-riel-hover.png", clip={"x": 0, "y": 0, "width": 400, "height": 400})
        pg.goto(BASE + "/ceo/empresa", wait_until="networkidle"); pg.wait_for_timeout(1200); dismiss(pg)
        pg.screenshot(path=f"{out}/{dev}-empresa.png")
        ctx.close()
    b.close()
