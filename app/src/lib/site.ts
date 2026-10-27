/**
 * Datos públicos de la marca y el dominio. Un solo lugar para cambiarlos.
 * Dominio principal: metisalign.mx · metisalign.com redirige aquí (Vercel → Domains).
 * metis.ceo sirve mêtis CEO: «/» es su landing (/simulador) y el resto se reescribe hacia /ceo.
 * metisalign.app (dominio anterior de CEO) manda a metis.ceo llevándose el avance guardado en el navegador.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.metisalign.mx").replace(/\/$/, "");
export const CONTACT_EMAIL = "hola@metisalign.mx";
export const DEFAULT_EMAIL_FROM = "mêtis <recordatorios@metisalign.mx>";
/** Contacto público de mêtis CEO (landing y app de metis.ceo). */
export const CEO_CONTACT_EMAIL = "hola@metis.ceo";
export const CEO_URL = (process.env.NEXT_PUBLIC_CEO_URL ?? "https://www.metis.ceo").replace(/\/$/, "");
