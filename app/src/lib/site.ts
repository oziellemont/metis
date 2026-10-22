/**
 * Datos públicos de la marca y el dominio. Un solo lugar para cambiarlos.
 * Dominio principal: metisalign.mx · metisalign.com redirige aquí (Vercel → Domains).
 * metisalign.app sirve mêtis CEO (la app de entrenamiento): el middleware reescribe ese host hacia /ceo.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.metisalign.mx").replace(/\/$/, "");
export const CONTACT_EMAIL = "hola@metisalign.mx";
export const DEFAULT_EMAIL_FROM = "mêtis <recordatorios@metisalign.mx>";
