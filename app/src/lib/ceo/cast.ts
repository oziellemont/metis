/**
 * Ayudantes del elenco. Cada empresa trae su propio elenco en su paquete (`pack.cast`);
 * aquí sólo resolvemos nombres y colores de avatar con la paleta de mêtis.
 */
import type { CastId, CompanyPack, Person } from "./types";

/** Tonos de avatar: sólo la familia índigo/tinta de mêtis (nada de arcoíris). */
const AVATAR_TONES = ["#4F3FE0", "#2B1F8A", "#171A3A", "#6D5DF6", "#3A2DB8", "#475569", "#5B4BE8", "#24206B"];
const TONE_BY_GROUP: Record<Person["group"], number[]> = {
  consejo: [2, 1, 7],
  comite: [0, 4, 6, 3],
  equipo: [3, 6, 0, 4],
  externo: [5, 2],
};

const UNKNOWN: Person = { id: "?", name: "Alguien", role: "", initials: "?", group: "externo" };

export function personOf(pack: CompanyPack, id: CastId): Person {
  return pack.cast[id] ?? { ...UNKNOWN, id, name: id };
}

/** Nombre de pila (sin «Don», «Doña», «Lic.», «Ing.», «Chef»). */
export function firstName(pack: CompanyPack, id: CastId): string {
  return personOf(pack, id).name.replace(/^(Don|Doña|Lic\.|Ing\.|Chef|Dr\.|Dra\.)\s+/, "").split(" ")[0];
}

/** Color hex del avatar de una persona (estable, dentro de la paleta mêtis). */
export function avatarHex(pack: CompanyPack, id: CastId): string {
  const p = pack.cast[id];
  if (!p) return AVATAR_TONES[5];
  const ids = Object.keys(pack.cast).filter((k) => pack.cast[k].group === p.group);
  const tones = TONE_BY_GROUP[p.group];
  return AVATAR_TONES[tones[Math.max(0, ids.indexOf(id)) % tones.length]];
}

/** Organigrama: quién te reporta y su equipo. */
export function orgOf(pack: CompanyPack): { lead: CastId; team: CastId[] }[] {
  const all = Object.values(pack.cast);
  return all
    .filter((p) => p.reportsTo === "ceo" && p.id !== pack.roles.assistant)
    .map((p) => ({ lead: p.id, team: all.filter((x) => x.reportsTo === p.id).map((x) => x.id) }));
}

/**
 * Agrupa líneas de diálogo por quien habla. Una línea «Héctor: «…»» se atribuye a Héctor aunque el
 * nodo sea de Lucía; las líneas sin prefijo se quedan con quien abre el nodo. Así el encabezado de
 * cada burbuja coincide con quien de verdad lo dice (auditoría: cita de Héctor bajo el nombre de Lucía).
 */
export function speakerGroups(pack: CompanyPack, who: CastId | undefined, lines: string[]): { who: CastId | undefined; lines: string[] }[] {
  const byFirst = new Map<string, CastId>();
  for (const id of Object.keys(pack.cast)) byFirst.set(firstName(pack, id).toLowerCase(), id);
  const out: { who: CastId | undefined; lines: string[] }[] = [];
  for (const raw of lines) {
    const m = /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+):\s+(.*)$/s.exec(raw);
    const id = m ? byFirst.get(m[1].toLowerCase()) : undefined;
    const speaker = id ?? who;
    const text = id && m ? m[2].replace(/^«(.*)»$/s, "$1") : raw;
    const last = out[out.length - 1];
    if (last && last.who === speaker) last.lines.push(text);
    else out.push({ who: speaker, lines: [text] });
  }
  return out;
}

/** Nombre de pila del jugador para saludos («Mariana:»). Sin nombre: saludo neutro. */
export function playerFirst(name: string | undefined | null): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

/** Línea de saludo escrita para «el Director» (masculino): «Director:», «Estimado Director:», «Hola, Director:», «Querido amigo:». */
export const GREETING_LINE = /^(Hola,\s+)?(?:(?:Estimad|Querid)[oa]\s+)?(?:Director(?:a)?(?: General)?|amig[oa])(\s+\([^)]{1,20}\))?\s*:\s*$/;

/**
 * Personaliza un párrafo para el jugador: el saludo genérico se vuelve «Mariana:» (o «Hola, Mariana:»),
 * sin suponer género. Sin nombre, queda «Hola:». El resto del texto no se toca.
 */
export function personalizeText(t: string, name: string | undefined | null): string {
  const m = GREETING_LINE.exec(t.trim());
  if (!m) return t;
  const first = playerFirst(name);
  const note = m[2] ?? "";
  if (!first) return `Hola${note}:`;
  return m[1] ? `Hola, ${first}${note}:` : `${first}${note}:`;
}
