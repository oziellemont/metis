import type { Metadata, Viewport } from "next";
import { CeoProvider } from "@/components/ceo/CeoProvider";
import { CeoShell } from "@/components/ceo/CeoShell";
import { CEO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "mêtis CEO · Entrena como CEO", template: "%s · mêtis CEO" },
  description: "Dirige una empresa simulada. Te llegan correos, WhatsApps y reportes de tu equipo durante el día; decides y ves las consecuencias.",
  applicationName: "mêtis CEO",
  openGraph: { title: "mêtis CEO · Entrena como CEO", description: "Tu empresa, tu equipo, tus decisiones. Todos los días.", siteName: "mêtis CEO", locale: "es_MX", type: "website", images: [{ url: `${CEO_URL}/brand/ceo-og.jpg`, width: 1200, height: 630, alt: "MÊTIS CEO. Dirigir se aprende decidiendo." }] },
  twitter: { card: "summary_large_image", images: [`${CEO_URL}/brand/ceo-og.jpg`] },
};
export const viewport: Viewport = { themeColor: "#141735" };

export default function CeoLayout({ children }: { children: React.ReactNode }) {
  return <CeoProvider><CeoShell>{children}</CeoShell></CeoProvider>;
}
