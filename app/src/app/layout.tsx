import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "METIS · Alineación estratégica y growth",
  description: "Que toda tu empresa empuje hacia el mismo lado. Plataforma y consultoría de alineación estratégica para empresas en crecimiento.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
