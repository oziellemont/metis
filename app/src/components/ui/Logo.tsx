import clsx from "clsx";

/** Wordmark "mêtis" · sustituto tipográfico del SVG oficial hasta integrar metis-wordmark-dark.svg */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span
      className={clsx("font-semibold tracking-tight select-none", light ? "text-white" : "text-[#111414]", className)}
      style={{ letterSpacing: "-0.02em" }}
      aria-label="mêtis"
    >
      mêtis
    </span>
  );
}
