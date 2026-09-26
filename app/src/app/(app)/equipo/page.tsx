"use client";
import Link from "next/link";
import { useMetis } from "@/lib/store";
import { Avatar, PageHeader, StatusChip } from "@/components/ui/primitives";
import { MONTHS } from "@/lib/labels";

export default function Equipo() {
  const s = useMetis();
  const me = s.users.find((u) => u.id === s.currentUserId)!;
  const team = s.users.filter((u) => u.managerId === me.id);
  return (
    <>
      <PageHeader title="Mi equipo" subtitle={`Reportes directos de ${me.name} · ${MONTHS[s.month - 1]} ${s.year}`} />
      {team.length === 0 ? <div className="card p-8 text-center text-slate-500">No tienes reportes directos.</div> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-slate-100"><tr><th className="th">Colaborador</th><th className="th">Scorecard</th><th className="th text-right">Elementos</th><th className="th text-right">Cumplimiento ponderado</th><th className="th text-right">Cargas pendientes</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {team.map((u) => {
                const sc = s.scorecards.find((x) => x.userId === u.id);
                const items = sc ? s.scorecardItems.filter((i) => i.scorecardId === sc.id) : [];
                const a = sc ? s.scorecardAttainment(sc.id) : null;
                const pend = s.elementScopes.filter((es) => es.ownerUserId === u.id && !s.results.some((r) => r.elementScopeId === es.id && r.month === s.month && r.value !== null)).length;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="td"><div className="flex items-center gap-3"><Avatar initials={u.initials} /><div><div className="font-medium">{u.name}</div><div className="text-xs text-slate-400">{u.title}</div></div></div></td>
                    <td className="td">{sc ? <StatusChip s={sc.status} /> : <span className="text-xs text-slate-400">Sin scorecard</span>}</td>
                    <td className="td text-right tabular-nums">{items.length}</td>
                    <td className="td text-right font-semibold tabular-nums">{a?.value ?? "—"}{a?.value !== null && a ? "%" : ""}</td>
                    <td className={"td text-right tabular-nums " + (pend ? "text-coral font-medium" : "text-slate-400")}>{pend}</td>
                    <td className="td text-right"><Link href={`/equipo/${u.id}`} className="text-sm text-indigo">{sc?.status === "submitted" ? "Revisar y aprobar" : "Ver scorecard"}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
