"""Capturas de Carrera con sus dos vistas (Mi carrera / Mi perfil), el menú sin Perfil y la dirección anterior de Perfil."""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3100")
seed = open(os.environ.get("SEED_FILE", "/tmp/seed.json")).read()
out = sys.argv[1] if len(sys.argv) > 1 else "/workspace/shots/carrera"
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
        pg.goto(BASE + "/ceo/carrera", wait_until="networkidle"); pg.wait_for_timeout(1500); dismiss(pg)
        print(dev, "pestañas:", [t.inner_text() for t in pg.get_by_role("tab").all()], "activa:", pg.locator('[role="tab"][aria-selected="true"]').inner_text())
        pg.screenshot(path=f"{out}/{dev}-mi-carrera.png", full_page=True)
        pg.screenshot(path=f"{out}/{dev}-mi-carrera-top.png")
        pg.get_by_role("tab", name="Mi perfil").click(); pg.wait_for_timeout(800)
        print(dev, "tras clic:", pg.locator('[role="tab"][aria-selected="true"]').inner_text(), "| liderazgo:", pg.locator('[data-testid="mi-liderazgo"]').count(), "| url:", pg.url.replace(BASE, ""))
        pg.screenshot(path=f"{out}/{dev}-mi-perfil.png", full_page=True)
        pg.screenshot(path=f"{out}/{dev}-mi-perfil-top.png")
        # «ver trayectoria» dentro de Mi perfil regresa a Mi carrera sin cambiar de página
        pg.get_by_role("button", name="ver trayectoria").click(); pg.wait_for_timeout(600)
        print(dev, "ver trayectoria ->", pg.locator('[role="tab"][aria-selected="true"]').inner_text(), "| url:", pg.url.replace(BASE, ""))
        # la dirección anterior de Perfil manda a Carrera, vista Mi perfil
        pg.goto(BASE + "/ceo/perfil", wait_until="networkidle"); pg.wait_for_timeout(1200)
        print(dev, "/ceo/perfil ->", pg.url.replace(BASE, ""), "| activa:", pg.locator('[role="tab"][aria-selected="true"]').inner_text())
        pg.goto(BASE + "/ceo/perfil#experiencia", wait_until="networkidle"); pg.wait_for_timeout(1500)
        print(dev, "/ceo/perfil#experiencia ->", pg.url.replace(BASE, ""), "| activa:", pg.locator('[role="tab"][aria-selected="true"]').inner_text(), "| experiencia a la vista:", pg.locator("#experiencia").is_visible())
        # menú: Perfil ya no aparece
        nav = pg.locator("aside a, nav.fixed a") if dev == "desktop" else pg.locator("nav.fixed a")
        labels = [(a.get_attribute("aria-label") or a.inner_text()).strip().split("\n")[0] for a in nav.all()]
        print(dev, "menú:", labels)
        # Empresa sigue igual con el selector compartido
        pg.goto(BASE + "/ceo/empresa", wait_until="networkidle"); pg.wait_for_timeout(1200); dismiss(pg)
        pg.get_by_role("tab", name="Finanzas").click(); pg.wait_for_timeout(600)
        print(dev, "empresa pestañas:", [t.inner_text() for t in pg.get_by_role("tab").all()], "activa:", pg.locator('[role="tab"][aria-selected="true"]').inner_text())
        pg.screenshot(path=f"{out}/{dev}-empresa-top.png")
        print(dev, "errores:", errs)
        ctx.close()
    b.close()
