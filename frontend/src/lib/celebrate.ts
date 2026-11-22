import confetti from "canvas-confetti";
import { prefersReducedMotion } from "./motion";

// A short, brand-coloured burst when a deal is won.
export const celebrate = (): void => {
  if (prefersReducedMotion()) return;
  const colors = ["#2563eb", "#159a6a", "#c9831a", "#7a56cf", "#ffffff"];
  const base = { spread: 70, startVelocity: 48, ticks: 220, gravity: 1.05, scalar: 0.95, colors, disableForReducedMotion: true, zIndex: 120 };
  confetti({ ...base, particleCount: 70, angle: 60, origin: { x: 0, y: 0.75 } });
  confetti({ ...base, particleCount: 70, angle: 120, origin: { x: 1, y: 0.75 } });
  setTimeout(() => confetti({ ...base, particleCount: 50, spread: 100, startVelocity: 35, origin: { x: 0.5, y: 0.35 } }), 180);
};
