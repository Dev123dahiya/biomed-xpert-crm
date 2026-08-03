import type { LeadStatus } from "../../types";
import { BOARD_ORDER, STAGE_META } from "../../lib/stages";

export const PipelineSpine = ({ counts }: { counts: { status: LeadStatus; count: number }[] }): JSX.Element => {
  const map = new Map(counts.map((c) => [c.status, c.count]));
  return (
    <div className="flex items-start justify-between gap-2">
      {BOARD_ORDER.map((status, i) => {
        const meta = STAGE_META[status];
        return (
          <div key={status} className="relative flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className="h-0.5 flex-1" style={{ background: "var(--border)", visibility: i === 0 ? "hidden" : "visible" }} />
              <div className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: meta.color }} />
              <div className="h-0.5 flex-1" style={{ background: "var(--border)", visibility: i === BOARD_ORDER.length - 1 ? "hidden" : "visible" }} />
            </div>
            <div className="mono font-display mt-2 text-lg font-semibold">{map.get(status) ?? 0}</div>
            <div className="muted mt-0.5 text-[11px]">{meta.label}</div>
          </div>
        );
      })}
    </div>
  );
};
