import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { EMPRESA_TABS } from "../../components/ceo/empresa/tabs";
import { CAREER_TABS } from "../../components/ceo/career-tabs";
import { ceoGuideFor, ceoGuideKey, ceoGuideKeys, searchCeoGuide, type CompanyKind } from "./guide";

const KINDS: CompanyKind[] = ["continua", "crecimiento", "temporadas"];
const read = (f: string) => readFileSync(`src/components/ceo/${f}`, "utf8");
const text = (g: { title: string; purpose: string; shows: string[]; faqs: { q: string; a: string }[] }) =>
  [g.title, g.purpose, ...g.shows, ...g.faqs.flatMap((x) => [x.q, x.a])].join("\n");

describe("Guía de mêtis CEO · contenido por pantalla", () => {
  it("cada pantalla del menú tiene su guía, para cualquier tipo de empresa", () => {
    for (const path of ["/ceo", "/ceo/bandeja", "/ceo/empresa", "/ceo/carrera", "/ceo/academy", "/ceo/ajustes"]) {
      for (const kind of KINDS) {
        const g = ceoGuideFor(path, null, kind);
        expect(g.key, path).not.toBe("");
        expect(g.title.length, path).toBeGreaterThan(2);
        expect(g.purpose.length, path).toBeGreaterThan(20);
        expect(g.shows.length, `${path} ${kind}`).toBeGreaterThanOrEqual(2);
        expect(g.faqs.length, `${path} ${kind}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("cada pestaña de Empresa y de Carrera tiene una guía distinta", () => {
    const titles = new Set<string>();
    for (const t of EMPRESA_TABS) {
      for (const kind of KINDS) {
        const g = ceoGuideFor("/ceo/empresa", t.id, kind);
        expect(g.key).toBe(`/ceo/empresa#${t.id}`);
        expect(g.title).toBe(`Empresa · ${t.label}`);
        expect(g.shows.length, `${t.id} ${kind}`).toBeGreaterThanOrEqual(2);
        expect(g.faqs.length, `${t.id} ${kind}`).toBeGreaterThanOrEqual(3);
        titles.add(g.title);
      }
    }
    for (const t of CAREER_TABS) {
      for (const kind of KINDS) {
        const g = ceoGuideFor("/ceo/carrera", t.id, kind);
        expect(g.key).toBe(`/ceo/carrera#${t.id}`);
        expect(g.title).toBe(`Carrera · ${t.label}`);
        expect(g.faqs.length, `${t.id} ${kind}`).toBeGreaterThanOrEqual(3);
        titles.add(g.title);
      }
    }
    expect(titles.size).toBe(EMPRESA_TABS.length + CAREER_TABS.length);
  });

  it("Finanzas explica el estado de resultados, el margen, el EBITDA, el flujo, el cobro y la pista", () => {
    const g = ceoGuideFor("/ceo/empresa", "finanzas", "continua");
    const qs = g.faqs.map((x) => x.q).join("\n");
    for (const palabra of [/estado de resultados/i, /margen/i, /EBITDA/, /flujo de efectivo/i, /cobro/i, /pista/i, /costo/i]) expect(qs).toMatch(palabra);
    expect(g.shows.join("\n")).toMatch(/Estado de resultados/);
    expect(g.shows.join("\n")).toMatch(/Flujo de efectivo/);
    for (const x of g.faqs) expect(x.a.length, x.q).toBeGreaterThan(40);
  });

  it("la guía dice la verdad según el tipo de empresa", () => {
    // Empresa por temporadas: no lleva estados financieros.
    const legacy = ceoGuideFor("/ceo/empresa", "finanzas", "temporadas");
    expect(legacy.shows.join("\n")).toMatch(/no lleva estado de resultados/i);
    // Empresa de crecimiento: no hay reporte del mes ni pista en Hoy/Resumen.
    const hoy = ceoGuideFor("/ceo", null, "crecimiento");
    expect(hoy.faqs.some((x) => /reporte del mes/i.test(x.q))).toBe(false);
    expect(ceoGuideFor("/ceo", null, "continua").faqs.some((x) => /reporte del mes/i.test(x.q))).toBe(true);
    // Ninguna respuesta conserva la marca interna de tipo de empresa fuera de su lugar.
    for (const kind of KINDS) for (const k of ceoGuideKeys()) {
      const [path, view] = k.split("#");
      for (const x of ceoGuideFor(path, view, kind).faqs) expect(!x.only || x.only.includes(kind), `${k} ${x.q}`).toBe(true);
    }
  });

  it("sin pestaña elegida (o con una desconocida) abre la primera; las subrutas y direcciones raras no fallan", () => {
    expect(ceoGuideKey("/ceo/empresa")).toBe("/ceo/empresa#resumen");
    expect(ceoGuideKey("/ceo/empresa", "otra")).toBe("/ceo/empresa#resumen");
    expect(ceoGuideKey("/ceo/carrera", null)).toBe("/ceo/carrera#carrera");
    expect(ceoGuideKey("/ceo/reporte?mes=2")).toBe("/ceo/reporte");
    expect(ceoGuideKey("/ceo/empresa/")).toBe("/ceo/empresa#resumen");
    expect(ceoGuideKey("/ceo/")).toBe("/ceo");
    expect(ceoGuideKey("/ceo/algo-nuevo")).toBe("");
    const g = ceoGuideFor("/ceo/algo-nuevo");
    expect(g.title).toBe("mêtis CEO");
    expect(g.faqs.length).toBeGreaterThanOrEqual(3);
  });

  it("no hay preguntas repetidas dentro de una misma guía", () => {
    for (const kind of KINDS) for (const k of ceoGuideKeys()) {
      const [path, view] = k.split("#");
      const qs = ceoGuideFor(path, view, kind).faqs.map((x) => x.q);
      expect(new Set(qs).size, `${k} ${kind}`).toBe(qs.length);
    }
  });

  it("el texto respeta las reglas de la casa", () => {
    for (const kind of KINDS) for (const k of [...ceoGuideKeys(), "/ceo/otra"]) {
      const [path, view] = k.split("#");
      const t = text(ceoGuideFor(path, view, kind));
      expect(t, k).not.toMatch(/de cero a ceo|\blibro\b/i);
      expect(t, k).not.toMatch(/pr[oó]ximamente|en preparaci[oó]n|pr[oó]xima versi[oó]n|llegan? pronto|m[aá]s adelante:|todav[ií]a no est[aá] disponible|coming soon/i);
      expect(t, k).not.toMatch(/Emerging Leader|Functional Manager|Business Unit Director|Chief Operating Officer|Global CEO|Executive Journey|Executive Arena|para ascender|asciendes/);
      expect(t, k).not.toMatch(/[✓✗★☆]|\p{Extended_Pictographic}/u);
    }
  });
});

describe("Guía de mêtis CEO · buscador", () => {
  it("encuentra la duda y pone primero lo de la pantalla en la que estás", () => {
    const r = searchCeoGuide("margen", "/ceo/empresa", "finanzas");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].here).toBe(true);
    expect(r[0].q).toMatch(/margen/i);
    expect(new Set(r.map((x) => x.q)).size).toBe(r.length);
  });
  it("busca en todas las pantallas, sin acentos y con límite", () => {
    const r = searchCeoGuide("ebitda", "/ceo/ajustes");
    expect(r.length).toBeGreaterThan(0);
    expect(r.length).toBeLessThanOrEqual(6);
    expect(r.every((x) => !x.here)).toBe(true);
    expect(searchCeoGuide("estado de resultados", "/ceo").length).toBeGreaterThan(0);
    expect(searchCeoGuide("   ", "/ceo")).toEqual([]);
    expect(searchCeoGuide("xyzqwk", "/ceo")).toEqual([]);
  });
});

describe("Guía de mêtis CEO · botón", () => {
  it("vive en la pantalla principal, abajo a la derecha y por encima de la barra del celular", () => {
    const shell = read("CeoShell.tsx");
    expect(shell).toContain('import { CeoGuide } from "./CeoGuide";');
    expect((shell.match(/<CeoGuide \/>/g) ?? []).length).toBe(1);
    const guide = read("CeoGuide.tsx");
    expect(guide).toContain("fixed right-4");
    expect(guide).toContain("bottom-[calc(4.5rem+env(safe-area-inset-bottom))]");
    expect(guide).toContain("lg:bottom-5");
    expect(guide).toContain("z-40");
    expect(guide).toContain("HelpCircle");
    expect(guide).toContain("no-print");
  });
  it("lee la pestaña abierta y se puede cerrar con Escape", () => {
    const guide = read("CeoGuide.tsx");
    expect(guide).toContain('[role="tab"][id^="tab-"][aria-selected="true"]');
    expect(guide).toContain('"Escape"');
    expect(guide).toContain('role="dialog"');
    expect(read("PillTabs.tsx")).toMatch(/role="tab" id=\{`tab-\$\{t\.id\}`\} aria-selected/);
  });

  it("la barra de «Usar palanca» deja libre la esquina del botón", () => {
    const bar = read("ChangeView.tsx").match(/className="(fixed inset-x-0 bottom-\[72px\][^"]*)"/)?.[1] ?? "";
    expect(bar).toContain("pr-[4.25rem]");
    expect(bar).toContain("lg:pr-20");
    expect(bar).not.toMatch(/(^| )px-3( |$)/);
  });
});
