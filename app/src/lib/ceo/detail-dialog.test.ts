import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (f: string) => readFileSync(`src/components/ceo/${f}`, "utf8");
const dialog = read("DetailDialog.tsx");
/** Clases de la variante pedida, tal como están escritas en el componente. */
const branch = (re: RegExp) => dialog.match(re)?.[1] ?? "";

describe("Ventana de detalle · Empresa la abre centrada, Hoy la conserva a la derecha", () => {
  it("Empresa · Resumen abre la salud y los indicadores en ventana centrada", () => {
    expect(read("empresa/ResumenTab.tsx")).toContain('<KpiBoard hero detail="centro" />');
  });

  it("Empresa · Personas abre a cada persona en ventana centrada", () => {
    const personas = read("empresa/PersonasTab.tsx");
    expect(personas).toMatch(/<DetailDialog variant="centro" labelledBy="perfil-nombre" testid="perfil-persona"/);
    expect(personas).not.toMatch(/sm:justify-end|bg-ink\/40|fixed inset-0/);
  });

  it("Hoy no cambia: su tablero sigue abriendo el panel de la derecha", () => {
    expect(read("Today.tsx")).toContain("<KpiBoard hero />");
    expect(read("KpiBoard.tsx")).toContain('detail = "lado"');
    expect(read("KpiBoard.tsx")).not.toMatch(/sm:justify-end|bg-ink\/40|fixed inset-0/);
  });

  it("centrada: en medio de la pantalla, con el fondo desenfocado y sin velo gris", () => {
    const wrap = branch(/center \? "(items-center justify-center[^"]*)"/);
    expect(wrap).toContain("items-center justify-center");
    const veil = branch(/center \? "(backdrop-blur[^"]*)" : "bg-ink\/40"/);
    expect(veil).toMatch(/backdrop-blur/);
    expect(veil).not.toMatch(/\bbg-/);
    const card = branch(/\? "(max-w-\[460px\][^"]*)"/);
    expect(card).toContain("rounded-3xl");
    expect(card).toMatch(/max-h-\[min\(86vh,720px\)\]/);
  });

  it("a la derecha: mismo panel de antes", () => {
    const card = branch(/: "(sm:w-\[420px\][^"]*)"/);
    expect(card).toContain("sm:rounded-none");
    expect(dialog).toContain('"items-end sm:items-stretch sm:justify-end"');
  });

  it("cubre toda la pantalla (se dibuja sobre la página) y se cierra con Escape, con la X o tocando fuera", () => {
    expect(dialog).toContain("createPortal(");
    expect(dialog).toContain("document.body");
    expect(dialog).toContain("fixed inset-0 z-50");
    expect(dialog).toContain('"Escape"');
    expect(dialog.match(/aria-label="Cerrar"/g)).toHaveLength(2);
    expect(dialog).toContain("prev?.focus?.()");
    expect(dialog).toContain("if (!card.current?.contains(document.activeElement)) card.current?.focus();");
  });

  it("la animación respeta a quien pide menos movimiento", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ \.detail-in, \.detail-fade \{ animation: none; \} \}/);
  });
});
