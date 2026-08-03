import type { LeadStatus, Priority } from "../types";

export const STAGE_META: Record<LeadStatus, { label: string; color: string }> = {
  NEW: { label: "New", color: "#94a3b8" },
  CONTACTED: { label: "Contacted", color: "#38bdf8" },
  QUALIFIED: { label: "Qualified", color: "#0a84ff" },
  QUOTE_SHARED: { label: "Quote Shared", color: "#005a9c" },
  WON: { label: "Won", color: "#16a34a" },
  LOST: { label: "Lost", color: "#ef4444" },
};

export const BOARD_ORDER: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "QUOTE_SHARED", "WON", "LOST"];
export const FORWARD_TARGETS: LeadStatus[] = ["CONTACTED", "QUALIFIED", "QUOTE_SHARED"];

export const nextForwardStages = (current: LeadStatus): LeadStatus[] => {
  const order: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "QUOTE_SHARED"];
  const idx = order.indexOf(current);
  if (idx < 0) return [];
  return order.slice(idx + 1);
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#0a84ff",
  LOW: "#94a3b8",
};

export const isTerminal = (s: LeadStatus): boolean => s === "WON" || s === "LOST";
