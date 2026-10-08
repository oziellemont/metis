"use client";
/**
 * Modo presentación de una sesión WTW / WTM (pantalla completa, para proyectar o compartir en Teams/Meet/Zoom).
 * Guion: portada → marcador → compromisos de la sesión anterior → persona por persona → apoyos → (WTM: rojos y focos) → cierre.
 * Lo que se captura aquí queda como BORRADOR; al terminar, la sesión pasa a «Por aprobar».
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, CheckCircle2, Flag, HandHelping, ListChecks, Mic, Target, X } from "lucide-react";
import { useMetis } from "@/lib/store";
import { Avatar } from "@/components/ui/primitives";
import { MONTHS } from "@/lib/labels";
import type { Session } from "@/lib/domain/types";
import { sessionDateLabel, sessionTitle } from "@/lib/sessions/logic";
import { CommitmentRow, QuickCapture } from "./parts";
import { Scoreboard } from "./Scoreboard";
import { useDeck } from "./useDeck";

type Slide = { key: string; label: string; render: () => React.ReactNode };

export function PresentMode({ session, onExit }: { session: Session; onExit: (finished: boolean) => void }) {
  const s = useMetis();
  const deck = useDeck(session);
  const [i, setI] = useState(0);
  const [notes, setNotes] = useState(session.notes ?? "");
  const [focus, setFocus] = useState<string[]>(() => [...(session.focus ?? []), "", "", ""].slice(0, 3));

  // al abrir: la sesión queda «en curso»
  useEffect(() => {
    if (session.status === "scheduled") s.upsertSession({ ...session, status: "live" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = useCallback(() => {
    const cur = s.sessions.find((x) => x.id === session.id) ?? session;
    const f = focus.map((x) => x.trim()).filter(Boolean);
    if ((cur.notes ?? "") !== notes || JSON.stringify(cur.focus ?? []) !== JSON.stringify(f)) s.upsertSession({ ...cur, notes, focus: f });
  }, [s, session, notes, focus]);

  const slides = useMemo<Slide[]>(() => {
    if (!deck) return [];
    const isWtm = session.kind === "wtm";
    const list: Slide[] = [];
    list.push({
      key: "cover", label: "Portada", render: () => (
        <div className="flex h-full flex-col justify-center">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-mint-light">{isWtm ? "Cierre de mes" : "Touchpoint semanal"}</div>
          <h1 className="mt-3 text-5xl font-semibold leading-tight">{sessionTitle(session)}</h1>
          <div className="mt-3 text-lg text-white/60">{deck.leader.teamName ?? deck.leader.title} · {sessionDateLabel(session.scheduledAt)}</div>
          <div className="mt-10 flex flex-wrap gap-3">
            {deck.people.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-4 text-sm"><Avatar initials={p.initials} size="sm" className="!bg-white/20 !text-white" />{p.name}</div>
            ))}
          </div>
          <div className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-4">
            {(isWtm ? ["Marcador del mes", "Compromisos", "Rojos y causas", "Focos del mes"] : ["Marcador", "¿Se cumplió?", "Esta semana", "Apoyos"]).map((t, k) => (
              <div key={t} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10"><div className="text-xs text-white/40">0{k + 1}</div><div className="mt-1 text-sm font-medium">{t}</div></div>
            ))}
          </div>
          <div className="mt-10 inline-flex items-center gap-2 text-xs text-white/40"><Mic size={13} /> Próximamente: el agente de METIS podrá transcribir la sesión y proponer los compromisos por ti.</div>
        </div>
      ),
    });
    list.push({
      key: "score", label: "Marcador", render: () => (
        <>
          <SlideTitle kicker={isWtm ? `Cierre de ${MONTHS[deck.month - 1]}` : `Marcador · ${MONTHS[deck.month - 1]}`} title={isWtm ? "¿Cómo cerramos el mes?" : "¿Dónde vamos ganando y dónde perdiendo?"} />
          <Scoreboard slides={deck.slides} dark detailed={isWtm} />
        </>
      ),
    });
    list.push({
      key: "review", label: "Compromisos anteriores", render: () => (
        <>
          <SlideTitle kicker={deck.previous ? `Desde ${sessionTitle(deck.previous)}` : "Primera sesión"} title="¿Se cumplió lo que nos comprometimos?"
            right={deck.reviewTotal > 0 ? <BigStat value={`${deck.reviewDone}/${deck.reviewTotal}`} label="cumplidos" /> : undefined} />
          {deck.review.length === 0 ? <Empty>No hay compromisos pendientes de revisar. Esta sesión arranca en limpio.</Empty> : (
            <div className="grid gap-x-8 lg:grid-cols-2">
              {deck.people.filter((p) => deck.review.some((c) => c.ownerId === p.id)).map((p) => (
                <div key={p.id} className="mb-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-white/80"><Avatar initials={p.initials} size="sm" className="!bg-white/15 !text-white" />{p.name}</div>
                  <div className="divide-y divide-white/10">{deck.review.filter((c) => c.ownerId === p.id).map((c) => <CommitmentRow key={c.id} c={c} dark showOwner={false} />)}</div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-white/40">Marca en vivo: ✓ cumplido · ••• para «no cumplido» o «ya no aplica».</p>
        </>
      ),
    });
    deck.slides.forEach((p) => {
      list.push({
        key: `p-${p.user.id}`, label: p.user.name.split(" ")[0], render: () => {
          const pending = deck.review.filter((c) => c.ownerId === p.user.id && c.status === "open");
          const fresh = deck.fresh.filter((c) => c.ownerId === p.user.id || c.requestedBy === p.user.id);
          return (
            <>
              <div className="mb-6 flex items-center gap-4">
                <Avatar initials={p.user.initials} size="lg" className="!bg-white/15 !text-white" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-light">{isWtm ? "Cierre y enfoque" : "Cierre y plan de la semana"}</div>
                  <h2 className="text-3xl font-semibold">{p.user.name}</h2>
                  <div className="text-sm text-white/50">{p.user.title}</div>
                </div>
                <BigStat value={p.attainment === null ? "—" : `${p.attainment}%`} label="cumplimiento" />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <Section icon={Target} title="Sus indicadores" />
                  {p.kpis.length === 0 ? <Empty>Sin scorecard este año.</Empty> : (
                    <ul className="divide-y divide-white/10">
                      {p.kpis.map((k) => (
                        <li key={k.id} className="py-2">
                          <div className="flex items-center gap-2">
                            <span className={clsx("h-2.5 w-2.5 shrink-0 rounded-full", { outstanding: "bg-sob", satisfactory: "bg-sat", minimum: "bg-min", below: "bg-bajo", pending: "bg-white/30" }[k.traffic])} />
                            <span className="min-w-0 flex-1 truncate text-sm">{k.name} <span className="text-white/40">· {k.scope}</span></span>
                            <span className="text-sm font-semibold tabular-nums">{k.value}</span>
                            <span className="w-20 text-right text-xs text-white/40 tabular-nums">meta {k.target}</span>
                          </div>
                          {k.log && <div className="ml-4.5 mt-0.5 pl-[18px] text-xs italic text-white/50">“{k.log}”</div>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {pending.length > 0 && (
                    <div className="mt-5">
                      <Section icon={ListChecks} title="Siguen abiertos" />
                      <div className="divide-y divide-white/10">{pending.map((c) => <CommitmentRow key={c.id} c={c} dark showOwner={false} compact />)}</div>
                    </div>
                  )}
                </div>
                <div>
                  <Section icon={Flag} title={isWtm ? "Compromisos para el mes" : "Compromisos de esta semana"} />
                  {fresh.length > 0 && <div className="mb-3 divide-y divide-white/10">{fresh.map((c) => <CommitmentRow key={c.id} c={c} dark showOwner={c.ownerId !== p.user.id} compact onDelete={() => s.removeCommitment(c.id)} />)}</div>}
                  <QuickCapture dark people={deck.people} defaultOwnerId={p.user.id} sessionId={session.id} approved={false} />
                </div>
              </div>
            </>
          );
        },
      });
    });
    list.push({
      key: "support", label: "Apoyos", render: () => {
        const freshSupport = deck.fresh.filter((c) => c.kind === "support");
        return (
          <>
            <SlideTitle kicker="Destrabar" title="¿Qué apoyo necesitamos y de quién?" />
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <Section icon={HandHelping} title="Apoyos abiertos" />
                {deck.supports.length === 0 ? <Empty>No hay apoyos abiertos.</Empty> : <div className="divide-y divide-white/10">{deck.supports.map((c) => <CommitmentRow key={c.id} c={c} dark />)}</div>}
              </div>
              <div>
                <Section icon={HandHelping} title="Nuevas solicitudes" />
                {freshSupport.length > 0 && <div className="mb-3 divide-y divide-white/10">{freshSupport.map((c) => <CommitmentRow key={c.id} c={c} dark compact onDelete={() => s.removeCommitment(c.id)} />)}</div>}
                <p className="mb-2 text-xs text-white/40">Cambia a «Solicitud de apoyo» para registrar quién lo pide y a quién.</p>
                <QuickCapture dark people={deck.people} sessionId={session.id} approved={false} />
              </div>
            </div>
          </>
        );
      },
    });
    if (isWtm) {
      list.push({
        key: "reds", label: "Rojos", render: () => (
          <>
            <SlideTitle kicker={`Cierre de ${MONTHS[deck.month - 1]}`} title="Rojos y amarillos: ¿causa y plan?" />
            {deck.pending > 0 && <div className="mb-3 rounded-2xl bg-amber/15 px-4 py-2.5 text-sm text-amber ring-1 ring-amber/30">{deck.pending} de {deck.kpiTotal} indicadores aún no tienen resultado de {MONTHS[deck.month - 1].toLowerCase()}. Pide que se carguen para cerrar el mes completo.</div>}
            {deck.reds.length === 0 ? <Empty>{deck.pending === deck.kpiTotal && deck.kpiTotal > 0 ? "Todavía no hay resultados cargados de este mes." : "Ningún indicador en rojo o amarillo. 🎉"}</Empty> : (
              <ul className="grid gap-2 lg:grid-cols-2">
                {deck.reds.map((k) => (
                  <li key={k.id + k.user.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
                    <span className={clsx("h-3 w-3 shrink-0 rounded-full", k.traffic === "below" ? "bg-bajo" : "bg-min")} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{k.name} · {k.scope}</div>
                      <div className="truncate text-xs text-white/50">{k.user.name}{k.log ? ` · “${k.log}”` : ""}</div>
                    </div>
                    <div className="text-right text-sm font-semibold tabular-nums">{k.value}<div className="text-[10px] font-normal text-white/40">meta {k.target}</div></div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
              <BigStat value={deck.compliance.pct === null ? "—" : `${deck.compliance.pct}%`} label="compromisos cumplidos del mes" />
              <div className="text-sm text-white/60">{deck.compliance.done} cumplidos de {deck.compliance.total} que vencían en {MONTHS[deck.month - 1].toLowerCase()}.</div>
            </div>
          </>
        ),
      });
      list.push({
        key: "focus", label: "Focos", render: () => (
          <>
            <SlideTitle kicker={`Enfoque de ${MONTHS[deck.month % 12]}`} title="¿En qué 2 o 3 cosas nos enfocamos el próximo mes?" />
            <div className="max-w-3xl space-y-3">
              {focus.map((f, k) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint text-lg font-semibold text-white">{k + 1}</span>
                  <input value={f} onChange={(e) => setFocus((arr) => arr.map((x, j) => (j === k ? e.target.value : x)))} onBlur={saveDraft}
                    placeholder={k === 2 ? "(opcional)" : "Ej. Recuperar OTIF de Saltillo arriba de 95%"}
                    className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-mint/40" />
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-white/50">Tip: pocos focos, claros y medibles. Lo que no cabe aquí, no es foco.</p>
          </>
        ),
      });
    }
    list.push({
      key: "close", label: "Cierre", render: () => (
        <>
          <SlideTitle kicker="Cierre" title="Lo que nos llevamos" right={<BigStat value={String(deck.fresh.length)} label="compromisos y apoyos nuevos" />} />
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              {deck.fresh.length === 0 ? <Empty>Aún no capturan compromisos. Regresa a cada persona para agregarlos.</Empty> : <div className="divide-y divide-white/10">{deck.fresh.map((c) => <CommitmentRow key={c.id} c={c} dark compact onDelete={() => s.removeCommitment(c.id)} />)}</div>}
            </div>
            <div>
              <Section icon={ListChecks} title="Notas y acuerdos de la sesión" />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveDraft} rows={7}
                placeholder="Decisiones, acuerdos o contexto que quieras dejar registrado…"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-mint/40" />
              <button onClick={() => finish()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-mint px-5 py-3 text-base font-semibold text-white hover:bg-mint-light">
                <CheckCircle2 size={18} /> Terminar sesión y revisar borrador
              </button>
              <p className="mt-2 text-center text-xs text-white/40">Nada se envía todavía: primero revisas y apruebas.</p>
            </div>
          </div>
        </>
      ),
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck, session, focus, notes]);

  const finish = () => {
    const cur = s.sessions.find((x) => x.id === session.id) ?? session;
    s.upsertSession({ ...cur, status: "review", notes, focus: focus.map((x) => x.trim()).filter(Boolean) });
    onExit(true);
  };
  const exit = () => { saveDraft(); onExit(false); };

  const go = useCallback((d: number) => setI((x) => Math.max(0, Math.min(slides.length - 1, x + d))), [slides.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, notes, focus]);

  if (!deck || !slides.length) return null;
  const cur = slides[Math.min(i, slides.length - 1)];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white" role="dialog" aria-label="Modo presentación">
      <div className="flex items-center gap-3 px-6 py-3 text-sm">
        <span className="font-semibold tracking-wide">mêtis</span>
        <span className="text-white/30">|</span>
        <span className="truncate text-white/60">{sessionTitle(session)}</span>
        <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-coral/20 px-2.5 py-0.5 text-xs text-[#FF9AA0]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral" /> En vivo</span>
        <button onClick={exit} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Salir del modo presentación"><X size={16} /> Salir</button>
      </div>
      <div key={cur.key} className="academy-in flex-1 overflow-y-auto px-6 pb-6 sm:px-12 lg:px-20">
        <div className="mx-auto h-full max-w-6xl py-4">{cur.render()}</div>
      </div>
      <div className="flex items-center gap-3 border-t border-white/10 px-6 py-3">
        <button onClick={() => go(-1)} disabled={i === 0} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-30"><ArrowLeft size={16} /> Anterior</button>
        <div className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
          {slides.map((sl, k) => (
            <button key={sl.key} onClick={() => setI(k)} className={clsx("whitespace-nowrap rounded-full px-2.5 py-1 text-xs transition", k === i ? "bg-white text-ink font-medium" : "text-white/50 hover:bg-white/10")}>{sl.label}</button>
          ))}
        </div>
        {i < slides.length - 1
          ? <button onClick={() => go(1)} className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-white/90">Siguiente <ArrowRight size={16} /></button>
          : <button onClick={finish} className="inline-flex items-center gap-1 rounded-xl bg-mint px-4 py-2 text-sm font-semibold text-white hover:bg-mint-light"><CheckCircle2 size={16} /> Terminar</button>}
      </div>
    </div>
  );
}

function SlideTitle({ kicker, title, right }: { kicker: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-light">{kicker}</div>
        <h2 className="mt-1 text-3xl font-semibold">{title}</h2>
      </div>
      {right}
    </div>
  );
}
function BigStat({ value, label }: { value: string; label: string }) {
  return <div className="text-right"><div className="text-4xl font-semibold tabular-nums">{value}</div><div className="text-xs text-white/50">{label}</div></div>;
}
function Section({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50"><Icon size={14} /> {title}</div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/[0.04] p-5 text-sm text-white/50 ring-1 ring-white/10">{children}</div>;
}
