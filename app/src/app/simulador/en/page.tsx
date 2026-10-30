/**
 * MÊTIS CEO landing in English (metis.ceo/en; el middleware reescribe «/en» hacia aquí).
 * Copy en components/site/ceo-landing/content-en.ts (misma forma que el español).
 */
import type { Metadata } from "next";
import { Landing } from "@/components/site/ceo-landing/Landing";
import { LANG_HREF } from "@/components/site/ceo-landing/content";
import { EN } from "@/components/site/ceo-landing/content-en";
import { CEO_URL } from "@/lib/site";

const S = EN.SEO;
const URL_EN = CEO_URL + LANG_HREF.en;
export const metadata: Metadata = {
  title: { absolute: S.title },
  description: S.description,
  alternates: { canonical: URL_EN, languages: { "es-MX": CEO_URL, en: URL_EN } },
  openGraph: { title: S.title, description: S.description, siteName: "MÊTIS CEO", locale: S.locale, type: "website", url: URL_EN, images: [{ url: `${CEO_URL}/brand/ceo-og.jpg`, width: 1200, height: 630, alt: S.ogAlt }] },
  twitter: { card: "summary_large_image", title: S.title, description: S.description, images: [`${CEO_URL}/brand/ceo-og.jpg`] },
};

export default function CeoLandingEn() {
  return <Landing t={EN} />;
}
