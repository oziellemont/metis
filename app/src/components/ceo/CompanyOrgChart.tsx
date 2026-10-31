"use client";
/**
 * Organigrama de tu empresa (mismo lenguaje visual que la cascada de mêtis):
 * el consejo arriba, tú al centro, tu comité y debajo quién le reporta a cada quien; aparte, los
 * actores externos que también pesan. Cada tarjeta muestra cómo está tu relación con esa persona.
 * Al tocar a alguien: qué le importa, tu relación y con quién se alía o choca (se marca en las tarjetas).
 * En celular se muestra como lista por niveles; en pantallas anchas, como árbol.
 */
import clsx from "clsx";
import { useState } from "react";
import { X } from "lucide-react";
import { firstName, personOf } from "@/lib/ceo/cast";
import { moodOf, REL_START } from "@/lib/ceo/relations";
import type { CastId, CompanyPack, Person, Tie } from "@/lib/ceo/types";
import { Avatar } from "./ui";
import { orgParts } from "@/lib/ceo/org-chart";

const TIE: Record<Tie["kind"], { label: string; cls: string; text: string }> = {
  alianza: { label: "Aliado", cls: "bg-indigo text-white", text: "text-indigo" },
  tension: { label: "Tensión", cls: "bg-coral text-white", text: "text-coral" },
  influye: { label: "Influye", cls: "bg-ink text-white", text: "text-ink" },
};

const Line = ({ className }: { className?: string }) => <div className={clsx("bg-indigo/25", className)} />;
const Label = ({ children }: { children: React.ReactNode }) => <div className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{children}</div>;

export function CompanyOrgChart({ pack, relations }: { pack: CompanyPack; relations: Record<CastId, number> }) {
  const [sel, setSel] = useState<CastId | null>(null);
  const parts = orgParts(pack);
  const tieWith: Record<string, Tie["kind"]> = {};
  if (sel) for (const t of pack.ties) {
    if (t.a === sel) tieWith[t.b] = t.kind;
    else if (t.b === sel) tieWith[t.a] = t.kind;
  }
  const tap = (id: CastId) => setSel((s) => (s === id ? null : id));
  const node = (p: Person, size: "md" | "sm" = "md") => <Node key={p.id} p={p} size={size} pack={pack} rel={relations[p.id] ?? REL_START} tie={tieWith[p.id]} sel={sel === p.id} dim={!!sel && sel !== p.id && !tieWith[p.id]} onTap={tap} />;
  const n = Math.max(1, parts.comite.length);
  const you = (
    <div className="flex items-center gap-2 rounded-xl bg-indigo text-white px-4 py-2.5 text-sm font-semibold shadow-[0_8px_24px_-10px_rgba(79,63,224,.7)] w-fit">
      <span className="h-6 w-6 rounded-full bg-white/20 grid place-items-center text-[10px] font-bold">TÚ</span> Dirección General
    </div>
  );

  return (
    <div>
      {/* árbol (pantallas anchas) */}
      <div className="hidden md:block">
        {parts.consejo.length > 0 && (
          <>
            <Label>Consejo</Label>
            <div className="mt-2 flex justify-center gap-3">{parts.consejo.map((p) => <div key={p.id} className="w-[150px]">{node(p)}</div>)}</div>
            <Line className="mx-auto w-px h-4" />
          </>
        )}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <div />
          {you}
          <div className="flex items-center">
            {parts.staff.length > 0 && <><Line className="h-px w-6" /><div className="flex gap-2">{parts.staff.map((p) => <div key={p.id} className="w-[132px]">{node(p, "sm")}</div>)}</div></>}
          </div>
        </div>
        <div className="relative h-5">
          <Line className="absolute left-1/2 top-0 w-px h-2.5" />
          {n > 1 && <div className="absolute top-2.5 h-px bg-indigo/25" style={{ left: `${50 / n}%`, right: `${50 / n}%` }} />}
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {parts.comite.map(({ p, team }) => (
            <div key={p.id} className="flex flex-col items-center">
              <Line className="w-px h-2.5 -mt-2.5" />
              <div className="w-full">{node(p)}</div>
              {team.length > 0 && (
                <>
                  <Line className="w-px h-3" />
                  <div className="w-[92%] rounded-2xl bg-indigo-soft/40 p-1.5 space-y-1.5">
                    <div className="text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo/70 pt-0.5">Le reportan</div>
                    {team.map((k) => node(k, "sm"))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        {parts.externos.length > 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-3">
            <Label>Fuera del organigrama, pero pesan</Label>
            <div className="mt-2 flex flex-wrap justify-center gap-3">{parts.externos.map((p) => <div key={p.id} className="w-[170px]">{node(p, "sm")}</div>)}</div>
          </div>
        )}
      </div>

      {/* lista por niveles (celular) */}
      <div className="md:hidden space-y-4">
        {parts.consejo.length > 0 && <div><Label>Consejo</Label><div className="mt-2 grid grid-cols-2 gap-2">{parts.consejo.map((p) => node(p, "sm"))}</div></div>}
        <div className="flex flex-col items-center gap-2">
          {you}
          {parts.staff.length > 0 && <div className="grid grid-cols-2 gap-2 w-full">{parts.staff.map((p) => node(p, "sm"))}</div>}
        </div>
        <div>
          <Label>Tu comité</Label>
          <div className="mt-2 space-y-2">
            {parts.comite.map(({ p, team }) => (
              <div key={p.id}>
                {node(p, "sm")}
                {team.length > 0 && <div className="mt-2 ml-5 pl-3 border-l-2 border-indigo/20 grid grid-cols-2 gap-2">{team.map((k) => node(k, "sm"))}</div>}
              </div>
            ))}
          </div>
        </div>
        {parts.externos.length > 0 && <div className="rounded-2xl border border-dashed border-slate-200 p-3"><Label>Fuera del organigrama, pero pesan</Label><div className="mt-2 grid grid-cols-2 gap-2">{parts.externos.map((p) => node(p, "sm"))}</div></div>}
      </div>

      <p className="mt-3 text-[11px] text-slate-400">El aro de cada persona es tu relación con ella. Toca a alguien para ver qué le importa y con quién se alía o choca.</p>

      {sel && <Detail pack={pack} id={sel} rel={relations[sel] ?? REL_START} onClose={() => setSel(null)} />}
    </div>
  );
}

function Node({ p, size, pack, rel, tie, sel, dim, onTap }: { p: Person; size: "md" | "sm"; pack: CompanyPack; rel: number; tie?: Tie["kind"]; sel: boolean; dim: boolean; onTap: (id: CastId) => void }) {
  const m = moodOf(rel);
  const warm = m.tone === "aliado" || m.tone === "bien";
  const cold = m.tone === "frio" || m.tone === "roto";
  const av = size === "md" ? 38 : 32;
  const R = av / 2 + 4, C = 2 * Math.PI * R, box = av + 10;
  const role = p.role.split("·")[0].trim();
  return (
    <button
      type="button"
      onClick={() => onTap(p.id)}
      aria-pressed={sel}
      className={clsx(
        "relative w-full rounded-2xl bg-white border text-center transition-all",
        size === "md" ? "px-2 pt-3 pb-2.5" : "px-2 pt-2.5 pb-2",
        sel ? "border-indigo ring-2 ring-indigo/30 shadow-[0_8px_24px_-12px_rgba(79,63,224,.6)]" : "border-slate-100 hover:border-indigo/30 hover:-translate-y-0.5",
        dim && "opacity-45",
      )}
    >
      {tie && <span className={clsx("absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold", TIE[tie].cls)}>{TIE[tie].label}</span>}
      <span className="relative mx-auto block" style={{ width: box, height: box }}>
        <svg width={box} height={box} className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx={box / 2} cy={box / 2} r={R} fill="none" stroke="#EEEBFD" strokeWidth={3} />
          <circle cx={box / 2} cy={box / 2} r={R} fill="none" stroke={cold ? "#F2545B" : warm ? "#4F3FE0" : "#8B7FF0"} strokeWidth={3} strokeLinecap="round" strokeDasharray={`${(C * Math.min(100, Math.max(0, rel))) / 100} ${C}`} className="transition-all duration-700" />
        </svg>
        <span className="absolute inset-0 grid place-items-center"><Avatar id={p.id} size={av} pack={pack} /></span>
      </span>
      <span className={clsx("mt-1.5 block font-semibold text-ink leading-tight truncate", size === "md" ? "text-[13px]" : "text-[12px]")}>{firstName(pack, p.id)}</span>
      <span className="block text-[10px] text-slate-400 leading-tight truncate" title={p.role}>{role}</span>
      <span className={clsx("mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", warm ? "bg-indigo-soft text-indigo" : cold ? "bg-coral-soft text-coral" : "bg-slate-100 text-slate-600")}>{m.label}</span>
    </button>
  );
}

function Detail({ pack, id, rel, onClose }: { pack: CompanyPack; id: CastId; rel: number; onClose: () => void }) {
  const p = personOf(pack, id);
  const ties = pack.ties.filter((t) => t.a === id || t.b === id);
  return (
    <div className="mt-3 rounded-2xl border border-indigo/15 bg-indigo-soft/40 p-4 academy-in">
      <div className="flex items-center gap-3">
        <Avatar id={id} size={36} pack={pack} />
        <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-ink">{p.name}</div><div className="text-xs text-slate-500">{p.role}</div></div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-ink"><X size={16} /></button>
      </div>
      {p.cares && <p className="mt-3 text-sm text-ink"><b className="text-indigo">Le importa:</b> {p.cares}</p>}
      <p className="mt-1 text-xs text-slate-500">Tu relación con {firstName(pack, id)}: <b className="text-ink tabular-nums">{rel}/100</b> · {moodOf(rel).label}</p>
      {ties.length > 0 && (
        <ul className="mt-2 space-y-1">
          {ties.map((t, i) => {
            const other = t.a === id ? t.b : t.a;
            return <li key={i} className="text-xs text-slate-600"><span className={clsx("font-semibold", TIE[t.kind].text)}>{t.kind === "influye" ? (t.a === id ? "Influye en" : "Le influye") : TIE[t.kind].label}</span> · {firstName(pack, other)}: {t.note}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
