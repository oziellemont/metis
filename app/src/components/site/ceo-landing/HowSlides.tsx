"use client";
/**
 * «Practica con casos que evolucionan»: tres pantallas en secuencia, como diapositivas.
 *  1. Llega el correo (así se ve el aviso en tu bandeja, con «Tu decisión» y «Responder», como lib/ceo/emails.ts).
 *  2. Lo ves en «Hoy · Esperando tu decisión» (como components/ceo/Today.tsx).
 *  3. Ya decidiste: tu respuesta, lo que contesta Sofía y lo que te queda por hoy.
 * Avanza sola cada HOW_INTERVAL_MS; se detiene con mouse, foco, interacción o movimiento reducido.
 * Ilustrativa y aislada: no usa el motor, la partida ni el almacenamiento.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowRight, CheckCheck, Clock, FileBarChart, Mail, MessageCircle, Pause, Play } from "lucide-react";
import { HOW_INTERVAL_MS, type Copy, type TodayItem } from "./content";

const CH = {
  email: { Icon: Mail, cls: "bg-indigo-soft text-indigo" },
  whatsapp: { Icon: MessageCircle, cls: "bg-[#DCF8C6] text-[#128C7E]" },
  reporte: { Icon: FileBarChart, cls: "bg-sky-soft text-sky" },
} as const;

function Avatar({ initials, tone, size = 36 }: { initials: string; tone: string; size?: number }) {
  return <span aria-hidden className="shrink-0 rounded-full grid place-items-center font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.36, background: tone }}>{initials}</span>;
}
function Chip({ c, label }: { c: TodayItem["channel"]; label: string }) {
  const { Icon, cls } = CH[c];
  return <span className={"chip gap-1 " + cls}><Icon size={11} aria-hidden /> {label}</span>;
}

function InboxSlide({ t }: { t: Copy }) {
  const S = t.HOW.slides.inbox, C = t.CASE;
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 text-[12px]">
        <span className="font-semibold text-ink">{S.app}</span>
        <span className="text-slate-400">{S.time}</span>
      </div>
      <div className="px-4 py-3 border-b border-slate-100 bg-indigo-soft/40 flex gap-3">
        <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2"><span className="text-[13px] font-semibold text-ink truncate">{S.fromLine}</span><span className="text-[11px] text-slate-400">{S.time}</span></div>
          <div className="text-[13px] font-medium text-ink truncate">{C.subject}</div>
          <div className="text-[12px] text-slate-500 line-clamp-1">{S.preview}</div>
        </div>
      </div>
      <div className="flex-1 px-4 py-4 overflow-hidden">
        <div className="flex items-center gap-3">
          <Avatar initials={C.from.initials} tone={C.from.tone} size={36} />
          <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold text-ink">{C.from.name}</div><div className="text-[11px] text-slate-500 truncate">{C.from.role}</div></div>
          <span className="text-[11px] text-slate-400">{C.channel}</span>
        </div>
        <div className="mt-3 text-[15px] font-semibold text-ink leading-snug">{C.subject}</div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600 line-clamp-3">{C.body[2]}</p>
        <div className="mt-3 rounded-xl bg-canvas p-3">
          <div className="text-[10px] font-bold tracking-[0.08em] uppercase text-indigo">{S.decision}</div>
          <div className="mt-1 text-[13px] font-semibold text-ink">{C.decide.ask}</div>
          <span className="mt-2.5 inline-flex rounded-lg bg-indigo px-3.5 py-1.5 text-[12px] font-semibold text-white">{S.button}</span>
        </div>
        <span className="mt-3 chip bg-amber-soft text-[#9A6408]">{S.deadline}</span>
      </div>
    </div>
  );
}

function TodaySlide({ t }: { t: Copy }) {
  const S = t.HOW.slides;
  return (
    <div className="h-full flex flex-col bg-canvas">
      <div className="bg-gradient-to-br from-[#141735] to-[#2B1F8A] px-4 py-3 text-[12px] font-medium text-white/80">{S.today.top}</div>
      <div className="p-3 flex-1">
        <div className="card p-4">
          <div className="flex items-center justify-between"><span className="text-[14px] font-semibold text-ink">{S.today.title}</span><span className="text-[11px] font-medium text-indigo inline-flex items-center gap-0.5">{S.today.inbox} <ArrowRight size={11} aria-hidden /></span></div>
          <ul className="mt-2 divide-y divide-slate-100">
            {S.today.items.map((it, i) => (
              <li key={it.name} className={clsx("flex gap-3 py-2.5", i === 0 && "relative")}>
                <Avatar initials={it.initials} tone={it.tone} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="text-[13px] font-semibold text-ink truncate">{it.name}</span><Chip c={it.channel} label={S.channel[it.channel]} /></div>
                  <div className="text-[12.5px] text-slate-600 truncate">{it.text}</div>
                  <div className="mt-0.5 text-[11px] inline-flex items-center gap-1 text-slate-400"><Clock size={10} aria-hidden /> {it.due}</div>
                </div>
                <ArrowRight size={14} aria-hidden className={clsx("mt-3 shrink-0", i === 0 ? "text-indigo" : "text-slate-300")} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function DoneSlide({ t }: { t: Copy }) {
  const S = t.HOW.slides.done, C = t.CASE;
  const i = C.options.findIndex((o) => o.id === S.option);
  const o = C.options[i];
  return (
    <div className="h-full flex flex-col bg-canvas">
      <div className="bg-gradient-to-br from-[#141735] to-[#2B1F8A] px-4 py-3 text-[12px] font-medium text-white/80 flex items-center justify-between">
        <span>{C.subject}</span>
      </div>
      <div className="p-3 space-y-2.5 flex-1 overflow-hidden">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{C.result.decided}</span>
            <span className="chip gap-1 bg-mint-soft text-sob"><CheckCheck size={11} aria-hidden /> {S.status}</span>
          </div>
          <p className="mt-1.5 text-[12.5px] font-medium text-ink leading-relaxed line-clamp-3">{String.fromCharCode(65 + i)}. {o.text}</p>
          <div className="mt-3 space-y-1.5">
            {o.reply.slice(0, 2).map((r) => <div key={r} className="flex gap-2"><Avatar initials={C.from.initials} tone={C.from.tone} size={22} /><p className="text-[12.5px] text-slate-700 leading-relaxed">{r}</p></div>)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{C.result.what}</div>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {o.effects.map(([k, v]) => <li key={k} className={clsx("chip text-[12px] gap-1", v > 0 ? "bg-indigo-soft text-indigo" : "bg-coral-soft text-coral")}>{k} <b className="tabular-nums">{v > 0 ? "+" : ""}{v}</b></li>)}
          </ul>
        </div>
        <p className="px-1 text-[11.5px] text-slate-500">{S.left}</p>
      </div>
    </div>
  );
}

export function HowSlides({ t }: { t: Copy }) {
  const S = t.HOW.slides;
  const slides = [InboxSlide, TodaySlide, DoneSlide];
  const n = slides.length;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [held, setHeld] = useState(false);
  const [calm, setCalm] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setCalm(mq.matches); setPlaying(!mq.matches);
    const on = () => { setCalm(mq.matches); if (mq.matches) setPlaying(false); };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    if (!playing || held) return;
    const id = window.setTimeout(() => setI((k) => (k + 1) % n), HOW_INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [playing, held, i, n]);
  const go = useCallback((k: number) => { setPlaying(false); setI(((k % n) + n) % n); }, [n]);

  return (
    <figure
      ref={root}
      aria-label={S.label}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={(e) => { if (!root.current?.contains(e.relatedTarget as Node | null)) setHeld(false); }}
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(i + 1); else if (e.key === "ArrowLeft") go(i - 1); }}
      className="min-w-0"
    >
      <div className="rounded-[22px] bg-white shadow-[0_18px_50px_-24px_rgba(23,26,58,.22)]">
        <div className="grid overflow-hidden rounded-[22px] bg-white h-[430px]">
          {slides.map((Slide, k) => (
            <div key={k} aria-hidden={k !== i} inert={k !== i} className={clsx("[grid-area:1/1] min-w-0 h-full", !calm && "motion-safe:transition-all motion-safe:duration-500", k === i ? "opacity-100 translate-x-0" : "opacity-0 pointer-events-none " + (k < i ? "-translate-x-4" : "translate-x-4"))}>
              <Slide t={t} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div role="group" aria-label={S.label} className="grid flex-1 grid-cols-3 gap-2">
          {S.tabs.map((tab, k) => (
            <button key={tab} type="button" onClick={() => go(k)} aria-current={k === i ? "true" : undefined} className="min-w-0 text-left rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo">
              <span className="block h-1 rounded-full bg-slate-200 overflow-hidden">
                <span className={clsx("block h-full rounded-full", k === i ? "bg-indigo" : k < i ? "bg-indigo/40" : "bg-transparent")} />
              </span>
              <span className={clsx("mt-1.5 block truncate text-[12px]", k === i ? "font-medium text-ink" : "text-slate-500")}>{k + 1}. {tab}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setPlaying((v) => !v)} aria-label={playing ? S.pause : S.play} className="h-9 w-9 shrink-0 grid place-items-center rounded-full text-slate-500 hover:text-ink hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo">
          {playing ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
        </button>
      </div>
      <figcaption className="mt-2 text-[11.5px] text-slate-500">{S.caption}</figcaption>
    </figure>
  );
}
