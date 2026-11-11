# Acería: diagnóstico y propuesta de corrección

Documento para revisión de Oziel Leal Montemayor antes de tocar el motor. Todo lo que aquí se propone está calculado con un modelo independiente y reproducible (`modelo_propuesto.py`, en esta misma carpeta). Cualquier persona puede correrlo y obtener exactamente las mismas cifras (`resultados.txt` y `resultados_anio1.txt`).

Nada de lo publicado se apaga. Las partidas que ya existen siguen funcionando con la versión actual; la versión corregida entra como empresa nueva (ver sección 7).

---

## 1. Diagnóstico corto

Las dos acerías publicadas hoy **no son creíbles como acerías que venden varilla**. Son, en la práctica, **fundiciones pequeñas de inducción que cuelan palanquilla**, pero el juego les permite vender varilla corrugada sin tener laminador ni pagarle a nadie por laminar. Además:

1. **Le falta una etapa completa del proceso.** La varilla no sale del horno: sale de un tren de laminación. Hoy no existe ni laminador propio ni maquila con un tercero, así que el costo de convertir palanquilla en varilla (unos $2,100 a $2,350 por tonelada) simplemente no se cobra.
2. **La palanquilla está sobrevaluada.** Se vende a $15,660 por tonelada, casi lo mismo que la varilla ($15,900). En el mercado real la palanquilla vale unos $2,500 a $3,000 menos por tonelada que la varilla, precisamente porque no está laminada.
3. **La plantilla no corresponde al tamaño.** La empresa consolidada tiene 57 personas para unas 2,400 toneladas al mes. Una miniacería integrada de ese volumen opera con 140 a 180 personas: fusión a tres turnos, colada, laminación, patio de chatarra, mantenimiento, calidad, seguridad, logística y administración.
4. **No hay depreciación ni impuestos.** Los hornos de la plantilla inicial no se deprecian y el motor no calcula ISR ni PTU. Por eso la utilidad operativa sale igual al EBITDA y la caja crece demasiado rápido: la empresa chica pasa de $3.5 M a $15 M en un año, y la grande de $9 M a $66.5 M.
5. **No hay inventario ni ciclo de mercado.** En una acería el capital de trabajo pesa mucho (chatarra en patio, palanquilla en proceso, varilla en almacén), y el precio de la chatarra y del acero sube y baja. Hoy ambos son planos.
6. **Crecer con un turno extra domina a todo.** En la empresa chica, aceptar el cliente y abrir turno da $16.6 M de EBITDA en el año contra $11.2 M de no hacer nada, con más caja al final. No hay ninguna razón económica para quedarse estable, y eso es lo contrario de lo que queremos enseñar.
7. **Los casos de la consolidada son de autopartes con palabras cambiadas.** Aparecen Aurora Motors, PPAP, plataformas de SUV, andon y «coladas» tratadas como piezas. Un jugador del sector lo detecta en el primer minuto.

**Clasificación actual:** pequeña fundición de inducción. **Lo que proponemos:** que la empresa chica sea una **acería compacta** (funde y cuela palanquilla; lamina por maquila) y que la consolidada sea una **miniacería integrada** (fusión, colada continua, laminador propio y patio de chatarra).

---

## 2. Realismo de la operación

### 2.1 Etapas del proceso que deben existir

| Etapa | Qué pasa | Empresa chica (propuesta) | Consolidada (propuesta) |
|---|---|---|---|
| Patio de chatarra | Recibir, pesar, revisar radiación, cortar y clasificar | Compra a recolectores ya cortada | Patio propio en Saltillo con prensa-cizalla (35 % de su chatarra) |
| Fusión | Hornos de inducción funden la carga | 2 hornos, 13.5 t por turno cada uno, 2 turnos | 2 hornos grandes, 38 t por turno cada uno, 3 turnos |
| Afino y aleación | Ajustar carbono, manganeso, silicio; desoxidar | En el mismo horno (cuchara simple) | Horno cuchara |
| Colada | Vaciar el acero en moldes para formar palanquilla | Máquina de colada continua de 2 líneas | Colada continua de 3 líneas |
| Palanquilla | Barra cuadrada que se vende o se lamina | Se vende a relaminadoras y una parte se manda a laminar | Casi toda se lamina en casa |
| Recalentamiento y laminación | Recalentar la palanquilla y pasarla por rodillos hasta varilla | **Maquila** con un laminador de la zona ($2,100/t más $250/t de flete) | **Laminador propio** de 220 t/día ($680/t de costo variable) |
| Varilla terminada | Corte, atado, etiquetado, embarque | La entrega el laminador | Almacén y embarques propios |

### 2.2 Comparativo de las empresas

| Concepto | Chica hoy | Chica propuesta | Consolidada hoy | Consolidada propuesta |
|---|---|---|---|---|
| Nombre | Aceros Huasteca | Aceros Huasteca | Grupo Acerero Huasteca | Grupo Acerero Huasteca |
| Tipo real | Fundición pequeña | Acería compacta | Fundición mediana con 2 sedes | Miniacería integrada |
| Personas | 16 | 36 | 57 | 152 |
| Hornos | 2, un turno | 2, dos turnos | 5 (3 + 2), sin turnos completos | 2 grandes, tres turnos |
| Capacidad de fusión | 28 t/día | 54 t/día | 94 t/día | 228 t/día |
| Laminación | No existe | Maquila con tercero | No existe | Laminador propio 220 t/día |
| Patio de chatarra | No existe | No (compra cortada) | No existe | Sí, Saltillo |
| Venta | 24 t/día (varilla y palanquilla) | 42 t/día (34 palanquilla, 8 varilla) | Unas 92 t/día | 190 t/día (160 varilla, 30 palanquilla) |
| Activos en libros | No se deprecian | Depreciación $350 mil/mes | No se deprecian | Depreciación $2.9 M/mes |
| Deuda inicial | 0 | 0 | 0 | $60 M a 13 %, 5 años (financió el laminador) |
| Caja inicial | $3.5 M | $3.5 M | $9 M | $25 M |

La consolidada sale de dos sedes de fusión a una sola planta integrada en Santa Catarina con el patio de chatarra en Saltillo. Eso sigue la historia lógica de la empresa: creció, compró el laminador con crédito y dejó de depender de terceros.

### 2.3 Personas que ya existen y siguen

Se conservan todos los personajes actuales y se les da un papel coherente con el proceso: Don Fermín Elizondo (maestro fundidor, jefe de fusión), Ing. Paula Treviño (metalurgista, calidad y análisis de colada), Rogelio Cantú (supervisor de turno), Ramiro Benítez (mantenimiento de hornos y refractario), Beto Cavazos (báscula y patio), Lucía Sáenz (administración, cobranza). En la consolidada se suman Ing. Alfonso Garza (gerente de planta), Ing. Sofía Lozano (procesos, laminador), Arnulfo Aguirre y Efraín Dávila (patio de Saltillo), Ing. Olga Narro (calidad de chatarra). Los números de plantilla adicionales son operadores, laminadores, montacarguistas y personal de seguridad, sin nombre propio.

---

## 3. Economía del negocio

### 3.1 Costo por tonelada (supuestos y rangos)

| Concepto | Valor | Rango razonable | Base |
|---|---|---|---|
| Precio de varilla (LAB planta) | $14,900/t | 14,300 a 15,500 | Precio comercial promedio de aceros largos de Grupo Simec, primer semestre 2025: unos $14,800 a $15,200/t |
| Precio de palanquilla | $12,300/t | 11,500 a 12,800 | Unos $2,600/t abajo de la varilla, que es el costo de laminarla más margen del laminador |
| Chatarra entregada en planta | $6,700/t | 5,800 a 7,500 | Compra al menudeo en Monterrey de $4 a $5/kg; el mayoreo cortado y clasificado puesto en planta cuesta más |
| Chatarra de patio propio | $5,900/t | 5,400 a 6,400 | Compra directa a recolectores más costo de corte |
| Rendimiento de fusión | 90 % | 88 a 93 % | Pérdidas por escoria, óxido y tierra de la chatarra |
| Rendimiento de colada | 97.5 % | 96 a 98.5 % | Despuntes y cortes de palanquilla |
| Rendimiento de laminación | 96 % | 94 a 97 % | Cascarilla y despuntes |
| Ferroaleaciones | $450/t | 350 a 600 | Silicomanganeso y ferrosilicio para varilla de grado 42 |
| Energía de fusión | 625 kWh/t a $2.20/kWh | 550 a 700 kWh; $1.80 a $2.60 | Tarifa GDMTH: componente de energía de $0.90 a $1.50/kWh, más demanda, distribución y punta |
| Refractarios, electrodos y consumibles | $520/t | 400 a 700 | Revestimiento del crisol, cucharas, oxígeno |
| Maquila de laminación | $2,100/t | 1,800 a 2,500 | Tarifa de un laminador tercero por convertir palanquilla en varilla |
| Laminación propia | $680/t | 550 a 850 | Gas de recalentamiento, rodillos, energía del tren |
| ISR más PTU | 37 % | — | 30 % ISR + 10 % PTU sobre utilidad, con pérdidas amortizables |

**Cuánta chatarra hace falta:** para una tonelada de palanquilla se necesitan 1.14 t de chatarra (1 entre 0.90 y 0.975).

**Costo variable de una tonelada de palanquilla:** chatarra $7,635 + aleaciones $450 + energía $1,410 + refractarios $520 = **unos $10,000**. Se vende en $12,300. Quedan unos $2,300 por tonelada para cubrir nómina, renta, mantenimiento y gastos fijos.

**Costo variable de una tonelada de varilla:**
- Con maquila: $10,000 entre 0.96 + $2,100 + $250 = **unos $12,800**. Se vende en $14,900. Quedan unos $2,100.
- Con laminador propio: $10,000 entre 0.96 + $680 = **unos $11,100**. Quedan unos $3,800.

Aquí está la lección central del giro: **la acería chica gana poco por tonelada y vive del volumen y del precio de la chatarra; la integrada gana por tener el laminador y el patio**. Esa diferencia es la que convierte en decisiones reales la integración hacia atrás (patio) y hacia adelante (laminador).

### 3.2 Ciclo de mercado (igual para todas las estrategias)

El precio de la chatarra sube 10 % entre los meses 7 y 10 y luego se queda 3 % arriba. El precio del acero sube 3 % entre los meses 8 y 12, baja 4 % entre los meses 13 y 18 y regresa a su nivel. Es un ciclo moderado, parecido a lo que pasó entre 2024 y 2026 con los aranceles de Estados Unidos al acero mexicano. Además hay un **escenario de estrés**: el acero cae 6 % adicional entre los meses 10 y 18.

### 3.3 Capital de trabajo

| Concepto | Supuesto |
|---|---|
| Cuentas por cobrar | 30 días a relaminadoras; 45 a 60 días a constructoras y distribuidores |
| Inventario | 12 días de chatarra en patio + 8 días de producto en proceso y terminado |
| Proveedores | 7 días a chatarreros (pagan casi de contado); 30 días a energía, aleaciones, refractario y maquila |

Esto importa porque **vender más a constructoras a 60 días consume caja aunque deje utilidad**.

### 3.4 EBITDA, utilidad operativa, utilidad neta y flujo de caja

- **EBITDA:** ventas menos todos los costos de operar (chatarra, energía, nómina, renta, mantenimiento). Mide si la operación es sana.
- **Utilidad operativa:** EBITDA menos depreciación. Reconoce que los hornos y el laminador se desgastan y algún día hay que reponerlos.
- **Utilidad neta:** utilidad operativa menos intereses e impuestos (ISR y PTU).
- **Flujo libre de caja:** EBITDA menos impuestos, menos lo que se queda atrapado en clientes e inventario, menos la inversión para mantener la planta. Es el dinero que de verdad entra al banco.
- **Caja:** flujo libre menos intereses y abonos a la deuda.

Una empresa puede tener buen EBITDA y quedarse sin caja. El juego debe mostrar las cuatro cifras por separado.

---

## 4. Tres estrategias simuladas (24 meses)

### 4.1 Qué hace cada estrategia

**Acería compacta (Aceros Huasteca)**
- **Conservadora:** se queda con sus tres clientes (34 t/día de palanquilla y 8 de varilla), sin deuda.
- **Equilibrada:** acepta un cliente nuevo de varilla (Desarrollos Industriales del Bajío, 8 t/día a $14,600, paga a 60 días) con los mismos hornos; contrata 2 personas y toma un crédito de capital de trabajo de $3 M a 17 %.
- **Agresiva:** lo anterior más 20 t/día de palanquilla barata ($11,900), tercer turno (13 personas más), y un crédito de $9 M a 19 % en 24 meses.

**Miniacería integrada (Grupo Acerero Huasteca)**
- **Conservadora:** opera lo que tiene y paga su deuda.
- **Equilibrada:** amplía el patio de chatarra de Saltillo ($12 M con caja propia) y sube la chatarra propia de 35 % a 55 %.
- **Agresiva:** compra un tercer horno ($55 M, financiado con $50 M a 13 %), que arranca en el mes 8, y firma 50 t/día de varilla nueva a $14,500 a 60 días.

### 4.2 Resultados del primer año

| Empresa y estrategia | Ventas | EBITDA | Utilidad operativa | Utilidad neta | Flujo libre | Caja al mes 12 |
|---|---|---|---|---|---|---|
| Compacta, conservadora | $169 M | $9.8 M | $5.6 M | $3.5 M | $5.4 M | $8.9 M |
| Compacta, equilibrada | $200 M | $12.3 M | $8.1 M | $4.9 M | $0.8 M | $5.1 M |
| Compacta, agresiva | $257 M | $16.2 M | $12.0 M | $6.8 M | −$3.7 M | $3.5 M |
| Integrada, conservadora | $868 M | $123.7 M | $88.9 M | $51.5 M | $75.2 M | $81.1 M |
| Integrada, equilibrada | $868 M | $131.9 M | $96.1 M | $56.1 M | $81.2 M | $75.1 M |
| Integrada, agresiva | $946 M | $137.6 M | $99.5 M | $54.8 M | $46.9 M | $33.4 M |

### 4.3 Resultados a 24 meses, escenario base

| Empresa y estrategia | EBITDA (margen) | Utilidad operativa | Utilidad neta | Flujo libre | Caja mínima | Caja final | Deuda final |
|---|---|---|---|---|---|---|---|
| Compacta, conservadora | $15.1 M (4.5 %) | $6.7 M | $4.2 M | $8.9 M | $4.1 M | $12.4 M | $0 |
| Compacta, equilibrada | $19.6 M (4.9 %) | $11.2 M | $6.8 M | $5.8 M | $2.0 M | $8.9 M | $0 |
| Compacta, agresiva | $27.9 M (5.3 %) | $19.5 M | $11.2 M | $4.5 M | $0.7 M | $6.6 M | $0.4 M |
| Integrada, conservadora | $223.7 M (13.1 %) | $154.1 M | $89.1 M | $142.1 M | $30.3 M | $130.5 M | $36.0 M |
| Integrada, equilibrada | $241.6 M (14.1 %) | $169.8 M | $99.1 M | $154.6 M | $29.9 M | $131.0 M | $36.0 M |
| Integrada, agresiva | $274.8 M (13.7 %) | $198.3 M | $110.5 M | $141.4 M | $11.5 M | $95.8 M | $67.2 M |

### 4.4 Escenario de estrés (el acero cae 6 % adicional entre los meses 10 y 18)

| Empresa y estrategia | EBITDA | Utilidad neta | Caja mínima | Caja final | Lectura |
|---|---|---|---|---|---|
| Compacta, conservadora | $7.7 M | −$2.2 M | $3.2 M | $6.0 M | Pierde dinero un año, pero sobrevive |
| Compacta, equilibrada | $10.6 M | −$0.1 M | −$2.0 M | $2.0 M | Necesita una línea de crédito para no dejar de pagar |
| Compacta, agresiva | $15.6 M | $2.9 M | −$6.1 M | −$1.6 M | Gana en papel y quiebra en caja |
| Integrada, conservadora | $185.8 M | $65.3 M | $30.3 M | $106.6 M | Resiste sin problema |
| Integrada, equilibrada | $203.8 M | $75.2 M | $29.9 M | $107.1 M | El patio la protege: es la mejor en crisis |
| Integrada, agresiva | $226.9 M | $80.4 M | $11.5 M | $65.7 M | Resiste, pero queda apretada y endeudada |

### 4.5 Qué enseñan las diferencias

1. **Crecer da más EBITDA, pero no más caja.** En la compacta, la agresiva gana casi el doble de EBITDA que la conservadora y termina con la mitad de caja, porque el volumen nuevo es barato, se cobra a 60 días y se paga con deuda cara.
2. **Quedarse estable es una decisión válida.** La conservadora es la única compacta que sobrevive al estrés sin ayuda del banco. El juego debe reconocerla como acierto cuando el jugador la elige por buenas razones.
3. **La agresiva de la compacta no es «mala»: es apuesta.** Si el mercado sube, gana. Si cae, quiebra. El caso debe mostrar ese riesgo antes de decidir, no después.
4. **En la integrada, la mejor jugada es la de en medio.** Ampliar el patio cuesta poco, baja el costo de la chatarra y protege justamente cuando el acero cae. El tercer horno da más ventas, pero se come la caja y deja la empresa con el doble de deuda.
5. **Los márgenes son realistas.** La compacta queda con 4 a 5 % de EBITDA, típico de un fundidor sin laminador. La integrada queda con 13 a 14 %, abajo del 21 % de Simec, que tiene escala, hornos de arco y laminación de perfiles de mayor precio. Si se desea, el margen de la integrada puede bajarse a 10 u 11 % subiendo la nómina o el costo de energía; las lecciones no cambian.

---

## 5. Huecos del motor que hay que cerrar

| Hueco | Situación actual | Corrección propuesta | Afecta partidas actuales |
|---|---|---|---|
| Depreciación de activos iniciales | Solo se deprecia lo que compra el jugador | Cada plantilla declara su depreciación mensual | No: solo plantillas nuevas |
| Impuestos | Solo ISN sobre nómina | ISR 30 % + PTU 10 % sobre utilidad, con pérdidas amortizables | No: se activa por plantilla |
| Inventario | No existe | Días de chatarra y de producto como capital de trabajo | No: se activa por plantilla |
| Etapa de laminación | No existe | Línea con dos rutas: maquila (costo por tonelada más flete) o laminador propio (capacidad y costo) | No |
| Precio de palanquilla | Casi igual a varilla | Productos distintos con precio propio | No |
| Ciclo de mercado | Precios planos | Índice mensual de chatarra y de acero, fijo y publicado (mismo para todos los jugadores) | No |
| Patio de chatarra | No existe | Porcentaje de chatarra propia con costo menor | No |
| Pago a chatarreros | Igual que a cualquier proveedor | 7 días (casi de contado) | No |

Todo se implementa en el motor determinístico con centavos enteros y pruebas que comparan cifra por cifra contra el modelo de Python. Si el motor y el modelo no coinciden, la prueba falla.

---

## 6. Casos propios de la acería

Se retira el paquete de forja (Aurora Motors, PPAP, plataformas de SUV) para la acería. En su lugar, un catálogo propio de **26 casos**, divididos en ocho frentes. Cada caso usa a las personas, hornos, clientes y proveedores que el jugador ya conoce, y varios dependen de lo que decidió antes (marcado como «Depende de»).

### 6.1 Operación
1. **El refractario de Don Fermín.** El revestimiento del horno 2 lleva 410 coladas; el fabricante recomienda cambiarlo a las 380. Don Fermín dice que aguanta cincuenta más. Parar son tres días sin fundir; si falla en caliente, es una perforación del crisol. *Decisión: parar ahora, esperar al fin de semana, o seguir.*
2. **El cuello de botella es la colada.** La máquina de colada continua se atora una vez por semana y obliga a regresar acero al horno. Sofía Lozano propone cambiar moldes; Rogelio prefiere bajar la velocidad.
3. **Turno nocturno sin maestro.** Para abrir el segundo turno no hay otro maestro fundidor con experiencia. *Depende de:* haber abierto turno.

### 6.2 Proveedores y chatarra
4. **El chatarrero grande sube precio.** Chatarras del Norte, que entrega el 60 % de la carga, sube $500/t y pide pago de contado. Hay un recolector más barato pero con chatarra más sucia (menor rendimiento).
5. **Chatarra mojada.** Llega un camión con agua en los paquetes. Cargar chatarra húmeda a un horno con metal líquido puede provocar una explosión. Beto quiere rechazarlo; el proveedor amenaza con dejar de surtir.
6. **Fuente radiactiva en la báscula.** El portal detecta radiación en un camión. Protocolo con la autoridad nuclear (CNSNS), camión inmovilizado, proveedor en entredicho.
7. **Contrato de chatarra a precio fijo.** Un proveedor ofrece fijar el precio seis meses. Si la chatarra sube, ganas; si baja, pierdes. *Conecta con el ciclo de mercado del mes 7.*

### 6.3 Clientes y cobranza
8. **La constructora paga tarde.** Constructora Cumbres del Norte se atrasa 40 días y pide más varilla. Lucía muestra que ya debe $3.8 M.
9. **Relaminadora pide descuento por volumen.** Laminados Regios quiere $300/t menos a cambio de 30 % más volumen. Ocupa capacidad con margen bajo.
10. **Cliente nuevo de varilla a 60 días.** El caso de crecimiento base, ahora con su efecto en caja visible antes de decidir.
11. **El distribuidor quiere crédito revolvente.** *Depende de:* haber aceptado distribuidores en la integrada.

### 6.4 Calidad
12. **Colada fuera de norma.** Paula detecta una colada de 13 t con manganeso bajo para varilla de grado 42. Se puede vender como palanquilla de segunda (−$1,500/t) o refundir (pierde energía y rendimiento).
13. **Reclamación por varilla quebradiza.** Una obra reporta varilla que se agrieta al doblar. ¿Es de la maquila o de la colada? *Depende de:* usar maquila.
14. **Certificado de calidad.** Un cliente grande exige certificado de producto bajo norma mexicana de varilla. Cuesta laboratorio y auditoría; abre mercado.

### 6.5 Energía
15. **Fundir en horario punta.** En tarifa GDMTH la energía en punta cuesta varias veces más. Programar fusión de noche baja el costo, pero obliga a cambiar turnos.
16. **Cargo por demanda máxima.** Prender los dos hornos al mismo tiempo dispara la demanda contratada y la multa de CFE.
17. **Banco de capacitores o contrato con suministrador calificado.** Inversión o contrato a tres años para bajar la tarifa.

### 6.6 Seguridad y medio ambiente
18. **Salpicadura de metal líquido.** Un operador sufre quemaduras leves porque no traía la careta aluminizada completa. Lo que decidas define la cultura de seguridad.
19. **Visita de PROFEPA.** Los vecinos reportan polvo en la colonia. Falta el sistema de captación de humos del horno 2.
20. **Revisión del contrato colectivo.** El sindicato pide 9 % y bono por calor. *Depende de:* haber abierto el tercer turno o recortado personal.

### 6.7 Capacidad
21. **El laminador de maquila se satura.** Tu laminador tercero te da cupo solo para la mitad de la varilla vendida este mes.
22. **Tercer horno.** Comprar un horno más, con su crédito, tiempo de llegada y efecto en caja.
23. **Mantenimiento mayor del laminador.** *Solo en la integrada:* parar diez días ahora o arriesgar una falla en temporada alta.

### 6.8 Estrategia
24. **Comprar un laminador o seguir con maquila.** La gran decisión de la compacta: integrarse hacia adelante con crédito, o quedarse ligera.
25. **Patio de chatarra propio.** Integrarse hacia atrás para bajar el costo de la carga.
26. **El acero importado y el arancel.** El arancel de Estados Unidos deja acero disponible en México y presiona el precio. ¿Bajas precio, buscas nicho o exportas palanquilla?

### 6.9 Historia que continúa

La compacta empieza con los casos de operación, proveedores y clientes. Si el jugador crece, aparecen turno nocturno, saturación de maquila y la decisión de laminador. Si compra el laminador, su empresa se convierte poco a poco en la integrada, y los casos de laminador, distribuidores y patio quedan disponibles. Si se queda estable, recibe casos de eficiencia (energía en punta, refractario, contrato de chatarra), que también mejoran su resultado. Así ambos caminos tienen sentido.

---

## 7. Inteligencia adaptativa

### 7.1 Lo que ya existe
- Cada caso trae etiquetas de competencia (finanzas, operación, personas, clientes, estrategia, riesgo, ética, aprendizaje).
- El sistema calcula el perfil del jugador y ordena los casos para trabajar primero sus competencias más débiles.
- Al decidir, el jugador ve qué ganó, qué sacrificó, qué otro camino había y el principio detrás.

### 7.2 Hacia dónde evoluciona

1. **Memoria de decisiones.** Cada decisión deja marcas concretas en el estado de la empresa: «abrió tercer turno», «aceptó chatarra mojada», «aceptó cliente que paga tarde», «tiene laminador propio». Las marcas son datos, no texto libre.
2. **Casos con condiciones.** Cada caso declara de qué marcas depende y cuáles bloquea («Depende de» en la sección 6). Un jugador que rechazó la chatarra mojada no ve el accidente; uno que la aceptó, quizá sí.
3. **Selección.** El motor arma la lista de casos posibles (por condiciones y por etapa de la empresa). Dentro de esa lista, el orden se elige por las competencias débiles del jugador. La IA puede ayudar a escoger cuál sigue, **solo entre los casos de la lista**.
4. **Narrativa adaptada.** La IA puede redactar el caso usando nombres, cifras y antecedentes reales de la partida («Don Fermín recuerda que hace tres meses le pediste aguantar el refractario»). No puede inventar cifras: todas vienen del motor.
5. **Consecuencias verificables.** Los efectos económicos de cada opción están escritos de antemano en el caso y los calcula el motor determinístico. La misma partida con las mismas decisiones da siempre el mismo resultado al centavo.
6. **Bitácora auditable.** Se registra qué casos eran posibles, cuál se eligió y por qué, qué texto generó la IA y qué cifras usó. Sirve para revisar y para la evaluación formal.

### 7.3 Lo que la IA no hace
- No cambia precios, costos, tasas ni consecuencias.
- No crea casos fuera del catálogo aprobado.
- No decide si una respuesta fue buena; eso lo determinan el motor y la rúbrica del caso.

---

## 8. Compatibilidad con lo publicado

- Las plantillas actuales (`aceria_emergente` y `aceria_consolidada`) **se quedan como están** para quien ya tiene partida. Su historial se sigue reconstruyendo igual.
- Las versiones corregidas entran con identificador nuevo (`aceria_compacta_v2` y `miniaceria_integrada_v2`). Las partidas nuevas usan la v2.
- Las funciones nuevas del motor (depreciación inicial, ISR y PTU, inventario, laminación, ciclo de mercado) se activan **solo** si la plantilla las declara. Las demás industrias no cambian ni un centavo.
- Las pruebas actuales siguen pasando y se agregan pruebas que comparan la v2 contra el modelo de Python.

---

## 9. Enfoque de lanzamiento

Se mantienen las cinco industrias estratégicas: **Restaurantes, Manufactura, Retail, SaaS y Logística y distribución**. Manufactura crece por giros, uno a la vez y con la misma profundidad que aquí se propone para la acería (proceso completo, economía verificada, casos propios, estrategias simuladas). La acería se termina antes de abrir el siguiente giro.

## 10. Orden de trabajo propuesto (una vez aprobado)

1. Motor: depreciación inicial, ISR y PTU, inventario, laminación (maquila y propia), ciclo de mercado y patio de chatarra, todo opcional por plantilla.
2. Plantillas v2 de las dos acerías, con pruebas que cuadren contra el modelo de Python.
3. Catálogo de 26 casos de acería con sus condiciones y etiquetas.
4. Memoria de decisiones y casos condicionados.
5. Revisión en producción y, después, el siguiente giro de Manufactura.

---

### Fuentes
- Grupo Simec, reporte del primer semestre de 2025: precio promedio de aceros largos, costo de ventas y márgenes.
- Precios de compra de chatarra en Monterrey (menudeo), 2025 a 2026.
- CFE, tarifa GDMTH (gran demanda en media tensión horaria), componentes de energía, demanda y punta.
- Notas de prensa sobre el precio de la varilla en México (alza anual a agosto de 2026) y el arancel de 50 % de Estados Unidos al acero mexicano.
- Rendimientos y consumos típicos de hornos de inducción y laminación: rangos de la industria; los valores exactos usados están en `modelo_propuesto.py` con su justificación.
