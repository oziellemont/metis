import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RetoPiloto } from "@/components/ceo/RetoPiloto";
import { equipoServidor } from "@/lib/ceo/equipo-servidor";
import { retoBySlug } from "@/lib/ceo/metis2/reto";
import { retoPublico } from "@/lib/ceo/metis2/reto/publica";

export const metadata: Metadata = { title: "Executive Challenge en demostración", robots: { index: false, follow: false } };
/** Se arma en cada petición: antes de entregar nada, el servidor comprueba que quien pide es del equipo. */
export const dynamic = "force-dynamic";

/**
 * Executive Challenge del Repositorio Académico, en demostración. Solo para el equipo mêtis (comprobado en el servidor).
 * Al navegador llega solo la portada; cada escena la entrega el servidor cuando toca. Sin regla de aprobación.
 * No registra evidencia ni da nivel.
 */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await equipoServidor()).ok) notFound();
  const { slug } = await params;
  const r = retoBySlug(slug);
  if (!r) notFound();
  return <RetoPiloto r={retoPublico(r)} />;
}
