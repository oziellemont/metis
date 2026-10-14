import Link from "next/link";
import { PRICE_TIERS } from "@/lib/billing";
import { ArrowRight, Check, GitBranch, Link2, CalendarClock, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site/SiteNav";
import { HeroStory } from "@/components/site/HeroStory";

export default function Landing() {
  return (
    <>
      <div className="bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] text-white">
        <SiteNav dark />
        <section className="mx-auto max-w-6xl px-6 pt-14 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="chip bg-white/10 text-white/90">Plataforma SaaS + Consultoría en Alineación y Growth</span>
            <h1 className="mt-5 text-4xl leading-[1.2] sm:text-5xl sm:leading-[1.2] font-semibold tracking-tight">Que toda tu empresa empuje hacia el mismo lado.</h1>
            <p className="mt-5 text-lg text-white/75 max-w-xl">mêtis convierte la estrategia de tu empresa en objetivos, KPIs y proyectos claros para cada área y cada persona, medidos mes a mes.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/indice" className="btn bg-mint text-white hover:bg-mint-light !px-5 !py-3">Mide tu Índice de Alineación <ArrowRight size={16} /></Link>
              <Link href="/inicio" className="btn bg-white/10 text-white hover:bg-white/20 !px-5 !py-3">Ver la plataforma en demo</Link>
            </div>
            <p className="mt-4 text-xs text-white/50">Gratis · 6 minutos · resultado inmediato en PDF</p>
          </div>
          <HeroStory />
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
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo">La cascada mêtis</div>
          <h2 className="mt-2 text-3xl font-semibold max-w-2xl">De la visión del consejo al KPI de cada persona.</h2>
          <div className="mt-10 grid lg:grid-cols-4 gap-5">
            {[
              [GitBranch, "Cascada conectada", "MEGA → Líneas de Acción → KPIs y proyectos por alcance → responsables. Si cambias una línea de acción, sabes exactamente qué se ve afectado."],
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
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo">mêtis Growth Advisory</div>
            <h2 className="mt-2 text-3xl font-semibold">La herramienta ordena. El acompañamiento hace crecer.</h2>
            <p className="mt-3 text-slate-600">No te dejamos solo con un software. Diseñamos contigo la estrategia, la cascadeamos hasta cada responsable y te ayudamos a sostener el ritmo de gestión.</p>
            <ul className="mt-8 space-y-5 hidden lg:block">
              {[
                ["Diagnóstico de Alineación", "Dónde está hoy tu empresa y qué la frena."],
                ["Arquitectura Estratégica", "La MEGA, sus líneas de acción, KPIs y proyectos, conectados."],
                ["Growth Sprints de 90 días", "Ciclos cortos para mover los indicadores que importan."],
                ["Estratega Fraccional", "Un director de estrategia en tu mesa, sin el costo de tiempo completo."],
                ["Academia mêtis", "Talleres prácticos para que tu equipo domine el método."],
              ].map(([t, d]) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-mint/15 text-mint grid place-items-center"><Check size={12} strokeWidth={3} /></span>
                  <div><div className="font-medium text-ink">{t}</div><div className="text-sm text-slate-500">{d}</div></div>
                </li>
              ))}
            </ul>
            <a href="mailto:hola@metisalign.mx?subject=Quiero%20platicar%20sobre%20METIS" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-indigo hover:gap-2.5 transition-all">Platiquemos de tu caso <ArrowRight size={14} /></a>
          </div>
          <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_1px_2px_rgba(23,26,58,0.04),0_12px_32px_-12px_rgba(23,26,58,0.10)] p-7 lg:p-8">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold text-ink">Ruta de implementación</h3>
              <span className="text-xs font-medium text-slate-400 tabular-nums">12 semanas</span>
            </div>
            <ol className="mt-7">
              {[
                ["1–3", "Diagnóstico", "Entrevistas, KPIs actuales e Índice de Alineación."],
                ["3–6", "Diseño estratégico", "MEGA, líneas de acción, KPIs y proyectos."],
                ["6–8", "Cascadeo y metas", "Alcances, Owners, Contributors y metas."],
                ["8–10", "Configuración y capacitación", "Plataforma lista, carga inicial y Academia."],
                ["10–12", "Primer cierre y ritmo", "Primer cierre mensual y sesiones WTW / WTM."],
              ].map(([w, t, d], i, arr) => (
                <li key={w} className="relative grid grid-cols-[3.75rem_1fr] gap-x-4">
                  <div className="pt-px text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Semana</div>
                    <div className="text-sm font-semibold text-indigo tabular-nums leading-tight">{w}</div>
                  </div>
                  <div className={"relative pl-6 " + (i < arr.length - 1 ? "pb-8" : "")}>
                    {i < arr.length - 1 && <span aria-hidden className="absolute left-[5px] top-4 bottom-0 w-px bg-gradient-to-b from-indigo/30 to-indigo/10" />}
                    <span aria-hidden className={"absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full ring-4 ring-white " + (i === arr.length - 1 ? "bg-mint" : "bg-indigo")} />
                    <div className="font-medium text-ink leading-tight">{t}</div>
                    <p className="mt-1 text-sm text-slate-500 leading-snug">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="precios" className="bg-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo">mêtis Plataforma</div>
          <h2 className="mt-2 text-3xl font-semibold">Un precio que crece contigo.</h2>
          <p className="mt-2 text-slate-600 max-w-2xl">Pagas solo por los colaboradores activos con scorecard, no por toda tu plantilla. Todos los planes incluyen la cascada completa y los vínculos Owner ↔ Contributor, el corazón de mêtis.</p>
          <div className="mt-10 grid md:grid-cols-4 gap-5">
            {PRICE_TIERS.map((t) => [t.name, t.to ? `${t.from.toLocaleString("es-MX")} a ${t.to.toLocaleString("es-MX")}` : `Más de ${(t.from - 1).toLocaleString("es-MX")}`, t.price ? `$${t.price}` : "A la medida", t.setup, !!t.hot]).map(([n, r, p, c, hot]) => (
              <div key={n as string} className={"rounded-2xl p-6 border " + (hot ? "border-indigo bg-indigo-soft/40 relative" : "border-slate-100")}>
                {hot && <span className="absolute -top-3 left-6 chip bg-indigo text-white">Más elegido</span>}
                <div className="font-semibold">{n as string}</div><div className="text-xs text-slate-500">{r as string} colaboradores con scorecard</div>
                <div className="mt-4 text-3xl font-semibold">{p as string}</div><div className="text-xs text-slate-500">{(p as string).startsWith("$") ? "MXN por colaborador con scorecard / mes, plan anual" : "Precio por volumen y alcance"}</div>
                <div className="mt-4 text-xs text-slate-500">Configuración inicial: {c as string}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-400">Precios en MXN antes de IVA. Mínimo 15 colaboradores con scorecard. Se factura el número máximo de scorecards activos del mes. La configuración inicial se bonifica al 100% si contratas la Arquitectura Estratégica. Los primeros 10 Clientes Fundadores reciben 20% de descuento en plataforma durante 24 meses.</p>
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
