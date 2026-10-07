"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Search, Gauge, FolderKanban, User as UserIcon, Target, Flag, CornerDownLeft, ArrowRight } from "lucide-react";
import { useMetis } from "@/lib/store";
import { matchScore, norm } from "@/lib/search";

export type NavPage = { href: string; label: string; soon?: boolean };

type Hit = {
  id: string;
  group: "Indicadores" | "Proyectos" | "Colaboradores" | "Estrategia" | "Páginas";
  title: string;
  sub?: string;
  href: string;
  /** id del elemento a resaltar en la página destino */
  focus?: string;
  icon: React.ElementType;
  color?: string;
  score: number;
};

const GROUP_ORDER: Hit["group"][] = ["Páginas", "Indicadores", "Proyectos", "Colaboradores", "Estrategia"];
const MAX_PER_GROUP = 5;

export function GlobalSearch({ pages }: { pages: NavPage[] }) {
  const s = useMetis();
  const router = useRouter();
  const path = usePathname();
  const me = s.userOf(s.currentUserId);
  const canConfig = me.role === "admin" || me.role === "manager";

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K y "/" abren el buscador
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.closest("input, textarea, select, [contenteditable=true]") !== null);
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault(); inputRef.current?.focus(); inputRef.current?.select(); setOpen(true);
      } else if (e.key === "/" && !typing) {
        e.preventDefault(); inputRef.current?.focus(); setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // clic fuera cierra
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // al cambiar de página, se limpia
  useEffect(() => { setOpen(false); setQ(""); }, [path]);

  const hits = useMemo<Hit[]>(() => {
    if (!norm(q)) return [];
    const out: Hit[] = [];

    for (const p of pages) {
      if (p.soon) continue;
      const sc = matchScore(q, p.label);
      if (sc) out.push({ id: "p" + p.href, group: "Páginas", title: p.label, href: p.href, icon: ArrowRight, score: sc });
    }

    // KPIs y proyectos: uno por elemento, con sus alcances como subtítulo
    for (const el of s.elements) {
      const ess = s.elementScopes.filter((x) => x.elementId === el.id);
      const scopes = ess.map((x) => s.scopes.find((sc) => sc.id === x.scopeId)?.name).filter(Boolean) as string[];
      const owners = ess.map((x) => s.users.find((u) => u.id === x.ownerUserId)?.name).filter(Boolean) as string[];
      const lae = s.laes.find((l) => l.id === el.laeId);
      const sc = matchScore(q, el.name, el.formula, lae?.name, scopes.join(" "), owners.join(" "));
      if (!sc) continue;
      const kpi = el.type === "kpi";
      const sub = [lae?.name, scopes.length ? scopes.slice(0, 3).join(", ") + (scopes.length > 3 ? ` +${scopes.length - 3}` : "") : "Sin alcance asignado"].filter(Boolean).join(" · ");
      out.push({
        id: "e" + el.id, group: kpi ? "Indicadores" : "Proyectos", title: el.name, sub,
        href: ess.length ? (kpi ? "/indicadores" : "/proyectos") : (canConfig ? "/config/catalogo" : kpi ? "/indicadores" : "/proyectos"),
        focus: ess.length ? `es-${ess[0].id}` : undefined,
        icon: kpi ? Gauge : FolderKanban, color: lae?.color, score: sc,
      });
    }

    // Colaboradores: los admins/jefes ven a todos; un colaborador sólo se encuentra a sí mismo y a su equipo
    for (const u of s.users) {
      const visible = canConfig || u.id === me.id || u.managerId === me.id;
      if (!visible) continue;
      const sc = matchScore(q, u.name, u.title, u.email, u.teamName);
      if (!sc) continue;
      out.push({
        id: "u" + u.id, group: "Colaboradores", title: u.name + (u.id === me.id ? " (tú)" : ""),
        sub: [u.title, u.email].filter(Boolean).join(" · "),
        href: u.id === me.id ? "/scorecard" : `/equipo/${u.id}`, icon: UserIcon, score: sc,
      });
    }

    // Objetivos y LAE
    for (const o of s.objectives) {
      const sc = matchScore(q, o.name, o.description);
      if (sc) out.push({ id: "o" + o.id, group: "Estrategia", title: o.name, sub: "Objetivo estratégico" + (o.horizon ? ` · ${o.horizon}` : ""), href: canConfig ? "/config/estrategia" : "/mapa", focus: canConfig ? `obj-${o.id}` : undefined, icon: Target, score: sc });
    }
    for (const l of s.laes) {
      const sc = matchScore(q, l.name);
      if (!sc) continue;
      const obj = s.objectives.find((o) => o.id === l.objectiveId);
      out.push({ id: "l" + l.id, group: "Estrategia", title: l.name, sub: "Línea de acción" + (obj ? ` · ${obj.name}` : ""), href: canConfig ? "/config/estrategia" : "/mapa", focus: canConfig ? `lae-${l.id}` : undefined, icon: Flag, color: l.color ?? undefined, score: sc });
    }

    // los grupos con la mejor coincidencia van primero (p. ej. "ana" → la persona antes que sus KPIs)
    const best = (g: Hit["group"]) => Math.max(0, ...out.filter((h) => h.group === g).map((h) => h.score));
    const order = [...GROUP_ORDER].sort((a, b) => best(b) - best(a) || GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b));
    const grouped: Hit[] = [];
    for (const g of order) {
      grouped.push(...out.filter((h) => h.group === g).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "es")).slice(0, MAX_PER_GROUP));
    }
    return grouped;
  }, [q, pages, s.elements, s.elementScopes, s.scopes, s.users, s.laes, s.objectives, canConfig, me.id]);

  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (h: Hit) => {
    setOpen(false); setQ(""); inputRef.current?.blur();
    const url = h.focus ? `${h.href}#${h.focus}` : h.href;
    if (h.href === path && h.focus) {
      window.history.replaceState(null, "", url);
      window.dispatchEvent(new Event("metis:focus"));
    } else {
      router.push(url);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, Math.max(hits.length - 1, 0))); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { const h = hits[active]; if (h) { e.preventDefault(); go(h); } }
    else if (e.key === "Escape") { e.preventDefault(); if (q) setQ(""); else { setOpen(false); inputRef.current?.blur(); } }
  };

  const showPanel = open && norm(q).length > 0;
  const [isMac, setIsMac] = useState(false);
  useEffect(() => { setIsMac(/Mac|iPhone|iPad/.test(navigator.platform)); }, []);

  let idx = -1;
  return (
    <div ref={boxRef} className="relative hidden md:block flex-1 max-w-md">
      <label className={clsx("flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
        open ? "bg-white ring-2 ring-indigo/30 shadow-sm" : "bg-slate-100 hover:bg-slate-200/70")}>
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar KPI, proyecto o colaborador…"
          className="flex-1 min-w-0 bg-transparent outline-none text-ink placeholder:text-slate-400"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="metis-search-results"
          aria-autocomplete="list"
          aria-label="Buscar"
          autoComplete="off"
          spellCheck={false}
        />
        {!open && <kbd className="hidden lg:inline text-[10px] font-medium text-slate-400 border border-slate-200 rounded-md px-1.5 py-0.5 bg-white">{isMac ? "⌘K" : "Ctrl K"}</kbd>}
      </label>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-900/5 overflow-hidden z-30">
          {hits.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Sin resultados para <span className="font-medium text-ink">“{q.trim()}”</span>
              <div className="text-xs text-slate-400 mt-1">Prueba con el nombre de un KPI, proyecto, alcance o persona.</div>
            </div>
          ) : (
            <div ref={listRef} id="metis-search-results" role="listbox" className="max-h-[60vh] overflow-y-auto py-1.5">
              {Array.from(new Set(hits.map((h) => h.group))).map((g) => {
                const items = hits.filter((h) => h.group === g);
                if (!items.length) return null;
                return (
                  <div key={g} className="py-1">
                    <div className="px-4 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{g}</div>
                    {items.map((h) => {
                      idx++;
                      const i = idx;
                      const Icon = h.icon;
                      return (
                        <button
                          key={h.id}
                          type="button"
                          role="option"
                          aria-selected={i === active}
                          data-idx={i}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(h)}
                          className={clsx("w-full flex items-center gap-3 px-4 py-2 text-left", i === active ? "bg-indigo-soft" : "hover:bg-slate-50")}
                        >
                          <span className={clsx("h-7 w-7 shrink-0 rounded-lg grid place-items-center", i === active ? "bg-white text-indigo" : "bg-slate-100 text-slate-500")}>
                            <Icon size={14} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={clsx("block truncate text-sm", i === active ? "text-indigo font-medium" : "text-ink")}><Highlight text={h.title} q={q} /></span>
                            {h.sub && <span className="flex items-center gap-1.5 truncate text-xs text-slate-400">
                              {h.color && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: h.color }} />}
                              <span className="truncate">{h.sub}</span>
                            </span>}
                          </span>
                          {i === active && <CornerDownLeft size={13} className="shrink-0 text-indigo/70" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
            <span><kbd className="font-sans">↑↓</kbd> moverte</span>
            <span><kbd className="font-sans">↵</kbd> abrir</span>
            <span><kbd className="font-sans">Esc</kbd> cerrar</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Resalta (en negritas) la parte del texto que coincide con la búsqueda, ignorando acentos. */
function Highlight({ text, q }: { text: string; q: string }) {
  const nq = norm(q);
  if (!nq) return <>{text}</>;
  // norm() conserva la longitud carácter por carácter salvo los acentos combinados; mapeamos por índice sobre el texto sin acentos
  const plain = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (plain.length !== text.length) return <>{text}</>;
  const at = plain.toLowerCase().indexOf(nq);
  if (at < 0) return <>{text}</>;
  return <>{text.slice(0, at)}<mark className="bg-transparent font-semibold text-inherit">{text.slice(at, at + nq.length)}</mark>{text.slice(at + nq.length)}</>;
}

/** Hace scroll y resalta brevemente el elemento indicado en el #hash (lo usa el buscador). */
export function useFocusFromHash() {
  const path = usePathname();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tries = 0;
    const run = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) { if (tries++ < 20) timer = setTimeout(run, 150); return; } // los datos pueden tardar en llegar
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("search-flash"); void el.offsetWidth; el.classList.add("search-flash");
      setTimeout(() => el.classList.remove("search-flash"), 2200);
    };
    const start = () => { tries = 0; clearTimeout(timer); run(); };
    start();
    window.addEventListener("metis:focus", start);
    window.addEventListener("hashchange", start);
    return () => { clearTimeout(timer); window.removeEventListener("metis:focus", start); window.removeEventListener("hashchange", start); };
  }, [path]);
}
