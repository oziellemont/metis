"use client";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Briefcase, Check, Clock, Hourglass, XCircle } from "lucide-react";
import { personOf } from "@/lib/ceo/cast";
import { useCeo } from "./CeoProvider";
import { Avatar, ChannelChip, clock, rel, until } from "./ui";

const TABS = [
  { k: "todo", label: "Todo" },
  { k: "pendiente", label: "Pendientes" },
  { k: "decidido", label: "Decididos" },
  { k: "vencido", label: "Vencidos" },
] as const;

export function InboxView() {
  const c = useCeo();
  const [tab, setTab] = useState<(typeof TABS)[number]["k"]>("todo");
  const list = c.inbox.filter((e) => tab === "todo" || e.status === tab);
  // Casos ejecutivos que ya llegaron: van arriba mientras estén pendientes; cerrados, en «Decididos».
  const eps = c.episodes.filter((e) => e.status !== "futuro" && (tab === "todo" || (tab === "pendiente" && e.status === "pendiente") || (tab === "decidido" && e.status === "cerrado")));
  const epCount = (k: string) => c.episodes.filter((e) => e.status !== "futuro" && (k === "todo" || (k === "pendiente" && e.status === "pendiente") || (k === "decidido" && e.status === "cerrado"))).length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Bandeja</h1>
      <p className="text-sm text-slate-500 mt-1">Correos, WhatsApps, reportes, llamadas y juntas. Si algo vence, alguien decide por ti.</p>
      <div className="mt-5 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => {
          const n = (t.k === "todo" ? c.inbox.length : c.inbox.filter((e) => e.status === t.k).length) + epCount(t.k);
          return <button key={t.k} onClick={() => setTab(t.k)} className={clsx("chip px-3 py-1.5 text-sm whitespace-nowrap", tab === t.k ? "bg-ink text-white" : "bg-white border border-slate-200 text-slate-600")}>{t.label} <span className="ml-1.5 opacity-60 tabular-nums">{n}</span></button>;
        })}
      </div>
      <div className="mt-4 card divide-y divide-slate-100 overflow-hidden">
        {list.length === 0 && eps.length === 0 && <div className="p-8 text-center text-sm text-slate-500">Nada por aquí.</div>}
        {eps.map((e) => (
          <Link key={e.spec.id} href={`/ceo/episodio/${e.spec.id}`} className={clsx("flex gap-3 p-4 hover:bg-slate-50 transition-colors", e.status === "pendiente" && !e.run && "bg-indigo-soft/30")}>
            <div className="relative"><Avatar id={e.spec.from} size={42} />{e.status === "pendiente" && !e.run && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-coral ring-2 ring-white" />}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={clsx("text-sm truncate", e.status === "pendiente" ? "font-semibold text-ink" : "font-medium text-slate-700")}>{personOf(c.pack, e.spec.from).name}</span>
                <ChannelChip c={e.spec.channel} className="hidden sm:inline-flex" />
                <span className="ml-auto text-[11px] text-slate-400 whitespace-nowrap">{rel(e.arrivesAt, c.now)}</span>
              </div>
              <div className={clsx("text-sm truncate", e.status === "pendiente" ? "text-ink font-medium" : "text-slate-600")}>{e.spec.subject}</div>
              <div className="text-xs text-slate-400 truncate">{e.spec.title}</div>
              <div className="mt-1.5">
                {e.status === "pendiente" && <span className="chip gap-1 bg-indigo-soft text-indigo"><Briefcase size={11} /> Caso ejecutivo · {e.run ? "en curso" : `unos ${e.spec.minutes} min`}</span>}
                {e.status === "cerrado" && <span className="chip gap-1 bg-mint-soft text-sob"><Check size={11} strokeWidth={3} /> Caso cerrado</span>}
              </div>
            </div>
          </Link>
        ))}
        {list.map((e) => {
          const unread = e.status === "pendiente" && !c.s.read[e.item.id];
          return (
            <Link key={e.item.id} href={`/ceo/caso/${e.item.id}`} className={clsx("flex gap-3 p-4 hover:bg-slate-50 transition-colors", unread && "bg-indigo-soft/30")}>
              <div className="relative"><Avatar id={e.item.from} size={42} />{unread && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-coral ring-2 ring-white" />}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={clsx("text-sm truncate", unread ? "font-semibold text-ink" : "font-medium text-slate-700")}>{personOf(c.pack, e.item.from).name}</span>
                  <ChannelChip c={e.item.channel} className="hidden sm:inline-flex" />
                  <span className="ml-auto text-[11px] text-slate-400 whitespace-nowrap">{rel(e.arrivesAt, c.now)}</span>
                </div>
                <div className={clsx("text-sm truncate", unread ? "text-ink font-medium" : "text-slate-600")}>{e.item.subject}</div>
                <div className="text-xs text-slate-400 truncate">{e.item.preview}</div>
                <div className="mt-1.5">
                  {e.status === "pendiente" && <span className={clsx("chip gap-1", e.deadline - c.now < 3 * 3_600_000 ? "bg-coral-soft text-coral" : "bg-amber-soft text-amber")}><Clock size={11} /> Vence en {until(e.deadline, c.now)}</span>}
                  {e.status === "decidido" && <span className="chip gap-1 bg-mint-soft text-sob"><Check size={11} strokeWidth={3} /> Decidido</span>}
                  {e.status === "vencido" && <span className="chip gap-1 bg-slate-100 text-slate-500"><XCircle size={11} /> Venció sin respuesta</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {c.nextArrival && <p className="mt-4 text-xs text-slate-400 inline-flex items-center gap-1.5"><Hourglass size={12} /> Siguiente asunto a las {clock(c.nextArrival)}.</p>}
    </div>
  );
}
