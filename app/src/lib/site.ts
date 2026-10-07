/**
 * Datos públicos de la marca y el dominio. Un solo lugar para cambiarlos.
 * Dominio principal: metisalign.mx · metisalign.com y metisalign.app redirigen aquí (configurado en Vercel → Domains).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://metisalign.mx").replace(/\/$/, "");
export const CONTACT_EMAIL = "hola@metisalign.mx";
export const DEFAULT_EMAIL_FROM = "mêtis <recordatorios@metisalign.mx>";
