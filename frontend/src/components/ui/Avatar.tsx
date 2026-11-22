import { initials } from "../../lib/format";
import { cn } from "../../lib/cn";

// Stable, soft tint per person (Attio-style): the same teammate always looks the same.
const TINTS = ["#2563eb", "#7c3aed", "#0d9488", "#c2410c", "#be185d", "#4f46e5", "#0e7490", "#a16207"];
const tint = (seed: string): string => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
};

export const Avatar = ({ name, size = 28, className }: { name?: string | null; size?: number; className?: string }): JSX.Element => {
  const c = tint(name ?? "?");
  return (
    <span
      className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9.5, size * 0.37),
        background: `color-mix(in srgb, ${c} 14%, var(--surface))`,
        color: `color-mix(in srgb, ${c} 82%, var(--text))`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 18%, transparent)`,
      }}
      title={name ?? undefined}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
};
