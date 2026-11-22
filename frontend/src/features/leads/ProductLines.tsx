import { Minus, Package, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { searchProducts } from "../../hooks/useMeta";
import { useDebounced, useDismiss } from "../../lib/hooks";
import { inr } from "../../lib/format";
import { Spinner } from "../../components/ui/Spinner";
import type { Product } from "../../types";

export interface Line { productId: string; name: string; detail: string; quantity: number; price: number }

export const MAX_LINES = 15;

const ProductSearch = ({ onPick, disabled }: { onPick: (p: Product) => void; disabled?: boolean }): JSX.Element => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const dq = useDebounced(q, 200);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  useEffect(() => {
    if (!open) return;
    let live = true;
    setLoading(true);
    searchProducts(dq.trim())
      .then((r) => live && setResults(r))
      .catch(() => live && setResults([]))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [dq, open]);

  return (
    <div ref={ref} className="relative">
      <Search className="muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      <input
        className="input pl-9"
        placeholder={disabled ? `A lead can hold up to ${MAX_LINES} products` : "Add equipment by name, make or model"}
        value={q}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
      />
      {open && !disabled && (
        <div className="pop anim-pop absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden">
          <div className="scroll-thin max-h-64 overflow-y-auto p-1.5">
            {loading && results.length === 0 && <div className="flex justify-center py-4"><Spinner className="muted" /></div>}
            {!loading && results.length === 0 && <div className="muted px-3 py-4 text-center text-sm">No products match. Add it to the catalogue first.</div>}
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                className="menu-item"
                onClick={() => { onPick(p); setQ(""); setOpen(false); }}
              >
                <Package className="h-4 w-4" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{p.name}</span>
                  <span className="muted block truncate text-xs">{p.make} {p.model}{p.category ? `, ${p.category}` : ""}</span>
                </span>
                <span className="num text-xs font-medium">{inr(p.unitPrice)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const fromProduct = (p: Product): Line => ({ productId: p.id, name: p.name, detail: `${p.make} ${p.model}`, quantity: 1, price: p.unitPrice });

// Editable equipment list with quantity steppers and per-line price.
export const ProductLinesEditor = ({ lines, onChange, readOnly }: { lines: Line[]; onChange: (l: Line[]) => void; readOnly?: boolean }): JSX.Element => {
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const set = (i: number, patch: Partial<Line>) => onChange(lines.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div>
      {lines.length > 0 && (
        <div className="mb-3 overflow-hidden rounded-[10px] border divider">
          {lines.map((l, i) => (
            <div key={`${l.productId}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-3 py-2.5 last:border-b-0 divider">
              <div className="min-w-0 flex-1 basis-40">
                <div className="truncate text-sm font-medium">{l.name}</div>
                <div className="muted truncate text-xs">{l.detail}</div>
              </div>
              {readOnly ? (
                <>
                  <span className="num muted text-sm">{l.quantity} × {inr(l.price)}</span>
                  <span className="num w-28 text-right text-sm font-semibold">{inr(l.price * l.quantity)}</span>
                </>
              ) : (
                <>
                  <div className="flex items-center rounded-lg border divider" role="group" aria-label={`Quantity of ${l.name}`}>
                    <button type="button" className="flex h-8 w-7 items-center justify-center muted hover:opacity-80" onClick={() => set(i, { quantity: Math.max(1, l.quantity - 1) })} aria-label="Decrease">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      className="num h-8 w-10 bg-transparent text-center text-sm outline-none"
                      type="number"
                      min={1}
                      value={l.quantity}
                      onChange={(e) => set(i, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                    />
                    <button type="button" className="flex h-8 w-7 items-center justify-center muted hover:opacity-80" onClick={() => set(i, { quantity: l.quantity + 1 })} aria-label="Increase">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="relative w-32">
                    <span className="muted pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">₹</span>
                    <input
                      className="input num h-8 pl-6 text-right text-sm"
                      type="number"
                      min={0}
                      value={l.price}
                      onChange={(e) => set(i, { price: Math.max(0, Number(e.target.value) || 0) })}
                      aria-label={`Unit price of ${l.name}`}
                    />
                  </div>
                  <span className="num w-28 text-right text-sm font-semibold">{inr(l.price * l.quantity)}</span>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => onChange(lines.filter((_, j) => j !== i))} aria-label={`Remove ${l.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-2.5" style={{ background: "var(--surface-2)" }}>
            <span className="muted text-xs">{lines.length} of {MAX_LINES} items</span>
            <span className="text-sm">
              Total <span className="num ml-2 font-semibold">{inr(total)}</span>
            </span>
          </div>
        </div>
      )}
      {!readOnly && <ProductSearch disabled={lines.length >= MAX_LINES} onPick={(p) => onChange([...lines, fromProduct(p)])} />}
    </div>
  );
};

export const linesTotal = (lines: Line[]): number => lines.reduce((s, l) => s + l.price * l.quantity, 0);
