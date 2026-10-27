import type { Metadata } from "next";
import { LegalPage } from "@/components/site/ceo-landing/Legal";
import { TERMS } from "@/components/site/ceo-landing/legal-content";
import { CEO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${TERMS.title} | MÊTIS CEO` },
  description: TERMS.description,
  alternates: { canonical: `${CEO_URL}/terminos` },
};

export default function Page() { return <LegalPage doc={TERMS} />; }
