import { initials } from "../../lib/format";
import { cn } from "../../lib/cn";

// Stable tint per person so the same teammate always looks the same.
const TINTS = ["#0b7a75", "#3f5fcf", "#7a56cf", "#b0601a", "#13795b", "#a03a6b", "#2f6f8f"];
const tint = (seed: string): string => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
};

export const Avatar = ({ name, size = 28, className }: { name?: string | null; size?: number; className?: string }): JSX.Element => (
  <span
    className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white", className)}
    style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38), background: tint(name ?? "?") }}
    title={name ?? undefined}
    aria-hidden
  >
    {initials(name)}
  </span>
);
