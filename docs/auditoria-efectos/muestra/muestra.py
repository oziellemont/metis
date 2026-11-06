# Muestra editorial de la fase C: antes y despues de 12 asuntos fijos y 2 arquetipos del banco.
# Solo propuesta: no cambia ningun archivo de contenido. Genera muestra-editorial.md.
# Convencion de puntos (propuesta, seccion 5 del documento):
#   1 punto de Caja   = 5 % de las salidas de un mes de la empresa
#   1 punto de Margen = 0.5 puntos porcentuales de margen operativo anual (0.5 % de las ventas del ano)
#   Se redondea al entero; si el resultado es 0, el indicador no se mueve (materialidad).
import math, os

ESC = {  # ventas anuales (M) y salidas mensuales (M), de business/profiles.ts, perfil establecida
    "cumbre": (410, 32.5), "forja": (2300, 173.4), "brasa": (980, 77.9),
    "kubit": (300, 24.3), "puntomadero": (2400, 199.2), "vertice": (1800, 169.3),
}
NOMBRE = {"cumbre": "Botanas Cumbre", "forja": "Forja Norte", "brasa": "Grupo Brasa", "kubit": "Kubit",
          "puntomadero": "Punto Madero", "vertice": "Vertice Logistica"}
K = ["caja", "margen", "equipo", "clientes", "consejo"]

def rnd(x):
    return int(math.copysign(math.floor(abs(x) + 0.5), x))

def pc(co, m):  # millones de caja -> puntos
    return rnd(m / (ESC[co][1] * 0.05))

def pm(co, m):  # millones al ano de resultado -> puntos
    return rnd(m / (ESC[co][0] * 0.005))

def fmt(e):
    s = ", ".join(f"{k} {'+' if v > 0 else ''}{v}" for k in K for v in [e.get(k, 0)] if v)
    return s or "sin movimiento"

def tot(e, k):
    return e.get(k, 0)

# Cada opcion: antes (efectos actuales v8), y despues: inm (al decidir), dif (cuando ocurre: texto, efectos),
# pend (quien, que, p, yes, no), hechos (montos con fuente), explica (lo que lee el jugador).
C = []

def caso(co, id_, titulo, hechos, opciones, vence, notas, evento=None):
    C.append(dict(co=co, id=id_, titulo=titulo, hechos=hechos, opciones=opciones, vence=vence, notas=notas, evento=evento))

def op(letra, texto, antes, inm=None, dif=None, pend=None, explica="", score=None):
    return dict(letra=letra, texto=texto, antes=antes, inm=inm or {}, dif=dif, pend=pend, explica=explica, score=score)

# ---------------------------------------------------------------- Cumbre
caso("cumbre", "d2-supernorte", "SuperNorte pide 4 puntos de descuento y pagar a 90 dias",
     ["Venta a SuperNorte: $127 M al ano (31 % de la venta). Dato del caso.",
      "4 puntos de descuento: -$5.1 M al ano de margen. Dato del caso. Equivale a Margen %d. Es el 19 %% del EBITDA anual de Cumbre (aprox. $26.7 M): queda dentro de la autoridad del director." % pm("cumbre", -5.1),
      "Pasar de 60 a 90 dias: $10 M mas de capital de trabajo. Dato del caso. Equivale a Caja %d." % pc("cumbre", -10),
      "Si SuperNorte retira uno de los dos frentes: estimacion editorial de -$25 M de venta al ano con 38 %% de margen bruto = -$9.5 M. Equivale a Margen %d. Requiere validacion." % pm("cumbre", -9.5)],
     [op("a", "Aceptar todo", {"clientes": 4, "margen": -8, "caja": -6},
         inm={"margen": pm("cumbre", -5.1)},
         dif=("Primer vencimiento a 90 dias (mes siguiente)", {"caja": pc("cumbre", -10)}),
         explica="Firmas el anexo: el descuento empieza a contar desde hoy (-$5.1 M al ano). Los $10 M de capital de trabajo salen cuando las primeras facturas ya no se cobran a 60 dias. Conservas la cuenta, pero no ganas clientes por eso."),
      op("b", "Reunion con el dato de rotacion; 1.5 puntos atados a volumen", {"clientes": 2, "consejo": 3, "margen": -2, "caja": -1},
         pend=dict(who="Sofia (SuperNorte)", what="Que acepte 1.5 puntos atados a volumen y 60 dias", p=0.6, days=2,
                   yes=("Acepta: firmas 1.5 puntos sobre $127 M (-$1.9 M al ano).", {"margen": pm("cumbre", -1.9)}),
                   no=("No acepta y regresa con una contraoferta: la negociacion sigue abierta.", {})),
         explica="Una reunion no mueve dinero. Si Sofia acepta, el costo es 1.5 puntos en lugar de 4. El consejo no se entera de esta negociacion, por eso no se mueve."),
      op("c", "Responder firme y amenazar con sacar producto", {"margen": 3, "clientes": -8, "consejo": -2},
         pend=dict(who="SuperNorte", what="Que conserve los dos frentes sin descuento", p=0.5, days=2,
                   yes=("Los conserva: tu rotacion le conviene.", {"clientes": -1}),
                   no=("Retira un frente: -$25 M de venta al ano (estimacion).", {"margen": pm("cumbre", -9.5), "clientes": -4})),
         explica="Sostener el precio no mejora el margen: evita una perdida. Por eso el Margen no sube. Lo que si cambia es el riesgo de perder un frente de anaquel."),
      ],
     ("Vence: se aplican las condiciones", {"margen": -9, "caja": -8, "consejo": -4},
      {"margen": pm("cumbre", -5.1)}, ("Primer vencimiento a 90 dias", {"caja": pc("cumbre", -10)}),
      "Igual que aceptar: se aplican los mismos hechos. El Consejo no se mueve porque nadie le informo; el castigo extra de -4 no tenia causa."),
     ["El vencimiento hoy castiga mas que aceptar (-21 contra -10 netos) sin un hecho adicional.",
      "La opcion b sube Consejo +3 sin que el consejo participe.",
      "La opcion c sube Margen +3 por no conceder, lo que no es un ingreso."])

caso("cumbre", "d4-sindicato", "Revision salarial: el sindicato pide 9 %, el presupuesto aguanta 5 %",
     ["Cada punto arriba del presupuesto cuesta $1.3 M al ano. Dato del caso.",
      "Dar 9 %%: 4 puntos arriba = -$5.2 M al ano. Equivale a Margen %d." % pm("cumbre", -5.2),
      "Dar 4.5 %%: 0.5 puntos abajo = +$0.65 M al ano. Equivale a Margen %d (no material)." % pm("cumbre", 0.65),
      "Merma 4.8 %% contra 2.5 %% de la industria. Bajar a 3 %% ahorra aprox. $4.6 M al ano sobre el costo de produccion (estimacion editorial); el bono de hasta 4 %% cuesta aprox. $2.3 M. Neto +$2.3 M = Margen %d, solo cuando se mida." % pm("cumbre", 2.3),
      "Un paro de dos dias: contribucion perdida aprox. $0.9 M (estimacion). Equivale a Caja %d." % pc("cumbre", -0.9)],
     [op("a", "5 % fijo y bono de hasta 4 % si baja la merma", {"equipo": 5, "margen": 2, "caja": -3},
         inm={"equipo": 3},
         pend=dict(who="Asamblea del sindicato", what="Que acepte 5 % mas bono por merma", p=0.7, days=2,
                   yes=("La asamblea acepta. El bono se paga al cierre del trimestre si la merma baja.", {"equipo": 1}),
                   no=("La asamblea pide mas: vuelves a la mesa.", {"equipo": -2})),
         dif=("Cierre del trimestre, si la merma baja a 3 % (pronostico)", {"margen": pm("cumbre", 2.3)}),
         explica="El 5 % ya estaba en el presupuesto: no cambia el margen. El bono solo se paga si la merma baja; por eso el ahorro y el bono se registran juntos al medirlos, no hoy."),
      op("b", "Dar 9 %", {"equipo": 8, "margen": -7, "consejo": -4},
         inm={"margen": pm("cumbre", -5.2), "equipo": 5},
         dif=("Reporte mensual al consejo: desviacion del presupuesto sin aprobacion", {"consejo": -2}),
         explica="Son $5.2 M al ano sobre lo presupuestado. El consejo lo ve en el reporte del mes y te pide explicar una desviacion que no autorizo."),
      op("c", "4.5 % como ultima oferta", {"margen": 3, "caja": 1, "equipo": -8, "consejo": -1},
         inm={"equipo": -5},
         pend=dict(who="Asamblea del sindicato", what="Que no vaya a paro", p=0.7, days=2,
                   yes=("No hay paro, pero la relacion queda tensa.", {}),
                   no=("Paro de dos dias: entregas tarde a SuperNorte.", {"caja": pc("cumbre", -0.9), "clientes": -2, "equipo": -3})),
         explica="Ahorrar medio punto contra el presupuesto ($0.65 M) no es material: el Margen no se mueve. El riesgo real es el paro."),
      ],
     ("Vence: el sindicato se levanta de la mesa", {"equipo": -9, "consejo": -3}, {"equipo": -6}, None,
      "La mesa rota es un hecho para el Equipo. El Consejo solo se mueve si hay paro y se entera."),
     ["Margen +3 y Caja +1 por ofrecer 4.5 % no tienen un monto material detras.",
      "Caja -3 en la opcion a no tiene un pago inmediato: el bono es condicional y trimestral."])

# ---------------------------------------------------------------- Forja
caso("forja", "fn-d2-precio", "Aurora pide 5 % de reduccion de precio",
     ["Venta anual a Aurora: $1,650 M (72 % de la venta). Dato del caso.",
      "Dar 5 %%: -$80 M al ano. Dato del caso. Equivale a Margen %d." % pm("forja", -80),
      "$80 M es el 30 % del EBITDA anual (aprox. $265 M): supera el 20 % y, por la regla de autoridad propuesta, requiere al consejo.",
      "Clausula de acero: si Aurora la acepta, estimacion editorial de +$18 M al ano. Equivale a Margen %d. Requiere validacion." % pm("forja", 18),
      "El 2 %% adicional cuesta $33 M al ano. Equivale a Margen %d." % pm("forja", -33)],
     [op("a", "Aceptar el 5 % completo", {"clientes": 5, "margen": -8, "consejo": -3},
         inm={"margen": pm("forja", -80), "consejo": -2},
         explica="Concedes $80 M al ano. Es una decision de ese tamano tomada sin el fondo: el Consejo baja por eso, no por el numero. La plataforma 2028 no esta prometida, por eso Clientes no sube."),
      op("b", "3 % contractual e invocar la clausula de acero", {"margen": 3, "consejo": 2, "clientes": -5},
         inm={"clientes": -1},
         pend=dict(who="Greg (Aurora)", what="Que acepte aplicar el indice de acero hacia adelante", p=0.4, days=3,
                   yes=("Aurora acepta el indice: recuperas parte del alza del acero.", {"margen": pm("forja", 18)}),
                   no=("Aurora no lo acepta y te baja en su evaluacion de proveedores.", {"clientes": -2})),
         explica="El 3 % ya estaba en el contrato y en el plan: no cambia el margen. Clientes baja un punto porque Greg te lo dijo por escrito. El beneficio del acero solo cuenta si Aurora lo acepta."),
      op("c", "3 % y taller de rediseno con sus ingenieros", {"clientes": 2, "margen": -2, "equipo": -2, "caja": -1, "consejo": 1},
         inm={"equipo": -1},
         pend=dict(who="Ingenieros de Aurora y Forja", what="Que el taller encuentre el 2 % en ahorros", p=0.6, days=4,
                   yes=("El taller encuentra ahorros: el 2 % se cubre con el rediseno.", {"clientes": 1}),
                   no=("No aparecen los ahorros y Aurora aplica el 2 %.", {"margen": pm("forja", -33)})),
         explica="Hoy solo cuesta horas de ingenieria. El 2 % se cobra o no segun lo que encuentre el taller."),
      ],
     ("Vence: Aurora aplica el 5 %", {"margen": -8, "clientes": -1, "consejo": -4},
      {"margen": pm("forja", -80), "consejo": -2}, None,
      "Mismo hecho que aceptar: $80 M al ano sin pasar por el fondo."),
     ["La opcion c mueve los cinco indicadores; ninguno tiene un hecho inmediato salvo las horas de ingenieria.",
      "Margen -8 en la autopartera y en el software (Kubit) por la misma opcion, con montos de $80 M y $10 M."])

caso("forja", "fn-d6-denuncia", "Tres denuncias de acoso contra el gerente del tercer turno",
     ["El caso no trae montos. Propuesta: agregar dos renglones de datos.",
      "Investigacion externa: aprox. $1.5 M (propuesta). En Forja equivale a Caja %d: no material." % pc("forja", -1.5),
      "Liquidacion sin investigacion y posible demanda: aprox. $3 M (propuesta). Equivale a Caja %d: no material." % pc("forja", -3),
      "En una empresa de $2,300 M el impacto real de este caso es legal y de cultura, no de dinero."],
     [op("a", "Suspender con goce de sueldo, investigacion externa", {"equipo": 4, "margen": -2, "consejo": 1},
         inm={"equipo": 3},
         explica="Proteges a quienes denunciaron y la linea de denuncia funciona: eso es lo que mueve al Equipo. El costo de la firma externa no es material para Forja. El comite de auditoria recibe el aviso como marca el protocolo; no es un merito ante el consejo."),
      op("b", "Que siga y mover de turno a quienes denunciaron", {"margen": 1, "equipo": -6, "consejo": -2},
         inm={"equipo": -5},
         pend=dict(who="Operadora que denuncio", what="Que no presente queja ante la autoridad laboral", p=0.5, days=3,
                   yes=("No presenta queja, pero en la planta ya se sabe quien se movio.", {}),
                   no=("Presenta queja formal: el fondo se entera de como se manejo.", {"consejo": -3})),
         explica="Que el turno siga produciendo es lo que ya pasaba: no suma margen. El Consejo se mueve solo si el caso sale de la empresa."),
      op("c", "Despedirlo de inmediato", {"equipo": 3, "caja": -3, "consejo": -3},
         inm={"equipo": 2},
         pend=dict(who="Octavio Saucedo", what="Que no demande por despido sin investigacion", p=0.5, days=4,
                   yes=("No demanda.", {}),
                   no=("Demanda y el fondo pregunta por que no hubo investigacion.", {"consejo": -2})),
         explica="La liquidacion y una posible demanda no son materiales para Forja. Lo que pesa es el debido proceso."),
      ],
     ("Vence: una operadora renuncia", {"equipo": -6, "consejo": -2}, {"equipo": -6}, None,
      "La renuncia es un hecho. El consejo no se entera."),
     ["Caja -3 en la opcion c sin monto en el caso.",
      "Mismo vector exacto en Vertice (vl-d6-denuncia) y en Kubit."])

# ---------------------------------------------------------------- Brasa
caso("brasa", "gb-d3-brote", "Brote de intoxicacion en Andares",
     ["Venta diaria de Andares: $110 mil. Dato del caso. Una semana cerrada: $0.77 M.",
      "Gastos medicos y revision de las 34 cocinas: aprox. $0.8 M (propuesta de dato).",
      "Total de la opcion a: aprox. $1.5 M. Equivale a Caja %d: no material para un grupo de $980 M." % pc("brasa", -1.5),
      "El brote ya ocurrio y el video ya tiene 400 mil vistas antes de que decidas: es un efecto del hecho, no de tu opcion."],
     [op("a", "Cerrar hoy, disculpa con tu nombre, gastos medicos, revision de 34 cocinas", {"caja": -4, "margen": -2, "clientes": 3, "equipo": 1, "consejo": 1},
         inm={"clientes": 2},
         explica="El dinero no es material para el grupo. Lo que cambia es la conversacion en redes: la disculpa con nombre recupera parte de lo perdido. Don Ignacio lo aprueba en la respuesta, por eso la familia no se mueve."),
      op("b", "Seguir abiertos sin la salsa y comunicado de marca", {"caja": 1, "clientes": -6, "consejo": -2},
         inm={"clientes": -3},
         pend=dict(who="Sanidad", what="Que no clausure el local en su visita", p=0.5, days=1,
                   yes=("Sanidad no clausura.", {}),
                   no=("Sanidad clausura Andares en publico.", {"clientes": -2, "consejo": -2})),
         explica="El video llega a 1.2 millones (dato de la respuesta): eso baja Comensales. No gastar hoy no es un ingreso, por eso la Caja no sube."),
      op("c", "Cerrar 48 horas, cooperar con Sanidad, sin declaraciones", {"caja": -2, "clientes": -3, "consejo": 1},
         inm={"clientes": -1},
         explica="Dos dias cerrados no son materiales. El silencio en redes cuesta un punto de Comensales."),
      ],
     ("Vence: Sanidad clausura el local", {"clientes": -8, "caja": -3, "consejo": -4}, {"clientes": -4, "consejo": -2}, None,
      "Una clausura publica es un hecho de gobierno para la familia. El dinero sigue sin ser material."),
     ["Caja -4 en a y Caja -3 al vencer son 5 y 4 veces mas de lo que cuesta realmente.",
      "Propuesta: el brote aplica Comensales -3 al llegar (efecto del hecho), elijas lo que elijas."],
     evento={"clientes": -3})

caso("brasa", "gb-d2-menu", "Ingenieria de menu: 72 platillos y merma de 7.5 %",
     ["Merma de cocina 7.5 % contra meta de 4 %. Dato del caso.",
      "Quitar 18 platillos de baja venta: baja la merma aprox. 2 puntos sobre $323 M de insumos = +$6.5 M al ano (estimacion editorial). Equivale a Margen %d, al cierre del mes, cuando se mida." % pm("brasa", 6.5),
      "Subir 6 %% la arrachera: +$4.7 M al ano si los comensales lo aceptan (estimacion). Equivale a Margen %d." % pm("brasa", 4.7),
      "Menu nuevo completo: rediseno, carta y capacitacion aprox. $3 M (propuesta de dato). Equivale a Caja %d." % pc("brasa", -3),
      "La arrachera es el platillo con el que Don Ignacio abrio: tocarla es un tema de familia (hecho del caso)."],
     [op("a", "Quitar los 18, redisenar y subir 6 % la arrachera", {"margen": 5, "equipo": 2, "clientes": -2, "consejo": -2},
         inm={"equipo": 1, "consejo": -1},
         dif=("Cierre del mes: merma medida", {"margen": pm("brasa", 6.5)}),
         pend=dict(who="Comensales", what="Que acepten la arrachera redisenada", p=0.6, days=3,
                   yes=("La arrachera se sigue pidiendo igual.", {"margen": pm("brasa", 4.7)}),
                   no=("Baja la venta de la arrachera.", {"clientes": -1})),
         explica="La cocina trabaja mejor desde hoy. El ahorro de merma se registra cuando se mide, al cierre. Don Ignacio no fue consultado sobre su platillo."),
      op("b", "Quitar los 18 y dejar la arrachera", {"margen": 2, "equipo": 2, "consejo": 1, "clientes": -1},
         inm={"equipo": 1},
         dif=("Cierre del mes: merma medida", {"margen": pm("brasa", 6.5)}),
         explica="Los platillos que se quitan casi no se venden: Comensales no se mueve. El ahorro llega al medir la merma."),
      op("c", "Menu nuevo de 40 platillos en 8 semanas", {"caja": -4, "clientes": -3, "equipo": -3, "margen": 3, "consejo": 1},
         inm={"caja": pc("brasa", -3), "equipo": -2},
         explica="Pagas el rediseno y la capacitacion. El nuevo menu no existe todavia: su efecto en margen y comensales se registra cuando se lance."),
      ],
     ("Vence: se queda el menu de 72", {"margen": -2, "equipo": -1}, {}, None,
      "No pasa nada nuevo: la merma ya existia. Dejar pasar una mejora no se castiga; simplemente no se obtiene."),
     ["Margen +5 inmediato por un ahorro que tarda semanas en medirse.",
      "La opcion c sube Margen +3 por un menu que no existe todavia."])

# ---------------------------------------------------------------- Kubit
caso("kubit", "kb-d2-altamar", "Altamar pide 15 % de descuento y tres desarrollos",
     ["Ingreso anual de Altamar: $68 M (22 % del total). Dato del caso.",
      "15 %%: -$10.2 M al ano. Equivale a Margen %d." % pm("kubit", -10.2),
      "$10.2 M es casi todo el EBITDA anual de Kubit (aprox. $11 M): supera el 20 % del margen operativo anual y requiere al consejo.",
      "Tres desarrollos: 5 ingenieros por 4 meses = aprox. $1.2 M (calculo con el costo por persona del perfil). Equivale a Caja %d." % pc("kubit", -1.2),
      "Clausula de inflacion: +4.5 %% sobre $68 M = +$3.1 M al ano. Equivale a Margen %d." % pm("kubit", 3.1)],
     [op("a", "Aceptar todo", {"clientes": 5, "margen": -8, "consejo": -3},
         inm={"margen": pm("kubit", -10.2), "caja": pc("kubit", -1.2), "clientes": 1, "consejo": -2},
         explica="Renuevas (Clientes +1 por el contrato firmado), pero cedes casi todo tu EBITDA del ano sin pasar por el consejo."),
      op("b", "Precio de lista con ajuste por inflacion", {"margen": 3, "consejo": 2, "clientes": -5},
         pend=dict(who="Hernan (Altamar)", what="Que renueve con el ajuste por inflacion", p=0.5, days=3,
                   yes=("Renueva con el ajuste.", {"margen": pm("kubit", 3.1)}),
                   no=("Abre un concurso con otros proveedores.", {"clientes": -3})),
         explica="Hoy no cambia nada: el beneficio y el riesgo dependen de la respuesta de Hernan."),
      op("c", "Precio igual e integracion con ERP para todos, piloto en tres empresas", {"clientes": 2, "margen": -2, "equipo": -2, "caja": -1, "consejo": 1},
         inm={"caja": pc("kubit", -1.2), "equipo": -1},
         pend=dict(who="Hernan (Altamar)", what="Que acepte el piloto en tres empresas mas", p=0.6, days=3,
                   yes=("Tres empresas mas del grupo entran al piloto.", {"clientes": 2}),
                   no=("Renueva sin piloto.", {})),
         explica="Pagas la integracion (que sirve a todos) y mueves la hoja de ruta. El piloto suma solo si Hernan lo acepta."),
      ],
     ("Vence: Altamar evalua otras opciones", {"clientes": -6, "consejo": -3}, {"clientes": -3}, None,
      "Hernan abre el concurso: la cuenta queda en riesgo. El consejo no se entera."),
     ["Mismo vector que Forja, Punto Madero y Vertice en las tres opciones.",
      "Aqui el 15 % equivale a casi todo el EBITDA del ano; en Forja el 5 % es el 30 %. El vector actual es igual."])

caso("kubit", "kb-c-caida", "Seis horas sin plataforma en cierre de mes",
     ["Creditos: $2.1 M. Dato del caso. Equivale a Caja %d y Margen %d: es un solo hecho (nota de credito) con dos lecturas: menos ingreso y menos cobro." % (pc("kubit", -2.1), pm("kubit", -2.1)),
      "Inconsistencia del caso: el dato dice \u00abCreditos por contrato\u00bb, pero la opcion c dice que el contrato garantiza 99 % y se cumplio 99.2 %. Si se cumplio, no se deben creditos. Propuesta: renombrar a \u00abCreditos de buena fe propuestos\u00bb.",
      "Creditos solo a quien los pida: aprox. 40 %% = $0.84 M (estimacion). Equivale a Caja %d y Margen %d." % (pc("kubit", -0.84), pm("kubit", -0.84)),
      "La caida ya ocurrio: 310 clientes sin operar y 1,400 solicitudes. Es un efecto del hecho."],
     [op("a", "Dar la cara, creditos sin pedirlos, la revision regresa", {"caja": -3, "clientes": 3, "equipo": 3, "margen": -2},
         inm={"caja": pc("kubit", -2.1), "margen": pm("kubit", -2.1), "clientes": 2, "equipo": 2},
         explica="Una sola nota de credito de $2.1 M: baja el ingreso del mes y lo que cobras. Los clientes reciben la llamada; el equipo recupera la revision."),
      op("b", "Contener sin ruido, creditos a quien los pida", {"margen": 1, "clientes": -2, "equipo": -2},
         inm={"caja": pc("kubit", -0.84), "margen": pm("kubit", -0.84), "clientes": -1, "equipo": -1},
         explica="Pagas menos creditos, pero pagas. Antes esta opcion subia el Margen en plena crisis, sin un hecho que lo explique."),
      op("c", "Defender los datos: se cumplio el 99 %, sin creditos", {"margen": 2, "caja": 1, "clientes": -7, "consejo": -2},
         inm={"clientes": -4},
         explica="No pagar algo que no se debe no es un ingreso: Caja y Margen no suben. Altamar pide propuesta a la competencia (dato de la respuesta)."),
      ],
     ("Vence: Altamar pide propuesta a otro proveedor", {"clientes": -7, "caja": -3}, {"clientes": -4}, None,
      "Sin decision no se pagan creditos: la Caja no se mueve. La cuenta queda en riesgo."),
     ["Margen +2 y Caja +1 en la opcion c por no conceder.",
      "Dato del caso contradictorio con la opcion c."],
     evento={"clientes": -2})

# ---------------------------------------------------------------- Punto Madero
caso("puntomadero", "pm-d2-penasco", "Penasco pide 12 %, 90 dias de credito y entrega gratis",
     ["Compras anuales de Penasco: $430 M (18 % del total). Dato del caso.",
      "12 %%: -$52 M de margen al ano. Dato del caso. Equivale a Margen %d." % pm("puntomadero", -52),
      "Entrega gratis en obra: aprox. $6.5 M al ano (propuesta de dato). Equivale a Margen %d." % pm("puntomadero", -6.5),
      "Credito a 90 dias: $70 M mas de caja atrapada. Dato del caso. Equivale a Caja %d." % pc("puntomadero", -70),
      "El EBITDA anual del perfil es aprox. $46 M: lo que pide Penasco es mayor que toda la utilidad operativa. Requiere al consejo.",
      "Si Penasco mueve 20 %% de sus compras a Mundo Casa: -$86 M de venta con 31 %% de margen bruto = -$26.7 M (estimacion). Equivale a Margen %d." % pm("puntomadero", -26.7)],
     [op("a", "Aceptar todo", {"clientes": 5, "margen": -8, "consejo": -3},
         inm={"margen": pm("puntomadero", -58.5), "clientes": 1, "consejo": -2},
         dif=("Primeras facturas a 90 dias (mes siguiente)", {"caja": pc("puntomadero", -70)}),
         explica="Cedes mas de lo que la empresa gana al ano, sin el consejo. La caja atrapada sale cuando las primeras facturas dejan de cobrarse a 30 dias."),
      op("b", "Precio de lista con inflacion, 30 dias, entrega aparte", {"margen": 3, "consejo": 2, "clientes": -5},
         pend=dict(who="Federico (Penasco)", what="Que acepte las condiciones", p=0.5, days=3,
                   yes=("Acepta el ajuste.", {"margen": pm("puntomadero", 19.4)}),
                   no=("Mueve parte de sus compras a Mundo Casa.", {"margen": pm("puntomadero", -26.7), "clientes": -3})),
         explica="Hoy no cambia nada. Todo depende de Federico."),
      op("c", "Entrega programada para todos y 60 dias en tres desarrollos de prueba", {"clientes": 2, "margen": -2, "equipo": -2, "caja": -1, "consejo": 1},
         inm={"caja": pc("puntomadero", -5), "equipo": -1},
         pend=dict(who="Federico (Penasco)", what="Que acepte el piloto de entrega programada", p=0.6, days=3,
                   yes=("Acepta el piloto en tres desarrollos.", {"clientes": 2}),
                   no=("Acepta solo el precio.", {})),
         explica="El credito a 60 dias en tres desarrollos atrapa aprox. $5 M. El servicio nuevo suma clientes solo si se acepta."),
      ],
     ("Vence: Penasco evalua otras opciones", {"clientes": -6, "consejo": -3}, {"clientes": -3}, None,
      "La cuenta queda en riesgo. El consejo no se entera."),
     ["Vector identico a Forja y Kubit con montos de $52 M, $80 M y $10 M.",
      "La opcion c mueve los cinco indicadores."])

caso("puntomadero", "pm-c-temp-compras", "Como comprar la proxima temporada",
     ["El caso no trae montos. Propuesta de dato: pedido de temporada de aprox. $40 M.",
      "Comprar 30 %% menos: $12 M menos de compra, que se dejan de pagar al cerrar el pedido (en 5 semanas). Equivale a Caja %d." % pc("puntomadero", 12),
      "Sistema de pronostico: aprox. $1.5 M (propuesta). Equivale a Caja %d: no material." % pc("puntomadero", -1.5),
      "El pedido se cierra en 5 semanas y se vende en la temporada siguiente: nada de esto ocurre al decidir."],
     [op("a", "Que cada gerente proponga su pedido", {"margen": 1, "equipo": 1, "clientes": 1, "consejo": -1, "caja": -1},
         dif=("Al vender la temporada (pronostico: menos sobrante)", {"margen": 1}),
         explica="Es un cambio de proceso. Hoy no se mueve ningun indicador. Su efecto se registra cuando se vende la temporada."),
      op("b", "Comprar 30 % menos en todas las tiendas", {"caja": 3, "clientes": -2},
         dif=("Al cerrar el pedido (5 semanas) y al vender la temporada", {"caja": pc("puntomadero", 12), "clientes": -1}),
         explica="Pagas menos cuando se cierra el pedido, no hoy. Las tiendas que venden mas se quedan cortas en su mejor semana."),
      op("c", "Sistema de pronostico", {"margen": 1, "caja": -1, "equipo": -1},
         explica="El sistema necesita meses de datos (lo dice la respuesta): hoy no hay efecto material."),
      ],
     ("Vence: se compra como siempre", {"margen": -1}, {}, None, "No pasa nada nuevo: se repite la compra anterior."),
     ["Cinco indicadores de +-1 por una decision de proceso.",
      "Caja +3 por una compra que todavia no se hace."])

# ---------------------------------------------------------------- Vertice
caso("vertice", "vl-d2-diesel", "El diesel subio 12 % y los contratos no",
     ["Costo extra del diesel: $4 M al mes = $48 M al ano. Dato del caso. Equivale a Margen %d. Ocurre elijas lo que elijas: es un efecto del hecho." % pm("vertice", -48),
      "Formula indexada: recupera 70 %% en tres meses = +$33.6 M al ano. Equivale a Margen %d." % pm("vertice", 33.6),
      "Inconsistencia del caso: con el diesel en 38 %% del costo, bajar 6 %% el consumo ahorra aprox. $45 M al ano, casi todo el alza; la respuesta dice que \u00abno alcanza\u00bb. Hay que ajustar el dato (por ejemplo, -2 %% de consumo = Margen %d)." % pm("vertice", 15),
      "La subida general cobra desde el mes siguiente y la caja llega con 45 dias de cobro: la Caja sigue al cobro, no se suma a mano."],
     [op("a", "Formula publica de recargo por contrato", {"clientes": -1, "equipo": -1},
         pend=dict(who="Clientes con contrato por vencer", what="Que acepten la formula", p=0.75, days=3,
                   yes=("La mayoria acepta: se recupera el 70 % en tres meses.", {"margen": pm("vertice", 33.6)}),
                   no=("Solo la mitad acepta a la primera.", {"margen": pm("vertice", 16.8)})),
         explica="Proponer una formula no le quita clientes ni moral a nadie. El margen regresa conforme cada cliente acepta."),
      op("b", "Subir 8 % todas las tarifas con 15 dias de aviso", {"margen": 3, "caja": 1, "clientes": -3, "consejo": 1},
         dif=("Mes siguiente: entra la tarifa nueva", {"margen": pm("vertice", 48)}),
         pend=dict(who="Clientes grandes", what="Que no abran licitacion", p=0.5, days=3,
                   yes=("Nadie abre licitacion.", {}),
                   no=("Almena invita a Avante a cotizar.", {"clientes": -3})),
         explica="Recuperas todo el alza desde el mes siguiente; el efectivo llega cuando se cobra. En 1 de cada 2 casos un cliente grande abre licitacion (dato del caso)."),
      op("c", "Absorber y bajar consumo con telemetria", {"clientes": 1, "equipo": 1, "margen": -1, "caja": -1},
         inm={"caja": pc("vertice", -8)},
         dif=("Cierre del mes: consumo medido (con el dato corregido)", {"margen": pm("vertice", 15)}),
         pend=dict(who="Operadores", what="Que adopten el manejo eficiente", p=0.6, days=3,
                   yes=("La flota lo adopta.", {}),
                   no=("Los operadores lo resienten al principio.", {"equipo": -1})),
         explica="Pagas la telemetria (aprox. $8 M). El ahorro se registra al medir el consumo."),
      ],
     ("Vence: se absorbe el alza este mes", {"margen": -2, "caja": -1}, {}, None,
      "El alza ya se registró al llegar el asunto: no hay un segundo castigo."),
     ["Hoy el alza del diesel no se registra como hecho; solo se castiga si vence (-2 margen, -1 caja).",
      "Dato de consumo inconsistente con la respuesta del personaje."],
     evento={"margen": pm("vertice", -48)})

caso("vertice", "vl-s-almena-mas", "Almena pide 5 % mas y que absorbas 15 unidades",
     ["Margen de la cuenta despues del 10 %: 2.8 %; con 5 % más: negativo. Dato del caso.",
      "15 unidades nuevas: $60 M. Dato del caso. Equivale a Caja %d al pagarlas." % pc("vertice", -60),
      "Falta un dato: venta de los dos CEDIS. Con una estimacion de $120 M al ano, el 5 %% cuesta $6 M y la depreciacion de las unidades $12 M al ano: -$18 M = Margen %d." % pm("vertice", -18),
      "$60 M de inversion supera el 2 % de la venta anual: requiere al consejo."],
     [op("a", "Bono por cumplimiento en vez de descuento, unidades en arrendamiento", {"margen": 3, "clientes": -2, "consejo": 2},
         pend=dict(who="Ricardo (Almena)", what="Que acepte el esquema de bono", p=0.5, days=3,
                   yes=("Asigna los dos CEDIS con el esquema de bono.", {"clientes": 2}),
                   no=("Pide propuesta a Avante para los dos CEDIS.", {"clientes": -2})),
         explica="Hoy no hay ingreso nuevo: el bono se gana solo si cumples arriba de 97 %. Antes esta opcion sumaba Margen +3 sin un hecho."),
      op("b", "Aceptar el 5 % y comprar las 15 unidades", {"clientes": 4, "margen": -7, "caja": -2, "consejo": -3},
         inm={"clientes": 3, "margen": pm("vertice", -18), "consejo": -2},
         dif=("Pago de las unidades", {"caja": pc("vertice", -60)}),
         explica="Ganas los tres CEDIS con margen negativo. Las unidades se pagan al recibirlas: $60 M sin aprobacion del consejo."),
      op("c", "Ya dimos suficiente; si insiste, renunciamos al CEDIS", {"margen": 2, "clientes": -6, "consejo": -1, "caja": 1},
         pend=dict(who="Ricardo (Almena)", what="Que no le dé los CEDIS a Avante", p=0.4, days=3,
                   yes=("Ricardo retrocede.", {}),
                   no=("Avante opera los dos CEDIS nuevos.", {"clientes": -3})),
         explica="Una amenaza no genera dinero: Caja y Margen no suben. El riesgo es perder los CEDIS."),
      ],
     ("Vence: Ricardo pide propuesta a Avante", {"clientes": -4, "consejo": -1}, {"clientes": -2}, None,
      "La cuenta queda en riesgo. El consejo no se entera."),
     ["Margen +3 en a y +2 en c sin un ingreso detras.",
      "Falta el dato de venta de los CEDIS para medir el costo."])

# ---------------------------------------------------------------- Banco: retiro y cliente, por industria
RETIRO = [("cumbre", 6, "Retiro total: $6 M"), ("forja", 14, "Contencion: $14 M"), ("brasa", 1.8, "Tirar el producto: $1.8 M"),
          ("kubit", 0, "Apagar la funcion: sin monto (\u00abquejas y cancelaciones posibles\u00bb)"),
          ("puntomadero", 9, "Retiro y reembolso: $9 M"), ("vertice", 11, "Recuperar y destruir: $11 M")]
CLIENTE = [("cumbre", 4.5, "SuperNorte: $4.5 M al ano"), ("forja", 92, "Aurora: $92 M al ano"), ("brasa", 11, "App: $11 M al ano"),
           ("kubit", 7, "Altamar: $7 M al ano"), ("puntomadero", 12, "Procesador de pagos: $12 M al ano"), ("vertice", 19, "Farmacias del Valle: $19 M al ano")]

import re
ACC = {"ano": "año", "anos": "años", "dias": "días", "opcion": "opción", "Opcion": "Opción", "opciones": "opciones",
       "Ningun": "Ningún", "ningun": "ningún", "despues": "después", "Despues": "Después", "segun": "según",
       "estimacion": "estimación", "validacion": "validación", "negociacion": "negociación", "reunion": "reunión",
       "Reunion": "Reunión", "rotacion": "rotación", "Revision": "Revisión", "revision": "revisión", "decision": "decisión",
       "aprobacion": "aprobación", "produccion": "producción", "contribucion": "contribución", "Sofia": "Sofía",
       "Ultima": "Última", "ultima": "última", "mas": "más", "Mas": "Más", "si": "sí", "Si": "Sí", "mes": "mes",
       "reduccion": "reducción", "clausula": "cláusula", "Clausula": "Cláusula", "rediseno": "rediseño", "Rediseno": "Rediseño",
       "redisenar": "rediseñar", "redisenada": "rediseñada", "ingenieria": "ingeniería", "Ingenieria": "Ingeniería",
       "autopartera": "autopartera", "investigacion": "investigación", "Investigacion": "Investigación",
       "Liquidacion": "Liquidación", "liquidacion": "liquidación", "linea": "línea", "auditoria": "auditoría",
       "merito": "mérito", "autoridad": "autoridad", "Operadora": "Operadora", "intoxicacion": "intoxicación",
       "medicos": "médicos", "conversacion": "conversación", "publico": "público", "publica": "pública",
       "Publica": "Pública", "clausura": "clausura", "Clausura": "Clausura", "Ingenieria": "Ingeniería",
       "platillo": "platillo", "medicion": "medición", "integracion": "integración", "credito": "crédito",
       "Credito": "Crédito", "creditos": "créditos", "Creditos": "Créditos", "caida": "caída", "Caida": "Caída",
       "Inconsistencia": "Inconsistencia", "proposito": "propósito", "Penasco": "Peñasco", "Hernan": "Hernán",
       "proximo": "próximo", "proxima": "próxima", "Proxima": "Próxima", "pronostico": "pronóstico",
       "Pronostico": "Pronóstico", "diesel": "diésel", "formula": "fórmula", "Formula": "Fórmula", "telemetria": "telemetría",
       "licitacion": "licitación", "Vertice": "Vértice", "Logistica": "Logística", "inversion": "inversión",
       "depreciacion": "depreciación", "Kubit": "Kúbit", "detras": "detrás", "dificil": "difícil", "facil": "fácil",
       "periodo": "periodo", "senal": "señal", "tamano": "tamaño", "segun": "según", "tambien": "también",
       "accion": "acción", "Accion": "Acción", "economico": "económico", "economica": "económica", "minimo": "mínimo",
       "maximo": "máximo", "util": "útil", "indice": "índice", "Indice": "Índice", "limite": "límite", "unica": "única",
       "unico": "único", "Ricardo": "Ricardo", "presentacion": "presentación", "Problemas": "Problemas",
       "Comensales": "Comensales", "rapido": "rápido", "proceso": "proceso", "dinamica": "dinámica",
       "categoria": "categoría", "relacion": "relación", "situacion": "situación", "atencion": "atención",
       "aqui": "aquí", "Aqui": "Aquí", "ahi": "ahí", "asi": "así", "Asi": "Así", "estan": "están", "esta": "está",
       "sera": "será", "podra": "podrá", "tendra": "tendrá", "llegara": "llegará", "sabra": "sabrá", "dara": "dará",
       "segun": "según", "Ignacio": "Ignacio", "Consejo": "Consejo", "propuesta": "propuesta", "habra": "habrá",
       "tambien": "también", "Sanidad": "Sanidad", "codigo": "código", "Codigo": "Código", "metodo": "método",
       "practica": "práctica", "practico": "práctico", "logica": "lógica", "logico": "lógico", "numero": "número",
       "numeros": "números", "analisis": "análisis", "Analisis": "Análisis", "volumen": "volumen", "rubrica": "rúbrica", "dia": "día", "quien": "quien", "podria": "podría", "seria": "sería", "garantia": "garantía", "politica": "política", "categoria": "categoría", "Contencion": "Contención", "capacitacion": "capacitación", "desviacion": "desviación", "funcion": "función", "inflacion": "inflación", "seccion": "sección", "Funcion": "Función"}
# «esta» y «si» son ambiguas: solo se corrigen en frases conocidas.
AMBIG = {"esta", "si", "Si", "mas", "Mas"}
FRASES = [("si el ", "si el "), ("Si: ", "Sí: "), ("| Si", "| Sí"), (" mas ", " más "), (" mas.", " más."), ("Mas ", "Más "),
          ("si responde", "si responde"), ("esta opcion", "esta opción"), ("esta negociacion", "esta negociación")]

def acentos(t):
    def rep(m):
        w = m.group(0)
        if w in AMBIG:
            return w
        return ACC.get(w, w)
    t = re.sub(r"[A-Za-z]+", rep, t)
    for a, b in FRASES:
        t = t.replace(a, b)
    return t

def build():
    L = []
    L.append("# Muestra editorial \u00b7 antes y despues (propuesta para aprobacion)")
    L.append("")
    L.append("Doce asuntos fijos (dos por empresa, elegidos entre los P1) y dos arquetipos del banco (retiro y cliente) en las seis industrias. **No cambia ningun archivo de contenido.** Los puntos del \u00abdespues\u00bb salen de montos del propio caso con la escala de la seccion 5 de la propuesta; cuando el caso no trae el monto, se marca como propuesta de dato o estimacion editorial y requiere validacion.")
    L.append("")
    L.append("Escala propuesta: 1 punto de Caja = 5 % de las salidas de un mes; 1 punto de Margen = 0.5 puntos porcentuales de margen operativo anual. Si el redondeo da 0, el indicador no se mueve.")
    L.append("")
    L.append("| Empresa | 1 punto de Caja | 1 punto de Margen |")
    L.append("|---|---:|---:|")
    for co, (s, o) in ESC.items():
        L.append(f"| {NOMBRE[co]} | ${o*0.05:.2f} M de caja | ${s*0.005:.1f} M al ano |")
    L.append("")
    L.append("Tiempos: **al decidir** (lo que ocurre ese dia), **cuando ocurra** (un hecho con fecha: un pago, un cobro, una medicion, un reporte al consejo) y **si responde** (acuerdo pendiente con probabilidad, como en v8). Un pronostico se muestra al jugador como texto y no mueve indicadores hasta que ocurre.")
    L.append("")
    resumen = []
    for c in C:
        L.append(f"## {NOMBRE[c['co']]} \u00b7 `{c['id']}` \u00b7 {c['titulo']}")
        L.append("")
        L.append("**Hechos y montos**")
        L.append("")
        for h in c["hechos"]:
            L.append(f"- {h}")
        if c["evento"]:
            L.append(f"- Efecto del hecho al llegar el asunto (elijas lo que elijas): {fmt(c['evento'])}.")
        L.append("")
        L.append("**Problemas encontrados**")
        L.append("")
        for n in c["notas"]:
            L.append(f"- {n}")
        L.append("")
        L.append("| Opcion | Antes (v8, todo al decidir) | Despues: al decidir | Despues: cuando ocurra | Despues: si responde |")
        L.append("|---|---|---|---|---|")
        for o in c["opciones"]:
            dif = f"{o['dif'][0]}: {fmt(o['dif'][1])}" if o["dif"] else "\u2014"
            if o["pend"]:
                p = o["pend"]
                pen = f"{p['who']} \u00b7 {p['what']} (p {p['p']}, {p['days']} dias). Si: {fmt(p['yes'][1])}. No: {fmt(p['no'][1])}"
            else:
                pen = "\u2014"
            L.append(f"| **{o['letra']}** {o['texto']} | {fmt(o['antes'])} | {fmt(o['inm'])} | {dif} | {pen} |")
            # balance de caja esperado antes y despues
            ea = o["antes"]
            ed = dict(o["inm"])
            if o["dif"]:
                for k, v in o["dif"][1].items():
                    ed[k] = ed.get(k, 0) + v
            if o["pend"]:
                p = o["pend"]
                for k in K:
                    ed[k] = ed.get(k, 0) + p["p"] * p["yes"][1].get(k, 0) + (1 - p["p"]) * p["no"][1].get(k, 0)
            resumen.append((c["co"], c["id"], o["letra"], ea, ed))
        v = c["vence"]
        vd = f"{v[3][0]}: {fmt(v[3][1])}" if v[3] else "\u2014"
        L.append(f"| **vence** {v[0]} | {fmt(v[1])} | {fmt(v[2])} | {vd} | \u2014 |")
        L.append("")
        L.append("**Lo que lee el jugador (despues)**")
        L.append("")
        for o in c["opciones"]:
            L.append(f"- **{o['letra']}.** {o['explica']}")
        L.append(f"- **Vence.** {v[4]}")
        L.append("")
    # banco
    L.append("## Banco \u00b7 arquetipo `retiro` (opcion a: retiro preventivo)")
    L.append("")
    L.append("Hoy la opcion a cuesta lo mismo en las seis industrias: caja -6, margen -3, clientes +5, consejo +3. Con el monto que trae cada caso:")
    L.append("")
    L.append("| Empresa | Monto del caso | Antes | Despues: al decidir | Despues: si el laboratorio confirma |")
    L.append("|---|---|---|---|---|")
    for co, m, txt in RETIRO:
        d = {"caja": pc(co, -m)} if m else {}
        L.append(f"| {NOMBRE[co]} | {txt} | caja -6, margen -3, clientes +5, consejo +3 | {fmt(d)} | Confirma (p 0.5): clientes +3, consejo +2. No confirma: consejo -1 |")
    L.append("")
    L.append("El costo del retiro es un pago (Caja); no hay un segundo cargo a Margen salvo que el caso diga que se destruye inventario ya vendido. Clientes y consejo se mueven cuando se sabe si el problema era real: antes de eso, el retiro es una apuesta prudente, no un merito.")
    L.append("")
    L.append("## Banco \u00b7 arquetipo `cliente` (opcion b: aceptar lo que pide)")
    L.append("")
    L.append("Hoy cuesta margen -4, caja -2 y suma clientes +5 en las seis industrias.")
    L.append("")
    L.append("| Empresa | Costo anual del caso | Antes | Despues: al decidir |")
    L.append("|---|---|---|---|")
    for co, m, txt in CLIENTE:
        L.append(f"| {NOMBRE[co]} | {txt} | margen -4, caja -2, clientes +5 | {fmt({'margen': pm(co, -m), 'clientes': 1})} |")
    L.append("")
    L.append("El mismo \u00abaceptar\u00bb pesa 1 punto en Punto Madero y 8 en Forja porque el monto, relativo al tamano de cada empresa, es muy distinto. La Caja no se mueve si lo que se concede es precio (afecta el cobro de cada mes, que ya entra por el margen realizado; ver seccion 5).")
    L.append("")
    # resumen
    L.append("## Resumen de la muestra")
    L.append("")
    L.append("Suma de puntos esperados por indicador en las 36 opciones de los asuntos fijos (el \u00abdespues\u00bb pondera los acuerdos pendientes por su probabilidad).")
    L.append("")
    L.append("| Indicador | Antes | Despues | Opciones que lo mueven antes | Despues |")
    L.append("|---|---:|---:|---:|---:|")
    for k in K:
        a = sum(r[3].get(k, 0) for r in resumen)
        d = sum(r[4].get(k, 0) for r in resumen)
        na = sum(1 for r in resumen if r[3].get(k, 0))
        nd = sum(1 for r in resumen if abs(r[4].get(k, 0)) >= 0.5)
        L.append(f"| {k} | {a:+.0f} | {d:+.1f} | {na} | {nd} |")
    n4a = sum(1 for r in resumen if sum(1 for k in K if r[3].get(k, 0)) >= 4)
    n4d = sum(1 for r in resumen if sum(1 for k in K if abs(r[4].get(k, 0)) >= 0.5) >= 4)
    L.append("")
    L.append(f"Opciones que mueven 4 o 5 indicadores: antes {n4a}, despues {n4d}.")
    L.append("")
    out = os.path.join(os.path.dirname(__file__), "..", "muestra-editorial.md")
    open(out, "w").write(acentos("\n".join(L) + "\n"))
    print("ok", out, len(resumen))
    for k in K:
        print(k, sum(r[3].get(k, 0) for r in resumen), round(sum(r[4].get(k, 0) for r in resumen), 1))
    print(n4a, n4d)

build()
