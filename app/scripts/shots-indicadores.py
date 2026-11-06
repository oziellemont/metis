"""Capturas de la fase A de indicadores: barra madre en Hoy, panel de detalle y Mi empresa (escritorio y móvil)."""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3100"
seed = open("/tmp/seed.json").read()
out = sys.argv[1] if len(sys.argv) > 1 else "/workspace/shots-indicadores"
os.makedirs(out, exist_ok=True)


def dismiss(pg):
    for label in ["Recordar más tarde", "Ahora no", "Más tarde"]:
        try:
            btn = pg.get_by_role("button", name=label)
            if btn.count():
                btn.first.click(); pg.wait_for_timeout(600)
        except Exception:
            pass


with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    for dev, vp in [("desktop", {"width": 1366, "height": 900}), ("mobile", {"width": 390, "height": 844})]:
        ctx = b.new_context(viewport=vp, device_scale_factor=2 if dev == "mobile" else 1, is_mobile=dev == "mobile")
        ctx.add_init_script(f"try {{ if (!localStorage.getItem('metis-ceo-v1')) localStorage.setItem('metis-ceo-v1', {json.dumps(seed)}); }} catch (e) {{}}")
        pg = ctx.new_page()
        pg.goto(BASE + "/ceo", wait_until="networkidle"); pg.wait_for_timeout(1500); dismiss(pg)
        pg.locator('[data-testid="resumen-mandato"]').screenshot(path=f"{out}/{dev}-mandato.png")
        card = pg.locator("section.card", has_text="Tu empresa hoy").first
        card.scroll_into_view_if_needed(); pg.wait_for_timeout(400)
        card.screenshot(path=f"{out}/{dev}-empresa-hoy.png")
        pg.screenshot(path=f"{out}/{dev}-hoy.png", full_page=True)
        # Panel de un indicador
        card.locator('[data-testid="barras-indicadores"] button').first.click(); pg.wait_for_timeout(800)
        pg.screenshot(path=f"{out}/{dev}-panel-caja.png")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(400)
        card.locator('[data-testid="barra-salud"]').click(); pg.wait_for_timeout(800)
        pg.screenshot(path=f"{out}/{dev}-panel-salud.png")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(400)
        # Mi empresa
        pg.goto(BASE + "/ceo/empresa", wait_until="networkidle"); pg.wait_for_timeout(1200); dismiss(pg)
        sec = pg.locator('[data-testid="indicadores-empresa"]')
        sec.scroll_into_view_if_needed(); sec.screenshot(path=f"{out}/{dev}-mi-empresa.png")
        # Resultado de un caso decidido
        try:
            st = json.loads(seed)
            ids = list((st.get("decisions") or {}).keys())
            if ids:
                pg.goto(BASE + f"/ceo/caso/{ids[-1]}", wait_until="networkidle"); pg.wait_for_timeout(1500); dismiss(pg)
                rb = pg.locator('[data-testid="resultado-barras"]').first
                if rb.count():
                    rb.locator("xpath=ancestor::div[contains(@class,'card')][1]").screenshot(path=f"{out}/{dev}-resultado.png")
                else:
                    pg.screenshot(path=f"{out}/{dev}-resultado-pagina.png", full_page=True)
        except Exception as e:
            print("resultado", e)
        print(dev, "ok")
        ctx.close()
    b.close()
