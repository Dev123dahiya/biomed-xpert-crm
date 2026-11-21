import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../ui/Modal";
import { useCreate } from "./CreateContext";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

const GO: Record<string, string> = { d: "/", p: "/leads", f: "/follow-ups", c: "/customers", o: "/products", r: "/reports", s: "/settings" };

export const SHORTCUTS: { group: string; items: { keys: string[]; label: string }[] }[] = [
  {
    group: "General",
    items: [
      { keys: [MOD, "K"], label: "Search and commands" },
      { keys: ["/"], label: "Search" },
      { keys: ["N"], label: "New lead" },
      { keys: [MOD, "\\"], label: "Collapse or expand the sidebar" },
      { keys: ["?"], label: "Show this list" },
    ],
  },
  {
    group: "Go to",
    items: [
      { keys: ["G", "D"], label: "Dashboard" },
      { keys: ["G", "P"], label: "Pipeline" },
      { keys: ["G", "F"], label: "Follow-ups" },
      { keys: ["G", "C"], label: "Customers" },
      { keys: ["G", "O"], label: "Products" },
      { keys: ["G", "R"], label: "Reports" },
      { keys: ["G", "S"], label: "Settings" },
    ],
  },
];

// Linear-style single-key shortcuts. Ignored while typing or while a dialog is open.
export const useGlobalShortcuts = (openHelp: () => void): void => {
  const navigate = useNavigate();
  const create = useCreate();
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (document.querySelector("[role=dialog]")) return;
      const k = e.key.toLowerCase();
      if (pendingG.current) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        if (GO[k]) {
          e.preventDefault();
          navigate(GO[k]);
        }
        return;
      }
      if (k === "g") {
        pendingG.current = window.setTimeout(() => { pendingG.current = null; }, 900);
      } else if (k === "n") {
        e.preventDefault();
        create.openLead();
      } else if (e.key === "?") {
        e.preventDefault();
        openHelp();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, create, openHelp]);
};

export const ShortcutsDialog = ({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element => (
  <Modal open={open} title="Keyboard shortcuts" description="Move around without reaching for the mouse." onClose={onClose} width={460}>
    <div className="space-y-5">
      {SHORTCUTS.map((g) => (
        <div key={g.group}>
          <div className="muted mb-1.5 text-xs font-medium">{g.group}</div>
          <ul className="divide-y rounded-lg border divider" style={{ borderColor: "var(--border)" }}>
            {g.items.map((it) => (
              <li key={it.label} className="flex items-center justify-between px-3 py-2 text-[13px] divider">
                <span>{it.label}</span>
                <span className="flex items-center gap-1">
                  {it.keys.map((k, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && g.group === "Go to" && <span className="muted text-[11px]">then</span>}
                      <span className="kbd">{k}</span>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </Modal>
);

export const ShortcutsLayer = ({ helpOpen, setHelpOpen }: { helpOpen: boolean; setHelpOpen: (v: boolean) => void }): JSX.Element => {
  useGlobalShortcuts(() => setHelpOpen(true));
  return <ShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />;
};
