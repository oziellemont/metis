/**
 * mêtis CEO · Conceptos de dirección que enseña cada caso (sistema de aprendizaje).
 *
 * Cada concepto es una idea concreta de administración, estrategia, finanzas o liderazgo, con su definición.
 * Cada caso enseña UN concepto y trae una aplicación: cómo se ve ese concepto en ESA situación.
 * Solo es contenido de lectura: no cambia puntajes, efectos ni veredictos.
 */
import { bankArchetypeOf, isBankId } from "./cases/bank";

export interface Concept { id: string; name: string; definition: string }

const C = (id: string, name: string, definition: string): Concept => ({ id, name, definition });

export const CONCEPTS: Record<string, Concept> = Object.fromEntries([
  C("costo_oportunidad", "Costo de oportunidad", "El verdadero costo de usar un recurso es lo mejor que dejas de hacer con él. Cada peso, hora o persona que asignas a algo deja de estar disponible para otra cosa."),
  C("liquidez", "Liquidez y capital de trabajo", "Una empresa puede ser rentable y aun así no poder pagar nómina ni proveedores. La utilidad dice si el negocio gana dinero; la liquidez, si puedes cumplir tus obligaciones de esta semana."),
  C("apalancamiento", "Apalancamiento financiero", "La deuda multiplica el rendimiento cuando las cosas salen bien y multiplica el daño cuando salen mal. Además trae pagos fijos y condiciones que reducen tu margen de maniobra."),
  C("etapas", "Inversión por etapas", "Dividir una inversión en fases convierte una apuesta grande en decisiones pequeñas: comprometes poco al inicio y conservas el derecho, no la obligación, de seguir si los resultados lo justifican."),
  C("estructura_capital", "Estructura de capital: deuda o capital", "La deuda obliga a pagar pase lo que pase; el capital nuevo no tiene pagos fijos, pero diluye la propiedad y el control de los socios actuales. Elegir la mezcla es decidir quién carga el riesgo."),
  C("concentracion", "Concentración de clientes", "Cuando un cliente pesa mucho en tus ventas, tiene poder para dictar precio y condiciones, y perderlo pone en riesgo a toda la empresa."),
  C("batna", "BATNA: tu mejor alternativa sin acuerdo", "Tu poder en una negociación no depende de qué tan firme suenas, sino de qué tan buena es tu alternativa si no hay acuerdo. Una alternativa que todavía no existe no da poder: es un alarde."),
  C("intereses", "Intereses, no posiciones", "La posición es lo que alguien pide; el interés es por qué lo pide. Negociar sobre intereses abre soluciones que las posiciones no dejan ver."),
  C("integrativa", "Negociación integrativa", "Antes de repartir el valor, búscalo: intercambiar cosas que a ti te cuestan poco y a la otra parte le valen mucho agranda lo que se puede repartir."),
  C("juego_repetido", "Juego repetido y reputación", "Cuando negociarás muchas veces con la misma contraparte, cada jugada le enseña cómo reaccionarás la próxima. Ganar hoy con dureza puede encarecer todas las negociaciones siguientes."),
  C("piramide", "Principio de la pirámide", "En comunicación ejecutiva la conclusión va primero y los argumentos después. Quien decide necesita saber qué se le pide y por qué antes de ver el detalle."),
  C("visibilidad", "Desarrollar dando visibilidad", "Un líder multiplica su capacidad cuando cede protagonismo: dejar que otros presenten su trabajo ante la dirección acelera su desarrollo y retiene talento."),
  C("seguridad_psicologica", "Seguridad psicológica", "Un equipo aprende cuando decir «me equivoqué» o «no estoy de acuerdo» no tiene castigo. Sin esa seguridad, los problemas se esconden hasta que ya son caros."),
  C("goodhart", "Diseño de incentivos (ley de Goodhart)", "Cuando una medida se convierte en meta deja de ser buena medida: la gente optimiza el número, no el resultado. Todo incentivo se prueba preguntando qué haría alguien desesperado por cumplirlo."),
  C("cascada", "Despliegue de objetivos en cascada", "La estrategia se ejecuta cuando la meta de la empresa se traduce en indicadores de cada área que empujan en la misma dirección. Objetivos que no cuadran producen áreas exitosas en una empresa que no avanza."),
  C("silos", "Optimización local contra global", "Si cada área se mide solo con su propio indicador, puede ganar su bono mientras la empresa pierde. Medir a las áreas con un resultado compartido las obliga a resolver juntas sus conflictos."),
  C("piloto", "Experimento controlado", "Un piloto bien diseñado tiene tamaño acotado, plazo y un criterio de éxito definido antes de empezar. Sirve para aprender barato antes de apostar en grande, no para confirmar lo que ya creías."),
  C("premortem", "Premortem", "Antes de una apuesta grande, imagina que ya fracasó y explica por qué. Las causas que aparecen son lo que debes probar antes de comprometer todo."),
  C("innovador", "Dilema del innovador", "Las empresas establecidas suelen frenar negocios nuevos porque al principio parecen pequeños y compiten por recursos con el negocio que paga las cuentas. Separar la apuesta con presupuesto y equipo propios evita que la asfixien."),
  C("calidad_fuente", "Calidad en la fuente", "Detener un problema donde nace cuesta minutos; dejarlo avanzar cuesta mucho más después. Es la idea del jidoka de Toyota: quien ve el problema puede parar, y cada paro se investiga hasta la causa raíz."),
  C("cultura_justa", "Cultura justa", "Distingue el error honesto, el descuido y la conducta deliberada. Al error se responde mejorando el sistema; a la conducta deliberada, con consecuencias. Castigar todo por igual hace que la gente esconda los errores."),
  C("debido_proceso", "Debido proceso", "Ante una denuncia, primero se protege a quien denuncia, se separa al acusado de su poder mientras se investiga y la investigación la hace alguien independiente. Decidir antes de investigar, en cualquier dirección, es injusto y riesgoso."),
  C("tolera", "La cultura es lo que se tolera", "Los valores de una empresa no son los escritos en la pared, sino las conductas que se premian, se toleran o se sancionan, sobre todo cuando quien falla da buenos resultados."),
  C("rituales", "Cambio cultural por comportamientos", "La cultura cambia cuando cambian los comportamientos repetidos (juntas, reconocimientos, cómo reacciona el jefe), no con campañas. La gente cree lo que ve hacer al líder, no lo que se anuncia."),
  C("diagnostico", "Diagnóstico antes de prescribir", "En sus primeros 90 días, un director tiene poca información y mucha atención encima. Escuchar y diagnosticar antes de anunciar cambios evita resolver un problema que no es el de fondo y construye credibilidad."),
  C("crisis_com", "Comunicación de crisis", "En una crisis el silencio no es neutral: otros lo llenan. La regla es informar pronto lo que sabes, lo que no sabes y cuándo sabrás más, con una sola voz y con los afectados primero."),
  C("irreversible", "Decisiones reversibles e irreversibles", "Lo que se puede deshacer se decide rápido y se corrige; lo que no se puede deshacer (seguridad, salud, reputación) merece máxima cautela aunque cueste dinero en el corto plazo."),
  C("respuesta_incidentes", "Respuesta a incidentes", "Ante un ataque, primero se contiene y se evalúa con expertos. Pagar un rescate no garantiza recuperar los datos y te marca como blanco; avisar a tiempo a clientes y consejo es parte de la respuesta."),
  C("proveedor_unico", "Riesgo de proveedor único", "Depender de un solo proveedor para algo crítico concentra el riesgo: si falla, la operación se detiene. La resiliencia (segunda fuente, inventario, garantías) cuesta dinero hoy y protege cuando se necesita."),
  C("hundidos", "Costos hundidos", "Lo ya invertido no se recupera decidas lo que decidas; solo importan los flujos futuros. Seguir con algo para no «perder lo invertido» es un error frecuente de quien tomó la decisión original."),
  C("menu", "Ingeniería de menú", "Cada platillo se clasifica por cuánto se vende y cuánto deja: estrellas, caballos de batalla, enigmas y perros. Quitar perros y rediseñar lo popular de bajo margen mejora la rentabilidad sin perder lo que el cliente busca."),
  C("pareto", "Análisis de portafolio (80/20)", "En casi todos los portafolios, una minoría de productos o clientes genera la mayor parte de la utilidad. La complejidad del resto tiene costos ocultos en operación, inventario y atención."),
  C("guerra_precios", "Guerra de precios", "Bajar el precio para igualar a un competidor invita a otra baja; al final todos ganan menos y el cliente aprende a esperar descuentos. Responder solo donde te atacan y defender tu diferencia suele costar menos."),
  C("elasticidad", "Elasticidad precio", "Cuánto cae la venta al subir el precio depende de qué tan fácil es sustituirte y de cómo lo comunicas. Un aumento explicado y escalonado pierde menos clientes que uno sorpresivo."),
  C("cortoplacismo", "Cortoplacismo", "Recortar mantenimiento, capacitación o inversión para llegar al número del trimestre mejora la utilidad hoy y la empeora mañana. Un consejo bien gobernado prefiere un número real explicado a uno maquillado."),
  C("protocolo_familiar", "Gobierno corporativo en empresa familiar", "Un protocolo familiar y consejeros independientes separan las decisiones de la familia de las de la empresa. Sin reglas acordadas, cada decisión de negocio se vuelve un conflicto familiar."),
  C("sucesion", "Planeación de sucesión", "Un sucesor se elige con criterios explícitos, metas medibles y comparación con otros candidatos, no por cercanía ni por apellido. El proceso legitima al elegido ante la organización."),
  C("talento_interno", "Desarrollo interno de talento", "Cuando un perfil escaso se va por sueldo, el bono solo compra tiempo. Una carrera con escalones claros forma el talento que necesitas y lo hace más difícil de comprar para la competencia."),
  C("mentoria", "Curva de aprendizaje y mentoría", "Una persona recién formada tarda en alcanzar su productividad plena. Acompañarla con alguien experto acorta la curva y reduce errores caros en la etapa más riesgosa."),
  C("motivacion", "Motivación más allá del dinero", "Según Herzberg, el sueldo evita la insatisfacción pero no genera compromiso; el reconocimiento, el crecimiento y el respeto sí. Ofrecer dinero a quien se va por otra causa no la resuelve."),
  C("equidad", "Equidad interna", "La gente compara su sueldo con el de sus compañeros más que con el mercado. Diferencias sin criterio claro dañan la confianza; ajustes escalonados con criterios públicos la reconstruyen."),
  C("adaptativo", "Problemas técnicos y adaptativos", "Un problema técnico se resuelve con conocimiento experto; uno adaptativo exige que las personas cambien hábitos o prioridades (Heifetz). En los adaptativos, el líder no da la respuesta: crea las condiciones para que los involucrados la construyan."),
  C("escalar_mejora", "Escalar una mejora", "Una mejora local se vuelve sistema cuando se estandariza y la enseñan quienes la crearon. La gente adopta más rápido lo que ve funcionar en alguien como ella."),
  C("recorte_unico", "Recortes: una sola vez y bien", "Los recortes graduales mantienen a toda la organización con miedo y empujan a irse al mejor talento. Un solo ajuste suficiente, explicado con cifras y con trato digno, permite volver a trabajar."),
  C("expectativas", "Gestión de expectativas", "Prometer lo que todavía no puedes cumplir gana el contrato y pierde la confianza. Prometer lo que sí cumples, con compensación automática si fallas, convierte la honestidad en ventaja comercial."),
  C("plataformas", "Dependencia de plataformas", "Un intermediario que concentra a tus clientes gana poder para subir comisiones y fijar reglas. Un canal propio cuesta al principio, pero reduce esa dependencia."),
  C("escalar_sistema", "Escalar con sistema", "Crecer multiplica lo que ya existe, incluidos los problemas. Antes de abrir más unidades o franquicias se necesitan manual, estándares y supervisión que funcionen sin el fundador."),
  C("consejo_gob", "Relación con el consejo", "El consejo no está para recibir informes de actividad, sino para tomar pocas decisiones importantes. Un director gana su confianza con opciones claras, sin sorpresas y con compromisos medibles."),
  C("comunicacion_cambio", "Comunicar la incertidumbre", "Ante rumores, la gente necesita saber qué está decidido, qué no y cuándo se sabrá. Un comunicado que niega todo o un acuerdo en privado alimentan la desconfianza."),
  C("estrategia_elegir", "Estrategia es elegir", "Una estrategia define a qué le dices que no. Crecer en todos los frentes a la vez dispersa recursos; elegir dónde competir y cómo ser distinto concentra la fuerza."),
  C("aversion_perdida", "Aversión a la pérdida", "Las personas sienten más perder algo que ganar algo equivalente. Un cambio que quita algo querido genera rechazo aunque convenga; una salida parcial reduce la sensación de pérdida sin deshacer el cambio."),
].map((c) => [c.id, c]));

/**
 * Lección de Academy que explica a fondo cada concepto (la teoría detrás de lo que el caso puso en práctica).
 * Solo navegación: no cambia puntajes, XP ni el desbloqueo de lecciones.
 */
export const CONCEPT_LESSON: Record<string, string> = {
  costo_oportunidad: "finanzas", apalancamiento: "finanzas", etapas: "finanzas", estructura_capital: "finanzas",
  liquidez: "finanzas-2",
  concentracion: "estrategia-2", pareto: "estrategia-2", menu: "estrategia-2", estrategia_elegir: "estrategia-2",
  guerra_precios: "estrategia", elasticidad: "estrategia", plataformas: "estrategia",
  batna: "negociacion", intereses: "negociacion", integrativa: "negociacion",
  juego_repetido: "negociacion-2", equidad: "negociacion-2",
  piramide: "comunicacion",
  recorte_unico: "comunicacion-2", comunicacion_cambio: "comunicacion-2",
  visibilidad: "personas", motivacion: "personas",
  mentoria: "personas-2", escalar_sistema: "personas-2",
  sucesion: "personas-3", talento_interno: "personas-3",
  seguridad_psicologica: "equipos",
  cascada: "alineacion", silos: "alineacion",
  goodhart: "alineacion-2",
  piloto: "innovacion", innovador: "innovacion", escalar_mejora: "innovacion",
  hundidos: "innovacion-2", premortem: "innovacion-2", aversion_perdida: "innovacion-2",
  tolera: "cultura", rituales: "cultura", calidad_fuente: "cultura",
  cultura_justa: "cultura-2",
  debido_proceso: "conversaciones-2",
  diagnostico: "mentalidad-2",
  adaptativo: "mentalidad",
  crisis_com: "crisis", irreversible: "crisis", respuesta_incidentes: "crisis", proveedor_unico: "crisis",
  consejo_gob: "consejo", cortoplacismo: "consejo", expectativas: "consejo", protocolo_familiar: "consejo",
};

export interface CaseConcept { concept: string; applied: string }
const A = (concept: string, applied: string): CaseConcept => ({ concept, applied });

// ─── grupos paralelos de Forja, Kúbit, Punto Madero y Vértice (misma estructura de caso, distinta industria)
const G = {
  carta: A("diagnostico", "Los dueños esperan resultados pronto, pero un plan de recortes desde el primer día se basa en reportes, no en lo que pasa en la operación ni en lo que le duele al cliente. Recorrer primero te da un diagnóstico propio."),
  control: A("calidad_fuente", "Alguien de la operación pide sostener un control que frena el ritmo. Defenderlo con un criterio claro (cuándo aplica, cuánto dura, quién decide) conserva la seguridad sin paralizar; dejarlo al jefe directo deja sola a la persona que levantó la mano."),
  precio: A("integrativa", "El cliente pide más de lo pactado. Aceptarlo todo regala margen y le enseña que basta con presionar; negarse con el contrato protege el margen; buscar juntos algo que a él le vale más de lo que a ti te cuesta agranda lo que se reparte."),
  fuga: A("talento_interno", "Un bono detiene la fuga unos meses, pero no cambia por qué se van. Formar tu propio talento con escalones de sueldo crea oferta donde no la hay; depender menos del perfil escaso es otra vía, con su propio costo."),
  falla: A("crisis_com", "Ante una falla que afectó a quien confía en ti, contener sin ruido o defenderte con el contrato puede ser técnicamente válido, pero te juzgan por cómo reaccionaste. Dar la cara con la causa y la corrección convierte la falla en prueba de confianza."),
  promesa: A("expectativas", "Afirmar que algo ya funciona cuando no es así gana la fecha o el contrato y arriesga la confianza. Decir la verdad con un plan y una compensación si fallas protege la relación sin perder el negocio."),
  mejora: A("escalar_mejora", "La mejora ya funcionó en una parte de la empresa. Llevarla a todos con quienes la crearon como maestros aprovecha el impulso; consolidarla antes es más seguro, pero corre el riesgo de que pierda energía."),
  deuda: A("apalancamiento", "Tomar toda la deuda que te ofrecen acelera si todo sale bien y te deja sin margen si no. Tomar una parte y avanzar por etapas conserva capacidad de pago para lo imprevisto; rechazarla protege la caja a costa de crecer menos."),
  pleito: A("silos", "Cada director defiende el indicador con el que lo miden, y los dos tienen razón desde su área. Respaldar a uno resuelve el pleito de hoy; medirlos con un resultado compartido evita el de mañana."),
  cuentas: A("liquidez", "Una cuenta bloqueada no cambia si la empresa es rentable, pero sí si puede pagar mañana. Asegurar la nómina, conseguir una línea puente y avisar con hechos protege la liquidez y la confianza a la vez; callar y pagar a medias daña las dos."),
  capital: A("estructura_capital", "Vender o tomar una ronda grande da recursos hoy a cambio de propiedad y control; crecer solo con lo propio protege la propiedad a costa de recortes. Un capital menor atado a metas equilibra crecimiento y disciplina."),
  renuncia: A("seguridad_psicologica", "Una directora renuncia porque su advertencia no fue escuchada. Aceptar la renuncia resuelve el puesto, pero le dice a todos que contradecir al director cuesta el trabajo; admitir el error y corregir reconstruye la confianza para disentir."),
  proveedor: A("proveedor_unico", "El proveedor crítico está en riesgo y no hay sustituto inmediato. Apoyarlo con garantías mientras preparas una segunda fuente compra tiempo con riesgo controlado; comprarlo da control pero te mete en otro negocio; sustituirlo de emergencia sale caro."),
  denuncia: A("debido_proceso", "Con tres denuncias coincidentes, despedir de inmediato parece firme pero se salta la investigación; dejarlo en su puesto y mover a quienes denunciaron castiga a las víctimas. Suspender, proteger y que investigue alguien externo es el debido proceso."),
  escuela: A("mentoria", "Los recién formados tienen la técnica, no la experiencia. Mandarlos directo cubre la necesidad de hoy; acompañarlos unos meses con alguien experto reduce errores y rotación en la etapa más riesgosa."),
  consejo: A("consejo_gob", "El consejo propone recortar. Aceptar sin más o negarte sin alternativa no le da al consejo una decisión que tomar; proponer una meta medible con plazo, y comprometerte a lo que harás si no llegas, sí."),
  rumor: A("comunicacion_cambio", "Corre el rumor de recortes. Un comunicado que dice «no hay nada decidido» o un acuerdo en privado con un líder no responden lo que la gente quiere saber: qué está decidido, qué no y cuándo se sabrá."),
};
const group = (prefix: string, ids: Record<string, CaseConcept>) => Object.fromEntries(Object.entries(ids).map(([k, v]) => [`${prefix}-${k}`, v]));

export const CASE_CONCEPTS: Record<string, CaseConcept> = {
  // ─── Alimentos Sierra Alta (cumbre)
  "d1-bienvenida": A("diagnostico", "Recorrer la empresa antes de anunciar prioridades te da información que no está en los reportes. Anunciar desde la primera semana gana el aplauso del consejo, pero con un diagnóstico que todavía no es tuyo."),
  "d1-hector": A("intereses", "Héctor pedía «no toquen las comisiones»: esa es su posición. Lo que le importaba era respeto y que lo tomaran en cuenta: ese es su interés. Atender el interés permite revisar el esquema sin convertirlo en enemigo."),
  "d2-supernorte": A("batna", "Tu alternativa a SuperNorte, las tiendas de conveniencia, todavía no existía: amenazar con ella era alardear, y aceptar todo era negociar sin alternativa. Los datos de rotación sí eran poder real."),
  "d2-ana": A("piramide", "Las 22 láminas contaban el trabajo en el orden en que se hizo. Para un consejo, la presentación empieza por lo que debe decidir y después da los argumentos."),
  "c-hector-aliado": A("visibilidad", "Dejar que Héctor arme la propuesta aprovecha su relación con el cliente y lo convierte en aliado. Llevarla tú te da visibilidad personal, pero desaprovecha la mejor carta que tenías."),
  "d3-planta": A("irreversible", "Un accidente en el tostador no se puede deshacer; un retraso con el cliente, sí. En una decisión de seguridad, el costo de parar se paga una vez; el de no parar puede ser permanente."),
  "d3-diego": A("piloto", "Un piloto acotado en tiendas, plazo y presupuesto, con la condición de que venda sin comerse la línea tradicional, convierte una apuesta de dos terceras partes del marketing en un experimento barato."),
  "c-hector-renuncia": A("motivacion", "Héctor no se iba por sueldo, sino porque se sintió ignorado. Igualar la oferta atiende una causa que no era la suya; ir a escucharlo atiende la real."),
  "d4-objetivos": A("cascada", "Si cada director conserva objetivos que no cuadran entre sí, cada área puede cumplir y la empresa no avanzar. Una meta común desplegada en indicadores por área hace que todos jalen en la misma dirección."),
  "d4-sindicato": A("integrativa", "Entre lo que pide el sindicato y lo que aguanta el presupuesto, atar un bono a la reducción de merma crea dinero nuevo para repartir: la empresa paga más solo si también gana más."),
  "c-supernorte-castigo": A("juego_repetido", "El cliente respondió quitándote espacio porque negociarás con él cada año. Reconocer el exceso y volver a la propuesta de valor repara la relación; sostener la dureza la encarece."),
  "d5-credito": A("etapas", "Tomar el crédito completo compromete caja y deuda de golpe; hacer la primera fase con flujo propio deja abierta la segunda solo si los resultados la justifican. Posponer todo protege la caja, pero retrasa los ahorros operativos."),
  "d5-consejo": A("consejo_gob", "Contar todo lo que hiciste en estas semanas o culpar a la administración anterior no le da al consejo nada que decidir. Abrir con tu tesis y pedir tres decisiones concretas, sí."),
  "c-ana-brilla": A("visibilidad", "Ana pidió presentar su trabajo. Presentarla y dejar que cierre con su recomendación la desarrolla ante el consejo; presentarlo tú le da el crédito de palabra, pero no la experiencia."),
  "d2-mantenimiento": A("costo_oportunidad", "Los $1.8 M y los cuatro días de paro del mantenimiento compiten con la caja y el pedido de temporada alta. Posponer no elimina el costo: lo cambia por un riesgo que nadie puede fechar, y que suele cobrarse cuando más duele."),
  "c-mant-sabados": A("equidad", "Recuperar cuatro días de producción cae sobre la gente de planta. Sábados obligatorios a tarifa de ley, voluntarios con pago doble o maquila afuera reparten ese costo de forma distinta, y la planta recuerda quién lo pagó."),
  "c-mant-falla": A("irreversible", "Con la envasadora rota, soldar el eje compra días a cambio de un riesgo que nadie puede medir; la refacción por avión cuesta más pero cierra el problema. Un parche es reversible hasta que falla en plena entrega."),
  "c-mant-rendimiento": A("cortoplacismo", "La máquina no se rompió, pero la merma y las horas extra ya cobran lo que se ahorró al posponer. Aguantar hasta enero protege la entrega de esta temporada y vuelve a pasarle la cuenta al margen y a la gente."),
  "c-mant-queja": A("juego_repetido", "SuperNorte es el cliente con el que vas a negociar cada trimestre. Disputar la penalización ahorra caja hoy; aceptarla con un plan, o cambiarla por una promoción, define cómo te va a tratar en la revisión del anaquel."),
  "c-mant-inversion": A("hundidos", "Los $1.8 M que se ahorraron ya no regresan. La decisión de hoy es solo entre reconstruir, comprar o rentar con los costos que vienen, sin tratar de justificar lo que se decidió antes."),
  "c-mant-dosificador": A("calidad_fuente", "El dosificador que no se revisó llenó empaques con menos contenido. Corregir la máquina resuelve lo que viene; lo que ya salió obliga a decidir si el cliente se entera por ti o por su propia báscula."),
  "c-planta-accidente": A("rituales", "Después de un accidente, toda la planta mira qué hace el director. Ir al hospital y parar la línea comunica la prioridad mejor que cualquier comunicado; mantenerse al margen comunica lo contrario."),
  "d6-gastos": A("tolera", "El mejor vendedor infló comprobantes. Lo que la empresa haga con él le dice a todos si la integridad depende de los resultados."),
  "d6-clima": A("rituales", "«Aquí no se le puede decir que no a un jefe» no se corrige con carteles. Se corrige cuando cambian las juntas y el director es el primero en pedir que lo contradigan."),
  "c-ana-renuncia": A("motivacion", "La contraoferta de sueldo sirve si la causa es el dinero. Preguntarle qué la haría quedarse descubre si la causa es otra: reconocimiento, crecimiento o carga de trabajo."),
  "c-piloto": A("etapas", "El piloto funcionó en pocas tiendas; eso no prueba que funcione en todo el país. Escalar a una región con el mismo tablero sigue aprendiendo con riesgo acotado; el lanzamiento nacional apuesta todo a una muestra pequeña."),
  "d7-sucesion": A("sucesion", "Diego tiene talento y apellido. Un plan con metas, un mentor y comparación con otros candidatos le permite ganarse el puesto con evidencia y que la organización lo acepte."),

  // ─── Forja Norte
  "fn-d1-carta": G.carta, "fn-d1-andon": G.control, "fn-d2-precio": G.precio, "fn-d2-soldadores": G.fuga, "fn-c-escape": G.falla,
  "fn-d3-ppap": G.promesa, "fn-c-kaizen": G.mejora, "fn-d4-recap": A("apalancamiento", "Endeudarse para pagar dividendos deja a la empresa con pagos fijos justo antes de una inversión grande. Hacerlo por etapas, atado a resultados, atiende al fondo sin quitarle a la empresa su margen de maniobra."),
  "fn-d4-pleito": G.pleito, "fn-d5-ciber": A("respuesta_incidentes", "Pagar el rescate promete recuperar los sistemas en horas, pero no lo garantiza y te marca como pagador. Restaurar y operar en manual cuesta días; contener con expertos y avisar al consejo y al cliente es parte de la respuesta."),
  "fn-d5-plataforma": A("concentracion", "Ganar la plataforma al precio objetivo asegura volumen, pero amarra un margen bajo por seis años con el cliente que ya es casi tres cuartas partes de la venta. Compartir la inversión del herramental baja tu riesgo a cambio de margen."),
  "fn-c-laura": G.renuncia, "fn-d6-proveedor": G.proveedor, "fn-d6-denuncia": G.denuncia, "fn-c-escuela": G.escuela, "fn-d7-consejo": G.consejo, "fn-d7-sindicato": G.rumor,

  // ─── Brasa
  "gb-d1-carta": A("diagnostico", "Atacar el costo desde el primer día se basa en reportes; trabajar turnos en cocina, piso y caja te muestra dónde se pierde el dinero y qué le importa a la gente antes de decidir."),
  "gb-d1-app": A("plataformas", "La exclusividad con la app te sube en la lista a cambio de depender más de ella. Un canal propio cuesta repartidores y promociones, pero reduce el poder del intermediario sobre tu margen."),
  "gb-d2-menu": A("menu", "De 72 platillos, 18 venden poco y dejan poco: quitarlos simplifica la cocina. Rediseñar la arrachera, que se vende mucho con margen bajo, ataca el problema de rentabilidad más grande."),
  "gb-d2-propinas": A("equidad", "Cocina ve que el piso gana más por propinas en el mismo turno. Repartir propinas o subir el sueldo base atacan la misma inequidad con costos y conflictos distintos; dejarlo a cada sucursal la vuelve desigual entre sucursales."),
  "gb-c-app-guerra": A("plataformas", "La app castiga tu posición por no aceptar la exclusividad. Sostener el canal propio cuesta ventas unos meses; abrir con otra app reparte la dependencia en lugar de reducirla."),
  "gb-d3-brote": A("irreversible", "Ante un posible brote, seguir abiertos mientras se confirma arriesga la salud de los comensales, algo que no se deshace. Cerrar y revisar cuesta ventas, que sí se recuperan."),
  "gb-d3-franquicia": A("escalar_sistema", "Diez interesados y crecer sin inversión propia es tentador. Pero una franquicia replica el sistema: si no existen el manual, la cocina central y la supervisión, se replican los problemas."),
  "gb-c-cocinas": A("aversion_perdida", "Los clientes extrañan los platillos que salieron. Un platillo rotativo atiende esa pérdida sin regresar la complejidad al menú; esperar a que se acostumbren puede funcionar, con quejas en el camino."),
  "gb-d4-carne": A("costo_oportunidad", "Absorber el aumento de la carne protege al cliente hoy, pero sale del margen que financiaría otras mejoras. Subir precios lo traslada al cliente; un contrato con otro proveedor, validado con cata ciega, ataca el costo sin tocar el precio."),
  "gb-d4-gerente": A("tolera", "El gerente con los mejores números tiene tres quejas formales. Si se le perdona por sus resultados, los demás gerentes aprenden que el clima no cuenta; medir a todos también por rotación cambia la regla para todos."),
  "gb-d5-cdmx": A("hundidos", "Lo invertido en esas sucursales ya no se recupera, decidas lo que decidas. La pregunta útil es cuáles pueden ganar dinero de aquí en adelante, no cuánto costó abrirlas."),
  "gb-c-franquicia-mala": A("escalar_sistema", "La franquicia falla porque no tenía manual ni proveedor fijo. Quitársela castiga al franquiciatario; escribir el sistema corrige la causa antes de abrir más."),
  "gb-d6-dark": A("piloto", "Una marca virtual puede sumar ventas o saturar las cocinas. Probar unas semanas en dos cocinas, con la regla de no afectar el salón, mide las dos cosas antes de comprometer todas."),
  "gb-d6-sucesion": A("protocolo_familiar", "Los hermanos no coinciden en vender o crecer con recursos propios. Recomendar una opción es tomar partido en un conflicto familiar; un protocolo y un consejo con independientes crean primero las reglas para decidir."),
  "gb-d7-consejo": A("estrategia_elegir", "Presentar cinco frentes deja al consejo eligiendo por ti; crecer con un fondo es una estrategia clara pero arriesgada con los costos actuales. Elegir rentabilidad primero define también qué no vas a hacer."),

  // ─── Kúbit, Punto Madero y Vértice (estructura paralela a Forja)
  ...group("kb", { "d1-carta": G.carta, "d1-guardia": G.control, "d2-altamar": G.precio, "d2-fuga": G.fuga, "c-caida": G.falla, "d3-demo": G.promesa, "c-mejora": G.mejora, "d4-deuda": G.deuda, "d4-pleito": G.pleito, "d5-banco": G.cuentas, "d5-ronda": G.capital, "c-renata": G.renuncia, "d6-centro": G.proveedor, "d6-denuncia": G.denuncia, "c-academia": G.escuela, "d7-consejo": G.consejo, "d7-equipo": G.rumor }),
  ...group("pm", { "d1-carta": G.carta, "d1-piso": G.control, "d2-penasco": G.precio, "d2-asesores": G.fuga, "c-tarima": G.falla, "d3-entrega": G.promesa, "c-mejora": G.mejora, "d4-deuda": G.deuda, "d4-pleito": G.pleito, "d5-embargo": G.cuentas, "d5-oferta": G.capital, "c-monica": G.renuncia, "d6-proveedor": G.proveedor, "d6-denuncia": G.denuncia, "c-escuela": G.escuela, "d7-consejo": G.consejo, "d7-equipo": G.rumor }),
  ...group("vl", { "d1-carta": G.carta, "d1-patio": G.control, "d2-almena": G.precio, "d2-operadores": G.fuga, "c-frenos": G.falla, "d3-rastreo": G.promesa, "c-mejora": G.mejora, "d4-deuda": G.deuda, "d4-pleito": G.pleito, "d5-embargo": G.cuentas, "d5-oferta": G.capital, "c-gaby": G.renuncia, "d6-sistema": G.proveedor, "d6-denuncia": G.denuncia, "c-escuela": G.escuela, "d7-consejo": G.consejo, "d7-equipo": G.rumor }),
  // ─── Cadenas piloto v7 (una por empresa)
  "fn-d2-inventario": A("liquidez", "Vender más no sube la caja si el dinero se queda en el almacén. Bajar días de inventario con los equipos de cada línea libera caja sin arriesgar la entrega; congelar compras de golpe o adelantar cobros resuelve el mes y abre otro riesgo."),
  "fn-c-inv-lineas": A("goodhart", "El bono por piezas premia producir de más, que es justo lo que llenó el almacén. Si el indicador que se paga contradice la meta de caja, la gente sigue al bono; cambiar cómo se mide alinea las dos cosas."),
  "fn-c-inv-faltante": A("proveedor_unico", "Al congelar compras desapareció el colchón que cubría los cambios de programa de Aurora. Con un solo cliente que puede parar su línea, el inventario de seguridad de las piezas críticas no es desperdicio sino seguro."),
  // ─── Cadena profunda v8 (Forja): el faltante sigue con el cliente y con el consejo
  "fn-c8-greg": A("respuesta_incidentes", "Después de un incidente, el cliente no pregunta de quién fue la culpa sino qué controlas tú y qué cambia. Una causa raíz que reconoce tu parte, con un plan medible, cierra el incidente; pagar por la calificación o señalar al cliente lo deja abierto."),
  "fn-c8-consejo": A("consejo_gob", "A un consejo con fondo no le preocupa que una decisión haya costado; le preocupa enterarse por otro lado. Reportar la cadena completa, con el costo y la regla que cambia, protege la confianza; omitir el costo apuesta a que nadie lo pida."),
  "fn-c-inv-factoraje": A("concentracion", "Cuando el 72% de la venta depende de un cliente, cada señal financiera que ese cliente ve pesa en la siguiente adjudicación. Ceder sus facturas compra caja hoy y le avisa a Aurora que la planta anda corta."),
  "gb-d2-proveedor": A("piloto", "Una carne 14% más barata puede mejorar el margen o cambiar el sabor que trae a los comensales. Probar a ciegas en cuatro sucursales mide las dos cosas antes de cambiar las 34; cambiar todo de una vez apuesta el nombre de la marca."),
  "gb-c-prov-piloto": A("diagnostico", "El piloto no dio un sí ni un no: unas sucursales notaron la diferencia y otras no. Entender por qué cambia según el corte y la cocina vale más que forzar una conclusión con datos mezclados."),
  "gb-c-prov-resenas": A("crisis_com", "Las reseñas malas y los faltantes llegaron juntos a las 34 sucursales. Reconocer el cambio y corregirlo rápido protege la confianza de los clientes frecuentes; defender la decisión en público la vuelve más cara."),
  "gb-c-prov-contrato": A("batna", "El proveedor actual igualó precio a cambio de un contrato anual con anticipo. Saber qué otra opción real tienes, y cuánto cuesta amarrarte un año, decide si el descuento es buen trato o una dependencia nueva."),
  "kb-d2-nube": A("costo_oportunidad", "La factura de nube subió 40% y cada camino consume algo distinto: optimizar por etapas consume horas de ingeniería, migrar en un fin de semana arriesga la operación de los clientes y comprometerse tres años amarra la caja de la ronda."),
  "kb-c-nube-consumo": A("pareto", "Un tercio del gasto en nube viene de los reportes de un solo cliente. Encontrar el pequeño grupo de causas que explica la mayor parte del costo permite corregir sin recortar lo que sí sostiene al producto."),
  "kb-c-nube-caida": A("respuesta_incidentes", "La migración apresurada tiró el servicio en pleno cierre de mes de los clientes. Lo que se hace en las primeras horas, decir qué pasó, restablecer y explicar cómo no se repite, pesa más que la causa técnica."),
  "kb-c-nube-compromiso": A("consejo_gob", "El compromiso a tres años se firmó antes de que el consejo viera el plan de caja. Una decisión que amarra la pista de la empresa debe llegar al consejo con sus riesgos, no después."),
  "pm-d2-temporada": A("elasticidad", "Hay $64 M de mercancía de temporada sin vender. Bajar el precio por etapas mide cuánto responde el cliente antes de regalar margen; liquidar de golpe vacía el inventario y le enseña al cliente a esperar la rebaja."),
  "pm-c-temp-compras": A("escalar_mejora", "La rebaja por etapas mostró qué productos se mueven con poco descuento y cuáles no. Llevar ese aprendizaje a las compras de la siguiente temporada vale más que el margen recuperado esta vez."),
  "pm-c-temp-guerra": A("guerra_precios", "La liquidación agresiva provocó que la competencia respondiera con su propia rebaja. Una guerra de precios la gana quien aguanta más tiempo perdiendo margen, y casi siempre pierden los dos."),
  "pm-c-temp-bodega": A("hundidos", "Lo que se pagó por la mercancía ya no regresa. Si el proveedor cambió de línea, la pregunta útil es cuánto vale hoy lo guardado y cuánto cuesta seguir guardándolo, no cuánto costó comprarlo."),
  "vl-d2-diesel": A("juego_repetido", "El diésel subió y los clientes de Vértice renegocian cada año. Una fórmula de recargo pública y verificable reparte el costo con reglas claras; un aumento parejo sin explicación cobra hoy y se paga en la siguiente licitación."),
  "vl-c-diesel-formula": A("expectativas", "La fórmula funciona si los clientes la entienden y la pueden revisar. Explicar desde el principio cuándo sube y cuándo baja evita que cada ajuste se viva como una sorpresa."),
  "vl-c-diesel-licitacion": A("concentracion", "El aumento parejo llevó a un cliente grande a abrir licitación. Cuando una cuenta pesa una quinta parte de la venta, perderla cambia la empresa; conviene saber antes qué tan expuesta está."),
  "vl-c-diesel-telemetria": A("cultura_justa", "La telemetría muestra cómo maneja cada operador. Usarla para enseñar y corregir mejora el consumo; usarla para exhibir y castigar convierte una herramienta de mejora en una de vigilancia."),
};

/** Banco de casos: un concepto por arquetipo (el texto del caso cambia por empresa; la idea no). */
export const ARCHETYPE_CONCEPTS: Record<string, CaseConcept> = {
  retiro: A("irreversible", "Con lotes sospechosos y sin confirmación, esperar protege la relación con los clientes si resulta falsa alarma; si es real, el daño a los consumidores no se deshace. Un retiro parcial con una segunda prueba es un punto intermedio."),
  cliente: A("batna", "El cliente grande pide condiciones que no te convienen. Ceder todo es negociar sin alternativa; sostenerte sin un plan B arriesga su volumen. Tu poder sale de los datos de lo que gana contigo y de tener lista otra salida."),
  incentivos: A("goodhart", "Las comisiones premiaban el volumen y la gente encontró atajos para cumplirlo. Separar a los responsables sin cambiar el esquema deja intacto lo que produjo la conducta."),
  ciberataque: A("respuesta_incidentes", "Pagar el rescate promete recuperar todo en horas, pero no lo garantiza y te marca como pagador. Operar en manual cuesta días; callar mientras investigas deja a clientes y equipo sin saber qué pasa."),
  expansion: A("premortem", "Entrar a otro mercado con todo y con financiamiento apuesta a que el plan funcione a la primera. Preguntar por qué fracasaría antes de lanzar convierte esos riesgos en lo que debe probar un piloto."),
  precio: A("elasticidad", "El costo subió. Subir todo sin aviso recupera margen rápido y sorprende a los clientes; absorberlo protege la relación y erosiona el margen; subir por etapas y explicarlo reduce la pérdida de clientes."),
  recorte: A("recorte_unico", "Los números no cierran con la plantilla actual. Ajustes pequeños cada mes evitan el golpe, pero mantienen a todos con miedo; no recortar apuesta todo a la venta; un solo ajuste suficiente y explicado permite volver a trabajar."),
  proveedor: A("proveedor_unico", "El proveedor que te surte está en problemas. Comprar de emergencia a cualquier precio salva la entrega de hoy; ayudarlo y calificar una segunda fuente reduce la dependencia hacia adelante."),
  apuesta: A("innovador", "El negocio nuevo puede competir con el actual. Probarlo dentro del área existente lo expone a que el negocio que paga las cuentas lo frene; separarlo con presupuesto limitado le da espacio sin arriesgar el núcleo."),
  error: A("cultura_justa", "El error vino de una persona cansada en un proceso sin control. Despedirla da una consecuencia visible, pero deja el proceso igual; revisar sin culpables corrige la causa y hace que el siguiente error se reporte."),
  guerra: A("guerra_precios", "El competidor bajó su precio. Igualarlo en toda la línea invita a otra baja; no moverte acepta perder clientes; responder solo donde te atacan y reforzar tu diferencia limita el daño."),
  verde: A("seguridad_psicologica", "Un proyecto reportado en verde estaba en rojo. Si a quien avisa lo mandas a la línea de mando, o exhibes al responsable ante el comité, la próxima vez nadie avisará. Agradecer y ofrecer ayuda hace que los reportes digan la verdad."),
  trimestre: A("cortoplacismo", "Aplazar mantenimiento y capacitación llega al número de este trimestre y crea costos en los siguientes. Presentar el número real con su explicación le pide al consejo que te mida por el largo plazo."),
  incidente: A("cultura_justa", "El incidente se hizo público. Despedir a la persona da una señal rápida, pero si el problema era la regla que siguió, volverá a pasar con otra persona. Dar la cara y revisar la regla atiende la causa."),
  salarios: A("equidad", "Los sueldos tienen diferencias que no se explican con criterios. Un bono solo para los mejores profundiza la sensación de injusticia; subir el piso por etapas y publicar los criterios la corrige con un costo manejable."),
  meta: A("goodhart", "Para llegar a la fecha comprometida, el equipo tomó un atajo. Mantener la fecha sin preguntar cómo se cumplirá empuja más atajos; detenerlo y renegociar protege la calidad y a quien avisó."),
  foco: A("pareto", "Pocos productos hacen la mayor parte del dinero. No quitar nada conserva ventas pequeñas con toda su complejidad; quitar solo lo que pierde evita la discusión estratégica; quedarte con lo que gana y te distingue concentra recursos."),
  adaptativo: A("adaptativo", "Dos áreas no se ponen de acuerdo y te piden que decidas. Decidir tú resuelve hoy, pero el conflicto regresará; darles datos y un plazo para una propuesta conjunta las obliga a cambiar cómo trabajan juntas."),
};

/** Concepto y aplicación de un asunto (casos propios o banco). `undefined` si el caso aún no tiene concepto asignado. */
export function caseConceptOf(itemId: string): (CaseConcept & { def: Concept }) | undefined {
  const cc = isBankId(itemId) ? ARCHETYPE_CONCEPTS[bankArchetypeOf(itemId) ?? ""] : CASE_CONCEPTS[itemId];
  const def = cc && CONCEPTS[cc.concept];
  return cc && def ? { ...cc, def } : undefined;
}
