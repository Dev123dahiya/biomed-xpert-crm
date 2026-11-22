import { ArrowDown, ArrowUp, Download, Plus, Search, Upload, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCreate } from "../../components/layout/CreateContext";
import { Avatar } from "../../components/ui/Avatar";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, ErrorNote, SkeletonRows } from "../../components/ui/States";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useCustomers } from "../../hooks/useCustomers";
import { apiError } from "../../lib/api";
import { cn } from "../../lib/cn";
import { downloadFile } from "../../lib/download";
import { inr } from "../../lib/format";
import { useDebounced } from "../../lib/hooks";
import { ImportCustomers } from "./ImportCustomers";

const SORTS = [
  { id: "-createdAt", label: "Newest" },
  { id: "customerName", label: "Name A to Z" },
  { id: "-totalValue", label: "Highest business" },
  { id: "-balance", label: "Highest balance" },
];

const CustomersPage = (): JSX.Element => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const dsearch = useDebounced(search, 300);
  const page = Number(params.get("page") ?? 1);
  const sort = params.get("sort") ?? "-createdAt";
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const create = useCreate();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const { data, isLoading, isError, refetch } = useCustomers({ search: params.get("search") || undefined, page, sort, pageSize: 25 });
  const rows = data?.items ?? [];
  const empty = !isLoading && rows.length === 0;

  const exportCsv = async (format: "xlsx" | "csv") => {
    setExporting(true);
    try {
      await downloadFile(`/reports/customers?format=${format}`);
      toast("Customer list downloaded");
    } catch (err) {
      toast(apiError(err).message, "error");
    } finally {
      setExporting(false);
    }
  };

  const SortTh = ({ field, label, right }: { field: string; label: string; right?: boolean }) => {
    const active = sort.replace("-", "") === field;
    const desc = sort.startsWith("-");
    return (
      <th className={cn("th", right && "text-right")} aria-sort={active ? (desc ? "descending" : "ascending") : undefined}>
        <button className={right ? "ml-auto" : undefined} onClick={() => set({ sort: active && desc ? field : `-${field}` })}>
          {label} {active && (desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
        </button>
      </th>
    );
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={data ? `${data.meta.total} doctors, hospitals and clinics` : " "}
        actions={
          <>
            <button className="btn" onClick={() => setImporting(true)}><Upload className="h-4 w-4" /> Import</button>
            <button className="btn" onClick={() => exportCsv("xlsx")} disabled={exporting}>{exporting ? <Spinner /> : <Download className="h-4 w-4" />} Export</button>
            <button className="btn btn-primary" onClick={() => create.openCustomer()}><Plus className="h-4 w-4" /> New customer</button>
          </>
        }
      />

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b p-3 divider">
          <div className="relative w-full sm:w-80">
            <Search className="muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input className="input pl-9" placeholder="Name, hospital, phone, GSTIN or city" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search customers" />
          </div>
          <div className="flex-1" />
          <label className="muted text-xs" htmlFor="c-sort">Sort</label>
          <select id="c-sort" className="input h-9 w-auto" value={sort} onChange={(e) => set({ sort: e.target.value })}>
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {isError ? (
          <div className="p-4"><ErrorNote message="Customers didn't load." onRetry={() => refetch()} /></div>
        ) : empty ? (
          params.get("search") ? (
            <EmptyState icon={<Search className="h-5 w-5" />} title={`No customers match "${params.get("search")}"`} hint="Check the spelling, or search by phone number or GSTIN." />
          ) : (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="Add your first customer"
              hint="Customers are the doctors and hospitals you sell to. Add one, or import your existing list from a spreadsheet."
              action={
                <div className="flex gap-2">
                  <button className="btn" onClick={() => setImporting(true)}><Upload className="h-4 w-4" /> Import CSV</button>
                  <button className="btn btn-primary" onClick={() => create.openCustomer()}><Plus className="h-4 w-4" /> New customer</button>
                </div>
              }
            />
          )
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="table min-w-[760px]">
              <thead>
                <tr>
                  <SortTh field="customerName" label="Customer" />
                  <th className="th">Contact</th>
                  <th className="th">City</th>
                  <th className="th">GSTIN</th>
                  <SortTh field="balance" label="Balance" right />
                  <SortTh field="totalValue" label="Total business" right />
                </tr>
              </thead>
              {isLoading ? (
                <SkeletonRows rows={8} cols={6} />
              ) : (
                <tbody>
                  {rows.map((c, i) => (
                    <tr key={c.id} className="row-link row-in" style={{ animationDelay: `${Math.min(i, 14) * 22}ms` }} onClick={() => navigate(`/customers/${c.id}`)}>
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.company ?? c.customerName} size={32} />
                          <div className="min-w-0">
                            <Link to={`/customers/${c.id}`} onClick={(e) => e.stopPropagation()} className="block truncate font-semibold hover:underline">{c.customerName}</Link>
                            <div className="muted truncate text-xs">{c.company}</div>
                          </div>
                        </div>
                      </td>
                      <td className="td">
                        <div className="num truncate">{c.phone}</div>
                        <div className="muted truncate text-xs">{c.email}</div>
                      </td>
                      <td className="td">{c.city}{c.state && c.state !== c.city ? <span className="muted">, {c.state}</span> : null}</td>
                      <td className="td num text-2 text-xs">{c.gstin}</td>
                      <td className="td num text-right" style={{ color: c.balance > 0 ? "var(--warning)" : undefined }}>{inr(c.balance)}</td>
                      <td className="td num text-right font-semibold">{inr(c.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        )}
        {data && !empty && <Pagination meta={data.meta} onPage={(p) => set({ page: String(p) })} noun="customers" />}
      </div>
      <ImportCustomers open={importing} onClose={() => setImporting(false)} />
    </div>
  );
};

export default CustomersPage;
