import { AnimatePresence, motion } from "motion/react";
import { cloneElement, isValidElement, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";

type Side = "top" | "bottom" | "right" | "left";
interface Pos { top: number; left: number; side: Side }

const GAP = 8;
const MARGIN = 8;

const canHover = (): boolean => typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches;

interface Props {
  content: ReactNode;
  children: ReactElement | ReactNode;
  side?: Side;
  width?: number;
  delay?: number;
  disabled?: boolean;
  className?: string;
  /** Small dark bubble (a tooltip) instead of a surface card. */
  compact?: boolean;
  /** Render the trigger as a plain inline wrapper instead of cloning the child. */
  asWrapper?: boolean;
}

/**
 * Hover and focus detail panel. Rendered in a portal with fixed positioning so
 * it is never clipped by a scrolling column or a panel with hidden overflow,
 * and flipped or clamped to stay on screen.
 */
export const HoverCard = ({ content, children, side = "top", width, delay = 140, disabled, className, compact, asWrapper }: Props): JSX.Element => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();

  const place = useCallback(() => {
    const el = triggerRef.current;
    const card = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = card?.offsetWidth ?? width ?? 240;
    const h = card?.offsetHeight ?? 90;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let s: Side = side;
    if (s === "top" && r.top - h - GAP < MARGIN) s = "bottom";
    else if (s === "bottom" && r.bottom + h + GAP > vh - MARGIN) s = "top";
    else if (s === "right" && r.right + w + GAP > vw - MARGIN) s = "left";
    else if (s === "left" && r.left - w - GAP < MARGIN) s = "right";

    let top: number;
    let left: number;
    if (s === "top" || s === "bottom") {
      top = s === "top" ? r.top - h - GAP : r.bottom + GAP;
      left = r.left + r.width / 2 - w / 2;
    } else {
      top = r.top + r.height / 2 - h / 2;
      left = s === "right" ? r.right + GAP : r.left - w - GAP;
    }
    left = Math.min(Math.max(MARGIN, left), vw - w - MARGIN);
    top = Math.min(Math.max(MARGIN, top), vh - h - MARGIN);
    setPos({ top, left, side: s });
  }, [side, width]);

  // Measure once mounted, then keep in step with scrolling and resizing.
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onMove = () => place();
    const onDown = () => setOpen(false);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onDown, true);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onDown, true);
    };
  }, [open, place]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = () => {
    if (disabled || !canHover()) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  const handlers = {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
  };

  const trigger =
    !asWrapper && isValidElement(children)
      ? cloneElement(children as ReactElement, {
          ...handlers,
          ref: (node: HTMLElement) => {
            triggerRef.current = node;
            const r = (children as unknown as { ref?: unknown }).ref;
            if (typeof r === "function") r(node);
            else if (r && typeof r === "object") (r as { current: unknown }).current = node;
          },
        })
      : (
        <span ref={(n) => (triggerRef.current = n)} className={cn("inline-flex", className)} {...handlers}>
          {children}
        </span>
      );

  return (
    <>
      {trigger}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={cardRef}
              role="tooltip"
              className={cn(
                "pointer-events-none fixed z-[95]",
                compact
                  ? "rounded-md px-2 py-1 text-[11.5px] font-medium leading-snug shadow-lg"
                  : "pop overflow-hidden rounded-[10px] px-3 py-2.5",
              )}
              style={{
                top: pos?.top ?? -9999,
                left: pos?.left ?? -9999,
                width,
                maxWidth: compact ? 280 : 340,
                visibility: pos ? "visible" : "hidden",
                ...(compact ? { background: "var(--cta)", color: "var(--cta-text)" } : {}),
              }}
              initial={{ opacity: 0, scale: 0.97, y: pos?.side === "bottom" ? -3 : 3 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};

/** Small dark bubble for one short line of help. */
export const Tooltip = ({ content, children, side = "top", className }: { content: ReactNode; children: ReactNode; side?: Side; className?: string }): JSX.Element => (
  <HoverCard compact asWrapper content={content} side={side} className={className} delay={120}>
    {children}
  </HoverCard>
);

/** Label and value rows inside a hover card. */
export const DetailRows = ({ rows, className }: { rows: ([ReactNode, ReactNode] | null | false | undefined)[]; className?: string }): JSX.Element => (
  <dl className={cn("space-y-1", className)}>
    {rows.filter(Boolean).map((r, i) => {
      const [label, value] = r as [ReactNode, ReactNode];
      return (
        <div key={i} className="flex items-baseline justify-between gap-4 text-[12px]">
          <dt className="muted whitespace-nowrap">{label}</dt>
          <dd className="num text-right font-medium">{value}</dd>
        </div>
      );
    })}
  </dl>
);

export const HoverTitle = ({ children, sub }: { children: ReactNode; sub?: ReactNode }): JSX.Element => (
  <div className="mb-1.5">
    <div className="text-[13px] font-semibold leading-snug">{children}</div>
    {sub && <div className="muted text-[11.5px] leading-snug">{sub}</div>}
  </div>
);
