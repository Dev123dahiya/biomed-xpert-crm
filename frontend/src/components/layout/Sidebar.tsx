import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { useSettings } from "../../hooks/useSettings";
import { LogoMark, Wordmark } from "../brand/Logo";
import { Avatar } from "../ui/Avatar";
import { NAV_GROUPS } from "./nav";

const useOverdueCount = () =>
  useQuery({
    queryKey: ["followups", "overdue-count"],
    refetchInterval: 5 * 60_000,
    queryFn: async () => Number((await api.get("/followups", { params: { scope: "overdue", pageSize: 1 } })).data?.meta?.total ?? 0),
  });

export const SidebarContent = ({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }): JSX.Element => {
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const { data: overdue = 0 } = useOverdueCount();

  return (
    <div className="flex h-full flex-col" style={{ color: "var(--ink-text)" }}>
      <div className={cn("flex h-16 shrink-0 items-center gap-2.5", collapsed ? "justify-center px-2" : "px-5")}>
        <LogoMark size={32} />
        {!collapsed && <Wordmark sub={settings?.orgName && settings.orgName !== "BIOMED XPERT" ? settings.orgName : "Sales CRM"} />}
      </div>
      <nav className={cn("scroll-ink flex-1 overflow-y-auto pb-4 pt-2", collapsed ? "px-2" : "px-3")} aria-label="Main">
        {NAV_GROUPS.map((g) => (
          <div key={g.label} className="mb-4">
            {!collapsed && <div className="mb-1.5 px-3 text-[11px] font-semibold" style={{ color: "var(--ink-muted)" }}>{g.label}</div>}
            <div className="flex flex-col gap-0.5">
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  onClick={onNavigate}
                  title={collapsed ? it.label : undefined}
                  className={({ isActive }) => cn("side-link", isActive && "active", collapsed && "justify-center px-0")}
                >
                  <it.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="flex-1">{it.label}</span>}
                  {it.to === "/follow-ups" && overdue > 0 && (
                    <span
                      className={cn("num rounded-full text-[10px] font-bold", collapsed ? "absolute right-1 top-1 h-2 w-2" : "px-1.5 py-px")}
                      style={{ background: "var(--ch-alarm)", color: "#2a0a05" }}
                      aria-label={`${overdue} overdue`}
                    >
                      {!collapsed && overdue}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className={cn("shrink-0 border-t p-3", collapsed && "flex justify-center")} style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <NavLink to="/profile" onClick={onNavigate} className={cn("flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-white/5", collapsed && "justify-center")} title={collapsed ? user?.name : undefined}>
          <Avatar name={user?.name} size={32} />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
              <div className="truncate text-xs" style={{ color: "var(--ink-muted)" }}>{user?.email}</div>
            </div>
          )}
        </NavLink>
      </div>
    </div>
  );
};

export const Sidebar = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }): JSX.Element => (
  <aside
    className="no-print sticky top-0 hidden h-screen shrink-0 lg:block"
    style={{ width: collapsed ? 72 : 248, background: "var(--ink)", transition: "width .18s ease" }}
  >
    <SidebarContent collapsed={collapsed} />
    <button
      onClick={onToggle}
      className="absolute -right-3 top-[52px] z-10 flex h-6 w-6 items-center justify-center rounded-full border"
      style={{ background: "var(--surface)", borderColor: "var(--border-strong)", color: "var(--muted)" }}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
    </button>
  </aside>
);
