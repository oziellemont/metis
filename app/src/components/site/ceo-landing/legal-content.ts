/**
 * Aviso de privacidad y términos de MÊTIS CEO.
 * Describe solo lo que la app hace hoy (ver docs/landing-ceo.md). Debe revisarlo un abogado
 * antes de activar cobros; si cambia lo que se recaba o con quién se comparte, se actualiza aquí.
 */
import { CEO_CONTACT_EMAIL } from "../../../lib/site";

export const LEGAL_UPDATED = "28 de octubre de 2026";

export interface LegalSection { title: string; body: string[]; items?: string[] }
export interface LegalDoc { title: string; description: string; intro: string; sections: LegalSection[] }

export const PRIVACY: LegalDoc = {
  title: "Aviso de privacidad",
  description: "Qué datos recaba MÊTIS CEO, para qué los usa y cómo ejercer tus derechos.",
  intro: "Este aviso explica qué datos personales trata MÊTIS CEO, el simulador de decisiones ejecutivas disponible en metis.ceo, para qué los usa y cómo puedes ejercer tus derechos, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.",
  sections: [
    {
      title: "Responsable",
      body: [`El responsable del tratamiento de tus datos es mêtis, con domicilio en Monterrey, Nuevo León, México. Para cualquier asunto relacionado con tus datos escribe a ${CEO_CONTACT_EMAIL}.`],
    },
    {
      title: "Datos que recabamos",
      body: ["Puedes probar la decisión de ejemplo de la página principal sin crear cuenta; esa prueba no se guarda ni nos envía datos que te identifiquen. Para usar el simulador necesitas una cuenta, que creas con Google o con tu correo y una contraseña. Con tu cuenta y las funciones opcionales que actives, tratamos:"],
      items: [
        "Correo electrónico, para iniciar sesión y, si lo activas, para avisarte cuando llegan asuntos nuevos.",
        "Nombre y alias. El alias es lo único que aparece en el ranking.",
        "Tu avance en el simulador: decisiones, resultados, lecciones, racha y configuración de horario y zona horaria.",
        "Teléfono, solo si activas los avisos por WhatsApp.",
        "Perfil profesional opcional (puesto, áreas, años de experiencia, industria y objetivo). Puedes omitir cualquier pregunta.",
        "Registros técnicos de uso dentro de la app cuando tienes sesión iniciada, para medir qué funciones se usan y corregir errores.",
      ],
    },
    {
      title: "Para qué los usamos",
      body: ["Usamos tus datos para darte el servicio: guardar tu partida entre dispositivos, enviarte los avisos que elijas, mostrar el ranking con tu alias y adaptar el orden de las lecciones a tu perfil. También para mejorar el producto con información agregada. No vendemos tus datos ni los usamos para publicidad de terceros."],
    },
    {
      title: "Con quién los compartimos",
      body: ["Para operar el servicio usamos proveedores que tratan datos por cuenta nuestra y bajo sus propias medidas de seguridad. Algunos están fuera de México:"],
      items: [
        "Supabase, para la cuenta y la base de datos.",
        "Vercel, para alojar la aplicación.",
        "Resend, para enviar correos.",
        "Twilio, para enviar avisos por WhatsApp, solo si los activas.",
        "OpenAI, para comentar los textos que escribas dentro del simulador, solo cuando esa función está activa en tu cuenta. Se envía tu texto y el contexto del caso, no tu correo ni tu teléfono.",
      ],
    },
    {
      title: "Almacenamiento en tu dispositivo",
      body: ["Usamos el almacenamiento local de tu navegador para guardar tu partida y preferencias, y una cookie de sesión cuando inicias sesión. No usamos cookies de publicidad."],
    },
    {
      title: "Tus derechos",
      body: [`Puedes acceder a tus datos, corregirlos, pedir que los eliminemos u oponerte a un uso específico (derechos ARCO), así como revocar tu consentimiento. Escribe a ${CEO_CONTACT_EMAIL} desde el correo de tu cuenta indicando qué solicitas. Te respondemos en un máximo de 20 días hábiles. Si eliminas tu cuenta, borramos tu partida y tus datos de contacto.`],
    },
    {
      title: "Cambios a este aviso",
      body: ["Si cambia lo que recabamos o con quién lo compartimos, actualizaremos este aviso y la fecha de arriba. Si el cambio es relevante, te avisaremos por correo o dentro de la app."],
    },
  ],
};

export const TERMS: LegalDoc = {
  title: "Términos de uso",
  description: "Las reglas para usar MÊTIS CEO.",
  intro: "Estos términos regulan el uso de MÊTIS CEO en metis.ceo. Al usar el simulador aceptas estas condiciones. Si no estás de acuerdo, no lo uses.",
  sections: [
    {
      title: "Qué es MÊTIS CEO",
      body: ["Es un simulador educativo de decisiones ejecutivas. Las empresas, personas y situaciones son ficticias, aunque se inspiran en casos de negocio comunes. Los resultados del simulador no predicen lo que pasaría en una empresa real."],
    },
    {
      title: "No es asesoría profesional",
      body: ["El contenido sirve para practicar y aprender. No es asesoría legal, financiera, fiscal ni de recursos humanos. Antes de tomar decisiones reales, consulta a un profesional."],
    },
    {
      title: "Tu cuenta",
      body: ["Para usar el simulador necesitas una cuenta. Eres responsable de mantener el acceso a tu correo, de cuidar tu contraseña y de la actividad en tu cuenta. Tu alias aparece en el ranking: elige uno que no ofenda ni se haga pasar por otra persona."],
    },
    {
      title: "Uso permitido",
      body: ["Usa el servicio de forma personal y razonable. No está permitido:"],
      items: [
        "Intentar acceder a cuentas o datos de otras personas.",
        "Manipular el ranking o el simulador con herramientas automatizadas.",
        "Copiar, revender o redistribuir los casos, lecciones o textos del simulador.",
        "Escribir dentro del simulador contenido ilegal, ofensivo o datos personales de terceros.",
      ],
    },
    {
      title: "Propiedad intelectual",
      body: ["Los casos, personajes, textos, lecciones, diseño y marca MÊTIS son de mêtis. Te damos permiso de usarlos dentro del servicio para tu aprendizaje personal."],
    },
    {
      title: "Costo",
      body: ["El acceso actual no requiere pago ni tarjeta. Cualquier cargo requerirá que lo aceptes de forma expresa antes de que se aplique."],
    },
    {
      title: "Disponibilidad y cambios",
      body: ["Buscamos que el servicio funcione sin interrupciones, pero puede haber fallas o mantenimiento. Podemos ajustar contenidos y reglas del simulador para mejorarlo. Si cambiamos estos términos de forma relevante, te avisaremos."],
    },
    {
      title: "Responsabilidad",
      body: ["El servicio se ofrece tal como está. En la medida que permita la ley, mêtis no responde por decisiones que tomes fuera del simulador con base en su contenido."],
    },
    {
      title: "Ley aplicable",
      body: ["Estos términos se rigen por las leyes de México. Cualquier controversia se resolverá ante los tribunales competentes de Monterrey, Nuevo León."],
    },
  ],
};
