/**
 * World Events · reglas de consecuencias v2 para acontecimientos geográficos (huracán, inundación, sismo).
 *
 * Solo aplican a episodios abiertos con rv ≥ 2. Los episodios v1 siguen con world/cases.ts sin cambio alguno.
 *
 * Principio (CLIMATE_RULES_VERSION = 2):
 *  1. Una parte del impacto es INEVITABLE: depende solo de la zona (naranja o roja) a la que llegó el fenómeno en cada
 *     sede y del tipo de fenómeno. Ninguna decisión la quita (días cerrados o sin producir, daño mínimo a instalaciones).
 *  2. Otra parte es EVITABLE y se reparte en seis frentes. Cada opción cubre algunos frentes; lo que no cubre llega:
 *       personal      seguridad del personal (sin protegerlo en zona roja: seguridad y relación con el equipo bajan, y
 *                     la rotación sube tres meses)
 *       continuidad   continuidad operativa (sin asegurar instalaciones: más días cerrados y más reparaciones)
 *       inventario    inventario (sin moverlo o protegerlo: merma)
 *       proveedores   abasto (sin adelantar surtido o asegurar proveedor: anaqueles vacíos o chatarra de emergencia)
 *       clientes      clientes (sin aviso ni plan de reapertura: relación y demanda bajan un mes)
 *       caja          caja (sin pólizas revisadas y evidencia documentada: el seguro paga menos y más tarde)
 *  3. Cada opción tiene un COSTO explícito (comandos del motor) y CONSECUENCIAS FUTURAS (comandos con fecha posterior).
 *  4. Seguro (hipótesis H-S1): la póliza paga SEGURO_BASE de las reparaciones a SEGURO_BASE_DIAS; con el frente de
 *     caja cubierto paga SEGURO_PLAN a SEGURO_PLAN_DIAS.
 *
 * Todo sale de tablas de esta hoja y del estado del motor (tiendas abiertas, personal, tamaño de la planta). La IA no
 * produce cifras. Montos en pesos (los comandos los convierten a centavos).
 */
import { storesOpen, type RetailCommand, type RetailState } from "../growth/retail/engine";
import type { RCase, ROption } from "../growth/retail/cases";
import { headcountOf as steelHeadcount, type SteelCommand, type SteelState } from "../growth/steel/engine";
import { TEMPLATES_V2 } from "../growth/steel/params";
import type { SCase, SOption } from "../growth/steel/cases";
import { exposureOf, type Site } from "./exposure";
import { caseIdOf, deadlineOf, outcomeOf } from "./episodes";
import { zoneRank, type Kind, type ReplayEpisode, type WorldEpisode, type Zone } from "./types";

export const CLIMATE_RULES_VERSION = 2;
export const FRONTS = ["personal", "continuidad", "inventario", "proveedores", "clientes", "caja"] as const;
export type Front = (typeof FRONTS)[number];
export const FRONT_LABEL: Readonly<Record<Front, string>> = Object.freeze({
  personal: "Seguridad del personal", continuidad: "Continuidad operativa", inventario: "Inventario", proveedores: "Proveedores y abasto", clientes: "Clientes", caja: "Caja y seguro",
});
export const SEGURO_BASE = 0.4;
export const SEGURO_BASE_DIAS = 90;
export const SEGURO_PLAN = 0.7;
export const SEGURO_PLAN_DIAS = 30;

/** Frentes que cubre cada opción (v2). Sin decisión, el equipo aplica el protocolo estándar (o la inspección). */
export const OPTION_FRONTS: Readonly<Record<string, readonly Front[]>> = Object.freeze({
  protocolo: ["personal", "continuidad"],
  inventario: ["personal", "continuidad", "inventario", "proveedores"],
  integral: ["personal", "continuidad", "inventario", "proveedores", "clientes", "caja"],
  monitorear: [],
  inspeccion: ["personal", "continuidad"],
  apoyo: ["personal", "continuidad", "proveedores", "clientes", "caja"],
  reabrir: [],
});
export const frontsOf = (ep: Pick<WorldEpisode, "status">, optionId: string | null | undefined): Front[] => {
  const id = optionId ?? (ep.status === "observado" ? "inspeccion" : "protocolo");
  return [...(OPTION_FRONTS[id] ?? OPTION_FRONTS[ep.status === "observado" ? "inspeccion" : "protocolo"])];
};

const mx = (p: number) => `$${Math.round(p).toLocaleString("en-US")}`;
const ok = { ok: true };
const ZONE_TEXT: Record<Zone, string> = { ninguna: "fuera de zona", verde: "zona verde", naranja: "zona naranja", roja: "zona roja" };
const isRed = (z: Record<string, Zone>) => Object.values(z).includes("roja");
const sitesIn = (templateId: string, z: Record<string, Zone>): { site: Site; zone: Zone }[] =>
  (exposureOf(templateId)?.sites ?? []).filter((s) => zoneRank(z[s.id] ?? "ninguna") >= zoneRank("naranja")).map((site) => ({ site, zone: z[site.id] }));
const siteList = (templateId: string, z: Record<string, Zone>) => sitesIn(templateId, z).map((x) => `${x.site.label} (${ZONE_TEXT[x.zone]})`).join("; ");
const KIND_NAME: Record<string, string> = { ciclon: "huracán", inundacion: "inundación", sismo: "sismo" };
const daysTxt = (n: number) => (n === 0 ? "hoy" : n === 1 ? "1 día" : `${n} días`);

function intro2(ep: WorldEpisode, templateId: string, day: number): string[] {
  const where = siteList(templateId, ep.sites);
  const head = ep.mode === "ejercicio"
    ? `Ejercicio hipotético: imagina que ${ep.source.name} reporta ${ep.name}${ep.severity ? ` (${ep.severity})` : ""}. No es un acontecimiento real.`
    : `${ep.source.name} reporta ${ep.name}${ep.severity ? ` (${ep.severity})` : ""}.`;
  const state = ep.status === "pronostico"
    ? ep.kind === "inundacion" ? `Según el área inundada que reporta la fuente, quedan expuestas: ${where}. El agua puede subir o bajar en los próximos días.` : `Según las zonas de viento del aviso, quedan expuestas: ${where}. Es un pronóstico: la trayectoria puede cambiar.`
    : ep.kind === "inundacion" ? `El agua ya llegó a: ${where}.` : `Según el mapa de intensidad, quedaron dentro de la zona de sacudida fuerte: ${where}.`;
  return [
    head, state,
    "Hay una parte del daño que nadie puede evitar si el fenómeno llega con fuerza. Lo que decidas cambia el resto: seguridad del personal, continuidad de la operación, inventario, proveedores, clientes y caja. Cada frente cubierto cuesta; cada frente sin cubrir tiene consecuencias después.",
    `Lo que pase en tu empresa es una simulación con las reglas del motor. Plazo para decidir: ${daysTxt(Math.max(0, deadlineOf(ep) - day))}.`,
  ];
}
const lesson2 = (ep: WorldEpisode) => ep.status === "pronostico"
  ? "Ante una amenaza confirmada se decide con lo que se sabe hoy. Las personas van primero; después, lo que detiene la operación y lo que se pierde para siempre (inventario, clientes). Ninguna preparación borra todo el daño: lo que se compra es reducir la parte evitable."
  : "Después del golpe van primero las personas y la revisión de instalaciones. El daño inevitable ya ocurrió; lo que se decide ahora es cuánto dura, cuánto se recupera del seguro y cómo quedan clientes y proveedores.";

/** Tabla de reglas por fenómeno y zona. Valores por tienda (retail) o por planta según tamaño (acería, [compacta, integrada]). */
interface ZoneRule {
  /** Días cerrados o sin producir que nadie evita. */ inevDays: number;
  /** Días extra si no se cubre continuidad. */ extraDays: number;
  /** Retail: reparaciones por tienda inevitables / extra sin continuidad. */ rInev: number; rExtra: number;
  /** Retail: merma por tienda sin proteger inventario. */ merma: number;
  /** Acería (planta): reparaciones inevitables / extra, [compacta, integrada]. */ pInev: [number, number]; pExtra: [number, number];
  /** Acería: producto terminado dañado sin proteger inventario. */ pStock: [number, number];
}
const RULES: Record<"ciclon" | "inundacion" | "sismo", Record<"naranja" | "roja", ZoneRule>> = {
  ciclon: {
    naranja: { inevDays: 1, extraDays: 1, rInev: 3_000, rExtra: 3_000, merma: 2_500, pInev: [100_000, 400_000], pExtra: [200_000, 800_000], pStock: [50_000, 200_000] },
    roja: { inevDays: 2, extraDays: 2, rInev: 14_000, rExtra: 20_000, merma: 11_000, pInev: [500_000, 2_000_000], pExtra: [1_300_000, 5_000_000], pStock: [150_000, 600_000] },
  },
  inundacion: {
    naranja: { inevDays: 2, extraDays: 1, rInev: 6_000, rExtra: 4_000, merma: 8_000, pInev: [200_000, 800_000], pExtra: [200_000, 600_000], pStock: [100_000, 400_000] },
    roja: { inevDays: 4, extraDays: 3, rInev: 24_000, rExtra: 15_000, merma: 28_000, pInev: [900_000, 3_500_000], pExtra: [800_000, 3_000_000], pStock: [300_000, 1_200_000] },
  },
  sismo: {
    naranja: { inevDays: 1, extraDays: 1, rInev: 8_000, rExtra: 4_000, merma: 1_500, pInev: [200_000, 700_000], pExtra: [150_000, 500_000], pStock: [0, 0] },
    roja: { inevDays: 3, extraDays: 2, rInev: 40_000, rExtra: 18_000, merma: 6_000, pInev: [2_000_000, 7_000_000], pExtra: [900_000, 3_000_000], pStock: [0, 0] },
  },
};
const ruleOf = (kind: Kind, zone: Zone): ZoneRule | null => {
  const k = kind === "inundacion" ? "inundacion" : kind === "sismo" ? "sismo" : kind === "ciclon" ? "ciclon" : null;
  return k && (zone === "roja" || zone === "naranja") ? RULES[k][zone] : null;
};

export interface Impact2<C> { commands: C[]; text: string; parts: { inevitable: string[]; evitable: string[]; future: string[] }; fronts: Front[] }
/** ¿Solo la parte inevitable (contrafactual de la puntuación)? ¿O sin cubrir ningún frente (contrafactual del desglose)? */
const onlyOf = (ep: WorldEpisode) => (ep as ReplayEpisode).only;

// ─────────────────────────────────────────────────────────────── cadena de conveniencia
function retailExposed(s: RetailState, z: Record<string, Zone>) {
  const out = sitesIn(s.templateId, z);
  const storesAt = (site: Site) => (site.groups ?? []).reduce((b, gid) => { const g = s.groups.find((k) => k.id === gid); return b + (g ? storesOpen(s, g) : 0); }, 0);
  const stores = out.reduce((a, x) => a + storesAt(x.site), 0);
  const people = out.reduce((a, x) => a + (x.site.groups ?? []).reduce((b, gid) => { const g = s.groups.find((k) => k.id === gid); return b + (g ? storesOpen(s, g) * (1 + g.staff) : 0); }, 0) + (x.site.crews ?? []).reduce((b, c) => b + (s.crews[c]?.n ?? 0), 0), 0);
  return { list: out, stores, people, cedis: out.some((x) => x.site.kind === "cedis") };
}

/** Costos de preparación (pesos) de cada opción en la cadena. */
export function retailPrepCost(s: RetailState, ep: WorldEpisode) {
  const x = retailExposed(s, ep.sites);
  const n = Math.max(1, x.stores);
  const flood = ep.kind === "inundacion";
  const protocolo = n * 7_500;
  const inventario = protocolo + n * (flood ? 5_000 : 3_000) + (x.cedis ? (flood ? 650_000 : 450_000) : 0) + n * 1_500;
  const integral = inventario + 120_000 + 60_000;
  return { protocolo, inventario, integral, n, x };
}

export function retailWorldCase2(s: RetailState, ep: WorldEpisode): RCase {
  const { protocolo, inventario, integral, n, x } = retailPrepCost(s, ep);
  const red = isRed(ep.sites);
  const groups = x.list.flatMap((e) => e.site.groups ?? []);
  const flood = ep.kind === "inundacion";
  const base: Omit<RCase, "options"> = {
    id: caseIdOf(ep), area: "operacion", from: "operaciones", minDay: 0, safety: true,
    subject: ep.status === "pronostico" ? `${ep.name}: ${x.stores ? `${x.stores} tiendas` : "el CEDIS"} en la zona de riesgo` : `${ep.name}: ${x.stores ? `${x.stores} tiendas` : "el CEDIS"} afectados`,
    body: () => intro2(ep, s.templateId, s.day),
    data: () => [["Fuente", ep.source.name], ["Estado", ep.status === "pronostico" ? "Amenaza confirmada (puede cambiar)" : "Ya ocurrió"], ["Tiendas expuestas", String(x.stores)], ["Personas en la zona", x.people.toLocaleString("en-US")], ["CEDIS expuesto", x.cedis ? "Sí" : "No"]],
    lesson: lesson2(ep),
    requires: () => ok,
  };
  const closeBefore = (k: string, days: number): RetailCommand[] => groups.map((g): RetailCommand => ({ type: "modify", id: `${k}:cierre:${g}`, key: "demand", group: g, mult: 0.35, days }));
  if (ep.status === "pronostico") {
    const options: ROption[] = [
      { id: "protocolo", stance: "equilibrada", label: `Protocolo de ${KIND_NAME[ep.kind]}: personas e instalaciones`,
        detail: () => `Cubre: seguridad del personal y continuidad. ${flood ? "Bombas, sacos de arena y corte de energía en tiendas bajas" : "Protección de vidrios y anuncios, sacos de arena y combustible para las plantas"}; personal a casa con goce de sueldo. ${mx(protocolo)}. No mueve inventario ni avisa a proveedores, clientes o aseguradora.`,
        commands: (_s, k) => [{ type: "one_off", id: `${k}:prot`, label: `Protocolo de ${KIND_NAME[ep.kind]} en tiendas expuestas`, amount: protocolo, payInDays: 15 }, { type: "safety", id: `${k}:s`, delta: 0.01 }] },
      { id: "inventario", stance: "equilibrada", label: "Protocolo, más inventario y abasto",
        detail: () => `Además del protocolo: retirar perecederos, subir mercancía${x.cedis ? " y sacar inventario del CEDIS" : ""}, y adelantar surtido con proveedores. ${mx(inventario)} y un día de venta reducida antes del paso. No cubre clientes ni caja.`,
        commands: (_s, k) => [{ type: "one_off", id: `${k}:prot`, label: "Protocolo, protección de inventario y surtido adelantado", amount: inventario, payInDays: 15 }, ...closeBefore(k, 1), { type: "safety", id: `${k}:s`, delta: 0.01 }] },
      { id: "integral", stance: "prudente", label: "Plan completo de seis frentes",
        detail: () => `Personal, continuidad, inventario, proveedores, clientes (aviso y plan de reapertura) y caja (pólizas revisadas, evidencia e inventario documentado para el seguro). ${mx(integral)} y dos días de venta reducida antes del paso.`,
        commands: (_s, k) => [{ type: "one_off", id: `${k}:prot`, label: "Plan completo ante el fenómeno (seis frentes)", amount: integral, payInDays: 15 }, ...closeBefore(k, 2), { type: "relation", id: `${k}:st`, key: "staff", delta: 0.03 }, { type: "relation", id: `${k}:cl`, key: "clients", delta: 0.01 }, { type: "safety", id: `${k}:s`, delta: 0.02 }] },
      { id: "monitorear", stance: "arriesgada", label: "Monitorear y operar normal", detail: () => "Sin gasto hoy. Si llega con fuerza, ningún frente está cubierto.", commands: () => [] },
    ];
    if (red) options.push({ id: "abrir_roja", stance: "arriesgada", label: "Mantener abiertas con personal las tiendas en zona roja", blocked: `Con ${flood ? "agua subiendo" : "vientos de huracán"}, tener personal atendiendo pone vidas en riesgo. No es una decisión de negocio disponible.`, detail: () => "", commands: () => [] });
    void n;
    return { ...base, options };
  }
  const insp = n * 3_500;
  const options: ROption[] = [
    { id: "inspeccion", stance: "equilibrada", label: flood ? "Limpieza y revisión eléctrica antes de reabrir" : "Inspección estructural antes de reabrir",
      detail: () => `Cubre: seguridad del personal y continuidad. Reabren en un día. ${mx(insp)}. No cubre proveedores, clientes ni el reclamo al seguro.`,
      commands: (_s, k) => [{ type: "one_off", id: `${k}:insp`, label: "Revisión de tiendas antes de reabrir", amount: insp, payInDays: 15 }, ...groups.map((g): RetailCommand => ({ type: "modify", id: `${k}:dia:${g}`, key: "demand", group: g, mult: 0.7, days: 1 })), { type: "safety", id: `${k}:s`, delta: 0.01 }] },
    { id: "apoyo", stance: "prudente", label: "Revisión, apoyo al personal y plan de recuperación",
      detail: () => `Además de la revisión: apoyo a las familias del personal, surtido de emergencia, aviso a clientes y reclamo documentado al seguro. ${mx(insp + x.people * 1_800 + 150_000)}.`,
      commands: (_s, k) => [{ type: "one_off", id: `${k}:insp`, label: "Revisión, apoyo al personal y plan de recuperación", amount: insp + x.people * 1_800 + 150_000, payInDays: 15 }, ...groups.map((g): RetailCommand => ({ type: "modify", id: `${k}:dia:${g}`, key: "demand", group: g, mult: 0.7, days: 1 })), { type: "relation", id: `${k}:st`, key: "staff", delta: 0.04 }, { type: "relation", id: `${k}:cl`, key: "clients", delta: 0.02 }, { type: "safety", id: `${k}:s`, delta: 0.02 }] },
    { id: "reabrir", stance: "arriesgada", label: "Reabrir de inmediato con revisión visual", detail: () => "Sin gasto ni días cerrados. Ningún frente queda cubierto y el personal nota la prisa.", commands: (_s, k) => [{ type: "safety", id: `${k}:s`, delta: -0.03 }, { type: "relation", id: `${k}:st`, key: "staff", delta: -0.03 }] },
  ];
  if (red) options[2] = { ...options[2], blocked: `Donde ${flood ? "entró el agua" : "hubo sacudida fuerte"}, reabrir sin revisión pone en riesgo a clientes y personal. No es una decisión de negocio disponible.`, detail: () => "" };
  return { ...base, options };
}

export function retailImpact2(s: RetailState, ep: WorldEpisode, optionId: string | null): Impact2<RetailCommand> {
  const z = outcomeOf(ep) ?? {};
  const only = onlyOf(ep);
  const fronts = only ? [] : frontsOf(ep, optionId);
  const has = (f: Front) => fronts.includes(f);
  const inevOnly = only === "inevitable";
  const observed = ep.status === "observado";
  const k = `w:${ep.id}:imp`;
  const cmds: RetailCommand[] = [];
  const parts = { inevitable: [] as string[], evitable: [] as string[], future: [] as string[] };
  let repInev = 0, repExtra = 0, merma = 0, stores = 0, maxDays = 0;
  let red = false;
  for (const { site, zone } of sitesIn(s.templateId, z)) {
    const r = ruleOf(ep.kind, zone);
    if (!r) continue;
    if (zone === "roja") red = true;
    if (site.kind === "cedis") {
      const big = zone === "roja";
      cmds.push({ type: "modify", id: `${k}:log`, key: "logistics", mult: big ? 1.2 : 1.08, days: big ? 5 : 3 });
      repInev += big ? 1_000_000 : 250_000;
      if (!inevOnly) {
        if (!has("continuidad")) { cmds.push({ type: "modify", id: `${k}:log2`, key: "logistics", mult: big ? 1.2 : 1.08, days: big ? 5 : 2, inDays: big ? 5 : 3 }); repExtra += big ? 1_500_000 : 350_000; }
        if (!has("inventario") && !observed) merma += (big ? 1_800_000 : 400_000) * (ep.kind === "inundacion" ? 1.5 : 1);
        if (!has("proveedores")) cmds.push({ type: "modify", id: `${k}:log3`, key: "logistics", mult: 1.15, days: 7, inDays: big ? 5 : 3 });
      }
      continue;
    }
    for (const gid of site.groups ?? []) {
      const g = s.groups.find((x) => x.id === gid);
      const n = g ? storesOpen(s, g) : 0;
      if (!n) continue;
      stores += n;
      const d1 = r.inevDays;
      const closed = ep.kind === "sismo" ? 0.3 : 0.15;
      cmds.push({ type: "modify", id: `${k}:d1:${gid}`, key: "demand", group: gid, mult: closed, days: d1 });
      repInev += n * r.rInev;
      if (observed) merma += n * r.merma; // ya ocurrió: la mercancía dañada es inevitable
      let reopen = d1;
      if (!inevOnly) {
        if (!has("continuidad")) { cmds.push({ type: "modify", id: `${k}:d2:${gid}`, key: "demand", group: gid, mult: closed, days: r.extraDays, inDays: d1 }); repExtra += n * r.rExtra; reopen += r.extraDays; }
        if (!has("inventario") && !observed) merma += n * r.merma;
        if (!has("proveedores")) cmds.push({ type: "modify", id: `${k}:anaquel:${gid}`, key: "demand", group: gid, mult: zone === "roja" ? 0.85 : 0.92, days: zone === "roja" ? 5 : 3, inDays: reopen });
        if (!has("clientes") && zone === "roja") cmds.push({ type: "modify", id: `${k}:cl:${gid}`, key: "demand", group: gid, mult: 0.97, days: 30, inDays: reopen + 5 });
      }
      maxDays = Math.max(maxDays, reopen);
    }
  }
  const lbl = ep.mode === "ejercicio" ? "Ejercicio hipotético" : "Evento real, impacto simulado";
  parts.inevitable.push(`${stores ? `${stores} tiendas` : "La operación"} con venta mínima ${daysTxt(Math.max(1, ...sitesIn(s.templateId, z).map((x) => ruleOf(ep.kind, x.zone)?.inevDays ?? 0)))} y reparaciones inevitables por ${mx(repInev)}${observed && merma ? ` y mercancía dañada por ${mx(merma)}` : ""}.`);
  if (merma) cmds.push({ type: "one_off", id: `${k}:merma`, label: `Mercancía perdida por ${ep.name}`, amount: Math.round(merma), payInDays: 1 });
  if (repInev) cmds.push({ type: "one_off", id: `${k}:rep`, label: `Reparaciones por ${ep.name}`, amount: Math.round(repInev), payInDays: 30 });
  if (repExtra) cmds.push({ type: "one_off", id: `${k}:rep2`, label: `Reparaciones adicionales por ${ep.name} (instalaciones sin asegurar)`, amount: Math.round(repExtra), payInDays: 30 });
  if (!inevOnly) {
    if (!has("continuidad") && repExtra) parts.evitable.push(`Sin asegurar instalaciones: más días cerrados y ${mx(repExtra)} de reparaciones adicionales.`);
    if (!has("inventario") && !observed && merma) parts.evitable.push(`Sin proteger inventario: merma de ${mx(merma)}.`);
    if (!has("proveedores")) parts.evitable.push("Sin adelantar surtido: anaqueles incompletos los primeros días tras reabrir.");
    if (!has("clientes") && red) parts.future.push("Sin aviso a clientes: una parte compra en otro lado durante un mes.");
    if (red && !has("personal")) {
      cmds.push({ type: "relation", id: `${k}:st`, key: "staff", delta: -0.06 }, { type: "safety", id: `${k}:s`, delta: -0.04 }, { type: "modify", id: `${k}:rot`, key: "turnover", mult: 1.15, days: 90, inDays: 7 });
      parts.future.push("Personal expuesto durante el fenómeno: baja la confianza del equipo y sube la rotación tres meses.");
    }
  }
  // Seguro (H-S1). En el contrafactual inevitable, la póliza paga lo básico de las reparaciones inevitables.
  const rep = repInev + repExtra;
  const plan = !inevOnly && has("caja");
  const paid = Math.round(rep * (plan ? SEGURO_PLAN : SEGURO_BASE));
  if (paid > 0) cmds.push({ type: "one_off", id: `${k}:seguro`, label: `Pago del seguro por ${ep.name}`, amount: paid, payInDays: plan ? SEGURO_PLAN_DIAS : SEGURO_BASE_DIAS, account: "otros_ingresos" });
  if (paid > 0) parts.future.push(`El seguro paga ${mx(paid)} (${Math.round((plan ? SEGURO_PLAN : SEGURO_BASE) * 100)} % de las reparaciones) en ${plan ? SEGURO_PLAN_DIAS : SEGURO_BASE_DIAS} días${plan ? "" : ": sin evidencia ni pólizas revisadas el reclamo tarda y se reconoce menos"}.`);
  void maxDays;
  const covered = fronts.length ? fronts.map((f) => FRONT_LABEL[f].toLowerCase()).join(", ") : "ninguno";
  const text = `${lbl}: ${ep.name} llegó con fuerza a ${stores ? `${stores} tiendas` : "la operación"}. Parte inevitable: reparaciones por ${mx(repInev)}. Frentes cubiertos: ${covered}.${repExtra || (merma && !observed) ? ` Por lo no cubierto: ${[repExtra ? `${mx(repExtra)} de reparaciones adicionales` : "", merma && !observed ? `${mx(merma)} de mercancía perdida` : ""].filter(Boolean).join(" y ")}.` : ""}${paid ? ` El seguro paga ${mx(paid)} en ${plan ? SEGURO_PLAN_DIAS : SEGURO_BASE_DIAS} días.` : ""}`;
  return { commands: cmds, text, parts, fronts };
}

// ─────────────────────────────────────────────────────────────── acería
const big = (s: SteelState) => TEMPLATES_V2[s.templateId].kind === "integrada";
const sz = (s: SteelState, a: number, b: number) => (big(s) ? b : a);
const pick = (s: SteelState, v: [number, number]) => (big(s) ? v[1] : v[0]);

export function steelPrepCost(s: SteelState, ep: WorldEpisode) {
  const list = sitesIn(s.templateId, ep.sites);
  const bodega = list.some((x) => x.site.kind === "bodega");
  const plantOrPatio = list.some((x) => x.site.kind === "planta" || x.site.kind === "patio");
  const protocolo = (plantOrPatio ? sz(s, 90_000, 350_000) : 0) + (bodega ? 120_000 : 0);
  const inventario = protocolo + (plantOrPatio ? sz(s, 70_000, 210_000) : 0) + (bodega ? 260_000 : 0);
  const integral = inventario + sz(s, 40_000, 120_000) + 60_000;
  return { protocolo, inventario, integral, list, bodega, plantOrPatio };
}

export function steelWorldCase2(s: SteelState, ep: WorldEpisode): SCase {
  const { protocolo, inventario, integral, list, bodega, plantOrPatio } = steelPrepCost(s, ep);
  const plantZone = ep.sites.planta ?? "ninguna";
  const people = steelHeadcount(s);
  const flood = ep.kind === "inundacion";
  const base: Omit<SCase, "options"> = {
    id: caseIdOf(ep), area: "seguridad", from: "supervisor", minDay: 0, safety: true,
    subject: ep.status === "pronostico" ? `${ep.name}: ${list.map((x) => x.site.label).join(" y ")} en la zona de riesgo` : `${ep.name}: ${list.map((x) => x.site.label).join(" y ")} afectados`,
    body: () => intro2(ep, s.templateId, s.day),
    data: () => [["Fuente", ep.source.name], ["Estado", ep.status === "pronostico" ? "Amenaza confirmada (puede cambiar)" : "Ya ocurrió"], ["Sedes en zona", String(list.length)], ["Personas en planta", String(people)], ...(bodega ? [["Ventas que salen de la sede expuesta", `${Math.round((list.find((x) => x.site.kind === "bodega")?.site.salesShare ?? 0) * 100)} %`] as [string, string]] : [])],
    lesson: lesson2(ep),
    requires: () => ok,
  };
  const paro = (k: string): SteelCommand[] => (plantZone === "roja" || plantZone === "naranja" ? [{ type: "downtime", id: `${k}:paro`, days: 1 }] : []);
  if (ep.status === "pronostico") {
    const options: SOption[] = [
      { id: "protocolo", stance: "equilibrada", label: `Protocolo de ${KIND_NAME[ep.kind]}: personas e instalaciones`,
        detail: () => `Cubre: seguridad del personal y continuidad. ${plantOrPatio ? (flood ? "Bordos y bombas, subestación protegida y hornos vaciados si sube el agua" : "Techumbres, subestación y chatarra suelta aseguradas; hornos vaciados si se va la luz") : ""}${bodega ? " En la bodega: personal a casa y nave asegurada." : ""} ${mx(protocolo)}. No mueve inventario ni avisa a proveedores, clientes o aseguradora.`,
        commands: (_s, k) => [{ type: "one_off", id: `${k}:prot`, label: `Protocolo de ${KIND_NAME[ep.kind]}`, amount: protocolo, payInDays: 15 }, { type: "safety", id: `${k}:s`, delta: 0.01 }] },
      { id: "inventario", stance: "equilibrada", label: "Protocolo, más inventario y abasto",
        detail: () => `Además del protocolo: ${bodega ? "sacar la varilla de la bodega a tierra alta, " : ""}cubrir producto terminado y asegurar chatarra con proveedores alternos. ${mx(inventario)}${plantOrPatio ? " y un día de paro controlado" : ""}. No cubre clientes ni caja.`,
        commands: (_s, k) => [{ type: "one_off", id: `${k}:prot`, label: "Protocolo, protección de inventario y abasto", amount: inventario, payInDays: 15 }, ...paro(k), { type: "safety", id: `${k}:s`, delta: 0.02 }] },
      { id: "integral", stance: "prudente", label: "Plan completo de seis frentes",
        detail: () => `Personal, continuidad, inventario, proveedores, clientes (reprogramar entregas con aviso) y caja (pólizas revisadas y evidencia documentada para el seguro). ${mx(integral)}${plantOrPatio ? " y un día de paro controlado" : ""}.`,
        commands: (_s, k) => [{ type: "one_off", id: `${k}:prot`, label: "Plan completo ante el fenómeno (seis frentes)", amount: integral, payInDays: 15 }, ...paro(k), { type: "relation", id: `${k}:st`, key: "staff", delta: 0.02 }, { type: "relation", id: `${k}:cl`, key: "clients", delta: 0.01 }, { type: "safety", id: `${k}:s`, delta: 0.03 }] },
      { id: "monitorear", stance: "arriesgada", label: "Monitorear y seguir operando", detail: () => "Sin gasto hoy. Si llega con fuerza, ningún frente está cubierto.", commands: () => [] },
    ];
    if (plantZone === "roja") options.push({ id: "fundir", stance: "arriesgada", label: "Seguir fundiendo durante el fenómeno", blocked: "Un corte de energía o agua con metal líquido en el horno puede provocar una explosión. No es una decisión de negocio disponible.", detail: () => "", commands: () => [] });
    return { ...base, options };
  }
  const insp = sz(s, 60_000, 200_000) + (bodega ? 40_000 : 0);
  const options: SOption[] = [
    { id: "inspeccion", stance: "equilibrada", label: flood ? "Limpieza y revisión eléctrica antes de volver a operar" : "Revisión estructural antes de volver a operar",
      detail: () => `Cubre: seguridad del personal y continuidad. ${mx(insp)}${plantOrPatio ? " y un día sin producir" : ""}. No cubre proveedores, clientes ni el reclamo al seguro.`,
      commands: (_s, k) => [{ type: "one_off", id: `${k}:insp`, label: "Revisión antes de volver a operar", amount: insp, payInDays: 15 }, ...paro(k), { type: "safety", id: `${k}:s`, delta: 0.01 }] },
    { id: "apoyo", stance: "prudente", label: "Revisión, apoyo al personal y plan de recuperación",
      detail: () => `Además de la revisión: apoyo a las familias, chatarra de proveedores alternos, entregas reprogramadas con aviso y reclamo documentado al seguro. ${mx(insp + people * 1_800 + 120_000)}.`,
      commands: (_s, k) => [{ type: "one_off", id: `${k}:insp`, label: "Revisión, apoyo al personal y plan de recuperación", amount: insp + people * 1_800 + 120_000, payInDays: 15 }, ...paro(k), { type: "relation", id: `${k}:st`, key: "staff", delta: 0.04 }, { type: "relation", id: `${k}:cl`, key: "clients", delta: 0.01 }, { type: "safety", id: `${k}:s`, delta: 0.02 }] },
    { id: "reabrir", stance: "arriesgada", label: "Volver a operar de inmediato", detail: () => "Sin días perdidos. Ningún frente queda cubierto y el personal nota la prisa.", commands: (_s, k) => [{ type: "safety", id: `${k}:s`, delta: -0.04 }, { type: "relation", id: `${k}:st`, key: "staff", delta: -0.03 }] },
  ];
  if (isRed(ep.sites)) options[2] = { ...options[2], blocked: "Operar en naves que no se han revisado tras un golpe fuerte pone vidas en riesgo. No es una decisión de negocio disponible.", detail: () => "" };
  return { ...base, options };
}

export function steelImpact2(s: SteelState, ep: WorldEpisode, optionId: string | null): Impact2<SteelCommand> {
  const z = outcomeOf(ep) ?? {};
  const only = onlyOf(ep);
  const fronts = only ? [] : frontsOf(ep, optionId);
  const has = (f: Front) => fronts.includes(f);
  const inevOnly = only === "inevitable";
  const observed = ep.status === "observado";
  const k = `w:${ep.id}:imp`;
  const cmds: SteelCommand[] = [];
  const parts = { inevitable: [] as string[], evitable: [] as string[], future: [] as string[] };
  let repInev = 0, repExtra = 0, stock = 0, down = 0, downExtra = 0, shut = 0, shutShare = 0, shutExtra = 0;
  let red = false;
  for (const { site, zone } of sitesIn(s.templateId, z)) {
    const r = ruleOf(ep.kind, zone);
    if (!r) continue;
    const isR = zone === "roja";
    if (isR) red = true;
    if (site.kind === "planta") {
      down = Math.max(down, r.inevDays);
      repInev += pick(s, r.pInev);
      if (observed) stock += pick(s, r.pStock);
      if (!inevOnly) {
        if (!has("continuidad")) { downExtra = Math.max(downExtra, r.extraDays); repExtra += pick(s, r.pExtra); }
        if (!has("inventario") && !observed) stock += pick(s, r.pStock);
      }
    } else if (site.kind === "patio") {
      cmds.push({ type: "modify", id: `${k}:chatarra`, key: "scrapPrice", mult: isR ? 1.02 : 1.01, days: 10 });
      repInev += isR ? 300_000 : 80_000;
      if (!inevOnly && !has("continuidad")) repExtra += isR ? 600_000 : 150_000;
    } else if (site.kind === "bodega") {
      const share = site.salesShare ?? 0;
      const days = r.inevDays + 1;
      shut = Math.max(shut, days); shutShare = Math.max(shutShare, share);
      cmds.push({ type: "modify", id: `${k}:sur`, key: "demand", mult: Math.round((1 - share) * 1000) / 1000, days });
      repInev += isR ? 400_000 : 100_000;
      if (observed) stock += (site.stockValue ?? 0) * (isR ? 0.3 : 0.08);
      if (!inevOnly) {
        if (!has("continuidad")) { shutExtra = Math.max(shutExtra, r.extraDays + 1); cmds.push({ type: "modify", id: `${k}:sur2`, key: "demand", mult: Math.round((1 - share) * 1000) / 1000, days: r.extraDays + 1, inDays: days }); }
        if (!has("inventario") && !observed) stock += (site.stockValue ?? 0) * (isR ? 0.3 : 0.08);
        if (!has("clientes") && isR) cmds.push({ type: "modify", id: `${k}:sur3`, key: "demand", mult: Math.round((1 - share * 0.2) * 1000) / 1000, days: 30, inDays: days + 3 });
      }
    }
  }
  if (down) cmds.push({ type: "downtime", id: `${k}:paro`, days: down });
  if (downExtra) cmds.push({ type: "downtime", id: `${k}:paro2`, days: down + downExtra });
  if (stock) cmds.push({ type: "one_off", id: `${k}:stock`, label: `Producto dañado por ${ep.name}`, amount: Math.round(stock), payInDays: 1 });
  if (repInev) cmds.push({ type: "one_off", id: `${k}:rep`, label: `Reparaciones por ${ep.name}`, amount: Math.round(repInev), payInDays: 30 });
  if (repExtra) cmds.push({ type: "one_off", id: `${k}:rep2`, label: `Reparaciones adicionales por ${ep.name} (instalaciones sin asegurar)`, amount: Math.round(repExtra), payInDays: 30 });
  parts.inevitable.push(`${down ? `${daysTxt(down)} sin producir, ` : ""}${shut ? `${daysTxt(shut)} sin surtir desde la sede inundada (${Math.round(shutShare * 100)} % de las entregas), ` : ""}reparaciones inevitables por ${mx(repInev)}${observed && stock ? ` y producto dañado por ${mx(stock)}` : ""}.`);
  if (!inevOnly) {
    if (shutExtra) parts.evitable.push(`Sin asegurar la continuidad: ${daysTxt(shutExtra)} más sin surtir desde la sede afectada.`);
    if (downExtra || repExtra) parts.evitable.push(`Sin asegurar instalaciones: ${downExtra ? `${daysTxt(downExtra)} más sin producir y ` : ""}${mx(repExtra)} de reparaciones adicionales.`);
    if (!has("inventario") && !observed && stock) parts.evitable.push(`Sin proteger inventario: producto dañado por ${mx(stock)}.`);
    if (!has("proveedores") && red) { cmds.push({ type: "modify", id: `${k}:chat2`, key: "scrapPrice", mult: 1.04, days: 20, inDays: down }); parts.evitable.push("Sin asegurar proveedores: chatarra de emergencia 4 % más cara por 20 días."); }
    if (!has("clientes") && red) { cmds.push({ type: "relation", id: `${k}:cl`, key: "clients", delta: -0.04 }, { type: "modify", id: `${k}:dem`, key: "demand", mult: 0.97, days: 30, inDays: down + downExtra }); parts.future.push("Sin aviso a clientes: entregas incumplidas sin explicación; compran 3 % menos durante un mes."); }
    if (red && !has("personal")) { cmds.push({ type: "safety", id: `${k}:s`, delta: -0.06 }, { type: "relation", id: `${k}:st`, key: "staff", delta: -0.05 }); parts.future.push("Personal expuesto durante el fenómeno: baja la seguridad y la confianza del equipo."); }
  }
  const rep = repInev + repExtra;
  const plan = !inevOnly && has("caja");
  const paid = Math.round(rep * (plan ? SEGURO_PLAN : SEGURO_BASE));
  if (paid > 0) cmds.push({ type: "one_off", id: `${k}:seguro`, label: `Pago del seguro por ${ep.name}`, amount: paid, payInDays: plan ? SEGURO_PLAN_DIAS : SEGURO_BASE_DIAS, account: "otros_ingresos" });
  if (paid > 0) parts.future.push(`El seguro paga ${mx(paid)} (${Math.round((plan ? SEGURO_PLAN : SEGURO_BASE) * 100)} % de las reparaciones) en ${plan ? SEGURO_PLAN_DIAS : SEGURO_BASE_DIAS} días.`);
  const lbl = ep.mode === "ejercicio" ? "Ejercicio hipotético" : "Evento real, impacto simulado";
  const covered = fronts.length ? fronts.map((f) => FRONT_LABEL[f].toLowerCase()).join(", ") : "ninguno";
  const text = `${lbl}: ${ep.name} llegó con fuerza a la operación. Parte inevitable: ${down ? `${daysTxt(down)} sin producir, ` : ""}${shut ? `${daysTxt(shut)} sin surtir desde la sede afectada, ` : ""}reparaciones por ${mx(repInev)}. Frentes cubiertos: ${covered}.${repExtra || (stock && !observed) ? ` Por lo no cubierto: ${[downExtra ? `${daysTxt(downExtra)} más sin producir` : "", repExtra ? `${mx(repExtra)} de reparaciones adicionales` : "", stock && !observed ? `${mx(stock)} de producto dañado` : ""].filter(Boolean).join(", ")}.` : ""}${paid ? ` El seguro paga ${mx(paid)} en ${plan ? SEGURO_PLAN_DIAS : SEGURO_BASE_DIAS} días.` : ""}`;
  return { commands: cmds, text, parts, fronts };
}
