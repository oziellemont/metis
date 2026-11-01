import { describe, expect, it } from "vitest";
import { ARCHETYPES, ROLES, archetypeById } from "./archetypes";
import { CONTEXTS } from "./contexts";
import { BANK_PREFIX, PACK_CONTEXT, PACK_ROLES, bankItems, bankMonth, buildCase, callName, isBankId, pickBank, weaknessOf, withBank } from "./bank";
import { COMPANIES, companyById, findItem } from "../companies";
import { LESSONS } from "../lessons";
import { focusIndustries } from "../career/taxonomy";
const industryById = (id: string) => focusIndustries().find((i) => i.id === id);
import { dominates } from "../engine";
import type { Item } from "../types";

const FUTURE = /pr[oó]ximamente|en preparaci[oó]n|pr[oó]xima versi[oó]n|llegan? pronto|m[aá]s adelante:|todav[ií]a no est[aá] disponible|coming soon/i;
const BOOK = /de cero a ceo|\blibro\b/i;
const EMOJI = /[\p{Extended_Pictographic}\u2605\u2606\u2713\u2717]/u;
const texts = (it: Item): string[] => [it.subject, it.preview, ...it.body, it.ask, ...(it.data?.rows.flat() ?? []), it.data?.title ?? "", ...it.options.flatMap((o) => [o.text, o.outcome, ...o.reply]), ...it.expired.reply, it.expired.outcome, it.bitacora.title, it.bitacora.text, it.bitacora.nota, it.real?.company ?? "", it.real?.title ?? "", it.real?.text ?? ""];

describe("banco de casos · arquetipos (lo que se aprende)", () => {
  it("dieciocho decisiones distintas, cada una con tres giros, precedente real con fuentes y lección existente", () => {
    expect(ARCHETYPES.length).toBeGreaterThanOrEqual(18);
    expect(new Set(ARCHETYPES.map((a) => a.id)).size).toBe(ARCHETYPES.length);
    for (const a of ARCHETYPES) {
      expect(a.twists.length, a.id).toBe(3);
      expect(new Set(a.twists).size, a.id).toBe(3);
      expect(a.real.sources.length, a.id).toBeGreaterThan(0);
      for (const u of a.real.sources) expect(u, a.id).toMatch(/^https:\/\//);
      expect(LESSONS.some((l) => l.id === a.lesson), `${a.id}: ${a.lesson}`).toBe(true);
      expect(a.question.endsWith("?"), a.id).toBe(true);
      expect(archetypeById(a.id)).toBe(a);
    }
  });
  it("ninguna opción domina a otra y todas tienen costo y beneficio (la decisión es real en cualquier industria)", () => {
    const bad: string[] = [];
    for (const a of ARCHETYPES) {
      a.options.forEach((x, i) => a.options.forEach((y, j) => { if (i !== j && dominates(x.effects, y.effects)) bad.push(`${a.id}: ${i} domina a ${j}`); }));
      a.options.forEach((o, i) => { const v = Object.values(o.effects); if (!(v.some((n) => (n ?? 0) > 0) && v.some((n) => (n ?? 0) < 0))) bad.push(`${a.id}/${i} sin costo o sin beneficio`); });
    }
    expect(bad).toEqual([]);
  });
  it("hay una opción de 3 puntos y nunca dos iguales: siempre hay algo que aprender, sin respuesta obvia por efectos", () => {
    for (const a of ARCHETYPES) {
      expect(a.options.some((o) => o.score === 3), a.id).toBe(true);
      expect(a.options.filter((o) => o.score === 3).length, a.id).toBe(1);
      // la mejor por principios NO es la que más suma en KPI (no se puede adivinar sumando)
      const sum = (o: (typeof a.options)[number]) => Object.values(o.effects).reduce<number>((s, v) => s + (v ?? 0), 0);
      const top = a.options.reduce((m, o) => (sum(o) > sum(m) ? o : m));
      expect(top.score === 3 && a.options.filter((o) => sum(o) === sum(top)).length === 1 && a.options.every((o) => o === top || sum(o) < sum(top) - 4), a.id).toBe(false);
    }
  });
  it("cada opción mueve solo a roles del caso, sin pasar de ±2, y ninguna mueve igual que otra", () => {
    for (const a of ARCHETYPES) {
      const inCase = new Set([a.from, ...a.involves]);
      const sig = a.options.map((o) => JSON.stringify(Object.entries(o.stance).sort()));
      expect(new Set(sig).size, a.id).toBe(3);
      for (const o of a.options) for (const [r, v] of Object.entries(o.stance)) {
        expect(ROLES).toContain(r);
        expect(inCase.has(r as never), `${a.id}: ${r}`).toBe(true);
        expect(Math.abs(v as number)).toBeLessThanOrEqual(2);
      }
    }
  });
  it("las competencias quedan cubiertas: personas, estrategia, finanzas, clientes, operación, ética, comunicación y negociación", () => {
    const areas = new Set(ARCHETYPES.flatMap((a) => a.areas));
    for (const x of ["personas", "estrategia", "finanzas", "clientes", "operacion", "etica", "comunicacion", "negociacion"]) expect(areas.has(x as never), x).toBe(true);
  });
});

describe("banco de casos · industrias", () => {
  it("todas las industrias foco tienen contexto para todos los arquetipos", () => {
    const focus = focusIndustries().map((i) => i.id).sort();
    expect(Object.keys(CONTEXTS).sort()).toEqual(focus);
    for (const ctx of Object.values(CONTEXTS)) for (const a of ARCHETYPES) {
      const f = ctx.cases[a.id];
      expect(f, `${ctx.industryId}/${a.id}`).toBeTruthy();
      expect(f.body.length, `${ctx.industryId}/${a.id}`).toBeGreaterThanOrEqual(2);
      expect(f.rows.length, `${ctx.industryId}/${a.id}`).toBeGreaterThanOrEqual(3);
    }
  });
  it("los paquetes jugables usan el contexto de su industria y tienen a alguien en cada rol", () => {
    for (const c of COMPANIES) {
      expect(PACK_CONTEXT[c.id], c.id).toBeTruthy();
      expect(industryById(PACK_CONTEXT[c.id])?.contentPackId, c.id).toBe(c.id);
      for (const r of ROLES) expect(c.cast[PACK_ROLES[c.id][r]], `${c.id}/${r}`).toBeTruthy();
      expect(c.cast[PACK_ROLES[c.id].assistant].id).toBe(c.roles.assistant);
      expect(c.cast[PACK_ROLES[c.id].chair].id).toBe(c.roles.chair);
    }
  });
  it("el mismo arquetipo en dos industrias: mismas opciones y efectos, distintos hechos", () => {
    const a = ARCHETYPES[0];
    const roles = PACK_ROLES.cumbre;
    const names = Object.fromEntries(Object.values(companyById("cumbre").cast).map((p) => [p.id, p.name]));
    const food = buildCase(a, CONTEXTS.alimentos_bebidas, 0, "cumbre", roles, names, "Cumbre");
    const saas = buildCase(a, CONTEXTS.software_saas, 0, "cumbre", roles, names, "Cumbre");
    expect(food.options.map((o) => o.effects)).toEqual(saas.options.map((o) => o.effects));
    expect(food.lesson).toBe(saas.lesson);
    expect(food.body.join(" ")).not.toEqual(saas.body.join(" "));
    expect(food.data?.rows).not.toEqual(saas.data?.rows);
  });
});

describe.each(COMPANIES.map((c) => [c.id, c] as const))("banco de casos · %s", (_id, pack) => {
  const items = bankItems(pack);
  it("un caso por decisión y giro (18 × 3 = 54) con ids únicos que no chocan con el paquete", () => {
    expect(items.length).toBe(ARCHETYPES.length * 3);
    const ids = new Set(items.map((i) => i.id));
    expect(ids.size).toBe(items.length);
    for (const it of pack.items) expect(ids.has(it.id)).toBe(false);
    for (const it of items) { expect(isBankId(it.id)).toBe(true); expect(it.id.startsWith(`${BANK_PREFIX}${pack.id}-`)).toBe(true); }
  });
  it("cumple las mismas reglas que los casos escritos a mano", () => {
    const bad: string[] = [];
    for (const it of items) {
      if (!pack.cast[it.from]) bad.push(`${it.id}: from ${it.from}`);
      for (const w of it.involves ?? []) if (!pack.cast[w]) bad.push(`${it.id}: involves ${w}`);
      if (it.involves?.includes(it.from)) bad.push(`${it.id}: se involucra a sí mismo`);
      if (it.options.length < 2 || it.options.length > 4) bad.push(`${it.id}: opciones`);
      if (new Set(it.options.map((o) => o.id)).size !== it.options.length) bad.push(`${it.id}: ids de opción`);
      if (!LESSONS.some((l) => l.id === it.lesson)) bad.push(`${it.id}: lección`);
      if (it.trigger) bad.push(`${it.id}: un caso del banco no es consecuencia`);
      const inCase = new Set([it.from, ...(it.involves ?? [])]);
      for (const o of it.options) for (const [id, v] of Object.entries(o.stance ?? {})) {
        if (!inCase.has(id)) bad.push(`${it.id}/${o.id}: ${id} no está en el caso`);
        if (Math.abs(v) > 2) bad.push(`${it.id}/${o.id}: ${id}=${v}`);
      }
      const sig = it.options.map((o) => JSON.stringify(Object.entries(o.stance ?? {}).sort()));
      if (new Set(sig).size !== sig.length) bad.push(`${it.id}: dos opciones mueven igual`);
    }
    expect(bad).toEqual([]);
  });
  it("todo el texto quedó resuelto: sin llaves, sin promesas a futuro, sin emojis y con el elenco de la empresa", () => {
    for (const it of items) for (const t of texts(it)) {
      expect(t, it.id).not.toMatch(/\{[a-z_]+\}/);
      expect(FUTURE.test(t), `${it.id}: ${t}`).toBe(false);
      expect(BOOK.test(t), `${it.id}: ${t}`).toBe(false);
      expect(EMOJI.test(t), `${it.id}: ${t}`).toBe(false);
    }
    const ops = callName(pack.cast[PACK_ROLES[pack.id].ops].name);
    expect(items.some((i) => i.body.join(" ").includes(ops) || i.subject.includes(ops))).toBe(true);
  });
  it("la llamada perdida empieza con la duración del mensaje de voz; la mejor opción no está siempre en el mismo lugar", () => {
    for (const it of items.filter((i) => i.channel === "llamada")) expect(it.body[0], it.id).toMatch(/^Mensaje de voz · 0:\d\d$/);
    const pos = new Set(items.map((i) => i.options.findIndex((o) => o.score === 3)));
    expect(pos.size).toBeGreaterThan(1);
  });
  it("withBank: misma referencia, paquete original intacto y findItem encuentra los casos del banco", () => {
    expect(withBank(pack)).toBe(withBank(pack));
    expect(withBank(pack).items.length).toBe(pack.items.length + items.length);
    expect(pack.items.some((i) => isBankId(i.id))).toBe(false);
    expect(findItem(items[0].id)?.company.id).toBe(pack.id);
  });
});

describe("banco de casos · selección que se retroalimenta", () => {
  const empty = { seen: [], last: [], quality: {} };
  it("determinista: misma historia y semilla, mismos casos", () => {
    expect(pickBank("cumbre", 1, empty, "x", 3)).toEqual(pickBank("cumbre", 1, empty, "x", 3));
  });
  it("prioriza el área más floja: si tus decisiones de ética son malas, llegan casos de ética", () => {
    const quality = { etica: { sum: 0, n: 6 }, finanzas: { sum: 6, n: 6 }, personas: { sum: 6, n: 6 }, operacion: { sum: 6, n: 6 }, clientes: { sum: 6, n: 6 }, estrategia: { sum: 6, n: 6 }, negociacion: { sum: 6, n: 6 }, comunicacion: { sum: 6, n: 6 }, cultura: { sum: 6, n: 6 } };
    const picks = pickBank("cumbre", 2, { seen: [], last: [], quality }, "x", 2);
    for (const p of picks) expect(archetypeById(p.archetype)!.areas, p.archetype).toContain("etica");
    expect(weaknessOf(quality, ["etica"])).toBe(1);
    expect(weaknessOf(quality, ["finanzas"])).toBe(0);
  });
  it("no repite: primero lo nunca visto; luego otro giro del mismo dilema; con todo visto, vuelve a empezar", () => {
    const seen: string[] = [];
    const months: string[][] = [];
    const N = ARCHETYPES.length;
    const total = N * 3;
    for (let m = 0; m < Math.ceil(total / 3) + 4; m++) {
      const picks = pickBank("forja", 2, { seen, last: months[m - 1] ?? [], quality: {} }, `s|${m}`, 3);
      expect(new Set(picks.map((p) => p.archetype)).size).toBe(picks.length);
      for (const p of picks) { if (seen.length < total) expect(seen, p.id).not.toContain(p.id); seen.push(p.id); }
      months.push(picks.map((p) => p.id));
    }
    // todos los arquetipos aparecen antes de repetir alguno
    const first = seen.slice(0, N).map((id) => id.split("-")[2]);
    expect(new Set(first).size).toBe(N);
    // todos los casos distintos antes de repetir uno
    expect(new Set(seen.slice(0, total)).size).toBe(total);
  });
  it("tomar el mando no trae casos del banco; las apuestas de innovación llegan desde «Construir capacidad»", () => {
    const run = { passed: true, decisions: {} };
    expect(bankMonth("cumbre", [], () => 0, withBank(companyById("cumbre")).items, "z").picks).toEqual([]);
    const m1 = bankMonth("cumbre", [run], () => 1, withBank(companyById("cumbre")).items, "z").picks;
    expect(m1.length).toBe(3);
    expect(m1.some((p) => p.archetype === "apuesta")).toBe(false);
  });
  it("lo que ya decidiste dos veces cede su lugar a un caso nuevo desde «Construir capacidad»", () => {
    const pk = withBank(companyById("cumbre"));
    const base = pk.items.filter((i) => !isBankId(i.id) && !i.trigger && i.day > 1);
    const ds = Object.fromEntries(base.slice(0, 3).map((i) => [i.id, { option: i.options[0].id }]));
    const runs = [{ passed: true, decisions: ds }, { passed: true, decisions: ds }];
    const m = bankMonth("cumbre", runs, (k) => (k >= 2 ? 2 : 1), pk.items, "z");
    expect(m.stale.sort()).toEqual(base.slice(0, 3).map((i) => i.id).sort());
    expect(m.picks.length).toBe(4 + 3);
    const early = bankMonth("cumbre", runs, () => 1, pk.items, "z");
    expect(early.stale).toEqual([]);
  });
  it("lo que decidiste en los casos del banco también alimenta la siguiente selección", () => {
    const pk = withBank(companyById("cumbre"));
    const m1 = bankMonth("cumbre", [{ passed: true, decisions: {} }], () => 1, pk.items, "q").picks;
    // decides mal (puntaje 0 o 1) los casos del mes 2
    const worst = Object.fromEntries(m1.map((p) => { const it = pk.items.find((i) => i.id === p.id)!; const o = it.options.reduce((a, b) => (b.score < a.score ? b : a)); return [p.id, { option: o.id }]; }));
    const after = bankMonth("cumbre", [{ passed: true, decisions: {} }, { passed: true, decisions: worst }], () => 1, pk.items, "q").picks;
    for (const p of after) expect(m1.map((x) => x.id)).not.toContain(p.id);
    const weakAreas = new Set(m1.flatMap((p) => archetypeById(p.archetype)!.areas));
    expect(after.some((p) => archetypeById(p.archetype)!.areas.some((a) => weakAreas.has(a)))).toBe(true);
  });
});

describe("banco de casos · P1-D (ocho decisiones más)", () => {
  const NEW = ["guerra", "verde", "trimestre", "incidente", "salarios", "meta", "foco", "adaptativo"];
  it("las ocho existen, con su precedente y una lección distinta a la de su vecino", () => {
    for (const id of NEW) expect(archetypeById(id), id).toBeTruthy();
    const lessons = new Set(NEW.map((id) => archetypeById(id)!.lesson));
    expect(lessons.size).toBeGreaterThanOrEqual(6);
    // alineación y gobierno (consejo) quedan cubiertos por el banco
    const areas = new Set(ARCHETYPES.flatMap((a) => a.areas));
    expect(areas.has("alineacion")).toBe(true);
    expect(ARCHETYPES.some((a) => a.lesson === "consejo")).toBe(true);
  });
  it("cada una se vive distinto en cada industria: hechos propios, sin copiar de otra", () => {
    for (const id of NEW) {
      const bodies = Object.values(CONTEXTS).map((c) => (c.cases as unknown as Record<string, { body: string[] }>)[id].body.join(" "));
      expect(new Set(bodies).size, id).toBe(bodies.length);
    }
  });
  it("los giros también se resuelven con el elenco (sin llaves sueltas)", () => {
    const pack = companyById("brasa");
    for (const it of bankItems(pack).filter((i) => NEW.some((n) => i.id.includes(`-${n}-`)))) expect(it.body.join(" "), it.id).not.toMatch(/\{[a-z_]+\}/);
  });
  it("las de más peso llegan con la empresa más madura: presión del consejo y retos adaptativos desde «Construir capacidad»", () => {
    expect(archetypeById("trimestre")!.minStage).toBe(2);
    expect(archetypeById("adaptativo")!.minStage).toBe(2);
    const m1 = pickBank("cumbre", 1, { seen: [], last: [], quality: {} }, "w", 20).map((p) => p.archetype);
    expect(m1).not.toContain("trimestre");
    expect(m1).not.toContain("adaptativo");
  });
});
