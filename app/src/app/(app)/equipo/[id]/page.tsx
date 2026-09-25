"use client";
import { useParams } from "next/navigation";
import { useMetis } from "@/lib/store";
import { ScorecardView } from "@/components/app/ScorecardView";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const s = useMetis();
  const u = s.users.find((x) => x.id === id);
  if (!u) return <div className="card p-8 text-center text-slate-500">Colaborador no encontrado.</div>;
  return <ScorecardView userId={u.id} asManager={u.id !== s.currentUserId} />;
}
