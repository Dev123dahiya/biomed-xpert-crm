import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";

// Small hover and focus hint. Content is also exposed to screen readers via aria-describedby text.
export const Tooltip = ({ content, children, side = "top", className }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom"; className?: string }): JSX.Element => {
  const [open, setOpen] = useState(false);
  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? 2 : -2, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className={cn(
              "pointer-events-none absolute left-1/2 z-[95] w-max max-w-[260px] -translate-x-1/2 rounded-md px-2 py-1 text-[11.5px] font-medium leading-snug shadow-lg",
              side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
            )}
            style={{ background: "var(--cta)", color: "var(--cta-text)", x: "-50%" }}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};
