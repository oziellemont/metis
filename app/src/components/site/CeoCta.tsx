"use client";
/** Botón principal de la landing de mêtis CEO: «Empezar» o, si ya juegas en este navegador, «Seguir mi carrera». */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export function CeoCta({ className = "", label = "Empieza tu primer día" }: { className?: string; label?: string }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    // Partida sin cuenta (metis-ceo-v1) o copia de alguna cuenta (metis-ceo-v2:<usuario>) en este navegador.
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) ?? "";
        if (k !== "metis-ceo-v1" && !/^metis-ceo-v2:[^:]+$/.test(k)) continue;
        const raw = localStorage.getItem(k);
        if (raw && JSON.parse(raw)?.startedAt) { setPlaying(true); break; }
      }
    } catch { /* ignore */ }
  }, []);
  return (
    <Link href={playing ? "/ceo" : "/ceo/empezar"} className={"btn bg-mint text-white hover:bg-mint-light !px-5 !py-3 " + className}>
      {playing ? "Seguir mi carrera" : label} <ArrowRight size={16} />
    </Link>
  );
}
