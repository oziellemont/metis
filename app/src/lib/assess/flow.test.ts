/** Flujo completo de Assess con repositorio en memoria: empresa piloto → vacante → invitación → candidato → tablero. */
import { describe, it, expect } from "vitest";
import { answer, candidateView, consent, createVacancy, dashboard, invite, listForOwner, memoryRepo } from "./server";
import { caseOutcomes } from "./catalog";
import { assessEnabled } from "./http";

const pilot = { id: "u-piloto", email: "rh@empresa.mx" };
const other = { id: "u-otro", email: "otro@empresa.mx" };
const W = { finanzas: 2, personas: 3, liquidez: 1 };
const best = (caseId: string) => { const c = caseOutcomes("acero").find((x) => x.caseId === caseId)!; return c.options.find((o) => o.available)!.optionId; };

describe("Assess v1 · flujo", () => {
  it("apagado por omisión: solo ASSESS_ENABLED=1 lo prende", () => {
    expect(assessEnabled(undefined)).toBe(false);
    expect(assessEnabled("0")).toBe(false);
    expect(assessEnabled("true")).toBe(false);
    expect(assessEnabled("1")).toBe(true);
  });

  it("solo cuentas piloto crean vacantes; cada empresa ve solo lo suyo", async () => {
    const repo = memoryRepo([pilot.email]);
    expect(await createVacancy(repo, null, { title: "Gerente", industry: "acero", weights: W })).toMatchObject({ ok: false, status: 401 });
    expect(await createVacancy(repo, other, { title: "Gerente", industry: "acero", weights: W })).toMatchObject({ ok: false, status: 403 });
    const v = await createVacancy(repo, pilot, { title: "Gerente de planta", industry: "acero", weights: W });
    expect(v.ok && v.data.mode).toBe("piloto");
    const l = await listForOwner(repo, pilot);
    expect(l.ok && l.data.vacancies).toHaveLength(1);
    // Otra cuenta piloto no ve ni abre la vacante.
    const repo2Pilot = { id: "u-p2", email: "p2@x.mx" };
    const repoBoth = memoryRepo([pilot.email, repo2Pilot.email]);
    const v2 = await createVacancy(repoBoth, pilot, { title: "Gerente de planta", industry: "acero", weights: W });
    expect(await dashboard(repoBoth, repo2Pilot, v2.ok ? v2.data.id : "")).toMatchObject({ ok: false, status: 404 });
    expect(await invite(repoBoth, repo2Pilot, v2.ok ? v2.data.id : "", { label: "Intruso" })).toMatchObject({ ok: false, status: 404 });
  });

  it("candidato: aviso de piloto → casos → una respuesta por caso, sin duplicados → terminado → tablero con evidencia", async () => {
    const repo = memoryRepo([pilot.email]);
    const v = await createVacancy(repo, pilot, { title: "Gerente de planta", industry: "acero", weights: W });
    if (!v.ok) throw new Error("vacante");
    const inv = await invite(repo, pilot, v.data.id, { label: "Candidato A", email: "a@x.mx" });
    if (!inv.ok) throw new Error("invitación");
    const tok = inv.data.token;
    // En la base no queda el enlace.
    expect(JSON.stringify(repo.dump())).not.toContain(tok);

    const before = await candidateView(repo, tok);
    expect(before.ok && before.data.cases).toHaveLength(0); // sin aceptar el aviso no ve casos
    expect(await answer(repo, tok, { caseId: "op_refractario", optionId: "relinear", reasoning: "Primero la seguridad de la gente.", ms: 40_000 })).toMatchObject({ ok: false, status: 409 });
    await consent(repo, tok);
    const view = await candidateView(repo, tok);
    if (!view.ok) throw new Error("vista");
    expect(view.data.cases).toHaveLength(8);
    expect(view.data.notice).toMatch(/No usar para decidir contrataciones/);

    const ids = view.data.cases.map((c) => c.id);
    for (const [i, id] of ids.entries()) {
      const body = { caseId: id, optionId: best(id), reasoning: "Cuido a la gente y la caja; el volumen se recupera.", ms: 45_000 };
      const r = await answer(repo, tok, body);
      expect(r.ok && r.data.saved).toBe(true);
      if (i === 0) {
        // Doble clic / reintento: no duplica ni cambia la respuesta.
        const again = await answer(repo, tok, { ...body, optionId: caseOutcomes("acero").find((c) => c.caseId === id)!.options.filter((o) => o.available)[1].optionId });
        expect(again.ok && again.data.saved).toBe(false);
      }
    }
    expect(repo.dump().a).toHaveLength(8);
    expect(await answer(repo, tok, { caseId: ids[0], optionId: best(ids[0]), reasoning: "otra vez, otra vez", ms: 1 })).toMatchObject({ ok: false, error: "ya_terminado" });

    const d = await dashboard(repo, pilot, v.data.id);
    if (!d.ok) throw new Error("tablero");
    const row = d.data.rows[0];
    expect(row.status).toBe("terminado");
    expect(row.report.complete).toBe(true);
    expect(row.report.overall).not.toBeNull();
    expect(row.report.pilot).toBe(true);
    expect(row.report.evidence.map((e) => e.optionLabel).every(Boolean)).toBe(true);
  });

  it("enlaces inválidos o vencidos no abren nada", async () => {
    const repo = memoryRepo([pilot.email]);
    const v = await createVacancy(repo, pilot, { title: "Gerente de tienda", industry: "retail", weights: { finanzas: 1, personas: 2 } });
    if (!v.ok) throw new Error();
    const past = new Date(Date.now() - 20 * 86_400_000);
    const inv = await invite(repo, pilot, v.data.id, { label: "Candidata B" }, past);
    if (!inv.ok) throw new Error();
    expect(await candidateView(repo, inv.data.token)).toMatchObject({ ok: false, status: 410 });
    expect(await candidateView(repo, "x".repeat(32))).toMatchObject({ ok: false, status: 404 });
    expect(await candidateView(repo, "../../../etc/passwd")).toMatchObject({ ok: false, status: 404 });
  });

  it("límite de candidatos por vacante en el piloto", async () => {
    const repo = memoryRepo([pilot.email]);
    const v = await createVacancy(repo, pilot, { title: "Analista", industry: "retail", weights: { finanzas: 1, liquidez: 2 } });
    if (!v.ok) throw new Error();
    for (let i = 0; i < 30; i++) expect((await invite(repo, pilot, v.data.id, { label: `C${i + 10}` })).ok).toBe(true);
    expect((await invite(repo, pilot, v.data.id, { label: "Uno más" })).ok).toBe(false);
  });
});
