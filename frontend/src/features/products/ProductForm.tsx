import { useForm } from "react-hook-form";
import { apiError } from "../../lib/api";
import { FieldError, Input } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useProductMutations } from "../../hooks/useProducts";
import type { Product } from "../../types";

interface FormValues { name: string; make: string; model: string; category?: string; unitPrice: number }

export const ProductForm = ({ existing, onDone }: { existing?: Product; onDone: () => void }): JSX.Element => {
  const { create, update } = useProductMutations();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: existing ? { name: existing.name, make: existing.make, model: existing.model, category: existing.category ?? "", unitPrice: existing.unitPrice } : { unitPrice: 0 },
  });

  const submit = handleSubmit(async (values) => {
    const body = { ...values, unitPrice: Number(values.unitPrice) };
    try {
      if (existing) await update.mutateAsync({ id: existing.id, body });
      else await create.mutateAsync(body);
      toast(existing ? "Product saved" : "Product added");
      onDone();
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  });

  const busy = create.isPending || update.isPending;
  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Product name</label>
        <Input className="mt-1" {...register("name", { required: "Name is required" })} />
        <FieldError message={errors.name?.message} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Make</label><Input className="mt-1" {...register("make", { required: true })} /></div>
        <div><label className="label">Model</label><Input className="mt-1" {...register("model", { required: true })} /></div>
      </div>
      <div><label className="label">Category</label><Input className="mt-1" {...register("category")} /></div>
      <div><label className="label">Unit price</label><Input className="mono mt-1" type="number" step="1" {...register("unitPrice", { required: true })} /></div>
      <div className="flex gap-2 pt-2">
        <button className="btn btn-primary flex-1 justify-center" disabled={busy}>{busy && <Spinner />} {existing ? "Save product" : "Add product"}</button>
        <button type="button" className="btn flex-1 justify-center" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
};
