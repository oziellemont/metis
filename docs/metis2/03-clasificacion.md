# MÊTIS 2.0 · Clasificación del contenido existente y cobertura

Versión de la clasificación: 1

Este documento se genera del contenido real de la aplicación y de su clasificación (`app/src/lib/ceo/metis2`). No se edita a mano: una prueba automática falla si deja de coincidir.

## Qué se hizo

Cada pieza del simulador de empresas recibió una etiqueta con el catálogo nuevo: una academia principal, hasta dos academias secundarias, de una a tres habilidades y el nivel de exigencia con el que está escrita. Los identificadores no cambian y nada se borra.

El nivel de una pieza es la exigencia que tiene tal como está escrita hoy. No es una decisión de dónde va a quedar en la ruta: eso se define al construir cada nivel.

Las lecciones y los conceptos son teoría. Quedan clasificados para saber qué explican, pero no cuentan como evidencia de dominio.

## Cómo se clasificó y qué límites tiene

La etiqueta de cada pieza se asignó a partir de su título, la pregunta que hace, la lección con la que está ligada y las áreas con las que se escribió. Es un criterio editorial: una prueba automática comprueba que cada etiqueta sea válida y compatible con las áreas originales, pero no puede comprobar que sea la mejor. Conviene revisar una muestra por academia antes de usar estas etiquetas para calcular dominio.

Los casos de Kúbit, Punto Madero y Vértice comparten estructura con los de Forja Norte (la misma situación en otra industria), por eso muchas de sus etiquetas coinciden.

## Resumen por tipo de pieza

| Tipo | Piezas | Clasificadas | Formato en el programa nuevo | Cuenta como evidencia |
|---|---|---|---|---|
| Lecciones de Academy | 25 | 25 | Lección | No |
| Conceptos | 51 | 51 | Lección | No |
| Diagnóstico inicial | 3 | 3 | Caso breve | Sí |
| Dilemas de personas | 49 | 49 | Caso breve | Sí |
| Casos de las seis empresas | 144 | 144 | Caso aplicado | Sí |
| Banco de decisiones | 28 | 28 | Caso aplicado | Sí |
| Casos conversacionales | 17 | 17 | Interacción inmersiva | Sí |
| Simulador de cambio | 1 | 1 | Interacción inmersiva | Sí |
| Casos de crecimiento | 14 | 14 | Caso encadenado | Sí |
| Crisis de caja | 3 | 3 | Caso encadenado | Sí |

Total: 259 actividades evaluables y 76 piezas de teoría.

Notas: los dilemas se cuentan una vez por situación (cada uno tiene dos redacciones guardadas). Las 9 palancas forman un solo ejercicio. Cada situación del banco de decisiones está escrita para 7 industrias con tres variantes.

## Actividades evaluables por academia y nivel

Cada actividad se cuenta en su academia principal.

| Academia | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 | Nivel 5 | Nivel 6+ | Total |
|---|---|---|---|---|---|---|---|
| Estrategia | 0 | 0 | 10 | 8 | 0 | 0 | 18 |
| Finanzas | 0 | 0 | 10 | 15 | 0 | 0 | 25 |
| Liderazgo | 0 | 28 | 86 | 3 | 0 | 0 | 117 |
| Operaciones | 0 | 1 | 34 | 2 | 0 | 0 | 37 |
| Crecimiento | 0 | 1 | 10 | 8 | 0 | 0 | 19 |
| Riesgo y gobierno | 0 | 2 | 31 | 10 | 0 | 0 | 43 |
| **Total** | 0 | 32 | 181 | 46 | 0 | 0 | 259 |

## Teoría por academia y nivel

| Academia | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 | Nivel 5 | Nivel 6+ | Total |
|---|---|---|---|---|---|---|---|
| Estrategia | 1 | 8 | 0 | 1 | 0 | 0 | 10 |
| Finanzas | 0 | 3 | 4 | 0 | 0 | 0 | 7 |
| Liderazgo | 4 | 17 | 13 | 0 | 0 | 0 | 34 |
| Operaciones | 1 | 3 | 1 | 0 | 0 | 0 | 5 |
| Crecimiento | 0 | 7 | 1 | 1 | 0 | 0 | 9 |
| Riesgo y gobierno | 0 | 3 | 8 | 0 | 0 | 0 | 11 |
| **Total** | 6 | 41 | 27 | 2 | 0 | 0 | 76 |

## Cuánto del programa queda cubierto

El currículo tiene 268 casillas: cada habilidad en cada nivel donde se exige. Una casilla se cuenta como cubierta si existe al menos una actividad evaluable de ese nivel que trabaje esa habilidad. Es una medida mínima: una sola actividad no alcanza para demostrar dominio.

| Nivel | Casillas | Con al menos una actividad | Sin actividad |
|---|---|---|---|
| 1 · Reconocer | 24 | 0 | 24 |
| 2 · Aplicar | 39 | 15 | 24 |
| 3 · Analizar | 49 | 42 | 7 |
| 4 · Integrar | 52 | 35 | 17 |
| 5 · Transferir | 52 | 0 | 52 |
| 6 y siguientes · Dirigir y profundizar | 52 | 0 | 52 |
| **Total** | 268 | 92 | 176 |

## Habilidades por academia

### Estrategia

| Habilidad | Se exige desde | Actividades como principal | Actividades donde aparece | Niveles con actividad | Teoría |
|---|---|---|---|---|---|
| Lenguaje de la estrategia | Nivel 1 | 0 | 0 | Ninguno | 0 |
| Diagnóstico de la situación | Nivel 2 | 0 | 8 | 2, 3 | 2 |
| Ventaja competitiva y posicionamiento | Nivel 1 | 3 | 8 | 3, 4 | 3 |
| Priorización y renuncias | Nivel 1 | 3 | 9 | 3 | 6 |
| De la estrategia a metas e indicadores | Nivel 1 | 6 | 8 | 3, 4 | 5 |
| Asignación de recursos | Nivel 3 | 0 | 3 | 3, 4 | 2 |
| Escenarios y efectos de segundo orden | Nivel 3 | 0 | 3 | 4 | 1 |
| Portafolio, disrupción y decisiones irreversibles | Nivel 4 | 6 | 6 | 4 | 1 |

### Finanzas

| Habilidad | Se exige desde | Actividades como principal | Actividades donde aparece | Niveles con actividad | Teoría |
|---|---|---|---|---|---|
| Vocabulario financiero | Nivel 1 | 0 | 0 | Ninguno | 1 |
| Estado de resultados y márgenes | Nivel 1 | 0 | 8 | 3, 4 | 0 |
| Balance general | Nivel 1 | 0 | 0 | Ninguno | 0 |
| Flujo de efectivo | Nivel 1 | 0 | 5 | 3, 4 | 2 |
| Presupuesto y variaciones | Nivel 1 | 0 | 8 | 3 | 0 |
| Costos, contribución y punto de equilibrio | Nivel 2 | 7 | 21 | 3, 4 | 2 |
| Capital de trabajo | Nivel 2 | 4 | 9 | 2, 3, 4 | 2 |
| Valor del dinero y evaluación de inversiones | Nivel 3 | 3 | 12 | 3, 4 | 2 |
| Deuda, capital y financiamiento | Nivel 3 | 11 | 12 | 3, 4 | 3 |
| Asignación de capital y valuación | Nivel 4 | 0 | 4 | 4 | 0 |

### Liderazgo

| Habilidad | Se exige desde | Actividades como principal | Actividades donde aparece | Niveles con actividad | Teoría |
|---|---|---|---|---|---|
| El papel de quien dirige | Nivel 1 | 7 | 10 | 2, 3, 4 | 3 |
| Comunicación ejecutiva | Nivel 1 | 16 | 33 | 2, 3, 4 | 8 |
| Retroalimentación y conversaciones difíciles | Nivel 1 | 13 | 22 | 2, 3 | 2 |
| Delegación y seguimiento | Nivel 1 | 7 | 8 | 2, 3 | 3 |
| Motivación, desarrollo de personas y sucesión | Nivel 2 | 32 | 49 | 2, 3, 4 | 8 |
| Equipos, conflicto y convivencia | Nivel 2 | 7 | 19 | 2, 3 | 4 |
| Negociación | Nivel 2 | 27 | 45 | 2, 3, 4 | 7 |
| Influencia y coaliciones | Nivel 3 | 1 | 2 | 3 | 1 |
| Cultura y cambio | Nivel 3 | 7 | 30 | 3, 4 | 9 |

### Operaciones

| Habilidad | Se exige desde | Actividades como principal | Actividades donde aparece | Niveles con actividad | Teoría |
|---|---|---|---|---|---|
| Procesos | Nivel 1 | 3 | 7 | 3, 4 | 1 |
| Indicadores operativos | Nivel 1 | 1 | 3 | 3 | 3 |
| Calidad | Nivel 1 | 7 | 17 | 3, 4 | 1 |
| Capacidad y cuellos de botella | Nivel 1 | 9 | 22 | 3, 4 | 0 |
| Productividad y merma | Nivel 2 | 2 | 7 | 3, 4 | 0 |
| Inventarios y cadena de suministro | Nivel 2 | 9 | 14 | 3 | 1 |
| Ejecución y seguimiento | Nivel 2 | 2 | 3 | 2, 3, 4 | 1 |
| Mejora continua y transformación | Nivel 3 | 4 | 4 | 3 | 1 |

### Crecimiento

| Habilidad | Se exige desde | Actividades como principal | Actividades donde aparece | Niveles con actividad | Teoría |
|---|---|---|---|---|---|
| Cliente y propuesta de valor | Nivel 1 | 0 | 9 | 2, 3, 4 | 2 |
| Segmentación y mercado objetivo | Nivel 1 | 0 | 0 | Ninguno | 0 |
| Precios y valor percibido | Nivel 1 | 6 | 15 | 3, 4 | 2 |
| Canales y ventas | Nivel 1 | 2 | 9 | 3, 4 | 1 |
| Marketing y adquisición de clientes | Nivel 2 | 0 | 0 | Ninguno | 0 |
| Retención y valor del cliente | Nivel 2 | 2 | 20 | 2, 3, 4 | 1 |
| Producto e innovación | Nivel 2 | 3 | 8 | 3, 4 | 6 |
| Modelo de negocio y economía unitaria | Nivel 3 | 0 | 0 | Ninguno | 0 |
| Expansión | Nivel 4 | 6 | 7 | 4 | 1 |

### Riesgo y gobierno

| Habilidad | Se exige desde | Actividades como principal | Actividades donde aparece | Niveles con actividad | Teoría |
|---|---|---|---|---|---|
| Lenguaje del riesgo | Nivel 1 | 0 | 9 | 3, 4 | 3 |
| Ética y dilemas | Nivel 1 | 13 | 36 | 2, 3, 4 | 5 |
| Cumplimiento y controles | Nivel 1 | 8 | 12 | 2, 3, 4 | 1 |
| Decidir con incertidumbre | Nivel 2 | 2 | 5 | 3, 4 | 5 |
| Entorno económico y político | Nivel 2 | 0 | 1 | 3 | 0 |
| Partes interesadas | Nivel 2 | 0 | 9 | 2, 3, 4 | 1 |
| Crisis y reputación | Nivel 3 | 17 | 20 | 3, 4 | 3 |
| Gobierno corporativo | Nivel 3 | 3 | 25 | 3, 4 | 5 |

Habilidades sin ninguna actividad evaluable (6): Lenguaje de la estrategia; Vocabulario financiero; Balance general; Segmentación y mercado objetivo; Marketing y adquisición de clientes; Modelo de negocio y economía unitaria.

Habilidades sin teoría (11): Lenguaje de la estrategia; Estado de resultados y márgenes; Balance general; Presupuesto y variaciones; Asignación de capital y valuación; Capacidad y cuellos de botella; Productividad y merma; Segmentación y mercado objetivo; Marketing y adquisición de clientes; Modelo de negocio y economía unitaria; Entorno económico y político.

## Qué significa

1. El contenido existente vive en los niveles 2, 3 y 4. Hay 0 actividades de Nivel 1, 0 de Nivel 5 y 0 de Nivel 6. Los casos actuales piden decidir con criterio, no reconocer conceptos, y ninguno fue escrito como prueba de transferencia.
2. El reparto entre academias es desigual: Liderazgo 117, Riesgo y gobierno 43, Operaciones 37, Finanzas 25, Crecimiento 19, Estrategia 18.
3. De las 268 casillas del currículo, 92 tienen al menos una actividad y 176 no tienen ninguna.
4. Por eso el programa no se obtiene reclasificando. Hay que construir: las lecciones y ejercicios de fundamentos del Nivel 1 en las seis academias, las actividades de las habilidades que hoy no tienen ninguna, los repasos de transferencia del Nivel 5 y los retos integradores del Nivel 6.
5. Lo que sí se aprovecha: los casos existentes sirven para los niveles 2 a 4, y el banco de decisiones ya está escrito para 7 industrias, lo que da material para los repasos de transferencia sin partir de cero.

## Detalle por tipo

### Lecciones de Academy

Teoría breve con preguntas de comprensión.

| Identificador | Pieza | Academia | Habilidad principal | También trabaja | Nivel |
|---|---|---|---|---|---|
| `mentalidad` | La mentalidad del CEO | Liderazgo | El papel de quien dirige |  | 1 |
| `personas` | Liderar personas, no puestos | Liderazgo | Motivación, desarrollo de personas y sucesión | Delegación y seguimiento | 2 |
| `equipos` | Equipos de alto desempeño | Liderazgo | Equipos, conflicto y convivencia |  | 2 |
| `alineacion` | Alineación: de la estrategia al scorecard | Estrategia | De la estrategia a metas e indicadores | Indicadores operativos (Operaciones) | 2 |
| `negociacion` | Negociar como CEO | Liderazgo | Negociación |  | 2 |
| `comunicacion` | Comunicación ejecutiva | Liderazgo | Comunicación ejecutiva |  | 1 |
| `cultura` | Cultura, ética y walk the talk | Liderazgo | Cultura y cambio | Ética y dilemas (Riesgo) | 3 |
| `finanzas` | Finanzas: el CEO asigna capital | Finanzas | Valor del dinero y evaluación de inversiones | Deuda, capital y financiamiento | 3 |
| `innovacion` | Innovación y pilotos | Crecimiento | Producto e innovación | Decidir con incertidumbre (Riesgo) | 2 |
| `estrategia` | Visión y estrategia | Estrategia | Ventaja competitiva y posicionamiento | Priorización y renuncias | 2 |
| `mentalidad-2` | Tus primeros 90 días | Liderazgo | El papel de quien dirige | Diagnóstico de la situación (Estrategia) | 2 |
| `personas-2` | Delegar sin abandonar | Liderazgo | Delegación y seguimiento |  | 2 |
| `personas-3` | Formar a tu sucesor | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 3 |
| `conversaciones` | Retroalimentación que se escucha | Liderazgo | Retroalimentación y conversaciones difíciles |  | 1 |
| `conversaciones-2` | Conversaciones difíciles | Liderazgo | Retroalimentación y conversaciones difíciles |  | 2 |
| `equipos-2` | Juntas que deciden | Liderazgo | Equipos, conflicto y convivencia | Ejecución y seguimiento (Operaciones) | 2 |
| `alineacion-2` | Indicadores que guían | Operaciones | Indicadores operativos | De la estrategia a metas e indicadores (Estrategia) | 2 |
| `negociacion-2` | Negociar dentro de la empresa | Liderazgo | Negociación | Influencia y coaliciones | 3 |
| `comunicacion-2` | Dar malas noticias | Liderazgo | Comunicación ejecutiva |  | 2 |
| `cultura-2` | Cuando el que falla es tu estrella | Liderazgo | Cultura y cambio | Ética y dilemas (Riesgo) | 3 |
| `finanzas-2` | La empresa vive de caja | Finanzas | Capital de trabajo | Flujo de efectivo | 2 |
| `innovacion-2` | Matar proyectos a tiempo | Crecimiento | Producto e innovación | Asignación de recursos (Estrategia) | 3 |
| `estrategia-2` | Decir que no | Estrategia | Priorización y renuncias |  | 2 |
| `crisis` | Las primeras 24 horas de una crisis | Riesgo | Crisis y reputación | Comunicación ejecutiva (Liderazgo) | 3 |
| `consejo` | Trabajar con tu consejo | Riesgo | Gobierno corporativo | Comunicación ejecutiva (Liderazgo) | 3 |

### Conceptos

Definiciones de la biblioteca.

| Identificador | Pieza | Academia | Habilidad principal | También trabaja | Nivel |
|---|---|---|---|---|---|
| `costo_oportunidad` | Costo de oportunidad | Estrategia | Priorización y renuncias | Vocabulario financiero (Finanzas) | 1 |
| `liquidez` | Liquidez y capital de trabajo | Finanzas | Flujo de efectivo | Capital de trabajo | 2 |
| `apalancamiento` | Apalancamiento financiero | Finanzas | Deuda, capital y financiamiento |  | 3 |
| `etapas` | Inversión por etapas | Finanzas | Valor del dinero y evaluación de inversiones | Decidir con incertidumbre (Riesgo) | 3 |
| `estructura_capital` | Estructura de capital: deuda o capital | Finanzas | Deuda, capital y financiamiento |  | 3 |
| `concentracion` | Concentración de clientes | Riesgo | Lenguaje del riesgo | Negociación (Liderazgo) | 2 |
| `batna` | BATNA: tu mejor alternativa sin acuerdo | Liderazgo | Negociación |  | 2 |
| `intereses` | Intereses, no posiciones | Liderazgo | Negociación |  | 2 |
| `integrativa` | Negociación integrativa | Liderazgo | Negociación |  | 2 |
| `juego_repetido` | Juego repetido y reputación | Liderazgo | Negociación | Partes interesadas (Riesgo) | 3 |
| `piramide` | Principio de la pirámide | Liderazgo | Comunicación ejecutiva |  | 1 |
| `visibilidad` | Desarrollar dando visibilidad | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `seguridad_psicologica` | Seguridad psicológica | Liderazgo | Equipos, conflicto y convivencia |  | 2 |
| `goodhart` | Diseño de incentivos (ley de Goodhart) | Operaciones | Indicadores operativos | De la estrategia a metas e indicadores (Estrategia) | 2 |
| `cascada` | Despliegue de objetivos en cascada | Estrategia | De la estrategia a metas e indicadores |  | 2 |
| `silos` | Optimización local contra global | Estrategia | De la estrategia a metas e indicadores | Equipos, conflicto y convivencia (Liderazgo) | 2 |
| `piloto` | Experimento controlado | Crecimiento | Producto e innovación | Decidir con incertidumbre (Riesgo) | 2 |
| `premortem` | Premortem | Riesgo | Decidir con incertidumbre | Escenarios y efectos de segundo orden (Estrategia) | 3 |
| `innovador` | Dilema del innovador | Estrategia | Portafolio, disrupción y decisiones irreversibles | Producto e innovación (Crecimiento) | 4 |
| `calidad_fuente` | Calidad en la fuente | Operaciones | Calidad |  | 1 |
| `cultura_justa` | Cultura justa | Liderazgo | Cultura y cambio | Ética y dilemas (Riesgo) | 3 |
| `debido_proceso` | Debido proceso | Riesgo | Cumplimiento y controles | Ética y dilemas | 2 |
| `tolera` | La cultura es lo que se tolera | Liderazgo | Cultura y cambio | Ética y dilemas (Riesgo) | 3 |
| `rituales` | Cambio cultural por comportamientos | Liderazgo | Cultura y cambio |  | 3 |
| `diagnostico` | Diagnóstico antes de prescribir | Estrategia | Diagnóstico de la situación | El papel de quien dirige (Liderazgo) | 2 |
| `crisis_com` | Comunicación de crisis | Riesgo | Crisis y reputación | Comunicación ejecutiva (Liderazgo) | 3 |
| `irreversible` | Decisiones reversibles e irreversibles | Riesgo | Decidir con incertidumbre |  | 2 |
| `respuesta_incidentes` | Respuesta a incidentes | Riesgo | Crisis y reputación |  | 3 |
| `proveedor_unico` | Riesgo de proveedor único | Operaciones | Inventarios y cadena de suministro | Lenguaje del riesgo (Riesgo) | 2 |
| `hundidos` | Costos hundidos | Finanzas | Costos, contribución y punto de equilibrio | Priorización y renuncias (Estrategia) | 2 |
| `menu` | Ingeniería de menú | Crecimiento | Producto e innovación | Costos, contribución y punto de equilibrio (Finanzas) | 2 |
| `pareto` | Análisis de portafolio (80/20) | Estrategia | Priorización y renuncias | Producto e innovación (Crecimiento) | 2 |
| `guerra_precios` | Guerra de precios | Crecimiento | Precios y valor percibido | Ventaja competitiva y posicionamiento (Estrategia) | 2 |
| `elasticidad` | Elasticidad precio | Crecimiento | Precios y valor percibido |  | 2 |
| `cortoplacismo` | Cortoplacismo | Riesgo | Gobierno corporativo | Asignación de recursos (Estrategia) | 3 |
| `protocolo_familiar` | Gobierno corporativo en empresa familiar | Riesgo | Gobierno corporativo |  | 3 |
| `sucesion` | Planeación de sucesión | Liderazgo | Motivación, desarrollo de personas y sucesión | Gobierno corporativo (Riesgo) | 3 |
| `talento_interno` | Desarrollo interno de talento | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `mentoria` | Curva de aprendizaje y mentoría | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `motivacion` | Motivación más allá del dinero | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `equidad` | Equidad interna | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `adaptativo` | Problemas técnicos y adaptativos | Liderazgo | Cultura y cambio | Delegación y seguimiento | 3 |
| `escalar_mejora` | Escalar una mejora | Operaciones | Mejora continua y transformación |  | 3 |
| `recorte_unico` | Recortes: una sola vez y bien | Liderazgo | Comunicación ejecutiva | Cultura y cambio | 3 |
| `expectativas` | Gestión de expectativas | Crecimiento | Retención y valor del cliente | Cliente y propuesta de valor | 2 |
| `plataformas` | Dependencia de plataformas | Crecimiento | Canales y ventas | Lenguaje del riesgo (Riesgo) | 2 |
| `escalar_sistema` | Escalar con sistema | Crecimiento | Expansión | Procesos (Operaciones) | 4 |
| `consejo_gob` | Relación con el consejo | Riesgo | Gobierno corporativo |  | 3 |
| `comunicacion_cambio` | Comunicar la incertidumbre | Liderazgo | Comunicación ejecutiva | Cultura y cambio | 3 |
| `estrategia_elegir` | Estrategia es elegir | Estrategia | Priorización y renuncias | Ventaja competitiva y posicionamiento | 2 |
| `aversion_perdida` | Aversión a la pérdida | Liderazgo | Cultura y cambio | Cliente y propuesta de valor (Crecimiento) | 3 |

### Diagnóstico inicial

Tres casos cortos al entrar.

| Identificador | Pieza | Academia | Habilidad principal | También trabaja | Nivel |
|---|---|---|---|---|---|
| `d1-politica` | Tu mejor vendedor cerró el trimestre con descuentos fuera de política | Riesgo | Cumplimiento y controles | Ética y dilemas | 2 |
| `d1-credito` | Tu cliente más grande pide pasar de 30 a 90 días de crédito | Liderazgo | Negociación | Capital de trabajo (Finanzas) | 2 |
| `d1-retrasos` | Tres semanas de entregas tarde y cada área culpa a otra | Operaciones | Ejecución y seguimiento | Equipos, conflicto y convivencia (Liderazgo) | 2 |

### Dilemas de personas

Situaciones cortas con una persona del equipo.

| Identificador | Pieza | Academia | Habilidad principal | También trabaja | Nivel |
|---|---|---|---|---|---|
| `n1` | Ana · analista, 2 semanas en la empresa | Liderazgo | Retroalimentación y conversaciones difíciles | Motivación, desarrollo de personas y sucesión | 2 |
| `n2` | Rodrigo · gerente de planta, contratado de fuera hace un mes | Liderazgo | Equipos, conflicto y convivencia | El papel de quien dirige | 2 |
| `n3` | Laura · directora comercial, llegó hace 45 días | Liderazgo | Motivación, desarrollo de personas y sucesión | Cultura y cambio | 3 |
| `n4` | Diego · ingeniero, 3 meses, empezó brillante | Liderazgo | Retroalimentación y conversaciones difíciles | Motivación, desarrollo de personas y sucesión | 2 |
| `n5` | Mónica · nueva directora de finanzas, viene de una multinacional | Riesgo | Cumplimiento y controles | Equipos, conflicto y convivencia (Liderazgo); Procesos (Operaciones) | 3 |
| `v1` | Don Ernesto · jefe de almacén, 28 años en la empresa | Liderazgo | Cultura y cambio | Motivación, desarrollo de personas y sucesión | 3 |
| `v2` | Patricia · gerente de compras, 15 años | Liderazgo | Retroalimentación y conversaciones difíciles |  | 3 |
| `v3` | Arturo · director de operaciones, 20 años, amigo del fundador | Liderazgo | Equipos, conflicto y convivencia | Retroalimentación y conversaciones difíciles | 3 |
| `v4` | Lupita · coordinadora administrativa, 18 años, excelente | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `v5` | Ingeniero Salas · jefe de mantenimiento, 30 años, se jubila en 18 meses | Liderazgo | Motivación, desarrollo de personas y sucesión | Lenguaje del riesgo (Riesgo) | 3 |
| `e1` | Héctor · el vendedor #1, 30% de las ventas | Liderazgo | Cultura y cambio | Retroalimentación y conversaciones difíciles | 3 |
| `e2` | Sofía · tu mejor gerente, 4 años | Liderazgo | Delegación y seguimiento | Motivación, desarrollo de personas y sucesión | 3 |
| `e3` | Iván · programador estrella | Liderazgo | Retroalimentación y conversaciones difíciles | Cultura y cambio | 3 |
| `e4` | Valeria · directora de marketing, la mejor del sector | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 3 |
| `e5` | Raúl · director comercial, el más rentable del grupo | Riesgo | Ética y dilemas | Cultura y cambio (Liderazgo) | 4 |
| `d1` | Jorge · supervisor de turno, 2 años | Liderazgo | Retroalimentación y conversaciones difíciles |  | 2 |
| `d2` | Carmen · gerente de servicio, 6 años | Liderazgo | Retroalimentación y conversaciones difíciles |  | 3 |
| `d3` | Fernando · gerente regional, 3 planes de mejora en 2 años | Liderazgo | Retroalimentación y conversaciones difíciles | Motivación, desarrollo de personas y sucesión | 3 |
| `d4` | Paola · analista, capaz pero insegura | Liderazgo | Motivación, desarrollo de personas y sucesión | Delegación y seguimiento | 2 |
| `d5` | Óscar · gerente de producción | Liderazgo | Equipos, conflicto y convivencia | Productividad y merma (Operaciones) | 3 |
| `q1` | Beatriz · gerente de contabilidad | Liderazgo | Delegación y seguimiento | Retroalimentación y conversaciones difíciles | 2 |
| `q2` | Marco · director de logística | Liderazgo | Retroalimentación y conversaciones difíciles | Equipos, conflicto y convivencia | 3 |
| `q3` | Elena · supervisora | Liderazgo | Equipos, conflicto y convivencia | Ética y dilemas (Riesgo) | 2 |
| `q4` | Ricardo · director de una unidad de negocio | Liderazgo | Equipos, conflicto y convivencia | Ética y dilemas (Riesgo) | 3 |
| `q5` | Gabriel · gerente, ascendido hace 4 meses desde su mismo equipo | Liderazgo | El papel de quien dirige | Equipos, conflicto y convivencia | 3 |
| `c1` | Alberto · jefe de producción | Riesgo | Ética y dilemas | Cumplimiento y controles | 2 |
| `c2` | Alberto · el mismo caso, ya investigado | Riesgo | Ética y dilemas | Retroalimentación y conversaciones difíciles (Liderazgo) | 3 |
| `c3` | Ingeniero Ruiz · director de planta | Riesgo | Cumplimiento y controles | Ética y dilemas | 3 |
| `c4` | Tere · ejecutiva de cuenta | Liderazgo | Retroalimentación y conversaciones difíciles | Partes interesadas (Riesgo) | 2 |
| `c5` | Samuel · gerente de ventas | Riesgo | Ética y dilemas | Cliente y propuesta de valor (Crecimiento) | 3 |
| `g1` | Andrea · gerente de proyectos | Liderazgo | Delegación y seguimiento |  | 2 |
| `g2` | Manuel · director de ingeniería | Liderazgo | Delegación y seguimiento | Retroalimentación y conversaciones difíciles | 3 |
| `g3` | Tú mismo | Liderazgo | Delegación y seguimiento | El papel de quien dirige | 3 |
| `g4` | Pilar · gerente de calidad, experta | Liderazgo | Delegación y seguimiento | Cumplimiento y controles (Riesgo) | 3 |
| `a1` | Dos candidatos para gerente de ventas | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 3 |
| `a2` | Javier · coordinador, 3 años | Liderazgo | Retroalimentación y conversaciones difíciles | Motivación, desarrollo de personas y sucesión | 3 |
| `a3` | Natalia · gerente, ascendida hace 6 meses | Liderazgo | Motivación, desarrollo de personas y sucesión | Retroalimentación y conversaciones difíciles | 3 |
| `k1` | Lucía (Finanzas) y Héctor (Ventas) | Liderazgo | Negociación | Capital de trabajo (Finanzas) | 2 |
| `k2` | Dos gerentes que compiten por el mismo puesto futuro | Liderazgo | Equipos, conflicto y convivencia |  | 3 |
| `k3` | Tu director de operaciones y tu director comercial | Liderazgo | Equipos, conflicto y convivencia |  | 3 |
| `r1` | Daniela · tu mejor analista | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `r2` | Luis · gerente de operaciones | Liderazgo | Motivación, desarrollo de personas y sucesión | Retroalimentación y conversaciones difíciles | 3 |
| `r3` | Tres ingenieros del mismo equipo | Liderazgo | Motivación, desarrollo de personas y sucesión | Diagnóstico de la situación (Estrategia) | 3 |
| `p1` | Rosa · coordinadora, 10 años | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `p2` | Felipe · gerente, se divorcia | Liderazgo | Retroalimentación y conversaciones difíciles |  | 3 |
| `p3` | Esteban · director, ansiedad y burnout | Liderazgo | Motivación, desarrollo de personas y sucesión | Ética y dilemas (Riesgo) | 3 |
| `s1` | Julio · vendedor, 1 año | Liderazgo | Retroalimentación y conversaciones difíciles |  | 3 |
| `s2` | Tu equipo, después del despido de alguien querido | Liderazgo | Comunicación ejecutiva | Cultura y cambio | 3 |
| `s3` | Un recorte de 40 personas | Liderazgo | Comunicación ejecutiva | Ética y dilemas (Riesgo) | 4 |

### Casos de las seis empresas

Mensajes, juntas y reportes con decisión y consecuencias.

| Identificador | Pieza | Academia | Habilidad principal | También trabaja | Nivel |
|---|---|---|---|---|---|
| `cumbre:d1-bienvenida` | Botanas Cumbre · Liderar es cargar responsabilidad | Liderazgo | El papel de quien dirige | Diagnóstico de la situación (Estrategia) | 2 |
| `cumbre:d1-hector` | Botanas Cumbre · No negocies posiciones | Liderazgo | Negociación | Retroalimentación y conversaciones difíciles | 2 |
| `cumbre:d2-supernorte` | Botanas Cumbre · MAPAN: el poder está en tus alternativas | Liderazgo | Negociación | Canales y ventas (Crecimiento); Estado de resultados y márgenes (Finanzas) | 3 |
| `cumbre:d2-ana` | Botanas Cumbre · Empieza con el final | Liderazgo | Comunicación ejecutiva | Retroalimentación y conversaciones difíciles | 2 |
| `cumbre:c-hector-aliado` | Botanas Cumbre · El aliado incómodo | Liderazgo | Influencia y coaliciones | Equipos, conflicto y convivencia | 3 |
| `cumbre:d3-planta` | Botanas Cumbre · La ética se ve cuando hay dinero en juego | Riesgo | Ética y dilemas | Calidad (Operaciones); Cultura y cambio (Liderazgo) | 3 |
| `cumbre:d3-diego` | Botanas Cumbre · Pilotos antes de apostar | Crecimiento | Producto e innovación | Decidir con incertidumbre (Riesgo); Valor del dinero y evaluación de inversiones (Finanzas) | 3 |
| `cumbre:c-hector-renuncia` | Botanas Cumbre · Las personas no son el problema | Liderazgo | Motivación, desarrollo de personas y sucesión | Negociación | 3 |
| `cumbre:d4-objetivos` | Botanas Cumbre · La estrategia falla al bajar | Estrategia | De la estrategia a metas e indicadores | Indicadores operativos (Operaciones) | 3 |
| `cumbre:d4-sindicato` | Botanas Cumbre · Intereses, derechos y poder | Liderazgo | Negociación | Partes interesadas (Riesgo); Presupuesto y variaciones (Finanzas) | 3 |
| `cumbre:c-supernorte-castigo` | Botanas Cumbre · La reputación es capital negociador | Liderazgo | Negociación | Canales y ventas (Crecimiento) | 3 |
| `cumbre:d5-credito` | Botanas Cumbre · El CEO como asignador de capital | Finanzas | Valor del dinero y evaluación de inversiones | Deuda, capital y financiamiento; Capacidad y cuellos de botella (Operaciones) | 4 |
| `cumbre:d5-consejo` | Botanas Cumbre · Ocho segundos para ganar el derecho a ser escuchado | Liderazgo | Comunicación ejecutiva | Gobierno corporativo (Riesgo) | 3 |
| `cumbre:c-ana-brilla` | Botanas Cumbre · Desarrollar talento es la prioridad número uno | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `cumbre:c-planta-accidente` | Botanas Cumbre · Walk the talk | Riesgo | Crisis y reputación | Ética y dilemas; Cultura y cambio (Liderazgo) | 3 |
| `cumbre:d6-gastos` | Botanas Cumbre · La cultura real se revela en lo que se tolera | Riesgo | Ética y dilemas | Cultura y cambio (Liderazgo); Cumplimiento y controles | 3 |
| `cumbre:d6-clima` | Botanas Cumbre · El cambio ocurre conversación por conversación | Liderazgo | Cultura y cambio | Equipos, conflicto y convivencia | 3 |
| `cumbre:c-ana-renuncia` | Botanas Cumbre · La gente se va de sus jefes | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `cumbre:c-piloto` | Botanas Cumbre · Progreso visible | Crecimiento | Producto e innovación | Asignación de recursos (Estrategia) | 3 |
| `cumbre:d7-sucesion` | Botanas Cumbre · El líder adecuado cambia el destino | Liderazgo | Motivación, desarrollo de personas y sucesión | Gobierno corporativo (Riesgo) | 3 |
| `cumbre:d2-mantenimiento` | Botanas Cumbre · El mantenimiento que no se ve | Operaciones | Capacidad y cuellos de botella | Presupuesto y variaciones (Finanzas); Lenguaje del riesgo (Riesgo) | 3 |
| `cumbre:c-mant-sabados` | Botanas Cumbre · Lo correcto también tiene costo, y se gestiona | Operaciones | Capacidad y cuellos de botella | Negociación (Liderazgo) | 3 |
| `cumbre:c-mant-falla` | Botanas Cumbre · La deuda de mantenimiento se cobra con intereses | Operaciones | Capacidad y cuellos de botella | Costos, contribución y punto de equilibrio (Finanzas); Retención y valor del cliente (Crecimiento) | 3 |
| `cumbre:c-mant-rendimiento` | Botanas Cumbre · No fallar no es lo mismo que estar bien | Operaciones | Productividad y merma | Costos, contribución y punto de equilibrio (Finanzas) | 3 |
| `cumbre:c-mant-queja` | Botanas Cumbre · El problema de planta llega al cliente | Crecimiento | Retención y valor del cliente | Negociación (Liderazgo); Calidad (Operaciones) | 3 |
| `cumbre:c-mant-inversion` | Botanas Cumbre · La cuenta completa de un ahorro | Finanzas | Valor del dinero y evaluación de inversiones | Capacidad y cuellos de botella (Operaciones) | 4 |
| `cumbre:c-mant-dosificador` | Botanas Cumbre · El arreglo parcial deja puntos ciegos | Riesgo | Ética y dilemas | Calidad (Operaciones) | 3 |
| `cumbre:c-s-merma` | Botanas Cumbre · Un acuerdo vale lo que se cumple | Liderazgo | Negociación | Productividad y merma (Operaciones); Partes interesadas (Riesgo) | 3 |
| `cumbre:c-s-revision` | Botanas Cumbre · La relación es un juego repetido | Liderazgo | Negociación | Partes interesadas (Riesgo) | 3 |
| `forja:fn-d1-carta` | Forja Norte · Dos relojes: el del dueño y el de la planta | Liderazgo | El papel de quien dirige | Diagnóstico de la situación (Estrategia) | 2 |
| `forja:fn-d1-andon` | Forja Norte · El poder de parar la línea | Operaciones | Calidad | Cultura y cambio (Liderazgo) | 3 |
| `forja:fn-d2-precio` | Forja Norte · Cuando el cliente tiene el siguiente contrato en la mano | Liderazgo | Negociación | Precios y valor percibido (Crecimiento); Costos, contribución y punto de equilibrio (Finanzas) | 3 |
| `forja:fn-d2-soldadores` | Forja Norte · Comprar, construir o reemplazar talento | Liderazgo | Motivación, desarrollo de personas y sucesión | Capacidad y cuellos de botella (Operaciones); Presupuesto y variaciones (Finanzas) | 3 |
| `forja:fn-c-escape` | Forja Norte · El costo de esconder un problema | Operaciones | Calidad | Retención y valor del cliente (Crecimiento); Crisis y reputación (Riesgo) | 3 |
| `forja:fn-d3-ppap` | Forja Norte · La firma de Calidad | Riesgo | Ética y dilemas | Calidad (Operaciones) | 3 |
| `forja:fn-c-kaizen` | Forja Norte · Progreso visible | Operaciones | Mejora continua y transformación | Motivación, desarrollo de personas y sucesión (Liderazgo) | 3 |
| `forja:fn-d4-recap` | Forja Norte · El CEO entre el dueño y la empresa | Finanzas | Deuda, capital y financiamiento | Gobierno corporativo (Riesgo) | 4 |
| `forja:fn-d4-pleito` | Forja Norte · Los incentivos explican el conflicto | Estrategia | De la estrategia a metas e indicadores | Equipos, conflicto y convivencia (Liderazgo) | 3 |
| `forja:fn-d5-ciber` | Forja Norte · Las primeras 24 horas de una crisis | Riesgo | Crisis y reputación | Comunicación ejecutiva (Liderazgo) | 3 |
| `forja:fn-d5-plataforma` | Forja Norte · Crecer con el cliente que ya te domina | Estrategia | Ventaja competitiva y posicionamiento | Valor del dinero y evaluación de inversiones (Finanzas); Lenguaje del riesgo (Riesgo) | 4 |
| `forja:fn-c-laura` | Forja Norte · Cuando renuncia tu conciencia | Liderazgo | Motivación, desarrollo de personas y sucesión | Ética y dilemas (Riesgo) | 3 |
| `forja:fn-d6-proveedor` | Forja Norte · El riesgo de proveedor único | Operaciones | Inventarios y cadena de suministro | Lenguaje del riesgo (Riesgo); Costos, contribución y punto de equilibrio (Finanzas) | 3 |
| `forja:fn-d6-denuncia` | Forja Norte · La cultura real se revela en lo que se tolera | Riesgo | Cumplimiento y controles | Ética y dilemas; Cultura y cambio (Liderazgo) | 3 |
| `forja:fn-c-escuela` | Forja Norte · Formar es un proceso, no un evento | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `forja:fn-d7-consejo` | Forja Norte · Recomendar, no solo opinar | Liderazgo | Comunicación ejecutiva | Gobierno corporativo (Riesgo); Priorización y renuncias (Estrategia) | 3 |
| `forja:fn-d7-sindicato` | Forja Norte · El vacío se llena de rumores | Liderazgo | Comunicación ejecutiva | Partes interesadas (Riesgo) | 3 |
| `forja:fn-d2-inventario` | Forja Norte · La caja que está en el almacén | Finanzas | Capital de trabajo | Inventarios y cadena de suministro (Operaciones) | 3 |
| `forja:fn-c-inv-lineas` | Forja Norte · Una buena idea necesita un incentivo que no la contradiga | Estrategia | De la estrategia a metas e indicadores | Inventarios y cadena de suministro (Operaciones); Cultura y cambio (Liderazgo) | 3 |
| `forja:fn-c-inv-faltante` | Forja Norte · El colchón que se quitó de golpe | Operaciones | Inventarios y cadena de suministro | Retención y valor del cliente (Crecimiento) | 3 |
| `forja:fn-c-inv-factoraje` | Forja Norte · Cuando la caja se nota afuera | Finanzas | Capital de trabajo | Comunicación ejecutiva (Liderazgo); Retención y valor del cliente (Crecimiento) | 3 |
| `forja:fn-c8-greg` | Forja Norte · La causa raíz que es tuya | Liderazgo | Comunicación ejecutiva | Calidad (Operaciones); Retención y valor del cliente (Crecimiento) | 3 |
| `forja:fn-c8-consejo` | Forja Norte · Una decisión se reporta con su costo | Liderazgo | Comunicación ejecutiva | Gobierno corporativo (Riesgo); Capital de trabajo (Finanzas) | 3 |
| `forja:fn-s-precio-mas` | Forja Norte · Lo que concedes enseña a pedir | Liderazgo | Negociación | Precios y valor percibido (Crecimiento) | 3 |
| `forja:fn-s-precio-rfq` | Forja Norte · Cotizar lo que puedes sostener | Crecimiento | Precios y valor percibido | Costos, contribución y punto de equilibrio (Finanzas); Negociación (Liderazgo) | 4 |
| `brasa:gb-d1-carta` | Grupo Brasa · En restaurantes, la estrategia se prueba en el turno de la noche | Liderazgo | El papel de quien dirige | Diagnóstico de la situación (Estrategia) | 2 |
| `brasa:gb-d1-app` | Grupo Brasa · Cuando el canal se queda con el margen | Crecimiento | Canales y ventas | Negociación (Liderazgo) | 3 |
| `brasa:gb-d2-menu` | Grupo Brasa · Estrategia es decidir qué no vender | Estrategia | Priorización y renuncias | Producto e innovación (Crecimiento); Costos, contribución y punto de equilibrio (Finanzas) | 3 |
| `brasa:gb-d2-propinas` | Grupo Brasa · La justicia interna también es estrategia | Liderazgo | Motivación, desarrollo de personas y sucesión | Cultura y cambio | 3 |
| `brasa:gb-c-app-guerra` | Grupo Brasa · El costo de construir tu canal | Crecimiento | Canales y ventas | Ventaja competitiva y posicionamiento (Estrategia) | 3 |
| `brasa:gb-d3-brote` | Grupo Brasa · La disculpa con nombre y apellido | Riesgo | Crisis y reputación | Comunicación ejecutiva (Liderazgo); Ética y dilemas | 3 |
| `brasa:gb-d3-franquicia` | Grupo Brasa · Crecer sin sistema es multiplicar los problemas | Crecimiento | Expansión | Procesos (Operaciones) | 4 |
| `brasa:gb-c-cocinas` | Grupo Brasa · Cuidar a quien no le gustó el cambio | Crecimiento | Retención y valor del cliente | Cliente y propuesta de valor | 2 |
| `brasa:gb-d4-carne` | Grupo Brasa · El prime cost manda | Finanzas | Costos, contribución y punto de equilibrio | Precios y valor percibido (Crecimiento); Inventarios y cadena de suministro (Operaciones) | 3 |
| `brasa:gb-d4-gerente` | Grupo Brasa · Lo que premias es lo que obtienes | Liderazgo | Cultura y cambio | Ética y dilemas (Riesgo) | 3 |
| `brasa:gb-d5-cdmx` | Grupo Brasa · El costo hundido no decide | Finanzas | Costos, contribución y punto de equilibrio | Priorización y renuncias (Estrategia) | 3 |
| `brasa:gb-c-franquicia-mala` | Grupo Brasa · La marca vive en el plato | Operaciones | Calidad | Expansión (Crecimiento) | 4 |
| `brasa:gb-d6-dark` | Grupo Brasa · Innovar sin romper lo que funciona | Crecimiento | Producto e innovación | Decidir con incertidumbre (Riesgo) | 3 |
| `brasa:gb-d6-sucesion` | Grupo Brasa · No tomes partido en lo que es un proceso | Riesgo | Gobierno corporativo | Negociación (Liderazgo) | 3 |
| `brasa:gb-d7-consejo` | Grupo Brasa · Una apuesta, no cinco | Estrategia | Priorización y renuncias | Comunicación ejecutiva (Liderazgo); Gobierno corporativo (Riesgo) | 3 |
| `brasa:gb-d2-proveedor` | Grupo Brasa · El ahorro que se ve en el menú | Operaciones | Inventarios y cadena de suministro | Costos, contribución y punto de equilibrio (Finanzas); Cliente y propuesta de valor (Crecimiento) | 3 |
| `brasa:gb-c-prov-piloto` | Grupo Brasa · Un piloto rara vez da un sí o un no | Riesgo | Decidir con incertidumbre | Producto e innovación (Crecimiento) | 3 |
| `brasa:gb-c-prov-resenas` | Grupo Brasa · El ahorro que se notó en el plato | Operaciones | Calidad | Retención y valor del cliente (Crecimiento) | 3 |
| `brasa:gb-c-prov-contrato` | Grupo Brasa · Todo descuento tiene una contraparte | Liderazgo | Negociación | Inventarios y cadena de suministro (Operaciones); Costos, contribución y punto de equilibrio (Finanzas) | 3 |
| `brasa:gb-s-app-renueva` | Grupo Brasa · La plataforma que te da los clientes también fija el precio | Liderazgo | Negociación | Canales y ventas (Crecimiento) | 3 |
| `brasa:gb-s-app-oferta` | Grupo Brasa · Negociar con alternativa | Liderazgo | Negociación | Canales y ventas (Crecimiento); Ventaja competitiva y posicionamiento (Estrategia) | 3 |
| `kubit:kb-d1-carta` | Kúbit · Llegar después del fundador | Liderazgo | El papel de quien dirige | Diagnóstico de la situación (Estrategia) | 2 |
| `kubit:kb-d1-guardia` | Kúbit · La revisión que estorba | Operaciones | Procesos | Cultura y cambio (Liderazgo) | 3 |
| `kubit:kb-d2-altamar` | Kúbit · El cliente que quiere un producto para él solo | Liderazgo | Negociación | Producto e innovación (Crecimiento); Estado de resultados y márgenes (Finanzas) | 3 |
| `kubit:kb-d2-fuga` | Kúbit · Comprar, construir o subcontratar talento | Liderazgo | Motivación, desarrollo de personas y sucesión | Capacidad y cuellos de botella (Operaciones); Presupuesto y variaciones (Finanzas) | 3 |
| `kubit:kb-c-caida` | Kúbit · El costo de esconder un problema | Operaciones | Calidad | Retención y valor del cliente (Crecimiento); Crisis y reputación (Riesgo) | 3 |
| `kubit:kb-d3-demo` | Kúbit · Vender lo que todavía no existe | Riesgo | Ética y dilemas | Cliente y propuesta de valor (Crecimiento); Capacidad y cuellos de botella (Operaciones) | 3 |
| `kubit:kb-c-mejora` | Kúbit · Progreso visible | Operaciones | Mejora continua y transformación | Motivación, desarrollo de personas y sucesión (Liderazgo) | 3 |
| `kubit:kb-d4-deuda` | Kúbit · Comprar tiempo con deuda | Finanzas | Deuda, capital y financiamiento | Gobierno corporativo (Riesgo) | 4 |
| `kubit:kb-d4-pleito` | Kúbit · Los incentivos explican el conflicto | Estrategia | De la estrategia a metas e indicadores | Equipos, conflicto y convivencia (Liderazgo) | 3 |
| `kubit:kb-d5-banco` | Kúbit · Las primeras 24 horas de una crisis | Riesgo | Crisis y reputación | Comunicación ejecutiva (Liderazgo); Flujo de efectivo (Finanzas) | 3 |
| `kubit:kb-d5-ronda` | Kúbit · El dinero también decide qué empresa eres | Finanzas | Deuda, capital y financiamiento | Escenarios y efectos de segundo orden (Estrategia); Gobierno corporativo (Riesgo) | 4 |
| `kubit:kb-c-renata` | Kúbit · Cuando renuncia tu conciencia | Liderazgo | Motivación, desarrollo de personas y sucesión | Ética y dilemas (Riesgo) | 3 |
| `kubit:kb-d6-centro` | Kúbit · El riesgo de proveedor único | Operaciones | Inventarios y cadena de suministro | Lenguaje del riesgo (Riesgo); Costos, contribución y punto de equilibrio (Finanzas) | 3 |
| `kubit:kb-d6-denuncia` | Kúbit · La cultura real se revela en lo que se tolera | Riesgo | Cumplimiento y controles | Ética y dilemas; Cultura y cambio (Liderazgo) | 3 |
| `kubit:kb-c-academia` | Kúbit · Formar es un proceso, no un evento | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `kubit:kb-d7-consejo` | Kúbit · Recomendar, no solo opinar | Liderazgo | Comunicación ejecutiva | Gobierno corporativo (Riesgo); Priorización y renuncias (Estrategia) | 3 |
| `kubit:kb-d7-equipo` | Kúbit · El vacío se llena de rumores | Liderazgo | Comunicación ejecutiva | Partes interesadas (Riesgo) | 3 |
| `kubit:kb-d2-nube` | Kúbit · El costo que crece solo | Finanzas | Costos, contribución y punto de equilibrio | Productividad y merma (Operaciones) | 3 |
| `kubit:kb-c-nube-consumo` | Kúbit · El cliente que cuesta más de lo que paga | Crecimiento | Precios y valor percibido | Negociación (Liderazgo); Costos, contribución y punto de equilibrio (Finanzas) | 3 |
| `kubit:kb-c-nube-caida` | Kúbit · El ahorro que se cobró en confianza | Riesgo | Crisis y reputación | Retención y valor del cliente (Crecimiento); Comunicación ejecutiva (Liderazgo) | 3 |
| `kubit:kb-c-nube-compromiso` | Kúbit · Un buen descuento en mal momento | Liderazgo | Comunicación ejecutiva | Gobierno corporativo (Riesgo); Presupuesto y variaciones (Finanzas) | 3 |
| `kubit:kb-s-altamar-mas` | Kúbit · Lo que concedes enseña a pedir | Liderazgo | Negociación | Retención y valor del cliente (Crecimiento) | 3 |
| `kubit:kb-s-altamar-grupo` | Kúbit · Prometer lo que puedes entregar | Liderazgo | Negociación | Capacidad y cuellos de botella (Operaciones); Retención y valor del cliente (Crecimiento) | 3 |
| `puntomadero:pm-d1-carta` | Punto Madero · Llegar después del interino | Liderazgo | El papel de quien dirige | Diagnóstico de la situación (Estrategia) | 2 |
| `puntomadero:pm-d1-piso` | Punto Madero · La regla que estorba | Operaciones | Procesos | Cultura y cambio (Liderazgo) | 3 |
| `puntomadero:pm-d2-penasco` | Punto Madero · El cliente que quiere condiciones solo para él | Liderazgo | Negociación | Retención y valor del cliente (Crecimiento); Estado de resultados y márgenes (Finanzas) | 3 |
| `puntomadero:pm-d2-asesores` | Punto Madero · Comprar, construir o subcontratar talento | Liderazgo | Motivación, desarrollo de personas y sucesión | Capacidad y cuellos de botella (Operaciones); Presupuesto y variaciones (Finanzas) | 3 |
| `puntomadero:pm-c-tarima` | Punto Madero · El costo de esconder un problema | Riesgo | Crisis y reputación | Calidad (Operaciones); Cultura y cambio (Liderazgo) | 3 |
| `puntomadero:pm-d3-entrega` | Punto Madero · Anunciar lo que todavía no existe | Riesgo | Ética y dilemas | Cliente y propuesta de valor (Crecimiento); Capacidad y cuellos de botella (Operaciones) | 3 |
| `puntomadero:pm-c-mejora` | Punto Madero · Progreso visible | Operaciones | Mejora continua y transformación | Motivación, desarrollo de personas y sucesión (Liderazgo) | 3 |
| `puntomadero:pm-d4-deuda` | Punto Madero · Comprar plazas con deuda | Finanzas | Deuda, capital y financiamiento | Valor del dinero y evaluación de inversiones; Gobierno corporativo (Riesgo) | 4 |
| `puntomadero:pm-d4-pleito` | Punto Madero · Los incentivos explican el conflicto | Estrategia | De la estrategia a metas e indicadores | Equipos, conflicto y convivencia (Liderazgo) | 3 |
| `puntomadero:pm-d5-embargo` | Punto Madero · Las primeras 24 horas de una crisis | Riesgo | Crisis y reputación | Comunicación ejecutiva (Liderazgo); Flujo de efectivo (Finanzas) | 3 |
| `puntomadero:pm-d5-oferta` | Punto Madero · El dinero también decide qué empresa eres | Estrategia | Portafolio, disrupción y decisiones irreversibles | Asignación de capital y valuación (Finanzas); Gobierno corporativo (Riesgo) | 4 |
| `puntomadero:pm-c-monica` | Punto Madero · Cuando renuncia tu conciencia | Liderazgo | Motivación, desarrollo de personas y sucesión | Ética y dilemas (Riesgo) | 3 |
| `puntomadero:pm-d6-proveedor` | Punto Madero · El riesgo de proveedor único | Operaciones | Inventarios y cadena de suministro | Lenguaje del riesgo (Riesgo); Costos, contribución y punto de equilibrio (Finanzas) | 3 |
| `puntomadero:pm-d6-denuncia` | Punto Madero · La cultura real se revela en lo que se tolera | Riesgo | Cumplimiento y controles | Ética y dilemas; Cultura y cambio (Liderazgo) | 3 |
| `puntomadero:pm-c-escuela` | Punto Madero · Formar es un proceso, no un evento | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `puntomadero:pm-d7-consejo` | Punto Madero · Recomendar, no solo opinar | Liderazgo | Comunicación ejecutiva | Gobierno corporativo (Riesgo); Priorización y renuncias (Estrategia) | 3 |
| `puntomadero:pm-d7-equipo` | Punto Madero · El vacío se llena de rumores | Liderazgo | Comunicación ejecutiva | Partes interesadas (Riesgo) | 3 |
| `puntomadero:pm-d2-temporada` | Punto Madero · Lo que no se vendió también decide | Operaciones | Inventarios y cadena de suministro | Capital de trabajo (Finanzas); Precios y valor percibido (Crecimiento) | 3 |
| `puntomadero:pm-c-temp-compras` | Punto Madero · El sobrante empezó en la compra | Operaciones | Inventarios y cadena de suministro | Diagnóstico de la situación (Estrategia) | 3 |
| `puntomadero:pm-c-temp-guerra` | Punto Madero · El remate que invitó a una guerra | Crecimiento | Precios y valor percibido | Ventaja competitiva y posicionamiento (Estrategia) | 3 |
| `puntomadero:pm-c-temp-bodega` | Punto Madero · Lo que ya se perdió no regresa esperando | Finanzas | Costos, contribución y punto de equilibrio | Inventarios y cadena de suministro (Operaciones) | 3 |
| `puntomadero:pm-s-penasco-mas` | Punto Madero · Lo que concedes enseña a pedir | Liderazgo | Negociación | Capital de trabajo (Finanzas) | 3 |
| `puntomadero:pm-s-penasco-obras` | Punto Madero · Repartir el riesgo con reglas | Liderazgo | Negociación | Lenguaje del riesgo (Riesgo); Retención y valor del cliente (Crecimiento) | 3 |
| `vertice:vl-d1-carta` | Vértice Logística · Llegar después del interino | Liderazgo | El papel de quien dirige | Diagnóstico de la situación (Estrategia) | 2 |
| `vertice:vl-d1-patio` | Vértice Logística · La regla que estorba | Operaciones | Procesos | Cultura y cambio (Liderazgo) | 3 |
| `vertice:vl-d2-almena` | Vértice Logística · Negociar desempeño, no solo precio | Liderazgo | Negociación | Retención y valor del cliente (Crecimiento); Estado de resultados y márgenes (Finanzas) | 3 |
| `vertice:vl-d2-operadores` | Vértice Logística · Comprar, construir o subcontratar talento | Liderazgo | Motivación, desarrollo de personas y sucesión | Capacidad y cuellos de botella (Operaciones); Presupuesto y variaciones (Finanzas) | 3 |
| `vertice:vl-c-frenos` | Vértice Logística · El costo de esconder un problema | Riesgo | Crisis y reputación | Calidad (Operaciones); Cultura y cambio (Liderazgo) | 3 |
| `vertice:vl-d3-rastreo` | Vértice Logística · Prometer lo que todavía no existe | Riesgo | Ética y dilemas | Cliente y propuesta de valor (Crecimiento); Capacidad y cuellos de botella (Operaciones) | 3 |
| `vertice:vl-c-mejora` | Vértice Logística · Progreso visible | Operaciones | Mejora continua y transformación | Motivación, desarrollo de personas y sucesión (Liderazgo) | 3 |
| `vertice:vl-d4-deuda` | Vértice Logística · Comprar capacidad con deuda | Finanzas | Deuda, capital y financiamiento | Valor del dinero y evaluación de inversiones; Gobierno corporativo (Riesgo) | 4 |
| `vertice:vl-d4-pleito` | Vértice Logística · Los incentivos explican el conflicto | Estrategia | De la estrategia a metas e indicadores | Equipos, conflicto y convivencia (Liderazgo) | 3 |
| `vertice:vl-d5-embargo` | Vértice Logística · Las primeras 24 horas de una crisis | Riesgo | Crisis y reputación | Comunicación ejecutiva (Liderazgo); Flujo de efectivo (Finanzas) | 3 |
| `vertice:vl-d5-oferta` | Vértice Logística · El dinero también decide qué empresa eres | Estrategia | Portafolio, disrupción y decisiones irreversibles | Asignación de capital y valuación (Finanzas); Gobierno corporativo (Riesgo) | 4 |
| `vertice:vl-c-gaby` | Vértice Logística · Cuando renuncia tu conciencia | Liderazgo | Motivación, desarrollo de personas y sucesión | Ética y dilemas (Riesgo) | 3 |
| `vertice:vl-d6-sistema` | Vértice Logística · El riesgo de proveedor único | Operaciones | Inventarios y cadena de suministro | Lenguaje del riesgo (Riesgo); Costos, contribución y punto de equilibrio (Finanzas) | 3 |
| `vertice:vl-d6-denuncia` | Vértice Logística · La cultura real se revela en lo que se tolera | Riesgo | Cumplimiento y controles | Ética y dilemas; Cultura y cambio (Liderazgo) | 3 |
| `vertice:vl-c-escuela` | Vértice Logística · Formar es un proceso, no un evento | Liderazgo | Motivación, desarrollo de personas y sucesión |  | 2 |
| `vertice:vl-d7-consejo` | Vértice Logística · Recomendar, no solo opinar | Liderazgo | Comunicación ejecutiva | Gobierno corporativo (Riesgo); Priorización y renuncias (Estrategia) | 3 |
| `vertice:vl-d7-equipo` | Vértice Logística · El vacío se llena de rumores | Liderazgo | Comunicación ejecutiva | Partes interesadas (Riesgo) | 3 |
| `vertice:vl-d2-diesel` | Vértice Logística · El costo que nadie controla | Finanzas | Costos, contribución y punto de equilibrio | Precios y valor percibido (Crecimiento); Entorno económico y político (Riesgo) | 3 |
| `vertice:vl-c-diesel-formula` | Vértice Logística · Una regla justa tiene que serlo en los dos sentidos | Liderazgo | Negociación | Precios y valor percibido (Crecimiento) | 3 |
| `vertice:vl-c-diesel-licitacion` | Vértice Logística · El aumento que invitó al competidor | Estrategia | Ventaja competitiva y posicionamiento | Precios y valor percibido (Crecimiento); Negociación (Liderazgo) | 3 |
| `vertice:vl-c-diesel-telemetria` | Vértice Logística · Una medida que se vuelve exhibición | Operaciones | Indicadores operativos | Cultura y cambio (Liderazgo) | 3 |
| `vertice:vl-s-almena-mas` | Vértice Logística · Lo que concedes enseña a pedir | Liderazgo | Negociación | Retención y valor del cliente (Crecimiento) | 3 |
| `vertice:vl-s-almena-cedis` | Vértice Logística · Prometer lo que puedes entregar | Liderazgo | Negociación | Capacidad y cuellos de botella (Operaciones) | 3 |

### Banco de decisiones

Situaciones escritas para siete industrias.

| Identificador | Pieza | Academia | Habilidad principal | También trabaja | Nivel |
|---|---|---|---|---|---|
| `retiro` | Retirar del mercado sin tener certeza | Riesgo | Decidir con incertidumbre | Ética y dilemas; Calidad (Operaciones) | 3 |
| `cliente` | El cliente más grande aprieta | Liderazgo | Negociación | Retención y valor del cliente (Crecimiento); Estado de resultados y márgenes (Finanzas) | 3 |
| `incentivos` | La meta que empuja a hacer trampa | Riesgo | Ética y dilemas | De la estrategia a metas e indicadores (Estrategia); Cultura y cambio (Liderazgo) | 3 |
| `ciberataque` | Ciberataque y rescate | Riesgo | Crisis y reputación | Comunicación ejecutiva (Liderazgo) | 3 |
| `expansion` | La expansión que no puede esperar | Crecimiento | Expansión | Valor del dinero y evaluación de inversiones (Finanzas); Capacidad y cuellos de botella (Operaciones) | 4 |
| `precio` | Subir precios sin romper la confianza | Crecimiento | Precios y valor percibido | Comunicación ejecutiva (Liderazgo) | 3 |
| `recorte` | Crecimos de más: hay que ajustar | Liderazgo | Comunicación ejecutiva | Costos, contribución y punto de equilibrio (Finanzas); Cultura y cambio | 3 |
| `proveedor` | Se cayó tu proveedor único | Operaciones | Inventarios y cadena de suministro | Negociación (Liderazgo); Lenguaje del riesgo (Riesgo) | 3 |
| `apuesta` | Lo nuevo amenaza a lo que hoy da de comer | Estrategia | Portafolio, disrupción y decisiones irreversibles | Producto e innovación (Crecimiento) | 4 |
| `error` | Un error nuestro le pegó a alguien | Liderazgo | Cultura y cambio | Calidad (Operaciones); Retención y valor del cliente (Crecimiento) | 3 |
| `guerra` | Un competidor baja precios | Crecimiento | Precios y valor percibido | Ventaja competitiva y posicionamiento (Estrategia) | 3 |
| `verde` | El reporte que siempre sale en verde | Liderazgo | Cultura y cambio | Indicadores operativos (Operaciones) | 3 |
| `trimestre` | Llegar al número del trimestre | Riesgo | Gobierno corporativo | Asignación de recursos (Estrategia); Estado de resultados y márgenes (Finanzas) | 4 |
| `incidente` | Un incidente de tu gente se vuelve viral | Riesgo | Crisis y reputación | Comunicación ejecutiva (Liderazgo); Cliente y propuesta de valor (Crecimiento) | 3 |
| `salarios` | Lo que pagas ya no es justo | Liderazgo | Motivación, desarrollo de personas y sucesión | Presupuesto y variaciones (Finanzas) | 3 |
| `meta` | Alguien avisa que la meta solo se cumple haciendo trampa | Riesgo | Ética y dilemas | Ejecución y seguimiento (Operaciones) | 3 |
| `foco` | Hacemos demasiadas cosas | Estrategia | Priorización y renuncias | Productividad y merma (Operaciones) | 3 |
| `adaptativo` | Te piden que tú decidas quién tiene la razón | Liderazgo | Delegación y seguimiento | Cultura y cambio | 3 |
| `mando` | Ascender al mejor técnico o traer un jefe de fuera | Liderazgo | Motivación, desarrollo de personas y sucesión | Equipos, conflicto y convivencia | 3 |
| `sucesor` | Quién sigue si mañana falta alguien clave | Liderazgo | Motivación, desarrollo de personas y sucesión | Gobierno corporativo (Riesgo) | 3 |
| `inversion` | Una inversión grande de una sola vez | Finanzas | Valor del dinero y evaluación de inversiones | Decidir con incertidumbre (Riesgo) | 4 |
| `capital` | Con qué dinero crecer | Finanzas | Deuda, capital y financiamiento | Gobierno corporativo (Riesgo) | 4 |
| `region` | Abrir otra región | Crecimiento | Expansión | Escenarios y efectos de segundo orden (Estrategia); Procesos (Operaciones) | 4 |
| `alianza` | Una alianza que pide exclusividad | Liderazgo | Negociación | Ventaja competitiva y posicionamiento (Estrategia); Canales y ventas (Crecimiento) | 4 |
| `adquisicion` | Comprar a un competidor | Estrategia | Portafolio, disrupción y decisiones irreversibles | Asignación de capital y valuación (Finanzas); Negociación (Liderazgo) | 4 |
| `regulador` | La autoridad encuentra una falla | Riesgo | Cumplimiento y controles | Partes interesadas; Comunicación ejecutiva (Liderazgo) | 4 |
| `prensa` | Un reportaje que te deja mal | Riesgo | Crisis y reputación | Comunicación ejecutiva (Liderazgo); Ética y dilemas | 4 |
| `deuda` | El crédito está por romper una condición | Finanzas | Deuda, capital y financiamiento | Ética y dilemas (Riesgo); Negociación (Liderazgo) | 4 |

### Casos conversacionales

Se consulta, se conversa, se negocia y se justifica.

| Identificador | Pieza | Academia | Habilidad principal | También trabaja | Nivel |
|---|---|---|---|---|---|
| `supernorte` | Negociación SuperNorte | Liderazgo | Negociación | Canales y ventas (Crecimiento); Estado de resultados y márgenes (Finanzas) | 3 |
| `diego` | La conversación con Diego | Liderazgo | Retroalimentación y conversaciones difíciles | Equipos, conflicto y convivencia | 3 |
| `alergeno` | Lote L-2291 | Riesgo | Crisis y reputación | Ética y dilemas; Calidad (Operaciones) | 4 |
| `aurora` | Aurora pide 4% menos | Liderazgo | Negociación | Costos, contribución y punto de equilibrio (Finanzas); Retención y valor del cliente (Crecimiento) | 4 |
| `electrico` | El programa eléctrico | Estrategia | Portafolio, disrupción y decisiones irreversibles | Valor del dinero y evaluación de inversiones (Finanzas); Producto e innovación (Crecimiento) | 4 |
| `precios` | Subir precios | Crecimiento | Precios y valor percibido | Retención y valor del cliente; Estado de resultados y márgenes (Finanzas) | 4 |
| `carretera` | Accidente en la carretera | Riesgo | Crisis y reputación | El papel de quien dirige (Liderazgo); Cliente y propuesta de valor (Crecimiento) | 4 |
| `sucesion` | La sucesión de Don Ignacio | Riesgo | Gobierno corporativo | Motivación, desarrollo de personas y sucesión (Liderazgo); Ética y dilemas | 4 |
| `cdmx` | CDMX pierde dinero | Finanzas | Costos, contribución y punto de equilibrio | Productividad y merma (Operaciones); Comunicación ejecutiva (Liderazgo) | 4 |
| `mundocasa` | Mundo Casa abre enfrente | Estrategia | Ventaja competitiva y posicionamiento | Precios y valor percibido (Crecimiento); Negociación (Liderazgo) | 4 |
| `enlinea` | La tienda en línea promete de más | Operaciones | Ejecución y seguimiento | Cliente y propuesta de valor (Crecimiento); Comunicación ejecutiva (Liderazgo) | 4 |
| `seriec` | Serie C o rentabilidad | Finanzas | Deuda, capital y financiamiento | Escenarios y efectos de segundo orden (Estrategia); Negociación (Liderazgo) | 4 |
| `socio` | Un fondo quiere entrar | Finanzas | Deuda, capital y financiamiento | Gobierno corporativo (Riesgo); De la estrategia a metas e indicadores (Estrategia) | 4 |
| `transbajio` | Comprar a Transportes del Bajío | Estrategia | Portafolio, disrupción y decisiones irreversibles | Asignación de capital y valuación (Finanzas); Negociación (Liderazgo) | 4 |
| `brecha` | Acceso indebido a datos | Riesgo | Crisis y reputación | Cumplimiento y controles; Comunicación ejecutiva (Liderazgo) | 4 |
| `franquicia` | 10 franquicias en Monterrey | Crecimiento | Expansión | Procesos (Operaciones); Gobierno corporativo (Riesgo) | 4 |
| `refinanciar` | El crédito vence en 90 días | Finanzas | Deuda, capital y financiamiento | Negociación (Liderazgo); Gobierno corporativo (Riesgo) | 4 |

### Simulador de cambio

Nueve palancas para mover a una organización hacia un cambio.

| Identificador | Pieza | Academia | Habilidad principal | También trabaja | Nivel |
|---|---|---|---|---|---|
| `cambio` | Simulador de cambio (9 palancas) | Liderazgo | Cultura y cambio | Influencia y coaliciones | 3 |

### Casos de crecimiento

Cadenas de decisiones con números que se mueven.

| Identificador | Pieza | Academia | Habilidad principal | También trabaja | Nivel |
|---|---|---|---|---|---|
| `gf_arranque` | ¿Con qué dinero vas a crecer? | Finanzas | Deuda, capital y financiamiento | Asignación de recursos (Estrategia) | 3 |
| `ga1_cocina` | Los viernes la cocina no da | Operaciones | Capacidad y cuellos de botella | Motivación, desarrollo de personas y sucesión (Liderazgo) | 3 |
| `ga2_sucursal` | Un local en Cumbres | Crecimiento | Expansión | Valor del dinero y evaluación de inversiones (Finanzas); Negociación (Liderazgo) | 4 |
| `ga3_equipo` | ¿Con quién abrimos Cumbres? | Operaciones | Capacidad y cuellos de botella | Motivación, desarrollo de personas y sucesión (Liderazgo) | 3 |
| `gb1_cliente` | Un cliente nuevo quiere 2,600 piezas al día | Operaciones | Capacidad y cuellos de botella | Canales y ventas (Crecimiento); Priorización y renuncias (Estrategia) | 3 |
| `gb2_capacidad` | La planta no da con un solo turno | Operaciones | Capacidad y cuellos de botella | Valor del dinero y evaluación de inversiones (Finanzas) | 3 |
| `gb3_calidad` | El desperdicio subió con la gente nueva | Operaciones | Calidad | Motivación, desarrollo de personas y sucesión (Liderazgo) | 3 |
| `gc1_cliente` | Una constructora pide 8 toneladas más al día | Finanzas | Costos, contribución y punto de equilibrio | Capacidad y cuellos de botella (Operaciones); Precios y valor percibido (Crecimiento) | 3 |
| `gc2_capacidad` | Los hornos no dan con un solo turno | Operaciones | Capacidad y cuellos de botella | Valor del dinero y evaluación de inversiones (Finanzas) | 3 |
| `gc3_calidad` | Suben las coladas fuera de norma | Operaciones | Calidad | Motivación, desarrollo de personas y sucesión (Liderazgo) | 3 |
| `gl_liquidez` | La caja no alcanza para lo que viene | Finanzas | Capital de trabajo | Negociación (Liderazgo); Flujo de efectivo | 3 |
| `go_contratar` | Una sede no da abasto | Operaciones | Capacidad y cuellos de botella | Motivación, desarrollo de personas y sucesión (Liderazgo) | 3 |
| `go_ajustar` | Una sede tiene gente de más | Operaciones | Productividad y merma | Motivación, desarrollo de personas y sucesión (Liderazgo); Ética y dilemas (Riesgo) | 3 |
| `go_expandir` | ¿Abrimos en otra zona? | Crecimiento | Expansión | Flujo de efectivo (Finanzas) | 4 |

### Crisis de caja

Tres decisiones seguidas contra reloj.

| Identificador | Pieza | Academia | Habilidad principal | También trabaja | Nivel |
|---|---|---|---|---|---|
| `llamada` | La llamada de las 7:40 | Riesgo | Crisis y reputación | Gobierno corporativo | 4 |
| `caja` | Seis semanas de caja | Finanzas | Capital de trabajo | Negociación (Liderazgo); Crisis y reputación (Riesgo) | 4 |
| `voz` | Lo que vas a decir | Riesgo | Crisis y reputación | Comunicación ejecutiva (Liderazgo) | 4 |
