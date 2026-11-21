import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import { RevenueTrend } from "../../components/charts/RevenueTrend";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorNote, Skeleton } from "../../components/ui/States";
import { greeting, inrCompact } from "../../lib/format";
import { Panel, ActivityFeed, Agenda, Funnel, KpiCards, LostReasons, SourceTable, StageBreakdown, TargetMeter, TeamBoard, TopCustomers } from "./widgets";

type PeriodKey = "month" | "30d" | "quarter" | "year" | "all";

// Short labels fit the cards; each compares with the same point in the previous period.
const PERIODS: { key: PeriodKey; label: string; compare: string | null }[] = [
  { key: "month", label: "This month", compare: "vs last month" },
  { key: "30d", label: "Last 30 days", compare: "vs prior 30 days" },
  { key: "quarter", label: "This quarter", compare: "vs last quarter" },
  { key: "year", label: "This year", compare: "vs last year" },
  { key: "all", label: "All time", compare: null },
];

// Each period is compared with the same point in the period before it
// (1–21 Nov against 1–21 Oct), so a half-finished month isn't judged against a full one.
const rangeFor = (key: PeriodKey): { from?: string; to?: string; compareFrom?: string; compareTo?: string } => {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  const day = (y: number, m: number, d: number) => new Date(y, m, d);
  const sameOffset = (start: Date, prevStart: Date) => new Date(prevStart.getTime() + (now.getTime() - start.getTime()));
  if (key === "month") {
    const s = day(now.getFullYear(), now.getMonth(), 1);
    const ps = day(now.getFullYear(), now.getMonth() - 1, 1);
    const pe = new Date(Math.min(sameOffset(s, ps).getTime(), s.getTime() - 1));
    return { from: iso(s), compareFrom: iso(ps), compareTo: iso(pe) };
  }
  if (key === "30d") return { from: iso(day(now.getFullYear(), now.getMonth(), now.getDate() - 29)) };
  if (key === "quarter") {
    const q = Math.floor(now.getMonth() / 3) * 3;
    const s = day(now.getFullYear(), q, 1);
    const ps = day(now.getFullYear(), q - 3, 1);
    const pe = new Date(Math.min(sameOffset(s, ps).getTime(), s.getTime() - 1));
    return { from: iso(s), compareFrom: iso(ps), compareTo: iso(pe) };
  }
  if (key === "year") {
    const s = day(now.getFullYear(), 0, 1);
    const ps = day(now.getFullYear() - 1, 0, 1);
    return { from: iso(s), compareFrom: iso(ps), compareTo: iso(sameOffset(s, ps)) };
  }
  return {};
};

const DashboardSkeleton = (): JSX.Element => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 xl:gap-4">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[118px] rounded-[12px]" />)}</div>
    <div className="grid gap-4 lg:grid-cols-3 xl:gap-5">
      <Skeleton className="h-[320px] rounded-[14px] lg:col-span-2" />
      <Skeleton className="h-[320px] rounded-[14px]" />
    </div>
    <div className="grid gap-4 lg:grid-cols-3 xl:gap-5">
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[280px] rounded-[14px]" />)}
    </div>
  </div>
);

const DashboardPage = (): JSX.Element => {
  const { user, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const period = (PERIODS.find((p) => p.key === params.get("period"))?.key ?? "month") as PeriodKey;
  const meta = PERIODS.find((p) => p.key === period)!;
  const range = useMemo(() => rangeFor(period), [period]);
  const { data, isLoading, isError, refetch, isFetching } = useDashboard(range);

  const firstName = user?.name?.split(" ")[0] ?? "";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <PageHeader
        docTitle="Dashboard"
        title={`${greeting()}, ${firstName}`}
        subtitle={
          data && data.cards.overdueFollowUps + data.cards.dueTodayFollowUps > 0 ? (
            <>
              {today}. You have{" "}
              <Link to="/follow-ups" className="font-medium underline-offset-2 hover:underline" style={{ color: "var(--text)" }}>
                {data.cards.dueTodayFollowUps} follow-up{data.cards.dueTodayFollowUps === 1 ? "" : "s"} today
                {data.cards.overdueFollowUps ? ` and ${data.cards.overdueFollowUps} overdue` : ""}
              </Link>
              .
            </>
          ) : (
            today
          )
        }
        actions={
          <div className="seg max-w-full overflow-x-auto" role="group" aria-label="Period">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                aria-pressed={p.key === period}
                onClick={() => setParams(p.key === "month" ? {} : { period: p.key }, { replace: true })}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <ErrorNote message="The dashboard didn't load. Check your connection, then try again." onRetry={() => refetch()} />
      ) : (
        <div className="space-y-4 xl:space-y-5" style={{ opacity: isFetching ? 0.75 : 1, transition: "opacity .15s" }}>
          <KpiCards data={data} periodLabel={meta.label} compareLabel={meta.compare} />

          <div className="grid gap-4 lg:grid-cols-3 xl:gap-5">
            <Panel
              className="lg:col-span-2"
              title="Revenue closed"
              sub={`Last 12 months, ${inrCompact(data.trend.reduce((s, t) => s + t.revenue, 0))} in total`}
              bodyClass="pl-2 pr-4"
            >
              <RevenueTrend data={data.trend} target={data.target.monthly || undefined} />
            </Panel>
            <Panel title="This month's target" sub={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}>
              <TargetMeter target={data.target} isAdmin={isAdmin} />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 xl:gap-5">
            <Panel title="Pipeline by stage" sub="Approximate value of leads in each stage" action={<Link to="/leads" className="btn btn-ghost btn-sm">Open board</Link>}>
              <StageBreakdown stages={data.stageCounts} />
            </Panel>
            <Panel title="Conversion funnel" sub={meta.key === "all" ? "All leads" : `Leads created ${meta.label.toLowerCase()}`}>
              <Funnel data={data.funnel} />
            </Panel>
            <Panel title="Follow-ups" sub="Overdue first, then what's next" action={<Link to="/follow-ups" className="btn btn-ghost btn-sm">See all</Link>} bodyClass="pt-2">
              <Agenda overdue={data.overdueFollowUps} upcoming={data.upcomingFollowUps} />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 xl:gap-5">
            <Panel title="Lead sources" sub="Where leads come from and how they convert">
              <SourceTable rows={data.sourceBreakdown} />
            </Panel>
            <Panel title="Top customers" sub={`By revenue, ${meta.label.toLowerCase()}`}>
              <TopCustomers rows={data.topCustomers} />
            </Panel>
            <Panel title="Why deals are lost" sub={meta.label}>
              <LostReasons rows={data.lostReasons} />
            </Panel>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-5 xl:gap-5">
            {data.team.length > 0 && (
              <Panel className="lg:col-span-3" title="Team performance" sub={`Leads owned, ${meta.label.toLowerCase()}`}>
                <TeamBoard rows={data.team} />
              </Panel>
            )}
            <Panel className={data.team.length > 0 ? "lg:col-span-2" : "lg:col-span-5"} title="Recent activity" sub="Stage changes across the team">
              <ActivityFeed rows={data.recentActivity} />
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
