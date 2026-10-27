"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import clsx from "clsx";
import { Home, Inbox, GraduationCap, Trophy, UserRound, Settings, X, Building2, Network, Route } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useCeo } from "./CeoProvider";
import { Flame } from "./ui";
import { JourneyMini } from "./Journey";

const NAV = [
  { href: "/ceo", label: "Hoy", Icon: Home },
  { href: "/ceo/bandeja", label: "Bandeja", Icon: Inbox, badge: true },
  { href: "/ceo/empresa", label: "Empresa", Icon: Network },
  // «Personas» (/ceo/personas) se ocultó del menú: el dilema del día ya llega en Hoy y ahí se guarda.
  // La página y su contenido siguen existiendo; para volver a mostrarla basta con regresar esta línea.
  { href: "/ceo/carrera", label: "Carrera", Icon: Route },
  { href: "/ceo/academy", label: "Academy", Icon: GraduationCap },
  { href: "/ceo/ranking", label: "Ranking", Icon: Trophy, desktop: true },
  { href: "/ceo/perfil", label: "Perfil", Icon: UserRound },
];

export function CeoShell({ children }: { children: React.ReactNode }) {
  const c = useCeo();
  const path = usePathname();
  const router = useRouter();
  const onboarding = path === "/ceo/empezar";

  useEffect(() => {
    if (c.ready && !c.s.startedAt && !onboarding) router.replace("/ceo/empezar");
  }, [c.ready, c.s.startedAt, onboarding, router]);

  if (onboarding) return <>{children}</>;
  // Flujo de experiencia para usuarios actuales: pantalla completa, sin menú.
  if (path === "/ceo/experiencia" && c.ready && c.s.startedAt) return <>{children}</>;
  if (!c.ready || !c.s.startedAt) return <div className="min-h-screen grid place-items-center bg-canvas"><span className="h-8 w-8 rounded-full border-2 border-indigo border-t-transparent animate-spin" /></div>;

  const active = (h: string) => (h === "/ceo" ? path === "/ceo" : path.startsWith(h));
  const n = c.pending.length;

  return (
    <div className="min-h-screen bg-canvas">
      {/* escritorio */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-white border-r border-slate-100 px-4 py-5">
        <Link href="/ceo" className="flex items-center gap-2 px-2"><Logo height={26} /><span className="chip bg-ink text-white text-[10px] tracking-wider">CEO</span></Link>
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#141735] to-[#2B1F8A] p-4 text-white">
          <div className="flex items-center justify-between text-xs text-white/60"><span className="inline-flex items-center gap-1 min-w-0"><Building2 size={12} className="shrink-0" /> <span className="truncate">{c.pack.name}</span></span><span>Día {c.day}</span></div>
          <div className="mt-2 text-sm font-semibold truncate">{c.s.name || "CEO"}</div>
          <div className="mt-3"><JourneyMini j={c.journey} /></div>
        </div>
        <nav className="mt-5 space-y-1">
          {NAV.map(({ href, label, Icon, badge }) => (
            <Link key={href} href={href} className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", active(href) ? "bg-indigo-soft text-indigo" : "text-slate-500 hover:bg-slate-50 hover:text-ink")}>
              <Icon size={18} /> <span className="flex-1">{label}</span>
              {badge && n > 0 && <span className="h-5 min-w-5 px-1.5 rounded-full bg-coral text-white text-[11px] font-semibold grid place-items-center">{n}</span>}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1">
          <div className={clsx("flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm", c.streak.atRisk ? "bg-amber-soft text-amber" : "text-ink")}>
            <Flame on={c.streak.days > 0 && c.streak.doneToday} /> <b className="tabular-nums">{c.streak.days}</b> <span className="text-slate-500">{c.streak.days === 1 ? "día" : "días"} de racha</span>
          </div>
          <Link href="/ceo/ajustes" className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", active("/ceo/ajustes") ? "bg-indigo-soft text-indigo" : "text-slate-500 hover:bg-slate-50")}><Settings size={18} /> Ajustes</Link>
        </div>
      </aside>

      {/* móvil: barra superior */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100 px-4 h-14 flex items-center justify-between">
        <Link href="/ceo" className="flex items-center gap-1.5"><Logo variant="icon" height={26} /><span className="chip bg-ink text-white text-[10px] tracking-wider">CEO</span></Link>
        <div className="flex items-center gap-3 text-sm">
          <span className={clsx("inline-flex items-center gap-1 font-semibold tabular-nums", c.streak.atRisk && "text-amber")}><Flame on={c.streak.days > 0 && c.streak.doneToday} size={17} /> {c.streak.days}</span>
          <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-indigo">{c.xp} <span className="text-[10px] text-slate-400">XP</span></span>
          <Link href="/ceo/ranking" aria-label="Ranking" className="text-slate-400"><Trophy size={18} /></Link>
          <Link href="/ceo/ajustes" aria-label="Ajustes" className="text-slate-400"><Settings size={18} /></Link>
        </div>
      </header>

      <main className="lg:pl-60 pb-24 lg:pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">{children}</div>
      </main>

      {/* móvil: barra inferior */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-100 grid grid-cols-6 pb-[env(safe-area-inset-bottom)]">
        {NAV.filter((x) => !x.desktop).map(({ href, label, Icon, badge }) => (
          <Link key={href} href={href} className={clsx("relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium", active(href) ? "text-indigo" : "text-slate-400")}>
            <Icon size={21} strokeWidth={active(href) ? 2.4 : 2} /> {label}
            {badge && n > 0 && <span className="absolute top-1 left-1/2 ml-2 h-4 min-w-4 px-1 rounded-full bg-coral text-white text-[10px] font-semibold grid place-items-center">{n}</span>}
          </Link>
        ))}
      </nav>

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
