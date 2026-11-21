import { BarChart3, CalendarRange, FileSpreadsheet, FileText, Receipt, Sheet, Target, Users } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Segmented } from "../../components/ui/Segmented";
import { Combobox, type ComboOption } from "../../components/ui/Combobox";
import { Field, Input, Select } from "../../components/ui/Field";
import { PageHeader } from "../../components/ui/PageHeader";
import { searchCustomers, searchLeads } from "../../components/ui/pickers";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { apiError } from "../../lib/api";
import { downloadFile } from "../../lib/download";
import { BOARD_ORDER, stageLabel } from "../../lib/stages";
import { toDateInput } from "../../lib/format";

type Format = "xlsx" | "csv" | "pdf";

const REPORTS = [
  { key: "revenue", title: "Revenue", desc: "Won revenue grouped by month or by customer.", icon: Receipt, dated: true, extra: "groupBy" },
  { key: "leads", title: "Leads", desc: "Every lead with stage, source, owner and value.", icon: BarChart3, dated: true },
  { key: "customers", title: "Customers", desc: "Customer list with GSTIN, total business and lead counts.", icon: Users, dated: true },
  { key: "sales", title: "Sales by teammate", desc: "Won deals and revenue for each salesperson.", icon: Target, dated: true },
  { key: "monthly", title: "Monthly summary", desc: "Leads, wins and revenue for each month of a year.", icon: CalendarRange, dated: false, extra: "year" },
] as const;

const PRESETS = [
  { id: "all", label: "All time" },
  { id: "month", label: "This month" },
  { id: "fy", label: "This financial year" },
  { id: "custom", label: "Custom dates" },
];

const fyStart = () => {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(y, 3, 1);
};

const ReportsPage = (): JSX.Element => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [preset, setPreset] = useState("all");
  const [from, setFrom] = useState(toDateInput(fyStart()));
  const [to, setTo] = useState(toDateInput(new Date()));
  const [groupBy, setGroupBy] = useState("month");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [mode, setMode] = useState<"stage" | "customer" | "lead">("stage");
  const [stage, setStage] = useState("");
  const [picked, setPicked] = useState<ComboOption | null>(null);

  const range = (): string => {
    if (preset === "all") return "";
    const now = new Date();
    const f = preset === "month" ? new Date(now.getFullYear(), now.getMonth(), 1) : preset === "fy" ? fyStart() : new Date(`${from}T00:00`);
    const t = preset === "custom" ? new Date(`${to}T23:59:59`) : now;
    return `&from=${encodeURIComponent(f.toISOString())}&to=${encodeURIComponent(t.toISOString())}`;
  };

  const run = async (path: string, tag: string) => {
    setBusy(tag);
    try {
      await downloadFile(path);
      toast("Report downloaded");
    } catch (err) {
      toast(apiError(err).message, "error");
    } finally {
      setBusy(null);
    }
  };

  const reportPath = (key: string, format: Format) => {
    let p = `/reports/${key}?format=${format}`;
    if (key === "monthly") p += `&year=${year}`;
    else p += range();
    if (key === "revenue") p += `&groupBy=${groupBy}`;
    return p;
  };

  const extract = () => {
    if (mode === "customer" && picked) return run(`/export/customers/${picked.id}?format=xlsx`, "extract");
    if (mode === "lead" && picked) return run(`/export/leads/${picked.id}?format=xlsx`, "extract");
    if (mode === "stage") return run(`/export/leads?format=xlsx${stage ? `&stage=${stage}` : ""}${range()}`, "extract");
  };

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <div>
      <PageHeader title="Reports" subtitle="Download for accounts, management reviews or GST filing. Excel keeps every column; PDF is ready to print." />

      <section className="panel mb-5 flex flex-wrap items-end gap-4 p-4 sm:p-5">
        <div>
          <div className="label">Date range</div>
          <Segmented label="Date range" className="flex-wrap" value={preset} onChange={setPreset} options={PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
        </div>
        <AnimatePresence initial={false}>
          {preset === "custom" && (
            <motion.div className="flex flex-wrap items-end gap-4" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
              <Field label="From" htmlFor="r-from"><Input id="r-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9" /></Field>
              <Field label="To" htmlFor="r-to"><Input id="r-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-9" /></Field>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="muted basis-full text-xs">The range applies to every report except the monthly summary, which covers a calendar year.</p>
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => (
          <motion.section
            key={r.key}
            className="panel flex flex-col p-5 transition-[border-color,box-shadow] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: REPORTS.indexOf(r) * 0.05, duration: 0.35 }}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]" style={{ background: "var(--primary-soft)", color: "var(--primary-text)" }}>
                <r.icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="section-title">{r.title}</h2>
                <p className="muted mt-0.5 text-sm">{r.desc}</p>
              </div>
            </div>
            {"extra" in r && r.extra === "groupBy" && (
              <Segmented label="Group revenue by" className="mt-4 self-start" value={groupBy} onChange={setGroupBy} options={[{ value: "month", label: "By month" }, { value: "customer", label: "By customer" }]} />
            )}
            {"extra" in r && r.extra === "year" && (
              <Select className="mt-4 h-9 w-32" value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </Select>
            )}
            <div className="mt-auto flex gap-2 pt-5">
              {(["xlsx", "csv", "pdf"] as Format[]).map((f) => {
                const tag = `${r.key}-${f}`;
                return (
                  <button key={f} className={f === "xlsx" ? "btn btn-primary btn-sm" : "btn btn-sm"} disabled={busy === tag} onClick={() => run(reportPath(r.key, f), tag)}>
                    {busy === tag ? <Spinner /> : f === "xlsx" ? <Sheet className="h-3.5 w-3.5" /> : f === "pdf" ? <FileText className="h-3.5 w-3.5" /> : null}
                    {f === "xlsx" ? "Excel" : f.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </motion.section>
        ))}
      </div>

      <section className="panel p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]" style={{ background: "var(--surface-3)" }}>
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div>
            <h2 className="section-title">Detailed extract</h2>
            <p className="muted mt-0.5 text-sm">Everything about one customer, one lead, or a whole stage, in a multi-sheet Excel file.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[180px_1fr_auto]">
          <Select value={mode} onChange={(e) => { setMode(e.target.value as typeof mode); setPicked(null); }} aria-label="Extract by">
            <option value="stage">A pipeline stage</option>
            <option value="customer">One customer</option>
            <option value="lead">One lead</option>
          </Select>
          {mode === "stage" ? (
            <Select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Stage">
              <option value="">Every stage</option>
              {BOARD_ORDER.map((s) => <option key={s} value={s}>{stageLabel(s)}</option>)}
            </Select>
          ) : (
            <Combobox
              key={mode}
              value={picked}
              onChange={setPicked}
              search={mode === "customer" ? searchCustomers : searchLeads}
              placeholder={mode === "customer" ? "Search for a customer" : "Search for a lead by customer"}
            />
          )}
          <button className="btn btn-primary" disabled={busy === "extract" || (mode !== "stage" && !picked)} onClick={extract}>
            {busy === "extract" ? <Spinner /> : <Sheet className="h-4 w-4" />} Download Excel
          </button>
        </div>
      </section>
    </div>
  );
};

export default ReportsPage;
