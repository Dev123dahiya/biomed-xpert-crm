import { Bell, CheckCheck, Trophy, UserCheck, XCircle, ArrowRightLeft } from "lucide-react";
import { useNotificationMutations, useNotifications } from "../../hooks/useNotifications";
import { timeAgo } from "../../lib/format";
import { Menu } from "../ui/Menu";
import { EmptyState } from "../ui/States";

const ICONS: Record<string, JSX.Element> = {
  LEAD_WON: <Trophy className="h-4 w-4" style={{ color: "var(--success)" }} />,
  LEAD_LOST: <XCircle className="h-4 w-4" style={{ color: "var(--danger)" }} />,
  LEAD_ASSIGNED: <UserCheck className="h-4 w-4" style={{ color: "var(--primary)" }} />,
  LEAD_STAGE: <ArrowRightLeft className="h-4 w-4" style={{ color: "var(--st-qualified)" }} />,
};

export const NotificationsMenu = (): JSX.Element => {
  const { data = [] } = useNotifications();
  const { readAll, read } = useNotificationMutations();
  const unread = data.filter((n) => !n.read).length;

  return (
    <Menu
      width={360}
      trigger={({ toggle, open }) => (
        <button className="btn btn-ghost btn-icon relative" onClick={toggle} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open}>
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="num absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold" style={{ background: "var(--danger)", color: "#fff" }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}
    >
      {() => (
        <div>
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <div className="text-sm font-semibold">Notifications</div>
            {unread > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => readAll.mutate()}>
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="scroll-thin -mx-1.5 max-h-[60vh] overflow-y-auto border-t px-1.5 pt-1 divider">
            {data.length === 0 ? (
              <EmptyState compact icon={<Bell className="h-5 w-5" />} title="You're all caught up" hint="Wins, losses and new assignments show up here." />
            ) : (
              data.map((n) => (
                <button key={n.id} className="menu-item items-start" onClick={() => !n.read && read.mutate(n.id)}>
                  <span className="mt-0.5">{ICONS[n.type] ?? <Bell className="h-4 w-4" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className={n.read ? "text-2 block text-sm" : "block text-sm font-medium"}>{n.message}</span>
                    <span className="muted text-xs">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--primary)" }} aria-label="Unread" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </Menu>
  );
};
