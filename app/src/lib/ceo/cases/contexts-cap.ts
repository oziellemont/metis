/**
 * mêtis CEO · Banco de casos · hechos por industria de las diez decisiones de capítulo (archetypes-cap.ts).
 * Mismas llaves que contexts.ts. Cifras en pesos para la empresa establecida (en PYME se escalan).
 */
import type { CaseFacts } from "./contexts";

export type CapId =
  | "mando" | "sucesor" | "inversion" | "capital" | "region" | "alianza" | "adquisicion" | "regulador" | "prensa" | "deuda";

export const CAP_FACTS: Readonly<Record<string, Record<CapId, CaseFacts>>> = {
  // ───────────────────────────────────────────────── Alimentos y bebidas
  alimentos_bebidas: {
    mando: {
      subject: "Se va el jefe de turno de la línea de lácteos",
      body: [
        "El jefe del turno nocturno renunció y necesitamos a alguien en tres semanas. El candidato natural es {frontline}: es el mejor operador de la planta y nadie conoce las llenadoras como él.",
        "Lo que me preocupa es que nunca ha dirigido a nadie y le cuesta delegar. También tengo un candidato de fuera, con experiencia de jefe en otra láctea.",
      ],
      rows: [["Personas en el turno", "34"], ["Merma del turno nocturno", "3.1% (meta 2%)"], ["Experiencia de {frontline} dirigiendo", "Ninguna"], ["Costo del candidato de fuera", "+35% sobre el puesto"]],
    },
    sucesor: {
      subject: "El relevo de los puestos clave",
      body: [
        "Te escribo antes del consejo. Tres de los cinco puestos clave de {company_short} dependen de una sola persona, y dos de ellas se retiran en menos de tres años.",
        "Algunos consejeros quieren nombrar ya a mi sobrino como director adjunto. Es capaz, pero quiero oír tu propuesta antes de decidir.",
      ],
      rows: [["Puestos clave", "5"], ["Puestos con un solo posible relevo", "3"], ["Retiros previstos en 3 años", "2"], ["Candidatos internos identificados", "4"]],
    },
    inversion: {
      subject: "La línea nueva de envasado",
      body: [
        "La línea actual ya trabaja al 92% y las cadenas nos piden 20% más volumen para el año. Cotizamos una línea automática completa.",
        "El proveedor da 12% de descuento si la compramos completa. También puede instalarse en dos fases, con la segunda seis meses después.",
      ],
      rows: [["Inversión completa", "$48 M"], ["Fase uno", "$26 M"], ["Uso de la línea actual", "92%"], ["Volumen adicional pedido", "+20%"]],
    },
    capital: {
      subject: "Tres formas de pagar el crecimiento",
      body: [
        "Para crecer al sur necesitamos unos $120 M en dos años. Un fondo ofrece entrar con 30% de la empresa y pide dos asientos en el consejo.",
        "El banco nos presta lo mismo a cinco años. Y con la caja propia podemos crecer, pero a la mitad de velocidad.",
      ],
      rows: [["Necesidad de capital", "$120 M en 2 años"], ["Oferta del fondo", "30% y 2 consejeros"], ["Crédito a 5 años", "Pago de $2.6 M al mes"], ["Caja generada al año", "$55 M"]],
    },
    region: {
      subject: "Entrar al Bajío",
      body: [
        "Una cadena del Bajío nos quiere en sus 60 tiendas. Es la primera vez que salimos del norte y allá la gente compra otras presentaciones y otras marcas regionales.",
        "Tengo un plan para abrir cinco centros de distribución a la vez y otro para entrar con un distribuidor que ya tiene la red.",
      ],
      rows: [["Tiendas de la cadena", "60"], ["Venta potencial al año", "$90 M"], ["Costo de abrir 5 centros", "$40 M"], ["Margen que pide el distribuidor", "18%"]],
    },
    alianza: {
      subject: "Propuesta de una cadena nacional",
      body: [
        "Una cadena nacional de conveniencia nos ofrece estar en sus 2,000 tiendas. Su red nos duplicaría las ventas en un año.",
        "A cambio pide exclusividad por cinco años: no podríamos vender en otras tiendas de conveniencia del país.",
      ],
      rows: [["Tiendas de la cadena", "2,000"], ["Venta adicional estimada", "$150 M al año"], ["Exclusividad pedida", "5 años"], ["Venta actual en otras cadenas de conveniencia", "$40 M"]],
    },
    adquisicion: {
      subject: "Una láctea regional está en venta",
      body: [
        "El dueño de una láctea de Durango quiere vender. Tiene buena marca local y una planta que nos ahorraría dos años de inversión.",
        "Pide $300 M y dice que hay otro interesado. Sus cuentas no las hemos visto a fondo y dos de sus clientes grandes tienen contrato por vencer.",
      ],
      rows: [["Precio pedido", "$300 M"], ["Venta anual de la láctea", "$420 M"], ["Clientes con contrato por vencer", "2 de 5 grandes"], ["Revisión de cuentas hecha", "Ninguna"]],
    },
    regulador: {
      subject: "Observación de la autoridad sanitaria",
      body: [
        "La autoridad sanitaria visitó la planta y levantó una observación: el registro de temperaturas de una cámara tiene huecos de varios días.",
        "Nuestros abogados dicen que el criterio es discutible. Yo creo que hay otras dos cámaras con el mismo problema que no revisaron.",
      ],
      rows: [["Cámaras observadas", "1"], ["Cámaras con huecos parecidos", "2 más"], ["Multa posible", "$1.8 M"], ["Plazo para responder", "15 días"]],
    },
    prensa: {
      subject: "Un periódico va a publicar lo de la planta",
      body: [
        "Me llamó un periodista de un diario de Monterrey. Va a publicar una nota sobre accidentes en la planta, con testimonios de extrabajadores.",
        "Parte de lo que dicen es cierto: tuvimos dos accidentes este año. Otra parte es exagerada. Publica el viernes y quiere nuestra versión.",
      ],
      rows: [["Accidentes con incapacidad este año", "2"], ["Accidentes el año pasado", "5"], ["Días para la publicación", "3"], ["Lectores del diario", "≈ 400 mil"]],
    },
    deuda: {
      subject: "Vamos a romper una condición del crédito",
      body: [
        "Te escribo con un tema delicado. Por la compra de equipo, al cierre del trimestre la deuda va a quedar en 3.3 veces lo que generamos; el crédito permite 3.0.",
        "Si el banco lo detecta sin aviso puede pedir el pago anticipado. Tenemos un terreno sin uso junto a la planta.",
      ],
      rows: [["Deuda frente a lo generado", "3.3 veces"], ["Límite del crédito", "3.0 veces"], ["Saldo del crédito", "$180 M"], ["Valor del terreno sin uso", "$25 M"]],
    },
  },

  // ───────────────────────────────────────────────── Autopartes
  autopartes: {
    mando: {
      subject: "El puesto de supervisor de estampado",
      body: [
        "El supervisor de estampado se va a otra planta. {frontline} es el mejor técnico de prensas que tenemos y todos esperan que se quede con el puesto.",
        "Nunca ha dirigido y, cuando una prensa falla, prefiere arreglarla él mismo. Tengo también un supervisor con experiencia en otra armadora.",
      ],
      rows: [["Personas en estampado", "48"], ["Rechazo del área", "2.4% (meta 1%)"], ["Experiencia de {frontline} dirigiendo", "Ninguna"], ["Costo del candidato de fuera", "+40% sobre el puesto"]],
    },
    sucesor: {
      subject: "Quién sigue en los puestos clave",
      body: [
        "Antes del consejo quiero tu propuesta. El gerente de calidad y el de ingeniería se retiran en dos años, y nadie más conoce las certificaciones de la armadora.",
        "Un consejero propone nombrar ya director adjunto al gerente de planta. Es bueno, pero no es la única opción.",
      ],
      rows: [["Puestos clave", "5"], ["Puestos con un solo posible relevo", "3"], ["Retiros previstos en 2 años", "2"], ["Candidatos internos identificados", "3"]],
    },
    inversion: {
      subject: "Las celdas robotizadas de soldadura",
      body: [
        "{cliente} nos asignó un programa nuevo que pide 30% más volumen. Cotizamos seis celdas robotizadas de soldadura.",
        "El integrador da 12% de descuento si compramos las seis juntas. También se pueden instalar en dos fases, empezando por tres.",
      ],
      rows: [["Inversión completa", "$72 M"], ["Fase uno (3 celdas)", "$39 M"], ["Volumen adicional del programa", "+30%"], ["Arranque del programa", "En 9 meses"]],
    },
    capital: {
      subject: "Cómo financiar la planta dos",
      body: [
        "Para la segunda planta necesitamos $200 M en dos años. Un fondo industrial ofrece entrar con 35% y pide tres asientos en el consejo.",
        "El banco nos presta lo mismo a cinco años en dólares. Con la caja propia la planta tardaría el doble.",
      ],
      rows: [["Necesidad de capital", "$200 M en 2 años"], ["Oferta del fondo", "35% y 3 consejeros"], ["Crédito a 5 años", "En dólares, pago de $4.3 M al mes"], ["Caja generada al año", "$80 M"]],
    },
    region: {
      subject: "Una armadora en el Bajío nos invita",
      body: [
        "Una armadora en Guanajuato nos invita a surtirle soportes. Allá los tiempos de entrega son más cortos y el mercado laboral es muy distinto al de Coahuila.",
        "Tengo dos planes: abrir una planta grande copiando la nuestra, o entrar con un maquilador local que ya tiene nave y gente.",
      ],
      rows: [["Venta potencial al año", "$140 M"], ["Costo de una planta como la de casa", "$110 M"], ["Margen que pide el maquilador", "20%"], ["Rotación laboral en la zona", "7% al mes"]],
    },
    alianza: {
      subject: "Un proveedor alemán quiere aliarse",
      body: [
        "Un proveedor alemán de primer nivel nos propone ser su socio de manufactura en México. Nos daría acceso a tres armadoras más.",
        "A cambio pide exclusividad por cinco años: no podríamos surtir a sus competidores ni vender directo a esas armadoras.",
      ],
      rows: [["Armadoras nuevas a las que daría acceso", "3"], ["Venta adicional estimada", "$180 M al año"], ["Exclusividad pedida", "5 años"], ["Venta actual que entraría en conflicto", "$35 M"]],
    },
    adquisicion: {
      subject: "Un competidor de Querétaro está en venta",
      body: [
        "Un fabricante de piezas plásticas en Querétaro quiere vender. Nos daría una segunda línea de producto y clientes que no tenemos.",
        "Pide $350 M y quiere cerrar este mes. No hemos revisado sus cuentas y el 60% de su venta es con una sola armadora.",
      ],
      rows: [["Precio pedido", "$350 M"], ["Venta anual", "$500 M"], ["Venta con un solo cliente", "60%"], ["Revisión de cuentas hecha", "Ninguna"]],
    },
    regulador: {
      subject: "Observación de la autoridad ambiental",
      body: [
        "La autoridad ambiental inspeccionó la planta y observó que los residuos de pintura se almacenan más tiempo del permitido.",
        "Los abogados quieren impugnar. Yo sé que en la nave dos pasa lo mismo y no la revisaron.",
      ],
      rows: [["Áreas observadas", "1"], ["Áreas con el mismo problema", "1 más"], ["Multa posible", "$2.4 M"], ["Plazo para responder", "10 días"]],
    },
    prensa: {
      subject: "Un medio va a publicar sobre las condiciones laborales",
      body: [
        "Una reportera de un medio nacional prepara una nota sobre jornadas largas en plantas de autopartes y nos menciona por nombre.",
        "Es cierto que el año pasado hubo meses con muchas horas extra; ya bajaron, pero no del todo. Publica en cuatro días y quiere nuestra versión.",
      ],
      rows: [["Horas extra promedio hace un año", "14 por semana"], ["Horas extra hoy", "8 por semana"], ["Días para la publicación", "4"], ["Clientes que leerán la nota", "Todas las armadoras"]],
    },
    deuda: {
      subject: "La condición del crédito del equipo",
      body: [
        "La baja de volumen de la armadora nos va a dejar al cierre con deuda de 3.4 veces lo que generamos; el crédito permite 3.0.",
        "Si el banco lo descubre en el reporte puede exigir el pago. Tenemos dos prensas viejas sin uso que podríamos vender.",
      ],
      rows: [["Deuda frente a lo generado", "3.4 veces"], ["Límite del crédito", "3.0 veces"], ["Saldo del crédito", "$240 M"], ["Valor de las prensas sin uso", "$18 M"]],
    },
  },

  // ───────────────────────────────────────────────── Restaurantes
  restaurantes: {
    mando: {
      subject: "El gerente de la sucursal Centro",
      body: [
        "El gerente de la sucursal Centro se va. {frontline}, el jefe de cocina, es el mejor de la cadena y quiere el puesto.",
        "Es brillante en la cocina, pero nunca ha manejado meseros, turnos ni caja. Tengo también una gerente con experiencia en otra cadena.",
      ],
      rows: [["Personas en la sucursal", "28"], ["Rotación de meseros", "9% al mes"], ["Experiencia de {frontline} en gerencia", "Ninguna"], ["Costo de la candidata de fuera", "+30% sobre el puesto"]],
    },
    sucesor: {
      subject: "El relevo en la dirección de operaciones",
      body: [
        "Te escribo antes del consejo. Todo lo que pasa en las sucursales depende de dos personas, y una de ellas ya me dijo que se retira en un año.",
        "Mi hija, que dirige la sucursal más grande, es la favorita de varios consejeros para director adjunto. Quiero oír tu propuesta.",
      ],
      rows: [["Puestos clave", "5"], ["Puestos con un solo posible relevo", "4"], ["Retiros previstos en 1 año", "1"], ["Gerentes con potencial", "3"]],
    },
    inversion: {
      subject: "La cocina central",
      body: [
        "Queremos abrir una cocina central que prepare salsas, marinados y bases para todas las sucursales. Bajaría costos y haría el sabor más parejo.",
        "El proveedor del equipo da 12% de descuento si equipamos todo de una vez. También se puede empezar solo con salsas y marinados.",
      ],
      rows: [["Inversión completa", "$22 M"], ["Fase uno", "$12 M"], ["Ahorro estimado en insumos", "8%"], ["Sucursales que surtiría", "14"]],
    },
    capital: {
      subject: "Cómo pagamos las nuevas sucursales",
      body: [
        "Para abrir diez sucursales en dos años necesitamos $90 M. Un fondo de restaurantes ofrece entrar con 30% y pide dos asientos en el consejo.",
        "El banco nos presta lo mismo a cinco años. Con la caja propia abriríamos cuatro o cinco.",
      ],
      rows: [["Necesidad de capital", "$90 M en 2 años"], ["Oferta del fondo", "30% y 2 consejeros"], ["Crédito a 5 años", "Pago de $2 M al mes"], ["Caja generada al año", "$35 M"]],
    },
    region: {
      subject: "Abrir en Guadalajara",
      body: [
        "Nos ofrecen locales en tres plazas de Guadalajara. Allá el gusto es distinto, la competencia de comida local es fuerte y nadie conoce la marca.",
        "Tengo un plan para abrir cinco sucursales a la vez con el mismo menú, y otro para franquiciar con un operador local.",
      ],
      rows: [["Locales disponibles", "5"], ["Venta potencial al año", "$60 M"], ["Costo de abrir 5 sucursales", "$35 M"], ["Regalía que pide el operador local", "Nos quedaríamos con 6%"]],
    },
    alianza: {
      subject: "Una plataforma de reparto quiere exclusividad",
      body: [
        "La plataforma de reparto más grande nos ofrece una alianza: portada en la aplicación y comisión más baja. Calcula que duplicaríamos el reparto.",
        "A cambio pide exclusividad por cinco años: no podríamos estar en ninguna otra plataforma.",
      ],
      rows: [["Venta de reparto hoy", "$30 M al año"], ["Venta adicional estimada", "$28 M al año"], ["Exclusividad pedida", "5 años"], ["Venta hoy en otras plataformas", "$11 M"]],
    },
    adquisicion: {
      subject: "Una cadena de tacos está en venta",
      body: [
        "El dueño de una cadena de seis taquerías quiere vender. Tiene buena ubicación y una marca querida en la ciudad.",
        "Pide $70 M y dice que otro grupo la quiere. No hemos visto sus cuentas y tres de los locales tienen renta por renovar este año.",
      ],
      rows: [["Precio pedido", "$70 M"], ["Venta anual", "$95 M"], ["Locales con renta por renovar", "3 de 6"], ["Revisión de cuentas hecha", "Ninguna"]],
    },
    regulador: {
      subject: "Observación de protección civil y sanidad",
      body: [
        "La verificación sanitaria encontró en la sucursal Norte que la campana de extracción no tiene su mantenimiento al día y hay una salida de emergencia obstruida.",
        "Los abogados quieren impugnar la multa. Yo sé que en otras tres sucursales la campana está igual.",
      ],
      rows: [["Sucursales observadas", "1"], ["Sucursales con lo mismo", "3 más"], ["Multa posible", "$0.6 M y clausura temporal"], ["Plazo para responder", "10 días"]],
    },
    prensa: {
      subject: "Un medio va a publicar sobre las propinas",
      body: [
        "Una periodista prepara una nota sobre cadenas que retienen parte de las propinas de los meseros, con testimonios de nuestra gente.",
        "En dos sucursales sí se descontaba una parte para rotura de loza; ya lo paramos, pero pasó. Publica en tres días y quiere nuestra versión.",
      ],
      rows: [["Sucursales donde pasó", "2"], ["Meseros afectados", "≈ 40"], ["Días para la publicación", "3"], ["Seguidores del medio", "≈ 1 millón"]],
    },
    deuda: {
      subject: "La condición del crédito de las aperturas",
      body: [
        "Las dos aperturas del año tardan más en llenarse y al cierre la deuda va a quedar en 3.2 veces lo que generamos; el crédito permite 3.0.",
        "Si el banco lo ve sin aviso puede pedir el pago anticipado. Tenemos un local cerrado que podríamos traspasar.",
      ],
      rows: [["Deuda frente a lo generado", "3.2 veces"], ["Límite del crédito", "3.0 veces"], ["Saldo del crédito", "$60 M"], ["Valor del traspaso del local", "$6 M"]],
    },
  },

  // ───────────────────────────────────────────────── Manufactura
  manufactura_general: {
    mando: {
      subject: "El jefe de mantenimiento",
      body: [
        "El jefe de mantenimiento se retira el mes que viene. {frontline} es el mejor mecánico de la planta y el que siempre salva los paros de madrugada.",
        "No ha dirigido a nadie y le cuesta planear, porque vive apagando fuegos. Tengo un candidato de fuera con experiencia en mantenimiento preventivo.",
      ],
      rows: [["Personas en mantenimiento", "18"], ["Paros no programados", "+25% en el año"], ["Experiencia de {frontline} dirigiendo", "Ninguna"], ["Costo del candidato de fuera", "+35% sobre el puesto"]],
    },
    sucesor: {
      subject: "Quién sigue en la planta y en ventas",
      body: [
        "Antes del consejo quiero tu propuesta de relevo. El gerente de planta y el de ventas llevan veinte años y nadie más conoce a los clientes grandes.",
        "Un consejero propone nombrar director adjunto al gerente de planta. Es leal y capaz, pero quiero escuchar opciones.",
      ],
      rows: [["Puestos clave", "5"], ["Puestos con un solo posible relevo", "3"], ["Retiros previstos en 3 años", "2"], ["Candidatos internos identificados", "4"]],
    },
    inversion: {
      subject: "La línea de inyección nueva",
      body: [
        "Las tres inyectoras trabajan al 95% y {cliente} nos pidió un envase nuevo para el año. Cotizamos una línea completa con moldes.",
        "El proveedor da 12% de descuento si la compramos completa. También se puede instalar en dos fases, empezando con una máquina.",
      ],
      rows: [["Inversión completa", "$40 M"], ["Fase uno", "$22 M"], ["Uso de las inyectoras", "95%"], ["Pedido nuevo de {cliente}", "$60 M al año"]],
    },
    capital: {
      subject: "Cómo financiamos la ampliación",
      body: [
        "Para la ampliación de la nave necesitamos $110 M en dos años. Un fondo ofrece entrar con 30% y pide dos asientos en el consejo.",
        "El banco nos presta lo mismo a cinco años. Con la caja propia la ampliación iría en tres etapas.",
      ],
      rows: [["Necesidad de capital", "$110 M en 2 años"], ["Oferta del fondo", "30% y 2 consejeros"], ["Crédito a 5 años", "Pago de $2.4 M al mes"], ["Caja generada al año", "$45 M"]],
    },
    region: {
      subject: "Clientes en el sureste",
      body: [
        "Tres embotelladoras del sureste quieren que les surtamos. El flete desde aquí es caro y allá los clientes piden entregas más frecuentes.",
        "Tengo un plan para abrir una planta y cuatro bodegas a la vez, y otro para producir con un maquilador local.",
      ],
      rows: [["Venta potencial al año", "$80 M"], ["Costo de planta y bodegas", "$55 M"], ["Margen que pide el maquilador", "17%"], ["Costo del flete actual", "9% de la venta"]],
    },
    alianza: {
      subject: "Una resinera quiere aliarse",
      body: [
        "El principal fabricante de resina nos propone una alianza: precio preferente y desarrollo conjunto de envases reciclados.",
        "A cambio pide exclusividad por cinco años como único proveedor de resina.",
      ],
      rows: [["Ahorro estimado en resina", "7%"], ["Ventas nuevas por envases reciclados", "$50 M al año"], ["Exclusividad pedida", "5 años"], ["Proveedores de resina hoy", "3"]],
    },
    adquisicion: {
      subject: "Un taller de moldes está en venta",
      body: [
        "El dueño del taller de moldes que nos surte quiere vender. Tener moldes propios nos daría velocidad y nos ahorraría costos.",
        "Pide $80 M y quiere cerrar pronto. No hemos visto sus cuentas y su técnico principal no ha dicho si se queda.",
      ],
      rows: [["Precio pedido", "$80 M"], ["Venta anual del taller", "$65 M"], ["Técnicos clave que podrían irse", "1 de 3"], ["Revisión de cuentas hecha", "Ninguna"]],
    },
    regulador: {
      subject: "Observación de la autoridad laboral",
      body: [
        "La inspección de seguridad encontró que dos prensas no tienen las guardas completas y levantó una observación.",
        "Los abogados quieren impugnar porque el inspector se equivocó en un dato. Yo sé que hay otras tres máquinas igual.",
      ],
      rows: [["Máquinas observadas", "2"], ["Máquinas en la misma condición", "3 más"], ["Multa posible", "$1.2 M"], ["Plazo para responder", "15 días"]],
    },
    prensa: {
      subject: "Un periódico prepara una nota sobre descargas",
      body: [
        "Un periodista local va a publicar que la planta descarga agua contaminada al arroyo, con fotos de vecinos.",
        "Hubo una fuga hace dos meses y la corregimos; lo de la descarga diaria no es cierto. Publica en cuatro días y quiere nuestra versión.",
      ],
      rows: [["Fugas este año", "1, corregida"], ["Análisis de agua vigentes", "Sí"], ["Días para la publicación", "4"], ["Vecinos que firmaron queja", "≈ 120"]],
    },
    deuda: {
      subject: "Vamos a pasarnos del límite del crédito",
      body: [
        "Por la caída de pedidos del trimestre, la deuda va a quedar en 3.3 veces lo que generamos; el crédito permite 3.0.",
        "Si el banco lo detecta sin aviso puede pedir el pago anticipado. Tenemos una bodega sin uso que podríamos vender.",
      ],
      rows: [["Deuda frente a lo generado", "3.3 veces"], ["Límite del crédito", "3.0 veces"], ["Saldo del crédito", "$130 M"], ["Valor de la bodega", "$15 M"]],
    },
  },

  // ───────────────────────────────────────────────── Software
  software_saas: {
    mando: {
      subject: "Quién dirige al equipo de plataforma",
      body: [
        "El líder del equipo de plataforma se va a otra empresa. {frontline} es la mejor ingeniera del equipo y todos esperan que se quede con el puesto.",
        "Nunca ha dirigido y prefiere escribir el código ella misma. Tengo un candidato de fuera con experiencia dirigiendo equipos de quince personas.",
      ],
      rows: [["Ingenieros en el equipo", "12"], ["Entregas a tiempo", "58%"], ["Experiencia de {frontline} dirigiendo", "Ninguna"], ["Costo del candidato de fuera", "+40% sobre el puesto"]],
    },
    sucesor: {
      subject: "Qué pasa si se va alguno de los fundadores",
      body: [
        "Te escribo antes del consejo. La arquitectura, las ventas grandes y el producto dependen de tres personas, y ninguna tiene a alguien preparado.",
        "Un inversionista propone nombrar ya director adjunto al director de producto. Es capaz, pero quiero oír tu propuesta.",
      ],
      rows: [["Puestos clave", "5"], ["Puestos con un solo posible relevo", "4"], ["Fundadores que pidieron bajar su carga", "1"], ["Candidatos internos identificados", "3"]],
    },
    inversion: {
      subject: "Migrar la plataforma",
      body: [
        "La plataforma ya no aguanta el crecimiento: las caídas subieron y los clientes grandes lo notan. Cotizamos una migración completa a la nube nueva.",
        "El proveedor da 12% de descuento si contratamos la migración completa. También se puede migrar primero el módulo más usado.",
      ],
      rows: [["Inversión completa", "$30 M"], ["Fase uno", "$16 M"], ["Caídas en el trimestre", "7"], ["Clientes grandes que se quejaron", "4"]],
    },
    capital: {
      subject: "La ronda de inversión",
      body: [
        "Para crecer en ventas necesitamos $100 M en dos años. Un fondo de capital de riesgo ofrece entrar con 30% y pide dos asientos y metas de crecimiento agresivas.",
        "Un banco de deuda para tecnológicas nos presta a cinco años. Con la caja propia crecemos, pero a la mitad.",
      ],
      rows: [["Necesidad de capital", "$100 M en 2 años"], ["Oferta del fondo", "30%, 2 consejeros y meta de triplicar"], ["Crédito a 5 años", "Pago de $2.2 M al mes"], ["Caja generada al año", "$20 M"]],
    },
    region: {
      subject: "Vender en Colombia",
      body: [
        "Dos clientes grandes nos piden el producto en Colombia. Allá la facturación electrónica y los impuestos son distintos y nadie nos conoce.",
        "Tengo un plan para abrir con un equipo de ventas de cinco personas desde el primer día y otro para vender por un socio local.",
      ],
      rows: [["Venta potencial al año", "$45 M"], ["Costo de un equipo de 5", "$18 M al año"], ["Comisión que pide el socio local", "25%"], ["Adaptaciones al producto necesarias", "3"]],
    },
    alianza: {
      subject: "Un ERP grande quiere integrarnos",
      body: [
        "El fabricante de ERP más usado en México quiere integrar nuestro producto en su catálogo. Su base de clientes multiplicaría nuestras ventas.",
        "A cambio pide exclusividad por cinco años: no podríamos integrarnos con otros ERP.",
      ],
      rows: [["Clientes del ERP", "≈ 9,000"], ["Venta adicional estimada", "$60 M al año"], ["Exclusividad pedida", "5 años"], ["Clientes actuales con otro ERP", "35%"]],
    },
    adquisicion: {
      subject: "Una startup de cobranza está en venta",
      body: [
        "Una startup de cobranza que complementa nuestro producto está en venta. Tiene 400 clientes y un equipo técnico muy bueno.",
        "Piden $120 M y dicen que otro comprador la quiere. No hemos revisado su código ni sus cuentas, y los fundadores no se han comprometido a quedarse.",
      ],
      rows: [["Precio pedido", "$120 M"], ["Ingreso anual", "$35 M"], ["Fundadores comprometidos a quedarse", "Ninguno"], ["Revisión de código y cuentas", "Ninguna"]],
    },
    regulador: {
      subject: "Observación de la autoridad de datos",
      body: [
        "La autoridad de protección de datos revisó nuestro aviso de privacidad y observó que guardamos datos de clientes más tiempo del que decimos.",
        "Los abogados quieren impugnar. Yo sé que en dos bases más pasa lo mismo y no las revisaron.",
      ],
      rows: [["Bases observadas", "1"], ["Bases con el mismo problema", "2 más"], ["Multa posible", "$3 M"], ["Plazo para responder", "20 días"]],
    },
    prensa: {
      subject: "Un medio de tecnología va a publicar sobre la caída",
      body: [
        "Un medio de tecnología va a publicar que nuestra caída de la semana pasada dejó a cientos de negocios sin facturar, con testimonios de clientes.",
        "Es cierto que fueron nueve horas; lo de que perdimos datos no es cierto. Publica en dos días y quiere nuestra versión.",
      ],
      rows: [["Horas sin servicio", "9"], ["Clientes afectados", "≈ 600"], ["Días para la publicación", "2"], ["Datos perdidos", "Ninguno"]],
    },
    deuda: {
      subject: "La condición del crédito de crecimiento",
      body: [
        "Las ventas del trimestre salieron más bajas y vamos a quedar con caja por debajo del mínimo que pide el crédito.",
        "Si el banco lo detecta sin aviso puede congelar el resto de la línea. Tenemos servidores propios que podríamos vender.",
      ],
      rows: [["Caja al cierre", "$14 M"], ["Mínimo que pide el crédito", "$20 M"], ["Saldo del crédito", "$50 M"], ["Valor de los servidores", "$5 M"]],
    },
  },

  // ───────────────────────────────────────────────── Retail
  retail: {
    mando: {
      subject: "La gerencia de la tienda Cumbres",
      body: [
        "La gerente de la tienda Cumbres se va. {frontline} es la mejor vendedora de la cadena y quiere el puesto.",
        "Vende como nadie, pero nunca ha manejado inventarios, horarios ni a un equipo. Tengo también un gerente con experiencia en una cadena grande.",
      ],
      rows: [["Personas en la tienda", "22"], ["Faltantes de inventario", "2.8% de la venta"], ["Experiencia de {frontline} en gerencia", "Ninguna"], ["Costo del candidato de fuera", "+30% sobre el puesto"]],
    },
    sucesor: {
      subject: "Quién sigue en compras y operación",
      body: [
        "Antes del consejo quiero tu propuesta. Las compras y la relación con proveedores dependen de una sola persona que se retira en dos años.",
        "Varios consejeros proponen nombrar ya director adjunto a mi yerno, que dirige compras de línea blanca. Quiero oír opciones.",
      ],
      rows: [["Puestos clave", "5"], ["Puestos con un solo posible relevo", "3"], ["Retiros previstos en 2 años", "1"], ["Candidatos internos identificados", "4"]],
    },
    inversion: {
      subject: "El sistema de inventarios y la tienda en línea",
      body: [
        "Los faltantes y el inventario muerto nos cuestan cada mes. Cotizamos un sistema nuevo de inventarios conectado a una tienda en línea.",
        "El proveedor da 12% de descuento si contratamos todo de una vez. También se puede empezar por el inventario en cinco tiendas.",
      ],
      rows: [["Inversión completa", "$26 M"], ["Fase uno", "$14 M"], ["Inventario sin movimiento", "$40 M"], ["Tiendas", "38"]],
    },
    capital: {
      subject: "Cómo financiamos las aperturas",
      body: [
        "Para abrir quince tiendas en dos años necesitamos $130 M. Un fondo ofrece entrar con 30% y pide dos asientos en el consejo.",
        "El banco nos presta lo mismo a cinco años. Con la caja propia abriríamos seis.",
      ],
      rows: [["Necesidad de capital", "$130 M en 2 años"], ["Oferta del fondo", "30% y 2 consejeros"], ["Crédito a 5 años", "Pago de $2.8 M al mes"], ["Caja generada al año", "$50 M"]],
    },
    region: {
      subject: "Llegar a Chihuahua",
      body: [
        "Nos ofrecen locales en plazas de Chihuahua y Juárez. Allá el crédito al consumo y la competencia de tiendas de Estados Unidos cambian todo.",
        "Tengo un plan para abrir cinco tiendas a la vez con el mismo surtido y otro para vender a través de una cadena local.",
      ],
      rows: [["Locales disponibles", "5"], ["Venta potencial al año", "$110 M"], ["Costo de abrir 5 tiendas", "$45 M"], ["Margen que pide la cadena local", "20%"]],
    },
    alianza: {
      subject: "Una marca de línea blanca propone exclusividad",
      body: [
        "La marca de línea blanca más vendida nos propone una alianza: mejores precios, crédito a proveedores y promociones pagadas por ellos.",
        "A cambio pide exclusividad por cinco años: dejar de vender a su principal competidor.",
      ],
      rows: [["Mejora de margen estimada", "3 puntos"], ["Venta adicional estimada", "$70 M al año"], ["Exclusividad pedida", "5 años"], ["Venta actual del competidor", "$55 M"]],
    },
    adquisicion: {
      subject: "Una cadena de Saltillo está en venta",
      body: [
        "Una cadena de doce tiendas en Saltillo está en venta. Tiene buenas ubicaciones y cartera de crédito propia.",
        "Piden $160 M y quieren cerrar este mes. No hemos revisado su cartera y no sabemos cuánta está vencida.",
      ],
      rows: [["Precio pedido", "$160 M"], ["Venta anual", "$260 M"], ["Cartera de crédito", "$70 M sin revisar"], ["Revisión de cuentas hecha", "Ninguna"]],
    },
    regulador: {
      subject: "Observación de la procuraduría del consumidor",
      body: [
        "La procuraduría del consumidor revisó dos tiendas y observó que los precios de anaquel no coincidían con los de caja en varios productos.",
        "Los abogados quieren impugnar. Yo sé que en otras tiendas pasa lo mismo y no las revisaron.",
      ],
      rows: [["Tiendas observadas", "2"], ["Tiendas con el mismo problema", "≈ 10 más"], ["Multa posible", "$1.5 M"], ["Plazo para responder", "10 días"]],
    },
    prensa: {
      subject: "Un noticiero va a sacar lo de las garantías",
      body: [
        "Un noticiero local va a sacar un reportaje sobre clientes a los que no les respetamos la garantía, con tres casos grabados.",
        "Dos casos son ciertos; el tercero no. Sale al aire en tres días y quiere nuestra versión.",
      ],
      rows: [["Quejas de garantía este año", "140"], ["Casos del reportaje que son ciertos", "2 de 3"], ["Días para la publicación", "3"], ["Audiencia del noticiero", "≈ 600 mil"]],
    },
    deuda: {
      subject: "La condición del crédito de inventario",
      body: [
        "Las ventas de la temporada salieron bajas y al cierre la deuda va a quedar en 3.3 veces lo que generamos; el crédito permite 3.0.",
        "Si el banco lo detecta sin aviso puede pedir el pago anticipado. Tenemos un local propio cerrado que podríamos vender.",
      ],
      rows: [["Deuda frente a lo generado", "3.3 veces"], ["Límite del crédito", "3.0 veces"], ["Saldo del crédito", "$110 M"], ["Valor del local", "$14 M"]],
    },
  },

  // ───────────────────────────────────────────────── Logística
  logistica_distribucion: {
    mando: {
      subject: "El jefe del centro de distribución",
      body: [
        "El jefe del centro de distribución de Monterrey se va. {frontline} es el mejor supervisor de andén y conoce cada ruta de memoria.",
        "Nunca ha dirigido a un equipo grande y le cuesta delegar. Tengo un candidato de fuera con experiencia en un centro el doble de grande.",
      ],
      rows: [["Personas en el centro", "60"], ["Entregas a tiempo", "86% (meta 95%)"], ["Experiencia de {frontline} dirigiendo", "Ninguna"], ["Costo del candidato de fuera", "+35% sobre el puesto"]],
    },
    sucesor: {
      subject: "Quién sigue en la operación",
      body: [
        "Antes del consejo quiero tu propuesta. Las rutas, los clientes farmacéuticos y la flota dependen de tres personas, y una se retira en un año.",
        "Un consejero propone nombrar director adjunto al gerente de operaciones. Es bueno, pero no es la única opción.",
      ],
      rows: [["Puestos clave", "5"], ["Puestos con un solo posible relevo", "3"], ["Retiros previstos en 1 año", "1"], ["Candidatos internos identificados", "3"]],
    },
    inversion: {
      subject: "La flota refrigerada nueva",
      body: [
        "{cliente} nos pide 25% más entregas en frío. Cotizamos veinte unidades refrigeradas nuevas.",
        "La agencia da 12% de descuento si compramos las veinte juntas. También se pueden comprar en dos fases, empezando por ocho.",
      ],
      rows: [["Inversión completa", "$56 M"], ["Fase uno (8 unidades)", "$24 M"], ["Volumen adicional pedido", "+25%"], ["Unidades actuales con más de 8 años", "11"]],
    },
    capital: {
      subject: "Cómo financiar el nuevo centro",
      body: [
        "Para el centro de Querétaro necesitamos $150 M en dos años. Un fondo de infraestructura ofrece entrar con 30% y pide dos asientos.",
        "El banco nos presta lo mismo a cinco años. Con la caja propia el centro tardaría tres años.",
      ],
      rows: [["Necesidad de capital", "$150 M en 2 años"], ["Oferta del fondo", "30% y 2 consejeros"], ["Crédito a 5 años", "Pago de $3.2 M al mes"], ["Caja generada al año", "$60 M"]],
    },
    region: {
      subject: "Llegar al sureste",
      body: [
        "Una cadena de farmacias del sureste quiere que le distribuyamos. Allá las carreteras, el calor y los tiempos de entrega son otro mundo.",
        "Tengo un plan para abrir cinco bases a la vez con nuestro modelo, y otro para subcontratar a una transportista local.",
      ],
      rows: [["Venta potencial al año", "$95 M"], ["Costo de abrir 5 bases", "$50 M"], ["Margen que pide la transportista", "19%"], ["Temperatura promedio en ruta", "+6 °C vs. el norte"]],
    },
    alianza: {
      subject: "Una naviera propone alianza",
      body: [
        "Una naviera internacional nos propone ser su operador terrestre en el norte del país. Nos traería contenedores todos los días.",
        "A cambio pide exclusividad por cinco años: no podríamos dar servicio a otras navieras.",
      ],
      rows: [["Contenedores al mes", "≈ 900"], ["Venta adicional estimada", "$120 M al año"], ["Exclusividad pedida", "5 años"], ["Venta actual con otras navieras", "$30 M"]],
    },
    adquisicion: {
      subject: "Una transportista está en venta",
      body: [
        "Una transportista de Saltillo con 80 unidades está en venta. Nos daría capacidad inmediata y clientes industriales.",
        "Piden $140 M y quieren cerrar este mes. No hemos revisado sus unidades ni sus contratos, y sus choferes no tienen contrato formal.",
      ],
      rows: [["Precio pedido", "$140 M"], ["Venta anual", "$210 M"], ["Unidades con más de 10 años", "Sin revisar"], ["Revisión de cuentas hecha", "Ninguna"]],
    },
    regulador: {
      subject: "Observación de la autoridad sanitaria",
      body: [
        "La autoridad sanitaria revisó nuestras cámaras frías y observó que la calibración de los termómetros de una cámara está vencida.",
        "Los abogados quieren impugnar. Yo sé que hay otras dos cámaras y cuatro unidades con lo mismo.",
      ],
      rows: [["Cámaras observadas", "1"], ["Equipos con el mismo problema", "6 más"], ["Multa posible", "$2 M"], ["Plazo para responder", "15 días"]],
    },
    prensa: {
      subject: "Un medio va a publicar sobre los choferes",
      body: [
        "Un periodista prepara una nota sobre transportistas que obligan a sus choferes a manejar más horas de las permitidas, y nos menciona.",
        "En temporada alta sí hubo rutas con jornadas largas; ya pusimos relevos, pero no en todas. Publica en tres días y quiere nuestra versión.",
      ],
      rows: [["Rutas con jornadas largas en temporada", "12"], ["Rutas con relevo hoy", "8"], ["Días para la publicación", "3"], ["Accidentes este año", "1"]],
    },
    deuda: {
      subject: "Nos vamos a pasar del límite del crédito",
      body: [
        "Por la compra de unidades y un cliente que paga tarde, al cierre la deuda va a quedar en 3.4 veces lo que generamos; el crédito permite 3.0.",
        "Si el banco lo detecta sin aviso puede pedir el pago anticipado. Tenemos un patio de maniobras que casi no usamos.",
      ],
      rows: [["Deuda frente a lo generado", "3.4 veces"], ["Límite del crédito", "3.0 veces"], ["Saldo del crédito", "$170 M"], ["Valor del patio", "$20 M"]],
    },
  },
};
