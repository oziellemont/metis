# Carrera continua · Adenda 1 al plan P0-A: decisiones de Oziel y Atlas maestro

Estado: aprobada por Oziel. Complementa `p0a-plan.md`. Si hay contradicción, manda esta adenda.
Fuentes:
- respuesta de Oziel al plan P0-A;
- `METIS_CEO_Atlas_Maestro_Casos_Branches_Eventos_Live_v1.md` (Atlas v1.0).

---

## 1. Decisiones ya tomadas (no se vuelven a preguntar)

| Tema | Decisión | Qué cambia en el plan |
|---|---|---|
| Jugadores actuales | Hoy el único jugador es Oziel. | La migración se simplifica. Se conserva la regla de no borrar una carrera sin preguntar y la pantalla «Continuar / Empezar nueva», pero ya no hace falta un plan de convivencia largo entre carreras viejas y nuevas. Las reglas V1–V3 se quedan intactas (las partidas doradas siguen siendo la red de seguridad). |
| Ritmo | 1 mes simulado ≈ 1 semana real. El mes se cierra por avance (casos atendidos y reporte abierto), no por reloj. | Igual que el plan. |
| Moneda | Pesos mexicanos como base; también se puede ver en dólares. | La simulación calcula todo en **MXN**, la moneda base de la empresa. La pantalla puede mostrar **USD** con un tipo de cambio fijo y versionado dentro de los supuestos (por ejemplo, `fx.usd_mxn` en `assumptionsVersion`). No es una cotización en vivo, y la pantalla dice «tipo de cambio de referencia». La preferencia va en Ajustes. Cambiarla nunca recalcula la empresa. |
| Contenido | Yo redacto los casos y Oziel los aprueba. Además se construye un **motor de casos en vivo con IA** que genere casos propios de cada sector e industria. | Nueva fase P1-C «Motor de casos» (sección 3). |
| Foco de lanzamiento | **Alimentos y bebidas, Autopartes, Restaurantes, Software, Manufactura, Retail y Logística.** | Se reemplaza la matriz §5.2 del plan (sección 2). |

---

## 2. Matriz del foco de lanzamiento

> Actualizada al catálogo v2 (lógica SCIAN, corrección de Oziel del 31-oct-2026). Ver `arquitectura-universal.md` §9.

Leyenda:
- **Listo**: casos aprobados hoy.
- **Paquete nuevo**: sus casos salen del motor de casos y de redacción, con aprobación.
- **Próximamente**: se ve en el selector, pero no se puede elegir.

| Sector → Industria (id en `career/taxonomy.ts`, catálogo v2) | Paquete hoy | PYME | Startup en operación | Establecida |
|---|---|---|---|---|
| Manufactura → Alimentos y bebidas (`manufactura/alimentos_bebidas`) | Cumbre | Paquete nuevo (escalar montos) | Próximamente | **Listo** |
| Manufactura → Autopartes (`manufactura/autopartes`) | Forja | Paquete nuevo | Próximamente | **Listo** |
| Restaurantes y servicios de alimentos → Restaurantes (`restaurantes_alimentos/restaurantes`) | Brasa | Paquete nuevo | Próximamente | **Listo** |
| Tecnología e información → Software y SaaS (`tecnologia_informacion/software_saas`) | — | Paquete nuevo | **Paquete nuevo (prioridad: el ejemplo de Nexo Labs)** | Paquete nuevo |
| Manufactura → Manufactura industrial general (`manufactura/manufactura_general`) | — (familia de Forja) | Paquete nuevo | Próximamente | Paquete nuevo |
| Comercio → Retail (`comercio/retail`) | — (familia de Brasa en sucursales) | Paquete nuevo | Paquete nuevo (e-commerce DTC) | Paquete nuevo |
| Transporte y almacenamiento → Logística y distribución (`transporte_almacenamiento/logistica_distribucion`) | — | Paquete nuevo | Paquete nuevo (última milla) | Paquete nuevo |
| Los otros 12 sectores del catálogo v2 | — | Próximamente | Próximamente | Próximamente |

En la primera taxonomía (PR P0-B1) solo quedan jugables las 3 combinaciones «establecida» que ya tienen casos. La PYME de botanas, autopartes y restaurantes se abre cuando se escalen los montos de sus casos (no es lo mismo un crédito de $40 M que uno de $4 M). Así nunca entra nadie a una simulación incoherente.

---

## 3. Motor de casos en vivo (Atlas §2, §7, §8.4, §8.5 y §11)

**Principio del Atlas que se respeta:**
- La IA **propone y narra**.
- El **motor determinista elige y calcula**.
- La IA nunca decide saldos, multas, XP ni «la respuesta correcta».

### 3.1 Piezas

1. **Biblioteca de semillas** (`lib/ceo/career/seeds.ts`). Son las 160 semillas del Atlas (20 familias × 8), cada una con su id (`CEO-A01` … `EXT-T08`), su tensión, sus ramas sugeridas, competencias y la Academy ligada, más las familias e industrias compatibles. Son datos y se pueden auditar.
2. **Plantilla de caso** (`ScenarioTemplate`, Atlas §8.4). Lleva:
   - contexto y requisitos previos (hechos, personas, restricciones de caja);
   - disparador (interno, diferido o hipotético);
   - de 2 a 4 opciones, cada una con su `effectRuleId`;
   - reacciones inmediatas;
   - ramas diferidas con condición y retraso en días simulados;
   - rúbrica y lección.
   Los casos actuales (`Item`) y los episodios ejecutivos se convierten a este contrato sin perder nada.
3. **Reglas de efecto** (`effect-rules.ts`). Es un catálogo cerrado de efectos económicos y de índices: «descuento comercial: −x puntos de margen sobre la participación del cliente», «contratación: nómina +y desde el mes n y capacidad +z desde el mes n+2», «marketing: gasto inmediato y demanda con retraso». La IA solo elige reglas que existen y propone parámetros dentro de rangos. El motor valida y calcula.
4. **Generador (IA)**. Recibe una semilla y la industria, el tipo, la etapa, el estado de la empresa, el elenco y las decisiones pasadas. Escribe una instancia candidata: mensaje con la voz del personaje, opciones y vocabulario de la industria. Usa el mismo proveedor de IA y los mismos límites que los episodios (`ai.ts`, cuotas en `ceo.ai_calls`).
5. **Compilador y validador**. Comprueba:
   - el esquema;
   - que los personajes existan;
   - que no se mencionen cosas que la empresa no tiene (segunda planta, filial);
   - que ninguna opción sea dominante (ya existe `dominates()` en `engine.ts`);
   - que los efectos solo usen reglas del catálogo dentro de su rango;
   - que no queden variables sin resolver ni nombres fijos filtrados.
6. **Juez pedagógico** (Atlas §11.2). Califica 8 dimensiones de 0 a 3. Si duda en realismo, evidencia o trazabilidad, **no se publica** y entra un caso escrito como respaldo.
7. **Aprobación y congelado**:
   - **Primera etapa:** los casos generados se aprueban por lote antes de llegar al jugador. Se generan, Oziel o yo los revisamos y quedan en el banco como `approved`.
   - **Segunda etapa:** generación en vivo por jugador, con el juez automático y muestreo humano.
   - En ambas etapas, la instancia entregada se congela (`ScenarioInstance`: versión de plantilla, semilla, variables) y nunca se reescribe.
8. **Orquestador** (Atlas §7.2). Es un selector determinista y auditable que elige el siguiente caso entre los aprobados y elegibles. Pesa:
   - consecuencias pendientes;
   - la competencia que más hay que practicar (mastery);
   - el estado de la empresa y la etapa;
   - la variedad de canales, personas y familias;
   - la fatiga.
   La variación sale de una semilla reproducible. No hay un puntaje opaco.

### 3.2 Lo que resuelve

Con los 55 casos actuales, una empresa alcanza para unos 3 meses simulados. Con las semillas, los paquetes por familia y la generación aprobada por lote, cada una de las 7 industrias del foco puede tener desde su lanzamiento al menos 40 casos aprobados, y crecer sin reescribir el motor.

---

## 4. MÊTIS World Events (Atlas §6 y §9.3)

Va **después** del motor de casos, en este orden, y nunca conecta una fuente en vivo sin revisar licencias y seguridad:

1. **Eventos hipotéticos sin conexión** (Atlas F3). Una biblioteca de arancel, huracán, bloqueo logístico, devaluación, ransomware e inflación. El motor de exposición solo los activa si la empresa ficticia tiene activos, proveedores o rutas expuestos. Llevan la etiqueta «Ejercicio hipotético · No corresponde a una alerta vigente», y la probabilidad se marca como «dentro del ejercicio».
2. **Piloto en vivo controlado** (Atlas F4). Se conectan 1 o 2 fuentes oficiales abiertas (avisos del NHC/SMN y datos de la OMC). Los casos se aprueban a mano. La interfaz muestra la fuente, la fecha y lo que se simula. Hay un ajuste para activar o apagar «eventos del mundo real».

Reglas que no cambian:
- Dos relojes separados (real y simulado).
- Nunca se muestra una noticia futura respecto del periodo del jugador.
- Un evento expuesto no castiga el XP ni la evaluación.
- No hay más de 1 evento externo grande abierto a la vez.

Para esto la empresa necesita **datos de exposición ficticios** desde que se crea: ciudad base, ubicación de su planta, almacén o sucursales, proveedores clave y su región, y monedas de compra y venta. Se agregan al `CompanyProfile` en P0-B2.

---

## 5. Roadmap actualizado (uno por uno)

| # | PR | Estado |
|---|---|---|
| 1 | P0-A: plan | Hecho (#123) |
| 2 | **P0-B1: taxonomía de 21 sectores**, búsqueda por sinónimos, «Próximamente» bloquea, foco marcado, y esta adenda | **Este PR** |
| 3 | P0-B2: identidad de la empresa, esqueleto de reglas V4, plantillas de nombre (sin filtrar nombres fijos), exposición ficticia y moneda base con vista en USD | Siguiente |
| 4 | P0-B3: onboarding nuevo detrás de la bandera `carrera_continua` | |
| 5 | P0-C: motor de negocio y tablero Empresa | |
| 6 | P0-D: cierre mensual, primer reporte y decisión de caja con efecto diferido | |
| 7 | P1-A: contrato `ScenarioTemplate`, conversión de los 55 casos, semillas del Atlas y reglas de efecto | |
| 8 | P1-B: carrera continua (etapas, revisión del consejo sin game over, Journey por hitos) | |
| 9 | P1-C: motor de casos (generador, validador y juez), primero con aprobación por lote; paquetes de Software, Manufactura, Retail y Logística | |
| 10 | P1-D: orquestador adaptativo | |
| 11 | P2: eventos hipotéticos sin conexión, después el piloto en vivo, rotaciones como invitado y Arena | |

---

## 6. Lo que sí hay que decidir más adelante (no bloquea los PR 2–6)

Lo pide el Atlas §14. Cada punto lleva mi recomendación:

1. **Frecuencia de eventos externos:** como máximo 1 por mes simulado, con un ajuste para apagarlos y la categoría sensible desactivada por defecto.
2. **Fuentes y licencias:** solo fuentes oficiales abiertas al inicio (NHC, SMN, OMC). Nada de agregadores de prensa en el producto.
3. **Eventos reales y reloj simulado:** se insertan en el mes simulado activo como «inspirado en un acontecimiento real de [fecha]». Nunca se usan noticias futuras.
4. **Generación en vivo por jugador:** solo cuando la aprobación por lote demuestre calidad estable con el juez.
