import { motion } from "motion/react";
import { useId, type ReactNode } from "react";
import { spring } from "../../lib/motion";
import { cn } from "../../lib/cn";

interface Option<T extends string> { value: T; label: ReactNode; icon?: ReactNode }

// Segmented control whose selected thumb slides between options.
export const Segmented = <T extends string>({ options, value, onChange, label, className, size = "md", stretch }: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  size?: "sm" | "md";
  stretch?: boolean;
}): JSX.Element => {
  const id = useId();
  return (
    <div className={cn("seg", stretch && "flex", className)} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn("relative flex items-center justify-center gap-1.5", stretch && "flex-1", size === "sm" && "!h-6 !px-2 !text-[11.5px]")}
            style={active ? { color: "var(--text)" } : undefined}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[7px]"
                style={{ background: "var(--seg-thumb)", boxShadow: "var(--shadow-sm)" }}
                transition={spring}
              />
            )}
            <span className="relative z-[1] flex items-center gap-1.5">{o.icon}{o.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// Underlined tabs with a sliding indicator.
export const Tabs = <T extends string>({ tabs, value, onChange, className }: {
  tabs: { value: T; label: ReactNode; badge?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}): JSX.Element => {
  const id = useId();
  return (
    <div className={cn("scroll-thin flex gap-5 overflow-x-auto border-b divider", className)} role="tablist">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button key={t.value || "all"} role="tab" aria-selected={active} className="tab tab-motion flex items-center gap-1.5" onClick={() => onChange(t.value)}>
            {t.label}
            {t.badge}
            {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-x-0 -bottom-px h-[2px] rounded-full" style={{ background: "var(--text)" }} transition={spring} />}
          </button>
        );
      })}
    </div>
  );
};
