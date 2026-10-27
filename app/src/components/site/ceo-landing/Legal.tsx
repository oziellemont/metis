/**
 * Páginas legales de MÊTIS CEO (metis.ceo/privacidad y metis.ceo/terminos).
 * Texto en legal-content.ts. Requiere revisión de un abogado antes de activar cobros.
 */
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { CEO_CONTACT_EMAIL } from "@/lib/site";
import { LEGAL_UPDATED, type LegalDoc } from "./legal-content";

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="MÊTIS CEO, inicio" className="flex items-center rounded"><Logo height={26} /></Link>
          <nav aria-label="Documentos legales" className="flex gap-4 text-sm text-slate-600">
            <Link href="/legal/privacidad" className="hover:text-ink">Privacidad</Link>
            <Link href="/legal/terminos" className="hover:text-ink">Términos</Link>
          </nav>
        </div>
      </header>
      <main id="contenido" className="mx-auto max-w-3xl px-5 sm:px-6 py-12 sm:py-16">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-indigo">MÊTIS CEO</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-ink">{doc.title}</h1>
        <p className="mt-3 text-sm text-slate-500">Última actualización: {LEGAL_UPDATED}</p>
        <p className="mt-6 text-[16px] leading-relaxed text-slate-700">{doc.intro}</p>
        <div className="mt-10 space-y-9">
          {doc.sections.map((s, i) => (
            <section key={s.title} aria-labelledby={`s${i}`}>
              <h2 id={`s${i}`} className="text-lg font-semibold text-ink">{i + 1}. {s.title}</h2>
              {s.body.map((p) => <p key={p} className="mt-3 text-[15px] leading-relaxed text-slate-700">{p}</p>)}
              {s.items && (
                <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-slate-700 list-disc pl-5">
                  {s.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
        <p className="mt-12 rounded-2xl bg-canvas p-5 text-[15px] text-slate-700">
          Dudas o solicitudes: <a href={`mailto:${CEO_CONTACT_EMAIL}`} className="font-semibold text-indigo hover:underline">{CEO_CONTACT_EMAIL}</a>
        </p>
      </main>
      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-8 text-sm text-slate-500 flex flex-wrap justify-between gap-3">
          <span>© 2026 mêtis · Monterrey, N.L., México</span>
          <Link href="/" className="hover:text-ink">Volver a MÊTIS CEO</Link>
        </div>
      </footer>
    </div>
  );
}
