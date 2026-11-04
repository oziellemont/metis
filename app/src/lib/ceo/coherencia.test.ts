/**
 * Coherencia editorial de los casos (ciclo 3).
 *
 * Tiempo del juego: cada periodo dura 7 días reales y representa un mes de la
 * empresa, así que un día real ≈ 4 días de la empresa. Una consecuencia que
 * llega N días después de su decisión no puede contar, en pasado, que pasaron
 * más semanas de las que caben en ese hueco.
 *
 * Probabilidades: toda cifra del tipo «X de cada Y» o «probabilidad» que
 * aparezca en los datos de un caso debe ir con una nota que la identifique
 * como estimación del caso, no como dato empírico.
 */
import { describe, expect, it } from "vitest";
import { COMPANIES } from "./companies";

const N: Record<string, number> = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, diez: 10, doce: 12, quince: 15 };
const RX = /(\d+|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|diez|doce|quince)\s+(semanas?|meses|mes|d[ií]as?|trimestres?)/gi;
const DIAS_EMPRESA_POR_DIA_REAL = 4;
const HOLGURA = 1.25;

/** Duraciones hacia adelante (plazos, ofertas, contratos): no describen tiempo ya transcurrido. */
const PROSPECTIVAS = [
  /llega en 3 semanas/, /10 días de paro/, /4 meses de entrega/, /renuncia con efecto en 30 días/,
  /3 meses más/, /12 meses/, /se cierra en 5 semanas/i, /estima 2 semanas/, /dos meses de caja/,
  /Evaluación de proveedores en 3 semanas/, /ofrece \w+ \d+ meses/i,
  // Métricas expresadas en días (días de inventario), no tiempo transcurrido.
  /de \d+ a \d+ días/, /\d+ días \(antes \d+\)/,
];

function textos(it: { subject: string; preview?: string; body: string[]; data?: { rows: string[][] } }): string[] {
  return [it.subject, it.preview ?? "", ...it.body, ...(it.data?.rows.map((r) => r.join(": ")) ?? [])];
}

describe("coherencia temporal de las consecuencias", () => {
  it("ninguna consecuencia cuenta en pasado más tiempo del que cabe entre la decisión y su llegada", () => {
    const fallas: string[] = [];
    for (const pk of COMPANIES) {
      const byId = Object.fromEntries(pk.items.map((i) => [i.id, i]));
      for (const it of pk.items) {
        if (!it.trigger) continue;
        const gap = it.day - byId[it.trigger.item].day;
        const limite = Math.max(1, gap) * DIAS_EMPRESA_POR_DIA_REAL * HOLGURA;
        for (const t of textos(it as never)) for (const m of t.matchAll(RX)) {
          const n = N[m[1].toLowerCase()] ?? +m[1];
          const u = m[2].toLowerCase();
          const d = n * (u.startsWith("sem") ? 7 : u.startsWith("mes") ? 30 : u.startsWith("tri") ? 90 : 1);
          if (d <= limite) continue;
          const ctx = t.slice(Math.max(0, m.index! - 40), m.index! + m[0].length + 20);
          if (PROSPECTIVAS.some((r) => r.test(ctx))) continue;
          fallas.push(`${pk.id}/${it.id} (hueco ${gap} días): «${ctx}»`);
        }
      }
    }
    expect(fallas).toEqual([]);
  });

  it("el root de mantenimiento y sus consecuencias usan el mismo rendimiento de partida (82 %)", () => {
    const cumbre = COMPANIES.find((c) => c.id === "cumbre")!;
    const mant = cumbre.items.filter((i) => i.id === "d2-mantenimiento" || i.id.startsWith("c-mant-"));
    const antes = mant.flatMap((i) => textos(i as never)).flatMap((t) => [...t.matchAll(/antes (\d+) %/g)].map((m) => m[1]))
      .filter((v) => +v >= 70);
    expect(new Set(antes)).toEqual(new Set(["82"]));
  });

  it("Punto Madero: la bodega se cobra con el mismo costo mensual del root", () => {
    const pm = COMPANIES.find((c) => c.id === "puntomadero")!;
    const bodega = pm.items.find((i) => i.id === "pm-c-temp-bodega")!;
    expect(textos(bodega as never).join(" ")).toContain("$600 mil al mes");
    expect(textos(bodega as never).join(" ")).not.toMatch(/cuatro meses/);
  });
});

describe("probabilidades: estimación del caso, no dato empírico", () => {
  it("toda fila con «de cada» o «probabilidad» lleva nota que la marca como estimación ficticia", () => {
    const fallas: string[] = [];
    for (const pk of COMPANIES) for (const it of pk.items) {
      const rows = it.data?.rows ?? [];
      if (!rows.some((r) => /\bde cada \d+\b|\d+ (o \d+ )?de cada \d+|probabilidad/i.test(r.join(" ")))) continue;
      if (!/no estadísticas reales/.test(it.data?.note ?? "")) fallas.push(`${pk.id}/${it.id}`);
    }
    expect(fallas).toEqual([]);
  });
});
