import type { Transition, Variants } from "motion/react";

// Shared motion vocabulary so every animation in the app feels related.
export const spring: Transition = { type: "spring", stiffness: 520, damping: 38, mass: 0.7 };
export const softSpring: Transition = { type: "spring", stiffness: 260, damping: 30 };
export const easeOut = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOut } },
};

export const stagger = (step = 0.05, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
});

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
