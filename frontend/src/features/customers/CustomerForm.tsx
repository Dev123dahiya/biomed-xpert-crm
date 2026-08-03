import { useForm } from "react-hook-form";
import { apiError } from "../../lib/api";
import { FieldError, Input } from "../../components/ui/Field";
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
  city?: string;
  state?: string;
  pinCode?: string;
  balance?: number;
}

export const CustomerForm = ({ existing, onDone }: { existing?: Customer; onDone: () => void }): JSX.Element => {
  const { create, update } = useCustomerMutations();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: existing
      ? {
          customerName: existing.customerName,
          contactPerson: existing.contactPerson ?? "",
          company: existing.company ?? "",
          gstin: existing.gstin ?? "",
          phone: existing.phone ?? "",
          email: existing.email ?? "",
          addressLine1: existing.addressLine1 ?? "",
          city: existing.city ?? "",
          state: existing.state ?? "",
          pinCode: existing.pinCode ?? "",
          balance: existing.balance,
        }
      : { balance: 0 },
  });

  const submit = handleSubmit(async (values) => {
    const body = { ...values, balance: Number(values.balance ?? 0) };
    try {
      if (existing) await update.mutateAsync({ id: existing.id, body });
      else await create.mutateAsync(body);
      toast(existing ? "Customer saved" : "Customer added");
      onDone();
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  });

  const busy = create.isPending || update.isPending;

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Customer / Doctor name</label>
        <Input className="mt-1" placeholder="Dr. ..." {...register("customerName", { required: "Name is required" })} />
        <FieldError message={errors.customerName?.message} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Contact person</label><Input className="mt-1" {...register("contactPerson")} /></div>
        <div><label className="label">Company</label><Input className="mt-1" {...register("company")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Phone</label><Input className="mt-1" {...register("phone")} /></div>
        <div><label className="label">Email</label><Input className="mt-1" type="email" {...register("email")} /></div>
      </div>
      <div><label className="label">GSTIN</label><Input className="mt-1" {...register("gstin")} /></div>
      <div><label className="label">Address</label><Input className="mt-1" {...register("addressLine1")} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">City</label><Input className="mt-1" {...register("city")} /></div>
        <div><label className="label">State</label><Input className="mt-1" {...register("state")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">PIN code</label><Input className="mt-1" {...register("pinCode")} /></div>
        <div><label className="label">Balance</label><Input className="mono mt-1" type="number" step="1" {...register("balance")} /></div>
      </div>
      <div className="flex gap-2 pt-2">
        <button className="btn btn-primary flex-1 justify-center" disabled={busy}>{busy && <Spinner />} {existing ? "Save customer" : "Add customer"}</button>
        <button type="button" className="btn flex-1 justify-center" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
};
