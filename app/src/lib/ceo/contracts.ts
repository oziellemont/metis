/**
 * mêtis CEO · contratos de datos v3.2 (adenda §6.5). SOLO TIPOS: todavía no cambian el motor.
 *
 * Separan cuatro cosas que hoy viven mezcladas en `CompanyPack` y `CeoState`:
 *   IndustryPack   → lógica económica del sector (igual para todas sus empresas)
 *   NarrativeArc   → trayectoria formativa del sector (actos, dilemas, objetivos de aprendizaje)
 *   CompanyVariant → identidad particular (nombre, elenco, cultura, datos iniciales, ≥1 consecuencia distinta)
 *   CareerRun      → la partida real de una persona, con versiones congeladas
 * y la evidencia de aprendizaje (SkillEvidence), que nunca sale de XP ni de terminar empresas.
 *
 * Reglas que vigilan las pruebas cuando se implementen (Fase 1.8–1.9):
 *  - Una variante no altera reglas universales por su nombre.
 *  - Industria, empresa, carrera y dominio son independientes: no hay ascenso por XP.
 *  - Una CareerRun iniciada no cambia de reglas en caliente (rulesVersion congelado).
 *  - Las Executive Rotations producen SkillEvidence, nunca cambios en KPIs, relaciones ni cron de la empresa de casa.
 */
import type { CatalogStatus } from "./catalog";
import type { Competency } from "./mastery";
import type { KpiKey } from "./types";

/** Versión semántica simple: "1.0.0". */
export type Version = string;

export interface IndustryPack {
  id: string;                      // = CatalogIndustry.id
  version: Version;
  status: CatalogStatus;
  vocabulary: { term: string; def: string }[];
  revenueModel: string;            // cómo gana dinero el sector
  costStructure: string;           // costos fijos/variables típicos
  ratios: { id: string; label: string; healthy: [number, number] }[];
  constraints: string[];           // regulación, estacionalidad, capacidad…
  /** Cómo se leen los 5 KPIs comunes en este sector (internamente siempre son los mismos). */
  kpiLabel: Record<KpiKey, string>;
  kpiHint: Record<KpiKey, string>;
  /** Ecuaciones mínimas que hacen comprensibles los KPIs (texto revisado por expertos). */
  equations: { kpi: KpiKey; explains: string }[];
  reviewedBy?: string[];           // revisión experta antes de `available`
}

export interface ArcEpisode {
  id: string;
  act: number;
  dilemma: string;
  learningObjectives: Competency[];
  dependsOn?: string[];            // episodios previos
  delayedConsequences?: string[];  // ids de efectos diferidos
}

export interface NarrativeArc {
  id: string;
  industryId: string;
  version: Version;
  acts: { n: number; title: string }[];
  functionalRoles: string[];       // «Finanzas», «Comercial»… (cada variante pone nombres y voces)
  episodes: ArcEpisode[];
  strategicProject: string;
  board: { seats: number; criteria: string[] };
}

export interface CompanyVariant {
  companyVariantId: string;        // = CatalogCompany.id; nunca depende del nombre
  industryId: string;
  arcId: string;
  version: Version;
  name: string;
  description: string;
  size: "pequeña" | "mediana" | "grande";
  culture: string;
  board: string[];
  cast: { role: string; name: string; voice: string }[];
  initialTies: { a: string; b: string; kind: "alianza" | "influye" | "tension" }[];
  mainCustomer: string;
  tensions: string[];
  kpiStart: Record<KpiKey, number>;
  /** Variantes editoriales de episodios del arco: al menos UNA consecuencia distinta a sus hermanas. */
  episodeOverrides: Record<string, { text?: string; consequenceId?: string }>;
  /** Misma dificultad inicial y objetivos equivalentes entre variantes de un sector. */
  difficulty: 1 | 2 | 3;
}

export type CareerRunStatus = "active" | "paused" | "completed" | "abandoned";

export interface CareerRun {
  runId: string;
  userId: string;                  // siempre el verificado por el servidor
  homeIndustryId: string;
  homeCompanyVariantId: string;
  industryPackVersion: Version;
  arcVersion: Version;
  companyVariantVersion: Version;
  rulesVersion: number;            // congelado al iniciar
  worldSeed: string;
  startedAt: number;
  simulatedNow: number;            // tiempo simulado (separado del reloj del servidor)
  status: CareerRunStatus;
  /** Partidas que venían de antes de la v3: de qué empresa fundacional y con qué migración de catálogo. */
  legacyCompanyId?: string;
  catalogMigrationVersion?: number;
}

export type EvidenceSource = "decision" | "rotation" | "board" | "crisis" | "workbench";

export interface SkillEvidence {
  id: string;
  userId: string;
  runId: string | null;            // null en rotaciones (no pertenecen a la partida de casa)
  competency: Competency;
  source: EvidenceSource;
  industryId: string;              // dónde se demostró (para medir transferencia)
  /** 0..1, calidad del razonamiento; NO el puntaje de una opción. */
  quality: number;
  confidence: number;              // cuánto pesa (depende de la fuente y de la revisión)
  at: number;
  rulesVersion: number;
}

/** Executive Rotation: misión corta en otra industria. Nunca toca la empresa de casa. */
export interface ExecutiveRotation {
  id: string;
  fromIndustryId: string;
  toIndustryId: string;
  competency: Competency;
  minutes: [number, number];       // 2–6
  /** Garantía de contrato: siempre false. Si algún día es true, las pruebas deben fallar. */
  affectsHomeRun: false;
}
