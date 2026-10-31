# MÊTIS CEO — Cambio estratégico P0: una empresa, una carrera, decisiones que construyen criterio

**Documento de instrucciones para SuperNinja (SN)**  
**Solicitante:** Oziel Leal Montemayor  
**Fecha:** 31 de octubre de 2026  
**Naturaleza:** Adenda de producto y arquitectura al blueprint/roadmap existente. Sustituye únicamente los supuestos que se señalan; preserva lo demás.  
**Objetivo de este envío:** Que SN revise, dimensione y ejecute ordenadamente una evolución del producto, sin reconstruir MÊTIS desde cero ni alterar la aplicación en producción antes de presentar un plan verificable.

---

## 1. La decisión principal — NO negociable

**MÊTIS CEO es una experiencia inmersiva para aprender a dirigir una empresa realista y desarrollar criterio ejecutivo.** El usuario es **nombrado director general de una compañía que YA EXISTE**. Jamás es su fundador, emprendedor o creador. No empieza fundando una compañía ni la construye como un juego de negocios.

Desde el primer día dirige personas, recursos, clientes y resultados. Recibe mensajes, llamadas, correos, reportes, desacuerdos, oportunidades y crisis; decide con información incompleta y descubre consecuencias inmediatas y diferidas. La empresa evoluciona a lo largo del tiempo *como resultado* de su gestión, mientras MÊTIS le enseña los conceptos, teorías y habilidades que explican esas decisiones.

**Esta es la distinción esencial:**

- **La empresa es el contexto vivo de aprendizaje.** No es el premio ni el objetivo educativo en sí mismo.
- **El criterio del usuario es el objetivo.** El éxito financiero, la aceptación del consejo y la expansión importan, pero no sustituyen aprender a dirigir.
- **Una sola empresa constituye la carrera principal.** Dejar de saltar automáticamente entre compañías ficticias cada temporada.
- **Executive Rotations** son misiones especiales como ejecutivo invitado en otras industrias, *sin abandonar la empresa principal*.

### Frase de alineación para todo el equipo

> No estamos construyendo un Monopoly empresarial ni un simulador de fundar startups. Estamos construyendo una escuela inmersiva de liderazgo: el usuario es nombrado CEO de una empresa existente, la dirige durante años simulados y aprende de las consecuencias de sus decisiones.

## 2. Qué cambia y qué permanece

| Elemento | Estado actual documentado | Nueva dirección obligatoria |
|---|---|---|
| Identidad inicial | Elegir una empresa predefinida (Botanas Cumbre, Forja Norte o Grupo Brasa). | Elegir **sector → industria** en listas desplegables dependientes, **tipo de empresa** y **nombre personalizado**; el sistema crea un perfil coherente de compañía **ya operativa**. |
| Rol del usuario | Carta de nombramiento como director general. | **Conservar y reforzar**: nuevo CEO contratado o nombrado por propietarios/consejo. **Nunca fundador**. |
| Carrera principal | Temporadas de 7 días; veredicto; `advance()` mueve a otro contexto/empresa o repite. | **Empresa persistente**, con periodos de operación, cierres, revisiones y etapas de escala. No cambiar de compañía por completar una temporada. |
| Aprendizaje | Casos, Academy, XP, assessment, razonamiento, feedback. | **Conservar**; enriquecer la transferencia al negocio y los reportes, sin sustituir el aprendizaje por un tablero de números. |
| KPIs ejecutivos | `caja`, `margen`, `equipo`, `clientes`, `consejo`, cada índice de 0 a 100. | **Conservar los cinco índices** como termómetro sintético. Agregar indicadores reales de negocio, históricos, metas, tendencias y explicaciones causales. |
| Pestaña Empresa | Información, glosario, KPIs y organigrama. | Convertirla en **dashboard ejecutivo** de esa compañía, conservando el organigrama y su contexto. |
| Reportes directivos | Predominan casos y notificaciones. | Incorporar **reportes y sesiones de gestión** semanales/quincenales/mensuales en el mismo lenguaje de decisiones. |
| Casos existentes | Historias de empresas y personajes fijos; episodios enlazados. | **Reutilizar y adaptar**, con etiquetas por industria, etapa y tipo, y sustituciones contextualizadas. No reescribir todo. |
| Executive Rotations | Cambios entre otras empresas/industrias. | Convertirlas en **participaciones temporales** como asesor/ejecutivo invitado. La empresa principal se mantiene. |
| Executive Arena | Alta dificultad / retos avanzados. | **Conservar** como experiencia avanzada; desbloqueo ligado a evidencia real de dominio, no solo tamaño de empresa. |

**Regla de precedencia:** si el blueprint/roadmap anterior dice «conservar tres compañías como carrera principal», «cada siete días cambiar de empresa» o «ser ascendido a CEO después de pasar puestos previos», este documento **lo sustituye**. Se conserva el banco de contenido y las reglas educativas que no entren en conflicto.

## 3. Onboarding: simple, memorable y sin empresas impuestas

**No agregar complejidad innecesaria ni más formularios de los indispensables.** La experiencia debería sentirse como aceptar un nombramiento ejecutivo, no como crear una empresa.

### Flujo ideal (cuatro pasos visuales; sector e industria juntos)

1. **Nombramiento:** pantalla / carta breve: «Has sido nombrado Director General. La empresa ya tiene historia, clientes, equipo y retos. Ahora te toca dirigirla». Mantener una introducción atractiva, breve y con personalidad.
2. **Sector e industria:** un mismo paso con **dos listas desplegables dependientes**: primero «¿En qué sector quieres dirigir?» y después «¿En qué industria?». La segunda lista muestra solamente las industrias del sector elegido. Usar un catálogo amplio, organizado y ampliable (véase §3.1), señalando qué combinaciones tienen simulación completa.
3. **El tipo de empresa que dirigirás:** ofrecer **PYME**, **startup en operación** o **empresa establecida de tamaño pequeño/mediano**. Cada tarjeta lleva una explicación de una línea, no una ficha técnica.
4. **Nombre de tu empresa:** campo editable; mostrar dos o tres sugerencias realistas basadas en la industria, con la opción «Usar este nombre». **El nombre lo elige el usuario** y puede corregirlo en ajustes con reglas de continuidad.

Después, mostrar **un resumen ejecutivo de 20–30 segundos**: «Eres el nuevo Director General de [nombre]. Operamos en [industria] del sector [sector], tenemos [escala plausible], [situación actual] y estos son tus primeros desafíos». Presentar dos o tres personas relevantes y arrancar **el primer caso**. La configuración actual de notificaciones, horarios, dispositivos y cuenta debe integrarse sin convertir el onboarding en un interrogatorio.

**Importante:** el usuario **no define la empresa desde cero**: no elige capital inicial, no compra oficinas, no diseña productos ni contrata a todo el personal antes de empezar. El sistema le asigna una **empresa coherente que ya funciona**, con una historia previa, obligaciones, relaciones y datos iniciales plausibles.

### 3.1. Catálogo inicial de sectores e industrias — alcance amplio y extensible

**Instrucción nueva y prioritaria de Oziel:** ofrecer **ambas dimensiones, sector e industria**, no una única lista mezclada. El sector es la **familia económica amplia**; la industria es la **actividad específica** en la que opera la compañía. Por ejemplo: `Sector: Tecnología y software → Industria: Software empresarial B2B (SaaS)`. El catálogo siguiente es una propuesta de producto **no una reproducción oficial de SCIAN/NAICS**; SN deberá mantener etiquetas consistentes, evitar duplicados y ampliar sin cambiar la estructura de datos.

| Sector (primer desplegable) | Industrias (segundo desplegable, filtrado por sector) |
|---|---|
| **01. Agricultura, ganadería y agroindustria** | Agricultura de granos; horticultura; fruticultura; agricultura protegida/invernaderos; ganadería bovina; producción avícola y huevo; acuicultura; agroexportación; insumos y tecnología agrícola; procesamiento primario de productos agrícolas. |
| **02. Alimentos y bebidas** | Botanas y snacks; panadería industrial; lácteos; carnes y embutidos; alimentos congelados; alimentos preparados; productos saludables y funcionales; bebidas no alcohólicas; café y tostado; embotellado y envasado; ingredientes alimentarios; alimentos para mascotas. |
| **03. Manufactura y bienes industriales** | Maquinaria y equipo industrial; fabricación de electrodomésticos; electrónica y componentes; semiconductores y componentes especializados; plásticos y polímeros; empaques y envases; papel y cartón; muebles y mobiliario; equipo médico; manufactura por contrato; componentes aeroespaciales; automatización industrial y robótica. |
| **04. Minería, metales y materiales** | Extracción minera metálica; minerales no metálicos; siderurgia y acero; transformación metalmecánica; aluminio; fundición; cemento y concreto; vidrio industrial; cerámica; materiales compuestos; distribución de materiales industriales. |
| **05. Energía y servicios públicos** | Generación solar; generación eólica; generación convencional; comercialización y suministro eléctrico; almacenamiento de energía; infraestructura de recarga; petróleo y gas; gas natural y distribución; eficiencia energética; suministro y tratamiento de agua; servicios de redes eléctricas. |
| **06. Construcción e infraestructura** | Construcción residencial; construcción comercial; construcción industrial; obras civiles y carreteras; infraestructura urbana; ingeniería y diseño de proyectos; instalaciones electromecánicas; mantenimiento de infraestructura; prefabricados y construcción modular; contratistas especializados. |
| **07. Inmobiliario y administración de propiedades** | Desarrollo inmobiliario residencial; desarrollo comercial; parques industriales y naves; administración de propiedades; corretaje inmobiliario; arrendamiento comercial; espacios de coworking; administración de condominios; inversión y operación de activos inmobiliarios. |
| **08. Transporte, logística y cadena de suministro** | Transporte terrestre de carga; última milla; paquetería y mensajería; almacenes y centros de distribución; operadores 3PL/4PL; logística de cadena fría; logística internacional y aduanas; transporte marítimo; carga aérea; transporte ferroviario; fulfillment de e-commerce; plataformas logísticas. |
| **09. Automotriz y movilidad** | Fabricación de autopartes; ensamblaje automotriz; distribución y agencias; movilidad eléctrica; servicios de flotillas; leasing vehicular; mantenimiento y postventa; micromovilidad; movilidad compartida; tecnología para vehículos; comercialización de refacciones. |
| **10. Comercio, retail y e-commerce** | Supermercados; tiendas de conveniencia; comercio mayorista B2B; moda y accesorios; belleza y cosmética retail; electrónica de consumo; hogar y mejoras; farmacias comerciales; tiendas especializadas; e-commerce DTC; marketplaces; comercio omnicanal. |
| **11. Tecnología, software e inteligencia artificial** | Software empresarial B2B (SaaS); aplicaciones de consumo; inteligencia artificial aplicada; ciberseguridad; análisis de datos y BI; infraestructura cloud y DevOps; herramientas de productividad; software industrial; desarrollo de software a medida; plataformas de recursos humanos (HRTech); tecnología de marketing (MarTech); videojuegos y software interactivo. |
| **12. Telecomunicaciones e infraestructura digital** | Internet fijo y fibra óptica; redes móviles; telecomunicaciones empresariales; torres y redes; centros de datos; conectividad satelital; servicios de redes administradas; infraestructura IoT; servicios de comunicaciones unificadas. |
| **13. Servicios financieros, banca y seguros** | Banca comercial; banca digital/neobanca; crédito a consumo; crédito empresarial; pagos y procesamiento; fintech de cobranza; remesas; seguros tradicionales; InsurTech; inversiones y gestión patrimonial; factoring y financiamiento comercial; leasing financiero; plataformas de finanzas personales. |
| **14. Salud, farmacéutica y ciencias de la vida** | Hospitales; clínicas y atención ambulatoria; laboratorios de diagnóstico; clínicas dentales; telemedicina; tecnología médica (MedTech); fabricación farmacéutica; distribución farmacéutica; biotecnología; atención domiciliaria; salud ocupacional; servicios de rehabilitación. |
| **15. Educación y formación profesional** | Educación básica privada; bachilleratos; universidades; formación ejecutiva; capacitación corporativa; educación en línea; EdTech; escuelas de idiomas; certificaciones profesionales; formación técnica y oficios; tutoría y aprendizaje personalizado. |
| **16. Servicios profesionales y empresariales** | Consultoría estratégica; consultoría de operaciones; despachos legales; contabilidad y auditoría; servicios fiscales; reclutamiento y talento; outsourcing/BPO; investigación de mercados; agencias de marketing; diseño e ingeniería profesional; administración de instalaciones (facility management); seguridad corporativa. |
| **17. Turismo, gastronomía y hospitalidad** | Hotelería; restaurantes; cafeterías; catering; agencias de viajes; operadores turísticos; viajes corporativos; organización de eventos y convenciones; parques recreativos; experiencias turísticas; hospitalidad de corta estancia. |
| **18. Medios, publicidad y entretenimiento** | Producción audiovisual; medios digitales; editoriales y contenidos; publicidad y medios; producción musical; streaming y plataformas de contenido; entretenimiento en vivo; eventos deportivos; estudios creativos y de diseño; producción de contenidos educativos y corporativos. |
| **19. Servicios ambientales y economía circular** | Recolección y gestión de residuos; reciclaje de plásticos; reciclaje de metales; valorización de residuos; tratamiento de aguas residuales; remediación ambiental; consultoría ambiental; soluciones de descarbonización; economía circular y reutilización; monitoreo y tecnología ambiental. |
| **20. Productos de consumo, moda y cuidado personal** | Confección textil; marcas de ropa deportiva; calzado; cosméticos y cuidado personal; productos de higiene; productos para el hogar; artículos deportivos; accesorios y marroquinería; juguetes y productos recreativos; manufactura de bienes de consumo. |
| **21. Bienestar, fitness y servicios personales** | Gimnasios y estudios deportivos; entrenamiento y bienestar; centros de fisioterapia no hospitalarios; spas y estética; barberías y salones; nutrición y programas de bienestar; lavanderías; limpieza residencial; servicios para mascotas; servicios de mantenimiento del hogar. |

**El catálogo es de opciones potenciales, NO de simulaciones completas ya construidas.** Quiero un diseño capaz de cubrir todas estas familias y futuras industrias **sin recodificar el onboarding cada vez**. La disponibilidad real debe depender de contenidos, simulación, indicadores y personajes validados.

#### Comportamiento exacto de los desplegables

1. **Sector:** selector con buscador (`combobox`) y lista organizada; en móvil abrir menú accesible. Etiqueta visible «Sector». No seleccionar nada por defecto.
2. **Industria:** inicialmente deshabilitado con texto «Primero elige un sector». Al seleccionar un sector, habilitar y filtrar **solo sus industrias**; etiqueta visible «Industria».
3. Al cambiar el sector, **limpiar la industria anterior** para evitar combinaciones inválidas. No permitir continuar sin una pareja válida.
4. Después elegir **tipo de compañía** (PYME / startup ya existente / establecida) y, finalmente, **nombre**. Ese orden evita nombres o datos iniciales incoherentes.
5. El catálogo debe ser **configurable por datos**, con `sector_id`, `industry_id`, `display_label`, `sector_id_parent`, `availability`, `supported_archetypes`, `content_pack_id`, `simulation_profile_id`, `metric_profile_id` y alias de búsqueda; no mantener 21 listas hardcodeadas en la UI.
6. Para cada pareja sector/industria/tipo de empresa, comprobar que existen **casos semánticamente compatibles**, **KPI/estados iniciales creíbles**, **personajes y cargos plausibles**, **operación base** y **reporte periódico**. Si falta una pieza esencial: mostrar «Próximamente» y bloquear esa selección **sin permitir entrar a una simulación rota**. Se puede permitir registrar interés por esa industria sin prometer fecha.
7. Diseñar **plantillas compartidas por familias operativas** (producción, comercio, servicios recurrentes, tecnología, proyectos, capital intensivo, salud regulada, etc.) para expandirse eficientemente, pero garantizar particularidades en indicadores y decisiones. Ejemplo: no presentar un reporte de inventarios como indicador principal de una firma SaaS; no dar churn de suscripciones a una constructora por defecto.
8. **No duplicar la identidad:** el sector y la industria elegidos deben conservarse en la carrera, ficha de Empresa, reportes, filtros de contenido y escenarios de Executive Rotations. Nunca mezclarlos con el arquetipo de organización, que es una dimensión independiente.
9. La búsqueda admite sinónimos y términos comunes en español/inglés (por ejemplo «SaaS», «software», «fintech», «autopartes»). Si el término corresponde a una industria de un sector distinto, sugerir claramente la pareja correcta **sin seleccionarla silenciosamente**.
10. Mantener la experiencia visual simple: **dos campos y una frase de ayuda**, no colocar las 21 categorías abiertas ni un cuestionario de diagnóstico económico.

#### Ejemplo de la experiencia

`Sector: Tecnología, software e inteligencia artificial`  
`Industria: Software empresarial B2B (SaaS)`  
`Tipo de empresa: Startup en operación`  
`Nombre: Nexo Labs`

Resultado: «Fuiste nombrado Director General de **Nexo Labs**, una empresa de software B2B que ya tiene clientes, producto y equipo. Tu reto es liderar su siguiente etapa». Desde ahí, sus casos y reportes giran alrededor de **MRR, churn, CAC, runway, producto, talento y clientes**. **El usuario no fundó Nexo Labs.**

### Interpretación precisa de los tres tipos

| Tipo | Situación inicial | Retos naturales | Nombramiento del usuario |
|---|---|---|---|
| **PYME** | Negocio consolidado a escala local/regional, estructura ligera, procesos imperfectos y recursos ajustados. | Cobranza, caja, calidad, dependencia de personas clave, eficiencia, clientes, institucionalización. | **CEO designado por propietarios o consejo**, nunca propietario-fundador. |
| **Startup** | **Empresa ya creada, con producto/servicio, equipo y clientes iniciales**; aún busca escala o rentabilidad. | Runway, product-market fit, unit economics, talento, inversión, growth, presión de inversionistas. | **CEO profesional contratado/nombrado por founders e inversionistas.** Los fundadores son otros personajes. |
| **Establecida** | Organización pequeña o mediana con operación predecible, cartera existente y mandos formales. **No es gigante**. | Presupuestos, coordinación de áreas, margen, competitividad, expansión, cultura, gestión del cambio. | **Nuevo CEO designado por su consejo/accionistas.** |

No convertir estas categorías en etiquetas cosméticas: **deben cambiar la escala, punto de partida, composición del equipo, restricciones y problemas relevantes**. No obstante, **ninguna opción debe ser “modo fácil” ni tener ventaja injusta en ranking**: son distintos contextos de práctica.

### Identidad y persistencia

- Separar `sector_id`, `industry_id`, `company_archetype`, `company_display_name`, `company_id`, `company_stage` y `user_role` en el modelo. `industry_id` debe pertenecer a `sector_id`; `user_role` = **appointed_ceo** en todos los casos.
- Persistir una **identidad de empresa por carrera** y referenciarla en correo, WhatsApp, llamadas, pantallas Hoy/Bandeja/Empresa/Carrera, organigrama, reportes, Academy contextualizada y boardroom.
- La selección de nombre **no puede quedar hardcodeada** a Botanas Cumbre/Forja Norte/Grupo Brasa. Los contenidos existentes serán *plantillas/semillas*.
- Si se permite renombrar la empresa después, preservar su `company_id` y el historial sin alterar conversaciones o reportes históricos de forma incoherente; decidir si el cambio es renombramiento formal dentro del mundo o solo ajuste de visualización.
- Debe funcionar tanto para **usuario registrado** como en la demo sin registro prevista en el roadmap. Guardar selección localmente para invitado y migrarla de forma segura cuando cree cuenta. No perder progreso ni duplicar empresas.
- Si aún no tenemos suficientes casos validados para todas las industrias y tipos, **mostrar el catálogo potencial con «Próximamente» para combinaciones incompletas y habilitar solo las jugables** o establecer alternativas adaptadas y revisadas. No confundir amplitud del catálogo con disponibilidad inmediata.

## 4. Una carrera continua: crecimiento orgánico y realista

El objetivo no es pasar de analista a CEO: **se empieza como CEO**. Lo que crece es la complejidad de la empresa y el criterio demostrado por el usuario.

**Ejemplo de trayectoria posible (ilustrativa, no automática):**

1. **Tomar el mando.** Comprender la operación heredada, priorizar, ganarse la confianza del equipo y consejo.
2. **Estabilizar.** Corregir problemas de caja, servicio, costos, estructura, cultura y ejecución.
3. **Construir capacidad.** Fortalecer mandos, procesos, tecnología, talento y capacidad operativa.
4. **Acelerar con criterio.** Elegir entre contratar, marketing, innovación, nuevos mercados, capital de trabajo u otras inversiones.
5. **Escalar.** Gestionar múltiples áreas, unidades, regiones, alianzas, adquisiciones o expansión internacional **cuando tenga sentido**.
6. **Gobernar la complejidad.** Liderar una empresa más grande, con mayor exposición estratégica, riesgos y grupos de interés.

Estas etapas **no son una escalera obligatoria de ventas**, ni se desbloquean por gastar dinero. Puede haber meses difíciles, ajustes, contracciones, recuperación, decisiones de *no expandirse* y crecimiento rentable más lento. **Una empresa más grande no equivale necesariamente a un mejor líder.**

**No hay “compra de mejoras” ni tienda de upgrades.** Las inversiones aparecen dentro de situaciones directivas: CFO presenta caja y escenarios; Comercial solicita presupuesto; Operaciones propone ampliar capacidad; Talento pide contrataciones; el Consejo debate si internacionalizar. Cada decisión tiene restricciones, beneficios, costos de oportunidad, riesgo, retrasos y repercusiones humanas.

**No castigar arbitrariamente con un game over.** Una mala temporada puede traer intervención del consejo, un plan de recuperación, una crisis de liquidez o metas corregidas; debe abrir aprendizaje y decisiones posteriores. La pérdida del puesto, si existiera en el futuro, sería un evento narrativo excepcional cuidadosamente diseñado, no un castigo numérico automático. **No implementar despidos del jugador ni reinicios en esta fase.**

## 5. Sistema de puntos: conservar cinco índices, separar tres dimensiones

**No eliminar ni rehacer por reflejo el modelo actual.** Hoy existen los cinco indicadores `caja`, `margen`, `equipo`, `clientes`, `consejo` (0–100). Mantenerlos durante la transición, pero mostrar con claridad qué son.

| Dimensión | Qué mide | Ejemplo | Para qué se usa |
|---|---|---|---|
| **Salud ejecutiva de la empresa** | Los cinco **índices 0–100** existentes: caja, margen, equipo, clientes, consejo. | «Salud de caja: 68/100»; «Confianza del consejo: 74/100». | Lectura rápida de riesgo, tensión, confianza y equilibrio. **No reemplaza cifras reales**. |
| **Resultados operativos y financieros** | Indicadores con unidades, plazos y lógica causal. | Efectivo disponible: $2.4 M; margen operativo: 12%; clientes activos: 420; rotación anual: 11%. | Entender el negocio, comparar metas, analizar informes y tomar decisiones. |
| **Aprendizaje y criterio del usuario** | XP, habilidades, evidencias E1–E7, transferencia, calibración, Academy, streak. | Dominio de «asignación de capital»: 3/5. | Medir desarrollo profesional, personalización y desbloqueos académicos. **No depende simplemente de crecer el negocio**. |

**Diferencia crítica:** `caja: 75/100` es un índice de salud, **no** significa $75; `margen: 65/100` no significa 65% de margen. La interfaz debe distinguirlos para no crear confusión. Igual con `clientes` y `equipo`.

### Reglas para que la evaluación sea honesta

- **Mala decisión de negocio ≠ ausencia de criterio.** Un usuario puede evaluar bien riesgos y trade-offs y aun así enfrentar un shock externo. Puede aprender incluso cuando sus resultados caen.
- **Buen resultado de negocio ≠ aprendizaje probado.** No recompensar con dominio ejecutivo a alguien por pulsar una opción y ver aumentar ventas.
- Preservar la rúbrica de razonamiento y evaluación (fuentes **E1–E7** del roadmap v2.1, peso limitado de la respuesta elegida y mecanismos de calibración).
- Mantener XP, racha y ranking como motivadores **subordinados al aprendizaje**, sin volver la compañía un vehículo para acumular puntos de forma oportunista.
- Evitar respuesta «correcta» obvia: diseñar opciones con compromisos reales, incertidumbre y consecuencias de distinto plazo.
- Revisar `passLine`, `minAnswered`, `verdictOf()` y `advance()` del sistema de temporadas: **no permitir que una línea de corte de siete días decida el futuro irreversible de la empresa**. Reusar lo que sirva como *evaluación periódica*, sin cambiar automáticamente de compañía.
- Para comparaciones entre usuarios de distintos arquetipos, normalizar el contexto o **separar rankings**; no comparar ventas absolutas de una startup de diez personas contra una manufacturera establecida.

## 6. Pestaña «Empresa»: convertirla en un verdadero dashboard de CEO

Conservar la identidad visual de MÊTIS: tecnología limpia, simple, legible, sin replicar un ERP, un Excel o un dashboard de consultoría saturado.

### Primera pantalla — lectura en menos de 20 segundos

**Encabezado:** `[Nombre de empresa] · [sector] / [industria] · [tipo] · [etapa]` y una oración de situación actual: «La demanda crece, pero la caja está presionada por la expansión».

**Fila ejecutiva, máximo 4–6 tarjetas en desktop y desplazamiento natural en móvil:**

1. **Ingresos:** monto, periodo, variación vs. periodo anterior y meta.
2. **Resultado operativo / margen:** monto o %, cambio reciente y señal de rentabilidad.
3. **Efectivo disponible:** saldo, tendencia y, si aplica, meses de runway o cobertura de obligaciones.
4. **Clientes:** activos, retención / churn, satisfacción o cartera, según industria.
5. **Equipo:** plantilla, rotación, capacidad o clima, según etapa.
6. **Consejo:** nivel de confianza y preocupaciones principales (índice, no moneda).

**Bajo las tarjetas:** un único gráfico sencillo de evolución por periodos (ingresos/margen/caja seleccionables) y una tarjeta **«Lo que necesita tu atención»** con no más de tres riesgos/oportunidades que vinculen a un caso, reporte o explicación.

**Al profundizar (no todo abierto):**

- **Cinco índices de salud** actuales con nombre y escala bien señalada.
- **Estado de resultados simplificado:** ingresos, costos directos, gastos operativos, resultado y margen; por periodo.
- **Caja y compromisos:** efectivo inicial + cobros − pagos − inversiones = efectivo final. Mostrar compromisos futuros cuando correspondan.
- **Personas y organigrama interactivo** actual (conservar); equipos que solo existen cuando la empresa los justifica.
- **Clientes y operación:** métricas relevantes por industria: pedidos, capacidad/uso, calidad, entregas, NPS/retención, MRR/churn, etc.; **no las mismas para todas**.
- **Historial ejecutivo:** decisiones de mayor impacto, reportes anteriores, consecuencias y objetivos activos.

### Principios de cifras creíbles

1. Los indicadores concretos deben venir de un **estado consistente de simulación**, no de números al azar ni de texto improvisado por IA.
2. Monto, periodo, unidad, moneda, base de comparación y variación deben corresponderse. Definir **una moneda por empresa**.
3. Las decisiones modifican *variables causales* (presupuesto, productividad, demanda, cobro, retención, contratación, calidad...) y el motor calcula sus efectos inmediatos y diferidos; **no sumar arbitrariamente +10% de ventas porque la opción suena positiva**.
4. Los resultados están sujetos a restricciones y latencias plausibles: invertir hoy en marketing no necesariamente aumenta ventas mañana; contratar aumenta costos antes de generar toda su productividad; internacionalizar requiere capacidad/cumplimiento/capital de trabajo.
5. Usar supuestos iniciales **explicables y versionados por industria, arquetipo y escala**. Un modelo educativo simplificado es válido, pero debe ser internamente coherente y no fingir precisión contable que no existe.
6. No exponer datos complejos innecesarios a principiantes: ofrecer *«¿Qué significa?»*, explicaciones cortas y referencias a Academy contextualizadas.

## 7. Reportes de dirección: una nueva forma de aprender y decidir

**Nueva mecánica esencial:** periódicamente, los responsables de las áreas presentan resultados al director general, exactamente con el lenguaje inmersivo de MÊTIS: notificación, correo, chat, llamada o reunión; tarjeta de contexto; opciones con trade-offs; consecuencias y aprendizaje.

### Tres ritmos de gestión (tiempo simulado)

| Frecuencia en el mundo de la empresa | Formato | Contenido | Tipo de decisión |
|---|---|---|---|
| **Semanal** | Brief ejecutivo de 1–2 minutos: «Tu equipo te actualiza». | Pocos KPIs de ventas, cumplimiento, caja, servicio, personas o proyectos. | Prioridad táctica, remover obstáculo, seguimiento o decidir **no intervenir**. |
| **Quincenal** | Revisión de directores, cuando la empresa ya tenga esa estructura. | Tendencias vs. plan, problemas repetidos, conflictos entre áreas, compromisos. | Reasignar recursos, ajustar metas, negociar prioridades, resolver compromisos. |
| **Mensual** | Comité de gestión / revisión con consejo según tamaño. | P&L sencillo, flujo de caja, cartera, talento, riesgos, ejecución estratégica. | Presupuesto, contratación, capacidad, marketing, expansión, gobierno corporativo. |

**No activar las tres reuniones como obligación de forma rígida desde el día uno.** Dosificar según etapa/arquetipo y carga; startup pequeña puede tener una actualización de responsable de crecimiento o una asesora financiera externa, no directores corporativos ficticios. La empresa mediana puede tener CFO, COO, RH y Comercial reales.

### Anatomía de un reporte

1. **Quién presenta y por qué ahora.** «Lucía, Finanzas: cierre del mes».
2. **Qué cambió.** Tres números importantes, variaciones y comparación con la meta.
3. **Qué explica el cambio.** Relación con decisiones anteriores y factores exógenos, distinguidos con honestidad.
4. **Qué está en juego.** Una recomendación y al menos una alternativa razonable.
5. **Qué decide el CEO.** Elegir, pedir información, posponer responsablemente o solicitar seguimiento. Algunas revisiones **no requieren una decisión grande**.
6. **Qué aprenderá.** Microexplicación al terminar, conexión con una teoría o concepto y, cuando convenga, una nueva lección de Academy.

Mantener los episodios con decisiones encadenadas, chats que regresan días después, preguntas de aclaración y feedback diferido. **No resolver una inversión estratégica en un clic con un número mágico.** Un reporte puede iniciar un episodio de varias decisiones que reaparece en la siguiente revisión.

### Ejemplo de episodio — decisión con caja

> **Reporte mensual — Finanzas**
>
> «Cerramos con $3.1 M de caja; $1.2 M está comprometido en pagos de las próximas semanas. Comercial propone invertir $450 mil en adquisición de clientes. Operaciones pide $700 mil para reducir entregas tardías. Ambas áreas esperan una decisión».
>
> El usuario revisa reportes, analiza el costo de oportunidad, solicita supuestos, decide (una opción puede ser **invertir menos, escalonar o esperar**). Más adelante recibe consecuencias plausibles sobre servicio, clientes, costos y confianza del equipo. Academy explica asignación de capital, capital de trabajo y trade-offs. Los números son **solo ejemplo narrativo**: SN definirá supuestos consistentes según arquetipo e industria.

**Tiempo:** diferenciar **tiempo real del usuario** (5–8 minutos de uso diario, preferencias de notificaciones, vacaciones) de **tiempo simulado del negocio** (semana, quincena, mes). Establecer reglas explícitas y testeables para avanzar periodos y generar reportes. Nunca implicar que un usuario debe jugar 30 días reales para obtener un reporte mensual; tampoco forzar tres cierres al día si juega intensivamente. El modo vacaciones **no debe destruir su empresa ni generar penalizaciones injustas**.

## 8. Casos existentes: acomodar, adaptar y reutilizar

**Instrucción expresa:** NO desechar los ~52 casos documentados, las escenas, los personajes, la estructura de mensajes ni las decisiones difíciles ya construidas. El valor está en ellos. Adaptar para que funcionen dentro de **un universo empresarial coherente y continuo**.

### Estrategia de adaptación

1. **Auditoría del banco actual:** clasificar cada caso por industria compatible, tipo de empresa, etapa, competencias, personajes necesarios, indicadores implicados, dependencias narrativas y nivel de adaptación.
2. **Separar plantilla y mundo:** textos de casos con variables de identidad (`company_name`, `ceo_name`, `role_name`, `client_name`, divisa, escala) enlazadas a los datos de la empresa y a personajes persistentes.
3. **Reutilización por compatibilidad:** caja, conflicto directivo, conversaciones difíciles, ética, prioridades, contratación y comunicación suelen ser transferibles. Fallas de tostadores, hornos, logística industrial o unit economics SaaS **requieren contexto sectorial real**; no basta cambiar nombres.
4. **Reordenar por causalidad:** un caso inicial no puede suponer un director internacional o tres plantas que aún no existen. Los episodios deben aparecer cuando el estado del mundo lo permita.
5. **Consecuencias duraderas:** un colaborador que renuncia, un cliente molesto, una inversión aplazada y una crisis atendida deben poder reaparecer después; el texto de IA debe basarse en hechos validados.
6. **Personajes coherentes:** cada empresa tiene un reparto persistente con nombres y funciones realistas. Si una startup no tiene CFO, ese papel lo desempeña quien efectivamente lleva finanzas.
7. **Fallback de calidad:** si un caso no tiene versión confiable para cierto arquetipo/industria, no mostrarlo allí; usar contenido validado y marcar los huecos para crear nuevos casos gradualmente.

**Evitar** mostrar «Botanas Cumbre» escondido en una pantalla cuando el usuario llamó «Nexo Labs» a su empresa; tampoco usar el mismo personaje con dos cargos incompatibles. Crear pruebas automáticas de *contenido filtrado y variables no resueltas*.

## 9. Academy, criterio y teoría: el corazón que NO cambia

La empresa que crece genera una narrativa poderosa, pero **MÊTIS debe seguir enseñando**:

- **Casos breves que obligan a pensar**, no preguntas de moralidad evidente.
- **Conceptos y teorías** detrás de la decisión: trade-offs, costo de oportunidad, flujo de caja, unit economics, negociación, pensamiento sistémico, incentivos, liderazgo, seguridad psicológica, estrategia, riesgos, etc.
- **Explicación corta y contextual** al final: qué observaste, qué otros caminos eran razonables y qué aprender.
- **Evaluación de razonamiento** distinta de la suerte en resultados de negocio, con evidencias E1–E7 y feedback calibrado.
- **Dificultad adaptativa** según dominio demostrado; complejidad empresarial y dominio no son la misma variable.
- **Transferencia** de habilidades a contextos nuevos, por ejemplo Executive Rotations; observar si el usuario aprende un principio y lo aplica en otra situación.
- **Constancia sin ansiedad:** sesiones cortas, rachas, modo vacaciones y notificaciones que sorprenden, respetando preferencias.

**Indicador principal de éxito del producto:** el usuario toma mejores decisiones, reconoce riesgos, fundamenta trade-offs y transfiere conocimientos a casos nuevos. El crecimiento de la empresa es una herramienta para mostrar consecuencias, **no la única métrica de éxito**.

## 10. Executive Rotations y Executive Arena

**Executive Rotations:** se desbloquean gradualmente como invitaciones puntuales: «El consejo de otra compañía solicita tu opinión» o «Te invitan a un comité especial». Estas situaciones ocurren en **otra industria**, con sus propios personajes y datos. El usuario entra temporalmente, practica y vuelve a **su única empresa principal**, que conserva su historial, caja, clientes, empleados y compromisos.

- Rotations evalúan **transferencia de criterio** y agregan evidencia de aprendizaje; **no cambian arbitrariamente los estados financieros de la empresa principal**.
- No recrean la antigua estructura de «terminar una empresa para empezar otra».
- **Executive Arena** sigue como desafío avanzado, de mayor presión y complejidad, desbloqueado por dominio sustentado, no únicamente por ingresos o XP acumulado.

## 11. Arquitectura: evolucionar el motor, no reescribir todo

**Solicito a SN primero una auditoría técnica de impacto.** Referencias conocidas del proyecto (comprobar rutas/nombres actuales antes de cambiar):

| Parte | Referencias documentadas | Cambio requerido |
|---|---|---|
| Onboarding | `/ceo/empezar`, `Onboarding.tsx` | Sustituir elección de compañía fija por **sector → industria (desplegables dependientes)** + arquetipo + nombre; catálogo configurable, disponibilidad, carta CEO, persistencia. |
| Motor | `engine.ts`, `season.days`, `seasonDoneOf()`, `verdictOf()`, `advance()` | Desacoplar periodo de reporte/carrera de «temporada que termina en otra empresa». Preservar decisiones, efectos y motor determinista. |
| Estado | `ceo.players.state` y roadmap de `ceo.game_events` | Añadir/derivar `company_id`, identidad, arquetipo, etapa, periodos, balances, métricas y compromisos. Evento validado como verdad; no estados incompatibles. |
| Empresa | `/ceo/empresa`, `CompanyView.tsx`, `OrgMap.tsx` | Dashboard ejecutivo y organigrama variable por compañía, con historia de KPIs. |
| Carrera | `/ceo/carrera`, `Career.tsx` | Carrera de una empresa con hitos reales, complejidad y aprendizaje; no itinerario obligatorio por tres empresas. |
| Casos | Banco actual por Botanas Cumbre, Forja Norte, Grupo Brasa | Etiquetas de elegibilidad, plantillas, personajes persistentes, variables de identidad y adaptación sectorial. |
| Academy y assessment | Plan E1–E7, habilidades, IA tutor | Mantener estructura; conectar feedback con reportes y consecuencias, sin sesgo de tamaño de empresa. |

### Modelo lógico sugerido (no imponer implementación de tablas sin revisión)

`career` → `company_profile` (sector, industria, arquetipo, nombre, nombramiento CEO, etapa) → `simulation_periods` (fechas simuladas) → `business_state` (métricas, balances, compromisos, equipo, proyectos) → `events` (decisiones, shocks, consecuencias) → `reports` (instantáneas inmutables y narrativa) → `learning_evidence` (criterio y conocimientos).

**Invariantes:**

1. La compañía existe **antes de la primera decisión**; `CEO != founder` siempre.
2. Una decisión aceptada se aplica una sola vez, incluso entre dispositivos.
3. Estado contable y dashboard se reconstruyen con eventos y reglas versionadas; no dependen de texto libre de IA.
4. Se pueden explicar relaciones entre decisiones y reportes posteriores; distinguir azar/eventos externos.
5. La IA **narra, adapta y enseña**, pero no inventa balances no validados ni cambia el mundo a espaldas del motor.
6. Una rotación tiene su propio contexto aislado y no sustituye la carrera principal.
7. Replays, rollback y migración se prueban antes de sustituir la fuente de verdad.

**Alerta de alcance:** que la UI parezca un cambio pequeño no significa que lo sea la simulación financiera y narrativa persistente. No simular un modelo contable exhaustivo para el MVP; implementar primero un **modelo simplificado pero verificable**, con indicadores mínimos, reglas documentadas y expansión progresiva.

## 12. Migración del producto actual sin perder trabajo ni usuarios

No eliminar módulos completos. Proponer un puente controlado desde el sistema actual:

1. **Auditar y documentar** flujos actuales, estructuras, contenido hardcodeado, dependencias de temporada, guardado local/Supabase y demos.
2. **Definir el modelo canónico** de una empresa persistente, periodos, indicadores, eventos, **taxonomía sector → industria**, arquetipos y reporte.
3. **Separar el banco de casos** de la identidad fija y hacer una **primera combinación** muy bien validada antes de abrir el catálogo completo.
4. **Implementar onboarding + nombre + nueva Empresa** detrás de un feature flag y validar sin modificar carreras existentes.
5. **Introducir periodos y primer reporte ejecutivo** con reconciliación básica de métricas; extender a decisiones de asignación de recursos.
6. **Sustituir transición entre empresas** por evolución de la misma, con carrera y rotaciones diferenciadas.
7. **Migrar usuarios actuales sin pérdida:** conservar historial, XP, decisiones, lecciones y logros. Si no es posible traducir la carrera vieja automáticamente, ofrecer opción explícita **«Continuar tu carrera anterior» / «Empezar nueva carrera MÊTIS»** con copia segura. **Nunca sobrescribir silenciosamente la partida**.
8. **Instrumentar y desplegar por fases**, con rollback y métricas de errores/regresiones.

### Riesgos que SN debe resolver antes de programar

- **Coherencia temporal:** semanas reales vs. simuladas, plazos de casos, rachas, modo vacaciones y reportes.
- **Coherencia causal y de caja:** inversión vs. gastos, tiempos de maduración, cobros y pagos; preservar que `cash_end = cash_begin + inflows - outflows` bajo el modelo definido.
- **Densidad y elegibilidad de casos:** contenido suficiente por combinación de industria/tipo/etapa; no generar incoherencias por intercambiar etiquetas.
- **Equidad educativa:** arquetipos diferentes y rankings/XP comparables; IA complementaria no bloquea ni perjudica arbitrariamente la progresión.
- **Costo y mantenimiento:** generación IA, resúmenes, persistencia y recalculo; usar reglas deterministas y reutilización antes de sumar tokens.
- **Compatibilidad y seguridad de datos:** migración de `state`, diario de eventos, versiones, replays, idempotencia y sincronización.

## 13. Prioridades y definición de MVP

| Prioridad | Entregable | Qué debe funcionar para aprobarlo |
|---|---|---|
| **P0-A** | **Diagnóstico y plan de migración** | Mapa de archivos y flujos impactados, contradicciones con blueprint viejo, riesgos, orden de PRs, decisiones abiertas, estimación relativa. **Antes de tocar producción.** |
| **P0-B** | **Onboarding y compañía persistente** | Nombramiento CEO (no founder), **sector → industria con dos desplegables**, tipo + nombre, empresa existente con baseline, datos guardados y nombre reflejado en todas las pantallas; catálogo amplio con disponibilidad real. |
| **P0-C** | **Dashboard ejecutivo mínimo** | 5 índices preservados, 4–6 métricas reales por industria/tipo, histórico al menos de dos periodos, metas/variaciones y organigrama. |
| **P0-D** | **Primer ciclo causal y reporte** | Una decisión de asignación de recursos altera balances de forma explicable; en periodo posterior un responsable presenta reporte y aparece aprendizaje contextual. |
| **P1** | **Banco de casos adaptado y carrera continua** | Episodios existentes ordenados por elegibilidad, consecuencias persistentes y cierre periódico sin cambio de compañía. |
| **P1/P2** | **Ritmos directivos, etapas y rotaciones** | Informes semanal/quincenal/mensual dosificados, hitos y rotaciones separadas, sin romper Academy/assessment. |

**Sugerencia de lanzamiento:** es preferible una primera experiencia impecable en 2–3 combinaciones industria/tipo, con 1–2 periodos y reportes coherentes, antes de declarar disponibles 18 combinaciones que no tengan historias y números bien construidos.

## 14. Pruebas de aceptación obligatorias

1. Un nuevo usuario elige **Tecnología → Software empresarial B2B (SaaS) → startup → «Nexo Labs»** y recibe nombramiento como **CEO contratado**, con founders e inversionistas separados del usuario; jamás aparece «tu startup que fundaste».
2. Otro usuario elige **Alimentos → PYME → «Casa Norte»**: encuentra operaciones, nombres, clientes y cifras compatibles con una empresa real en funcionamiento; no aparece un horno siderúrgico, MRR SaaS ni la marca Botanas Cumbre por accidente.
3. Un tercero elige **Manufactura → establecida → nombre propio**: reparto, tamaño, reportes, partidas y retos distintos, de dificultad educativa comparable.
4. El mismo nombre de empresa aparece consistentemente en bienvenida, Hoy, Bandeja, casos, Empresa, reportes, carrera y comunicación del equipo.
5. El usuario conserva **su empresa original** después de completar un periodo de siete días (o equivalente), cerrar el mes y superar un hito. `advance()` no lo cambia de compañía.
6. Una decisión de inversión de $X reduce caja/crea compromisos de modo consistente; el reporte posterior refleja el impacto y su posible rendimiento diferido, no un bonus inmediato sin explicación.
7. El tablero distingue «salud de caja 70/100» de «efectivo disponible $Y», y «salud de margen 65/100» del «margen operativo Z%».
8. Un reporte compara periodo anterior, objetivo y resultado real; identifica al presentador, la recomendación y un posible trade-off; una decisión puede generar seguimiento en el siguiente reporte.
9. Academy y assessment siguen evaluando conocimiento y razonamiento aunque las ventas caigan por un shock externo; **la opción más rentable no necesariamente obtiene mayor dominio**.
10. Executive Rotation ocurre en otra industria sin borrar ni contaminar la compañía principal.
11. Vacaciones, inactividad o falla temporal de IA no destruyen el negocio, no fabrican meses de pérdidas ni bloquean progreso.
12. Se prueban **migraciones** de carreras v2, recuperación de guardados, eventos duplicados, dos dispositivos y textos con variables faltantes. Se puede revertir el feature flag sin perder datos.
13. **Los casos actuales siguen disponibles** dentro de combinaciones compatibles y mantienen episodios, interlocutores, lecciones y consecuencias.
14. En móvil y desktop, el dashboard se entiende rápido; las sesiones de gestión son **breves e inmersivas**, no paneles interminables.
15. El desplegable de **Sector** contiene el catálogo amplio de §3.1; el de **Industria** se habilita después y filtra bien. Cambiar sector limpia la industria; una pareja inválida no pasa el onboarding.
16. Una industria marcada «Próximamente» aparece en catálogo pero **no permite crear una empresa sin contenido compatible**. Las habilitadas sí generan estado, elenco, casos y reportes consistentes con **ambas** clasificaciones.

## 15. Lo que necesito de SN como primera respuesta

**No ejecutar una reescritura general inmediatamente.** Responde con un plan de implementación claro que incluya:

1. **Interpretación confirmada del producto en 10 líneas**, destacando «CEO nombrado, nunca fundador» y «una empresa principal persistente».
2. **Mapa real de componentes, tablas, rutas y casos afectados** (verifica contra el código actual; la lista de esta adenda es referencial).
3. **Lista de elementos a preservar / modificar / sustituir**, indicando incompatibilidades exactas con roadmap anterior.
4. **Propuesta de estructura de datos y motor mínimo** para identidad, caja, periodos, métricas, reportes y acontecimientos, con ejemplo de un recorrido de dos meses simulados.
5. **Plan de adaptación del banco de casos**, indicando cuáles son portables sin cambio, cuáles requieren una variante, y **matriz sector × industria × arquetipo** de combinaciones listas, limitadas y futuras.
6. **Boceto de UX**, en texto o wireframes simples, para onboarding, Empresa y primer reporte (móvil y desktop).
7. **MVP propuesto por fases/PRs**, estimación de esfuerzo relativo, riesgos, tests y estrategia de migración/rollback.
8. **Preguntas verdaderamente bloqueantes**, con recomendación concreta. No pedir de nuevo definiciones que este documento ya resuelve.

### Entrega esperada después de aprobar el plan

- Cambios pequeños, integrados y verificables por fase; no romper lo que ya funciona.
- Demostración funcional de onboarding → empresa propia → primer caso → evolución de métricas → reporte ejecutivo → aprendizaje.
- Pruebas de regresión de los casos, Academy, evaluación, identidad, guardado, rankings, modo vacaciones y rotaciones.
- Documentación actualizada que indique explícitamente qué se sustituyó del blueprint anterior y por qué.

---

## Cierre de producto

**Quiero que el usuario sienta: «Me nombraron CEO de esta empresa. Conozco a mi equipo. Mis decisiones importan. Tengo que aprender, porque el negocio y las personas dependen de ellas»**.

Que al abrir MÊTIS unos minutos al día no esté comprando edificios ni persiguiendo números: que reciba un WhatsApp inesperado, escuche a su directora comercial, entienda un reporte de caja, tome una decisión difícil y descubra semanas después lo que provocó. **El premio no es solamente ver crecer la empresa: es darse cuenta de que su criterio como líder también creció.**

**Esta visión sustituye la carrera por compañías predefinidas, pero conserva y potencia el corazón educativo, el contenido, el lenguaje inmersivo y el trabajo técnico existente de MÊTIS.**
