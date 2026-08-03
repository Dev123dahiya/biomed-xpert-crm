import { MoreHorizontal, Package, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { apiError } from "../../lib/api";
import { inr } from "../../lib/format";
import { EmptyState, ErrorNote, SkeletonRows } from "../../components/ui/States";
import { Pagination } from "../../components/ui/Pagination";
import { SlideOver } from "../../components/ui/SlideOver";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { useProducts, useProductMutations } from "../../hooks/useProducts";
import { ProductForm } from "./ProductForm";
import type { Product } from "../../types";

export const ProductsPage = (): JSX.Element => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const { toast } = useToast();

  const { data, isLoading, isError } = useProducts({ search: search || undefined, page });
  const { remove } = useProductMutations();

  const confirmDelete = async (): Promise<void> => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast("Product deleted");
    } catch (err) {
      toast(apiError(err).message, "error");
    } finally {
      setToDelete(null);
    }
  };

  const rows = data?.items ?? [];
  const showEmpty = !isLoading && rows.length === 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Products</h1>
          <p className="muted text-sm">Equipment catalog</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add product</button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 p-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="relative max-w-xs flex-1">
            <Search className="muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input className="input pl-9" placeholder="Search products" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        {isError ? (
          <ErrorNote message="Could not load products." />
        ) : showEmpty ? (
          <EmptyState icon={<Package className="h-8 w-8" />} title="No products yet" hint="Add equipment to your catalog." action={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add product</button>} />
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Product</th><th className="th">Make</th><th className="th">Model</th><th className="th">Category</th>
                <th className="th text-right">Unit Price</th><th className="th" />
              </tr>
            </thead>
            {isLoading ? (
              <SkeletonRows rows={6} cols={6} />
            ) : (
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="row-hover">
                    <td className="td font-medium">{p.name}</td>
                    <td className="td">{p.make}</td>
                    <td className="td">{p.model}</td>
                    <td className="td">{p.category ? <span className="pill" style={{ background: "var(--accent)", color: "var(--primary)" }}>{p.category}</span> : "\u2014"}</td>
                    <td className="td mono text-right">{inr(p.unitPrice)}</td>
                    <td className="td text-right">
                      <div className="flex justify-end gap-1">
                        <button className="btn btn-ghost" onClick={() => setEditing(p)}><MoreHorizontal className="h-4 w-4" /></button>
                        <button className="btn btn-ghost" onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        )}
        {data && !showEmpty && <Pagination meta={data.meta} onPage={setPage} />}
      </div>

      <SlideOver open={creating} title="Add product" onClose={() => setCreating(false)}>
        <ProductForm onDone={() => setCreating(false)} />
      </SlideOver>
      <SlideOver open={Boolean(editing)} title="Edit product" onClose={() => setEditing(null)}>
        {editing && <ProductForm existing={editing} onDone={() => setEditing(null)} />}
      </SlideOver>
      <ConfirmDialog open={Boolean(toDelete)} title="Delete product" message={`Remove ${toDelete?.name}? Products used by leads cannot be deleted.`} confirmLabel="Delete" danger onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
};
