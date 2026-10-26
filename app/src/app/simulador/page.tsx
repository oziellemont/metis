/**
 * Landing de mêtis CEO. En metis.ceo el middleware sirve esta página en «/»; en metisalign.mx vive en /simulador.
 * Mismo lenguaje de diseño que la landing de alineación (src/app/page.tsx): hero navy con tarjeta animada de
 * 4 escenas, tarjetas blancas, chips índigo y animaciones tree-* al entrar en pantalla.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Smartphone, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { CeoHeroStory } from "@/components/site/CeoHeroStory";
import { CeoCta } from "@/components/site/CeoCta";
import { CeoStats, StreakVisual, TeamVisual, LessonVisual, PathVisual, BoardVisual } from "@/components/site/CeoVisuals";
import { COMPANIES, UPCOMING } from "@/lib/ceo/companies";
import { LESSONS } from "@/lib/ceo/lessons";
import { LEVERS } from "@/lib/ceo/change";
import { CONTACT_EMAIL, CEO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "mêtis CEO · Aprende a dirigir, unos minutos al día" },
  description: "La forma práctica de aprender a dirigir una empresa. Cada día te llega un caso real, decides, ves las consecuencias y subes de gerente a CEO. Basado en «De CERO a CEO».",
  alternates: { canonical: CEO_URL },
  openGraph: { title: "mêtis CEO · Aprende a dirigir, unos minutos al día", description: "Un caso al día. Decisiones con consecuencias. De gerente a CEO.", siteName: "mêtis CEO", locale: "es_MX", type: "website", url: CEO_URL },
};

function Nav() {
  return (
    <header className="text-white">
      <div className="mx-auto max-w-6xl px-6 py-5 flex items-center gap-6">
        <Link href="/" aria-label="mêtis CEO · inicio" className="flex items-center"><Logo variant="light" height={30} priority /></Link>
        <nav className="ml-auto hidden md:flex items-center gap-6 text-sm text-white/80">
          <a href="#como" className="hover:opacity-80">Cómo funciona</a>
          <a href="#carrera" className="hover:opacity-80">Tu carrera</a>
          <a href="#metodo" className="hover:opacity-80">El método</a>
          <Link href="/ceo" className="hover:opacity-80 font-medium">Ya tengo cuenta</Link>
        </nav>
        <Link href="/ceo/empezar" className="btn bg-white text-ink hover:bg-white/90 ml-auto md:ml-0">Empezar</Link>
      </div>
    </header>
  );
}

function Feature({ eyebrow, title, body, visual, flip = false, id }: { eyebrow: string; title: string; body: string; visual: React.ReactNode; flip?: boolean; id?: string }) {
  return (
    <div id={id} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div className={flip ? "lg:order-2" : ""}>
        <div className="text-xs font-semibold uppercase tracking-wider text-indigo">{eyebrow}</div>
        <h2 className="mt-2 text-3xl sm:text-4xl font-semibold leading-tight">{title}</h2>
        <p className="mt-4 text-lg text-slate-600 max-w-lg">{body}</p>
      </div>
      <div className={flip ? "lg:order-1" : ""}>{visual}</div>
    </div>
  );
}

export default function CeoLanding() {
  const cases = COMPANIES.reduce((a, c) => a + c.items.length, 0);
  return (
    <>
      {/* HERO */}
      <div className="bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white">
        <Nav />
        <section className="mx-auto max-w-6xl px-6 pt-14 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="chip bg-white/10 text-white/90">Simulador de dirección general · basado en «De CERO a CEO»</span>
            <h1 className="mt-5 text-4xl leading-[1.15] sm:text-5xl sm:leading-[1.15] font-semibold tracking-tight">Aprende a dirigir. Unos minutos al día.</h1>
            <p className="mt-5 text-lg text-white/75 max-w-xl">Cada día te llega un caso real de tu empresa. Decides, ves las consecuencias y aprendes por qué. Así, día a día, llegas a CEO.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CeoCta />
              <a href="#como" className="btn bg-white/10 text-white hover:bg-white/20 !px-5 !py-3">Ver cómo funciona</a>
            </div>
            <p className="mt-4 text-xs text-white/50">5 minutos al día · en tu celular o computadora · sin instalar nada</p>
          </div>
          <CeoHeroStory />
        </section>
      </div>

      {/* EL RETO */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo">El reto de llegar arriba</div>
          <h2 className="mt-2 text-3xl font-semibold">A dirigir no se aprende leyendo. Se aprende decidiendo.</h2>
          <p className="mt-3 text-slate-600">Los cursos te explican la teoría; la empresa real te cobra cada error. En medio no hay un lugar para practicar. mêtis CEO es ese lugar: decisiones de verdad, consecuencias de verdad, sin poner en riesgo a nadie.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[["Corto", "Un caso al día. Cinco minutos en el café, entre juntas o de camino a casa. Lo suficiente para formar el hábito."], ["Real", "Bancos, sindicatos, clientes que aprietan y socios que no se ponen de acuerdo. Los dilemas que enfrenta un director todos los días."], ["Efectivo", "Cada decisión tiene consecuencias y cada caso cierra con la nota del CEO. Aprendes de lo que hiciste, no de lo que leíste."]].map(([t, d]) => (
            <div key={t} className="card p-6"><h3 className="font-semibold">{t}</h3><p className="mt-2 text-sm text-slate-600">{d}</p></div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como" className="bg-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-24 space-y-24">
          <Feature
            eyebrow="Un hábito, no un curso"
            title="Cinco minutos al día cambian cómo diriges."
            body="Tu equipo te escribe en el horario que tú eliges, por correo y en el celular. Contesta a tiempo, enciende tu racha y vuelve mañana. La constancia es lo que hace al CEO."
            visual={<StreakVisual />}
          />
          <Feature
            flip
            eyebrow="Decisiones con consecuencias"
            title="Tu gente recuerda cada decisión."
            body="Cada persona tiene su puesto, su jefe, sus aliados y sus tensiones. Lo que le das a uno se lo quitas a otro. Al cierre de cada nivel, el reto final: lograr que tu organización adopte el cambio."
            visual={<TeamVisual />}
          />
          <Feature
            eyebrow="Aprendes en un minuto"
            title="Cada caso termina con una lección."
            body={`Después de decidir, la nota del CEO te explica qué estaba en juego. Y cuando quieras profundizar, ${LESSONS.length} lecciones cortas de mêtis Academy con preguntas para practicar.`}
            visual={<LessonVisual />}
          />
        </div>
      </section>

      {/* CIFRAS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <CeoStats items={[[cases, "casos reales para decidir"], [COMPANIES.length, "empresas, cada una un nivel"], [LESSONS.length, "lecciones de mêtis Academy"], [Object.keys(LEVERS).length, "palancas para mover el cambio"]]} />
      </section>

      {/* CARRERA */}
      <section id="carrera" className="bg-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-24 space-y-24">
          <Feature
            eyebrow="Tu carrera"
            title="De gerente a CEO, nivel por nivel."
            body={`Empiezas en ${COMPANIES[0].name}, una empresa familiar. Si apruebas los cinco rubros y tu gente adopta el cambio, te llama una empresa de otro giro, más grande y más exigente.`}
            visual={<PathVisual companies={COMPANIES} />}
          />
          <Feature
            flip
            eyebrow="El consejo te evalúa"
            title="Caja, margen, equipo, clientes y consejo."
            body="Como en la vida real, no basta con ganar en un frente. El consejo revisa los cinco rubros al cierre de cada nivel y decide si asciendes. Compárate con otros directores en el ranking."
            visual={<BoardVisual />}
          />
        </div>
      </section>

      {/* EMPRESAS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo">Empresas</div>
          <h2 className="mt-2 text-3xl font-semibold">Cada empresa, un mundo distinto.</h2>
          <p className="mt-3 text-slate-600">Industrias, culturas y dueños distintos. Lo que funcionó en una puede no funcionar en la siguiente.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {COMPANIES.map((c, i) => (
            <div key={c.id} className="card p-6">
              <div className="flex items-center justify-between"><span className="h-11 w-11 rounded-xl bg-indigo-soft grid place-items-center text-xl">{c.emoji}</span><span className="chip bg-indigo-soft text-indigo">Nivel {i + 1}</span></div>
              <h3 className="mt-4 font-semibold">{c.name}</h3>
              <div className="text-xs text-slate-400">{c.industry} · {c.city}</div>
              <p className="mt-2 text-sm text-slate-600">{c.tagline}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">Próximamente</span>
          {UPCOMING.map((u) => <span key={u.id} className="chip bg-white border border-slate-100 text-slate-600">{u.emoji} {u.name}</span>)}
        </div>
      </section>

      {/* MÉTODO */}
      <section id="metodo" className="bg-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo">El método</div>
            <h2 className="mt-2 text-3xl font-semibold">Basado en «De CERO a CEO».</h2>
            <p className="mt-3 text-slate-600">Los casos, las notas y las lecciones salen del libro de Oziel Leal Montemayor: años de dirigir empresas en México convertidos en práctica diaria. Las empresas y sus personajes son ficticios; los dilemas no.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><Smartphone size={14} /> Avisos solo en tu horario</span><span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Con tu correo, tu avance te sigue a cualquier dispositivo</span><span className="inline-flex items-center gap-1.5"><Sparkles size={14} /> En español, con casos de México</span></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[["La mentalidad del CEO", "Responsabilidad antes que poder."], ["Liderar personas", "Cada quien necesita algo distinto de ti."], ["Equipos de alto desempeño", "Confianza, conflicto sano y resultados."], ["Gestión del cambio", "Las palancas para que tu gente lo adopte."]].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-slate-100 p-5"><div className="font-semibold text-ink">{t}</div><div className="mt-1 text-sm text-slate-500">{d}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* CIERRE */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1"><h2 className="text-3xl font-semibold">Mañana eres Director General.</h2><p className="mt-3 text-white/75">Dinos tu nombre, elige tu horario y recibe tu primer correo del fundador. Tu carrera empieza hoy.</p></div>
          <CeoCta label="Aceptar el puesto" className="!px-6" />
        </div>
      </section>

      <footer className="border-t border-slate-100 mt-20">
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
