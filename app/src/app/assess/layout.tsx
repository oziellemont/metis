import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { assessEnabled } from "@/lib/assess/http";

export const metadata: Metadata = { title: { absolute: "MÊTIS Assess · Piloto" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Assess vive aparte de MÊTIS CEO (sin su proveedor ni su menú). Apagado salvo ASSESS_ENABLED=1. */
export default function AssessLayout({ children }: { children: React.ReactNode }) {
  if (!assessEnabled()) notFound();
  return children;
}
