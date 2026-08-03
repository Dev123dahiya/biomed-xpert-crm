import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { apiError } from "../../lib/api";
import { inr } from "../../lib/format";
import { FieldError, Input, Select, Textarea } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useCustomers } from "../../hooks/useCustomers";
import { useLeadSources, searchProducts } from "../../hooks/useMeta";
import { useLeadMutations } from "../../hooks/useLeads";
import type { LeadStatus, Priority, Product } from "../../types";

interface Line { productId: string; label: string; quantity: number; price: number }
interface FormValues {
  customerId: string;
  sourceId: string;
  sourceOther?: string;
  status: LeadStatus;
  approxValue: number;
  priority: Priority;
  notes?: string;
  followUpDate?: string;
  followUpTime?: string;
}

const MAX = 15;

export const LeadForm = ({ onDone }: { onDone: () => void }): JSX.Element => {
  const { data: customers } = useCustomers({ pageSize: 100 });
  const { data: sources } = useLeadSources();
  const { create } = useLeadMutations();
  const { toast } = useToast();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { status: "NEW", priority: "MEDIUM", approxValue: 0 },
  });

  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  const sourceId = watch("sourceId");
  const status = watch("status");
  const othersId = useMemo(() => sources?.find((s) => s.name.toLowerCase() === "others")?.id, [sources]);
  const showOther = sourceId && sourceId === othersId;
  const followUpEnabled = status !== "NEW";
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  const runSearch = async (q: string): Promise<void> => {
    setQuery(q);
    if (q.trim().length < 1) { setResults([]); return; }
    try {
      setResults(await searchProducts(q));
    } catch {
      setResults([]);
    }
  };

  const addLine = (p: Product): void => {
    if (lines.length >= MAX) { toast(`A lead holds at most ${MAX} products`, "error"); return; }
    setLines((prev) => [...prev, { productId: p.id, label: `${p.name} ${p.make} ${p.model}`, quantity: 1, price: p.unitPrice }]);
    setQuery("");
    setResults([]);
  };

  const submit = handleSubmit(async (values) => {
    const followUp = followUpEnabled && values.followUpDate
      ? { dueAt: new Date(`${values.followUpDate}T${values.followUpTime || "09:00"}`).toISOString() }
      : undefined;
    const body = {
      customerId: values.customerId,
      sourceId: values.sourceId,
      sourceOther: showOther ? values.sourceOther : undefined,
      status: values.status,
      approxValue: Number(values.approxValue ?? 0),
      priority: values.priority,
      notes: values.notes,
      products: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price })),
      followUp,
    };
    try {
      await create.mutateAsync(body);
      toast("Lead created");
      onDone();
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  });

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Customer</label>
        <Select className="mt-1" {...register("customerId", { required: "Select a customer" })}>
          <option value="">Select customer</option>
          {customers?.items.map((c) => (
            <option key={c.id} value={c.id}>{c.customerName}{c.company ? ` \u00b7 ${c.company}` : ""}</option>
          ))}
        </Select>
        <FieldError message={errors.customerId?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Source</label>
          <Select className="mt-1" {...register("sourceId", { required: "Select a source" })}>
            <option value="">Select source</option>
            {sources?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div>
          <label className="label">Status</label>
          <Select className="mt-1" {...register("status")}>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="QUOTE_SHARED">Quote Shared</option>
          </Select>
        </div>
      </div>

      {showOther && (
        <div>
          <label className="label">Describe the source</label>
          <Input className="mt-1" {...register("sourceOther", { required: "Required for Others" })} />
          <FieldError message={errors.sourceOther?.message} />
        </div>
      )}

      <div>
        <label className="label">Approximate value</label>
        <Input className="mono mt-1" type="number" step="1" {...register("approxValue")} />
      </div>

      <div className="card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="label">Products of interest</span>
          <span className="muted text-xs">{lines.length} / {MAX}</span>
        </div>
        {lines.map((l, i) => (
          <div key={i} className="mb-2 grid grid-cols-12 items-center gap-2">
            <span className="col-span-6 truncate text-sm">{l.label}</span>
            <Input
              className="col-span-2 mono" type="number" min={1} value={l.quantity}
              onChange={(e) => setLines((prev) => prev.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))}
            />
            <Input
              className="col-span-3 mono" type="number" value={l.price}
              onChange={(e) => setLines((prev) => prev.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))}
            />
            <button type="button" className="btn btn-ghost col-span-1 justify-center" onClick={() => setLines((prev) => prev.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="relative">
          <Input className="mt-1" placeholder="Search product to add" value={query} onChange={(e) => runSearch(e.target.value)} />
          {results.length > 0 && (
            <div className="card absolute z-10 mt-1 max-h-48 w-full overflow-auto p-1">
              {results.map((p) => (
                <button key={p.id} type="button" className="side-link w-full text-left" onClick={() => addLine(p)}>
                  <Plus className="h-4 w-4" /> {p.name} {p.make} {p.model} {"\u00b7"} {inr(p.unitPrice)}
                </button>
              ))}
            </div>
          )}
        </div>
        {lines.length > 0 && <div className="muted mono mt-2 text-right text-sm">Total {inr(total)}</div>}
      </div>

      <div>
        <label className="label">Priority</label>
        <Select className="mt-1" {...register("priority")}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </Select>
      </div>
      <div>
        <label className="label">Notes</label>
        <Textarea className="mt-1" rows={2} {...register("notes")} />
      </div>

      <div className="grid grid-cols-2 gap-3" style={{ opacity: followUpEnabled ? 1 : 0.5 }}>
        <div><label className="label">Follow-up date</label><Input className="mt-1" type="date" disabled={!followUpEnabled} {...register("followUpDate")} /></div>
        <div><label className="label">Follow-up time</label><Input className="mt-1" type="time" disabled={!followUpEnabled} {...register("followUpTime")} /></div>
      </div>
      {!followUpEnabled && <p className="muted text-xs">Follow-ups become available from the Contacted stage.</p>}

      <div className="flex gap-2 pt-2">
        <button className="btn btn-primary flex-1 justify-center" disabled={create.isPending}>{create.isPending && <Spinner />} Save lead</button>
        <button type="button" className="btn flex-1 justify-center" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
};
