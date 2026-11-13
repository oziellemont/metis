import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ACCESO_REVISION, AVANCE_PROVISIONAL, avisoSimulador, misionDelDia, otrosCasosText } from "./hoy";
import { ceoGuideFor, ceoGuideKeys } from "../guide";

const comp = (f: string) => readFileSync(`src/components/ceo/${f}`, "utf8");
const today = comp("Today.tsx");
const hoy = comp("HoyAprendizaje.tsx");
const regla = readFileSync("src/lib/ceo/metis2/hoy.ts", "utf8");

describe("MÊTIS 2.0 · Hoy sin el simulador de empresas", () => {
  it("Hoy decide con el interruptor de Ajustes: apagado, la práctica; encendido, el centro de mando de siempre", () => {
    expect(today).toContain("c.s.settings.simulador === true ? <TodaySimulador /> : <HoyAprendizaje />");
    // El centro de mando sigue completo dentro del mismo archivo: no se borró nada.
    for (const x of ["<KpiBoard hero />", "Misión del consejo", 'aria-label="Tu mandato"', 'data-testid="resumen-mandato"', 'data-testid="encargo-periodo"', "Tu empresa hoy", 'href="/ceo/empresa"']) expect(today, x).toContain(x);
    expect(today.indexOf("function TodaySimulador()")).toBeLessThan(today.indexOf("<KpiBoard hero />"));
  });

  it("con el simulador apagado no hay tablero de la empresa: ni indicadores, ni consejo, ni mandato, ni etapa", () => {
    for (const src of [hoy, regla]) {
      for (const x of ["KpiBoard", "KPI_KEYS", "c.verdict", "c.kpis", "c.health", "c.trajectory", "c.rules", "c.day", "passLine", "COMPANY_STAGES", "headlineOf", "AlertChips", "presenterOf", "pk.name", "pk.industry", "pk.kpiLabel", "pk.season"]) expect(src, x).not.toContain(x);
      expect(src).not.toMatch(/Caja|Margen|\bConsejo\b|Misión del consejo|Tu mandato|Tu empresa hoy|Director General|Exigencia|indicadores en|Salud/);
      expect(src).not.toMatch(/href="\/ceo\/(empresa|carrera)"/);
    }
    // Lo único que se dice del simulador es un conteo, con su enlace: nada queda escondido.
    expect(hoy).toContain('data-testid="hoy-aviso-simulador"');
  });

  it("muestra la práctica de hoy, las seis academias y el avance declarado como provisional", () => {
    for (const id of ["hoy-aprendizaje", "hoy-mision", "hoy-decisiones", "hoy-academias", "hoy-provisional", "hoy-revision"]) expect(hoy, id).toContain(`data-testid="${id}"`);
    expect(hoy).toContain("practiceByAcademy(");
    expect(hoy).toContain("decidedOf(c.s)");
    expect(hoy).toContain("{AVANCE_PROVISIONAL}");
    expect(AVANCE_PROVISIONAL).toMatch(/^Avance provisional\./);
    expect(AVANCE_PROVISIONAL).toMatch(/No mide dominio, no sube niveles y no acredita nada/);
    for (const href of ["/ceo/bandeja", "/ceo/academy", "/ceo/progreso", "/ceo/perfil#liderazgo"]) expect(hoy, href).toContain(`href="${href}"`);
    // El dilema del día y el día tranquilo siguen funcionando igual.
    expect(hoy).toMatch(/<DilemmaPrompt \/>/);
    expect(hoy).toContain("c.resumeCareer");
  });

  it("no muestra barras de criterio ni niveles: eso es de la entrega 3.3 y sus reglas no están validadas", () => {
    expect(hoy).not.toMatch(/metis2\/dominio|masteryOf|Tu criterio ejecutivo|levelLabel|tramoOf/);
    expect(hoy).not.toMatch(/\bNivel \d|aprobad|acreditad/i);
  });

  it("el acceso a las experiencias en revisión lo ven solo las cuentas del equipo, y dice que no cuentan", () => {
    expect(hoy).toMatch(/\{c\.testTools && \(\s*<section data-testid="hoy-revision"/);
    expect(ACCESO_REVISION.title).toBe("Solo para revisión");
    expect(ACCESO_REVISION.href).toBe("/ceo/piloto");
    expect(ACCESO_REVISION.text).toMatch(/No cuentan para el avance, el nivel ni el perfil/);
    // Sigue fuera del menú.
    expect(readFileSync("src/lib/ceo/metis2/menu.ts", "utf8")).not.toMatch(/piloto/i);
  });

  it("la práctica de hoy propone una sola cosa: caso, luego caso ejecutivo, luego lección, luego Academy", () => {
    const caso = { id: "c1", subject: "El proveedor sube 8 %", who: "Marta", due: "3 h" };
    const episodio = { id: "e1", subject: "La planta se detiene", minutes: 12, started: false };
    const leccion = { id: "l1", title: "Leer un estado de resultados", minutes: 6 };
    expect(misionDelDia({ caso, episodio, leccion })).toMatchObject({ kind: "caso", href: "/ceo/caso/c1", title: "El proveedor sube 8 %", cta: "Resolver el caso" });
    expect(misionDelDia({ caso, episodio, leccion }).text).toBe("Marta espera tu decisión. Vence en 3 h.");
    expect(misionDelDia({ episodio, leccion })).toMatchObject({ kind: "caso_ejecutivo", href: "/ceo/episodio/e1", cta: "Abrir el caso" });
    expect(misionDelDia({ episodio: { ...episodio, started: true } }).cta).toBe("Continuar el caso");
    expect(misionDelDia({ leccion })).toMatchObject({ kind: "leccion", href: "/ceo/academy/l1", cta: "Abrir la lección" });
    expect(misionDelDia({})).toMatchObject({ kind: "academy", href: "/ceo/academy" });
    expect(misionDelDia({ caso: null, episodio: null, leccion: null }).kind).toBe("academy");
  });

  it("los demás casos se cuentan con su texto en singular y plural", () => {
    expect(otrosCasosText(0)).toBe("");
    expect(otrosCasosText(1)).toBe("Otro caso espera tu decisión");
    expect(otrosCasosText(4)).toBe("Otros 4 casos esperan tu decisión");
  });

  it("lo pendiente del simulador se avisa con un conteo y un enlace directo, sin cifras de la empresa", () => {
    expect(avisoSimulador({ asuntos: [], periodoCerrado: false })).toBeNull();
    const uno = avisoSimulador({ asuntos: ["/ceo/reporte"], periodoCerrado: false })!;
    expect(uno.text).toMatch(/^El simulador de empresas tiene un asunto propio esperando\./);
    expect(uno).toMatchObject({ href: "/ceo/reporte", cta: "Abrirlo" });
    const tres = avisoSimulador({ asuntos: ["/ceo/crisis", "/ceo/junta", "/ceo/empresa#crecimiento"], periodoCerrado: false })!;
    expect(tres.text).toMatch(/tiene 3 asuntos propios esperando/);
    expect(tres).toMatchObject({ href: "/ceo/crisis", cta: "Abrir el primero" });
    const cierre = avisoSimulador({ asuntos: [], periodoCerrado: true })!;
    expect(cierre.text).toMatch(/cerró su periodo/);
    expect(cierre.href).toBe("/ceo/carrera");
    // Con un cierre de mes pendiente y el periodo cerrado, primero el reporte.
    expect(avisoSimulador({ asuntos: ["/ceo/reporte"], periodoCerrado: true })!.href).toBe("/ceo/reporte");
    for (const a of [uno, tres, cierre]) { expect(a.text).toMatch(/encender el simulador en Ajustes/); expect(a.text).not.toMatch(/\d+ ?%|\$/); }
  });

  it("la guía «?» de Hoy cambia con el interruptor y no habla del tablero cuando está apagado", () => {
    const off = ceoGuideFor("/ceo", null, "continua", false);
    const on = ceoGuideFor("/ceo", null, "continua", true);
    expect(off.key).toBe("/ceo");
    expect(off.title).toBe("Hoy");
    expect(off.purpose).toMatch(/Tu práctica de hoy/);
    expect(on.purpose).toMatch(/centro de mando/);
    expect(ceoGuideFor("/ceo").purpose).toBe(on.purpose);
    const txt = [off.purpose, ...off.shows, ...off.faqs.flatMap((x) => [x.q, x.a])].join("\n");
    expect(txt).not.toMatch(/panel blanco|Salud ≥|tu mandato/i);
    expect(txt).toMatch(/provisional/);
    expect(txt).toContain("Mostrar el simulador de empresas");
    expect(off.shows.length).toBeGreaterThanOrEqual(2);
    expect(off.faqs.length).toBeGreaterThanOrEqual(3);
    // Reglas de texto de todas las guías.
    expect(txt).not.toMatch(/Emerging Leader|Functional Manager|Business Unit Director|Chief Operating Officer|Global CEO|Executive Journey|Executive Arena|para ascender|asciendes/);
    expect(txt).not.toMatch(/pr[oó]ximamente|en preparaci[oó]n|pr[oó]xima versi[oó]n|llegan? pronto|m[aá]s adelante:|todav[ií]a no est[aá] disponible|coming soon/i);
    // Las demás pantallas no cambian con el interruptor, y la variante no cuenta como pantalla aparte.
    for (const p of ["/ceo/bandeja", "/ceo/academy", "/ceo/progreso", "/ceo/perfil", "/ceo/ajustes"]) expect(ceoGuideFor(p, null, "continua", false)).toEqual(ceoGuideFor(p, null, "continua", true));
    expect(ceoGuideKeys().some((k) => k.includes("!"))).toBe(false);
    expect(comp("CeoGuide.tsx")).toContain("ceoGuideFor(path, view, kind, sim)");
  });

  it("Ajustes dice lo que cambia al encender o apagar el simulador", () => {
    const st = comp("CeoSettings.tsx");
    expect(st).toMatch(/y el tablero de la empresa en Hoy/);
    expect(st).toMatch(/Hoy muestra tu práctica del día/);
    expect(st).toMatch(/Hoy muestra el tablero de la empresa/);
  });
});
