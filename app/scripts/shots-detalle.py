"""Capturas de la ventana de detalle de mêtis CEO.

Empresa (Resumen y Personas) la abre centrada, con el fondo desenfocado y sin velo gris; Hoy la conserva a la derecha.
Mide dónde queda la tarjeta, qué estilo tiene el fondo y que cierre con Escape, con la X y al tocar fuera.
"""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3100")
seed = open(os.environ.get("SEED_FILE", "/tmp/seed.json")).read()
out = sys.argv[1] if len(sys.argv) > 1 else "/workspace/shots/detalle"
os.makedirs(out, exist_ok=True)
PROBLEMAS = []

MEDIR = """(testid) => {
  const card = document.querySelector(`[data-testid="${testid}"]`);
  if (!card) return null;
  const wrap = card.closest('[role="dialog"]');
  const veil = wrap.querySelector('[data-testid="detalle-fondo"]');
  const r = card.getBoundingClientRect(), w = wrap.getBoundingClientRect(), cs = getComputedStyle(veil);
  const body = card.querySelector('div.overflow-y-auto');
  return {
    forma: wrap.dataset.detalle,
    hijoDeBody: wrap.parentElement === document.body,
    cubre: [Math.round(w.left), Math.round(w.top), Math.round(w.width), Math.round(w.height)],
    pantalla: [window.innerWidth, window.innerHeight],
    tarjeta: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
    descentradoX: Math.round((r.left + r.width / 2) - window.innerWidth / 2),
    descentradoY: Math.round((r.top + r.height / 2) - window.innerHeight / 2),
    fondoColor: cs.backgroundColor,
    fondoBlur: cs.backdropFilter || cs.webkitBackdropFilter,
    radio: getComputedStyle(card).borderTopLeftRadius + ' / ' + getComputedStyle(card).borderBottomRightRadius,
    contenido: body ? [body.scrollHeight, body.clientHeight] : null,
    anchoDeMas: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    foco: card.contains(document.activeElement),
  };
}"""


def dismiss(pg):
    for label in ["Recordar más tarde", "Ahora no", "Más tarde"]:
        try:
            btn = pg.get_by_role("button", name=label)
            if btn.count():
                btn.first.click(); pg.wait_for_timeout(400)
        except Exception:
            pass


def check(dev, name, m, forma):
    print(dev, name, json.dumps(m, ensure_ascii=False))
    bad = []
    if m is None:
        PROBLEMAS.append(f"{dev} {name}: no abrió"); return
    if m["forma"] != forma: bad.append(f"forma {m['forma']}")
    if not m["hijoDeBody"]: bad.append("no cuelga de la página")
    if m["cubre"] != [0, 0] + m["pantalla"]: bad.append(f"no cubre la pantalla {m['cubre']}")
    x, y, w, h = m["tarjeta"]; W, H = m["pantalla"]
    if x < 0 or y < 0 or x + w > W or y + h > H: bad.append("la tarjeta se sale de la pantalla")
    if m["anchoDeMas"] > 0: bad.append(f"ancho de más {m['anchoDeMas']}")
    if not m["foco"]: bad.append("sin foco")
    if forma == "centro":
        if abs(m["descentradoX"]) > 1 or abs(m["descentradoY"]) > 1: bad.append(f"descentrada {m['descentradoX']},{m['descentradoY']}")
        if m["fondoColor"] not in ("rgba(0, 0, 0, 0)", "transparent"): bad.append(f"fondo con color {m['fondoColor']}")
        if "blur" not in (m["fondoBlur"] or ""): bad.append(f"fondo sin desenfoque {m['fondoBlur']}")
    else:
        if x + w != W: bad.append("no está pegada a la derecha")
    if bad: PROBLEMAS.append(f"{dev} {name}: " + "; ".join(bad))


def gone(pg, testid):
    return pg.locator(f'[data-testid="{testid}"]').count() == 0


with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    for dev, vp in [("desktop", {"width": 1440, "height": 900}), ("laptop", {"width": 1100, "height": 640}), ("mobile", {"width": 390, "height": 844}), ("mobile360", {"width": 360, "height": 640})]:
        movil = dev.startswith("mobile")
        ctx = b.new_context(viewport=vp, device_scale_factor=1, is_mobile=movil, has_touch=movil)
        ctx.add_init_script(f"try {{ if (!localStorage.getItem('metis-ceo-v1')) localStorage.setItem('metis-ceo-v1', {json.dumps(seed)}); }} catch (e) {{}}")
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        tap = (lambda loc: loc.tap()) if movil else (lambda loc: loc.click())

        # Empresa · Personas: cada persona abre centrada
        pg.goto(BASE + "/ceo/empresa#personas", wait_until="networkidle"); pg.wait_for_timeout(1300); dismiss(pg)
        people = pg.locator('[data-testid="persona"]')
        n = people.count()
        print(dev, "personas en pantalla:", n)
        tap(people.nth(1)); pg.wait_for_timeout(450)
        check(dev, "persona", pg.evaluate(MEDIR, "perfil-persona"), "centro")
        pg.screenshot(path=f"{out}/{dev}-persona.png")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(250)
        if not gone(pg, "perfil-persona"): PROBLEMAS.append(f"{dev} persona: no cerró con Escape")
        # todas abren, y la X cierra
        for i in range(n):
            tap(people.nth(i)); pg.wait_for_timeout(250)
            m = pg.evaluate(MEDIR, "perfil-persona")
            if m is None or m["forma"] != "centro" or abs(m["descentradoX"]) > 1 or abs(m["descentradoY"]) > 1:
                PROBLEMAS.append(f"{dev} persona {i}: {m}")
            tap(pg.locator('[data-testid="perfil-persona"] button[aria-label="Cerrar"]')); pg.wait_for_timeout(200)
            if not gone(pg, "perfil-persona"): PROBLEMAS.append(f"{dev} persona {i}: no cerró con la X")
        # tocar fuera cierra
        tap(people.nth(0)); pg.wait_for_timeout(300)
        pg.mouse.click(6, 6) if not movil else pg.touchscreen.tap(6, 6)
        pg.wait_for_timeout(250)
        if not gone(pg, "perfil-persona"): PROBLEMAS.append(f"{dev} persona: no cerró al tocar fuera")

        # Empresa · Resumen: salud y cada indicador abren centrados
        pg.goto(BASE + "/ceo/empresa", wait_until="networkidle"); pg.wait_for_timeout(1300); dismiss(pg)
        tap(pg.locator('main [data-testid="barra-salud"]')); pg.wait_for_timeout(450)
        check(dev, "salud", pg.evaluate(MEDIR, "panel-indicador"), "centro")
        pg.screenshot(path=f"{out}/{dev}-salud.png")
        # desde la salud se pasa a un indicador sin cerrar
        tap(pg.locator('[data-testid="panel-indicador"] ul button').first); pg.wait_for_timeout(450)
        check(dev, "indicador-desde-salud", pg.evaluate(MEDIR, "panel-indicador"), "centro")
        pg.screenshot(path=f"{out}/{dev}-indicador.png")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(250)
        if not gone(pg, "panel-indicador"): PROBLEMAS.append(f"{dev} indicador: no cerró con Escape")
        bars = pg.locator('main [data-testid="barras-indicadores"] button')
        for i in range(bars.count()):
            tap(bars.nth(i)); pg.wait_for_timeout(250)
            m = pg.evaluate(MEDIR, "panel-indicador")
            if m is None or m["forma"] != "centro" or abs(m["descentradoX"]) > 1 or abs(m["descentradoY"]) > 1:
                PROBLEMAS.append(f"{dev} indicador {i}: {m}")
            pg.keyboard.press("Escape"); pg.wait_for_timeout(200)

        # Hoy: sin cambios, panel a la derecha
        pg.goto(BASE + "/ceo", wait_until="networkidle"); pg.wait_for_timeout(1500); dismiss(pg)
        hero = pg.locator('[data-testid="barra-salud"]').first
        hero.scroll_into_view_if_needed(); tap(hero); pg.wait_for_timeout(450)
        m = pg.evaluate(MEDIR, "panel-indicador")
        print(dev, "hoy", json.dumps(m, ensure_ascii=False))
        if m is None or m["forma"] != "lado" or m["fondoColor"] in ("rgba(0, 0, 0, 0)", "transparent"):
            PROBLEMAS.append(f"{dev} hoy: {m}")
        elif not movil and m["tarjeta"][0] + m["tarjeta"][2] != m["pantalla"][0]:
            PROBLEMAS.append(f"{dev} hoy: no está a la derecha {m['tarjeta']}")
        pg.screenshot(path=f"{out}/{dev}-hoy.png")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(250)
        if not gone(pg, "panel-indicador"): PROBLEMAS.append(f"{dev} hoy: no cerró con Escape")

        print(dev, "errores:", errs)
        if errs: PROBLEMAS.append(f"{dev} errores de página: {errs}")
        ctx.close()
    b.close()
print("PROBLEMAS:", PROBLEMAS)
