export const ProportionBar = ({ won, lost, open }: { won: number; lost: number; open: number }): JSX.Element => {
  const total = Math.max(1, won + lost + open);
  const seg = (v: number): string => `${(v / total) * 100}%`;
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
        <div style={{ width: seg(won), background: "#16a34a" }} />
        <div style={{ width: seg(lost), background: "#ef4444" }} />
        <div style={{ width: seg(open), background: "#94a3b8" }} />
      </div>
      <div className="mt-4 flex gap-5 text-xs">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: "#16a34a" }} /> Won</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: "#ef4444" }} /> Lost</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: "#94a3b8" }} /> Open</span>
      </div>
    </div>
  );
};
