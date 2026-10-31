# Piloto P0-B · Negociación SuperNorte

Estado: **aprobado y publicado en la carrera normal** (versión 1.0.0, reglas v3). Llega solo en temporadas nuevas de Botanas Cumbre y cuenta para indicadores y XP. Detalle en `arquitectura-p0.md` §8.1.

## Qué es

Es el primer caso completo del nuevo formato (adenda v3.3). Una sola tarjeta continua contiene todo esto:

- Preparación de 3 minutos, con opción de pausar o de jugar sin reloj. Puedes hacer hasta 2 consultas de datos y 1 consulta a tu equipo.
- De 4 a 6 decisiones conectadas: postura, propuesta, objeción, defensa interna, cierre y plan de seguimiento.
- Cada decisión se puede responder con opciones o con tus palabras. Con tus palabras, el caso te muestra qué entendió y espera a que confirmes.
- En la propuesta y en el cierre ajustas términos (descuento, promoción y plazo). Mientras mueves los controles ves el margen y la caja que te costaría.
- Al cerrar: lo acordado, los números, el efecto en la empresa (solo vista previa, no se aplica a la temporada), los compromisos con responsable, los riesgos abiertos, lo que estuvo fuera de tu control, lo que sigue, cómo decidiste (rúbrica) y el enlace a la lección de Academy.
- El XP se otorga una sola vez por caso.

## Datos nuevos que necesitan tu visto bueno

Estos datos no estaban en el caso original. Los agregué para que las cuentas cierren.

| Dato | Valor propuesto | Para qué se usa |
|---|---|---|
| Margen de contribución del volumen adicional | 19% | Cuánto aporta vender más a SuperNorte |
| Capacidad utilizada de la planta | 72% | Justifica que hay espacio para más volumen |
| Línea de crédito disponible | $14 M al 12% anual | Financiar el plazo más largo |
| Cuota de exhibición (si se paga) | $1.5 M | Opción de pagar por el espacio |
| Probabilidad de que la regional sí pueda surtir | 35% | Factor de suerte reproducible, que se explica al cierre |

## Modelo económico (todo declarado, sin nada oculto)

- 1 punto de descuento o de promoción equivale a $1.27 M al año (1% de los $127 M que se venden a SuperNorte).
- Cada día extra de plazo equivale a unos $0.35 M de capital de trabajo, y financiarlo cuesta 12% al año. Pasar de 60 a 90 días equivale a $10.4 M.
- Perder un frente cuesta unos $10.9 M de ventas si es en 40 tiendas, y unos $38 M si es en las 140.
- SuperNorte acepta si el valor de tu oferta alcanza lo que Sofía necesita. Lo que necesita depende de tus decisiones: baja si le muestras la rotación, sube si la amenazas o si la regional sí tiene capacidad.

## Las dos rutas de muestra

| | Ruta corta: aceptar todo | Ruta larga: entender y construir |
|---|---|---|
| Decisiones | 5 | 6 |
| Acuerdo | 4 pts de descuento, 90 días y cuota de $1.5 M | 1.5 pts de descuento, 1.5 pts de promoción ligada a sell-out y 75 días |
| Efecto neto anual | −$7.8 M | −$4.4 M |
| Margen de la cuenta | 7.1% → 3.1% | 7.1% → 4.1% |
| Lo que sigue | Caja (30 días) y otras cadenas piden lo mismo (14 días) | Corte de la promoción (21 días), caja (30 días) y revisión semestral (180 días) |
| XP | 140 | 160 |

Las dos rutas cierran el trato. La diferencia está en cuánto cuesta y en qué compromisos quedan. Además, hay rutas sin acuerdo y rutas de acuerdo parcial, en las que se pierde un frente en 40 tiendas. En total, el validador recorre **4,753 finales distintos** sin encontrar errores.

## Cómo probarlo

1. Ve a **Ajustes**, activa el **modo prueba** y elige **Abrir Negociación SuperNorte**.
2. Elige «Abrir el caso» (con reloj) o «Abrir sin reloj».
3. Para jugarlo de nuevo, usa **Ajustes → Reiniciar el caso**.

## IA

- La IA solo hace tres cosas: clasificar tu pregunta para elegir un dato ya autorizado, redactar la opinión del colaborador sin dar la respuesta y sin inventar cifras, y acercar tu texto libre a una opción.
- La IA no puede cambiar hechos ni números del caso.
- Está **apagada** hasta que la apruebes, y además depende de la bandera `episodes` en producción. Sin IA, todo funciona con palabras clave.
- No genera gasto nuevo.
