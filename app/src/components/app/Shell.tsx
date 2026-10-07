"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home, ClipboardList, Upload, CalendarClock, CheckSquare, GitBranch, Gauge, FolderKanban, Users, BarChart3,
  BookOpen, MapPin, Ruler, UserCog, Bell, Search, RotateCcw, Target, Building2, AlertTriangle, X, Loader2, Shield,
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
  { href: "/config/estrategia", label: "Estrategia (objetivos y LAE)", icon: Target },
  { href: "/config/catalogo", label: "Catálogo de elementos", icon: BookOpen },
  { href: "/config/alcances", label: "Alcances", icon: MapPin },
  { href: "/config/unidades", label: "Unidades de medida", icon: Ruler },
  { href: "/config/usuarios", label: "Usuarios y roles", icon: UserCog },
  { href: "/config/notificaciones", label: "Notificaciones", icon: Bell },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const s = useMetis();
  const me = s.userOf(s.currentUserId);
  const real = s.mode === "supabase";
  const pendingLoads = s.elementScopes.filter((es) => es.ownerUserId === me.id)
    .filter((es) => !s.results.some((r) => r.elementScopeId === es.id && r.month === s.month && r.year === s.year && r.value !== null)).length;

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
        <Link href="/inicio" className="px-3 mb-4 flex items-center" aria-label="Ir a inicio"><Logo height={30} priority /></Link>
        <TenantBadge />
        <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Mi espacio</div>
        <nav className="space-y-0.5">{MI_ESPACIO.map((i) => <Item key={i.href} {...i} />)}</nav>
        {me.role === "admin" || me.role === "manager" ? (
          <>
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-6 mb-2">Configuración</div>
            <nav className="space-y-0.5">{CONFIG.map((i) => <Item key={i.href} {...i} />)}</nav>
          </>
        ) : null}
        {s.isPlatformAdmin && (
          <>
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-6 mb-2">METIS</div>
            <nav className="space-y-0.5"><Item href="/consola" label="Consola de clientes" icon={Shield} /></nav>
          </>
        )}
        <div className="mt-auto pt-6">
          <div className="rounded-2xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-4 text-white">
            <div className="text-xs font-medium">¿Dudas con tu KPI?</div>
            <div className="text-[11px] text-white/70 mt-1">Agenda 15 min con tu consultor METIS o abre la guía rápida.</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="no-print sticky top-0 z-10 flex items-center gap-3 border-b border-slate-100 bg-white/80 backdrop-blur px-4 md:px-8 py-3">
          <Link href="/inicio" className="md:hidden flex items-center" aria-label="Ir a inicio"><Logo variant="icon" height={28} /></Link>
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-400">
            <Search size={14} /> Buscar KPI, proyecto o colaborador…
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select className="input !w-auto !py-1.5" value={s.month} onChange={(e) => s.setMonth(Number(e.target.value))} aria-label="Mes">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m} {s.year}</option>)}
            </select>
            {s.saving && <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" /> Guardando…</span>}
            {s.tenants.length > 1 ? (
              <select className="input !w-auto !py-1.5 hidden sm:block font-medium" value={s.tenant.id} onChange={(e) => s.switchTenant(e.target.value)} aria-label="Empresa" title="Cambiar de empresa">
                {s.tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            ) : (
              <span className="hidden sm:inline text-sm font-medium px-2">{s.tenant.name}</span>
            )}
            {!real && (
              <select className="input !w-auto !py-1.5 hidden sm:block" value={s.currentUserId} onChange={(e) => s.setCurrentUser(e.target.value)} aria-label="Ver como" title="Modo demo · ver como">
                {s.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}
            <span title={`${me.name}${me.email ? ` · ${me.email}` : ""}`}><Avatar initials={me.initials} /></span>
          </div>
        </header>
        {!real && (
          <div className="no-print bg-amber-soft text-amber text-xs px-4 md:px-8 py-1.5 flex items-center gap-3">
            <span><strong>Modo demo</strong> · datos ficticios de Grupo Andes · los cambios se guardan sólo en este navegador.</span>
            <button onClick={s.reset} className="ml-auto inline-flex items-center gap-1 hover:underline"><RotateCcw size={12} /> Reiniciar demo</button>
          </div>
        )}
        {s.syncError && (
          <div role="alert" className="no-print bg-coral/10 text-coral text-xs px-4 md:px-8 py-2 flex items-center gap-3">
            <AlertTriangle size={14} className="shrink-0" /><span>{s.syncError}</span>
            <button onClick={s.clearSyncError} className="ml-auto p-0.5 hover:opacity-70" aria-label="Cerrar"><X size={14} /></button>
          </div>
        )}
        <main className="flex-1 px-4 md:px-8 py-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

/** Identidad del portal: nombre (y logo/color si los tiene) de la empresa activa. */
function TenantBadge() {
  const s = useMetis();
  const color = s.tenant.brandColor || "#4F3FE0";
  return (
    <div className="mx-1 mb-5 flex items-center gap-2.5 rounded-xl border border-slate-100 px-2.5 py-2">
      {s.tenant.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.tenant.logoUrl} alt="" className="h-7 w-7 rounded-lg object-contain" />
      ) : (
        <span className="h-7 w-7 rounded-lg grid place-items-center text-white" style={{ background: color }}><Building2 size={14} /></span>
      )}
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{s.tenant.name}</div>
        <div className="text-[10px] text-slate-400">{s.mode === "supabase" ? "Portal de la empresa" : "Demo"}</div>
      </div>
    </div>
  );
}
