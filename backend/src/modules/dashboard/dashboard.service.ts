import { LeadStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { toNumber } from "../../utils/money";

const STAGE_ORDER: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.QUOTE_SHARED,
  LeadStatus.WON,
  LeadStatus.LOST,
];
const OPEN_STAGES: LeadStatus[] = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.QUOTE_SHARED];

const monthKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const pct = (part: number, whole: number): number => (whole ? Number(((part / whole) * 100).toFixed(1)) : 0);

const range = (from?: Date, to?: Date): Prisma.DateTimeFilter | undefined =>
  from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;

// A won deal counts in the period it closed. Deals without a closing date fall back to when they were recorded.
const wonInRange = (from?: Date, to?: Date): Prisma.WonDealWhereInput => {
  const r = range(from, to);
  if (!r) return {};
  return { OR: [{ closingDate: r }, { AND: [{ closingDate: null }, { createdAt: r }] }] };
};

interface PeriodNumbers {
  newLeads: number;
  wonCount: number;
  lostCount: number;
  revenue: number;
}

const periodNumbers = async (from?: Date, to?: Date): Promise<PeriodNumbers> => {
  const created = range(from, to);
  const [newLeads, wonAgg, lostCount] = await Promise.all([
    prisma.lead.count({ where: created ? { createdAt: created } : {} }),
    prisma.wonDeal.aggregate({ where: wonInRange(from, to), _sum: { finalValue: true }, _count: { _all: true } }),
    prisma.lostDeal.count({ where: created ? { createdAt: created } : {} }),
  ]);
  return { newLeads, wonCount: wonAgg._count._all, lostCount, revenue: toNumber(wonAgg._sum.finalValue) };
};

export const dashboardService = {
  async overview(from?: Date, to?: Date, compareFrom?: Date, compareTo?: Date) {
    const leadWhere: Prisma.LeadWhereInput = {};
    const created = range(from, to);
    if (created) leadWhere.createdAt = created;

    // The previous period has the same length and ends where this one starts.
    let previous: PeriodNumbers | null = null;
    if (compareFrom && compareTo) {
      previous = await periodNumbers(compareFrom, compareTo);
    } else if (from) {
      const end = to ?? new Date();
      const span = end.getTime() - from.getTime();
      const prevTo = new Date(from.getTime() - 1);
      const prevFrom = new Date(from.getTime() - span);
      previous = await periodNumbers(prevFrom, prevTo);
    }

    const [totalCustomers, newCustomers, statusGroups, timelineGroups, current, openAgg, targetSetting] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: created ? { createdAt: created } : {} }),
      prisma.lead.groupBy({ by: ["status"], where: leadWhere, _count: { _all: true }, _sum: { approxValue: true } }),
      prisma.leadTimeline.groupBy({ by: ["toStatus"], where: created ? { lead: { createdAt: created } } : {}, _count: { _all: true } }),
      periodNumbers(from, to),
      prisma.lead.aggregate({ where: { status: { in: OPEN_STAGES } }, _sum: { approxValue: true }, _count: { _all: true } }),
      prisma.setting.findUnique({ where: { key: "monthlyTarget" } }),
    ]);

    const byStatus = new Map(statusGroups.map((g) => [g.status, g._count._all]));
    const valueByStatus = new Map(statusGroups.map((g) => [g.status, toNumber(g._sum.approxValue)]));
    const count = (s: LeadStatus): number => byStatus.get(s) ?? 0;
    const totalLeads = STAGE_ORDER.reduce((sum, s) => sum + count(s), 0);
    const won = count(LeadStatus.WON);
    const lost = count(LeadStatus.LOST);
    const open = Math.max(0, totalLeads - won - lost);

    const reached = new Map(timelineGroups.map((g) => [g.toStatus, g._count._all]));
    const funnel = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.QUOTE_SHARED, LeadStatus.WON].map(
      (status) => ({ status, count: reached.get(status) ?? 0 }),
    );

    // Twelve month trend of revenue, new leads and wins.
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    const [wonForMonths, leadsForMonths] = await Promise.all([
      prisma.wonDeal.findMany({
        where: { OR: [{ closingDate: { gte: since } }, { AND: [{ closingDate: null }, { createdAt: { gte: since } }] }] },
        select: { finalValue: true, closingDate: true, createdAt: true },
      }),
      prisma.lead.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    ]);
    const monthly = new Map<string, { revenue: number; deals: number; leads: number }>();
    const bucket = (key: string) => {
      const b = monthly.get(key) ?? { revenue: 0, deals: 0, leads: 0 };
      monthly.set(key, b);
      return b;
    };
    for (const w of wonForMonths) {
      const b = bucket(monthKey(w.closingDate ?? w.createdAt));
      b.revenue += toNumber(w.finalValue);
      b.deals += 1;
    }
    for (const l of leadsForMonths) bucket(monthKey(l.createdAt)).leads += 1;
    const trend: { month: string; revenue: number; deals: number; leads: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = monthKey(d);
      trend.push({ month: key, ...(monthly.get(key) ?? { revenue: 0, deals: 0, leads: 0 }) });
    }

    const today = startOfDay(new Date());
    const tomorrow = new Date(today.getTime() + 86_400_000);
    const followInclude = { lead: { include: { customer: { select: { customerName: true, company: true } } } } } as const;

    const [upcoming, overdue, overdueCount, dueTodayCount, activity, sources, wonDeals, lostGroups, owners] = await Promise.all([
      prisma.followUp.findMany({
        where: { done: false, dueAt: { gte: today } },
        orderBy: { dueAt: "asc" },
        take: 8,
        include: followInclude,
      }),
      prisma.followUp.findMany({
        where: { done: false, dueAt: { lt: today } },
        orderBy: { dueAt: "asc" },
        take: 8,
        include: followInclude,
      }),
      prisma.followUp.count({ where: { done: false, dueAt: { lt: today } } }),
      prisma.followUp.count({ where: { done: false, dueAt: { gte: today, lt: tomorrow } } }),
      prisma.leadTimeline.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { actor: { select: { name: true } }, lead: { include: { customer: { select: { customerName: true, company: true } } } } },
      }),
      prisma.leadSource.findMany({
        select: {
          id: true,
          name: true,
          leads: { where: leadWhere, select: { status: true, approxValue: true, wonDeal: { select: { finalValue: true } } } },
        },
      }),
      prisma.wonDeal.findMany({
        where: wonInRange(from, to),
        select: { finalValue: true, lead: { select: { customerId: true, customer: { select: { customerName: true, company: true, city: true } } } } },
      }),
      prisma.lostDeal.groupBy({
        by: ["reason"],
        where: created ? { createdAt: created } : {},
        _count: { _all: true },
        orderBy: { _count: { reason: "desc" } },
        take: 6,
      }),
      prisma.user.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          ownedLeads: { where: leadWhere, select: { status: true, approxValue: true, wonDeal: { select: { finalValue: true } } } },
        },
      }),
    ]);

    const sourceBreakdown = sources
      .map((s) => {
        const wonLeads = s.leads.filter((l) => l.status === LeadStatus.WON);
        return {
          id: s.id,
          name: s.name,
          leads: s.leads.length,
          won: wonLeads.length,
          revenue: wonLeads.reduce((sum, l) => sum + toNumber(l.wonDeal?.finalValue), 0),
          winRate: pct(wonLeads.length, s.leads.length),
        };
      })
      .filter((s) => s.leads > 0)
      .sort((a, b) => b.leads - a.leads);

    const byCustomer = new Map<string, { customerId: string; name: string; company: string | null; city: string | null; revenue: number; deals: number }>();
    for (const w of wonDeals) {
      const c = w.lead.customer;
      const row = byCustomer.get(w.lead.customerId) ?? {
        customerId: w.lead.customerId,
        name: c.customerName,
        company: c.company,
        city: c.city,
        revenue: 0,
        deals: 0,
      };
      row.revenue += toNumber(w.finalValue);
      row.deals += 1;
      byCustomer.set(w.lead.customerId, row);
    }
    const topCustomers = [...byCustomer.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const team = owners
      .map((u) => {
        const wonLeads = u.ownedLeads.filter((l) => l.status === LeadStatus.WON);
        const closed = u.ownedLeads.filter((l) => l.status === LeadStatus.WON || l.status === LeadStatus.LOST).length;
        return {
          id: u.id,
          name: u.name,
          open: u.ownedLeads.filter((l) => OPEN_STAGES.includes(l.status)).length,
          pipeline: u.ownedLeads.filter((l) => OPEN_STAGES.includes(l.status)).reduce((s, l) => s + toNumber(l.approxValue), 0),
          won: wonLeads.length,
          revenue: wonLeads.reduce((s, l) => s + toNumber(l.wonDeal?.finalValue), 0),
          winRate: pct(wonLeads.length, closed),
        };
      })
      .filter((u) => u.open + u.won > 0)
      .sort((a, b) => b.revenue - a.revenue || b.pipeline - a.pipeline);

    // Revenue for the current calendar month, compared with the monthly target.
    const thisMonth = trend[trend.length - 1];
    const monthlyTarget = Number(targetSetting?.value ?? 0) || 0;

    const mapFollowUp = (f: (typeof upcoming)[number]) => ({
      id: f.id,
      leadId: f.leadId,
      customer: f.lead.customer.company ?? f.lead.customer.customerName,
      contact: f.lead.customer.customerName,
      dueAt: f.dueAt,
      note: f.note,
    });

    return {
      range: { from: from ?? null, to: to ?? null },
      cards: {
        totalCustomers,
        newCustomers,
        totalLeads,
        new: count(LeadStatus.NEW),
        contacted: count(LeadStatus.CONTACTED),
        qualified: count(LeadStatus.QUALIFIED),
        quoteShared: count(LeadStatus.QUOTE_SHARED),
        won,
        lost,
        revenue: current.revenue,
        wonDeals: current.wonCount,
        avgDealSize: current.wonCount ? Math.round(current.revenue / current.wonCount) : 0,
        pipelineValue: toNumber(openAgg._sum.approxValue),
        openLeads: openAgg._count._all,
        conversionRate: pct(won, totalLeads),
        winRate: pct(won, won + lost),
        winLossRatio: lost ? Number((won / lost).toFixed(2)) : won,
        overdueFollowUps: overdueCount,
        dueTodayFollowUps: dueTodayCount,
      },
      current,
      previous,
      target: { monthly: monthlyTarget, achieved: thisMonth.revenue, month: thisMonth.month, progress: pct(thisMonth.revenue, monthlyTarget) },
      totalWonLost: [
        { label: "Won", value: won },
        { label: "Lost", value: lost },
        { label: "Open", value: open },
      ],
      stageCounts: STAGE_ORDER.map((status) => ({ status, count: count(status), value: valueByStatus.get(status) ?? 0 })),
      funnel,
      monthlyRevenue: trend.slice(-6).map((t) => ({ month: t.month, revenue: t.revenue })),
      trend,
      sourceBreakdown,
      topCustomers,
      lostReasons: lostGroups.map((g) => ({ reason: g.reason, count: g._count._all })),
      team,
      upcomingFollowUps: upcoming.map(mapFollowUp),
      overdueFollowUps: overdue.map(mapFollowUp),
      recentActivity: activity.map((t) => ({
        leadId: t.leadId,
        customer: t.lead.customer.company ?? t.lead.customer.customerName,
        fromStatus: t.fromStatus,
        toStatus: t.toStatus,
        actor: t.actor?.name ?? null,
        note: t.note,
        at: t.createdAt,
      })),
    };
  },
};
