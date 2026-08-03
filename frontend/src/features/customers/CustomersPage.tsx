import { MoreHorizontal, Plus, Search, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { apiError } from "../../lib/api";
import { inr } from "../../lib/format";
import { EmptyState, ErrorNote, SkeletonRows } from "../../components/ui/States";
import { Pagination } from "../../components/ui/Pagination";
import { SlideOver } from "../../components/ui/SlideOver";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { useCustomers, useCustomerMutations } from "../../hooks/useCustomers";
import { CustomerForm } from "./CustomerForm";
import type { Customer } from "../../types";

export const CustomersPage = (): JSX.Element => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();

  const { data, isLoading, isError } = useCustomers({ search: search || undefined, page });
  const { remove } = useCustomerMutations();

  const confirmDelete = async (): Promise<void> => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast("Customer deleted");
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
          <h1 className="font-display text-xl font-semibold">Customers</h1>
          <p className="muted text-sm">{data ? `${data.meta.total} customers` : "\u00a0"}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add customer</button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 p-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="relative max-w-xs flex-1">
            <Search className="muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              className="input pl-9"
              placeholder="Search customers"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {isError ? (
          <ErrorNote message="Could not load customers." />
        ) : showEmpty ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No customers yet"
            hint="Add your first customer to start tracking leads."
            action={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add customer</button>}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Customer</th>
                <th className="th">Company</th>
                <th className="th">City</th>
                <th className="th text-right">Balance</th>
                <th className="th text-right">Total Value</th>
                <th className="th" />
              </tr>
            </thead>
            {isLoading ? (
              <SkeletonRows rows={6} cols={6} />
            ) : (
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="row-hover">
                    <td className="td font-medium">{c.customerName}</td>
                    <td className="td">{c.company ?? "\u2014"}</td>
                    <td className="td">{c.city ?? "\u2014"}</td>
                    <td className="td mono text-right">{inr(c.balance)}</td>
                    <td className="td mono text-right">{inr(c.totalValue)}</td>
                    <td className="td text-right">
                      <div className="flex justify-end gap-1">
                        <button className="btn btn-ghost" onClick={() => setEditing(c)} aria-label="Edit"><MoreHorizontal className="h-4 w-4" /></button>
                        <button className="btn btn-ghost" onClick={() => setToDelete(c)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
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

      <SlideOver open={creating} title="Add customer" onClose={() => setCreating(false)}>
        <CustomerForm onDone={() => setCreating(false)} />
      </SlideOver>
      <SlideOver open={Boolean(editing)} title="Edit customer" onClose={() => setEditing(null)}>
        {editing && <CustomerForm existing={editing} onDone={() => setEditing(null)} />}
      </SlideOver>
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete customer"
        message={`Remove ${toDelete?.customerName}? A customer with leads cannot be deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};
