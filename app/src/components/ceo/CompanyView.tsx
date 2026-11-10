"use client";
/**
 * Empresa · centro de inteligencia del negocio. Hoy responde «qué atiendo ahora»; Empresa responde «cómo está
 * funcionando mi negocio»: causas y evolución, evaluación del consejo, indicadores y estados financieros.
 * Cinco pestañas simples, sin segunda barra lateral: Resumen, Finanzas, Operación, Personas y Consejo.
 */
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useCeo } from "./CeoProvider";
import { useHealth } from "./KpiBoard";
import { CompanyMark } from "./ui";
import { industryOf } from "@/lib/ceo/career/taxonomy";
import { useBusiness } from "./empresa/shared";
import { ResumenTab } from "./empresa/ResumenTab";
import { FinanzasTab } from "./empresa/FinanzasTab";
import { OperacionTab } from "./empresa/OperacionTab";
import { PersonasTab } from "./empresa/PersonasTab";
import { ConsejoTab } from "./empresa/ConsejoTab";
import { EMPRESA_TABS, tabOfHash, type EmpresaTab } from "./empresa/tabs";

export function CompanyView() {
  const c = useCeo();
  const pk = c.pack;
  const h = useHealth();
  const biz = useBusiness();
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
      {/* encabezado: morado profundo, sin brillos decorativos */}
      <header className="rounded-3xl bg-gradient-to-br from-[#0F1130] via-[#1A1650] to-[#2B1F8A] px-5 pt-5 pb-3 sm:px-7 sm:pt-6 text-white">
        <div className="flex flex-wrap items-center gap-4">
          <CompanyMark name={pk.name} size={48} tone="glass" />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-white/60 truncate">{industry}{prof?.specialty ? ` · ${prof.specialty}` : ""} · {pk.city}</div>
            <h1 className="text-[22px] sm:text-2xl font-semibold leading-tight truncate">{pk.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-[13px]">
            <span data-testid="chip-salud" className="rounded-xl bg-white/[.08] border border-white/[.12] px-3 py-1.5">
              Salud empresarial <b className="tabular-nums">{h.value}/100</b> <span className="text-white/60">· {h.cushion >= 0 ? "supera el mínimo" : "debajo del mínimo"}</span>
            </span>
            {biz && biz.score.total > 0 && (
              <span data-testid="chip-operacion" className="rounded-xl bg-white/[.08] border border-white/[.12] px-3 py-1.5">
                Desempeño operativo: <b className="tabular-nums">{biz.score.met} de {biz.score.total}</b> KPI en meta
              </span>
            )}
          </div>
        </div>
        <nav role="tablist" aria-label="Secciones de la empresa" className="mt-5 -mx-1 flex gap-1 overflow-x-auto">
          {EMPRESA_TABS.map((t) => (
            <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} onClick={() => go(t.id)}
              className={clsx("shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all", tab === t.id ? "bg-white text-ink" : "text-white/70 hover:text-white hover:bg-white/10")}>
              {t.label}
            </button>
          ))}
        </nav>
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
