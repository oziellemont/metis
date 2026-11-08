"use client";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Check, ChevronDown, Landmark, Phone, Users } from "lucide-react";
import type { GCase } from "@/lib/ceo/growth/cases";
import type { Decision, OptionView } from "@/lib/ceo/growth/chains";
import type { GrowthState } from "@/lib/ceo/growth/types";
import { startOffers } from "@/lib/ceo/growth/finance";
import { impactOf, money, short, type Impact } from "@/lib/ceo/growth/ops";

const initials = (s: string) => s.split(/[\s·]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** Chips de impacto: lo que la opción mueve en caja, costo mensual, personas y sedes. */
function ImpactChips({ i, dark }: { i: Impact | null; dark?: boolean }) {
  if (!i) return null;
  const chips: { t: string; good: boolean }[] = [];
  if (Math.abs(i.now) >= 100_00) chips.push({ t: `${i.now > 0 ? "+" : ""}${short(i.now)} caja`, good: i.now > 0 });
  if (Math.abs(i.monthly) >= 100_00) chips.push({ t: `${i.monthly > 0 ? "+" : ""}${short(i.monthly)}/mes`, good: i.monthly < 0 });
  if (i.people) chips.push({ t: `${i.people > 0 ? "+" : ""}${i.people} ${Math.abs(i.people) === 1 ? "persona" : "personas"}`, good: i.people > 0 });
  if (i.sites) chips.push({ t: `+${i.sites} sede`, good: true });
  if (!chips.length) chips.push({ t: "Sin costo", good: true });
  return (
    <span className="flex flex-wrap gap-1">
      {chips.map((c) => <span key={c.t} className={clsx("rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums", dark ? "bg-white/10 text-white/80" : c.good ? "bg-mint-soft text-sob" : "bg-slate-100 text-slate-600")}>{c.t}</span>)}
    </span>
  );
}

/** Un caso de crecimiento como hoja minimalista: quién, qué, opciones con su impacto y «Ver detalle». */
export function GrowthCase({ g, k, options, decisions, onDecide, index = 0 }: { g: GrowthState; k: GCase; options: OptionView[]; decisions: readonly Decision[]; onDecide: (optionId: string) => boolean; index?: number }) {
  const [pick, setPick] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [call, setCall] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const impacts = useMemo(() => Object.fromEntries(options.map((o) => [o.id, o.ok ? impactOf(g, k.id, o.id, decisions) : null])), [g, k.id, options, decisions]);
  const bank = options.filter((o) => o.via === "banco");
  const plain = options.filter((o) => o.via !== "banco");
  const from = k.fromOf ? k.fromOf(g) : k.from;
  const subject = k.subjectOf ? k.subjectOf(g) : k.subject;
  const lead = k.lead ? k.lead(g) : k.body(g)[0];
  const chosen = options.find((o) => o.id === pick);
  const go = (id: string) => { if (onDecide(id)) setDone(options.find((o) => o.id === id)?.short ?? ""); };
  const Icon = k.chain === "finanzas" ? Landmark : k.chain === "operacion" && /abrir|expandir|zona/i.test(k.id + subject) ? Building2 : Users;

  if (done !== null) return (
    <div className="rounded-3xl bg-ink text-white p-5 flex items-center gap-3 ceo-pop" data-testid="caso-decidido">
      <span className="h-9 w-9 rounded-full bg-mint grid place-items-center shrink-0"><Check size={18} strokeWidth={3} /></span>
      <div className="min-w-0"><div className="text-sm font-semibold">{done}</div><div className="text-xs text-white/60">Decidido. Lo verás en los números de los próximos días.</div></div>
    </div>
  );

  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 tree-pop" style={{ animationDelay: `${index * 120}ms` }} data-testid="caso-crecimiento">
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 rounded-2xl bg-indigo-soft text-indigo grid place-items-center shrink-0"><Icon size={18} /></span>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-slate-100 text-[8px] font-bold text-slate-500 grid place-items-center">{initials(from)}</span>{from}</div>
          <h3 className="font-semibold text-ink leading-snug">{subject}</h3>
        </div>
      </div>
      {lead && <p className="mt-2 text-sm text-slate-500 leading-snug">{lead}</p>}

      <div className={clsx("mt-4 grid gap-2", plain.length + (bank.length ? 1 : 0) >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {bank.length > 0 && (
          <button type="button" onClick={() => setCall(true)} disabled={!bank.some((o) => o.ok)} data-testid="llamar-banco"
            className="group text-left rounded-2xl p-3.5 bg-gradient-to-br from-[#2A1B1F] to-[#4A1F26] text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50">
            <span className="flex items-center gap-2 text-sm font-semibold"><span className="h-7 w-7 rounded-full bg-mint grid place-items-center help-ring"><Phone size={13} /></span>Llamar al banco</span>
            <span className="mt-2 block text-[11px] text-white/60">{bank.length} créditos preaprobados</span>
          </button>
        )}
        {plain.map((o) => (
          <button key={o.id} type="button" disabled={!o.ok} onClick={() => setPick(pick === o.id ? null : o.id)} data-testid="opcion-crecimiento"
            className={clsx("text-left rounded-2xl p-3.5 border-2 transition-all", pick === o.id ? "border-indigo bg-indigo-soft/40" : "border-slate-100 hover:border-indigo/30", !o.ok && "opacity-50")}>
            <span className="block text-sm font-semibold text-ink">{o.short}</span>
            <span className="mt-2 block">{o.ok ? <ImpactChips i={impacts[o.id]} /> : <span className="text-[11px] text-coral leading-snug">{o.reason}</span>}</span>
          </button>
        ))}
      </div>

      {chosen && (
        <div className="mt-3 rounded-2xl bg-canvas p-3.5 academy-in flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="flex-1 text-xs text-slate-600 leading-snug">{chosen.outcome}</p>
          <button type="button" onClick={() => go(chosen.id)} className="btn btn-primary text-sm shrink-0" data-testid="confirmar-crecimiento">Decidir</button>
        </div>
      )}

      <button type="button" onClick={() => setMore((m) => !m)} className="mt-3 text-[11px] font-semibold text-slate-400 hover:text-indigo inline-flex items-center gap-1">
        {more ? "Ocultar detalle" : "Ver detalle"} <ChevronDown size={12} className={clsx("transition-transform", more && "rotate-180")} />
      </button>
      {more && (
        <div className="mt-2 space-y-2 text-[13px] text-slate-600 leading-relaxed academy-in">
          {k.body(g).map((p, i) => <p key={i}>{p}</p>)}
          {k.data && <dl className="grid gap-1.5 sm:grid-cols-2">{k.data(g).map(([a, b]) => <div key={a} className="rounded-xl bg-canvas px-3 py-2"><dt className="text-[10.5px] text-slate-400">{a}</dt><dd className="text-xs font-semibold text-ink tabular-nums">{b}</dd></div>)}</dl>}
        </div>
      )}

      {call && typeof document !== "undefined" && createPortal(<BankCall g={g} options={bank} onClose={() => setCall(false)} onPick={(id) => { setCall(false); go(id); }} />, document.body)}
    </article>
  );
}

/** Llamada con el banco, con el estilo de las llamadas del juego: timbra, contesta y ofrece los créditos preaprobados. */
function BankCall({ g, options, onClose, onPick }: { g: GrowthState; options: OptionView[]; onClose: () => void; onPick: (id: string) => void }) {
  const [phase, setPhase] = useState<"ring" | "talk" | "offers">("ring");
  const [sec, setSec] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const offers = useMemo(() => startOffers(g), [g]);
  useEffect(() => {
    const a = setTimeout(() => setPhase("talk"), 1600);
    const b = setTimeout(() => setPhase("offers"), 3200);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  useEffect(() => {
    if (phase === "ring") return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const opt = (id: string) => options.find((o) => o.id === `banco_${id}`);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-ink/50 backdrop-blur-sm p-0 sm:p-6" role="dialog" aria-modal="true" aria-label="Llamada con el banco" data-testid="llamada-banco">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-[#2A1B1F] to-[#4A1F26] text-white shadow-2xl help-in max-h-[92vh] overflow-y-auto">
        <div className="px-6 pt-8 pb-5 text-center">
          <div className={clsx("mx-auto h-16 w-16 rounded-full bg-white/10 grid place-items-center ring-4 ring-white/10", phase === "ring" && "help-ring")}><Landmark size={26} /></div>
          <div className="mt-3 font-semibold">Banco Regional del Norte</div>
          <div className="text-xs text-white/60 mt-1 tabular-nums">{phase === "ring" ? "Llamando…" : `Ejecutiva de crédito · ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`}</div>
          {phase !== "ring" && (
            <div className="mt-4 flex items-center justify-center gap-[3px] h-6">{Array.from({ length: 26 }, (_, i) => <span key={i} className="w-[3px] rounded-full bg-mint/70 bank-wave" style={{ height: `${25 + Math.abs(Math.sin(i * 1.7)) * 75}%`, animationDelay: `${(i % 7) * 90}ms` }} />)}</div>
          )}
          {phase !== "ring" && <p className="mt-4 text-sm text-white/80 italic academy-in">«Revisé tus números. Tienes tres créditos preaprobados; el dinero llega en unos diez días y se paga cada mes.»</p>}
        </div>
        {phase === "offers" && (
          <div className="px-4 pb-4 space-y-2">
            {offers.map((o, i) => {
              const v = opt(o.id);
              if (!v) return null;
              const on = pick === v.id;
              return (
                <button key={o.id} type="button" disabled={!v.ok} onClick={() => setPick(on ? null : v.id)} data-testid="oferta-banco"
                  className={clsx("w-full text-left rounded-2xl p-4 transition-all tree-pop", on ? "bg-white text-ink" : "bg-white/10 hover:bg-white/15", !v.ok && "opacity-50")} style={{ animationDelay: `${i * 140}ms` }}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xl font-semibold tabular-nums">{money(o.amount)}</span>
                    <span className={clsx("text-xs", on ? "text-slate-500" : "text-white/60")}>{o.months} meses</span>
                  </div>
                  <div className={clsx("mt-2 grid grid-cols-3 gap-2 text-[11px]", on ? "text-slate-500" : "text-white/60")}>
                    <span><b className={clsx("block text-sm tabular-nums", on ? "text-ink" : "text-white")}>{short(o.payment)}</b>al mes</span>
                    <span><b className={clsx("block text-sm tabular-nums", on ? "text-ink" : "text-white")}>{(o.rate * 100).toFixed(1)} %</b>tasa anual</span>
                    <span><b className={clsx("block text-sm tabular-nums", on ? "text-ink" : "text-white")}>{short(o.cost)}</b>de intereses</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="px-4 pb-6 pt-2 flex items-center justify-center gap-4">
          <button type="button" onClick={onClose} className="h-12 w-12 rounded-full bg-coral grid place-items-center hover:scale-105 transition-transform" aria-label="Colgar" data-testid="colgar-banco"><Phone size={18} className="rotate-[135deg]" /></button>
          {pick && <button type="button" onClick={() => onPick(pick)} className="h-12 px-5 rounded-full bg-mint text-ink font-semibold text-sm ceo-pop" data-testid="aceptar-credito">Aceptar crédito</button>}
        </div>
      </div>
    </div>
  );
}
