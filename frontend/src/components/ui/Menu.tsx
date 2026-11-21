import { type ReactNode, useCallback, useState } from "react";
import { useDismiss } from "../../lib/hooks";
import { cn } from "../../lib/cn";

interface MenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  width?: number;
  className?: string;
}

export const Menu = ({ trigger, children, align = "right", width = 220, className }: MenuProps): JSX.Element => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  return (
    <div ref={ref} className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={cn("pop anim-pop absolute top-full z-50 mt-1.5 p-1.5", align === "right" ? "right-0" : "left-0")}
          style={{ width }}
          role="menu"
        >
          {children(close)}
        </div>
      )}
    </div>
  );
};
