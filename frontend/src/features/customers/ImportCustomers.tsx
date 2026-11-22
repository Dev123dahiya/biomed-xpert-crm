import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import { apiError } from "../../lib/api";
import { parseCsv, toCsv } from "../../lib/csv";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useCustomerMutations } from "../../hooks/useCustomers";

// Spreadsheet column headers we recognise, mapped to customer fields.
const COLUMNS: Record<string, string> = {
  name: "customerName", customer: "customerName", customername: "customerName", doctor: "customerName", "doctor name": "customerName", "customer name": "customerName",
  company: "company", hospital: "company", clinic: "company", organisation: "company", organization: "company",
  contact: "contactPerson", "contact person": "contactPerson", contactperson: "contactPerson",
  phone: "phone", mobile: "phone", "phone number": "phone", "mobile number": "phone",
  email: "email", "email address": "email",
  gstin: "gstin", gst: "gstin", "gst number": "gstin",
  address: "addressLine1", "address line 1": "addressLine1", addressline1: "addressLine1", "address line 2": "addressLine2", addressline2: "addressLine2",
  city: "city", state: "state", pin: "pinCode", pincode: "pinCode", "pin code": "pinCode", postcode: "pinCode",
  balance: "balance", outstanding: "balance",
};

const TEMPLATE = toCsv([
  ["Name", "Company", "Contact person", "Phone", "Email", "GSTIN", "Address", "City", "State", "PIN code", "Balance"],
  ["Dr. Ananya Rao", "Sunrise Hospital", "Ravi Kumar", "9876543210", "purchase@sunrise.in", "", "12 MG Road", "Bengaluru", "Karnataka", "560001", "0"],
]);

export const ImportCustomers = ({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element => {
  const { importMany } = useCustomerMutations();
  const { toast } = useToast();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [unmapped, setUnmapped] = useState<string[]>([]);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);

  const reset = () => { setRows([]); setFileName(""); setUnmapped([]); setResult(null); };

  const onFile = async (file?: File) => {
    if (!file) return;
    reset();
    setFileName(file.name);
    const grid = parseCsv(await file.text());
    if (grid.length < 2) return toast("That file has no data rows", "error");
    const headers = grid[0].map((h) => h.trim().toLowerCase());
    const keys = headers.map((h) => COLUMNS[h] ?? null);
    setUnmapped(grid[0].filter((_, i) => !keys[i]));
    if (!keys.includes("customerName")) return toast("Add a Name column so each row has a customer name", "error");
    const parsed = grid.slice(1).map((r) => {
      const o: Record<string, string> = {};
      keys.forEach((k, i) => { if (k && r[i]?.trim()) o[k] = r[i].trim(); });
      if (o.gstin) o.gstin = o.gstin.toUpperCase();
      if (o.phone) o.phone = o.phone.replace(/\s+/g, " ");
      return o;
    }).filter((o) => o.customerName);
    setRows(parsed);
  };

  const run = async () => {
    try {
      const res = await importMany.mutateAsync(rows.map((r) => ({ ...r, balance: r.balance ? Number(r.balance.replace(/[,₹\s]/g, "")) : undefined })));
      setResult(res);
      toast(`${res.created} customer${res.created === 1 ? "" : "s"} imported`);
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} title="Import customers" description="Upload a CSV saved from Excel or Google Sheets. Duplicates are skipped." onClose={() => { reset(); onClose(); }} width={600}>
      {result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="inset p-3"><div className="condensed text-3xl font-semibold" style={{ color: "var(--success)" }}>{result.created}</div><div className="muted text-xs">Added</div></div>
            <div className="inset p-3"><div className="condensed text-3xl font-semibold">{result.skipped}</div><div className="muted text-xs">Already existed</div></div>
            <div className="inset p-3"><div className="condensed text-3xl font-semibold" style={{ color: result.errors.length ? "var(--danger)" : undefined }}>{result.errors.length}</div><div className="muted text-xs">Had problems</div></div>
          </div>
          {result.errors.length > 0 && (
            <div className="scroll-thin max-h-48 overflow-y-auto rounded-lg border p-3 text-xs divider">
              {result.errors.map((e) => <div key={e.row} className="py-0.5"><b>Row {e.row + 1}:</b> <span className="text-2">{e.message}</span></div>)}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button className="btn" onClick={reset}>Import another file</button>
            <button className="btn btn-primary" onClick={() => { reset(); onClose(); }}>Done</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="inset flex cursor-pointer flex-col items-center gap-2 border-dashed px-4 py-8 text-center hover:border-[var(--muted)]">
            <FileSpreadsheet className="muted h-7 w-7" />
            <span className="text-sm font-medium">{fileName || "Choose a CSV file"}</span>
            <span className="muted text-xs">Columns like Name, Hospital, Phone, Email, GSTIN, City, State, PIN code</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {rows.length > 0 && (
            <>
              <div className="text-sm">
                <b>{rows.length}</b> customers ready to import.
                {unmapped.length > 0 && <span className="muted"> Ignored columns: {unmapped.join(", ")}.</span>}
              </div>
              <div className="scroll-thin max-h-56 overflow-auto rounded-lg border divider">
                <table className="table text-xs">
                  <thead><tr><th className="th">Name</th><th className="th">Company</th><th className="th">Phone</th><th className="th">City</th></tr></thead>
                  <tbody>
                    {rows.slice(0, 8).map((r, i) => (
                      <tr key={i}><td className="td">{r.customerName}</td><td className="td">{r.company}</td><td className="td">{r.phone}</td><td className="td">{r.city}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 8 && <p className="muted text-xs">Showing 8 of {rows.length}.</p>}
            </>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}><Download className="h-3.5 w-3.5" /> Download template</button>
            <button className="btn btn-primary" disabled={!rows.length || importMany.isPending} onClick={run}>
              {importMany.isPending ? <Spinner /> : <Upload className="h-4 w-4" />} Import {rows.length || ""} customers
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
