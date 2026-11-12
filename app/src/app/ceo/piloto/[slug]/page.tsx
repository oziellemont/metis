import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExperienciaPiloto } from "@/components/ceo/ExperienciaPiloto";
import { experienciaBySlug } from "@/lib/ceo/metis2/experiencias";

export const metadata: Metadata = { title: "Experiencia en revisión", robots: { index: false, follow: false } };

/**
 * Piloto del Repositorio Académico. No aparece en el menú: se entra por enlace.
 * No registra evidencia ni cambia el avance de nadie.
 */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const x = experienciaBySlug(slug);
  if (!x) notFound();
  return <ExperienciaPiloto x={x} />;
}
