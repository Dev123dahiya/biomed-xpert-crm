import type { LeadStatus, Priority } from "../../types";
import { PRIORITY_COLOR, STAGE_META } from "../../lib/stages";

const alpha = (hex: string, a: number): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export const StageBadge = ({ status }: { status: LeadStatus }): JSX.Element => {
  const meta = STAGE_META[status];
  return <span className="pill" style={{ background: alpha(meta.color, 0.16), color: meta.color }}>{meta.label}</span>;
};

export const PriorityBadge = ({ priority }: { priority: Priority }): JSX.Element => {
  const color = PRIORITY_COLOR[priority];
  const label = priority.charAt(0) + priority.slice(1).toLowerCase();
  return <span className="pill" style={{ background: alpha(color, 0.16), color }}>{label}</span>;
};
