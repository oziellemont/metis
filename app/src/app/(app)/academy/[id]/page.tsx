"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { moduleById } from "@/lib/academy/content";
import { ModulePlayer } from "@/components/academy/ModulePlayer";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const mod = moduleById(id);
  if (!mod) return <div className="card p-8 max-w-md mx-auto text-center"><p className="text-sm text-slate-500">Ese módulo no existe.</p><Link href="/academy" className="btn-primary mt-4">Ir a Metis Academy</Link></div>;
  return <ModulePlayer key={mod.id} mod={mod} />;
}
