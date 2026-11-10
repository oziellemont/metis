"use client";
/**
 * Empresa · centro de inteligencia del negocio. Hoy responde «qué atiendo ahora»; Empresa responde «cómo está
 * funcionando mi negocio»: causas y evolución, evaluación del consejo, indicadores y estados financieros.
 * Cinco pestañas simples, sin segunda barra lateral: Resumen, Finanzas, Operación, Personas y Consejo.
 */
import { useEffect, useState } from "react";
import { useCeo } from "./CeoProvider";
import { industryOf } from "@/lib/ceo/career/taxonomy";
import { ResumenTab } from "./empresa/ResumenTab";
import { FinanzasTab } from "./empresa/FinanzasTab";
import { OperacionTab } from "./empresa/OperacionTab";
import { PersonasTab } from "./empresa/PersonasTab";
import { ConsejoTab } from "./empresa/ConsejoTab";
import { PillTabs } from "./PillTabs";
import { EMPRESA_TABS, tabOfHash, type EmpresaTab } from "./empresa/tabs";

export function CompanyView() {
  const c = useCeo();
  const pk = c.pack;
  const [tab, setTab] = useState<EmpresaTab>("resumen");
  const prof = c.s.companyProfile;
  const industry = prof ? industryOf(prof.sectorId, prof.industryId)?.label ?? pk.industry : pk.industry;

  // Enlaces de Hoy, correos y avisos: /ceo/empresa#crecimiento abre Operación y baja hasta el caso abierto.
  useEffect(() => {
    const sync = () => {
      const t = tabOfHash(window.location.hash);
      if (!t) return;
      setTab(t);
      if (window.location.hash === "#crecimiento") setTimeout(() => document.getElementById("crecimiento")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const go = (t: EmpresaTab) => {
    setTab(t);
    history.replaceState(null, "", t === "resumen" ? window.location.pathname : `#${t}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-5" data-testid="empresa">
      {/* encabezado sencillo: nombre, dos datos en una línea y selector tipo pill centrado */}
      <header className="pt-1 text-center">
        <div className="text-[12px] text-slate-500 truncate">{industry}{prof?.specialty ? ` · ${prof.specialty}` : ""} · {pk.city}</div>
        <h1 className="mt-0.5 text-[22px] sm:text-2xl font-semibold leading-tight text-ink truncate">{pk.name}</h1>
        <div className="mt-5"><PillTabs tabs={EMPRESA_TABS} value={tab} onChange={go} label="Secciones de la empresa" /></div>
      </header>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="space-y-5 academy-in" key={tab}>
        {tab === "resumen" && <ResumenTab go={go} />}
        {tab === "finanzas" && <FinanzasTab />}
        {tab === "operacion" && <OperacionTab />}
        {tab === "personas" && <PersonasTab />}
        {tab === "consejo" && <ConsejoTab />}
      </div>
    </div>
  );
}
