import type { Metadata, Viewport } from "next";
import { CeoProvider } from "@/components/ceo/CeoProvider";
import { CeoShell } from "@/components/ceo/CeoShell";

export const metadata: Metadata = {
  title: { absolute: "mêtis CEO · Entrena como CEO", template: "%s · mêtis CEO" },
  description: "Dirige una empresa simulada. Te llegan correos, WhatsApps y reportes de tu equipo durante el día; decides y ves las consecuencias.",
  applicationName: "mêtis CEO",
  openGraph: { title: "mêtis CEO · Entrena como CEO", description: "Tu empresa, tu equipo, tus decisiones. Todos los días.", siteName: "mêtis CEO", locale: "es_MX", type: "website" },
};
export const viewport: Viewport = { themeColor: "#141735" };

export default function CeoLayout({ children }: { children: React.ReactNode }) {
  return <CeoProvider><CeoShell>{children}</CeoShell></CeoProvider>;
}
