"use client";
/**
 * World Events · piezas de interfaz compartidas por la cadena y la acería.
 *  - WorldBadge: etiqueta obligatoria («Evento real · Simulación de impacto en tu empresa» o «Ejercicio hipotético»),
 *    fuente oficial con enlace, estado (pronóstico u observado) y plazo.
 *  - WorldRadar: publicaciones oficiales recientes que pueden importar a las empresas (decretos, aranceles, energía,
 *    impuestos, trabajo). Son informativas: no mueven la empresa hasta que exista una regla aprobada y exposición.
 *  - ExternalImpacts: impactos externos separados de las decisiones propias, con desglose inevitable / evitable / futuro (v2) (antes: no cuentan contra el jugador si su
 *    preparación fue razonable).
 */
import clsx from "clsx";
import { Globe2, Newspaper } from "lucide-react";
import type { WorldView, ExternalHit } from "@/lib/ceo/world/episodes";
import { NEWS_LABEL, type RadarItem } from "@/lib/ceo/world/econfeed";

export function WorldBadge({ w }: { w: WorldView }) {
  const real = w.mode === "real";
  return (
    <div className={clsx("mb-3 rounded-2xl px-3 py-2.5 text-[12px] leading-snug", real ? "bg-coral/10 text-coral" : "bg-amber-50 text-amber-800")} data-testid="etiqueta-mundo">
      <div className="flex items-center gap-2 font-semibold"><Globe2 size={14} />{w.label}</div>
      <div className="mt-1 text-slate-600">
        Fuente: <a href={w.source.url} target="_blank" rel="noopener noreferrer" className="underline">{w.source.name}</a>
        {w.also && <> · Corrobora: <a href={w.also.url} target="_blank" rel="noopener noreferrer" className="underline">{w.also.name}</a></>}
        {" · "}{w.facts ? "Dato oficial ya publicado" : w.status === "pronostico" ? "Pronóstico (puede cambiar)" : "Ya ocurrió"}
        {" · "}Plazo: {w.daysLeft === 0 ? "hoy" : w.daysLeft === 1 ? "1 día" : `${w.daysLeft} días`}
      </div>
      {w.assets.length > 0 && <div className="mt-1 text-slate-600">{w.facts ? "Lo que toca de tu empresa" : "Activos expuestos"}: {w.assets.join("; ")}</div>}
    </div>
  );
}

export function ExternalImpacts({ hits }: { hits: readonly ExternalHit[] }) {
  if (!hits.length) return null;
  const v2 = hits.some((h) => (h.rv ?? 1) >= 2);
  return (
    <div className="rounded-2xl bg-canvas p-3.5 text-[12px] leading-snug" data-testid="impactos-externos">
      <div className="font-semibold text-slate-600">Impacto externo</div>
      <p className="mt-0.5 text-slate-500">{v2
        ? "Lo inevitable le habría pasado a cualquiera y no te resta en los indicadores. Lo que dependió de tu decisión (lo que mitigaste, lo que costó y lo que viene después) sí cuenta."
        : "Lo que trajo el acontecimiento se muestra aparte. Con una preparación razonable no te resta en los indicadores; solo cuenta lo que dependió de tu decisión."}</p>
      <ul className="mt-2 space-y-2">{hits.slice(-3).reverse().map((h) => (
        <li key={h.id} className="text-slate-600">
          Día {h.day}: {h.text}
          {h.parts && (h.parts.inevitable.length + h.parts.evitable.length + h.parts.future.length) > 0 && (
            <dl className="mt-1 space-y-0.5 pl-2 border-l-2 border-slate-200" data-testid="desglose-impacto">
              {h.parts.inevitable.length > 0 && <div><dt className="inline font-semibold text-slate-500">Inevitable: </dt><dd className="inline">{h.parts.inevitable.join(" ")}</dd></div>}
              {h.parts.evitable.length > 0 && <div><dt className="inline font-semibold text-amber-700">Dependió de tu decisión: </dt><dd className="inline">{h.parts.evitable.join(" ")}</dd></div>}
              {h.parts.future.length > 0 && <div><dt className="inline font-semibold text-slate-500">Lo que viene: </dt><dd className="inline">{h.parts.future.join(" ")}</dd></div>}
            </dl>
          )}
        </li>
      ))}</ul>
    </div>
  );
}

export function WorldRadar({ items }: { items: readonly RadarItem[] }) {
  if (!items.length) return null;
  return (
    <details className="rounded-2xl bg-canvas p-3.5 text-[12px] leading-snug" data-testid="radar-mundo">
      <summary className="cursor-pointer font-semibold text-slate-600 inline-flex items-center gap-1.5"><Newspaper size={13} /> Radar del mundo · {items.length} publicaciones oficiales recientes</summary>
      <p className="mt-1 text-slate-500">Decretos, acuerdos y medidas que pueden importar a las empresas. Son informativas: solo llega un caso cuando el dato toca a tu empresa y hay una regla aprobada para medir el efecto.</p>
      <ul className="mt-2 space-y-1.5">
        {items.slice(0, 8).map((r) => (
          <li key={r.id} className="text-slate-600">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{NEWS_LABEL[r.cat]}{r.date ? ` · ${r.date.split("-").reverse().join("/")}` : ""}</span><br />
            <a href={r.source.url} target="_blank" rel="noopener noreferrer" className="underline decoration-slate-300 hover:text-indigo">{r.title.length > 160 ? `${r.title.slice(0, 157)}…` : r.title}</a>
            <span className="text-slate-400"> · {r.source.name}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
