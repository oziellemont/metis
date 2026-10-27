"use client";
/**
 * Junta ante el Consejo: requisito para el nombramiento de Chief Executive Officer.
 * Tres momentos encadenados ante el presidente y la consejera independiente de la empresa actual.
 * La lógica vive en lib/ceo/board.ts; aquí solo se presenta y se guarda el resultado.
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Check, Clock, Lock, X } from "lucide-react";
import {
  CRITERIA, PASS_CRITERION, PASS_TRUST, STEPS, boardAccess, chainsAt, fill, scoreBoard, startTrust, type Picks,
} from "@/lib/ceo/board";
import { STAGES } from "@/lib/ceo/journey";
import { personOf } from "@/lib/ceo/cast";
import { celebrate } from "@/lib/ceo/celebrate";
import { useCeo } from "./CeoProvider";
import { Avatar, until } from "./ui";

export function BoardView() {
  const c = useCeo();
  // El acceso se evalúa al entrar; durante la sesión manda el estado local (guardar el resultado no la cierra a medias).
  const [session, setSession] = useState<"intro" | "play" | null>(null);
  const access = boardAccess(c.s, c.now);
  if (!c.ready) return null;
  if (session) return <Session onExit={() => setSession(null)} />;
  if (!access.open) return <Closed reason={access.reason} untilTs={access.until} />;
  return <Intro onStart={() => setSession("play")} />;
}

function useNames() {
  const c = useCeo();
  const chair = personOf(c.pack, c.pack.roles.chair), board = personOf(c.pack, c.pack.roles.board);
  return { chair, board, names: { chair: chair.name, board: board.name } };
}

// ───────────────────────────────────────────── cerrada
function Closed({ reason, untilTs }: { reason: "stage" | "passed" | "past" | "wait"; untilTs?: number }) {
  const c = useCeo();
  const ceo = STAGES[4].name;
  const text = {
    stage: `La junta es el último requisito para el nombramiento de ${ceo}. Se abre cuando llegues a ${STAGES[3].name}.`,
    passed: "Ya superaste la Junta ante el Consejo. Queda registrada en tu carrera.",
    past: `Ya tienes el nombramiento de ${ceo} o uno superior. No necesitas presentar la junta.`,
    wait: `El consejo vuelve a sesionar en ${untilTs ? until(untilTs, c.now) : "un día"}. Mientras, revisa qué criterio te faltó y sigue dirigiendo.`,
  }[reason];
  return (
    <div className="max-w-2xl mx-auto">
      <section className="card p-8 text-center">
        <span className="mx-auto h-14 w-14 rounded-2xl bg-indigo-soft text-indigo grid place-items-center">{reason === "passed" ? <Check size={24} /> : reason === "wait" ? <Clock size={24} /> : <Lock size={24} />}</span>
        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-indigo">Junta ante el Consejo</div>
        <h1 className="mt-1 text-xl font-semibold text-ink">{reason === "passed" ? "Junta superada" : reason === "wait" ? "La siguiente sesión todavía no empieza" : "Todavía no te toca"}</h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{text}</p>
        <Link href="/ceo/carrera" className="btn-primary mt-6 inline-flex">Ir a mi carrera <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}

// ───────────────────────────────────────────── portada
function Intro({ onStart }: { onStart: () => void }) {
  const c = useCeo();
  const { chair, board } = useNames();
  const t0 = startTrust(c.relations[chair.id] ?? 50, c.relations[board.id] ?? 50);
  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-8 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div className="relative">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Requisito para {STAGES[4].name}</div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight">Junta ante el Consejo</h1>
          <p className="mt-3 text-white/80 leading-relaxed max-w-2xl">Antes de nombrarte Director General, el consejo de {c.pack.name} quiere verte en la sala. Tres momentos, uno detrás de otro. Lo que digas en uno se queda en el acta y pesa en el siguiente.</p>
          <div className="mt-5 grid grid-cols-3 gap-3 max-w-lg">
            <Stat k="Momentos" v={String(STEPS.length)} />
            <Stat k="Duración" v="10 min" />
            <Stat k="Confianza inicial" v={String(t0)} />
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">En la mesa</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[chair, board].map((p) => (
            <div key={p.id} className="rounded-2xl bg-canvas p-4 flex gap-3">
              <Avatar id={p.id} size={40} />
              <div className="min-w-0">
                <div className="font-semibold text-ink text-sm">{p.name}</div>
                <div className="text-xs text-slate-500">{p.role}</div>
                <p className="mt-1.5 text-sm text-slate-600">{p.cares}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">Tu relación con ellos durante la temporada define con cuánta confianza entras. Para superar la junta necesitas cerrar con confianza de {PASS_TRUST} o más y ningún criterio debajo de {PASS_CRITERION}.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          {CRITERIA.map((k) => (
            <li key={k.id} className="rounded-2xl border border-slate-100 p-4"><b className="text-ink block">{k.name}</b><span className="text-slate-600">{k.what}</span></li>
          ))}
        </ul>
        <button onClick={onStart} className="btn-primary mt-5 w-full sm:w-auto">Entrar a la sala <ArrowRight size={16} /></button>
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return <div className="rounded-2xl bg-white/10 px-3 py-2.5"><div className="text-[11px] text-white/60">{k}</div><div className="text-lg font-semibold tabular-nums">{v}</div></div>;
}

// ───────────────────────────────────────────── sesión
function Session({ onExit }: { onExit: () => void }) {
  const c = useCeo();
  const { chair, board, names } = useNames();
  const [t0] = useState(() => startTrust(c.relations[chair.id] ?? 50, c.relations[board.id] ?? 50));
  const [picks, setPicks] = useState<Picks>({});
  const [i, setI] = useState(0);
  const [saved, setSaved] = useState(false);
  const headRef = useRef<HTMLHeadingElement>(null);
  const reactRef = useRef<HTMLParagraphElement>(null);

  const done = i >= STEPS.length;
  const result = useMemo(() => scoreBoard(picks, t0), [picks, t0]);
  const step = done ? null : STEPS[i];
  const picked = step ? step.options.find((o) => o.id === picks[step.id]) : undefined;
  const chains = step ? chainsAt(step.id, picks) : [];

  useEffect(() => { headRef.current?.focus(); }, [i]);
  useEffect(() => { if (picked) reactRef.current?.focus(); }, [picked]);
  useEffect(() => {
    if (!done || saved || !result.complete) return;
    setSaved(true);
    c.recordBoard(result.passed);
    if (result.passed) celebrate("appointment");
  }, [done, saved, result, c]);

  if (done) return <Result result={result} t0={t0} picks={picks} onExit={onExit} />;
  const who = step!.speaker === "chair" ? chair : board;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>Junta ante el Consejo · {c.pack.name}</span>
        <span className="tabular-nums">Momento {i + 1} de {STEPS.length}</span>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {STEPS.map((s, k) => <div key={s.id} className={clsx("h-1.5 flex-1 rounded-full", k < i ? "bg-indigo" : k === i ? "bg-indigo/50" : "bg-indigo-soft")} />)}
      </div>

      <section className="card p-5 sm:p-7">
        <h1 ref={headRef} tabIndex={-1} className="text-xl font-semibold text-ink outline-none">{step!.title}</h1>
        {chains.map((ch) => (
          <p key={ch.text} className="mt-4 rounded-2xl border-l-4 border-indigo/40 bg-indigo-soft/40 px-4 py-3 text-sm text-ink">{fill(ch.text, names)}</p>
        ))}
        <div className="mt-5 flex gap-3">
          <Avatar id={who.id} size={40} />
          <div className="min-w-0">
            <div className="text-xs text-slate-500">{who.name} · {who.role}</div>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">{fill(step!.prompt, names)}</p>
          </div>
        </div>

        <fieldset className="mt-6" disabled={!!picked}>
          <legend className="text-sm font-semibold text-ink">¿Qué haces?</legend>
          <div className="mt-3 space-y-2.5">
            {step!.options.map((o) => {
              const on = picked?.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicks((p) => ({ ...p, [step!.id]: o.id }))}
                  className={clsx("w-full text-left rounded-2xl border p-4 text-sm leading-relaxed transition-colors",
                    on ? "border-indigo bg-indigo-soft/50 text-ink" : picked ? "border-slate-100 text-slate-400" : "border-slate-200 text-ink hover:border-indigo/50 hover:bg-indigo-soft/20")}
                >{o.label}</button>
              );
            })}
          </div>
        </fieldset>

        <div aria-live="polite">
          {picked && (
            <div className="mt-5 space-y-3 academy-in">
              <p ref={reactRef} tabIndex={-1} className="rounded-2xl bg-canvas p-4 text-sm text-ink outline-none">{fill(picked.reaction, names)}</p>
              <p className="text-sm text-slate-600"><b className="text-ink">Nota CEO.</b> {step!.nota}</p>
              <button onClick={() => setI((n) => n + 1)} className="btn-primary">{i + 1 < STEPS.length ? "Siguiente momento" : "Escuchar al consejo"} <ArrowRight size={16} /></button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ───────────────────────────────────────────── resultado
function Result({ result, t0, picks, onExit }: { result: ReturnType<typeof scoreBoard>; t0: number; picks: Picks; onExit: () => void }) {
  const { chair } = useNames();
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headRef.current?.focus(); }, []);
  const weak = CRITERIA.find((k) => k.id === result.weakest)!;
  const trustLow = result.trust < PASS_TRUST;
  const chainCount = STEPS.reduce((n, s) => n + chainsAt(s.id, picks).length, 0);
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <section className={clsx("rounded-3xl p-6 sm:p-8", result.passed ? "bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white" : "card")}>
        <div className={clsx("text-[11px] font-semibold uppercase tracking-wider", result.passed ? "text-white/60" : "text-indigo")}>Veredicto del consejo</div>
        <h1 ref={headRef} tabIndex={-1} className={clsx("mt-2 text-2xl font-semibold leading-tight outline-none", result.passed ? "text-white" : "text-ink")}>
          {result.passed ? "Superaste la Junta ante el Consejo." : "El consejo todavía no te da su voto."}
        </h1>
        <p className={clsx("mt-3 text-sm leading-relaxed max-w-2xl", result.passed ? "text-white/80" : "text-slate-600")}>
          {result.passed
            ? `${chair.name} cierra la sesión: «Queda en el acta. Si cumples lo demás, el nombramiento es tuyo». El requisito ya aparece cumplido en tu carrera.`
            : trustLow
              ? `${chair.name} agradece tu tiempo y pide volver a verte en la siguiente sesión. La confianza quedó en ${result.trust}; necesitabas ${PASS_TRUST}.`
              : `La sala confía en ti, pero ${weak.name.toLowerCase()} quedó debajo de ${PASS_CRITERION}. El consejo no vota con promedios: revisa cada criterio.`}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 [&>*]:min-w-0">
          <Score label="Confianza" value={result.trust} line={PASS_TRUST} dark={result.passed} sub={`Entraste con ${t0}`} />
          {CRITERIA.map((k) => <Score key={k.id} label={k.id === "rendicion" ? "Rendición" : k.name} value={result.scores[k.id]} line={PASS_CRITERION} dark={result.passed} />)}
        </div>
        {chainCount > 0 && <p className={clsx("mt-4 text-xs", result.passed ? "text-white/60" : "text-slate-500")}>{chainCount === 1 ? "Una de tus respuestas" : `${chainCount} de tus respuestas`} cambió lo que pasó después en la sala.</p>}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/ceo/carrera" className={clsx("inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold", result.passed ? "bg-white text-ink hover:bg-white/90" : "bg-indigo text-white hover:bg-indigo/90")}>Ir a mi carrera <ArrowRight size={15} /></Link>
          {!result.passed && <button onClick={onExit} className="btn-ghost">Volver</button>}
        </div>
        {!result.passed && <p className="mt-4 text-xs text-slate-500">Puedes volver a presentar la junta cuando el consejo vuelva a sesionar, en un día.</p>}
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Lo que dijiste en la sala</h2>
        <ol className="mt-4 space-y-3">
          {STEPS.map((s, k) => {
            const o = s.options.find((x) => x.id === picks[s.id]);
            return (
              <li key={s.id} className="rounded-2xl border border-slate-100 p-4 text-sm">
                <div className="text-xs text-slate-500">Momento {k + 1} · {s.title}</div>
                <div className="mt-1 text-ink">{o?.label}</div>
                <div className="mt-2 text-slate-600"><b className="text-ink">Nota CEO.</b> {s.nota}</div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function Score({ label, value, line, dark, sub }: { label: string; value: number; line: number; dark?: boolean; sub?: string }) {
  const ok = value >= line;
  return (
    <div className={clsx("rounded-2xl p-3.5", dark ? "bg-white/10" : "border border-slate-100")}>
      <div className={clsx("flex items-center justify-between gap-1 text-[11px]", dark ? "text-white/60" : "text-slate-500")}>
        <span className="truncate" title={label}>{label}</span>
        {ok ? <Check size={13} strokeWidth={3} className="text-mint" aria-label="Cumple" /> : <X size={13} strokeWidth={3} className="text-coral" aria-label="No cumple" />}
      </div>
      <div className={clsx("mt-1 text-xl font-semibold tabular-nums", dark ? "text-white" : "text-ink")}>{value}<span className={clsx("text-xs font-normal", dark ? "text-white/40" : "text-slate-400")}> / {line}</span></div>
      {sub && <div className={clsx("mt-1 text-[11px]", dark ? "text-white/50" : "text-slate-500")}>{sub}</div>}
    </div>
  );
}
