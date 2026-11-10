"use client";
import { useEffect, useState } from "react";
import { Career } from "./Career";
import { Profile } from "./Profile";
import { PillTabs } from "./PillTabs";
import { CAREER_TABS, PROFILE_ANCHORS, careerTabOfHash, type CareerTab } from "./career-tabs";

/** Carrera: una sola pantalla con dos vistas, Mi carrera (trayectoria y veredicto) y Mi perfil (liderazgo, experiencia, bitácora). */
export function CareerHub() {
  const [tab, setTab] = useState<CareerTab>("carrera");

  // Enlaces de otras pantallas: /ceo/carrera#perfil abre Mi perfil; #experiencia y #liderazgo bajan hasta esa sección.
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.replace(/^#/, "");
      setTab(careerTabOfHash(h));
      if ((PROFILE_ANCHORS as readonly string[]).includes(h)) setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const go = (t: CareerTab) => {
    setTab(t);
    history.replaceState(null, "", t === "carrera" ? window.location.pathname : `#${t}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-5" data-testid="carrera">
      <PillTabs tabs={CAREER_TABS} value={tab} onChange={go} label="Vistas de tu carrera" />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="academy-in" key={tab}>
        {tab === "carrera" ? <Career /> : <Profile onCareer={() => go("carrera")} />}
      </div>
    </div>
  );
}
