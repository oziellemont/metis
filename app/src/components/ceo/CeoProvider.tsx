"use client";
/**
 * Estado del jugador de mêtis CEO.
 * - Jugar exige cuenta (el middleware manda a /entrar). Cada cuenta guarda su copia en su propia clave
 *   del navegador (`metis-ceo-v2:<usuario>`), así dos personas en el mismo navegador no se mezclan.
 * - Con Supabase + sesión: se sincroniza a ceo.players (ranking, correo/WhatsApp, multi-dispositivo).
 * - La partida vieja del navegador (`metis-ceo-v1`, progreso sin cuenta) NUNCA se sube sola: se ofrece
 *   importarla y el jugador decide (lib/ceo/import.ts, adenda v3.2 §3).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { advance as advanceFn, decide as decideFn, entries as entriesFn, healthOf, kpis as kpisFn, levelOf, migrate, newState, nowOf, packOf, pinArrived, rulesFor, rulesOf, seasonDay, seasonDoneOf, skipToNext, streakOf, switchCompany as switchFn, verdictOf, xpOf, type Verdict } from "@/lib/ceo/engine";
import { aliasOf, answerDilemma as answerDilemmaFn, casesProgress, changeOpen, changeSimOf, dilemmaOfDay } from "@/lib/ceo/engine";
import type { Dilemma } from "@/lib/ceo/dilemmas";
import { OFFERED_TIER, sanitizeDiagnostic, sanitizeProfile, snoozeNudge, type InitialDiagnostic, type ProfessionalProfile } from "@/lib/ceo/profile";
import { recordCrisis as recordCrisisFn, type CrisisPicks } from "@/lib/ceo/crisis";
import type { CrisisRating } from "@/lib/ceo/types";
import { appoint as appointFn, recordBoard as recordBoardFn, enrollJourney, journeyOf, STAGES, type JourneyView } from "@/lib/ceo/journey";
import { masteryOf, type Mastery } from "@/lib/ceo/mastery";
import { appEnvOf, testToolsVisible } from "@/lib/ceo/flags";
import { closeChange as closeChangeFn, playLever as playLeverFn, relationsOf, startChange as startChangeFn } from "@/lib/ceo/relations";
import type { ChangeSim } from "@/lib/ceo/change";
import type { CastId, CeoState, CompanyPack, Entry, Kpis, LeverId, Settings, Written } from "@/lib/ceo/types";
import { claimLegacy, finishImport, importIdFor, kvOf, legacyOwners, LEGACY_KEY, ownerKey, planImport, readClaim, readLegacy, readOwner, writeOwner, type ImportPlan } from "@/lib/ceo/import";
import { playerRow } from "@/lib/ceo/player-row";

const KEY = LEGACY_KEY;

/** Qué hacer con la carrera guardada en el navegador (pantalla de ImportPrompt). */
export interface ImportFlow {
  plan: Extract<ImportPlan, { kind: "offer_import" | "conflict" }>;
  busy: boolean;
  error: string | null;
  /** Nube vacía: traer la del navegador. Conflicto: reemplazar la de la cuenta (que queda respaldada). */
  importLocal: () => Promise<void>;
  /** Nube vacía: empezar desde cero. Conflicto: conservar la carrera de la nube. La del navegador no se borra. */
  dismiss: () => void;
}

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
  start: (p: { name: string; email: string; phone: string; company?: string; settings?: Partial<Settings>; profile?: ProfessionalProfile; diagnostic?: InitialDiagnostic; tier?: number }) => void;
  /** Guarda la experiencia declarada (V33). Nunca toca dominio, etapa, XP ni la partida. */
  saveProfile: (p: ProfessionalProfile) => void;
  saveDiagnostic: (d: InitialDiagnostic) => void;
  /** «Ahora no» en el aviso para completar el perfil. */
  snoozeProfile: () => void;
  /** Cierra la empresa: asciende (si aprobaste) o la repite. */
  advance: () => void;
  /** Cambiar de empresa antes de la primera decisión. */
  switchCompany: (id: string) => void;
  decide: (itemId: string, optionId: string, written?: Written) => void;
  markRead: (itemId: string) => void;
  completeLesson: (id: string) => void;
  /** Dilema de personas del día (o el que ya respondiste hoy). */
  dilemma: { d: Dilemma; done: boolean } | null;
  answerDilemma: (id: string, option: number) => void;
  updateSettings: (p: Partial<Settings> & { name?: string; alias?: string }) => void;
  skipNext: () => void;
  /** Executive Journey: etapa, siguiente nombramiento y requisitos. */
  journey: JourneyView;
  /** Mastery Engine: dominio de las 8 competencias. */
  mastery: Mastery;
  /** Recibe el nombramiento si ya cumples todo. Devuelve el nombre de la nueva etapa (o null). */
  appoint: () => string | null;
  /** Guarda el resultado de la Junta ante el Consejo (no toca KPI ni la partida). */
  recordBoard: (passed: boolean) => void;
  recordCrisis: (r: { rating: CrisisRating; picks: CrisisPicks }) => void;
  /** Mostrar herramientas de prueba (adelantar reloj). Ver lib/ceo/flags.ts. */
  testTools: boolean;
  /** Carrera del navegador por decidir (null si no hay nada que preguntar). */
  importFlow: ImportFlow | null;
  reset: () => void;
}

const C = createContext<Ctx | null>(null);
export const useCeo = () => {
  const c = useContext(C);
  if (!c) throw new Error("useCeo fuera de CeoProvider");
  return c;
};

export function CeoProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<CeoState>(newState);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(() => Date.now());
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [synced, setSynced] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const [testTools, setTestTools] = useState(true);

  const [plan, setPlan] = useState<ImportFlow["plan"] | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // cargar: primero quién es (la sesión), luego SU copia. Sin sesión, la partida sin cuenta de este navegador.
  useEffect(() => {
    let alive = true;
    const sb = supabaseBrowser();
    const kv = (() => { try { return kvOf(localStorage); } catch { return null; } })();
    (async () => {
      const session = sb ? (await sb.auth.getSession().catch(() => null))?.data.session ?? null : null;
      const u = session?.user;
      if (!u) {
        try { const raw = localStorage.getItem(KEY); if (raw && alive) setS(migrate(JSON.parse(raw))); } catch { /* ignore */ }
        if (alive) setReady(true);
        return;
      }
      if (!alive) return;
      setUser({ id: u.id, email: u.email ?? "" });
      const mine = kv ? readOwner(kv, u.id) : null;
      if (mine?.startedAt) { setS(mine); setReady(true); }
      let cloud: CeoState | null = null;
      try {
        const { data: row, error } = await sb!.schema("ceo").from("players").select("state").eq("user_id", u.id).maybeSingle();
        const st = row?.state as CeoState | undefined;
        if (!error) setSynced(true);
        if (st && typeof st === "object" && st.startedAt) cloud = migrate(st);
      } catch { /* sin esquema ceo todavía: se juega con la copia de la cuenta */ }
      if (!alive) return;
      // Misma cuenta en otro dispositivo: gana la copia más reciente de ESA cuenta (nunca la de otra persona).
      const best = cloud && (!mine?.startedAt || (cloud.savedAt || 0) > (mine.savedAt || 0)) ? cloud : mine;
      if (best && best !== mine) setS(best);
      if (kv) {
        const p = planImport({ uid: u.id, legacy: readLegacy(kv), owners: legacyOwners(kv), claim: readClaim(kv), cloud: best?.startedAt ? best : null });
        if (p.kind === "offer_import" || p.kind === "conflict") setPlan(p);
        if (p.kind === "same") { const l = readLegacy(kv); if (l) claimLegacy(kv, { uid: u.id, how: "igual", savedAt: l.savedAt || 0 }); }
      }
      setReady(true);
    })();
    try {
      const q = new URLSearchParams(window.location.search).get("prueba");
      if (q === "1") localStorage.setItem(KEY + ":prueba", "1");
      if (q === "0") localStorage.removeItem(KEY + ":prueba");
      const env = appEnvOf(process.env.NEXT_PUBLIC_VERCEL_ENV, process.env.NODE_ENV);
      setTestTools(testToolsVisible(env, process.env.NEXT_PUBLIC_CEO_TEST_TOOLS, localStorage.getItem(KEY + ":prueba") === "1"));
    } catch { /* ignore */ }
    const t = setInterval(() => setTick(Date.now()), 10_000);
    const vis = () => document.visibilityState === "visible" && setTick(Date.now());
    document.addEventListener("visibilitychange", vis);
    return () => { alive = false; clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, []);

  // Executive Journey: inscribir una sola vez (los jugadores de antes conservan su rango como piso fundador).
  useEffect(() => {
    if (!ready || !s.startedAt || s.journey) return;
    setS((p) => (p.journey || !p.startedAt ? p : enrollJourney(p, nowOf(p))));
  }, [ready, s.startedAt, s.journey]);

  const now = nowOf(s, tick);

  // guardar: copia de la cuenta (o sin cuenta) en el navegador; nube con retraso. Mientras haya una carrera
  // del navegador por decidir, no se sube nada (para no pisar la nube sin elección).
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ready) return;
    try {
      if (user) writeOwner(kvOf(localStorage), user.id, s);
      else localStorage.setItem(KEY, JSON.stringify(s));
    } catch { /* ignore */ }
    if (!user || !s.startedAt || plan) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const sb = supabaseBrowser();
      if (!sb) return;
      await sb.schema("ceo").from("players").upsert(playerRow(user.id, s, user.email)).then(({ error }) => {
        if (error) return;
        setSynced(true);
        // Primera vez con cuenta: carta de bienvenida por correo (el servidor evita duplicados).
        const wk = `${ownerKey(user.id)}:bienvenida`;
        try { if (localStorage.getItem(wk) || localStorage.getItem(`${KEY}:welcome:${user.id}`)) return; localStorage.setItem(wk, "1"); } catch { return; }
        fetch("/api/ceo/bienvenida", { method: "POST" }).catch(() => { /* el cron la manda de respaldo */ });
      });
    }, 1200);
  }, [s, ready, user, plan]);

  const importLocal = useCallback(async () => {
    if (!user || !plan || importBusy) return;
    let kv; try { kv = kvOf(localStorage); } catch { return; }
    const legacy = readLegacy(kv);
    if (!legacy) { setPlan(null); return; }
    setImportBusy(true); setImportError(null);
    const importId = importIdFor(kv, legacy.savedAt || 0);
    try {
      const r = await fetch("/api/ceo/importar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ importId, mode: plan.kind === "conflict" ? "reemplazar" : "vacia", state: legacy }) });
      const out = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; state?: CeoState | null };
      if (!r.ok || !out.ok) { setImportError(out.error ?? "red"); return; }
      const next = out.state ? migrate(out.state) : legacy;
      finishImport(kv, user.id, next, importId);
      seen.current = null;
      setS(next);
      setPlan(null);
    } catch { setImportError("red"); }
    finally { setImportBusy(false); }
  }, [user, plan, importBusy]);
  const dismissImport = useCallback(() => {
    if (!user || !plan) return;
    try { claimLegacy(kvOf(localStorage), { uid: user.id, how: "descartada", savedAt: plan.localSavedAt }); } catch { /* ignore */ }
    setPlan(null);
  }, [user, plan]);
  const importFlow = useMemo<ImportFlow | null>(() => (plan ? { plan, busy: importBusy, error: importError, importLocal, dismiss: dismissImport } : null), [plan, importBusy, importError, importLocal, dismissImport]);

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

  const start: Ctx["start"] = useCallback(({ name, email, phone, company, settings, profile, diagnostic, tier }) => {
    const t = Date.now();
    const pf = sanitizeProfile(profile), dg = sanitizeDiagnostic(diagnostic);
    setS((p) => ({ ...newState(), ...(pf ? { profile: pf } : {}), ...(dg ? { diagnostic: dg } : {}), tier: Math.max(0, Math.min(OFFERED_TIER, tier ?? 0)), startTier: Math.max(0, Math.min(OFFERED_TIER, tier ?? 0)), journey: { stage: 0, enrolledAt: t, appointments: [] }, company: company || newState().company, name: name.trim(), alias: aliasOf(name), startedAt: t, lastActiveAt: t, savedAt: t, settings: { ...p.settings, ...settings, email, phone, tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Monterrey" } }));
    seen.current = null;
  }, []);
  const decide = useCallback((itemId: string, optionId: string, written?: Written) => setS((p) => { const n = decideFn(p, itemId, optionId, nowOf(p), written); return n === p ? p : { ...n, savedAt: Date.now() }; }), []);
  const markRead = useCallback((itemId: string) => setS((p) => (p.read[itemId] ? p : { ...p, read: { ...p.read, [itemId]: Date.now() }, savedAt: Date.now() })), []);
  const answerDilemma = useCallback((id: string, option: number) => setS((p) => { const n = answerDilemmaFn(p, id, option); return n === p ? p : { ...n, savedAt: Date.now() }; }), []);
  const dilemma = useMemo(() => (s.startedAt ? dilemmaOfDay(s, now) : null), [s, now]);
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
  const mastery = useMemo(() => masteryOf(s, now), [s, now]);
  const journey = useMemo(() => journeyOf(s, now, mastery), [s, now, mastery]);
  const appoint = useCallback((): string | null => {
    const n = appointFn(s, nowOf(s));
    if (n === s) return null;
    setS({ ...n, savedAt: Date.now() });
    return STAGES[n.journey!.stage].name;
  }, [s]);
  const recordCrisis = useCallback((r: { rating: CrisisRating; picks: CrisisPicks }) => setS((p) => { const n = recordCrisisFn(p, r, nowOf(p)); return n === p ? p : { ...n, savedAt: Date.now() }; }), []);
  const recordBoard = useCallback((passed: boolean) => setS((p) => { const n = recordBoardFn(p, passed, nowOf(p)); return n === p ? p : { ...n, savedAt: Date.now() }; }), []);
  const saveProfile = useCallback((pf: ProfessionalProfile) => setS((p) => { const v = sanitizeProfile(pf); return v ? { ...p, profile: v, savedAt: Date.now() } : p; }), []);
  const saveDiagnostic = useCallback((d: InitialDiagnostic) => setS((p) => { const v = sanitizeDiagnostic(d); return v ? { ...p, diagnostic: v, savedAt: Date.now() } : p; }), []);
  const snoozeProfile = useCallback(() => setS((p) => ({ ...p, profileNudge: snoozeNudge(p.profileNudge, Date.now()), savedAt: Date.now() })), []);
  const reset = useCallback(() => { localStorage.removeItem(user ? ownerKey(user.id) : KEY); seen.current = null; setS(newState()); }, [user]);

  const value: Ctx = {
    ready, s, now, pack, rules: rulesFor(s), verdict, entries, inbox, pending, kpis: k, health: healthOf(k), xp, level: levelOf(xp), streak, day: seasonDay(s, now), seasonDone, nextArrival,
    relations, changeOpen: changeOpen(s, now), cases: casesProgress(s, now, entries), change, startChange, playLever, closeChange,
    user, synced, toast, dismissToast: () => setToast(null), start, advance, switchCompany, decide, markRead, completeLesson, dilemma, answerDilemma, updateSettings, skipNext, testTools, importFlow, reset, journey, mastery, appoint, recordBoard, recordCrisis, saveProfile, saveDiagnostic, snoozeProfile,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
