"use client";
import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, Lock, Users } from "lucide-react";
import { DILEMMAS, THEMES, bestOf, type DilemmaTheme } from "@/lib/ceo/dilemmas";
import { LEVELS, rankFor } from "@/lib/ceo/engine";
import { useCeo } from "./CeoProvider";
import { DilemmaCard, DilemmaView } from "./DilemmaCard";

/** /ceo/personas · tus dilemas de personas, por tema. */
export function PeopleView() {
  const c = useCeo();
  const rank = rankFor(c.s, c.now);
  const answered = c.s.dilemmas ?? {};
  const [open, setOpen] = useState<string | null>(null);
  const total = DILEMMAS.length;
  const done = Object.keys(answered).length;
  const great = Object.entries(answered).filter(([id, v]) => { const d = DILEMMAS.find((x) => x.id === id); return d && d.options[v.option]?.score === bestOf(d); }).length;
  const themes = Object.keys(THEMES) as DilemmaTheme[];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-8 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.5fr_1fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium"><Users size={14} /> Personas</div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-semibold leading-tight">Cada persona necesita algo distinto de ti.</h1>
            <p className="mt-3 text-white/70 max-w-lg text-[15px] leading-relaxed">Un dilema al día sobre cómo abordar a alguien: el nuevo, el veterano, tu estrella, el que tiene quejas de su equipo. Ninguna respuesta es obvia. Conforme subes de rango, llegan casos más delicados.</p>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur p-5">
            <div className="flex items-baseline justify-between"><span className="text-xs text-white/60">Dilemas resueltos</span><span className="text-sm font-semibold tabular-nums">{done} de {total}</span></div>
            <div className="mt-2 h-2 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-indigo-light to-white transition-all duration-700" style={{ width: `${Math.round((done / total) * 100)}%` }} /></div>
            <p className="mt-3 text-[11px] text-white/60">{great} con la mejor decisión · cada semana llegan casos nuevos</p>
          </div>
        </div>
      </section>

      <DilemmaCard />

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Por tema</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {themes.map((t) => {
            const th = THEMES[t];
            const all = DILEMMAS.filter((d) => d.theme === t);
            const mine = all.filter((d) => answered[d.id]);
            const locked = all.filter((d) => d.min > rank);
            const isOpen = open === t;
            return (
              <div key={t} className="py-3">
                <button onClick={() => setOpen(isOpen ? null : t)} className="w-full flex items-center gap-3 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink">{th.label}</div>
                    <div className="text-xs text-slate-500">{th.hint}</div>
                  </div>
                  <div className="flex gap-1">{all.map((d) => <span key={d.id} className={clsx("h-2 w-2 rounded-full", answered[d.id] ? "bg-indigo" : d.min > rank ? "bg-slate-100" : "bg-slate-300")} />)}</div>
                  <span className="text-xs tabular-nums text-slate-400 w-10 text-right">{mine.length}/{all.length}</span>
                  <ChevronDown size={16} className={clsx("text-slate-300 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="mt-3 space-y-4 academy-in">
                    {mine.length === 0 && <p className="text-sm text-slate-500">Todavía no te ha tocado ninguno de este tema. Llegan en tu dilema del día.</p>}
                    {mine.map((d) => <div key={d.id} className="rounded-2xl border border-slate-100 p-4"><DilemmaView d={d} picked={answered[d.id].option} compact /></div>)}
                    {locked.length > 0 && <p className="text-xs text-slate-400 inline-flex items-center gap-1.5"><Lock size={12} /> {locked.length} {locked.length === 1 ? "caso más delicado se abre" : "casos más delicados se abren"} al reunir {LEVELS[Math.min(...locked.map((d) => d.min))].min} XP de constancia.</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
