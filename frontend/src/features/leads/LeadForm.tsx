import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "../../auth/AuthContext";
import { apiError } from "../../lib/api";
import { inr } from "../../lib/format";
import { Combobox, type ComboOption } from "../../components/ui/Combobox";
import { customerOption, searchCustomers } from "../../components/ui/pickers";
import { Field, Input, MoneyInput, Select, Textarea } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useLeadSources, useTeam } from "../../hooks/useMeta";
import { useLeadMutations } from "../../hooks/useLeads";
import { CustomerForm } from "../customers/CustomerForm";
import { linesTotal, ProductLinesEditor, type Line } from "./ProductLines";
import type { LeadDetail, LeadStatus, Priority } from "../../types";

interface FormValues {
  customer: ComboOption | null;
  sourceId: string;
  sourceOther?: string;
  status: LeadStatus;
  approxValue: number | string;
  priority: Priority;
  ownerId: string;
  notes?: string;
  followUpDate?: string;
  followUpTime?: string;
  followUpNote?: string;
}

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "LOW", label: "Low" },
  { id: "MEDIUM", label: "Medium" },
  { id: "HIGH", label: "High" },
];

export const LeadForm = ({ onDone, initialCustomer }: { onDone: (id?: string) => void; initialCustomer?: ComboOption }): JSX.Element => {
  const { user } = useAuth();
  const { data: sources } = useLeadSources();
  const { data: team } = useTeam();
  const { create } = useLeadMutations();
  const { toast } = useToast();
  const [lines, setLines] = useState<Line[]>([]);
  const [newCustomer, setNewCustomer] = useState(false);

  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      customer: initialCustomer ?? null,
      status: "NEW",
      priority: "MEDIUM",
      approxValue: "",
      ownerId: user?.id ?? "",
      followUpTime: "10:00",
    },
  });

  const sourceId = watch("sourceId");
  const status = watch("status");
  const approx = watch("approxValue");
  const othersId = useMemo(() => sources?.find((s) => s.name.toLowerCase() === "others")?.id, [sources]);
  const showOther = Boolean(sourceId) && sourceId === othersId;
  const followUpEnabled = status !== "NEW";
  const total = linesTotal(lines);

  const submit = handleSubmit(async (values) => {
    const followUp =
      followUpEnabled && values.followUpDate
        ? { dueAt: new Date(`${values.followUpDate}T${values.followUpTime || "10:00"}`).toISOString(), note: values.followUpNote || undefined }
        : undefined;
    const approxValue = values.approxValue === "" ? total : Number(values.approxValue);
    try {
      const lead: LeadDetail = await create.mutateAsync({
        customerId: values.customer!.id,
        sourceId: values.sourceId,
        sourceOther: showOther ? values.sourceOther : undefined,
        status: values.status,
        approxValue,
        priority: values.priority,
        ownerId: values.ownerId || undefined,
        notes: values.notes || undefined,
        products: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price })),
        followUp,
      });
      toast("Lead created");
      onDone(lead.id);
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  });

  return (
    <>
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field label="Customer" error={errors.customer?.message} htmlFor="lead-customer">
        <Controller
          name="customer"
          control={control}
          rules={{ validate: (v) => (v ? true : "Choose who this lead is for") }}
          render={({ field }) => (
            <Combobox
              id="lead-customer"
              value={field.value}
              onChange={field.onChange}
              search={searchCustomers}
              placeholder="Search doctor, hospital, phone or GSTIN"
              invalid={Boolean(errors.customer)}
              footer={(close) => (
                <button type="button" className="menu-item" onClick={() => { close(); setNewCustomer(true); }}>
                  <UserPlus className="h-4 w-4" /> Add a new customer
                </button>
              )}
            />
          )}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Source" error={errors.sourceId?.message} htmlFor="lead-source">
          <Select id="lead-source" aria-invalid={Boolean(errors.sourceId)} {...register("sourceId", { required: "Choose where this lead came from" })}>
            <option value="">Choose source</option>
            {sources?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="Stage" htmlFor="lead-status">
          <Select id="lead-status" {...register("status")}>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="QUOTE_SHARED">Quote shared</option>
          </Select>
        </Field>
      </div>

      {showOther && (
        <Field label="Describe the source" error={errors.sourceOther?.message} htmlFor="lead-source-other">
          <Input id="lead-source-other" placeholder="For example, CME at AIIMS" {...register("sourceOther", { required: "Describe the source when choosing Others" })} />
        </Field>
      )}

      <div>
        <div className="label">Equipment of interest</div>
        <ProductLinesEditor lines={lines} onChange={setLines} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Approximate deal value"
          htmlFor="lead-value"
          hint={lines.length > 0 && approx === "" ? `Left empty, it uses the equipment total of ${inr(total)}.` : undefined}
        >
          <MoneyInput id="lead-value" placeholder={lines.length ? String(total) : "0"} {...register("approxValue")} />
        </Field>
        <Field label="Owner" htmlFor="lead-owner">
          <Select id="lead-owner" {...register("ownerId")}>
            {team?.map((m) => <option key={m.id} value={m.id}>{m.name}{m.id === user?.id ? " (you)" : ""}</option>)}
          </Select>
        </Field>
      </div>

      <div>
        <div className="label">Priority</div>
        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <div className="seg" role="radiogroup" aria-label="Priority">
              {PRIORITIES.map((p) => (
                <button key={p.id} type="button" role="radio" aria-checked={field.value === p.id} aria-pressed={field.value === p.id} onClick={() => field.onChange(p.id)} className="min-w-[72px]">
                  {p.label}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <Field label="Notes" optional htmlFor="lead-notes">
        <Textarea id="lead-notes" rows={3} placeholder="Requirement, budget, decision maker, competing brands" {...register("notes")} />
      </Field>

      <fieldset className="inset p-4" disabled={!followUpEnabled}>
        <legend className="sr-only">First follow-up</legend>
        <div className="mb-3 text-sm font-semibold">First follow-up</div>
        {followUpEnabled ? (
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <Input type="date" aria-label="Follow-up date" {...register("followUpDate")} />
            <Input type="time" aria-label="Follow-up time" {...register("followUpTime")} />
            <Input className="sm:col-span-2" placeholder="What's the follow-up about?" aria-label="Follow-up note" {...register("followUpNote")} />
          </div>
        ) : (
          <p className="muted text-sm">Follow-ups open up once the lead is past New. Change the stage above to schedule one.</p>
        )}
      </fieldset>

      <div className="sticky bottom-0 -mx-5 -mb-5 flex gap-2 border-t px-5 py-4 divider" style={{ background: "var(--surface)" }}>
        <button className="btn btn-primary flex-1" disabled={create.isPending}>{create.isPending && <Spinner />} Create lead</button>
        <button type="button" className="btn" onClick={() => onDone()}>Cancel</button>
      </div>
    </form>

      <Modal open={newCustomer} title="New customer" onClose={() => setNewCustomer(false)} width={560}>
        <CustomerForm
          onDone={(_id, c) => {
            setNewCustomer(false);
            if (c) setValue("customer", customerOption(c), { shouldValidate: true });
          }}
        />
      </Modal>
    </>
  );
};
