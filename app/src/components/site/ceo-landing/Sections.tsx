/**
 * Secciones estáticas de la landing de MÊTIS CEO (componentes de servidor, sin JS en el cliente).
 * El copy vive en ./content (español) y ./content-en (inglés); cada sección recibe el idioma en `t`.
 */
import type React from "react";
import Link from "next/link";
import { Check, ChevronDown, Lock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { CeoCta } from "@/components/site/CeoCta";
import { CEO_CONTACT_EMAIL } from "@/lib/site";
import { LOGIN_HREF, type Copy, type StageState } from "./content";
import { MemoryCarousel } from "./Memory";
import { HowSlides } from "./HowSlides";
import { ArenaLock } from "./ArenaLock";
import { Stagger } from "./Stagger";

const WRAP = "mx-auto max-w-7xl px-5 sm:px-6 lg:px-8";
const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo";
const H2 = "text-[28px] leading-[1.15] sm:text-4xl sm:leading-[1.12] font-semibold tracking-tight text-ink";
const LEAD = "mt-4 text-[17px] leading-relaxed text-slate-600";
const PAD = "py-16 sm:py-24";

function Head({ eyebrow, title, body, id, center = false }: { eyebrow?: string; title: string; body?: string; id: string; center?: boolean }) {
  return (
    <div className={center ? "max-w-3xl mx-auto text-center" : "max-w-3xl"}>
      {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}
      <h2 id={id} className={(eyebrow ? "mt-3 " : "") + H2}>{title}</h2>
      {body && <p className={LEAD}>{body}</p>}
    </div>
  );
}

export function HowSection({ t }: { t: Copy }) {
  const HOW = t.HOW;
  return (
    <section id="como" aria-labelledby="como-title" className="scroll-mt-20">
      <div className={WRAP + " " + PAD + " grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center [&>*]:min-w-0"}>
        <div>
          <Head id="como-title" eyebrow={t.UI.howEyebrow} title={HOW.title} body={HOW.body} />
          <ol className="mt-10 space-y-6">
            {HOW.steps.map((s) => (
              <li key={s.n} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="text-2xl font-semibold tabular-nums text-indigo/70 leading-none pt-0.5">{s.n}</span>
                <div><h3 className="text-lg font-semibold text-ink">{s.t}</h3><p className="mt-1 text-[15px] leading-relaxed text-slate-600">{s.d}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <HowSlides t={t} />
      </div>
    </section>
  );
}

export function MemorySection({ t }: { t: Copy }) {
  const DIFF = t.DIFF;
  return (
    <section id="experiencia" aria-labelledby="exp-title" className="scroll-mt-20 bg-[#141735] text-white">
      <div className={WRAP + " " + PAD}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mint-light">{DIFF.eyebrow}</p>
          <h2 id="exp-title" className="mt-3 text-[28px] leading-[1.15] sm:text-4xl sm:leading-[1.12] font-semibold tracking-tight">{DIFF.title}</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-white/70">{DIFF.body}</p>
        </div>
        <div className="mt-12"><MemoryCarousel t={t} /></div>
      </div>
    </section>
  );
}

const NODE: Record<StageState, string> = {
  inicio: "bg-mint text-white ring-4 ring-mint/20",
  siguiente: "bg-white text-indigo ring-2 ring-indigo",
  bloqueada: "bg-white text-slate-400 ring-1 ring-slate-200",
};
/** Solo el punto de partida lleva etiqueta visible; el resto se entiende con el número y el candado. */
const START_BADGE = "bg-mint-soft text-sob";

export function PathSection({ t }: { t: Copy }) {
  const PATH = t.PATH;
  return (
    <section id="camino" aria-labelledby="camino-title" className="scroll-mt-20 bg-canvas">
      <div className={WRAP + " " + PAD}>
        <Head id="camino-title" eyebrow={PATH.eyebrow} title={PATH.title} body={PATH.body} />
        <div className="mt-12 rounded-3xl bg-white border border-slate-100 p-5 sm:p-8 shadow-card">
          <Stagger className="relative grid gap-0 lg:grid-cols-6 lg:gap-4" label={t.UI.stagesLabel}>
            {/* vía: vertical en móvil, horizontal en escritorio; el tramo inicial se marca como avance */}
            <span aria-hidden className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-slate-200 lg:left-5 lg:right-5 lg:top-[19px] lg:bottom-auto lg:h-0.5 lg:w-auto" />
            <span aria-hidden className="ceo-step-fill absolute left-[19px] top-5 h-[calc((100%-2.5rem)/5*0.5)] w-0.5 bg-gradient-to-b from-mint to-indigo lg:left-5 lg:top-[19px] lg:h-0.5 lg:w-[calc((100%-2.5rem)/5*0.5)] lg:bg-gradient-to-r" />
            {PATH.stages.map((s, i) => (
              <li key={s.name} style={{ "--i": i } as React.CSSProperties} className="ceo-step relative grid grid-cols-[40px_1fr] gap-4 pb-7 last:pb-0 lg:block lg:pb-0" aria-current={s.state === "inicio" ? "step" : undefined}>
                <span className={"relative z-10 h-10 w-10 rounded-full grid place-items-center text-[13px] font-semibold tabular-nums " + NODE[s.state]}>
                  {s.state === "inicio" ? <Check size={17} aria-hidden /> : s.state === "bloqueada" ? <Lock size={14} aria-hidden /> : s.n}
                </span>
                <div className="min-w-0 lg:mt-5">
                  <span className="text-[12px] font-semibold tabular-nums text-slate-500">{t.UI.stage} {s.n}</span>
                  <h3 className={"mt-0.5 text-[16px] leading-snug font-semibold " + (s.state === "bloqueada" ? "text-ink/80" : "text-ink")}>{s.name}</h3>
                  <p className="mt-2 text-[14px] text-ink">{s.learn}</p>
                  {s.state === "inicio" ? <span className={"chip mt-3 " + START_BADGE}>{PATH.stateLabel.inicio}</span> : <span className="sr-only">{PATH.stateLabel[s.state]}</span>}
                </div>
              </li>
            ))}
          </Stagger>
        </div>
        <ArenaLock t={t} />
      </div>
    </section>
  );
}

export function PhilosophySection({ t }: { t: Copy }) {
  const PHILOSOPHY = t.PHILOSOPHY;
  return (
    <section aria-labelledby="filo-title" className="bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white">
      <div className={WRAP + " py-20 sm:py-28"}>
        <div className="max-w-3xl">
          <h2 id="filo-title" className="text-[30px] leading-[1.15] sm:text-5xl sm:leading-[1.1] font-semibold tracking-tight">{PHILOSOPHY.title}</h2>
          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white/75">{PHILOSOPHY.body}</p>
          <p className="mt-5 text-[15px] leading-relaxed text-white/55">{PHILOSOPHY.who}</p>
          <div className="mt-10 border-t border-white/15 pt-6">
            <p className="font-semibold">{PHILOSOPHY.author}</p>
            <p className="text-[14px] text-white/60">{PHILOSOPHY.authorRole}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ t }: { t: Copy }) {
  return (
    <section aria-labelledby="faq-title" className="bg-canvas">
      <div className={WRAP + " " + PAD + " grid lg:grid-cols-[1fr_1.6fr] gap-10 [&>*]:min-w-0"}>
        <Head id="faq-title" title={t.UI.faqTitle} />
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {t.FAQ.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16px] font-medium text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo rounded [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown size={18} aria-hidden className="shrink-0 text-slate-500 motion-safe:transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-5 -mt-1 text-[15px] leading-relaxed text-slate-600 max-w-2xl">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CloseSection({ t }: { t: Copy }) {
  const CLOSE = t.CLOSE;
  return (
    <section id="acceso" aria-labelledby="cierre-title" className="scroll-mt-20">
      <div className={WRAP + " " + PAD + " text-center"}>
        <h2 id="cierre-title" className="text-[34px] leading-[1.06] sm:text-5xl sm:leading-[1.04] font-semibold tracking-tight text-ink">{CLOSE.title}</h2>
        <p className="mt-5 mx-auto max-w-lg text-lg text-slate-600">{CLOSE.body}</p>
        <div className="mt-8 flex justify-center"><CeoCta label={t.CTA} playingLabel={t.UI.playing} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo" /></div>
        <p className="mt-4 text-[13px] text-slate-500">{t.UI.haveAccount} <Link href={LOGIN_HREF} className="text-indigo underline-offset-2 hover:underline">{t.UI.signIn}</Link></p>
      </div>
    </section>
  );
}

export function Footer({ t }: { t: Copy }) {
  const FOOTER = t.FOOTER, U = t.UI;
  return (
    <footer className="border-t border-slate-100">
      <div className={WRAP + " py-12 grid gap-8 md:grid-cols-[1.5fr_1fr_1fr] text-[14px]"}>
        <div>
          <Logo height={24} />
          <p className="mt-3 max-w-xs text-slate-500">{FOOTER.tagline}</p>
        </div>
        <nav aria-label={U.footerNav}>
          <ul className="space-y-2 text-slate-600">
            {t.NAV.map((n) => <li key={n.href}><a href={n.href} className="hover:text-ink">{n.label}</a></li>)}
            <li><Link href={LOGIN_HREF} className="hover:text-ink">{U.login}</Link></li>
          </ul>
        </nav>
        <div className="space-y-2 text-slate-600">
          <a href={`mailto:${CEO_CONTACT_EMAIL}`} className="hover:text-ink">{CEO_CONTACT_EMAIL}</a>
          <p className="text-slate-500">{FOOTER.place}</p>
          <p className="text-slate-500">© 2026 mêtis</p>
          <p className="flex gap-4"><Link href="/legal/privacidad" className="hover:text-ink">{U.privacy}</Link><Link href="/legal/terminos" className="hover:text-ink">{U.terms}</Link></p>
        </div>
      </div>
    </footer>
  );
}
