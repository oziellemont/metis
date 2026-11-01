/**
 * mêtis CEO · Banco de casos (P1-C) · contexto por industria.
 *
 * El mismo arquetipo (archetypes.ts) se vive distinto en cada industria: en Alimentos el retiro es de un lote de
 * yogur, en Autopartes es una contención de piezas en la armadora, en SaaS es apagar una función que filtra datos.
 * Aquí viven SOLO los hechos: quién escribe, qué dice, qué cifras ve el jugador. Las opciones, los efectos y la
 * lección no cambian: el centro es la decisión, no la industria.
 *
 * Llaves que llena el generador: {cfo}, {ops}, {sales}, {people}, {chair}, {board}, {frontline}, {client},
 * {assistant} (nombre de pila de quien tiene ese rol en tu empresa) y {company_short} (nombre de tu empresa).
 * Las de la industria ({cliente}, {clientes}, {lote}, {afectado}) se definen en `vars`.
 * Cifras en pesos y para la empresa establecida; en una PYME se escalan igual que el paquete (career/size.ts).
 */
import type { ArchetypeId } from "./archetypes";
import { P1D_FACTS, type P1DId } from "./contexts-p1d";

export interface CaseFacts {
  subject: string;
  /** En voz de quien escribe (en llamada, lo que dice el mensaje de voz). */
  body: string[];
  rows: [string, string][];
}

export interface IndustryContext {
  industryId: string;
  label: string;
  vars: { cliente: string; clientes: string; lote: string; afectado: string };
  cases: Record<ArchetypeId, CaseFacts>;
}

/** Contexto con las diez decisiones de P1-C; las ocho de P1-D viven en contexts-p1d.ts y se suman abajo. */
type BaseContext = Omit<IndustryContext, "cases"> & { cases: Record<Exclude<ArchetypeId, P1DId>, CaseFacts> };
const full = (c: BaseContext): IndustryContext => ({ ...c, cases: { ...c.cases, ...P1D_FACTS[c.industryId] } });

const ALIMENTOS: BaseContext = {
  industryId: "alimentos_bebidas",
  label: "Alimentos y bebidas",
  vars: { cliente: "SuperNorte", clientes: "las cadenas", lote: "los tres lotes sospechosos", afectado: "SuperNorte y los consumidores" },
  cases: {
    retiro: {
      subject: "Llamada perdida · {ops} (Planta)",
      body: [
        "Jefe, dos consumidores reportaron malestar estomacal después de comer producto de la misma semana. El laboratorio externo nos da el resultado en 72 horas.",
        "Encontramos que el detector de metales de la línea 1 estuvo calibrado fuera de rango cuatro días. Puede no ser nada. Puede ser todo. ¿Qué hago con los tres lotes que ya están en anaquel?",
      ],
      rows: [["Producto en anaquel", "≈ 210 mil piezas en 140 tiendas"], ["Costo de un retiro total", "$6 M entre producto, logística y merma"], ["Reportes recibidos", "2 casos, ninguno hospitalizado"], ["Resultado del laboratorio", "En 72 horas"]],
    },
    cliente: {
      subject: "Revisión de surtido · {company_short}",
      body: [
        "Estimado Director:",
        "Para el próximo semestre estamos consolidando proveedores. Si {company_short} quiere conservar su espacio, necesitamos 3 puntos más de aportación promocional y que absorban las mermas de las tiendas.",
        "Una marca nacional nos ofreció cubrir el espacio con un fondo de lanzamiento. Quedo atenta antes del cierre de mes.",
      ],
      rows: [["Peso de {cliente} en tu venta", "31%"], ["Costo de lo que pide", "$4.5 M al año"], ["Tu rotación en sus tiendas", "1.3× la de la marca nacional"], ["Otras cadenas en pláticas", "2 regionales, sin firmar"]],
    },
    incentivos: {
      subject: "Lo que encontramos en las rutas",
      body: [
        "Te escribo con algo delicado. En tres rutas, los vendedores cargaban a las tienditas producto que no pidieron para llegar a la meta del mes. Luego se recoge como devolución y se tira.",
        "Lo hacen porque el bono es la mitad de su ingreso y la meta subió 18% este año. La devolución ya es el doble que hace un año.",
      ],
      rows: [["Devoluciones", "9% de la venta (era 4.5%)"], ["Rutas con el patrón", "3 de 22"], ["Peso del bono en el ingreso", "≈ 50%"], ["Merma por devoluciones", "$3 M en el año"]],
    },
    ciberataque: {
      subject: "Llamada perdida · {ops} (Planta)",
      body: [
        "Jefe, amanecimos sin sistema. Las pantallas piden un rescate para devolvernos los archivos. No podemos imprimir etiquetas ni programar las rutas de entrega.",
        "Los camiones están cargados pero sin documentos. {cfo} dice que el respaldo de la semana pasada podría servir, pero no lo hemos probado.",
      ],
      rows: [["Rescate pedido", "≈ $4 M en criptomonedas"], ["Entregas detenidas hoy", "38 rutas"], ["Último respaldo", "Hace 6 días, sin probar"], ["Pedidos de cadenas pendientes", "{cliente} y 2 más"]],
    },
    expansion: {
      subject: "Propuesta: entrar a Estados Unidos",
      body: [
        "Te escribo antes de la sesión. Un distribuidor de Texas quiere nuestra línea completa en 400 tiendas de producto mexicano. Es la oportunidad que esperábamos.",
        "La propuesta implica una línea nueva en planta, certificaciones y crédito a 90 días. Yo creo que hay que ir con todo antes de que se lo lleve otro.",
      ],
      rows: [["Inversión total", "$38 M"], ["Venta esperada año 1", "$60 M"], ["Experiencia exportando", "Ninguna"], ["Capacidad libre en planta", "12%"]],
    },
    precio: {
      subject: "El empaque nos está comiendo el margen",
      body: [
        "El costo del empaque y del aceite subió 14% en seis meses y no hemos movido precios en un año. Cada mes que esperamos son casi medio punto de margen.",
        "Necesito que decidas cómo y cuándo subimos. Te dejo tres escenarios.",
      ],
      rows: [["Alza de insumos", "+14% en 6 meses"], ["Margen operativo", "9.8% → 8.1% si no hacemos nada"], ["Aumento necesario", "6% promedio"], ["Último aumento", "Hace 13 meses"]],
    },
    recorte: {
      subject: "Los números no cierran con esta plantilla",
      body: [
        "Te lo digo sin rodeos: el año pasado contratamos para un crecimiento que no llegó. La venta va 4% abajo del plan y la nómina 11% arriba.",
        "Si no ajustamos, en cinco meses rompemos el límite de deuda con el banco. Necesito que decidas cómo.",
      ],
      rows: [["Venta vs. plan", "−4%"], ["Nómina vs. plan", "+11%"], ["Ahorro necesario", "$9 M al año"], ["Meses para romper el límite del banco", "5"]],
    },
    proveedor: {
      subject: "{ops}",
      body: [
        "Jefe, se quemó la bodega del proveedor de película para empaque.",
        "Es el único que tenemos aprobado. Nos alcanza para 9 días de producción.",
        "Hay otros dos en el mercado pero ninguno está validado para contacto con alimento. ¿Cómo le hacemos?",
      ],
      rows: [["Inventario de empaque", "9 días"], ["Proveedores aprobados", "1"], ["Tiempo para validar otro", "4 a 6 semanas"], ["Pedido de {cliente} en riesgo", "$11 M al mes"]],
    },
    apuesta: {
      subject: "Venta directa en línea: o la hacemos nosotros o alguien más",
      body: [
        "Te escribo antes de la sesión. Las marcas jóvenes venden en línea, directo al consumidor, con más margen y sin que nadie les cobre por el espacio.",
        "Si lo hacemos, las cadenas lo van a ver como competencia y puede costarnos espacio. Si no lo hacemos, en cinco años no sé qué vamos a vender.",
      ],
      rows: [["Venta en línea de la categoría", "Crece 35% al año"], ["Venta de {company_short} en línea", "0"], ["Inversión mínima", "$8 M"], ["Peso de las cadenas", "78% de la venta"]],
    },
    error: {
      subject: "{ops}",
      body: [
        "Jefe, la regamos. Un supervisor del turno de noche cambió las etiquetas de dos productos.",
        "Se fueron 4 mil piezas a {cliente} con la información de alérgenos equivocada. Él mismo lo reportó en la mañana.",
        "Nadie se ha quejado todavía. Él está deshecho.",
      ],
      rows: [["Piezas con etiqueta equivocada", "≈ 4 mil"], ["Ya en tiendas", "Sí, desde ayer"], ["Costo de recuperarlas", "$1.2 M"], ["Control que falló", "Revisión de etiqueta al cambio de turno"]],
    },
  },
};

const AUTOPARTES: BaseContext = {
  industryId: "autopartes",
  label: "Autopartes",
  vars: { cliente: "Aurora Motors", clientes: "la armadora", lote: "las 3 semanas de piezas en tránsito", afectado: "Aurora Motors" },
  cases: {
    retiro: {
      subject: "Llamada perdida · {ops} (Operaciones)",
      body: [
        "Director, Calidad encontró grietas en dos soportes de la suspensión en la prueba de fatiga. Pueden ser de un solo lote de acero. O de todo lo que mandamos en tres semanas.",
        "Si avisamos a la armadora, nos van a pedir contención en su planta y una revisión de todo lo enviado. Si no avisamos y falla en un auto, no hay manera de explicarlo.",
      ],
      rows: [["Piezas en tránsito y en la armadora", "≈ 42 mil"], ["Costo de la contención", "$14 M"], ["Grietas encontradas", "2 de 60 piezas probadas"], ["Análisis del acero", "En 5 días"]],
    },
    cliente: {
      subject: "Annual price reduction · {company_short}",
      body: [
        "Dear CEO,",
        "As part of our annual cost program, we expect a 4% price reduction on all active part numbers, effective next quarter. Suppliers that cannot support this will not be considered for the next platform.",
        "We know this is challenging. We have quotes from two suppliers in Asia.",
      ],
      rows: [["Peso de {cliente} en tu venta", "72%"], ["Costo de lo que pide", "$92 M al año"], ["Tu PPM con ellos", "Mejor que el promedio de su red"], ["Plataforma nueva en juego", "La próxima, de 6 años"]],
    },
    incentivos: {
      subject: "Lo que encontró la auditoría de calidad",
      body: [
        "Te escribo con algo serio. En el segundo turno se estaban registrando piezas como inspeccionadas sin inspeccionarlas, para llegar a la meta de piezas por hora.",
        "El bono de los supervisores es por piezas producidas. Nadie les mide la calidad. Los operadores dicen que, si paran a revisar, el supervisor los regaña.",
      ],
      rows: [["Inspecciones sin evidencia", "≈ 1 de cada 8 en el turno 2"], ["Peso del bono por piezas", "35% del ingreso del supervisor"], ["Reclamos de la armadora", "3 este trimestre"], ["Riesgo", "Perder la certificación IATF"]],
    },
    ciberataque: {
      subject: "Llamada perdida · {ops} (Operaciones)",
      body: [
        "Director, tenemos un ataque. Los servidores de planta están cifrados y piden rescate. No tenemos acceso a los programas de producción ni a la comunicación con la armadora.",
        "Si no les mandamos los avisos de embarque en 24 horas, su línea se puede detener por nuestra culpa, y la penalización es por minuto.",
      ],
      rows: [["Rescate pedido", "≈ $9 M en criptomonedas"], ["Penalización por paro de línea", "$1.5 M por hora"], ["Último respaldo", "Hace 3 días, sin probar"], ["Producción afectada", "Las 3 naves"]],
    },
    expansion: {
      subject: "Propuesta: segunda planta en el Bajío",
      body: [
        "Te escribo antes del consejo. Una armadora nueva nos ofrece ser proveedor de su planta en Guanajuato si ponemos una nave cerca. Es la manera de bajar la dependencia de Aurora.",
        "El fondo quiere que vayamos. Necesitamos la nave operando en 14 meses, con gente que todavía no tenemos.",
      ],
      rows: [["Inversión", "$420 M"], ["Venta esperada año 2", "$600 M"], ["Soldadores disponibles en la zona", "Escasos"], ["Deuda / EBITDA después", "2.9× (límite del banco 3.0×)"]],
    },
    precio: {
      subject: "El acero ya no cabe en nuestros precios",
      body: [
        "El acero subió 22% en el año y nuestros contratos con la armadora tienen precio fijo hasta su revisión anual. Estamos perdiendo dinero en 14 números de parte.",
        "Los contratos permiten pedir ajuste por materia prima, pero nadie lo ha hecho nunca. Necesito que decidas cómo lo planteamos.",
      ],
      rows: [["Alza del acero", "+22% en el año"], ["Números de parte con pérdida", "14 de 85"], ["Ajuste necesario", "3.5% en esas piezas"], ["Cláusula de ajuste", "Existe y nunca se ha usado"]],
    },
    recorte: {
      subject: "La plataforma vieja se acaba en junio",
      body: [
        "Te lo adelanto antes de que se sepa: la plataforma que sostiene una tercera parte de nuestro volumen termina en junio y la nueva no arranca hasta el año siguiente.",
        "Hay un hueco de ocho meses. Sin ajuste, la nave 2 opera al 40% y perdemos dinero cada mes.",
      ],
      rows: [["Volumen que se va", "33%"], ["Hueco hasta la nueva plataforma", "8 meses"], ["Costo de mantener a todos", "$48 M"], ["Personas en la nave 2", "≈ 280"]],
    },
    proveedor: {
      subject: "{ops}",
      body: [
        "Director, se inundó la planta del proveedor de tornillería especial.",
        "Es el único aprobado por la armadora para esa pieza. Tenemos para 5 días.",
        "Un segundo proveedor existe, pero aprobarlo con la armadora tarda semanas. ¿Qué hacemos?",
      ],
      rows: [["Inventario", "5 días"], ["Proveedores aprobados", "1"], ["Tiempo de aprobación de otro", "3 a 8 semanas"], ["Penalización si paramos su línea", "$1.5 M por hora"]],
    },
    apuesta: {
      subject: "Autos eléctricos: ¿entramos o nos quedamos?",
      body: [
        "Te escribo antes del consejo. Las armadoras van a necesitar cajas de batería y piezas ligeras para eléctricos. Nuestro negocio de hoy son piezas para autos de gasolina.",
        "Entrar significa invertir en aluminio y otra forma de trabajar, mientras lo de hoy todavía paga las cuentas. No entrar significa que en diez años quizá no tengamos a quién venderle.",
      ],
      rows: [["Piezas de {company_short} para eléctricos", "0%"], ["Inversión mínima", "$120 M"], ["Margen del negocio actual", "Bueno, pero bajando"], ["Pedidos para eléctricos en México", "Crecen cada año"]],
    },
    error: {
      subject: "{ops}",
      body: [
        "Director, se mandó un lote a la armadora con una pieza de otra versión. Fue un error de surtido en el embarque.",
        "Ellos todavía no lo detectan. El montacarguista que lo surtió lo reportó él solo. Llevaba dos turnos seguidos.",
      ],
      rows: [["Piezas mezcladas", "≈ 1,200"], ["Ya en su planta", "Sí, desde hoy"], ["Costo de recuperarlas", "$2.4 M"], ["Control que falló", "Escaneo de etiqueta en el embarque"]],
    },
  },
};

const RESTAURANTES: BaseContext = {
  industryId: "restaurantes",
  label: "Restaurantes",
  vars: { cliente: "Rappido", clientes: "los comensales", lote: "el pollo marinado de la semana", afectado: "los comensales" },
  cases: {
    retiro: {
      subject: "Llamada perdida · {ops} (Cocina)",
      body: [
        "Director, el proveedor de pollo nos avisó que un lote pudo romper la cadena de frío en el traslado. No sabe cuál de las sucursales lo recibió.",
        "Ya lo marinamos y se está sirviendo desde ayer en varias sucursales. Nadie se ha enfermado. Todavía.",
      ],
      rows: [["Sucursales que pudieron recibirlo", "Hasta 12 de 34"], ["Costo de tirarlo todo", "$1.8 M"], ["Reportes de comensales", "Ninguno"], ["Resultado del proveedor", "En 48 horas"]],
    },
    cliente: {
      subject: "Nuevas condiciones · {company_short} en Rappido",
      body: [
        "Hola, Director:",
        "Para el próximo trimestre, las marcas que quieran seguir en los primeros lugares de la app necesitan subir la comisión de 25% a 30% y darnos exclusividad.",
        "Hay otras dos cadenas de cortes muy interesadas en ese espacio. Te pido respuesta esta semana.",
      ],
      rows: [["Venta por la app", "22% del total"], ["Costo de lo que pide", "$11 M al año"], ["Margen de un pedido en la app hoy", "≈ 6%"], ["Canal propio", "Existe, casi sin uso"]],
    },
    incentivos: {
      subject: "Lo que encontramos en las propinas",
      body: [
        "Te escribo con algo delicado. Los gerentes tienen bono por cumplir el costo de nómina, y en varias sucursales están recortando turnos a última hora y dejando a los meseros sin descanso.",
        "Tres sucursales también están usando el fondo de propinas para cubrir faltantes de caja. La gente tiene miedo de decirlo.",
      ],
      rows: [["Rotación de meseros", "92% al año"], ["Sucursales con el patrón", "≈ 8 de 34"], ["Peso del bono en el ingreso del gerente", "40%"], ["Quejas formales", "2, una ya en la autoridad laboral"]],
    },
    ciberataque: {
      subject: "Llamada perdida · {ops} (Cocina)",
      body: [
        "Director, se cayó el sistema de punto de venta en todas las sucursales. Las pantallas piden un rescate. No podemos cobrar con tarjeta ni mandar comandas a cocina.",
        "Es viernes y en dos horas empieza la cena. {cfo} dice que el proveedor del sistema no contesta.",
      ],
      rows: [["Rescate pedido", "≈ $2.5 M en criptomonedas"], ["Venta de un viernes", "$6 M en toda la cadena"], ["Pagos con tarjeta", "70% de la venta"], ["Datos de clientes en el sistema", "Programa de lealtad"]],
    },
    expansion: {
      subject: "Propuesta: franquiciar",
      body: [
        "Te escribo antes del consejo. Un grupo de inversionistas quiere abrir 15 franquicias en el Bajío en dos años. Es la forma de crecer sin poner nuestro dinero.",
        "Los manuales de operación están a medias y la mitad de las recetas vive en la cabeza del chef. Pero si no lo hacemos, alguien más se va a quedar con esas plazas.",
      ],
      rows: [["Franquicias propuestas", "15 en 2 años"], ["Ingreso por regalías", "$45 M al año"], ["Manuales de operación", "Incompletos"], ["Sucursales propias que pierden dinero", "6 de 34"]],
    },
    precio: {
      subject: "El costo de la carne nos rebasó",
      body: [
        "El costo de la res subió 18% y el prime cost ya pasa del 65%. Cada mes que esperamos perdemos casi un punto de margen.",
        "Podemos subir precios, cambiar porciones o mover el menú. Necesito que decidas.",
      ],
      rows: [["Alza de la carne", "+18% en 6 meses"], ["Prime cost", "65% (meta 60%)"], ["Aumento necesario", "7% en platos fuertes"], ["Último cambio de menú", "Hace 14 meses"]],
    },
    recorte: {
      subject: "Seis sucursales nos están hundiendo",
      body: [
        "Te lo digo sin rodeos: seis sucursales de CDMX pierden dinero desde hace un año, y la cadena entera paga sus pérdidas.",
        "Si no decidimos ahora, el resto de las sucursales deja de invertir en mantenimiento y empieza a deteriorarse.",
      ],
      rows: [["Sucursales con pérdida", "6 de 34"], ["Pérdida anual de esas 6", "$22 M"], ["Personas en esas sucursales", "≈ 260"], ["Contratos de renta", "4 vencen este año"]],
    },
    proveedor: {
      subject: "{ops}",
      body: [
        "Director, el proveedor de cortes nos avisó que no puede surtir en dos semanas. Se le enfermó el ganado de un rancho.",
        "Es nuestro único proveedor de rib eye certificado. Tenemos para 4 días.",
        "Hay carne en el mercado, pero no es la misma calidad. ¿Qué hacemos?",
      ],
      rows: [["Inventario de cortes", "4 días"], ["Proveedores certificados", "1"], ["Peso del corte en la venta", "28%"], ["Sobreprecio de compra de emergencia", "+35%"]],
    },
    apuesta: {
      subject: "Cocinas ocultas: ¿nos metemos?",
      body: [
        "Te escribo antes del consejo. Las marcas que solo venden por aplicación crecen rápido con cocinas sin comedor, con mucho menos costo.",
        "Si lanzamos una marca así, le quitamos pedidos a nuestras propias sucursales. Si no, alguien más lo va a hacer con nuestro tipo de comida.",
      ],
      rows: [["Venta a domicilio en la categoría", "Crece 25% al año"], ["Inversión por cocina oculta", "$3 M"], ["Ticket a domicilio de {company_short}", "Menor que en salón"], ["Experiencia en marcas virtuales", "Ninguna"]],
    },
    error: {
      subject: "{ops}",
      body: [
        "Director, en la sucursal de Andares se sirvió un platillo con nuez a una comensal que había avisado que era alérgica.",
        "Tuvo una reacción y la llevaron al hospital; ya está estable. El cocinero se confundió de comanda en plena hora pico.",
        "Él está deshecho. La familia todavía no ha dicho nada públicamente.",
      ],
      rows: [["Estado de la comensal", "Estable"], ["Costo médico y de atención", "$0.4 M"], ["Control que falló", "Marca de alérgenos en la comanda"], ["Antecedentes", "Ninguno en esa sucursal"]],
    },
  },
};

const MANUFACTURA: BaseContext = {
  industryId: "manufactura_general",
  label: "Manufactura industrial general",
  vars: { cliente: "Grupo Envasa", clientes: "los clientes", lote: "los dos lotes sospechosos", afectado: "Grupo Envasa" },
  cases: {
    retiro: {
      subject: "Llamada perdida · {ops} (Planta)",
      body: [
        "Director, un cliente reportó que unos envases nuestros se agrietaron en su línea de llenado. Podría ser una resina mala o un problema del molde.",
        "Si el problema es la resina, hay dos lotes más en tres clientes. Si es el molde, es solo un lote. No lo sabremos hasta la prueba de laboratorio.",
      ],
      rows: [["Envases en clientes", "≈ 1.8 millones de piezas"], ["Costo de recuperar todo", "$7 M"], ["Clientes afectados", "3"], ["Resultado del laboratorio", "En 4 días"]],
    },
    cliente: {
      subject: "Condiciones de compra · {company_short}",
      body: [
        "Estimado Director:",
        "Estamos consolidando proveedores de empaque. Para conservar el volumen, necesitamos 5% menos de precio y que mantengan inventario en consignación en nuestra planta.",
        "Tenemos una oferta de un proveedor más grande. Espero su respuesta este mes.",
      ],
      rows: [["Peso de {cliente} en tu venta", "38%"], ["Costo de lo que pide", "$16 M al año"], ["Tus entregas a tiempo", "97%"], ["Otros clientes en pláticas", "2, sin cerrar"]],
    },
    incentivos: {
      subject: "Lo que encontró la auditoría",
      body: [
        "Te escribo con algo serio. Para cumplir la meta de desperdicio, en dos turnos se estaba molinando producto defectuoso y reportándolo como material recuperado.",
        "El bono de los jefes de turno depende del indicador de desperdicio. El número se ve perfecto y la calidad del producto no.",
      ],
      rows: [["Desperdicio reportado", "2.1% (meta 2.5%)"], ["Desperdicio real estimado", "≈ 4%"], ["Peso del bono", "30% del ingreso"], ["Quejas de calidad", "+40% en el trimestre"]],
    },
    ciberataque: {
      subject: "Llamada perdida · {ops} (Planta)",
      body: [
        "Director, el sistema de planeación está cifrado y piden rescate. No tenemos órdenes de producción ni registro de inventario.",
        "Las máquinas funcionan, pero no sabemos qué producir ni para quién. Hay embarques comprometidos esta semana.",
      ],
      rows: [["Rescate pedido", "≈ $5 M en criptomonedas"], ["Embarques de la semana", "41"], ["Último respaldo", "Hace 5 días, sin probar"], ["Clientes con entrega crítica", "{cliente} y 3 más"]],
    },
    expansion: {
      subject: "Propuesta: comprar a un competidor",
      body: [
        "Te escribo antes del consejo. Un competidor de Querétaro está en venta. Con él duplicamos capacidad y entramos a clientes que hoy no tenemos.",
        "Hay que decidir rápido; hay otro comprador. Yo creo que es ahora o nunca.",
      ],
      rows: [["Precio pedido", "$180 M"], ["Venta del competidor", "$260 M al año"], ["Su margen", "Más bajo que el nuestro"], ["Revisión a fondo de sus números", "Sin hacer todavía"]],
    },
    precio: {
      subject: "La resina subió y nosotros no",
      body: [
        "La resina subió 25% en el año. Nuestros precios siguen igual porque los contratos no tienen fórmula de ajuste.",
        "Estamos trabajando para los clientes. Necesito que decidas cómo lo planteamos.",
      ],
      rows: [["Alza de la resina", "+25% en el año"], ["Margen bruto", "24% → 18%"], ["Aumento necesario", "8%"], ["Contratos con fórmula de ajuste", "Ninguno"]],
    },
    recorte: {
      subject: "Perdimos el contrato de electrodomésticos",
      body: [
        "Te lo adelanto: el cliente de electrodomésticos se lleva su producción a Asia. Era la quinta parte de nuestra venta.",
        "Con esa línea vacía, tenemos gente de más para lo que queda. Necesito que decidas qué hacemos.",
      ],
      rows: [["Venta que se va", "20%"], ["Costo de mantener a todos", "$26 M al año"], ["Personas en esa línea", "≈ 90"], ["Prospectos para llenarla", "2, a 9 meses"]],
    },
    proveedor: {
      subject: "{ops}",
      body: [
        "Director, el proveedor de moldes tuvo un incendio.",
        "Tiene el único juego de repuesto de nuestros moldes críticos. Si se rompe uno, paramos.",
        "Otro taller puede hacerlos, pero tarda y no tiene los planos. ¿Qué hacemos?",
      ],
      rows: [["Moldes sin repuesto", "6"], ["Tiempo para fabricar otros", "10 a 14 semanas"], ["Venta que depende de ellos", "$40 M al año"], ["Planos propios", "Incompletos"]],
    },
    apuesta: {
      subject: "Empaque reciclado: ¿entramos?",
      body: [
        "Te escribo antes del consejo. Las marcas grandes ya piden empaque con material reciclado. Nuestro negocio está montado en resina virgen.",
        "Cambiar exige equipo nuevo y cuesta margen durante años. No cambiar puede dejarnos fuera de los contratos grandes.",
      ],
      rows: [["Clientes que ya lo piden", "3 de los 10 más grandes"], ["Inversión mínima", "$55 M"], ["Margen del reciclado", "Menor al principio"], ["Competidores que ya lo ofrecen", "2"]],
    },
    error: {
      subject: "{ops}",
      body: [
        "Director, se embarcó un lote con la medida equivocada. El técnico cargó el programa de otra pieza al cambiar el molde.",
        "El cliente todavía no se da cuenta. El técnico lo reportó él mismo.",
      ],
      rows: [["Piezas fuera de medida", "≈ 60 mil"], ["Ya en su planta", "Sí"], ["Costo de reponerlas", "$1.5 M"], ["Control que falló", "Primera pieza al cambio de molde"]],
    },
  },
};

const SAAS: BaseContext = {
  industryId: "software_saas",
  label: "Software y SaaS",
  vars: { cliente: "Grupo Altamar", clientes: "los clientes", lote: "la función de reportes compartidos", afectado: "los clientes expuestos" },
  cases: {
    retiro: {
      subject: "Llamada perdida · {ops} (Producto)",
      body: [
        "Oye, un cliente nos avisó que en la función de reportes compartidos alcanzó a ver datos de otra empresa. Lo estamos revisando.",
        "Puede ser un caso aislado o un error que expuso datos de muchos. Apagar la función molesta a cientos de clientes que la usan a diario.",
      ],
      rows: [["Clientes que usan la función", "≈ 640"], ["Casos confirmados", "1"], ["Costo de apagarla", "Quejas y cancelaciones posibles"], ["Diagnóstico completo", "En 48 horas"]],
    },
    cliente: {
      subject: "Renovación · {company_short}",
      body: [
        "Hola:",
        "Estamos por renovar. Para seguir con ustedes necesitamos 30% de descuento y tres funciones a la medida antes de fin de año. Si no, migramos con su competidor.",
        "Ellos ya nos ofrecieron el primer año gratis.",
      ],
      rows: [["Peso de {cliente} en tu ingreso", "18%"], ["Costo de lo que pide", "$7 M al año"], ["Uso real de la plataforma", "Alto en 4 de 6 áreas"], ["Costo de migrarse para ellos", "Alto: 6 meses de implementación"]],
    },
    incentivos: {
      subject: "Lo que encontramos en las ventas del trimestre",
      body: [
        "Te escribo con algo delicado. Para llegar a la meta, varios vendedores cerraron contratos prometiendo funciones que no existen. Los clientes cancelan a los tres meses.",
        "La comisión se paga completa al firmar, aunque el cliente se vaya después. La cancelación de clientes nuevos ya es el doble que hace un año.",
      ],
      rows: [["Cancelación de clientes nuevos", "28% en 90 días (era 14%)"], ["Comisión pagada al firmar", "100%"], ["Retención neta de ingreso", "96% (era 108%)"], ["Promesas sin respaldo detectadas", "≈ 30 contratos"]],
    },
    ciberataque: {
      subject: "Llamada perdida · {ops} (Producto)",
      body: [
        "Oye, alguien entró a un servidor de respaldo y se llevó una copia de datos de clientes. Ahora piden un pago para no publicarlo.",
        "La plataforma funciona normal. Todavía no sabemos qué tanto se llevaron.",
      ],
      rows: [["Pago pedido", "≈ $6 M en criptomonedas"], ["Clientes posiblemente afectados", "Hasta 900"], ["Obligación de aviso", "La ley de datos pide avisar"], ["Plataforma", "Operando"]],
    },
    expansion: {
      subject: "Propuesta: abrir Colombia y Chile este año",
      body: [
        "Te escribo antes del consejo. Los inversionistas quieren ver crecimiento regional antes de la siguiente ronda. Propongo abrir dos países al mismo tiempo.",
        "El producto no está traducido a la regulación local y el equipo de soporte ya va al límite. Pero si esperamos, la ronda se complica.",
      ],
      rows: [["Inversión", "$35 M"], ["Ingreso esperado año 1", "$12 M"], ["Clientes en esos países hoy", "3"], ["Meses de caja después", "14 (hoy 22)"]],
    },
    precio: {
      subject: "Llevamos tres años con el mismo precio",
      body: [
        "Llevamos tres años con el mismo precio y el producto creció mucho. El costo de nube subió 30% y el margen bruto viene bajando.",
        "Necesito que decidas cómo subimos y a quién.",
      ],
      rows: [["Margen bruto", "78% → 71%"], ["Aumento propuesto", "15%"], ["Clientes en plan antiguo", "65%"], ["Último aumento", "Hace 3 años"]],
    },
    recorte: {
      subject: "Contratamos para un crecimiento que no llegó",
      body: [
        "Te lo digo sin rodeos: el año pasado contratamos pensando en crecer 80% y crecimos 25%. La caja alcanza para 13 meses.",
        "Los inversionistas quieren ver un camino a la rentabilidad antes de poner más dinero. Necesito que decidas.",
      ],
      rows: [["Crecimiento real vs. plan", "25% vs. 80%"], ["Meses de caja", "13"], ["Ahorro necesario", "$18 M al año"], ["Contrataciones del último año", "60"]],
    },
    proveedor: {
      subject: "{ops}",
      body: [
        "Oye, el proveedor de mensajería que usamos para mandar códigos de acceso cerró su servicio en México de un día para otro.",
        "Nadie puede entrar con doble verificación. Lo tenemos como único proveedor.",
        "Hay alternativas, pero integrarlas bien lleva semanas. ¿Qué hacemos?",
      ],
      rows: [["Clientes sin poder entrar", "≈ 40%"], ["Proveedores de respaldo", "0"], ["Integración rápida", "3 días, con riesgo"], ["Integración completa", "3 semanas"]],
    },
    apuesta: {
      subject: "Plan gratuito: ¿lo lanzamos?",
      body: [
        "Te escribo antes del consejo. Los competidores nuevos crecen con un plan gratuito que se usa solo, sin vendedor. Nosotros vendemos con un equipo comercial grande.",
        "Si lanzamos el plan gratuito, algunos clientes que hoy pagan se van a bajar. Si no, los nuevos se quedan con el mercado pequeño, que mañana será grande.",
      ],
      rows: [["Clientes que podrían bajar de plan", "≈ 12%"], ["Inversión mínima", "$9 M"], ["Costo de conseguir un cliente con vendedor", "14 meses de recuperación"], ["Competidores con plan gratuito", "3"]],
    },
    error: {
      subject: "{ops}",
      body: [
        "Oye, un ingeniero subió un cambio a producción que borró la configuración de 40 clientes. La restauramos en cuatro horas.",
        "Lo reportó él solo apenas se dio cuenta. Varios clientes ya notaron que algo pasó.",
      ],
      rows: [["Clientes afectados", "40"], ["Tiempo de afectación", "4 horas"], ["Créditos por contrato", "$0.8 M"], ["Control que falló", "Revisión de cambios en producción"]],
    },
  },
};

const RETAIL: BaseContext = {
  industryId: "retail",
  label: "Retail",
  vars: { cliente: "Pagofácil", clientes: "los clientes", lote: "el modelo de calentador", afectado: "los clientes" },
  cases: {
    retiro: {
      subject: "Llamada perdida · {ops} (Operaciones)",
      body: [
        "Oye, dos clientes reportaron que el calentador de nuestra marca propia se sobrecalentó. Uno tuvo una quemadura leve.",
        "El fabricante dice que fue mal uso. Tenemos miles vendidos y otros en anaquel. El laboratorio tarda una semana.",
      ],
      rows: [["Unidades vendidas", "≈ 18 mil"], ["En anaquel", "≈ 6 mil en 60 tiendas"], ["Costo de retiro y reembolso", "$9 M"], ["Reportes", "2, uno con lesión leve"]],
    },
    cliente: {
      subject: "Nuevas comisiones · {company_short}",
      body: [
        "Estimado Director:",
        "Como su procesador de pagos y plataforma de meses sin intereses, vamos a subir la comisión de 3.2% a 4.1% el próximo trimestre.",
        "Nuestra integración está en todas sus tiendas y en su sitio. Si quiere platicarlo, estoy a sus órdenes.",
      ],
      rows: [["Venta con tarjeta", "68% del total"], ["Costo del aumento", "$12 M al año"], ["Contrato vigente", "Termina en 5 meses"], ["Alternativas", "2 procesadores, con migración"]],
    },
    incentivos: {
      subject: "Lo que encontramos en las garantías extendidas",
      body: [
        "Te escribo con algo delicado. Para llegar a la meta de garantías extendidas, vendedores de varias tiendas las están cargando en el ticket sin explicarle al cliente.",
        "La comisión por garantía es más alta que por producto. Las quejas en redes y en la autoridad del consumidor ya se triplicaron.",
      ],
      rows: [["Quejas por garantías", "×3 en 6 meses"], ["Tiendas con el patrón", "≈ 14 de 60"], ["Comisión por garantía", "4 veces la del producto"], ["Ingreso por garantías", "$30 M al año"]],
    },
    ciberataque: {
      subject: "Llamada perdida · {ops} (Operaciones)",
      body: [
        "Oye, atacaron el sistema de las tiendas. El inventario está cifrado y el sitio en línea no carga. Piden rescate.",
        "Las cajas solo cobran en efectivo. Es quincena y las tiendas están llenas.",
      ],
      rows: [["Rescate pedido", "≈ $7 M en criptomonedas"], ["Venta de un día de quincena", "$15 M"], ["Datos de tarjetas", "Los guarda el procesador, no nosotros"], ["Último respaldo", "Hace 2 días, sin probar"]],
    },
    expansion: {
      subject: "Propuesta: 25 tiendas nuevas este año",
      body: [
        "Te escribo antes del consejo. Una cadena que cerró deja 25 locales en buenas plazas, a buen precio. Podemos crecer casi la mitad en un año.",
        "El sistema de inventarios apenas aguanta 60 tiendas y no tenemos gerentes formados para tantas. Pero los locales no van a esperar.",
      ],
      rows: [["Inversión", "$95 M"], ["Venta esperada año 1", "$300 M"], ["Gerentes listos para promover", "8"], ["Sistema de inventario", "Al límite"]],
    },
    precio: {
      subject: "El dólar se movió y nuestros precios no",
      body: [
        "La mitad de lo que vendemos se compra en dólares y el tipo de cambio subió 12%. El margen se nos está yendo.",
        "Necesito que decidas cómo trasladamos el alza, sin perder a los clientes que comparan en línea.",
      ],
      rows: [["Mercancía importada", "50%"], ["Alza del dólar", "+12%"], ["Margen bruto", "34% → 30%"], ["Competidores que ya subieron", "1 de 3"]],
    },
    recorte: {
      subject: "Hay tiendas que ya no tienen sentido",
      body: [
        "Te lo digo sin rodeos: la venta en línea creció y once tiendas ya no cubren su renta. Las sostenemos con lo que dejan las demás.",
        "Si no decidimos, las tiendas buenas se quedan sin inversión.",
      ],
      rows: [["Tiendas con pérdida", "11 de 60"], ["Pérdida anual", "$28 M"], ["Personas en esas tiendas", "≈ 180"], ["Contratos de renta", "7 vencen este año"]],
    },
    proveedor: {
      subject: "{ops}",
      body: [
        "Oye, el centro de distribución del operador logístico que nos surte las tiendas se quemó.",
        "Es nuestro único operador. Las tiendas tienen inventario para 6 días.",
        "Otro operador puede entrar, pero no conoce nuestros procesos. ¿Qué hacemos?",
      ],
      rows: [["Inventario en tiendas", "6 días"], ["Operadores logísticos", "1"], ["Arranque de otro operador", "2 a 4 semanas"], ["Venta semanal en riesgo", "$70 M"]],
    },
    apuesta: {
      subject: "Mercado en línea para otros vendedores: ¿lo abrimos?",
      body: [
        "Te escribo antes del consejo. Podemos abrir nuestro sitio a otros vendedores y cobrar comisión, como los grandes mercados en línea.",
        "El área de compras lo ve como competencia: esos vendedores venderían lo mismo que nosotros, a veces más barato.",
      ],
      rows: [["Visitas al sitio", "2 millones al mes"], ["Inversión mínima", "$15 M"], ["Productos que hoy no tenemos", "Muchos"], ["Riesgo", "Canibalizar margen propio"]],
    },
    error: {
      subject: "{ops}",
      body: [
        "Oye, se publicaron mal los precios en el sitio durante una noche. Varios televisores salieron a una décima parte del precio.",
        "Se vendieron 900 antes de que alguien lo notara. La persona que cargó el archivo lo reportó en la mañana.",
      ],
      rows: [["Pedidos con precio equivocado", "≈ 900"], ["Costo de respetarlos", "$6 M"], ["Ya en redes", "Sí, con capturas"], ["Control que falló", "Revisión de cambios masivos de precio"]],
    },
  },
};

const LOGISTICA: BaseContext = {
  industryId: "logistica_distribucion",
  label: "Logística y distribución",
  vars: { cliente: "Farmacias del Valle", clientes: "los clientes", lote: "los embarques de la cámara 3", afectado: "Farmacias del Valle" },
  cases: {
    retiro: {
      subject: "Llamada perdida · {ops} (Operaciones)",
      body: [
        "Oye, la cámara fría 3 del centro de distribución estuvo fuera de temperatura cuatro horas anoche. Ahí había vacunas y medicamento de un cliente farmacéutico.",
        "El registro dice que no pasó del límite, pero el sensor tiene una falla conocida. Una parte ya salió esta mañana a farmacias.",
      ],
      rows: [["Producto en la cámara", "$25 M en medicamento"], ["Ya enviado", "≈ 40%"], ["Costo de recuperar y destruir", "$11 M"], ["Revisión del sensor", "En 72 horas"]],
    },
    cliente: {
      subject: "Licitación anual · {company_short}",
      body: [
        "Estimado Director:",
        "Para renovar el contrato de distribución necesitamos tarifa 8% menor y penalización por cada entrega fuera de horario.",
        "Dos operadores nacionales ya presentaron propuesta. Le pido su respuesta en dos semanas.",
      ],
      rows: [["Peso de {cliente} en tu venta", "27%"], ["Costo de lo que pide", "$19 M al año"], ["Tus entregas a tiempo", "96%"], ["Costo para ellos de cambiar de operador", "3 meses de transición"]],
    },
    incentivos: {
      subject: "Lo que encontramos en las bitácoras",
      body: [
        "Te escribo con algo serio. Los operadores tienen bono por entregas a tiempo y varios están manejando más horas de las permitidas, con bitácoras alteradas.",
        "Los supervisores lo saben y lo dejan pasar porque su bono también depende de esa meta.",
      ],
      rows: [["Operadores con bitácoras alteradas", "≈ 1 de cada 6"], ["Peso del bono", "25% del ingreso"], ["Incidentes viales en el año", "+30%"], ["Riesgo", "Sanción y responsabilidad por accidentes"]],
    },
    ciberataque: {
      subject: "Llamada perdida · {ops} (Operaciones)",
      body: [
        "Oye, el sistema de almacén está cifrado y piden rescate. No sabemos qué hay en cada ubicación ni a quién va cada tarima.",
        "Hay 300 embarques programados hoy y los clientes ya preguntan.",
      ],
      rows: [["Rescate pedido", "≈ $8 M en criptomonedas"], ["Embarques del día", "300"], ["Último respaldo", "Hace 1 día, sin probar"], ["Clientes con entregas críticas", "{cliente} y 5 más"]],
    },
    expansion: {
      subject: "Propuesta: entrar a la última milla",
      body: [
        "Te escribo antes del consejo. Una plataforma de comercio electrónico nos ofrece toda su entrega a domicilio en Monterrey y Guadalajara. Duplicaría nuestra venta.",
        "Es un negocio distinto: miles de paquetes chicos, repartidores y otra tecnología. Pero si no lo tomamos, lo tomará otro.",
      ],
      rows: [["Inversión", "$70 M"], ["Venta esperada año 1", "$400 M"], ["Experiencia en última milla", "Ninguna"], ["Margen esperado", "Menor que el actual"]],
    },
    precio: {
      subject: "El diésel subió y las tarifas no",
      body: [
        "El diésel subió 15% y las casetas 8%. Nuestras tarifas están fijas en la mayoría de los contratos hasta su renovación.",
        "Necesito que decidas cómo trasladamos el costo.",
      ],
      rows: [["Alza del diésel", "+15%"], ["Peso del combustible en el costo", "35%"], ["Contratos con ajuste por combustible", "30%"], ["Margen operativo", "8% → 5.5%"]],
    },
    recorte: {
      subject: "El cliente más grande se va con su propia flota",
      body: [
        "Te lo adelanto: el cliente de bebidas va a hacer su propia distribución. Era la quinta parte de nuestra venta.",
        "Nos quedan unidades y operadores sin carga. Necesito que decidas qué hacemos.",
      ],
      rows: [["Venta que se va", "21%"], ["Unidades sin carga", "≈ 80"], ["Costo de mantener a todos", "$34 M al año"], ["Prospectos para reemplazarlo", "3, a 6 meses"]],
    },
    proveedor: {
      subject: "{ops}",
      body: [
        "Oye, el taller que da mantenimiento a toda la flota cerró por un problema fiscal.",
        "Es el único que conoce nuestras unidades. Hay 30 en reparación y ya no nos las entregan.",
        "Otro taller nos puede atender, pero no conoce la flota. ¿Qué hacemos?",
      ],
      rows: [["Unidades retenidas", "30"], ["Talleres de respaldo", "0"], ["Unidades que vencen servicio este mes", "60"], ["Entregas en riesgo", "15% de la semana"]],
    },
    apuesta: {
      subject: "Unidades eléctricas en ciudad: ¿apostamos?",
      body: [
        "Te escribo antes del consejo. Los clientes grandes piden reducir emisiones y algunas ciudades van a restringir el diésel en el centro.",
        "Las unidades eléctricas cuestan casi el doble y la red de carga es escasa. Lo de hoy funciona. Lo de mañana no sabemos.",
      ],
      rows: [["Clientes que ya lo piden", "4 de los 10 más grandes"], ["Inversión piloto", "$30 M"], ["Costo por unidad", "≈ 2× una de diésel"], ["Competidores con flota eléctrica", "1"]],
    },
    error: {
      subject: "{ops}",
      body: [
        "Oye, se entregó medicamento de {cliente} en la farmacia equivocada por un error de etiquetado en andén.",
        "Una farmacia se quedó sin producto dos días. El auxiliar que etiquetó lo reportó él mismo. Llevaba doble turno.",
      ],
      rows: [["Entregas cruzadas", "14 tarimas"], ["Farmacias afectadas", "2"], ["Costo de reponer y penalización", "$0.9 M"], ["Control que falló", "Escaneo en andén"]],
    },
  },
};

export const CONTEXTS: Readonly<Record<string, IndustryContext>> = Object.freeze({
  alimentos_bebidas: full(ALIMENTOS),
  autopartes: full(AUTOPARTES),
  restaurantes: full(RESTAURANTES),
  manufactura_general: full(MANUFACTURA),
  software_saas: full(SAAS),
  retail: full(RETAIL),
  logistica_distribucion: full(LOGISTICA),
});

export const contextFor = (industryId: string): IndustryContext | undefined => CONTEXTS[industryId];
