import { ChevronDown, LogOut, Menu as MenuIcon, Monitor, Moon, Package, Plus, Search, Settings, Sun, User, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useTheme, type ThemeChoice } from "../../lib/theme";
import { Avatar } from "../ui/Avatar";
import { Menu } from "../ui/Menu";
import { NotificationsMenu } from "./NotificationsMenu";
import { useCreate } from "./CreateContext";
import { RoleBadge } from "../ui/Badges";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export const Topbar = ({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }): JSX.Element => {
  const { user, logout } = useAuth();
  const { choice, setChoice } = useTheme();
  const navigate = useNavigate();
  const create = useCreate();

  const themes: { id: ThemeChoice; label: string; icon: JSX.Element }[] = [
    { id: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
    { id: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
    { id: "system", label: "Auto", icon: <Monitor className="h-3.5 w-3.5" /> },
  ];

  return (
    <header
      className="no-print sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 px-3 sm:px-5"
      style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "saturate(1.4) blur(10px)", borderBottom: "1px solid var(--border)" }}
    >
      <button className="btn btn-ghost btn-icon lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <MenuIcon className="h-5 w-5" />
      </button>

      <button
        onClick={onSearch}
        className="input hidden max-w-md flex-1 items-center gap-2.5 text-left sm:flex"
        style={{ background: "var(--surface)" }}
        aria-label="Search"
      >
        <Search className="muted h-4 w-4" />
        <span className="muted flex-1 truncate text-sm">Search customers, leads, GSTIN, phone</span>
        <span className="kbd">{isMac ? "⌘" : "Ctrl"} K</span>
      </button>
      <button className="btn btn-ghost btn-icon sm:hidden" onClick={onSearch} aria-label="Search">
        <Search className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <Menu
        width={210}
        trigger={({ toggle }) => (
          <button className="btn btn-primary" onClick={toggle} aria-haspopup="menu">
            <Plus className="h-4 w-4" /> <span className="hidden xs:inline">New</span> <ChevronDown className="hidden h-3.5 w-3.5 opacity-80 xs:block" />
          </button>
        )}
      >
        {(close) => (
          <>
            <button className="menu-item" onClick={() => { close(); create.openLead(); }}><Plus className="h-4 w-4" /> Lead</button>
            <button className="menu-item" onClick={() => { close(); create.openCustomer(); }}><UserPlus className="h-4 w-4" /> Customer</button>
            <button className="menu-item" onClick={() => { close(); create.openProduct(); }}><Package className="h-4 w-4" /> Product</button>
          </>
        )}
      </Menu>

      <NotificationsMenu />

      <Menu
        width={260}
        trigger={({ toggle }) => (
          <button className="flex items-center gap-1.5 rounded-full p-1 hover:opacity-90" onClick={toggle} aria-label="Account menu">
            <Avatar name={user?.name} size={32} />
          </button>
        )}
      >
        {(close) => (
          <>
            <div className="flex items-center gap-3 px-2.5 py-2">
              <Avatar name={user?.name} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{user?.name}</div>
                <div className="muted truncate text-xs">{user?.email}</div>
              </div>
              {user?.role && <RoleBadge role={user.role} />}
            </div>
            <div className="my-1.5 border-t divider" />
            <div className="px-2.5 pb-1 pt-0.5 text-xs font-semibold muted">Theme</div>
            <div className="seg mx-1.5 mb-1.5 flex">
              {themes.map((t) => (
                <button key={t.id} aria-pressed={choice === t.id} onClick={() => setChoice(t.id)} className="flex flex-1 items-center justify-center gap-1.5">
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div className="my-1.5 border-t divider" />
            <button className="menu-item" onClick={() => { close(); navigate("/profile"); }}><User className="h-4 w-4" /> Profile and password</button>
            <button className="menu-item" onClick={() => { close(); navigate("/settings"); }}><Settings className="h-4 w-4" /> Settings</button>
            <button className="menu-item" onClick={() => { close(); void logout(); }}><LogOut className="h-4 w-4" /> Sign out</button>
          </>
        )}
      </Menu>
    </header>
  );
};
