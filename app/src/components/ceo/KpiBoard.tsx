"use client";
import Link from "next/link";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { KPI_KEYS } from "@/lib/ceo/engine";
import { SOURCE_LABEL, ZONE_LABEL, decisionChange, healthState, indicatorDetail, thresholdsOf, type Movement, type Zone } from "@/lib/ceo/indicators";
import type { KpiKey } from "@/lib/ceo/types";
import { useCeo } from "./CeoProvider";
import { Bar, BarChange, Delta, directionOf, rel, until } from "./ui";

const ZONE_CLS: Record<Zone, string> = {
  critica: "bg-coral-soft text-coral",
  riesgo: "bg-amber-soft text-ink",
  observacion: "bg-indigo-soft text-indigo",
  sana: "bg-mint-soft text-sob",
};

/** Salud de la empresa con los indicadores y umbrales de la partida actual. */
export function useHealth() {
  const c = useCeo();
  return useMemo(() => {
    const th = thresholdsOf(c.s);
    return { ...healthState(c.kpis, c.pack.kpiStart, th), th };
  }, [c.s, c.kpis, c.pack.kpiStart]);
}

/**
 * Barra madre: la salud de la empresa (promedio de los cinco). Mismo diseño que las barras de cada indicador; su
 * línea es la salud mínima que pide el consejo. `dark` para la franja de bienvenida.
 */
export function HealthBar({ dark, onOpen }: { dark?: boolean; onOpen?: () => void }) {
  const h = useHealth();
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className={clsx("text-xs font-semibold", dark ? "text-white" : "text-ink")}>Salud de la empresa</span>
        <span className={clsx("text-xs font-semibold tabular-nums", dark ? "text-white" : "text-ink")}>{h.value} <span className={clsx("font-normal", dark ? "text-white/55" : "text-slate-400")}>/ 100</span></span>
      </div>
      <Bar value={h.value} line={h.min} dark={dark} className="mt-1.5 h-2.5" />
      <div className={clsx("mt-1 text-[11px]", dark ? "text-white/55" : "text-slate-400")}>
        {h.cushion >= 0 ? `${h.cushion} ${h.cushion === 1 ? "punto" : "puntos"} arriba` : `${-h.cushion} ${h.cushion === -1 ? "punto" : "puntos"} debajo`} de la salud mínima del consejo ({h.min})
      </div>
    </>
  );
  if (!onOpen) return <div data-testid="barra-salud" aria-label={`Salud de la empresa: ${h.value} de 100`}>{body}</div>;
  return <button type="button" data-testid="barra-salud" onClick={onOpen} aria-label={`Salud de la empresa: ${h.value} de 100. Ver qué la mueve`} className="block w-full text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo">{body}</button>;
}

type Open = KpiKey | "salud" | null;

/**
 * Tablero de indicadores: barra madre de salud + cinco barras. Cada barra se puede tocar y abre el mismo panel de
 * detalle (en Hoy y en Mi empresa): estado, último movimiento, causas principales, historial y lo que puedes hacer.
 */
export function KpiBoard({ compact }: { compact?: boolean }) {
  const c = useCeo();
  const pk = c.pack;
  const v = c.verdict;
  const [open, setOpen] = useState<Open>(null);
  return (
    <>
      <div className="mt-3 pb-3 border-b border-slate-100"><HealthBar onOpen={() => setOpen("salud")} /></div>
      <div className={clsx("mt-3", compact ? "space-y-1" : "space-y-1.5")} data-testid="barras-indicadores">
        {KPI_KEYS.map((k) => (
          <button key={k} type="button" onClick={() => setOpen(k)} title={pk.kpiHint[k]} aria-label={`${pk.kpiLabel[k]}: ${c.kpis[k]} de 100. Ver qué lo movió`}
            className="w-full grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-lg -mx-1 px-1 py-1 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo">
            <span className="text-xs text-slate-500 truncate">{pk.kpiLabel[k]}</span>
            <Bar value={c.kpis[k]} k={k} line={v.passLine} />
            <span className="text-xs font-semibold tabular-nums whitespace-nowrap text-right min-w-[52px]">{c.kpis[k]} <Delta n={c.kpis[k] - pk.kpiStart[k]} /></span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Toca una barra para ver qué la movió y cuándo.</p>
      {open && <IndicatorDrawer which={open} onClose={() => setOpen(null)} onPick={setOpen} />}
    </>
  );
}

function IndicatorDrawer({ which, onClose, onPick }: { which: Exclude<Open, null>; onClose: () => void; onPick: (o: Open) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end" role="dialog" aria-modal="true" aria-labelledby="detalle-indicador">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div ref={ref} tabIndex={-1} data-testid="panel-indicador" className="relative w-full sm:w-[420px] max-h-[88vh] sm:max-h-none overflow-y-auto rounded-t-3xl sm:rounded-none bg-white p-5 sm:p-6 shadow-2xl outline-none academy-in">
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 h-8 w-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-500"><X size={16} /></button>
        {which === "salud" ? <HealthDetail onPick={onPick} /> : <KpiDetail k={which} onClose={onClose} />}
      </div>
    </div>
  );
}

function HealthDetail({ onPick }: { onPick: (o: Open) => void }) {
  const c = useCeo();
  const pk = c.pack;
  const h = useHealth();
  return (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Salud de la empresa</div>
      <h2 id="detalle-indicador" className="mt-1 text-2xl font-semibold text-ink tabular-nums">{h.value}<span className="text-base text-slate-400 font-normal"> / 100</span> <span className={clsx("chip align-middle text-xs", ZONE_CLS[h.zone])}>{ZONE_LABEL[h.zone]}</span></h2>
      <Bar value={h.value} line={h.min} className="mt-3 h-2.5" />
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">Es el promedio de los cinco indicadores. El consejo pide al menos <b className="text-ink">{h.min}</b> al cierre del mes. Empezaste en {h.start}; hoy estás {h.value - h.start >= 0 ? `${h.value - h.start} arriba` : `${h.start - h.value} abajo`} de donde arrancaste.</p>
      <div className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cuánto aporta cada indicador</div>
      <ul className="mt-2 space-y-1.5">
        {KPI_KEYS.map((k) => (
          <li key={k}><button type="button" onClick={() => onPick(k)} className="w-full grid grid-cols-[80px_1fr_auto] items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-slate-50">
            <span className="text-xs text-slate-500">{pk.kpiLabel[k]}</span>
            <Bar value={c.kpis[k]} line={h.th.line} />
            <span className="text-xs font-semibold tabular-nums min-w-[52px] text-right">{c.kpis[k]} <ArrowRight size={11} className="inline text-slate-300" /></span>
          </button></li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13px] text-slate-600">Lo que más la jala hacia abajo hoy: <b className="text-ink">{pk.kpiLabel[h.weakest]}</b> ({c.kpis[h.weakest]}). Además de la salud, el consejo revisa tus dos objetivos, que ningún indicador quede debajo de {h.th.floor} y tu criterio.</p>
    </>
  );
}

function KpiDetail({ k, onClose }: { k: KpiKey; onClose: () => void }) {
  const c = useCeo();
  const pk = c.pack;
  const d = useMemo(() => indicatorDetail(c.s, c.now, k, pk.kpiLabel, pk.kpiHint), [c.s, c.now, k, pk.kpiLabel, pk.kpiHint]);
  const related = c.pending.slice(0, 3);
  return (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{d.label}{d.mandate ? " · lo vigila el consejo" : ""}</div>
      <h2 id="detalle-indicador" className="mt-1 text-2xl font-semibold text-ink tabular-nums">{d.value}<span className="text-base text-slate-400 font-normal"> / 100</span> <span className={clsx("chip align-middle text-xs", ZONE_CLS[d.zone])}>{ZONE_LABEL[d.zone]}</span></h2>
      <Bar value={d.value} line={d.line} className="mt-3" />
      {d.hint && <p className="mt-3 text-sm text-slate-600 leading-relaxed">{d.hint}</p>}
      <p className="mt-2 text-[12px] text-slate-400">Es un índice de salud de 0 a 100, no una cifra de dinero ni un porcentaje. Línea del consejo: {d.line}; piso: {d.floor}.</p>

      <Section title="Último movimiento">
        {d.last ? <MovementRow m={d.last} onClose={onClose} /> : <p className="text-sm text-slate-500">Todavía no se ha movido este mes. Arrancó en {d.start}.</p>}
      </Section>

      {(d.down.length > 0 || d.up.length > 0) && (
        <Section title="Por qué está así">
          {d.down.length > 0 && <><div className="text-xs font-semibold text-coral">Lo que más lo bajó</div><ul className="mt-1 mb-3 space-y-2">{d.down.map((m) => <li key={m.kind + m.id}><MovementRow m={m} onClose={onClose} /></li>)}</ul></>}
          {d.up.length > 0 && <><div className="text-xs font-semibold text-sob">Lo que más lo subió</div><ul className="mt-1 space-y-2">{d.up.map((m) => <li key={m.kind + m.id}><MovementRow m={m} onClose={onClose} /></li>)}</ul></>}
        </Section>
      )}

      {d.pending.length > 0 && (
        <Section title="Pendiente de respuesta">
          <ul className="space-y-2">{d.pending.map((p) => <li key={p.id} className="text-sm"><Link href={p.href} onClick={onClose} className="font-medium text-ink hover:text-indigo">{p.label}</Link><div className="text-xs text-slate-500">{p.who}: {p.what}. Responde en {until(p.respondsAt, c.now)}. Hasta entonces no cuenta en tus indicadores.</div></li>)}</ul>
        </Section>
      )}

      {d.history.length > 0 && (
        <Section title={`Historial del mes · ${d.history.length} ${d.history.length === 1 ? "movimiento" : "movimientos"}`}>
          <ol className="space-y-1.5">
            {[...d.history].reverse().map((m) => (
              <li key={m.kind + m.id} className="grid grid-cols-[1fr_auto] gap-2 text-xs">
                <span className="truncate text-slate-600">{m.href ? <Link href={m.href} onClick={onClose} className="hover:text-indigo">{m.label}</Link> : m.label}</span>
                <span className="tabular-nums text-slate-500 whitespace-nowrap">{m.before} → {m.after} <Delta n={m.delta} /></span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <Section title="Qué puedes hacer">
        {related.length ? (
          <ul className="space-y-1.5">{related.map((e) => <li key={e.item.id}><Link href={`/ceo/caso/${e.item.id}`} onClick={onClose} className="flex items-center justify-between gap-2 text-sm text-ink hover:text-indigo"><span className="truncate">{e.item.subject}</span><ArrowRight size={13} className="shrink-0 text-slate-300" /></Link></li>)}</ul>
        ) : <p className="text-sm text-slate-500">No tienes asuntos abiertos ahora. Los siguientes que lleguen son tu oportunidad de corregir el rumbo.</p>}
        <p className="mt-2 text-[11px] text-slate-400">Algunas cosas no dependen de ti: lo que ya venció y las respuestas de clientes o proveedores llegan en su momento.</p>
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mt-5"><div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{title}</div>{children}</div>;
}

function MovementRow({ m, onClose }: { m: Movement; onClose: () => void }) {
  const c = useCeo();
  return (
    <div className="rounded-xl border border-slate-100 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-slate-400">{SOURCE_LABEL[m.kind]}{m.at ? ` · ${rel(m.at, c.now)}` : " · al cierre"}</span>
        <span className="text-xs font-semibold tabular-nums whitespace-nowrap">{m.before} → {m.after} <Delta n={m.delta} /><span className="sr-only"> ({directionOf(m.delta)})</span></span>
      </div>
      <div className="mt-0.5 text-sm font-medium text-ink">{m.href ? <Link href={m.href} onClick={onClose} className="hover:text-indigo">{m.label}</Link> : m.label}</div>
      {m.what && <p className="mt-0.5 text-xs text-slate-500 line-clamp-3">{m.what}</p>}
    </div>
  );
}

/**
 * Resultado de una decisión en barras (antes → después), con la misma escala y la misma línea que Hoy. Sustituye las
 * etiquetas sueltas «+3 / −2»: así se ve de dónde venía cada indicador, a dónde quedó y cómo se movió la salud.
 */
export function ResultBars({ itemId, fresh, source = "asunto" }: { itemId: string; fresh?: boolean; source?: "asunto" | "caso" }) {
  const c = useCeo();
  const pk = c.pack;
  const ch = useMemo(() => decisionChange(c.s, c.now, itemId, source), [c.s, c.now, itemId, source]);
  const th = useMemo(() => thresholdsOf(c.s), [c.s]);
  if (!ch) return null;
  if (!ch.rows.length) return <p data-testid="resultado-barras" className="mt-4 text-sm text-slate-500">Esta decisión no movió tus indicadores.</p>;
  const hd = ch.health.after - ch.health.before;
  return (
    <div data-testid="resultado-barras" className="mt-4 space-y-2">
      {ch.rows.map((r, i) => (
        <div key={r.kpi} className={clsx("grid grid-cols-[72px_1fr_auto] items-center gap-3", fresh && "tree-pop")} style={fresh ? { animationDelay: `${200 + i * 120}ms` } : undefined}
          aria-label={`${pk.kpiLabel[r.kpi]} ${directionOf(r.delta)} de ${r.before} a ${r.after}`}>
          <span className="text-xs text-slate-500 truncate">{pk.kpiLabel[r.kpi]}</span>
          <BarChange before={r.before} after={r.after} line={th.line} />
          <span className="text-xs font-semibold tabular-nums whitespace-nowrap text-right min-w-[84px]"><span className="text-slate-400 font-normal">{r.before} →</span> {r.after} <Delta n={r.delta} /></span>
        </div>
      ))}
      <div className="grid grid-cols-[72px_1fr_auto] items-center gap-3 pt-2 border-t border-slate-100" aria-label={`Salud de la empresa ${directionOf(hd)} de ${ch.health.before} a ${ch.health.after}`}>
        <span className="text-xs font-semibold text-ink truncate">Salud</span>
        <BarChange before={ch.health.before} after={ch.health.after} line={th.healthMin} />
        <span className="text-xs font-semibold tabular-nums whitespace-nowrap text-right min-w-[84px]"><span className="text-slate-400 font-normal">{ch.health.before} →</span> {ch.health.after} <Delta n={hd} /></span>
      </div>
      {ch.rows.some((r) => r.wasted) && <p className="text-[11px] text-slate-400">Algunos puntos no contaron porque el indicador ya estaba en su límite.</p>}
    </div>
  );
}
