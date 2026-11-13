import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * MÊTIS 2.0 · Arquitectura de cuatro pestañas: la propuesta (`docs/metis2/09-arquitectura-cuatro-pestanas.md`).
 *
 * La propuesta es un documento: no cambia ninguna pantalla. Estas pruebas vigilan que el inventario de lo que depende de
 * Bandeja esté completo (ningún archivo que la mencione queda fuera) y que el documento no prometa nada con frases vetadas.
 */
const DOC = "../docs/metis2/09-arquitectura-cuatro-pestanas.md";
const PLAN = "../docs/metis2/plan-y-control.md";

function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe("MÊTIS 2.0 · arquitectura de cuatro pestañas · propuesta", () => {
  const doc = existsSync(DOC) ? readFileSync(DOC, "utf8") : "";

  it("el documento existe, dice qué no se hizo y no usa frases vetadas ni símbolos", () => {
    expect(existsSync(DOC)).toBe(true);
    expect(doc).toMatch(/## .*Lo que no se hizo/);
    expect(doc).not.toMatch(/de cero a ceo|\blibro\b/i);
    expect(doc).not.toMatch(/pr[oó]ximamente|en preparaci[oó]n|pr[oó]xima versi[oó]n|llegan? pronto|m[aá]s adelante:|todav[ií]a no est[aá] disponible|coming soon/i);
    expect(doc).not.toMatch(/[\p{Extended_Pictographic}\u2605\u2606\u2713\u2717]/u);
  });

  it("nombra las cuatro pestañas y los cinco bloques de Hoy", () => {
    for (const t of ["Hoy, Academy, Mi progreso y Mi perfil", "Tu criterio ejecutivo", "Tu siguiente experiencia", "Continuar aprendiendo", "Repasa y fortalece", "Executive Challenge"]) expect(doc, t).toContain(t);
    for (const t of ["Se reutiliza", "Se mueve", "Se oculta"]) expect(doc, t).toContain(t);
  });

  it("Hoy conserva el diseño de dos zonas del Hoy anterior, con los datos nuevos (regla 62)", () => {
    for (const t of ["mismo diseño del Hoy anterior", "Zona principal (izquierda, fondo oscuro)", "Barra lateral (derecha, fondo blanco)", "Correspondencia, elemento por elemento", "Ver todo en Mi progreso"]) expect(doc, t).toContain(t);
    expect(doc).toMatch(/`Today\.tsx` no se modifica/);
  });

  it("Hoy es un camino y no una lista de pendientes; los candados salen solo de prerrequisitos reales (reglas 63 a 68)", () => {
    for (const t of ["Tu camino ejecutivo", "Tu siguiente paso", "Continúa tu aprendizaje", "Las dos experiencias siguientes, atenuadas", "Ya no hay cifra grande"]) expect(doc, t).toContain(t);
    for (const t of ["Completado", "Actual", "Disponible para explorar", "Con prerrequisitos pendientes"]) expect(doc, t).toContain(`| ${t} |`);
    expect(doc).toContain("La teoría, los glosarios y los conceptos nunca se bloquean");
    expect(doc).toContain("Ningún candado depende del XP, de los días transcurridos ni del simulador anterior");
    expect(doc).toContain("El camino necesita una regla de orden que no existe");
    // La cifra de pendientes no vuelve como propuesta para el Hoy nuevo.
    expect(doc).not.toMatch(/Cifra grande «Pendientes por resolver»/);
    // El catálogo sí trae los prerrequisitos que el documento cita.
    const cat = readFileSync("src/lib/ceo/metis2/academias.ts", "utf8");
    expect(cat).toMatch(/S\("fin\.resultados",[^\n]*\["fin\.lenguaje"\]/);
  });

  it("todo archivo del programa que menciona Bandeja está en el inventario del documento", () => {
    const hits = sources("src").filter((f) => /bandeja/i.test(readFileSync(f, "utf8"))).map((f) => f.replace(/\\/g, "/").replace(/^src\//, ""));
    expect(hits.length).toBeGreaterThan(0);
    for (const f of hits) expect(doc, f).toContain(f);
  });

  it("no promete un nivel ni un dominio que hoy no se pueden calcular con evaluaciones validadas", () => {
    expect(doc).toMatch(/Sin evaluaciones validadas no hay nivel/);
    expect(doc).not.toMatch(/\b7[26] de 96\b|\b80 de 96\b/);
  });

  it("el plan registra las reglas, la propuesta y las decisiones que esperan", () => {
    const plan = readFileSync(PLAN, "utf8");
    expect(plan).toContain("09-arquitectura-cuatro-pestanas.md");
    expect(plan).toMatch(/### Instrucciones de Oziel sobre la arquitectura de cuatro pestañas/);
    for (let n = 48; n <= 68; n++) expect(plan, `regla ${n}`).toMatch(new RegExp(`^${n}\\. \\*\\*`, "m"));
    expect(plan).not.toMatch(/^- \[ \] 3\.4 Retos e Historial en lugar de Bandeja/m);
  });
});
