"use client";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import clsx from "clsx";
import { ArrowRight, BookOpen, Check, Briefcase, Clock, Coffee, FastForward, Flag, Hourglass, Trophy } from "lucide-react";
import { KPI_KEYS, closedRunsOf, growthDayOf } from "@/lib/ceo/engine";
import { growthAt, isRetailLog, isSteelLog, pendingGrowth, retailOf, retailPendingOf, steelOf, steelPendingOf } from "@/lib/ceo/growth/session";
import { todayLineOf } from "@/lib/ceo/growth/view";
import { alertsOf } from "@/lib/ceo/growth/ops";
import { AlertChips } from "./GrowthPanel";
import { steelAlerts } from "./SteelPanel";
import { retailAlerts } from "./RetailPanel";
import { Globe2, TrendingUp } from "lucide-react";
import { COHERENCE_RULES_VERSION, CONTINUOUS_RULES_VERSION, ECONOMY_RULES_VERSION } from "@/lib/ceo/rules";
import { ETHICS_AUDIT_RULES } from "@/lib/ceo/editorial";
import { firstName, personOf } from "@/lib/ceo/cast";
import { LESSONS } from "@/lib/ceo/lessons";
import { useCeo } from "./CeoProvider";
import { track } from "@/lib/ceo/events";
import { DilemmaPrompt } from "./DilemmaPrompt";
import { boardAccess } from "@/lib/ceo/board";
import { crisisAccess } from "@/lib/ceo/crisis";
import { specialTasks } from "@/lib/ceo/today";
import { rankOf } from "@/lib/ceo/lessons";
import { nextLessonXp, rankFor } from "@/lib/ceo/engine";
import { nudgeQuiet, shouldNudge } from "@/lib/ceo/profile";
import { Avatar, ChannelChip, Flame, rel, until } from "./ui";
import { headlineOf } from "@/lib/ceo/trajectory";
import { COMPANY_STAGES } from "@/lib/ceo/career/identity";
import { presenterOf } from "@/lib/ceo/business/report";
import { alertsAt } from "@/lib/ceo/season-report";
import { KpiBoard } from "./KpiBoard";

export function Today() {
  const c = useCeo();
  const first = c.s.name.split(" ")[0] || "CEO";
  const pk = c.pack;
  const v = c.verdict;
  const hr = new Date(c.now).getHours();
  const hello = hr < 12 ? "Buenos días" : hr < 19 ? "Buenas tardes" : "Buenas noches";
  const lastDecided = [...c.entries].filter((e) => e.status === "decidido").sort((a, b) => b.decision!.at - a.decision!.at).slice(0, 3);
  const rank = rankFor(c.s, c.now);
  const open = LESSONS.filter((l) => rankOf(l) <= rank);
  const nudge = shouldNudge(c.s, c.now) && !nudgeQuiet(c.pending, c.now) && !c.seasonDone;
  useEffect(() => { if (nudge) track("aviso_perfil_visto"); }, [nudge]);
  const specials = specialTasks({ changeOpen: c.changeOpen && !c.seasonDone, changeStarted: !!c.change, changeDone: !!c.change?.done, changeTitle: pk.change.title, boardOpen: boardAccess(c.s, c.now).open, crisisOpen: crisisAccess(c.s, c.now).open });
  const epPending = c.episodes.filter((e) => e.status === "pendiente");
  const report = c.reportDue !== null ? { href: "/ceo/reporte", period: c.reportDue, from: presenterOf(pk) } : null;
  // Empresa emergente: los casos de crecimiento esperan en Mi empresa; aquí solo la línea más urgente del motor.
  const growth = useMemo(() => {
    if (!c.s.growth) return null;
    const day = growthDayOf(c.s, c.now);
    if (isRetailLog(c.s.growth)) {
      const st = retailOf(c.s.growth, day).state;
      const p = retailPendingOf(c.s.growth, day);
      const last = st.months.at(-1);
      return { world: p?.world ?? null, pending: p ? 1 : 0, subject: p?.subject ?? null, line: last ? `Mes ${last.month}: ventas por $${Math.round(last.revenue / 1e8 * 10) / 10} M en ${last.stores} tiendas y EBITDA de ${((100 * last.ebitda) / Math.max(1, last.revenue)).toFixed(1)} %.` : "Las tiendas operan; el primer mes todavía no cierra.", alerts: retailAlerts(st).filter((a) => a.tone !== "good").slice(0, 2) };
    }
    if (isSteelLog(c.s.growth)) {
      const st = steelOf(c.s.growth, day).state;
      const p = steelPendingOf(c.s.growth, day);
      const last = st.months.at(-1);
      return { world: p?.world ?? null, pending: p ? 1 : 0, subject: p?.subject ?? null, line: last ? `Mes ${last.month}: ventas por $${Math.round(last.revenue / 1e8 * 10) / 10} M y EBITDA de ${((100 * last.ebitda) / Math.max(1, last.revenue)).toFixed(1)} %.` : "La planta opera; el primer mes todavía no cierra.", alerts: steelAlerts(st).filter((a) => a.tone !== "good").slice(0, 2) };
    }
    const list = pendingGrowth(c.s.growth, day);
    const g = growthAt(c.s.growth, day).state;
    const pending = list.length;
    const first = list[0]?.case;
    const subject = first ? (first.subjectOf ? first.subjectOf(g) : first.subject) : null;
    return { world: null, pending, subject, line: todayLineOf(g, pending), alerts: alertsOf(g).filter((a) => a.tone !== "good").slice(0, 2) };
  }, [c.s, c.now]);
  const waiting = c.pending.length + specials.length + epPending.length + (report ? 1 : 0) + (growth?.pending ?? 0);
  const nextLesson = open.find((l) => !c.s.lessons[l.id] && c.entries.some((e) => e.item.lesson === l.id && e.status !== "futuro")) ?? open.find((l) => !c.s.lessons[l.id]);

  const passed = KPI_KEYS.filter((k) => v.approved[k]).length;
  // Avisos de tendencia: lo que se está desgastando, antes de que sea tarde (máximo dos, los más graves).
  const alerts = useMemo(() => {
    if (c.seasonDone) return [];
    const rank = { critico: 0, riesgo: 1, aviso: 2 } as const;
    return alertsAt(c.s, c.now).filter((a) => a.kind !== "saturacion" || a.level !== "aviso").sort((a, b) => rank[a.level] - rank[b.level]).slice(0, 2);
  }, [c.s, c.now, c.seasonDone]);
  // V5/V6 · el encargo y las reglas se ven ANTES de decidir: nadie reprueba por una regla que no conocía.
  const mandate = v.v5 && !c.seasonDone ? v.v5 : null;
  const prevRun = c.continuous ? closedRunsOf(c.s).at(-1) : undefined;
  // Aviso de cambio de reglas al pasar de un periodo a otro: de v4 a la evaluación V5 (v6+), o de v6 a la auditoría ética (v7).
  const curV = c.s.rulesVersion ?? 1, prevV = prevRun?.rulesVersion ?? 1;
  const newRules = !!mandate && !!prevRun && curV >= 6 && curV <= CONTINUOUS_RULES_VERSION && prevV < 6;
  const ethicsRules = !!mandate && !!prevRun && curV >= ETHICS_AUDIT_RULES && prevV >= 6 && prevV < ETHICS_AUDIT_RULES;
  // v8 · coherencia: se avisa una sola vez, en el primer mes v8 después de un mes v6/v7.
  const coherenceRules = !!mandate && !!prevRun && curV >= COHERENCE_RULES_VERSION && prevV >= 6 && prevV < COHERENCE_RULES_VERSION;
  // v10 · economía real: se avisa en el primer mes v10 (también si la partida se pasó a v10 a mitad del mes).
  const econRules = !!mandate && curV >= ECONOMY_RULES_VERSION && (!!c.s.econMigration || (!!prevRun && prevV >= 6 && prevV < ECONOMY_RULES_VERSION));
  const t = c.trajectory;
  const headline = headlineOf(t);
  const greeting = c.seasonDone
    ? (c.continuous ? (v.passed ? `Cerraste un buen periodo en ${pk.short}, ${first}.` : `Cerraste el periodo en ${pk.short}, ${first}.`) : v.passed ? `Aprobaste ${pk.short}, ${first}.` : `Cerraste la temporada en ${pk.short}, ${first}.`)
    : `${hello}, ${first}.`;
  const sub = c.seasonDone
    ? (c.continuous ? (v.passed ? "El consejo ya tiene tu evaluación." : "El consejo quiere hablar de los rubros bajos.") : v.passed ? "Te espera otra empresa." : "El consejo pide otra vuelta.")
    : waiting ? `${waiting} ${waiting === 1 ? "asunto espera" : "asuntos esperan"} tu decisión.` : "Todo al día. Durante el día llegarán más asuntos.";
  const cta = c.seasonDone ? null
    : growth?.world ? { href: "/ceo/empresa#crecimiento", label: `Atender: ${growth.world.name}` }
    : report ? { href: report.href, label: `Revisar el cierre del mes ${report.period}` }
    : c.pending[0] ? { href: `/ceo/caso/${c.pending[0].item.id}`, label: `Atender: ${firstName(pk, c.pending[0].item.from)}` }
    : epPending[0] ? { href: `/ceo/episodio/${epPending[0].spec.id}`, label: `Atender: ${firstName(pk, epPending[0].spec.from)}` }
    : specials[0] ? { href: specials[0].href, label: `Atender: ${specials[0].subject.split(" · ")[0]}` }
    : growth?.pending ? { href: "/ceo/empresa#crecimiento", label: "Atender: caso de crecimiento" }
    : null;

  // Mismo lenguaje que las pantallas de decisión: translúcido en reposo, un poco más claro al pasar el cursor.
  const glass = "rounded-2xl border bg-white/[.06] border-white/[.12] transition-all hover:bg-white/10";
  const soft = "rounded-xl bg-white/[.08] px-3.5 py-2.5 text-[13px] text-white/85 leading-relaxed";
  const primary = cta ?? (c.seasonDone ? null : waiting === 0 ? { href: "/ceo/academy", label: "Explorar Academy" } : null);
  const stageTotal = COMPANY_STAGES.length;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px] lg:min-h-screen text-white">
      {/* centro de mando: fondo mêtis */}
      <div className="relative min-w-0 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-light/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-mint/10 blur-3xl" />
        <div className="relative flex flex-col lg:min-h-screen px-5 sm:px-8 xl:px-12 pt-6 pb-8 lg:pt-7 lg:pb-10">
          {/* Constancia: hábito, separado del mandato. No es requisito de nada. */}
          <div className="hidden lg:flex items-center justify-end gap-4 text-sm" aria-label="Constancia">
            <span className="flex items-center gap-1" aria-hidden>
              {c.streak.week.map((d) => <span key={d.key} title={d.label} className={clsx("h-1.5 w-1.5 rounded-full", d.on ? "bg-gradient-to-br from-amber to-coral" : d.paused ? "border border-dashed border-white/30" : d.today ? "bg-white/50" : "bg-white/15")} />)}
            </span>
            <span className={clsx("inline-flex items-center gap-1.5", c.streak.atRisk && !c.streak.doneToday ? "text-amber" : "text-white/85")} title={!c.streak.doneToday && c.streak.atRisk ? "Decide o estudia hoy para conservar tu racha." : undefined}>
              <Flame on={c.streak.days > 0 && c.streak.doneToday} size={16} /> <b className="font-semibold tabular-nums">{c.streak.days}</b> {c.streak.days === 1 ? "día" : "días"} de racha
            </span>
            <span className="h-4 w-px bg-white/20" />
            <span className="tabular-nums text-white/85"><b className="font-semibold text-white">{c.xp}</b> XP</span>
          </div>

          {c.cadence === "quiet_day" ? (
            <section className={clsx(glass, "mt-4 p-4 flex flex-wrap items-center gap-3 text-sm")}>
              <span className="h-9 w-9 shrink-0 rounded-xl bg-mint/15 text-mint grid place-items-center"><Coffee size={16} /></span>
              <span className="flex-1 min-w-0"><b className="text-white">Hoy es tu día tranquilo.</b> <span className="text-white/65">No llegan asuntos nuevos y tus plazos están detenidos hasta mañana.</span></span>
              <button type="button" onClick={c.resumeCareer} className="btn text-white/70 hover:text-white">Volver al ritmo normal</button>
            </section>
          ) : <DilemmaPrompt />}

          {/* bienvenida */}
          <section className="academy-in mt-4 lg:mt-6">
            <div className="text-[13px] text-white/70 truncate">{pk.name} / {pk.industry}{c.s.tier > 0 ? ` · Exigencia ${c.rules.name}` : ""}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[.18em] text-indigo-light">{t.active ? `Director General · Día ${c.day}` : `Día ${c.day} de ${pk.season.days}`}</div>
            <h1 className="mt-3 max-w-[16ch] text-4xl sm:text-5xl xl:text-[56px] font-semibold leading-[1.05] tracking-tight">{greeting}</h1>
            <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-5">
              {c.seasonDone ? <p className="text-[15px] text-white/75">{sub}</p> : (
                <div className="flex items-center gap-5">
                  <span className="text-7xl sm:text-[88px] font-semibold leading-none tabular-nums">{waiting}</span>
                  <span className="h-14 w-px bg-white/25" />
                  <span className="text-lg sm:text-xl leading-snug text-white/85">{waiting === 1 ? "Asunto" : "Asuntos"}<br />por resolver</span>
                </div>
              )}
              {primary && <Link href={primary.href} className="btn bg-white text-ink hover:bg-white/90 px-5 py-3 text-[15px] font-semibold">{primary.label} <ArrowRight size={16} /></Link>}
              {c.seasonDone && <Link href="/ceo/carrera" className="btn bg-white text-ink hover:bg-white/90 px-5 py-3 text-[15px] font-semibold"><Trophy size={15} /> Ver el veredicto del consejo</Link>}
            </div>
          </section>

          {/* decisiones: lo principal */}
          <section className="mt-10 min-w-0">
            <div className="flex items-center justify-between"><h2 className="text-xs font-semibold uppercase tracking-[.18em] text-white/55">Esperando tu decisión</h2><Link href="/ceo/bandeja" className="text-xs font-medium text-white/65 hover:text-white transition-colors">Bandeja →</Link></div>
            {waiting === 0 ? <p className="mt-3 text-sm text-white/60">Nada pendiente. Aprovecha para repasar la teoría en mêtis Academy.</p> : (
              <ul className="mt-3 space-y-2.5">
                {report && (
                  <li><Link href={report.href} className={clsx(glass, "flex gap-3 px-4 py-3.5 group")}>
                    <Avatar id={report.from} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="text-sm font-semibold truncate">{personOf(pk, report.from).name}</span><span className="chip bg-white/10 text-white text-[10px]">Reporte</span></div>
                      <div className="text-sm text-white/70 truncate">Cierre del mes {report.period}: tus números y una decisión de caja</div>
                      <div className="mt-0.5 text-[11px] text-indigo-light font-medium">El siguiente mes se cierra después de firmarlo</div>
                    </div>
                    <ArrowRight size={16} className="text-white/30 group-hover:text-white transition-colors mt-3" />
                  </Link></li>
                )}
                {growth?.world && (
                  <li><Link href="/ceo/empresa#crecimiento" className={clsx(glass, "flex gap-3 px-4 py-3.5 group")} data-testid="hoy-mundo">
                    <span className={clsx("h-[38px] w-[38px] shrink-0 rounded-full grid place-items-center", growth.world.mode === "real" ? "bg-coral/20 text-coral" : "bg-amber/20 text-amber")}><Globe2 size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{growth.world.name}</span><span className={clsx("chip text-[10px]", growth.world.mode === "real" ? "bg-coral/20 text-coral" : "bg-amber/20 text-amber")}>{growth.world.label}</span></div>
                      <div className="text-sm text-white/70">{growth.world.facts ? "Lo que toca de tu empresa" : "Activo expuesto"}: {growth.world.assets.join("; ") || (growth.world.facts ? "contratos de la empresa" : "sedes de la empresa")}</div>
                      <div className="text-sm text-white/70">Decisión: {growth.subject}</div>
                      <div className="mt-0.5 text-[11px] text-white/50">Fuente: {growth.world.source.name}{growth.world.also ? ` y ${growth.world.also.name}` : ""} · {growth.world.facts ? "dato oficial ya publicado" : growth.world.status === "pronostico" ? "pronóstico, puede cambiar" : "ya ocurrió"} · Plazo: {growth.world.daysLeft === 0 ? "hoy" : growth.world.daysLeft === 1 ? "1 día" : `${growth.world.daysLeft} días`}</div>
                    </div>
                    <ArrowRight size={16} className="text-white/30 group-hover:text-white transition-colors mt-3" />
                  </Link></li>
                )}
                {growth && growth.pending > 0 && !growth.world && (
                  <li><Link href="/ceo/empresa#crecimiento" className={clsx(glass, "flex gap-3 px-4 py-3.5 group")} data-testid="hoy-crecimiento">
                    <span className="h-[38px] w-[38px] shrink-0 rounded-full grid place-items-center bg-white/10 text-white"><TrendingUp size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{growth.subject ?? `Decisión en ${pk.short}`}</div>
                      <div className="text-sm text-white/70">{growth.pending > 1 ? `${growth.pending} decisiones esperan en Mi empresa` : "Te espera en Mi empresa"}</div>
                    </div>
                    <ArrowRight size={16} className="text-white/30 group-hover:text-white transition-colors mt-3" />
                  </Link></li>
                )}
                {specials.map((t) => (
                  <li key={t.id}><Link href={t.href} className={clsx(glass, "flex gap-3 px-4 py-3.5 group")}>
                    <span className={clsx("h-[38px] w-[38px] shrink-0 rounded-full grid place-items-center", t.id === "crisis" ? "bg-coral/20 text-coral" : "bg-white/10 text-white")}><Flag size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="text-sm font-semibold truncate">Consejo de {pk.short}</span></div>
                      <div className="text-sm text-white/70 truncate">{t.subject}</div>
                      <div className="mt-0.5 text-[11px] text-white/50">{t.label}</div>
                    </div>
                    <ArrowRight size={16} className="text-white/30 group-hover:text-white transition-colors mt-3" />
                  </Link></li>
                ))}
                {epPending.map((e) => (
                  <li key={e.spec.id}><Link href={`/ceo/episodio/${e.spec.id}`} className={clsx(glass, "flex gap-3 px-4 py-3.5 group")}>
                    <Avatar id={e.spec.from} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="text-sm font-semibold truncate">{personOf(pk, e.spec.from).name}</span><ChannelChip c={e.spec.channel} /></div>
                      <div className="text-sm text-white/70 truncate">{e.spec.subject}</div>
                      <div className="mt-0.5 text-[11px] text-indigo-light font-medium">Caso ejecutivo · unos {e.spec.minutes} min{e.run ? " · en curso" : ""}</div>
                    </div>
                    <ArrowRight size={16} className="text-white/30 group-hover:text-white transition-colors mt-3" />
                  </Link></li>
                ))}
                {c.pending.map((e) => (
                  <li key={e.item.id}><Link href={`/ceo/caso/${e.item.id}`} className={clsx(glass, "flex gap-3 px-4 py-3.5 group")}>
                    <Avatar id={e.item.from} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="text-sm font-semibold truncate">{personOf(pk, e.item.from).name}</span><ChannelChip c={e.item.channel} /></div>
                      <div className="text-sm text-white/70 truncate">{e.item.subject}</div>
                      <div className={clsx("mt-0.5 text-[11px] inline-flex items-center gap-1", e.deadline - c.now < 3 * 3_600_000 ? "text-coral font-medium" : "text-white/50")}><Clock size={11} /> Vence en {until(e.deadline, c.now)}</div>
                    </div>
                    <ArrowRight size={16} className="text-white/30 group-hover:text-white transition-colors mt-3" />
                  </Link></li>
                ))}
              </ul>
            )}
            {!c.seasonDone && c.nextArrival && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-white/15 px-4 py-2.5 text-xs text-white/55">
                <span className="inline-flex items-center gap-1.5"><Hourglass size={12} /> Durante el día llegarán más asuntos.</span>
                {c.testTools && <button onClick={c.skipNext} className="inline-flex items-center gap-1 font-medium text-white/75 hover:text-white transition-colors"><FastForward size={12} /> Adelantar el reloj (modo prueba)</button>}
              </div>
            )}
          </section>

          {/* V5/V6 · el encargo y las reglas se ven ANTES de decidir */}
          {mandate && (
            <section data-testid="encargo-periodo" className="mt-auto pt-10">
              <div className="rounded-2xl border border-white/[.12] bg-white/[.06] backdrop-blur p-5 sm:p-6">
                {newRules && (
                  <p data-testid="aviso-reglas-nuevas" className={clsx(soft, "mb-4")}>
                    <b className="text-white">Desde este mes el consejo evalúa de otra forma.</b> Ya no basta con tener los cinco indicadores en la línea: revisa tu encargo, la salud de la empresa y qué tan bien razonas. Tus meses anteriores conservan la evaluación que ya recibiste.
                  </p>
                )}
                {ethicsRules && (
                  <p data-testid="aviso-lineas-rojas" className={clsx(soft, "mb-4")}>
                    <b className="text-white">Desde este mes hay más líneas rojas.</b> Prometerle a un cliente algo que no existe y encubrirlo, mover a quien denuncia, darle al equipo una explicación falsa, mantener una fecha que solo se cumple haciendo trampa u ocultar un error culpando a otro ya no se compensan con buenos números. Tus meses anteriores conservan su evaluación.
                  </p>
                )}
                {coherenceRules && (
                  <p data-testid="aviso-coherencia" className={clsx(soft, "mb-4")}>
                    <b className="text-white">Desde este mes el consejo es más justo con tu criterio.</b> Si una respuesta es defendible aunque tenga un costo, cuenta como bien razonada. Lo que depende de que otra persona acepte cuenta cuando responde, no antes. Y dejar vencer un asunto ético grave cuenta igual que decidir mal. Tus meses anteriores conservan su evaluación.
                  </p>
                )}
                {econRules && (
                  <p data-testid="aviso-economia" className={clsx(soft, "mb-4")}>
                    <b className="text-white">Desde ahora Caja y Margen se mueven con dinero real.</b> Cada asunto registra lo que se paga, se cobra o se concede, con su monto y su fecha: un descuento baja el margen desde que lo firmas; un pago sale de la caja el día que ocurre; un ahorro cuenta cuando se mide. No conceder no suma, y un monto chico para el tamaño de tu empresa no mueve el indicador. Una concesión o inversión grande sin pasar por el consejo le cuesta su confianza.{c.s.econMigration ? " Tu periodo en curso se recalculó con estas reglas: tus decisiones, tu historial y tu racha siguen igual." : ""}
                  </p>
                )}
                <h2 className="text-[11px] font-semibold uppercase tracking-[.25em] text-white/55">Misión del consejo {c.continuous ? "· este mes" : "· esta temporada"}</h2>
                <p className="mt-2 text-xl sm:text-2xl font-semibold leading-snug">{mandate.objectiveText}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-white/75">
                  {mandate.objectives.map((o) => <span key={o.kpi} className="tabular-nums">{pk.kpiLabel[o.kpi]} ≥{v.passLine}</span>).flatMap((x, i) => i ? [<span key={`s${i}`} className="text-white/35">·</span>, x] : [x])}
                  <span className="text-white/35">·</span><span className="tabular-nums" title={`Salud promedio de ${mandate.healthMin} o más y ningún indicador debajo de ${mandate.floor}; caja y consejo arriba de 40.`}>Salud ≥{mandate.healthMin}</span>
                  <span className="text-white/35">·</span><span className="tabular-nums" title="Asuntos bien razonados. Los que dejes vencer cuentan en contra.">Criterio ≥{Math.round(mandate.judgment.min * 100)} %</span>
                  <span className="hidden sm:block h-4 w-px bg-white/20 mx-1" />
                  <Link href="/ceo/carrera" className="inline-flex items-center gap-1 font-semibold text-white/90 hover:text-white transition-colors">Ver criterios <ArrowRight size={13} /></Link>
                </div>
                <p className="mt-3 text-[11px] text-white/45 leading-relaxed">Ningún indicador debajo de {mandate.floor}; caja y consejo arriba de 40. Sin líneas rojas (seguridad, fraude, represalias, ocultar riesgos). Al cierre, la operación del mes genera caja: lo que deja el negocio, más o menos los cambios de precio y costo que firmaste.</p>
              </div>
            </section>
          )}

          {nudge && (
            <section className={clsx(glass, "mt-5 px-4 py-3 flex flex-wrap items-center gap-3 academy-in hover:bg-white/[.06]")}>
              <span className="h-8 w-8 shrink-0 rounded-lg bg-white/10 grid place-items-center"><Briefcase size={15} /></span>
              <div className="flex-1 min-w-[180px] text-sm"><b>Cuéntanos tu experiencia</b> <span className="text-white/60">· cinco preguntas, cerca de un minuto. No cambia tu avance.</span></div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => { track("aviso_perfil_pospuesto", { veces: (c.s.profileNudge?.dismissed ?? 0) + 1 }); c.snoozeProfile(); }} className="btn text-white/70 hover:text-white text-xs">Ahora no</button>
                <Link href="/ceo/experiencia" className="btn bg-white text-ink hover:bg-white/90 text-xs font-semibold">Completar perfil</Link>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* panel de la empresa: blanco, a la derecha */}
      <aside className="relative mx-3 mb-4 lg:m-0 rounded-3xl lg:rounded-none lg:rounded-l-[28px] bg-white text-ink px-5 sm:px-7 py-6 lg:py-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto shadow-[0_0_60px_-20px_rgba(15,17,48,.6)]">
        <h2 className="sr-only">Tu empresa hoy</h2>
        <KpiBoard hero />
        <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
          <span className={clsx("h-9 w-9 shrink-0 rounded-full grid place-items-center", passed === 5 ? "bg-indigo-soft text-indigo" : "bg-slate-100 text-slate-500")}><Check size={17} strokeWidth={2.6} /></span>
          <span className="text-[15px] font-semibold"><span className="tabular-nums">{passed}/5</span> indicadores en {v.passLine} o más</span>
        </div>
        {alerts.length > 0 && (
          <ul data-testid="alertas-tendencia" className="mt-3 space-y-1.5">
            {alerts.map((a) => (
              <li key={a.kpi + a.kind} data-level={a.level} className={clsx("rounded-xl px-3 py-2 text-[12px] leading-snug", a.level === "critico" ? "bg-coral-soft/60 text-ink" : a.level === "riesgo" ? "bg-amber-50 text-ink" : "bg-slate-50 text-slate-600")}>{a.text}</li>
            ))}
          </ul>
        )}
        {growth && growth.alerts.length > 0 && (
          <Link href="/ceo/empresa#crecimiento" className="mt-3 block rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50" data-testid="hoy-alertas">
            <AlertChips alerts={growth.alerts} />
          </Link>
        )}
        {growth && growth.pending === 0 && growth.alerts.length === 0 && (
          <Link href="/ceo/empresa#crecimiento" className="mt-3 flex gap-3 rounded-xl border border-slate-100 p-3 text-sm transition-colors hover:bg-slate-50 group" data-testid="hoy-pulso-crecimiento">
            <span className="h-9 w-9 shrink-0 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><TrendingUp size={16} /></span>
            <span className="min-w-0 flex-1 text-slate-600">{growth.line}</span>
            <ArrowRight size={15} className="text-slate-300 group-hover:text-indigo transition-colors mt-2.5" />
          </Link>
        )}
        <Link href="/ceo/empresa" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo hover:text-indigo-light transition-colors">{c.continuous ? "Ver números completos en Empresa" : "Ver tu empresa"} <ArrowRight size={13} /></Link>

        {/* tu mandato: etapa de la empresa y momento */}
        <section className="mt-6 border-t border-slate-100 pt-5" aria-label="Tu mandato" data-testid="resumen-mandato">
          {t.active ? (
            <div data-testid="etapa-actual">
              <div className="flex items-baseline justify-between gap-2"><span className="text-[15px] font-semibold">{t.chapter.label}</span><span className="text-[13px] text-slate-500 tabular-nums">Mes {t.month} · {t.chapter.idx + 1} de {stageTotal}</span></div>
              <div className="mt-3 flex items-center gap-1.5" aria-hidden>
                {COMPANY_STAGES.map((st, i) => <span key={st.id} className={clsx("h-2.5 flex-1 rounded-full", i < t.chapter.idx ? "bg-indigo/45" : i === t.chapter.idx ? "bg-indigo" : "bg-indigo-soft")} />)}
              </div>
            </div>
          ) : <div className="text-[15px] font-semibold">{`Día ${c.day} de ${pk.season.days}`}</div>}
          <p className="mt-3 text-[13px] text-slate-600 leading-snug">{t.moment.text}</p>
          {headline && <p className="mt-1.5 text-[12px] text-slate-500 truncate"><span className="text-slate-400">{headline.label}:</span> {headline.text}</p>}
          <div className="mt-2 flex items-baseline justify-between gap-2 text-[12px]"><span className="text-slate-400 truncate">{t.appointment.title}</span><Link href="/ceo/carrera" className="shrink-0 font-semibold text-indigo hover:text-indigo-light transition-colors">Tu trayectoria →</Link></div>
        </section>

        {nextLesson && (
          <Link href={`/ceo/academy/${nextLesson.id}`} className="mt-5 flex gap-3 items-center rounded-2xl border border-slate-100 p-3.5 transition-all hover:bg-indigo-soft/50 hover:border-indigo-soft">
            <span className="h-10 w-10 rounded-xl bg-indigo-soft text-indigo grid place-items-center shrink-0"><BookOpen size={18} /></span>
            <div className="min-w-0"><div className="text-[10px] font-semibold uppercase tracking-wider text-indigo">mêtis Academy · {nextLesson.minutes} min{nextLessonXp(c.s, c.now) > 0 ? ` · +${nextLessonXp(c.s, c.now)} XP` : ""}</div><div className="text-sm font-semibold text-ink leading-snug mt-0.5 truncate">{nextLesson.title}</div></div>
          </Link>
        )}

        <section className="mt-5">
          <h2 className="font-semibold text-ink text-[13px]">Lo último que decidiste</h2>
          {lastDecided.length === 0 ? <p className="mt-1.5 text-xs text-slate-500">Todavía nada. Tu primera decisión te espera.</p> : (
            <ul className="mt-2 space-y-1">
              {lastDecided.map((e) => (
                <li key={e.item.id}><Link href={`/ceo/caso/${e.item.id}`} className="block rounded-lg -mx-2 px-2 py-1.5 transition-colors hover:bg-slate-50">
                  <div className="text-[11px] text-slate-400 truncate">{rel(e.decision!.at, c.now)} · {e.item.subject}</div>
                  <div className="text-xs text-slate-600 line-clamp-2">{e.option?.outcome}</div>
                </Link></li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
