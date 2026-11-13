import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RetoPiloto } from "@/components/ceo/RetoPiloto";
import { RETOS_DEMO, retoBySlug } from "@/lib/ceo/metis2/reto";

export const metadata: Metadata = { title: "Executive Challenge en demostración", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return RETOS_DEMO.map((r) => ({ slug: r.slug }));
}

/**
 * Executive Challenge del Repositorio Académico, en demostración. No aparece en el menú: se entra por enlace.
 * No registra evidencia, no da nivel y no tiene regla de aprobación habilitada.
 */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = retoBySlug(slug);
  if (!r) notFound();
  return <RetoPiloto r={r} />;
}
