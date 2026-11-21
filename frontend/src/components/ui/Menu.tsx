import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useCallback, useState } from "react";
import { useDismiss } from "../../lib/hooks";
import { cn } from "../../lib/cn";

interface MenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  placement?: "bottom" | "top";
  width?: number;
  className?: string;
}

export const Menu = ({ trigger, children, align = "right", placement = "bottom", width = 220, className }: MenuProps): JSX.Element => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  const origin = `${placement === "top" ? "bottom" : "top"} ${align === "right" ? "right" : "left"}`;
  return (
    <div ref={ref} className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            className={cn("pop absolute z-50 p-1.5", placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5", align === "right" ? "right-0" : "left-0")}
            style={{ width, transformOrigin: origin }}
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: placement === "top" ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 600, damping: 36 }}
          >
            {children(close)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
