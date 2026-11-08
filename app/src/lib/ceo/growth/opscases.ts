/**
 * mêtis CEO · Growth Engine · casos de operación y de financiamiento que sirven a cualquier empresa del motor
 * (StartUp o consolidada, restaurante o manufactura).
 *
 *  - gf_arranque: al llegar, ¿creces con tu caja, con el banco (llamada con ofertas preaprobadas) o con el dueño?
 *  - go_contratar: una sede no da abasto; el puesto a contratar es el cuello de botella real de esa sede.
 *  - go_ajustar: una sede tiene gente de más; mover a alguien a donde falta o darlo de baja (con su finiquito real).
 *  - go_expandir: abrir en otra zona; dónde y por qué, con renta, inversión y demanda estimada de cada zona.
 * Todas las cifras salen del motor (catálogo, plantilla, cotizaciones, resultados por sede); la IA no las toca.
 */
import { roleById } from "./catalog";
import { activePeople, capacityNow } from "./engine";
import { START_WINDOW, fmt, startOffers } from "./finance";
import { laborOf, regionOf, regionalSalary, terminationOf } from "./labor";
import { ZONES, zoneOf } from "./geo";
import { TEMPLATES } from "./families";
import { profileOf, type ZoneOffer } from "./models";
export { PLANT_ZONES, REST_ZONES, STEEL_ZONES } from "./models";
import type { GCase, GOption } from "./cases";
import type { Command, GrowthState, Person, Site, SiteMonth } from "./types";

/** Marcador de la sede que crea la misma decisión (igual que NEW_SITE en cases.ts). */
const NEW = "@sede_nueva";
const money = (cents: number) => `$${fmt(cents)}`;
const pesosOf = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const sal = (g: GrowthState, roleId: string) => regionalSalary(roleById(roleId)!.salary.mid, regionOf(g.region));
const tpl = (g: GrowthState) => TEMPLATES[g.templateId];
const consolidated = (g: GrowthState) => tpl(g)?.size === "consolidada";
const ownerName = (g: GrowthState) => (consolidated(g) ? "Consejo de administración" : "Don Ignacio · Dueño");

// ───────────────────────────────────────────────────────────────── financiamiento de arranque
const offer = (g: GrowthState, id: string) => startOffers(g).find((o) => o.id === id);
const ownerOffer = (g: GrowthState) => Math.round((tpl(g)?.ownerCapacity ?? 0) * 0.4 / 10000) * 10000;
const bankOption = (id: "corto" | "medio" | "largo", score: 1 | 2 | 3): GOption => ({
  id: `banco_${id}`, text: "Crédito del banco", via: "banco", score,
  textOf: (g) => { const o = offer(g, id); return o ? `Crédito de ${money(o.amount)} a ${o.months} meses` : "Crédito del banco"; },
  short: (g) => { const o = offer(g, id); return o ? `${o.months} meses` : "Banco"; },
  available: (g) => (offer(g, id) ? { ok: true } : { ok: false, reason: "La oferta preaprobada ya no está vigente." }),
  outcome: (g) => { const o = offer(g, id); return o ? `Entran ${money(o.amount)} en unos 10 días. Pagas ${money(o.payment)} al mes durante ${o.months} meses (tasa ${(o.rate * 100).toFixed(1)} % anual). Costo total del crédito: ${money(o.cost)}.` : ""; },
  commands: (g, c) => { const o = offer(g, id); return o ? [{ type: "bank_loan", id: `${c}:b`, amount: o.amount / 100, months: o.months, preapproved: true }] : []; },
});

export const FIN_CASE: GCase = {
  id: "gf_arranque", tags: { funcion: "finanzas", competencias: ["finanzas","estrategia"] }, lesson: "La deuda es buena cuando el plazo coincide con lo que financia y la operación puede pagarla. Pedir dinero sin plan pesa en la confianza de quien lo pone.", family: "ambas", chain: "finanzas", step: 1, from: "Dueño", waitDays: 10,
  fromOf: ownerName,
  subject: "¿Con qué dinero vas a crecer?",
  lead: (g) => `Caja de ${money(g.cash)}. El banco te preaprobó crédito; el dueño puede aportar. O creces con lo que hay.`,
  body: (g) => [
    `Hoy la empresa tiene ${money(g.cash)} en caja. Antes de decidir contrataciones o aperturas, define con qué dinero vas a crecer.`,
    "El banco te preaprobó un crédito con tres plazos: el dinero llega rápido, pero se paga cada mes con intereses. El dueño puede aportar capital sin intereses, aunque cada peso que pone pesa en su confianza. O puedes crecer solo con lo que la operación genere.",
  ],
  data: (g) => { const os = startOffers(g); return [["Caja hoy", money(g.cash)], ...os.map((o): [string, string] => [`Banco · ${o.months} meses`, `${money(o.amount)} · ${money(o.payment)}/mes`]), ["Aportación del dueño", pesosOf(ownerOffer(g))]]; },
  requires: { maxDay: START_WINDOW, when: { label: "ofertas de arranque vigentes", test: (g) => startOffers(g).length > 0 } },
  options: [
    { id: "propio", text: "Crecer con la caja propia", short: "Caja propia", score: 3,
      outcome: (g) => `Sin deuda ni intereses. Cada contratación o apertura sale de los ${money(g.cash)} de hoy y de lo que genere la operación.`,
      commands: () => [] },
    bankOption("corto", 3), bankOption("medio", 2), bankOption("largo", 1),
    { id: "socio", text: "Pedir una aportación al dueño", short: "Aportación del dueño", score: 2, effects: { consejo: -1 },
      textOf: (g) => `Pedir ${pesosOf(ownerOffer(g))} al dueño`,
      available: (g) => (ownerOffer(g) > 0 && g.relations.owner >= 0.4 ? { ok: true } : { ok: false, reason: "El dueño no está en condiciones de aportar." }),
      outcome: (g) => `Entran ${pesosOf(ownerOffer(g))} en unos 5 días, sin intereses. El dueño querrá ver en qué se usan.`,
      commands: (g, c) => [{ type: "owner_equity", id: `${c}:e`, amount: ownerOffer(g), preapproved: true }] },
  ],
};

// ───────────────────────────────────────────────────────────────── sedes calientes y frías
const lastSites = (g: GrowthState): SiteMonth[] => g.months.at(-1)?.bySite ?? [];
const operating = (g: GrowthState) => g.sites.filter((x) => x.status === "operando");
const siteName = (g: GrowthState, id: string) => g.sites.find((x) => x.id === id)?.name ?? id;
const peopleAt = (g: GrowthState, siteId: string, roleId: string) => activePeople(g).filter((p) => p.siteId === siteId && p.roleId === roleId);
const mature = (g: GrowthState, x: Site) => x.openedDay === undefined || x.openedDay <= 0 || g.day - x.openedDay >= x.maturityDays;

export interface Hot { siteId: string; lostPct: number; resource: string; roleId: string; n: number }
/** Sede que no da abasto (más de 6 % de la demanda sin atender el mes pasado) y el puesto que lo resuelve. */
export function hotSite(g: GrowthState): Hot | null {
  const caps = new Map(capacityNow(g).map((c) => [c.id, c]));
  let best: Hot | null = null;
  for (const m of lastSites(g)) {
    const site = g.sites.find((x) => x.id === m.siteId);
    const cap = caps.get(m.siteId);
    if (!site || site.status !== "operando" || !cap || m.demand <= 0) continue;
    const lostPct = m.lost / m.demand;
    const fix = profileOf(g).roleFor[cap.bottleneck];
    if (lostPct <= 0.06 || !fix) continue;
    if (g.vacancies.some((v) => v.siteId === m.siteId && v.roleId === fix.roleId)) continue;
    if (!best || lostPct > best.lostPct) best = { siteId: m.siteId, lostPct, resource: cap.bottleneck, ...fix };
  }
  return best;
}

export interface Cold { siteId: string; usePct: number; roleId: string; person: Person; severance: number }
/** Sede madura que usa menos del 72 % de su capacidad y tiene gente de más en un puesto operativo. */
export function coldSite(g: GrowthState): Cold | null {
  const caps = new Map(capacityNow(g).map((c) => [c.id, c]));
  const L = laborOf(g.laborVersion);
  let best: Cold | null = null;
  for (const m of lastSites(g)) {
    const site = g.sites.find((x) => x.id === m.siteId);
    const cap = caps.get(m.siteId);
    if (!site || site.status !== "operando" || !mature(g, site) || !cap || m.capacity <= 0) continue;
    const usePct = m.served / m.capacity;
    if (usePct >= 0.72) continue;
    // El recurso con más holgura respecto al cuello de botella es donde sobra gente.
    const P = profileOf(g);
    const slack = Object.keys(P.slackRole).filter((r) => cap.cap[r] !== undefined).sort((a, b) => cap.cap[b] / Math.max(1, cap.perDay) - cap.cap[a] / Math.max(1, cap.perDay))[0];
    if (!slack) continue;
    const roleId = P.slackRole[slack];
    const staff = peopleAt(g, m.siteId, roleId);
    if (staff.length < (P.slackMin[roleId] ?? 2)) continue;
    const person = [...staff].sort((a, b) => b.startDay - a.startDay)[0];
    const years = Math.max(0, (g.day - person.startDay) / 365);
    const severance = terminationOf("despido_injustificado", person.salary, years, person.provision, 0, L, regionOf(g.region)).total;
    if (!best || usePct < best.usePct) best = { siteId: m.siteId, usePct, roleId, person, severance };
  }
  return best;
}

/** Persona del mismo puesto que se puede mover de una sede con holgura a la sede que no da abasto. */
function donorFor(g: GrowthState, hot: Hot): Person | null {
  const cold = coldSite(g);
  if (cold && cold.siteId !== hot.siteId && cold.roleId === hot.roleId) return cold.person;
  for (const x of operating(g)) {
    if (x.id === hot.siteId) continue;
    const m = lastSites(g).find((y) => y.siteId === x.id);
    const staff = peopleAt(g, x.id, hot.roleId);
    if (m && m.demand > 0 && m.lost / m.demand < 0.01 && m.capacity > 0 && m.served / m.capacity < 0.8 && staff.length >= (profileOf(g).slackMin[hot.roleId] ?? 2) + 1) return [...staff].sort((a, b) => b.startDay - a.startDay)[0];
  }
  return null;
}
function receiverFor(g: GrowthState, cold: Cold): string | null {
  const hot = hotSite(g);
  return hot && hot.siteId !== cold.siteId && hot.roleId === cold.roleId ? hot.siteId : null;
}

const roleTitle = (id: string, n = 1) => { const t = roleById(id)?.title.toLowerCase() ?? id; return n === 1 ? t : `${n} ${t.replace(/^(\S+)/, "$1es").replace("eses", "es")}`; };

export const HIRE_CASE: GCase = {
  id: "go_contratar", tags: { funcion: "operaciones", competencias: ["operacion","personas","clientes"] }, lesson: "Lo que no se atiende hoy se pierde y cuesta reputación. Contratar en el cuello de botella real es la inversión más rápida de recuperar.", family: "ambas", chain: "operacion", step: 1, from: "Operaciones", waitDays: 30, repeatable: true,
  fromOf: (g) => (consolidated(g) ? "Gerencia de operaciones" : profileOf(g).mode === "mostrador" ? "Gerencia de sucursal" : "Supervisión de producción"),
  subject: "Una sede no da abasto",
  subjectOf: (g) => { const h = hotSite(g); return h ? `${siteName(g, h.siteId)} no da abasto` : "Una sede no da abasto"; },
  lead: (g) => { const h = hotSite(g); return h ? `Se quedó sin atender el ${Math.round(h.lostPct * 100)} % de la demanda. El límite es ${profileOf(g).limitText(h.resource)}.` : ""; },
  body: (g) => { const h = hotSite(g); return h ? [`El mes pasado ${siteName(g, h.siteId)} dejó sin atender el ${Math.round(h.lostPct * 100)} % de su demanda.`, `El cuello de botella es ${profileOf(g).limitText(h.resource)}: lo resuelve un ${roleTitle(h.roleId)} más.`] : []; },
  data: (g) => { const h = hotSite(g); return h ? [["Demanda sin atender", `${Math.round(h.lostPct * 100)} %`], [roleById(h.roleId)!.title, `${money(sal(g, h.roleId))} al mes`]] : []; },
  requires: { minDay: 30, liquidity: ["sana", "alerta"], when: { label: "sede saturada", test: (g) => !!hotSite(g) } },
  notWith: ["ga1_cocina", "ga3_equipo", "gb1_cliente", "gb2_capacidad", "gb3_calidad"],
  options: [
    { id: "contratar", text: "Contratar", score: 3, effects: { clientes: 1 },
      textOf: (g) => { const h = hotSite(g); return h ? `Contratar ${h.n === 1 ? `un ${roleTitle(h.roleId)}` : roleTitle(h.roleId, h.n)}` : "Contratar"; },
      short: (g) => { const h = hotSite(g); return h ? `+${h.n} ${roleById(h.roleId)!.title.split(" ")[0].toLowerCase()}` : "Contratar"; },
      outcome: (g) => { const h = hotSite(g); const r = h && roleById(h.roleId); return h && r ? `Vacante abierta: unas ${Math.max(1, Math.round(r.fillDays / 7))} semanas para cubrirla. Cuesta ${money(sal(g, h.roleId) * h.n)} brutos al mes más carga social.` : ""; },
      commands: (g, c) => { const h = hotSite(g); return h ? Array.from({ length: h.n }, (_, i): Command => ({ type: "hire", id: `${c}:h${i}`, roleId: h.roleId, siteId: h.siteId })) : []; } },
    { id: "mover", text: "Mover a alguien de otra sede", short: "Mover gente", score: 3, effects: { equipo: -1 },
      textOf: (g) => { const h = hotSite(g); const p = h && donorFor(g, h); return p ? `Mover a ${p.name.split(" ")[0]} desde ${siteName(g, p.siteId!)}` : "Mover a alguien de otra sede"; },
      available: (g) => { const h = hotSite(g); return h && donorFor(g, h) ? { ok: true } : { ok: false, reason: "Ninguna otra sede tiene gente de más en ese puesto." }; },
      outcome: () => "Sin costo de contratación y desde mañana. La sede que cede a la persona queda más justa.",
      commands: (g, c) => { const h = hotSite(g); const p = h && donorFor(g, h); return h && p ? [{ type: "transfer", id: `${c}:t`, personId: p.id, siteId: h.siteId }] : []; } },
    { id: "esperar", text: "Esperar un mes más", short: "Esperar", score: 1, effects: { clientes: -1 },
      outcome: () => "No sube la nómina, pero se siguen perdiendo ventas y la reputación de la sede lo resiente.",
      commands: () => [] },
  ],
};

export const TRIM_CASE: GCase = {
  id: "go_ajustar", tags: { funcion: "personas", competencias: ["personas","finanzas","etica"] }, lesson: "La holgura se resuelve primero moviendo a la gente a donde rinde; despedir cuesta finiquito y confianza del equipo que se queda.", family: "ambas", chain: "operacion", step: 2, from: "Finanzas", waitDays: 45, repeatable: true,
  fromOf: (g) => (consolidated(g) ? "Contraloría" : "Administración"),
  subject: "Una sede tiene gente de más",
  subjectOf: (g) => { const c = coldSite(g); return c ? `${siteName(g, c.siteId)} tiene gente de más` : "Una sede tiene gente de más"; },
  lead: (g) => { const c = coldSite(g); return c ? `Usa el ${Math.round(c.usePct * 100)} % de su capacidad. Sobra un ${roleTitle(c.roleId)}.` : ""; },
  body: (g) => { const c = coldSite(g); return c ? [`${siteName(g, c.siteId)} usó el ${Math.round(c.usePct * 100)} % de su capacidad el mes pasado.`, `La nómina de ${roleById(c.roleId)!.title.toLowerCase()}s está por encima de lo que la demanda pide.`] : []; },
  data: (g) => { const c = coldSite(g); return c ? [["Uso de capacidad", `${Math.round(c.usePct * 100)} %`], ["Sueldo", `${money(c.person.salary)} al mes`], ["Finiquito e indemnización", money(c.severance)]] : []; },
  requires: { minDay: 30, when: { label: "sede con gente de más", test: (g) => !!coldSite(g) } },
  options: [
    { id: "mover", text: "Mover a esa persona a donde falta", short: "Mover", score: 3, effects: { equipo: 1 },
      textOf: (g) => { const c = coldSite(g); const to = c && receiverFor(g, c); return c && to ? `Mover a ${c.person.name.split(" ")[0]} a ${siteName(g, to)}` : "Mover a esa persona a donde falta"; },
      available: (g) => { const c = coldSite(g); return c && receiverFor(g, c) ? { ok: true } : { ok: false, reason: "Ninguna otra sede necesita ese puesto ahora." }; },
      outcome: () => "Sin finiquito ni contratación: la persona rinde donde hace falta.",
      commands: (g, k) => { const c = coldSite(g); const to = c && receiverFor(g, c); return c && to ? [{ type: "transfer", id: `${k}:t`, personId: c.person.id, siteId: to }] : []; } },
    { id: "baja", text: "Dar de baja", short: "Dar de baja", score: 2, effects: { equipo: -2 },
      textOf: (g) => { const c = coldSite(g); return c ? `Dar de baja a ${c.person.name}` : "Dar de baja"; },
      outcome: (g) => { const c = coldSite(g); return c ? `Pagas hoy ${money(c.severance)} de finiquito e indemnización y ahorras ${money(c.person.salary)} brutos al mes desde el próximo. El equipo lo nota.` : ""; },
      commands: (g, k) => { const c = coldSite(g); return c ? [{ type: "terminate", id: `${k}:x`, personId: c.person.id, kind: "despido_injustificado" }] : []; } },
    { id: "mantener", text: "Mantener al equipo", short: "Mantener", score: 1,
      outcome: () => "Sin costo hoy. El margen de la sede sigue por debajo de las demás.",
      commands: () => [] },
  ],
};

// ───────────────────────────────────────────────────────────────── expansión: dónde y por qué
/** Las dos mejores zonas libres para abrir (en orden de atractivo). */
export function zonesFor(g: GrowthState): ZoneOffer[] {
  const used = new Set(g.sites.filter((x) => x.status !== "cerrada").map((x) => zoneOf(x).id));
  return profileOf(g).zones.filter((z) => !used.has(z.zone)).slice(0, 2);
}
export const upfrontOf = (z: ZoneOffer) => z.rent * 2 + z.capex;
const teamCost = (g: GrowthState) => profileOf(g).team.reduce((a, r) => a + sal(g, r), 0);

const zoneOption = (i: 0 | 1, score: 2 | 3): GOption => ({
  id: i === 0 ? "zona_a" : "zona_b", text: "Abrir en otra zona", score, effects: { consejo: 1 },
  textOf: (g) => { const z = zonesFor(g)[i]; return z ? `Abrir en ${ZONES[z.zone].label}` : "Abrir en otra zona"; },
  short: (g) => { const z = zonesFor(g)[i]; return z ? ZONES[z.zone].label : "—"; },
  available: (g) => {
    const z = zonesFor(g)[i];
    if (!z) return { ok: false, reason: "No hay otra zona disponible." };
    return g.cash >= pesosToC(upfrontOf(z)) ? { ok: true } : { ok: false, reason: `Requiere ${pesosOf(upfrontOf(z))} hoy (depósito y obra); la caja tiene ${money(g.cash)}.` };
  },
  outcome: (g) => { const z = zonesFor(g)[i]; return z ? `${z.why} Pagas hoy ${pesosOf(upfrontOf(z))}; renta de ${pesosOf(z.rent)} al mes y un equipo de ${profileOf(g).team.length} personas (${money(teamCost(g))} al mes).` : ""; },
  commands: (g, c) => {
    const z = zonesFor(g)[i];
    if (!z) return [];
    const label = ZONES[z.zone].label;
    const P = profileOf(g), o = P.openSite;
    const cmds: Command[] = [{ type: "open_site", id: `${c}:site`, name: `${P.site.One} ${label}`, zone: z.zone, rent: z.rent, utilities: z.utilities, deposit: z.rent * 2, capex: z.capex, years: o.years, buildDays: o.buildDays, assets: { ...o.assets }, demandBase: z.demandBase, maturityDays: o.maturityDays, preopening: o.preopening }];
    P.team.forEach((roleId, k) => cmds.push({ type: "hire", id: `${c}:h${k}`, roleId, siteId: NEW }));
    if (z.client) cmds.push({ type: "add_contract", id: `${c}:k`, ...z.client, startInDays: 80, siteId: NEW });
    return cmds;
  },
});
const pesosToC = (p: number) => Math.round(p * 100);

export const EXPAND_CASE: GCase = {
  id: "go_expandir", tags: { funcion: "direccion_general", competencias: ["estrategia","finanzas"] }, lesson: "Se crece cuando la operación actual es sana y la caja aguanta la obra y los meses sin venta. La zona correcta tiene una razón concreta, no solo renta baja.", family: "ambas", chain: "operacion", step: 3, from: "Dueño", waitDays: 30, repeatable: true,
  fromOf: ownerName,
  subject: "¿Abrimos en otra zona?",
  lead: (g) => { const zs = zonesFor(g); return zs.length ? `Dos zonas posibles: ${zs.map((z) => ZONES[z.zone].label).join(" o ")}. Caja de ${money(g.cash)}.` : ""; },
  body: (g) => [
    `Los números de los últimos meses dan para pensar en otra ${profileOf(g).site.one}. Hay dos zonas con sentido, cada una por una razón distinta.`,
    ...zonesFor(g).map((z) => `${ZONES[z.zone].label}: ${z.why}`),
  ],
  data: (g) => zonesFor(g).map((z): [string, string] => [ZONES[z.zone].label, `Renta ${pesosOf(z.rent)} · inversión ${pesosOf(upfrontOf(z))}${z.client ? ` · ${z.client.unitsPerDay.toLocaleString("en-US")} ${profileOf(g).unit.many}/día` : ` · ${z.demandBase} ${profileOf(g).unit.many}/día al madurar`}`]),
  requires: { minDay: 120, liquidity: ["sana"], when: { label: "resultados sanos y sin obra en curso", test: (g) => {
    const ms = g.months.slice(-2);
    return ms.length === 2 && ms.every((m) => m.ebitda > 0) && !g.sites.some((x) => x.status === "en_obra" || x.status === "preapertura") && zonesFor(g).length > 0 && g.sites.filter((x) => x.status === "operando").length < 9;
  } } },
  notWith: ["ga2_sucursal", "ga3_equipo"],
  options: [
    zoneOption(0, 3), zoneOption(1, 2),
    { id: "no", text: "Todavía no", short: "Todavía no", score: 2, outcome: () => "La caja sigue intacta para la operación actual. La oportunidad se vuelve a revisar en unos meses.", commands: () => [] },
  ],
};

export const OPS_CASES: readonly GCase[] = [FIN_CASE, HIRE_CASE, TRIM_CASE, EXPAND_CASE];
