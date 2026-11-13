import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { skillsAt } from "../academias";
import { RETOS } from "../experiencias";
import {
  EC_N1_002_A as R, RETOS_DEMO, advanceReto, allSteps, checkReto, flagsOf, informeOf, maxBySkill, newIntento, nextStep,
  ordenOpciones, pathOf, readIntento, retoBySlug, scoreStep, stepById, textOf,
  type Intento, type PasoReto, type RespuestaReto,
} from ".";

const NOW = "2026-11-14T10:00:00.000Z";

/** Respuesta con el máximo de puntos (o la peor, o una al azar) para un paso. */
function answerFor(p: PasoReto, mode: "experto" | "novato" | "azar", rnd: () => number): RespuestaReto | undefined {
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  switch (p.kind) {
    case "decision": {
      const sorted = [...p.options].sort((a, b) => b.score - a.score);
      return mode === "experto" ? sorted[0].id : mode === "novato" ? sorted[sorted.length - 1].id : pick(p.options).id;
    }
    case "cifras": return Object.fromEntries(p.fields.map((f) => [f.id, String(mode === "experto" ? f.answer : mode === "novato" ? f.answer + 1 : Math.floor(rnd() * 200000))]));
    case "clasificar": return Object.fromEntries(p.items.map((i) => [i.id, mode === "experto" ? i.group : mode === "novato" ? p.groups.find((g) => g.id !== i.group)!.id : pick(p.groups).id]));
    case "armar": return Object.fromEntries(p.slots.map((s) => [s.id, mode === "experto" ? s.answer : mode === "novato" ? s.choices.find((c) => c.id !== s.answer)!.id : pick(s.choices).id]));
    case "ordenar": return mode === "experto" ? p.order : mode === "novato" ? [...p.order].reverse() : [...p.order].sort(() => rnd() - 0.5);
    case "escribir": return Object.fromEntries(p.fields.map((f) => [f.id, mode === "novato" ? "" : "Mi respuesta, con mis palabras."]));
    case "dato": return undefined;
  }
}

function play(mode: "experto" | "novato" | "azar", seed = 7): Intento {
  let s = seed;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  let i = advanceReto(R, newIntento(R), { t: "empezar", now: NOW });
  for (let guard = 0; guard < 200; guard++) {
    const p = stepById(R, i.at!)!.step;
    const v = answerFor(p, mode, rnd);
    if (v !== undefined) i = advanceReto(R, i, { t: "responder", step: p.id, value: v });
    if (!nextStep(R, i)) return advanceReto(R, i, { t: "terminar", now: NOW });
    i = advanceReto(R, i, { t: "avanzar" });
  }
  throw new Error("el recorrido no termina");
}

describe("Executive Challenge EC-N1-002-A", () => {
  it("pasa la revisión del motor sin errores", () => {
    const { errors, warnings } = checkReto(R);
    expect(errors).toEqual([]);
    expect(warnings.some((w) => /sin regla de aprobación/.test(w))).toBe(true);
    expect(warnings.some((w) => /4 de 96 puntos son respuestas escritas/.test(w))).toBe(true);
  });

  it("es una sola historia: tres actos, trece escenas evaluables y una síntesis sin habilidades", () => {
    expect(R.acts).toHaveLength(3);
    expect(R.scenes.map((s) => s.id)).toEqual(Array.from({ length: 14 }, (_, k) => `S${String(k + 1).padStart(2, "0")}`));
    expect(R.scenes.filter((s) => s.skills.length)).toHaveLength(13);
    expect(R.scenes.at(-1)!.skills).toEqual([]);
    expect(R.scenes.map((s) => s.act)).toEqual([0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2]);
    // No son 24 preguntas: cada escena tiene situación, personas y documentos, y varios pasos.
    for (const s of R.scenes) { expect(s.people.length).toBeGreaterThan(0); expect(s.docs.length).toBeGreaterThan(0); }
    expect(allSteps(R).length).toBeGreaterThan(40);
  });

  it("cubre las 24 habilidades de nivel 1 con 4 puntos cada una: 96 en total", () => {
    const max = maxBySkill(R);
    expect(Object.keys(max).sort()).toEqual(skillsAt(1).map((s) => s.id).sort());
    expect(Object.values(max).every((v) => v === 4)).toBe(true);
    expect(Object.values(max).reduce((a, b) => a + b, 0)).toBe(96);
    expect(Object.keys(R.criteria).sort()).toEqual(skillsAt(1).map((s) => s.id).sort());
  });

  it("las 19 identidades numéricas del paquete cuadran", () => {
    const id: [number, number][] = [
      [180000 - 108000 - 54000, 18000], [195000 - 110000 - 60000, 25000], [18000 - 25000, -7000],
      [22000 + 138000 - 100000 - 54000, 6000], [180000 - 138000, 42000], [108000 - 100000, 8000],
      [6000 + 42000 + 36000 + 60000, 144000], [8000 + 76000 + 60000, 144000], [22000 + 36000 + 60000, 118000],
      [76000 + 42000, 118000], [180000 / 300, 600], [108000 / 180, 600], [Math.min(120, 95, 80, 70, 85), 70],
      [90 - 70, 20], [(28 / 40) * 100, 70], [4 + 3 + 93, 100], [(6 / 24) * 100 + (5 / 10) * 100, 75],
      [300 - 180 + (270 - 180), 210], [(120 - 90) * 100, 3000],
    ];
    expect(id).toHaveLength(19);
    for (const [a, b] of id) expect(a).toBe(b);
    // Y coinciden con los documentos del reto.
    const n = (doc: string, row: string, col: number) => Number(R.docs.find((d) => d.id === doc)!.rows.find((r) => r.id === row)!.cells![col].replace(/,/g, ""));
    expect(n("d01", "d01.ventas", 1) - n("d01", "d01.costos", 1) - n("d01", "d01.gastos", 1)).toBe(18000);
    expect(n("d01", "d01.ventas", 0) - n("d01", "d01.costos", 0) - n("d01", "d01.gastos", 0)).toBe(25000);
    const d02 = Object.fromEntries(R.docs.find((d) => d.id === "d02")!.rows.map((r) => [r.id, r.amount!]));
    expect(d02["d02.inicio"] + d02["d02.cobros"] + d02["d02.proveedores"] + d02["d02.gastos"]).toBe(n("d03", "d03.efectivo", 1));
    const activo = ["d03.efectivo", "d03.cxc", "d03.inventario", "d03.equipo"];
    for (const c of [0, 1]) expect(activo.reduce((s, r) => s + n("d03", r, c), 0)).toBe(n("d03", "d03.cxp", c) + n("d03", "d03.prestamo", c) + n("d03", "d03.patrimonio", c));
    const etapas = R.docs.find((d) => d.id === "d04")!.rows.filter((r) => r.id !== "d04.demanda").map((r) => Number(r.cells![0]));
    expect(Math.min(...etapas)).toBe(70);
  });

  it("cada cifra que se pide trae su cálculo y el cálculo da la respuesta", () => {
    for (const { step } of allSteps(R)) if (step.kind === "cifras") for (const f of step.fields) {
      expect(f.calc.replace(/,/g, "")).toMatch(new RegExp(`(=|−) ?${f.answer}( |$|%)|= ?−?${f.answer}`));
    }
  });

  it("el experto saca 92 puntos que se comprueban solos y 4 quedan en espera; nunca hay veredicto", () => {
    const i = play("experto");
    expect(i.phase).toBe("fin");
    const inf = informeOf(R, i);
    expect(inf.max).toBe(96);
    expect(inf.got).toBe(92);
    expect(inf.pending).toBe(4);
    expect(inf.auto).toBe(92);
    expect(inf.verdict).toBeNull();
    expect(inf.observations).toHaveLength(24);
    expect(inf.byAcademy).toHaveLength(6);
    expect(inf.safeguards.map((s) => s.kind)).toEqual(["inocuidad", "etica", "control_bancario"]);
    expect(inf.safeguards.every((s) => s.state === "cumplida")).toBe(true);
    expect(inf.blocked).toBe(false);
    expect(inf.synthesis).toEqual({ sequence: "seguridad", sequenceOk: true, reason: "hechos", reasonOk: true, accepted: true });
  });

  it("el novato termina con 0 puntos y las tres decisiones críticas sin corregir; el azar también termina", () => {
    const n = play("novato");
    expect(n.phase).toBe("fin");
    const inf = informeOf(R, n);
    expect(inf.got).toBe(0);
    expect(inf.pending).toBe(0);
    expect(inf.safeguards.every((s) => s.state === "no_corregida")).toBe(true);
    expect(inf.blocked).toBe(true);
    expect(inf.synthesis!.accepted).toBe(false);
    expect(inf.verdict).toBeNull();
    for (const seed of [1, 2, 3, 4, 5, 6, 8, 9]) {
      const a = play("azar", seed);
      expect(a.phase).toBe("fin");
      const x = informeOf(R, a);
      expect(x.got).toBeLessThanOrEqual(96);
      expect(x.verdict).toBeNull();
      expect(x.safeguards.every((q) => q.state !== "sin_respuesta")).toBe(true);
      expect(x.blocked).toBe(x.safeguards.some((q) => q.state === "no_corregida"));
    }
  });

  it("las decisiones cambian lo que pasa después", () => {
    const s05 = stepById(R, "s05.anuncios")!.step;
    expect(textOf(s05.text, flagsOf(R, { "s02.prioridad": "anuncios" }))).toMatch(/Tú propusiste empezar por los anuncios/);
    expect(textOf(s05.text, flagsOf(R, { "s02.prioridad": "servicio" }))).toMatch(/etiquetado/);
    const s12 = R.scenes.find((s) => s.id === "S12")!;
    expect(textOf(s12.intro, flagsOf(R, { "s07.lote": "enviar" }))).toMatch(/propusiste enviar/);
    const enc = stepById(R, "s08.encargo")!.step;
    expect(textOf(enc.text, flagsOf(R, { "s08.quien": "micro" }))).toMatch(/Alma ya empezó a revisar/);
    // Una alerta de control aparece solo si se quiso pagar sin verificar.
    expect(pathOf(R, flagsOf(R, { "s13.control": "pagar" })).some((s) => s.step.id === "s13.alerta")).toBe(true);
    expect(pathOf(R, flagsOf(R, { "s13.control": "verificar" })).some((s) => s.step.id === "s13.alerta")).toBe(false);
    // Hay al menos ocho marcas distintas que se leen después.
    const used = new Set(allSteps(R).flatMap(({ step }) => [step.when?.flag, ...(step.text.alt ?? []).map((a) => a.when.flag)]).concat(R.scenes.flatMap((s) => (s.intro.alt ?? []).map((a) => a.when.flag))).filter(Boolean));
    expect(used.size).toBeGreaterThanOrEqual(8);
  });

  it("lo respondido no se cambia y solo se responde el paso actual", () => {
    let i = advanceReto(R, newIntento(R), { t: "empezar", now: NOW });
    const first = i.at!;
    i = advanceReto(R, i, { t: "responder", step: first, value: "propuesta" });
    expect(advanceReto(R, i, { t: "responder", step: first, value: "eslogan" }).answers[first]).toBe("propuesta");
    expect(advanceReto(R, i, { t: "responder", step: "s03.pago", value: "distingue" })).toBe(i);
    expect(advanceReto(R, i, { t: "responder", step: first, value: "no-existe" })).toBe(i);
    // Sin responder no se avanza.
    const j = advanceReto(R, newIntento(R), { t: "empezar", now: NOW });
    expect(advanceReto(R, j, { t: "avanzar" })).toBe(j);
  });

  it("se retoma en cualquier paso y rechaza lo alterado", () => {
    let i = advanceReto(R, newIntento(R), { t: "empezar", now: NOW });
    let checked = 0;
    let mid: Intento | null = null;
    for (let guard = 0; guard < 200 && nextStep(R, i); guard++) {
      const back = readIntento(R, JSON.parse(JSON.stringify(i)));
      expect(back.at).toBe(i.at);
      expect(back.answers).toEqual(i.answers);
      expect(back.flags).toEqual(i.flags);
      checked++;
      if (checked === 20) mid = i;
      const p = stepById(R, i.at!)!.step;
      const v = answerFor(p, "experto", Math.random);
      if (v !== undefined) i = advanceReto(R, i, { t: "responder", step: p.id, value: v });
      i = advanceReto(R, i, { t: "avanzar" });
    }
    expect(checked).toBeGreaterThan(40);
    expect(readIntento(R, { ...i, ver: 99 }).phase).toBe("inicio");
    expect(readIntento(R, { ...i, reto: "otro" }).phase).toBe("inicio");
    expect(readIntento(R, { ...i, answers: { ...i.answers, "s01.valor": "inventada" } }).phase).toBe("inicio");
    expect(readIntento(R, { ...i, answers: { ...i.answers, "s14.plan": "seguridad" }, at: "s01.valor" }).phase).toBe("inicio");
    expect(readIntento(R, { ...mid!, phase: "fin" }).phase).toBe("inicio");
    expect(readIntento(R, { ...mid!, at: "s14.cierre" }).phase).toBe("inicio");
    expect(readIntento(R, "basura").phase).toBe("inicio");
    expect(readIntento(R, null).phase).toBe("inicio");
  });

  it("pedir ayuda marca el intento como asistido y no se desmarca", () => {
    let i = advanceReto(R, newIntento(R), { t: "empezar", now: NOW });
    i = advanceReto(R, i, { t: "ayuda" });
    expect(i.assisted).toBe(true);
    expect(readIntento(R, JSON.parse(JSON.stringify(i))).assisted).toBe(true);
    expect(informeOf(R, i).assisted).toBe(true);
    i = advanceReto(R, i, { t: "abrir", doc: "d01" });
    i = advanceReto(R, i, { t: "abrir", doc: "d01" });
    expect(i.opened).toEqual(["d01"]);
  });

  it("lo escrito queda en espera y no da puntos solo", () => {
    const p = stepById(R, "s09.correo")!.step;
    expect(scoreStep(p, { correo: "Texto perfecto" })).toEqual({ got: 0, auto: false });
    expect(scoreStep(p, { correo: "" })).toEqual({ got: 0, auto: true });
  });

  it("no hay umbral de aprobación en el reto ni en la pantalla, y el reto no registra evidencia", () => {
    expect(R.thresholds).toEqual({ candidates: [], enabled: false });
    expect(checkReto({ ...R, thresholds: { candidates: [72], enabled: false } }).errors).toContain("no hay umbral aprobado: el reto no guarda candidatos");
    const umbral = /\b72\b[^\n]{0,12}\b76\b[^\n]{0,12}\b80\b|72\/96|76\/96|80\/96/;
    for (const f of ["ec-n1-002-a.ts", "motor.ts", "tipos.ts", "../../../../components/ceo/RetoPiloto.tsx"]) expect(readFileSync(join(__dirname, f), "utf8")).not.toMatch(umbral);
    expect(R.evidencePolicy).toBe("no_registra");
    expect(R.qa.editorialReviewedAt).toBeNull();
    expect(R.qa.publishedAt).toBeNull();
  });

  /** Juega como experto, salvo en los pasos indicados (id del paso → id de la opción). */
  function playWith(over: Record<string, string>): Intento {
    let i = advanceReto(R, newIntento(R), { t: "empezar", now: NOW });
    for (let guard = 0; guard < 200; guard++) {
      const p = stepById(R, i.at!)!.step;
      const v = over[p.id] ?? answerFor(p, "experto", () => 0);
      if (v !== undefined) i = advanceReto(R, i, { t: "responder", step: p.id, value: v });
      if (!nextStep(R, i)) return advanceReto(R, i, { t: "terminar", now: NOW });
      i = advanceReto(R, i, { t: "avanzar" });
    }
    throw new Error("el recorrido no termina");
  }
  const CASOS = [
    { step: "s07.lote", fix: "s07.lote2", critica: "enviar", segura: "retener", sostiene: "sostiene", kind: "inocuidad", lost: 3 },
    { step: "s12.etica", fix: "s12.etica2", critica: "entregar", segura: "verdad", sostiene: "sostiene", kind: "etica", lost: 4 },
    { step: "s13.control", fix: "s13.control2", critica: "pagar", segura: "verificar", sostiene: "sostiene", kind: "control_bancario", lost: 2 },
  ] as const;

  it("salvaguardas: la rectificación aparece solo tras una ruta crítica y después de la información nueva", () => {
    for (const c of CASOS) {
      const p = stepById(R, c.step)!.step;
      if (p.kind !== "decision") throw new Error("la salvaguarda es una decisión");
      expect(p.salvaguarda).toBe(c.kind);
      for (const o of p.options) {
        const shown = pathOf(R, flagsOf(R, { [c.step]: o.id })).some((s) => s.step.id === c.fix);
        expect(shown).toBe(o.critica === true);
        // La consecuencia (información nueva) existe antes de pedir la rectificación.
        if (o.critica) expect(o.reply.length).toBeGreaterThan(0);
      }
      const fix = stepById(R, c.fix)!.step;
      expect(fix.rectifica).toBe(c.step);
      expect(fix.skill).toBeNull();
      expect(fix.points).toBe(0);
      expect(maxBySkill(R)).not.toHaveProperty(c.fix);
    }
    // Las rutas críticas son las que el paquete nombra como falla.
    const crit = allSteps(R).flatMap(({ step }) => (step.kind === "decision" ? step.options.filter((o) => o.critica).map((o) => `${step.id}/${o.id}`) : []));
    expect(crit).toEqual(["s07.lote/enviar", "s12.etica/entregar", "s12.etica/quitar", "s12.etica/excusa", "s13.control/pagar"]);
  });

  it("salvaguardas: un error corregido no bloquea, pero tampoco devuelve los puntos", () => {
    for (const c of CASOS) {
      const inf = informeOf(R, playWith({ [c.step]: c.critica, [c.fix]: "corrige" }));
      const mine = inf.safeguards.find((s) => s.step === c.step)!;
      expect(mine).toEqual({ kind: c.kind, step: c.step, state: "corregida", first: c.critica, fix: "corrige" });
      expect(inf.safeguards.filter((s) => s.step !== c.step).every((s) => s.state === "cumplida")).toBe(true);
      expect(inf.blocked).toBe(false);
      expect(inf.got).toBe(92 - c.lost);
      expect(inf.max).toBe(96);
    }
    const todas = informeOf(R, playWith(Object.fromEntries(CASOS.flatMap((c) => [[c.step, c.critica], [c.fix, "corrige"]]))));
    expect(todas.safeguards.every((s) => s.state === "corregida")).toBe(true);
    expect(todas.blocked).toBe(false);
    expect(todas.got).toBe(92 - 9);
  });

  it("salvaguardas: una decisión crítica sin corregir no se compensa con ningún puntaje", () => {
    for (const c of CASOS) {
      const inf = informeOf(R, playWith({ [c.step]: c.critica, [c.fix]: c.sostiene }));
      expect(inf.safeguards.find((s) => s.step === c.step)!.state).toBe("no_corregida");
      // Todo lo demás perfecto: el puntaje es alto y aun así queda bloqueado.
      expect(inf.got).toBe(92 - c.lost);
      expect(inf.blocked).toBe(true);
      expect(inf.verdict).toBeNull();
    }
    // Corregir a medias (otra ruta con riesgo) tampoco cuenta como corrección.
    expect(informeOf(R, playWith({ "s12.etica": "excusa", "s12.etica2": "calla" })).blocked).toBe(true);
    expect(informeOf(R, playWith({ "s13.control": "pagar", "s13.control2": "firma" })).blocked).toBe(true);
    expect(informeOf(R, playWith({ "s07.lote": "enviar", "s07.lote2": "aviso" })).blocked).toBe(true);
  });

  it("salvaguardas: perder puntos sin abrir el daño no es una decisión crítica", () => {
    const inf = informeOf(R, playWith({ "s07.lote": "todo", "s13.control": "correo" }));
    expect(inf.safeguards.every((s) => s.state === "cumplida")).toBe(true);
    expect(inf.blocked).toBe(false);
    expect(inf.got).toBe(92 - 2 - 1);
  });

  it("salvaguardas: a medio reto el estado no se adelanta y el intento se retoma en la rectificación", () => {
    let i = advanceReto(R, newIntento(R), { t: "empezar", now: NOW });
    for (let guard = 0; guard < 200 && i.at !== "s07.lote"; guard++) {
      const p = stepById(R, i.at!)!.step;
      const v = answerFor(p, "experto", () => 0);
      if (v !== undefined) i = advanceReto(R, i, { t: "responder", step: p.id, value: v });
      i = advanceReto(R, i, { t: "avanzar" });
    }
    expect(informeOf(R, i).safeguards.every((s) => s.state === "sin_respuesta")).toBe(true);
    i = advanceReto(R, i, { t: "responder", step: "s07.lote", value: "enviar" });
    expect(informeOf(R, i).safeguards[0].state).toBe("sin_respuesta");
    expect(informeOf(R, i).blocked).toBe(false);
    i = advanceReto(R, i, { t: "avanzar" });
    expect(i.at).toBe("s07.lote2");
    const back = readIntento(R, JSON.parse(JSON.stringify(i)));
    expect(back.at).toBe("s07.lote2");
    // La primera respuesta no se puede cambiar desde la rectificación.
    expect(advanceReto(R, i, { t: "responder", step: "s07.lote", value: "retener" })).toBe(i);
    i = advanceReto(R, i, { t: "responder", step: "s07.lote2", value: "corrige" });
    expect(informeOf(R, i).safeguards[0].state).toBe("corregida");
    expect(i.answers["s07.lote"]).toBe("enviar");
  });

  it("síntesis: las dos secuencias defendibles valen igual si su fundamento se sostiene", () => {
    const a = informeOf(R, playWith({ "s14.plan": "seguridad", "s14.razon.seguridad": "hechos" }));
    const b = informeOf(R, playWith({ "s14.plan": "entregas", "s14.razon.entregas": "hechos" }));
    expect(a.synthesis).toEqual({ sequence: "seguridad", sequenceOk: true, reason: "hechos", reasonOk: true, accepted: true });
    expect(b.synthesis).toEqual({ sequence: "entregas", sequenceOk: true, reason: "hechos", reasonOk: true, accepted: true });
    // Mismo puntaje, mismas observaciones, mismas salvaguardas: el orden elegido no cambia nada más.
    expect(b.got).toBe(a.got);
    expect(b.observations).toEqual(a.observations);
    expect(b.safeguards).toEqual(a.safeguards);
    // Una secuencia defendible con un fundamento que no se sostiene no se acepta.
    for (const [plan, malas] of [["seguridad", ["certeza", "aparicion"]], ["entregas", ["basta", "barato"]]] as const) for (const m of malas) {
      const x = informeOf(R, playWith({ "s14.plan": plan, [`s14.razon.${plan}`]: m }));
      expect(x.synthesis).toMatchObject({ sequenceOk: true, reasonOk: false, accepted: false });
      expect(x.got).toBe(a.got);
    }
    // La secuencia con riesgo no pasa por fundamento y no se acepta.
    const v = playWith({ "s14.plan": "ventas" });
    expect(Object.keys(v.answers).some((k) => k.startsWith("s14.razon"))).toBe(false);
    expect(informeOf(R, v).synthesis).toEqual({ sequence: "ventas", sequenceOk: false, reason: null, reasonOk: false, accepted: false });
    // La síntesis no da puntos a ninguna habilidad.
    for (const { step } of allSteps(R)) if (step.sintesis) { expect(step.skill).toBeNull(); expect(step.points).toBe(0); }
  });

  it("las opciones se barajan siempre igual y la defendible no queda siempre en el mismo lugar", () => {
    const ds = allSteps(R).flatMap(({ step }) => (step.kind === "decision" ? [step] : []));
    const pos = ds.map((d) => ordenOpciones(d.id, d.options).findIndex((o) => o.tipo === "defendible"));
    expect(new Set(pos).size).toBeGreaterThanOrEqual(3);
    for (const k of [0, 1, 2, 3]) expect(pos.filter((p) => p === k).length).toBeLessThan(ds.length / 2);
    for (const d of ds) expect(ordenOpciones(d.id, d.options).map((o) => o.id)).toEqual(ordenOpciones(d.id, d.options).map((o) => o.id));
  });

  it("es una pieza distinta de EC-N1-001-A, que sigue intacto en el catálogo editorial", () => {
    expect(R.editorialId).toBe("EC-N1-002-A");
    expect(RETOS.map((r) => r.editorialId)).toEqual(["EC-N1-001-A", "EC-N1-002-A"]);
    expect(RETOS.find((r) => r.editorialId === "EC-N1-001-A")!.packageVersion).toBe("1.0");
    expect(RETOS_DEMO.map((r) => r.editorialId)).toEqual(["EC-N1-002-A"]);
    expect(retoBySlug(R.slug)).toBe(R);
  });

  it("el motor y el contenido no tocan evidencias, dominio, partida ni servicios", () => {
    const dir = __dirname;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".ts") && !x.endsWith(".test.ts"))) {
      const src = readFileSync(join(dir, f), "utf8");
      expect(src).not.toMatch(/from "[^"]*(evidencias|dominio|engine|mastery|store|supabase|events)[^"]*"/);
      expect(src).not.toMatch(/fetch\(|localStorage/);
    }
  });
});
