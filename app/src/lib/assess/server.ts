/**
 * MÊTIS Assess v1 · flujo de la empresa y del candidato (lógica pura sobre un repositorio).
 *
 *  - Solo cuentas piloto (tabla assess_pilots, la llena Oziel por SQL) pueden crear vacantes e invitar.
 *  - Cada empresa ve solo sus vacantes y sus candidatos.
 *  - El candidato entra con un enlace único; en la base solo se guarda la huella del enlace.
 *  - Cada caso se responde una sola vez: reintentos o doble clic no duplican ni cambian la respuesta.
 *  - Todas las vacantes nacen en modo «piloto» (la base lo exige con un check): no hay modo de contratación real.
 *  - No toca MÊTIS CEO: ni partidas, ni jugadores, ni avisos.
 */
import { INDUSTRIES, caseViews, measurable, COMPETENCIES, PILOT_NOTICE, type Industry, type CaseView, type Competency } from "./catalog";
import { cleanAnswer, cleanCandidate, cleanVacancy, compare, isTokenShape, newToken, scoreCandidate, tokenHash, MAX_CANDIDATES, type Answer, type Report, type Weights } from "./model";

export const TOKEN_DAYS = 14;

export interface VacancyRow { id: string; owner: string; title: string; industry: Industry; weights: Weights; mode: "piloto"; created_at: string }
export interface CandidateRow { id: string; vacancy_id: string; label: string; email: string | null; token_hash: string; status: "invitado" | "en_curso" | "terminado"; consent_at: string | null; finished_at: string | null; expires_at: string; created_at: string }
export interface AnswerRow { candidate_id: string; case_id: string; option_id: string; reasoning: string; ms: number; created_at: string }

export interface Repo {
  isPilot(email: string): Promise<boolean>;
  listVacancies(owner: string): Promise<VacancyRow[]>;
  getVacancy(id: string): Promise<VacancyRow | null>;
  insertVacancy(v: Omit<VacancyRow, "id" | "created_at">): Promise<VacancyRow>;
  listCandidates(vacancyId: string): Promise<CandidateRow[]>;
  countCandidates(vacancyId: string): Promise<number>;
  insertCandidate(c: Omit<CandidateRow, "id" | "created_at">): Promise<CandidateRow>;
  candidateByHash(hash: string): Promise<CandidateRow | null>;
  updateCandidate(id: string, patch: Partial<Pick<CandidateRow, "status" | "consent_at" | "finished_at">>): Promise<void>;
  listAnswers(candidateIds: string[]): Promise<AnswerRow[]>;
  /** Inserta si no existe (candidate_id, case_id). Devuelve false si ya estaba. */
  insertAnswerOnce(a: Omit<AnswerRow, "created_at">): Promise<boolean>;
}

export type Result<T> = { ok: true; data: T } | { ok: false; status: number; error: string };
const fail = (status: number, error: string): { ok: false; status: number; error: string } => ({ ok: false, status, error });
const isUuid = (x: unknown): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x);

export interface User { id: string; email: string | null }

async function gate(repo: Repo, user: User | null): Promise<Result<User>> {
  if (!user) return fail(401, "sin_sesion");
  if (!user.email || !(await repo.isPilot(user.email.toLowerCase()))) return fail(403, "no_piloto");
  return { ok: true, data: user };
}

export function meta() {
  return {
    notice: PILOT_NOTICE,
    industries: (Object.keys(INDUSTRIES) as Industry[]).map((id) => ({ id, label: INDUSTRIES[id].label, company: INDUSTRIES[id].company, cases: INDUSTRIES[id].caseIds.length, competencies: measurable(id) })),
    competencies: (Object.keys(COMPETENCIES) as Competency[]).map((k) => ({ id: k, ...COMPETENCIES[k] })),
  };
}

// ───────────────────────────────────────────────────────── empresa
export async function listForOwner(repo: Repo, user: User | null) {
  const g = await gate(repo, user); if (!g.ok) return g;
  const vs = await repo.listVacancies(g.data.id);
  const rows = await Promise.all(vs.map(async (v) => ({ ...publicVacancy(v), candidates: await repo.countCandidates(v.id) })));
  return { ok: true as const, data: { vacancies: rows, meta: meta() } };
}

export async function createVacancy(repo: Repo, user: User | null, body: unknown): Promise<Result<ReturnType<typeof publicVacancy>>> {
  const g = await gate(repo, user); if (!g.ok) return g;
  const c = cleanVacancy(body); if (!c.ok) return fail(400, c.error);
  const v = await repo.insertVacancy({ owner: g.data.id, title: c.v.title, industry: c.v.industry, weights: c.v.weights, mode: "piloto" });
  return { ok: true, data: publicVacancy(v) };
}

const publicVacancy = (v: VacancyRow) => ({ id: v.id, title: v.title, industry: v.industry, industryLabel: INDUSTRIES[v.industry].label, company: INDUSTRIES[v.industry].company, weights: v.weights, mode: v.mode, createdAt: v.created_at });

async function ownVacancy(repo: Repo, user: User | null, id: unknown): Promise<Result<VacancyRow>> {
  const g = await gate(repo, user); if (!g.ok) return g;
  if (!isUuid(id)) return fail(404, "no_existe");
  const v = await repo.getVacancy(id);
  if (!v || v.owner !== g.data.id) return fail(404, "no_existe");
  return { ok: true, data: v };
}

export async function invite(repo: Repo, user: User | null, vacancyId: unknown, body: unknown, now = new Date()): Promise<Result<{ id: string; label: string; token: string; expiresAt: string }>> {
  const v = await ownVacancy(repo, user, vacancyId); if (!v.ok) return v;
  const c = cleanCandidate(body); if (!c.ok) return fail(400, c.error);
  if ((await repo.countCandidates(v.data.id)) >= MAX_CANDIDATES) return fail(400, `Máximo ${MAX_CANDIDATES} candidatos por vacante en el piloto.`);
  const t = newToken();
  const expires = new Date(now.getTime() + TOKEN_DAYS * 86_400_000).toISOString();
  const row = await repo.insertCandidate({ vacancy_id: v.data.id, label: c.label, email: c.email, token_hash: t.hash, status: "invitado", consent_at: null, finished_at: null, expires_at: expires });
  // El enlace se muestra UNA vez a la empresa; después solo existe su huella.
  return { ok: true, data: { id: row.id, label: row.label, token: t.token, expiresAt: expires } };
}

export interface DashboardRow { id: string; label: string; status: CandidateRow["status"]; finishedAt: string | null; expiresAt: string; report: Report }
export async function dashboard(repo: Repo, user: User | null, vacancyId: unknown): Promise<Result<{ vacancy: ReturnType<typeof publicVacancy>; rows: DashboardRow[]; meta: ReturnType<typeof meta> }>> {
  const v = await ownVacancy(repo, user, vacancyId); if (!v.ok) return v;
  const cands = await repo.listCandidates(v.data.id);
  const answers = await repo.listAnswers(cands.map((c) => c.id));
  const rows = cands.map((c): DashboardRow => {
    const mine: Answer[] = answers.filter((a) => a.candidate_id === c.id).map((a) => ({ caseId: a.case_id, optionId: a.option_id, reasoning: a.reasoning, ms: a.ms }));
    return { id: c.id, label: c.label, status: c.status, finishedAt: c.finished_at, expiresAt: c.expires_at, report: scoreCandidate(v.data.industry, v.data.weights, mine) };
  });
  return { ok: true, data: { vacancy: publicVacancy(v.data), rows: compare(rows), meta: meta() } };
}

// ───────────────────────────────────────────────────────── candidato
async function byToken(repo: Repo, token: unknown, now: Date): Promise<Result<{ c: CandidateRow; v: VacancyRow }>> {
  if (!isTokenShape(token)) return fail(404, "enlace_invalido");
  const c = await repo.candidateByHash(tokenHash(token));
  if (!c) return fail(404, "enlace_invalido");
  if (c.status !== "terminado" && new Date(c.expires_at).getTime() < now.getTime()) return fail(410, "enlace_vencido");
  const v = await repo.getVacancy(c.vacancy_id);
  if (!v) return fail(404, "enlace_invalido");
  return { ok: true, data: { c, v } };
}

export interface CandidateView { title: string; industryLabel: string; company: string; summary: string; notice: string; status: CandidateRow["status"]; consent: boolean; cases: CaseView[]; answered: string[] }
export async function candidateView(repo: Repo, token: unknown, now = new Date()): Promise<Result<CandidateView>> {
  const r = await byToken(repo, token, now); if (!r.ok) return r;
  const { c, v } = r.data;
  const answered = (await repo.listAnswers([c.id])).map((a) => a.case_id);
  const def = INDUSTRIES[v.industry];
  // El candidato nunca ve puntajes, posturas ni consecuencias: solo los casos.
  return { ok: true, data: { title: v.title, industryLabel: def.label, company: def.company, summary: def.summary, notice: PILOT_NOTICE, status: c.status, consent: !!c.consent_at, cases: c.consent_at ? caseViews(v.industry) : [], answered } };
}

export async function consent(repo: Repo, token: unknown, now = new Date()): Promise<Result<{ ok: true }>> {
  const r = await byToken(repo, token, now); if (!r.ok) return r;
  if (!r.data.c.consent_at) await repo.updateCandidate(r.data.c.id, { consent_at: now.toISOString(), status: "en_curso" });
  return { ok: true, data: { ok: true } };
}

export async function answer(repo: Repo, token: unknown, body: unknown, now = new Date()): Promise<Result<{ saved: boolean; answered: number; total: number; finished: boolean }>> {
  const r = await byToken(repo, token, now); if (!r.ok) return r;
  const { c, v } = r.data;
  if (!c.consent_at) return fail(409, "falta_consentimiento");
  if (c.status === "terminado") return fail(409, "ya_terminado");
  const a = cleanAnswer(v.industry, body); if (!a.ok) return fail(400, a.error);
  const saved = await repo.insertAnswerOnce({ candidate_id: c.id, case_id: a.a.caseId, option_id: a.a.optionId, reasoning: a.a.reasoning, ms: a.a.ms });
  const answered = new Set((await repo.listAnswers([c.id])).map((x) => x.case_id)).size;
  const total = INDUSTRIES[v.industry].caseIds.length;
  const finished = answered >= total;
  if (finished) await repo.updateCandidate(c.id, { status: "terminado", finished_at: now.toISOString() });
  return { ok: true, data: { saved, answered, total, finished } };
}

// ───────────────────────────────────────────────────────── repositorio en memoria (pruebas y modo demo local)
export function memoryRepo(pilots: string[] = []): Repo & { dump: () => { v: VacancyRow[]; c: CandidateRow[]; a: AnswerRow[] } } {
  const V: VacancyRow[] = [], C: CandidateRow[] = [], A: AnswerRow[] = [];
  let n = 0;
  const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
  const ts = () => new Date().toISOString();
  return {
    isPilot: async (e) => pilots.includes(e),
    listVacancies: async (o) => V.filter((v) => v.owner === o),
    getVacancy: async (i) => V.find((v) => v.id === i) ?? null,
    insertVacancy: async (v) => { const r = { ...v, id: id(), created_at: ts() }; V.push(r); return r; },
    listCandidates: async (vid) => C.filter((c) => c.vacancy_id === vid),
    countCandidates: async (vid) => C.filter((c) => c.vacancy_id === vid).length,
    insertCandidate: async (c) => { const r = { ...c, id: id(), created_at: ts() }; C.push(r); return r; },
    candidateByHash: async (h) => C.find((c) => c.token_hash === h) ?? null,
    updateCandidate: async (i, p) => { const c = C.find((x) => x.id === i); if (c) Object.assign(c, p); },
    listAnswers: async (ids) => A.filter((a) => ids.includes(a.candidate_id)),
    insertAnswerOnce: async (a) => { if (A.some((x) => x.candidate_id === a.candidate_id && x.case_id === a.case_id)) return false; A.push({ ...a, created_at: ts() }); return true; },
    dump: () => ({ v: V, c: C, a: A }),
  };
}
