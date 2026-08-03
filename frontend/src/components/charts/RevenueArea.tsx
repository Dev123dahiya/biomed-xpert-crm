import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { inrCompact } from "../../lib/format";

export const RevenueArea = ({ data }: { data: { month: string; revenue: number }[] }): JSX.Element => {
  const rows = data.map((d) => ({ month: d.month.slice(5), revenue: d.revenue }));
  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={rows} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a84ff" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0a84ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value: number) => inrCompact(value)}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#0a84ff" strokeWidth={2.5} fill="url(#rev)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};
