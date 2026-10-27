import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PRIVACY, TERMS } from "./legal-content";
import { CEO_CONTACT_EMAIL } from "../../../lib/site";

const text = (d: typeof PRIVACY) => [d.title, d.intro, ...d.sections.flatMap((s) => [s.title, ...s.body, ...(s.items ?? [])])].join("\n");
const SRC = join(__dirname, "../../..");

describe("páginas legales de MÊTIS CEO", () => {
  it("usan el correo de metis.ceo", () => {
    expect(CEO_CONTACT_EMAIL).toMatch(/@metis\.ceo$/);
    expect(text(PRIVACY)).toContain(CEO_CONTACT_EMAIL);
    expect(text(PRIVACY) + text(TERMS)).not.toMatch(/metisalign/);
  });

  it("el aviso nombra a cada proveedor que recibe datos", () => {
    for (const p of ["Supabase", "Vercel", "Resend", "Twilio", "OpenAI"]) expect(text(PRIVACY)).toContain(p);
    expect(text(PRIVACY)).toMatch(/ARCO/);
  });

  it("no publica precio ni promete funciones", () => {
    const all = text(PRIVACY) + text(TERMS);
    expect(all).not.toMatch(/\$\s?\d|MXN|próximamente|prueba gratis|cancela cuando quieras/i);
    expect(all).not.toMatch(/de cero a ceo|\blibro\b/i);
  });

  it("tienen ruta y la landing las enlaza", () => {
    expect(existsSync(join(SRC, "app/legal/privacidad/page.tsx"))).toBe(true);
    expect(existsSync(join(SRC, "app/legal/terminos/page.tsx"))).toBe(true);
    const footer = readFileSync(join(__dirname, "Sections.tsx"), "utf8");
    expect(footer).toContain("/legal/privacidad");
    expect(footer).toContain("/legal/terminos");
    const mw = readFileSync(join(SRC, "middleware.ts"), "utf8");
    expect(mw).toMatch(/"\/privacidad": "\/legal\/privacidad"/);
  });

  it("la landing comparte su propia imagen", () => {
    expect(existsSync(join(SRC, "../public/brand/ceo-og.jpg"))).toBe(true);
    expect(readFileSync(join(SRC, "app/simulador/page.tsx"), "utf8")).toContain("ceo-og.jpg");
  });
});
