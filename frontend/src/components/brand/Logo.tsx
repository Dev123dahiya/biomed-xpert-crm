// A single heartbeat on a blue tile: medical, calm, and legible at 16px.
export const LogoMark = ({ size = 28 }: { size?: number }): JSX.Element => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
    <defs>
      <linearGradient id="bmx-tile" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3b78f2" />
        <stop offset="100%" stopColor="#1f55d6" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#bmx-tile)" />
    <path d="M12 34h9l4.5-11 7 20 5.5-14 3.5 5H52" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Wordmark = ({ sub = "Sales CRM" }: { sub?: string; light?: boolean }): JSX.Element => (
  <div className="min-w-0 leading-none">
    <div className="truncate text-[13.5px] font-semibold tracking-[-0.01em]" style={{ color: "var(--text)" }}>BIOMED XPERT</div>
    <div className="mt-[3px] truncate text-[11.5px]" style={{ color: "var(--muted)" }}>{sub}</div>
  </div>
);
