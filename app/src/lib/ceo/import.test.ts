/** Importar la carrera del navegador (adenda v3.2 §3.4). Partidas reales: las doradas. */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { replay } from "./replay";
import { migrate, xpOf } from "./engine";
import type { Golden } from "./golden/play";
import type { CeoState } from "./types";
import {
  claimLegacy, finishImport, helpMailto, importIdFor, isImportId, LEGACY_KEY, LEGACY_RULES_VERSION, legacyOwners, markLegacy, memoryKV,
  ownerKey, planImport, readBackup, readClaim, readLegacy, readOwner, summaryOf, validateImport, writeOwner,
} from "./import";
import { CATALOG_VERSION } from "./catalog";

const golden = (id: string): CeoState => {
  const g: Golden = JSON.parse(readFileSync(join(__dirname, "golden/data", `${id}.json`), "utf8"));
  const st = replay(g.actions).state;
  const last = g.actions[g.actions.length - 1].at;
  return { ...st, savedAt: last, lastActiveAt: Math.max(st.lastActiveAt, last) };
};
const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const LATER = Date.UTC(2027, 0, 1);
const plan = (kv: ReturnType<typeof memoryKV>, uid: string, cloud: CeoState | null) =>
  planImport({ uid, legacy: readLegacy(kv), owners: legacyOwners(kv), claim: readClaim(kv), cloud });

describe("qué se le pregunta a quien entra", () => {
  it("usuario nuevo sin datos locales: nada que importar (onboarding normal)", () => {
    expect(plan(memoryKV(), A, null)).toEqual({ kind: "none", reason: "sin_local" });
    // Una partida vieja sin empezar tampoco cuenta.
    expect(plan(memoryKV({ [LEGACY_KEY]: JSON.stringify({ v: 2, startedAt: null }) }), A, null).kind).toBe("none");
    expect(plan(memoryKV({ [LEGACY_KEY]: "{roto" }), A, null).kind).toBe("none");
  });

  it("carrera local y nube vacía: se ofrece importar con empresa, XP, etapa y última actividad", () => {
    const s = golden("cumbre-vencidos");
    const p = plan(memoryKV({ [LEGACY_KEY]: JSON.stringify(s) }), A, null);
    expect(p.kind).toBe("offer_import");
    if (p.kind !== "offer_import") return;
    expect(p.local.company).toBe("Botanas Cumbre");
    expect(p.local.xp).toBe(xpOf(s, s.savedAt));
    expect(p.local.xp).toBeGreaterThan(0);
    expect(p.local.stage).toBeTruthy();
    expect(p.local.lastActivity).toBe(Math.max(s.lastActiveAt, s.savedAt));
  });

  it("nube y local distintas: conflicto con ambas vistas (nadie se sobrescribe)", () => {
    const local = golden("cumbre-vencidos"), cloud = golden("forja-azar");
    const p = plan(memoryKV({ [LEGACY_KEY]: JSON.stringify(local) }), A, cloud);
    expect(p.kind).toBe("conflict");
    if (p.kind === "conflict") { expect(p.local.companyId).toBe("cumbre"); expect(p.cloud.companyId).toBe("forja"); }
  });

  it("la misma carrera ya subida (y la nube va igual o adelante): no se pregunta", () => {
    const s = golden("cumbre-mejor");
    expect(plan(memoryKV({ [LEGACY_KEY]: JSON.stringify(s) }), A, { ...s, savedAt: s.savedAt + 1 }).kind).toBe("same");
    // Pero si el navegador va adelante de la nube, sí se pregunta.
    expect(plan(memoryKV({ [LEGACY_KEY]: JSON.stringify({ ...s, savedAt: s.savedAt + 5000 }) }), A, s).kind).toBe("conflict");
  });

  it("A cerró sesión y entra B: B no ve ni se apropia de la carrera de A", () => {
    const s = golden("cumbre-mejor");
    // La versión anterior marcaba la partida como subida por A.
    const kv = memoryKV({ [LEGACY_KEY]: JSON.stringify(s), [`${LEGACY_KEY}:welcome:${A}`]: "1" });
    expect(plan(kv, B, null)).toEqual({ kind: "none", reason: "de_otra_cuenta" });
    expect(plan(kv, A, null).kind).toBe("offer_import");
    // Y si A decidió sobre ella, tampoco se le ofrece a B.
    const kv2 = memoryKV({ [LEGACY_KEY]: JSON.stringify(s) });
    claimLegacy(kv2, { uid: A, how: "descartada", savedAt: s.savedAt });
    expect(plan(kv2, B, null).kind).toBe("none");
    // Cada cuenta guarda en su propia clave.
    writeOwner(kv2, A, s);
    expect(readOwner(kv2, B)).toBeNull();
    expect(readOwner(kv2, A)?.startedAt).toBe(s.startedAt);
    expect(ownerKey(A)).not.toBe(ownerKey(B));
  });

  it("Google y correo de la misma persona son el mismo usuario: misma clave y misma carrera", () => {
    const s = golden("forja-mejor");
    const kv = memoryKV();
    writeOwner(kv, A, s); // entró con correo
    expect(readOwner(kv, A)?.savedAt).toBe(s.savedAt); // entra con Google: Supabase devuelve el mismo id
  });

  it("«Empezar desde cero» o «Conservar la nube» no se vuelve a preguntar… salvo que siga jugando sin cuenta", () => {
    const s = golden("cumbre-mejor");
    const kv = memoryKV({ [LEGACY_KEY]: JSON.stringify(s) });
    claimLegacy(kv, { uid: A, how: "descartada", savedAt: s.savedAt });
    expect(plan(kv, A, null)).toEqual({ kind: "none", reason: "ya_resuelta" });
    expect(kv.getItem(LEGACY_KEY)).not.toBeNull(); // el original no se borra
    kv.setItem(LEGACY_KEY, JSON.stringify({ ...s, savedAt: s.savedAt + 1 }));
    expect(plan(kv, A, null).kind).toBe("offer_import");
  });
});

describe("importId idempotente", () => {
  it("mismo id al recargar o reintentar; otro id si la partida local cambió", () => {
    const kv = memoryKV();
    let n = 0;
    const gen = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
    const a = importIdFor(kv, 100, gen), b = importIdFor(kv, 100, gen);
    expect(a).toBe(b);
    expect(isImportId(a)).toBe(true);
    expect(importIdFor(kv, 200, gen)).not.toBe(a);
    expect(isImportId("x")).toBe(false);
  });
});

describe("después de importar", () => {
  it("el original pasa a respaldo recuperable, la cuenta queda con su copia y no se vuelve a ofrecer", () => {
    const s = golden("cumbre-mejor");
    const kv = memoryKV({ [LEGACY_KEY]: JSON.stringify(s) });
    const id = importIdFor(kv, s.savedAt);
    const imported = markLegacy(s, id, LATER);
    finishImport(kv, A, imported, id, LATER);
    expect(kv.getItem(LEGACY_KEY)).toBeNull();
    const b = readBackup(kv)!;
    expect(b.uid).toBe(A);
    expect((b.state as CeoState).savedAt).toBe(s.savedAt);
    expect(readOwner(kv, A)?.origin?.importId).toBe(id);
    expect(plan(kv, A, imported).kind).toBe("none");
    expect(plan(kv, B, null).kind).toBe("none");
  });

  it("si la conexión se corta antes de confirmar, nada local cambia (se puede reintentar con el mismo id)", () => {
    const s = golden("cumbre-mejor");
    const kv = memoryKV({ [LEGACY_KEY]: JSON.stringify(s) });
    const before = JSON.stringify(kv.dump()[LEGACY_KEY]);
    const id = importIdFor(kv, s.savedAt);
    // (no se llama finishImport: el servidor no respondió)
    expect(JSON.stringify(kv.dump()[LEGACY_KEY])).toBe(before);
    expect(plan(kv, A, null).kind).toBe("offer_import");
    expect(importIdFor(kv, s.savedAt)).toBe(id);
  });
});

const leg0 = () => ({ s: golden("carrera-legendaria") });
describe("validación en el servidor", () => {
  it("acepta las partidas doradas de las 3 empresas sin perder XP", () => {
    for (const id of ["cumbre-mejor", "forja-azar", "brasa-peor", "carrera-legendaria", "cumbre-vencidos", "repite-y-asciende", "otra-zona"]) {
      const s = golden(id);
      const r = validateImport(JSON.parse(JSON.stringify(s)), LATER);
      expect(r.ok, id).toBe(true);
      if (r.ok) expect(xpOf(r.state, s.savedAt)).toBe(xpOf(s, s.savedAt));
    }
  });
  it("rechaza lo que no cuadra sin «corregirlo»", () => {
    const s = golden("cumbre-mejor");
    expect(validateImport(null, LATER)).toEqual({ ok: false, error: "vacia" });
    expect(validateImport([], LATER)).toEqual({ ok: false, error: "vacia" });
    expect(validateImport({ v: 2 }, LATER)).toEqual({ ok: false, error: "sin_iniciar" });
    expect(validateImport({ ...s, company: "inventada" }, LATER)).toEqual({ ok: false, error: "empresa_desconocida" });
    expect(validateImport({ ...s, decisions: { ...s.decisions, "no-existe": { option: "a", at: 1 } } }, LATER)).toEqual({ ok: false, error: "decision_invalida" });
    const r = golden("repite-y-asciende");
    const first = Object.keys(r.decisions)[0];
    expect(first).toBeTruthy();
    expect(validateImport({ ...r, decisions: { ...r.decisions, [first]: { option: "zzz", at: 1 } } }, LATER)).toEqual({ ok: false, error: "decision_invalida" });
    const run0 = leg0();
    expect(validateImport({ ...run0.s, career: [{ ...run0.s.career[0], decisions: { "no-existe": { option: "a", at: 1 } } }] }, LATER)).toEqual({ ok: false, error: "decision_invalida" });
    expect(validateImport({ ...s, savedAt: LATER + 86_400_000 }, LATER)).toEqual({ ok: false, error: "fecha_futura" });
    const leg = golden("carrera-legendaria");
    expect(validateImport({ ...leg, career: [{ ...leg.career[0], xp: 9_999_999 }] }, LATER)).toEqual({ ok: false, error: "carrera_invalida" });
    expect(validateImport({ ...leg, career: [{ ...leg.career[0], company: "otra" }] }, LATER)).toEqual({ ok: false, error: "carrera_invalida" });
    expect(validateImport({ ...s, pad: "x".repeat(600_000) }, LATER)).toEqual({ ok: false, error: "muy_grande" });
  });
  it("una partida v1 (sin empresa) se lee como Botanas Cumbre, igual que siempre", () => {
    const s = golden("cumbre-mejor");
    const v1 = { ...s, v: 1 } as Record<string, unknown>;
    delete v1.company;
    const r = validateImport(v1, LATER);
    expect(r.ok && r.state.company).toBe("cumbre");
  });
});

describe("procedencia (legacy)", () => {
  it("cumbre/forja/brasa → variante fundacional, con reglas y versión de catálogo; la historia no se toca", () => {
    for (const id of ["cumbre-vencidos", "forja-azar", "brasa-peor"]) {
      const s = golden(id);
      const m = markLegacy(s, "00000000-0000-4000-8000-000000000001", LATER);
      expect(m.origin).toMatchObject({ kind: "importada_navegador", legacyCompanyId: s.company, companyVariantId: s.company, rulesVersion: LEGACY_RULES_VERSION, catalogMigrationVersion: CATALOG_VERSION, localSavedAt: s.savedAt });
      const { origin: _o, ...rest } = m;
      expect(rest).toEqual(s);
      expect(xpOf(m, s.savedAt)).toBe(xpOf(s, s.savedAt));
    }
  });
  it("migrate conserva la procedencia", () => {
    const m = markLegacy(golden("cumbre-mejor"), "00000000-0000-4000-8000-000000000001", LATER);
    expect(migrate(JSON.parse(JSON.stringify(m))).origin?.importId).toBe(m.origin!.importId);
  });
});

describe("ayuda para fusionar", () => {
  it("abre un correo a hola@metis.ceo con el resumen, sin correo ni teléfono del jugador", () => {
    const local = golden("cumbre-vencidos"), cloud = golden("forja-azar");
    const href = helpMailto(summaryOf({ ...local, settings: { ...local.settings, email: "secreto@x.com", phone: "+5281" } }), summaryOf(cloud));
    expect(href.startsWith("mailto:hola@metis.ceo?")).toBe(true);
    const body = decodeURIComponent(href.split("body=")[1]);
    expect(body).toContain("Botanas Cumbre");
    expect(body).toContain("Forja Norte");
    expect(body).not.toContain("secreto");
    expect(body).not.toContain("+5281");
  });
});
