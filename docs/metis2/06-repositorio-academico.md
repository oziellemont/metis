# MÊTIS 2.0 · Repositorio Académico
Paquetes recibidos: Lote 01 (versión 1.0), Lote 02 (versión 1.1), Lote 03 (versión 1.2). Fuentes abiertas y leídas el 2026-11-13. Este documento se genera desde el código (`app/src/lib/ceo/metis2/experiencias/`); una prueba falla si se desfasa.

## 1. Estado en una línea
12 de las 18 experiencias recibidas están convertidas y se pueden recorrer completas por enlace (`/piloto`): 1 de 6 del lote 01, 6 de 6 del lote 02, 5 de 6 del lote 03. Ninguna registra evidencia, cambia dominio, niveles ni perfil, y ninguna aparece en el menú. Ninguna ha sido revisada por una persona. El Executive Challenge está leído y trazado, sin convertir.

## 2. Qué se recibió
Los archivos se leyeron completos. No se copiaron al repositorio porque es público y los paquetes traen las respuestas de las evaluaciones; se guarda su huella para saber con qué versión se trabajó.

### Lote 01 · versión 1.0
| Archivo | Huella (SHA-256, primeros 16) |
|---|---|
| README_PARA_SUPERNINJA.md | `eb619f982cddacd2` |
| ESTANDAR_EDITORIAL_Y_EVALUACION.md | `bb6f17f01abc2740` |
| ATLAS_52_HABILIDADES.md | `c392c188d32b12e7` |
| ATLAS_52_HABILIDADES.csv | `cdd8fdbd4f3ecf83` |
| FUENTES_VERIFICADAS.json | `ab58f6887f7f6968` |
| MANIFIESTO_CONTENIDO.json | `1854e782f0f7d0b7` |
| BACKLOG_24_HABILIDADES_N1.csv | `e84af484e7fbcf52` |
| EXPERIENCIAS_N1.md | `f66be87d82045c8e` |
| EXECUTIVE_CHALLENGE_N1.md | `7f591d374b44ff45` |
| PLAN_PRODUCCION_N1.md | `466b183f831f974f` |

### Lote 02 · versión 1.1
| Archivo | Huella (SHA-256, primeros 16) |
|---|---|
| EXPERIENCIAS_N1_LOTE_02.md | `58b0b42735551d3e` |

### Lote 03 · versión 1.2
| Archivo | Huella (SHA-256, primeros 16) |
|---|---|
| README_PARA_SN.md | `27336077f276368d` |
| EXPERIENCIAS_N1_LOTE_03.md | `f22631caebd9b8c6` |
| MANIFIESTO_LOTE_03.json | `8a4eb1bb7f96112d` |
| RUBRICAS_LOTE_03.json | `ff7012150558a469` |
| TRAZABILIDAD_ACADEMICA.md | `d5f386d4822193b9` |
| QA_Y_PRUEBAS.md | `00a39ffbc1c53b82` |
| PLAN_LOTE_04.md | `d0332c8416e43f45` |
| VALIDACION_LOCAL.txt | `11f7a12b4f94f04b` |

Diferencias entre paquetes que conviene conocer:
1. El lote 02 llegó como un solo archivo de experiencias. No trae manifiesto ni rúbricas en formato de datos, como sí traen el lote 01 y el lote 03; las rúbricas se tomaron del texto de cada experiencia.
2. El archivo de pruebas del lote 03 remite a un `QA_Y_ERRATAS.md` del lote 02. Ese archivo no se recibió.
3. El lote 03 usa otros nombres para tres fuentes. Se leen como la misma fuente del registro: HBS_STRATEGY es HBS_STRAT; STAN_FIRST_YEAR es STAN_CORE; HBS_LCA es HBS_GOV; INSEAD_CORE es INSEAD_CORE.

## 3. Correspondencia de identificadores
Los 52 identificadores editoriales del Atlas corresponden uno a uno con las 52 habilidades del catálogo: mismo nombre, mismo orden, misma academia, mismo nivel de entrada y la misma descripción de lo que se sabe hacer. La única diferencia de forma: cinco prerrequisitos del Atlas llevan entre paréntesis la academia de la habilidad a la que apuntan (EST-05, EST-06, CRE-08, CRE-09 y RIE-07); son las mismas habilidades.
El identificador que se guarda es el del catálogo. El editorial queda como referencia para hablar con quien escribe el contenido.

### Estrategia

| Editorial | Catálogo | Habilidad | Nivel de entrada | Fuentes citadas en el Atlas |
|---|---|---|---|---|
| EST-01 | `est.fundamentos` | Lenguaje de la estrategia | 1 | HBS_STRAT, STAN_CORE |
| EST-02 | `est.diagnostico` | Diagnóstico de la situación | 2 | HBS_STRAT, STAN_CORE |
| EST-03 | `est.ventaja` | Ventaja competitiva y posicionamiento | 1 | HBS_STRAT, STAN_CORE |
| EST-04 | `est.priorizacion` | Priorización y renuncias | 1 | HBS_STRAT, STAN_CORE |
| EST-05 | `est.alineacion` | De la estrategia a metas e indicadores | 1 | HBS_STRAT, STAN_CORE |
| EST-06 | `est.recursos` | Asignación de recursos | 3 | HBS_STRAT, STAN_CORE |
| EST-07 | `est.escenarios` | Escenarios y efectos de segundo orden | 3 | MIT_DESC, STAN_CORE |
| EST-08 | `est.portafolio` | Portafolio, disrupción y decisiones irreversibles | 4 | HBS_STRAT, STAN_CORE |

### Finanzas

| Editorial | Catálogo | Habilidad | Nivel de entrada | Fuentes citadas en el Atlas |
|---|---|---|---|---|
| FIN-01 | `fin.lenguaje` | Vocabulario financiero | 1 | STAN_CORE, HBS_FIN |
| FIN-02 | `fin.resultados` | Estado de resultados y márgenes | 1 | STAN_CORE, HBS_FIN |
| FIN-03 | `fin.balance` | Balance general | 1 | STAN_CORE, HBS_FIN |
| FIN-04 | `fin.flujo` | Flujo de efectivo | 1 | STAN_CORE, HBS_FIN |
| FIN-05 | `fin.presupuesto` | Presupuesto y variaciones | 1 | WH_CORE, HBS_FIN |
| FIN-06 | `fin.costos` | Costos, contribución y punto de equilibrio | 2 | STAN_CORE, HBS_FIN |
| FIN-07 | `fin.capital_trabajo` | Capital de trabajo | 2 | STAN_CORE, HBS_FIN |
| FIN-08 | `fin.inversion` | Valor del dinero y evaluación de inversiones | 3 | STAN_CORE, HBS_FIN |
| FIN-09 | `fin.financiamiento` | Deuda, capital y financiamiento | 3 | STAN_CORE, HBS_FIN |
| FIN-10 | `fin.valor` | Asignación de capital y valuación | 4 | HBS_FIN |

### Liderazgo

| Editorial | Catálogo | Habilidad | Nivel de entrada | Fuentes citadas en el Atlas |
|---|---|---|---|---|
| LID-01 | `lid.fundamentos` | El papel de quien dirige | 1 | STAN_CORE, STAN_LAB |
| LID-02 | `lid.comunicacion` | Comunicación ejecutiva | 1 | MIT_CORE, STAN_LAB |
| LID-03 | `lid.feedback` | Retroalimentación y conversaciones difíciles | 1 | STAN_CORE, STAN_LAB |
| LID-04 | `lid.delegacion` | Delegación y seguimiento | 1 | STAN_CORE, STAN_LAB |
| LID-05 | `lid.talento` | Motivación, desarrollo de personas y sucesión | 2 | STAN_CORE, STAN_LAB |
| LID-06 | `lid.equipos` | Equipos, conflicto y convivencia | 2 | STAN_CORE, STAN_LAB |
| LID-07 | `lid.negociacion` | Negociación | 2 | STAN_CORE, STAN_LAB |
| LID-08 | `lid.influencia` | Influencia y coaliciones | 3 | STAN_CORE, STAN_LAB |
| LID-09 | `lid.cultura` | Cultura y cambio | 3 | STAN_CORE, STAN_LAB |

### Operaciones

| Editorial | Catálogo | Habilidad | Nivel de entrada | Fuentes citadas en el Atlas |
|---|---|---|---|---|
| OPE-01 | `ope.procesos` | Procesos | 1 | STAN_CORE, WH_CORE |
| OPE-02 | `ope.indicadores` | Indicadores operativos | 1 | STAN_CORE, WH_CORE |
| OPE-03 | `ope.calidad` | Calidad | 1 | WH_CORE |
| OPE-04 | `ope.capacidad` | Capacidad y cuellos de botella | 1 | STAN_CORE, WH_CORE |
| OPE-05 | `ope.productividad` | Productividad y merma | 2 | STAN_CORE, WH_CORE |
| OPE-06 | `ope.suministro` | Inventarios y cadena de suministro | 2 | STAN_CORE, WH_CORE |
| OPE-07 | `ope.ejecucion` | Ejecución y seguimiento | 2 | STAN_CORE, WH_CORE |
| OPE-08 | `ope.mejora` | Mejora continua y transformación | 3 | STAN_CORE, WH_CORE |

### Crecimiento

| Editorial | Catálogo | Habilidad | Nivel de entrada | Fuentes citadas en el Atlas |
|---|---|---|---|---|
| CRE-01 | `cre.cliente` | Cliente y propuesta de valor | 1 | HBS_MKT, STAN_CORE |
| CRE-02 | `cre.segmentacion` | Segmentación y mercado objetivo | 1 | HBS_MKT, STAN_CORE |
| CRE-03 | `cre.precios` | Precios y valor percibido | 1 | HBS_MKT, STAN_CORE |
| CRE-04 | `cre.canales` | Canales y ventas | 1 | HBS_MKT, STAN_CORE |
| CRE-05 | `cre.marketing` | Marketing y adquisición de clientes | 2 | HBS_MKT, STAN_CORE |
| CRE-06 | `cre.retencion` | Retención y valor del cliente | 2 | HBS_MKT, STAN_CORE |
| CRE-07 | `cre.producto` | Producto e innovación | 2 | HBS_MKT, STAN_CORE |
| CRE-08 | `cre.modelo` | Modelo de negocio y economía unitaria | 3 | MIT_DESC, STAN_CORE |
| CRE-09 | `cre.expansion` | Expansión | 4 | HBS_MKT, STAN_CORE |

### Riesgo y gobierno

| Editorial | Catálogo | Habilidad | Nivel de entrada | Fuentes citadas en el Atlas |
|---|---|---|---|---|
| RIE-01 | `rie.fundamentos` | Lenguaje del riesgo | 1 | HBS_GOV, WH_CORE |
| RIE-02 | `rie.etica` | Ética y dilemas | 1 | HBS_GOV, WH_CORE |
| RIE-03 | `rie.cumplimiento` | Cumplimiento y controles | 1 | HBS_GOV, WH_CORE |
| RIE-04 | `rie.incertidumbre` | Decidir con incertidumbre | 2 | HBS_GOV, WH_CORE |
| RIE-05 | `rie.entorno` | Entorno económico y político | 2 | INSEAD, WH_CORE |
| RIE-06 | `rie.stakeholders` | Partes interesadas | 2 | HBS_GOV, WH_CORE |
| RIE-07 | `rie.crisis` | Crisis y reputación | 3 | HBS_GOV, WH_CORE |
| RIE-08 | `rie.gobierno` | Gobierno corporativo | 3 | HBS_GOV, WH_CORE |

## 4. Revisión de las fuentes
Qué se hizo: se abrió cada una de las 16 direcciones y se leyó lo que la página dice. Qué no se hizo: comparar concepto por concepto cada una de las 52 habilidades con el temario de cada curso. El propio Atlas declara que el respaldo es «correspondencia temática curricular; no equivalencia de curso», y eso es lo que estas páginas permiten sostener.
| Fuente | Institución y componente | Habilidades del Atlas que la citan | Experiencias que la citan | Qué muestra la página |
|---|---|---|---|---|
| HBS_CORE | [Harvard Business School · Required Curriculum](https://www.hbs.edu/mba/academic-experience/curriculum) | 0 | 0 | Página del plan obligatorio del MBA. Responde y lista los cursos del primer año. |
| HBS_STRAT | [Harvard Business School · Strategy — MBA Required Curriculum](https://www.hbs.edu/faculty/units/strategy/Pages/curriculum.aspx) | 7 | 3 | Describe el curso obligatorio Strategy: entorno de la empresa, ventaja competitiva y valor para el cliente. |
| HBS_FIN | [Harvard Business School · Finance I / Finance II](https://www.hbs.edu/faculty/units/finance/Pages/curriculum.aspx) | 10 | 0 | Describe Finance I y Finance II: finanzas corporativas, mercados de capital, presupuesto de capital, valuación y política financiera. No trata vocabulario contable, estado de resultados ni flujo de efectivo. |
| HBS_MKT | [Harvard Business School · Marketing — MBA Required Curriculum](https://www.hbs.edu/faculty/units/marketing/Pages/curriculum.aspx) | 8 | 2 | Describe el curso obligatorio Marketing: comportamiento del comprador y mezcla de producto, canales, comunicación y precio. |
| HBS_GOV | [Harvard Business School · Leadership and Corporate Accountability](https://www.hbs.edu/faculty/units/gm/Pages/curriculum.aspx) | 7 | 3 | Describe Leadership and Corporate Accountability: responsabilidades legales, éticas y económicas, y sistemas de gobierno. No menciona riesgo, crisis ni incertidumbre. |
| HBS_CASE | [Harvard Business School · The Case Method](https://www.hbs.edu/mba/academic-experience/the-case-method) | 0 | 0 | Explica el método del caso. Sirve como respaldo del diseño, no de una habilidad. |
| MIT_CORE | [MIT Sloan · MBA Curriculum / First-Semester Core](https://mitsloan.mit.edu/mba/explore-program/mba-curriculum) | 1 | 2 | Lista el núcleo del primer semestre y las optativas de núcleo; Operaciones aparece como optativa de núcleo. |
| MIT_DESC | [MIT Sloan · MBA Course Descriptions](https://mitsloan.mit.edu/mba/mba-course-descriptions) | 2 | 0 | Describe los cursos del núcleo y las optativas de núcleo, entre ellos Financial Accounting e Intro to Operations Management. |
| STAN_CORE | [Stanford GSB · First-Year Curriculum](https://www.gsb.stanford.edu/programs/mba/academic-experience/curriculum/first-year) | 40 | 13 | Describe los cursos del primer año, entre ellos Financial Accounting, Finance, Operations, Strategy, Marketing, Leadership Laboratory y Managing Groups and Teams. |
| STAN_LAB | [Stanford GSB · Leadership Labs](https://www.gsb.stanford.edu/experience/learning/leadership/labs) | 9 | 1 | Describe Leadership Labs: curso obligatorio con ejercicios y simulaciones en equipo, con acompañamiento. No menciona retroalimentación de forma expresa. |
| WH_CORE | [Wharton · Core Curriculum](https://mba-inside.wharton.upenn.edu/core-curriculum/) | 17 | 4 | Lista los cursos del núcleo fijo y flexible por clave y nombre, sin describir su contenido. |
| INSEAD | [INSEAD · MBA Curriculum / Capstone](https://www.insead.edu/master-programmes/master-business-administration/curriculum) | 1 | 1 | Lista los 14 cursos obligatorios por periodo y el proyecto final. La página no abre con una consulta automática simple; se leyó con el lector de páginas. |
| HBS_ISC | [Harvard Business School · Institute for Strategy and Competitiveness — Creating a Successful Strategy](https://www.isc.hbs.edu/strategy/creating-a-successful-strategy/Pages/default.aspx) | 0 | 1 | Presenta los elementos de una estrategia; nombra de forma expresa la propuesta de valor («Value Proposition») y las renuncias («Making Strategic Trade-offs»). Añadida por el lote 02. |
| HBS_AM | [Harvard Business School · Accounting and Management — Financial Reporting and Control](https://www.hbs.edu/faculty/units/am/Pages/curriculum.aspx) | 0 | 1 | Describe el curso obligatorio Financial Reporting and Control; habla del vocabulario de los estados financieros y los informes contables. Añadida por el lote 02. |
| HBS_TOM | [Harvard Business School · Technology and Operations Management — MBA Required Curriculum](https://www.hbs.edu/faculty/units/tom/Pages/curriculum.aspx) | 0 | 1 | Describe el curso obligatorio de operaciones; menciona el análisis de procesos («Process analysis»). Añadida por el lote 02. |
| INSEAD_CORE | [INSEAD · MBA Core Courses](https://www.insead.edu/master-programmes/master-business-administration/core-courses) | 0 | 8 | Lista y describe los cursos obligatorios; aparecen todos los que citan los lotes 02 y 03: Financial Accounting, Organisational Behaviour, Managing Customer Value, Managerial Accounting, Process and Operations Management, Leadership Communication Foundations y Business and Society. La página rechaza las consultas automáticas simples; se leyó con el lector de páginas. Añadida por el lote 02. |

### Observaciones sobre exactitud
1. **Finanzas, vocabulario y estados financieros.** El Atlas cita HBS_FIN en las diez habilidades de Finanzas. Esa página describe Finance I y Finance II (finanzas corporativas, mercados, valuación), no contabilidad. Para vocabulario financiero, estado de resultados y balance, el curso de Harvard que corresponde es Financial Reporting and Control, de la unidad Accounting and Management; su página (https://www.hbs.edu/faculty/units/am/Pages/curriculum.aspx) abre y habla de «the vocabulary of financial statements». Ya está en el registro como HBS_AM y el lote 02 la cita en EDIT-N1-008; el Atlas sigue citando HBS_FIN en FIN-01 a FIN-04.
2. **Riesgo.** HBS_GOV se cita en siete de las ocho habilidades de Riesgo. La página describe responsabilidades legales, éticas y económicas, y sistemas de gobierno: respalda bien ética, cumplimiento y gobierno corporativo. No menciona riesgo, incertidumbre ni crisis, así que es un respaldo débil para RIE-01, RIE-04 y RIE-07.
3. **Wharton.** WH_CORE se cita en 17 habilidades (todas las de Riesgo y casi todas las de Operaciones). La página solo lista cursos por clave y nombre; no describe contenidos. Sirve para decir que el curso existe en el núcleo, no para sostener un concepto.
4. **Stanford.** STAN_CORE se cita en 40 de las 52 habilidades. Es una página con una descripción breve por curso. Con tanta carga en una sola página conviene, al profundizar, citar el curso concreto y no la página general.
5. **Liderazgo.** STAN_LAB respalda las nueve habilidades de Liderazgo. La página describe ejercicios y simulaciones en equipo con acompañamiento; no habla de retroalimentación de forma expresa.
6. **Fuentes distintas entre archivos.** En cinco de las seis experiencias del lote 01, las fuentes que cita la experiencia no son las mismas que cita el Atlas para su habilidad principal, y el manifiesto guarda una sola por experiencia. Ejemplo: EDIT-N1-002 cita STAN_CORE y WH_CORE; el Atlas, para FIN-01, cita STAN_CORE y HBS_FIN. Conviene decidir cuál manda.
7. **Columnas iguales en las 52 filas.** «tipo_respaldo», «diseno_metis» y «estado» traen el mismo texto en todas las filas del Atlas; todavía no distinguen una habilidad de otra.
8. **Nombre del archivo.** «FUENTES_VERIFICADAS» describe bien que las direcciones existen y son oficiales. No debe leerse como que cada habilidad está verificada contra su curso.

## 5. Trazabilidad por lote
Fuente académica → habilidad → experiencia → evaluación independiente. Las fuentes de la columna son las que cita la experiencia; entre paréntesis, las que cita el Atlas cuando difieren.

### Lote 01 · versión 1.0
| Experiencia | Habilidad principal | Secundarias | Fuentes | Evaluación independiente | Rúbrica | En la plataforma |
|---|---|---|---|---|---|---|
| EDIT-N1-001 «¿Nueve tareas o una estrategia?» | `est.fundamentos` Lenguaje de la estrategia | `est.priorizacion`, `est.alineacion` | HBS_STRAT, STAN_CORE | Lavandería | 50 / 30 / 20 | Leída, sin convertir |
| EDIT-N1-002 «Hay utilidad; ¿por qué no hay efectivo?» | `fin.lenguaje` Vocabulario financiero | `fin.resultados`, `fin.flujo` | STAN_CORE, WH_CORE (Atlas: STAN_CORE, HBS_FIN) | Estudio de diseño | 35 / 30 / 35 | Convertida: `exp.n1.fin.utilidad-caja` |
| EDIT-N1-003 «Ese correo puede empeorarlo» | `lid.feedback` Retroalimentación y conversaciones difíciles | `lid.comunicacion`, `lid.fundamentos` | STAN_LAB, STAN_CORE, MIT_CORE (Atlas: STAN_CORE, STAN_LAB) | Almacén | 40 / 20 / 20 / 20 | Leída, sin convertir |
| EDIT-N1-004 «Todos trabajan; el pedido sigue tarde» | `ope.capacidad` Capacidad y cuellos de botella | `ope.procesos`, `ope.indicadores` | STAN_CORE, WH_CORE, MIT_CORE (Atlas: STAN_CORE, WH_CORE) | Restaurante | 50 / 25 / 25 | Leída, sin convertir |
| EDIT-N1-005 «¿Quién es realmente el cliente?» | `cre.cliente` Cliente y propuesta de valor | `cre.segmentacion`, `cre.canales` | HBS_MKT, STAN_CORE, WH_CORE (Atlas: HBS_MKT, STAN_CORE) | Software de citas médicas | 45 / 30 / 25 | Leída, sin convertir |
| EDIT-N1-006 «Dos riesgos, una sola prioridad» | `rie.fundamentos` Lenguaje del riesgo | `rie.cumplimiento`, `rie.etica` | HBS_GOV, WH_CORE, INSEAD (Atlas: HBS_GOV, WH_CORE) | Centro de distribución | 35 / 25 / 40 | Leída, sin convertir |

### Lote 02 · versión 1.1
| Experiencia | Habilidad principal | Secundarias | Fuentes | Evaluación independiente | Rúbrica | En la plataforma |
|---|---|---|---|---|---|---|
| EDIT-N1-007 «¿Por qué nos eligen si no somos los más baratos?» | `est.ventaja` Ventaja competitiva y posicionamiento | `est.fundamentos`, `cre.cliente` | HBS_STRAT, HBS_ISC (Atlas: HBS_STRAT, STAN_CORE) | Taller de bicicletas | 40 / 35 / 25 | Convertida: `exp.n1.est.por-que-nos-eligen` |
| EDIT-N1-008 «Las ventas no son la utilidad» | `fin.resultados` Estado de resultados y márgenes | `fin.lenguaje`, `fin.presupuesto` | HBS_AM, STAN_CORE (Atlas: STAN_CORE, HBS_FIN) | Hotel pequeño | 40 / 40 / 20 | Convertida: `exp.n1.fin.ventas-no-son-utilidad` |
| EDIT-N1-009 «Ser responsable no es hacerlo todo» | `lid.fundamentos` El papel de quien dirige | `lid.delegacion`, `lid.comunicacion` | STAN_CORE, INSEAD_CORE (Atlas: STAN_CORE, STAN_LAB) | Biblioteca municipal | 45 / 30 / 25 | Convertida: `exp.n1.lid.responsable-no-es-hacerlo-todo` |
| EDIT-N1-010 «El pedido desapareció entre áreas» | `ope.procesos` Procesos | `ope.indicadores`, `ope.calidad` | HBS_TOM, INSEAD_CORE (Atlas: STAN_CORE, WH_CORE) | Clínica veterinaria | 40 / 25 / 35 | Convertida: `exp.n1.ope.pedido-entre-areas` |
| EDIT-N1-011 «No todos compran por la misma razón» | `cre.segmentacion` Segmentación y mercado objetivo | `cre.cliente`, `cre.precios` | HBS_MKT, INSEAD_CORE (Atlas: HBS_MKT, STAN_CORE) | Cursos cortos en línea | 45 / 30 / 25 | Convertida: `exp.n1.cre.no-todos-compran-igual` |
| EDIT-N1-012 «El proveedor es familia» | `rie.etica` Ética y dilemas | `rie.cumplimiento`, `rie.stakeholders` | HBS_GOV, STAN_CORE (Atlas: HBS_GOV, WH_CORE) | Comité de contratación | 40 / 35 / 25 | Convertida: `exp.n1.rie.el-proveedor-es-familia` |

### Lote 03 · versión 1.2
| Experiencia | Habilidad principal | Secundarias | Fuentes | Evaluación independiente | Rúbrica | En la plataforma |
|---|---|---|---|---|---|---|
| EDIT-N1-013 «Tres propuestas, un presupuesto» | `est.priorizacion` Priorización y renuncias | `est.fundamentos`, `ope.indicadores` | HBS_STRAT, STAN_CORE | Centro cultural | 25 / 30 / 30 / 15 | Convertida: `exp.n1.est.tres-propuestas-un-presupuesto` |
| EDIT-N1-014 «¿La tienda tiene más de lo que debe?» | `fin.balance` Balance general | `fin.lenguaje` | STAN_CORE, INSEAD_CORE (Atlas: STAN_CORE, HBS_FIN) | Floristería | 40 / 25 / 20 / 15 | Leída, sin convertir |
| EDIT-N1-015 «Ese correo necesita una decisión, no más palabras» | `lid.comunicacion` Comunicación ejecutiva | `lid.fundamentos` | INSEAD_CORE, STAN_CORE (Atlas: MIT_CORE, STAN_LAB) | Centro de eventos | 30 / 35 / 20 / 15 | Convertida: `exp.n1.lid.ese-correo-necesita-una-decision` |
| EDIT-N1-016 «El tablero está en verde, pero los clientes esperan» | `ope.indicadores` Indicadores operativos | `ope.procesos` | INSEAD_CORE, STAN_CORE (Atlas: STAN_CORE, WH_CORE) | Clínica veterinaria | 25 / 35 / 25 / 15 | Convertida: `exp.n1.ope.el-tablero-esta-en-verde` |
| EDIT-N1-017 «Cobrar más no siempre significa cobrar de más» | `cre.precios` Precios y valor percibido | `cre.cliente` | INSEAD_CORE, STAN_CORE (Atlas: HBS_MKT, STAN_CORE) | Mantenimiento de jardines | 35 / 25 / 30 / 10 | Convertida: `exp.n1.cre.cobrar-mas-no-es-cobrar-de-mas` |
| EDIT-N1-018 «La misma persona hace todo el pago» | `rie.cumplimiento` Cumplimiento y controles | `rie.etica`, `ope.procesos` | HBS_GOV, INSEAD_CORE (Atlas: HBS_GOV, WH_CORE) | Escuela de talleres | 30 / 35 / 25 / 10 | Convertida: `exp.n1.rie.la-misma-persona-hace-todo-el-pago` |

Las 18 experiencias cubren 18 de las 24 habilidades de Nivel 1 como habilidad principal. Quedan 6 sin experiencia: `est.alineacion`, `fin.flujo`, `fin.presupuesto`, `lid.delegacion`, `ope.calidad`, `cre.canales`.
Executive Challenge EC-N1-001-A «La semana en que casi todo parecía urgente»: leído. Sus cuatro cálculos se revisaron a mano y cuadran. No se convirtió: el paquete pide una segunda versión equivalente antes de usarlo, y hoy solo existe la A.

## 6. Cómo se convierte cada pieza del documento editorial
| En el documento editorial | En la plataforma | Qué se conserva y qué cambia |
|---|---|---|
| Gancho (mensaje, correo, audio, chat) | Nodo «mensaje» con personaje y canal | El texto es el del paquete. Se añade una línea que dice qué papel tiene quien juega |
| Artefactos y documentos | Documentos tocables: renglones con importe, con columnas o de solo texto | Los datos son los del paquete. Las explicaciones al tocar son nuevas y solo aparecen en la práctica |
| Clasificación activa, mapas, arrastrar tarjetas | Nodo «clasificar»: cada tarjeta se asigna tocando su grupo | No se arrastra: se toca, para que funcione igual en celular y con teclado. Cada tarjeta mal puesta trae su explicación |
| Ordenar un flujo | Nodo «ordenar»: flechas para subir y bajar cada tarjeta | Igual: sin arrastrar. La pista señala qué paso necesita a cuál |
| Calcular o comparar cifras | Nodo «calcular»: se escribe cada cifra, con pista y calculadora | No hay opciones. Tras dos revisiones sin acertar se puede ver la solución |
| Encontrar algo en un documento | Nodo «señalar»: se toca el renglón | Uno o varios renglones. Cada error trae su explicación |
| Decisiones y elecciones | Nodo «decisión» con rutas defendibles, con riesgo o con una confusión | Cada ruta tiene consecuencia y retroalimentación propias. Donde el paquete dice que varias son defendibles, lo son |
| Nueva condición o evidencia | Nodo «dato» | Texto del paquete. Cuando el paquete pide reaccionar al dato, se añadió una decisión y queda anotada |
| Redactar un mensaje o una frase | Nodo «redactar», con un texto o varios campos cortos | No se califica ni cuenta el largo: se compara con una referencia y queda guardado |
| Microteoría | Concepto, disponible todo el tiempo en la práctica | Texto del paquete, sin cambios |
| Retroalimentación por ruta | Retroalimentación de cada opción y de cada tarjeta | Redactada a partir de lo que el paquete indica para cada ruta |
| Evaluación inédita o demostración independiente | Variante: otra situación, sin explicaciones, sin concepto y sin los documentos de la práctica | Ver la sección 7 |
| Rúbrica | Peso de cada tarea de la variante | Los pesos son los del paquete y suman 100 |
| Notas de QA | Pruebas automáticas | Cada identidad numérica del paquete es una prueba |

## 7. Decisiones de conversión que cambian algo respecto del documento editorial
1. **Lo escrito no se califica solo.** Varias rúbricas dan puntos a respuestas redactadas. La plataforma no usa inteligencia artificial para calificar ni acredita con estas experiencias. Lo que se puede comprobar sin una persona (clasificar, ordenar, señalar, cifras) se comprueba; lo escrito se guarda, se compara con una respuesta de referencia y su peso queda «en espera de revisión de una persona». Cuando hay texto pendiente no se da veredicto de aprobado o no aprobado.
2. **Nada se convirtió en opción múltiple.** Donde el paquete pide identificar, clasificar u ordenar, la variante lo pide con tarjetas, secuencias o renglones, no con incisos.
3. **Tocar en vez de arrastrar.** Todas las actividades se resuelven tocando botones de al menos 36 píxeles. Nada depende solo del color: cada estado lleva texto.
4. **Piezas añadidas.** Para que cada experiencia tenga al menos dos decisiones conectadas y para que la variante tenga algo comprobable, se añadieron decisiones, tarjetas o datos. Cada uno está marcado como «añadido al convertir» y listado en la experiencia, en la sección 9.
5. **Calculadora.** Donde el paquete permite calculadora en la evaluación, la variante ofrece una calculadora aritmética que solo opera; no explica conceptos.
6. **Regla para pasar.** 70 de 100 en todas, provisional y sin calibrar.

## 8. Cómo entra en lo que ya está construido
| Pieza | Qué había | Qué se añadió | Qué falta antes de acreditar |
|---|---|---|---|
| Catálogo de 52 habilidades | Identificadores estables | Tabla de correspondencia editorial y catálogo, con prueba | Nada |
| Contenido | Currículo en archivos con tipos | Contrato de experiencia: personajes, documentos, nodos, rutas, consecuencias, concepto, variante, rúbrica, fuentes, política de evidencia, estado de revisión | Revisión editorial de cada experiencia |
| Revisión automática | Pruebas del currículo | Validador: cifras recalculables, opciones de largo parecido, respuesta nunca a la vista, variante sin personajes ni explicaciones de la práctica, gancho de 15 a 35 palabras, concepto de 80 a 180, al menos una tarea comprobable en la variante | Calibrar con datos de uso |
| Registro de evidencias y cálculo de dominio | Hechos y probados; sin conectar a pantallas | Nada: las experiencias no los tocan, y una prueba lo vigila | Decidir qué evidencia deja cada modo |
| Pantalla | Pantalla de decisión por pasos, con el fondo mêtis | Pantalla de experiencia: documentos tocables, conversación, rutas, clasificar, ordenar, calcular, señalar, respuesta escrita, cierre, variante y resultado; lista de experiencias | Recuperar teoría y respuestas desde Academy |
| Guardar y continuar | Partida en la cuenta | El recorrido se guarda solo en el navegador | Guardarlo en la cuenta (tabla nueva) |
| Calificación | En la aplicación | Igual. Para experiencias que no acreditan es aceptable | Calificar en el servidor y revisar lo escrito |

## 9. Experiencias convertidas

### EDIT-N1-002 · «Hay utilidad; ¿por qué no hay efectivo?»
Finanzas · Lote 01, paquete 1.0 · `exp.n1.fin.utilidad-caja` · versión 1. Habilidad principal: `fin.lenguaje` Vocabulario financiero. Secundarias: `fin.resultados` Estado de resultados y márgenes; `fin.flujo` Flujo de efectivo. Fuentes: STAN_CORE, WH_CORE. Entrada: `/piloto/utilidad-y-efectivo`.
| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |
|---|---|---|---|---|
| El mensaje | `mensaje` | Mensaje de un personaje | → explorar | Texto del paquete |
| Los documentos | `explorar` | Documentos tocables | → diagnostico | Descrito en el paquete, redactado al convertir |
| El diagnóstico | `diagnostico` | Decisión con rutas | «¿Qué explica la diferencia?» · cobranza (defendible) → dato; contador (confusión) → comprobar; aplazar (con riesgo) → comprobar | Texto del paquete |
| El diagnóstico | `comprobar` | Señalar sobre el documento | Toca el renglón que dice cuánto dinero entró de verdad en octubre. 1 renglón por encontrar; cada error trae su explicación. → dato | Añadido al convertir |
| Dato nuevo | `dato` | Dato nuevo | Marta abre su lista de cobranza. → promesa | Descrito en el paquete, redactado al convertir |
| Dato nuevo | `promesa` | Decisión con rutas | «Entonces, ¿le aviso al equipo que el viernes cobran sin falta?» · utilidad (confusión) → respuesta; confirmar (defendible) → respuesta; cartera (con riesgo) → respuesta | Añadido al convertir |
| Tu respuesta | `respuesta` | Respuesta escrita | Un texto libre; no se califica, se compara con una referencia. → cierre | Descrito en el paquete, redactado al convertir |
| Cierre | `cierre` | Cierre con lo decidido y el concepto | Da paso a la variante. | Añadido al convertir |

Decisiones: 2, con 3, 3 rutas. Todas las combinaciones llegan al cierre.
**Variante.** «¿Ganó dinero y qué saldo le queda?» Un estudio de diseño cierra el mes con estos datos. Nadie te los explica: lee, calcula y responde. Tareas: Diferencia entre ingreso y cobro (35 puntos, cifra por calcular y escribir); Utilidad (30 puntos, cifra por calcular y escribir); Flujo y saldo de efectivo (35 puntos, cifra por calcular y escribir). Se comprueban solos 100 de 100 puntos.
**Origen de las piezas.** 6 traen el texto del paquete tal cual; 11 están descritas en el paquete y se redactaron al convertir; 10 se añadieron.
**Por confirmar en la revisión editorial.**
1. La segunda decisión («¿le aviso al equipo que el viernes cobran?») se redactó a partir del momento 3 del paquete, que pide confirmar saldo, fecha de cobro o crédito antes de prometer el pago.
2. Las respuestas de Marta después de cada decisión son nuevas: el paquete describe qué debe enseñar cada ruta, no el diálogo.
3. Quien elige una ruta no defendible en el diagnóstico pasa por una comprobación sobre los documentos (tocar el renglón de lo que entró). El paquete no la trae; se añadió para que la consecuencia sea hacer algo, no solo leer.
4. El criterio «diferencia entre ingreso y cobro» de la variante se pregunta como una cifra por calcular (lo que sigue sin cobrarse).
5. La «advertencia de exactitud» del paquete habla de un sobregiro de $10,000 y caja libre de $0; la tabla y los cálculos dan saldo final de $5,000. Se siguió la tabla.
6. La variante repite tres cifras de la práctica (25,000 de efectivo inicial y de gastos, 45,000 por cobrar y 5,000 de saldo final).
7. La regla para pasar la variante (70 de 100) es provisional.

**Avisos del validador.** la variante repite cifras de la práctica: $5,000, $25,000, $45,000; 11 piezas adaptadas y 10 añadidas en la conversión esperan revisión editorial; sin revisión editorial humana.

### EDIT-N1-007 · «¿Por qué nos eligen si no somos los más baratos?»
Estrategia · Lote 02, paquete 1.1 · `exp.n1.est.por-que-nos-eligen` · versión 1. Habilidad principal: `est.ventaja` Ventaja competitiva y posicionamiento. Secundarias: `est.fundamentos` Lenguaje de la estrategia; `cre.cliente` Cliente y propuesta de valor. Fuentes: HBS_STRAT, HBS_ISC. Entrada: `/piloto/por-que-nos-eligen`.
| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |
|---|---|---|---|---|
| El mensaje | `mensaje` | Mensaje de un personaje | → explorar | Texto del paquete |
| Los documentos | `explorar` | Documentos tocables | → fortalezas | Descrito en el paquete, redactado al convertir |
| Fortalezas | `fortalezas` | Clasificar tarjetas en grupos | Asigna cada fortaleza a la oferta que la tiene, según la tabla. 4 tarjetas en 2 grupos (Ruta Fresca, Menú Centro). → investigar | Descrito en el paquete, redactado al convertir |
| Qué investigar | `investigar` | Decisión con rutas | «¿Nos posicionamos como el más barato?» · tiempo (defendible) → registro; precio (defendible) → registro; cobertura (defendible) → registro | Texto del paquete |
| Dato nuevo | `registro` | Dato nuevo | Irene revisa su registro de entregas. → anunciar | Texto del paquete |
| Dato nuevo | `anunciar` | Decisión con rutas | «Entonces, ¿ya puedo anunciar que nuestra ventaja es entregar más rápido que nadie?» · anunciar (confusión) → frase; verificar (defendible) → frase; abandonar (con riesgo) → frase | Añadido al convertir |
| Tu frase | `frase` | Respuesta escrita | 2 campos cortos; no se califica, se compara con una referencia. → cierre | Texto del paquete |
| Cierre | `cierre` | Cierre con lo decidido y el concepto | Da paso a la variante. | Añadido al convertir |

Decisiones: 2, con 3, 3 rutas. Todas las combinaciones llegan al cierre.
**Variante.** «¿Cómo se posiciona cada taller y qué falta comprobar?» Dos talleres de reparación de bicicletas compiten en la misma ciudad. Nadie te explica los datos: lee y responde. Tareas: Atributos relativos correctos (40 puntos, clasificar tarjetas); Grupo objetivo y propuesta (35 puntos, respuesta escrita); Evidencia pendiente y límites (25 puntos, respuesta escrita). Se comprueban solos 40 de 100 puntos; 60 esperan revisión de una persona.
**Origen de las piezas.** 5 traen el texto del paquete tal cual; 10 están descritas en el paquete y se redactaron al convertir; 11 se añadieron.
**Por confirmar en la revisión editorial.**
1. La segunda decisión («¿ya puedo anunciar que nuestra ventaja es entregar más rápido?») no está en el paquete como decisión: se redactó a partir del nodo 4, que pide no afirmar una ventaja ya ganada.
2. En la decisión «¿Nos posicionamos como el más barato?» las tres rutas son defendibles, como indica el paquete; cada una muestra qué atributo competiría y cuál sería la renuncia.
3. Las explicaciones al tocar cada renglón y cada entrevista son nuevas.
4. Variante: los nombres de los talleres (Pedal y Rayo), la fila «cómo se recibe la bicicleta» y la tarjeta «mejor calidad de reparación» (sin dato) se añadieron para poder comprobar los atributos sin opciones.
5. Variante: «grupo objetivo y propuesta» (35 puntos) y «evidencia pendiente» (25 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona.
6. La regla para pasar la variante (70 de 100) es provisional.

**Avisos del validador.** 60 de 100 puntos de la variante son respuestas escritas: no se califican solas y esperan revisión de una persona; 10 piezas adaptadas y 11 añadidas en la conversión esperan revisión editorial; sin revisión editorial humana.

### EDIT-N1-008 · «Las ventas no son la utilidad»
Finanzas · Lote 02, paquete 1.1 · `exp.n1.fin.ventas-no-son-utilidad` · versión 1. Habilidad principal: `fin.resultados` Estado de resultados y márgenes. Secundarias: `fin.lenguaje` Vocabulario financiero; `fin.presupuesto` Presupuesto y variaciones. Fuentes: HBS_AM, STAN_CORE. Entrada: `/piloto/ventas-y-utilidad`.
| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |
|---|---|---|---|---|
| El correo | `mensaje` | Mensaje de un personaje | → explorar | Texto del paquete |
| Los documentos | `explorar` | Documentos tocables | → renglones | Descrito en el paquete, redactado al convertir |
| Qué es cada renglón | `renglones` | Clasificar tarjetas en grupos | ¿Es una venta, un costo directamente asociado a lo vendido o un gasto para operar? 5 tarjetas en 3 grupos (Venta, Costo asociado a lo vendido, Gasto para operar). → bruta | Descrito en el paquete, redactado al convertir |
| Utilidad bruta | `bruta` | Decisión con rutas | «¿La utilidad bruta es todo lo que ganamos?» · si (confusión) → cambios; no (defendible) → cambios; banco (confusión) → cambios | Texto del paquete |
| Qué cambió | `cambios` | Calcular con apoyo | Escribe de cuánto fue cada cambio. Puedes usar la calculadora. 5 cifras, con pista por cifra y calculadora. → mas | Descrito en el paquete, redactado al convertir |
| Vender más | `mas` | Decisión con rutas | «Si vendemos más, ¿siempre ganaremos más?» · no (defendible) → explica; si (confusión) → explica; recortar (con riesgo) → explica | Texto del paquete |
| Tu respuesta | `explica` | Respuesta escrita | Un texto libre; no se califica, se compara con una referencia. → cierre | Texto del paquete |
| Cierre | `cierre` | Cierre con lo decidido y el concepto | Da paso a la variante. | Añadido al convertir |

Decisiones: 2, con 3, 3 rutas. Todas las combinaciones llegan al cierre.
**Variante.** «¿Cuánto le quedó al hotel después de operar?» Un hotel pequeño cierra el mes con estos tres datos. Nadie te los explica: ubica, calcula y responde. Tareas: Estructura del reporte (40 puntos, clasificar tarjetas); Relaciones y cálculos: utilidad bruta (20 puntos, cifra por calcular y escribir); Relaciones y cálculos: resultado operativo (20 puntos, cifra por calcular y escribir); Distinción entre resultado y caja (20 puntos, respuesta escrita). Se comprueban solos 80 de 100 puntos; 20 esperan revisión de una persona. Ofrece calculadora.
**Origen de las piezas.** 7 traen el texto del paquete tal cual; 14 están descritas en el paquete y se redactaron al convertir; 4 se añadieron.
**Por confirmar en la revisión editorial.**
1. El paso «qué cambió» se convirtió en cinco cifras por escribir con pista y calculadora. Como el signo se lee en el propio reporte, cada campo dice si el renglón subió o bajó y se pide solo de cuánto fue el cambio.
2. La tercera opción de «¿La utilidad bruta es todo lo que ganamos?» (lo que quedó en el banco) es nueva; retoma la advertencia de la nota del contador.
3. La ruta «recortar ya el gasto en publicidad» se redactó a partir de la retroalimentación del paquete para quien recomienda recortar un gasto exacto.
4. Variante: los tres datos se muestran en otro orden y el renglón de gastos se llama «Administración y venta».
5. Variante: el paquete da 40 puntos a «relaciones y cálculos»; se repartieron 20 a la utilidad bruta y 20 al resultado operativo.
6. Variante: «distinción entre resultado y caja» (20 puntos) es una respuesta escrita. No se califica de forma automática: queda en espera de revisión de una persona. La pregunta no menciona la cifra para no dar la respuesta del cálculo anterior.
7. Los márgenes brutos (40 % y 33⅓ %) son opcionales en el paquete; no se piden.
8. La regla para pasar la variante (70 de 100) es provisional.

**Avisos del validador.** 20 de 100 puntos de la variante son respuestas escritas: no se califican solas y esperan revisión de una persona; la variante repite cifras de la práctica: $30,000, $48,000; 14 piezas adaptadas y 4 añadidas en la conversión esperan revisión editorial; sin revisión editorial humana.

### EDIT-N1-009 · «Ser responsable no es hacerlo todo»
Liderazgo · Lote 02, paquete 1.1 · `exp.n1.lid.responsable-no-es-hacerlo-todo` · versión 1. Habilidad principal: `lid.fundamentos` El papel de quien dirige. Secundarias: `lid.delegacion` Delegación y seguimiento; `lid.comunicacion` Comunicación ejecutiva. Fuentes: STAN_CORE, INSEAD_CORE. Entrada: `/piloto/responsable-no-es-hacerlo-todo`.
| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |
|---|---|---|---|---|
| La nota de voz | `mensaje` | Mensaje de un personaje | → explorar | Texto del paquete |
| Los documentos | `explorar` | Documentos tocables | → mapa | Descrito en el paquete, redactado al convertir |
| Hacer, coordinar, dirigir | `mapa` | Clasificar tarjetas en grupos | Asigna cada acción a hacer, coordinar o dirigir. 5 tarjetas en 3 grupos (Hacer, Coordinar, Dirigir). → conversacion | Texto del paquete |
| La conversación | `conversacion` | Decisión con rutas | «Hoy pensaba seguir con las cajas, que es lo que se ve atrasado. ¿Qué me dirías?» · quien (defendible) → dato; cajas (con riesgo) → dato; resultado (defendible) → dato | Descrito en el paquete, redactado al convertir |
| Dato nuevo | `dato` | Dato nuevo | Faltan dos días. → accion | Añadido al convertir |
| Primera acción | `accion` | Decisión con rutas | «Con dos días, ¿cuál sería mi primera acción?» · esfuerzo (confusión) → mensaje_final; definir (defendible) → mensaje_final; asumir (defendible) → mensaje_final | Texto del paquete |
| Tu mensaje | `mensaje_final` | Respuesta escrita | 3 campos cortos; no se califica, se compara con una referencia. → cierre | Texto del paquete |
| Cierre | `cierre` | Cierre con lo decidido y el concepto | Da paso a la variante. | Añadido al convertir |

Decisiones: 2, con 3, 3 rutas. Todas las combinaciones llegan al cierre.
**Variante.** «¿Qué es ejecutar, qué es coordinar y quién responde por el resultado?» Una biblioteca municipal prepara una exposición. Tres encargados tienen tareas asignadas, pero nadie confirmó permisos ni horarios. Nadie te lo explica: lee y responde. Tareas: Distingue los tres papeles (45 puntos, clasificar tarjetas); Identifica el vacío de responsabilidad (30 puntos, respuesta escrita); Propone seguimiento concreto (25 puntos, respuesta escrita). Se comprueban solos 45 de 100 puntos; 55 esperan revisión de una persona.
**Origen de las piezas.** 9 traen el texto del paquete tal cual; 7 están descritas en el paquete y se redactaron al convertir; 8 se añadieron.
**Por confirmar en la revisión editorial.**
1. El mapa de responsabilidades añade dos tarjetas a las tres del paquete: «enviar la señalética a la imprenta» (hacer) y «decidir quién aprueba el presupuesto» (dirigir, y también se acepta coordinar, por los solapamientos que el paquete permite).
2. La conversación con Nora se convirtió en una decisión con las dos preguntas del paquete y la ruta de seguir con las cajas.
3. El dato nuevo («faltan dos días»: la imprenta necesita el archivo hoy y el recinto solo inspecciona con cita) no está en el paquete. Se añadió para dar la restricción de tiempo que hace defendible asumir la señalética.
4. Las respuestas de Nora después de cada decisión son nuevas.
5. Variante: los nombres de los encargados, las tareas y los estados se redactaron al convertir; el paquete solo describe la situación.
6. Variante: «vacío de responsabilidad» (30 puntos) y «seguimiento concreto» (25 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona.
7. La regla para pasar la variante (70 de 100) es provisional.

**Avisos del validador.** 55 de 100 puntos de la variante son respuestas escritas: no se califican solas y esperan revisión de una persona; 7 piezas adaptadas y 8 añadidas en la conversión esperan revisión editorial; sin revisión editorial humana.

### EDIT-N1-010 · «El pedido desapareció entre áreas»
Operaciones · Lote 02, paquete 1.1 · `exp.n1.ope.pedido-entre-areas` · versión 1. Habilidad principal: `ope.procesos` Procesos. Secundarias: `ope.indicadores` Indicadores operativos; `ope.calidad` Calidad. Fuentes: HBS_TOM, INSEAD_CORE. Entrada: `/piloto/pedido-entre-areas`.
| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |
|---|---|---|---|---|
| El chat | `mensaje` | Mensaje de un personaje | → explorar | Texto del paquete |
| Los documentos | `explorar` | Documentos tocables | → salio | Descrito en el paquete, redactado al convertir |
| ¿Salió o no? | `salio` | Decisión con rutas | «Almacén dice una cosa y atención al cliente otra. ¿El pedido salió o no?» · pago (confusión) → flujo; registro (defendible) → flujo; culpa (con riesgo) → flujo | Añadido al convertir |
| El flujo | `flujo` | Ordenar una secuencia | Ordena las tarjetas como debe fluir un pedido, de la primera a la última. 5 tarjetas; se revisa el orden. → entrada_salida | Texto del paquete |
| Entrada y salida | `entrada_salida` | Clasificar tarjetas en grupos | ¿Qué es la entrada de este proceso, qué es una actividad y qué es la salida? 4 tarjetas en 3 grupos (Entrada, Actividad, Salida). → traspaso | Descrito en el paquete, redactado al convertir |
| El traspaso | `traspaso` | Señalar sobre el documento | Toca el evento del registro donde se ve que faltaba información para empezar. 1 renglón por encontrar; cada error trae su explicación. → propuesta | Descrito en el paquete, redactado al convertir |
| La propuesta | `propuesta` | Decisión con rutas | «Para que no se repita, pensaba contratar a otro empacador. ¿Qué opinas?» · informacion (defendible) → cierre; contratar (con riesgo) → cierre; lista (defendible) → cierre | Texto del paquete |
| Cierre | `cierre` | Cierre con lo decidido y el concepto | Da paso a la variante. | Añadido al convertir |

Decisiones: 2, con 3, 3 rutas. Todas las combinaciones llegan al cierre.
**Variante.** «¿Cómo debe fluir la reparación y dónde está detenida?» Una clínica veterinaria pidió reparar un equipo y lleva días esperando. Nadie te explica el registro: ordena, ubica y señala. Tareas: Orden causal (40 puntos, ordenar una secuencia); Entrada y salida (25 puntos, clasificar tarjetas); Identificación del traspaso o ausencia (35 puntos, señalar renglones). Se comprueban solos 100 de 100 puntos.
**Origen de las piezas.** 8 traen el texto del paquete tal cual; 5 están descritas en el paquete y se redactaron al convertir; 10 se añadieron.
**Por confirmar en la revisión editorial.**
1. La primera decisión («¿el pedido salió o no?») no está en el paquete. Se añadió a partir de su control de calidad, que pide que ninguna rama declare entregado un pedido sin evento de entrega.
2. Ordenar el flujo se hace con botones de subir y bajar, no arrastrando. Si el orden no es B, E, C, D, A, se explica la primera dependencia que no se cumple y se vuelve a intentar.
3. En «entrada y salida» se añadieron dos tarjetas de actividad (empacar y generar la guía) para tratar la confusión entre guía generada y salida del proceso.
4. El paquete no pide una respuesta escrita en esta experiencia; no se añadió.
5. Variante: el equipo a reparar (una báscula), las marcas de tiempo y los eventos del registro se redactaron al convertir. No se presupone ningún requisito de salud.
6. Variante: las tres tareas se comprueban solas (ordenar, clasificar y señalar el renglón). El orden vale todo o nada.
7. La regla para pasar la variante (70 de 100) es provisional.

**Avisos del validador.** 5 piezas adaptadas y 10 añadidas en la conversión esperan revisión editorial; sin revisión editorial humana.

### EDIT-N1-011 · «No todos compran por la misma razón»
Crecimiento · Lote 02, paquete 1.1 · `exp.n1.cre.no-todos-compran-igual` · versión 1. Habilidad principal: `cre.segmentacion` Segmentación y mercado objetivo. Secundarias: `cre.cliente` Cliente y propuesta de valor; `cre.precios` Precios y valor percibido. Fuentes: HBS_MKT, INSEAD_CORE. Entrada: `/piloto/no-todos-compran-igual`.
| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |
|---|---|---|---|---|
| El mensaje | `mensaje` | Mensaje de un personaje | → explorar | Texto del paquete |
| Las entrevistas | `explorar` | Documentos tocables | → voces | Descrito en el paquete, redactado al convertir |
| Las voces | `voces` | Clasificar tarjetas en grupos | Asigna cada mensaje a la necesidad que expresa. 3 tarjetas en 3 grupos (Comida rápida y predecible, Porciones para compartir, Ingredientes visibles y flexibilidad). → criterio | Descrito en el paquete, redactado al convertir |
| El criterio | `criterio` | Decisión con rutas | «Entonces, ¿con qué criterio separo a quienes nos escriben?» · momento (defendible) → piloto; beneficio (defendible) → piloto; ropa (confusión) → piloto | Texto del paquete |
| El piloto | `piloto` | Decisión con rutas | «Tengo presupuesto para un solo piloto. ¿Con quién empiezo?» · oficinas (defendible) → capacidad; familias (defendible) → capacidad; deportistas (defendible) → capacidad; todos (confusión) → capacidad | Texto del paquete |
| Dato nuevo | `capacidad` | Dato nuevo | Sara revisa qué puede hacer la tienda. → ajuste | Texto del paquete |
| Dato nuevo | `ajuste` | Decisión con rutas | «Con ese horario, ¿qué hago con el piloto?» · rentable (confusión) → cierre; alineado (defendible) → cierre; igual (con riesgo) → cierre | Descrito en el paquete, redactado al convertir |
| Cierre | `cierre` | Cierre con lo decidido y el concepto | Da paso a la variante. | Añadido al convertir |

Decisiones: 3, con 3, 4, 3 rutas. Todas las combinaciones llegan al cierre.
**Variante.** «¿Qué grupos hay según lo que necesitan y qué falta saber antes de elegir a quién priorizar?» Una biblioteca digital de cursos cortos entrevistó a algunas personas que la usan. Nadie te explica los datos: lee y responde. Tareas: Identificación de necesidades (45 puntos, clasificar tarjetas); Criterio coherente (30 puntos, respuesta escrita); Hipótesis y dato pendiente (25 puntos, respuesta escrita). Se comprueban solos 45 de 100 puntos; 55 esperan revisión de una persona.
**Origen de las piezas.** 5 traen el texto del paquete tal cual; 14 están descritas en el paquete y se redactaron al convertir; 9 se añadieron.
**Por confirmar en la revisión editorial.**
1. El paquete describe la nueva evidencia (el horario de entrega) y su lectura, pero no la plantea como decisión. Se redactó la decisión «Con ese horario, ¿qué hago con el piloto?» con tres rutas; dos de ellas (inferir rentabilidad por el número de entrevistas e insistir con familias) son nuevas.
2. En «¿Con quién empiezo?» se añadió la ruta «con todos a la vez», tomada de la retroalimentación del paquete («dice que todos son objetivo»). Oficinas, familias y deportistas quedan como defendibles, como indica el paquete; a deportistas se le pide justificar cómo los atendería.
3. La clasificación de voces usa como grupos las tres necesidades de la tabla de entrevistas; no se añadieron tarjetas.
4. Las explicaciones al tocar cada renglón y cada mensaje, y la nota al pie con la suma de 44 entrevistas, son nuevas.
5. Esta experiencia no tiene respuesta escrita en la práctica: el paquete no la pide.
6. Variante: las seis voces de la biblioteca digital se redactaron aquí; el paquete solo nombra los tres tipos de persona.
7. Variante: «criterio coherente» (30 puntos) e «hipótesis y dato pendiente» (25 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona.
8. La regla para pasar la variante (70 de 100) es provisional.

**Avisos del validador.** 55 de 100 puntos de la variante son respuestas escritas: no se califican solas y esperan revisión de una persona; 14 piezas adaptadas y 9 añadidas en la conversión esperan revisión editorial; sin revisión editorial humana.

### EDIT-N1-012 · «El proveedor es familia»
Riesgo y gobierno · Lote 02, paquete 1.1 · `exp.n1.rie.el-proveedor-es-familia` · versión 1. Habilidad principal: `rie.etica` Ética y dilemas. Secundarias: `rie.cumplimiento` Cumplimiento y controles; `rie.stakeholders` Partes interesadas. Fuentes: HBS_GOV, STAN_CORE. Entrada: `/piloto/el-proveedor-es-familia`.
| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |
|---|---|---|---|---|
| El mensaje | `mensaje` | Mensaje de un personaje | → explorar | Texto del paquete |
| Los documentos | `explorar` | Documentos tocables | → regla | Descrito en el paquete, redactado al convertir |
| La regla | `regla` | Señalar sobre el documento | Toca la frase de la política que le dice a Camila qué le toca hacer a ella primero. 1 renglón por encontrar; cada error trae su explicación. → inicial | Descrito en el paquete, redactado al convertir |
| Qué hace Camila | `inicial` | Decisión con rutas | «¿Qué hago entonces con la evaluación?» · validar (defendible) → oferta; abstenerse (defendible) → oferta; callar (confusión) → oferta; excluir (confusión) → oferta | Texto del paquete |
| Dato nuevo | `oferta` | Dato nuevo | Llegan las tres cotizaciones. → seguir | Texto del paquete |
| Dato nuevo | `seguir` | Decisión con rutas | «Con el precio más bajo sobre la mesa, ¿qué recomiendas?» · adjudicar (confusión) → mensaje_final; continuar (defendible) → mensaje_final; descartar (confusión) → mensaje_final | Descrito en el paquete, redactado al convertir |
| Tu mensaje | `mensaje_final` | Respuesta escrita | 2 campos cortos; no se califica, se compara con una referencia. → cierre | Texto del paquete |
| Cierre | `cierre` | Cierre con lo decidido y el concepto | Da paso a la variante. | Añadido al convertir |

Decisiones: 2, con 4, 3 rutas. Todas las combinaciones llegan al cierre.
**Variante.** «¿Dónde está el conflicto de interés potencial y qué pide hacer la política?» Un comité va a contratar servicios tecnológicos para una organización. Nadie te explica los datos: lee y responde. Tareas: Identificación (40 puntos, clasificar tarjetas); Interpretación de la política (35 puntos, respuesta escrita); Respuesta proporcionada y respetuosa (25 puntos, respuesta escrita). Se comprueban solos 40 de 100 puntos; 60 esperan revisión de una persona.
**Origen de las piezas.** 8 traen el texto del paquete tal cual; 10 están descritas en el paquete y se redactaron al convertir; 7 se añadieron.
**Por confirmar en la revisión editorial.**
1. La política del paquete es un solo párrafo; aquí se separó en sus tres frases, sin cambiar una palabra, para poder tocarlas una por una.
2. La escena de exploración («tocar conflicto de interés») se convirtió en dos piezas: el concepto se muestra en pantalla y la persona señala en la política la frase que le dice a Camila qué hacer primero.
3. En «¿Qué hago con la evaluación?» se añadió una cuarta ruta («sacar a la imprenta del concurso»), tomada de la retroalimentación del paquete («excluir al proveedor de inmediato»).
4. La ruta «no comunicar» permite corregir, como pide el paquete: la consecuencia termina con Camila avisando a cumplimiento.
5. El paquete pide recomendar «seguir la evaluación con salvaguardas»; aquí es una decisión con tres rutas, redactadas a partir de «no adjudicar ni descartar solo por parentesco».
6. Las explicaciones al tocar cada criterio y cada frase de la política son nuevas.
7. Variante: el nombre del oferente (Nube Clara), el plazo de ocho semanas y la frase «no hay ningún indicio de pagos ni favores» se añadieron para dar piezas que identificar. La identificación (40 puntos) se comprueba clasificando cinco piezas del caso.
8. Variante: «interpretación de la política» (35 puntos) y «respuesta proporcionada y respetuosa» (25 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona.
9. La política es ficticia. Ninguna pantalla afirma obligaciones legales ni delitos.
10. La regla para pasar la variante (70 de 100) es provisional.

**Avisos del validador.** 60 de 100 puntos de la variante son respuestas escritas: no se califican solas y esperan revisión de una persona; 10 piezas adaptadas y 7 añadidas en la conversión esperan revisión editorial; sin revisión editorial humana.

### EDIT-N1-013 · «Tres propuestas, un presupuesto»
Estrategia · Lote 03, paquete 1.2 · `exp.n1.est.tres-propuestas-un-presupuesto` · versión 1. Habilidad principal: `est.priorizacion` Priorización y renuncias. Secundarias: `est.fundamentos` Lenguaje de la estrategia; `ope.indicadores` Indicadores operativos. Fuentes: HBS_STRAT, STAN_CORE. Entrada: `/piloto/tres-propuestas-un-presupuesto`.
| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |
|---|---|---|---|---|
| El chat | `mensaje` | Mensaje de un personaje | → explorar | Texto del paquete |
| Los documentos | `explorar` | Documentos tocables | → meta_medio | Descrito en el paquete, redactado al convertir |
| Meta y medios | `meta_medio` | Clasificar tarjetas en grupos | Separa el resultado que se busca de las acciones que podrían acercar a ese resultado. 4 tarjetas en 2 grupos (Resultado que se busca (meta), Acción para lograrlo (iniciativa)). → prioridad | Texto del paquete |
| La prioridad | `prioridad` | Decisión con rutas | «Solo alcanza para una. ¿Cuál financiamos este mes?» · a (defendible) → renuncia; b (defendible) → renuncia; c (defendible) → renuncia_c; repartir (confusión) → renuncia | Texto del paquete |
| La renuncia | `renuncia` | Decisión con rutas | «Entonces, ¿mi propuesta de herramientas es mala?» · honesta (defendible) → nota; todo (confusión) → nota; no_importa (con riesgo) → nota | Texto del paquete |
| La renuncia | `renuncia_c` | Decisión con rutas | «Entonces, ¿mi propuesta del calendario es mala?» · honesta (defendible) → nota; todo (confusión) → nota; no_importa (con riesgo) → nota | Añadido al convertir |
| Dato nuevo | `nota` | Dato nuevo | Llega una nota del proveedor de piezas. → revisar | Texto del paquete |
| Dato nuevo | `revisar` | Decisión con rutas | «¿Esto cambia lo que decidimos?» · mantener (defendible) → tarjeta; reevaluar (defendible) → tarjeta; seguro (confusión) → tarjeta; congelar (confusión) → tarjeta | Descrito en el paquete, redactado al convertir |
| La tarjeta | `tarjeta` | Respuesta escrita | 2 campos cortos; no se califica, se compara con una referencia. → cierre | Texto del paquete |
| Cierre | `cierre` | Cierre con lo decidido y el concepto | Da paso a la variante. | Añadido al convertir |

Decisiones: 4, con 4, 3, 3, 4 rutas. Todas las combinaciones llegan al cierre.
**Variante.** «¿Qué iniciativa va primero, a qué se renuncia y con qué se revisa?» Un centro cultural tiene $12,000 para elevar la asistencia a sus talleres infantiles. Nadie te explica los datos: lee, calcula y responde. Tareas: Objetivo frente a acciones (25 puntos, clasificar tarjetas); Coherencia entre evidencia y restricción: presupuesto (10 puntos, cifra por calcular y escribir); Coherencia entre evidencia y restricción: prioridad (20 puntos, respuesta escrita); Renuncia explícita y honesta (30 puntos, respuesta escrita); Indicador de revisión (15 puntos, señalar renglones). Se comprueban solos 50 de 100 puntos; 50 esperan revisión de una persona.
**Origen de las piezas.** 12 traen el texto del paquete tal cual; 15 están descritas en el paquete y se redactaron al convertir; 10 se añadieron.
**Por confirmar en la revisión editorial.**
1. Las tres propuestas son rutas defendibles, como indica el paquete: se evalúa el criterio y la renuncia, no la letra. Se añadió una cuarta ruta («repartir el presupuesto»), tomada de la retroalimentación del paquete para quien promete las tres.
2. Quien elige «repartir» no ha escogido prioridad; para poder seguir, la consecuencia dice que Valeria prueba con la propuesta de menor costo. Conviene revisar si se prefiere obligar a elegir de nuevo.
3. La pregunta de Luis («¿mi propuesta de herramientas es mala?») no tiene sentido si se eligieron las herramientas. Para esa ruta se añadió a Marta, que pregunta lo mismo por el calendario. Marta no está en el paquete.
4. Las tres respuestas a Luis se redactaron a partir de las plantillas del paquete, con largo parecido.
5. El paquete describe la nota del proveedor y pide «conservar o revaluar»; aquí es una decisión con cuatro rutas, dos defendibles. La ruta «no mirarla siquiera» es nueva.
6. En la tabla de la pizarra, las causas van separadas con comas en vez de punto y coma.
7. Variante: «coherencia evidencia-restricción» (30 puntos) se repartió en una cifra (10 puntos: lo que costaría la pareja más barata) y una justificación escrita (20 puntos). La cifra no está en el paquete.
8. Variante: «renuncia explícita y honesta» (30 puntos) y la justificación de la prioridad (20 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona. No se fija una única iniciativa correcta.
9. Variante: el indicador de revisión se comprueba señalando en el registro los dos datos que miden la asistencia.
10. La regla para pasar la variante (70 de 100) es provisional.

**Avisos del validador.** 50 de 100 puntos de la variante son respuestas escritas: no se califican solas y esperan revisión de una persona; 15 piezas adaptadas y 10 añadidas en la conversión esperan revisión editorial; sin revisión editorial humana.

### EDIT-N1-015 · «Ese correo necesita una decisión, no más palabras»
Liderazgo · Lote 03, paquete 1.2 · `exp.n1.lid.ese-correo-necesita-una-decision` · versión 1. Habilidad principal: `lid.comunicacion` Comunicación ejecutiva. Secundarias: `lid.fundamentos` El papel de quien dirige. Fuentes: INSEAD_CORE, STAN_CORE. Entrada: `/piloto/ese-correo-necesita-una-decision`.
| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |
|---|---|---|---|---|
| La bandeja | `mensaje` | Mensaje de un personaje | → explorar | Texto del paquete |
| Los documentos | `explorar` | Documentos tocables | → hechos | Descrito en el paquete, redactado al convertir |
| Hechos y suposiciones | `hechos` | Clasificar tarjetas en grupos | Separa los hechos de las suposiciones. 5 tarjetas en 2 grupos (Hecho del registro, Suposición). → orden | Descrito en el paquete, redactado al convertir |
| El orden | `orden` | Ordenar una secuencia | Acomoda las tres tarjetas como abrirías el mensaje. No hay un único orden válido. 3 tarjetas; se acepta cualquier orden y se muestra uno de referencia. → borrador | Texto del paquete |
| El borrador | `borrador` | Decisión con rutas | «Armé cuatro versiones cortas. ¿Cuál le mando al gerente?» · rutas (confusión) → peticion; claro (defendible) → peticion; corto (con riesgo) → peticion; promesa (confusión) → peticion | Descrito en el paquete, redactado al convertir |
| La petición | `peticion` | Decisión con rutas | «¿Qué necesitas de mí exactamente?» · concreta (defendible) → contacto; apoyo (con riesgo) → contacto; todos (confusión) → contacto | Texto del paquete |
| Dato nuevo | `contacto` | Dato nuevo | Llegan los datos de contacto de los cinco clientes pendientes. → ajuste | Texto del paquete |
| Dato nuevo | `ajuste` | Decisión con rutas | «Con esto, ¿cambio lo que pedí?» · rehacer (con riesgo) → final; igual (confusión) → final; ajustar (defendible) → final | Descrito en el paquete, redactado al convertir |
| La versión final | `final` | Respuesta escrita | Un texto libre; no se califica, se compara con una referencia. → cierre | Texto del paquete |
| Cierre | `cierre` | Cierre con lo decidido y el concepto | Da paso a la variante. | Añadido al convertir |

Decisiones: 3, con 4, 3, 3 rutas. Todas las combinaciones llegan al cierre.
**Variante.** «¿Qué le escribes a la directora, en cuatro oraciones como máximo?» El equipo de un centro de eventos prepara un fin de semana. La directora necesita información para decidir cuántas mesas preparar. Nadie te explica los datos: lee y responde. Tareas: Mensaje principal y datos correctos: datos (15 puntos, cifra por calcular y escribir); Mensaje principal y datos correctos: mensaje (15 puntos, respuesta escrita); Petición, responsable y plazo (35 puntos, respuesta escrita); No atribuir resultados no confirmados (20 puntos, señalar renglones); Claridad y respeto (15 puntos, respuesta escrita). Se comprueban solos 35 de 100 puntos; 65 esperan revisión de una persona.
**Origen de las piezas.** 10 traen el texto del paquete tal cual; 18 están descritas en el paquete y se redactaron al convertir; 9 se añadieron.
**Por confirmar en la revisión editorial.**
1. El paquete pide resaltar frases que sean hechos o suposiciones; aquí son cinco tarjetas que se asignan tocando. Las dos suposiciones salen del correo de Alejandra y los tres hechos, del registro.
2. Ordenar las tres tarjetas no se califica de forma estricta, como indica el paquete: se acepta cualquier orden y se muestra uno de referencia. Se ordena con botones, no arrastrando.
3. El paquete permite «elaborar un mensaje o escoger entre borradores razonables». Aquí primero se escoge entre cuatro borradores, redactados a partir de las cuatro rutas del paquete, y la redacción propia queda para la versión final.
4. El gerente no tiene nombre en el paquete; aquí aparece como «El gerente». Sus respuestas «¿Tenemos ese dato verificado?» y «¿Quién confirmó que es posible?» son del paquete; las demás son nuevas.
5. Las respuestas «apoyo en lo que sea» y «que lo resuelvan todos» se alargaron para que las tres opciones tengan un largo parecido.
6. El ajuste por el dato nuevo (una llamada y cuatro correos) es una decisión con tres rutas; las rutas «rehacer todo» y «dejarlo como estaba» son nuevas.
7. Las explicaciones al tocar cada frase del correo son nuevas.
8. Variante: el registro no muestra el número de reservas pendientes; se calcula (24 − 19 = 5) y se escribe. El paquete lo da como dato.
9. Variante: el paquete describe «un borrador confuso» sin texto; las cinco frases del borrador se redactaron al convertir.
10. Variante: el paquete pide un solo mensaje de hasta cuatro oraciones evaluado con cuatro criterios. Aquí el mensaje se escribe en tres partes (apertura, petición y cautela), una por criterio, para que cada una se pueda revisar por separado. Suman 65 puntos que no se califican de forma automática: quedan en espera de revisión de una persona.
11. La regla para pasar la variante (70 de 100) es provisional.

**Avisos del validador.** 65 de 100 puntos de la variante son respuestas escritas: no se califican solas y esperan revisión de una persona; 18 piezas adaptadas y 9 añadidas en la conversión esperan revisión editorial; sin revisión editorial humana.

### EDIT-N1-016 · «El tablero está en verde, pero los clientes esperan»
Operaciones · Lote 03, paquete 1.2 · `exp.n1.ope.el-tablero-esta-en-verde` · versión 1. Habilidad principal: `ope.indicadores` Indicadores operativos. Secundarias: `ope.procesos` Procesos. Fuentes: INSEAD_CORE, STAN_CORE. Entrada: `/piloto/el-tablero-esta-en-verde`.
| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |
|---|---|---|---|---|
| La sala | `mensaje` | Mensaje de un personaje | → explorar | Texto del paquete |
| El tablero | `explorar` | Documentos tocables | → tasas | Descrito en el paquete, redactado al convertir |
| Las tasas | `tasas` | Calcular con apoyo | Escribe cada resultado. Puedes usar la calculadora. 6 cifras, con pista por cifra y calculadora. → comparar | Descrito en el paquete, redactado al convertir |
| Qué cambió | `comparar` | Clasificar tarjetas en grupos | Pon cada resultado en su lugar. 4 tarjetas en 3 grupos (Subió, Bajó, No cambió). → indicador | Texto del paquete |
| El indicador | `indicador` | Decisión con rutas | «Entonces, ¿con cuál número sigo el objetivo de servicio?» · volumen (confusión) → evidencia; puntualidad (defendible) → evidencia; horas (confusión) → evidencia | Texto del paquete |
| La evidencia | `evidencia` | Decisión con rutas | «Antes de decir por qué pasó, ¿qué pido?» · horario (defendible) → tarde; personal (confusión) → tarde; comentarios (con riesgo) → tarde | Descrito en el paquete, redactado al convertir |
| Dato nuevo | `tarde` | Dato nuevo | Llega la lista de entregas tardías de la semana 2. → lectura | Texto del paquete |
| Dato nuevo | `lectura` | Decisión con rutas | «Once de quince, en la tarde. ¿Qué le digo al equipo?» · conductor (confusión) → nota; esperar (con riesgo) → nota; concentra (defendible) → nota | Descrito en el paquete, redactado al convertir |
| La nota | `nota` | Respuesta escrita | Un texto libre; no se califica, se compara con una referencia. → cierre | Texto del paquete |
| Cierre | `cierre` | Cierre con lo decidido y el concepto | Da paso a la variante. | Añadido al convertir |

Decisiones: 3, con 3, 3, 3 rutas. Todas las combinaciones llegan al cierre.
**Variante.** «¿El servicio mejoró o empeoró al atender más citas, y qué falta saber?» Una clínica veterinaria atiende citas programadas y compara dos semanas. Nadie te explica los datos: lee, calcula y responde. Tareas: Definición y unidad del indicador (25 puntos, clasificar tarjetas); Cálculo y comparación de puntualidad: semana B (20 puntos, cifra por calcular y escribir); Cálculo y comparación de puntualidad: comparación (15 puntos, clasificar tarjetas); Lectura de la meta de errores: semana B (10 puntos, cifra por calcular y escribir); Lectura de la meta de errores: metas (15 puntos, clasificar tarjetas); Distinguir observación de hipótesis causal (15 puntos, respuesta escrita). Se comprueban solos 85 de 100 puntos; 15 esperan revisión de una persona. Ofrece calculadora.
**Origen de las piezas.** 12 traen el texto del paquete tal cual; 13 están descritas en el paquete y se redactaron al convertir; 7 se añadieron.
**Por confirmar en la revisión editorial.**
1. El paquete da las tasas como «cifras derivadas» y pide no dar la respuesta antes de interactuar. Aquí las seis se calculan y se escriben, con pista y calculadora, antes de comparar.
2. La pregunta «¿qué representa el 85 %?» no es una actividad aparte: la respuesta del paquete se muestra al terminar el cálculo.
3. Subió, bajó o no cambió se asigna tocando, no arrastrando etiquetas.
4. En la decisión del indicador solo la puntualidad es defendible, como pide el paquete: no se añadió una segunda ruta correcta.
5. En la evidencia a pedir, el paquete dice que las tres pueden aportar contexto. Aquí la lista por horario y ruta es la defendible, los comentarios de clientes quedan como ruta con riesgo y el detalle de personal, pedido para confirmar que faltó gente, como concepto erróneo.
6. La lectura del dato nuevo (11 de 15 por la tarde) se convirtió en una decisión con tres rutas; la ruta «esperar otra semana» es nueva.
7. Las explicaciones al tocar cada renglón son nuevas.
8. Variante: no se pide la puntualidad de la semana A ni los errores de la semana A como cifra, porque 90 y 5 están a la vista en las metas. Se piden las de la semana B (82 % y 6 %) y las de la semana A se usan al comparar.
9. Variante: «definición y unidad» y la comparación con las metas se comprueban clasificando; el dato adicional que conviene pedir (15 puntos) es una respuesta escrita que queda en espera de revisión de una persona.
10. La regla para pasar la variante (70 de 100) es provisional.

**Avisos del validador.** 15 de 100 puntos de la variante son respuestas escritas: no se califican solas y esperan revisión de una persona; 13 piezas adaptadas y 7 añadidas en la conversión esperan revisión editorial; sin revisión editorial humana.

### EDIT-N1-017 · «Cobrar más no siempre significa cobrar de más»
Crecimiento · Lote 03, paquete 1.2 · `exp.n1.cre.cobrar-mas-no-es-cobrar-de-mas` · versión 1. Habilidad principal: `cre.precios` Precios y valor percibido. Secundarias: `cre.cliente` Cliente y propuesta de valor. Fuentes: INSEAD_CORE, STAN_CORE. Entrada: `/piloto/cobrar-mas-no-es-cobrar-de-mas`.
| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |
|---|---|---|---|---|
| El chat | `mensaje` | Mensaje de un personaje | → explorar | Texto del paquete |
| Los documentos | `explorar` | Documentos tocables | → diferencia | Descrito en el paquete, redactado al convertir |
| La diferencia | `diferencia` | Calcular con apoyo | Escribe las dos cifras. Puedes usar la calculadora. 2 cifras, con pista por cifra y calculadora. → etiquetas | Texto del paquete |
| Las etiquetas | `etiquetas` | Clasificar tarjetas en grupos | Ponle a cada tarjeta la etiqueta que le corresponde. 5 tarjetas en 5 grupos (Precio, Costo directo, Puede aportar valor al cliente, Diferencia antes de gastos fijos, Utilidad neta). → cliente1 | Texto del paquete |
| El primer cliente | `cliente1` | Decisión con rutas | «El cliente que necesita los planos hoy me pregunta por qué cuesta $20 más. ¿Qué le contesto?» · bajar (con riesgo) → cliente2; valor (defendible) → cliente2; malo (confusión) → cliente2 | Texto del paquete |
| Otro cliente | `cliente2` | Dato nuevo | Llega un segundo cliente. → todos | Texto del paquete |
| Otro cliente | `todos` | Decisión con rutas | «¿Cómo decido si bajamos el precio para todos?» · evidencia (defendible) → frases; barato (confusión) → frases; rapido (confusión) → frases | Texto del paquete |
| Para no confundirlo | `frases` | Respuesta escrita | 3 campos cortos; no se califica, se compara con una referencia. → cierre | Texto del paquete |
| Cierre | `cierre` | Cierre con lo decidido y el concepto | Da paso a la variante. | Añadido al convertir |

Decisiones: 2, con 3, 3 rutas. Todas las combinaciones llegan al cierre.
**Variante.** «¿Qué cobra, qué le cuesta y quién aprecia la rapidez?» Un servicio de mantenimiento de jardines ofrece una visita rápida y la compara con la alternativa del mercado. Nadie te explica los datos: lee, calcula y responde. Tareas: Conceptos y clasificación (35 puntos, clasificar tarjetas); Cálculo y distinción de utilidad neta: diferencia (15 puntos, cifra por calcular y escribir); Cálculo y distinción de utilidad neta: lectura (10 puntos, clasificar tarjetas); Identificación de valor por cliente (30 puntos, respuesta escrita); Cautela sobre conclusiones de demanda (10 puntos, respuesta escrita). Se comprueban solos 60 de 100 puntos; 40 esperan revisión de una persona. Ofrece calculadora.
**Origen de las piezas.** 13 traen el texto del paquete tal cual; 11 están descritas en el paquete y se redactaron al convertir; 5 se añadieron.
**Por confirmar en la revisión editorial.**
1. El paquete da los $70 y los $50 como «cálculo ilustrativo»; aquí se calculan y se escriben antes de etiquetar, con pista y calculadora.
2. Al etiquetar se añadió la tarjeta de la revisión de archivos y la etiqueta «utilidad neta», que no corresponde a ninguna tarjeta: está para que confundir los $70 con ganancia neta sea un error posible, como prevé el paquete.
3. El paquete usa «margen de contribución unitario simplificado»; en pantalla se dice «diferencia antes de gastos fijos», porque el propio paquete indica que el término no se evalúa en este nivel.
4. La conversación con el primer cliente es una decisión con las tres rutas del paquete. El cliente no es un personaje con nombre: sus respuestas aparecen narradas y son nuevas.
5. La llegada del segundo cliente se muestra como dato nuevo; lo que cada cliente valora se recoge en la respuesta escrita final.
6. «¿Cómo decido si bajamos el precio para todos?» es una decisión con tres rutas: pedir evidencia y las dos conclusiones firmes que el paquete pide rechazar.
7. Las explicaciones al tocar las frases de los clientes y dos renglones de la comparación son nuevas.
8. Variante: se añadió el renglón «gastos fijos: no incluidos en los costos directos», que el paquete da por entendido al hablar de «diferencia antes de gastos fijos».
9. Variante: la distinción de utilidad neta (10 puntos) se comprueba clasificando cuatro afirmaciones; el paquete no dice cómo comprobarla.
10. Variante: el valor por cliente (30 puntos) y la cautela sobre la demanda (10 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona.
11. La regla para pasar la variante (70 de 100) es provisional.

**Avisos del validador.** 40 de 100 puntos de la variante son respuestas escritas: no se califican solas y esperan revisión de una persona; 11 piezas adaptadas y 5 añadidas en la conversión esperan revisión editorial; sin revisión editorial humana.

### EDIT-N1-018 · «La misma persona hace todo el pago»
Riesgo y gobierno · Lote 03, paquete 1.2 · `exp.n1.rie.la-misma-persona-hace-todo-el-pago` · versión 1. Habilidad principal: `rie.cumplimiento` Cumplimiento y controles. Secundarias: `rie.etica` Ética y dilemas; `ope.procesos` Procesos. Fuentes: HBS_GOV, INSEAD_CORE. Entrada: `/piloto/la-misma-persona-hace-todo-el-pago`.
| Momento | Nodo | Tipo | Qué pasa y a dónde lleva | Origen |
|---|---|---|---|---|
| El mensaje | `mensaje` | Mensaje de un personaje | → explorar | Texto del paquete |
| Los documentos | `explorar` | Documentos tocables | → puntos | Descrito en el paquete, redactado al convertir |
| Los puntos débiles | `puntos` | Señalar sobre el documento | Toca los dos pasos del procedimiento donde falta que alguien más compruebe antes de que salga el dinero. 2 renglones por encontrar; cada error trae su explicación. → l208 | Texto del paquete |
| La factura | `l208` | Decisión con rutas | «¿Qué hacemos con la factura L-208?» · retener (con riesgo) → llegaron; verificar (defendible) → llegaron; pagar (confusión) → llegaron | Texto del paquete |
| Dato nuevo | `llegaron` | Dato nuevo | Responde quien recibe los materiales. → entrega | Texto del paquete |
| Dato nuevo | `entrega` | Decisión con rutas | «Los materiales sí llegaron. ¿Ya podemos pagar?» · falta (defendible) → controles; listo (confusión) → controles; acusar (confusión) → controles | Descrito en el paquete, redactado al convertir |
| Los controles | `controles` | Clasificar tarjetas en grupos | Di qué debilidad atiende cada propuesta, o si no hace falta en un equipo pequeño. 5 tarjetas en 3 grupos (Atiende: nadie más revisa la autorización, Atiende: nadie verifica el cambio de cuenta, No hace falta en este equipo). → propuesta | Texto del paquete |
| La propuesta | `propuesta` | Respuesta escrita | 3 campos cortos; no se califica, se compara con una referencia. → cierre | Texto del paquete |
| Cierre | `cierre` | Cierre con lo decidido y el concepto | Da paso a la variante. | Añadido al convertir |

Decisiones: 2, con 3, 3 rutas. Todas las combinaciones llegan al cierre.
**Variante.** «¿Qué riesgo hay, qué control cabe y qué evidencia deja?» Una escuela privada pequeña recibe pagos por talleres. La dirección pide un control que pueda aplicar con dos personas. Nadie te explica los datos: lee y responde. Tareas: Identificación de riesgo real sin imputación (30 puntos, clasificar tarjetas); Control proporcional y preventivo o detectivo (35 puntos, respuesta escrita); Evidencia verificable de la revisión (25 puntos, clasificar tarjetas); Comunicación respetuosa y precisa (10 puntos, respuesta escrita). Se comprueban solos 55 de 100 puntos; 45 esperan revisión de una persona.
**Origen de las piezas.** 9 traen el texto del paquete tal cual; 14 están descritas en el paquete y se redactaron al convertir; 6 se añadieron.
**Por confirmar en la revisión editorial.**
1. Los dos puntos vulnerables se señalan sobre el procedimiento: el paso 2 (se registra la cuenta bancaria sin verificación) y el paso 3 (la misma persona autoriza). Los pasos 4 y 5 también muestran debilidades; conviene revisar si se aceptan como respuesta. Las explicaciones al tocar un paso distinto son nuevas.
2. La definición de segregación de funciones, que el paquete da como tarjeta contextual, se muestra como texto de la actividad de señalar.
3. Quien elige retener todos los pagos o pagar primero ve su consecuencia y después Rocío revisa solo la L-208, para que el dato nuevo (los materiales sí llegaron) tenga sentido en las tres rutas.
4. El dato nuevo se convirtió en una decisión con tres rutas. La ruta que señala a la auxiliar se redactó a partir de la retroalimentación del paquete para quien acusa sin pruebas.
5. Colocar dos tarjetas de control sobre el diagrama se convirtió en clasificar cinco propuestas según la debilidad que atienden. Se añadieron la aprobación por lotes del propietario (del propio paquete), el auditor permanente y el sistema costoso (de las notas de QA) como propuestas que no hacen falta.
6. Las explicaciones al tocar cada paso del procedimiento y cuatro renglones de la factura son nuevas.
7. El tercer objetivo del paquete habla de distinguir el riesgo de una acusación; aquí se redactó como «riesgo de error o abuso», con las palabras de la microteoría.
8. Variante: el cuaderno donde la escuela anota sus ingresos aparece como «registro contable».
9. Ni los documentos, ni las rutas, ni la variante afirman que la factura sea falsa o que alguien actuó con mala intención; la única ruta que lo insinúa está marcada como concepto erróneo.
10. Variante: la identificación del riesgo sin imputación y la evidencia verificable se comprueban clasificando; las afirmaciones se redactaron al convertir.
11. Variante: el control propuesto (35 puntos) y la comunicación respetuosa (10 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona.
12. La regla para pasar la variante (70 de 100) es provisional.

**Avisos del validador.** el gancho tiene 37 palabras; el contrato editorial pide de 15 a 35 y se dejó el texto del paquete; 45 de 100 puntos de la variante son respuestas escritas: no se califican solas y esperan revisión de una persona; 14 piezas adaptadas y 6 añadidas en la conversión esperan revisión editorial; sin revisión editorial humana.

## 10. Qué comprueban las pruebas automáticas
Para cada experiencia convertida:
1. Cumple el contrato sin errores y coincide con la ficha de su lote: habilidades, fuentes, título y pesos de la rúbrica.
2. Tres recorridos: quien sabe (rutas defendibles y actividades resueltas a la primera), quien empieza (cae en las confusiones, falla las actividades y pide ver la solución) y recorridos al azar. Todos terminan en el cierre.
3. Todas las combinaciones de rutas llegan al cierre.
4. Elegir siempre la opción más larga no lleva por todas las rutas defendibles.
5. Las igualdades que se muestran (documentos, cálculos del cierre, pistas, variante) se recalculan, y las identidades numéricas que cada paquete lista en sus notas de QA son pruebas.
6. En la variante: la respuesta nunca está a la vista, no aparecen personajes de la práctica ni explicaciones, quien responde bien obtiene todos los puntos comprobables, y responder al azar casi nunca los obtiene.
7. Lo escrito es opcional, no cambia los puntos comprobables y deja su peso en espera de revisión.
8. Un recorrido guardado en cualquier paso se retoma donde iba; un resultado alterado a mano se vuelve a calcular; un recorrido guardado con el formato anterior se conserva.
9. El motor, el contenido y las pantallas no usan el registro de evidencias, el cálculo de dominio, la partida ni ningún servicio.

## 11. Observaciones editoriales de los paquetes
1. **EDIT-N1-002, advertencia de exactitud.** El lote 01 habla de un sobregiro de $10,000 utilizado y caja libre de $0. La tabla y los cálculos dan saldo final de $5,000 y faltante de $7,000. Las notas de QA del lote 03 confirman la discrepancia y piden corregir el texto antes de publicar. La experiencia convertida sigue la tabla desde el principio: muestra saldo final de $5,000 y no menciona el sobregiro.
2. **EDIT-N1-002, variante.** Dice «con cifras distintas», pero repite $5,000, $25,000, $45,000. Quien conteste de memoria con las cifras de la práctica acierta dos de tres criterios (70 puntos) y, con la regla provisional, pasa. Se sugiere cambiar el efectivo inicial o los cobros de la variante.
3. **EDIT-N1-002, criterio «diferencias ingreso/cobro».** El paquete le da 35 % pero la pregunta de la variante («¿Ganó dinero y qué saldo le queda?») solo pide utilidad y saldo. La experiencia lo comprueba pidiendo cuánto sigue sin cobrarse.
4. **EDIT-N1-001, título.** «¿Nueve tareas o una estrategia?» presenta seis frases, no nueve.
5. **EDIT-N1-001, línea 34.** Usa una frase que la aplicación tiene vetada en sus textos; habrá que redactarla de otra forma al convertir.
6. **Estándar, tiempos mínimos.** Todavía menciona tiempos mínimos de respuesta como hipótesis del motor. Las reglas vigentes (versión 2) ya no descartan nada por rapidez.
7. **Papel de quien juega.** En todas las experiencias es asesor, colega o invitado, nunca dueño. La aplicación actual lo trata como director de una empresa. Conviene decidir cómo conviven los dos papeles.
8. **EDIT-N1-008, variante.** Repite cifras de la práctica: $30,000, $48,000. Son las cifras que el paquete indica; conviene revisar si se quieren distintas.

## 12. Estado, por separado
| Etapa | Qué hay |
|---|---|
| Importado | Correspondencia de 52 identificadores; registro de 16 fuentes; ficha de las 18 experiencias de los tres lotes; 12 experiencias completas como contenido jugable: EDIT-N1-002, EDIT-N1-007, EDIT-N1-008, EDIT-N1-009, EDIT-N1-010, EDIT-N1-011, EDIT-N1-012, EDIT-N1-013, EDIT-N1-015, EDIT-N1-016, EDIT-N1-017, EDIT-N1-018 |
| Probado | Las 12 experiencias convertidas: pruebas automáticas. Recorrido completo en un navegador, a tamaño de computadora (1280 × 800) y de celular (390 × 844), guiado por un programa |
| Revisado por una persona | Nada. Falta la revisión de Oziel y la revisión editorial |
| Publicado | Nada para usuarios. Las experiencias están en producción solo por enlace, marcadas como revisión |
| Validado con usuarios | Nada |

## 13. Lo que no se hizo
No se han convertido 6 experiencias: EDIT-N1-001, EDIT-N1-003, EDIT-N1-004, EDIT-N1-005, EDIT-N1-006, EDIT-N1-014. No se convirtió el Executive Challenge. No se conectó nada al registro de evidencias ni al cálculo de dominio. No se creó ninguna tabla en la base de datos. Nadie ha revisado las respuestas escritas: no hay pantalla de revisión. No se probó con lector de pantalla ni en un teléfono físico. No se comparó cada habilidad con el temario de cada curso. No se calibró ninguna rúbrica.
