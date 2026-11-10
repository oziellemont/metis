"use client";
/**
 * Empresa · Personas. Vista ejecutiva: presidente del consejo, consejeros, tus reportes directos y las relaciones
 * clave que piden atención. Al tocar a alguien se abre su perfil en una ventana centrada (rol, relación, intereses,
 * alianzas y conflictos, historial). El organigrama completo queda a un botón.
 */
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Network } from "lucide-react";
import { firstName, personOf } from "@/lib/ceo/cast";
import { orgParts } from "@/lib/ceo/org-chart";
import { entryRipples, moodOf, REL_START } from "@/lib/ceo/relations";
import type { CastId, Person } from "@/lib/ceo/types";
import { useCeo } from "../CeoProvider";
import { CompanyOrgChart } from "../CompanyOrgChart";
import { DetailDialog } from "../DetailDialog";
import { Avatar, Delta, rel } from "../ui";
import { Panel } from "./shared";

const MOOD_CLS = { aliado: "bg-indigo-soft text-indigo", bien: "bg-indigo-soft text-indigo", neutral: "bg-slate-100 text-slate-600", frio: "bg-amber-soft text-ink", roto: "bg-coral-soft text-coral" } as const;

export function PersonasTab() {
  const c = useCeo();
  const pk = c.pack;
  const parts = useMemo(() => orgParts(pk), [pk]);
  const [sel, setSel] = useState<CastId | null>(null);
  const [chart, setChart] = useState(false);
  const r = (id: CastId) => c.relations[id] ?? REL_START;
  const chair = parts.consejo.find((p) => /presidente|presidenta/i.test(p.role)) ?? parts.consejo[0];
  const board = parts.consejo.filter((p) => p.id !== chair?.id);
  const direct = parts.comite.map((x) => x.p);
  // Relaciones clave: consejo y comité, de la más fría a la más cálida; solo las que no están «Bien» o «Aliado».
  const key = [...parts.consejo, ...direct, ...parts.externos].filter((p) => r(p.id) < 60).sort((a, b) => r(a.id) - r(b.id)).slice(0, 4);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5 min-w-0">
          <Panel title="Consejo" testid="personas-consejo">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {chair && <PersonCard p={chair} rel={r(chair.id)} tag="Presidencia" onOpen={setSel} />}
              {board.map((p) => <PersonCard key={p.id} p={p} rel={r(p.id)} onOpen={setSel} />)}
            </div>
          </Panel>
          <Panel title="Te reportan" testid="personas-comite">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {direct.map((p) => <PersonCard key={p.id} p={p} rel={r(p.id)} onOpen={setSel} />)}
            </div>
          </Panel>
        </div>
        <Panel title="Relaciones clave" testid="relaciones-clave" className="self-start">
          {key.length ? (
            <ul className="space-y-2">
              {key.map((p) => {
                const m = moodOf(r(p.id));
                return (
                  <li key={p.id}>
                    <button type="button" onClick={() => setSel(p.id)} className="w-full flex items-center gap-3 rounded-2xl border border-slate-100 px-3 py-2.5 text-left transition-colors hover:border-indigo/30 hover:bg-[#F8F7FE]">
                      <Avatar id={p.id} size={34} pack={pk} />
                      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ink truncate">{firstName(pk, p.id)}</span><span className="block text-[11.5px] text-slate-500 truncate">{p.role.split("·")[0].trim()}</span></span>
                      <span className={clsx("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", MOOD_CLS[m.tone])}>{m.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-slate-500">Ninguna relación importante está fría. Tu consejo y tu comité te ven bien o como aliado.</p>}
          <p className="mt-3 text-[11px] text-slate-400">Las relaciones se mueven con tus decisiones: quién gana, quién cede y a quién no respondiste.</p>
        </Panel>
      </div>

      <div className="flex justify-center">
        <button type="button" data-testid="ver-organigrama" onClick={() => setChart((x) => !x)} className="btn border border-slate-200 bg-white text-ink hover:border-indigo/40 text-sm"><Network size={15} /> {chart ? "Ocultar organigrama" : "Ver organigrama completo"}</button>
      </div>
      {chart && (
        <Panel title="Organigrama" testid="organigrama">
          <CompanyOrgChart pack={pk} relations={c.relations} />
        </Panel>
      )}

      {sel && <Profile id={sel} onClose={() => setSel(null)} />}
    </>
  );
}

function PersonCard({ p, rel: v, tag, onOpen }: { p: Person; rel: number; tag?: string; onOpen: (id: CastId) => void }) {
  const c = useCeo();
  const m = moodOf(v);
  return (
    <button type="button" data-testid="persona" onClick={() => onOpen(p.id)} className="w-full flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 text-left transition-all hover:border-indigo/30 hover:bg-[#F8F7FE]">
      <Avatar id={p.id} size={40} pack={c.pack} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2"><span className="text-sm font-semibold text-ink truncate">{p.name}</span>{tag && <span className="rounded-full bg-ink px-1.5 py-0.5 text-[9.5px] font-semibold text-white">{tag}</span>}</span>
        <span className="block text-[12px] text-slate-500 truncate" title={p.role}>{p.role}</span>
      </span>
      <span className="text-right shrink-0">
        <span className={clsx("block rounded-full px-2 py-0.5 text-[10.5px] font-semibold", MOOD_CLS[m.tone])}>{m.label}</span>
        <span className="mt-0.5 block text-[11px] tabular-nums text-slate-400">{v}/100</span>
      </span>
    </button>
  );
}

/** Perfil de una persona: rol, relación actual, intereses, alianzas y conflictos, historial de interacciones. */
function Profile({ id, onClose }: { id: CastId; onClose: () => void }) {
  const c = useCeo();
  const pk = c.pack;
  const p = personOf(pk, id);
  const v = c.relations[id] ?? REL_START;
  const m = moodOf(v);
  const ties = pk.ties.filter((t) => t.a === id || t.b === id);
  const history = useMemo(() => c.entries.flatMap((e) => {
    const hit = entryRipples(pk, e).filter((x) => x.id === id).reduce((a, x) => a + x.delta, 0);
    if (!hit && e.item.from !== id) return [];
    if (e.status !== "decidido" && e.status !== "vencido") return [];
    return [{ id: e.item.id, subject: e.item.subject, at: e.decision?.at ?? e.deadline, delta: hit, expired: e.status === "vencido" }];
  }).reverse().slice(0, 6), [c.entries, pk, id]);
  return (
    <DetailDialog variant="centro" labelledBy="perfil-nombre" testid="perfil-persona" scrollKey={id} onClose={onClose}>
        <div className="flex items-center gap-3 pr-8">
          <Avatar id={id} size={48} pack={pk} />
          <div className="min-w-0"><h2 id="perfil-nombre" className="text-lg font-semibold text-ink">{p.name}</h2><div className="text-[13px] text-slate-500">{p.role}</div></div>
        </div>

        <div className="mt-5 rounded-2xl bg-[#F8F7FE] p-4">
          <div className="flex items-baseline justify-between"><span className="text-[12px] text-slate-500">Tu relación</span><span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold", MOOD_CLS[m.tone])}>{m.label}</span></div>
          <div className="mt-1 text-[28px] font-semibold leading-none tabular-nums text-ink">{v}<span className="text-base font-normal text-slate-400">/100</span></div>
          <div className="mt-3 h-2 rounded-full bg-indigo-soft/70"><div className="h-full rounded-full bg-gradient-to-r from-indigo-light to-indigo" style={{ width: `${v}%` }} /></div>
          <div className="mt-1.5 text-[11px] text-slate-400">Empezó en {REL_START}.</div>
        </div>

        {p.cares && <Sec title="Le importa"><p className="text-sm text-ink leading-relaxed">{p.cares}</p></Sec>}

        {ties.length > 0 && (
          <Sec title="Alianzas y conflictos">
            <ul className="space-y-2">
              {ties.map((t, i) => {
                const other = t.a === id ? t.b : t.a;
                const lab = t.kind === "alianza" ? "Aliado de" : t.kind === "tension" ? "En tensión con" : t.a === id ? "Influye en" : "Le influye";
                return <li key={i} className="text-[13px] text-slate-600"><b className={clsx("font-semibold", t.kind === "tension" ? "text-coral" : t.kind === "alianza" ? "text-indigo" : "text-ink")}>{lab} {firstName(pk, other)}.</b> {t.note}</li>;
              })}
            </ul>
          </Sec>
        )}

        <Sec title="Historial contigo">
          {history.length ? (
            <ol className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="rounded-xl border border-slate-100 px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2"><span className="text-[11px] text-slate-400">{h.expired ? "Venció sin respuesta" : "Tu decisión"} · {rel(h.at, c.now)}</span>{h.delta !== 0 && <span className="text-xs tabular-nums">Relación <Delta n={h.delta} /></span>}</div>
                  <Link href={`/ceo/caso/${h.id}`} onClick={onClose} className="mt-0.5 block text-sm font-medium text-ink hover:text-indigo">{h.subject}</Link>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-slate-500">Todavía no han tratado ningún asunto juntos este periodo.</p>}
        </Sec>
    </DetailDialog>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mt-5"><div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>{children}</div>;
}
