/**
 * mêtis CEO · Kúbit · cadena piloto de consecuencias (v7): «La factura de la nube».
 *
 * Decisión del día 2: la factura de infraestructura subió 40 % y la caja es el encargo (más clientes).
 *  - Optimizar por etapas con el equipo de guardia (a) → día 4: aparece que un solo cliente consume la tercera parte.
 *  - Migrar todo de proveedor en un fin de semana (b)  → día 4, incierto (45 de cada 100): la migración falla en el
 *                                                       cierre de mes de los clientes (negativa).
 *  - Compromiso de tres años con el proveedor (c)      → día 5, incierto (40 de cada 100): el consejo ve el compromiso
 *                                                       en el modelo de caja de la siguiente ronda.
 * La probabilidad se dice desde el día 2. Solo llega en periodos con reglas v7 o posteriores (`since: 7`).
 */
import type { Item } from "../types";

const V = 7;

export const CADENA_KUBIT: Item[] = [
  {
    id: "kb-d2-nube", day: 2, slot: 3, channel: "reporte", from: "andrea", since: V,
    involves: ["memo", "emilio"],
    subject: "La factura de la nube subió 40 %",
    preview: "La infraestructura ya es nuestro segundo gasto después de la nómina. Te paso tres caminos…",
    body: [
      "Director: la factura de infraestructura en la nube subió 40 % en seis meses. Ya es nuestro segundo gasto después de la nómina y nos quita casi un mes de caja al año.",
      "Memo dice que hay mucho desperdicio: servidores encendidos que nadie usa y copias que se duplican. Emilio quiere aprovechar para cambiar de proveedor, que es más barato.",
      "Te pongo los tres caminos que tenemos.",
    ],
    data: {
      title: "Lo que sabes",
      rows: [
        ["Factura mensual de la nube", "$3.1 M (hace seis meses: $2.2 M)"],
        ["Optimizar por etapas con el equipo de guardia", "−25 % en ocho semanas"],
        ["Cambiar de proveedor en un fin de semana", "−35 % desde el mes siguiente"],
        ["Memo: migraciones así de rápidas", "4 o 5 de cada 10 tienen una caída seria en las primeras semanas"],
        ["Compromiso de tres años con el proveedor actual", "−30 % · pago anual por adelantado · en 4 de cada 10 rondas el consejo cuestiona la caja comprometida"],
      ],
      note: "Estimaciones de Andrea y de Memo con la factura del último mes. Cifras ficticias de este caso, no estadísticas reales.",
    },
    ask: "¿Qué haces con el costo de la nube?",
    options: [
      { id: "a", stance: { memo: 2, emilio: -1 }, text: "Optimizar por etapas con el equipo de guardia: apagar lo que no se usa y medir cada semana cuánto bajamos.", reply: ["Gracias. En dos semanas le enseño lo primero.", "(Emilio) Es lento, pero no rompe nada."], outcome: "El ahorro llega poco a poco y sin riesgo para los clientes. Le quita horas al equipo de guardia durante dos meses.", effects: { caja: 2, clientes: 1, equipo: -1 }, style: { horizonte: 2, riesgo: -2 }, score: 3 },
      { id: "b", stance: { emilio: 2, memo: -2 }, text: "Migrar toda la plataforma al proveedor más barato en un solo fin de semana, antes del próximo cierre.", reply: ["¡Por fin! Lo planeo con el equipo hoy.", "(Memo) Director, yo no garantizo que salga sin caídas."], outcome: "El ahorro más grande, desde el mes siguiente. Arriesgas la plataforma en la semana en que tus clientes más la usan.", effects: { caja: 3, equipo: 1, clientes: -1 }, style: { horizonte: -1, riesgo: 2 }, score: 1 },
      { id: "c", stance: { andrea: 1, memo: 1, emilio: -1 }, text: "Firmar tres años con el proveedor actual por 30 % de descuento, pagando el primer año por adelantado.", reply: ["El descuento es bueno. El pago anticipado pesa.", "(Memo) Al menos no movemos nada."], outcome: "Bajas el costo sin tocar la plataforma. Pagas un año de golpe y te amarras tres años a un proveedor.", effects: { margen: 2, caja: -2, clientes: 1 }, style: { riesgo: 1, horizonte: 1 }, score: 2 },
    ],
    expired: { reply: ["(Andrea) Sin decisión, la factura siguió subiendo."], outcome: "Sin decisión, la nube siguió costando más cada mes.", effects: { caja: -2 } },
    lesson: "finanzas",
    bitacora: { title: "El costo que crece solo", text: "En software, el costo de infraestructura sube con cada cliente y con cada descuido. Bajarlo es caja real; la pregunta es cuánto riesgo le pasas a tus clientes para lograrlo más rápido.", nota: "El ahorro más rápido casi siempre es el que más riesgo traslada a otro." },
    areas: ["finanzas", "operacion", "estrategia"],
  },

  // ───────────────────────────────────────────── DÍA 4 · camino «optimizar por etapas»: el cliente que más consume
  {
    id: "kb-c-nube-consumo", day: 4, slot: 3, channel: "whatsapp", from: "memo", since: V,
    involves: ["hernan", "bruno", "andrea"],
    trigger: { item: "kb-d2-nube", options: ["a"] },
    subject: "Guillermo «Memo» Paz", preview: "Director, ya bajamos 18 %. Y encontramos algo: un solo cliente consume la tercera parte…",
    body: [
      "Director, con lo primero que apagamos ya bajamos 18 % la factura sin una sola caída.",
      "Y encontramos algo: los reportes a la medida de Grupo Altamar consumen la tercera parte de toda la infraestructura. Corren cada hora, aunque ellos los ven una vez al día.",
      "Altamar paga lo mismo que cualquier cliente de su tamaño. Bruno dice que no le toquemos nada antes de la renovación.",
    ],
    data: { title: "Lo que sabes", rows: [["Ahorro logrado", "18 % · sin caídas"], ["Consumo de los reportes de Altamar", "≈ 33 % de la infraestructura"], ["Si corren una vez al día", "−20 % adicional"], ["Altamar en el ingreso", "22 %"]] },
    ask: "¿Qué haces con el consumo de Altamar?",
    options: [
      { id: "a", stance: { memo: 2, andrea: 1, bruno: -1 }, text: "Proponerle a Hernán correr sus reportes una vez al día sin costo, o cada hora con un cargo por uso.", reply: ["Así se lo explico con datos, Director.", "(Bruno) Es arriesgado tan cerca de la renovación."], outcome: "Le das a Altamar la decisión con el costo a la vista. Puede molestarse, pero entiende por qué.", effects: { caja: 2, clientes: -1, equipo: 1, consejo: -1 }, style: { conflicto: 1, horizonte: 1 }, score: 3 },
      { id: "b", stance: { memo: 1, hernan: -1, bruno: -2 }, text: "Cambiar los reportes de Altamar a una vez al día sin avisar: el contrato no promete que sean cada hora.", reply: ["Técnicamente se puede hoy mismo.", "(Bruno) Si Hernán lo nota, se nos complica la renovación."], outcome: "Ahorras de inmediato. Si Altamar lo nota antes que se lo expliques, lo va a leer como un cambio a escondidas.", effects: { caja: 3, clientes: -2 }, style: { conflicto: -1, riesgo: 2 }, score: 1 },
      { id: "c", stance: { bruno: 2, memo: -1 }, text: "Dejar los reportes de Altamar como están hasta la renovación y seguir optimizando todo lo demás.", reply: ["Va, Director, aunque es la parte más grande.", "(Bruno) Gracias, después de renovar lo vemos."], outcome: "Cuidas la renovación de tu cliente más grande. El ahorro grande se queda esperando y otros clientes pagan ese costo en el margen.", effects: { clientes: 1, margen: -1 }, style: { conflicto: -1, horizonte: -1 }, score: 2 },
    ],
    expired: { reply: ["(Memo) Sin respuesta, seguimos con lo demás."], outcome: "Sin decisión, el consumo de Altamar siguió igual.", effects: { margen: -1 } },
    lesson: "negociacion",
    bitacora: { title: "El cliente que cuesta más de lo que paga", text: "Medir el costo por cliente cambió la conversación: ya no es «la nube es cara», es «este cliente usa mucho más de lo que paga». Mostrarle el costo y dejarle elegir protege la relación mejor que un cambio en silencio.", nota: "Lo que no se mide por cliente lo terminan pagando los demás." },
    areas: ["clientes", "negociacion", "finanzas"],
  },

  // ───────────────────────────────────────────── DÍA 4 · camino «migrar en un fin de semana»: a veces se cae
  {
    id: "kb-c-nube-caida", day: 4, slot: 3, channel: "llamada", from: "renata", since: V,
    involves: ["memo", "emilio", "itzel"],
    trigger: { item: "kb-d2-nube", options: ["b"], roll: [0, 0.45] },
    subject: "Llamada perdida · Renata Cruz (Éxito del Cliente)", preview: "Director, desde la migración la plataforma se cae cada tarde y es cierre de mes…",
    body: [
      "Mensaje de voz · 0:47",
      "«Director, desde la migración la plataforma se cae casi cada tarde, justo en el cierre de mes de los clientes. Itzel tiene 140 tickets abiertos y tres clientes grandes ya pidieron hablar con usted.»",
      "«Memo dice que puede regresar al proveedor anterior en 48 horas, pero perdemos el ahorro y pagamos los dos este mes.»",
    ],
    data: { title: "Lo que sabes", rows: [["Caídas desde la migración", "5 en 6 días · 40 minutos en promedio"], ["Tickets abiertos", "140"], ["Regresar al proveedor anterior", "48 horas · pagar ambos este mes"], ["Arreglar en el proveedor nuevo", "Memo estima 2 semanas"]] },
    ask: "La plataforma se cae en el cierre de mes. ¿Qué haces?",
    options: [
      { id: "a", stance: { renata: 2, memo: 1, emilio: -1 }, text: "Regresar al proveedor anterior en 48 horas, llamar yo a los tres clientes grandes y dar un crédito por las caídas.", reply: ["Gracias. Los clientes necesitaban oír eso de usted.", "(Emilio) Perdemos el ahorro y la migración queda para después."], outcome: "Pagas los dos proveedores este mes y el crédito a clientes. La plataforma se estabiliza y los clientes saben quién respondió.", effects: { caja: -3, clientes: 1, equipo: 1 }, style: { horizonte: 1, conflicto: 1 }, score: 3 },
      { id: "b", stance: { emilio: 2, renata: -1 }, text: "Quedarse en el proveedor nuevo, poner a todo ingeniería a estabilizar dos semanas y avisar a los clientes del plan.", reply: ["El equipo lo saca, Director.", "(Renata) Dos semanas de caídas es mucho para un cliente en cierre."], outcome: "Conservas el ahorro si lo estabilizan. Cada caída más le cuesta confianza de clientes y ingeniería deja todo lo demás.", effects: { caja: 1, clientes: -2, equipo: -1 }, style: { riesgo: 2, foco: 1 }, score: 2 },
      { id: "c", stance: { emilio: 1, renata: -2 }, text: "Quedarse, estabilizar con calma y que Soporte responda los tickets sin llamadas de la dirección.", reply: ["Lo intentamos, pero los clientes quieren hablar con alguien de arriba.", "(Itzel) Mis agentes ya no saben qué decir."], outcome: "No gastas en revertir. Los clientes grandes no escuchan a la dirección justo cuando más lo esperan.", effects: { caja: 2, clientes: -3 }, style: { foco: -1, conflicto: -1 }, score: 1 },
    ],
    expired: { reply: ["(Renata) Sin respuesta, dos clientes grandes pidieron cancelar."], outcome: "Sin decisión, siguieron las caídas y empezaron las cancelaciones.", effects: { clientes: -4, equipo: -1 } },
    lesson: "crisis",
    bitacora: { title: "El ahorro que se cobró en confianza", text: "La migración rápida prometía el ahorro más grande. Cuando falló en el peor momento, la pregunta dejó de ser cuánto ahorrar y pasó a ser cuánto cuesta recuperar a los clientes.", nota: "En una crisis con clientes, primero se estabiliza y se da la cara; después se recalcula el ahorro." },
    areas: ["clientes", "operacion", "comunicacion"],
  },

  // ───────────────────────────────────────────── DÍA 5 · camino «compromiso de tres años»: el consejo lo ve
  {
    id: "kb-c-nube-compromiso", day: 5, slot: 3, channel: "email", from: "valeria", since: V,
    involves: ["andrea", "ibarra"],
    trigger: { item: "kb-d2-nube", options: ["c"], roll: [0, 0.4] },
    subject: "Pregunta antes del consejo: el compromiso con la nube", preview: "En el modelo de caja aparece un pago anticipado de $26 M que no estaba en el plan…",
    body: [
      "Director:",
      "Revisando el material del consejo vi un pago anticipado de $26 M a la nube que no estaba en el plan. Nos quita dos meses de caja justo antes de salir a levantar la Serie C.",
      "Entiendo el descuento. Lo que necesito es saber cómo vamos a explicar la caja a los fondos que vamos a visitar.",
      "Valeria Contreras",
    ],
    data: { title: "Lo que sabes (Andrea)", rows: [["Pago anticipado", "$26 M · primer año"], ["Ahorro en tres años", "≈ $33 M"], ["Meses de caja", "12 (antes del pago: 14)"], ["Clientes con contrato anual", "40 % · pago anticipado con 5 % de descuento es posible"]] },
    ask: "¿Cómo respondes al consejo?",
    options: [
      { id: "a", stance: { valeria: 2, ibarra: 1, andrea: 1 }, text: "Presentarle al consejo el ahorro y la caja con dos escenarios, y el plan para recuperar esos dos meses.", reply: ["Eso es justo lo que necesito llevar.", "(Andrea) Armo los dos escenarios para el jueves."], outcome: "El consejo ve la decisión completa con su costo. Te cuestionan el momento, pero confían en los números.", effects: { consejo: 2, caja: -1, equipo: -1 }, style: { horizonte: 2, conflicto: 1 }, score: 3 },
      { id: "b", stance: { andrea: 1, valeria: 1 }, text: "Ofrecer a clientes anuales 5 % de descuento por pagar por adelantado, para reponer la caja este trimestre.", reply: ["Recupera caja, aunque le pega al margen.", "(Valeria) Que quede claro en el material que es temporal."], outcome: "Repones parte de la caja con dinero de tus clientes. Bajas el margen y adelantas ingresos del año que viene.", effects: { caja: 3, margen: -2, clientes: -1 }, style: { foco: 1, riesgo: 1 }, score: 2 },
      { id: "c", stance: { ibarra: -1, valeria: -1, andrea: 1 }, text: "Renegociar con el proveedor a un año, con menos descuento y una penalización por cambiar el contrato.", reply: ["Se puede, pero el proveedor va a cobrar la penalización.", "(Valeria) Bien, pero ¿por qué no lo vimos antes de firmar?"], outcome: "Recuperas flexibilidad y parte de la caja. Pagas la penalización y el consejo se pregunta por qué se firmó así.", effects: { caja: 1, margen: -1, consejo: -1 }, style: { riesgo: -1, horizonte: -1 }, score: 1 },
    ],
    expired: { reply: ["(Valeria) Lo veremos en el consejo sin tu explicación."], outcome: "Sin respuesta, el consejo discutió el compromiso sin escuchar al director.", effects: { consejo: -3 } },
    lesson: "consejo",
    bitacora: { title: "Un buen descuento en mal momento", text: "El compromiso bajó el costo de la nube, pero adelantó dos meses de caja justo antes de una ronda. La decisión era razonable; lo que el consejo necesita es verla completa, con su costo y su plan.", nota: "Al consejo no le preocupa que tomes riesgos; le preocupa enterarse de ellos tarde." },
    areas: ["finanzas", "alineacion", "comunicacion"],
  },
];
