import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExperienciaPiloto } from "@/components/ceo/ExperienciaPiloto";
import { equipoServidor } from "@/lib/ceo/equipo-servidor";
import { experienciaBySlug } from "@/lib/ceo/metis2/experiencias";
import { experienciaPublica } from "@/lib/ceo/metis2/experiencias/publica";

export const metadata: Metadata = { title: "Experiencia en revisión", robots: { index: false, follow: false } };
/** Se arma en cada petición: antes de entregar nada, el servidor comprueba que quien pide es del equipo. */
export const dynamic = "force-dynamic";

/**
 * Experiencia del Repositorio Académico. Solo para el equipo mêtis (comprobado en el servidor).
 * Al navegador llega la práctica completa y la comprobación sin claves; califica el servidor.
 * No registra evidencia ni cambia el avance de nadie.
 */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await equipoServidor()).ok) notFound();
  const { slug } = await params;
  const x = experienciaBySlug(slug);
  if (!x) notFound();
  return <ExperienciaPiloto x={experienciaPublica(x)} />;
}
