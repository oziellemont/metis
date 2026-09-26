"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home, ClipboardList, Upload, CalendarClock, CheckSquare, GitBranch, Gauge, FolderKanban, Users, BarChart3,
  BookOpen, MapPin, Ruler, UserCog, Bell, Search, RotateCcw,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/primitives";
import { useMetis } from "@/lib/store";
import { MONTHS } from "@/lib/labels";

const MI_ESPACIO = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/scorecard", label: "Mi Scorecard", icon: ClipboardList },
  { href: "/carga", label: "Carga mensual", icon: Upload, badge: true },
  { href: "/sesiones", label: "Sesiones WTW / WTM", icon: CalendarClock, soon: true },
  { href: "/compromisos", label: "Compromisos", icon: CheckSquare, soon: true },
  { href: "/mapa", label: "Mapa de alineación", icon: GitBranch },
  { href: "/indicadores", label: "Indicadores", icon: Gauge },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/equipo", label: "Mi equipo", icon: Users },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];
const CONFIG = [
  { href: "/config/catalogo", label: "Catálogo de elementos", icon: BookOpen },
  { href: "/config/alcances", label: "Alcances", icon: MapPin },
  { href: "/config/unidades", label: "Unidades de medida", icon: Ruler, soon: true },
  { href: "/config/usuarios", label: "Usuarios y roles", icon: UserCog },
  { href: "/config/notificaciones", label: "Notificaciones", icon: Bell, soon: true },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const s = useMetis();
  const me = s.users.find((u) => u.id === s.currentUserId)!;
  const pendingLoads = s.elementScopes.filter((es) => es.ownerUserId === me.id)
    .filter((es) => !s.results.some((r) => r.elementScopeId === es.id && r.month === s.month && r.value !== null)).length;

  const Item = ({ href, label, icon: Icon, badge, soon }: { href: string; label: string; icon: React.ElementType; badge?: boolean; soon?: boolean }) => {
    const active = path === href || path.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={clsx("flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
          active ? "bg-indigo-soft text-indigo font-medium" : "text-slate-600 hover:bg-slate-100 hover:text-ink")}
      >
        <Icon size={16} className="shrink-0" />
        <span className="truncate">{label}</span>
        {badge && pendingLoads > 0 && <span className="ml-auto chip bg-coral text-white text-[10px] px-1.5">{pendingLoads}</span>}
        {soon && <span className="ml-auto text-[10px] text-slate-400">v1</span>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex">
      <aside className="no-print hidden md:flex w-64 shrink-0 flex-col border-r border-slate-100 bg-white px-4 py-5">
        <Link href="/inicio" className="px-3 mb-6"><Logo className="text-2xl" /></Link>
        <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Mi espacio</div>
        <nav className="space-y-0.5">{MI_ESPACIO.map((i) => <Item key={i.href} {...i} />)}</nav>
        {me.role === "admin" || me.role === "manager" ? (
          <>
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-6 mb-2">Configuración</div>
            <nav className="space-y-0.5">{CONFIG.map((i) => <Item key={i.href} {...i} />)}</nav>
          </>
        ) : null}
        <div className="mt-auto pt-6">
          <div className="rounded-2xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-4 text-white">
            <div className="text-xs font-medium">¿Dudas con tu KPI?</div>
            <div className="text-[11px] text-white/70 mt-1">Agenda 15 min con tu consultor METIS o abre la guía rápida.</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="no-print sticky top-0 z-10 flex items-center gap-3 border-b border-slate-100 bg-white/80 backdrop-blur px-4 md:px-8 py-3">
          <Link href="/inicio" className="md:hidden"><Logo className="text-xl" /></Link>
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-400">
            <Search size={14} /> Buscar KPI, proyecto o colaborador…
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select className="input !w-auto !py-1.5" value={s.month} onChange={(e) => s.setMonth(Number(e.target.value))} aria-label="Mes">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m} {s.year}</option>)}
            </select>
            <span className="hidden sm:inline text-sm font-medium px-2">{s.tenant.name}</span>
            <select className="input !w-auto !py-1.5 hidden sm:block" value={s.currentUserId} onChange={(e) => s.setCurrentUser(e.target.value)} aria-label="Ver como" title="Modo demo · ver como">
              {s.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <Avatar initials={me.initials} />
          </div>
        </header>
        <div className="no-print bg-amber-soft text-amber text-xs px-4 md:px-8 py-1.5 flex items-center gap-3">
          <span><strong>Modo demo</strong> · datos ficticios de Grupo Andes · los cambios se guardan sólo en este navegador.</span>
          <button onClick={s.reset} className="ml-auto inline-flex items-center gap-1 hover:underline"><RotateCcw size={12} /> Reiniciar demo</button>
        </div>
        <main className="flex-1 px-4 md:px-8 py-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
