import { PageHeader } from "@/components/ui/primitives";

const COPY: Record<string, string> = {
  "Sesiones WTW / WTM": "Win the Week · Win the Month. El jefe programa una vez; METIS arma el deck 2 días antes, el equipo comenta en su slide, la sesión ocurre en Teams/Meet y la IA propone compromisos. Llega en v1 (Q1–Q2 2027).",
  "Compromisos": "Compromisos con responsable, fecha y KPI vinculado, generados desde las sesiones. Escalamiento automático si vencen dos veces. Llega con el módulo de sesiones.",
  "Unidades de medida": "Catálogo de unidades (%, $, días, pts, toneladas…) con formato por país. En el MVP la unidad se captura como texto en cada elemento.",
  "Notificaciones": "Recordatorios antes del cierre y alertas cuando un KPI cae a rojo, por correo, Teams o WhatsApp.",
};

export function Soon({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="card p-8 max-w-2xl">
        <span className="chip bg-indigo-soft text-indigo mb-3">En la hoja de ruta</span>
        <p className="text-slate-600">{COPY[title] ?? "Este módulo llega en una versión posterior."}</p>
      </div>
    </>
  );
}
