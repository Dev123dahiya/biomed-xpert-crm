import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis } from "recharts";
import type { LeadStatus } from "../../types";
import { STAGE_META } from "../../lib/stages";

export const StageBars = ({ data }: { data: { status: LeadStatus; count: number }[] }): JSX.Element => {
  const rows = data.map((d) => ({ name: STAGE_META[d.status].label, count: d.count, color: STAGE_META[d.status].color }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={rows} margin={{ top: 20, right: 8, left: 8, bottom: 4 }}>
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} interval={0} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          <LabelList dataKey="count" position="top" style={{ fill: "var(--text)", fontSize: 12, fontWeight: 600 }} />
          {rows.map((r) => (
            <Cell key={r.name} fill={r.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
