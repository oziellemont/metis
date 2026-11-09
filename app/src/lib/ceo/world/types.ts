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
export type Family = "clima" | "sismo" | "macro";
export const FAMILIES: readonly Family[] = ["clima", "sismo", "macro"];
export const FAMILY_LABEL: Readonly<Record<Family, string>> = Object.freeze({ clima: "Clima (huracanes y tormentas)", sismo: "Sismos", macro: "Economía (tasas y tipo de cambio)" });

/** Tipos de acontecimiento con reglas de impacto aprobadas. */
export type Kind = "ciclon" | "sismo";

/** Urgencia de la tarjeta en Hoy (B8). Nunca se copian urgencias de Protección Civil como si mêtis fuera autoridad. */
export type Urgency = "urgente" | "importante" | "informativa";

export interface SourceRef { name: string; url: string }

/**
 * Candidato que devuelve el servidor (/api/ceo/mundo) ya cruzado con la exposición de la plantilla.
 * Solo llegan candidatos con al menos una sede en zona; sin exposición no hay candidato.
 */
export interface WorldCandidate {
  src: "gdacs";
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
}

/** Episodio congelado dentro de la partida (GrowthLog.world). Es lo que sabía el jugador cuando llegó. */
export interface WorldEpisode {
  id: string;
  src: "gdacs" | "ejercicio";
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
}

/** Días simulados que un pronóstico puede quedar abierto antes de cerrarse sin daño confirmado. */
export const FORECAST_WINDOW = 8;
/** Días simulados para responder a un acontecimiento ya observado (sismo). */
export const OBSERVED_WINDOW = 5;
/** Máximo de episodios guardados por empresa. */
export const MAX_EPISODES = 60;
