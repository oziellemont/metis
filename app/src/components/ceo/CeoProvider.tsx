"use client";
/**
 * Estado del jugador de mêtis CEO.
 * - Siempre se guarda en el navegador (se puede jugar sin cuenta).
 * - Con Supabase + sesión: se sincroniza a ceo.players (ranking, correo/WhatsApp, multi-dispositivo).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { advance as advanceFn, decide as decideFn, entries as entriesFn, healthOf, kpis as kpisFn, levelOf, migrate, newState, nowOf, packOf, pinArrived, rulesOf, seasonDay, seasonDoneOf, skipToNext, streakOf, switchCompany as switchFn, verdictOf, xpOf, type Verdict } from "@/lib/ceo/engine";
import { casesProgress, changeOpen, changeSimOf } from "@/lib/ceo/engine";
import { closeChange as closeChangeFn, playLever as playLeverFn, relationsOf, startChange as startChangeFn } from "@/lib/ceo/relations";
import type { ChangeSim } from "@/lib/ceo/change";
import type { CastId, CeoState, CompanyPack, Entry, Kpis, LeverId, Settings } from "@/lib/ceo/types";

const KEY = "metis-ceo-v1";

interface Toast { id: string; title: string; text: string; href: string }

interface Ctx {
  ready: boolean;
  s: CeoState;
  now: number;
  pack: CompanyPack;
  rules: ReturnType<typeof rulesOf>;
  verdict: Verdict;
  entries: Entry[];
  inbox: Entry[];
  pending: Entry[];
  kpis: Kpis;
  health: number;
  xp: number;
  level: ReturnType<typeof levelOf>;
  streak: ReturnType<typeof streakOf>;
  day: number;
  seasonDone: boolean;
  nextArrival: number | null;
  /** Relación con cada persona (0–100), según tus decisiones. */
  relations: Record<CastId, number>;
  /** Proyecto de cambio. */
  changeOpen: boolean;
  /** Asuntos base cerrados / total (el reto final se abre al cerrarlos todos). */
  cases: { done: number; total: number };
  change: ChangeSim | null;
  startChange: () => void;
  playLever: (lever: LeverId, targets: CastId[]) => void;
  closeChange: () => void;
  user: { id: string; email: string } | null;
  synced: boolean;
  toast: Toast | null;
  dismissToast: () => void;
  start: (p: { name: string; email: string; phone: string; company?: string; settings?: Partial<Settings> }) => void;
  /** Cierra la empresa: asciende (si aprobaste) o la repite. */
  advance: () => void;
  /** Cambiar de empresa antes de la primera decisión. */
  switchCompany: (id: string) => void;
  decide: (itemId: string, optionId: string) => void;
  markRead: (itemId: string) => void;
  completeLesson: (id: string) => void;
  updateSettings: (p: Partial<Settings> & { name?: string; alias?: string }) => void;
  skipNext: () => void;
  reset: () => void;
}

const C = createContext<Ctx | null>(null);
export const useCeo = () => {
  const c = useContext(C);
  if (!c) throw new Error("useCeo fuera de CeoProvider");
  return c;
};

const aliasOf = (name: string) => {
  const p = name.trim().split(/\s+/);
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0] || "CEO";
};

export function CeoProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<CeoState>(newState);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(() => Date.now());
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [synced, setSynced] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const seen = useRef<Set<string> | null>(null);

  // cargar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS(migrate(JSON.parse(raw)));
    } catch { /* ignore */ }
    setReady(true);
    const t = setInterval(() => setTick(Date.now()), 10_000);
    const vis = () => document.visibilityState === "visible" && setTick(Date.now());
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, []);

  // sesión + nube (si existe)
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !ready) return;
    let alive = true;
    (async () => {
      const { data } = await sb.auth.getUser();
      const u = data.user;
      if (!u || !alive) return;
      setUser({ id: u.id, email: u.email ?? "" });
      const { data: row } = await sb.schema("ceo").from("players").select("state").eq("user_id", u.id).maybeSingle();
      const remote = row?.state as CeoState | undefined;
      if (remote && alive) setS((local) => (remote.savedAt > local.savedAt ? migrate(remote) : local));
      setSynced(true);
    })().catch(() => { /* sin esquema ceo todavía: se juega local */ });
    return () => { alive = false; };
  }, [ready]);

  const now = nowOf(s, tick);

  // guardar (local siempre; nube con retraso)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
    if (!user || !s.startedAt) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const sb = supabaseBrowser();
      if (!sb) return;
      const real = Date.now();
      const st = streakOf(s, nowOf(s, real));
      const xp = xpOf(s, nowOf(s, real));
      await sb.schema("ceo").from("players").upsert({
        user_id: user.id, alias: s.alias || aliasOf(s.name), name: s.name, state: s,
        xp, level: levelOf(xp).name, streak: st.days, best_streak: st.best, health: healthOf(kpisFn(s, nowOf(s, real))),
        decisions: Object.keys(s.decisions).length, email: s.settings.email || user.email, phone: s.settings.phone,
        notify_email: s.settings.notifyEmail, notify_whatsapp: s.settings.notifyWhatsapp, tz: s.settings.tz,
        updated_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) return;
        setSynced(true);
        // Primera vez con cuenta: carta de bienvenida por correo (el servidor evita duplicados).
        const wk = `${KEY}:welcome:${user.id}`;
        try { if (localStorage.getItem(wk)) return; localStorage.setItem(wk, "1"); } catch { return; }
        fetch("/api/ceo/bienvenida", { method: "POST" }).catch(() => { /* el cron la manda de respaldo */ });
      });
    }, 1200);
  }, [s, ready, user]);

  const entries = useMemo(() => entriesFn(s, now), [s, now]);
  const inbox = useMemo(() => entries.filter((e) => e.status !== "futuro").reverse(), [entries]);
  const pending = useMemo(() => inbox.filter((e) => e.status === "pendiente"), [inbox]);

  // congelar llegadas + aviso de mensaje nuevo
  useEffect(() => {
    if (!ready || !s.startedAt) return;
    const pinned = pinArrived(s, now);
    if (pinned !== s) setS(pinned);
    const arrived = inbox.map((e) => e.item.id);
    if (seen.current === null) { seen.current = new Set(arrived); return; }
    const fresh = inbox.find((e) => !seen.current!.has(e.item.id) && e.status === "pendiente");
    arrived.forEach((id) => seen.current!.add(id));
    if (fresh) {
      const t = { id: fresh.item.id, title: fresh.item.channel === "whatsapp" ? `WhatsApp · ${fresh.item.subject}` : fresh.item.subject, text: fresh.item.preview, href: `/ceo/caso/${fresh.item.id}` };
      setToast(t);
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState !== "visible") new Notification(t.title, { body: t.text, icon: "/brand/app-icono-192.png" });
      } catch { /* ignore */ }
    }
  }, [inbox, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const k = useMemo(() => kpisFn(s, now), [s, now]);
  const xp = useMemo(() => xpOf(s, now), [s, now]);
  const streak = useMemo(() => streakOf(s, now), [s, now]);
  const seasonDone = useMemo(() => seasonDoneOf(s, now), [s, now]);
  const verdict = useMemo(() => verdictOf(s, now), [s, now]);
  const pack = packOf(s);
  const relations = useMemo(() => relationsOf(s, now), [s, now]);
  const change = useMemo(() => changeSimOf(s), [s]);
  const nextArrival = entries.find((e) => e.status === "futuro")?.arrivesAt ?? null;

  const start: Ctx["start"] = useCallback(({ name, email, phone, company, settings }) => {
    const t = Date.now();
    setS((p) => ({ ...newState(), company: company || newState().company, name: name.trim(), alias: aliasOf(name), startedAt: t, lastActiveAt: t, savedAt: t, settings: { ...p.settings, ...settings, email, phone, tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Monterrey" } }));
    seen.current = null;
  }, []);
  const decide = useCallback((itemId: string, optionId: string) => setS((p) => { const n = decideFn(p, itemId, optionId, nowOf(p)); return n === p ? p : { ...n, savedAt: Date.now() }; }), []);
  const markRead = useCallback((itemId: string) => setS((p) => (p.read[itemId] ? p : { ...p, read: { ...p.read, [itemId]: Date.now() }, savedAt: Date.now() })), []);
  const completeLesson = useCallback((id: string) => setS((p) => (p.lessons[id] ? p : { ...p, lessons: { ...p.lessons, [id]: nowOf(p) }, lastActiveAt: nowOf(p), savedAt: Date.now() })), []);
  const updateSettings: Ctx["updateSettings"] = useCallback(({ name, alias, ...rest }) => setS((p) => {
    const q = pinArrived(p, nowOf(p));
    return { ...q, name: name ?? q.name, alias: alias ?? q.alias, settings: { ...q.settings, ...rest }, savedAt: Date.now() };
  }), []);
  const skipNext = useCallback(() => { setS((p) => ({ ...skipToNext(p), savedAt: Date.now() })); setTick(Date.now()); }, []);
  const advance = useCallback(() => { setS((p) => { const n = advanceFn(p, nowOf(p)); return n === p ? p : { ...n, savedAt: Date.now() }; }); seen.current = null; setTick(Date.now()); }, []);
  const switchCompany = useCallback((id: string) => { setS((p) => { const n = switchFn(p, id, nowOf(p)); return n === p ? p : { ...n, savedAt: Date.now() }; }); seen.current = null; }, []);
  const startChange = useCallback(() => setS((p) => { const n = startChangeFn(p, nowOf(p)); return n === p ? p : { ...n, savedAt: Date.now() }; }), []);
  const playLever = useCallback((lever: LeverId, targets: CastId[]) => setS((p) => { const n = playLeverFn(p, lever, targets, nowOf(p)); return n === p ? p : { ...n, savedAt: Date.now() }; }), []);
  const closeChange = useCallback(() => setS((p) => { const n = closeChangeFn(p, nowOf(p)); return n === p ? p : { ...n, savedAt: Date.now() }; }), []);
  const reset = useCallback(() => { localStorage.removeItem(KEY); seen.current = null; setS(newState()); }, []);

  const value: Ctx = {
    ready, s, now, pack, rules: rulesOf(s.tier), verdict, entries, inbox, pending, kpis: k, health: healthOf(k), xp, level: levelOf(xp), streak, day: seasonDay(s, now), seasonDone, nextArrival,
    relations, changeOpen: changeOpen(s, now), cases: casesProgress(s, now, entries), change, startChange, playLever, closeChange,
    user, synced, toast, dismissToast: () => setToast(null), start, advance, switchCompany, decide, markRead, completeLesson, updateSettings, skipNext, reset,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
