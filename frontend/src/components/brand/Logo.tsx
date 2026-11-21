// The mark is a single ECG complex: the signature of the bedside monitor.
export const LogoMark = ({ size = 32 }: { size?: number }): JSX.Element => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <rect width="64" height="64" rx="14" fill="#163843" />
    <path d="M8 36h12l5-13 8 24 6-17 4 6h13" fill="none" stroke="#3ddc97" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Wordmark = ({ sub = "Sales CRM", light = true }: { sub?: string; light?: boolean }): JSX.Element => (
  <div className="leading-none">
    <div className="condensed text-[15px] font-bold tracking-[0.02em]" style={{ color: light ? "#fff" : "var(--text)" }}>
      BIOMED XPERT
    </div>
    <div className="mt-1 text-[11px] font-medium" style={{ color: light ? "var(--ink-muted)" : "var(--muted)" }}>{sub}</div>
  </div>
);
