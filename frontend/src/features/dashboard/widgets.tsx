import { AlarmClock, AlertCircle, ArrowDownRight, ArrowUpRight, CalendarClock, Check, IndianRupee, Layers, Minus, Target, UserPlus, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkline } from "../../components/ui/Sparkline";
import { StageDot } from "../../components/ui/Badges";
import { Avatar } from "../../components/ui/Avatar";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";
import { Bar } from "../../components/ui/Bar";
import { DetailRows, HoverCard, HoverTitle, Tooltip } from "../../components/ui/HoverCard";
import { DateHint } from "../../components/ui/Figure";
import { useToast } from "../../components/ui/Toast";
import { useLeadMutations } from "../../hooks/useLeads";
import { apiError } from "../../lib/api";
import { fullDateTime, inr, inrCompact, num, pctOf, relativeDate, timeAgo, timeOnly, dayDiff } from "../../lib/format";
import { easeOut } from "../../lib/motion";
import { BOARD_ORDER, STAGE_META, stageLabel } from "../../lib/stages";
import type { AgendaFollowUp, DashboardOverview, LeadStatus } from "../../types";
import { cn } from "../../lib/cn";

// Sets the cursor position for the .spotlight hover highlight.
const trackSpotlight = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};

export const Panel = ({ title, sub, action, children, className, bodyClass, index = 0 }: { title: string; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string; index?: number }): JSX.Element => (
  <motion.section
    className={cn("panel flex flex-col", className)}
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "0px 0px -40px 0px" }}
    transition={{ duration: 0.45, ease: easeOut, delay: (index % 3) * 0.06 }}
  >
    <header className="flex items-start justify-between gap-3 px-5 pb-1 pt-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {sub && <div className="caption mt-0.5">{sub}</div>}
      </div>
      {action}
    </header>
    <div className={cn("flex-1 px-5 pb-5 pt-3", bodyClass)}>{children}</div>
  </motion.section>
);

/* ------------------------------------------------------------------ */
/* KPI cards: every number carries a trend or a comparison, as in HubSpot and Zoho */

interface Kpi {
  key: string;
  label: string;
  value: number;
  format: (n: number) => string;
  icon: LucideIcon;
  foot: ReactNode;
  help: string;
  detail: ([ReactNode, ReactNode] | null | false | undefined)[];
  trend?: number[];
  tone?: string;
  to?: string;
}

const DeltaPill = ({ value, label }: { value: number | null; label: string }): JSX.Element => {
  if (value === null) return <span className="muted">New this period</span>;
  const up = value > 0;
  const flat = value === 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const shown = Math.abs(value) >= 100 ? Math.round(Math.abs(value)).toLocaleString("en-IN") : Math.abs(value);
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 20 }}
        className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-px text-[11.5px] font-semibold"
        style={{
          background: flat ? "var(--surface-3)" : up ? "var(--success-soft)" : "var(--danger-soft)",
          color: flat ? "var(--muted)" : up ? "var(--success)" : "var(--danger)",
        }}
      >
        <Icon className="h-3 w-3" />
        {shown}%
      </motion.span>
      <span className="muted truncate">{label}</span>
    </span>
  );
};

const pctFmt = (n: number) => `${(Math.round(n * 10) / 10).toString()}%`;
const intFmt = (n: number) => num(Math.round(n));

export const KpiCards = ({ data, compareLabel, periodLabel = "this period" }: { data: DashboardOverview; periodLabel?: string; compareLabel: string | null }): JSX.Element => {
  const c = data.cards;
  const prev = data.previous;
  const period = periodLabel.toLowerCase();
  const closed = c.won + c.lost;
  const change = (cur: number, p?: number) => (prev && p !== undefined ? (p ? Math.round(((cur - p) / p) * 1000) / 10 : cur ? null : 0) : undefined);
  const revDelta = change(data.current.revenue, prev?.revenue);
  const leadDelta = change(data.current.newLeads, prev?.newLeads);

  const kpis: Kpi[] = [
    {
      key: "rev",
      label: "Revenue",
      value: data.current.revenue,
      format: inrCompact,
      icon: IndianRupee,
      help: "Value of deals closed in the selected period, by order date.",
      trend: data.trend.map((t) => t.revenue),
      foot: revDelta !== undefined && compareLabel ? <DeltaPill value={revDelta} label={compareLabel} /> : <span className="muted">{num(data.current.wonCount)} deals closed</span>,
      detail: [
        ["Exact", inr(data.current.revenue)],
        ["Deals closed", num(data.current.wonCount)],
        data.current.wonCount > 0 && ["Average deal", inr(Math.round(data.current.revenue / data.current.wonCount))],
        prev && ["Previous period", inr(prev.revenue)],
        prev && ["Change", `${data.current.revenue - prev.revenue >= 0 ? "+" : "−"}${inr(Math.abs(data.current.revenue - prev.revenue))}`],
      ],
      to: "/leads?view=list&status=WON",
    },
    {
      key: "pipe",
      label: "Open pipeline",
      value: c.pipelineValue,
      format: inrCompact,
      icon: Layers,
      help: "Approximate value of every lead that is still open.",
      foot: <span className="muted">{num(c.openLeads)} open leads</span>,
      detail: [
        ["Exact", inr(c.pipelineValue)],
        ["Open leads", num(c.openLeads)],
        c.openLeads > 0 && ["Average size", inr(Math.round(c.pipelineValue / c.openLeads))],
        ["Quote shared", `${num(c.quoteShared)} leads`],
        ["Qualified", `${num(c.qualified)} leads`],
      ],
      to: "/leads",
    },
    {
      key: "leads",
      label: "New leads",
      value: data.current.newLeads,
      format: intFmt,
      icon: UserPlus,
      help: "Leads created in the selected period.",
      trend: data.trend.map((t) => t.leads),
      foot: leadDelta !== undefined && compareLabel ? <DeltaPill value={leadDelta} label={compareLabel} /> : <span className="muted">{num(c.newCustomers)} new customers</span>,
      detail: [
        [`New leads, ${period}`, num(data.current.newLeads)],
        ["New customers", num(c.newCustomers)],
        prev && ["Previous period", num(prev.newLeads)],
        ["Leads, all time", num(c.totalLeads)],
        ["Customers, all time", num(c.totalCustomers)],
      ],
      to: "/leads?view=list&sort=-createdAt",
    },
    {
      key: "win",
      label: "Win rate",
      value: c.winRate,
      format: pctFmt,
      icon: Target,
      help: "Won deals as a share of all closed deals (won plus lost).",
      foot: <span className="muted">{num(c.won)} won, {num(c.lost)} lost{c.avgDealSize ? `, avg ${inrCompact(c.avgDealSize)}` : ""}</span>,
      detail: [
        ["Won", `${num(c.won)} (${pctOf(c.won, closed)})`],
        ["Lost", `${num(c.lost)} (${pctOf(c.lost, closed)})`],
        ["Closed in total", num(closed)],
        ["Win to loss", `${c.winLossRatio} : 1`],
        c.avgDealSize > 0 && ["Average won deal", inr(c.avgDealSize)],
      ],
    },
    {
      key: "fu",
      label: "Overdue follow-ups",
      value: c.overdueFollowUps,
      format: intFmt,
      icon: AlarmClock,
      help: "Follow-ups past their due date that aren't marked done.",
      tone: c.overdueFollowUps > 0 ? "var(--danger)" : undefined,
      foot: <span className="muted">{num(c.dueTodayFollowUps)} due today</span>,
      detail: [
        ["Overdue", num(c.overdueFollowUps)],
        ["Due today", num(c.dueTodayFollowUps)],
        data.overdueFollowUps[0] && ["Oldest overdue", `${data.overdueFollowUps[0].customer}, ${relativeDate(data.overdueFollowUps[0].dueAt).toLowerCase()}`],
        data.upcomingFollowUps[0] && ["Next up", `${data.upcomingFollowUps[0].customer}, ${relativeDate(data.upcomingFollowUps[0].dueAt).toLowerCase()}`],
      ],
      to: "/follow-ups?scope=overdue",
    },
  ];

  return (
    <motion.section
      className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 xl:gap-4"
      aria-label="Key numbers"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {kpis.map((k, i) => {
        const body = (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="muted truncate text-[12.5px] font-medium">{k.label}</span>
              <Tooltip content={k.help} side="bottom">
                <k.icon className="muted h-4 w-4 shrink-0 transition-colors group-hover:text-[var(--primary)]" tabIndex={0} aria-label={k.help} />
              </Tooltip>
            </div>
            <div className="mt-2.5 flex items-end justify-between gap-2">
              <AnimatedNumber value={k.value} format={k.format} className="condensed whitespace-nowrap text-[24px] leading-none" style={{ color: k.tone }} />
              {k.trend && k.trend.some((v) => v > 0) && (
                <div className="hidden w-[72px] sm:block">
                  <Sparkline values={k.trend} color="var(--primary)" width={72} height={28} fill />
                </div>
              )}
            </div>
            <div className="mt-3 truncate text-[12px]" title={k.key === "rev" || k.key === "leads" ? "Compared with the same point in the previous period" : undefined}>{k.foot}</div>
          </>
        );
        const card = cn("panel spotlight group block h-full p-4 transition-[border-color,box-shadow,transform] duration-200", k.to && "hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]");
        return (
          <motion.div key={k.key} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } } }} className={cn("h-full", i === 4 && "col-span-2 md:col-span-1")}>
            <HoverCard
              width={248}
              side="bottom"
              content={
                <>
                  <HoverTitle sub={k.help}>{k.label}</HoverTitle>
                  <div className="border-t pt-2 divider"><DetailRows rows={k.detail} /></div>
                  {k.to && <div className="muted mt-2 text-[11px]">Click to open</div>}
                </>
              }
            >
              {k.to ? (
                <Link to={k.to} className={card} onMouseMove={trackSpotlight}>{body}</Link>
              ) : (
                <div className={card} onMouseMove={trackSpotlight}>{body}</div>
              )}
            </HoverCard>
          </motion.div>
        );
      })}
    </motion.section>
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
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const expected = Math.round((now.getDate() / daysInMonth) * 100);
  const ahead = pctRaw >= expected;
  const color = pctRaw >= 100 ? "var(--success)" : ahead ? "var(--primary)" : "var(--warning)";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <AnimatedNumber value={pctRaw} format={pctFmt} duration={1.2} className="condensed text-[40px] leading-none" />
        <span className="muted text-sm">of {inrCompact(target.monthly)}</span>
      </div>
      <HoverCard
        width={230}
        content={
          <>
            <HoverTitle sub={`Day ${now.getDate()} of ${daysInMonth}`}>This month's target</HoverTitle>
            <div className="border-t pt-2 divider">
              <DetailRows
                rows={[
                  ["Closed so far", inr(target.achieved)],
                  ["Target", inr(target.monthly)],
                  ["Still to go", inr(Math.max(0, target.monthly - target.achieved))],
                  ["Progress", `${pctRaw}%`],
                  ["Expected by today", `${expected}%`],
                ]}
              />
            </div>
          </>
        }
      >
      <div className="relative mt-4 w-full" role="meter" aria-valuenow={pctRaw} aria-valuemin={0} aria-valuemax={100} aria-label="Monthly target progress">
        <Bar pct={pctRaw} color={color} height={10} />
        <div className="absolute -top-1" style={{ left: `calc(${expected}% - 1px)` }}>
          <Tooltip content={`Where you should be by day ${now.getDate()}: ${expected}%`}>
            <motion.span
              className="block h-[18px] w-0.5 cursor-help rounded"
              style={{ background: "var(--text-2)" }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.9, duration: 0.3 }}
            />
          </Tooltip>
        </div>
      </div>
      </HoverCard>
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
  const totalValue = stages.reduce((sum, s) => sum + s.value, 0);
  const totalCount = stages.reduce((sum, s) => sum + s.count, 0);
  return (
    <ul className="space-y-3">
      {BOARD_ORDER.map((status, i) => {
        const s = stages.find((x) => x.status === status) ?? { status, count: 0, value: 0 };
        return (
          <li key={status}>
            <HoverCard
              width={232}
              side="right"
              content={
                <>
                  <HoverTitle sub={STAGE_META[status].hint}>{stageLabel(status)}</HoverTitle>
                  <div className="border-t pt-2 divider">
                    <DetailRows
                      rows={[
                        ["Leads", `${num(s.count)} (${pctOf(s.count, totalCount)})`],
                        [status === "WON" ? "Order value" : "Value", inr(s.value)],
                        ["Share of value", pctOf(s.value, totalValue)],
                        s.count > 0 && ["Average", inr(Math.round(s.value / s.count))],
                      ]}
                    />
                  </div>
                  <div className="muted mt-2 text-[11px]">Click to list these leads</div>
                </>
              }
            >
            <Link to={`/leads?view=list&status=${status}`} className="group -mx-2 block rounded-lg px-2 py-1 transition-colors hover:bg-[var(--surface-2)]">
              <div className="mb-1.5 flex items-center gap-2 text-[13px]">
                <StageDot status={status} />
                <span className="font-medium">{stageLabel(status)}</span>
                <span className="muted num">{num(s.count)}</span>
                <span className="num ml-auto font-medium">{inrCompact(s.value)}</span>
                <ArrowUpRight className="muted -mr-1 h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <Bar pct={(s.value / max) * 100} color={STAGE_META[status].color} delay={i * 0.06} minPct={2} />
            </Link>
            </HoverCard>
          </li>
        );
      })}
    </ul>
  );
};

export const Funnel = ({ data }: { data: { status: LeadStatus; count: number }[] }): JSX.Element => {
  const top = Math.max(1, data[0]?.count ?? 1);
  return (
    <div>
      <ol className="space-y-3.5">
        {data.map((d, i) => {
          const prev = i > 0 ? data[i - 1].count : null;
          const conv = prev ? Math.round((d.count / prev) * 100) : null;
          return (
            <li key={d.status}>
              <HoverCard
                width={238}
                side="right"
                content={
                  <>
                    <HoverTitle sub={`Leads that reached ${stageLabel(d.status).toLowerCase()}`}>{stageLabel(d.status)}</HoverTitle>
                    <div className="border-t pt-2 divider">
                      <DetailRows
                        rows={[
                          ["Reached", num(d.count)],
                          prev !== null && ["From previous stage", `${conv}%`],
                          prev !== null && ["Dropped off", `${num(prev - d.count)} leads`],
                          i > 0 && ["Of all leads", pctOf(d.count, top)],
                        ]}
                      />
                    </div>
                  </>
                }
              >
              <div className="w-full">
              <div className="mb-1.5 flex items-baseline gap-2 text-[13px]">
                <span className="text-2">{stageLabel(d.status)}</span>
                <span className="num ml-auto font-medium">{num(d.count)}</span>
                <span className="num muted w-10 text-right text-xs">{conv !== null ? `${conv}%` : ""}</span>
              </div>
              <Bar pct={(d.count / top) * 100} color="var(--primary)" opacity={1 - i * 0.14} delay={i * 0.08} minPct={2} />
              </div>
              </HoverCard>
            </li>
          );
        })}
      </ol>
      <p className="caption mt-4">Leads that reached each stage. The percentage is conversion from the stage above.</p>
    </div>
  );
};

/* ------------------------------------------------------------------ */

const AgendaRow = ({ f, overdue, onDone }: { f: AgendaFollowUp; overdue?: boolean; onDone: (f: AgendaFollowUp) => void }): JSX.Element => {
  const d = dayDiff(f.dueAt);
  const [checking, setChecking] = useState(false);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, height: 0, marginTop: 0, marginBottom: 0, transition: { duration: 0.28, ease: easeOut } }}
      transition={{ duration: 0.3, ease: easeOut }}
      className="group flex items-center gap-3 overflow-hidden rounded-lg px-2 py-2 hover:bg-[var(--surface-2)]"
    >
      <Tooltip content="Mark as done">
        <button
          onClick={() => { setChecking(true); setTimeout(() => onDone(f), 260); }}
          className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors hover:border-[var(--success)]"
          style={{ borderColor: checking ? "var(--success)" : overdue ? "color-mix(in srgb, var(--danger) 55%, transparent)" : "var(--border-strong)", background: checking ? "var(--success)" : "transparent" }}
          aria-label={`Mark follow-up with ${f.customer} as done`}
        >
          <AnimatePresence>
            {checking && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 20 }}>
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </Tooltip>
      <HoverCard
        width={250}
        side="left"
        content={
          <>
            <HoverTitle sub={f.contact && f.contact !== f.customer ? f.contact : undefined}>{f.customer}</HoverTitle>
            <div className="border-t pt-2 divider">
              <DetailRows
                rows={[
                  ["Due", fullDateTime(f.dueAt)],
                  [overdue ? "Overdue by" : "Due in", overdue ? `${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"}` : d === 0 ? "Today" : `${d} day${d === 1 ? "" : "s"}`],
                  f.note ? ["Note", <span className="font-normal">{f.note}</span>] : null,
                ]}
              />
            </div>
            <div className="muted mt-2 text-[11px]">Tick the circle to mark it done, or click to open the lead</div>
          </>
        }
      >
      <Link to={`/leads/${f.leadId}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className={cn("truncate text-[13px] font-medium transition-colors", checking && "muted line-through")}>{f.customer}</div>
          <div className="muted truncate text-xs">{f.note || (f.contact && f.contact !== f.customer ? f.contact : "Follow-up")}</div>
        </div>
        <div className="text-right text-xs">
          <div style={{ color: overdue ? "var(--danger)" : d === 0 ? "var(--primary-text)" : "var(--text-2)" }} className="font-medium">{relativeDate(f.dueAt)}</div>
          <div className="muted">{timeOnly(f.dueAt)}</div>
        </div>
      </Link>
      </HoverCard>
    </motion.li>
  );
};

export const Agenda = ({ overdue, upcoming }: { overdue: AgendaFollowUp[]; upcoming: AgendaFollowUp[] }): JSX.Element => {
  const { updateFollowUp } = useLeadMutations();
  const { toast } = useToast();
  const [done, setDone] = useState<Set<string>>(new Set());

  // Optimistic: the row leaves right away, and comes back if the server says no.
  const complete = async (f: AgendaFollowUp) => {
    setDone((s) => new Set(s).add(f.id));
    try {
      await updateFollowUp.mutateAsync({ followUpId: f.id, leadId: f.leadId, done: true });
      toast(`Follow-up with ${f.customer} done`);
    } catch (err) {
      setDone((s) => { const n = new Set(s); n.delete(f.id); return n; });
      toast(apiError(err).message, "error");
    }
  };

  const od = overdue.filter((f) => !done.has(f.id));
  const up = upcoming.filter((f) => !done.has(f.id));

  if (!od.length && !up.length) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 text-center">
        <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
          {done.size ? <Check className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
        </span>
        <div className="text-sm font-medium">{done.size ? "All caught up" : "No follow-ups scheduled"}</div>
        <div className="muted mt-1 text-xs">{done.size ? "Nice work. Nothing else is due." : "Add one from any lead past the New stage."}</div>
      </motion.div>
    );
  }
  return (
    <div className="-mx-2">
      {od.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 px-2 pb-1 text-xs font-medium" style={{ color: "var(--danger)" }}>
            <AlertCircle className="h-3.5 w-3.5" /> Overdue
          </div>
          <ul>
            <AnimatePresence initial={false}>
              {od.slice(0, 3).map((f) => <AgendaRow key={f.id} f={f} overdue onDone={complete} />)}
            </AnimatePresence>
          </ul>
          {up.length > 0 && <div className="mx-2 my-2 border-t divider" />}
        </>
      )}
      <ul>
        <AnimatePresence initial={false}>
          {up.slice(0, od.length ? 3 : 6).map((f) => <AgendaRow key={f.id} f={f} onDone={complete} />)}
        </AnimatePresence>
      </ul>
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
          <th className="whitespace-nowrap pb-2 pl-2 text-right font-medium">Win rate</th>
          <th className="pb-2 pl-3 text-right font-medium">Revenue</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 7).map((r, i) => (
          <tr key={r.id} className="group border-t transition-colors divider hover:bg-[var(--surface-2)]">
            <td className="py-2 pr-3">
              <HoverCard
                width={236}
                side="right"
                content={
                  <>
                    <HoverTitle sub="Lead source">{r.name}</HoverTitle>
                    <div className="border-t pt-2 divider">
                      <DetailRows
                        rows={[
                          ["Leads", num(r.leads)],
                          ["Won", `${num(r.won)} (${r.winRate}%)`],
                          ["Revenue", inr(r.revenue)],
                          r.won > 0 && ["Average deal", inr(Math.round(r.revenue / r.won))],
                          ["Share of leads", pctOf(r.leads, rows.reduce((s2, x) => s2 + x.leads, 0))],
                        ]}
                      />
                    </div>
                    <div className="muted mt-2 text-[11px]">Click to list these leads</div>
                  </>
                }
              >
                <Link to={`/leads?view=list&sourceId=${r.id}`} className="block max-w-[130px] truncate font-medium hover:underline" title={r.name}>{r.name}</Link>
              </HoverCard>
            </td>
            <td className="w-[26%] py-2 pr-2">
              <div className="flex items-center gap-2">
                <div className="flex-1"><Bar pct={(r.leads / max) * 100} color="var(--primary)" height={6} delay={i * 0.05} /></div>
                <span className="num w-6 text-right text-xs">{r.leads}</span>
              </div>
            </td>
            <td className="num whitespace-nowrap py-2 pl-2 text-right">{r.winRate}%</td>
            <td className="num whitespace-nowrap py-2 pl-3 text-right font-medium">{inrCompact(r.revenue)}</td>
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
    <ol className="space-y-1">
      {rows.map((r, i) => (
        <li key={r.customerId}>
          <HoverCard
            width={240}
            side="right"
            content={
              <>
                <HoverTitle sub={[r.company ? r.name : null, r.city].filter(Boolean).join(", ") || undefined}>{r.company ?? r.name}</HoverTitle>
                <div className="border-t pt-2 divider">
                  <DetailRows
                    rows={[
                      ["Revenue", inr(r.revenue)],
                      ["Deals won", num(r.deals)],
                      ["Average deal", inr(Math.round(r.revenue / Math.max(1, r.deals)))],
                      ["Rank", `#${i + 1}`],
                      ["Share of top", pctOf(r.revenue, rows.reduce((s2, x) => s2 + x.revenue, 0))],
                    ]}
                  />
                </div>
                <div className="muted mt-2 text-[11px]">Click to open the customer</div>
              </>
            }
          >
          <Link to={`/customers/${r.customerId}`} className="group -mx-2 flex w-full items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--surface-2)]">
            <span className="num muted mt-0.5 w-4 text-xs font-semibold">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] font-medium">{r.company ?? r.name}</span>
                <span className="num text-[13px] font-semibold">{inrCompact(r.revenue)}</span>
              </div>
              <div className="mt-1.5"><Bar pct={(r.revenue / max) * 100} color="var(--st-won)" height={6} delay={i * 0.07} /></div>
              <div className="muted mt-1 truncate text-xs">{[r.company ? r.name : null, r.city, `${r.deals} deal${r.deals === 1 ? "" : "s"}`].filter(Boolean).join(", ")}</div>
            </div>
          </Link>
          </HoverCard>
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
      {rows.map((r, i) => (
        <li key={r.reason}>
          <HoverCard
            width={226}
            side="right"
            content={
              <>
                <HoverTitle sub="Reason given when the deal was lost">{r.reason}</HoverTitle>
                <div className="border-t pt-2 divider">
                  <DetailRows rows={[["Deals lost", num(r.count)], ["Share of losses", pctOf(r.count, total)], ["All losses", num(total)]]} />
                </div>
              </>
            }
          >
            <span className="flex w-full items-center gap-3 text-[13px]">
              <span className="text-2 min-w-0 flex-1 truncate">{r.reason}</span>
              <span className="w-20"><Bar pct={(r.count / total) * 100} color="var(--st-lost)" height={6} delay={i * 0.06} /></span>
              <span className="num w-8 text-right font-medium">{r.count}</span>
            </span>
          </HoverCard>
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
        {rows.map((r, i) => (
          <motion.tr
            key={r.id}
            className="border-t transition-colors divider hover:bg-[var(--surface-2)]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <td className="px-5 py-2.5">
              <HoverCard
                width={234}
                side="right"
                content={
                  <>
                    <HoverTitle sub="Leads owned in this period">{r.name}</HoverTitle>
                    <div className="border-t pt-2 divider">
                      <DetailRows
                        rows={[
                          ["Open leads", num(r.open)],
                          ["Open pipeline", inr(r.pipeline)],
                          ["Deals won", num(r.won)],
                          ["Revenue", inr(r.revenue)],
                          ["Win rate", `${r.winRate}%`],
                        ]}
                      />
                    </div>
                    <div className="muted mt-2 text-[11px]">Click to list their leads</div>
                  </>
                }
              >
                <Link to={`/leads?view=list&ownerId=${r.id}`} className="flex items-center gap-2.5 hover:underline">
                  <Avatar name={r.name} size={26} />
                  <span className="font-medium">{r.name}</span>
                </Link>
              </HoverCard>
            </td>
            <td className="num py-2.5 text-right">{r.open}</td>
            <td className="num py-2.5 text-right">{inrCompact(r.pipeline)}</td>
            <td className="num py-2.5 text-right">
              {r.won} <span className="muted text-xs">({r.winRate}%)</span>
            </td>
            <td className="num px-5 py-2.5 text-right font-semibold">{inrCompact(r.revenue)}</td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const ActivityFeed = ({ rows: all }: { rows: DashboardOverview["recentActivity"] }): JSX.Element => {
  const rows = all.slice(0, 7);
  if (!rows.length) return <div className="muted py-6 text-center text-sm">No activity yet.</div>;
  return (
    <motion.ol
      className="relative"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      {rows.map((a, i) => (
        <motion.li
          key={i}
          className="relative flex gap-3 pb-4 last:pb-0"
          variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: easeOut } } }}
        >
          {i < rows.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px" style={{ background: "var(--border)" }} aria-hidden />}
          <span className="relative mt-1.5"><StageDot status={a.toStatus} size={11} /></span>
          <Link to={`/leads/${a.leadId}`} className="min-w-0 flex-1 hover:underline">
            <div className="text-[13px]">
              <span className="font-medium">{a.customer}</span>{" "}
              <span className="text-2">
                {a.fromStatus ? `moved to ${stageLabel(a.toStatus).toLowerCase()}` : `added as ${stageLabel(a.toStatus).toLowerCase()}`}
              </span>
            </div>
            <div className="muted text-xs">
              {a.actor ? `${a.actor}, ` : ""}
              <DateHint value={a.at} />
            </div>
          </Link>
        </motion.li>
      ))}
    </motion.ol>
  );
};
