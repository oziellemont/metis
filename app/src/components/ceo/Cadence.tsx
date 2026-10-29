"use client";
/**
 * Ritmo (1.2, adenda v3.2 §5): pausar la carrera, día tranquilo, pantalla de descanso y regreso sin culpa.
 * La lógica vive en lib/ceo/cadence.ts; aquí solo se muestra.
 */
import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Coffee, Moon, Pause, Play } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useCeo } from "./CeoProvider";
import { until as untilLabel } from "./ui";
import { PAUSE_CONFIRM, QUIET_TEXT, VACATION_MAX_DAYS, canPause, canQuiet, lighterGoal, returnSummary } from "@/lib/ceo/cadence";
import { DAILY_GOALS, DEFAULT_DAILY_GOAL, weeklyProjection, weeklyProjectionText } from "@/lib/ceo/onboarding";
import { DAY } from "@/lib/ceo/engine";

const fmtDay = (t: number, tz?: string) => new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", ...(tz ? { timeZone: tz } : {}) }).format(new Date(t));
const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Ajustes → Ritmo y notificaciones. */
export function CadenceCard() {
  const c = useCeo();
  const [open, setOpen] = useState(false);
  const [withDate, setWithDate] = useState(false);
  const [date, setDate] = useState(() => isoDay(Date.now() + 7 * DAY));
  const real = Date.now();
  // La fecha elegida es el mediodía de ese día en hora real; se pasa al reloj del juego.
  const plannedReal = withDate ? Date.parse(`${date}T12:00:00`) : null;
  const planned = plannedReal === null || !Number.isFinite(plannedReal) ? null : plannedReal + (c.s.clockOffset || 0);
  const can = canPause(c.s, c.now, planned);
  const quiet = canQuiet(c.s, c.now);
  const pausedNote = can.ok ? null : can.reason === "limite" ? "Ya usaste las pausas de esta empresa. Puedes tomar un día tranquilo." : can.reason === "temporada_cerrada" ? "Esta empresa ya cerró: no hay nada que pausar." : can.reason === "fecha_invalida" ? `Elige una fecha entre mañana y ${VACATION_MAX_DAYS} días.` : null;

  if (c.cadence === "vacation_paused") return null; // de vacaciones se ve la pantalla de descanso

  return (
    <section className="card p-5 sm:p-6 space-y-4">
      <h2 className="font-semibold text-ink">Ritmo y notificaciones</h2>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm">
        <b className="inline-flex items-center gap-1 text-ink"><Coffee size={14} /> Día tranquilo</b>
        <p className="mt-1 text-slate-500">{QUIET_TEXT}</p>
        {c.cadence === "quiet_day" ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="chip bg-mint-soft text-sob">Hoy es tu día tranquilo</span>
            <button type="button" onClick={c.resumeCareer} className="text-sm text-indigo font-medium">Volver al ritmo normal</button>
          </div>
        ) : (
          <button type="button" onClick={c.startQuietDay} disabled={!quiet.ok} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-ink hover:bg-slate-50 disabled:opacity-40">Tomar un día tranquilo</button>
        )}
        {!quiet.ok && quiet.reason === "reciente" && c.cadence === "active" && <p className="mt-2 text-xs text-slate-400">Puedes tomar uno cada semana.</p>}
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm">
        <b className="inline-flex items-center gap-1 text-ink"><Pause size={14} /> Pausar mi carrera</b>
        <p className="mt-1 text-slate-500">Para vacaciones o semanas complicadas. Se detiene todo: plazos, asuntos nuevos y avisos.</p>
        {!open ? (
          <button type="button" onClick={() => setOpen(true)} disabled={!canPause(c.s, c.now).ok} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-ink hover:bg-slate-50 disabled:opacity-40">Pausar mi carrera</button>
        ) : (
          <div className="mt-3 space-y-3">
            <div role="radiogroup" aria-label="Regreso" className="flex flex-wrap gap-2">
              <button type="button" role="radio" aria-checked={!withDate} onClick={() => setWithDate(false)} className={clsx("rounded-full border px-3.5 py-1.5", !withDate ? "border-indigo bg-indigo-soft text-indigo font-medium" : "border-slate-200 text-slate-600 bg-white")}>Sin fecha</button>
              <button type="button" role="radio" aria-checked={withDate} onClick={() => setWithDate(true)} className={clsx("rounded-full border px-3.5 py-1.5", withDate ? "border-indigo bg-indigo-soft text-indigo font-medium" : "border-slate-200 text-slate-600 bg-white")}>Con fecha de regreso</button>
            </div>
            {withDate && (
              <label className="block text-slate-600">Pienso volver el
                <input type="date" value={date} min={isoDay(real + DAY)} max={isoDay(real + VACATION_MAX_DAYS * DAY)} onChange={(e) => setDate(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo focus:outline-none" />
                <span className="mt-1 block text-xs text-slate-400">Es solo un recordatorio: tu empresa sigue en pausa hasta que pulses «Reanudar ahora».</span>
              </label>
            )}
            <p className="rounded-xl bg-white p-3 text-ink">{PAUSE_CONFIRM}</p>
            {pausedNote && <p className="text-xs text-coral">{pausedNote}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" disabled={!can.ok} onClick={() => { c.pauseCareer(planned); setOpen(false); }} className="btn-primary disabled:opacity-40">Pausar ahora</button>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-500">Cancelar</button>
            </div>
          </div>
        )}
        {!open && pausedNote && can.ok === false && can.reason !== "fecha_invalida" && <p className="mt-2 text-xs text-slate-400">{pausedNote}</p>}
      </div>
    </section>
  );
}

/** Pantalla de descanso: se ve mientras la carrera está en pausa. Nada se reactiva sin pulsar el botón. */
export function RestScreen() {
  const c = useCeo();
  const p = c.s.cadence?.pauses?.at(-1);
  const sum = returnSummary(c.s, c.now);
  return (
    <div className="min-h-screen bg-canvas grid place-items-center px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <div className="flex justify-center"><Logo height={28} /></div>
        <section className="card p-6 sm:p-7 text-center space-y-3">
          <span className="mx-auto h-12 w-12 rounded-2xl bg-indigo-soft text-indigo grid place-items-center"><Moon size={22} /></span>
          <h1 className="text-xl font-semibold text-ink">Tu empresa está en pausa</h1>
          <p className="text-sm text-slate-500">Descansa tranquilo. Ningún plazo corre, no llegan asuntos nuevos y no te mandaremos avisos.</p>
          {p?.from && <p className="text-xs text-slate-400">En pausa desde el {fmtDay(p.from - (c.s.clockOffset || 0), c.s.settings.tz)}{p.plannedResumeAt ? ` · pensabas volver el ${fmtDay(p.plannedResumeAt - (c.s.clockOffset || 0), c.s.settings.tz)}` : ""}.</p>}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <Stat n={sum.decided} label="decisiones" />
            <Stat n={sum.pending} label="te esperan" />
            <Stat n={sum.health} label="salud" />
          </div>
          <button type="button" onClick={c.resumeCareer} className="btn-primary w-full inline-flex items-center justify-center gap-2 mt-2"><Play size={15} /> Reanudar ahora</button>
          <p className="text-xs text-slate-400">Al reanudar, cada asunto conserva el tiempo que le quedaba.</p>
        </section>
        <div className="text-center"><Link href="/ceo/ajustes" className="text-xs text-slate-400 hover:text-ink">Ajustes</Link></div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return <div className="rounded-xl bg-slate-50 py-2.5"><div className="text-lg font-semibold tabular-nums text-ink">{n}</div><div className="text-[11px] text-slate-500">{label}</div></div>;
}

/** «¡Qué bueno tenerte de vuelta!»: tras unas vacaciones largas o una ausencia de una semana. */
export function ReturnScreen() {
  const c = useCeo();
  const [view, setView] = useState<"inicio" | "repaso" | "objetivo">("inicio");
  const current = c.s.settings.dailyGoal ?? DEFAULT_DAILY_GOAL;
  const [goal, setGoal] = useState<1 | 2 | 3>(lighterGoal(current));
  const first = (c.s.name || "").trim().split(/\s+/)[0] || "CEO";
  const sum = returnSummary(c.s, c.now);
  const done = () => c.markReturnSeen();

  return (
    <div className="min-h-screen bg-canvas grid place-items-center px-4 py-10">
      <div className="w-full max-w-lg space-y-5">
        <div className="flex justify-center"><Logo height={28} /></div>
        <section className="card p-6 sm:p-7 space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-ink">¡Qué bueno tenerte de vuelta, {first}!</h1>
            <p className="text-sm text-slate-500">Tu carrera continúa donde la dejaste.</p>
          </div>

          {view === "inicio" && (<>
            <p className="text-sm text-ink text-center">¿Quieres mantener tu objetivo actual o empezar con un ritmo más ligero?</p>
            <div className="grid gap-2">
              <button type="button" onClick={done} className="btn-primary w-full justify-center">Continuar</button>
              <button type="button" onClick={() => setView("repaso")} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-ink hover:bg-slate-50">Repasar dónde me quedé</button>
              <button type="button" onClick={() => setView("objetivo")} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-ink hover:bg-slate-50">Cambiar mi objetivo</button>
            </div>
          </>)}

          {view === "repaso" && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat n={sum.decided} label="decisiones" />
                <Stat n={sum.pending} label="te esperan" />
                <Stat n={sum.health} label="salud" />
              </div>
              {sum.last.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lo último que decidiste en {sum.company}</div>
                  <ul className="mt-2 space-y-2">{sum.last.map((x) => <li key={x.subject + x.at} className="rounded-xl bg-slate-50 p-3"><div className="font-medium text-ink">{x.subject}</div><div className="text-slate-500">{x.choice}</div></li>)}</ul>
                </div>
              )}
              {sum.waiting.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Te esperan</div>
                  <ul className="mt-2 space-y-2">{sum.waiting.map((x) => <li key={x.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><span className="font-medium text-ink truncate">{x.subject}</span><span className="text-xs text-slate-500 whitespace-nowrap">Vence en {untilLabel(c.now + x.leftMs, c.now)}</span></li>)}</ul>
                </div>
              )}
              {!sum.last.length && !sum.waiting.length && <p className="text-slate-500 text-center">Todavía no hay decisiones en esta empresa. Empiezas con calma.</p>}
              <div className="grid gap-2">
                <button type="button" onClick={done} className="btn-primary w-full justify-center">Continuar</button>
                <button type="button" onClick={() => setView("objetivo")} className="text-sm text-indigo font-medium">Cambiar mi objetivo</button>
              </div>
            </div>
          )}

          {view === "objetivo" && (
            <div className="space-y-4 text-sm">
              <div role="radiogroup" aria-label="Meta diaria" className="grid gap-2">
                {DAILY_GOALS.map((g) => (
                  <button key={g.value} type="button" role="radio" aria-checked={goal === g.value} onClick={() => setGoal(g.value)} className={clsx("rounded-xl border px-4 py-3 text-left", goal === g.value ? "border-indigo bg-indigo-soft" : "border-slate-200 hover:bg-slate-50")}>
                    <span className="font-medium text-ink">{g.label} · {g.value} al día</span>{g.value === current && <span className="ml-2 text-xs text-slate-400">tu objetivo actual</span>}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <div className="text-3xl font-semibold tabular-nums text-ink">{weeklyProjection(goal)}</div>
                <div className="text-slate-500">{weeklyProjectionText(goal).replace("tu primera semana", "esta semana")}</div>
              </div>
              <button type="button" onClick={() => { if (goal !== current) c.updateSettings({ dailyGoal: goal }); done(); }} className="btn-primary w-full justify-center">Continuar con {goal} al día</button>
              <button type="button" onClick={() => setView("inicio")} className="w-full text-slate-500">Volver</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
