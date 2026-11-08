/**
 * mêtis CEO · Growth Engine · zonas del mapa de operaciones (piloto: área metropolitana de Monterrey y Saltillo).
 *
 * Coordenadas en un lienzo abstracto de 100 × 64 (no es cartografía): sirven para dibujar un mapa minimalista y
 * ubicar cada sucursal o planta. Saltillo queda en el borde oeste, fuera de escala (unos 85 km).
 */
export interface Zone { id: string; label: string; x: number; y: number; far?: boolean }

export const ZONES: Readonly<Record<string, Zone>> = Object.freeze({
  centro: { id: "centro", label: "Centro", x: 58, y: 36 },
  san_pedro: { id: "san_pedro", label: "San Pedro", x: 44, y: 44 },
  cumbres: { id: "cumbres", label: "Cumbres", x: 41, y: 24 },
  san_nicolas: { id: "san_nicolas", label: "San Nicolás", x: 62, y: 22 },
  guadalupe: { id: "guadalupe", label: "Guadalupe", x: 72, y: 36 },
  apodaca: { id: "apodaca", label: "Apodaca", x: 80, y: 16 },
  escobedo: { id: "escobedo", label: "Escobedo", x: 54, y: 10 },
  santa_catarina: { id: "santa_catarina", label: "Santa Catarina", x: 30, y: 40 },
  saltillo: { id: "saltillo", label: "Saltillo", x: 8, y: 54, far: true },
});

/** Zona de una sede: la declarada, o la que aparece en su nombre (sedes creadas antes de que existieran las zonas). */
export function zoneOf(site: { zone?: string; name: string }): Zone {
  if (site.zone && ZONES[site.zone]) return ZONES[site.zone];
  const n = site.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const hit = Object.values(ZONES).find((z) => n.includes(z.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
  return hit ?? ZONES.centro;
}

/** Contorno estilizado del área metropolitana (trazo único) y la mancha de la sierra, para el fondo del mapa. */
export const METRO_OUTLINE = "M24 30 C 30 14, 46 6, 62 6 C 76 6, 90 8, 94 18 C 98 28, 92 44, 80 50 C 68 56, 50 56, 38 52 C 28 48, 20 42, 24 30 Z";
export const SIERRA = "M26 50 C 34 56, 52 60, 70 58 C 78 57, 86 54, 90 50 L 92 62 L 24 62 Z";
