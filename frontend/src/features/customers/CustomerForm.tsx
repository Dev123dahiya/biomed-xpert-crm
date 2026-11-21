import { useForm } from "react-hook-form";
import { apiError } from "../../lib/api";
import { Field, Input, MoneyInput } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useCustomerMutations } from "../../hooks/useCustomers";
import type { Customer } from "../../types";

interface FormValues {
  customerName: string;
  contactPerson?: string;
  company?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  balance?: number | string;
}

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const CustomerForm = ({ existing, onDone }: { existing?: Customer; onDone: (id?: string, customer?: Customer) => void }): JSX.Element => {
  const { create, update } = useCustomerMutations();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: existing
      ? {
          customerName: existing.customerName,
          contactPerson: existing.contactPerson ?? "",
          company: existing.company ?? "",
          gstin: existing.gstin ?? "",
          phone: existing.phone ?? "",
          email: existing.email ?? "",
          addressLine1: existing.addressLine1 ?? "",
          addressLine2: existing.addressLine2 ?? "",
          city: existing.city ?? "",
          state: existing.state ?? "",
          pinCode: existing.pinCode ?? "",
          balance: existing.balance,
        }
      : { balance: "" },
  });

  const submit = handleSubmit(async (values) => {
    const body = { ...values, gstin: values.gstin?.toUpperCase().trim(), balance: Number(values.balance || 0) };
    try {
      const saved = existing ? await update.mutateAsync({ id: existing.id, body }) : await create.mutateAsync(body);
      toast(existing ? "Customer saved" : "Customer added");
      onDone(saved.id, saved);
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  });

  const busy = create.isPending || update.isPending;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Doctor or customer name" error={errors.customerName?.message} htmlFor="c-name">
        <Input id="c-name" placeholder="Dr. Ananya Rao" aria-invalid={Boolean(errors.customerName)} {...register("customerName", { required: "Enter a name" })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hospital or company" optional htmlFor="c-company"><Input id="c-company" placeholder="Sunrise Multispeciality Hospital" {...register("company")} /></Field>
        <Field label="Contact person" optional htmlFor="c-contact"><Input id="c-contact" placeholder="Purchase manager" {...register("contactPerson")} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" optional htmlFor="c-phone"><Input id="c-phone" type="tel" inputMode="tel" placeholder="98765 43210" {...register("phone")} /></Field>
        <Field label="Email" optional error={errors.email?.message} htmlFor="c-email">
          <Input id="c-email" type="email" aria-invalid={Boolean(errors.email)} {...register("email", { pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" } })} />
        </Field>
      </div>
      <Field label="GSTIN" optional error={errors.gstin?.message} htmlFor="c-gstin" hint="15 characters, for example 07AABCS1429B1Z5">
        <Input
          id="c-gstin"
          className="num uppercase"
          maxLength={15}
          aria-invalid={Boolean(errors.gstin)}
          {...register("gstin", { validate: (v) => !v || GSTIN.test(v.toUpperCase().trim()) || "That GSTIN doesn't look right. It should be 15 characters." })}
        />
      </Field>
      <Field label="Address" optional htmlFor="c-addr1">
        <Input id="c-addr1" placeholder="Building, street" {...register("addressLine1")} />
        <Input className="mt-2" placeholder="Area, landmark" aria-label="Address line 2" {...register("addressLine2")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" optional htmlFor="c-city"><Input id="c-city" {...register("city")} /></Field>
        <Field label="State" optional htmlFor="c-state">
          <Input id="c-state" list="in-states" {...register("state")} />
          <datalist id="in-states">{STATES.map((s) => <option key={s} value={s} />)}</datalist>
        </Field>
        <Field label="PIN code" optional error={errors.pinCode?.message} htmlFor="c-pin">
          <Input id="c-pin" inputMode="numeric" maxLength={6} className="num" aria-invalid={Boolean(errors.pinCode)} {...register("pinCode", { pattern: { value: /^\d{6}$/, message: "6 digits" } })} />
        </Field>
      </div>
      <Field label="Outstanding balance" optional htmlFor="c-bal" hint="Amount the customer still owes. Total business is calculated from won deals.">
        <MoneyInput id="c-bal" {...register("balance")} />
      </Field>
      <div className="flex gap-2 pt-1">
        <button className="btn btn-primary flex-1" disabled={busy}>{busy && <Spinner />} {existing ? "Save customer" : "Add customer"}</button>
        <button type="button" className="btn" onClick={() => onDone()}>Cancel</button>
      </div>
    </form>
  );
};
