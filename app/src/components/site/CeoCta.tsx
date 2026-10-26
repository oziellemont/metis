"use client";
/** Botón principal de la landing de mêtis CEO: «Empezar» o, si ya juegas en este navegador, «Seguir mi carrera». */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export function CeoCta({ className = "", label = "Empieza tu primer día" }: { className?: string; label?: string }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem("metis-ceo-v1"); if (raw && JSON.parse(raw)?.startedAt) setPlaying(true); } catch { /* ignore */ }
  }, []);
  return (
    <Link href={playing ? "/ceo" : "/ceo/empezar"} className={"btn bg-mint text-white hover:bg-mint-light !px-5 !py-3 " + className}>
      {playing ? "Seguir mi carrera" : label} <ArrowRight size={16} />
    </Link>
  );
}
