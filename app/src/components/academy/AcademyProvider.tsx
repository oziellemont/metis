"use client";
/**
 * Estado de Metis Academy para el usuario actual.
 * - Modo real (Supabase): metis.academy_progress (migración 0007). Es OBLIGATORIA: hasta aprobar
 *   los módulos, el resto de la plataforma queda bloqueado.
 * - Modo demo: se guarda en este navegador y NO bloquea (la demo pública debe poder recorrerse libre).
 * - Si la tabla aún no existe (migración sin correr) no bloqueamos a nadie.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMetis } from "@/lib/store";
import { supabaseBrowser } from "@/lib/supabase/client";
import { MODULES } from "@/lib/academy/content";
import { allDone, completedCount, recordAttempt, type ModuleProgress, type ProgressMap } from "@/lib/academy/progress";

interface AcademyState {
  ready: boolean;
  /** true si la Academia es obligatoria para este usuario y aún no termina. */
  locked: boolean;
  /** La tabla existe y el avance se guarda en la nube. */
  enforced: boolean;
  progress: ProgressMap;
  done: number;
  total: number;
  finished: boolean;
  saveAttempt: (moduleId: string, pct: number, passed: boolean) => void;
  /** Avance de otras personas de la empresa (solo admins/jefes en modo real). */
  team: Record<string, number>;
  /** Solo el admin de la plataforma METIS puede saltarla (para soporte). */
  canSkip: boolean;
  skip: () => void;
  /** Admin de METIS: nunca se le bloquea la plataforma y puede abrir cualquier módulo para revisarlo. */
  previewAll: boolean;
  resetDemo: () => void;
}

const Ctx = createContext<AcademyState | null>(null);
const DEMO_KEY = (uid: string) => `metis-academy-${uid}`;
const SKIP_KEY = "metis-academy-skip";

export function AcademyProvider({ children }: { children: ReactNode }) {
  const s = useMetis();
  const uid = s.currentUserId;
  const real = s.mode === "supabase";
  const me = s.userOf(uid);
  const isLead = me.role === "admin" || me.role === "manager";
  const [progress, setProgress] = useState<ProgressMap>({});
  const [ready, setReady] = useState(false);
  const [enforced, setEnforced] = useState(false);
  const [team, setTeam] = useState<Record<string, number>>({});
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    let alive = true;
    setReady(false);
    setSkipped(typeof window !== "undefined" && sessionStorage.getItem(SKIP_KEY) === "1");
    (async () => {
      if (!real) {
        try { setProgress(JSON.parse(localStorage.getItem(DEMO_KEY(uid)) ?? "{}")); } catch { setProgress({}); }
        // En demo no bloquea, salvo que se active para probar la experiencia de primera vez.
        setEnforced(localStorage.getItem("metis-academy-enforce") === "1");
        setReady(true);
        return;
      }
      const db = supabaseBrowser()!.schema("metis");
      const r = await db.from("academy_progress").select("module_id, best_score, attempts, passed_at").eq("user_id", uid);
      if (!alive) return;
      if (r.error) { setEnforced(false); setProgress({}); setReady(true); return; }
      const map: ProgressMap = {};
      (r.data ?? []).forEach((x: { module_id: string; best_score: number; attempts: number; passed_at: string | null }) => {
        map[x.module_id] = { moduleId: x.module_id, bestScore: x.best_score, attempts: x.attempts, passedAt: x.passed_at };
      });
      setProgress(map);
      setEnforced(true);
      setReady(true);
    })();
    return () => { alive = false; };
  }, [real, uid]);

  // Avance del equipo (para la tabla de Usuarios).
  const memberKey = s.users.map((u) => u.id).join(",");
  useEffect(() => {
    if (!real || !isLead || !memberKey) return;
    const db = supabaseBrowser()!.schema("metis");
    db.from("academy_progress").select("user_id, passed_at").in("user_id", memberKey.split(",")).then((r) => {
      if (r.error) return;
      const t: Record<string, number> = {};
      (r.data ?? []).forEach((x: { user_id: string; passed_at: string | null }) => { if (x.passed_at) t[x.user_id] = (t[x.user_id] ?? 0) + 1; });
      setTeam(t);
    });
  }, [real, isLead, memberKey, progress]);

  const saveAttempt = useCallback((moduleId: string, pct: number, passed: boolean) => {
    setProgress((prev) => {
      const row: ModuleProgress = recordAttempt(prev[moduleId], moduleId, pct, passed);
      const next = { ...prev, [moduleId]: row };
      if (!real) localStorage.setItem(DEMO_KEY(uid), JSON.stringify(next));
      else {
        supabaseBrowser()!.schema("metis").from("academy_progress").upsert({
          user_id: uid, module_id: moduleId, best_score: row.bestScore, attempts: row.attempts, passed_at: row.passedAt, updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,module_id" }).then((r) => { if (r.error) console.error("academy", r.error.message); });
      }
      return next;
    });
  }, [real, uid]);

  const value = useMemo<AcademyState>(() => {
    const finished = allDone(progress);
    return {
      ready, enforced, progress, team,
      done: completedCount(progress), total: MODULES.length, finished,
      locked: ready && enforced && !finished && !skipped && !s.isPlatformAdmin,
      previewAll: s.isPlatformAdmin,
      saveAttempt,
      canSkip: s.isPlatformAdmin,
      skip: () => { sessionStorage.setItem(SKIP_KEY, "1"); setSkipped(true); },
      resetDemo: () => { localStorage.removeItem(DEMO_KEY(uid)); setProgress({}); },
    };
  }, [ready, enforced, progress, team, skipped, saveAttempt, s.isPlatformAdmin, uid]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAcademy(): AcademyState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAcademy fuera de AcademyProvider");
  return v;
}
