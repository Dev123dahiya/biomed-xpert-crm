import { MoreHorizontal, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCreate } from "../../components/layout/CreateContext";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Menu } from "../../components/ui/Menu";
import { SlideOver } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, ErrorNote, SkeletonRows } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { useProductCategories } from "../../hooks/useMeta";
import { useProductMutations, useProducts } from "../../hooks/useProducts";
import { apiError } from "../../lib/api";
import { inr } from "../../lib/format";
import { useDebounced } from "../../lib/hooks";
import type { Product } from "../../types";
import { ProductForm } from "./ProductForm";

const ProductsPage = (): JSX.Element => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const dsearch = useDebounced(search, 300);
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "name";
  const page = Number(params.get("page") ?? 1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const create = useCreate();
  const { toast } = useToast();
  const { data: categories } = useProductCategories();
  const { remove } = useProductMutations();

  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in patch)) next.delete("page");
    setParams(next, { replace: true });
  };
  useEffect(() => {
    if ((params.get("search") ?? "") !== dsearch) set({ search: dsearch || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dsearch]);

  const { data, isLoading, isError, refetch } = useProducts({ search: params.get("search") || undefined, category: category || undefined, sort, page, pageSize: 25 });
  const rows = data?.items ?? [];
  const empty = !isLoading && rows.length === 0;

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Equipment catalogue with list prices. Prices can be changed per lead."
        actions={<button className="btn btn-primary" onClick={() => create.openProduct()}><Plus className="h-4 w-4" /> New product</button>}
      />

      {categories && categories.length > 0 && (
        <div className="scroll-thin -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
          <button className="chip" aria-pressed={!category} onClick={() => set({ category: undefined })}>All</button>
          {categories.map((c) => (
            <button key={c.name} className="chip" aria-pressed={category === c.name} onClick={() => set({ category: category === c.name ? undefined : c.name })}>
              {c.name} <span className="num opacity-60">{c.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b p-3 divider">
          <div className="relative w-full sm:w-80">
            <Search className="muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input className="input pl-9" placeholder="Name, make or model" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
          </div>
          <div className="flex-1" />
          <select className="input h-9 w-auto" value={sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort">
            <option value="name">Name A to Z</option>
            <option value="-unitPrice">Price, high to low</option>
            <option value="unitPrice">Price, low to high</option>
            <option value="-createdAt">Recently added</option>
          </select>
        </div>
        {isError ? (
          <div className="p-4"><ErrorNote message="Products didn't load." onRetry={() => refetch()} /></div>
        ) : empty ? (
          <EmptyState
            icon={<Package className="h-5 w-5" />}
            title={params.get("search") || category ? "No products match" : "Build your catalogue"}
            hint={params.get("search") || category ? "Try another search or category." : "Add the equipment you sell so it can be picked on leads and quotes."}
            action={!params.get("search") && !category ? <button className="btn btn-primary" onClick={() => create.openProduct()}><Plus className="h-4 w-4" /> New product</button> : undefined}
          />
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="table min-w-[680px]">
              <thead>
                <tr><th className="th">Product</th><th className="th">Make and model</th><th className="th">Category</th><th className="th text-right">List price</th><th className="th w-12" /></tr>
              </thead>
              {isLoading ? (
                <SkeletonRows rows={8} cols={5} />
              ) : (
                <tbody>
                  {rows.map((p, i) => (
                    <tr key={p.id} className="row-in transition-colors hover:bg-[var(--surface-2)]" style={{ animationDelay: `${Math.min(i, 14) * 22}ms` }}>
                      <td className="td">
                        <button className="text-left font-semibold hover:underline" onClick={() => setEditing(p)}>{p.name}</button>
                        {p.description && <div className="muted line-clamp-1 max-w-sm text-xs">{p.description}</div>}
                      </td>
                      <td className="td"><span className="font-medium">{p.make}</span> <span className="text-2">{p.model}</span></td>
                      <td className="td">{p.category ? <span className="pill" style={{ background: "var(--surface-3)", color: "var(--text-2)" }}>{p.category}</span> : <span className="muted">None</span>}</td>
                      <td className="td num text-right font-semibold">{inr(p.unitPrice)}</td>
                      <td className="td text-right">
                        <Menu width={170} trigger={({ toggle }) => <button className="btn btn-ghost btn-sm btn-icon" onClick={toggle} aria-label={`Actions for ${p.name}`}><MoreHorizontal className="h-4 w-4" /></button>}>
                          {(close) => (
                            <>
                              <button className="menu-item" onClick={() => { close(); setEditing(p); }}><Pencil className="h-4 w-4" /> Edit</button>
                              <button className="menu-item" style={{ color: "var(--danger)" }} onClick={() => { close(); setToDelete(p); }}><Trash2 className="h-4 w-4" /> Delete</button>
                            </>
                          )}
                        </Menu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        )}
        {data && !empty && <Pagination meta={data.meta} onPage={(p) => set({ page: String(p) })} noun="products" />}
      </div>

      <SlideOver open={Boolean(editing)} title="Edit product" onClose={() => setEditing(null)}>
        {editing && <ProductForm existing={editing} onDone={() => setEditing(null)} />}
      </SlideOver>
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete ${toDelete?.name}?`}
        message="Products already used on a lead can't be deleted, so past deals stay accurate."
        confirmLabel="Delete product"
        danger
        busy={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(toDelete!.id);
            toast("Product deleted");
          } catch (err) {
            toast(apiError(err).message, "error");
          }
          setToDelete(null);
        }}
      />
    </div>
  );
};

export default ProductsPage;
