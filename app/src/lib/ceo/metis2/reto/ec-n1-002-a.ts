/**
 * Executive Challenge del Nivel 1 · EC-N1-002-A · «El viernes que nadie quería prometer».
 *
 * Fuente: EXECUTIVE_CHALLENGE_N1_V2.md (Repositorio Académico v1.3). Una sola historia en tres actos
 * (S01–S05, S06–S09, S10–S13) y una síntesis (S14) que no suma habilidades. Las decisiones dejan marcas
 * que cambian lo que dicen los personajes en escenas posteriores.
 *
 * Demostración no acreditativa: no registra evidencias, no da nivel y no tiene regla de aprobación
 * (ningún umbral está aprobado; el reto no guarda candidatos). Las tres salvaguardas distinguen
 * cumplida, corregida tras información nueva y decisión crítica sin corregir.
 * EC-N1-001-A (v1.0) queda intacto en el catálogo editorial.
 */
import type { Reto } from "./tipos";

export const EC_N1_002_A: Reto = {
  id: "reto.n1.el-viernes-que-nadie-queria-prometer",
  editorialId: "EC-N1-002-A",
  slug: "el-viernes-que-nadie-queria-prometer",
  version: 2,
  packageVersion: "1.3",
  title: "El viernes que nadie quería prometer",
  invitation:
    "Pausa Empresa ha crecido este trimestre. Su fundadora necesita revisar por qué la utilidad no se traduce en efectivo disponible, cómo entregar pedidos puntuales y cómo responder ante una falla de etiquetas de seguridad alimentaria. Durante tres actos podrás consultar reportes, hablar con responsables y recomendar decisiones. Tendrás que usar conceptos de las seis academias. Los números relevantes estarán a tu alcance; algunas opiniones no estarán comprobadas.",
  role: "Asesor invitado por mêtis para una revisión de tres días. No eres fundador ni dueño de la empresa.",
  company: "Pausa Empresa: cajas de desayuno personalizadas para reuniones de oficina. Mes ficticio cerrado de 20 días laborables; cifras simplificadas con fines de aprendizaje.",
  characters: [
    { id: "alma", name: "Alma", role: "Fundadora" },
    { id: "elisa", name: "Elisa", role: "Finanzas" },
    { id: "oscar", name: "Óscar", role: "Cocina" },
    { id: "irene", name: "Irene", role: "Calidad" },
    { id: "javier", name: "Javier", role: "Comercial" },
    { id: "dana", name: "Dana", role: "Atención a clientes" },
    { id: "diego", name: "Diego", role: "Coordinación" },
  ],
  docs: [
    {
      id: "d01", letter: "D01", title: "Estado de resultados del mes", unit: "Pesos mexicanos",
      cols: ["Concepto", "Plan", "Real"], layout: "tabla",
      rows: [
        { id: "d01.ventas", label: "Ventas facturadas de cajas entregadas", cells: ["195,000", "180,000"] },
        { id: "d01.costos", label: "Costos directos de las cajas", cells: ["110,000", "108,000"] },
        { id: "d01.gastos", label: "Gastos de operación", cells: ["60,000", "54,000"] },
      ],
      foot: "Sin impuestos, depreciación, intereses ni retiros de los socios. La utilidad operativa se obtiene de estos tres renglones.",
    },
    {
      id: "d02", letter: "D02", title: "Caja, cobros y pagos del mes", unit: "Pesos mexicanos",
      rows: [
        { id: "d02.inicio", label: "Efectivo al inicio del mes", amount: 22000 },
        { id: "d02.cobros", label: "Cobros de clientes del mes", amount: 138000 },
        { id: "d02.proveedores", label: "Pago a proveedores por materiales", amount: -100000 },
        { id: "d02.gastos", label: "Gastos de operación efectivamente pagados", amount: -54000 },
        { id: "d02.porcobrar", label: "Ventas del mes facturadas y aún no cobradas", amount: 42000 },
        { id: "d02.porpagar", label: "Materiales del mes aún no pagados al proveedor", amount: 8000 },
      ],
      foot: "Los dos últimos renglones no son movimientos de caja: son lo que falta cobrar y lo que falta pagar. El inventario empezó y terminó igual.",
    },
    {
      id: "d03", letter: "D03", title: "Balance al inicio y al cierre", unit: "Pesos mexicanos",
      cols: ["Cuenta", "Inicio", "Cierre"], layout: "tabla",
      rows: [
        { id: "d03.efectivo", label: "Efectivo", cells: ["22,000", "6,000"] },
        { id: "d03.cxc", label: "Cuentas por cobrar", cells: ["0", "42,000"] },
        { id: "d03.inventario", label: "Inventario", cells: ["36,000", "36,000"] },
        { id: "d03.equipo", label: "Equipo", cells: ["60,000", "60,000"] },
        { id: "d03.cxp", label: "Cuentas por pagar", cells: ["0", "8,000"] },
        { id: "d03.prestamo", label: "Préstamo bancario", cells: ["76,000", "76,000"] },
        { id: "d03.patrimonio", label: "Patrimonio contable", cells: ["42,000", "60,000"] },
      ],
      foot: "Al inicio: lo que la empresa tiene, 118,000, es igual a lo que debe, 76,000, más el patrimonio, 42,000.",
    },
    {
      id: "d04", letter: "D04", title: "Proceso del día de mayor demanda", unit: "Cajas al día, capacidad sostenida",
      cols: ["Etapa (en orden alfabético)", "Cajas al día"], layout: "tabla",
      rows: [
        { id: "d04.cocina", label: "Cocina y preparación", cells: ["95"] },
        { id: "d04.despachar", label: "Despachar", cells: ["85"] },
        { id: "d04.empacar", label: "Empacar", cells: ["80"] },
        { id: "d04.etiquetar", label: "Etiquetar y verificar alérgenos", cells: ["70"] },
        { id: "d04.registrar", label: "Registrar pedido y preparar insumos", cells: ["120"] },
        { id: "d04.demanda", label: "Cajas comprometidas para ese día", cells: ["90"], strong: true },
      ],
      foot: "Todas las cajas pasan por las cinco etapas. No hay cajas guardadas entre etapas ni horas extra.",
    },
    {
      id: "d05", letter: "D05", title: "Servicio y calidad", unit: "Órdenes y cajas del último mes", from: "S03",
      cols: ["Dato", "Detalle"], layout: "ficha",
      rows: [
        { id: "d05.ordenes", label: "Órdenes corporativas del mes", cells: ["40 órdenes. Cada orden puede tener varias cajas."] },
        { id: "d05.atiempo", label: "Llegaron en la fecha y hora prometidas", cells: ["28 órdenes"] },
        { id: "d05.lote", label: "Lote de prueba revisado antes de salir", cells: ["100 cajas"] },
        { id: "d05.etiqueta", label: "Sin etiqueta correcta de alérgenos", cells: ["4 cajas"] },
        { id: "d05.empaque", label: "Con empaque dañado", cells: ["3 cajas, distintas de las anteriores"] },
      ],
    },
    {
      id: "d06", letter: "D06-A", title: "Clientes: quién participa y qué valoran", unit: "Definido para Pausa Empresa",
      cols: ["Quién", "Qué hace en la compra"], layout: "ficha",
      rows: [
        { id: "d06.admin", label: "Administración de oficinas", cells: ["Firma el contrato y paga la factura."] },
        { id: "d06.empleados", label: "Empleados", cells: ["Comen el desayuno en la reunión."] },
        { id: "d06.rh", label: "Recursos Humanos", cells: ["Suele sugerir el proveedor y gestionar pedidos."] },
        { id: "d06.pequenas", label: "Oficinas pequeñas", cells: ["Piden seguido, cambian el pedido de última hora, preguntan el precio por caja."] },
        { id: "d06.eventos", label: "Eventos corporativos grandes", cells: ["Piden muchas cajas iguales para una hora exacta."] },
      ],
    },
    {
      id: "d06b", letter: "D06-B", title: "Embudo comercial de las últimas dos semanas", unit: "Contactos, cotizaciones y contratos",
      cols: ["Canal", "Contactos", "Cotizaciones", "Contratos"], layout: "tabla",
      rows: [
        { id: "d06b.web", label: "Formulario web", cells: ["24", "12", "6"] },
        { id: "d06b.ref", label: "Referencias", cells: ["10", "8", "5"] },
      ],
      foot: "No hay datos del costo de conseguir cada contacto ni del valor de cada contrato.",
    },
    {
      id: "d06c", letter: "D06-C", title: "Una caja estándar", unit: "Pesos por caja", from: "S11",
      rows: [
        { id: "d06c.precio", label: "Precio de lista", amount: 300 },
        { id: "d06c.costo", label: "Costo directo", amount: 180 },
      ],
      foot: "Un cliente pide 10 % de descuento en un pedido de 100 cajas. El costo por caja no cambia.",
    },
    {
      id: "d07", letter: "D07", title: "Personas, frases y alertas", unit: "Lo que se dijo esta semana",
      cols: ["Quién o qué", "Detalle"], layout: "ficha",
      rows: [
        { id: "d07.alma", label: "Alma", cells: ["«Hagamos 80 llamadas esta semana»."] },
        { id: "d07.javier", label: "Javier", cells: ["«Contratemos vendedores ahora»."] },
        { id: "d07.diego", label: "Diego", cells: ["«Pasemos la puntualidad de 70 a 90 % en dos meses»."] },
        { id: "d07.dana", label: "Dana", cells: ["«Óscar siempre es negligente, por eso tardamos»."] },
        { id: "d07.registro", label: "Registro de entregas", cells: ["No dice quién o qué causó cada una de las 12 órdenes tardías."] },
        { id: "d07.cajas", label: "Inspección", cells: ["Cuatro cajas sin etiqueta correcta de alérgenos están retenidas. No se sabe de daño a ninguna persona."] },
        { id: "d07.banco", label: "Correo de un proveedor", cells: ["Pide cambiar su cuenta bancaria. Llegó desde una dirección que no es su canal verificado."] },
      ],
    },
    {
      id: "d08", letter: "D08", title: "Comparativo de un competidor", unit: "Lo que se sabe de él", from: "S01",
      cols: ["Aspecto", "Competidor"], layout: "ficha",
      rows: [
        { id: "d08.precio", label: "Precio", cells: ["Parecido al nuestro."] },
        { id: "d08.personal", label: "Personalización", cells: ["Menos opciones por caja; no indica alérgenos por caja."] },
        { id: "d08.puntual", label: "Puntualidad", cells: ["No hay dato."] },
      ],
    },
    {
      id: "d09", letter: "D09", title: "Tablero de iniciativas propuestas", unit: "Ninguna está aprobada", from: "S02",
      cols: ["Iniciativa", "Detalle"], layout: "ficha",
      rows: [
        { id: "d09.anuncios", label: "Anuncios en redes", cells: ["$12,000 al mes. Promete más contactos; no hay dato de cuántos."] },
        { id: "d09.etiquetado", label: "Revisar el proceso de etiquetado", cells: ["Sin inversión definida todavía."] },
        { id: "d09.vendedor", label: "Vendedor temporal", cells: ["$10,000 al mes. Javier calcula más cotizaciones; no lo ha medido."] },
      ],
      foot: "Son propuestas: ninguna se ha pagado ni se descuenta de la caja.",
    },
    {
      id: "d10", letter: "D10", title: "Registros de cocina de las órdenes tardías", unit: "Lo que trae Óscar", from: "S09",
      cols: ["Registro", "Detalle"], layout: "ficha",
      rows: [
        { id: "d10.etiquetado", label: "Salidas de etiquetado", cells: ["Algunas cajas salieron tarde de etiquetado."] },
        { id: "d10.reparto", label: "Reparto", cells: ["Algunas salieron a tiempo y llegaron tarde."] },
        { id: "d10.limite", label: "Lo que no dicen", cells: ["No alcanzan para saber la causa de las 12."] },
      ],
    },
    {
      id: "d11", letter: "D11", title: "Correo del proveedor y directorio", unit: "Pagos a proveedores", from: "S13",
      cols: ["Fuente", "Detalle"], layout: "ficha",
      rows: [
        { id: "d11.correo", label: "Correo recibido", cells: ["«Por cambio de banco, depositen hoy la factura a esta cuenta nueva». Dirección distinta de la registrada."] },
        { id: "d11.directorio", label: "Directorio verificado", cells: ["Teléfono y correo del proveedor registrados al firmar el contrato."] },
        { id: "d11.regla", label: "Política de pagos", cells: ["Cambiar datos bancarios requiere la firma de dos personas."] },
      ],
    },
  ],
  acts: [
    { id: "a1", title: "Entender el negocio", text: "La fundadora, finanzas y los números del mes." },
    { id: "a2", title: "Operación y personas", text: "La cocina, la calidad y las conversaciones difíciles." },
    { id: "a3", title: "Clientes, riesgos y decisión final", text: "Quién compra, cuánto cuesta un descuento, una falla de etiquetas y un correo sospechoso." },
  ],
  scenes: [
    // ─────────────────────────────────────────────── Acto I
    {
      id: "S01", act: 0, title: "Lo que vendemos no es solo desayuno", skills: ["est.fundamentos", "est.ventaja"],
      people: ["alma", "javier"], docs: ["d06", "d07", "d08"], origen: "fuente",
      intro: { text: "Lunes, 9:00. Alma te recibe con Javier en la sala de juntas. Sobre la mesa, la ficha de clientes, las frases de la semana y un comparativo de un competidor." },
      steps: [
        {
          id: "s01.valor", kind: "decision", skill: "est.fundamentos", points: 2, from: "alma", origen: "adaptado",
          text: { text: "Antes de nada, ayúdame a decirlo en una frase: ¿qué vende Pausa Empresa a sus clientes?" },
          options: [
            { id: "propuesta", tipo: "defendible", score: 2, origen: "fuente", text: "Cajas para reuniones que llegan a la hora pactada y dicen claro qué alérgenos llevan.", reply: [{ who: "alma", text: "Eso es lo que nos piden de verdad. Lo anoto así." }], nota: "Es una propuesta de valor: dice para quién y qué resuelve, no solo el producto." },
            { id: "eslogan", tipo: "concepto_erroneo", score: 0, origen: "conversion", text: "Desayunos deliciosos y abundantes a buen precio, para que todos empiecen el día felices.", reply: [{ who: "javier", text: "Suena bonito, pero lo podría decir cualquier cafetería de la cuadra." }], nota: "Es un eslogan: no dice qué problema del cliente se resuelve ni por qué elegirnos." },
            { id: "actividad", tipo: "concepto_erroneo", score: 0, origen: "conversion", text: "Hacer 80 llamadas esta semana y conseguir más oficinas que nos compren.", reply: [{ who: "alma", text: "Eso es lo que quiero hacer esta semana, no lo que le vendemos al cliente." }], nota: "Es una actividad comercial, no lo que el cliente recibe." },
            { id: "producto", tipo: "riesgosa", score: 1, origen: "conversion", text: "Cajas de desayuno personalizadas con fruta, pan, café y jugo para oficinas.", reply: [{ who: "javier", text: "Es lo que hay dentro de la caja. ¿Y por qué nos eligen a nosotros?" }], nota: "Describe el producto, pero no el valor que el cliente busca." },
          ],
        },
        {
          id: "s01.frases", kind: "clasificar", skill: "est.fundamentos", points: 2, from: "alma", origen: "adaptado",
          text: { text: "Esta semana cada quien trae su frase. Sepáralas: ¿cuál fija un resultado con plazo y cuál es solo una actividad?" },
          groups: [{ id: "resultado", label: "Resultado con plazo" }, { id: "actividad", label: "Actividad" }],
          items: [
            { id: "llamadas", text: "Hagamos 80 llamadas esta semana", group: "actividad", why: "Dice qué hacer, no qué resultado lograr." },
            { id: "vendedores", text: "Contratemos vendedores ahora", group: "actividad", why: "Es un medio; no fija qué debe cambiar." },
            { id: "puntualidad", text: "Pasemos la puntualidad de 70 a 90 % en dos meses", group: "resultado", why: "Fija dónde estamos, a dónde llegar y en cuánto tiempo." },
            { id: "revisar", text: "Revisemos el etiquetado esta semana", group: "actividad", why: "Es una tarea útil, pero no dice qué resultado busca." },
          ],
        },
        {
          id: "s01.ventaja", kind: "decision", skill: "est.ventaja", points: 3, from: "javier", origen: "adaptado",
          text: { text: "Quiero poner en la web: «Somos los más puntuales del mercado». El competidor no publica su puntualidad, así que nadie nos puede desmentir. ¿Lo hacemos?" },
          options: [
            { id: "sustentada", tipo: "defendible", score: 3, sets: { ventaja: "sustentada" }, origen: "fuente", text: "No. Mejor destacar alérgenos claros por caja, que sí podemos mostrar y el otro no tiene.", reply: [{ who: "javier", text: "Va. ¿Y qué tendríamos que seguir midiendo para poder sostenerlo?" }], nota: "Una diferencia plausible y comprobable; «los más puntuales» no tiene prueba." },
            { id: "promesa", tipo: "riesgosa", score: 0, sets: { ventaja: "promesa" }, origen: "fuente", text: "Sí. Si nadie publica el dato, nadie puede decir que no somos los más puntuales de la ciudad.", reply: [{ who: "javier", text: "Perfecto. Aunque si alguien pregunta con qué indicador lo comprobamos, no tengo qué enseñarle." }], nota: "Se afirma una superioridad sin datos; hoy la puntualidad propia es de 70 %." },
            { id: "precio", tipo: "concepto_erroneo", score: 1, sets: { ventaja: "sustentada" }, origen: "conversion", text: "No. Mejor competir por precio y bajar lo necesario para quedar igual que el otro.", reply: [{ who: "alma", text: "Ya cobramos parecido. Si bajamos, ¿qué nos queda que el otro no tenga?" }], nota: "El precio ya es parecido; bajarlo no crea una diferencia y reduce el margen." },
            { id: "despues", tipo: "riesgosa", score: 1, sets: { ventaja: "promesa" }, origen: "conversion", text: "Sí, pero solo cuando lleguemos a 90 %; mientras, ponemos «muy puntuales».", reply: [{ who: "javier", text: "Lo dejo listo. Aunque 90 % propio tampoco dice cómo vamos frente a otros." }], nota: "Sigue sin dato comparativo; cambia la palabra, no la prueba." },
          ],
        },
        {
          id: "s01.prueba", kind: "escribir", skill: "est.ventaja", points: 1, from: "javier", origen: "fuente",
          text: { text: "¿Qué evidencia tendríamos que mantener para sostener esa diferencia frente a los clientes?", alt: [{ when: { flag: "ventaja", is: "promesa" }, text: "Si alguien nos pide la prueba de lo que pongamos en la web, ¿qué evidencia tendríamos que tener?" }] },
          fields: [{ id: "evidencia", label: "La evidencia que mantendrías" }],
          reference: "Registro por caja de los alérgenos que lleva y de las revisiones de etiqueta; si algún día se habla de puntualidad, el porcentaje de órdenes a tiempo medido igual cada semana y un dato comparable del mercado.",
          ideas: ["Nombra un registro o indicador concreto", "Reconoce qué falta para compararse con otros", "No inventa superioridad"],
        },
      ],
    },
    {
      id: "S02", act: 0, title: "Elegir también es renunciar", skills: ["est.priorizacion", "est.alineacion"],
      people: ["alma", "javier", "diego"], docs: ["d09", "d07"], origen: "fuente",
      intro: { text: "Alma abre el tablero de iniciativas. Hay dinero para una cosa a la vez y la puntualidad de las órdenes está en 70 %." },
      steps: [
        {
          id: "s02.prioridad", kind: "decision", skill: "est.priorizacion", points: 3, from: "alma", origen: "adaptado",
          text: { text: "Javier quiere anuncios, Diego quiere arreglar el etiquetado, y el vendedor temporal también suena bien. ¿Por dónde empezamos este mes?" },
          options: [
            { id: "servicio", tipo: "defendible", score: 3, sets: { prioridad: "servicio" }, origen: "fuente", text: "Primero el etiquetado; anuncios y vendedor esperan hasta que entreguemos a tiempo.", reply: [{ who: "javier", text: "Lo acepto. Pero ponle fecha: ¿cuándo volvemos a ver lo de los anuncios?" }], nota: "Prioriza lo que limita el servicio y dice qué se pospone y por qué." },
            { id: "anuncios", tipo: "riesgosa", score: 0, sets: { prioridad: "captar" }, origen: "fuente", text: "Primero los anuncios: más clientes nos darán el dinero que necesitamos para arreglar lo demás.", reply: [{ who: "alma", text: "¿Y si llegan más pedidos y no podemos cumplir la hora? Prometeríamos algo que no sale." }], nota: "Atrae más pedidos a un proceso que hoy no los entrega a tiempo." },
            { id: "todo", tipo: "riesgosa", score: 1, sets: { prioridad: "todo" }, origen: "conversion", text: "Las tres a la vez, con un poco de dinero para cada una, para no frenar nada.", reply: [{ who: "diego", text: "Con un poco para cada una, no sé cuál termina primero ni cuál funcionó." }], nota: "No elige: reparte poco en todo y no dice qué se deja." },
            { id: "vendedor", tipo: "concepto_erroneo", score: 0, sets: { prioridad: "captar" }, origen: "conversion", text: "El vendedor temporal, porque cuesta menos que los anuncios y vende más.", reply: [{ who: "diego", text: "Más cotizaciones con el mismo etiquetado son más órdenes tarde." }], nota: "Compara costos de dos iniciativas, pero ignora la restricción del servicio." },
          ],
        },
        {
          id: "s02.pospone", kind: "escribir", skill: "est.priorizacion", points: 1, from: "javier", origen: "fuente",
          text: { text: "Explícamelo para que se lo pueda contar al equipo: ¿qué se pospone y por qué?" },
          fields: [{ id: "pospone", label: "Qué se pospone y por qué" }],
          reference: "Se posponen anuncios y vendedor porque el etiquetado limita lo que podemos entregar a tiempo (70 % hoy); se revisan en una fecha fija cuando la puntualidad mejore.",
          ideas: ["Dice qué iniciativa se pospone", "Nombra la restricción (capacidad o puntualidad)", "Pone una fecha o condición para revisarlo"],
        },
        {
          id: "s02.meta", kind: "armar", skill: "est.alineacion", points: 4, from: "diego", origen: "adaptado",
          text: { text: "Quiero una meta que se pueda revisar sin discutir. Ármala pieza por pieza." },
          slots: [
            { id: "unidad", label: "Qué se mide", answer: "ordenes", why: "La promesa al cliente es por orden; las cajas producidas no dicen si llegaron a tiempo.", choices: [{ id: "cajas", text: "Cajas producidas al día" }, { id: "ordenes", text: "Órdenes entregadas a tiempo sobre órdenes totales" }, { id: "llamadas", text: "Llamadas hechas a clientes" }] },
            { id: "nivel", label: "A dónde llegar", answer: "noventa", why: "Un nivel concreto se puede comprobar; «lo más alto posible» no.", choices: [{ id: "maximo", text: "Lo más alto posible" }, { id: "cien", text: "100 % desde mañana" }, { id: "noventa", text: "Al menos 90 %" }] },
            { id: "plazo", label: "En cuánto tiempo", answer: "dosmeses", why: "Un plazo cierto permite saber si se logró.", choices: [{ id: "dosmeses", text: "Al terminar dos meses" }, { id: "pronto", text: "Cuando se pueda" }, { id: "semana", text: "Esta misma semana" }] },
            { id: "dueno", label: "Quién responde y cuándo se revisa", answer: "diego", why: "Una persona responsable y una revisión fija; «todos» diluye la responsabilidad.", choices: [{ id: "todos", text: "Todo el equipo, cuando haya tiempo" }, { id: "diego", text: "Diego, que reporta el porcentaje cada viernes" }, { id: "alma", text: "Alma, que revisa cada pedido" }] },
          ],
          result: "Al menos 90 % de las órdenes entregadas a tiempo al terminar dos meses; Diego reporta el porcentaje cada viernes.",
        },
      ],
    },
    {
      id: "S03", act: 0, title: "Ventas no es el dinero en la cuenta", skills: ["fin.lenguaje", "fin.resultados"],
      people: ["elisa", "alma"], docs: ["d01", "d02"], origen: "fuente",
      intro: { text: "Martes temprano. Elisa abre el estado de resultados y la hoja de caja. Alma entra con una pregunta." },
      steps: [
        {
          id: "s03.vocab", kind: "clasificar", skill: "fin.lenguaje", points: 2, from: "elisa", origen: "adaptado",
          text: { text: "Antes de calcular, pon cada renglón en su lugar. Algunos son del resultado y otros son de la caja." },
          groups: [{ id: "ingreso", label: "Ingreso" }, { id: "costo", label: "Costo directo" }, { id: "gasto", label: "Gasto de operación" }, { id: "caja", label: "Movimiento de caja" }],
          items: [
            { id: "ventas", text: "Ventas facturadas de cajas entregadas", group: "ingreso", why: "Se reconoce al entregar y facturar, aunque no se haya cobrado." },
            { id: "costos", text: "Costos directos de las cajas", group: "costo", why: "Lo que cuesta hacer cada caja." },
            { id: "gastos", text: "Gastos de operación del mes", group: "gasto", why: "Lo que cuesta operar, aunque no se haga ninguna caja." },
            { id: "cobros", text: "Cobros de clientes", group: "caja", why: "Es dinero que entra a la cuenta; no es lo mismo que la venta." },
            { id: "pagos", text: "Pago a proveedores", group: "caja", why: "Es dinero que sale; no es lo mismo que el costo del mes." },
          ],
        },
        {
          id: "s03.utilidad", kind: "cifras", skill: "fin.resultados", points: 4, from: "elisa", origen: "fuente",
          text: { text: "Con el estado de resultados: ¿cuánto fue la utilidad operativa real y cuánto decía el plan?" },
          fields: [
            { id: "real", label: "Utilidad operativa real", answer: 18000, unit: "$", calc: "180,000 − 108,000 − 54,000 = 18,000", points: 3 },
            { id: "plan", label: "Utilidad operativa del plan", answer: 25000, unit: "$", calc: "195,000 − 110,000 − 60,000 = 25,000", points: 1 },
          ],
        },
        {
          id: "s03.pago", kind: "decision", skill: "fin.lenguaje", points: 2, from: "alma", origen: "fuente",
          text: { text: "Si ganamos eso, ya puedo pagar hoy los anuncios de 12,000, ¿verdad?" },
          options: [
            { id: "distingue", tipo: "defendible", score: 2, sets: { caja: "distingue" }, origen: "fuente", text: "Antes hay que ver la caja: la utilidad no es el dinero que hay en la cuenta.", reply: [{ who: "elisa", text: "Exacto. Antes de prometer un pago, miremos cuánto efectivo hay y qué falta cobrar." }], nota: "Separa utilidad de efectivo antes de comprometer un pago." },
            { id: "confunde", tipo: "concepto_erroneo", score: 0, sets: { caja: "confunde" }, origen: "fuente", text: "Sí: con 18,000 de utilidad en el mes alcanzan de sobra los 12,000 de los anuncios.", reply: [{ who: "elisa", text: "Espera. Te paso la hoja de caja antes de que alguien firme." }], nota: "Confunde utilidad con efectivo disponible." },
            { id: "mitad", tipo: "riesgosa", score: 0, sets: { caja: "confunde" }, origen: "conversion", text: "Sí, pero mejor pagar la mitad hoy y la otra mitad la semana que viene.", reply: [{ who: "elisa", text: "Partirlo no cambia la pregunta: ¿hay efectivo hoy?" }], nota: "Reparte el pago sin mirar la caja." },
            { id: "patrimonio", tipo: "concepto_erroneo", score: 0, sets: { caja: "confunde" }, origen: "conversion", text: "Sí, y si no alcanza usamos el patrimonio, que es mucho más que eso.", reply: [{ who: "elisa", text: "El patrimonio no es una cuenta de banco. Mañana te lo enseño en el balance." }], nota: "El patrimonio no es dinero disponible." },
          ],
        },
      ],
    },
    {
      id: "S04", act: 0, title: "La foto del negocio", skills: ["fin.balance"],
      people: ["elisa", "alma"], docs: ["d03"], origen: "fuente",
      intro: { text: "Elisa trae el balance al inicio y al cierre del mes. Las cuentas vienen sin encabezados de grupo." },
      steps: [
        {
          id: "s04.clasificar", kind: "clasificar", skill: "fin.balance", points: 2, from: "elisa", origen: "adaptado",
          text: { text: "Pon cada cuenta del cierre donde va: lo que la empresa tiene, lo que debe y lo que es de los dueños." },
          groups: [{ id: "activo", label: "Activo: lo que tiene" }, { id: "pasivo", label: "Pasivo: lo que debe" }, { id: "patrimonio", label: "Patrimonio" }],
          items: [
            { id: "efectivo", text: "Efectivo", group: "activo", why: "Dinero en la cuenta." },
            { id: "cxc", text: "Cuentas por cobrar", group: "activo", why: "Dinero que los clientes deben a la empresa." },
            { id: "inventario", text: "Inventario", group: "activo", why: "Materiales que la empresa tiene." },
            { id: "equipo", text: "Equipo", group: "activo", why: "Bienes que la empresa usa para producir." },
            { id: "cxp", text: "Cuentas por pagar", group: "pasivo", why: "Lo que la empresa debe a proveedores." },
            { id: "prestamo", text: "Préstamo bancario", group: "pasivo", why: "Lo que la empresa debe al banco." },
            { id: "patrimonio", text: "Patrimonio contable", group: "patrimonio", why: "Lo que queda para los dueños después de las deudas." },
          ],
        },
        {
          id: "s04.activo", kind: "cifras", skill: "fin.balance", points: 1, from: "elisa", origen: "fuente",
          text: { text: "Comprueba que cuadra: ¿cuánto suma todo lo que la empresa tiene al cierre?" },
          fields: [{ id: "activo", label: "Activo total al cierre", answer: 144000, unit: "$", calc: "6,000 + 42,000 + 36,000 + 60,000 = 144,000", points: 1 }],
        },
        {
          id: "s04.alma", kind: "decision", skill: "fin.balance", points: 1, from: "alma", origen: "fuente",
          text: { text: "¡El patrimonio subió a 60,000! Con eso pago los anuncios y me sobra." },
          options: [
            { id: "noefectivo", tipo: "defendible", score: 1, origen: "fuente", text: "El patrimonio no es dinero en la cuenta; el efectivo al cierre es de 6,000.", reply: [{ who: "elisa", text: "Eso. Y tampoco es lo que valdría la empresa si la vendieras." }], nota: "Distingue patrimonio de efectivo y de precio de venta." },
            { id: "valor", tipo: "concepto_erroneo", score: 0, origen: "conversion", text: "Sí, y además 60,000 es lo que valdría la empresa si hoy la vendieras.", reply: [{ who: "elisa", text: "No. Es una cifra contable; ni es efectivo ni es precio de venta." }], nota: "Confunde patrimonio contable con valor de venta." },
            { id: "deuda", tipo: "riesgosa", score: 0, origen: "conversion", text: "Sí, aunque antes conviene liquidar el préstamo bancario con ese dinero.", reply: [{ who: "elisa", text: "¿Con qué dinero? En la cuenta hay 6,000." }], nota: "Trata el patrimonio como efectivo disponible." },
          ],
        },
      ],
    },
    {
      id: "S05", act: 0, title: "La caja y el plan no se parecen", skills: ["fin.flujo", "fin.presupuesto"],
      people: ["elisa", "alma"], docs: ["d02", "d01"], origen: "fuente",
      intro: {
        text: "Miércoles. Elisa pone lado a lado la hoja de caja y el plan del mes.",
        alt: [{ when: { flag: "caja", is: "confunde" }, text: "Miércoles. Elisa no dice nada de lo de ayer: solo pone la hoja de caja encima del estado de resultados." }],
      },
      steps: [
        {
          id: "s05.caja", kind: "cifras", skill: "fin.flujo", points: 3, from: "elisa", origen: "adaptado",
          text: { text: "La utilidad fue positiva, pero el efectivo bajó. ¿Cuánto bajó en el mes? ¿Y cuánto suman las ventas por cobrar menos los materiales por pagar?" },
          fields: [
            { id: "bajo", label: "Cuánto bajó el efectivo en el mes", answer: 16000, unit: "$", calc: "138,000 − 100,000 − 54,000 = −16,000", points: 2 },
            { id: "puente", label: "Ventas por cobrar menos materiales por pagar", answer: 34000, unit: "$", calc: "42,000 − 8,000 = 34,000", points: 1 },
          ],
        },
        {
          id: "s05.variacion", kind: "cifras", skill: "fin.presupuesto", points: 2, from: "elisa", origen: "fuente",
          text: { text: "Ahora contra el plan: ¿por cuánto quedó la utilidad real debajo de la del plan?" },
          fields: [{ id: "debajo", label: "Utilidad real debajo del plan", answer: 7000, unit: "$", calc: "25,000 − 18,000 = 7,000", points: 2 }],
        },
        {
          id: "s05.efectos", kind: "clasificar", skill: "fin.presupuesto", points: 2, from: "elisa", origen: "fuente",
          text: { text: "¿Qué renglones explican esa diferencia? Pon cada uno según su efecto en la utilidad frente al plan." },
          groups: [{ id: "baja", label: "La bajó" }, { id: "sube", label: "La subió" }],
          items: [
            { id: "ventas", text: "Ventas: 15,000 menos que el plan", group: "baja", why: "Menos ventas, menos utilidad." },
            { id: "costos", text: "Costos directos: 2,000 menos que el plan", group: "sube", why: "Menos costo ayuda al resultado, aunque no prueba eficiencia: se vendió menos." },
            { id: "gastos", text: "Gastos de operación: 6,000 menos que el plan", group: "sube", why: "Menos gasto ayuda al resultado contable." },
          ],
        },
        {
          id: "s05.anuncios", kind: "decision", skill: "fin.flujo", points: 1, from: "alma", origen: "fuente",
          text: {
            text: "Javier insiste: los anuncios cuestan 12,000 y hay que pagarlos hoy para empezar el lunes. ¿Los pago?",
            alt: [
              { when: { flag: "prioridad", is: "captar" }, text: "Tú propusiste empezar por los anuncios. Cuestan 12,000 y hay que pagarlos hoy. ¿Los pago?" },
              { when: { flag: "prioridad", is: "servicio" }, text: "Sé que propusiste empezar por el etiquetado, pero Javier insiste: los anuncios cuestan 12,000 y hay que pagarlos hoy. ¿Los pago?" },
            ],
          },
          options: [
            { id: "esperar", tipo: "defendible", score: 1, sets: { anuncios: "espera" }, origen: "fuente", text: "Hoy no: la caja cerró en 6,000. Primero cobrar los 42,000 y luego decidir.", reply: [{ who: "elisa", text: "Hago la lista de cobros hoy. Los anuncios no se cancelan, se deciden con la caja a la vista." }], nota: "Ve que el pago excede el efectivo y propone una fuente concreta antes de gastar." },
            { id: "pagar", tipo: "riesgosa", score: 0, sets: { anuncios: "paga" }, origen: "conversion", text: "Sí: la utilidad del mes alcanza, y el lunes ya traerán clientes nuevos.", reply: [{ who: "elisa", text: "La cuenta tiene 6,000. Si salen 12,000 hoy, la nómina no pasa." }], nota: "Paga con la utilidad, que no es efectivo." },
            { id: "credito", tipo: "riesgosa", score: 0, sets: { anuncios: "paga" }, origen: "conversion", text: "Sí, con la tarjeta de la empresa, y que finanzas vea después cómo pagarla.", reply: [{ who: "elisa", text: "Eso es deuda nueva sin plan para pagarla. ¿Con qué cobro la cubrimos?" }], nota: "Toma deuda sin revisar la caja ni los cobros." },
          ],
        },
      ],
    },
    // ─────────────────────────────────────────────── Acto II
    {
      id: "S06", act: 1, title: "¿Dónde se detiene todo?", skills: ["ope.procesos", "ope.capacidad"],
      people: ["oscar", "diego"], docs: ["d04"], origen: "fuente",
      intro: { text: "Miércoles en la planta. Óscar te recibe en cocina. Mañana hay un pedido de 90 cajas para un evento." },
      steps: [
        {
          id: "s06.orden", kind: "ordenar", skill: "ope.procesos", points: 3, from: "oscar", origen: "fuente",
          text: { text: "La hoja trae las etapas en orden alfabético. Ponlas en el orden en que pasa una caja." },
          cards: [
            { id: "empacar", text: "Empacar" },
            { id: "registrar", text: "Registrar pedido y preparar insumos" },
            { id: "despachar", text: "Despachar" },
            { id: "cocina", text: "Cocina y preparación" },
            { id: "etiquetar", text: "Etiquetar y verificar alérgenos" },
          ],
          order: ["registrar", "cocina", "empacar", "etiquetar", "despachar"],
          why: "La caja se registra, se cocina, se empaca, se etiqueta y verifica, y sale.",
        },
        {
          id: "s06.etiquetar", kind: "armar", skill: "ope.procesos", points: 1, from: "diego", origen: "adaptado",
          text: { text: "Para revisar la etapa de etiquetado, dime qué le entra y qué le sale." },
          slots: [
            { id: "entra", label: "Le entra", answer: "empacadas", why: "Etiquetar recibe lo que sale de empacar, con el pedido y su lista de alérgenos.", choices: [{ id: "empacadas", text: "Cajas empacadas con su pedido y su lista de alérgenos" }, { id: "registro", text: "Pedidos recién registrados, sin cocinar" }, { id: "rutas", text: "Rutas de reparto del día" }] },
            { id: "sale", label: "Le sale", answer: "verificadas", why: "Lo que sale debe estar listo para despachar: etiquetado y verificado.", choices: [{ id: "insumos", text: "Insumos listos para cocinar" }, { id: "verificadas", text: "Cajas etiquetadas y verificadas, listas para despachar" }, { id: "facturas", text: "Facturas enviadas al cliente" }] },
          ],
          result: "Entran cajas empacadas con su lista de alérgenos; salen cajas etiquetadas y verificadas.",
        },
        {
          id: "s06.capacidad", kind: "cifras", skill: "ope.capacidad", points: 2, from: "oscar", origen: "fuente",
          text: { text: "¿Cuántas cajas al día puede sacar todo el proceso como máximo? ¿Y cuántas faltan para el pedido de mañana?" },
          fields: [
            { id: "max", label: "Máximo del proceso, cajas al día", answer: 70, unit: "", calc: "La etapa más lenta: mínimo de 120, 95, 80, 70 y 85 = 70", points: 1, lee: true },
            { id: "brecha", label: "Cajas que faltan para 90", answer: 20, unit: "", calc: "90 − 70 = 20", points: 1 },
          ],
        },
        {
          id: "s06.empacadores", kind: "decision", skill: "ope.capacidad", points: 2, from: "oscar", origen: "fuente",
          text: { text: "Empacar hace 80 y está al límite. Si contratamos dos empacadores, mañana salimos, ¿no?" },
          options: [
            { id: "etiquetado", tipo: "defendible", score: 2, sets: { capacidad: "etiquetado" }, origen: "fuente", text: "No alcanza: etiquetado hace 70; más empaque no saca más cajas de ahí.", reply: [{ who: "oscar", text: "Entonces la fila se forma en etiquetado. Hablo con Irene para ver cómo subirlo." }], nota: "Ataca la etapa que limita el sistema." },
            { id: "empacar", tipo: "riesgosa", score: 0, sets: { capacidad: "empaque" }, origen: "fuente", text: "Sí: empacar está cerca del límite y con dos personas más ya no lo estará.", reply: [{ who: "diego", text: "Con más empacadores tendremos más cajas esperando etiqueta. Siguen saliendo 70." }], nota: "Mejora una etapa que no es la más lenta." },
            { id: "todas", tipo: "concepto_erroneo", score: 0, sets: { capacidad: "empaque" }, origen: "conversion", text: "Contratar a una persona más en cada etapa para que todas suban igual.", reply: [{ who: "oscar", text: "Eso cuesta en todas partes y solo una etapa nos frena." }], nota: "Gasta en etapas que no limitan." },
            { id: "prometer", tipo: "riesgosa", score: 1, sets: { capacidad: "empaque" }, origen: "conversion", text: "Aceptar las 90 y que el equipo se quede hasta que salgan todas.", reply: [{ who: "diego", text: "El dato dice sin horas extra. Y cansados, etiquetamos peor." }], nota: "Ve que faltan cajas, pero lo resuelve forzando el proceso sin revisar la etapa limitante." },
          ],
        },
      ],
    },
    {
      id: "S07", act: 1, title: "Verde no significa seguro", skills: ["ope.indicadores", "ope.calidad"],
      people: ["irene", "diego"], docs: ["d05"], origen: "fuente",
      intro: {
        text: "Irene, de calidad, te alcanza junto a la mesa de inspección. Diego trae su tablero.",
        alt: [{ when: { flag: "ventaja", is: "promesa" }, text: "Irene te alcanza junto a la mesa de inspección. Diego trae su tablero y comenta que la web ya dice que somos muy puntuales." }],
      },
      steps: [
        {
          id: "s07.kpi", kind: "cifras", skill: "ope.indicadores", points: 2, from: "diego", origen: "fuente",
          text: { text: "Con el reporte del mes: ¿qué porcentaje de órdenes llegó a tiempo? ¿Cuántos puntos faltan para la meta de 90?" },
          fields: [
            { id: "puntual", label: "Órdenes a tiempo", answer: 70, unit: "%", calc: "28 / 40 = 70 %", points: 1 },
            { id: "faltan", label: "Puntos que faltan para 90 %", answer: 20, unit: "", calc: "90 − 70 = 20", points: 1 },
          ],
        },
        {
          id: "s07.verde", kind: "decision", skill: "ope.indicadores", points: 2, from: "diego", origen: "fuente",
          text: { text: "Esta semana producimos 100 cajas sin faltar ninguna. Yo pondría el tablero en verde." },
          options: [
            { id: "ordenes", tipo: "defendible", score: 2, origen: "fuente", text: "Producir 100 cajas no dice si llegaron a tiempo; la meta se mide en órdenes.", reply: [{ who: "diego", text: "Tienes razón. Cambio la columna: órdenes a tiempo sobre órdenes totales." }], nota: "Distingue volumen producido de la tasa que mide la meta." },
            { id: "verde", tipo: "concepto_erroneo", score: 0, origen: "conversion", text: "Sí, verde: si no faltó ninguna caja, el cliente quedó bien atendido.", reply: [{ who: "irene", text: "Faltar no faltó, pero cuatro iban sin etiqueta correcta. Verde no significa seguro." }], nota: "Toma el volumen como si midiera el servicio." },
            { id: "amarillo", tipo: "riesgosa", score: 1, origen: "conversion", text: "Amarillo: vamos bien en cajas, pero todavía hay órdenes que llegan tarde.", reply: [{ who: "diego", text: "¿Y qué número pongo? ¿Cajas u órdenes?" }], nota: "Intuye el problema, pero mezcla dos unidades en un solo color." },
          ],
        },
        {
          id: "s07.lote", kind: "decision", skill: "ope.calidad", points: 3, from: "irene", origen: "fuente", salvaguarda: "inocuidad",
          text: { text: "En el lote de 100 hay 4 cajas sin etiqueta correcta de alérgenos y 3 con empaque dañado. El cliente espera hoy. ¿Qué hacemos?" },
          options: [
            { id: "retener", tipo: "defendible", score: 3, sets: { lote: "retenido" }, origen: "fuente", text: "Retener las 4, corregir y verificar su etiqueta, y ver por qué falló el paso.", reply: [{ who: "irene", text: "De acuerdo. Las corrijo, las verifico otra vez y anoto la causa para que no se repita." }], nota: "Identifica el defecto, retiene lo afectado y propone verificar, corregir y prevenir." },
            { id: "enviar", tipo: "riesgosa", score: 0, critica: true, sets: { lote: "enviado" }, origen: "fuente", text: "Enviarlas: 96 de 100 llevan su etiqueta y el cliente ya está esperando.", reply: [{ who: "irene", text: "No. Una etiqueta de alérgenos equivocada puede dañar a alguien. Las cuatro se quedan aquí." }], nota: "Cumplir la hora no compensa un riesgo de inocuidad." },
            { id: "todo", tipo: "riesgosa", score: 1, sets: { lote: "retenido" }, origen: "conversion", text: "Retener todo el pedido sin avisar al cliente hasta revisar una por una las 100 cajas.", reply: [{ who: "diego", text: "Retenerlo todo deja al cliente sin nada y sin saber por qué." }], nota: "Protege, pero no separa lo afectado ni comunica." },
            { id: "tirar", tipo: "concepto_erroneo", score: 1, sets: { lote: "retenido" }, origen: "conversion", text: "Tirar las 4 cajas, hacerlas de nuevo y no registrar nada del incidente.", reply: [{ who: "irene", text: "Si no lo registramos, mañana pasa igual." }], nota: "Corrige el lote, pero no previene ni deja registro." },
          ],
        },
        {
          id: "s07.lote2", kind: "decision", skill: null, points: 0, from: "irene", origen: "conversion", when: { flag: "lote", is: "enviado" }, rectifica: "s07.lote",
          text: { text: "Las cuatro siguen aquí, en inspección, y el cliente espera hoy. Con lo que te acabo de decir, ¿qué hacemos con ellas?" },
          options: [
            { id: "corrige", tipo: "defendible", score: 0, origen: "conversion", text: "Tienes razón: se quedan, se corrigen y se verifican antes de salir.", reply: [{ who: "irene", text: "Bien. Las corrijo, las verifico otra vez y anoto la causa para que no se repita." }], nota: "Rectifica al conocer el riesgo: retiene, corrige y verifica." },
            { id: "sostiene", tipo: "riesgosa", score: 0, origen: "conversion", text: "Que salgan hoy de todos modos: son cuatro cajas y el cliente ya espera.", reply: [{ who: "irene", text: "No las voy a liberar. Queda anotado que la decisión de retenerlas fue de calidad." }], nota: "Mantiene el envío después de conocer el riesgo de alérgenos." },
            { id: "aviso", tipo: "riesgosa", score: 0, origen: "conversion", text: "Que salgan hoy con un aviso a mano que pida revisar bien los ingredientes.", reply: [{ who: "irene", text: "Un aviso a mano no dice qué lleva cada caja. Se quedan aquí." }], nota: "Un aviso general no sustituye la etiqueta correcta de alérgenos." },
          ],
        },
        {
          id: "s07.sanas", kind: "cifras", skill: "ope.calidad", points: 1, from: "irene", origen: "fuente",
          text: { text: "Para el reporte: las cajas con etiqueta mal y las de empaque dañado son distintas. ¿Cuántas quedaron sin ninguno de los dos defectos?" },
          fields: [{ id: "sanas", label: "Cajas sin esos dos defectos", answer: 93, unit: "", calc: "100 − 4 − 3 = 93", points: 1 }],
        },
      ],
    },
    {
      id: "S08", act: 1, title: "Responder por el resultado sin hacer todo", skills: ["lid.fundamentos", "lid.delegacion"],
      people: ["diego", "alma"], docs: ["d05", "d07"], origen: "fuente",
      intro: { text: "Diego te busca en el pasillo: «Puedo auditar las 12 órdenes tardías. Pero ¿puedo prometerle al cliente una fecha nueva sin consultar?»" },
      steps: [
        {
          id: "s08.quien", kind: "decision", skill: "lid.fundamentos", points: 2, from: "alma", origen: "adaptado",
          text: { text: "Esto me preocupa. ¿Mejor reviso yo cada pedido hasta que se arregle?" },
          options: [
            { id: "encargo", tipo: "defendible", score: 2, sets: { encargo: "claro" }, origen: "fuente", text: "Tú respondes por el resultado; encárgaselo a Diego con límites y revísalo con él.", reply: [{ who: "alma", text: "Bien. Entonces armemos el encargo para que Diego sepa hasta dónde puede llegar." }], nota: "Mantiene la responsabilidad de quien dirige sin hacer personalmente cada tarea." },
            { id: "micro", tipo: "riesgosa", score: 0, sets: { encargo: "micro" }, origen: "fuente", text: "Sí, revisa tú cada pedido, que así no se escapa ninguno de los errores.", reply: [{ who: "diego", text: "Si Alma firma cada pedido, la fila ahora se forma en su escritorio." }], nota: "La revisión de cada pedido crea un nuevo cuello de botella." },
            { id: "suelto", tipo: "riesgosa", score: 0, sets: { encargo: "suelto" }, origen: "fuente", text: "No hace falta: dile a Diego que lo resuelva como él quiera y ya.", reply: [{ who: "diego", text: "¿Como yo quiera? ¿Puedo cambiar contratos? ¿Hasta cuándo tengo?" }], nota: "Delegar sin límites deja dudas y riesgos." },
            { id: "ajeno", tipo: "concepto_erroneo", score: 0, sets: { encargo: "suelto" }, origen: "conversion", text: "No es tu tema: las entregas son de Diego y la dirección no responde por eso.", reply: [{ who: "alma", text: "Pero si el cliente se va, me lo reclaman a mí." }], nota: "Quien dirige responde por el resultado aunque delegue." },
          ],
        },
        {
          id: "s08.encargo", kind: "armar", skill: "lid.delegacion", points: 4, from: "diego", origen: "fuente",
          text: {
            text: "Ármame el encargo. Necesito saber qué entrego, para cuándo, qué puedo decidir y cuándo lo vemos.",
            alt: [
              { when: { flag: "encargo", is: "micro" }, text: "Alma ya empezó a revisar pedidos y se atrasó con todo. Me pidió que me lo encargues bien: qué entrego, para cuándo, qué puedo decidir y cuándo lo vemos." },
              { when: { flag: "encargo", is: "suelto" }, text: "«Como yo quiera» no me sirve. Necesito saber qué entrego, para cuándo, qué puedo decidir y cuándo lo vemos." },
            ],
          },
          slots: [
            { id: "resultado", label: "Qué entrega", answer: "registro", why: "Un resultado concreto, sin dar por hecha la causa.", choices: [{ id: "registro", text: "Registro de las 12 órdenes tardías y sus causas posibles" }, { id: "culpable", text: "El nombre de quién tuvo la culpa" }, { id: "mejorar", text: "Que las entregas mejoren" }] },
            { id: "plazo", label: "Para cuándo", answer: "viernes", why: "Una fecha y hora cierta.", choices: [{ id: "pronto", text: "Lo antes posible" }, { id: "viernes", text: "Viernes a las 12:00" }, { id: "mes", text: "Fin de mes" }] },
            { id: "margen", label: "Qué puede decidir", answer: "datos", why: "Pedir datos y proponer, sí; cambiar contratos o prometer fechas, con autorización.", choices: [{ id: "todo", text: "Cambiar contratos y prometer fechas" }, { id: "nada", text: "Nada sin preguntar antes" }, { id: "datos", text: "Pedir datos y proponer; fechas o contratos, con autorización" }] },
            { id: "revision", label: "Cuándo se revisa", answer: "jueves", why: "Un punto de revisión antes de la entrega permite corregir a tiempo.", choices: [{ id: "jueves", text: "Jueves, a medio camino" }, { id: "cada", text: "Cada hora, por mensaje" }, { id: "final", text: "Solo al final" }] },
          ],
          result: "Diego entrega el registro de las 12 órdenes tardías el viernes a las 12:00; puede pedir datos y proponer, y las fechas o contratos requieren autorización; se revisa el jueves.",
        },
        {
          id: "s08.jueves", kind: "decision", skill: "lid.fundamentos", points: 2, from: "diego", origen: "conversion",
          text: { text: "Es jueves. Llevo 7 de las 12 órdenes revisadas; reparto no me ha dado sus horarios. ¿Qué hacemos?" },
          options: [
            { id: "obstaculo", tipo: "defendible", score: 2, origen: "conversion", text: "Pido a reparto sus horarios hoy mismo y mantenemos el viernes a las 12:00.", reply: [{ who: "diego", text: "Con eso termino. Gracias por destrabarlo sin quitármelo." }], nota: "Quien dirige quita el obstáculo y sostiene el encargo." },
            { id: "quitar", tipo: "riesgosa", score: 0, origen: "conversion", text: "Dame las cinco que faltan, yo las termino hoy en la tarde y tú vuelves a lo tuyo.", reply: [{ who: "diego", text: "Está bien... aunque no voy a saber qué pasó con esas cinco." }], nota: "Retoma la tarea y quita aprendizaje y responsabilidad." },
            { id: "nada", tipo: "concepto_erroneo", score: 0, origen: "conversion", text: "Ya es tu encargo; resuélvelo como puedas, yo no me meto en eso.", reply: [{ who: "diego", text: "Sin los horarios de reparto, el viernes entrego a medias." }], nota: "Delegar no es desentenderse." },
            { id: "alargar", tipo: "riesgosa", score: 1, origen: "conversion", text: "Movemos la entrega a dos semanas para que lo hagas con más calma.", reply: [{ who: "alma", text: "¿Dos semanas más con órdenes tarde?" }], nota: "Da apoyo, pero mueve el plazo sin atacar la causa." },
          ],
        },
      ],
    },
    {
      id: "S09", act: 1, title: "Hecho no es acusación", skills: ["lid.comunicacion", "lid.feedback"],
      people: ["dana", "oscar", "alma"], docs: ["d07", "d10"], origen: "fuente",
      intro: { text: "Dana te escribe por chat: «Óscar siempre es negligente, por eso tardamos». Alma espera un correo tuyo antes del viernes." },
      steps: [
        {
          id: "s09.hechos", kind: "clasificar", skill: "lid.feedback", points: 2, from: "dana", origen: "adaptado",
          text: { text: "Antes de responderle a Dana, separa lo que es un hecho de lo que es una opinión sobre una persona." },
          groups: [{ id: "hecho", label: "Hecho comprobable" }, { id: "juicio", label: "Opinión o etiqueta" }],
          items: [
            { id: "doce", text: "12 de 40 órdenes llegaron tarde", group: "hecho", why: "Está en el reporte." },
            { id: "negligente", text: "Óscar siempre es negligente", group: "juicio", why: "Es una etiqueta sobre la persona, sin registro." },
            { id: "porEso", text: "Por eso tardamos", group: "juicio", why: "Atribuye una causa que nadie ha comprobado." },
            { id: "registro", text: "El registro no dice quién causó cada retraso", group: "hecho", why: "Se puede ver en el documento." },
          ],
        },
        {
          id: "s09.dana", kind: "decision", skill: "lid.feedback", points: 2, from: "dana", origen: "fuente",
          text: { text: "¿Entonces? ¿Le vas a decir algo a Óscar o no?" },
          options: [
            { id: "escuchar", tipo: "defendible", score: 2, sets: { oscar: "escuchado" }, origen: "fuente", text: "Cuéntame qué viste; luego revisamos el registro con Óscar antes de concluir.", reply: [{ who: "dana", text: "Vi cajas esperando en etiquetado. Lo de «negligente» lo dije enojada." }], nota: "Separa conducta observable de etiqueta y propone escuchar y revisar." },
            { id: "acusar", tipo: "riesgosa", score: 0, sets: { oscar: "acusado" }, origen: "fuente", text: "Tienes razón; ahora mismo le llamo la atención a Óscar por los retrasos.", reply: [{ who: "oscar", text: "¿Me acusan sin ver mis registros? Aquí están, y no dicen eso." }], nota: "Trata una etiqueta como si fuera un hecho." },
            { id: "ignorar", tipo: "riesgosa", score: 0, sets: { oscar: "escuchado" }, origen: "conversion", text: "No le hagas caso a eso; mejor sigue con tu trabajo y ya se verá después.", reply: [{ who: "dana", text: "Pues alguien tiene que hacer algo con los retrasos." }], nota: "Ignora la queja sin revisar lo que pasó." },
            { id: "reganar", tipo: "concepto_erroneo", score: 0, sets: { oscar: "acusado" }, origen: "conversion", text: "Lo negligente es acusar sin pruebas; deberías disculparte con Óscar.", reply: [{ who: "dana", text: "Ahora la negligente soy yo. Ya no te cuento nada." }], nota: "Responde a una etiqueta con otra etiqueta." },
          ],
        },
        {
          id: "s09.registros", kind: "dato", skill: null, points: 0, from: "oscar", origen: "fuente",
          text: {
            text: "Óscar trae sus registros de las órdenes tardías.",
            alt: [{ when: { flag: "oscar", is: "acusado" }, text: "Óscar llega molesto con sus registros: «Antes de acusarme, mira esto»." }],
          },
          items: ["Algunas cajas salieron tarde de etiquetado.", "Otras salieron a tiempo y llegaron tarde por reparto.", "Con estos registros no se puede saber la causa de las 12."],
        },
        {
          id: "s09.asunto", kind: "decision", skill: "lid.comunicacion", points: 2, from: "alma", origen: "adaptado",
          text: { text: "Mándame el correo. ¿Con qué frase empiezas?" },
          options: [
            { id: "dato", tipo: "defendible", score: 2, origen: "fuente", text: "12 de 40 órdenes llegaron tarde; propongo revisar causas antes del viernes.", reply: [{ who: "alma", text: "Claro: el dato, por qué importa y qué pides. Así lo leo en un minuto." }], nota: "Dato, importancia y petición, sin culpar a nadie." },
            { id: "oscar", tipo: "riesgosa", score: 0, origen: "conversion", text: "Tenemos un problema grave en cocina con Óscar y hay que actuar ya.", reply: [{ who: "oscar", text: "Ese correo me culpa antes de revisar nada." }], nota: "Atribuye una causa no verificada." },
            { id: "suave", tipo: "concepto_erroneo", score: 0, origen: "conversion", text: "Todo va bastante bien en general, solo hay algunos detalles pequeños por ajustar.", reply: [{ who: "alma", text: "¿Detalles? Tres de cada diez órdenes llegan tarde." }], nota: "Esconde el dato y su importancia." },
            { id: "largo", tipo: "riesgosa", score: 1, origen: "conversion", text: "Te cuento todo lo que vi esta semana, desde el lunes, en orden.", reply: [{ who: "alma", text: "¿Y qué necesitas de mí? Llego al final y no lo sé." }], nota: "Puede traer datos, pero no pone primero lo importante ni la petición." },
          ],
        },
        {
          id: "s09.correo", kind: "escribir", skill: "lid.comunicacion", points: 2, from: "alma", origen: "fuente",
          text: { text: "Escribe el correo completo, breve: el dato, por qué importa y qué me pides." },
          fields: [{ id: "correo", label: "Correo para Alma" }],
          reference: "Alma: 12 de 40 órdenes del mes llegaron tarde (70 % a tiempo, meta 90 %). Importa porque los eventos grandes nos eligen por puntualidad. Los registros muestran retrasos en etiquetado y en reparto, sin causa clara para todas. Te pido autorizar que Diego termine la revisión el viernes a las 12:00 antes de decidir cambios.",
          ideas: ["Da el dato con su unidad", "Dice por qué importa", "Hace una petición concreta con fecha", "No atribuye la causa a una persona"],
        },
      ],
    },
    // ─────────────────────────────────────────────── Acto III
    {
      id: "S10", act: 2, title: "¿Quién compra y quién usa?", skills: ["cre.cliente", "cre.segmentacion"],
      people: ["javier"], docs: ["d06"], origen: "fuente",
      intro: { text: "Jueves. Javier quiere preparar la próxima campaña y te muestra la ficha de clientes." },
      steps: [
        {
          id: "s10.roles", kind: "clasificar", skill: "cre.cliente", points: 3, from: "javier", origen: "adaptado",
          text: { text: "Pon a cada quien y su necesidad con su papel en la compra." },
          groups: [{ id: "compra", label: "Compra" }, { id: "usa", label: "Usa" }, { id: "recomienda", label: "Recomienda" }],
          items: [
            { id: "admin", text: "Administración de oficinas", group: "compra", why: "Firma y paga." },
            { id: "empleados", text: "Empleados", group: "usa", why: "Comen el desayuno." },
            { id: "rh", text: "Recursos Humanos", group: "recomienda", why: "Sugiere al proveedor y gestiona." },
            { id: "factura", text: "Necesita precio claro y factura a tiempo", group: "compra", why: "Es lo que pide quien paga." },
            { id: "alergenos", text: "Necesita saber qué alérgenos lleva su caja", group: "usa", why: "Es lo que necesita quien come." },
            { id: "sinproblemas", text: "Necesita que el pedido no le dé problemas", group: "recomienda", why: "Su nombre queda ligado al proveedor que sugirió." },
          ],
        },
        {
          id: "s10.firma", kind: "decision", skill: "cre.cliente", points: 1, from: "javier", origen: "fuente",
          text: { text: "A los empleados les encantan las cajas. Entonces ellos deciden la compra, ¿no?" },
          options: [
            { id: "roles", tipo: "defendible", score: 1, origen: "fuente", text: "No necesariamente: comen ellos, pero firma administración y sugiere RR. HH.", reply: [{ who: "javier", text: "Entonces la campaña tiene que hablarle a tres personas distintas." }], nota: "Distingue usuario, comprador y quien recomienda." },
            { id: "si", tipo: "concepto_erroneo", score: 0, origen: "conversion", text: "Sí: si a quien come le gusta, la oficina sigue comprando siempre.", reply: [{ who: "javier", text: "Pero el mes pasado perdimos una oficina feliz porque la factura llegó tarde." }], nota: "Confunde a quien usa con quien decide la compra." },
            { id: "rh", tipo: "riesgosa", score: 0, origen: "conversion", text: "No: decide siempre Recursos Humanos, así que solo hay que hablarle a ellos.", reply: [{ who: "javier", text: "Ellos sugieren, pero no firman. ¿Y quién paga?" }], nota: "Toma un solo papel como si fuera todo el proceso." },
          ],
        },
        {
          id: "s10.criterio", kind: "decision", skill: "cre.segmentacion", points: 2, from: "javier", origen: "fuente",
          text: { text: "¿Cómo separamos a los clientes para no ofrecerles a todos lo mismo?" },
          options: [
            { id: "necesidad", tipo: "defendible", score: 2, origen: "fuente", text: "Por tamaño y necesidad: oficinas pequeñas piden flexibilidad; eventos, puntualidad.", reply: [{ who: "javier", text: "Así cada grupo oye lo que le importa." }], nota: "Separa por necesidades útiles para la compra." },
            { id: "todos", tipo: "concepto_erroneo", score: 0, origen: "conversion", text: "No hace falta separar: todos los clientes quieren lo mismo, buen precio.", reply: [{ who: "dana", text: "Los de eventos nunca preguntan el precio; preguntan a qué hora llegamos." }], nota: "Supone que todos compran por el mismo motivo." },
            { id: "colonia", tipo: "riesgosa", score: 1, origen: "conversion", text: "Por la colonia donde está cada oficina, para organizar mejor las rutas del reparto diario.", reply: [{ who: "javier", text: "Sirve para las rutas, pero no me dice qué ofrecerle a cada uno." }], nota: "Es útil para operar, no para entender qué valora cada grupo." },
          ],
        },
        {
          id: "s10.grupos", kind: "clasificar", skill: "cre.segmentacion", points: 2, from: "javier", origen: "adaptado",
          text: { text: "Pon cada pedido típico con el grupo que lo hace." },
          groups: [{ id: "pequenas", label: "Oficinas pequeñas" }, { id: "eventos", label: "Eventos grandes" }],
          items: [
            { id: "cambio", text: "Cambiar el pedido un día antes", group: "pequenas", why: "Valoran flexibilidad." },
            { id: "precio", text: "Preguntar el precio por caja", group: "pequenas", why: "Valoran claridad de precio." },
            { id: "hora", text: "200 cajas a las 8:00 en punto", group: "eventos", why: "Valoran puntualidad en volumen." },
            { id: "iguales", text: "Que todas las cajas sean iguales", group: "eventos", why: "Valoran consistencia." },
          ],
        },
      ],
    },
    {
      id: "S11", act: 2, title: "Más contactos no siempre significan mejor conversión", skills: ["cre.precios", "cre.canales"],
      people: ["javier", "alma"], docs: ["d06c", "d06b"], origen: "fuente",
      intro: { text: "Un cliente pide 10 % de descuento en 100 cajas estándar. Javier llega además con el embudo de las últimas dos semanas." },
      steps: [
        {
          id: "s11.descuento", kind: "cifras", skill: "cre.precios", points: 3, from: "alma", origen: "fuente",
          text: { text: "Antes de contestar al cliente: ¿cómo queda el precio, qué queda por caja después del costo directo y cuánto dejamos de ganar en las 100 cajas?" },
          fields: [
            { id: "precio", label: "Precio con 10 % de descuento", answer: 270, unit: "$", calc: "300 − 30 = 270", points: 1 },
            { id: "margen", label: "Precio menos costo directo, con descuento", answer: 90, unit: "$", calc: "270 − 180 = 90", points: 1 },
            { id: "pierde", label: "Lo que se deja de ganar en 100 cajas", answer: 3000, unit: "$", calc: "(120 − 90) × 100 = 3,000", points: 1 },
          ],
        },
        {
          id: "s11.respuesta", kind: "decision", skill: "cre.precios", points: 1, from: "alma", origen: "conversion",
          text: { text: "¿Qué le contesto al cliente?" },
          options: [
            { id: "condicion", tipo: "defendible", score: 1, origen: "conversion", text: "Descuento solo a cambio de algo: pedido fijo cada mes o entrega más flexible.", reply: [{ who: "alma", text: "Si pide menos margen, que nos dé algo que valga." }], nota: "Ve el costo del descuento y busca un intercambio de valor." },
            { id: "aceptar", tipo: "riesgosa", score: 0, origen: "conversion", text: "Aceptar el 10 %: con 100 cajas igual ganamos más que con ninguna.", reply: [{ who: "elisa", text: "Son 3,000 menos y el gasto de operación no baja." }], nota: "Acepta sin mirar lo que se pierde frente a los gastos." },
            { id: "veinte", tipo: "concepto_erroneo", score: 0, origen: "conversion", text: "Ofrecerle 20 % para que firme ya y luego subirle el precio poco a poco.", reply: [{ who: "elisa", text: "Con 20 % quedan 60 por caja. Y subir después no está en el contrato." }], nota: "Agranda la pérdida y apuesta a una subida sin base." },
          ],
        },
        {
          id: "s11.conversion", kind: "cifras", skill: "cre.canales", points: 2, from: "javier", origen: "fuente",
          text: { text: "¿Qué porcentaje de contactos terminó en contrato en cada canal?" },
          fields: [
            { id: "web", label: "Formulario web", answer: 25, unit: "%", calc: "6 / 24 = 25 %", points: 1 },
            { id: "ref", label: "Referencias", answer: 50, unit: "%", calc: "5 / 10 = 50 %", points: 1 },
          ],
        },
        {
          id: "s11.cerrar", kind: "decision", skill: "cre.canales", points: 2, from: "javier", origen: "fuente",
          text: { text: "Si las referencias convierten el doble, cerremos la web y ahorramos tiempo." },
          options: [
            { id: "mantener", tipo: "defendible", score: 2, sets: { web: "mantener" }, origen: "fuente", text: "Aún no: la web trajo 6 contratos, y falta saber costo y valor de cada uno.", reply: [{ who: "javier", text: "Va. Mido cuánto nos cuesta cada contrato por canal antes de decidir." }], nota: "Lee las dos tasas y reconoce lo que falta para hablar de rentabilidad." },
            { id: "cerrar", tipo: "riesgosa", score: 0, sets: { web: "cerrar" }, origen: "fuente", text: "Sí: el doble de conversión prueba que referencias es el canal rentable.", reply: [{ who: "alma", text: "¿Y los seis contratos que vinieron por la web?" }], nota: "Infiere rentabilidad sin costos ni valor por contrato." },
            { id: "referencias", tipo: "concepto_erroneo", score: 0, sets: { web: "mantener" }, origen: "conversion", text: "Al revés: cerrar referencias, porque la web trae más del doble de contactos.", reply: [{ who: "javier", text: "Más contactos no son más contratos: la web convierte la mitad." }], nota: "Mira el volumen de contactos e ignora la conversión." },
            { id: "duplicar", tipo: "riesgosa", score: 1, sets: { web: "mantener" }, origen: "conversion", text: "Mantener las dos y duplicar ya el gasto en la web para traer más.", reply: [{ who: "elisa", text: "No sabemos cuánto cuesta un contrato por la web. ¿Duplicar qué?" }], nota: "Conserva los canales, pero gasta sin datos." },
          ],
        },
      ],
    },
    {
      id: "S12", act: 2, title: "Lo pequeño que puede hacer daño grande", skills: ["rie.fundamentos", "rie.etica"],
      people: ["irene", "javier"], docs: ["d07", "d05"], origen: "fuente",
      intro: {
        text: "Viernes, 7:30. El evento grande es a las 9:00. Irene tiene las cuatro cajas retenidas en inspección.",
        alt: [{ when: { flag: "lote", is: "enviado" }, text: "Viernes, 7:30. El evento grande es a las 9:00. Irene mantuvo retenidas las cuatro cajas que propusiste enviar." }],
      },
      steps: [
        {
          id: "s12.mapa", kind: "clasificar", skill: "rie.fundamentos", points: 2, from: "irene", origen: "adaptado",
          text: { text: "Antes de decidir, separa lo que ya pasó, lo que es sospecha y lo que no tiene ningún dato." },
          groups: [{ id: "ocurrio", label: "Ya ocurrió" }, { id: "sospecha", label: "Sospecha por confirmar" }, { id: "sindato", label: "Sin dato que lo indique" }],
          items: [
            { id: "tarde", text: "Órdenes entregadas tarde", group: "ocurrio", why: "Está en el reporte: 12 de 40." },
            { id: "etiquetas", text: "Cajas con etiqueta de alérgenos incorrecta", group: "ocurrio", why: "Se encontraron 4 en inspección." },
            { id: "banco", text: "Fraude con la cuenta del proveedor", group: "sospecha", why: "Hay un correo extraño, pero no está probado." },
            { id: "intox", text: "Un cliente intoxicado por alérgenos", group: "sindato", why: "No se sabe de daño a ninguna persona." },
          ],
        },
        {
          id: "s12.peso", kind: "decision", skill: "rie.fundamentos", points: 2, from: "irene", origen: "fuente",
          text: { text: "¿Cómo describirías el riesgo de las etiquetas de alérgenos?" },
          options: [
            { id: "impacto", tipo: "defendible", score: 2, origen: "fuente", text: "Impacto alto si llega a alguien alérgico; no sabemos qué tan probable es.", reply: [{ who: "irene", text: "Así lo pongo en la matriz: impacto alto, posibilidad por confirmar." }], nota: "Separa impacto, posibilidad e incertidumbre sin inventar cifras." },
            { id: "bajo", tipo: "concepto_erroneo", score: 0, origen: "conversion", text: "Bajo: son solo 4 de 100 cajas, apenas un 4 % del lote revisado.", reply: [{ who: "irene", text: "Pocas cajas no quiere decir poco daño. Una basta." }], nota: "Confunde frecuencia con impacto." },
            { id: "inventa", tipo: "riesgosa", score: 0, origen: "conversion", text: "Probabilidad de 50 % e impacto medio, como en otros negocios de comida.", reply: [{ who: "irene", text: "¿De dónde sale ese 50 %? No tenemos ese dato." }], nota: "Inventa una probabilidad sin base." },
            { id: "danio", tipo: "riesgosa", score: 0, origen: "conversion", text: "Muy alto, porque ya hubo clientes que se enfermaron por culpa de esas cajas.", reply: [{ who: "irene", text: "No sabemos de nadie enfermo. No inventemos lo que no pasó." }], nota: "Atribuye un daño que no está en los datos." },
          ],
        },
        {
          id: "s12.etica", kind: "decision", skill: "rie.etica", points: 4, from: "javier", origen: "fuente", salvaguarda: "etica",
          text: { text: "Si entregamos sin verificar esas etiquetas, a lo mejor el cliente nunca se da cuenta. Y llegamos a tiempo." },
          options: [
            { id: "verdad", tipo: "defendible", score: 4, sets: { etica: "transparente" }, origen: "fuente", text: "No. Corregimos las cuatro y le avisamos al cliente la verdad sobre el retraso.", reply: [{ who: "irene", text: "Las tengo listas en 40 minutos. Prefiero llegar tarde que poner a alguien en riesgo." }, { who: "javier", text: "Llamo al cliente y le explico. Mejor que lo sepa por nosotros." }], nota: "Rechaza ocultar la falla y comunica con transparencia." },
            { id: "entregar", tipo: "riesgosa", score: 0, critica: true, sets: { etica: "oculta" }, origen: "fuente", text: "Entregamos así a tiempo y en el próximo pedido corregimos el proceso de etiquetas.", reply: [{ who: "irene", text: "Esas cuatro no salen. Alguien alérgico no va a esperar al próximo pedido." }], nota: "Pone el plazo por encima de la seguridad de las personas." },
            { id: "quitar", tipo: "riesgosa", score: 0, critica: true, sets: { etica: "oculta" }, origen: "conversion", text: "Entregamos quitando las etiquetas dudosas para no dar información falsa.", reply: [{ who: "irene", text: "Sin etiqueta, quien es alérgico tampoco sabe qué come." }], nota: "Quitar la información también oculta el riesgo." },
            { id: "excusa", tipo: "riesgosa", score: 1, critica: true, sets: { etica: "oculta" }, origen: "conversion", text: "Las corregimos, pero al cliente le decimos que el retraso fue por tráfico.", reply: [{ who: "javier", text: "Si un día se entera, ya no nos cree nada." }], nota: "Protege a las personas, pero engaña al cliente." },
          ],
        },
        {
          id: "s12.etica2", kind: "decision", skill: null, points: 0, from: "irene", origen: "adaptado", when: { flag: "etica", is: "oculta" }, rectifica: "s12.etica",
          text: { text: "Puedo tener las cuatro corregidas y verificadas en 40 minutos. Llegaríamos tarde y habría que decirle al cliente por qué. ¿Qué hacemos?" },
          options: [
            { id: "corrige", tipo: "defendible", score: 0, origen: "adaptado", text: "Corregirlas, llegar tarde y decirle al cliente el motivo real.", reply: [{ who: "irene", text: "Empiezo ahora. Prefiero llegar tarde que poner a alguien en riesgo." }, { who: "javier", text: "Llamo al cliente y le explico. Mejor que lo sepa por nosotros." }], nota: "Rectifica: corrige las cajas y comunica la verdad sobre el retraso." },
            { id: "calla", tipo: "riesgosa", score: 0, origen: "conversion", text: "Corregirlas, llegar tarde y no explicar nada si el cliente no pregunta.", reply: [{ who: "javier", text: "Va a preguntar. Y si se entera por otro lado, ya no nos cree." }], nota: "Corrige las cajas, pero mantiene oculta la falla." },
            { id: "sostiene", tipo: "riesgosa", score: 0, origen: "conversion", text: "Entregar a tiempo como están y avisar solo si alguien llega a reclamar.", reply: [{ who: "irene", text: "Así no las libero. Queda anotado que calidad las retuvo." }], nota: "Mantiene el ocultamiento después de tener una salida segura." },
          ],
        },
      ],
    },
    {
      id: "S13", act: 2, title: "La cuenta bancaria que cambió", skills: ["rie.cumplimiento"],
      people: ["elisa"], docs: ["d11", "d07"], origen: "fuente",
      intro: { text: "Viernes, 11:00. Elisa tiene abierta la transferencia al proveedor de materiales. El correo pide pagar hoy a una cuenta nueva." },
      steps: [
        {
          id: "s13.control", kind: "decision", skill: "rie.cumplimiento", points: 2, from: "elisa", origen: "fuente", salvaguarda: "control_bancario",
          text: {
            text: "El proveedor dice que es urgente. ¿Pago a la cuenta nueva?",
            alt: [{ when: { flag: "anuncios", is: "paga" }, text: "Con lo que salió para los anuncios, la caja está justa y el proveedor dice que es urgente. ¿Pago a la cuenta nueva?" }],
          },
          options: [
            { id: "verificar", tipo: "defendible", score: 2, sets: { banco: "verifica" }, origen: "fuente", text: "No todavía: llamar al teléfono del directorio y pedir una segunda firma.", reply: [{ who: "elisa", text: "Queda pendiente de confirmación. Llamo al número que tenemos registrado." }], nota: "Verifica por canal independiente y respeta la doble autorización." },
            { id: "pagar", tipo: "riesgosa", score: 0, critica: true, sets: { banco: "paga" }, origen: "fuente", text: "Sí, es un proveedor de años, confiamos en él y no queremos retrasos.", reply: [{ who: "elisa", text: "El sistema pide la segunda firma para cambiar datos bancarios. No puedo pagar así." }], nota: "La confianza no reemplaza el control." },
            { id: "correo", tipo: "riesgosa", score: 1, sets: { banco: "correo" }, origen: "conversion", text: "Contestar al mismo correo y pedir que confirmen bien los datos nuevos.", reply: [{ who: "elisa", text: "Si el correo no es suyo, quien conteste nos dirá que sí." }], nota: "Busca confirmar, pero por el mismo canal sospechoso." },
            { id: "denunciar", tipo: "concepto_erroneo", score: 1, sets: { banco: "verifica" }, origen: "conversion", text: "Bloquear al proveedor y denunciar el fraude hoy mismo ante la autoridad bancaria.", reply: [{ who: "elisa", text: "Aún no sabemos si es fraude. Primero confirmemos con él." }], nota: "Detiene el pago, pero da por probado algo que no se sabe." },
          ],
        },
        {
          id: "s13.alerta", kind: "dato", skill: null, points: 0, from: "elisa", origen: "fuente", when: { flag: "banco", is: "paga" },
          text: { text: "Alerta de control antes de ejecutar el pago." },
          items: ["El sistema detiene el cambio de cuenta: falta la segunda firma.", "No hay fraude confirmado; el pago queda en espera."],
        },
        {
          id: "s13.control2", kind: "decision", skill: null, points: 0, from: "elisa", origen: "conversion", when: { flag: "banco", is: "paga" }, rectifica: "s13.control",
          text: { text: "El pago quedó detenido y el proveedor insiste en que es urgente. ¿Qué hago ahora?" },
          options: [
            { id: "corrige", tipo: "defendible", score: 0, origen: "conversion", text: "Dejarlo detenido y confirmar la cuenta por el teléfono del directorio.", reply: [{ who: "elisa", text: "Queda pendiente de confirmación. Llamo al número que tenemos registrado." }], nota: "Rectifica: respeta el control y verifica por un canal independiente." },
            { id: "firma", tipo: "riesgosa", score: 0, origen: "conversion", text: "Pedirle a Alma la segunda firma ahora mismo para que el pago salga hoy.", reply: [{ who: "elisa", text: "Alma firmaría sin saber de quién es la cuenta. Firmar no es verificar." }], nota: "Usa la segunda firma como trámite: nadie verifica la cuenta nueva." },
            { id: "sostiene", tipo: "riesgosa", score: 0, origen: "conversion", text: "Pagar desde la otra cuenta de la empresa, que no pide esa segunda firma.", reply: [{ who: "elisa", text: "Eso es saltarse el control. No lo voy a hacer; queda anotado." }], nota: "Busca evitar el control después de la alerta." },
          ],
        },
        {
          id: "s13.pasos", kind: "ordenar", skill: "rie.cumplimiento", points: 2, from: "elisa", origen: "fuente",
          text: { text: "Deja el procedimiento por escrito para la próxima vez. Ordena los pasos." },
          cards: [
            { id: "registrar", text: "Registrar lo ocurrido y la respuesta" },
            { id: "detener", text: "Detener el cambio de cuenta" },
            { id: "autorizar", text: "Pedir la autorización de una segunda persona" },
            { id: "llamar", text: "Llamar al teléfono del directorio verificado" },
          ],
          order: ["detener", "llamar", "autorizar", "registrar"],
          why: "Primero no pagar, luego confirmar por un canal confiable, después autorizar entre dos y dejar registro.",
        },
      ],
    },
    {
      id: "S14", act: 2, title: "La reunión final", skills: [],
      people: ["alma", "elisa", "irene", "diego", "javier"], docs: ["d02", "d04", "d05", "d07"], origen: "fuente",
      intro: { text: "Viernes, 13:00. Alma reúne a todos. En el pizarrón: hechos confirmados, acciones propuestas y decisiones pendientes." },
      steps: [
        {
          id: "s14.plan", kind: "decision", skill: null, points: 0, from: "alma", origen: "adaptado", sintesis: "secuencia",
          text: { text: "Necesito tres prioridades para el próximo mes. ¿En qué orden?" },
          options: [
            { id: "seguridad", tipo: "defendible", score: 0, sets: { plan: "seguridad" }, origen: "fuente", text: "Etiquetas y pagos seguros; luego entregas y capacidad; luego cuidar la caja.", reply: [{ who: "alma", text: "Primero lo que puede hacer daño, después lo que nos hace perder clientes." }], nota: "Atiende primero los riesgos inmediatos y justifica el orden." },
            { id: "entregas", tipo: "defendible", score: 0, sets: { plan: "entregas" }, origen: "conversion", text: "Etiquetado primero, que es seguridad y capacidad; luego pagos y la caja.", reply: [{ who: "irene", text: "Si el etiquetado sube de 70, ganamos en seguridad y en entregas." }], nota: "Otra secuencia defendible: une riesgo y cuello de botella." },
            { id: "ventas", tipo: "riesgosa", score: 0, sets: { plan: "ventas" }, origen: "conversion", text: "Primero vender más con anuncios; con más ingresos se arregla lo demás.", reply: [{ who: "elisa", text: "Con 6,000 en caja y 70 cajas al día, ¿a quién le vendemos y con qué?" }], nota: "Deja para después riesgos que ya ocurrieron." },
          ],
        },
        {
          id: "s14.razon.seguridad", kind: "decision", skill: null, points: 0, from: "alma", origen: "conversion", when: { flag: "plan", is: "seguridad" }, sintesis: "fundamento",
          text: { text: "¿Por qué en ese orden? Dímelo con lo que vimos esta semana." },
          options: [
            { id: "hechos", tipo: "defendible", score: 0, origen: "conversion", text: "Etiquetas y pagos pueden hacer daño hoy; con 6,000 en caja no da para más.", reply: [{ who: "alma", text: "Eso se sostiene con lo que vimos. Lo que no sabemos queda como pendiente." }], nota: "Se apoya en los riesgos inmediatos y en el límite de la caja." },
            { id: "certeza", tipo: "riesgosa", score: 0, origen: "conversion", text: "Porque con ese orden es seguro que en un mes llegamos al 90 % de puntualidad.", reply: [{ who: "diego", text: "Seguro no es. La meta es a dos meses y aún no sabemos la causa de las tardías." }], nota: "Promete un resultado que los datos no garantizan." },
            { id: "aparicion", tipo: "concepto_erroneo", score: 0, origen: "conversion", text: "Porque ese es el orden en que fueron apareciendo los problemas en la semana.", reply: [{ who: "alma", text: "El orden en que aparecieron no dice cuál pesa más." }], nota: "Ordena por aparición, no por riesgo ni por restricción." },
          ],
        },
        {
          id: "s14.razon.entregas", kind: "decision", skill: null, points: 0, from: "alma", origen: "conversion", when: { flag: "plan", is: "entregas" }, sintesis: "fundamento",
          text: { text: "¿Por qué en ese orden? Dímelo con lo que vimos esta semana." },
          options: [
            { id: "hechos", tipo: "defendible", score: 0, origen: "conversion", text: "El etiquetado es el riesgo de alérgenos y también el paso que limita a 70.", reply: [{ who: "alma", text: "Eso se sostiene con lo que vimos. Lo que no sabemos queda como pendiente." }], nota: "Une el riesgo inmediato con la restricción del proceso." },
            { id: "basta", tipo: "riesgosa", score: 0, origen: "conversion", text: "Porque arreglando el etiquetado ya no hará falta revisar los pagos ni la caja.", reply: [{ who: "elisa", text: "El correo de la cuenta nueva no tiene nada que ver con las etiquetas." }], nota: "Da por resueltos riesgos que son independientes." },
            { id: "barato", tipo: "concepto_erroneo", score: 0, origen: "conversion", text: "Porque el etiquetado es lo más barato y lo más rápido de todo lo pendiente.", reply: [{ who: "elisa", text: "Todavía no tiene inversión definida. No sabemos cuánto cuesta." }], nota: "Afirma un costo que los documentos no dan." },
          ],
        },
        {
          id: "s14.cierre", kind: "dato", skill: null, points: 0, from: "alma", origen: "conversion",
          text: {
            text: "Alma cierra la reunión.",
            alt: [{ when: { flag: "plan", is: "ventas" }, text: "Alma cierra la reunión, pensativa: «Lo voy a consultar con Elisa e Irene antes de decidir»." }],
          },
          items: ["Gracias por estos tres días. Lo que propusiste queda por escrito para el equipo.", "Al terminar verás tus observaciones por habilidad y por academia."],
        },
      ],
    },
  ],
  scale: { max: 4, levels: ["Sin demostración", "Reconocimiento fragmentario", "Comprensión parcial", "Fundamento adecuado", "Fundamento sólido"] },
  thresholds: { candidates: [], enabled: false },
  criteria: {
    "est.fundamentos": "Distingue resultado y actividad, y explica la propuesta de valor sin confundirla con un eslogan.",
    "est.ventaja": "Propone una diferencia plausible y reconoce que falta prueba para «somos los mejores».",
    "est.priorizacion": "Prioriza y dice qué se pospone por una restricción explícita.",
    "est.alineacion": "Define 90 % de puntualidad, responsable, periodo y unidad correcta.",
    "fin.lenguaje": "Separa ventas, costos, gastos, cobros, utilidad y efectivo.",
    "fin.resultados": "Calcula la utilidad operativa de 18,000 a partir de las partidas correctas.",
    "fin.balance": "Clasifica activo, pasivo y patrimonio y concilia 144 = 84 + 60.",
    "fin.flujo": "Calcula la caja y no la confunde con los 18,000 de utilidad.",
    "fin.presupuesto": "Reconcilia la utilidad real de 18,000 con el plan de 25,000 y sus tres efectos.",
    "lid.fundamentos": "Mantiene la responsabilidad de quien dirige sin hacer personalmente cada tarea.",
    "lid.comunicacion": "Comunica dato, importancia y petición concreta sin atribuir una causa no verificada.",
    "lid.feedback": "Distingue conducta observable de etiqueta personal; propone escuchar y revisar.",
    "lid.delegacion": "Delimita resultado, plazo, autonomía y punto de revisión.",
    "ope.procesos": "Ordena correctamente el flujo y describe entradas y salidas mínimas.",
    "ope.indicadores": "Lee 28/40 = 70 % y distingue tasa, meta y volumen de cajas.",
    "ope.calidad": "Identifica el defecto, retiene las cajas afectadas y propone verificar, corregir y prevenir.",
    "ope.capacidad": "Encuentra el mínimo de 70 y la diferencia de 20 frente a 90.",
    "cre.cliente": "Identifica comprador, usuario y quien recomienda, y la necesidad de cada uno.",
    "cre.segmentacion": "Separa dos grupos por necesidades útiles de compra.",
    "cre.precios": "Distingue precio y costo y calcula la caída de 120 a 90 por caja con 10 % de descuento.",
    "cre.canales": "Identifica etapas y tasas 6/24 = 25 % y 5/10 = 50 %, sin inferir rentabilidad.",
    "rie.fundamentos": "Distingue impacto, posibilidad e incertidumbre en los riesgos observados.",
    "rie.etica": "Reconoce que ocultar fallas de alérgenos perjudica a personas y rechaza el ocultamiento.",
    "rie.cumplimiento": "Verifica el cambio bancario por canal independiente y exige autorización y registro.",
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-13", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "Los documentos muestran los datos del paquete, pero no las cifras que el reto pide calcular (utilidad, efectivo al cierre, porcentajes, máximo del proceso, 3,000): el paquete las traía escritas.",
    "Las etapas de D04 aparecen en orden alfabético para que ordenar el proceso no sea copiar la tabla.",
    "D05 aparece desde la escena 3: trae la meta de puntualidad que se arma en la escena 2.",
    "D06 se dividió en tres hojas (roles y segmentos, embudo, una caja estándar) porque cada tabla tiene columnas distintas.",
    "Se añadieron D08 a D11 con lo que el paquete describe en las escenas (comparativo del competidor, tablero de iniciativas, registros de Óscar, correo y directorio del proveedor).",
    "La escala por habilidad (0 a 4) se reparte en pasos con puntos fijos; la propuesta de reparto es de la conversión y está por revisar.",
    "Para la caja se pide cuánto bajó el efectivo (16,000) y el puente con la utilidad (42,000 − 8,000 = 34,000), porque el efectivo al cierre (6,000) está a la vista en el balance.",
    "Cuatro de los 96 puntos son respuestas escritas: quedan en espera de revisión de una persona.",
    "Las ramas del paquete se convirtieron en respuestas de los personajes y en marcas que cambian textos de escenas posteriores (prioridad, caja, ventaja, lote, encargo, Óscar, anuncios, banco, plan).",
    "La síntesis (S14) no suma puntos. Acepta por igual dos órdenes de prioridades defendibles, siempre que el fundamento elegido después también lo sea; el paso de fundamento es de la conversión.",
    "Salvaguardas: se marcaron como críticas las rutas que el paquete nombra como falla (enviar las cajas, ocultar la falla al cliente, pagar sin verificar). Tras una ruta crítica, el personaje da información nueva y hay un paso para rectificar, sin puntos. El informe distingue cumplida, corregida y sin corregir. Los pasos de rectificación de S07 y S13 son de la conversión; el de S12 adapta la salida que el paquete pone en voz de Irene.",
    "Las rutas intermedias que añadió la conversión (retener todo, tirar sin registrar, contestar al mismo correo, denunciar) no se marcaron como críticas: pierden puntos, pero no abren el daño. Está por confirmar.",
    "El reto no guarda umbrales de aprobación: los candidatos del paquete (hipótesis sin calibrar) no se copiaron.",
    "La variante B (mantenimiento preventivo de edificios) no está escrita en el paquete.",
  ],
};
