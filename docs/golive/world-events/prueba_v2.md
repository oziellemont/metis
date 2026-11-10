# Prueba completa · World Events v2

**SIMULACIÓN (ejercicio hipotético). No es un acontecimiento real.** Todas las cifras de este documento las calculó el motor del juego con `scripts/prueba-world-v2.test.ts` (archivo de datos: `prueba_v2.json`). Ninguna cifra la escribió la IA ni una persona.

Por qué es simulación: revisamos los avisos reales de GDACS para Campeche. Ciclones como ALBERTO-24, NADINE-24, GRACE-21 y ZETA-20 solo dejaron a la ciudad en zona verde (vientos de 60 km/h), y no hay inundaciones registradas en México entre 2021 y 2026. Un caso con zona roja en Campeche hoy sería inventado, así que se etiqueta como ejercicio.

## 1. Inundación en Campeche

- Empresa: Miniacería integrada (plantilla miniaceria_integrada_v2).
- Sede afectada: Planta de corte y doblado de Campeche (12 % de las entregas, inventario de $9,000,000).
- Acontecimiento: Inundación de ejercicio en Campeche · Lluvias intensas: desbordamiento esperado en 48 horas (hipotético) · zona roja · desenlace en 2 días · reglas v2.

**Lo que ve el jugador:** «Inundación de ejercicio en Campeche: Planta de corte y doblado de Campeche (surte al sureste) en la zona de riesgo»

> Ejercicio hipotético: imagina que Ejercicio de mêtis reporta Inundación de ejercicio en Campeche (Lluvias intensas: desbordamiento esperado en 48 horas (hipotético)). No es un acontecimiento real.
>
> Según el área inundada que reporta la fuente, quedan expuestas: Planta de corte y doblado de Campeche (surte al sureste) (zona roja). El agua puede subir o bajar en los próximos días.
>
> Hay una parte del daño que nadie puede evitar si el fenómeno llega con fuerza. Lo que decidas cambia el resto: seguridad del personal, continuidad de la operación, inventario, proveedores, clientes y caja. Cada frente cubierto cuesta; cada frente sin cubrir tiene consecuencias después.
>
> Lo que pase en tu empresa es una simulación con las reglas del motor. Plazo para decidir: 2 días.
>

### Opciones y consecuencias (día 120 contra la misma empresa sin el acontecimiento)

| Opción | Costo de prepararse | Caja día 60 | Caja día 120 | Resultado económico (capital) día 120 | Seguridad | Clientes |
|---|---|---|---|---|---|---|
| Protocolo de inundación: personas e instalaciones | $120,000 | −$1,703,495 | −$4,892,886 | −$3,196,814 | +0.01 | -0.04 |
| Protocolo, más inventario y abasto | $380,000 | +$1,384,495 | −$1,768,765 | −$1,228,889 | +0.02 | -0.04 |
| Plan completo de seis frentes | $560,000 | −$624,436 | −$1,039,112 | −$689,493 | +0.03 | +0.01 |
| Monitorear y seguir operando | $0 | −$1,339,913 | −$4,956,240 | −$3,256,849 | -0.06 | -0.04 |

**Protocolo de inundación: personas e instalaciones**

- Inevitable: 5 días sin surtir desde la sede inundada (12 % de las entregas), reparaciones inevitables por $400,000.
- Dependió de la decisión: Sin proteger inventario: producto dañado por $2,700,000. Sin asegurar proveedores: chatarra de emergencia 4 % más cara por 20 días.
- Lo que viene: Sin aviso a clientes: entregas incumplidas sin explicación; compran 3 % menos durante un mes. El seguro paga $160,000 (40 % de las reparaciones) en 90 días.
- Indicadores del jugador (día 120): {'caja': 0, 'margen': 1, 'equipo': 4, 'clientes': 1, 'consejo': 1} · sin acontecimiento: {'caja': 1, 'margen': 1, 'equipo': 4, 'clientes': 2, 'consejo': 1}

**Protocolo, más inventario y abasto**

- Inevitable: 5 días sin surtir desde la sede inundada (12 % de las entregas), reparaciones inevitables por $400,000.
- Lo que viene: Sin aviso a clientes: entregas incumplidas sin explicación; compran 3 % menos durante un mes. El seguro paga $160,000 (40 % de las reparaciones) en 90 días.
- Indicadores del jugador (día 120): {'caja': 1, 'margen': 1, 'equipo': 5, 'clientes': 1, 'consejo': 1} · sin acontecimiento: {'caja': 1, 'margen': 1, 'equipo': 4, 'clientes': 2, 'consejo': 1}

**Plan completo de seis frentes**

- Inevitable: 5 días sin surtir desde la sede inundada (12 % de las entregas), reparaciones inevitables por $400,000.
- Lo que viene: El seguro paga $280,000 (70 % de las reparaciones) en 30 días.
- Indicadores del jugador (día 120): {'caja': 1, 'margen': 1, 'equipo': 5, 'clientes': 2, 'consejo': 1} · sin acontecimiento: {'caja': 1, 'margen': 1, 'equipo': 4, 'clientes': 2, 'consejo': 1}

**Monitorear y seguir operando**

- Inevitable: 5 días sin surtir desde la sede inundada (12 % de las entregas), reparaciones inevitables por $400,000.
- Dependió de la decisión: Sin asegurar la continuidad: 4 días más sin surtir desde la sede afectada. Sin proteger inventario: producto dañado por $2,700,000. Sin asegurar proveedores: chatarra de emergencia 4 % más cara por 20 días.
- Lo que viene: Sin aviso a clientes: entregas incumplidas sin explicación; compran 3 % menos durante un mes. Personal expuesto durante el fenómeno: baja la seguridad y la confianza del equipo. El seguro paga $160,000 (40 % de las reparaciones) en 90 días.
- Indicadores del jugador (día 120): {'caja': 0, 'margen': 1, 'equipo': 2, 'clientes': 1, 'consejo': 1} · sin acontecimiento: {'caja': 1, 'margen': 1, 'equipo': 4, 'clientes': 2, 'consejo': 1}

Cómo leerlo: ninguna opción deja a la empresa como si no hubiera pasado nada. La parte inevitable (5 días sin surtir desde Campeche y $400,000 de reparaciones) le toca a cualquiera. El plan de seis frentes cuesta más de entrada, pero es el que menos pierde. Monitorear no cuesta nada hoy y es el que más pierde. En los indicadores la parte inevitable no se le cobra al jugador; lo que dejó sin cubrir, sí (por ejemplo, el indicador de equipo baja de 4 a 2 con monitorear).

## 2. Arancel de EE. UU. al acero

- Empresa: Miniacería integrada con contrato de exportación DAP a Houston (12 t diarias de palanquilla a $11,400, dentro de la capacidad libre de la planta).
- Acontecimiento: EE. UU. sube el arancel al acero (ejercicio) · Arancel de EE. UU. 50 % → 60 % (hipotético).
- Quién paga: con entrega DAP, el arancel lo paga el comprador de Houston (importador de registro). A la empresa no se le cobra directo; le llega por precio y volumen.

| Opción | Lo que pasa con el contrato | Caja día 150 | Resultado económico día 150 |
|---|---|---|---|
| Mantener el precio pactado y dejar que el comprador absorba el arancel | pasa de 12 a 10.1 t diarias | −$249,969 | −$200,061 |
| Compartir el golpe: 4 % de descuento por 120 días | pasa de 12 a 11.5 t diarias | −$596,140 | −$397,746 |
| Redirigir la mitad del volumen al mercado nacional | pasa de 6 a 5.8 t diarias | −$386,545 | −$326,982 |
| Ofrecer entrega DDP: tu empresa importa y paga el arancel | pasa de 12 a 12 t diarias | −$1,556,198 | −$1,257,317 |

Cómo leerlo: el 4 % de volumen que se pierde de todos modos es la parte inevitable. Con este margen, mantener el precio resulta lo menos costoso: el descuento del 4 % sobre todo el volumen cuesta más que el volumen que se pierde. Ofrecer DDP sostiene las toneladas, pero la empresa pasa a pagar el arancel y es por mucho lo más caro. El motor no da una respuesta «correcta» fija: depende del margen y del contrato de cada partida.

Medidas reales verificadas en el Federal Register (alimentan el tablero; solo abre caso el cambio de tasa más reciente y vigente de los últimos 120 días, y solo si la partida exporta hoy):

| Proclamación | Vigencia | Cambio |
|---|---|---|
| 10896 (FR 2025-02833) | 12/03/2025 | Termina el acuerdo con México: 25 % |
| 10947 (FR 2025-10524) | 04/06/2025 | 25 % → 50 % |
| 11021 (FR 2026-06960) | 06/04/2026 | 50 % sobre valor completo (sin cambio de tasa: radar) |
| 11032 (FR 2026-11314) | 08/06/2026 | Derivados y contenido T-MEC; acero sigue en 50 % (radar) |

## 3. Duplicados, avisos y partidas existentes (pruebas automáticas)

- El mismo acontecimiento abre una sola vez; una revisión igual o menor no reabre; ya decidido, nada lo reabre.
- Aviso al celular y correo: una sola clave por acontecimiento y revisión (`world:<id>:<rev>`); los ejercicios nunca avisan; sin la preferencia activada no llega nada.
- Partidas existentes: 33 situaciones guardadas con las reglas anteriores dan exactamente el mismo resultado (prueba `legacy.test.ts`). Las reglas v2 solo aplican a acontecimientos que se abran desde ahora.
