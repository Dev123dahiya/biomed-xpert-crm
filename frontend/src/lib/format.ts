const inrFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const numFmt = new Intl.NumberFormat("en-IN");

export const inr = (value?: number | null): string => inrFmt.format(value ?? 0);
export const num = (value?: number | null): string => numFmt.format(value ?? 0);

// Indian short scale: thousand, lakh, crore.
export const inrCompact = (value?: number | null): string => {
  const v = value ?? 0;
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const trim = (n: number, d: number) => n.toFixed(d).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
  if (abs >= 1_00_00_000) return `${sign}₹${trim(abs / 1_00_00_000, 2)} Cr`;
  if (abs >= 1_00_000) return `${sign}₹${trim(abs / 1_00_000, 2)} L`;
  if (abs >= 1_000) return `${sign}₹${trim(abs / 1_000, 1)}K`;
  return inr(v);
};

export const axisInr = (value: number): string => {
  if (value === 0) return "0";
  if (Math.abs(value) >= 1_00_00_000) return `${+(value / 1_00_00_000).toFixed(1)}Cr`;
  if (Math.abs(value) >= 1_00_000) return `${+(value / 1_00_000).toFixed(1)}L`;
  if (Math.abs(value) >= 1_000) return `${+(value / 1_000).toFixed(0)}K`;
  return String(value);
};

export const shortDate = (value?: string | Date | null): string =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

export const dayMonth = (value?: string | Date | null): string =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";

export const timeOnly = (value?: string | Date | null): string =>
  value ? new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "";

export const dateTime = (value?: string | Date | null): string => (value ? `${shortDate(value)}, ${timeOnly(value)}` : "");

export const monthLabel = (key: string, withYear = false): string => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", withYear ? { month: "short", year: "numeric" } : { month: "short" });
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export const dayDiff = (value: string | Date): number => Math.round((startOfDay(new Date(value)) - startOfDay(new Date())) / 86_400_000);

export const relativeDate = (value?: string | null): string => {
  if (!value) return "";
  const days = dayDiff(value);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days < 7) return new Date(value).toLocaleDateString("en-IN", { weekday: "long" });
  if (days > 0) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
};

export const timeAgo = (value?: string | null): string => {
  if (!value) return "";
  const secs = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return shortDate(value);
};

export const daysSince = (value?: string | null): number =>
  value ? Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)) : 0;

export const initials = (name?: string | null): string =>
  (name ?? "?")
    .replace(/^(dr|mr|mrs|ms)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

export const pctChange = (current: number, previous: number): number | null => {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

// Phone numbers for tel: and WhatsApp links. Assumes India when no country code is present.
export const phoneDigits = (phone?: string | null): string => {
  const d = (phone ?? "").replace(/[^\d]/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
};

export const toDateInput = (value?: string | Date | null): string => {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// "22 Nov 2026, 11:46 pm" plus the weekday, for exact-time hovers.
export const fullDateTime = (value?: string | Date | null): string =>
  value
    ? new Date(value).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "";

export const pctOf = (part: number, whole: number): string => (whole ? `${Math.round((part / whole) * 1000) / 10}%` : "0%");
