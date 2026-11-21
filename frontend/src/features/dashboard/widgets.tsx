import { AlertCircle, ArrowDownRight, ArrowUpRight, CalendarClock, Minus } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkline } from "../../components/ui/Sparkline";
import { StageDot } from "../../components/ui/Badges";
import { Avatar } from "../../components/ui/Avatar";
import { inr, inrCompact, num, relativeDate, timeAgo, timeOnly, dayDiff } from "../../lib/format";
import { BOARD_ORDER, STAGE_META, stageLabel } from "../../lib/stages";
import type { AgendaFollowUp, DashboardOverview, LeadStatus } from "../../types";
import { cn } from "../../lib/cn";

export const Panel = ({ title, sub, action, children, className, bodyClass }: { title: string; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }): JSX.Element => (
  <section className={cn("panel flex flex-col", className)}>
    <header className="flex items-start justify-between gap-3 px-5 pb-1 pt-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {sub && <div className="caption mt-0.5">{sub}</div>}
      </div>
      {action}
    </header>
    <div className={cn("flex-1 px-5 pb-5 pt-3", bodyClass)}>{children}</div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Vitals strip: the dashboard's headline, styled like a bedside monitor */

interface Channel {
  key: string;
  label: string;
  value: string;
  color: string;
  foot: ReactNode;
  trend?: number[];
  alarm?: boolean;
  to?: string;
}

const Delta = ({ value, goodWhenUp = true, label }: { value: number | null; goodWhenUp?: boolean; label: string }): JSX.Element => {
  if (value === null) return <span style={{ color: "var(--ink-muted)" }}>New this period</span>;
  const up = value > 0;
  const flat = value === 0;
  const good = flat ? null : up === goodWhenUp;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color: good === null ? "var(--ink-muted)" : good ? "var(--ch-ecg)" : "var(--ch-alarm)" }}>
        <Icon className="h-3.5 w-3.5" />
        {Math.abs(value) >= 100 ? Math.round(Math.abs(value)).toLocaleString("en-IN") : Math.abs(value)}%
      </span>
      <span style={{ color: "var(--ink-muted)" }}>{label}</span>
    </span>
  );
};

export const VitalsStrip = ({ data, periodLabel, compareLabel }: { data: DashboardOverview; periodLabel: string; compareLabel: string | null }): JSX.Element => {
  const c = data.cards;
  const prev = data.previous;
  const change = (cur: number, p?: number) => (prev && p !== undefined ? (p ? Math.round(((cur - p) / p) * 1000) / 10 : cur ? null : 0) : undefined);
  const revDelta = change(data.current.revenue, prev?.revenue);
  const leadDelta = change(data.current.newLeads, prev?.newLeads);

  const channels: Channel[] = [
    {
      key: "rev",
      label: `Revenue, ${periodLabel.toLowerCase()}`,
      value: inrCompact(data.current.revenue),
      color: "var(--ch-ecg)",
      trend: data.trend.map((t) => t.revenue),
      foot: revDelta !== undefined && compareLabel ? <Delta value={revDelta} label={compareLabel} /> : <span style={{ color: "var(--ink-muted)" }}>{num(data.current.wonCount)} deals closed</span>,
      to: "/leads?view=list&status=WON",
    },
    {
      key: "pipe",
      label: "Open pipeline",
      value: inrCompact(c.pipelineValue),
      color: "var(--ch-spo2)",
      foot: <span style={{ color: "var(--ink-muted)" }}>{num(c.openLeads)} open leads</span>,
      to: "/leads",
    },
    {
      key: "leads",
      label: `New leads, ${periodLabel.toLowerCase()}`,
      value: num(data.current.newLeads),
      color: "var(--ch-bp)",
      trend: data.trend.map((t) => t.leads),
      foot: leadDelta !== undefined && compareLabel ? <Delta value={leadDelta} label={compareLabel} /> : <span style={{ color: "var(--ink-muted)" }}>{num(c.newCustomers)} new customers</span>,
      to: "/leads?view=list&sort=-createdAt",
    },
    {
      key: "win",
      label: "Win rate",
      value: `${c.winRate}%`,
      color: "var(--ch-resp)",
      foot: (
        <span style={{ color: "var(--ink-muted)" }}>
          {num(c.won)} won, {num(c.lost)} lost
          {c.avgDealSize ? `, avg ${inrCompact(c.avgDealSize)}` : ""}
        </span>
      ),
    },
    {
      key: "fu",
      label: "Overdue follow-ups",
      value: num(c.overdueFollowUps),
      color: c.overdueFollowUps > 0 ? "var(--ch-alarm)" : "var(--ch-ecg)",
      alarm: c.overdueFollowUps > 0,
      foot: <span style={{ color: "var(--ink-muted)" }}>{num(c.dueTodayFollowUps)} due today</span>,
      to: "/follow-ups",
    },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-[18px] border border-transparent dark:border-white/[0.07]"
      style={{ background: "var(--ink)", color: "var(--ink-text)" }}
      aria-label="Key numbers"
    >
      <div className="relative grid grid-cols-2 gap-px md:grid-cols-3 xl:grid-cols-5" style={{ background: "rgba(255,255,255,0.07)" }}>
        {channels.map((ch, i) => {
          const Inner = (
            <>
              <div className="flex items-center gap-2 text-[12px] font-medium" style={{ color: "var(--ink-muted)" }}>
                <span className={cn("h-2 w-2 shrink-0 rounded-full", ch.alarm && "blip")} style={{ background: ch.color }} aria-hidden />
                <span className="truncate">{ch.label}</span>
              </div>
              <div className="condensed mt-2 whitespace-nowrap text-[34px] font-semibold leading-none sm:text-[40px]" style={{ color: ch.color }}>
                {ch.value}
              </div>
              {ch.trend && ch.trend.some((v) => v > 0) ? (
                <div className="mt-3 hidden sm:block">
                  <Sparkline values={ch.trend} color={ch.color} width={180} height={26} stretch />
                </div>
              ) : null}
              <div className="mt-auto truncate pt-2.5 text-[12px]">{ch.foot}</div>
            </>
          );
          const cls = cn(
            "flex flex-col px-5 py-5",
            i === 4 && "col-span-2 xl:col-span-1",
            ch.to && "transition-colors hover:bg-[var(--ink-2)]",
          );
          const style = { background: "var(--ink)" };
          return ch.to ? (
            <Link key={ch.key} to={ch.to} className={cls} style={style}>{Inner}</Link>
          ) : (
            <div key={ch.key} className={cls} style={style}>{Inner}</div>
          );
        })}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */

export const TargetMeter = ({ target, isAdmin }: { target: DashboardOverview["target"]; isAdmin: boolean }): JSX.Element => {
  if (!target.monthly) {
    return (
      <div className="flex h-full flex-col justify-center">
        <p className="text-2 text-sm">Set a monthly revenue target to track how this month is pacing.</p>
        {isAdmin ? (
          <Link to="/settings" className="btn btn-sm mt-3 self-start">Set a target</Link>
        ) : (
          <p className="muted mt-2 text-xs">Ask an admin to add one in Settings.</p>
        )}
      </div>
    );
  }
  const pctRaw = target.progress;
  const pct = Math.min(100, pctRaw);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const expected = Math.round((now.getDate() / daysInMonth) * 100);
  const ahead = pctRaw >= expected;
  const color = pctRaw >= 100 ? "var(--success)" : ahead ? "var(--primary)" : "var(--warning)";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="condensed text-[40px] font-semibold leading-none">{pctRaw}%</span>
        <span className="muted text-sm">of {inrCompact(target.monthly)}</span>
      </div>
      <div className="relative mt-4 h-2.5 rounded-full" style={{ background: "var(--surface-3)" }} role="meter" aria-valuenow={pctRaw} aria-valuemin={0} aria-valuemax={100} aria-label="Monthly target progress">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        <div className="absolute -top-1 h-[18px] w-0.5 rounded" style={{ left: `calc(${expected}% - 1px)`, background: "var(--text-2)" }} title="Where you should be today" />
      </div>
      <div className="mt-3 flex justify-between text-xs">
        <span className="text-2">
          <span className="num font-semibold">{inr(target.achieved)}</span> closed
        </span>
        <span className="muted">Day {now.getDate()} of {daysInMonth}</span>
      </div>
      <p className="mt-4 text-sm" style={{ color: pctRaw >= 100 ? "var(--success)" : ahead ? "var(--text-2)" : "var(--warning)" }}>
        {pctRaw >= 100
          ? "Target reached for this month."
          : ahead
            ? `Ahead of pace. ${inrCompact(target.monthly - target.achieved)} to go.`
            : `Behind pace by ${Math.round(expected - pctRaw)} points. ${inrCompact(target.monthly - target.achieved)} to go.`}
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ */

export const StageBreakdown = ({ stages }: { stages: DashboardOverview["stageCounts"] }): JSX.Element => {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <ul className="space-y-3">
      {BOARD_ORDER.map((status) => {
        const s = stages.find((x) => x.status === status) ?? { status, count: 0, value: 0 };
        return (
          <li key={status}>
            <Link to={`/leads?view=list&status=${status}`} className="group block">
              <div className="mb-1.5 flex items-center gap-2 text-sm">
                <StageDot status={status} />
                <span className="font-medium group-hover:underline">{stageLabel(status)}</span>
                <span className="muted num">{num(s.count)}</span>
                <span className="num ml-auto font-medium">{inrCompact(s.value)}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "var(--surface-3)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.max(s.value ? 2 : 0, (s.value / max) * 100)}%`, background: STAGE_META[status].color }} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export const Funnel = ({ data }: { data: { status: LeadStatus; count: number }[] }): JSX.Element => {
  const top = Math.max(1, data[0]?.count ?? 1);
  return (
    <ol className="space-y-2.5">
      {data.map((d, i) => {
        const prev = i > 0 ? data[i - 1].count : null;
        const conv = prev ? Math.round((d.count / prev) * 100) : null;
        return (
          <li key={d.status} className="grid grid-cols-[92px_1fr_32px_44px] items-center gap-3 text-sm">
            <span className="text-2 truncate">{stageLabel(d.status)}</span>
            <div className="h-6 rounded-[5px]" style={{ background: "var(--surface-2)" }}>
              <div
                className="flex h-full items-center rounded-[5px] px-2 text-xs font-semibold text-white"
                style={{ width: `${Math.max(d.count ? 6 : 0, (d.count / top) * 100)}%`, background: "var(--primary)", opacity: 1 - i * 0.12 }}
              />
            </div>
            <span className="num text-right font-semibold">{num(d.count)}</span>
            <span className="num muted text-right text-xs">{conv !== null ? `${conv}%` : ""}</span>
          </li>
        );
      })}
      <li className="caption pt-1">Leads that reached each stage. The percentage is conversion from the stage above.</li>
    </ol>
  );
};

/* ------------------------------------------------------------------ */

const AgendaRow = ({ f, overdue }: { f: AgendaFollowUp; overdue?: boolean }): JSX.Element => {
  const d = dayDiff(f.dueAt);
  return (
    <Link to={`/leads/${f.leadId}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--surface-2)]">
      <div
        className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-center leading-none"
        style={{ background: overdue ? "var(--danger-soft)" : d === 0 ? "var(--primary-soft)" : "var(--surface-3)", color: overdue ? "var(--danger)" : d === 0 ? "var(--primary-text)" : "var(--text-2)" }}
      >
        <span className="text-[10px] font-semibold">{new Date(f.dueAt).toLocaleDateString("en-IN", { month: "short" })}</span>
        <span className="num text-[15px] font-bold">{new Date(f.dueAt).getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{f.customer}</div>
        <div className="muted truncate text-xs">{f.note || (f.contact && f.contact !== f.customer ? f.contact : "Follow-up")}</div>
      </div>
      <div className="text-right text-xs">
        <div style={{ color: overdue ? "var(--danger)" : "var(--text-2)" }} className="font-medium">{relativeDate(f.dueAt)}</div>
        <div className="muted">{timeOnly(f.dueAt)}</div>
      </div>
    </Link>
  );
};

export const Agenda = ({ overdue, upcoming }: { overdue: AgendaFollowUp[]; upcoming: AgendaFollowUp[] }): JSX.Element => {
  if (!overdue.length && !upcoming.length) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <CalendarClock className="muted mb-2 h-6 w-6" />
        <div className="text-sm font-medium">No follow-ups scheduled</div>
        <div className="muted mt-1 text-xs">Add one from any lead past the New stage.</div>
      </div>
    );
  }
  return (
    <div className="-mx-2">
      {overdue.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 px-2 pb-1 text-xs font-semibold" style={{ color: "var(--danger)" }}>
            <AlertCircle className="h-3.5 w-3.5" /> Overdue
          </div>
          {overdue.slice(0, 3).map((f) => <AgendaRow key={f.id} f={f} overdue />)}
          {upcoming.length > 0 && <div className="mx-2 my-2 border-t divider" />}
        </>
      )}
      {upcoming.slice(0, overdue.length ? 3 : 6).map((f) => <AgendaRow key={f.id} f={f} />)}
    </div>
  );
};

/* ------------------------------------------------------------------ */

export const SourceTable = ({ rows }: { rows: DashboardOverview["sourceBreakdown"] }): JSX.Element => {
  if (!rows.length) return <div className="muted py-6 text-center text-sm">No leads in this period.</div>;
  const max = Math.max(1, ...rows.map((r) => r.leads));
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="muted text-left text-xs">
          <th className="pb-2 font-medium">Source</th>
          <th className="pb-2 font-medium">Leads</th>
          <th className="whitespace-nowrap pb-2 text-right font-medium">Win rate</th>
          <th className="pb-2 text-right font-medium">Revenue</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 7).map((r) => (
          <tr key={r.id} className="border-t divider">
            <td className="py-2 pr-3">
              <Link to={`/leads?view=list&sourceId=${r.id}`} className="block max-w-[130px] truncate font-medium hover:underline" title={r.name}>{r.name}</Link>
            </td>
            <td className="w-[30%] py-2 pr-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full" style={{ background: "var(--surface-3)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(r.leads / max) * 100}%`, background: "var(--primary)" }} />
                </div>
                <span className="num w-6 text-right text-xs">{r.leads}</span>
              </div>
            </td>
            <td className="num py-2 text-right">{r.winRate}%</td>
            <td className="num py-2 text-right font-medium">{inrCompact(r.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const TopCustomers = ({ rows }: { rows: DashboardOverview["topCustomers"] }): JSX.Element => {
  if (!rows.length) return <div className="muted py-6 text-center text-sm">No deals closed in this period yet.</div>;
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.customerId}>
          <Link to={`/customers/${r.customerId}`} className="group flex items-start gap-3">
            <span className="num muted mt-0.5 w-4 text-xs font-semibold">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium group-hover:underline">{r.company ?? r.name}</span>
                <span className="num text-sm font-semibold">{inrCompact(r.revenue)}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full" style={{ background: "var(--surface-3)" }}>
                <div className="h-full rounded-full" style={{ width: `${(r.revenue / max) * 100}%`, background: "var(--st-won)" }} />
              </div>
              <div className="muted mt-1 truncate text-xs">{[r.company ? r.name : null, r.city, `${r.deals} deal${r.deals === 1 ? "" : "s"}`].filter(Boolean).join(", ")}</div>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
};

export const LostReasons = ({ rows }: { rows: DashboardOverview["lostReasons"] }): JSX.Element => {
  if (!rows.length) return <div className="muted py-6 text-center text-sm">No lost deals in this period.</div>;
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.reason} className="flex items-center gap-3 text-sm">
          <span className="text-2 min-w-0 flex-1 truncate">{r.reason}</span>
          <div className="h-1.5 w-20 rounded-full" style={{ background: "var(--surface-3)" }}>
            <div className="h-full rounded-full" style={{ width: `${(r.count / total) * 100}%`, background: "var(--st-lost)" }} />
          </div>
          <span className="num w-8 text-right font-medium">{r.count}</span>
        </li>
      ))}
    </ul>
  );
};

export const TeamBoard = ({ rows }: { rows: DashboardOverview["team"] }): JSX.Element => (
  <div className="-mx-5 overflow-x-auto">
    <table className="w-full min-w-[460px] text-sm">
      <thead>
        <tr className="muted text-left text-xs">
          <th className="px-5 pb-2 font-medium">Teammate</th>
          <th className="pb-2 text-right font-medium">Open</th>
          <th className="pb-2 text-right font-medium">Pipeline</th>
          <th className="pb-2 text-right font-medium">Won</th>
          <th className="px-5 pb-2 text-right font-medium">Revenue</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t divider">
            <td className="px-5 py-2.5">
              <Link to={`/leads?view=list&ownerId=${r.id}`} className="flex items-center gap-2.5 hover:underline">
                <Avatar name={r.name} size={26} />
                <span className="font-medium">{r.name}</span>
              </Link>
            </td>
            <td className="num py-2.5 text-right">{r.open}</td>
            <td className="num py-2.5 text-right">{inrCompact(r.pipeline)}</td>
            <td className="num py-2.5 text-right">
              {r.won} <span className="muted text-xs">({r.winRate}%)</span>
            </td>
            <td className="num px-5 py-2.5 text-right font-semibold">{inrCompact(r.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const ActivityFeed = ({ rows: all }: { rows: DashboardOverview["recentActivity"] }): JSX.Element => {
  const rows = all.slice(0, 7);
  if (!rows.length) return <div className="muted py-6 text-center text-sm">No activity yet.</div>;
  return (
    <ol className="relative">
      {rows.map((a, i) => (
        <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
          {i < rows.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px" style={{ background: "var(--border)" }} aria-hidden />}
          <span className="relative mt-1.5"><StageDot status={a.toStatus} size={11} /></span>
          <Link to={`/leads/${a.leadId}`} className="min-w-0 flex-1 hover:underline">
            <div className="text-sm">
              <span className="font-medium">{a.customer}</span>{" "}
              <span className="text-2">
                {a.fromStatus ? `moved to ${stageLabel(a.toStatus).toLowerCase()}` : `added as ${stageLabel(a.toStatus).toLowerCase()}`}
              </span>
            </div>
            <div className="muted text-xs">
              {a.actor ? `${a.actor}, ` : ""}
              {timeAgo(a.at)}
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
};
