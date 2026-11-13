import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { Stage, StepTitle } from "@/components/ceo/Stage";
import { ACADEMIES, skillById } from "@/lib/ceo/metis2/academias";
import { EXPERIENCIAS } from "@/lib/ceo/metis2/experiencias";
import { RETOS_DEMO } from "@/lib/ceo/metis2/reto";

export const metadata: Metadata = { title: "Experiencias en revisión", robots: { index: false, follow: false } };

/**
 * Entrada a las experiencias del Repositorio Académico que ya están convertidas.
 * No aparece en el menú: se entra por enlace. Nada de lo que ocurre aquí registra evidencia.
 */
export default function Page() {
  const groups = ACADEMIES.map((a) => ({ a, list: EXPERIENCIAS.filter((x) => x.academy === a.id) })).filter((g) => g.list.length > 0);
  return (
    <Stage steps={[]} at={0} exit="/ceo">
      <div className="space-y-7 pb-10">
        <StepTitle eyebrow="Repositorio Académico · Nivel 1" title="Experiencias en revisión" text={`${EXPERIENCIAS.length} experiencias convertidas. Cada una es un caso corto con documentos, decisiones y una comprobación con otra situación.`} />
        <p className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2.5 text-sm leading-relaxed text-white/75">
          <Info size={15} className="mt-0.5 shrink-0 text-mint" /> No cuentan para tu avance, tu nivel ni tu perfil. El recorrido se guarda solo en este navegador.
        </p>
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-mint">Executive Challenge · demostración</h2>
          <ul className="space-y-2.5">
            {RETOS_DEMO.map((r) => (
              <li key={r.id}>
                <Link href={`/ceo/piloto/reto/${r.slug}`} className="flex items-center gap-3 rounded-2xl border border-mint/30 bg-mint/[.08] px-4 py-3.5 hover:bg-mint/[.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug">{r.title}</span>
                    <span className="mt-0.5 block text-sm text-white/65">Una historia en tres actos con las 24 habilidades del Nivel 1 · {r.editorialId} · sin regla de aprobación</span>
                  </span>
                  <ArrowRight size={17} aria-hidden className="shrink-0 text-white/60" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        {groups.map(({ a, list }) => (
          <section key={a.id} className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-mint">{a.name}</h2>
            <ul className="space-y-2.5">
              {list.map((x) => (
                <li key={x.id}>
                  <Link href={`/ceo/piloto/${x.slug}`} className="flex items-center gap-3 rounded-2xl border border-white/[.12] bg-white/[.06] px-4 py-3.5 hover:bg-white/[.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold leading-snug">{x.title}</span>
                      <span className="mt-0.5 block text-sm text-white/65">{skillById(x.skills.primary)?.name} · {x.minutes[0]} a {x.minutes[1]} minutos · {x.editorialId}</span>
                    </span>
                    <ArrowRight size={17} aria-hidden className="shrink-0 text-white/60" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Stage>
  );
}
