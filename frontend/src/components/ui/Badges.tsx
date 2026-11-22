import type { LeadStatus, Priority } from "../../types";
import { Tooltip } from "./HoverCard";
import { PRIORITY_META, STAGE_META } from "../../lib/stages";

export const StageDot = ({ status, size = 8 }: { status: LeadStatus; size?: number }): JSX.Element => (
  <span className="inline-block shrink-0 rounded-full" style={{ width: size, height: size, background: STAGE_META[status].color }} aria-hidden />
);

export const StageBadge = ({ status }: { status: LeadStatus }): JSX.Element => {
  const meta = STAGE_META[status];
  return (
    <Tooltip content={meta.hint}>
      <span
        className="pill cursor-help"
        style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)`, color: "var(--text)" }}
      >
        <StageDot status={status} size={7} />
        {meta.label}
      </span>
    </Tooltip>
  );
};

const PRIORITY_HINT: Record<Priority, string> = {
  HIGH: "High priority: chase this one first",
  MEDIUM: "Medium priority: normal follow-up",
  LOW: "Low priority: keep warm",
};

export const PriorityBadge = ({ priority }: { priority: Priority }): JSX.Element => {
  const meta = PRIORITY_META[priority];
  return (
    <Tooltip content={PRIORITY_HINT[priority]}>
      <span className="pill cursor-help" style={{ background: meta.bg, color: meta.color }}>
        {meta.label}
      </span>
    </Tooltip>
  );
};

export const RoleBadge = ({ role }: { role: string }): JSX.Element => (
  <span className="pill" style={{ background: role === "ADMIN" ? "var(--primary-soft)" : "var(--surface-3)", color: role === "ADMIN" ? "var(--primary-text)" : "var(--text-2)" }}>
    {role.charAt(0) + role.slice(1).toLowerCase()}
  </span>
);
