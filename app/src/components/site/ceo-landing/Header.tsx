"use client";
/** Encabezado de la landing de MÊTIS CEO: ligero, fijo al desplazar, con menú compacto en móvil y selector de idioma (ES/EN). */
import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { CeoCta } from "@/components/site/CeoCta";
import { LANG_HREF, LOGIN_HREF, type Copy } from "./content";

export function Header({ t }: { t: Copy }) {
  const other = t.lang === "es" ? "en" : "es";
  const U = t.UI;
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

  // El primer bloque es claro: el encabezado usa texto oscuro siempre; al desplazar gana fondo y borde.
  const bare = !solid && !open;
  const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo";

  return (
    <header className={clsx("fixed inset-x-0 top-0 z-40 motion-safe:transition-colors", bare ? "bg-transparent text-ink" : "bg-white/95 backdrop-blur border-b border-slate-100 text-ink")}>
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 h-16 flex items-center gap-6">
        <Link href={LANG_HREF[t.lang]} aria-label={U.home} className={"flex items-center rounded " + focus}><Logo height={28} priority /></Link>
        <nav aria-label={U.mainNav} className="ml-auto hidden md:flex items-center gap-7 text-[14px]">
          {t.NAV.map((n) => <a key={n.href} href={n.href} className={clsx("rounded", "text-slate-600 hover:text-ink", focus)}>{n.label}</a>)}
          <Link href={LOGIN_HREF} className={clsx("rounded", "text-slate-500 hover:text-ink", focus)}>{U.login}</Link>
        </nav>
        <a href={LANG_HREF[other]} hrefLang={other} lang={other} aria-label={U.switchLabel} title={U.switchLabel} className={clsx("hidden md:inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold tracking-wider ring-1", "text-slate-600 ring-slate-200 hover:text-ink hover:ring-slate-300", focus)}>{U.switchShort}</a>
        <CeoCta label={t.CTA} playingLabel={U.playing} className="ml-auto md:ml-0 !py-2 !px-4 whitespace-nowrap" />
        <button type="button" aria-expanded={open} aria-controls="menu-movil" aria-label={open ? U.closeMenu : U.openMenu} onClick={() => setOpen((v) => !v)} className={"md:hidden -mr-2 h-10 w-10 grid place-items-center rounded-lg " + focus}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav id="menu-movil" aria-label={U.mainNav} className="md:hidden border-t border-slate-100 bg-white px-5 pb-5">
          <ul className="pt-2">
            {t.NAV.map((n) => <li key={n.href}><a href={n.href} onClick={() => setOpen(false)} className={"block py-3 text-[15px] text-ink rounded " + focus}>{n.label}</a></li>)}
            <li><Link href={LOGIN_HREF} className={"block py-3 text-[15px] text-slate-500 rounded " + focus}>{U.login}</Link></li>
            <li><a href={LANG_HREF[other]} hrefLang={other} lang={other} className={"block py-3 text-[15px] text-slate-500 rounded " + focus}>{U.switchLabel}</a></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
