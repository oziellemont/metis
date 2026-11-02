import { describe, expect, it } from "vitest";
import { GREETING_LINE, personalizeText, speakerGroups } from "./cast";
import { COMPANIES } from "./companies";

const cumbre = COMPANIES.find((p) => p.id === "cumbre")!;

describe("textos del elenco", () => {
  it("todo saludo genérico del contenido se reconoce (se personaliza en pantalla y en correo)", () => {
    const lines = COMPANIES.flatMap((p) => p.items.flatMap((i) => i.body.slice(0, 2)));
    const left = lines.filter((l) => /^(Hola, |Estimad[oa] |Querid[oa] )?(Director|amig)/.test(l) && l.trim().endsWith(":") && l.length < 40 && !GREETING_LINE.test(l.trim()));
    expect(left).toEqual([]);
  });
  it("una cita de Héctor dentro de un mensaje de Lucía se atribuye a Héctor", () => {
    const g = speakerGroups(cumbre, "lucia", ["Héctor: «Sofía me llamó.»", "Lucía: «Yo no daría más.»"]);
    expect(g.map((x) => x.who)).toEqual(["hector", "lucia"]);
    expect(g[0].lines[0]).toBe("Sofía me llamó.");
  });
  it("líneas sin prefijo se quedan con quien abre el nodo", () => {
    expect(speakerGroups(cumbre, "lucia", ["Hola.", "Otra."])).toEqual([{ who: "lucia", lines: ["Hola.", "Otra."] }]);
  });
  it("saludo con el nombre de pila y neutro si no hay nombre", () => {
    expect(personalizeText("Querido amigo:", "Mariana López")).toBe("Mariana:");
    expect(personalizeText("Estimado Director:", "Mariana López")).toBe("Mariana:");
    expect(personalizeText("Hola, Director:", "Mariana")).toBe("Hola, Mariana:");
    expect(personalizeText("Director:", "")).toBe("Hola:");
    expect(personalizeText("Director (confidencial):", "Mariana López")).toBe("Mariana (confidencial):");
    expect(personalizeText("Tú dinos, Director: ¿qué haría?", "Mariana")).toBe("Tú dinos, Director: ¿qué haría?");
  });
});
