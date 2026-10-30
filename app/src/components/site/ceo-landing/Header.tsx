"use client";
/** Encabezado de la landing de MÊTIS CEO: ligero, fijo al desplazar y con menú compacto en móvil. */
import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { CeoCta } from "@/components/site/CeoCta";
import { CTA, LOGIN_HREF, NAV } from "./content";

export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  const dark = !solid && !open;
  const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " + (dark ? "focus-visible:outline-white" : "focus-visible:outline-indigo");

  return (
    <header className={clsx("fixed inset-x-0 top-0 z-40 motion-safe:transition-colors", dark ? "bg-transparent text-white" : "bg-white/95 backdrop-blur border-b border-slate-100 text-ink")}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 h-16 flex items-center gap-6">
        <Link href="/" aria-label="MÊTIS CEO, inicio" className={"flex items-center rounded " + focus}><Logo variant={dark ? "light" : "default"} height={28} priority /></Link>
        <nav aria-label="Principal" className="ml-auto hidden md:flex items-center gap-7 text-[14px]">
          {NAV.map((n) => <a key={n.href} href={n.href} className={clsx("rounded", dark ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-ink", focus)}>{n.label}</a>)}
          <Link href={LOGIN_HREF} className={clsx("rounded", dark ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-ink", focus)}>Iniciar sesión</Link>
        </nav>
        <CeoCta label={CTA} className="ml-auto md:ml-0 !py-2 !px-4" />
        <button type="button" aria-expanded={open} aria-controls="menu-movil" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen((v) => !v)} className={"md:hidden -mr-2 h-10 w-10 grid place-items-center rounded-lg " + focus}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav id="menu-movil" aria-label="Principal" className="md:hidden border-t border-slate-100 bg-white px-5 pb-5">
          <ul className="pt-2">
            {NAV.map((n) => <li key={n.href}><a href={n.href} onClick={() => setOpen(false)} className={"block py-3 text-[15px] text-ink rounded " + focus}>{n.label}</a></li>)}
            <li><Link href={LOGIN_HREF} className={"block py-3 text-[15px] text-slate-500 rounded " + focus}>Iniciar sesión</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
