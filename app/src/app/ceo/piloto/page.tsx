import { redirect } from "next/navigation";
import { EXPERIENCIAS } from "@/lib/ceo/metis2/experiencias";

/** Entrada al piloto del Repositorio Académico: por ahora hay una sola experiencia. */
export default function Page() {
  redirect(`/ceo/piloto/${EXPERIENCIAS[0].slug}`);
}
