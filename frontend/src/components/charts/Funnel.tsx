import type { LeadStatus } from "../../types";
import { STAGE_META } from "../../lib/stages";
import { inr } from "../../lib/format";

export const Funnel = ({ data }: { data: { status: LeadStatus; count: number }[] }): JSX.Element => {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-2">
      {data.map((d) => {
        const meta = STAGE_META[d.status];
        return (
          <div key={d.status}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{meta.label}</span>
              <span className="mono muted">{d.count}</span>
            </div>
            <div className="h-6 rounded-md" style={{ width: `${(d.count / max) * 100}%`, minWidth: 6, background: meta.color, opacity: 0.9 }} />
          </div>
        );
      })}
    </div>
  );
};

export const noop = inr;
