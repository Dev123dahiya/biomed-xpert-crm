import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiError } from "../../lib/api";
import { inr, toDateInput } from "../../lib/format";
import { Field, Input, MoneyInput, Textarea } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useLeadMutations } from "../../hooks/useLeads";
import { celebrate } from "../../lib/celebrate";
import type { LeadProductLine, LostDeal, WonDeal } from "../../types";

interface EquipLine { name: string; make: string; model: string; quantity: number; amount: number }

const LOST_REASONS = ["Price too high", "Went with a competitor", "Budget not approved", "Project postponed", "No response", "Specs did not match"];

export const WonForm = ({ leadId, onDone, existing, leadProducts, suggestedValue }: {
  leadId: string;
  onDone: () => void;
  existing?: WonDeal | null;
  leadProducts?: LeadProductLine[];
  suggestedValue?: number;
}): JSX.Element => {
  const { markWon, updateWon } = useLeadMutations(leadId);
  const { toast } = useToast();
  const [lines, setLines] = useState<EquipLine[]>(() =>
    existing
      ? existing.products.map((p) => ({ name: p.name, make: p.make ?? "", model: p.model ?? "", quantity: p.quantity, amount: p.amount }))
      : (leadProducts ?? []).map((p) => ({ name: p.name ?? "", make: p.make ?? "", model: p.model ?? "", quantity: p.quantity, amount: p.lineTotal })),
  );
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<{ finalValue: number | string; invoiceNumber?: string; closingDate?: string }>({
    defaultValues: {
      finalValue: existing?.finalValue ?? (suggestedValue || ""),
      invoiceNumber: existing?.invoiceNumber ?? "",
      closingDate: toDateInput(existing?.closingDate ?? new Date()),
    },
  });
  const linesSum = lines.reduce((s, l) => s + Number(l.amount || 0), 0);
  const busy = markWon.isPending || updateWon.isPending;

  const submit = handleSubmit(async (values) => {
    const body = {
      finalValue: Number(values.finalValue),
      invoiceNumber: values.invoiceNumber || undefined,
      closingDate: values.closingDate ? new Date(`${values.closingDate}T12:00`).toISOString() : undefined,
      products: lines.filter((l) => l.name.trim()).map((l) => ({ ...l, make: l.make || undefined, model: l.model || undefined })),
    };
    try {
      if (existing) await updateWon.mutateAsync(body);
      else {
        await markWon.mutateAsync(body);
        celebrate();
      }
      toast(existing ? "Won deal updated" : "Deal marked as won");
      onDone();
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  });

  const set = (i: number, patch: Partial<EquipLine>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Final order value" error={errors.finalValue?.message} hint={linesSum && !existing ? `Equipment lines add up to ${inr(linesSum)}.` : undefined} htmlFor="won-value">
        <div className="flex gap-2">
          <MoneyInput
            id="won-value"
            className="flex-1"
            aria-invalid={Boolean(errors.finalValue)}
            {...register("finalValue", { required: "Enter the final value", validate: (v) => Number(v) > 0 || "Must be more than zero" })}
          />
          {linesSum > 0 && (
            <button type="button" className="btn shrink-0" onClick={() => setValue("finalValue", linesSum, { shouldValidate: true })}>Use lines total</button>
          )}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Invoice number" optional htmlFor="won-invoice"><Input id="won-invoice" placeholder="BX/24-25/0142" {...register("invoiceNumber")} /></Field>
        <Field label="Order date" htmlFor="won-date"><Input id="won-date" type="date" {...register("closingDate")} /></Field>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="label mb-0">Equipment supplied</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLines((ls) => [...ls, { name: "", make: "", model: "", quantity: 1, amount: 0 }])}>
            <Plus className="h-3.5 w-3.5" /> Add line
          </button>
        </div>
        {lines.length === 0 ? (
          <p className="muted text-sm">No equipment lines. Add the items on the purchase order.</p>
        ) : (
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="inset grid grid-cols-6 gap-2 p-2.5">
                <Input className="col-span-6 h-9 sm:col-span-3" placeholder="Item" value={l.name} onChange={(e) => set(i, { name: e.target.value })} aria-label="Item name" />
                <Input className="col-span-3 h-9 sm:col-span-3" placeholder="Make" value={l.make} onChange={(e) => set(i, { make: e.target.value })} aria-label="Make" />
                <Input className="col-span-3 h-9 sm:col-span-2" placeholder="Model" value={l.model} onChange={(e) => set(i, { model: e.target.value })} aria-label="Model" />
                <Input className="num col-span-2 h-9 sm:col-span-1" type="number" min={1} value={l.quantity} onChange={(e) => set(i, { quantity: Math.max(1, Number(e.target.value) || 1) })} aria-label="Quantity" />
                <Input className="num col-span-3 h-9 sm:col-span-2" type="number" min={0} value={l.amount} onChange={(e) => set(i, { amount: Math.max(0, Number(e.target.value) || 0) })} aria-label="Amount" />
                <button type="button" className="btn btn-ghost btn-sm btn-icon col-span-1 h-9 w-full" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} aria-label="Remove line">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="btn btn-success w-full" disabled={busy}>{busy && <Spinner />} {existing ? "Save won deal" : "Mark as won"}</button>
    </form>
  );
};

export const LostForm = ({ leadId, onDone, existing }: { leadId: string; onDone: () => void; existing?: LostDeal | null }): JSX.Element => {
  const { markLost, updateLost } = useLeadMutations(leadId);
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<{ reason: string; competitor?: string; remarks?: string }>({
    defaultValues: { reason: existing?.reason ?? "", competitor: existing?.competitor ?? "", remarks: existing?.remarks ?? "" },
  });
  const reason = watch("reason");
  const busy = markLost.isPending || updateLost.isPending;

  const submit = handleSubmit(async (values) => {
    const body = { reason: values.reason.trim(), competitor: values.competitor || undefined, remarks: values.remarks || undefined };
    try {
      if (existing) await updateLost.mutateAsync(body);
      else await markLost.mutateAsync(body);
      toast(existing ? "Lost deal updated" : "Deal marked as lost");
      onDone();
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  });

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Why was it lost?" error={errors.reason?.message} htmlFor="lost-reason">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {LOST_REASONS.map((r) => (
            <button key={r} type="button" className="chip" aria-pressed={reason === r} onClick={() => setValue("reason", r, { shouldValidate: true })}>
              {r}
            </button>
          ))}
        </div>
        <Input id="lost-reason" placeholder="Or type a reason" aria-invalid={Boolean(errors.reason)} {...register("reason", { required: "Add a reason so the team can learn from it", validate: (v) => v.trim().length > 0 || "Add a reason" })} />
      </Field>
      <Field label="Competitor chosen" optional htmlFor="lost-comp"><Input id="lost-comp" placeholder="Brand or dealer" {...register("competitor")} /></Field>
      <Field label="Remarks" optional htmlFor="lost-remarks"><Textarea id="lost-remarks" rows={3} {...register("remarks")} /></Field>
      <button className="btn btn-danger w-full" disabled={busy}>{busy && <Spinner />} {existing ? "Save lost deal" : "Mark as lost"}</button>
    </form>
  );
};
