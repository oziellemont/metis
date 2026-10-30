/**
 * Landing de MÊTIS CEO en español (www.metis.ceo; el middleware reescribe «/» hacia aquí).
 * La versión en inglés está en /simulador/en (metis.ceo/en). Copy en components/site/ceo-landing/content.ts.
 */
import type { Metadata } from "next";
import { Landing } from "@/components/site/ceo-landing/Landing";
import { ES, LANG_HREF } from "@/components/site/ceo-landing/content";
import { CEO_URL } from "@/lib/site";

const S = ES.SEO;
export const metadata: Metadata = {
  title: { absolute: S.title },
  description: S.description,
  alternates: { canonical: CEO_URL, languages: { "es-MX": CEO_URL, en: CEO_URL + LANG_HREF.en } },
  openGraph: { title: S.title, description: S.description, siteName: "MÊTIS CEO", locale: S.locale, type: "website", url: CEO_URL, images: [{ url: `${CEO_URL}/brand/ceo-og.jpg`, width: 1200, height: 630, alt: S.ogAlt }] },
  twitter: { card: "summary_large_image", title: S.title, description: S.description, images: [`${CEO_URL}/brand/ceo-og.jpg`] },
};

export default function CeoLanding() {
  return <Landing t={ES} />;
}
