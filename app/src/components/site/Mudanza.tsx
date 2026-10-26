"use client";
/**
 * Mudanza de mêtis CEO: metisalign.app → metis.ceo, sin perder la partida.
 * El avance de quien juega sin cuenta vive en el localStorage del dominio viejo, así que:
 *  1) En metisalign.app: lee la partida y la manda a metis.ceo/mudanza en el #hash (no viaja al servidor).
 *  2) En metis.ceo: la guarda si es más reciente que la que ya haya ahí y entra a la ruta pedida.
 */
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { CEO_URL } from "@/lib/site";

const KEY = "metis-ceo-v1";
const enc = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const dec = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
const safePath = (p: string | null) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/");

export function Mudanza() {
  const [msg, setMsg] = useState("Llevando tu partida a metis.ceo…");
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const to = safePath(q.get("to"));
    const target = new URL(CEO_URL);
    const onNew = location.hostname === target.hostname || location.hostname === "www." + target.hostname;

    if (!onNew) {
      let raw: string | null = null;
      try { raw = localStorage.getItem(KEY); } catch { /* ignore */ }
      const dest = `${CEO_URL}/mudanza?to=${encodeURIComponent(to)}` + (raw ? `#p=${enc(raw)}` : "");
      location.replace(dest);
      return;
    }

    const m = location.hash.match(/[#&]p=([^&]+)/);
    if (m) {
      try {
        const incoming = JSON.parse(dec(m[1]));
        const cur = localStorage.getItem(KEY);
        const mine = cur ? JSON.parse(cur) : null;
        if (incoming && (!mine || !mine.startedAt || (incoming.savedAt ?? 0) > (mine.savedAt ?? 0))) localStorage.setItem(KEY, JSON.stringify(incoming));
      } catch { setMsg("No pudimos traer tu partida, pero puedes seguir aquí."); }
    }
    location.replace(to);
  }, []);

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white px-6">
      <div className="text-center">
        <div className="flex justify-center"><Logo variant="light" height={30} /></div>
        <p className="mt-6 text-lg font-semibold">mêtis CEO ahora vive en metis.ceo</p>
        <p className="mt-2 text-sm text-white/70">{msg}</p>
        <span className="mt-6 inline-block h-6 w-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    </main>
  );
}
