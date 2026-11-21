import { ChevronsUpDown, LogOut, Monitor, Moon, Search, Settings, Sun, User } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { useTheme, type ThemeChoice } from "../../lib/theme";
import { useSettings } from "../../hooks/useSettings";
import { LogoMark, Wordmark } from "../brand/Logo";
import { Avatar } from "../ui/Avatar";
import { RoleBadge } from "../ui/Badges";
import { Menu } from "../ui/Menu";
import { NAV_GROUPS } from "./nav";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

const useOverdueCount = () =>
  useQuery({
    queryKey: ["followups", "overdue-count"],
    refetchInterval: 5 * 60_000,
    queryFn: async () => Number((await api.get("/followups", { params: { scope: "overdue", pageSize: 1 } })).data?.meta?.total ?? 0),
  });

const AccountMenu = ({ collapsed }: { collapsed: boolean }): JSX.Element => {
  const { user, logout } = useAuth();
  const { choice, setChoice } = useTheme();
  const navigate = useNavigate();
  const themes: { id: ThemeChoice; label: string; icon: JSX.Element }[] = [
    { id: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
    { id: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
    { id: "system", label: "Auto", icon: <Monitor className="h-3.5 w-3.5" /> },
  ];
  return (
    <Menu
      align="left"
      width={248}
      placement="top"
      trigger={({ toggle, open }) => (
        <button
          onClick={toggle}
          aria-expanded={open}
          aria-label="Account menu"
          className={cn("flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left hover:bg-[color-mix(in_srgb,var(--text)_5%,transparent)]", collapsed && "justify-center")}
        >
          <Avatar name={user?.name} size={30} />
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-medium">{user?.name}</div>
                <div className="muted truncate text-[11.5px]">{user?.email}</div>
              </div>
              <ChevronsUpDown className="muted h-3.5 w-3.5 shrink-0" />
            </>
          )}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{user?.name}</div>
              <div className="muted truncate text-xs">{user?.email}</div>
            </div>
            {user?.role && <RoleBadge role={user.role} />}
          </div>
          <div className="my-1.5 border-t divider" />
          <div className="seg mx-1 mb-1 flex">
            {themes.map((t) => (
              <button key={t.id} aria-pressed={choice === t.id} onClick={() => setChoice(t.id)} className="flex flex-1 items-center justify-center gap-1.5">
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div className="my-1.5 border-t divider" />
          <button className="menu-item" onClick={() => { close(); navigate("/profile"); }}><User /> Profile and password</button>
          <button className="menu-item" onClick={() => { close(); navigate("/settings"); }}><Settings /> Settings</button>
          <button className="menu-item" onClick={() => { close(); void logout(); }}><LogOut /> Sign out</button>
        </>
      )}
    </Menu>
  );
};

export const SidebarContent = ({ collapsed = false, onNavigate, onSearch }: { collapsed?: boolean; onNavigate?: () => void; onSearch?: () => void }): JSX.Element => {
  const { data: settings } = useSettings();
  const { data: overdue = 0 } = useOverdueCount();
  const org = settings?.orgName && settings.orgName !== "BIOMED XPERT" ? settings.orgName : "Sales CRM";

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-14 shrink-0 items-center gap-2.5", collapsed ? "justify-center px-2" : "px-3.5")}>
        <LogoMark size={28} />
        {!collapsed && <Wordmark sub={org} />}
      </div>

      <div className={cn("pb-3", collapsed ? "px-2" : "px-3")}>
        <button
          onClick={() => { onNavigate?.(); onSearch?.(); }}
          className={cn("flex h-8 w-full items-center gap-2 rounded-lg border text-left text-[13px] shadow-[var(--shadow-xs)]", collapsed ? "justify-center" : "px-2.5")}
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}
          aria-label="Search"
          title={collapsed ? "Search" : undefined}
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">Search</span>
              <span className="kbd">{isMac ? "⌘" : "Ctrl"} K</span>
            </>
          )}
        </button>
      </div>

      <nav className={cn("scroll-thin flex-1 overflow-y-auto pb-4", collapsed ? "px-2" : "px-3")} aria-label="Main">
        {NAV_GROUPS.map((g, gi) => (
          <div key={g.label} className={gi ? "mt-5" : undefined}>
            {!collapsed && <div className="mb-1 px-2 text-[11.5px] font-medium" style={{ color: "var(--muted)" }}>{g.label}</div>}
            {collapsed && gi > 0 && <div className="mx-2 mb-3 border-t divider" />}
            <div className="flex flex-col gap-px">
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  onClick={onNavigate}
                  title={collapsed ? it.label : undefined}
                  className={({ isActive }) => cn("side-link", isActive && "active", collapsed && "justify-center px-0")}
                >
                  <it.icon />
                  {!collapsed && <span className="flex-1">{it.label}</span>}
                  {it.to === "/follow-ups" && overdue > 0 && (
                    <span
                      className={cn("num rounded-md text-[10.5px] font-semibold", collapsed ? "absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full" : "px-1.5 py-px")}
                      style={{ background: collapsed ? "var(--danger)" : "var(--danger-soft)", color: "var(--danger)" }}
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

      <div className={cn("shrink-0 p-2", collapsed && "flex justify-center")}>
        <AccountMenu collapsed={collapsed} />
      </div>
    </div>
  );
};

export const Sidebar = ({ collapsed, onSearch }: { collapsed: boolean; onSearch: () => void }): JSX.Element => (
  <aside
    className="no-print sticky top-0 hidden h-screen shrink-0 lg:block"
    style={{ width: collapsed ? 60 : 236, transition: "width .18s ease" }}
  >
    <SidebarContent collapsed={collapsed} onSearch={onSearch} />
  </aside>
);
