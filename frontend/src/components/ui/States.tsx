import { AlertTriangle, RotateCw } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "../../lib/cn";

export const EmptyState = ({ icon, title, hint, action, compact }: { icon?: ReactNode; title: string; hint?: ReactNode; action?: ReactNode; compact?: boolean }): JSX.Element => (
  <div className={cn("flex flex-col items-center text-center", compact ? "px-4 py-8" : "px-6 py-14")}>
    {icon && (
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--surface-3)", color: "var(--muted)" }}>
        {icon}
      </div>
    )}
    <div className="font-semibold">{title}</div>
    {hint && <div className="muted mt-1 max-w-sm text-sm">{hint}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const SkeletonRows = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }): JSX.Element => (
  <tbody>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r}>
        {Array.from({ length: cols }).map((__, c) => (
          <td key={c} className="td">
            <div className="skel h-4" style={{ width: c === 0 ? "70%" : "55%" }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

export const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }): JSX.Element => (
  <div className={cn("skel", className)} style={style} />
);

export const CardSkeleton = ({ className }: { className?: string }): JSX.Element => (
  <div className={"panel p-5 " + (className ?? "")}>
    <div className="skel mb-3 h-3 w-1/3" />
    <div className="skel h-7 w-2/3" />
  </div>
);

export const ErrorNote = ({ message, onRetry }: { message: string; onRetry?: () => void }): JSX.Element => (
  <div className="panel flex flex-col items-center gap-3 px-6 py-10 text-center">
    <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
      <AlertTriangle className="h-5 w-5" />
    </div>
    <div className="max-w-sm text-sm">{message}</div>
    {onRetry && (
      <button className="btn btn-sm" onClick={onRetry}>
        <RotateCw className="h-3.5 w-3.5" /> Try again
      </button>
    )}
  </div>
);
