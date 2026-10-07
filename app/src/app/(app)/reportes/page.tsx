"use client";
import clsx from "clsx";
import { Download, Printer } from "lucide-react";
import { useMetis } from "@/lib/store";
import { Avatar, PageHeader, StatusChip } from "@/components/ui/primitives";
import { MONTHS, MONTHS_SHORT } from "@/lib/labels";

export default function Reportes() {
  const s = useMetis();
  const rows = s.users.map((u) => {
    const sc = s.scorecards.find((x) => x.userId === u.id && x.year === s.year);
    const months = Array.from({ length: 12 }, (_, m) => (sc ? s.scorecardAttainment(sc.id, m + 1).value : null));
    const ytd = months.filter((v): v is number => v !== null);
    return { u, sc, months, ytd: ytd.length ? Math.round((ytd.reduce((a, b) => a + b, 0) / ytd.length) * 10) / 10 : null };
  });
  const csv = () => {
    const head = ["Colaborador", "Puesto", "Estado", ...MONTHS_SHORT, "Promedio YTD"].join(",");
    const body = rows.map((r) => [r.u.name, r.u.title, r.sc?.status ?? "", ...r.months.map((m) => m ?? ""), r.ytd ?? ""].map((x) => `"${x}"`).join(","));
    const blob = new Blob([[head, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `metis-cumplimiento-${s.year}.csv`; a.click();
  };
  return (
    <>
      <PageHeader title="Reportes" subtitle="Cumplimiento ponderado por colaborador y mes. Base objetiva para evaluación del desempeño y compensación variable."
        actions={<><button className="btn-ghost no-print" onClick={() => window.print()}><Printer size={14} /> PDF</button><button className="btn-primary no-print" onClick={csv}><Download size={14} /> Exportar CSV</button></>} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="border-b border-slate-100"><tr><th className="th">Colaborador</th><th className="th">Scorecard</th>{MONTHS_SHORT.map((m) => <th key={m} className="th text-right">{m}</th>)}<th className="th text-right">YTD</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ u, sc, months, ytd }) => (
              <tr key={u.id}>
                <td className="td"><div className="flex items-center gap-2"><Avatar initials={u.initials} size="sm" /><div><div className="font-medium text-sm">{u.name}</div><div className="text-[11px] text-slate-400">{u.title}</div></div></div></td>
                <td className="td">{sc ? <StatusChip s={sc.status} /> : <span className="text-xs text-slate-400">—</span>}</td>
                {months.map((v, i) => <td key={i} className={clsx("td text-right tabular-nums text-sm", v === null ? "text-slate-300" : v >= 100 ? "text-sob" : v >= 90 ? "text-amber" : "text-coral")}>{v ?? "·"}</td>)}
                <td className={clsx("td text-right font-semibold tabular-nums", ytd === null ? "text-slate-300" : ytd >= 100 ? "text-sob" : ytd >= 90 ? "text-amber" : "text-coral")}>{ytd ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">Cumplimiento = promedio ponderado del % de logro contra meta satisfactoria (100% = satisfactorio, tope 120%). METIS no calcula nómina: la regla de pago del bono la define cada empresa. Datos al cierre de {MONTHS[s.month - 1]} {s.year}.</p>
    </>
  );
}
