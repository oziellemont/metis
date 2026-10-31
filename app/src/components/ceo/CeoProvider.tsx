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
import { allocate as allocateFn, closePeriod as closePeriodFn } from "@/lib/ceo/business/report";
import { advance as advanceFn, reportDueOf, isContinuous, renameCompany as renameFn, setupCompany as setupFn, decide as decideFn, entries as entriesFn, episodeEntries as episodeEntriesFn, nextArrivalOf, openSeasonEpisode, type EpisodeEntry, healthOf, kpis as kpisFn, levelOf, migrate, newState, nowOf, packOf, pinArrived, rulesFor, rulesOf, seasonDay, seasonDoneOf, skipToNext, streakOf, switchCompany as switchFn, verdictOf, xpOf, type Verdict } from "@/lib/ceo/engine";
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
import { onboardingFromState, onboardingSignature } from "@/lib/ceo/onboarding";
import { mergeStates, planSave, SYNC_POLL_MS, withServerPrefs, type ServerPrefs } from "@/lib/ceo/sync";
import { claimLegacy, finishImport, importIdFor, kvOf, legacyOwners, LEGACY_KEY, ownerKey, planImport, readClaim, readLegacy, readOwner, writeOwner, type ImportPlan } from "@/lib/ceo/import";
import { playerRow } from "@/lib/ceo/player-row";
import { RULES_VERSION } from "@/lib/ceo/rules";
import { flushOnce, logAction } from "@/lib/ceo/journal-client";
import { blockedOnVacation, type GameAction } from "@/lib/ceo/replay";
import { actEpisode, restartEpisode as restartEpisodeFn } from "@/lib/ceo/episodes/catalog";
import type { EpisodeAction } from "@/lib/ceo/episodes/engine";
import { onVacation } from "@/lib/ceo/pausetime";
import { cadenceStatus, markReturnSeen as markReturnSeenFn, pauseCareer as pauseFn, quietUntil, resumeCareer as resumeFn, returnDue as returnDueFn, startQuietDay as quietFn } from "@/lib/ceo/cadence";
import type { CadenceStatus } from "@/lib/ceo/types";
import type { SetupInput } from "@/lib/ceo/career/setup";

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
  /** Casos ejecutivos de la temporada (reglas v3+): llegados, pendientes y cerrados. */
  episodes: EpisodeEntry[];
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
  start: (p: { name: string; email: string; phone: string; company?: string; settings?: Partial<Settings>; profile?: ProfessionalProfile; diagnostic?: InitialDiagnostic; tier?: number; setup?: SetupInput }) => void;
  /** Carrera continua: cambia el nombre de tu empresa (conserva todo lo demás). Devuelve false si el nombre no es válido. */
  renameCompany: (displayName: string, shortName?: string) => boolean;
  /** Carrera continua: una empresa persistente con identidad propia. */
  continuous: boolean;
  /** Guarda la experiencia declarada (V33). Nunca toca dominio, etapa, XP ni la partida. */
  saveProfile: (p: ProfessionalProfile) => void;
  saveDiagnostic: (d: InitialDiagnostic) => void;
  /** «Ahora no» en el aviso para completar el perfil. */
  snoozeProfile: () => void;
  /** Cierra la empresa: asciende (si aprobaste) o la repite. */
  advance: () => void;
  /** Carrera continua (P0-D): mes cuyo reporte espera tu revisión (null si no hay). */
  reportDue: number | null;
  /** Firma el reporte del mes con la opción elegida (null = guardar la caja o «Enterado»). */
  signReport: (period: number, option: "a" | "b" | null) => void;
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
  recordCrisis: (r: { rating: CrisisRating; picks: CrisisPicks; from?: number }) => void;
  /** Mostrar herramientas de prueba (adelantar reloj). Ver lib/ceo/flags.ts. */
  testTools: boolean;
  /** Carrera del navegador por decidir (null si no hay nada que preguntar). */
  importFlow: ImportFlow | null;
  reset: () => void;
  /** Ritmo (1.2): activo, día tranquilo o vacaciones. */
  cadence: CadenceStatus;
  /** Vacaciones: `until` = fecha prevista de regreso (ms) o null si es indefinida. */
  pauseCareer: (until: number | null) => void;
  /** «Reanudar ahora» (también termina antes un día tranquilo). */
  resumeCareer: () => void;
  startQuietDay: () => void;
  /** Pantalla «Qué bueno tenerte de vuelta» pendiente (null si no toca). */
  returnDue: "vacaciones" | "ausencia" | null;
  markReturnSeen: () => void;
  /** Executive Decision Episodes (vista previa): abrir un episodio y aplicar un paso. Devuelve el error, si lo hay. */
  openEpisode: (id: string, mode?: "estandar" | "flexible") => void;
  episodeAct: (id: string, act: DistributiveOmit<EpisodeAction, "at">) => string | null;
  /** Solo modo prueba: borra la partida de un episodio para volver a recorrerlo por otra ruta. */
  resetEpisode: (id: string) => void;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

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

  // Diario de jugadas (0.5, modo sombra): cada jugada aceptada por el motor se anota en una cola del
  // dispositivo y se envía en segundo plano a /api/ceo/partida. Nunca bloquea ni cambia la partida.
  const userRef = useRef<{ id: string; email: string } | null>(null);
  const journalOff = useRef(false);
  const log = useCallback((n: CeoState, a: GameAction) => {
    const u = userRef.current;
    if (!u || journalOff.current) return;
    try { logAction(kvOf(localStorage), u.id, n, a); } catch { /* sin almacenamiento: no hay diario */ }
  }, []);
  /** Aplica una jugada y, si procede, la anota. */
  const play = useCallback((f: (p: CeoState) => { n: CeoState; a: GameAction }) => setS((p) => {
    const { n, a } = f(p);
    if (n === p || blockedOnVacation(p, a)) return p;
    log(n, a);
    return { ...n, savedAt: Date.now() };
  }), [log]);

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
        if (st && typeof st === "object" && st.startedAt) { cloud = migrate(st); lastSynced.current = cloud.savedAt || 0; }
      } catch { /* sin esquema ceo todavía: se juega con la copia de la cuenta */ }
      if (!alive) return;
      // Misma cuenta en otro dispositivo (1.1): se mezclan las dos copias de ESA cuenta (nunca la de otra persona).
      let best = mergeStates(mine, cloud)?.state ?? mine;
      if (best?.startedAt) {
        // Preferencias guardadas en columnas (perfil de onboarding) rellenan lo que la partida no traiga.
        const { data: pref } = await sb!.schema("ceo").from("players").select("daily_decision_goal, preferred_session_minutes").eq("user_id", u.id).maybeSingle().then((r) => r, () => ({ data: null }));
        best = withServerPrefs(best, pref as ServerPrefs | null);
      }
      if (!alive) return;
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
  /** Guardado en la nube programado y todavía no hecho (para subirlo al cerrar la pestaña). */
  const pendingSave = useRef<(() => Promise<void>) | null>(null);
  const leaving = useRef(false);
  const journalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sRef = useRef(s);
  sRef.current = s;
  userRef.current = user;
  const flushing = useRef(false);
  /** `savedAt` de la última partida que este dispositivo subió o bajó de la nube (1.1). */
  const lastSynced = useRef(0);
  /** Trae la copia de la nube si otro dispositivo guardó algo más nuevo y la mezcla con la de aquí. */
  const pullCloud = useCallback(async (force = false): Promise<boolean> => {
    const u = userRef.current;
    const sb = supabaseBrowser();
    if (!u || !sb) return false;
    try {
      const { data: head, error } = await sb.schema("ceo").from("players").select("saved:state->savedAt").eq("user_id", u.id).maybeSingle();
      if (error) return false;
      const cloudSaved = typeof (head as { saved?: unknown } | null)?.saved === "number" ? (head as { saved: number }).saved : null;
      if (!force && planSave(lastSynced.current, cloudSaved) === "escribir") return false;
      const { data: row } = await sb.schema("ceo").from("players").select("state").eq("user_id", u.id).maybeSingle();
      const st = row?.state as CeoState | undefined;
      if (!st || typeof st !== "object" || !st.startedAt) return false;
      const cloud = migrate(st);
      lastSynced.current = cloud.savedAt || 0;
      const m = mergeStates(sRef.current, cloud);
      if (!m || m.how === "local" || m.how === "igual") return false;
      seen.current = null;
      setS(m.state);
      return true;
    } catch { return false; }
  }, []);
  const flushJournal = useCallback(async () => {
    const u = userRef.current;
    if (!u || flushing.current || journalOff.current) return;
    flushing.current = true;
    try {
      const kv = kvOf(localStorage);
      for (let i = 0; i < 5; i++) {
        const st = sRef.current;
        const r = await flushOnce(kv, u.id, st, xpOf(st, nowOf(st)), (url, init) => fetch(url, init));
        if (r === "apagado") { journalOff.current = true; break; }
        if (r !== "enviado") break;
      }
    } catch { /* se reintenta en la siguiente jugada */ }
    finally { flushing.current = false; }
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      if (user) writeOwner(kvOf(localStorage), user.id, s);
      else localStorage.setItem(KEY, JSON.stringify(s));
    } catch { /* ignore */ }
    if (!user || !s.startedAt || plan) return;
    if (journalTimer.current) clearTimeout(journalTimer.current);
    journalTimer.current = setTimeout(() => { void flushJournal(); }, 4000);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const saveNow = async () => {
      saveTimer.current = null;
      pendingSave.current = null;
      const sb = supabaseBrowser();
      if (!sb) return;
      // 1.1: si otro dispositivo guardó algo más nuevo, primero se trae y se mezcla (el guardado siguiente sube la mezcla).
      if (await pullCloud()) return;
      const cur = sRef.current;
      let stored = false;
      await sb.schema("ceo").from("players").upsert(playerRow(user.id, cur, user.email)).then(({ error }) => {
        if (error) return;
        stored = true;
        lastSynced.current = cur.savedAt || 0;
        setSynced(true);
        // Primera vez con cuenta: carta de bienvenida por correo (el servidor evita duplicados).
        const wk = `${ownerKey(user.id)}:bienvenida`;
        try { if (localStorage.getItem(wk) || localStorage.getItem(`${KEY}:welcome:${user.id}`)) return; localStorage.setItem(wk, "1"); } catch { return; }
        fetch("/api/ceo/bienvenida", { method: "POST" }).catch(() => { /* el cron la manda de respaldo */ });
      });
      // 1.2: recién pausada (vacaciones o día tranquilo) → cancelar los correos ya programados. Una vez por pausa.
      const lastP = cur.cadence?.pauses?.at(-1);
      if (stored && lastP && cadenceStatus(cur, nowOf(cur)) !== "active") {
        const pk = `${ownerKey(user.id)}:pausa`, tag = `${lastP.kind}:${lastP.from}`;
        try { if (localStorage.getItem(pk) !== tag) fetch("/api/ceo/pausa", { method: "POST" }).then((r) => { if (r.ok) try { localStorage.setItem(pk, tag); } catch { /* ignore */ } }).catch(() => { /* el cron también cancela */ }); } catch { /* ignore */ }
      }
      // Perfil de onboarding v3.2 (meta diaria, empresa de casa…): se guarda en columnas propias, solo si cambió.
      if (!stored) return;
      const ob = onboardingFromState(cur), sig = onboardingSignature(ob);
      const ok = `${ownerKey(user.id)}:onboarding`;
      try { if (!sig || localStorage.getItem(ok) === sig) return; } catch { return; }
      fetch("/api/ceo/perfil", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(ob) })
        .then((r) => { if (r.ok) try { localStorage.setItem(ok, sig); } catch { /* ignore */ } })
        .catch(() => { /* se reintenta en el siguiente guardado */ });
    };
    pendingSave.current = saveNow;
    saveTimer.current = setTimeout(saveNow, 1200);
  }, [s, ready, user, plan, pullCloud]);

  // Al cerrar o esconder la pestaña con un guardado pendiente, se sube ya (no se espera el retraso):
  // así la última jugada no se queda solo en este dispositivo.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "visible" && !leaving.current) return;
      const f = pendingSave.current;
      if (!f) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      void f();
    };
    const onHide = () => { leaving.current = true; flush(); leaving.current = false; };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", onHide);
    return () => { document.removeEventListener("visibilitychange", flush); window.removeEventListener("pagehide", onHide); };
  }, []);

  // 1.1: al volver a la pestaña y cada minuto con ella visible, revisar si otro dispositivo avanzó.
  useEffect(() => {
    if (!ready || !user || plan) return;
    const check = () => { if (document.visibilityState === "visible") void pullCloud(); };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    const t = setInterval(check, SYNC_POLL_MS);
    return () => { document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); clearInterval(t); };
  }, [ready, user, plan, pullCloud]);

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
  const episodes = useMemo(() => episodeEntriesFn(s, now), [s, now]);
  const arrivedEpisodes = episodes.filter((e) => e.status !== "futuro");

  // congelar llegadas + aviso de mensaje nuevo
  useEffect(() => {
    if (!ready || !s.startedAt) return;
    const pinned = pinArrived(s, now);
    if (pinned !== s) setS(pinned);
    const arrived = [...inbox.map((e) => e.item.id), ...arrivedEpisodes.map((e) => `ep:${e.spec.id}`)];
    if (seen.current === null) { seen.current = new Set(arrived); return; }
    const fresh = inbox.find((e) => !seen.current!.has(e.item.id) && e.status === "pendiente");
    const freshEp = arrivedEpisodes.find((e) => !seen.current!.has(`ep:${e.spec.id}`) && e.status === "pendiente");
    arrived.forEach((id) => seen.current!.add(id));
    const t = fresh
      ? { id: fresh.item.id, title: fresh.item.channel === "whatsapp" ? `WhatsApp · ${fresh.item.subject}` : fresh.item.subject, text: fresh.item.preview, href: `/ceo/caso/${fresh.item.id}` }
      : freshEp ? { id: `ep:${freshEp.spec.id}`, title: `Caso ejecutivo · ${freshEp.spec.subject}`, text: freshEp.spec.title, href: `/ceo/episodio/${freshEp.spec.id}` } : null;
    if (t) {
      setToast(t);
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState !== "visible") new Notification(t.title, { body: t.text, icon: "/brand/app-icono-192.png" });
      } catch { /* ignore */ }
    }
  }, [inbox, arrivedEpisodes.length, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const k = useMemo(() => kpisFn(s, now), [s, now]);
  const xp = useMemo(() => xpOf(s, now), [s, now]);
  const streak = useMemo(() => streakOf(s, now), [s, now]);
  const seasonDone = useMemo(() => seasonDoneOf(s, now), [s, now]);
  const verdict = useMemo(() => verdictOf(s, now), [s, now]);
  const pack = packOf(s);
  const relations = useMemo(() => relationsOf(s, now), [s, now]);
  const change = useMemo(() => changeSimOf(s), [s]);
  const nextArrival = useMemo(() => nextArrivalOf(s, now), [s, now]);

  const start: Ctx["start"] = useCallback(({ name, email, phone, company, settings, profile, diagnostic, tier, setup }) => {
    const t = Date.now();
    const pf = sanitizeProfile(profile), dg = sanitizeDiagnostic(diagnostic);
    setS((p) => {
      const tr = Math.max(0, Math.min(OFFERED_TIER, tier ?? 0));
      const n: CeoState = { ...newState(), ...(pf ? { profile: pf } : {}), ...(dg ? { diagnostic: dg } : {}), tier: tr, startTier: tr, journey: { stage: 0, enrolledAt: t, appointments: [] }, company: company || newState().company, name: name.trim(), alias: aliasOf(name), startedAt: t, lastActiveAt: t, savedAt: t, settings: { ...p.settings, ...settings, email, phone, tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Monterrey" } };
      const { email: _e, phone: _p, ...pub } = n.settings;
      log(n, { type: "start", at: t, name: n.name, company: n.company, settings: pub, rulesVersion: n.rulesVersion ?? RULES_VERSION, tier: tr, journey: true });
      // Carrera continua (P0-B3): la empresa propia se crea en el mismo instante y se anota como jugada aparte.
      if (!setup) return n;
      const own = setupFn(n, setup, t);
      if (own === n) return n;
      log(own, { type: "setupCompany", at: t, ...setup });
      return own;
    });
    seen.current = null;
  }, [log]);
  const decide = useCallback((itemId: string, optionId: string, written?: Written) => play((p) => { const at = nowOf(p); const n = decideFn(p, itemId, optionId, at, written); return { n, a: { type: "decide", at, item: itemId, option: optionId, ...(n !== p && n.decisions[itemId]?.written ? { written: n.decisions[itemId].written } : {}) } }; }), [play]);
  const markRead = useCallback((itemId: string) => setS((p) => (p.read[itemId] ? p : { ...p, read: { ...p.read, [itemId]: Date.now() }, savedAt: Date.now() })), []);
  const answerDilemma = useCallback((id: string, option: number) => play((p) => { const at = nowOf(p); return { n: answerDilemmaFn(p, id, option, at), a: { type: "dilemma", at, id, option } }; }), [play]);
  const dilemma = useMemo(() => (s.startedAt ? dilemmaOfDay(s, now) : null), [s, now]);
  const completeLesson = useCallback((id: string) => play((p) => { const at = nowOf(p); return { n: p.lessons[id] ? p : { ...p, lessons: { ...p.lessons, [id]: at }, lastActiveAt: at }, a: { type: "lesson", at, id } }; }), [play]);
  const updateSettings: Ctx["updateSettings"] = useCallback(({ name, alias, ...rest }) => setS((p) => {
    const at = nowOf(p);
    const q = pinArrived(p, at);
    const n = { ...q, name: name ?? q.name, alias: alias ?? q.alias, settings: { ...q.settings, ...rest }, savedAt: Date.now() };
    const { email: _e, phone: _p, ...patch } = rest;
    if (p.startedAt) log(n, { type: "settings", at, patch, ...(name !== undefined ? { name } : {}), ...(alias !== undefined ? { alias } : {}) });
    return n;
  }), [log]);
  const pauseCareer = useCallback((until: number | null) => { play((p) => { const at = nowOf(p); return { n: pauseFn(pinArrived(p, at), at, until), a: { type: "pause", at, until } }; }); setTick(Date.now()); }, [play]);
  const resumeCareer = useCallback(() => { play((p) => { const at = nowOf(p); return { n: resumeFn(p, at), a: { type: "resume", at } }; }); seen.current = null; setTick(Date.now()); }, [play]);
  const startQuietDay = useCallback(() => { play((p) => { const at = nowOf(p); const until = quietUntil(at, p.settings.tz); return { n: quietFn(pinArrived(p, at), at, until), a: { type: "quiet", at, until } }; }); setTick(Date.now()); }, [play]);
  const markReturnSeen = useCallback(() => setS((p) => ({ ...markReturnSeenFn(p, nowOf(p)), savedAt: Date.now() })), []);
  const skipNext = useCallback(() => { setS((p) => ({ ...skipToNext(p), savedAt: Date.now() })); setTick(Date.now()); }, []);
  const advance = useCallback(() => { play((p) => { const at = nowOf(p); return { n: advanceFn(p, at, RULES_VERSION), a: { type: "advance", at, rulesVersion: RULES_VERSION } }; }); seen.current = null; setTick(Date.now()); }, [play]);
  const signReport = useCallback((period: number, option: "a" | "b" | null) => {
    if (option) play((p) => { const at = nowOf(p); return { n: allocateFn(p, period, option, at), a: { type: "allocate", at, period, option } }; });
    play((p) => { const at = nowOf(p); return { n: closePeriodFn(p, period, at), a: { type: "closePeriod", at, period } }; });
  }, [play]);
  const reportDue = useMemo(() => reportDueOf(s), [s]);
  const renameCompany = useCallback((displayName: string, shortName?: string): boolean => {
    const cur = sRef.current;
    const at = nowOf(cur);
    if (renameFn(cur, displayName, shortName, at) === cur) return false;
    play((p) => { const a = nowOf(p); const n = renameFn(p, displayName, shortName, a); return { n, a: { type: "renameCompany", at: a, displayName: n.companyProfile?.displayName ?? displayName, ...(shortName?.trim() ? { shortName: n.companyProfile?.shortName } : {}) } }; });
    return true;
  }, [play]);
  const switchCompany = useCallback((id: string) => { play((p) => { const at = nowOf(p); return { n: switchFn(p, id, at), a: { type: "switch", at, company: id } }; }); seen.current = null; }, [play]);
  const startChange = useCallback(() => play((p) => { const at = nowOf(p); return { n: startChangeFn(p, at), a: { type: "changeStart", at } }; }), [play]);
  const playLever = useCallback((lever: LeverId, targets: CastId[]) => play((p) => { const at = nowOf(p); return { n: playLeverFn(p, lever, targets, at), a: { type: "lever", at, lever, targets } }; }), [play]);
  const closeChange = useCallback(() => play((p) => { const at = nowOf(p); return { n: closeChangeFn(p, at), a: { type: "changeClose", at } }; }), [play]);
  const mastery = useMemo(() => masteryOf(s, now), [s, now]);
  const journey = useMemo(() => journeyOf(s, now, mastery), [s, now, mastery]);
  const appoint = useCallback((): string | null => {
    const at = nowOf(s);
    const n = appointFn(s, at);
    if (n === s) return null;
    log(n, { type: "appoint", at });
    setS({ ...n, savedAt: Date.now() });
    return STAGES[n.journey!.stage].name;
  }, [s, log]);
  const recordCrisis = useCallback((r: { rating: CrisisRating; picks: CrisisPicks; from?: number }) => play((p) => {
    const at = nowOf(p);
    const picks: Record<string, string> = {};
    for (const [k, v] of Object.entries(r.picks)) if (typeof v === "string") picks[k] = v;
    return { n: recordCrisisFn(p, r, at), a: { type: "crisis", at, from: r.from ?? at, picks } };
  }), [play]);
  const recordBoard = useCallback((passed: boolean) => play((p) => { const at = nowOf(p); return { n: recordBoardFn(p, passed, at), a: { type: "board", at, passed } }; }), [play]);
  const saveProfile = useCallback((pf: ProfessionalProfile) => setS((p) => { const v = sanitizeProfile(pf); return v ? { ...p, profile: v, savedAt: Date.now() } : p; }), []);
  const saveDiagnostic = useCallback((d: InitialDiagnostic) => setS((p) => { const v = sanitizeDiagnostic(d); return v ? { ...p, diagnostic: v, savedAt: Date.now() } : p; }), []);
  const snoozeProfile = useCallback(() => setS((p) => ({ ...p, profileNudge: snoozeNudge(p.profileNudge, Date.now()), savedAt: Date.now() })), []);
  const openEpisode = useCallback((id: string, mode?: "estandar" | "flexible") => play((p) => { const at = nowOf(p); return { n: openSeasonEpisode(p, id, at, mode), a: { type: "episodeOpen", at, id, ...(mode ? { mode } : {}) } }; }), [play]);
  // El error se calcula con el estado actual (fuera de setS) para poder mostrarlo; la jugada se aplica con `play`.
  const episodeAct = useCallback((id: string, act: DistributiveOmit<EpisodeAction, "at">): string | null => {
    const cur = sRef.current;
    const at = nowOf(cur);
    if (onVacation(cur, at)) return "Estás de vacaciones. Reanuda tu carrera para seguir con el caso.";
    const full = { ...act, at } as EpisodeAction;
    const probe = actEpisode(cur, id, full);
    if (probe.error) return probe.error;
    play((p) => ({ n: actEpisode(p, id, { ...full, at: nowOf(p) }).state, a: { type: "episode", at: nowOf(p), id, act: { ...full, at: nowOf(p) } } }));
    return null;
  }, [play]);
  const resetEpisode = useCallback((id: string) => setS((p) => { const n = restartEpisodeFn(p, id, nowOf(p)); return n === p ? p : { ...n, savedAt: Date.now() }; }), []);
  const reset = useCallback(() => { localStorage.removeItem(user ? ownerKey(user.id) : KEY); seen.current = null; setS(newState()); }, [user]);

  const value: Ctx = {
    ready, s, now, pack, rules: rulesFor(s), verdict, entries, inbox, pending, episodes, kpis: k, health: healthOf(k), xp, level: levelOf(xp), streak, day: seasonDay(s, now), seasonDone, nextArrival,
    relations, changeOpen: changeOpen(s, now), cases: casesProgress(s, now, entries), change, startChange, playLever, closeChange,
    user, synced, toast, dismissToast: () => setToast(null), start, advance, reportDue, signReport, switchCompany, renameCompany, continuous: isContinuous(s), decide, markRead, completeLesson, dilemma, answerDilemma, updateSettings, skipNext, testTools, importFlow, reset, journey, mastery, appoint, recordBoard, recordCrisis, saveProfile, saveDiagnostic, snoozeProfile,
    cadence: cadenceStatus(s, now), pauseCareer, resumeCareer, startQuietDay, returnDue: ready ? returnDueFn(s, now) : null, markReturnSeen, openEpisode, episodeAct, resetEpisode,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
