// Solo servidor (usa la llave de servicio). Tablas assess_* en el esquema public: aparte de MÊTIS CEO y de Align.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE } from "@/lib/supabase/env";
import type { AnswerRow, CandidateRow, Repo, VacancyRow } from "./server";

let client: SupabaseClient | null = null;
function sb(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) return null;
  client ??= createClient(SUPABASE_URL, SUPABASE_SERVICE, { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: "public" } });
  return client;
}

export class AssessDbError extends Error {
  constructor(public code: string) { super(code); }
}
const check = <T>(r: { data: T; error: { code?: string; message: string } | null }): T => {
  if (r.error) throw new AssessDbError(r.error.code === "42P01" || r.error.code === "PGRST205" ? "falta_migracion_0024" : "error_base");
  return r.data;
};

export function supabaseAssessRepo(): Repo | null {
  const db = sb();
  if (!db) return null;
  return {
    isPilot: async (email) => (check(await db.from("assess_pilots").select("email").eq("email", email).limit(1)) ?? []).length > 0,
    listVacancies: async (owner) => (check(await db.from("assess_vacancies").select("*").eq("owner", owner).order("created_at", { ascending: false })) ?? []) as VacancyRow[],
    getVacancy: async (id) => (check(await db.from("assess_vacancies").select("*").eq("id", id).maybeSingle()) ?? null) as VacancyRow | null,
    insertVacancy: async (v) => check(await db.from("assess_vacancies").insert(v).select("*").single()) as VacancyRow,
    listCandidates: async (vid) => (check(await db.from("assess_candidates").select("*").eq("vacancy_id", vid).order("created_at")) ?? []) as CandidateRow[],
    countCandidates: async (vid) => { const r = await db.from("assess_candidates").select("id", { count: "exact", head: true }).eq("vacancy_id", vid); check({ data: null, error: r.error }); return r.count ?? 0; },
    insertCandidate: async (c) => check(await db.from("assess_candidates").insert(c).select("*").single()) as CandidateRow,
    candidateByHash: async (h) => (check(await db.from("assess_candidates").select("*").eq("token_hash", h).maybeSingle()) ?? null) as CandidateRow | null,
    updateCandidate: async (id, patch) => { check(await db.from("assess_candidates").update(patch).eq("id", id)); },
    listAnswers: async (ids) => (ids.length ? ((check(await db.from("assess_answers").select("*").in("candidate_id", ids)) ?? []) as AnswerRow[]) : []),
    insertAnswerOnce: async (a) => {
      const r = await db.from("assess_answers").upsert(a, { onConflict: "candidate_id,case_id", ignoreDuplicates: true }).select("candidate_id");
      return (check(r) ?? []).length > 0;
    },
  };
}
