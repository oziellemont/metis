import clsx from "clsx";

/**
 * Logo oficial mêtis (paquete v1, sep-2026). Archivos en /public/brand.
 *
 * variant:
 *  - "default"  → logo horizontal a color, wordmark tinta. Fondos claros.
 *  - "light"    → logo horizontal a color, wordmark blanco. Fondos oscuros neutros (#12142E, navy del hero).
 *  - "mono"     → todo blanco. Sobre fotos o fondos índigo/morado planos.
 *  - "black"    → todo negro. Impresión a una tinta / PDF en blanco y negro.
 *  - "stacked"  → símbolo arriba, wordmark abajo. Espacios cuadrados.
 *  - "icon"     → sólo el símbolo ("El Acento") a color. Avatares, sidebar colapsado.
 *  - "icon-light" / "icon-black" → símbolo blanco / negro.
 *
 * Relación de aspecto: horizontal 672×196 (3.43:1) · apilado 446×372 · ícono 1:1.
 * Regla de marca: mínimo 90 px de ancho en pantalla; no distorsionar ni recolorear.
 */
export type LogoVariant = "default" | "light" | "mono" | "black" | "stacked" | "icon" | "icon-light" | "icon-black";

const SRC: Record<LogoVariant, string> = {
  default: "/brand/logo-horizontal.svg",
  light: "/brand/logo-horizontal-blanco.svg",
  mono: "/brand/logo-horizontal-blanco-mono.svg",
  black: "/brand/logo-horizontal-negro.svg",
  stacked: "/brand/logo-apilado.svg",
  icon: "/brand/icono.svg",
  "icon-light": "/brand/icono-blanco.svg",
  "icon-black": "/brand/icono-negro.svg",
};

const RATIO: Record<LogoVariant, number> = {
  default: 672 / 196, light: 672 / 196, mono: 672 / 196, black: 672 / 196,
  stacked: 446 / 372, icon: 1, "icon-light": 1, "icon-black": 1,
};

export function Logo({
  className,
  variant,
  light = false,
  height = 28,
  priority = false,
}: {
  className?: string;
  variant?: LogoVariant;
  /** Compatibilidad: light=true equivale a variant="light". */
  light?: boolean;
  /** Alto en px; el ancho se calcula con la proporción del archivo. */
  height?: number;
  priority?: boolean;
}) {
  const v: LogoVariant = variant ?? (light ? "light" : "default");
  const w = Math.round(height * RATIO[v]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[v]}
      alt="mêtis"
      width={w}
      height={height}
      className={clsx("inline-block select-none shrink-0", className)}
      style={{ height, width: w }}
      draggable={false}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
