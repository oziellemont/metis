"use client";
import Link from "next/link";
import { ArrowRight, Upload, ClipboardList, GitBranch } from "lucide-react";
import { useMetis } from "@/lib/store";
import { PageHeader, Stat, TrafficChip, StatusChip, Avatar } from "@/components/ui/primitives";
import { MONTHS, TRAFFIC, fmtValue } from "@/lib/labels";
import type { Traffic } from "@/lib/domain/types";

export default function Inicio() {
  const s = useMetis();
  const me = s.users.find((u) => u.id === s.currentUserId)!;
  const sc = s.scorecards.find((x) => x.userId === me.id);
  const items = sc ? s.scorecardItems.filter((i) => i.scorecardId === sc.id) : [];
  const evals = items.map((i) => s.evaluate(i));
  const att = sc ? s.scorecardAttainment(sc.id) : { value: null, loaded: 0, total: 0 };

  const myOwned = s.elementScopes.filter((es) => es.ownerUserId === me.id);
  const pending = myOwned.filter((es) => !s.results.some((r) => r.elementScopeId === es.id && r.month === s.month && r.value !== null));

  const team = s.users.filter((u) => u.managerId === me.id);
  const teamScorecards = team.map((u) => ({ u, sc: s.scorecards.find((x) => x.userId === u.id) }));
  const toApprove = teamScorecards.filter((t) => t.sc?.status === "submitted");

  // Resumen organizacional (todos los items con dato en el mes)
  const counts: Record<Traffic, number> = { outstanding: 0, satisfactory: 0, minimum: 0, below: 0, pending: 0 };
  s.scorecardItems.forEach((i) => { counts[s.evaluate(i).traffic]++; });
  const approvedPct = Math.round((s.scorecards.filter((x) => x.status === "approved").length / s.scorecards.length) * 100);

  return (
    <>
      <PageHeader title={`Hola, ${me.name.split(" ")[0]}`} subtitle={`${me.title} · ${MONTHS[s.month - 1]} ${s.year}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Mi cumplimiento ponderado" value={att.value === null ? "—" : `${att.value}%`} sub={`${att.loaded} de ${att.total} elementos con dato`} tone={att.value !== null && att.value >= 100 ? "text-sob" : att.value !== null && att.value < 90 ? "text-coral" : ""} />
        <Stat label="Cargas pendientes este mes" value={pending.length} sub={pending.length ? "Eres DR de estos elementos" : "Todo cargado"} tone={pending.length ? "text-coral" : "text-sob"} />
        <Stat label="Scorecards por aprobar" value={toApprove.length} sub={team.length ? `${team.length} personas en tu equipo` : "Sin reportes directos"} />
        <Stat label="Alineación de la organización" value={`${approvedPct}%`} sub={`${s.scorecards.filter((x) => x.status === "approved").length} de ${s.scorecards.length} scorecards aprobados`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mt-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Mi scorecard · {MONTHS[s.month - 1]}</h2>
            <div className="flex items-center gap-2">{sc && <StatusChip s={sc.status} />}<Link href="/scorecard" className="text-sm text-indigo inline-flex items-center gap-1">Ver todo <ArrowRight size={14} /></Link></div>
          </div>
          {evals.length === 0 ? <p className="text-sm text-slate-500">Aún no tienes scorecard. <Link className="text-indigo" href="/scorecard">Crea el tuyo</Link>.</p> : (
            <ul className="divide-y divide-slate-100">
              {evals.map((e) => {
                const es = s.elementScopes.find((x) => x.id === e.item.elementScopeId)!;
                const el = s.elements.find((x) => x.id === es.elementId)!;
                const sc_ = s.scopes.find((x) => x.id === es.scopeId)!;
                return (
                  <li key={e.item.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{el.name}</div>
                      <div className="text-xs text-slate-400">{sc_.name} · {e.weight}%</div>
                    </div>
                    <div className="text-sm font-medium tabular-nums">{fmtValue(e.value, el.unit)}</div>
                    <TrafficChip t={e.traffic} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Pendientes</h2>
            <ul className="space-y-2 text-sm">
              {pending.map((es) => {
                const el = s.elements.find((x) => x.id === es.elementId)!;
                const sc_ = s.scopes.find((x) => x.id === es.scopeId)!;
                return (
                  <li key={es.id}>
                    <Link href="/carga" className="flex items-center gap-2 rounded-xl bg-coral-soft/60 px-3 py-2 hover:bg-coral-soft">
                      <Upload size={14} className="text-coral" /><span className="flex-1 truncate">Cargar {el.name} · {sc_.name}</span>
                    </Link>
                  </li>
                );
              })}
              {toApprove.map((t) => (
                <li key={t.u.id}>
                  <Link href={`/equipo/${t.u.id}`} className="flex items-center gap-2 rounded-xl bg-sky-soft/60 px-3 py-2 hover:bg-sky-soft">
                    <ClipboardList size={14} className="text-sky" /><span className="flex-1 truncate">Aprobar scorecard de {t.u.name}</span>
                  </Link>
                </li>
              ))}
              {pending.length === 0 && toApprove.length === 0 && <li className="text-slate-400">Nada pendiente. 🎉</li>}
            </ul>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Cierre de {MONTHS[s.month - 1]}</h2>
              <Link href="/mapa" className="text-sm text-indigo inline-flex items-center gap-1"><GitBranch size={14} /> Mapa</Link>
            </div>
            <div className="text-xs text-slate-500 mb-2">Elementos de scorecard por nivel de cumplimiento</div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
              {(["outstanding", "satisfactory", "minimum", "below", "pending"] as Traffic[]).map((t) => (
                <div key={t} className={TRAFFIC[t].dot} style={{ width: `${(counts[t] / s.scorecardItems.length) * 100}%` }} />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1 text-center">
              {(["outstanding", "satisfactory", "minimum", "below", "pending"] as Traffic[]).map((t) => (
                <div key={t}><div className={`text-lg font-semibold ${TRAFFIC[t].text}`}>{counts[t]}</div><div className="text-[10px] text-slate-400 leading-tight">{TRAFFIC[t].label}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {team.length > 0 && (
        <div className="card p-5 mt-6">
          <h2 className="font-semibold mb-3">Mi equipo</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {teamScorecards.map(({ u, sc }) => {
              const a = sc ? s.scorecardAttainment(sc.id) : null;
              return (
                <Link key={u.id} href={`/equipo/${u.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                  <Avatar initials={u.initials} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-xs text-slate-400 truncate">{u.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{a?.value ?? "—"}{a?.value !== null && a ? "%" : ""}</div>
                    {sc && <StatusChip s={sc.status} />}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
