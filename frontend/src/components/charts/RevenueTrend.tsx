import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisInr, inr, monthLabel, num } from "../../lib/format";

interface Row { month: string; revenue: number; deals: number; leads: number }
export type TrendMetric = "revenue" | "deals" | "leads";

const LABEL: Record<TrendMetric, string> = { revenue: "Revenue", deals: "Deals won", leads: "New leads" };

const TooltipBody = ({ active, payload, metric }: { active?: boolean; payload?: { payload: Row }[]; metric: TrendMetric }): JSX.Element | null => {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  const rows: [TrendMetric, string][] = [["revenue", inr(r.revenue)], ["deals", num(r.deals)], ["leads", num(r.leads)]];
  return (
    <div className="pop min-w-[170px] px-3 py-2 text-xs">
      <div className="mb-1.5 font-semibold">{monthLabel(r.month, true)}</div>
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2 py-px" style={{ opacity: k === metric ? 1 : 0.65 }}>
          <span className="h-0.5 w-3 rounded" style={{ background: k === metric ? "var(--primary)" : "transparent" }} />
          <span className={k === metric ? "" : "muted"}>{LABEL[k]}</span>
          <span className="num ml-auto pl-4 font-semibold">{v}</span>
        </div>
      ))}
    </div>
  );
};

// One series at a time (no dual axis). The metric switcher picks which.
export const RevenueTrend = ({ data, target, metric = "revenue" }: { data: Row[]; target?: number; metric?: TrendMetric }): JSX.Element => (
  <ResponsiveContainer width="100%" height={248}>
    <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
      <XAxis
        dataKey="month"
        tickFormatter={(m: string) => monthLabel(m)}
        tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
        axisLine={false}
        tickLine={false}
        interval="preserveStartEnd"
        minTickGap={12}
      />
      <YAxis
        tickFormatter={metric === "revenue" ? axisInr : (v: number) => num(v)}
        tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
        axisLine={false}
        tickLine={false}
        width={44}
        allowDecimals={false}
      />
      <Tooltip content={<TooltipBody metric={metric} />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} />
      {target && metric === "revenue" ? (
        <ReferenceLine
          y={target}
          stroke="var(--st-quote)"
          strokeWidth={1.5}
          label={{ value: "Monthly target", position: "insideTopRight", fill: "var(--muted)", fontSize: 11 }}
        />
      ) : null}
      <Area
        key={metric}
        type="monotone"
        dataKey={metric}
        stroke="var(--primary)"
        strokeWidth={2}
        fill="url(#trendFill)"
        dot={false}
        activeDot={{ r: 4.5, stroke: "var(--surface)", strokeWidth: 2, fill: "var(--primary)" }}
        animationDuration={900}
        animationEasing="ease-out"
      />
    </AreaChart>
  </ResponsiveContainer>
);
