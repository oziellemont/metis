import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

describe("menú de MÊTIS CEO", () => {
  it("la pestaña Personas está oculta, pero su página sigue existiendo", () => {
    const shell = readFileSync("src/components/ceo/CeoShell.tsx", "utf8");
    expect(shell).not.toMatch(/href: "\/ceo\/personas"/);
    expect(existsSync("src/app/ceo/personas/page.tsx")).toBe(true);
  });
});
