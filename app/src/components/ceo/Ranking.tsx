"use client";
/**
 * Ranking (liga semanal).
 * - Con Supabase y el esquema ceo: jugadores reales vía ceo.leaderboard().
 * - Sin datos reales todavía: liga de ejemplo con CEOs simulados que avanzan con los días,
 *   para que la competencia se sienta desde el primer día.
 */
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Crown, Info, Trophy } from "lucide-react";
import { DAY, rand01 } from "@/lib/ceo/engine";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useCeo } from "./CeoProvider";
import { Flame } from "./ui";

interface Row { alias: string; xp: number; level: string; streak: number; health: number; me?: boolean; bot?: boolean }

const BOTS = ["Mariana G.", "Luis F.", "Andrea T.", "Jorge V.", "Paola R.", "Ricardo S.", "Daniela M.", "Héctor P.", "Fernanda L.", "Óscar N.", "Valeria C.", "Emilio D.", "Sofía A.", "Arturo B."];

function bots(seed: string, days: number): Row[] {
  return BOTS.map((alias) => {
    const pace = 25 + rand01(`${seed}|${alias}|pace`) * 95; // XP por día
    const xp = Math.round(pace * Math.max(days, 0.4) + rand01(`${seed}|${alias}|x`) * 40);
    const streak = Math.max(0, Math.round(Math.min(days, 7) * (0.4 + rand01(`${seed}|${alias}|s`) * 0.6)));
    const health = Math.round(45 + rand01(`${seed}|${alias}|h`) * 30);
    return { alias, xp, level: "", streak, health, bot: true };
  });
}

const LEAGUES = [
  { min: 0, name: "Liga Gerencia", cls: "from-slate-500 to-slate-400" },
  { min: 300, name: "Liga Dirección", cls: "from-sky to-[#5CC0FF]" },
  { min: 700, name: "Liga Consejo", cls: "from-amber to-[#FFC65C]" },
];

export function Ranking() {
  const c = useCeo();
  const [real, setReal] = useState<Row[] | null>(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    sb.schema("ceo").rpc("leaderboard", { lim: 30 }).then(({ data, error }) => {
      if (!error && Array.isArray(data) && data.length >= 5) setReal(data as Row[]);
    });
  }, []);

  const me: Row = { alias: c.s.alias || c.s.name || "Tú", xp: c.xp, level: c.journey.name, streak: c.streak.days, health: c.health, me: true };
  const days = c.s.startedAt ? (c.now - c.s.startedAt) / DAY : 0;
  const rows = useMemo(() => {
    const base = real ? real.filter((r) => r.alias !== me.alias) : bots(c.s.alias || "x", days);
    return [...base, me].sort((a, b) => b.xp - a.xp);
  }, [real, days, me.xp, me.alias, me.streak, me.health]); // eslint-disable-line react-hooks/exhaustive-deps

  const pos = rows.findIndex((r) => r.me) + 1;
  const league = [...LEAGUES].reverse().find((l) => c.xp >= l.min) ?? LEAGUES[0];
  const nextL = LEAGUES.find((l) => l.min > c.xp);
  const ahead = pos > 1 ? rows[pos - 2] : null;

  return (
    <div className="space-y-5">
      <section className={clsx("relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white bg-gradient-to-br", league.cls)}>
        <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="h-16 w-16 rounded-2xl bg-white/20 grid place-items-center"><Trophy size={30} /></span>
          <div className="flex-1 min-w-[200px]">
            <div className="text-xs text-white/80">Esta semana</div>
            <h1 className="text-2xl font-semibold">{league.name}</h1>
            <p className="text-sm text-white/85 mt-1">Vas en el lugar <b>#{pos}</b> de {rows.length}.{ahead ? ` Te faltan ${ahead.xp - c.xp + 1} XP para pasar a ${ahead.alias}.` : " ¡Vas a la cabeza!"}</p>
          </div>
          {nextL && <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm"><div className="text-white/70 text-xs">Siguiente liga</div><b>{nextL.name}</b> · {nextL.min - c.xp} XP</div>}
        </div>
      </section>

      <section className="card overflow-hidden">
        <ol className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <li key={r.alias + i} className={clsx("flex items-center gap-3 px-4 sm:px-5 py-3", r.me && "bg-indigo-soft/60")}>
              <span className={clsx("w-7 text-center font-semibold tabular-nums", i === 0 ? "text-amber" : i < 3 ? "text-ink" : "text-slate-400")}>{i === 0 ? <Crown size={18} className="mx-auto" /> : i + 1}</span>
              <span className={clsx("h-9 w-9 rounded-full grid place-items-center text-xs font-semibold", r.me ? "bg-indigo text-white" : "bg-slate-100 text-slate-600")}>{r.alias.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
              <div className="flex-1 min-w-0">
                <div className={clsx("truncate text-sm", r.me ? "font-semibold text-indigo" : "text-ink")}>{r.me ? `${r.alias} (tú)` : r.alias}</div>
                <div className="text-[11px] text-slate-400">Salud de su empresa {r.health}/100</div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums w-10"><Flame on={r.streak > 0} size={14} /> {r.streak}</span>
              <span className="w-16 text-right text-sm font-semibold tabular-nums text-ink">{r.xp} XP</span>
            </li>
          ))}
        </ol>
      </section>

      {!real && (
        <p className="flex items-start gap-2 text-xs text-slate-400"><Info size={14} className="mt-0.5 shrink-0" /> Liga de práctica: mientras se suman más CEOs, compites contra jugadores simulados que avanzan día con día. Con tu cuenta activa aparecerás en el ranking real.</p>
      )}
    </div>
  );
}
