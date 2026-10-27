/**
 * Secciones estáticas de la landing de MÊTIS CEO (componentes de servidor, sin JS en el cliente).
 * El copy vive en ./content.
 */
import Link from "next/link";
import { Check, ChevronDown, Flag, Lightbulb, Lock, MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { CeoCta } from "@/components/site/CeoCta";
import { CEO_CONTACT_EMAIL } from "@/lib/site";
import { CLOSE, DIFF, FAQ, FOOTER, HOW, LOGIN_HREF, PATH, PHILOSOPHY, RIPPLE, type StageState } from "./content";
import { Ripple } from "./Ripple";

const WRAP = "mx-auto max-w-6xl px-5 sm:px-6";
const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo";
const H2 = "text-[28px] leading-[1.15] sm:text-4xl sm:leading-[1.12] font-semibold tracking-tight text-ink";
const LEAD = "mt-4 text-[17px] leading-relaxed text-slate-600";
const PAD = "py-16 sm:py-24";

function Head({ eyebrow, title, body, id, center = false }: { eyebrow?: string; title: string; body?: string; id: string; center?: boolean }) {
  return (
    <div className={center ? "max-w-2xl mx-auto text-center" : "max-w-2xl"}>
      {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}
      <h2 id={id} className={(eyebrow ? "mt-3 " : "") + H2}>{title}</h2>
      {body && <p className={LEAD}>{body}</p>}
    </div>
  );
}

export function RippleSection() {
  return (
    <section aria-labelledby="ripple-title" className="bg-canvas">
      <div className={WRAP + " " + PAD}>
        <Head id="ripple-title" eyebrow="Efectos cruzados" title={RIPPLE.title} body={RIPPLE.body} />
        <div className="mt-10"><Ripple /></div>
      </div>
    </section>
  );
}

export function HowSection() {
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  return (
    <section id="como" aria-labelledby="como-title" className="scroll-mt-20">
      <div className={WRAP + " " + PAD + " grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-start [&>*]:min-w-0"}>
        <div>
          <p className={EYEBROW}>Cómo funciona</p>
          <h2 id="como-title" className="mt-3 text-[32px] leading-[1.08] sm:text-5xl sm:leading-[1.05] font-semibold tracking-tight text-ink">{HOW.title}</h2>
          <p className={LEAD + " max-w-xl"}>{HOW.body}</p>
          <ol className="mt-10 space-y-6">
            {HOW.steps.map((s) => (
              <li key={s.n} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="text-2xl font-semibold tabular-nums text-indigo/70 leading-none pt-0.5">{s.n}</span>
                <div><h3 className="text-lg font-semibold text-ink">{s.t}</h3><p className="mt-1 text-[15px] leading-relaxed text-slate-600">{s.d}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <div className="lg:pt-4">
          <figure className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-card" aria-label="Ejemplo de la pantalla Hoy">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Hoy · 9:00 a 18:00</span>
              <span className="text-[12px] text-slate-500 tabular-nums">Racha de 5 días</span>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5" aria-hidden>
              {days.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={"h-2 w-full rounded-full " + (i < 4 ? "bg-indigo" : i === 4 ? "bg-indigo/40" : "bg-slate-100")} />
                  <span className="text-[10px] text-slate-500">{d}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[12px] font-semibold text-ink">Esperando tu decisión</p>
            <ul className="mt-2 space-y-2">
              {[["LM", "Lucía · Finanzas", "Necesito tu visto bueno para el presupuesto.", "9:12"], ["HS", "Héctor · Comercial", "SuperNorte pide más descuento.", "13:40"], ["MR", "Mariana · Personas", "Renunció alguien clave. ¿Hablamos?", "17:05"]].map(([i, w, t, h]) => (
                <li key={w} className="flex items-center gap-3 rounded-2xl border border-slate-100 px-3.5 py-2.5">
                  <span aria-hidden className="h-8 w-8 shrink-0 rounded-full bg-indigo-soft text-indigo grid place-items-center text-[10px] font-semibold">{i}</span>
                  <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold text-ink">{w}</div><div className="text-[12.5px] text-slate-500 truncate">{t}</div></div>
                  <span className="text-[11px] text-slate-500 tabular-nums">{h}</span>
                </li>
              ))}
            </ul>
            <figcaption className="mt-4 text-[11.5px] text-slate-500">Representación de la pantalla Hoy con mensajes de Botanas Cumbre.</figcaption>
          </figure>
          <dl className="mt-8 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 [&>*]:min-w-0">
            {HOW.rhythm.map((it) => <div key={it.t} className="border-l-2 border-slate-200 pl-4"><dt className="text-[15px] font-semibold text-ink">{it.t}</dt><dd className="mt-1 text-[14px] leading-relaxed text-slate-600">{it.d}</dd></div>)}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Fragment({ f }: { f: (typeof DIFF.items)[number]["frag"] }) {
  if (f.kind === "data") return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="text-[12px] font-semibold text-ink">{f.title}</div>
      <dl className="mt-2 divide-y divide-slate-100 text-[12.5px]">
        {f.rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 py-1.5"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-ink tabular-nums text-right">{v}</dd></div>)}
      </dl>
    </div>
  );
  if (f.kind === "outcome") return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo">{f.title}</div>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">{f.text}</p>
    </div>
  );
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 flex gap-3">
      <span aria-hidden className="h-8 w-8 shrink-0 rounded-full bg-indigo-soft text-indigo grid place-items-center text-[10px] font-semibold">HS</span>
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold text-ink">{f.title}</div>
        <p className="mt-1 rounded-xl rounded-tl-md bg-canvas px-3 py-2 text-[13px] text-ink">{f.text}</p>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><MessageCircle size={11} aria-hidden /> Semanas después</div>
      </div>
    </div>
  );
}

export function DiffSection() {
  return (
    <section id="experiencia" aria-labelledby="exp-title" className="scroll-mt-20 bg-[#141735] text-white">
      <div className={WRAP + " " + PAD}>
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mint-light">La experiencia</p>
          <h2 id="exp-title" className="mt-3 text-[28px] leading-[1.15] sm:text-4xl sm:leading-[1.12] font-semibold tracking-tight">{DIFF.title}</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-white/70">{DIFF.body}</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {DIFF.items.map((it) => (
            <article key={it.t} className="flex flex-col">
              <h3 className="text-lg font-semibold">{it.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/70">{it.d}</p>
              <div className="mt-5 flex-1 rounded-3xl bg-white/[0.06] p-3 [&>div]:h-full">
                <Fragment f={it.frag} />
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 text-[12px] text-white/50">{DIFF.source}</p>
        <div className="mt-12 grid md:grid-cols-[1fr_1.1fr] gap-6 md:gap-10 items-center border-t border-white/10 pt-10 [&>*]:min-w-0">
          <div>
            <h3 className="text-xl font-semibold">{DIFF.after.title}</h3>
            <ul className="mt-4 space-y-2.5 text-[15px] text-white/75">
              {DIFF.after.items.map((t) => <li key={t} className="flex gap-2.5"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />{t}</li>)}
            </ul>
          </div>
          <div className="flex gap-3 rounded-3xl bg-white p-5 text-ink">
            <Lightbulb size={18} className="text-indigo shrink-0 mt-0.5" aria-hidden />
            <p className="text-[15px] leading-relaxed"><b>Nota CEO.</b> {DIFF.after.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const NODE: Record<StageState, string> = {
  inicio: "bg-mint text-white ring-4 ring-mint/20",
  siguiente: "bg-white text-indigo ring-2 ring-indigo",
  bloqueada: "bg-white text-slate-400 ring-1 ring-slate-200",
};
const BADGE: Record<StageState, string> = {
  inicio: "bg-mint-soft text-sob",
  siguiente: "bg-indigo-soft text-indigo",
  bloqueada: "bg-slate-100 text-slate-500",
};

export function PathSection() {
  return (
    <section id="camino" aria-labelledby="camino-title" className="scroll-mt-20 bg-canvas">
      <div className={WRAP + " " + PAD}>
        <Head id="camino-title" eyebrow="Tu camino" title={PATH.title} body={PATH.body} />
        <div className="mt-12 rounded-3xl bg-white border border-slate-100 p-5 sm:p-8 shadow-card">
          <ol className="relative grid gap-0 lg:grid-cols-6 lg:gap-4" aria-label="Etapas de la carrera">
            {/* vía: vertical en móvil, horizontal en escritorio; el tramo inicial se marca como avance */}
            <span aria-hidden className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-slate-200 lg:left-5 lg:right-5 lg:top-[19px] lg:bottom-auto lg:h-0.5 lg:w-auto" />
            <span aria-hidden className="absolute left-[19px] top-5 h-[calc((100%-2.5rem)/5*0.5)] w-0.5 bg-gradient-to-b from-mint to-indigo lg:left-5 lg:top-[19px] lg:h-0.5 lg:w-[calc((100%-2.5rem)/5*0.5)] lg:bg-gradient-to-r" />
            {PATH.stages.map((s) => (
              <li key={s.name} className="relative grid grid-cols-[40px_1fr] gap-4 pb-7 last:pb-0 lg:block lg:pb-0" aria-current={s.state === "inicio" ? "step" : undefined}>
                <span className={"relative z-10 h-10 w-10 rounded-full grid place-items-center text-[13px] font-semibold tabular-nums " + NODE[s.state]}>
                  {s.state === "inicio" ? <Check size={17} aria-hidden /> : s.state === "bloqueada" ? <Lock size={14} aria-hidden /> : s.n}
                </span>
                <div className="min-w-0 lg:mt-5">
                  <span className="text-[12px] font-semibold tabular-nums text-slate-500">Etapa {s.n}</span>
                  <h3 className={"mt-0.5 text-[16px] leading-snug font-semibold " + (s.state === "bloqueada" ? "text-ink/80" : "text-ink")}>{s.name}</h3>
                  <p className="text-[12.5px] text-slate-500">{s.es}</p>
                  <p className="mt-2 text-[14px] text-ink">{s.learn}</p>
                  <span className={"chip mt-3 " + BADGE[s.state]}>{PATH.stateLabel[s.state]}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-4 grid md:grid-cols-[1.4fr_1fr] gap-4 [&>*]:min-w-0">
          <p className="rounded-3xl bg-white border border-slate-100 p-6 text-[15px] leading-relaxed text-slate-600"><b className="text-ink">Cómo avanzas.</b> {PATH.how}</p>
          <div className="rounded-3xl bg-ink text-white p-6 flex gap-3">
            <Flag size={18} className="text-mint-light shrink-0 mt-1" aria-hidden />
            <div><p className="text-lg font-semibold leading-snug">{PATH.beyond.t}</p><p className="mt-2 text-[14px] leading-relaxed text-white/65">{PATH.beyond.d}</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PhilosophySection() {
  return (
    <section aria-labelledby="filo-title" className="bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white">
      <div className={WRAP + " py-20 sm:py-28"}>
        <div className="max-w-3xl">
          <h2 id="filo-title" className="text-[30px] leading-[1.15] sm:text-5xl sm:leading-[1.1] font-semibold tracking-tight">{PHILOSOPHY.title}</h2>
          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white/75">{PHILOSOPHY.body}</p>
          <div className="mt-12 grid md:grid-cols-[auto_1fr] gap-4 md:gap-8 border-t border-white/15 pt-8 [&>*]:min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mint-light md:pt-1">{PHILOSOPHY.eyebrow}</p>
            <p className="text-[16px] leading-relaxed text-white/75 max-w-xl">{PHILOSOPHY.story}</p>
          </div>
          <div className="mt-8">
            <p className="font-semibold">{PHILOSOPHY.author}</p>
            <p className="text-[14px] text-white/60">{PHILOSOPHY.authorRole}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section aria-labelledby="faq-title" className="bg-canvas">
      <div className={WRAP + " " + PAD + " grid lg:grid-cols-[1fr_1.6fr] gap-10 [&>*]:min-w-0"}>
        <Head id="faq-title" title="Preguntas frecuentes" />
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {FAQ.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16px] font-medium text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo rounded [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown size={18} aria-hidden className="shrink-0 text-slate-500 motion-safe:transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-5 -mt-1 text-[15px] leading-relaxed text-slate-600 max-w-xl">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CloseSection() {
  return (
    <section id="acceso" aria-labelledby="cierre-title" className="scroll-mt-20">
      <div className={WRAP + " " + PAD + " grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center [&>*]:min-w-0"}>
        <div>
          <h2 id="cierre-title" className="text-[34px] leading-[1.06] sm:text-6xl sm:leading-[1.02] font-semibold tracking-tight text-ink">{CLOSE.title}</h2>
          <p className="mt-5 text-lg text-slate-600 max-w-md">{CLOSE.body}</p>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-card">
          <ul className="space-y-3">
            {CLOSE.points.map((t) => <li key={t} className="flex gap-3 text-[15px] text-ink"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />{t}</li>)}
          </ul>
          <CeoCta label={CLOSE.cta} className="mt-7 w-full justify-center" />
          <p className="mt-3 text-center text-[13px] text-slate-500">¿Ya tienes cuenta? <Link href={LOGIN_HREF} className="text-indigo underline-offset-2 hover:underline">Inicia sesión</Link></p>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-100">
      <div className={WRAP + " py-12 grid gap-8 md:grid-cols-[1.5fr_1fr_1fr] text-[14px]"}>
        <div>
          <Logo height={24} />
          <p className="mt-3 max-w-xs text-slate-500">{FOOTER.tagline}</p>
        </div>
        <nav aria-label="Pie de página">
          <ul className="space-y-2 text-slate-600">
            <li><a href="#como" className="hover:text-ink">Cómo funciona</a></li>
            <li><a href="#decision" className="hover:text-ink">Probar una decisión</a></li>
            <li><Link href={LOGIN_HREF} className="hover:text-ink">Iniciar sesión</Link></li>
          </ul>
        </nav>
        <div className="space-y-2 text-slate-600">
          <a href={`mailto:${CEO_CONTACT_EMAIL}`} className="hover:text-ink">{CEO_CONTACT_EMAIL}</a>
          <p className="text-slate-500">{FOOTER.place}</p>
          <p className="text-slate-500">© 2026 mêtis</p>
          <p className="flex gap-4"><Link href="/legal/privacidad" className="hover:text-ink">Aviso de privacidad</Link><Link href="/legal/terminos" className="hover:text-ink">Términos</Link></p>
        </div>
      </div>
    </footer>
  );
}
