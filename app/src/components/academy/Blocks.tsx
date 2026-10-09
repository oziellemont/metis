"use client";
/** Render de cada tipo de tarjeta de un módulo. Cada bloque avisa con `onReady` cuando ya se puede continuar. */
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Check, X, ChevronRight, Lightbulb, Quote, User, Users } from "lucide-react";
import type { Block } from "@/lib/academy/content";
import { TourMock } from "./TourMock";

const Eyebrow = ({ children }: { children: React.ReactNode }) => <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">{children}</div>;
const Title = ({ children }: { children: React.ReactNode }) => <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-ink leading-snug">{children}</h2>;
const Note = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-5 flex gap-2.5 rounded-xl bg-indigo-soft/60 px-4 py-3 text-sm text-ink"><Lightbulb size={16} className="text-indigo shrink-0 mt-0.5" /><span>{children}</span></div>
);

export function BlockView({ block, onReady }: { block: Block; onReady: (ok: boolean) => void }) {
  switch (block.kind) {
    case "text": return <TextB b={block} onReady={onReady} />;
    case "reveal": return <RevealB b={block} onReady={onReady} />;
    case "flow": return <FlowB b={block} onReady={onReady} />;
    case "compare": return <CompareB b={block} onReady={onReady} />;
    case "check": return <CheckB b={block} onReady={onReady} />;
    case "screen": return <ScreenB b={block} onReady={onReady} />;
  }
}

function TextB({ b, onReady }: { b: Extract<Block, { kind: "text" }>; onReady: (ok: boolean) => void }) {
  useEffect(() => onReady(true), [onReady]);
  return (
    <div>
      <Eyebrow>{b.eyebrow}</Eyebrow><Title>{b.title}</Title>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-600">{b.body.map((p) => <p key={p}>{p}</p>)}</div>
      {b.callout && (
        <div className="mt-6 relative rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-indigo-soft/40 p-5">
          <Quote size={18} className="absolute right-4 top-4 text-indigo/20" />
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{b.callout.label}</div>
          <p className="mt-1 text-[15px] font-medium text-ink leading-snug">{b.callout.text}</p>
          {b.callout.source && <p className="mt-2 text-xs text-slate-400">{b.callout.source}</p>}
        </div>
      )}
    </div>
  );
}

function RevealB({ b, onReady }: { b: Extract<Block, { kind: "reveal" }>; onReady: (ok: boolean) => void }) {
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<number | null>(null);
  const all = seen.size === b.items.length;
  useEffect(() => onReady(all), [all, onReady]);
  const pick = (i: number) => { setOpen(i); setSeen((s) => new Set(s).add(i)); };

  if (b.layout === "pyramid") {
    const cur = open !== null ? b.items[open] : null;
    return (
      <div>
        <Eyebrow>{b.eyebrow}</Eyebrow><Title>{b.title}</Title>
        {b.intro && <p className="mt-2 text-sm text-slate-500">{b.intro} <span className="text-slate-400">({seen.size}/{b.items.length})</span></p>}
        <div className="mt-5 grid gap-5 md:grid-cols-[1fr_1.1fr] items-start">
          <div className="flex flex-col-reverse items-center gap-1.5">
            {b.items.map((it, i) => (
              <button key={it.tag} onClick={() => pick(i)} style={{ width: `${100 - i * 9}%` }}
                className={clsx("rounded-xl px-3 py-2.5 text-left text-[12px] sm:text-[13px] font-medium transition-all flex items-center gap-2",
                  open === i ? "bg-indigo text-white shadow-lg shadow-indigo/20" : seen.has(i) ? "bg-indigo-soft text-indigo" : "bg-white border border-slate-200 text-ink hover:border-indigo/40")}>
                <span className={clsx("h-5 w-5 shrink-0 rounded-full grid place-items-center text-[10px] font-semibold", open === i ? "bg-white/20" : "bg-white")}>{seen.has(i) && open !== i ? <Check size={11} /> : it.tag}</span>
                <span className="leading-tight">{it.label}</span>
              </button>
            ))}
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Resultados ↑</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 min-h-[220px]">
            {cur ? (
              <div key={open} className="academy-in">
                <div className="text-xs font-semibold text-indigo">Nivel {cur.tag}</div>
                <div className="mt-0.5 font-semibold text-ink">{cur.label}</div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{cur.body}</p>
                {cur.details?.map((d) => (
                  <div key={d.label} className="mt-3"><div className={clsx("text-[11px] font-semibold uppercase tracking-wider", d.label === "Antídoto" ? "text-sob" : "text-slate-400")}>{d.label}</div><p className="text-sm text-ink">{d.text}</p></div>
                ))}
              </div>
            ) : <div className="h-full grid place-items-center text-sm text-slate-400 text-center px-6">Empieza por la base: toca «{b.items[0].label}».</div>}
          </div>
        </div>
        {b.source && <p className="mt-4 text-xs text-slate-400">{b.source}</p>}
      </div>
    );
  }

  return (
    <div>
      <Eyebrow>{b.eyebrow}</Eyebrow><Title>{b.title}</Title>
      {b.intro && <p className="mt-2 text-sm text-slate-500">{b.intro} <span className="text-slate-400">({seen.size}/{b.items.length})</span></p>}
      <div className="mt-5 space-y-2.5">
        {b.items.map((it, i) => {
          const isOpen = open === i;
          return (
            <button key={it.tag} onClick={() => pick(i)} className={clsx("w-full text-left rounded-2xl border p-4 transition-all", isOpen ? "border-indigo/40 bg-white shadow-[0_8px_24px_-12px_rgba(79,63,224,0.35)]" : "border-slate-100 bg-white hover:border-indigo/30")}>
              <div className="flex items-center gap-3">
                <span className={clsx("h-8 w-8 shrink-0 rounded-xl grid place-items-center text-sm font-semibold transition-colors", isOpen ? "bg-indigo text-white" : seen.has(i) ? "bg-mint-soft text-sob" : "bg-indigo-soft text-indigo")}>{seen.has(i) && !isOpen ? <Check size={15} /> : it.tag}</span>
                <span className="font-medium text-ink flex-1">{it.label}</span>
                <ChevronRight size={16} className={clsx("text-slate-300 transition-transform", isOpen && "rotate-90 text-indigo")} />
              </div>
              {isOpen && (
                <div className="academy-in pl-11 pt-2">
                  <p className="text-sm text-slate-600 leading-relaxed">{it.body}</p>
                  {it.details?.map((d) => <p key={d.label} className="mt-2 text-sm"><span className="font-semibold text-indigo">{d.label}:</span> <span className="text-ink">{d.text}</span></p>)}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {b.note && all && <Note>{b.note}</Note>}
      {b.source && <p className="mt-4 text-xs text-slate-400">{b.source}</p>}
    </div>
  );
}

function FlowB({ b, onReady }: { b: Extract<Block, { kind: "flow" }>; onReady: (ok: boolean) => void }) {
  const [n, setN] = useState(1);
  const all = n >= b.steps.length;
  useEffect(() => onReady(all), [all, onReady]);
  return (
    <div>
      <Eyebrow>{b.eyebrow}</Eyebrow><Title>{b.title}</Title>
      {b.intro && <p className="mt-2 text-sm text-slate-500">{b.intro}</p>}
      <ol className="mt-6">
        {b.steps.slice(0, n).map((st, i) => (
          <li key={st.label} className="academy-in relative pl-10 pb-5 last:pb-0">
            {i < n - 1 && <span aria-hidden className="absolute left-[13px] top-7 bottom-0 w-px bg-gradient-to-b from-indigo/40 to-indigo/10" />}
            <span className={clsx("absolute left-0 top-0 h-7 w-7 rounded-full grid place-items-center text-xs font-semibold", i === b.steps.length - 1 ? "bg-mint text-white" : "bg-indigo text-white")}>{i + 1}</span>
            <div className="font-medium text-ink leading-7">{st.label}</div>
            <div className="mt-0.5 text-sm text-slate-500 leading-relaxed">{st.example}</div>
          </li>
        ))}
      </ol>
      {!all && <button onClick={() => setN(n + 1)} className="mt-5 btn-ghost">Siguiente paso <ChevronRight size={14} /></button>}
      {all && b.note && <Note>{b.note}</Note>}
    </div>
  );
}

function CompareB({ b, onReady }: { b: Extract<Block, { kind: "compare" }>; onReady: (ok: boolean) => void }) {
  useEffect(() => onReady(true), [onReady]);
  return (
    <div>
      <Eyebrow>{b.eyebrow}</Eyebrow><Title>{b.title}</Title>
      {b.intro && <p className="mt-2 text-sm text-slate-500">{b.intro}</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {b.neutral
          ? [{ s: b.left, Icon: User }, { s: b.right, Icon: Users }].map(({ s, Icon }, k) => (
            <div key={s.label} className="academy-in rounded-2xl p-5 border bg-indigo-soft/40 border-indigo/15" style={{ animationDelay: `${k * 120}ms` }}>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo">
                <span className="h-5 w-5 rounded-full grid place-items-center bg-indigo text-white"><Icon size={11} strokeWidth={3} /></span>{s.label}
              </div>
              <ul className="mt-3 space-y-2">{s.points.map((p) => <li key={p} className="text-sm text-ink leading-snug">{p}</li>)}</ul>
            </div>
          ))
          : [{ s: b.left, good: false }, { s: b.right, good: true }].map(({ s, good }, k) => (
          <div key={s.label} className={clsx("academy-in rounded-2xl p-5 border", good ? "bg-mint-soft/40 border-mint/20" : "bg-slate-50 border-slate-100")} style={{ animationDelay: `${k * 120}ms` }}>
            <div className={clsx("inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider", good ? "text-sob" : "text-slate-500")}>
              <span className={clsx("h-5 w-5 rounded-full grid place-items-center", good ? "bg-mint text-white" : "bg-slate-200 text-slate-500")}>{good ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}</span>{s.label}
            </div>
            <ul className="mt-3 space-y-2">{s.points.map((p) => <li key={p} className="text-sm text-ink leading-snug">{p}</li>)}</ul>
          </div>
        ))}
      </div>
      {b.note && <Note>{b.note}</Note>}
    </div>
  );
}

export function OptionList({ options, picked, onPick, order }: { options: { text: string; correct?: boolean; why: string }[]; picked: number | null; onPick: (i: number) => void; order?: number[] }) {
  const idx = order ?? options.map((_, i) => i);
  return (
    <div className="space-y-2.5">
      {idx.map((i, k) => {
        const o = options[i];
        const done = picked !== null;
        const isPicked = picked === i;
        return (
          <div key={i}>
            <button disabled={done} onClick={() => onPick(i)}
              className={clsx("w-full text-left rounded-2xl border px-4 py-3.5 text-sm transition-all flex items-start gap-3",
                !done && "bg-white border-slate-200 hover:border-indigo/50 hover:bg-indigo-soft/30",
                done && o.correct && "bg-mint-soft/50 border-mint/40",
                done && isPicked && !o.correct && "bg-coral-soft/50 border-coral/40",
                done && !isPicked && !o.correct && "bg-white border-slate-100 opacity-60")}>
              <span className={clsx("h-6 w-6 shrink-0 rounded-lg grid place-items-center text-[11px] font-semibold",
                done && o.correct ? "bg-mint text-white" : done && isPicked ? "bg-coral text-white" : "bg-slate-100 text-slate-500")}>
                {done && o.correct ? <Check size={13} strokeWidth={3} /> : done && isPicked ? <X size={13} strokeWidth={3} /> : String.fromCharCode(65 + k)}
              </span>
              <span className="text-ink leading-snug pt-0.5">{o.text}</span>
            </button>
            {done && (isPicked || o.correct) && (
              <p className={clsx("academy-in mt-1.5 ml-9 text-[13px] leading-snug", o.correct ? "text-sob" : "text-coral")}>{o.why}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CheckB({ b, onReady }: { b: Extract<Block, { kind: "check" }>; onReady: (ok: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => onReady(picked !== null), [picked, onReady]);
  return (
    <div>
      <Eyebrow>{b.eyebrow}</Eyebrow><Title>{b.title}</Title>
      <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">{b.question}</p>
      <div className="mt-5"><OptionList options={b.options} picked={picked} onPick={setPicked} /></div>
    </div>
  );
}

function ScreenB({ b, onReady }: { b: Extract<Block, { kind: "screen" }>; onReady: (ok: boolean) => void }) {
  useEffect(() => onReady(true), [onReady]);
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.15fr] items-center">
      <div>
        <Eyebrow>Tour · {b.eyebrow}</Eyebrow><Title>{b.title}</Title>
        <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-slate-600">{b.body.map((p) => <p key={p}>{p}</p>)}</div>
      </div>
      <div className="academy-in"><TourMock screen={b.nav} /></div>
    </div>
  );
}
