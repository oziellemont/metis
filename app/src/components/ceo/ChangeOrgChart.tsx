"use client";
/**
 * Organigrama del reto de cambio (mismo lenguaje visual que la cascada de mêtis):
 * consejo arriba, tú al centro, tu comité y debajo quien le reporta a cada quien; fuera de la
 * estructura, los actores externos que también pesan. Cada tarjeta muestra en qué fase va esa persona.
 */
import clsx from "clsx";
import { Megaphone, Check } from "lucide-react";
import { ADOPT, phaseOf } from "@/lib/ceo/change";
import { firstName, personOf } from "@/lib/ceo/cast";
import type { CastId, CompanyPack, Stakeholder, Tie } from "@/lib/ceo/types";
import { Avatar } from "./ui";

export interface ChartProps {
  pack: CompanyPack;
  people: Stakeholder[];
  values: Record<CastId, number>;
  selected?: CastId[];
  focus?: CastId | null;
  gains?: Record<CastId, number>;
  gainKey?: number;
  onTap?: (id: CastId) => void;
  disabled?: boolean;
}

const TIE: Record<Tie["kind"], { label: string; cls: string }> = {
  alianza: { label: "Aliado", cls: "bg-indigo text-white" },
  tension: { label: "Tensión", cls: "bg-coral text-white" },
  influye: { label: "Influye", cls: "bg-ink text-white" },
};

const Line = ({ className }: { className?: string }) => <div className={clsx("bg-indigo/25", className)} />;

export function ChangeOrgChart(p: ChartProps) {
  const { pack, people } = p;
  const grp = (g: string) => people.filter((x) => personOf(pack, x.id).group === g);
  const consejo = grp("consejo");
  const comite = grp("comite");
  const ids = new Set(people.map((x) => x.id));
  const kidsOf = (boss: CastId) => people.filter((x) => personOf(pack, x.id).group === "equipo" && personOf(pack, x.id).reportsTo === boss);
  const staff = people.filter((x) => { const q = personOf(pack, x.id); return q.group === "equipo" && (!q.reportsTo || q.reportsTo === "ceo" || !ids.has(q.reportsTo)); });
  const externos = grp("externo");
  const n = Math.max(1, comite.length);

  // relación de cada persona con la que tienes enfocada
  const tieWith: Record<string, Tie["kind"]> = {};
  if (p.focus) for (const t of pack.ties) {
    if (t.a === p.focus) tieWith[t.b] = t.kind;
    else if (t.b === p.focus) tieWith[t.a] = t.kind;
  }
  const node = (st: Stakeholder, size: "md" | "sm" = "md") => <Node key={st.id} st={st} size={size} tie={tieWith[st.id]} {...p} />;

  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1">
      <div className="min-w-[660px]">
        {/* consejo */}
        {consejo.length > 0 && (
          <>
            <div className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Consejo</div>
            <div className="mt-2 flex justify-center gap-3">{consejo.map((st) => <div key={st.id} className="w-[150px]">{node(st)}</div>)}</div>
            <Line className="mx-auto w-px h-4" />
          </>
        )}

        {/* tú + staff */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <div />
          <div className="flex items-center gap-2 rounded-xl bg-indigo text-white px-4 py-2.5 text-sm font-semibold shadow-[0_8px_24px_-10px_rgba(79,63,224,.7)]">
            <span className="h-6 w-6 rounded-full bg-white/20 grid place-items-center text-[10px] font-bold">TÚ</span> Dirección General
          </div>
          <div className="flex items-center">
            {staff.length > 0 && <><Line className="h-px w-6" /><div className="flex gap-2">{staff.map((st) => <div key={st.id} className="w-[132px]">{node(st, "sm")}</div>)}</div></>}
          </div>
        </div>

        {/* bracket al comité */}
        <div className="relative h-5">
          <Line className="absolute left-1/2 top-0 w-px h-2.5" />
          {n > 1 && <div className="absolute top-2.5 h-px bg-indigo/25" style={{ left: `${50 / n}%`, right: `${50 / n}%` }} />}
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {comite.map((st) => {
            const kids = kidsOf(st.id);
            return (
              <div key={st.id} className="flex flex-col items-center">
                <Line className="w-px h-2.5 -mt-2.5" />
                <div className="w-full">{node(st)}</div>
                {kids.map((k) => (
                  <div key={k.id} className="w-[88%] flex flex-col items-center">
                    <Line className="w-px h-3" />
                    {node(k, "sm")}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* externos */}
        {externos.length > 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-3">
            <div className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Fuera del organigrama, pero pesan</div>
            <div className="mt-2 flex justify-center gap-3">{externos.map((st) => <div key={st.id} className="w-[170px]">{node(st, "sm")}</div>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Node({ st, size, tie, pack, values, selected, focus, gains, gainKey, onTap, disabled }: ChartProps & { st: Stakeholder; size: "md" | "sm"; tie?: Tie["kind"] }) {
  const v = Math.round(values[st.id] ?? 0);
  const person = personOf(pack, st.id);
  const sel = selected?.includes(st.id);
  const isFocus = focus === st.id;
  const adopted = v >= ADOPT;
  const g = gains?.[st.id] ? Math.round(gains[st.id]) : 0;
  const av = size === "md" ? 38 : 32;
  const R = av / 2 + 4, C = 2 * Math.PI * R, box = av + 10;
  const role = person.role.split("·")[0].trim();
  return (
    <button
      type="button"
      onClick={() => onTap?.(st.id)}
      disabled={disabled}
      className={clsx(
        "relative w-full rounded-2xl bg-white border text-center transition-all",
        size === "md" ? "px-2 pt-3 pb-2.5" : "px-2 pt-2.5 pb-2",
        sel ? "border-indigo ring-2 ring-indigo/30 shadow-[0_8px_24px_-12px_rgba(79,63,224,.6)]" : isFocus ? "border-indigo/50 ring-2 ring-indigo/10" : "border-slate-100 hover:border-indigo/30 hover:-translate-y-0.5",
        adopted && !sel && "bg-gradient-to-b from-indigo-soft/70 to-white",
      )}
    >
      {tie && <span className={clsx("absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold", TIE[tie].cls)}>{TIE[tie].label}</span>}
      {sel && <span className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-indigo text-white grid place-items-center"><Check size={10} strokeWidth={3} /></span>}
      {g !== 0 && <span key={gainKey} className={clsx("absolute -right-1.5 -top-2 chip text-[10px] font-semibold tree-pop shadow-sm", g > 0 ? "bg-indigo text-white" : "bg-coral text-white")}>{g > 0 ? "+" : ""}{g}</span>}
      <span className="relative mx-auto block" style={{ width: box, height: box }}>
        <svg width={box} height={box} className="absolute inset-0 -rotate-90">
          <circle cx={box / 2} cy={box / 2} r={R} fill="none" stroke="#EEEBFD" strokeWidth={3} />
          <circle cx={box / 2} cy={box / 2} r={R} fill="none" stroke={adopted ? "#4F3FE0" : "#8B7FF0"} strokeWidth={3} strokeLinecap="round" strokeDasharray={`${(C * Math.min(100, v)) / 100} ${C}`} className="transition-all duration-700" />
        </svg>
        <span className="absolute inset-0 grid place-items-center"><Avatar id={st.id} size={av} pack={pack} /></span>
        {st.leader && <span title="Formador de opinión" className="absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full bg-white shadow grid place-items-center"><Megaphone size={9} className="text-indigo" /></span>}
      </span>
      <span className={clsx("mt-1.5 block font-semibold text-ink leading-tight truncate", size === "md" ? "text-[13px]" : "text-[12px]")}>{firstName(pack, st.id)}</span>
      <span className="block text-[10px] text-slate-400 leading-tight truncate" title={person.role}>{role}</span>
      <span className={clsx("mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums", adopted ? "bg-indigo text-white" : v >= 50 ? "bg-indigo-soft text-indigo" : v >= 25 ? "bg-slate-100 text-slate-600" : "bg-coral-soft text-coral")}>{phaseOf(v)} · {v}</span>
    </button>
  );
}
