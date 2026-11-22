import type { LeadStatus, Priority } from "../types";

export const STAGE_META: Record<LeadStatus, { label: string; color: string; short: string; hint: string }> = {
  NEW: { label: "New", short: "New", color: "var(--st-new)", hint: "Just came in, not yet contacted" },
  CONTACTED: { label: "Contacted", short: "Contacted", color: "var(--st-contacted)", hint: "First conversation done" },
  QUALIFIED: { label: "Qualified", short: "Qualified", color: "var(--st-qualified)", hint: "Need, budget and timeline confirmed" },
  QUOTE_SHARED: { label: "Quote shared", short: "Quote", color: "var(--st-quote)", hint: "Quotation sent, awaiting decision" },
  WON: { label: "Won", short: "Won", color: "var(--st-won)", hint: "Order confirmed" },
  LOST: { label: "Lost", short: "Lost", color: "var(--st-lost)", hint: "Did not go ahead" },
};

export const BOARD_ORDER: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "QUOTE_SHARED", "WON", "LOST"];
export const OPEN_ORDER: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "QUOTE_SHARED"];

export const nextForwardStages = (current: LeadStatus): LeadStatus[] => {
  const idx = OPEN_ORDER.indexOf(current);
  if (idx < 0) return [];
  return OPEN_ORDER.slice(idx + 1);
};

export const canMoveTo = (from: LeadStatus, to: LeadStatus): boolean => {
  if (isTerminal(from) || from === to) return false;
  if (to === "WON" || to === "LOST") return true;
  return nextForwardStages(from).includes(to);
};

export const PRIORITY_META: Record<Priority, { label: string; color: string; bg: string }> = {
  HIGH: { label: "High", color: "var(--danger)", bg: "var(--danger-soft)" },
  MEDIUM: { label: "Medium", color: "var(--warning)", bg: "var(--warning-soft)" },
  LOW: { label: "Low", color: "var(--muted)", bg: "var(--surface-3)" },
};

export const isTerminal = (s: LeadStatus): boolean => s === "WON" || s === "LOST";
export const stageLabel = (s: LeadStatus): string => STAGE_META[s]?.label ?? s;
