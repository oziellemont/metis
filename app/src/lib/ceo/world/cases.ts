/**
 * World Events · casos e impactos por motor (cadena de conveniencia y acería), solo con comandos del motor.
 *
 *  - El caso ofrece opciones defendibles con costo y plazo calculados con el estado (tiendas abiertas, personal, tamaño
 *    de la planta). La opción insegura en zona roja aparece bloqueada con su razón.
 *  - El impacto simulado llega solo si el acontecimiento llegó con fuerza a una sede (lo observado, no el pronóstico) y
 *    depende de la preparación elegida. Sin decisión, el equipo aplica el protocolo estándar.
 *  - Montos en pesos (los comandos los convierten a centavos). Reglas versionadas en WORLD_RULES_VERSION.
 */
import { storesOpen, type RetailCommand, type RetailState } from "../growth/retail/engine";
import { TEMPLATES_RETAIL } from "../growth/retail/params";
import type { RCase, ROption } from "../growth/retail/cases";
import { headcountOf as steelHeadcount, type SteelCommand, type SteelState } from "../growth/steel/engine";
import { TEMPLATES_V2 } from "../growth/steel/params";
import type { SCase, SOption } from "../growth/steel/cases";
import { exposureOf, type Site } from "./exposure";
import { caseIdOf, deadlineOf, exposedSites, outcomeOf } from "./episodes";
import { zoneRank, type WorldEpisode, type Zone } from "./types";

export const WORLD_RULES_VERSION = 1;
/** Opción de referencia (protocolo estándar): la que se usa para separar «impacto externo» de «impacto de mi decisión». */
export const referenceOption = (ep: Pick<WorldEpisode, "status">) => (ep.status === "observado" ? "inspeccion" : "protocolo");
/** Nivel de preparación de cada opción ante un pronóstico. */
const MITIGATION: Record<string, 0 | 1 | 2> = { monitorear: 0, protocolo: 1, preventivo: 2 };
export const mitigationOf = (optionId: string | null | undefined): 0 | 1 | 2 => MITIGATION[optionId ?? "protocolo"] ?? 1;

export const WORLD_LABEL = { real: "Evento real · Simulación de impacto en tu empresa", ejercicio: "Ejercicio hipotético · No es un acontecimiento real" } as const;

const mx = (p: number) => `$${Math.round(p).toLocaleString("en-US")}`;
const ZONE_TEXT: Record<Zone, string> = { ninguna: "fuera de zona", verde: "zona verde", naranja: "zona naranja", roja: "zona roja" };
const ok = { ok: true };
const isRed = (z: Record<string, Zone>) => Object.values(z).includes("roja");
const sitesIn = (templateId: string, z: Record<string, Zone>): { site: Site; zone: Zone }[] =>
  (exposureOf(templateId)?.sites ?? []).filter((s) => zoneRank(z[s.id] ?? "ninguna") >= zoneRank("naranja")).map((site) => ({ site, zone: z[site.id] }));
const siteList = (templateId: string, z: Record<string, Zone>) => sitesIn(templateId, z).map((x) => `${x.site.label} (${ZONE_TEXT[x.zone]})`).join("; ");

function intro(ep: WorldEpisode, templateId: string, s: { day: number }): string[] {
  const where = siteList(templateId, ep.sites);
  const left = Math.max(0, deadlineOf(ep) - s.day);
  const head = ep.mode === "ejercicio"
    ? `Ejercicio hipotético: imagina que ${ep.source.name} reporta ${ep.name}${ep.severity ? ` (${ep.severity})` : ""}. No es un acontecimiento real.`
    : `${ep.source.name} reporta ${ep.name}${ep.severity ? ` (${ep.severity})` : ""}.`;
  const state = ep.status === "pronostico"
    ? `Según las zonas de viento del aviso, quedan expuestas: ${where}. Es un pronóstico: la trayectoria puede cambiar.`
    : `Según el mapa de intensidad, quedaron dentro de la zona de sacudida fuerte: ${where}.`;
  return [head, state, `Lo que pase en tu empresa es una simulación: depende de tus sedes y de lo que decidas. Plazo para decidir: ${left === 0 ? "hoy" : left === 1 ? "1 día" : `${left} días`}.`];
}
const lessonOf = (ep: WorldEpisode) => ep.status === "pronostico"
  ? "Ante un pronóstico oficial se decide con lo que se sabe hoy. Preparar cuesta poco frente a la pérdida; si el fenómeno se desvía, la preparación no fue un error. La seguridad de las personas va primero."
  : "Después de un sismo van primero las personas y la revisión estructural. Reabrir antes ahorra días de venta, pero arriesga lo que no se ve.";

// ─────────────────────────────────────────────────────────────── cadena de conveniencia
function retailExposed(s: RetailState, z: Record<string, Zone>) {
  const out = sitesIn(s.templateId, z);
  const stores = out.reduce((a, x) => a + (x.site.groups ?? []).reduce((b, gid) => { const g = s.groups.find((k) => k.id === gid); return b + (g ? storesOpen(s, g) : 0); }, 0), 0);
  const people = out.reduce((a, x) => a + (x.site.groups ?? []).reduce((b, gid) => { const g = s.groups.find((k) => k.id === gid); return b + (g ? storesOpen(s, g) * (1 + g.staff) : 0); }, 0) + (x.site.crews ?? []).reduce((b, c) => b + (s.crews[c]?.n ?? 0), 0), 0);
  return { list: out, stores, people, cedis: out.some((x) => x.site.kind === "cedis") };
}

export function retailWorldCase(s: RetailState, ep: WorldEpisode): RCase {
  const x = retailExposed(s, ep.sites);
  const red = isRed(ep.sites);
  const n = Math.max(1, x.stores);
  const base: Omit<RCase, "options"> = {
    id: caseIdOf(ep), area: "operacion", from: "operaciones", minDay: 0, safety: true,
    subject: ep.status === "pronostico" ? `${ep.name}: ${x.stores ? `${x.stores} tiendas` : "el CEDIS"} en la zona de riesgo` : `${ep.name}: revisar ${x.stores ? `${x.stores} tiendas` : "el CEDIS"} antes de seguir operando`,
    body: () => intro(ep, s.templateId, s),
    data: () => [["Fuente", ep.source.name], ["Estado", ep.status === "pronostico" ? "Pronóstico (puede cambiar)" : "Observado"], ["Tiendas expuestas", String(x.stores)], ["Personas en la zona", x.people.toLocaleString("en-US")]],
    lesson: lessonOf(ep),
    requires: () => ok,
  };
  const groupsOf = () => x.list.flatMap((e) => e.site.groups ?? []);
  if (ep.status === "pronostico") {
    const options: ROption[] = [
      { id: "protocolo", stance: "equilibrada", label: "Activar el protocolo de huracán", detail: () => `Protección de vidrios y anuncios, sacos de arena, combustible para las plantas y personal a casa con goce de sueldo durante el paso. ${mx(n * 7_500)}.`,
        commands: (_s, k) => [{ type: "one_off", id: `${k}:prot`, label: "Protocolo de huracán en tiendas expuestas", amount: n * 7_500, payInDays: 15 }, { type: "safety", id: `${k}:s`, delta: 0.01 }] },
      { id: "preventivo", stance: "prudente", label: "Cierre preventivo y retiro de perecederos", detail: () => `Además del protocolo, cerrar dos días antes del paso, retirar perecederos y adelantar surtido${x.cedis ? " y sacar inventario del CEDIS" : ""}. ${mx(n * 11_000 + (x.cedis ? 450_000 : 0))} y se pierde venta esos días; se reabre más rápido.`,
        commands: (_s, k) => [
          { type: "one_off", id: `${k}:prot`, label: "Cierre preventivo y retiro de perecederos", amount: n * 11_000 + (x.cedis ? 450_000 : 0), payInDays: 15 },
          ...groupsOf().map((g): RetailCommand => ({ type: "modify", id: `${k}:cierre:${g}`, key: "demand", group: g, mult: 0.35, days: 2 })),
          { type: "relation", id: `${k}:st`, key: "staff", delta: 0.03 }, { type: "safety", id: `${k}:s`, delta: 0.02 },
        ] },
      { id: "monitorear", stance: "arriesgada", label: "Monitorear y operar normal", detail: () => "Sin gasto hoy. Si llega con fuerza, las tiendas se toman tal como están.", commands: () => [] },
    ];
    if (red) options.push({ id: "abrir_roja", stance: "arriesgada", label: "Mantener abiertas con personal las tiendas en zona roja", blocked: "Con vientos de huracán, tener personal atendiendo pone vidas en riesgo. No es una decisión de negocio disponible.", detail: () => "", commands: () => [] });
    return { ...base, options };
  }
  const options: ROption[] = [
    { id: "inspeccion", stance: "equilibrada", label: "Inspección estructural antes de reabrir", detail: () => `Un ingeniero revisa cada tienda expuesta; reabren en un día. ${mx(n * 3_500)}.`,
      commands: (_s, k) => [{ type: "one_off", id: `${k}:insp`, label: "Inspección estructural de tiendas", amount: n * 3_500, payInDays: 15 }, ...groupsOf().map((g): RetailCommand => ({ type: "modify", id: `${k}:dia:${g}`, key: "demand", group: g, mult: 0.7, days: 1 })), { type: "safety", id: `${k}:s`, delta: 0.01 }] },
    { id: "apoyo", stance: "prudente", label: "Inspección y apoyo al personal afectado", detail: () => `Además de la inspección, días pagados y apoyo a las familias del personal de la zona. ${mx(n * 3_500 + x.people * 1_800)}.`,
      commands: (_s, k) => [{ type: "one_off", id: `${k}:insp`, label: "Inspección estructural y apoyo al personal", amount: n * 3_500 + x.people * 1_800, payInDays: 15 }, ...groupsOf().map((g): RetailCommand => ({ type: "modify", id: `${k}:dia:${g}`, key: "demand", group: g, mult: 0.7, days: 1 })), { type: "relation", id: `${k}:st`, key: "staff", delta: 0.04 }, { type: "relation", id: `${k}:cl`, key: "clients", delta: 0.02 }, { type: "safety", id: `${k}:s`, delta: 0.02 }] },
    { id: "reabrir", stance: "arriesgada", label: "Reabrir de inmediato con revisión visual", detail: () => "Sin gasto ni días cerrados; el personal nota la prisa.", commands: (_s, k) => [{ type: "safety", id: `${k}:s`, delta: -0.03 }, { type: "relation", id: `${k}:st`, key: "staff", delta: -0.03 }] },
  ];
  if (red) options[2] = { ...options[2], blocked: "Donde hubo sacudida fuerte, reabrir sin revisión estructural pone en riesgo a clientes y personal. No es una decisión de negocio disponible.", detail: () => "" };
  return { ...base, options };
}

/** Impacto simulado en la cadena cuando el acontecimiento llega con fuerza. `optionId` es la preparación elegida. */
export function retailImpact(s: RetailState, ep: WorldEpisode, optionId: string | null): { commands: RetailCommand[]; text: string } {
  const z = outcomeOf(ep) ?? {};
  const m = ep.status === "observado" ? 1 : mitigationOf(optionId);
  const k = `w:${ep.id}:imp`;
  const cmds: RetailCommand[] = [];
  let lost = 0, repair = 0, stores = 0;
  for (const { site, zone } of sitesIn(s.templateId, z)) {
    const red = zone === "roja";
    if (site.kind === "cedis") {
      const [mult, days, fix] = ep.kind === "sismo" ? (red ? [1.5, 10, 4_000_000] : [1.15, 5, 800_000]) : red ? [[1.6, 1.35, 1.2][m], [10, 7, 5][m], [2_500_000, 1_400_000, 1_000_000][m]] : [[1.25, 1.12, 1.08][m], [5, 3, 3][m], [600_000, 350_000, 250_000][m]];
      cmds.push({ type: "modify", id: `${k}:log`, key: "logistics", mult, days });
      repair += fix;
      continue;
    }
    for (const gid of site.groups ?? []) {
      const g = s.groups.find((x) => x.id === gid);
      const n = g ? storesOpen(s, g) : 0;
      if (!n) continue;
      stores += n;
      if (ep.kind === "sismo") {
        if (red) { cmds.push({ type: "modify", id: `${k}:d1:${gid}`, key: "demand", group: gid, mult: 0.3, days: 3 }, { type: "modify", id: `${k}:d2:${gid}`, key: "demand", group: gid, mult: 0.85, days: 7, inDays: 3 }); lost += n * 6_000; repair += n * 45_000; }
        else { cmds.push({ type: "modify", id: `${k}:d1:${gid}`, key: "demand", group: gid, mult: 0.8, days: 2 }); lost += n * 1_500; repair += n * 9_000; }
        continue;
      }
      if (red) {
        const d1 = [4, 3, 2][m], d2 = [10, 7, 5][m];
        cmds.push({ type: "modify", id: `${k}:d1:${gid}`, key: "demand", group: gid, mult: 0.15, days: d1 }, { type: "modify", id: `${k}:d2:${gid}`, key: "demand", group: gid, mult: 0.8, days: d2, inDays: d1 });
        lost += n * [16_000, 9_000, 4_000][m]; repair += n * [38_000, 22_000, 16_000][m];
      } else {
        cmds.push({ type: "modify", id: `${k}:d1:${gid}`, key: "demand", group: gid, mult: 0.5, days: [2, 1, 1][m] });
        lost += n * [5_000, 2_500, 1_200][m]; repair += n * [9_000, 5_000, 4_000][m];
      }
    }
  }
  if (lost) cmds.push({ type: "one_off", id: `${k}:merma`, label: `Mercancía perdida por ${ep.name}`, amount: lost, payInDays: 1 });
  if (repair) cmds.push({ type: "one_off", id: `${k}:rep`, label: `Reparaciones por ${ep.name}`, amount: repair, payInDays: 30 });
  if (ep.kind === "ciclon" && isRed(z)) {
    const st = [-0.06, 0, 0.02][m], sf = [-0.04, 0, 0][m];
    if (st) cmds.push({ type: "relation", id: `${k}:st`, key: "staff", delta: st });
    if (sf) cmds.push({ type: "safety", id: `${k}:s`, delta: sf });
  }
  const text = `${ep.mode === "ejercicio" ? "Ejercicio hipotético" : "Evento real, impacto simulado"}: ${ep.name} llegó con fuerza a ${stores ? `${stores} tiendas` : "la operación"}. Mercancía perdida ${mx(lost)} y reparaciones ${mx(repair)}${ep.kind === "ciclon" ? ` con ${["sin preparación", "el protocolo estándar", "cierre preventivo"][m]}` : ""}.`;
  return { commands: cmds, text };
}

// ─────────────────────────────────────────────────────────────── acería
const big = (s: SteelState) => TEMPLATES_V2[s.templateId].kind === "integrada";
const sz = (s: SteelState, a: number, b: number) => (big(s) ? b : a);

export function steelWorldCase(s: SteelState, ep: WorldEpisode): SCase {
  const list = sitesIn(s.templateId, ep.sites);
  const plantZone = ep.sites.planta ?? "ninguna";
  const redPlant = plantZone === "roja";
  const people = steelHeadcount(s);
  const base: Omit<SCase, "options"> = {
    id: caseIdOf(ep), area: "seguridad", from: "supervisor", minDay: 0, safety: true,
    subject: ep.status === "pronostico" ? `${ep.name}: ${list.map((x) => x.site.label.toLowerCase()).join(" y ")} en la zona de riesgo` : `${ep.name}: revisar la planta antes de volver a fundir`,
    body: () => intro(ep, s.templateId, s),
    data: () => [["Fuente", ep.source.name], ["Estado", ep.status === "pronostico" ? "Pronóstico (puede cambiar)" : "Observado"], ["Sedes en zona", String(list.length)], ["Personas en planta", String(people)]],
    lesson: lessonOf(ep),
    requires: () => ok,
  };
  if (ep.status === "pronostico") {
    const options: SOption[] = [
      { id: "protocolo", stance: "equilibrada", label: "Activar el protocolo de huracán", detail: () => `Asegurar techumbres, subestación y chatarra suelta; vaciar hornos de forma controlada solo si se va la luz. ${mx(sz(s, 90_000, 350_000))}.`,
        commands: (_s, k) => [{ type: "one_off", id: `${k}:prot`, label: "Protocolo de huracán en planta", amount: sz(s, 90_000, 350_000), payInDays: 15 }, { type: "safety", id: `${k}:s`, delta: 0.01 }] },
      { id: "preventivo", stance: "prudente", label: "Paro controlado anticipado", detail: () => `Vaciar hornos y parar un día antes del paso, asegurar el patio y mandar al personal a casa con goce de sueldo. ${mx(sz(s, 140_000, 520_000))} y un día sin producir.`,
        commands: (_s, k) => [{ type: "one_off", id: `${k}:prot`, label: "Paro controlado y protección de planta", amount: sz(s, 140_000, 520_000), payInDays: 15 }, { type: "downtime", id: `${k}:paro`, days: 1 }, { type: "safety", id: `${k}:s`, delta: 0.03 }, { type: "relation", id: `${k}:st`, key: "staff", delta: 0.02 }] },
      { id: "monitorear", stance: "arriesgada", label: "Monitorear y seguir produciendo", detail: () => "Sin gasto hoy. Si se va la luz con metal líquido en los hornos, el daño es mayor.", commands: () => [] },
    ];
    if (redPlant) options.push({ id: "fundir", stance: "arriesgada", label: "Seguir fundiendo durante el paso del huracán", blocked: "Un corte de energía con metal líquido en el horno puede provocar una explosión. Con vientos de huracán no es una decisión de negocio disponible.", detail: () => "", commands: () => [] });
    return { ...base, options };
  }
  const options: SOption[] = [
    { id: "inspeccion", stance: "equilibrada", label: "Revisión estructural antes de fundir", detail: () => `Revisar naves, grúas y hornos; un día sin producir. ${mx(sz(s, 60_000, 200_000))}.`,
      commands: (_s, k) => [{ type: "one_off", id: `${k}:insp`, label: "Revisión estructural de la planta", amount: sz(s, 60_000, 200_000), payInDays: 15 }, { type: "downtime", id: `${k}:paro`, days: 1 }, { type: "safety", id: `${k}:s`, delta: 0.01 }] },
    { id: "apoyo", stance: "prudente", label: "Revisión y apoyo al personal", detail: () => `Además de la revisión, días pagados y apoyo a las familias. ${mx(sz(s, 60_000, 200_000) + people * 1_800)}.`,
      commands: (_s, k) => [{ type: "one_off", id: `${k}:insp`, label: "Revisión estructural y apoyo al personal", amount: sz(s, 60_000, 200_000) + people * 1_800, payInDays: 15 }, { type: "downtime", id: `${k}:paro`, days: 1 }, { type: "relation", id: `${k}:st`, key: "staff", delta: 0.04 }, { type: "safety", id: `${k}:s`, delta: 0.02 }] },
    { id: "reabrir", stance: "arriesgada", label: "Volver a fundir de inmediato", detail: () => "Sin días perdidos; el personal nota la prisa.", commands: (_s, k) => [{ type: "safety", id: `${k}:s`, delta: -0.04 }, { type: "relation", id: `${k}:st`, key: "staff", delta: -0.03 }] },
  ];
  if (redPlant) options[2] = { ...options[2], blocked: "Fundir en naves que no se han revisado tras una sacudida fuerte pone vidas en riesgo. No es una decisión de negocio disponible.", detail: () => "" };
  return { ...base, options };
}

export function steelImpact(s: SteelState, ep: WorldEpisode, optionId: string | null): { commands: SteelCommand[]; text: string } {
  const z = outcomeOf(ep) ?? {};
  const m = ep.status === "observado" ? 1 : mitigationOf(optionId);
  const k = `w:${ep.id}:imp`;
  const cmds: SteelCommand[] = [];
  let down = 0, repair = 0;
  for (const { site, zone } of sitesIn(s.templateId, z)) {
    const red = zone === "roja";
    if (site.kind === "planta") {
      if (ep.kind === "sismo") { down = red ? 5 : 1; repair += red ? sz(s, 2_500_000, 9_000_000) : sz(s, 250_000, 900_000); }
      else { down = red ? [6, 3, 2][m] : [2, 1, 1][m]; repair += (red ? sz(s, 1_800_000, 7_000_000) * [1, 0.45, 0.3][m] : sz(s, 300_000, 1_200_000) * [1, 0.5, 0.35][m]); }
    } else if (site.kind === "patio") {
      cmds.push({ type: "modify", id: `${k}:chatarra`, key: "scrapPrice", mult: red ? 1.05 : 1.02, days: red ? 20 : 10 });
      repair += red ? 900_000 * (ep.kind === "sismo" ? 1 : [1, 0.5, 0.35][m]) : 0;
    }
  }
  if (down) cmds.push({ type: "downtime", id: `${k}:paro`, days: down });
  if (repair) cmds.push({ type: "one_off", id: `${k}:rep`, label: `Reparaciones por ${ep.name}`, amount: Math.round(repair), payInDays: 30 });
  if (ep.kind === "ciclon" && isRed(z) && m === 0) cmds.push({ type: "safety", id: `${k}:s`, delta: -0.06 }, { type: "relation", id: `${k}:st`, key: "staff", delta: -0.05 });
  const text = `${ep.mode === "ejercicio" ? "Ejercicio hipotético" : "Evento real, impacto simulado"}: ${ep.name} llegó con fuerza a la operación. ${down ? `${down} ${down === 1 ? "día" : "días"} sin producir y ` : ""}reparaciones por ${mx(repair)}${ep.kind === "ciclon" ? ` con ${["sin preparación", "el protocolo estándar", "paro controlado"][m]}` : ""}.`;
  return { commands: cmds, text };
}

/** ¿Hay sedes de esta plantilla en zona naranja o roja? */
export const anyExposed = (templateId: string, z: Record<string, Zone>) => exposedSites(z).some((id) => exposureOf(templateId)?.sites.some((s) => s.id === id));
/** Nombres de personas de la plantilla (para el remitente del caso). */
export const peopleOf = (templateId: string): Record<string, string> => TEMPLATES_RETAIL[templateId]?.people ?? TEMPLATES_V2[templateId]?.people ?? {};
