"use client";
/**
 * Mapa de la organización: quién le reporta a quién y cómo se llevan.
 * Tú al centro; arriba el consejo, abajo tu comité y sus equipos, a los lados los actores externos.
 * Líneas: jerarquía (gris), alianza (índigo), tensión (coral punteada), influencia (tinta con flecha).
 */
import { useMemo, useState } from "react";
import clsx from "clsx";
import { avatarHex, firstName, personOf } from "@/lib/ceo/cast";
import type { CastId, CompanyPack, Tie } from "@/lib/ceo/types";

const W = 680, Hh = 450, CEO = { x: W / 2, y: 175 };
const R = 22;

type Pos = Record<string, { x: number; y: number }>;

function layout(pack: CompanyPack): Pos {
  const pos: Pos = { ceo: CEO };
  const people = Object.values(pack.cast);
  const consejo = people.filter((p) => p.group === "consejo");
  consejo.forEach((p, i) => { pos[p.id] = { x: W / 2 + (i - (consejo.length - 1) / 2) * 150, y: 52 }; });
  const comite = people.filter((p) => p.group === "comite");
  const gap = Math.min(140, (W - 80) / Math.max(1, comite.length));
  comite.forEach((p, i) => { pos[p.id] = { x: W / 2 + (i - (comite.length - 1) / 2) * gap, y: 290 }; });
  const equipo = people.filter((p) => p.group === "equipo");
  const byBoss: Record<string, string[]> = {};
  equipo.forEach((p) => { const b = p.reportsTo ?? "ceo"; (byBoss[b] ??= []).push(p.id); });
  for (const [boss, kids] of Object.entries(byBoss)) {
    if (boss === "ceo") { kids.forEach((id, i) => { pos[id] = { x: CEO.x + 105 + i * 70, y: CEO.y + 10 }; }); continue; }
    const b = pos[boss] ?? CEO;
    kids.forEach((id, i) => { pos[id] = { x: Math.max(40, Math.min(W - 40, b.x + (i - (kids.length - 1) / 2) * 62)), y: 400 }; });
  }
  const ext = people.filter((p) => p.group === "externo");
  ext.forEach((p, i) => {
    const left = i % 2 === 0;
    const row = Math.floor(i / 2);
    pos[p.id] = { x: left ? 52 : W - 52, y: 150 + row * 90 };
  });
  return pos;
}

const TIE_STYLE: Record<Tie["kind"], { stroke: string; dash?: string; label: string }> = {
  alianza: { stroke: "#4F3FE0", label: "Alianza" },
  tension: { stroke: "#F2545B", dash: "5 5", label: "Tensión" },
  influye: { stroke: "#171A3A", dash: "2 4", label: "Influye en" },
};

export function OrgMap({ pack, highlight, compact }: { pack: CompanyPack; highlight?: CastId[]; compact?: boolean }) {
  const pos = useMemo(() => layout(pack), [pack]);
  const [sel, setSel] = useState<CastId | null>(null);
  const hl = new Set(highlight ?? []);
  const focus = sel ? new Set([sel, ...pack.ties.filter((t) => t.a === sel || t.b === sel).flatMap((t) => [t.a, t.b])]) : hl.size ? hl : null;
  const dim = (id: string) => !!focus && id !== "ceo" && !focus.has(id);
  const people = Object.values(pack.cast);
  const selP = sel ? personOf(pack, sel) : null;
  const selTies = sel ? pack.ties.filter((t) => t.a === sel || t.b === sel) : [];

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full h-auto select-none" role="img" aria-label={`Mapa de relaciones de ${pack.name}`}>
          <defs>
            <marker id="om-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#171A3A" /></marker>
          </defs>
          {/* franjas de grupo */}
          <text x={14} y={22} className="fill-slate-400" fontSize="11" fontWeight={600} letterSpacing="1">CONSEJO</text>
          <text x={14} y={262} className="fill-slate-400" fontSize="11" fontWeight={600} letterSpacing="1">TU COMITÉ</text>
          <text x={14} y={440} className="fill-slate-400" fontSize="11" fontWeight={600} letterSpacing="1">EQUIPOS</text>
          {/* jerarquía */}
          {people.map((p) => {
            const a = pos[p.id], b = p.reportsTo ? pos[p.reportsTo] : p.group === "consejo" ? null : null;
            if (!a || !b) return null;
            return <line key={`h${p.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#CBD5E1" strokeWidth={1.5} opacity={dim(p.id) ? 0.25 : 1} />;
          })}
          {/* el consejo supervisa al CEO */}
          {people.filter((p) => p.group === "consejo").map((p) => <line key={`c${p.id}`} x1={pos[p.id].x} y1={pos[p.id].y} x2={CEO.x} y2={CEO.y} stroke="#E2E8F0" strokeWidth={1.5} />)}
          {/* relaciones */}
          {pack.ties.map((t, i) => {
            const a = pos[t.a], b = pos[t.b];
            if (!a || !b) return null;
            const st = TIE_STYLE[t.kind];
            const on = !focus || (focus.has(t.a) && focus.has(t.b));
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
            const bend = 28;
            const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
            // acortar al borde del círculo
            const ex = b.x - (b.x - cx) / Math.hypot(b.x - cx, b.y - cy) * (R + 3), ey = b.y - (b.y - cy) / Math.hypot(b.x - cx, b.y - cy) * (R + 3);
            return (
              <path key={`t${i}`} d={`M${a.x},${a.y} Q${cx},${cy} ${t.kind === "influye" ? `${ex},${ey}` : `${b.x},${b.y}`}`} fill="none" stroke={st.stroke} strokeWidth={on ? 2.2 : 1.2} strokeDasharray={st.dash} opacity={on ? 0.85 : 0.12} markerEnd={t.kind === "influye" ? "url(#om-arrow)" : undefined}>
                <title>{`${firstName(pack, t.a)} · ${firstName(pack, t.b)}: ${t.note}`}</title>
              </path>
            );
          })}
          {/* tú */}
          <g>
            <circle cx={CEO.x} cy={CEO.y} r={R + 8} fill="url(#om-ceo)" />
            <defs><linearGradient id="om-ceo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6D5DF6" /><stop offset=".5" stopColor="#4F3FE0" /><stop offset="1" stopColor="#2B1F8A" /></linearGradient></defs>
            <text x={CEO.x} y={CEO.y + 5} textAnchor="middle" fontSize="14" fontWeight={700} fill="#fff">TÚ</text>
            <text x={CEO.x} y={CEO.y + R + 24} textAnchor="middle" fontSize="11" fontWeight={600} fill="#171A3A">Dirección General</text>
          </g>
          {/* personas */}
          {people.map((p) => {
            const at = pos[p.id];
            if (!at) return null;
            const isHl = hl.has(p.id);
            return (
              <g key={p.id} onClick={() => setSel((s) => (s === p.id ? null : p.id))} className="cursor-pointer" opacity={dim(p.id) ? 0.3 : 1}>
                {(isHl || sel === p.id) && <circle cx={at.x} cy={at.y} r={R + 6} fill="none" stroke="#4F3FE0" strokeWidth={2.5} className={isHl && !sel ? "ceo-ring" : undefined} />}
                <circle cx={at.x} cy={at.y} r={R} fill={avatarHex(pack, p.id)} />
                <text x={at.x} y={at.y + 4.5} textAnchor="middle" fontSize="12.5" fontWeight={600} fill="#fff">{p.initials}</text>
                <text x={at.x} y={at.y + R + 15} textAnchor="middle" fontSize="11.5" fontWeight={600} fill="#171A3A">{firstName(pack, p.id)}</text>
                {!compact && <text x={at.x} y={at.y + R + 28} textAnchor="middle" fontSize="9.5" fill="#94A3B8">{shortRole(p.role)}</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
        {(Object.keys(TIE_STYLE) as Tie["kind"][]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke={TIE_STYLE[k].stroke} strokeWidth="2" strokeDasharray={TIE_STYLE[k].dash} /></svg>{TIE_STYLE[k].label}
          </span>
        ))}
        <span className="text-slate-400">· Toca a una persona para ver qué le importa.</span>
      </div>

      {selP && (
        <div className="mt-3 rounded-2xl border border-indigo/15 bg-indigo-soft/40 p-4 academy-in">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-white shrink-0" style={{ background: avatarHex(pack, selP.id) }}>{selP.initials}</span>
            <div className="min-w-0"><div className="text-sm font-semibold text-ink">{selP.name}</div><div className="text-xs text-slate-500">{selP.role}</div></div>
          </div>
          {selP.cares && <p className="mt-3 text-sm text-ink"><b className="text-indigo">Le importa:</b> {selP.cares}</p>}
          {selTies.length > 0 && (
            <ul className="mt-2 space-y-1">
              {selTies.map((t, i) => {
                const other = t.a === selP.id ? t.b : t.a;
                return <li key={i} className="text-xs text-slate-600"><span className={clsx("font-semibold", t.kind === "tension" ? "text-coral" : t.kind === "alianza" ? "text-indigo" : "text-ink")}>{TIE_STYLE[t.kind].label}</span> con {firstName(pack, other)}: {t.note}</li>;
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function shortRole(role: string) {
  const r = role.split("·")[0].trim();
  return r.length > 26 ? r.slice(0, 25) + "…" : r;
}
