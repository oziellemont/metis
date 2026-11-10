"use client";
/**
 * MÊTIS Assess v1 · pantallas de la empresa (vacantes, invitaciones, tablero) y del candidato.
 * Aparte de MÊTIS CEO: no usa su proveedor, ni su estado, ni sus avisos.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";

const PILOT = "Piloto en validación. No usar para decidir contrataciones: los resultados solo apoyan una revisión humana.";

export function PilotBanner() {
  return (
    <div data-testid="assess-piloto" role="note" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Piloto — no usar para decisiones de contratación.</strong> {PILOT.split(". ").slice(1).join(". ")}
    </div>
  );
}

export function AssessFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/assess" className="font-semibold text-ink">MÊTIS <span className="text-indigo">Assess</span></Link>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">Piloto</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">{children}</main>
    </div>
  );
}

type Meta = { notice: string; industries: { id: string; label: string; company: string; cases: number; competencies: string[] }[]; competencies: { id: string; label: string; how: string }[] };
type Vac = { id: string; title: string; industry: string; industryLabel: string; company: string; weights: Record<string, number>; createdAt: string; candidates?: number };

const ERR: Record<string, string> = {
  sin_sesion: "Entra con tu cuenta para usar Assess.",
  no_piloto: "Tu cuenta todavía no está habilitada para el piloto de Assess. Pide acceso a MÊTIS.",
  assess_apagado: "Assess está apagado en este momento.",
  sin_backend: "El servidor no está configurado.",
  falta_migracion_0024: "Falta correr la migración 0024 en Supabase.",
  enlace_invalido: "Este enlace no es válido. Pide uno nuevo a la empresa que te invitó.",
  enlace_vencido: "Este enlace ya venció. Pide uno nuevo a la empresa que te invitó.",
  ya_terminado: "Ya terminaste esta evaluación. Gracias.",
};
const say = (e: string) => ERR[e] ?? e;

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const r = await fetch(url, { ...init, headers: { "content-type": "application/json" }, cache: "no-store" });
    const j = await r.json().catch(() => ({ ok: false, error: "error" }));
    return j.ok ? { ok: true, data: j as T } : { ok: false, error: String(j.error ?? "error") };
  } catch { return { ok: false, error: "Sin conexión." }; }
}

// ───────────────────────────────────────────────────────── empresa · lista y alta de vacantes
export function AssessHome() {
  const [st, setSt] = useState<{ vacancies: Vac[]; meta: Meta } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    const r = await api<{ vacancies: Vac[]; meta: Meta }>("/api/assess/vacantes");
    if (r.ok) { setSt(r.data); setErr(null); } else setErr(r.error);
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (err) return (
    <AssessFrame>
      <PilotBanner />
      <div className="card p-6 space-y-3">
        <p className="text-slate-700">{say(err)}</p>
        {err === "sin_sesion" && <Link className="btn-primary" href="/entrar?next=/assess">Entrar</Link>}
      </div>
    </AssessFrame>
  );
  if (!st) return <AssessFrame><p className="text-slate-500">Cargando…</p></AssessFrame>;
  return (
    <AssessFrame>
      <PilotBanner />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Evaluaciones por vacante</h1>
        <p className="mt-1 text-sm text-slate-600">Cada candidato resuelve los mismos casos empresariales de la misma empresa simulada. Las consecuencias de cada decisión las calcula el motor de MÊTIS, no una IA.</p>
      </div>
      <NewVacancy meta={st.meta} onDone={load} />
      <section className="card divide-y divide-slate-100">
        {st.vacancies.length === 0 && <p className="p-5 text-sm text-slate-500">Aún no tienes vacantes.</p>}
        {st.vacancies.map((v) => (
          <Link key={v.id} href={`/assess/v/${v.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50">
            <div><div className="font-medium text-ink">{v.title}</div><div className="text-xs text-slate-500">{v.industryLabel} · {v.company}</div></div>
            <span className="text-sm text-slate-600">{v.candidates ?? 0} candidato{v.candidates === 1 ? "" : "s"}</span>
          </Link>
        ))}
      </section>
      <Method meta={st.meta} />
    </AssessFrame>
  );
}

function NewVacancy({ meta, onDone }: { meta: Meta; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [industry, setIndustry] = useState(meta.industries[0]?.id ?? "retail");
  const [w, setW] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const allowed = meta.industries.find((i) => i.id === industry)?.competencies ?? [];
  useEffect(() => { setW((x) => Object.fromEntries(Object.entries(x).filter(([k]) => allowed.includes(k)))); }, [industry]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = async () => {
    setBusy(true); setMsg(null);
    const r = await api("/api/assess/vacantes", { method: "POST", body: JSON.stringify({ title, industry, weights: w }) });
    setBusy(false);
    if (r.ok) { setTitle(""); setW({}); onDone(); } else setMsg(say(r.error));
  };
  return (
    <section className="card p-5 space-y-4">
      <h2 className="font-semibold text-ink">Nueva vacante</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate-600">Vacante<input data-testid="vac-title" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Gerente de operaciones" /></label>
        <label className="text-sm text-slate-600">Industria del caso<select data-testid="vac-industry" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={industry} onChange={(e) => setIndustry(e.target.value)}>
          {meta.industries.map((i) => <option key={i.id} value={i.id}>{i.label} ({i.cases} casos)</option>)}
        </select></label>
      </div>
      <div>
        <div className="text-sm text-slate-600">Competencias que importan para la vacante (elige al menos dos y su peso)</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {meta.competencies.filter((c) => allowed.includes(c.id)).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
              <span className="text-sm text-ink" title={c.how}>{c.label}</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((n) => (
                  <button key={n} type="button" onClick={() => setW((x) => { const y = { ...x }; if (n) y[c.id] = n; else delete y[c.id]; return y; })}
                    className={clsx("h-7 w-7 rounded-lg text-xs", (w[c.id] ?? 0) === n ? "bg-indigo text-white" : "bg-slate-100 text-slate-600")}>{n || "–"}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {msg && <p className="text-sm text-rose-700">{msg}</p>}
      <button className="btn-primary" disabled={busy} onClick={submit}>Crear vacante</button>
    </section>
  );
}

function Method({ meta }: { meta: Meta }) {
  return (
    <section className="card p-5 space-y-2 text-sm text-slate-600">
      <h2 className="font-semibold text-ink">Cómo se mide</h2>
      <p>Para cada caso, el motor calcula qué pasa con la empresa con cada opción. El puntaje de una competencia (0 a 100) dice dónde quedó la opción elegida entre las disponibles: 100 es la mejor del caso en esa competencia y 0 la peor. Una competencia solo se reporta si al menos dos casos la miden.</p>
      <ul className="list-disc space-y-1 pl-5">{meta.competencies.map((c) => <li key={c.id}><strong className="text-ink">{c.label}:</strong> {c.how}</li>)}</ul>
      <p>El razonamiento escrito y el tiempo no cambian el puntaje: se muestran como evidencia para que una persona los revise.</p>
    </section>
  );
}

// ───────────────────────────────────────────────────────── empresa · tablero de una vacante
type Comp = { k: string; label: string; score: number | null; n: number; weight: number };
type Ev = { caseId: string; subject: string; area: string; optionLabel: string; reasoning: string; ms: number; scores: Record<string, number>; best: Record<string, string> };
type Rep = { answered: number; total: number; complete: boolean; comps: Comp[]; overall: number | null; band: string; strengths: string[]; probe: string[]; flags: { kind: string; text: string }[]; evidence: Ev[] };
type Row = { id: string; label: string; status: string; finishedAt: string | null; expiresAt: string; report: Rep };
const BAND: Record<string, string> = { solida: "Evidencia consistente a favor", mixta: "Evidencia mixta", limitada: "Evidencia de áreas a desarrollar", insuficiente: "Evidencia insuficiente" };
const STATUS: Record<string, string> = { invitado: "Invitado", en_curso: "En curso", terminado: "Terminó" };

export function AssessVacancy({ id }: { id: string }) {
  const [st, setSt] = useState<{ vacancy: Vac; rows: Row[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(async () => {
    const r = await api<{ vacancy: Vac; rows: Row[] }>(`/api/assess/vacantes/${encodeURIComponent(id)}`);
    if (r.ok) { setSt(r.data); setErr(null); } else setErr(r.error);
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  if (err) return <AssessFrame><PilotBanner /><div className="card p-6 text-slate-700">{say(err)}</div></AssessFrame>;
  if (!st) return <AssessFrame><p className="text-slate-500">Cargando…</p></AssessFrame>;
  const comps = st.rows[0]?.report.comps ?? Object.keys(st.vacancy.weights).map((k) => ({ k, label: k, score: null, n: 0, weight: st.vacancy.weights[k] }));
  return (
    <AssessFrame>
      <PilotBanner />
      <div>
        <Link href="/assess" className="text-sm text-indigo">← Vacantes</Link>
        <h1 className="mt-1 text-2xl font-semibold text-ink">{st.vacancy.title}</h1>
        <p className="text-sm text-slate-600">{st.vacancy.industryLabel} · {st.vacancy.company}</p>
      </div>
      <Invite id={id} onDone={load} />
      <section className="card overflow-x-auto" data-testid="assess-tablero">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Candidato</th><th className="p-3">Estado</th>{comps.map((c) => <th key={c.k} className="p-3">{c.label}<span className="ml-1 text-slate-400">×{c.weight}</span></th>)}<th className="p-3">Global</th><th className="p-3">Lectura</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {st.rows.length === 0 && <tr><td className="p-4 text-slate-500" colSpan={comps.length + 4}>Invita al primer candidato.</td></tr>}
            {st.rows.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(open === r.id ? null : r.id)}>
                <td className="p-3 font-medium text-ink">{r.label}</td>
                <td className="p-3 text-slate-600">{STATUS[r.status] ?? r.status} · {r.report.answered}/{r.report.total}</td>
                {r.report.comps.map((c) => <td key={c.k} className="p-3"><Score v={c.score} /></td>)}
                <td className="p-3"><Score v={r.report.overall} strong /></td>
                <td className="p-3 text-slate-600">{BAND[r.report.band] ?? r.report.band}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {st.rows.filter((r) => r.id === open).map((r) => <Detail key={r.id} r={r} />)}
      <p className="text-xs text-slate-500">Los puntajes ordenan evidencia, no personas. Úsalos para preparar la entrevista y revisar el razonamiento de cada candidato; la decisión es de tu equipo.</p>
    </AssessFrame>
  );
}

function Score({ v, strong }: { v: number | null; strong?: boolean }) {
  if (v === null) return <span className="text-slate-400">—</span>;
  return <span className={clsx("inline-block min-w-[2.5rem] rounded-lg px-2 py-0.5 text-center", strong && "font-semibold", v >= 70 ? "bg-mint-soft text-emerald-800" : v >= 45 ? "bg-slate-100 text-slate-700" : "bg-rose-50 text-rose-700")}>{v}</span>;
}

function Detail({ r }: { r: Row }) {
  return (
    <section className="card p-5 space-y-4" data-testid="assess-detalle">
      <h2 className="font-semibold text-ink">{r.label}: evidencia para revisión humana</h2>
      {r.report.flags.length > 0 && <ul className="space-y-1 text-sm text-amber-800">{r.report.flags.map((f, i) => <li key={i}>• {f.text}</li>)}</ul>}
      {r.report.strengths.length > 0 && <div><h3 className="text-sm font-medium text-ink">Lo que muestra la evidencia</h3><ul className="mt-1 space-y-1 text-sm text-slate-700">{r.report.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul></div>}
      {r.report.probe.length > 0 && <div><h3 className="text-sm font-medium text-ink">Para profundizar en la entrevista</h3><ul className="mt-1 space-y-1 text-sm text-slate-700">{r.report.probe.map((s, i) => <li key={i}>• {s}</li>)}</ul></div>}
      <div className="space-y-3">
        {r.report.evidence.map((e) => (
          <div key={e.caseId} className="rounded-xl border border-slate-200 p-3 text-sm">
            <div className="text-xs text-slate-500">{e.area} · {Math.round(e.ms / 1000)} s</div>
            <div className="font-medium text-ink">{e.subject}</div>
            <div className="mt-1 text-slate-700">Eligió: <strong>{e.optionLabel}</strong></div>
            <blockquote className="mt-1 border-l-2 border-slate-200 pl-3 text-slate-600">{e.reasoning}</blockquote>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">{Object.entries(e.scores).map(([k, v]) => <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5">{k}: {v}{v < 100 && e.best[k] ? ` · mejor: ${e.best[k]}` : ""}</span>)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Invite({ id, onDone }: { id: string; onDone: () => void }) {
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const submit = async () => {
    setMsg(null); setLink(null);
    const r = await api<{ candidate: { token: string } }>(`/api/assess/vacantes/${encodeURIComponent(id)}/candidatos`, { method: "POST", body: JSON.stringify({ label, email }) });
    if (r.ok) { setLink(`${window.location.origin}/assess/c/${r.data.candidate.token}`); setLabel(""); setEmail(""); onDone(); } else setMsg(say(r.error));
  };
  return (
    <section className="card p-5 space-y-3">
      <h2 className="font-semibold text-ink">Invitar candidato</h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input data-testid="cand-label" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Nombre o clave" value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} />
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Correo (opcional)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn-primary" onClick={submit}>Generar enlace</button>
      </div>
      {msg && <p className="text-sm text-rose-700">{msg}</p>}
      {link && <div className="rounded-xl bg-indigo-soft p-3 text-sm"><div className="text-ink">Enlace único (se muestra solo esta vez, vence en 14 días). Envíalo tú al candidato:</div><code className="mt-1 block break-all text-indigo">{link}</code></div>}
    </section>
  );
}

// ───────────────────────────────────────────────────────── candidato
type OptV = { id: string; label: string; detail: string; blocked?: string; unavailable?: string };
type CaseV = { id: string; area: string; subject: string; body: string[]; data: [string, string][]; options: OptV[] };
type View = { title: string; industryLabel: string; company: string; summary: string; notice: string; status: string; consent: boolean; cases: CaseV[]; answered: string[] };

export function AssessCandidate({ token }: { token: string }) {
  const [v, setV] = useState<View | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    const r = await api<{ view: View }>(`/api/assess/c/${encodeURIComponent(token)}`);
    if (r.ok) { setV(r.data.view); setErr(null); } else setErr(r.error);
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  if (err) return <AssessFrame><div className="card p-6 text-slate-700">{say(err)}</div></AssessFrame>;
  if (!v) return <AssessFrame><p className="text-slate-500">Cargando…</p></AssessFrame>;
  if (!v.consent) return (
    <AssessFrame>
      <section className="card p-6 space-y-3">
        <h1 className="text-xl font-semibold text-ink">{v.title}</h1>
        <p className="text-sm text-slate-700">Vas a dirigir <strong>{v.company}</strong> ({v.industryLabel}) durante {v.cases.length || 8} decisiones. {v.summary}</p>
        <p className="text-sm text-slate-700">En cada caso elige la opción que tomarías y explica en pocas frases por qué. No hay límite de tiempo. Cada respuesta se guarda al enviarla y no se puede cambiar.</p>
        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{v.notice} Tus respuestas las verá solo la empresa que te invitó.</div>
        <button className="btn-primary" data-testid="cand-empezar" onClick={async () => { const r = await api(`/api/assess/c/${encodeURIComponent(token)}`, { method: "POST", body: JSON.stringify({ action: "consent" }) }); if (r.ok) void load(); else setErr(r.error); }}>Entiendo, empezar</button>
      </section>
    </AssessFrame>
  );
  return <Solve token={token} v={v} />;
}

function Solve({ token, v }: { token: string; v: View }) {
  const [done, setDone] = useState<string[]>(v.answered);
  const pending = useMemo(() => v.cases.filter((c) => !done.includes(c.id)), [v.cases, done]);
  const c = pending[0];
  const [pick, setPick] = useState<string | null>(null);
  const [why, setWhy] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t0 = useRef(Date.now());
  useEffect(() => { t0.current = Date.now(); setPick(null); setWhy(""); setMsg(null); }, [c?.id]);
  if (!c || v.status === "terminado") return (
    <AssessFrame><section className="card p-6 space-y-2"><h1 className="text-xl font-semibold text-ink">Terminaste</h1><p className="text-sm text-slate-700">Gracias. Tus respuestas quedaron guardadas y la empresa las revisará.</p></section></AssessFrame>
  );
  const send = async () => {
    if (!pick || busy) return;
    setBusy(true); setMsg(null);
    const r = await api<{ saved: boolean }>(`/api/assess/c/${encodeURIComponent(token)}`, { method: "POST", body: JSON.stringify({ action: "answer", caseId: c.id, optionId: pick, reasoning: why, ms: Date.now() - t0.current }) });
    setBusy(false);
    if (r.ok) setDone((d) => [...d, c.id]); else setMsg(say(r.error));
  };
  return (
    <AssessFrame>
      <div className="text-sm text-slate-500">Caso {done.length + 1} de {v.cases.length} · {c.area}</div>
      <section className="card p-5 space-y-3" data-testid="cand-caso">
        <h1 className="text-lg font-semibold text-ink">{c.subject}</h1>
        {c.body.map((p, i) => <p key={i} className="text-sm text-slate-700">{p}</p>)}
        {c.data.length > 0 && <dl className="grid gap-2 sm:grid-cols-3">{c.data.map(([k, x]) => <div key={k} className="rounded-xl bg-slate-50 p-2"><dt className="text-xs text-slate-500">{k}</dt><dd className="text-sm font-medium text-ink">{x}</dd></div>)}</dl>}
      </section>
      <section className="space-y-2">
        {c.options.map((o) => {
          const off = !!(o.blocked || o.unavailable);
          return (
            <button key={o.id} disabled={off} onClick={() => setPick(o.id)} className={clsx("card block w-full p-4 text-left", pick === o.id && "ring-2 ring-indigo", off && "opacity-60")}>
              <div className="font-medium text-ink">{o.label}</div>
              {o.detail && <div className="mt-1 text-sm text-slate-600">{o.detail}</div>}
              {off && <div className="mt-1 text-xs text-rose-700">{o.blocked ?? o.unavailable}</div>}
            </button>
          );
        })}
      </section>
      <label className="block text-sm text-slate-600">¿Por qué? (lo que pesaste para decidir)
        <textarea data-testid="cand-razon" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" rows={3} maxLength={1200} value={why} onChange={(e) => setWhy(e.target.value)} />
      </label>
      {msg && <p className="text-sm text-rose-700">{msg}</p>}
      <button className="btn-primary" disabled={!pick || why.trim().length < 10 || busy} onClick={send}>Enviar y seguir</button>
    </AssessFrame>
  );
}
