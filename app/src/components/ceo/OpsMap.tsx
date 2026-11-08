"use client";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import type { GrowthState } from "@/lib/ceo/growth/types";
import { METRO_OUTLINE, SIERRA } from "@/lib/ceo/growth/geo";
import { profileOf } from "@/lib/ceo/growth/models";
import { opsMapOf, short, siteDetailOf, type MapSite, type Tone } from "@/lib/ceo/growth/ops";

const DOT: Record<Tone, string> = { ok: "#4F3FE0", hot: "#F2545B", cold: "#F5A524", new: "#14C98E", build: "#94A3B8" };

/** Mapa minimalista de dónde opera la empresa. Toca una sede para ver sus números; «Ver detalle» abre el desglose. */
export function OpsMap({ g }: { g: GrowthState }) {
  const map = useMemo(() => opsMapOf(g), [g]);
  const [sel, setSel] = useState<string | null>(null);
  const [detail, setDetail] = useState(false);
  const cur = map.sites.find((x) => x.id === sel) ?? null;
  // Sedes en la misma zona se separan un poco para que se puedan tocar.
  const placed = useMemo(() => {
    const seen = new Map<string, number>();
    return map.sites.map((x) => { const k = `${x.x},${x.y}`; const n = seen.get(k) ?? 0; seen.set(k, n + 1); return { ...x, px: x.x + n * 4, py: x.y - n * 3 }; });
  }, [map.sites]);

  // Encuadre: el área metropolitana completa, o hasta Saltillo si hay sede allá.
  const far = map.sites.some((x) => x.far);
  const vb = far ? "0 2 100 60" : "18 2 80 56";

  return (
    <div data-testid="mapa-operaciones">
      <div className="relative rounded-3xl overflow-hidden bg-[#F7F7FD]" style={{ backgroundImage: "radial-gradient(#DADCF3 1px, transparent 1px)", backgroundSize: "14px 14px" }}>
        <svg viewBox={vb} preserveAspectRatio="xMidYMid meet" className="w-full h-[230px] sm:h-[280px] block" role="img" aria-label="Mapa de operaciones">
          <path d={METRO_OUTLINE} pointerEvents="none" fill="white" fillOpacity={0.85} stroke="#D6D8F3" strokeWidth={0.35} />
          <path d={SIERRA} pointerEvents="none" fill="#ECEEF6" />
          {far && <path d="M12 52 C 18 46, 22 40, 24 34" stroke="#C7C9EE" strokeWidth={0.35} strokeDasharray="1 1.2" fill="none" />}
          {placed.map((x, i) => {
            const on = sel === x.id;
            const r = 1.6 + Math.min(2.2, Math.sqrt(Math.max(0, x.revenue) / 100 / 250_000));
            return (
              <g key={x.id} className="cursor-pointer ops-pin" style={{ animationDelay: `${i * 90}ms` }} onClick={() => { setSel(on ? null : x.id); setDetail(false); }} data-testid="sede-pin">
                {(x.tone === "hot" || on) && <circle cx={x.px} cy={x.py} r={r + 2.6} fill={DOT[x.tone]} opacity={0.18} className="ops-pulse" style={{ transformOrigin: `${x.px}px ${x.py}px` }} />}
                <circle cx={x.px} cy={x.py + 1.5} r={5.5} fill="transparent" />
                <circle cx={x.px} cy={x.py} r={r} fill={DOT[x.tone]} stroke="white" strokeWidth={on ? 0.9 : 0.6} />
                <text x={x.px} y={x.py + r + 3.4} textAnchor="middle" className="select-none" fontSize={2.6} fill="#171A3A" fontWeight={on ? 700 : 500}>{x.zone}</text>
              </g>
            );
          })}
        </svg>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 text-[10px]">
          {(["ok", "hot", "cold", "new", "build"] as Tone[]).filter((t) => map.sites.some((x) => x.tone === t)).map((t) => (
            <span key={t} className="chip gap-1.5 bg-white/90 text-slate-600 px-2 py-0.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: DOT[t] }} />{TONE_LABEL[t]}</span>
          ))}
        </div>
        {!cur && <div className="absolute right-3 bottom-3 text-[11px] text-slate-400">Toca una {profileOf(g).site.one}</div>}
      </div>

      {cur && <SiteCard key={cur.id} x={cur} month={map.month} onClose={() => setSel(null)} onDetail={() => setDetail((d) => !d)} open={detail} />}
      {cur && detail && <SiteDetailView g={g} id={cur.id} />}
    </div>
  );
}
const TONE_LABEL: Record<Tone, string> = { ok: "Operando", hot: "No da abasto", cold: "Con holgura", new: "Madurando", build: "En obra" };

function SiteCard({ x, month, onClose, onDetail, open }: { x: MapSite; month: number | null; onClose: () => void; onDetail: () => void; open: boolean }) {
  const has = month !== null && x.revenue > 0;
  return (
    <div className="mt-3 rounded-3xl border border-slate-100 bg-white p-4 tree-pop" data-testid="sede-tarjeta">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: DOT[x.tone] }} />{x.status}{has ? ` · mes ${month}` : ""}</div>
          <div className="font-semibold text-ink truncate">{x.name}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="h-7 w-7 grid place-items-center rounded-full hover:bg-slate-50 text-slate-400"><X size={15} /></button>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <Stat k="Ingresos" v={has ? short(x.revenue) : "—"} />
        <Stat k="Gastos" v={has ? short(x.costs) : "—"} />
        <Stat k="Deja" v={has ? short(x.contribution) : "—"} tone={has ? (x.contribution >= 0 ? "good" : "bad") : undefined} />
        <Stat k="Personas" v={String(x.people)} />
      </div>
      {x.use !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-400"><span>Capacidad usada</span><span className="tabular-nums">{Math.round(x.use * 100)} %</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full ops-bar" style={{ width: `${Math.round(x.use * 100)}%`, background: DOT[x.tone] }} /></div>
        </div>
      )}
      <button type="button" onClick={onDetail} className="mt-3 w-full flex items-center justify-center gap-1 text-xs font-semibold text-indigo py-1.5 rounded-xl hover:bg-indigo-soft/50" data-testid="sede-detalle">
        {open ? "Ocultar detalle" : "Ver detalle"} <ChevronRight size={14} className={clsx("transition-transform", open && "rotate-90")} />
      </button>
    </div>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-2xl bg-canvas py-2.5">
      <div className={clsx("text-sm font-semibold tabular-nums", tone === "good" ? "text-sob" : tone === "bad" ? "text-coral" : "text-ink")}>{v}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{k}</div>
    </div>
  );
}

function SiteDetailView({ g, id }: { g: GrowthState; id: string }) {
  const d = useMemo(() => siteDetailOf(g, id), [g, id]);
  if (!d) return null;
  return (
    <div className="mt-2 rounded-3xl bg-canvas p-4 grid gap-4 sm:grid-cols-3 academy-in text-sm" data-testid="sede-desglose">
      <div>
        <div className="text-[11px] font-semibold text-slate-500">Resultado del mes</div>
        {d.pnl.length ? <dl className="mt-1.5 space-y-1">{d.pnl.map(([k, v], i) => <div key={k} className={clsx("flex justify-between gap-2", i === d.pnl.length - 1 && "pt-1 border-t border-slate-200 font-semibold")}><dt className="text-slate-500">{k}</dt><dd className="tabular-nums text-ink">{v}</dd></div>)}</dl> : <p className="mt-1.5 text-slate-400">Todavía no cierra un mes.</p>}
      </div>
      <div>
        <div className="text-[11px] font-semibold text-slate-500">Operación</div>
        <dl className="mt-1.5 space-y-1">{d.ops.map(([k, v]) => <div key={k} className="flex justify-between gap-2"><dt className="text-slate-500">{k}</dt><dd className="tabular-nums text-ink text-right">{v}</dd></div>)}</dl>
      </div>
      <div>
        <div className="text-[11px] font-semibold text-slate-500">Equipo</div>
        <ul className="mt-1.5 space-y-1">{d.team.map((t) => <li key={t.title} className="flex justify-between gap-2"><span className="text-slate-600">{t.title}</span><span className="tabular-nums font-medium text-ink">{t.count}</span></li>)}</ul>
        {d.vacancies.length > 0 && <p className="mt-2 text-[11px] text-slate-500">{d.vacancies.map((v) => `${v.title}: llega en unos ${v.inDays} días`).join(" · ")}</p>}
      </div>
    </div>
  );
}
