import Link from "next/link";
import { ArrowRight, Check, GitBranch, Link2, CalendarClock, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site/SiteNav";

export default function Landing() {
  return (
    <>
      <div className="bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white">
        <SiteNav dark />
        <section className="mx-auto max-w-6xl px-6 pt-14 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="chip bg-white/10 text-white/90">Plataforma SaaS + Consultoría en Alineación y Growth</span>
            <h1 className="mt-5 text-4xl sm:text-5xl font-semibold leading-tight">Que toda tu empresa empuje hacia el mismo lado.</h1>
            <p className="mt-5 text-lg text-white/75 max-w-xl">METIS convierte la estrategia de tu empresa en objetivos, KPIs y proyectos claros para cada área y cada persona, medidos mes a mes. Y tu esquema de compensación por fin se conecta con la estrategia.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/indice" className="btn bg-mint text-white hover:bg-mint-light !px-5 !py-3">Mide tu Índice de Alineación <ArrowRight size={16} /></Link>
              <Link href="/inicio" className="btn bg-white/10 text-white hover:bg-white/20 !px-5 !py-3">Ver la plataforma en demo</Link>
            </div>
            <p className="mt-4 text-xs text-white/50">Gratis · 6 minutos · resultado inmediato en PDF</p>
          </div>
          <div className="card !bg-white/95 text-ink p-6 shadow-2xl">
            <div className="text-xs text-slate-400">Alineación de la organización</div>
            <div className="text-4xl font-semibold text-indigo mt-1">94%</div>
            <div className="text-xs text-slate-500">312 colaboradores con scorecard aprobado</div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500"><span>OTIF · Región Norte</span><span>Cierre de septiembre</span></div>
              <div className="flex items-end justify-between mt-1"><span className="text-2xl font-semibold">96.1%</span><span className="chip bg-mint-soft text-sat">Satisfactorio</span></div>
              <div className="mt-2 text-[11px] text-slate-400">Este dato alimenta a 4 Contributors · se actualizó en sus scorecards al guardar</div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {[["18", "Sobresaliente", "text-sob"], ["41", "Satisfactorio", "text-sat"], ["9", "Mínimo", "text-amber"], ["4", "Bajo mínimo", "text-coral"]].map(([n, l, c]) => <div key={l}><div className={`text-xl font-semibold ${c}`}>{n}</div><div className="text-[10px] text-slate-400">{l}</div></div>)}
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo">El reto de crecer</div>
          <h2 className="mt-2 text-3xl font-semibold">La estrategia existe. El problema es que no baja.</h2>
          <p className="mt-3 text-slate-600">Cuando una empresa crece, la visión del consejo y lo que hace cada colaborador el lunes por la mañana se separan. Aparecen objetivos en Excel que nadie actualiza, KPIs duplicados entre áreas y reuniones donde se discute el dato en lugar de la decisión.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[["Metas desconectadas", "Cada área define sus objetivos por su lado y nadie puede explicar cómo su trabajo mueve el resultado de la compañía."], ["Un dato, cinco versiones", "El mismo KPI se reporta distinto en cada región o unidad de negocio. No hay un dueño claro del dato."], ["Desempeño por percepción", "Archivos por correo, cierres tardíos y bonos que se deciden sin conexión con la estrategia."]].map(([t, d]) => (
            <div key={t} className="card p-6"><h3 className="font-semibold">{t}</h3><p className="mt-2 text-sm text-slate-600">{d}</p></div>
          ))}
        </div>
      </section>

      <section id="plataforma" className="bg-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo">La cascada METIS</div>
          <h2 className="mt-2 text-3xl font-semibold max-w-2xl">De la visión del consejo al KPI de cada persona.</h2>
          <div className="mt-10 grid lg:grid-cols-4 gap-5">
            {[
              [GitBranch, "Cascada conectada", "Objetivos → LAEs → KPIs y proyectos por alcance → responsables. Si cambias un objetivo, sabes exactamente qué se ve afectado."],
              [Link2, "Un dato, una captura", "El Owner (dueño del resultado) carga el dato una vez; los Contributors se actualizan solos. Adiós a capturas duplicadas."],
              [CalendarClock, "Ritmo de gestión automatizado", "Sesiones WTW / WTM con deck automático, comentarios previos, transcripción y compromisos con IA."],
              [Scale, "Compensación conectada a la estrategia", "Cumplimiento ponderado por persona, con metas mínima, satisfactoria y sobresaliente aprobadas por su jefe. La base objetiva para tu bono variable."],
            ].map(([Icon, t, d]) => { const I = Icon as React.ElementType; return (
              <div key={t as string} className="rounded-2xl border border-slate-100 p-6"><span className="h-10 w-10 rounded-xl bg-indigo-soft text-indigo inline-flex items-center justify-center"><I size={18} /></span><h3 className="mt-4 font-semibold">{t as string}</h3><p className="mt-2 text-sm text-slate-600">{d as string}</p></div>
            ); })}
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> 100% en la nube · datos cifrados · respaldos diarios</span><span className="inline-flex items-center gap-1.5"><Sparkles size={14} /> En español, en pesos, con acompañamiento local</span></div>
        </div>
      </section>

      <section id="consultoria" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo">METIS Growth Advisory</div>
            <h2 className="mt-2 text-3xl font-semibold">La herramienta ordena. El acompañamiento hace crecer.</h2>
            <p className="mt-3 text-slate-600">No te dejamos solo con un software. Diseñamos contigo la estrategia, la cascadeamos hasta cada responsable y te ayudamos a sostener el ritmo de gestión.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {[["Diagnóstico de Alineación", "2–3 semanas · $85,000 fijo"], ["Arquitectura Estratégica", "6–10 semanas · desde $180,000"], ["Growth Sprints de 90 días", "Retainer · desde $55,000/mes"], ["Estratega Fraccional", "Mínimo 6 meses · desde $95,000/mes"], ["Academia METIS", "Cursos de 4–8 h · $4,500 por participante"]].map(([t, p]) => (
                <li key={t} className="flex items-start gap-3"><Check size={16} className="text-mint mt-0.5 shrink-0" /><div><span className="font-medium">{t}</span> <span className="text-slate-500">· {p}</span></div></li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold">Ruta de implementación · 12 semanas</h3>
            <ol className="mt-4 space-y-3">
              {[["1–3", "Diagnóstico", "Entrevistas, revisión de KPIs actuales e Índice de Alineación."], ["3–6", "Diseño estratégico", "Objetivos corporativos, LAEs y catálogo de elementos."], ["6–8", "Cascadeo y metas", "Alcances, responsables Owner / Contributor y metas por nivel."], ["8–10", "Configuración y capacitación", "METIS listo, carga inicial y Academia para usuarios."], ["10–12", "Primer cierre y ritmo", "Primer cierre mensual y primeras sesiones WTW / WTM."]].map(([w, t, d]) => (
                <li key={w} className="flex gap-3 text-sm"><span className="chip bg-indigo-soft text-indigo shrink-0 w-14 justify-center">Sem {w}</span><div><div className="font-medium">{t}</div><div className="text-slate-500">{d}</div></div></li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="precios" className="bg-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo">METIS Plataforma</div>
          <h2 className="mt-2 text-3xl font-semibold">Un precio que crece contigo.</h2>
          <p className="mt-2 text-slate-600 max-w-2xl">Pagas por colaborador activo con scorecard. Todos los planes incluyen la cascada completa y los vínculos Owner ↔ Contributor, el corazón de METIS.</p>
          <div className="mt-10 grid md:grid-cols-4 gap-5">
            {[["Arranque", "15 a 60", "$189", "$35,000", false], ["Crecimiento", "61 a 300", "$159", "$75,000", true], ["Escala", "301 a 1,500", "$129", "$150,000", false], ["Corporativo", "Más de 1,500", "A la medida", "Cotización", false]].map(([n, r, p, c, hot]) => (
              <div key={n as string} className={"rounded-2xl p-6 border " + (hot ? "border-indigo bg-indigo-soft/40 relative" : "border-slate-100")}>
                {hot && <span className="absolute -top-3 left-6 chip bg-indigo text-white">Más elegido</span>}
                <div className="font-semibold">{n as string}</div><div className="text-xs text-slate-500">{r as string} colaboradores</div>
                <div className="mt-4 text-3xl font-semibold">{p as string}</div><div className="text-xs text-slate-500">{(p as string).startsWith("$") ? "MXN por colaborador / mes, plan anual" : "Precio por volumen y alcance"}</div>
                <div className="mt-4 text-xs text-slate-500">Configuración inicial: {c as string}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-400">Precios en MXN antes de IVA. Mínimo 15 colaboradores. La configuración inicial se bonifica al 100% si contratas la Arquitectura Estratégica. Los primeros 10 Clientes Fundadores reciben 20% de descuento en plataforma durante 24 meses.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1"><h2 className="text-3xl font-semibold">Alinea hoy. Crece todo el año.</h2><p className="mt-3 text-white/75">Empieza con el Índice de Alineación: en 6 minutos sabes dónde está la brecha entre tu estrategia y tu operación, y qué hacer primero.</p></div>
          <Link href="/indice" className="btn bg-mint text-white hover:bg-mint-light !px-6 !py-3">Medir mi alineación <ArrowRight size={16} /></Link>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
