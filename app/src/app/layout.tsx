import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL as APP_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "mêtis · Alineación estratégica y growth", template: "%s · mêtis" },
  description: "Que toda tu empresa empuje hacia el mismo lado. Plataforma y consultoría de alineación estratégica para empresas en crecimiento: objetivos, KPIs, scorecards y compensación conectados con la estrategia.",
  applicationName: "mêtis",
  keywords: ["alineación estratégica", "KPIs", "scorecard", "compensación variable", "OKR", "growth", "Monterrey"],
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "mêtis",
    title: "mêtis · Alineación estratégica y growth",
    description: "Objetivos, KPIs, scorecards y compensación variable, por fin conectados con la estrategia.",
  },
  twitter: { card: "summary_large_image", title: "mêtis · Alineación estratégica y growth" },
  // favicon.ico, icon.svg, apple-icon.png y opengraph-image.png se detectan solos desde src/app/.
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4F3FE0" },
    { media: "(prefers-color-scheme: dark)", color: "#12142E" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
