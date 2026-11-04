/**
 * WhatsApp real (Meta Cloud API): candados, sin duplicados, horario y pausa, contenido del mensaje y webhook.
 */
import { describe, expect, it } from "vitest";
import { DAY, H, entries, newState } from "./engine";
import { pauseCareer } from "./cadence";
import { companyById } from "./companies";
import { jobsFor } from "./schedule";
import { resolveFlags, ALL_OFF, FLAG_KEYS } from "./flags";
import {
  allowlisted, channelOf, e164, emailForCases, isStop, parseWebhook, waActive, waEligible, waJobsFor, waKey, waMonthlyCost,
  waMsgFor, waOtpPayload, waParam, waPayload, STATUS_RANK, type WaPlayer,
} from "./whatsapp";
import type { CeoState } from "./types";

const T = Date.UTC(2026, 9, 1, 14); // 8:00 en Monterrey
const run = (over: Partial<CeoState> = {}): CeoState => {
  const s = newState();
  return { ...s, name: "Ana Torres", alias: "Ana T.", company: "cumbre", startedAt: T, savedAt: T, lastActiveAt: T, ...over, settings: { ...s.settings, email: "ana@x.mx", ...(over.settings ?? {}) } };
};
/** Primer momento (en horario) con un asunto recién llegado. */
function firstArrival(s: CeoState) {
  const e = entries(s, T + 3 * DAY).filter((x) => x.arrivesAt > T).sort((a, b) => a.arrivesAt - b.arrivesAt)[0];
  return e.arrivesAt + 60_000;
}
const ON: WaPlayer = { wa_phone: "+528112345678", wa_verified_at: "2026-11-01T10:00:00Z", wa_consent_at: "2026-11-01T10:01:00Z", wa_revoked_at: null, wa_channel: "ambos" };

describe("WhatsApp · candados", () => {
  it("el interruptor existe y arranca apagado; con «solo invitados» hay que prenderlo por jugador", () => {
    expect(FLAG_KEYS).toContain("whatsapp");
    expect(ALL_OFF.whatsapp).toBe(false);
    const g = [{ key: "whatsapp", enabled: false, value: { perPlayer: true } }];
    expect(resolveFlags({ global: g }).whatsapp).toBe(false);
    expect(resolveFlags({ global: g, player: { whatsapp: true } }).whatsapp).toBe(true);
    expect(resolveFlags({ global: null }).whatsapp).toBe(false);
  });
  it("lista autorizada: vacía = nadie; «*» = todos; compara en formato internacional", () => {
    expect(allowlisted("+528112345678", "")).toBe(false);
    expect(allowlisted("+528112345678", undefined)).toBe(false);
    expect(allowlisted("8112345678", "+52 81 1234 5678")).toBe(false); // con espacios se separa: no es el mismo número
    expect(allowlisted("8112345678", "+528112345678, +525511112222")).toBe(true);
    expect(allowlisted("+525599990000", "+528112345678")).toBe(false);
    expect(allowlisted("+525599990000", "*")).toBe(true);
  });
  it("activo solo con número verificado + consentimiento vigente + canal WhatsApp o ambos", () => {
    expect(waActive(ON)).toBe(true);
    expect(waActive({ ...ON, wa_verified_at: null })).toBe(false);
    expect(waActive({ ...ON, wa_consent_at: null })).toBe(false);
    expect(waActive({ ...ON, wa_channel: "email" })).toBe(false);
    expect(waActive({ ...ON, wa_channel: "cualquier cosa" })).toBe(false);
    expect(waActive({ ...ON, wa_revoked_at: "2026-11-02T00:00:00Z" })).toBe(false);
    // revocó y volvió a consentir después: activo otra vez
    expect(waActive({ ...ON, wa_revoked_at: "2026-11-01T09:00:00Z" })).toBe(true);
  });
  it("el campo viejo «notify_whatsapp» no abre nada; sin interruptor o fuera de la lista tampoco", () => {
    const legacy = { phone: "+528112345678", notify_whatsapp: true } as unknown as WaPlayer;
    expect(waEligible(legacy, true, "*")).toBe(false);
    expect(waEligible(ON, false, "*")).toBe(false);
    expect(waEligible(ON, true, "")).toBe(false);
    expect(waEligible(ON, true, "+528112345678")).toBe(true);
  });
  it("canal: por omisión correo; «solo WhatsApp» apaga el correo de asuntos solo si WhatsApp está de verdad activo", () => {
    expect(channelOf({})).toBe("email");
    expect(emailForCases({ ...ON, wa_channel: "whatsapp" }, true)).toBe(false);
    expect(emailForCases({ ...ON, wa_channel: "whatsapp" }, false)).toBe(true);
    expect(emailForCases(ON, true)).toBe(true);
  });
});

describe("WhatsApp · mismos avisos que el correo, sin duplicados, en horario y nunca en pausa", () => {
  it("los asuntos que llegan generan aviso con clave propia «wa:»; lo ya enviado no se repite", () => {
    const s = run();
    const at = firstArrival(s);
    const jobs = waJobsFor(s, {}, at);
    expect(jobs.length).toBeGreaterThan(0);
    for (const j of jobs) { expect(j.key.startsWith("wa:")).toBe(true); expect(["case", "reminder"]).toContain(j.kind); }
    const sent = Object.fromEntries(jobs.map((j) => [j.key, at]));
    expect(waJobsFor(s, sent, at + 60_000).filter((j) => sent[j.key])).toEqual([]);
  });
  it("el correo ya enviado no bloquea el WhatsApp, ni al revés (claves separadas)", () => {
    const s = run();
    const at = firstArrival(s);
    const mail = jobsFor(s, {}, at).filter((j) => j.kind === "case");
    const mailSent = Object.fromEntries(mail.map((j) => [j.key, at]));
    expect(waJobsFor(s, mailSent, at).map((j) => j.key)).toEqual(expect.arrayContaining(mail.map((j) => waKey(j.key))));
    const waSent = Object.fromEntries(mail.map((j) => [waKey(j.key), at]));
    expect(jobsFor(s, { welcome: 1, ...waSent }, at).filter((j) => j.kind === "case").map((j) => j.key)).toEqual(mail.map((j) => j.key));
  });
  it("sin programados, bienvenida, resumen ni cierre por WhatsApp", () => {
    const s = run();
    for (let k = 0; k < 48; k++) for (const j of waJobsFor(s, {}, T + k * H)) expect(["case", "reminder"]).toContain(j.kind);
  });
  it("fuera del horario del jugador no sale nada", () => {
    const s = run({ settings: { ...newState().settings, windowStart: 9, windowEnd: 18 } });
    const night = Date.UTC(2026, 9, 2, 5); // 23:00 en Monterrey
    expect(waJobsFor(s, {}, night)).toEqual([]);
  });
  it("en vacaciones no sale nada", () => {
    const s = run();
    const at = firstArrival(s);
    const p = pauseCareer(s, at - 30_000);
    for (const d of [0, 0.5, 1, 3]) expect(waJobsFor(p, {}, at + d * DAY)).toEqual([]);
  });
});

describe("WhatsApp · contenido", () => {
  it("el mensaje dice quién escribe, su puesto, la empresa y que es la simulación MÊTIS, con enlace al asunto", () => {
    const s = run();
    const at = firstArrival(s);
    const job = waJobsFor(s, {}, at).find((j) => j.kind === "case")!;
    const pack = companyById("cumbre");
    const m = waMsgFor(pack, job, "https://www.metis.ceo")!;
    const it = (job as { entry: { item: { id: string; from: string } } }).entry.item;
    expect(m.preview).toMatch(/^Simulación MÊTIS/);
    expect(m.preview).toContain(pack.cast[it.from].name);
    expect(m.preview).toContain(pack.cast[it.from].role);
    expect(m.preview).toContain(pack.name);
    expect(m.preview).toContain(`https://www.metis.ceo/caso/${it.id}`);
    expect(m.button).toBe(it.id);
    for (const b of m.body) { expect(b).not.toMatch(/[\n\t]/); expect(b).not.toMatch(/ {2,}/); expect(b.length).toBeLessThanOrEqual(300); }
  });
  it("cuerpo de la Cloud API: plantilla con variables y botón con la parte variable del enlace", () => {
    const p = waPayload("+52 81 1234 5678", { template: "metis_asunto", body: ["a", "b"], button: "d2-x", preview: "" });
    expect(p.to).toBe("528112345678");
    expect(p.type).toBe("template");
    expect(JSON.stringify(p)).toContain('"sub_type":"url"');
    const o = waOtpPayload("+528112345678", "123456");
    expect(JSON.stringify(o)).toContain("123456");
  });
  it("waParam limpia saltos de línea, espacios dobles y HTML", () => {
    expect(waParam("Hola\n<b>equipo</b>   de  planta")).toBe("Hola equipo de planta");
    expect(waParam("x".repeat(400)).length).toBe(300);
  });
  it("e164: diez dígitos = México; rechaza basura", () => {
    expect(e164("81 1234 5678")).toBe("+528112345678");
    expect(e164("+1 (415) 555-0100")).toBe("+14155550100");
    expect(e164("123")).toBe("");
  });
});

describe("WhatsApp · webhook y costos", () => {
  it("lee estados de entrega con error y mensajes entrantes; ignora lo que no entiende", () => {
    const body = { entry: [{ changes: [{ value: {
      statuses: [{ id: "wamid.1", status: "delivered", timestamp: "1700000000" }, { id: "wamid.2", status: "failed", timestamp: "1700000001", errors: [{ code: 131026, title: "Message undeliverable" }] }, { id: "wamid.3", status: "raro" }],
      messages: [{ from: "528112345678", timestamp: "1700000002", text: { body: "BAJA" } }],
    } }] }] };
    const ev = parseWebhook(body);
    expect(ev).toHaveLength(3);
    expect(ev[1]).toMatchObject({ kind: "status", status: "failed", error: "131026 Message undeliverable" });
    expect(ev[2]).toMatchObject({ kind: "inbound", from: "+528112345678", text: "BAJA" });
    expect(parseWebhook(null)).toEqual([]);
    expect(parseWebhook({ entry: "x" })).toEqual([]);
  });
  it("BAJA / STOP dan de baja; otras palabras no", () => {
    for (const t of ["BAJA", "baja.", " Stop ", "alto", "cancelar"]) expect(isStop(t), t).toBe(true);
    for (const t of ["no me des de baja", "ok", ""]) expect(isStop(t), t).toBe(false);
  });
  it("los estados no retroceden (un «entregado» tardío no tapa un «leído»)", () => {
    expect(STATUS_RANK.read).toBeGreaterThan(STATUS_RANK.delivered);
    expect(STATUS_RANK.delivered).toBeGreaterThan(STATUS_RANK.sent);
  });
  it("costo mensual: utilidad USD 0.0085 por mensaje entregado en México", () => {
    expect(waMonthlyCost(100, 40, 0).usd).toBe(34);
    expect(waMonthlyCost(1000, 40, 0.1)).toEqual({ messages: 40100, usd: 340.85 });
  });
});
