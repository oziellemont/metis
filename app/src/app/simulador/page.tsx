/**
 * Landing de mêtis CEO. En metis.ceo el middleware sirve esta página en «/»; en metisalign.mx vive en /simulador.
 * Misma estructura y estilo que la landing de alineación (src/app/page.tsx).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Inbox, Scale, Network, GraduationCap, Smartphone, BookOpen, Clock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { CeoHeroStory } from "@/components/site/CeoHeroStory";
import { CeoCta } from "@/components/site/CeoCta";
import { COMPANIES, UPCOMING } from "@/lib/ceo/companies";
import { LEVELS } from "@/lib/ceo/engine";
import { CONTACT_EMAIL, CEO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "mêtis CEO · Entrena como CEO dirigiendo una empresa" },
  description: "Un simulador para aprender a dirigir. Te llegan correos, WhatsApps y reportes de tu equipo durante el día; decides, ves las consecuencias y subes de gerente a CEO. Basado en «De CERO a CEO».",
  alternates: { canonical: CEO_URL },
  openGraph: { title: "mêtis CEO · Entrena como CEO", description: "Tu empresa, tu equipo, tus decisiones. Todos los días.", siteName: "mêtis CEO", locale: "es_MX", type: "website", url: CEO_URL },
};

function Nav() {
  return (
    <header className="text-white">
      <div className="mx-auto max-w-6xl px-6 py-5 flex items-center gap-6">
        <Link href="/" aria-label="mêtis CEO · inicio" className="flex items-center"><Logo variant="light" height={30} priority /></Link>
        <nav className="ml-auto hidden sm:flex items-center gap-6 text-sm text-white/80">
          <a href="#como" className="hover:opacity-80">Cómo funciona</a>
          <a href="#empresas" className="hover:opacity-80">Empresas</a>
          <a href="#libro" className="hover:opacity-80">El método</a>
          <Link href="/ceo" className="hover:opacity-80 font-medium">Entrar</Link>
        </nav>
        <Link href="/ceo/empezar" className="btn bg-white text-ink hover:bg-white/90 ml-auto sm:ml-0">Empezar</Link>
      </div>
    </header>
  );
}

export default function CeoLanding() {
  return (
    <>
      <div className="bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white">
        <Nav />
        <section className="mx-auto max-w-6xl px-6 pt-14 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="chip bg-white/10 text-white/90">Simulador de dirección general · basado en «De CERO a CEO»</span>
            <h1 className="mt-5 text-4xl leading-[1.2] sm:text-5xl sm:leading-[1.2] font-semibold tracking-tight">Aprende a dirigir una empresa dirigiendo una.</h1>
            <p className="mt-5 text-lg text-white/75 max-w-xl">En mêtis CEO te nombran Director General de una empresa simulada. Durante el día te escriben tu equipo, tus clientes y tu consejo. Decides, ves las consecuencias y, si lo haces bien, te llaman de una empresa más grande.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CeoCta />
              <a href="#como" className="btn bg-white/10 text-white hover:bg-white/20 !px-5 !py-3">Ver cómo funciona</a>
            </div>
            <p className="mt-4 text-xs text-white/50">Unos minutos al día · desde el celular o la computadora · sin instalar nada</p>
          </div>
          <CeoHeroStory />
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo">El reto de llegar arriba</div>
          <h2 className="mt-2 text-3xl font-semibold">Nadie te entrena para ser CEO. Te avientan.</h2>
          <p className="mt-3 text-slate-600">El día que llegas a dirigir, los problemas no vienen en un caso de estudio ordenado. Llegan al mismo tiempo, con información incompleta y con personas que tienen sus propios intereses. Casi todos aprenden a prueba y error, con la empresa real como laboratorio.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[["Todo llega al mismo tiempo", "El banco, el cliente que pide descuento, la renuncia que no viste venir y el consejo que quiere resultados. Hay que priorizar sin tener todo claro."], ["Cada decisión mueve a alguien", "Lo que le das a un área se lo quitas a otra. Tu gente recuerda cómo la trataste y eso pesa en la siguiente decisión."], ["El cambio no se decreta", "Puedes tener la mejor estrategia y que nadie la adopte. Mover a una organización es otra habilidad, y casi nadie la practica."]].map(([t, d]) => (
            <div key={t} className="card p-6"><h3 className="font-semibold">{t}</h3><p className="mt-2 text-sm text-slate-600">{d}</p></div>
          ))}
        </div>
      </section>

      <section id="como" className="bg-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo">Cómo se juega</div>
          <h2 className="mt-2 text-3xl font-semibold max-w-2xl">Una empresa que vive en tu bolsillo.</h2>
          <div className="mt-10 grid lg:grid-cols-4 gap-5">
            {[
              [Inbox, "Tu bandeja, durante el día", "Correos, WhatsApps, reportes y juntas llegan en tu horario, con plazo. Si no contestas, la empresa decide sin ti… y también tiene consecuencias."],
              [Scale, "Decisiones con consecuencias", "Cada decisión mueve caja, margen, equipo, clientes y la confianza del consejo. Algunas consecuencias llegan días después."],
              [Network, "Tu gente reacciona", "Cada persona tiene su puesto, su jefe, sus aliados y sus tensiones. Al cierre de cada nivel tienes que lograr que adopten el cambio."],
              [GraduationCap, "Aprendes mientras juegas", "Después de cada caso, la nota del CEO y lecciones cortas de mêtis Academy para entender qué hiciste bien y qué no."],
            ].map(([Icon, t, d]) => { const I = Icon as React.ElementType; return (
              <div key={t as string} className="rounded-2xl border border-slate-100 p-6"><span className="h-10 w-10 rounded-xl bg-indigo-soft text-indigo inline-flex items-center justify-center"><I size={18} /></span><h3 className="mt-4 font-semibold">{t as string}</h3><p className="mt-2 text-sm text-slate-600">{d as string}</p></div>
            ); })}
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><Smartphone size={14} /> Avisos por correo y en el celular, solo en el horario que elijas</span><span className="inline-flex items-center gap-1.5"><Clock size={14} /> Unos minutos al día</span></div>
        </div>
      </section>

      <section id="empresas" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo">Tu carrera</div>
            <h2 className="mt-2 text-3xl font-semibold">Cada empresa es un nivel. El consejo decide si subes.</h2>
            <p className="mt-3 text-slate-600">Empiezas en una empresa familiar y, si apruebas todos los rubros y logras que tu gente adopte el cambio, te llaman de otro giro, más grande y más exigente.</p>
            <ul className="mt-8 space-y-5">
              {LEVELS.map((l, i) => (
                <li key={l.name} className="flex items-start gap-3">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-mint/15 text-mint grid place-items-center"><Check size={12} strokeWidth={3} /></span>
                  <div><div className="font-medium text-ink">{l.name}</div><div className="text-sm text-slate-500">{["Tus primeros pasos al frente.", "Ya respondes por resultados de toda un área.", "La empresa completa depende de ti.", "Te mide el consejo, no tu jefe.", "Los mejores, en el ranking."][i]}</div></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_1px_2px_rgba(23,26,58,0.04),0_12px_32px_-12px_rgba(23,26,58,0.10)] p-7 lg:p-8">
            <div className="flex items-baseline justify-between"><h3 className="font-semibold text-ink">Empresas</h3><span className="text-xs font-medium text-slate-400">{COMPANIES.length} disponibles · {UPCOMING.length} en camino</span></div>
            <ol className="mt-6 space-y-3">
              {COMPANIES.map((c, i) => (
                <li key={c.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
                  <span className="h-10 w-10 shrink-0 rounded-xl bg-indigo-soft grid place-items-center text-lg">{c.emoji}</span>
                  <div className="min-w-0"><div className="flex items-center gap-2"><span className="font-semibold text-ink">{c.name}</span><span className="chip bg-indigo-soft text-indigo !text-[10px]">Nivel {i + 1}</span></div><div className="text-xs text-slate-400">{c.industry} · {c.city}</div><p className="mt-1 text-sm text-slate-600">{c.tagline}</p></div>
                </li>
              ))}
              <li className="rounded-2xl border border-dashed border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Próximamente</div>
                <div className="mt-2 flex flex-wrap gap-2">{UPCOMING.map((u) => <span key={u.id} className="chip bg-slate-50 text-slate-600">{u.emoji} {u.name}</span>)}</div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section id="libro" className="bg-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo">El método</div>
            <h2 className="mt-2 text-3xl font-semibold">Basado en «De CERO a CEO».</h2>
            <p className="mt-3 text-slate-600">Los casos, las notas y las lecciones salen del libro de Oziel Leal Montemayor: liderar personas, equipos de alto desempeño, alineación estratégica y cómo mover a una organización hacia el cambio. Las empresas y sus personajes son ficticios; los dilemas son los de todos los días.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[["La mentalidad del CEO", "Responsabilidad antes que poder."], ["Liderar personas", "Cada quien necesita algo distinto de ti."], ["Equipos de alto desempeño", "Confianza, conflicto sano y resultados."], ["Gestión del cambio", "9 palancas para que tu gente lo adopte."]].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-slate-100 p-5"><BookOpen size={16} className="text-indigo" /><div className="mt-3 font-semibold text-ink">{t}</div><div className="mt-1 text-sm text-slate-500">{d}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1"><h2 className="text-3xl font-semibold">Mañana eres Director General.</h2><p className="mt-3 text-white/75">Dinos tu nombre, elige tu horario y recibe tu primer correo del fundador. Tu carrera empieza hoy.</p></div>
          <CeoCta label="Aceptar el puesto" className="!px-6" />
        </div>
      </section>

      <footer className="border-t border-slate-100 mt-20">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-slate-500">
          <Logo height={24} />
          <span>Entrena como CEO</span>
          <span className="sm:ml-auto"><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">{CONTACT_EMAIL}</a> · Monterrey, N.L., México</span>
          <span>© 2026 mêtis</span>
        </div>
      </footer>
    </>
  );
}
