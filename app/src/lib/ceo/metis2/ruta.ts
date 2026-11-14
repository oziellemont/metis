/**
 * MÊTIS 2.0 · Regla del camino (entrega 2.3, primera versión; Directiva v1.1).
 *
 * Decide qué se ve en Hoy como «Tu siguiente paso», cuáles son las dos estaciones que siguen y en qué orden aparecen
 * las lecciones dentro de cada academia. Hoy y Academy usan esta misma regla. Lógica pura, sin React ni navegador.
 *
 * Reglas (versión 1):
 *  1. Primero lo que ya empezaste y se puede retomar (un caso ejecutivo abierto).
 *  2. Después los casos que esperan decisión, por plazo, y los casos ejecutivos que ya llegaron.
 *  3. Después las lecciones sin terminar: primero las que no tienen un prerrequisito pendiente, luego las de las
 *     academias de tus temas, luego alternando academias, luego la de menor exigencia y, al final, el orden fijo
 *     del catálogo. Para ver las dos siguientes se simula que terminas la actual; eso no marca nada como hecho.
 *  4. Si hay menos de tres pasos, se muestran menos. No hay pasos de relleno ni candados falsos.
 *
 * Sin candados: las lecciones son teoría y la teoría nunca se bloquea. Un prerrequisito pendiente solo se nombra
 * («Conviene antes: …») y ordena el camino; no impide abrir nada. Nada depende del XP, de la racha ni de esperar.
 * Solo entra contenido publicado para todas las cuentas: las experiencias en revisión no pasan por aquí.
 */
import { LESSONS } from "../lessons";
import { academyById, skillById, type AcademyId } from "./academias";
import { tagOf } from "./clasificacion";

export const RUTA_VERSION = 1;

export type PasoKind = "caso_ejecutivo" | "caso" | "leccion";

export interface Paso {
  /** Identificador estable entre sesiones: tipo y pieza. */
  key: string;
  kind: PasoKind;
  id: string;
  title: string;
  academy?: AcademyId;
  href: string;
  cta: "Empezar" | "Continuar";
  /** Una línea corta: academia y duración, o academia y plazo. */
  meta: string;
  /** Prerrequisito que conviene trabajar antes. Solo informa: no bloquea. */
  conviene?: string;
}

export interface LeccionRuta { id: string; title: string; minutes: number; skills: string[]; academy: AcademyId; level: number; order: number }

/** Las lecciones publicadas, con su clasificación. Las que no tienen clasificación no entran al camino. */
export const LECCIONES_RUTA: LeccionRuta[] = LESSONS.flatMap((l, order) => {
  const t = tagOf("leccion", l.id);
  return t ? [{ id: l.id, title: l.title, minutes: l.minutes, skills: t.skills, academy: t.academy, level: t.level, order }] : [];
});

export interface RutaInput {
  /** Casos que esperan decisión, ya en orden de plazo. */
  casos?: { id: string; subject: string; academy?: AcademyId; due: string }[];
  /** Casos ejecutivos que ya llegaron y no se han cerrado. */
  episodios?: { id: string; subject: string; minutes: number; academy?: AcademyId; started: boolean }[];
  /** Lecciones terminadas (id → fecha). */
  hechas: Record<string, number>;
  /** Academias de los temas que la persona eligió. */
  intereses?: readonly AcademyId[];
  /** Academia de lo último que terminó, para alternar. */
  ultimaAcademia?: AcademyId;
  lecciones?: readonly LeccionRuta[];
}

const nameOf = (a?: AcademyId) => (a ? academyById(a).name : "");
const join = (...xs: (string | undefined)[]) => xs.filter(Boolean).join(" · ");

/** Habilidades que alguna lección enseña: solo esas pueden quedar pendientes como prerrequisito. */
const taught = (ls: readonly LeccionRuta[]) => new Set(ls.flatMap((l) => l.skills));

/** Prerrequisitos de la habilidad principal que se enseñan en Academy y aún no están trabajados. */
function pendientes(l: LeccionRuta, cubiertas: Set<string>, enseñadas: Set<string>): string[] {
  return (skillById(l.skills[0])?.pre ?? []).filter((p) => enseñadas.has(p) && !cubiertas.has(p) && !l.skills.includes(p));
}

/** Orden de las lecciones sin terminar según la regla 3. */
export function ordenLecciones(x: Pick<RutaInput, "hechas" | "intereses" | "ultimaAcademia" | "lecciones">): { leccion: LeccionRuta; conviene?: string }[] {
  const all = x.lecciones ?? LECCIONES_RUTA;
  const enseñadas = taught(all);
  const cubiertas = new Set(all.filter((l) => x.hechas[l.id]).flatMap((l) => l.skills));
  const mias = new Set(x.intereses ?? []);
  let resto = all.filter((l) => !x.hechas[l.id]);
  let prev = x.ultimaAcademia;
  const out: { leccion: LeccionRuta; conviene?: string }[] = [];
  while (resto.length) {
    const score = (l: LeccionRuta) => [pendientes(l, cubiertas, enseñadas).length ? 1 : 0, mias.size && !mias.has(l.academy) ? 1 : 0, l.academy === prev ? 1 : 0, l.level, l.order];
    const pick = resto.slice().sort((a, b) => {
      const sa = score(a), sb = score(b);
      for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return sa[i] - sb[i];
      return 0;
    })[0];
    const p = pendientes(pick, cubiertas, enseñadas)[0];
    out.push({ leccion: pick, conviene: p ? skillById(p)?.name : undefined });
    // Se simula que la termina para ordenar las siguientes; no se marca nada como hecho.
    pick.skills.forEach((s) => cubiertas.add(s));
    prev = pick.academy;
    resto = resto.filter((l) => l.id !== pick.id);
  }
  return out;
}

/** El camino completo, en orden. */
export function rutaCompleta(x: RutaInput): Paso[] {
  const eps = x.episodios ?? [];
  const ep = (e: (typeof eps)[number]): Paso => ({ key: `episodio:${e.id}`, kind: "caso_ejecutivo", id: e.id, title: e.subject, academy: e.academy, href: `/ceo/episodio/${e.id}`, cta: e.started ? "Continuar" : "Empezar", meta: join(nameOf(e.academy), `${e.minutes} min`) });
  const out: Paso[] = [
    ...eps.filter((e) => e.started).map(ep),
    ...(x.casos ?? []).map((c): Paso => ({ key: `caso:${c.id}`, kind: "caso", id: c.id, title: c.subject, academy: c.academy, href: `/ceo/caso/${c.id}`, cta: "Empezar", meta: join(nameOf(c.academy), `vence en ${c.due}`) })),
    ...eps.filter((e) => !e.started).map(ep),
    ...ordenLecciones(x).map(({ leccion: l, conviene }): Paso => ({ key: `leccion:${l.id}`, kind: "leccion", id: l.id, title: l.title, academy: l.academy, href: `/ceo/academy/${l.id}`, cta: "Empezar", meta: join(nameOf(l.academy), `${l.minutes} min`), ...(conviene ? { conviene } : {}) })),
  ];
  // Sin duplicados, por si una pieza llega dos veces.
  const seen = new Set<string>();
  return out.filter((p) => (seen.has(p.key) ? false : (seen.add(p.key), true)));
}

/** Lo que muestra Hoy: el paso actual y hasta dos siguientes. */
export function caminoDelDia(x: RutaInput, siguientes = 2): { version: number; actual: Paso | null; siguientes: Paso[] } {
  const r = rutaCompleta(x);
  return { version: RUTA_VERSION, actual: r[0] ?? null, siguientes: r.slice(1, 1 + siguientes) };
}

/** Lo último que la persona terminó: lección, caso o caso ejecutivo. */
export function ultimaCompletada<T extends { at: number }>(xs: readonly T[]): T | null {
  return xs.reduce<T | null>((m, x) => (x.at > 0 && (!m || x.at > m.at) ? x : m), null);
}

export const DIAS_REPASO = 3;

/** Repaso recomendado: la lección terminada hace más tiempo, si fue hace al menos tres días. Sin datos, nada. */
export function repasoRecomendado(hechas: Record<string, number>, now: number, lecciones: readonly LeccionRuta[] = LECCIONES_RUTA): LeccionRuta | null {
  const viejas = lecciones.filter((l) => hechas[l.id] && now - hechas[l.id] >= DIAS_REPASO * 86_400_000);
  return viejas.sort((a, b) => hechas[a.id] - hechas[b.id] || a.order - b.order)[0] ?? null;
}
