"use client";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Check, Crown, Lock, RotateCcw, Trophy, X } from "lucide-react";
import { KPI_KEYS, nextCompanyOf, rulesOf } from "@/lib/ceo/engine";
import { COMPANIES, UPCOMING, companyById } from "@/lib/ceo/companies";
import { useCeo } from "./CeoProvider";
import { Bar } from "./ui";

/** Mi carrera: el veredicto del consejo, el camino de empresas y el ascenso. */
export function Career() {
  const c = useCeo();
  const pk = c.pack;
  const v = c.verdict;
  const r = c.rules;
  const career = c.s.career ?? [];
  const passedIds = new Set(career.filter((x) => x.passed).map((x) => x.company));
  const next = rulesOf(career.filter((x) => x.passed).length + 1 + (c.s.legendary ? 2 : 0));
  const nextPick = nextCompanyOf(c.s);
  const confirmAdvance = () => {
    const msg = v.passed ? `¿Listo para dejar ${pk.name}? Tu siguiente empresa será una sorpresa.` : `¿Volver a empezar ${pk.name}? Conservas tu XP, tu racha y lo aprendido.`;
    if (window.confirm(msg)) c.advance();
  };

  return (
    <div className="space-y-5">
      {/* veredicto */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] p-6 sm:p-8 text-white">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-light/30 blur-3xl" />
        <div className="relative">
          <div className="text-xs text-white/60">{pk.emoji} {pk.name} · {pk.industry} · Exigencia: {r.name}</div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight">
            {!c.seasonDone ? (c.changeOpen ? "Te falta el reto final: el cambio." : "El consejo te evalúa al cierre del nivel.") : v.passed ? `Aprobaste ${pk.short}.` : `Todavía no apruebas ${pk.short}.`}
          </h1>
          <p className="mt-2 text-sm text-white/70 max-w-xl">
            {!c.seasonDone
              ? `${c.changeOpen ? "Cerraste los asuntos. Presenta tu proyecto de cambio al consejo para recibir el veredicto. " : "El nivel cierra con un reto de cambio cuando termines tus asuntos. "}Para ascender necesitas cerrar con todos los rubros en ${v.passLine} o más y responder al menos el ${Math.round(r.minAnswered * 100)}% de los asuntos. No basta con un buen promedio: el consejo revisa cada rubro.`
              : v.passed
                ? "El consejo firmó tu evaluación. Otra empresa, de otro giro, ya preguntó por ti. Allá los golpes pegan más fuerte y los plazos son más cortos."
                : "Algunos rubros quedaron debajo de la línea. Puedes volver a dirigir la misma empresa con lo que ya sabes y probar otros caminos."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {KPI_KEYS.map((k) => (
              <div key={k} className="rounded-2xl bg-white/10 p-3.5">
                <div className="flex items-center justify-between text-[11px] text-white/60"><span className="truncate">{pk.kpiLabel[k]}</span>{v.approved[k] ? <Check size={13} className="text-white" strokeWidth={3} /> : <X size={13} className="text-coral" strokeWidth={3} />}</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{v.kpis[k]}<span className="text-xs text-white/40"> / {v.passLine}</span></div>
                <Bar value={v.kpis[k]} line={v.passLine} dark className="mt-2" />
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-white/60">Asuntos respondidos a tiempo: <b className={clsx("tabular-nums", v.answeredOk ? "text-white" : "text-coral")}>{Math.round(v.answered * 100)}%</b> (mínimo {Math.round(r.minAnswered * 100)}%)</div>

          {c.seasonDone && (
            <button onClick={confirmAdvance} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-white/90">
              {v.passed ? <><Trophy size={16} /> Aceptar el nuevo nombramiento <ArrowRight size={15} /></> : <><RotateCcw size={16} /> Volver a dirigir {pk.short}</>}
            </button>
          )}
          {!c.seasonDone && c.changeOpen && <Link href="/ceo/cambio" className="mt-6 mr-2 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-white/90">Ir al reto final <ArrowRight size={15} /></Link>}
          {!c.seasonDone && !c.changeOpen && <Link href="/ceo" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/15">Seguir dirigiendo <ArrowRight size={15} /></Link>}
        </div>
      </section>

      {/* camino */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-ink">Tu camino como CEO</h2>
          <span className="text-xs text-slate-400">{passedIds.size} de {COMPANIES.length} empresas aprobadas</span>
        </div>
        <ol className="mt-5 relative space-y-3 before:absolute before:left-[23px] before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-soft">
          {career.map((run, i) => {
            const co = companyById(run.company);
            return (
              <li key={i} className="relative flex gap-4 items-start">
                <span className={clsx("relative z-10 h-12 w-12 rounded-2xl grid place-items-center text-xl shrink-0", run.passed ? "bg-indigo text-white" : "bg-slate-100")}>{co.emoji}</span>
                <div className="flex-1 min-w-0 rounded-2xl border border-slate-100 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-ink text-sm">{co.name}</span><span className={clsx("chip text-[10px]", run.passed ? "bg-indigo-soft text-indigo" : "bg-coral-soft text-coral")}>{run.passed ? "Aprobada" : "No aprobada"}</span><span className="text-[11px] text-slate-400">{rulesOf(run.tier).name}</span></div>
                  <div className="mt-1 text-xs text-slate-500">Salud {run.health}/100 · {run.answered}% respondido · +{run.xp} XP</div>
                </div>
              </li>
            );
          })}
          <li className="relative flex gap-4 items-start">
            <span className="relative z-10 h-12 w-12 rounded-2xl grid place-items-center text-xl shrink-0 bg-gradient-to-br from-[#6D5DF6] via-[#4F3FE0] to-[#2B1F8A] ring-4 ring-indigo-soft">{pk.emoji}</span>
            <div className="flex-1 min-w-0 rounded-2xl border-2 border-indigo/30 bg-indigo-soft/30 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-ink text-sm">{pk.name}</span><span className="chip bg-indigo text-white text-[10px]">Ahora</span><span className="text-[11px] text-slate-400">{r.name} · línea {r.passLine}</span></div>
              <div className="mt-1 text-xs text-slate-500">{pk.industry} · Día {c.day} de {pk.season.days}</div>
            </div>
          </li>
          <li className="relative flex gap-4 items-start">
            <span className="relative z-10 h-12 w-12 rounded-2xl grid place-items-center shrink-0 bg-white border-2 border-dashed border-indigo/30 text-indigo"><Lock size={18} /></span>
            <div className="flex-1 min-w-0 rounded-2xl border border-dashed border-slate-200 px-4 py-3">
              <div className="font-semibold text-ink text-sm">{nextPick.legendary ? "Modo Legendario" : "Siguiente empresa: sorpresa"}</div>
              <div className="mt-1 text-xs text-slate-500">
                {nextPick.legendary ? "Ya aprobaste todos los giros. Vuelves a una empresa conocida, pero con exigencia Legendaria: golpes más duros y línea de aprobación más alta." : `Otro giro, elegido al azar. Exigencia «${next.name}»: línea de aprobación ${next.passLine}, plazos ${Math.round((1 - next.deadline) * 100)}% más cortos.`}
              </div>
            </div>
          </li>
        </ol>
      </section>

      {/* industrias */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Industrias</h2>
        <p className="mt-1 text-sm text-slate-500">Cada empresa tiene su idioma, su red de relaciones y sus dilemas. Aprueba las tres para desbloquear el modo Legendario.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANIES.map((co) => {
            const done = passedIds.has(co.id), now = co.id === pk.id;
            return (
              <div key={co.id} className={clsx("rounded-2xl border p-4", now ? "border-indigo/40 bg-indigo-soft/30" : "border-slate-100")}>
                <div className="flex items-center gap-3"><span className="text-2xl">{co.emoji}</span><div className="min-w-0"><div className="font-semibold text-sm text-ink truncate">{co.name}</div><div className="text-[11px] text-slate-500">{co.industry}</div></div>{done && <Crown size={16} className="ml-auto text-indigo" />}</div>
                <p className="mt-2 text-xs text-slate-500">{co.tagline}</p>
              </div>
            );
          })}
          {UPCOMING.map((co) => (
            <div key={co.id} className="rounded-2xl border border-dashed border-slate-200 p-4 opacity-70">
              <div className="flex items-center gap-3"><span className="text-2xl grayscale">{co.emoji}</span><div className="min-w-0"><div className="font-semibold text-sm text-ink truncate">{co.name}</div><div className="text-[11px] text-slate-500">{co.industry}</div></div><span className="ml-auto chip bg-slate-100 text-slate-500 text-[10px]">Próximamente</span></div>
              <p className="mt-2 text-xs text-slate-500">{co.tagline}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
