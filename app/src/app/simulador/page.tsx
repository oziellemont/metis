/**
 * Landing de mêtis CEO (www.metis.ceo). Simple y didáctica: qué es → así funciona (3 pasos) →
 * 3 razones con visual animado → precio → cierre. Mismo lenguaje de diseño que metisalign.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { CeoHeroStory } from "@/components/site/CeoHeroStory";
import { CeoCta } from "@/components/site/CeoCta";
import { HowSteps, StreakVisual, TeamVisual, PathVisual } from "@/components/site/CeoVisuals";
import { COMPANIES } from "@/lib/ceo/companies";
import { CEO_PRICE_MXN } from "@/lib/billing";
import { CONTACT_EMAIL, CEO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "mêtis CEO · Aprende a dirigir, unos minutos al día" },
  description: "Cada día te llega un caso de tu empresa. Decides, ves qué pasa y aprendes por qué. Así, día a día, llegas a CEO.",
  alternates: { canonical: CEO_URL },
  openGraph: { title: "mêtis CEO · Aprende a dirigir, unos minutos al día", description: "Un caso al día. Decides, ves qué pasa y aprendes. De gerente a CEO.", siteName: "mêtis CEO", locale: "es_MX", type: "website", url: CEO_URL },
};

function Nav() {
  return (
    <header className="text-white">
      <div className="mx-auto max-w-6xl px-6 py-5 flex items-center gap-6">
        <Link href="/" aria-label="mêtis CEO · inicio" className="flex items-center"><Logo variant="light" height={30} priority /></Link>
        <nav className="ml-auto hidden md:flex items-center gap-6 text-sm text-white/80">
          <a href="#como" className="hover:opacity-80">Cómo funciona</a>
          <a href="#precio" className="hover:opacity-80">Precio</a>
          <Link href="/ceo" className="hover:opacity-80 font-medium">Ya tengo cuenta</Link>
        </nav>
        <Link href="/ceo/empezar" className="btn bg-white text-ink hover:bg-white/90 ml-auto md:ml-0">Empezar</Link>
      </div>
    </header>
  );
}

function Feature({ title, body, visual, flip = false }: { title: string; body: string; visual: React.ReactNode; flip?: boolean }) {
  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div className={flip ? "lg:order-2" : ""}>
        <h2 className="text-3xl sm:text-4xl font-semibold leading-tight text-indigo">{title}</h2>
        <p className="mt-4 text-lg text-slate-600 max-w-md">{body}</p>
      </div>
      <div className={flip ? "lg:order-1" : ""}>{visual}</div>
    </div>
  );
}

export default function CeoLanding() {
  return (
    <>
      {/* PORTADA */}
      <div className="bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white">
        <Nav />
        <section className="mx-auto max-w-6xl px-6 pt-14 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl leading-[1.15] sm:text-5xl sm:leading-[1.15] font-semibold tracking-tight">Aprende a dirigir una empresa. Unos minutos al día.</h1>
            <p className="mt-5 text-lg text-white/75 max-w-xl">Cada día te llega un caso de tu empresa. Decides, ves qué pasa y aprendes por qué.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CeoCta label="Empieza ahora" />
              <Link href="/ceo" className="btn bg-white/10 text-white hover:bg-white/20 !px-5 !py-3">Ya tengo cuenta</Link>
            </div>
          </div>
          <CeoHeroStory />
        </section>
      </div>

      {/* ASÍ FUNCIONA */}
      <section id="como" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold">Así funciona</h2>
          <p className="mt-3 text-lg text-slate-600">Te nombramos Director General de una empresa. Tú la diriges.</p>
        </div>
        <div className="mt-14">
          <HowSteps steps={[
            { n: "1", icon: "inbox", t: "Te llega un caso", d: "Un mensaje de tu equipo, un cliente o tu consejo. Algo que hay que resolver hoy." },
            { n: "2", icon: "decide", t: "Tú decides", d: "Eliges qué hacer y ves qué pasa en tu empresa y con tu gente." },
            { n: "3", icon: "up", t: "Aprendes y subes", d: "Entiendes por qué funcionó (o no) y avanzas de gerente a CEO." },
          ]} />
        </div>
      </section>

      {/* TRES RAZONES */}
      <section className="bg-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-24 space-y-24">
          <Feature
            title="Corto y todos los días"
            body="Unos minutos al día, en el celular o la computadora. Tu equipo te escribe en el horario que tú eliges y tu racha te ayuda a no perder el hábito."
            visual={<StreakVisual />}
          />
          <Feature
            flip
            title="Como en una empresa de verdad"
            body="Cada persona tiene su carácter y sus intereses. Lo que decides hoy cambia cómo te responden mañana."
            visual={<TeamVisual />}
          />
          <Feature
            title="Avanzas de gerente a CEO"
            body={`Empiezas en una empresa familiar. Si te va bien, te llama otra más grande. Son ${COMPANIES.length} empresas y vienen más.`}
            visual={<PathVisual companies={COMPANIES} />}
          />
        </div>
      </section>

      {/* PRECIO */}
      <section id="precio" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold">Un precio simple</h2>
          <p className="mt-3 text-lg text-slate-600">Menos de 2 pesos al día.</p>
        </div>
        <div className="mt-12 mx-auto max-w-md rounded-3xl border-2 border-indigo bg-white p-8 shadow-[0_12px_32px_-12px_rgba(79,63,224,0.25)]">
          <div className="text-sm font-semibold text-indigo">mêtis CEO</div>
          <div className="mt-3 flex items-end gap-1.5"><span className="text-5xl font-semibold text-ink tabular-nums">${CEO_PRICE_MXN}</span><span className="pb-1.5 text-slate-500">MXN / mes</span></div>
          <ul className="mt-7 space-y-3">
            {["Un caso nuevo cada día", `Las ${COMPANIES.length} empresas y las que vengan`, "Lecciones cortas de mêtis Academy", "Tu avance guardado en todos tus dispositivos", "Cancela cuando quieras"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-slate-700"><span className="h-5 w-5 shrink-0 rounded-full bg-mint/15 text-mint grid place-items-center"><Check size={12} strokeWidth={3} /></span>{t}</li>
            ))}
          </ul>
          <CeoCta label="Empieza ahora" className="mt-8 w-full justify-center" />
        </div>
      </section>

      {/* CIERRE */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1"><h2 className="text-3xl font-semibold">Mañana eres Director General.</h2><p className="mt-3 text-white/75">Basado en el libro «De CERO a CEO» de Oziel Leal Montemayor.</p></div>
          <CeoCta label="Aceptar el puesto" className="!px-6" />
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-slate-500">
          <Logo height={24} />
          <span>Aprende a dirigir, unos minutos al día</span>
          <span className="sm:ml-auto"><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">{CONTACT_EMAIL}</a> · Monterrey, N.L., México</span>
          <span>© 2026 mêtis</span>
        </div>
      </footer>
    </>
  );
}
