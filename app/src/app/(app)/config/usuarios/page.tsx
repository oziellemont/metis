"use client";
import { FileSpreadsheet, Plus } from "lucide-react";
import { useMetis } from "@/lib/store";
import { Avatar, PageHeader } from "@/components/ui/primitives";

const ROLE: Record<string, string> = { admin: "Administrador", manager: "Jefe", collaborator: "Colaborador" };

export default function Usuarios() {
  const s = useMetis();
  return (
    <>
      <PageHeader title="Usuarios y roles" subtitle="Jerarquía jefe–colaborador. Si alguien cambia de jefe, sus aprobaciones y sesiones se actualizan solas."
        actions={<><button className="btn-ghost"><FileSpreadsheet size={14} /> Importar organigrama</button><button className="btn-primary"><Plus size={14} /> Invitar usuario</button></>} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-slate-100"><tr><th className="th">Usuario</th><th className="th">Equipo</th><th className="th">Reporta a</th><th className="th">Rol</th><th className="th text-right">Reportes directos</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {s.users.map((u) => {
              const m = s.users.find((x) => x.id === u.managerId);
              return (
                <tr key={u.id}>
                  <td className="td"><div className="flex items-center gap-3"><Avatar initials={u.initials} /><div><div className="font-medium">{u.name}</div><div className="text-xs text-slate-400">{u.title}</div></div></div></td>
                  <td className="td text-slate-600">{u.teamName}</td>
                  <td className="td text-slate-600">{m?.name ?? <span className="text-slate-400">—</span>}</td>
                  <td className="td"><span className="chip bg-slate-100 text-slate-600">{ROLE[u.role]}</span></td>
                  <td className="td text-right tabular-nums">{s.users.filter((x) => x.managerId === u.id).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
