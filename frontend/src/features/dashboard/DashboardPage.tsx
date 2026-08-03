import { Link } from "react-router-dom";
import { useDashboard } from "../../hooks/useDashboard";
import { CardSkeleton, ErrorNote } from "../../components/ui/States";
import { StageBadge } from "../../components/ui/Badges";
import { PipelineSpine } from "../../components/charts/PipelineSpine";
import { ProportionBar } from "../../components/charts/ProportionBar";
import { StageBars } from "../../components/charts/StageBars";
import { Funnel } from "../../components/charts/Funnel";
import { RevenueArea } from "../../components/charts/RevenueArea";
import { inrCompact, relativeDate, timeAgo } from "../../lib/format";

const Stat = ({ label, value }: { label: string; value: string }): JSX.Element => (
  <div className="card p-4">
    <div className="muted mb-1 text-xs">{label}</div>
    <div className="font-display mono text-2xl font-semibold">{value}</div>
  </div>
);

export const DashboardPage = (): JSX.Element => {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div>
        <h1 className="font-display mb-4 text-xl font-semibold">Dashboard</h1>
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton className="h-28" />
      </div>
    );
  }
  if (isError || !data) return <ErrorNote message="Could not load the dashboard. Try again." />;

  const c = data.cards;
  const won = data.totalWonLost.find((t) => t.label === "Won")?.value ?? 0;
  const lost = data.totalWonLost.find((t) => t.label === "Lost")?.value ?? 0;
  const open = data.totalWonLost.find((t) => t.label === "Open")?.value ?? 0;

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl font-semibold">Dashboard</h1>
        <p className="muted text-sm">Pipeline health at a glance.</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Total Customers" value={String(c.totalCustomers)} />
        <Stat label="Total Leads" value={String(c.totalLeads)} />
        <Stat label="Revenue" value={inrCompact(c.revenue)} />
        <Stat label="Conversion" value={`${c.conversionRate}%`} />
        <Stat label="Win / Loss" value={`${c.winLossRatio} : 1`} />
      </div>

      <div className="card mb-4 p-5">
        <div className="mb-4 text-sm font-medium">Pipeline</div>
        <PipelineSpine counts={data.stageCounts} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-1 text-sm font-medium">Total vs Won vs Lost</div>
          <div className="muted mb-4 text-xs">Share only, no counts shown.</div>
          <ProportionBar won={won} lost={lost} open={open} />
        </div>
        <div className="card p-5">
          <div className="mb-1 text-sm font-medium">Leads by stage</div>
          <div className="muted mb-2 text-xs">Count shown at each stage.</div>
          <StageBars data={data.stageCounts} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <div className="mb-4 text-sm font-medium">Lead funnel</div>
          <Funnel data={data.funnel} />
        </div>
        <div className="card p-5">
          <div className="mb-3 text-sm font-medium">Monthly revenue</div>
          <RevenueArea data={data.monthlyRevenue} />
        </div>
        <div className="card p-5">
          <div className="mb-3 text-sm font-medium">Upcoming follow-ups</div>
          {data.upcomingFollowUps.length === 0 ? (
            <div className="muted text-sm">Nothing scheduled.</div>
          ) : (
            <div className="space-y-3 text-sm">
              {data.upcomingFollowUps.map((f) => (
                <Link key={f.leadId + f.dueAt} to={`/leads/${f.leadId}`} className="flex items-center justify-between">
                  <span>{f.customer}</span>
                  <span className="mono muted text-xs">{relativeDate(f.dueAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4 p-5">
        <div className="mb-3 text-sm font-medium">Recent activity</div>
        {data.recentActivity.length === 0 ? (
          <div className="muted text-sm">No activity yet.</div>
        ) : (
          <div className="space-y-3 text-sm">
            {data.recentActivity.map((a, i) => (
              <Link key={i} to={`/leads/${a.leadId}`} className="flex items-center gap-3">
                <StageBadge status={a.toStatus} />
                <span>{a.customer} moved to {a.toStatus.replace("_", " ").toLowerCase()}</span>
                <span className="muted mono ml-auto text-xs">{timeAgo(a.at)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
