import { LeadStatus } from "@prisma/client";

export const NON_TERMINAL_ORDER: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.QUOTE_SHARED,
];

export const ALL_STAGES: LeadStatus[] = [...NON_TERMINAL_ORDER, LeadStatus.WON, LeadStatus.LOST];

export const isTerminal = (s: LeadStatus): boolean => s === LeadStatus.WON || s === LeadStatus.LOST;

export const canForwardTransition = (from: LeadStatus, to: LeadStatus): boolean => {
  if (isTerminal(from)) return false;
  const fi = NON_TERMINAL_ORDER.indexOf(from);
  const ti = NON_TERMINAL_ORDER.indexOf(to);
  return fi >= 0 && ti >= 0 && ti > fi;
};

export const followUpAllowed = (s: LeadStatus): boolean => s !== LeadStatus.NEW;

export const MAX_PRODUCTS_PER_LEAD = 15;
