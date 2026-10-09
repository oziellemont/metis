"use client";
/**
 * Importar organigrama: 1) subir archivo → 2) vista previa con árbol y validaciones → 3) guardar y enviar correos.
 */
import { useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, ChevronRight, Download, FileSpreadsheet, Loader2, Mail, RefreshCw, Upload, UserPlus, X } from "lucide-react";
import { useMetis } from "@/lib/store";
import { checkOrg, parseCsv, rowsFromTable, toImportPayload, type CheckedRow, type OrgCheck } from "@/lib/org/import";
import { sendInvitationEmail } from "@/lib/invitations/send-client";

const ROLE: Record<string, string> = { admin: "Administrador", manager: "Jefe", collaborator: "Colaborador" };
const TEMPLATE = "/plantillas/organigrama-metis.xlsx";

type Step = "upload" | "preview" | "saving" | "done";
type MailProgress = { total: number; sent: number; failed: { email: string; msg: string }[] };

export function ImportOrgDialog({ onClose }: { onClose: () => void }) {
  const s = useMetis();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState("");
  const [check, setCheck] = useState<OrgCheck | null>(null);
  const [tab, setTab] = useState<"tree" | "issues">("tree");
  const [sendNow, setSendNow] = useState(true);
  const [result, setResult] = useState<{ invited: number; updated: number; error?: string } | null>(null);
  const [mail, setMail] = useState<MailProgress | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const real = s.mode === "supabase";

  const read = async (f: File) => {
    setErr(""); setFileName(f.name);
    try {
      let table: unknown[][];
      if (/\.(csv|txt)$/i.test(f.name)) table = parseCsv(await f.text());
      else if (/\.xlsx$/i.test(f.name)) {
        const { default: readXlsx } = await import("read-excel-file");
        table = (await readXlsx(f)) as unknown[][];
      } else { setErr("Sube un archivo de Excel (.xlsx) o CSV. Si lo tienes en .xls, ábrelo y guárdalo como .xlsx."); return; }
      const { rows, error } = rowsFromTable(table);
      if (error) { setErr(error); return; }
      if (!rows.length) { setErr("El archivo no tiene personas debajo de los encabezados."); return; }
      if (rows.length > 3000) { setErr("Son más de 3,000 personas. Divide el archivo por área y súbelo en partes."); return; }
      const c = checkOrg(rows, s.users);
      setCheck(c); setTab(c.bad.length ? "issues" : "tree"); setStep("preview");
    } catch (e) {
      setErr(`No pude leer el archivo (${String((e as Error)?.message ?? e)}). Revisa que no esté protegido con contraseña.`);
    }
  };

  const save = async () => {
    if (!check) return;
    setStep("saving");
    const r = await s.importOrg(check.ok.map(toImportPayload));
    setResult({ invited: r.invited.length, updated: r.updated, error: r.error });
    if (r.ok && sendNow && real && r.invited.length) {
      const prog: MailProgress = { total: r.invited.length, sent: 0, failed: [] };
      setMail({ ...prog }); setStep("done");
      for (const inv of r.invited) {
        const res = await sendInvitationEmail(inv.invitationId);
        if (res.state === "sent") prog.sent++;
        else prog.failed.push({ email: inv.email, msg: res.msg ?? "" });
        setMail({ ...prog, failed: [...prog.failed] });
        // Resend permite pocos envíos por segundo
        await new Promise((ok) => setTimeout(ok, 550));
        if (res.state === "manual") { prog.failed.push(...r.invited.slice(prog.sent + prog.failed.length).map((x) => ({ email: x.email, msg: res.msg ?? "" }))); setMail({ ...prog }); break; }
      }
    } else setStep("done");
  };

  const counts = useMemo(() => {
    if (!check) return null;
    const ok = check.ok;
    return {
      total: check.rows.length, ok: ok.length, bad: check.bad.length,
      fresh: ok.filter((r) => !r.existing).length, existing: ok.filter((r) => r.existing).length,
      warn: ok.filter((r) => r.warnings.length).length,
      areas: new Set(ok.map((r) => r.area).filter(Boolean)).size,
      managers: ok.filter((r) => r.role === "manager").length,
    };
  }, [check]);

  return (
    <div className="fixed inset-0 z-30 bg-ink/30 flex items-end sm:items-center justify-center p-4" onClick={step === "saving" ? undefined : onClose}>
      <div className="card w-full max-w-3xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><FileSpreadsheet size={17} className="text-indigo" /> Importar organigrama</h3>
            <Steps step={step} />
          </div>
          {step !== "saving" && <button onClick={onClose} className="text-slate-400 hover:text-ink" aria-label="Cerrar"><X size={18} /></button>}
        </div>

        <div className="px-6 pb-6 overflow-y-auto">
          {step === "upload" && (
            <>
              <div className="rounded-xl bg-indigo-soft/60 p-4 text-sm flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium text-ink">1 · Descarga la plantilla y llénala</div>
                  <p className="text-xs text-slate-600 mt-0.5">Una fila por persona: nombre, correo, número de empleado, puesto, área, correo de su jefe directo y rol. Si dejas el rol vacío, METIS pone <b>Jefe</b> a quien tenga gente a cargo y <b>Colaborador</b> al resto.</p>
                </div>
                <a href={TEMPLATE} download className="btn-ghost shrink-0 justify-center"><Download size={14} /> Plantilla Excel</a>
              </div>

              <div className="mt-4 font-medium text-sm">2 · Sube el archivo</div>
              <button type="button"
                onClick={() => input.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) read(f); }}
                className={clsx("mt-2 w-full rounded-2xl border-2 border-dashed p-8 text-center transition", drag ? "border-indigo bg-indigo-soft/50" : "border-slate-200 hover:border-indigo/50 hover:bg-slate-50")}>
                <Upload size={26} className="mx-auto text-indigo" />
                <div className="mt-2 text-sm font-medium">Arrastra aquí tu Excel o CSV, o da clic para elegirlo</div>
                <div className="text-xs text-slate-400 mt-1">{fileName || "Acepta .xlsx y .csv · hasta 3,000 personas"}</div>
              </button>
              <input ref={input} type="file" accept=".xlsx,.csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f); e.target.value = ""; }} />
              {err && <p className="mt-3 text-sm text-coral flex items-start gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" /> {err}</p>}
              <p className="mt-4 text-[11px] text-slate-400">Nada se guarda todavía: primero verás la vista previa del organigrama y los errores a corregir.</p>
            </>
          )}

          {step === "preview" && check && counts && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat n={counts.fresh} label="Nuevos (se invitan)" tone="text-indigo" />
                <Stat n={counts.existing} label="Ya en METIS (se actualizan)" tone="text-ink" />
                <Stat n={counts.managers} label={`Jefes · ${counts.areas} área${counts.areas === 1 ? "" : "s"}`} tone="text-ink" />
                <Stat n={counts.bad} label="Con error (no se importan)" tone={counts.bad ? "text-coral" : "text-sob"} />
              </div>
              {check.general.map((g) => <p key={g} className="mt-3 text-xs text-amber flex items-start gap-1.5"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> {g}</p>)}

              <div className="mt-4 inline-flex rounded-xl bg-slate-50 p-1 ring-1 ring-slate-100">
                {([["tree", `Organigrama (${counts.ok})`], ["issues", `Revisar (${counts.bad + counts.warn})`]] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setTab(k)} className={clsx("rounded-lg px-3 py-1.5 text-sm transition", tab === k ? "bg-indigo text-white font-medium" : "text-slate-500 hover:text-ink")}>{l}</button>
                ))}
              </div>

              <div className="mt-3 rounded-xl ring-1 ring-slate-100 max-h-[44vh] overflow-y-auto">
                {tab === "tree" ? (
                  check.tree.length ? <ul className="divide-y divide-slate-50">{check.tree.map((r) => <TreeRow key={r.email} r={r} />)}</ul>
                    : <p className="p-6 text-sm text-slate-500 text-center">Ninguna fila es válida todavía.</p>
                ) : (
                  <Issues rows={check.rows.filter((r) => r.errors.length || r.warnings.length)} />
                )}
              </div>

              <label className={clsx("mt-4 flex items-start gap-3 rounded-xl p-3 ring-1 cursor-pointer", sendNow ? "ring-indigo/30 bg-indigo-soft/40" : "ring-slate-100")}>
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#4F46E5]" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} disabled={!real} />
                <span className="text-sm">
                  <span className="font-medium">Enviar ya los correos de invitación a los {counts.fresh} nuevos</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{real ? "Desmárcalo si quieres cargar el organigrama antes del arranque. Las invitaciones quedan guardadas y las mandas después con el botón de reenviar." : "En la demo no se envían correos."}</span>
                </span>
              </label>

              <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center gap-2">
                <button className="btn-ghost justify-center" onClick={() => { setCheck(null); setStep("upload"); }}><RefreshCw size={14} /> Subir otro archivo</button>
                <span className="sm:ml-auto text-xs text-slate-400 text-center">{counts.bad ? `${counts.bad} fila${counts.bad === 1 ? "" : "s"} con error se omitirá${counts.bad === 1 ? "" : "n"}.` : "Todo listo."}</span>
                <button className="btn-primary justify-center" disabled={!counts.ok} onClick={save}><UserPlus size={14} /> Importar {counts.ok} persona{counts.ok === 1 ? "" : "s"}</button>
              </div>
            </>
          )}

          {step === "saving" && (
            <div className="py-14 text-center">
              <Loader2 size={28} className="mx-auto animate-spin text-indigo" />
              <p className="mt-3 text-sm text-slate-600">Guardando el organigrama…</p>
            </div>
          )}

          {step === "done" && result && (
            <div className="py-2">
              {result.error ? (
                <div className="rounded-xl bg-coral-soft p-4 text-sm">
                  <div className="font-medium text-coral flex items-center gap-2"><AlertTriangle size={15} /> No se pudo importar</div>
                  <p className="text-slate-700 mt-1">{result.error}</p>
                </div>
              ) : (
                <div className="rounded-xl bg-mint-soft p-4 text-sm">
                  <div className="font-medium text-sob flex items-center gap-2"><CheckCircle2 size={16} /> Organigrama importado</div>
                  <p className="text-slate-700 mt-1">
                    {result.invited} invitación{result.invited === 1 ? "" : "es"} nueva{result.invited === 1 ? "" : "s"}{result.updated ? ` · ${result.updated} persona${result.updated === 1 ? "" : "s"} actualizada${result.updated === 1 ? "" : "s"}` : ""}.
                    {" "}Cada quien queda bajo su jefe en cuanto entra a METIS, aunque el jefe todavía no se haya registrado.
                  </p>
                </div>
              )}

              {mail && (
                <div className="mt-4 rounded-xl ring-1 ring-slate-100 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {mail.sent + mail.failed.length < mail.total ? <Loader2 size={15} className="animate-spin text-indigo" /> : <Mail size={15} className="text-indigo" />}
                    Correos: {mail.sent} de {mail.total} enviados{mail.failed.length ? ` · ${mail.failed.length} no salieron` : ""}
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-indigo transition-all" style={{ width: `${((mail.sent + mail.failed.length) / mail.total) * 100}%` }} /></div>
                  {mail.sent + mail.failed.length < mail.total && <p className="mt-2 text-[11px] text-slate-400">No cierres esta ventana hasta que termine.</p>}
                  {mail.failed.length > 0 && (
                    <div className="mt-3 text-xs text-slate-600">
                      <div className="text-coral font-medium">{mail.failed[0].msg}</div>
                      <div className="mt-1 text-slate-500">Puedes reenviarlas desde la lista de Invitaciones: {mail.failed.slice(0, 5).map((f) => f.email).join(", ")}{mail.failed.length > 5 ? "…" : ""}</div>
                    </div>
                  )}
                </div>
              )}
              {!mail && !result.error && result.invited > 0 && (
                <p className="mt-3 text-xs text-slate-500">{real ? "No se enviaron correos. Cuando quieras, mándalos desde la lista de Invitaciones o comparte el código de empresa." : "Demo: las invitaciones aparecen en la lista, sin correo."}</p>
              )}

              <div className="mt-5 flex justify-end gap-2">
                {result.error && <button className="btn-ghost" onClick={() => setStep("preview")}>Volver</button>}
                <button className="btn-primary" disabled={!!mail && mail.sent + mail.failed.length < mail.total} onClick={onClose}>Listo</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Steps({ step }: { step: Step }) {
  const i = step === "upload" ? 0 : step === "preview" ? 1 : 2;
  return (
    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
      {["Archivo", "Vista previa", "Listo"].map((l, k) => (
        <span key={l} className="inline-flex items-center gap-1">
          {k > 0 && <ChevronRight size={11} />}
          <span className={clsx(k === i && "text-indigo font-medium", k < i && "text-slate-600")}>{l}</span>
        </span>
      ))}
    </div>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <div className={clsx("text-xl font-semibold tabular-nums", tone)}>{n.toLocaleString("es-MX")}</div>
      <div className="text-[11px] text-slate-500 leading-tight">{label}</div>
    </div>
  );
}

function TreeRow({ r }: { r: CheckedRow }) {
  return (
    <li className="flex items-center gap-2 py-2 pr-3 text-sm" style={{ paddingLeft: 12 + Math.min(r.depth, 8) * 20 }}>
      {r.depth > 0 && <span className="text-slate-300 -ml-3">└</span>}
      <div className="min-w-0 flex-1">
        <div className="truncate"><span className="font-medium">{r.name || r.email.split("@")[0]}</span>{r.title && <span className="text-slate-500"> · {r.title}</span>}</div>
        <div className="truncate text-[11px] text-slate-400">{r.email}{r.employeeNumber && ` · #${r.employeeNumber}`}{r.area && ` · ${r.area}`}{r.depth === 0 && r.managerEmail && <span className="text-indigo"> · reporta a {r.managerEmail}</span>}</div>
      </div>
      {r.warnings.length > 0 && <span title={r.warnings.join(" ")}><AlertTriangle size={13} className="text-amber" /></span>}
      {r.existing && <span className="chip bg-slate-100 text-slate-500 text-[10px]">ya está</span>}
      <span className={clsx("chip text-[10px]", r.role === "manager" ? "bg-indigo-soft text-indigo" : r.role === "admin" ? "bg-amber-soft text-amber" : "bg-slate-100 text-slate-600")}>{ROLE[r.role]}</span>
    </li>
  );
}

function Issues({ rows }: { rows: CheckedRow[] }) {
  if (!rows.length) return <p className="p-6 text-sm text-sob text-center flex items-center justify-center gap-2"><CheckCircle2 size={15} /> Sin errores ni avisos.</p>;
  const sorted = [...rows].sort((a, b) => (b.errors.length ? 1 : 0) - (a.errors.length ? 1 : 0) || a.line - b.line);
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-white"><tr className="text-left text-[11px] text-slate-400"><th className="px-3 py-2 w-14">Fila</th><th className="px-3 py-2">Persona</th><th className="px-3 py-2">Qué pasa</th></tr></thead>
      <tbody className="divide-y divide-slate-50">
        {sorted.map((r) => (
          <tr key={r.line} className="align-top">
            <td className="px-3 py-2 tabular-nums text-slate-400">{r.line}</td>
            <td className="px-3 py-2"><div className="font-medium truncate max-w-[14rem]">{r.name || "—"}</div><div className="text-[11px] text-slate-400 truncate max-w-[14rem]">{r.email || "sin correo"}</div></td>
            <td className="px-3 py-2 text-xs space-y-0.5">
              {r.errors.map((e) => <div key={e} className="text-coral flex gap-1"><X size={12} className="mt-0.5 shrink-0" /> {e}</div>)}
              {r.warnings.map((w) => <div key={w} className="text-amber flex gap-1"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {w}</div>)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
