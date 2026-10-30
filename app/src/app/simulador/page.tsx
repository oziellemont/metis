/**
 * Landing de MÊTIS CEO (www.metis.ceo; el middleware reescribe «/» hacia aquí).
 * Siete bloques, una idea cada uno (adenda de Oziel, 30-oct-2026): hero → una primera decisión → cómo funciona →
 * una empresa que recuerda (carrusel) → tu carrera → por qué importa dirigir bien → preguntas y cierre.
 * Una sola acción principal (CTA, «Comenzar gratis») con el mismo destino en encabezado, hero, demo y cierre.
 * Aislada del simulador: la demo vive en memoria y no usa el motor, la partida ni la cuenta.
 * Copy y estado real de cada función en components/site/ceo-landing/content.ts.
 */
import type { Metadata } from "next";
import { Header } from "@/components/site/ceo-landing/Header";
import { FirstDecision } from "@/components/site/ceo-landing/FirstDecision";
import { CeoCta } from "@/components/site/CeoCta";
import { Story } from "@/components/site/ceo-landing/Story";
import { CloseSection, FaqSection, MemorySection, Footer, HowSection, PathSection, PhilosophySection } from "@/components/site/ceo-landing/Sections";
import { CTA, HERO, SEO } from "@/components/site/ceo-landing/content";
import { CEO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SEO.title },
  description: SEO.description,
  alternates: { canonical: CEO_URL },
  openGraph: { title: SEO.title, description: SEO.description, siteName: "MÊTIS CEO", locale: "es_MX", type: "website", url: CEO_URL, images: [{ url: `${CEO_URL}/brand/ceo-og.jpg`, width: 1200, height: 630, alt: "MÊTIS CEO. Dirigir se aprende decidiendo." }] },
  twitter: { card: "summary_large_image", title: SEO.title, description: SEO.description, images: [`${CEO_URL}/brand/ceo-og.jpg`] },
};

export default function CeoLanding() {
  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-ink">Saltar al contenido</a>
      <Header />
      <main id="contenido">
        <div className="bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white">
          <section aria-labelledby="hero-title" className="mx-auto max-w-6xl px-5 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-24 grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-14 items-center [&>*]:min-w-0">
            <div>
              <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.16em] text-white/60">{HERO.eyebrow}</p>
              <h1 id="hero-title" className="mt-4 text-[40px] leading-[1.06] sm:text-6xl sm:leading-[1.04] font-semibold tracking-tight">{HERO.title}</h1>
              <p className="mt-5 text-[17px] sm:text-lg leading-relaxed text-white/75 max-w-xl">{HERO.body}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
                <CeoCta label={CTA} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" />
                <span className="text-[13px] text-white/50">{HERO.note}</span>
              </div>
              <p className="mt-10 text-[15px] font-medium text-white/70">{HERO.motto}</p>
            </div>
            <Story />
          </section>
        </div>
        <FirstDecision />
        <HowSection />
        <MemorySection />
        <PathSection />
        <PhilosophySection />
        <FaqSection />
        <CloseSection />
      </main>
      <Footer />
    </>
  );
}
