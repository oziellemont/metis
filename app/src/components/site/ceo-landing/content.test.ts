import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as C from "./content";
import { STAGES } from "../../../lib/ceo/journey";
import { COMPANIES } from "../../../lib/ceo/companies";

const DIR = "src/components/site/ceo-landing";
const sources = () => [...readdirSync(DIR).filter((f) => (f.endsWith(".tsx") && f !== "Legal.tsx") || f === "content.ts").map((f) => readFileSync(join(DIR, f), "utf8")), readFileSync("src/app/simulador/page.tsx", "utf8")].join("\n");
/** Copy visible: BANNED es la lista de control y AVAILABILITY es la matriz interna (no se muestra). */
const allCopy = () => { const { BANNED: _b, AVAILABILITY: _a, ...rest } = C; void _b; void _a; return JSON.stringify(rest).toLowerCase(); };

describe("landing de MÊTIS CEO", () => {
  it("la demo tiene tres opciones con consecuencias, intercambios y efectos distintos", () => {
    const o = C.DEMO.options;
    expect(o.map((x) => x.label)).toEqual(["Aceptar el descuento", "Negociar condiciones", "Mantener el precio"]);
    for (const k of ["now", "later"] as const) expect(new Set(o.map((x) => x[k].text)).size).toBe(3);
    expect(new Set(o.map((x) => x.tradeoff)).size).toBe(3);
    expect(new Set(o.map((x) => JSON.stringify(x.later.effects))).size).toBe(3);
    // un mes después, ninguna opción gana en todo ni pierde en todo
    for (const x of o) {
      const v = Object.values(x.later.effects);
      expect(v.some((n) => n > 0)).toBe(true);
      expect(v.some((n) => n < 0)).toBe(true);
    }
  });

  it("una sola experiencia: tras decidir se ve hoy y un mes después, con palabras en cada dimensión", () => {
    expect(C.DEMO.phases).toEqual(["Hoy", "Un mes después"]);
    expect(C.DEMO.title).toBe("Una decisión nunca afecta una sola cosa.");
    for (const x of C.DEMO.options) {
      expect(JSON.stringify(x.now.effects), x.id).not.toBe(JSON.stringify(x.later.effects));
      for (const ph of [x.now, x.later]) {
        for (const d of C.DIMS) {
          const w = ph.words[d.key];
          expect(w, `${x.id}/${d.key}`).toBeTruthy();
          // la palabra no contradice la dirección: «Sin cambios» solo con 0
          if (w === "Sin cambios") expect(ph.effects[d.key], `${x.id}/${d.key}`).toBe(0);
        }
      }
    }
    // ya no hay una segunda sección de efectos cruzados
    expect("RIPPLE" in C).toBe(false);
    expect(readdirSync(DIR)).not.toContain("Ripple.tsx");
  });

  it("el hero vuelve a mostrar el ciclo en cuatro escenas", () => {
    expect(C.STORY.scenes.map((s) => s.tab)).toEqual(["El caso", "Decides", "Aprendes", "Avanzas"]);
    const p = C.STORY.scenes.map((s) => s.pct);
    expect([...p].sort((a, b) => a - b)).toEqual(p);
    expect(C.PATH.stages.map((s) => s.name)).toContain(C.STORY.sube.stage);
    expect(C.PATH.stages.map((s) => s.name)).toContain(C.STORY.sube.next);
    const page = readFileSync("src/app/simulador/page.tsx", "utf8");
    expect(page.indexOf("<Story />")).toBeLessThan(page.indexOf("<FirstDecision />"));
  });

  it("la demo se declara ilustrativa y cierra con la invitación pedida", () => {
    expect(C.DEMO.disclaimer.toLowerCase()).toContain("ilustrativo");
    expect(C.DEMO.close).toBe("Eso fue una decisión. Imagina dirigir la empresa durante semanas.");
    expect(C.DEMO.cta).toBe("Empezar mi historia");
    expect(C.DEMO.retry).toBe("Volver a decidir");
    expect(C.DEMO.from.name).toBe("Héctor Salinas");
  });

  it("la demo está aislada: no importa el motor, el proveedor ni toca almacenamiento", () => {
    const src = readFileSync(join(DIR, "FirstDecision.tsx"), "utf8") + readFileSync(join(DIR, "Story.tsx"), "utf8");
    expect(src).not.toMatch(/lib\/ceo|CeoProvider|localStorage|supabase|fetch\(|track\(/);
  });

  it("las etapas coinciden con las del producto", () => {
    expect(C.PATH.stages.map((s) => s.name)).toEqual(STAGES.map((s) => s.name));
    // Sin subtítulo en español: el nombre de la etapa va solo en inglés.
    expect(C.PATH.stages.every((s) => !("es" in s))).toBe(true);
  });

  it("la carrera es una ruta: un punto de partida, un siguiente objetivo y el resto por desbloquear", () => {
    const st = C.PATH.stages.map((s) => s.state);
    expect(st[0]).toBe("inicio");
    expect(st[1]).toBe("siguiente");
    expect(st.slice(2).every((x) => x === "bloqueada")).toBe(true);
    expect(C.PATH.stages.map((s) => s.n)).toEqual(["01", "02", "03", "04", "05", "06"]);
    // Después de Global CEO sigue The Executive Arena (lo que la app llama exigencia Legendaria), sin fechas.
    expect(C.PATH.beyond.t).toBe("Después de Global CEO: The Executive Arena");
    expect(C.PATH.beyond.d).not.toMatch(/legendario|pronto|20\d\d/i);
    expect(C.AVAILABILITY.find((a) => a.item === "The Executive Arena")!.state).toBe("hoy");
  });

  it("el mensaje de Héctor suena a una persona y la decisión tiene argumentos en las tres opciones", () => {
    expect(C.DEMO.message.join(" ")).toContain("SuperNorte");
    expect(C.DEMO.message.at(-1)).toBe("¿Cómo lo manejamos?");
    // Aceptar ya no es obviamente malo: mejora algo más que una sola dimensión.
    const ok = (id: string) => Object.values(C.DEMO.options.find((o) => o.id === id)!.later.effects).filter((n) => n > 0).length;
    for (const id of ["aceptar", "negociar", "mantener"]) expect(ok(id)).toBeGreaterThanOrEqual(2);
    const total = (id: string) => Object.values(C.DEMO.options.find((o) => o.id === id)!.later.effects).reduce((a: number, b) => a + b, 0);
    const sums = ["aceptar", "negociar", "mantener"].map(total);
    expect(Math.max(...sums) - Math.min(...sums)).toBeLessThanOrEqual(1);
  });

  it("la landing es más corta: hero, decisión y seis bloques, sin secciones repetidas", () => {
    const page = readFileSync("src/app/simulador/page.tsx", "utf8");
    expect((page.match(/<[A-Z]\w+Section \/>/g) ?? []).length).toBe(6);
    expect(page).not.toMatch(/LearnSection|RhythmSection|WhoSection|AccessSection|RippleSection/);
    expect(C.HERO.who).toContain("aspiran a dirigir");
  });

  it("no publica precio, prueba gratuita ni cancelación mientras no exista cobro", () => {
    const txt = sources();
    expect(txt).not.toMatch(/CEO_PRICE_MXN|\$59|59 MXN/);
    expect(C.AVAILABILITY.find((a) => a.item.startsWith("Suscripción"))!.state).toBe("futuro");
  });

  it("lo que no existe se marca como próximo o futuro, nunca como disponible", () => {
    const hoy = C.AVAILABILITY.filter((a) => a.state === "hoy").map((a) => a.item.toLowerCase()).join(" ");
    for (const w of ["conversaciones", "generados", "respuestas escritas", "retos entre"]) expect(hoy).not.toContain(w);
    // La junta ya existe (lib/ceo/board.ts): se marca como disponible.
    expect(C.AVAILABILITY.find((a) => a.item === "Junta ante el Consejo")!.state).toBe("hoy");
    // Lo que no existe no se menciona: nada de «próximamente», respuestas escritas ni retos entre jugadores.
    expect(JSON.stringify({ ...C, AVAILABILITY: [], BANNED: [] }).toLowerCase()).not.toMatch(/respuestas escritas|retos entre jugadores/);
  });

  it("el tono evita frases genéricas y exceso de admiraciones", () => {
    const t = allCopy();
    for (const b of C.BANNED) expect(t).not.toContain(b);
    expect((t.match(/!/g) ?? []).length).toBe(0);
  });

  it("FAQ breve y CTA a rutas reales", () => {
    expect(C.FAQ.length).toBeGreaterThanOrEqual(4);
    expect(C.FAQ.length).toBeLessThanOrEqual(5);
    expect(C.FAQ.map((f) => f.q).join(" ")).toMatch(/experiencia[\s\S]*tiempo[\s\S]*cuenta[\s\S]*costo/i);
    expect(C.START_HREF).toBe("/ceo/empezar");
    expect(C.LOGIN_HREF.startsWith("/login")).toBe(true);
    expect(COMPANIES.length).toBe(3); // el copy dice «Tres empresas»
  });

  it("SEO con el título acordado y una sola h1", () => {
    expect(C.SEO.title).toBe("MÊTIS CEO | Aprende a dirigir tomando decisiones");
    expect((sources().match(/<h1\b/g) ?? []).length).toBe(1);
  });
});

describe("landing: una empresa que recuerda y cifras coherentes", () => {
  const txt = (o: unknown) => JSON.stringify(o);

  it("la experiencia no repite el caso SuperNorte: muestra personas que recuerdan y crisis sembradas antes", () => {
    expect(txt(C.DIFF)).not.toMatch(/SuperNorte|Sofía|descuento|margen/i);
    expect(C.DIFF.title).toBe("No estás respondiendo un examen. Estás dirigiendo.");
    expect(C.DIFF.eyebrow).toBe("Una empresa que recuerda tus decisiones");
    expect(C.DIFF.items.length).toBe(4);
    for (const e of C.DIFF.items) {
      // lo que regresa ocurre después de la decisión
      const d = (s: string) => Number(s.replace(/\D/g, ""));
      expect(d(e.back.day), e.t).toBeGreaterThan(d(e.decide.day));
    }
  });

  it("los ecos salen de Botanas Cumbre: mismos personajes, días y consecuencias que el juego", () => {
    const cumbre = COMPANIES.find((c) => c.id === "cumbre")!;
    const items = cumbre.items;
    const byId = (id: string) => items.find((i) => i.id === id)!;
    const body = (id: string) => byId(id).body.join(" ");
    const [hector, ana, planta, brilla] = C.DIFF.items;
    expect(body("c-hector-renuncia")).toContain("El nuevo ni me contestó");
    expect(hector.back.text).toContain("El nuevo ni me contestó");
    expect(hector.decide.day).toBe(`Día ${byId("d1-hector").day}`);
    expect(hector.back.day).toBe(`Día ${byId("c-hector-renuncia").day}`);
    expect(body("c-ana-renuncia")).toContain("nunca supe si mi trabajo servía");
    expect(ana.back.day).toBe(`Día ${byId("c-ana-renuncia").day}`);
    expect(ana.decide.day).toBe(`Día ${byId("d2-ana").day}`);
    expect(planta.decide.day).toBe(`Día ${byId("d3-planta").day}`);
    expect(planta.back.day).toBe(`Día ${byId("c-planta-accidente").day}`);
    expect(body("c-planta-accidente")).toContain("Toño");
    expect(brilla.back.day).toBe(`Día ${byId("c-ana-brilla").day}`);
    // iniciales del reparto real
    const initials = new Set(Object.values(cumbre.cast).map((p) => p.initials));
    for (const e of C.DIFF.items) expect(initials.has(e.back.initials), e.back.who).toBe(true);
  });

  it("las cifras del caso SuperNorte coinciden con el juego en toda la landing", () => {
    const sn = COMPANIES.find((c) => c.id === "cumbre")!.items.find((i) => i.id === "d2-supernorte")!;
    const rows = Object.fromEntries(sn.data!.rows);
    expect(rows["Margen de la cuenta hoy"]).toBe("7.1%");
    const facts = Object.fromEntries(C.DEMO.facts);
    expect(facts["Margen de la cuenta hoy"]).toBe("7.1%");
    expect(facts["Ventas con SuperNorte"]).toBe("31% del total");
    expect(Object.fromEntries(C.STORY.caso.facts)["Ventas con SuperNorte"]).toBe("31% del total");
    expect(sn.preview + sn.body.join(" ")).toContain("4 puntos");
    expect(C.STORY.caso.msg).toContain("4 puntos");
    expect(C.DEMO.message.join(" ")).toContain("4 puntos");
    // nada de las cifras viejas
    expect(txt({ ...C, AVAILABILITY: [], BANNED: [] })).not.toMatch(/12%|11%|24%|cuarta parte/);
    // Sofía se presenta antes de que se hable de ella
    expect(C.DEMO.message.join(" ")).toContain("Sofía Leal, la compradora de SuperNorte");
  });

  it("el desarrollo ejecutivo se marca como ejemplo conceptual con cifras ilustrativas", () => {
    expect(C.GROWTH.title).toBe("Tu criterio está evolucionando");
    expect(C.GROWTH.tag).toBe("Ejemplo conceptual");
    expect(C.GROWTH.disclaimer.toLowerCase()).toContain("ilustrativ");
    expect(C.GROWTH.bars.map((b) => [b.name, b.pct])).toEqual([["Pensamiento estratégico", 76], ["Gestión financiera", 59], ["Liderazgo de personas", 84], ["Manejo de crisis", 38]]);
    expect(C.GROWTH.next).toBe("Practicar decisiones financieras bajo presión.");
    const src = readFileSync(join(DIR, "Sections.tsx"), "utf8");
    expect(src).toContain("GROWTH.tag");
    expect(src).toContain("GROWTH.disclaimer");
  });

  it("la filosofía habla de personas como solución, sin historia de fundador", () => {
    expect(C.PHILOSOPHY.quote).toBe("Las personas no son el problema. Las personas son la solución.");
    expect(C.PHILOSOPHY.story).toContain("máximo potencial");
    expect(C.PHILOSOPHY.story).not.toMatch(/\bvi\b|construí/i);
  });
});
