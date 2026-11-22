import { motion } from "motion/react";

// A small trend line that draws itself in. The last point is marked.
export const Sparkline = ({ values, color, width = 120, height = 32, fill = false, stretch = false }: { values: number[]; color: string; width?: number; height?: number; fill?: boolean; stretch?: boolean }): JSX.Element => {
  const pad = 3;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const pts = values.map((v, i) => [pad + i * step, height - pad - ((v - min) / span) * (height - pad * 2)] as const);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg
      width={stretch ? "100%" : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={stretch ? "none" : undefined}
      aria-hidden
      className="block overflow-visible"
    >
      {fill && pts.length > 1 && (
        <motion.path
          d={`${d} L${last[0]},${height} L${pts[0][0]},${height} Z`}
          fill={color}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        />
      )}
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      />
      {last && !stretch && (
        <motion.circle
          cx={last[0]}
          cy={last[1]}
          r={3.5}
          fill={color}
          stroke="var(--surface)"
          strokeWidth={2}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 500, damping: 18 }}
        />
      )}
    </svg>
  );
};
