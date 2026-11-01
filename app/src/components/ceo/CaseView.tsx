"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, BookOpen, CheckCheck, PenLine, ListChecks, Clock, Globe2, Lightbulb, PhoneMissed, Play, Quote, XCircle } from "lucide-react";
import { firstName, personOf } from "@/lib/ceo/cast";
import { effectOf, entryXp, nextLessonXp } from "@/lib/ceo/engine";
import { runSpans } from "@/lib/ceo/pausetime";
import { entryRipples, moodOf, REL_START } from "@/lib/ceo/relations";
import { lessonById } from "@/lib/ceo/lessons";
import type { Entry, Item, KpiKey, Option, Written } from "@/lib/ceo/types";
import { MAX_CHARS, MIN_CHARS, textProblem, writtenEligible } from "@/lib/ceo/written";
import { useCeo } from "./CeoProvider";
import { competenciesOfItem } from "@/lib/ceo/mastery";
import { competencyNames, helpBand } from "@/lib/ceo/profile";
import { Avatar, ChannelChip, clock, until } from "./ui";
import { Stage, StageChoice, StepTitle } from "./Stage";

const CASE_STEPS = ["El caso", "Contexto", "Decides", "Resultado", "Aprendes"];

export function CaseView({ id }: { id: string }) {
  const c = useCeo();
  const e = c.entries.find((x) => x.item.id === id);
  const [picked, setPicked] = useState<string | null>(null);
  const [justDecided, setJustDecided] = useState(false);
  const [mode, setMode] = useState<"options" | "write">("options");
  const [ai, setAi] = useState<{ available: boolean; consent: boolean; enabled: boolean } | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ev, setEv] = useState<{ option: string; quality: Written["quality"]; feedback: string } | null>(null);
  const done = !!e && (e.status === "decidido" || e.status === "vencido");
  const [step, setStep] = useState(done ? 3 : 0);
  const eligible = !!e && e.status === "pendiente" && writtenEligible(e.item) && !!c.user;
  useEffect(() => {
    if (!eligible || ai) return;
    fetch("/api/ceo/responder").then((r) => r.json()).then((j) => setAi({ available: !!j.available, consent: !!j.consent, enabled: !!j.enabled })).catch(() => setAi({ available: false, consent: false, enabled: false }));
  }, [eligible, ai]);

  useEffect(() => { if (e && e.status !== "futuro") c.markRead(id); }, [e?.status, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setStep(done ? 3 : 0); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Si vence mientras está abierto, salta al resultado.
  useEffect(() => { if (done && step < 3) setStep(3); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!e || e.status === "futuro") {
    return (
      <Stage steps={CASE_STEPS} at={0} exit="/ceo/bandeja">
        <StepTitle title="Este asunto todavía no llega" text="Cuando llegue lo verás en tu bandeja." />
        <Link href="/ceo/bandeja" className="btn bg-white text-ink mt-6 inline-flex">Ir a la bandeja</Link>
      </Stage>
    );
  }

  const it = e.item;
  const decided = () => { setJustDecided(true); setStep(3); };
  const confirm = () => { if (!picked) return; c.decide(it.id, picked); decided(); };
  const consent = async () => {
    setBusy(true);
    const r = await fetch("/api/ceo/responder", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: true }) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (r?.ok) { setAi((a) => (a ? { ...a, consent: true, enabled: a.available } : a)); setMode("write"); }
  };
  const send = async () => {
    const p = textProblem(draft);
    if (p) { setErr(p); return; }
    setBusy(true); setErr(null);
    const r = await fetch("/api/ceo/responder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: it.id, company: c.pack.id, text: draft, profile: c.s.profile, ...(c.s.companyProfile ? { brand: { name: c.s.companyProfile.displayName, short: c.s.companyProfile.shortName, specialty: c.s.companyProfile.specialty, archetype: c.s.companyProfile.archetype } } : {}) }) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (r?.ok) setEv({ option: r.option, quality: r.quality, feedback: r.feedback });
    else { setErr(r?.error ?? "No pudimos leer tu respuesta. Elige una opción."); if (r?.fallback) setMode("options"); }
  };
  const confirmWritten = () => {
    if (!ev) return;
    c.decide(it.id, ev.option, { text: draft, quality: ev.quality, feedback: ev.feedback });
    decided();
  };
  const canWrite = eligible && ai?.enabled;
  const nextPending = c.pending.find((p) => p.item.id !== it.id);
  const deadline = e.status === "pendiente" ? <span className={clsx("chip gap-1", e.deadline - c.now < 3 * 3_600_000 ? "bg-coral text-white" : "bg-white/10 text-white")}><Clock size={11} /> {until(e.deadline, c.now)}</span> : null;

  // Navegación: antes de decidir no se puede pasar de «Decides»; después, no se regresa a decidir.
  const back = step === 0 || (done && step === 3) ? undefined : () => setStep(step - 1);
  const fwd = step < 2 ? () => setStep(step + 1) : done && step === 3 ? () => setStep(4) : undefined;
  const nextLabel = step === 0 ? "Ver el contexto" : step === 1 ? "Decidir" : "Lo que aprendes";

  return (
    <Stage steps={CASE_STEPS} at={step} reach={done ? 4 : 2} exit="/ceo/bandeja" top={deadline} onBack={back} onNext={fwd} next={nextLabel}
      aside={step === 4 ? (nextPending ? <Link href={`/ceo/caso/${nextPending.item.id}`} className="btn bg-white text-ink hover:bg-white/90 px-5 py-2.5 font-semibold">Siguiente asunto <ArrowRight size={15} /></Link> : <Link href="/ceo" className="btn bg-white text-ink hover:bg-white/90 px-5 py-2.5 font-semibold">Volver a Hoy <ArrowRight size={15} /></Link>) : undefined}>
      {step === 0 && (
        <>
          <div className="text-xs font-semibold uppercase tracking-wider text-mint">Te llegó un asunto</div>
          <article className="mt-3 text-ink">
            {it.channel === "whatsapp" ? <WhatsApp e={e} /> : it.channel === "llamada" ? <Call e={e} /> : it.channel === "junta" ? <Meeting e={e} /> : <Mail e={e} />}
          </article>
        </>
      )}

      {step === 1 && (
        <>
          <StepTitle eyebrow="Antes de decidir" title="Lo que necesitas saber" text={it.data ? "Los datos del asunto. Tómate tu tiempo." : "Este asunto no trae cifras: lo importante está en el mensaje."} />
          <div className="text-ink">
            {it.data ? <DataCard d={it.data} /> : <Recap it={it} />}
          </div>
        </>
      )}

      {step === 2 && e.status === "pendiente" && (
        <>
          <StepTitle eyebrow="Tu decisión" title={it.ask} />
          <CaseHelp it={it} />
          {canWrite && (
            <div className="mt-5 inline-flex rounded-xl bg-white/10 p-1 text-sm">
              <button onClick={() => setMode("options")} className={clsx("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium", mode === "options" ? "bg-white text-ink" : "text-white/70")}><ListChecks size={14} /> Elegir opción</button>
              <button onClick={() => setMode("write")} className={clsx("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium", mode === "write" ? "bg-white text-ink" : "text-white/70")}><PenLine size={14} /> Escribir respuesta</button>
            </div>
          )}
          {eligible && ai?.available && !ai.consent && (
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-white/[.06] border border-white/[.12] px-4 py-3 text-sm">
              <PenLine size={16} className="text-mint shrink-0" />
              <span className="flex-1 text-white/75">También puedes contestar con tus palabras. Una IA lee tu texto, lo relaciona con la opción más cercana y te da una nota de mentor. Tu texto no se usa para nada más.</span>
              <button disabled={busy} onClick={consent} className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-white/90 shrink-0">Activar</button>
            </div>
          )}
          {err && <p className="mt-4 rounded-xl bg-coral/20 px-3 py-2 text-sm text-white">{err}</p>}
          {canWrite && mode === "write" ? (
            <div className="mt-5">
              {!ev ? (
                <>
                  <textarea value={draft} onChange={(x) => { setDraft(x.target.value.slice(0, MAX_CHARS)); setErr(null); }} rows={6} placeholder={it.channel === "whatsapp" ? `Contesta a ${firstName(c.pack, it.from)} como lo harías por WhatsApp…` : `Escribe tu respuesta a ${firstName(c.pack, it.from)}…`} className="w-full rounded-2xl border border-white/20 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink focus:outline-none focus:ring-4 focus:ring-indigo-light/40" />
                  <div className="mt-1 flex justify-between text-[11px] text-white/50"><span>Mínimo {MIN_CHARS} caracteres. Sé claro y propone un siguiente paso.</span><span className="tabular-nums">{draft.length}/{MAX_CHARS}</span></div>
                  <button disabled={busy || draft.trim().length < MIN_CHARS} onClick={send} className="btn bg-white text-ink hover:bg-white/90 w-full justify-center mt-4 py-3 text-base font-semibold disabled:opacity-40">{busy ? "Leyendo tu respuesta…" : <>Revisar mi respuesta <ArrowRight size={16} /></>}</button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-white text-ink p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tu respuesta se acerca a</div>
                    <p className="mt-1.5 text-[15px] font-medium leading-relaxed">{String.fromCharCode(65 + it.options.findIndex((o) => o.id === ev.option))}. {it.options.find((o) => o.id === ev.option)?.text}</p>
                    <div className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400"><span>Nota del mentor</span><QualityDots q={ev.quality} /></div>
                    <p className="mt-1.5 text-sm leading-relaxed">{ev.feedback}</p>
                  </div>
                  <button onClick={confirmWritten} className="btn bg-white text-ink hover:bg-white/90 w-full justify-center py-3 text-base font-semibold">Enviar y decidir <ArrowRight size={16} /></button>
                  <div className="flex justify-center gap-4 text-xs">
                    <button onClick={() => setEv(null)} className="text-white font-medium">Corregir mi texto</button>
                    <button onClick={() => { setEv(null); setMode("options"); }} className="text-white/60">Prefiero elegir yo</button>
                  </div>
                </div>
              )}
            </div>
          ) : (<>
            <div className="mt-5 space-y-2.5">
              {it.options.map((o, i) => <StageChoice key={o.id} on={picked === o.id} onClick={() => setPicked(o.id)} letter={String.fromCharCode(65 + i)}>{o.text}</StageChoice>)}
            </div>
            <button disabled={!picked} onClick={confirm} className="btn bg-white text-ink hover:bg-white/90 w-full justify-center mt-5 py-3 text-base font-semibold disabled:opacity-40">Tomar la decisión <ArrowRight size={16} /></button>
          </>)}
        </>
      )}

      {step >= 3 && done && <div className="text-ink"><Outcome e={e} fresh={justDecided} part={step === 3 ? "resultado" : "aprendes"} /></div>}
    </Stage>
  );
}

// ───────────────────────────────────────────── canales
function Header({ it, at, now }: { it: Item; at: number; now: number }) {
  const c = useCeo();
  const p = personOf(c.pack, it.from);
  return (
    <div className="flex items-start gap-3">
      <Avatar id={it.from} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-ink">{p.name}</span><ChannelChip c={it.channel} /></div>
        <div className="text-xs text-slate-500">{p.role}</div>
      </div>
      <span className="text-[11px] text-slate-400 whitespace-nowrap">{clock(at)}{now - at > 86_400_000 ? ` · ${new Date(at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}` : ""}</span>
    </div>
  );
}

function Mail({ e }: { e: Entry }) {
  const c = useCeo();
  return (
    <div className="card overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
        <Header it={e.item} at={e.arrivesAt} now={c.now} />
        <h1 className="mt-4 text-lg sm:text-xl font-semibold text-ink leading-snug">{e.item.subject}</h1>
        <div className="mt-1 text-xs text-slate-400">Para: {c.s.name || "Director General"} &lt;direccion@{c.pack.domain}&gt;</div>
      </div>
      <div className="px-5 sm:px-6 py-5 space-y-3 text-[15px] leading-relaxed text-slate-700">
        {e.item.body.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
      </div>
    </div>
  );
}

function WhatsApp({ e }: { e: Entry }) {
  const c = useCeo();
  const [shown, setShown] = useState(e.status === "pendiente" && !c.s.read[e.item.id] ? 1 : e.item.body.length);
  useEffect(() => {
    if (shown >= e.item.body.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 650);
    return () => clearTimeout(t);
  }, [shown, e.item.body.length]);
  const p = personOf(c.pack, e.item.from);
  return (
    <div className="rounded-3xl overflow-hidden shadow-card border border-slate-100">
      <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
        <Avatar id={e.item.from} size={38} />
        <div className="min-w-0"><div className="font-semibold text-sm truncate">{p.name}</div><div className="text-[11px] text-white/70 truncate">{shown < e.item.body.length ? "escribiendo…" : p.role}</div></div>
        <ChannelChip c="whatsapp" className="ml-auto" />
      </div>
      <div className="bg-[#ECE5DD] px-3 sm:px-5 py-5 space-y-2 min-h-[180px]" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,.035) 1px, transparent 1px)", backgroundSize: "14px 14px" }}>
        <div className="text-center"><span className="chip bg-white/80 text-slate-500 text-[11px]">{clock(e.arrivesAt)}</span></div>
        {e.item.body.slice(0, shown).map((m, i) => (
          <div key={i} className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2 text-[15px] text-ink shadow-sm academy-in">{m}</div>
        ))}
        {shown < e.item.body.length && <div className="w-14 rounded-2xl bg-white px-3 py-2.5 flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" /><span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:.15s]" /><span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:.3s]" /></div>}
        {e.option && (
          <>
            <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[#DCF8C6] px-3.5 py-2 text-[15px] text-ink shadow-sm"><span className="whitespace-pre-line">{e.decision?.written?.text ?? e.option.text.replace(/^«|»$/g, "")}</span><span className="ml-2 inline-flex text-[#34B7F1] align-bottom"><CheckCheck size={14} /></span></div></div>
            {e.option.reply.map((m, i) => <div key={`r${i}`} className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2 text-[15px] text-ink shadow-sm">{m}</div>)}
          </>
        )}
      </div>
    </div>
  );
}

function Call({ e }: { e: Entry }) {
  const c = useCeo();
  const [play, setPlay] = useState(e.status !== "pendiente" || !!c.s.read[e.item.id]);
  const [voice, ...rest] = e.item.body;
  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-br from-[#2A1B1F] to-[#4A1F26] text-white px-5 py-6 text-center">
        <Avatar id={e.item.from} size={64} className="mx-auto ring-4 ring-white/10" />
        <div className="mt-3 font-semibold">{personOf(c.pack, e.item.from).name}</div>
        <div className="text-xs text-white/60 inline-flex items-center gap-1.5 mt-1"><PhoneMissed size={12} className="text-coral" /> Llamada perdida · {clock(e.arrivesAt)}</div>
      </div>
      <div className="p-5 sm:p-6">
        <button onClick={() => setPlay(true)} className={clsx("w-full flex items-center gap-3 rounded-2xl p-3 transition-colors", play ? "bg-slate-50" : "bg-indigo-soft hover:bg-indigo-soft/70")}>
          <span className="h-10 w-10 rounded-full bg-indigo text-white grid place-items-center"><Play size={16} className="ml-0.5" /></span>
          <span className="flex-1 flex items-center gap-[3px] h-8">{Array.from({ length: 38 }, (_, i) => <span key={i} className={clsx("w-[3px] rounded-full", play ? "bg-indigo/60" : "bg-indigo/30")} style={{ height: `${20 + Math.abs(Math.sin(i * 1.7)) * 70}%` }} />)}</span>
          <span className="text-xs text-slate-500 tabular-nums">{voice.replace(/[^0-9:]/g, "") || "0:45"}</span>
        </button>
        {!play && <p className="mt-2 text-center text-xs text-slate-400">Toca para escuchar el mensaje de voz</p>}
        {play && <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-700 academy-in">{rest.map((p, i) => <p key={i} className="italic">{p}</p>)}</div>}
      </div>
    </div>
  );
}

function Meeting({ e }: { e: Entry }) {
  const c = useCeo();
  const lines = e.item.lines ?? [];
  const [shown, setShown] = useState(e.status === "pendiente" && !c.s.read[e.item.id] ? 1 : lines.length);
  useEffect(() => {
    if (shown >= lines.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 1100);
    return () => clearTimeout(t);
  }, [shown, lines.length]);
  return (
    <div className="card overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
        <Header it={e.item} at={e.arrivesAt} now={c.now} />
        <h1 className="mt-4 text-lg sm:text-xl font-semibold text-ink leading-snug">{e.item.subject}</h1>
        {e.item.body.map((p, i) => <p key={i} className="mt-2 text-sm text-slate-500">{p}</p>)}
      </div>
      <div className="px-5 sm:px-6 py-5 space-y-4">
        {lines.slice(0, shown).map((l, i) => (
          <div key={i} className="flex gap-3 academy-in">
            <Avatar id={l.who} size={34} />
            <div><div className="text-xs font-semibold text-slate-500">{firstName(c.pack, l.who)}</div><p className={clsx("mt-0.5 text-[15px] leading-relaxed", l.text.startsWith("(") ? "text-slate-500 italic" : "text-ink")}>{l.text}</p></div>
          </div>
        ))}
        {shown < lines.length && <button onClick={() => setShown(lines.length)} className="text-xs text-indigo font-medium">Saltar →</button>}
      </div>
    </div>
  );
}

/** Contexto sin cifras: lo esencial del mensaje en una tarjeta breve. */
function Recap({ it }: { it: Item }) {
  const c = useCeo();
  return (
    <section className="mt-6 card p-5 sm:p-6 flex gap-3 items-start">
      <Avatar id={it.from} size={36} />
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-500">{personOf(c.pack, it.from).name} · {personOf(c.pack, it.from).role.split("·")[0].trim()}</div>
        <p className="mt-1 text-[15px] text-ink leading-relaxed">{it.preview}</p>
      </div>
    </section>
  );
}

function DataCard({ d }: { d: NonNullable<Item["data"]> }) {
  return (
    <section className="mt-6 card p-5 sm:p-6">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{d.title}</div>
      <dl className="mt-3 divide-y divide-slate-100">
        {d.rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2 text-sm"><dt className="text-slate-500">{k}</dt><dd className="font-semibold text-ink text-right tabular-nums">{v}</dd></div>)}
      </dl>
      {d.note && <p className="mt-3 rounded-xl bg-amber-soft/60 px-3.5 py-2.5 text-sm text-ink">{d.note}</p>}
    </section>
  );
}

// ───────────────────────────────────────────── consecuencia
function Outcome({ e, fresh, part }: { e: Entry; fresh: boolean; part: "resultado" | "aprendes" }) {
  const c = useCeo();
  const it = e.item;
  const expired = e.status === "vencido";
  const o = e.option as Option | undefined;
  const reply = expired ? it.expired.reply : o?.reply ?? [];
  const effects = effectOf(c.s, e);
  const outcome = expired ? it.expired.outcome : o?.outcome;
  const lesson = it.lesson ? lessonById(it.lesson) : undefined;
  const xp = o ? entryXp(c.s, e, runSpans(c.s, c.now)) : 0;
  const myIdx = o ? it.options.findIndex((x) => x.id === o.id) : -1;
  const w = e.decision?.written;

  return (
    <section className={clsx("space-y-4", fresh && "academy-in")}>
      {part === "resultado" && <>
      {o && (
        <div className="card p-5 sm:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{w ? "Respondiste" : "Decidiste"}</div>
          {w ? <p className="mt-1.5 text-[15px] text-ink leading-relaxed whitespace-pre-line">{w.text}</p> : <p className="mt-1.5 text-[15px] text-ink font-medium leading-relaxed">{String.fromCharCode(65 + myIdx)}. {o.text}</p>}
          {w && <p className="mt-2 text-xs text-slate-400">Se tomó como: {String.fromCharCode(65 + myIdx)}. {o.text}</p>}
          <div className="mt-4 space-y-2">
            {reply.map((r, i) => <div key={i} className="flex gap-2.5"><Avatar id={it.from} size={26} /><p className="text-[15px] text-slate-700 leading-relaxed">{r}</p></div>)}
          </div>
        </div>
      )}
      {w && w.feedback && (
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400"><span>Nota del mentor sobre tu respuesta</span><QualityDots q={w.quality} /></div>
          <p className="mt-1.5 text-sm text-ink leading-relaxed">{w.feedback}</p>
        </div>
      )}
      {expired && (
        <div className="card p-5 sm:p-6 border-coral/20">
          <div className="flex items-center gap-2 text-coral text-sm font-semibold"><XCircle size={16} /> Venció sin tu respuesta</div>
          <div className="mt-3 space-y-2">{reply.map((r, i) => <div key={i} className="flex gap-2.5"><Avatar id={it.from} size={26} /><p className="text-[15px] text-slate-700">{r}</p></div>)}</div>
        </div>
      )}

      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Qué pasó en {c.pack.name}</div>
          {xp > 0 && <span className={clsx("chip bg-indigo text-white gap-1", fresh && "ceo-pop")}>+{xp} XP</span>}
        </div>
        <p className="mt-2 text-[15px] text-ink leading-relaxed">{outcome}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(effects) as KpiKey[]).filter((k) => effects[k]).map((k, i) => (
            <span key={k} className={clsx("chip px-3 py-1 text-sm gap-1.5", (effects[k] ?? 0) > 0 ? "bg-indigo-soft text-indigo" : "bg-coral-soft text-coral", fresh && "tree-pop")} style={fresh ? { animationDelay: `${200 + i * 120}ms` } : undefined}>
              {c.pack.kpiLabel[k]} <b className="tabular-nums">{(effects[k] ?? 0) > 0 ? "+" : ""}{effects[k]}</b>
            </span>
          ))}
        </div>
        {o && <ProfileHint o={o} />}
      </div>

      <Ripples e={e} fresh={fresh} />
      </>}

      {part === "aprendes" && <>
      {it.real && (
        <div className="rounded-2xl bg-gradient-to-br from-[#141735] to-[#2B1F8A] p-5 sm:p-6 text-white">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/60"><Globe2 size={13} /> Lo que pasó en la vida real · {it.real.company}</div>
          <h3 className="mt-1.5 font-semibold">{it.real.title}</h3>
          <p className="mt-2 text-sm text-white/75 leading-relaxed">{it.real.text}</p>
          <p className="mt-3 text-[10px] text-white/40">Basado en el tipo de dilema que viven empresas reales. Nombres y cifras ficticios.</p>
        </div>
      )}

      <div className="relative rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-indigo-soft/50 p-5 sm:p-6">
        <Quote size={20} className="absolute right-5 top-5 text-indigo/20" />
        <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo">Bitácora del CEO</div>
        <h3 className="mt-1.5 font-semibold text-ink">{it.bitacora.title}</h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{it.bitacora.text}</p>
        <div className="mt-4 flex gap-2.5 rounded-xl bg-white/80 px-4 py-3"><Lightbulb size={16} className="text-indigo shrink-0 mt-0.5" /><p className="text-sm text-ink"><b>Nota CEO:</b> {it.bitacora.nota}</p></div>
        {lesson && (
          <Link href={`/ceo/academy/${lesson.id}?from=${it.id}`} className="mt-4 flex items-center gap-3 rounded-xl bg-indigo text-white px-4 py-3 hover:bg-indigo-light transition-colors">
            <BookOpen size={18} />
            <span className="flex-1 text-sm"><b>Aprende la teoría:</b> {lesson.title} · {lesson.minutes} min</span>
            {c.s.lessons[lesson.id] ? <span className="chip bg-white/20 text-white">Completada</span> : nextLessonXp(c.s, c.now) > 0 ? <span className="chip bg-white/20 text-white">+{nextLessonXp(c.s, c.now)} XP</span> : null}
          </Link>
        )}
      </div>
      </>}
    </section>
  );
}

/**
 * Ayuda antes de decidir según la experiencia declarada (V33): completa / media / breve.
 * Solo cambia cuánta explicación se ve; nunca opciones, puntajes ni efectos.
 */
function CaseHelp({ it }: { it: Item }) {
  const c = useCeo();
  const band = helpBand(c.s.profile);
  if (band === "breve") return null;
  const names = competencyNames(competenciesOfItem(it));
  if (!names.length) return null;
  const lesson = it.lesson ? lessonById(it.lesson) : undefined;
  return (
    <div className="mt-4 flex gap-2.5 rounded-xl bg-white/[.06] px-3.5 py-2.5 text-[12.5px] text-white/70 leading-relaxed">
      <Lightbulb size={14} className="text-mint shrink-0 mt-0.5" />
      <span>
        <b className="font-medium text-white">Este caso entrena:</b> {names.join(", ")}.
        {band === "completa" && <> Piensa a quién afecta tu decisión hoy y a quién en tres meses. {lesson && <>La lección «{lesson.title}» lo explica a fondo; está disponible al cerrar el caso.</>}</>}
      </span>
    </div>
  );
}

function ProfileHint({ o }: { o: Option }) {
  const tags = useMemo(() => {
    const t: string[] = [];
    const s = o.style;
    if ((s.horizonte ?? 0) >= 2) t.push("Largo plazo"); if ((s.horizonte ?? 0) <= -2) t.push("Corto plazo");
    if ((s.riesgo ?? 0) >= 2) t.push("Audaz"); if ((s.riesgo ?? 0) <= -2) t.push("Prudente");
    if ((s.foco ?? 0) >= 2) t.push("Personas"); if ((s.foco ?? 0) <= -2) t.push("Números");
    if ((s.estilo ?? 0) >= 2) t.push("Involucras"); if ((s.estilo ?? 0) <= -2) t.push("Decides solo");
    if ((s.conflicto ?? 0) >= 2) t.push("Encaras"); if ((s.conflicto ?? 0) <= -2) t.push("Evitas el conflicto");
    return t;
  }, [o]);
  if (!tags.length) return null;
  return <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">Esta decisión suma a tu perfil: {tags.map((t) => <span key={t} className="chip bg-slate-100 text-slate-600">{t}</span>)}</div>;
}

// ───────────────────────────── cómo lo tomó tu gente
const VIA: Record<string, string> = { alianza: "por su alianza con", influye: "porque le influye", tension: "por su tensión con" };
function Ripples({ e, fresh }: { e: Entry; fresh: boolean }) {
  const c = useCeo();
  const rs = entryRipples(c.pack, e).sort((a, b) => (a.kind === "directo" ? 0 : 1) - (b.kind === "directo" ? 0 : 1) || Math.abs(b.delta) - Math.abs(a.delta));
  if (!rs.length) return null;
  return (
    <div className="card p-5 sm:p-6">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cómo lo tomó tu gente</div>
      <ul className="mt-3 space-y-2">
        {rs.map((r, i) => {
          const now = c.relations[r.id] ?? REL_START;
          return (
            <li key={r.id} className={clsx("flex items-center gap-3", fresh && "tree-pop")} style={fresh ? { animationDelay: `${150 + i * 90}ms` } : undefined}>
              <Avatar id={r.id} size={30} />
              <div className="flex-1 min-w-0 text-sm">
                <span className="font-semibold text-ink">{firstName(c.pack, r.id)}</span>{" "}
                <span className="text-slate-500">{r.kind === "directo" ? (r.delta > 0 ? "lo valoró" : "lo resintió") : r.kind === "tension"
                  ? `${r.delta > 0 ? "se acercó: no se lleva con" : "se alejó: no se lleva con"} ${firstName(c.pack, r.via!)}${r.delta > 0 ? ", a quien no le gustó" : ", a quien sí le gustó"}`
                  : `${r.delta > 0 ? "se acercó" : "se alejó"} ${VIA[r.kind]} ${firstName(c.pack, r.via!)}`}</span>
                <span className="block text-[11px] text-slate-400">Relación contigo: {moodOf(now).label}</span>
              </div>
              <span className={clsx("chip text-xs tabular-nums", r.delta > 0 ? "bg-indigo-soft text-indigo" : "bg-coral-soft text-coral")}>{r.delta > 0 ? "+" : ""}{r.delta}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-slate-400">Estas relaciones pesan en tu proyecto de cambio: quien confía en ti arranca más cerca de adoptarlo.</p>
    </div>
  );
}

/** Calidad de una respuesta escrita (0–3) en puntos sobrios. */
function QualityDots({ q }: { q: number }) {
  return <span className="inline-flex items-center gap-1" title={`Calidad ${q} de 3`} aria-label={`Calidad ${q} de 3`}>{[1, 2, 3].map((i) => <span key={i} className={clsx("h-1.5 w-4 rounded-full", i <= q ? "bg-indigo" : "bg-slate-200")} />)}</span>;
}
