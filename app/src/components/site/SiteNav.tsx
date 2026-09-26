import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function SiteNav({ dark = false }: { dark?: boolean }) {
  return (
    <header className={"no-print " + (dark ? "text-white" : "text-ink")}>
      <div className="mx-auto max-w-6xl px-6 py-5 flex items-center gap-6">
        <Link href="/" aria-label="mêtis · inicio" className="flex items-center"><Logo variant={dark ? "light" : "default"} height={30} priority /></Link>
        <nav className={"ml-auto hidden sm:flex items-center gap-6 text-sm " + (dark ? "text-white/80" : "text-slate-600")}>
          <Link href="/#plataforma" className="hover:opacity-80">Plataforma</Link>
          <Link href="/#consultoria" className="hover:opacity-80">Consultoría</Link>
          <Link href="/#precios" className="hover:opacity-80">Precios</Link>
          <Link href="/inicio" className="hover:opacity-80">Demo</Link>
          <Link href="/login" className="hover:opacity-80 font-medium">Entrar</Link>
        </nav>
        <Link href="/indice" className={"btn " + (dark ? "bg-white text-ink hover:bg-white/90" : "bg-indigo text-white hover:bg-indigo-light")}>Mide tu alineación</Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-slate-100 mt-20">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-slate-500">
        <Logo height={24} />
        <span>Estrategia · Alineación · Crecimiento</span>
        <span className="sm:ml-auto">hola@metis.mx · Monterrey, N.L., México</span>
        <span>© 2026 METIS</span>
      </div>
    </footer>
  );
}
