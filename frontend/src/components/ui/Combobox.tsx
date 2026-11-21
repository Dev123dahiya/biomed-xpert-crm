import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useDebounced, useDismiss } from "../../lib/hooks";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

export interface ComboOption { id: string; label: string; sub?: string; }

interface Props {
  value: ComboOption | null;
  onChange: (v: ComboOption | null) => void;
  search: (q: string) => Promise<ComboOption[]>;
  placeholder?: string;
  footer?: (close: () => void) => ReactNode;
  invalid?: boolean;
  id?: string;
}

// Searchable picker for records that are too many for a plain select.
export const Combobox = ({ value, onChange, search, placeholder = "Search", footer, invalid, id }: Props): JSX.Element => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ComboOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const dq = useDebounced(q, 200);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  useEffect(() => {
    if (!open) return;
    let live = true;
    setLoading(true);
    search(dq)
      .then((r) => live && (setItems(r), setActive(0)))
      .catch(() => live && setItems([]))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [dq, open, search]);

  const pick = (o: ComboOption) => {
    onChange(o);
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        className="input flex items-center gap-2 text-left"
        aria-invalid={invalid}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={cn("min-w-0 flex-1 truncate", !value && "muted")}>
          {value ? value.label : placeholder}
          {value?.sub && <span className="muted"> · {value.sub}</span>}
        </span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            className="muted rounded p-0.5 hover:opacity-80"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange(null); } }}
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : (
          <ChevronsUpDown className="muted h-3.5 w-3.5" />
        )}
      </button>
      {open && (
        <div className="pop anim-pop absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden">
          <div className="flex items-center gap-2 border-b px-3 divider">
            <Search className="muted h-4 w-4" />
            <input
              autoFocus
              className="h-10 flex-1 bg-transparent text-sm outline-none"
              placeholder="Type to search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
                if (e.key === "Enter" && items[active]) { e.preventDefault(); pick(items[active]); }
              }}
            />
            {loading && <Spinner className="muted h-3.5 w-3.5" />}
          </div>
          <div className="scroll-thin max-h-60 overflow-y-auto p-1.5" role="listbox">
            {!loading && items.length === 0 && <div className="muted px-3 py-4 text-center text-sm">No matches</div>}
            {items.map((o, i) => (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={value?.id === o.id}
                className="menu-item"
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{o.label}</span>
                  {o.sub && <span className="muted block truncate text-xs">{o.sub}</span>}
                </span>
                {value?.id === o.id && <Check className="h-4 w-4" style={{ color: "var(--primary)" }} />}
              </button>
            ))}
          </div>
          {footer && <div className="border-t p-1.5 divider">{footer(close)}</div>}
        </div>
      )}
    </div>
  );
};
