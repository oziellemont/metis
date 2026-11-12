# MÊTIS 2.0 · Repositorio: archivos ajenos y paso a privado

Fecha de la revisión: 12 de noviembre de 2026. Todo lo que sigue es de solo lectura: no se borró ni se cambió nada del repositorio.

## 1. Inventario de archivos ajenos

### Qué son

El 31 de octubre de 2026 entraron al repositorio dos cambios que no vienen del trabajo de MÊTIS:

| Cambio | Autor | Mensaje | Qué agregó |
|---|---|---|---|
| `0f37a64` | ninja (ninja@ninjatech.ai) | «Update ninja v0.1.438» | 204 archivos |
| `cdf04e0` | ninja (ninja@ninjatech.ai) | «ninja-sync: auto-commit workspace changes» | 1 archivo vacío, `.ninja-git.lock` |

Son 205 archivos en total. En reportes anteriores escribí «unos 203»; la cifra exacta es esta.

Por su contenido, son el código interno de una herramienta de agentes de NinjaTech: mensajería, procesos, instalación de servicios, navegador automatizado, panel de control y documentación para agentes. No son datos tuyos ni parte de MÊTIS. Ninguno menciona a MÊTIS ni tu nombre.

| Carpeta o archivo | Archivos | Contenido |
|---|---|---|
| `messaging/` | 39 | Envío de mensajes, incluida una pasarela de WhatsApp con su propio `package.json` |
| `processes/` | 21 | Control de procesos de agentes |
| `agent-docs/` | 20 | Documentación interna para agentes |
| `infra/` | 19 | Instalación, actualización y 9 definiciones de servicios del sistema |
| `utils/` | 16 | Utilidades (audio, imágenes, costos) |
| `browser/` | 15 | Navegador automatizado |
| `agent_providers/` | 15 | Conexión con proveedores de modelos |
| `tools/` | 13 | Herramientas del agente. **En esta carpeta también viven 2 archivos de MÊTIS** (`plan_financiero.py`, `precio_scorecard.py`) |
| `services/` | 9 | Servicios de orquestación |
| `clients/` | 8 | Clientes de servicios externos |
| `dashboard/` | 7 | Panel de control |
| `core/` | 6 | Configuración y arranque |
| `avatars/` | 6 | Imágenes |
| Sueltos en la raíz | 10 | `.gitignore`, `VERSION`, `skills.zip` (205 archivos comprimidos, 2.5 MB), `constants.py`, `agents_config.py`, tres archivos `*_hook.py`, `stopped_length_prompt.txt`, `reports/.gitkeep` |
| `.ninja-git.lock` | 1 | Archivo vacío |

Peso total: 7.8 MB. Por tipo: 119 de Python, 23 de documentación, 19 de TypeScript, 9 definiciones de servicio, 8 de consola y el resto imágenes y configuración.

### Dependencias comprobadas

| Pregunta | Resultado |
|---|---|
| ¿La aplicación importa algo de esas carpetas? | No. Ningún archivo de `app/` las referencia. |
| ¿Las pruebas automáticas las usan? | No. La comprobación «pruebas» trabaja solo dentro de `app/`. |
| ¿Algún archivo ajeno está dentro de `app/`, `docs/` o `.github/`? | No. |
| ¿Alguien los modificó después de que entraron? | No. Los 204 siguen idénticos. |
| ¿Hay algo en la raíz que los ejecute solo? | No hay `package.json`, `Makefile` ni automatizaciones en la raíz. |
| ¿Este entorno de trabajo los necesita? | No hay servicios de esa herramienta corriendo aquí, y la carpeta de trabajo no depende de ellos. |

### Riesgos

| Riesgo | Detalle |
|---|---|
| Código de un tercero en un repositorio público | Es código interno de NinjaTech publicado sin que nadie lo decidiera. No expone a MÊTIS, pero no debería estar ahí. |
| Claves o contraseñas | Busqué los formatos más comunes de claves (OpenAI, GitHub, Slack, AWS, Google, llaves privadas, tokens firmados) en los archivos de texto y dentro de `skills.zip`. No encontré ninguna. Una búsqueda por formato no garantiza que no haya nada. |
| `.gitignore` de la raíz | Vino en ese mismo cambio. Hoy es el que evita que se suban archivos `.env` y bitácoras desde la raíz. **No se puede borrar sin más**: hay que sustituirlo por uno propio de MÊTIS. |
| Carpeta `tools/` mezclada | Borrar la carpeta completa se llevaría dos archivos de MÊTIS. La limpieza tiene que ser archivo por archivo. |
| Que vuelvan a aparecer | No sé qué entorno hizo esos dos cambios. Si sigue existiendo y sigue conectado a este repositorio, podría volver a subirlos. |
| Historial | Aunque se borren, seguirán visibles en el historial del repositorio. Quitarlos del historial es una operación aparte y más delicada, que no propongo. |

### Qué no pude comprobar

- De qué entorno salieron esos dos cambios ni si sigue activo.
- La configuración de Vercel (carpeta raíz del proyecto). El archivo `vercel.json` está dentro de `app/`, lo que indica que Vercel solo construye esa carpeta, pero no lo vi en el panel.

### Propuesta de limpieza (requiere tu autorización)

Un cambio independiente que:

1. Quite los 204 archivos y `.ninja-git.lock`, uno por uno contra la lista de este inventario.
2. Conserve `tools/plan_financiero.py`, `tools/precio_scorecard.py` y `README.md`.
3. Sustituya el `.gitignore` de la raíz por uno propio que siga protegiendo `.env` y bitácoras.
4. Agregue una prueba que falle si reaparece alguna de esas carpetas.
5. Pase la suite completa y confirme el despliegue antes y después.

No hago nada de esto hasta que lo autorices.

## 2. Paso del repositorio a privado

No puedo cambiar la visibilidad: el permiso que tengo no lo permite, y es una decisión tuya. Esto es lo que revisé y lo que hay que confirmar.

### Lo que no se afecta

| Punto | Resultado |
|---|---|
| Enlaces desde la aplicación al repositorio público | No hay ninguno. |
| Copias (forks), seguidores o estrellas que se perderían | Cero. |
| Páginas publicadas desde el repositorio | No hay. |
| Acceso de SuperNinja | La conexión está instalada para el repositorio `oziellemont/metis` de forma específica. Ese tipo de acceso no depende de que el repositorio sea público. Solo se puede confirmar después del cambio. |

### Lo que sí hay que confirmar antes

**Vercel: es el punto de mayor riesgo.**

La documentación de Vercel dice que el plan Hobby no admite colaboración en repositorios privados: solo despliega cambios cuyo autor sea el dueño de la cuenta. Hoy los cambios que llegan a `main` tienen como autor a `superninja-app[bot]`, no a ti. Si tu cuenta de Vercel está en el plan Hobby, es probable que al pasar a privado los despliegues de producción se bloqueen.

No puedo ver qué plan tienes. Necesito que lo revises en Vercel, en Settings y luego Billing.

- Si es **Pro**: no debería haber problema.
- Si es **Hobby**: hay que elegir entre pasar a Pro, dejar el repositorio público, o cambiar la forma de publicar para que los cambios lleven tu autoría. Esto último habría que diseñarlo y probarlo.

**GitHub: minutos de pruebas automáticas.**

En un repositorio público las pruebas automáticas son gratis. En uno privado se descuentan de la cuota del plan. Según la documentación de GitHub, el plan gratuito incluye el equivalente a unos 2,000 minutos al mes.

| Periodo | Corridas | Minutos estimados |
|---|---|---|
| Octubre de 2026 | 151 | 268 |
| 1 al 12 de noviembre de 2026 | 121 | 437 |

Al ritmo de noviembre serían unos 1,100 minutos al mes: cabe en la cuota, con margen moderado. La estimación sale de la hora de inicio y de fin de cada corrida, redondeada hacia arriba; la cifra oficial está en tu panel de facturación de GitHub. Si la cuota se agota y no hay forma de pago registrada, las pruebas dejan de correr hasta el mes siguiente.

**GitHub: reglas de protección de `main`.**

Entiendo que en el plan gratuito de GitHub las reglas de protección de rama no se aplican a repositorios privados, pero esto no lo comprobé en esta sesión: lo digo de memoria y conviene confirmarlo en la página de GitHub antes de hacer el cambio. Tampoco pude leer si `main` tiene alguna regla (mi permiso no lo permite). Si la tiene y lo anterior es cierto, dejaría de aplicarse.

### Lo que el cambio a privado no resuelve

El repositorio ha sido público desde su creación. Lo que ya se publicó pudo haber sido copiado. Pasar a privado protege lo que venga, no lo anterior.

### Orden propuesto

1. Revisas el plan de Vercel y me dices cuál es.
2. Según el plan, decidimos cómo queda la publicación.
3. Cambias la visibilidad en GitHub (Settings, General, Danger Zone, Change visibility).
4. De inmediato hago una prueba completa: leer el repositorio, subir una rama, abrir un cambio, ver que «pruebas» corre y que Vercel despliega una vista previa. El cambio de prueba no toca la aplicación.
5. Si algo falla, el repositorio se puede volver a público en el mismo lugar mientras se resuelve.

## 3. Hallazgo adicional: la comprobación «pruebas» en `main`

Al revisar el historial de corridas encontré que la comprobación pasó antes de fusionar los cambios #188 y #189, pero **falló en la corrida posterior sobre `main`** en ambos casos. En mis reportes dije que las comprobaciones habían pasado; era cierto para la revisión previa, y no revisé la posterior.

La causa es la misma las dos veces: una prueba antigua del simulador («separa estrategias…») tarda entre 3.5 y 5.1 segundos en los servidores de GitHub y el límite de fábrica es de 5. No detectó ningún error de contenido: las 1,990 pruebas restantes pasaron y el despliegue de producción se hizo. Otras dos pruebas están cerca del mismo límite (4.9 y 4.0 segundos).

Corrección: el límite por prueba sube a 20 segundos. No cambia lo que ninguna prueba verifica. A partir de ahora reviso también la corrida sobre `main` después de cada fusión.
