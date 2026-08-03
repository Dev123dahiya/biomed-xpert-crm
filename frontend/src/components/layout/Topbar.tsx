import { Bell, Moon, Search, Sun } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useTheme } from "../../lib/theme";

export const Topbar = (): JSX.Element => {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (q.trim()) navigate(`/leads?search=${encodeURIComponent(q.trim())}`);
  };

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 px-4" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
      <form onSubmit={submit} className="relative max-w-md flex-1">
        <Search className="muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input className="input pl-9" placeholder="Search customers, leads, GSTIN, phone..." value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      <button className="btn btn-ghost" onClick={toggle} aria-label="Toggle theme">
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <button className="btn btn-ghost relative" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full" style={{ background: "var(--secondary)" }} />
      </button>
      <button className="btn btn-ghost" onClick={() => navigate("/profile")} aria-label="Profile">
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: "var(--primary)" }}>
          {initials}
        </span>
      </button>
    </header>
  );
};
