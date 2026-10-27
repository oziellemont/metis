import type { Metadata } from "next";
import { LegalPage } from "@/components/site/ceo-landing/Legal";
import { PRIVACY } from "@/components/site/ceo-landing/legal-content";
import { CEO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${PRIVACY.title} | MÊTIS CEO` },
  description: PRIVACY.description,
  alternates: { canonical: `${CEO_URL}/privacidad` },
};

export default function Page() { return <LegalPage doc={PRIVACY} />; }
