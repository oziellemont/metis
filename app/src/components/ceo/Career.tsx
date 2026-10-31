"use client";
import Link from "next/link";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Award, Check, Crown, Lock, RotateCcw, X } from "lucide-react";
import { KPI_KEYS, LEGACY_RULES_VERSION, nextCompanyOf, profileOf, rulesOf } from "@/lib/ceo/engine";
import { COMPANIES, companyById } from "@/lib/ceo/companies";
import { STAGES } from "@/lib/ceo/journey";
import { celebrate, celebrateOnce } from "@/lib/ceo/celebrate";
import { COMPETENCY_IDS, countAtLeast } from "@/lib/ceo/mastery";
import { useCeo } from "./CeoProvider";
import { Bar, CompanyMark } from "./ui";
import { AppointmentModal, RequirementTile, StageTrack } from "./Journey";

/** Mi carrera: el Executive Journey, el veredicto del consejo, el camino de empresas y el ascenso. */
export function Career() {
  const c = useCeo();
  const router = useRouter();
  const pk = c.pack;
  const v = c.verdict;
  const r = c.rules;
  const career = c.s.career ?? [];
  const passedIds = new Set(career.filter((x) => x.passed).map((x) => x.company));
  const next = rulesOf(career.filter((x) => x.passed).length + 1 + (c.s.legendary ? 2 : 0));
  const nextPick = nextCompanyOf(c.s);
  const j = c.journey;
  const m = c.mastery;
  const cont = c.continuous;
  const [appointed, setAppointed] = useState<{ stage: string; rows: { label: string; value: string }[] } | null>(null);
  const receive = () => {
    const name = c.appoint();
    if (!name) return;
    celebrate("appointment");
    const best = COMPETENCY_IDS.slice().sort((a, b) => m[b].value - m[a].value)[0];
    setAppointed({
      stage: name,
      rows: [
        { label: cont ? "Periodos aprobados" : "Empresas aprobadas", value: String(career.filter((x) => x.passed).length) },
        { label: "Competencias en Competent o más", value: `${countAtLeast(m, 40)} de 8` },
        { label: "Fortaleza principal", value: `${m[best].name} · ${m[best].value}` },
        { label: "Estilo de dirección", value: profileOf(c.s, c.now).archetype.name },
      ],
    });
  };
  const passedNow = c.seasonDone && v.passed;
  useEffect(() => { if (passedNow) celebrateOnce(`company:${pk.id}:${c.s.startedAt}:${career.length}`, "company"); }, [passedNow, pk.id, c.s.startedAt, career.length]);
  const confirmAdvance = () => {
    const msg = cont ? `¿Cerrar este periodo en ${pk.name}? Sigues al frente de la misma empresa; tu historial, tu XP y tu racha se conservan.` : v.passed ? `¿Listo para dejar ${pk.name}? Tu siguiente empresa será una sorpresa.` : `¿Volver a empezar ${pk.name}? Conservas tu XP, tu racha y lo aprendido.`;
    if (!window.confirm(msg)) return;
    c.advance();
    if (cont) router.push("/ceo/reporte");
  };
  const reportFirst = cont && c.seasonDone && c.reportDue !== null;

  return (
    <div className="space-y-5">
      {appointed && <AppointmentModal stage={appointed.stage} rows={appointed.rows} onClose={() => setAppointed(null)} />}
      {/* executive journey */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-8 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div className="relative">
          <div className="text-xs text-white/60">Executive Journey · Stage {j.stage + 1} de {STAGES.length}</div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight">{j.name}</h1>
          <p className="mt-1 text-sm text-white/60">{j.es}</p>
          {j.next ? (
            <p className="mt-4 text-sm text-white/80 max-w-xl">
              {j.ready
                ? `Cumples todo lo que pide el Consejo. Tu nombramiento como ${j.next.name} está listo.`
                : <>Siguiente nombramiento: <b className="text-white">{j.next.name}</b>. Llevas {j.met} de {j.total} requisitos. Tu etapa sube por lo que demuestras, no por el XP.</>}
            </p>
          ) : <p className="mt-4 text-sm text-white/80 max-w-xl">{cont ? `Llegaste a la última etapa. Sigue al frente de ${pk.short} y mantén tu criterio en forma.` : "Llegaste a la última etapa. Sigue dirigiendo empresas en modo Legendario y mantén tu criterio en forma."}</p>}
          {j.requirements.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {j.requirements.map((q) => <RequirementTile key={q.id} r={q} m={m} dark />)}
            </div>
          )}
          {j.ready && (
            <button onClick={receive} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-white/90">
              <Award size={16} /> Recibir nombramiento <ArrowRight size={15} />
            </button>
          )}
          <div className="mt-8"><StageTrack stage={j.stage} dark /></div>
          {j.founder && <div className="mt-5 text-[11px] text-white/50">Distinción fundadora: {j.founder.name} · jugabas antes del Executive Journey.</div>}
        </div>
      </section>

      {/* veredicto */}
      <section className="card p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-3">
            <CompanyMark name={pk.name} size={40} />
            <div className="text-xs text-slate-500">{pk.name} · {pk.industry} · Exigencia: {r.name}</div>
          </div>
          <h2 className="mt-4 text-xl sm:text-2xl font-semibold leading-tight text-ink">
            {!c.seasonDone ? (c.changeOpen ? "Te falta el reto final: el cambio." : cont ? "El consejo te evalúa al cierre del periodo." : "El consejo te evalúa al cierre del nivel.") : v.passed ? (cont ? `Periodo aprobado en ${pk.short}.` : `Aprobaste ${pk.short}.`) : (cont ? `Periodo por debajo de la línea en ${pk.short}.` : `Todavía no apruebas ${pk.short}.`)}
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-xl">
            {!c.seasonDone
              ? `${c.changeOpen ? "Cerraste los asuntos. Presenta tu proyecto de cambio al consejo para recibir el veredicto. " : "El nivel cierra con un reto de cambio cuando termines tus asuntos. "}Para ascender necesitas cerrar con todos los rubros en ${v.passLine} o más${r.minAnswered > 0 ? ` y responder al menos el ${Math.round(r.minAnswered * 100)}% de los asuntos` : ""}. No basta con un buen promedio: el consejo revisa cada rubro.`
              : cont
                ? (v.passed ? "El consejo firmó tu evaluación del periodo. Sigues al frente: el siguiente periodo arranca con lo que dejaste construido." : "Algunos rubros quedaron debajo de la línea. Sigues al frente de la misma empresa: el siguiente periodo es para corregirlos.")
              : v.passed
                ? "El consejo firmó tu evaluación. Otra empresa, de otro giro, ya preguntó por ti. Allá los golpes pegan más fuerte y los plazos son más cortos."
                : "Algunos rubros quedaron debajo de la línea. Puedes volver a dirigir la misma empresa con lo que ya sabes y probar otros caminos."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {KPI_KEYS.map((k) => (
              <div key={k} className="rounded-2xl border border-slate-100 p-3.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500"><span className="truncate">{pk.kpiLabel[k]}</span>{v.approved[k] ? <Check size={13} className="text-mint" strokeWidth={3} /> : <X size={13} className="text-coral" strokeWidth={3} />}</div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-ink">{v.kpis[k]}<span className="text-xs text-slate-400"> / {v.passLine}</span></div>
                <Bar value={v.kpis[k]} line={v.passLine} className="mt-2" />
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-500">Asuntos respondidos a tiempo: <b className={clsx("tabular-nums", v.answeredOk ? "text-ink" : "text-coral")}>{Math.round(v.answered * 100)}%</b> {r.minAnswered > 0 ? `(mínimo ${Math.round(r.minAnswered * 100)}%)` : "· Un asunto vencido tiene consecuencias en la empresa, pero no te reprueba por sí solo."}</div>

          {reportFirst && (
            <Link href="/ceo/reporte" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo px-5 py-3 text-sm font-semibold text-white hover:bg-indigo/90">Revisar el reporte del mes {c.reportDue} para cerrar este periodo <ArrowRight size={15} /></Link>
          )}
          {c.seasonDone && !reportFirst && (
            <button onClick={confirmAdvance} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo px-5 py-3 text-sm font-semibold text-white hover:bg-indigo/90">
              {cont ? <>Cerrar el periodo y seguir <ArrowRight size={15} /></> : v.passed ? <>Ir a la siguiente empresa <ArrowRight size={15} /></> : <><RotateCcw size={16} /> Volver a dirigir {pk.short}</>}
            </button>
          )}
          {!c.seasonDone && c.changeOpen && <Link href="/ceo/cambio" className="mt-6 mr-2 inline-flex items-center gap-2 rounded-xl bg-indigo px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo/90">Ir al reto final <ArrowRight size={15} /></Link>}
          {!c.seasonDone && !c.changeOpen && <Link href="/ceo" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-soft px-5 py-2.5 text-sm font-medium text-indigo hover:bg-indigo-soft/70">Seguir dirigiendo <ArrowRight size={15} /></Link>}
        </div>
      </section>

      {/* camino */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-ink">{cont ? `Tus periodos en ${pk.short}` : "Tu camino de empresas"}</h2>
          <span className="text-xs text-slate-400">{cont ? `${career.filter((x) => x.passed).length} de ${career.length} periodos aprobados` : `${passedIds.size} de ${COMPANIES.length} empresas aprobadas`}</span>
        </div>
        <ol className="mt-5 relative space-y-3 before:absolute before:left-[23px] before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-soft">
          {career.map((run, i) => {
            const co = cont && run.company === pk.id ? pk : companyById(run.company);
            return (
              <li key={i} className="relative flex gap-4 items-start">
                <CompanyMark name={co.name} size={48} tone={run.passed ? "solid" : "muted"} className="relative z-10" />
                <div className="flex-1 min-w-0 rounded-2xl border border-slate-100 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-ink text-sm">{co.name}</span><span className={clsx("chip text-[10px]", run.passed ? "bg-indigo-soft text-indigo" : "bg-coral-soft text-coral")}>{run.passed ? "Aprobada" : "No aprobada"}</span><span className="text-[11px] text-slate-400">{rulesOf(run.tier, run.rulesVersion ?? LEGACY_RULES_VERSION).name}</span></div>
                  <div className="mt-1 text-xs text-slate-500">Salud {run.health}/100 · {run.answered}% respondido · +{run.xp} XP</div>
                </div>
              </li>
            );
          })}
          <li className="relative flex gap-4 items-start">
            <CompanyMark name={pk.name} size={48} tone="solid" className="relative z-10 ring-4 ring-indigo-soft" />
            <div className="flex-1 min-w-0 rounded-2xl border-2 border-indigo/30 bg-indigo-soft/30 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-ink text-sm">{pk.name}</span><span className="chip bg-indigo text-white text-[10px]">Ahora</span><span className="text-[11px] text-slate-400">{r.name} · línea {r.passLine}</span></div>
              <div className="mt-1 text-xs text-slate-500">{pk.industry} · Día {c.day} de {pk.season.days}</div>
            </div>
          </li>
          {!cont && <li className="relative flex gap-4 items-start">
            <span className="relative z-10 h-12 w-12 rounded-full grid place-items-center shrink-0 bg-white border-2 border-dashed border-indigo/30 text-indigo"><Lock size={18} /></span>
            <div className="flex-1 min-w-0 rounded-2xl border border-dashed border-slate-200 px-4 py-3">
              <div className="font-semibold text-ink text-sm">{nextPick.legendary ? "Modo Legendario" : "Siguiente empresa: sorpresa"}</div>
              <div className="mt-1 text-xs text-slate-500">
                {nextPick.legendary ? "Ya aprobaste todos los giros. Vuelves a una empresa conocida, pero con exigencia Legendaria: golpes más duros y línea de aprobación más alta." : `Otro giro, elegido al azar. Exigencia «${next.name}»: línea de aprobación ${next.passLine}, plazos ${Math.round((1 - next.deadline) * 100)}% más cortos.`}
              </div>
            </div>
          </li>}
          <li className="relative flex gap-4 items-start">
            <span className={clsx("relative z-10 h-12 w-12 rounded-full grid place-items-center shrink-0", j.ready ? "bg-indigo text-white" : "bg-white border-2 border-dashed border-slate-200 text-slate-400")}><Award size={18} /></span>
            <div className={clsx("flex-1 min-w-0 rounded-2xl px-4 py-3", j.ready ? "border-2 border-indigo/30 bg-indigo-soft/30" : "border border-dashed border-slate-200")}>
              <div className="font-semibold text-ink text-sm">Junta de nombramiento</div>
              <div className="mt-1 text-xs text-slate-500">{j.next ? (j.ready ? `Lista. Recibe tu nombramiento como ${j.next.name}.` : `${j.next.name} · ${j.met} de ${j.total} requisitos cumplidos.`) : "Ya eres Global CEO."}</div>
            </div>
          </li>
        </ol>
      </section>

      {/* industrias (solo carrera por temporadas) */}
      {!cont && <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Industrias</h2>
        <p className="mt-1 text-sm text-slate-500">Cada empresa tiene su idioma, su red de relaciones y sus dilemas. Aprueba las tres para desbloquear el modo Legendario.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANIES.map((co) => {
            const done = passedIds.has(co.id), now = co.id === pk.id;
            return (
              <div key={co.id} className={clsx("rounded-2xl border p-4", now ? "border-indigo/40 bg-indigo-soft/30" : "border-slate-100")}>
                <div className="flex items-center gap-3"><CompanyMark name={co.name} size={36} /><div className="min-w-0"><div className="font-semibold text-sm text-ink truncate">{co.name}</div><div className="text-[11px] text-slate-500">{co.industry}</div></div>{done && <Crown size={16} className="ml-auto text-indigo" />}</div>
                <p className="mt-2 text-xs text-slate-500">{co.tagline}</p>
              </div>
            );
          })}
        </div>
      </section>}
    </div>
  );
}
