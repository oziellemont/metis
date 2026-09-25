"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Paperclip, Save, CheckCircle2, Clock } from "lucide-react";
import { useMetis } from "@/lib/store";
import { Avatar, PageHeader, TrafficChip, Sparkline, RespChip } from "@/components/ui/primitives";
import { DIR, MONTHS, MONTHS_SHORT, RESP, TYPE, fmtValue } from "@/lib/labels";
import { traffic } from "@/lib/domain/scoring";

export default function Carga() {
  const s = useMetis();
  const me = s.users.find((u) => u.id === s.currentUserId)!;
  const owned = useMemo(() => s.elementScopes.filter((es) => es.ownerUserId === me.id), [s.elementScopes, me.id]);
  const [selected, setSelected] = useState<string | null>(null);
  const active = owned.find((es) => es.id === selected) ?? owned.find((es) => !s.results.some((r) => r.elementScopeId === es.id && r.month === s.month && r.value !== null)) ?? owned[0];

  const daysToClose = 3; // demo
  const done = owned.filter((es) => s.results.some((r) => r.elementScopeId === es.id && r.month === s.month && r.value !== null)).length;

  return (
    <>
      <PageHeader
        title={`Carga de ${MONTHS[s.month - 1]}`}
        subtitle={`Eres ${RESP.owner.code} de ${owned.length} elementos · ${done} cargados`}
        actions={<span className={clsx("chip", daysToClose <= 3 ? "bg-coral-soft text-coral" : "bg-slate-100 text-slate-600")}><Clock size={12} className="mr-1" /> Vence en {daysToClose} días</span>}
      />
      {owned.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">No eres {RESP.owner.name} de ningún elemento. Los {RESP.contributor.code} no capturan: su scorecard se actualiza solo.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-2">
            {owned.map((es) => {
              const el = s.elements.find((e) => e.id === es.elementId)!;
              const sc = s.scopes.find((x) => x.id === es.scopeId)!;
              const r = s.results.find((x) => x.elementScopeId === es.id && x.month === s.month);
              const ownerItem = s.scorecardItems.find((i) => i.elementScopeId === es.id && i.responsibility === "owner");
              const t = ownerItem ? traffic(r?.value ?? null, ownerItem.targets, el.direction) : "pending";
              const loaded = r?.value !== null && r?.value !== undefined;
              return (
                <button key={es.id} onClick={() => setSelected(es.id)} className={clsx("card w-full text-left p-4 transition-colors", active?.id === es.id ? "ring-2 ring-indigo/40" : "hover:bg-slate-50")}>
                  <div className="flex items-center gap-2">
                    <span className={clsx("chip", el.type === "kpi" ? "bg-indigo-soft text-indigo" : "bg-sky-soft text-sky")}>{TYPE[el.type]}</span>
                    <span className="text-xs text-slate-400">{sc.name}</span>
                    <span className="ml-auto">{loaded ? <CheckCircle2 size={16} className="text-sob" /> : <span className="chip bg-coral-soft text-coral">Pendiente</span>}</span>
                  </div>
                  <div className="mt-1 font-medium text-sm">{el.name}</div>
                  <div className="mt-1 flex items-center justify-between"><span className="text-sm tabular-nums">{fmtValue(r?.value, el.unit)}</span><TrafficChip t={t} /></div>
                </button>
              );
            })}
          </div>
          <div className="lg:col-span-3">{active && <LoadPanel key={active.id + s.month} esId={active.id} />}</div>
        </div>
      )}
    </>
  );
}

function LoadPanel({ esId }: { esId: string }) {
  const s = useMetis();
  const es = s.elementScopes.find((x) => x.id === esId)!;
  const el = s.elements.find((e) => e.id === es.elementId)!;
  const sc = s.scopes.find((x) => x.id === es.scopeId)!;
  const lae = s.laes.find((l) => l.id === el.laeId)!;
  const existing = s.results.find((r) => r.elementScopeId === es.id && r.month === s.month);
  const ownerItem = s.scorecardItems.find((i) => i.elementScopeId === es.id && i.responsibility === "owner");
  const targets = ownerItem?.targets ?? { min: 0, sat: 0, out: 0 };
  const [value, setValue] = useState<string>(existing?.value?.toString() ?? "");
  const [log, setLog] = useState(existing?.log ?? "");
  const [saved, setSaved] = useState<null | number>(null);

  const num = value === "" ? null : Number(value);
  const t = traffic(num, targets, el.direction);
  const contributors = s.scorecardItems.filter((i) => i.elementScopeId === es.id && i.responsibility === "contributor")
    .map((i) => s.users.find((u) => u.id === s.scorecards.find((x) => x.id === i.scorecardId)!.userId)!);
  const series = Array.from({ length: 12 }, (_, m) => s.results.find((r) => r.elementScopeId === es.id && r.month === m + 1)?.value ?? null);

  const save = () => {
    if (num === null || Number.isNaN(num)) return;
    const { affected } = s.saveResult(es.id, s.month, num, log || undefined);
    setSaved(affected.length);
    setTimeout(() => setSaved(null), 4000);
  };

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-xs text-slate-400 flex items-center gap-2">{TYPE[el.type]} · {sc.name} · <RespChip r="owner" /></div>
          <h2 className="text-lg font-semibold mt-1">{el.name}</h2>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: lae.color }} />LAE · {lae.name} · {DIR[el.direction].long}</div>
          <div className="text-xs text-slate-400 mt-1">Fórmula: {el.formula}</div>
        </div>
        <Sparkline values={series} targets={targets} dir={el.direction} />
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Valor real · {MONTHS[s.month - 1]} ({el.unit})</label>
          <div className="flex items-center gap-3">
            <input type="number" step="any" className="input !text-2xl !font-semibold !py-3" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
          </div>
          <div className="mt-2"><TrafficChip t={t} /></div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-500 mb-2">Metas del periodo</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="text-[10px] text-slate-400">Mín</div><div className="font-semibold text-min tabular-nums">{fmtValue(targets.min, el.unit)}</div></div>
            <div><div className="text-[10px] text-slate-400">Sat</div><div className="font-semibold text-sat tabular-nums">{fmtValue(targets.sat, el.unit)}</div></div>
            <div><div className="text-[10px] text-slate-400">Sob</div><div className="font-semibold text-sob tabular-nums">{fmtValue(targets.out, el.unit)}</div></div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">Semáforo automático contra las tres metas según la dirección del elemento.</div>
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Bitácora</label>
        <textarea className="input" rows={3} placeholder="¿Qué pasó este mes? Causas, acciones, ayuda que necesitas…" value={log} onChange={(e) => setLog(e.target.value)} />
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4">
        <div className="text-xs font-medium text-slate-500 mb-2">Este dato alimenta a {contributors.length} {RESP.contributor.code}</div>
        <div className="flex items-center gap-2 flex-wrap">
          {contributors.map((u) => <span key={u.id} className="inline-flex items-center gap-1.5 text-xs bg-slate-50 rounded-full pl-0.5 pr-2 py-0.5"><Avatar initials={u.initials} size="sm" />{u.name}</span>)}
          {contributors.length === 0 && <span className="text-xs text-slate-400">Nadie está vinculado a este elemento todavía.</span>}
        </div>
        {contributors.length > 0 && <div className="mt-2 text-[11px] text-slate-400">Se actualizará en sus scorecards al guardar. Ellos no capturan nada.</div>}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button className="btn-ghost"><Paperclip size={14} /> Adjuntar evidencia</button>
        <button className="btn-primary ml-auto" disabled={num === null || Number.isNaN(num)} onClick={save}><Save size={14} /> Guardar dato</button>
      </div>
      {saved !== null && (
        <div className="mt-3 rounded-xl bg-mint-soft text-sob text-sm px-3 py-2 flex items-center gap-2"><CheckCircle2 size={16} /> Dato guardado. Se actualizó en {saved} scorecard{saved === 1 ? "" : "s"} ({RESP.owner.code} + {RESP.contributor.code}).</div>
      )}
      {existing?.loadedAt && <div className="mt-2 text-[11px] text-slate-400">Última carga: {new Date(existing.loadedAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</div>}

      <div className="mt-6">
        <div className="text-xs font-medium text-slate-500 mb-2">Historial {s.year}</div>
        <div className="grid grid-cols-12 gap-1">
          {series.map((v, i) => { const tt = traffic(v, targets, el.direction); return (
            <div key={i} className="text-center">
              <div className={clsx("h-8 rounded-md flex items-center justify-center text-[10px] font-medium", tt === "pending" ? "bg-slate-50 text-slate-300" : tt === "below" ? "bg-coral-soft text-coral" : tt === "minimum" ? "bg-amber-soft text-amber" : "bg-mint-soft text-sob")}>{v === null ? "·" : fmtValue(v, el.unit).replace("%", "")}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{MONTHS_SHORT[i]}</div>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}
