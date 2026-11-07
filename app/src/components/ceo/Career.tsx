"use client";
import Link from "next/link";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Crown, Flag, Lock, RotateCcw, X } from "lucide-react";
import { KPI_KEYS, LEGACY_RULES_VERSION, boardReviewOf, nextCompanyOf, rulesOf, type Verdict } from "@/lib/ceo/engine";
import { COMPANY_STAGES } from "@/lib/ceo/career/identity";
import { LEGACY_ROTATION, companyById } from "@/lib/ceo/companies";
import { celebrateOnce } from "@/lib/ceo/celebrate";
import { useCeo } from "./CeoProvider";
import { Bar, CompanyMark } from "./ui";
import { Trajectory } from "./Trajectory";

/** Mi carrera: la trayectoria de tu mandato (única fuente: trajectoryOf), el veredicto del consejo y tus meses al frente. */
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
  const t = c.trajectory;
  const cont = c.continuous;
  const passedNow = c.seasonDone && v.passed;
  useEffect(() => { if (passedNow) celebrateOnce(`company:${pk.id}:${c.s.startedAt}:${career.length}`, "company"); }, [passedNow, pk.id, c.s.startedAt, career.length]);
  const confirmAdvance = () => {
    const msg = cont ? `¿Cerrar este periodo en ${pk.name}? Sigues al frente de la misma empresa; tu historial, tu XP y tu racha se conservan.` : v.passed ? `¿Listo para dejar ${pk.name}? Tu siguiente empresa será una sorpresa.` : `¿Volver a empezar ${pk.name}? Conservas tu XP, tu racha y lo aprendido.`;
    if (!window.confirm(msg)) return;
    c.advance();
    if (cont) router.push("/ceo/reporte");
  };
  const reportFirst = cont && c.seasonDone && c.reportDue !== null;
  const review = cont ? boardReviewOf(c.s, c.now) : null;
  const stageName = t.chapter.label;
  const nextName = review && review.next !== null ? COMPANY_STAGES[review.next].label : null;
  const reviewText = !review ? "" : review.next === null
    ? `${pk.short} está en «${stageName}», el capítulo de mayor complejidad. El consejo sigue revisando cada mes.`
    : review.advances
      ? `Si cierras este mes así, ${pk.short} abre el capítulo «${nextName}».`
      : review.stage === 0
        ? `Capítulo «${stageName}»: tu primer mes en la empresa.`
        : `Capítulo «${stageName}» · mes ${review.months + 1}. ${t.chapter.next?.text ?? ""}`;

  return (
    <div className="space-y-5">
      <Trajectory t={t} short={pk.short} now={c.now} kpiLabel={pk.kpiLabel} />

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
              ? v.v5 ? `${c.changeOpen ? "Cerraste los asuntos. Presenta tu proyecto de cambio al consejo para recibir el veredicto. " : cont ? "El periodo cierra con un reto de cambio cuando termines tus asuntos. " : "El nivel cierra con un reto de cambio cuando termines tus asuntos. "}El consejo revisa tres cosas: que cumplas lo que te encargó, que la empresa cierre sana y que tus decisiones estén bien razonadas. Un indicador apenas debajo de la línea no te reprueba si lo demás está sano.`
              : `${c.changeOpen ? "Cerraste los asuntos. Presenta tu proyecto de cambio al consejo para recibir el veredicto. " : "El nivel cierra con un reto de cambio cuando termines tus asuntos. "}Para aprobar necesitas cerrar con todos los rubros en ${v.passLine} o más${r.minAnswered > 0 ? ` y responder al menos el ${Math.round(r.minAnswered * 100)}% de los asuntos` : ""}. No basta con un buen promedio: el consejo revisa cada rubro.`
              : cont
                ? (v.v5
                  ? (v.passed ? "Cumpliste el encargo del consejo, la empresa cerró sana y tu criterio sostuvo los resultados. Sigues al frente: el siguiente periodo arranca con lo que dejaste construido." : "El consejo no aprobó este periodo. Abajo está por qué, en concreto. Sigues al frente de la misma empresa, sin despido: el siguiente periodo es para corregirlo.")
                  : (v.passed ? "El consejo firmó tu evaluación del periodo. Sigues al frente: el siguiente periodo arranca con lo que dejaste construido." : "Algunos rubros quedaron debajo de la línea. Sigues al frente de la misma empresa: el siguiente periodo es para corregirlos."))
              : v.passed
                ? v.v5 ? "Cumpliste el encargo del consejo, la empresa cerró sana y tu criterio sostuvo los resultados. Otra empresa, de otro giro, ya preguntó por ti." : "El consejo firmó tu evaluación. Otra empresa, de otro giro, ya preguntó por ti. Allá los golpes pegan más fuerte y los plazos son más cortos."
                : v.v5 ? "El consejo pide otra vuelta. Abajo está por qué, en concreto. Puedes volver a dirigir la misma empresa con lo que ya sabes." : "Algunos rubros quedaron debajo de la línea. Puedes volver a dirigir la misma empresa con lo que ya sabes y probar otros caminos."}
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
          {v.v5 && <V5Panel v5={v.v5} done={c.seasonDone} kpiLabel={pk.kpiLabel} health={v.health} cont={cont} />}
          {review && <div className="mt-4 rounded-2xl bg-indigo-soft/40 px-4 py-3 text-sm text-ink">{reviewText}</div>}
          {!v.v5 && <div className="mt-3 text-xs text-slate-500">Asuntos respondidos a tiempo: <b className={clsx("tabular-nums", v.answeredOk ? "text-ink" : "text-coral")}>{Math.round(v.answered * 100)}%</b> {r.minAnswered > 0 ? `(mínimo ${Math.round(r.minAnswered * 100)}%)` : "· Un asunto vencido tiene consecuencias en la empresa, pero no te reprueba por sí solo."}</div>}

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
          <h2 className="font-semibold text-ink">{cont ? `Revisiones del consejo en ${pk.short}` : "Tu camino de empresas"}</h2>
          <span className="text-xs text-slate-400">{cont ? `${career.length} ${career.length === 1 ? "mes cerrado" : "meses cerrados"}` : `${passedIds.size} de ${LEGACY_ROTATION.length} empresas aprobadas`}</span>
        </div>
        <ol className="mt-5 relative space-y-3 before:absolute before:left-[23px] before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-soft">
          {career.map((run, i) => {
            const co = cont && run.company === pk.id ? pk : companyById(run.company);
            return (
              <li key={i} className="relative flex gap-4 items-start">
                <CompanyMark name={co.name} size={48} tone={run.passed ? "solid" : "muted"} className="relative z-10" />
                <div className="flex-1 min-w-0 rounded-2xl border border-slate-100 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-ink text-sm">{co.name}</span><span className={clsx("chip text-[10px]", run.passed ? "bg-indigo-soft text-indigo" : "bg-coral-soft text-coral")}>{cont ? (run.passed ? "Aprobado" : "Pidió corregir") : run.passed ? "Aprobada" : "No aprobada"}</span><span className="text-[11px] text-slate-400">{rulesOf(run.tier, run.rulesVersion ?? LEGACY_RULES_VERSION).name}</span></div>
                  <div className="mt-1 text-xs text-slate-500">{cont && t.reviews[i] ? `Mes ${i + 1} · ${t.reviews[i].chapter}${t.reviews[i].opened ? ` · abrió «${t.reviews[i].opened}»` : ""} · ` : ""}Salud {run.health}/100 · {run.answered}% respondido</div>
                </div>
              </li>
            );
          })}
          <li className="relative flex gap-4 items-start">
            <CompanyMark name={pk.name} size={48} tone="solid" className="relative z-10 ring-4 ring-indigo-soft" />
            <div className="flex-1 min-w-0 rounded-2xl border-2 border-indigo/30 bg-indigo-soft/30 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-ink text-sm">{pk.name}</span><span className="chip bg-indigo text-white text-[10px]">Ahora</span><span className="text-[11px] text-slate-400">{r.name} · línea {r.passLine}</span></div>
              <div className="mt-1 text-xs text-slate-500">{pk.industry} · {cont ? `Mes ${career.length + 1} · ${stageName}` : `Día ${c.day} de ${pk.season.days}`}</div>
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
        </ol>
      </section>

      {/* industrias (solo carrera por temporadas) */}
      {!cont && <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Industrias</h2>
        <p className="mt-1 text-sm text-slate-500">Cada empresa tiene su idioma, su red de relaciones y sus dilemas. Aprueba las tres para desbloquear el modo Legendario.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEGACY_ROTATION.map((co) => {
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

/** Veredicto V5: lo que el consejo revisa (encargo, salud, criterio) y, al cierre, por qué aprobaste o no. */
function V5Panel({ v5, done, kpiLabel, health, cont }: { v5: NonNullable<Verdict["v5"]>; done: boolean; kpiLabel: Record<string, string>; health: number; cont?: boolean }) {
  const pct = Math.round(v5.judgment.ratio * 100);
  const jOk = v5.judgment.ratio >= v5.judgment.min;
  const Row = ({ ok, label, value, testid }: { ok: boolean; label: string; value: string; testid: string }) => (
    <li data-testid={testid} data-ok={ok ? "si" : "no"} className="flex items-start justify-between gap-3 py-2 text-sm">
      <span className="flex items-start gap-2 text-ink">{ok ? <Check size={14} className="mt-0.5 shrink-0 text-mint" strokeWidth={3} /> : <X size={14} className="mt-0.5 shrink-0 text-coral" strokeWidth={3} />}{label}</span>
      <span className={clsx("shrink-0 tabular-nums text-xs font-semibold", ok ? "text-slate-500" : "text-coral")}>{value}</span>
    </li>
  );
  return (
    <div data-testid="veredicto-v5" className="mt-5 rounded-2xl border border-slate-100 p-4 sm:p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lo que revisa el consejo</div>
      {v5.objectiveText && <p className="mt-1 text-sm text-slate-600">Tu encargo: <b className="text-ink">{v5.objectiveText}</b></p>}
      <ul className="mt-2 divide-y divide-slate-100">
        {v5.objectives.map((o) => <Row key={o.kpi} testid="v5-objetivo" ok={o.ok} label={`Objetivo: ${kpiLabel[o.kpi]} en la línea o arriba`} value={String(o.value)} />)}
        <Row testid="v5-salud" ok={health >= v5.healthMin} label={`Salud promedio de ${v5.healthMin} o más, sin indicadores por debajo de ${v5.floor}`} value={String(health)} />
        <Row testid="v5-criterio" ok={jOk} label={`Al menos ${Math.round(v5.judgment.min * 100)} % de asuntos bien razonados`} value={`${v5.judgment.good} de ${v5.judgment.total} · ${pct} %`} />
      </ul>
      <p className="mt-2 text-[11px] text-slate-500">Además: la caja no puede caer en insolvencia, el consejo debe seguir respaldándote y no se cruzan líneas rojas (seguridad, fraude, represalias, ocultar riesgos).{v5.cashFlow ? ` Al cierre, ${cont ? `la operación del mes ${v5.cashFlow > 0 ? "sumó" : "restó"}` : `el margen ${v5.cashFlow > 0 ? "sumó" : "restó"}`} ${Math.abs(v5.cashFlow)} puntos de caja.` : cont ? " Al cierre, la operación del mes genera caja: lo que deja el negocio, más o menos los cambios de precio y costo que firmaste." : " Al cierre, el margen se convierte en caja: un buen margen la repone; uno malo la consume."}</p>
      {done && v5.why.length > 0 && (
        <div data-testid="v5-razones" className="mt-3 rounded-xl bg-coral-soft/50 px-3.5 py-3 text-sm text-ink">
          <div className="font-semibold">{cont ? "Por qué el consejo no aprobó este periodo" : "Por qué el consejo pide otra vuelta"}</div>
          <ul className="mt-1 list-disc space-y-1 pl-5">{v5.why.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
