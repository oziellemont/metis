/**
 * MÊTIS 2.0 · Matriz curricular: tipos.
 *
 * Por cada habilidad del catálogo se escribe qué debe saber hacer la persona en cada tramo de la ruta,
 * desde el tramo en que la habilidad aparece hasta «Dirigir y profundizar». La exigencia sube por lo que
 * se pide hacer (reconocer, aplicar, analizar, integrar, transferir, dirigir), no por usar palabras más difíciles.
 */
import type { AcademyId, Demand, FormatId } from "../academias";

/** Lo que se enseña en el Nivel 1 de una habilidad: fundamentos reales de negocio. */
export interface Basics {
  /** Vocabulario que hay que entender y usar bien. */
  terms: string[];
  /** Documentos que hay que reconocer y saber para qué sirven. */
  documents?: string[];
  /** Indicadores que hay que saber leer. */
  indicators?: string[];
}

export interface SkillPlan {
  skill: string;
  /** Solo en habilidades que empiezan en el Nivel 1. */
  basics?: Basics;
  /** Qué debe saber hacer en cada tramo. Una frase que empieza con verbo. */
  steps: Partial<Record<Demand, string>>;
}

/** Ejemplo de actividad evaluable. Sirve de modelo para escribir y revisar el contenido de cada nivel. */
export interface ActivityExample {
  id: string;
  academy: AcademyId;
  level: Demand;
  format: FormatId;
  /** La primera es la principal y pertenece a `academy`. Las demás pueden ser de hasta dos academias más. */
  skills: string[];
  title: string;
  /** Situación empresarial concreta: quién, dónde, qué pasa. */
  situation: string;
  /** Qué se le pide a la persona. */
  ask: string;
  /** Qué respuesta cuenta como evidencia. */
  evidence: string;
  /** Industrias del ejemplo. En «Transferir» son al menos dos. */
  contexts: string[];
}
