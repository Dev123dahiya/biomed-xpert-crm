import { BarChart3, CalendarClock, KanbanSquare, LayoutDashboard, Package, Settings, Users, type LucideIcon } from "lucide-react";

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean; keywords?: string }

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Sell",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, keywords: "home overview kpi" },
      { to: "/leads", label: "Pipeline", icon: KanbanSquare, keywords: "leads deals board" },
      { to: "/follow-ups", label: "Follow-ups", icon: CalendarClock, keywords: "tasks agenda reminders calls" },
      { to: "/customers", label: "Customers", icon: Users, keywords: "doctors hospitals clients accounts" },
      { to: "/products", label: "Products", icon: Package, keywords: "equipment catalogue catalog" },
    ],
  },
  {
    label: "Analyse",
    items: [{ to: "/reports", label: "Reports", icon: BarChart3, keywords: "export excel pdf csv" }],
  },
  {
    label: "Manage",
    items: [{ to: "/settings", label: "Settings", icon: Settings, keywords: "team users sources organisation" }],
  },
];

export const ALL_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
