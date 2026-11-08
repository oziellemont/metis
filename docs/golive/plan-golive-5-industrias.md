# mêtis · Primer lanzamiento: cinco industrias

Decisión de Oziel Leal Montemayor. Este documento es la regla de trabajo para el desarrollo.

## Las cinco industrias del lanzamiento

| # | Industria | Qué pone a prueba |
|---|---|---|
| 1 | Restaurantes | Operación diaria, personal, sucursales y experiencia del cliente |
| 2 | Autopartes / Manufactura | Capacidad, calidad, inversiones y grandes contratos B2B |
| 3 | Retail | Inventarios, precios, tiendas, demanda y expansión comercial |
| 4 | Software y SaaS | Producto digital, suscripciones, crecimiento, retención e innovación |
| 5 | Logística y distribución | Redes, flota, almacenes, servicio, costos y eficiencia operativa |

**Primera ampliación (posición 6): Alimentos y bebidas.** Su motor no será una copia del de Autopartes. Tendrá su propia lógica de perecibilidad y merma, inocuidad y trazabilidad, negociación con cadenas comerciales, portafolio de marcas, planeación de producción con demanda variable y rentabilidad por producto, presentación y canal.

**Después:** Manufactura industrial general, Servicios financieros / Fintech y Salud, según la demanda de usuarios y empresas.

**Regla:** no se desarrolla ninguna de las otras 54 industrias hasta que las cinco prioritarias alcancen una calidad consistente.

## Qué significa «100 % lista»

Una industria no está lista solo porque se puede elegir y tiene casos. Debe cumplir las ocho dimensiones:

| Dimensión | Requisito |
|---|---|
| Carrera | StartUp y Empresa consolidada, con condiciones económicas diferentes |
| Economía | Ventas, costos, personal, inversión, caja y margen conectados con hechos reales de la simulación |
| Crecimiento | Contrataciones, capacidad, expansión y financiamiento propios de la industria |
| Casos | Situaciones que respetan el tamaño, el historial y los recursos actuales de la empresa |
| Continuidad | Las decisiones anteriores generan consecuencias en situaciones posteriores |
| Inteligencia adaptativa | La dificultad y los casos se ajustan a la situación del negocio y al desempeño del jugador |
| Aprendizaje | Explicaciones claras del razonamiento, los sacrificios y las consecuencias |
| Calidad | Simulaciones con distintas estrategias, sin inconsistencias económicas ni historias imposibles |

Cada industria necesita su propia lógica económica, no la de otra industria con otros nombres:

- **Software y SaaS:** ingresos recurrentes, cancelaciones, costo de adquisición de clientes, infraestructura y desarrollo. No se mide como una fábrica.
- **Retail:** el lanzamiento usa la ferretería, pero la arquitectura debe admitir otros formatos comerciales (conveniencia, moda, farmacia) sin reescribirse.
- **Logística:** red de almacenes, flota propia o contratada, nivel de servicio, costo por entrega y estacionalidad.

## Estado real hoy (revisión del código)

✔ cumple · ◐ parcial · ✘ falta

| Dimensión | Restaurantes | Autopartes | Retail | SaaS | Logística |
|---|---|---|---|---|---|
| Carrera (StartUp + Consolidada) | ✔ | ✔ | ✘ solo consolidada | ✘ solo StartUp, oculta | ✘ solo consolidada |
| Economía conectada al motor | ✔ | ✔ | ✘ modo clásico | ✘ modo clásico | ✘ modo clásico |
| Crecimiento propio de la industria | ✔ | ✔ | ✘ | ✘ | ✘ |
| Casos acordes al tamaño y recursos | ✔ | ✔ | ◐ | ◐ | ◐ |
| Continuidad | ◐ cadenas de casos; falta más profundidad | ◐ | ◐ cadenas clásicas | ◐ | ◐ |
| Inteligencia adaptativa | ✘ pendiente de conectar al motor | ✘ | ◐ solo modo clásico | ◐ | ◐ |
| Aprendizaje en los casos de crecimiento | ◐ solo una línea de resultado | ◐ | ✔ modo clásico | ✔ | ✔ |
| Calidad (simulaciones multi-estrategia) | ◐ StartUp simulada; falta Consolidada | ◐ | ✘ | ✘ | ✘ |

Conclusión honesta: hoy ninguna de las cinco cumple las ocho dimensiones. Restaurantes y Autopartes están más avanzadas. A las otras tres les falta el motor económico propio.

## Orden de trabajo propuesto

1. **Base común.** Separar el motor por «modelo de negocio» para que acepte lógicas distintas (servicio en sitio, planta, tiendas, red logística, suscripción). Etiquetar cada caso por industria, función directiva y competencia. Llevar a los casos de crecimiento el sistema de aprendizaje (ganaste, sacrificaste, otro camino posible).
2. **Logística y distribución.** StartUp y Consolidada sobre el motor: CEDIS, rutas, flota propia o contratada, cliente que exige entregas más rápidas, consolidación de almacenes, crecimiento en ventas con pérdida de rentabilidad y crisis laboral en temporada alta.
3. **Retail.** Tiendas, inventario, precios, rotación, merma y apertura de tiendas, con una arquitectura que admita otros formatos.
4. **Software y SaaS.** Ingresos recurrentes, cancelaciones, adquisición de clientes, levantamiento de capital, infraestructura y equipo de producto.
5. **Cierre de calidad de las cinco.** Inteligencia adaptativa conectada al motor, simulaciones multi-estrategia por industria y tamaño, y revisión de consistencia económica.

## Learning y Assessment

- **mêtis Learning** (el producto actual) desarrolla el criterio ejecutivo a través de decisiones.
- **mêtis Assessment** (B2B, después) evaluaría competencias de candidatos para un puesto concreto. Requiere casos ligados a las responsabilidades del puesto, criterios consistentes y evidencia de validez y equidad. Un buen resultado de caja no demuestra por sí solo que alguien será un buen director.

Por eso, desde ahora, cada caso nuevo lleva tres etiquetas: industria, función directiva y competencia. El contenido se podrá reutilizar sin confundir la experiencia de juego con una evaluación validada.
