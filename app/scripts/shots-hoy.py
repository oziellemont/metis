"""Capturas de Hoy (escritorio y móvil): confirma que no aparecen el recuadro «Tu día» ni los avisos bajo los indicadores."""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3100")
seed = open(os.environ.get("SEED_FILE", "/tmp/seed.json")).read()
out = sys.argv[1] if len(sys.argv) > 1 else "/workspace/shots/hoy"
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
        pg.goto(BASE + "/ceo", wait_until="networkidle"); pg.wait_for_timeout(1500); dismiss(pg)
        pg.screenshot(path=f"{out}/{dev}-hoy.png", full_page=True)
        print(dev, "recuadro «Tu día»:", pg.locator('[data-testid="resumen-dia"]').count(), "| avisos bajo los indicadores:", pg.locator('[data-testid="alertas-tendencia"]').count(), "| misión del consejo:", pg.locator('[data-testid="encargo-periodo"]').count())
        pg.screenshot(path=f"{out}/{dev}-hoy-pantalla.png")
        print(dev, "aviso economía visible:", pg.get_by_text("dinero real").count() > 0)
        print(dev, "errores:", errs)
        ctx.close()
    b.close()
