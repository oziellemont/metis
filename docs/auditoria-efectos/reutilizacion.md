# Reutilización de impactos entre industrias

Generado con `AUD_REUSE=1 npx vitest run src/lib/ceo/auditoria-efectos.test.ts`.

## 1 · Asuntos fijos de cada empresa

Opciones revisadas: **411**. Vectores distintos: **258**. Vectores que aparecen idénticos en dos o más empresas: **61**, que cubren **208** opciones (50.6 %).

Vectores idénticos en Forja, Kúbit, Punto Madero y Vértice a la vez: **34**.

| Empresa | Opciones | Con vector compartido con otra empresa | % |
|---|---:|---:|---:|
| Botanas Cumbre | 81 | 5 | 6.2 |
| Forja Norte | 72 | 40 | 55.6 |
| Grupo Brasa | 60 | 5 | 8.3 |
| Kúbit | 66 | 56 | 84.8 |
| Punto Madero | 66 | 52 | 78.8 |
| Vértice Logística | 66 | 50 | 75.8 |

### Plantilla común

Forja, Kúbit, Punto Madero y Vértice comparten la misma estructura de semana (carta del consejo, cliente grande que pide condiciones, fuga de talento, demanda, denuncia, consejo de cierre…). En la misma posición de la semana, la opción equivalente tiene el mismo vector en esta proporción:

| Empresa | Opciones en posición equivalente a Forja | Mismo vector | % |
|---|---:|---:|---:|
| Kúbit | 63 | 23 | 36.5 |
| Punto Madero | 63 | 26 | 41.3 |
| Vértice Logística | 63 | 24 | 38.1 |
| Grupo Brasa | 30 | 0 | 0 |
| Botanas Cumbre | 57 | 0 | 0 |

### Los vectores más repetidos y si encajan con la economía de cada industria

#### Vector caja/margen/equipo/clientes/consejo = (-1,0,-3,5,0)

| Empresa | Asunto | Opción | Resultado que ve el jugador |
|---|---|---|---|
| forja | Te damos la bienvenida a Forja Norte. Esto es lo que esperamos. | Primero el cliente: me voy una semana a la planta de Aurora en Saltillo para entender qué les duele y qué nece | El comprador de Aurora agradece que el nuevo director se presente en persona. Tu propia planta se queda una semana sin conocerte. |
| kubit | Te damos la bienvenida a Kúbit. Esto es lo que esperamos. | Primero el cliente que más pesa: una semana con Grupo Altamar para entender qué les duele y asegurar la renova | El director de finanzas de Altamar agradece que el nuevo director se presente en persona. Tu propio equipo se queda una semana sin conocerte. |
| puntomadero | Te damos la bienvenida a Punto Madero. Esto es lo que esperamos. | Primero el cliente que más pesa: una semana con Constructora Peñasco para entender qué les duele y asegurar su | El director de compras de Peñasco agradece que el nuevo director se presente en persona. Tu propio equipo se queda una semana sin conocerte. |
| vertice | Te damos la bienvenida a Vértice. Esto es lo que esperamos. | Primero el cliente que más pesa: una semana con Supermercados Almena para entender qué les duele y asegurar su | El director de logística de Almena se siente escuchado. En los patios se preguntan cuándo vas a ir a verlos. |

#### Vector caja/margen/equipo/clientes/consejo = (0,-3,3,3,-1)

| Empresa | Asunto | Opción | Resultado que ve el jugador |
|---|---|---|---|
| forja | Chuy Morales | «Chuy, el cordón se queda. Cada paro se investiga hasta la causa raíz y yo hablo mañana con Ramón. Si esta sem | Los operadores saben que pueden parar. Ramón se entera de que su supervisor te escribió y que lo contradijiste sin hablar con él primero. |
| kubit | Memo Paz | «Memo, la revisión se queda. Mañana hablo con Emilio. Si la entrega de Altamar se retrasa unos días por esto,  | El equipo sabe que la calidad importa. Emilio se entera de que lo contradijiste sin hablar con él primero. |
| puntomadero | Chuy Elizondo | «Chuy, los pasillos se cierran cuando baja una tarima. Mañana mismo hablo con Octavio. Si la temporada se retr | El equipo sabe que la seguridad importa. Octavio se entera de que lo contradijiste sin hablar con él primero. |
| vertice | Lalo Rangel | «Lalo, ninguna unidad sale sin revisión. Mañana hablo con Antonio. Si la temporada se retrasa unos días, lo as | El equipo sabe que la seguridad importa. Antonio se entera de que pasaron por encima de él. |

#### Vector caja/margen/equipo/clientes/consejo = (0,3,-3,-1,1)

| Empresa | Asunto | Opción | Resultado que ve el jugador |
|---|---|---|---|
| forja | Chuy Morales | «Chuy, gracias por avisarme. Esto lo tiene que decidir Ramón: es tu jefe directo y conoce la planta. Platícalo | Respetaste la cadena de mando. La línea produce más esta semana, y los operadores aprenden que reportar un problema es cosa de fin de turno. |
| kubit | Memo Paz | «Memo, gracias por avisarme. Esto lo decide Emilio: es tu jefe y conoce el producto. Platícalo con él y yo lo  | Respetaste la cadena de mando. Esta semana sale más código, y el equipo aprende que revisar es opcional cuando hay prisa. |
| puntomadero | Chuy Elizondo | «Chuy, gracias por avisarme. Esto lo decide Octavio: es tu jefe y conoce las tiendas. Platícalo con él y yo lo | Respetaste la cadena de mando. Esta semana llega más mercancía al anaquel, y el equipo aprende que la seguridad es opcional cuando hay prisa. |
| vertice | Lalo Rangel | «Lalo, gracias por avisarme. Esto lo decide Antonio: es tu jefe y conoce la flota. Platícalo con él y yo lo re | Respetaste la cadena de mando. Esta semana salen más viajes, y las unidades salen sin que nadie revise los frenos. |

#### Vector caja/margen/equipo/clientes/consejo = (0,-1,2,1,1)

| Empresa | Asunto | Opción | Resultado que ve el jugador |
|---|---|---|---|
| forja | Chuy Morales | «Chuy, mañana a las 7 en la línea 3 con Ramón y Laura. El cordón se queda, pero el líder de celda tiene 60 seg | Conservas el poder de parar sin dejar que la línea viva detenida. Ramón queda molesto por cómo se enteró, pero está en la mesa. |
| kubit | Memo Paz | «Memo, mañana a las 9 con Emilio y Renata. Revisión obligatoria en lo que toca dinero o datos de clientes; lo  | Conservas el control donde más duele sin frenar todo lo demás. Emilio queda molesto por cómo se enteró, pero está en la mesa. |
| puntomadero | Chuy Elizondo | «Chuy, mañana a las 9 con Octavio y Mónica. Tarima de día solo con pasillo cerrado y alguien cuidando; lo pesa | Conservas la seguridad donde más duele sin frenar todo lo demás. Octavio queda molesto por cómo se enteró, pero está en la mesa. |
| vertice | Lalo Rangel | «Lalo, mañana a las 7 con Antonio y Gabriela. Revisión de 10 minutos con lista corta y un mecánico más por tur | Cuidas la seguridad y el viaje extra al mismo tiempo, y sientas a Antonio en la mesa. Te cuesta un mecánico por turno. |

#### Vector caja/margen/equipo/clientes/consejo = (0,-8,0,5,-3)

| Empresa | Asunto | Opción | Resultado que ve el jugador |
|---|---|---|---|
| forja | Aurora Motors · Annual price reduction 2027 | Aceptar el 5% completo. Lo importante es ganar la plataforma 2028; ahí recuperamos el margen con volumen y año | Greg queda contento y la relación mejora. Regalas $80 M de margen al año por una plataforma que nadie te prometió. |
| kubit | Grupo Altamar · Renovación del contrato anual | Aceptar todo lo que pide. Lo importante es ganar las 14 empresas del grupo; ahí recuperamos el margen con volu | Hernán queda contento. Regalas $10 M al año y comprometes a cinco ingenieros por algo que nadie te prometió. |
| puntomadero | Constructora Peñasco · Condiciones para el próximo año | Aceptar todo lo que pide. Lo importante es ganar los nueve desarrollos; ahí recuperamos el margen con volumen. | Federico queda contento. Regalas $52 M al año y amarras caja que no tienes por algo que nadie te prometió. |
| vertice | Supermercados Almena · Condiciones para el próximo año | Aceptar todo lo que pide. Lo importante es ganar los tres CEDIS nuevos; ahí recuperamos el margen con volumen. | Ricardo queda contento. Regalas $36 M al año y amarras caja que no tienes por algo que nadie te prometió. |

#### Vector caja/margen/equipo/clientes/consejo = (0,3,0,-5,2)

| Empresa | Asunto | Opción | Resultado que ve el jugador |
|---|---|---|---|
| forja | Aurora Motors · Annual price reduction 2027 | Aceptar el 3% contractual e invocar la cláusula de acero con los datos: no damos el 2% adicional y pedimos apl | Defiendes el margen con el contrato en la mano. Greg anota que fuiste el único proveedor que dijo que no. |
| kubit | Grupo Altamar · Renovación del contrato anual | Renovar a precio de lista con el ajuste por inflación del contrato. Los desarrollos a la medida se cotizan apa | Defiendes el margen con el contrato en la mano. Hernán anota que fuiste el único proveedor que dijo que no. |
| puntomadero | Constructora Peñasco · Condiciones para el próximo año | Mantener precio de lista con el ajuste por inflación del contrato y crédito a 30 días. La entrega en obra se c | Defiendes el margen con el contrato en la mano. Federico anota que fuiste el único proveedor que dijo que no. |
| vertice | Supermercados Almena · Condiciones para el próximo año | Mantener la tarifa con el ajuste por diésel del contrato y pago a 30 días. Las penalizaciones, solo si también | Defiendes el margen con el contrato en la mano. Ricardo anota que no cediste nada. |

#### Vector caja/margen/equipo/clientes/consejo = (-1,-2,-2,2,1)

| Empresa | Asunto | Opción | Resultado que ve el jugador |
|---|---|---|---|
| forja | Aurora Motors · Annual price reduction 2027 | Aceptar el 3% y buscar el 2% restante en un taller de rediseño (VA/VE) con sus ingenieros; los ahorros se repa | Cambias la pelea por el precio por una búsqueda de ahorros juntos. Le cuesta horas a tu ingeniería y no hay garantía de que se encuentren. |
| kubit | Grupo Altamar · Renovación del contrato anual | Mantener el precio y meter al producto, con fecha, la integración con ERP que sirve a todos, a cambio de un pi | Cambias la pelea por el precio por una ruta que sirve a todos tus clientes. Le cuesta horas a ingeniería y no hay garantía de que Altamar abra las otras empresa |
| puntomadero | Constructora Peñasco · Condiciones para el próximo año | Mantener precio y crear entrega programada en obra para todos los constructores, con crédito a 60 días garanti | Cambias la pelea por el precio por un servicio que sirve a todos tus clientes de obra. Le cuesta a la operación y no hay garantía de que Peñasco te dé los otros |
| vertice | Supermercados Almena · Condiciones para el próximo año | Ofrecer 4% menos por un contrato de tres años, pago a 45 días, penalización con bono arriba de 97% y un CEDIS  | Cambias la conversación de precio a desempeño. Cedes algo de margen y amarras al cliente tres años. |

#### Vector caja/margen/equipo/clientes/consejo = (-4,-2,5,0,0)

| Empresa | Asunto | Opción | Resultado que ve el jugador |
|---|---|---|---|
| forja | Fuga de soldadores · 7 en un mes | Bono de retención para los 40 y transporte desde la colonia. Hay que parar la sangría ya; lo demás puede esper | La fuga se detiene este trimestre. El problema de fondo (no formamos soldadores) sigue igual. |
| kubit | Fuga de ingenieros · 9 en dos meses | Bono de retención y ajuste de sueldo para los 40 clave. Hay que parar la fuga ya; lo demás puede esperar unos  | La fuga se detiene este trimestre. El problema de fondo (no formamos ingenieros) sigue igual. |
| puntomadero | Se nos van los asesores expertos · 26 en dos meses | Bono de permanencia y ajuste de sueldo para los 120 asesores expertos. Hay que parar la fuga ya; lo demás pued | La fuga se detiene este trimestre. El problema de fondo (no formamos asesores) sigue igual. |
| vertice | Se nos van los operadores · 40 en dos meses | Bono de permanencia y ajuste de sueldo para los 250 operadores con experiencia. Hay que parar la fuga ya. | La fuga se detiene este trimestre. El problema de fondo (no formamos operadores) sigue igual. |

## 2 · Banco de casos (84 por empresa)

El banco arma 28 arquetipos × 3 giros = 84 casos por empresa (504 en total). El texto cambia por industria (cliente, lote, afectado, cifras de la tabla), pero **los efectos salen del arquetipo** (`effects: { ...o.effects }` en `buildCase`): el mismo arquetipo tiene exactamente los mismos números en las seis industrias y en sus tres giros.

Arquetipos con efectos idénticos en las seis industrias: **28 de 28**.

Esto significa que, por ejemplo, un retiro de producto cuesta lo mismo en caja a una botanera, a un software, a una tienda de materiales y a un transportista; y un mismo giro del caso (que en la historia puede cambiar mucho la gravedad) no cambia los números.

### Ejemplo: un mismo arquetipo en las seis industrias

Arquetipo `retiro`, giro 1:

| Empresa | Asunto | Dato clave de la tabla | Opción A (efectos) |
|---|---|---|---|
| cumbre | Llamada perdida · Javier (Planta) | Producto en anaquel: ≈ 210 mil piezas en 140 tiendas | caja -6, margen -3, clientes +5, consejo +3 |
| forja | Llamada perdida · Ramón (Operaciones) | Piezas en tránsito y en la armadora: ≈ 42 mil | caja -6, margen -3, clientes +5, consejo +3 |
| brasa | Llamada perdida · Andrés (Cocina) | Sucursales que pudieron recibirlo: Hasta 12 de 34 | caja -6, margen -3, clientes +5, consejo +3 |
| kubit | Llamada perdida · Emilio (Producto) | Clientes que usan la función: ≈ 640 | caja -6, margen -3, clientes +5, consejo +3 |
| puntomadero | Llamada perdida · Octavio (Operaciones) | Unidades vendidas: ≈ 18 mil | caja -6, margen -3, clientes +5, consejo +3 |
| vertice | Llamada perdida · Antonio (Operaciones) | Producto en la cámara: $25 M en medicamento | caja -6, margen -3, clientes +5, consejo +3 |

## 3 · Conclusión

El reuso no es en sí un error: dos empresas pueden enfrentar el mismo tipo de decisión. El problema es que el número no depende de los hechos de cada industria (tamaño del cliente, margen típico, capital de trabajo, ciclo de cobro). Un descuento de 5 % a tu cliente principal no pesa lo mismo en un SaaS con 80 % de margen bruto que en una autopartera con 18 %. La propuesta del modelo económico resuelve esto calculando el impacto desde hechos con unidades y anclas por industria, en lugar de un vector fijo por plantilla.

