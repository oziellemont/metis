"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import clsx from "clsx";
import { Home, GraduationCap, Settings, X, Building2, Network, Route, ChartColumn, UserRound } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { menuFor, type MenuIcon } from "@/lib/ceo/metis2/menu";
import { useCeo } from "./CeoProvider";
import { Flame } from "./ui";
import { ImportPrompt } from "./ImportPrompt";
import { RestScreen, ReturnScreen } from "./Cadence";
import { CeoGuide } from "./CeoGuide";

// MÊTIS 2.0 (Directiva v1.1): el menú es Hoy, Academy, Mi progreso y Mi perfil (lib/ceo/metis2/menu.ts), sin contador.
// La página de pendientes (/ceo/bandeja) sigue abriendo por su dirección y desde el Hoy del simulador.
// Empresa y Carrera salieron del menú; vuelven solo con «Mostrar el simulador de empresas» en Ajustes.
// «Personas» (/ceo/personas) y «Ranking» (/ceo/ranking) siguen ocultas: sus páginas existen, pero no están en el menú.
const NAV_ICON: Record<MenuIcon, typeof Home> = { hoy: Home, academy: GraduationCap, progreso: ChartColumn, perfil: UserRound, empresa: Network, carrera: Route };

export function CeoShell({ children }: { children: React.ReactNode }) {
  const c = useCeo();
  const path = usePathname();
  const router = useRouter();
  const onboarding = path === "/ceo/empezar";
  // Piloto del Repositorio Académico (/ceo/piloto): no está en el menú, se entra por enlace y no usa la partida.
  const pilot = path === "/ceo/piloto" || path.startsWith("/ceo/piloto/");

  useEffect(() => {
    if (c.ready && !c.s.startedAt && !onboarding && !pilot && !c.importFlow) router.replace("/ceo/empezar");
  }, [c.ready, c.s.startedAt, onboarding, pilot, router, c.importFlow]);

  // Antes que nada: si hay una carrera del navegador por decidir, se pregunta (adenda v3.2 §3).
  if (c.ready && c.importFlow) return <ImportPrompt flow={c.importFlow} />;
  if (onboarding || pilot) return <>{children}</>;
  // Flujo de experiencia para usuarios actuales: pantalla completa, sin menú.
  if (path === "/ceo/experiencia" && c.ready && c.s.startedAt) return <>{children}</>;
  if (!c.ready || !c.s.startedAt) return <div className="min-h-screen grid place-items-center bg-canvas"><span className="h-8 w-8 rounded-full border-2 border-indigo border-t-transparent animate-spin" /></div>;

  // 1.2: de vacaciones se ve la pantalla de descanso (salvo Ajustes); al volver de una ausencia larga, la bienvenida.
  if (c.cadence === "vacation_paused" && path !== "/ceo/ajustes") return <RestScreen />;
  if (c.returnDue) return <ReturnScreen />;
  // Pantallas de decisión (caso del día, casos ejecutivos y lecciones de Academy): pantalla completa con fondo mêtis, sin menú.
  if (path.startsWith("/ceo/caso/") || path.startsWith("/ceo/episodio/") || path.startsWith("/ceo/academy/")) return <>{children}</>;

  const active = (h: string) => (h === "/ceo" ? path === "/ceo" : path.startsWith(h));
  // Hoy es el centro de mando: ocupa todo el ancho con el fondo mêtis y trae su propio encabezado.
  const home = path === "/ceo";
  const sim = c.s.settings.simulador === true;
  const nav = menuFor(sim);
  // Mismo lenguaje que las pantallas de decisión y el alta: translúcido en reposo, más claro al pasar; el activo, índigo con halo.
  const railCls = (on: boolean) => clsx("group relative h-11 w-11 rounded-xl grid place-items-center transition-all", on ? "bg-indigo text-white shadow-[0_0_0_4px_rgba(109,93,246,.35)]" : "text-white/60 hover:bg-white/10 hover:text-white");

  return (
    <div className={clsx("min-h-screen", home ? "bg-gradient-to-br from-[#0F1130] via-[#1A1650] to-[#2B1F8A]" : "bg-canvas")}>
      {/* escritorio: riel de íconos */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[76px] flex-col items-center bg-[#0F1130] border-r border-white/[.06] py-5">
        <Link href="/ceo" aria-label="mêtis, inicio" className="h-11 w-11 grid place-items-center rounded-xl transition-colors hover:bg-white/10"><Logo variant="icon" height={26} /></Link>
        <nav className="mt-7 flex flex-col items-center gap-2" aria-label="Menú">
          {nav.map(({ href, label, icon }) => { const Icon = NAV_ICON[icon]; return (
            <Link key={href} href={href} aria-label={label} aria-current={active(href) ? "page" : undefined} className={railCls(active(href))}>
              <Icon size={20} strokeWidth={active(href) ? 2.2 : 1.9} />
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-ink opacity-0 -translate-x-1 shadow-lg transition-all group-hover:opacity-100 group-hover:translate-x-0">{label}</span>
            </Link>
          ); })}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-3">
          <span className="h-px w-8 bg-white/15" />
          <Link href="/ceo/ajustes" aria-label="Ajustes" className={railCls(active("/ceo/ajustes"))}>
            <Settings size={20} strokeWidth={1.9} />
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-ink opacity-0 -translate-x-1 shadow-lg transition-all group-hover:opacity-100 group-hover:translate-x-0">Ajustes</span>
          </Link>
        </div>
      </aside>

      {/* móvil: barra superior */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#0F1130]/95 backdrop-blur border-b border-white/[.06] px-4 h-14 flex items-center justify-between text-white">
        <Link href="/ceo" aria-label="mêtis, inicio" className="flex items-center"><Logo variant="light" height={24} /></Link>
        <div className="flex items-center gap-3 text-sm">
          <span className={clsx("inline-flex items-center gap-1 font-semibold tabular-nums", c.streak.atRisk && "text-amber")}><Flame on={c.streak.days > 0 && c.streak.doneToday} size={17} /> {c.streak.days}</span>
          <span className="inline-flex items-center gap-1 font-semibold tabular-nums">{c.xp} <span className="text-[10px] text-white/50">XP</span></span>
          <Link href="/ceo/ajustes" aria-label="Ajustes" className="h-8 w-8 grid place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"><Settings size={18} /></Link>
        </div>
      </header>

      <main className={clsx("lg:pl-[76px] pb-24 lg:pb-0", !home && "lg:pb-10")}>
        {home ? children : (
          <div className={clsx("mx-auto px-4 sm:px-6 py-5 sm:py-8", path.startsWith("/ceo/empresa") ? "max-w-6xl" : "max-w-5xl")}>
            {/* escritorio: la empresa del caso a la izquierda (con el día si el simulador está a la vista); racha y XP a la derecha */}
            <div className="hidden lg:flex items-center justify-between gap-4 mb-6 text-sm">
              {sim
                ? <div className="flex items-center gap-1.5 min-w-0 font-semibold text-ink"><Building2 size={14} className="shrink-0 text-indigo" /><span className="truncate">{c.pack.name}</span><span className="font-normal text-slate-400">· Día {c.day}</span></div>
                : <div className="min-w-0 truncate text-slate-500">Tus casos ocurren en <span className="font-medium text-ink">{c.pack.name}</span></div>}
              <div className="flex items-center gap-4 shrink-0">
                <span className={clsx("inline-flex items-center gap-1.5", c.streak.atRisk ? "text-amber" : "text-ink")}><Flame on={c.streak.days > 0 && c.streak.doneToday} size={16} /> <b className="tabular-nums">{c.streak.days}</b> <span className="text-slate-500">{c.streak.days === 1 ? "día" : "días"} de racha</span></span>
                <span className="h-4 w-px bg-slate-200" />
                <span className="font-semibold tabular-nums text-ink">{c.xp} <span className="text-slate-500 font-normal">XP</span></span>
              </div>
            </div>
            {children}
          </div>
        )}
      </main>

      {/* móvil: barra inferior */}
      <nav aria-label="Menú" className={clsx("lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0F1130] border-t border-white/[.06] grid pb-[env(safe-area-inset-bottom)]", sim ? "grid-cols-6" : "grid-cols-4")}>
        {nav.map(({ href, label, short, icon }) => { const Icon = NAV_ICON[icon]; return (
          <Link key={href} href={href} aria-label={label} aria-current={active(href) ? "page" : undefined} className={clsx("relative flex min-w-0 flex-col items-center gap-0.5 py-2 font-medium transition-colors", sim ? "text-[10px] max-[359px]:text-[9px] tracking-tight" : "text-[11px]", active(href) ? "text-white" : "text-white/50 hover:text-white")}>
            <span className={clsx("h-7 rounded-full grid place-items-center transition-colors", sim ? "w-9" : "w-11", active(href) ? "bg-indigo" : "")}><Icon size={19} strokeWidth={active(href) ? 2.3 : 1.9} /></span> <span className={clsx("max-w-full truncate", !sim && "px-0.5")}>{sim ? short ?? label : label}</span>
          </Link>
        ); })}
      </nav>

      {/* Guía de la pantalla: botón fijo abajo a la derecha */}
      <CeoGuide />

      {/* aviso de mensaje nuevo */}
      {c.toast && !path.includes(c.toast.id) && (
        <div className="fixed z-40 top-16 lg:top-5 right-3 left-3 sm:left-auto sm:w-96 help-in">
          <div className="card p-3.5 flex gap-3 items-start shadow-[0_20px_50px_-20px_rgba(23,26,58,.45)]">
            <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-coral shrink-0 animate-pulse" />
            <Link href={c.toast.href} onClick={c.dismissToast} className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink truncate">{c.toast.title}</div>
              <div className="text-xs text-slate-500 line-clamp-2">{c.toast.text}</div>
            </Link>
            <button onClick={c.dismissToast} aria-label="Cerrar" className="text-slate-300 hover:text-ink"><X size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
