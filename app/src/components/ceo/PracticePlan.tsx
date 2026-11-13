"use client";
import { useState } from "react";
import clsx from "clsx";
import { ListChecks, Pencil } from "lucide-react";
import { useCeo } from "./CeoProvider";
import { TopicsPicker } from "./TopicsPicker";
import { entryProfile, topicNames, topicsReady } from "@/lib/ceo/metis2/entrada";
import { MIN_PRIORITY_TOPICS } from "@/lib/ceo/metis2/academias";
import { PRACTICE_DAYS, type PracticeDays } from "@/lib/ceo/profile";
import { SESSION_MINUTES, type SessionMinutes } from "@/lib/ceo/onboarding";

/**
 * Mi perfil · Temas y ritmo (MÊTIS 2.0, entrega 2.1): los temas prioritarios, los días por semana y los minutos por sesión.
 * Quien se registró antes lo completa aquí. Guardar solo cambia lo que se recomienda: no toca dominio, XP ni la partida.
 */
export function PracticePlan() {
  const c = useCeo();
  const pf = c.s.profile;
  const saved = pf?.topics ?? [];
  const [editing, setEditing] = useState(false);
  const [topics, setTopics] = useState<string[]>(saved);
  const [days, setDays] = useState<PracticeDays | undefined>(pf?.days);
  const [minutes, setMinutes] = useState<SessionMinutes | undefined>(c.s.settings.sessionMinutes);
  const open = () => { setTopics(pf?.topics ?? []); setDays(pf?.days); setMinutes(c.s.settings.sessionMinutes); setEditing(true); };
  const save = () => {
    c.saveProfile(entryProfile(pf, topics, days, Date.now(), pf?.source ?? "perfil"));
    if (minutes && minutes !== c.s.settings.sessionMinutes) c.updateSettings({ sessionMinutes: minutes });
    setEditing(false);
  };
  const names = topicNames(saved);
  const dayLabel = PRACTICE_DAYS.find((d) => d.value === pf?.days)?.label;
  const pill = (on: boolean) => clsx("rounded-full border px-3.5 py-1.5 text-[13px] transition-colors", on ? "border-indigo bg-indigo-soft text-indigo font-medium" : "border-slate-200 text-slate-600 hover:bg-slate-50");

  return (
    <section id="temas" data-testid="perfil-temas" className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="h-9 w-9 rounded-xl bg-indigo-soft text-indigo grid place-items-center"><ListChecks size={16} /></span>
        <div className="flex-1 min-w-0"><h2 className="font-semibold text-ink">Temas y ritmo</h2><p className="text-xs text-slate-400">Lo que más te interesa practicar y cada cuánto. Tus temas señalan sus rutas en Academy; no suman competencias ni puntos.</p></div>
        {!editing && (saved.length >= MIN_PRIORITY_TOPICS
          ? <button type="button" onClick={open} className="inline-flex items-center gap-1 text-xs font-medium text-indigo"><Pencil size={12} /> Editar</button>
          : <button type="button" onClick={open} className="btn-primary text-sm">Elegir mis temas</button>)}
      </div>

      {editing ? (
        <div className="mt-5">
          <TopicsPicker value={topics} onChange={setTopics} />
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="text-xs font-medium text-slate-500">Días por semana</div>
            <div role="radiogroup" aria-label="Días por semana" className="mt-2 flex flex-wrap gap-2">
              {PRACTICE_DAYS.map((d) => <button key={d.value} type="button" role="radio" aria-checked={days === d.value} onClick={() => setDays(d.value)} className={pill(days === d.value)}>{d.label}</button>)}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500">Minutos por sesión</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SESSION_MINUTES.map((m) => <button key={m} type="button" aria-pressed={minutes === m} onClick={() => setMinutes(m)} className={pill(minutes === m)}>{m} min</button>)}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            {!topicsReady(topics) && <span className="mr-auto text-xs text-slate-500">Elige al menos {MIN_PRIORITY_TOPICS} temas para guardar.</span>}
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancelar</button>
            <button type="button" onClick={save} disabled={!topicsReady(topics)} className="btn-primary">Guardar</button>
          </div>
        </div>
      ) : (
        <>
          {names.length > 0
            ? <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tus temas">{names.map((n) => <li key={n} className="chip bg-indigo-soft text-indigo text-[12px] py-1">{n}</li>)}</ul>
            : <p className="mt-4 text-sm text-slate-500">Todavía no eliges tus temas. Son al menos {MIN_PRIORITY_TOPICS}, de las seis academias.</p>}
          <dl className="mt-4 grid sm:grid-cols-2 gap-x-6">
            {([["Días por semana", dayLabel], ["Minutos por sesión", c.s.settings.sessionMinutes ? `${c.s.settings.sessionMinutes} min` : undefined]] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 border-t border-slate-100 text-[13px]"><dt className="text-slate-500">{k}</dt><dd className={clsx("text-right", v ? "font-medium text-ink" : "text-slate-400")}>{v || "Sin responder"}</dd></div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
