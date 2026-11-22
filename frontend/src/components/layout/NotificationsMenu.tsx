import { Bell, CheckCheck, Trophy, UserCheck, XCircle, ArrowRightLeft } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
  const prev = useRef(unread);
  const [ring, setRing] = useState(0);
  useEffect(() => {
    // Give the bell a little shake when something new arrives.
    if (unread > prev.current) setRing((r) => r + 1);
    prev.current = unread;
  }, [unread]);

  return (
    <Menu
      width={360}
      trigger={({ toggle, open }) => (
        <button className="btn btn-ghost btn-sm btn-icon relative" onClick={toggle} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open}>
          <Bell key={ring} className={ring ? "bell-ring h-[17px] w-[17px]" : "h-[17px] w-[17px]"} />
          {unread > 0 && (
            <motion.span
              key={unread}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 18 }}
              className="num absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
              style={{ background: "var(--danger)", color: "#fff", boxShadow: "0 0 0 2px var(--surface)" }}
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
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
              data.map((n, i) => (
                <motion.button
                  key={n.id}
                  className="menu-item items-start"
                  onClick={() => !n.read && read.mutate(n.id)}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.025, duration: 0.25 }}
                >
                  <span className="mt-0.5">{ICONS[n.type] ?? <Bell className="h-4 w-4" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className={n.read ? "text-2 block text-sm" : "block text-sm font-medium"}>{n.message}</span>
                    <span className="muted text-xs">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--primary)" }} aria-label="Unread" />}
                </motion.button>
              ))
            )}
          </div>
        </div>
      )}
    </Menu>
  );
};
