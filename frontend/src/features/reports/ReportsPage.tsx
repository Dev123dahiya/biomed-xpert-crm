import { FileText, Sheet } from "lucide-react";
import { useState } from "react";
import { downloadFile } from "../../lib/download";
import { apiError } from "../../lib/api";
import { Input, Select } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";

const REPORTS = [
  { key: "customers", title: "Customer report", desc: "Customers with total business and lead counts." },
  { key: "leads", title: "Lead report", desc: "Every lead with stage, source, and value." },
  { key: "revenue", title: "Revenue report", desc: "Won revenue by month or by customer." },
  { key: "sales", title: "Sales report", desc: "Won deals per sales user." },
  { key: "monthly", title: "Monthly report", desc: "A month-by-month rollup for the year." },
];

export const ReportsPage = (): JSX.Element => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [mode, setMode] = useState<"customer" | "lead" | "stage">("stage");
  const [value, setValue] = useState("");

  const run = async (path: string, tag: string): Promise<void> => {
    setBusy(tag);
    try {
      await downloadFile(path);
      toast("Export ready");
    } catch (err) {
      toast(apiError(err).message, "error");
    } finally {
      setBusy(null);
    }
  };

  const extract = async (): Promise<void> => {
    if (mode === "customer") await run(`/export/customers/${value}?format=xlsx`, "extract");
    else if (mode === "lead") await run(`/export/leads/${value}?format=xlsx`, "extract");
    else await run(`/export/leads?stage=${value}&format=xlsx`, "extract");
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl font-semibold">Reports</h1>
        <p className="muted text-sm">Export to Excel, CSV, or PDF.</p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <div key={r.key} className="card p-4">
            <div className="mb-1 text-sm font-medium">{r.title}</div>
            <div className="muted mb-4 text-xs">{r.desc}</div>
            <div className="flex gap-2">
              <button className="btn btn-primary" disabled={busy === r.key + "-xlsx"} onClick={() => run(`/reports/${r.key}?format=xlsx`, r.key + "-xlsx")}>
                {busy === r.key + "-xlsx" ? <Spinner /> : <Sheet className="h-4 w-4" />} Excel
              </button>
              <button className="btn" disabled={busy === r.key + "-csv"} onClick={() => run(`/reports/${r.key}?format=csv`, r.key + "-csv")}>CSV</button>
              <button className="btn" disabled={busy === r.key + "-pdf"} onClick={() => run(`/reports/${r.key}?format=pdf`, r.key + "-pdf")}>
                <FileText className="h-4 w-4" /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="mb-1 text-sm font-medium">Targeted extraction</div>
        <div className="muted mb-4 text-xs">Pull a single customer, a single lead, or a whole stage into Excel with full detail.</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select value={mode} onChange={(e) => { setMode(e.target.value as typeof mode); setValue(""); }}>
            <option value="stage">By stage</option>
            <option value="customer">By customer id</option>
            <option value="lead">By lead id</option>
          </Select>
          {mode === "stage" ? (
            <Select value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="">All stages</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="QUOTE_SHARED">Quote Shared</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </Select>
          ) : (
            <Input placeholder={mode === "customer" ? "Customer id" : "Lead id"} value={value} onChange={(e) => setValue(e.target.value)} />
          )}
          <button className="btn btn-primary justify-center" disabled={busy === "extract" || (mode !== "stage" && !value)} onClick={extract}>
            {busy === "extract" ? <Spinner /> : <Sheet className="h-4 w-4" />} Export to Excel
          </button>
        </div>
      </div>
    </div>
  );
};
