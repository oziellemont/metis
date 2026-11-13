"use client";
import { useEffect } from "react";
import { useCeo } from "./CeoProvider";
import { Profile } from "./Profile";
import { PracticePlan } from "./PracticePlan";

/** Secciones de Mi perfil a las que se llega con un ancla desde otras pantallas. */
export const PROFILE_PAGE_ANCHORS = ["temas", "experiencia", "liderazgo"] as const;

/**
 * Mi perfil (MÊTIS 2.0, entrega 3.6): página propia del menú. Reúne lo que la persona nos contó (temas, ritmo y
 * experiencia) y lo que sus decisiones han dejado ver (Mi liderazgo, cómo decide, insignias y bitácora).
 * El cargo y el enlace a la trayectoria solo aparecen con el simulador de empresas a la vista.
 */
export function ProfilePage() {
  const c = useCeo();
  const sim = c.s.settings.simulador === true;

  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.replace(/^#/, "");
      if ((PROFILE_PAGE_ANCHORS as readonly string[]).includes(h)) setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <div data-testid="mi-perfil">
      <Profile career={sim} slot={<PracticePlan />} />
    </div>
  );
}
