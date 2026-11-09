# Retail: diagnóstico y propuesta

Documento para que Oziel Leal Montemayor lo revise antes de que se toque el motor. Las cifras salen de un modelo independiente y reproducible (`modelo_retail.py`, en esta misma carpeta). Cualquier persona puede correrlo y obtener los mismos resultados (`resultados.txt`).

Nada de lo publicado se apaga. Punto Madero, la cadena de 60 tiendas que hoy se juega en modo clásico, sigue igual. Retail entra al motor nuevo con dos empresas nuevas, igual que se hizo con la acería.

---

## 1. Diagnóstico corto

Hoy Retail **no tiene economía propia**:

1. **Solo existe la etapa Consolidada.** No hay empresa StartUp, así que quien elige Retail no puede empezar desde abajo.
2. **Se juega en modo clásico.** Los indicadores suben y bajan por el efecto de cada decisión, pero no hay ventas por tienda, inventario, proveedores, nómina ni caja que se calculen día con día.
3. **No hay inventario.** En una tienda el inventario es el dinero más grande y el más fácil de perder: se queda parado, se lo roban, se daña o falta justo cuando el cliente lo busca. Hoy el juego no lo modela.
4. **No hay temporada.** Una ferretería del norte vende más en primavera (arranque de obra, impermeabilizante antes de lluvias) y menos en enero. Hoy todos los meses son iguales.
5. **Abrir tiendas no cuesta caja.** En la realidad una tienda nueva necesita obra, anaquel completo desde el primer día y meses para madurar. Ese es el error más común de quien crece en retail: la tienda vende, pero la empresa se queda sin efectivo.
6. **El crédito a contratistas no se cobra.** Vender a crédito sube la venta, pero atrapa dinero y trae cuentas malas. Hoy no tiene costo.
7. **La competencia es solo un texto.** Mundo Casa, la cadena nacional, aparece en los casos, pero no le quita ventas a ninguna tienda.

**Lo que proponemos:** dos empresas sobre el motor nuevo, con el mismo rigor contable que la acería v2. Una ferretería de dos tiendas para StartUp y una cadena regional de nueve tiendas para Consolidada.

---

## 2. Realismo de la operación

### 2.1 Lo que debe existir en el motor

| Parte del negocio | Qué pasa en la realidad | Cómo lo modela el motor |
|---|---|---|
| Compras | Se compra al proveedor con crédito (30 a 75 días) y bonificaciones por volumen | Órdenes de compra, días de crédito, alza de precios del proveedor que se traslada con rezago |
| Inventario | Miles de productos con rotación muy distinta; el que no se mueve atrapa caja | Días de inventario por tienda, faltantes cuando se recorta sin datos, inventario de temporada |
| Merma | Robo, daño, error de captura, error de proveedor | Porcentaje de la venta que sube al abrir tiendas o al descuidar controles y baja con control de inventario |
| Precio y margen | Material de construcción deja poco; herramienta, pintura y hogar dejan más | Margen bruto por mezcla, descuentos, igualación de precio contra el competidor |
| Tiendas | Renta por metro cuadrado, luz, personal de piso, horario | Cada tienda con su tamaño, renta, plantilla, venta madura y curva de maduración |
| Clientes | Mostrador (efectivo y tarjeta) y contratistas a crédito | Comisión bancaria por tarjeta, cartera a crédito, cuentas incobrables, entrega en obra |
| Personas | Asesores de piso con alta rotación y alza de salario mínimo cada enero | Nómina con carga social, alza de enero, rotación y tiempo para que un asesor nuevo rinda |
| Centro de distribución | La cadena surte desde un centro de distribución; la ferretería chica recibe directo del proveedor | Costo logístico por venta (solo en la cadena) |
| Competencia | Una cadena nacional abre cerca de una o dos tiendas | Le quita venta a esas tiendas; se recupera parte según cómo responda el director |
| Venta en línea | Pedido en línea, recoger en tienda o entrega | Venta adicional con costo de entrega y el riesgo de prometer lo que la tienda no tiene |

### 2.2 Las dos empresas

| Concepto | StartUp · Ferretería Madero | Consolidada · Punto Madero Regional |
|---|---|---|
| Qué es | Ferretería familiar con dos tiendas en Saltillo | Cadena regional con nueve tiendas en Coahuila y Nuevo León |
| Tiendas | Centro (750 m²) y Norte (520 m²) | Saltillo Centro, Saltillo Sur, Ramos Arizpe, Monclova, Apodaca, Escobedo, Santa Catarina, Guadalupe y Piedras Negras (1,300 a 2,400 m²) |
| Personas | 19 (17 en tienda, 2 en oficina) | 207 (183 en tienda, 24 en oficinas centrales) |
| Venta anual | Unos $34 M | Unos $450 M |
| Margen bruto | 30 % | 31.6 % (compra mejor por volumen) |
| Inventario al llegar | $6.4 M (unos 98 días de venta) | $74 M (unos 88 días) |
| Proveedores | 40 días de crédito | 58 días de crédito |
| Venta a crédito a contratistas | 22 % a 30 días | 22 % a 30 días |
| Centro de distribución | No (el proveedor entrega en tienda) | Sí, en Ramos Arizpe |
| Deuda al llegar | Ninguna | $40 M a 5 años (financió las últimas aperturas) |
| Línea de crédito revolvente | $2.5 M | $25 M |
| Caja al llegar | $1.4 M | $18 M |
| Competidor | Mundo Casa abre a tres cuadras de la tienda Centro en el mes 8 | Mundo Casa abre junto a Saltillo Centro y Apodaca en el mes 8 |

La Consolidada es más chica que el Punto Madero de 60 tiendas del modo clásico, a propósito: es la misma familia de empresa en una etapa anterior, y su tamaño permite que cada tienda pese en las decisiones del director.

### 2.3 Personas que ya existen y siguen

Se conservan los personajes que el jugador ya conoce de Punto Madero, con un papel coherente con el tamaño de cada empresa:
- En la StartUp, Jesús «Chuy» Elizondo es el encargado de la tienda Centro y Alberto «Beto» Castañeda es el asesor experto.
- Claudia Leal lleva la administración y la cobranza.
- Federico Ramos (Constructora Peñasco) es el cliente contratista más grande.
- En la Consolidada se suman Octavio Ríos (operaciones y tiendas), Diego Villarreal (compras), Mónica Saldívar (experiencia del cliente y tienda en línea) y Lorena Cantú (personas).
- Esteban Garza preside el consejo.
- Los demás puestos (asesores, cajeros, almacenistas, choferes) son plantilla sin nombre propio.

---

## 3. Economía del negocio

### 3.1 Supuestos y de dónde salen

| Supuesto | Valor | Rango | Base |
|---|---|---|---|
| Margen bruto, ferretería chica | 30 % | 28–33 % | Mezcla típica: material de construcción 18–22 %, herramienta 35–40 %, pintura 33–38 %, hogar 38–42 % |
| Margen bruto, cadena | 31.6 % | 30–34 % | Compra por volumen y bonificaciones; las grandes cadenas de mejoramiento del hogar reportan 32–34 % |
| Merma | 1.6 % de la venta | 1.2–2.2 % | Referencia de la Federación Nacional de Minoristas de EUA (NRF): 1.4–1.7 % |
| Días de inventario | 98 (chica) · 88 (cadena) | 75–125 | Ferretería con miles de claves de baja rotación; la cadena repone por sistema |
| Crédito de proveedores | 40 (chica) · 58 (cadena) días | 30–75 | Plazo típico que negocia cada tamaño |
| Sueldo de asesor o cajero | $12,600 al mes | $11,500–14,500 | Coahuila y Nuevo León 2026 (salario mínimo 2026: $9,582 al mes) |
| Carga social | 33 % sobre sueldo | 30–38 % | IMSS, Infonavit, impuesto sobre nómina, aguinaldo, vacaciones y prima vacacional |
| Alza de salarios cada enero | 10 % | 6–13 % | Empujada por el salario mínimo (2025: +12 %, 2026: +13 %) |
| Renta por m² al mes | $105 (local de calle) · $88 (caja grande) | $65–160 | Locales comerciales en Saltillo y Monterrey |
| Comisión por tarjeta | 1.8 % | 1.5–2.5 % | Comisión bancaria de terminal punto de venta |
| ISR y PTU | 37 % de la utilidad | 35–40 % | ISR 30 % y PTU 10 % (simplificado) |
| Tasa del banco | 15.5 % | 13–19 % | Crédito simple y revolvente para PyME comercial en 2026 |
| Tienda nueva | Abre al 55 % de su venta madura y madura en 18 meses | 12–24 meses | Patrón típico de aperturas en retail regional |

Todos son supuestos de simulación con su rango; no son datos de una empresa real.

### 3.2 Temporada (igual para todas las estrategias)

| Mes | Ene | Feb | Mar | Abr | May | Jun | Jul | Ago | Sep | Oct | Nov | Dic |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Índice de venta | 0.86 | 0.92 | 1.00 | 1.06 | 1.12 | 1.08 | 1.02 | 1.00 | 0.98 | 1.00 | 0.98 | 0.98 |

En marzo y abril el inventario sube 12 días porque se carga impermeabilizante antes de las lluvias. Eso consume caja justo cuando el jugador llega.

### 3.3 Cómo queda un año normal (sin crecer)

| Concepto (% de la venta) | StartUp | Consolidada |
|---|---|---|
| Margen bruto | 29.8 % | 31.6 % |
| Merma | 1.6 % | 1.6 % |
| Nómina con carga social | 12.6 % | 11.0 % |
| Renta | 4.7 % | 3.7 % |
| Luz y servicios | 1.6 % | 1.6 % |
| Centro de distribución | — | 2.1 % |
| Comisiones de tarjeta, publicidad, entrega y cuentas malas | 1.9 % | 2.5 % |
| Administración | 2.5 % | 1.9 % |
| **EBITDA** | **4.9 %** | **7.3 %** |
| Depreciación | 1.3 % | 1.5 % |
| Intereses | — | 1.2 % |
| **Utilidad neta del año** | **$0.7 M** | **$12.9 M** |

Una ferretería independiente gana poco: entre 3 y 6 % de EBITDA. Una cadena regional bien llevada gana entre 6 y 9 %. Las grandes cadenas nacionales llegan a dos dígitos por escala, algo que ninguna de estas dos empresas tiene.

### 3.4 EBITDA, utilidad y caja salen distintos y por razones explicables

- **EBITDA:** lo que deja vender, menos lo que cuesta operar las tiendas.
- **Utilidad operativa:** el EBITDA menos el desgaste del anaquel, la obra y el equipo (depreciación).
- **Utilidad neta:** además resta intereses e impuestos. Los impuestos se provisionan cada mes y se pagan cada trimestre, como en la acería.
- **Caja:** puede bajar aunque haya utilidad. Pasa cuando sube el inventario (temporada o tienda nueva), cuando se da más crédito a contratistas o cuando se abre una tienda.

---

## 4. Tres estrategias simuladas (24 meses)

### 4.1 Qué hace cada estrategia

| Estrategia | Tiendas | Inventario | Precio | Crédito a contratistas | Ante el competidor | Otros |
|---|---|---|---|---|---|---|
| Conservadora | No abre | Lo recorta 15 días | Sin cambio | Lo reduce a 18 % | Iguala precio en lo que el cliente compara | — |
| Equilibrada | Abre una (StartUp, mes 7) o dos (Consolidada, meses 6 y 15) | Lo recorta 5 días | Sin cambio | Lo mantiene en 22 % | Compite con asesoría y entrega en obra | Proyecto de control de inventario y merma |
| Agresiva | Abre dos (StartUp) o tres (Consolidada) en el primer año | Lo sube 5 días | Baja 1.2 puntos para ganar tráfico | Lo sube a 30 % y a 45 días | Iguala precio | Lanza tienda en línea |

### 4.2 Primer año, escenario base

| Empresa | Estrategia | Venta | EBITDA | Utilidad neta | Caja al mes 12 |
|---|---|---|---|---|---|
| StartUp | Conservadora | $33.8 M | 4.9 % | $0.7 M | $4.1 M |
| StartUp | Equilibrada | $40.0 M | 4.0 % | $0.5 M | $0.6 M |
| StartUp | Agresiva | $49.6 M | 4.7 % | $0.7 M | $0.0 (línea usada al tope) |
| Consolidada | Conservadora | $453 M | 7.3 % | $12.9 M | $46.5 M |
| Consolidada | Equilibrada | $487 M | 7.5 % | $14.5 M | $32.7 M |
| Consolidada | Agresiva | $568 M | 7.5 % | $17.6 M | $6.2 M (línea usada al tope) |

La utilidad es parecida, pero la caja es muy distinta. Esa es la lección central de Retail: crecer en tiendas consume efectivo en inventario mucho antes de dejar utilidad.

### 4.3 Doce escenarios, 24 meses: quién gana

Gana la estrategia que crea más valor económico. El valor económico es la utilidad después de cobrar el costo de todo el dinero invertido (inventario, cartera y tiendas), incluyendo lo que las tiendas nuevas dejarán ya maduras. Cada mes con proveedores vencidos resta, porque en la realidad se pierde crédito y surtido.

**StartUp · Ferretería Madero**

| Escenario | Conservadora | Equilibrada | Agresiva | Gana |
|---|---|---|---|---|
| Base | −2.7 M | −2.1 M | −2.8 M (150 d vencidos) | Equilibrada |
| Demanda −10 % | −4.5 M | −4.9 M | −6.2 M | Conservadora |
| Demanda +8 % | −1.1 M | +0.2 M | +0.1 M | Equilibrada |
| El proveedor sube 5 % | −4.1 M | −4.2 M | −5.8 M | Conservadora |
| Merma +1 punto | −3.6 M | −3.4 M | −4.5 M | Equilibrada |
| Contratistas pagan 20 días tarde | −3.0 M | −2.7 M | −4.2 M | Equilibrada |
| Salarios +8 % | −3.5 M | −3.3 M | −4.2 M | Equilibrada |
| Tasa +4 puntos | −2.7 M | −2.1 M | −2.8 M | Equilibrada |
| Competidor más fuerte | −3.3 M | −2.7 M | −3.4 M | Equilibrada |
| La obra se frena | −4.4 M | −4.8 M | −6.9 M | Conservadora |
| Tormenta (todo junto) | −6.4 M | −7.7 M | −10.7 M | Conservadora |
| Bonanza | +1.1 M | +4.1 M | +5.5 M | Agresiva |

**Consolidada · Punto Madero Regional**

| Escenario | Conservadora | Equilibrada | Agresiva | Gana |
|---|---|---|---|---|
| Base | −1.3 M | +3.6 M | −4.6 M (30 d vencidos) | Equilibrada |
| Demanda −10 % | −27.2 M | −27.5 M | −37.4 M | Conservadora |
| Demanda +8 % | +20.3 M | +29.5 M | +22.6 M | Equilibrada |
| El proveedor sube 5 % | −19.9 M | −18.5 M | −32.3 M | Equilibrada |
| Merma +1 punto | −13.4 M | −10.4 M | −21.9 M | Equilibrada |
| Contratistas pagan 20 días tarde | −6.1 M | −3.2 M | −18.6 M | Equilibrada |
| Salarios +8 % | −11.5 M | −8.1 M | −17.2 M | Equilibrada |
| Tasa +4 puntos | −1.3 M | +3.6 M | −4.6 M | Equilibrada |
| Competidor más fuerte | −5.7 M | −0.2 M | −9.1 M | Equilibrada |
| La obra se frena | −25.4 M | −26.3 M | −44.5 M | Conservadora |
| Tormenta (todo junto) | −50.8 M | −56.5 M | −78.6 M | Conservadora |
| Bonanza | +46.1 M | +62.8 M | +63.2 M | Agresiva |

**Ninguna estrategia gana en todos los escenarios.** La equilibrada gana más seguido, la conservadora gana cuando el mercado se cae y la agresiva solo gana con mercado muy fuerte.

### 4.4 Qué enseñan las diferencias

1. **La ferretería chica casi no gana su costo de capital.** Con $6.4 M de inventario y $1.7 M de EBITDA al año, cada día de inventario de más se come la utilidad. Por eso el valor económico sale negativo en casi todos los escenarios, y por eso la palanca más poderosa del director no es vender más: es rotar mejor.
2. **Recortar inventario sin datos cuesta venta.** La conservadora libera caja, pero deja huecos en anaquel. Con el proyecto de control de inventario, la equilibrada recorta menos y pierde mucho menos venta.
3. **La agresiva sube el EBITDA pero se queda sin caja.** En la StartUp pasa cinco meses con proveedores vencidos, aunque su EBITDA a 24 meses es el más alto (6.1 %). Es exactamente lo que se quiere que el jugador sienta: margen no es lo mismo que efectivo.
4. **Pelear por precio contra una cadena nacional es caro.** Igualar precio recupera clientes rápido, pero cuesta margen en toda la tienda. Competir con asesoría y entrega en obra tarda más, pero recupera más.
5. **El crédito a contratistas es un arma de doble filo.** Sube la venta, pero cuando la obra se frena, la cartera se alarga y aparecen cuentas malas.

---

## 5. Lo que hay que construir en el motor

Se reutiliza todo lo que ya probó la acería v2:
- contabilidad en centavos con partida doble;
- cobranza por factura;
- pagos vencidos con consecuencias;
- impuestos provisionados y pagados por separado;
- opciones de liquidez;
- el diario de decisiones que se reconstruye igual.

Lo nuevo para Retail:
1. **Tiendas como unidad.** Cada una con su tamaño, renta, plantilla, venta madura, edad y curva de maduración.
2. **Inventario.** Días de inventario, inventario de temporada, anaquel completo de una tienda nueva, faltantes cuando se recorta sin control y merma.
3. **Temporada mensual de ferretería**, y un competidor que afecta tiendas concretas.
4. **Dos tipos de cliente:** mostrador (efectivo y tarjeta, con comisión) y contratistas a crédito (con cartera, entrega en obra y cuentas malas).
5. **Proveedores** con plazo, bonificaciones por volumen y alzas que solo se trasladan con rezago.
6. **Centro de distribución** solo en la Consolidada.
7. **Venta en línea** opcional, con su costo de entrega y el riesgo de prometer lo que no hay.
8. **Formatos.** Todo lo anterior vive en una tabla de parámetros por formato, para que más adelante se agreguen moda, conveniencia o farmacia sin reescribir el motor (ver sección 8).

---

## 6. Casos propios de Retail (26)

Cada caso lleva tres etiquetas: industria, función directiva y competencia. Las opciones que ponen en riesgo a las personas aparecen bloqueadas, con la razón explicada.

### 6.1 Inventario y compras (5)
1. **El inventario de temporada.** Diego quiere comprar impermeabilizante para toda la temporada con descuento por volumen. Se elige entre comprar todo, comprar por etapas o comprar poco.
2. **Productos que no se mueven.** Hay $900 mil (StartUp) o $9 M (Consolidada) en claves sin venta en seis meses. Se elige entre rematar, devolver al proveedor con penalización o dejarlos.
3. **El inventario no cuadra.** El conteo físico no coincide con el sistema en la tienda Centro. Se elige entre un conteo cíclico permanente, un conteo total cerrando un día o seguir igual.
4. **El proveedor exclusivo.** Un fabricante de pintura ofrece más margen a cambio de exclusividad en la categoría.
5. **El proveedor sube 6 %.** Se elige entre trasladarlo todo, trasladarlo por etapas o absorberlo para no perder clientes.

### 6.2 Precio y margen (3)
6. **Mundo Casa anuncia precios bajos en 200 productos.** Se elige entre igualar en todo, igualar solo en lo que el cliente compara o no igualar y reforzar la asesoría.
7. **Marca propia.** Lanzar una marca propia en tornillería y pintura: más margen y riesgo de calidad.
8. **Descuentos de los vendedores.** Los asesores dan descuentos para cerrar ventas. Se elige entre un margen mínimo por sistema, autorización del gerente o dejarlos.

### 6.3 Tiendas y personas (4)
9. **Rotación de asesores.** Se van cuatro de cada diez en un año. Se elige entre subir sueldo, crear un plan de carrera o dejarlo igual.
10. **El horario de temporada.** Abrir domingos completos en primavera, con horas extra o con personal temporal.
11. **El encargado que no rinde.** Una tienda con buen tráfico y mala venta por ticket.
12. **Alza del salario mínimo en enero.** Se elige entre trasladarlo a todos, solo a quienes ganan el mínimo o ajustar la plantilla.

### 6.4 Clientes y crédito (4)
13. **Constructora Peñasco pide 90 días.** Hoy tiene 30. Pesa mucho en la venta.
14. **Un contratista deja de pagar.** Se elige entre suspender el crédito, reestructurar o seguir vendiéndole.
15. **Entrega gratis en obra.** Los contratistas la piden. Cuesta flete y gana lealtad.
16. **Reclamo por material defectuoso.** Un cliente reclama un lote de varilla o cemento que falló en obra.

### 6.5 Competencia y mercado (2)
17. **Mundo Casa abre a tres cuadras.** Plan de respuesta en las tiendas afectadas.
18. **La obra se frena en la región.** Se elige entre recortar compras y horario, sostener o aprovechar para negociar con proveedores.

### 6.6 Venta en línea (2)
19. **Lanzar la tienda en línea.** Se elige entre hacerlo con una plataforma propia, en un marketplace o no hacerlo.
20. **Prometer lo que no hay.** La página muestra existencias que la tienda ya no tiene. Se elige entre apagar la venta en línea de esa tienda, prometer con margen de error o seguir igual.

### 6.7 Seguridad (3)
21. **Surtir con clientes en el pasillo.** Para llegar a la temporada se quiere bajar tarimas con montacargas en horario de tienda. La opción «sin cerrar pasillos» queda bloqueada.
22. **Mercancía de temporada en la salida de emergencia.** No cabe en bodega. La opción «dejarla ahí» queda bloqueada.
23. **Robo hormiga organizado.** Un grupo roba herramienta eléctrica en varias tiendas. Se elige entre seguridad, vitrinas cerradas o aceptar la merma.

### 6.8 Expansión y estrategia (3)
24. **Abrir una tienda nueva.** Ubicación, tamaño y cómo financiarla. El banco y la caja disponible deciden qué opciones quedan abiertas.
25. **Cerrar la tienda que pierde dinero.** Se elige entre cerrarla, cambiarle el formato o darle seis meses más.
26. **Qué hacer con la caja.** Pagar deuda, abrir otra tienda o repartir dividendos al dueño.

### 6.9 Historia que continúa
Varias decisiones regresan:
- el crédito de 90 días a Peñasco vuelve cuando la obra se frena;
- la marca propia vuelve con un reclamo de calidad;
- la tienda en línea vuelve cuando el inventario no cuadra;
- el remate de inventario vuelve cuando el proveedor ofrece bonificación por volumen.

---

## 7. Inteligencia adaptativa

Funciona igual que en la acería v2:
- El siguiente caso depende de cómo está el negocio:
  - inventario alto: casos de inventario;
  - caja baja: casos de liquidez;
  - competidor activo: casos de precio y servicio;
  - merma alta: casos de control y seguridad;
  - tiendas saturadas: casos de expansión.
- También depende de cómo ha decidido el jugador. A quien arriesga mucho le llegan casos que ponen a prueba ese riesgo. A quien es muy prudente le llegan casos que lo obligan a crecer.
- Lo que la IA no hace:
  - no inventa casos;
  - no cambia cifras;
  - no puede saltarse un caso de liquidez cuando hay pagos vencidos.
- La IA solo puede sugerir entre los casos que el motor considera válidos. Queda registrado quién eligió cada caso.

---

## 8. Otros formatos de tienda sin reescribir el motor

El motor de Retail se diseña con una tabla por formato. La ferretería es el primero. Agregar otro formato es llenar su tabla y escribir sus casos:

| Parámetro | Ferretería (lanzamiento) | Moda | Conveniencia | Farmacia |
|---|---|---|---|---|
| Margen bruto | 30–32 % | 50–60 % | 25–30 % | 25–28 % |
| Días de inventario | 88–98 | 100–140 | 15–25 | 45–60 |
| Merma | 1.6 % | 2–3 % | 1.5–2 % (caducidades) | 1–1.5 % (caducidades) |
| Temporada | Primavera alta, enero bajo | Rebajas y cambio de temporada | Plana, sube en verano | Invierno alto (enfermedades respiratorias) |
| Crédito a clientes | Contratistas | No | No | Instituciones y aseguradoras |
| Particular | Entrega en obra | Devoluciones y remates | Perecederos y horario 24 h | Regulación sanitaria y receta |

---

## 9. Compatibilidad con lo publicado

- Punto Madero (60 tiendas, modo clásico) sigue igual para quien lo esté jugando.
- Las dos empresas nuevas entran apagadas. Se activan solo con tu autorización, después de la comparación final y la prueba completa del recorrido, como se hizo con la acería.
- Las partidas que ya existen no cambian.

---

## 10. Orden de trabajo propuesto (una vez aprobado)

1. Motor de Retail sobre la base de la acería v2: tiendas, inventario, temporada, clientes, proveedores, competidor y centro de distribución.
2. Las dos empresas, con su prehistoria simulada para que el jugador llegue a una empresa con historia.
3. Los 26 casos con sus continuaciones y opciones bloqueadas por seguridad.
4. Selector adaptativo y límites de la IA.
5. Pruebas:
   - sensibilidad en los 12 escenarios;
   - que la caja nunca quede negativa sin consecuencia;
   - que impuestos y proveedores cuadren;
   - recorridos completos con director prudente, equilibrado y arriesgado.
6. Comparación final contra este modelo y presentación para tu autorización de activar.

---

### Fuentes

- Margen de ferreterías en México y número de ferreterías (más de 172,000 según el DENUE del INEGI): Pulpos, «Márgenes de una ferretería en México», octubre 2026. https://pulpos.com/blog/margenes-de-una-ferreteria-en-mexico
- Tamaño de tiendas y red logística de una cadena nacional de mejoramiento del hogar en México (tiendas de unos 5,000 m², 144 tiendas): Expansión, 8 de septiembre de 2026. https://expansion.mx/empresas/2026/09/08/the-home-depot-invierte-500-mdp-para-abrir-una-tienda-en-edomex-y-acelerar-sus-ventas-en-linea
- Merma en comercio minorista (1.4–1.7 % de la venta): National Retail Federation, National Retail Security Survey. https://nrf.com/research/national-retail-security-survey-2023
- Márgenes de grandes cadenas de mejoramiento del hogar: The Home Depot, Reporte anual 2024. https://ir.homedepot.com/~/media/Files/H/HomeDepot-IR/2025/HD_2024_AR_IRsite_v2.pdf
- Salario mínimo 2026 y alzas recientes: Comisión Nacional de los Salarios Mínimos.
- Todo lo demás son supuestos de simulación con su rango, documentados en `modelo_retail.py`.
