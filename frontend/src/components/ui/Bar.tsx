import { motion } from "motion/react";
import { easeOut } from "../../lib/motion";

// A horizontal meter that grows from zero when it enters, and eases to new values.
export const Bar = ({ pct, color, height = 8, delay = 0, track = "var(--surface-3)", opacity = 1, minPct = 0 }: {
  pct: number;
  color: string;
  height?: number;
  delay?: number;
  track?: string;
  opacity?: number;
  minPct?: number;
}): JSX.Element => {
  const w = Math.max(pct > 0 ? minPct : 0, Math.min(100, pct));
  return (
    <div className="overflow-hidden rounded-full" style={{ background: track, height }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color, opacity }}
        initial={{ width: 0 }}
        whileInView={{ width: `${w}%` }}
        viewport={{ once: true, margin: "0px 0px -30px 0px" }}
        transition={{ duration: 0.8, delay, ease: easeOut }}
      />
    </div>
  );
};
