/**
 * mêtis CEO · Carrera continua · Taxonomía sector → industria (P0-B1).
 *
 * Fuente: documento estratégico P0 §3.1 (21 sectores) y Atlas §8.2 (`sector_catalog`, `industry_catalog`).
 * Reglas:
 *  - Datos puros, sin React. La UI nunca mantiene listas propias: todo sale de aquí.
 *  - Ids estables (minúsculas y guion bajo). Cambiar una etiqueta no cambia el id.
 *  - Una industria solo es jugable si tiene paquete de contenido aprobado, perfil de métricas y al menos un tipo
 *    de empresa soportado. Todo lo demás se muestra con COMING_SOON_LABEL y se bloquea.
 *  - El tipo de empresa (PYME / startup / establecida) es una dimensión aparte, nunca parte de la industria.
 *  - La búsqueda por sinónimo SUGIERE una pareja sector/industria; no la selecciona sola.
 *  - Detrás de la bandera `carrera_continua`: hoy ninguna pantalla lo usa.
 */
import { COMING_SOON_LABEL } from "../catalog";
import { isCompany } from "../companies";

export const TAXONOMY_VERSION = 1;

export const ARCHETYPES = [
  { id: "pyme", label: "PYME", appointedBy: "Te nombran los dueños.", hint: "Negocio local o regional, estructura ligera, recursos ajustados." },
  { id: "startup", label: "Startup en operación", appointedBy: "Te contratan los fundadores y los inversionistas.", hint: "Ya tiene producto, equipo y clientes; busca escala o rentabilidad." },
  { id: "establecida", label: "Establecida", appointedBy: "Te nombra el consejo.", hint: "Mediana, con operación predecible y mandos formales. No es gigante." },
] as const;
export type CompanyArchetype = (typeof ARCHETYPES)[number]["id"];
export const isArchetype = (v: unknown): v is CompanyArchetype => ARCHETYPES.some((a) => a.id === v);

/** Familias operativas: plantillas compartidas de métricas y casos (doc P0 §3.1 punto 7). */
export type OperatingFamily = "produccion" | "comercio" | "tecnologia" | "logistica" | "hospitalidad" | "servicios" | "capital" | "proyectos" | "financiero" | "salud";

export interface IndustrySeed {
  id: string;
  label: string;
  aliases?: string[];
  /** Paquete de contenido con casos aprobados (cumbre, forja, brasa…). Sin paquete = no jugable. */
  pack?: string;
  /** Tipos con contenido aprobado para esta industria. */
  archetypes?: CompanyArchetype[];
  /** Perfil de métricas propio de la industria (no se muestran KPI de inventario en SaaS, etc.). */
  metric?: string;
  /** Industria del foco de lanzamiento (decisión de Oziel). */
  focus?: boolean;
}
export interface SectorSeed {
  id: string;
  label: string;
  family: OperatingFamily;
  focus: boolean;
  industries: IndustrySeed[];
}

export type Availability = "available" | "coming_soon";
export interface Industry {
  id: string;
  sectorId: string;
  label: string;
  family: OperatingFamily;
  aliases: string[];
  contentPackId?: string;
  metricProfileId?: string;
  supportedArchetypes: CompanyArchetype[];
  availability: Availability;
  focus: boolean;
}
export interface Sector {
  id: string;
  label: string;
  family: OperatingFamily;
  focus: boolean;
  availability: Availability;
  industries: Industry[];
}

const SECTOR_DATA: SectorSeed[] = [
  { id: "agro", label: "Agricultura, ganadería y agroindustria", family: "produccion", focus: false, industries: [
    { id: "agricultura_de_granos", label: "Agricultura de granos" },
    { id: "horticultura", label: "Horticultura" },
    { id: "fruticultura", label: "Fruticultura" },
    { id: "agricultura_protegida_invernaderos", label: "Agricultura protegida/invernaderos" },
    { id: "ganaderia_bovina", label: "Ganadería bovina" },
    { id: "produccion_avicola_y_huevo", label: "Producción avícola y huevo" },
    { id: "acuicultura", label: "Acuicultura" },
    { id: "agroexportacion", label: "Agroexportación" },
    { id: "insumos_y_tecnologia_agricola", label: "Insumos y tecnología agrícola" },
    { id: "procesamiento_primario_de_productos", label: "Procesamiento primario de productos agrícolas" },
  ] },
  { id: "alimentos", label: "Alimentos y bebidas", family: "produccion", focus: true, industries: [
    { id: "botanas_y_snacks", label: "Botanas y snacks", aliases: ["snacks", "botanas", "papas", "frituras"], pack: "cumbre", archetypes: ["establecida"], metric: "consumo" },
    { id: "panaderia_industrial", label: "Panadería industrial", aliases: ["pan", "panaderia", "galletas"] },
    { id: "lacteos", label: "Lácteos", aliases: ["leche", "queso", "yogurt"] },
    { id: "carnes_y_embutidos", label: "Carnes y embutidos" },
    { id: "alimentos_congelados", label: "Alimentos congelados" },
    { id: "alimentos_preparados", label: "Alimentos preparados" },
    { id: "productos_saludables_y_funcionales", label: "Productos saludables y funcionales" },
    { id: "bebidas_no_alcoholicas", label: "Bebidas no alcohólicas", aliases: ["refrescos", "jugos", "agua embotellada"] },
    { id: "cafe_y_tostado", label: "Café y tostado", aliases: ["cafe"] },
    { id: "embotellado_y_envasado", label: "Embotellado y envasado" },
    { id: "ingredientes_alimentarios", label: "Ingredientes alimentarios" },
    { id: "alimentos_para_mascotas", label: "Alimentos para mascotas" },
  ] },
  { id: "manufactura", label: "Manufactura y bienes industriales", family: "produccion", focus: true, industries: [
    { id: "maquinaria_y_equipo_industrial", label: "Maquinaria y equipo industrial" },
    { id: "fabricacion_de_electrodomesticos", label: "Fabricación de electrodomésticos" },
    { id: "electronica_y_componentes", label: "Electrónica y componentes", aliases: ["electronica"] },
    { id: "semiconductores_y_componentes_especializados", label: "Semiconductores y componentes especializados" },
    { id: "plasticos_y_polimeros", label: "Plásticos y polímeros", aliases: ["plasticos", "inyeccion de plastico"] },
    { id: "empaques_y_envases", label: "Empaques y envases", aliases: ["empaques", "envases", "packaging"] },
    { id: "papel_y_carton", label: "Papel y cartón" },
    { id: "muebles_y_mobiliario", label: "Muebles y mobiliario" },
    { id: "equipo_medico", label: "Equipo médico" },
    { id: "manufactura_por_contrato", label: "Manufactura por contrato", aliases: ["maquila", "maquiladora", "ems"] },
    { id: "componentes_aeroespaciales", label: "Componentes aeroespaciales" },
    { id: "automatizacion_industrial_y_robotica", label: "Automatización industrial y robótica" },
  ] },
  { id: "mineria", label: "Minería, metales y materiales", family: "capital", focus: false, industries: [
    { id: "extraccion_minera_metalica", label: "Extracción minera metálica" },
    { id: "minerales_no_metalicos", label: "Minerales no metálicos" },
    { id: "siderurgia_y_acero", label: "Siderurgia y acero", aliases: ["acero", "acerera"] },
    { id: "transformacion_metalmecanica", label: "Transformación metalmecánica" },
    { id: "aluminio", label: "Aluminio" },
    { id: "fundicion", label: "Fundición" },
    { id: "cemento_y_concreto", label: "Cemento y concreto", aliases: ["cemento", "concreto", "cementera"] },
    { id: "vidrio_industrial", label: "Vidrio industrial" },
    { id: "ceramica", label: "Cerámica" },
    { id: "materiales_compuestos", label: "Materiales compuestos" },
    { id: "distribucion_de_materiales_industriales", label: "Distribución de materiales industriales" },
  ] },
  { id: "energia", label: "Energía y servicios públicos", family: "capital", focus: false, industries: [
    { id: "generacion_solar", label: "Generación solar", aliases: ["solar", "paneles"] },
    { id: "generacion_eolica", label: "Generación eólica" },
    { id: "generacion_convencional", label: "Generación convencional" },
    { id: "comercializacion_y_suministro_electrico", label: "Comercialización y suministro eléctrico" },
    { id: "almacenamiento_de_energia", label: "Almacenamiento de energía" },
    { id: "infraestructura_de_recarga", label: "Infraestructura de recarga" },
    { id: "petroleo_y_gas", label: "Petróleo y gas", aliases: ["oil and gas", "petroleo"] },
    { id: "gas_natural_y_distribucion", label: "Gas natural y distribución" },
    { id: "eficiencia_energetica", label: "Eficiencia energética" },
    { id: "suministro_y_tratamiento_de", label: "Suministro y tratamiento de agua" },
    { id: "servicios_de_redes_electricas", label: "Servicios de redes eléctricas" },
  ] },
  { id: "construccion", label: "Construcción e infraestructura", family: "proyectos", focus: false, industries: [
    { id: "construccion_residencial", label: "Construcción residencial", aliases: ["constructora", "vivienda"] },
    { id: "construccion_comercial", label: "Construcción comercial" },
    { id: "construccion_industrial", label: "Construcción industrial" },
    { id: "obras_civiles_y_carreteras", label: "Obras civiles y carreteras" },
    { id: "infraestructura_urbana", label: "Infraestructura urbana" },
    { id: "ingenieria_y_diseno_de", label: "Ingeniería y diseño de proyectos" },
    { id: "instalaciones_electromecanicas", label: "Instalaciones electromecánicas" },
    { id: "mantenimiento_de_infraestructura", label: "Mantenimiento de infraestructura" },
    { id: "prefabricados_y_construccion_modular", label: "Prefabricados y construcción modular" },
    { id: "contratistas_especializados", label: "Contratistas especializados" },
  ] },
  { id: "inmobiliario", label: "Inmobiliario y administración de propiedades", family: "proyectos", focus: false, industries: [
    { id: "desarrollo_inmobiliario_residencial", label: "Desarrollo inmobiliario residencial" },
    { id: "desarrollo_comercial", label: "Desarrollo comercial" },
    { id: "parques_industriales_y_naves", label: "Parques industriales y naves" },
    { id: "administracion_de_propiedades", label: "Administración de propiedades" },
    { id: "corretaje_inmobiliario", label: "Corretaje inmobiliario" },
    { id: "arrendamiento_comercial", label: "Arrendamiento comercial" },
    { id: "espacios_de_coworking", label: "Espacios de coworking" },
    { id: "administracion_de_condominios", label: "Administración de condominios" },
    { id: "inversion_y_operacion_de", label: "Inversión y operación de activos inmobiliarios" },
  ] },
  { id: "logistica", label: "Transporte, logística y cadena de suministro", family: "logistica", focus: true, industries: [
    { id: "transporte_terrestre_de_carga", label: "Transporte terrestre de carga", aliases: ["transporte", "camiones", "fletes", "autotransporte"] },
    { id: "ultima_milla", label: "Última milla", aliases: ["last mile", "reparto"] },
    { id: "paqueteria_y_mensajeria", label: "Paquetería y mensajería" },
    { id: "almacenes_y_centros_de", label: "Almacenes y centros de distribución", aliases: ["cedis", "almacen", "bodega", "centro de distribucion"] },
    { id: "operadores_3pl_4pl", label: "Operadores 3PL/4PL", aliases: ["3pl", "4pl", "logistica", "operador logistico"] },
    { id: "logistica_de_cadena_fria", label: "Logística de cadena fría", aliases: ["cadena fria", "refrigerados"] },
    { id: "logistica_internacional_y_aduanas", label: "Logística internacional y aduanas", aliases: ["aduanas", "comercio exterior", "agente aduanal"] },
    { id: "transporte_maritimo", label: "Transporte marítimo" },
    { id: "carga_aerea", label: "Carga aérea" },
    { id: "transporte_ferroviario", label: "Transporte ferroviario" },
    { id: "fulfillment_de_e_commerce", label: "Fulfillment de e-commerce", aliases: ["fulfillment"] },
    { id: "plataformas_logisticas", label: "Plataformas logísticas" },
  ] },
  { id: "automotriz", label: "Automotriz y movilidad", family: "produccion", focus: false, industries: [
    { id: "fabricacion_de_autopartes", label: "Fabricación de autopartes", aliases: ["autopartes", "auto parts", "tier 1", "proveedor automotriz"], pack: "forja", archetypes: ["establecida"], metric: "autopartes", focus: true },
    { id: "ensamblaje_automotriz", label: "Ensamblaje automotriz" },
    { id: "distribucion_y_agencias", label: "Distribución y agencias" },
    { id: "movilidad_electrica", label: "Movilidad eléctrica" },
    { id: "servicios_de_flotillas", label: "Servicios de flotillas" },
    { id: "leasing_vehicular", label: "Leasing vehicular" },
    { id: "mantenimiento_y_postventa", label: "Mantenimiento y postventa" },
    { id: "micromovilidad", label: "Micromovilidad" },
    { id: "movilidad_compartida", label: "Movilidad compartida" },
    { id: "tecnologia_para_vehiculos", label: "Tecnología para vehículos" },
    { id: "comercializacion_de_refacciones", label: "Comercialización de refacciones", aliases: ["refacciones"] },
  ] },
  { id: "retail", label: "Comercio, retail y e-commerce", family: "comercio", focus: true, industries: [
    { id: "supermercados", label: "Supermercados", aliases: ["super", "abarrotes"] },
    { id: "tiendas_de_conveniencia", label: "Tiendas de conveniencia", aliases: ["conveniencia", "minisuper"] },
    { id: "comercio_mayorista_b2b", label: "Comercio mayorista B2B" },
    { id: "moda_y_accesorios", label: "Moda y accesorios", aliases: ["ropa", "moda"] },
    { id: "belleza_y_cosmetica_retail", label: "Belleza y cosmética retail" },
    { id: "electronica_de_consumo", label: "Electrónica de consumo" },
    { id: "hogar_y_mejoras", label: "Hogar y mejoras" },
    { id: "farmacias_comerciales", label: "Farmacias comerciales", aliases: ["farmacia", "farmacias"] },
    { id: "tiendas_especializadas", label: "Tiendas especializadas" },
    { id: "e_commerce_dtc", label: "E-commerce DTC", aliases: ["ecommerce", "e-commerce", "tienda en linea", "dtc"] },
    { id: "marketplaces", label: "Marketplaces", aliases: ["marketplace"] },
    { id: "comercio_omnicanal", label: "Comercio omnicanal", aliases: ["omnicanal", "retail", "tiendas"] },
  ] },
  { id: "tecnologia", label: "Tecnología, software e inteligencia artificial", family: "tecnologia", focus: true, industries: [
    { id: "software_empresarial_b2b", label: "Software empresarial B2B (SaaS)", aliases: ["saas", "software", "b2b", "software as a service"] },
    { id: "aplicaciones_de_consumo", label: "Aplicaciones de consumo", aliases: ["app", "apps", "b2c"] },
    { id: "inteligencia_artificial_aplicada", label: "Inteligencia artificial aplicada", aliases: ["ia", "ai", "inteligencia artificial", "machine learning"] },
    { id: "ciberseguridad", label: "Ciberseguridad", aliases: ["seguridad informatica", "cyber"] },
    { id: "analisis_de_datos_y", label: "Análisis de datos y BI" },
    { id: "infraestructura_cloud_y_devops", label: "Infraestructura cloud y DevOps" },
    { id: "herramientas_de_productividad", label: "Herramientas de productividad" },
    { id: "software_industrial", label: "Software industrial" },
    { id: "desarrollo_de_software_a", label: "Desarrollo de software a medida" },
    { id: "plataformas_de_recursos_humanos", label: "Plataformas de recursos humanos (HRTech)", aliases: ["hrtech", "recursos humanos"] },
    { id: "tecnologia_de_marketing", label: "Tecnología de marketing (MarTech)", aliases: ["martech"] },
    { id: "videojuegos_y_software_interactivo", label: "Videojuegos y software interactivo", aliases: ["videojuegos", "gaming"] },
  ] },
  { id: "telecom", label: "Telecomunicaciones e infraestructura digital", family: "capital", focus: false, industries: [
    { id: "internet_fijo_y_fibra", label: "Internet fijo y fibra óptica" },
    { id: "redes_moviles", label: "Redes móviles" },
    { id: "telecomunicaciones_empresariales", label: "Telecomunicaciones empresariales" },
    { id: "torres_y_redes", label: "Torres y redes" },
    { id: "centros_de_datos", label: "Centros de datos" },
    { id: "conectividad_satelital", label: "Conectividad satelital" },
    { id: "servicios_de_redes_administradas", label: "Servicios de redes administradas" },
    { id: "infraestructura_iot", label: "Infraestructura IoT" },
    { id: "servicios_de_comunicaciones_unificadas", label: "Servicios de comunicaciones unificadas" },
  ] },
  { id: "finanzas", label: "Servicios financieros, banca y seguros", family: "financiero", focus: false, industries: [
    { id: "banca_comercial", label: "Banca comercial" },
    { id: "banca_digital_neobanca", label: "Banca digital/neobanca", aliases: ["fintech", "neobanco"] },
    { id: "credito_a_consumo", label: "Crédito a consumo" },
    { id: "credito_empresarial", label: "Crédito empresarial" },
    { id: "pagos_y_procesamiento", label: "Pagos y procesamiento", aliases: ["fintech", "pagos", "payments"] },
    { id: "fintech_de_cobranza", label: "Fintech de cobranza", aliases: ["fintech", "cobranza"] },
    { id: "remesas", label: "Remesas" },
    { id: "seguros_tradicionales", label: "Seguros tradicionales" },
    { id: "insurtech", label: "InsurTech", aliases: ["seguros digitales"] },
    { id: "inversiones_y_gestion_patrimonial", label: "Inversiones y gestión patrimonial" },
    { id: "factoring_y_financiamiento_comercial", label: "Factoring y financiamiento comercial" },
    { id: "leasing_financiero", label: "Leasing financiero" },
    { id: "plataformas_de_finanzas_personales", label: "Plataformas de finanzas personales" },
  ] },
  { id: "salud", label: "Salud, farmacéutica y ciencias de la vida", family: "salud", focus: false, industries: [
    { id: "hospitales", label: "Hospitales", aliases: ["hospital"] },
    { id: "clinicas_y_atencion_ambulatoria", label: "Clínicas y atención ambulatoria", aliases: ["clinica", "clinicas"] },
    { id: "laboratorios_de_diagnostico", label: "Laboratorios de diagnóstico" },
    { id: "clinicas_dentales", label: "Clínicas dentales" },
    { id: "telemedicina", label: "Telemedicina", aliases: ["healthtech"] },
    { id: "tecnologia_medica", label: "Tecnología médica (MedTech)" },
    { id: "fabricacion_farmaceutica", label: "Fabricación farmacéutica" },
    { id: "distribucion_farmaceutica", label: "Distribución farmacéutica" },
    { id: "biotecnologia", label: "Biotecnología" },
    { id: "atencion_domiciliaria", label: "Atención domiciliaria" },
    { id: "salud_ocupacional", label: "Salud ocupacional" },
    { id: "servicios_de_rehabilitacion", label: "Servicios de rehabilitación" },
  ] },
  { id: "educacion", label: "Educación y formación profesional", family: "servicios", focus: false, industries: [
    { id: "educacion_basica_privada", label: "Educación básica privada" },
    { id: "bachilleratos", label: "Bachilleratos" },
    { id: "universidades", label: "Universidades", aliases: ["universidad"] },
    { id: "formacion_ejecutiva", label: "Formación ejecutiva" },
    { id: "capacitacion_corporativa", label: "Capacitación corporativa" },
    { id: "educacion_en_linea", label: "Educación en línea" },
    { id: "edtech", label: "EdTech", aliases: ["educacion digital"] },
    { id: "escuelas_de_idiomas", label: "Escuelas de idiomas" },
    { id: "certificaciones_profesionales", label: "Certificaciones profesionales" },
    { id: "formacion_tecnica_y_oficios", label: "Formación técnica y oficios" },
    { id: "tutoria_y_aprendizaje_personalizado", label: "Tutoría y aprendizaje personalizado" },
  ] },
  { id: "servicios", label: "Servicios profesionales y empresariales", family: "servicios", focus: false, industries: [
    { id: "consultoria_estrategica", label: "Consultoría estratégica", aliases: ["consultoria", "consultora"] },
    { id: "consultoria_de_operaciones", label: "Consultoría de operaciones" },
    { id: "despachos_legales", label: "Despachos legales" },
    { id: "contabilidad_y_auditoria", label: "Contabilidad y auditoría" },
    { id: "servicios_fiscales", label: "Servicios fiscales" },
    { id: "reclutamiento_y_talento", label: "Reclutamiento y talento", aliases: ["headhunter", "reclutamiento"] },
    { id: "outsourcing_bpo", label: "Outsourcing/BPO" },
    { id: "investigacion_de_mercados", label: "Investigación de mercados" },
    { id: "agencias_de_marketing", label: "Agencias de marketing", aliases: ["agencia", "publicidad"] },
    { id: "diseno_e_ingenieria_profesional", label: "Diseño e ingeniería profesional" },
    { id: "administracion_de_instalaciones", label: "Administración de instalaciones (facility management)" },
    { id: "seguridad_corporativa", label: "Seguridad corporativa" },
  ] },
  { id: "turismo", label: "Turismo, gastronomía y hospitalidad", family: "hospitalidad", focus: false, industries: [
    { id: "hoteleria", label: "Hotelería", aliases: ["hotel", "hoteles"] },
    { id: "restaurantes", label: "Restaurantes", aliases: ["restaurante", "comida", "food service", "cadena de restaurantes"], pack: "brasa", archetypes: ["establecida"], metric: "restaurante", focus: true },
    { id: "cafeterias", label: "Cafeterías", aliases: ["cafeteria", "coffee shop"] },
    { id: "catering", label: "Catering" },
    { id: "agencias_de_viajes", label: "Agencias de viajes" },
    { id: "operadores_turisticos", label: "Operadores turísticos" },
    { id: "viajes_corporativos", label: "Viajes corporativos" },
    { id: "organizacion_de_eventos_y", label: "Organización de eventos y convenciones" },
    { id: "parques_recreativos", label: "Parques recreativos" },
    { id: "experiencias_turisticas", label: "Experiencias turísticas" },
    { id: "hospitalidad_de_corta_estancia", label: "Hospitalidad de corta estancia" },
  ] },
  { id: "medios", label: "Medios, publicidad y entretenimiento", family: "servicios", focus: false, industries: [
    { id: "produccion_audiovisual", label: "Producción audiovisual" },
    { id: "medios_digitales", label: "Medios digitales" },
    { id: "editoriales_y_contenidos", label: "Editoriales y contenidos" },
    { id: "publicidad_y_medios", label: "Publicidad y medios" },
    { id: "produccion_musical", label: "Producción musical" },
    { id: "streaming_y_plataformas_de", label: "Streaming y plataformas de contenido" },
    { id: "entretenimiento_en_vivo", label: "Entretenimiento en vivo" },
    { id: "eventos_deportivos", label: "Eventos deportivos" },
    { id: "estudios_creativos_y_de", label: "Estudios creativos y de diseño" },
    { id: "produccion_de_contenidos_educativos", label: "Producción de contenidos educativos y corporativos" },
  ] },
  { id: "ambiental", label: "Servicios ambientales y economía circular", family: "servicios", focus: false, industries: [
    { id: "recoleccion_y_gestion_de", label: "Recolección y gestión de residuos" },
    { id: "reciclaje_de_plasticos", label: "Reciclaje de plásticos" },
    { id: "reciclaje_de_metales", label: "Reciclaje de metales" },
    { id: "valorizacion_de_residuos", label: "Valorización de residuos" },
    { id: "tratamiento_de_aguas_residuales", label: "Tratamiento de aguas residuales" },
    { id: "remediacion_ambiental", label: "Remediación ambiental" },
    { id: "consultoria_ambiental", label: "Consultoría ambiental" },
    { id: "soluciones_de_descarbonizacion", label: "Soluciones de descarbonización" },
    { id: "economia_circular_y_reutilizacion", label: "Economía circular y reutilización" },
    { id: "monitoreo_y_tecnologia_ambiental", label: "Monitoreo y tecnología ambiental" },
  ] },
  { id: "consumo", label: "Productos de consumo, moda y cuidado personal", family: "produccion", focus: false, industries: [
    { id: "confeccion_textil", label: "Confección textil" },
    { id: "marcas_de_ropa_deportiva", label: "Marcas de ropa deportiva" },
    { id: "calzado", label: "Calzado" },
    { id: "cosmeticos_y_cuidado_personal", label: "Cosméticos y cuidado personal" },
    { id: "productos_de_higiene", label: "Productos de higiene" },
    { id: "productos_para_el_hogar", label: "Productos para el hogar" },
    { id: "articulos_deportivos", label: "Artículos deportivos" },
    { id: "accesorios_y_marroquineria", label: "Accesorios y marroquinería" },
    { id: "juguetes_y_productos_recreativos", label: "Juguetes y productos recreativos" },
    { id: "manufactura_de_bienes_de", label: "Manufactura de bienes de consumo" },
  ] },
  { id: "bienestar", label: "Bienestar, fitness y servicios personales", family: "servicios", focus: false, industries: [
    { id: "gimnasios_y_estudios_deportivos", label: "Gimnasios y estudios deportivos", aliases: ["gimnasio", "gym", "fitness"] },
    { id: "entrenamiento_y_bienestar", label: "Entrenamiento y bienestar" },
    { id: "centros_de_fisioterapia_no", label: "Centros de fisioterapia no hospitalarios" },
    { id: "spas_y_estetica", label: "Spas y estética" },
    { id: "barberias_y_salones", label: "Barberías y salones" },
    { id: "nutricion_y_programas_de", label: "Nutrición y programas de bienestar" },
    { id: "lavanderias", label: "Lavanderías" },
    { id: "limpieza_residencial", label: "Limpieza residencial" },
    { id: "servicios_para_mascotas", label: "Servicios para mascotas" },
    { id: "servicios_de_mantenimiento_del", label: "Servicios de mantenimiento del hogar" },
  ] },
];

const toIndustry = (s: SectorSeed, i: IndustrySeed): Industry => {
  const supported = i.pack && isCompany(i.pack) && i.metric ? (i.archetypes ?? []) : [];
  return {
    id: i.id, sectorId: s.id, label: i.label, family: s.family, aliases: i.aliases ?? [],
    contentPackId: i.pack, metricProfileId: i.metric, supportedArchetypes: supported,
    availability: supported.length ? "available" : "coming_soon", focus: !!i.focus || s.focus,
  };
};

export const SECTORS: Sector[] = SECTOR_DATA.map((s) => {
  const industries = s.industries.map((i) => toIndustry(s, i));
  return { id: s.id, label: s.label, family: s.family, focus: s.focus, industries, availability: industries.some((i) => i.availability === "available") ? "available" : "coming_soon" };
});

const SECTOR_BY_ID: Record<string, Sector> = Object.fromEntries(SECTORS.map((s) => [s.id, s]));
const INDUSTRY_BY_KEY: Record<string, Industry> = Object.fromEntries(SECTORS.flatMap((s) => s.industries.map((i) => [`${s.id}/${i.id}`, i])));

export const sectorById = (id: string | undefined | null): Sector | undefined => (id ? SECTOR_BY_ID[id] : undefined);
export const industryOf = (sectorId: string | undefined | null, industryId: string | undefined | null): Industry | undefined =>
  sectorId && industryId ? INDUSTRY_BY_KEY[`${sectorId}/${industryId}`] : undefined;

/** Industrias del segundo desplegable: solo las del sector elegido. Sin sector, lista vacía (campo deshabilitado). */
export const industriesOf = (sectorId: string | undefined | null): Industry[] => sectorById(sectorId)?.industries ?? [];

export const INDUSTRY_PLACEHOLDER = "Primero elige un sector";
export const availabilityLabel = (a: Availability): string | null => (a === "coming_soon" ? COMING_SOON_LABEL : null);

/** Al cambiar de sector se limpia la industria si ya no pertenece (nunca queda una pareja inválida). */
export function changeSector(sel: { sectorId?: string; industryId?: string }, sectorId: string | undefined): { sectorId?: string; industryId?: string } {
  if (!sectorById(sectorId)) return {};
  const keep = sel.industryId && industryOf(sectorId, sel.industryId) ? sel.industryId : undefined;
  return { sectorId, ...(keep && sectorId === sel.sectorId ? { industryId: keep } : {}) };
}

/** Pareja sector/industria/tipo con contenido real: única puerta para entrar a una simulación. */
export function isPlayableCombo(sectorId: string | undefined, industryId: string | undefined, archetype?: string): boolean {
  const ind = industryOf(sectorId, industryId);
  if (!ind || ind.availability !== "available") return false;
  return archetype === undefined ? true : isArchetype(archetype) && ind.supportedArchetypes.includes(archetype);
}

/** Estado de un tipo de empresa dentro de una industria (para la tarjeta del paso 3). */
export const archetypeAvailability = (sectorId: string | undefined, industryId: string | undefined, archetype: CompanyArchetype): Availability =>
  isPlayableCombo(sectorId, industryId, archetype) ? "available" : "coming_soon";

/** Normaliza para buscar: minúsculas, sin acentos, sin signos. */
export const norm = (t: string): string => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export interface Suggestion { sectorId: string; industryId: string; label: string; sectorLabel: string; availability: Availability; matched: string }

/**
 * Búsqueda por sinónimo o nombre (ES/EN). Devuelve sugerencias ordenadas: primero coincidencia exacta de alias,
 * luego jugables, luego foco. No modifica ninguna selección: la UI ofrece «Usar» y el usuario confirma.
 */
export function searchIndustries(q: string, limit = 6): Suggestion[] {
  const n = norm(q);
  if (n.length < 2) return [];
  const out: (Suggestion & { score: number })[] = [];
  for (const s of SECTORS) for (const i of s.industries) {
    const terms = [i.label, ...i.aliases];
    let best = 0; let matched = "";
    for (const t of terms) {
      const nt = norm(t);
      const sc = nt === n ? 4 : nt.startsWith(n) ? 3 : nt.split(" ").some((w) => w.startsWith(n)) ? 2 : nt.includes(n) ? 1 : 0;
      if (sc > best) { best = sc; matched = t; }
    }
    if (!best && norm(s.label).split(" ").some((w) => w.startsWith(n))) { best = 0.5; matched = s.label; }
    if (best) out.push({ sectorId: s.id, industryId: i.id, label: i.label, sectorLabel: s.label, availability: i.availability, matched, score: best + (i.availability === "available" ? 0.3 : 0) + (i.focus ? 0.1 : 0) });
  }
  return out.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "es")).slice(0, limit).map(({ score: _s, ...r }) => r);
}

/** Industrias del foco de lanzamiento (jugables o no) — guía para escribir contenido. */
export const focusIndustries = (): Industry[] => SECTORS.flatMap((s) => s.industries.filter((i) => i.focus));
