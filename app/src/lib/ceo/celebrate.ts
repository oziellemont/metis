/**
 * Celebración de mêtis CEO: confeti sobrio con los colores de la marca y un tono corto de dos notas
 * (estilo «pago aprobado»). Sin dependencias: canvas + Web Audio.
 *
 * - Respeta «reducir movimiento» del sistema (sin confeti; el tono sí suena si está activo).
 * - El sonido se puede apagar en Ajustes (se guarda en este dispositivo).
 * - Las funciones puras (`burstOf`, `stepParticle`, `chimeNotes`) se prueban en celebrate.test.ts.
 */

export type CelebrationKind = "appointment" | "company" | "change" | "lesson";

export const BRAND_COLORS = ["#4F3FE0", "#6D5DF6", "#14C98E", "#C9C2FA", "#171A3A"] as const;

/** Intensidad por tipo de logro: el nombramiento es el más grande; una lección, apenas un destello. */
export const INTENSITY: Record<CelebrationKind, { count: number; spread: number; duration: number }> = {
  appointment: { count: 90, spread: 1, duration: 2200 },
  company: { count: 70, spread: 0.9, duration: 2000 },
  change: { count: 55, spread: 0.8, duration: 1800 },
  lesson: { count: 34, spread: 0.6, duration: 1500 },
};

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; rot: number; vr: number;
  color: string; shape: "rect" | "dot";
}

/** Generador pseudoaleatorio determinista (mulberry32) para poder probar el confeti. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ráfaga desde arriba al centro, en abanico hacia abajo. Coordenadas en px del viewport. */
export function burstOf(kind: CelebrationKind, width: number, height: number, rand: () => number = Math.random): Particle[] {
  const { count, spread } = INTENSITY[kind];
  const cx = width / 2, cy = Math.min(height * 0.28, 260);
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.1 * spread;
    const speed = 5 + rand() * 7;
    const dot = rand() < 0.3;
    const size = dot ? 4 + rand() * 2 : 5 + rand() * 4;
    return {
      x: cx + (rand() - 0.5) * 40, y: cy,
      vx: Math.cos(angle) * speed * (0.6 + spread * 0.6), vy: Math.sin(angle) * speed,
      w: size, h: dot ? size : size * 0.42, rot: rand() * Math.PI, vr: (rand() - 0.5) * 0.3,
      color: BRAND_COLORS[i % BRAND_COLORS.length], shape: dot ? "dot" : "rect",
    };
  });
}

/** Un paso de física: gravedad suave y resistencia del aire. */
export function stepParticle(p: Particle, dt = 1): Particle {
  const drag = Math.pow(0.985, dt);
  return { ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vx: p.vx * drag, vy: p.vy * drag + 0.22 * dt, rot: p.rot + p.vr * dt };
}

/** Las dos notas del tono (Hz, inicio en s, duración en s). Sube una quinta: suena a «aprobado». */
export function chimeNotes(kind: CelebrationKind): { f: number; at: number; dur: number; gain: number }[] {
  const g = kind === "lesson" ? 0.07 : 0.1;
  return [
    { f: 1318.51, at: 0, dur: 0.5, gain: g },     // Mi 6
    { f: 1975.53, at: 0.11, dur: 0.75, gain: g }, // Si 6
  ];
}

// ───────────────────────────────────────────── preferencias (en este dispositivo)
const SOUND_KEY = "metis-ceo:sound";
export function soundOn(): boolean {
  try { return localStorage.getItem(SOUND_KEY) !== "0"; } catch { return true; }
}
export function setSoundOn(on: boolean) {
  try { localStorage.setItem(SOUND_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ───────────────────────────────────────────── navegador
let audioCtx: AudioContext | null = null;
export function playChime(kind: CelebrationKind = "company") {
  if (typeof window === "undefined" || !soundOn()) return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx ?? new Ctx();
    const ctx = audioCtx;
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime + 0.02;
    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(ctx.destination);
    for (const n of chimeNotes(kind)) {
      for (const [mult, amp] of [[1, 1], [2, 0.18]] as const) { // fundamental + un armónico suave
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = n.f * mult;
        const s = t0 + n.at;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(n.gain * amp, s + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, s + n.dur);
        o.connect(g).connect(out);
        o.start(s);
        o.stop(s + n.dur + 0.05);
      }
    }
  } catch { /* sin audio */ }
}

export function playConfetti(kind: CelebrationKind = "company") {
  if (typeof document === "undefined" || reducedMotion()) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth, H = window.innerHeight;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.width = W * dpr; canvas.height = H * dpr;
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: `${W}px`, height: `${H}px`, pointerEvents: "none", zIndex: "60" });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(dpr, dpr);
  let ps = burstOf(kind, W, H);
  const { duration } = INTENSITY[kind];
  const start = performance.now();
  let last = start;
  const frame = (t: number) => {
    const el = t - start, dt = Math.min(2.5, (t - last) / 16.67);
    last = t;
    ctx.clearRect(0, 0, W, H);
    const fade = el > duration * 0.6 ? Math.max(0, 1 - (el - duration * 0.6) / (duration * 0.4)) : 1;
    ps = ps.map((p) => stepParticle(p, dt));
    for (const p of ps) {
      ctx.save();
      ctx.globalAlpha = fade * (p.color === "#171A3A" ? 0.55 : 0.9);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.shape === "dot") { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 0.6);
      ctx.restore();
    }
    if (el < duration) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

/** Confeti + tono. Llamar al lograr algo (nombramiento, empresa aprobada, reto de cambio, lección). */
export function celebrate(kind: CelebrationKind = "company") {
  playConfetti(kind);
  playChime(kind);
}

/** Celebrar una sola vez por logro (p. ej. al abrir el veredicto aprobado). */
export function celebrateOnce(key: string, kind: CelebrationKind) {
  try {
    const k = `metis-ceo:celebrated:${key}`;
    if (localStorage.getItem(k)) return;
    localStorage.setItem(k, "1");
  } catch { /* ignore */ }
  celebrate(kind);
}
