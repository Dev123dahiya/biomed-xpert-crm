import { Building2, CornerDownLeft, KanbanSquare, Moon, Package, Plus, Search, Sun, UserPlus } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../hooks/useMeta";
import { useDebounced } from "../../lib/hooks";
import { inrCompact, inr } from "../../lib/format";
import { useTheme } from "../../lib/theme";
import { StageDot } from "../ui/Badges";
import { Spinner } from "../ui/Spinner";
import { ALL_NAV } from "./nav";
import { useCreate } from "./CreateContext";
import { stageLabel } from "../../lib/stages";

interface Item { id: string; group: string; label: string; sub?: string; icon: ReactNode; run: () => void }

export const CommandPalette = ({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element | null => {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const dq = useDebounced(q.trim(), 180);
  const { data, isFetching } = useSearch(dq.length >= 2 ? dq : "");
  const navigate = useNavigate();
  const create = useCreate();
  const { dark, toggle } = useTheme();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => { navigate(to); onClose(); };
    const ql = q.trim().toLowerCase();
    const match = (s: string) => !ql || s.toLowerCase().includes(ql);
    const out: Item[] = [];

    const actions: Item[] = [
      { id: "a-lead", group: "Create", label: "New lead", icon: <Plus className="h-4 w-4" />, run: () => { onClose(); create.openLead(); } },
      { id: "a-cust", group: "Create", label: "New customer", icon: <UserPlus className="h-4 w-4" />, run: () => { onClose(); create.openCustomer(); } },
      { id: "a-prod", group: "Create", label: "New product", icon: <Package className="h-4 w-4" />, run: () => { onClose(); create.openProduct(); } },
      { id: "a-theme", group: "Create", label: dark ? "Switch to light theme" : "Switch to dark theme", icon: dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />, run: () => { toggle(); onClose(); } },
    ];

    if (data && dq.length >= 2) {
      data.leads.forEach((l) =>
        out.push({ id: `l-${l.id}`, group: "Leads", label: l.customer, sub: `${stageLabel(l.status)}, ${inrCompact(l.approxValue)}`, icon: <StageDot status={l.status} size={9} />, run: go(`/leads/${l.id}`) }),
      );
      data.customers.forEach((c) =>
        out.push({ id: `c-${c.id}`, group: "Customers", label: c.customerName, sub: [c.company, c.city].filter(Boolean).join(", "), icon: <Building2 className="h-4 w-4" />, run: go(`/customers/${c.id}`) }),
      );
      data.products.forEach((p) =>
        out.push({ id: `p-${p.id}`, group: "Products", label: p.name, sub: `${p.make} ${p.model}, ${inr(p.unitPrice)}`, icon: <Package className="h-4 w-4" />, run: go(`/products?search=${encodeURIComponent(p.name)}`) }),
      );
    }
    ALL_NAV.filter((n) => match(`${n.label} ${n.keywords ?? ""}`)).forEach((n) =>
      out.push({ id: `n-${n.to}`, group: "Go to", label: n.label, icon: <n.icon className="h-4 w-4" />, run: go(n.to) }),
    );
    actions.filter((a) => match(a.label)).forEach((a) => out.push(a));
    if (ql.length >= 2) {
      out.push({ id: "s-leads", group: "Search", label: `Search pipeline for "${q.trim()}"`, icon: <KanbanSquare className="h-4 w-4" />, run: go(`/leads?view=list&search=${encodeURIComponent(q.trim())}`) });
    }
    return out;
  }, [q, dq, data, navigate, onClose, create, dark, toggle]);

  useEffect(() => setActive(0), [q, data]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  let lastGroup = "";
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[10vh]">
      <div className="anim-fade absolute inset-0" style={{ background: "var(--overlay)" }} onClick={onClose} />
      <div className="pop anim-pop relative w-full max-w-xl overflow-hidden" role="dialog" aria-modal="true" aria-label="Search and commands">
        <div className="flex items-center gap-3 border-b px-4 divider">
          <Search className="muted h-5 w-5" />
          <input
            autoFocus
            className="h-14 flex-1 bg-transparent text-[15px] outline-none"
            placeholder="Search customers, leads, products, or jump to a page"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              if (e.key === "Enter") { e.preventDefault(); items[active]?.run(); }
            }}
            aria-controls="palette-list"
          />
          {isFetching && <Spinner className="muted" />}
          <span className="kbd">Esc</span>
        </div>
        <div ref={listRef} id="palette-list" className="scroll-thin max-h-[56vh] overflow-y-auto p-2" role="listbox">
          {items.length === 0 && <div className="muted px-3 py-10 text-center text-sm">Nothing matches "{q}". Try a name, phone number, GSTIN or city.</div>}
          {items.map((it, i) => {
            const header = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <div key={it.id}>
                {header && <div className="muted px-3 pb-1 pt-3 text-xs font-semibold">{header}</div>}
                <button
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  className="menu-item"
                  data-active={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={it.run}
                >
                  <span className="flex w-5 justify-center">{it.icon}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {it.label}
                    {it.sub && <span className="muted"> · {it.sub}</span>}
                  </span>
                  {i === active && <CornerDownLeft className="h-3.5 w-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="muted flex items-center gap-4 border-t px-4 py-2 text-xs divider">
          <span className="flex items-center gap-1"><span className="kbd">↑</span><span className="kbd">↓</span> to move</span>
          <span className="flex items-center gap-1"><span className="kbd">Enter</span> to open</span>
        </div>
      </div>
    </div>,
    document.body,
  );
};
