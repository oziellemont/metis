/**
 * mêtis CEO · Banco de casos (P1-D) · hechos por industria de las ocho decisiones nuevas.
 * Mismas llaves que contexts.ts. Cifras en pesos para la empresa establecida (en PYME se escalan).
 */
import type { CaseFacts } from "./contexts";

export type P1DId = "guerra" | "verde" | "trimestre" | "incidente" | "salarios" | "meta" | "foco" | "adaptativo";

export const P1D_FACTS: Readonly<Record<string, Record<P1DId, CaseFacts>>> = {
  // ─────────────────────────────────────────────── Alimentos y bebidas
  alimentos_bebidas: {
    guerra: {
      subject: "Nos están bajando el precio en anaquel",
      body: [
        "Te escribo urgente. Una marca regional bajó 15% el precio de sus botanas en las cadenas del norte y ya perdimos espacio en dos.",
        "Mis vendedores me piden igualar en todo. Yo creo que hay que hacer algo esta semana, antes de que las cadenas nos pidan lo mismo.",
      ],
      rows: [["Baja del competidor", "−15% en botanas"], ["Venta en riesgo", "$18 M al año"], ["Clientes que ya preguntaron", "2 cadenas"], ["Costo de igualar en todo", "$12 M de margen al año"]],
    },
    verde: {
      subject: "{frontline}",
      body: [
        "Perdón por escribirle directo.",
        "La línea nueva de bebidas aparece en verde en el reporte, pero lleva tres semanas parada la mitad del tiempo. Le estamos poniendo horas extra para que no se note.",
        "Si sigue así no llegamos al lanzamiento con {cliente}. No sé si estoy haciendo bien en decírselo.",
      ],
      rows: [["Estado en el reporte", "Verde, en tiempo"], ["Disponibilidad real de la línea", "≈ 55%"], ["Horas extra del mes", "+40%"], ["Lanzamiento con {cliente}", "En 5 semanas"]],
    },
    trimestre: {
      subject: "Antes de la sesión: el número del trimestre",
      body: [
        "Te escribo antes de la sesión. Vamos 6% abajo de la utilidad prometida para el trimestre.",
        "Te propongo lo de siempre: aplazar el mantenimiento mayor de la planta y la capacitación de supervisores. Con eso llegamos. El consejo necesita ver que cumplimos.",
      ],
      rows: [["Utilidad vs. compromiso", "−6%"], ["Mantenimiento mayor", "$3.5 M, ya aplazado una vez"], ["Capacitación de supervisores", "$1.2 M"], ["Paros no programados este año", "+30%"]],
    },
    incidente: {
      subject: "Llamada perdida · {ops} (Planta)",
      body: [
        "Jefe, se hizo viral un video: en la puerta de la planta un guardia le negó la entrada a un repartidor y lo trató muy mal. Ya lleva medio millón de vistas.",
        "El guardia siguió la regla de no dejar pasar a nadie sin cita, pero la forma fue terrible. Ya preguntaron dos periódicos y una cadena nos pidió explicación.",
      ],
      rows: [["Vistas del video", "≈ 500 mil"], ["Medios que preguntaron", "2"], ["Cliente que pidió explicación", "{cliente}"], ["Costo de capacitar a toda la planta", "$0.8 M y medio turno"]],
    },
    salarios: {
      subject: "Lo que encontramos en los sueldos",
      body: [
        "Te comparto algo que no me gustó. Los operadores de línea ganan 18% menos que en las plantas vecinas y la rotación ya es de 45% al año.",
        "Además, hay operadores nuevos que entran ganando casi lo mismo que los que llevan diez años. La gente lo sabe y se nota.",
      ],
      rows: [["Rotación de operadores", "45% al año"], ["Sueldo vs. el mercado", "−18%"], ["Costo de subir el piso", "$9 M al año"], ["Bono directivo del año", "$4 M"]],
    },
    meta: {
      subject: "{frontline}",
      body: [
        "Le escribo porque no sé a quién más decirle.",
        "Para llegar a la fecha de {cliente} nos pidieron firmar los análisis de vida de anaquel con la mitad de los días de prueba. Dicen que siempre sale bien.",
        "Yo no quiero firmar algo que no probamos.",
      ],
      rows: [["Días de prueba requeridos", "90"], ["Días que llevamos", "45"], ["Entrega comprometida", "En 3 semanas"], ["Pedido inicial de {cliente}", "$14 M"]],
    },
    foco: {
      subject: "Tenemos 240 productos y 40 hacen el dinero",
      body: [
        "Te mando el análisis del portafolio. El 17% de los productos hace el 80% de la venta, y los cambios de formato en planta se comen un turno al día.",
        "Hay presentaciones que vendemos a dos tiendas. Necesito que decidas qué hacemos.",
      ],
      rows: [["Productos activos", "240"], ["Productos que hacen el 80% de la venta", "41"], ["Productos con margen negativo", "58"], ["Tiempo de planta en cambios de formato", "≈ 1 turno al día"]],
    },
    adaptativo: {
      subject: "Necesitamos que decidas tú",
      body: [
        "Te escribo porque ya no podemos solos. Comercial vende entregas en 24 horas a las tienditas y Planta produce en lotes grandes para que el costo salga.",
        "Ellos dicen que Planta no entiende al mercado; nosotros, que Comercial promete lo que no se puede. Dinos quién tiene razón.",
      ],
      rows: [["Pedidos entregados a tiempo", "71%"], ["Inventario de producto terminado", "+25% en el año"], ["Quejas de clientes por surtido", "+40%"], ["Juntas entre áreas este mes", "0"]],
    },
  },

  // ─────────────────────────────────────────────── Autopartes
  autopartes: {
    guerra: {
      subject: "Un proveedor asiático entró con 18% abajo",
      body: [
        "Te escribo urgente. Un fabricante asiático con planta en Saltillo ofreció a {cliente} los mismos soportes 18% más baratos para los modelos nuevos.",
        "Compras de la armadora ya nos preguntó si podemos igualar. Mis vendedores dicen que si no igualamos, perdemos el programa completo.",
      ],
      rows: [["Precio del competidor", "−18%"], ["Programa en juego", "$95 M al año"], ["Costo de igualar en todo", "$22 M de margen al año"], ["Calidad del competidor en la armadora", "Sin historial"]],
    },
    verde: {
      subject: "{frontline}",
      body: [
        "Ingeniero, perdón que le escriba directo.",
        "El lanzamiento de la pieza nueva aparece en verde, pero las primeras corridas salen con 9% de rechazo. Lo estamos retrabajando a mano para que no se vea.",
        "Si {cliente} lo audita, nos va a ir muy mal.",
      ],
      rows: [["Estado en el reporte", "Verde, en tiempo"], ["Rechazo real", "9% (meta 1%)"], ["Horas de retrabajo a la semana", "≈ 300"], ["Arranque de producción de {cliente}", "En 6 semanas"]],
    },
    trimestre: {
      subject: "El número del trimestre y la sesión del jueves",
      body: [
        "Te escribo antes de la sesión. El trimestre va 8% abajo por la baja de volumen de la armadora.",
        "Propongo aplazar el cambio de moldes y el programa de certificación de técnicos. Con eso llegamos y no tenemos que explicar nada.",
      ],
      rows: [["Utilidad vs. compromiso", "−8%"], ["Cambio de moldes aplazado", "$6 M"], ["Certificación de técnicos", "$1.5 M"], ["Moldes fuera de vida útil", "4 de 22"]],
    },
    incidente: {
      subject: "Llamada perdida · {ops} (Operaciones)",
      body: [
        "Director, circula un video de un supervisor nuestro gritándole y empujando a un operador en la línea. Lo subió un compañero y ya lo compartió un sindicato estadounidense.",
        "El supervisor dice que el operador se saltó un paro de seguridad. {cliente} ya pidió un reporte de condiciones laborales por la auditoría del tratado comercial.",
      ],
      rows: [["Vistas del video", "≈ 300 mil"], ["Cliente que pidió reporte", "{cliente}"], ["Auditoría laboral del tratado", "Posible"], ["Costo de capacitar a todos los supervisores", "$1.1 M"]],
    },
    salarios: {
      subject: "La rotación de operadores y los sueldos",
      body: [
        "Te comparto un análisis delicado. Las plantas vecinas pagan 15% más a operadores y técnicos, y la rotación ya llegó a 6% al mes.",
        "Hay técnicos con ocho años que ganan menos que los que contratamos el mes pasado, porque a los nuevos tuvimos que pagarles a precio de mercado.",
      ],
      rows: [["Rotación mensual", "6%"], ["Sueldo vs. plantas vecinas", "−15%"], ["Costo de subir el piso", "$14 M al año"], ["Costo de entrenar a un operador nuevo", "$45 mil"]],
    },
    meta: {
      subject: "{frontline}",
      body: [
        "Ingeniero, le escribo porque me pidieron algo que no está bien.",
        "Para cumplir el PPAP de {cliente} a tiempo me pidieron reportar las mediciones con el calibrador anterior, que sí da dentro de tolerancia. El nuevo no.",
        "No quiero meterme en problemas, pero tampoco quiero firmar eso.",
      ],
      rows: [["Piezas fuera de tolerancia con el calibrador nuevo", "≈ 7%"], ["Entrega del PPAP", "En 10 días"], ["Programa en juego", "$60 M al año"], ["Penalización por retraso", "$0.5 M a la semana"]],
    },
    foco: {
      subject: "Fabricamos 600 números de parte para 9 clientes",
      body: [
        "Te mando el análisis. Tres clientes y 80 números de parte hacen el 75% de la utilidad.",
        "El resto son piezas de servicio de modelos viejos y pedidos chicos que nos obligan a cambiar herramental todo el día.",
      ],
      rows: [["Números de parte activos", "≈ 600"], ["Números de parte con margen negativo", "140"], ["Cambios de herramental por semana", "65"], ["Clientes con menos de 2% de la venta", "5"]],
    },
    adaptativo: {
      subject: "Necesitamos que tú decidas",
      body: [
        "Te escribo porque esto ya se volvió personal. Calidad quiere parar la línea con cualquier desviación; Producción dice que así nunca vamos a llegar a la meta diaria.",
        "La armadora nos está pidiendo las dos cosas. Dinos quién manda.",
      ],
      rows: [["Paros de línea por Calidad este mes", "18"], ["Cumplimiento de la meta diaria", "86%"], ["Reclamos de {cliente}", "3 en el trimestre"], ["Rotación de supervisores", "2 renuncias este mes"]],
    },
  },

  // ─────────────────────────────────────────────── Restaurantes
  restaurantes: {
    guerra: {
      subject: "La cadena de enfrente lanzó combos a $99",
      body: [
        "Te escribo preocupada. La cadena nueva de enfrente lanzó combos a 99 pesos y en las sucursales cercanas bajamos 12% de comensales en dos semanas.",
        "Los gerentes quieren hacer lo mismo en todo el menú. Yo creo que hay que responder ya.",
      ],
      rows: [["Comensales en sucursales cercanas", "−12%"], ["Ticket promedio", "$310"], ["Costo de bajar todo el menú", "$8 M de margen al año"], ["Sucursales afectadas", "9 de 34"]],
    },
    verde: {
      subject: "{frontline}",
      body: [
        "Hola, perdón que te escriba directo.",
        "En el reporte la sucursal del centro sale en verde en tiempos de servicio, pero es porque marcamos la comanda como entregada antes de servirla.",
        "La gente se está quejando y los meseros ya no saben qué decir. No quiero meter en problemas a nadie.",
      ],
      rows: [["Tiempo reportado", "12 minutos"], ["Tiempo real medido", "≈ 24 minutos"], ["Reseñas negativas del mes", "+60%"], ["Sucursales con el mismo reporte", "No sabemos"]],
    },
    trimestre: {
      subject: "Antes del consejo: el trimestre",
      body: [
        "Te escribo antes del consejo. El trimestre va 7% abajo en utilidad por el costo de la carne.",
        "Propongo aplazar la remodelación de cocinas y la capacitación de meseros. Con eso cumplimos y los socios quedan tranquilos.",
      ],
      rows: [["Utilidad vs. compromiso", "−7%"], ["Remodelación de cocinas aplazada", "$4 M"], ["Capacitación de meseros", "$0.6 M"], ["Fallas de equipo de cocina este año", "+35%"]],
    },
    incidente: {
      subject: "Llamada perdida · {ops} (Operaciones)",
      body: [
        "Director, un video de una de nuestras sucursales se volvió viral: un gerente le negó el baño a una señora con un niño porque no habían consumido.",
        "Es la regla que pusimos para controlar a los que entran de la calle. Ya lo compartieron dos influencers y nos están etiquetando.",
      ],
      rows: [["Vistas del video", "≈ 1.2 millones"], ["Menciones negativas hoy", "≈ 8 mil"], ["Sucursales con la misma regla", "34"], ["Costo de cerrar medio día para capacitar", "$1.5 M"]],
    },
    salarios: {
      subject: "Las propinas y los sueldos de cocina",
      body: [
        "Te comparto algo que nos está costando gente. Los meseros ganan casi el triple que los cocineros gracias a las propinas, y la cocina ya rota 80% al año.",
        "Los cocineros lo saben. Ayer renunciaron dos de los mejores para irse a una cadena que comparte propinas con cocina.",
      ],
      rows: [["Rotación en cocina", "80% al año"], ["Ingreso de mesero vs. cocinero", "≈ 3 a 1"], ["Costo de subir el piso de cocina", "$5 M al año"], ["Bono directivo del año", "$2 M"]],
    },
    meta: {
      subject: "{frontline}",
      body: [
        "Hola, te escribo porque no me siento bien con esto.",
        "Para cumplir la meta de merma nos pidieron reetiquetar con fecha nueva los insumos que ya vencieron. Dicen que todavía están buenos.",
        "Yo no quiero servir algo así.",
      ],
      rows: [["Meta de merma", "2%"], ["Merma real", "4.5%"], ["Bono del gerente ligado a la merma", "Sí"], ["Sucursales con el mismo patrón", "Al menos 3"]],
    },
    foco: {
      subject: "El menú tiene 140 platillos",
      body: [
        "Te mando el análisis. Treinta platillos hacen el 70% de la venta, y la cocina tiene que tener insumos para 140.",
        "La merma y los tiempos de servicio vienen de ahí. Los chefs defienden sus platillos, pero los números son claros.",
      ],
      rows: [["Platillos en el menú", "140"], ["Platillos que hacen el 70% de la venta", "30"], ["Merma de insumos", "4.5%"], ["Tiempo promedio de preparación", "+40% vs. hace dos años"]],
    },
    adaptativo: {
      subject: "Decide tú, por favor",
      body: [
        "Te escribo porque ya no nos estamos poniendo de acuerdo. Cocina quiere cerrar los pedidos de la app en las horas pico; Comercial dice que la app es lo que más crece.",
        "Los comensales del salón esperan y los repartidores también. Dinos quién tiene razón.",
      ],
      rows: [["Venta por app", "34% y creciendo"], ["Tiempo de espera en salón en hora pico", "+50%"], ["Pedidos de app cancelados", "8%"], ["Quejas de gerentes", "Todas las semanas"]],
    },
  },

  // ─────────────────────────────────────────────── Manufactura
  manufactura_general: {
    guerra: {
      subject: "Un competidor está entrando con 12% abajo",
      body: [
        "Te escribo urgente. Un fabricante de envases de Jalisco está ofreciendo 12% abajo de nuestra lista a nuestros clientes medianos.",
        "Ya perdimos dos pedidos y mis vendedores quieren bajar toda la lista. Yo creo que hay que moverse esta semana.",
      ],
      rows: [["Baja del competidor", "−12%"], ["Venta en riesgo", "$25 M al año"], ["Costo de igualar en todo", "$15 M de margen al año"], ["Pedidos perdidos este mes", "2"]],
    },
    verde: {
      subject: "{frontline}",
      body: [
        "Ingeniero, perdón por escribirle directo.",
        "El proyecto de la máquina nueva aparece en verde, pero el proveedor todavía no la calibra y llevamos un mes produciendo con la vieja a doble turno.",
        "No sé si alguien ya se lo dijo.",
      ],
      rows: [["Estado en el reporte", "Verde, en tiempo"], ["Arranque real de la máquina", "Sin fecha"], ["Horas extra del mes", "+35%"], ["Pedido de {cliente} que depende de ella", "$9 M"]],
    },
    trimestre: {
      subject: "El trimestre, antes de la sesión",
      body: [
        "Te escribo antes de la sesión. El trimestre va 5% abajo en utilidad por el precio de la resina.",
        "Propongo aplazar el mantenimiento mayor de las inyectoras y el programa de seguridad. Así cumplimos lo que prometimos.",
      ],
      rows: [["Utilidad vs. compromiso", "−5%"], ["Mantenimiento de inyectoras aplazado", "$3 M"], ["Programa de seguridad", "$0.9 M"], ["Accidentes menores este año", "+20%"]],
    },
    incidente: {
      subject: "Llamada perdida · {ops} (Planta)",
      body: [
        "Director, se hizo viral un video de un supervisor nuestro gritándole a una operadora embarazada que pidió ir a su consulta.",
        "Él dice que la regla es que los permisos se piden con una semana de anticipación. Ya nos etiquetaron medios locales y {cliente} pidió una explicación.",
      ],
      rows: [["Vistas del video", "≈ 400 mil"], ["Cliente que pidió explicación", "{cliente}"], ["Supervisores con la misma regla", "Todos"], ["Costo de revisar la política y capacitar", "$0.7 M"]],
    },
    salarios: {
      subject: "Los sueldos de planta",
      body: [
        "Te comparto algo que no podemos seguir ignorando. Los operadores ganan 14% menos que en el parque industrial y la rotación es de 50% al año.",
        "Los nuevos entran ganando casi lo mismo que los que tienen años, y eso se está volviendo tema en los comedores.",
      ],
      rows: [["Rotación anual", "50%"], ["Sueldo vs. el parque industrial", "−14%"], ["Costo de subir el piso", "$8 M al año"], ["Bono directivo del año", "$3.5 M"]],
    },
    meta: {
      subject: "{frontline}",
      body: [
        "Ingeniero, me pidieron algo que no me late.",
        "Para entregar a tiempo a {cliente} me pidieron saltar la prueba de presión en los lotes de esta semana. Dicen que la máquina nunca falla.",
        "Yo no quiero firmar un lote sin probar.",
      ],
      rows: [["Lotes sin prueba", "6"], ["Prueba que se saltaría", "Presión y hermeticidad"], ["Entrega comprometida", "En 4 días"], ["Penalización por retraso", "$0.4 M a la semana"]],
    },
    foco: {
      subject: "Hacemos de todo para todos",
      body: [
        "Te mando el análisis del portafolio. Tenemos 380 productos y 60 hacen el 75% de la utilidad.",
        "Cada pedido especial nos obliga a cambiar moldes; la planta pasa más tiempo cambiando que produciendo.",
      ],
      rows: [["Productos activos", "380"], ["Productos con margen negativo", "95"], ["Tiempo de planta en cambios", "≈ 30%"], ["Clientes con pedidos especiales", "40"]],
    },
    adaptativo: {
      subject: "Decide tú",
      body: [
        "Te escribo porque ya no avanzamos. Mantenimiento quiere parar las máquinas cada mes para prevenir; Producción dice que no hay forma de parar con estos pedidos.",
        "Llevamos tres juntas peleando lo mismo. Necesitamos que tú decidas.",
      ],
      rows: [["Paros no programados este año", "+40%"], ["Mantenimientos preventivos cumplidos", "45%"], ["Pedidos atrasados", "12%"], ["Juntas sin acuerdo", "3"]],
    },
  },

  // ─────────────────────────────────────────────── Software y SaaS
  software_saas: {
    guerra: {
      subject: "Un competidor ofrece el primer año gratis",
      body: [
        "Te escribo urgente. Un competidor con mucha inversión está ofreciendo el primer año gratis a cualquier cliente que migre.",
        "Ya perdimos tres cuentas medianas y mis vendedores quieren dar 40% de descuento a todos. Creo que hay que decidir esta semana.",
      ],
      rows: [["Oferta del competidor", "Primer año gratis"], ["Cuentas perdidas este mes", "3"], ["Ingreso recurrente en riesgo", "$12 M al año"], ["Costo de dar 40% a todos", "$20 M al año"]],
    },
    verde: {
      subject: "{frontline}",
      body: [
        "Hola, perdón por escribir directo.",
        "El proyecto de migración a la nube nueva aparece en verde, pero llevamos dos meses sin poder mover la base de datos principal. Estamos apagando incendios cada noche.",
        "No sé si alguien ya te lo dijo.",
      ],
      rows: [["Estado en el reporte", "Verde, en tiempo"], ["Avance real", "≈ 40%"], ["Incidentes nocturnos del mes", "11"], ["Fin del contrato con el proveedor actual", "En 2 meses"]],
    },
    trimestre: {
      subject: "El trimestre y los inversionistas",
      body: [
        "Te escribo antes del consejo. Este trimestre no llegamos a la meta de crecimiento de ingreso recurrente; vamos 9% abajo.",
        "Propongo frenar el rediseño de la plataforma y el equipo de éxito del cliente. Con ese ahorro, la utilidad se ve sana para la próxima ronda.",
      ],
      rows: [["Ingreso recurrente vs. meta", "−9%"], ["Rediseño de la plataforma", "$7 M"], ["Equipo de éxito del cliente", "$4 M al año"], ["Cancelación de clientes", "2.1% al mes y subiendo"]],
    },
    incidente: {
      subject: "Llamada perdida · {ops} (Soporte)",
      body: [
        "Oye, un agente de soporte le contestó muy mal a una usuaria en redes y ella publicó la conversación. Ya es tendencia.",
        "El agente le aplicó la política de no reembolsar después de 30 días, pero ella llevaba 31 con la plataforma caída en su cuenta. Ya preguntaron dos medios de tecnología.",
      ],
      rows: [["Vistas de la publicación", "≈ 900 mil"], ["Medios que preguntaron", "2"], ["Cuentas que pidieron cancelar hoy", "14"], ["Costo de revisar la política y reembolsar", "$0.5 M"]],
    },
    salarios: {
      subject: "Sueldos de ingeniería",
      body: [
        "Te comparto algo delicado. Para contratar ingenieros este año pagamos a precio de mercado, y hoy los nuevos ganan 25% más que los que llevan cuatro años.",
        "Ya se enteraron. Dos de los mejores están entrevistando afuera.",
      ],
      rows: [["Diferencia nuevos vs. antiguos", "+25%"], ["Rotación de ingeniería", "22% al año"], ["Costo de nivelar", "$11 M al año"], ["Costo de reemplazar a un ingeniero sénior", "≈ $0.8 M"]],
    },
    meta: {
      subject: "{frontline}",
      body: [
        "Hola, te escribo porque me pidieron algo que no está bien.",
        "Para cerrar la venta con {cliente} el viernes, me pidieron presentar como lista una función de seguridad que todavía no pasa las pruebas.",
        "Si la compran pensando que ya está, vamos a tener un problema.",
      ],
      rows: [["Pruebas de seguridad pasadas", "6 de 10"], ["Cierre comprometido", "Este viernes"], ["Contrato de {cliente}", "$9 M al año"], ["Tiempo para terminarla bien", "≈ 6 semanas"]],
    },
    foco: {
      subject: "Mantenemos 9 productos con 40 ingenieros",
      body: [
        "Te mando el análisis. Dos productos hacen el 85% del ingreso y siete más viven de clientes que los pidieron alguna vez.",
        "Cada uno necesita mantenimiento, soporte y seguridad. El producto principal lleva un año sin una mejora importante.",
      ],
      rows: [["Productos activos", "9"], ["Ingreso de los 2 principales", "85%"], ["Ingenieros dedicados a productos chicos", "≈ 45%"], ["Clientes que solo usan productos chicos", "70"]],
    },
    adaptativo: {
      subject: "Necesitamos que decidas",
      body: [
        "Te escribo porque no salimos de esto. Ventas promete funciones a la medida para cerrar contratos; Producto dice que así nunca vamos a tener una plataforma.",
        "Llevamos un trimestre en la misma discusión. Dinos quién tiene la razón.",
      ],
      rows: [["Funciones a la medida comprometidas", "23"], ["Tiempo de ingeniería en ellas", "≈ 35%"], ["Contratos cerrados por esas funciones", "$18 M al año"], ["Renuncias en Producto", "2 este trimestre"]],
    },
  },

  // ─────────────────────────────────────────────── Retail
  retail: {
    guerra: {
      subject: "La tienda en línea de enfrente vende 20% más barato",
      body: [
        "Te escribo urgente. Una plataforma en línea está vendiendo nuestros mismos productos de línea blanca 20% más barato, con envío gratis.",
        "La gente viene a la tienda, ve el producto y lo compra en el celular. Mis gerentes quieren igualar todos los precios.",
      ],
      rows: [["Diferencia de precio", "−20% en línea blanca"], ["Venta de línea blanca", "−14% en el trimestre"], ["Costo de igualar en todo", "$30 M de margen al año"], ["Clientes que piden igualar en tienda", "Diario"]],
    },
    verde: {
      subject: "{frontline}",
      body: [
        "Hola, perdón por escribirte directo.",
        "El nuevo sistema de inventarios aparece en verde, pero en mi tienda el sistema dice que hay producto que no existe. Vendemos en línea cosas que no tenemos y luego cancelamos.",
        "Los demás gerentes dicen que les pasa lo mismo, pero nadie lo pone en el reporte.",
      ],
      rows: [["Estado en el reporte", "Verde, implementado"], ["Exactitud de inventario", "≈ 82%"], ["Pedidos en línea cancelados", "9%"], ["Temporada alta", "En 6 semanas"]],
    },
    trimestre: {
      subject: "El número del trimestre",
      body: [
        "Te escribo antes de la sesión. El trimestre va 6% abajo en utilidad.",
        "Propongo aplazar la remodelación de tiendas y recortar horas de personal en piso. Con eso llegamos al número que prometimos al banco.",
      ],
      rows: [["Utilidad vs. compromiso", "−6%"], ["Remodelación aplazada", "$12 M"], ["Recorte de horas en piso", "$3 M en el trimestre"], ["Satisfacción en tienda", "Bajando 3 trimestres seguidos"]],
    },
    incidente: {
      subject: "Llamada perdida · {ops} (Operaciones)",
      body: [
        "Oye, se hizo viral un video: un guardia de una de nuestras tiendas revisó la mochila de un joven frente a todos porque «se veía sospechoso». No traía nada.",
        "La regla dice que se puede revisar a quien parezca sospechoso. Ya lo compartieron organizaciones civiles y nos están pidiendo postura.",
      ],
      rows: [["Vistas del video", "≈ 2 millones"], ["Organizaciones que pidieron postura", "3"], ["Tiendas con la misma regla", "60"], ["Costo de cerrar una mañana para capacitar", "$6 M"]],
    },
    salarios: {
      subject: "Lo que gana la gente de piso",
      body: [
        "Te comparto algo que nos está vaciando las tiendas. La gente de piso gana 12% menos que en las cadenas de enfrente y la rotación ya es de 70% al año.",
        "Además, un vendedor nuevo gana lo mismo que uno con cinco años, porque el sueldo base nunca se movió.",
      ],
      rows: [["Rotación en piso", "70% al año"], ["Sueldo vs. el mercado", "−12%"], ["Costo de subir el piso", "$16 M al año"], ["Bono directivo del año", "$6 M"]],
    },
    meta: {
      subject: "{frontline}",
      body: [
        "Hola, te escribo porque me están pidiendo algo que no está bien.",
        "Para llegar a la meta de garantías extendidas nos pidieron agregarlas al ticket sin preguntarle al cliente. Si no se da cuenta, se queda.",
        "Yo no quiero hacerle eso a la gente.",
      ],
      rows: [["Meta de garantías", "35% de los tickets"], ["Lo que se vendía antes de la meta", "18%"], ["Bono del gerente ligado a la meta", "Sí"], ["Quejas ante la autoridad del consumidor", "+50%"]],
    },
    foco: {
      subject: "Vendemos 22 mil artículos",
      body: [
        "Te mando el análisis. El 15% de los artículos hace el 80% de la venta, y el resto ocupa media bodega y la mitad del capital de trabajo.",
        "Cada comprador defiende sus categorías. Necesito que decidas qué hacemos.",
      ],
      rows: [["Artículos activos", "≈ 22 mil"], ["Artículos que hacen el 80% de la venta", "≈ 3,300"], ["Inventario con más de 180 días", "$40 M"], ["Categorías con margen negativo", "7"]],
    },
    adaptativo: {
      subject: "Necesitamos que decidas tú",
      body: [
        "Te escribo porque no salimos de esto. Tiendas dice que la venta en línea les quita clientes y comisiones; Digital dice que las tiendas no entregan los pedidos a tiempo.",
        "Los gerentes ya no quieren surtir pedidos en línea. Dinos quién tiene la razón.",
      ],
      rows: [["Venta en línea", "18% y creciendo"], ["Pedidos para recoger en tienda tardíos", "22%"], ["Comisión de tienda por venta en línea", "Ninguna"], ["Quejas cruzadas entre áreas", "Todas las semanas"]],
    },
  },

  // ─────────────────────────────────────────────── Logística
  logistica_distribucion: {
    guerra: {
      subject: "Un operador nacional entró con 15% abajo",
      body: [
        "Te escribo urgente. Un operador nacional está ofreciendo tarifas 15% abajo de las nuestras a nuestros clientes de la región.",
        "Ya perdimos una cuenta y otras dos nos pidieron igualar. Mis vendedores quieren bajar la tarifa a todos.",
      ],
      rows: [["Baja del competidor", "−15%"], ["Ingreso en riesgo", "$35 M al año"], ["Costo de igualar en todo", "$18 M de margen al año"], ["Cumplimiento de entregas del competidor", "Desconocido"]],
    },
    verde: {
      subject: "{frontline}",
      body: [
        "Oiga, perdón por escribirle directo.",
        "El indicador de entregas a tiempo sale en verde porque cambiamos la hora compromiso en el sistema cuando el camión va tarde. Así nos dijeron.",
        "Los clientes se quejan con nosotros, pero en el reporte todo está bien.",
      ],
      rows: [["Entregas a tiempo reportadas", "96%"], ["Entregas a tiempo reales", "≈ 81%"], ["Quejas de clientes del mes", "+45%"], ["Renovación con {cliente}", "En 2 meses"]],
    },
    trimestre: {
      subject: "Antes de la sesión: el trimestre",
      body: [
        "Te escribo antes de la sesión. El trimestre va 7% abajo en utilidad por el diésel.",
        "Propongo aplazar el mantenimiento mayor de la flota y la capacitación de operadores. Así cumplimos lo prometido.",
      ],
      rows: [["Utilidad vs. compromiso", "−7%"], ["Mantenimiento mayor aplazado", "$5 M"], ["Capacitación de operadores", "$1 M"], ["Incidentes en carretera este año", "+25%"]],
    },
    incidente: {
      subject: "Llamada perdida · {ops} (Operaciones)",
      body: [
        "Oye, un video de uno de nuestros operadores se hizo viral: le cerró el paso a un ciclista y le gritó. La unidad trae nuestro logo grande.",
        "El operador dice que iba presionado por la ventana de entrega de {cliente}. Ya lo compartieron colectivos ciclistas y el municipio pidió información.",
      ],
      rows: [["Vistas del video", "≈ 700 mil"], ["Autoridad que pidió información", "Municipio"], ["Operadores con la misma presión de horario", "≈ 200"], ["Costo de capacitar y revisar ventanas", "$1.4 M"]],
    },
    salarios: {
      subject: "Los operadores se nos están yendo",
      body: [
        "Te comparto algo urgente. Los operadores ganan 10% menos que en las empresas grandes y la rotación ya es de 60% al año.",
        "Para cubrir rutas contratamos a nuevos con un bono de entrada que los de años nunca recibieron. Ya se dieron cuenta.",
      ],
      rows: [["Rotación de operadores", "60% al año"], ["Sueldo vs. empresas grandes", "−10%"], ["Costo de subir el piso", "$12 M al año"], ["Unidades paradas por falta de operador", "18"]],
    },
    meta: {
      subject: "{frontline}",
      body: [
        "Oiga, le escribo porque me pidieron algo que no está bien.",
        "Para cumplir las ventanas de {cliente} nos pidieron llenar las bitácoras de manejo con descansos que no hicimos. Así nadie nota que manejamos 14 horas.",
        "Yo no quiero que alguien se duerma en la carretera.",
      ],
      rows: [["Horas de manejo reales", "Hasta 14 al día"], ["Límite de la norma", "Con descansos obligatorios"], ["Ventanas de entrega de {cliente}", "Penalización por cada falla"], ["Incidentes por cansancio este año", "3"]],
    },
    foco: {
      subject: "Atendemos 300 clientes y 20 hacen la utilidad",
      body: [
        "Te mando el análisis. Veinte clientes hacen el 75% de la utilidad, y hay rutas que hacemos medio vacías para clientes chicos.",
        "Comercial no quiere soltar a nadie. Necesito que decidas qué hacemos.",
      ],
      rows: [["Clientes activos", "≈ 300"], ["Clientes con margen negativo", "70"], ["Ocupación promedio de las unidades", "62%"], ["Rutas con menos de 50% de carga", "35"]],
    },
    adaptativo: {
      subject: "Decide tú, por favor",
      body: [
        "Te escribo porque ya no nos ponemos de acuerdo. Comercial acepta cualquier ventana de entrega que pide el cliente; Tráfico dice que así no hay ruta que salga a tiempo.",
        "Los operadores pagan la diferencia manejando de más. Necesitamos que tú decidas.",
      ],
      rows: [["Ventanas de entrega distintas", "≈ 180"], ["Rutas que salen tarde", "28%"], ["Horas extra de operadores", "+30%"], ["Juntas entre Comercial y Tráfico", "Ninguna con acuerdo"]],
    },
  },
};
