import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisInr, inr, monthLabel, num } from "../../lib/format";

interface Row { month: string; revenue: number; deals: number; leads: number }

const TooltipBody = ({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }): JSX.Element | null => {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="pop px-3 py-2 text-xs">
      <div className="mb-1 font-semibold">{monthLabel(r.month, true)}</div>
      <div className="flex items-center gap-2">
        <span className="h-0.5 w-3 rounded" style={{ background: "var(--primary)" }} />
        <span className="muted">Revenue</span>
        <span className="num ml-auto pl-4 font-semibold">{inr(r.revenue)}</span>
      </div>
      <div className="muted mt-0.5 flex justify-between gap-4">
        <span>Deals won</span>
        <span className="num">{num(r.deals)}</span>
      </div>
      <div className="muted flex justify-between gap-4">
        <span>New leads</span>
        <span className="num">{num(r.leads)}</span>
      </div>
    </div>
  );
};

// Single series: revenue closed per month. The optional target is a reference line, not a second series.
export const RevenueTrend = ({ data, target }: { data: Row[]; target?: number }): JSX.Element => (
  <ResponsiveContainer width="100%" height={240}>
    <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.16} />
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
        tickFormatter={axisInr}
        tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
        axisLine={false}
        tickLine={false}
        width={44}
        allowDecimals={false}
      />
      <Tooltip content={<TooltipBody />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} />
      {target ? (
        <ReferenceLine
          y={target}
          stroke="var(--st-quote)"
          strokeWidth={1.5}
          label={{ value: "Monthly target", position: "insideTopRight", fill: "var(--muted)", fontSize: 11 }}
        />
      ) : null}
      <Area
        type="monotone"
        dataKey="revenue"
        stroke="var(--primary)"
        strokeWidth={2}
        fill="url(#revFill)"
        dot={false}
        activeDot={{ r: 4.5, stroke: "var(--surface)", strokeWidth: 2, fill: "var(--primary)" }}
      />
    </AreaChart>
  </ResponsiveContainer>
);
