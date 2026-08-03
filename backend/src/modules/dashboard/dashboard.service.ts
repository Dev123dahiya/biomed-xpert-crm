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

const monthKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const dashboardService = {
  async overview(from?: Date, to?: Date) {
    const leadWhere: Prisma.LeadWhereInput = {};
    if (from || to) leadWhere.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

    const [totalCustomers, statusGroups, timelineGroups, revenueAgg] = await Promise.all([
      prisma.customer.count(),
      prisma.lead.groupBy({ by: ["status"], where: leadWhere, _count: { _all: true } }),
      prisma.leadTimeline.groupBy({ by: ["toStatus"], _count: { _all: true } }),
      prisma.wonDeal.aggregate({ _sum: { finalValue: true }, where: from || to ? { lead: leadWhere } : {} }),
    ]);

    const byStatus = new Map(statusGroups.map((g) => [g.status, g._count._all]));
    const count = (s: LeadStatus): number => byStatus.get(s) ?? 0;
    const totalLeads = STAGE_ORDER.reduce((sum, s) => sum + count(s), 0);
    const won = count(LeadStatus.WON);
    const lost = count(LeadStatus.LOST);
    const open = totalLeads - won - lost;

    const reached = new Map(timelineGroups.map((g) => [g.toStatus, g._count._all]));
    const funnel = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.QUOTE_SHARED, LeadStatus.WON].map(
      (status) => ({ status, count: reached.get(status) ?? 0 }),
    );

    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    since.setDate(1);
    const wonForMonths = await prisma.wonDeal.findMany({
      where: { OR: [{ closingDate: { gte: since } }, { AND: [{ closingDate: null }, { createdAt: { gte: since } }] }] },
      select: { finalValue: true, closingDate: true, createdAt: true },
    });
    const monthly = new Map<string, number>();
    for (const w of wonForMonths) {
      const key = monthKey(w.closingDate ?? w.createdAt);
      monthly.set(key, (monthly.get(key) ?? 0) + toNumber(w.finalValue));
    }
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = monthKey(d);
      monthlyRevenue.push({ month: key, revenue: monthly.get(key) ?? 0 });
    }

    const [upcoming, activity] = await Promise.all([
      prisma.followUp.findMany({
        where: { done: false, dueAt: { gte: new Date() } },
        orderBy: { dueAt: "asc" },
        take: 8,
        include: { lead: { include: { customer: { select: { customerName: true, company: true } } } } },
      }),
      prisma.leadTimeline.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { lead: { include: { customer: { select: { customerName: true, company: true } } } } },
      }),
    ]);

    return {
      cards: {
        totalCustomers,
        totalLeads,
        new: count(LeadStatus.NEW),
        contacted: count(LeadStatus.CONTACTED),
        qualified: count(LeadStatus.QUALIFIED),
        quoteShared: count(LeadStatus.QUOTE_SHARED),
        won,
        lost,
        revenue: toNumber(revenueAgg._sum.finalValue),
        conversionRate: totalLeads ? Number(((won / totalLeads) * 100).toFixed(1)) : 0,
        winLossRatio: lost ? Number((won / lost).toFixed(2)) : won,
      },
      totalWonLost: [
        { label: "Won", value: won },
        { label: "Lost", value: lost },
        { label: "Open", value: open < 0 ? 0 : open },
      ],
      stageCounts: STAGE_ORDER.map((status) => ({ status, count: count(status) })),
      funnel,
      monthlyRevenue,
      upcomingFollowUps: upcoming.map((f) => ({
        leadId: f.leadId,
        customer: f.lead.customer.company ?? f.lead.customer.customerName,
        dueAt: f.dueAt,
      })),
      recentActivity: activity.map((t) => ({
        leadId: t.leadId,
        customer: t.lead.customer.company ?? t.lead.customer.customerName,
        fromStatus: t.fromStatus,
        toStatus: t.toStatus,
        at: t.createdAt,
      })),
    };
  },
};
