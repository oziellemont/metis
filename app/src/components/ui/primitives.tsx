"use client";
import clsx from "clsx";
import type { Traffic, ScorecardStatus, Responsibility } from "@/lib/domain/types";
import { RESP, STATUS, TRAFFIC } from "@/lib/labels";

export function Avatar({ initials, size = "md", className }: { initials: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const s = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-12 w-12 text-base" }[size];
  return (
    <span className={clsx("inline-flex items-center justify-center rounded-full bg-indigo-soft text-indigo font-semibold shrink-0", s, className)}>
      {initials}
    </span>
  );
}

export function TrafficChip({ t, compact = false }: { t: Traffic; compact?: boolean }) {
  const c = TRAFFIC[t];
  return (
    <span className={clsx("chip gap-1.5", c.bg, c.text)}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", c.dot)} />
      {!compact && c.label}
    </span>
  );
}

export function StatusChip({ s }: { s: ScorecardStatus }) {
  const c = STATUS[s];
  return <span className={clsx("chip", c.tone)}>{c.label}</span>;
}

export function RespChip({ r }: { r: Responsibility }) {
  const c = RESP[r];
  return (
    <span
      title={`${c.name} · ${c.help}`}
      className={clsx("chip font-semibold", r === "owner" ? "bg-indigo-soft text-indigo" : "bg-slate-100 text-slate-600")}
    >
      {c.code}
    </span>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={clsx("mt-1 text-2xl font-semibold", tone)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Sparkline({ values, targets, dir, className }: { values: (number | null)[]; targets: { sat: number }; dir: "up" | "down"; className?: string }) {
  const pts = values.map((v, i) => ({ v, i })).filter((p) => p.v !== null) as { v: number; i: number }[];
  if (pts.length < 2) return <span className={clsx("text-xs text-slate-300", className)}>—</span>;
  const all = [...pts.map((p) => p.v), targets.sat];
  const min = Math.min(...all), max = Math.max(...all), range = max - min || 1;
  const W = 80, H = 24;
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / range) * (H - 4) - 2;
  const d = pts.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1].v;
  const good = dir === "up" ? last >= targets.sat : last <= targets.sat;
  return (
    <svg width={W} height={H} className={className} aria-hidden>
      <line x1={0} x2={W} y1={y(targets.sat)} y2={y(targets.sat)} stroke="#CBD5E1" strokeDasharray="2 2" />
      <path d={d} fill="none" stroke={good ? "#14C98E" : "#F2545B"} strokeWidth={1.5} />
      <circle cx={x(pts[pts.length - 1].i)} cy={y(last)} r={2} fill={good ? "#14C98E" : "#F2545B"} />
    </svg>
  );
}
