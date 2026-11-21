import { type ReactNode } from "react";
import { HoverCard, DetailRows, HoverTitle } from "./HoverCard";
import { fullDateTime, inr, inrCompact, num, relativeDate, timeAgo } from "../../lib/format";
import { cn } from "../../lib/cn";

/**
 * A compact money figure (₹8.6 Cr) that reveals the exact amount on hover,
 * with optional extra rows of context.
 */
export const Money = ({ value, compact = true, title, sub, rows, className }: {
  value: number;
  compact?: boolean;
  title?: ReactNode;
  sub?: ReactNode;
  rows?: ([ReactNode, ReactNode] | null | false | undefined)[];
  className?: string;
}): JSX.Element => (
  <HoverCard
    asWrapper
    className={className}
    content={
      <>
        {title && <HoverTitle sub={sub}>{title}</HoverTitle>}
        <div className="num text-[15px] font-semibold tracking-[-0.01em]">{inr(value)}</div>
        {rows && rows.length > 0 && <div className="mt-2 border-t pt-2 divider"><DetailRows rows={rows} /></div>}
      </>
    }
  >
    <span className="num cursor-help decoration-dotted underline-offset-4 hover:underline">{compact ? inrCompact(value) : inr(value)}</span>
  </HoverCard>
);

/** A date shown loosely ("3 days ago") with the exact timestamp on hover. */
export const DateHint = ({ value, mode = "ago", className, children }: {
  value?: string | Date | null;
  mode?: "ago" | "relative";
  className?: string;
  children?: ReactNode;
}): JSX.Element => {
  if (!value) return <span className={className}>{children ?? "—"}</span>;
  const label = children ?? (mode === "ago" ? timeAgo(String(value)) : relativeDate(String(value)));
  return (
    <HoverCard asWrapper compact className={className} content={fullDateTime(value)} delay={120}>
      <span className="cursor-help">{label}</span>
    </HoverCard>
  );
};

/** A count with its share of a total on hover. */
export const Count = ({ value, total, noun, className }: { value: number; total?: number; noun?: string; className?: string }): JSX.Element => (
  <HoverCard
    asWrapper
    compact
    className={className}
    content={`${num(value)}${noun ? ` ${noun}` : ""}${total ? ` · ${Math.round((value / total) * 1000) / 10}% of ${num(total)}` : ""}`}
  >
    <span className={cn("num cursor-help")}>{num(value)}</span>
  </HoverCard>
);
