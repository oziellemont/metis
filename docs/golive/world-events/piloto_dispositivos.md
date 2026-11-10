# Prueba en cuentas piloto · escritorio, iPhone y Android

Esto no se puede hacer desde el servidor de desarrollo: necesita los dispositivos reales. Toma 15 minutos por dispositivo.

## Antes de empezar (una vez)

1. Correr en Supabase la migración `0023_ceo_secretos_servidor.sql` (si no se ha corrido `0022_ceo_avisos_celular.sql`, primero esa).
2. Abrir `https://www.metis.ceo/api/ceo/push`. Debe decir `"configured":true` y mostrar una llave pública. La privada nunca aparece.
3. Si en Vercel quedaron variables `VAPID_PRIVATE_KEY` o `NEXT_PUBLIC_VAPID_PUBLIC_KEY` de antes, borrarlas (las del mensaje anterior quedan retiradas) y volver a desplegar.

## En cada dispositivo

| Paso | Escritorio (Chrome o Edge) | iPhone (iOS 16.4 o más) | Android (Chrome) |
|---|---|---|---|
| Abrir | metis.ceo e iniciar sesión con la cuenta piloto | Safari → metis.ceo → Compartir → «Agregar a pantalla de inicio» → abrir desde el ícono | Chrome → metis.ceo |
| Activar | Ajustes → Avisos en el celular → Activar → Permitir | Igual, desde la app del ícono | Igual |
| Preferencia | Ajustes → «Acontecimientos reales en mi carrera» encendido | Igual | Igual |
| Ejercicio | Ajustes → Herramientas → «Inundación de ejercicio» (en la Miniacería integrada cae en Campeche) | Igual | Igual |
| Revisar | El caso llega con la etiqueta «Ejercicio hipotético», seis frentes en las opciones y «seguir operando» bloqueado donde aplica | Igual | Igual |
| Aviso | Un ejercicio NO debe mandar aviso al celular (correcto) | Igual | Igual |
| Decidir | Elegir una opción y adelantar el reloj 3 días: aparece «Impacto externo» con Inevitable / Dependió de tu decisión / Lo que viene | Igual | Igual |

## Qué confirmar

- Llega un solo caso por acontecimiento (abrir el mismo ejercicio dos veces no duplica: el segundo no entra mientras el primero siga abierto).
- Ningún aviso al celular por ejercicios. Los avisos reales llegan una sola vez por acontecimiento y revisión.
- En una cuenta piloto con una partida anterior, los números de lo ya decidido no cambian.

Si algo falla, anotar dispositivo, hora y captura, y mandarlo tal cual.
