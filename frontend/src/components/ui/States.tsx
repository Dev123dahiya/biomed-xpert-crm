import { type ReactNode } from "react";

export const EmptyState = ({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }): JSX.Element => (
  <div className="flex flex-col items-center py-16 text-center">
    <div className="muted mb-2">{icon}</div>
    <div className="font-medium">{title}</div>
    {hint && <div className="muted mb-4 text-sm">{hint}</div>}
    {action}
  </div>
);

export const SkeletonRows = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }): JSX.Element => (
  <tbody>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r}>
        {Array.from({ length: cols }).map((__, c) => (
          <td key={c} className="td">
            <div className="skel h-4 w-full" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

export const CardSkeleton = ({ className }: { className?: string }): JSX.Element => (
  <div className={"card p-4 " + (className ?? "")}>
    <div className="skel mb-2 h-3 w-1/2" />
    <div className="skel h-7 w-3/4" />
  </div>
);

export const ErrorNote = ({ message }: { message: string }): JSX.Element => (
  <div className="card p-6 text-sm" style={{ color: "#ef4444" }}>{message}</div>
);
