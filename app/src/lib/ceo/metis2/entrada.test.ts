import { describe, expect, it } from "vitest";
import { ACADEMIES, MIN_PRIORITY_TOPICS, TOPICS } from "./academias";
import { caseCompanyFor, decidedOf, entryProfile, practiceByAcademy, practiceTotals, priorityTracks, toggleTopic, topicAcademies, topicNames, topicsByAcademy, topicsCountText, topicsReady, weekGoalText } from "./entrada";
import { INDUSTRIES, PRACTICE_DAYS, isPracticeDays, sanitizeProfile } from "../profile";
import { COMPANIES, FIRST_COMPANY, companyById } from "../companies";
import { LESSONS, TRACKS } from "../lessons";
import { DILEMMAS } from "../dilemmas";
import { newCompanyProfile } from "../career/identity";
import { TAXONOMY_VERSION } from "../career/taxonomy";

describe("Registro corto · temas prioritarios", () => {
  it("agrupa los 41 temas por academia sin perder ni repetir ninguno", () => {
    const groups = topicsByAcademy();
    const all = groups.flatMap((g) => g.topics.map((t) => t.id));
    expect(all.length).toBe(TOPICS.length);
    expect(new Set(all).size).toBe(TOPICS.length);
    expect(groups.length).toBe(ACADEMIES.length);
    for (const g of groups) expect(g.topics.length, g.academy.id).toBeGreaterThan(0);
  });

  it("marca y desmarca, e ignora lo que no está en el catálogo", () => {
    const a = TOPICS[0].id, b = TOPICS[1].id;
    expect(toggleTopic([], a)).toEqual([a]);
    expect(toggleTopic([a], b)).toEqual([a, b]);
    expect(toggleTopic([a, b], a)).toEqual([b]);
    expect(toggleTopic([a], "no-existe")).toEqual([a]);
  });

  it("pide al menos cinco temas y lo dice con claridad", () => {
    const ids = TOPICS.slice(0, MIN_PRIORITY_TOPICS).map((t) => t.id);
    expect(MIN_PRIORITY_TOPICS).toBe(5);
    expect(topicsReady([])).toBe(false);
    expect(topicsReady(ids.slice(0, 4))).toBe(false);
    expect(topicsReady(ids)).toBe(true);
    expect(topicsReady([...ids.slice(0, 4), "no-existe"])).toBe(false);
    expect(topicsCountText([])).toBe("Elige al menos 5");
    expect(topicsCountText(ids.slice(0, 1))).toBe("Llevas 1. Faltan 4");
    expect(topicsCountText(ids.slice(0, 4))).toBe("Llevas 4. Falta 1");
    expect(topicsCountText(ids)).toBe("Llevas 5 temas");
    expect(topicNames([ids[2], ids[0]])).toEqual([TOPICS[0].name, TOPICS[2].name]);
  });

  it("los temas elegidos señalan sus rutas de Academy y sus academias", () => {
    const tracks = TRACKS.map((t) => t.id);
    expect(priorityTracks([], tracks).size).toBe(0);
    const some = priorityTracks(TOPICS.slice(0, 5).map((t) => t.id), tracks);
    for (const t of some) expect(tracks).toContain(t);
    // Cada ruta de Academy corresponde al menos a un tema del catálogo.
    expect(priorityTracks(TOPICS.map((t) => t.id), tracks).size).toBe(tracks.length);
    expect(topicAcademies([]).size).toBe(0);
    expect([...topicAcademies(TOPICS.map((t) => t.id))].sort()).toEqual(ACADEMIES.map((a) => a.id).sort());
    expect(topicAcademies(["no-existe"]).size).toBe(0);
  });
});

describe("Registro corto · el perfil guarda temas y días", () => {
  it("conserva solo temas del catálogo, sin repetidos, y los días válidos", () => {
    const a = TOPICS[0].id, b = TOPICS[3].id;
    const p = sanitizeProfile({ v: 1, skipped: [], source: "onboarding", answeredAt: 5, updatedAt: 5, topics: [a, "inventado", b, a, 7], days: 5 })!;
    expect(p.topics).toEqual([a, b]);
    expect(p.days).toBe(5);
    const q = sanitizeProfile({ v: 1, skipped: [], source: "perfil", answeredAt: 5, updatedAt: 5, topics: ["inventado"], days: 4 })!;
    expect(q.topics).toBeUndefined();
    expect(q.days).toBeUndefined();
    expect(PRACTICE_DAYS.map((d) => d.value)).toEqual([3, 5, 7]);
    expect(isPracticeDays(7)).toBe(true);
    expect(isPracticeDays("7")).toBe(false);
  });

  it("al terminar el registro se guardan temas y días, se haya respondido la experiencia o no", () => {
    const ids = TOPICS.slice(0, 6).map((t) => t.id);
    const later = entryProfile(undefined, [...ids, "inventado"], 3, 1000);
    expect(later.topics).toEqual(ids);
    expect(later.days).toBe(3);
    expect(later.answeredAt).toBe(0); // la experiencia se sigue ofreciendo después
    expect(sanitizeProfile(later)).toEqual(later);
    const answered = entryProfile({ v: 1, role: "gerente", skipped: [], source: "onboarding", answeredAt: 500, updatedAt: 500, topics: ["viejo"], days: 7 }, ids, 5, 1000);
    expect(answered.role).toBe("gerente");
    expect(answered.answeredAt).toBe(500);
    expect(answered.topics).toEqual(ids);
    expect(answered.days).toBe(5);
    expect(entryProfile(undefined, [], undefined, 1).topics).toBeUndefined();
  });

  it("un perfil anterior, sin temas ni días, sigue siendo válido", () => {
    const p = sanitizeProfile({ v: 1, role: "gerente", skipped: [], source: "onboarding", answeredAt: 1, updatedAt: 1 })!;
    expect(p.role).toBe("gerente");
    expect(p.topics).toBeUndefined();
    expect(p.days).toBeUndefined();
  });
});

describe("Registro corto · la empresa pertenece al caso", () => {
  const packs = COMPANIES.map((c) => c.id);

  it("sin industria declarada usa la primera empresa del catálogo, con su nombre de siempre", () => {
    const r = caseCompanyFor(undefined, () => 0.5);
    expect(r.packId).toBe(FIRST_COMPANY);
    expect(r.setup).not.toBeNull();
    expect(r.setup!.displayName).toBe(companyById(FIRST_COMPANY).name);
  });

  it("la partida arranca con la empresa del caso tal cual: mismo nombre y mismo nombre corto", async () => {
    const { replay } = await import("../replay");
    const { isContinuous, packOf } = await import("../engine");
    const T = Date.UTC(2026, 10, 13, 15, 0, 0);
    for (const co of COMPANIES) {
      const ind = INDUSTRIES.find((i) => "company" in i && i.company === co.id);
      const r = caseCompanyFor(ind?.id, () => 0.4);
      if (r.packId !== co.id) continue;
      const { state, rejected } = replay([
        { type: "start", at: T, name: "Ana Ruiz", company: r.packId, settings: { tz: "America/Monterrey" }, rulesVersion: 3, tier: 0, journey: true },
        { type: "setupCompany", at: T, ...r.setup! },
      ]);
      expect(rejected, co.id).toEqual([]);
      expect(isContinuous(state), co.id).toBe(true);
      expect(packOf(state).name, co.id).toBe(co.name);
      expect(packOf(state).short, co.id).toBe(co.short);
    }
  });

  it("para cada industria del cuestionario arma una empresa válida, sin pedir nada a la persona", () => {
    for (const ind of INDUSTRIES) {
      const r = caseCompanyFor(ind.id, () => 0.25);
      expect(packs, ind.id).toContain(r.packId);
      expect(r.setup, ind.id).not.toBeNull();
      expect(r.setup!.displayName, ind.id).toBe(companyById(r.packId).name);
      expect(newCompanyProfile({ ...r.setup!, at: 1 }, TAXONOMY_VERSION), ind.id).toBeTruthy();
    }
    expect(caseCompanyFor("industria-que-no-existe").packId).toBe(FIRST_COMPANY);
  });
});

describe("Mi progreso · práctica por academia", () => {
  const lessonIds = LESSONS.map((l) => l.id);

  it("devuelve las seis academias en el orden del catálogo, en cero si no hay actividad", () => {
    const rows = practiceByAcademy({ lessonIds, lessonsDone: {}, decided: [], dilemmaIds: [] });
    expect(rows.map((r) => r.academy)).toEqual(ACADEMIES.map((a) => a.id));
    for (const r of rows) { expect(r.lessonsDone).toBe(0); expect(r.decisions).toBe(0); }
    expect(rows.reduce((n, r) => n + r.lessonsTotal, 0)).toBeGreaterThan(0);
    expect(rows.reduce((n, r) => n + r.lessonsTotal, 0)).toBeLessThanOrEqual(lessonIds.length);
  });

  it("cuenta lecciones terminadas y decisiones una sola vez, y nunca más que el total", () => {
    const done = Object.fromEntries(lessonIds.slice(0, 6).map((id) => [id, 1]));
    const items = companyById(FIRST_COMPANY).items.slice(0, 4).map((i) => ({ company: FIRST_COMPANY, id: i.id }));
    const dil = DILEMMAS.slice(0, 2).map((d) => d.id);
    const rows = practiceByAcademy({ lessonIds, lessonsDone: done, decided: [...items, ...items], dilemmaIds: [...dil, ...dil] });
    for (const r of rows) expect(r.lessonsDone).toBeLessThanOrEqual(r.lessonsTotal);
    expect(rows.reduce((n, r) => n + r.lessonsDone, 0)).toBeGreaterThan(0);
    expect(rows.reduce((n, r) => n + r.lessonsDone, 0)).toBeLessThanOrEqual(6);
    const decisions = rows.reduce((n, r) => n + r.decisions, 0);
    expect(decisions).toBeGreaterThan(0);
    expect(decisions).toBeLessThanOrEqual(items.length + dil.length);
  });

  it("cuenta las decisiones de empresas anteriores con la clasificación de su propia empresa", () => {
    const other = COMPANIES.find((c) => c.id !== FIRST_COMPANY)!;
    const rows = practiceByAcademy({ lessonIds, lessonsDone: {}, decided: [{ company: FIRST_COMPANY, id: companyById(FIRST_COMPANY).items[0].id }, { company: other.id, id: other.items[0].id }], dilemmaIds: [] });
    expect(rows.reduce((n, r) => n + r.decisions, 0)).toBe(2);
  });

  it("lo que no está clasificado no se cuenta ni rompe nada", () => {
    const rows = practiceByAcademy({ lessonIds: ["no-existe"], lessonsDone: { "no-existe": 1 }, decided: [{ company: "empresa-rara", id: "x" }], dilemmaIds: ["y"] });
    expect(rows.every((r) => r.lessonsTotal === 0 && r.lessonsDone === 0 && r.decisions === 0)).toBe(true);
  });
});

describe("Menú · el interruptor del simulador viaja con los ajustes", () => {
  it("el diario conserva «simulador» solo si es verdadero o falso, y reproducirlo no toca la partida", async () => {
    const { sanitizeAction } = await import("../journal");
    const { replay } = await import("../replay");
    const T = Date.UTC(2026, 10, 13, 15, 0, 0);
    const on = sanitizeAction({ type: "settings", at: T + 1000, patch: { simulador: true } });
    expect(on && on.type === "settings" && on.patch).toEqual({ simulador: true });
    const bad = sanitizeAction({ type: "settings", at: T + 1000, patch: { simulador: "si" } });
    expect(bad && bad.type === "settings" && bad.patch).toEqual({});
    const base = replay([{ type: "start", at: T, name: "Ana Ruiz", company: FIRST_COMPANY, settings: { tz: "America/Monterrey" }, rulesVersion: 3, tier: 0, journey: true }]);
    const withSwitch = replay([{ type: "start", at: T, name: "Ana Ruiz", company: FIRST_COMPANY, settings: { tz: "America/Monterrey" }, rulesVersion: 3, tier: 0, journey: true }, { type: "settings", at: T + 1000, patch: { simulador: true } }]);
    expect(withSwitch.rejected).toEqual([]);
    expect(base.state.settings.simulador).toBeUndefined();
    expect(withSwitch.state.settings.simulador).toBe(true);
    expect(withSwitch.state.decisions).toEqual(base.state.decisions);
    expect(withSwitch.state.company).toBe(base.state.company);
  });
});

describe("Mi progreso · totales, decisiones de toda la trayectoria y meta de días", () => {
  it("junta las decisiones de la empresa en curso, de las ya cerradas y de las guardadas", () => {
    const rows = decidedOf({
      company: "a", decisions: { x1: {}, x2: {} },
      career: [{ company: "b", decisions: { y1: {} } }],
      shelf: [{ state: { company: "c", decisions: { z1: {}, z2: {} } } }],
    });
    expect(rows).toEqual([{ company: "a", id: "x1" }, { company: "a", id: "x2" }, { company: "b", id: "y1" }, { company: "c", id: "z1" }, { company: "c", id: "z2" }]);
    expect(decidedOf({ company: "a", decisions: {} })).toEqual([]);
  });

  it("los totales son la suma de las seis academias", () => {
    const rows = practiceByAcademy({ lessonIds: LESSONS.map((l) => l.id), lessonsDone: { [LESSONS[0].id]: 1, [LESSONS[1].id]: 1 }, decided: [], dilemmaIds: DILEMMAS.slice(0, 2).map((d) => d.id) });
    const t = practiceTotals(rows);
    expect(t.lessonsDone).toBe(rows.reduce((n, r) => n + r.lessonsDone, 0));
    expect(t.lessonsTotal).toBe(rows.reduce((n, r) => n + r.lessonsTotal, 0));
    expect(t.decisions).toBe(rows.reduce((n, r) => n + r.decisions, 0));
    expect(t.lessonsDone).toBeLessThanOrEqual(2);
    expect(t.lessonsTotal).toBeLessThanOrEqual(LESSONS.length);
    expect(practiceTotals([])).toEqual({ lessonsDone: 0, lessonsTotal: 0, decisions: 0 });
  });

  it("la meta de días se dice en claro, y sin meta solo se cuenta lo practicado", () => {
    expect(weekGoalText(0, undefined)).toBe("Practicaste 0 de los últimos 7 días.");
    expect(weekGoalText(3, 5)).toBe("Practicaste 3 de los últimos 7 días. Tu meta es practicar 5 días por semana.");
    expect(weekGoalText(7, 7)).toBe("Practicaste 7 de los últimos 7 días. Tu meta es practicar todos los días.");
    expect(weekGoalText(12, 3)).toMatch(/^Practicaste 7 de/);
    expect(weekGoalText(-2, 3)).toMatch(/^Practicaste 0 de/);
  });
});
