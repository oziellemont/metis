"use client";
/**
 * Empresa · centro de inteligencia del negocio. Hoy responde «qué atiendo ahora»; Empresa responde «cómo está
 * funcionando mi negocio»: causas y evolución, evaluación del consejo, indicadores y estados financieros.
 * Cinco pestañas simples, sin segunda barra lateral: Resumen, Finanzas, Operación, Personas y Consejo.
 */
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useCeo } from "./CeoProvider";
import { industryOf } from "@/lib/ceo/career/taxonomy";
import { ResumenTab } from "./empresa/ResumenTab";
import { FinanzasTab } from "./empresa/FinanzasTab";
import { OperacionTab } from "./empresa/OperacionTab";
import { PersonasTab } from "./empresa/PersonasTab";
import { ConsejoTab } from "./empresa/ConsejoTab";
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
        <div className="mt-5 flex justify-center">
          <nav role="tablist" aria-label="Secciones de la empresa"
            className="flex w-full sm:w-auto items-center gap-0.5 sm:gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgba(23,26,58,.06),0_6px_20px_-10px_rgba(23,26,58,.18)]">
            {EMPRESA_TABS.map((t) => (
              <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} onClick={() => go(t.id)}
                className={clsx(
                  "flex-1 sm:flex-none min-w-0 whitespace-nowrap rounded-full px-1.5 sm:px-5 py-2 text-[12px] sm:text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-light/50",
                  tab === t.id ? "bg-indigo text-white shadow-[0_2px_8px_-2px_rgba(79,63,224,.55)]" : "text-slate-500 hover:text-ink hover:bg-slate-50",
                )}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
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
