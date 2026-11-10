# MÊTIS Assess v1 (piloto B2B)

Módulo aparte de MÊTIS CEO para que una empresa configure una evaluación por vacante, invite candidatos a resolver casos empresariales y reciba un tablero comparativo con competencias, evidencias de las decisiones y recomendaciones para revisión humana.

**Estado: piloto en validación. No usar para decidir contrataciones.** Toda vacante nace en modo «piloto» (la base no acepta otro modo) y todas las pantallas lo dicen.

## Qué incluye

Solo dos industrias, las más desarrolladas del motor: retail (cadena de conveniencia, Tiendas Al Paso) y acero (acería compacta, Aceros Huasteca). Ocho casos por industria, tomados de los casos ya calibrados del simulador. Todos los candidatos de una industria ven la misma empresa, el mismo día y los mismos casos, con las opciones en el mismo orden.

Las consecuencias de cada opción las calcula el motor de MÊTIS con los mismos comandos del simulador, a seis y doce meses. Ninguna IA califica. Cada caso se evalúa desde la misma foto de la empresa, para comparar a todos con el mismo criterio.

Cinco competencias con la misma regla en las dos industrias: criterio financiero, cuidado de la caja, personas y seguridad, clientes y proveedores, y visión de largo plazo. El área de cada caso define qué competencias puede medir y todo caso de seguridad mide además personas. Una competencia solo se reporta si al menos dos casos la miden con diferencias reales entre opciones. En retail, «clientes y proveedores» no alcanza ese mínimo y por eso no se ofrece para vacantes de retail.

El puntaje de cada competencia va de 0 a 100 y dice dónde quedó la opción elegida entre las disponibles del caso. El razonamiento escrito y el tiempo no cambian el puntaje: se muestran como evidencia y generan alertas (respuestas muy rápidas o muy breves, evaluación incompleta). Las recomendaciones son preguntas para la entrevista, nunca «contratar» o «descartar».

Las opciones que ponen en riesgo a personas siguen bloqueadas, igual que en el simulador.

## Seguridad y separación

Tablas nuevas `assess_*` (migración 0024) con RLS activo y sin acceso para usuarios: solo el servidor lee y escribe, después de validar al dueño de la vacante o el enlace del candidato. Del enlace del candidato solo se guarda su huella; el enlace se muestra una vez a la empresa y vence en 14 días. Hay una respuesta por candidato y caso, así que reintentos y doble clic no duplican. Assess no importa ni escribe nada de partidas, jugadores o avisos de MÊTIS CEO (hay una prueba que lo verifica).

## Cómo encenderlo para el piloto

1. Correr en Supabase `supabase/migrations/0024_assess_piloto.sql`. Para deshacer: `docs/sql/0024_revertir.sql`.
2. Agregar las cuentas piloto (el correo con el que la empresa entra a MÊTIS):
   `insert into public.assess_pilots (email, note) values ('correo@empresa.com', 'Piloto') on conflict do nothing;`
3. En Vercel, agregar la variable `ASSESS_ENABLED` con valor `1` y volver a desplegar. Sin esa variable, `/assess` responde «no encontrado».
4. Entrar a `metis.ceo/assess` con la cuenta piloto.

Para apagarlo de inmediato: quitar `ASSESS_ENABLED` en Vercel o borrar la cuenta de `assess_pilots`.

## Antes de usarlo para contratar

Falta validar con datos reales: consistencia entre evaluadores humanos y el tablero, estabilidad de los puntajes, revisión de sesgos y aviso de privacidad para candidatos. Mientras `ASSESS_VALIDATED` sea `false` en el código, el tablero se presenta solo como apoyo para la entrevista.

Ejemplo del tablero con perfiles simulados: `docs/assess/ejemplo_tablero.md`.
