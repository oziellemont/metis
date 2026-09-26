import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "mêtis · Alineación estratégica y growth",
    short_name: "mêtis",
    description: "Que toda tu empresa empuje hacia el mismo lado. Objetivos, KPIs, scorecards y compensación conectados con la estrategia.",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#4F3FE0",
    lang: "es-MX",
    icons: [
      { src: "/brand/app-icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/app-icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/app-icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
