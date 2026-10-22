"use client";
import clsx from "clsx";
import { useId } from "react";
import { Mail, MessageCircle, FileBarChart, Users, PhoneMissed } from "lucide-react";
import { CAST } from "@/lib/ceo/cast";
import type { CastId, Channel, KpiKey } from "@/lib/ceo/types";

export function Avatar({ id, size = 40, className }: { id: CastId; size?: number; className?: string }) {
  const p = CAST[id];
  return <span className={clsx("shrink-0 rounded-full grid place-items-center font-semibold", p.color, className)} style={{ width: size, height: size, fontSize: size * 0.36 }}>{p.initials}</span>;
}

export const CHANNEL: Record<Channel, { label: string; Icon: typeof Mail; cls: string }> = {
  email: { label: "Correo", Icon: Mail, cls: "bg-indigo-soft text-indigo" },
  whatsapp: { label: "WhatsApp", Icon: MessageCircle, cls: "bg-[#DCF8C6] text-[#128C7E]" },
  reporte: { label: "Reporte", Icon: FileBarChart, cls: "bg-sky-soft text-sky" },
  junta: { label: "Junta", Icon: Users, cls: "bg-amber-soft text-amber" },
  llamada: { label: "Llamada", Icon: PhoneMissed, cls: "bg-coral-soft text-coral" },
};

export function ChannelChip({ c, className }: { c: Channel; className?: string }) {
  const { label, Icon, cls } = CHANNEL[c];
  return <span className={clsx("chip gap-1", cls, className)}><Icon size={11} /> {label}</span>;
}

export const KPI_COLOR: Record<KpiKey, string> = { caja: "from-sky to-[#5CC0FF]", margen: "from-indigo to-indigo-light", equipo: "from-mint to-mint-light", clientes: "from-amber to-[#FFC65C]", consejo: "from-[#5B2A86] to-[#8B5CF6]" };

export function Bar({ value, k, className }: { value: number; k: KpiKey; className?: string }) {
  return (
    <div className={clsx("h-2 rounded-full bg-slate-100 overflow-hidden", className)}>
      <div className={clsx("h-full rounded-full bg-gradient-to-r transition-all duration-700", KPI_COLOR[k])} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Delta({ n }: { n: number }) {
  if (!n) return null;
  return <span className={clsx("tabular-nums text-xs font-semibold", n > 0 ? "text-sob" : "text-coral")}>{n > 0 ? `+${n}` : n}</span>;
}

export function rel(ts: number, now: number) {
  const d = Math.round((now - ts) / 60000);
  if (d < 1) return "ahora";
  if (d < 60) return `hace ${d} min`;
  const h = Math.round(d / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}
export function until(ts: number, now: number) {
  const m = Math.max(0, Math.round((ts - now) / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h ${m % 60 ? `${m % 60} min` : ""}`.trim() : `${Math.round(h / 24)} d`;
}
export function clock(ts: number, tz?: string) {
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(new Date(ts));
}

export function Flame({ on, size = 18, white }: { on: boolean; size?: number; white?: boolean }) {
  const gid = `fl${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={clsx(on ? "ceo-flame" : "")}>
      <path d="M12 2c1 3.5 5 5.5 5 10.5A5 5 0 0 1 7 12.5c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3 0-6 1-9z" fill={on ? (white ? "#fff" : `url(#${gid})`) : white ? "rgba(255,255,255,.35)" : "#CBD5E1"} />
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB020" /><stop offset="1" stopColor="#F2545B" /></linearGradient></defs>
    </svg>
  );
}
