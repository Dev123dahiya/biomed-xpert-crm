import { Activity, FileBarChart, GitBranch, LayoutDashboard, Package, Settings, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/leads", label: "Leads", icon: GitBranch },
  { to: "/products", label: "Products", icon: Package },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const Sidebar = (): JSX.Element => {
  const { user } = useAuth();
  return (
    <aside className="hidden w-60 shrink-0 flex-col p-3 md:flex" style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
      <div className="mb-3 flex items-center gap-2 px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--primary)" }}>
          <Activity className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="font-display text-sm font-bold leading-none">BIOMED XPERT</div>
          <div className="muted text-[11px]">Lead Tracker</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => "side-link" + (isActive ? " active" : "")}>
            <it.icon className="h-4 w-4" />
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="card mt-auto p-3 text-xs muted">
        <div className="font-medium" style={{ color: "var(--text)" }}>{user?.name}</div>
        <div>{user?.role}</div>
      </div>
    </aside>
  );
};
