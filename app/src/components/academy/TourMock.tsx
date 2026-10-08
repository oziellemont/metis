"use client";
/** Pantallas simuladas e interactivas de METIS para el tour (no tocan datos reales). */
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Search, Check, ChevronRight, Users, Target, Gauge, ClipboardList, Upload, GitBranch, Bell, HelpCircle, X } from "lucide-react";
import type { TourScreen } from "@/lib/academy/content";

const Frame = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-canvas overflow-hidden shadow-[0_12px_32px_-16px_rgba(23,26,58,0.25)]">
    <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2">
      <span className="h-2 w-2 rounded-full bg-slate-200" /><span className="h-2 w-2 rounded-full bg-slate-200" /><span className="h-2 w-2 rounded-full bg-slate-200" />
      <span className="ml-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><Icon size={12} className="text-indigo" /> {title}</span>
    </div>
    <div className="p-4 min-h-[260px]">{children}</div>
  </div>
);

function Inicio() {
  const [n, setN] = useState(0);
  useEffect(() => { const t = setInterval(() => setN((x) => (x < 96 ? x + 4 : x)), 30); return () => clearInterval(t); }, []);
  return (
    <Frame title="Inicio" icon={Gauge}>
      <div className="text-sm font-semibold text-ink">Hola, Ana</div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[["Mi cumplimiento", `${n}%`, "text-sob"], ["Cargas pendientes", "2", "text-coral"], ["Por aprobar", "1", "text-ink"]].map(([l, v, c]) => (
          <div key={l} className="rounded-xl bg-white border border-slate-100 p-2.5"><div className="text-[10px] text-slate-500 leading-tight">{l}</div><div className={clsx("text-lg font-semibold tabular-nums", c)}>{v}</div></div>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-white border border-slate-100 p-3 space-y-2">
        {["Cargar OTIF · Región Norte", "Cargar Merma · Planta MTY"].map((t) => <div key={t} className="flex items-center gap-2 rounded-lg bg-coral-soft/60 px-2.5 py-1.5 text-[11px]"><Upload size={11} className="text-coral" /> {t}</div>)}
        <div className="flex items-center gap-2 rounded-lg bg-indigo-soft px-2.5 py-1.5 text-[11px] text-indigo"><ClipboardList size={11} /> Aprobar scorecard de Luis</div>
      </div>
    </Frame>
  );
}

const STATES = [
  { k: "Borrador", tone: "bg-slate-100 text-slate-700", d: "Lo armas tú: eliges tus KPIs, metas y pesos (suman 100%)." },
  { k: "Enviado a jefe", tone: "bg-sky-soft text-sky", d: "Tu jefe lo revisa. Mientras, puedes seguir consultándolo." },
  { k: "Ajustes solicitados", tone: "bg-amber-soft text-amber", d: "Tu jefe te pide cambios; los haces y lo vuelves a enviar." },
  { k: "Aprobado", tone: "bg-mint-soft text-sob", d: "Queda como tu compromiso del año. Cada mes se llena con los datos reales." },
];
function Scorecard() {
  const [i, setI] = useState(0);
  return (
    <Frame title="Mi Scorecard" icon={ClipboardList}>
      <div className="flex flex-wrap gap-1.5">
        {STATES.map((st, j) => (
          <button key={st.k} onClick={() => setI(j)} className={clsx("chip transition-all", st.tone, j === i ? "ring-2 ring-indigo/40 scale-105" : "opacity-60 hover:opacity-100")}>{st.k}</button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-600 min-h-[32px]">{STATES[i].d}</p>
      <div className="mt-2 rounded-xl bg-white border border-slate-100 divide-y divide-slate-100">
        {[["Venta canal moderno", "30%", "bg-sob", "104%"], ["OTIF", "25%", "bg-min", "93%"], ["Merma", "20%", "bg-sat", "101%"], ["Proyecto CRM", "25%", "bg-slate-300", "—"]].map(([n, w, d, v]) => (
          <div key={n} className="flex items-center gap-2 px-3 py-2 text-[11px]"><span className="flex-1 font-medium text-ink">{n}</span><span className="text-slate-400 w-8">{w}</span><span className="tabular-nums w-10 text-right">{v}</span><span className={clsx("h-2 w-2 rounded-full", d)} /></div>
        ))}
      </div>
    </Frame>
  );
}

function Carga() {
  const [v, setV] = useState("");
  const val = Number(v);
  const has = v !== "" && !Number.isNaN(val);
  const pct = has ? Math.round((val / 95) * 100) : null;
  const tone = pct === null ? "bg-slate-300" : pct >= 100 ? "bg-sob" : pct >= 90 ? "bg-min" : "bg-bajo";
  return (
    <Frame title="Carga mensual" icon={Upload}>
      <div className="rounded-xl bg-white border border-slate-100 p-3">
        <div className="flex items-center justify-between text-[11px]"><span className="font-semibold text-ink">OTIF · Región Norte</span><span className="chip bg-indigo-soft text-indigo !text-[10px]">Owner: tú</span></div>
        <div className="mt-2 flex items-center gap-2">
          <input value={v} onChange={(e) => setV(e.target.value.replace(/[^0-9.]/g, "").slice(0, 5))} placeholder="Escribe un valor, p. ej. 97" className="input !py-1.5 !text-xs" aria-label="Valor de prueba" />
          <span className="text-[11px] text-slate-400 whitespace-nowrap">Meta 95%</span>
        </div>
      </div>
      <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Se actualiza solo en</div>
      <div className="mt-1.5 space-y-1.5">
        {["Luis · Supervisor", "Marta · Supervisora", "Jorge · Coordinador"].map((p, i) => (
          <div key={p} className="flex items-center gap-2 rounded-lg bg-white border border-slate-100 px-2.5 py-1.5 text-[11px] transition-all" style={{ transitionDelay: `${i * 80}ms` }}>
            <Users size={11} className="text-slate-400" /><span className="flex-1">{p} <span className="text-slate-400">· Contributor</span></span>
            <span className="tabular-nums text-slate-500">{has ? `${val}%` : "—"}</span><span className={clsx("h-2 w-2 rounded-full transition-colors", tone)} />
          </div>
        ))}
      </div>
    </Frame>
  );
}

const OBJS = [
  { o: "Crecer rentablemente", laes: [["Expandir canal moderno", "Venta canal moderno · 3 personas"], ["Mejorar margen", "Margen bruto · 2 personas"]] },
  { o: "Excelencia operativa", laes: [["Entregas perfectas", "OTIF · 4 personas"], ["Reducir desperdicio", "Merma · 2 personas"]] },
];
function Mapa() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Frame title="Mapa de alineación" icon={GitBranch}>
      <div className="space-y-2">
        {OBJS.map((x, i) => (
          <div key={x.o} className="rounded-xl bg-white border border-slate-100">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-ink">
              <Target size={12} className="text-indigo" /> {x.o}<ChevronRight size={12} className={clsx("ml-auto transition-transform text-slate-400", open === i && "rotate-90")} />
            </button>
            {open === i && (
              <div className="px-3 pb-3 space-y-1.5 academy-in">
                {x.laes.map(([l, k]) => (
                  <div key={l} className="ml-3 border-l-2 border-indigo/20 pl-3">
                    <div className="text-[11px] font-medium text-ink">{l}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1"><Gauge size={10} /> {k}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Equipo() {
  const [ok, setOk] = useState(false);
  return (
    <Frame title="Mi equipo" icon={Users}>
      <div className="rounded-xl bg-white border border-slate-100 divide-y divide-slate-100">
        {[["Luis Garza", "98%", "Aprobado"], ["Marta Ruiz", "91%", "Aprobado"]].map(([n, p, st]) => (
          <div key={n} className="flex items-center gap-2 px-3 py-2 text-[11px]"><span className="h-6 w-6 rounded-full bg-indigo-soft text-indigo grid place-items-center text-[9px] font-semibold">{n.split(" ").map((w) => w[0]).join("")}</span><span className="flex-1 font-medium">{n}</span><span className="tabular-nums text-slate-500">{p}</span><span className="chip bg-mint-soft text-sob !text-[10px]">{st}</span></div>
        ))}
        <div className="flex items-center gap-2 px-3 py-2 text-[11px]">
          <span className="h-6 w-6 rounded-full bg-indigo-soft text-indigo grid place-items-center text-[9px] font-semibold">JP</span><span className="flex-1 font-medium">Jorge Pérez</span>
          {ok ? <span className="chip bg-mint-soft text-sob !text-[10px] academy-in"><Check size={10} className="mr-0.5" /> Aprobado</span>
            : <button onClick={() => setOk(true)} className="chip bg-indigo text-white !text-[10px] hover:bg-indigo-light">Aprobar scorecard</button>}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">{ok ? "Listo. Jorge recibe el aviso y su scorecard queda como compromiso del año." : "Pruébalo: aprueba el scorecard de Jorge."}</p>
    </Frame>
  );
}

function Buscar() {
  const full = "otif";
  const [q, setQ] = useState("");
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i++; setQ(full.slice(0, i)); if (i >= full.length) clearInterval(t); }, 260);
    return () => clearInterval(t);
  }, []);
  return (
    <Frame title="Buscador · ⌘K" icon={Search}>
      <div className="rounded-xl bg-white border border-indigo/30 ring-2 ring-indigo/10 px-3 py-2 flex items-center gap-2 text-[12px]"><Search size={12} className="text-slate-400" /><span>{q}<span className="inline-block w-px h-3 bg-indigo align-middle animate-pulse" /></span></div>
      {q.length >= 2 && (
        <div className="mt-2 rounded-xl bg-white border border-slate-100 p-1.5 academy-in">
          <div className="px-2 pt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">Indicadores</div>
          {["OTIF · Región Norte", "OTIF · Región Sur"].map((x, i) => <div key={x} className={clsx("rounded-lg px-2 py-1.5 text-[11px]", i === 0 && "bg-indigo-soft text-indigo")}><strong>OTIF</strong>{x.slice(4)}</div>)}
        </div>
      )}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-white border border-slate-100 p-3 text-[11px]">
        <Bell size={12} className="text-indigo mt-0.5 shrink-0" /><span><strong>Recordatorio · día 25</strong><br /><span className="text-slate-500">Prepara tu cierre: te faltan 2 datos.</span></span>
      </div>
    </Frame>
  );
}

function Ayuda() {
  const [open, setOpen] = useState(false);
  const [faq, setFaq] = useState(false);
  return (
    <Frame title="Carga mensual" icon={Upload}>
      <div className="relative min-h-[244px]">
        <div className={clsx("space-y-2 transition-opacity", open && "opacity-40")}>
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="rounded-xl bg-white border border-slate-100 p-3 space-y-2">
            <div className="h-2.5 w-40 rounded bg-slate-200" /><div className="h-7 rounded-lg bg-canvas border border-slate-100" />
          </div>
          <div className="rounded-xl bg-white border border-slate-100 p-3 space-y-2">
            <div className="h-2.5 w-28 rounded bg-slate-200" /><div className="h-7 rounded-lg bg-canvas border border-slate-100" />
          </div>
        </div>
        {open && (
          <div className="help-in absolute bottom-12 right-0 w-[230px] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_16px_40px_-16px_rgba(23,26,58,0.45)]">
            <div className="bg-gradient-to-br from-[#141735] via-[#1E1A5E] to-[#2B1F8A] px-3 py-2.5 text-white">
              <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-mint">Tu guía · estás en</div>
              <div className="text-[12px] font-semibold">Carga mensual</div>
              <div className="text-[10px] text-white/70 leading-snug">Captura el resultado de los indicadores donde eres Owner.</div>
            </div>
            <div className="px-3 py-2">
              <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">Dudas frecuentes</div>
              <button onClick={() => setFaq(!faq)} className="mt-1 flex w-full items-center text-left text-[10.5px] font-medium text-ink hover:text-indigo">
                ¿Cómo adjunto evidencia?<ChevronRight size={11} className={clsx("ml-auto text-slate-400 transition-transform", faq && "rotate-90")} />
              </button>
              {faq && <p className="academy-in mt-1 text-[10px] leading-snug text-slate-600">Usa «Adjuntar evidencia» en la tarjeta del indicador y sube el archivo que respalda el dato.</p>}
            </div>
          </div>
        )}
        <button onClick={() => setOpen(!open)} aria-label="Botón de ayuda de prueba"
          className="help-fab absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full text-white bg-gradient-to-br from-indigo-light via-indigo to-[#2B1F8A] shadow-[0_8px_18px_-6px_rgba(79,63,224,0.65)] hover:scale-105 transition-transform">
          {!open && <span aria-hidden className="help-ring absolute inset-0 rounded-full" />}
          {open ? <X size={15} /> : <HelpCircle size={17} />}
        </button>
        {!open && <div className="absolute bottom-2 right-11 text-[10px] font-medium text-indigo academy-in">Tócalo →</div>}
      </div>
    </Frame>
  );
}

export function TourMock({ screen }: { screen: TourScreen }) {
  const C = { inicio: Inicio, scorecard: Scorecard, carga: Carga, mapa: Mapa, equipo: Equipo, buscar: Buscar, ayuda: Ayuda }[screen];
  return <C />;
}
