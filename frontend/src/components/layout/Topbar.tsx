import { ChevronDown, ChevronRight, Menu as MenuIcon, Package, PanelLeft, Plus, Search, UserPlus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "../ui/Menu";
import { NotificationsMenu } from "./NotificationsMenu";
import { useCreate } from "./CreateContext";
import { ALL_NAV } from "./nav";

// Where am I: the section, and the record type on detail pages.
const useCrumbs = (): { label: string; to?: string }[] => {
  const { pathname } = useLocation();
  const seg = pathname.split("/").filter(Boolean);
  if (seg.length === 0) return [{ label: "Dashboard" }];
  const section = ALL_NAV.find((n) => n.to === `/${seg[0]}`);
  const label = section?.label ?? (seg[0] === "profile" ? "Profile" : "Page");
  if (seg.length === 1) return [{ label }];
  const detail = seg[0] === "leads" ? "Lead" : seg[0] === "customers" ? "Customer" : "Details";
  return [{ label, to: `/${seg[0]}` }, { label: detail }];
};

export const Topbar = ({ onMenu, onSearch, onToggleSidebar }: { onMenu: () => void; onSearch: () => void; onToggleSidebar: () => void }): JSX.Element => {
  const create = useCreate();
  const crumbs = useCrumbs();

  return (
    <header
      className="no-print sticky top-0 z-40 flex h-12 shrink-0 items-center gap-1.5 border-b px-2.5 sm:px-4"
      style={{ background: "color-mix(in srgb, var(--surface) 88%, transparent)", backdropFilter: "saturate(1.4) blur(10px)", borderColor: "var(--border)" }}
    >
      <button className="btn btn-ghost btn-sm btn-icon lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <MenuIcon className="h-[18px] w-[18px]" />
      </button>
      <button className="btn btn-ghost btn-sm btn-icon hidden lg:inline-flex" onClick={onToggleSidebar} aria-label="Toggle sidebar" title="Toggle sidebar">
        <PanelLeft />
      </button>
      <span className="mx-1.5 hidden h-4 w-px lg:block" style={{ background: "var(--border)" }} aria-hidden />

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px]">
        {crumbs.map((c, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight className="muted h-3.5 w-3.5 shrink-0" />}
            {c.to ? (
              <Link to={c.to} className="muted truncate hover:underline">{c.label}</Link>
            ) : (
              <span className="truncate font-medium">{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      <button className="btn btn-ghost btn-sm btn-icon lg:hidden" onClick={onSearch} aria-label="Search">
        <Search />
      </button>
      <NotificationsMenu />
      <Menu
        width={200}
        trigger={({ toggle }) => (
          <button className="btn btn-primary btn-sm ml-1" onClick={toggle} aria-haspopup="menu">
            <Plus /> <span className="hidden xs:inline">New</span> <ChevronDown className="hidden opacity-70 xs:block" />
          </button>
        )}
      >
        {(close) => (
          <>
            <button className="menu-item" onClick={() => { close(); create.openLead(); }}><Plus /> Lead</button>
            <button className="menu-item" onClick={() => { close(); create.openCustomer(); }}><UserPlus /> Customer</button>
            <button className="menu-item" onClick={() => { close(); create.openProduct(); }}><Package /> Product</button>
          </>
        )}
      </Menu>
    </header>
  );
};
