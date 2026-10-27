/**
 * Secciones estáticas de la landing de MÊTIS CEO (componentes de servidor, sin JS en el cliente).
 * El copy vive en ./content.
 */
import Link from "next/link";
import { ChevronDown, Lightbulb, MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { CeoCta } from "@/components/site/CeoCta";
import { CEO_CONTACT_EMAIL } from "@/lib/site";
import { ACCESS, CLOSE, DIFF, FAQ, FOOTER, HOW, LEARN, LOGIN_HREF, PATH, PHILOSOPHY, RHYTHM, RIPPLE, WHO } from "./content";
import { Ripple } from "./Ripple";

const WRAP = "mx-auto max-w-6xl px-5 sm:px-6";
const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo";
const H2 = "text-[28px] leading-[1.15] sm:text-4xl sm:leading-[1.12] font-semibold tracking-tight text-ink";
const LEAD = "mt-4 text-[17px] leading-relaxed text-slate-600";

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
      <div className={WRAP + " py-20 sm:py-28"}>
        <Head id="ripple-title" eyebrow="Efectos cruzados" title={RIPPLE.title} body={RIPPLE.body} />
        <div className="mt-10"><Ripple /></div>
      </div>
    </section>
  );
}

export function HowSection() {
  return (
    <section id="como" aria-labelledby="como-title" className="scroll-mt-20">
      <div className={WRAP + " py-20 sm:py-28"}>
        <Head id="como-title" eyebrow="Cómo funciona" title={HOW.title} body={HOW.body} />
        <ol className="mt-12 grid md:grid-cols-3 gap-px overflow-hidden rounded-3xl border border-slate-100 bg-slate-100">
          {HOW.steps.map((s) => (
            <li key={s.n} className="bg-white p-6 sm:p-7">
              <span className="text-sm font-semibold tabular-nums text-indigo">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold text-ink">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{s.d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-[14px] text-slate-500">{HOW.footnote}</p>
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
      <div className={WRAP + " py-20 sm:py-28"}>
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
      </div>
    </section>
  );
}

export function LearnSection() {
  return (
    <section aria-labelledby="learn-title">
      <div className={WRAP + " py-20 sm:py-28"}>
        <Head id="learn-title" eyebrow="Aprendizaje continuo" title={LEARN.title} body={LEARN.body} />
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          {LEARN.pillars.map((p, i) => (
            <div key={p.t} className="border-t-2 border-ink pt-5">
              <span className="text-sm tabular-nums text-slate-500">0{i + 1}</span>
              <h3 className="mt-1 text-xl font-semibold text-ink">{p.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{p.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 max-w-2xl">
          <div className="rounded-3xl border border-slate-100 bg-white p-6">
            <h3 className="text-[15px] font-semibold text-ink">Lo que recibes en cada caso</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-slate-600">
              {LEARN.today.map((t) => <li key={t} className="flex gap-2.5"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />{t}</li>)}
            </ul>
            <div className="mt-5 flex gap-2.5 rounded-2xl bg-canvas px-4 py-3">
              <Lightbulb size={16} className="text-indigo shrink-0 mt-0.5" aria-hidden />
              <p className="text-[13px] text-ink"><b>Nota CEO:</b> la mejor forma de negociar con fuerza no es sonar fuerte; es construir alternativas antes de necesitarlas.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PathSection() {
  return (
    <section id="camino" aria-labelledby="camino-title" className="scroll-mt-20 bg-canvas">
      <div className={WRAP + " py-20 sm:py-28"}>
        <Head id="camino-title" eyebrow="Tu camino" title={PATH.title} body={PATH.body} />
        <ol className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PATH.stages.map((s, i) => (
            <li key={s.name} className="relative rounded-3xl bg-white border border-slate-100 p-6">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-indigo">Etapa {s.n}</span>
                {i === 0 && <span className="chip bg-mint-soft text-sob">Aquí empiezas</span>}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-ink">{s.name}</h3>
              <p className="text-[13px] text-slate-500">{s.es}</p>
              <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">Aprendes a decidir sobre</p>
              <p className="mt-1 text-[15px] text-ink">{s.learn}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 grid md:grid-cols-[1.4fr_1fr] gap-4">
          <p className="rounded-3xl bg-white border border-slate-100 p-6 text-[15px] leading-relaxed text-slate-600"><b className="text-ink">Tu rol y tu etapa no son lo mismo.</b> {PATH.roleNote}</p>
          <div className="rounded-3xl bg-ink text-white p-6">
            <p className="text-lg font-semibold leading-snug">{PATH.beyond}</p>
            <p className="mt-3 text-[13px] text-white/60">{PATH.beyondNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RhythmSection() {
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  return (
    <section aria-labelledby="ritmo-title">
      <div className={WRAP + " py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center [&>*]:min-w-0"}>
        <div>
          <Head id="ritmo-title" eyebrow="A tu ritmo" title={RHYTHM.title} body={RHYTHM.body} />
          <dl className="mt-8 space-y-5">
            {RHYTHM.items.map((it) => <div key={it.t}><dt className="font-semibold text-ink">{it.t}</dt><dd className="mt-1 text-[15px] leading-relaxed text-slate-600">{it.d}</dd></div>)}
          </dl>
        </div>
        <figure className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card" aria-label="Ejemplo de la pantalla Hoy">
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
          <ul className="mt-5 space-y-2">
            {[["Lucía · Finanzas", "Necesito tu visto bueno para el presupuesto.", "9:12"], ["Héctor · Comercial", "SuperNorte pide más descuento.", "13:40"], ["Mariana · Personas", "Renunció alguien clave. ¿Hablamos?", "17:05"]].map(([w, t, h]) => (
              <li key={w} className="flex items-center gap-3 rounded-2xl border border-slate-100 px-3.5 py-2.5">
                <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold text-ink">{w}</div><div className="text-[12.5px] text-slate-500 truncate">{t}</div></div>
                <span className="text-[11px] text-slate-500 tabular-nums">{h}</span>
              </li>
            ))}
          </ul>
          <figcaption className="mt-4 text-[11.5px] text-slate-500">Representación de la pantalla Hoy con mensajes de Botanas Cumbre.</figcaption>
        </figure>
      </div>
    </section>
  );
}

export function WhoSection() {
  return (
    <section aria-labelledby="quien-title" className="border-t border-slate-100">
      <div className={WRAP + " py-20 sm:py-28"}>
        <Head id="quien-title" title={WHO.title} body={WHO.body} />
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {WHO.profiles.map((p) => (
            <div key={p.t} className="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 className="text-[17px] font-semibold text-ink">{p.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PhilosophySection() {
  return (
    <section aria-labelledby="filo-title" className="bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white">
      <div className={WRAP + " py-24 sm:py-36"}>
        <div className="max-w-3xl">
          <h2 id="filo-title" className="text-[30px] leading-[1.15] sm:text-5xl sm:leading-[1.1] font-semibold tracking-tight">{PHILOSOPHY.title}</h2>
          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white/75">{PHILOSOPHY.body}</p>
          <div className="mt-10 border-t border-white/15 pt-6">
            <p className="font-semibold">{PHILOSOPHY.author}</p>
            <p className="text-[14px] text-white/60">{PHILOSOPHY.authorRole}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AccessSection() {
  return (
    <section id="acceso" aria-labelledby="acceso-title" className="scroll-mt-20">
      <div className={WRAP + " py-20 sm:py-28 grid lg:grid-cols-2 gap-10 items-center [&>*]:min-w-0"}>
        <Head id="acceso-title" title={ACCESS.title} body={ACCESS.body} />
        <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-card">
          <ul className="space-y-3">
            {ACCESS.points.map((t) => <li key={t} className="flex gap-3 text-[15px] text-ink"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />{t}</li>)}
          </ul>
          <CeoCta label={ACCESS.cta} className="mt-7 w-full justify-center" />
          <p className="mt-3 text-center text-[13px] text-slate-500">¿Ya tienes cuenta? <Link href={LOGIN_HREF} className="text-indigo underline-offset-2 hover:underline">Inicia sesión</Link></p>
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section aria-labelledby="faq-title" className="bg-canvas">
      <div className={WRAP + " py-20 sm:py-28 grid lg:grid-cols-[1fr_1.6fr] gap-10 [&>*]:min-w-0"}>
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
    <section aria-labelledby="cierre-title">
      <div className={WRAP + " py-24 sm:py-32 text-center"}>
        <h2 id="cierre-title" className="text-[32px] leading-[1.1] sm:text-5xl font-semibold tracking-tight text-ink">{CLOSE.title}</h2>
        <p className="mt-4 text-lg text-slate-600">{CLOSE.body}</p>
        <div className="mt-8 flex justify-center"><CeoCta label={CLOSE.cta} className="!px-6" /></div>
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
        </div>
      </div>
    </footer>
  );
}
