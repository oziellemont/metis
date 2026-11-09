# Retail v2 · Cadena de tiendas de conveniencia

Estado: construido y probado, **apagado** (`RETAIL_V2_ENABLED = false` en `app/src/lib/ceo/growth/retail/params.ts`) hasta que Oziel autorice.

## Enfoque

Retail solo existe en modo **consolidada**: una cadena regional de tiendas de conveniencia abiertas 24 horas, del tipo OXXO o 7-Eleven. No hay modo startup ni negocios pequeños, como ferreterías o tiendas de barrio.

Empresa de la plantilla `conveniencia_regional_v2`, «Tiendas Al Paso»:

- 340 tiendas en Monterrey y su zona metropolitana, Saltillo y la periferia, con un CEDIS propio;
- 14 de esas tiendas tienen poco tráfico y apenas cubren sus costos;
- caja inicial de 110 M y deuda bancaria de 180 M;
- calibración del primer año: margen bruto de alrededor del 33 %, EBITDA de alrededor del 10 % y unos 490 tickets diarios por tienda.

## Motor

El motor usa partida doble en centavos, igual que Acería v2. Cada mes:

- se calculan las ventas por categoría, la merma y las comisiones de tarjeta;
- se pagan la nómina, la renta y la luz;
- el CEDIS surte las tiendas;
- se cierra el mes con impuestos, PTU y aguinaldo.

Cuando falta caja, los pagos se hacen por prioridad. Las consecuencias son reales:

- los proveedores pasan a cobrar de contado;
- el CEDIS deja de surtir tabaco, abarrotes y comida;
- refresqueras y cerveceras siguen surtiendo, pero solo de contado;
- la venta cae y la liquidez pasa de sana a alerta o a crisis.

## Casos y selección adaptable

Hay 26 casos en 8 áreas:

| Área | Casos |
|---|---|
| Operación | 3 |
| Abasto | 4 |
| Personal | 3 |
| Seguridad | 3 |
| Comercial | 4 |
| Expansión | 3 |
| Finanzas | 3 |
| Estrategia | 3 |

En los casos de seguridad la opción insegura está bloqueada y se explica por qué.

El selector decide qué caso sigue con estas reglas:

- solo considera los casos elegibles por fecha, estado de la empresa y decisiones previas (las continuaciones solo llegan después de la decisión que las abre);
- los ordena según el estilo del jugador, arriesgado o prudente;
- si hay pagos vencidos, el caso de liquidez va primero;
- la IA puede sugerir un caso, pero solo se acepta si es elegible.

Cada opción muestra una vista previa calculada por el motor contra no hacer nada.

## Validación

La sensibilidad se probó en 12 escenarios. Resultados:

- equilibrada gana 7, conservadora 4 y agresiva 1;
- ninguna estrategia gana siempre;
- la agresiva es la peor en los escenarios de costo alto y de competidor.

Hay recorridos completos de dos años con estilo arriesgado, equilibrado y prudente. Los tres terminan con liquidez sana y la contabilidad cuadrada.

Pruebas: `app/src/lib/ceo/growth/retail/*.test.ts`, 30 en total.

## Activación

Para activar Retail v2, cambiar `RETAIL_V2_ENABLED` a `true`. La combinación «comercio/retail» aparecerá entonces solo como consolidada.
