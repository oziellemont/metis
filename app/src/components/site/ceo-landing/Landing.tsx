/**
 * Landing de MÊTIS CEO, la misma para los dos idiomas (t = ES o EN).
 * Bloques: qué es mêtis con un caso real al lado → cómo funciona (tres pantallas) → una empresa que recuerda
 * (carrusel) → tu carrera → por qué importa dirigir bien → preguntas y cierre.
 * Una sola acción principal (CTA) con el mismo destino en encabezado, primer bloque y cierre.
 * Aislada del simulador: las demos viven en memoria y no usan el motor, la partida ni la cuenta.
 */
import { Header } from "./Header";
import { CaseDemo } from "./CaseDemo";
import { CeoCta } from "@/components/site/CeoCta";
import { CloseSection, FaqSection, MemorySection, Footer, HowSection, PathSection, PhilosophySection } from "./Sections";
import type { Copy } from "./content";

export function Landing({ t }: { t: Copy }) {
  const H = t.HERO;
  return (
    <div lang={t.lang === "en" ? "en" : "es-MX"}>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-ink">{t.UI.skip}</a>
      <Header t={t} />
      <main id="contenido">
        <div className="overflow-x-clip bg-gradient-to-b from-[#F3F1FE] via-white to-white">
          <section aria-labelledby="hero-title" className="mx-auto max-w-6xl px-5 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-24 grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-center [&>*]:min-w-0">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-indigo">{H.eyebrow}</p>
              <h1 id="hero-title" className="mt-4 text-[40px] leading-[1.06] sm:text-[56px] sm:leading-[1.04] font-semibold tracking-tight text-ink">{H.title}</h1>
              <p className="mt-6 text-[17px] sm:text-[19px] leading-relaxed text-slate-600 max-w-xl">{H.body}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
                <CeoCta label={t.CTA} playingLabel={t.UI.playing} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo" />
                <span className="text-[13px] text-slate-500">{H.note}</span>
              </div>
            </div>
            <CaseDemo t={t} />
          </section>
        </div>
        <HowSection t={t} />
        <MemorySection t={t} />
        <PathSection t={t} />
        <PhilosophySection t={t} />
        <FaqSection t={t} />
        <CloseSection t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}
