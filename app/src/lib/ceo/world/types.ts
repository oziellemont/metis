/**
 * mêtis CEO · World Events · tipos.
 *
 * Principio: «Evento real verificado» describe el mundo; «impacto en tu empresa» es una SIMULACIÓN condicionada por la
 * exposición de la empresa ficticia y por las decisiones del jugador. Nunca se afirma que la empresa sufrió el daño real.
 *
 * Dos relojes: `observedAt` (hora real de la fuente) y `day` (día simulado del periodo abierto en que se congela el
 * episodio). Un episodio se asigna siempre al periodo abierto; nunca reescribe meses cerrados.
 */

/** Zona de una sede frente al acontecimiento (de menor a mayor). */
export type Zone = "ninguna" | "verde" | "naranja" | "roja";
export const ZONES: readonly Zone[] = ["ninguna", "verde", "naranja", "roja"];
export const zoneRank = (z: Zone): number => ZONES.indexOf(z);
export const maxZone = (a: Zone, b: Zone): Zone => (zoneRank(a) >= zoneRank(b) ? a : b);

/** Familias con apagado propio (interruptor por familia y preferencia del jugador). */
export type Family = "clima" | "sismo" | "macro" | "comercio" | "gobierno" | "noticias";
export const FAMILIES: readonly Family[] = ["clima", "sismo", "macro", "comercio", "gobierno", "noticias"];
export const FAMILY_LABEL: Readonly<Record<Family, string>> = Object.freeze({
  clima: "Clima (huracanes, tormentas e inundaciones)", sismo: "Sismos", macro: "Economía (tasas y tipo de cambio)", comercio: "Comercio exterior y aranceles",
  gobierno: "Gobierno y regulación (energía, combustibles, impuestos, trabajo)", noticias: "Noticias generales (bloqueos, huelgas, conflictos)",
});
export const isFamily = (x: unknown): x is Family => (FAMILIES as readonly unknown[]).includes(x);

/** Tipos de acontecimiento con reglas de impacto aprobadas. ciclon, sismo e inundacion son geográficos (zonas por sede). */
export type Kind = "ciclon" | "sismo" | "inundacion" | "tipo_cambio" | "tasa" | "arancel";
export const GEO_KINDS: readonly Kind[] = ["ciclon", "sismo", "inundacion"];
export const KINDS: readonly Kind[] = ["ciclon", "sismo", "inundacion", "tipo_cambio", "tasa", "arancel"];
export const isGeo = (k: Kind): boolean => GEO_KINDS.includes(k);
/** Fuentes oficiales (y el ejercicio de prueba). */
export type Src = "gdacs" | "dof" | "fr" | "ejercicio";
export const SRCS: readonly Src[] = ["gdacs", "dof", "fr", "ejercicio"];

/**
 * Datos verificados de un acontecimiento no geográfico (lo que se congeló al abrir el episodio).
 *  - fx: tipo de cambio FIX (pesos por dólar) publicado en el DOF, de `since` a `until`.
 *  - tasa: TIIE de fondeo (puntos porcentuales) de `since` a `until`.
 *  - arancel: medida oficial (`rule` aprobada), arancel `from`→`to` (0.35 = 35 %), fracciones `hs` (4 dígitos) y fecha
 *    de vigencia `effective`. Solo se abre caso si ya está vigente.
 */
export interface Facts { t: "fx" | "tasa" | "arancel"; from: number; to: number; since: string; until: string; rule?: string; effective?: string; hs?: string[] }

/** Urgencia de la tarjeta en Hoy (B8). Nunca se copian urgencias de Protección Civil como si mêtis fuera autoridad. */
export type Urgency = "urgente" | "importante" | "informativa";

export interface SourceRef { name: string; url: string }

/**
 * Candidato que devuelve el servidor (/api/ceo/mundo) ya cruzado con la exposición de la plantilla.
 * Solo llegan candidatos con al menos una sede en zona; sin exposición no hay candidato.
 */
export interface WorldCandidate {
  src: Exclude<Src, "ejercicio">;
  /** Identificador oficial del acontecimiento en la fuente (p. ej. «tc1001346»). */
  ev: string;
  /** Revisión mayor para esta empresa: la zona más alta de sus sedes (2 = naranja, 3 = roja). */
  rev: number;
  family: Family;
  kind: Kind;
  name: string;
  /** pronóstico (puede cambiar) u observado (ya ocurrió). */
  status: "pronostico" | "observado";
  severity: string;
  source: SourceRef;
  also?: SourceRef;
  observedAt: number;
  /** Zona por sede con lo que se sabe hoy (observado + pronóstico). */
  sites: Record<string, Zone>;
  /** Zona por sede SOLO con lo observado (lo que ya pasó). */
  observed: Record<string, Zone>;
  /** La fuente ya lo da por terminado. */
  ended: boolean;
  urgency: Urgency;
  /** Solo acontecimientos no geográficos. */
  facts?: Facts;
}

/** Episodio congelado dentro de la partida (GrowthLog.world). Es lo que sabía el jugador cuando llegó. */
export interface WorldEpisode {
  id: string;
  src: Src;
  ev: string;
  rev: number;
  family: Family;
  kind: Kind;
  mode: "real" | "ejercicio";
  name: string;
  status: "pronostico" | "observado";
  severity: string;
  source: SourceRef;
  also?: SourceRef;
  observedAt: number;
  /** Hora real en que se congeló. */
  at: number;
  /** Día simulado (periodo abierto) en que se congeló. */
  day: number;
  sites: Record<string, Zone>;
  /** Cierre del pronóstico con lo observado (acción «end» del diario). */
  end?: { day: number; at: number; sites: Record<string, Zone> };
  /** Solo ejercicios hipotéticos: desenlace guionado, congelado desde el inicio. */
  script?: { inDays: number; sites: Record<string, Zone> };
  /** Solo acontecimientos no geográficos (tipo de cambio, tasa, arancel). */
  facts?: Facts;
  /**
   * Versión de las reglas de consecuencias con que se abrió (ausente = 1). Se congela al abrir: una partida con
   * episodios v1 se reconstruye siempre igual. v2 = impacto inevitable + parte evitable según la decisión + costo y
   * consecuencias futuras (ver world/climate2.ts y growth/session.ts · externalOf).
   */
  rv?: number;
}
/** Versión de reglas que reciben los episodios nuevos. */
export const RULES_V = 2;
/**
 * Solo dentro de la reconstrucción contrafactual (nunca se guarda): aplicar únicamente la parte inevitable del
 * impacto, sin la decisión del jugador. Así se separa lo que no dependía de nadie de lo que dependió de la decisión.
 */
export type ReplayEpisode = WorldEpisode & { only?: "inevitable" };

/** Días simulados que un pronóstico puede quedar abierto antes de cerrarse sin daño confirmado. */
export const FORECAST_WINDOW = 8;
/** Días simulados para responder a un acontecimiento ya observado (sismo). */
export const OBSERVED_WINDOW = 5;
/** Días simulados para responder a un dato económico o una medida comercial; ese día empieza el efecto. */
export const MACRO_WINDOW = 5;
/** Máximo de episodios guardados por empresa. */
export const MAX_EPISODES = 60;
