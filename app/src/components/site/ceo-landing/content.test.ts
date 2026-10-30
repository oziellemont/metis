import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as C from "./content";
import { BANNED_EN, EN } from "./content-en";
import { STAGES } from "../../../lib/ceo/journey";
import { COMPANIES } from "../../../lib/ceo/companies";
import { avatarHex } from "../../../lib/ceo/cast";
import { lessonById } from "../../../lib/ceo/lessons";

const DIR = "src/components/site/ceo-landing";
const PAGES = ["src/app/simulador/page.tsx", "src/app/simulador/en/page.tsx"];
const read = (f: string) => readFileSync(join(DIR, f), "utf8");
const sources = () => [...readdirSync(DIR).filter((f) => (f.endsWith(".tsx") && f !== "Legal.tsx") || f === "content.ts" || f === "content-en.ts").map(read), ...PAGES.map((p) => readFileSync(p, "utf8"))].join("\n");
/** Copy visible: BANNED es la lista de control y AVAILABILITY es la matriz interna (no se muestra). */
const allCopy = () => JSON.stringify(C.ES).toLowerCase();
const enCopy = () => JSON.stringify(EN).toLowerCase();
const cumbre = COMPANIES.find((c) => c.id === "cumbre")!;
const sn = cumbre.items.find((i) => i.id === "d2-supernorte")!;

/** Mismas claves en los dos idiomas (en cualquier nivel), para que nada quede sin traducir. */
function shape(o: unknown): unknown {
  if (Array.isArray(o)) return o.map(shape);
  if (o && typeof o === "object") return Object.fromEntries(Object.keys(o).sort().map((k) => [k, shape((o as Record<string, unknown>)[k])]));
  return typeof o;
}

describe("landing de MÊTIS CEO · primer bloque", () => {
  it("el primer bloque dice qué es mêtis con la frase pedida y una sola h1", () => {
    expect(C.HERO.title).toBe("Unos minutos al día. Decisiones que te hacen crecer.");
    expect(C.HERO.eyebrow).toBe("Simulador de dirección");
    expect(C.HERO.body).toBe("Vive los retos de dirigir una empresa: recibe mensajes de tu equipo, resuelve situaciones de negocio y aprende de sus consecuencias para desarrollar tu criterio como líder.");
    expect(EN.HERO.body).toBe("Live the challenges of running a company: get messages from your team, solve business situations and learn from their consequences to develop your judgment as a leader.");
    expect(allCopy()).not.toContain("una decisión nunca afecta una sola cosa");
    expect((sources().match(/<h1\b/g) ?? []).length).toBe(1);
    const landing = read("Landing.tsx");
    expect(landing.indexOf("<CaseDemo")).toBeLessThan(landing.indexOf("<HowSection"));
  });

  it("el caso de al lado es SuperNorte tal cual está en el juego (correo, datos, pregunta, opciones, respuestas y bitácora)", () => {
    const k = C.CASE;
    expect(sn.channel).toBe("email");
    expect(k.subject).toBe(sn.subject);
    expect(k.body).toEqual(sn.body);
    expect(k.context.data.title).toBe(sn.data!.title);
    expect(k.context.data.rows).toEqual(sn.data!.rows);
    expect(k.context.data.note).toBe(sn.data!.note);
    expect(k.decide.ask).toBe(sn.ask);
    expect(k.options.map((o) => o.id)).toEqual(sn.options.map((o) => o.id));
    for (const o of k.options) {
      const g = sn.options.find((x) => x.id === o.id)!;
      expect(o.text).toBe(g.text);
      expect(o.reply).toEqual(g.reply);
      expect(o.outcome).toBe(g.outcome);
      // efectos del nivel inicial (sin escalar), con las etiquetas de la empresa y en el mismo orden
      expect(o.effects).toEqual(Object.entries(g.effects).map(([kk, v]) => [cumbre.kpiLabel[kk as keyof typeof cumbre.kpiLabel], v]));
    }
    expect(k.learn.title).toBe(sn.bitacora.title);
    expect(k.learn.text).toBe(sn.bitacora.text);
    expect(k.learn.nota).toBe(sn.bitacora.nota);
    const lesson = lessonById(sn.lesson!)!;
    expect(k.learn.lesson).toBe(`${lesson.title} · ${lesson.minutes} min`);
    const sofia = cumbre.cast.sofia;
    expect(k.from).toMatchObject({ name: sofia.name, initials: sofia.initials, role: sofia.role, tone: avatarHex(cumbre, "sofia") });
    expect(k.to).toContain(`direccion@${cumbre.domain}`);
  });

  it("el caso avanza como en la app: mismos pasos, mismos botones y mismas reglas de navegación", () => {
    expect(C.CASE.steps).toEqual(["El caso", "Contexto", "Decides", "Resultado", "Aprendes"]);
    const app = readFileSync("src/components/ceo/CaseView.tsx", "utf8");
    expect(app).toContain('const CASE_STEPS = ["El caso", "Contexto", "Decides", "Resultado", "Aprendes"]');
    for (const s of [C.CASE.received, C.CASE.context.eyebrow, C.CASE.context.title, C.CASE.decide.eyebrow, C.CASE.decide.cta, ...C.CASE.nav.next.filter(Boolean)]) expect(app, s).toContain(s);
    const demo = read("CaseDemo.tsx");
    // antes de decidir no se pasa de «Decides»; después, no se regresa a decidir
    expect(demo).toContain("const back = step === 0 || (done && step === 3) ? undefined : () => go(step - 1);");
    expect(demo).toContain("const fwd = step < 2 ? () => go(step + 1) : done && step === 3 ? () => go(4) : undefined;");
    // mismo aspecto que la pantalla de decisión: fondo, barras y opciones
    for (const s of ["from-[#0F1130] via-[#1A1650] to-[#2B1F8A]", "bg-mint", "bg-white/60", "bg-white/15", "shadow-[0_0_0_4px_rgba(109,93,246,.35)]", "aria-pressed"]) expect(demo).toContain(s);
  });

  it("las demos están aisladas: no importan el motor, el proveedor ni tocan almacenamiento", () => {
    const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
    const src = code(read("CaseDemo.tsx") + read("HowSlides.tsx") + read("Memory.tsx") + read("Landing.tsx"));
    expect(src).not.toMatch(/lib\/ceo|CeoProvider|localStorage|supabase|fetch\(|track\(/);
    // la demo vieja y el cuadro de cuatro escenas ya no existen (eran el mismo caso dos veces)
    for (const f of ["FirstDecision.tsx", "Story.tsx", "Effects.tsx", "TryButton.tsx"]) expect(readdirSync(DIR)).not.toContain(f);
    expect("DEMO" in C || "STORY" in C || "DIMS" in C).toBe(false);
  });
});

describe("landing de MÊTIS CEO · bloques", () => {
  it("orden: primer bloque, cómo funciona, empresa que recuerda, carrera, filosofía, preguntas y cierre", () => {
    const page = read("Landing.tsx");
    const order = ["<CaseDemo", "<HowSection", "<MemorySection", "<PathSection", "<PhilosophySection", "<FaqSection", "<CloseSection"];
    const at = order.map((t) => page.indexOf(t));
    expect(at.every((n) => n > 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    for (const p of PAGES) expect(readFileSync(p, "utf8")).toMatch(/<Landing t=\{(ES|EN)\} \/>/);
  });

  it("un mismo CTA y un mismo destino en encabezado, primer bloque y cierre; sin acciones competidoras", () => {
    expect(C.CTA).toBe("Comenzar gratis");
    expect(EN.CTA).toBe("Start free");
    const files = { landing: read("Landing.tsx"), header: read("Header.tsx"), sections: read("Sections.tsx") };
    for (const [k, src] of Object.entries(files)) expect(src, k).toMatch(/<CeoCta label=\{t\.CTA\} playingLabel=\{(t\.UI|U)\.playing\}/);
    const all = Object.values(files).join("\n") + read("CaseDemo.tsx") + read("HowSlides.tsx");
    expect(all.match(/btn bg-mint/g) ?? []).toEqual([]);
    expect(readFileSync("src/components/site/CeoCta.tsx", "utf8")).toContain('"/ceo/empezar"');
  });

  it("cómo funciona: el título se queda y vuelven los tres pasos de antes; el primero dice «en cualquier momento del día»", () => {
    expect(C.HOW.title).toBe("Practica con casos que evolucionan.");
    expect(C.HOW.steps.map((s) => s.t)).toEqual(["Recibes una situación", "Tomas una decisión", "Aprendes de lo que ocurre"]);
    expect(C.HOW.steps[0].d).toContain("en cualquier momento del día");
  });

  it("cómo funciona: tres pantallas en secuencia (correo → Hoy → decidido) que salen del mismo caso", () => {
    const S = C.HOW.slides;
    expect(S.tabs).toEqual(["Llega el correo", "Lo ves en Hoy", "Ya decidiste"]);
    expect(S.today.title).toBe("Esperando tu decisión");
    expect(readFileSync("src/components/ceo/Today.tsx", "utf8")).toContain(S.today.title);
    expect(sn.preview).toContain(S.inbox.preview.replace("Para mantener sus dos frentes de anaquel necesitamos ", "").replace("…", ""));
    // la bandeja del día 2: los asuntos y los remitentes son los del juego
    for (const it of S.today.items) {
      const g = cumbre.items.find((x) => x.day === 2 && personName(x.from) === it.name)!;
      expect(g, it.name).toBeTruthy();
      expect(it.channel).toBe(g.channel);
      expect(g.channel === "whatsapp" ? g.preview : g.subject).toBe(it.text);
      expect(it.tone).toBe(avatarHex(cumbre, g.from));
    }
    expect(C.CASE.options.map((o) => o.id)).toContain(S.done.option);
    const src = read("HowSlides.tsx");
    for (const s of ["prefers-reduced-motion", "HOW_INTERVAL_MS", "onFocusCapture", "inert=", "aria-current"]) expect(src).toContain(s);
    // sin el marco oscuro: tarjeta blanca limpia con sombra sutil
    expect(src).not.toContain("bg-ink p-2");
    expect(read("Sections.tsx")).toContain("<HowSlides t={t} />");
  });

  it("carrusel: una historia a la vez, cambia sola cada 4 s, sin botón de pausa, con anterior/siguiente e indicadores", () => {
    expect(C.MEMORY_INTERVAL_MS).toBe(4000);
    expect(C.HOW_INTERVAL_MS).toBe(7000);
    const src = read("Memory.tsx");
    for (const s of ["prefers-reduced-motion", "L.prev", "L.next", "aria-roledescription={L.role}", "onFocusCapture", "inert=", "MEMORY_INTERVAL_MS"]) expect(src).toContain(s);
    for (const s of ["Pause", "L.pause", "L.play", "setPlaying((v)"]) expect(src).not.toContain(s);
    expect(C.DIFF.carousel).not.toHaveProperty("pause");
  });

  it("carrera: el texto también habla de aprender; seis etapas iguales a las del producto y Executive Arena aparte", () => {
    expect(C.PATH.title).toBe("Una carrera que crece contigo.");
    expect(C.PATH.body).toMatch(/aprendizaje/);
    expect(C.PATH.body).toMatch(/mêtis Academy/);
    expect(C.PATH.stages.map((s) => s.name)).toEqual(STAGES.map((s) => s.name));
    expect(EN.PATH.stages.map((s) => s.name)).toEqual(STAGES.map((s) => s.name));
    const st = C.PATH.stages.map((s) => s.state);
    expect(st[0]).toBe("inicio");
    expect(st[1]).toBe("siguiente");
    expect(st.slice(2).every((x) => x === "bloqueada")).toBe(true);
    const sec = read("Sections.tsx");
    expect(sec).toContain('<span className="sr-only">{PATH.stateLabel[s.state]}</span>');
    expect(sec).toContain("<ArenaLock t={t} />");
    expect(C.PATH.beyond.t).toBe("The Executive Arena");
    expect(C.PATH.beyond.d).toMatch(/^Después de Global CEO/);
    const lock = read("ArenaLock.tsx");
    expect(lock).not.toMatch(/<button|<a |<Link|onClick/);
  });

  it("filosofía breve y firma", () => {
    expect(C.PHILOSOPHY.title).toBe("Dirigir es una responsabilidad. Y vale la pena prepararse para ella.");
    expect(C.PHILOSOPHY.author).toBe("Oziel Leal Montemayor");
    expect(allCopy().split("aspiran a dirigir").length - 1).toBe(1);
  });

  it("FAQ breve, industrias reales y CTA a rutas reales", () => {
    expect(C.FAQ.length).toBe(6);
    const ind = C.FAQ.find((f) => /industrias/.test(f.q))!.a.toLowerCase();
    for (const c of COMPANIES) expect(ind).toContain(c.industry.toLowerCase());
    expect(C.START_HREF).toBe("/ceo/empezar");
    expect(C.LOGIN_HREF).toBe("/entrar");
  });

  it("no publica precio, prueba gratuita ni cancelación mientras no exista cobro", () => {
    expect(sources()).not.toMatch(/CEO_PRICE_MXN|\$59|59 MXN/);
    expect(C.AVAILABILITY.find((a) => a.item.startsWith("Suscripción"))!.state).toBe("futuro");
  });

  it("lo que no existe no se menciona", () => {
    const hoy = C.AVAILABILITY.filter((a) => a.state === "hoy").map((a) => a.item.toLowerCase()).join(" ");
    for (const w of ["conversaciones", "generados", "respuestas escritas", "retos entre"]) expect(hoy).not.toContain(w);
    expect(allCopy() + enCopy()).not.toMatch(/respuestas escritas|retos entre jugadores|written answers|player challenges/);
  });

  it("el tono evita frases genéricas y exceso de admiraciones (en los dos idiomas)", () => {
    for (const b of C.BANNED) expect(allCopy()).not.toContain(b);
    for (const b of BANNED_EN) expect(enCopy(), b).not.toMatch(new RegExp(`\\b${b}`));
    expect(((allCopy() + enCopy()).match(/!/g) ?? []).length).toBe(0);
  });

  it("SEO con el título acordado", () => {
    expect(C.SEO.title).toBe("MÊTIS CEO | Aprende a dirigir tomando decisiones");
  });
});

describe("landing de MÊTIS CEO · inglés", () => {
  it("la versión en inglés tiene exactamente la misma forma que la española (nada queda sin traducir)", () => {
    // el inglés suma una pregunta (idioma del simulador); el resto es idéntico
    const { FAQ: fe, ...en } = EN, { FAQ: fs, ...es } = C.ES;
    expect(shape(en)).toEqual(shape(es));
    expect(shape(fe[0])).toEqual(shape(fs[0]));
    // y no repite texto en español fuera de nombres propios
    for (const k of ["HERO", "HOW", "PATH", "PHILOSOPHY", "CLOSE", "UI"] as const) expect(JSON.stringify(EN[k]), k).not.toMatch(/ción\b|Comenzar|decisión|empresa\b|Iniciar/);
  });

  it("usa las frases de Oziel en los titulares", () => {
    const heads = [EN.HERO.motto, EN.HOW.title, EN.DIFF.title, EN.PATH.title, EN.PHILOSOPHY.title, EN.PHILOSOPHY.body, EN.CLOSE.title, EN.CLOSE.body, EN.FOOTER.tagline, EN.SEO.title].join(" | ");
    for (const f of ["Every decision shapes the leader you become.", "Practice the decisions before they become yours.", "Think beyond the obvious.", "Leadership isn't a title. It's a practice.", "Leadership is a responsibility. Prepare for it.", "Great leaders aren't born ready.", "Tomorrow's leaders start deciding today.", "Before the title, build the judgment.", "Where leadership is practiced, not preached."]) expect(heads, f).toContain(f);
    // «The decisions are simulated. The learning is real.» espera evidencia antes de publicarse
    expect(enCopy()).not.toContain("the learning is real");
    expect(EN.HERO.title).toBe("Your next challenge can arrive at any moment.");
  });

  it("dice con claridad que el simulador está en español y conserva los mismos datos del caso", () => {
    expect(EN.FAQ.some((f) => /Spanish/.test(f.a))).toBe(true);
    expect(EN.FAQ.length).toBe(C.FAQ.length + 1);
    expect(EN.CASE.options.map((o) => o.effects.map(([, v]) => v))).toEqual(C.CASE.options.map((o) => o.effects.map(([, v]) => v)));
    expect(EN.CASE.context.data.rows.map(([, v]) => v.replace(/\s/g, "")).join()).toMatch(/\$127M.*7\.1%.*3\.1%.*\$5\.1M.*\$10M.*1\.4×/);
    expect(EN.DIFF.items.map((e) => [e.decide.day, e.back.day, e.back.initials, e.tone])).toEqual(C.DIFF.items.map((e) => [e.decide.day.replace("Día", "Day"), e.back.day.replace("Día", "Day"), e.back.initials, e.tone]));
  });

  it("cada idioma tiene su ruta, su lang y enlaces alternos; el selector lleva a la otra versión", () => {
    expect(C.LANG_HREF).toEqual({ es: "/", en: "/en" });
    const es = readFileSync(PAGES[0], "utf8"), en = readFileSync(PAGES[1], "utf8");
    for (const p of [es, en]) expect(p).toMatch(/languages: \{ "es-MX": CEO_URL, en: /);
    expect(en).toContain("canonical: URL_EN");
    expect(read("Landing.tsx")).toContain('lang={t.lang === "en" ? "en" : "es-MX"}');
    const h = read("Header.tsx");
    expect(h).toContain("href={LANG_HREF[other]} hrefLang={other}");
    expect(C.UI.switchShort).toBe("EN");
    expect(EN.UI.switchShort).toBe("ES");
    const mw = readFileSync("src/middleware.ts", "utf8");
    expect(mw).toContain('u.pathname = "/simulador/en"');
  });
});

function personName(id: string) { return cumbre.cast[id]?.name; }

describe("landing: una empresa que recuerda y cifras coherentes", () => {
  const txt = (o: unknown) => JSON.stringify(o);

  it("la experiencia no repite el caso SuperNorte: muestra personas que recuerdan y crisis sembradas antes", () => {
    expect(txt(C.DIFF)).not.toMatch(/SuperNorte|Sofía|descuento|margen/i);
    expect(C.DIFF.title).toBe("Tus decisiones siguen teniendo consecuencias.");
    expect(C.DIFF.eyebrow).toBe("Una empresa que recuerda");
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

  it("sin cifras viejas del caso SuperNorte en ningún idioma", () => {
    const rows = Object.fromEntries(sn.data!.rows);
    expect(rows["Margen de la cuenta hoy"]).toBe("7.1%");
    expect(sn.preview + sn.body.join(" ")).toContain("4 puntos");
    expect(txt(C.ES) + txt(EN)).not.toMatch(/12%|11%|24%|cuarta parte/);
  });


});

describe("landing: ancho de página", () => {
  it("header, hero y secciones comparten el mismo ancho, un poco más amplio (max-w-7xl)", () => {
    for (const f of ["Header.tsx", "Landing.tsx", "Sections.tsx"]) {
      expect(read(f), f).toContain("mx-auto max-w-7xl px-5 sm:px-6 lg:px-8");
      expect(read(f), f).not.toContain("max-w-6xl");
    }
  });
});
