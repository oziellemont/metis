/**
 * Genera supabase/email-templates/vista-previa-ceo.html con TODOS los correos de mêtis CEO
 * usando una temporada simulada. Uso:  PREVIEW=1 npx vitest run scripts/vista-previa-ceo.test.ts
 */
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { DAY, decide, entries, newState } from "../src/lib/ceo/engine";
import { jobsFor, type Job, type Sent } from "../src/lib/ceo/schedule";
import { renderJob } from "../src/lib/ceo/mailer";
import { esc } from "../src/lib/ceo/emails";
import type { CeoState } from "../src/lib/ceo/types";

const T0 = Date.UTC(2026, 9, 5, 15, 0, 0);
const LABEL: Record<string, string> = { welcome: "Bienvenida (al registrarse)", case: "Asunto nuevo", reminder: "Recordatorio: está por vencer", digest: "Resumen de la mañana", streak: "Racha en riesgo", nudge: "Preguntan por ti (inactividad)", season: "Cierre de temporada" };
const WHEN: Record<string, string> = {
  welcome: "En cuanto conecta su cuenta (una vez).",
  case: "Cuando le llega cada asunto, a la hora exacta, firmado por el personaje.",
  reminder: "3 h antes de que venza un asunto pendiente (o al cierre de su horario si vence de noche).",
  digest: "Desde el día 2, una hora antes de su horario (7:00 am por defecto).",
  streak: "En la última hora de su horario si hoy no ha decidido nada y tiene racha.",
  nudge: "Si lleva 2+ días sin entrar y tiene pendientes. Máximo 3, cada 3 días.",
  season: "Al terminar la temporada de 7 días.",
};

it.runIf(process.env.PREVIEW === "1")("vista previa", () => {
  const picks: { job: Job; html: string; subject: string; from: string; extra?: string }[] = [];
  const seenKinds = new Map<string, number>();
  const want = (k: string) => (seenKinds.get(k) ?? 0) < (k === "case" ? 4 : 1);
  const add = (j: Job, s: CeoState, t: number) => {
    if (!want(j.kind)) return;
    if (j.kind === "case" && picks.some((p) => p.job.kind === "case" && (p.job as { entry: { item: { channel: string } } }).entry.item.channel === j.entry.item.channel)) return;
    seenKinds.set(j.kind, (seenKinds.get(j.kind) ?? 0) + 1);
    const m = renderJob(j, s, "Oziel Leal", "https://metisalign.app", t);
    picks.push({ job: j, html: m.html, subject: m.subject, from: m.fromName });
  };
  // Jugador A: juega poco (salen recordatorios, racha, inactividad)
  let s: CeoState = { ...newState(), name: "Oziel Leal", alias: "oziel", startedAt: T0, lastActiveAt: T0 };
  let sent: Sent = {};
  for (let t = T0; t < T0 + 9 * DAY; t += 15 * 60_000) {
    if (t < T0 + 1.3 * DAY) { for (const e of entries(s, t)) if (e.status === "pendiente" && t - e.arrivesAt > 2 * 3_600_000) s = decide(s, e.item.id, e.item.options[1]?.id ?? e.item.options[0].id, t); s = { ...s, lastActiveAt: t }; }
    for (const j of jobsFor(s, sent, t)) { sent[j.key] = t; add(j, s, t); }
  }
  // Jugador B: decide todo (cierre de temporada)
  s = { ...newState(), name: "Oziel Leal", alias: "oziel2", startedAt: T0, lastActiveAt: T0 }; sent = {};
  for (let t = T0; t < T0 + 10 * DAY; t += 15 * 60_000) {
    for (const e of entries(s, t)) if (e.status === "pendiente") s = decide(s, e.item.id, e.item.options[0].id, t);
    s = { ...s, lastActiveAt: t };
    for (const j of jobsFor(s, sent, t)) { sent[j.key] = t; add(j, s, t); }
  }
  const order = ["welcome", "case", "digest", "reminder", "streak", "nudge", "season"];
  picks.sort((a, b) => order.indexOf(a.job.kind) - order.indexOf(b.job.kind));
  const q = esc;
  const sections = picks.map((p) => `<section><h2>${LABEL[p.job.kind]}${p.job.kind === "case" ? ` · ${(p.job as { entry: { item: { channel: string } } }).entry.item.channel}` : ""}</h2>
<p><b>De:</b> ${q(p.from)} (recordatorios@metisalign.mx)<br><b>Asunto:</b> ${q(p.subject)}<br><b>Cuándo llega:</b> ${WHEN[p.job.kind]}</p>
<iframe srcdoc="${q(p.html)}"></iframe></section>`).join("\n");
  writeFileSync("supabase/email-templates/vista-previa-ceo.html", `<!DOCTYPE html><html lang="es"><meta charset="utf-8"><title>mêtis CEO · correos</title>
<style>body{font-family:Arial,sans-serif;background:#e9ebf3;margin:0;padding:24px;color:#171A3A}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(560px,1fr));gap:24px}section{background:#fff;border-radius:16px;padding:16px}h2{margin:0 0 6px;font-size:16px}p{margin:0 0 10px;font-size:13px;line-height:19px;color:#475569}iframe{width:100%;height:900px;border:1px solid #E8EAF4;border-radius:12px}</style>
<h1 style="font-size:20px">Correos de mêtis CEO (metisalign.app)</h1><p>Generados con una temporada simulada. Se mandan solos desde el servidor; nada que pegar en Supabase.</p><main>${sections}</main></html>`);
  console.log("OK", picks.map((p) => p.job.kind).join(","));
}, 60_000);
